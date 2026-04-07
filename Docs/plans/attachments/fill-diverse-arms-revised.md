# Attachment Pipeline: Non-Iron Arms Across Underserved Reaches
> Category: arms | Slug: fill-diverse-arms | Pass: revised
> Status: **REVISED** (editorial pass applied)

## Batch Summary

| Field | Value |
|-------|-------|
| Problem | 14 of 16 existing arms are Iron-primary. Zero arms for Gold, Veil, Heart, Eye, or Stone as primary reach. |
| Items | 10 new arms (all new IDs) |
| Tier spread | T1 x4, T2 x6 |
| Reach spread | Shadow x2, Veil x1, Heart x2, Eye x2, Stone x2, Gold x1 |
| Target primitives | conditional, stacking, reactive, tradeoff, behavior_weight, range_modifier, tag_immunity, social_modifier, consumable_charge |

---

## Editorial Changes Applied

| # | Item | Change | Reason |
|---|------|--------|--------|
| 3 | Hedge-Witch's Wand | Renamed to "Hazel Switch" | "Wand" is generic fantasy; hazel material already prominent in flavor text |
| 4 | Captain's War Horn | Renamed to "Cracked Brass Horn" | "Captain's War Horn" is generic military; flavor text describes the dented brass and cracked bell |
| 5 | Iron Marshal's Banner | Renamed to "Banner of the Lost Company"; dropped `#banner` tag | "Iron" collides with reach name; `#banner` tag used nowhere else in catalog |
| 6 | Cartographer's Marking Bolt | Renamed to "Spotter's Marking Bolt" | "Cartographer's" collides with existing "Cartographer's Survey" in catalog |
| 7 | Lens-Sighted Arbalest | Minor mechanical summary revision | Clarified test_shaper scope to match effects data literally |
| -- | Batch Summary | Corrected tier count | Was "T1 x4, T2 x5, T3 x1"; no T3 items exist in batch |

---

## Design Rationale

These arms are not just Iron weapons with different paint. Each reach interprets "arms" through its own domain:

- **Shadow** arms are tools of stealth -- concealed blades, garrotes, poisoned implements. They reward ambush, isolation, and patience.
- **Veil** arms are ritual implements repurposed for combat -- wands, spectral projections, channeling staves. They bridge the mystical and the martial.
- **Heart** arms are instruments of command -- war horns, banners, rally standards. They project social force as physical authority.
- **Eye** arms are precision instruments -- scoped crossbows, marking darts, calibrated tools. They reward observation and careful positioning.
- **Stone** arms are geological weapons -- obsidian blades, petrified clubs, earth-forged hammers. They are heavy, enduring, and connected to terrain.
- **Gold** arms are instruments of economic power -- weighted scales that double as flails, ornate blades that signal wealth and status.

Each item uses at least one non-passive primitive to create mechanical texture beyond flat reach bonuses.

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

**Niche:** Lone operator's weapon. Rewards isolation over formation fighting -- the opposite design philosophy from Iron arms like the Bronze Spear. The conditional triggers when the agent has no allies nearby, rewarding skulking and solo infiltration.
**Total reach value:** 0.05 max (0.03 passive + 0.02 conditional)
**Primitives used:** passive, conditional

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

**Niche:** Assassin's escalation weapon. The tradeoff makes the wielder socially repulsive -- garrotes are not noble instruments. The stacking rewards sustained violence, growing deadlier with each successful strike before the advantage fades. T2 complexity with three effects.
**Total reach value:** 0.11 max Shadow / -0.02 Heart (0.05 passive + 0.03 tradeoff + 0.03 at full stacks)
**Primitives used:** passive, tradeoff, stacking

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

**Niche:** Defensive ritual implement. Strong in mystical contexts (conditional), and when threatened it channels protective energy (reactive). Not a melee weapon -- it projects force through the Veil. The reactive represents an instinctive ward when cornered.
**Total reach value:** 0.10 max (0.04 passive + 0.03 conditional + 0.03 reactive burst)
**Primitives used:** passive, conditional, reactive
**Editorial change:** Renamed from "Hedge-Witch's Wand" -- "Wand" is generic fantasy; "switch" (a cut rod used in folk practice) is more specific and the hazel material was already the strongest detail in the flavor text.

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

**Niche:** Leadership instrument. Not a weapon that deals damage -- it projects authority. The social_modifier makes allies more cooperative, representing the rallying effect of a horn call. Tagged as arms because it is carried into combat and wielded as a tool of command.
**Total reach value:** 0.05 max Heart + social utility (0.03 passive + 0.02 conditional + cooperation bias)
**Primitives used:** passive, conditional, social_modifier
**Editorial change:** Renamed from "Captain's War Horn" -- "Captain" is a generic rank; the flavor text's "cracked" and "brass" are more specific and earned by the physical description.

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

**Niche:** Field commander's standard. Bridges Heart and Iron -- the banner inspires troops (social_modifier) while its bearer naturally gravitates toward battle (behavior_weight on iron encounters). The conditional Iron bonus in combat reflects a banner-carrier's ferocity when the standard is raised. Stealable because capturing an enemy banner is a narrative beat.
**Total reach value:** 0.08 max (0.05 Heart passive + 0.03 Iron conditional) + social utility + behavior shaping
**Primitives used:** passive, conditional, social_modifier, behavior_weight
**Editorial change:** Renamed from "Iron Marshal's Banner" -- "Iron" collided with the reach name; "of the Lost Company" grounds it in the forgotten-army story told by the flavor text. Dropped `#banner` tag (not used elsewhere in catalog).

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
**Primitives used:** passive, range_modifier, consumable_charge
**Editorial change:** Renamed from "Cartographer's Marking Bolt" -- "Cartographer's" collided with existing "Cartographer's Survey". "Spotter" is a military reconnaissance term that fits the marking/scouting niche. Flavor text updated to match.

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

**Niche:** Precision instrument masquerading as a weapon. Eye-primary with Iron secondary -- the damage comes from accuracy, not brute force. The test_shaper on Eye rescues near-miss observation rolls, representing the lens catching details the naked eye would miss. The range_modifier extends how far the wielder can survey.
**Total reach value:** 0.07 (0.05 Eye + 0.02 Iron) + test_shaper utility + awareness range
**Primitives used:** passive (x2), test_shaper, range_modifier
**Editorial change:** Mechanical summary revised for precision -- original said "rescues near-miss Eye tests"; revised to specify "on near-miss Eye tests (within 2 margin): +1 step" to match the effects data literally.

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

**Niche:** Geological brute-force weapon. The tradeoff (-Eye) represents the tunnel vision that comes with swinging something this heavy -- you hit harder but see less. The tag_immunity to bruise reflects the wielder's conditioning to impact. Mirrors the Rusted Mace (Iron tradeoff) in a different domain.
**Total reach value:** 0.06 Stone / -0.01 Eye + tag immunity utility
**Primitives used:** passive, tradeoff, tag_immunity

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

**Niche:** Ancient heavy weapon with a movement penalty. Stone-primary with Iron secondary. The reactive represents the glaive's natural hardening under stress -- the petrified wood resonates when struck. The movement penalty (20% slower) makes this a commitment weapon -- you carry it knowing you will be slower, betting on the defensive strength being worth the cost.
**Total reach value:** 0.11 max (0.05 Stone + 0.03 Iron + 0.03 reactive burst) - movement penalty
**Primitives used:** passive (x2), reactive, range_modifier (penalty)

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

**Niche:** Economic weapon. Gold-primary, actively hurts Iron -- this is not a fighting instrument, it is an instrument of economic pressure. The negative social_modifier toward enemies represents the chilling effect of a tax assessor's presence. Stealable because it represents institutional power that can be seized. The conditional in social encounters reflects the scales' true power: negotiation leverage.
**Total reach value:** 0.08 Gold / -0.02 Iron + social manipulation (0.05 passive + 0.03 conditional - 0.02 Iron penalty)
**Primitives used:** passive (x2, including negative), conditional, social_modifier

---

## Summary Table

| # | Name | Reach | Tier | Primitives | Max Reach Value | Loss | Effects |
|---|------|-------|------|-----------|----------------|------|---------|
| 1 | Grave-Robber's Stiletto | Shadow | T1 | passive, conditional | 0.05 Shadow | stealable | 2 |
| 2 | Strangler's Cord | Shadow | T2 | passive, tradeoff, stacking | 0.11 Shadow / -0.02 Heart | breakable | 3 |
| 3 | Hazel Switch | Veil | T2 | passive, conditional, reactive | 0.10 Veil | breakable | 3 |
| 4 | Cracked Brass Horn | Heart | T1 | passive, conditional, social_modifier | 0.05 Heart + coop | breakable | 3 |
| 5 | Banner of the Lost Company | Heart+Iron | T2 | passive, conditional, social_modifier, behavior_weight | 0.08 (Heart+Iron) + utility | stealable | 4 |
| 6 | Spotter's Marking Bolt | Eye | T1 | passive, range_modifier, consumable_charge | 0.03 Eye + awareness + burst | consumable | 3 |
| 7 | Lens-Sighted Arbalest | Eye+Iron | T2 | passive x2, test_shaper, range_modifier | 0.07 (Eye+Iron) + utility | breakable | 4 |
| 8 | Basalt Maul | Stone | T1 | passive, tradeoff, tag_immunity | 0.06 Stone / -0.01 Eye | breakable | 3 |
| 9 | Petrified Ironwood Glaive | Stone+Iron | T2 | passive x2, reactive, range_modifier | 0.11 (Stone+Iron) - move penalty | breakable | 4 |
| 10 | Assessor's Weighted Scales | Gold | T2 | passive x2, conditional, social_modifier | 0.08 Gold / -0.02 Iron | stealable | 4 |

### Reach Coverage

| Reach | Count | Tiers | Notes |
|-------|-------|-------|-------|
| Shadow | 2 | T1, T2 | Solo/ambush niche; stacking assassin escalation |
| Veil | 1 | T2 | Defensive ritual implement; mystical-conditional |
| Heart | 2 | T1, T2 | Command instruments; social_modifier + behavior_weight |
| Eye | 2 | T1, T2 | Precision/scouting; range_modifier + test_shaper |
| Stone | 2 | T1, T2 | Heavy geological weapons; tradeoff + reactive |
| Gold | 1 | T2 | Economic weapon; negative Iron + social intimidation |

### Primitive Coverage

| Primitive | Count | Items |
|-----------|-------|-------|
| passive | 10 | All items |
| conditional | 5 | #1, #3, #4, #5, #10 |
| tradeoff | 2 | #2, #8 |
| stacking | 1 | #2 |
| reactive | 2 | #3, #9 |
| social_modifier | 3 | #4, #5, #10 |
| behavior_weight | 1 | #5 |
| range_modifier | 3 | #6, #7, #9 |
| consumable_charge | 1 | #6 |
| test_shaper | 1 | #7 |
| tag_immunity | 1 | #8 |

### Balance Check

| Tier | Items | Avg Max Value | Cap (0.15) | Status |
|------|-------|---------------|------------|--------|
| T1 | 4 | ~0.05 | All under | PASS |
| T2 | 6 | ~0.09 | All under | PASS |
| Max effects | 4 (#5, #7, #9, #10) | -- | Cap = 6 | PASS |
