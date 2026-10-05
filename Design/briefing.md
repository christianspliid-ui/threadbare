# Briefing
**Generated:** 2026-10-05 12:58 local (10:58 UTC) · keep-work-flowing-cc

## The one thing

**Were you away, or was the app closed, last week?** On two weekday stretches no lane ran at all, and nothing recorded a pause. The longer one: **"The scheduled lanes went silent for 25h (2026-09-29T17:38:06.000Z → 2026-09-30T18:36:30.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time."** *— from the lane-silence check* In your time that was Tuesday ~19:30 to Wednesday ~20:20. The other stretch ran from Thursday 1 October ~17:00 to Friday 2 October ~13:45.

One reply covers both, for example "away both times" or "app was closed". If either one wasn't you, say so and it becomes a fault to chase. Details: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (2)

- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [A lead that reaches "knows where it lies" on a wonder can never become a delve](https://linear.app/threadbare/issue/THR-1702/a-lead-that-reaches-located-on-a-wonder-can-never-become-a-delve-and): **once a mortal has found a wonder, or a plain ruin no delve can enter, the search is over.** The place goes on their sheet as **"found it"** and they stop walking back to survey it. *The calls to veto:* say **"drop wonders from the visit"** if mortals should never visit wonders, or **"finding a wonder should give something"** to open that question. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb.md). Veto window closes ~08:45 Tuesday. *— from the design lane*
- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2): **every number and mark the round-2 testers pointed at now answers on hover**: essence rows, card price and odds marks, forecast words like "Doomed" and "Fated", the Reaches. Red and green lines gain a small **helps** / **hinders** word, and Quintessence leaves the top bar until it moves. *The calls to veto:* **"no tooltips in the meeting"** or **"labels, not hovers"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1713-readable-on-hover.md). Veto window closes ~02:41 Tuesday. *— from the design lane*
- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button stays on screen however many cards you're dealt.** Cards stay four per row; when they wrap, the button, your essence and the price · odds · setback key sit in a bar pinned to the bottom. *The call to veto:* **"five across"** or **"one row"**. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md). Veto window closes ~14:40 today. *— from the design lane*
- [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should): **a moment you set down now waits for you, however long the world runs.** The mortal's badge reads "waiting for you"; switching their thread to **Lives on** lets it go. *The call to veto:* say so if you meant "let it play out if I don't come back". [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md). Veto window closes ~20:40 today. *— from the design lane*

Say "veto found it", "veto readable hovers", "veto hand bar" or "veto set-down waits" to reverse any of these.

## Queue

**4 jobs ready** (healthy), **1 being built.** All four ready jobs are the design-lane decisions above, each waiting out its veto window.

- [Encounter summaries read like authoring prompts](https://linear.app/threadbare/issue/THR-1739/encounter-summaries-read-like-authoring-prompts-rewrite-designer-voice) (your Granary Riot finding) is finished as [#2239](https://github.com/christianspliid-ui/threadbare/pull/2239) and queued to merge, but still has a conflict with main (see Health).

Nothing new shipped in the last hour.

## Health

- **One finished pull request has a merge conflict: [#2239](https://github.com/christianspliid-ui/threadbare/pull/2239) (~2 hours, untouched since 10:57 your time).** GitHub won't start its checks until the conflict clears. Clearing it is the builder's unstick duty, not yours; the builder ran at 12:51 and should pick it up.
- **The heavy simulation tests are still red on the latest main (~5 hours)** ([workflow runs](https://github.com/christianspliid-ui/threadbare/actions)). A builder owes the follow-up.
- **The worktree reaper has 6 worktrees waiting for a decision** (475 worktrees, 314 local branches on disk). Noted for visibility.
- Everything else is green. Simulation speed is healthy (103 ms per tick, 4% below its weekly median of 107). The live site is current with main (`e2f765fc`), scheduled tasks are on time, and the reaper last ran at 12:40.
