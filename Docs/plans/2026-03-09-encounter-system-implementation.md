# Encounter System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the non-functional ordeal system with a motivation-driven encounter system where agents choose encounters based on personality, sphere affinity, and threat rating, and encounters are visible in the LocationView UI.

**Architecture:** Rename ordeals→encounters across ~30 files, broaden the template schema with encounterType and threatRating, wire the existing Maslow selection pipeline into phaseAgentActions (replacing the current stub), create 60-80 encounter templates covering all 20 LocationSubtypes, and update LocationView to show available + active encounters.

**Tech Stack:** TypeScript, React, Vitest, existing engine modules (agentSelection.ts, resolution.ts, domainCapability.ts)

**Design doc:** `Docs/plans/2026-03-09-encounter-system-design.md`

---

## Task 1: Rename Types — ordeal → encounter

**Files:**
- Modify: `src/types/ordeal.ts` → rename to `src/types/encounter.ts`
- Modify: `src/types/gameState.ts:90` — rename `ordealProgress` → `encounterProgress`
- Modify: `src/types/trace.ts:80-82,129,140` — rename `OrdealResolutionTrace` → `EncounterResolutionTrace`, `ordeal_resolution` → `encounter_resolution`
- Tests: `src/types/__tests__/ordeal.test.ts` → rename to `src/types/__tests__/encounter.test.ts`

**Step 1: Create `src/types/encounter.ts` from ordeal.ts**

Copy `src/types/ordeal.ts` to `src/types/encounter.ts`. Apply these renames:
- `ORDEAL_MAX_ENCOUNTERS` → `ENCOUNTER_MAX_STEPS` (encounters have steps, not "encounters")
- `ORDEAL_BASE_DIFFICULTY` → `ENCOUNTER_BASE_DIFFICULTY`
- `ORDEAL_DIFFICULTY_ESCALATION` → `ENCOUNTER_DIFFICULTY_ESCALATION`
- `ORDEAL_ABANDON_COOLDOWN` → `ENCOUNTER_ABANDON_COOLDOWN`
- `ORDEAL_MASLOW_TIER` → `ENCOUNTER_MASLOW_TIER`
- `EncounterDefinition` → `EncounterStep` (the inner per-step definition)
- `OrdealDefinition` → `EncounterTemplate` (the outer multi-step template)
- `OrdealProgress` → `EncounterProgress`

Add new fields to `EncounterTemplate`:

```typescript
export type EncounterType =
  | 'explore' | 'acquire' | 'create' | 'hire' | 'duel'
  | 'steal' | 'trade' | 'assist' | 'build' | 'lead';

export type ThreatRating = 'trivial' | 'easy' | 'moderate' | 'hard' | 'deadly';

/** Maps threat rating to approximate capability band [min, max] on 0-100 scale */
export const THREAT_CAPABILITY_BANDS: Record<ThreatRating, [number, number]> = {
  trivial:  [0, 20],
  easy:     [15, 40],
  moderate: [30, 60],
  hard:     [50, 80],
  deadly:   [70, 100],
};

/** Courage threshold above which agents stretch one tier upward */
export const THREAT_COURAGE_THRESHOLD = 0.3;

/** Prudence threshold below which agents restrict one tier downward */
export const THREAT_PRUDENCE_THRESHOLD = -0.3;
```

On `EncounterTemplate`, add:
```typescript
  encounterType: EncounterType;
  threatRating: ThreatRating;
  /** Value pairs that drive agent preference for this encounter */
  motivations: ValuePair[];
```

Keep: `id`, `name`, `locationTypes`, `steps` (renamed from `encounters`), `reachPrimary`, `reachSecondary`, `sphereAffinity`, `culturalAffinity`.

**Step 2: Update `src/types/gameState.ts`**

Change line 90:
```typescript
  // Encounters (agent growth narratives)
  encounterProgress: EncounterProgress[];
```

Update import from `'../types/encounter'` instead of `'../types/ordeal'`.

**Step 3: Update `src/types/trace.ts`**

Rename `OrdealResolutionTrace` → `EncounterResolutionTrace`, `category: 'ordeal_resolution'` → `category: 'encounter_resolution'`, `ordealId` → `encounterId` (the template ID). Update `TraceEntry` union and `TRACE_CATEGORIES` array.

**Step 4: Rename and update test file**

Move `src/types/__tests__/ordeal.test.ts` → `src/types/__tests__/encounter.test.ts`. Update all references.

**Step 5: Run type checks**

Run: `npx tsc --noEmit 2>&1 | head -50`
Expected: Many errors from files still importing old ordeal types — that's fine, we fix them in subsequent tasks.

**Step 6: Commit**

```bash
git add src/types/encounter.ts src/types/gameState.ts src/types/trace.ts src/types/__tests__/encounter.test.ts
git rm src/types/ordeal.ts src/types/__tests__/ordeal.test.ts
git commit -m "feat: rename ordeal types → encounter types, add EncounterType + ThreatRating"
```

---

## Task 2: Rename Engine — ordeal.ts → encounter.ts

**Files:**
- Modify: `src/engine/ordeal.ts` → rename to `src/engine/encounter.ts`
- Modify: `src/data/ordeal-content.ts` → rename to `src/data/encounter-content.ts`
- Tests: Rename all ordeal test files

**Step 1: Create `src/engine/encounter.ts` from ordeal.ts**

Copy `src/engine/ordeal.ts` → `src/engine/encounter.ts`. Renames:
- `getAvailableOrdeals` → `getAvailableEncounters`
- `initiateOrdeal` → `initiateEncounter`
- `resolveEncounter` stays (already named correctly)
- `advanceOrdeal` → `advanceEncounter`
- `abandonOrdeal` → `abandonEncounter`
- `generateOrdealsForLocation` → `generateEncountersForLocation`
- All `ordealId` params → `encounterId`
- Import from `'../types/encounter'` instead of `'../types/ordeal'`
- Import from `'../data/encounter-content'` instead of `'../data/ordeal-content'`

**Critical fix in `getAvailableEncounters`:** Change the location type lookup:
```typescript
// OLD (broken): const locationType = locationNode.properties.locationType as string;
// NEW (fixed): use locationSubtype which has actual values
const locationType = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string | undefined;
```

**Step 2: Create `src/data/encounter-content.ts` from ordeal-content.ts**

Copy `src/data/ordeal-content.ts` → `src/data/encounter-content.ts`. Renames:
- `ORDEAL_TEMPLATES` → `ENCOUNTER_TEMPLATES`
- `ORDEAL_DIFFICULTY_TIERS` → `ENCOUNTER_DIFFICULTY_TIERS`
- `getOrdealsByLocationType` → `getEncountersByLocationType`
- `getOrdealById` → `getEncounterById`
- Import from `'../types/encounter'` instead of `'../types/ordeal'`

Remap all existing template `locationTypes` to actual `LocationSubtype` values:
```typescript
// OLD: locationTypes: ['dungeon', 'cavern']
// NEW: locationTypes: ['ruins', 'ruined_tower', 'ruined_city', 'mining']

// OLD: locationTypes: ['forge', 'mine', 'volcanic']
// NEW: locationTypes: ['mining', 'fort', 'camp']

// OLD: locationTypes: ['grove', 'monastery', 'temple']
// NEW: locationTypes: ['shrine', 'temple']

// OLD: locationTypes: ['market', 'port', 'bazaar']
// NEW: locationTypes: ['town', 'city', 'capital', 'oasis']

// OLD: locationTypes: ['dungeon', 'forest', 'ruin', 'city']
// NEW: locationTypes: ['ruins', 'ruined_village', 'ruined_city', 'city']

// OLD: locationTypes: ['academy', 'archive', 'library', 'tower']
// NEW: locationTypes: ['tower', 'temple', 'capital']

// OLD: locationTypes: ['fortress', 'battlefield', 'garrison']
// NEW: locationTypes: ['fort', 'castle', 'battleground']

// OLD: locationTypes: ['temple', 'monastery', 'sanctuary']
// NEW: locationTypes: ['temple', 'shrine']

// OLD: locationTypes: ['throne_room', 'market', 'cathedral']
// NEW: locationTypes: ['capital', 'city', 'town']

// OLD: locationTypes: ['hilltop', 'plain', 'tower', 'mountain']
// NEW: locationTypes: ['tower', 'fort', 'castle', 'camp']
```

Add `encounterType: 'explore'`, `threatRating: 'moderate'`, and `motivations: ['courage_prudence', 'ambition_contentment']` to all 10 existing templates (they were all "explore" type ordeals). Rename each template's `encounters` array to `steps`.

**Step 3: Rename test files**

```
src/engine/__tests__/ordeal.test.ts → src/engine/__tests__/encounter.test.ts
src/engine/__tests__/ordeal-orchestrator.test.ts → src/engine/__tests__/encounter-orchestrator.test.ts
src/engine/__tests__/traceBuffer-ordeal.test.ts → src/engine/__tests__/traceBuffer-encounter.test.ts
src/data/__tests__/ordeal-content.test.ts → src/data/__tests__/encounter-content.test.ts
```

Update all imports and references in each test file.

**Step 4: Delete old files**

```bash
git rm src/engine/ordeal.ts src/data/ordeal-content.ts
git rm src/engine/__tests__/ordeal.test.ts src/engine/__tests__/ordeal-orchestrator.test.ts
git rm src/engine/__tests__/traceBuffer-ordeal.test.ts src/data/__tests__/ordeal-content.test.ts
```

**Step 5: Run tests**

Run: `npx vitest run src/engine/__tests__/encounter.test.ts src/data/__tests__/encounter-content.test.ts --reporter=verbose 2>&1 | tail -20`
Expected: All existing ordeal tests pass under new names.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: rename ordeal engine + content → encounter, fix locationSubtype lookup"
```

---

## Task 3: Update All Consumers — Fix Broken Imports

**Files:**
- Modify: `src/engine/orchestrator.ts` — update imports, rename `phaseOrdealProgression` → `phaseEncounterProgression`
- Modify: `src/engine/gameInit.ts` — update imports, rename `ordealProgress` → `encounterProgress`
- Modify: `src/components/Game/LocationView.tsx` — update prop names
- Modify: `src/components/Game/DebugPanel.tsx` — update trace category name
- Modify: ~15 other files with ordeal references (test files, narrative-content, culture-content, chronicler-content, etc.)

**Step 1: Fix orchestrator.ts**

Update imports at line 40-44:
```typescript
import {
  getAvailableEncounters,
  initiateEncounter,
  resolveEncounter,
  advanceEncounter,
} from './encounter';
```

Rename function `phaseOrdealProgression` → `phaseEncounterProgression` (line 174).
Update line 754: `s = { ...s, ...phaseEncounterProgression(s) };`
Change all `state.ordealProgress` → `state.encounterProgress` within the function.

**Step 2: Fix gameInit.ts**

Change `ordealProgress: []` → `encounterProgress: []` in the GameState initialization.

**Step 3: Fix DebugPanel.tsx**

Rename `ordeal_resolution` → `encounter_resolution` in trace category handling.
Rename `OrdealResolutionTrace` → `EncounterResolutionTrace` in imports and type checks.

**Step 4: Fix all remaining files**

Use grep to find ALL remaining references:
```bash
grep -r "ordeal\|Ordeal\|ORDEAL" src/ --include="*.ts" --include="*.tsx" -l
```

For each file: update imports, type references, string literals, and variable names. Key files to check:
- `src/data/narrative-content.ts` — ordeal beat templates
- `src/data/culture-content.ts` — ordeal references in insider beats
- `src/data/chronicler-content.ts` — ordeal vignettes
- `src/data/uiColorPalette.ts` — ordeal color entries
- `src/engine/__tests__/content-full-integration.test.ts`
- `src/engine/__tests__/content-layer1-integration.test.ts`
- `src/engine/__tests__/visibility-integration.test.ts`
- `src/engine/__tests__/orchestrator.test.ts`
- `src/engine/__tests__/orchestrator-prose.test.ts`
- `src/engine/__tests__/cycleEnd.test.ts`
- `src/components/Game/__tests__/LocationView.test.tsx`

**Step 5: Run full type check + test suite**

Run: `npx tsc --noEmit && npx vitest run --reporter=verbose 2>&1 | tail -30`
Expected: Zero type errors, all ~2,110 tests pass.

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: update all ordeal→encounter references across 30 files"
```

---

## Task 4: Encounter Type → Value Pair Mapping + Candidate Generator

**Files:**
- Create: `src/engine/encounterCandidates.ts`
- Create: `src/engine/__tests__/encounterCandidates.test.ts`
- Modify: `src/types/encounter.ts` — add `ENCOUNTER_TYPE_MOTIVATIONS` constant

**Step 1: Write the mapping constant in `src/types/encounter.ts`**

```typescript
import type { ValuePair } from './agent';

/** Maps encounter type → value pairs that drive agent preference */
export const ENCOUNTER_TYPE_MOTIVATIONS: Record<EncounterType, ValuePair[]> = {
  explore:  ['courage_prudence', 'ambition_contentment'],
  acquire:  ['greed_generosity', 'ambition_contentment'],
  create:   ['tradition_innovation', 'devotion_independence'],
  hire:     ['dominance_humility', 'loyalty_treachery'],
  duel:     ['wrath_patience', 'courage_prudence'],
  steal:    ['cunning_honesty', 'greed_generosity'],
  trade:    ['greed_generosity', 'cunning_honesty'],
  assist:   ['cruelty_compassion', 'loyalty_treachery'],
  build:    ['tradition_innovation', 'devotion_independence'],
  lead:     ['dominance_humility', 'ambition_contentment'],
};
```

**Step 2: Write failing tests in `src/engine/__tests__/encounterCandidates.test.ts`**

Test the candidate generator:
```typescript
describe('generateEncounterCandidates', () => {
  it('returns candidates matching location subtype', ...);
  it('filters by threat rating vs agent capability', ...);
  it('maps encounter type to correct motivations', ...);
  it('includes targetId as location ID for non-social encounters', ...);
  it('includes targetId as other agent ID for duel/steal/assist/trade', ...);
  it('returns empty array for unknown location subtype', ...);
  it('courageous agents expand threat tolerance upward', ...);
  it('prudent agents restrict threat tolerance downward', ...);
  it('always includes at least one trivial encounter as fallback', ...);
});
```

**Step 3: Implement `src/engine/encounterCandidates.ts`**

```typescript
import type { WorldGraph } from './graph';
import type { ActionCandidate } from '../types/agent';
import type { EncounterTemplate, ThreatRating, THREAT_CAPABILITY_BANDS, THREAT_COURAGE_THRESHOLD, THREAT_PRUDENCE_THRESHOLD } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';
import { getEncountersByLocationType } from '../data/encounter-content';
import { computeCapability } from './domainCapability';

/** Threat rating tiers in order for ±1 expansion */
const THREAT_ORDER: ThreatRating[] = ['trivial', 'easy', 'moderate', 'hard', 'deadly'];

/**
 * Generate ActionCandidates from encounter templates available at an agent's location.
 * Filters by threat rating vs agent capability, maps motivations from encounter type.
 */
export function generateEncounterCandidates(
  graph: WorldGraph,
  actorId: string,
  locationId: string,
): ActionCandidate[] {
  const locationNode = graph.getNode(locationId);
  if (!locationNode) return [];

  const subtype = (locationNode.properties.locationSubtype ?? locationNode.properties.locationType) as string;
  const templates = getEncountersByLocationType(subtype);
  if (templates.length === 0) return [];

  // Compute agent capability in primary reach of each template
  const actorNode = graph.getNode(actorId);
  if (!actorNode) return [];

  const courageValue = (actorNode.properties.axiologicalProfile as Record<string, number>)?.courage_prudence ?? 0;

  const candidates: ActionCandidate[] = [];

  for (const template of templates) {
    const capability = computeCapability(graph, actorId, template.reachPrimary);

    if (!isWithinThreatTolerance(capability, template.threatRating, courageValue)) continue;

    // Determine target: for social encounters, pick another agent at location
    let targetId = locationId;
    if (['duel', 'steal', 'trade', 'assist'].includes(template.encounterType)) {
      const otherAgents = getOtherAgentsAtLocation(graph, actorId, locationId);
      if (otherAgents.length > 0) {
        targetId = otherAgents[0]; // First available; pipeline scoring will differentiate
      }
    }

    candidates.push({
      templateId: template.id,
      targetId,
      domain: template.reachPrimary,
      score: 0, // Pipeline fills this
      motivations: template.motivations ?? ENCOUNTER_TYPE_MOTIVATIONS[template.encounterType],
    });
  }

  // Fallback: if no candidates passed threat filter, include all trivial encounters
  if (candidates.length === 0) {
    const trivials = templates.filter(t => t.threatRating === 'trivial');
    for (const t of trivials) {
      candidates.push({
        templateId: t.id,
        targetId: locationId,
        domain: t.reachPrimary,
        score: 0,
        motivations: t.motivations ?? ENCOUNTER_TYPE_MOTIVATIONS[t.encounterType],
      });
    }
  }

  return candidates;
}

function isWithinThreatTolerance(capability: number, threat: ThreatRating, courageValue: number): boolean {
  const tierIndex = THREAT_ORDER.indexOf(threat);
  let minTier = Math.max(0, tierIndex - 1);
  let maxTier = Math.min(THREAT_ORDER.length - 1, tierIndex + 1);

  if (courageValue > THREAT_COURAGE_THRESHOLD) maxTier = Math.min(THREAT_ORDER.length - 1, maxTier + 1);
  if (courageValue < THREAT_PRUDENCE_THRESHOLD) minTier = Math.max(0, minTier + 1);

  for (let i = minTier; i <= maxTier; i++) {
    const [lo, hi] = THREAT_CAPABILITY_BANDS[THREAT_ORDER[i]];
    if (capability >= lo && capability <= hi) return true;
  }
  return false;
}

function getOtherAgentsAtLocation(graph: WorldGraph, actorId: string, locationId: string): string[] {
  const locatedAtEdges = graph.getIncomingEdges(locationId, 'located_at');
  return locatedAtEdges
    .map(e => e.source)
    .filter(id => id !== actorId);
}
```

**Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/encounterCandidates.test.ts --reporter=verbose`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/types/encounter.ts src/engine/encounterCandidates.ts src/engine/__tests__/encounterCandidates.test.ts
git commit -m "feat: encounter candidate generator with threat filtering + type→motivation mapping"
```

---

## Task 5: Wire Real Selection Pipeline into phaseAgentActions

**Files:**
- Modify: `src/engine/orchestrator.ts:102-170` — replace stub with real pipeline
- Create: `src/engine/__tests__/orchestrator-encounters.test.ts`

**Step 1: Write failing tests**

```typescript
describe('phaseAgentActions with real selection pipeline', () => {
  it('generates encounter candidates for each actor at their location', ...);
  it('calls runSelectionPipeline with generated candidates', ...);
  it('initiates selected encounter for the actor', ...);
  it('emits action_selection trace with encounter templateId', ...);
  it('skips actors with no available encounters', ...);
  it('skips actors already in active encounter', ...);
  it('respects action chance per tick (tunable constant)', ...);
  it('generates routine prose for non-encounter actions', ...);
});
```

**Step 2: Replace phaseAgentActions stub**

Replace lines 102-170 of `src/engine/orchestrator.ts`:

```typescript
/** Chance per tick that an agent considers an encounter */
const ENCOUNTER_ATTEMPT_CHANCE = 0.20; // 20% per tick (was 15% random action)

/** Minimum agents to keep doing routine actions (not everything is encounters) */
const ROUTINE_ACTION_CHANCE = 0.10; // 10% chance of a non-encounter routine action

export function phaseAgentActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 31);
  const events: TickEvent[] = [];

  const actors = state.graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual'
  );

  for (const actor of actors) {
    // Skip if already in an active encounter
    if (state.encounterProgress.some(p => p.actorId === actor.id && p.status === 'active')) continue;

    // Encounter attempt
    if (rng() < ENCOUNTER_ATTEMPT_CHANCE) {
      // Find actor's location
      const locEdges = state.graph.getOutgoingEdges(actor.id, 'located_at');
      if (locEdges.length === 0) continue;
      const locationId = locEdges[0].target;

      // Generate candidates from available encounters
      const candidates = generateEncounterCandidates(state.graph, actor.id, locationId);

      if (candidates.length > 0) {
        try {
          const result = runSelectionPipeline(
            state.graph,
            actor.id,
            candidates,
            { topN: 5, survivalThreshold: 0.8 },
            state.tick,
            rng(), // deterministic roll from seeded PRNG
          );

          // Initiate the selected encounter
          const template = getEncounterById(result.selected.templateId);
          if (template) {
            initiateEncounter(state, actor.id, template.id, state.tick);

            const locationNode = state.graph.getNode(locationId);
            const locationName = locationNode?.name ?? 'the realm';
            events.push({
              id: nextEventId(),
              tick: state.tick,
              type: 'agent_action_resolved',
              message: `${actor.name} begins ${template.name} at ${locationName}.`,
              sphere: template.sphereAffinity ?? (SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)]),
              significance: 0.7,
            });
          }
        } catch {
          // Selection pipeline can fail if no valid profile — fall through to routine action
        }
      }
    }

    // Routine action (non-encounter flavor text)
    else if (rng() < ROUTINE_ACTION_CHANCE) {
      const spheres: SphereName[] = [...SPHERE_NAMES];
      const sphere = spheres[Math.floor(rng() * spheres.length)];
      const significance = 0.3 + rng() * 0.4; // Lower significance for routine

      const prose = generateRoutineProse('action_resolved', {
        actorName: actor.name,
        sphere,
        locationName: 'the realm',
      }, state.seed + state.tick * 100 + actors.indexOf(actor));

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_action_resolved',
        message: prose.text,
        sphere,
        significance,
      });

      // Sphere influence
      const locationId = actor.properties.locationId as string | undefined;
      if (locationId) {
        const locNode = state.graph.getNode(locationId);
        if (locNode?.properties?.sphereInfluence) {
          const inf = locNode.properties.sphereInfluence as Record<string, number>;
          inf[sphere] = (inf[sphere] ?? 0) + 0.02;
        }
      }
    }
  }

  // Keep notable action interval
  if (actors.length > 0 && state.tick % NOTABLE_ACTION_INTERVAL === 0) {
    const notableActor = actors[Math.floor(rng() * actors.length)];
    const spheres: SphereName[] = [...SPHERE_NAMES];
    const sphere = spheres[Math.floor(rng() * spheres.length)];

    const prose = generateNotableProse('action_critical', {
      actorName: notableActor.name,
      sphere,
      locationName: 'the realm',
    }, state.seed + state.tick * 200);

    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'agent_action_resolved',
      message: prose.text,
      sphere,
      significance: 0.85,
    });
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}
```

Add imports at top:
```typescript
import { generateEncounterCandidates } from './encounterCandidates';
import { runSelectionPipeline } from './agentSelection';
import { getEncounterById } from '../data/encounter-content';
```

**Step 3: Run tests**

Run: `npx vitest run src/engine/__tests__/orchestrator-encounters.test.ts --reporter=verbose`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/__tests__/orchestrator-encounters.test.ts
git commit -m "feat: wire real selection pipeline into phaseAgentActions, replacing stub"
```

---

## Task 6: Create Encounter Templates — 60-80 Templates Across All Subtypes

**Files:**
- Modify: `src/data/encounter-content.ts` — add ~50-70 new templates
- Modify: `src/data/__tests__/encounter-content.test.ts` — structural + coverage tests

**Step 1: Write structural validation tests**

```typescript
describe('encounter template coverage', () => {
  it('every LocationSubtype has at least 3 encounter templates', ...);
  it('every EncounterType has at least 4 templates', ...);
  it('all templates have valid encounterType', ...);
  it('all templates have valid threatRating', ...);
  it('all templates have valid motivations array', ...);
  it('all templates have 2-4 steps with escalating difficulty', ...);
  it('all template IDs are unique', ...);
  it('all step IDs are unique within their template', ...);
  it('all templates reference valid ReachDomain values', ...);
  it('threat rating distribution is balanced (not all moderate)', ...);
});
```

**Step 2: Create encounter templates**

Organize by encounter type. Each template follows the existing 3-step structure with escalating difficulty. Here's the coverage target:

**explore (10 templates):** Keep the 10 existing ordeal templates, now remapped to real subtypes.

**acquire (8 templates):**
- `enc.market_haggle` — town, city, capital, oasis — gold/heart — easy
- `enc.relic_hunt` — ruins, ruined_tower, ruined_city — eye/shadow — moderate
- `enc.harvest_bounty` — farmland, hamlet, oasis — flesh/stone — trivial
- `enc.spell_bargain` — tower, temple, shrine — veil/gold — moderate
- `enc.war_trophy` — battleground, fort, castle — iron/shadow — hard
- `enc.sacred_offering` — shrine, temple — spirit/heart — easy
- `enc.rare_material` — mining, camp, wilderness — stone/gold — moderate
- `enc.forbidden_tome` — tower, ruins, capital — eye/veil — hard

**create (6 templates):**
- `enc.forge_weapon` — mining, fort, town — iron/stone — moderate
- `enc.brew_potion` — hamlet, shrine, camp — flesh/veil — easy
- `enc.inscribe_ward` — tower, temple, ruins — veil/eye — hard
- `enc.compose_saga` — town, city, capital — heart/eye — easy
- `enc.craft_talisman` — shrine, camp, wilderness — spirit/veil — moderate
- `enc.raise_monument` — capital, city, battleground — stone/star — hard

**hire (6 templates):**
- `enc.recruit_militia` — hamlet, town, farmland — heart/iron — easy
- `enc.sway_mercenary` — camp, battleground, fort — gold/iron — moderate
- `enc.court_noble` — capital, city, castle — heart/gold — hard
- `enc.bind_spirit` — shrine, temple, tower — spirit/veil — hard
- `enc.rally_faithful` — temple, shrine, town — spirit/heart — moderate
- `enc.hire_guide` — wilderness, oasis, camp — star/gold — trivial

**duel (6 templates):**
- `enc.honor_duel` — castle, capital, fort — iron/heart — moderate
- `enc.tavern_brawl` — town, hamlet, camp — iron/flesh — easy
- `enc.arcane_duel` — tower, temple, ruins — veil/eye — hard
- `enc.arena_combat` — city, capital, battleground — iron/star — hard
- `enc.shadow_ambush` — ruins, wilderness, camp — shadow/iron — moderate
- `enc.trial_by_combat` — castle, fort, capital — iron/heart — deadly

**steal (5 templates):**
- `enc.pickpocket` — town, city, capital — shadow/gold — trivial
- `enc.vault_heist` — castle, capital, tower — shadow/eye — hard
- `enc.grave_robbery` — ruins, ruined_village, battleground — shadow/flesh — moderate
- `enc.smuggle_goods` — town, city, oasis — shadow/gold — moderate
- `enc.steal_secrets` — castle, tower, capital — shadow/eye — hard

**trade (6 templates):**
- `enc.caravan_deal` — oasis, camp, town — gold/star — easy
- `enc.guild_negotiation` — city, capital, town — gold/heart — moderate
- `enc.smuggler_pact` — camp, town, ruins — gold/shadow — moderate
- `enc.tribute_exchange` — capital, castle, temple — gold/heart — hard
- `enc.barter_survival` — wilderness, hamlet, camp — gold/flesh — trivial
- `enc.mystic_trade` — shrine, tower, temple — gold/veil — moderate

**assist (6 templates):**
- `enc.heal_wounded` — hamlet, town, camp, battleground — flesh/heart — easy
- `enc.rescue_prisoner` — fort, castle, ruins — iron/heart — hard
- `enc.share_knowledge` — tower, temple, capital — eye/heart — easy
- `enc.defend_settlement` — hamlet, town, farmland — iron/heart — moderate
- `enc.guide_lost` — wilderness, ruins, camp — star/heart — trivial
- `enc.break_curse` — shrine, temple, ruined_tower — veil/spirit — hard

**build (6 templates):**
- `enc.raise_walls` — hamlet, town, farmland — stone/iron — moderate
- `enc.dig_mine` — mining, hills (wilderness), camp — stone/iron — moderate
- `enc.consecrate_ground` — shrine, temple, ruins — spirit/stone — hard
- `enc.plant_fields` — farmland, hamlet, oasis — flesh/stone — trivial
- `enc.fortify_position` — fort, castle, camp — stone/iron — hard
- `enc.erect_waystone` — wilderness, crossroads (camp), oasis — star/stone — easy

**lead (5 templates):**
- `enc.rally_troops` — fort, castle, battleground — iron/heart — hard
- `enc.organize_council` — capital, city, town — heart/eye — moderate
- `enc.inspire_followers` — temple, shrine, capital — spirit/heart — moderate
- `enc.marshal_expedition` — camp, wilderness, fort — star/iron — hard
- `enc.found_settlement` — wilderness, ruins, ruined_village — stone/heart — deadly

Each template needs the full 3-step encounter structure with escalating difficulty, narrative prose, and success/failure outcomes. Use the existing 10 templates as the structural pattern.

**Step 3: Run tests**

Run: `npx vitest run src/data/__tests__/encounter-content.test.ts --reporter=verbose`
Expected: All coverage + structural tests pass.

**Step 4: Commit**

```bash
git add src/data/encounter-content.ts src/data/__tests__/encounter-content.test.ts
git commit -m "feat: 64 encounter templates across 10 types, full LocationSubtype coverage"
```

---

## Task 7: Update LocationView UI — Available Encounters + Active Logs

**Files:**
- Modify: `src/components/Game/LocationView.tsx` — replace hardcoded ordeals section
- Modify: `src/components/Game/GameView.tsx` — pass encounter data to LocationView
- Modify: `src/components/Game/__tests__/LocationView.test.tsx`
- Create: `src/components/Game/EncounterLog.tsx` — active encounter narrative log

**Step 1: Update LocationView props**

```typescript
interface LocationViewProps {
  location: GraphNode;
  agents: GraphNode[];
  hexTerrain: string;
  hexCol: number;
  hexRow: number;
  onAgentClick: (agentId: string) => void;
  onBack: () => void;
  // NEW:
  availableEncounters: EncounterTemplate[];
  activeEncounters: EncounterProgress[];
  getAgentName: (id: string) => string;
  getEncounterTemplate: (id: string) => EncounterTemplate | undefined;
}
```

**Step 2: Create EncounterLog component**

`src/components/Game/EncounterLog.tsx` — renders a single active encounter's progress:

```typescript
interface EncounterLogProps {
  progress: EncounterProgress;
  template: EncounterTemplate;
  agentName: string;
}
```

Renders:
- Title bar: "{agentName} faces {templateName}" with encounter type badge
- Step progress indicators (dots/steps showing current position)
- Latest encounter step narrative text
- Visual state: active (glowing border), completed (green checkmark, fading), abandoned (red x, fading)

**Step 3: Update LocationView right column**

Replace the hardcoded "No active Ordeals" with:

```tsx
{/* Right: Encounters */}
<div className="flex-1 min-w-0 flex flex-col gap-4">
  {/* Active Encounter Logs */}
  {activeEncounters.length > 0 && (
    <div>
      <h3 className="section-heading mb-3" style={...}>Active Encounters</h3>
      <div className="space-y-3">
        {activeEncounters.map(progress => {
          const template = getEncounterTemplate(progress.encounterId);
          if (!template) return null;
          return (
            <EncounterLog
              key={`${progress.actorId}-${progress.encounterId}`}
              progress={progress}
              template={template}
              agentName={getAgentName(progress.actorId)}
            />
          );
        })}
      </div>
    </div>
  )}

  {/* Available Encounters */}
  <div>
    <h3 className="section-heading mb-3" style={...}>Available Encounters</h3>
    {availableEncounters.length === 0 ? (
      <p className="italic" style={...}>No encounters available</p>
    ) : (
      <div className="space-y-1">
        {availableEncounters.slice(0, 5).map(enc => (
          <div key={enc.id} className="px-3 py-2 rounded-lg" style={...}>
            <div className="flex items-center gap-2">
              <span className="text-xs px-1.5 py-0.5 rounded" style={...}>
                {enc.encounterType}
              </span>
              <span style={...}>{enc.name}</span>
            </div>
            <p className="text-xs" style={...}>
              {enc.threatRating} · {enc.reachPrimary}
            </p>
          </div>
        ))}
        {availableEncounters.length > 5 && (
          <p className="text-xs" style={...}>
            +{availableEncounters.length - 5} more available
          </p>
        )}
      </div>
    )}
  </div>
</div>
```

**Step 4: Wire GameView**

In `GameView.tsx`, compute available encounters and active encounters for the selected location:

```typescript
const locationEncounters = useMemo(() => {
  if (!selectedLocationId || !gameState) return { available: [], active: [] };
  const available = generateEncountersForLocation(gameState, selectedLocationId);
  const active = gameState.encounterProgress.filter(
    p => p.status === 'active' && /* agent is at this location */
  );
  return { available, active };
}, [selectedLocationId, gameState?.encounterProgress, gameState?.tick]);
```

Pass to LocationView:
```tsx
<LocationView
  ...existing props...
  availableEncounters={locationEncounters.available}
  activeEncounters={locationEncounters.active}
  getAgentName={(id) => gameState.graph.getNode(id)?.name ?? 'Unknown'}
  getEncounterTemplate={(id) => getEncounterById(id)}
/>
```

**Step 5: Write tests**

Update `LocationView.test.tsx`:
- Test rendering with empty encounters
- Test rendering with 3 available encounters
- Test rendering with active encounter log
- Test "N more available" truncation
- Test encounter type badge rendering

Create `EncounterLog.test.tsx`:
- Test title format "{agent} faces {encounter}"
- Test step progress rendering
- Test completed/abandoned visual states

**Step 6: Run tests**

Run: `npx vitest run src/components/Game/__tests__/LocationView.test.tsx src/components/Game/__tests__/EncounterLog.test.tsx --reporter=verbose`
Expected: All tests pass.

**Step 7: Commit**

```bash
git add src/components/Game/LocationView.tsx src/components/Game/EncounterLog.tsx src/components/Game/GameView.tsx src/components/Game/__tests__/
git commit -m "feat: LocationView shows available encounters + active encounter logs"
```

---

## Task 8: Integration Tests + Full Verification

**Files:**
- Create: `src/engine/__tests__/encounter-system-integration.test.ts`
- Run: Full test suite

**Step 1: Write integration tests**

```typescript
describe('encounter system integration', () => {
  it('full lifecycle: world seed → agent at location → candidate generation → selection → initiation → resolution → completion', ...);
  it('all 20 LocationSubtypes have at least 3 available encounter templates', ...);
  it('all 10 EncounterTypes have at least 4 templates', ...);
  it('agent personality influences encounter selection (courageous agents prefer explore/duel)', ...);
  it('threat filtering prevents low-capability agents from attempting deadly encounters', ...);
  it('divine influence overlay shifts encounter preference', ...);
  it('encounter progress appears in gameState.encounterProgress after initiation', ...);
  it('phaseEncounterProgression resolves active encounters and advances them', ...);
  it('completed encounters increment encounter step counter correctly', ...);
  it('encounter traces appear in trace buffer with encounter_resolution category', ...);
});
```

**Step 2: Run full test suite**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -40`
Expected: All tests pass (should be ~2,200+ tests now).

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: Zero errors.

**Step 4: Run production build**

Run: `npx vite build`
Expected: Successful build with no errors.

**Step 5: Commit**

```bash
git add src/engine/__tests__/encounter-system-integration.test.ts
git commit -m "test: encounter system integration tests — full lifecycle + coverage verification"
```

---

## Task 9: Documentation Updates

**Files:**
- Modify: `CLAUDE.md` — project status, engine stats, changelog
- Obsidian vault: Update affected system notes
- Notion backlog: Update phase status

**Step 1: Update CLAUDE.md**

Add changelog entries for all 8 previous tasks. Update:
- Project status: "Encounter System: ✅ Complete"
- Engine stats: updated module count, line count, test count
- Content stats: encounter template count

**Step 2: Update Obsidian vault**

Via Obsidian MCP:
- Create `Systems/Encounter System.md` — encounter types, threat rating, selection pipeline, LocationView UI
- Update `Systems/View Levels.md` — LocationView now shows encounters
- Update `Index.md` — add Encounter System link

**Step 3: Update Notion backlog**

Mark encounter system tasks complete, add reference docs.

**Step 4: Commit docs**

```bash
git add CLAUDE.md
git commit -m "docs: encounter system documentation — CLAUDE.md, vault, backlog"
```

---

## Summary

| Task | What | New Tests | Key Files |
|------|------|-----------|-----------|
| 1 | Rename types (ordeal→encounter) | ~0 (rename) | types/encounter.ts |
| 2 | Rename engine + content | ~0 (rename) | engine/encounter.ts, data/encounter-content.ts |
| 3 | Fix all consumers (~30 files) | ~0 (rename) | orchestrator.ts, gameInit.ts, DebugPanel.tsx, etc. |
| 4 | Candidate generator + type mapping | ~10 | engine/encounterCandidates.ts |
| 5 | Wire selection pipeline | ~8 | orchestrator.ts phaseAgentActions |
| 6 | 64 encounter templates | ~12 | data/encounter-content.ts |
| 7 | LocationView UI + EncounterLog | ~15 | LocationView.tsx, EncounterLog.tsx |
| 8 | Integration tests + verification | ~10 | encounter-system-integration.test.ts |
| 9 | Documentation | 0 | CLAUDE.md, Obsidian, Notion |

**Total: ~55 new tests, ~64 encounter templates, ~30 files renamed, ~3 new files created**
