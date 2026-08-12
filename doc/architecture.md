# Drive Verify — System Architecture Document

```
                      [ CUSTOMER PORTAL ]               [ ADMIN PORTAL ]
                                │                               │
                      (Public Verification)                  (Admin Key)
                                │                               │
                                ▼                               ▼
                         POST /api/rc/evaluate          POST /api/auth/admin
                                │                               │
                                │                               ▼
                                │                        Session Token Bearer
                                │                               │
                                └──────────────┬────────────────┘
                                               │
                                               ▼
                                   [ Spring Boot Backend ]
                                  (com.SmartVehicle.backend)
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
                  [ Controllers ]         [ Services ]         [ Security ]
                   - AuthController        - RcServiceImpl      - AdminKeyValidator
                   - RcController          - RiskAssessmentService
                                           - EmailService
                                               │
                                               ▼
                                        [ Repositories ]
                                         - RcRepository
                                         - OwnershipHistoryRepository
                                               │
                                               ▼
                                      [ MongoDB Database ]
                                      (vehicledb collection)
```

## Core Architecture Principles
1. **Simplified Interview-Ready Tiering**: Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ MongoDB.
2. **Lean Standalone Models**: Reduced from 10 nested model files to 4 target files (`Rc.java`, `RiskAssessment.java`, `SellerClaim.java`, `OwnershipHistory.java`).
3. **Pure Public Verification Engine**: `POST /api/rc/evaluate` calculates risk dynamically without mutating persistent verification counters or vehicle documents.
4. **Server-Side PII Safeguards**: Automatic masking of sensitive personal owner information for non-admin viewers.