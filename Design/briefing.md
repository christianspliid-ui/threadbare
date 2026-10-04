# Briefing
**Generated:** 2026-10-04 04:58 local (02:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live, including the "X begins Y" news-line fix ([THR-1722](https://linear.app/threadbare/issue/THR-1722/a-mortal-who-begins-a-new-catalogue-encounter-crashes-the-rest-of-its), [#2207](https://github.com/christianspliid-ui/threadbare/pull/2207)). The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

## Also waiting (6)

- **A finished change has been stuck for 24 hours and cannot merge on its own: PR #2178 ("feat(thr-1572): the seeded spell generator — every tradition teaches its own spells") has a conflict that repeated automated attempts have not cleared. Nothing is broken on the live site, but that work is not reaching it.** *— from the armed-PR check* ([#2178](https://github.com/christianspliid-ui/threadbare/pull/2178), [THR-1572](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and)). Nothing for you to do: clearing the conflict is a builder's job. The fair-draw PR [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180) is still stuck the same way, but on purpose: it waits on its veto window (~02:45 Monday).
- **Was the app closed from Thursday ~17:00 to Friday ~13:45?** No lane ran for about 21 hours, and nothing recorded a pause. If you were away or the app was closed, just say so.
- **The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time.** *— from the lane-silence check* (Tuesday ~19:30 to Wednesday ~20:20 your time.)
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail on each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4): **the god can teach a mortal a spell (*Teach a Spell*), and some old books teach whoever holds them.** Dark magic costs doom and notice; gentle magic only essence. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md). Veto window closes ~08:50 Sunday. *— from the design lane*
- [After the bond, The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her): **The First's important moments stop the world and wait for you; her chores move under a "Daily life" filter.** About 5 to 8 moments in the first 150 turns. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1715-the-first-asks.md). Veto window closes ~14:50 Sunday. *— from the design lane*
- [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice): **the bonding scenes tell you what your hand did, in words, never odds** — "Play your hand, let fate answer", and cards that pull one way say so ("Leans Brave"). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1714-show-the-roll.md). Veto window closes ~20:45 Sunday. *— from the design lane*
- [The fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): **expert mortals will start to see the expert encounters written for them.** Mortals actually start *more* encounters with it on (5% and 19% more on two test worlds). *The call to veto:* with better encounters on offer, mortals pick their own ambitions less often (3–4% of choices instead of 5–10%). [Evidence](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-04-thr-1687-start-local-drop.md) · [plan § D4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-01-thr-1687-cap-local-order.md). Veto window closes ~02:45 Monday. *— from the design lane*

Say "veto spell gifts", "veto first asks", "veto show the roll" or "veto fair draw" to reverse any of these.

## Queue

**9 jobs ready** (healthy).

- **Being built:** [Raise the Old Banner](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule) — [#2208](https://github.com/christianspliid-ui/threadbare/pull/2208) is open with checks running; its builder is active (uncommitted edits in its worktree, touched minutes ago).
- **Being built, stuck:** [unaffordable choices can't be played](https://linear.app/threadbare/issue/THR-1720/an-authored-encounter-choice-the-god-cant-afford-is-still-playable) — [#2205](https://github.com/christianspliid-ui/threadbare/pull/2205) is queued to merge but clashes with main (~2.5 h since its last push; nothing uncommitted). A builder's job.
- **Next up:** [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her) (Urgent) and [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice) (High), both after their veto windows today.
- **Built, stuck:** [the ruin-visit fix](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed): [#2199](https://github.com/christianspliid-ui/threadbare/pull/2199) clashes with main, not queued, no owner for ~8.5 h. Code is safe on the pull request (nothing uncommitted). A builder's job.
- **Built, stuck:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and): [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) clashes with main, not queued, no owner for ~20 h (nothing uncommitted). The spell-gifts design waits on it. A builder's job.
- **Old jobs at the bottom:** two have sat ready for over a month ([THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies)). Neither is blocked; newer work keeps outranking them.

## Health

- **Four pull requests clash with main and cannot merge:** [#2205](https://github.com/christianspliid-ui/threadbare/pull/2205) (THR-1720), [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180) (fair draw, deliberately waiting), [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) (spell generator) and [#2199](https://github.com/christianspliid-ui/threadbare/pull/2199) (ruin visit). GitHub has scheduled no checks on #2180; a merge of main plus a push restarts them. A builder's job.
- **The post-merge heavy simulation tests are red on the latest main** (dca9681d). The recent failures were timeouts, not wrong answers, and are likely tied to the slowdown below. A builder's job.
- **The simulation is running slower.** tick cost 146 ms/tick steady, 38% above the 7-day median (106, 119 rows since 20269589); top phase agent_decision, 532 agents. Name the merges between 20269589 and dca9681d: git log --oneline --merges 20269589..dca9681d. A builder's job.
- **The worktree reaper has 6 worktrees waiting for a decision** (457 worktrees and 307 local branches on disk). That is the reaper's own job; noted for visibility.
- Everything else is green. The live site serves the latest main (dca9681d), and all 11 scheduled tasks are on time.
