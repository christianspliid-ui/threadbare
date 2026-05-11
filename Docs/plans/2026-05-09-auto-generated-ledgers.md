# Auto-generated ledgers — Plan

**Date:** 2026-05-09
**Status:** Implementation Planning → Ready for Dev (CC, sonnet)
**Pillars touched:** Tooling / process (Engine N/A, Content N/A, UI N/A)
**Related:** THR-391 (sister fix in the same campaign — "keep main clean")
**Author:** Cowork

## Problem

`Docs/changelog.md` and `Docs/project-history.md` are append-only ledgers that every CC closeout currently hand-edits. With multiple parallel CC and Codex automations landing per hour, these two files are merge-conflict hotspots. They're also *derived* — every entry is keyed to a `Fixes THR-XX` merge commit — so hand-editing is doing work the system could do itself.

User-stated cost (2026-05-09): "this seems to be something that happens constantly with the new setup and the different agents running every hour."

The two files are a clean fit for auto-generation because:

- They are append-only, never re-edited
- Every entry corresponds 1:1 with a closed Linear issue
- The Linear issue contains all the data needed (ID, title, completion date, project)
- The post-merge auto-close pattern already exists (`.github/workflows/linear-autoclose.yml`) and works reliably

`project-status.md` and `impediments.md` are *not* in scope here — they're curated views, not derived ledgers, and removing the curated ones would lose value the auto-generated ones can't replace.

## Goals

- Eliminate hand-editing of `changelog.md` and `project-history.md` by CC and Codex.
- Generation is post-merge, not blocking; PRs merge as fast as they do today.
- Idempotent — running twice for the same merge appends nothing the second time.
- Fail-soft — if Linear API is unreachable, the workflow logs a warning and exits 0; merge succeeds, ledgers go un-updated for that merge, retry on next push.
- Definition of Done in CLAUDE.md updates to reflect the new responsibility split.

## Non-goals

- Not regenerating `project-status.md` (curated; future ticket if pain remains).
- Not auto-generating `impediments.md` (not closeout-driven; has narrative framing).
- Not backfilling old entries (forward-only — historical entries stay as-is).
- Not changing the auto-close pattern itself.
- Not deduping/migrating long-form historical project-history entries to one-line format. New entries are one-line per CLAUDE.md spec; old ones can stay.

---

## Design

### Where the workflow lives

New file: `.github/workflows/regenerate-ledgers.yml`. Sibling of the existing `linear-autoclose.yml`. Both workflows trigger on the same event; they're independent and can run concurrently.

Pattern is copied from `linear-autoclose.yml`:

- Trigger: `push: branches: [main]`
- Auth: existing `LINEAR_API_KEY` GitHub secret (no new secret needed)
- Issue-ID extraction regex: `/(?:Fixes|Closes|Resolves)\s+(THR-\d+)/gi` (same as auto-close)

### Loop prevention

The workflow itself pushes a commit. Without a guard this loops forever.

Two-layer guard:

1. Skip if the latest commit message starts with `chore(ledgers):` — the workflow's own commits are explicitly recognizable.
2. Skip if no `Fixes|Closes|Resolves THR-XX` is present in the push's commits.

Both filters run before any Linear API call, so a `chore(ledgers):` push exits in milliseconds.

### What the workflow does

```
on push to main:
  1. Collect commit messages from this push (compareCommits before→after, same as auto-close)
  2. If no commit message matches the issue-ID pattern → exit 0 (no work)
  3. If the latest commit message starts with "chore(ledgers):" → exit 0 (loop guard)
  4. For each unique issue ID found:
       a. Read Docs/changelog.md and Docs/project-history.md from the checkout
       b. If the issue ID already appears in either file → skip that file (idempotency)
       c. Else: fetch the issue from Linear (id, title, completedAt, project)
       d. Append generated entries using deterministic templates
  5. If any file changed → git add, git commit -m "chore(ledgers): regenerate for THR-XXX[, THR-YYY]", git push
  6. If no file changed → exit 0
```

### Generated entry formats

`project-history.md` (one line per spec in CLAUDE.md):

```
✅ **THR-389** (2026-05-09) — Encounter foreshadowing — clickable agent intent prose with intervention attribution. (auto-generated from Linear)
```

The `(auto-generated from Linear)` suffix is deliberate — it tells future readers and agents that the entry can be regenerated and is not the source of truth. Truth is the Linear issue.

`changelog.md` (table row per spec):

```
| 2026-05-09 | Encounter Experience | THR-389 — Encounter foreshadowing (auto-generated from Linear) | See Linear issue THR-389 |
```

`Encounter Experience` is the Linear issue's project name. The "Why" column is filled with `See Linear issue THR-XXX` — the auto-generator can't infer a meaningful "why" without re-implementing the Linear issue's description analysis, which isn't worth it. Humans can append free-form rows above the auto-generated section if richer prose is wanted.

Both formats are conservative: short, deterministic, link-able. Length and richness can be expanded in a follow-up ticket if the minimal entries prove insufficient.

### Idempotency check

Before appending to either file, grep the file for the issue ID:

```js
if (existingFileContent.match(new RegExp(`\\b${issueId}\\b`))) {
  console.log(`${issueId} already present in <file> — skipping`);
  continue;
}
```

This means: if a human has already written a richer entry for THR-389 manually, the auto-generator respects it and doesn't append a duplicate. Auto-generation is for the case where no human wrote anything.

### Authentication and rate limits

- Linear API: same `LINEAR_API_KEY` secret as `linear-autoclose.yml`. One GraphQL query per issue ID. Linear's GraphQL rate limit (1500 req/15min) is far above what we'll hit.
- Git push: uses the default `GITHUB_TOKEN` available to all workflows. The workflow needs `contents: write` permission — add to the workflow file.

### Implementation language

Two viable shapes:

**Option A — inline `actions/github-script@v7`**, like `linear-autoclose.yml`. Pros: no new files, single source of truth, fast iteration. Cons: harder to unit test; logic lives in YAML.

**Option B — extracted script** at `scripts/regenerate-ledgers.ts`, called by the workflow via `node --experimental-strip-types`. Pros: directly unit-testable with vitest, mockable Linear client, reusable from local dev for backfills. Cons: more files, slightly more setup.

**Recommendation: Option B.** The logic has enough branching (per-issue idempotency, multi-file writes, format templates) that unit tests are worth the file. CC implementing this should write the script first with mocked Linear responses, then wire the workflow.

### Constants

In `scripts/regenerate-ledgers.ts`:

| Constant | Default | Purpose |
|---|---|---|
| `LEDGER_COMMIT_MESSAGE_PREFIX` | `"chore(ledgers): "` | Loop-guard recognizer + commit message format |
| `PROJECT_HISTORY_PATH` | `"Docs/project-history.md"` | Target file |
| `CHANGELOG_PATH` | `"Docs/changelog.md"` | Target file |
| `LEDGER_AUTO_GEN_SUFFIX` | `"(auto-generated from Linear)"` | Marks generated entries |
| `LINEAR_API_TIMEOUT_MS` | `10_000` | Network-bounded |

### Fail-soft

| Failure case | Behavior |
|---|---|
| `LINEAR_API_KEY` secret missing | Log warning, exit 0. Same pattern as `linear-autoclose.yml` |
| Linear API query fails (network, 5xx, auth) | Log warning, exit 0 for that issue ID. Other issue IDs still process. |
| Linear API returns issue not found | Log warning, skip that issue ID, continue |
| Issue is not in a "completed" state in Linear yet (auto-close hasn't fired or failed) | Generate entry anyway — the merge has happened, the ledger should reflect it |
| File read fails | Log warning, exit 1 (this is unexpected; surface it) |
| `git push` fails (race, branch protection edge case) | Workflow shows red; manual intervention needed. The ledger entries land on the next successful push. |

The only hard failure is read-fails — everything else is silent-skip.

### Where the new responsibility leaves the Definition of Done

CLAUDE.md's Definition of Done currently says:

> **Update docs** — `project-status.md` (≤60 lines, move old entries to `project-history.md`), `project-history.md` (one-line `✅` entry), `changelog.md` (append rows). Add a completion comment to the Linear issue (the `Fixes THR-XX` keyword in the commit auto-closes it, but a human-readable comment is still expected).

Edit (additive, surgical — does not touch surrounding bullets):

> **Update docs** — `project-status.md` (≤60 lines, move old entries to `project-history.md`). `project-history.md` and `changelog.md` are auto-generated by the `regenerate-ledgers` Action on every `Fixes THR-XX` merge — do not hand-edit unless a richer entry is wanted (the auto-generator's idempotency check will respect a human-written entry that already references the issue ID). Add a completion comment to the Linear issue (the `Fixes THR-XX` keyword in the commit auto-closes it, but a human-readable comment is still expected).

---

## Three-pillar check

| Pillar | Status | Rationale |
|---|---|---|
| Engine | N/A | Process tooling; no engine code |
| Content | N/A | No content changes |
| UI | N/A | No UI changes |

Same legitimate three-pillars-N/A pattern as THR-391.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Constants table; commit message prefix, paths, suffix all named |
| 2. Inspectability | PASS | Workflow logs every action (skipped, fetched, appended); commit message itself names the issue IDs |
| 3. Determinism | PASS | Same Linear state + same commit log → same generated content. No PRNG. |
| 4. Fail-soft | PASS | Every Linear failure path → silent skip; never blocks merges |
| 5. Narrative over mechanical | N/A | Tooling |
| 6. Additive | PASS | New workflow + new script; existing files appended-to only; existing entries untouched |
| 7. Performance | PASS | One Linear query per issue ID per push; commit + push add ~10s post-merge |

## Implementation phases

Single CC ticket, suggested commit cadence:

1. **Script** — `scripts/regenerate-ledgers.ts` with:
   - Pure functions for each step (parse commit messages, query Linear, generate entries, idempotency check)
   - Mockable Linear client interface
   - Unit tests in `scripts/__tests__/regenerate-ledgers.test.ts` covering: idempotency, multi-issue commit, missing API key, Linear failure, loop-guard prefix detection, entry-format determinism
   - Manual local-run mode (`node --experimental-strip-types scripts/regenerate-ledgers.ts --dry-run`) for testing

2. **Workflow** — `.github/workflows/regenerate-ledgers.yml`:
   - Trigger on push to main
   - `contents: write` permission
   - Calls the script
   - Commits with `chore(ledgers): regenerate for THR-XXX[, THR-YYY]` if anything changed
   - Pushes back to main
   - Includes the loop-guard so its own commits don't re-trigger

3. **CLAUDE.md edit** — surgical update to the **Definition of Done** "Update docs" bullet (text shown above). Do not rewrite surrounding bullets.

4. **Doc closeout** — `project-status.md`, `project-history.md`, `changelog.md` updated for THR-XXX itself. Note that *this* commit's `project-history.md` and `changelog.md` entries can be either hand-written (and will be respected by the new auto-generator on the next push) or left for the auto-generator to fill — author's choice. Hand-written is fine for the bootstrapping commit.

### Verification

- `npm test` clean (new `regenerate-ledgers.test.ts` tests must be in pass count)
- `npx tsc --noEmit` clean
- `npx vite build` clean
- Manual smoke 1: `node --experimental-strip-types scripts/regenerate-ledgers.ts --dry-run --commit-sha=<a recent merge commit>` — confirm output matches expected entry format, no actual writes
- Manual smoke 2: trigger the workflow on a test branch with `Fixes THR-NNN` (a known-real issue ID) in a commit message — confirm a `chore(ledgers):` commit appears with correct entries; confirm running again is a no-op
- Manual smoke 3: confirm idempotency — pre-write a manual entry referencing THR-NNN, push, confirm the workflow does *not* duplicate

Verification evidence required at closeout per Definition of Done.

---

## Coordination block

```
Suggested model: sonnet
Parallel-safe with:
  - Any work that does NOT touch .github/workflows/regenerate-ledgers.yml or scripts/regenerate-ledgers.ts
  - Any work that does NOT touch the Definition of Done section of CLAUDE.md
  - All Engine / Content / UI tickets — process-only change
Mutex with:
  - Other changes to .github/workflows/ that affect push-to-main triggers
  - Other CLAUDE.md edits to the Definition of Done section (additive merges OK if no overlap)
  - THR-391 (Cowork session staleness gate) — both modify CLAUDE.md and both should not be merged simultaneously to avoid section-conflict noise. Sequence them.
```

Required matching label: `model:sonnet`.

## Future work (separate tickets)

- **`project-status.md` curated-section auto-update** — open if `project-status.md` continues to be a merge-conflict source after this lands. Could auto-generate a "Recently Shipped" section at top while leaving the curated current-state below it.
- **Backfill historical entries** — the auto-generator is forward-only. If we want to normalize all historical project-history entries to one-line format, that's a separate one-shot script ticket.
- **Richer "why" generation** — if the `See Linear issue THR-XXX` placeholder in the changelog "Why" column proves too thin, a follow-up could pull the first paragraph of the issue description, or the first sentence of the closing comment, and embed it.
- **Cross-link plan docs** — could append a link to the corresponding `Docs/plans/YYYY-MM-DD-*.md` if one exists (parsed from the issue description). Useful but additive.
