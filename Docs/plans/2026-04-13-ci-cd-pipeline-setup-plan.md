# TB-121 · CI/CD Pipeline Setup — Implementation Plan

**Date:** 2026-04-13
**Status:** Ready for Claude Code
**Backlog item:** TB-121 (📐▶)
**Retro context:** `Docs/retrospectives/2026-04-11-retro-v2.md` — 8+ days of red tests shipped to main because nothing enforced `npm test`

---

## Problem

Social conventions ("always run npm test before pushing") have failed repeatedly. Impediments #30–39 document agents routinely skipping the pre-commit checklist. The retinue regression (#35) reached production because scoped verification missed a shared dependency. The fix is automation: make the wrong thing impossible, not merely discouraged.

## Scope

Four deliverables, each independent enough to commit separately:

1. GitHub Actions CI workflow
2. Branch protection on `main`
3. Vercel build gate
4. Visibility (CI badge in CLAUDE.md)

---

## 1. GitHub Actions CI Workflow

**Create:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Test · Typecheck · Build
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Run tests
        run: npm test

      - name: Typecheck
        run: npx tsc --noEmit

      - name: Production build
        run: npx vite build
```

**Design decisions:**

- **Single job, not three parallel jobs.** The suite runs in ~30s total. Splitting into parallel jobs adds ~40s of setup overhead each (checkout + install). Serial is faster for this repo size.
- **`npm ci` not `npm install`.** Clean install from lockfile — reproducible, faster, catches lockfile drift.
- **Node 22.** Matches the prerequisite in CLAUDE.md. No `.nvmrc` exists — add one as part of this work (`echo "22" > .nvmrc`).
- **`timeout-minutes: 10`.** Impediment #31 documented test timeouts. 10 minutes is generous but prevents hung runners.
- **`concurrency` with `cancel-in-progress`.** If you push twice quickly, the first run cancels. Saves runner minutes.
- **Tests run first.** They're the primary safety net. If tests fail, we skip typecheck and build (fail fast).

## 2. Branch Protection on `main`

**Configure via GitHub repo settings** (Settings → Branches → Add rule):

- **Branch name pattern:** `main`
- **Require status checks to pass before merging:** Yes
  - Required check: `Test · Typecheck · Build` (the job name from step 1)
- **Require branches to be up to date before merging:** Yes
- **Do not allow bypassing the above settings:** Yes (applies to admins too)

**Note for Claude Code:** This is a GitHub UI configuration, not a code change. The user (Spliid) needs to do this manually in the GitHub repo settings, or it can be done via the GitHub CLI (`gh api`). Draft the `gh` commands but flag that the user needs to run them (requires admin access):

```bash
# Enable branch protection (requires repo admin)
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Test · Typecheck · Build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews=null \
  --field restrictions=null
```

**Important:** Don't require PR reviews — this is a solo dev project. Direct pushes to main should still work, but they must pass CI. The `enforce_admins=true` ensures even the repo owner can't bypass.

**Caveat:** Branch protection with required status checks on direct pushes works differently than on PRs. For direct pushes, GitHub runs CI but doesn't block the push — it only blocks PR merges. To truly block broken direct pushes, the user would need to either (a) always use PRs, or (b) add a local pre-push hook. Recommend documenting this limitation and adding a pre-push hook as a belt-and-suspenders measure:

```bash
# .husky/pre-push (optional local gate)
npm test && npx tsc --noEmit
```

This requires `husky` as a dev dependency. Make this optional — document it but don't force it. The primary gate is CI + Vercel.

## 3. Vercel Build Gate

**Edit:** `vercel.json`

Change:
```json
"buildCommand": "vite build"
```

To:
```json
"buildCommand": "npm test && vite build"
```

**Why `npm test && vite build` not `vitest run && vite build`:** `npm test` is already configured to run `vitest run` in package.json. Using the npm script is more resilient to future changes in the test runner.

**This is the belt-and-suspenders gate.** Even if someone pushes directly to main without a PR (bypassing GitHub Actions enforcement on merges), Vercel will refuse to deploy if tests fail. This is the hard gate that would have prevented the retinue regression (#35).

## 4. Visibility — CI Badge

**Edit:** `CLAUDE.md` — add a CI status badge near the top, after the first heading.

```markdown
[![CI](https://github.com/{owner}/{repo}/actions/workflows/ci.yml/badge.svg)](https://github.com/{owner}/{repo}/actions/workflows/ci.yml)
```

Replace `{owner}/{repo}` with the actual GitHub path. This gives every agent immediate visibility into suite health at session start without running anything.

Also add to the "Pre-commit minimum" section:

```markdown
> **CI enforces these automatically.** GitHub Actions runs all three on every push. Vercel runs tests before deploying. You don't need to remember — but you should still run locally to catch failures before pushing.
```

## 5. Housekeeping (while we're here)

- **Create `.nvmrc`** with content `22` — pins the Node version for `nvm use` and GitHub Actions.
- **Create `.node-version`** with content `22` — some tools (fnm, asdf) read this instead.

---

## File Changes Summary

| File | Action | Notes |
|------|--------|-------|
| `.github/workflows/ci.yml` | Create | New CI workflow |
| `vercel.json` | Edit | Add `npm test &&` to buildCommand |
| `CLAUDE.md` | Edit | Add CI badge, update pre-commit section |
| `.nvmrc` | Create | Contains `22` |
| `.node-version` | Create | Contains `22` |

## What Requires Manual Action (User)

| Action | Why |
|--------|-----|
| Enable branch protection on GitHub | Requires repo admin access |
| Verify CI badge URL uses correct `{owner}/{repo}` | Claude Code can check `git remote -v` |

## NFP Compliance

| Priority | Status |
|----------|--------|
| 1. Tunability | N/A — infrastructure, no game constants |
| 2. Inspectability | PASS — CI badge provides immediate visibility |
| 3. Determinism | N/A |
| 4. Fail-soft | PASS — CI failure blocks deploy but never breaks existing deployment |
| 5. Narrative | N/A |
| 6. Additive | PASS — adds workflow file and one line to vercel.json |
| 7. Performance | PASS — `cancel-in-progress` prevents wasted runner time |

---

## Implementation Order

1. Create `.nvmrc` and `.node-version`
2. Create `.github/workflows/ci.yml`
3. Edit `vercel.json` buildCommand
4. Edit `CLAUDE.md` (badge + pre-commit note)
5. Commit all, push to main
6. Verify CI runs green on GitHub Actions
7. Tell user to enable branch protection (provide `gh` command)
