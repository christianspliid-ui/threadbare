# Briefing
**Generated:** 2026-10-03 23:59 local (21:59 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

## Also waiting (6)

- **A finished change has been stuck for 18 hours and cannot merge on its own: PR #2180 ("feat(thr-1687): fair own-hex draw for the cap behind CAP_FILL_LOCAL_ORDER (ships 'walk')") has a conflict that repeated automated attempts have not cleared. Nothing is broken on the live site, but that work is not reaching it.** *— from the armed-PR check* ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180), [THR-1687](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert)). Nothing for you to do by hand: a builder merges main in and pushes.
- **Was the app closed from Thursday ~17:00 to Friday ~13:45?** No lane ran for about 21 hours, and nothing recorded a pause. If you were away or the app was closed, just say so.
- **The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time.** *— from the lane-silence check* (Tuesday ~19:30 to Wednesday ~20:20 your time.)
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail on each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [A descendant can want the old homeland back](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule): **a hero whose forebears ruled a fallen empire can now come to want a piece of its old land back**, a new want called *Raise the Old Banner*. **Nobody living is blamed.** *This is the call to veto: the alternative is a grudge against whoever holds the old land now, and in 7 of 12 measured cases nobody does.* [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1658-raise-the-old-banner.md). Veto window closes ~03:00 Sunday. *— from the design lane*
- [Spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4): **the god can teach a mortal a spell with a new card, *Teach a Spell*, and some old books teach whoever comes to hold them.** Teaching dark magic costs the god doom and notice; gentle magic costs only essence (*veto this if you want every gift priced*). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md). Veto window closes ~08:50 Sunday. *— from the design lane*
- [After the bond, The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her): **The First's important moments now stop the world and wait for you, and her everyday chores move under a "Daily life" filter.** She is born set to *Asks you*. *The call to veto:* after each important moment she lives two days of ordinary life before the next (roughly 5 to 8 moments in the first 150 turns; one number if that is wrong). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1715-the-first-asks.md). Veto window closes ~14:50 Sunday. *— from the design lane*
- [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice): **the bonding scenes now tell you what your hand did**, in words, never odds. The button reads **"Play your hand, let fate answer"** or **"Stay silent, let fate answer"**, and a card that pulls the mortal one way says so, e.g. **"Leans Brave"** (*the call to veto if it reads as a promise*). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1714-show-the-roll.md). Veto window closes ~20:45 Sunday. *— from the design lane*

Say "veto old banner", "veto spell gifts", "veto first asks" or "veto show the roll" to reverse any of these.

## Queue

**11 jobs ready** (healthy).

- **Being built now:** [the rival strike encounter](https://linear.app/threadbare/issue/THR-1703/the-rival-strike-has-no-encounter-author-shadowrival-strike-so) — its branch was pushed minutes ago; no pull request yet.
- **Next up (Urgent):** [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her), ready once its veto window closes (~14:50 Sunday); [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice) (High) follows (~20:45 Sunday).
- **Built, stuck:** [the ruin-visit fix](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed): [#2199](https://github.com/christianspliid-ui/threadbare/pull/2199) clashes with main and is not queued to merge; no owner on the board for ~3.5 h. Its code is safe on the pull request (nothing left uncommitted). A builder's job.
- **Built, stuck:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and): [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) clashes with main, not queued, no owner for ~19 h (nothing left uncommitted). The spell-gifts design waits on it. A builder's job.
- **Old jobs at the bottom:** two have sat ready for over a month ([THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies)). Neither is blocked; newer work keeps outranking them.

## Health

- **The heavy simulation tests are red on main** (~2 h). A follow-up fix is owed. A builder's job.
- **Three pull requests clash with main and cannot merge:** [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180) (fair draw, queued; GitHub has scheduled no checks on it), [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) (spell generator) and [#2199](https://github.com/christianspliid-ui/threadbare/pull/2199) (ruin visit). Each needs main merged in and a push. A builder's job.
- **The simulation-speed reading is unreliable this hour.** tick cost 245 ms/tick steady, 143% above the 7-day median (101, 120 rows since f0f24999); top phase agent_decision, 532 agents. Name the merges between f0f24999 and b928796a: git log --oneline --merges f0f24999..b928796a. *Note:* the same commit (b928796a) measured 144 last hour and 294 on a re-run this hour while a build session was active on the machine, so most of this jump is machine load, not code. The underlying ~45% slowdown stands; a builder's job.
- **The worktree reaper has 6 worktrees waiting for a decision** (451 worktrees and 306 local branches on disk). That is the reaper's own job; noted for visibility.
- Everything else is green. The live site is serving the latest commit on main (b928796a), and all 11 scheduled tasks are on time.
