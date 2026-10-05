# Briefing
**Generated:** 2026-10-05 02:58 local (00:58 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2): **every number and mark the round-2 testers pointed at now answers on hover**: essence rows, card price and odds marks, forecast words like "Doomed" and "Fated", the Reaches. Red and green lines gain a small **helps** / **hinders** word, and Quintessence leaves the top bar until it moves. *The calls to veto:* say **"no tooltips in the meeting"** to keep Meet The First free of hovers, or **"labels, not hovers"** for always-visible words. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1713-readable-on-hover.md). Veto window closes ~02:41 Tuesday. *— from the design lane*
- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says): **after Ascend, "Reach Down" is on screen at once, and the bond's own button, *"Let them walk"*, starts time.** *The call to veto:* say so if you'd rather the world start on its own after the bond. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md). Veto window closes ~08:45 Monday. *— from the design lane*
- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button stays on screen however many cards you're dealt.** Cards stay four per row at the size you approved; when they wrap, the button, your essence and the price · odds · setback key sit in a bar pinned to the bottom. *The call to veto:* say **"five across"** or **"one row"** if you'd rather change your four-per-row rule. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md). Veto window closes ~14:40 Monday. *— from the design lane*
- [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should): **a moment you set down now waits for you, however long the world runs.** The mortal stands still in that moment, their badge reads "waiting for you", and it never plays out by itself or pops back up. Switching their thread to **Lives on** lets it go. *The call to veto:* say so if you meant minimise as "I'll come back if I can, otherwise let it play out", which is a one-line switch. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md). Veto window closes ~20:40 Monday. *— from the design lane*

Say "veto readable hovers", "veto arrival", "veto hand bar" or "veto set-down waits" to reverse any of these. The fair-draw veto window closed at 02:45 tonight with no veto, so that decision stands.

## Queue

**4 jobs ready** (healthy), **1 being built.** All four ready jobs wait on the veto windows above (the first opens ~08:45 Monday).

- [THR-1687, the fair draw for experts](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert), was picked up by the builder at 02:51, minutes after its veto window closed. It finishes the held pull request [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180).
- [THR-1716](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says) still shows as assigned while Ready (last touched 02:31). Most likely a pickup run that backed off for the veto window; the next pickup run after ~08:45 sorts it out.

## Health

- **The heavy simulation tests are red on main**, now ~9 h. A builder owes a fix, not you.
- **The worktree reaper has 6 worktrees waiting for a decision** (473 worktrees, 319 local branches on disk; reaper ran 02:43). Noted for visibility.
- Everything else is green. Simulation speed is inside its normal band (142 ms per tick, 23% above its weekly median of 115; the warning line is 25%). The live site is current (only docs changed since the last publish), automated checks run normally, and all 11 scheduled tasks are on time.
