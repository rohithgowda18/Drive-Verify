# dependency-graph.md — Import & Dependency Analysis

Generated 2026-08-12 from verified `import`/grep analysis. Purpose: identify choke points, high-impact files, and files that should not be modified lightly.

## 1. Backend dependency graph

```
                        ┌──────────────────────────────────────────────┐
                        │            BackendApplication                │
                        │  (dotenv → System.setProperty → Boot)        │
                        └──────────────────────────────────────────────┘
                                          │  (config)
                                          ▼
                    ┌──────────────────────────────────────────────┐
                    │               RcController                    │ ◄── ALL 10 routes + CORS + auth gates
                    │  deps: RcService, AdminKeyValidator,          │
                    │        OwnershipHistoryRepository, MongoTemplate,
                    │        RiskAssessmentService, model.*          │
                    └───────┬───────────────┬───────────────────────┘
                            │               │
        ┌───────────────────┘               └──────────────────────────┐
        ▼                                                              ▼
┌───────────────────────────┐                          ┌───────────────────────────────┐
│   RcService / RcServiceImpl │                          │      RiskAssessmentService  │
│   deps: RcRepository,       │                          │   deps: model.Rc, SellerClaim,│
│   OwnershipHistoryRepository,│                          │          Evidence, RiskAssessment│
│   MongoTemplate, EmailService, │                       └───────────────────────────────┘
│   MeterRegistry (Micrometer) │
└───────┬───────────────────────┘
        │
        ├──────────────────────────────────────────────┐
        ▼                                              ▼
┌─────────────────┐                       ┌──────────────────────────────┐
│  Repositories   │                       │          EmailService        │
│  RcRepository   │        metric         │  deps: JavaMailSender, From  │
│  OwnershipHistory│◄──── counters        └──────────────────────────────┘
│  Repository      │
└─────────────────┘
        ▼
┌────────────────┐
│  model/Rc (core)│ ◄── also used by RiskAssessmentService, repos, controller, tests
│  OwnershipHistory│
│  SellerClaim / RiskAssessment / Evidence / Owner / VehicleInfo /
│  RegistrationInfo / Insurance / Puc
└────────────────┘
```

**Critical/high-impact backend files:**
1. `model/Rc.java` — the aggregate root; touched by controller, both services, both repos, both tests, and the UI contract. Changing its shape ripples everywhere.
2. `service/RcServiceImpl.java` — all validation/normalization + every side-effect (verified counter, ownership history, emails, Micrometer counters).
3. `controller/RcController.java` — sole endpoint surface + whole auth gate; new endpoints must be added here with their own gates.
4. `config/AdminKeyValidator.java` — entire auth model.
5. `service/RiskAssessmentService.java` — scoring rules + unit-test contract.
6. `resources/application.yml` — the only runtime configuration source.
7. `BackendApplication.java` — env bootstrapping (dotenv path `./` then `../`, Mongo URI override).

**Isolated/dead backend code (safe to change):**
- `exception/RcNotFoundException.java` — never referenced (dead).
- `model/Evidence.java` — no repo/endpoint; only the `evaluate(…, List<Evidence>)` convenance param that is always null.
- `exception/IllegalArgumentException` handling is absent (not a file, but a gap).

## 2. Frontend dependency graph

```
main.tsx
  └─ App.tsx  ───── QueryClientProvider + TooltipProvider + Toaster + Sonner + BrowserRouter
        └─ Routes → (lazy) pages ─────────────────────────────────────────────┐
             │                                                               │
   ┌─────────┼──────────────────────────────┬──────────────────────────────┐   │
   ▼         ▼                              ▼                              ▼   │
 Index   Dashboard   Verify ─► api.verifications.create + api.rc.search ──┼───┤
   │         │            │  (uses lib/api.ts)                            │   │
   │         │            └─ ui/button, card, input, label, badge, alert  │   │
   ▼         ▼                                                             │   │
  Vehicles ─► api.rc.getPage/create/remove (lib/api.ts)                    │   │
   │         └─ lib/validation (vehicleCreateSchema), ui/alert-dialog,     │   │
   │            ui/dropdown-menu, ui/badge                                  │   │
   ▼                                                                        │   │
  RcDetail ─► api.rc.getById (lib/api.ts) ─ ui/accordion                    │   │
   ▼
  OwnershipHistory ─► api.rc.getHistory + api.rc.getById (parallel)         │
   ▼
  Analytics ─► raw fetch http://localhost:8080/api/rc/stats (BY → lib/api) ─┘
              └─ ui/chart (ChartContainer/ChartTooltip) + recharts
   ▼
  AdminUsers, Auth, TransferOwnership, NotFound
     ├─ Auth: localStorage adminKey (no api)
     ├─ TransferOwnership: lib/validation (transferSchema), api.rc.search/update
     └─ NotFound: uses useLocation

Shared:
  lib/utils.ts (cn = clsx + tailwind-merge)  ◄── every ui/* primitive
  ui/* (50+ shadcn primitives)                ◄── all pages
  hooks/use-toast.ts                          ◄── ui/toaster.tsx + ui/use-toast.ts (not pages directly; pages use sonner)
  hooks/use-mobile.tsx                        ◄── ui/sidebar.tsx only
```

**Critical/high-impact frontend files:**
1. `lib/api.ts` — only real API wrapper; owns `X-ADMIN-KEY` injection; pinned base URL `http://localhost:8080`. Every functional page (Verify, Vehicles, RcDetail, OwnershipHistory, TransferOwnership) depends on it.
2. `App.tsx` — routing table + providers.
3. `lib/validation.ts` — shared schemas for Vehicles + TransferOwnership.
4. `src/pages/Verify.tsx` — the core product flow (evaluate + search orchestration).
5. `index.css` — design tokens (`bg-gradient-hero`, `--primary`, shadows, sidebar vars) consumed by every view.

**Dead / low-impact frontend code:**
- `components/NavLink.tsx` — exported, never imported.
- `apiClient.auth.*` (mock throwers), `apiClient.rc.getAll`, `apiClient.verifications.getById/getByRcNumber/getTimeline` — no callers.
- `App.css` — Vite template leftovers, not imported by `main.tsx` (only `index.css` is).
- Many `ui/*` primitives shipped but unused by pages (sidebar, resizable, menubar, context-menu, carousel, etc.) — shadcn spec.

## 3. Cross-stack dependencies

```
Frontend (api.ts) ──post/put/delete──► HTTP: X-ADMIN-KEY ──► AdminKeyValidator (equality vs ADMIN_SECRET_KEY)
Frontend GETs ──────────────────────► RcController public getters
Frontend rc shape — contract:       vehicleCreateSchema & NewRc (Vehicles.tsx) ↔ Rc model fields
Frontend evaluated doc — contract:  Verify.tsx `RiskAssessment` interface ↔ RiskAssessment model
Persistence —                       MongoTemplate / MongoRepository ↔ MongoDB Atlas vehicledb
Ops —                               Micrometer MeterRegistry -> /actuator/prometheus
Email —                             EmailService (spring-boot-starter-mail) -> SMTP (inert without creds)
```

## 4. Topology: what breaks if tripped

| File changed carelessly | Immediate blast radius |
|---|---|
| `model/Rc.java` | RcController serialization, RcServiceImpl rules, both repos, tests, and **frontend expectations** (Vehicles/Transfer join/save full doc) |
| `api.ts` base URL | the entire app goes dark (Analytics additionally hardcodes its own copy) |
| `RcServiceImpl.update` | ownership-history integrity + transfer emails + ownersCount consistency |
| `RiskAssessmentService.evaluate` | scoring semantics (unit-tested expectations) + persisted riskAssessment on vehicles |
| `application.yml` | whole config (mongo URI, admin secret fallback, mail) |
| `admin.secret-key` binding | every admin write 401s |

## 5. Coaching summary (risky-modification order, highest → lowest)

1. `model/Rc.java`
2. `service/RcServiceImpl.java`
3. `controller/RcController.java`
4. `lib/api.ts`
5. `service/RiskAssessmentService.java`
6. `config/AdminKeyValidator.java`
7. `App.tsx` / `lib/validation.ts`
8. `application.yml`
9. `Analytics.tsx`
10. Everything else (UI primitives, dead code) — safe.