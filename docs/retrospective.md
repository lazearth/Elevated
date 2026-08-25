# Retrospective — Elevated Meeting Space MVP

## 1. What Went Well

* **Service Layer separation paid off immediately.** Because business rules live in `BookingService`/`AdminService` instead of the UI, the whole domain could be tested from a plain browser runner (`tests/runner.html`) without clicking through pages — 11 requirement-traced test cases run in under two seconds.
* **The RTM kept everyone honest.** Tracing FR → user story → component → test case exposed gaps early (e.g. FR-008 "summary before payment" had no component until the booking modal was designed).
* **Requirement-traced tests caught real bugs.** The suite + manual golden-path pass surfaced four genuine defects (wrong seeded hashes, audit entries overwritten by the transaction, role-gated nav links leaking to anonymous users, stray template text). All were fixed before submission — see `docs/testing.md` §4.
* **localStorage-as-database was the right MVP call.** Zero setup, instant demos, and JSON "tables" that mirror what a real schema would look like made the eventual migration path easy to reason about.

## 2. What Could Have Gone Better

* **Mockups were not SPA-ready.** The three AI-generated HTML files were full standalone documents; merging them into one SPA view architecture took longer than expected and caused the nav-visibility defect (DEF-03). Lesson: agree on the integration structure *before* generating UI.
* **Authentication should have been tested first.** DEF-01 (broken seeded credentials) was only found when someone finally tried to log in. A smoke test of login/register on day one would have caught it immediately.
* **The audit bug was invisible to users of a single feature.** DEF-02 only appeared when crossing feature boundaries (booking → payment → admin check-in). Lesson: integration scenarios, not just unit checks, belong in the suite from the start.

## 3. Technical Debt (Accepted for the MVP)

| Debt | Why accepted for MVP | Impact / migration path |
| :--- | :--- | :--- |
| `localStorage` instead of PostgreSQL | No backend requirement; instant demo | No true cross-device/multi-user concurrency (NFR-005 verified logically via `withLock` only). Next step: port `StorageAdapter` to a REST API backed by PostgreSQL — the service interfaces were designed to allow this swap. |
| Tailwind via CDN | Single-file constraint; no build step | Console warning in production; upgrade to a compiled stylesheet when a build pipeline exists. |
| `alert()`/`confirm()` dialogs | Fast MVP feedback | Not accessible/pretty; replace with in-app toasts and modals. |
| Room images hot-linked from an external CDN | No image assets in repo | Demo depends on external availability; bundle local assets later. |
| No client-side router/history | SPA view switching was sufficient | Browser back button does not switch views; add hash-based routing. |
| Payment is fully mocked | Out of scope | `confirmPayment` is the single integration point for a real gateway. |
| Single ADMIN role, no room CRUD | Rubric scope | Role model can be extended in `AuthService` without schema changes. |

## 4. Team Contributions

| Member | Responsibilities |
| :--- | :--- |
| *[Member 1 — name]* | Requirements analysis, SRS & RTM, stakeholder review |
| *[Member 2 — name]* | Service layer implementation, concurrency design (`withLock`), test suite |
| *[Member 3 — name]* | SPA integration, UI wiring, manual verification & defect triage |
| *[Member 4 — name]* | Admin dashboard & audit-trail verification, defect log, screenshots |
| *[Member 5 — name]* | Documentation (README, AI usage log), demo script, final review |
| *[All]* | AI-output review (see `docs/ai_usage_log.md`), documentation, final demo |

*(Fill in actual names and adjust the role split before submission — contributions should match each member's actual Git history.)*

## 5. Lessons Learned

1. **Verify AI output by running it, not reading it** — three of the four defects looked correct in code review.
2. **Design the "boring" seams early** (auth, audit, transaction boundary); they're where the expensive bugs hid.
3. **Tracing tests to requirement IDs turns "it works" into evidence** — exactly what the rubric asks for.

## 6. Next Steps (Post-MVP)

1. Replace `StorageAdapter` with a REST API + PostgreSQL; keep service interfaces unchanged.
2. Real payment gateway integration at the existing `confirmPayment` seam.
3. Hash-based SPA routing and browser history support.
4. Automated no-show detection (30-minute window) instead of manual admin marking.
5. Email notifications on CONFIRMED / NO_SHOW transitions.
