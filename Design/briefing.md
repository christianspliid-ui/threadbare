# Briefing
**Generated:** 2026-10-04 14:58 local (12:58 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** Two weekday stretches show no lane running at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* (in your time, Tuesday ~19:30 to Wednesday ~20:20). The other: Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

**Your playthrough is still paused on purpose, three-quarters of the way there.** Three of your four Unsafe Bridge jobs are live. The last, [removing the "threads" filler lines](https://linear.app/threadbare/issue/THR-1725/remove-the-threads-placeholder-lines-from-encounters-show-nothing), is built ([#2218](https://github.com/christianspliid-ui/threadbare/pull/2218)) but clashes with main and needs a builder to merge main in. I'll invite you back to [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) once it is live.

## Also waiting (3)

- **A finished change has been stuck for 33 hours and cannot merge on its own: PR #2180 ("feat(thr-1687): fair own-hex draw for the cap behind CAP_FILL_LOCAL_ORDER (ships 'walk')") has a conflict that repeated automated attempts have not cleared. Nothing is broken on the live site, but that work is not reaching it.** *— from the armed-PR check* ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180), [THR-1687](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert)). You don't need to do anything: it is held on purpose until its veto window closes (~02:45 Monday), then a builder clears the conflict.
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice): **the bonding scenes tell you what your hand did, in words, never odds.** The button reads "Play your hand, let fate answer"; a card that pulls one way says so ("Leans Brave"). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1714-show-the-roll.md). Veto window closes ~20:45 today. *— from the design lane*
- [The fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): **expert mortals will start to see the expert encounters written for them.** *The call to veto:* mortals would pick their own ambitions less often (3–4% of choices instead of 5–10%). [Evidence](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-04-thr-1687-start-local-drop.md) · [plan § D4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-01-thr-1687-cap-local-order.md). Veto window closes ~02:45 Monday. *— from the design lane*
- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says): **after Ascend, "Reach Down" is on screen at once, and the bond's own button, *"Let them walk"*, starts time.** *The call to veto:* say so if you'd rather the world start on its own after the bond. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md). Veto window closes ~08:45 Monday. *— from the design lane*
- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button stays on screen however many cards you're dealt.** Cards stay four per row at the size you approved; when they wrap, the button, your essence and the price · odds · setback key sit in a bar pinned to the bottom, and the second row scrolls under it. Two full rows can't fit with the card you locked. *The call to veto:* say **"five across"** or **"one row"** if you'd rather change your four-per-row rule. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md). Veto window closes ~14:40 Monday. *— from the design lane*

Say "veto show the roll", "veto fair draw", "veto arrival" or "veto hand bar" to reverse any of these.

## Queue

**7 jobs ready** (healthy), up from 6.

- **Being built now:** [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her) (Urgent). Its veto window closed at 14:50 and a builder started straight away: uncommitted edits in local worktree `practical-gould-0b802d`, touched a few minutes ago.
- **Next up:** [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice) (High), waiting out its veto window until ~20:45.
- **New since last hour:** [spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4) is live ([#2220](https://github.com/christianspliid-ui/threadbare/pull/2220), merged 14:39). Two new jobs are ready: [the five-card hand fit](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls) (veto window until Monday) and [nine god cards that can never be offered](https://linear.app/threadbare/issue/THR-1734/nine-divine-cards-target-agent-a-node-type-no-target-context-carries), among them Bestow Power and Rekindle.
- **In progress, stalled:** [the "threads" filler lines](https://linear.app/threadbare/issue/THR-1725/remove-the-threads-placeholder-lines-from-encounters-show-nothing). [#2218](https://github.com/christianspliid-ui/threadbare/pull/2218) clashes with main and hasn't been touched since ~12:45. Its worktree is clean, so nothing is at risk. Builder's job.
- **Parked:** [the ruin-visit fix](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed) ([#2199](https://github.com/christianspliid-ui/threadbare/pull/2199)) still clashes and has had no owner for ~18.5 h, after hitting the code-review round limit. Worktree clean, code safe on the pull request. Builder's job, not yours.
- **Old job at the bottom:** [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies) has sat ready for two months; newer work keeps outranking it.

## Health

- **GitHub is not starting checks on two pull requests** ([#2218](https://github.com/christianspliid-ui/threadbare/pull/2218), [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180)). Both also clash with main, as does [#2199](https://github.com/christianspliid-ui/threadbare/pull/2199). Merging main in and pushing restarts the checks. Builders' jobs.
- **The heavy simulation tests are red on main** (since the stakes-line merge). A builder owes a follow-up fix.
- **The worktree reaper has 6 worktrees waiting for a decision** (464 worktrees, 309 local branches on disk). The reaper's own job; noted for visibility.
- Everything else is green. The live site is current (the latest commits were docs only), the nightly background jobs run, all 11 scheduled tasks are on time, and simulation speed is normal (107 ms/tick, 6% faster than the 7-day median).
