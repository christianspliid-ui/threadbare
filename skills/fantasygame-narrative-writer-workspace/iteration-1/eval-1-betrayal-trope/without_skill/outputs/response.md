# Adding the Betrayal Trope to The Fantasy World Simulator

## Overview
The betrayal trope you're describing—a trusted advisor who turns on their lord—is actually already partially supported through the game's **disposition system** and **dilemma mechanics**, but it needs orchestration through content data and narrative beat patterns. Let me walk you through the layers.

## 1. The Narrative Lever Stack

The engine has **four distinct layers** that work together to create betrayal narratives:

### Layer 1: Relationship Type (Graph + Disposition)
- **Where**: `src/data/` + world-model.json
- **What**: Relationships are typed edges. You need a `trusts` or `advises` edge type between the lord and advisor.
- **Action**: In world-model.json, ensure both edges exist: lord→ADVISES→advisor AND advisor→TRUSTS←lord (or equivalent).

### Layer 2: Cooperation Strategy (Character Profile)
- **Where**: `src/data/game-theory-content.ts` + `src/engine/disposition.ts`
- **What**: Each archetype has a probability distribution over 5 cooperation strategies (tit-for-tat, grudger, pavlov, always-cooperate, always-defect).
- **Key insight**: A betrayer needs either:
  - `always-defect` with high weight (pure malice from the start), OR
  - `grudger` with high weight + a prior betrayal event (they cooperate initially, then flip when trust breaks)

### Layer 3: Dilemma Detection & Resolution
- **Where**: `src/engine/disposition.ts` (phaseReputationDecay + phaseDilemmaDetection)
- **What**: The system detects when two actors with a history interact and have divergent strategies/reputations. It resolves into one of four outcomes:
  - `mutual_trust` (both cooperate)
  - `betrayed` (one defects after the other cooperated)
  - `exploitation` (one defects, knowing the other will cooperate)
  - `mutual_distrust` (both defect)

**This is where the trope lives.** The "trusted advisor turns on lord" outcome maps to the `betrayed` dilemma outcome.

### Layer 4: Narrative Prose (Archetype Beat Patterns + Templates)
- **Where**: `src/data/narrative-content.ts` (templates) + `src/data/archetype-content.ts` (beat patterns)
- **What**: Templates for each dilemma outcome. Current template for `dilemma_betrayed`:
  ```
  '{actor} reached out to {target} with {adj} purpose, only to find {noun} instead of faith.'
  'A wound that would not heal — {actor} {verb} with trust, but {target} offered only {noun}.'
  'The {adj} sting of betrayal settled upon {actor}. {target} had chosen {noun} over the bond.'
  ```
- **Action**: You can enrich these with archetype-specific flavor by adding a new beat pattern to the advisor's archetype that specifically triggers on `dilemma_betrayed` events.

---

## 2. How to Build "Wormtongue" Betrayal

### Step 1: Choose the Advisor Archetype
The classic betrayer archetypes already exist:
- **`schemer`** — "Webs of manipulation, delayed payoffs" — This is your Wormtongue. High `always-defect` weight (see game-theory-content.ts line 305-311). Story shape = "Patient manipulation, betrayal payoff." Reach affinities include `shadow`, `gold`, `heart`.
- **`poisoned_court`** — "Hidden corruption, elegant destruction" — If you want court intrigue
- **`trickster`** — High defection bias, but too quick; less fitting for slow-burn betrayal

Go with **`schemer`**. They fit perfectly.

### Step 2: Set Up the Relationship Chain
In world-model.json, create edges:
```json
{
  "from": "lord_actor_id",
  "to": "advisor_actor_id",
  "type": "trusts",
  "properties": { "strength": "high", "duration": "long" }
},
{
  "from": "advisor_actor_id",
  "to": "lord_actor_id",
  "type": "advises",
  "properties": { "influence": "significant" }
}
```

Ensure both actors are in the world graph.

### Step 3: Force the Dilemma Through Disposition History
The game detects betrayal when:
1. Two actors have a history (InteractionRecord[] exists in the graph)
2. They interact again
3. One has `grudger` or `always-defect`, the other has `always-cooperate` or `tit-for-tat`
4. The disposition engine evaluates the next move and finds a mismatch

**To guarantee a slow-burn betrayal arc:**
- Seed the advisor with `always-defect` strategy (hidden from the lord)
- Seed the lord with `always-cooperate` or `tit-for-tat`
- Orchestrate several early interactions where the advisor cooperates (faking loyalty)
- Then have a high-stakes interaction where the advisor defects

The disposition engine will log these in InteractionRecord and emit a `dilemma_betrayed` event.

### Step 4: Write Betrayal Beat Patterns for the Schemer Archetype
Modify `src/data/archetype-content.ts`, in the **schemer** archetype definition, add a new beat pattern (or enhance the existing one):

```typescript
{
  eventTypes: ['dilemma_betrayed'],  // NEW: triggers specifically on betrayal
  minimumTier: 'routine',
  promoteTo: 'notable',  // Betrayal is always story-worthy
  narrativeRequirements: [
    {
      category: 'character',
      tags: ['lord', 'victim', 'once-trusted'],
      required: true,
      culturallyShape: true,
    },
    {
      category: 'artifact',
      tags: ['secret document', 'poison', 'hidden leverage'],
      required: false,
      culturallyShape: false,
    },
  ],
  contextPreferences: [
    'years in planning',
    'revealed in a moment of weakness',
    'using the lord\'s own trust as the weapon',
    'when the lord least expects it'
  ],
}
```

### Step 5: Enrich Betrayal Templates in narrative-content.ts
The existing `dilemma_betrayed` templates are generic. Add schemer-specific variants:

In `src/data/narrative-content.ts`, find the `dilemma_betrayed` template array and append:

```typescript
dilemma_betrayed: [
  // Existing templates...

  // Schemer-specific betrayal (slow-burn, manipulative)
  '{actor} had positioned every piece for years, waiting for the moment when {target}\'s faith would be indistinguishable from blindness. That moment arrived like dawn—inevitable, irreversible.',
  '{target} had called {actor} counselor and friend. {actor} had merely called this patience. The mask came off, and {target} finally saw the {adj} mind beneath.',
  'All those gentle whispers, those loyal words—they were just another tool in {actor}\'s hands, as precisely placed as a poisoner\'s dose. {target} had never stood a chance.',
]
```

### Step 6: Add Narrative Requirements to Support Betrayal
In the schemer's `narrativeRequirements` array, ensure:
```typescript
{
  category: 'character',
  tags: ['mark', 'lord', 'victim', 'once-trusted'],
  required: true,
  culturallyShape: true,
}
```

This ensures that when a schemer character is created, they have a "mark" (lord) character to betray.

---

## 3. The "Buildup and Shock" Pacing

The engine naturally creates this through:

### Phase 1: Trust (Ticks 0-N)
- Multiple early interactions where advisor + lord cooperate (DilemmaOutcome = `mutual_trust`)
- Prose: "The counselor's wisdom guided the realm. The bond was unshakeable."
- Engine logic: `evaluateStrategy('always-defect', history)` returns -1 (defect), but context/stakes favor cooperation initially

### Phase 2: Tension (Ticks N-M)
- A contested action where stakes rise (DILEMMA_STAKES_THRESHOLD triggered)
- Advisor still appears loyal, but game-theory weights shift
- Prose starts hinting: "The counselor's advice grew colder, more calculating."

### Phase 3: The Turn (Tick M)
- High-stakes dilemma detected
- Advisor defects: `evaluateStrategy('always-defect', history)` returns -1
- DilemmaOutcome = `betrayed`
- Narrative event fires: "The counselor struck, and {lord} fell from grace."

### Phase 4: Aftermath (Ticks M+)
- Reputation cascades: lord's reputation drops (advisor betrayed them)
- Advisor's reputation may rise (they achieved their goal)
- Secondary characters react to the betrayal
- Prose tone shifts: grief, shock, recalibration

**To orchestrate this timing:**
- Control when the high-stakes interaction fires using `phaseDilemmaDetection` and mandate timers
- Use `DILEMMA_STAKES_THRESHOLD` constants (in disposition.ts) to force a dilemma on tick N
- Seed initial InteractionRecords to pre-populate early "loyalty" interactions

---

## 4. Content Data Files to Create/Modify

| File | What to change | Why |
|------|----------------|-----|
| `src/data/world-model.json` | Add lord + advisor actors, trusts/advises edges | Relationship foundation |
| `src/data/archetype-content.ts` | Add `dilemma_betrayed` beat pattern to **schemer** archetype | Betrayal-specific narrative rules |
| `src/data/narrative-content.ts` | Enhance `dilemma_betrayed` template array with schemer variants | Prose specificity |
| `src/data/game-theory-content.ts` | Ensure **schemer** has high `always-defect` weight | Behavior alignment (already done: 0.45 weight) |
| `src/engine/disposition.ts` | (Optional) Add logging/traces for betrayal detection | Debug + flavor |
| `src/types/disposition.ts` | (Optional) Add `betrayal_plot_stage` field to DilemmaEvent | Track multi-tick arc |

---

## 5. Key Lever Insights

### Why This Works
1. **Disposition system** handles the game theory (when to defect)
2. **Dilemma detection** identifies the moment of betrayal
3. **Beat patterns** gate which archetype-specific prose triggers
4. **Templates** provide the actual language
5. **Narrative context builder** ranks supporting actors (witnesses, allies) for inclusion in prose

### What the Player Feels
- **Ticks 0-30**: Trust deepens, advisor seems loyal
- **Tick 30-40**: Tension builds, stakes rise, advisor grows quiet
- **Tick 45**: DILEMMA_BETRAYAL detected
- **Tick 46**: Chronicle entry: "The counselor turned. The lord fell."
- **Aftermath**: The world reacts; rival gods sense weakness; mandates shift

### Tuning Knobs
- `DILEMMA_STAKES_THRESHOLD` (types/disposition.ts) — how high must stakes go to trigger a betrayal dilemma?
- `REPUTATION_UPDATE_DEFECT` — how much does betrayal damage trust?
- `STAKES_DOMAIN_GOLD`, `STAKES_FACTION_LEADER` — which domain/role triggers a betrayal?
- Archetype strategy weights in game-theory-content.ts — pure defection probability
- Interaction log cap (INTERACTION_LOG_CAP) — how many past interactions does the system remember?

---

## 6. Example: Step-by-Step Content Additions

### A. Modify archetype-content.ts (schemer archetype)

Find the schemer definition (~line 316-356) and add this beat pattern to the `beatPatterns` array:

```typescript
{
  eventTypes: ['dilemma_betrayed'],
  minimumTier: 'routine',
  promoteTo: 'notable',
  narrativeRequirements: [
    {
      category: 'character',
      tags: ['lord', 'victim', 'once-trusted'],
      required: true,
      culturallyShape: true,
    },
    {
      category: 'artifact',
      tags: ['secret leverage', 'hidden document', 'poison'],
      required: false,
      culturallyShape: false,
    },
  ],
  contextPreferences: [
    'after years of positioning',
    'when the victim is most vulnerable',
    'using trust itself as the weapon',
    'a perfectly timed strike',
  ],
}
```

### B. Modify narrative-content.ts (dilemma_betrayed templates)

Find the `ROUTINE_TEMPLATES` and `NOTABLE_TEMPLATES` sections. In the `dilemma_betrayed` array, add:

```typescript
'Years of whispered advice, each word a stone in a careful foundation. {actor} had built a palace of the {lord}\'s trust, brick by {adj} brick, only to light it afire when the moment came.',
'{target} believed they had an advisor. They had a {noun} waiting to strike. {actor}\'s {adj} patience had rewarded them perfectly.',
'The counselor turned, and in that turn, {target}\'s entire world inverted. Everything that had seemed {adj} was {noun}. Every kindness was a blade.',
```

### C. Modify game-theory-content.ts (if needed)

Check the schemer strategy weights (currently around line 305). It should have:

```typescript
schemer: {
  'tit-for-tat': 0.1,
  grudger: 0.1,
  pavlov: 0.25,
  'always-cooperate': 0.1,
  'always-defect': 0.45,  // <-- High defection probability
}
```

If the always-defect weight is lower, raise it.

---

## Summary

**To add betrayal to your game:**

1. **Use the schemer archetype** (already tuned for manipulation)
2. **Create lord + advisor relationship edges** in world-model.json
3. **Add a dilemma_betrayed beat pattern** to archetype-content.ts (schemer)
4. **Enrich dilemma_betrayed templates** in narrative-content.ts with slow-burn, manipulative prose
5. **Let the disposition engine do the work** — it detects mismatched strategies and emits DilemmaEvent
6. **Tune DILEMMA_STAKES_THRESHOLD** to control when the betrayal fires

The "buildup and shock" emerges naturally from the disposition system's game-theory logic, combined with the narrative context builder's ability to surface the victim and their loss. The player sees the advisor's cooperation early, then the sudden defection hits like Wormtongue whispering poison in the king's ear.
