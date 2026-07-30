# Backlog Grooming — 2026-07-30

## Needs Christian

- **Nothing blocking.** One standing item, already your own call: the **Sphere-Governed Ascendant** project is parked in Idea per your 2026-07-30 verdict ("the whole area of power curve for ascendant growth is still rudimentary as we build the world and the mortals"). THR-870 carries the full design scope and activates only when you move the project out of Idea. **Recommendation: leave it parked** — the pivot re-keys god card-gating from Reach to Sphere, which is cheaper to design once the mortal-side power curve settles. No decision needed today; the board state is already correct.

## Work in flight

- **THR-868** (High, Encounter Experience) — Nudge Model WS6, Meet The First conversion. Design handed off 07:05Z, executor claimed it 07:10Z, ~15 min into the pass at time of writing. Four-pillar ticket (engine resolvers, Batch A content conversion, `FormativeTestBeat` UI, wiring + invariant tests). Healthy, untouched.

## Technical gates resolved this run

- **THR-681 → Done.** The executor stood down 07:06Z recommending closure as already-shipped under its parent THR-674, and deliberately left it In Dev unassigned to avoid burning another slot. Verified before closing rather than taking the comment at face value: `b55b0b22` is an ancestor of `origin/main`, the disposal doc is present on `origin/main`, and the reconciled ownership paragraph is live at `.claude/skills/pull-work/SKILL.md:91`. No open PR carried the id, so the manual close raced nothing. Second child of THR-674 to ship under the parent's id (impediment #310 covers the class).
- **Divine Economy — Essence Sources & Income → project Done.** Both member issues (THR-611, THR-621) were Done while the project still read "Now".

## Counts by state

In Dev 1 · Ready for Dev 52 · Todo 10 · In Design 1 · Implementation Planning 0 · Idea 60 · Deferral-labeled in Ready for Dev 25.

## Problems found and fixed

- **Assignee leak, 3 issues cleared** — THR-863, THR-864, THR-867 sat in Ready for Dev assigned to the API actor; cleared and verified absent across all 52 Ready-for-Dev items. **This is cosmetic, not blocking**: THR-845 already removed the `assignee` filter from `pull-work`'s reader, so assigned items are still picked up. Root cause is owned by THR-867 and my clears will likely drift back before the 12:00Z enforcer window — THR-863 has now recurred twice on the same issue.
- **Filed THR-871** (Medium, Continuous Improvement) — CLAUDE.md's "deferrals first" pick order is unreachable by construction. `pull-work` sorts by priority only, and all 25 Ready-for-Dev deferrals are Low while the WS5 partition keeps Medium work in the queue continuously. Bucket 3 outranks bucket 1 on every run, so the deferral queue is currently write-only. Filed as a decision ticket with four options, left in Idea for the orchestrator's promotion lane.
- **Roadmap cross-reference: no issues filed, deliberately.** Every `.planning/ROADMAP.md` § Future Work item has a Linear counterpart except PCCL Phase 2 (stateful shells). I did **not** file it — THR-763 already classifies that section as listing shipped primitives as pending, so filing from it manufactures a duplicate of shipped work. Handed the specific row to THR-763 to settle against `src/`.
- **Flagged, not acted on:** this task's rule "Deferrals should be in Idea or Todo unless actively worked" contradicts CLAUDE.md, whose priority-1 bucket is explicitly `label:"Deferral" state:"Ready for Dev"`. Moving 25 deferrals out of Ready for Dev would sabotage the documented bucket, so I left them and filed THR-871 instead.
- **Not mine to fix, no owner acting:** three armed PRs cannot merge — #1096 DIRTY (impediments doc, armed 07:06Z), #1098 BEHIND (auto-merge never fires at BEHIND under strict mode), #1031 UNKNOWN for ~2 days. Classes owned by THR-849 and THR-735 respectively.
- **No orphan issues** (every issue carries a project), **no stale design work** (In Design holds one item, updated today; Implementation Planning empty), **no completed-but-open projects** remaining after the Divine Economy close.

## Pipeline status

No gap — Ready for Dev holds 52 items against a single WIP=1 executor lane firing hourly, so the shelf is ~52 hours deep and the orchestrator is still filing roughly one sub-batch per run. Recommended next pickup once THR-868 lands: **THR-848** (WS5 Batch 1e, anomaly & trap literals, Medium, no converter risk) — the shallowest remaining item in the active partition, consistent with finish-before-you-start. The genuine risk here is not starvation but the reverse: 25 Low-priority deferrals cannot surface while that partition runs (THR-871).
