# Briefing
**Generated:** 2026-09-20 15:56 local (13:56 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1479" in a chat.** There is no decision to make here — the direction on both staged designs is already yours. They need someone to open a session and write the plan, and no lane may start itself. The queue has one small fix on it this hour; that is not supply, it is a crumb.

- **[THR-1479: the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps, or misses, a meeting at a place by a time. Your direction from 12 September. Start here: it is the higher priority of the two, and the thing that was blocking it finished on the 12th.
- **[THR-1448: a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — your sentence from 10 September. Comes after.

The 26 items sitting in Todo cannot substitute. Nine are design tickets whose own bodies forbid an executor from picking them up, and fifteen are wayfinder tickets that never enter the queue. A design session is the only thing that converts any of it.

## Also waiting (3)

- **Finish the sitting: two encounters left** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Play [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). One question: is the integrated encounter experience acceptable? A yes charters the hub map — the supply this queue is short of. One blemish found this morning is *not* yet fixed: in conversation scenes a raw `{sphere_flavor}` placeholder prints on screen ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)) — read past it rather than marking it down.
- **Were the stops deliberate?** The 13–16 September silence still has no pause marker. The question is unchanged; details in user-actions.
- **Fog or witness:** should a stranger's sheet show consequences you watched happen, or should the familiarity gate keep hiding them? If you say nothing, it stays as it is.

Details and links for all three: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**1 ready, 0 in progress (starved).** Nothing parked, nothing stale.

- [THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver) (High) is the one ready item — the `{sphere_flavor}` leak above. Filed by the orchestrator at 15:32; the phrases it should print were written months ago and never wired to a caller. An ordinary fix, nothing in it for you.
- [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) (High) and [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (Medium) are still the only live design work, both unassigned, 8 and 10 days on the desk, both waiting on the chat above.
- 26 in Todo, unchanged.

## Health

- **Weekend quiet is normal, but two scheduled sweeps fell into it and were skipped rather than delayed.** This weekend's stop (Saturday 11:33 → Sunday 12:37) swallowed the backlog-grooming and project-hygiene slots, and both rolled on to their next date. Newest reports: [backlog-grooming 09-19](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-09-19.md), [weekly-hygiene 09-13](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-hygiene-2026-09-13.md). Catch-up behaviour is the machine's business, not yours — noted only as the visible cost of the stops.
- Everything else is green. The live site is on `83fc7e88`, the latest main. Scheduled workflows, automated checks and the auto-close job are all healthy; no PRs are waiting to merge; all nine scheduled lanes are on time; engine tick cost is steady (86 ms/tick, +16% on the 7-day median — inside the noise band); the stale-worktree cleanup ran at 15:40; the home checkout is clean and current.
