# Worktree-isolated pickup when `main` is dirty

**Issue:** [THR-277](https://linear.app/threadbare/issue/THR-277) — Codex pickup runs in a fresh `git worktree` when main worktree is dirty
**Project:** Continuous Improvement
**Authored:** 2026-04-27 (Cowork)
**Status:** Plan complete; handoff to executor
**Source:** Retro 2026-04-27 Experiment #3 (`Design/retros/retro-2026-04-27.md` line 105). Impediments #87, #88, #89, #81.

---

## 1. Problem statement

Between 2026-04-25 and 2026-04-27, Codex's hourly automation lost four cycles bouncing on the same dirty `main` worktree. Each cycle followed the same loop:

1. Hourly trigger fires.
2. Pickup skill claims the top Ready-for-Codex issue.
3. `git status --porcelain` returns non-empty (orphan tracked + untracked changes from impediment #59).
4. Pickup releases the claim and exits to avoid committing through unrelated state.
5. Worktree stays dirty. Next hour: same loop.

THR-256 was the visible victim. Roughly 50 % of automation slots were wasted. The release-and-bounce pattern is correct in isolation — an executor must not commit through state it didn't author — but it produces a doom loop because the executor cannot itself clean the main worktree, and the orphan changes (impediment #59 / `Design/user-actions.md` item #8) are pending Christian's triage with no ETA.

**The fix is to isolate pickup from `main`'s dirty state**, not to wait for `main` to be clean. Dirty worktree is a fact of multi-agent life; build resilience instead of fighting it.

## 2. Goal

Update the shared `pull-work` skill so that, after a verified claim, the executor performs all subsequent work inside a fresh `git worktree` rooted at `origin/main` whenever the home worktree is dirty. Net effect: pickup completes regardless of orphan state in the home worktree, and the orphan triage (item #8) becomes a non-blocker for automation throughput.

## 3. Scope decision — shared skill, not Codex-only

The original issue framing was "update the **Codex** pickup skill." I'm widening it to **both executors**, for these reasons:

- **There is no separate Codex pickup skill in the repo today.** `.codex/` does not exist; `.agents/skills/pull-work/` does not exist. Codex's hourly automation invokes `.claude/skills/pull-work/SKILL.md` (the same skill CC uses) wrapped by an external runner.
- **CC also benefits from worktree isolation.** A CC session that finds `main` dirty currently has no codified guidance — the agent has to re-derive it. Adding the same Step 8 to pull-work covers both executors with one edit and avoids drift between CC and Codex doctrine.
- **The pull-work canonical entrypoint is the right insertion point.** Per the coordination protocol (`Docs/plans/2026-04-13-linear-coordination-protocol.md` § Codex Pickup Protocol line 429), Codex follows the same `claim → verify → read → decide` order as CC. Putting the worktree branch *after* the claim and *before* the plan-doc read keeps the rule "claim before any side effect on the world" intact while moving every subsequent action onto safe ground.

The actual `git worktree add` is gated on `git status --porcelain` returning non-empty. If the home worktree is clean, behavior is unchanged.

## 4. Pillar coverage

This is developer-tooling / agent-protocol scope, not a player-facing feature. Per the three-pillar rule in CLAUDE.md, pillars that aren't applicable must be marked N/A with rationale.

| Pillar | Applies? | Rationale |
|---|---|---|
| **Engine** | N/A | Not a tick-loop, simulation, or graph change. The "engine" affected here is the agent-pickup pipeline. Treated below as "Pickup Engine" for completeness. |
| **Content** | N/A | No prose, encounters, attachments, templates, or world data touched. |
| **UI** | N/A | No player-facing UI, HexMap signifier, modal, alert, toast, chronicle entry, or DebugPanel surface. The audience is the executor agent, and the surface is its skill doc. |

## 5. Pickup-engine design (the actual change)

### 5.1 Step ordering inside `pull-work`

The skill currently runs Steps 0–7. The new step inserts **after Step 4 (claim verified)** and **before Step 5 (Reopened safety check)**, so the worktree exists before any plan-doc read or implementation begins.

```
Step 0 — Rate-limit guard
Step 1 — Single board scan
Step 2 — Cross-executor parallel check
Step 3 — Validate coordination block on latest comment
Step 4 — Claim before deep read, then verify       ← unchanged
Step 4.5 — Worktree isolation (NEW)                 ← inserted here
Step 5 — Reopened safety check
Step 6 — Load plan doc
Step 7 — Surface model suggestion
```

Naming: number it `4.5` rather than renumbering 5–7 to avoid breaking inbound references. (Several `Docs/plans/*.md` files reference `pull-work` Step 5/6/7 by number; a renumber would create churn far beyond the value.)

### 5.2 Step 4.5 — Worktree isolation (canonical commands)

```bash
# Run from the home worktree ($REPO_ROOT)
cd "$REPO_ROOT"
if [ -n "$(git status --porcelain)" ]; then
  ISSUE_ID_LC=$(echo "$ISSUE_ID" | tr '[:upper:]' '[:lower:]')
  WORKTREE_DIR="../tfws-pickup-${ISSUE_ID_LC}"
  WORKTREE_BRANCH="pickup/${ISSUE_ID_LC}"

  git fetch origin main

  # Retry once with -<n> suffix on collision (prior aborted run left a worktree behind)
  if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" origin/main 2>/dev/null; then
    WORKTREE_DIR="${WORKTREE_DIR}-2"
    WORKTREE_BRANCH="${WORKTREE_BRANCH}-2"
    if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" origin/main; then
      # Failure-recovery branch: release the claim, bounce cleanly
      # (same behavior as today's dirty-state release — but logged as a worktree-creation
      # failure rather than a dirty-state failure for trace clarity)
      echo "[pull-work] Step 4.5: worktree add failed twice. Releasing claim."
      # The executor releases the claim and exits — Linear MCP call lives in the skill
      exit 1
    fi
  fi

  cd "$WORKTREE_DIR"
  npm install   # impediment #81 — fresh worktree has no node_modules

  # Trace line for inspectability (NFP #2)
  echo "[pull-work] Step 4.5: home dirty. Isolated to $WORKTREE_DIR on origin/main."
else
  # Home is clean — no worktree needed
  echo "[pull-work] Step 4.5: home clean. Continuing in-place."
fi
```

The directory naming (`../tfws-pickup-<lowercase-issue-id>`) is deliberately distinct from any naming Codex's external runner already uses for its own staging dirs, so the two don't collide. Lowercase keeps it consistent with `gitBranchName` Linear emits (`christianspliid/thr-277-...`).

### 5.3 Where the rest of the session runs

Once Step 4.5 has placed the executor inside `$WORKTREE_DIR`, every subsequent step (Step 5 reopened-check, Step 6 plan-doc read, all of implementation, the verification trio of `npm test` / `npx tsc --noEmit` / `npx vite build`, the closing commit, and `git push`) runs there. The home worktree is untouched.

The closing PR's base is `origin/main` regardless of whether isolation engaged — the merge-to-main keyword path (`Fixes THR-XX`) and the auto-close still apply.

### 5.4 Closeout: removing the worktree

After the merge-to-main auto-close fires (or after a clean push if auto-close is unavailable, see THR-276), the worktree is removed from the home worktree:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR"
# If the worktree wasn't fully clean (rare), force:
# git worktree remove --force "$WORKTREE_DIR"
git branch -D "$WORKTREE_BRANCH"  # local-only; PR was already merged
```

This block belongs in the skill's "Output Contract" / closeout note, not in Step 4.5.

## 6. Constants table (NFP #1)

Every magic number named, defaulted, and rationaled.

| Constant | Default | Purpose |
|---|---|---|
| `WORKTREE_DIR_PREFIX` | `../tfws-pickup-` | Sibling-of-repo path stem. Sibling rather than nested keeps `git status` from the home worktree quiet. |
| `WORKTREE_BRANCH_PREFIX` | `pickup/` | Local branch namespace for the temporary worktree. Distinct from `christianspliid/thr-XX-…` branches the gitBranchName field suggests. |
| `WORKTREE_BASE` | `origin/main` | Always start fresh from server-canonical main, never from local main (which may itself be ahead/behind). |
| `WORKTREE_RETRY_SUFFIX` | `-2` | Single-attempt collision suffix. No further retries — third collision indicates something the agent should not silently work around. |
| `MAX_WORKTREE_RETRIES` | `1` | Total retry budget on `git worktree add` failure. After this, release the claim and bounce. |
| `WORKTREE_NPM_INSTALL` | `true` | Run `npm install` in the fresh worktree (impediment #81). Set to `false` only if a future caching layer makes it redundant. |

## 7. Tracing (NFP #2)

The skill must emit one of three trace lines so the worktree decision is inspectable in any session log.

```
[pull-work] Step 4.5: home clean. Continuing in-place.
[pull-work] Step 4.5: home dirty. Isolated to ../tfws-pickup-thr-277 on origin/main.
[pull-work] Step 4.5: worktree add failed twice. Releasing claim.
```

These are plain shell `echo` lines — no new TypeScript trace types are introduced because the skill is a markdown checklist invoked by the agent runtime, not by the simulation engine. (No `Trace` interface change in `src/types/`.)

## 8. Fail-soft table (NFP #4)

Every realistic failure case has a defined fallback that does not crash pickup.

| Failure | Behavior |
|---|---|
| `git fetch origin main` fails (offline, auth) | Treat as worktree-add failure → release claim, log, bounce. The home worktree wouldn't have been able to push anyway. |
| `git worktree add` fails with "already checked out" | Retry once with `-2` suffix (Section 5.2). |
| Second `git worktree add` also fails | Release claim, log "worktree add failed twice", bounce. Surfaces to the next hour's run with the prior worktree still on disk — Christian or a cleanup pass removes it manually. (Could be auto-pruned by a future hygiene step; not in scope here.) |
| `npm install` fails inside the fresh worktree | Same as today's `npm install` failure path — release claim, log impediment, bounce. The retry comes next cycle. |
| `git worktree remove` at closeout fails | Log a warning, leave the worktree on disk. Does not break anything (the merge already happened). The orphan worktree gets cleaned by the next hygiene pass; eventually a `git worktree prune` covers it. |
| Home worktree turns clean between `git status` and `git worktree add` | Harmless — the isolation still happens. Wasted effort once, no correctness impact. |

## 9. Determinism (NFP #3)

No PRNG, no random branch suffixes. Worktree path is a pure function of `ISSUE_ID`. Re-running the skill on the same issue produces the same worktree (or hits the deterministic `-2` suffix on collision).

## 10. Inspectability (NFP #2 deepen)

A reader of the session log can answer:
- Did Step 4.5 isolate? (Yes / no — one of three echo lines.)
- What worktree path was used? (Echoed.)
- Why did pickup bounce? (If "worktree add failed twice", the cause is unambiguous and distinct from the older "main worktree dirty" message.)

## 11. Files to touch

| File | Change |
|---|---|
| `.claude/skills/pull-work/SKILL.md` | Insert Step 4.5 between current Steps 4 and 5. Add a "Closeout: removing the worktree" subsection at the end. Add the three echo lines to the existing trace-format note. Update `pullNextReadyForDev` summary at the top to mention "after verified claim, runs Step 4.5 worktree-isolation if home is dirty." |
| `.agents/skills/pull-work/SKILL.md` | Currently does not exist. **Decision:** do not create it as part of this issue — the THR-192 sync hook only enforces parity for skill names present in *both* trees. Cowork has no current need for a Cowork-side `pull-work` (Cowork doesn't pull executor work). Codex reads the `.claude/` copy via its external runner. If Codex's runner ever needs an audience-split, that's a separate decision tracked on its own issue. |
| `Docs/plans/2026-04-13-linear-coordination-protocol.md` | One-paragraph addition under § Codex Pickup Protocol cross-referencing Step 4.5 in pull-work; no behavior moved from the protocol into the skill. |
| `Docs/changelog.md` | One row: skill-doc change, link to this plan. |
| `Design/user-actions.md` item #8 | One-line "Mitigated by THR-277" annotation under the existing "What breaks if not done" so the linkage is visible from the user-actions board. |

No `.codex/` config edit because no `.codex/` exists in-repo. Codex's external runner already invokes `.claude/skills/pull-work/SKILL.md` directly; the new Step 4.5 is picked up automatically the next hourly cycle after the merge.

## 12. Drafted SKILL.md content

The exact text the executor should drop into `.claude/skills/pull-work/SKILL.md` between current Step 4 and Step 5:

````markdown
### Step 4.5 — Worktree isolation when home is dirty

After the claim is verified (Step 4) and before any plan-doc read or implementation, gate
on `git status --porcelain` of the home worktree. If non-empty, isolate the rest of the
session in a fresh worktree rooted at `origin/main`. If empty, continue in place.

**Constants:** `WORKTREE_DIR_PREFIX="../tfws-pickup-"`, `WORKTREE_BRANCH_PREFIX="pickup/"`,
`WORKTREE_BASE="origin/main"`, `MAX_WORKTREE_RETRIES=1`.

```bash
cd "$REPO_ROOT"
if [ -n "$(git status --porcelain)" ]; then
  ISSUE_ID_LC=$(echo "$ISSUE_ID" | tr '[:upper:]' '[:lower:]')
  WORKTREE_DIR="${WORKTREE_DIR_PREFIX}${ISSUE_ID_LC}"
  WORKTREE_BRANCH="${WORKTREE_BRANCH_PREFIX}${ISSUE_ID_LC}"
  git fetch origin main
  if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" "$WORKTREE_BASE" 2>/dev/null; then
    WORKTREE_DIR="${WORKTREE_DIR}-2"
    WORKTREE_BRANCH="${WORKTREE_BRANCH}-2"
    if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" "$WORKTREE_BASE"; then
      echo "[pull-work] Step 4.5: worktree add failed twice. Releasing claim."
      # release claim via Linear MCP (save_issue id assignee:null) and exit
      exit 1
    fi
  fi
  cd "$WORKTREE_DIR"
  npm install
  echo "[pull-work] Step 4.5: home dirty. Isolated to $WORKTREE_DIR on origin/main."
else
  echo "[pull-work] Step 4.5: home clean. Continuing in-place."
fi
```

All subsequent steps run from `$WORKTREE_DIR` if isolation engaged, else from
`$REPO_ROOT`. The closing commit, push, and merge-keyword auto-close all happen
in the same location.

**Trace lines** (one of three appears per session, NFP #2):

```
[pull-work] Step 4.5: home clean. Continuing in-place.
[pull-work] Step 4.5: home dirty. Isolated to ../tfws-pickup-thr-XXX on origin/main.
[pull-work] Step 4.5: worktree add failed twice. Releasing claim.
```

**Failure recovery.** On `git worktree add` failure, retry once with a `-2` suffix on
both the path and branch name (handles a stale worktree from a prior aborted run).
On second failure, release the claim with `save_issue(id, assignee:null)` and exit
cleanly. Surfaced as a worktree-creation failure rather than a dirty-state failure.
````

And the closeout addition (append to the existing **Output Contract** section, or a new **Closeout** section if the doc already separates them):

````markdown
### Closeout — remove the temporary worktree

After the merge-to-main auto-close fires (or after a clean push if auto-close is
unavailable per THR-276), remove the worktree from the home worktree:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR"
git branch -D "$WORKTREE_BRANCH"
```

If `git worktree remove` fails (worktree not fully clean), use `--force`. Failure
to remove is non-fatal — the merge has already landed and a future
`git worktree prune` will collect the orphan.
````

## 13. NFP audit summary

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All paths and limits are named constants (Section 6). |
| 2. Inspectability | PASS | Three explicit trace lines per session, distinct from older dirty-state message. |
| 3. Determinism | PASS | Worktree path is a pure function of `ISSUE_ID`. No PRNG. |
| 4. Fail-soft | PASS | Every failure mode bounces cleanly; no exception propagates to the runner (Section 8). |
| 5. Narrative-over-mechanical | N/A | Developer tooling; no narrative surface. |
| 6. Additive over destructive | PASS | New Step 4.5 inserted; existing steps unmodified. Old behavior (release-and-bounce on dirty) preserved as the failure-recovery branch. |
| 7. Performance budget | PASS | One extra `git status --porcelain` per pickup when home is clean (sub-millisecond). When dirty, one `git fetch` + one `npm install` — same cost a fresh executor would pay anyway. |

## 14. Done when (acceptance checklist)

- [ ] `.claude/skills/pull-work/SKILL.md` contains the Step 4.5 block from Section 12.
- [ ] `.claude/skills/pull-work/SKILL.md` contains the closeout block (worktree remove) from Section 12.
- [ ] `pullNextReadyForDev` summary at the top of the skill mentions Step 4.5 in one line.
- [ ] `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Codex Pickup Protocol cross-references Step 4.5 (one paragraph).
- [ ] Skill-sync pre-commit hook (THR-192) passes — i.e., `.agents/skills/pull-work/` either still does not exist (preferred for this issue) or, if it does, mirrors `.claude/`.
- [ ] One dry run from a deliberately dirty home worktree shows the three expected echo lines and successful `cd` into the fresh worktree before any plan-doc read.
- [ ] `Design/user-actions.md` item #8 has a "Mitigated by THR-277" annotation.
- [ ] `Docs/changelog.md` row added.
- [ ] Verification trio captured in the closing commit body or completion comment (`npm test`, `npx tsc --noEmit`, `npx vite build`).
- [ ] Impediments #87, #88, #89 marked Resolved in the next dashboard regen.

## 15. Open questions / grey zones for the executor

- **Should `pullNextReadyForDev` (the atomic wrapper) include Step 4.5 inside its bundle, or remain Linear-only?** The wrapper is currently described as bundling Steps 1–4. Adding 4.5 changes the contract from "atomic claim" to "atomic claim + worktree." The simpler path is to leave the wrapper as-is and have the agent call Step 4.5 separately after the wrapper returns. Recommend option B (keep wrapper Linear-scoped) unless the executor sees a clear reason to expand it.
- **Is there value in cleaning up an orphan worktree at the *start* of pickup if a prior aborted run left one on disk?** The Section 5.2 retry handles same-issue collisions, but a cross-issue stale worktree is unhandled. Defer to a separate hygiene pass; do not in-scope it here.

## 16. Source

- Retro 2026-04-27 § Design-council pass, Experiment #3 (`Design/retros/retro-2026-04-27.md` line 105).
- Impediments #87, #88, #89 (dirty-worktree bounces); #81 (npm install in fresh worktree); #59 (orphan changes upstream cause).
- `Design/user-actions.md` item #8 (orphan triage — what this design routes around, not what it fixes).
- THR-256 (visible victim of the doom loop).
