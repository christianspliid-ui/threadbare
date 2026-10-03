# Briefing
**Generated:** 2026-10-03 04:57 local (02:57 UTC) · keep-work-flowing-cc

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

- [A descendant can want the old homeland back](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule): **a hero whose forebears ruled a fallen empire can now come to want a piece of its old land back** — a new want, *Raise the Old Banner*. **Nobody living is blamed:** the empires fell 700 to 1,100 years ago, so it names no enemy and carries no heat (*this is the call to veto — the alternative is a grudge against whoever holds the old land now; in 7 of 12 measured cases nobody does*). To finish it they walk among their forebears' ruins and take a piece of the old land they did not already own. Only heroes who already make their own decisions take it up, when a slot frees — about one to three per world. On their page: *"Because of the old blood of the Ash-Crowned."* [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1658-raise-the-old-banner.md). Veto window closes ~03:00 Sunday. *— from the design lane*
- [Found things in the reward draw](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at): **about half of the Storied and Mythic rewards a mortal earns become a thing found in this world** (a dead hero's blade, flood salvage, a trophy off a monster host) instead of the same few dozen authored items on repeat. The reward still fits the work; a swap happens only when at least two kinds of found thing fit; one new kind is added (*the book someone argued with*). About 50 found things per world in 150 turns, roughly 40% of Storied and Mythic rewards; everyday rewards unchanged. If 50 is too many, name a smaller share. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md). Veto window closes ~20:45 tonight. *— from the design lane*

Say "veto old banner" or "veto found things" to reverse either.

## Queue

**13 jobs ready** (healthy). Nothing merged since 02:48. Two jobs are being built right now.

- **Being built:** [the pilgrim way](https://linear.app/threadbare/issue/THR-1660/a-faith-undertaking-consecrates-new-pilgrim-routes-mid-game-design-the) — a builder is working on it now (last commit 04:50, [branch](https://github.com/christianspliid-ui/threadbare/tree/claude/thr-1660-consecrate-pilgrim-way)); no pull request yet.
- **Built, waiting to merge:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) — [pull request #2178](https://github.com/christianspliid-ui/threadbare/pull/2178) passed every check at 04:25, but nobody has queued it to merge, and the job has no owner on the board. A builder's job to finish, not yours.
- **Next in line:** [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) · [the lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686/the-lead-survey-and-the-kept-visit-a-survey-of-a-held-lead-skips-the) · [rival strikes from nudge pressure](https://linear.app/threadbare/issue/THR-1690/nudge-driven-detection-pressure-never-crosses-a-threshold-no-detection) · [a held blessing still offered at full price](https://linear.app/threadbare/issue/THR-1700/a-held-sustained-verb-is-still-offered-on-its-own-target-re-casting). The two designs above wait out their veto windows.
- **Small bugs waiting:** [an apex monster's title missing from its fight header](https://linear.app/threadbare/issue/THR-1698/an-apex-monsters-card-line-reaches-prose-only-the-fight-header-and), [the Wolf-Winter Watch's "Under Watch" never wears off](https://linear.app/threadbare/issue/THR-1697/the-wolf-winter-watch-puts-under-watch-on-a-village-forever-its-apply), [a refused visit leaves a phantom appointment](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed).
- **Old jobs at the bottom:** two deferrals have sat ready for over a month ([THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies)). Not blocked; newer work keeps outranking them.

## Health

- **The simulation is slower again, tenth hour running.** A builder's job: tick cost 145 ms/tick steady, 62% above the 7-day median (90, 119 rows since 00869497); top phase agent_decision, 539 agents. Name the merges between 00869497 and d20c72c3: git log --oneline --merges 00869497..d20c72c3. The jump came at the [rival-scheme attribution merge](https://github.com/christianspliid-ui/threadbare/pull/2168).
- **One finished pull request is not queued to merge:** [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) (the spell generator), green since 04:25. A builder's job.
- **About a third of high-rank faction work is still unreachable in a long game.** 20 of 60 gated encounters are blocked. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-02.md). A builder's job.
- **The worktree reaper has 6 worktrees waiting for a decision** (436 worktrees, 304 local branches on disk). The reaper's own job; noted for visibility.
- Everything else is green. The live site serves the latest game code (68c62a0a; later commits were docs only). All 10 scheduled tasks are on time.
