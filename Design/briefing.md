# Briefing
**Generated:** 2026-10-02 20:56 local (18:56 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

## Also waiting (5)

- **Was the app closed from Thursday ~17:00 to Friday ~13:45?** No lane ran for about 21 hours, and nothing recorded a pause. If you were away or the app was closed, just say so. *— from the lane-silence check*
- **Were you away from Tuesday evening until Wednesday evening (29–30 Sept)?** No lane ran for about 25 hours and nothing recorded a pause. *— from the lane-silence check*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail on each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Found things in the reward draw](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at) — **about half of the Storied and Mythic rewards a mortal earns become a thing found in this world** (a dead hero's blade, flood salvage, a trophy off a monster host), instead of the same few dozen authored items on repeat. The reward still fits the work; a swap happens only when at least two kinds of found thing fit; one new kind is added (*the book someone argued with*). That comes to about 50 found things per world in 150 turns, roughly 40% of Storied and Mythic rewards; everyday rewards are unchanged. If 50 is too many, name a smaller share (a quarter, say). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md). *— from the design lane*

Say "veto found things" to reverse it.

## Queue

**18 jobs ready** (backed up: more than 15). Nothing is being built right now. The builder just shipped [retiring the dead encounter-choice pipeline](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice) (merged 20:41 via [#2169](https://github.com/christianspliid-ui/threadbare/pull/2169)); that frees [THR-1690](https://linear.app/threadbare/issue/THR-1690) for the orchestrator to promote. Next builder slot ~21:11.

- **Next in line:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) · [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) · [found things in the reward draw](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at) (newly designed, see above) · [the lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686/the-lead-survey-and-the-kept-visit-a-survey-of-a-held-lead-skips-the) · [the pilgrim way](https://linear.app/threadbare/issue/THR-1660/a-faith-undertaking-consecrates-new-pilgrim-routes-mid-game-design-the).
- **Small bugs waiting:** [an apex monster's title missing from its fight header and lair card](https://linear.app/threadbare/issue/THR-1698/an-apex-monsters-card-line-reaches-prose-only-the-fight-header-and), [the Wolf-Winter Watch's "Under Watch" never wears off](https://linear.app/threadbare/issue/THR-1697/the-wolf-winter-watch-puts-under-watch-on-a-village-forever-its-apply), [a refused visit leaves a phantom appointment](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed).
- **Old jobs at the bottom:** four deferrals have sat ready for over a month ([THR-662](https://linear.app/threadbare/issue/THR-662/wire-the-two-remaining-no-op-sanctify-actions-subsanctify-subsanctify), [THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies), [THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-make-it-an-authored-flag-on-every-multi)). Not blocked; newer work keeps outranking them.

## Health

- **The simulation is still slower, second hour running.** A builder's job to check: tick cost 131 ms/tick steady, 47% above the 7-day median (89, 119 rows since 3e27003a); top phase agent_decision, 539 agents. Name the merges between 3e27003a and a86eb357: git log --oneline --merges 3e27003a..a86eb357. The jump came between 38a303ed (105 ms) and 1b12cfd8 (132 ms), which is the [rival-scheme attribution merge](https://github.com/christianspliid-ui/threadbare/pull/2168).
- **About a third of high-rank faction work is still unreachable in a long game.** 20 of 60 gated encounters are blocked. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-02.md). A builder's job.
- Everything else is green. The design lane ran on time at 20:18. The live site is current (the newest commits are docs only). No pull requests waiting. Background jobs and checks are healthy. The cleanup job ran at 20:40.
