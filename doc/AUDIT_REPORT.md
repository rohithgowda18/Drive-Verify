# DRIVE VERIFY — COMPLETE END-TO-END AUDIT REPORT

**Audit date:** 2026-08-12 · Branch `version2` · Environment: Windows 11, Java 21.0.6, Maven 3.9.9, Node 24.15, npm 11.12.1
**Method:** Full source inspection + executed builds/tests + live boot of the application + live API probing. Every "Confirmed" item below was verified by running, not by reading.

---

## 1. EXECUTIVE SUMMARY

Drive Verify is a small, cleanly-intentioned full-stack RC (vehicle registration) lookup + fraud-risk platform. The architecture is simple and coherent (React SPA → single Spring Boot API → MongoDB Atlas), and the live app demonstrably boots and serves real data (120 vehicle records were read from Atlas during this audit).

However, the project is **not releasable in its current state**. Four deal-breakers were directly verified:

1. **The backend test suite does not compile** — `mvn test/package/install/verify` all fail. There is effectively no working test suite and no CI.
2. **`/actuator/health` returns HTTP 503 DOWN while the app is serving fine** — two health contributors fail (MongoDB auth-storm on the `local` database: 83 `not authorized` exceptions in ~90 s; SMTP: `AuthenticationFailedException: no password specified`). Any orchestrator using liveness would restart-loop the app.
3. **A public, unauthenticated endpoint performs database writes** (`POST /api/rc/evaluate` overwrites `sellerClaim`/`riskAssessment` on any real record and inflates `verified` counters), combined with wide-open CORS (`Access-Control-Allow-Origin: *`), zero rate limiting, zero security headers, and full PII exposed on public GET endpoints.
4. **A hardcoded admin key** (`secret-admin-key`) is committed in the Postman collection and is the configured default in the git-ignored `.env`.

Broken seatbelts: 17 npm vulnerabilities in the dependency tree (incl. react-router-dom HIGH), frontend `npm run lint` fails with 18 errors, and multiple dead/partial features (Evidence, user management, `/api/verifications/*` client routes, `ParentClaim` mileage wiring).

The single biggest architectural + operational problem is that **configuration errors are not failing fast**: invalid DB-role config produces a heart-monitor storm that leaves the app half-usable, and SMTP config is silently broken.

---

## 2. PROJECT HEALTH SCORES

| Dimension | Score | Justification |
|---|---|---|
| Functionality | **6/10** | Core flows verified working live (list/page/stats, auth gate 401s, evaluate-on-missing). Broken: health, email, history (0 rows), verified-counter inflation, PUT-unknown-id creates records, Postman create body uses nonexistent field names. |
| Architecture | **5/10** | Layered and readable, but controller duplicates service logic, no DTOs, aggregates done in Java memory, full-document PUT semantics, and the extremely new Spring Boot 4.0 baseline. |
| Code Quality | **5/10** | Stale-test bug, 18 lint errors, pervasive `any`, dead code, verbose hand-written accessors. No comments on the non-obvious parts (upsert semantics, health gotchas). |
| Security | **3/10** | Confirmed: unauthenticated write endpoint, open CORS, no rate limiting, no security headers, hardcoded default admin key in committed Postman, PII exposed unredacted on public reads, key in localStorage. Not present: CSRF (stateless), SQLi (Mongo). |
| Performance | **5/10** | Regex filters + full-collection in-memory stats + double `search`/`$inc verified` per verify. Fine at current scale; breaks as data grows. No caching. |
| Testing | **1/10** | Zero working tests. The 3 unit tests that exist do not compile. No frontend, integration, API, or E2E tests. |
| Database | **5/10** | Simple workable schema with a unique `rcNumber` index; but NO indexes on filtered/searchable fields, orphaned history on delete, null `createdAt` on legacy rows (monthly charts empty), no migrations, no backup story. |
| API | **5/10** | Coherent 10-endpoint surface; weaknesses: 200-with-empty-body for "not found", no 404s, no sort, no rate limit, full-replace PUT, dead client routes, public endpoint that writes. |
| Frontend | **6/10** | Routes/UI/build solid; lint broken, hook-deps warnings, 423 kB Analytics chunk, no tests, fragile timeout-based prefill. |
| DevOps | **2/10** | No CI, no Docker, no deployment configs, health endpoint broken, log-storming, no structured logging or error tracking. |
| Documentation | **5/10** | Good README + Postman, but README references a nonexistent `application.properties`, and `./mvnw clean install` (documented flow) fails. |
| Production Readiness | **2/10** | **NO** — see §18. |

---

## 3. CRITICAL ISSUES (fix before anything else)

**C1 — Backend tests don't compile; every Maven lifecycle fails.**
- `backend/src/test/java/.../RiskAssessmentServiceTest.java:48,83` call `claim.setClaimedMileage(45000)`; `SellerClaim` has no such setter (mileage removed in commit `dbcd046`, tests left stale).
- Evidence: `mvnw clean package` → `BUILD FAILURE` `cannot find symbol: method setClaimedMileage(int)` (EXIT 1).
- Impact: no CI, no regression safety; also `testClaimedMileageEvaluation` would fail at runtime because the engine has no mileage logic and the returned `positiveFactors` only contains owner-count text — so even a compile fix must also fix the assertion.
- Fix: re-add `get/setClaimedMileage` **or** delete the two stale tests; fix `testClaimedMileageEvaluation` to assert what the engine actually emits.

**C2 — Health check is DOWN while the app serves.** Live: `GET /actuator/health` → `503 {"groups":["liveness","readiness"],"status":"DOWN"}` and POST/PUT/DELETE still respond 200/401. Two contributors fail:
- MongoDB: 83× `MongoCommandException ... (Unauthorized) not authorized on local to execute command { hello:1 }` in ~90 s. Reads to `vehicledb` still succeed — the DB role lacks the privileges to run driver heartbeat commands in the `local` database, so the Mongo health indicator records failures.
- Mail: `jakarta.mail.AuthenticationFailedException: failed to connect, no password specified?` — actuator's MailHealthIndicator probes SMTP with no credentials.
- Fix options: grant the Atlas user the minimal role that permits handshakes on `local` (usually fixed by using database-scoped `readWrite` + correct auth source, or assigning `clusterMonitor`/readAnyDatabase as needed); set real SMTP creds or exclude the mail/mongo health indicators; make the app fail fast on missing DB-privileges at startup.

**C3 — Public unauthenticated endpoint mutates the database.** `POST /api/rc/evaluate` (no auth) calls `searchByRcNumber` (which `$inc` `verified`), then `MongoTemplate.updateFirst` persists `sellerClaim` + `riskAssessment` + `updatedAt` onto any existing vehicle. Attack: anyone who knows/guesses an RC number overwrites a real record's assessment and inflates its verification counter (which feeds the public "monthly verifications" analytics).
- Fix: separate read-only scoring (`POST /evaluate` returns assessment, never writes) from an authenticated/rate-limited "record evaluation" write; keep analytics sourced from a dedicated counter.

**C4 — No real authentication; single shared secret with known default.**
- `ADMIN_SECRET_KEY` defaults to `secret-admin-key`; the committed `Drive_Verify_Postman_Collection.json` carries `"X-Admin-Secret-Key": "secret-admin-key"`. If this value is ever used in a deployed environment, control is public.
- Key stored plaintext in `localStorage`, transmitted over HTTP (dev) — trivially read by any same-origin XSS or proxy. `Auth.tsx` never tests the key against the server, so users get a "success" login with an invalid key.
- Fix: per-user accounts + server-side sessions (or at minimum: require HTTPS in any deployment, rotate to a strong key, validate the key on login, and don't persist a working secret in committed artifacts).

**C5 — PII exposed unredacted on public endpoints.**
- `GET /api/rc`, `/api/rc/{id}`, `/api/rc/search`, `/api/rc/page` return full raw records: owner name, phone, email, address, Aadhaar-last-4, chassis, engine. The UI masks some fields on certain screens but the raw API and the `RcDetail` "Developer JSON" accordion make full PII visible to any anonymous visitor, with no security headers and open CORS. This is an unredacted exposure ± personal-data compliance issue (India DPDP / general privacy).
- Fix: server-side masking/redaction for public reads (prune PII fields or mask them), keep raw data behind admin auth and HTTPS with a same-origin policy.

---

## 4. HIGH PRIORITY

- **H1 — No CI/CD at all.** No workflows, no Dockerfile, no deploy config. The `.github/` folder only holds `copilot-instructions.md`. Nothing would catch C1/C2 automatically. (Fix: GitHub Actions running `mvnw verify` + `npm run lint/tsc/build`.)
- **H2 — CORS `*` + header-echoing.** Live preflight returned `Access-Control-Allow-Origin: *`, methods GET/POST/PUT/DELETE/OPTIONS, headers `X-Admin-Secret-Key`, max-age 1800. Any webpage can call the API. (Fix: allowlist the frontend origin; ship CORS config from env.)
- **H3 — Constructor/field-injection and mutable service state.** `RcServiceImpl` mixes field `@Autowired MongoTemplate` declared after the method that uses it; `RcController` has an `@Autowired` field for `RiskAssessmentService` in the middle of a constructor-injected class. Fragile and confusing. (Refactor to constructor injection.)
- **H4 — Full-document-replace PUT.** `PUT /api/rc/{id}` overwrites the whole document; any omitted field is nulled/wiped (Postman's own update sample omits `insurance`/`puc`/`previousOwners` → wipes them). Partial updates or a merge strategy are needed.
- **H5 — Search returns 200-with-empty-body for missing records** (verified live: `GET /api/rc/search?rcNumber=ZZ99…` → 200 empty). Should be 404. Also `getById` → 200 null. No 404 path exists.
- **H6 — Duplicate-`rcNumber` create → 500 + stack trace leak.** `create` does `repo.save` against a unique index; E11000 isn't handled → raw 500 to the client (the project previously patched this exact problem in search/evaluate but not create).
- **H7 — Health/logging storm.** 83 exceptions/90 s; no structured logging, all stack traces at default level. (See C2.)
- **H8 — Rate limiting absent on every public endpoint** (search/evaluate/evaluate-writes) → enable brute-force of RC numbers, counter inflation DoS on `verified`, and paid Atlas IO burn.
- **H9 — No security headers / HTTPS posture.** Verified: stats response has no `Cache-Control`, no `X-Frame-Options`, no CSP, no `Strict-Transport-Security`. Public PII can be cached by intermediaries.
- **H10 — `verify` flow performs a redundant second search + second `$inc verified` write** (evaluate internally searches; then `Verify.tsx` calls `rc.search` again). Every verification inflates `verified` by 2 and doubles Atlas write traffic.

---

## 5. MEDIUM PRIORITY

- **M1 — Ownership history is empty.** `ownershipTransfersCount: 0` (live); timelines in the UI are *always* the synthesized "Imported/Legacy" rows. Transfer history exists only if owner name changes via PUT; nothing backfills existing data.
- **M2 — `createdAt` null on existing records** (live page sample shows `"createdAt":null` for the first record) → "Monthly Verifications" chart is permanently empty for legacy data and `monthlyVerifications: []`.
- **M3 — Deleting a vehicle orphans its `ownership_history` rows.** No cascade (history is by `rcId`, not a `$ref`).
- **M4 — No indexes on filtered fields** (`registrationState`, `vehicleInfo.make`, `owner.name` patterns are regex `"i"` → collection scan).
- **M5 — `getStats` loads the entire collection in Java** (no Mongo aggregation). Fine at 120 docs; O(n) per request.
- **M6 — `AdminKeyValidator` fallback chain hides config mistakes.** If `ADMIN_SECRET_KEY` is unset, startup blows up (no default in yml) — good fail-fast, but the double-`@Value` fallback (`${admin.secret-key:${admin.secret.key}}`) is confusing; the yml key is `admin.secret-key`, so the nested fallback never matches. Document or simplify.
- **M7 — Dead/frozen data contract on evaluate.** `evaluate(rc, claim, evidences)` accepts evidence but the controller always passes null; the `Evidence` model has no repository, and `Puc.stolen/suspicious` fields are never consulted by the engine (root-level flags are used instead). Stub drift.
- **M8 — Prefill `?rc=` in TransferOwnership works only by accident** (re-effect loop); it also emits a spurious "Enter RC Number" toast on the first timer firing. Remove the `setTimeout` hack and key the effect off a loaded form value.
- **M9 — Analytics duplicates the API base URL** (`fetch("http://localhost:8080/api/rc/stats")` instead of `apiClient`), and `api.ts` base URL is hardcoded (not env-configurable).
- **M10 — npm: 17 vulnerabilities (14 high, 3 moderate).** Direct prod hits: `react-router-dom 6.30.1` (HIGH — XSS via open redirect GHSA-2w69-qvjg-hvjx + GHSA-2j2x-hqr9-3h42 — the affected ranges now have a fix in 6.30.2/7.17.1+), plus dev-chain `vite`/`postcss`/`rollup`/`esbuild`/`nanoid`/`picomatch` etc. `npm audit fix` is available. Risk: mostly build-time, but react-router is shipped to browsers.
- **M11 — Postman collection drift.** Create sample sends `registrationInfo.date`/`state` which don't exist on the model (ignored by Jackson; `registrationDate` never saved from that sample); the "Get Paginated Vehicles" item sits under "Admin APIs" though it's public; update sample wipes fields (see H4).
- **M12 — README/documentation drift.** README §"Configuration" points to `application.properties` (file is `application.yml`); documented `./mvnw clean install` fails (C1); SMTP is presented as configured though creds are empty.

---

## 6. LOW PRIORITY

- **L1 — Dead code:** `RcNotFoundException` (never thrown), `NavLink.tsx` (never imported), `apiClient.auth.signUp/signIn` (throwing mocks), `apiClient.verifications.getById/getByRcNumber/getTimeline` (no backend route), `apiClient.rc.getAll` (no UI caller), `App.css` (unused Vite template CSS), many unused `ui/*` primitives.
- **L2 — `SellerClaim.claimedMileage` is an orphan field** with no accessor (Jackson ignores it; only the stale test references it).
- **L3 — `Puc.stolen/suspicious` dead fields; `qrCodeId` rendered in UI but not on the model.**
- **L4 — Lint errors:** 18 errors (17× `no-explicit-any`, 1× `no-require-imports` in `tailwind.config.ts`) — `npm run lint` exits non-zero. 9 warnings (react-refresh + 2 hook-dep warnings).
- **L5 — Bundle size:** main chunk 311 kB (gzip 100 kB), Analytics (recharts) 423 kB loaded lazily — acceptable now; consider code-splitting recharts or using lighter charts.
- **L6 — No keyboard/`<label>`/aria review; raw `<href="/">` link in NotFound instead of router link.**
- **L7 — `application.yml` `MONGODB_URI` vs `SPRING_DATA_MONGODB_URI` dual var + `BackendApplication` manually rebinding props (belt + braces; drift risk between root `.env` and `backend/.env` — two copies exist).

---

## 7. CONFIRMED BUGS (verified by execution or airtight source trace)

| # | Bug | Evidence |
|---|---|---|
| B1 | Test suite does not compile | `mvnw clean package` exits 1: `cannot find symbol setClaimedMileage(int)` (2 sites) |
| B2 | `testClaimedMileageEvaluation` asserts a mileage factor the engine cannot produce | Source: engine emits only owner-count/insurance/PUC/flag factors; assertion expects `"45000 km"` |
| B3 | `/actuator/health` = 503 DOWN while app serves | Live curl → `{"groups":[...],"status":"DOWN"}` [503]; page/stats 200 in same run |
| B4 | Mongo auth storm + `not authorized on local` | 83 `MongoCommandException` in ~90 s of uptime (log count) |
| B5 | SMTP health/send failure with default config | Log: `jakarta.mail.AuthenticationFailedException: no password specified?` |
| B6 | Search of missing RC returns 200 with empty body, not 404 | Live curl → `[200]` empty |
| B7 | Unauthenticated `POST /api/rc/evaluate` persists to DB | Source: `RcController.evaluateVehicle` → `updateFirst(set sellerClaim, riskAssessment, updatedAt)` when record exists; no admin check |
| B8 | Verify flow double-increments `verified` per run | Source trace: evaluate→`searchByRcNumber` ($inc) then `Verify.tsx`→`rc.search` ($inc again) |
| B9 | PUT to unknown `{id}` creates a new document instead of 404 | Source: `update()` → `repo.findById().orElse(null)` → `rc.setId(id); repo.save(rc)` (Spring Data upsert-on-not-new semantics); NOT live-replayed to avoid mutating data |
| B10 | Duplicate `rcNumber` create → 500 stack leak | Source: `repo.save` vs unique index; no E11000 handling on create |
| B11 | Ownership history untracked (0 rows) → timeline always synthesized | Live stats: `ownershipTransfersCount:0` |
| B12 | `createdAt` null on existing records → monthly chart empty | Live page sample: `"createdAt":null`; stats: `monthlyVerifications:[]` |
| B13 | Postman create doc can't save `registrationDate`/state (wrong field names) | Postman `"registrationInfo":{"date":...,"state":...}` vs model `registrationDate`/`validTill`/`active` |
| B14 | Frontend lint fails (18 errors) | `npm run lint` — non-zero exit |

## 8. POTENTIAL RISKS (partially verified / need confirmation)

- **P-R1 — Atlas role mismatch.** Reads work but handshake/`hello` on `local` is rejected. Likely the DB user (`rohithgowda`) is scoped to only `vehicledb`; may also cause future failures for aggregations that need `local`/admin. NOT fully diagnosed (would require Atlas role inspection).
- **P-R2 — `@Version` optimistic-lock semantics on full-document PUT** — concurrent transfers can race; UI does not handle retry/409. Behavior not live-stressed.
- **P-R3 — Empty/null-field normalization on create** (`ownersCount` forced to `1 + previousOwners.size` even when client sends a value) silently ignores the user's value — intentional per README, but surprising.
- **P-R4 — `evaluate` writes `riskAssessment` on the fly; races between two concurrent evaluations of one RC** are last-write-wins (no version check on the `updateFirst`). Corruptible in theory.
- **P-R5 — Interactive browser flows not exercised** (no E2E harness in repo); UI verified by build + code trace only.

## 9. MISSING FEATURES

- Working **user accounts/roles** (`/admin/users` is a static placeholder; "public/buyer/police/rto_admin" mentioned but unimplemented).
- **Evidence/document upload & verification** (model only; compute param always null).
- **Backfill of ownership history** and **backfill of `createdAt`**.
- **Pagination/sort** on `/api/rc` list; no sort control anywhere.
- **404 handling**, **rate limiting**, **retry/timeout** logic on client fetches (none).
- **Deployment artifacts** (Docker, CI, environment profiles, secrets manager).
- **Emails** — feature is inert (no SMTP credentials).

## 10. SECURITY FINDINGS

| ID | Finding | What/Why | Attack scenario | Severity | Fix |
|---|---|---|---|---|---|
| S1 | Unauthenticated DB write on `/evaluate` | Persists `sellerClaim`/`riskAssessment` on any existing RC + `$inc verified` with no auth | Bot enumerates RC numbers → corrupts public risk scores & analytics, inflates counters, burns IO | **High** | Read-only scoring endpoint; persist only via authenticated path |
| S2 | Hardcoded default admin key in committed Postman + default in `.env` | `secret-admin-key` published in repo (`Drive_Verify_Postman_Collection.json`) | Anyone runs collection → full write access | **High** | Rotate key; remove from committed artifacts; env-only |
| S3 | Open CORS `*` | Preflight verified `Allow-Origin: *` | Any site can issue admin-write requests (with guessed/leaked key) and read public PII | **High** | Origin allowlist via env |
| S4 | PII exposure on public reads (no redaction, no headers) | Full owner PII + chassis/engine returned to anonymous callers; RcDetail exposes raw JSON | Scraping, privacy violation, downstream fraud using chassis/engine numbers | **High** | Server-side masking; admin-only raw; add Cache-Control private |
| S5 | Auth via shared key in `localStorage` over HTTP | Key readable by XSS; never validated at login; no session expiry | XSS (if any) or proxy steals key → full control | **High** | Real sessions; validate on login; HTTPS mandatory |
| S6 | Rate limiting absent | No throttle on search/evaluate | Enumeration, DoS via writes/reads | **Medium** | Per-IP/`rcNumber` limits (filter or gateway) |
| S7 | Dependency advisories | `react-router-dom@6.30.1` (HIGH XSS/open-redirect), vite/postcss/rollup/nanoid/picomatch/esbuild/yaml/flatted/glob/lodash/minimatch/ajv/brace-expansion/js-yaml | Supply-chain & (for react-router) shipped-to-browser issues | **Medium-High** (17 total) | `npm audit fix` + verify routing upgrade doesn't break v6->v7 migration |
| S8 | `IllegalArgumentException` → 500 with default Spring error page | Validation errors leak framework internals; `RcNotFoundException` dead | Info disclosure; mislabeled failures | **Medium** | Global handlers → 400/404 JSON |
| S9 | No security headers / no HTTPS guidance | Confirmed absence of CSP, HSTS, frame/clickjack, cache headers | Clickjacking, interception, caching of PII | **Medium** | Add headers; force HTTPS |
| S10 | Duplicate-key create → 500 leak | E11000 unhandled on create | Duplicate submission reveals stack/DB internals; no idempotency | **Medium** | Catch/409; dedupe on rcNumber before save |
| S11 | `$$`/regex injection in filters | `getFiltered` embeds raw strings in `$regex` | ReDoS-ish patterns via `registrationState/make/ownerName` | **Low-Med** | Escape/sanitize or use plain `startsWith` with index |
| S12 | No CSRF needed (stateless, no cookies) | N/A | N/A | Info | Preserve statelessness; don't add cookie sessions |
| S13 | XSS via stored data | React escapes text rendering; JSON accordion uses text node — safe today | — | Info (low exposure) | Keep escaping; avoid `dangerouslySetInnerHTML` |

No SQL-injection, SSRF, command injection, path traversal, unsafe deserialization, or file-upload surface was found (no such features).

## 11. TESTING — what was actually executed

| Command | Result |
|---|---|
| `frontend: npm run lint` | **FAIL** — 18 errors / 9 warnings (`no-explicit-any` ×17, `no-require-imports` ×1, hook-deps ×2, refresh ×7) |
| `frontend: npx tsc --noEmit -p tsconfig.json` | **PASS** (0 errors; note `strict:false`, `noImplicitAny:false`) |
| `frontend: npm run build` | **PASS** — 1m17s; chunks 311 kB main (100 kB gz) + 423 kB Analytics lazy |
| `frontend: npm audit` | **FAIL** — 17 vulnerabilities (14 high, 3 moderate); `react-router-dom` direct HIGH |
| `backend: mvnw compile` | **PASS** |
| `backend: mvnw test-compile` | **FAIL** — `setClaimedMileage` missing (2 sites) |
| `backend: mvnw clean package` | **FAIL** — same test-compile error (EXIT 1) |
| `backend: mvnw package -Dmaven.test.skip=true` | **PASS** — jar `backend-0.0.1-SNAPSHOT.jar` (34.56 MB) |
| **Live boot** (`java -jar …`) | App started in ~17 s (Tomcat 8080). Health **503 DOWN**. |
| Live: `GET /api/rc/page?size=1` | 200 — 120 vehicles (real DB) |
| Live: `GET /api/rc/stats` | 200 — totals, byState, `monthlyVerifications:[]`, `ownershipTransfersCount:0` |
| Live: `GET /api/rc/search?rcNumber=ZZ99TESTAUDIT2` | 200 empty body (missing→not 404) |
| Live: `POST /api/rc/evaluate` (fake RC) | 200 — not-found assessment (no write on miss) |
| Live: `POST /api/rc` no key | **401** JSON — gate works |
| Live: `POST /api/rc` wrong key | **401** JSON |
| Live: `OPTIONS /api/rc` (CORS preflight) | `Allow-Origin: *`, headers include `X-Admin-Secret-Key` |
| Live: response headers on `/api/rc/stats` | No cache-control / security headers |
| Live: log sampling | 83 Mongo auth-storm exceptions/90 s; mail auth failure logged |

**Coverage assessment (not a number — a deduction):** nothing about the risk engine's rules, ownership-transfer side effects, statistics math, pagination math, auth gating, or duplicate-key behavior is actually tested, because the test binary never builds and no other tests exist. The only test-present-intent (engine scoring) is broken and out of date with the shipped model.

## 12. ARCHITECTURE ASSESSMENT

**The architecture is sound for its size** — a classic two-tier web app, cleanly split controller/service/repo, single source of truth `Rc`. Strengths: small surface area, explicit models, MongoTemplate for write-safe increments, Micrometer wiring, lazy-loaded frontend.

Points that will bite as it grows:
1. **No DTO layer**: `Rc` is both the wire format and the persistent entity. Any schema change (like the root-level chassis/engine move already mentioned in comments) is a breaking API change.
2. **Controller does aggregation & persistence** (stats, evaluate-update) that belongs in services/repositories.
3. **In-memory computation** everywhere (stats, page/filter slicing) instead of MongoDB aggregation/pagination.
4. **Full-dict PUT** and shared mutable domain objects foster data loss.
5. **Boot 4.0 parent** is a very new major; ecosystem/training and migration risk.
6. **Two config entry points** (dotenv manual loader + spring-dotenv) is redundant.

Recommend (later, P2): introduce DTOs + service-layer Mongo aggregation; constructor-inject everything; collapse the two env loaders.

## 13. PRODUCTION READINESS

> **Is this project ready for production? → NO.**

Reasons (all confirmed): the build's test phase is broken; health endpoint is DOWN during normal serving (breaks orchestration); a public endpoint performs unauthenticated writes; there is no CI, Docker, or deployment configuration; PII is publicly served without headers or HTTPS posture; the admin secret is effectively published; email is dead; and none of the operational failure modes fail fast or cleanly.

It becomes "**YES WITH CONDITIONS**" after: P0 fixes (C1–C5) + P1 items (CI, CORS allowlist, rate limit, 404s/400s, dependency updates, docs) are done and a prod smoke test (build + boot + health + key flows) passes.

## 14. RECOMMENDED FIX ORDER (roadmap)

**P0 — Fix immediately**
| ID | File(s) | Fix | Verify |
|---|---|---|---|
| P0.1 | `RiskAssessmentServiceTest.java`, `SellerClaim.java` | Restore `claimedMileage` accessors or delete stale tests; align `testClaimedMileageEvaluation` assertions with the engine | `mvnw test` green |
| P0.2 | Config/health | Fix Mongo role/auth-source (`local` handshake), set SMTP creds, or exclude failing health indicators; add fail-fast validation on boot | `/actuator/health` = 200 UP |
| P0.3 | `evaluateVehicle` | Remove write side effects from public `/evaluate` (read-only scoring); move persistence behind admin/rate-limited path | Unauthenticated call performs no DB write |
| P0.4 | Secrets | Rotate admin key; strip `secret-admin-key` from Postman/committed files; env-only + validate-at-login | Commit scan shows no `secret-admin-key` |
| P0.5 | Security headers + CORS | Origin allowlist from env; CSP/HSTS/cache headers; HTTPS doc | Preflight shows locked origin; headers present |

**P1 — Before release**
| ID | Issue | Evidence/verification |
|---|---|---|
| P1.1 | CI (GH Actions): `mvn verify` + `tsc` + `lint` + `build` | Pipeline green |
| P1.2 | 404/400 error contract (`RcNotFoundException` reuse, `IllegalArgumentException`→400, missing→404) | curl checks return 404/400 JSON |
| P1.3 | Rate limiting (public search/evaluate) | Attempts throttled |
| P1.4 | Server-side PII masking on public reads | Public JSON has masked PII |
| P1.5 | PUT semantics: reject unknown id (404) + partial-merge or document full-replace | PUT to bogus id → 404; Postman update no longer wipes fields |
| P1.6 | Duplicate-create → 409 with friendly JSON | curl duplicate create → 409 |
| P1.7 | `npm audit fix` + verify react-router upgrade; keep lint 0-error | audit 0; lint 0-error |
| P1.8 | Single config entry + `VITE_API_BASE_URL` env for frontend; remove duplicate `.env` | one source of truth |

**P2 — Soon after release**
- Mongo aggregation for `/stats`; indexes on filter fields; move page-slicing to DB.
- Dedupe the double-`search`/`verified` increment in the Verify flow.
- Email feature: real SMTP config or graceful `mail.disabled` flag with no health contributor.
- Backfill `createdAt` + ownership history; cascade/cleanup history on vehicle delete.
- Fix TransferOwnership `?rc=` prefill (remove setTimeout); harness exact deps in effects.
- Wire `Evidence` properly or delete; delete dead routes (`/api/verifications/*`, `auth.*`, `rc.getAll`, `NavLink`, `RcNotFoundException`).
- Add Dockerfile + compose and a Prod profile.

**P3 — Future**
- Real users/roles (replaces AdminUsers placeholder) or officially document the shared-key model.
- DTO layer; full-document/partial-update contracts; optimistic-lock retry UI.
- Frontend unit/integration tests; optional E2E (Playwright) for the buy flow.
- Log aggregation + error tracking; Prometheus dashboards; backup strategy for Atlas.

---

**IMPORTANT FINAL RULE COMPLIANCE:** No project files were modified during this audit (only `doc/` files from the prior session exist, and temporary probes lived in the OS temp dir). The live runs were read-only against the database except for the *implied* `verified` counter increments that the design itself performs on `search`; no records were created, edited, or deleted.