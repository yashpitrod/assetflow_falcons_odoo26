# architecture.md — AssetFlow

Enterprise Asset & Resource Management System — Odoo Hackathon 2026 (8 hrs)

## 1. Overview
Not tied to a single industry — any org with equipment, furniture, vehicles, or shared spaces. Core loop: set up departments/categories/employees → register assets → allocate assets (with conflict handling) → book shared resources by time slot (no overlaps) → route maintenance through approval before repair starts → run scheduled audit cycles → surface everything via KPI dashboard + notifications + reports.

## 2. Tech Stack
- **Frontend:** React 18 (Vite) + TailwindCSS + React Router
- **Backend:** Node.js + Express
- **ORM:** Prisma
- **Database:** PostgreSQL (local/self-hosted)
- **Auth:** JWT (access token) + bcrypt password hashing
- **File uploads** (asset photos, maintenance photos): stored locally under `/uploads`, path referenced in DB — no cloud storage service for hackathon scope

## 3. High-Level Architecture
```
[React Frontend] <---REST/JSON---> [Express API] <---Prisma---> [PostgreSQL]
                                          |
                                   [JWT Auth Middleware]
                                   [RBAC Middleware]
                                   [Zod/Joi Input Validation]
```

## 4. User Roles & Permissions

| Role | Can do |
|---|---|
| **Admin** | Org setup (departments, categories), promote Employee → Dept Head / Asset Manager, org-wide analytics |
| **Asset Manager** | Register/allocate assets, approve transfers, approve maintenance requests, approve audit discrepancy resolution, approve returns + condition check-in |
| **Department Head** | View dept's allocated assets, approve allocation/transfer requests within dept, book shared resources for dept |
| **Employee** | View own allocated assets, book shared resources, raise maintenance requests, initiate return/transfer requests |

**Role assignment happens ONLY via Admin promoting from the Employee Directory screen — never via signup.** Signup always creates a plain Employee account.

## 5. Database Schema

### Department
`id, name, code, head_id (FK -> Employee, nullable), parent_department_id (FK -> Department, nullable), status (Active/Inactive)`

### Category
`id, name, warranty_period (nullable), extra_fields (jsonb — for category-specific fields)`

### Employee
`id, name, email (unique), password_hash, department_id (FK -> Department), role (Admin/AssetManager/DepartmentHead/Employee), status (Active/Inactive)`

### Asset
`id, asset_tag (unique, auto-generated e.g. AF-0001), name, category_id (FK), serial_number, acquisition_date, acquisition_cost, condition, location, photo_url (nullable), is_bookable (bool), status (Available/Allocated/Reserved/UnderMaintenance/Lost/Retired/Disposed), department_id (FK, nullable)`

### Allocation
`id, asset_id (FK), employee_id (FK, nullable), department_id (FK, nullable), allocated_date, expected_return_date (nullable), actual_return_date (nullable), condition_notes_on_return (nullable), status (Active/Returned)`

### TransferRequest
`id, asset_id (FK), from_employee_id (FK), to_employee_id (FK), reason, status (Requested/Approved/Rejected/Reallocated), requested_by (FK), approved_by (FK, nullable), created_at`

### Booking
`id, resource_asset_id (FK -> Asset where is_bookable=true), booked_by_employee_id (FK), start_time, end_time, status (Upcoming/Ongoing/Completed/Cancelled)`

### MaintenanceRequest
`id, asset_id (FK), raised_by_employee_id (FK), issue_description, priority (Low/Medium/High), photo_url (nullable), status (Pending/Approved/Rejected/TechnicianAssigned/InProgress/Resolved), technician_name (nullable), approved_by (FK, nullable)`

### AuditCycle
`id, scope_department_id (FK, nullable), scope_location (nullable), date_range_start, date_range_end, status (Open/Closed), created_by (FK)`

### AuditCycleAuditor
`id, audit_cycle_id (FK), auditor_employee_id (FK)` — many-to-many, an audit cycle can have multiple auditors

### AuditFinding
`id, audit_cycle_id (FK), asset_id (FK), auditor_id (FK -> Employee), expected_location, verification_status (Verified/Missing/Damaged), notes (nullable)`

### Notification
`id, recipient_employee_id (FK), type (AssetAssigned/MaintenanceApproved/MaintenanceRejected/BookingConfirmed/BookingCancelled/BookingReminder/TransferApproved/OverdueReturn/AuditDiscrepancy), message, is_read (bool), related_entity_type (nullable), related_entity_id (nullable), created_at`

### ActivityLog
`id, actor_employee_id (FK), action, entity_type, entity_id, details (jsonb, nullable), created_at`

## 6. Key Business Rules (this is what's judged — implement all of these)

1. Asset registration auto-generates a unique Asset Tag (`AF-0001`, `AF-0002`, ...).
2. **Allocation conflict:** an already-Allocated asset cannot be directly re-allocated — return `409` with "currently held by [name]" and surface the Transfer Request option instead of a dead end.
3. **Transfer workflow:** `Requested → Approved (Asset Manager / Dept Head) → Reallocated`. On approval: close old Allocation row (status=Returned), open a new one, log to allocation history automatically.
4. **Booking overlap:** reject any request whose `[start, end)` overlaps an existing Upcoming/Ongoing booking for the same resource. Back-to-back slots (10:00–11:00 right after 9:00–10:00) are allowed — only true overlaps are rejected.
5. **Maintenance workflow:** `Pending → Approved/Rejected (Asset Manager) → Technician Assigned → In Progress → Resolved`. Asset flips to `UnderMaintenance` on Approved, back to `Available` on Resolved (unless separately Retired).
6. **Audit cycle:** assign one or more auditors → each asset in scope marked Verified/Missing/Damaged → system auto-generates a discrepancy report for flagged items → Close Audit locks the cycle and updates asset statuses (`Missing` → asset status becomes `Lost`).
7. **Overdue detection:** any Allocation past `expected_return_date` and still `Active` = overdue → surfaced on Dashboard (separated from upcoming) + Notification fired. Same overdue pattern applies conceptually to Bookings nearing their slot.
8. Role assignment happens ONLY through Admin → Employee Directory → promote. Signup never lets a user pick a role.
9. Every Compliance-style workflow action (approve/reject/close) writes an ActivityLog row — this is what powers Screen 10.

## 7. API Routes (grouped by module)

**Auth**
`POST /auth/signup` (Employee only) · `POST /auth/login` · `POST /auth/forgot-password`

**Org Setup (Admin only)**
`GET/POST/PUT /departments` · `GET/POST/PUT /categories` · `GET /employees` · `PATCH /employees/:id/promote`

**Assets**
`GET /assets` (filters: tag, serial, category, status, department, location) · `POST /assets` · `GET /assets/:id` (incl. allocation + maintenance history) · `PUT /assets/:id`

**Allocation & Transfer**
`POST /allocations` (409 on conflict) · `POST /allocations/:id/return` · `POST /transfer-requests` · `POST /transfer-requests/:id/approve` · `POST /transfer-requests/:id/reject`

**Booking**
`GET /assets/:id/bookings` (calendar view) · `POST /bookings` (overlap-checked) · `POST /bookings/:id/cancel`

**Maintenance**
`GET /maintenance-requests` (kanban, grouped by status) · `POST /maintenance-requests` · `POST /maintenance-requests/:id/approve` · `POST /maintenance-requests/:id/assign-technician` · `POST /maintenance-requests/:id/resolve`

**Audit**
`POST /audit-cycles` · `POST /audit-cycles/:id/auditors` · `POST /audit-findings` · `POST /audit-cycles/:id/close`

**Dashboard & Reports**
`GET /dashboard/kpis` · `GET /reports/utilization` · `GET /reports/maintenance-frequency` · `GET /reports/idle-assets` · `GET /reports/booking-heatmap` · `GET /reports/export?format=csv`

**Notifications & Logs**
`GET /notifications` (filters: all/alerts/approvals/bookings) · `PATCH /notifications/:id/read` · `GET /activity-logs`

## 8. Frontend Structure
```
src/
  components/     // Button, Modal, Table, KanbanCard, StatusBadge, CalendarSlotPicker
  pages/          // Login, Dashboard, OrgSetup, Assets, Allocation, Booking,
                  // Maintenance, Audit, Reports, Notifications
  api/            // axios client + one file per module
  hooks/          // useAuth, useFetch, useDebounce (for search)
  utils/          // formatters, validators, status-color mapping, constants
  context/        // AuthContext (JWT + role, drives RBAC-gated UI)
```

## 9. Backend Structure
```
src/
  routes/         // one router per module
  controllers/    // business logic per module
  middleware/     // auth.js (JWT verify), rbac.js (role check), validate.js
  prisma/         // schema.prisma, migrations/, seed.js (bootstrap admin FIRST)
  utils/          // response formatter, asset-tag generator, overlap-checker, activity-logger
```

## 10. Screen → Module Mapping

| # | Screen | Primary owner |
|---|---|---|
| 1 | Login / Signup | Frontend (Yash) + Backend (Person 2) |
| 2 | Dashboard | Frontend (Yash), KPI endpoint by Backend (Person 2) |
| 3 | Organization Setup (Admin) | Backend (Person 2) + Frontend (Yash) |
| 4 | Asset Registration & Directory | Backend (Person 2) + Frontend (Yash) |
| 5 | Asset Allocation & Transfer | Backend (Person 2) + Frontend (Yash) |
| 6 | Resource Booking | Backend (Person 2) + Frontend (Yash) |
| 7 | Maintenance Management (kanban) | Person 4 (afternoon) |
| 8 | Asset Audit | Person 4 (afternoon) |
| 9 | Reports & Analytics | Person 4 (afternoon) |
| 10 | Activity Logs & Notifications | Person 4 (afternoon) |

DB schema for ALL modules (including 7–10) is designed upfront by Person 3 in the morning, so Person 4 has real tables to build against at 1 PM — not waiting on schema mid-afternoon.

## 11. Non-Functional Requirements
- Consistent JSON response shape across every route (see AGENTS.md).
- Passwords hashed via bcrypt, never returned in any API response.
- Input validation via Zod (or Joi) schemas on the backend — frontend validation is UX only, never trusted alone.
- CORS restricted to the frontend origin.
- Every workflow transition (approve/reject/close) logged to ActivityLog for Screen 10.
