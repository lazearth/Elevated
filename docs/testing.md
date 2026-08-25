# Test Report — Elevated Meeting Space MVP

**Date of run:** 2026-08-25 · **Result:** 12 / 12 automated test cases PASSED · **Evidence:** `screenshots/test-results.png`

## 1. Strategy & Environment

| Item | Detail |
| :--- | :--- |
| Test type | Unit + integration (service layer), plus manual UI verification of the golden path |
| Harness | Custom lightweight runner (`tests/runner.html` + `tests/suite.js`) — vanilla JS, no frameworks, matching the project's zero-dependency constraint |
| System under test | The **production scripts** in `src/`, loaded unmodified — no mocks of our own code |
| Environment | Chrome, macOS, opened via `file://` (a secure context, so `crypto.subtle` hashing works) |
| Isolation | Every test case resets `EMS_DATA` (localStorage) and `EMS_SESSION` (sessionStorage) before running, making the suite order-independent and repeatable |

**How to run:** open `tests/runner.html` in Chrome/Safari and click **Re-run Tests**. Results appear in the table (Test ID / Description / Requirement Traced / Result) with a pass counter and duration.

## 2. Automated Test Results

| Test ID | Description | Requirement(s) Traced | Module | Result |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | Storage seeds all 9 meeting rooms with size, capacity, amenities and hourly rate (3 Small / 3 Medium / 3 Large) | FR-002 | `StorageAdapter.js` | PASS |
| TC-02 | `searchRooms` excludes rooms with overlapping bookings and applies the size filter | FR-003 | `BookingService.js` | PASS |
| TC-03 | `validateBooking` rejects durations under 1 hour and 30-minute increments; accepts whole hours | FR-004 | `BookingService.js` | PASS |
| TC-04 | `calculateTotal` returns hourly rate × duration | FR-005 | `BookingService.js` | PASS |
| TC-05 | `createBooking` stores a PENDING booking; overlapping requests for the same room/date are rejected inside the lock; anonymous booking rejected | FR-006, FR-007, NFR-005 | `BookingService.js`, `StorageAdapter.js` | PASS |
| TC-06 | Booking stays PENDING/UNPAID until `confirmPayment` flips it to CONFIRMED/PAID | FR-009, NFR-006 | `BookingService.js` | PASS |
| TC-07 | Only admins can check in; only CONFIRMED bookings become IN_USE; non-admins cannot list all bookings | FR-011, NFR-003 | `AdminService.js` | PASS |
| TC-08 | `markNoShow` sets NO_SHOW and the payment is retained (no refund) | FR-011, FR-012 | `AdminService.js` | PASS |
| TC-09 | BOOKING_CREATED / PAYMENT_CONFIRMED / CHECK_IN are audit-logged with actor and parseable ISO timestamp | FR-001, NFR-008 | `AuditLogger.js` | PASS |
| TC-10 | Passwords stored as SHA-256 (verified against digest of `admin123`); no plaintext in storage; duplicate-email registration rejected | NFR-002 | `AuthService.js` | PASS |
| TC-11 | `getUserBookings` returns only the signed-in user's own bookings | FR-010, NFR-007 | `BookingService.js` | PASS |
| TC-12 | Customers can cancel their own bookings within the 7-day cooling-off after purchase and before start time (status → CANCELLED, payment refunded, slot re-bookable); cancellations after the window, of already-started bookings, of others' bookings, and of terminal statuses are rejected; audit entry recorded | FR-013, NFR-007, FR-001 | `BookingService.js` | PASS |

## 3. Manual UI Verification (Golden Path)

| Step | Expected behaviour | Requirement | Result |
| :--- | :--- | :--- | :--- |
| 1. Open `index.html` logged out | Home renders 9 room cards; "My Bookings" / "Admin Dashboard" nav links hidden | FR-002, NFR-003 | PASS |
| 2. Login/Register → quick-login **Employee** → Sign In | Session created; welcome banner "Jane Smith (EMPLOYEE)"; My Bookings link appears; Admin link stays hidden | NFR-003, NFR-007 | PASS |
| 3. "Book Now" on a room → pick date, 10:00–12:00 | Modal shows room, rate, live summary "2 hrs" and total ฿2,000 before payment | FR-006, FR-008 | PASS |
| 4. "Pay Full Amount" | Mock payment processes; booking becomes CONFIRMED; redirect to My Bookings shows the booking | FR-009, FR-010 | PASS |
| 5. Filter tabs All / Upcoming / Past | List filters correctly; Past shows empty-state message for the fresh booking | FR-010 | PASS |
| 6. Logout → quick-login **Admin** → Admin Dashboard | All bookings listed with status badges; metrics update (Total / Confirmed / In Use / No-Show / Utilization) | FR-011, NFR-003 | PASS |
| 7. Admin "Check-in" on the CONFIRMED booking | Status → IN_USE; action buttons disappear; CHECK_IN entry appears in Audit Trail panel | FR-011, FR-001 | PASS |
| 8. Search bar (date + time + size) | Room grid narrows to available rooms matching criteria; instant (< 3 s) | FR-003, NFR-001 | PASS |
| 9. "Book Now" after a search | Booking modal pre-fills the date and start/end times from the search bar — no re-entry needed | FR-006, FR-008 (UX) | PASS |
| 10. "Cancel" on a booking still inside the 7-day cooling-off window | Confirm dialog → status CANCELLED, payment REFUNDED, Cancel button gone; slot bookable again in a new search; BOOKING_CANCELLED in audit trail | FR-013 | PASS |

Screenshots: `screenshots/home-room-discovery.png`, `screenshots/my-bookings.png`, `screenshots/admin-dashboard.png`.

## 4. Defects Found & Fixed During Testing

This section documents real defects caught by the suite / verification sessions — evidence that testing drove fixes, not just confirmation.

| Defect ID | Description | Requirement at risk | Root cause & fix |
| :--- | :--- | :--- | :--- |
| DEF-01 | Seeded password hashes did not match the documented demo passwords (`admin123`/`emp123`/`std123`) — all logins failed | NFR-002 | Seed data contained hashes of other strings. Replaced with true SHA-256 digests of the documented passwords and re-verified login. |
| DEF-02 | Audit log stayed empty after bookings/payments/check-ins | FR-001, NFR-008 | `AuditLogger.log()` wrote to localStorage *inside* the `withLock` callback; the transaction's own `saveData` then overwrote the log entry. Fixed by queuing audit entries via `tx.log(...)` inside the transaction and applying them **after** the commit (see `docs/architecture.md` §5). |
| DEF-03 | "My Bookings" / "Admin Dashboard" nav links visible to anonymous visitors | NFR-003 | `switchView()` rewrote the nav link `className`, wiping the `hidden` class set by `updateAuthState()`. Fix preserves the `hidden` class when restyling. |
| DEF-04 | Stray text `row.` rendered in every admin dashboard row | — | Typo in the `renderAdminDashboard` template literal. Removed. |

## 5. Requirements Coverage Summary

All 13 FRs and all 8 NFRs from `docs/SRS.md` are covered: FR-002→TC-01, FR-003→TC-02 (+manual steps 8/10), FR-004→TC-03, FR-005→TC-04, FR-006→TC-05, FR-007→TC-05, FR-008→manual step 3, FR-009→TC-06, FR-010→TC-11, FR-011→TC-07/TC-08, FR-012→TC-08, FR-013→TC-12, FR-001→TC-09; NFR-001→manual step 8, NFR-002→TC-10, NFR-003→TC-07 (+manual steps 1/6), NFR-004→TC-05, NFR-005→TC-05, NFR-006→TC-06, NFR-007→TC-11/TC-12, NFR-008→TC-09.

**Known limitation:** true multi-user concurrency across machines cannot be exercised with `localStorage`; NFR-005 is verified logically through the atomic re-check inside `withLock` (documented in `docs/architecture.md` §2 trade-offs).
