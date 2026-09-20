# Briefing
**Generated:** 2026-09-20 12:57 local (10:57 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1479" in a chat.** The build queue is now completely empty — nothing ready, nothing in progress — and the last piece of work finished 25 hours ago. There is no decision here: you set the direction on both staged designs yourself. They need someone to open a session and write the plan, and no lane may start itself.

- **[THR-1479: the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps, or misses, a meeting at a place by a time. Your direction from 12 September. Start here: it is the higher priority of the two, and the thing that was blocking it finished on the 12th.
- **[THR-1448: a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — your sentence from 10 September. Comes after.

The 26 items sitting in Todo cannot substitute. Nine of them are design tickets whose own bodies forbid an executor from picking them up. A design session is the only thing that converts any of it.

## Also waiting (3)

- **Finish the sitting: two encounters left** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Play [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). One question: is the integrated encounter experience acceptable? A yes charters the hub map — which is the supply this empty queue is short of.
- **Were the stops deliberate?** The 13–16 September silence still has no pause marker. Unchanged from yesterday; the evidence still points at the machine being off. Details in user-actions.
- **Fog or witness:** should a stranger's sheet show consequences you watched happen, or should the familiarity gate keep hiding them? If you say nothing, it stays as it is.

Details and links for all three: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**0 ready, 0 in progress, 0 in implementation planning (starved).** Nothing is parked, nothing is stale — there is nothing there at all. Last completion was [THR-1503](https://linear.app/threadbare/issue/THR-1503) at 09:13 yesterday, 25 hours ago.

- [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) (High) and [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (Medium) are the only live design work, both unassigned, 8 and 9 days on the desk, both waiting on the chat above.
- 26 in Todo, unchanged. 15 are wayfinder tickets that never enter this queue; the rest decline for reasons written into their own bodies.

## Health

- **The weekend quiet was the machine, not a broken lane.** Every scheduled lane stopped together Saturday 11:13 and restarted together Sunday 12:26, and all of them are firing normally again now. Nothing needs doing.
- **One probe cried wolf about that, and it is worth fixing.** The task-heartbeat check reported the build lane "stalled, not idle — 25+ slots behind, while keep-work-flowing-cc kept firing." The second half is false: this brief's own lane was dark for the same 25 hours and only came back with the machine. The witness test mistakes the run that notices the gap for a run that spanned it, so any whole-machine stop will read as a single-lane failure. Logged here for the weekly retro; no ticket filed, per the process-work throttle.
- Everything else is green. The live site is on `83fc7e88`, the latest main. Scheduled workflows, automated checks and the auto-close job are all healthy; no PRs are waiting to merge; the home checkout is clean and current.
- Tick cost 66 ms/tick steady, 11% **below** the 7-day median (74 ms, 53 rows). Yesterday's three high readings did point at machine load, as suspected — they have not recurred.
- The cleanup script ran 13 minutes ago and flagged 3 worktrees for disposition. Its own business, not yours.
