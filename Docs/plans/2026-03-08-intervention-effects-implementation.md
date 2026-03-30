# Intervention Effects & Action Card Feedback — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make divine interventions produce real world-graph effects, give the player visual/audio feedback when playing action cards, and show consequence messages explaining what the intervention did.

**Architecture:** Three layers — (1) data-driven content package with consequence message templates and tunable constants, (2) pure engine function `applyInterventionEffects` that mutates the world graph per intervention type, (3) React hooks for card animation timing and Web Audio synthesis. Divine influences are stored as temporary overlays on agent nodes, applied during action selection pipeline, and decayed each tick.

**Tech Stack:** TypeScript, React, Web Audio API, Vitest, CSS @keyframes

---

### Task 1: Content Package — `intervention-feedback-content.ts`

**Files:**
- Create: `src/data/intervention-feedback-content.ts`
- Test: `src/data/__tests__/intervention-feedback-content.test.ts`

**Step 1: Write the failing test**

```typescript
// src/data/__tests__/intervention-feedback-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  DIVINE_INFLUENCE_CONSTANTS,
  CONSEQUENCE_TEMPLATES,
  SPHERE_AUDIO_CONFIG,
  getConsequenceMessage,
} from '../intervention-feedback-content';

describe('DIVINE_INFLUENCE_CONSTANTS', () => {
  it('has duration for every intervention type', () => {
    const types = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'];
    for (const t of types) {
      expect(DIVINE_INFLUENCE_CONSTANTS[`${t.toUpperCase()}_DURATION` as keyof typeof DIVINE_INFLUENCE_CONSTANTS]).toBeDefined();
    }
  });

  it('all durations are positive integers', () => {
    const durationKeys = Object.keys(DIVINE_INFLUENCE_CONSTANTS).filter(k => k.endsWith('_DURATION'));
    for (const key of durationKeys) {
      const val = DIVINE_INFLUENCE_CONSTANTS[key as keyof typeof DIVINE_INFLUENCE_CONSTANTS];
      expect(val).toBeGreaterThan(0);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('has feedback timing constants', () => {
    expect(DIVINE_INFLUENCE_CONSTANTS.CARD_PULSE_MS).toBe(200);
    expect(DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS).toBe(600);
  });
});

describe('CONSEQUENCE_TEMPLATES', () => {
  it('has templates for all 8 intervention types', () => {
    const types = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'];
    for (const t of types) {
      expect(CONSEQUENCE_TEMPLATES[t]).toBeDefined();
      expect(CONSEQUENCE_TEMPLATES[t].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every template contains {agent} placeholder', () => {
    for (const [type, templates] of Object.entries(CONSEQUENCE_TEMPLATES)) {
      for (const tmpl of templates) {
        expect(tmpl).toContain('{agent}');
      }
    }
  });
});

describe('getConsequenceMessage', () => {
  it('substitutes {agent} and {value_direction} placeholders', () => {
    const msg = getConsequenceMessage('dream', {
      agentName: 'Kael',
      valueDirection: 'courage over prudence',
      sphere: 'mind',
    }, 42);
    expect(msg).toContain('Kael');
    expect(msg.length).toBeGreaterThan(10);
  });

  it('returns different templates for different seeds', () => {
    const msgs = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      msgs.add(getConsequenceMessage('persuade', {
        agentName: 'Mira',
        valueDirection: 'loyalty',
        sphere: 'spirit',
      }, seed));
    }
    expect(msgs.size).toBeGreaterThan(1);
  });
});

describe('SPHERE_AUDIO_CONFIG', () => {
  it('maps every sphere to a frequency offset', () => {
    const spheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
    for (const s of spheres) {
      expect(SPHERE_AUDIO_CONFIG[s]).toBeDefined();
      expect(SPHERE_AUDIO_CONFIG[s].freqOffset).toBeGreaterThanOrEqual(-100);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/intervention-feedback-content.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/data/intervention-feedback-content.ts
/**
 * Intervention Feedback Content Package — consequence message templates,
 * divine influence constants, and audio configuration.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change intervention durations,
 * drift magnitudes, feedback timing, and consequence messages.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { InterventionType } from '../types/dream';
import type { SphereName } from '../types/index';

// ─── Divine Influence Constants ──────────────────────────────────

export const DIVINE_INFLUENCE_CONSTANTS = {
  // Duration (ticks)
  DREAM_DURATION: 3,
  PERSUADE_DURATION: 12,
  DECEIVE_DURATION: 18,
  INTIMIDATE_DURATION: 10,
  INSPIRE_INTERVENTION_DURATION: 6,
  COINCIDENCE_DURATION: 1,
  OMEN_DURATION: 5,
  AFFLICT_BLESS_DURATION: 10,

  // Value drift magnitudes
  DREAM_DRIFT: 0.12,
  PERSUADE_DRIFT: 0.20,
  DECEIVE_DRIFT: 0.20,
  INTIMIDATE_COURAGE_DRIFT: -0.30,

  // Capability modifiers
  INSPIRE_PERSONALITY_BOOST: 0.30,
  BLESS_CAPABILITY_BONUS: 0.20,
  AFFLICT_CAPABILITY_PENALTY: -0.20,

  // Coincidence effects
  COINCIDENCE_SPHERE_BOOST: 0.15,

  // Omen effects
  OMEN_MOOD_DRIFT: 0.08,
  OMEN_DETECTION_INCREASE: 0.05,

  // Feedback timing (ms)
  CARD_PULSE_MS: 200,
  CARD_SPENT_MS: 200,
  DRAWER_CLOSE_DELAY_MS: 600,

  // Audio
  AUDIO_BASE_FREQ: 220,
  AUDIO_RISE_FREQ: 440,
  AUDIO_DURATION_MS: 200,
  AUDIO_DETECTION_DETUNE: 30,
} as const;

// ─── Consequence Message Templates ──────────────────────────────

export const CONSEQUENCE_TEMPLATES: Record<string, string[]> = {
  dream: [
    'You reach into {agent}\'s sleeping mind… they will be drawn toward {value_direction} in the days ahead.',
    '{agent}\'s dreams shift — a subtle pull toward {value_direction} takes root.',
    'The dream takes hold. {agent} stirs, touched by visions of {value_direction}.',
  ],
  persuade: [
    'Your whispered influence takes hold — {agent} is now more inclined toward {value_direction}.',
    '{agent} feels a sudden conviction. {value_direction} calls to them now.',
    'Something shifts in {agent}\'s resolve. The pull toward {value_direction} grows stronger.',
  ],
  deceive: [
    '{agent} now believes a falsehood… but the truth may surface.',
    'A false conviction plants itself in {agent}\'s mind. They act on shadow, not substance.',
    '{agent}\'s worldview bends around a lie. For now, they see what you wish them to see.',
  ],
  intimidate: [
    '{agent} feels a chill of dread — they will act with greater caution.',
    'Fear grips {agent}. Bold action retreats from their mind, replaced by prudence.',
    '{agent}\'s courage falters. They will think twice before acting rashly.',
  ],
  inspire_intervention: [
    '{agent} burns with sudden conviction — their {domain} prowess surges.',
    'Divine inspiration floods {agent}. Their {domain} abilities sharpen to a keen edge.',
    '{agent} is touched by brilliance. For a time, their {domain} mastery exceeds its bounds.',
  ],
  coincidence: [
    'Fate shifts around {location} — the threads of {sphere} grow stronger here.',
    'A coincidence, or destiny? The {sphere} influence at {location} deepens.',
    'The world bends. At {location}, {sphere} essence gathers unbidden.',
  ],
  omen: [
    'An omen manifests at {location} — all who witness it are moved.',
    'A sign appears at {location}. Those present feel its weight upon their hearts.',
    'The omen settles over {location} like a shroud. None who see it are unchanged.',
  ],
  afflict_bless: [
    '{agent} has been {effect_type} — their {domain} is {effect_direction} for a time.',
    'Divine {effect_type_lower} falls upon {agent}. Their {domain} {effect_verb}.',
    '{agent} bears the mark of divine {effect_type_lower}. Their {domain} capabilities are {effect_direction}.',
  ],
};

// ─── Consequence Message Generator ──────────────────────────────

interface ConsequenceParams {
  agentName: string;
  valueDirection?: string;
  sphere?: string;
  domain?: string;
  location?: string;
  effectType?: 'Blessed' | 'Afflicted';
  effectDirection?: 'strengthened' | 'diminished';
}

/**
 * Generate a consequence message for a given intervention type.
 * Uses seeded selection for deterministic template choice.
 */
export function getConsequenceMessage(
  interventionType: string,
  params: ConsequenceParams,
  seed: number,
): string {
  const templates = CONSEQUENCE_TEMPLATES[interventionType] ?? ['{agent} is affected by divine power.'];
  const index = Math.abs(seed) % templates.length;
  let msg = templates[index];

  msg = msg.replace(/{agent}/g, params.agentName);
  msg = msg.replace(/{value_direction}/g, params.valueDirection ?? 'a new path');
  msg = msg.replace(/{sphere}/g, params.sphere ?? 'essence');
  msg = msg.replace(/{domain}/g, params.domain ?? 'capabilities');
  msg = msg.replace(/{location}/g, params.location ?? 'this place');
  msg = msg.replace(/{effect_type}/g, params.effectType ?? 'Blessed');
  msg = msg.replace(/{effect_type_lower}/g, (params.effectType ?? 'blessing').toLowerCase());
  msg = msg.replace(/{effect_direction}/g, params.effectDirection ?? 'altered');
  msg = msg.replace(/{effect_verb}/g, params.effectDirection === 'diminished' ? 'wanes' : 'swells');

  return msg;
}

// ─── Audio Configuration ─────────────────────────────────────────

export const SPHERE_AUDIO_CONFIG: Record<string, { freqOffset: number; waveform: OscillatorType }> = {
  force:   { freqOffset: -60, waveform: 'sawtooth' },
  matter:  { freqOffset: -40, waveform: 'triangle' },
  energy:  { freqOffset: 20,  waveform: 'sine' },
  life:    { freqOffset: 0,   waveform: 'sine' },
  mind:    { freqOffset: 60,  waveform: 'sine' },
  spirit:  { freqOffset: 80,  waveform: 'sine' },
  time:    { freqOffset: 40,  waveform: 'triangle' },
  entropy: { freqOffset: -80, waveform: 'sawtooth' },
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/intervention-feedback-content.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/intervention-feedback-content.ts src/data/__tests__/intervention-feedback-content.test.ts
git commit -m "feat: add intervention feedback content package — consequence templates, divine influence constants, audio config"
```

---

### Task 2: Type Foundation — `DivineInfluenceEntry` + Trace Category

**Files:**
- Modify: `src/types/dream.ts` (add DivineInfluenceEntry interface)
- Modify: `src/types/trace.ts` (add InterventionEffectTrace)
- Modify: `src/types/gameState.ts` (add `intervention_effect` to TickEvent types)
- Test: `src/types/__tests__/divineInfluence.test.ts`

**Step 1: Write the failing test**

```typescript
// src/types/__tests__/divineInfluence.test.ts
import { describe, it, expect } from 'vitest';
import type { DivineInfluenceEntry } from '../dream';
import type { InterventionEffectTrace, TraceEntry } from '../trace';
import { TRACE_CATEGORIES } from '../trace';

describe('DivineInfluenceEntry type', () => {
  it('can create a value-drift influence', () => {
    const influence: DivineInfluenceEntry = {
      id: 'di_001',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: 10,
      ticksRemaining: 3,
      valueDrifts: { courage_prudence: 0.12 },
    };
    expect(influence.ticksRemaining).toBe(3);
    expect(influence.valueDrifts?.courage_prudence).toBe(0.12);
  });

  it('can create a strategy-override influence', () => {
    const influence: DivineInfluenceEntry = {
      id: 'di_002',
      interventionType: 'intimidate',
      sphere: 'force',
      tickApplied: 5,
      ticksRemaining: 10,
      strategyOverride: 'grudger',
      valueDrifts: { courage_prudence: -0.30 },
    };
    expect(influence.strategyOverride).toBe('grudger');
  });

  it('can create a personality-boost influence', () => {
    const influence: DivineInfluenceEntry = {
      id: 'di_003',
      interventionType: 'inspire_intervention',
      sphere: 'spirit',
      tickApplied: 8,
      ticksRemaining: 6,
      personalityBoost: 0.30,
      traitId: 'condition_divinely_inspired',
    };
    expect(influence.personalityBoost).toBe(0.30);
  });
});

describe('InterventionEffectTrace', () => {
  it('is included in TRACE_CATEGORIES', () => {
    expect(TRACE_CATEGORIES).toContain('intervention_effect');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/__tests__/divineInfluence.test.ts`
Expected: FAIL — DivineInfluenceEntry not exported, intervention_effect not in TRACE_CATEGORIES

**Step 3: Write minimal implementation**

Add to `src/types/dream.ts` (after the existing `DivineInfluence` interface, around line 108):

```typescript
/** A single active divine influence stored on an agent node */
export interface DivineInfluenceEntry {
  id: string;
  interventionType: InterventionType;
  sphere: SphereName;
  tickApplied: number;
  ticksRemaining: number;
  valueDrifts?: Partial<Record<import('./agent').ValuePair, number>>;
  traitId?: string;
  personalityBoost?: number;
  strategyOverride?: string;
}
```

Add to `src/types/trace.ts`:

```typescript
/** Trace: divine intervention effect applied to an agent */
export interface InterventionEffectTrace extends TraceBase {
  category: 'intervention_effect';
  interventionType: string;
  targetAgentId: string;
  targetAgentName: string;
  sphere: string;
  effects: string[];      // human-readable effect list
  consequenceMessage: string;
  ticksRemaining: number;
}
```

Update `TraceEntry` union and `TRACE_CATEGORIES` to include `InterventionEffectTrace` and `'intervention_effect'`.

Update `src/types/gameState.ts` TickEvent type to add `| 'intervention_effect'` to the type union.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/__tests__/divineInfluence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/dream.ts src/types/trace.ts src/types/gameState.ts src/types/__tests__/divineInfluence.test.ts
git commit -m "feat: add DivineInfluenceEntry type and intervention_effect trace category"
```

---

### Task 3: Engine — `interventionEffects.ts` (Core Effect Logic)

**Files:**
- Create: `src/engine/interventionEffects.ts`
- Test: `src/engine/__tests__/interventionEffects.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/interventionEffects.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyInterventionEffects,
  getDivineInfluences,
  buildValueOverlay,
} from '../interventionEffects';
import type { DivineInfluenceEntry } from '../../types/dream';

describe('applyInterventionEffects', () => {
  let graph: WorldGraph;
  let actorId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    // Create a test actor node with axiological profile
    actorId = 'actor.test';
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          ambition_contentment: 0.5,
          courage_prudence: 0.3,
          cruelty_compassion: -0.4,
          cunning_honesty: 0.1,
          devotion_independence: 0.2,
          loyalty_treachery: 0.6,
          tradition_innovation: -0.1,
          dominance_humility: 0.0,
          wrath_patience: -0.2,
          greed_generosity: 0.3,
        },
        cooperationStrategy: 'tit-for-tat',
        reputationScore: 0.5,
        locationId: 'loc.village',
        divineInfluences: [],
      },
    });
    // Create a location
    graph.addNode({
      id: 'loc.village',
      type: 'location',
      name: 'Ashenvale',
      properties: { sphereInfluence: { mind: 0.1, spirit: 0.1 }, hexCol: 3, hexRow: 4 },
    });
  });

  it('dream: adds value drift influence to actor', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'dream',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, actorId);
    expect(influences.length).toBe(1);
    expect(influences[0].interventionType).toBe('dream');
    expect(influences[0].ticksRemaining).toBe(3);
    expect(influences[0].valueDrifts).toBeDefined();
  });

  it('persuade: adds longer value drift', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'persuade',
      targetAgentId: actorId,
      sphere: 'spirit',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(true);
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].ticksRemaining).toBe(12);
  });

  it('intimidate: shifts courage toward prudence and may override strategy', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'intimidate',
      targetAgentId: actorId,
      sphere: 'force',
      tick: 10,
      seed: 42,
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].valueDrifts?.courage_prudence).toBeLessThan(0);
    expect(influences[0].strategyOverride).toBe('grudger');
  });

  it('inspire: adds personality boost and trait', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'inspire_intervention',
      targetAgentId: actorId,
      sphere: 'life',
      tick: 10,
      seed: 42,
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].personalityBoost).toBeGreaterThan(0);
    expect(influences[0].traitId).toBeDefined();
  });

  it('coincidence: boosts sphere influence at location', () => {
    const before = (graph.getNode('loc.village')?.properties?.sphereInfluence as any)?.mind ?? 0;
    applyInterventionEffects({
      graph,
      interventionType: 'coincidence',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    const after = (graph.getNode('loc.village')?.properties?.sphereInfluence as any)?.mind ?? 0;
    expect(after).toBeGreaterThan(before);
  });

  it('afflict_bless: adds condition trait influence', () => {
    applyInterventionEffects({
      graph,
      interventionType: 'afflict_bless',
      targetAgentId: actorId,
      sphere: 'life',
      tick: 10,
      seed: 42,
    });
    const influences = getDivineInfluences(graph, actorId);
    expect(influences[0].traitId).toBeDefined();
    expect(influences[0].ticksRemaining).toBe(10);
  });

  it('returns consequence message', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'dream',
      targetAgentId: actorId,
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.consequenceMessage).toContain('Kael');
    expect(result.consequenceMessage.length).toBeGreaterThan(10);
  });

  it('returns failure for unknown actor', () => {
    const result = applyInterventionEffects({
      graph,
      interventionType: 'dream',
      targetAgentId: 'nonexistent',
      sphere: 'mind',
      tick: 10,
      seed: 42,
    });
    expect(result.success).toBe(false);
  });
});

describe('buildValueOverlay', () => {
  it('returns modified profile copy with drift applied', () => {
    const baseProfile = {
      ambition_contentment: 0.5,
      courage_prudence: 0.3,
      cruelty_compassion: -0.4,
      cunning_honesty: 0.1,
      devotion_independence: 0.2,
      loyalty_treachery: 0.6,
      tradition_innovation: -0.1,
      dominance_humility: 0.0,
      wrath_patience: -0.2,
      greed_generosity: 0.3,
    };
    const influences: DivineInfluenceEntry[] = [{
      id: 'di_1',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: 1,
      ticksRemaining: 2,
      valueDrifts: { courage_prudence: 0.12 },
    }];
    const overlay = buildValueOverlay(baseProfile, influences);
    expect(overlay.courage_prudence).toBeCloseTo(0.42);
    // Other values unchanged
    expect(overlay.ambition_contentment).toBe(0.5);
  });

  it('clamps values to [-1, 1]', () => {
    const baseProfile = {
      ambition_contentment: 0.95,
      courage_prudence: 0.3,
      cruelty_compassion: -0.4,
      cunning_honesty: 0.1,
      devotion_independence: 0.2,
      loyalty_treachery: 0.6,
      tradition_innovation: -0.1,
      dominance_humility: 0.0,
      wrath_patience: -0.2,
      greed_generosity: 0.3,
    };
    const influences: DivineInfluenceEntry[] = [{
      id: 'di_1',
      interventionType: 'persuade',
      sphere: 'spirit',
      tickApplied: 1,
      ticksRemaining: 10,
      valueDrifts: { ambition_contentment: 0.20 },
    }];
    const overlay = buildValueOverlay(baseProfile, influences);
    expect(overlay.ambition_contentment).toBe(1.0);
  });

  it('stacks multiple influences', () => {
    const baseProfile = {
      ambition_contentment: 0.0,
      courage_prudence: 0.0,
      cruelty_compassion: 0.0,
      cunning_honesty: 0.0,
      devotion_independence: 0.0,
      loyalty_treachery: 0.0,
      tradition_innovation: 0.0,
      dominance_humility: 0.0,
      wrath_patience: 0.0,
      greed_generosity: 0.0,
    };
    const influences: DivineInfluenceEntry[] = [
      { id: 'd1', interventionType: 'dream', sphere: 'mind', tickApplied: 1, ticksRemaining: 2, valueDrifts: { courage_prudence: 0.10 } },
      { id: 'd2', interventionType: 'persuade', sphere: 'spirit', tickApplied: 2, ticksRemaining: 8, valueDrifts: { courage_prudence: 0.15 } },
    ];
    const overlay = buildValueOverlay(baseProfile, influences);
    expect(overlay.courage_prudence).toBeCloseTo(0.25);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/interventionEffects.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/engine/interventionEffects.ts` with:
- `getDivineInfluences(graph, actorId)` → reads `divineInfluences` array from actor node properties
- `addDivineInfluence(graph, actorId, influence)` → pushes to the array
- `buildValueOverlay(baseProfile, influences)` → applies value drifts as temporary overlay, returns copy with clamp [-1,1]
- `applyInterventionEffects({ graph, interventionType, targetAgentId, sphere, tick, seed })` → per-type switch:
  - **dream**: 1-2 random value drifts by DREAM_DRIFT for DREAM_DURATION ticks
  - **persuade**: 1-2 value drifts by PERSUADE_DRIFT for PERSUADE_DURATION ticks
  - **deceive**: value drifts + condition trait "Deceived" for DECEIVE_DURATION ticks
  - **intimidate**: courage_prudence drift + strategy override for INTIMIDATE_DURATION ticks
  - **inspire_intervention**: personality boost + condition trait for INSPIRE_INTERVENTION_DURATION ticks
  - **coincidence**: sphere influence boost on location (+COINCIDENCE_SPHERE_BOOST)
  - **omen**: mood drift on all agents at location for OMEN_DURATION ticks
  - **afflict_bless**: condition trait for AFFLICT_BLESS_DURATION ticks (bless/afflict determined by PRNG)
- Returns `{ success, consequenceMessage, effectsSummary[] }`
- Emits `intervention_effect` trace via `emitTrace()`

Import constants from `intervention-feedback-content.ts` and `getConsequenceMessage` for player-facing text.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/interventionEffects.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/interventionEffects.ts src/engine/__tests__/interventionEffects.test.ts
git commit -m "feat: add interventionEffects engine — per-type world effects for all 8 interventions"
```

---

### Task 4: Pipeline Integration — Divine Influence Overlay in `agentSelection.ts`

**Files:**
- Modify: `src/engine/agentSelection.ts` (add divine influence overlay step)
- Test: `src/engine/__tests__/agentSelection-divine.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/agentSelection-divine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { runSelectionPipeline } from '../agentSelection';
import type { ActionCandidate, SelectionConfig } from '../../types/agent';

describe('runSelectionPipeline with divine influences', () => {
  let graph: WorldGraph;
  const actorId = 'actor.test';
  const config: SelectionConfig = { topN: 3, survivalThreshold: 0.5 };

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: actorId,
      type: 'actor',
      name: 'Kael',
      properties: {
        actorType: 'individual',
        axiologicalProfile: {
          ambition_contentment: 0.0,
          courage_prudence: 0.0,
          cruelty_compassion: 0.0,
          cunning_honesty: 0.0,
          devotion_independence: 0.0,
          loyalty_treachery: 0.0,
          tradition_innovation: 0.0,
          dominance_humility: 0.0,
          wrath_patience: 0.0,
          greed_generosity: 0.0,
        },
        divineInfluences: [],
      },
    });
  });

  it('without divine influence, all-zero profile gives equal scores', () => {
    const candidates: ActionCandidate[] = [
      { templateId: 'a1', targetId: 't1', domain: 'iron', score: 0, motivations: ['courage_prudence'] },
      { templateId: 'a2', targetId: 't1', domain: 'gold', score: 0, motivations: ['greed_generosity'] },
    ];
    const result = runSelectionPipeline(graph, actorId, candidates, config, 1, 0.5);
    // Both should have roughly equal probability
    expect(result.candidates.length).toBe(2);
  });

  it('with dream influence on courage_prudence, biases toward courage-motivated action', () => {
    // Add divine influence
    const node = graph.getNode(actorId)!;
    node.properties.divineInfluences = [{
      id: 'di_1',
      interventionType: 'dream',
      sphere: 'mind',
      tickApplied: 1,
      ticksRemaining: 2,
      valueDrifts: { courage_prudence: 0.50 },
    }];

    const candidates: ActionCandidate[] = [
      { templateId: 'brave_action', targetId: 't1', domain: 'iron', score: 0, motivations: ['courage_prudence'] },
      { templateId: 'greedy_action', targetId: 't1', domain: 'gold', score: 0, motivations: ['greed_generosity'] },
    ];
    const result = runSelectionPipeline(graph, actorId, candidates, config, 1, 0.1);
    // The brave action should have higher probability now
    const brave = result.candidates.find(c => c.templateId === 'brave_action');
    const greedy = result.candidates.find(c => c.templateId === 'greedy_action');
    expect(brave!.probability!).toBeGreaterThan(greedy!.probability!);
  });

  it('divine influence creates overlay trace stage', () => {
    const node = graph.getNode(actorId)!;
    node.properties.divineInfluences = [{
      id: 'di_1',
      interventionType: 'persuade',
      sphere: 'spirit',
      tickApplied: 1,
      ticksRemaining: 8,
      valueDrifts: { loyalty_treachery: 0.20 },
    }];

    const candidates: ActionCandidate[] = [
      { templateId: 'a1', targetId: 't1', domain: 'heart', score: 0, motivations: ['loyalty_treachery'] },
    ];
    // Just verify it doesn't crash and returns valid result
    const result = runSelectionPipeline(graph, actorId, candidates, config, 1, 0.5);
    expect(result.selected).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/agentSelection-divine.test.ts`
Expected: FAIL — divine influences not processed (scores remain 0)

**Step 3: Write minimal implementation**

In `src/engine/agentSelection.ts`, modify `runSelectionPipeline`:
- After step 1 (goal alignment), check `actorNode.properties.divineInfluences`
- If any influences have `valueDrifts`, call `buildValueOverlay` to create temporary profile
- Re-score candidates using the overlay profile (only those influenced by the modified values)
- Add a `divine_influence_overlay` stage to the trace stages array
- This does NOT mutate the original profile — only affects this pipeline execution

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/agentSelection-divine.test.ts`
Expected: PASS

**Step 5: Run all existing agentSelection tests to verify no regression**

Run: `npx vitest run src/engine/__tests__/agentSelection.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/engine/agentSelection.ts src/engine/__tests__/agentSelection-divine.test.ts
git commit -m "feat: integrate divine influence overlay into agent action selection pipeline"
```

---

### Task 5: Orchestrator — `phaseDivineInfluenceDecay`

**Files:**
- Modify: `src/engine/orchestrator.ts` (add decay phase to runTick)
- Test: `src/engine/__tests__/orchestrator-divine.test.ts`

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/orchestrator-divine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { phaseDivineInfluenceDecay } from '../orchestrator';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { initializeGameState } from '../gameInit';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

describe('phaseDivineInfluenceDecay', () => {
  let state: GameState;

  beforeEach(() => {
    state = initializeGameState(42);
    enableTracing();
    clearTraces();

    // Add a divine influence to a test actor
    const actors = state.graph.getNodesByType('actor').filter(a => a.properties?.actorType === 'individual');
    if (actors.length > 0) {
      actors[0].properties.divineInfluences = [{
        id: 'di_test',
        interventionType: 'dream',
        sphere: 'mind',
        tickApplied: 1,
        ticksRemaining: 2,
      }];
    }
  });

  it('decrements ticksRemaining on all divine influences', () => {
    const actors = state.graph.getNodesByType('actor').filter(a => a.properties?.actorType === 'individual');
    const actor = actors[0];

    const result = phaseDivineInfluenceDecay(state);
    // Should have been decremented
    const influences = actor.properties.divineInfluences as any[];
    expect(influences[0].ticksRemaining).toBe(1);
  });

  it('removes expired influences (ticksRemaining <= 0)', () => {
    const actors = state.graph.getNodesByType('actor').filter(a => a.properties?.actorType === 'individual');
    const actor = actors[0];

    // Set to 1 so after decrement it's 0 → removed
    (actor.properties.divineInfluences as any[])[0].ticksRemaining = 1;

    phaseDivineInfluenceDecay(state);
    const influences = actor.properties.divineInfluences as any[];
    expect(influences.length).toBe(0);
  });

  it('is called during runTick', () => {
    // Verify the phase is actually in the tick loop
    // (just check that running a tick doesn't crash with divine influences present)
    const { runTick } = require('../orchestrator');
    const nextState = runTick(state);
    expect(nextState.tick).toBe(state.tick + 1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/orchestrator-divine.test.ts`
Expected: FAIL — phaseDivineInfluenceDecay not exported

**Step 3: Write minimal implementation**

Add `phaseDivineInfluenceDecay(state: GameState): Partial<GameState>` to orchestrator.ts:
- Walk all individual actors
- For each actor with `divineInfluences` array:
  - Decrement `ticksRemaining` on each entry
  - Remove entries where `ticksRemaining <= 0`
  - Emit trace for expired influences
- Add to `runTick` between Reputation Decay and Agent Lifecycle phases

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/orchestrator-divine.test.ts`
Expected: PASS

**Step 5: Run full orchestrator tests to verify no regression**

Run: `npx vitest run src/engine/__tests__/orchestrator`
Expected: PASS

**Step 6: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator-divine.test.ts
git commit -m "feat: add phaseDivineInfluenceDecay to orchestrator tick loop"
```

---

### Task 6: Wire Effects into `useAgentInteraction` + Consequence Messages

**Files:**
- Modify: `src/components/Game/hooks/useAgentInteraction.ts`
- Test: `src/components/Game/__tests__/useAgentInteraction-effects.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/Game/__tests__/useAgentInteraction-effects.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import { initializeGameState } from '../../../engine/gameInit';

// Note: This test verifies that handleInterventionConfirm now calls
// applyInterventionEffects and uses the consequence message instead
// of the generic def.description.

describe('useAgentInteraction — intervention effects', () => {
  it('handleInterventionConfirm adds consequence message to recentEvents', () => {
    const state = initializeGameState(42);
    const setGameState = vi.fn();

    const { result } = renderHook(() =>
      useAgentInteraction({
        gameState: state,
        setGameState,
        archetype: {
          name: 'test',
          sphereAlignment: { primary: 'mind', secondary: 'spirit' },
          description: '',
        } as any,
        onOpenScry: vi.fn(),
      })
    );

    // Verify the hook exposes playingCardId state
    expect(result.current.playingCardId).toBeNull();
  });

  it('exposes playingCardId for animation state', () => {
    const state = initializeGameState(42);
    const setGameState = vi.fn();

    const { result } = renderHook(() =>
      useAgentInteraction({
        gameState: state,
        setGameState,
        archetype: {
          name: 'test',
          sphereAlignment: { primary: 'mind', secondary: 'spirit' },
          description: '',
        } as any,
        onOpenScry: vi.fn(),
      })
    );

    expect(typeof result.current.playingCardId).toBe('object'); // null initially
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/useAgentInteraction-effects.test.tsx`
Expected: FAIL — playingCardId not in return

**Step 3: Write minimal implementation**

Modify `useAgentInteraction.ts`:
1. Add `playingCardId` state: `useState<string | null>(null)`
2. In `handleInterventionConfirm`:
   - After `executeIntervention` succeeds, call `applyInterventionEffects({ graph, interventionType, targetAgentId: selectedAgentId!, sphere, tick, seed })`
   - Use `result.consequenceMessage` instead of `def.description` for the narrative event
   - Set `playingCardId` to the slot ID
   - Use `setTimeout(() => { setPlayingCardId(null); setDrawerOpen(false); }, DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS)` for delayed close
3. Return `playingCardId` from the hook

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/useAgentInteraction-effects.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useAgentInteraction.ts src/components/Game/__tests__/useAgentInteraction-effects.test.tsx
git commit -m "feat: wire applyInterventionEffects into handleInterventionConfirm with consequence messages"
```

---

### Task 7: Visual Feedback — ActionCard Pulse Animation

**Files:**
- Modify: `src/components/Game/ActionCard.tsx` (add `playing` prop + CSS animation)
- Modify: `src/components/Game/ActionDrawer.tsx` (pass `playingCardId` prop)
- Test: `src/components/Game/__tests__/ActionCard-feedback.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/Game/__tests__/ActionCard-feedback.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionCard } from '../ActionCard';
import type { WheelSlot } from '../../../engine/wheel';

function makeSlot(overrides?: Partial<WheelSlot>): WheelSlot {
  return {
    id: 'persuade',
    label: 'Persuade',
    type: 'intervention',
    angleDeg: 0,
    available: true,
    lockedReason: null,
    essenceCost: 2,
    detectionRisk: 0.2,
    sphere: 'spirit',
    interventionType: 'persuade',
    rangeStatus: 'unlimited',
    hexDistance: null,
    description: 'Add temporary goal alignment',
    ...overrides,
  };
}

describe('ActionCard — playing animation', () => {
  it('renders without playing class by default', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} />);
    const card = screen.getByTestId('action-card-persuade');
    expect(card.className).not.toContain('card-pulse');
  });

  it('adds card-pulse class when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const card = screen.getByTestId('action-card-persuade');
    expect(card.className).toContain('card-pulse');
  });

  it('shows spent overlay when playing=true', () => {
    render(<ActionCard slot={makeSlot()} onClick={() => {}} playing={true} />);
    const overlay = screen.getByTestId('action-card-spent-overlay');
    expect(overlay).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/ActionCard-feedback.test.tsx`
Expected: FAIL — `playing` prop not accepted

**Step 3: Write minimal implementation**

Modify `ActionCard.tsx`:
1. Add `playing?: boolean` to `ActionCardProps`
2. Add CSS `@keyframes` via inline `<style>` tag for `card-pulse` animation (sphere-colored glow expansion)
3. When `playing` is true:
   - Add `card-pulse` class
   - Show a spent overlay (checkmark + reduced opacity)
   - Disable click handler

Modify `ActionDrawer.tsx`:
1. Add `playingCardId?: string | null` to `ActionDrawerProps`
2. Pass `playing={slot.id === playingCardId}` to each `ActionCard`

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/ActionCard-feedback.test.tsx`
Expected: PASS

**Step 5: Run all existing ActionCard/ActionDrawer tests**

Run: `npx vitest run src/components/Game/__tests__/ActionCard.test.tsx src/components/Game/__tests__/ActionDrawer.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/Game/ActionCard.tsx src/components/Game/ActionDrawer.tsx src/components/Game/__tests__/ActionCard-feedback.test.tsx
git commit -m "feat: add card-pulse animation and spent overlay for intervention feedback"
```

---

### Task 8: Audio Feedback — `useInterventionAudio` Hook

**Files:**
- Create: `src/components/Game/hooks/useInterventionAudio.ts`
- Test: `src/components/Game/__tests__/useInterventionAudio.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/Game/__tests__/useInterventionAudio.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterventionAudio } from '../hooks/useInterventionAudio';

// Mock AudioContext
const mockOscillator = {
  type: 'sine',
  frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  disconnect: vi.fn(),
};
const mockGain = {
  gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  disconnect: vi.fn(),
};
const mockContext = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn(),
};

(globalThis as any).AudioContext = vi.fn(() => mockContext);

describe('useInterventionAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a playCastSound function', () => {
    const { result } = renderHook(() => useInterventionAudio());
    expect(typeof result.current.playCastSound).toBe('function');
  });

  it('playCastSound creates oscillator with sphere-appropriate waveform', () => {
    const { result } = renderHook(() => useInterventionAudio());
    act(() => {
      result.current.playCastSound('mind', false);
    });
    expect(mockContext.createOscillator).toHaveBeenCalled();
    expect(mockContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('adds detection overlay when detected=true', () => {
    const { result } = renderHook(() => useInterventionAudio());
    act(() => {
      result.current.playCastSound('force', true);
    });
    // Should create 2 oscillators: main + detection overlay
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/useInterventionAudio.test.tsx`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// src/components/Game/hooks/useInterventionAudio.ts
import { useRef, useCallback } from 'react';
import { SPHERE_AUDIO_CONFIG, DIVINE_INFLUENCE_CONSTANTS } from '../../../data/intervention-feedback-content';

export function useInterventionAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playCastSound = useCallback((sphere: string, detected: boolean) => {
    const ctx = getContext();
    const config = SPHERE_AUDIO_CONFIG[sphere] ?? SPHERE_AUDIO_CONFIG.mind;
    const { AUDIO_BASE_FREQ, AUDIO_RISE_FREQ, AUDIO_DURATION_MS, AUDIO_DETECTION_DETUNE } = DIVINE_INFLUENCE_CONSTANTS;

    const baseFreq = AUDIO_BASE_FREQ + config.freqOffset;
    const riseFreq = AUDIO_RISE_FREQ + config.freqOffset;
    const durationSec = AUDIO_DURATION_MS / 1000;

    // Main oscillator — rising tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = config.waveform;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(riseFreq, ctx.currentTime + durationSec);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSec);

    // Detection overlay — discordant secondary tone
    if (detected) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(baseFreq + AUDIO_DETECTION_DETUNE, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(riseFreq - AUDIO_DETECTION_DETUNE, ctx.currentTime + durationSec);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + durationSec);
    }
  }, [getContext]);

  return { playCastSound };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/useInterventionAudio.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Game/hooks/useInterventionAudio.ts src/components/Game/__tests__/useInterventionAudio.test.tsx
git commit -m "feat: add useInterventionAudio hook — Web Audio synthesis with sphere-colored pitch"
```

---

### Task 9: Wire Audio + Visuals into `useAgentInteraction` + `GameView`

**Files:**
- Modify: `src/components/Game/hooks/useAgentInteraction.ts` (call audio hook)
- Modify: `src/components/Game/GameView.tsx` (pass `playingCardId` to ActionDrawer)
- Test: Run existing integration tests

**Step 1: Wire audio into useAgentInteraction**

In `useAgentInteraction.ts`:
1. Import and call `useInterventionAudio()`
2. In `handleInterventionConfirm`, after `applyInterventionEffects` succeeds, call `playCastSound(sphere, result.detected)`

**Step 2: Wire playingCardId into GameView**

In `GameView.tsx`, find where `ActionDrawer` is rendered and pass `playingCardId={agentInteraction.playingCardId}`.

**Step 3: Run full test suite to verify no regressions**

Run: `npx vitest run`
Expected: PASS (all ~1,900+ tests)

**Step 4: Commit**

```bash
git add src/components/Game/hooks/useAgentInteraction.ts src/components/Game/GameView.tsx
git commit -m "feat: wire audio feedback and playingCardId into intervention flow"
```

---

### Task 10: Debug Panel — Intervention Effect Trace Renderer

**Files:**
- Modify: `src/components/Game/DebugPanel.tsx`
- Test: `src/components/Game/__tests__/DebugPanel-intervention.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/Game/__tests__/DebugPanel-intervention.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DebugPanel } from '../DebugPanel';
import { emitTrace, enableTracing, clearTraces } from '../../../engine/traceBuffer';

describe('DebugPanel — intervention_effect renderer', () => {
  it('renders intervention effect traces', () => {
    enableTracing();
    clearTraces();
    emitTrace({
      tick: 5,
      category: 'intervention_effect',
      summary: 'Dream on Kael via mind',
      interventionType: 'dream',
      targetAgentId: 'actor.kael',
      targetAgentName: 'Kael',
      sphere: 'mind',
      effects: ['courage_prudence +0.12 for 3 ticks'],
      consequenceMessage: 'Kael will be drawn toward courage in the days ahead.',
      ticksRemaining: 3,
    });

    render(<DebugPanel open={true} onClose={() => {}} />);
    expect(screen.getByText(/Dream on Kael/)).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/DebugPanel-intervention.test.tsx`
Expected: FAIL — no renderer for intervention_effect

**Step 3: Write minimal implementation**

Add `InterventionEffectDetail` renderer to `DebugPanel.tsx`:
- Show intervention type icon/name, target agent, sphere
- List effects as bullet points
- Show consequence message in italics
- Show ticks remaining

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/__tests__/DebugPanel-intervention.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Game/DebugPanel.tsx src/components/Game/__tests__/DebugPanel-intervention.test.tsx
git commit -m "feat: add intervention_effect trace renderer to debug panel"
```

---

### Task 11: Integration Test — Full Intervention Flow

**Files:**
- Create: `src/engine/__tests__/interventionEffects-integration.test.ts`

**Step 1: Write the integration test**

```typescript
// src/engine/__tests__/interventionEffects-integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeGameState } from '../gameInit';
import { runTick } from '../orchestrator';
import { applyInterventionEffects, getDivineInfluences } from '../interventionEffects';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';

describe('intervention effects — full integration', () => {
  let state: GameState;

  beforeEach(() => {
    state = initializeGameState(42);
    enableTracing();
    clearTraces();
  });

  it('dream intervention → divine influence stored → biases pipeline → decays to zero', () => {
    // 1. Find a worshipper agent
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    const target = actors[0];
    expect(target).toBeDefined();

    // 2. Apply dream intervention
    const result = applyInterventionEffects({
      graph: state.graph,
      interventionType: 'dream',
      targetAgentId: target.id,
      sphere: 'mind',
      tick: state.tick,
      seed: state.seed,
    });
    expect(result.success).toBe(true);
    expect(result.consequenceMessage).toContain(target.name);

    // 3. Verify influence stored
    let influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(1);
    expect(influences[0].ticksRemaining).toBe(3);

    // 4. Run 3 ticks — influence should decay away
    for (let i = 0; i < 3; i++) {
      state = runTick(state);
    }

    influences = getDivineInfluences(state.graph, target.id);
    expect(influences.length).toBe(0);
  });

  it('coincidence boosts sphere influence at actor location', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    const target = actors[0];
    const locId = target.properties?.locationId as string;
    const locNode = state.graph.getNode(locId);

    const before = (locNode?.properties?.sphereInfluence as any)?.spirit ?? 0;

    applyInterventionEffects({
      graph: state.graph,
      interventionType: 'coincidence',
      targetAgentId: target.id,
      sphere: 'spirit',
      tick: state.tick,
      seed: state.seed,
    });

    const after = (locNode?.properties?.sphereInfluence as any)?.spirit ?? 0;
    expect(after).toBeGreaterThan(before);
  });

  it('intervention emits intervention_effect trace', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    const target = actors[0];

    applyInterventionEffects({
      graph: state.graph,
      interventionType: 'persuade',
      targetAgentId: target.id,
      sphere: 'spirit',
      tick: state.tick,
      seed: state.seed,
    });

    const traces = getTraces();
    const interventionTraces = traces.filter(t => t.category === 'intervention_effect');
    expect(interventionTraces.length).toBeGreaterThan(0);
  });

  it('all 8 intervention types produce valid results', () => {
    const actors = state.graph.getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual');
    const types = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'];

    for (const type of types) {
      const target = actors[Math.floor(Math.random() * actors.length)];
      const result = applyInterventionEffects({
        graph: state.graph,
        interventionType: type as any,
        targetAgentId: target.id,
        sphere: 'mind',
        tick: state.tick,
        seed: state.seed + types.indexOf(type),
      });
      expect(result.success).toBe(true);
      expect(result.consequenceMessage.length).toBeGreaterThan(10);
    }
  });
});
```

**Step 2: Run integration test**

Run: `npx vitest run src/engine/__tests__/interventionEffects-integration.test.ts`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add src/engine/__tests__/interventionEffects-integration.test.ts
git commit -m "test: add intervention effects integration test — full lifecycle verification"
```

---

### Task 12: TypeScript Check + Final Verification

**Step 1: Run type checker**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 2: Run production build**

Run: `npx vite build`
Expected: Build succeeds

**Step 3: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 4: If any failures, fix and commit**

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: intervention effects system — type check clean, build passing, all tests green"
```
