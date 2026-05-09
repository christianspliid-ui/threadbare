# Cowork session-start staleness gate — Plan

**Date:** 2026-05-09
**Status:** Implementation Planning → Ready for Dev (CC, sonnet)
**Pillars touched:** Tooling / process (Engine N/A, Content N/A, UI N/A — see rationale below)
**Author:** Cowork

## Problem

Cowork sessions and the user's local review surface both operate on whatever branch happens to be checked out — with no signal when that branch has drifted from `origin/main`. Hourly CC and Codex automations merge cleanly into main via worktrees; anything *not* in a worktree (the user's primary tree, Cowork's view of the repo) silently goes stale.

Concrete case (2026-05-09): the user opened a Cowork session on `docs/thr-356-closeout`, which is 146 commits behind `origin/main`. Cowork designed and shipped THR-389 in that session. Later the user tried to review the shipped feature locally and saw nothing — the foreshadowing module is on main, not on `docs/thr-356-closeout`. The local dev server reflects pre-foreshadowing reality. Hours of confusion.

The same drift causes a worse failure mode that nearly happened: Cowork could design something that already exists on main, wasting an entire CC cycle on a duplicate. We got lucky once; the fix is making it impossible to be lucky next time.

## Goals

- At Cowork session start, surface branch staleness loudly *before* any design work begins.
- Warn but do not block — preserves user autonomy when staleness is intentional (legitimate in-progress branch, bisecting, etc.).
- Catch the related smell of long-lived non-main branches that aren't worktrees, since those are usually closeout branches that should have been merged hours ago.
- Cowork agent reads the warning and threads it into its first response so the user can't miss it.

## Non-goals

- Not Layer 2 (move Cowork into a worktree) — separate ticket if/when this proves insufficient.
- Not Layer 3 (stale-branch detector automation) — separate ticket; useful but bigger.
- Not auto-rebasing — too many edge cases (uncommitted work, conflicts) to unleash automatically. Warning is enough.
- Not a CC/Codex precheck change — those agents already run in worktrees and don't have this drift problem.

---

## Design

### Where the check lives

Extend the existing `scripts/session-precheck.ts`. CLAUDE.md already calls it out as the first tool call of any coding session. The script's existing pattern is:

- Each probe is a `ProbeResult` with `name`, `status` (`yes` | `no` | `unknown`), `detail`, optional `durationMs`.
- Probes are independent and fail-soft — a probe error is captured as `unknown`, never crashes the script.
- Output is human-readable lines plus a one-line `fingerprint` that downstream automation greps.

Add a new probe `probeBranchStaleness` and include its result in the fingerprint.

### What `probeBranchStaleness` does

```
1. git fetch origin --quiet (timeout 10s, env GIT_TERMINAL_PROMPT=0)
2. git rev-parse --abbrev-ref HEAD                  → current branch name
3. git rev-list --count HEAD..origin/main           → commits behind
4. git rev-list --count origin/main..HEAD           → commits ahead
5. git log -1 --format=%cI origin/<branch>          → branch tip ISO date (best effort)
6. Detect worktree: read .git — if it points to a separate worktree path, mark `worktree=yes`
```

### Status thresholds

| Condition | Status | Detail |
|---|---|---|
| On `main`, ≤ 0 commits behind | `yes` | `on main, current` |
| Any branch, behind by < 5 commits | `yes` | `on <branch>, behind by N` |
| Behind by ≥ 5 commits | `no` | `on <branch>, behind by N — pull main before designing` |
| On non-main branch ≥ 24h old, not a worktree | `no` | `on <branch> (age Xh, not a worktree) — likely a stale closeout branch` |
| Detached HEAD | `unknown` | `detached HEAD` |
| `git fetch` failed (offline, auth, etc.) | `unknown` | `<git error first-line>` |
| Not a git repo | `unknown` | `not a git repo` |

Both "behind ≥ 5 commits" and "non-main branch ≥ 24h old not a worktree" yield `status=no`. Either alone is enough to warn.

### Fingerprint extension

Today: `fingerprint rg=yes git=yes test=2.34s cu=read`

After this change: `fingerprint rg=yes git=yes test=2.34s cu=read freshness=behind:146`

Possible `freshness` values:
- `freshness=current` — on main, no drift
- `freshness=ahead:N` — on main, N commits ahead (uncommitted local work; not stale, just unmerged)
- `freshness=behind:N` — N commits behind origin/main, on any branch
- `freshness=stale-branch:Xh` — on a non-main branch X hours old, not a worktree
- `freshness=behind:N+stale-branch:Xh` — both
- `freshness=detached` — detached HEAD
- `freshness=unknown` — git fetch failed or not a git repo

Cowork (and any other agent) reads the fingerprint, parses `freshness`, and surfaces the warning verbatim if it's not `current` / `ahead:*`.

### Constants

| Constant | Default | Purpose |
|---|---|---|
| `STALENESS_BEHIND_THRESHOLD` | 5 | Commits behind origin/main before warning |
| `STALENESS_BRANCH_AGE_THRESHOLD_MS` | 24 * 3600 * 1000 (24h) | Age of non-main, non-worktree branches before warning |
| `GIT_FETCH_TIMEOUT_MS` | 10_000 | Network-bounded |
| `GIT_REVLIST_TIMEOUT_MS` | 5_000 | Local git op |

All in `scripts/session-precheck.ts` alongside existing constants.

### Fail-soft

| Failure case | Behavior |
|---|---|
| `git fetch` fails (offline, auth issue, network) | `freshness=unknown`, detail includes git error first line. No warning issued — we do not know if you are stale. |
| `git rev-list` fails | `freshness=unknown` |
| Repository has no `origin` remote | `freshness=unknown` (detail: `no origin remote`) |
| `origin/main` does not exist | `freshness=unknown` (detail: `no origin/main`) |
| Detached HEAD | `freshness=detached` |
| `.git` read fails for worktree detection | Treat as not-a-worktree; warning may fire on a worktree, that's fine — user can override |

The script never throws. Pre-existing pattern — every other probe is fail-soft.

---

## CLAUDE.md update

Add to the Session Workflow section (immediately after the existing precheck bullet):

> **Read the freshness signal.** The session-precheck output line `fingerprint ... freshness=<value>` reports working-tree staleness vs `origin/main`. If `freshness` is `behind:*`, `stale-branch:*`, or any combination, the agent MUST surface this to the user as the first thing in the response, with the exact fix command (`git fetch && git pull` for main; `git fetch && git rebase origin/main` or branch-merge for other branches). Do not begin design work until the user has either resolved the staleness or explicitly acknowledged it. `freshness=unknown` is *not* a free pass — surface it and ask the user to confirm whether the tree is current.

This applies equally to Cowork (where it solves the originating problem) and to CC/Codex interactive sessions started by the user.

---

## Three-pillar check

| Pillar | Status | Rationale |
|---|---|---|
| Engine | N/A | This is tooling/process work; no engine code touched. |
| Content | N/A | No content changes. |
| UI | N/A | No game-UI changes. The "user-facing surface" is the agent's chat warning, which is covered by the CLAUDE.md edit. |

This is one of the few legitimate three-pillars-N/A cases per CLAUDE.md design governance: pure agent-runtime tooling that produces a textual signal consumed by other agents. No game systems, no graph nodes, no encounter content, no React components.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Constants table for the two thresholds; both named, defaulted, easy to adjust |
| 2. Inspectability | PASS | Output is human-readable + one-line fingerprint that any agent can parse; existing pattern |
| 3. Determinism | PASS | Pure function of git state at call time; no PRNG involved |
| 4. Fail-soft | PASS | Every git failure mode produces `unknown`, never throws |
| 5. Narrative over mechanical | N/A | Tooling, no narrative concerns |
| 6. Additive | PASS | New probe, new fingerprint key; existing probes and fingerprint keys untouched. Old parsers ignoring the new key still work. |
| 7. Performance | PASS | One `git fetch` (network-bounded, 10s cap) + two local `git rev-list` calls (sub-second). Adds ≤ 12s to session start. Existing `npm test` probe already dominates the budget. |

## Implementation phases

Single CC ticket, suggested as one or two commits:

1. Extend `scripts/session-precheck.ts` with `probeBranchStaleness`, fingerprint key, constants. Unit tests in `scripts/__tests__/session-precheck.test.ts` covering each freshness value (mock git output).
2. Update `CLAUDE.md` Session Workflow section with the freshness-handling rule.
3. Update `Docs/changelog.md`, `Docs/project-history.md`, `Docs/project-status.md`.

### Verification

- `npm test` clean (the new `session-precheck` tests must be in the pass count)
- `npx tsc --noEmit` clean
- `npx vite build` clean
- Manual smoke 1: `node --experimental-strip-types scripts/session-precheck.ts` on main with no drift → `freshness=current`
- Manual smoke 2: same command on a branch known to be behind by ≥ 5 commits → `freshness=behind:N`
- Manual smoke 3: same command on a 24h+ old branch → `freshness=stale-branch:Xh`
- Manual smoke 4: with no network access → `freshness=unknown` and the script exits 0 (does not crash)

Verification evidence required at closeout per Definition of Done.

---

## Coordination block

```
Suggested model: sonnet
Parallel-safe with:
  - Any work that does NOT touch scripts/session-precheck.ts
  - Any work that does NOT touch the Session Workflow section of CLAUDE.md
  - All Engine / Content / UI tickets — this change is process-only
Mutex with:
  - Other changes to scripts/session-precheck.ts
  - Other CLAUDE.md edits to the Session Workflow section (additive merges OK if no overlap with new bullet)
```

Required matching label: `model:sonnet`.

## Future work (separate tickets)

- **Layer 2** — move Cowork into a worktree on `origin/main` so Cowork itself never operates on a stale tree, regardless of what the user has checked out. Open if Layer 1 alone proves insufficient after a week or so.
- **Layer 3** — daily/hourly stale-branch detector that lists branches behind main or older than 48h and surfaces them as a hygiene Linear issue. Auto-cleans fully-merged closeout/pickup branches.
- **Closeout protocol audit** — investigate why `docs/thr-356-closeout`-style branches exist at all. If closeout work is supposed to commit to main directly, the protocol may need tightening.
