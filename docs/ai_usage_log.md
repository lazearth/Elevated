# AI Usage Disclosure Log — Elevated Meeting Space MVP

This project used AI coding assistants as part of the workflow, in line with the course's AI usage policy. This log records **what the AI generated**, **how it was used**, and — most importantly — **how a human verified or corrected every output**. AI assistance accelerated delivery, but all requirements decisions, business rules, and final acceptance remained human-driven.

## 1. Summary

| Metric | Value |
| :--- | :--- |
| AI-assisted artifacts | Requirements draft, UI mockups, service-layer code, SPA integration, test suite, documentation |
| Estimated AI involvement in final codebase | ~70% of first drafts, substantially reduced after human review and fixes |
| Human-verified outcomes | All 11 automated tests re-run and passing in-browser; full golden path manually verified |
| Defects caught by human verification of AI output | 4 (see §3) — none of them survived into the final build |

## 2. Detailed Usage Log

| # | Date | Task / Artifact | AI contribution | Human verification & adjustments |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 2026-08-24 | `docs/SRS.md` — problem statement, 12 FRs, 8 NFRs, 8 user stories, RTM | AI drafted the requirement tables from the assignment brief | Team reviewed each requirement against the original assignment PDF; adjusted wording (e.g. made the 1-hour minimum and no-refund rules explicit) and mapped each FR to a user story |
| 2 | 2026-08-24 | `docs/architecture.md` | AI proposed the Service Layer + localStorage design and JSON schemas | Team chose this option over a real backend after weighing the rubric's "demonstrable MVP" constraint; confirmed the concurrency trade-off was acceptable and documented it |
| 3 | 2026-08-24 | UI mockups (Landing, My Bookings, Admin Dashboard) | AI UI tool generated 3 static HTML mockups with Tailwind | Team selected the layout/theme, then verified colours, spacing and status-badge colours against the design spec; no structural changes accepted without review |
| 4 | 2026-08-24 | Service layer (`StorageAdapter.js`, `AuthService.js`, `BookingService.js`, `AdminService.js`, `AuditLogger.js`) | AI generated the modules, seeded data and business-rule logic | Team traced each function to its FR; **caught DEF-01** — seeded password hashes did not match the documented demo passwords (login failed during manual testing); replaced with correct SHA-256 digests |
| 5 | 2026-08-25 | SPA integration (`index.html`, `src/app.js`) | AI merged the 3 mockups into one SPA shell wired to `app.js`, mapped all element IDs, wired modals/views | Team clicked through the full golden path in Chrome; **caught DEF-03** (nav links visible when logged out) and **DEF-04** (stray text in admin rows); AI proposed fixes, team re-verified |
| 6 | 2026-08-25 | Test suite (`tests/runner.html`, `tests/suite.js`) | AI wrote the 11 test cases traced to requirement IDs and the vanilla runner | Team ran the suite in-browser, inspected each assertion for correctness (not just green ticks); **caught DEF-02** — audit log entries were being overwritten by the transaction save; fix redesigned in `withLock` and re-tested |
| 7 | 2026-08-25 | `docs/testing.md`, `docs/retrospective.md`, `README.md` | AI drafted structure and content | Team filled in team contributions, validated every claim against actual test output and screenshots, corrected file paths (`src/`, not `src/js/`) |

## 3. Defects Introduced by AI and Caught by Human Verification

These examples show why the verification column above is not a formality:

1. **DEF-01 (login broken):** AI-generated seed data contained hashes that did not correspond to the documented passwords. Every login failed until a human manually tested sign-in and recomputed the digests.
2. **DEF-02 (audit trail silently empty):** AI placed audit writes inside the transaction callback, where they were overwritten on commit. Tests initially passed superficially; human inspection of the Admin Dashboard's empty Audit Trail exposed it.
3. **DEF-03 (access control leak in UI):** AI-generated view-switching code restyled nav links in a way that un-hid role-gated links for anonymous users.
4. **DEF-04 (visual glitch):** A stray `row.` token rendered inside every admin table row.

## 4. Tools Used

- AI coding assistant (code generation, refactoring, debugging, documentation drafting)
- AI UI generation tool (initial HTML mockups only)
- Browser developer tools (all verification performed by humans in Chrome)

## 5. Integrity Statement

The team confirms that: all requirement decisions were made by the team; every AI-generated artifact was reviewed, tested, and where necessary corrected by a team member before inclusion; test results reported in `docs/testing.md` reflect actual executions of the submitted code; and this log is a complete account of AI involvement in the project.
