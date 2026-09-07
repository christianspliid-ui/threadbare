# Undertakings driver — day 1

**2026-09-07 · design + execution, alternating · map [THR-1396](https://linear.app/threadbare/issue/THR-1396) · project Thematic Pressure & Living World**

Every scheduled routine paused; one autonomous driver acting as the whole delivery machine for the wayfinder map, session types alternated and never mixed.

## Design sessions

- **[THR-1402](https://linear.app/threadbare/issue/THR-1402) — the two-seed census, closed.** Re-measured on `main` with board refusals tallied per cell: the five "unwanted" cells were motive-starved (`no_motive` 51–237 refusals per seed) or never walked — none retire (veto: *"retire the five"*). Calibration (multi-tick projects finished 3 of 63), the lair elites and the item tier decided on [THR-1403](https://linear.app/threadbare/issue/THR-1403).
- **[THR-1435](https://linear.app/threadbare/issue/THR-1435) — the seeded world against the systems, closed** with [the audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-08-thr-1435-seeded-world-vs-systems.md) ([PR #1845](https://github.com/christianspliid-ui/threadbare/pull/1845)): fourteen protagonists among 476 · 620 mortals; nothing held, traded, owed or known at tick 0; territory round-robin. Two executor tickets with plan docs ([PR #1846](https://github.com/christianspliid-ui/threadbare/pull/1846), intent-judge Allow, three auditors PASS): [THR-1436](https://linear.app/threadbare/issue/THR-1436) (six registry ≠ writer disagreements) and [THR-1437](https://linear.app/threadbare/issue/THR-1437) (worldgen seeds the living world behind thirteen named constants, three passes provisional with veto handles).

## Execution sessions

- **[THR-1430](https://linear.app/threadbare/issue/THR-1430)** — rings and the plot: merged from the pre-pause executor's [PR #1844](https://github.com/christianspliid-ui/threadbare/pull/1844).
- **[THR-1432](https://linear.app/threadbare/issue/THR-1432) — a mortal's work casts omens** ([PR #1847](https://github.com/christianspliid-ui/threadbare/pull/1847)): the omen agenda reads the outcome nodes harm leaves behind; the receipt gains the `undertaking` kind; Omens `READS` all ten live-touched subsystems. Measured, not wished: the Done-when's "tick 12" is tick 40 under today's calibration.
- **[THR-1433](https://linear.app/threadbare/issue/THR-1433) — one rule for reading a mortal's mind** ([PR #1848](https://github.com/christianspliid-ui/threadbare/pull/1848)): `canReadIntention` through familiarity, a followed mortal's mark, or a followed network; the intention line on the sheet; the plot a secret. Browser-proved on a stranger.
- **[THR-1434](https://linear.app/threadbare/issue/THR-1434) — what the player sees of a mortal's work** ([PR #1849](https://github.com/christianspliid-ui/threadbare/pull/1849)): the Undertakings codex section (49 cards from the registry and the grid's notes, *who tends to do it* derived under the division rule), the roster's doing-line in words, the ledger naming each deed by verb and object with the object linked. Browser-proved on the codex, a roster of four and a stranger's ledger.
- **[THR-1436](https://linear.app/threadbare/issue/THR-1436) — the registry reads the edges the world writes** ([PR #1850](https://github.com/christianspliid-ui/threadbare/pull/1850), auto-merge armed): six object types read ownership through the writers' edges — a faction's holder is its derived leader, a companion is held through `accompanies`, a condition object is one mortal's borne edge (the cure lifts one wound, not every bearer's, and is signed like the blessing), a standing is one ordered pair from `reputation_with` or `relates_to`, catalog templates are not items, `create × Route` mints the node the object is. `npm run census:ownership`: faction owned 0 → 15 · 16, standing objects 0 → 56 · 59, item objects ~130 → 8 · 9. Found on the way: a `relates_to` edge written with no id.

## Where the map stands at day's end

Shipped today: THR-1430, 1432, 1433, 1434, 1436 (pending merge). Queue in order: [THR-1403](https://linear.app/threadbare/issue/THR-1403) (the flip — mutexed behind THR-1436's merge; five folded-in decisions and four found-on-the-way semantics recorded on the ticket) → [THR-1437](https://linear.app/threadbare/issue/THR-1437) (worldgen seeds the living world). Bands not yet authored: people-things, yield.
