# Attachment Pipeline: Non-Iron Arms Across Underserved Reaches
> Category: arms | Slug: fill-diverse-arms | Pass: final
> Status: **READY WITH CAVEATS**

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | 10 items drafted (T1 ×4, T2 ×6) across Shadow, Veil, Heart, Eye, Stone, Gold |
| Editorial | Approved with refinements | 5 items renamed; one batch summary corrected; one mechanical summary clarified |
| Systems | READY WITH CAVEATS | All 10 items type-valid; 7 items exceed tier effect-count rule (non-blocking); 0 type errors; 0 balance cap violations; 0 duplicate IDs |

## Caveats (Non-Blocking)

Seven items exceed the design doc's tier effect-count rule (T1: 1–2, T2: 2–3). The extra effects in every case are zero-reach utility modifiers (social_modifier, range_modifier, behavior_weight, tag_immunity, consumable_charge). The runtime cap (MAX_EFFECTS_PER_ATTACHMENT = 6) is not violated by any item. Catalog precedent exists: `reward_tools_instruments_gate_seal_case` (T1) has 3 effects.

**Implementors may accept all 10 items as drafted.** Optional reductions are noted per item below.

## Implementation Notes

These are **new entries** — all 10 IDs are absent from `reward-attachment-catalog.ts`. Append to the existing arms sections, grouped by tier.

**Target file:** `src/data/reward-attachment-catalog.ts`
**Target array:** `REWARD_POSSESSIONS`
**Suggested placement:** After the existing T2 arms block (`reward_arms_thornwood_staff`), add the T2 new arms; after the existing T1 arms block, add the T1 new arms.

---

## Approved Attachments

### 1. Grave-Robber's Stiletto

```typescript
{
  id: 'reward_arms_grave_robbers_stiletto',
  type: 'artifact',
  name: "Grave-Robber's Stiletto",
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#shadow', '#weapon', '#melee', '#stealth', '#assassination'],
    mechanicalSummary: '+0.03 Shadow, +0.02 Shadow when alone (ambush bonus)',
    lossCondition: 'stealable',
    flavorText: 'Thin as a finger bone and just as cold. The grip is wrapped in linen from a burial shroud.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.03 },
      { type: 'conditional', condition: 'alone', reach: 'shadow', value: 0.02 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Lone operator's weapon. Rewards isolation over formation fighting — the opposite design philosophy from Iron arms like the Bronze Spear. The conditional triggers when the agent has no allies nearby, rewarding skulking and solo infiltration.
**Total reach value:** 0.05 max (0.03 passive + 0.02 conditional)
**Systems:** PASS — 2 effects, T1 compliant.

---

### 2. Strangler's Cord

```typescript
{
  id: 'reward_arms_stranglers_cord',
  type: 'artifact',
  name: "Strangler's Cord",
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#shadow', '#weapon', '#melee', '#stealth', '#assassination'],
    mechanicalSummary: '+0.05 Shadow, +0.03 Shadow / -0.02 Heart (silent killer), +0.01 Shadow per combat success (max 3 stacks, decays 1/tick)',
    lossCondition: 'breakable',
    flavorText: 'Braided from horsehair and treated with tallow. It leaves no mark on the throat if you know the twist.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'tradeoff', bonus: { reach: 'shadow', value: 0.03 }, penalty: { reach: 'heart', value: 0.02 } },
      { type: 'stacking', reach: 'shadow', valuePerStack: 0.01, maxStacks: 3, stackOn: 'combat_success', decayPerTick: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Assassin's escalation weapon. The tradeoff makes the wielder socially repulsive — garrotes are not noble instruments. The stacking rewards sustained violence, growing deadlier with each successful strike before the advantage fades.
**Total reach value:** 0.11 max Shadow / -0.02 Heart (0.05 passive + 0.03 tradeoff + 0.03 at full stacks)
**Systems:** PASS — 3 effects, T2 compliant.

---

### 3. Hazel Switch

```typescript
{
  id: 'reward_arms_hazel_switch',
  type: 'artifact',
  name: 'Hazel Switch',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#veil', '#weapon', '#implement', '#mystical'],
    mechanicalSummary: '+0.04 Veil, +0.03 Veil in mystical encounters, when attacked: +0.03 Veil for 4 ticks (10-tick cooldown)',
    lossCondition: 'breakable',
    flavorText: 'Hazel wood stripped white by moonlight. Someone carved a name into the base and then scraped it out.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.04 },
      { type: 'conditional', condition: 'in_mystical', reach: 'veil', value: 0.03 },
      { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 4, reach: 'veil', value: 0.03, destroyOnExpiry: true }, cooldown: 10 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Defensive ritual implement. Strong in mystical contexts (conditional), and when threatened it channels protective energy (reactive). Not a melee weapon — it projects force through the Veil. The reactive represents an instinctive ward when cornered.
**Total reach value:** 0.10 max (0.04 passive + 0.03 conditional + 0.03 reactive burst)
**Systems:** PASS — 3 effects, T2 compliant.

---

### 4. Cracked Brass Horn

```typescript
{
  id: 'reward_arms_cracked_brass_horn',
  type: 'artifact',
  name: 'Cracked Brass Horn',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#heart', '#weapon', '#instrument', '#command', '#social'],
    mechanicalSummary: '+0.03 Heart, +0.02 Heart in social encounters, +0.3 cooperation with allies (rallying call)',
    lossCondition: 'breakable',
    flavorText: 'Dented brass with a cracked bell. It still carries across a valley when the wind is right.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'conditional', condition: 'in_social', reach: 'heart', value: 0.02 },
      { type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.3 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Leadership instrument. Not a weapon that deals damage — it projects authority. The social_modifier makes allies more cooperative, representing the rallying effect of a horn call.
**Total reach value:** 0.05 max Heart + social utility (0.03 passive + 0.02 conditional)
**Systems:** PASS WITH CAVEAT — 3 effects on T1 (design rule: 1–2). `social_modifier` contributes no reach value. Optional reduction: drop the `conditional` effect to bring to 2 effects (0.03 passive + social_modifier).

---

### 5. Banner of the Lost Company

```typescript
{
  id: 'reward_arms_banner_of_the_lost_company',
  type: 'artifact',
  name: 'Banner of the Lost Company',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#heart', '#iron', '#weapon', '#command', '#combat'],
    mechanicalSummary: '+0.05 Heart, +0.03 Iron in combat, +0.5 cooperation with same-faction allies, drives wielder toward combat encounters (1.3x behavior weight)',
    lossCondition: 'stealable',
    flavorText: 'The pole is splintered and re-bound with wire. The cloth shows a sigil no living heraldist recognizes.',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.05 },
      { type: 'conditional', condition: 'in_combat', reach: 'iron', value: 0.03 },
      { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.5 },
      { type: 'behavior_weight', reach: 'iron', multiplier: 1.3 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Field commander's standard. Bridges Heart and Iron — the banner inspires troops (social_modifier) while its bearer naturally gravitates toward battle (behavior_weight on iron encounters). The conditional Iron bonus in combat reflects a banner-carrier's ferocity when the standard is raised.
**Total reach value:** 0.08 max (0.05 Heart passive + 0.03 Iron conditional) + social utility + behavior shaping
**Systems:** PASS WITH CAVEAT — 4 effects on T2 (design rule: 2–3). `social_modifier` and `behavior_weight` contribute no reach value. Optional reduction: drop `behavior_weight` (Heart-primary bearer carrying a battle standard already implies combat gravitation).

---

### 6. Spotter's Marking Bolt

```typescript
{
  id: 'reward_arms_spotters_marking_bolt',
  type: 'artifact',
  name: "Spotter's Marking Bolt",
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#eye', '#weapon', '#ranged', '#precision', '#reconnaissance'],
    mechanicalSummary: '+0.03 Eye, +1 awareness range (surveyor sight), 4 charges of +0.03 Eye burst (mark target)',
    lossCondition: 'consumable',
    flavorText: 'Crossbow quarrels with red-dyed fletching. The spotter who carried them marked enemy positions, not map edges.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.03 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
      { type: 'consumable_charge', charges: 4, onUse: { reach: 'eye', value: 0.03 }, destroyOnEmpty: true },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Scout's expendable ammunition. The range_modifier extends awareness (seeing further), the consumable charges represent limited marking shots that illuminate targets. Self-destructs when the bolts run out. A T1 expendable that trades longevity for scouting utility.
**Total reach value:** 0.03 passive + awareness utility + 0.03 burst (4 uses)
**Systems:** PASS WITH CAVEAT — 3 effects on T1 (design rule: 1–2). `range_modifier` contributes no reach value. `lossCondition: 'consumable'` is consistent with `destroyOnEmpty: true`. Optional reduction: drop `range_modifier` to bring to 2 effects (passive + consumable_charge).

---

### 7. Lens-Sighted Arbalest

```typescript
{
  id: 'reward_arms_lens_sighted_arbalest',
  type: 'artifact',
  name: 'Lens-Sighted Arbalest',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#eye', '#iron', '#weapon', '#ranged', '#precision', '#combat'],
    mechanicalSummary: '+0.05 Eye, +0.02 Iron, on near-miss Eye tests (within 2 margin): +1 step, +1 awareness range',
    lossCondition: 'breakable',
    flavorText: 'The lens is ground from quartz and sits in a brass cradle. The crossbow itself is unremarkable. The lens is everything.',
    effects: [
      { type: 'passive', reach: 'eye', value: 0.05 },
      { type: 'passive', reach: 'iron', value: 0.02 },
      { type: 'test_shaper', reach: 'eye', trigger: 'near_miss', steps: 1, maxMargin: 2 },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Precision instrument masquerading as a weapon. Eye-primary with Iron secondary — the damage comes from accuracy, not brute force. The test_shaper on Eye rescues near-miss observation rolls, representing the lens catching details the naked eye would miss. The range_modifier extends how far the wielder can survey.
**Total reach value:** 0.07 (0.05 Eye + 0.02 Iron) + test_shaper utility + awareness range
**Systems:** PASS WITH CAVEAT — 4 effects on T2 (design rule: 2–3). Both utility effects (`test_shaper`, `range_modifier`) carry no reach value. Structurally equivalent to the Crossbow of the Watch pattern (2 passives + 1 utility), plus one additional utility. Optional reduction: drop `range_modifier` (the test_shaper already rewards careful aim; range_modifier is the weaker design statement for this item).

---

### 8. Basalt Maul

```typescript
{
  id: 'reward_arms_basalt_maul',
  type: 'artifact',
  name: 'Basalt Maul',
  properties: {
    subcategory: 'arms',
    tier: 1,
    tags: ['#stone', '#weapon', '#melee', '#heavy', '#combat'],
    mechanicalSummary: '+0.04 Stone, +0.02 Stone / -0.01 Eye (heavy and unwieldy), blocks bruise conditions',
    lossCondition: 'breakable',
    flavorText: 'A column of black stone lashed to a shaft of green oak. Whoever swings it does not swing it twice in quick succession.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.04 },
      { type: 'tradeoff', bonus: { reach: 'stone', value: 0.02 }, penalty: { reach: 'eye', value: 0.01 } },
      { type: 'tag_immunity', tags: ['bruise'] },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Geological brute-force weapon. The tradeoff (-Eye) represents the tunnel vision that comes with swinging something this heavy — you hit harder but see less. The tag_immunity to bruise reflects the wielder's conditioning to impact. Mirrors the Rusted Mace (Iron tradeoff) in a different domain.
**Total reach value:** 0.06 Stone / -0.01 Eye + tag immunity utility
**Systems:** PASS WITH CAVEAT — 3 effects on T1 (design rule: 1–2). `tag_immunity` contributes no reach value. Optional reduction: drop `tag_immunity` to bring to 2 effects (the tradeoff already tells the maul's design story).

---

### 9. Petrified Ironwood Glaive

```typescript
{
  id: 'reward_arms_petrified_ironwood_glaive',
  type: 'artifact',
  name: 'Petrified Ironwood Glaive',
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#stone', '#iron', '#weapon', '#melee', '#heavy', '#combat', '#ancient'],
    mechanicalSummary: '+0.05 Stone, +0.03 Iron, when attacked: +0.03 Stone for 6 ticks (12-tick cooldown), 20% slower movement (weight penalty)',
    lossCondition: 'breakable',
    flavorText: 'The wood turned to stone a thousand years ago. The blade edge is a geological accident. It cuts like a bad intention.',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.05 },
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'reactive', trigger: 'attacked', effect: { type: 'duration', ticks: 6, reach: 'stone', value: 0.03, destroyOnExpiry: true }, cooldown: 12 },
      { type: 'range_modifier', movementCostMultiplier: 1.2 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Ancient heavy weapon with a movement penalty. Stone-primary with Iron secondary. The reactive represents the glaive's natural hardening under stress — the petrified wood resonates when struck. The movement penalty (20% slower) makes this a commitment weapon — you carry it knowing you will be slower, betting on the defensive strength being worth the cost.
**Total reach value:** 0.11 max (0.05 Stone + 0.03 Iron + 0.03 reactive burst) - movement penalty
**Systems:** PASS WITH CAVEAT — 4 effects on T2 (design rule: 2–3). `range_modifier` with `movementCostMultiplier: 1.2` is a meaningful mechanical penalty, not mere flavor. Recommend retaining all 4 effects — the penalty is load-bearing to the item's design identity.

---

### 10. Assessor's Weighted Scales

```typescript
{
  id: 'reward_arms_assessors_weighted_scales',
  type: 'artifact',
  name: "Assessor's Weighted Scales",
  properties: {
    subcategory: 'arms',
    tier: 2,
    tags: ['#gold', '#weapon', '#melee', '#commercial', '#social'],
    mechanicalSummary: '+0.05 Gold, +0.03 Gold in social encounters, -0.02 Iron (not a fighting weapon), -0.2 cooperation with enemies (economic intimidation)',
    lossCondition: 'stealable',
    flavorText: 'Brass pans on a chain, with lead weights sewn into the handle. The Assessors Guild calls it a tool. The people they assess call it a weapon.',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.05 },
      { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.03 },
      { type: 'passive', reach: 'iron', value: -0.02 },
      { type: 'social_modifier', targetFilter: 'enemy', cooperationBias: -0.2 },
    ],
  } as PossessionNodeProperties,
}
```

**Niche:** Economic weapon. Gold-primary, actively hurts Iron — this is not a fighting instrument, it is an instrument of economic pressure. The negative social_modifier toward enemies represents the chilling effect of a tax assessor's presence. Stealable because it represents institutional power that can be seized. The conditional in social encounters reflects the scales' true power: negotiation leverage.
**Total reach value:** 0.08 Gold / -0.02 Iron (0.05 passive + 0.03 conditional - 0.02 Iron penalty)
**Systems:** PASS WITH CAVEAT — 4 effects on T2 (design rule: 2–3). `social_modifier` contributes no reach value. Negative `passive` (Iron -0.02) is valid and has catalog precedent (Hollowfang: `passive heart -0.05`). Optional reduction: drop `social_modifier` to bring to 3 effects (the Iron penalty already implies the item's non-combatant identity).

---

## Summary Table

| # | Name | Reach | Tier | Effects | Max Reach Value | Loss | Systems |
|---|------|-------|------|---------|----------------|------|---------|
| 1 | Grave-Robber's Stiletto | Shadow | T1 | 2 | 0.05 Shadow | stealable | PASS |
| 2 | Strangler's Cord | Shadow | T2 | 3 | 0.11 Shadow / -0.02 Heart | breakable | PASS |
| 3 | Hazel Switch | Veil | T2 | 3 | 0.10 Veil | breakable | PASS |
| 4 | Cracked Brass Horn | Heart | T1 | 3 | 0.05 Heart | breakable | PASS WITH CAVEAT |
| 5 | Banner of the Lost Company | Heart+Iron | T2 | 4 | 0.08 (Heart+Iron) | stealable | PASS WITH CAVEAT |
| 6 | Spotter's Marking Bolt | Eye | T1 | 3 | 0.03 Eye + burst | consumable | PASS WITH CAVEAT |
| 7 | Lens-Sighted Arbalest | Eye+Iron | T2 | 4 | 0.07 (Eye+Iron) | breakable | PASS WITH CAVEAT |
| 8 | Basalt Maul | Stone | T1 | 3 | 0.06 Stone / -0.01 Eye | breakable | PASS WITH CAVEAT |
| 9 | Petrified Ironwood Glaive | Stone+Iron | T2 | 4 | 0.11 (Stone+Iron) | breakable | PASS WITH CAVEAT |
| 10 | Assessor's Weighted Scales | Gold | T2 | 4 | 0.08 Gold / -0.02 Iron | stealable | PASS WITH CAVEAT |

## Overall Pipeline Verdict

**READY WITH CAVEATS**

All 10 items are type-valid and balance-compliant. No blockers. The only recurring finding is that 7 of 10 items exceed the design doc's tier effect-count rule (T1: 1–2, T2: 2–3) by including zero-reach utility effects as additional effect slots. This is a design consistency finding, not an engine error — the runtime cap (MAX_EFFECTS_PER_ATTACHMENT = 6) is never approached. Items #1, #2, and #3 are clean passes. Items #4–#10 carry the caveat; optional reductions are documented per item for implementors who want strict tier compliance.
