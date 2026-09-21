# Briefing
**Generated:** 2026-09-21 22:56 local (20:56 UTC) · keep-work-flowing-cc

## The one thing

**Play the last two encounters and say whether the integrated experience is acceptable** — [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with).

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish — the raw `{sphere_flavor}` placeholder that was printing in conversation scenes is fixed ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)), and the deploy probe confirms the live site is serving that commit this run.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map — encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when you're done.

*This is the lead for the first time because the ask that has led for eleven runs — "start the staged designs" — resolved itself in the last half hour. See Queue.*

## Also waiting (3)

- **May an unattended lane draft a design doc when the queue is starved and the direction is already settled?** — *from tb-orchestrator*. Your 6 August rule says this lane stages design work but never authors it, and the reason recorded was that the lane ran Sonnet. It runs Opus now, so the stated reason has expired. The orchestrator is explicit that the rule may still be right for a different reason — that you want a person in the room when the game's shape is decided. **Yes** → it drafts and you review a draft; **No** → it records the rule on its own terms and stops raising it. *Note added this run: the urgency behind it has gone — three plan docs merged tonight without it.*
- **Were the lane stops deliberate?** — four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. Only the Sunday→Monday episode is in question; weekend and overnight gaps are declined under your 8 August and 11 September rulings. Silence reads as "deliberate." A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Healthy — and it refilled itself tonight.** 2 Ready for Dev, 0 In Dev, 0 parked.

Three plan docs merged between 22:27 and 22:50 local, closing the design gap that three lanes had reported for eleven runs:

- [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) — appointment primitive · High · **Ready for Dev** · [plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-21-thr-1479-appointment-primitive.md)
- [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) — attention follows ambition · Medium · **Ready for Dev** · [plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-21-thr-1348-attention-follows-ambition.md)
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — held town as faction position · **Implementation Planning** · [plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-21-thr-1448-held-town-faction-position.md)

The executor lane fires at :11 hourly and has something to claim for the first time in three days. Nothing is blocked or stale.

## Health

All green. Deploy up to date (live at `df1cf66c`; tonight's commits are docs-only, so no rebuild was needed). CI, the three scheduled jobs and the three post-merge workflows are all passing. No PRs waiting to merge. All 9 enabled scheduled tasks on schedule; the worktree reaper ran 14 minutes ago. Tick cost 57 ms/tick steady — 25% *below* the 7-day median of 76.
