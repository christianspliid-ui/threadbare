# Briefing
**Generated:** 2026-10-03 14:57 local (12:57 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

## Also waiting (5)

- **Was the app closed from Thursday ~17:00 to Friday ~13:45?** No lane ran for about 21 hours, and nothing recorded a pause. If you were away or the app was closed, just say so.
- **The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time.** *— from the lane-silence check* (Tuesday ~19:30 to Wednesday ~20:20 your time.)
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail on each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [After the bond, The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her): **The First's important moments now stop the world and wait for you, and her everyday chores move under a "Daily life" filter in the Chapter Ledger.** She is born set to *Asks you*; the switch on her row now works and is free. *The call to veto:* after each important moment she lives two days of ordinary life before the next can start (roughly 5 to 8 of her moments in the first 150 turns; one number if that is wrong). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1715-the-first-asks.md). Veto window closes ~14:50 Sunday. *— from the design lane*
- [Found things in the reward draw](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at): **about half of the Storied and Mythic rewards a mortal earns become a thing found in this world** (a dead hero's blade, flood salvage, a trophy off a monster host) instead of the same few dozen authored items on repeat. About 50 found things per world in 150 turns; everyday rewards unchanged. If 50 is too many, name a smaller share. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md). Veto window closes ~20:45 tonight. *— from the design lane*
- [A descendant can want the old homeland back](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule): **a hero whose forebears ruled a fallen empire can now come to want a piece of its old land back**, a new want called *Raise the Old Banner*. **Nobody living is blamed.** *This is the call to veto: the alternative is a grudge against whoever holds the old land now, and in 7 of 12 measured cases nobody does.* [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1658-raise-the-old-banner.md). Veto window closes ~03:00 Sunday. *— from the design lane*
- [Spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4): **the god can teach a mortal a spell with a new card, *Teach a Spell*, and some old books teach whoever comes to hold them.** Teaching dark magic costs the god doom and notice; gentle magic costs only essence (*veto this if you want every gift priced*). A god never teaches elder magic; an ancient book is the first way an outsider can find it. The card names the spell before you play it (*say so if you'd rather it stay a surprise*). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md). Veto window closes ~08:50 Sunday. *— from the design lane*

Say "veto first asks", "veto found things", "veto old banner" or "veto spell gifts" to reverse any of these.

## Queue

**18 jobs ready** (backed up, but draining: the round-2 playtest added 9 bugs at once).

- **Just landed:** [developer text no longer reaches a player's build](https://linear.app/threadbare/issue/THR-1707), the fifth round-2 playtest bug fixed. Merged via [#2193](https://github.com/christianspliid-ui/threadbare/pull/2193).
- **Next up (Urgent):** [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her), the round-2 playtest's top problem. Its plan merged this hour ([#2194](https://github.com/christianspliid-ui/threadbare/pull/2194)) and it is ready to build.
- **Then, from the playtest (Medium):** [THR-1708](https://linear.app/threadbare/issue/THR-1708), [THR-1709](https://linear.app/threadbare/issue/THR-1709), [THR-1710](https://linear.app/threadbare/issue/THR-1710), [THR-1711](https://linear.app/threadbare/issue/THR-1711).
- **Being built, stuck:** [a held blessing still offered at full price](https://linear.app/threadbare/issue/THR-1700/a-held-sustained-verb-is-still-offered-on-its-own-target-re-casting). [Pull request #2186](https://github.com/christianspliid-ui/threadbare/pull/2186) is queued but clashes with main, has no checks, and has had no push for ~5½ h. The code is safe on the pull request; nothing is left uncommitted on disk. A builder's job.
- **Built, waiting to merge:** [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): [pull request #2180](https://github.com/christianspliid-ui/threadbare/pull/2180) clashes with main and no checks have started. A builder's job.
- **Built, stuck:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and): [pull request #2178](https://github.com/christianspliid-ui/threadbare/pull/2178) clashes with main, is not queued to merge, and the job has had no owner on the board for ~10½ h. The code is safe on the pull request; nothing is left uncommitted on disk. The spell-gifts design waits on it. A builder's job.
- **Old jobs at the bottom:** two have sat ready for over a month ([THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies)). Neither is blocked; newer work keeps outranking them.

## Health

- **Three pull requests clash with main and cannot merge:** [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) (spell generator, unqueued), [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180) (fair draw) and [#2186](https://github.com/christianspliid-ui/threadbare/pull/2186) (held blessing). GitHub has scheduled no checks on #2180 or #2186. Each one needs main merged in and a push, which also restarts its checks. A builder's job.
- **The heavy simulation tests are red on the latest main.** A follow-up fix is owed. A builder's job.
- **The simulation is still slower than its weekly norm.** A builder's job: tick cost 152 ms/tick steady, 66% above the 7-day median (92, 119 rows since fed7ba93); top phase agent_decision, 548 agents. Name the merges between fed7ba93 and f8463b71: git log --oneline --merges fed7ba93..f8463b71
- **The worktree reaper has 6 worktrees waiting for a decision** (446 worktrees and 307 local branches on disk; last run 14:40). That is the reaper's own job; noted for visibility.
- Everything else is green. The live site is up to date (the commits since the last build were docs only), and all 11 scheduled tasks are on time.
