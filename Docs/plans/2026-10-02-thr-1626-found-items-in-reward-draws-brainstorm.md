# Brainstorm companion — found things in the reward draw (THR-1626)

Companion to `Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md`. Design lane, run 2026-10-02a. The alternatives weighed, the tensions, and why each call went the way it did.

## Where the share lives

- **A virtual "generated" candidate inside the pool.** Weight it at `share / (1 − share)` of the band's authored weight so half the band's mass is generated. Rejected: it changes every pool's size and the `content.query_*` candidate count, re-pins the shared-path test between the reward pool and the content resolver (`content-query-one-resolver-engine-and-gate`) for no player-visible gain, and needs the generated candidate's tags known *before* generating it.
- **After the pick (chosen).** The recipe still chooses band and theme; the generator stands in for a pick the recipe already made. Pool, roll order and traces untouched; share 0 is today exactly.
- **Before the pool, per draw.** Roll first, then either generate or draw. Rejected: the band would then have to come from the tier curve separately, duplicating `drawFromPool`'s job.

## What to do with the recipe's tag filter

Measured: almost every Storied recipe has one (`#knowledge`, `#heart`, `#gold` lead), and an unconstrained found item fits it 0–30% of the time.

- **Ignore the filter.** Half of a scholar's Storied rewards become swords and mounts. Rejected — the filter is the author's statement of what the work was about.
- **Generate unconstrained, retry until it fits.** Works for common tags, effectively never for `#knowledge` (1–5 in 60). Rejected as the whole answer; kept as the final fit check.
- **Tell the generator (chosen).** A static `coreTagReach` per core narrows core choice; a reach or sphere tag steers that draw; a fit check confirms. Additive: no `requiredTags`, no change.

## One core per family

`#knowledge`, `#divine`, `#stealth`, `#trade`, `#healing`, `#craft`, `#arcane` each have exactly one found core. At share 0.5 the knowledge family alone would make ~19 copies of *the book that should not be read* per world. The world's repeat decay cannot help with one candidate.

- **Accept it.** Rejected — anonymity through repetition is exactly what the THR-1236 ruling rejected free composition for.
- **Scale the share down by core count.** A smooth curve (share × min(1, cores/3)). Considered; rejected as harder to read and tune than a floor, with the same effect on the families that matter.
- **A floor of two cores (chosen),** plus **one new knowledge core** so the largest family is not shut out. Families with one core stay authored until someone authors a second; that is a content backlog, not a defect.

## Volume

At 0.5 the world gains ~35 found things per 150 ticks today, ~50–55 with the new core — against 3–4 masterworks. The ruling (2026-09-26) set the share without this number; the lane keeps the ruling and puts the number in front of Christian with the one constant that turns it. Considered and not done: lowering the share unilaterally (that would be re-deciding a delegated ruling without new evidence that it is wrong — the evidence is only that it is large).

## Tensions noted, not resolved here

- A found thing names the world's dead. With ~50 found things and ~10 dead notables, the hero repeat decay (`ITEM_GEN_HERO_REPEAT_DECAY = 0.35`) spreads them, but several items will name the same person. Could read as legend, could read as repetition; the census re-run reports it.
- The legacy encounter-progress reward block draws on its own; not touched (one-path rule), flagged for the executor.
- Mundane rewards (~240 per world) remain the bulk of what mortals carry; generating Mundane stays ruled out (THR-1236).
