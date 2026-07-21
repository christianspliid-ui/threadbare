# THR-410 — `lint-worktree-orphan`: weekly drift signal for content stranded in worktrees

**Issue:** THR-410 · Project: Content Architecture · Priority: Medium
**Author:** Cowork (`keep-work-flowing`), 2026-05-14
**Status:** Ready for Dev
**Origin:** THR-406 surfaced the failure mode — Vision/ design content authored inside a Codex worktree, never merged, invisible to every canonical surface.

---

## 1. Summary

Add a **weekly worktree-orphan scan** that flags design/content files which exist *only* inside a stale git worktree — not in the main repo and not in the canonical Obsidian vault — and files one `drift-scan`-labeled Linear issue per orphan (with per-worktree aggregation to prevent spam). The weekly retrospective already ingests `drift-scan`-labeled issues, so the signal plugs into the existing continuous-improvement loop with no retro-side changes.

This is **process / CI tooling**. It is a single-pillar (Infrastructure) issue — Content and UI pillars are explicitly N/A (see §7).

---

## 2. Two corrections to the issue body (read before implementing)

The THR-410 issue was filed 2026-05-11. Two of its stated assumptions are now wrong against the codebase as it actually stands. **Both corrections are baked into this plan — do not implement the issue body verbatim.**

### 2a. The drift scan is a single orchestrated program, not a folder of standalone lint scripts

The issue says "Extend `.github/workflows/drift-scan.yml` … with a new lint script." But the current architecture (as of `scripts/drift-scan/index.ts`, last extended 2026-05-12 with signals S6–S10) is:

- **All signals are `SignalStep` objects** inside `scripts/drift-scan/index.ts`'s `steps: SignalStep[]` array (S1–S10 today).
- Signal *logic* may live in a sibling module — e.g. `scripts/lint-rulebook.ts` exports `lintRulebookVsUl` / `lintRulebookVsCanon` / … which `index.ts` imports and wires as S6–S10.
- The workflow runs exactly one command: `node --experimental-strip-types scripts/drift-scan/index.ts`. There are **no per-lint workflow steps** to extend.

So the issue's named file `scripts/lint-worktree-orphan.ts` is correct as a **module**, but it is consumed differently than the issue assumed — see §2b for the bigger reason it is *not* wired into `index.ts` at all.

The "**Mutex with THR-404**" note in the issue is **resolved**: THR-404's rulebook signals (S6–S10) have already shipped into `index.ts`. THR-410 as designed here does not touch the `steps` array, so it is now broadly parallel-safe.

### 2b. The GitHub Actions runner cannot see the user's worktrees — the scan must run locally

`.github/workflows/drift-scan.yml` runs on `ubuntu-latest` and does `actions/checkout@v4` with `ref: main` — a **fresh, single-branch checkout**. `git worktree list` on that runner returns only the main worktree. The ~61 worktrees this signal exists to audit live exclusively on the user's machine (`C:\Users\chris\Dev\…`). **A CI-hosted signal physically cannot enumerate them.**

Therefore the worktree-orphan scan is implemented as a **standalone local runnable** invoked by a **local scheduled task** (`weekly-worktree-orphan-scan`), not as a drift-scan signal (S11) and not as a `drift-scan.yml` step. This mirrors the precedent of `flush-plan-docs`, `weekly-retro`, and `weekly-memory-grooming` — all local scheduled tasks that run on the user's machine because they need local filesystem state the CI runner doesn't have.

It still mirrors the drift-scan **output contract** exactly: `drift-scan`-labeled Linear issues in the Continuous Improvement project, consumed by the weekly retro. From the retro's point of view nothing changes — it just sees more `drift-scan` issues.

> **Cowork decision, noted per `keep-work-flowing` autonomy clause:** running locally rather than in CI is the only correct option (CI has no worktrees), so this is not a real fork — it is a correction. No Christian decision required. The one genuine choice — *new dedicated scheduled task* vs *fold into the existing `weekly-retro` task* — is resolved in favour of a **new dedicated task** (§5) so the scan runs ~1h before the retro and its issues are already filed when the retro starts, matching the CI drift-scan's Friday-14:00 / retro-Friday-15:00 cadence.

---

## 3. Engine pillar — the scan module and its logic

> "Engine" here means the script architecture. There is no game-engine surface; this never runs inside the tick loop.

### 3.1 New module: `scripts/lint-worktree-orphan.ts`

A standalone runnable (has a `main()` and a shebang) **and** an exporter of pure functions for unit testing — same dual shape as `scripts/lint-rulebook.ts`.

**Exports:**
- `enumerateWorktrees(repoRoot: string): WorktreeInfo[]` — wraps `git worktree list --porcelain`; returns `{ path, branch, lastCommitDate }[]`, main worktree excluded.
- `findOrphansInWorktree(worktree, mainRepoFiles, vaultFiles): OrphanFile[]` — pure; given a worktree's in-scope files and the set of files known on the canonical surfaces, returns those present only in the worktree.
- `classifyOrphans(orphans: OrphanFile[]): { perWorktree: Map<string, OrphanFile[]> }` — groups for the aggregation rule.
- `main()` — orchestration: enumerate → scan → file Linear issues → print summary.

**Algorithm (`main`):**
1. `enumerateWorktrees(REPO_ROOT)`.
2. For each worktree: skip the main worktree; **skip if its last commit is younger than `ORPHAN_STALENESS_DAYS`** (active work, not an orphan).
3. Enumerate in-scope files in the worktree (see `ORPHAN_SCAN_GLOBS` in §6).
4. For each file, check whether the same repo-relative path exists in **(a)** the main repo working tree OR **(b)** the canonical Obsidian vault (`OBSIDIAN_VAULT_PATH`, for `TheFantasyWorldSimulator/*` paths only). Present on neither → orphan.
5. Group orphans per worktree. If a worktree has `> ORPHAN_AGGREGATE_THRESHOLD` orphans, file **one summary issue** for that worktree instead of one-per-file. Otherwise file one issue per orphan.
6. Print a console summary (`N worktrees scanned, M orphans, K issues filed/skipped`).

**Why "exists on a canonical surface" and not "is committed on a branch":** an orphan is defined by *invisibility to canonical tooling*, exactly as THR-406 played out — the file may well be committed inside the worktree's branch; what makes it an orphan is that nothing Cowork or the vault indexes can see it. Path-existence check on main + vault is the precise test.

### 3.2 Linear filing — shared helper extraction

`scripts/drift-scan/index.ts` already contains battle-tested Linear helpers (`linearGql`, `ensureDriftScanLabelId`, `resolveBacklogStateId`, `findIssueByExactTitle`, `createDriftIssue`) but they are module-private. To avoid re-implementing them:

- **Extract them verbatim** into a new shared module `scripts/drift-scan/linear.ts` (move, not rewrite — pure cut-and-paste plus `export`).
- `scripts/drift-scan/index.ts` imports them back from `./linear` — its behaviour is unchanged.
- `scripts/lint-worktree-orphan.ts` imports the same helpers.

This is the only edit to `index.ts` and it is a behaviour-preserving move-refactor. Constants `LINEAR_API_URL`, `LINEAR_PROJECT_ID`, `LINEAR_TEAM_ID`, `DRIFT_SCAN_LABEL_NAME` move with them. **CC must run the drift-scan smoke after the extraction** (see §8) to prove `index.ts` still works.

### 3.3 Idempotency — date-less stable titles (the design gap the issue did not address)

The existing drift-scan dedup (`findIssueByExactTitle`) only protects against **same-day re-runs**, because S1–S10 titles embed the run date (`Drift scan [2026-05-14]: …`). That is fine for S1–S10 because they are *delta* signals — they only fire `red` when a threshold is freshly crossed. **A worktree orphan is a *standing* condition**: the same orphan file persists for weeks. A date-stamped title would file a fresh issue every Friday → spam.

**Resolution:** the worktree-orphan scan uses **date-less, content-stable issue titles** and calls `findIssueByExactTitle` before every create:
- Per-file: `worktree-orphan: <repoRelativePath> in <worktreeBranchOrName>`
- Per-worktree summary: `worktree-orphan summary: <worktreeBranchOrName>`

Because the title is date-less and keyed on `(path, worktree)`, `findIssueByExactTitle` finds the still-open issue from a prior week and **skips the duplicate**. If the orphan is later resolved (merged/deleted) the issue is closed by a human; if a *new* orphan with the same path appears in a *different* worktree, the worktree component of the title makes it a distinct issue — correct. No baseline state file is needed; correctness comes from the title scheme + Linear as the source of truth.

(The issue body already proposed a date-less title — `worktree-orphan: <file path> in <worktree>` — so this is a confirmation of that instinct plus the explicit reasoning for *why* it must be date-less.)

### 3.4 Constants table — see §6.

### 3.5 Tracing / observability

No game traces (no tick loop). The observability surface is:
- **Console output** — per-worktree scan line, per-orphan decision, final `scanned/orphans/filed/skipped` summary. Mirrors `printSignalOutcome` style in `index.ts`.
- **Linear issue body** — each filed issue records: worktree path, branch, last-commit date, orphan file path(s), suggested promotion target (vault for `Brainstorms/`+`Vision/`, repo for `Docs/*`), and a `Generated by scripts/lint-worktree-orphan.ts on <date>` footer (matching the drift-scan footer convention).

### 3.6 Fail-soft table

| Failure case | Behaviour |
|---|---|
| `git worktree list` exits non-zero / git absent | Log error, exit 0 without filing issues (a broken scan must not block the scheduled task chain). Print `worktree enumeration failed — skipping`. |
| `OBSIDIAN_VAULT_PATH` unset or path missing | Vault-side existence check is skipped; main-repo check still runs. Log a one-line warning. Matches `index.ts`'s existing tolerance of an unset vault path. |
| A worktree directory is unreadable / permission-denied | Skip that worktree, log it, continue with the rest. One bad worktree never aborts the scan. |
| `LINEAR_API_KEY` unset | Run the scan, print the orphan report to console, **skip filing**, exit 0. Local diagnostics still work without credentials. |
| Linear API error / rate-limit (429) on one create | Catch per-issue; log the failed title; continue with remaining orphans. Partial filing beats zero filing. |
| Worktree last-commit date unparseable | Treat as *not stale* (conservative — do not flag a worktree whose age you cannot confirm). Log it. |
| Zero worktrees / all younger than threshold | Print `no stale worktrees — nothing to scan`, exit 0. Normal, not an error. |

### 3.7 NFP audit (the 7 priorities)

1. **Tunability** — all thresholds/scopes are named constants in a dedicated block (§6). ✅
2. **Inspectability** — console trace per worktree + per orphan; Linear issue body records the full causal detail (which worktree, which file, last commit, why). ✅
3. **Determinism** — pure file-set diffing; output depends only on filesystem + vault state at scan time. No PRNG. Ordering is sorted (worktrees by path, orphans by path) for stable output. ✅
4. **Fail-soft** — §3.6 table; the scan never throws out of `main`, never blocks the scheduled-task chain. ✅
5. **Narrative over mechanical** — N/A (tooling, no narrative surface).
6. **Additive over destructive** — new module + new scheduled task are purely additive. The one edit to existing code (`index.ts` Linear-helper extraction) is a behaviour-preserving move-refactor, verified by the drift-scan smoke. ✅
7. **Performance budget** — runs weekly, off the hot path; ~61 worktrees × a few hundred in-scope files is trivial I/O. No optimisation needed. ✅

---

## 4. Content pillar — N/A

This signal produces **no game content** — no encounters, prose tables, attachments, or data tables. Its *targets* are content files (`Brainstorms/`, `Vision/`, `Docs/plans/`, `Docs/canon/`, `Docs/audits/`), but it only *reports on their location*, never authors or mutates them. Explicitly N/A per the three-pillar rule.

---

## 5. UI pillar — N/A for game UI; output surface is Linear

No HexMapV2 signifier, no React component, no modal, no player-facing surface. This never renders in the 1920×1080 viewport.

The signal's "interface" is **Linear issues in the Continuous Improvement project**, labeled `drift-scan`, consumed by the **weekly retrospective** skill — which already ingests `drift-scan`-labeled issues as its Step 0 input (see CLAUDE.md § Weekly continuous-improvement cycle). **No retro-side change is required** — the retro reads by label, and these issues carry the label.

Console output is the developer-facing surface for ad-hoc local runs.

Explicitly N/A for the game-UI pillar; the cross-system wiring (scan → Linear → retro) is specified in §6.2.

---

## 6. Constants & wiring

### 6.1 Constants table (NFP #1)

All live in a named block at the top of `scripts/lint-worktree-orphan.ts` (this script is Node-only — it does **not** belong in `scripts/drift-scan/constants.ts`, which must stay browser-bundle-safe per that file's own header).

| Constant | Default | Purpose |
|---|---|---|
| `ORPHAN_STALENESS_DAYS` | `7` | A worktree whose last commit is younger than this is active work, not an orphan source — skipped. |
| `ORPHAN_AGGREGATE_THRESHOLD` | `3` | More than this many orphans in one worktree → one summary issue instead of one-per-file (anti-spam). |
| `ORPHAN_SCAN_GLOBS` | `TheFantasyWorldSimulator/Brainstorms/*.md`, `TheFantasyWorldSimulator/Vision/*.md`, `Docs/plans/*.md`, `Docs/canon/*.md`, `Docs/audits/*.md` | In-scope file patterns. Start narrow; widen as new drift patterns are learned. |
| `ORPHAN_EXCLUDE_DIRS` | `.git/`, `node_modules/`, `dist/`, `preview-build/`, `tmp/`, `.cache/` | Never descend into these. |
| `VAULT_RESOLVABLE_PREFIX` | `TheFantasyWorldSimulator/` | Only paths under this prefix are checked against the Obsidian vault; `Docs/*` paths are checked against the main repo only. |

### 6.2 Cross-system wiring

| Edge | Detail |
|---|---|
| Trigger | New local scheduled task `weekly-worktree-orphan-scan`, `cronExpression: "0 13 * * 5"` (Fridays 13:00 local — ~1h before the existing CI drift scan, ~2h before the retro). Created **once from a non-scheduled CC session** via `mcp__scheduled-tasks__create_scheduled_task` — see §6.3. |
| Invocation | Task prompt runs `node --experimental-strip-types scripts/lint-worktree-orphan.ts` and reports the console summary. |
| Output | `drift-scan`-labeled Linear issues in Continuous Improvement (`projectId 42ac1815-…`), via the extracted `scripts/drift-scan/linear.ts` helpers. |
| Consumer | `weekly-retro` scheduled task / `retrospective` skill — already reads `drift-scan`-labeled issues as Step 0. **No change required.** |
| Docs | New short section in this plan doc's sibling location is unnecessary; instead add a one-row entry to the **Scheduled Tasks** table in `CLAUDE.md` (`weekly-worktree-orphan-scan` | Friday 13:00 local | …) and a one-liner in `Docs/changelog.md`. The `wiring-checklist.md` is **not** touched — it governs orchestrator phases / modals / GameState, none of which this issue has. |

### 6.3 Scheduled-task creation (deferred sub-step, not blocking the code)

The scheduled task must be created from a **non-scheduled** CC session (same constraint as `weekly-retro` and `monthly-rulebook-review` per CLAUDE.md). CC should:
1. Land the script + extraction + docs in the merge commit (`Fixes THR-410`).
2. In the same session **if interactive**, or via a follow-up note **if running under automation**, create the task:
   ```
   create_scheduled_task(
     taskId: "weekly-worktree-orphan-scan",
     description: "Weekly scan for design/content files stranded in stale git worktrees; files drift-scan-labeled Linear issues",
     cronExpression: "0 13 * * 5",
     prompt: "Run: node --experimental-strip-types scripts/lint-worktree-orphan.ts — then report the console summary. The script files its own drift-scan-labeled Linear issues; do not file them manually."
   )
   ```
3. If CC is under automation and cannot create the task, it must **log a `Deferral`-labeled Linear issue** ("Create weekly-worktree-orphan-scan scheduled task", project Content Architecture) so the task creation is not lost — exactly the THR-417 precedent.

---

## 7. Three-pillar check

| Pillar | Status |
|---|---|
| Engine | ✅ §3 — script architecture, logic, helper extraction, idempotency, fail-soft, NFP audit. |
| Content | ⬜ N/A — §4. Produces no game content. |
| UI | ⬜ N/A — §5. No game-UI surface; output is Linear issues consumed by the retro. |
| Wiring | ✅ §6.2 — scan → Linear → retro, scheduled-task trigger, docs touch-points. |

Single-pillar Infrastructure issue with Content/UI explicitly N/A and rationale given — compliant with the three-pillar rule, consistent with sibling Infrastructure issues (THR-404, THR-425, THR-434).

---

## 8. Done when (CC closeout checklist)

- [ ] `scripts/lint-worktree-orphan.ts` exists: exports the pure functions in §3.1, has a `main()` + shebang, all §6.1 constants named in a top block.
- [ ] `scripts/drift-scan/linear.ts` created by move-refactor; `scripts/drift-scan/index.ts` imports the helpers from it; **`index.ts` behaviour unchanged.**
- [ ] Unit tests: `scripts/__tests__/lint-worktree-orphan.test.ts` covers `findOrphansInWorktree` (present-on-main, present-in-vault, present-on-neither), `classifyOrphans` aggregation at the threshold boundary, and the staleness skip.
- [ ] **End-to-end dry run** against the current local worktree state (the sandbox checkout has ~61 worktrees — it *can* run this) produces sensible output. Validate against the THR-406 historical evidence: the 5 Vision/ files + `Brainstorms/2026-04-20-vision-layer.md` + `Brainstorms/2026-04-23-event-phased-activation.md` orphans — the scan **should** surface them (or their current equivalents). Paste the console summary into the closing comment. *(If `LINEAR_API_KEY` is absent in the sandbox, run with filing disabled and paste the would-file report.)*
- [ ] `npm test` green; `npx tsc --noEmit` clean; `npx vite build` succeeds.
- [ ] **Drift-scan smoke after the helper extraction:** `node --experimental-strip-types scripts/drift-scan/index.ts` still loads and runs S1–S10 without a module-resolution error (it may legitimately `red`/`skip` signals — what matters is no crash from the import refactor). Paste the run header + signal lines.
- [ ] `CLAUDE.md` Scheduled Tasks table gets the `weekly-worktree-orphan-scan` row; `Docs/changelog.md` appended.
- [ ] Scheduled task created, OR a `Deferral` Linear issue logged for its creation (§6.3).
- [ ] Commit body includes `Fixes THR-410` + verification evidence (raw `npm test` / `tsc` / `vite build` output).
- [ ] Completion comment on THR-410.

**Browser-verify exempt:** no UI pillar — pure CI/process tooling, no file under `src/components/`, `src/views/`, styles, or HexMapV2. Verified by unit tests + dry run + drift-scan smoke.

---

## 9. Rejected approaches

- **❌ Wire it as drift-scan signal S11 inside `index.ts`** — the CI runner has no worktrees (§2b); S11 would always `skip`. Dead signal.
- **❌ Extend `.github/workflows/drift-scan.yml`** — same reason; the workflow runs on a hosted runner with a single-branch checkout.
- **❌ A baseline state file (`.cache/worktree-orphan-state.json`) for week-over-week dedup** — unnecessary once titles are date-less and content-stable (§3.3); Linear itself is the dedup source of truth. Fewer moving parts.
- **❌ Fold the scan into the existing `weekly-retro` scheduled task** — couples a diagnostic producer to its consumer; a slow/failed scan would delay the retro. A dedicated task at 13:00 keeps producer and consumer independent.
- **❌ Re-implement Linear GQL calls in the new script** — duplication of five non-trivial helpers; the move-refactor into `scripts/drift-scan/linear.ts` is low-risk and pays for itself the moment a third caller appears.

---

## 10. Coordination block

- **Suggested model:** `model:sonnet` — well-specified scope, an established sibling pattern (`scripts/lint-rulebook.ts`), and a behaviour-preserving refactor. The judgment surface (the §2 corrections, the §3.3 idempotency design) is captured in this doc; implementation from here is mechanical-leaning but carries a refactor that needs the drift-scan smoke, so it sits in CC's lane rather than Codex's.
- **Parallel-safe with:** all current Ready-for-Dev / In-Dev work (THR-415, THR-425, THR-433). Touches only `scripts/lint-worktree-orphan.ts` (new), `scripts/drift-scan/linear.ts` (new), `scripts/drift-scan/index.ts` (import-only edit), test files, `CLAUDE.md`, `Docs/changelog.md`.
- **Mutex with:** none. (The issue's original "Mutex with THR-404" is **resolved** — THR-404's S6–S10 already shipped; this plan does not touch the `steps` array.) Soft caution: any *other* in-flight work mid-refactoring `scripts/drift-scan/index.ts` should land first — none is currently queued.
- **Codex review:** yes — recommended. The `scripts/drift-scan/linear.ts` move-refactor touches a high-traffic infra file; a read-only review pass is cheap insurance that the extraction is behaviour-preserving.
- **Files to touch:** `scripts/lint-worktree-orphan.ts` (new), `scripts/drift-scan/linear.ts` (new), `scripts/drift-scan/index.ts` (extract-and-import), `scripts/__tests__/lint-worktree-orphan.test.ts` (new), `CLAUDE.md` (Scheduled Tasks table row), `Docs/changelog.md` (append).
