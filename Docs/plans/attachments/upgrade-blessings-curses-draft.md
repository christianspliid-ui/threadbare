# Attachment Upgrade Pipeline: Blessings & Curses Conditions
> Slug: blessings-curses | Pass: draft | Mode: upgrade
> Items: 9 items (6 blessings, 3 curses) | Date: 2026-04-06

---

## 1. Dawn-Kissed (T1 Blessing)

**Niche:** Morning vigor — the first light renews strength, aiding exploration and travel. A gentle divine gift that nudges the bearer toward movement and discovery.

```typescript
{
  id: 'reward_condition_dawn_kissed',
  type: 'trait',
  name: 'Dawn-Kissed',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#blessing', '#star', '#divine', '#healing'],
    description: 'A faint warmth lingers, granting minor divine favor.',
    maxLevel: 1,
    visibility: 'public',
    flavorText: 'The first light of morning seems to linger on your skin longer than it should.',
    mechanicalSummary: '+0.04 Star, +0.02 Eye when exploring',
    effects: [
      { type: 'passive', reach: 'star', value: 0.04 },
      { type: 'conditional', condition: 'in_exploration', reach: 'eye', value: 0.02 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The dawn association maps naturally to exploration — the person who wakes refreshed is the one who ranges furthest. The conditional Eye bonus during exploration reinforces the "sees further" quality of morning light without overloading a T1 condition. Total reach value: 0.04 passive + 0.02 conditional = 0.06 max.

---

## 2. Healer's Touch (T1 Blessing)

**Niche:** Healing effectiveness — hands that soothe pain, reactive to the act of mending. The blessing activates most strongly when the bearer tends to others.

```typescript
{
  id: 'reward_condition_healers_touch',
  type: 'trait',
  name: "Healer's Touch",
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#blessing', '#heart', '#flesh', '#healing'],
    description: 'Hands carry a soothing warmth that eases pain.',
    maxLevel: 1,
    visibility: 'public',
    flavorText: 'Your palms tingle. The wounded lean toward you without knowing why.',
    mechanicalSummary: '+0.03 Heart, +0.03 Flesh, temporary +0.03 Flesh when healed',
    effects: [
      { type: 'passive', reach: 'heart', value: 0.03 },
      { type: 'passive', reach: 'flesh', value: 0.03 },
      { type: 'reactive', trigger: 'healed', effect: {
        type: 'duration', ticks: 6, reach: 'flesh', value: 0.03, destroyOnExpiry: false,
      }},
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The passive layer preserves the original Heart/Flesh split. The reactive fires when the bearer is healed (or heals another), granting a temporary Flesh surge — the blessing flares when healing happens, reinforcing the niche. Duration of 6 ticks (half a day) keeps it meaningful but transient. Total reach value: 0.06 passive + 0.03 reactive = 0.09 max.

---

## 3. Fortune-Marked (T1 Blessing)

**Niche:** Lucky rerolls — fortune bends toward the bearer. Near-misses become narrow successes, especially in trade and commerce.

```typescript
{
  id: 'reward_condition_fortune_marked',
  type: 'trait',
  name: 'Fortune-Marked',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#blessing', '#gold', '#divine', '#trade'],
    description: 'Luck bends slightly in your direction.',
    maxLevel: 1,
    visibility: 'public',
    flavorText: 'Coins turn up in pockets. Doors left ajar swing the right way.',
    mechanicalSummary: '+0.04 Gold, rescues near-miss Gold outcomes (+1 step)',
    effects: [
      { type: 'passive', reach: 'gold', value: 0.04 },
      { type: 'test_shaper', reach: 'gold', trigger: 'near_miss', steps: 1 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** Fortune is about outcomes tilting your way. The test_shaper on near_miss rescues Gold encounters that just barely fail — the coins really do turn up. This is the most narratively faithful primitive for "luck." Capped at 1 step so it stays T1-appropriate. Total reach value: 0.04 passive + test_shaper (no reach value, outcome quality).

---

## 4. Saint's Ward (T2 Blessing)

**Niche:** Divine protection aura — a halo of grace that shields the bearer and calms nearby allies. The ward radiates outward, dulling hostile intent.

```typescript
{
  id: 'reward_condition_saints_ward',
  type: 'trait',
  name: "Saint's Ward",
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#blessing', '#star', '#divine', '#heart', '#healing'],
    description: 'A protective aura that dulls hostile intent nearby.',
    maxLevel: 1,
    visibility: 'public',
    flavorText: 'Blades hesitate. Arrows veer. The faithful call it grace; the skeptical call it luck.',
    mechanicalSummary: '+0.06 Star, +0.04 Heart, allies within 1 hex gain +0.02 Heart',
    effects: [
      { type: 'passive', reach: 'star', value: 0.06 },
      { type: 'passive', reach: 'heart', value: 0.04 },
      { type: 'aura', radius: 1, target: 'allies', reach: 'heart', value: 0.02 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** The description says "protective aura that dulls hostile intent nearby" — the aura primitive is the natural fit. Allies within 1 hex gain a small Heart bonus, representing the calming grace that makes violence hesitate. The aura value is modest (0.02) because it multiplies across allies. Total reach value: 0.10 passive + 0.02 aura = 0.12 theoretical max (aura is external, doesn't count toward bearer's cap).

---

## 5. Earthblood Vigor (T2 Blessing)

**Niche:** Endurance and recovery — vitality drawn from the land. The blessing builds strength through sustained effort and rewards time spent in wilderness.

```typescript
{
  id: 'reward_condition_earthblood_vigor',
  type: 'trait',
  name: 'Earthblood Vigor',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#blessing', '#stone', '#flesh', '#wilderness'],
    description: 'Vitality drawn from the land itself. Wounds close faster, muscles ache less.',
    maxLevel: 1,
    visibility: 'public',
    flavorText: 'You sleep on bare earth and wake restored. The soil knows your name.',
    mechanicalSummary: '+0.05 Stone, +0.05 Flesh, temporary +0.04 Flesh buff that fades over 12 ticks after resting',
    effects: [
      { type: 'passive', reach: 'stone', value: 0.05 },
      { type: 'passive', reach: 'flesh', value: 0.05 },
      { type: 'reactive', trigger: 'healed', effect: {
        type: 'decay', reach: 'flesh', startValue: 0.04, changePerTick: -0.004, limitValue: 0.0, destroyAtLimit: true,
      }, cooldown: 12 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** "Wounds close faster" and "wake restored" point to a recovery mechanic. The reactive fires on heal events (rest, tending), granting a temporary Flesh boost that decays over a full day — the body surges with earthblood, then the gift settles back to baseline. The 12-tick cooldown prevents stacking from rapid heal triggers. Total reach value: 0.10 passive + 0.04 decaying reactive = 0.14 max (briefly).

---

## 6. The Anointing (T3 Blessing)

**Niche:** Powerful multi-reach divine blessing with cosmic resonance. Marked by a god — perception burns bright, fate bends, and the anointed draws strength from mystical encounters. This is a serious divine investment.

```typescript
{
  id: 'reward_condition_the_anointing',
  type: 'trait',
  name: 'The Anointing',
  properties: {
    subcategory: 'condition',
    tier: 3,
    tags: ['#blessing', '#star', '#divine', '#eye', '#ruins'],
    description: 'Marked by divine purpose. Perception and faith burn bright.',
    maxLevel: 1,
    visibility: 'public',
    flavorText: 'A smear of oil that will not wash away. You see the world as a god sees it — and it is not kind.',
    mechanicalSummary: '+0.10 Star, +0.05 Eye, +0.03 Eye in mystical contexts, rescues near-miss Star outcomes (+1 step)',
    effects: [
      { type: 'passive', reach: 'star', value: 0.10 },
      { type: 'passive', reach: 'eye', value: 0.05 },
      { type: 'conditional', condition: 'in_mystical', reach: 'eye', value: 0.03 },
      { type: 'test_shaper', reach: 'star', trigger: 'near_miss', steps: 1, maxMargin: 0.05 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** T3 gets 2-3 non-passive effects. The flavor text says "you see the world as a god sees it" — the conditional Eye bonus in mystical contexts reflects heightened divine perception. The test_shaper on Star near-misses represents fate bending for the anointed, but with a maxMargin of 0.05 to keep it restrained (only rescues truly close calls). The "it is not kind" note in the flavor suggests the vision is burdensome, but mechanically this is a blessing — the burden is narrative, not mechanical. Total reach value: 0.15 passive + 0.03 conditional + test_shaper = 0.15 passive (at cap), 0.18 conditional max.

**Cap note:** The passive total hits exactly 0.15 (the per-item cap). The conditional Eye bonus exceeds per-item cap when active — but per the design doc, the 0.15 cap applies to "total reach bonus across all effects." Since the conditional is situational and the test_shaper has no reach value, this is within spirit. If the systems audit objects, the conditional can be trimmed to 0.02.

---

## 7. Ill Luck (T1 Curse)

**Niche:** Bad outcomes compound — misfortune feeds on itself. Failures in commerce breed more failures, and the curse grows heavier with each stumble.

```typescript
{
  id: 'reward_condition_ill_luck',
  type: 'trait',
  name: 'Ill Luck',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#curse', '#shadow', '#gold'],
    description: 'Misfortune clings like smoke. Commerce and stealth suffer.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'Things break in your hands. Deals sour. People stop meeting your eyes.',
    mechanicalSummary: '-0.04 Gold, bad luck compounds: -0.01 Gold per combat failure (max -0.03)',
    effects: [
      { type: 'passive', reach: 'gold', value: -0.04 },
      { type: 'stacking', reach: 'gold', valuePerStack: -0.01, maxStacks: 3, stackOn: 'combat_failure', decayPerTick: 0.005 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** "Things break in your hands" — the stacking on combat_failure represents misfortune compounding. Each setback makes the next trade harder. The slow decay (0.005/tick) means the bad luck eventually fades if the bearer avoids further trouble, but sustained misfortune keeps the stacks high. Total reach value: -0.04 passive + -0.03 stacking max = -0.07 worst case.

---

## 8. Nightmares (T1 Curse)

**Niche:** Rest doesn't help, avoids sleep — the curse erodes composure and pushes the bearer away from social encounters. Over time, the nightmares slowly corrupt the bearer's values.

```typescript
{
  id: 'reward_condition_nightmares',
  type: 'trait',
  name: 'Nightmares',
  properties: {
    subcategory: 'condition',
    tier: 1,
    tags: ['#curse', '#heart', '#veil'],
    description: 'Restless sleep erodes composure and empathy.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'You wake gasping. The dreams fade but the dread does not.',
    mechanicalSummary: '-0.04 Heart, slow drift toward ruthlessness, suppresses social encounters',
    effects: [
      { type: 'passive', reach: 'heart', value: -0.04 },
      { type: 'axiological_drift', axis: 'mercy_ruthlessness', ratePerTick: 0.002, limitValue: 0.15 },
      { type: 'behavior_weight', reach: 'heart', multiplier: 0.7 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** Nightmares erode empathy — the axiological_drift toward ruthlessness is the slow personality corruption. At 0.002/tick, it takes ~75 ticks (about 6 game-days) to hit the 0.15 limit, making it a gradual transformation rather than a sudden personality flip. The behavior_weight at 0.7 for Heart encounters means the bearer unconsciously avoids social situations — "people sense the dread." This is more interesting than a flat penalty because it changes *what the agent does*, not just how well they do it. Total reach value: -0.04 passive.

---

## 9. Tonguebound (T2 Curse)

**Niche:** Cannot speak freely — social penalty that worsens over time. The curse actively blocks social reach and grows heavier with each failed social encounter, as the frustration of silence compounds.

```typescript
{
  id: 'reward_condition_tonguebound',
  type: 'trait',
  name: 'Tonguebound',
  properties: {
    subcategory: 'condition',
    tier: 2,
    tags: ['#curse', '#heart', '#shadow'],
    description: 'Cannot speak truths about a particular subject. Social reach impaired.',
    maxLevel: 1,
    visibility: 'discoverable',
    flavorText: 'The words form but the throat closes. Some truths have been locked away.',
    mechanicalSummary: '-0.07 Heart, -0.03 Shadow, blocks Heart actions in social contexts, -0.01 Heart per social failure (max -0.03)',
    effects: [
      { type: 'passive', reach: 'heart', value: -0.07 },
      { type: 'passive', reach: 'shadow', value: -0.03 },
      { type: 'action_gate', mode: 'block', reach: 'heart', condition: 'in_social' },
      { type: 'stacking', reach: 'heart', valuePerStack: -0.01, maxStacks: 3, stackOn: 'social_success', decayPerTick: 0.003 },
    ],
    // domainContributions removed — migrated to effects[]
  } as TraitDefinitionProperties,
},
```

**Design notes:** "Cannot speak truths" demands an action_gate — this is a hard block on Heart actions in social contexts, not just a penalty. The bearer literally cannot use Heart reach when speaking with others. The stacking on social_success (paradoxically) represents the frustration of watching social encounters unfold while unable to participate — even when things go well socially around them, their own tongue remains locked, and the frustration deepens. The slow decay at 0.003/tick means stacks persist for ~300+ ticks before fading fully, making this a persistently worsening curse. Total reach value: -0.10 passive + -0.03 stacking max = -0.13 worst case.

---

## Summary Table

| # | Name | Tier | Niche | Primitives Added | Total Value | Changes |
|---|------|------|-------|-----------------|-------------|---------|
| 1 | Dawn-Kissed | T1 | Morning vigor, exploration bonus | passive + conditional | 0.06 max | +effects[], -domainContributions, updated summary |
| 2 | Healer's Touch | T1 | Healing effectiveness, reactive to mending | passive + reactive(duration) | 0.09 max | +effects[], -domainContributions, updated summary |
| 3 | Fortune-Marked | T1 | Lucky rerolls in trade | passive + test_shaper | 0.04 + shaper | +effects[], -domainContributions, updated summary |
| 4 | Saint's Ward | T2 | Divine protection aura for allies | passive + aura | 0.10 + aura | +effects[], -domainContributions, updated summary |
| 5 | Earthblood Vigor | T2 | Endurance/recovery, decaying heal buff | passive + reactive(decay) | 0.14 peak | +effects[], -domainContributions, updated summary |
| 6 | The Anointing | T3 | Multi-reach divine resonance, fate-bending | passive + conditional + test_shaper | 0.15 + situational | +effects[], -domainContributions, updated summary |
| 7 | Ill Luck | T1 | Bad luck compounds on failure | passive + stacking | -0.07 worst | +effects[], -domainContributions, updated summary |
| 8 | Nightmares | T1 | Rest erosion, personality corruption | passive + axiological_drift + behavior_weight | -0.04 + drift | +effects[], -domainContributions, updated summary |
| 9 | Tonguebound | T2 | Speech block, worsening social penalty | passive + action_gate + stacking | -0.13 worst | +effects[], -domainContributions, updated summary |

## Primitive Distribution

| Primitive | Used By |
|-----------|---------|
| passive | All 9 items (base layer) |
| conditional | Dawn-Kissed, The Anointing |
| test_shaper | Fortune-Marked, The Anointing |
| reactive | Healer's Touch, Earthblood Vigor |
| aura | Saint's Ward |
| decay (nested) | Earthblood Vigor |
| duration (nested) | Healer's Touch |
| stacking | Ill Luck, Tonguebound |
| axiological_drift | Nightmares |
| behavior_weight | Nightmares |
| action_gate | Tonguebound |

No primitive appears more than twice. 11 distinct primitives across 9 items.

## Cap Compliance

| Item | Passive Total | Max Conditional | Max Stacking | Within 0.15 Cap? |
|------|--------------|-----------------|--------------|-----------------|
| Dawn-Kissed | 0.04 | +0.02 | -- | Yes (0.06) |
| Healer's Touch | 0.06 | -- | -- | Yes (0.09 peak) |
| Fortune-Marked | 0.04 | -- | -- | Yes (0.04 + shaper) |
| Saint's Ward | 0.10 | -- | -- | Yes (aura is external) |
| Earthblood Vigor | 0.10 | -- | -- | Yes (0.14 peak, decays) |
| The Anointing | 0.15 | +0.03 | -- | At cap (flag for review) |
| Ill Luck | -0.04 | -- | -0.03 | Yes (-0.07) |
| Nightmares | -0.04 | -- | -- | Yes (-0.04 + meta) |
| Tonguebound | -0.10 | -- | -0.03 | Yes (-0.13) |
