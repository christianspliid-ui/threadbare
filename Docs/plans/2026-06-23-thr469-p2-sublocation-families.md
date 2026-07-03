# THR-469 P2 — Sublocation families for the 7 non-Gold reaches

**Parent program:** THR-469 (Cross-content variety & coverage program)
**Phase:** P2 (per the program roadmap: "Sublocation families for the 7 non-Gold reaches")
**Date:** 2026-06-23
**Status:** Design — splits into P2a (engine generalization, ready) + P2b (content authoring, blocked by P2a)

---

## The hole

`src/engine/phaseSublocations.ts` is literally titled "Gold Sublocations." It hard-codes `GOLD_SUBLOCATION_SPECS` (market-district, mine, harbor, warehouse, counting-house, smugglers-den, caravan-rest) and runs only that one family. **7 of 8 reaches have no conditional sublocation family** — a code-confirmed structural desert (THR-469 census). This both flattens the world (only economic/Gold places spawn sublocations) and starves location-gated encounter variety, because encounters that target `sublocation-type.*` only have Gold-reach hosts to attach to.

Per the program's coverage map: Iron→fortifications, Shadow→hideouts, Veil→arcane sites, Eye→watchposts, Heart→sanctuaries, Stone→quarries/halls, Star→shrines/observatories. ~5–7 families per reach.

## Thin-first split

Mirrors the THR-467 P0→P1 shape (foundation first, then content at scale):

- **P2a — Reach-agnostic sublocation phase + spec registry** (engine, mechanical). Generalize `phaseSublocations.ts` from Gold-only to a registry keyed by reach. Gold becomes the first registry entry; **behavior is byte-for-byte identical** after P2a (Gold specs unchanged, just relocated). No new content. This is the clean first executable unit and unblocks all authoring.
- **P2b — Author the 7 non-Gold reach families** (content, prose). ~5–7 `ConditionalSublocationSpec` entries per reach + concept-art registry entries + census re-run proving the deserts fill. Blocked by P2a.

---

## P2a — engine generalization (Ready for Codex)

### Engine

- Introduce `SUBLOCATION_FAMILIES: Record<ReachDomain, ConditionalSublocationSpec[]>` (or an array of `{ reach, specs }`). Move `GOLD_SUBLOCATION_SPECS` under `gold`; every other reach starts `[]`.
- `phaseSublocations` iterates all families instead of the single Gold array. The spawn/dissolve/predicate machinery is already generic (`evaluateConditionalPredicate`, `checkDissolutions`) — only the *source list* is hard-coded today.
- Keep `ConditionalSublocationSpec` shape unchanged (`sublocationTypeId`, `name`, `motivations`, `spawnPredicate`, `dissolvePredicate`, `eligibleSubtypes`). Add an optional `reach?: ReachDomain` for census tagging if not derivable from the registry key.
- Orchestrator call site (`phaseSublocations` import at orchestrator.ts:83) is unchanged — the phase signature stays the same.

### Content / UI

- N/A for P2a (no new content; no player-facing change — Gold sublocations spawn exactly as before).
- Debug: extend any sublocation debug read to report family-by-reach counts (supports P2b verification).

### Done when (P2a)

- `phaseSublocations` is registry-driven; Gold specs relocated, **30-tick CLI smoke shows identical Gold sublocation spawn behavior** vs main.
- Registry has all 8 reach keys (7 empty).
- `npx tsc --noEmit` clean; `npm test` green (or smoke-evidenced per the unstable-suite note); `npx vite build` succeeds.
- Census (`npm run` content-census) still parses sublocation families by reach.

### Coordination block (P2a — Codex handoff)

- **Parallel-safe with:** THR-475 (encounter surface foundation — disjoint files), all content-authoring work.
- **Mutex with:** none currently in flight on `phaseSublocations.ts` — verify before claiming.
- **Files to touch:** `src/engine/phaseSublocations.ts` (relocate + generalize), minimal orchestrator-side none. Optional debug read.
- **Done when:** checklist above.

---

## P2b — author the 7 reach families (Ready for Dev, blocked by P2a)

### Content

For each non-Gold reach, ~5–7 conditional sublocation specs following the Gold pattern (spawn predicate over location properties, dissolve predicate with hysteresis, eligible subtypes, axiological motivations). Reach themes (starter set — exact roster finalized at authoring against the census):

| Reach | Family theme | Example sublocation types |
|-------|--------------|---------------------------|
| Iron | Fortifications / war | gatehouse (exists), bastion, drill-yard, armory, siege-camp |
| Shadow | Hideouts / underworld | thieves-den, safehouse, black-market, dead-drop, fighting-pit |
| Veil | Arcane sites | warding-circle, scrying-pool, reliquary, threshold-gate |
| Eye | Watchposts / knowledge | watchtower, signal-beacon, scriptorium, augury-post |
| Heart | Sanctuaries / care | almshouse, healing-garden, hearth-hall, pilgrim-rest |
| Stone | Quarries / halls | quarry, great-hall, mason-yard, deep-cellar |
| Star | Shrines / observatories | observatory, star-shrine, oracle-cave, calendar-stone |

- Each new `sublocation-type.*` needs a concept-art registry entry in `src/data/sublocation-concept-art.ts` (the registry falls back gracefully, so this is quality not correctness).
- Predicates reuse existing location-property vocabulary (`prosperity`, `has_resource:*`, `is_coastal`, faction/guild presence, doom, sphere influence). Where a reach needs a property that doesn't exist yet, **flag it rather than invent** — do not add node types/properties without the load-bearing verification step.
- Hold the voice contract; names follow cultural-palette generation where applicable.

### Engine / UI

- Engine: N/A beyond P2a (families plug into the registry).
- UI: new sublocation types render through the existing sublocation surfaces; verify concept-art fallback and that they appear at `?view=game&seeded` / `?view=codex`.

### Done when (P2b)

- Each of the 7 non-Gold reaches has ≥5 sublocation specs in the registry.
- Concept-art entries present (or fallback verified) for each new type.
- **Census re-run shows the sublocation desert filled** (7 reaches now non-empty) — the measurement gate the program demands.
- 30-tick CLI smoke: non-Gold sublocations spawn in a seeded run (paste evidence).
- Browser artifact (1920×1080) showing a non-Gold sublocation in-game + `__DEBUG` family counts + console.

### Coordination block (P2b — CC handoff)

- **Suggested model:** opus-4-6 (content authoring / prose-adjacent naming + motivations) — matching `model:opus-4-6` label.
- **Parallel-safe with:** THR-475, encounter-authoring work that doesn't touch `phaseSublocations.ts`.
- **Mutex with:** P2a (same file) — **must land first** (`blockedBy`).
- **Files to touch:** `src/engine/phaseSublocations.ts` (add the 7 family arrays), `src/data/sublocation-concept-art.ts` (new entries).

---

## NFP compliance

| NFP | Status |
|-----|--------|
| 1 Tunability | PASS — predicates and thresholds are data, mirroring Gold's named constants. |
| 2 Inspectability | PASS — census reports family-by-reach; debug read added. |
| 3 Determinism | PASS — spawn uses the existing seeded `mulberry32` path. |
| 4 Fail-soft | PASS — missing concept art falls back; unknown property flagged not invented. |
| 5 Narrative | PASS — families are thematic, prose-named. |
| 6 Additive | PASS — Gold behavior preserved; new reaches are pure additions. |
| 7 Performance | PASS — same per-tick settlement scan, more specs; bounded by location count. |

## Coverage note

Per the program's open question (uniform vs weighted fill): recommend **weighted** — author deeper families for reaches the player encounters most at local scale, thinner for the rare long tail. Confirm against the census heatmap before P2b authoring; the census re-run is the gate.
