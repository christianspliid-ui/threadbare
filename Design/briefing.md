# Briefing
**Generated:** 2026-09-19 09:54 local (07:54 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1448" in a chat.** No new game work is queued. The plan you approved on 12 September is finished, and the one item that became ready this morning is a cleanup (see Queue). There is nothing to decide: you already set the direction for both staged designs. They only need someone to open a design session.

- **[THR-1448: a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)**, from your sentence on 10 September. Start here.
- **[THR-1479: the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)**: a mortal keeps or misses a meeting. From your direction on 12 September.

## Also waiting (3)

- **Finish the sitting: two encounters left** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Play [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). One question: is the integrated encounter experience acceptable?
- **Were the stops deliberate?** The scheduled lanes went silent for 66.9h (2026-09-13T18:59:56.000Z → 2026-09-16T13:55:55.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time. *(The evidence points to the machine being switched off. Details are in user-actions.)*
- **Fog or witness:** should a stranger's sheet show consequences you watched happen, or should the familiarity gate keep hiding them? If you say nothing, it stays as it is.

Details and links for all three: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**1 ready, 0 in progress (thin).** Nothing is parked or stale.

- [THR-1503](https://linear.app/threadbare/issue/THR-1503/processencounterconditions-gates-on-a-template-category-no-shipped) (Low). This morning's grooming ruled that the old automatic "lose a hard fight → Wounded/Terrified" rule, which has never fired, gets **deleted** rather than revived. Wounds come from each encounter's written ending instead. The pickup lane should take it at 10:01. *(An agent's call with a veto window: say so and it goes back for design.)*
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) and [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) are still In Design, waiting for the chat above.

## Health

- tick cost 92 ms/tick steady, 41% above the 7-day median (65, 78 rows since b115a0b1); top phase agent_decision, 498 agents. Name the merges between b115a0b1 and 3d39f728: git log --oneline --merges b115a0b1..3d39f728 *(This is the second high reading in a row, but it is the same commit, `3d39f728`, that measured 57 ms two hours ago. The code has not changed, so this points to machine load. An executor should look only if a quiet-machine run is also high.)*
- Everything else is green. The live site is on `3d39f728`, the latest main. No PRs are waiting to merge. Scheduled workflows are healthy, and all 9 scheduled tasks are on time. The cleanup script ran at 09:40 and flagged 3 worktrees for disposition.
