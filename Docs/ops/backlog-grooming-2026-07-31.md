# Backlog Grooming — 2026-07-31

## Needs Christian

- **The whole content pipeline is waiting on you, and one mechanical thing is also stuck.** THR-883 (the Fable encounter-format prototype) blocks 11 content tickets. Its last checkpoint says it is waiting on your feedback on five prototype encounters written in the new format. That is the real gate and only you can clear it.
- **Separately, and not your problem to fix:** the PR carrying that prototype's output (the golden exemplar + the rewritten authoring rules) has a merge conflict and cannot land on its own. An executor session needs ~10 minutes on it. Recommendation: whoever runs the next THR-883 session clears the conflict first, then brings you the five prototypes. Recorded on THR-883; no action needed from you.

## Work in flight

- **THR-860** (WS5 Batch 1b-i, capital cluster) — In Dev, deliberately unassigned so the WIP slot stays free. Four templates written and pushed on PR #1114; auto-merge was correctly disarmed on 07-30 because the work predates the THR-883 pause by 19 minutes. Held, not lost. Nothing to do until the format is locked.
- **THR-883** — In Design, 1 day old, six session checkpoints. Not stale; awaiting Christian.

## Technical gates resolved this run

- **THR-883** — commented with a read-only diagnosis of PR #1132's conflict (`git merge-tree`): two files, `.claude/skills/encounter-pipeline/SKILL.md` (collides with THR-888, merged ~04:0xZ today) and the generated `Docs/canon/interface-map.generated.md`. Both mechanical; fix recipe recorded. No board mutation — the ticket's remaining work is Christian's.
- **THR-897** — filed (High, Todo, Continuous Improvement) with its coordination block: the pull-work Step 0.8 armed-PR sweep matches `BEHIND` only, so a `DIRTY` armed PR is invisible to it and idles forever. Two of the three open PRs (#1132, #1096) are in that state right now. Distinct from THR-735, which is the drain-*rate* problem; noted as mutex with it.

## Counts by state

Idea 65 · Todo 20 · Implementation Planning 0 · Ready for Dev 43 · In Dev 1 · In Design 1.

## Problems found and fixed

- **Assignee leak on 6 issues, cleared and verified.** THR-762 was in Ready for Dev assigned to Christian, which makes it invisible to the executor's `assignee:null` pickup query — it had been silently unpickable since 07-28. Re-queried after the write: it now appears in the pickup list. Also cleared the same latent leak on 5 Todo issues (THR-838, THR-791, THR-866, THR-790, THR-735, THR-175) so they do not land invisible when promoted. This is THR-867's open defect firing again.
- **No orphan issues** — every issue across all six states carries a project.
- **No stale design work** — In Design holds one 1-day-old issue; Implementation Planning is empty.
- **ROADMAP cross-reference: nothing to file.** `.planning/ROADMAP.md` Future Work is fully covered — the Social Systems sequence shipped under different ids (TB-095 → THR-74 Done, TB-099 → THR-724 Done), and Phases 3–5, Codex, onboarding, culture seeding, NPC workforce and chain reactions all have live issues. Deliberately filed no duplicates, per THR-756.

## Pipeline status

Healthy on volume, blocked on judgement. Ready for Dev holds 43 unassigned items, so the hourly executor cannot starve. But the active "Now" project (Encounter Experience) has 11 of its tickets hard-blocked behind THR-883, so the lane is drawing from lower-value backlog while its main line waits.

**Recommended next pickup:** THR-897 (High) or THR-735 (High) — both process/CI, both unblocked, and THR-897's evidence is live on the board today. Of the two, THR-897 is the better first pull: it is smaller, and fixing it is what surfaces the next stuck PR before it costs another 12 hours.

**Flagged, not actioned:** two "Now" projects hold only Idea-state issues (Encounter Format Migration, Agent Success Redesign) — candidates for a status downgrade, but each still has genuine deferred tails, so this is a judgement call for a design session rather than a grooming mutation.
