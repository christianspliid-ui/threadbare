# CI doc-path filter — skip the heavy suite on doc-only changes

**Date:** 2026-06-23
**Author:** Cowork (design), at Christian's direction
**Status:** Implementation-ready, mechanical.
**Type:** CI / repo-hygiene. Touches only `.github/workflows/ci.yml`. Three-pillar rule N/A (no game feature).
**Project:** Repo Health

---

## Problem

`.github/workflows/ci.yml` runs the full `Test · Typecheck · Build` job (≤20 min: `npm ci` + tests + encounter-content lint + typecheck + `vite build`) on **every** push and PR to `main`, with no path filtering. The project commits documents constantly — plan-doc flushes (`flush-plan-docs` / the hourly pickup run), and `project-status.md` / `project-history.md` / `changelog.md` closeout edits — and each of those doc-only PRs triggers the entire suite. This is pure waste: no doc change can affect test/typecheck/build outcomes, yet every one pays the full CI cost and clogs the Actions queue (worsened by `concurrency` cancellation thrash when several doc PRs land close together).

## The constraint that makes this non-trivial

Branch protection on `main` requires the **`Test · Typecheck · Build`** status context (strict mode). The naive fix — `paths-ignore: ['**/*.md', …]` on the workflow triggers — **breaks merging**: when a workflow is skipped by a path filter, its required context never reports, and GitHub holds the PR in a permanent "Expected — Waiting for status to be reported" state. The required check must still *report* on doc-only PRs; it just shouldn't *run the work*.

## Solution — gate the heavy job behind a change-detection job

Keep the workflow always-triggering. Add a cheap `detect` job that decides whether any non-doc file changed, and make the heavy `check` job conditional on it. A required job that is **skipped via a job-level `if:`** reports a `skipped` conclusion, which GitHub counts as **success** for branch-protection purposes — so doc-only PRs merge with no heavy run, while code/mixed PRs run the full suite exactly as today.

Critically, the heavy job keeps the **exact** name `Test · Typecheck · Build`, so the branch-protection required-context config needs **no change** (a settings change would be a Christian-only action).

### Exact `ci.yml` rewrite

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

# Required: dorny/paths-filter reads the PR's changed-files list via the
# GitHub API, which needs pull-requests: read. The repo's default
# GITHUB_TOKEN is restricted (it failed with "Resource not accessible by
# integration" without this), so grant it explicitly.
permissions:
  contents: read
  pull-requests: read

jobs:
  detect:
    name: Detect code changes
    runs-on: ubuntu-latest
    outputs:
      code: ${{ steps.filter.outputs.code }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          # 'code' is true if ANY changed file is not a doc.
          filters: |
            code:
              - '**'
              - '!**/*.md'
              - '!Docs/**'
              - '!.planning/**'
              - '!Design/**'

  check:
    name: Test · Typecheck · Build
    needs: detect
    if: needs.detect.outputs.code == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Process lint (advisory)
        continue-on-error: true
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
        run: npm run check:process
      - name: Run tests
        run: npm test
      - name: Lint encounter content
        run: npm run lint:encounter-content
      - name: Typecheck
        run: npx tsc --noEmit
      - name: Production build
        run: npx vite build
```

### What skips vs. what still gates

- **Skips the suite (doc-only PRs):** `**/*.md` anywhere, and everything under `Docs/`, `.planning/`, `Design/`.
- **Still runs the full suite:** anything under `src/`, `world-model.json` (drives `validate-model` + game state — must be tested), `package.json` / lockfile, `.github/**` (workflow changes must gate themselves), and any PR that mixes docs with code (the `**` positive pattern matches the code file, so `code == 'true'`).

## Edge cases & fallback

- **Mixed PR (doc + code):** `detect` reports `code == 'true'` → full suite runs. Correct — no way to merge a code change untested.
- **If GitHub does *not* treat the skipped required check as success on this repo** (org policy can vary): fall back to the two-workflow shim pattern — add `paths-ignore` for the doc globs to `ci.yml`, and add a second workflow `ci-docs.yml` triggered on `paths:` = those same globs with a job named **exactly** `Test · Typecheck · Build` that just `run: echo "docs-only, no checks required"`. This reports the required context green on doc-only PRs. Use this only if the primary approach leaves PRs stuck "pending."
- **`dorny/paths-filter` third-party action:** if a first-party-only policy is preferred, replace `detect` with a `git diff --name-only` script against the PR base (`${{ github.event.pull_request.base.sha }}`) / push before-SHA and set the output from grep. The dorny action is the simpler, battle-tested default.

## Verification (Done when)

1. Open a **doc-only** test PR (touch a single `.md`): the `check` job shows **skipped**, the `Test · Typecheck · Build` required context reports green, and the PR is mergeable without the 20-min run.
2. Open a **code** test PR (touch a file under `src/`): the `check` job runs the full suite as today.
3. Open a **mixed** test PR: full suite runs.
4. Closing commit body carries `Fixes <issue>`.

## Coordination

- **Parallel-safe with THR-487** (CI cleanup) — disjoint files: this issue touches only `ci.yml`; THR-487 touches `linear-autoclose.yml` and deletes `claude-review.yml`. Whoever lands second rebases (trivial — different files).
- **Mutex with:** none.
- **Suggested model:** sonnet (mechanical YAML).
