# AGENTS.md — AssetFlow (Odoo Hackathon 2026)

## Problem Statement
**AssetFlow — Enterprise Asset & Resource Management System.**
Org sets up departments/categories/employees → registers assets → allocates them to employees/departments (with conflict-blocking + transfer requests) → books shared resources by time slot (with overlap validation) → routes maintenance requests through an approval workflow → runs periodic audit cycles → everything surfaces on a KPI dashboard with notifications and reports. Full entity/rule breakdown in `architecture.md`.

## Timeline (locked, from event schedule)
- 08:30 AM — PS assigned ✅ (AssetFlow)
- 09:00 AM — Coding starts, repo live, add GitHub repo link in submit-solution form
- 10:00 AM — Add evaluator as GitHub collaborator (hard deadline)
- 05:00 PM — Coding stops
- 05:45 PM — Submit video link

## Goal
Implement **all 10 screens** from the wireframe — not a trimmed version. If time gets tight near 4 PM, cut in this order: photo/document upload → email-style reminders → PDF export (CSV export is enough) → audit/report chart polish. Never cut: RBAC, allocation-conflict block, booking-overlap validation, or maintenance workflow — those are the core of what's being judged.

## Team & Work Split

**Morning (09:00 AM – ~01:00 PM) — 3 people in parallel:**

| Person | Owns | Branch |
|---|---|---|
| Yash | Frontend — all screens per wireframe, design system, routing, forms | `feature/frontend` |
| Person 2 | Backend API core — Auth/RBAC, Org Setup (Dept/Category/Employee), Assets, Allocation & Transfer, Booking | `feature/backend-api` |
| Person 3 | Database design — full schema for ALL 10 screens' entities, Prisma migrations, seed script (incl. bootstrap admin — see gotcha below) | `feature/db-schema` |

**Afternoon — 4th person, staggered on purpose:**

| Person | Owns | Branch |
|---|---|---|
| Person 4 | **Morning (09:00–01:00):** deep-analyze the full wireframe screen-by-screen — write out exact business rules/edge cases for Maintenance, Audit, Reports, Notifications; review teammates' schema/API as they build for gaps vs. wireframe. **Afternoon (01:00 onward):** build Maintenance kanban, Audit Cycle screen, Reports & Analytics screen, Activity Logs & Notifications — wired to real data from the other 3 modules. | `feature/audit-reports-notifications` |

This sequencing is intentional: Maintenance/Audit/Reports/Notifications all *consume* data from Assets/Allocation/Booking, so there's nothing real to build against until those exist. Person 4's morning isn't wasted time — catching a missed validation rule or inconsistent status value now is worth more than premature code, and it means the afternoon build goes in clean on the first pass.

## Tech Stack (locked)
- **Frontend:** React (Vite) + TailwindCSS
- **Backend:** Node.js + Express
- **ORM:** Prisma
- **Database:** PostgreSQL (local/self-hosted — NOT Supabase/Firebase/Mongo Atlas)
- **Auth:** JWT + bcrypt, RBAC via middleware
- No BaaS. No static JSON in the final build (early prototyping only, must be gone by submission).

## Critical Setup Gotcha — read this first
Per the wireframe: **signup always creates an Employee account only**, no role picker. Admin promotes people to Department Head / Asset Manager *from inside the app* (Employee Directory screen). That means someone has to already BE Admin before anyone can be promoted — impossible to bootstrap through the UI alone.

**Fix:** the DB seed script must create one Admin account directly (hashed password, `role = Admin`) before anything else. Person 3 (DB owner) — make this the very first line of `seed.js`. Without it the whole app is unusable after signup.

## Code Quality Standards
- Every non-trivial function: one-line comment explaining *why*, not *what*.
- No leftover `console.log` / debug code in final commits.
- Naming: `camelCase` (JS vars/functions), `PascalCase` (components/classes), `snake_case` (DB columns/tables).
- Shared logic (validators, status-transition helpers, API client, asset-tag generator) → `/utils`.
- Every API route: validate input → run business logic → return consistent response shape.
  - Success: `{ success: true, data: ... }`
  - Error: `{ success: false, message: "specific, human-readable error" }`
- Correct HTTP status codes: 400 (validation), 401/403 (auth), 404 (not found), 409 (conflict — double allocation, booking overlap), 500 (server).
- Status values (Asset status, Trip-like workflow states, etc.) as enums/constants — never magic strings scattered across files.

## Git Setup (run this now)
```bash
mkdir assetflow && cd assetflow
git init
echo "node_modules/
.env
*.log
dist/
build/
.DS_Store" > .gitignore
git add .gitignore
git commit -m "chore: init repo"

git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main

git checkout -b dev
git push -u origin dev

git checkout -b feature/frontend
git checkout dev
git checkout -b feature/backend-api
git checkout dev
git checkout -b feature/db-schema
git checkout dev
git checkout -b feature/audit-reports-notifications
git checkout dev
```
- Everyone works on their own feature branch, PRs into `dev`.
- Merge `dev` → `main` only after integration-testing together, ideally in the last 1–1.5 hrs.
- Commit format: `[module] short description` → e.g. `[backend] add allocation conflict check`
- Add evaluator as GitHub collaborator by **10:00 AM sharp** — don't forget, it's a hard checkpoint.

## Validation & Error Handling (non-negotiable — this is what's being judged)
- Every input validated on frontend (instant feedback) AND backend (source of truth).
- Specific messages: "Email is not valid", never generic "Error occurred".
- Double-allocation block: return 409 with "Currently held by [name]" + trigger the Transfer Request flow instead of a dead end.
- Booking overlap: reject with a clear message showing the conflicting slot.
- No silent failures — every action gives visible feedback (toast/inline message).

## Definition of Done (per feature)
- [ ] Works end-to-end against real Postgres data (not mocked/static)
- [ ] Matches the wireframe screen — layout, fields, flow
- [ ] Inputs validated, edge cases handled (conflicts, overlaps, expired states)
- [ ] Committed with a clear message, merged into `dev`
- [ ] Sanity-tested by a teammate other than the author

## Not doing yet
README — writing this last, once the app is functionally done and we know exactly what setup steps to document.
