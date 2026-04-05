# Ascendant Remembrance Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 3-screen creation flow (Cosmology Sliders → Archetype Cards → Avatar Naming) with a narrative remembrance experience where the player recovers their ascendant's mortal identity through fragmentary memories, culminating in a divine transformation.

**Architecture:** The flow is a state machine (Stirring → Origin → Drive → Transformation → Reveal) orchestrated by a `RemembranceFlow` component. Each beat is a self-contained component that receives accumulated state and emits the player's choice. A filtering funnel engine (`remembrance.ts`) selects which fragments/hungers to offer based on prior choices. The final output is an `AscendantIdentity` that replaces the current `AscendantArchetype` as input to `createAscendant()` and `initializeGameState()`. Cosmology is derived from the identity, not set by sliders.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS 4, Vitest + React Testing Library, seeded PRNG (existing `mulberry32`)

**Design Spec:** `Docs/plans/2026-04-06-ascendant-remembrance-flow-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/types/remembrance.ts` | All types for the remembrance flow: fragments, hungers, identity, flow state |
| `src/data/remembrance-fragments.ts` | Origin and Drive fragment libraries (starter set + full library) |
| `src/data/hunger-catalog.ts` | Hunger definitions with prose variants, court defaults, sphere alignments |
| `src/data/stirring-images.ts` | Stirring image definitions and cluster-to-fragment mappings |
| `src/engine/remembrance.ts` | Filtering funnel, cosmology derivation, divine name generation |
| `src/components/Remembrance/RemembranceFlow.tsx` | Flow orchestrator — state machine, accumulated choices, beat sequencing |
| `src/components/Remembrance/StirringBeat.tsx` | Abstract image selection (Beat 1) |
| `src/components/Remembrance/OriginBeat.tsx` | Origin fragment + mortal naming (Beat 2) |
| `src/components/Remembrance/DriveBeat.tsx` | Drive fragment selection (Beat 3) |
| `src/components/Remembrance/TransformationBeat.tsx` | Hunger reveal + court notch + sphere reveal (Beat 4) |
| `src/components/Remembrance/RevealBeat.tsx` | Full identity display + divine naming (Beat 5) |
| `src/components/Remembrance/FragmentCard.tsx` | Reusable fragment display: image + prose text + selection state |
| `src/engine/__tests__/remembrance.test.ts` | Engine tests: filtering funnel, cosmology derivation, name generation |
| `src/components/Remembrance/__tests__/RemembranceFlow.test.tsx` | Component tests: flow orchestration, beat transitions |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | New `GamePhase` variants for remembrance flow, new phase routing, Advanced Settings toggle |
| `src/types/influence.ts` | Add `AscendantIdentity` type, update `AscendantCreationConfig` to accept it |
| `src/engine/ascendant.ts` | Update `createAscendant()` to accept `AscendantIdentity` instead of `AscendantArchetype` |
| `src/engine/gameInit.ts` | Update `initializeGameState()` to accept `AscendantIdentity`, derive cosmology when not provided |
| `src/engine/cosmology.ts` | Add `deriveCosmologyFromIdentity()` function |

---

## Phase 1: Data Model & Types

### Task 1: Define Remembrance Types

**Files:**
- Create: `src/types/remembrance.ts`
- Modify: `src/types/influence.ts`

- [ ] **Step 1: Create the remembrance types file**

```typescript
// src/types/remembrance.ts
import type { SphereName, SphereAlignment, AxiologicalProfile } from './influence';
import type { ReachDomain } from './traits';

// --- Stirring (Beat 1) ---

export interface StirringImage {
  id: string;                        // e.g. 'stirring.tangled-light'
  imageAssetPath: string;            // path to abstract art asset
  fragmentClusters: string[];        // tags that filter which Origins surface
}

// --- Remembrance Fragments (Beats 2 & 3) ---

export interface RemembranceFragment {
  id: string;                        // e.g. 'origin.ancient-scholar'
  beat: 'origin' | 'drive';
  prose: string;                     // 2-3 sentence evocative text
  imageAssetPath: string;            // abstract art reference
  // Filtering
  stirringClusters: string[];        // which Stirring image clusters can lead here
  requiredOriginTags?: string[];     // for Drive fragments: which Origin tags enable this
  // Mechanical seeds (hidden from player)
  tags: string[];                    // e.g. ['ancient', 'scholar', 'loss', 'mind']
  timeSinceAscension?: 'recent' | 'ancient';  // Origin only
  domainLeanings: ReachDomain[];     // reach affinities seeded
  sphereDirection: SphereName[];     // sphere affinities pushed toward
  hungerWeights: Partial<Record<string, number>>; // how much this fragment favors each Hunger
}

// --- Hunger (Beat 4) ---

export interface HungerProseVariant {
  driveTag: string;                  // which Drive tag triggers this variant
  prose: string;                     // the Hunger reveal passage
}

export interface CourtOption {
  courtType: 'high_house' | 'circle' | 'web' | 'abyss';
  prose: string;                     // evocative description of this court shape
  isDefault: boolean;
}

export interface HungerDefinition {
  id: string;                        // e.g. 'hunger.witness'
  name: string;                      // e.g. 'Witness'
  imageAssetPath: string;            // cosmic abstract art
  proseVariants: HungerProseVariant[];
  mandateDirection: string;          // one-line mandate summary
  courtOptions: [CourtOption, CourtOption]; // default + alternative
  sphereAlignment: SphereAlignment;
  domainAffinities: Partial<Record<ReachDomain, number>>;
  ascendantLens: {
    perceptionStyle: string;         // how this god sees mortals
    emotionalTone: string;           // what colors their interactions
  };
}

// --- Flow State ---

export type RemembranceBeat = 'stirring' | 'origin' | 'drive' | 'transformation' | 'reveal';

export interface RemembranceState {
  currentBeat: RemembranceBeat;
  stirringImageId: string | null;
  originFragment: RemembranceFragment | null;
  mortalName: string | null;
  driveFragment: RemembranceFragment | null;
  hunger: HungerDefinition | null;
  courtType: 'high_house' | 'circle' | 'web' | 'abyss' | null;
}

// --- Final Output ---

export interface AscendantIdentity {
  // Mortal echo
  mortalName: string;
  originFragmentId: string;
  driveFragmentId: string;
  timeSinceAscension: 'recent' | 'ancient';
  mortalTags: string[];              // combined tags from origin + drive
  // Divine transformation
  divineName: string;
  hungerId: string;
  hungerName: string;
  mandateDirection: string;
  courtType: 'high_house' | 'circle' | 'web' | 'abyss';
  sphereAlignment: SphereAlignment;
  domainAffinities: Partial<Record<ReachDomain, number>>;
  personalitySeed: AxiologicalProfile;
  ascendantLens: {
    perceptionStyle: string;
    emotionalTone: string;
  };
}
```

- [ ] **Step 2: Add AscendantIdentity support to influence.ts**

In `src/types/influence.ts`, add an alternative creation config that accepts the new identity type. Keep the old `AscendantCreationConfig` for backwards compatibility during migration:

```typescript
// Add after existing AscendantCreationConfig (around line 156).
// AscendantIdentity is defined in src/types/remembrance.ts (Task 1 Step 1).
import type { AscendantIdentity } from './remembrance';

export interface RemembranceCreationConfig {
  identity: AscendantIdentity;
  avatar: AvatarConfig;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean compile (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/types/remembrance.ts src/types/influence.ts
git commit -m "feat(remembrance): add types for remembrance creation flow"
```

---

## Phase 2: Engine — Filtering Funnel & Cosmology Derivation

### Task 2: Write Starter Fragment Content

**Files:**
- Create: `src/data/stirring-images.ts`
- Create: `src/data/remembrance-fragments.ts`
- Create: `src/data/hunger-catalog.ts`

This task creates a minimal but complete content set: 4 Stirring images, 6 Origin fragments, 6 Drive fragments, 4 Hungers. Enough for the full flow to work end-to-end. Content expansion happens in a later task.

- [ ] **Step 1: Create stirring images data**

```typescript
// src/data/stirring-images.ts
import type { StirringImage } from '../types/remembrance';

export const STIRRING_IMAGES: StirringImage[] = [
  {
    id: 'stirring.tangled-light',
    imageAssetPath: '/assets/remembrance/stirring/tangled-light.webp',
    fragmentClusters: ['growth', 'shelter', 'connection', 'life'],
  },
  {
    id: 'stirring.fracturing-geometry',
    imageAssetPath: '/assets/remembrance/stirring/fracturing-geometry.webp',
    fragmentClusters: ['order', 'ambition', 'power', 'mind'],
  },
  {
    id: 'stirring.dark-water',
    imageAssetPath: '/assets/remembrance/stirring/dark-water.webp',
    fragmentClusters: ['memory', 'loss', 'depth', 'ancient'],
  },
  {
    id: 'stirring.rising-embers',
    imageAssetPath: '/assets/remembrance/stirring/rising-embers.webp',
    fragmentClusters: ['transformation', 'sacrifice', 'will', 'force'],
  },
];
```

- [ ] **Step 2: Create origin fragments**

```typescript
// src/data/remembrance-fragments.ts
import type { RemembranceFragment } from '../types/remembrance';

// --- ORIGIN FRAGMENTS ---

export const ORIGIN_FRAGMENTS: RemembranceFragment[] = [
  {
    id: 'origin.recent-shepherd',
    beat: 'origin',
    prose: 'You remember a hillside. The smell of wet wool and wildflowers. The flock knew your voice — every one of them. They still graze those hills.',
    imageAssetPath: '/assets/remembrance/origin/recent-shepherd.webp',
    stirringClusters: ['growth', 'shelter', 'connection', 'life'],
    tags: ['recent', 'caretaker', 'rural', 'humble', 'life'],
    timeSinceAscension: 'recent',
    domainLeanings: ['heart', 'stone'],
    sphereDirection: ['life', 'spirit'],
    hungerWeights: { 'hunger.gather': 3, 'hunger.preserve': 2, 'hunger.kindle': 1 },
  },
  {
    id: 'origin.ancient-scholar',
    beat: 'origin',
    prose: 'You remember a library. Vast. The smell of old ink and older secrets. You were its keeper — the last one, you think. The shelves are dust now.',
    imageAssetPath: '/assets/remembrance/origin/ancient-scholar.webp',
    stirringClusters: ['memory', 'loss', 'depth', 'ancient', 'mind'],
    tags: ['ancient', 'scholar', 'knowledge', 'solitary', 'mind'],
    timeSinceAscension: 'ancient',
    domainLeanings: ['eye', 'veil'],
    sphereDirection: ['mind', 'spirit'],
    hungerWeights: { 'hunger.witness': 3, 'hunger.preserve': 2, 'hunger.sever': 1 },
  },
  {
    id: 'origin.recent-commander',
    beat: 'origin',
    prose: 'You remember the weight of command. The maps, the marching orders, the faces of those who would not return. Your army still carries your banner.',
    imageAssetPath: '/assets/remembrance/origin/recent-commander.webp',
    stirringClusters: ['order', 'ambition', 'power', 'force'],
    tags: ['recent', 'leader', 'military', 'decisive', 'force'],
    timeSinceAscension: 'recent',
    domainLeanings: ['iron', 'crown'],
    sphereDirection: ['force', 'matter'],
    hungerWeights: { 'hunger.reshape': 3, 'hunger.reclaim': 2, 'hunger.bind': 1 },
  },
  {
    id: 'origin.ancient-ruler',
    beat: 'origin',
    prose: 'You remember a throne room, empty now. Its pillars are swallowed by roots. No one remembers the name you held, or the kingdom you built from nothing.',
    imageAssetPath: '/assets/remembrance/origin/ancient-ruler.webp',
    stirringClusters: ['memory', 'loss', 'ambition', 'power', 'ancient'],
    tags: ['ancient', 'ruler', 'authority', 'builder', 'matter'],
    timeSinceAscension: 'ancient',
    domainLeanings: ['crown', 'stone'],
    sphereDirection: ['matter', 'time'],
    hungerWeights: { 'hunger.reclaim': 3, 'hunger.bind': 2, 'hunger.reshape': 1 },
  },
  {
    id: 'origin.recent-healer',
    beat: 'origin',
    prose: 'You remember hands that never stopped working. The sick, the broken, the ones everyone else had given up on. Your clinic still stands at the crossroads.',
    imageAssetPath: '/assets/remembrance/origin/recent-healer.webp',
    stirringClusters: ['growth', 'shelter', 'connection', 'life', 'sacrifice'],
    tags: ['recent', 'healer', 'compassion', 'tireless', 'life'],
    timeSinceAscension: 'recent',
    domainLeanings: ['heart', 'bloom'],
    sphereDirection: ['life', 'energy'],
    hungerWeights: { 'hunger.gather': 2, 'hunger.kindle': 3, 'hunger.preserve': 1 },
  },
  {
    id: 'origin.ancient-wanderer',
    beat: 'origin',
    prose: 'You remember roads. So many roads. Every horizon was a question, every border a dare. The paths you walked have long since been swallowed by forest.',
    imageAssetPath: '/assets/remembrance/origin/ancient-wanderer.webp',
    stirringClusters: ['transformation', 'will', 'depth', 'ancient'],
    tags: ['ancient', 'wanderer', 'freedom', 'restless', 'energy'],
    timeSinceAscension: 'ancient',
    domainLeanings: ['gold', 'eye'],
    sphereDirection: ['energy', 'time'],
    hungerWeights: { 'hunger.wander': 3, 'hunger.witness': 2, 'hunger.sever': 1 },
  },
];

// --- DRIVE FRAGMENTS ---

export const DRIVE_FRAGMENTS: RemembranceFragment[] = [
  {
    id: 'drive.undying-love',
    beat: 'drive',
    prose: 'You remember a face. Always the same face. You would have unmade the world to see it one more time. You still would.',
    imageAssetPath: '/assets/remembrance/drive/undying-love.webp',
    stirringClusters: ['connection', 'life', 'loss', 'sacrifice'],
    requiredOriginTags: ['caretaker', 'healer', 'humble', 'compassion'],
    tags: ['love', 'devotion', 'loss', 'spirit'],
    domainLeanings: ['heart'],
    sphereDirection: ['spirit', 'life'],
    hungerWeights: { 'hunger.gather': 3, 'hunger.preserve': 2 },
  },
  {
    id: 'drive.unanswered-question',
    beat: 'drive',
    prose: 'You remember a question. It had no answer. You asked it of every book, every sage, every star. You are still asking.',
    imageAssetPath: '/assets/remembrance/drive/unanswered-question.webp',
    stirringClusters: ['depth', 'mind', 'ancient', 'memory'],
    requiredOriginTags: ['scholar', 'knowledge', 'solitary', 'wanderer'],
    tags: ['obsession', 'knowledge', 'seeking', 'mind'],
    domainLeanings: ['eye', 'veil'],
    sphereDirection: ['mind', 'spirit'],
    hungerWeights: { 'hunger.witness': 3, 'hunger.preserve': 1 },
  },
  {
    id: 'drive.stolen-legacy',
    beat: 'drive',
    prose: 'You remember the moment it was taken from you. Everything you built, everything you bled for — gone in a single act of betrayal. The rage has not cooled.',
    imageAssetPath: '/assets/remembrance/drive/stolen-legacy.webp',
    stirringClusters: ['power', 'force', 'loss', 'will'],
    requiredOriginTags: ['leader', 'ruler', 'authority', 'military', 'builder'],
    tags: ['vengeance', 'justice', 'loss', 'force'],
    domainLeanings: ['iron', 'crown'],
    sphereDirection: ['force', 'time'],
    hungerWeights: { 'hunger.reclaim': 3, 'hunger.reshape': 1 },
  },
  {
    id: 'drive.vision-of-perfection',
    beat: 'drive',
    prose: 'You remember seeing it — how things could be. Perfect. Ordered. Beautiful. And then looking at the world as it was and finding it unbearable.',
    imageAssetPath: '/assets/remembrance/drive/vision-of-perfection.webp',
    stirringClusters: ['order', 'ambition', 'transformation', 'mind'],
    requiredOriginTags: ['leader', 'ruler', 'scholar', 'builder', 'decisive'],
    tags: ['perfectionism', 'vision', 'order', 'matter'],
    domainLeanings: ['stone', 'crown'],
    sphereDirection: ['matter', 'mind'],
    hungerWeights: { 'hunger.reshape': 3, 'hunger.bind': 2 },
  },
  {
    id: 'drive.the-dying-light',
    beat: 'drive',
    prose: 'You remember watching something beautiful die. Slowly. A culture, a language, a way of being. You could not save it. You could not look away.',
    imageAssetPath: '/assets/remembrance/drive/dying-light.webp',
    stirringClusters: ['loss', 'memory', 'ancient', 'shelter', 'sacrifice'],
    requiredOriginTags: ['ancient', 'scholar', 'caretaker', 'healer', 'wanderer'],
    tags: ['preservation', 'grief', 'memory', 'time'],
    domainLeanings: ['stone', 'heart'],
    sphereDirection: ['time', 'spirit'],
    hungerWeights: { 'hunger.preserve': 3, 'hunger.gather': 1 },
  },
  {
    id: 'drive.restless-horizon',
    beat: 'drive',
    prose: 'You remember the feeling of standing still, and how it burned. Every wall was a cage. Every ending was a lie. There was always something beyond.',
    imageAssetPath: '/assets/remembrance/drive/restless-horizon.webp',
    stirringClusters: ['transformation', 'will', 'freedom', 'depth'],
    requiredOriginTags: ['wanderer', 'restless', 'freedom', 'solitary'],
    tags: ['freedom', 'restlessness', 'discovery', 'energy'],
    domainLeanings: ['gold', 'eye'],
    sphereDirection: ['energy', 'time'],
    hungerWeights: { 'hunger.wander': 3, 'hunger.sever': 2 },
  },
];
```

- [ ] **Step 3: Create hunger catalog**

```typescript
// src/data/hunger-catalog.ts
import type { HungerDefinition } from '../types/remembrance';

export const HUNGER_CATALOG: HungerDefinition[] = [
  {
    id: 'hunger.gather',
    name: 'Gather',
    imageAssetPath: '/assets/remembrance/hunger/gather.webp',
    proseVariants: [
      {
        driveTag: 'love',
        prose: 'Your love became a hunger. You would gather every soul under your wings — shelter them, hold them, keep them. Whether they wish it or not.',
      },
      {
        driveTag: 'preservation',
        prose: 'Your grief became a hunger. What died was alone. Unprotected. You would never let that happen again. You would gather them all.',
      },
      {
        driveTag: 'compassion',
        prose: 'Your compassion became a hunger. The broken, the lost, the abandoned — you would find them all. Your flock would have no edge, no limit.',
      },
    ],
    mandateDirection: 'Build a devoted community of followers bound to your court',
    courtOptions: [
      {
        courtType: 'circle',
        prose: 'Your court is a circle. All are seen. All are held. Every voice reaches the center, and the center holds them all.',
        isDefault: true,
      },
      {
        courtType: 'web',
        prose: 'Your court is a web. Every thread connects. Every soul you gather strengthens the whole. Pull one, and all feel it.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'life', secondary: 'spirit' },
    domainAffinities: { heart: 4, stone: 3, bloom: 2 },
    ascendantLens: {
      perceptionStyle: 'You see vulnerability first — who needs shelter, who is alone, who is about to break.',
      emotionalTone: 'Protective warmth edged with possessiveness. The flock must grow.',
    },
  },
  {
    id: 'hunger.witness',
    name: 'Witness',
    imageAssetPath: '/assets/remembrance/hunger/witness.webp',
    proseVariants: [
      {
        driveTag: 'obsession',
        prose: 'Your question became a hunger. You would know everything. Every secret whispered in darkness. Every truth buried under lies. Nothing — nothing — would be hidden from you.',
      },
      {
        driveTag: 'seeking',
        prose: 'Your seeking became a hunger. Not for answers — for seeing. You would witness every moment, every choice, every hidden thing. The world would be transparent to your gaze.',
      },
    ],
    mandateDirection: 'Establish an information network that sees across the world',
    courtOptions: [
      {
        courtType: 'web',
        prose: 'Your court is a web. Every thread leads to you. Every secret finds its way home along the silk.',
        isDefault: true,
      },
      {
        courtType: 'high_house',
        prose: 'Your court is a high house. Knowledge flows upward. You sit at the apex, and nothing reaches you unfiltered.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'mind', secondary: 'spirit' },
    domainAffinities: { eye: 4, veil: 3, gold: 2 },
    ascendantLens: {
      perceptionStyle: 'You see what others hide — the thought behind the smile, the fear behind the bravado, the secret behind the silence.',
      emotionalTone: 'Detached fascination edged with voyeuristic hunger. Everything must be known.',
    },
  },
  {
    id: 'hunger.reclaim',
    name: 'Reclaim',
    imageAssetPath: '/assets/remembrance/hunger/reclaim.webp',
    proseVariants: [
      {
        driveTag: 'vengeance',
        prose: 'Your rage became a hunger. What was taken will be taken back. What was destroyed will be rebuilt. And those who took it will understand what they stole.',
      },
      {
        driveTag: 'justice',
        prose: 'Your sense of justice became a hunger. The scales are broken. The world is crooked. You would right every wrong, recover every loss, even if it means breaking what stands in the way.',
      },
    ],
    mandateDirection: 'Recover what was lost — reclaim ruins, right ancient wrongs, restore forgotten power',
    courtOptions: [
      {
        courtType: 'high_house',
        prose: 'Your court is a high house. Rebuilt from the ruins of what was. Every stone reclaimed. Every position earned through the work of restoration.',
        isDefault: true,
      },
      {
        courtType: 'abyss',
        prose: 'Your court is an abyss. You reach down into what was lost and pull it back from darkness. Your power flows upward from forgotten depths.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'force', secondary: 'time' },
    domainAffinities: { iron: 4, crown: 3, stone: 2 },
    ascendantLens: {
      perceptionStyle: 'You see what was taken — the scars, the absences, the places where something used to be. Every ruin speaks to you.',
      emotionalTone: 'Cold determination edged with old grief. What was lost will be found.',
    },
  },
  {
    id: 'hunger.reshape',
    name: 'Reshape',
    imageAssetPath: '/assets/remembrance/hunger/reshape.webp',
    proseVariants: [
      {
        driveTag: 'perfectionism',
        prose: 'Your vision became a hunger. The world as it is — imperfect, chaotic, wrong — cannot be tolerated. You would reshape it. All of it. Until it matches what you saw.',
      },
      {
        driveTag: 'vision',
        prose: 'Your certainty became a hunger. You saw the truth that others could not. Now you would make them see it too — by changing everything around them until the truth is all that remains.',
      },
    ],
    mandateDirection: 'Transform cultures and reshape the world according to your vision',
    courtOptions: [
      {
        courtType: 'high_house',
        prose: 'Your court is a high house. Vision flows downward from the apex. Every position exists to execute the design, to make the world conform.',
        isDefault: true,
      },
      {
        courtType: 'circle',
        prose: 'Your court is a circle. Every member carries the vision. The transformation spreads from the center outward, a ripple that never stops.',
        isDefault: false,
      },
    ],
    sphereAlignment: { primary: 'force', secondary: 'mind' },
    domainAffinities: { crown: 4, iron: 3, eye: 2 },
    ascendantLens: {
      perceptionStyle: 'You see potential — what someone could become, what a place could be, the gap between what is and what should be.',
      emotionalTone: 'Visionary intensity edged with impatience. The world is not yet right.',
    },
  },
];
```

- [ ] **Step 4: Verify all data files compile**

Run: `npx tsc --noEmit`
Expected: Clean compile

- [ ] **Step 5: Commit**

```bash
git add src/data/stirring-images.ts src/data/remembrance-fragments.ts src/data/hunger-catalog.ts
git commit -m "feat(remembrance): add starter content — 4 stirring images, 6 origins, 6 drives, 4 hungers"
```

---

### Task 3: Write Filtering Funnel Engine

**Files:**
- Create: `src/engine/remembrance.ts`
- Create: `src/engine/__tests__/remembrance.test.ts`

- [ ] **Step 1: Write the failing tests for fragment filtering**

```typescript
// src/engine/__tests__/remembrance.test.ts
import { describe, it, expect } from 'vitest';
import {
  filterOriginFragments,
  filterDriveFragments,
  filterHungers,
  selectHungerProse,
  deriveCosmologyFromIdentity,
  generateDivineName,
  buildPersonalitySeed,
} from '../remembrance';
import { STIRRING_IMAGES } from '../../data/stirring-images';
import { ORIGIN_FRAGMENTS, DRIVE_FRAGMENTS } from '../../data/remembrance-fragments';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';

describe('filterOriginFragments', () => {
  it('returns fragments matching the stirring image clusters', () => {
    const darkWater = STIRRING_IMAGES.find(s => s.id === 'stirring.dark-water')!;
    const results = filterOriginFragments(darkWater, ORIGIN_FRAGMENTS, 42);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.length).toBeLessThanOrEqual(4);
    // Ancient scholar should appear for dark-water (has 'memory', 'loss', 'depth', 'ancient')
    expect(results.some(f => f.id === 'origin.ancient-scholar')).toBe(true);
  });

  it('returns exactly 3 fragments', () => {
    const tangledLight = STIRRING_IMAGES.find(s => s.id === 'stirring.tangled-light')!;
    const results = filterOriginFragments(tangledLight, ORIGIN_FRAGMENTS, 42);
    expect(results).toHaveLength(3);
  });

  it('is deterministic with the same seed', () => {
    const image = STIRRING_IMAGES[0];
    const a = filterOriginFragments(image, ORIGIN_FRAGMENTS, 99);
    const b = filterOriginFragments(image, ORIGIN_FRAGMENTS, 99);
    expect(a.map(f => f.id)).toEqual(b.map(f => f.id));
  });
});

describe('filterDriveFragments', () => {
  it('returns fragments compatible with the chosen origin', () => {
    const scholar = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.ancient-scholar')!;
    const results = filterDriveFragments(scholar, DRIVE_FRAGMENTS, 42);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.length).toBeLessThanOrEqual(4);
    // Unanswered question should appear for scholar (requires 'scholar' or 'knowledge')
    expect(results.some(f => f.id === 'drive.unanswered-question')).toBe(true);
  });

  it('returns exactly 3 fragments', () => {
    const shepherd = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.recent-shepherd')!;
    const results = filterDriveFragments(shepherd, DRIVE_FRAGMENTS, 42);
    expect(results).toHaveLength(3);
  });
});

describe('filterHungers', () => {
  it('returns 2-3 hungers based on origin + drive weights', () => {
    const origin = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.ancient-scholar')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.unanswered-question')!;
    const results = filterHungers(origin, drive, HUNGER_CATALOG, 42);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.length).toBeLessThanOrEqual(3);
    // Witness should be top-ranked for scholar + question
    expect(results[0].id).toBe('hunger.witness');
  });
});

describe('selectHungerProse', () => {
  it('selects the prose variant matching the drive tags', () => {
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.witness')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.unanswered-question')!;
    const prose = selectHungerProse(hunger, drive);
    expect(prose).toContain('question became a hunger');
  });

  it('falls back to first variant if no tag match', () => {
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.witness')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.stolen-legacy')!;
    const prose = selectHungerProse(hunger, drive);
    expect(prose.length).toBeGreaterThan(0);
  });
});

describe('buildPersonalitySeed', () => {
  it('returns an AxiologicalProfile with 9 value pairs', () => {
    const origin = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.recent-shepherd')!;
    const drive = DRIVE_FRAGMENTS.find(f => f.id === 'drive.undying-love')!;
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.gather')!;
    const profile = buildPersonalitySeed(origin, drive, hunger, 42);
    const keys = Object.keys(profile);
    expect(keys).toHaveLength(9);
    keys.forEach(k => {
      const val = profile[k as keyof typeof profile];
      expect(val).toBeGreaterThanOrEqual(-1);
      expect(val).toBeLessThanOrEqual(1);
    });
  });

  it('is deterministic with the same seed', () => {
    const origin = ORIGIN_FRAGMENTS[0];
    const drive = DRIVE_FRAGMENTS[0];
    const hunger = HUNGER_CATALOG[0];
    const a = buildPersonalitySeed(origin, drive, hunger, 42);
    const b = buildPersonalitySeed(origin, drive, hunger, 42);
    expect(a).toEqual(b);
  });
});

describe('generateDivineName', () => {
  it('returns a title-format name', () => {
    const hunger = HUNGER_CATALOG.find(h => h.id === 'hunger.witness')!;
    const origin = ORIGIN_FRAGMENTS.find(f => f.id === 'origin.ancient-scholar')!;
    const name = generateDivineName(hunger, origin, 42);
    expect(name).toMatch(/^The /);
    expect(name.length).toBeGreaterThan(5);
  });

  it('is deterministic with the same seed', () => {
    const hunger = HUNGER_CATALOG[0];
    const origin = ORIGIN_FRAGMENTS[0];
    const a = generateDivineName(hunger, origin, 42);
    const b = generateDivineName(hunger, origin, 42);
    expect(a).toBe(b);
  });
});

describe('deriveCosmologyFromIdentity', () => {
  it('returns a CosmologyProfile that sums to 1.0', () => {
    const identity = {
      sphereAlignment: { primary: 'mind' as const, secondary: 'spirit' as const },
      mortalTags: ['ancient', 'scholar'],
      hungerId: 'hunger.witness',
    };
    const profile = deriveCosmologyFromIdentity(identity);
    const sum = Object.values(profile).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('weights primary sphere highest', () => {
    const identity = {
      sphereAlignment: { primary: 'force' as const, secondary: 'time' as const },
      mortalTags: ['ancient', 'ruler'],
      hungerId: 'hunger.reclaim',
    };
    const profile = deriveCosmologyFromIdentity(identity);
    expect(profile.force).toBeGreaterThan(profile.time);
    expect(profile.time).toBeGreaterThan(profile.life);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/remembrance.test.ts`
Expected: FAIL — module `../remembrance` not found

- [ ] **Step 3: Implement the filtering funnel engine**

```typescript
// src/engine/remembrance.ts
import type {
  StirringImage,
  RemembranceFragment,
  HungerDefinition,
  AscendantIdentity,
} from '../types/remembrance';
import type { CosmologyProfile, AxiologicalProfile, SphereName } from '../types/influence';
import { SPHERE_NAMES } from '../types/influence';
import type { ReachDomain } from '../types/traits';

// --- PRNG (reuse existing pattern) ---

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// --- Fragment Filtering ---

/**
 * Filter origin fragments by stirring image cluster overlap.
 * Returns exactly 3 fragments, scored by cluster match count + seeded shuffle for ties.
 */
export function filterOriginFragments(
  stirringImage: StirringImage,
  allOrigins: RemembranceFragment[],
  seed: number,
): RemembranceFragment[] {
  const rng = mulberry32(seed + 1001);
  const clusters = new Set(stirringImage.fragmentClusters);

  const scored = allOrigins
    .map(fragment => {
      const overlap = fragment.stirringClusters.filter(c => clusters.has(c)).length;
      return { fragment, score: overlap + rng() * 0.5 }; // tie-break with jitter
    })
    .filter(s => s.score > 0.5) // must have at least 1 real cluster match
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(s => s.fragment);
}

/**
 * Filter drive fragments by origin tag overlap.
 * Returns exactly 3 fragments whose requiredOriginTags overlap with the origin's tags.
 */
export function filterDriveFragments(
  origin: RemembranceFragment,
  allDrives: RemembranceFragment[],
  seed: number,
): RemembranceFragment[] {
  const rng = mulberry32(seed + 2002);
  const originTags = new Set(origin.tags);

  const scored = allDrives
    .map(fragment => {
      const required = fragment.requiredOriginTags ?? [];
      const overlap = required.filter(t => originTags.has(t)).length;
      const clusterOverlap = fragment.stirringClusters.filter(c => originTags.has(c)).length;
      return { fragment, score: overlap * 2 + clusterOverlap + rng() * 0.5 };
    })
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(s => s.fragment);
}

/**
 * Filter hungers by combined origin + drive hunger weights.
 * Returns 2-3 hungers, ranked by total weight.
 */
export function filterHungers(
  origin: RemembranceFragment,
  drive: RemembranceFragment,
  allHungers: HungerDefinition[],
  seed: number,
): HungerDefinition[] {
  const rng = mulberry32(seed + 3003);

  const scored = allHungers
    .map(hunger => {
      const originWeight = origin.hungerWeights[hunger.id] ?? 0;
      const driveWeight = drive.hungerWeights[hunger.id] ?? 0;
      return { hunger, score: originWeight + driveWeight + rng() * 0.3 };
    })
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score - a.score);

  // Return 2-3 depending on score distribution
  const top = scored.slice(0, 3);
  if (top.length >= 3 && top[2].score < top[0].score * 0.3) {
    return top.slice(0, 2).map(s => s.hunger);
  }
  return top.map(s => s.hunger);
}

// --- Prose Selection ---

/**
 * Select the hunger prose variant that best matches the drive's tags.
 * Falls back to first variant if no tag match found.
 */
export function selectHungerProse(
  hunger: HungerDefinition,
  drive: RemembranceFragment,
): string {
  const driveTags = new Set(drive.tags);
  const match = hunger.proseVariants.find(v => driveTags.has(v.driveTag));
  return match?.prose ?? hunger.proseVariants[0].prose;
}

// --- Personality Seed ---

const VALUE_PAIRS = [
  'mercy_ruthlessness', 'asceticism_extravagance', 'honesty_cunning',
  'tradition_novelty', 'loyalty_ambition', 'revelation_discretion',
  'preservation_transformation', 'sacrifice_survival', 'courage_prudence',
] as const;

/**
 * Build an axiological profile from the remembrance choices.
 * Tags from origin, drive, and hunger bias specific value pairs.
 */
export function buildPersonalitySeed(
  origin: RemembranceFragment,
  drive: RemembranceFragment,
  hunger: HungerDefinition,
  seed: number,
): AxiologicalProfile {
  const rng = mulberry32(seed + 4004);
  const allTags = new Set([...origin.tags, ...drive.tags]);

  const TAG_BIASES: Record<string, Partial<Record<typeof VALUE_PAIRS[number], number>>> = {
    'caretaker':    { mercy_ruthlessness: 0.4, sacrifice_survival: 0.3 },
    'scholar':      { revelation_discretion: 0.4, tradition_novelty: -0.2 },
    'leader':       { courage_prudence: 0.3, loyalty_ambition: -0.2 },
    'ruler':        { loyalty_ambition: -0.3, tradition_novelty: 0.2 },
    'healer':       { mercy_ruthlessness: 0.5, sacrifice_survival: 0.4 },
    'wanderer':     { tradition_novelty: -0.4, courage_prudence: 0.3 },
    'love':         { loyalty_ambition: 0.4, sacrifice_survival: 0.3 },
    'vengeance':    { mercy_ruthlessness: -0.4, courage_prudence: 0.3 },
    'obsession':    { asceticism_extravagance: 0.3, tradition_novelty: -0.3 },
    'perfectionism': { preservation_transformation: -0.4, honesty_cunning: 0.2 },
    'preservation': { preservation_transformation: 0.5, tradition_novelty: 0.3 },
    'freedom':      { tradition_novelty: -0.5, loyalty_ambition: -0.3 },
  };

  const profile: Record<string, number> = {};
  for (const pair of VALUE_PAIRS) {
    let bias = 0;
    for (const tag of allTags) {
      bias += TAG_BIASES[tag]?.[pair] ?? 0;
    }
    // Clamp and add slight randomness
    profile[pair] = Math.max(-1, Math.min(1, bias + (rng() - 0.5) * 0.3));
  }

  return profile as AxiologicalProfile;
}

// --- Divine Name Generation ---

const HUNGER_ADJECTIVES: Record<string, string[]> = {
  'hunger.gather':  ['Sheltering', 'Gathering', 'Enfolding', 'Beckoning', 'Hollow'],
  'hunger.witness': ['Unblinking', 'All-Seeing', 'Silent', 'Watchful', 'Lidless'],
  'hunger.reclaim': ['Unbroken', 'Relentless', 'Unyielding', 'Returning', 'Scarred'],
  'hunger.reshape': ['Shaping', 'Absolute', 'Inevitable', 'Burning', 'Perfect'],
};

const ORIGIN_NOUNS: Record<string, string[]> = {
  'caretaker':  ['Shepherd', 'Warden', 'Keeper', 'Guardian'],
  'scholar':    ['Eye', 'Archive', 'Oracle', 'Sage'],
  'leader':     ['Marshal', 'Commander', 'Captain', 'Blade'],
  'ruler':      ['Sovereign', 'Throne', 'Crown', 'Pillar'],
  'healer':     ['Hand', 'Salve', 'Light', 'Mercy'],
  'wanderer':   ['Horizon', 'Drift', 'Wayward', 'Wind'],
};

/**
 * Generate a suggested divine name from hunger + origin archetype.
 * Format: "The [Adjective] [Noun]"
 */
export function generateDivineName(
  hunger: HungerDefinition,
  origin: RemembranceFragment,
  seed: number,
): string {
  const rng = mulberry32(seed + 5005);

  const adjectives = HUNGER_ADJECTIVES[hunger.id] ?? ['Ascended'];
  const adjective = adjectives[Math.floor(rng() * adjectives.length)];

  // Find first matching origin tag that has nouns
  const originTag = origin.tags.find(t => ORIGIN_NOUNS[t]);
  const nouns = originTag ? ORIGIN_NOUNS[originTag] : ['One'];
  const noun = nouns[Math.floor(rng() * nouns.length)];

  return `The ${adjective} ${noun}`;
}

// --- Cosmology Derivation ---

/** Primary sphere weight in derived cosmology */
const PRIMARY_WEIGHT = 0.25;
/** Secondary sphere weight in derived cosmology */
const SECONDARY_WEIGHT = 0.20;

/**
 * Derive a CosmologyProfile from the ascendant's identity.
 * Primary and secondary spheres get elevated weights.
 * Remaining weight is distributed among other spheres.
 */
export function deriveCosmologyFromIdentity(identity: {
  sphereAlignment: { primary: SphereName; secondary: SphereName };
  mortalTags: string[];
  hungerId: string;
}): CosmologyProfile {
  const { primary, secondary } = identity.sphereAlignment;
  const remaining = 1.0 - PRIMARY_WEIGHT - SECONDARY_WEIGHT;
  const otherSpheres = SPHERE_NAMES.filter(s => s !== primary && s !== secondary);
  const perOther = remaining / otherSpheres.length;

  const profile = {} as Record<SphereName, number>;
  for (const sphere of SPHERE_NAMES) {
    if (sphere === primary) {
      profile[sphere] = PRIMARY_WEIGHT;
    } else if (sphere === secondary) {
      profile[sphere] = SECONDARY_WEIGHT;
    } else {
      profile[sphere] = perOther;
    }
  }

  return profile as CosmologyProfile;
}

// --- Map Size Derivation ---

import type { MapSizePreset } from './gameInit';

const HUNGER_MAP_SIZES: Record<string, MapSizePreset> = {
  'hunger.gather': 'medium',
  'hunger.witness': 'medium',
  'hunger.preserve': 'medium',
  'hunger.reshape': 'large',
  'hunger.reclaim': 'large',
  'hunger.consume': 'large',
  'hunger.sever': 'medium',
  'hunger.kindle': 'medium',
  'hunger.bind': 'large',
  'hunger.wander': 'large',
};

export function deriveMapSize(hungerId: string): MapSizePreset {
  return HUNGER_MAP_SIZES[hungerId] ?? 'medium';
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/__tests__/remembrance.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/remembrance.ts src/engine/__tests__/remembrance.test.ts
git commit -m "feat(remembrance): add filtering funnel engine with cosmology derivation"
```

---

### Task 4: Update Game Initialization to Accept Remembrance Output

**Files:**
- Modify: `src/engine/ascendant.ts`
- Modify: `src/engine/gameInit.ts`
- Modify: `src/types/influence.ts`

- [ ] **Step 1: Add the remembrance-compatible creation path to ascendant.ts**

Add a new function `createAscendantFromIdentity` that accepts `AscendantIdentity` instead of `AscendantArchetype`. Keep the old function for backwards compatibility.

In `src/engine/ascendant.ts`, add after the existing `createAscendant` function:

```typescript
import type { AscendantIdentity } from '../types/remembrance';

/**
 * Create ascendant and avatar nodes from a remembrance identity.
 * This is the new creation path — replaces archetype-based creation for the remembrance flow.
 */
export function createAscendantFromIdentity(
  graph: WorldGraph,
  identity: AscendantIdentity,
  startLocationId: string,
): CreateAscendantResult {
  const ascendantId = `asc.${identity.hungerId}`;
  const avatarId = `avatar.${identity.hungerId}`;

  const startingPool = createStartingEssencePool();

  // Boost primary/secondary sphere essence
  startingPool[identity.sphereAlignment.primary] = 10;
  startingPool[identity.sphereAlignment.secondary] = 8;

  const ascendantProperties: AscendantProperties = {
    actorType: 'ascendant',
    sphereAlignment: identity.sphereAlignment,
    essencePool: startingPool,
    maxEssence: BASE_MAX_ESSENCE,
    archetypeId: identity.hungerId,
    interventionHistory: {},
    avatarId,
  };

  graph.addNode({
    id: ascendantId,
    type: 'actor',
    name: identity.divineName,
    properties: ascendantProperties as unknown as Record<string, unknown>,
  });

  graph.addNode({
    id: avatarId,
    type: 'actor',
    name: identity.mortalName,
    properties: {
      actorType: 'individual',
      formDescription: `The mortal echo of ${identity.divineName}`,
      axiologicalProfile: identity.personalitySeed,
    },
  });

  graph.addEdge({
    id: `edge.avatar_of.${avatarId}`,
    source: avatarId,
    target: ascendantId,
    type: 'avatar_of',
    properties: {},
  });

  graph.addEdge({
    id: `edge.located_at.${avatarId}`,
    source: avatarId,
    target: startLocationId,
    type: 'located_at',
    properties: {},
  });

  return { ascendantId, avatarId };
}
```

- [ ] **Step 2: Add remembrance-compatible initialization path to gameInit.ts**

Add an alternative entry point that accepts `AscendantIdentity` and derives cosmology automatically. In `src/engine/gameInit.ts`, add a new export:

```typescript
import type { AscendantIdentity } from '../types/remembrance';
import { deriveCosmologyFromIdentity, deriveMapSize } from './remembrance';
import { createAscendantFromIdentity } from './ascendant';

/**
 * Initialize game state from a remembrance identity.
 * Cosmology and map size are derived from the identity unless overridden.
 */
export function initializeGameStateFromIdentity(
  identity: AscendantIdentity,
  seed: number,
  cosmologyOverride?: CosmologyProfile,
  mapSizeOverride?: MapSizePreset,
): ReturnType<typeof initializeGameState> {
  const cosmology = cosmologyOverride ?? deriveCosmologyFromIdentity({
    sphereAlignment: identity.sphereAlignment,
    mortalTags: identity.mortalTags,
    hungerId: identity.hungerId,
  });

  const mapSize = mapSizeOverride ?? deriveMapSize(identity.hungerId);
  const { cols, rows } = MAP_SIZE_PRESETS[mapSize];

  // Delegate to existing initializeGameState for world generation
  // but we need to construct a compatible archetype from the identity
  const compatArchetype: AscendantArchetype = {
    id: identity.hungerId,
    name: identity.divineName,
    title: identity.divineName,
    description: `${identity.hungerName} — ${identity.mandateDirection}`,
    sphereAlignment: identity.sphereAlignment,
    startingDomainAffinities: identity.domainAffinities,
    personalitySeed: identity.personalitySeed,
    flavorText: identity.mandateDirection,
  };

  return initializeGameState(
    compatArchetype,
    identity.mortalName,
    cosmology,
    seed,
    cols,
    rows,
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean compile

- [ ] **Step 4: Run all existing tests to ensure nothing is broken**

Run: `npx vitest run`
Expected: All existing tests still pass (we only added, didn't modify)

- [ ] **Step 5: Commit**

```bash
git add src/engine/ascendant.ts src/engine/gameInit.ts src/types/influence.ts
git commit -m "feat(remembrance): add identity-based creation and init paths"
```

---

## Phase 3: UI Components

### Task 5: Create FragmentCard Reusable Component

**Files:**
- Create: `src/components/Remembrance/FragmentCard.tsx`

The shared component for displaying a remembrance fragment (used in Origin, Drive, and Hunger beats).

- [ ] **Step 1: Create the component**

```typescript
// src/components/Remembrance/FragmentCard.tsx
import { useCallback } from 'react';

interface FragmentCardProps {
  prose: string;
  imageAssetPath: string;
  selected: boolean;
  onClick: () => void;
  accentColor?: string;
  testId?: string;
}

export function FragmentCard({
  prose,
  imageAssetPath,
  selected,
  onClick,
  accentColor = '#c9b8f0',
  testId,
}: FragmentCardProps) {
  const handleClick = useCallback(() => onClick(), [onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid={testId}
      className="w-full text-left transition-all duration-300 cursor-pointer group"
      style={{
        background: selected
          ? `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? accentColor : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '12px',
        padding: '20px',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? `0 0 24px ${accentColor}20` : 'none',
      }}
    >
      <div className="flex gap-4 items-start">
        {/* Abstract image */}
        <div
          className="w-24 h-16 rounded-lg flex-shrink-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageAssetPath})`,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        />
        {/* Prose text */}
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: selected ? '#e8e0f0' : '#a09090' }}
        >
          {prose}
        </p>
      </div>
      {/* Selection indicator */}
      {selected && (
        <div
          className="mt-3 h-0.5 rounded-full transition-all duration-500"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
      )}
    </button>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Clean compile

- [ ] **Step 3: Commit**

```bash
git add src/components/Remembrance/FragmentCard.tsx
git commit -m "feat(remembrance): add FragmentCard reusable component"
```

---

### Task 6: Create Beat Components

**Files:**
- Create: `src/components/Remembrance/StirringBeat.tsx`
- Create: `src/components/Remembrance/OriginBeat.tsx`
- Create: `src/components/Remembrance/DriveBeat.tsx`
- Create: `src/components/Remembrance/TransformationBeat.tsx`
- Create: `src/components/Remembrance/RevealBeat.tsx`

Each beat is a self-contained component that receives accumulated state and emits the player's choice via a callback.

- [ ] **Step 1: Create StirringBeat**

```typescript
// src/components/Remembrance/StirringBeat.tsx
import { useState, useCallback } from 'react';
import type { StirringImage } from '../../types/remembrance';

interface StirringBeatProps {
  images: StirringImage[];
  onSelect: (image: StirringImage) => void;
}

export function StirringBeat({ images, onSelect }: StirringBeatProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  const handleSelect = useCallback((image: StirringImage) => {
    setSelectedId(image.id);
    setFading(true);
    setTimeout(() => onSelect(image), 600);
  }, [onSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-screen"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>
      <p className="text-lg italic mb-12 transition-opacity duration-500"
         style={{ color: '#8a7a9a', opacity: fading ? 0 : 1 }}>
        Something stirs in the void. What echoes?
      </p>
      <div className="grid grid-cols-2 gap-6 max-w-2xl transition-opacity duration-500"
           style={{ opacity: fading && !selectedId ? 0 : 1 }}>
        {images.map(image => (
          <button
            key={image.id}
            type="button"
            onClick={() => handleSelect(image)}
            data-testid={`stirring-${image.id}`}
            className="relative overflow-hidden rounded-xl cursor-pointer transition-all duration-500"
            style={{
              aspectRatio: '16/10',
              opacity: selectedId && selectedId !== image.id ? 0 : 1,
              transform: selectedId === image.id ? 'scale(1.05)' : 'scale(1)',
              boxShadow: selectedId === image.id ? '0 0 40px rgba(200,180,240,0.2)' : 'none',
            }}
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${image.imageAssetPath})`,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create OriginBeat**

```typescript
// src/components/Remembrance/OriginBeat.tsx
import { useState, useCallback } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';

interface OriginBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment, mortalName: string) => void;
}

export function OriginBeat({ fragments, onSelect }: OriginBeatProps) {
  const [selectedFragment, setSelectedFragment] = useState<RemembranceFragment | null>(null);
  const [mortalName, setMortalName] = useState('');
  const [showNaming, setShowNaming] = useState(false);

  const handleFragmentSelect = useCallback((fragment: RemembranceFragment) => {
    setSelectedFragment(fragment);
    setTimeout(() => setShowNaming(true), 400);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedFragment) return;
    const name = mortalName.trim() || 'The Unnamed';
    onSelect(selectedFragment, name);
  }, [selectedFragment, mortalName, onSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-screen px-8"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>
      <p className="text-lg italic mb-10"
         style={{ color: '#9bc4a9' }}>
        You remember...
      </p>

      <div className="flex flex-col gap-4 max-w-2xl w-full mb-8">
        {fragments.map(fragment => (
          <FragmentCard
            key={fragment.id}
            prose={fragment.prose}
            imageAssetPath={fragment.imageAssetPath}
            selected={selectedFragment?.id === fragment.id}
            onClick={() => handleFragmentSelect(fragment)}
            accentColor="#8cb89a"
            testId={`origin-${fragment.id}`}
          />
        ))}
      </div>

      {/* Mortal naming */}
      <div
        className="max-w-md w-full transition-all duration-500"
        style={{
          opacity: showNaming ? 1 : 0,
          transform: showNaming ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showNaming ? 'auto' : 'none',
        }}
      >
        <p className="text-sm italic mb-3 text-center" style={{ color: '#8a9a8a' }}>
          You had a name once.
        </p>
        <input
          type="text"
          value={mortalName}
          onChange={e => setMortalName(e.target.value)}
          placeholder="What were you called?"
          data-testid="mortal-name-input"
          className="w-full bg-transparent border rounded-lg px-4 py-3 text-center text-lg outline-none transition-colors"
          style={{
            borderColor: 'rgba(155,196,169,0.3)',
            color: '#e0f0e8',
          }}
        />
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedFragment}
          data-testid="origin-continue"
          className="w-full mt-4 py-3 rounded-lg text-sm font-medium transition-all duration-300"
          style={{
            background: selectedFragment
              ? 'linear-gradient(135deg, #8cb89a, #6a9a7a)'
              : 'rgba(255,255,255,0.05)',
            color: selectedFragment ? '#1a2e1a' : '#666',
            cursor: selectedFragment ? 'pointer' : 'default',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create DriveBeat**

```typescript
// src/components/Remembrance/DriveBeat.tsx
import { useState, useCallback } from 'react';
import type { RemembranceFragment } from '../../types/remembrance';
import { FragmentCard } from './FragmentCard';

interface DriveBeatProps {
  fragments: RemembranceFragment[];
  onSelect: (fragment: RemembranceFragment) => void;
}

export function DriveBeat({ fragments, onSelect }: DriveBeatProps) {
  const [selectedFragment, setSelectedFragment] = useState<RemembranceFragment | null>(null);
  const [fading, setFading] = useState(false);

  const handleSelect = useCallback((fragment: RemembranceFragment) => {
    setSelectedFragment(fragment);
    setFading(true);
    setTimeout(() => onSelect(fragment), 800);
  }, [onSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-screen px-8"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>
      <p className="text-lg italic mb-10 transition-opacity duration-500"
         style={{ color: '#c49bab', opacity: fading ? 0 : 1 }}>
        But there was something you could not release. Even now, it burns.
      </p>

      <div className="flex flex-col gap-4 max-w-2xl w-full transition-opacity duration-500"
           style={{ opacity: fading ? 0.3 : 1 }}>
        {fragments.map(fragment => (
          <FragmentCard
            key={fragment.id}
            prose={fragment.prose}
            imageAssetPath={fragment.imageAssetPath}
            selected={selectedFragment?.id === fragment.id}
            onClick={() => handleSelect(fragment)}
            accentColor="#b88c9a"
            testId={`drive-${fragment.id}`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create TransformationBeat**

```typescript
// src/components/Remembrance/TransformationBeat.tsx
import { useState, useCallback } from 'react';
import type { HungerDefinition, RemembranceFragment } from '../../types/remembrance';
import { selectHungerProse } from '../../engine/remembrance';
import { getSphereColor } from '../../data/sphereIcons';

interface TransformationBeatProps {
  hungers: HungerDefinition[];
  driveFragment: RemembranceFragment;
  onSelect: (hunger: HungerDefinition, courtType: string) => void;
}

type TransformationStep = 'hunger' | 'court' | 'sphere-reveal';

export function TransformationBeat({ hungers, driveFragment, onSelect }: TransformationBeatProps) {
  const [step, setStep] = useState<TransformationStep>('hunger');
  const [selectedHunger, setSelectedHunger] = useState<HungerDefinition | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const handleHungerSelect = useCallback((hunger: HungerDefinition) => {
    setSelectedHunger(hunger);
    setSelectedCourt(hunger.courtOptions.find(c => c.isDefault)!.courtType);
    setTimeout(() => setStep('court'), 600);
  }, []);

  const handleCourtConfirm = useCallback(() => {
    setStep('sphere-reveal');
    setRevealing(true);
    setTimeout(() => {
      if (selectedHunger && selectedCourt) {
        onSelect(selectedHunger, selectedCourt);
      }
    }, 2000); // Allow sphere reveal animation to play
  }, [selectedHunger, selectedCourt, onSelect]);

  const primaryColor = selectedHunger
    ? getSphereColor(selectedHunger.sphereAlignment.primary)
    : '#c9b8f0';

  return (
    <div className="flex flex-col items-center justify-center h-screen px-8"
         style={{ background: 'var(--bg-abyss, #0a0a0f)' }}>

      {/* Intro text */}
      {step === 'hunger' && (
        <>
          <p className="text-lg italic mb-4" style={{ color: '#c4b49b' }}>
            And then the power found you. Or you found it.
          </p>
          <p className="text-sm italic mb-10" style={{ color: '#9a8a6a' }}>
            It does not matter which. It was hungry. So were you.
          </p>

          <div className="flex flex-col gap-4 max-w-2xl w-full">
            {hungers.map(hunger => {
              const prose = selectHungerProse(hunger, driveFragment);
              return (
                <button
                  key={hunger.id}
                  type="button"
                  onClick={() => handleHungerSelect(hunger)}
                  data-testid={`hunger-${hunger.id}`}
                  className="w-full text-left rounded-xl p-6 transition-all duration-300 cursor-pointer"
                  style={{
                    background: selectedHunger?.id === hunger.id
                      ? `linear-gradient(135deg, ${primaryColor}18, transparent)`
                      : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${selectedHunger?.id === hunger.id ? '#8a7a4a' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="flex gap-4 items-start">
                    <div
                      className="w-20 h-20 rounded-lg flex-shrink-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${hunger.imageAssetPath})`,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                      }}
                    />
                    <p className="text-sm leading-relaxed italic" style={{ color: '#d4c48a' }}>
                      {prose}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Court geometry */}
      {step === 'court' && selectedHunger && (
        <>
          <p className="text-lg italic mb-10" style={{ color: '#b4b48a' }}>
            The power settles into a pattern...
          </p>

          <div className="flex flex-col gap-4 max-w-lg w-full mb-8">
            {selectedHunger.courtOptions.map(option => (
              <button
                key={option.courtType}
                type="button"
                onClick={() => setSelectedCourt(option.courtType)}
                data-testid={`court-${option.courtType}`}
                className="w-full text-left rounded-xl p-5 transition-all duration-300 cursor-pointer"
                style={{
                  background: selectedCourt === option.courtType
                    ? 'rgba(180,164,138,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedCourt === option.courtType ? '#8a7a4a' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <p className="text-sm italic" style={{ color: '#b4a48a' }}>
                  {option.prose}
                </p>
                {option.isDefault && selectedCourt === option.courtType && (
                  <span className="text-xs mt-2 block" style={{ color: '#666' }}>
                    (this feels natural)
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCourtConfirm}
            data-testid="court-confirm"
            className="py-3 px-8 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #8a7a4a, #6a5a3a)',
              color: '#f0e0b8',
            }}
          >
            Continue
          </button>
        </>
      )}

      {/* Sphere reveal */}
      {step === 'sphere-reveal' && selectedHunger && (
        <div
          className="flex flex-col items-center justify-center transition-opacity duration-1000"
          style={{ opacity: revealing ? 1 : 0 }}
        >
          <p className="text-sm italic mb-6" style={{ color: '#9a9a7a' }}>
            The spheres align. This was always going to happen.
          </p>
          <div
            className="w-48 h-48 rounded-full mb-8 transition-all duration-1500"
            style={{
              background: `radial-gradient(circle, ${primaryColor}40, transparent)`,
              boxShadow: `0 0 80px ${primaryColor}30`,
            }}
          />
          <p className="text-xl italic" style={{ color: primaryColor }}>
            {selectedHunger.sphereAlignment.primary} and {selectedHunger.sphereAlignment.secondary} pour through you.
          </p>
          <p className="text-sm italic mt-2" style={{ color: '#777' }}>
            The universe recognizes what you are.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create RevealBeat**

```typescript
// src/components/Remembrance/RevealBeat.tsx
import { useState, useCallback } from 'react';
import type { AscendantIdentity, RemembranceFragment, HungerDefinition } from '../../types/remembrance';
import { getSphereColor } from '../../data/sphereIcons';

interface RevealBeatProps {
  originFragment: RemembranceFragment;
  driveFragment: RemembranceFragment;
  hunger: HungerDefinition;
  mortalName: string;
  courtType: string;
  suggestedDivineName: string;
  onComplete: (divineName: string) => void;
}

export function RevealBeat({
  originFragment,
  driveFragment,
  hunger,
  mortalName,
  courtType,
  suggestedDivineName,
  onComplete,
}: RevealBeatProps) {
  const [divineName, setDivineName] = useState('');
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useState(() => {
    setTimeout(() => setVisible(true), 100);
  });

  const handleAscend = useCallback(() => {
    const name = divineName.trim() || suggestedDivineName;
    onComplete(name);
  }, [divineName, suggestedDivineName, onComplete]);

  const primaryColor = getSphereColor(hunger.sphereAlignment.primary);

  const COURT_LABELS: Record<string, string> = {
    high_house: 'a High House',
    circle: 'a Circle',
    web: 'a Web',
    abyss: 'an Abyss',
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen px-8 transition-opacity duration-1000"
      style={{
        background: 'var(--bg-abyss, #0a0a0f)',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Reveal image */}
      <div
        className="w-64 h-40 rounded-xl mb-10 bg-cover bg-center"
        style={{
          backgroundImage: `url(${hunger.imageAssetPath})`,
          backgroundColor: 'rgba(255,255,255,0.05)',
          boxShadow: `0 0 60px ${primaryColor}20`,
        }}
      />

      {/* Identity narrative */}
      <div className="max-w-lg text-center space-y-3 mb-10">
        <p className="text-sm italic" style={{ color: '#8a8a8a' }}>
          You were called <strong style={{ color: '#e8e0f0' }}>{mortalName}</strong>.
        </p>
        <p className="text-sm italic" style={{ color: '#8a8a8a' }}>
          {originFragment.prose}
        </p>
        <p className="text-sm italic" style={{ color: '#b88c9a' }}>
          {driveFragment.prose}
        </p>
        <p className="text-base italic mt-4" style={{ color: '#d4c48a' }}>
          Now you hunger to <strong>{hunger.name}</strong>. {hunger.mandateDirection}.
        </p>
        <p className="text-sm" style={{ color: primaryColor }}>
          {hunger.sphereAlignment.primary} and {hunger.sphereAlignment.secondary} pour through you.
          Your court is {COURT_LABELS[courtType] ?? courtType}.
        </p>
      </div>

      {/* Divine naming */}
      <p className="text-sm italic mb-3" style={{ color: '#8a7a9a' }}>
        The mortals will need a name for what you are.
      </p>
      <input
        type="text"
        value={divineName}
        onChange={e => setDivineName(e.target.value)}
        placeholder={suggestedDivineName}
        data-testid="divine-name-input"
        className="w-80 bg-transparent border rounded-lg px-4 py-3 text-center text-lg outline-none transition-colors mb-4"
        style={{
          borderColor: `${primaryColor}40`,
          color: '#e8e0f0',
        }}
      />
      <button
        type="button"
        onClick={handleAscend}
        data-testid="ascend-button"
        className="py-3 px-12 rounded-lg text-base font-medium transition-all duration-300 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
          color: '#1a1a1a',
        }}
      >
        Ascend
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Verify all components compile**

Run: `npx tsc --noEmit`
Expected: Clean compile. Note: `getSphereColor` import may need path adjustment — check `src/data/sphereColors.ts` or similar. If it doesn't exist as a standalone export, extract from `ArchetypeCard.tsx` where it's currently used.

- [ ] **Step 7: Commit**

```bash
git add src/components/Remembrance/
git commit -m "feat(remembrance): add all beat components — Stirring, Origin, Drive, Transformation, Reveal"
```

---

### Task 7: Create RemembranceFlow Orchestrator

**Files:**
- Create: `src/components/Remembrance/RemembranceFlow.tsx`

This is the state machine that sequences through all beats and accumulates the player's choices into a final `AscendantIdentity`.

- [ ] **Step 1: Create the flow orchestrator**

```typescript
// src/components/Remembrance/RemembranceFlow.tsx
import { useState, useMemo, useCallback } from 'react';
import type {
  RemembranceBeat,
  RemembranceFragment,
  StirringImage,
  HungerDefinition,
  AscendantIdentity,
} from '../../types/remembrance';
import {
  filterOriginFragments,
  filterDriveFragments,
  filterHungers,
  generateDivineName,
  buildPersonalitySeed,
} from '../../engine/remembrance';
import { STIRRING_IMAGES } from '../../data/stirring-images';
import { ORIGIN_FRAGMENTS, DRIVE_FRAGMENTS } from '../../data/remembrance-fragments';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import { StirringBeat } from './StirringBeat';
import { OriginBeat } from './OriginBeat';
import { DriveBeat } from './DriveBeat';
import { TransformationBeat } from './TransformationBeat';
import { RevealBeat } from './RevealBeat';

interface RemembranceFlowProps {
  seed: number;
  onComplete: (identity: AscendantIdentity) => void;
}

export function RemembranceFlow({ seed, onComplete }: RemembranceFlowProps) {
  const [beat, setBeat] = useState<RemembranceBeat>('stirring');

  // Accumulated state
  const [stirringImage, setStirringImage] = useState<StirringImage | null>(null);
  const [originFragment, setOriginFragment] = useState<RemembranceFragment | null>(null);
  const [mortalName, setMortalName] = useState<string | null>(null);
  const [driveFragment, setDriveFragment] = useState<RemembranceFragment | null>(null);
  const [hunger, setHunger] = useState<HungerDefinition | null>(null);
  const [courtType, setCourtType] = useState<string | null>(null);

  // Filtered content (computed from accumulated state)
  const originFragments = useMemo(() => {
    if (!stirringImage) return [];
    return filterOriginFragments(stirringImage, ORIGIN_FRAGMENTS, seed);
  }, [stirringImage, seed]);

  const driveFragments = useMemo(() => {
    if (!originFragment) return [];
    return filterDriveFragments(originFragment, DRIVE_FRAGMENTS, seed);
  }, [originFragment, seed]);

  const hungerOptions = useMemo(() => {
    if (!originFragment || !driveFragment) return [];
    return filterHungers(originFragment, driveFragment, HUNGER_CATALOG, seed);
  }, [originFragment, driveFragment, seed]);

  const suggestedDivineName = useMemo(() => {
    if (!hunger || !originFragment) return 'The Unnamed';
    return generateDivineName(hunger, originFragment, seed);
  }, [hunger, originFragment, seed]);

  // Beat handlers
  const handleStirringSelect = useCallback((image: StirringImage) => {
    setStirringImage(image);
    setBeat('origin');
  }, []);

  const handleOriginSelect = useCallback((fragment: RemembranceFragment, name: string) => {
    setOriginFragment(fragment);
    setMortalName(name);
    setBeat('drive');
  }, []);

  const handleDriveSelect = useCallback((fragment: RemembranceFragment) => {
    setDriveFragment(fragment);
    setBeat('transformation');
  }, []);

  const handleTransformationSelect = useCallback((h: HungerDefinition, court: string) => {
    setHunger(h);
    setCourtType(court);
    setBeat('reveal');
  }, []);

  const handleRevealComplete = useCallback((divineName: string) => {
    if (!originFragment || !driveFragment || !hunger || !courtType || !mortalName) return;

    const personalitySeed = buildPersonalitySeed(originFragment, driveFragment, hunger, seed);

    const identity: AscendantIdentity = {
      mortalName,
      originFragmentId: originFragment.id,
      driveFragmentId: driveFragment.id,
      timeSinceAscension: originFragment.timeSinceAscension ?? 'recent',
      mortalTags: [...originFragment.tags, ...driveFragment.tags],
      divineName,
      hungerId: hunger.id,
      hungerName: hunger.name,
      mandateDirection: hunger.mandateDirection,
      courtType: courtType as AscendantIdentity['courtType'],
      sphereAlignment: hunger.sphereAlignment,
      domainAffinities: hunger.domainAffinities,
      personalitySeed,
      ascendantLens: hunger.ascendantLens,
    };

    onComplete(identity);
  }, [originFragment, driveFragment, hunger, courtType, mortalName, seed, onComplete]);

  // Render current beat
  switch (beat) {
    case 'stirring':
      return <StirringBeat images={STIRRING_IMAGES} onSelect={handleStirringSelect} />;
    case 'origin':
      return <OriginBeat fragments={originFragments} onSelect={handleOriginSelect} />;
    case 'drive':
      return <DriveBeat fragments={driveFragments} onSelect={handleDriveSelect} />;
    case 'transformation':
      return (
        <TransformationBeat
          hungers={hungerOptions}
          driveFragment={driveFragment!}
          onSelect={handleTransformationSelect}
        />
      );
    case 'reveal':
      return (
        <RevealBeat
          originFragment={originFragment!}
          driveFragment={driveFragment!}
          hunger={hunger!}
          mortalName={mortalName!}
          courtType={courtType!}
          suggestedDivineName={suggestedDivineName}
          onComplete={handleRevealComplete}
        />
      );
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Clean compile

- [ ] **Step 3: Commit**

```bash
git add src/components/Remembrance/RemembranceFlow.tsx
git commit -m "feat(remembrance): add RemembranceFlow orchestrator with state machine"
```

---

## Phase 4: Integration

### Task 8: Wire Into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update the GamePhase type and add remembrance routing**

In `src/App.tsx`:

1. Update the `GamePhase` union to add a `remembrance` phase and update `playing` to accept `AscendantIdentity`:

```typescript
import type { AscendantIdentity } from './types/remembrance';
import { RemembranceFlow } from './components/Remembrance/RemembranceFlow';
import { initializeGameStateFromIdentity } from './engine/gameInit';

type GamePhase =
  | { phase: 'start' }
  | { phase: 'worldgen' }           // kept for Advanced Settings
  | { phase: 'selection' }          // kept for backwards compat
  | { phase: 'remembrance' }        // NEW: narrative creation flow
  | { phase: 'playing'; archetype: AscendantArchetype; avatarName: string }
  | { phase: 'playing-remembrance'; identity: AscendantIdentity };  // NEW
```

2. In the StartPage's `onNewWorld` callback, route to `remembrance` instead of `worldgen`:

```typescript
// Change: onNewWorld={() => setGamePhase({ phase: 'worldgen' })}
// To:     onNewWorld={() => setGamePhase({ phase: 'remembrance' })}
```

3. Add remembrance phase render case (before the worldgen default):

```typescript
if (gamePhase.phase === 'remembrance') {
  return (
    <RemembranceFlow
      seed={seed}
      onComplete={(identity) => {
        setGamePhase({ phase: 'playing-remembrance', identity });
      }}
    />
  );
}
```

4. Add the playing-remembrance render case (alongside the existing playing case):

```typescript
if (gamePhase.phase === 'playing-remembrance') {
  // Build a compat archetype for GameView (which still expects the old shape)
  const compat: AscendantArchetype = {
    id: gamePhase.identity.hungerId,
    name: gamePhase.identity.divineName,
    title: gamePhase.identity.divineName,
    description: gamePhase.identity.mandateDirection,
    sphereAlignment: gamePhase.identity.sphereAlignment,
    startingDomainAffinities: gamePhase.identity.domainAffinities,
    personalitySeed: gamePhase.identity.personalitySeed,
    flavorText: gamePhase.identity.mandateDirection,
  };

  const derivedCosmology = deriveCosmologyFromIdentity({
    sphereAlignment: gamePhase.identity.sphereAlignment,
    mortalTags: gamePhase.identity.mortalTags,
    hungerId: gamePhase.identity.hungerId,
  });

  return (
    <GameView
      archetype={compat}
      avatarName={gamePhase.identity.mortalName}
      cosmology={derivedCosmology}
      seed={seed}
      mapSize={deriveMapSize(gamePhase.identity.hungerId)}
    />
  );
}
```

Add the necessary import for `deriveCosmologyFromIdentity` and `deriveMapSize`:

```typescript
import { deriveCosmologyFromIdentity, deriveMapSize } from './engine/remembrance';
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: Clean compile

- [ ] **Step 3: Run all existing tests**

Run: `npx vitest run`
Expected: All pass (no existing behavior changed — old paths still work)

- [ ] **Step 4: Build for production**

Run: `npx vite build`
Expected: Successful build (confirms Vercel will deploy)

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(remembrance): wire RemembranceFlow into App phase machine"
```

---

### Task 9: Add Advanced Settings Toggle to Start Page

**Files:**
- Modify: `src/components/StartPage/StartPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add an "Advanced" option to the start page menu**

In `src/components/StartPage/StartPage.tsx`, add a new prop and menu item:

```typescript
interface StartPageProps {
  onNewWorld: () => void;
  onAdvancedNewWorld?: () => void;  // NEW: opens classic worldgen flow
}
```

Add a small "Advanced" link below the main menu:

```typescript
{onAdvancedNewWorld && (
  <button
    type="button"
    onClick={onAdvancedNewWorld}
    className="text-xs mt-4 transition-colors cursor-pointer"
    style={{ color: '#555', textDecoration: 'underline' }}
  >
    Advanced World Setup
  </button>
)}
```

- [ ] **Step 2: Wire the advanced callback in App.tsx**

Pass the new prop to StartPage:

```typescript
<StartPage
  onNewWorld={() => setGamePhase({ phase: 'remembrance' })}
  onAdvancedNewWorld={() => setGamePhase({ phase: 'worldgen' })}
/>
```

- [ ] **Step 3: Verify it compiles and build succeeds**

Run: `npx tsc --noEmit && npx vite build`
Expected: Both clean

- [ ] **Step 4: Commit**

```bash
git add src/components/StartPage/StartPage.tsx src/App.tsx
git commit -m "feat(remembrance): add Advanced World Setup toggle to start page"
```

---

## Phase 5: Component Tests

### Task 10: Write Flow Orchestration Tests

**Files:**
- Create: `src/components/Remembrance/__tests__/RemembranceFlow.test.tsx`

- [ ] **Step 1: Write component tests**

```typescript
// @vitest-environment jsdom
// src/components/Remembrance/__tests__/RemembranceFlow.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RemembranceFlow } from '../RemembranceFlow';

describe('RemembranceFlow', () => {
  it('renders the Stirring beat initially', () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    expect(screen.getByText(/something stirs in the void/i)).toBeInTheDocument();
  });

  it('shows stirring images', () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const images = screen.getAllByTestId(/^stirring-/);
    expect(images.length).toBeGreaterThanOrEqual(4);
  });

  it('transitions from stirring to origin on image click', async () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const firstImage = screen.getAllByTestId(/^stirring-/)[0];
    fireEvent.click(firstImage);
    await waitFor(() => {
      expect(screen.getByText(/you remember/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows origin fragments after stirring selection', async () => {
    const onComplete = vi.fn();
    render(<RemembranceFlow seed={42} onComplete={onComplete} />);
    const firstImage = screen.getAllByTestId(/^stirring-/)[0];
    fireEvent.click(firstImage);
    await waitFor(() => {
      const fragments = screen.getAllByTestId(/^origin-/);
      expect(fragments).toHaveLength(3);
    }, { timeout: 1000 });
  });
});
```

- [ ] **Step 2: Run the component tests**

Run: `npx vitest run src/components/Remembrance/__tests__/RemembranceFlow.test.tsx`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/Remembrance/__tests__/RemembranceFlow.test.tsx
git commit -m "test(remembrance): add flow orchestration component tests"
```

---

## Phase 6: Verification & Polish

### Task 11: End-to-End Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Successful build

- [ ] **Step 4: Visual verification with dev server**

Start the dev server and verify the full flow works:

1. Navigate to the start page
2. Click "New World" — should enter the Stirring beat
3. Click an abstract image — should transition to Origin with 3 fragments
4. Click an origin fragment, enter a mortal name, click Continue — should transition to Drive
5. Click a drive fragment — should transition to Transformation
6. Click a hunger — should show court geometry options
7. Confirm court — should show sphere reveal animation
8. See the Reveal with full identity, enter divine name, click Ascend
9. Game should start with derived cosmology

Also verify: "Advanced World Setup" link on start page leads to the old worldgen flow.

- [ ] **Step 5: Commit any fixes from verification**

---

### Task 12: Documentation Updates

**Files:**
- Modify: `Docs/changelog.md`
- Modify: `Docs/project-status.md`

- [ ] **Step 1: Update changelog**

Append to `Docs/changelog.md`:

```markdown
| 2026-04-XX | Remembrance Flow | Replaced 3-screen creation (cosmology sliders → archetype cards → avatar naming) with narrative remembrance experience: Stirring → Origin → Drive → Transformation → Reveal | Design: Malazan-inspired ascendant creation with mortal echo + divine hunger |
| 2026-04-XX | Dual Naming | Added mortal name (Origin beat) + divine name (Reveal beat) replacing single avatar name | Mortal name surfaces rarely in gameplay for emotional impact |
| 2026-04-XX | Hunger System | Added 4 starter Hungers (Gather, Witness, Reclaim, Reshape) as gameplay archetypes | Each Hunger = mandate + court default + sphere alignment + ascendant lens |
| 2026-04-XX | Cosmology Derivation | Cosmology now derived from ascendant identity by default; old sliders available via "Advanced World Setup" | Primary sphere 0.25, secondary 0.20, remainder distributed |
```

- [ ] **Step 2: Update project-status.md**

Add a current-state entry for the remembrance flow.

- [ ] **Step 3: Commit**

```bash
git add Docs/changelog.md Docs/project-status.md
git commit -m "docs: update changelog and project status for remembrance flow"
```

---

## Future Work (Not In This Plan)

These are explicitly deferred to follow-up workstreams:

1. **Content Expansion** — Expand from 4/6/6/4 starter content to full library (12-24 Origins, 20-30 Drives, 8-12 Hungers). This is an Opus content authoring task.
2. **Art Generation Pipeline** — Generate 50-80 abstract images for all beats. Requires `art-direction` skill and image generation tools.
3. **Transition Animations** — Ghost layering (previous choice images lingering), dissolve/fade transitions between beats, sphere reveal cinematic.
4. **Audio Integration** — Per-beat audio mood shifts (Stirring = near-silence, Drive = tension, Transformation = cosmic resonance).
5. **Meet The First Connection** — Wire ascendant lens and hunger into the Meet The First encounter filtering and vignette enrichment.
6. **Mandate System** — Implement concrete victory conditions for each Hunger, wired to existing doom clock and mandate systems.
7. **Ruins Layer Connection** — Ancient ascendants' starting connections to ruins nodes, forgotten temples, dormant cults.

---

## Summary

| Phase | Tasks | Estimated Steps | Model |
|-------|-------|----------------|-------|
| **1. Types** | Task 1 | 4 | Sonnet |
| **2. Engine** | Tasks 2-4 | 15 | Sonnet |
| **3. UI Components** | Tasks 5-7 | 9 | Sonnet (scaffolding) |
| **4. Integration** | Tasks 8-9 | 9 | Sonnet |
| **5. Tests** | Task 10 | 3 | Sonnet |
| **6. Verification** | Tasks 11-12 | 7 | Sonnet |
| **Total** | 12 tasks | ~47 steps | |
