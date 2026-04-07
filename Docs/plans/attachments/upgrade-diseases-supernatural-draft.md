# Attachment Upgrade Pipeline: Disease, Supernatural, Remaining Curse & Social Conditions
> Slug: upgrade-diseases-supernatural | Pass: draft | Mode: upgrade
> Items: 11 items | Date: 2026-04-06

**Reach mapping note:** The original `domainContributions` on several items use `flesh` as a reach key. `flesh` is not a valid `ReachDomain` (valid: iron, gold, shadow, veil, heart, eye, stone, star). For this draft, `flesh` penalties on disease/wound items are mapped to `iron` (physical endurance degradation) or `heart` (vitality/social stigma) depending on the condition's primary expression. Tags are preserved unchanged per upgrade rules.

---

## 1. Road Fever

**Niche:** Travel debility that worsens with movement. Road fever is the common ailment of hard roads and bad water -- the traveler's curse. It starts mild but doesn't rest easy; every hex crossed while feverish jars the body and deepens the sickness. Agents who keep moving get sicker. Agents who stop and rest (leaving combat/exploration) let the fever break. A movement cost penalty ensures the fever slows the journey even before it cripples the traveler.

```typescript
{
  id: 'reward_condition_road_fever',
  type: 'trait',
  name: 'Road Fever',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#disease', '#flesh', '#wilderness'],
    description: 'A common illness from exposure and bad water.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.04 Iron, +20% movement cost, gains -0.01 Iron per encounter (max -0.03 extra)',
    flavorText: 'The shivers come and go. Sweat and chill, sweat and chill.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.04 },
      { type: 'range_modifier', movementCostMultiplier: 1.2 },
      { type: 'stacking', reach: 'iron', valuePerStack: -0.01, maxStacks: 3, stackOn: 'any_encounter', decayPerTick: 0.002 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive + range_modifier + stacking), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.04 Iron passive + up to -0.03 Iron stacking = -0.07 Iron worst case. +20% movement cost. Stacking decays slowly at 0.002/tick, so rest periods allow partial recovery. Within 0.15 cap.

---

## 2. Gut Rot

**Niche:** Eating/provisions penalty with slow internal decay. Gut rot is the body rejecting everything -- food, water, rest. The stomach rebels and the weakness deepens day by day. Unlike road fever which worsens with activity, gut rot worsens with time itself (per-tick decay getting worse). The gold penalty reflects inability to engage in trade and provisioning while doubled over with cramps.

```typescript
{
  id: 'reward_condition_gut_rot',
  type: 'trait',
  name: 'Gut Rot',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#disease', '#flesh', '#wilderness'],
    description: 'Contaminated food or water. Debilitating cramps and weakness.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.03 Iron (worsens by -0.001/tick to max -0.07 Iron), -0.02 Gold',
    flavorText: 'The stomach rebels against everything, including emptiness.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.03, changePerTick: -0.001, limitValue: -0.07, destroyAtLimit: false },
      { type: 'passive', reach: 'gold', value: -0.02 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (decay + passive), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.03 Iron starting, worsening to -0.07 Iron over ~40 ticks (3+ game days). -0.02 Gold constant. Max total -0.09. Within 0.15 cap. The negative decay direction (getting worse, not better) makes this a ticking clock -- the agent needs healing before it bottoms out.

---

## 3. Greyscale

**Niche:** Spreading numbness with social stigma. The skin hardens, cracks, turns grey. It's visible, it's frightening, and it makes people recoil. The stone penalty reflects the paradox: the body calcifies but becomes less capable, not more. The social modifier captures the contagion fear -- others avoid the afflicted. If untreated, greyscale transforms into something worse.

```typescript
{
  id: 'reward_condition_greyscale',
  type: 'trait',
  name: 'Greyscale',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#disease', '#flesh', '#stone'],
    description: 'Skin hardens and cracks. Mobility and appearance degrade.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.08 Iron, -0.04 Heart, others avoid cooperation (contagion fear), transforms into Spine Wound on doom threshold (15% chance)',
    flavorText: 'The skin turns grey and stiff at the edges. People step back when they see it.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.08 },
      { type: 'passive', reach: 'heart', value: -0.04 },
      { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
      { type: 'transform', trigger: 'doom_threshold', probability: 0.15, intoTemplate: 'reward_condition_spine_wound', narrativeTemplate: 'The greyscale has reached the spine. The numbness is total now.' },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive + passive + social_modifier + transform), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.08 Iron + -0.04 Heart = -0.12 total reach. Social modifier is non-reach. Transform is probabilistic conditional. Within 0.15 cap.

---

## 4. The Wasting

**Niche:** Serious progressive supernatural disease. The Wasting devours vitality but sharpens the boundary between life and death -- the veil thins as the body weakens. This is a tradeoff condition: the agent loses physical capability but gains veil perception. The decay worsens over time (negative direction), and the until_event effect means the veil bonus persists until the agent rests -- but rest also means confronting what the disease has shown them. If untreated long enough, it risks transforming into something permanent.

```typescript
{
  id: 'reward_condition_the_wasting',
  type: 'trait',
  name: 'The Wasting',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#disease', '#flesh', '#veil'],
    description: 'A supernatural consumption that devours vitality and thins the boundary to death.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.08 Iron (worsens by -0.001/tick to max -0.14), +0.05 Veil until rest, personality drifts toward fatalism',
    flavorText: 'The body withers but the eyes brighten. Something feeds on the difference.',
    effects: [
      { type: 'decay', reach: 'iron', startValue: -0.08, changePerTick: -0.001, limitValue: -0.14, destroyAtLimit: false },
      { type: 'until_event', event: 'rest', reach: 'veil', value: 0.05, destroyOnEvent: false },
      { type: 'axiological_drift', axis: 'hope_despair', ratePerTick: 0.003, limitValue: 0.4 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (decay + until_event + axiological_drift), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.08 Iron starting, worsening to -0.14 Iron. +0.05 Veil (until rest). Net worst case -0.14 Iron + 0.05 Veil = 0.14 absolute reach magnitude on the negative side, plus 0.05 positive veil. Within 0.15 cap per reach. Axiological drift is a meta-effect (personality change, not reach modification).

---

## 5. Spine Wound

**Niche:** Catastrophic physical injury. A T3 wound -- the most severe physical debility in the catalog. Movement becomes agony, combat becomes near-impossible. The tradeoff structure captures the brutal reality: the spine wound destroys iron capability but the constant pain and immobility force a kind of grim endurance that marginally improves stone (the body adapts to stillness, learns to work within constraints). The action gate blocks iron actions in combat -- the agent physically cannot fight. The range modifier makes every journey a crawl.

```typescript
{
  id: 'reward_condition_spine_wound',
  type: 'trait',
  name: 'Spine Wound',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#wound', '#physical', '#iron', '#flesh', '#combat'],
    description: 'Catastrophic injury to the back. Movement and combat severely impaired.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.12 Iron, -0.05 Heart, blocks Iron actions in combat, +50% movement cost, avoids combat encounters',
    flavorText: 'The body remembers what the spine cannot. Every step is borrowed time.',
    effects: [
      { type: 'passive', reach: 'iron', value: -0.12 },
      { type: 'passive', reach: 'heart', value: -0.05 },
      { type: 'action_gate', mode: 'block', reach: 'iron', condition: 'in_combat' },
      { type: 'range_modifier', movementCostMultiplier: 1.5 },
      { type: 'behavior_weight', reach: 'iron', multiplier: 0.2 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive + passive + action_gate + range_modifier + behavior_weight), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.12 Iron + -0.05 Heart = -0.17 total. Note: this exceeds the 0.15 per-item cap slightly. The original domainContributions were { iron: -0.12, flesh: -0.08 } = -0.20 total, so the upgrade actually reduces total penalty. The -0.05 Heart replaces the -0.08 flesh mapping, reflecting social/emotional impact of disability rather than pure physical degradation. **Flag for review:** consider reducing Heart to -0.03 to hit exactly -0.15, or accept the slight overshoot as appropriate for a T3 catastrophic wound.

---

## 6. Fey-Touched

**Niche:** Unpredictable supernatural visions. The fey mark is a gift wrapped in uncertainty -- perception sharpens, the veil thins, but the visions come unbidden and the timing is never convenient. The until_event captures the way fey perception lingers until the mundane world reasserts itself (entering combat, the shock of violence disperses the visions). The reactive effect fires on entering new hexes -- each new place triggers a flash of otherworldly sight, granting a brief reveal burst.

```typescript
{
  id: 'reward_condition_fey_touched',
  type: 'trait',
  name: 'Fey-Touched',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#supernatural', '#veil', '#eye'],
    description: 'Brief exposure to the otherworld leaves lingering perception.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '+0.03 Veil, +0.03 Eye, Veil bonus persists until combat (resets on violence), +1 awareness range',
    flavorText: 'Colors seem too vivid. Time moves strangely at the edges of the day.',
    effects: [
      { type: 'passive', reach: 'veil', value: 0.03 },
      { type: 'until_event', event: 'enter_combat', reach: 'eye', value: 0.03, destroyOnEvent: false },
      { type: 'range_modifier', awarenessRangeBonus: 1 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive + until_event + range_modifier), -domainContributions, updated mechanicalSummary.
**Total reach value:** +0.03 Veil passive + +0.03 Eye (until combat) + awareness range bonus = 0.06 max reach. Well within 0.15 cap. The awareness range bonus is a non-reach benefit that reinforces the fey perception theme.

---

## 7. Death-Marked

**Niche:** Doom clock with supernatural awareness. The death mark is a brand from the shadow world -- the agent survived something lethal and now death watches them with professional interest. The shadow and eye bonuses reflect heightened awareness of danger and mortality. The heart penalty captures how others sense the death-mark and pull away. The reactive effect is the signature mechanic: when the agent takes damage, the proximity of death sharpens their shadow perception briefly. The cooldown ensures this doesn't fire constantly.

```typescript
{
  id: 'reward_condition_death_marked',
  type: 'trait',
  name: 'Death-Marked',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#supernatural', '#shadow', '#eye'],
    description: 'Survived something that should have killed. The shadow world notices.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '+0.06 Shadow, +0.04 Eye, -0.04 Heart, damage triggers +0.04 Shadow for 6 ticks (12-tick cooldown)',
    flavorText: 'Crows follow you. The dying look at you with recognition.',
    effects: [
      { type: 'passive', reach: 'shadow', value: 0.06 },
      { type: 'passive', reach: 'eye', value: 0.04 },
      { type: 'passive', reach: 'heart', value: -0.04 },
      { type: 'reactive', trigger: 'damaged', effect: {
        type: 'duration', ticks: 6, reach: 'shadow', value: 0.04, destroyOnExpiry: true,
      }, cooldown: 12 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive x3 + reactive(duration)), -domainContributions, updated mechanicalSummary.
**Total reach value:** +0.06 Shadow + 0.04 Eye - 0.04 Heart = 0.06 net passive. +0.04 Shadow reactive burst = 0.10 Shadow peak. Total positive reach 0.14 peak. Within 0.15 cap.

---

## 8. Void-Scarred

**Niche:** Reality perception altered, veil affinity. The void scar is a wound in the fabric of the world where it touches the agent -- reality frays at their edges, animals flee, small objects drift. The star and shadow bonuses are substantial (this is T3 supernatural), and the heart penalty is severe -- people instinctively recoil from someone whose presence distorts reality. The reveal effect captures the supernatural perception: the void-scarred can see encounters and agents that others cannot. The conditional star bonus in mystical contexts represents the scar resonating with other sources of magical power.

```typescript
{
  id: 'reward_condition_void_scarred',
  type: 'trait',
  name: 'Void-Scarred',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#supernatural', '#star', '#shadow', '#veil'],
    description: 'Touched by the space between worlds. Reality sits uneasy around you.',
    maxLevel: 1,
    visibility: 'divine_only',
    mechanicalSummary: '+0.08 Star, +0.05 Shadow, -0.08 Heart, +0.04 Star in mystical contexts, reveals hidden encounters within 2 hexes',
    flavorText: 'The air shimmers where you stand. Small animals will not approach. Gods pay attention.',
    effects: [
      { type: 'passive', reach: 'star', value: 0.08 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'passive', reach: 'heart', value: -0.08 },
      { type: 'conditional', condition: 'in_mystical', reach: 'star', value: 0.04 },
      { type: 'reveal', target: 'encounters', range: 2 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive x3 + conditional + reveal), -domainContributions, updated mechanicalSummary.
**Total reach value:** +0.08 Star + 0.05 Shadow - 0.08 Heart = 0.05 net passive. +0.04 Star conditional = 0.12 Star peak. Total positive reach 0.17 peak in mystical contexts. **Flag for review:** Star reaches 0.12 in mystical contexts, which is within per-reach cap but the total positive reach (0.12 Star + 0.05 Shadow = 0.17) exceeds 0.15. Consider reducing conditional to +0.02 Star. The reveal is a non-reach benefit.

---

## 9. Mark of Debt

**Niche:** Supernatural obligation that drains resources. The mark of debt is a cosmic IOU written on the bearer's palm -- wealth slips away, opportunities sour, and the debt deepens over time. The resource_manipulate effect is the signature mechanic: quintessence (the agent's accumulated spiritual currency) drains slowly per tick, representing the supernatural creditor collecting. The stacking on social interactions represents how every deal the agent makes somehow costs more than it should -- the debt reaches into every transaction.

```typescript
{
  id: 'reward_condition_mark_of_debt',
  type: 'trait',
  name: 'Mark of Debt',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#curse', '#gold', '#veil'],
    description: 'A supernatural debt that drains material fortune.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.08 Gold, -0.03 Veil, drains quintessence (-1 per tick), Gold penalty deepens on social encounters (max -0.03 extra)',
    flavorText: 'A scar on the palm in the shape of a coin. Wealth slips through your fingers like water.',
    effects: [
      { type: 'passive', reach: 'gold', value: -0.08 },
      { type: 'passive', reach: 'veil', value: -0.03 },
      { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: -1, mode: 'per_tick' },
      { type: 'stacking', reach: 'gold', valuePerStack: -0.01, maxStacks: 3, stackOn: 'social_success' },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive x2 + resource_manipulate + stacking), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.08 Gold - 0.03 Veil = -0.11 passive. -0.03 Gold stacking worst case = -0.14 total. Resource drain is a non-reach penalty. Within 0.15 cap.

---

## 10. The Hollow

**Niche:** Emptiness and personality erosion. The Hollow is the most insidious curse in the catalog -- it takes not strength or fortune but identity itself. Joy fades, purpose dims, connections wither. The heart penalty is severe (-0.12), and the shadow bonus (+0.05) represents how emptiness makes the bearer less visible, less present, easier to overlook. The axiological drift is the signature: the bearer's personality slowly erodes toward nihilism. The behavior weight suppresses social encounters -- the hollow agent stops seeking connection, not because they can't but because they've forgotten why they should.

```typescript
{
  id: 'reward_condition_the_hollow',
  type: 'trait',
  name: 'The Hollow',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#curse', '#heart', '#shadow', '#veil'],
    description: 'Something essential has been taken. Joy, purpose, or identity -- something is missing.',
    maxLevel: 1,
    visibility: 'discoverable',
    mechanicalSummary: '-0.12 Heart, +0.05 Shadow, personality erodes toward nihilism, avoids social encounters, -0.3 cooperation bias with all',
    flavorText: 'You feel nothing where feeling should be. Others sense the void and flinch.',
    effects: [
      { type: 'passive', reach: 'heart', value: -0.12 },
      { type: 'passive', reach: 'shadow', value: 0.05 },
      { type: 'axiological_drift', axis: 'loyalty_ambition', ratePerTick: -0.004, limitValue: -0.5 },
      { type: 'behavior_weight', reach: 'heart', multiplier: 0.3 },
      { type: 'social_modifier', targetFilter: 'any', cooperationBias: -0.3 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive x2 + axiological_drift + behavior_weight + social_modifier), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.12 Heart + 0.05 Shadow = -0.07 net passive. Axiological drift, behavior weight, and social modifier are all meta-effects (personality/behavior shaping, not direct reach modification). Within 0.15 cap for reach values. The combination of three behavioral primitives makes this feel appropriately devastating for a T3 curse.

---

## 11. Watch Scrutiny

**Niche:** Social surveillance and behavior constraint. Watch scrutiny is the mundane curse of being noticed by authority. Guards check your bags twice, merchants refuse credit, informants lurk. The shadow penalty reflects the impossibility of operating unseen when every checkpoint knows your face. The gold penalty is the cost of suspicion in commerce. The heart penalty is the social chill -- people distance themselves from the watched. The conditional effect deepens the shadow penalty when alone, reflecting that a solitary traveler under scrutiny draws more attention than one in a crowd.

```typescript
{
  id: 'reward_condition_watch_scrutiny',
  type: 'trait',
  name: 'Watch Scrutiny',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#checkpoint', '#curse', '#eye', '#shadow'],
    description: 'The checkpoint remembers your face. Inspections linger, questions multiply, and every small irregularity now feels one witness away from becoming a problem.',
    maxLevel: 1,
    visibility: 'public',
    mechanicalSummary: '-0.04 Shadow, -0.03 Gold, -0.02 Heart, extra -0.02 Shadow when alone',
    flavorText: 'A name in the wrong ledger, a guard who squints too long, a merchant who suddenly decides not to meet your eye.',
    effects: [
      { type: 'passive', reach: 'shadow', value: -0.04 },
      { type: 'passive', reach: 'gold', value: -0.03 },
      { type: 'passive', reach: 'heart', value: -0.02 },
      { type: 'conditional', condition: 'alone', reach: 'shadow', value: -0.02 },
    ],
    // domainContributions removed -- migrated to effects[]
  } as TraitDefinitionProperties,
}
```

**Changes:** +effects[] (passive x3 + conditional), -domainContributions, updated mechanicalSummary.
**Total reach value:** -0.04 Shadow - 0.03 Gold - 0.02 Heart = -0.09 passive. -0.02 Shadow conditional = -0.11 worst case. Well within 0.15 cap. The conditional captures the situational nature of scrutiny -- traveling alone draws more suspicion.

---

## Summary Table

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Road Fever | T1 | Travel debility, worsens with activity | passive + range_modifier + stacking | -0.07 worst | +effects[], -domainContributions, updated summary |
| 2 | Gut Rot | T1 | Slow internal decay, provisions penalty | decay + passive | -0.09 worst | +effects[], -domainContributions, updated summary |
| 3 | Greyscale | T2 | Spreading numbness, social stigma, transforms | passive x2 + social_modifier + transform | -0.12 + social | +effects[], -domainContributions, updated summary |
| 4 | The Wasting | T3 | Progressive supernatural disease, veil trade | decay + until_event + axiological_drift | -0.14 / +0.05 | +effects[], -domainContributions, updated summary |
| 5 | Spine Wound | T3 | Catastrophic movement/combat debility | passive x2 + action_gate + range_modifier + behavior_weight | -0.17 (flag) | +effects[], -domainContributions, updated summary |
| 6 | Fey-Touched | T1 | Unpredictable visions, fey perception | passive + until_event + range_modifier | +0.06 max | +effects[], -domainContributions, updated summary |
| 7 | Death-Marked | T2 | Doom awareness, damage-triggered shadow | passive x3 + reactive(duration) | +0.14 peak | +effects[], -domainContributions, updated summary |
| 8 | Void-Scarred | T3 | Reality distortion, supernatural reveal | passive x3 + conditional + reveal | +0.17 peak (flag) | +effects[], -domainContributions, updated summary |
| 9 | Mark of Debt | T2 | Resource drain, deepening trade curse | passive x2 + resource_manipulate + stacking | -0.14 worst | +effects[], -domainContributions, updated summary |
| 10 | The Hollow | T3 | Personality erosion, identity loss | passive x2 + axiological_drift + behavior_weight + social_modifier | -0.12 reach | +effects[], -domainContributions, updated summary |
| 11 | Watch Scrutiny | T1 | Social surveillance, behavior constraint | passive x3 + conditional | -0.11 worst | +effects[], -domainContributions, updated summary |

## Primitive Distribution

| Primitive | Used By |
|-----------|---------|
| passive | All 11 items (base layer -- reach conversion or direct) |
| decay | Gut Rot, The Wasting |
| stacking | Road Fever, Mark of Debt |
| range_modifier | Road Fever, Spine Wound, Fey-Touched |
| social_modifier | Greyscale, The Hollow |
| transform | Greyscale |
| until_event | The Wasting, Fey-Touched |
| axiological_drift | The Wasting, The Hollow |
| action_gate | Spine Wound |
| behavior_weight | Spine Wound, The Hollow |
| reactive (nested duration) | Death-Marked |
| conditional | Void-Scarred, Watch Scrutiny |
| reveal | Void-Scarred |
| resource_manipulate | Mark of Debt |

14 distinct primitives across 11 items. No primitive appears more than 3 times. The batch-spec primitives (decay, transform, social_modifier, until_event, reactive, reveal, resource_manipulate, axiological_drift, stacking) are all represented.

## Cap Compliance

| Item | Passive Total | Max Conditional/Stacking | Within 0.15 Cap? |
|------|--------------|--------------------------|-----------------|
| Road Fever | -0.04 Iron | -0.03 stacking | Yes (-0.07) |
| Gut Rot | -0.02 Gold | -0.07 decay floor | Yes (-0.09) |
| Greyscale | -0.12 | -- | Yes (-0.12 + social) |
| The Wasting | +0.05 Veil / -0.08 Iron start | -0.14 decay floor | At cap per-reach (-0.14 Iron) |
| Spine Wound | -0.17 | -- | **Over cap (-0.17, flag)** |
| Fey-Touched | +0.06 | -- | Yes (+0.06) |
| Death-Marked | +0.06 net | +0.04 reactive burst | Yes (+0.14 peak) |
| Void-Scarred | +0.05 net | +0.04 conditional | **Positive total over cap (+0.17 peak, flag)** |
| Mark of Debt | -0.11 | -0.03 stacking | Yes (-0.14) |
| The Hollow | -0.07 net | -- | Yes (-0.12 Heart) |
| Watch Scrutiny | -0.09 | -0.02 conditional | Yes (-0.11) |

**Flagged items:**
- **Spine Wound (T3 wound):** -0.17 total reach. Original was -0.20 (iron -0.12 + flesh -0.08), so this is already reduced. Consider reducing Heart to -0.03 for exactly -0.15, or accept as T3 catastrophic wound with editorial justification.
- **Void-Scarred (T3 supernatural):** +0.17 peak positive reach in mystical contexts. Original was +0.13 positive / -0.08 negative (star 0.08 + shadow 0.05 - heart 0.08). The conditional adds +0.04 Star. Consider reducing conditional to +0.02 for +0.15 peak.

## Design Notes

**Disease identity spectrum:** The 4 diseases form a clear progression of severity and mechanical complexity:
- **Road Fever** (T1): movement penalty + activity-stacking. Rest to recover.
- **Gut Rot** (T1): time-based decay (worsens passively). Needs treatment before it bottoms out.
- **Greyscale** (T2): social stigma + transformation risk. Others avoid you AND it might get worse.
- **The Wasting** (T3): tradeoff disease (lose body, gain veil sight) + personality drift. The most narratively rich.

**Supernatural identity spectrum:** The 3 supernatural conditions escalate from gift to burden:
- **Fey-Touched** (T1): modest perception bonus, awareness range. Net positive but unsettling.
- **Death-Marked** (T2): shadow/eye power at social cost. Damage-reactive creates tense combat moments.
- **Void-Scarred** (T3): powerful but isolating. The reveal effect and conditional make them a supernatural sensor at the cost of all social connection.

**Curse completion:** Mark of Debt and The Hollow complete the curse spectrum started in the blessings-curses batch. Mark of Debt is the economic curse (drains resources), The Hollow is the existential curse (drains identity). Watch Scrutiny bridges curses and social conditions -- it's technically labeled as social but functions mechanically as a mild multi-reach curse.

**Flesh reach mapping:** All original `flesh` reach values have been mapped to valid `ReachDomain` values. The mapping follows thematic logic: flesh-as-physical-endurance becomes `iron`, flesh-as-vitality-and-wellbeing becomes `heart`. This is consistent with the editorial guidance from the blessings-curses batch. Tags are preserved unchanged to maintain item identity.
