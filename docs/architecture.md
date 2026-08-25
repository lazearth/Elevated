# Architecture & Design Document

## 1. Architectural Overview
The Elevated Meeting Space MVP is built as a standalone Single Page Application (SPA) utilizing HTML, CSS (Tailwind), and Vanilla JavaScript. 

**Design Decision:** Due to the constraints of the MVP and the requirement for a demonstratable product without a backend, we chose a **Service Layer Architecture** on the frontend, using the browser's `localStorage` as a mock database.

**Trade-offs:** 
*   *Pros:* Extremely fast to prototype, zero server costs, easy to deploy as static files.
*   *Cons:* True multi-user concurrency cannot be fully tested across different physical machines in real-time. However, we mitigate this by simulating transactional locking mechanisms within our Service Layer to satisfy NFR-005 logically.

## 2. Component Design (Service Layer)
To maintain clean code and testability, the application logic is separated into specific services:

*   **UI/DOM Layer:** Handles rendering data and capturing user events (e.g., clicking "Book Now").
*   **Service Layer:**
    *   `AuthService.js`: Handles login/registration and password hashing (NFR-002).
    *   `BookingService.js`: Contains business logic for validating 1-hour minimums (FR-004), calculating costs (FR-005), enforcing concurrency checks before saving, and customer cancellations with the 7-day window rule (FR-013).
    *   `AdminService.js`: Handles Check-in and No-Show state changes (FR-011).
    *   `AuditLogger.js`: Automatically called by other services to log state changes (FR-001).
*   **Data Access Layer:**
    *   `StorageAdapter.js`: A wrapper around `localStorage` to parse JSON and mock database transactions.

## 3. Data Model (JSON Schema for LocalStorage)

While using local storage, we structure our JSON to mimic relational database tables.

### `users`
```json
[
  {
    "id": "U002",
    "email": "employee@ems.com",
    "passwordHash": "e03d3ec8d5035f8721f5dc64546e59ed790dbcb3b7b598fe57057ccd7b683b00",
    "role": "EMPLOYEE",
    "name": "Jane Smith"
  }
]
```
*Passwords are stored as SHA-256 hex digests (NFR-002). Plaintext is never persisted.*

### `rooms`
```json
[
  {
    "id": "R001",
    "name": "Focus Pod Alpha",
    "size": "Small",
    "capacity": 6,
    "rate": 1000,
    "amenities": ["Wifi", "TV Display", "Whiteboard"],
    "image": "https://..."
  }
]
```
*Nine rooms are seeded on first run: 3 Small (฿1,000/hr), 3 Medium (฿2,000/hr), 3 Large (฿2,500/hr).*

### `bookings`
```json
[
  {
    "id": "BKG-NMKRDLGHK",
    "userId": "U002",
    "userName": "Jane Smith",
    "userEmail": "employee@ems.com",
    "roomId": "R001",
    "roomName": "Focus Pod Alpha",
    "date": "2026-09-01",
    "startTime": "10:00",
    "endTime": "12:00",
    "totalAmount": 2000,
    "status": "PENDING | CONFIRMED | IN_USE | NO_SHOW | CANCELLED",
    "paymentStatus": "UNPAID | PAID | REFUNDED",
    "createdAt": "2026-08-25T05:04:19.000Z"
  }
]
```

### `auditLogs`
```json
[
  {
    "id": "LOG1724555059912x7f3a",
    "timestamp": "2026-08-25T05:04:20.000Z",
    "action": "BOOKING_CREATED | PAYMENT_CONFIRMED | CHECK_IN | NO_SHOW | BOOKING_CANCELLED",
    "details": "Booking BKG-NMKRDLGHK created for Focus Pod Alpha",
    "actor": "employee@ems.com"
  }
]
```
*Newest entries are stored first (`unshift`). The Admin Dashboard renders the latest 15 entries.*

### `EMS_SESSION` (sessionStorage)
```json
{ "userId": "U002", "email": "employee@ems.com", "role": "EMPLOYEE", "name": "Jane Smith", "timestamp": 1724555059912 }
```
*Sessions live in `sessionStorage` so they expire with the browser tab, mimicking server-side session expiry.*

## 4. Project Structure (SPA)

```
Elevated/
├── index.html            # Single Page Application shell (3 views + 2 modals)
├── src/
│   ├── StorageAdapter.js # Data Access Layer: localStorage JSON, seeds, withLock() transaction mock
│   ├── AuditLogger.js    # Audit trail writer/reader (FR-001, NFR-008)
│   ├── AuthService.js    # Login/register/session, SHA-256 hashing (NFR-002)
│   ├── BookingService.js # Search, validation, pricing, overlap checks (FR-003..FR-009)
│   ├── AdminService.js   # Check-in & No-Show state changes (FR-011, FR-012)
│   └── app.js            # UI/DOM layer: SPA routing, rendering, modals, events
├── tests/
│   ├── runner.html       # Browser-based test runner
│   └── suite.js          # 11 test cases traced to requirement IDs
├── docs/                 # SRS, architecture, testing report, AI usage log, retrospective
└── screenshots/          # Verification evidence
```

Scripts load in strict dependency order at the bottom of `index.html`:
`StorageAdapter → AuditLogger → AuthService → BookingService → AdminService → app.js`, communicating through the `window.EMS` namespace (no modules/bundler — keeps the project openable directly from disk).

## 5. Transactional Write Pattern (`withLock`)

All state mutations go through `StorageAdapter.withLock(callback)`, which simulates a database transaction:

1. Read the latest state (`getData`).
2. Run the callback — it re-validates business rules (e.g. overlap check) against the *just-read* data and mutates it. Audit entries are queued via `tx.log(...)` rather than written immediately.
3. Commit (`saveData`).
4. Apply queued audit entries in a second write.

Steps 2–4 close the race window that would allow two overlapping bookings to both pass validation (NFR-005), and step 4 guarantees the audit trail can never be clobbered by the transaction's own save (an early defect caught during system testing — see `docs/testing.md`, DEF-02).

## 6. Testing Approach

Because there is no backend, the test suite (`tests/runner.html`) loads the **production service scripts** and executes them against a real `localStorage` in the browser — no mocks of our own logic. Every case resets `EMS_DATA` and `EMS_SESSION` first, so tests are order-independent and repeatable. See `docs/testing.md` for the full report.
