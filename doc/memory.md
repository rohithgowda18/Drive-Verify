# System Memory & Architecture

## Overview
Drive Verify is an interview-ready, production-grade Vehicle Registration Certificate (RC) verification and fraud detection platform.

## Key Features & Entry Flows
- **Customer Role Entry Flow**:
  - Landing at `/` $\rightarrow$ Selects "Customer" $\rightarrow$ `/customer` $\rightarrow$ Enter RC Number $\rightarrow$ `/customer/vehicle/:id`
  - Public read-only vehicle verification and risk evaluation (`POST /api/rc/evaluate`).
  - Server-side PII Protection: Public endpoints automatically mask sensitive details (phone, email, full address, Aadhaar, chassis/engine numbers).
- **Admin Role Entry Flow**:
  - Landing at `/` $\rightarrow$ Selects "Admin" $\rightarrow$ `/admin/login` $\rightarrow$ Validate Admin Secret Key $\rightarrow$ `/admin/dashboard`
  - Admin Token Authentication: Calls `POST /api/auth/admin` and holds token in `sessionStorage` (no raw secret saved).
  - Admin Capabilities: CRUD operations on RC records, ownership transfer workflow, audit log history, system analytics (`GET /api/rc/stats`).

## Refactored Backend Architecture (4 Models Only)
- `Rc.java`: Core vehicle document model containing embedded static inner helper classes (`Rc.Owner`, `Rc.VehicleInfo`, `Rc.RegistrationInfo`, `Rc.Insurance`, `Rc.Puc`).
- `RiskAssessment.java`: Standalone model representing risk score, risk level, positive factors, and mismatches.
- `SellerClaim.java`: Standalone model for evaluation request payloads.
- `OwnershipHistory.java`: Model representing the `ownership_history` MongoDB audit collection.

## API Endpoints
- `POST /api/auth/admin`: Admin key login & token generation.
- `GET /api/rc`: List vehicles (Admin unmasked, Public masked).
- `GET /api/rc/{id}`: Get vehicle by ID (404 if missing).
- `GET /api/rc/search?rcNumber=...`: Find vehicle by RC number (404 if missing).
- `GET /api/rc/page`: Paginated vehicle list with filter params.
- `POST /api/rc/evaluate`: Public read-only risk calculation (does NOT mutate DB).
- `POST /api/rc`: Create vehicle record (Admin authorized, 409 on duplicate).
- `PUT /api/rc/{id}`: Update vehicle record / Transfer ownership (Admin authorized, 404 if unknown ID).
- `DELETE /api/rc/{id}`: Delete vehicle record (Admin authorized).
- `GET /api/rc/{id}/history`: Fetch ownership transfer audit log.
- `GET /api/rc/stats`: Fetch aggregate statistics (Admin authorized).