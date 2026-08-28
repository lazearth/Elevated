# Software Requirements Specification (SRS)

## 1. Problem Statement
**Current Situation & Impact:** Elevated Meeting Space currently lacks a streamlined, digital process for managing its 9 meeting rooms (spanning Small, Medium, and Large capacities). Employees and students face friction when trying to find available rooms and secure them with advanced payments. Additionally, administrators struggle with manual booking oversight, tracking NO_SHOW penalties, and managing double-booking conflicts.

**System Solution:** The proposed Event/Room Booking Platform will centralize reservations, enforce strict business rules (e.g., minimum 1-hour bookings, full upfront payments, 30-minute check-in windows), and eliminate concurrent booking conflicts. This ensures fair access (prioritizing employees), guarantees revenue collection before confirmation, and provides staff with a dashboard to monitor utilization rates effectively.

## 2. Stakeholders
*   **Customers (Employees & Students):**
    *   **Needs:** A responsive, user-friendly interface to search for room availability, book spaces, make advance payments, and view booking history.
    *   **Responsibility:** Provide accurate booking details, pay the full amount in advance, and check-in physically at least 30 minutes before the scheduled time.
*   **Administrators / Reception Staff:**
    *   **Needs:** Secure login access to manage bookings, process on-site check-ins, mark NO_SHOW statuses, and view utilization dashboards.
    *   **Responsibility:** Validate customer arrivals, manage room schedules, and ensure system rules are upheld.

## 3. Functional Requirements (FRs)
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **FR-001** | The system must record a history of changes to Booking and Payment statuses, including date and time, for auditing purposes. | High |
| **FR-002** | The system must allow users to view all 9 meeting rooms, including their size, capacity, amenities, and hourly rate. | High |
| **FR-003** | The system must allow users to search for available rooms by start date, start time, end time, and room size. | High |
| **FR-004** | The system must reject booking requests with a duration of less than 1 hour (no 30-minute intervals) and any booking outside operating hours (10:00 - 19:00). | High |
| **FR-005** | The system must automatically calculate the total booking price based on the room's hourly rate and the total duration. | High |
| **FR-006** | The system must allow users to create a booking by selecting a room, date, start time, and end time; bookings for past dates or times must be rejected. | High |
| **FR-007** | The system must prevent overlapping confirmed bookings for the same room. | High |
| **FR-008** | The system must display a summary before payment, including room details, date, times, duration, hourly rate, and total amount. | High |
| **FR-009** | The system must require full payment before confirming a booking (no late fees/fines). | High |
| **FR-010** | The system must allow logged-in users to view their current and historical bookings, including booking and payment statuses. | Medium |
| **FR-011** | The system must allow authorized staff to check in customers and change a booking status to NO_SHOW if they fail to check in within 30 minutes of the start time. | High |
| **FR-012** | The system must not issue refunds for bookings marked as NO_SHOW. | Medium |
| **FR-013** | The system must allow customers to cancel their own PENDING/CONFIRMED bookings within 7 days of purchase (cooling-off period) and before the start time; the paid amount is refunded and the time slot is released for re-booking. | Medium |

## 4. Non-Functional Requirements (NFRs)
| ID | Requirement Description | Priority |
| :--- | :--- | :--- |
| **NFR-001** | The system must display room availability search results within 3 seconds under normal usage. | Medium |
| **NFR-002** | The system must securely hash passwords; plaintext password storage is prohibited. | High |
| **NFR-003** | The system must restrict room management, check-in, and admin functions to authorized personnel only. | High |
| **NFR-004** | The system must guarantee that no two confirmed bookings share the same room and overlapping times. | High |
| **NFR-005** | The system must handle concurrent booking attempts gracefully, preventing double-bookings even if multiple users attempt to book simultaneously. | High |
| **NFR-006** | The system must not change a booking status to CONFIRMED until full payment is successfully processed. | High |
| **NFR-007** | Regular users must only be able to view their own booking and payment data; admins can view all. | High |
| **NFR-008** | The system must maintain traceability for all status changes (Booking/Payment) with timestamps. | High |

## 5. User Stories & Acceptance Criteria

*   **US-01: Room Discovery**
    *   *As a* Customer, *I want to* search for available meeting rooms by date, time, and size, *so that* I can find a space that fits my group's needs.
    *   *Acceptance Criteria:* Given valid search parameters, When I submit the search, Then the system displays matching rooms with their capacities, amenities, and hourly rates (฿1,000/฿2,000/฿2,500) within 3 seconds.
*   **US-02: Booking Creation & Validation**
    *   *As a* Customer, *I want to* select a room and time slot, *so that* I can reserve the space.
    *   *Acceptance Criteria:* Given a selected room, When I attempt to book it for less than 1 hour or a 30-minute increment, Then the system rejects the request and prompts for a minimum 1-hour block.
*   **US-03: Cost Calculation & Payment**
    *   *As a* Customer, *I want* the system to calculate my total cost and require full payment, *so that* my booking is officially confirmed.
    *   *Acceptance Criteria:* Given a valid time block, When I proceed to checkout, Then the system displays the total cost and does not change the status to CONFIRMED until full payment is successfully processed.
*   **US-04: Booking Management**
    *   *As a* Customer, *I want to* view my current and past bookings, *so that* I can track my schedule and payment status.
    *   *Acceptance Criteria:* Given I am logged in, When I navigate to my profile, Then I can exclusively see my own booking history and payment records.
*   **US-05: Staff Check-in**
    *   *As an* Admin, *I want to* manually check-in customers when they arrive, *so that* the room is marked as actively in use.
    *   *Acceptance Criteria:* Given an admin account, When I click 'Check-in' on a customer's confirmed booking, Then the booking status changes to IN_USE.
*   **US-06: No-Show Enforcement**
    *   *As an* Admin, *I want to* mark bookings as NO_SHOW if the customer is late, *so that* the policy is enforced without issuing a refund.
    *   *Acceptance Criteria:* Given a booking starting at 10:00 AM, When the customer has not checked in by 10:30 AM, Then the admin can update the status to NO_SHOW and the system retains the payment.
*   **US-07: Concurrency Handling**
    *   *As a* System Operator, *I want* the system to handle simultaneous booking attempts, *so that* double-booking never occurs.
    *   *Acceptance Criteria:* Given two users attempt to book Room A at 2:00 PM simultaneously, When the transactions process, Then only the first successful payment confirms the booking, and the second user receives an "Unavailable" error.
*   **US-08: Audit & Traceability**
    *   *As an* Admin, *I want* the system to log all booking and payment status changes with timestamps, *so that* I can audit historical actions.
    *   *Acceptance Criteria:* Given any status change (e.g., Pending to Confirmed), When the action occurs, Then the database records the exact date, time, and actor.
*   **US-09: Customer Cancellation**
    *   *As a* Customer, *I want a* 7-day cooling-off window after paying to cancel my booking, *so that* I get my money back and the room becomes available to others.
    *   *Acceptance Criteria:* Given a CONFIRMED booking purchased within the last 7 days that has not started yet, When I click Cancel in My Bookings, Then the status becomes CANCELLED, the payment is refunded, the slot is immediately re-bookable, and the action appears in the audit trail. Cancellations after the 7-day cooling-off window, of already-started bookings, and of other users' bookings are rejected.

## 6. Requirements Traceability Matrix (RTM)

| Requirement ID | User Story | Design Module / Component | Test Case ID | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FR-002, FR-003, NFR-001 | US-01 | `BookingService.js` (`getAllRooms`, `searchRooms`), Home view (`index.html`) | TC-01, TC-02 | `tests/suite.js`, `screenshots/home-room-discovery.png` | Passed |
| FR-004, FR-006 | US-02 | `BookingService.js` (`validateBooking`, `createBooking`), Booking Modal | TC-03, TC-05 | `tests/suite.js` | Passed |
| FR-005, FR-008, FR-009 | US-03 | `BookingService.js` (`calculateTotal`, `confirmPayment`), Booking Modal | TC-04, TC-06 | `tests/suite.js` | Passed |
| FR-010, NFR-007 | US-04 | `BookingService.js` (`getUserBookings`), My Bookings view | TC-11 | `tests/suite.js`, `screenshots/my-bookings.png` | Passed |
| FR-011 | US-05 | `AdminService.js` (`checkIn`), Admin Dashboard view | TC-07 | `tests/suite.js`, `screenshots/admin-dashboard.png` | Passed |
| FR-011, FR-012 | US-06 | `AdminService.js` (`markNoShow`), Admin Dashboard view | TC-08 | `tests/suite.js` | Passed |
| FR-007, NFR-004, NFR-005 | US-07 | `StorageAdapter.js` (`withLock` atomic overlap re-check) | TC-05 | `tests/suite.js`, `docs/architecture.md` §5 | Passed |
| FR-001, NFR-008 | US-08 | `AuditLogger.js`, audit panel in Admin Dashboard | TC-09 | `tests/suite.js` | Passed |
| NFR-002 | — | `AuthService.js` (SHA-256 via Web Crypto) | TC-10 | `tests/suite.js` | Passed |
| FR-013, NFR-007 | US-09 | `BookingService.js` (`cancelBooking`), Cancel button in My Bookings view | TC-12 | `tests/suite.js` | Passed |

Full test report including manual golden-path verification and the defect log: `docs/testing.md`.
