# Briefing
**Generated:** 2026-09-20 16:56 local (14:56 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1479" in a chat.** There is no decision in this — the direction on both staged designs is already yours. They need someone to open a session and write the plan, and no lane may start itself.

**Since the last brief the shelf emptied.** The one small fix that was sitting there an hour ago has been claimed and is in a pull request. Nothing is waiting to be picked up. When the executor finishes, it has nothing to pick up next.

- **[THR-1479: the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps, or misses, a meeting at a place by a time. Your direction from 12 September. Start here: it is the higher priority of the two, and the thing that was blocking it finished on the 12th.
- **[THR-1448: a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — your sentence from 10 September. Comes after.

The 26 items in Todo cannot substitute. Nine are design tickets whose own bodies forbid an executor from picking them up; fifteen are wayfinder tickets that never enter the queue. A design session is the only thing that converts any of it.

## Also waiting (3)

- **Finish the sitting: two encounters left** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Play [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). One question: is the integrated encounter experience acceptable? A yes charters the hub map — the supply this queue is short of. The known blemish is still on screen: in conversation scenes a raw `{sphere_flavor}` placeholder prints ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)). A fix is written and in review but has not passed its checks yet, so read past it rather than marking it down.
- **Were the stops deliberate?** The 13–16 September silence still has no pause marker. The question is unchanged; details in user-actions.
- **Fog or witness:** should a stranger's sheet show consequences you watched happen, or should the familiarity gate keep hiding them? If you say nothing, it stays as it is.

Details and links for all three: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**0 ready, 1 in progress (starved).** Nothing parked, nothing stale.

- [THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver) (High) — the `{sphere_flavor}` leak above. Filed 15:32 yesterday evening, claimed at 16:01, now open as [PR #1968](https://github.com/christianspliid-ui/threadbare/pull/1968). An ordinary fix; nothing in it for you.
- [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) (High) and [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (Medium) remain the only live design work — both unassigned, 8 and 10 days on the desk, both waiting on the chat above.
- 26 in Todo, unchanged.

## Health

- **[PR #1968](https://github.com/christianspliid-ui/threadbare/pull/1968) has a failing check and will not merge until it is fixed.** It is armed to merge on green, so it reads as shipped everywhere except the check itself. A session needs to read the failure and push a fix — that is the machine's job, not yours. Noted here because it is the only thing on the board.
- **Weekend quiet, as expected.** The lanes stopped Saturday 11:33 → Sunday 12:37 local and resumed together. Normal by your own ruling; recorded only so the gap is visible.
- Everything else is green. The live site is on `83fc7e88`, the latest main. Scheduled workflows, automated checks and the auto-close job are all healthy; all nine scheduled lanes are on time; engine tick cost is steady (82 ms/tick, +10% on the 7-day median — inside the noise band); the stale-worktree cleanup ran at 16:40; the home checkout is clean and current.
