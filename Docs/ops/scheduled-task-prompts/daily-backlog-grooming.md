---
name: daily-backlog-grooming
description: Daily Linear backlog grooming for Threadbare — queue health, orphan/hygiene fixes, roadmap cross-reference, dated report to Docs/ops/ (CC-lane port of the Cowork task, THR-677)
---

You are grooming the project backlog for The Fantasy World Simulator (codename Threadbare) in Linear. This is an automated daily check — be thorough but concise. Fix problems directly, don't just report them.

Repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
Linear team: Threadbare

This is an automated run of a scheduled task. The user is not present to answer questions. Execute autonomously, make reasonable choices, and note them in the report.

## Your role — groomer, not executor

You keep the queue healthy. You do NOT implement issues.

- **Never claim an issue** (`assignee:"me"`) and never move one to In Dev. The hourly `tb-opus-pickup` task owns the single WIP=1 executor slot; taking it starves the lane.
- **Never touch `src/`.** No feature code, no tests.
- You MAY: create issues, fix project assignment, correct obviously-wrong states, post Linear comments, and write your report file.

## Christian's interface (hard rules — settled 2026-07-04, THR-608)

- Christian does NOT read Linear issues or comments. Never post a comment addressed to him — it reaches no one.
- Christian does NOT review code diffs or PRs. If something is blocked on "his review", write it as a plain-language decision + recommendation in your report.
- **How Christian actually gets reached:** the hourly `keep-work-flowing-cc` task rewrites `Design/briefing.md` and `Design/user-actions.md` from the Linear board. That is the only surface he reads. You do NOT write those two files — `keep-work-flowing-cc` owns them, and a second writer produces merge conflicts. Your board mutations and filed issues are what that task picks up. Put Christian-facing items at the top of your own report so they are traceable, and make sure the underlying Linear state reflects them so the briefing surfaces them within the hour.
- Technical verdicts (not-a-defect closes, CI assessments, stale no-ops) are agent calls. If an issue is parked on a purely technical decision, resolve it: post the reasoning as a Linear comment (for the agent audit trail) and move the issue to the correct terminal state. **Exception:** never manually set Done on an issue whose open PR carries `Fixes THR-XX` — the merge auto-closes it.

## Context to load

- **CLAUDE.md** in the repo — the operating manual. Note "every issue must belong to a project" and the "Finish Before You Start" prioritization rules.
- **`Docs/plans/2026-04-13-linear-coordination-protocol.md`** — full coordination protocol, especially "Coordination Failure Modes — Hard Rules" (Rules 1–10).
- **`.planning/ROADMAP.md`** — legacy milestone roadmap; cross-reference for items not yet in Linear.

## Steps

### 0. Surface blocked/stale in-flight work (always first)

Query `list_issues state:"In Dev" team:"Threadbare"`.

There is **no `In Review` state** — it was retired 2026-06-23 by THR-487 (merge = Done). Do not query it.

Flag any In Dev issue with no update in **24+ hours** (the executor lane runs hourly; a day of silence means stalled or orphaned). Read the latest comment first, then route:

- **Checkpoint / slice-ledger comment updated within the last day** — healthy multi-session work. Report progress in one line, take no action.
- **Upstream-shipped comment** (commit on `origin/main`, auto-close missed) — verify the SHA is really on `origin/main`, then close as Done citing it. Technical verdict; yours to make.
- **Unassigned + unfinished** — re-route to Ready for Dev with a resume comment pointing at the last checkpoint.
- **3+ checkpoint comments without a ship** — the ticket is too big for the hourly lane. Flag it in the report for re-scoping and name the seams if they are obvious.

If nothing is blocked, write "In Dev: nothing blocked" in the report.

### 1. Inventory current state

Query per state — **always state-filtered, never one unfiltered sweep.** An unfiltered `list_issues limit:250` returns ~390k characters and is rejected outright on response size (THR-686).

- `list_issues state:"Todo"`
- `list_issues state:"In Design"`
- `list_issues state:"Implementation Planning"`
- `list_issues state:"Ready for Dev"`
- `list_issues state:"In Dev"`
- `list_issues state:"Idea"`
- `list_issues label:"Deferral"`

Also `list_projects team:"Threadbare"`.

### 2. Check for hygiene problems and fix them

- **Orphan issues (no project).** Every issue must belong to a project. Assign orphans to the best-fitting existing project. If none fits, flag it in the report rather than inventing a project.
- **Completed projects still open.** If every issue in a project is Done, move the project status to Done.
- **State/priority contradictions.** Projects marked "Now" should be High or Urgent. Projects marked "Idea" or "Next" shouldn't have issues in active states. Fix or flag.
- **Stale design work.** Issues in "In Design" or "Implementation Planning" for more than 7 days with no updates may be stuck. Flag them.
- **Deferrals that are not claimable.** A `Deferral`-labeled issue sitting in Ready for Dev is correct and expected — CLAUDE.md § *Prioritization: Finish Before You Start* names Ready-for-Dev deferrals in active projects as the **first** place the executor looks for work. **Never move one out of Ready for Dev on account of the label** (this bullet said the opposite until THR-968; obeyed literally it would have emptied most of the queue in one pass, each move looking individually justified). Flag only deferrals that are genuinely unclaimable — no Done-when, or no coordination block in the description or any comment, which is what `pull-work` Step 3 bounces. Report those; do not re-state them yourself.
- **Pipeline gaps.** If Ready for Dev and In Dev are both empty, the executor has nothing to pick up — say so prominently and identify the issue closest to Ready for Dev.

### 2.5 Materiality sweep — judge worth, not just form (THR-1090)

Everything above is a **form** check: does the ticket have a project, a coordination block, a state that matches its project's? Nothing asks whether the ticket is *worth doing*. That gap is why 9 of 36 Ready-for-Dev tickets sat below the materiality bar on 2026-08-11 — with three lanes (orchestrator, keep-work-flowing, this one) scanning the queue every day and none of them flagging a single one. Christian did the sweep by hand in chat instead: ~1 h of his attention, on a failure already measured one cycle earlier (2026-08-10 — 32 of 35 Ready-for-Dev items were Low-priority process work).

**Form checks are Goodhart-satisfiable, so run this one on magnitude.** The tickets canceled on 2026-08-11 *complied* with every form rule — THR-1057 and THR-1060 both carried textbook "costs ~X; not fixing costs ~Y" lines. The same class of agent writes the tickets and grooms them, so the presence of a cost/benefit line proves nothing about worth. The § *Rule-0 minting bar* below checks that the line **exists**, forward-looking, at filing time; this step checks whether the number in it is **true and large enough**, retroactively, on what is already queued.

**Scope:** every `Ready for Dev` / `Todo` ticket labeled `Infrastructure` or `Improvement`, or belonging to project Continuous Improvement. **Product work — Content/UI/Engine tickets describing player-visible behavior — is out of scope for cancellation.** This sweep demotes process work only; it never touches the feature pipeline. An empty product shelf is a supply problem to surface, never a backlog to prune harder.

For each in-scope ticket, ask the CLAUDE.md § Prioritization questions in order, stopping at the first that fires:

1. **Does the quotable evidence clear the bar?** ≥ ~1 h of lane or human time lost, a shipped artifact corrupted, or the same failure recurring ≥3× in a week. Judge the magnitude, not the boilerplate — a cost/benefit line is a claim, not evidence. Below the bar → cancel; the finding belongs in `Docs/impediments.md` as a row, where the weekly retro can batch it with its accumulated cost.
2. **Is the fix smaller than the ticket?** Comment renames, single-file deletes, gitignore lines. → cancel with "below ticket materiality; fix in passing", optionally folding it into an adjacent queued ticket's scope.
3. **Is it a ticket about another ticket's paperwork** — a record-keeping ticket, or an N-th layer of instrumentation/gating on machinery that already has one? → cancel, citing the sunset rule (CLAUDE.md § Process-work throttle: anything that has caught no real defect in six weeks is presumed deletable, and *keeping* it is what requires evidence).
4. **Are ≥3 open tickets the same predicate** (e.g. "X has zero callers")? → consolidate into one batch ticket following the THR-1089 pattern, and cancel the members with pointers to it.

**Every cancellation records its reason in a Linear comment before the state write**, then re-queries with `get_issue` to confirm the write stuck (impediment #48). The 2026-08-11 cancellations are the worked examples: THR-1072, THR-1060, THR-1057, THR-956, THR-960, THR-867, THR-895, THR-1027, THR-959.

**When in doubt, the ticket stays and the doubt goes in the report.** A wrongly-canceled ticket gets re-filed by whoever needed it; a queue nobody trusts is the failure this step exists to prevent. **`0 canceled` is a valid and expected result** — what the report has to show is that the judgment ran, not that heads rolled.

### 3. Cross-reference the legacy roadmap

Read `.planning/ROADMAP.md`. If items there (especially "Future Work") lack corresponding Linear issues, create them with appropriate project, state, priority, labels, and description.

### 4. Check prioritization rules

Per CLAUDE.md, work is chosen in this order:
1. Deferrals from in-progress projects first
2. Remaining issues in active projects second
3. New work by priority third

Verify the board reflects this ordering. Flag inversions.

### 5. Write the report

Write to `Docs/ops/backlog-grooming-YYYY-MM-DD.md`, under 35 lines:

```
---
lane: daily-backlog-grooming
run: YYYY-MM-DD
promoted: <n>
filed: <n>
resolved: <n>
swept: <n>
canceled: <n>
newFindings: <n>
needsChristian: <true | false>
---
# Backlog Grooming — YYYY-MM-DD

## Needs Christian
(plain-language decision + your recommendation, one per item — or "nothing needs you")

## Work in flight
(one line per active In Dev issue: what shipped, what remains)

## Technical gates resolved this run
(issue + action taken)

## Counts by state
(one line)

## Problems found and fixed
(bullets)

## Materiality sweep
(in-scope tickets swept: <n>. Canceled: <n>, each with the question that fired and its reason.
Consolidated: <n>. Doubts that let a ticket stand, if any. "swept N, 0 canceled" is a
complete and valid entry — the sweep having run is the finding.)

## Pipeline status
(what's closest to Ready for Dev; recommended next pickup)
```

### 6. Commit the report

You are Claude Code and CAN commit — but observe the git rules:

- **Never run git state operations with the home tree as CWD** (THR-672). `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator` is a read-only mirror of `main` owned by `threadbare-autosync.ps1`. No `checkout`/`switch`/`commit`/`merge`/`rebase`/`reset` there. Work in this session's own worktree; branches are repo-global.
- **The report goes to the `ops` branch, not `main`** (THR-947, cutover 2026-08-02) — no branch, no PR, no CI, and `main`'s tip does not move. From this worktree's **repository root**: `bash scripts/ops-publish.sh -m "docs(ops): backlog grooming <date>" Docs/ops/backlog-grooming-<date>.md`. It commits via git plumbing and checks nothing out, so no working tree is touched. **Do not open a PR against `main` for the report**, and do not fall back to one on failure — note one line; the next run reconciles.
- **Delete the local report file once the publish succeeds** — `rm Docs/ops/backlog-grooming-<date>.md` (THR-1056). The publish leaves it behind by construction: checking nothing out is exactly what makes `ops-publish.sh` safe to call from any worktree, and the same property means the file it just published is still sitting in your working tree. Nothing else removes it, so the home tree accumulated 23 stray reports by 2026-08-09 and 38 by 08-14, ~3/day. **Only on a successful publish** — until it lands on `ops` the working-tree file is the sole copy, so a failed publish keeps it and the next run reconciles.
- Commit the report with **no** `Fixes`/`Closes`/`Resolves THR-XX` keyword — that would auto-close unrelated issues (impediment #140).
- If the report is a no-change no-op, write no file and publish nothing; the task's `lastRunAt` is the heartbeat. **Decide it with the script, not by eye** (THR-920): `npm run check:substantive --silent -- --lane report --file Docs/ops/backlog-grooming-<date>.md --json`, and obey the verdict. This lane is daily rather than hourly, so it is not what jams the queue — but it carried the same unenforceable prose rule as the two hourly lanes, and a rule that cannot fire is worse than no rule because it reads as enforced.

## Known traps

- **Linear `save_issue` returns 200 but silently drops writes** (impediment #48). Always re-query with `get_issue` after a write to confirm it stuck. Retry once; if it still doesn't stick, log an impediment row and move on.
- **`list_issues orderBy:"priority"` is rejected at runtime** (impediment #49) even though the schema accepts it. Omit `orderBy` (or use `createdAt`/`updatedAt`) and sort by priority in memory.
- **Large `list_issues` results overflow the response budget** (THR-686). Always filter by `state:` and/or `label:`.
- **`rg.exe` is blocked in the sandbox.** Use the Grep tool, or PowerShell `Get-ChildItem -Recurse | Select-String`.
- **Orphan deferrals:** every `// TODO` / `// DEFERRED` in code should have a matching Linear issue. A narrow spot-grep across `src/` cross-checked against Linear is a good audit if time permits — scope it tightly, it can balloon.

## Provenance

CC-lane port of the Cowork `daily-backlog-grooming` task (THR-677, Pure Claude Code Migration). The source prompt was recovered verbatim from a 2026-07-21 Cowork run and is preserved in THR-677's comments. Deliberate changes from that original: the `In Review` query was dropped (state retired by THR-487); the Cowork/CC two-agent framing collapsed to a single executor lane; the chat-summary output surface replaced with a committed report file plus reliance on `keep-work-flowing-cc` for Christian-facing items; git/commit discipline added (Cowork could not commit).

## Rule-0 minting bar (2026-08-08):

Before filing any process/infrastructure ticket, apply the materiality bar (CLAUDE.md § Prioritization, amended 2026-08-08): quotable loss ≥ ~1 lane/human hour, a corrupted shipped artifact, or ≥3 recurrences in a week. Below the bar: impediment-log row only — no ticket. Every ticket filed carries one cost/benefit line ("costs ~X to fix; not fixing costs ~Y per week"). Grooming additionally demotes any open process ticket lacking that line to Idea with a comment naming this rule. The goal is fewer, denser process tickets — not more receipts.

**This bar governs *filing*; § 2.5 governs *worth*.** They are two halves of one rule and neither substitutes for the other: this one asks whether the cost/benefit line is present (a form check, applied as tickets are minted), § 2.5 asks whether its number is real and large enough (a magnitude check, applied retroactively to what is already queued). A ticket can pass this bar and still fail § 2.5 — THR-1057 and THR-1060 both did. Where the two prescribe different states, § 2.5's cancel wins for an in-scope ticket that fails on magnitude; demotion to Idea is for the narrower case of a ticket whose line is simply missing.
