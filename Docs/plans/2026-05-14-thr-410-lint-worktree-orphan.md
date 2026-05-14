# THR-410: Worktree Orphan Scanner

**Filed:** 2026-05-14  
**Issue:** THR-410  
**Status:** Shipped (2026-05-14)

---

## 1. Problem

Codex/Claude worktrees are full repo checkouts.  A session can author design files
(`TheFantasyWorldSimulator/Vision/*.md`, `TheFantasyWorldSimulator/Brainstorms/*.md`,
`Docs/plans/*.md`, etc.) without committing or merging them.  If the session ends or
the branch dies, those files persist in the worktree but are invisible to:

- Cowork sessions checking only the main repo
- Obsidian MCP queries against the canonical vault
- Glob/grep across either surface

Concretely: THR-406 surfaced 5 Vision/ files + 2 Brainstorm files that were authored in
a worktree, never merged, and stayed invisible until the user noticed a dangling Obsidian
link.  Without that discovery, the rulebook plan (THR-403) would have shipped with a
stale "Vision/ files don't exist" caveat.

---

## 2. Corrections vs. issue body

The original issue description (filed 2026-05-11) predates the settled drift-scan
architecture.  **Implement this doc, not the issue body verbatim.**

1. **The drift scan is a single orchestrated program.**  Signals live as `SignalStep`
   objects in `scripts/drift-scan/index.ts`; there are no per-lint workflow steps.
2. **GitHub Actions cannot see the user's worktrees.**  The runner does a fresh
   single-branch checkout; the ~60 worktrees exist only on the user's local machine.
   This scan therefore runs **locally** via a scheduled task, not in CI.

---

## 3. What ships

| Artifact | Path | Change type |
|---|---|---|
| Linear helpers module | `scripts/drift-scan/linear.ts` | New — extracted from `index.ts` |
| Orphan scanner | `scripts/lint-worktree-orphan.ts` | New |
| Unit tests | `scripts/__tests__/lint-worktree-orphan.test.ts` | New (20 tests) |
| Plan doc | `Docs/plans/2026-05-14-thr-410-lint-worktree-orphan.md` | New |

Scheduled task creation (registering `weekly-worktree-orphan-scan`) is deferred to
an interactive session — see §6.3.

---

## 4. Architecture

### 4.1 `scripts/drift-scan/linear.ts` — shared helpers

`scripts/drift-scan/index.ts` previously contained the Linear GraphQL transport inline.
`scripts/lint-worktree-orphan.ts` needs the same transport.  Rather than duplicating:

- New `linear.ts` exports: `LINEAR_API_KEY`, `linearGql`, `ensureDriftScanLabelId`,
  `resolveBacklogStateId`, `findIssueByExactTitle`, `createDriftIssue`.
- `index.ts` imports from `./linear` — behaviour-preserving, no logic changes.
- `lint-worktree-orphan.ts` also imports from `./drift-scan/linear`.

### 4.2 `scripts/lint-worktree-orphan.ts` — scan logic

Algorithm:

1. Run `git -C <repo> worktree list --porcelain` to enumerate all registered worktrees.
2. Skip the main worktree (first entry in the list).
3. For each non-main worktree:
   a. Get the last commit date via `git -C <path> log -1 --format=%as`.
   b. Skip if the commit is younger than `WORKTREE_STALENESS_DAYS` (active work).
   c. Enumerate files matching `ORPHAN_SCOPE_PATTERNS` (`.md` only).
   d. For each in-scope file, check if it exists in:
      - The main repo (by exact relative path).
      - The canonical Obsidian vault at `OBSIDIAN_VAULT_PATH/<relPath>` (for
        `TheFantasyWorldSimulator/*` paths only).
   e. If neither → orphan.  Classify as `"vault"` or `"repo"` promotion target.
4. Aggregate: if a worktree has > `ORPHAN_AGGREGATE_THRESHOLD` orphans, emit one
   summary issue instead of N individual ones.
5. Dedup: every issue title is date-less, keyed by `(relPath, worktreeName)` or
   `worktreeName` for aggregates.  `findIssueByExactTitle` skips existing issues.

### 4.3 Idempotency design

Issue titles follow the patterns below — no dates, so `findIssueByExactTitle` correctly
deduplicates across weekly runs:

```
worktree-orphan: <relPath> in <worktreeName>
worktree-orphan (aggregate): <worktreeName>
```

A worktree orphan is a *standing* condition, not a delta.  Date-stamped titles would
create a new issue every week even if nothing changed.

---

## 5. Constants table (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `WORKTREE_STALENESS_DAYS` | 7 | Skip worktrees younger than this — active work |
| `ORPHAN_AGGREGATE_THRESHOLD` | 3 | If orphans > this, emit one aggregate issue |
| `ORPHAN_SCOPE_PATTERNS` | 5 dirs | Directories in scope for orphan detection |
| `ORPHAN_FILE_EXTENSION` | `.md` | Only markdown files are checked |
| `ORPHAN_EXCLUDE_DIRS` | 6 dirs | `.git`, `node_modules`, `dist`, etc. |

---

## 6. Fail-soft table (NFP #4)

| Failure case | Fallback |
|---|---|
| `git worktree list` fails | Throws with descriptive error; script exits non-zero |
| `git log` for last commit fails | `lastCommitDate = null` → isStaleWorktree returns `false` → worktree skipped safely |
| Worktree directory not accessible | `fs.existsSync` returns false → no files collected, scan continues |
| `OBSIDIAN_VAULT_PATH` not set | Vault check skipped; only main-repo presence is checked |
| Linear API failure | Throws; script exits non-zero (caller must retry) |

---

## 7. NFP compliance

| NFP | Status | Note |
|---|---|---|
| #1 Tunability | PASS | All 5 threshold constants named and exported |
| #2 Inspectability | PASS | Console output per worktree, per orphan, aggregate counts |
| #3 Determinism | N/A | File scan is deterministic; Linear issue creation is idempotent |
| #4 Fail-soft | PASS | See fail-soft table above |
| #5 Narrative | N/A | Infrastructure script |
| #6 Additive | PASS | `index.ts` import-only edit; no logic removed |
| #7 Performance | N/A | Runs weekly; no performance budget |

---

## 8. Three-pillar check

| Pillar | Status |
|---|---|
| Engine | N/A — no game engine changes |
| Content | N/A — no content template changes |
| UI | N/A — no UI changes |

Single-pillar Infrastructure issue.  Browser-verify exempt per Definition of Done.

---

## 6.3 Deferred: scheduled task creation

Creating `weekly-worktree-orphan-scan` requires `mcp__scheduled-tasks__create_scheduled_task`
which is blocked inside scheduled CC sessions (same impediment as `monthly-rulebook-review`,
THR-405).

**TODO(THR-XXX): Create `weekly-worktree-orphan-scan` scheduled task from an interactive session.**

Command when ready:
```
create_scheduled_task(
  taskId: "weekly-worktree-orphan-scan",
  description: "Scan worktrees for orphaned design files not merged to main or vault",
  cronExpression: "0 14 * * 5",  // Fridays 14:00 UTC (after drift scan)
  prompt: "Run the worktree orphan scanner. Execute: node --experimental-strip-types scripts/lint-worktree-orphan.ts (no --dry-run). Requires LINEAR_API_KEY and OBSIDIAN_VAULT_PATH env vars. Log any new issues created."
)
```

---

*Generated by Claude Code (Sonnet) — THR-410 implementation 2026-05-14.*
