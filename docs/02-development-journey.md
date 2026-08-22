# Development Journey

This document summarizes the actual project journey using the current codebase, git history, README, seed script, and previous verification reports in `docs/`.

The git history is compact rather than a commit-per-day timeline. Most implementation landed in commit `9f0d015` (`feat: complete multi-tenant society management system with custom design system and full RBAC`). Later commits focused on audit, `.gitignore`, Vercel SPA routing, repository cleanup, and deployment preparation. The phase structure below follows the project reports and the implemented modules.

## Day 1-2: Planning and Setup

The early plan was to build a multi-tenant MERN application for residential society operations instead of a single-society demo app. Before the main implementation, the project structure was defined around:

- A backend Express API under `backend/src`.
- A React/Vite frontend under `frontend/src`.
- MongoDB models for the core society domain.
- Five fixed roles: `super_admin`, `society_admin`, `owner`, `resident`, and `security_guard`.
- Tenant isolation using a `societyId` field across society-scoped records.
- Role-based dashboards and protected frontend routes.

The key design decision from this phase was that the product should support multiple societies from the start. That decision shaped the database schema, middleware, route authorization, seed data, and test strategy.

## Day 3-5: Core Foundation

The foundation focused on authentication, authorization, and tenancy. The backend implemented JWT-based login, bcrypt password hashing, a shared `User` model for all five roles, and route-level authorization middleware.

The important security pattern established here was the 4-layer chain:

1. Authentication: verify the JWT and load the active user.
2. Role authorization: allow only permitted roles into each route.
3. Tenant scoping: force non-super-admin users into their own `societyId`.
4. Resource ownership checks: verify a fetched record belongs to the caller's society before returning or modifying it.

This phase also created the base domain models for societies, flats, users, and related operational data. The frontend foundation included login, protected routes, role-based dashboards, API client setup, and reusable UI components.

## Day 6-9: Primary Modules

The Day 6-9 reports show the primary modules centered on notices, complaints, notifications, and flat summaries.

Implemented work included:

- Notice CRUD for society admins.
- Read-only notice feeds for owners and residents.
- Notice categories and expiry filtering.
- Complaint creation and management.
- A backend complaint state machine: `raised -> assigned -> in_progress -> resolved -> closed`.
- A one-time complaint reopen rule.
- Complaint comments and timeline display.
- In-app notifications for complaint assignment, status changes, comments, and reopen events.
- Flat occupancy summaries using MongoDB aggregation.
- Integration tests for notices, complaints, notifications, and tenant isolation.

Two real challenges were documented and addressed:

- Frontend/backend state-machine drift risk: the frontend does not hardcode complaint transitions. It calls `GET /api/complaints/state-machine`, so valid transition options come from the backend configuration.
- Notification failure isolation: the notification helper uses a non-blocking `try/catch` pattern so a notification failure does not break the main complaint workflow. An audit later observed timeout messages during one test scenario, which confirmed the main request stayed protected even when notification creation failed.

Verification reports recorded 32 passing tests across the Day 6-9 unit and integration suites.

## Day 10-12: Operations

The operations phase expanded the app into day-to-day society workflows: visitors, security guard gate operations, payments, and parking.

Implemented work included:

- Visitor pre-approval by owners and residents.
- Visitor status flow: `pending -> approved -> checked_in -> checked_out`.
- Security guard visitor check-in/check-out.
- Walk-in visitor and delivery logging.
- Security guard RBAC tests confirming no access to payments or complaints.
- Payment creation for single flats and bulk monthly charges.
- Duplicate payment handling for the same flat and month.
- Payment overdue detection.
- Payment summaries using MongoDB aggregation.
- Parking slot creation and allocation.
- Double-booking prevention for parking slots.
- Vehicle plate verification for gate operations.

The main real challenge in this phase was role boundary enforcement for security guards. The tests verify that `security_guard` users cannot access payment or complaint routes and that visitor responses expose only limited resident fields needed for gate work.

The Day 10-12 verification report recorded 57 passing tests across 14 test suites.

## Day 13-14: Enhancements and QA

The audit document for Day 13-15 identified several important final-phase tasks. The current codebase shows that those tasks were acted on in the final implementation:

- Facility booking was added with unique slot protection.
- Community events were added with RSVP support.
- Staff management was added.
- Reports pages and report API routes were added.
- A WhatsApp notification utility was added with `mock` and `live` modes.
- The seed script was updated to include test accounts for all five roles, including `security_guard`.
- `.env.example` files were added for backend and frontend setup.
- `.gitignore` was added to prevent committing `.env`, dependencies, and build output.

The most serious documented challenge was MongoDB credential exposure in an earlier packaged project state. The documented fix was to add `.gitignore`, use `.env.example` only for templates, and rotate real database credentials outside the repository. The current repository includes `.gitignore` and environment templates rather than committed secret values.

Another documented challenge was the notification timeout behavior seen during testing. The system kept the parent workflow from failing by keeping notifications non-blocking. For a larger production environment, the existing docs also note that a background queue would be the next scalability improvement for high-volume notification dispatch.

## Day 15: Deployment

The final phase prepared the project for deployment and repository submission.

Evidence in the repo shows:

- `frontend/vercel.json` configures SPA rewrites for Vercel so direct route refreshes load `index.html`.
- The README documents deploying the frontend from `frontend/` to Vercel with `npm run build` and `dist` output.
- The README documents deploying the backend from `backend/` to Render or Railway with `npm start`.
- Backend production environment variables are documented in `backend/.env.example`.
- Frontend production API configuration is documented in `frontend/.env.example`.
- The final git commits include repository/deployment cleanup work.

No live production URL is committed in the repository, so this document describes deployment preparation rather than claiming a specific live deployment link.

## Final Verification Snapshot

The strongest recorded verification point is the Day 10-12 report:

- 57 total backend tests.
- 57 passing.
- 27 unit tests.
- 30 integration tests.
- Coverage across state machines, RBAC, tenant isolation, notices, complaints, notifications, visitors, payments, and parking.

The final codebase then adds the enhancement modules and deployment setup on top of that tested foundation.
