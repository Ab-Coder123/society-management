# Day 10-12 — Operations | 10-Tier Prompt Set for Gemini

> **الفوكس:** Visitor Management (كامل من الصفر) + Maintenance/Payments (كامل من الصفر) + Parking & Vehicle Management (bonus).
> **التحدي المحوري:** Security Guard role — صلاحيات ضيقة جداً، أول اختبار حقيقي للـ RBAC مع role غير admin/owner.
> **إزاي تستخدمه:** ابعت كل Tier في رسالة منفصلة بالترتيب. ارفق كل ملفات الفترات السابقة (Day 1-2, 3-5, 6-9) مع كل رسالة.

---

## 🚪 Tier 1 — Visitor Model + Backend CRUD

```
You are a Senior Backend Engineer continuing the "Society Management System" 
MERN multi-tenant project.

Attach as context: models/Visitor.js, models/Flat.js, middleware/auth.js, 
middleware/tenant.js, and complaintController.js as the reference pattern.

Task: Build full backend for Visitor Management (model already exists from 
Day 1-2, no controller/routes yet).

Requirements:
1. controllers/visitorController.js:
   - createVisitorRequest (owner/resident only — pre-approves an expected 
     visitor for their flat; status='pending' initially, or 'approved' if 
     self-approved by the resident directly)
   - getVisitors (society_admin sees all in society; security_guard sees only 
     today's + pending; owner/resident sees only their own flat's visitors)
   - approveVisitor (owner/resident of the relevant flat only — sets 
     status='approved', approvedBy=req.user._id)
   - rejectVisitor (owner/resident of the relevant flat only)
   - checkInVisitor (security_guard only — requires status='approved' first; 
     sets checkInTime, loggedBySecurity, status='checked_in')
   - checkOutVisitor (security_guard only — sets checkOutTime, status='checked_out')
   - getVisitorHistory (society_admin + security_guard — paginated, filterable 
     by date range)

2. routes/visitorRoutes.js — same middleware chain pattern.

3. Register in server.js.

Rules:
- A security_guard CANNOT check in a visitor that isn't 'approved' — enforce 
  this as a real validation, not just a frontend suggestion (return 400 with 
  a clear message if attempted)
- security_guard's getVisitors query must NEVER include payment, complaint, 
  or resident personal data beyond name/flat/phone needed for verification — 
  double check the response doesn't leak extra User fields via populate()
- Owner/resident can only approve/reject visitors for THEIR OWN flatId — 
  verify flatId ownership, not just societyId

Output: complete file contents, ready to save directly.
```

---

## 💰 Tier 2 — Payment Model + Backend CRUD

```
Continuing the same project. Attach models/Payment.js, models/Flat.js, and 
the existing controller pattern.

Task: Build full backend for Maintenance/Payments (model exists, no controller/
routes yet).

Requirements:
1. controllers/paymentController.js:
   - createCharge (society_admin only — creates a Payment record for a flat, 
     a specific month, amount, type; supports bulk creation for ALL flats in 
     the society for a given month in one call)
   - getPayments (society_admin sees all in society, filterable by status/month/
     flatId; owner sees only their own flat's payments)
   - markAsPaid (society_admin only — sets status='paid', paidAt=now; in a real 
     system this would integrate a payment gateway, but for this assessment a 
     manual "mark as paid" action is acceptable per the PDF's scope)
   - getOverduePayments (society_admin only — payments past a due date threshold 
     still status='pending', auto-computed, not a stored field)
   - getPaymentSummary (society_admin only — total collected vs pending for the 
     society this month, via aggregation)

2. routes/paymentRoutes.js — same middleware chain pattern. CRITICAL: 
   security_guard must have ZERO access to any payment route — verify this 
   explicitly with authorize()/checkPermission(), don't just rely on omission.

3. Register in server.js.

Rules:
- Reuse the existing unique index (societyId + flatId + month) from the 
  Payment model — bulk createCharge must handle the case where a charge for 
  that flat/month already exists (skip or error clearly, your choice, but 
  document which)
- getPaymentSummary must be a single aggregation query, not fetch-all-then-sum in JS

Output: complete file contents, ready to save directly.
```

---

## 🚗 Tier 3 — Parking & Vehicle Management (Bonus)

```
Continuing the same project. Attach models/Flat.js, models/Visitor.js, and 
the existing controller pattern.

Task: Build Parking & Vehicle Management from scratch (this is a BONUS module — 
not in the model layer yet at all).

Requirements:
1. models/ParkingSlot.js: societyId, slotNumber, type (enum: 'car','bike','guest'), 
   isAllocated, allocatedToFlatId (ref Flat, nullable), vehicleNumber (nullable).

2. controllers/parkingController.js:
   - createParkingSlots (society_admin only — bulk create, e.g. "create slots 
     A1-A20")
   - getParkingSlots (society_admin + owner/resident — scoped to society; 
     owner/resident sees allocation status but not other flats' vehicle numbers 
     beyond slot occupancy)
   - allocateSlot (society_admin only — assigns a slot to a flat + vehicle number)
   - deallocateSlot (society_admin only)
   - verifyVisitorVehicle (security_guard only — checks a vehicle number against 
     approved visitor records from Tier 1, returns match/no-match, does NOT 
     expose unrelated resident vehicle data)

3. routes/parkingRoutes.js — same middleware chain pattern.

4. Register in server.js.

Rules:
- Same tenant isolation discipline as every other module
- verifyVisitorVehicle should reuse/query the Visitor model from Tier 1, not 
  duplicate visitor data into ParkingSlot

Output: complete file contents, ready to save directly.
```

---

## 🎨 Tier 4 — Frontend: Security Guard Dashboard (full build)

```
Continuing the same project. Attach App.jsx, AuthContext.jsx, api/client.js, 
ProtectedRoute.jsx, and the Visitor + Parking routes from Tiers 1 and 3.

Task: This role's dashboard has been a placeholder since Day 1-2 — build it 
fully now, since Operations is the phase where Security Guard actually does work.

Requirements:
1. pages/Security/Dashboard.jsx — today's expected/approved visitors count, 
   pending check-ins, quick-access check-in/check-out.

2. pages/Security/VisitorLog.jsx — table of visitors (today by default, date 
   filter available), "Check In" button (only enabled if status='approved'), 
   "Check Out" button (only for checked_in visitors), a simple "Log Walk-in 
   Delivery" quick-add form (purpose='delivery').

3. pages/Security/VehicleVerify.jsx — simple input for a vehicle number, calls 
   verifyVisitorVehicle, shows match/no-match result clearly.

4. Confirm (and fix if needed) that NOTHING in the Security sidebar/nav links 
   to payments, complaints, or resident personal data — audit App.jsx's 
   security_guard route tree specifically for this.

Rules:
- This dashboard must visually/functionally make it obvious this role has a 
  narrow, task-focused scope — not a stripped-down copy of the admin dashboard
- Handle the "not approved yet" case gracefully in the UI, not just as a 
  disabled button with no explanation

Output: complete file contents for every file listed.
```

---

## 🎨 Tier 5 — Frontend: Owner/Resident Visitor + Payment UI

```
Continuing the same project. Attach the Visitor and Payment controllers/routes 
from Tiers 1-2, plus existing frontend files.

Task: Build the Owner/Resident-facing side of Visitor and Payment management.

Requirements:
1. pages/Owner/Visitors.jsx and pages/Resident/Visitors.jsx — "Expect a Visitor" 
   form (name, phone, purpose, optional vehicle number), list of their own 
   flat's visitor history with status badges, approve/reject actions for 
   pending requests.

2. pages/Owner/Payments.jsx (Resident does NOT get this — payments are owner-only 
   per the PDF's role table) — list of their flat's payment history, status 
   badges (pending/paid/overdue), total pending amount summary card.

3. components/VisitorStatusBadge.jsx and components/PaymentStatusBadge.jsx — 
   shared, reused wherever these statuses appear across roles.

Rules:
- Confirm Resident's sidebar genuinely has no Payments link/route at all — 
  don't just hide it with CSS, remove the route
- Visitor approve/reject actions must only appear for requests belonging to 
  the user's own flat

Output: complete file contents for every file listed.
```

---

## 🎨 Tier 6 — Frontend: Society Admin Operations UI

```
Continuing the same project. Attach Tiers 1-3's controllers/routes plus 
existing frontend files.

Task: Build the Society Admin's operational views — this is where they manage 
everything Tiers 1-3 introduced at the society level.

Requirements:
1. pages/SocietyAdmin/Payments.jsx — table with status/month filters, "Create 
   Charge" (single + bulk-for-all-flats modes), "Mark as Paid" action, 
   overdue-payments highlighted section, collection summary stat cards 
   (from getPaymentSummary).

2. pages/SocietyAdmin/Parking.jsx — grid or table of parking slots, "Create 
   Slots" bulk form, "Allocate"/"Deallocate" actions.

3. pages/SocietyAdmin/Visitors.jsx — society-wide visitor log (read/oversight 
   view — society_admin doesn't check people in, security_guard does), date 
   range filter.

Rules:
- Reuse DataTable/Modal/StatCard components already established in earlier phases
- Bulk "Create Charge" must show a clear confirmation before firing (this 
  creates many records at once — a misclick shouldn't be silent)

Output: complete file contents for every file listed.
```

---

## 🧪 Tier 7 — Unit Tests: Operations Business Logic

```
Continuing the same project. Attach the Visitor status flow, Payment 
aggregation logic, and Parking allocation logic from Tiers 1-3.

Task: Write focused unit tests for this phase's trickiest pure logic.

Requirements:
1. tests/unit/visitorStatusFlow.test.js — valid transitions only 
   (pending→approved→checked_in→checked_out; pending→rejected is terminal; 
   checked_in cannot go back to approved, etc.)

2. tests/unit/paymentOverdue.test.js — the overdue-computation function (given 
   a payment's month + today's date, correctly classifies pending vs overdue) 
   tested with edge cases: exactly on the due date, one day after, far future 
   month (should never be overdue).

3. tests/unit/parkingAllocation.test.js — cannot allocate an already-allocated 
   slot without deallocating first; deallocating clears both allocatedToFlatId 
   and vehicleNumber.

Rules:
- Pure function tests, no DB/HTTP
- Cover every branch, especially the "already checked in, trying to check in 
  again" and "trying to check out before checking in" edge cases

Output: complete test files, ready to run with `npm test`.
```

---

## 🧬 Tier 8 — Integration Tests: Full Request Chain + Security Guard RBAC

```
Continuing the same project. Attach the tenant-isolation test pattern from 
Day 3-5's Tier 4, and all controllers/routes from Tiers 1-3, 4, of this phase.

Task: Extend the integration suite. This phase's #1 risk is the Security Guard 
role's narrow permissions — test that boundary aggressively.

Requirements — add these test files:
1. tests/integration/visitor-workflow.test.js:
   - full happy path: resident creates request → self-approves (or owner 
     approves) → security_guard checks in → checks out
   - security_guard CANNOT check in a visitor still 'pending' (400, not 200)
   - security_guard CANNOT approve/reject a visitor request (403)
   - a Society A visitor is invisible to Society B's security_guard

2. tests/integration/security-guard-rbac.test.js (dedicated boundary test file):
   - security_guard GET /api/payments → 403, and confirm response body 
     contains NO payment data at all (not even an empty array with a 200)
   - security_guard GET /api/complaints → 403
   - security_guard GET /api/notices → confirm per the PDF's role table 
     whether this should be allowed (re-check the spec) and test accordingly
   - security_guard's GET /api/visitors response is checked field-by-field to 
     confirm no resident personal data beyond name/phone/flat is present

3. tests/integration/payment-workflow.test.js:
   - bulk createCharge for all flats in a month creates the correct count of 
     Payment records, skips/errors correctly on duplicates
   - owner can only see their own flat's payments, never another flat's in 
     the same society
   - resident (not owner) attempting GET /api/payments → verify against the 
     PDF's role table whether residents should have any payment visibility, 
     and test accordingly

4. tests/integration/parking-workflow.test.js:
   - allocating an already-allocated slot fails with a clear error
   - deallocate then reallocate to a different flat succeeds
   - verifyVisitorVehicle correctly matches an approved visitor's vehicle and 
     correctly reports no-match for an unrelated vehicle number

Rules:
- The security-guard-rbac.test.js file is the most important deliverable here — 
  be exhaustive, not representative
- Every "should be forbidden" test must assert the response body leaked 
  nothing, not just the status code

Output: complete test file contents.
```

---

## 📊 Tier 9 — Verification Report Generator

```
Continuing the same project. Attach the full test suite from Tiers 7-8.

Task: Run the full test suite (unit + integration) and produce a verification 
report — do not fabricate results.

Requirements:
1. Run tests, capture real output.

2. Produce docs/day10-12-verification-report.md containing:
   - Test summary table: total/passed/failed/skipped per file
   - For every FAILING test: exact error, file/line, proposed fix
   - Manual checklist:
     [ ] Visitor status flow enforces valid transitions only
     [ ] Security Guard cannot access payments/complaints under any route
     [ ] Security Guard's visitor data response contains no leaked fields
     [ ] Payment bulk-create handles duplicates correctly
     [ ] Payment aggregation (summary/overdue) uses Mongo aggregation, not JS loops
     [ ] Parking allocation prevents double-booking a slot
     [ ] Resident payment visibility matches the PDF's role table exactly 
         (re-verify this — it's easy to get wrong)
     [ ] All new routes follow Authentication → Role → Tenant → Resource pattern
   - Known gaps stated explicitly

3. Fix any failing code (not the tests) unless the test itself is wrong — 
   state which you did.

Rules:
- Reflect what genuinely happened when running the suite
- If you can't execute tests, do a manual code trace and label findings 
  "verified by code review" vs "verified by test run"

Output: the verification report, plus corrected code files if bugs were found.
```

---

## 🏆 Tier 10 — Self-Score Against the Assessment Rubric

```
Continuing the same project. Attach docs/day10-12-verification-report.md and 
the assessment's evaluation criteria:

Requirement Understanding: 10%
MERN Implementation: 25%
Multi-Tenancy & RBAC: 20%
Functionality: 15%
UI/UX: 10%
Code Quality: 10%
Git, Documentation & Deployment: 10%

Task: Score ONLY Day 10-12's work (Visitor, Payments, Parking, Security Guard 
dashboard) against the categories this phase touches.

Requirements:
1. Score each relevant category with specific file/function citations as evidence.

2. Give SPECIAL scrutiny to Multi-Tenancy & RBAC (20%) — this phase introduces 
   the narrowest-permission role in the whole system (Security Guard). Be 
   paranoid: cite the exact test or code line that proves security_guard 
   truly cannot reach payment/complaint data, not just "it should be fine."

3. Explicitly flag:
   - Any place resident payment visibility might not match the PDF's role 
     table (this is a specific, checkable detail — get it right)
   - Any duplication between frontend and backend status-transition logic 
     that could drift (same risk pattern as Day 6-9's complaint dropdown)
   - Anything that would embarrass the candidate if asked to explain the 
     Security Guard's access boundaries live in an interview

4. One overall verdict: "Ready for Day 13-14" / "Needs fixes first" with a 
   bullet list if the latter.

Rules:
- Be harsh and specific, not encouraging
- No numeric score without a concrete code citation

Output: docs/day10-12-self-score.md with the full breakdown.
```

---

## ✅ بعد الـ 10 Tiers

رجعلي بالـ verification report والـ self-score، وهنراجعهم قبل الانتقال لـ Day 13-14 (Enhancements & QA — Facility Booking, Events, Staff Management, Reports).
