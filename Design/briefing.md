# Briefing
**Generated:** 2026-09-18 20:55 local (18:55 UTC) · keep-work-flowing-cc

## The one thing

**Say "design THR-1448" in a chat.** The build queue is down to four small items (below) — tidy-ups and tooling fixes, a few hours of work. After them the machine has no game work it may start on its own; the next real stretch needs a plan, and a plan needs your go-ahead to open a design session. The direction on both staged designs is already yours; no decision is owed.

- **[THR-1448 — a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — your sentence from 10 September. Start here.
- **[THR-1479 — the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — a mortal keeps or misses a meeting. Your direction from 12 September.

## Also waiting (4)

- **Finish the sitting — two encounters left** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)): [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) and [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) — one question: is the integrated encounter experience acceptable?
- **Were the stops deliberate?** The scheduled lanes went silent for 66.9h (2026-09-13T18:59:56.000Z → 2026-09-16T13:55:55.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time. *(The evidence says the machine was off; see user-actions.)*
- **One call you can veto** — *from daily-backlog-grooming:* the six unused tags in [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author) will be **deleted**. Silence lets it stand.
- **Fog or witness** — should a stranger's sheet show consequences you personally watched happen, or does the familiarity gate stay honest? Silence leaves it as-is.

Detail and links for all four: [`Design/user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Healthy — 4 ready, 0 in progress.** No parked or stale items; THR-1448 and THR-1479 still sit in In Design. [THR-1514](https://linear.app/threadbare/issue/THR-1514/undertaking-live-proof-and-content-model-census-decide-seed) shipped this hour.

- [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author) (Low) — delete the six unused tags.
- [THR-1515](https://linear.app/threadbare/issue/THR-1515/catalyst-families-have-no-member-for-a-hamlet-or-the-wild-a-settlement) (Low) — follow-up from THR-1511: works finished outside a town still have nowhere for their encounter to land.
- [THR-1512](https://linear.app/threadbare/issue/THR-1512/retro-draft-derives-its-period-from-the-newest-committed-retro-report), [THR-1513](https://linear.app/threadbare/issue/THR-1513/classifydiffs-browser-verify-reminder-falls-back-to-the-working-tree) (Low) — two tooling fixes filed by today's retro.

## Health

All green. Deploy live on `e764e80b` (THR-1514), CI and scheduled workflows healthy, no PRs waiting, all 9 scheduled tasks on time, tick cost 76 ms/tick (+14% vs the 7-day median — under the 25% line). Home tree: `.claude/settings.local.json` carries a harmless local edit; main is current.
