# Enriching the Folk Hero Archetype

## Current State of folk_hero

In `src/data/archetype-content.ts`, the `folk_hero` archetype currently has:

```typescript
{
  id: 'folk_hero',
  name: 'Folk Hero',
  storyShape: 'Unlikely champion, beloved by common people',
  proseTone: 'Warm, earthy, darkly funny',
  reachAffinities: ['heart', 'stone', 'gold'],
  toneKeywords: {
    adjectives: ['stubborn', 'calloused', 'warm', 'unlikely', 'plain-spoken', 'generous'],
    verbs: ['stood', 'laughed', 'shared', 'rallied', 'persisted', 'endured'],
    sentenceRhythm: 'Earthy and warm. Humor arrives naturally. Gallows comedy earns its place through the character.',
  },
  beatPatterns: [
    {
      eventTypes: ['action_critical', 'contested_action'],
      minimumTier: 'routine',
      promoteTo: 'notable',
      narrativeRequirements: [
        { category: 'character', tags: ['community', 'common folk', 'witness'], required: true, culturallyShape: true },
      ],
      contextPreferences: ['against the powerful', 'for the helpless', 'with others watching'],
    },
    {
      eventTypes: ['tier_transition'],
      minimumTier: 'notable',
      promoteTo: 'notable',
      narrativeRequirements: [
        { category: 'location', tags: ['marketplace', 'gathering place', 'common ground'], required: false, culturallyShape: true },
      ],
      contextPreferences: ['reluctant elevation', 'popular will', 'unexpected destiny'],
    },
  ],
  vignetteSeeds: [
    '{name} came from nothing and made a difference anyway. The common folk remember {name} because {name} never forgot where {name} came from. That memory was worth more than any crown.',
    'They sing about {name} in taverns where common folk drink. The songs are true, though the singers add humor to soften the edges. {name} would appreciate that.',
    '{name} had calluses on their hands from real work and a heart that refused to harden all the way. It was this combination that made {name} dangerous to those in power.',
  ],
  narrativeRequirements: [
    { category: 'character', tags: ['common folk', 'friend', 'dependent'], required: true, culturallyShape: true },
    { category: 'artifact', tags: ['common tool', 'humble gift', 'token of gratitude'], required: false, culturallyShape: true },
    { category: 'location', tags: ['marketplace', 'gathering place', 'humble home'], required: false, culturallyShape: true },
  ],
}
```

**Problem:** The beat patterns are thin (only 2 entries). There's no arc showing how a folk hero *becomes* a legend, no tension with authority, no moment where the people rally. Compare this to `tragic_hero` (3 beat patterns, layered) or `trickster` (2, but tightly focused) — folk_hero feels underdeveloped.

---

## The Folk Hero Arc (Robin Hood / Kvothe Pattern)

The classic folk hero arc unfolds in **four narrative beats**:

1. **Origins / Humble Discovery** — Audience meets the folk hero as an ordinary person. Maybe they're a blacksmith, a beggar, a thief with a code. The genius is hidden at first.

2. **First Act Against Authority** — A moment of defiance. The folk hero stands up to someone powerful on behalf of someone powerless. This is where the legend *begins*, often with witnesses watching.

3. **Growing Legend / Escalation** — The folk hero's deeds accumulate. More people whisper their name. Authority takes notice. Tension builds as the folk hero becomes *important* — which complicates their core identity (humble, for the people, not above them).

4. **The Rally** — A moment where the common people openly support the folk hero. This can be beautiful (townspeople shelter them from guards) or tragic (they're asked to lead a war they don't want). Either way, it's the moment when the folk hero's private resistance becomes public revolution.

Each beat uses different narrative levers and generates different prose.

---

## Enriched folk_hero Definition

Here's the full enriched version for `src/data/archetype-content.ts`:

```typescript
{
  id: 'folk_hero',
  name: 'Folk Hero',
  storyShape: 'Humble origins → first defiance → growing legend → people rally',
  proseTone: 'Warm, earthy, darkly funny, with an edge of defiance',
  reachAffinities: ['heart', 'stone', 'gold'],

  toneKeywords: {
    adjectives: [
      'stubborn', 'calloused', 'warm', 'unlikely', 'plain-spoken', 'generous',
      'defiant', 'scrappy', 'wry', 'grounded', 'unpolished', 'fierce'
    ],
    verbs: [
      'stood', 'laughed', 'shared', 'rallied', 'persisted', 'endured',
      'defied', 'sheltered', 'spoke', 'resisted', 'lifted', 'broke'
    ],
    sentenceRhythm: 'Earthy and warm. Humor arrives naturally — gallows comedy earns its place. When defiance comes, it lands hard. No flowery language; let the action speak.'
  },

  beatPatterns: [
    // ─── Beat 1: Origins / Discovery ───
    {
      eventTypes: ['trait_acquired', 'action_resolved'],
      minimumTier: 'routine',
      promoteTo: 'routine',  // Keep low-key in early game
      narrativeRequirements: [
        {
          category: 'artifact',
          tags: ['common tool', 'humble item', 'inherited thing', 'craft of trade'],
          required: false,
          culturallyShape: true
        },
        {
          category: 'location',
          tags: ['home', 'workshop', 'common place', 'birthplace'],
          required: false,
          culturallyShape: true
        },
      ],
      contextPreferences: [
        'before anyone knew their name',
        'in quiet work',
        'foundation of skill',
        'inherited knowledge',
        'learning the trade'
      ]
    },

    // ─── Beat 2: First Defiance ───
    {
      eventTypes: ['action_critical', 'contested_action'],
      minimumTier: 'routine',
      promoteTo: 'notable',  // Promote to Notable when they first stand against power
      narrativeRequirements: [
        {
          category: 'character',
          tags: ['powerful figure', 'authority', 'oppressor', 'noble', 'ruler'],
          required: true,
          culturallyShape: false  // Authority must be recognized as such
        },
        {
          category: 'character',
          tags: ['common folk', 'dependent', 'witness', 'friend', 'innocent'],
          required: true,
          culturallyShape: true
        },
        {
          category: 'artifact',
          tags: ['symbol of oppression', 'tool of power', 'decree', 'tax collector's coin'],
          required: false,
          culturallyShape: false
        },
      ],
      contextPreferences: [
        'against someone with more power',
        'on behalf of the helpless',
        'moment of choice',
        'refusing to bow',
        'speaking truth to power',
        'in front of witnesses'
      ]
    },

    // ─── Beat 3: Growing Legend / Escalation ───
    {
      eventTypes: ['action_critical', 'actor_death', 'tier_transition'],
      minimumTier: 'notable',
      promoteTo: 'chronicle',  // Escalate to Chronicle as the legend grows
      narrativeRequirements: [
        {
          category: 'character',
          tags: ['rival', 'pursuer', 'authority figure', 'rival folk hero'],
          required: false,
          culturallyShape: false
        },
        {
          category: 'location',
          tags: ['marketplace', 'gathering place', 'public space', 'contested place'],
          required: false,
          culturallyShape: true
        },
        {
          category: 'artifact',
          tags: ['legendary item', 'trophy', 'symbol of resistance', 'famous object'],
          required: false,
          culturallyShape: true
        },
      ],
      contextPreferences: [
        'growing reputation',
        'more enemies',
        'more followers',
        'tension between who they are and who they\'ve become',
        'burden of being a symbol',
        'haunted by their own legend'
      ]
    },

    // ─── Beat 4: The Rally / Moment of Unity ───
    {
      eventTypes: ['tier_transition', 'contested_action', 'action_critical'],
      minimumTier: 'notable',
      promoteTo: 'chronicle',  // This is the emotional climax
      narrativeRequirements: [
        {
          category: 'character',
          tags: ['common folk', 'crowd', 'community', 'supporters', 'dependent'],
          required: true,
          culturallyShape: true
        },
        {
          category: 'character',
          tags: ['authority', 'oppressor', 'noble', 'ruler', 'rival'],
          required: false,
          culturallyShape: false
        },
        {
          category: 'location',
          tags: ['gathering place', 'public square', 'village', 'town', 'marketplace'],
          required: true,
          culturallyShape: true
        },
      ],
      contextPreferences: [
        'people openly choosing to stand with them',
        'moment of greatest danger',
        'community defends folk hero or folk hero defends community',
        'bittersweet choice',
        'love made manifest',
        'ordinary people becoming powerful'
      ]
    },
  ],

  vignetteSeeds: [
    // Origins / becoming
    '{name} came from nothing and made a difference anyway. The common folk remember {name} because {name} never forgot where {name} came from. That memory was worth more than any crown.',
    'In a lifetime of humble work, {name} learned what those in towers never could: that calloused hands and a stubborn heart matter more than gold or pedigree.',
    '{name} was not born to greatness. {name} earned it through a thousand small acts of defiance, each one a choice to stand for the helpless.',

    // First defiance
    'The day {name} said no to a noble\'s command was the day the legend truly began. Not because {name} was seeking glory, but because {name} couldn\'t not stand. That kind of honesty is dangerous.',
    '{name} chose the side of a beggar over the command of a lord. For that, {name} became something the powerful had to reckon with.',
    'They say {name}\'s fame began with a simple refusal: I will not. Two words. A lifetime of consequences.',

    // Growing legend
    'The stories about {name} grew with each retelling. Some were true. Some were embellished. But all of them pointed to the same thing: a person the power could not break.',
    'By the time {name}\'s name reached the ears of the mighty, it was already carved into the hearts of the common folk. And that is a power no lord can easily crush.',
    '{name} never asked for a legend. {name} just kept standing. The rest wrote itself in the margins of other people\'s stories.',

    // Rally / climax
    'When the moment came and {name} stood alone against the power, the crowd stepped forward. They did not ask permission. They did not calculate odds. They simply said: not without him. Not without her. Not without {name}.',
    'The most dangerous moment in any kingdom: when the common folk stop accepting the rule they\'ve been given. And they stop because someone showed them they could stand. That someone was {name}.',
    'In the end, {name}\'s greatest victory was not defeating a single foe. It was making the powerless believe they had power. That belief was worth more than any crown could ever buy.',
  ],

  narrativeRequirements: [
    // Global requirements across all beats
    {
      category: 'character',
      tags: ['common folk', 'friend', 'dependent', 'community member'],
      required: true,
      culturallyShape: true
    },
    {
      category: 'character',
      tags: ['authority figure', 'noble', 'ruler', 'oppressor'],
      required: true,  // Folk hero needs someone to stand against
      culturallyShape: false
    },
    {
      category: 'artifact',
      tags: ['common tool', 'humble gift', 'token of gratitude', 'symbol of trade'],
      required: false,
      culturallyShape: true
    },
    {
      category: 'location',
      tags: ['marketplace', 'gathering place', 'humble home', 'common ground', 'contested place'],
      required: true,
      culturallyShape: true
    },
  ],
}
```

---

## Design Decisions Explained

### 1. Four Beat Patterns (vs. two)

Each beat serves a distinct narrative purpose:
- **Beat 1 (Origins)** stays at `routine` tier — these are quiet moments, background texture
- **Beat 2 (First Defiance)** promotes to `notable` — this is the pivot point where the folk hero becomes *noticed*
- **Beat 3 (Growing Legend)** promotes to `chronicle` — escalation, the cost of being a symbol
- **Beat 4 (The Rally)** promotes to `chronicle` — emotional climax where the community becomes powerful

This mirrors the Robin Hood arc: humble archer → first act of defiance → the legend grows and hunts intensify → the people rally behind him.

### 2. Tone Keywords Expanded

Added `defiant`, `scrappy`, `wry`, `fierce` to adjectives and `defied`, `sheltered`, `spoke`, `resisted` to verbs. This gives prose generation more texture when the folk hero is at peak legend (defiant, fierce) vs. origins (stubborn, calloused).

### 3. Context Preferences Are Story-Specific

Instead of generic "against the powerful," the preferences now explicitly call out the *narrative meaning*:
- Beat 2: "refusing to bow," "speaking truth to power"
- Beat 3: "burden of being a symbol," "haunted by their own legend"
- Beat 4: "bittersweet choice," "ordinary people becoming powerful"

When the narrative context builder harvests objects for a folk_hero event, it will now prioritize context that matches these preferences, creating tighter narratives.

### 4. Vignette Seeds Grouped by Beat

The 12 vignette seeds are now explicitly tied to the four beats (3 per beat). This means:
- An early-game folk_hero gets seeded with origin/humble language
- A growing-legend folk_hero gets seeded with escalation/burden language
- A folk_hero in the rally gets seeded with unity/power language

The prose engine can select the vignette that matches the current beat tier, creating narrative coherence across the arc.

### 5. Archetype Narrative Requirements Are Strict

Notice that `isBetrayalTarget` would *not* be applied to folk_hero. Instead, folk_hero has **mandatory authority figure** as a narrative requirement. This prevents folk_heroes from being isolated or friendless — they require both community and opposition to function narratively.

---

## Prose Template Additions

To maximize the richness of these beat patterns, add folk_hero-specific prose templates to `src/data/narrative-content.ts`:

```typescript
export const ROUTINE_TEMPLATES: Record<string, string[]> = {
  // ... existing templates ...

  // Folk Hero — Beat 1: Origins (quiet, foundational)
  'folk_hero_origins': [
    '{actor} worked with calloused hands, and no one thought to notice.',
    'In humble labor, {actor} learned the true measure of {noun}.',
    '{actor} came from nothing, but {noun} taught {actor} that something could still be {adj}.',
  ],
};

export const NOTABLE_TEMPLATES: Record<string, string[]> = {
  // ... existing templates ...

  // Folk Hero — Beat 2: First Defiance (moment of choice)
  'folk_hero_defiance': [
    '{actor} stood against {target}, not for glory but for {noun}{personality}. That refusal would echo for years.',
    'They will sing of the day {actor} said no to {target}. Not because {actor} sought greatness, but because {noun} demanded it.',
    'In {target}\'s presence, {actor} chose the side of the helpless. That choice made {actor} {adj} in ways no title could.',
  ],

  // Folk Hero — Beat 3: Growing Legend (burden, escalation)
  'folk_hero_escalation': [
    '{actor}\'s name spread like wildfire among the common folk, each story adding weight{personality}. {actor} had become a symbol, and symbols cannot simply lay down their burden.',
    'The legend of {actor} grew with each passing {noun}. More followers. More enemies. The weight of being what hope looks like was crushing {actor} slowly.',
    '{target} hunted {actor} now, not as a person but as a {adj} idea that refused to die. And {actor} was learning that being an idea is a lonely way to live.',
  ],

  // Folk Hero — Beat 4: The Rally (moment of unity)
  'folk_hero_rally': [
    'When {actor} stood against {target}, the crowd did not hesitate{personality}. The common folk stepped forward as one — not asking permission, simply saying: not without {actor}.',
    '{actor} had never asked the people to fight. But in that moment, the {adj} {noun} of unity took shape. The powerless became powerful because they chose to stand together.',
    'In the eyes of the crowd, {actor} saw reflected the best of what {noun} could be. And {target} saw, in that same moment, that they could not win against people who refused to accept defeat.',
  ],
};
```

---

## Integration with Content Strategy

Folk_hero beat patterns should interact with the **culture system** and **opposition tensor**:

### 1. Cultural Shaping

Several narrative requirements have `culturallyShape: true`:
- `character` with tags `common folk` → Culture influences which folk are present (are they miners? farmers? merchants?)
- `location` with tags `gathering place` → Culture influences which places are sacred (tavern in mining town, market square in trading culture)
- `artifact` with tags `common tool` → Culture influences the tool (blacksmith's hammer in craft culture, merchant's scale in trading culture)

The prose templates can reference these culturally-shaped objects, creating authentic cultural artifacts.

### 2. Opposition Scoring

A folk_hero *needs* an authority figure as an opponent. The opposition matrix should score high tension when:
- Folk_hero (archetype) vs. Tyrant (archetype) = 5 (natural opposition)
- Folk_hero (high Heart reach) vs. Lonely Ruler (high Iron reach) = 3 (reach-based friction)
- Folk_hero (disposition: reciprocal) vs. Authority (disposition: opportunist) = 4 (strategy incompatibility)

This ensures folk_hero events naturally harvest authority figures as context objects, strengthening the narrative.

### 3. Mandate Interaction

Folk_hero mandate templates from `src/data/mandate-content.ts` might include:
- "Shelter {character} from the wrath of {authority}" (Beat 1/2 mandate)
- "Grow the legend until {faction} takes notice" (Beat 3 mandate)
- "Unite {community} to stand against {oppressor}" (Beat 4 mandate)

When a folk_hero is seeded, the mandate generator can weight toward these templates, creating a coherent arc.

---

## Testing Checklist

1. **Type safety**: `npm run build` should pass. The new `beatPatterns` array length is 4 (previously 2).

2. **Beat promotion**:
   - Create a folk_hero agent
   - Generate an `action_critical` event involving the folk_hero and an authority figure
   - Verify that `minimumTier: 'routine'` + `promoteTo: 'notable'` in Beat 2 causes the event to be elevated to Notable tier
   - Verify that Chronicle-tier events (Beat 3/4) require those specific event types

3. **Vignette selection**:
   - Generate vignettes for a folk_hero and verify they draw from the expanded pool (12 seeds vs. 3 originally)
   - Check that the vignettes match the character's current beat (if available in API)

4. **Context object harvesting**:
   - Trigger a folk_hero_rally event and verify that common folk characters and authority figures are harvested as context objects
   - Verify opposition scoring elevates Folk_hero vs. Authority tension

5. **Prose generation**:
   - Manually test each new template variant in narrative-content.ts
   - Verify archetype tone keywords are mixed in (stubborn, calloused, defiant, etc.)

6. **Arc coherence**:
   - Seed a world with a folk_hero
   - Advance ticks to trigger Beats 1, 2, 3, 4 in order
   - Verify the chronicle reads as a coherent story arc (humble → defiant → legendary → rallied)

---

## Optional Enhancements (Pass 2)

- **Beat-tier metadata**: Add a `beat` field to beat patterns so prose can explicitly reference "this is the origin beat" or "this is the rally beat"
- **Aspiration mechanic**: Folk heroes aspire to lead revolts; add a new beat pattern that triggers when disposition/mandate align
- **Cultural folk hero variants**: Different cultures might have different folk hero archetypes (nomadic hero, merchant prince hero, etc.)
- **Rival god generation**: A rival god aligned with the oppressor (the Tyrant, the Hoarder) for folk_hero runs
- **Unmaking phase tweaks**: In the Twilight Phase, folk heroes might unlock a unique "Rally" action to unite the world against the doom

---

## Summary Checklist

To enrich the **folk_hero** archetype:

- [ ] Replace the `folk_hero` entry in `src/data/archetype-content.ts` with the enriched version (4 beat patterns, 12 vignette seeds, expanded tone keywords, stricter narrative requirements)
- [ ] Add `folk_hero_origins`, `folk_hero_defiance`, `folk_hero_escalation`, `folk_hero_rally` templates to `src/data/narrative-content.ts`
- [ ] (Optional) Extend `src/data/mandate-content.ts` with folk_hero-specific mandate templates
- [ ] Run `npm run build` and `npm test`
- [ ] Manually test a folk_hero archetype agent through all four beats
- [ ] Verify prose reads as a coherent narrative arc

That's all you need to make folk_hero feel like Robin Hood or Kvothe — a hero whose legend is earned, not granted!
