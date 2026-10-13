---
lane: tb-design-lane
run: 2026-10-13e
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-13 (run e, ~19:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Master work reaches masters' boards](https://linear.app/threadbare/issue/THR-1757/master-work-reaches-masters-boards-the-caps-shortlist-drops-it-4-times) — **the best craftsmen get more work worthy of them, not a rigged shortlist.**
  - **The problem.** A town's best smith or best scholar rarely takes on master-level work. The work exists and is nearby. But each mortal weighs only a short list of options, picked fairly from about 190 kinds of encounter, and each craft has just one master-level encounter, so it rarely makes the list. Today it reaches a master's shortlist about 1 time in 7. A week ago it was 1 in 5: other new content has crowded it out.
  - **The choice.** Write more master encounters, in batches of eight (one per craft), and measure after each batch. The alternative was to reserve a shortlist slot for each mortal's own level. That was turned down because the game already ruled (on 1 Oct) that what a mortal *prefers* is decided when they weigh options, never by rigging the shortlist. A guaranteed slot would also make masters stop sometimes taking the easy job because it pays.
  - **The pace.** Up to three batches (24 encounters), stopping as soon as masters take on harder work than experts. Then a pause to check whether the batches are keeping ahead of the crowding before writing more. Each batch takes about two hours to build.
  - **Links:** [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-13-thr-1757-master-work-reaches-masters.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-13-thr-1757-master-work-reaches-masters-brainstorm.md), [today's measurement](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/master-band-2026-10-13-thr1757.txt).
  - Building waits until 21:30 on Wednesday 14 Oct.
  - *To veto, say:* **"masters should always see work worthy of them"** (then it goes into the story as commissions that seek them out) or **"don't write more master encounters"**.

## Work

- **Why a plan doc.** Ready for Dev held 3 non-Deferral items, below the floor of 4. This was the oldest workable candidate that rests on no lane decision younger than 24 hours. Others were skipped: [Places founded during play take no culture](https://linear.app/threadbare/issue/THR-1839/places-founded-during-play-take-no-culture-a-hamlet-founded-at-tick-200) rests on this morning's people-and-towns decision. [The world remembers](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with) is blocked by the god-card plan. [No non-human cast](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor) still has only one hunt encounter, and its own note says to wait for a second.
- **Measured before deciding.** The master-band reader was re-run on today's `main` (seeds 42/99/7, 120 ticks), together with the keep-all ceiling probe. Master work is on 13.9% of master shortlists (was 19.5%). Masters choose it 6.0% of the time. The ceiling, if every master entry were kept, is 53.4%. Masters out-attempt experts on seed 7 only; seed 99 misses by 0.001.
- **Gates.** Intent judge: **Allow**. Its two gaps were fixed before commit: ticket placeholders, and a floor/fail-soft contradiction. NFP, three-pillar and Vision audits: all **pass with notes**. `lint:plan-doc` passed, `check:generated-freshness` OK, `check:impediment-ids` OK.
- **Merged:** [plan-doc PR #2358](https://github.com/christianspliid-ui/threadbare/pull/2358). The first attempt, [#2357](https://github.com/christianspliid-ui/threadbare/pull/2357), was closed unmerged because its branch name carried the ticket id. It was re-opened from an id-free branch.
- **Handed off:** [Master work reaches masters' boards](https://linear.app/threadbare/issue/THR-1757/master-work-reaches-masters-boards-the-caps-shortlist-drops-it-4-times) is in Ready for Dev with the coordination block and `Claimable from: 2026-10-14T19:30:00Z`.
- **Filed (Todo, blocked in sequence):** [Master everyday batch 3](https://linear.app/threadbare/issue/THR-1840/master-everyday-batch-3-eight-more-master-encounters-one-per-reach), [Master everyday batch 4](https://linear.app/threadbare/issue/THR-1841/master-everyday-batch-4-eight-more-master-encounters-one-per-reach), and [Master-work checkpoint after batch 4](https://linear.app/threadbare/issue/THR-1842/master-work-checkpoint-after-batch-4-continue-master-content-measure-a), which goes to the design lane.

## Escalations

None.
