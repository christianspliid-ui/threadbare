# Generic Effect System — Attachments, Spells & Divine Artifacts

**Date:** 2026-03-31
**Status:** Design
**Scope:** A declarative effect primitives layer that content creators compose onto any attachment — gear, conditions, spells, or god-tier artifacts — without writing engine code. Extends the existing attachment system (see `2026-03-10-attachment-system-design.md`) with a vocabulary of 29 reusable effect types, a spell subsystem, a cost/backlash framework, and scoped targeting for world-scale effects.

---

## Problem Statement

The current attachment system resolves modifiers from `reachBonus` on possession edges and `domainContributions` on trait nodes. These are always-on, flat numeric bonuses. A content creator who wants to express "a sword that gives +Iron but only in combat" or "a relic that teleports you once every 50 ticks at the cost of a crystal" has no vocabulary for conditionality, activation, costs, cooldowns, or world-manipulation. Every interesting behavior requires custom engine code.

We need a finite set of **composable effect primitives** — data, not code — that cover the full power spectrum from mundane gear through learnable spells to world-reshaping divine artifacts.

---

## Design Principles

1. **Effects are data, not code.** Content creators write JSON effect arrays on attachment templates. The engine interprets them through a small number of integration points.
2. **Composable, not monolithic.** A single attachment can carry multiple effects from different archetypes. A berserker helm can have a passive penalty, a conditional combat bonus, and a reactive stacking rage — all declared, no custom logic.
3. **Tiered complexity.** Simple gear uses 2-3 effect types. Spells use 5-8. God-tier artifacts use the full vocabulary. Content creators don't need to learn the entire system to make a sword.
4. **Enumerable predicates.** Conditional effects use a fixed set of predicates, not arbitrary code. This keeps the system deterministic and inspectable.
5. **Unified across categories.** The same effect types work on possessions, conditions, blessings, curses, bestowed powers, spells, and agreements. The attachment category determines acquisition and narrative framing, not mechanical behavior.

---

## Effect Primitives — Complete Vocabulary

### Tier 1: Gear Effects (1–14)

These cover mundane-to-mythic equipment, conditions, blessings, and curses. Most content will use only these.

#### 1. Passive Modifier

Always-on bonus or penalty while the attachment is active.

```typescript
{
  type: 'passive',
  reach: DomainReach,
  value: number              // positive = bonus, negative = penalty
}
```

**Already exists** as `reachBonus` on edges and `domainContributions` on traits. Formalizing it as an effect type makes it composable with conditions, scoping, and other effects.

*Examples: Iron Blade (+0.05 iron). Bruised Ribs (-0.04 iron). Sun-Touched (+0.08 star).*

#### 2. Consumable Charge

Grants a benefit on use, limited to N charges. Optionally destroyed when empty.

```typescript
{
  type: 'consumable_charge',
  charges: number,
  onUse: { reach: DomainReach, value: number },
  destroyOnEmpty: boolean
}
```

*Examples: Healing salve (3 charges, +0.15 heart per use, destroyed when empty). Scroll of warding (1 charge, +0.20 veil, consumed). Bottled starlight (5 charges, +0.08 star).*

#### 3. Duration Buff/Debuff

Bonus or penalty that counts down from moment of attachment, then optionally self-destructs.

```typescript
{
  type: 'duration',
  ticks: number,
  reach: DomainReach,
  value: number,
  destroyOnExpiry: boolean
}
```

**Partially exists** via `ticksRemaining` on `has_trait` edges. This formalizes it as a composable effect with explicit destruction semantics.

*Examples: Battle frenzy (+0.10 iron, 10 ticks, destroyed). Lingering poison (-0.06 stone, 30 ticks, destroyed). Moonblessed (+0.05 star, 40 ticks, remains as inert attachment).*

#### 4. Permanent Until Removed

Persists indefinitely. Only removed by explicit action — dispel, theft, trade, quest.

```typescript
{
  type: 'permanent',
  reach: DomainReach,
  value: number
}
```

*Examples: Cursed ring (-0.05 shadow, can't be removed without dispel). Branded mark (-0.08 heart, permanent). Sworn oath (+0.04 gold, permanent until broken).*

#### 5. Cooldown Effect

Activates periodically — active for X ticks, dormant for Y ticks, repeats.

```typescript
{
  type: 'cooldown',
  activeTicks: number,
  cooldownTicks: number,
  reach: DomainReach,
  value: number
}
```

*Examples: Enchanted blade that glows hot (active 5 ticks / cooldown 15 ticks, +0.08 iron while active). Prayer beads (active 3 / cooldown 20, +0.12 star while active). Berserker rage (active 8 / cooldown 30, +0.10 iron, -0.05 heart while active — combine with tradeoff).*

#### 6. Conditional Modifier

Bonus or penalty that only applies when a predicate evaluates to true.

```typescript
{
  type: 'conditional',
  condition: EffectCondition,
  reach: DomainReach,
  value: number
}
```

**Condition Predicates** — a finite, enumerable set:

| Predicate | Meaning |
|-----------|---------|
| `in_combat` | Resolving a combat/iron encounter step |
| `in_social` | Resolving a social/heart/gold encounter step |
| `in_exploration` | Resolving exploration/eye/stone encounter step |
| `in_mystical` | Resolving veil/star encounter step |
| `at_home_territory` | Agent is on a hex controlled by their faction |
| `in_enemy_territory` | Agent is on a hex controlled by a hostile faction |
| `in_wilderness` | Agent is on an unclaimed/wild hex |
| `health_low` | Agent doom/stress above configurable threshold |
| `health_high` | Agent doom/stress below configurable threshold |
| `alone` | No other agents on same hex |
| `outnumbered` | More hostile agents than friendly on hex |
| `near_water` | Hex has coastal or river biome |
| `biome:<type>` | Agent is on a specific biome type (parameterized) |
| `has_trait:<tag>` | Agent has a trait with the specified tag |
| `lacks_trait:<tag>` | Agent does NOT have a trait with the specified tag |
| `reach_above:<reach>:<val>` | Agent's domain capability exceeds threshold |
| `faction_rank:<min>` | Agent holds minimum faction rank |

*Examples: Warhammer of the Deep (+0.10 iron, only `in_combat`). Diplomat's Seal (+0.08 gold, only `in_social`). Ranger's Cloak (+0.06 shadow, only `in_wilderness`). Forest Crown (+0.05 stone, only `biome:forest`).*

#### 7. Trait Grant

Doesn't give a numeric bonus — unlocks a qualitative capability or tag while attached.

```typescript
{
  type: 'trait_grant',
  grantedTrait: string           // tag or capability name
}
```

**Partially exists** via `grants[]` on possession edges and `grantsTraitWhileHeld` on possession node properties. Formalizing as an effect makes it composable with conditions, duration, and scope.

*Examples: Night vision (grants `night_vision` tag). Cavalry charge (grants `cavalry_charge` action). Water breathing (grants `water_breathing`). Ruin seeker (grants `ruin_seeker` — already used by treasure maps).*

#### 8. Transform

On trigger, the attachment replaces itself with a different template.

```typescript
{
  type: 'transform',
  trigger: TriggerCondition,
  probability: number,
  intoTemplate: string,           // template ID of the replacement attachment
  narrativeTemplate: string
}
```

*Examples: Dormant sword that awakens on first critical success → becomes Awakened Blade (higher tier, new effects). Cocoon that hatches after 30 ticks → becomes a companion (retainer). Sealed tome that opens on critical arcane success → becomes a spell scroll.*

#### 9. Stacking Modifier

Value accumulates over time or per event, up to a cap.

```typescript
{
  type: 'stacking',
  reach: DomainReach,
  valuePerStack: number,
  maxStacks: number,
  stackOn: StackTrigger,           // what adds a stack
  decayPerTick?: number            // optional: stacks decay over time
}
```

**Stack triggers:** `combat_success`, `combat_failure`, `social_success`, `any_encounter`, `per_tick`, `on_damaged`, `on_kill`, `on_heal`.

*Examples: Blood-drinking blade (+0.02 iron per `on_kill`, max 5 stacks). Scholar's focus (+0.02 eye per `any_encounter` involving exploration, max 3). Growing corruption (-0.01 heart per `per_tick`, max 15, no decay).*

#### 10. Aura / Proximity Effect

Modifier applies to nearby agents, not just the holder.

```typescript
{
  type: 'aura',
  radius: number,                  // 0 = same hex only
  target: 'allies' | 'enemies' | 'all',
  reach: DomainReach,
  value: number
}
```

*Examples: Banner of courage (radius 0, allies, +0.03 heart). Plague carrier (radius 0, enemies, -0.04 stone). War drums (radius 1, allies, +0.03 iron). Aura of dread (radius 1, enemies, -0.05 heart).*

#### 11. Reactive / Counter Effect

Fires when something happens TO the agent (incoming events), unlike on-use triggers which fire on the agent's own action outcomes.

```typescript
{
  type: 'reactive',
  trigger: ReactiveTrigger,
  effect: AttachmentEffect,        // any effect from this vocabulary
  duration?: number,               // how long the reactive bonus lasts once triggered
  cooldown?: number                // ticks before it can trigger again
}
```

**Reactive triggers:** `attacked`, `damaged`, `healed`, `cursed`, `blessed`, `entered_hex`, `encounter_started`, `ally_damaged`.

*Examples: Shield that hardens when struck (`attacked` → +0.05 iron for 3 ticks, 10 tick cooldown). Rage ring (`damaged` → stacking +0.03 iron, max 3). Ward stone (`cursed` → negate the curse, 50 tick cooldown).*

#### 12. Decay / Escalate

Modifier that changes in value each tick — weakening or strengthening over time.

```typescript
{
  type: 'decay',
  reach: DomainReach,
  startValue: number,
  changePerTick: number,           // negative = decay, positive = escalate
  limitValue: number,              // floor for decay, ceiling for escalate
  destroyAtLimit: boolean
}
```

*Examples: Fading blessing (+0.15 star, decays -0.01/tick, min 0, destroyed at min). Growing corruption (-0.02 shadow, escalates -0.01/tick, max -0.15). Dying ember light (+0.10 eye, decays -0.005/tick, min +0.02, persists dim).*

#### 13. Tradeoff

Multi-reach effect — explicitly models a cost. Bonus in one reach, penalty in another.

```typescript
{
  type: 'tradeoff',
  bonus: { reach: DomainReach, value: number },
  penalty: { reach: DomainReach, value: number }
}
```

Technically composable from two `passive` effects, but naming it as a type helps content creators think in terms of interesting design trade-offs and helps the UI display the cost/benefit clearly.

*Examples: Berserker helm (+0.10 iron, -0.06 heart). Dark pact (+0.08 veil, -0.05 star). War mount (+0.06 iron, -0.04 shadow — hard to sneak on a horse).*

#### 14. Expiry on Event

Lasts until a specific game event occurs — not tick-based, event-based destruction.

```typescript
{
  type: 'until_event',
  event: ExpiryEvent,
  reach: DomainReach,
  value: number,
  destroyOnEvent: boolean
}
```

**Expiry events:** `enter_combat`, `leave_combat`, `enter_territory`, `leave_territory`, `take_damage`, `rest`, `encounter_complete`, `faction_change`, `dawn_cycle`, `doom_threshold`.

*Examples: Stealth blessing (+0.10 shadow, destroyed when `enter_combat`). Territorial bond (+0.05 gold, destroyed when `leave_territory`). Peace treaty (+0.04 heart, destroyed when `enter_combat`).*

---

### Tier 2: Spell Effects (15–23)

These enable "rule bending" — doing things that aren't normally possible. Used primarily by learnable spells and powerful enchantments.

#### 15. Teleport / Forced Movement

Move self or target to a different hex, bypassing normal movement rules.

```typescript
{
  type: 'teleport',
  target: 'self' | 'other_agent',
  range: number | 'unlimited',
  destination?: 'random' | 'target_hex' | 'home' | 'nearest_ally'
}
| {
  type: 'forced_move',
  target: 'other_agent',
  direction: 'away' | 'toward' | 'random',
  hexes: number
}
```

*Examples: Blink (self, 5 hex range). Banish (other agent, unlimited, destination: random wilderness). Summon (other agent — ally, unlimited, destination: caster hex). Repel (forced move, away, 2 hexes).*

#### 16. Reveal / Scry

Bypass normal awareness range to see hidden information.

```typescript
{
  type: 'reveal',
  target: 'hexes' | 'agent' | 'encounters' | 'attachments',
  range: number | 'all',
  duration?: number                // ticks the revealed info remains visible
}
```

*Examples: Far Sight (reveal hexes in 5 range for 10 ticks). Mind Read (reveal target agent's attachments). Augury (reveal encounter outcomes before committing — special case, duration: 1 encounter). World Map (reveal all hexes for 1 tick).*

#### 17. Spawn / Summon

Bring something into existence on the map.

```typescript
{
  type: 'spawn',
  what: 'agent' | 'encounter' | 'attachment' | 'location',
  template: string,
  onHex: 'self' | 'target' | 'random',
  duration?: number,               // temporary summon duration (ticks)
  maxActive?: number               // max simultaneous instances
}
```

*Examples: Conjure Familiar (spawn agent, 'spirit_wolf', on self hex, 20 ticks, max 1). Create Ward (spawn attachment, 'barrier_ward', on self). Open Rift (spawn encounter, 'mystic_portal', on target hex). Found Outpost (spawn location, 'outpost', on self hex, permanent).*

#### 18. Negate / Dispel

Remove or suppress an active attachment, condition, or spell effect.

```typescript
{
  type: 'dispel',
  target: 'condition' | 'attachment' | 'spell' | 'aura',
  tags?: string[],                 // filter by tags (e.g. ['curse', 'disease'])
  tierMax?: AttachmentTier,        // only affects attachments up to this tier
  scope?: EffectScope
}
| {
  type: 'suppress',
  target: 'spell' | 'aura' | 'all_effects',
  scope: EffectScope,
  ticks: number
}
```

*Examples: Break Enchantment (dispel one attachment tagged 'magical', tier max 2). Purify (dispel all conditions tagged 'disease' or 'poison'). Silence (suppress all spells, scope: self hex, 5 ticks). Null Field (suppress all effects, scope: hex, 10 ticks).*

#### 19. Manipulate Encounter

Alter how an active encounter resolves — not a modifier on a roll, a change to the rules.

```typescript
{
  type: 'auto_succeed',
  encounterType?: string           // optional filter by encounter reach/type
}
| {
  type: 'reroll',
  uses: number
}
| {
  type: 'swap_reach',
  from: DomainReach,
  to: DomainReach,
  ticks?: number                   // how long the swap lasts
}
| {
  type: 'outcome_shift',
  steps: number                    // shift outcome N steps better/worse
}
```

*Examples: Silver Tongue (auto succeed one social encounter). Fate Weave (reroll 1 encounter this tick). Arcane Combat (swap iron → veil for 5 ticks — fight with magic). Dark Blessing (outcome shift +1 — failure becomes success).*

#### 20. Terrain / Hex Manipulation

Alter hex properties, create temporary terrain effects.

```typescript
{
  type: 'alter_terrain',
  target: 'self_hex' | 'target_hex',
  terrainEffect: string,           // named terrain overlay (see table below)
  ticks: number | 'permanent'
}
| {
  type: 'create_barrier',
  between: 'self_hex',
  and: 'adjacent',                 // direction or specific hex
  blocks: 'movement' | 'awareness' | 'both',
  ticks: number
}
```

**Named terrain overlays** (enumerable, not arbitrary):

| Overlay | Effect |
|---------|--------|
| `sacred_ground` | +star, -shadow for all agents on hex |
| `blighted` | -stone, -heart for all agents on hex |
| `fertile_ground` | +stone, increased encounter spawns |
| `frozen` | Movement cost doubled, -iron for all |
| `volcanic` | +iron, periodic damage conditions |
| `shrouded` | +shadow, -eye for all — reduced awareness |
| `hallowed` | Death prevented, +heart for all |
| `cursed_ground` | -star, doom rate increased |
| `wild_magic` | Spell cooldowns halved, backlash severity increased |
| `contested` | +iron for all, increased combat encounter spawns |

*Examples: Consecrate (sacred_ground, 20 ticks). Blight (blighted, 40 ticks). Wall of Thorns (barrier, blocks movement, 10 ticks). Eternal Winter (frozen, permanent — god-tier).*

#### 21. Redirect / Transfer

Move effects between targets — take something from one entity, give it to another.

```typescript
{
  type: 'transfer',
  what: 'condition' | 'modifier' | 'possession' | 'trait',
  from: 'self' | 'target',
  to: 'self' | 'target' | 'nearest_ally',
  tags?: string[],                 // filter what gets transferred
  tierMax?: AttachmentTier
}
```

*Examples: Martyr's Touch (transfer condition tagged 'wound' from target to self). Bestow Blessing (transfer condition tagged 'blessing' from self to target). Siphon (transfer possession, tier max 2, from target to self — magical theft). Purge and Gift (transfer condition tagged 'curse' from self to target enemy).*

#### 22. Temporal

Alter how time applies to the target — extra actions, frozen, or paused countdowns.

```typescript
{
  type: 'haste',
  target: 'self' | 'other_agent',
  extraActions: number,
  ticks: number
}
| {
  type: 'slow',
  target: 'other_agent',
  skipActions: boolean,            // true = completely frozen, false = halved
  ticks: number
}
| {
  type: 'freeze_duration',
  target: 'condition' | 'buff' | 'debuff',
  tags?: string[],
  ticks: number                    // how long to pause the countdown
}
```

*Examples: Time Dilation (haste self, +1 action, 3 ticks — then combine with exhaust cost). Stasis (slow target, skip actions, 5 ticks — frozen in time). Preserve (freeze duration on all 'blessing' conditions, 10 ticks — pause your buffs). Temporal Prison (slow target + create barrier around their hex, 8 ticks).*

#### 23. Compel

Modify another agent's decision-making — override movement targets, faction loyalty, or behavioral weights.

```typescript
{
  type: 'compel',
  target: 'other_agent',
  override: CompelOverride,
  value: string | number,
  ticks: number
}
```

**Compel overrides** (enumerable):

| Override | Effect |
|----------|--------|
| `movement_target` | Force agent to move toward a specific hex or entity |
| `faction_loyalty` | Temporarily switch agent's faction allegiance |
| `avoid_hex` | Agent will not enter a specific hex |
| `attack_target` | Agent will prioritize combat encounters with target |
| `protect_target` | Agent will prioritize staying near and defending target |
| `flee` | Agent will move away from caster / combat |
| `maslow_weight` | Override a specific Maslow drive weight |

*Examples: Dominate (compel other agent, movement_target: caster hex, 5 ticks). Charm (compel, faction_loyalty: caster faction, 10 ticks). Terror (compel, flee, 3 ticks). Geas (compel, protect_target: specific agent, 20 ticks).*

---

### Tier 3: God-Tier Effects (24–29)

These enable world-reshaping artifacts and divine interventions. Rare, expensive, consequential.

#### 24. Scoped Targeting (cross-cutting modifier)

Not an effect type itself — a **targeting modifier** that any effect can carry. Expands the reach of an effect from single-target to region, faction, biome, or global scale.

```typescript
type EffectScope =
  | { scope: 'self' }                                        // default
  | { scope: 'target' }                                      // one other entity
  | { scope: 'hex', target: 'self' | 'target' }              // one hex
  | { scope: 'radius', hexes: number }                        // hex radius from self
  | { scope: 'region', regionId: string | 'self_region' }    // entire province/territory
  | { scope: 'faction', faction: string | 'self' | 'enemy' } // all faction members
  | { scope: 'biome', biome: string }                         // all hexes of a biome type
  | { scope: 'global' };                                      // entire map
```

Any effect from types 1–23 can carry an optional `scope` field. A `passive` with `scope: region` means every agent in that region gets the bonus. A `conditional` with `scope: faction` means all faction members get the conditional buff. A `suppress` with `scope: global` means all spells on the entire map are silenced.

```
// Crown of the Ashen King — all faction members get +iron in combat
{ type: 'conditional', condition: 'in_combat', reach: 'iron', value: +0.06,
  scope: { scope: 'faction', faction: 'self' } }

// The Blightstone — all hexes in region become corrupted
{ type: 'alter_terrain', terrainEffect: 'blighted', ticks: 100,
  scope: { scope: 'region', regionId: 'self_region' } }

// Worldsong — every agent on the map gets +heart for 10 ticks
{ type: 'duration', ticks: 10, reach: 'heart', value: +0.04,
  scope: { scope: 'global' } }
```

#### 25. Create Structure

Permanently create locations, sublocations, landmarks, or connections on the world graph.

```typescript
{
  type: 'create_structure',
  what: 'location' | 'sublocation' | 'landmark' | 'trade_route' | 'barrier',
  subtype?: string,                // location subtype (shrine, fortress, market, etc.)
  onHex: 'self' | 'target',
  permanent: boolean,
  ticks?: number,                  // if not permanent
  properties?: Record<string, unknown>,
  connectTo?: string               // for trade_route/barrier: other endpoint
}
```

*Examples:*
- **Staff of Founding:** create_structure(location, subtype: 'settlement', self hex, permanent)
- **The Bridge Eternal:** create_structure(trade_route, self hex, permanent, connectTo: target hex)
- **Seed of the World-Tree:** create_structure(landmark, subtype: 'world_tree', self hex, permanent, properties: { sphereAffinity: 'star', encounterSpawnBonus: 2.0 })
- **Tower of Vigil:** create_structure(sublocation, subtype: 'watchtower', self hex, permanent, properties: { awarenessBonus: 3 })

#### 26. Destroy Structure

Raze, collapse, or erase locations and world features.

```typescript
{
  type: 'destroy_structure',
  what: 'location' | 'sublocation' | 'all_sublocations' | 'trade_route',
  target: 'target_location' | 'on_hex',
  permanent: boolean,
  ticks?: number,                  // if not permanent: rubble clears after N ticks
  leavesBehind?: string            // optional replacement (e.g. 'ruins', 'crater', 'void_scar')
}
```

*Examples:*
- **The Sundering Hammer:** destroy_structure(location, target, permanent: true, leavesBehind: 'ruins')
- **Earthquake:** destroy_structure(all_sublocations, on self hex, permanent: false, ticks: 50)
- **The Void Seed:** destroy_structure(location, target, permanent: true, leavesBehind: 'void_scar')
- **Sever Trade:** destroy_structure(trade_route, target, permanent: true)

#### 27. Modify Rules

Change how game systems work within a scope — not a modifier on a roll, a change to which rules apply.

```typescript
{
  type: 'modify_rules',
  scope: EffectScope,
  rule: RuleOverride,
  value: number | boolean | string,
  ticks: number | 'permanent'
}
```

**Enumerable rule overrides:**

| Rule Key | Type | What it changes |
|----------|------|----------------|
| `encounter_reach_override` | `{ from, to }` | Resolve encounters using a different reach |
| `movement_cost_multiplier` | `number` | Change how expensive it is to cross hexes in scope |
| `death_prevented` | `boolean` | Agents can't die within scope |
| `healing_multiplier` | `number` | Conditions heal faster/slower |
| `spawn_rate_multiplier` | `number` | Encounters spawn more/less frequently |
| `awareness_range_bonus` | `number` | All agents in scope see further |
| `tier_advancement_cost_multiplier` | `number` | Enchanting is cheaper/more expensive |
| `faction_influence_multiplier` | `number` | Faction control spreads faster/slower |
| `cooldown_multiplier` | `number` | Spells recharge faster/slower |
| `backlash_severity_multiplier` | `number` | Magic is more/less dangerous |
| `doom_rate_multiplier` | `number` | Doom accumulates faster/slower |
| `reward_tier_bonus` | `number` | Encounter rewards tend toward higher tiers |
| `encounter_difficulty_modifier` | `number` | All encounters easier/harder |

*Examples:*
- **Sanctum of Peace:** modify_rules(scope: hex, death_prevented: true, permanent)
- **The Maelstrom Crown:** modify_rules(scope: region, spawn_rate_multiplier: 3.0, 100 ticks) — chaos
- **Ley Line Nexus:** modify_rules(scope: hex, cooldown_multiplier: 0.5, permanent) — spells recharge 2x
- **The Withering:** modify_rules(scope: region, doom_rate_multiplier: 2.0, 50 ticks)
- **Fortune's Chalice:** modify_rules(scope: hex, reward_tier_bonus: +1, permanent)

#### 28. Faction Manipulation

Directly modify faction dynamics — alliances, wars, loyalty, control.

```typescript
{
  type: 'faction_manipulate',
  action: FactionAction,
  // fields vary by action — see below
}
```

**Faction actions:**

| Action | Parameters | Effect |
|--------|-----------|--------|
| `shift_relationship` | `between: [id, id], amount: number` | Push two factions toward alliance (+) or war (-) |
| `transfer_control` | `hex: 'self'\|'target', to: string\|'self_faction'` | Instant hex conquest |
| `splinter` | `target: string, loyalty: 'caster'\|'neutral'\|'hostile'` | Split a faction — some agents defect to a new faction |
| `absorb` | `from: string, into: string\|'self_faction'` | Merge a faction into another |
| `declare_war` | `between: [id, id]` | Force two factions into war state |
| `force_peace` | `between: [id, id], ticks: number` | Prevent hostilities between two factions for N ticks |

*Examples:*
- **The Diplomat's Crown:** faction_manipulate(shift_relationship, between: [any, any], +40)
- **Banner of Conquest:** faction_manipulate(transfer_control, hex: target, to: self_faction)
- **The Whispering Dagger:** faction_manipulate(splinter, target: enemy faction, loyalty: caster)
- **Treaty Stone:** faction_manipulate(force_peace, between: [A, B], 100 ticks)

#### 29. Cascade / Chain

An effect that, when it fires, triggers a sequence of follow-on effects. This is what makes artifacts feel *mythic* — consequences ripple outward.

```typescript
{
  type: 'cascade',
  triggerEffect: AttachmentEffect | SpellEffect,   // the initial effect
  then: (AttachmentEffect | SpellEffect)[],         // effects that follow
  delay?: number                                     // ticks between trigger and cascade
}
```

*Example: The artifact razes a city, which spawns refugee encounters on nearby hexes, turns the owning faction hostile, and inflicts guilt on the wielder. One action, four consequences, all declarative.*

```typescript
{
  type: 'cascade',
  triggerEffect: {
    type: 'destroy_structure', what: 'location', target: 'target', permanent: true,
    leavesBehind: 'ruins'
  },
  then: [
    { type: 'spawn', what: 'encounter', template: 'refugees',
      scope: { scope: 'radius', hexes: 2 } },
    { type: 'faction_manipulate', action: 'shift_relationship',
      between: ['target_faction', 'self_faction'], amount: -80 },
    { type: 'duration', ticks: 30, reach: 'heart', value: -0.08 }  // war guilt on caster
  ],
  delay: 1
}
```

---

## The Spell Subsystem

### Spells as Learnable Attachments

A spell is an attachment of category `spell` — a new seventh category alongside possession, condition, blessing, curse, bestowed_power, and agreement. It lives on the agent via a `knows_spell` edge (new edge type). It doesn't give passive bonuses by default — it grants an **activatable action** with costs and consequences.

### Spell Data Shape

```typescript
interface SpellTemplate {
  id: string;
  name: string;
  tier: AttachmentTier;
  tags: string[];
  sphereAffinity: string;
  flavorText: string;
  mechanicalSummary: string;

  // --- Prerequisites to LEARN ---
  prerequisites: {
    minReach?: Partial<Record<DomainReach, number>>;  // e.g. { veil: 0.30 }
    requiredTraits?: string[];                         // must have specific traits
    requiredSphere?: string;                           // sphere alignment
    maxSpellsKnown?: number;                           // slot limit per tier
    requiredAttachment?: string;                       // e.g. must hold a specific tome
  };

  // --- What it does when cast (array of any effects from the 29 types) ---
  effects: (AttachmentEffect | SpellEffect)[];

  // --- What it costs ---
  cost: SpellCost | SpellCost[];

  // --- When it can be cast again ---
  cooldownTicks: number;

  // --- What goes wrong ---
  backlash?: BacklashEffect;

  // --- Optional passive rider (some spells also give a small always-on effect) ---
  passiveEffects?: AttachmentEffect[];

  // --- Targeting ---
  targeting: SpellTargeting;
}
```

### Spell Cost System

Every spell has a cost. Costs should be interesting choices, not just "pay mana."

```typescript
type SpellCost =
  | { type: 'reach_drain', reach: DomainReach, amount: number }
  | { type: 'attachment_consume', tag: string }
  | { type: 'condition_inflict', template: string }
  | { type: 'doom_increase', amount: number }
  | { type: 'relationship_damage', target: 'nearest_ally' | 'faction', amount: number }
  | { type: 'tick_exhaust', ticks: number }
  | { type: 'health_sacrifice', amount: number }
  | { type: 'multi', costs: SpellCost[] };
```

| Cost Type | Meaning | Design Intent |
|-----------|---------|---------------|
| `reach_drain` | Temporarily lose capability in a domain | Power vs. weakening yourself |
| `attachment_consume` | Destroy a possession matching tag | Expendable resources (crystals, scrolls, herbs) |
| `condition_inflict` | Take a wound, disease, or negative condition | Health as currency |
| `doom_increase` | Push toward destruction | Power vs. mortality |
| `relationship_damage` | Damage social bonds | Control vs. isolation |
| `tick_exhaust` | Can't act for N ticks after casting | Power vs. vulnerability window |
| `health_sacrifice` | Direct health/vitality cost | Simple, immediate trade |
| `multi` | Combine multiple costs | Complex, high-tier spells |

### Backlash System

Spells that fail (bad roll, overuse, or casting beyond your tier) have consequences.

```typescript
interface BacklashEffect {
  trigger: 'failure' | 'critical_failure' | 'overcost' | 'always';
  probability: number;             // 0.0–1.0, chance backlash fires on trigger
  severity: 'minor' | 'major' | 'catastrophic';
  effect: AttachmentEffect | SpellEffect;
  narrativeTemplate: string;
}
```

Severity determines trace logging and UI presentation. The actual mechanical consequence is defined by the `effect` field — any effect from the vocabulary, turned against the caster.

*Examples: Botched teleport lands you on a random hex (teleport, self, destination: random). Failed summoning spawns a hostile creature (spawn, agent, template: hostile_spirit). Overcasting burns out the spell (destroy attachment: self). Catastrophic failure on world-shaping creates a void scar instead (cascade of bad outcomes).*

### Spell Targeting

```typescript
type SpellTargeting =
  | { type: 'self' }
  | { type: 'agent', range: number, filter?: 'ally' | 'enemy' | 'any' }
  | { type: 'hex', range: number }
  | { type: 'location', range: number }
  | { type: 'attachment', on: 'self' | 'target', tags?: string[] };
```

---

## Example Spells (Composing Primitives)

### "Veilwalk" (T2, veil-aligned)

Phase through solid barriers.

```typescript
{
  id: 'spell_veilwalk',
  name: 'Veilwalk',
  tier: 2,
  sphereAffinity: 'veil',
  prerequisites: { minReach: { veil: 0.20 } },
  effects: [
    { type: 'teleport', target: 'self', range: 3 },
    { type: 'duration', ticks: 3, reach: 'shadow', value: +0.05, destroyOnExpiry: true }
  ],
  cost: { type: 'reach_drain', reach: 'veil', amount: 0.03 },
  cooldownTicks: 30,
  backlash: {
    trigger: 'failure', probability: 0.5, severity: 'minor',
    effect: { type: 'forced_move', target: 'self', direction: 'random', hexes: 1 },
    narrativeTemplate: 'The veil tears — {actor} stumbles through to the wrong place.'
  },
  targeting: { type: 'self' }
}
```

### "Soulfire" (T3, star-aligned)

Channel cosmic fire through combat.

```typescript
{
  id: 'spell_soulfire',
  name: 'Soulfire',
  tier: 3,
  sphereAffinity: 'star',
  prerequisites: { minReach: { star: 0.30, iron: 0.15 } },
  effects: [
    { type: 'swap_reach', from: 'iron', to: 'star', ticks: 8 },
    { type: 'stacking', reach: 'star', valuePerStack: +0.03, maxStacks: 4, stackOn: 'combat_success' }
  ],
  cost: { type: 'multi', costs: [
    { type: 'doom_increase', amount: 5 },
    { type: 'reach_drain', reach: 'heart', amount: 0.04 }
  ]},
  cooldownTicks: 40,
  backlash: {
    trigger: 'critical_failure', probability: 0.8, severity: 'major',
    effect: { type: 'decay', reach: 'star', startValue: 0, changePerTick: -0.02,
              limitValue: -0.10, destroyAtLimit: true },
    narrativeTemplate: 'The soulfire turns inward — {actor} feels their star essence fading.'
  },
  targeting: { type: 'self' }
}
```

### "Pact of the Hollow Crown" (T3, gold/shadow-aligned)

Political domination through dark charisma.

```typescript
{
  id: 'spell_hollow_crown',
  name: 'Pact of the Hollow Crown',
  tier: 3,
  sphereAffinity: 'shadow',
  prerequisites: { minReach: { gold: 0.25, shadow: 0.20 } },
  effects: [
    { type: 'aura', radius: 1, target: 'enemies', reach: 'gold', value: -0.08 },
    { type: 'conditional', condition: 'in_social', reach: 'gold', value: +0.12 }
  ],
  cost: { type: 'multi', costs: [
    { type: 'relationship_damage', target: 'nearest_ally', amount: 30 },
    { type: 'condition_inflict', template: 'paranoia_whispers' }
  ]},
  cooldownTicks: 60,
  backlash: {
    trigger: 'failure', probability: 0.6, severity: 'major',
    effect: { type: 'transfer', what: 'condition', tags: ['blessing'],
              from: 'self', to: 'target' },
    narrativeTemplate: 'The crown\'s shadow recoils — {actor}\'s blessings flow to their enemy.'
  },
  targeting: { type: 'agent', range: 2, filter: 'enemy' }
}
```

### "Crystal Gate" (T3, veil-aligned)

Teleport using rare crystals.

```typescript
{
  id: 'spell_crystal_gate',
  name: 'Crystal Gate',
  tier: 3,
  sphereAffinity: 'veil',
  prerequisites: { minReach: { veil: 0.35 }, requiredAttachment: 'wayfinder_crystal' },
  effects: [
    { type: 'teleport', target: 'self', range: 'unlimited', destination: 'target_hex' }
  ],
  cost: { type: 'attachment_consume', tag: 'wayfinder_crystal' },
  cooldownTicks: 50,
  backlash: {
    trigger: 'failure', probability: 0.3, severity: 'major',
    effect: { type: 'teleport', target: 'self', range: 'unlimited', destination: 'random' },
    narrativeTemplate: 'The crystal shatters mid-transit — {actor} emerges somewhere unexpected.'
  },
  targeting: { type: 'hex', range: 999 }
}
```

### "Last Breath" (T4, star-aligned)

Emergency resurrection.

```typescript
{
  id: 'spell_last_breath',
  name: 'Last Breath',
  tier: 4,
  sphereAffinity: 'star',
  prerequisites: { minReach: { star: 0.40, heart: 0.30 } },
  effects: [
    { type: 'dispel', target: 'condition', tags: ['dead'] },
    { type: 'duration', ticks: 30, reach: 'iron', value: -0.10, destroyOnExpiry: true }
  ],
  cost: { type: 'multi', costs: [
    { type: 'doom_increase', amount: 20 },
    { type: 'reach_drain', reach: 'star', amount: 0.10 },
    { type: 'tick_exhaust', ticks: 15 }
  ]},
  cooldownTicks: 200,
  backlash: {
    trigger: 'failure', probability: 1.0, severity: 'catastrophic',
    effect: { type: 'duration', ticks: 50, reach: 'star', value: -0.15, destroyOnExpiry: true },
    narrativeTemplate: 'Death notices the attempt. {actor}\'s connection to the stars dims.'
  },
  targeting: { type: 'agent', range: 0, filter: 'ally' }
}
```

---

## Example God-Tier Artifacts

### "The Worldforge Anvil" (T4 relic, permanent, cursed)

```typescript
{
  id: 'worldforge_anvil',
  name: 'The Worldforge Anvil',
  tier: 4,
  tags: ['legendary', 'creation', 'cursed'],
  lossCondition: 'cursed',
  effects: [
    // Passive: grants master smithing
    { type: 'trait_grant', grantedTrait: 'master_smith' },
    // Passive: the anvil weighs on the soul
    { type: 'permanent', reach: 'shadow', value: -0.04 }
  ],
  activatedEffects: [
    {
      name: 'Found Legendary Forge',
      cooldownTicks: 100,
      cost: { type: 'multi', costs: [
        { type: 'attachment_consume', tag: 'legendary_material' },
        { type: 'doom_increase', amount: 10 },
        { type: 'tick_exhaust', ticks: 20 }
      ]},
      effects: [
        {
          type: 'cascade',
          triggerEffect: {
            type: 'create_structure', what: 'sublocation', subtype: 'legendary_forge',
            onHex: 'self', permanent: true
          },
          then: [
            { type: 'modify_rules', scope: { scope: 'hex', target: 'self' },
              rule: 'tier_advancement_cost_multiplier', value: 0.5, ticks: 'permanent' },
            { type: 'alter_terrain', target: 'self_hex',
              terrainEffect: 'volcanic', ticks: 'permanent' }
          ]
        }
      ],
      backlash: {
        trigger: 'critical_failure', probability: 1.0, severity: 'catastrophic',
        effect: { type: 'destroy_structure', what: 'all_sublocations',
                  target: 'on_hex', permanent: true, leavesBehind: 'crater' },
        narrativeTemplate: 'The forge detonates — the earth swallows everything built here.'
      }
    }
  ]
}
```

### "Heartseed of the First Garden" (T4 blessed relic)

```typescript
{
  id: 'heartseed_first_garden',
  name: 'Heartseed of the First Garden',
  tier: 4,
  tags: ['legendary', 'creation', 'blessed', 'nature'],
  lossCondition: 'permanent',
  effects: [
    { type: 'aura', radius: 1, target: 'all', reach: 'heart', value: +0.03 },
    { type: 'aura', radius: 1, target: 'all', reach: 'stone', value: +0.03 }
  ],
  activatedEffects: [
    {
      name: 'Consecrate Grove',
      cooldownTicks: 100,
      cost: { type: 'multi', costs: [
        { type: 'tick_exhaust', ticks: 15 },
        { type: 'reach_drain', reach: 'iron', amount: 0.10 }
      ]},
      effects: [
        { type: 'alter_terrain', target: 'self_hex',
          terrainEffect: 'sacred_ground', ticks: 'permanent' },
        { type: 'modify_rules', scope: { scope: 'hex', target: 'self' },
          rule: 'healing_multiplier', value: 3.0, ticks: 'permanent' },
        { type: 'modify_rules', scope: { scope: 'hex', target: 'self' },
          rule: 'spawn_rate_multiplier', value: 0.3, ticks: 'permanent' }
      ]
    },
    {
      name: 'Plant the World-Tree',
      cooldownTicks: 9999,         // effectively once per game
      cost: { type: 'multi', costs: [
        { type: 'doom_increase', amount: 30 },
        // the seed is consumed — this destroys the artifact itself
        { type: 'attachment_consume', tag: 'self' }
      ]},
      effects: [
        {
          type: 'cascade',
          triggerEffect: {
            type: 'create_structure', what: 'landmark', subtype: 'world_tree',
            onHex: 'self', permanent: true,
            properties: { sphereAffinity: 'star', awarenessBonus: 5, encounterSpawnBonus: 2.0 }
          },
          then: [
            { type: 'modify_rules',
              scope: { scope: 'region', regionId: 'self_region' },
              rule: 'doom_rate_multiplier', value: 0.5, ticks: 'permanent' },
            { type: 'modify_rules',
              scope: { scope: 'region', regionId: 'self_region' },
              rule: 'healing_multiplier', value: 2.0, ticks: 'permanent' }
          ]
        }
      ]
    }
  ]
}
```

### "The Voidgate Shard" (T4 cursed relic)

```typescript
{
  id: 'voidgate_shard',
  name: 'The Voidgate Shard',
  tier: 4,
  tags: ['legendary', 'destruction', 'cursed', 'void'],
  lossCondition: 'cursed',
  effects: [
    // Passive: slowly hollows the wielder
    { type: 'decay', reach: 'heart', startValue: 0, changePerTick: -0.005,
      limitValue: -0.20, destroyAtLimit: false }
  ],
  activatedEffects: [
    {
      name: 'Void Step',
      cooldownTicks: 50,
      cost: { type: 'attachment_consume', tag: 'crystal' },
      effects: [
        { type: 'teleport', target: 'self', range: 'unlimited' }
      ],
      backlash: {
        trigger: 'failure', probability: 0.4, severity: 'minor',
        effect: { type: 'compel', target: 'self', override: 'movement_target',
                  value: 'random', ticks: 5 },
        narrativeTemplate: 'The void pulls {actor} somewhere they did not choose.'
      }
    },
    {
      name: 'Unmake',
      cooldownTicks: 150,
      cost: { type: 'multi', costs: [
        { type: 'doom_increase', amount: 25 },
        { type: 'reach_drain', reach: 'star', amount: 0.15 }
      ]},
      effects: [
        {
          type: 'cascade',
          triggerEffect: {
            type: 'destroy_structure', what: 'location', target: 'target_location',
            permanent: true, leavesBehind: 'void_scar'
          },
          then: [
            { type: 'spawn', what: 'encounter', template: 'void_horror',
              onHex: 'target' },
            { type: 'modify_rules', scope: { scope: 'hex', target: 'target' },
              rule: 'doom_rate_multiplier', value: 3.0, ticks: 50 },
            { type: 'faction_manipulate', action: 'shift_relationship',
              between: ['target_faction', 'self_faction'], amount: -100 }
          ]
        }
      ],
      backlash: {
        trigger: 'critical_failure', probability: 1.0, severity: 'catastrophic',
        effect: {
          type: 'cascade',
          triggerEffect: { type: 'destroy_structure', what: 'all_sublocations',
                           target: 'on_hex', permanent: true },
          then: [
            { type: 'duration', ticks: 30, reach: 'star', value: -0.20,
              destroyOnExpiry: true },
            { type: 'compel', target: 'self', override: 'flee', value: 'away', ticks: 10 }
          ]
        },
        narrativeTemplate: 'The void hungers — it takes more than was offered.'
      }
    }
  ]
}
```

---

## Engine Integration Points

Three functions interpret effect data at runtime. No per-effect-type engine code is needed by content creators.

### 1. `resolveEffectModifiers(agent, context): ModifierResult`

Called during encounter resolution. Walks all attachments on the agent, evaluates which effects are currently active (checking predicates, cooldown state, duration, stacks), and sums applicable modifiers. Replaces the current separate `equipmentModifier` + `traitBonus` calculation in `resolutionModifiers.ts`.

Also resolves aura effects from nearby agents and scoped region/faction/global effects.

### 2. `tickEffects(agent, tick): EffectTickResult`

Called each tick per agent. Handles all time-based effect bookkeeping:
- Decrement duration counters, destroy expired effects
- Cycle cooldown states (active → dormant → ready)
- Apply decay/escalation per tick
- Accumulate tick-based stacks
- Check event-based expiry conditions
- Process compel overrides on agent decision inputs
- Remove destroyed attachments from graph

### 3. `activateSpell(agent, spellId, target, context): ActivationResult`

Called when an agent (or player intervention) activates a spell or artifact ability. Handles:
- Prerequisite validation (can this agent cast this spell?)
- Cooldown check (is it ready?)
- Cost payment (deduct resources, consume attachments, inflict conditions)
- Effect resolution (apply all effects in the spell's effect array)
- Cascade processing (trigger follow-on effects with optional delay)
- Backlash resolution (on failure, evaluate backlash effects)
- Trace emission for inspectability

### 4. `propagateAuraEffects(hex, agents): AuraResult`

Called when agents enter/leave a hex or aura sources change. Recalculates which aura effects apply to which agents based on proximity and faction filtering.

### 5. `evaluateScopedEffects(scope, effect): ScopedResult`

Called for region/faction/biome/global effects. Resolves which entities fall within scope and applies the effect. Cached per structural version to avoid per-tick recomputation for permanent scoped effects.

---

## Constants Table (NFP #1: Tunability)

| Constant | Default | Purpose |
|----------|---------|---------|
| `MAX_EFFECTS_PER_ATTACHMENT` | 6 | Content guard — prevent combinatorial explosion |
| `MAX_ACTIVATED_ABILITIES_PER_ATTACHMENT` | 3 | Limit on activatable spell/ability slots |
| `MAX_SPELLS_KNOWN_PER_TIER` | `{ 1: 5, 2: 3, 3: 2, 4: 1 }` | Spell slot limits by tier |
| `AURA_MAX_RADIUS` | 2 | Max hex radius for aura effects |
| `SCOPE_REGION_MAX_HEXES` | 50 | Performance cap on region-scoped effects |
| `COOLDOWN_MINIMUM_TICKS` | 5 | Floor for cooldown values |
| `BACKLASH_PROBABILITY_FLOOR` | 0.05 | Minimum backlash chance even for trivial spells |
| `STACKING_GLOBAL_CAP` | 10 | Hard cap on stacks regardless of per-effect maxStacks |
| `DECAY_MIN_TICK_INTERVAL` | 1 | How often decay/escalate recalculates |
| `CASCADE_MAX_DEPTH` | 3 | Prevent infinite cascade chains |
| `CASCADE_MAX_EFFECTS` | 8 | Max total effects in a single cascade chain |
| `COMPEL_MAX_TICKS` | 20 | Hard cap on compel duration |
| `SPELL_COST_REACH_DRAIN_CAP` | 0.20 | Max reach drain from a single spell cast |
| `DOOM_COST_CAP_PER_CAST` | 30 | Max doom increase from a single spell cast |
| `CONDITIONAL_EVALUATION_CAP` | 3 | Max conditional predicates evaluated per effect |
| `RULE_OVERRIDE_MAX_PER_HEX` | 5 | Max simultaneous rule overrides on one hex |

---

## Tracing (NFP #2: Inspectability)

```typescript
interface EffectActivationTrace {
  type: 'effect_activation';
  tick: number;
  agentId: string;
  attachmentId: string;
  effectType: string;              // which of the 29 effect types
  effectDetails: Record<string, unknown>;
  result: 'applied' | 'blocked_cooldown' | 'blocked_prerequisite' | 'backlash';
  modifierContribution?: number;
  costsPaid?: SpellCost[];
  backlashFired?: boolean;
}

interface EffectTickTrace {
  type: 'effect_tick';
  tick: number;
  agentId: string;
  attachmentId: string;
  action: 'decrement' | 'expire' | 'destroy' | 'stack' | 'decay' | 'cooldown_cycle';
  details: Record<string, unknown>;
}

interface ScopedEffectTrace {
  type: 'scoped_effect';
  tick: number;
  sourceAgentId: string;
  sourceAttachmentId: string;
  scope: EffectScope;
  affectedCount: number;
  effectType: string;
}
```

---

## Fail-Soft Table (NFP #4)

| Failure Case | Fallback |
|-------------|----------|
| Effect references unknown reach | Skip effect, emit warning trace |
| Conditional predicate unknown | Treat as false (effect inactive), emit warning |
| Spell cost can't be paid (insufficient reach) | Block activation, trace reason |
| Attachment_consume finds no matching tag | Block activation, trace reason |
| Cascade depth exceeds limit | Truncate chain, emit warning trace |
| Scope resolution finds 0 targets | No-op, trace empty scope |
| Aura radius exceeds cap | Clamp to max, emit warning |
| Stacks exceed global cap | Clamp to cap |
| Transform template not found | Keep original attachment, emit warning |
| Rule override conflict (two overlapping) | Last-write-wins by tick order, trace conflict |
| Compel target is player-controlled agent | Block compel (player agency preserved), trace |

---

## PRNG Callouts (NFP #3: Determinism)

| Operation | PRNG Use |
|-----------|----------|
| Backlash probability check | Seeded roll per activation |
| Consumable charge on-use | Seeded per encounter resolution |
| Stacking trigger probability | Seeded per event |
| Transform trigger probability | Seeded per encounter outcome |
| Reactive trigger evaluation | Seeded per incoming event |
| Random teleport destination | Seeded hex selection from valid set |
| Forced movement random direction | Seeded direction pick |
| Splinter faction member selection | Seeded agent subset |
| Cascade delay jitter (if added) | Seeded tick offset |

---

## UI / Visibility Phase

### Attachment Detail Card

Extend the existing detail card (see `2026-03-16-attachment-detail-card-design.md`) to show:
- **Effect list** with icons per effect type (sword icon for passive combat, hourglass for duration, etc.)
- **Conditional indicators** — greyed out when inactive, lit when condition is met
- **Cooldown bar** — visual progress toward next activation
- **Stack counter** — current/max stacks displayed
- **Cost preview** — before activation, show what the spell will cost
- **Backlash warning** — severity indicator (minor/major/catastrophic)

### Debug Panel

- New "Effects" tab showing all active effects on selected agent
- Scoped effects overlay on hex map (highlight affected hexes)
- Spell activation log in trace viewer
- Rule override indicators on hex tooltips

### HexMapV2 Signifiers

- Terrain overlay effects visible as hex tint changes
- Aura radius visible as subtle glow around source agent
- Barrier effects visible as hex edge highlights
- Active scoped effects (region blessing/curse) as region-wide tint

---

## Wiring Section

| Surface | Integration |
|---------|-------------|
| **Orchestrator phase** | New `phaseEffectTick` after agent decisions, before encounter resolution. Calls `tickEffects()` per agent. |
| **Encounter resolution** | `resolveEffectModifiers()` replaces current `getEquipmentModifier()` + `getTraitBonus()` in `resolutionModifiers.ts` |
| **Agent decision** | `compel` overrides injected into decision inputs in `phaseAgentDecision` |
| **Spell activation** | New `activateSpell()` callable from agent decision phase (NPC) or player intervention (ActionDrawer) |
| **UI: AttachmentDetailCard** | Extended to render effect arrays, cooldown bars, stack counters, cost previews |
| **UI: ActionDrawer** | Spell activation cards appear for player-controlled agents with valid spells |
| **UI: DebugPanel** | Effects tab, scoped effect overlays, spell activation traces |
| **UI: HexMapV2** | Terrain overlays, aura visualization, barrier edge rendering |
| **GameState** | New fields: `effectStates` (cooldown timers, stack counts, decay values per attachment), `activeRuleOverrides` (per hex/region), `activeAuras` (source → affected mapping) |
| **Traces** | `effect_activation`, `effect_tick`, `scoped_effect` trace types |
| **Prose pipeline** | `enrichProse()` references for spell-related narrative templates |

---

## Summary — Full Primitive Count

| # | Effect Type | Tier | Primary Use |
|---|-------------|------|-------------|
| 1 | Passive Modifier | Gear | Always-on bonus/penalty |
| 2 | Consumable Charge | Gear | Limited-use items |
| 3 | Duration Buff/Debuff | Gear | Temporary conditions |
| 4 | Permanent Until Removed | Gear | Curses, oaths, brands |
| 5 | Cooldown | Gear | Periodically active effects |
| 6 | Conditional Modifier | Gear | Context-sensitive bonuses |
| 7 | Trait Grant | Gear | Unlock capabilities |
| 8 | Transform | Gear | Attachment evolution |
| 9 | Stacking | Gear | Accumulating bonuses |
| 10 | Aura / Proximity | Gear | Affect nearby agents |
| 11 | Reactive / Counter | Gear | Trigger on incoming events |
| 12 | Decay / Escalate | Gear | Time-varying modifiers |
| 13 | Tradeoff | Gear | Explicit cost/benefit |
| 14 | Expiry on Event | Gear | Event-based destruction |
| 15 | Teleport / Forced Movement | Spell | Bypass movement rules |
| 16 | Reveal / Scry | Spell | Bypass awareness rules |
| 17 | Spawn / Summon | Spell | Create entities |
| 18 | Negate / Dispel | Spell | Remove effects |
| 19 | Manipulate Encounter | Spell | Bend resolution rules |
| 20 | Terrain / Hex Manipulation | Spell | Alter hex properties |
| 21 | Redirect / Transfer | Spell | Move effects between targets |
| 22 | Temporal | Spell | Alter tick/action timing |
| 23 | Compel | Spell | Override agent decisions |
| 24 | Scoped Targeting | God-tier | Region/faction/global reach |
| 25 | Create Structure | God-tier | Add world graph nodes |
| 26 | Destroy Structure | God-tier | Remove world graph nodes |
| 27 | Modify Rules | God-tier | Change game system behavior |
| 28 | Faction Manipulation | God-tier | Alter faction dynamics |
| 29 | Cascade / Chain | God-tier | Rippling consequences |

Plus: **Spell Cost system** (8 cost types), **Backlash system**, and **Spell prerequisite/targeting/cooldown framework**.

---

## Implementation Priority

| Phase | What | Why |
|-------|------|-----|
| **P0** | Effect type definitions + `resolveEffectModifiers` | Foundation. Migrate existing `reachBonus`/`domainContributions` to new effect format. Types 1, 3, 4, 6, 7, 13. |
| **P1** | `tickEffects` + time-based effects | Duration, cooldown, decay, stacking, expiry. Types 2, 5, 9, 12, 14. |
| **P2** | Reactive + aura + conditional predicates | Proximity and event-driven effects. Types 10, 11. Full predicate evaluation. |
| **P3** | Spell framework + activation/cost/backlash | `SpellTemplate`, `activateSpell()`, cost payment, backlash resolution, `knows_spell` edge. |
| **P4** | Spell effect types (rule benders) | Types 15–23. Teleport, scry, spawn, dispel, encounter manipulation, terrain, transfer, temporal, compel. |
| **P5** | Transform + cascade | Type 8, 29. Attachment evolution and ripple effects. |
| **P6** | God-tier: scope, structure, rules, factions | Types 24–28. Region/global targeting, create/destroy structures, rule overrides, faction manipulation. |
| **P7** | UI: detail cards, debug panel, hex map overlays | Visual layer for all effects. |

Each phase is independently shippable. P0 alone improves the current system by making existing modifiers composable with conditions. Content creators can start using conditional modifiers and tradeoffs immediately.
