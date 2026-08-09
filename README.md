# Drive Verify — Project Overview

Drive Verify is a comprehensive full-stack platform designed for querying, managing, and monitoring vehicle Registration Certificates (RCs). Built with safety, security, and analysis in mind, the platform serves two core user groups: public users searching for vehicle credentials and verified admins managing database records.

---

## Key Features

### 🔍 RC Search & Verification
- **Instant Lookup**: Public users can query vehicle details instantly using unique Registration Certificate (RC) numbers.
- **Redesigned Details Page**: Replaced raw JSON displays with a professional grid layout of structured cards:
  * **Vehicle Information**: Make, Model, Fuel Type, Color, Chassis/Engine Numbers.
  * **Owner Information**: Name, Email, Phone, Address, Aadhaar Last 4, and Owners Count.
  * **Registration, Insurance, and PUC details**: Standardized card groupings.
  * **Collapsible Accordion**: A bottom "Developer JSON" accordion collapses the raw document viewer to maintain UI cleanliness.

### 🛡️ Fraud & Security Flagging
- **Visual Status Badges**: Displays clean status indicators with icons on details and listings:
  * 🟢 Clean
  * 🟡 Suspicious
  * 🔴 Stolen
- **Transfer Alert Dialogs**: Prompts administrative warnings if a user attempts to edit or transfer ownership of a flagged vehicle.

### 💼 Admin Session Management
- **Persistent Admin Session**: Admins log in once with their Admin Key via the `/auth` screen.
- **Implicit Key Propagation**: The key is stored in the browser's `localStorage` and automatically attached as the `X-ADMIN-KEY` header by the API client on all protected operations.
- **Cleaner UI**: Completely removed raw admin key input textboxes from Transfer Ownership, Vehicle Database, and modification dialogs.
- **Session Control**: Admins can clear their session anytime by clicking the **End Admin Session** button in the global dashboard header.

### 🔄 Ownership Transfer & History Timeline
- **Automated Calculations**: The backend automatically increments and manages the current owner count based on history size.
- **Vertical Timeline Logs**: Ownership transfers are rendered as a vertical timeline showing owner chains (e.g. `Rahul` ↓ `Prem`), transfer dates, and custom warnings for risk-flagged transfers.
- **Legacy Record Synthesis**: If no history exists in the DB, the timeline dynamically synthesizes historical changes from previous owners arrays.

### 📊 Rich Analytics Dashboard
- **Structured KPI Rows**: Grouped indicators in structured rows:
  * Row 1: Total Vehicles | Verified Registrations | Ownership Transfers
  * Row 2: Stolen Vehicles | Suspicious Vehicles | Active Insurance
- **Interactive Visualizations**: Graphical dashboards showing monthly verification rates, breakdown by state registrations, and fraud/stolen ratios.
- **Graceful Placeholders**: Displays a clean placeholder (*"Available when backend supports this metric"*) for unsupported metrics to respect backend architecture constraints and prevent client-side performance degradation.
- **System Monitoring**: Exposes Prometheus metrics via Spring Boot Actuator at `/actuator/prometheus` to track database connections and request counts.

---

## System Architecture & Tech Stack

### Frontend (Vite + React 18 + TS)
- **UI & Layout**: Formulated with TailwindCSS and custom shadcn/ui components for a clean, responsive layout.
- **Navigation & Routing**: Controlled via React Router inside [App.tsx](file:///c:/Users/rohit/Desktop/study/projects/Drive%20verify/frontend/src/App.tsx).
- **Form Validation**: Uses **Zod** to validate ownership transfers and new vehicle registrations before submitting to the server.
- **API Client**: [api.ts](file:///c:/Users/rohit/Desktop/study/projects/Drive%20verify/frontend/src/lib/api.ts) acts as a centralized wrapper targeting `http://localhost:8080` with automatic header injection.

### Backend (Spring Boot + Java 21)
- **Database Persistence**: MongoDB Atlas database persistence.
- **Security Check**: Enforced by the [AdminKeyValidator](file:///c:/Users/rohit/Desktop/study/projects/Drive%20verify/backend/src/main/java/com/SmartVehicle/backend/config/AdminKeyValidator.java) filter/component.
- **Data Integrity**: Handled via [RcServiceImpl](file:///c:/Users/rohit/Desktop/study/projects/Drive%20verify/backend/src/main/java/com/SmartVehicle/backend/service/RcServiceImpl.java) which validates schemas, updates owner logs, and computes owner counters.

---

## Development

### Frontend:

```powershell
cd frontend
npm install
npm run dev
```

### Backend:

```powershell
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`. Prometheus metrics at `http://localhost:8080/actuator/prometheus`.

---

## Configuration

`backend/src/main/resources/application.properties`:
```properties
server.port=8080

# Spring Boot MongoDB Configuration (both legacy and standard keys supported)
spring.mongodb.uri=mongodb+srv://<username>:<password>@cluster0.aoda8xk.mongodb.net/?appName=Cluster0
spring.mongodb.database=vehicledb
spring.mongodb.auto-index-creation=true

spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster0.aoda8xk.mongodb.net/?appName=Cluster0
spring.data.mongodb.database=vehicledb
spring.data.mongodb.auto-index-creation=true

admin.secret.key=your_admin_secret_key
management.endpoints.web.exposure.include=health,info,prometheus
```

---

## Notes

- Do not edit shadcn-generated primitives in `components/ui/*`.
- Admin operations require `X-ADMIN-KEY` header (automatically attached from active browser admin sessions).
- Owners count is derived on server; frontend value is normalized before save.
