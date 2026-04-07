# Attachment Upgrade Pipeline: T1-T2 wound conditions
> Slug: upgrade-wounds-t1t2 | Pass: editorial-revised | Mode: upgrade
> Items: 8 items | Date: 2026-04-06

---

## 1. Fractured Arm

**Niche:** Combat impairment that heals over time. A broken arm cripples striking power immediately but mends over the course of days. The fracture is worst at the moment of injury and slowly knits back together -- a pure decay wound. The agent can still fight, but every swing costs them.

```typescript
{
  id: 'reward_condition_fractured_arm',
  type: 'trait',
  name: 'Fractured Arm',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#wound', '#physical', '#iron', '#combat'],
    description: 'A broken bone limits striking power and grip strength.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.05 Iron (decays toward 0 over 24 ticks, self-removes on heal)',
    flavorText: 'The bone set crooked. Every swing ends in a wince.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.05, changePerTick: 0.002, limitValue: 0, destroyAtLimit: true },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (decay), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.05 initial, decays to 0 over ~25 ticks (approx 2 game days). Self-removes when healed.

---

## 2. Gashed Leg

**Niche:** Movement impairment. A deep leg wound slows travel and makes running impossible. The heart penalty is secondary to the real problem: getting anywhere takes longer. Heals over time but slower than surface wounds. Movement cost penalty makes this wound feel distinct from arm/rib injuries -- it changes how the agent navigates the map, not just how they fight.

```typescript
{
  id: 'reward_condition_gashed_leg',
  type: 'trait',
  name: 'Gashed Leg',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#wound', '#physical', '#heart', '#combat'],
    description: 'Deep laceration impairs movement and endurance.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.04 Heart (decays over 30 ticks), +30% movement cost while wounded',
    flavorText: 'The bandage is soaked through again. Walking is a negotiation with pain.',
    effects: [
      { type: 'decay', reach: 'heart', startValue: -0.04, changePerTick: 0.0013, limitValue: 0, destroyAtLimit: true },
      { type: 'range_modifier', movementCostMultiplier: 1.3 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (decay + range_modifier), -domainContributions, updated mechanicalSummary.
**Editorial fix:** `flesh` -> `heart` (flesh is not a valid ReachDomain; heart governs vitality/endurance).
**Total reach value:** -0.04 Heart initial, decays over ~30 ticks (~2.5 game days). +30% movement cost for the wound's entire duration.

---

## 3. Cracked Ribs

**Niche:** Pain-in-combat wound. Cracked ribs are manageable at rest but agonizing in a fight -- every impact jars the fracture. The base penalty is modest, but combat doubles the suffering. This creates a behavioral pressure: the agent can function in social or exploratory contexts but should avoid violence until healed.

```typescript
{
  id: 'reward_condition_cracked_ribs',
  type: 'trait',
  name: 'Cracked Ribs',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#wound', '#physical', '#iron', '#combat'],
    description: 'Breathing hurts. Fighting hurts more.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.02 Iron always, -0.04 Iron in combat (total -0.06 in combat)',
    flavorText: 'Each breath is shallow. Laughter is out of the question.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.02 },
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: -0.04 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive + conditional), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.02 Iron passive, -0.06 Iron in combat. No self-heal -- requires treatment or divine intervention.

---

## 4. Bruised Knuckles

**Niche:** Minor, fast-healing nuisance. Swollen hands that heal quickly -- the lightest wound in the catalog. The rapid decay (gone in one game day) makes this a tempo penalty rather than a serious threat. The stone penalty reflects impaired dexterity for craft and construction rather than combat power.

```typescript
{
  id: 'reward_condition_bruised_knuckles',
  type: 'trait',
  name: 'Bruised Knuckles',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#wound', '#physical', '#stone', '#combat'],
    description: 'Swollen hands make delicate work impossible.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.03 Stone (heals fast, gone in ~12 ticks)',
    flavorText: 'Purple and fat, the fingers refuse to close properly.',
    effects: [
      { type: 'decay', reach: 'stone', startValue: -0.03, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (decay), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.03 Stone initial, decays to 0 over ~12 ticks (1 game day). Self-removes.

---

## 5. Deep Stab Wound

**Niche:** Serious wound that worsens under stress. Internal damage that demands rest -- fighting before it heals risks tearing the wound open. The base penalties are substantial, and combat aggravates them further. The reactive effect represents the wound reopening: taking damage while wounded triggers an additional burst of iron penalty, creating a dangerous spiral for agents who refuse to rest.

```typescript
{
  id: 'reward_condition_deep_stab_wound',
  type: 'trait',
  name: 'Deep Stab Wound',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#wound', '#physical', '#iron', '#heart', '#combat'],
    description: 'Internal damage that risks infection and limits exertion.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.07 Iron, -0.05 Heart; worsens when damaged (-0.03 Iron for 6 ticks)',
    flavorText: 'The blade went deep. Something inside is not where it should be.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.07 },
      { type: 'passive', reach: 'heart', value: -0.05 },
      { type: 'reactive', trigger: 'damaged', effect: { type: 'duration', ticks: 6, reach: 'iron', value: -0.03, destroyOnExpiry: true }, cooldown: 12 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (2x passive + reactive/duration), -domainContributions, updated mechanicalSummary.
**Editorial fix:** `flesh` -> `heart` (flesh is not a valid ReachDomain; heart governs vitality/endurance).
**Total reach value:** -0.07 Iron / -0.05 Heart sustained; spikes to -0.10 Iron for 6 ticks after taking damage (12-tick cooldown prevents permanent stacking).

---

## 6. Shattered Shield Arm

**Niche:** Defensive cripple with slow recovery. The arm that blocks is broken -- the agent cannot defend effectively and is locked out of defensive iron actions entirely. The wound heals, but slowly. This is the most tactically constraining wound: it does not just reduce numbers, it removes a capability. Agents must change their approach to encounters, not just accept worse odds.

```typescript
{
  id: 'reward_condition_shattered_shield_arm',
  type: 'trait',
  name: 'Shattered Shield Arm',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#wound', '#physical', '#iron', '#combat'],
    description: 'The arm that blocks can no longer bear weight.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.08 Iron (decays over 36 ticks), blocks Iron actions in combat',
    flavorText: 'The bones ground together like millstones. The shield hangs useless.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.08, changePerTick: 0.0022, limitValue: 0, destroyAtLimit: true },
      { type: 'action_gate', mode: 'block', reach: 'iron', condition: 'in_combat' },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (decay + action_gate), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.08 Iron initial, decays to 0 over ~36 ticks (3 game days). Iron actions blocked in combat for the wound's entire duration.

---

## 7. Blinded Eye

**Niche:** Sensory devastation with behavioral consequences. Lost depth perception is not just a stat penalty -- it changes how an agent approaches the world. The severe eye penalty is paired with reduced awareness range (the agent literally cannot see as far) and a behavioral weight that makes them shy away from combat (fighting half-blind is terrifying). This wound reshapes the agent's personality for its duration.

```typescript
{
  id: 'reward_condition_blinded_eye',
  type: 'trait',
  name: 'Blinded Eye',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#wound', '#physical', '#eye', '#combat'],
    description: 'Lost depth perception impairs awareness and aim.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.08 Eye, -1 awareness range, 0.6x combat desire (fear of fighting blind)',
    flavorText: 'The world is flat now. Distance is a guess, and guesses get you killed.',
    effects: [
      { type: 'passive', reach: 'eye', value: -0.08 },
      { type: 'range_modifier', awarenessRangeBonus: -1 },
      { type: 'behavior_weight', reach: 'iron', multiplier: 0.6 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive + range_modifier + behavior_weight), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.08 Eye sustained + awareness range reduction + behavioral combat avoidance. No self-heal -- permanent until treated.

---

## 8. Bruised Ribs (Starter)

**Niche:** Tutorial wound, quick heal. The starter version of cracked ribs -- lighter and faster to resolve. This is the wound every hero might start with: a reminder that the body is fragile, but not a serious impediment. Quick decay means it clears within a game day, teaching the player that wounds heal but cost time.

```typescript
{
  id: 'starter_bruised_ribs',
  type: 'trait',
  name: 'Bruised Ribs',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#wound', '#physical', '#iron'],
    description: 'Cracked bones protest every swing.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.03 Iron (decays fast, gone in ~12 ticks), -0.02 Iron extra in combat',
    flavorText: 'Every breath is a reminder of the blow you survived.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.03, changePerTick: 0.0025, limitValue: 0, destroyAtLimit: true },
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: -0.02 },
    ],
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (decay + conditional), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.03 Iron initial (decays over ~12 ticks / 1 game day), -0.02 extra in combat while wound persists.

---

## Summary Table

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Fractured Arm | T1 | Healing combat impairment | decay | -0.05 Iron (heals ~25 ticks) | +effects[], -domainContributions, updated summary |
| 2 | Gashed Leg | T1 | Movement impairment, slow heal | decay + range_modifier | -0.04 Heart + 30% move cost | +effects[], -domainContributions, updated summary, flesh->heart |
| 3 | Cracked Ribs | T1 | Pain-in-combat, persistent | passive + conditional | -0.02/-0.06 Iron (rest/combat) | +effects[], -domainContributions, updated summary |
| 4 | Bruised Knuckles | T1 | Minor nuisance, fast heal | decay | -0.03 Stone (heals ~12 ticks) | +effects[], -domainContributions, updated summary |
| 5 | Deep Stab Wound | T2 | Serious, worsens under stress | 2x passive + reactive(duration) | -0.07 Iron / -0.05 Heart + spike | +effects[], -domainContributions, updated summary, flesh->heart |
| 6 | Shattered Shield Arm | T2 | Defensive cripple, slow heal | decay + action_gate | -0.08 Iron + iron block in combat | +effects[], -domainContributions, updated summary |
| 7 | Blinded Eye | T2 | Sensory devastation, behavioral | passive + range_modifier + behavior_weight | -0.08 Eye + awareness + avoidance | +effects[], -domainContributions, updated summary |
| 8 | Bruised Ribs (Starter) | T1 | Tutorial wound, quick heal | decay + conditional | -0.03 Iron + combat penalty | +effects[], -domainContributions, updated summary |

### Primitive Distribution

| Primitive | Items Using It |
|-----------|---------------|
| passive | Cracked Ribs, Deep Stab Wound, Blinded Eye |
| decay | Fractured Arm, Gashed Leg, Bruised Knuckles, Shattered Shield Arm, Bruised Ribs (Starter) |
| conditional | Cracked Ribs, Bruised Ribs (Starter) |
| range_modifier | Gashed Leg, Blinded Eye |
| reactive (wrapping duration) | Deep Stab Wound |
| action_gate | Shattered Shield Arm |
| behavior_weight | Blinded Eye |

Seven distinct primitives across 8 items. Decay is the most common (5 items) -- appropriate for wounds, which naturally heal. Each wound uses decay differently: Fractured Arm is pure decay, Gashed Leg pairs it with movement cost, Shattered Shield Arm pairs it with an action gate, Bruised Knuckles decays fast, and Bruised Ribs (Starter) pairs it with a combat conditional.

### Cap Compliance

All items are within the 0.15 per-item cap (EFFECT_PER_ITEM_CAP). These are debuffs (negative values), so the cap applies in reverse -- no single wound imposes more than -0.15 total reach penalty. The highest total is Deep Stab Wound at -0.12 base (-0.07 Iron + -0.05 Heart) with a temporary -0.03 spike on damage.

### Design Notes

**Wound identity spectrum:** The 8 wounds form a clear spectrum of severity and gameplay impact:
- **Trivial** (Bruised Knuckles, Bruised Ribs): gone in a day, minor inconvenience
- **Moderate** (Fractured Arm, Gashed Leg, Cracked Ribs): multi-day recovery, shapes behavior
- **Serious** (Deep Stab Wound, Shattered Shield Arm, Blinded Eye): week-long or permanent, fundamentally changes the agent

**Self-healing vs persistent:** T1 wounds all self-heal via decay (except Cracked Ribs, which is persistent but modest). T2 wounds split: Shattered Shield Arm self-heals slowly, while Deep Stab Wound and Blinded Eye are persistent until treated. This creates a natural escalation where minor wounds are inconveniences and major wounds demand divine intervention or healer access.

**Behavioral shaping:** Only Blinded Eye uses behavior_weight (combat avoidance), keeping this primitive rare and impactful. The other wounds affect capability without changing personality -- an agent with a fractured arm still wants to fight, they're just worse at it. A blinded agent genuinely fears combat.
