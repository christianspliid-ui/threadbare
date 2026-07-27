# Claude Code Prompts — Gold Reach Economic Systems

Copy-paste these in order. Wait for each phase to land before starting the next.

---

## Prompt 0: Design Governance (run first)

```
Apply the three edits in `2026-03-17-add-design-governance-to-skills.md`. All additive — no existing content modified. Then move both `2026-03-17-*.md` files from repo root into `Docs/plans/`.
```

---

## Prompt 1: Phase 1 — Foundation

```
Implement Phase 1 of the Gold Reach Economic Systems from the design doc at `Docs/plans/2026-03-17-gold-reach-economic-systems-design.md`.

Phase 1 has three deliverables:

1. **Settlement prosperity** — `prosperity`, `population`, `populationTrend`, and `populationLagTicks` properties on location nodes. New `phaseProsperity` orchestrator phase. New `prosperityResolver` for prose. `ProsperityTickTrace` for inspectability. All constants from the System 1 Constants table as named exports.

2. **Wealth on actors** — Formalize the existing transient wealth deltas into a 0–100 property with tier labels. `WealthDeltaTrace` with reason and provenance fields. All constants from the System 4 Constants table as named exports.

3. **Enriched `trades_with` edges** — Add `goodsType`, `established`, `lastTraded`, `controlledBy`, `threatened` properties. Additive — existing `volume` property stays. All constants from the System 2 Constants table as named exports.

Every system in the design has inline Constants, Tracing, and Fail-soft tables — follow them exactly. All constants go to named exports. All traces go through `emitTrace()`. All fail-soft patterns follow `if (!node) return []`.

The design doc has an NFP Compliance Summary at the bottom — all 7 priorities pass. Maintain that compliance in implementation. In particular: `gold.trade` is evolved in place (same template id, backward-compatible), not replaced.

Tests for everything. Run the full suite before committing. Follow Definition of Done.
```

---

## Prompt 2: Phase 2 — Locations & Encounters

```
Implement Phase 2 of the Gold Reach Economic Systems from `Docs/plans/2026-03-17-gold-reach-economic-systems-design.md`.

Phase 2 has three deliverables:

1. **Gold sublocations** — Implement the conditional sublocation predicate evaluator (currently stubbed with a TODO in sublocation.ts). Add Market District, Mine, Harbor, Warehouse, Counting House, Smuggler's Den, and Caravan Rest sublocation types. Spawn/dissolve based on prosperity thresholds and guild wealth. All constants from System 5 Constants table.

2. **Economic encounters** — 12 new encounter templates across the Gold sublocation types, following the specs in System 6. All encounter-specific constants from the System 6 Constants table. Market Day Festival uses PRNG for relationship formation (`MARKET_FESTIVAL_RELATIONSHIP_CHANCE`).

3. **Trade route decay** — Routes unused for `TRADE_ROUTE_FRESHNESS_WINDOW` ticks lose `TRADE_ROUTE_DECAY_RATE` volume per tick. At volume 0, edge is removed. Emit `trade_route_dissolved` summary trace on death. Follow System 2 fail-soft table.

All inline Constants, Tracing, and Fail-soft tables in the design must be followed exactly. NFP compliance must be maintained. Tests for everything. Follow Definition of Done.
```

---

## Prompt 3: Phase 3 — Guilds & Power

```
Implement Phase 3 of the Gold Reach Economic Systems from `Docs/plans/2026-03-17-gold-reach-economic-systems-design.md`.

Phase 3 has three deliverables:

1. **Guild generation** — During world seeding, spawn GUILD_SPAWN_COUNT_MIN to _MAX guild factions at town+ settlements. Guild type from dominant resource (PRNG tiebreaker when tied). Gold-heavy domain capabilities. Guild Hall sublocation on creation. All constants from System 3 Constants table. Follow System 3 fail-soft table (displaced guilds, missing resources).

2. **New Gold actions** — Negotiate Agreement (CREATE), Tax Trade Route (UPDATE), Break Agreement (DELETE). Agreements use the existing attachment system's `agreement` category. Break Agreement triggers `loyalty_treachery` value pair and costs reputation. Follow System 2 action specs.

3. **Wealth spending actions** — `gold.hire-mercenaries`, `gold.commission-assassination`, `gold.buy-influence`, `gold.fund-construction`. Each costs from the System 4 Constants table. Crossover tracing: spawned retainers/effects must reference the funding action's id in their `source` property. Wealth clamps to 0 on overspend (fail-soft).

All inline Constants, Tracing, and Fail-soft tables in the design must be followed exactly. NFP compliance must be maintained. Tests for everything. Follow Definition of Done.
```

---

## Prompt 4: Phase 4 — Dynamics (stretch)

```
Implement Phase 4 of the Gold Reach Economic Systems from `Docs/plans/2026-03-17-gold-reach-economic-systems-design.md`.

Phase 4 has three deliverables:

1. **Settlement promotion/demotion** — When prosperity stays above SETTLEMENT_PROMOTION_PROSPERITY for SETTLEMENT_PROMOTION_SUSTAIN_TICKS, promote hamlet→town→city. Below SETTLEMENT_DEMOTION_PROSPERITY for same duration, demote. Use `update_node` GraphOps. Emit `settlement_tier_change` trace. Generate chronicle entries.

2. **Monopoly action** — `gold.establish-monopoly`. Costs WEALTH_MONOPOLY_COST. Targets a resource type at a location. Success: exclusive control, increased wealth generation, decreased settlement prosperity. Generates strong negative sentiment. Narrative watch: must feel like a story beat, not a stat change.

3. **Economic AI tuning** — Review axiological weights so guilds and merchants create interesting emergent trade patterns. Verify that Gold-heavy factions naturally gravitate to trade actions, that wealthy agents spend wealth on crossover actions, and that the action selection pipeline produces varied and narratively interesting economic behavior. Tune constants if needed.

All NFP compliance must be maintained. Tests for everything. Follow Definition of Done.
```
