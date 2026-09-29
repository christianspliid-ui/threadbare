> **title:** The power runtime — spells carried and cast — THR-1571
> **linear_issue:** THR-1571
> **author:** Claude Code (design lane, run 2026-09-29a)
> **created:** 2026-09-29
> **three_pillars:** Engine `done` · Content `done — the five shipped spells get agency, arena and cast lines; two fate-woven spells ported from the prototype; eight innate powers` · UI `done — the cast shows as a named line on the step's odds, a line in the afterimage and chips for what it wrote`

# The power runtime — spells carried and cast — THR-1571

*Today no mortal in the world holds a spell, and a spell that is cast does nothing but charge its price. After this plan the world's priests, healers and scholars start with a spell from their tradition. A caster reaches for it when the odds turn bad, and the god sees it on the step: "casting Hollow Crown". The same roll that decides the step decides the spell. A landed spell does what it says. A miscast leaves the caster strained, cursed or thrown across the map, as the spell's price says it may.*

## Why this is load-bearing

The Powers & Spellcraft map ([THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)) closed on 2026-09-24 with two plan docs, and its closing comment says to build this one first: *"a generated spell needs a runtime to be seen."* Its destination is **a spellcaster carries spells and casts them in threaded encounters, visibly**, with prose, cost and consequence.

Measured on `origin/main` 2026-09-29 (seed 42, medium, CLI `eval` after `tick 30`):

```
{"actors":599,"spellDefs":5,"bestowedDefs":34,"wieldSpell":0,"holdBestowed":9,"knowsSpell":0,"divineGift":0,"anyPower":9}
```

- **No one knows or wields a spell.** The only writer of `knows_spell` and spell `has_trait` edges is `create × Power` (`learn_spell`, `src/data/undertaking-objects.ts:2304-2330`). It needs a caster in the deciding tier, and on seed 42 **one** of the 104 casters is a `spotlight` actor (union by tier at tick 0: `{"spotlight":1,"ambient":103}`).
- **The nine powers that are held cannot be cast.** They are `bestowed` traits from tier promotion and rewards. None carries a `spellTemplateId`, so `use × Power` looks up `node.id`, finds no template, and fails `no_spell_template:<id>`.
- **A cast that does run applies nothing.** `activateSpell` (`src/engine/spellActivation.ts:407`) has one live caller, `POWER.verbs.use` (`undertaking-objects.ts:2436`). It reads only `outcome.outcome` and `outcome.soulPrice` (:2437-2458) and drops `appliedEffects` and `backlashEffect`.

So the Powers family has a shape (THR-1429), a price path (FB3's `spell_price` split, `src/engine/phaseQuintessence.ts:120-128`), a fight vocabulary (FB6: `inflict_condition`, `resource_manipulate 'fight_clock'`) and a learning cell, and no runtime between them. This plan is that runtime.

**Settled input — not reopened here** (each is cited where the plan uses it):

- **[THR-1228](https://linear.app/threadbare/issue/THR-1228/substrate-inventory-what-the-generic-effect-system-already-gives), the substrate.** `activateSpell` is complete if called, and its caller must apply the effects.
- **[THR-1229](https://linear.app/threadbare/issue/THR-1229/where-does-casting-plug-in-decision-hook-and-spellcaster-identity), where casting plugs in.** A cast is an encounter step, not a new surface. Raise `'spell_cast'` at resolution. Route `appliedEffects` into the live executor, never a new aftermath kind. Compose the caster predicate from existing parts.
- **[THR-1230](https://linear.app/threadbare/issue/THR-1230/what-is-a-power-to-the-player-ratify-the-power-objects-shape), the five rulings:** tiered agency (most magic fate-woven, a marked few deliberate); an arena spanning encounters and the map; a layered per-spell price (free → strain → gamble → transgression); one earned caster badge with tradition shelves; casts nudgeable, spells grantable.
- **[THR-1231](https://linear.app/threadbare/issue/THR-1231/how-does-an-entity-come-to-hold-a-power-acquisition-channels), acquisition.** Five shallow channels; known spells unlimited, wielded spells slot-capped (`SLOT_CAPS.spell = 3`).
- **[THR-1233](https://linear.app/threadbare/issue/THR-1233/name-the-system-powers-vs-effects-vs-the-attachment-vocabulary-ul) / [THR-1238](https://linear.app/threadbare/issue/THR-1238/ul-proposal-power-family-power-spell-bestowal-innate-power-reconcile):** the family is **Powers**: spell, bestowal, innate power.
- **[THR-1237](https://linear.app/threadbare/issue/THR-1237/per-primitive-activation-ledger-what-live-means-for-every-dead-or) and the activation program ([THR-1239](https://linear.app/threadbare/issue/THR-1239/effect-activation-1-exhaustiveness-guard-entered-hex-combat-events) to [THR-1244](https://linear.app/threadbare/issue/THR-1244/effect-activation-6-damagedhealed-proxy-events)):** the live effect vocabulary, one spelling per capability.
- **The Physical Conflict seams ([THR-1530](https://linear.app/threadbare/issue/THR-1530/spells-and-powers-in-a-fight-one-effect-vocabulary), [THR-1268](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster)):** a cast is played on an exchange; it reaches the fight through the clock, `inflict_condition` and the fight events; a monster is a class of Mortal, and `createNamedElite` is where innate powers are stamped.
- **[THR-1232](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to), the spell prototype** ([twenty generated spells](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-24-twenty-generated-spells.md)): its eleven engine gaps are this plan's precondition list.
- **[THR-1562](https://linear.app/threadbare/issue/THR-1562/ambition-reach-floors-and-reach-milestones-compare-raw-capability-10), reach on one scale (shipped 2026-09-24).** `minReach` and the `reach_drain` affordability check now read the reach share (`spellActivation.ts:109-111`, :178). Its "Not done" list hands this plan the payment: *"THR-1571: the `reach_drain` payment still writes the dead singular property."*

**Decided in this plan by the design lane under delegation** (process.md rule 4, 2026-09-11). Each is marked *Lane decision* where it appears, and each can be vetoed in chat:

1. The step's own band decides a cast; there is no second die.
2. The mortal decides to cast, by a rule over their own pre-card forecast and their courage.
3. World-map casts ride the existing `use × Power` cell. There is no new `'cast'` DecisionFamily.
4. Strain is paid as a timed "strained" condition on the Reach.
5. Seeded knowing gives every caster one spell at worldgen.
6. Carried (fate-woven) effects are limited to stateless primitives for now.
7. `dispel` removes the bearer's edge and suppresses items, never deletes a node.
8. Innate powers are a new Power class, one per monster family.

The brainstorm companion records the options weighed for each.

## Substrate inventory

Measured 2026-09-29 against `origin/main` (grep + read + one CLI census; line numbers are that tree's).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Spell activation:** `activateSpell` (`spellActivation.ts:407`), `checkPrerequisites` (:95-155), `canPayCosts` (:~178), payment (:~237-245), `evaluateBacklash` (only inside `if (isFailure && spell.backlash)`, :480) | 🟠 DORMANT in play (one caller that drops its output) | **extends**. The fixed roll becomes an input band; backlash reads the band; the cooldown key becomes per caster; the `reach_drain` payment becomes a condition |
| **Spell data:** `SPELL_TEMPLATES` (`src/data/spell-templates.ts`, 5 templates: veilwalk, soulfire, hollow_crown, crystal_gate, last_breath); `SpellTemplate` (`src/types/effects.ts:921-966`); `passiveEffects?` declared at :959, **read by nothing and authored by no template** | 🟢 ACTIVE (data) | **extends**. Adds `agency`, `arena`, `castReach`, `castProse`; `passiveEffects` gets its reader (the shared node's `effects`) |
| **The Power kind:** shared definition node per spell (`spellDefinitionNode`, `spell-templates.ts:~185-206`, minted in `seedAttachments.ts:53`); `POWER_SUBCATEGORIES = ['bestowed','spell']` (`src/data/world-objects.ts:196`); `TraitCategory` includes `'spell'` (`src/types/traits.ts:18`) | 🟢 ACTIVE | **extends**. Fate-woven spells' nodes carry `effects`; a third class, `innate_power` |
| **Learning:** `create × Power` (`learn_spell`, `undertaking-objects.ts:2304-2330`); `isCaster` (:932, not exported) with three arms: mastery trait substring in `CASTER_MASTERY_TRAIT_IDS = ['spell_weaver','spellweaver','arcanist']` (`strategic-action-constants.ts:1549`), a role in `CASTER_NPC_ROLES` (:1543-1546), Veil ≥ `LEARN_SPELL_CASTER_VEIL_FLOOR = 40` (:1528) | 🟢 ACTIVE | **extends**. `isCaster` is exported and reused by seeding. **Defect fixed:** arm (a) cannot match the real trait id `trait.mastery.spell-weaver` (`mastery-trait-content.ts:141`, hyphen); measured arm (a) = 0 on seed 42 at ticks 0 and 30 |
| **World-map casting:** `use × Power` (`POWER.verbs.use`, `undertaking-objects.ts:2403-2459`, `cell.use.power`). It refuses sealed and exhausted casters, calls `activateSpell` with `prng()` seeded `mulberry32(ctx.tick * 104729 + ctx.actorId.length)` (:2435), queues the soul price as `spell_price`, and ignores `ctx.outcome` (`ObjectVerbContext.outcome`, :230-235, the band THR-1428 passes) | 🟢 ACTIVE (reachable via `ambition-templates.ts:430`) | **extends**. Reads `ctx.outcome`; applies effects and backlash through the new resolver |
| **Effect execution:** `executeEffect` (`effectExecutors.ts:743`); production applier `applyExecutionResult` → `applyExecutionMutations` (`effects/effectEventDispatch.ts:135`, :196-210), which handles `add_node`/`remove_node`/`add_edge`/`remove_edge` **and silently drops `update_property`** | 🟢 ACTIVE | **preserve** (the applier); the new resolver routes cast effects through it |
| **`dispel`** (`effectExecutors.ts:228-270`): for each of `has_trait`/`possesses`/`bonded_to`, takes the first edge whose target's tags intersect, and pushes `remove_edge` **and `remove_node`** on the target; `effect.target` is used only in the trace | 🔴 LATENT DEFECT (no shipped caller reaches it; `last_breath` carries it) | **fixes**. Edge only for `has_trait`; timed `suppress` for items; `target` filters |
| **Movement primitives:** `executeTeleport` (:147), `executeForcedMove` (:172) and `executeTransfer` (:316) return `mutations: []`; `executeCompel` (:342) returns an `update_property` the applier drops, for a property (`compelOverride`) with no reader | 🟠 DORMANT | **activates** `teleport` and `forced_move` through `rebindLocatedAt` (`src/engine/relocationIntent.ts:99`); `transfer` and `compel` stay out of scope |
| **Effect events:** `'spell_cast'` is a member of `ActionTriggerEvent` (`src/types/effects.ts:471`) and is never raised; `ITEM_HONEST_TRIGGER_EVENTS` refuses it (`src/data/item-honest-vocabulary.ts:~74`) | 🟠 DORMANT | **activates**. Raised by the resolver; the honest vocabulary flips it to live with a read-back case |
| **Effect runtime state:** `GameState.effectStates: Map<string, EffectRuntimeState>` keyed by **attachment id** (`effectTick.ts:618`, `types/gameState.ts:431`); `activateSpell` keys cooldown by `spell.id` (:470) | 🟢 ACTIVE | **preserve**, with a constraint. A shared node's state is shared by every bearer, so carried spell effects must be stateless (§ Resolution logic); cast cooldowns key on `caster::spell` |
| **Named odds lines:** `computeResolutionModifiers` (`resolutionModifiers.ts:681`) builds `NamedModifierContribution {kind, sourceId, sourceName, value}` (:125, :761-782). The forecast (`buildNudgePhaseModel.ts:673-693`), the ordinary roll (`computeStandingModifierTotal`, :835, from `unifiedActionResolution.ts:507`) and the fight roll (`resolveFightStepInputs`, `fights/fightStepInputs.ts:148`, :196) all read it | 🟢 ACTIVE | **extends**. A new contribution `kind: 'spell'`, read from the step's recorded cast so forecast and roll agree |
| **Conditions:** `applyConditionToActor` (`src/engine/effects/conditionApplier.ts:151`), shared definitions with `ticksRemaining` on the edge | 🟢 ACTIVE | **reuses** for strain and for condition backlash |
| **Quintessence price:** `QUINTESSENCE_SPELL_PRICE_SOURCE` accumulated apart from harm (`phaseQuintessence.ts:120-128`, FB3) | 🟢 ACTIVE | **preserve**. Every cast's soul price goes through it |
| **Monsters:** `createNamedElite` (`src/engine/lairEscalation.ts:211`, called :431) → `mintMonsterCard` (:251); eight families (`src/data/monster-families.ts:69-97`); **0 elites at tick 30** (elites mint after `LAIR_UPGRADE_MIN_TICKS = 30`, `lairEscalation.ts:67`) | 🟢 ACTIVE | **extends**. Stamps the family's innate power |
| **Sheet:** `AttachmentsTab.tsx` renders Powers as `Spell · ` / `Bestowal · ` (:204) and a Knows list (:326-349) | 🟢 ACTIVE | **extends** by one word (`Innate · `) |
| **Review levers:** `?spawn=` / `?testavatar` (`GameView.tsx:2661-2699`, `applyBalancedTestAvatar`, `engine/debugEncounterTools.ts:654`) | 🟢 ACTIVE | **extends**. `?spell=<id>` sits in the same effect |
| **The god's own casts:** `playerCastDispatch.ts` (THR-739, the one construction path for player-fired cards); `magicPower.ts` (sphere-fluency power, pure functions, wiring "deferred to a future phase" per its header) | 🟢 / 🟠 | **preserve**. These are the ascendant's casts and a dormant fluency model. A mortal's spell is a different act and touches neither |
| **Tick-cost probe:** `npm run measure:tick-cost` (`scripts/measure-tick-cost.ts`) | 🟢 ACTIVE | **reuses** as the upkeep budget's measure |

Green-field parts, with their evidence: **0 hits** for `resolveCast`, `castIntent`, `stepCast`, `innate_power` or a `'spell'` modifier kind across `src/` (Grep, 2026-09-29). No encounter template or action card casts (`unified-action-templates.ts` has no `castSpell|'cast'|activate_spell|spell_`; every `'cast'` hit in `src/` means a scene's cast of characters).

**Population consumed:** 104 casters on seed 42 medium (103 by role, 1 by Veil); 0 elites by tick 30; one `use × Power` ambition profile.

## Engine pillar

The work splits into three slices, in build order. **S1 is this ticket.** S2 and S3 are filed as their own tickets, [THR-1670](https://linear.app/threadbare/issue/THR-1670) and [THR-1671](https://linear.app/threadbare/issue/THR-1671), each blocked on S1.

| Slice | What it delivers | Ticket |
|---|---|---|
| **S1: Spells that work** | The preconditions, the one cast resolver, `use × Power` repaired, carried effects, seeded knowing, two fate-woven spells, `'spell_cast'` raised | THR-1571 (this ticket) |
| **S2: A caster casts in the scene** | The step cast: the decision, the named odds line, the band outcome, chips, cast lines in the afterimage, `?spell=` | [THR-1670](https://linear.app/threadbare/issue/THR-1670) |
| **S3: Innate powers** | The `innate_power` class, eight family powers, stamped at `createNamedElite` | [THR-1671](https://linear.app/threadbare/issue/THR-1671) |

### Systems design

**S1.1 — One resolver for every cast.** A new module `src/engine/spellCasting.ts`:

```ts
export interface CastRequest {
  casterId: string;
  spell: SpellTemplate;
  band: StepOutcome;              // the roll that already happened — never a new die
  targetId?: string;              // resolved by the caller from spell.targeting
  targetHex?: { col: number; row: number };
  tick: number;
  site: 'step' | 'undertaking';   // S2 adds 'step'; S1 ships 'undertaking'
  siteRef: string;                // actionId:stepIndex, or the project id
}
export interface CastResult {
  landed: boolean;                // band ∈ CAST_LANDED_BANDS
  applied: AttachmentEffect[];    // effects executed (empty if not landed)
  backlash?: { effect: AttachmentEffect; narrative?: string };
  paid: PaidCost[];               // what the caster paid, for chips
  soulPrice?: number;
  writes: CastWrite[];            // every graph write, for chips (Law 56)
  refused?: 'prerequisite' | 'cooldown' | 'cost' | 'sealed';
}
export function resolveCast(state: GameState, req: CastRequest): CastResult;
```

`resolveCast` is the only caller of `activateSpell`'s gates. It does, in order:
1. prerequisites, cooldown and cost checks (`activateSpell`'s existing checks, called with `state.castCooldowns` and `castCooldownKey(casterId, spell.id)`);
2. pays the cost (costs are paid on every band, as today);
3. if the band has landed, runs each `spell.effects` entry through `executeEffect` and `applyExecutionResult`;
4. evaluates backlash against the band (§ Resolution logic), and applies it the same way;
5. sets the per-caster cooldown;
6. raises `'spell_cast'` through `raiseEffectEvent`;
7. queues the soul price as `spell_price`;
8. emits `spell.cast_resolved`.

`activateSpell` keeps its signature for its tests. It gains an optional `band?: StepOutcome`. When a band is given, it replaces the `roll < 0.15` coin, and `resolveCast` always passes one. The coin path stays only for existing unit tests, commented as legacy.

**S1.2 — `use × Power` goes through the resolver.** `POWER.verbs.use` passes `ctx.outcome ?? 'success'` (the THR-1428 band; the instant path passes `INSTANT_COMPLETION_BAND = 'success'`) as the band. It resolves the target from `spell.targeting`:
- `self` → the actor;
- an agent target → `ctx.targetNodeId`;
- a hex target → the target node's hex.

It then calls `resolveCast`. The `mulberry32(tick * 104729 + actorId.length)` draw is deleted: the band is the roll. *Lane decision 3:* this cell **is** the world-map cast decision. A mortal decides to cast out in the world the way they decide any work, so no `'cast'` DecisionFamily is added. THR-1229 recommended one on 2026-08-25, before this cell existed (THR-1429, 2026-09-07).

**S1.3 — The preconditions.**

| Precondition | Fix |
|---|---|
| `reach_drain` pays into a dead property (:~242-245) | *Lane decision 4.* Pays by applying the shared condition `condition.strained.<reach>` via `applyConditionToActor`. Duration: `ceil(amount / STRAIN_PENALTY_SHARE) × STRAIN_TICKS_PER_UNIT`. The condition's one effect is `passive { reach, value: -STRAIN_PENALTY_SHARE }`. Eight definitions, one per Reach, authored in `src/data/strain-conditions.ts` and minted beside the spell definitions. The singular `domainCapability` write is deleted |
| Backlash only on failure; failure a fixed coin | The band decides both (§ Resolution logic) |
| Cooldown keyed by `spell.id`, shared by every bearer | Cast cooldowns move to a dedicated additive map, `GameState.castCooldowns?: Map<string, number>` (last cast tick), keyed `${casterId}::${spell.id}` via a new exported `castCooldownKey()`. `activateSpell` reads it through an optional parameter. **Not** in `effectStates`: every reader of that map treats its keys as attachment ids, and a composite key there would be one refactor away from being resolved as a node |
| `dispel` deletes the node it matches | *Lane decision 7.* `has_trait` matches → `remove_edge` only. `possesses`/`bonded_to` matches → a `suppress` state on the item for `DISPEL_ITEM_SUPPRESS_TICKS`, through the path `applySuppressions` already writes. `effect.target` filters: `'condition'` matches only conditions, `'curse'` only `#curse`-tagged, `'spell'` only `subcategory: 'spell'`, `'any'` all. Never `remove_node` |
| `teleport` / `forced_move` execute nothing | Return `remove_edge` + `add_edge` mutations equivalent to `rebindLocatedAt`. Destination: `target_hex` → the location node on or nearest `ctx.targetHex` within `range`; `random` → a seeded pick among locations within `range`; `home` → the actor's residence, falling back to the nearest settlement; `nearest_ally` → the nearest same-faction actor's location. Resolved with `resolveRelocationDestination`'s helpers where they fit. No destination → `success: false` with a warning, no mutation. `forced_move` resolves `away`/`toward`/`random` from the caster's hex, `hexes` steps, to the nearest location on the landing hex |
| `isCaster` arm (a) cannot match the real id | `CASTER_MASTERY_TRAIT_IDS` gains `'spell-weaver'`; `isCaster` is exported |
| `'spell_cast'` never raised | Raised by `resolveCast`; the honest vocabulary adds it to `ITEM_HONEST_TRIGGER_EVENTS` behind a read-back case |

**S1.4 — Carried spells (fate-woven).** `spellDefinitionNode` writes `effects: spell.passiveEffects` when the template has any, so the effect walker applies them to every wielder through the `has_trait` edge it already walks. A deliberate spell's node stays without `effects`, as today. *Lane decision 6:* **carried effects must be stateless**, because `effectStates` is keyed by attachment id and the definition node is shared. The allowed primitives are `passive`, `conditional`, `test_shaper`, `social_modifier`, `aura`, `reveal` and `action_trigger` without charges. A template whose `passiveEffects` holds anything else (`stacking`, `duration`, `consumable`, `prevent_loss` with charges, a cooldown) fails a data test. Per-bearer effect state is out of scope and named in § Notes.

**S1.5 — Seeded knowing (acquisition channel 2).** *Lane decision 5.* A new step in `seedAttachments.ts`, after the spell definitions are minted: every actor for which `isCaster` is true gets `SEEDED_SPELLS_PER_CASTER` spells. The pick:
1. The **tradition shelf**: templates whose `sphereAffinity` is one of the actor's aligned spheres (`alignedSpheres`, `undertaking-objects.ts:~956`), lowest tier first, then by id.
2. **Fallback**: a tier-1 cantrip (the lowest-tier template, by id), when `SEEDED_FALLBACK_TO_CANTRIP` is true.

Two levers bound who is seeded:
- `SEEDED_CASTER_ROLES` names the caster roles that are seeded. Its default is all of `CASTER_NPC_ROLES`.
- `SEEDED_SPELL_COVERAGE` is the fraction of the remaining casters seeded, by a sorted pick on actor id. Its default is `1.0`.

**Neither lever is keyed on tier.** On seed 42, 103 of the 104 casters are `ambient` at tick 0 (`{"spotlight":1,"ambient":103}`), so a tier filter would switch seeding off rather than thin it.

The seeding writes both edges, `knows_spell` and `has_trait` (wielded, under the slot cap), with edge property `source: 'seeded'`. It is deterministic: no draw, only sorted picks. Result: all 104 casters on seed 42 wield a spell at tick 0.

**S2.1 — The step cast (S2).** *Lane decisions 1 and 2.*

- **Who may cast.** The mortal whose capability the step reads: the actor, or the chosen companion on a company step. They must wield a deliberate spell that is not sealed (`isSpellSuppressedFor`), not on cooldown, affordable, and whose arena fits the step:
  - `arena: 'encounter'` fits a non-fight step whose `reach` equals `spell.castReach`;
  - `arena: 'fight'` fits a fight exchange (`fightRole` clash);
  - map arenas never fit a step.
- **Which spell.** Among the fitting spells: highest tier, then id.
- **Whether they cast.** `decideStepCast(state, action, stepIndex)` computes the step's probability **before any god card**: capability plus standing modifiers, the same inputs as the forecast minus nudges. The mortal casts when that probability is below `castThreshold = clamp(CAST_THRESHOLD_BASE + CAST_THRESHOLD_COURAGE_SHIFT × courage_prudence, CAST_THRESHOLD_MIN, CAST_THRESHOLD_MAX)`, read from the mortal's `AxiologicalProfile` as `appointments.ts:191-195` reads it.
- **Recording.** The decision is written once on the action: `action.stepCasts[stepIndex] = { casterId, spellId, bonus, threshold, preCardProbability }`, or `{ declined: reason }`. It is written by whichever reader asks first (the attended forecast at step open, or the roll for a background step). Both then read the record, so the forecast shows what the roll will use.
- **The odds line.** `computeResolutionModifiers` adds one contribution `{ kind: 'spell', sourceId: spellDefinitionNodeId(spellId), sourceName: spell.name, value: CAST_STEP_BONUS_BY_TIER[spell.tier] }` when `action.stepCasts[stepIndex]` names this caster. It is read through a new optional parameter `stepCast?: StepCastRecord` that every existing caller omits.
- **The outcome.** After the step's band lands, the step resolver calls `resolveCast({ band, site: 'step', … })`. The god's cards bent that band, so the cast is nudgeable through the roll with no new surface.
- **What the god can and cannot touch (Lane decision 2, veto invited).**
  - The *decision* to cast reads no nudge; only the roll is nudgeable.
  - Ruling 5's own words, *"a caster's deliberate spells surface as nudge options in their encounters (god nudges, fate picks)"*, are broader than this. They could also mean a card that urges or stays the cast.
  - This plan does not build that card. The decision stays the mortal's, as forks are, and the cards bend what follows.
  - If Christian wants the god to lean on the decision itself, that is a card family on the THR-883 dealt-hand substrate, added later without changing this runtime. The brainstorm companion holds the tension.
- **Where the cast's prose goes.** `castProse` is resolved at resolution through `enrichProse` with the step's context (the `{actor}`/`{target}` placeholders the afterimages already use). It is frozen on `stepCasts[i].prose`, and it renders after the step's afterimage exactly as `action.stepComplications[i].prose` does, in `chapterArchive.ts:~235` and in `buildUnifiedEncounterStageModel.ts`. No new placeholder and no new `enrichProse()` slot.

A fight-arena spell whose effects fill the opponent's clock lands before the step's clock-full check, as the fight block already orders effect writes (fight-block plan §5). A teleport never fires from a step, because map arenas never fit one, so a cast never carries a mortal out of a scene mid-step.

### Graph nodes / edges

No new node type and no new edge type.

| Shape | Change |
|---|---|
| `trait` node, `subcategory: 'spell'` | Fate-woven templates' nodes gain `effects` (S1.4) |
| `trait` node, `subcategory: 'strained'`? | **No.** Strain conditions are `subcategory: 'condition'`, `tags: ['#condition', '#strain', '#<reach>']`, ids `condition.strained.<reach>` |
| `trait` node, `subcategory: 'innate_power'` (S3) | New `TraitCategory` member; `POWER_SUBCATEGORIES` widens to `['bestowed','spell','innate_power']`; ids `power.innate.<family>` |
| `knows_spell`, `has_trait` edges | Seeding writes them with `source: 'seeded'`; S3 writes `has_trait` to the innate power with `source: 'innate'` |
| `located_at` | Written by `teleport` / `forced_move` through the applier's `remove_edge` + `add_edge` |
| `GameState.castCooldowns?: Map<string, number>` (S1) | Additive optional per-session state: the last cast tick per `caster::spell` |
| `UnifiedAction.stepCasts?: Record<number, StepCastRecord>` (S2) | Additive optional field on the action (an in-flight record, not a relationship) |

### Tick phases

None new.
- S1 runs inside the undertaking completion path (`executeInstantMutation` → `resolveUndertakingCompletion` → `POWER.verbs.use`) and at seeding.
- S2 runs inside unified-action step resolution, in the phase where steps already resolve.
- S3 runs inside `createNamedElite`.
- Carried effects ride the existing effect walk.

### Resolution logic

**The band decides the cast.** `CAST_LANDED_BANDS = ['critical_success', 'success', 'success_at_cost']`. `near_miss`, `failure` and `critical_failure` fizzle: the price is paid and the effects do not apply.

**The price layer decides when backlash may fire.** It keeps the authored `backlash.trigger` as the mechanism, read against the band:

| `backlash.trigger` | Price layer it expresses | Bands on which backlash may fire |
|---|---|---|
| `'failure'` | strain | `near_miss`, `failure`, `critical_failure` |
| `'critical_failure'` | transgression | `critical_failure` |
| `'always'` | gamble | every band **except** `critical_success` |
| `'overcost'` | (no branch today) | treated as `'failure'`, commented |

On an eligible band, backlash fires with `backlash.probability`, drawn from its own seeded stream: `hashSeed('backlash:' + state.seed + ':' + siteRef + ':' + casterId)` through `mulberry32`. This is a consequence draw, not an outcome die. It shifts no other roll in the tick. `backlash_severity_multiplier` keeps its existing reading inside `evaluateBacklash`, which goes live in play here (the interface map's stated partial reach).

**Targets.** The caller resolves them from `spell.targeting`.
- `self` → caster.
- Agent targets inside a step → the step's opponent (fight) or the action's target, and failing that the nearest fitting actor on the hex within `targeting.radius`, by id.
- `ally` / `enemy` filters read faction membership and `reputation_with` as `create × Condition` already does (THR-1429 S3).
- No valid target → the cast is refused before payment (`refused: 'no_target'`, traced), and the step resolves without it.

**Carried effects** apply wherever the walker applies trait effects today, with no resolver change.

### PRNG callouts

No `Math.random()`.
- The cast's success is the step's or the undertaking's own band.
- Backlash draws from `hashSeed('backlash:' + state.seed + ':' + siteRef + ':' + casterId)` via `mulberry32`.
- The `random` teleport destination draws from `hashSeed('teleport:' + state.seed + ':' + siteRef + ':' + casterId)`.
- Seeding makes no draws (sorted picks).
- The deleted `mulberry32(tick * 104729 + actorId.length)` draw in `use × Power` was keyed on id *length*, so two casters with same-length ids shared a stream. Its removal is a determinism fix.

Determinism test: the same seed and the same inputs produce identical `CastResult`s and identical seeded spell holders.

## Content pillar

### Encounter templates

N/A: no template is authored. A cast rides any existing step whose reach fits (S2). The review links are existing templates (§ UI pillar).

### Attachment content — the spells

The five shipped templates gain the new fields. The values are authored here so the executor ports rather than invents:

| Spell | `agency` | `arena` | `castReach` | Price layer (from `backlash.trigger` + cost) |
|---|---|---|---|---|
| veilwalk | deliberate | map_travel | — | strain (`reach_drain` veil) |
| soulfire | deliberate | fight | — | transgression (doom + strain) |
| hollow_crown | deliberate | encounter | gold | strain (the condition cost) |
| crystal_gate | deliberate | map_travel | — | strain (consumes an attachment) |
| last_breath | deliberate | encounter | heart | strain (doom + reach + exhaustion) |

`castProse: { landed: string; fizzled: string }` per spell. These are one line each, GAME register, GM narration, prose placeholders only (`{actor}`, `{target}`), and they join the step's afterimage (S2). The existing `backlash.narrativeTemplate` is the miscast line. Example voice for hollow_crown: *landed:* "{actor} speaks with a borrowed crown's weight, and the room bends to it." *fizzled:* "{actor} reaches for the crown's weight and finds only their own voice."

**Two fate-woven spells, ported from the prototype**, so the carried half is proved. They are hand-ported, not a new authoring program; the generator (THR-1572) fills the shelf:
- **The Wayfinding** (Spirit, tier 2, fate-woven, map_sight): `passiveEffects`: `reveal { target: hexes, range: 2 }`, `passive { stone, -0.04 }`, `action_trigger { on: encounter_critical_failure, grant: grieving, probability: 0.25 }`.
- **Height Anchor** (Time, tier 2, fate-woven, fight): `passiveEffects`: `test_shaper { from: failure, shift: +1, in_combat, margin ≤ 0.1 }`, `passive { heart, -0.05 }`, `action_trigger { on: encounter_critical_failure, grant: exhausted, probability: 0.25 }`.

Both are stateless per S1.4, and every primitive is a `live` row in the honest vocabulary. Last Coin, the prototype's other tier-1 port, was **not** chosen, because its `prevent_loss` is spent on use and would share its charge across every bearer.

**Eight strain conditions** (`src/data/strain-conditions.ts`): *Strained Iron* … *Strained Star*, one passive each. Sheet line: "Strained: their <Reach> is thin for a while."

**Eight innate powers (S3)** (`src/data/innate-powers.ts`), one per family, fate-woven, one or two live stateless primitives each, sphere-true to the family:

| Family (sphere) | Innate power | Carried effect |
|---|---|---|
| beast (force) | Thick Hide | `passive { iron, +0.05 }`, `in_combat` |
| golem (matter) | Stone Body | `passive { stone, +0.06 }` |
| stormkin (energy) | Crackling Air | `aura { enemies, radius 0, iron -0.03 }` |
| behemoth (life) | Deep Vigour | `test_shaper { from: near_miss, shift +1, in_combat }` |
| mindthing (mind) | Wrong Thoughts | `aura { enemies, radius 0, heart -0.04 }` |
| wraith (spirit) | Half There | `passive { shadow, +0.06 }` |
| echo (time) | Already Moving | `test_shaper { from: failure, shift +1, in_combat, margin ≤ 0.05 }` |
| blight (entropy) | Rot Breath | `aura { enemies, radius 0, stone -0.04 }` |

The fight block already folds an opponent's own passive and conditional modifiers into the step's difficulty (`resolveEffectModifiers` on the opponent; fight-block plan §3b), so these change fights with no new reader.

### Prose tables

`castProse` above (5 × 2 lines) and eight innate-power descriptions (one sentence each, for the sheet). No placeholder vocabulary is added.

### Data tables

`src/data/spell-casting-constants.ts` holds § Constants. `SpellTemplate` gains:
- `agency?: 'fate_woven' | 'deliberate'` (default derived: deliberate when `effects` is non-empty);
- `arena?: 'encounter' | 'fight' | 'map_travel' | 'map_sight' | 'map_mark'`;
- `castReach?: Reach`;
- `castProse?`.

All four are additive and optional.

### UL

- **Innate Power** gains its code anchor (S3): `subcategory: 'innate_power'`, ids `power.innate.<family>`, stamped at `createNamedElite`.
- **Spell** gains one paragraph: *carried* (fate-woven) versus *cast* (deliberate), and "the step's roll decides a cast".
- New entry **Strained**: a timed condition that thins one Reach, the price a strain spell charges.

**Strained** is proposed as [THR-1673](https://linear.app/threadbare/issue/THR-1673) (label `UL-proposal`), to be seated under the standing delegation with Christian's veto retained, in the S1 build PR. The Spell paragraph lands in the same PR. The Innate Power anchor lands with S3.

## UI pillar

Engages UI Laws **1, 4, 13/14, 17, 21, 33, 37, 56**.

### Player-facing display

- **S2 — the odds line.** At an attended step where the mortal casts, the forecast's factor list shows "casting *Hollow Crown* +N" as a named line. It is the same list and styling as other `kind: 'effect'` lines, and the spell name is clickable to the spell's Power page (Law 4, every primitive is clickable; Law 13, the odds shown are the odds rolled).
- **S2 — the afterimage.** The step's afterimage gains the spell's `castProse.landed` or `.fizzled` line, and the backlash narrative when backlash fires (GM narration, Law 21).
- **S2 — chips.** One chip per write the cast produced, in the existing aftermath change list:
  - a `scar` chip for a strain condition or a condition backlash;
  - a `boon` chip for a landed effect that wrote a condition, a trait or a clock segment;
  - a `path` chip for a teleport.

  Law 56 holds: a chip only for `CastResult.writes`, never for intent.
- **S1 — the sheet.** `AttachmentsTab` already lists wielded spells and a Knows section. Fate-woven spells need nothing new. The strain condition shows as any condition does.
- **S3 — the sheet.** `Innate · ` prefix beside `Spell · ` and `Bestowal · ` (:204).
- **No numbers.** The bonus value appears only as the factor line's existing +N convention. The sheet shows words.

### Event notifications

None new. A cast reaches the player through the step and the chronicle's existing step lines. A world-map cast (S1) adds a chronicle line through the undertaking deed (`undertakingDeed.ts`), with the spell's name.

### Debug inspection (DebugPanel)

`window.__DEBUG`:
- `getSpellHolders()` → `{ actorId, name, wielded: string[], known: string[], source }[]` (S1);
- `castSpell({ caster, spell, band, target? })` → `CastResult` (S1; the engine lever for tests and review, which runs `resolveCast` directly);
- `getStepCast(actionId?)` → the `stepCasts` record for the open or given action (S2).

All go in `src/debug-bridge.ts` and `.d.ts`.

URL flag `?spell=<templateId>` (S2): stamps `@hero` as knowing and wielding the spell, taking the lowest slot if all three are full. It works on the deployed build like `?testavatar`. Combinable: `?view=game&seeded&size=medium&testavatar&spell=hollow_crown&spawn=<template with a gold step>`.

### Visual presence (HexMapV2)

N/A. A teleported mortal moves on the map through the existing agent layer (it reads `located_at`). No new signifier.

### Review path

S2's closeout carries two links:
- one encounter-arena cast: `?spell=hollow_crown` with a `?spawn=` template whose first step reads Gold;
- one fight cast: `?spell=soulfire&spawn=fight.lair.confront`.

Each is paired with `?outcome=success` and `?outcome=failure`, so the landed and fizzled lines are both one click away. This is **for information**. Christian is not asked to sample it (the level-system rule: Powers is not level until the generator has filled the shelf).

## Wiring

| Module | Orchestrator phase / call site | UI component | GameState flow | Trace | Debug |
|---|---|---|---|---|---|
| `spellCasting.ts` `resolveCast` | `POWER.verbs.use` (S1); step resolver after band (S2) | EncounterVeil chips, afterimage (S2) | `castCooldowns` (per-caster cooldown), `graph` | `spell.cast_resolved`, `spell.backlash` | `castSpell`, `getSpellHolders` |
| `spellActivation.ts` (band input, strain payment, backlash by band) | via `resolveCast` | — | — | existing activation trace | — |
| `effectExecutors.ts` (`dispel`, `teleport`, `forced_move`) | via `applyExecutionResult` | map agent layer (`located_at`) | `graph` | `effect.teleported`, existing effect traces | — |
| `seedAttachments.ts` seeded knowing | worldgen | AttachmentsTab | `graph` | `spell.seeded` (one aggregate) | `getSpellHolders` |
| `spellDefinitionNode` carried effects | worldgen; effect walker per tick | AttachmentsTab | `graph` | existing effect traces | — |
| `decideStepCast` + `stepCasts` (S2) | step open / step resolution | forecast factor list | `UnifiedAction.stepCasts` | `spell.cast_decided` | `getStepCast` |
| `computeResolutionModifiers` `stepCast` param (S2) | forecast + both roll paths | factor list | — | — | — |
| `createNamedElite` innate stamp (S3) | lair escalation | AttachmentsTab | `graph` | `power.innate_stamped` | `getSpellHolders` (includes innate) |
| `GameView.tsx` `?spell=` (S2) | URL effect | — | `graph` | `[?spell]` console line | — |

**Player controls:** none. There is no cast verb for the player. The god acts on a cast only through the step's existing cards, which bend the roll that decides it (S2), and through `?spell=` / `__DEBUG.castSpell` for review.

**Prose:** `castProse` and the backlash `narrativeTemplate` resolve through `enrichProse` at resolution. They are frozen on `stepCasts[i].prose` (S2) or on the undertaking deed (S1), and render beside the step afterimage the way `stepComplications[i].prose` does. No new placeholder and no new `enrichProse()` slot.

`Docs/plans/wiring-checklist.md` gains a row per module. `Docs/plans/2026-04-16-systemic-wiring-guide.md` gains a **Spells** section: the four new template fields, the stateless-carried rule and the `'spell_cast'` trigger (it is a content-facing capability).

## Interface impact

| Contract (interface map) | Impact | Detail |
|---|---|---|
| `rule-override-consumers` (the `backlash_severity_multiplier` partial reach) | **extend** | Goes live in play: `evaluateBacklash` gains a production caller. The row's "known partial reach" note is updated |
| `attachment-effect-event-raises` | **extend** | `'spell_cast'` gains its raise site (`resolveCast`). Its producer list and evidence are updated |
| `effect-vocabulary-consolidated-spellings` | **extend** | `teleport`/`forced_move` become live mechanisms; `dispel` stops deleting nodes. Evidence notes the fix |
| `trait-predicate-resolution` | **preserve** | `checkPrerequisites` is unchanged |
| `granted-trait-consumers` (spell prerequisites) | **preserve** | — |
| **new: `spell-cast-applies-effects`** | **add** | Producer: `resolveCast`. Consumers: `applyExecutionResult` (graph writes), `phaseQuintessence` (`spell_price`), the step chips (S2). Live-read proof: a landed cast's effect is observable on the graph, and a fizzled one's is absent (both arms) |
| **new: `seeded-spell-holders`** | **add** | Producer: `seedAttachments`. Consumers: `use × Power` (`spellsOfActor`), the step cast (S2), the effect walker (carried) |

`scripts/interface-contracts.ts` and `npm run generate-interface-map` are updated in the same PR (the two-file edit).

## Constants table

All in `src/data/spell-casting-constants.ts` unless noted.

| Constant | Default | Purpose |
|---|---|---|
| `CAST_LANDED_BANDS` | `['critical_success','success','success_at_cost']` | Bands on which a cast's effects apply |
| `BACKLASH_ELIGIBLE_BANDS_BY_TRIGGER` | the § Resolution logic table | When each price layer's backlash may fire |
| `STRAIN_PENALTY_SHARE` | `0.03` | The reach-share loss a strain condition carries |
| `STRAIN_TICKS_PER_UNIT` | `24` (two days) | Strain duration per `STRAIN_PENALTY_SHARE` of drain |
| `DISPEL_ITEM_SUPPRESS_TICKS` | `24` | How long a dispelled item is silenced |
| `SEEDED_SPELLS_PER_CASTER` | `1` | Spells a caster starts with |
| `SEEDED_FALLBACK_TO_CANTRIP` | `true` | A caster with no shelf spell still starts with the tier-1 cantrip |
| `SEEDED_CASTER_ROLES` | all of `CASTER_NPC_ROLES` | Which caster roles are seeded (kill-criterion lever) |
| `SEEDED_SPELL_COVERAGE` | `1.0` | The fraction of eligible casters seeded, by a sorted pick on id (kill-criterion lever) |
| `CARRIED_EFFECT_ALLOWED_TYPES` | the S1.4 list | The stateless primitives a carried spell may hold |
| `CAST_THRESHOLD_BASE` | `0.45` | Below this pre-card probability, a neutral mortal reaches for their spell (S2). Deliberately **below** the 50–65% window mortals choose challenges at (THR-1581), so a caster casts only when a step is worse than they would have chosen: a hard step the god imposed, a scene that turned, or a fight going badly |
| `CAST_THRESHOLD_COURAGE_SHIFT` | `0.10` | A courageous mortal (+1) casts up to 0.55; a prudent one (−1) saves it until 0.35 |
| `CAST_THRESHOLD_MIN` / `_MAX` | `0.30` / `0.55` | The clamp. The maximum sits at the window's floor, so no caster casts on a step inside the band they would choose |
| `CAST_STEP_BONUS_BY_TIER` | `{1: 0.04, 2: 0.07, 3: 0.10, 4: 0.13}` | The named odds line a cast adds (S2) |
| `POWER_UPKEEP_TICK_COST_BUDGET_PCT` | `5` | Max tick-cost rise vs the pre-change baseline on the probe |
| `POWER_UPKEEP_MIN_SPOTLIGHT_TIER` | `null` (off) | The reserve kill switch: when set, carried spell effects walk only for bearers at or above this tier |
| `CASTER_MASTERY_TRAIT_IDS` (`strategic-action-constants.ts`) | adds `'spell-weaver'` | Fixes arm (a) |

## Tracing

```ts
// spell.seeded — one aggregate per world, at seeding
interface SpellSeededTrace {
  type: 'spell.seeded';
  casters: number;            // isCaster actors
  seeded: number;             // actors given a spell
  bySpell: Record<string, number>;
  fallbackCantrip: number;    // actors whose shelf was empty
}
// spell.cast_decided — S2, once per step where a caster could cast
interface SpellCastDecidedTrace {
  type: 'spell.cast_decided';
  actionId: string; stepIndex: number; casterId: string; spellId: string;
  preCardProbability: number; threshold: number;
  decision: 'cast' | 'declined';
  declinedReason?: 'odds_good' | 'cooldown' | 'cost' | 'sealed' | 'no_target' | 'no_fitting_spell';
}
// spell.cast_resolved — every resolveCast
interface SpellCastResolvedTrace {
  type: 'spell.cast_resolved';
  site: 'step' | 'undertaking'; siteRef: string;
  casterId: string; spellId: string; band: StepOutcome;
  landed: boolean; applied: string[];       // effect types
  paid: string[]; soulPrice?: number;
  refused?: string;
}
// spell.backlash — when backlash fires
interface SpellBacklashTrace {
  type: 'spell.backlash';
  siteRef: string; casterId: string; spellId: string;
  trigger: string; band: StepOutcome; effectType: string;
}
// effect.teleported — teleport / forced_move wrote a move
interface EffectTeleportedTrace {
  type: 'effect.teleported';
  actorId: string; from: string; to: string; primitive: 'teleport' | 'forced_move';
}
// power.innate_stamped — S3
interface PowerInnateStampedTrace {
  type: 'power.innate_stamped';
  eliteId: string; family: string; powerId: string;
}
```

## Fail-soft table

| Failure | Fallback |
|---|---|
| `resolveCast` throws | Caught at both call sites. The step or the undertaking resolves as if no cast happened. `spell.cast_resolved { refused: 'error' }` |
| Spell template not found for a wielded node | Refused `no_spell_template` (today's behaviour), traced |
| No valid target | Refused before payment, `no_target`. The step resolves without the cast |
| Teleport/forced_move finds no destination | `success: false`, no mutation, warning. The caster stays put |
| Strain condition definition missing | Payment falls back to `tick_exhaust` for `STRAIN_TICKS_PER_UNIT`, warning traced. Never writes the dead property |
| Backlash effect's executor returns no mutation | The backlash narrative still plays, no chip (Law 56) |
| A carried template holds a stateful primitive | A data test fails at build time. At runtime the node is minted without `effects` and a warning is traced |
| Seeding finds no shelf spell and the fallback is off | The caster starts with none. `spell.seeded.fallbackCantrip` counts it |
| `stepCasts` record missing when the roll reads it | The roll decides and records it then (same function). The forecast and roll still agree because the decision reads no nudge |
| Tick cost over budget | Set `POWER_UPKEEP_MIN_SPOTLIGHT_TIER = 'notable'` (§ Kill criteria) |

## Blast Radius

`src/types/unifiedAction.ts` and `src/types/effects.ts` sit among the ≥100-importer type files (`.codesight/graph.md`). `src/types/gameState.ts` also sits in that group and gains one additive optional field, `castCooldowns?: Map<string, number>` (S1). The changes to all three are **additive optional fields only**: `UnifiedAction.stepCasts?`, and `SpellTemplate.agency? / arena? / castReach? / castProse?`. `src/engine/traits.ts` is **not** edited. `TraitCategory` (`src/types/traits.ts`) gains one union member (`'innate_power'`, S3), which typecheck surfaces at every exhaustive switch. `computeResolutionModifiers` gains an optional last parameter every existing caller omits.

**Behavioural blast:**
1. `use × Power` now applies effects and backlash, and pays strain as a condition. It is reachable through one ambition profile.
2. Seeding writes ~100 spell holders per medium world. This changes nothing else's draws, because seeding makes no draws, but carried effects now apply to holders of the two fate-woven spells.
3. `dispel` no longer deletes nodes. No shipped caller reached it before.
4. The removal of the id-length-keyed draw changes `use × Power` outcomes on every seed. It was a coin; it is now the band.

## Three-pillar check

- [x] Engine pillar present: S1.1–S1.5, S2.1, S3 (the resolver, the preconditions, seeding, the step cast, the innate stamp)
- [x] Content pillar present: the five templates annotated with agency, arena, castReach and castProse; two fate-woven ports; eight strain conditions; eight innate powers; UL entries
- [x] UI pillar present: the odds line, the afterimage cast line and chips (S2); the sheet prefix (S3); `?spell=` and the debug levers
- [x] Wiring section connects them: § Wiring table, plus rows in the wiring checklist and the systemic wiring guide

## Vision audit

- **You shift probabilities; you do not direct-control characters.** The mortal decides to cast, and the god bends the roll that decides the spell. No card casts for the mortal.
- **Failure is plot.** Miscasts now happen on the bands their price says, so a gamble can bite on a good day and a strain spell leaves the caster thin for a while. The five-band ladder stays the only ladder.
- **Prose, not numbers.** Strain reads as "their Veil is thin for a while". The one number is the odds line's existing +N factor.
- **Every primitive is clickable.** The spell name on the odds line and on each chip routes to its Power page.
- **Narrative over mechanical perfection.** The cast-threshold rule is a character read (courage against prudence), not an optimiser.

- [x] This plan does not contradict any Vision premise (the five premises above are each held)
- [x] No Vision edit is needed, so none is in scope

## Rulebook impact

`Docs/canon/rulebook.md` and the quick reference gain a **Spells** paragraph under *Encounters*, tagged `[IMPL — THR-1571]` once S2 ships:

> A caster carries up to three spells. Most work on their own while carried. A few are cast: when a step's odds look bad, the caster reaches for a spell that fits it, and the step shows it on its odds. The same roll decides the step and the spell. A spell that lands does what it says. What a miscast costs depends on the spell: a strain spell thins the caster's Reach for a while, a gamble can bite even on success, a transgression bites only on disaster.

S1 adds the line "Priests, healers, scholars and other casters start the world knowing one spell of their tradition."

- [x] This plan changes a rule of play: encounters gain the cast, and resources gain strain as a spell's price
- [x] `Docs/canon/rulebook.md` and the quick reference are updated in the same PR as each slice that ships the rule (S1: seeded casters; S2: the cast paragraph)

## NFP-compliance table

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | 17 named constants; the cast threshold, bonus, strain, dispel and upkeep numbers are all constants |
| 2. Inspectability | PASS | Six trace types; the cast decision is recorded on the action with its inputs; three debug levers and `?spell=` |
| 3. Determinism | PASS | No new outcome die; the backlash and teleport draws each have their own hashed stream; seeding makes no draws; removes an id-length-keyed stream |
| 4. Fail-soft | PASS | Ten-row fail-soft table; every cast failure resolves the step or undertaking as if uncast; nothing throws into the tick |
| 5. Narrative over mechanical | PASS | Casts are a character read; miscasts are story; cast lines in GM narration |
| 6. Additive over destructive | PASS with note | Optional fields and params throughout. Deliberate behaviour changes: `use × Power` outcomes (the band replaces a coin), `dispel` (latent bug removed), strain payment (dead write replaced). Each has a regression test |
| 7. Performance budget | PASS | Carried effects ride the existing walk; casts resolve only where steps or undertakings already resolve; `POWER_UPKEEP_TICK_COST_BUDGET_PCT` measured with the probe before and after S1 and S2, and a reserve tier gate as the kill switch |

## Done when

**S1 (this ticket):**
- [ ] `npm run cli -- --seed 42 --map medium`, tick 0: every `isCaster` actor wields exactly one spell (`__DEBUG.getSpellHolders()` or CLI `eval`); `spell.seeded` reports 104 casters, 104 seeded, with its `fallbackCantrip` count. Seed 99 recorded the same way
- [ ] `isCaster` matches an actor holding `trait.mastery.spell-weaver` (regression test)
- [ ] `use × Power` on a `success` band applies the spell's effects (a veilwalk caster's `located_at` changes to a location within range 3), pays strain as `condition.strained.veil`, writes **no** `domainCapability` property, and raises `'spell_cast'`. On a `failure` band the location is unchanged and the price is paid. Both arms in one test
- [ ] Backlash by band: a `trigger: 'always'` spell can fire on `success` and never on `critical_success`; a `trigger: 'failure'` spell never fires on `success`. Fixed-seed tests for each row of the table
- [ ] Two casters of the same spell hold independent cooldowns
- [ ] `dispel` on a condition held by two actors lifts it from the target only; the definition node survives; the other bearer keeps it. `dispel` on a possession silences it for `DISPEL_ITEM_SUPPRESS_TICKS` and the owner keeps it
- [ ] The Wayfinding's `reveal` and passive reach the wielder through the effect walker; a data test refuses a stateful carried primitive
- [ ] The honest vocabulary lists `'spell_cast'` as live, with a read-back case
- [ ] Tick cost within `POWER_UPKEEP_TICK_COST_BUDGET_PCT` of the pre-change baseline (`npm run measure:tick-cost -- --map medium --ticks 100`, before and after, both numbers in the closeout)

**S2 and S3** carry their own Done-whens on their tickets. S2 is browser-verified: Playwright at 1920×1080 on the two review links, with the four-part evidence (screenshot of the odds line and the afterimage cast line, console, `await window.__DEBUG.getStepCast()` assertion, UI-Laws line 1, 4, 13/14, 17, 21, 33, 37, 56).

**All slices:**
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` and a 30-tick CLI smoke pass
- [ ] Interface contracts, interface map, wiring checklist, systemic wiring guide, UL shard, rulebook and quick reference, and any wiki page whose `sources` match are updated in the same PR; systems inventory regenerated
- [ ] Browser-verify: S1 is engine and data only (`Browser-verify exempt: no file under src/components, src/hooks, src/contexts or index.css` in the commit body, unless the debug-bridge edit pulls one in); S2 carries the four-part evidence above
- [ ] Closing commit body includes the close keyword for THR-1571 on its own line

## Kill criteria

- **Seeding 100+ casters makes the world read as over-magicked** (cold playtest or the census shows spells in most chronicle lines) → narrow `SEEDED_CASTER_ROLES` (for example drop healer, herald and chaplain, 28 of the 103 by role on seed 42) or lower `SEEDED_SPELL_COVERAGE`. Either is one constant, and the runtime stays. Not a tier filter: at tick 0, 103 of 104 casters are `ambient`.
- **Tick cost rises past the budget** → set `POWER_UPKEEP_MIN_SPOTLIGHT_TIER = 'notable'`. If still over, profile before anything else (NFP #7).
- **Casters cast on nearly every step** (S2 census: `spell.cast_decided` with `decision: 'cast'` on more than `1 / cooldown` of eligible steps) → the cooldown is doing the work the threshold should; lower `CAST_THRESHOLD_BASE`. Expected at the default: rare. Mortals choose steps at 50–65%, and the threshold tops out at 55%, so a cast fires mainly on steps the mortal did not pick at those odds: god-imposed long odds, a fight's later exchanges, and group steps read off a weaker companion.
- **Casters never cast** (S2 census: zero `decision: 'cast'` in 150 ticks on seed 42 with ~100 seeded casters) → the threshold is below every step the world produces. Raise `CAST_THRESHOLD_BASE` toward the window's floor. The runtime stays.
- **Christian vetoes a lane decision** → each is one constant, one function or one UL paragraph. Revise on this ticket before build, or on S2/S3 for theirs.

## Coordination block

**Suggested model:** opus. Cross-module engine work (spell activation, executors, seeding, undertaking cell) with a determinism change and a latent-bug fix in `dispel`; judgement needed on target resolution and the teleport destinations.

**Parallel-safe with:** [THR-1663](https://linear.app/threadbare/issue/THR-1663) (leads and ruin surveys: relocation intent and survey cells, not `POWER` verbs or effect executors); [THR-1659](https://linear.app/threadbare/issue/THR-1659) (faith UI: congregation pages, not the attachments tab's power rows); [THR-1666](https://linear.app/threadbare/issue/THR-1666) (encounter afterimages: content files, not the step resolver).

**Mutex with:** [THR-1572](https://linear.app/threadbare/issue/THR-1572) (both edit `src/data/spell-templates.ts` and `SpellTemplate` in `src/types/effects.ts`; the generator must build on S1's fields). Re-check at claim time for any In-Dev ticket editing `src/engine/effectExecutors.ts`, `src/engine/spellActivation.ts`, `src/engine/seedAttachments.ts` or `POWER` in `src/data/undertaking-objects.ts`.

**Files to touch:** (S1; S2 and S3 list theirs on their tickets)
- Create: `src/engine/spellCasting.ts` (+ tests), `src/data/spell-casting-constants.ts`, `src/data/strain-conditions.ts`
- Edit: `src/engine/spellActivation.ts` (band input, strain payment, backlash by band, cooldown key)
- Edit: `src/engine/effectExecutors.ts` (`dispel`, `teleport`, `forced_move`)
- Edit: `src/data/spell-templates.ts` (fields, two fate-woven ports, `effects` from `passiveEffects` on the node)
- Edit: `src/types/effects.ts` (optional `SpellTemplate` fields)
- Edit: `src/types/gameState.ts` (`castCooldowns?`)
- Edit: `src/data/undertaking-objects.ts` (`POWER.verbs.use` through `resolveCast`; export `isCaster`)
- Edit: `src/data/strategic-action-constants.ts` (`CASTER_MASTERY_TRAIT_IDS`)
- Edit: `src/engine/seedAttachments.ts` (seeded knowing, strain definitions)
- Edit: `src/data/item-honest-vocabulary.ts` (`'spell_cast'`)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts`; `scripts/interface-contracts.ts`; UL shard; rulebook; wiring checklist; systemic wiring guide

## Notes for the executor

- **Re-measure the census before trusting 104.** Worldgen changes weekly. The Done-when is "every `isCaster` actor", and the count is recorded, not asserted.
- **`activateSpell`'s id-length draw is not a pattern to preserve.** Delete it. Do not "keep determinism" by re-deriving it.
- **The carried-effects constraint is structural, not caution.** `effectStates` is keyed by attachment id (`effectTick.ts:618`), and the spell node is shared. A `stacking` or charged effect on it would share one counter across every bearer. Per-bearer effect state (keying by `bearerId::attachmentId`) is a separate design with its own blast radius; do not slip it in.
- **`update_property` mutations are dropped by `applyExecutionMutations`** (`effectEventDispatch.ts:196-210`). That is why `compel` does nothing. It is out of scope here: no spell in this plan emits one. Do not route a cast effect through `update_property`.
- **Out of scope, deliberately:**
  - `transfer` and `compel` executors;
  - spells as divine gifts and found tomes (acquisition channels 1 and 4; filed as the deferral [THR-1672](https://linear.app/threadbare/issue/THR-1672));
  - faction-held powers (ruled out by the map);
  - richer cast surfaces (inspector, codex);
  - a caster choosing among several fitting spells by anything but tier;
  - requiredSphere and `maxSpellsKnown` prerequisites (declared, unchecked today, `spellActivation.ts:95-155`);
  - monster casts.
- **The mutex with THR-1572 is real.** The generator plan writes into `SPELL_TEMPLATES`' shape. Land S1 first.

> Brainstorm companion: `Docs/plans/2026-09-29-thr-1571-power-runtime-brainstorm.md`

## Intent-judge verdict

*2026-09-29, judged on fable, cold context; proposal at `Docs/plans/.intent-proposals/2026-09-29-thr-1571-power-runtime.md`. Nine substrate claims spot-checked against source, all verified.*

- **Run 1 — Revise.** Four GAPs:
  - The kill-criterion rollback was tier-keyed. With 103 of 104 casters `ambient`, it would have switched seeding off.
  - `CAST_THRESHOLD_BASE = 0.55` sat inside the 50–65% engagement window, so casters would cast on most steps.
  - The per-caster cooldown key shared the attachment-keyed `effectStates` map.
  - Wiring lacked the player-controls and prose lines, and "Strained" had no UL-proposal issue.

  Fixed: `SEEDED_CASTER_ROLES` / `SEEDED_SPELL_COVERAGE`; the threshold at 0.45 with its maximum at the window floor; a dedicated `GameState.castCooldowns`; the Wiring lines; [THR-1673](https://linear.app/threadbare/issue/THR-1673). The ruling-5 narrowing (the decision reads no nudge) is stated with a veto invited.
- **Run 2 — Allow.** Two GAPs with one root: the cooldown move had not propagated to S1.1, the wiring row, Blast Radius and Files to touch. Fixed before the PR; no re-run needed.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-29 (auditors on sonnet, run after the intent-judge Allow)*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS-with-note | 17 constants in `spell-casting-constants.ts`. Spell-content numbers (backlash probability 0.25, reveal range 2) sit in template data, not constants. |
| 2. Inspectability | PASS | Six trace types. The cast decision is recorded on `action.stepCasts` with its inputs. Debug levers `getSpellHolders`, `castSpell`, `getStepCast`. |
| 3. Determinism | PASS-with-note | No new outcome die. Backlash and teleport draws use hashed `siteRef:casterId` streams, and seeding makes no draws. Note: the hash does not visibly include the world seed. *(Resolved after the audit: both hashes now include `state.seed`.)* |
| 4. Fail-soft | PASS | Ten-row fail-soft table. "resolves as if no cast happened", and a missing strain definition falls back to `tick_exhaust`. |
| 5. Narrative over mechanical | PASS | The cast threshold is a courage-versus-prudence read. Casts and miscasts have GM-narration prose, and failure is plot. |
| 6. Additive over destructive | PASS-with-note | Optional fields and parameters throughout. Three deliberate behaviour changes (the `use × Power` coin becomes the band, `dispel`, strain payment), each with a regression test. |
| 7. Performance budget | PASS | Carried effects use the existing walk. `POWER_UPKEEP_TICK_COST_BUDGET_PCT = 5` is measured with the probe. `POWER_UPKEEP_MIN_SPOTLIGHT_TIER` is the reserve kill switch. |

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | S1 to S3 slices are specified (resolver, preconditions, seeding, step cast). It also has PRNG callouts, tick-phase statement, graph shape, constants, traces and a fail-soft table. |
| Content | present-and-substantive | Five spells are annotated, two fate-woven spells are ported, and there are eight strain conditions and eight innate powers. The prose tables and data tables are present. Encounter templates are N/A with a rationale. |
| UI | present-and-substantive | It has the odds line, afterimage line and chips, the sheet prefix, and debug levers plus `?spell=`. It also has a review path and lists the laws it engages. HexMapV2 is N/A with a rationale. |

The Wiring table maps each module to a call site or phase, UI component, GameState field, trace and debug lever. It also states that there are no player controls and that prose goes through `enrichProse`. The substrate inventory is present, labels each row, and includes a population count. Its premise nouns match `systems-inventory.md`. One note: the inventory also lists `playerCastDispatch.ts` and `magicPower.ts` (the ascendant's casts), which the plan does not mention. *(Resolved after the audit: a preserve row now names both.)*

PILLAR AUDIT: PASS-with-notes

### Vision audit

Premises touched: north star (the fate-picked band decides step and spell; a miscast is a consequence) is confirmed. The core loop is extended: a cast becomes a named line on the step's odds, with no new surface. Non-negotiables 1 (god, not protagonist: the mortal casts, and there is no player cast verb), 2, 3, 4 (edges), 5 (expansive design, conservative S1/S2/S3 implementation), 6 and 7 are confirmed. Design tensions 2 (systemic vs authored: seeded casters plus authored `castProse`) and 4 (legibility vs mystery: the odds line) are extended.

Contradictions: none. One soft tension: non-negotiable 3 (no raw numbers) sits against "casting *Hollow Crown* +N". The plan uses the existing modifier-line convention and says so. The Ruling 5 narrowing is flagged with a veto invited.

Notes: seeding ~104 casters leans toward emergence and could read as over-magicked, but it is named as a kill criterion with a lever. The taste profile's "elder magic: cosmology discovered, not selected" pattern is untested, since spells are pre-seeded by tradition shelf.

VISION AUDIT: PASS-with-notes
