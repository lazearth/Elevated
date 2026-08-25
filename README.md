# Elevated Space — Meeting Room Booking MVP

For SWE concept purposes only in order to meet the NG211-05 Final Project MVP requirements in one week.

A standalone Single Page Application (SPA) for booking premium meeting rooms, built with **vanilla HTML, CSS (Tailwind) and JavaScript** — no frameworks, no build step, no backend. The browser's `localStorage` simulates the database, as required for the NG211-05 Final Project MVP.

## Quick Start

**Just open `index.html`** in Chrome or Safari. That's it — no server, no install.

> Tip: an internet connection is needed the first time (Tailwind CDN, fonts, room images). If you prefer serving it locally: `python3 -m http.server 8000` then open http://localhost:8000.

### Demo Accounts

| Role | Email | Password | Sees |
| :--- | :--- | :--- | :--- |
| Admin | `admin@ems.com` | `admin123` | Everything + Admin Dashboard (check-in, no-show, audit trail, metrics) |
| Employee | `employee@ems.com` | `emp123` | Home, My Bookings |
| Student | `student@ems.com` | `std123` | Home, My Bookings |

The login modal also has **one-click demo buttons** (Admin / Employee / Student) — click one, then press Sign In.

### Resetting Demo Data

The app seeds itself on first run. To wipe all bookings/users and restore factory state, run this in the browser console (F12) and reload:

```js
localStorage.removeItem('EMS_DATA'); sessionStorage.removeItem('EMS_SESSION');
```

## Features (traced to requirements in `docs/SRS.md`)

- **Room discovery** — 9 rooms (Small ฿1,000/hr · Medium ฿2,000/hr · Large ฿2,500/hr) with capacity and amenities (FR-002)
- **Availability search** by date, time window and room size (FR-003)
- **Booking rules enforced** — minimum 1 hour, whole-hour blocks only, past dates/times rejected (FR-004, FR-006)
- **Automatic pricing** — rate × duration, with a full summary before payment (FR-005, FR-008)
- **Mock payment** — booking stays PENDING until "Pay Full Amount" is processed (FR-009, NFR-006)
- **Double-booking prevention** — atomic overlap re-check inside a simulated transaction lock (FR-007, NFR-005)
- **My Bookings** — current/past bookings with status badges, filterable (FR-010)
- **Customer cancellation** — 7-day cooling-off window after purchase to cancel your own booking (before it starts); payment refunded and the slot instantly re-bookable (FR-013)
- **Admin dashboard** — all bookings, Check-in (→ IN_USE), No-Show (→ no refund), live metrics (FR-011, FR-012)
- **Audit trail** — every status change logged with actor and timestamp (FR-001, NFR-008)
- **Security basics** — SHA-256 password hashing, role-gated views and actions (NFR-002, NFR-003)

## Running the Tests

Open `tests/runner.html` in Chrome/Safari. The suite executes 12 test cases against the production service layer and shows Test ID / Description / Requirement Traced / Result. Latest run: **12/12 passed** (report: `docs/testing.md`).

## Project Structure

```
Elevated/
├── index.html            # SPA: Home / My Bookings / Admin Dashboard + booking & auth modals
├── src/
│   ├── StorageAdapter.js # localStorage "database", seed data, withLock() transaction mock
│   ├── AuditLogger.js    # Audit trail (FR-001)
│   ├── AuthService.js    # Sessions + SHA-256 hashing (NFR-002)
│   ├── BookingService.js # Search / validation / pricing / overlap checks
│   ├── AdminService.js   # Check-in & No-Show (FR-011, FR-012)
│   └── app.js            # SPA routing, rendering, modals, events
├── tests/                # runner.html + suite.js (12 requirement-traced cases)
├── docs/                 # SRS, architecture, testing report, AI usage log, retrospective
└── screenshots/          # Verification evidence (app views + passing test run)
```

## Documentation

| Document | Contents |
| :--- | :--- |
| `docs/SRS.md` | Problem statement, stakeholders, 12 FRs, 8 NFRs, 8 user stories, RTM |
| `docs/architecture.md` | Service Layer architecture, localStorage schemas, transaction pattern |
| `docs/testing.md` | Test strategy, 11/11 results, manual golden-path verification, defect log |
| `docs/ai_usage_log.md` | AI usage disclosure with human verification column |
| `docs/retrospective.md` | What went well, technical debt, team contributions, next steps |

## Tech Stack & Constraints

Vanilla JavaScript (ES2017+), Tailwind CSS via CDN, Material Symbols + Inter fonts, Web Crypto API (`crypto.subtle`) for hashing. Deliberately framework-free per the assignment; all data lives in `localStorage`/`sessionStorage`, so each browser profile is its own isolated "server".
