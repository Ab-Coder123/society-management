# Architecture and Technical Decisions

## System Architecture

The Society Management System is a MERN application:

- `backend/`: Express.js API, MongoDB/Mongoose models, middleware, controllers, routes, tests, and seed script.
- `frontend/`: React/Vite application, role-based pages, shared components, API client, and design tokens.

The backend exposes REST APIs under `/api/*`. The frontend authenticates users, stores the session through the auth context, and routes each role to the correct dashboard.

## Multi-Tenant Architecture

The central architecture pattern is shared collections with tenant isolation.

`Society` is the tenant. Most operational models include a required `societyId` field. That includes users other than `super_admin`, flats, notices, complaints, notifications, visitors, payments, parking slots, facility bookings, events, and staff records.

For non-super-admin users, the backend never trusts `societyId` from the request body. The `scopeToTenant` middleware overwrites `req.societyId` and `req.body.societyId` from the authenticated user's own society. This prevents a user from changing a request payload or URL to access another society's data.

`super_admin` is the only platform-level role that may operate without a fixed `societyId`.

## 4-Layer Authorization Chain

Protected routes follow this security model:

1. Authentication: `authenticate` verifies the JWT, loads the active user, and attaches it to `req.user`.
2. Role authorization: `authorize(...)` checks whether the user's role is allowed to call the route.
3. Tenant authorization: `scopeToTenant` assigns the effective `req.societyId`.
4. Resource authorization: `belongsToTenant(doc, req)` confirms a specific fetched document belongs to the user's society before it is returned or changed.

This chain is used to protect against both direct unauthorized route access and cross-tenant data leakage.

## Database Schema Overview

| Model | Purpose | Key Relationships |
| --- | --- | --- |
| `Society` | Tenant record for a residential society. | Referenced by `societyId` in tenant-scoped models. |
| `User` | One collection for all five roles. | References `Society` through `societyId`; owners/residents may reference `Flat` through `flatId`. |
| `Flat` | Apartment/unit record. | Belongs to `Society`; references owner/resident users. |
| `Notice` | Society announcements. | Belongs to `Society`; references creator `User`. |
| `Complaint` | Issue tracking and resolution workflow. | Belongs to `Society`; references raiser `User`, optional `Flat`, optional assigned `User`, and comment authors. |
| `Notification` | In-app alerts for users. | Belongs to `Society`; references target `User` and related record id. |
| `Visitor` | Visitor approvals and gate logs. | Belongs to `Society`; references `Flat`, approving `User`, and security guard logger. |
| `Payment` | Maintenance and other flat charges. | Belongs to `Society`; references `Flat` and owner `User`; unique per society, flat, and month. |
| `ParkingSlot` | Parking inventory and vehicle allocation. | Belongs to `Society`; may reference an allocated `Flat`. |
| `FacilityBooking` | Facility reservation slots. | Belongs to `Society`; references `Flat` and booking `User`; unique per society, facility, date, and slot. |
| `Event` | Community events. | Belongs to `Society`; references creator `User`; stores RSVP user references. |
| `Staff` | Staff directory for society operations. | Belongs to `Society`. |

## Folder Structure

```text
backend/
  scripts/
    seed.js
  src/
    app.js
    server.js
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
  tests/
    unit/
    integration/

frontend/
  src/
    api/
    components/
    context/
    pages/
      Owner/
      Resident/
      Security/
      SocietyAdmin/
      SuperAdmin/
    routes/
    styles/
```

Important backend areas:

- `models/`: Mongoose schemas and indexes.
- `middleware/auth.js`: JWT authentication and role authorization.
- `middleware/tenant.js`: tenant scoping and resource ownership helpers.
- `controllers/`: business logic for each module.
- `routes/`: route definitions and middleware composition.
- `utils/notify.js`: in-app notification creation.
- `utils/whatsapp.js`: mock/live WhatsApp alert utility.
- `tests/`: unit and integration tests.

Important frontend areas:

- `context/AuthContext.jsx`: login/session state.
- `routes/ProtectedRoute.jsx`: role-aware route protection.
- `pages/`: dashboards and module screens grouped by role.
- `components/`: shared UI such as cards, tables, badges, modals, forms, and sidebars.
- `styles/tokens.js`: design token definitions.

## Key Technical Decisions

### One User Model for All Roles

The system uses one `User` collection with a `role` field instead of separate collections for admins, owners, residents, and guards.

Rationale:

- Login, password hashing, active/inactive status, phone, email, and tenant scoping are shared concerns.
- Role checks can be centralized in middleware.
- Cross-role references are simpler because other models can reference `User`.
- Adding a new role later is easier than creating another user collection and auth flow.

### `societyId` Isolation Instead of Separate Databases

The app uses one database with shared collections and tenant-scoped records.

Rationale:

- Easier to run, deploy, and maintain for many societies.
- Shared schemas and indexes keep behavior consistent.
- Platform-level super admin workflows can operate across societies.
- Tenant filtering can be tested consistently in controllers and integration tests.

### Backend-Owned State Machines

Complaint transitions are defined on the backend in `complaintStateMachine.js`. The frontend fetches valid transitions from `GET /api/complaints/state-machine`.

Rationale:

- Prevents frontend/backend drift.
- Keeps business rules in one source of truth.
- Makes state transition tests straightforward.

### Aggregation for Summaries

The code uses MongoDB aggregation where summary performance matters, such as flat occupancy summaries and payment summaries.

Rationale:

- Aggregation lets MongoDB group and summarize records close to the data.
- It avoids loading large collections into Node.js just to count or total them.
- It scales better for dashboard-style metrics.

Some report endpoints in `reportController.js` currently use `find()` plus in-memory calculations. Those are acceptable for simple reports in the current project size, but the same aggregation pattern used in `flatController.js` and `paymentController.js` should be preferred if report volume grows.

### Non-Blocking Notifications

Notification and WhatsApp helpers are designed so failures do not break the main user workflow.

Rationale:

- A complaint status update or visitor action should not fail only because an alert failed.
- Notification reliability can be improved later with a queue, retries, and monitoring.

## Local Setup

### Prerequisites

- Node.js 18 or newer.
- MongoDB Atlas or a local MongoDB connection string.

### Backend

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/society-management?retryWrites=true&w=majority
JWT_SECRET=change_me_to_a_long_random_secret
JWT_EXPIRES_IN=7d
WHATSAPP_MODE=mock
WHATSAPP_API_URL=https://graph.facebook.com/v19.0
WHATSAPP_API_TOKEN=your_whatsapp_api_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

Seed data:

```bash
npm run seed
```

Run the backend:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=
```

Use an empty value for local development if using the Vite proxy. Set it to the deployed backend URL in production.

Run the frontend:

```bash
npm run dev
```

Open the Vite URL, typically `http://localhost:5173`.

## Test Credentials

These credentials are defined in `backend/scripts/seed.js`.

| Role | Email | Password | Initial Route |
| --- | --- | --- | --- |
| `super_admin` | `superadmin@societyms.com` | `Admin@1234` | `/super-admin` |
| `society_admin` | `admin@greenvalley.com` | `Admin@1234` | `/society-admin` |
| `owner` | `owner@greenvalley.com` | `Owner@1234` | `/owner` |
| `resident` | `resident@greenvalley.com` | `Resident@1234` | `/resident` |
| `security_guard` | `guard@greenvalley.com` | `Guard@1234` | `/security` |

## Deployment Notes

The repository includes deployment preparation rather than a committed live URL:

- Frontend: deploy `frontend/` to Vercel, build with `npm run build`, output `dist`.
- Vercel SPA routing is configured in `frontend/vercel.json`.
- Backend: deploy `backend/` to Render or Railway, start with `npm start`.
- Production backend variables should be set in the hosting provider, not committed to the repo.
