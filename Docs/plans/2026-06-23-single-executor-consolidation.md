# Single-Executor Consolidation + Ways-of-Working / CI Cleanup

**Date:** 2026-06-23
**Author:** Cowork (design), at Christian's direction
**Status:** Implementation-ready. Handoff issues filed (see § Handoff issues).
**Type:** Process / docs / CI / repo-hygiene. No `src/` runtime change except the test-suite stabilization stream (filed separately). Three-pillar rule N/A (no Engine/Content/UI game feature).

---

## Decision (authority: Christian, 2026-06-23)

The three-agent model (Cowork designs; **Claude Code** + **Codex** execute from two separate Linear queues) created a coordination tax that now dominates the friction log: ~100 of the impediment entries touch coordination / handoff / Linear / Codex / worktree / merge / auto-close, the Codex executor lane has been dark **17 times** (impediment #141) while Cowork kept feeding its queue, and the repo carries **423 unmerged branches** and **293 prunable worktrees**.

Diagnosis: the friction is concentrated at the **multi-executor seam**, not the Cowork design layer. Verdict — **collapse to a single executor (Claude Code). Retire Codex entirely.** Keep Cowork as the design/PM surface. Then clean up the CI and repo debris the multi-agent fan-out accumulated.

Christian's verdicts captured this session:

1. **Done gate:** *Merge = Done.* Rip the permanently-skipping review gate; a merged PR carrying `Fixes THR-XX` goes straight to Done. (Reversible later if a real review is wanted.)
2. **Branch cleanup:** *Aggressive.* Prune stale worktrees; delete merged **and** abandoned/superseded branches with no open Linear issue. Branches stay recoverable via reflog.
3. **Red test suite:** *Separate effort, scheduled next.* Stabilize as its own Repo Health stream right after this cleanup lands — not folded into this work.

---

## Already actioned by Cowork (done before this doc)

- `keep-codex-flowing` scheduled task **disabled** (was hourly `0 * * * *`, the live Codex-feeder).
- The 4 issues stranded in the dark `Ready for Codex` queue rescued: **THR-481, THR-478, THR-476 → Ready for Dev**; **THR-414 → In Design** (it is a design-dialogue issue needing Christian, mis-filed into Codex's queue).
- `Ready for Codex` queue confirmed empty after the sweep; `In Review` confirmed empty (no stranded pile from the dead gate).

---

## Workstream 1 — Codex teardown (docs + protocol)

**Project:** Agent Coordination Protocol · **Executor:** Claude Code

Goal: every artifact should describe a **two-agent** world — Cowork (design/PM/docs) + Claude Code (single executor) — with no trace of Codex, the two-queue split, or `Ready for Codex`.

Files and the semantic changes:

- **`CLAUDE.md`** (14 Codex mentions). Remove the "If you are running in Codex" section, the "codex reviewer is read-only" disambiguation can stay (the `/codex:*` review tool is separate and may remain, but if it is unused, remove it too — see open item below). Collapse "Three agents, two executor queues" → "Two agents, one executor queue." Remove the `Ready for Codex` queue, the "Choosing the executor" routing, and all Codex pickup/closeout references. CC pulls from **Ready for Dev** only; drop the "never query Ready for Codex" guardrails (no longer meaningful). Keep the claim-before-read, verify-after-write, WIP=1, and merge-gated-Done discipline — those are executor-agnostic and still load-bearing for parallel CC sessions.
- **`Docs/plans/2026-04-13-linear-coordination-protocol.md`** (56 Codex mentions, 730 lines). Rewrite to single-executor. Remove Codex Session Start / Pickup / Closeout sections, the two-queue rationale, the cross-executor mutex/`Parallel-safe with`/`Mutex with` machinery that exists **only** to keep CC and Codex apart (intra-CC parallelism guidance stays, but simplify — a single executor with WIP=1 per session needs far less). Renumber the "Hard Rules" after deletions. Rule 10 (model-label lanes as queue filters) stays **only if** multiple CC automation lanes by model are still in use; otherwise simplify (see Workstream 4).
- **`.claude/skills/pull-work/SKILL.md`**. Remove Codex-queue branches; CC pickup = top of `Ready for Dev`, `assignee:null`. Keep the safe-claim / verify-after-write / dirty-worktree fallback.
- **Grep sweep:** `grep -rin codex CLAUDE.md Docs/ .claude/skills/` and reconcile every remaining hit (handoff templates, the scheduled-task registry table's `:30 Codex pickup` row, the "Choosing the executor" pointer, etc.). The scheduled-task table in CLAUDE.md should drop the `:30 Codex pickup` row and note the slot is free.

**Done when:** no Codex/`Ready for Codex`/two-queue references remain in CLAUDE.md, the coordination protocol, or the pull-work skill (grep-clean); the protocol reads coherently as single-executor; closing commit body `Fixes <issue>`.

**Coordination block:** Parallel-safe with Workstream 2 and 3 (disjoint files). Mutex with: none. Suggested model: opus (judgment-heavy doc rewrite / process prose).

---

## Workstream 2 — CI cleanup (merge = Done)

**Project:** Repo Health · **Executor:** Claude Code

Root causes in the current CI:

- `.github/workflows/claude-review.yml` emits `verdict=skip` **permanently** (placeholder never replaced by THR-182/183). Its `transition-to-done` job only fires on `verdict == 'pass'`, so **nothing ever auto-transitions In Review → Done** — issues that reach In Review stall there forever.
- `.github/workflows/linear-autoclose.yml` moves referenced issues to **In Review** on push to main, matching `Fixes/Closes/Resolves THR-XX` in **commit messages**. Per impediment #140, a non-squash merge commit doesn't carry the keyword from the PR/branch commit body, so auto-close silently misses.

Changes (per the *merge = Done* verdict):

1. **Repoint auto-close terminal state to Done.** In `linear-autoclose.yml`, change the transition target from `In Review` to **`Done`** (a merged PR with the keyword is, by the new definition, done). Keep the `Fixes/Closes/Resolves THR-XX` extraction.
2. **Harden keyword capture (#140).** Also scan the PR title/body, not just commit messages — on `push` to main the merge commit is available; additionally (or instead) add a `pull_request: [closed]`-triggered path that reads `pull_request.body` + `pull_request.title` for the keyword so a PR-body `Fixes THR-XX` closes even when the squash/merge commit drops it.
3. **Delete the review gate.** Remove `.github/workflows/claude-review.yml` entirely (the placeholder structural review). Fold any still-wanted Done-transition logic into `linear-autoclose.yml`. Retire/scope-down the THR-182/THR-183 review issues as "won't do — merge=Done" (mark in their Linear comments).
4. **`ci.yml`** stays as the required gate (Test · Typecheck · Build). No change except confirming branch protection still requires it. The `check:process` advisory step can stay.
5. **Update `CLAUDE.md` "Definition of Done" + "merge-gated Done" language** to reflect merge=Done (no review-gate intermediary). Coordinate this edit with Workstream 1 to avoid a collision on CLAUDE.md — sequence WS2's CLAUDE.md touch after WS1 lands, or have WS1 own all CLAUDE.md edits and WS2 own only the workflow YAMLs. **Recommended: WS1 owns every CLAUDE.md edit; WS2 touches only `.github/workflows/`.**

**Done when:** `claude-review.yml` deleted; `linear-autoclose.yml` transitions referenced issues to Done and catches PR-body keywords; a test PR with `Fixes THR-XX` in the body auto-moves the issue to Done on merge; closing commit body `Fixes <issue>`.

**Coordination block:** Parallel-safe with WS1 and WS3 (touches only `.github/workflows/` if WS1 owns CLAUDE.md). Mutex with WS1 on CLAUDE.md — resolved by giving CLAUDE.md to WS1. Suggested model: sonnet (mechanical YAML + small script).

---

## Workstream 3 — Branch & worktree amnesty (aggressive)

**Project:** Agent Coordination Protocol · **Executor:** Claude Code

Current: 423 branches unmerged to main; 294 worktrees, 293 `prunable`; `claude/*` auto-branches = 388, `codex/*` = 13, `ops|pickup|resume|temp|docs/plan-flush|housekeeping` = 63. Branches abandoned as far back as 2026-03-16.

Procedure (aggressive, per verdict — but encode the safety rails):

1. **Worktrees:** `git worktree prune -v`, then remove the `prunable` worktree directories under `.claude/worktrees/`, `_codex_worktrees/`, `tfws-pickup-*`, `tfws-resume-*`. Verify none has uncommitted work first: `git -C <wt> status --porcelain` must be empty; if not, stash/report that one and skip it.
2. **Merged branches:** delete every local + remote branch already merged to `main` (`git branch --merged main`, `git branch -r --merged origin/main`), excluding `main` itself.
3. **Abandoned/superseded unmerged branches:** delete `claude/*`, `codex/*`, `ops/*`, `pickup/*`, `resume/*`, `temp/*`, `docs/plan-flush-*`, `housekeeping/*` branches whose last commit is **> 30 days old** AND that have no open Linear issue referencing them. For `christianspliid/thr-*` branches, cross-check the THR id against Linear: if the issue is Done/Canceled/Duplicate, delete the branch; if the issue is still open, **keep** the branch.
4. **Safety:** this is recoverable via reflog for the local repo; for remote deletes, capture a `git branch -a --format='%(refname) %(objectname)'` snapshot to a file in the closing comment first, so any branch can be restored by SHA. Do **not** delete `codex/*` branches that are unmerged AND <30 days unless their THR is closed (defensive — most are old and safe).
5. **Codex worktree dirs** (`_codex_worktrees/`) can all be pruned — Codex is retired.

**Done when:** worktree count back to the active set (home + any live CC worktrees); merged + abandoned branches deleted; a restorable SHA snapshot pasted in the closing comment; closing commit body `Fixes <issue>` (this is a repo-state change, but commit any snapshot file or note).

**Coordination block:** Parallel-safe with WS1/WS2. Mutex with: any in-flight CC session (don't delete a branch another session is actively on — check `In Dev` issues in Linear first). Suggested model: sonnet (mechanical git, careful).

---

## Workstream 4 — Test-suite stabilization (SEPARATE — scheduled next)

**Project:** Repo Health · **Not handed to CC in this batch.** Filed as the next big rock per Christian's verdict.

`npm test` has been red on `main` for months (impediments #22, #30–39, recurring): `movement-content`, `revelationGate`, sublocation/reward/portrait/audio contracts, encounter-count drift, and repeated `trait.reputation.power.renown` orchestrator crashes. This is a real engineering project, not a one-cycle fix. It blocks trustworthy CI (a red baseline trains everyone to ignore the gate).

Scope to define when picked up: triage the failing suites into (a) stale assertions to update, (b) real regressions, (c) flaky/environment. Get `main` green, then keep it green (the existing Repo Health charter). Leave in **Todo** until this cleanup batch merges.

---

## User-action items (only Christian can do these)

1. **Remove / archive the `Ready for Codex` workflow state** in Linear team settings (Threadbare → workflow). The API can't delete a state; once WS1–WS3 land and the queue is confirmed empty, archive it so no agent or automation can route there again.
2. **Shut down the external Codex automation lane.** The hourly "Codex pickup" automation runs on a Codex runtime outside this machine (impediment #141 — it couldn't reach Linear anyway). Decommission it so it stops attempting pickups. Likewise review the `model:*`-lane CC automations: with a single executor and one queue, decide whether you still want separate Sonnet/Opus CC automation lanes (Rule 10) or a single CC pickup lane — tell Cowork and WS1 will simplify the protocol accordingly.
3. **Refresh the home worktree** before the next design session: `git fetch && git pull` (it was ~11 days / 38 commits stale per the 2026-06-23 retro).

---

## Handoff issues

| Issue | Project | State | Model | Plan ref |
|-------|---------|-------|-------|----------|
| WS1 — Codex teardown (docs + protocol) | Agent Coordination Protocol | Ready for Dev | opus | this doc § WS1 |
| WS2 — CI cleanup (merge = Done) | Repo Health | Ready for Dev | sonnet | this doc § WS2 |
| WS3 — Branch & worktree amnesty | Agent Coordination Protocol | Ready for Dev | sonnet | this doc § WS3 |
| WS4 — Test-suite stabilization | Repo Health | Todo (next) | — | this doc § WS4 |

Suggested landing order: WS1 + WS2 + WS3 are parallel-safe and can run together; WS4 after they merge.
