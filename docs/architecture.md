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
    *   `BookingService.js`: Contains business logic for validating 1-hour minimums (FR-004), calculating costs (FR-005), and enforcing concurrency checks before saving.
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
    "id": "u_1",
    "email": "employee@ems.com",
    "passwordHash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "role": "EMPLOYEE"
  }
]
