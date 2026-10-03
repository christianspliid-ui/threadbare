# Briefing
**Generated:** 2026-10-03 08:55 local (06:55 UTC) · keep-work-flowing-cc

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

- [Found things in the reward draw](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at): **about half of the Storied and Mythic rewards a mortal earns become a thing found in this world** (a dead hero's blade, flood salvage, a trophy off a monster host) instead of the same few dozen authored items on repeat. About 50 found things per world in 150 turns; everyday rewards unchanged. If 50 is too many, name a smaller share. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md). Veto window closes ~20:45 tonight. *— from the design lane*
- [A descendant can want the old homeland back](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule): **a hero whose forebears ruled a fallen empire can now come to want a piece of its old land back** — a new want, *Raise the Old Banner*. **Nobody living is blamed** (*this is the call to veto — the alternative is a grudge against whoever holds the old land now; in 7 of 12 measured cases nobody does*). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1658-raise-the-old-banner.md). Veto window closes ~03:00 Sunday. *— from the design lane*
- **New:** [Spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4): **the god can teach a mortal a spell with a new card, *Teach a Spell*, and some old books teach whoever comes to hold them.** Teaching dark magic costs the god doom and notice; gentle magic costs only essence (*the call to veto if you want every gift priced*). A god never teaches elder magic; an ancient book is the first way an outsider can find it. The card names the spell before you play it (*say so if you'd rather it stay a surprise*). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md). Veto window closes ~08:50 Sunday. *— from the design lane*

Say "veto found things", "veto old banner" or "veto spell gifts" to reverse any of these.

## Queue

**11 jobs ready** (healthy). One feature merge since the last brief, plus two doc merges.

- **Just landed:** [rival strikes from nudge pressure](https://linear.app/threadbare/issue/THR-1690/nudge-driven-detection-pressure-never-crosses-a-threshold-no-detection) — merged 08:30 via [#2182](https://github.com/christianspliid-ui/threadbare/pull/2182). The spell-gifts plan ([#2183](https://github.com/christianspliid-ui/threadbare/pull/2183)) and the cold-playtest lane's registration ([#2185](https://github.com/christianspliid-ui/threadbare/pull/2185)) also merged.
- **Being built right now:** [a landed Hollow Crown changes only the odds](https://linear.app/threadbare/issue/THR-1683/a-landed-hollow-crown-changes-nothing-but-the-steps-odds-modifier-only) — a builder opened [pull request #2184](https://github.com/christianspliid-ui/threadbare/pull/2184) minutes ago; it already clashes with main, so the builder has a merge to do before queueing it.
- **Built, waiting to merge:** [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): [pull request #2180](https://github.com/christianspliid-ui/threadbare/pull/2180) clashes with newer main and no checks have started. A builder's job.
- **Built, stuck:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and): [pull request #2178](https://github.com/christianspliid-ui/threadbare/pull/2178) clashes with main in generated/doc files, is not queued to merge, and the job has no owner on the board (parked since ~04:25). Code is safe on the PR; no local workspace holds uncommitted work for it. The new spell-gifts design waits on this one too. A builder's job, not yours.
- **Next in line:** [a held blessing still offered at full price](https://linear.app/threadbare/issue/THR-1700/a-held-sustained-verb-is-still-offered-on-its-own-target-re-casting). The three designs above wait out their veto windows.
- **Small bugs waiting:** [an apex monster's title missing from its fight header](https://linear.app/threadbare/issue/THR-1698/an-apex-monsters-card-line-reaches-prose-only-the-fight-header-and), [the Wolf-Winter Watch's "Under Watch" never wears off](https://linear.app/threadbare/issue/THR-1697/the-wolf-winter-watch-puts-under-watch-on-a-village-forever-its-apply), [a refused visit leaves a phantom appointment](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed).
- **Old jobs at the bottom:** two deferrals have sat ready for over a month ([THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies)). Not blocked; newer work keeps outranking them.

## Health

- **Three pull requests clash with main and cannot merge:** [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) (spell generator, unqueued), [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180) (fair draw; GitHub has not scheduled a single check on it) and [#2184](https://github.com/christianspliid-ui/threadbare/pull/2184) (Hollow Crown, builder active). Each needs main merged in and a push, which also restarts the checks. A builder's job.
- **The heavy simulation tests are red on the latest main** (about 4 hours). A follow-up fix is owed. A builder's job.
- **The simulation is still slower, but recovering** (142 → 114 ms/tick since the last brief). A builder's job: tick cost 114 ms/tick steady, 27% above the 7-day median (90, 120 rows since 81c5c9ef); top phase agent_decision, 548 agents. Name the merges between 81c5c9ef and c9c1b0ec: git log --oneline --merges 81c5c9ef..c9c1b0ec
- **The worktree reaper has 6 worktrees waiting for a decision** (441 worktrees, 306 local branches on disk). The reaper's own job; noted for visibility.
- Everything else is green. The live site is current (the latest commits touched only docs). All 10 scheduled tasks are on time; the cold-playtest lane runs for the first time at ~10:48.
