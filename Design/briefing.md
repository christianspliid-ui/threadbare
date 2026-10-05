# Briefing
**Generated:** 2026-10-05 08:58 local (06:58 UTC) · keep-work-flowing-cc

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

**6 jobs ready** (healthy), **3 being built.** Four of the six wait on the veto windows above; the other two are fresh follow-ups from this morning's stakes work: [encounter summaries read like authoring prompts](https://linear.app/threadbare/issue/THR-1739/encounter-summaries-read-like-authoring-prompts-rewrite-designer-voice) (your Granary Riot finding) and [two encounters tell different endings in different places](https://linear.app/threadbare/issue/THR-1741/two-encounters-tell-a-different-ending-in-different-places-tend-to).

- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says) is being built now. Its veto window closed at 08:45 with no veto; live edits in its worktree as of 08:55.
- [A mortal with a promise starts a two-step job it can't finish](https://linear.app/threadbare/issue/THR-1737/a-departing-mortal-starts-a-two-step-encounter-and-misses-its) is finished as [#2235](https://github.com/christianspliid-ui/threadbare/pull/2235) and queued to merge, but has a conflict with main (see Health).
- [Measuring why mortals still pick work outside the "win about half the time" window](https://linear.app/threadbare/issue/THR-1689/in-window-share-sits-at-045-even-with-the-shortlist-fixed-measure) is finished as [#2233](https://github.com/christianspliid-ui/threadbare/pull/2233), also stuck on a conflict.

Shipped since the last brief: [stakes on every encounter](https://linear.app/threadbare/issue/THR-1728/author-stakes-for-every-encounter-template-and-make-the-stakes-line) ([#2234](https://github.com/christianspliid-ui/threadbare/pull/2234)) and the [raw `{cast:drover}` text fix](https://linear.app/threadbare/issue/THR-1738/the-encounter-test-panel-shows-castdrover-literally-carryover-factor) ([#2236](https://github.com/christianspliid-ui/threadbare/pull/2236)).

## Health

- **Two finished pull requests have a merge conflict: [#2233](https://github.com/christianspliid-ui/threadbare/pull/2233) (~2 hours) and [#2235](https://github.com/christianspliid-ui/threadbare/pull/2235) (~45 min).** GitHub isn't running their checks either. Both are queued to merge once the conflict clears. Clearing it is the builder's unstick duty, not yours.
- **The heavy simulation tests have now failed on the last three main merges** ([latest run](https://github.com/christianspliid-ui/threadbare/actions/runs/37273155284)). Last hour it was one test at 5.06 s against a 5 s limit; now two tests time out (6.1 s and 17.7 s). That looks less like a flake and more like a slowdown in those tests. A builder owes the follow-up.
- **The worktree reaper has 6 worktrees waiting for a decision** (472 worktrees, 310 local branches on disk). Noted for visibility.
- Everything else is green. Simulation speed is healthy (105 ms per tick, 4% below its weekly median of 109). The live site is current with main, scheduled tasks are on time, and the reaper last ran at 08:40.
