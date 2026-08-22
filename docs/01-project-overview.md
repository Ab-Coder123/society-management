# Project Overview

## What This Project Solves

The Society Management System is a web application for managing residential societies, apartment communities, and gated housing compounds from one central platform.

In a typical residential society, daily operations are split across spreadsheets, WhatsApp messages, paper visitor registers, manual payment tracking, and informal complaint follow-ups. That creates repeated problems:

- Residents do not know where to raise issues or track updates.
- Admins spend time reconciling flats, dues, notices, parking, and staff activity manually.
- Security teams need fast gate-level information but should not see private or financial data.
- Owners need payment and property visibility even if they are not living in the flat.
- A platform operator needs to onboard and manage multiple societies without maintaining separate products.

This project brings those workflows into one role-based system where each user sees only the information and actions relevant to them.

## Users and Roles

The system supports five user roles.

| Role | What They Do |
| --- | --- |
| `super_admin` | Manages the platform at the highest level. They can onboard societies and view platform-level information across societies. |
| `society_admin` | Runs the day-to-day operations for one society: flats, notices, complaints, payments, visitors, parking, staff, facilities, events, and reports. |
| `owner` | Manages their flat-related responsibilities, especially payments, complaints, notices, visitors, facilities, and community events. |
| `resident` | Uses the resident portal for daily living needs such as notices, complaints, visitors, facility bookings, and events. Residents do not have payment-dues access in this implementation. |
| `security_guard` | Handles gate operations only: visitor verification, visitor check-in/check-out, walk-in logs, and vehicle verification. This role is deliberately blocked from complaints, payments, resident profiles, and financial data. |

## Why Multi-Tenant

The project is built as a multi-tenant system: one application can serve many societies while keeping each society's data isolated.

This is more valuable than creating a separate app for every society because it allows:

- Faster onboarding of new societies.
- One shared codebase to maintain and improve.
- Consistent security, reporting, and user experience across all societies.
- Lower hosting and maintenance cost.
- Easier platform-level administration by the super admin.

Each society acts like its own tenant. Users, flats, payments, visitors, complaints, notices, and operational records are scoped to a `societyId`, so one society cannot access another society's records.

## Core Modules

### Society and Flat Management

Society admins can manage the residential structure: societies, buildings, flats, owners, residents, and flat occupancy. The system also provides occupancy summaries and building-wise views so admins can understand which flats are occupied, vacant, or rented.

### Complaints

Owners and residents can raise complaints for issues such as maintenance, security, noise, cleanliness, or other society problems. Society admins can assign and update complaints through a controlled workflow. Users can follow status changes and comments through a complaint timeline.

### Notices

Society admins can publish notices for maintenance, meetings, utilities, emergencies, holidays, or general announcements. Owners and residents see a read-only notice feed. Expired notices are automatically filtered unless explicitly requested.

### Visitors

Owners and residents can create visitor entries for guests, deliveries, service providers, or other visits. Security guards can verify approved visitors, check them in, check them out, and log walk-in visits at the gate.

### Payments

Society admins can create maintenance charges for individual flats or bulk-create monthly charges for all flats. Owners can view their own flat payments. The system tracks paid, pending, and overdue dues and provides payment summaries.

### Parking

Society admins can create and allocate parking slots to flats, record vehicle numbers, prevent duplicate allocation of the same slot, and support vehicle verification for security operations.

## Additional Operational Modules

The final codebase also includes facility bookings, community events, staff management, reports, in-app notifications, and a mock/live WhatsApp alert utility.

## Technology Stack

This is a MERN application, built with modern web technologies commonly used for production business applications:

- MongoDB for flexible document-based data storage.
- Express.js and Node.js for backend APIs.
- React with Vite for a fast frontend application.
- JWT authentication and bcrypt password hashing for secure login.
- Mongoose for structured database models and relationships.
- Native Node.js tests and Supertest for backend verification.

At a business level, this stack is widely used because it supports fast development, scalable web APIs, responsive user interfaces, and maintainable full-stack JavaScript development.
