# Designing the Corruption Doom Archetype

## Summary

To add a new doom archetype called **'corruption'** to the Fantasy World Simulator, you'll need to touch **three interconnected files** in a specific order:

1. **`src/types/doomClock.ts`** — Register 'corruption' as a valid archetype
2. **`src/data/doom-content.ts`** — Define the 5-stage thematic names
3. **`src/data/narrative-content.ts`** — Author templates for corruption prose at each stage

The narrative engine will automatically wire everything together through the orchestrator's event→prose pipeline.

---

## File 1: `src/types/doomClock.ts`

### What to change:
Add `'corruption'` to the `DoomClockArchetype` union type and to the `DOOM_CLOCK_ARCHETYPES` array.

### Current code:
```typescript
export type DoomClockArchetype =
  | 'breach'       // outside force breaking through reality
  | 'convergence'  // all forces drawn to a single point
  | 'changing'     // new cosmic order replacing the old
  | 'sundering'    // world itself breaking apart
  | 'failing'      // core force of creation weakening
  | 'ascension'    // something approaching godhood
  | 'reckoning';   // past debts coming due

export const DOOM_CLOCK_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering',
  'failing', 'ascension', 'reckoning',
];
```

### Updated code:
```typescript
export type DoomClockArchetype =
  | 'breach'       // outside force breaking through reality
  | 'convergence'  // all forces drawn to a single point
  | 'changing'     // new cosmic order replacing the old
  | 'sundering'    // world itself breaking apart
  | 'failing'      // core force of creation weakening
  | 'ascension'    // something approaching godhood
  | 'reckoning'    // past debts coming due
  | 'corruption';  // slow rot from within, like Númenor's decline or Shadow in Mirkwood

export const DOOM_CLOCK_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering',
  'failing', 'ascension', 'reckoning', 'corruption',
];
```

**Why:** This tells TypeScript that 'corruption' is a legitimate archetype option. Without this, the other files will report type errors when you try to reference it.

---

## File 2: `src/data/doom-content.ts`

### What to change:
Add a corruption entry to `ARCHETYPE_STAGE_NAMES` with five thematic stage names.

### Current code:
```typescript
export const ARCHETYPE_STAGE_NAMES: Record<DoomClockArchetype, [string, string, string, string, string]> = {
  breach:       ['Strange Whispers', 'Reality Cracks', 'The Thinning', 'Barriers Fail', 'The Breach'],
  convergence:  ['Distant Pull', 'Gathering Forces', 'The Drawing', 'Convergence Point', 'The Singularity'],
  changing:     ['Old Winds Die', 'New Powers Stir', 'The Turning', 'Power Shifts', 'The New Order'],
  sundering:    ['Hairline Fractures', 'Tremors', 'The Splitting', 'Lands Drift', 'The Sundering'],
  failing:      ['Waning Light', 'Creeping Entropy', 'The Dimming', 'Collapse Begins', 'The Failing'],
  ascension:    ['Mortal Spark', 'Growing Power', 'Threshold Nears', 'Divine Trial', 'The Ascension'],
  reckoning:    ['Old Debts Surface', 'Witnesses Gather', 'The Accounting', 'Judgment Begins', 'The Reckoning'],
};
```

### Updated code:
```typescript
export const ARCHETYPE_STAGE_NAMES: Record<DoomClockArchetype, [string, string, string, string, string]> = {
  breach:       ['Strange Whispers', 'Reality Cracks', 'The Thinning', 'Barriers Fail', 'The Breach'],
  convergence:  ['Distant Pull', 'Gathering Forces', 'The Drawing', 'Convergence Point', 'The Singularity'],
  changing:     ['Old Winds Die', 'New Powers Stir', 'The Turning', 'Power Shifts', 'The New Order'],
  sundering:    ['Hairline Fractures', 'Tremors', 'The Splitting', 'Lands Drift', 'The Sundering'],
  failing:      ['Waning Light', 'Creeping Entropy', 'The Dimming', 'Collapse Begins', 'The Failing'],
  ascension:    ['Mortal Spark', 'Growing Power', 'Threshold Nears', 'Divine Trial', 'The Ascension'],
  reckoning:    ['Old Debts Surface', 'Witnesses Gather', 'The Accounting', 'Judgment Begins', 'The Reckoning'],
  corruption:   ['First Stain', 'Creeping Rot', 'Rot Deepens', 'Festering Wounds', 'The Corruption'],
};
```

### Rationale:

These five stages mirror the corruption journey as inspired by Númenor's fall and the Shadow's spread:

- **Stage 1: "First Stain"** — The initial whisper of corruption. A small compromise. The first thread of rot threading through what was once pristine.
- **Stage 2: "Creeping Rot"** — Corruption gains ground. What was hidden begins to show; virtue dims. Like the early phases of Númenor's decline or the first Shadow creeping into Mirkwood.
- **Stage 3: "Rot Deepens"** — Corruption has taken root. Institutions crumble. The fabric of trust and order decays faster now. No turning back.
- **Stage 4: "Festering Wounds"** — Open sores. Corruption is undeniable and spreads faster than it can be healed. The world reeks of decay.
- **Stage 5: "The Corruption"** — Complete. The old order is gone. What was once noble is now hollow, corrupted at the core. The world has been remade in rot.

These names avoid sudden cataclysm language (unlike 'breach' or 'singularity'). Instead, they use organic, biological metaphors: stain, rot, wounds, festering. This matches the thematic tone of slow decline.

---

## File 3: `src/data/narrative-content.ts`

### What to change:
Add corruption-specific prose templates to the `ROUTINE_TEMPLATES` and `NOTABLE_TEMPLATES` objects under the `doom_escalation` key.

### Context:

The narrative engine uses layered prose tiers:

- **Routine tier** (simple templates): Used for high-frequency events. These are short and efficient.
- **Notable tier** (enhanced templates): Used for significant events. Include personality conditionals and more complex phrasing.
- **Chronicle tier** (LLM-generated): For major narrative moments. Fed to an LLM for fully authored prose.

Doom escalation events go directly to **Chronicle tier** (line 189 of `narrative.ts` assigns `doom_escalation: 'chronicle'`), which means the engine:
1. Takes the `doom_escalation` type
2. Selects a random template from the routine templates
3. Substitutes sphere-colored adjectives/verbs/nouns
4. Feeds that to an LLM prompt builder for full prose

### Current code (relevant excerpt from narrative-content.ts):

```typescript
export const ROUTINE_TEMPLATES: Record<NarrativeEventType, string[]> = {
  // ... other types ...
  doom_escalation: [
    'The world {verb}. {adj} {noun} spreads across the land.',
  ],
  // ... other types ...
};

export const NOTABLE_TEMPLATES: Record<NarrativeEventType, string[]> = {
  // ... other types ...
  doom_escalation: [
    'The world shudders. Across {target}, {adj} {noun} seeps through the cracks of reality{personality}. Those with eyes to see recognize the signs — the {noun} draws closer.',
    'A tremor passes through the fabric of existence. In {target}, {adj} portents multiply — {noun} gathering like stormclouds on the horizon.',
  ],
  // ... other types ...
};
```

### Updated code:

Replace the single-entry `doom_escalation` array in `ROUTINE_TEMPLATES` and expand `NOTABLE_TEMPLATES`:

```typescript
export const ROUTINE_TEMPLATES: Record<NarrativeEventType, string[]> = {
  // ... other types ...
  doom_escalation: [
    'The world {verb}. {adj} {noun} spreads across the land.',
    'In {target}, {adj} {noun} blooms where it has no right to grow.',
    '{noun} takes hold. The {adj} work of ages crumbles from within.',
  ],
  // ... other types ...
};

export const NOTABLE_TEMPLATES: Record<NarrativeEventType, string[]> = {
  // ... other types ...
  doom_escalation: [
    'The world shudders. Across {target}, {adj} {noun} seeps through the cracks of reality{personality}. Those with eyes to see recognize the signs — the {noun} draws closer.',
    'A tremor passes through the fabric of existence. In {target}, {adj} portents multiply — {noun} gathering like stormclouds on the horizon.',
    // --- CORRUPTION-SPECIFIC TEMPLATES ---
    'In {target}, something {adj} takes root. What was once clean now bears the mark of {noun} — slow, patient, irreversible{personality}. The rot spreads from the inside.',
    'The {adj} work of ages begins to fray. In {target}, small betrayals compound{personality}. {noun} is not a sudden wound but a slow unraveling, and no one knows how to stop it.',
    'A sickness spreads through {target}{personality}. Not swift like plague, but deep like poison seeping through stone — {adj} {noun} corrupting all it touches, one breath, one choice, one compromise at a time.',
    '{actor}{personality} notices the first signs in {target}: small things failing, trust fraying, {adj} {noun} where there was once virtue. By the time anyone speaks of it aloud, the rot has gone too far to halt.',
  ],
  // ... other types ...
};
```

### Rationale:

**Routine templates** (2 new):
- `'In {target}, {adj} {noun} blooms where it has no right to grow.'` — Uses natural imagery (blooms) to suggest something organic/biological corrupting clean ground.
- `'{noun} takes hold. The {adj} work of ages crumbles from within.'` — Emphasizes internal collapse vs. external force.

**Notable templates** (4 new, corruption-focused):

1. **"In {target}, something {adj} takes root..."** — Organic metaphor (roots, rot spreads from inside). Emphasizes slowness and inevitability.

2. **"The {adj} work of ages begins to fray..."** — "Fray" captures gradual unraveling. Mentions "small betrayals compound" — psychological dimension of corruption (losing faith in institutions). "Slow unraveling" vs. cataclysm.

3. **"A sickness spreads through {target}{personality}..."** — Medical metaphor (poison, sickness). "Not swift like plague, but deep like poison seeping" contrasts with other archetypes' urgency. Emphasizes choice/compromise ("one choice...at a time").

4. **"{actor}{personality} notices the first signs..."** — Grounds corruption in perception. The rot is already far advanced before anyone admits it. This matches historical corruption (Númenor's decline was not sudden; it was slow policy failures that nobody named until too late).

---

## How It All Wires Together

When the doom clock ticks and crosses a stage boundary:

1. **Orchestrator detects stage transition** (`orchestrator.ts` → `phaseDoomClock`)
   - Creates a `TickEvent` with `type: 'doom_escalation'`

2. **Event is mapped to NarrativeEventType** (`tickEventTypeToNarrativeType`)
   - `'doom_escalation'` → `NarrativeEventType.doom_escalation`

3. **Narrative engine is called** (`orchestrator.ts` → `phaseNarrative`)
   - Builds `NarrativeContext` (world-aware ranking of relevant actors/locations)
   - Converts `TickEvent` to `NarrativeEvent`
   - Calls prose generator

4. **Prose generation pipeline** (`narrative.ts` → `generateChronicleProseWithContext`)
   - Selects a random template from `NOTABLE_TEMPLATES['doom_escalation']`
   - Substitutes `{actor}`, `{target}`, `{personality}`
   - Picks sphere-colored `{adj}`, `{verb}`, `{noun}` from `SPHERE_VOCABULARY`
   - Feeds the seeded template to an LLM prompt for final prose generation

5. **Chronicle entry is logged**
   - "Stage 1: First Stain — [full prose with world context]"

---

## Testing Checklist

After adding the corruption archetype, verify:

1. **Type safety**: `npm run build` should pass with no type errors. The 'corruption' archetype should be recognized everywhere it's referenced.

2. **Doom clock generation**:
   - Call `generateDoomClock('corruption', 100, 42)`
   - Verify 5 stages exist with names: "First Stain", "Creeping Rot", "Rot Deepens", "Festering Wounds", "The Corruption"

3. **Prose generation**:
   - Manually seed a world with `doomArchetype: 'corruption'`
   - Advance the doom clock past each stage threshold
   - Verify the chronicle log contains corruption-themed prose at each stage
   - Check that sphere words are being substituted (e.g., if world-soul has high Shadow, you should see Shadow vocabulary mixed in)

4. **UI display**: The DoomBar component should display the corruption stage names as the player progresses.

---

## Design Notes

### Why these stage names?

**Corruption** differs thematically from the other six archetypes:

- **Breach, Convergence, Sundering, Failing** → External or cosmic forces overwhelming the world
- **Changing, Ascension, Reckoning** → Transformation or judgment (neutral or positive framing possible)
- **Corruption** → Internal decay. Not a war or a cosmic shift, but a slow moral/physical collapse

The stage names emphasize:
- **Biological/organic metaphors** (stain, rot, festering) vs. cosmic language (breach, singularity)
- **Inevitability and patience** — this doom doesn't strike like lightning; it spreads like disease
- **Loss of innocence** — corruption is always a fall from grace, a slide from order to chaos
- **Invisibility** — by the time the rot is visible, it's already deep

This mirrors:
- **Númenor's fall** — Not a sudden cataclysm, but slow political/moral compromise that hollow out the kingdom from within
- **The Shadow in Mirkwood** — Spreading gradually, corrupting the natural world, driving out light and life

### Sphere interaction

The templates use `{adj}`, `{verb}`, `{noun}` placeholders that get filled with sphere-colored vocabulary. This means:

- A corruption doom influenced by **Force** will feel aggressive/violent: "sharp rot," "tears," "shatters"
- A corruption doom influenced by **Entropy** will feel inevitable/decay: "crumbling rot," "fades," "unraveling"
- A corruption doom influenced by **Spirit** will feel hollow/betrayal: "withering rot," "drains," "emptiness"
- A corruption doom influenced by **Darkness** will feel oppressive: "creeping rot," "smothers," "shadow"

The same template (`'In {target}, {adj} {noun} blooms where it has no right to grow.'`) produces radically different prose flavors depending on the world's sphere alignment. This is by design — content generation within constraints.

---

## Optional Enhancements (Future Work)

Once the basic archetype is working, consider:

1. **Corruption-specific mandate templates** in `src/data/mandate-content.ts`
   - E.g., "Preserve the {location} from corruption" or "Find the source of the rot"

2. **Corruption mechanics** in `src/engine/` (beyond prose)
   - When corruption reaches certain stages, introduce mechanical effects (e.g., actor's values shift, bonds weaken, traits fade)
   - This would require new code in `agentActions.ts` or a new phase in the orchestrator

3. **Rival god generation** incorporating corruption
   - In `src/engine/rivalGenerator.ts`, add rival types aligned with corruption (e.g., the Silent Rot, The Unmaking, The Hollow)

4. **Unmaking phase** tweaks for corruption
   - The corruption doom might have a unique "Twilight Phase" (the final 5-10 ticks where the player can still intervene)
   - See `src/engine/twilightPhase.ts`

---

## Summary Checklist

To add the **corruption** doom archetype:

- [x] Add `'corruption'` type and constant to `src/types/doomClock.ts`
- [x] Add stage names to `ARCHETYPE_STAGE_NAMES` in `src/data/doom-content.ts`
- [x] Add routine + notable templates to `src/data/narrative-content.ts`
- [ ] Run `npm run build` and `npm test` to verify
- [ ] Manually test with a seeded world using `doomArchetype: 'corruption'`
- [ ] (Optional) Add corruption-specific mandates, mechanics, or rival types

That's all the narrative engine needs to start generating thematically-appropriate corruption prose at each stage!
