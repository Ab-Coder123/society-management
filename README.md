# Multi-Tenant Society Management System

A production-grade, multi-tenant MERN application built with Express.js, MongoDB Atlas, and React (Vite) featuring role-based access control (RBAC), multi-tenant data isolation, non-blocking WhatsApp alerts, pure aggregation reporting, and a custom token-based design system.

---

## 🏛️ Architecture Overview

- **Multi-Tenant Model:** Single Database with shared collections, isolated strictly via `societyId` tenant field. Every model except `Society` and `super_admin` carries a mandatory `societyId`.
- **4-Layer Authorization Chain:** Every endpoint request passes through:
  ```
  JWT Authentication → Role Authorization → Tenant Isolation → Resource Ownership Check
  ```
- **Strict Role-Based Access Control (5 User Roles):**
  1. `super_admin`: Global platform overview, onboard new residential societies, inspect system health.
  2. `society_admin`: Full management of society flats, payments, parking, staff, complaints, notices, facility bookings, community events, and aggregated analytics reports.
  3. `owner`: Manage flat maintenance payments/dues, file/track complaints, pre-approve visitors, reserve facilities, RSVP to community events, and view society notices.
  4. `resident`: Reserve facilities, RSVP to events, view notices, file complaints, and pre-approve visitors for their flat (No payment dues access).
  5. `security_guard`: Strictly scoped gate operations — verify visitor pass approvals, gate check-in/check-out, log walk-in deliveries, and verify vehicle plate clearance (zero access to payment, complaint, or financial records).

---

## 🔑 Demo Test Credentials

| Role | Email | Password | Dashboard Route |
| :--- | :--- | :--- | :--- |
| 🛡️ **Super Admin** | `superadmin@societyms.com` | `Admin@1234` | `/super-admin` |
| 🏢 **Society Admin** | `admin@greenvalley.com` | `Admin@1234` | `/society-admin` |
| 🔑 **Owner** | `owner@greenvalley.com` | `Owner@1234` | `/owner` |
| 🏠 **Resident** | `resident@greenvalley.com` | `Resident@1234` | `/resident` |
| 👮 **Security Guard** | `guard@greenvalley.com` | `Guard@1234` | `/security` |

---

## 📦 System Modules & Features

### 1. Multi-Tenant Core & Auth (`/api/auth`, `/api/societies`, `/api/flats`)
- JWT Authentication with bcrypt password hashing.
- Auto-scoped tenant isolation via `scopeToTenant` middleware (`req.societyId`).
- Flat occupancy summaries & building-wise breakdown via MongoDB `$facet` & `$group` aggregations.

### 2. Notice & Announcement Board (`/api/notices`)
- Role-based notice creation with auto-expiry filtering and category tags (`maintenance`, `utility`, `emergency`, `meeting`, etc.).

### 3. Complaint & Resolution Workflow (`/api/complaints`)
- Automated status state-machine (`raised` → `assigned` → `in_progress` → `resolved` → `closed`).
- Dynamic state-machine API endpoint (`GET /api/complaints/state-machine`) syncing valid status transitions to the frontend.
- Audit timeline logging and staff assignment.

### 4. Maintenance & Payment Dues (`/api/payments`)
- Single and bulk maintenance bill generation for all society flats.
- Due date tracking with automatic overdue badge detection.
- Monthly payment summary aggregations (`totalBilled`, `totalCollected`, `totalPending`).

### 5. Security & Gate Visitor Control (`/api/visitors`, `/api/parking`)
- Resident pre-approved visitor passes and security gate check-in/check-out.
- Walk-in visitor & courier entry logging by gate security.
- Bulk parking slot creation and vehicle plate verification (`/api/parking/verify-vehicle`).

### 6. Facility Booking & Reservations (`/api/facility`)
- Time-slot reservation for Gym, Clubhouse, Swimming Pool, Garden, and Visitor Parking.
- Unique compound indexes (`societyId`, `facilityName`, `date`, `slot`) preventing double-booking race conditions.

### 7. Community Events & Staff Management (`/api/events`, `/api/staff`)
- Community event creation with RSVP lists and max capacity checks.
- Staff registry for security, maintenance, housekeeping, electricians, and plumbers.

### 8. Analytics & Reports (`/api/reports`)
- Pure MongoDB aggregation pipeline endpoints (`/occupancy`, `/payments`, `/complaints`, `/visitors`).

### 9. Non-Blocking WhatsApp Alert Utility (`src/utils/whatsapp.js`)
- Async notification alert dispatcher for high-priority visitor and complaint updates.

---

## 🎨 Design System

The frontend incorporates a custom design token architecture (`frontend/src/styles/tokens.js`) and reusable base components:
- **Design Tokens:** 8px spacing grid, curated HSL & Slate color palettes, typography scale, radii, shadows, and status maps.
- **Base Components:** `Button`, `Input`, `Select`, `Card`, `Badge`, `Modal`, `Table`, `StatCard`, `Sidebar`, `NavItem`.

---

## 🧪 Testing & Verification

Comprehensive test suite verifying backend logic, RBAC rules, state machines, and multi-tenant isolation:

```bash
cd backend
npm test
```

**Results:** `57 / 57 tests passing (100% pass rate)`
- `27/27` Unit Tests
- `30/30` Integration Tests (MongoDB Atlas Cluster verified)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+
- MongoDB Atlas or local MongoDB instance

### 1. Database & Backend Setup
```bash
cd backend
npm install

# Create .env file with your connection strings:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster...
# JWT_SECRET=your_super_secret_jwt_key
# PORT=5000

# Seed rich sample data for all 5 user roles & 12 models:
npm run seed

# Run backend development server:
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run Vite dev server:
npm run dev
```
Open `http://localhost:5173` in your browser and log in with any demo credential above.

---

## 🌐 Production Deployment

- **Frontend (Vercel):** Deploy `frontend/` directory with build command `npm run build` and output `dist`.
- **Backend (Render / Railway):** Deploy `backend/` directory with start command `npm start`. Set environment variables `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`.
