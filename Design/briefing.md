# Briefing
**Generated:** 2026-09-20 18:57 local (16:57 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1479" in a chat.** — [Appointment primitive: a mortal keeps or misses a meeting at a place by a time](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)

No decision is owed. The direction is already yours, from 12 September; its blocker finished on the 12th; the ticket carries its own connectivity table so it cannot ship dead. What is missing is a session to write the plan doc, and no lane may start itself.

This is the eighth day it has waited, and it is now the only thing standing between the builders and work. The build queue holds exactly one job, and that job is a test repair — it lets *finished* work land, it does not create new work. The 26 Todo items cannot fill the gap: every one of them declines for the same reason, which is that it needs design first.

## Also waiting (3)

- **[THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)** — two encounters left in the sitting you started 12 September; a "yes" there charters the hub map, which is the supply the queue is short of. One blemish is still on screen — see the note in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **Were the stops deliberate?** — every local lane stopped Sun 13 → Wed 16 September (~67h) and twice more that week, with no pause marker. The evidence says the machine was off, not that a lane broke. Silence reads as "deliberate."
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter give them, or does the familiarity fog stay honest? Silence leaves it as-is.

## Queue

**Starved — 1 ready, 1 in dev.** The single ready job is [THR-1517](https://linear.app/threadbare/issue/THR-1517/the-multi-tick-arms-in-orchestratortestts-have-no-explicit-timeout-and) (High, filed today by the orchestrator, unassigned): the orchestrator test's multi-tick arms have no explicit timeout and now run 5.2–5.4s against a 5000ms default, so finished PRs go red on a stopwatch rather than a defect.

[THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver) is the one item in dev, claimed and not parked. Nothing is stale; nothing is parked.

## Health

- **[PR #1968](https://github.com/christianspliid-ui/threadbare/pull/1968) is armed but cannot merge** — 1274 of 1275 test files pass; the one failure is `orchestrator.test.ts > multi-tick simulation reaches doom expiry`, the exact stopwatch THR-1517 describes. Auto-merge has been armed since 14:19 UTC and will never fire. This is the fix for the `{sphere_flavor}` blemish on your review screen, held up by a timeout rather than by anything wrong with it. A session's job, not yours: land THR-1517, then this merges on its own.
- **Lane silence** — a 25h weekend gap (Sat 09:33 → Sun 10:37 UTC) is noted and declined per your "overnight and weekend quiet is normal" ruling. The older weekday gaps remain the open ask above.
- Deploy, scheduled jobs, post-merge CI, task heartbeats, and the stale-git reaper are all green. Tick cost is 86 ms/tick steady, 14% above the 7-day median — inside tolerance, no action.
