# Briefing
**Generated:** 2026-10-03 01:58 local (23:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

## Also waiting (5)

- **Was the app closed from Thursday ~17:00 to Friday ~13:45?** No lane ran for about 21 hours, and nothing recorded a pause. If you were away or the app was closed, just say so.
- **The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time.** *— from the lane-silence check*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail on each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Found things in the reward draw](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at): **about half of the Storied and Mythic rewards a mortal earns become a thing found in this world** (a dead hero's blade, flood salvage, a trophy off a monster host), instead of the same few dozen authored items on repeat. The reward still fits the work. A swap happens only when at least two kinds of found thing fit. One new kind is added (*the book someone argued with*). That comes to about 50 found things per world in 150 turns, roughly 40% of Storied and Mythic rewards. Everyday rewards are unchanged. If 50 is too many, name a smaller share (a quarter, say). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md). *— from the design lane*

Say "veto found things" to reverse it.

## Queue

**15 jobs ready** (healthy). Nothing is being built right now. The last merge was [location traits in prose](https://github.com/christianspliid-ui/threadbare/pull/2175) at 01:39 ([THR-1522](https://linear.app/threadbare/issue/THR-1522)): a place's traits now reach the words it is described in. Next builder slot ~02:10.

- **Next in line:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) · [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) · [the lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686/the-lead-survey-and-the-kept-visit-a-survey-of-a-held-lead-skips-the) · [the pilgrim way](https://linear.app/threadbare/issue/THR-1660/a-faith-undertaking-consecrates-new-pilgrim-routes-mid-game-design-the) · [rival strikes from nudge pressure](https://linear.app/threadbare/issue/THR-1690/nudge-driven-detection-pressure-never-crosses-a-threshold-no-detection). [Found things in the reward draw](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at) waits for its veto window (until Saturday ~20:45).
- **New since last hour:** [re-casting a blessing you already hold still costs full price](https://linear.app/threadbare/issue/THR-1700/a-held-sustained-verb-is-still-offered-on-its-own-target-re-casting), found by the review gate on the Sanctify merge.
- **Small bugs waiting:** [an apex monster's title missing from its fight header and lair card](https://linear.app/threadbare/issue/THR-1698/an-apex-monsters-card-line-reaches-prose-only-the-fight-header-and), [the Wolf-Winter Watch's "Under Watch" never wears off](https://linear.app/threadbare/issue/THR-1697/the-wolf-winter-watch-puts-under-watch-on-a-village-forever-its-apply), [a refused visit leaves a phantom appointment](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed).
- **Old jobs at the bottom:** two deferrals have sat ready for over a month ([THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies)). Not blocked; newer work keeps outranking them.

## Health

- **The simulation is still slower, seventh hour running.** A builder's job to check: tick cost 134 ms/tick steady, 50% above the 7-day median (89, 119 rows since b9803408); top phase agent_decision, 539 agents. Name the merges between b9803408 and 034dac21: git log --oneline --merges b9803408..034dac21. The jump came at the [rival-scheme attribution merge](https://github.com/christianspliid-ui/threadbare/pull/2168).
- **The post-merge slow-test run has now failed five merges in a row** — the same slowdown showing. Failed: [#2171](https://github.com/christianspliid-ui/threadbare/actions/runs/37054692379), [#2172](https://github.com/christianspliid-ui/threadbare/actions/runs/37062003656), [#2173](https://github.com/christianspliid-ui/threadbare/actions/runs/37068903012), [#2174](https://github.com/christianspliid-ui/threadbare/actions/runs/37074243974), [#2175](https://github.com/christianspliid-ui/threadbare/actions/runs/37078586227). Nothing in the ready queue covers it. A builder's job: fix the tick-cost regression, or else raise the limits.
- **About a third of high-rank faction work is still unreachable in a long game.** 20 of 60 gated encounters are blocked. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-02.md). A builder's job.
- **The worktree reaper has 6 worktrees waiting for a decision** (431 worktrees, 300 local branches on disk). The reaper's own job; noted for visibility.
- Everything else is green. The live site serves the latest commit (034dac21). All 10 scheduled tasks are on time. No pull requests are waiting.
