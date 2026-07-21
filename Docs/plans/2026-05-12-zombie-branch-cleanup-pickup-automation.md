# Zombie-Branch Cleanup in Worktree Pickup Automation

**Linear issue:** THR-424
**Project:** Continuous Improvement
**Source:** Impediment #126 (2026-05-08) — `Docs/impediments.md`
**Sibling (already shipped):** THR-421 — moved the upstream-shipped check forward in `pull-work` (PR #265, merged 2026-05-12).

> Three-pillar check (process change): Engine N/A, Content N/A, UI N/A. This plan is **Wiring-only** by design — see §6.

## 1. Premise

`pull-work` Step 4.5 isolates pickups to a fresh worktree when the home repo is **dirty**, where "dirty" is defined as `git status --porcelain` returning non-empty output. That predicate sees working-tree changes (modified/untracked files) but **does not see committed-but-unmerged state**: local commits that sit on the current branch ahead of `origin/main` but never made it onto `origin/main` under their own SHA.

The most common way this happens is closeout-PR auto-close racing the local branch cleanup. The PR merges to `main` under a squash- or rebase-merge SHA that is structurally different from the local SHA that produced it; the local feature branch keeps its original commit alive, and the local-only commit becomes a "zombie" — the same content already lives on `main` under a different SHA, but the worktree's branch still claims it as work-in-progress.

Impediment #126 caught a concrete case: worktree `gallant-sanderson-b282b5` arrived at session start with three stranded closeout commits (THR-343, THR-356, THR-327). Step 4.5 fired its "home clean" path (working tree was clean) and continued in-place — and the conflict only surfaced at merge time, when the binding source files on `origin/main` had already been edited to near-identical content under different SHAs.

THR-421 closed a related but distinct gap: it ensures the **currently-claimed issue** isn't already shipped on `main` before drafting. This plan handles the orthogonal case — **prior** issues' zombie commits surviving in a reused pool worktree.

## 2. Goal

`pull-work` (and the Codex pickup protocol) must detect stranded local-only commits at session start, classify each as zombie (content already on `origin/main` under a different SHA) or real WIP (genuine uncommitted progress), and resolve the state safely:

- All zombies, no real WIP → auto-reset to `origin/main` with a one-line trace.
- Any real WIP → fail-fast with a clear diagnostic; release the Linear claim; exit without writing files.
- No stranded commits → no-op, continue.

The check runs whether the working tree is clean or dirty (it's orthogonal to Step 4.5's isolation decision), and runs **before** any plan-doc read or implementation.

## 3. Non-goals

- Detecting cross-executor collisions on the *currently-claimed* issue — that's THR-421's territory.
- Cleaning Linear state of prior issues whose zombie commits are detected (those are already Done via auto-close).
- Pruning `.claude/worktrees/` pool entries on the host side (Codex tooling, out of scope here).
- Rewriting `git status --porcelain` semantics in Step 4.5 — Step 4.5 keeps doing what it does; the new sweep is additive.

## 4. Design

### 4.1 Where it goes

A new sub-step in `.claude/skills/pull-work/SKILL.md` (and `.agents/` mirror), placed **after** Step 4.5 (Worktree isolation) and **before** Step 5 (Reopened safety check). Named **Step 4.6 — Stranded-commit zombie sweep**. The numbering accommodates the THR-421 upstream-shipped check; if THR-421 used 4.6, this becomes 4.7 — the executor implementing THR-424 picks the next available number and updates internal back-references.

The sweep runs in whichever worktree Step 4.5 left the agent in:
- If Step 4.5 isolated to a fresh `../tfws-pickup-thr-XXX` worktree → that worktree starts from `origin/main` so the sweep is trivially a no-op there. The sweep still runs (cheap), but the expected output is "no stranded commits — continuing".
- If Step 4.5 continued in-place because home was working-tree-clean → this is the case where zombies hide. The sweep does its real work here.

### 4.2 Detection algorithm (pseudocode)

```bash
# Step 4.6 — Stranded-commit zombie sweep
ZOMBIE_DETECTION_BASE="origin/main"
ZOMBIE_MAX_AGE_DAYS=14
MAX_STRANDED_COMMITS_TO_INSPECT=20
ZOMBIE_EXIT_CODE_FAIL_FAST=1

git fetch origin main --quiet || {
  echo "[pull-work] Step 4.6: git fetch failed. Skipping sweep (fail-soft)."
  # log impediment via impediment-reporter, continue
  return 0
}

STRANDED=$(git rev-list "${ZOMBIE_DETECTION_BASE}..HEAD" 2>/dev/null || true)
if [ -z "$STRANDED" ]; then
  echo "[pull-work] Step 4.6: no stranded commits — continuing."
  return 0
fi

STRANDED_COUNT=$(echo "$STRANDED" | wc -l)
if [ "$STRANDED_COUNT" -gt "$MAX_STRANDED_COMMITS_TO_INSPECT" ]; then
  echo "[pull-work] Step 4.6: $STRANDED_COUNT stranded commits exceeds cap. Fail-fast."
  release_linear_claim
  exit $ZOMBIE_EXIT_CODE_FAIL_FAST
fi

ZOMBIES=0
NON_ZOMBIES=0
ZOMBIE_SHAS=()
NON_ZOMBIE_SHAS=()

for sha in $STRANDED; do
  if is_zombie "$sha"; then
    ZOMBIES=$((ZOMBIES + 1))
    ZOMBIE_SHAS+=("$sha")
  else
    NON_ZOMBIES=$((NON_ZOMBIES + 1))
    NON_ZOMBIE_SHAS+=("$sha")
  fi
done

if [ "$NON_ZOMBIES" -gt 0 ]; then
  echo "[pull-work] Step 4.6: $ZOMBIES zombies + $NON_ZOMBIES real WIP commits."
  echo "  Real WIP SHAs: ${NON_ZOMBIE_SHAS[*]}"
  echo "  Fail-fast — releasing claim and exiting. Run 'git log origin/main..HEAD' to inspect."
  release_linear_claim
  exit $ZOMBIE_EXIT_CODE_FAIL_FAST
fi

# All stranded commits are zombies — safe to reset
echo "[pull-work] Step 4.6: all $ZOMBIES stranded commits are zombies. Resetting to origin/main."
echo "  Zombie SHAs: ${ZOMBIE_SHAS[*]}"
git reset --hard origin/main
```

`is_zombie <sha>` returns true if **either** condition holds:

**Condition A — Fixes-keyword match on main.** Extract the first `(Fixes|Closes|Resolves) THR-\d+` token from the stranded commit's subject. If present, run `git log origin/main --grep "<token>" --since="<max-age-days> days ago" --oneline | head -1`. If any match, the issue is already closed on `main` under a different SHA → zombie.

**Condition B — Content match against main tip.** For each path in `git show --name-only --format= <sha>`, compare the file's content at `<sha>` against the file's content at `origin/main`. If every changed file matches (`git diff --quiet <sha> origin/main -- <file>` returns 0), the stranded commit's payload is already on `main` → zombie.

Either condition is sufficient. Condition A is fast and handles the closeout-PR case; Condition B is the catch-all for commits without a Fixes keyword. Both must agree to "no" for the commit to be classified as real WIP.

### 4.3 Constants

| Constant | Default | Purpose |
|---|---|---|
| `ZOMBIE_DETECTION_BASE` | `origin/main` | Branch to compare stranded commits against |
| `ZOMBIE_MAX_AGE_DAYS` | 14 | Bounds the `git log --since` window for Condition A; older zombies still classify via Condition B |
| `MAX_STRANDED_COMMITS_TO_INSPECT` | 20 | Safety cap; >20 stranded commits is itself a red flag — fail-fast rather than inspect |
| `ZOMBIE_EXIT_CODE_FAIL_FAST` | 1 | Exit code when real WIP is detected; surfaces in cron logs as red |
| `ZOMBIE_EXIT_CODE_NO_OP` | 0 | Exit code when sweep no-ops or auto-resets |

### 4.4 Fail-soft table

| Failure mode | Behavior | Rationale |
|---|---|---|
| `git fetch origin main` fails (network, auth) | Skip sweep; continue with no-op log; log impediment | Cannot determine zombies without fetched main; safer to continue and let the existing post-implementation `git fetch` (THR-421 territory) catch any collisions than to refuse to claim |
| `git rev-list` returns non-zero | Skip sweep; continue | Likely a corrupt local repo state — surface but don't block pickup |
| `is_zombie` errors on a single sha | Treat that sha as non-zombie (fail safe) | Defaults to surfacing for human review |
| Sweep would reset away an uncommitted working-tree edit | Cannot happen — Step 4.5 already isolated dirty trees | Working-tree changes are Step 4.5's responsibility; Step 4.6 only touches committed history |
| Stranded count > `MAX_STRANDED_COMMITS_TO_INSPECT` | Fail-fast; release claim; exit 1 | Anything that deep is a worktree problem requiring human triage |

### 4.5 Trace lines (NFP #2)

One of the following is emitted per session:

```
[pull-work] Step 4.6: no stranded commits — continuing.
[pull-work] Step 4.6: all <N> stranded commits are zombies. Resetting to origin/main.
  Zombie SHAs: <sha1> <sha2> ...
[pull-work] Step 4.6: <Z> zombies + <W> real WIP commits.
  Real WIP SHAs: <sha1> ...
  Fail-fast — releasing claim and exiting.
[pull-work] Step 4.6: <N> stranded commits exceeds cap. Fail-fast.
[pull-work] Step 4.6: git fetch failed. Skipping sweep (fail-soft).
```

Trace lines are grep-able from cron-run logs for retro analysis.

### 4.6 Interaction with THR-421's upstream-shipped check

THR-421 introduced a check that asks "is the **currently-claimed** issue already shipped on `main`?" Run order matters:

1. Step 4.5 — Worktree isolation (Step 4.5 stays as today).
2. Step 4.6 — **New: Stranded-commit zombie sweep** (this plan).
3. Step 4.7 (or wherever THR-421 landed) — Upstream-shipped check for the current issue.

The sweep runs first because if there are real WIP commits in the worktree, the agent must exit before doing any other work (the worktree itself is corrupted from a prior cycle, and continuing risks creating yet another zombie). The upstream-shipped check then verifies the current issue isn't already shipped.

If THR-421 landed before this plan reaches main, the executor implementing THR-424 should:
- Read the actual section numbers in `pull-work/SKILL.md` at implementation time
- Place the zombie sweep immediately after Step 4.5, ahead of the upstream-shipped check
- Update internal cross-references in both directions

## 5. Codex coverage

The Codex pickup protocol lives in `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Codex Pickup Protocol. It does not have its own SKILL.md, so the equivalent guidance is added as prose:

After the Codex protocol's "Verify the claim stuck" step and before "Read the latest comment first," insert a new bullet:

> **Stranded-commit zombie sweep.** Before reading the handoff comment or plan doc, run `git fetch origin main && git rev-list origin/main..HEAD`. If non-empty, classify each commit using the heuristic in `.claude/skills/pull-work/SKILL.md` § Step 4.6 (Fixes-keyword match on `origin/main`, or full file-content match against `origin/main` tip). If all stranded commits are zombies, `git reset --hard origin/main`. If any real WIP commits remain, release the claim (`save_issue(id, assignee:null)`), surface the SHAs, and exit cleanly. Same rationale as CC: pool worktrees outlive sessions, and zombie commits from prior closeouts conflict at merge time.

This is intentionally prose rather than a separate skill — Codex executes from the coordination protocol document directly, so prose is the wiring surface for Codex.

## 6. Wiring (three-pillar check — explicit)

| Pillar | Status | Rationale |
|---|---|---|
| Engine | N/A | Process automation; no game-engine code touched. |
| Content | N/A | No encounter templates, prose, or content tables touched. |
| UI | N/A | No player-facing surfaces. Sweep output appears only in agent cron logs / Linear comments. |
| Wiring | **Required** | `.claude/skills/pull-work/SKILL.md` (Step 4.6 insert), `.agents/skills/pull-work/SKILL.md` (mirror), `Docs/plans/2026-04-13-linear-coordination-protocol.md` (Codex prose insert). |

Wiring checklist alignment (`Docs/plans/wiring-checklist.md`):
- No new orchestrator phase, modal, GameState field, trace category, or player control — no checklist update needed.
- Skill text changes are mirrored via `npm run check:skill-sync:sync`.

## 7. Files to touch

- `.claude/skills/pull-work/SKILL.md` — insert Step 4.6 (Stranded-commit zombie sweep) per §4. Update Step 4.5 closing prose to reference the new step. Bump `last_validated_against` to today's date.
- `.agents/skills/pull-work/SKILL.md` — mirror via `npm run check:skill-sync:sync`. CI enforces drift detection between the two trees (THR-192 hook).
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — insert the Codex prose paragraph in § Codex Pickup Protocol between steps 2 and 3.
- `Docs/impediments.md` — append a "Resolution" cross-reference on row #126 pointing to THR-424's closing commit.

No source-tree (`src/`) files are touched, so Codesight blast-radius is N/A.

## 8. Done when

- [ ] Step 4.6 exists in `.claude/skills/pull-work/SKILL.md` with the detection algorithm, constants table, fail-soft table, and trace lines from §4.
- [ ] `.agents/skills/pull-work/SKILL.md` mirrors the change. `npm run check:skill-sync` passes.
- [ ] Codex Pickup Protocol in `Docs/plans/2026-04-13-linear-coordination-protocol.md` includes the prose insert from §5.
- [ ] Cross-reference on `Docs/impediments.md` row #126 points to the closing commit.
- [ ] **Manual rehearsal #1 — all zombies.** In a scratch clone, create 2 stranded commits whose subjects match `Fixes` keywords already on `origin/main`. Run the Step 4.6 logic. Confirm `git reset --hard origin/main` fires and the worktree returns to clean state. Paste terminal output into the closeout commit body or Linear completion comment.
- [ ] **Manual rehearsal #2 — mixed zombies + real WIP.** In a scratch clone, create 1 zombie commit and 1 real WIP commit (a real new change). Run the Step 4.6 logic. Confirm fail-fast fires, Linear claim is released, and exit code is non-zero. Paste terminal output.
- [ ] **Manual rehearsal #3 — clean baseline.** In a fresh worktree from `origin/main`, run the Step 4.6 logic. Confirm "no stranded commits — continuing." Paste terminal output.
- [ ] Verification evidence pasted: `npm test`, `npx tsc --noEmit`, `npx vite build` (or green CI link). No browser-verify needed (no UI changes).
- [ ] `Fixes THR-424` in the closing commit body.

## 9. Risks / open considerations

- **Auto-reset destroys local-only history.** Mitigated by requiring **both** zero-real-WIP and the per-commit zombie classifier passing. If in doubt, the algorithm fail-fasts. The reset path is reachable only when every stranded commit is provably already on `main` under a different SHA — recovery is `git reflog` if a false positive ever shipped.
- **Cost of `git fetch` at every session start.** Already in the path for THR-421's check; no extra fetch cost.
- **False negatives — a real WIP commit gets misclassified as zombie.** Requires the WIP commit's payload to be byte-identical to `origin/main`'s file content at every changed path. This is the same content the zombie-detection rule targets, and a WIP commit that's already byte-identical to main is, by definition, a no-op commit — losing it via reset is harmless.
- **Pool-worktree owners outside the repo (Codex host tooling).** This plan touches only repo-resident skill text and the coordination protocol. If Codex's host-side worktree-pool manager has its own startup sequence, that's a separate (out-of-repo) follow-up — note it in the closeout comment if relevant. The repo-resident sweep still fires on Codex pickups because Codex reads the coordination protocol.

## 10. NFP compliance summary

| NFP | Status | Note |
|---|---|---|
| 1 — Tunability | PASS | All thresholds named: `ZOMBIE_DETECTION_BASE`, `ZOMBIE_MAX_AGE_DAYS`, `MAX_STRANDED_COMMITS_TO_INSPECT`, two exit codes. |
| 2 — Inspectability | PASS | Five distinct trace lines documented; one fires per session, grep-able from cron logs. |
| 3 — Determinism | PASS | Same worktree state + same `origin/main` tip → same classification. No PRNG. |
| 4 — Fail-soft | PASS | Fail-soft table in §4.4. Fetch failure → skip sweep + log impediment; never crash pickup. |
| 5 — Narrative over mechanical | N/A (process change). |
| 6 — Additive over destructive | PASS | New step inserted; Step 4.5 and downstream steps unchanged. |
| 7 — Performance budget | PASS | `git fetch` already in path; `git rev-list` + per-commit comparison is O(stranded × changed files) bounded by `MAX_STRANDED_COMMITS_TO_INSPECT = 20`. |

## 11. Related

- THR-421 (Done) — upstream-shipped check at every session start.
- THR-393 (Done) — WIP=1 gate enforcement in pull-work.
- THR-277 (Done) — Step 4.5 worktree isolation.
- Impediment #126 — the stranded-commits case study this plan resolves.
- Impediment #127 — the resume-path collision (orthogonal; covered by THR-421).
- Retro: `Design/retros/retro-2026-05-11.md`.
