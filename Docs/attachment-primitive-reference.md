# Attachment Primitive Reference Card

Quick-lookup for agents authoring attachments. Find your narrative pattern, grab the primitive, fill in the fields.

Types: `src/types/effects.ts` | Constants: `src/data/effect-constants.ts` | Caps: per-item 0.15, global 0.30

---

## Story Pattern → Primitive

### "It gets stronger the more you use it"
**stacking** — accumulates bonus per trigger event, up to a cap.
```json
{ "type": "stacking", "reach": "iron", "valuePerStack": 0.02, "maxStacks": 5, "stackOn": "combat_success", "decayPerTick": 0.01 }
```
Triggers: `combat_success`, `combat_failure`, `social_success`, `any_encounter`, `per_tick`, `on_damaged`, `on_kill`, `on_heal`

### "It fades over time"
**decay** — starts strong, weakens each tick. Optionally self-destructs.
```json
{ "type": "decay", "reach": "veil", "startValue": 0.12, "changePerTick": -0.01, "limitValue": 0.03, "destroyAtLimit": false }
```

### "It only works in certain situations"
**conditional** — bonus activates when a predicate is true, otherwise inert.
```json
{ "type": "conditional", "condition": "in_combat", "reach": "iron", "value": 0.08 }
```
Predicates: `in_combat`, `in_social`, `in_exploration`, `in_mystical`, `at_home_territory`, `in_enemy_territory`, `in_wilderness`, `health_low`, `health_high`, `alone`, `outnumbered`, `near_water`, `biome:{type}`, `has_trait:{tag}`, `lacks_trait:{tag}`, `reach_above:{reach}:{value}`, `faction_rank:{rank}`

### "It's powerful but needs to recharge"
**cooldown** — on for N ticks, off for M ticks. Cycles automatically.
```json
{ "type": "cooldown", "activeTicks": 3, "cooldownTicks": 7, "reach": "eye", "value": 0.10 }
```

### "It has limited uses, then it's gone"
**consumable_charge** — N charges. Each use fires the effect and burns a charge.
```json
{ "type": "consumable_charge", "charges": 3, "onUse": { "reach": "flesh", "value": 0.12 }, "destroyOnEmpty": true }
```

### "It gives you something but costs you something else"
**tradeoff** — bonus to one reach, penalty to another. Always-on tension.
```json
{ "type": "tradeoff", "bonus": { "reach": "iron", "value": 0.08 }, "penalty": { "reach": "heart", "value": 0.04 } }
```

### "It saves you when things go wrong"
**test_shaper** — after a roll, shift the result. Reroll, nudge up, or swap reach.
```json
{ "type": "test_shaper", "reach": "iron", "condition": "in_combat", "trigger": "near_miss", "maxMargin": 8, "steps": 1 }
```
Triggers: `near_miss` (close failure), `failure` (any failure), `success` (upgrade to crit), `any`

**prevent_loss** — absorb a loss event (quintessence drain, condition infliction).
```json
{ "type": "prevent_loss", "channel": "quintessence", "amount": 0.08, "consumeOnPrevent": true }
```
Channels: `quintessence`, `condition`

### "It changes into something else"
**transform** — on trigger event, the attachment replaces itself with a different template.
```json
{ "type": "transform", "trigger": "take_damage", "probability": 0.3, "intoTemplate": "scar_old_wound", "narrativeTemplate": "{name} darkens and cracks." }
```
Triggers: `enter_combat`, `leave_combat`, `take_damage`, `rest`, `encounter_complete`, `faction_change`, `dawn_cycle`, `doom_threshold`

### "It reacts when something happens to you"
**reactive** — fires a nested effect when a trigger event occurs.
```json
{ "type": "reactive", "trigger": "damaged", "effect": { "type": "duration", "ticks": 3, "reach": "iron", "value": 0.06, "destroyOnExpiry": false }, "cooldown": 10 }
```
Triggers: `attacked`, `damaged`, `healed`, `cursed`, `blessed`, `entered_hex`, `encounter_started`, `ally_damaged`

### "It grants a capability, not a number"
**trait_grant** — while attached, the agent has a named trait. Enables qualitative gating.
```json
{ "type": "trait_grant", "grantedTrait": "night_vision" }
```

### "It lasts until something specific happens"
**until_event** — bonus persists until a game event fires, then expires.
```json
{ "type": "until_event", "event": "enter_combat", "reach": "shadow", "value": 0.10, "destroyOnEvent": false }
```

### "It's just a flat bonus" (use sparingly)
**passive** — always-on, no conditions. Use as a base layer under something interesting, not alone.
```json
{ "type": "passive", "reach": "gold", "value": 0.04 }
```

---

## On-Use Triggers (post-encounter)

Add `onUseTriggers` to fire effects after encounter resolution. Good for breakage, lucky saves, curse spreading.

```json
{
  "triggerCondition": "critical_failure",
  "probability": 0.25,
  "effect": { "type": "remove_possession" },
  "narrativeTemplate": "{item_name} snaps against the blow."
}
```
Conditions: `critical_failure`, `failure`, `success`, `critical_success`, `any_use`, `first_use`
Effects: `add_condition`, `remove_condition`, `remove_possession`, `spawn_actor`, `add_possession`, `modify_relationship`

---

## Composition Examples

**T2 — "grows with you"**: conditional + stacking
```json
"effects": [
  { "type": "conditional", "condition": "in_combat", "reach": "iron", "value": 0.04 },
  { "type": "stacking", "reach": "iron", "valuePerStack": 0.015, "maxStacks": 3, "stackOn": "combat_success" }
]
```

**T3 — "powerful but costs you"**: cooldown + tradeoff
```json
"effects": [
  { "type": "cooldown", "activeTicks": 3, "cooldownTicks": 8, "reach": "veil", "value": 0.10 },
  { "type": "tradeoff", "bonus": { "reach": "veil", "value": 0.05 }, "penalty": { "reach": "flesh", "value": 0.03 } }
]
```

**T4 — "legendary with a dark side"**: conditional + stacking + reactive + transform
```json
"effects": [
  { "type": "conditional", "condition": "in_combat", "reach": "iron", "value": 0.06 },
  { "type": "stacking", "reach": "iron", "valuePerStack": 0.02, "maxStacks": 4, "stackOn": "on_kill" },
  { "type": "reactive", "trigger": "damaged", "effect": { "type": "duration", "ticks": 3, "reach": "iron", "value": 0.05, "destroyOnExpiry": false }, "cooldown": 10 },
  { "type": "transform", "trigger": "doom_threshold", "probability": 0.5, "intoTemplate": "cursed_blade_of_ruin", "narrativeTemplate": "The blade drinks deep and will not be sheathed." }
]
```

---

## Quick Constraints

- **T1**: 1 effect, value 0.03-0.05
- **T2**: 1-2 effects, value 0.05-0.08
- **T3**: 2-3 effects, value 0.08-0.12
- **T4**: 3-4 effects, value 0.10-0.15
- Per-item cap: 0.15 total across all reaches
- Loss conditions by subcategory: arms→breakable, provisions→consumable, relics→permanent/cursed, tools→breakable, vestments→breakable/stealable, mounts→permanent, tomes→stealable
- Tags: always include `#<primary_reach>`, `#<subcategory>`, optionally `#<sphere>`
- Nine reaches: iron, gold, shadow, veil, heart, eye, stone, star, flesh
