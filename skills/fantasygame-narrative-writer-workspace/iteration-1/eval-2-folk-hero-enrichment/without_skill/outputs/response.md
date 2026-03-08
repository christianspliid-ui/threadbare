# Enriching the Folk Hero Archetype

## Current State

The folk_hero archetype exists in `src/data/archetype-content.ts` (lines 445-485) but is **thin on narrative specificity**. Currently it has:

- **Beat patterns**: Only 2 patterns (action_critical/contested_action, tier_transition)
- **Tone keywords**: Basic adjectival set (stubborn, calloused, warm, unlikely, plain-spoken, generous)
- **Vignette seeds**: 3 generic opening hooks
- **Narrative requirements**: Basic (character: common folk, artifact: common tool, location: marketplace)

**The problem**: A folk hero's arc—the legend-building, the authority tension, the rallying moment—isn't captured. Robin Hood and Kvothe feel flat because the beat patterns don't trigger on the key moments that make their stories tick.

---

## Robin Hood / Kvothe Story Architecture

Both follow a four-act pattern:

1. **Humble Origins** — Common birth, proven competence in mundane contexts
2. **Growing Legend** — Repeated small victories against authority; reputation spreads
3. **Authority Tension** — Power structures take notice; escalating conflict with establishment
4. **The Rallying Moment** — People choose the folk hero over authority; public uprising or mass following

Your current beat patterns miss acts 1, 2, and 4. Let's fix this.

---

## Design: Enhanced Folk Hero Beat Patterns

### Beat Pattern 1: Humble Origins (NEW)
**Trigger**: `trait_acquired` at Routine tier, promoting to Notable
**Purpose**: Mark the moment when the folk hero's defining characteristic emerges—the thing that will set them apart

```typescript
{
  eventTypes: ['trait_acquired'],
  minimumTier: 'routine',
  promoteTo: 'notable',
  narrativeRequirements: [
    {
      category: 'character',
      tags: ['mentor', 'elder', 'witness from common folk'],
      required: false,
      culturallyShape: true,
    },
    {
      category: 'artifact',
      tags: ['common tool mastered', 'first victory token', 'humble gift'],
      required: false,
      culturallyShape: true,
    },
    {
      category: 'location',
      tags: ['common place', 'marketplace', 'gathering place', 'threshold'],
      required: false,
      culturallyShape: true,
    },
  ],
  contextPreferences: [
    'from nothing, something emerges',
    'common skill becomes legendary',
    'the day {name} was noticed',
    'when the gift revealed itself',
  ],
}
```

**Prose effect**: "From nothing, {name}'s gift emerged. A {adj} {noun} that would echo through history started in the {location}, over a {artifact}."

---

### Beat Pattern 2: Growing Legend (NEW)
**Trigger**: `action_critical` at Routine tier, promoting to Notable
**Purpose**: Capture the repeated small victories that build a folk hero's reputation

```typescript
{
  eventTypes: ['action_critical'],
  minimumTier: 'routine',
  promoteTo: 'notable',
  narrativeRequirements: [
    {
      category: 'character',
      tags: ['community', 'common folk', 'dependent', 'witness'],
      required: true,
      culturallyShape: true,
    },
    {
      category: 'location',
      tags: ['gathering place', 'market', 'humble ground', 'common street'],
      required: false,
      culturallyShape: true,
    },
  ],
  contextPreferences: [
    'word spreads',
    'the legend grows in tavern songs',
    'small act, enormous consequence',
    'another proof of what they\'re becoming',
    'the common folk remember this one',
  ],
}
```

**Prose effect**: "The tale of {name}'s {adj} deed spread like {noun} through common places. In {location}, they sing of it still."

---

### Beat Pattern 3: Authority Tension (ENHANCED)
**Trigger**: `contested_action` at Notable tier (elevated from Routine), promoting to Notable
**Purpose**: Capture the moment when power structures explicitly oppose the folk hero

```typescript
{
  eventTypes: ['contested_action'],
  minimumTier: 'notable',  // <-- RAISED from 'routine' to make it harder to trigger
  promoteTo: 'notable',
  narrativeRequirements: [
    {
      category: 'character',
      tags: ['authority figure', 'noble', 'tyrant', 'rival power'],
      required: true,
      culturallyShape: true,
    },
    {
      category: 'character',
      tags: ['common folk', 'dependent', 'community'],
      required: true,
      culturallyShape: true,
    },
    {
      category: 'location',
      tags: ['seat of power', 'palace', 'throne', 'place of judgment'],
      required: false,
      culturallyShape: true,
    },
  ],
  contextPreferences: [
    'power stands against the people',
    'the folk hero forces a choice',
    'authority finally notices the threat',
    'the line is crossed',
    'no compromise possible now',
  ],
}
```

**Prose effect**: "The {authority} could no longer ignore {name}. The people had chosen, and that choice was a {adj} {noun} that echoed in the halls of power. War was coming."

---

### Beat Pattern 4: The Rallying Moment (NEW)
**Trigger**: `tier_transition` at Notable tier (keep existing), OR new `action_critical` with high social stakes
**Purpose**: The moment when the folk hero's influence reaches critical mass—the people actively choose them

```typescript
{
  eventTypes: ['tier_transition', 'action_critical'],
  minimumTier: 'notable',
  promoteTo: 'chronicle',  // <-- PROMOTE to chronicle (broadest scope)
  narrativeRequirements: [
    {
      category: 'character',
      tags: ['common folk', 'community', 'crowd', 'legion of followers'],
      required: true,
      culturallyShape: true,
    },
    {
      category: 'location',
      tags: ['gathering place', 'marketplace', 'public square', 'field of assembly'],
      required: true,
      culturallyShape: true,
    },
    {
      category: 'artifact',
      tags: ['banner', 'rallying symbol', 'common token of unity'],
      required: false,
      culturallyShape: true,
    },
  ],
  contextPreferences: [
    'the people rallied',
    'the moment when many became one',
    'history pivoting on a {name}\'s choice',
    'legend born in fire and numbers',
    'the common folk rose as one',
  ],
}
```

**Prose effect**: "The {location} erupted with {noun}. Thousands of common voices, unified, crying {name}'s name. {target} had lost—not to {name}, but to the will of people no longer willing to be silent."

---

## Tone Keywords Enhancement

Current:
```typescript
toneKeywords: {
  adjectives: ['stubborn', 'calloused', 'warm', 'unlikely', 'plain-spoken', 'generous'],
  verbs: ['stood', 'laughed', 'shared', 'rallied', 'persisted', 'endured'],
  sentenceRhythm: 'Earthy and warm. Humor arrives naturally. Gallows comedy earns its place through the character.',
}
```

Enhanced:
```typescript
toneKeywords: {
  adjectives: [
    'stubborn', 'calloused', 'warm', 'unlikely', 'plain-spoken', 'generous',
    // NEW: Add legend-building words
    'defiant', 'rallying', 'steadfast', 'indomitable', 'unflinching', 'chosen',
  ],
  verbs: [
    'stood', 'laughed', 'shared', 'rallied', 'persisted', 'endured',
    // NEW: Action-oriented verbs for rising tension
    'challenged', 'gathered', 'inspired', 'led', 'refused', 'rose',
  ],
  sentenceRhythm: 'Earthy and warm. Humor arrives naturally. Gallows comedy earns its place through the character. Build momentum: simple sentences at first, then compound structures as the legend grows. Short, punchy statements in the rallying moment.',
}
```

---

## Vignette Seeds Enhancement

Current (3 seeds):
```typescript
vignetteSeeds: [
  '{name} came from nothing and made a difference anyway. The common folk remember {name} because {name} never forgot where {name} came from. That memory was worth more than any crown.',
  'They sing about {name} in taverns where common folk drink. The songs are true, though the singers add humor to soften the edges. {name} would appreciate that.',
  '{name} had calluses on their hands from real work and a heart that refused to harden all the way. It was this combination that made {name} dangerous to those in power.',
]
```

Enhanced (add 6 more for richer variation):
```typescript
vignetteSeeds: [
  // Existing 3...

  // NEW: Legend-building vignettes
  'The legend of {name} began small—a story told in one tavern, whispered in a marketplace. But legends, once born, grow like weeds through stone. By the time the powerful noticed, {name}\'s name was on a thousand lips.',

  '{name} had never wanted to lead. But the people looked at {name} and saw what they needed—not a king, but a {name}. So {name} led, reluctantly and completely.',

  'In the end, {name}\'s greatest victory was not against {target}, but for the common folk who discovered they need not kneel. {name} simply showed them how to stand.',

  'The songs about {name} are not about {name} at all, really. They are about what {name} awoke in ordinary people. That was the true magic.',

  'History would call {name} a legend. But {name} remained what {name} always was—someone from nothing who remembered nothing\'s cost and refused to let others pay it.',

  '{name}\'s rebellion was not fought with armies but with stubborn, calloused hands and a refusal to accept the way things were. That was more dangerous than any sword.',
]
```

---

## Narrative Requirements Enhancement

Current:
```typescript
narrativeRequirements: [
  { category: 'character', tags: ['common folk', 'friend', 'dependent'], required: true, culturallyShape: true },
  { category: 'artifact', tags: ['common tool', 'humble gift', 'token of gratitude'], required: false, culturallyShape: true },
  { category: 'location', tags: ['marketplace', 'gathering place', 'humble home'], required: false, culturallyShape: true },
]
```

Enhanced:
```typescript
narrativeRequirements: [
  // Characters: The folk hero needs a community AND an opponent
  { category: 'character', tags: ['common folk', 'friend', 'dependent', 'community'], required: true, culturallyShape: true },
  { category: 'character', tags: ['authority figure', 'tyrant', 'noble antagonist'], required: false, culturallyShape: true },
  { category: 'character', tags: ['mentor', 'elder', 'wise friend'], required: false, culturallyShape: true },

  // Artifacts: Meaningful tokens of struggle and unity
  { category: 'artifact', tags: ['common tool', 'humble gift', 'token of gratitude', 'symbol of resistance'], required: false, culturallyShape: true },
  { category: 'artifact', tags: ['banner', 'rallying symbol', 'insignia of the people'], required: false, culturallyShape: true },

  // Locations: Humble places where legend is born
  { category: 'location', tags: ['marketplace', 'gathering place', 'humble home', 'place of assembly'], required: false, culturallyShape: true },
  { category: 'location', tags: ['tavern', 'inn', 'common ground', 'crossroads'], required: false, culturallyShape: true },
]
```

---

## Archetype-Level Story Shape Refinement

Current:
```typescript
storyShape: 'Unlikely champion, beloved by common people'
proseTone: 'Warm, earthy, darkly funny'
```

Enhanced:
```typescript
storyShape: 'Humble origin, growing legend, defiant stand, the people rise'
proseTone: 'Warm, earthy, darkly funny—building to defiant. Comfort and camaraderie, then sudden steel.'
```

---

## The Complete Enhanced Folk Hero Definition

Here's what the full archetype looks like after enrichment:

```typescript
{
  id: 'folk_hero',
  name: 'Folk Hero',
  storyShape: 'Humble origin, growing legend, defiant stand, the people rise',
  proseTone: 'Warm, earthy, darkly funny—building to defiant. Comfort and camaraderie, then sudden steel.',
  reachAffinities: ['heart', 'stone', 'gold'],
  toneKeywords: {
    adjectives: [
      'stubborn', 'calloused', 'warm', 'unlikely', 'plain-spoken', 'generous',
      'defiant', 'rallying', 'steadfast', 'indomitable', 'unflinching', 'chosen',
    ],
    verbs: [
      'stood', 'laughed', 'shared', 'rallied', 'persisted', 'endured',
      'challenged', 'gathered', 'inspired', 'led', 'refused', 'rose',
    ],
    sentenceRhythm: 'Earthy and warm. Humor arrives naturally. Build momentum: simple sentences at first, then compound structures as the legend grows. Short, punchy statements in the rallying moment.',
  },
  beatPatterns: [
    // Pattern 1: Humble Origins
    {
      eventTypes: ['trait_acquired'],
      minimumTier: 'routine',
      promoteTo: 'notable',
      narrativeRequirements: [
        {
          category: 'character',
          tags: ['mentor', 'elder', 'witness from common folk'],
          required: false,
          culturallyShape: true,
        },
        {
          category: 'artifact',
          tags: ['common tool mastered', 'first victory token', 'humble gift'],
          required: false,
          culturallyShape: true,
        },
        {
          category: 'location',
          tags: ['common place', 'marketplace', 'gathering place', 'threshold'],
          required: false,
          culturallyShape: true,
        },
      ],
      contextPreferences: [
        'from nothing, something emerges',
        'common skill becomes legendary',
        'the day {name} was noticed',
        'when the gift revealed itself',
      ],
    },

    // Pattern 2: Growing Legend
    {
      eventTypes: ['action_critical'],
      minimumTier: 'routine',
      promoteTo: 'notable',
      narrativeRequirements: [
        {
          category: 'character',
          tags: ['community', 'common folk', 'dependent', 'witness'],
          required: true,
          culturallyShape: true,
        },
        {
          category: 'location',
          tags: ['gathering place', 'market', 'humble ground', 'common street'],
          required: false,
          culturallyShape: true,
        },
      ],
      contextPreferences: [
        'word spreads',
        'the legend grows in tavern songs',
        'small act, enormous consequence',
        'another proof of what they\'re becoming',
        'the common folk remember this one',
      ],
    },

    // Pattern 3: Authority Tension (ENHANCED)
    {
      eventTypes: ['contested_action'],
      minimumTier: 'notable',
      promoteTo: 'notable',
      narrativeRequirements: [
        {
          category: 'character',
          tags: ['authority figure', 'noble', 'tyrant', 'rival power'],
          required: true,
          culturallyShape: true,
        },
        {
          category: 'character',
          tags: ['common folk', 'dependent', 'community'],
          required: true,
          culturallyShape: true,
        },
        {
          category: 'location',
          tags: ['seat of power', 'palace', 'throne', 'place of judgment'],
          required: false,
          culturallyShape: true,
        },
      ],
      contextPreferences: [
        'power stands against the people',
        'the folk hero forces a choice',
        'authority finally notices the threat',
        'the line is crossed',
        'no compromise possible now',
      ],
    },

    // Pattern 4: The Rallying Moment (NEW)
    {
      eventTypes: ['tier_transition', 'action_critical'],
      minimumTier: 'notable',
      promoteTo: 'chronicle',
      narrativeRequirements: [
        {
          category: 'character',
          tags: ['common folk', 'community', 'crowd', 'legion of followers'],
          required: true,
          culturallyShape: true,
        },
        {
          category: 'location',
          tags: ['gathering place', 'marketplace', 'public square', 'field of assembly'],
          required: true,
          culturallyShape: true,
        },
        {
          category: 'artifact',
          tags: ['banner', 'rallying symbol', 'common token of unity'],
          required: false,
          culturallyShape: true,
        },
      ],
      contextPreferences: [
        'the people rallied',
        'the moment when many became one',
        'history pivoting on a choice',
        'legend born in fire and numbers',
        'the common folk rose as one',
      ],
    },
  ],
  vignetteSeeds: [
    '{name} came from nothing and made a difference anyway. The common folk remember {name} because {name} never forgot where {name} came from. That memory was worth more than any crown.',
    'They sing about {name} in taverns where common folk drink. The songs are true, though the singers add humor to soften the edges. {name} would appreciate that.',
    '{name} had calluses on their hands from real work and a heart that refused to harden all the way. It was this combination that made {name} dangerous to those in power.',
    'The legend of {name} began small—a story told in one tavern, whispered in a marketplace. But legends, once born, grow like weeds through stone. By the time the powerful noticed, {name}\'s name was on a thousand lips.',
    '{name} had never wanted to lead. But the people looked at {name} and saw what they needed—not a king, but a {name}. So {name} led, reluctantly and completely.',
    'In the end, {name}\'s greatest victory was not against {target}, but for the common folk who discovered they need not kneel. {name} simply showed them how to stand.',
    'The songs about {name} are not about {name} at all, really. They are about what {name} awoke in ordinary people. That was the true magic.',
    'History would call {name} a legend. But {name} remained what {name} always was—someone from nothing who remembered nothing\'s cost and refused to let others pay it.',
    '{name}\'s rebellion was not fought with armies but with stubborn, calloused hands and a refusal to accept the way things were. That was more dangerous than any sword.',
  ],
  narrativeRequirements: [
    { category: 'character', tags: ['common folk', 'friend', 'dependent', 'community'], required: true, culturallyShape: true },
    { category: 'character', tags: ['authority figure', 'tyrant', 'noble antagonist'], required: false, culturallyShape: true },
    { category: 'character', tags: ['mentor', 'elder', 'wise friend'], required: false, culturallyShape: true },
    { category: 'artifact', tags: ['common tool', 'humble gift', 'token of gratitude', 'symbol of resistance'], required: false, culturallyShape: true },
    { category: 'artifact', tags: ['banner', 'rallying symbol', 'insignia of the people'], required: false, culturallyShape: true },
    { category: 'location', tags: ['marketplace', 'gathering place', 'humble home', 'place of assembly'], required: false, culturallyShape: true },
    { category: 'location', tags: ['tavern', 'inn', 'common ground', 'crossroads'], required: false, culturallyShape: true },
  ],
}
```

---

## Implementation Checklist

**File**: `src/data/archetype-content.ts`

1. Find the `folk_hero` archetype definition (lines 445-485)
2. Replace the `storyShape` and `proseTone` with the enhanced versions
3. Replace the `toneKeywords` object with the enhanced version (2 new adjectives, 2 new verbs, refined rhythm description)
4. Replace the `beatPatterns` array with all 4 patterns (keep the original 2, add 2 new ones, elevate contested_action to Notable)
5. Replace the `vignetteSeeds` array with all 9 seeds (keep the 3 original, add 6 new)
6. Replace the `narrativeRequirements` array with the enhanced version (add more character types, authority figures, rallying symbols)

**Optional file**: `src/data/narrative-content.ts`

Add folk-hero-specific templates to the `NOTABLE_TEMPLATES` and `ROUTINE_TEMPLATES`:

In `NOTABLE_TEMPLATES['action_critical']`, add:
```typescript
'{actor}{personality} stood at the moment when {name}\'s legend crystallized. The {location} fell silent. All eyes turned. {noun} hung in the {adj} air—the instant before everything changed.',
```

In `ROUTINE_TEMPLATES['action_critical']`, add:
```typescript
'{actor} did what seemed impossible. In {location}, the {adj} deed spread like {noun}. Another proof. Another reason to believe {name} could change the world.',
```

---

## How This Fixes the Robin Hood / Kvothe Problem

**Before enrichment**:
- Robin sneaks past a guard (action_critical, routine) → generic prose
- Robin gets followers (tier_transition, notable) → vague prose about divine bonds
- No beat patterns trigger on "the moment authority takes notice" or "the people rise"
- Story feels like a series of random good deeds, not an arc

**After enrichment**:
- Robin masters a bow skill (trait_acquired) → "From nothing emerged {name}'s gift"
- Robin outwits guards repeatedly (action_critical in growing legend pattern) → "The tale spread like flame. By {location}, they sang {name}'s name"
- Sheriff explicitly confronts Robin (contested_action, elevated to notable) → "Authority finally noticed. No compromise now. War was coming."
- Peasants choose Robin over Sheriff (tier_transition/action_critical in rallying pattern) → "The people rose as one. History pivoted. {name} had lost not to one archer, but to the will of thousands."

**The arc now feels earned**. Each beat has narrative weight. The legend grows visibly. The tension ratchets. The payoff lands.

---

## Tuning Knobs

If you implement this and find the pacing feels off:

1. **Legendary creep too early?** Raise the `minimumTier` of the "growing legend" pattern from `routine` to `notable`
2. **Authority tension not firing?** Ensure there's a prominent character with 'authority figure' or 'tyrant' tag in the world graph
3. **Rallying moment too rare?** Lower `promoteTo` from `chronicle` to `notable`
4. **Prose too generic?** Add more contextPreferences and let the narrative context builder have richer material to pull from

---

## Summary

The folk hero archetype is enriched by:

1. **Adding two new beat patterns** (Humble Origins, Growing Legend) to capture the arc's opening
2. **Elevating Authority Tension** to Notable tier (harder to trigger, more meaningful)
3. **Adding the Rallying Moment** as a chronicle-tier climax (broadest scope, biggest impact)
4. **Expanding tone keywords** with legend-building and defiant language
5. **Multiplying vignette seeds** from 3 to 9 for richer variation
6. **Enriching narrative requirements** with authority figures, rallying symbols, and community spaces

The result: When a folk_hero archetype character appears in your world, they'll experience a full narrative arc from "nobody" to "everybody's hero"—complete with buildup, tension, and the crucial moment when the people themselves become the story.
