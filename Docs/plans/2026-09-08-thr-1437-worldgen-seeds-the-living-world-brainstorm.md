# Worldgen seeds what the systems need — Brainstorm Companion

**Plan:** `Docs/plans/2026-09-08-thr-1437-worldgen-seeds-the-living-world.md` · **Issue:** THR-1437 · **Written alongside, 2026-09-08**

## Considered alternatives

1. **Widen the aperture instead of the seed** — let notable mortals carry undertakings so the 459–603 ambient NPCs supply the work. Deferred, not rejected: that is [THR-1348](https://linear.app/threadbare/issue/THR-1348)'s three-reading fork, explicitly "not the executor's to settle", and it changes per-tick cost in a way that must be measured. Raising the seed count is a constant the delegation covers; the aperture is a rule.
2. **Seed everything generously** (40 protagonists, routes between every settlement pair, a freehold for everyone). Rejected — the brief says conservative, the tick cost is unmeasured, and every constant here can be raised without a code change once it is.
3. **Seed Companies, Networks and Companions.** Rejected by the standing rule *never seed a kind whose band has not shipped its shape*: networks are THR-1430's (its PR merged during this design session but the cell census has not run on it), companies form organically at 13–17 per 150 ticks, companions are story-minted.
4. **Seed `reputation_with` edges for Standing.** Rejected — THR-1436 makes `relates_to` a Standing object, and worldgen already writes 56 · 59 of those; a second edge per pair would be a second truth.
5. **Seed quarrels as `grudge` provenance** so the plot has targets on day one. Rejected — a killing licensed by a quarrel nobody saw contradicts THR-1383's seen-harm rule; `rivalry` provenance licenses counter-play on things and leaves the plot to earned grudges.
6. **Territory by nearest faction home regardless of culture.** Rejected — a capital controlled by a foreign faction reads as a conquest the chronicle never told; culture first, distance second.
7. **A `worldgen_seeded` trace category.** Rejected — worldgen runs before the ring buffer is read by anything; a console line plus a re-runnable census script is inspectable and cheaper.

## Tensions surfaced

- **A living world vs. a legible start.** More protagonists means more moments and more attention competition; the attention pool was tuned against ~14–17. The kill criterion bounds tick cost, not attention — the roster's doing-line (THR-1434) is what will show whether 24 reads as alive or as noise. Recorded for the digest.
- **Starting history vs. earned history.** Quarrels and marks at tick 0 are history the world began with. The provisional flag keeps that a decision Christian can reverse with one word.
- **Determinism vs. reuse.** Reusing `createTradeRoute`, `grantHolding`, `instantiateReward`, `writeGrudge`, `mintLeverageMark`, `spawnArmy` means the seeded objects are byte-identical in shape to in-run ones (every reader works), at the price of ids that embed tick `0` — fine, and tested by the double build.

## Vision premises invoked

- `00-north-star.md` — choices accumulate into a world the player has opinions about; a world that starts empty has nothing to have opinions about in the first hour.
- `02-non-negotiables.md` §1 (the god is not the protagonist — nothing seeded is the god's), §4 (graph), §6 (additive: one mode constant guards the one retarget).
- `03-design-tensions.md` §5 (the dashboard failure — more protagonists must not become a list).
