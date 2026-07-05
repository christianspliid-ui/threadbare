# Six no-op ascendant actions — real effects (attune / nullify / curse / fortify / trap / vision)

**Date:** 2026-07-05 · **Author:** Cowork · **Linear:** THR-605 · **Project:** Action System & Unlocks

## Problem

Six ascendant-facing `UnifiedActionTemplate`s have empty step ops (`onSuccess: []`) **and** no id-keyed engine handling anywhere (grep-verified across `src/engine/`, 2026-07-04): `artifact.attune`, `artifact.nullify`, `artifact.curse`, `loc.fortify`, `sub.trap`, `sub.vision`. Firing them deducts AP + essence and narrates, but changes no world state. Their authored `description` prose claims effects that do not exist. THR-604 shipped the `not wired` badge that now flags them in the action catalog; this issue makes the badge disappear by giving each a real, **consumed** effect.

Guiding constraint (systemic wiring guide §"Intelligence is consumed in five places"): a write with no reader is write-only theatre. Every effect below names the system that already reads the state it writes. **No new node types. No new edge types** — each action reuses an existing consumed substrate, following the load-bearing rule that relationships are edges and internal data is properties.

## Substrate verification (done — this is why the design is grounded)

| Action | Reuses | Consumer that already reads it |
|---|---|---|
| `artifact.attune` | `properties.effects: AttachmentEffect[]` + `aligned_with` edge | Effects system (`effectResolver.ts` / `effectAura.ts` / `effectWalker.ts`) applies artifact effects to the bearer's capabilities — same array `imbue_item` (THR-508) writes |
| `artifact.curse` | `properties.effects` (negative effect) + optional agent hidden mark | Same effects system (negative effect); `hiddenMarks.ts` reveal loop if placed on a current bearer |
| `artifact.nullify` | clears `properties.effects` + enchant tier | Bearer loses all applied bonuses/curses — inverse of imbue/enchant/attune/curse |
| `loc.fortify` | `properties.fortificationMultiplier` | `siegeResolution.ts` reads `fortificationMultiplier` (`?? getFortificationModifier(subtype)`); breach reduces it, fortify raises it |
| `sub.trap` | `encounter_seed` capability (Capability 2) | Encounter pipeline scores the seeded beat highly for the next qualifying agent co-located on the hex |
| `sub.vision` | perceive/reveal (`engine/ruins/perceiveRelay.ts` pattern) | Fog/visibility + clue system (`knows_of` / `knows_clue_of`) + rival divine-mark secret reveal |

The composed-op pattern is settled and proven by THR-508/512/513: a `GraphOpType` union member in `src/types/graphOp.ts`, an `apply<Verb>()` function with fail-soft + trace in `src/engine/ascendantExpression.ts`, dispatched from `src/engine/unifiedActionResolution.ts` (see the `imbue_item` / `bestow_power` / `anoint_faction` handlers at ~L1085–1186), referenced from the template's `onSuccess`. This design adds new members to that exact family — no new architecture.

## Engine pillar

New composed GraphOps (additive union members in `graphOp.ts`; each dispatched in `unifiedActionResolution.ts`; apply-fns in a new sibling module `src/engine/ascendantWards.ts` to keep `ascendantExpression.ts` focused, importing the shared `getAscendantPrimarySphere` / `pickSphereFlavoredEffect` helpers):

1. **`attune_artifact`** — resolve target artifact; read ascendant primary sphere (`getAscendantPrimarySphere`, existing). Append one **positive** sphere-flavored `AttachmentEffect` (`pickSphereFlavoredEffect`, existing) to `artifact.properties.effects`, and add an `aligned_with` edge `artifact → sphere` (existing edge type; artifact becomes an additive valid source — no new edge type). Set `properties.attunedSphere = sphere`. The appended effect is the consumed change; the edge + stamp are queryable alignment. Distinct from `imbue_item`: attune is deliberate, RNG-free alignment to the god's own sphere; imbue is the THR-508 expression-card's random flavor.

2. **`curse_artifact`** — append one **negative** `AttachmentEffect` (reach penalty or per-tick quintessence drain — choose from the existing `AttachmentEffect` negative variants; no new effect kind) to `artifact.properties.effects`; set `properties.cursed = true` and `properties.curseConcealed = true` (matches prose "without their knowledge"). If the artifact is currently possessed/bonded (`possesses` / `bonded_to` edge → holder), also place an **agent hidden mark** on the holder (category `curse` or nearest existing `HiddenMarkCategory`, severity from `CURSE_MARK_SEVERITY`) so investigation/veil encounters can later surface it. Consumed by the effects system (bearer) + hidden-mark reveal loop.

3. **`nullify_artifact`** — set `artifact.properties.effects = []`; clear `attunedSphere`, `cursed`, `curseConcealed`; remove any `aligned_with` edge from the artifact; downgrade the enchant tier property to its inert baseline. Inverse operation; consumed by the effects system (bearer loses everything). Fail-soft on already-inert artifacts (no-op trace, still "succeeds").

4. **`fortify_location`** — read target location `properties.fortificationMultiplier` (default `getFortificationModifier(locationSubtype)` when unset, matching the siege fallback); add `FORTIFY_MULTIPLIER_BONUS`; clamp to `FORTIFY_MULTIPLIER_MAX`; write back. (A plain `update_node` relative change can add but not cap — the cap is why this is a composed op.) Consumed by `siegeResolution.ts`. Regional scale + `iron` reach preserved.

5. **`plant_trap`** — emit an `encounter_seed` (existing `PendingEncounterSeed` pathway) anchored to the target sublocation's hex with **no `targetAgentId`** (fires on the next qualifying agent to occupy the hex), `templateId` = the authored trap beat (Content pillar), `priority` from `TRAP_SEED_PRIORITY`, `delayTicks` = 0. The trap is concealed from mortal awareness by seeding rather than surfacing an encounter node directly. Consumed by the encounter scoring/selection pipeline. Fail-soft: missing trap template → no-op trace.

6. **`scry_sublocation`** — port the `divine.perceive.read_the_threads` / `taste_the_wake` reveal logic (`engine/ruins/perceiveRelay.ts`) scoped to the targeted sublocation's hex: reveal undiscovered clues (`knows_clue_of` → `knows_of`), surface rival `divine_mark` secrets present, and reveal Place-of-Power presence, into **player** visibility (fog/knowledge). "Read" crudType — its world change is the reveal (creating `knows_of` edges / flipping secret visibility), which is a real, consumed state change (fog + clue systems). Fail-soft: nothing concealed present → honest "the place keeps its silence" trace, action still succeeds.

No tick-loop phase changes, no new node types, no new edge types (existing `aligned_with` gains an additive valid source; existing `knows_of` reused).

### Recommended landing order (one PR per slice, per the established pattern)

`fortify_location` (self-contained, one proven consumer) → artifact trio (`attune`/`curse`/`nullify`, shared module + effects array) → `scry_sublocation` (perceive port) → `plant_trap` (needs the authored trap beat). Parallel-safe internally; no mutex between slices.

## Content pillar

- **`sub.trap` beat (new):** author one small negative encounter template `encounter.trap.sprung` (or a 2–3 variant micro-family) — a concealed-snare beat that resolves against the triggering agent with a proportional harm outcome (scar attachment / short condition / capability check), in the plainspoken-baseline register (THR-609). Enrichment placeholders + variant minimums per the prose skills. This is the only net-new authored content; the other five are pure engine wiring over existing content.
- **`technicalEffect` backfill (THR-604 field):** update all six templates' `technicalEffect` from the intended-but-unwired text to the now-true mechanical statement (name the state changed, direction, persistence; magnitudes symbolic — name the constant, never a literal). When these land, the catalog badge flips from `not wired` → `wired · engine`. That badge change is this issue's acceptance signal.
- **`description` prose:** unchanged — already claims these effects; the wiring now makes the claims honest. Spot-check each still matches the implemented effect (e.g. `loc.fortify`'s "structural weaknesses are reinforced" now literally raises the fortification multiplier).
- **No UL shard change, no rulebook impact:** these are existing action verbs gaining their intended effects; no rule of play changes.

## UI pillar

- **Action catalog (`public/action-catalog.html`):** no code change — the badge derivation (THR-604) auto-reclassifies these six from `none` to `engine-bridge` once their ids are added to `ENGINE_EFFECT_TEMPLATE_IDS` (the composed ops are engine-dispatched, so add the six ids to the registry set built in `engineEffectRegistry.ts`). The unit test that asserts every registry id exists in `UNIFIED_ACTION_TEMPLATES` covers them.
- **Player-facing feedback (existing channels, verify wired):** each action already narrates on resolution; confirm the aftermath surfaces the concrete change — fortify → a chronicle/toast noting the site is hardened; curse → concealed (no bearer-facing tell, by design); nullify → the artifact visibly loses its enchant styling in the artifact panel; attune → sphere alignment shown on the artifact detail; vision → revealed clues/secrets appear in the player's knowledge surface / on the hex; trap → no player tell until sprung, then the sprung beat surfaces normally.
- **DebugPanel:** the six composed ops emit traces (below) visible in the trace stream; add them to the ascendant-expression trace category filter if one exists. `__DEBUG.fireAction()` already lists these templates — confirm each now returns a non-empty state delta.
- **Browser-verify artifact (Definition of Done):** DOM surfaces only (artifact detail panel enchant styling for nullify/attune; catalog badge flip) → Playwright `preview_resize(1920,1080)` + screenshot + console capture. The fortify/trap/vision effects are graph-state, not new UI surfaces — assert via `__DEBUG` state queries (fortificationMultiplier raised; seed present; `knows_of` created) rather than screenshots. No WebGL surface touched.

## Wiring

| Module | Wiring |
|---|---|
| `src/types/graphOp.ts` | +6 `GraphOpType` union members (`attune_artifact`, `curse_artifact`, `nullify_artifact`, `fortify_location`, `plant_trap`, `scry_sublocation`) |
| `src/engine/ascendantWards.ts` (new) | `applyAttuneArtifact` / `applyCurseArtifact` / `applyNullifyArtifact` / `applyFortifyLocation` / `applyPlantTrap` / `applyScrySublocation` — each fail-soft, each emits a trace |
| `src/engine/unifiedActionResolution.ts` | dispatch the six ops (mirror the `imbue_item` handler block ~L1085–1186) |
| `src/data/unified-action-templates.ts` | populate each template's `steps[].onSuccess` with its op; update `technicalEffect` |
| `src/engine/engineEffectRegistry.ts` (THR-604) | add the six ids to `ENGINE_EFFECT_TEMPLATE_IDS` so the catalog badge flips |
| `src/data/…trap encounter content` | author `encounter.trap.sprung` beat |
| `src/engine/siegeResolution.ts` | consumer (already reads `fortificationMultiplier`) — no change, just verified |
| `Docs/plans/2026-04-16-systemic-wiring-guide.md` | add the 6 new composed ops to the ascendant-op capability list (Definition of Done: content-facing engine capability) |

## Constants (NFP #1 — all named, in `ascendantWards.ts` unless noted)

| Constant | Default (advisory — tune in review) | Purpose |
|---|---|---|
| `FORTIFY_MULTIPLIER_BONUS` | 0.5 | Additive bump to a location's `fortificationMultiplier` per fortify |
| `FORTIFY_MULTIPLIER_MAX` | 3.0 | Cap so fortify can't make a site unbesiegeable |
| `CURSE_MARK_SEVERITY` | 0.5 | Severity of the hidden mark placed on a cursed artifact's current holder |
| `CURSE_EFFECT_MAGNITUDE` | (reuse existing negative `AttachmentEffect` magnitude constant) | Strength of the curse's reach penalty / drain |
| `ATTUNE_EFFECT_MAGNITUDE` | (reuse `pickSphereFlavoredEffect` output) | Strength of the attunement's positive effect |
| `TRAP_SEED_PRIORITY` | 0.8 | Encounter-seed priority so the sprung-trap beat outscores ambient beats for the arriving agent |
| `TRAP_SEED_DELAY_TICKS` | 0 | Trap is live immediately; fires on next qualifying arrival |

## Tracing (NFP #2)

Each apply-fn emits an ascendant-expression-category trace on both success and fail-soft, mirroring `imbue_item`'s `emitTrace`/`emitNoOp` pair: `attune_artifact` (sphere, effect), `curse_artifact` (effect, mark placed?), `nullify_artifact` (effects cleared count), `fortify_location` (multiplier before/after — mirrors the siege breach trace shape), `plant_trap` (seed id, sublocation), `scry_sublocation` (revealed clue/secret counts). Types declared alongside the existing ascendant-expression trace interfaces.

## Fail-soft (NFP #4)

| Failure | Behavior |
|---|---|
| Target artifact missing / not an artifact | no-op trace (reuse `emitNoOp` shape), action resolves as fail-soft success |
| `getAscendantPrimarySphere` returns none (attune) | no-op trace `missing_sphere`, no effect appended |
| Nullify on already-inert artifact | clears nothing, succeeds, `already_inert` trace |
| Fortify target lacks a subtype / not fortifiable | write base + bonus anyway (siege fallback handles it); if location missing → no-op trace |
| Plant_trap with missing trap template | no seed emitted, `missing_trap_template` trace, action still succeeds |
| Scry with nothing concealed on the hex | honest "silence" trace, no `knows_of` created, succeeds |
| Cursed/attuned artifact later destroyed | effects array vanishes with the node — no dangling state |

## Blast Radius

Not required — no touched file has ≥100 importers. `graphOp.ts` (12 importers): additive union members; the executor switch is exhaustive so CC must add the 6 dispatch arms (compile-enforced). `ascendantExpression.ts`/new `ascendantWards.ts` (≤6 importers) and `unifiedActionResolution.ts` (24 importers): additive handlers only. `unifiedAction.ts` (278 importers) is **not** touched — no type change (existing `AttachmentEffect`, `HiddenMark`, `PendingEncounterSeed`, `EncounterSeed` effect kinds all reused as-is).

## Non-goals

- No new node/edge types (existing `aligned_with` source-extended, existing `knows_of` reused).
- No new `AttachmentEffect` kinds — attune/curse pick from existing positive/negative variants.
- No player-chosen sphere picker for attune (uses the ascendant's own primary sphere, RNG-free); a target-parameter system for "pick any sphere" is a separate design if ever wanted.
- No siege/combat rebalance — fortify feeds the existing multiplier; tune `FORTIFY_*` if playtest shows sieges stall.
- No in-game Codex technical-effect surfacing (per THR-604 §UI — wiki register only).

## Kill criteria

- If `scry_sublocation` finds nothing to reveal on most real hexes (concealed state too rare), vision is theatre — either broaden what it reveals (undiscovered sublocation encounters, agent secrets) or fold it into the existing `divine.perceive.*` family instead of a standalone op.
- If `plant_trap` seeds rarely fire because qualifying agents seldom re-enter a specific sublocation, reconsider anchoring the trap to the hex arrival check directly rather than the encounter-seed scorer.

## NFP Compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — all magnitudes/caps named constants; no literals in effect logic |
| 2 Inspectability | PASS — every op emits success + fail-soft traces; catalog badge becomes the standing inspection surface |
| 3 Determinism | PASS — attune is RNG-free; curse/trap draw from seeded PRNG where variant selection applies; no wall-clock |
| 4 Fail-soft | PASS — table above; every apply-fn resolves as fail-soft success, never throws |
| 5 Narrative first | PASS — prose unchanged; effects make existing claims honest; curse concealment respects dramatic irony |
| 6 Additive | PASS — additive union members, new module, additive template `onSuccess` + registry ids; no signature changes |
| 7 Performance | PASS — per-action O(1) graph writes; no per-tick cost added |

## Three-pillar check

Engine (6 composed ops + consumers) · Content (1 trap beat + 6 `technicalEffect` rewrites) · UI (catalog badge auto-flip + aftermath feedback verify + `__DEBUG` assertions) · Wiring (table above). All present.
