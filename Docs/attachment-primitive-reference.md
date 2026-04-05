# Attachment Primitive Reference Card

Quick-lookup for agents designing attachment mechanics. Find the narrative pattern that fits your concept, then configure the primitive's fields to match.

Types: `src/types/effects.ts` | Constants: `src/data/effect-constants.ts` | Caps: per-item 0.15, global 0.30

---

## Story Pattern → Primitive

### "It gets stronger the more you use it"
**stacking** — bonus accumulates each time a trigger fires, up to a cap. Optionally decays when idle.
- `reach` — which domain benefits
- `valuePerStack` — how much each stack adds
- `maxStacks` — ceiling (2-10)
- `stackOn` — what earns a stack: `combat_success`, `combat_failure`, `social_success`, `any_encounter`, `per_tick`, `on_damaged`, `on_kill`, `on_heal`
- `decayPerTick` — (optional) stacks lost per idle tick

### "It fades over time"
**decay** — starts at a high value and shrinks each tick toward a floor. Can self-destruct at the limit.
- `reach` — which domain
- `startValue` — initial strength
- `changePerTick` — how much it loses per tick (negative number)
- `limitValue` — floor it decays toward
- `destroyAtLimit` — destroy the attachment when floor is reached?

### "It only works in certain situations"
**conditional** — bonus is active only when a predicate is true, otherwise completely inert.
- `condition` — when it activates (see predicate list below)
- `reach` — which domain benefits
- `value` — how much

### "It's powerful but needs to recharge"
**cooldown** — cycles between active and dormant phases automatically.
- `activeTicks` — how long it's on
- `cooldownTicks` — how long it rests
- `reach` — which domain
- `value` — bonus while active

### "It has limited uses, then it's gone"
**consumable_charge** — N uses. Each use fires an effect and burns a charge. Optionally destroys itself when empty.
- `charges` — how many uses
- `onUse` — what fires per charge: `{ reach, value }`
- `destroyOnEmpty` — remove attachment at 0 charges?

### "It gives you something but costs you something else"
**tradeoff** — permanent tension: one reach boosted, another penalized. Always on.
- `bonus` — `{ reach, value }` — the upside
- `penalty` — `{ reach, value }` — the cost

### "It saves you when things go wrong"
**test_shaper** — after a roll resolves, nudge the outcome. Turn a near-miss into a success, reroll, or swap which reach was tested.
- `reach` — which domain this applies to
- `condition` — (optional) situational gate
- `trigger` — when it fires: `near_miss` (close failure), `failure`, `success` (upgrade to crit), `any`
- `maxMargin` — how close the roll must be to qualify
- `steps` — how many bands to shift the outcome

**prevent_loss** — absorb a loss event before it lands. Can consume self.
- `channel` — what it protects: `quintessence`, `condition`
- `amount` — how much it absorbs
- `consumeOnPrevent` — destroy after saving you?

### "It changes into something else"
**transform** — on trigger, the attachment replaces itself with a different template. Wounds become scars, dormant blades awaken, pacts come due.
- `trigger` — what causes it: `enter_combat`, `leave_combat`, `take_damage`, `rest`, `encounter_complete`, `faction_change`, `dawn_cycle`, `doom_threshold`
- `probability` — chance of transformation (0-1)
- `intoTemplate` — ID of the replacement attachment
- `narrativeTemplate` — prose shown when it happens (supports `{name}` substitution)

### "It reacts when something happens to you"
**reactive** — fires a nested effect when a trigger occurs. The nested effect can be any other primitive (duration buff, condition, etc.).
- `trigger` — what event: `attacked`, `damaged`, `healed`, `cursed`, `blessed`, `entered_hex`, `encounter_started`, `ally_damaged`
- `effect` — any other primitive to fire (typically a short `duration` buff)
- `cooldown` — (optional) minimum ticks between firings
- `duration` — (optional) how long the nested effect lasts

### "It grants a capability, not a number"
**trait_grant** — while attached, the agent has a named trait. Useful for prerequisite gating and qualitative capabilities.
- `grantedTrait` — trait identifier to grant

### "It lasts until something specific happens"
**until_event** — bonus persists indefinitely until a game event fires, then expires or self-destructs.
- `event` — what ends it: `enter_combat`, `leave_combat`, `take_damage`, `rest`, `encounter_complete`, `faction_change`, `dawn_cycle`, `doom_threshold`
- `reach` — which domain
- `value` — bonus while active
- `destroyOnEvent` — destroy attachment when event fires?

### "It changes what the agent wants to do"
**behavior_weight** — modifies action selection scores in the Maslow pipeline. Makes the agent more or less likely to choose certain encounter types or action categories. Doesn't prevent anything — just shifts preference.
- `encounterType` — (optional) which encounter types to weight: `explore`, `acquire`, `create`, `hire`, `duel`, `steal`, `trade`, `assist`, `build`, `lead`
- `reach` — (optional) which reach-category actions to weight
- `weight` — multiplier on selection score (>1 = prefer, <1 = avoid, 0 = never choose voluntarily)

Good for: personality traits (Cowardly avoids duel, Greedy prefers trade/acquire), cultural traits (Scholarly prefers explore), conditions (Wounded avoids combat).

### "It changes how others see you"
**social_modifier** — modifies how other agents interact with this agent. Affects encounter initiation, disposition, and faction standing.
- `dimension` — what it affects: `intimidation`, `trust`, `attraction`, `avoidance`, `faction_standing`
- `value` — strength of the effect (positive or negative)
- `target` — who it affects: `all`, `allies`, `enemies`, `faction:{id}`, `same_hex`
- `condition` — (optional) predicate for when it's active

Good for: reputation traits (Feared → intimidation, Beloved → trust), scars (Disfigured → avoidance), titles (Guild Master → faction_standing).

### "It prevents or unlocks specific actions"
**action_gate** — hard gate on action types. Blocks or unlocks actions regardless of capability score.
- `actionPattern` — what to gate: action ID, reach category, encounter type, or tag pattern
- `gate` — `block` (cannot attempt) or `unlock` (can attempt, was previously unavailable)
- `condition` — (optional) predicate for when the gate is active

Good for: trait restrictions (Pacifist blocks Iron duel actions), equipment prerequisites (Ritual Tome unlocks veil rituals), conditions (Blinded blocks Eye actions), destiny traits (Prophesied unlocks a specific quest action).

### "It's just a flat bonus" (use sparingly — prefer something with texture)
**passive** — always-on, unconditional. Best used as one layer in a multi-effect composition, not as the sole effect.
- `reach` — which domain
- `value` — how much

---

## On-Use Triggers (post-encounter)

Separate from effects. Added via `onUseTriggers[]` on the attachment. Fire after encounter resolution based on outcome.

- `triggerCondition` — when: `critical_failure`, `failure`, `success`, `critical_success`, `any_use`, `first_use`
- `probability` — chance of firing (0-1)
- `effect.type` — what happens: `add_condition`, `remove_condition`, `remove_possession`, `spawn_actor`, `add_possession`, `modify_relationship`
- `narrativeTemplate` — prose shown (supports `{item_name}`, `{agent_name}`)

Good for: weapons that might break on critical failure, cursed items that spread conditions, lucky charms that trigger on first use.

---

## Predicates (for conditional effects)

Simple: `in_combat`, `in_social`, `in_exploration`, `in_mystical`, `at_home_territory`, `in_enemy_territory`, `in_wilderness`, `health_low`, `health_high`, `alone`, `outnumbered`, `near_water`

Parameterized: `biome:{type}`, `has_trait:{tag}`, `lacks_trait:{tag}`, `reach_above:{reach}:{value}`, `faction_rank:{rank}`

---

## Composition Guidelines

Combine primitives to create texture. Complexity scales with tier:

- **T1** (common): 1 effect, total value 0.03-0.05. A conditional or a decay — one interesting thing.
- **T2** (uncommon): 1-2 effects, total value 0.05-0.08. A conditional + stacking, or a cooldown alone.
- **T3** (rare): 2-3 effects, total value 0.08-0.12. Tradeoffs, test shapers, reactive triggers.
- **T4** (legendary): 3-4 effects, total value 0.10-0.15. Complex interplay — items with personality.

Per-item cap: 0.15 total across all reaches. No single effect should exceed this.

---

## Quick Reference

Nine reaches: iron, gold, shadow, veil, heart, eye, stone, star, flesh
Loss conditions: arms→breakable, provisions→consumable, relics→permanent/cursed, tools→breakable, vestments→breakable/stealable, mounts→permanent, tomes→stealable
Tags: always `#<primary_reach>`, `#<subcategory>`, optionally `#<sphere>`
