# database-map.md — MongoDB Schema & Relationships

Generated 2026-08-12, verified from `backend/src/main/java/com/SmartVehicle/backend/model/*.java`.

## 1. Connection & settings

- DB: MongoDB Atlas `vehicledb` (URI from env; `application.yml` default `mongodb://localhost:27017/vehicledb`).
- `spring.data.mongodb.auto-index-creation=true`.
- No migrations, no seed scripts, no `spring-data-mongodb` repository events used. Documents are written as POJOs via `MongoRepository` / `MongoTemplate`.

## 2. Collections

| Collection | Java class | Wired? | Notes |
|---|---|---|---|
| `vehicles` | `com.SmartVehicle.backend.model.Rc` | ✅ yes (repos + template) | Primary record; unique RC number |
| `ownership_history` | `OwnershipHistory` | ✅ yes | Append-only transfer log |
| `evidence` | `Evidence` | 🔲 model only | No repository, no controller, no writes |

## 3. `vehicles` document (Rc)

```
_id                   ObjectId (serialized as String id)
rcNumber              String        @Indexed(unique = true)  ← system uniqueness constraint
ownersCount           int           (server-normalized = 1 + previousOwners.length)
previousOwners        String[]
owner                 { name, phone, email, address, aadhaarLast4 }
vehicleInfo           { type, make, model, variant, fuelType, color, manufactureYear }
registrationInfo      { registrationDate, validTill, active }
insurance             { provider, policyNumber, validTill }
puc                   { certificateNumber, validTill, stolen, suspicious }
chassisNumber         String        (root level)
engineNumber          String        (root level)
registrationState     String        (root level; denormalized)
stolen                Boolean       (root level flag)
suspicious            Boolean       (root level flag)
verified              Integer       (search/verify counter, $inc on every search call)
sellerClaim           { claimedOwnerCount, claimedMileage, claimedAccidentFree,
                        claimedOriginalEngine, claimedOriginalChassis,
                        claimedInsuranceValid, claimedLoanCleared }
riskAssessment        { trustScore, riskLevel, mismatches[], riskReasons[],
                        positiveFactors[], inspectionChecklist[], negotiationPoints[],
                        generatedAt }
createdAt             Instant
updatedAt             Instant
version               Long          @Version (optimistic lock)
```

Field gotchas (verified):
- `SellerClaim.claimedMileage` exists as a field but has **no getter/setter** → Jackson ignores it and the model is asymmetric (see broken test in `memory.md` §19).
- `Puc.stolen`/`Puc.suspicious` exist but are never read by the risk engine (engine reads root `stolen`/`suspicious`).
- `qrcodeId` is rendered by the UI (`RcDetail.tsx`) but is **not a field** on `Rc` → always `—`.

## 4. `ownership_history` document

```
_id               ObjectId
rcId              String   @Indexed → Rc._id        (soft reference)
rcNumber          String   @Indexed                  (denormalized)
previousOwnerName String
newOwnerName      String
transferredAt     Instant
stolenAtTransfer  Boolean
suspiciousAtTransfer Boolean
```

Inserted by `RcServiceImpl.update` only when `existing.owner.name != new owner.name`. Query: `findByRcIdOrderByTransferredAtDesc`.

## 5. `evidence` document (planned)

```
_id, verificationRequestId, rcNumber, type, source, status,
documentName, extractedChassisNumber, extractedEngineNumber,
extractedMileage (int), uploadedAt
```

`RiskAssessmentService.evaluate` accepts a `List<Evidence>` param (MISMATCH→-15, VERIFIED→positive factor) but **the controller always passes null**.

## 6. Entity relationship map

```
OwnershipHistory.rcId ──▶ (soft) Rc._id     0..* per vehicle
Rc.owner / vehicleInfo / registrationInfo / insurance / puc      (embedded 1:1)
Rc.sellerClaim ── 1:0..1 embedded
Rc.riskAssessment ── 1:0..1 embedded
Evidence.rcNumber ──▶ (soft) Rc.rcNumber    0..*  (unused)
```

There are **no** Mongo `@DBRef` references; all cross-entity links are query-by-field soft joins done explicitly in code. Deleting a vehicle does **not** cascade-delete ownership_history (orphans possible).

## 7. Query surface (what touches what)

| Code | Collection | Query |
|---|---|---|
| `RcRepository.findByRcNumber` | vehicles | exact unique lookup |
| `RcServiceImpl.searchByRcNumber` | vehicles | read + `MongoTemplate.updateFirst` `$inc verified, set updatedAt` |
| `RcController.evaluateVehicle` | vehicles | `updateFirst` set `sellerClaim`, `riskAssessment`, `updatedAt` |
| `RcServiceImpl.getFiltered` | vehicles | `MongoTemplate.find` regex `i` on `registrationState`, `vehicleInfo.make`, `owner.name`; eq on `stolen`/`suspicious` |
| `OwnershipHistoryRepository.findByRcIdOrderByTransferredAtDesc` | ownership_history | index `rcId`, sort `transferredAt` desc |
| `OwnershipHistoryRepository.count` | ownership_history | total transfers (stats) |
| `RcController.getStats` | vehicles + ownership_history | full collection load in Java + `count()` |

## 8. Data integrity risks

- `rcNumber` unique index: `repo.save` in `create` will throw E11000 on duplicates → 500, no friendly message. (Patched in search/evaluate paths via `updateFirst`, not in create.)
- `@Version` optimistic locking: PUT sends user-supplied `version`; concurrent edits may 409/retry (not explicitly handled in UI).
- No transaction boundaries: `repo.save(rc)` and `ownershipHistoryRepository.save(h)` are two separate writes (non-atomic).
- In-memory stats/page slicing do all filtering in the app tier, not in MongoDB.