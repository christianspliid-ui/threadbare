# Batch brief — pilot (6 undertakings)

**Drafted:** Claude (execution session), 2026-09-03 · **Approved:** pending — Christian, chat

> **lint_plan_doc:** exempt — a factory batch brief is an undertaking-pipeline artifact
> (Stage 0), not a dated design plan doc. It has no Engine pillar, constants table,
> tracing or fail-soft table to declare; the design decisions it runs under were
> ruled in the plan doc it links (THR-1300, 2026-09-02).

> Stage 0 of the undertaking factory (`.claude/skills/undertaking-pipeline/reference/batch-brief-format.md`; plan `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md` § Stage 0 and § The pilot batch). The grid as data: `.claude/skills/undertaking-pipeline/reference/kind-row-catalog.generated.md`.

## Why this batch

A followed mortal can lose things. Today the world lets a mortal *build* nine kinds of work and take back only some of them: nobody can burn down the granary a rival raised, and no court can be split from within. Every long work is safe once it stands, which makes the god's nudges toward a mortal's ambitions cheap — the worst that happens is the work stalls. After this batch a mortal's room can be razed, their faction can be sown with schism, their fields salted, their band bought out from under them, their spy network turned, and a road they opened widened by someone else's hand. The player sees it as a moment on the mortal they follow — *"loses the Deepset Granary to Oswen's sappers"* — and as a vendetta minted from it, because every destroy here writes the harm the grievance lane reads. That is the reactive loop getting its raw supply, which on the default seeds is zero (THR-1388).

## Grid cells

| kind | C | U | D |
|---|---|---|---|
| `sublocation` *(row opened by this batch)* | | | **slot 1** |
| `faction` *(row opened by this batch)* | | | **slot 2** |
| `place_location` | | | **slot 3** |
| `warband` | | | **slot 4** |
| `network` | | **slot 5** | |
| `trade_route` | | **slot 6** | |

Four D cells (the floor is two while THR-1388's zero stands), two U cells on rows that hold exactly one U today, no C cells. The two empty rows in the catalog open with their first destroy — the registry's own rule, and what the compiler enforces.

## Variance targets

- **Tier spread:** T1 ×1 (slot 5) · T2 ×3 (slots 1, 3, 6) · T3 ×2 (slots 2, 4). No tier more than three. ✓
- **Reach spread (primary):** iron, heart, star, shadow, shadow, gold. No reach more than twice. ✓
- **Families:** warlord-expansion, court-political, zealot-mission, underworld-network ×2, merchant-expansion. No family more than twice. ✓
- **Target subtypes:** a room, a faction, a hamlet or camp, a company, a city-tier seat, a route. No subtype more than twice. ✓
- **Harm classes:** four harm-capable templates — `property_destroyed` ×2, `network_severed`, `holding_seized`. ✓ (floor 2)
- **Motivations:** `mercy_ruthlessness` ×3, `honesty_cunning` ×3, `loyalty_ambition` ×2, `revelation_discretion` ×2, one each of `preservation_transformation`, `sacrifice_survival`, `asceticism_extravagance`, `tradition_novelty`. No pair more than three. ✓
- **Cast:** four templates declare a `must-persist` slot with an `identityRequirement` (slots 1, 2, 4, 5). ✓ (floor 3)
- **Remote:** none. ✓

## The mechanical fix, before any premise

Tier bands (`undertakingConstants.ts`): difficulty T1 0.35–0.6 · T2/T3 0.4–0.6; payoff T1 0.4–0.9 · T2 0.9–1.6 · T3 1.3–2.2. Every destroy carries the full `motiveGate` unless narrowed below, and `requiresLocation: false`, `canRunBeside: false`, `remote: false` unless stated.

- **slot 1 — `strategic_raze_the_works`** · `destroy` · `multi_tick_project` · kind `sublocation` **D** (opens the row: tier 2, ownable, lexicon `place`, object *a `location` node carrying `parentLocationId`, held by `owns`*) · `checkpointDifficulty 0.55` · `projectDuration 5` · `payoffValue 1.2` · `motivations ['mercy_ruthlessness', 'preservation_transformation']` · `targetRule { type: 'sublocation_type', subtypeIds: ['granary', 'warehouse', 'workshop', 'garrison', 'shrine'] }` — the board and the lever prefer a room someone *else* owns · family `warlord-expansion` · reach `iron 0.5, shadow 0.3, eye 0.2` · cast `$sapper` (actor, must-persist, mintRole `mercenary`, identity `{ axis: 'courage_prudence', pole: 'virtue', minStrength: 0.5 }`) · `creationEffects.onCritFailure: [spawn_npc 'witness', may-mint]` · `mutationHint { type: 'raze_sublocation' }` **(new hint — rides `razeHolding` then removes the node through the one removal funnel, so a bound stage severs loudly)** · `motiveGate` all four · `harmClass 'property_destroyed'`.
- **slot 2 — `strategic_sow_schism`** · `destroy` · `multi_tick_project` · kind `faction` **D** (opens the row: tier 3, not ownable, lexicon `band`, object *an `actor` node with `actorType: 'faction'` and its `member_of` roster*) · `checkpointDifficulty 0.5` · `projectDuration 8` · `payoffValue 1.6` · `motivations ['honesty_cunning', 'loyalty_ambition', 'revelation_discretion']` · `targetRule { type: 'faction' }` — a faction the actor does not belong to; the victim is its leader (the THR-1383 faction → leader routing) · family `court-political` · reach `heart 0.45, shadow 0.35, eye 0.2` · cast `$firebrand` (actor, must-persist, mintRole `agitator`, identity `{ axis: 'loyalty_ambition', pole: 'vice', minStrength: 0.5 }`) · `creationEffects.onAtCost: [spawn_npc 'informer', may-mint]` · `mutationHint { type: 'plant_schism', resolutionDelay: 6 }` **(new hint — rides `applyPlantSchism`; `phaseSchismResolution` performs the split it already knows how to perform)** · `motiveGate ['rivalry', 'contested_ambition', 'faction_war']` · `harmClass 'network_severed'`.
- **slot 3 — `strategic_salt_the_fields`** · `destroy` · `multi_tick_project` · kind `place_location` **D** (second destroy on the row) · `checkpointDifficulty 0.5` · `projectDuration 4` · `payoffValue 1.0` · `motivations ['sacrifice_survival', 'mercy_ruthlessness']` · `targetRule { type: 'location_subtype', subtypes: ['hamlet', 'camp'] }` · family `zealot-mission` · reach `star 0.45, iron 0.35, heart 0.2` · cast none · `creationEffects.onAdvance: [spawn_npc 'refugee', may-mint]` · `mutationHint { type: 'modify_location_property', property: 'prosperity', delta: -35, clamp: [0, 100] }` (shipped hint) · `motiveGate ['grudge', 'faction_war']` · `harmClass 'property_destroyed'`.
- **slot 4 — `strategic_break_the_band`** · `destroy` · `multi_tick_project` · kind `warband` **D** (second destroy on the row) · `checkpointDifficulty 0.55` · `projectDuration 5` · `payoffValue 1.5` · `motivations ['honesty_cunning', 'mercy_ruthlessness']` · `targetRule { type: 'group_node', groupKind: 'company', ownership: 'other_commander' }` · family `underworld-network` · reach `shadow 0.5, gold 0.3, heart 0.2` · cast `$turncoat` (actor, must-persist, mintRole `mercenary`, identity `{ axis: 'loyalty_ambition', pole: 'vice', minStrength: 0.4 }`) · `catalystEncounterIds ['encounter_desertion']` · `mutationHint { type: 'disband_group' }` (shipped hint) · `motiveGate ['rivalry', 'grudge', 'contested_ambition']` · `harmClass 'holding_seized'`.
- **slot 5 — `strategic_turn_the_network`** · `change` · `multi_tick_project` · kind `network` **U** (second update on the row) · `checkpointDifficulty 0.45` · `projectDuration 4` · `payoffValue 0.7` · `motivations ['honesty_cunning', 'revelation_discretion']` · `targetRule { type: 'location_subtype', subtypes: ['city', 'capital', 'town', 'port'] }` · family `underworld-network` · reach `shadow 0.5, eye 0.3, heart 0.2` · cast `$double` (actor, must-persist, mintRole `informant`, identity `{ axis: 'honesty_cunning', pole: 'vice', minStrength: 0.5 }`) · `creationEffects.onAtCost: [spawn_npc 'informer', may-mint]` · `mutationHint { type: 'record_intelligence', intelligenceType: 'network_turned' }` (shipped hint; the row's existing update uses the same shape) · no gate, no harm.
- **slot 6 — `strategic_widen_the_road`** · `change` · `multi_tick_project` · kind `trade_route` **U** (second update on the row) · `checkpointDifficulty 0.45` · `projectDuration 4` · `payoffValue 1.0` · `motivations ['asceticism_extravagance', 'loyalty_ambition', 'tradition_novelty']` · `targetRule { type: 'trade_route' }` · family `merchant-expansion` · reach `gold 0.5, iron 0.3, eye 0.2` · cast none · `creationEffects.onAdvance: [spawn_npc 'carter', may-mint]` · `mutationHint { type: 'modify_location_property', property: 'prosperity', delta: 15, clamp: [0, 100] }` on the route's far town (shipped hint; prosperity is read by every economic system) · no gate, no harm.

**Profiles (reachability):** each destroy is added to `revenge_track` (the vendetta ambition — a grievance must be able to reach for every one of these) and to the profile that already names its row's shipped destroy (slot 1 and 3 → the profile naming `strategic_raze_settlement`; slot 2 → the profile naming `strategic_sever_network`; slot 4 → the profile naming `strategic_suborn_warband`); the two updates go to the profile naming their row's shipped update (`strategic_extend_reach`, `strategic_extend_route`).

## Anchors the batch touches

- **Holdings** (`owns`, `razeHolding`) — slot 1 is the first work that takes a *room* back; the freehold the sublocation row grants becomes something that can be lost.
- **Faction topology** (`applyPlantSchism` → `phaseSchismResolution`) — slot 2 makes a schism something a mortal *does* rather than something the topology suffers.
- **The reactive loop** (THR-1383) — every destroy emits a culprit-carrying harm; the grievance lane mints vendettas from them. This is the supply THR-1388 measured as zero.
- **Companies and the mint valve** (slot 4; `disband_group`, must-persist mints through `BINDER_MINT_BUDGET_PER_TICK`).
- **Secrets & Favors** (slot 5, `strategicIntelligence`) and **the economy** (slots 3 and 6, `prosperity`).

## The two engine seams this batch needs

Two mutation hints do not exist yet: `raze_sublocation` and `plant_schism`. Both ride functions that already exist (`razeHolding`, `applyPlantSchism`) and are additive cases in the lifecycle's mutation switch — thin, but engine work the plan's three-pillar table did not list (it scoped the engine pillar to the review levers). They ship with the pilot under this ticket, each with a lifecycle test and a live-proof claim (`mutation_object` reads the razed node's absence and the faction's `schismPendingResolutionTick`). Without them the two rows cannot open, and a brief that opened them with `no_mutation` would be shipping harm with no object — exactly the vacuity the write-set rule exists to refuse.

## Out of scope

- **Retuning the board or the motive gate.** If six templates move the census envelope, the batch is wrong (plan kill criterion 5); THR-1388 owns whether harm should be *common*, this batch only makes it *possible*.
- **A third row.** `sublocation` and `faction` open here; nothing else new.
- **C cells.** The catalog has nine creates and every row has one; the gap is on the other side of the grid.
- **Prose.** Written inside the mechanics above by the draft agent, held to the encounter standard by the editorial agent — not by this brief.
