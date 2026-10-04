# Briefing
**Generated:** 2026-10-04 15:56 local (13:56 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** Two weekday stretches show no lane running at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* (in your time, Tuesday ~19:30 to Wednesday ~20:20). The other: Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

**All four of your Unsafe Bridge jobs are now live.** The last one, [removing the "threads" filler lines](https://linear.app/threadbare/issue/THR-1725/remove-the-threads-placeholder-lines-from-encounters-show-nothing), merged at 15:20 ([#2218](https://github.com/christianspliid-ui/threadbare/pull/2218)) and is on the live site. I'm not inviting you back to [the playthrough](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) yet: one known fault is still on that screen. A [five-card hand pushes the "Let fate decide" button off the bottom](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls), and its fix can be built from Monday ~14:40. Once it is live and an agent has re-walked the five encounters, the invitation comes.

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice): **the bonding scenes tell you what your hand did, in words, never odds.** The button reads "Play your hand, let fate answer"; a card that pulls one way says so ("Leans Brave"). [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1714-show-the-roll.md). Veto window closes ~20:45 today. *— from the design lane*
- [The fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): **expert mortals will start to see the expert encounters written for them.** *The call to veto:* mortals would pick their own ambitions less often (3–4% of choices instead of 5–10%). [Evidence](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-04-thr-1687-start-local-drop.md) · [plan § D4](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-01-thr-1687-cap-local-order.md). Veto window closes ~02:45 Monday. *— from the design lane*
- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says): **after Ascend, "Reach Down" is on screen at once, and the bond's own button, *"Let them walk"*, starts time.** *The call to veto:* say so if you'd rather the world start on its own after the bond. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md). Veto window closes ~08:45 Monday. *— from the design lane*
- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button stays on screen however many cards you're dealt.** Cards stay four per row at the size you approved; when they wrap, the button, your essence and the price · odds · setback key sit in a bar pinned to the bottom, and the second row scrolls under it. Two full rows can't fit with the card you locked. *The call to veto:* say **"five across"** or **"one row"** if you'd rather change your four-per-row rule. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md). Veto window closes ~14:40 Monday. *— from the design lane*

Say "veto show the roll", "veto fair draw", "veto arrival" or "veto hand bar" to reverse any of these.

## Queue

**7 jobs ready** (healthy), unchanged.

- **Being built now:** [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her) (Urgent). Work in progress is saved and pushed (last save 15:55); nothing is sitting uncommitted.
- **Also being built:** [stuck pull requests become the builder's job, never yours](https://linear.app/threadbare/issue/THR-1735/stuck-prs-are-the-pickup-lanes-to-fix-unstick-duty-in-step-08) ([#2223](https://github.com/christianspliid-ui/threadbare/pull/2223)), set to merge once its checks pass.
- **Next up:** [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice) (High), waiting out its veto window until ~20:45.
- **New since last hour:** [the "threads" filler lines](https://linear.app/threadbare/issue/THR-1725/remove-the-threads-placeholder-lines-from-encounters-show-nothing) ([#2218](https://github.com/christianspliid-ui/threadbare/pull/2218)) and [the ruin-visit fix](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed) ([#2199](https://github.com/christianspliid-ui/threadbare/pull/2199)) both merged and are live.
- **Held on purpose:** [the fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180)) is not set to merge until its veto window closes (~02:45 Monday). It still clashes with main; clearing that is a builder's job, not yours.
- **Old job at the bottom:** [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies) has sat ready for two months; newer work keeps outranking it.

## Health

- **Simulation speed check:** "tick cost 150 ms/tick steady, 32% above the 7-day median (113, 120 rows since ce917ad9); top phase agent_decision, 523 agents. Name the merges between ce917ad9 and 9579db71: git log --oneline --merges ce917ad9..9579db71". The previous hour measured 107 ms on near-identical code, so this may be one noisy sample (a build was running alongside). Executor's job to confirm or clear.
- **The heavy simulation tests were red on main** at last hour's check (since the stakes-line merge; not re-run this hour). A builder owes a follow-up fix.
- **The worktree reaper has 6 worktrees waiting for a decision** (465 worktrees, 308 local branches on disk). The reaper's own job; noted for visibility.
- Everything else is green. The live site serves the latest main (9579db71), automated checks run normally, the nightly background jobs run, and all 11 scheduled tasks are on time.
