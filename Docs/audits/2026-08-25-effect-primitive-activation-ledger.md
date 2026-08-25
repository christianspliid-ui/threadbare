# Effect-Primitive Activation Ledger (THR-1237)

**Date:** 2026-08-25
**Type:** wayfinder:research — read-only code survey, no source changed
**Question:** Director ruling 2026-08-25 — *"please extend to all the primitives first."* What does it take to make the **whole** effect-primitive vocabulary genuinely live, primitive by primitive?
**Predecessor:** THR-1228 (Substrate inventory). Its findings were treated as hypotheses and re-verified against the code; several are corrected below.

---

## Summary

The vocabulary is **53 primitives**, not 47 — `src/types/effects.ts` line 806 onward, `AttachmentEffect` has 53 union members (counted mechanically). Of those, **22 are honestly live** (executor or query arm reached from a tick-loop or resolution call site, with authored producers), **5 are partial** (one half of the primitive works, the other is unreachable), and **26 are dead**. Only **3** are true one-line fixes; **7** are `small`; **21** are `real work`; and **9** cannot be sequenced at all until a human answers an embedded design question. Four primitives (`outcome_shift`, `auto_succeed`, `graph_mutation`, `create_barrier`) are proposed for **retirement** rather than wiring.

The single most consequential finding is structural and was not in the THR-1228 hypothesis: **`executeEffect` — the whole Tier-2/Tier-3 executor dispatcher — never runs in production.** It has exactly three call sites (`orchestrator.ts:479`, `phaseDoom.ts:262`, `GameView.tsx:4022`); the first two are fed only by `reactivesFired`, which is always empty, and the third is behind a modal no engine path ever opens. Separately, `activateSpell` (`src/engine/spellActivation.ts:341`) — the integration point the type file's own header names — **has zero production callers**. So thirteen primitives are not "gated"; they have no route to execution at all, and six of them are trace-only stubs that would still do nothing if the route existed.

---

## How "live" was judged

A primitive counts as **live** only when all three hold, each verified by reading the code:

1. An arm exists that does real work (not a trace-only return, not a `return 0` / "handled elsewhere" case).
2. That arm is reached from a call site on the tick loop, resolution pipeline, or a player-reachable UI handler.
3. At least one authored producer writes the primitive into `src/data/` (a type-only reference does not count).

Producer counts below are `grep -ro "type: '<t>'" src/data/` and are approximate for multi-line literals, but they distinguish "some" from "none" reliably.

---

## The live path, in one picture

Five integration points reach effects on the live tick loop. Everything else is unreachable.

| Integration point | File:line | Primitives it serves |
|---|---|---|
| `resolveEffectModifiers` | `effectResolver.ts:316` ← `resolutionModifiers.ts:512` ← `encounter.ts:28` | `passive` `permanent` `duration` `conditional` `cooldown` `tradeoff` `stacking` `decay` `until_event`(value only) `trait_grant` |
| `tickEffects` | `effectTick.ts:404` ← `orchestrator.ts:2979` | `duration` `cooldown` `decay` `stacking` `consumable_charge`(init only) `axiological_drift` `hex_effect` `resource_manipulate`(per_tick) |
| `effectQueries.*` | `effects/effectQueries.ts` ← 8 engine modules | `stat_contribution` `trait_grant` `action_gate` `behavior_weight` `social_modifier` `range_modifier` `modify_rules`(1 key) |
| `processEffectEvent` | `effects/effectEvents.ts:176` ← `orchestrator.ts:463`, `phaseDoom.ts:247` | `stacking` `until_event`(expiry) `transform`; **`reactive` is structurally unreachable here** |
| `checkAndFireActionTriggers` | `effects/actionTrigger.ts:108` ← `orchestrator.ts:909`, `phaseMovement.ts:198`, `unifiedActionResolution.ts:2322` | `action_trigger` |
| `rewardPool` / `unifiedActionResolution` / `phaseQuintessence` / `phaseSlotCaps` | see rows | `content_grant` `resource_delta` `test_shaper` `prevent_loss` `slot_bonus` |
| `executeEffect` | `effectExecutors.ts:702` | **nothing — all three call sites are unreachable** |
| `activateSpell` | `spellActivation.ts:341` | **nothing — no production caller** |

### Only two events are ever raised

`EffectEvent` (`effects/effectEvents.ts:63`) declares eight variants. Exactly two are constructed anywhere in production:

- `{ type: 'encounter_outcome' }` — `orchestrator.ts:463`
- `{ type: 'doom_threshold' }` — `phaseDoom.ts:247`

`damaged`, `healed`, `entered_hex`, `combat_started`, `combat_ended`, `rest` are never constructed. This is the root cause of the `reactive` failure and of `until_event`'s partial death (see rows 11 and 14).

---

## The ledger

Effort bands: `one-line` (a single row/call), `small` (one function, < ~50 lines, no new state), `real work` (new state field, new tick phase, or cross-system plumbing).

### Tier 1 — Gear (14)

| # | Primitive | State | Producers |
|---|---|---|---|
| 1 | `passive` | **LIVE** | 260 |
| 3 | `duration` | **LIVE** | 21 |
| 4 | `permanent` | **LIVE** | 2 |
| 5 | `cooldown` | **LIVE** | 5 |
| 6 | `conditional` | **LIVE** | 60 |
| 7 | `trait_grant` | **LIVE** | 22 |
| 8 | `transform` | **LIVE** | 1 |
| 9 | `stacking` | **LIVE** | 14 |
| 12 | `decay` | **LIVE** | 23 |
| 13 | `tradeoff` | **LIVE** | 9 |

`transform` is worth a note because it is the one Tier-1 primitive that depends on the event bus and survives: its single producer (`reward-attachment-catalog.ts:3046`) triggers on `doom_threshold`, which *is* raised, and `orchestrator.ts:475` / `phaseDoom.ts:257` do instantiate the replacement via `instantiateReward`. `stacking`'s four authored `stackOn` values (`any_encounter`, `combat_success`, `combat_failure`, `social_success`) are all reachable from `encounter_outcome`; `on_kill` / `on_damaged` / `on_heal` are declared in `StackTrigger` but unauthored and unraisable.

---

**#2 `consumable_charge` — PARTIAL** · 12 producers · effort `small`

1. **What is missing** — *result never persisted*. `effectTick.ts:463` initialises `state.chargesRemaining = effect.charges` and `effectTick.ts:467` destroys the attachment when it hits 0, but **nothing anywhere decrements it**. `grep -rn chargesRemaining src/` returns four sites, all in `effectTick.ts`, and none is a decrement. `getEffectModifierValue` (`effectResolver.ts:135`) returns 0 for the type with the comment "Consumable charges only contribute on use, not passively" — and there is no "on use".
2. **Minimal honest wiring** — a decrement at whatever site counts as "use". The nearest existing analogue is `action_trigger`'s `self_remove` payload (`effects/actionTriggerPayloads.ts`), which already removes a possession on a resolution event; a charge decrement is the same shape with a counter instead of a removal.
3. **Embedded design decision** — *what is a "use"?* The effect carries `onUse: { reach, value }` but the vocabulary has no consumption verb. Is a charge spent when the bearer resolves a step in the matching reach? When an `action_trigger` fires? Only on an explicit player action? Until that is answered the decrement has no anchor.
4. **Retirement case** — no; the shape is distinct and 12 items author it.
5. **Effort** — `small` once the trigger is chosen; `real work` if it needs a player-facing "use item" surface.

---

**#10 `aura` — DEAD** · 12 producers · effort `small`

1. **What is missing** — *consumer absent*. `src/engine/effectAura.ts` implements `collectAuraEffects` (:110) and `resolveAuraModifiers` (:160) in full, but the module's **only importer is its own test file** (`__tests__/effectAura.test.ts:3`). No engine module imports it. THR-1228 recorded this as "no producer" — that is **wrong**: there are 12 authored auras across `artifact-templates.ts` and `reward-attachment-catalog.ts`. The producer side is healthy; the consumer is orphaned.
2. **Minimal honest wiring** — call `resolveAuraModifiers` from `resolutionModifiers.ts:512`, alongside the existing `resolveEffectModifiers` call, and add its result to the same modifier bag. `resolveAuraModifiers` needs an `AgentPosition` list, so the call site must first assemble nearby-agent positions — that is the real cost, not the call.
3. **Embedded design decision** — *does an aura contribute to the resolution roll, to the capability raw score, or both?* Auras author `value: 0.02–0.03`, the same magnitude band as `passive`, which suggests the roll channel. It also needs a ruling on stacking: do two overlapping allied auras of the same reach sum, or does the strongest win?
4. **Retirement case** — no.
5. **Effort** — `small` (the position-collection helper is the only new code).

---

**#11 `reactive` — DEAD** · 22 producers · effort `real work`

1. **What is missing** — *event never raised*. `getReactiveTrigger` (`effects/effectEvents.ts:132`) maps four `EffectEvent` types to `ReactiveTrigger`s: `damaged→damaged`, `healed→healed`, `entered_hex→entered_hex`, `combat_started→encounter_started`. **All four of those events are never constructed in production** (only `encounter_outcome` and `doom_threshold` are). So `reactivesFired` is always empty, at both call sites.
2. **Minimal honest wiring** — raise the events. `entered_hex` is nearly free: `phaseMovement.ts:198` already calls `checkAndFireActionTriggers` on arrival and has the hex in hand, so a sibling `processEffectEvent(graph, agentId, { type: 'entered_hex', hex }, …)` there is one block. `damaged` / `healed` need a hook at wound and heal application. That covers 14 of the 22 authored producers (10 `damaged`, 2 `entered_hex`, 2 `healed`).
3. **Embedded design decisions** — three, and they are why this is not `small`:
   - *What raises `damaged`?* Threadbare has no HP. The nearest analogues are `appliesWound` on a step outcome and `#wound` conditions. Is "damaged" a wound application, a failed combat step, or a quintessence loss?
   - *`attacked` vs `damaged`.* Five producers use `attacked`, which `getReactiveTrigger` maps from **nothing**. `cursed` (1) and `blessed` (1) likewise. Do these get their own events, or do they collapse into `damaged` / a condition-application event?
   - **The deeper one:** *what does a fired reactive actually do?* Of the 22 authored reactives, ~17 nest a `duration` effect, 3 nest `decay`, 1 `range_modifier`, 1 `reveal`, 1 `cascade`. `executeEffect` (`effectExecutors.ts:735-770`) explicitly **no-ops every one of those**, returning `{ mutations: [], traces: [{ note: 'Modifier/state effect — applied by resolver/tick, not executor' }] }`. There is no mechanism to attach a transient modifier to an agent. So raising the events fixes the trigger and leaves the payload inert. **This corrects the THR-1228 hypothesis directly:** the reactive path is two failures deep, not one.
4. **Retirement case** — no; 22 producers and it is the substrate every "when X happens to you" item needs.
5. **Effort** — `real work` (event raising + a transient-modifier attachment mechanism).

---

**#14 `until_event` — PARTIAL** · 5 producers · effort `small`

1. **What is missing** — *event never raised*, for every authored instance. The expiry arm at `effects/effectEvents.ts:273` is real and reachable, but only for the two `ExpiryEvent`s that `getExpiryEvent` can return from a raised event: `encounter_complete` and `doom_threshold`. All five producers use `leave_combat` (1), `rest` (3), `enter_combat` (1) — none reachable. The modifier value *does* apply (`effectResolver.ts:131` returns it unconditionally), so these five items grant a permanent bonus that was authored as temporary.
2. **Minimal honest wiring** — raise `{ type: 'rest' }` and `{ type: 'combat_started' } / { type: 'combat_ended' }` from the phases that already know those states. `rest` covers 3 of 5 on its own.
3. **Embedded design decision** — *what is "rest" in Threadbare?* There is no rest verb on the tick loop; the closest is an idle tick or a settlement stay. Same for combat entry/exit, which the engine models as encounter steps in `iron`/`martial`, not as a combat state.
4. **Retirement case** — no.
5. **Effort** — `small` once "rest" is defined.

---

### Tier 2 — Spell (22)

**#15 `teleport` — DEAD** · 4 producers · effort `real work`

1. **What is missing** — *executor arm empty* **and** *no live caller*. `executeTeleport` (`effectExecutors.ts:115-137`) returns `mutations: []` — it emits a trace naming the destination and moves nothing. It is a stub, not a gated implementation. Its only dispatcher (`executeEffect`) has no reachable caller.
2. **Minimal honest wiring** — the move itself already exists: `src/engine/avatarMove.ts` and `phaseMovement.ts` own `located_at` retargeting. The executor needs to (a) resolve the destination hex per `effect.destination`, (b) emit a `remove_edge`/`add_edge` pair on `located_at`, and (c) be reached from a live path. Note the orchestrator's mutation applier (`orchestrator.ts:485-491`) handles only `add_node`/`remove_node`/`add_edge`/`remove_edge`, so an edge pair is the supported shape.
3. **Embedded design decisions** — *who casts?* Two of the four producers are in `spell-templates.ts`, which is doubly dead (see `activateSpell` below). And: *does a teleport land on a hex, a location, or a sublocation?* The three-tier position model means "move to hex" is under-specified — an agent must sit on exactly one `located_at` target.
4. **Retirement case** — no.
5. **Effort** — `real work`.

---

**#16 `forced_move` — DEAD** · 1 producer · effort `real work`

1. *Executor arm empty* — `effectExecutors.ts:140-156` returns `mutations: []`, trace only. No live caller.
2. Same `located_at` retarget as `teleport`, plus direction resolution ("away"/"toward" relative to the caster) and a hex-validity clamp.
3. **Embedded design decision** — *is a forced move an encounter-step outcome or a world effect?* Its only producer is in `spell-templates.ts`. Threadbare has no positional combat, so "push 2 hexes" has no established meaning.
4. **Retirement case** — plausible. `teleport` with `destination: 'random'` and `range` covers most of what one producer needs. **Proposed:** fold into `teleport` unless positional displacement earns its own fiction.
5. **Effort** — `real work` if kept.

---

**#17 `reveal` — DEAD** · 17 producers · effort `small`

1. **What is missing** — *executor arm empty*. `reveal` is in the explicit no-op block at `effectExecutors.ts:750`, and returns 0 from `effectResolver.ts:147`. There is no implementation anywhere. (The `'reveal'` hits in `stepFactorLines.ts` and `unifiedActionResolution.ts:2866` are a different vocabulary — an intervention type and a factor-line kind — not this primitive.)
2. **Minimal honest wiring** — fog-of-war already has a live lever (`window.__DEBUG` fog toggles, `?nofog`), so the state exists. The executor arm needs to write revealed hexes into the fog state for `duration` ticks. Producers split across three catalogs, so a single arm serves all 17.
3. **Embedded design decision** — *who is "revealed to"?* `reveal` on an NPC's item is meaningless unless awareness is per-agent; fog is currently a player-facing concept. Does an NPC-borne `reveal` widen that agent's `encounterAwareness` hops instead? If so, `range_modifier.awarenessRangeBonus` (live) may already subsume the `target: 'agent'` case.
4. **Retirement case** — partial. `target: 'agent'` and `target: 'encounters'` overlap `range_modifier.awarenessRangeBonus`; only `target: 'hexes'` (fog) is clearly distinct.
5. **Effort** — `small` for the fog arm.

---

**#18 `spawn` — DEAD** · 1 producer · effort `real work`

1. **What is missing** — *no live caller*, and the arm that exists is malformed. `executeSpawn` (`effectExecutors.ts:164-185`) emits an `add_node` whose `data` is `{ type, template, spawnedBy, spawnTick, temporary, expiryTick }` — a flat bag with **no `id`, no `properties`, no `name`**. The orchestrator applier casts it straight to `GraphNode` (`orchestrator.ts:486`). If it ever ran it would inject a malformed node.
2. **Minimal honest wiring** — route through the existing instantiation paths instead of hand-rolling a node: `rewardPool.instantiateReward` for attachments, `debugWorldSpawnTools` / `bandSpawner` for actors, the encounter seeding path for encounters. The executor should emit a request the orchestrator hands to those, not a raw node.
3. **Embedded design decision** — *what pays for a spawn, and what caps it?* `maxActive` is declared and unread. A spawn with no cost and no cap is a duplication glitch.
4. **Retirement case** — no, but consider narrowing `what` to the two kinds with real instantiation paths (`attachment`, `encounter`) and dropping `agent` / `location` in favour of `create_structure`.
5. **Effort** — `real work`.

---

**#19 `dispel` — DEAD** · 1 producer · effort `small`

1. **What is missing** — *no live caller*. Unlike its neighbours, `executeDispel` (`effectExecutors.ts:196-232`) is a **real implementation**: it walks `has_trait`/`possesses`/`bonded_to`, filters by tag and tier, and emits `remove_edge` + `remove_node`. It just has no route to execution.
2. **Minimal honest wiring** — a live call site. The cheapest is an `action_trigger` payload kind (`condition_remove` already exists at `effects/effectTypes` — see `actionTriggerPayloads.ts`), which would make `dispel` reachable from the resolution ladder without touching the executor at all.
3. **Embedded design decision** — *does `dispel` belong to the executor vocabulary or the `action_trigger` payload vocabulary?* `condition_remove` (live) already does the narrow case. Answering this decides whether `dispel` is wired or retired.
4. **Retirement case** — **plausible**: `action_trigger` + `condition_remove` subsumes `target: 'condition'`, which is the only target with a coherent graph meaning today (`'spell'` and `'aura'` have no persisted state to remove).
5. **Effort** — `small`.

---

**#20 `suppress` — DEAD** · 5 producers · effort `small`

1. **What is missing** — *executor arm empty* and *result never persisted*. `suppress` sits in the no-op block (`effectExecutors.ts:749`). The `EffectRuntimeState.suppressed` flag it would set is **read in three places** (`effectResolver.ts:197`, `effects/effectEvents.ts:210`, `effects/effectQueries.ts:80`, plus `phaseDoom.ts:296`) and **written in none** — grep returns zero assignments.
2. **Minimal honest wiring** — an arm that writes `{ suppressed: true }` into `effectStates` for the matching attachment ids, plus an un-suppress at `ticks` expiry (the tick loop already owns `effectStates`, so this is a new case in `tickEffects`).
3. **Embedded design decision** — *the scope is the hard part.* Three of five producers scope to `radius: 1` or `hex`, which means suppressing effects on **other** agents. `effectStates` is keyed by attachment id globally, so the data model supports it — but nothing else in the vocabulary reaches across agents today, and `src/engine/effectScope.ts` (the module that would resolve `EffectScope`) **has zero importers and is entirely dead**.
4. **Retirement case** — no; the read side is already wired, which makes this unusually cheap for its payoff.
5. **Effort** — `small` for `scope: 'self'`; `real work` for radius/hex scope, because it requires reviving `effectScope.ts`.

---

**#21 `auto_succeed` — DEAD** · **0 producers** · effort `one-line` (retire)

1. *Executor arm empty* (`effectExecutors.ts:751`), *producer absent* — zero authored instances anywhere in `src/`.
2. n/a.
3. n/a.
4. **Retirement case — yes.** `test_shaper` (live, 11 producers) subsumes it: `{ trigger: 'failure', steps: <large> }` is an auto-succeed with a margin bound and an authored trigger. `auto_succeed` has no margin, no condition, and no producer.
5. **Effort** — `one-line` to delete the union member and its two no-op cases.

---

**#22 `reroll` — DEAD** · 3 producers · effort `real work`

1. *Executor arm empty* — no-op block, `effectExecutors.ts:752`.
2. Resolution is a single seeded roll in `unifiedActionResolution.ts`; a reroll needs a second draw plus a `uses` counter in `effectStates` (the same missing decrement machinery as `consumable_charge`).
3. **Embedded design decisions** — *who decides to reroll?* An automatic reroll-on-failure is `test_shaper` with different words. A *chosen* reroll needs a player prompt mid-resolution, which the Nudge Model's step panel does not currently have. And **NFP #3**: a reroll must draw from the same seeded stream or determinism breaks — the second draw needs its own derivation, not a re-call.
4. **Retirement case** — if the answer to "who decides" is "the engine", retire in favour of `test_shaper`. If it is "the player", it is a genuine new surface.
5. **Effort** — `real work`.

---

**#23 `swap_reach` — DEAD** · 1 producer · effort `small`

1. *Executor arm empty* (`effectExecutors.ts:753`). Its single producer is in `spell-templates.ts:52`, which is doubly dead.
2. `unifiedActionResolution.ts` reads the step's `reach` to pick the capability; a swap is a lookup substitution at that read, gated on an active `swap_reach` whose `from` matches.
3. **Embedded design decision** — *does the substitution apply to the roll only, or also to eligibility and forecasting?* The step panel shows the reach in the sentence (THR-820), and encounter eligibility filters on reach upstream of resolution. A roll-only swap would show the player one reach and roll another.
4. **Retirement case** — no; it is a distinct and evocative fiction (fight with your wits), and the `RuleOverrideKey` union already reserves `encounter_reach_override` for the same idea — **which is a duplication to resolve**: `swap_reach` and `modify_rules{rule:'encounter_reach_override'}` are the same mechanic in two vocabularies, and neither is wired.
5. **Effort** — `small` for the roll-only case.

---

**#24 `outcome_shift` — DEAD** · **0 producers** · effort `one-line` (retire)

1. *Executor arm empty* (`effectExecutors.ts:754`), *producer absent*.
2. n/a.
3. n/a.
4. **Retirement case — yes.** `test_shaper` (live) is `outcome_shift` plus a trigger, a reach filter, a condition and a margin bound; it shipped later and took all 11 producers. `outcome_shift` is the unrefined ancestor.
5. **Effort** — `one-line`.

---

**#25 `test_shaper` — LIVE** · 11 producers. `collectTestShapers` (`effectResolver.ts:234`) → `unifiedActionResolution.ts:396`.

**#26 `prevent_loss` — LIVE** · 4 producers. `collectPreventLossEffects` (`effectResolver.ts:265`) → `phaseQuintessence.ts:54`.

**#27 `content_grant` — LIVE** · 5 producers. `rewardPool.ts:450`.

**#28 `resource_delta` — LIVE** · 18 producers. `rewardPool.ts:619` and as an `action_trigger` payload (`effects/actionTrigger.ts:161`).

**#29 `action_trigger` — LIVE** · 11 producers. `checkAndFireActionTriggers` (`effects/actionTrigger.ts:108`) reached from three live sites: `orchestrator.ts:909`, `phaseMovement.ts:198`, `unifiedActionResolution.ts:2322`. **This is the healthiest primitive in the vocabulary and the model the dead ones should copy** — a payload union derived from what content actually uses, fired from the resolution ladder, with its own applier module.

---

**#30 `choice_set` — DEAD** · 6 producers · effort `small`

1. **What is missing** — *producer absent on the live path*. The executor is complete (`effectExecutors.ts:590-700`: predicate filtering, option capping, fallback, three selection modes) and the UI is complete (`ChoiceSetModal.tsx`, wired at `GameView.tsx:4004`). But `setPendingChoice` is called from exactly two places, both inside the modal's own resolve handler (`GameView.tsx:4063` for a nested choice, `:4077` to clear). **No engine path ever opens the modal.** The six authored choice_sets (`src/data/choice-set-catalog.ts`) are imported by exactly one consumer — `traitRefValidation.ts:204`, a validator. THR-1228's "no engine producer" is correct and this is the cheapest large win on the board.
2. **Minimal honest wiring** — call `executeChoiceSet` from `rewardPool.instantiateReward` (the same place `content_grant` and `resource_delta` are already handled, `rewardPool.ts:450`/`:619`) when a reward template carries a `choice_set` effect. AI modes (`ai_auto`, `weighted_random`) resolve inline and need no UI at all; `player` mode returns `pendingChoice`, which the orchestrator would surface the way other interrupts are.
3. **Embedded design decision** — *how does a `player`-mode pending choice reach the UI from the engine?* The executor returns it, but the tick loop has no channel for "pause and ask" other than the existing interrupt registry. Does `choice_set` become a beat, or does it ride the aftermath-reaction surface (which already asks the player to pick)?
4. **Retirement case** — worth asking. The **aftermath reaction picker** already presents a filtered option list with consequences and a player pick, and is live. If `choice_set` is going to be surfaced as a modal anyway, the honest question is whether it is a second implementation of the aftermath picker.
5. **Effort** — `small` for AI modes (one block in `rewardPool`); `real work` for `player` mode.

---

**#31 `alter_terrain` — DEAD** · 2 producers · effort `real work`

1. **What is missing** — *result never persisted*, and no live caller. `executeAlterTerrain` (`effectExecutors.ts:246-268`) builds a well-formed `ActiveTerrainOverlay` and returns it in `terrainOverlays[]`. **`GameState` has no field to receive it** — `grep ActiveTerrainOverlay src/` shows the type is constructed in `effectExecutors.ts` and read nowhere. Both call sites of `executeEffect` apply only `mutations`, ignoring `terrainOverlays` and `ruleOverrides` entirely.
2. **Minimal honest wiring** — a `terrainOverlays: ActiveTerrainOverlay[]` field on `GameState`, an expiry sweep in a tick phase, and readers in the systems the ten `TerrainOverlayType` values are meant to affect.
3. **Embedded design decision** — *what does each overlay DO?* Ten named overlays (`sacred_ground`, `blighted`, `fertile_ground`, …) are declared with no semantics anywhere. Persisting the overlay is the easy half; deciding that `blighted` reduces prosperity by X and shifts encounter weights by Y is the design. This is a per-value ruling, not one decision.
4. **Retirement case** — no, but the ten values should be pruned to the ones that get semantics.
5. **Effort** — `real work`.

---

**#32 `create_barrier` — DEAD** · 5 producers · effort `real work`

1. *Executor arm empty* — no-op block, `effectExecutors.ts:758`. No barrier state exists anywhere.
2. Would need per-edge (hex-pair) blocking state consulted by `movementCost.ts` and `encounterAwareness.ts`.
3. **Embedded design decision** — *is a barrier a graph edge or a state overlay?* The Load-Bearing Decisions say relationships between entities are edges; a barrier between two hexes is arguably a hex-to-hex edge. But hex adjacency is geometric, not edge-modelled, so a `blocks` edge would be the first of its kind.
4. **Retirement case** — **plausible.** `modify_rules{rule:'movement_cost_multiplier'}` scoped to a hex expresses "hard to cross" without new topology, and `range_modifier.awarenessRangeBonus` (negative) expresses "hard to see past". Both already exist in the vocabulary. **Proposed:** retire `create_barrier` in favour of scoped `modify_rules`, contingent on `EffectScope` being revived.
5. **Effort** — `real work` if kept.

---

**#33 `transfer` — DEAD** · 1 producer · effort `real work`

1. *Executor arm empty* — `effectExecutors.ts:284-306` returns `mutations: []`, trace only. Its one producer is in `spell-templates.ts` (doubly dead).
2. Re-parenting an attachment is two edge mutations, which the applier supports. The hard part is `what: 'modifier'` — modifiers are not nodes, so there is nothing to re-parent.
3. **Embedded design decision** — *what does transferring a "modifier" or a "trait" mean?* `possession` and `condition` are graph-backed and transferable; `modifier` and `trait` are not objects. Two of the four `what` values have no referent.
4. **Retirement case** — narrow rather than retire: keep `possession` and `condition`, drop `modifier` and `trait`.
5. **Effort** — `real work` (mostly the design).

---

**#34 `haste` / #35 `slow` — DEAD** · 3 and 4 producers · effort `real work`

1. *Executor arm empty* for both (`effectExecutors.ts:759`, `:760`). `extraActions` and `skipActions` have no referent.
2. n/a until the decision below.
3. **Embedded design decision** — *Threadbare agents do not have "actions per tick."* An agent occupies encounter steps for a duration; movement costs ticks. "One extra action" has no meaning in the tick model. The honest question is: *is `haste` a movement-cost multiplier, an encounter-step duration multiplier, or a genuine new action-economy?*
4. **Retirement case** — **strong.** `range_modifier.movementCostMultiplier` (live, 35 producers) already expresses "faster" for movement, and `modify_rules{rule:'cooldown_multiplier'}` expresses "acts more often". If the answer to the decision above is "movement" or "cooldown", both primitives retire into live ones.
5. **Effort** — `real work` if kept; `one-line` if retired.

---

**#36 `freeze_duration` — DEAD** · 6 producers · effort `small`

1. *Executor arm empty* — `effectExecutors.ts:761`.
2. This one is genuinely cheap: `tickDuration` / `tickDecay` in `effectTick.ts` are the only countdown owners, and a `frozenUntilTick` field on `EffectRuntimeState` checked at `effectTick.ts:435` would implement it. The state map is already per-attachment and already persisted.
3. **Embedded design decision** — *whose durations?* Four of six producers target `buff`/`debuff` on the bearer; `target: 'condition'` implies the bearer's conditions. Cross-agent freezing would need `EffectScope`, which is dead.
4. **Retirement case** — no. Best effort-to-payoff ratio among the dead Tier-2 set.
5. **Effort** — `small`.

---

**#37 `compel` — DEAD** · 2 producers · effort `real work`

1. **What is missing** — *result never persisted*, plus no live caller. `executeCompel` (`effectExecutors.ts:310-356`) has real logic — it blocks player-controlled targets and caps ticks — and emits a mutation of type **`update_property`**. But the orchestrator's applier (`orchestrator.ts:485-491`) handles only `add_node`/`remove_node`/`add_edge`/`remove_edge`; `update_property` falls through the `if` chain silently. So even with a live caller, the compel would be dropped without a trace.
2. **Minimal honest wiring** — (a) add an `update_property` arm to both mutation appliers, and (b) read `compelOverride` / `compelValue` / `compelExpiryTick` in `phaseAgentDecision.ts` and `phaseMovement.ts`.
3. **Embedded design decisions** — *what does each of the seven `CompelOverride` values do to agent decision state?* `movement_target` and `avoid_hex` map onto the movement scorer; `maslow_weight` onto the need model; `attack_target` / `protect_target` / `flee` have no referent because there is no targeting layer. And the larger one: *is compulsion narrated as a divine act with a doom cost, or as a silent puppet-string?* Threadbare's player-as-god framing makes an uncosted mind-control a tone problem, not just a mechanics gap.
4. **Retirement case** — no, but prune `CompelOverride` to the values with referents.
5. **Effort** — `real work`.

---

### Tier 3 — God-tier (5)

**#38 `create_structure` — DEAD** · 3 producers · effort `real work`

1. *No live caller*; the arm exists but emits a malformed node. `effectExecutors.ts:362-397` builds `add_node` with `data: { type: 'location', subtype, hexCol, hexRow, … }` — a **flat bag**, when `GraphNode` requires `id`, `name`, and a nested `properties`. Also `subtype`, not `locationSubtype`, and no `parentLocationId` discriminator, so a created sublocation would not satisfy `isSublocationNode` (THR-1183).
2. **Minimal honest wiring** — route through `strategicGraphOps` / the worldgen location writers rather than hand-rolling. `debugWorldSpawnTools.ts` already has `spawn location` and `spawn sublocation` commands that build correct nodes; the executor should call the same helpers.
3. **Embedded design decision** — *who pays, and does it persist across the fog?* A god-tier structure creation with no essence cost and no doom is free world-editing.
4. **Retirement case** — no; this is a genuine god-verb.
5. **Effort** — `real work`.

---

**#39 `destroy_structure` — DEAD** · 3 producers · effort `real work`

1. *Executor arm empty* — `effectExecutors.ts:405-419` returns `mutations: []`, trace only. It does not even resolve a target.
2. Needs target resolution plus cascade deletion (a destroyed location owns sublocations, `located_at` edges, and possibly agents).
3. **Embedded design decisions** — *what happens to the agents standing there?* And *`leavesBehind` names a template with no instantiation path.* Deleting a location under a populated hex is a data-integrity question before it is a design one.
4. **Retirement case** — no.
5. **Effort** — `real work`.

---

**#40 `modify_rules` — PARTIAL** · 8 producers · effort `small` per key

1. **What is missing** — mixed, and this is the one primitive where THR-1228's number is off. **2 of 13 `RuleOverrideKey`s are consumed, not 1**: `encounter_difficulty_modifier` (`resolutionModifiers.ts:523` via `getActiveRuleOverride`) and `doom_rate_multiplier` (`phaseDoom.ts:298`, a direct inline scan that bypasses the query helper). So **11 of 13 are inert**: `encounter_reach_override`, `movement_cost_multiplier`, `death_prevented`, `healing_multiplier`, `spawn_rate_multiplier`, `awareness_range_bonus`, `tier_advancement_cost_multiplier`, `faction_influence_multiplier`, `cooldown_multiplier`, `backlash_severity_multiplier`, `reward_tier_bonus`. Four of those eleven *are authored* (`death_prevented`, `healing_multiplier`, `spawn_rate_multiplier`, `awareness_range_bonus`, `tier_advancement_cost_multiplier`, `doom_rate_multiplier`) — an item at `reward-attachment-catalog.ts:2186` advertises "cannot die while held" and does nothing. Separately, the *executor* arm (`effectExecutors.ts:429-450`) returns an `ActiveRuleOverride` that, like `ActiveTerrainOverlay`, **nothing persists**.
2. **Minimal honest wiring** — one `getActiveRuleOverride(graph, agentId, '<key>', effectStates)` call per key at the system that owns the rule. Each is genuinely one line plus a multiply. `awareness_range_bonus` duplicates a live `range_modifier` field, so it is free.
3. **Embedded design decisions** — two: *who owns a rule override when the effect is scoped beyond `self`?* Every authored `modify_rules` uses `scope: 'self'`, which is why the per-agent query works; a region- or global-scoped override has no owner and `effectScope.ts` is dead. And *`death_prevented` is a boolean, but `getActiveRuleOverride` only sums numbers* (`effectQueries.ts:415`) — booleans and the `{from,to}` struct are silently dropped, so the query helper cannot express the key even if called.
4. **Retirement case** — retire `awareness_range_bonus` (duplicates `range_modifier`) and `movement_cost_multiplier` (duplicates `range_modifier`), and resolve `encounter_reach_override` against `swap_reach` — pick one.
5. **Effort** — `small` per key; `real work` for the boolean/struct query path and for scope.

---

**#41 `faction_manipulate` — DEAD** · 1 producer · effort `real work`

1. *Executor arm empty* — `effectExecutors.ts:459-476` returns `mutations: []`, trace only. None of the six `FactionActionType` values is implemented.
2. The faction systems it would drive are live and substantial (`graphOpExecutor.ts` has faction ops, `phaseProsperity`, group systems). The executor should emit GraphOp requests rather than graph mutations.
3. **Embedded design decisions** — *who pays a faction-held cost?* `transfer_control`, `splinter`, `absorb` and `declare_war` change the state of entities the caster does not own. Threadbare's rivals and factions have their own agency; a divine effect that flips a faction's war status without the faction's consent collides with the rival-scheme model. And: *does `shift_relationship` route through the live reputation system or write the edge directly?*
4. **Retirement case** — no, but the six actions should be triaged: `shift_relationship` has a live substrate today; the other five do not.
5. **Effort** — `real work`.

---

**#42 `cascade` — DEAD** · 5 producers · effort `small`

1. **What is missing** — *no live caller*. `executeCascade` (`effectExecutors.ts:512-580`) is a real implementation with depth and effect caps. It is dead only because its dispatcher is dead — and because every effect it would cascade *into* is itself dead or a no-op.
2. **Minimal honest wiring** — none of its own. `cascade` comes alive for free the moment `executeEffect` has a live caller **and** the cascaded primitives do something.
3. **Embedded design decision** — none unique to it.
4. **Retirement case** — no.
5. **Effort** — `small` (dependent, not independent).

---

### Query layer (9)

| # | Primitive | State | Evidence |
|---|---|---|---|
| 43 | `behavior_weight` | **LIVE** · 16 producers | `effectQueries.ts:232/260` → `encounterScoring.ts:1051, 1188` |
| 44 | `social_modifier` | **LIVE** · 16 producers | `effectQueries.ts:280/312` → `agentSelection.ts:236, 245` |
| 45 | `action_gate` | **LIVE** · 7 producers | `effectQueries.ts:190` → `unifiedCandidates.ts:77` |
| 46 | `axiological_drift` | **LIVE** · 12 producers | `effectTick.ts:475` → mutates `axiologicalProfile` |
| 47 | `range_modifier` | **LIVE** · 35 producers | `effectQueries.ts:364` → `movementCost.ts:124`, `encounterAwareness.ts:155` |

---

**#48 `tag_immunity` — DEAD** · 12 producers · effort `small`

1. **What is missing** — *no live caller*. `isImmuneToTag` (`effectQueries.ts:335`) is fully implemented and correct. `grep -rn isImmuneToTag src/` returns the definition, its re-export in `effects/index.ts`, and its test — **no production call site**. Twelve items advertise immunity to fear, bruise, poison, `#dissonance` and do nothing.
2. **Minimal honest wiring** — two guard calls, one at each condition-application site: `encounterAftermath.ts:2023` (`case 'apply_condition'`) and `effects/actionTriggerPayloads.ts` (`case 'condition_grant'`). Each is an early-return with a skip trace.
3. **Embedded design decision** — *does immunity block silently or narrate?* An item that says "you cannot be frightened" should probably produce a visible beat when it saves you, not a silent non-event. Also: *are the tags the condition node's `tags` or its trait subcategory?* Authored values mix `'fear'`/`'bruise'` (bare) with `'#dissonance'` (hashed) — the two condition-tag spellings need reconciling before the guard can match reliably.
4. **Retirement case** — no. **This is the single best effort-to-payoff ratio in the ledger**: a complete, tested query with 12 producers, two lines from live.
5. **Effort** — `small` (arguably `one-line` twice, once the tag-spelling question is settled).

---

**#49 `resource_manipulate` — PARTIAL** · 9 producers · effort `small`

1. **What is missing** — *executor arm empty* for `mode: 'one_shot'`. The `per_tick` arm is live (`effectTick.ts:487` → `tickResourceManipulate`, `effectTick.ts:359`). The doc comment there says one_shot "is handled by the event handler (`processEffectEvent`)" — **it is not**: `processEffectEvent`'s switch (`effects/effectEvents.ts:212`) handles only `stacking`, `reactive`, `until_event`, `transform`. There is no one_shot arm anywhere. Also `target: 'other_agent'` is explicitly skipped (`effectTick.ts:369`).
2. **Minimal honest wiring** — either a `resource_manipulate` case in `processEffectEvent` with a `consumed` flag on `EffectRuntimeState`, or fold one_shot into `resource_delta` (live), which already does exactly this at reward time.
3. **Embedded design decision** — *what fires a one_shot?* Unlike `resource_delta` (fires at reward instantiation), a one_shot on a worn item has no moment.
4. **Retirement case** — **plausible for the `one_shot` mode only**: `resource_delta` (live, 18 producers) is a one-shot resource mutation with a condition and a scope. Keeping `resource_manipulate` for `per_tick` and retiring its `one_shot` mode removes a duplicate without losing a shape.
5. **Effort** — `small`.

---

**#50 `hex_effect` — PARTIAL** · **0 producers** · effort `one-line`

1. **What is missing** — *producer absent*. The tick arm is implemented (`effectTick.ts:482` → `tickHexEffect`, `:330`), the `HexMutation` it produces is collected at `orchestrator.ts:2982` and handed to `phaseHexState`. The whole engine half is live and reachable. **No content authors it.** (The only `type: 'hex_effect'` string in `src/` outside the type file is the local parameter type at `effectTick.ts:330`.)
2. **Minimal honest wiring** — author one. Constraints are real and narrow: `mode: 'add'` only, numeric value only, and `property` must be one of `divineInfluence` / `corruption` / `explorationAttraction` (`HEX_EFFECT_VALID_FIELDS`, `effectTick.ts:276`).
3. **Embedded design decision** — none blocking; `radius` is declared and unread, which is a documented narrowing rather than a question.
4. **Retirement case** — no.
5. **Effort** — `one-line` (a content row). **The cheapest activation on the board.**

---

**#51 `graph_mutation` — DEAD** · **0 producers** · effort `one-line` (retire)

1. **What is missing** — *everything*. `grep -rn graph_mutation src/` returns exactly one hit: the interface declaration at `types/effects.ts:743`. No arm, no query, no producer, no test. It is type-only.
2. n/a.
3. **Embedded design decision** — the reason it should not be wired: a raw `add_edge`/`remove_node`/`set_property` primitive in the **content** vocabulary is an escape hatch that defeats every gate the effect system exists to provide (no tunability, no trace category, no fail-soft envelope). The engine already has a governed equivalent — the `GraphOp` vocabulary in `graphOpExecutor.ts`, with ~30 named, traced, cost-bearing operations.
4. **Retirement case — yes.** `GraphOp` subsumes it, deliberately and better.
5. **Effort** — `one-line`.

---

### Slot / interactive / capability (3)

**#52 `slot_bonus` — LIVE** · 7 producers. `attachmentSlotResolver.computeEffectiveSlotCaps:185` → `phaseSlotCaps.ts:66/104` → `orchestrator.ts:3117`.

**#53 `stat_contribution` — LIVE** · 76 producers. `effectQueries.collectStatContributions:102` → `domainCapability.ts:86`. The most-authored primitive after `passive`.

---

## Cross-cutting deadness (not union members, but they gate members)

Three things are dead that are not primitives, and each blocks several primitives at once:

**`EffectScope` (design-doc "type 24")** — `src/engine/effectScope.ts` (244 lines) has **zero importers** anywhere, including tests; its only mentions in `src/` are two description strings in `components/CMS/tunableConstants.ts`. The `scope?: EffectScope` field appears on ~20 primitives and is read by nothing. Every authored effect uses `scope: 'self'` or omits it, so nothing is currently mis-firing — but `suppress` (radius), `alter_terrain` (region), `modify_rules` (global) and `spawn` cannot be honestly wired beyond self-scope until this module is revived or deliberately retired. **This is a prerequisite, not a primitive.**

**`activateSpell`** — `spellActivation.ts:341` is exported and never called in production. Only `checkPrerequisites` (used by three live trait gates) and `resetConditionCounter` (imported by `orchestrator.ts:243`) are consumed from that module. `SPELL_TEMPLATES` is imported by exactly two consumers — `content-eval/collectAuthoredProse.ts` and `contentCensus/adapters.ts` — both of which read prose and count content; neither executes anything. **Every effect authored in `spell-templates.ts` is dead twice over.** That covers the only producers of `swap_reach`, `transfer`, `forced_move`, `dispel`, and half of `teleport`.

**Executor result channels** — `ExecutionResult` carries `terrainOverlays` and `ruleOverrides`, and both `executeEffect` call sites apply only `mutations`, ignoring the other two. Neither has a `GameState` field to land in. And the mutation applier itself (`orchestrator.ts:485-491`, `phaseDoom.ts:266-273`) handles four of the five `GraphMutation` kinds — **`update_property` is silently dropped**, which is the mutation `compel` emits.

---

## Sequencing

### Tier A — activate now, no human decision needed (3 primitives, ~1 session)

| Work | Unlocks | Effort |
|---|---|---|
| Author one `hex_effect` content row within the three valid fields | `hex_effect` | `one-line` |
| Delete `auto_succeed`, `outcome_shift`, `graph_mutation` from the union and their no-op cases | 3 retirements | `one-line` ×3 |
| `getActiveRuleOverride` calls for the 4–5 authored-but-inert rule keys | `modify_rules` from 2/13 → 6/13 keys | `small` |

### Tier B — one decision each, then cheap (4 primitives, ~1–2 sessions)

| Work | Blocked on | Unlocks | Effort |
|---|---|---|---|
| Two `isImmuneToTag` guards at the condition-application sites | *are condition tags bare or hashed?* | `tag_immunity` (12 producers) | `small` |
| `frozenUntilTick` on `EffectRuntimeState`, checked in `tickDuration`/`tickDecay` | *whose durations — bearer only?* | `freeze_duration` (6 producers) | `small` |
| `executeChoiceSet` call from `rewardPool`, AI modes only | *does `player` mode ride the beat registry or the aftermath picker?* | `choice_set` (6 producers) | `small` |
| `resolveAuraModifiers` call from `resolutionModifiers` | *roll channel or capability channel; do auras stack?* | `aura` (12 producers) | `small` |

### Tier C — the highest-leverage single change, but it is not the one THR-1228 named

THR-1228 proposed *"one row in `getReactiveTrigger` may unlock eleven at once."* **This is wrong on both halves, verified:**

- The **mapping is not missing.** `getReactiveTrigger` already maps four events. What is missing is that those four events are **never constructed** — only `encounter_outcome` and `doom_threshold` are raised anywhere in production. Adding a row mapping `encounter_outcome` to a reactive trigger would fire reactives, but no authored reactive uses a trigger that means "an encounter resolved".
- The **payloads would still be inert.** Of 22 authored `reactive` effects, ~17 nest `duration`, 3 nest `decay`, 1 `range_modifier`, 1 `reveal`, 1 `cascade`. `executeEffect` **explicitly no-ops all of those** (`effectExecutors.ts:735-770`). There is no mechanism to attach a transient modifier to an agent. So the eleven executor-backed primitives are not what reactive would unlock — and six of those eleven (`teleport`, `forced_move`, `transfer`, `destroy_structure`, `faction_manipulate`, and `spawn` in malformed form) are **trace-only stubs that return `mutations: []`**. They would not work with a live caller.

The genuinely highest-leverage change is instead: **give `executeEffect` a live caller and a transient-modifier attachment mechanism.** Concretely, the cheapest honest route is (a) raise `{ type: 'entered_hex' }` from `phaseMovement.ts:198`, where the hex is already in hand and a sibling trigger call already exists, and (b) implement the nested-modifier attachment so a fired `reactive` can grant a `duration` buff. That single pair makes `reactive` (22 producers) live, makes `cascade` live for free, and gives every remaining executor primitive a route to execution — after which each is a self-contained implementation task rather than a plumbing one.

### Tier D — blocked on a human decision, cannot be sequenced (9 primitives)

Each of these needs a named ruling before any wiring estimate is honest.

| Primitive | The decision, as a question |
|---|---|
| `consumable_charge` | What counts as a "use" that spends a charge? |
| `until_event` | What is "rest", "enter combat", "leave combat" on the tick loop? |
| `reactive` | What raises `damaged`? Do `attacked`/`cursed`/`blessed` get events or collapse? |
| `reveal` | Revealed *to whom* — the player's fog, or an agent's awareness? |
| `reroll` | Who decides to reroll — the engine (then it is `test_shaper`) or the player (then it is a new surface)? |
| `swap_reach` | Does the swap apply to the roll only, or also to eligibility and the forecast the player is shown? |
| `alter_terrain` | What does each of the ten named overlays actually do? |
| `compel` | What does each `CompelOverride` do to decision state — and is uncosted mind-control on-tone for a god-game? |
| `faction_manipulate` | Who pays a faction-held cost, and can a divine effect flip a rival's war status without its agency? |

Plus one cross-cutting ruling that gates four of the above: **is `EffectScope` revived or retired?** Nothing reads it today. If it is retired, `suppress`, `alter_terrain`, `modify_rules` and `spawn` are honestly self-scope-only and several of the Tier-D questions get simpler. If it is revived, `effectScope.ts` (244 lines, currently orphaned) is the starting point.

### Proposed retirements (decided in design, never silently)

| Primitive | Subsumed by | Confidence |
|---|---|---|
| `outcome_shift` | `test_shaper` (live, 11 producers) | high — 0 producers, strict subset |
| `auto_succeed` | `test_shaper` | high — 0 producers, strict subset |
| `graph_mutation` | `GraphOp` vocabulary (`graphOpExecutor.ts`) | high — 0 producers, type-only, and a governed equivalent exists |
| `create_barrier` | scoped `modify_rules{movement_cost_multiplier}` + negative `range_modifier` | medium — depends on the `EffectScope` ruling |
| `haste` / `slow` | `range_modifier.movementCostMultiplier` and/or `modify_rules{cooldown_multiplier}` | medium — depends on whether an action economy is wanted |
| `forced_move` | `teleport` with `destination`/`range` | medium — 1 producer, in a doubly-dead file |
| `resource_manipulate` mode `one_shot` | `resource_delta` (live) | high — mode only, `per_tick` stays |
| `modify_rules{awareness_range_bonus}` and `{movement_cost_multiplier}` | `range_modifier` (live) | high — exact duplicates |
| `modify_rules{encounter_reach_override}` **or** `swap_reach` | each other | high that one must go; open which |
| `dispel{condition}` | `action_trigger{condition_remove}` (live) | medium |

---

## Corrections to the THR-1228 starting hypothesis

1. **The vocabulary is 53 primitives, not 47.** Mechanically counted from the `AttachmentEffect` union.
2. **The eleven "reactive-gated executors" are not merely gated.** `executeEffect` has no reachable caller at all, and six of the named executors (`teleport`, `forced_move`, `transfer`, `destroy_structure`, `faction_manipulate`, plus `spawn`'s malformed node) are trace-only stubs returning `mutations: []`. Opening the gate would execute nothing.
3. **"One row in `getReactiveTrigger`" is not the lever.** The mapping already covers four triggers; the events are never raised. And the authored reactive payloads are overwhelmingly modifier effects that the executor explicitly no-ops.
4. **`aura` has 12 producers, not zero.** The failure is on the consumer side: `effectAura.ts` is imported only by its own test.
5. **`modify_rules` is 11 of 13 keys inert, not 12 of 13.** Both `encounter_difficulty_modifier` and `doom_rate_multiplier` have live consumers (the latter via a direct inline scan in `phaseDoom.ts:298` that bypasses the query helper).
6. **The explicit no-op arm is 10 names but the failure differs across them.** `reveal`, `suppress`, `reroll`, `swap_reach`, `create_barrier`, `haste`, `slow`, `freeze_duration` have authored producers and no implementation; `auto_succeed` and `outcome_shift` have **zero producers** and are retirement candidates, not wiring candidates.
7. **New, and not in the hypothesis: `activateSpell` has no production caller.** The design doc names it as one of three integration points. Everything authored in `spell-templates.ts` is dead twice over.
8. **New: `EffectScope` is entirely dead** — `effectScope.ts` has zero importers, so the `scope` field on ~20 primitives is inert. This is a prerequisite for four of the dead primitives.
9. **New: `update_property` mutations are silently dropped** by both `executeEffect` appliers, which is the mutation `compel` emits.
10. **New: `until_event` is partial, not live.** Its expiry arm is reachable, but all five authored producers use unreachable events, so five items grant a permanent bonus that was authored as temporary.
11. **New: `hex_effect` is fully wired end-to-end with zero content.** It is the only primitive where authoring one line makes it live.

---

## Counts

| State | Count | Primitives |
|---|---|---|
| **Live** | 22 | `passive` `duration` `permanent` `cooldown` `conditional` `trait_grant` `transform` `stacking` `decay` `tradeoff` `test_shaper` `prevent_loss` `content_grant` `resource_delta` `action_trigger` `behavior_weight` `social_modifier` `action_gate` `axiological_drift` `range_modifier` `slot_bonus` `stat_contribution` |
| **Partial** | 5 | `consumable_charge` `until_event` `modify_rules` `resource_manipulate` `hex_effect` |
| **Dead** | 26 | `aura` `reactive` `teleport` `forced_move` `reveal` `spawn` `dispel` `suppress` `auto_succeed` `reroll` `swap_reach` `outcome_shift` `choice_set` `alter_terrain` `create_barrier` `transfer` `haste` `slow` `freeze_duration` `compel` `create_structure` `destroy_structure` `faction_manipulate` `cascade` `tag_immunity` `graph_mutation` |

| Effort band | Count |
|---|---|
| `one-line` | 3 (`hex_effect`, plus 3 retirement deletions counted as one line each) |
| `small` | 7 (`tag_immunity` `freeze_duration` `choice_set`(AI) `aura` `dispel` `suppress`(self) `cascade`, plus `modify_rules` per key) |
| `real work` | 21 |
| **Blocked on a human decision** | **9** (+1 cross-cutting: revive or retire `EffectScope`) |
| **Proposed for retirement** | 4 whole primitives (`outcome_shift` `auto_succeed` `graph_mutation` `create_barrier`) + 2 conditional (`haste`/`slow`, `forced_move`) + 1 mode + 3 rule keys |
