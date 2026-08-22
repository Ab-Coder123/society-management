# Day 6-9 — Primary Modules | 10-Tier Prompt Set for Gemini

> **الفوكس:** Society/Flat Management (تعميق) + Complaint Management (تعميق) + Notice Management (كامل من الصفر).
> **إزاي تستخدمه:** ابعت كل Tier في رسالة منفصلة، بالترتيب. ارفق كل ملفات الـ backend/frontend الموجودة من Day 1-2 و Day 3-5 مع كل رسالة. متبعتش Tier جديد غير بعد ما تتأكد اللي قبله شغال فعلاً (شغّل الكود، جرب الـ endpoints).

---

## 🧱 Tier 1 — Notice Model + Backend CRUD

```
You are a Senior Backend Engineer continuing an existing MERN multi-tenant 
project "Society Management System". 

Attach as context: models/Notice.js, middleware/auth.js, middleware/tenant.js, 
and complaintController.js/complaintRoutes.js as the reference pattern.

Task: Build full CRUD for the Notice module (currently only the model exists 
from Day 1-2, no controller/routes yet).

Requirements:
1. controllers/noticeController.js:
   - createNotice (society_admin only, auto-scoped to req.societyId)
   - getNotices (any authenticated role in the society; support ?category= filter; 
     auto-exclude notices where expiresAt < now unless ?includeExpired=true)
   - getNoticeById (belongsToTenant check)
   - updateNotice (society_admin only, must be the original createdBy or any 
     society_admin of that society)
   - deleteNotice (society_admin only, hard delete is fine here — notices aren't 
     historical records like complaints)

2. routes/noticeRoutes.js — same middleware chain pattern as complaintRoutes.js.

3. Register the router in server.js (uncomment the placeholder line).

Rules:
- Never trust societyId from req.body for non-super_admin — use req.societyId
- Validate expiresAt is not in the past when creating
- Sort getNotices by createdAt descending by default

Output: complete file contents, ready to save directly.
```

---

## 🏢 Tier 2 — Society & Flat: Advanced Queries

```
Continuing the same project. Attach societyController.js and flatController.js 
from Day 3-5.

Task: Extend Society/Flat beyond basic CRUD with the queries the frontend 
dashboards will actually need this phase.

Requirements:
1. Add to flatController.js:
   - getFlatOccupancySummary — counts by occupancyStatus (occupied/vacant/rented) 
     for the calling society_admin's society, used for dashboard stat cards
   - getFlatsByBuilding — grouped response { building: [...flats] } for a 
     building-picker UI
   - searchFlats — filter by flatNumber or ownerName (populate owner name via 
     a Mongo aggregation or populate + filter)

2. Add to societyController.js:
   - getSocietyStats (super_admin only) — total societies, total flats across 
     all societies, total active users, grouped by society for a platform-level 
     overview dashboard

Rules:
- Use Mongo aggregation pipelines where a simple .find() + filter would be 
  inefficient (e.g. occupancy summary should be one aggregate query, not 
  fetch-all-then-count in JS)
- All queries still respect tenant scoping (except super_admin's platform stats)

Output: the new functions to add to each controller file, plus the matching 
new routes to add to flatRoutes.js/societyRoutes.js.
```

---

## 📋 Tier 3 — Complaint Workflow: Status Machine

```
Continuing the same project. Attach models/Complaint.js and the existing 
complaintController.js.

Task: Implement the full complaint lifecycle as a proper state machine, not 
just a free-form status field update.

Requirements:
1. Define the allowed transitions explicitly:
   raised → assigned → in_progress → resolved → closed
   (also: raised/assigned/in_progress → can be reopened back to "assigned" 
   once, track a reopenCount field)

2. controllers/complaintController.js — add:
   - assignComplaint (society_admin only — sets assignedTo + status='assigned')
   - updateComplaintStatus (validates the transition against the state machine; 
     reject invalid jumps like raised→resolved directly, with a clear error 
     message listing the valid next states)
   - addComplaintComment (any role that can see the complaint — owner/resident 
     who raised it, or society_admin/assignee)
   - reopenComplaint (only the original raiser, only if status is resolved/closed, 
     max 1 reopen — enforce with reopenCount)

3. Add reopenCount field to the Complaint model (default 0).

Rules:
- Centralize the state machine as a small config object/function 
  (complaintStateMachine.js) — don't hardcode transition logic inline in the 
  controller, so it's testable in isolation in Tier 8
- Every status change should append an automatic system comment 
  (e.g. "Status changed to in_progress by <user>") to the comments array

Output: complaintStateMachine.js, the updated Complaint model, and the updated 
controller/routes.
```

---

## 🔔 Tier 4 — Cross-Module Notifications (in-app, DB-backed)

```
Continuing the same project. Attach Notice, Complaint, User, Flat models and 
their controllers from Tiers 1-3.

Task: Build a lightweight in-app notification system that fires on the events 
this phase introduces (this is NOT the WhatsApp bonus feature — that's later; 
this is a simple DB-backed notification list each user can see).

Requirements:
1. models/Notification.js: societyId, userId (recipient), type 
   (enum: 'notice','complaint_status','complaint_assigned','complaint_comment'), 
   relatedId (the Notice/Complaint _id), message, isRead (default false).

2. utils/notify.js — a small helper createNotification(userId, societyId, type, 
   relatedId, message) other controllers call.

3. Wire it in:
   - noticeController.createNotice → notify all users in that society (or just 
     log a TODO comment if bulk-notify-everyone is deferred for performance — 
     explain the tradeoff)
   - complaintController.assignComplaint → notify the assignee
   - complaintController.updateComplaintStatus → notify the original raiser
   - complaintController.addComplaintComment → notify the other party (raiser 
     if commenter is staff, assignee/admin if commenter is the raiser)

4. controllers/notificationController.js + routes: getMyNotifications 
   (paginated, newest first), markAsRead, markAllAsRead.

Rules:
- Notifications are tenant-scoped like everything else
- Don't block the main request on notification creation — call it but don't 
  let a notification failure fail the parent request (wrap in try/catch, log, 
  continue)

Output: complete new files plus the small additions to existing controllers.
```

---

## 🎨 Tier 5 — Frontend: Notice Module UI

```
Continuing the same project. Attach App.jsx, AuthContext.jsx, api/client.js, 
and the Notice routes/controller from Tier 1.

Task: Build the Notice UI across the relevant dashboards.

Requirements:
1. pages/SocietyAdmin/Notices.jsx — list with category filter tabs, "Create 
   Notice" modal (title, body, category, optional expiresAt), edit/delete actions.

2. pages/Owner/Notices.jsx and pages/Resident/Notices.jsx — read-only list, 
   newest first, category badge, "unread" visual indicator (cross-reference 
   with /api/notifications if built in Tier 4, otherwise just show all).

3. components/NoticeCard.jsx — shared presentational component reused across 
   all three of the above.

Rules:
- Reuse components/DataTable, Modal, StatCard from Day 3-5's Tier 5 if they exist
- Every form shows backend validation errors inline, not via alert()

Output: complete file contents for every file listed.
```

---

## 🎨 Tier 6 — Frontend: Complaint Workflow UI

```
Continuing the same project. Attach the complaint state machine and controller 
from Tier 3, plus existing frontend files.

Task: Build the Complaint UI reflecting the real state machine — this is the 
most interactive module so far.

Requirements:
1. pages/SocietyAdmin/Complaints.jsx — table with status filter tabs (matching 
   the state machine states), "Assign" action, status dropdown that only shows 
   VALID next states (fetch or hardcode the same transition map from Tier 3 — 
   note the duplication and suggest exposing it via a GET /api/complaints/state-machine 
   endpoint instead, then implement that endpoint too).

2. pages/Owner/Complaints.jsx and pages/Resident/Complaints.jsx — "Raise 
   Complaint" form (category, priority, title, description), their own 
   complaints list with status badges, comment thread view, "Reopen" button 
   (only visible when eligible per reopenCount).

3. components/ComplaintTimeline.jsx — visual status history using the 
   auto-generated system comments from Tier 3.

Rules:
- Status badges use distinct colors per state (raised/assigned/in_progress/
  resolved/closed) for quick scanning
- Comment thread auto-scrolls to latest, shows relative timestamps

Output: complete file contents for every file listed, plus the new backend 
GET /api/complaints/state-machine endpoint.
```

---

## 🧪 Tier 7 — Unit Tests: Business Logic

```
Continuing the same project. Attach complaintStateMachine.js from Tier 3 and 
the Flat occupancy aggregation from Tier 2.

Task: Write focused UNIT tests (no HTTP, no DB — pure function tests) for the 
business logic that's easy to get subtly wrong.

Requirements:
1. tests/unit/complaintStateMachine.test.js:
   - every valid transition succeeds
   - every invalid transition (e.g. raised→resolved, closed→in_progress) throws 
     with a message listing valid next states
   - reopen only allowed from resolved/closed, and only once (reopenCount check)

2. tests/unit/noticeExpiry.test.js:
   - a notice with expiresAt in the past is excluded by default, included with 
     ?includeExpired=true (test the filter-building function in isolation, not 
     the full route)

Rules:
- These are pure unit tests — mock/stub anything touching Mongo or Express req/res
- Aim for every branch of the state machine to be hit by at least one test

Output: complete test files, ready to run with `npm test`.
```

---

## 🧬 Tier 8 — Integration Tests: Full Request Chain

```
Continuing the same project. Attach the full tenant-isolation test suite from 
Day 3-5's Tier 4 as the pattern to extend, plus all controllers/routes built 
in Tiers 1-6 of this phase.

Task: Extend the integration test suite (Jest + Supertest) to cover this 
phase's new modules end-to-end through real HTTP requests.

Requirements — add these test files:
1. tests/integration/notices.test.js:
   - society_admin creates a notice → all roles in that society can read it
   - a notice created in Society A is invisible to Society B's users
   - non-society_admin cannot create/delete a notice (403)
   - expired notice excluded from default GET, included with ?includeExpired=true

2. tests/integration/complaints-workflow.test.js:
   - full happy path: owner raises → society_admin assigns → assignee moves 
     to in_progress → resolved → closed
   - invalid transition attempt returns 400 with the valid-next-states message
   - owner cannot assign a complaint (403)
   - reopen works once, fails the second time
   - a comment added to Society A's complaint is not visible via Society B's 
     equivalent complaint ID (tenant isolation still holds for complaints)

3. tests/integration/notifications.test.js (if Tier 4 was built):
   - assigning a complaint creates a notification for the assignee
   - marking as read updates isRead and doesn't affect other users' notifications

Rules:
- Reuse the Society A / Society B seed pattern from Day 3-5's test setup
- Every test asserts status code AND that no cross-tenant data leaked in the response

Output: complete test file contents.
```

---

## 📊 Tier 9 — Verification Report Generator

```
Continuing the same project. Attach the full test suite from Tiers 7-8.

Task: Don't just run the tests — produce a structured VERIFICATION REPORT I 
can read to confirm this phase is actually done correctly, since I can't 
review every line of code myself.

Requirements:
1. Run the full test suite (unit + integration) and capture the real output — 
   do not fabricate results.

2. Produce docs/day6-9-verification-report.md containing:
   - Test summary table: total tests, passed, failed, skipped, per test file
   - For every FAILING test: the exact error, the file/line it points to, and 
     your proposed fix
   - A manual checklist cross-referencing this phase's requirements against 
     what was actually implemented:
     [ ] Notice CRUD complete and tenant-scoped
     [ ] Complaint state machine enforces valid transitions only
     [ ] Complaint reopen logic capped at 1
     [ ] Notifications fire for the 4 specified events
     [ ] Flat occupancy summary uses aggregation, not fetch-all
     [ ] All new routes follow Authentication → Role → Tenant → Resource pattern
   - Any known gaps or things deferred, stated explicitly — don't hide them

3. If any test fails, FIX the actual code (not the test) unless the test itself 
   is wrong — and say explicitly which one you did and why.

Rules:
- This report must reflect what genuinely happened when you ran the suite, 
  not an optimistic summary
- If you cannot execute tests in your environment, say so explicitly and 
  instead do a manual code trace against each requirement, marking it 
  "verified by code review" vs "verified by test run"

Output: the verification report file, plus any corrected code files if bugs 
were found and fixed.
```

---

## 🏆 Tier 10 — Self-Score Against the Assessment Rubric

```
Continuing the same project. Attach docs/day6-9-verification-report.md from 
Tier 9, and the original Brand Pixel Agency assessment PDF's evaluation 
criteria (paste it):

Requirement Understanding: 10%
MERN Implementation: 25%
Multi-Tenancy & RBAC: 20%
Functionality: 15%
UI/UX: 10%
Code Quality: 10%
Git, Documentation & Deployment: 10%

Task: Score ONLY the work completed in Day 6-9 (Notice, Complaint workflow, 
Flat/Society extensions, notifications) against the categories that phase 
actually touches — don't score the whole project, just this increment.

Requirements:
1. For each relevant category, give a score out of that category's max 
   (scaled to this phase's scope) with a one-paragraph justification citing 
   SPECIFIC files/functions as evidence — not generic praise.

2. Explicitly call out:
   - Any place code quality is weaker than the rest (duplication, missing 
     validation, inconsistent naming vs earlier phases)
   - Any place tenant isolation could still theoretically leak (be paranoid here — 
     this is worth 20%)
   - Anything that would embarrass this candidate in the "explain your technical 
     decisions" evaluation criterion if asked live

3. Give one overall readiness verdict: "Ready for Day 10-12" / "Needs fixes 
   first" — with a bullet list of exactly what to fix if the latter.

Rules:
- Be harsh and specific, not encouraging — the goal is catching real gaps 
  before a human reviewer does, not feeling good about the work
- Do not give a numeric score without at least one concrete code citation 
  backing it

Output: docs/day6-9-self-score.md with the full breakdown.
```

---

## ✅ بعد الـ 10 Tiers

رجعلي بالـ verification report والـ self-score، وهنراجعهم مع بعض قبل ما ننتقل لـ Day 10-12 (Operations: Visitor Management + Payments + Parking).
