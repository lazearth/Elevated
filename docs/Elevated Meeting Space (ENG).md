1. Problem Statement

Current Situation & Impact: Elevated Meeting Space currently lacks a streamlined, digital process for managing its 9 meeting rooms (spanning Small, Medium, and Large capacities). Employees and students face friction when trying to find available rooms and secure them with advanced payments. Additionally, administrators struggle with manual booking oversight, tracking NO_SHOW penalties, and managing double-booking conflicts.
System Solution: The proposed Event/Room Booking Platform will centralize reservations, enforce strict business rules (e.g., minimum 1-hour bookings, full upfront payments, 30-minute check-in windows), and eliminate concurrent booking conflicts. This ensures fair access (prioritizing employees), guarantees revenue collection before confirmation, and provides staff with a dashboard to monitor utilization rates effectively.

## 2. Stakeholder List

* Customers (Employees & Students):
  - Needs: A responsive, light-themed, user-friendly interface to search for room availability, book spaces, make advance payments, and view booking history.
  - Responsibility: Provide accurate booking details, pay the full amount in advance, and check-in physically at least 30 minutes before the scheduled time.
* Administrators / Reception Staff:
  - Needs: Secure login access to manage bookings, process on-site check-ins, mark NO_SHOW statuses, and view utilization dashboards.
  - Responsibility: Validate customer arrivals, manage room schedules, and ensure system rules (like no refunds for late arrivals) are upheld.
* System Developers / Maintenance Team:
  - Needs: Clear architecture, version control, and bug-tracking capabilities.
  - Responsibility: Ensure high availability, resolve concurrency issues (preventing double bookings), and maintain secure password hashing.

## 3. User Stories & Acceptance Criteria
To meet the minimum requirement of 8 User Stories, here is the breakdown encompassing your Functional Requirements (FRs):  
* US-01: Room Discovery (Maps to FR-002, FR-003)
  - Story: As a Customer, I want to search for available meeting rooms by date, time, and size, so that I can find a space that fits my group's needs.
  - Acceptance Criteria: Given valid search parameters, When I submit the search, Then the system displays matching rooms with their capacities, amenities, and hourly rates (฿1,000/฿2,000/฿2,500) within 3 seconds.
* US-02: Booking Creation (Maps to FR-004, FR-006)
  - Story: As a Customer, I want to select a room and time slot, so that I can reserve the space.
  - Acceptance Criteria: Given a selected room, When I attempt to book it for less than 1 hour or a 30-minute increment, Then the system rejects the request and prompts for a minimum 1-hour block.
* US-03: Cost Calculation & Payment (Maps to FR-005, FR-008, FR-009)
  - Story: As a Customer, I want the system to calculate my total cost and require full payment, so that my booking is officially confirmed.
  - Acceptance Criteria: Given a valid time block, When I proceed to checkout, Then the system displays the total cost and does not change the status to CONFIRMED until full payment is successfully processed.
* US-04: Booking Management (Maps to FR-010, NFR-007)
  - Story: As a Customer, I want to view my current and past bookings, so that I can track my schedule and payment status.
  - Acceptance Criteria: Given I am logged in, When I navigate to my profile, Then I can exclusively see my own booking history and payment records.  
* US-05: Staff Check-in (Maps to FR-011)
  - Story: As an Admin, I want to manually check-in customers when they arrive, so that the room is marked as actively in use.
  - Acceptance Criteria: Given an admin account, When I click 'Check-in' on a customer's confirmed booking, Then the booking status changes to IN_USE.
* US-06: No-Show Enforcement (Maps to FR-011, FR-012)
  - Story: As an Admin, I want to mark bookings as NO_SHOW if the customer is late, so that the policy is enforced without issuing a refund.
  - Acceptance Criteria: Given a booking starting at 10:00 AM, When the customer has not checked in by 10:30 AM, Then the admin can update the status to NO_SHOW and the system retains the payment.
* US-07: Concurrency Handling (Maps to FR-007, NFR-004, NFR-005)
  - Story: As a System Operator, I want the system to handle simultaneous booking attempts, so that double-booking never occurs.
  - Acceptance Criteria: Given two users attempt to book Room A at 2:00 PM simultaneously, When the transactions process, Then only the first successful payment confirms the booking, and the second user receives an "Unavailable" error.
* US-08: Audit & Traceability (Maps to FR-001, NFR-008)
  - Story: As an Admin, I want the system to log all booking and payment status changes with timestamps, so that I can audit historical actions.
  - Acceptance Criteria: Given any status change (e.g., Pending to Confirmed), When the action occurs, Then the database records the exact date, time, and actor.

4. Requirements Traceability Matrix (RTM)
This RTM bridges your requirements, code, and testing phases as required by the rubric.


| Requirement ID | User Story | Design Module / Component | Test Case ID | Evidence (Repo/Docs) | Status |
|---------------|-------------|---------------------------|--------------|----------------------|-------|
| FR-003, NFR-001 | US-01 | SearchController, API Route | TC-01: Query available rooms under 3s | PR #4, API Contract | Pending |
| FR-004, FR-006 | US-02 | BookingValidator, UI Form | TC-02: Reject < 1hr duration | Unit Test Log | Pending |
| FR-005, FR-009 | US-03 | PaymentGateway, BookingEntity | TC-03: Status lock until paid | Payment Mock Evidence | Pending |
| FR-007, NFR-005 | US-07 | DB Transaction / Locking mechanism | TC-04: Simulate concurrent POST reqs | Code Commit (Locking) | Pending |
| FR-011, FR-012 | US-06 | AdminDashboard, StatusEnum | TC-05: NO_SHOW after 30 mins | UI Screenshot | Pending |
| NFR-002 | N/A | AuthService, Hash Implementation | TC-06: Verify DB hashed output | DB Snippet (No Plaintext) | Pending |
