# Contributing Guide — Team Workflow



## 1. One-time setup (each member)

```bash
git clone https://github.com/lazearth/Elevated.git
cd Elevated
git config user.name  "Your Name"       # shows in git log
git config user.email "your@student.email"
```

Ask the repo owner to add you under **Settings → Collaborators** (or work through a fork + pull request if permissions are restricted).

## 2. Golden rules

1. **Never commit directly to `main`.** Always work on a branch and merge via Pull Request.
2. **One branch = one purpose.** Small branches named after the task.
3. **Pull before you push.** `git pull origin main` (or rebase your branch) before opening a PR.
4. **Check the app still opens.** Before committing, open `index.html` and `tests/runner.html` — tests must stay 11/11 green.

## 3. Daily workflow

```bash
git checkout main && git pull origin main
git checkout -b docs/yourname-retrospective-row   # see naming below
# ... make changes ...
git add <specific-files>
git commit -m "docs: fill in contribution row for <name>"
git push -u origin docs/yourname-retrospective-row
```

Then open a Pull Request on GitHub, request one teammate's review, and merge after approval.

## 4. Branch naming

| Type | Example |
| :--- | :--- |
| Feature | `feat/jane-room-search-filter` |
| Bug fix | `fix/mike-admin-status-badge` |
| Docs | `docs/anna-retrospective-row` |
| Tests | `test/oak-payment-edge-cases` |

## 5. Commit message convention

Format: `type: short imperative summary` (lowercase, ≤ 72 characters)

| Type | Use for | Example |
| :--- | :--- | :--- |
| `feat:` | New user-visible behaviour | `feat: add room size filter to search` |
| `fix:` | Bug fixes | `fix: prevent double booking across midnight` |
| `test:` | Test changes | `test: add overlap boundary cases` |
| `docs:` | Documentation | `docs: add TC-12 to testing report` |
| `chore:` | Tooling, config | `chore: ignore .DS_Store` |

If an AI assistant helped produce the change, say so in the commit body:

```
fix: prevent double booking across midnight

Adds a boundary assertion for slots ending exactly at another's start.

Assisted-by: Claude Code (AI) — reviewed and verified manually.
```

(Log details in `docs/ai_usage_log.md` — AI disclosure is part of the grade.)

## 6. What each member should commit (suggested split)

So the Git history shows balanced, real contributions:

1. **Fill in your own row** in `docs/retrospective.md` §4 (each member, own branch).
2. Pick up one improvement from `docs/retrospective.md` §6 (next steps) or a defect scenario from `docs/testing.md` §4 and add a test for it.
3. Review at least one teammate's PR — reviews also count as collaboration evidence.

## 7. If something goes wrong

- Merge conflict? Don't force-push. Ask in the team chat and resolve together.
- Tests red on your branch? Fix before opening the PR — CI-less repo means *you* are the CI (open `tests/runner.html`).
- Accidentally committed to `main`? Tell the owner immediately; do not `git reset --hard` on shared branches.
