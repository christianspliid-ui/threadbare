# Backlog Grooming — 2026-07-29

## Needs Christian

- **Nothing needs you.** Two things you may want to know, neither actionable.
- **The GitHub billing block is cleared** — Actions jobs run again (a full test/build executed green at 02:04Z). Whatever you did on the billing page worked. THR-842 stays open for a leftover design question, but the emergency is over.
- **The work queue had its top of stack hidden for about a day.** The robot that picks up work looks for tickets nobody is assigned to; the robot that files work was stamping your name on everything it filed. So the queue looked full but the picker saw a shorter list that never included the important items — including the urgent CI one. Fixed by hand this run, and the underlying cause is now ticketed (THR-845). No work was lost, only delayed.

## Work in flight

- **THR-844** (dead `investigation` revealFamily) — claimed by the executor at 13:24Z, healthy, mid-first-pass.
- **THR-838** (Nudge Model WS5 Batch 1) — 3 checkpoints, 7 of 48 templates shipped, no ship in sight at this scope. Re-scoped out of limbo this run (below).

## Technical gates resolved this run

- **THR-842** — Done-when item 1 satisfied. Verified with a run where the gate job *executed* rather than merely reported green (run 30415841790, `Test · Typecheck · Build: success`), because this ticket's own failure mode is a green check over a job that never started. The `skipped` results on recent `main` runs are the path filter working correctly on docs-only branches, not a recurrence — the discriminator is `Detect code changes`, FAILURE under the block and success now. Priority Urgent → High; items 2 (retro-verify) and 3 (SKIPPED-satisfies-protection design call) remain, neither time-critical.

## Counts by state

Ready for Dev **42** (all now pickable) · In Dev **1** · Todo **11** · Idea **61** · In Design **0** · Implementation Planning **0** · orphan issues **0**

## Problems found and fixed

- **19 of 41 Ready-for-Dev issues carried an assignee, making them invisible to `pull-work`'s `assignee:null` pickup query** — the executor could not see them, silently, with no bounce or log. The hidden set included the board's only Urgent (THR-842) and only High (THR-655). Root cause: the orchestrator's T1 promotion writes state *and* assignee in one mutation — each issue's `startedAt` matches its promotion PR to the second. `stale-claim-sweep` does not catch it (it queries In Dev only). Unassigned all 19 and verified by re-query: pickup candidates **22 → 40**. Filed **THR-845** (High) — the flush is one-time, the orchestrator re-accumulates at one per hour until the writer is fixed.
- **THR-838 was stranded In Dev + unassigned for ~13 h.** `pull-work`'s 3-checkpoint escalation parks tickets in In Dev, but the lane that re-scopes them (orchestrator T1) reads Todo — so an escalated ticket lands where no reader looks. Moved to **Todo**, and posted a materialised split partition (5 batches by the audit's `place:` tag + 2 structural one-offs) so filing the children is mechanical. Did not file the children: authoring the shelf is T2's call. Filed **THR-846** for the escalation gap; the SKILL.md text also still says "Cowork re-scopes", naming a lane retired 2026-07-21.
- **Three completed projects still open** — Small manual tweaks (5/5 Done, and marked Now + *Urgent*), Agent Coordination Protocol (22/22), Procedural Hex Vignettes (4/4). All three moved to Done.
- **No orphan issues** — every issue in every state carries a project. No stale design work: In Design and Implementation Planning are both empty.

## Pipeline status

Healthy and materially deeper than it looked. **42 pickable** (was 22 before this run), executor actively working THR-844, WIP=1 respected.

Recommended next pickups, by the Finish-Before-You-Start order: **THR-845** (High, Continuous Improvement — restores the queue's own integrity; take it before it re-accumulates), then **THR-655** (High, Pure Claude Code Migration — the only issue left in an active project, so it closes one), then **THR-842** (High, Repo Health). THR-845/846/836 all edit `.claude/skills/pull-work/SKILL.md` and are mutex with each other — take them serially, or fold all three into one pass, which is probably the better trade.

Not filed: no new roadmap gaps. `.planning/ROADMAP.md` § Future Work drift is already tracked by THR-763 (Ready for Dev), so cross-referencing it again would duplicate. One empty project, **Plan Cross-Linking Infrastructure** (zero issues ever, Idea status) — left alone; empty is not the same as completed, and deleting it is not a groomer's call.
