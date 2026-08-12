# Drive Verify — REST API Specification Map

## Authentication & Session Endpoints

### `POST /api/auth/admin`
- **Access**: Public
- **Description**: Validates `adminKey` and returns a bearer session token.
- **Request Body**: `{ "adminKey": "string" }`
- **Response**: `{ "token": "ADM_SESS_...", "authenticated": true }`

---

## Vehicle & Verification Endpoints

### `GET /api/rc`
- **Access**: Public (PII Masked) / Admin (Unmasked)
- **Description**: Returns all vehicle records.

### `GET /api/rc/{id}`
- **Access**: Public (PII Masked) / Admin (Unmasked)
- **Response Statuses**: `200 OK`, `404 Not Found`

### `GET /api/rc/search?rcNumber=...`
- **Access**: Public (PII Masked) / Admin (Unmasked)
- **Response Statuses**: `200 OK`, `404 Not Found`

### `POST /api/rc/evaluate`
- **Access**: Public
- **Description**: Evaluates vehicle trust score & risk factors without database mutation.
- **Request Body**: `{ "rcNumber": "KA01AB1234", "sellerClaim": { "claimedOwnerCount": 1 } }`
- **Response**: `RiskAssessment` JSON object.

### `POST /api/rc`
- **Access**: Admin Authorized (`Authorization: Bearer <token>` or `X-Admin-Secret-Key`)
- **Response Statuses**: `200 OK`, `409 Conflict` (Duplicate RC)

### `PUT /api/rc/{id}`
- **Access**: Admin Authorized
- **Description**: Updates vehicle details / handles ownership transfer.
- **Response Statuses**: `200 OK`, `404 Not Found` (Unknown ID)

### `DELETE /api/rc/{id}`
- **Access**: Admin Authorized
- **Response Statuses**: `200 OK`, `404 Not Found`

### `GET /api/rc/{id}/history`
- **Access**: Public / Admin
- **Description**: Fetches historical ownership transfers for an RC.

### `GET /api/rc/stats`
- **Access**: Admin Authorized (`401 Unauthorized` for public callers)
- **Description**: Returns total vehicles, stolen count, suspicious count, state breakdown, and monthly trends.