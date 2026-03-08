# Corruption Doom Archetype — Implementation Guide

## Executive Summary

You're designing a slow-rot doom archetype where the world decays from within—a concept rooted in creeping corruption rather than catastrophic collapse. The system architecture is well-suited for this: you need to touch **5 primary locations** in the codebase to implement the corruption archetype fully.

---

## What Needs to Change

### 1. **Type Definition** — `/src/types/doomClock.ts`
Add 'corruption' to the `DoomClockArchetype` union type and the `DOOM_CLOCK_ARCHETYPES` array.

**Current state:**
```typescript
export type DoomClockArchetype =
  | 'breach'       // outside force breaking through reality
  | 'convergence'  // all forces drawn to a single point
  | 'changing'     // new cosmic order replacing the old
  | 'sundering'    // world itself breaking apart
  | 'failing'      // core force of creation weakening
  | 'ascension'    // something approaching godhood
  | 'reckoning';   // past debts coming due
```

**After adding corruption:**
```typescript
export type DoomClockArchetype =
  | 'breach'
  | 'convergence'
  | 'changing'
  | 'sundering'
  | 'failing'
  | 'ascension'
  | 'reckoning'
  | 'corruption';  // world slowly rots from within
```

The array needs the same update:
```typescript
export const DOOM_CLOCK_ARCHETYPES: DoomClockArchetype[] = [
  'breach', 'convergence', 'changing', 'sundering',
  'failing', 'ascension', 'reckoning', 'corruption',
];
```

---

### 2. **Stage Names** — `/src/data/doom-content.ts`
Add corruption's 5 stage names to `ARCHETYPE_STAGE_NAMES`.

This is the content-manager file where you define how your archetype progresses narratively. You need 5 evocative stage names that feel like a slow corruption spreading.

**Recommended stage names for corruption** (based on the decay-from-within concept):

```typescript
corruption:  ['Subtle Blight', 'Spreading Decay', 'Rotting Bonds', 'Flesh Falls Away', 'The Consumed World'],
```

**Alternative names** (more thematic variations):
- `['First Bloom', 'The Contagion Spreads', 'Tissue Breaks', 'Nothing Remains Whole', 'Only Rot Remains']`
- `['Whispers of Rot', 'Creeping Plague', 'The Withering', 'All Things Come Undone', 'The Hollow World']`
- `['Spots Appear', 'Infection Deepens', 'The Unraveling', 'Structures Crumble', 'Void Beneath Skin']`

**Why these work:**
- Stage 1 is quiet and subtle (like Númenor's slow decline)
- Stages 2-3 escalate the spread (the infection becomes visible)
- Stage 4 is the point of no return (flesh = structure = social bonds breaking)
- Stage 5 is completion (the hollow world, echoing your Mirkwood inspiration)

Once you decide on the names, add them to `ARCHETYPE_STAGE_NAMES` in the doom-content.ts file.

---

### 3. **Narrative Templates** — `/src/data/narrative-content.ts`

The narrative engine already has **doom_escalation** templates in both `ROUTINE_TEMPLATES` (Tier 1) and `NOTABLE_TEMPLATES` (Tier 2).

**Current routine template:**
```typescript
doom_escalation: [
  'The world {verb}. {adj} {noun} spreads across the land.',
],
```

**Current notable template:**
```typescript
doom_escalation: [
  'The world shudders. Across {target}, {adj} {noun} seeps through the cracks of reality{personality}. Those with eyes to see recognize the signs — the {noun} draws closer.',
  'A tremor passes through the fabric of existence. In {target}, {adj} portents multiply — {noun} gathering like stormclouds on the horizon.',
],
```

**You have two options:**

#### Option A: Use Shared Templates (Simpler)
If corruption uses similar prose structure to other archetypes, you can rely on the existing `doom_escalation` templates. The sphere-specific words (verbs, adjectives, nouns) from `SPHERE_VOCABULARY` will automatically flavor the prose for corruption-relevant spheres (Entropy, Time, Matter).

The engine calls `generateRoutineProse()` and `generateNotableProse()` with the event type set to 'doom_escalation'. The sphere context determines which word bank is used. **This works fine if corruption doesn't need special prose language.**

#### Option B: Add Corruption-Specific Prose (More Immersive)
If you want **distinctive narrative voice for corruption escalation**, you would add dedicated templates.

**Proposed corruption-specific routine template:**
```typescript
doom_escalation_corruption: [
  'The {noun} spreads. Where {actor} once stood, only {adj} decay remains.',
  '{actor} feels it too — the slow erosion of {noun} from within, {adj} and undeniable.',
  'The ground beneath {target} weakens. Cracks show {adj} rot spreading underneath.',
  'What once was whole now {verb}. The {noun} of corruption is patient, {adj}, inevitable.',
],
```

**Proposed corruption-specific notable template:**
```typescript
doom_escalation_corruption: [
  'The corruption deepens across {target}{personality}. From within the soil and bone, {adj} {noun} spreads, patient as rot in fruit. Those who taste the air know {noun} now flavors everything.',
  '{actor} watches in horror as {adj} corruption claims {target}{personality}. Not with fury but with slow, inexorable {noun} — the gentle decay of all things once whole. The {noun} will not be rushed.',
],
```

**How the narrative engine finds these:**
In `src/engine/narrative.ts`, the `generateRoutineProse()` and `generateNotableProse()` functions look up templates by `eventType`. If you want corruption-specific prose, you'd change the lookup logic or pass a different event type for corruption escalations.

**Important caveat:** Currently the system doesn't differentiate prose by archetype—only by event type. To make corruption have distinctive prose, you'd either:
1. Add a new `eventType` like 'doom_escalation_corruption' and wire that into the orchestrator when doom archetype is corruption
2. Add archetype context to the narrative generation function and conditionally select templates

The simpler approach (Option A) reuses existing templates, which is fine and faster to implement.

---

### 4. **Orchestrator Wiring** — `/src/engine/orchestrator.ts`

The orchestrator's `phaseDoomEscalation` function already fires a `TickEvent` whenever the doom stage transitions:

```typescript
if (newStage > state.doomClock.currentStage) {
  events.push({
    id: `doom_escalation_${newStage}`,
    type: 'doom_escalation',
    significance: 0.95,  // Critical narrative moment
    message: `Doom has escalated to stage ${newStage}`,
    tick: state.tick,
    sphere: ???,  // Currently unclear how sphere is chosen
  });
}
```

**What needs to happen:**
When the doom archetype is 'corruption', you may want to:
1. **Adjust doom acceleration rules** — Corruption might accelerate slower (patient decay) or faster (cascading collapse) than other archetypes
2. **Set sphere context** — The orchestrator should favor Entropy, Time, and Matter spheres when generating prose for corruption escalation
3. **Optionally differentiate prose** — If you chose Option B above, pass a different event type like 'doom_escalation_corruption'

The orchestrator has a reference to `state.doomClock.definitionArchetype`, so you can branch on it:

```typescript
if (newStage > state.doomClock.currentStage) {
  const archetype = state.doomClock.definitionArchetype;
  const sphere = archetype === 'corruption' ? 'entropy' : pickRandomSphere();

  events.push({
    id: `doom_escalation_${newStage}`,
    type: archetype === 'corruption' ? 'doom_escalation_corruption' : 'doom_escalation',
    significance: 0.95,
    message: `Doom has escalated to stage ${newStage}`,
    tick: state.tick,
    sphere,
  });
}
```

---

### 5. **Corruption Archetype Asset Package** — `/Assets/doom/the-corruption/`

Create a complete asset package mirroring the structure of existing archetypes (e.g., `the-reckoning-package.md`).

**Directory structure to create:**
```
Assets/doom/the-corruption/
├── the-corruption-package.md          # Complete specification (see template below)
└── (future images once integrated)
    ├── the-corruption-concept.png     # 16:9 panoramic world view
    └── the-corruption-hex.png         # 1:1 hex overlay effect
```

---

## Implementation Checklist

### Immediate (Required for Compilation & Basic Function)

- [ ] **Add 'corruption' to DoomClockArchetype union type** in `/src/types/doomClock.ts`
- [ ] **Add 'corruption' to DOOM_CLOCK_ARCHETYPES array** in `/src/types/doomClock.ts`
- [ ] **Add corruption stage names to ARCHETYPE_STAGE_NAMES** in `/src/data/doom-content.ts`
  - Suggested: `['Subtle Blight', 'Spreading Decay', 'Rotting Bonds', 'Flesh Falls Away', 'The Consumed World']`
- [ ] **Update doom-content.test.ts** to expect 8 archetypes (currently checks for 7)
  ```typescript
  expect(Object.keys(ARCHETYPE_STAGE_NAMES)).toHaveLength(8); // was 7
  ```

### Phase 1: Narrative Voice (Recommended)

- [ ] **Add corruption-specific narrative templates** to `/src/data/narrative-content.ts`
  - Add `doom_escalation_corruption` entries to both `ROUTINE_TEMPLATES` and `NOTABLE_TEMPLATES`
  - Favor Entropy, Time, Matter vocabulary when picking sphere words
- [ ] **Add sphere context to orchestrator** in `/src/engine/orchestrator.ts`
  - When archetype is 'corruption', set `sphere: 'entropy'` (or cycle through entropy/time/matter)
  - If using Option B, pass `type: 'doom_escalation_corruption'` for corruption-specific prose

### Phase 2: Mechanical Flavor (Optional)

- [ ] **Adjust doom acceleration constants** if corruption should escalate differently
  - Currently each archetype uses same thresholds (0.20, 0.40, 0.60, 0.80, 1.0)
  - Could add `ARCHETYPE_THRESHOLDS` mapping for per-archetype customization
  - Corruption might use slower early stages, faster late stages (creep → cascade)
- [ ] **Add terrain transformation effects** specific to corruption
  - Track "corruption %" on terrain hexes
  - Visually show spreading blight, withering flora, structural decay

### Phase 3: Asset & Design Package (Reference & Future)

- [ ] **Create `/Assets/doom/the-corruption/the-corruption-package.md`**
  - Use the template provided below
  - Define trigger spheres, acceleration rules, twilight phase effects
  - Write narrative vocabulary for art prompts and flavor text

---

## Template: The Corruption Asset Package

Use this structure as a starting point for `/Assets/doom/the-corruption/the-corruption-package.md`:

```markdown
# The Corruption — Doom Archetype Package

## Lore Text

The world does not end in fire or sword. It rots.

A creeping plague spreads through the land—not a disease of flesh, but of *being*. The very essence of the world begins to decay, slowly, inexorably. Soil blackens and becomes dust. Stone weakens, cracks form where none should exist. The bonds between souls fray and snap. Madness spreads not as a contagion but as a gentle unraveling—sanity dissolving like fruit left in the sun.

It is the slow decline of Númenor, the spreading of the Shadow into Mirkwood, the patient corruption of all things precious. There is no moment of crisis—only the steady realization that everything beloved is becoming hollow. The world doesn't fight back. It simply... fails. Structures crumble, not in moments of glory, but with quiet inevitability. Animals flee or fall still. The living find their strength waning. The very will to resist erodes.

By the end, nothing remains whole. All that was solid has become brittle. All that was bright has dimmed. The world is not destroyed—it is *consumed*, from within, by the slow corruption that no amount of heroism could have stopped.

## Concept Art
`the-corruption-concept.png` — 16:9 panoramic. ⏳ Not yet generated.

**Prompt description:** Dark oil painting of a world in slow decay. A once-vibrant fantasy landscape showing progressive stages of corruption and rot. The foreground shows lush land already blackened and crumbling to dust. The midground transitions—trees are gnarled and bare, stone structures show spreading decay like diseased flesh, the ground cracks show deep shadow beneath. The background shows the corruption spreading further, swallowing distant mountains and forests. The sky is darkened by spores or ash—not a storm, but a slow veil descending. Color palette: blacks, deep browns, sickly yellows, greys, with only faint traces of the original colors of the land (a hint of green where it once was), slowly being consumed. Lighting is dim, naturalistic, as if viewed through dusty air. The corruption has no edges—it bleeds into healthy land like stains spreading through cloth. Foreground details: vegetation withering, structures cracking, the earth showing hollow spaces beneath the surface. The tone is melancholic, hopeless without being aggressive—not a battle, but a surrender to time. Style: oil painting with muted palette, Rembrandt-like chiaroscuro focused on the corruption creeping across otherwise recognizable terrain.

## Hex Overlay
`the-corruption-hex.png` — 1:1. ⏳ Not yet generated.

**Prompt description:** Semi-transparent hex overlay showing corruption spreading across a single tile. Starting from the center or edges, the corruption spreads inward as blackened, withered texture—like rot spreading through fruit, or disease spreading through living tissue. The effect shows:
- Veins of deep shadow/blackness spreading outward from a focal point
- Grimy, dusty overlay obscuring the underlying terrain
- Faint cracks showing hollow space beneath the surface
- Sickly discoloration (yellows, greys) spreading alongside the black
- Suggestion of spores or decay-particles drifting upward
- Entropy threads (if visible) as thin lines of dissipation
The overall effect should read as "slow decay and hollowing-out of this space." Semi-transparent but with strong visual impact showing progressive corruption stages. 15-25% coverage.

## Game Logic

### Trigger Spheres
| Sphere | Weight | Role |
|--------|--------|------|
| **Entropy** | 0.35 | Primary driver — all order dissolves into chaos and decay |
| **Time** | 0.25 | The corruption is patient, spreading slowly across ages |
| **Matter** | 0.20 | Structures weaken, stone and bone both crumble |
| **Mind** | 0.15 | Sanity erodes, will to resist fades as corruption spreads |
| **Life** | 0.05 | Even vitality cannot resist the slow decay |

**Trigger condition:** High Entropy saturation, especially if the world has experienced slow decline (agents dying of age, structures degrading, resources depleting). Corruption is the doom of old, tired worlds.

### Doom Acceleration Rules

- **Baseline acceleration:** +0.15 per tick (slow and patient, faster than Reckoning but slower than Breach)
- **Agents weakened or ill:** +0.08 per agent (as strength fades, corruption spreads faster)
- **Structures destroyed:** +0.12 per destroyed location (each collapse cascades further)
- **Pure entropy sphere saturation:** +0.10 (more chaos breeds more corruption)
- **Player intervention (purification, healing, renewal):** −0.12 per intervention (fighting corruption slows it)
- **Stage escalation event:** Auto-accelerate by +0.15 when entering next stage (corruption accelerates as it progresses)

### Twilight Phase Effects

The Twilight Phase for Corruption lasts 5-8 ticks. It is slow, inescapable, melancholic.

| Tick | Effect | Visual | Mechanical Impact |
|------|--------|--------|-------------------|
| 1 (Entry) | **The Creeping Blight** — Corruption becomes visible to all. Black tendrils spread across terrain. Plants wither visibly. First structures show cracks and decay. | Entropy threads (#2a0845) begin spreading from center of map like veins. Life drains from flora (greens fade to browns/blacks). Stone shows cracks and crumbling edges. The world loses saturation—colors fade toward grey. | All agents gain "Weakened" status (−1 to all physical rolls). Locations begin losing structural integrity (−1 Authority per corruption stage). Essence begins to leak away (−5% harvest rate). |
| 2 | **Hollowing Spreads** — The ground becomes unreliable. Structures are clearly failing. Animals flee or collapse. Agents find their strength waning. | Darkness spreads further. Underlying void becomes visible as shadows under cracked stone and soil. Terrain becomes visibly corrupted—dead forests show skeletal trees, cities show crumbling buildings with holes opening into shadow. | "Hollowed" status spreads (−2 to rolls, movements become unpredictable). Locations take 1 damage per tick from structural decay. Agents lose 1 movement per tick (energy fades). First agents begin to collapse (random removal from play if failed resilience check). |
| 3 | **Fragility** — Everything is brittle now. A touch breaks things. Walking across the land is treacherous. Agents are hollow shells, going through motions. | The world shows extreme decay—almost no color, mostly greys and blacks, with cracks everywhere. Structures are visibly failing. Agents appear as shadows of themselves, moving slowly. The sky is choked with decay-particles/ash. | "Fragile" status (critical hit vulnerability, any attack +30% crit chance). Movement risks collapsing terrain. Agents must make resilience checks to act at all. Essence harvest declines further (−20% total). |
| 4 | **Dissolution** — Bonds between things break. Agents separate from each other. Alliances crumble. Communities dissolve. The world fractures. | All agents visibly separated, isolated in their own pockets of decay. Each hex shows independent corruption, not spreading anymore but consuming its own space. The world is a collection of hollowed-out, broken spaces. Desolation and isolation are complete. | Agents can no longer work together—all group bonuses removed. Final opportunity to gather what remains. |
| 5-8 | **The Hollow World** — The corruption is complete. Nothing remains whole. Agents who still live are the last witnesses to a world utterly consumed. The game ends in quiet, broken silence. | A wasteland. Every hex is corrupted and decayed. Nothing stands. The world is a husk. Sky is now almost solid grey/black. Absolute desolation. Any movement reveals more emptiness and loss. | Final essence is harvested. Agents who survived are "Hollow" but alive—they can choose absolution or acceptance. The next cycle is born from a deeply weakened Fundament (−15-20%), with Entropy manifest easier and corruption-scars in the world-state. |

### Terrain Transformation

| Doom % | Terrain Effect | Progression |
|--------|----------------|-------------|
| 0-20% | Subtle decay — edges of plant life darken, first cracks appear in stone | Awareness phase — perceptive agents notice the world is aging unnaturally |
| 20-40% | "Withering Reaches" — flora is clearly dead or dying, structures show deep cracks, livestock falls ill | Major landmarks show corruption. Forests become dead forests. Rivers stagnate. |
| 40-60% | "Hollowing Lands" — major structures collapse partially, earth becomes unstable, air feels heavy | Navigation becomes difficult (crumbling bridges, collapsing roads). Some hexes become impassable as they collapse. |
| 60-80% | "Brittle World" — nearly all structures have failed, terrain is fractured and unsafe, very little remains intact | Most terrain is corrupted and dangerous. Few safe paths remain. Each hex shows spreading rot-veins. |
| 80-100% | "The Husk" — complete corruption, nothing stands, world is a graveyard, only dust and shadow remain | The world is utterly consumed. Only isolated pockets of "surviving" terrain exist, and even those are hollow and unstable. |

### Agent Impact

| Doom % Range | Agent Effect | Description |
|--------------|--------------|-------------|
| 0-25% | "Weariness" | Agents feel exhaustion, strength fading. −1 to rolls. Some experience vivid memories of the land as it was, heightening despair. |
| 25-50% | "Hollowing" | Agents feel themselves weakening from within. −2 to all rolls, +1 vulnerability to damage. They question whether resistance is worth it. |
| 50-75% | "Fragmentation" | Agents lose coherence. Memories become unclear. They move mechanically, without will. −3 to decision-making, possible random actions. |
| 75-90% | "Dissolution" | Agents are barely present. They may fade from play entirely or become passive observers. −4 to all rolls, possible removal from play. Most gain "Resigned" status (they give up). |
| 90-100% | "Emptiness" | Surviving agents are hollow shells. They are ghosts of themselves, still alive but fundamentally changed. They cannot leave the corrupted world—they are part of it now. "Hollow Witness" status (they see everything, affect nothing). |

### Harvest Modifier

**Corruption is spiritually draining for World-Soul preservation.**

- **Base Harvest Rate:** 40% (corruption corrupts the essence itself, much is lost)
- **Agents who resisted to the end:** +5% per resistant agent (their will-to-live preserved some essence)
- **Agents who accepted the corruption with grace:** +2% (acceptance allows clean harvesting, less resistance-corruption)
- **Agents who fought to deny the inevitable:** −3% each (their denial corrupts the harvest)
- **Memories harvested:** Fragmented memories of a dying world are preserved as "Decay Echoes" in Resonance (next cycle has access to warnings about slow collapse)
- **Next Cycle Consequence:** The resulting new cycle is born with severe Fundament weakness (−20-25%), with Entropy manifest much easier, and the world starts with "Corruption Scars"—certain terrains and actors inherently resistant to renewal.

**Strategic implication:** Corruption rewards acceptance and graceful surrender; fighting too hard against the inevitable wastes more essence. The mechanic is cyclical—a world that was corrupted takes ages to recover.

### Narrative Vocabulary Tags

```
atmosphere:
  - "the patient inevitability of decay"
  - "slow loss of all that was precious"
  - "the surrender to time's erosion"
  - "hollow strength, fading will"
  - "melancholy without hope"
  - "decay as a gentle release"
  - "watching the world become brittle"
  - "the unbearable slowness of ending"

sounds:
  - "creaking wood and cracking stone"
  - "dust settling, endless settling"
  - "the whisper of decay spreading"
  - "silence where life once sang"
  - "grinding as structures collapse"
  - "the hum of slow dissolution"
  - "wind through hollow spaces"

textures:
  - "brittle (crumbling to dust at a touch)"
  - "hollow (empty spaces beneath surface)"
  - "ashy (grey, lifeless, dusty)"
  - "cracked (spreading vein-patterns of decay)"
  - "withered (once-vital things turned to husk)"

colors:
  - "Entropy purple (#2a0845) spreading veins"
  - "Sickly yellow (#8a7a2a) of rot and decay"
  - "Ash grey (#4a4a4a) desaturation"
  - "Deep blacks (#1a1a1a) of hollowed-out space"
  - "Faded memories of original color (browns, blacks, greys)"

imagery:
  - "a world slowly turning to dust"
  - "forests of skeletal, dead trees"
  - "cities crumbling silently, building by building"
  - "agents moving slower, speaking quieter, losing strength"
  - "the ground opening to reveal emptiness beneath"
  - "a sky choked with spores and decay particles"
  - "the last agent standing alone in a ruined world"
  - "structures not destroyed but simply... failing"
  - "life draining like water through cracks"
  - "the world aging in fast-motion, centuries in moments"
```
```

---

## Summary of Stage Names & Narrative Arc

| Stage | Name | Narrative Focus | Mechanical Focus |
|-------|------|-----------------|------------------|
| 1 | **Subtle Blight** | *Something is wrong.* Quiet decay begins. The discerning notice. | Awareness phase (−1 morale, −1 rolls) |
| 2 | **Spreading Decay** | *The corruption is visible.* It spreads faster than expected. | Escalation (−2 rolls, structures failing, essence leaking) |
| 3 | **Rotting Bonds** | *Everything weakens together.* Connections dissolve. Communities fracture. | Fragmentation (agents isolating, cooperation breaks) |
| 4 | **Flesh Falls Away** | *The point of no return.* There is no recovery now. Only acceptance. | Brittleness (critical vulnerability, extreme weakness) |
| 5 | **The Consumed World** | *Nothing remains.* The corruption is complete. A husk remains. | Completion (essence harvested, Fundament severely weakened, scars permanent) |

---

## Testing Checklist

After implementation:

- [ ] Type-check: `npx tsc --noEmit` passes
- [ ] Test: `npm run validate-model` passes (no graph integrity errors)
- [ ] Unit test: `npm test -- doom-content.test.ts` expects 8 archetypes, 8 sets of stage names
- [ ] Integration: Run `npm run dev` and load a game with corruption doom archetype — stage names appear in doom clock
- [ ] Narrative: Check that doom escalation events trigger prose generation with corruption-appropriate sphere language
- [ ] Visual: Verify that stage transitions show corruption stage names in the Chronicle/UI

---

## Files You Will Touch

1. `/src/types/doomClock.ts` — Add 'corruption' type
2. `/src/data/doom-content.ts` — Add stage names
3. `/src/data/narrative-content.ts` — (Optional) Add corruption-specific templates
4. `/src/data/__tests__/doom-content.test.ts` — Update test expectations
5. `/src/engine/orchestrator.ts` — (Optional) Add sphere context for corruption prose
6. `/Assets/doom/the-corruption/the-corruption-package.md` — New asset package (design reference)

---

## Notes on Narrative Generation

The prose engine works in layers:

1. **Routine (Tier 1):** Fast template stitching with seeded word substitution
   - Input: Event type, context (actor/target/location), sphere, seed
   - Output: One-sentence prose with sphere-specific vocabulary
   - Deterministic (same seed + inputs = same prose)

2. **Notable (Tier 2):** Enhanced templates with personality modifiers
   - Adds value-pair flavoring ("driven by ambition", "with fearless resolve")
   - Richer sentence structure, more varied placeholder combinations
   - Still deterministic

3. **Chronicle (Tier 3):** LLM-generated prose
   - Larger, narrative-rich paragraphs
   - Uses context objects (ranked actors, location, mood, historical fragments)
   - Not yet fully integrated (TODO markers in orchestrator)

**For corruption escalation prose:**
- If you use existing templates (Option A), the engine will auto-flavor them with Entropy/Time/Matter words → already feels appropriately "corrupting"
- If you add corruption-specific templates (Option B), you have full control over tone and metaphor

---

## Recommended Implementation Order

1. **Friday morning:** Add type and stage names (15 min, unblocks compilation)
2. **Friday afternoon:** Add corruption package design doc (60 min, reference for future visual/mechanical work)
3. **Next week:** Add narrative templates + orchestrator wiring (120 min, makes prose generation distinctive)
4. **Later:** Mechanical flavor (terrain effects, agent status, acceleration rules) and asset generation (images, audio cues)

The game will work with just the type + stage names in place. The narrative templates and package doc are refinements.

---

**Created:** 2026-03-08
**Status:** Design-phase guidance complete. Ready for implementation.
