# Briefing
**Generated:** 2026-09-18 18:55 local (16:55 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1448" in a chat.** The build queue is no longer empty — the morning grooming run put two small items back on the shelf (below) — but those are a few hours of work, and after them the machine has nothing it may start on its own. The next real stretch of game work needs a plan, and a plan needs your go-ahead to start a design session. The direction on both staged designs is already yours; no decision is owed.

- **[THR-1448 — a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — your sentence from 10 September. Start here.
- **[THR-1479 — the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps or misses a meeting. Your direction from 12 September.

## Also waiting (4)

- **Finish the sitting — two encounters left** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)): [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) — one question: is the integrated encounter experience acceptable?
- **Were the stops deliberate?** The scheduled lanes went silent for 66.9h (2026-09-13T18:59:56.000Z → 2026-09-16T13:55:55.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time. *(Also today: tb-orchestrator has not run since 2026-09-18T00:27:15.126Z — 16+ hourly slots behind, while tb-opus-pickup kept firing. The lane is stalled, not idle. — The evidence says the machine was off; see user-actions.)*
- **Two calls you can veto** — *from daily-backlog-grooming:* the six unused tags in [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author) will be **deleted**; in [THR-1511](https://linear.app/threadbare/issue/THR-1511/undertaking-catalysts-wither-where-the-actor-stands-every-cell) a finished work's follow-up encounter will be **offered at the town the work touched**, not wherever the mortal stands. Silence lets both stand.
- **Fog or witness** — should a stranger's sheet show consequences you personally watched happen, or does the familiarity gate stay honest? Silence leaves it as-is.

Detail and links for all four: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Healthy — 2 ready, 0 in progress.** Both promoted by grooming at 18:48 today; parallel-safe.

- [THR-1511](https://linear.app/threadbare/issue/THR-1511/undertaking-catalysts-wither-where-the-actor-stands-every-cell) (Medium, content+engine) — recommended next pickup; the hourly pickup lane's next slot is 19:00.
- [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author) (Low, mechanical sunset).
- No parked or stale items. THR-1448 and THR-1479 still sit in In Design.

## Health

- **Machine was down ~02:55 → 18:44 local today** (third stop this week). The Windows cleanup task last ran at 02:40, and tb-orchestrator's "stalled" verdict is the same gap — its next slot is 19:26. Nothing broken on the lane side.
- Home tree: `.claude/settings.local.json` has a local edit (harmless local config; main is current).
- Everything else green: deploy live on `049dac50`, CI and scheduled workflows healthy, no PRs waiting, tick cost 72 ms/tick (+9% vs median).
