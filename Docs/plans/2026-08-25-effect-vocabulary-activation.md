> **title:** `Effect Vocabulary Activation — THR-1239`
> **linear_issue:** THR-1239
> **author:** `Claude Code`
> **created:** 2026-08-25
> **three_pillars:** Engine `done` · Content `done` · UI `N/A — no new player-facing surface; new behavior surfaces through existing chips, prose, and the trace viewer`

# Effect Vocabulary Activation — THR-1239

*Make every effect primitive in the union genuinely execute on the live path — or consolidate it into the mechanism that already does — so the powers and item generators design against an honest vocabulary.*

## Why this is load-bearing

The director ruled (chat, 2026-08-25, recorded on the Powers & Spellcraft wayfinder map THR-1226): **"please extend to all the primitives first."** The activation ledger (THR-1237 resolution comment) measured the gap: the `AttachmentEffect` union has **53 members** and only ~21 execute on the live path. The whole executor family (teleport, spawn, compel, cascade, …) is dead for want of a single event raise; `consumable_charge` charges are never spent; executor-produced terrain overlays and rule overrides are computed and discarded; 11 of 13 rule-override keys are inert — including two (`death_prevented`, `awareness_range_bonus`) with shipped content silently doing nothing. Until this lands, both generator prototypes (THR-1232, THR-1236) would author content that lies to the player — the THR-844 failure class — and the spell-system design ratified on the map (map spells: travel/sight/mark) has no substrate to land on.

This plan governs a **six-stage program**: THR-1239 (stage 1, this issue) → THR-1240 → THR-1241, with THR-1242/THR-1243/THR-1244 fanning out behind their blockers. One plan doc, six executor tickets, `blockedBy` relations already wired in Linear.

**Extend-all reading (decide-and-invite-veto, standing since 2026-08-25 chat):** every *capability* goes live; duplicate *spellings* are consolidated into the live mechanism with content migrated. Nothing a player could feel is lost.

Primary sources (wayfinder decision tickets — zoom there for the original exchanges):
- Ledger: [THR-1237](https://linear.app/threadbare/issue/THR-1237/per-primitive-activation-ledger-what-live-means-for-every-dead-or) — per-primitive table, corrections, build sequence.
- Substrate inventory: [THR-1228](https://linear.app/threadbare/issue/THR-1228/substrate-inventory-what-the-generic-effect-system-already-gives).
- Spell-system rulings (why map spells need overlays + `entered_hex`): [THR-1230](https://linear.app/threadbare/issue/THR-1230/what-is-a-power-to-the-player-ratify-the-power-objects-shape).

## Substrate inventory

This plan **activates and consolidates** an existing subsystem — it green-fields nothing. The generic effect system (2026-03-31, `Docs/plans/2026-03-31-generic-effect-system-design.md`) is listed in `Docs/canon/systems-inventory.md` (modules `effects/*`, `effectExecutors`, `effectResolver`, `effectTick`, `spellActivation`); its modifier/query/tick family is ACTIVE, its executor family and spell activation are DORMANT. Every change below either raises an event the existing dispatch already consumes, persists a result the existing executors already produce, adds a read for a key the existing store already holds, or migrates content onto a mechanism already live. The three deleted types are zero-reference. Nothing in this plan builds a system the inventory already lists — it is the THR-614 activation pattern applied to the effects vocabulary.

## Engine pillar

### Systems design

Six stages; each is one executor ticket. File:line refs are from the ledger (verified 2026-08-25, `main`).

**Stage 1 — THR-1239: honesty guards + event raises + consumables.**
1. `executeEffect` exhaustiveness: add the 13 missing modifier-family types to the fallthrough arm (`effectExecutors.ts:761-770`), replace the `default` arm (`:771-777`) with a `const _exhaustive: never = effect` guard so any future union member without a case is a compile error, not a silent `success: false`.
2. Raise `entered_hex` at movement arrival (`phaseMovement.ts:149`, walker + seeded PRNG already in scope at `:192-196`). **Decided: fires on final arrival only** — not per hex step, not on sublocation moves within the same hex. Reactive spells trigger on meaningful relocation; per-step firing multiplies event volume ~4× for zero design gain.
3. Raise `combat_started` / `combat_ended` at battle create/resolve (`battleResolution.ts:89` / `:405`). **Decided: audience is battle participants only** — commanders and member agents of the armies in the battle, not same-hex bystanders. Bystander coupling is a later design if wanted.
4. `consumable_charge`: decrement where the effect walker already runs in step resolution (`unifiedActionResolution.ts:~2301`). **Decided: one charge is spent when the bearer completes an encounter step whose reach matches the charge's `onUse` reach; always auto-spend.** Clamp at 0; existing destroy-on-empty branch (`effectTick.ts:467`) becomes reachable.
5. `resource_manipulate` one_shot: add the case to `processEffectEvent` with a `oneShotFired` flag on `EffectRuntimeState` (`types/effects.ts:954`). **Decided: fires on the bearer's first `encounter_outcome` event after attach; `target: 'other_agent'` resolves to the encounter counterpart, else skips fail-soft.** Delete the stale comment at `effectTick.ts:357` claiming this already happens.

**Stage 2 — THR-1240: persistence.** Executor-produced `ActiveTerrainOverlay` / `ActiveRuleOverride` (`effectExecutors.ts:258`, `:433`; surfaced on `ExecutionResult:85,87`) currently discarded by both consumers (`orchestrator.ts:484-495`, `phaseDoom.ts:262`). Add `GameState.activeTerrainOverlays` (hex-keyed) and `GameState.activeRuleOverrides` (agent-keyed); drain from `ExecutionResult` at the two consumer sites the way `pendingHexMutations` drains (`orchestrator.ts:3006-3008,3527`); expiry decremented in the effect-tick phase. **Decided: GameState collections, not node properties** — overlays are transient rule-state, not world facts; keeps the graph clean and the drain symmetrical with the existing pattern. Overlay apply/expire calls `touchWorld()` so UI selectors see it; a terrain overlay that alters movement additionally calls `touchStructure()` (distance matrix invalidation).

**Stage 3 — THR-1241: rule-override consumers.** One `getActiveRuleOverride` read per inert key at its owning site (`death_prevented` → agent lifecycle; `movement_cost_multiplier` → `movementCost.ts`; `awareness_range_bonus` → `encounterAwareness.ts`; executor enumerates the remaining keys from `RuleOverrideKey` in `types/effects.ts`). **Decided stacking semantics: multiplicative for `*_multiplier` keys, additive for `*_bonus` keys, boolean-OR for flag keys (`death_prevented`).** The existing inline `doom_rate_multiplier` scan (`phaseDoom.ts:295-301`) is migrated onto `getActiveRuleOverride` so there is one read path.

**Stage 4 — THR-1242: consolidation (Group E).** Retire zero-ref types (`graph_mutation`, `outcome_shift`, `auto_succeed`) from the union. Migrate content: `reroll` (3 refs) → `test_shaper`; `swap_reach` (1 ref) → `encounter_reach_override` rule key; `haste`/`slow`/`freeze_duration` (13 refs) → rule-override keys (movement/cooldown/duration multipliers); `create_barrier` (5 refs) → `alter_terrain` + overlay. Wire `reveal` (exploration/fog state at `phaseMovement.ts:164-168`) and `suppress` (set the honored-but-never-set `runtimeState.suppressed`, read at `phaseDoom.ts:296`). Wire `tag_immunity` (`isImmuneToTag`, `effectQueries.ts:335`) at condition infliction. **Decided: canonical tag namespace is `#`-prefixed** (matches reward tag filters); comparisons normalize by stripping `#`; the UL entry for the tag namespace rides this ticket. **Decided: `choice_set` is a player-only surface primitive** — excluded from the agent-facing live vocabulary and from generator envelopes; the type is retained for the existing GameView nested-choice use and documented as such. Retiring a primitive deletes or repoints its asserting tests (interface-map rule — green tests on a dead contract are the pathology).

**Stage 5 — THR-1243: aura.** Wire `resolveAuraModifiers` (`effectAura.ts`) into resolution-modifier collection (`resolutionModifiers.ts`, alongside the `getActiveRuleOverride` read). **Decided: computed lazily at resolution time, never a per-tick proximity scan.** Positions from `located_at` resolved to hex; radius and stacking cap are named constants.

**Stage 6 — THR-1244: damaged/healed proxy.** There is no per-agent damage model. **Decided: condition-based proxy** — `damaged` fires when a harmful condition (wound/disease/curse subfamily) is inflicted; `healed` fires when one is removed before natural expiry. Raised at the condition infliction/removal sites (`conditionDecay.ts` and aftermath condition application). Unlocks the `damaged`/`healed` reactive triggers, `on_damaged`/`on_heal` stack triggers, `take_damage` expiry.

**Deliberately NOT in this program** (stays fog on the map / future events): `rest`, `enter_territory`/`leave_territory`, `faction_change`, `dawn_cycle` expiry events (no `EffectEvent` variant exists; territory semantics undefined); `attacked`/`cursed`/`blessed`/`ally_damaged` reactive triggers (no source event; `ally_damaged` needs relationship fan-out the event system has no shape for). These stay declared-but-documented; the `never` guard does not cover event vocabulary, only effect types.

### Graph nodes / edges

None added or modified. Overlays and rule overrides live on `GameState`, not the graph (decided above). No new node or edge types — this is the additive direction (NFP #6) and avoids the new-node-type design gate entirely.

### Tick phases

- Event raises: movement phase (arrival), battle resolution (create/resolve), condition infliction/decay sites — all existing phases; no new phase.
- Overlay/override expiry: existing effect-tick phase (`phaseEffectTick`), same place durations/cooldowns already tick.
- Reactive dispatch: unchanged — `orchestrator.ts:478-495` already dispatches `reactivesFired` and applies mutations fail-soft.

### Resolution logic

No scoring changes. Rule-override reads are point lookups at owning sites; aura modifiers aggregate at resolution with the existing modifier cap (`EFFECT_MODIFIER_CAP`) applied after aggregation.

### PRNG callouts

- `entered_hex` reactive rolls reuse the seeded `mulberry32` already in scope at `phaseMovement.ts:192-196`.
- Battle-event reactive rolls: seed idiom `state.seed + tick * <prime> + hashString(agentId)` per the established pattern (`orchestrator.ts:451`, `phaseDoom.ts:245`); pick an unused prime.
- No `Math.random()` anywhere; `action_trigger` probability already rolls against an injected roll.

## Content pillar

No new content is authored; the pillar's work is **migration** so existing content stops lying.

### Encounter templates

None added or edited. Encounter-borne effects flow through the same primitives; no template names a retired spelling (verified in the ledger's ref counts — all migrating refs live in attachment catalogs).

### Prose tables

None. `narrativeTemplate` strings on migrating effects are carried over verbatim — the prose a player sees does not change, only the mechanism underneath it.

### Attachment content

Stage 4 migrates ~22 existing catalog refs from dead spellings to live mechanisms: `reroll` (3) → `test_shaper`, `swap_reach` (1) → `encounter_reach_override`, `haste`/`slow`/`freeze_duration` (13) → rule-override keys, `create_barrier` (5) → `alter_terrain` + overlay. Same player-facing meaning, now true. The two rule-key contents that currently lie (`death_prevented` at `reward-attachment-catalog.ts:2186`, `awareness_range_bonus` at `:2417`) become honest via stage 3 with no content edit. The stray off-union `lossCondition: 'durable'` (`reward-attachment-catalog.ts:2526`) is corrected to `breakable` in the same pass.

### Data tables

No `world-model.json` changes. New constants land in `src/data/effect-constants.ts` (Constants table below); the two existing advisory caps there are promoted to enforced.

## UI pillar

UI: N/A — no new player-facing surface. Newly-live effects surface through existing channels: encounter prose, aftermath chips, the trace viewer, and the attachments sheet. All six stages are engine-only (`src/engine/`, `src/types/`, `src/data/` migrations); no file under `src/components/`, `src/hooks/`, `src/contexts/`, or `src/index.css` is touched, so browser-verify is not triggered — each stage states `Browser-verify exempt: engine-only change, no UI-pillar files touched` in its commit body. Debug inspection: new traces appear in the existing trace viewer once categories are registered (see Tracing).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `phaseMovement` (entered_hex raise) | movement | — | — | `effect.event_raised` | trace viewer |
| `battleResolution` (combat events) | battle phases | — | — | `effect.event_raised` | trace viewer + war readout |
| `unifiedActionResolution` (charge spend) | resolution | existing chips | `effectStates` | `effect.charge_spent` | trace viewer |
| `effectEvents` (one_shot) | event processing | — | `effectStates.oneShotFired` | existing `effect_reaction` | trace viewer |
| orchestrator drain (overlays/overrides) | post-event apply | — | `activeTerrainOverlays`, `activeRuleOverrides` | `effect.overlay_applied` / `effect.overlay_expired` | trace viewer |
| owning-site consumers (stage 3) | respective phases | — | reads `activeRuleOverrides` | `effect.rule_override_consumed` | trace viewer |
| `resolutionModifiers` (aura) | resolution | — | — | existing modifier traces | trace viewer |
| condition sites (damaged/healed) | condition phases | — | — | `effect.event_raised` | trace viewer |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `OVERLAY_DEFAULT_DURATION_TICKS` | `24` | Lifetime of a terrain overlay / rule override with no explicit duration (2 in-game days) |
| `AURA_RADIUS_HEXES` | `1` | Hex radius an aura reaches beyond co-location |
| `AURA_STACKING_CAP` | `3` | Max distinct aura emitters aggregated per resolution |
| `CONSUMABLE_CHARGE_SPEND_PER_STEP` | `1` | Charges spent per matching-reach step completion |
| `RULE_OVERRIDE_VALUE_CAP` | `3.0` | Clamp on any aggregated multiplier-key value (fail-soft against stacking runaway) |
| `MAX_EFFECTS_PER_ATTACHMENT` | `6` (existing) | Promoted from advisory to enforced at the walker boundary in stage 4 |
| `ACTION_TRIGGER_MAX_PER_ATTACHMENT` | `2` (existing) | Same promotion |

## Tracing

New category `effect_event` (register at **all four** trace-category sites — `types/trace.ts` carries two, plus the registration pair; see Notes for the executor).

```ts
// EffectEventRaisedTrace — emitted when a production site raises an EffectEvent
interface EffectEventRaisedTrace {
  type: 'effect.event_raised';
  event: string;          // 'entered_hex' | 'combat_started' | 'combat_ended' | 'damaged' | 'healed'
  agentId: string;
  tick: number;
  reactivesFired: number; // how many reactive effects the event triggered
}

// EffectOverlayTrace — emitted on overlay/override apply and expire
interface EffectOverlayTrace {
  type: 'effect.overlay_applied' | 'effect.overlay_expired';
  kind: 'terrain' | 'rule';
  key: string;            // hex "col,row" or agentId
  sourceEffectId: string;
  ticksRemaining: number;
}

// EffectChargeSpentTrace — emitted when a consumable charge is decremented
interface EffectChargeSpentTrace {
  type: 'effect.charge_spent';
  attachmentId: string;
  bearerId: string;
  chargesRemaining: number;
  destroyed: boolean;
}

// RuleOverrideConsumedTrace — emitted when an owning site reads a non-neutral override
interface RuleOverrideConsumedTrace {
  type: 'effect.rule_override_consumed';
  key: string;            // RuleOverrideKey
  agentId: string;
  value: number | boolean;
  site: string;           // owning-site tag, e.g. 'movementCost'
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Event raised for a missing/dead agent | skip, no trace spam (one debug-level line) |
| Overlay targets a hex outside the map | drop with `effect.overlay_expired` trace (`ticksRemaining: 0`) |
| Unknown `RuleOverrideKey` at a consumer | neutral value (1.0 multiplier / 0 bonus / false flag), continue |
| Charge decrement on already-0 charges | clamp at 0, destroy path runs once, never negative |
| `one_shot` target `other_agent` with no encounter counterpart | skip fail-soft, `oneShotFired` still set (no retry loop) |
| Aura emitter with unresolvable position | excluded from aggregation, continue |
| Future union member without an executor case | **compile error** via the `never` guard — the one deliberate non-runtime failure |
| Mid-migration content ref to a retired type | stage 4 migrates content and type in the same PR; the `never` guard plus `npm test` catch stragglers at build time |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 345 importers | Stage 2 adds two optional collections — additive only, no existing field changes; consumers that ignore them are unaffected |
| `src/types/effects.ts` | (not on the ≥100 list, but the program's center) | Stage 4 removes three zero-ref union members and migrates ~22 content refs; the `never` guard turns any missed consumer into a compile error rather than a runtime surprise |

## Interface impact

| Contract | Verb | Note |
|---|---|---|
| `EffectEvent` producers → `processEffectEvent` | extend | Three new production raise sites (movement, battle, conditions); consumer unchanged |
| Executor results → GameState overlays/overrides | add | New cross-system write; production read sites named: `movementCost.ts` + encounter difficulty (overlays), stage-3 owning sites (overrides) |
| `getActiveRuleOverride` → owning sites | extend | 11 new consumers; `phaseDoom` inline scan migrated onto the same read path |
| Dead primitive spellings (`graph_mutation`, `outcome_shift`, `auto_succeed`, `reroll`, `swap_reach`, `haste`, `slow`, `freeze_duration`, `create_barrier`) | retire | Asserting tests deleted or repointed in the same PR (interface-map rule) |
| `resolveAuraModifiers` → `resolutionModifiers` | add | Read site is resolution-time modifier collection |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (migration, no new authoring)
- [x] UI pillar N/A with rationale
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it is the precondition for "systemically alive content" (generated spells/items whose effects are real), and fail-soft dread (transgression pricing, doom notice) depends on the doom/notice keys going live.

## Rulebook impact

- [x] This plan changes rules of play in two small ways, updated in the same PRs: stage 1 makes consumable charges actually deplete (rulebook items line gains `[IMPL]`), stage 2 makes persistent marks on hexes real (rulebook gains a `[IMPL]` line for lasting local effects). Each stage's executor updates `Docs/canon/rulebook.md` in its own PR.

> Brainstorm companion: `Docs/plans/2026-08-25-effect-vocabulary-activation-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 7 named constants (table above); stacking semantics per key class, not per call site |
| 2. Inspectability | PASS | 4 new trace shapes; every event raise, overlay lifecycle, charge spend, and override read traces |
| 3. Determinism | PASS | All rolls seeded via shared `mulberry32`; eager-evaluation rule respected (no draw-count dependence on optional inputs) |
| 4. Fail-soft | PASS | Table above; the only hard failure is compile-time by design |
| 5. Narrative over mechanical perfection | PASS | Consolidation preserves content meaning (a "haste" item still hastens — via a live key); condition-proxy for damaged keeps story-shaped wounds rather than inventing HP |
| 6. Additive over destructive | PASS with note | Stages 1–3, 5–6 purely additive. Stage 4 deletes three zero-ref types and migrates 22 refs — destructive by design, per the ratified extend-all reading; the `never` guard bounds the risk |
| 7. Performance budget | PASS | Aura is lazy at resolution (no per-tick scan); event raises are O(participants); overlay maps are small and hex/agent-keyed |

## Done when

- [ ] Stage 1 (THR-1239): a seeded medium CLI run reaches tick 30 with ≥1 `effect.event_raised` trace for `entered_hex`; a `reactive`-carrying test attachment fires through `executeEffect`; `consumable_charge` decrements and destroys at 0 in a unit test; the `never` guard compiles
- [ ] Program exit criterion (mirrors THR-614's shape): *an agent bearing a reactive test attachment triggers it on hex arrival at a deterministic tick on seed 42 medium, visible in traces* — stage 1 proves it; later stages each add their own Done-whens from this doc's decided semantics
- [ ] `npm test` and `npx vite build` pass; types via `npm run check:typecheck` (ratchet — re-run last before push, THR-976); engine smoke (30-tick CLI) pasted per Definition of Done step 7
- [ ] Closing commit body includes the stage's own `Fixes` line (one issue per stage PR)
- [ ] `Browser-verify exempt: engine-only change, no UI-pillar files touched` in each stage's commit body

## Kill criteria

- If stage 1's exit criterion (deterministic reactive fire on hex arrival, seed 42 medium, visible in traces) cannot be met without touching the encounter pipeline's hot path, the event-raise placement is wrong — stop, re-open placement as a map decision ticket rather than forcing it.
- If stage 4's migration turns up a dynamic (string-keyed) consumer of a retired type that fail-soft masks, halt the retirement half and keep the type until the consumer is mapped.
- If tick-time regresses measurably (>10% on the 30-tick medium smoke) after stage 2, the overlay drain is misplaced — profile before proceeding to stage 3.

## Coordination block

**Suggested model:** opus for stages 1, 2, 4 (cross-cutting engine surgery); sonnet for 3, 5, 6 (enumerated wiring against decided semantics). Advisory; CC automation runs Opus regardless.

**Parallel-safe with:** anything outside the effects engine cluster (`src/engine/effects/*`, `effectExecutors.ts`, `effectTick.ts`, `effectResolver.ts`, orchestrator effect phases, `types/effects.ts`) and the stage-specific owning sites.

**Mutex with:** the other five stages of this program (shared files; `blockedBy` chain enforces order — THR-1239 → THR-1240 → THR-1241, and THR-1242/1243/1244 behind their blockers).

**Files to touch (stage 1):**
- Edit: `src/engine/effectExecutors.ts` (fallthrough + `never` guard)
- Edit: `src/engine/phases/phaseMovement.ts` (raise `entered_hex` on arrival)
- Edit: `src/engine/battleResolution.ts` (raise combat events)
- Edit: `src/engine/unifiedActionResolution.ts` (charge spend at the walker site)
- Edit: `src/engine/effects/effectEvents.ts` (`resource_manipulate` one_shot case)
- Edit: `src/types/effects.ts` (`oneShotFired` on `EffectRuntimeState`), `src/types/trace.ts` (+ the other trace registration sites)
- Edit: `src/engine/effectTick.ts` (delete stale comment at `:357`)
- Edit: `Docs/canon/rulebook.md` (consumables `[IMPL]` line)
- Create: tests per touched behavior (contract test for the `never` guard is the compile itself)

## Notes for the executor

- **Trace categories register in FOUR places** — grep the existing `effect_reaction` category to find all four; missing one yields silently-dropped traces.
- **`effectStates` convention:** follow copy-then-assign, do not mutate the map in place (the dormant `activateSpell` mutates in place — that is a known wart, not a precedent).
- **Graph mutations outside `setGameState`;** overlay apply/expire must call `touchWorld()`, movement-affecting overlays also `touchStructure()`.
- **Do not add rows to `getReactiveTrigger`** — the mapping already exists for all four events; the work is raising the events. (The substrate inventory's "add a row" framing was corrected by the ledger.)
- **Event audience for battles:** participants only. Resist widening to same-hex agents; that is a design decision deliberately not taken.
- Stage 4 only: `nudgeGrantLiveness` and the stat-band contract test sweep static catalogs — after migration, re-run both; they are the drift guards for the content you touched.
- Engine smoke (Definition of Done step 7) applies to every stage: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-25*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 7 named constants tabled; stacking semantics declared per key-class (multiplicative/additive/boolean-OR), not per call site |
| 2. Inspectability | PASS | 4 new trace interfaces defined; wiring table maps every stage to a trace category and debug-visibility surface; explicit all-four-sites registration note |
| 3. Determinism | PASS | Reuses in-scope seeded `mulberry32`; battle-event rolls follow the established `seed + tick*prime + hashString(agentId)` idiom; no `Math.random()` |
| 4. Fail-soft | PASS | 8-row fail-soft table; only exception is a compile-time `never`-guard error, consistent with the NFP's intent |
| 5. Narrative over mechanical | PASS | Consolidation preserves player-facing meaning; damaged/healed uses a condition-based proxy rather than an HP stat |
| 6. Additive over destructive | PASS-with-note | Stages 1–3, 5–6 purely additive. Stage 4 deletes 3 zero-reference union members and migrates ~22 content refs — destructive-by-design under the director's ratified extend-all reading, bounded by the `never` guard |
| 7. Performance budget | PASS | Aura lazy at resolution (per-tick scan explicitly rejected); event raises O(participants); small keyed maps |

NFP AUDIT: PASS-with-notes (NFP 6 — stage 4's deletions are deliberate and justified, not oversight)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All five required subsections present with concrete file:line specs, six staged changes, named constants |
| Content | present-but-thin* | Migration-only content correctly described; four template subsections were absent at audit time — *added post-audit in the same session (Encounter templates / Prose tables / Attachment content / Data tables now present)* |
| UI | N/A-with-rationale | Explicit one-line reason — acceptable |

Wiring check: yes — table maps each touched module to phase, GameState field, trace, debug visibility. Substrate-existence check (THR-658): `## Substrate inventory` present; activation of the existing generic effect system, no green-field duplication.

PILLAR AUDIT: PASS-with-notes (Content subsections — resolved inline before commit)

### Vision audit

Premises touched: "Narrative over mechanical perfection" [confirmed]; "Everything is a graph node/edge" [confirmed — overlays deliberately GameState rule-state, argued]; "Additive over destructive" [extended — stage 4 flagged and bounded]; "Three pillars always present" [confirmed — UI N/A per the exception clause]. No contradictions found. North star: neutral (substrate precondition for future spell/item content). Core loop: unaffected. Taste profile: clear — no new UI, no numbers exposed.

VISION AUDIT: PASS

### Intent-judge

First run: **Revise** (two mechanical findings — missing `## Substrate inventory` heading, kill criteria only in the proposal). Both applied same session. Re-run: **Allow** — 11/11 dimensions PASS, impact class Reversible confirmed, 0 GAPs, 0 VIOLATIONs. Judge highlights: intent fidelity PASS ("capability-vs-spelling is the *how* of an agreed outcome — decide-and-invite-veto standing rule; no silent scope widening"); substrate dimension PASS ("the THR-614 pattern applied, not violated"). Judge-metrics row: Verdict Allow · Reversible · Findings 11 · Overridden no.
