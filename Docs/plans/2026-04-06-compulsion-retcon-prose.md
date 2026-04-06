# Compulsion Retcon Prose — Design Plan

**Date:** 2026-04-06
**Goal:** Make the "God's Will" compulsion popup legible to a first-time player by replacing generic prose with contextual, data-driven retcon lines that explain *what* each encounter is and *why* the agent is considering it.

## Problem

The current compulsion popup fails at every level of player comprehension:

1. **Intro vignette** is pure atmosphere — doesn't explain the mechanic (you're a god sensing your agent's deliberations; you can influence their choice)
2. **Encounter hooks** are reach-keyed generics — "Perception sharpens. Something reveals itself." appears 3× in the same popup
3. **Encounter names** are template IDs ("The Gleaming Vein") with no narrative framing
4. **Mechanical labels** ("Eye · Threat easy · 4 essence") are jargon with no player context
5. **No spatial grounding** — no sense of whether the encounter is right here or far away
6. **Duplicate candidates** — same template can appear multiple times

## Design

### Part 1: Rewrite the Intro Vignette

Replace the current quintessence-tiered vignettes with clearer prose that communicates the mechanic.

**Current (example):**
> *"A certainty seized PyxIraVex — sudden as a blade, sure as sunrise. The world narrowed to a single point. they could not say why, but they \*must\* choose."*

**New direction — still tiered by quintessence, but now informative:**

| Tier | Example |
|------|---------|
| healthy | "You pull at the thread binding you to {name} and feel their mind turning. They stand at a crossroads, weighing paths forward. You could tip the balance — or let them find their own way." |
| moderate | "You reach for {name} through the thinning thread. {pronoun_cap} is deliberating — you sense the weight of choices ahead. Your influence could still sway {pronoun}." |
| strained | "The thread to {name} frays, but holds. Through it you glimpse {pronoun} wrestling with what comes next. You may have enough strength to guide {possessive} hand." |
| critical | "Barely a whisper of connection remains. But through it, you catch {name} at a decision point. One last nudge — if you can manage it." |

Each vignette now conveys: (1) the divine connection mechanic, (2) the agent is deciding, (3) you can intervene or not. The quintessence tier flavors the *reliability* of the connection rather than being a separate narrative.

The sub-header "They weigh their options. You may tip the scales:" becomes redundant and can be removed or reduced to a subtle visual divider.

### Part 2: Retcon Prose Library

A data-driven system that generates a one-liner explaining *why this agent is thinking about this encounter*, composed from encounter metadata.

#### Input Data (all available at `buildCompulsionEvent` time)

| Field | Source | Example |
|-------|--------|---------|
| `encounterType` | EncounterTemplate | `'explore'`, `'duel'`, `'trade'` |
| `reachPrimary` | EncounterTemplate | `'eye'`, `'iron'`, `'gold'` |
| `reachSecondary` | EncounterTemplate | `'stone'`, `'shadow'` |
| `threatRating` | EncounterTemplate | `'easy'`, `'moderate'`, `'deadly'` |
| `locationName` | Graph node | `'The Weathered Span'` |
| `hexDistance` | Computed: agent hex → encounter location hex | `0`, `2`, `5` |
| `remoteAttempt` | EncounterTemplate | `true` / `false` |
| `motivations` | EncounterTemplate | `['courage_prudence', 'loyalty_ambition']` |
| `rewardCategories` | Step 1 rewardPool.categoryWeights | `{ possession: 0.7, condition: 0.3 }` |

#### Architecture: Composable Sentence Fragments

Rather than writing 80+ unique strings (10 types × 8 reaches), build retcon lines from **composable fragments** that slot together:

```
[distance context] + [encounter type verb] + [reach flavor] + [at location]
```

**Distance context** (from hexDistance + remoteAttempt):

| Condition | Fragment pool |
|-----------|--------------|
| distance = 0 | "Right here," / "Nearby," / "Close at hand," |
| distance 1–2 | "Not far off," / "Just beyond the next ridge," / "A short journey away," |
| distance 3–5 | "Some distance away," / "Word has reached them of" / "Rumours have drifted in —" |
| distance 6+ | "Far to the {direction}," / "From distant lands, word of" |
| remoteAttempt = true | "Even from here," / "Without needing to travel," |

**Encounter type verb** (what the agent would *do*):

| encounterType | Fragment pool |
|---------------|--------------|
| explore | "something waits to be uncovered" / "an unknown place calls to them" / "a mystery begs investigation" |
| duel | "a challenge demands an answer" / "someone stands in their way" / "a fight is brewing" |
| trade | "a deal could be struck" / "goods change hands if the price is right" / "a merchant has something they need" |
| steal | "something valuable sits poorly guarded" / "an opportunity for the quick-fingered" |
| assist | "someone needs their help" / "a task awaits willing hands" / "they could make a difference here" |
| build | "something could be raised from nothing" / "raw materials and ambition align" |
| hire | "a capable soul seeks a patron" / "loyalty is for sale — if the coin is right" |
| lead | "others look to them for direction" / "a group needs someone to follow" |
| acquire | "something of value is within reach" / "a prize sits waiting to be claimed" |
| create | "an idea takes shape in their mind" / "the urge to make something stirs" |

**Reach flavor** (optional color — adds texture but not required for comprehension):

| reach | Fragment pool |
|-------|--------------|
| iron | "— it'll take strength to see it through" / "— blood may be the price" |
| gold | "— coin and cunning will decide it" / "— the ledger demands balancing" |
| shadow | "— but nothing is as it seems" / "— secrets cloud the path" |
| veil | "— the old ways are woven into it" / "— something supernatural lingers" |
| heart | "— bonds will be tested" / "— it's personal" |
| eye | "— if they look closely enough" / "— perception is the key" |
| stone | "— the land itself is at stake" / "— what's built here will endure" |
| star | "— fate itself seems to hinge on it" / "— the cost may be more than mortal" |

**Location suffix** (grounds the encounter spatially):

```
"at {locationName}" / "in {locationName}" / "near {locationName}"
```

#### Composition Example

Encounter: `explore` + `eye` + distance 0 + location "The Weathered Span"

> *"Close at hand, a mystery begs investigation — if they look closely enough. At The Weathered Span."*

Encounter: `duel` + `iron` + distance 4 + location "Thornwall Garrison"

> *"Word has reached them of a challenge that demands an answer — it'll take strength to see it through. At Thornwall Garrison."*

Encounter: `trade` + `gold` + distance 0 + remoteAttempt true

> *"Right here, a deal could be struck — coin and cunning will decide it."*

#### Data Flow

```
buildCompulsionEvent()
  │
  ├── For each ScoredCandidate:
  │     ├── template = getAnyEncounterById(templateId)
  │     ├── hexDistance = computeHexDistance(agentHex, locationHex)
  │     ├── retconProse = composeRetconLine(rng, {
  │     │     encounterType: template.encounterType,
  │     │     reach: template.reachPrimary,
  │     │     threatRating: template.threatRating,
  │     │     hexDistance,
  │     │     remoteAttempt: template.remoteAttempt,
  │     │     locationName,
  │     │   })
  │     └── CompulsionCandidate now carries:
  │           + encounterType      (new)
  │           + hexDistance         (new)
  │           + encounterHook → retconProse (replaced)
  │
  └── Vignette: pick from new informative templates
```

### Part 3: CompulsionCandidate Type Changes

```typescript
interface CompulsionCandidate {
  templateId: string;
  encounterName: string;
  encounterHook: string;       // ← now retcon prose, not generic reach hook
  encounterType: EncounterType; // NEW
  reach: ReachDomain;
  sphere: SphereName;
  threatRating: string;
  hexDistance: number;          // NEW — hex steps from agent to encounter
  score: number;
  essenceCost: number;
  locationId: string;
  locationName: string;
}
```

### Part 4: UI Adjustments (PremonitionModal)

Minimal changes — the improved data does the heavy lifting:

1. **Intro vignette**: Swap to new informative templates
2. **Remove sub-header**: "They weigh their options. You may tip the scales:" — redundant now
3. **Option card layout**: Show `encounterHook` (now retcon prose) as the primary text. Move encounter name + mechanical info to secondary line
4. **Distance badge** (optional): Small indicator like "nearby" / "2 hexes away" / "distant"
5. **Encounter type label**: Replace raw reach label with encounter type — "Exploration" is more meaningful than "Eye" to a player

Card layout shift:
```
Current:
  The Gleaming Vein          Eye · Threat easy
  Perception sharpens...              4 essence

Proposed:
  Exploration — easy                  4 essence
  "Close at hand, something waits to be uncovered —
   if they look closely enough. At The Weathered Span."
```

### Part 5: Deduplication

The screenshot shows "The Fallen Star" appearing twice. In `buildCompulsionEvent`, `topCandidates` can contain the same template at different locations. Add a dedup step:

```typescript
// After slicing top N, dedup by templateId (keep highest-scored)
const seen = new Set<string>();
const deduped = candidates.filter(c => {
  if (seen.has(c.entry.templateId)) return false;
  seen.add(c.entry.templateId);
  return true;
});
```

## Implementation Sequence

1. **Add `encounterType` and `hexDistance` to `CompulsionCandidate`** — type change + plumb through `buildCompulsionEvent`
2. **Write `composeRetconLine()`** — new function in `src/data/premonition-content.ts` with the fragment pools
3. **Replace hook generation** in `buildCompulsionEvent` — swap `COMPULSION_ENCOUNTER_HOOKS[reach]` for `composeRetconLine()`
4. **Write new vignette templates** — replace `COMPULSION_VIGNETTE_TEMPLATES` content
5. **Add dedup step** in `buildCompulsionEvent`
6. **Update PremonitionModal UI** — new card layout, remove redundant sub-header
7. **Test** — CLI `spawn encounter-context` to verify retcon lines, visual check in browser

## NFP Compliance

| Priority | NFP | Status |
|----------|-----|--------|
| 1 | Tunability | PASS — all fragment pools are named constants in premonition-content.ts |
| 2 | Inspectability | PASS — retcon prose stored on CompulsionCandidate, visible in traces |
| 3 | Determinism | PASS — seeded RNG selects fragments, same seed = same prose |
| 4 | Fail-soft | PASS — missing data falls back to generic fragment; compose never throws |
| 5 | Narrative > mechanical | PASS — entire point of this change |
| 6 | Additive | PASS — adds fields to CompulsionCandidate, replaces content not structure |
| 7 | Performance | PASS — string concatenation at popup time, negligible cost |

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `DISTANCE_BAND_NEAR` | 0 | Hex distance threshold for "right here" |
| `DISTANCE_BAND_SHORT` | 2 | Hex distance threshold for "not far" |
| `DISTANCE_BAND_MEDIUM` | 5 | Hex distance threshold for "some distance" |
| `RETCON_DISTANCE_FRAGMENTS` | (pool) | Distance context sentence openers |
| `RETCON_ENCOUNTER_TYPE_FRAGMENTS` | (pool) | Encounter type verb phrases |
| `RETCON_REACH_FRAGMENTS` | (pool) | Optional reach color suffixes |

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Unknown encounterType | Use generic "an opportunity presents itself" |
| Unknown reach | Omit reach flavor fragment (sentence still works without it) |
| hexDistance unavailable | Omit distance context, start with encounter type |
| locationName missing | Omit location suffix |
| No candidates after dedup | Return null (same as current empty-candidates path) |
