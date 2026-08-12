# Drive Verify — Frontend Route Map

| Path | Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `Home.tsx` | Public | Primary role selection entry landing page (Customer vs. Admin). |
| `/customer` | `CustomerVerify.tsx` | Public | Customer portal landing for vehicle verification queries. |
| `/customer/verify` | `Verify.tsx` | Public | Public vehicle trust & risk evaluation report. |
| `/customer/vehicle/:id` | `RcDetail.tsx` | Public | Customer-safe vehicle detail view with server-side PII masking. |
| `/admin/login` | `AdminLogin.tsx` | Admin Entry | Secret key login form issuing backend session tokens. |
| `/admin/dashboard` | `Dashboard.tsx` | Admin Protected | System management dashboard. |
| `/admin/vehicles` | `Vehicles.tsx` | Admin Protected | Full vehicle inventory management table. |
| `/admin/transfer` | `TransferOwnership.tsx` | Admin Protected | Vehicle ownership transfer workflow. |
| `/admin/analytics` | `Analytics.tsx` | Admin Protected | System statistics and verification trend charts. |