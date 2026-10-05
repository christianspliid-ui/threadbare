# Briefing
**Generated:** 2026-10-05 07:55 local (05:55 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2): **every number and mark the round-2 testers pointed at now answers on hover**: essence rows, card price and odds marks, forecast words like "Doomed" and "Fated", the Reaches. Red and green lines gain a small **helps** / **hinders** word, and Quintessence leaves the top bar until it moves. *The calls to veto:* say **"no tooltips in the meeting"** to keep Meet The First free of hovers, or **"labels, not hovers"** for always-visible words. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1713-readable-on-hover.md). Veto window closes ~02:41 Tuesday. *— from the design lane*
- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says): **after Ascend, "Reach Down" is on screen at once, and the bond's own button, *"Let them walk"*, starts time.** *The call to veto:* say so if you'd rather the world start on its own after the bond. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md). Veto window closes ~08:45 today. *— from the design lane*
- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button stays on screen however many cards you're dealt.** Cards stay four per row at the size you approved; when they wrap, the button, your essence and the price · odds · setback key sit in a bar pinned to the bottom. *The call to veto:* say **"five across"** or **"one row"** if you'd rather change your four-per-row rule. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md). Veto window closes ~14:40 today. *— from the design lane*
- [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should): **a moment you set down now waits for you, however long the world runs.** The mortal stands still in that moment, their badge reads "waiting for you", and it never plays out by itself or pops back up. Switching their thread to **Lives on** lets it go. *The call to veto:* say so if you meant minimise as "I'll come back if I can, otherwise let it play out", which is a one-line switch. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md). Veto window closes ~20:40 today. *— from the design lane*

Say "veto readable hovers", "veto arrival", "veto hand bar" or "veto set-down waits" to reverse any of these.

## Queue

**5 jobs ready** (healthy), **3 being built.** Four of the five wait on the veto windows above (the first closes ~08:45 today); the fifth is the small [raw `{cast:drover}` text bug](https://linear.app/threadbare/issue/THR-1738/the-encounter-test-panel-shows-castdrover-literally-carryover-factor).

- [Author stakes for every encounter](https://linear.app/threadbare/issue/THR-1728/author-stakes-for-every-encounter-template-and-make-the-stakes-line) (High) is being built since 06:48; its branch was pushed 17 minutes ago.
- [A mortal with a promise starts a two-step job it can't finish](https://linear.app/threadbare/issue/THR-1737/a-departing-mortal-starts-a-two-step-encounter-and-misses-its) is being built; pushed 4 minutes ago, with live edits in its worktree.
- [Measuring why mortals still pick work outside the "win about half the time" window](https://linear.app/threadbare/issue/THR-1689/in-window-share-sits-at-045-even-with-the-shortlist-fixed-measure) has its write-up up as [#2233](https://github.com/christianspliid-ui/threadbare/pull/2233), queued to merge, but nothing has moved on it for ~62 minutes (see Health).

## Health

- **[#2233](https://github.com/christianspliid-ui/threadbare/pull/2233) has a merge conflict and has sat ~1 hour**, so GitHub isn't running its checks either. It is queued to merge as soon as the conflict clears. Clearing it is the builder's unstick duty, not yours.
- **The heavy simulation tests are still red on the latest main** ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/37264571321)). Same single test as last hour, 5.06 s against a 5 s limit, and the suite went red then green earlier tonight. Most likely a timing flake; a builder owes the follow-up.
- **The worktree reaper has 6 worktrees waiting for a decision** (470 worktrees, 321 local branches on disk). Noted for visibility.
- Everything else is green. Simulation speed is healthy (106 ms per tick, 4% below its weekly median of 110). The live site is current with main, scheduled tasks are on time, and the reaper last ran at 07:40.
