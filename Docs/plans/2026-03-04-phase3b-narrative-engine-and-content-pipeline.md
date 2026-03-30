# Phase 3B: Narrative Prose Engine & Content Pipeline — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the hybrid layered prose engine (template → enhanced → LLM) with three tiers based on event significance, sphere coloring, personality influence, voice conventions, and chronicle compression. Also build the content pipeline that routes events to the appropriate prose tier.

**Architecture:** Every resolved action, trait acquisition, stage transition, and world event flows through a content pipeline that classifies it by significance (routine/notable/chronicle), then routes it to the appropriate prose generator. Routine events use template stitching. Notable events use enhanced templates with conditional clauses. Chronicle events produce structured prompts for future LLM generation (stub in this phase). All prose is flavored by sphere alignment, actor personality, and Foundation bias.

**Tech Stack:** TypeScript, Vitest, existing APIs from prior phases.

**Existing code to build on:**
- `src/types/graph.ts` — `GraphNode`, `GraphEdge`, event nodes
- `src/types/traits.ts` — `ReachDomain`
- `src/types/index.ts` — `SphereName`, `SPHERE_NAMES`
- `src/types/agent.ts` — `AxiologicalProfile`, `ValuePair`
- `src/types/doomClock.ts` (Phase 3A) — `DoomClockArchetype`, doom stage events
- `src/engine/graph.ts` — `WorldGraph`

**Dependency order:**
```
Task 1: Narrative type definitions
  ↓
Task 2: Template-stitched prose (Tier 1 — Routine)
  ↓
Task 3: Enhanced template prose (Tier 2 — Notable)
  ↓
Task 4: Chronicle prompt builder (Tier 3 — Chronicle)
  ↓
Task 5: Content pipeline router + integration test
```

---

## Conventions (same as prior phases)

- **Tests** go in `src/engine/__tests__/<module>.test.ts`
- **No classes** — export pure functions
- **Deterministic** with seed parameters
- **Imports** use `type` keyword for type-only imports

---

### Task 1: Narrative Type Definitions

**Files:**
- Create: `src/types/narrative.ts`

**Step 1: Write the failing test**

Create `src/engine/__tests__/narrative.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  NarrativeTier,
  NarrativeEvent,
  ProseFragment,
  ProseContext,
  SphereVocabulary,
  VoiceMode,
  ChronicleEntry,
} from '../../types/narrative';
import {
  SPHERE_VOCABULARY,
  NARRATIVE_TIERS,
} from '../../types/narrative';

describe('narrative type definitions', () => {
  it('exports all 3 narrative tiers', () => {
    expect(NARRATIVE_TIERS).toEqual(['routine', 'notable', 'chronicle']);
  });

  it('exports sphere vocabulary for all 8 spheres', () => {
    const spheres = Object.keys(SPHERE_VOCABULARY);
    expect(spheres.length).toBe(8);
    for (const sphere of spheres) {
      const vocab = SPHERE_VOCABULARY[sphere as keyof typeof SPHERE_VOCABULARY];
      expect(vocab.adjectives.length).toBeGreaterThanOrEqual(3);
      expect(vocab.verbs.length).toBeGreaterThanOrEqual(3);
      expect(vocab.nouns.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('NarrativeEvent has correct shape', () => {
    const event: NarrativeEvent = {
      id: 'evt_1',
      tier: 'routine',
      eventType: 'action_resolved',
      actorId: 'actor_1',
      description: 'Thane Volkar marched on the fortress',
      tick: 42,
      sphere: 'force',
    };
    expect(event.tier).toBe('routine');
  });

  it('ChronicleEntry has correct shape', () => {
    const entry: ChronicleEntry = {
      id: 'chron_1',
      tier: 'chronicle',
      title: 'The Fall of Iron Gate',
      prose: '',
      promptContext: { actors: [], location: '', sphere: 'force', mood: 'dramatic' },
      tick: 100,
    };
    expect(entry.tier).toBe('chronicle');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: FAIL — module not found

**Step 3: Write the type definitions**

Create `src/types/narrative.ts`:

```typescript
import type { SphereName } from './index';
import type { ValuePair } from './agent';

// ─── Tiers ───────────────────────────────────────────────────────

export type NarrativeTier = 'routine' | 'notable' | 'chronicle';

export const NARRATIVE_TIERS: NarrativeTier[] = ['routine', 'notable', 'chronicle'];

// ─── Voice ───────────────────────────────────────────────────────

/** Narrative voice mode */
export type VoiceMode =
  | 'second_person'          // "You whisper into the dream..."
  | 'third_person_omniscient' // "The warband marched..."
  | 'dramatic_present';       // "The walls crack and shudder..."

// ─── Events ──────────────────────────────────────────────────────

/** Types of events that generate narrative */
export type NarrativeEventType =
  | 'action_resolved'
  | 'action_failed'
  | 'action_critical'
  | 'trait_acquired'
  | 'trait_lost'
  | 'tier_transition'
  | 'doom_escalation'
  | 'mandate_stage'
  | 'divine_intervention'
  | 'actor_death'
  | 'contested_action';

/** A narrative event flowing through the content pipeline */
export interface NarrativeEvent {
  id: string;
  tier: NarrativeTier;
  eventType: NarrativeEventType;
  actorId?: string;
  targetId?: string;
  description: string;
  tick: number;
  sphere?: SphereName;
  /** Dominant personality values for prose flavoring */
  personalityTraits?: ValuePair[];
  /** Additional context for template selection */
  tags?: string[];
}

// ─── Prose Output ────────────────────────────────────────────────

/** A generated prose fragment */
export interface ProseFragment {
  text: string;
  voice: VoiceMode;
  tier: NarrativeTier;
  eventId: string;
  sphereColoring?: SphereName;
}

/** Context passed to prose generators */
export interface ProseContext {
  actorName?: string;
  targetName?: string;
  locationName?: string;
  sphere?: SphereName;
  dominantValues?: ValuePair[];
  foundationBias?: 'chaos' | 'order' | 'light' | 'darkness' | 'balanced';
}

// ─── Chronicle ───────────────────────────────────────────────────

/** A Chronicle-tier entry (for future LLM generation) */
export interface ChronicleEntry {
  id: string;
  tier: 'chronicle';
  title: string;
  prose: string;  // generated prose (empty until LLM fills it)
  promptContext: {
    actors: string[];
    location: string;
    sphere: SphereName;
    mood: string;
    previousEvents?: string[];
  };
  tick: number;
}

// ─── Sphere Vocabulary ───────────────────────────────────────────

export interface SphereVocabulary {
  adjectives: string[];
  verbs: string[];
  nouns: string[];
}

export const SPHERE_VOCABULARY: Record<SphereName, SphereVocabulary> = {
  force: {
    adjectives: ['mighty', 'thunderous', 'relentless', 'crushing', 'unyielding'],
    verbs: ['shattered', 'struck', 'overwhelmed', 'battered', 'surged'],
    nouns: ['might', 'fury', 'impact', 'avalanche', 'storm'],
  },
  matter: {
    adjectives: ['solid', 'enduring', 'immovable', 'crystalline', 'dense'],
    verbs: ['forged', 'shaped', 'hardened', 'anchored', 'crystallized'],
    nouns: ['stone', 'iron', 'foundation', 'bulwark', 'bedrock'],
  },
  energy: {
    adjectives: ['crackling', 'luminous', 'volatile', 'radiant', 'searing'],
    verbs: ['blazed', 'surged', 'erupted', 'ignited', 'cascaded'],
    nouns: ['flame', 'lightning', 'pulse', 'arc', 'inferno'],
  },
  life: {
    adjectives: ['verdant', 'flourishing', 'vital', 'blooming', 'fecund'],
    verbs: ['bloomed', 'healed', 'nurtured', 'grew', 'restored'],
    nouns: ['growth', 'renewal', 'bloom', 'vitality', 'spring'],
  },
  mind: {
    adjectives: ['keen', 'piercing', 'calculating', 'lucid', 'insightful'],
    verbs: ['discerned', 'analyzed', 'perceived', 'understood', 'unraveled'],
    nouns: ['thought', 'insight', 'clarity', 'revelation', 'logic'],
  },
  spirit: {
    adjectives: ['ethereal', 'transcendent', 'luminous', 'spectral', 'sacred'],
    verbs: ['resonated', 'sanctified', 'communed', 'invoked', 'channeled'],
    nouns: ['soul', 'essence', 'prayer', 'vision', 'aura'],
  },
  time: {
    adjectives: ['ancient', 'inexorable', 'cyclic', 'fading', 'eternal'],
    verbs: ['aged', 'unwound', 'echoed', 'rippled', 'decayed'],
    nouns: ['epoch', 'moment', 'tide', 'cycle', 'memory'],
  },
  entropy: {
    adjectives: ['decaying', 'consuming', 'inevitable', 'dissolving', 'chaotic'],
    verbs: ['crumbled', 'consumed', 'unraveled', 'corroded', 'scattered'],
    nouns: ['ash', 'ruin', 'void', 'decay', 'dissolution'],
  },
};
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/narrative.ts src/engine/__tests__/narrative.test.ts
git commit -m "feat: add narrative prose type definitions with sphere vocabulary"
```

---

### Task 2: Template-Stitched Prose (Tier 1 — Routine)

**Files:**
- Create: `src/engine/narrative.ts`
- Test: `src/engine/__tests__/narrative.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/narrative.test.ts`:

```typescript
import {
  generateRoutineProse,
  pickSphereWord,
} from '../narrative';
import type { ProseContext } from '../../types/narrative';

describe('routine prose generation (tier 1)', () => {
  it('generates prose for action_resolved events', () => {
    const context: ProseContext = {
      actorName: 'Thane Volkar',
      targetName: 'the Border Fortress',
      sphere: 'force',
    };
    const prose = generateRoutineProse('action_resolved', context, 42);
    expect(prose.text.length).toBeGreaterThan(10);
    expect(prose.text).toContain('Volkar');
    expect(prose.tier).toBe('routine');
    expect(prose.voice).toBe('third_person_omniscient');
  });

  it('generates prose for trait_acquired events', () => {
    const context: ProseContext = {
      actorName: 'Kira the Scout',
      sphere: 'mind',
    };
    const prose = generateRoutineProse('trait_acquired', context, 42);
    expect(prose.text.length).toBeGreaterThan(10);
    expect(prose.tier).toBe('routine');
  });

  it('generates prose for divine_intervention events with second person', () => {
    const context: ProseContext = {
      actorName: 'a sleeping warrior',
      sphere: 'spirit',
    };
    const prose = generateRoutineProse('divine_intervention', context, 42);
    expect(prose.text.length).toBeGreaterThan(10);
    expect(prose.voice).toBe('second_person');
  });

  it('pickSphereWord returns a word from the sphere vocabulary', () => {
    const adj = pickSphereWord('force', 'adjectives', 42);
    expect(typeof adj).toBe('string');
    expect(adj.length).toBeGreaterThan(0);
  });

  it('generates deterministically for same seed', () => {
    const context: ProseContext = { actorName: 'Volkar', sphere: 'force' };
    const a = generateRoutineProse('action_resolved', context, 99);
    const b = generateRoutineProse('action_resolved', context, 99);
    expect(a.text).toBe(b.text);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: FAIL — functions not found

**Step 3: Write the implementation**

Create `src/engine/narrative.ts`:

```typescript
/**
 * Narrative Prose Engine — hybrid layered prose generation.
 *
 * Tier 1 (Routine): Template-stitched from pre-authored fragments.
 * Tier 2 (Notable): Enhanced templates with conditional clauses.
 * Tier 3 (Chronicle): Structured prompts for LLM generation.
 */
import type { SphereName } from '../types/index';
import type {
  NarrativeEventType,
  NarrativeTier,
  ProseFragment,
  ProseContext,
  VoiceMode,
  SphereVocabulary,
  ChronicleEntry,
} from '../types/narrative';
import { SPHERE_VOCABULARY } from '../types/narrative';

// ─── Seeded PRNG ─────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Sphere Word Picker ──────────────────────────────────────────

/**
 * Pick a word from a sphere's vocabulary using a deterministic seed.
 */
export function pickSphereWord(
  sphere: SphereName,
  category: keyof SphereVocabulary,
  seed: number,
): string {
  const words = SPHERE_VOCABULARY[sphere]?.[category] ?? ['unknown'];
  const rng = mulberry32(seed);
  return words[Math.floor(rng() * words.length)];
}

// ─── Voice Selection ─────────────────────────────────────────────

function getVoice(eventType: NarrativeEventType): VoiceMode {
  if (eventType === 'divine_intervention') return 'second_person';
  if (eventType === 'doom_escalation' || eventType === 'mandate_stage') return 'dramatic_present';
  return 'third_person_omniscient';
}

// ─── Tier 1: Routine Template Stitching ──────────────────────────

/** Template fragments indexed by event type */
const ROUTINE_TEMPLATES: Record<string, string[]> = {
  action_resolved: [
    '{actor} {verb} toward {target}, a {adj} display of {noun}.',
    'With {adj} resolve, {actor} moved against {target}. The air hummed with {noun}.',
    '{actor} acted with {adj} purpose, their {noun} reshaping the fate of {target}.',
  ],
  action_failed: [
    '{actor} reached for {target}, but the effort dissolved into {noun}.',
    'The {adj} attempt by {actor} faltered, leaving only {noun} in its wake.',
  ],
  action_critical: [
    '{actor} {verb} with {adj} force, and {target} was forever changed by the {noun}.',
    'A {adj} moment — {actor} {verb} beyond all expectation, and {noun} reshaped the world.',
  ],
  trait_acquired: [
    'Something shifted within {actor}. A new {noun} took root — {adj} and undeniable.',
    '{actor} emerged changed, bearing the mark of {adj} {noun}.',
  ],
  tier_transition: [
    'The bond between {actor} and the divine deepened, {adj} {noun} flowing through them.',
  ],
  divine_intervention: [
    'You reached into the dream of {actor}, a {adj} whisper carrying {noun}.',
    'You stirred the {noun} within {actor}, a {adj} touch upon their sleeping mind.',
  ],
  contested_action: [
    'Two forces clashed over {target} — {adj} {noun} against {adj} resolve.',
  ],
  actor_death: [
    '{actor} fell, their last breath a {adj} exhalation of {noun}.',
  ],
  doom_escalation: [
    'The world {verb}. {adj} {noun} spreads across the land.',
  ],
  mandate_stage: [
    'A threshold is crossed. The {adj} {noun} of destiny draws nearer.',
  ],
  trait_lost: [
    'Something faded within {actor}. The {adj} {noun} dimmed and was gone.',
  ],
};

/**
 * Generate routine (Tier 1) prose from templates.
 */
export function generateRoutineProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
): ProseFragment {
  const rng = mulberry32(seed);
  const sphere = context.sphere ?? 'force';
  const templates = ROUTINE_TEMPLATES[eventType] ?? ROUTINE_TEMPLATES.action_resolved;
  const template = templates[Math.floor(rng() * templates.length)];

  const adj = pickSphereWord(sphere, 'adjectives', seed + 1);
  const verb = pickSphereWord(sphere, 'verbs', seed + 2);
  const noun = pickSphereWord(sphere, 'nouns', seed + 3);

  const text = template
    .replace(/\{actor\}/g, context.actorName ?? 'the actor')
    .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the target')
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun);

  return {
    text,
    voice: getVoice(eventType),
    tier: 'routine',
    eventId: `evt_${seed}`,
    sphereColoring: sphere,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/narrative.ts src/engine/__tests__/narrative.test.ts
git commit -m "feat: add routine prose generation with sphere-colored templates"
```

---

### Task 3: Enhanced Template Prose (Tier 2 — Notable)

**Files:**
- Modify: `src/engine/narrative.ts` (add notable prose)
- Test: `src/engine/__tests__/narrative.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/narrative.test.ts`:

```typescript
import { generateNotableProse } from '../narrative';

describe('notable prose generation (tier 2)', () => {
  it('generates longer prose than routine', () => {
    const context: ProseContext = {
      actorName: 'Champion Arven',
      targetName: 'the Crystal Spire',
      sphere: 'energy',
      dominantValues: ['courage_prudence', 'devotion_independence'],
    };
    const prose = generateNotableProse('action_critical', context, 42);
    expect(prose.text.length).toBeGreaterThan(50);
    expect(prose.tier).toBe('notable');
  });

  it('includes personality flavoring when values provided', () => {
    const context: ProseContext = {
      actorName: 'The Cunning Fox',
      sphere: 'mind',
      dominantValues: ['cunning_honesty'],
    };
    const prose = generateNotableProse('trait_acquired', context, 42);
    expect(prose.text.length).toBeGreaterThan(30);
  });

  it('uses dramatic present for doom events', () => {
    const context: ProseContext = {
      locationName: 'the Northern Reach',
      sphere: 'entropy',
    };
    const prose = generateNotableProse('doom_escalation', context, 42);
    expect(prose.voice).toBe('dramatic_present');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: FAIL — `generateNotableProse` not found

**Step 3: Write the implementation**

Append to `src/engine/narrative.ts`:

```typescript
// ─── Personality Flavoring ───────────────────────────────────────

const VALUE_FLAVORS: Partial<Record<string, string[]>> = {
  ambition_contentment: ['driven by ambition', 'fueled by relentless desire'],
  courage_prudence: ['with fearless resolve', 'bold beyond measure'],
  cruelty_compassion: ['tempered by compassion', 'with a gentle hand'],
  cunning_honesty: ['with cunning precision', 'through shrewd calculation'],
  devotion_independence: ['bound by devotion', 'answering a higher call'],
  loyalty_treachery: ['loyal to the last', 'with unwavering fidelity'],
  tradition_innovation: ['embracing new paths', 'breaking with the old ways'],
  dominance_humility: ['commanding all before them', 'asserting dominion'],
  wrath_patience: ['with patient deliberation', 'measured and calm'],
  greed_generosity: ['with open-handed generosity', 'sharing freely'],
};

function getPersonalityClause(values?: string[], seed?: number): string {
  if (!values || values.length === 0) return '';
  const rng = mulberry32(seed ?? 0);
  const value = values[Math.floor(rng() * values.length)];
  const flavors = VALUE_FLAVORS[value];
  if (!flavors || flavors.length === 0) return '';
  return ', ' + flavors[Math.floor(rng() * flavors.length)];
}

// ─── Tier 2: Notable Enhanced Templates ──────────────────────────

const NOTABLE_TEMPLATES: Record<string, string[]> = {
  action_critical: [
    'In a moment that would echo through memory, {actor} {verb} against {target}{personality}. The very air trembled with {adj} {noun}, and those who witnessed it knew the world had shifted.',
    '{actor}{personality} stood at the threshold of legend. With {adj} determination, they {verb} — and {target} was forever transformed by the {noun} unleashed.',
  ],
  trait_acquired: [
    'Something profound awakened within {actor}{personality}. Like {adj} {noun} breaking through winter soil, a new aspect of their being emerged — one that would define the chapters yet to come.',
    '{actor} was changed{personality}. The {adj} mark of {noun} settled upon them, indelible as starlight, shaping all that would follow.',
  ],
  doom_escalation: [
    'The world shudders. Across {target}, {adj} {noun} seeps through the cracks of reality{personality}. Those with eyes to see recognize the signs — the {noun} draws closer.',
    'A tremor passes through the fabric of existence. In {target}, {adj} portents multiply — {noun} gathering like stormclouds on the horizon.',
  ],
  tier_transition: [
    'The divine bond between {actor} and the unseen deepens{personality}. {adj} {noun} courses through their veins now, marking them as something more than mortal.',
  ],
  divine_intervention: [
    'You reach deeper than before into the consciousness of {actor}{personality}. This time the {adj} {noun} of your will leaves a lasting impression — their dreams will never be quite the same.',
  ],
};

/**
 * Generate notable (Tier 2) prose with enhanced templates and personality flavoring.
 */
export function generateNotableProse(
  eventType: NarrativeEventType,
  context: ProseContext,
  seed: number,
): ProseFragment {
  const rng = mulberry32(seed);
  const sphere = context.sphere ?? 'force';
  const templates = NOTABLE_TEMPLATES[eventType] ?? NOTABLE_TEMPLATES.action_critical;
  const template = templates[Math.floor(rng() * templates.length)];

  const adj = pickSphereWord(sphere, 'adjectives', seed + 10);
  const verb = pickSphereWord(sphere, 'verbs', seed + 20);
  const noun = pickSphereWord(sphere, 'nouns', seed + 30);
  const personality = getPersonalityClause(context.dominantValues, seed + 40);

  const text = template
    .replace(/\{actor\}/g, context.actorName ?? 'the figure')
    .replace(/\{target\}/g, context.targetName ?? context.locationName ?? 'the world')
    .replace(/\{adj\}/g, adj)
    .replace(/\{verb\}/g, verb)
    .replace(/\{noun\}/g, noun)
    .replace(/\{personality\}/g, personality);

  return {
    text,
    voice: getVoice(eventType),
    tier: 'notable',
    eventId: `evt_${seed}`,
    sphereColoring: sphere,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/narrative.ts src/engine/__tests__/narrative.test.ts
git commit -m "feat: add notable prose generation with personality flavoring"
```

---

### Task 4: Chronicle Prompt Builder (Tier 3)

**Files:**
- Modify: `src/engine/narrative.ts` (add chronicle builder)
- Test: `src/engine/__tests__/narrative.test.ts` (append)

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/narrative.test.ts`:

```typescript
import { buildChronicleEntry } from '../narrative';

describe('chronicle prompt builder (tier 3)', () => {
  it('builds a chronicle entry with structured prompt context', () => {
    const entry = buildChronicleEntry({
      id: 'chron_1',
      title: 'The Fall of Iron Gate',
      actors: ['Thane Volkar', 'The Iron Judge'],
      location: 'Iron Gate Fortress',
      sphere: 'force',
      mood: 'tragic',
      tick: 100,
      previousEvents: ['The siege began', 'Defenders rallied'],
    });

    expect(entry.tier).toBe('chronicle');
    expect(entry.title).toBe('The Fall of Iron Gate');
    expect(entry.promptContext.actors).toEqual(['Thane Volkar', 'The Iron Judge']);
    expect(entry.promptContext.sphere).toBe('force');
    expect(entry.promptContext.mood).toBe('tragic');
    expect(entry.prose).toBe(''); // Empty — to be filled by LLM in future
  });

  it('includes previous events for narrative continuity', () => {
    const entry = buildChronicleEntry({
      id: 'chron_2',
      title: 'The Ascension',
      actors: ['Kira'],
      location: 'The Crystal Spire',
      sphere: 'spirit',
      mood: 'triumphant',
      tick: 200,
      previousEvents: ['The trial of faith', 'The burning vision'],
    });

    expect(entry.promptContext.previousEvents).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Append to `src/engine/narrative.ts`:

```typescript
// ─── Tier 3: Chronicle Prompt Builder ────────────────────────────

/**
 * Build a Chronicle entry stub. The `prose` field is left empty —
 * it will be filled by the LLM prose generation layer in a future phase.
 * The `promptContext` contains all the structured data needed to generate
 * literary-quality prose.
 */
export function buildChronicleEntry(params: {
  id: string;
  title: string;
  actors: string[];
  location: string;
  sphere: SphereName;
  mood: string;
  tick: number;
  previousEvents?: string[];
}): ChronicleEntry {
  return {
    id: params.id,
    tier: 'chronicle',
    title: params.title,
    prose: '', // Stub — LLM fills this in future phase
    promptContext: {
      actors: params.actors,
      location: params.location,
      sphere: params.sphere,
      mood: params.mood,
      previousEvents: params.previousEvents,
    },
    tick: params.tick,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/narrative.ts src/engine/__tests__/narrative.test.ts
git commit -m "feat: add chronicle prompt builder for LLM-tier narrative"
```

---

### Task 5: Content Pipeline Router + Integration Test

**Files:**
- Modify: `src/engine/narrative.ts` (add pipeline router)
- Create: `src/engine/__tests__/narrative-integration.test.ts`

**Step 1: Write the failing tests**

Append to `src/engine/__tests__/narrative.test.ts`:

```typescript
import { classifyEvent, routeEvent } from '../narrative';
import type { NarrativeEvent } from '../../types/narrative';

describe('content pipeline router', () => {
  it('classifies ordinary action_resolved as routine', () => {
    expect(classifyEvent('action_resolved', [])).toBe('routine');
  });

  it('classifies action_critical as notable', () => {
    expect(classifyEvent('action_critical', [])).toBe('notable');
  });

  it('classifies doom_escalation as chronicle', () => {
    expect(classifyEvent('doom_escalation', [])).toBe('chronicle');
  });

  it('classifies tier_transition as notable', () => {
    expect(classifyEvent('tier_transition', [])).toBe('notable');
  });

  it('classifies contested_action as notable', () => {
    expect(classifyEvent('contested_action', [])).toBe('notable');
  });

  it('routeEvent produces prose for routine events', () => {
    const event: NarrativeEvent = {
      id: 'evt_1', tier: 'routine', eventType: 'action_resolved',
      actorId: 'actor_1', description: 'marched', tick: 10, sphere: 'force',
    };
    const result = routeEvent(event, { actorName: 'Volkar', sphere: 'force' }, 42);
    expect(result.tier).toBe('routine');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('routeEvent produces prose for notable events', () => {
    const event: NarrativeEvent = {
      id: 'evt_2', tier: 'notable', eventType: 'action_critical',
      actorId: 'actor_1', description: 'critical hit', tick: 20, sphere: 'energy',
    };
    const result = routeEvent(event, { actorName: 'Arven', sphere: 'energy' }, 42);
    expect(result.tier).toBe('notable');
    expect(result.text.length).toBeGreaterThan(50);
  });
});
```

Create `src/engine/__tests__/narrative-integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { classifyEvent, routeEvent, buildChronicleEntry } from '../narrative';
import type { NarrativeEvent, ProseContext } from '../../types/narrative';

describe('narrative pipeline integration', () => {
  it('processes a full sequence of events across all tiers', () => {
    const events: Array<{ event: NarrativeEvent; context: ProseContext }> = [
      {
        event: { id: 'e1', tier: 'routine', eventType: 'action_resolved', description: 'march', tick: 1, sphere: 'force' },
        context: { actorName: 'Volkar', targetName: 'the fortress', sphere: 'force' },
      },
      {
        event: { id: 'e2', tier: 'notable', eventType: 'action_critical', description: 'critical siege', tick: 5, sphere: 'force' },
        context: { actorName: 'Volkar', targetName: 'Iron Gate', sphere: 'force', dominantValues: ['courage_prudence'] },
      },
      {
        event: { id: 'e3', tier: 'routine', eventType: 'trait_acquired', description: 'gained scar', tick: 6, sphere: 'entropy' },
        context: { actorName: 'Volkar', sphere: 'entropy' },
      },
    ];

    const results = events.map(({ event, context }, i) =>
      routeEvent(event, context, i * 100),
    );

    expect(results[0].tier).toBe('routine');
    expect(results[1].tier).toBe('notable');
    expect(results[2].tier).toBe('routine');

    // All should have non-empty text
    for (const result of results) {
      expect(result.text.length).toBeGreaterThan(10);
    }

    // Notable should be longer than routine (generally)
    expect(results[1].text.length).toBeGreaterThan(results[0].text.length);
  });

  it('chronicle entries have empty prose ready for LLM', () => {
    const entry = buildChronicleEntry({
      id: 'c1',
      title: 'The Siege of Iron Gate',
      actors: ['Volkar', 'The Iron Judge'],
      location: 'Iron Gate',
      sphere: 'force',
      mood: 'epic',
      tick: 50,
      previousEvents: ['march began', 'walls breached'],
    });

    expect(entry.prose).toBe('');
    expect(entry.promptContext.actors.length).toBe(2);
    expect(entry.promptContext.previousEvents?.length).toBe(2);
  });
});
```

**Step 2: Run tests — write remaining implementations**

Append to `src/engine/narrative.ts`:

```typescript
// ─── Content Pipeline ────────────────────────────────────────────

/** Event type → default tier classification */
const EVENT_TIER_MAP: Record<NarrativeEventType, NarrativeTier> = {
  action_resolved: 'routine',
  action_failed: 'routine',
  action_critical: 'notable',
  trait_acquired: 'notable',
  trait_lost: 'routine',
  tier_transition: 'notable',
  doom_escalation: 'chronicle',
  mandate_stage: 'chronicle',
  divine_intervention: 'routine',
  actor_death: 'notable',
  contested_action: 'notable',
};

/**
 * Classify an event's narrative tier based on its type and tags.
 */
export function classifyEvent(
  eventType: NarrativeEventType,
  tags: string[],
): NarrativeTier {
  // Tags can override: 'legendary', 'world_shaking' → chronicle
  if (tags.includes('legendary') || tags.includes('world_shaking')) return 'chronicle';
  return EVENT_TIER_MAP[eventType] ?? 'routine';
}

/**
 * Route a narrative event through the appropriate prose generator.
 * Returns a ProseFragment for Tier 1/2, or throws for Tier 3 (use buildChronicleEntry).
 */
export function routeEvent(
  event: NarrativeEvent,
  context: ProseContext,
  seed: number,
): ProseFragment {
  const tier = event.tier;

  switch (tier) {
    case 'routine':
      return generateRoutineProse(event.eventType, context, seed);
    case 'notable':
      return generateNotableProse(event.eventType, context, seed);
    case 'chronicle':
      // Chronicle tier generates a placeholder — actual prose comes from LLM
      return {
        text: `[Chronicle: ${event.description}]`,
        voice: 'dramatic_present',
        tier: 'chronicle',
        eventId: event.id,
        sphereColoring: event.sphere,
      };
    default:
      return generateRoutineProse(event.eventType, context, seed);
  }
}
```

**Step 3: Run all tests**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run src/engine/__tests__/narrative.test.ts src/engine/__tests__/narrative-integration.test.ts`
Expected: PASS

**Step 4: Run full suite**

Run: `cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && npx vitest run`
Expected: All pass

**Step 5: Commit**

```bash
git add src/engine/narrative.ts src/engine/__tests__/narrative.test.ts src/engine/__tests__/narrative-integration.test.ts
git commit -m "feat: add content pipeline router and narrative integration tests"
```

---

## Summary

| Task | Files | Tests | What it builds |
|------|-------|-------|---------------|
| 1 | `src/types/narrative.ts` | 4 | Type defs: tiers, events, prose fragments, sphere vocabulary |
| 2 | `src/engine/narrative.ts` | 5 | Routine prose: template stitching with sphere coloring |
| 3 | `src/engine/narrative.ts` | 3 | Notable prose: enhanced templates with personality clauses |
| 4 | `src/engine/narrative.ts` | 2 | Chronicle stub: structured prompt context for LLM |
| 5 | `src/engine/narrative.ts` + integration | 8 | Content pipeline: classify → route → generate |
| **Total** | **2 files** | **~22 tests** | |

**Exports from this phase:**
- Types: `NarrativeTier`, `NarrativeEvent`, `ProseFragment`, `ProseContext`, `VoiceMode`, `ChronicleEntry`, `SphereVocabulary`, `NarrativeEventType`
- Constants: `NARRATIVE_TIERS`, `SPHERE_VOCABULARY`
- Functions: `pickSphereWord()`, `generateRoutineProse()`, `generateNotableProse()`, `buildChronicleEntry()`, `classifyEvent()`, `routeEvent()`

**Phase 4A depends on:** Chronicle entries (`ChronicleEntry`) feed World-Soul resonance memories. Sphere vocabulary provides tonal consistency across the Unmaking prose.
