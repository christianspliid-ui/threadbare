# Investigation: why does every agent burn time on git/CI/CD staleness?

**Captured 2026-07-20 · brief + forensics committed together so the evidence outlives the session
that gathered it.** The home tree was repaired the same morning, so these artifacts are the only
surviving record of the broken state — see "The evidence is already captured" below before you
conclude the problem has gone away.

You are running an **investigation and planning** session. Do not implement fixes, do not edit
`src/`, do not repair the home tree. Your deliverable is a plan doc plus Linear issues that the
executor lane implements. (See `feedback_fable_plans_executors_implement`.)

## The complaint (user directive, Christian, 2026-07-20)

> "I can see all my agents are spending tons of time and resources on perceived issues with CI/CD.
> They always feel that we are behind or something is stale or something along those lines. But in
> reality we should be able to run this simply and commit to main every time and keep everything
> clean, as we are only running one agent at a time. This is super inefficient and for me needs to
> be investigated. In depth."

**Goal state:** every agent that develops either (a) delivers commits and PRs cleanly, or (b) in the
rare case it can't, repair is fast and mechanical.

## The evidence is already captured — the tree has since been repaired

**Do not be confused by finding the home tree clean.** It was repaired on 2026-07-20 ~10:00 after the
forensics below were captured. `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator` is now on
`main` at `8d481fbd`, 0 ahead / 0 behind, no modified tracked files. Expect it to re-break (see H2 —
the cause is unidentified and recurred three mornings running).

Your primary sources for the broken state, committed alongside this brief in
`Docs/audits/2026-07-20-git-cicd-forensics/`:

- `forensics.txt` — reflog, status, diffstats, worktree list, branch list
- `staged.patch` — the full 5,187-line staged pile
- `unstaged.patch` — the full 1,810-line unstaged pile
- `C:\Users\chris\bin\threadbare-autosync.log` — outside the repo; still live, not repaired

The tracked pile was **stashed, not discarded** — recoverable at `stash@{0}` ("home-tree-recovery
2026-07-20") in the home tree. Note there are **10 older stashes** beneath it from `claude/*`
branches going back weeks ("codesight auto-scan artifacts", "auto-gen-codesight-stash", four separate
"worktree graveyard cleanup" WIPs). That stash stack is itself evidence: this cleanup has been
performed repeatedly by different sessions, each leaving residue. Read it as a recurrence record.

## Evidence already gathered (2026-07-20 09:50, keep-work-flowing-cc run) — do not re-derive

Verified facts. Start from these; spend your budget on the *why*, not on re-confirming:

1. **The home tree was on a detached HEAD** at `013c1044`, parked there from 07-19 10:55 until the
   2026-07-20 repair. Recovery was `git stash push` → `git switch main`; it needed no `reset --hard`
   and lost nothing, which is itself a finding: **the repair is trivial once correctly diagnosed.**
   The days of escalating alarm were diagnosis cost, not repair cost.
2. **Local `main` is perfectly healthy** — `main` and `origin/main` are both at `8d481fbd`,
   **0 ahead, 0 behind.** The tree is parked *beside* main, not lagging behind it.
3. **Every hourly briefing for days has reported "N commits behind and climbing"** (58 → 64 → 69 →
   75 → 77 → 79). That number measures the *frozen detached snapshot* against a moving `origin/main`.
   It is arithmetically true and semantically misleading. Agents have been reading it as decay and
   escalating accordingly.
4. **The detach is caused by a bare `git checkout HEAD`** (no pathspec). Reflog wording
   `checkout: moving from main to HEAD` is only produced by that form.
5. **It recurs, roughly daily, mid-morning:**
   - `07-19 10:55  moving from main to HEAD`
   - `07-18 09:01  moving from claude/sad-bartik-421eef to HEAD`
   - `07-17 10:36  moving from main to HEAD`
6. **`threadbare-autosync.ps1` is NOT the cause.** Its only checkout is
   `git checkout HEAD -- .codesight` — the pathspec form does not move HEAD and writes no reflog
   entry. Script unmodified since 07-18 18:48, before the 07-19 detach.
7. **The autosync guard is working as designed, not failing.** Step 2 does
   `$branch = git rev-parse --abbrev-ref HEAD`, which returns the literal string `"HEAD"` when
   detached, so `if ($branch -ne 'main') { skip }` trips. Two sequential blockers: dirty tree
   (blocking `merge --ff-only`) until 10:55, then detachment after.
8. **Sprawl:** 27 worktrees, 42 local branches, 22 remote branches. **16 worktrees created on 07-19
   alone.** 7 worktrees stale since 07-05. Sessions create a worktree each and never clean up.
9. **84 lines** in `Docs/impediments.md` mention dirty-tree / worktree / stale / rebase / freshness
   friction — the cost is already logged, repeatedly, by many sessions independently.
10. Working tree carries **68 staged + 11 unstaged tracked edits** and **15 untracked design docs**
    that exist nowhere on `origin/main`.
11. **The 68 staged files are damage, not work.** Diffed against the detached base: **221 insertions,
    3,379 deletions.** The staged `src/engine/armyMovement.ts` *reverses* THR-614's
    `quintessence` → `cohesion` rename. This is an older snapshot staged over a newer base — the
    signature of a `git checkout <old-ref> -- <paths>`, which stages old content silently. Committing
    that pile would revert a shipped rename and delete ~3,200 lines. Discarding it is the only
    correct outcome. **Earlier briefings called these "stale echoes of shipped work" — that
    understated it; correct the record.** Finding the command that staged them is a priority: it is
    likely the same actor as the bare `checkout HEAD` in H2.

## Test this premise explicitly

Christian believes **"we are only running one agent at a time."** The WIP limit is 1 and the pickup
lane is single-executor, so that may be true *concurrently* — but 16 worktrees in one day says the
system behaves like a many-agent system in terms of artifacts left behind. Resolve this precisely:

- Is concurrency actually 1? Check the scheduled-task registry (`tb-opus-pickup` :00,
  `flush-plan-docs` :15, `keep-work-flowing-cc` :20, plus daily/weekly tasks) and whether their
  windows overlap in practice.
- If concurrency is 1, **why does a serial system need worktree isolation at all?** THR-277 added
  worktree isolation to route *around* a dirty home tree. Is that now a workaround that has become
  the disease — each run leaving another worktree and branch behind?
- Quantify: what fraction of agent wall-clock and tokens goes to git/CI/staleness handling rather
  than product work? Sample recent sessions and impediment entries for a defensible number.

## Hypotheses to test (rank by evidence, discard freely)

**H1 — The freshness signal is miscalibrated and manufactures alarm.**
`freshness=behind:N` and the briefing's behind-count measure HEAD vs `origin/main` without
distinguishing "branch is behind" from "tree is parked off-branch while the branch is current." The
CLAUDE.md session-start protocol then *mandates* agents surface it first and stop work. A misleading
metric wired to a hard stop is an expensive combination. Check `scripts/session-precheck.ts`.

**H2 — Something runs a bare `git checkout HEAD` on the home tree, roughly daily.**
Find it. Candidates worth ruling in/out: CC worktree tooling (`EnterWorktree`/`ExitWorktree`),
`pull-work`'s dirty-worktree fallback, the `.claude/` hooks, the scheduled-task wrappers, any
`git checkout "$BRANCH"` where `$BRANCH` was captured via `rev-parse --abbrev-ref` (which yields the
literal `HEAD` when already detached — a classic self-perpetuating bug). Note the 07-18 event started
from a `claude/*` branch, which points at session tooling rather than a human.

**H2b — Worktrees are net-negative at concurrency 1 and should be dropped for the executor lane.**
Christian raised this directly (2026-07-20): "we run every agent in a worktree. should we stop using
worktrees?" **Treat this as a required decision with a reasoned recommendation, not an open question.**
The prior-session view, for you to confirm or overturn:

- *For dropping them.* (a) They fight the Definition of Done: DoD mandates browser verification at
  1920×1080, but the preview infrastructure serves the **home** tree, so a worktree session verifies
  stale code unless it manually stands up its own vite (documented friction,
  `feedback_worktree_preview_server`). (b) They cause silent cross-tree contamination: a bare
  repo-root path in Edit/Write from a worktree session hits the **home** tree on a different branch
  and *succeeds with no error* (`feedback_worktree_edit_paths`) — the same shape as the mess in
  fact #11. (c) Nothing reaps them: 27 worktrees, 42 local branches, 16 created in one day.
  (d) Their stated purpose (THR-277: isolation from a dirty home tree) is circular — insurance
  against a mess the setup helps create.
- *Against dropping them.* If concurrency is not actually 1, isolation is genuinely required. **This
  is the decisive measurement** — resolve it before recommending either way. Also: without
  worktrees, a session that dies mid-work leaves the home tree dirty on a feature branch. That is
  acceptable *only if* the fast repair path (deliverable #4) exists first; sequence the tickets
  accordingly.
- *Middle option to cost out:* one persistent reusable executor worktree rather than one per session.
  Kills the sprawl but retains the bare-path footgun and the dev-server problem. Say whether it is
  worth it.

**H3 — Nothing owns cleanup.** Worktrees and branches are created per session and never reaped.
There is a `clean-stale-git.sh` + daily Windows task (see `project_git_cleanup_automation`) — is it
running? Is it working? 27 worktrees says no.

**H4 — The home tree is used as a working surface when it should be inert.**
If every agent works in a worktree, the home tree should stay pristine on `main`. It has 68 staged
edits, so something is writing to it. Find out what and why.

**H5 — Pre-commit hooks add friction that agents route around rather than fix.**
`check:skill-sync` blocks commits over gitignored scratch artifacts (a known repeat offender,
`reference_skill_sync_hook_blocks_docs_commits`). Count how often hooks block and what agents do next.

**H6 — Branch protection + PR-per-change is heavier than a single-executor system needs.**
Christian's instinct is "commit to main every time." Evaluate honestly: what does branch protection
buy with one serial executor, and what does it cost per change? Do not assume the current setup is
correct — but also do not assume it is wrong. CI is the merge gate and that has real value; give a
reasoned recommendation either way, including the option of keeping PRs but making them frictionless.

## What the deliverable must contain

1. **Root-cause narrative** — what actually happens, in causal order, distinguishing *proven* from
   *inferred*. Name the bare-`checkout HEAD` source if you find it; say "unproven" if you don't.
2. **Cost quantification** — a defensible estimate of agent time/tokens lost to this class of issue.
3. **Target-state design** — what "clean delivery every time" looks like mechanically. Cover: where
   agents work, who owns the home tree, when worktrees are created and reaped, what the freshness
   signal should measure and how it should be worded, and what the fast repair path is.
4. **A fast, mechanical repair path** — one documented command sequence for the rare broken case,
   with the "is anything at risk?" check built in (`rev-list --count origin/main..HEAD` = 0 means
   nothing unique is stranded). Christian must be able to run it without judgement calls.
5. **Linear issues**, correctly scoped and sequenced, each in a project, with coordination blocks.
   Separate the one-time cleanup from the systemic fixes.
6. **Correct the current briefing narrative.** `Design/user-actions.md` item #3 and the recent
   `Design/briefing.md` entries frame this as "77 commits behind, climbing, needs manual triage." The
   accurate framing is "the tree is parked off-branch; `main` is current; recovery is one command and
   loses nothing authored." Fix the wording as part of this work.

## Constraints

- **Investigation and planning only.** No `src/` edits, no PRs implementing fixes, no merges.
- **Do not repair the home tree during investigation** — it is the evidence. Recommending the repair
  is in scope; performing it is a separate ticket.
- The one-time recovery discards 68 staged tracked edits. Per fact #11 these are a reverting
  snapshot, not authored work — discarding is correct. Spot-check two or three files to satisfy
  yourself, then stop; do not spend budget re-litigating this. The 15 **untracked** design docs
  survive `git switch -f` / `reset --hard` and need their own keep-or-delete decision.
- Follow the design workflow in CLAUDE.md: three-pillar check is likely N/A here (this is
  infrastructure, not a game feature) — mark it so explicitly with rationale rather than skipping.
- Log impediments as you hit them (`impediment-reporter`).

## Starting artifacts

- `C:\Users\chris\bin\threadbare-autosync.ps1` and `threadbare-autosync.log`
- `scripts/session-precheck.ts` (the freshness signal)
- `.claude/skills/pull-work/SKILL.md` (worktree isolation, dirty-tree fallback)
- `.claude/skills/keep-work-flowing-cc/SKILL.md` (this brief; also emits the misleading count)
- `Docs/impediments.md` (84 lines of prior art on exactly this)
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` (WIP limits, single-executor rules)
- `CLAUDE.md` § Session Workflow (the freshness-signal hard stop), § Scheduled Tasks
- Memory: `project_git_cleanup_automation`, `feedback_worktree_preview_server`,
  `feedback_worktree_edit_paths`, `reference_skill_sync_hook_blocks_docs_commits`
