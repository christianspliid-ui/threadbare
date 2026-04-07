# Encounter Veil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace TieredEncounterModal and EncounterStage with a single full-screen EncounterVeil component using dissolved-art Remembrance aesthetic.

**Architecture:** New EncounterVeil component consumes the existing EncounterStageModel (extended with 3 choice fields). A new buildSimpleEncounterStageModel adapter bridges legacy encounters that currently bypass the model. GameView routes all encounters through EncounterVeil.

**Tech Stack:** React 19, TypeScript, Vitest, @testing-library/react, CSS-in-JS (inline styles matching existing codebase pattern), createPortal for full-screen overlay.

**Design Spec:** `Docs/plans/2026-04-07-encounter-veil-design.md`
**Visual Prototype:** `Docs/prototypes/encounter-veil.html`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/Game/encounter-stage/types.ts` | Modify | Add interventionType, godVoice, probabilityBoost to EncounterStageChoiceModel |
| `src/types/encounter.ts` | Modify | Add illustrationUrl/illustrationAlt to EncounterTemplate |
| `src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts` | Create | Adapter: raw encounter data → EncounterStageModel |
| `src/components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel.ts` | Modify | Populate new choice fields from notification data |
| `src/components/Game/encounter-stage/adapters/buildGateDutyEncounterStageModel.ts` | Modify | Populate new choice fields from notification data |
| `src/components/Game/EncounterVeil.tsx` | Create | Full-screen overlay: dissolved art, prose, choices, all tiers, aftermath |
| `src/components/Game/GameView.tsx` | Modify | Route all encounters through EncounterVeil |
| `src/data/unified-action-templates.ts` | Modify | Add illustrationUrl to templates with existing concept art |

---

### Task 1: Extend EncounterStageChoiceModel with intervention fields

**Files:**
- Modify: `src/components/Game/encounter-stage/types.ts`

The Veil needs intervention type (for color-coded choice glow), god-voice (for selected reveal), and probability boost (for meta display). These are optional so existing adapters continue to compile.

- [ ] **Step 1: Add three optional fields to EncounterStageChoiceModel**

In `src/components/Game/encounter-stage/types.ts`, find the `EncounterStageChoiceModel` interface and add after the `likelyBurden` field:

```typescript
  /** Intervention type — supportive, coercive, or withdrawn. Drives choice glow color. */
  interventionType?: 'supportive' | 'coercive' | 'withdrawn';
  /** God-voice quote revealed when choice is selected. */
  godVoice?: string;
  /** Probability boost (0.0–1.0) shown in choice meta. */
  probabilityBoost?: number;
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit`
Expected: Clean — fields are optional, no consumers break.

- [ ] **Step 3: Commit**

```bash
git add src/components/Game/encounter-stage/types.ts
git commit -m "types: extend EncounterStageChoiceModel with interventionType, godVoice, probabilityBoost"
```

---

### Task 2: Add illustration fields to EncounterTemplate

**Files:**
- Modify: `src/types/encounter.ts`

Legacy EncounterTemplate has no illustration support. Add optional fields matching UnifiedActionTemplate's existing pattern.

- [ ] **Step 1: Add illustrationUrl and illustrationAlt to EncounterTemplate**

In `src/types/encounter.ts`, find the `EncounterTemplate` interface. Add after the `musicTrack` field (or at the end of the interface):

```typescript
  /** Concept art image URL. Relative to public/ root. Example: '/concept-art/encounters/gate-duty.jpg' */
  readonly illustrationUrl?: string;
  /** Alt text for the concept art image (accessibility). */
  readonly illustrationAlt?: string;
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit`
Expected: Clean — fields are optional.

- [ ] **Step 3: Commit**

```bash
git add src/types/encounter.ts
git commit -m "types: add illustrationUrl/illustrationAlt to EncounterTemplate"
```

---

### Task 3: Populate new choice fields in unified adapter

**Files:**
- Modify: `src/components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel.ts`
- Test: `src/components/Game/encounter-stage/adapters/__tests__/buildUnifiedEncounterStageModel.test.ts`

The unified adapter builds EncounterStageChoiceModel from notification choices but currently doesn't include interventionType, godVoice, or probabilityBoost. These fields exist on EncounterInterventionChoice (from encounterVisibility.ts) and need to be passed through.

- [ ] **Step 1: Write test for new choice fields**

Add to the existing test file `src/components/Game/encounter-stage/adapters/__tests__/buildUnifiedEncounterStageModel.test.ts`:

```typescript
it('populates interventionType, godVoice, and probabilityBoost on choices', () => {
  const notification = buildNotification({
    choices: [
      {
        id: 'choice-1',
        text: 'Force it',
        essenceCost: 2,
        probabilityBoost: 0.2,
        interventionType: 'coercive',
        godVoice: 'Let them burn.',
      },
    ],
  });
  const model = buildUnifiedEncounterStageModel({
    ...baseArgs,
    notification,
  });
  expect(model.choices[0].interventionType).toBe('coercive');
  expect(model.choices[0].godVoice).toBe('Let them burn.');
  expect(model.choices[0].probabilityBoost).toBe(0.2);
});
```

Note: `baseArgs` and `buildNotification` are existing fixtures in this test file. Adapt if the fixture names differ — read the file to confirm.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/encounter-stage/adapters/__tests__/buildUnifiedEncounterStageModel.test.ts -t "populates interventionType"`
Expected: FAIL — the fields are undefined on the choice model.

- [ ] **Step 3: Pass through the fields in the adapter**

In `buildUnifiedEncounterStageModel.ts`, find the function that maps notification choices to `EncounterStageChoiceModel[]`. It will look something like:

```typescript
notification.choices.map(choice => ({
  id: choice.id,
  label: choice.text,
  intent: choice.text,
  essenceCost: choice.essenceCost,
  affordable: choice.essenceCost <= args.essence,
  // ... existing fields
}))
```

Add the three new fields to the spread:

```typescript
  interventionType: choice.interventionType,
  godVoice: choice.godVoice,
  probabilityBoost: choice.probabilityBoost,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/encounter-stage/adapters/__tests__/buildUnifiedEncounterStageModel.test.ts -t "populates interventionType"`
Expected: PASS

- [ ] **Step 5: Run all adapter tests**

Run: `npx vitest run src/components/Game/encounter-stage/adapters/`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel.ts src/components/Game/encounter-stage/adapters/__tests__/buildUnifiedEncounterStageModel.test.ts
git commit -m "feat: populate interventionType, godVoice, probabilityBoost in unified adapter"
```

---

### Task 4: Populate new choice fields in gate-duty adapter

**Files:**
- Modify: `src/components/Game/encounter-stage/adapters/buildGateDutyEncounterStageModel.ts`
- Test: `src/components/Game/encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts`

Same change as Task 3 but for the gate-duty adapter.

- [ ] **Step 1: Write test for new choice fields**

Add to the existing test file `src/components/Game/encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts`:

```typescript
it('passes through interventionType, godVoice, and probabilityBoost on choices', () => {
  const result = buildGateDutyEncounterStageModel({
    ...baseArgs,
    notification: {
      ...baseArgs.notification,
      choices: [
        {
          id: 'c1',
          text: 'Detain',
          essenceCost: 1,
          probabilityBoost: 0.15,
          interventionType: 'coercive',
          godVoice: 'Hold them.',
        },
      ],
    },
  });
  expect(result.choices[0].interventionType).toBe('coercive');
  expect(result.choices[0].godVoice).toBe('Hold them.');
  expect(result.choices[0].probabilityBoost).toBe(0.15);
});
```

Adapt fixture names (`baseArgs`, etc.) to match the existing test file.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts -t "passes through interventionType"`
Expected: FAIL

- [ ] **Step 3: Pass through the fields in the adapter**

Find the choice mapping in `buildGateDutyEncounterStageModel.ts` and add:

```typescript
  interventionType: choice.interventionType,
  godVoice: choice.godVoice,
  probabilityBoost: choice.probabilityBoost,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/Game/encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts -t "passes through interventionType"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/encounter-stage/adapters/buildGateDutyEncounterStageModel.ts src/components/Game/encounter-stage/__tests__/buildGateDutyEncounterStageModel.test.ts
git commit -m "feat: populate interventionType, godVoice, probabilityBoost in gate-duty adapter"
```

---

### Task 5: Create buildSimpleEncounterStageModel adapter

**Files:**
- Create: `src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts`
- Create: `src/components/Game/encounter-stage/adapters/__tests__/buildSimpleEncounterStageModel.test.ts`

This adapter bridges legacy encounters (currently handled by TieredEncounterModal) to the EncounterStageModel contract. It does the prose enrichment that TieredEncounterModal performs inline.

- [ ] **Step 1: Write the test file**

Create `src/components/Game/encounter-stage/adapters/__tests__/buildSimpleEncounterStageModel.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { buildSimpleEncounterStageModel } from '../buildSimpleEncounterStageModel';
import type { EncounterTemplate } from '../../../../../types/encounter';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { ActiveEncounterDisplay } from '../../../encounterNotificationRuntime';
import type { ThreadTier } from '../../../TieredEncounterModal';
import { WorldGraph } from '../../../../../engine/graph';

function buildTemplate(overrides?: Partial<EncounterTemplate>): EncounterTemplate {
  return {
    id: 'test.encounter',
    name: 'Test Encounter',
    steps: [
      {
        id: 'step-1',
        name: 'First Step',
        narrative: 'A test encounter unfolds.',
        reach: 'iron',
        difficulty: 50,
        duration: 1,
        onSuccess: { narrative: 'You succeeded.' },
        onFailure: { narrative: 'You failed.' },
      },
    ],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'background',
    motivations: [],
    locationTypes: [],
    ...overrides,
  } as EncounterTemplate;
}

function buildNotification(overrides?: Partial<EncounterNotification>): EncounterNotification {
  return {
    id: 'notif-1',
    agentId: 'agent-1',
    agentName: 'Vasara',
    courtPosition: 'the_first',
    encounterId: 'test.encounter',
    encounterName: 'Test Encounter',
    prose: 'A test encounter unfolds.',
    choices: [
      {
        id: 'choice-1',
        text: 'Act boldly',
        essenceCost: 2,
        probabilityBoost: 0.2,
        interventionType: 'supportive',
        godVoice: 'Be brave.',
      },
    ],
    createdTick: 10,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
    ...overrides,
  } as EncounterNotification;
}

function buildEncounter(overrides?: Partial<ActiveEncounterDisplay>): ActiveEncounterDisplay {
  return {
    encounterId: 'test.encounter',
    actorId: 'agent-1',
    currentStepIndex: 0,
    status: 'awaiting_choice',
    history: [],
    startedTick: 10,
    sourceSystem: 'legacy_encounter',
    ...overrides,
  } as ActiveEncounterDisplay;
}

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent-1', name: 'Vasara the Unbowed', category: 'actor', properties: {} });
  return graph;
}

describe('buildSimpleEncounterStageModel', () => {
  const baseArgs = {
    notification: buildNotification(),
    encounter: buildEncounter(),
    template: buildTemplate(),
    agentName: 'Vasara the Unbowed',
    agentId: 'agent-1',
    graph: buildGraph(),
    threadTier: 'strong' as ThreadTier,
    essence: 10,
    tick: 12,
  };

  it('produces a valid EncounterStageModel with header', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.header.title).toBe('Test Encounter');
    expect(model.header.threadTier).toBe('strong');
    expect(model.header.threatLabel).toBe('moderate');
  });

  it('builds narrative paragraphs from step narrative', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.narrative.paragraphs.length).toBeGreaterThan(0);
    const text = model.narrative.paragraphs[0].segments.map(s => s.text).join('');
    expect(text).toContain('test encounter');
  });

  it('maps notification choices with all fields', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.choices).toHaveLength(1);
    expect(model.choices[0].id).toBe('choice-1');
    expect(model.choices[0].label).toBe('Act boldly');
    expect(model.choices[0].interventionType).toBe('supportive');
    expect(model.choices[0].godVoice).toBe('Be brave.');
    expect(model.choices[0].probabilityBoost).toBe(0.2);
    expect(model.choices[0].essenceCost).toBe(2);
    expect(model.choices[0].affordable).toBe(true);
  });

  it('marks choices as unaffordable when essence is insufficient', () => {
    const model = buildSimpleEncounterStageModel({ ...baseArgs, essence: 0 });
    expect(model.choices[0].affordable).toBe(false);
  });

  it('builds step history from template steps', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.history).toHaveLength(1);
    expect(model.history[0].stepLabel).toBe('First Step');
    expect(model.history[0].status).toBe('current');
  });

  it('populates illustration when template has illustrationUrl', () => {
    const model = buildSimpleEncounterStageModel({
      ...baseArgs,
      template: buildTemplate({
        illustrationUrl: '/concept-art/encounters/gate-duty.jpg',
        illustrationAlt: 'A gate at dusk',
      }),
    });
    expect(model.illustration).toBeDefined();
    expect(model.illustration!.src).toBe('/concept-art/encounters/gate-duty.jpg');
    expect(model.illustration!.alt).toBe('A gate at dusk');
  });

  it('omits illustration when template has no illustrationUrl', () => {
    const model = buildSimpleEncounterStageModel(baseArgs);
    expect(model.illustration).toBeUndefined();
  });

  it('sets prose depth based on thread tier', () => {
    const fullModel = buildSimpleEncounterStageModel({ ...baseArgs, threadTier: 'strong' });
    const peekModel = buildSimpleEncounterStageModel({ ...baseArgs, threadTier: 'watched' });
    const fullText = fullModel.narrative.paragraphs.map(p => p.segments.map(s => s.text).join('')).join('');
    const peekText = peekModel.narrative.paragraphs.map(p => p.segments.map(s => s.text).join('')).join('');
    expect(peekText.length).toBeLessThanOrEqual(fullText.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/encounter-stage/adapters/__tests__/buildSimpleEncounterStageModel.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the adapter**

Create `src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts`:

```typescript
/**
 * buildSimpleEncounterStageModel
 *
 * Adapter for legacy encounters that TieredEncounterModal handled directly.
 * Converts raw encounter data (notification + template + graph) into
 * EncounterStageModel so EncounterVeil can render them.
 *
 * Prose enrichment logic ported from TieredEncounterModal lines 699-722.
 */

import type { EncounterTemplate } from '../../../../types/encounter';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import type { ActiveEncounterDisplay } from '../../encounterNotificationRuntime';
import type { WorldGraph } from '../../../../engine/graph';
import type { ThreadTier } from '../../TieredEncounterModal';
import type {
  EncounterStageModel,
  EncounterStageChoiceModel,
  EncounterStageHistoryModel,
  EncounterStageNarrativeParagraph,
} from '../types';
import { enrichProse, gatherNarrativeContext } from '../../../../engine/proseEnrichment';
import { resolveEncounterNarrative } from '../../../../data/encounter-content';

// ── Types ────────────────────────────────────────────────

export interface BuildSimpleEncounterStageModelArgs {
  notification: EncounterNotification;
  encounter: ActiveEncounterDisplay;
  template: EncounterTemplate;
  agentName: string;
  agentId: string;
  graph: WorldGraph;
  threadTier: ThreadTier;
  essence: number;
  tick: number;
}

// ── Prose depth ──────────────────────────────────────────

function proseDepthForTier(tier: ThreadTier): 'full' | 'medium' | 'peek' {
  switch (tier) {
    case 'strong': return 'full';
    case 'light': return 'medium';
    case 'watched': return 'peek';
  }
}

function buildProseParagraphs(
  enriched: string,
  depth: 'full' | 'medium' | 'peek',
): string[] {
  const parts = enriched.split(/\n\n+/).filter(Boolean);
  switch (depth) {
    case 'full': return parts.length > 0 ? parts : [enriched];
    case 'medium': return parts.length > 1 ? parts.slice(0, 2) : [enriched];
    case 'peek': return [parts[0]?.split('.').slice(0, 2).join('.') + '.' || enriched];
  }
}

// ── Main adapter ─────────────────────────────────────────

export function buildSimpleEncounterStageModel(
  args: BuildSimpleEncounterStageModelArgs,
): EncounterStageModel {
  const { notification, encounter, template, agentName, agentId, graph, threadTier, essence } = args;

  const currentIndex = Math.min(encounter.currentStepIndex, template.steps.length - 1);
  const currentStep = template.steps[currentIndex];
  const narrativeCtx = gatherNarrativeContext(graph, agentId);
  const depth = proseDepthForTier(threadTier);

  // ── Prose enrichment (ported from TieredEncounterModal) ──
  const rawNarrative = currentStep
    ? resolveEncounterNarrative(currentStep.narrative, agentName, currentStep.id, template.threatRating)
    : notification.prose;
  const enriched = enrichProse(rawNarrative, narrativeCtx);
  const proseTexts = buildProseParagraphs(enriched, depth);

  // ── Narrative paragraphs ──
  const paragraphs: EncounterStageNarrativeParagraph[] = proseTexts.map((text, i) => ({
    id: `p-${i}`,
    segments: [{ text, emphasis: 'default' as const }],
  }));

  // ── Choices ──
  const choices: EncounterStageChoiceModel[] = notification.choices.map(c => ({
    id: c.id,
    label: c.text,
    intent: c.text,
    essenceCost: c.essenceCost,
    affordable: c.essenceCost <= essence,
    costLabel: c.essenceCost > 0 ? `${c.essenceCost.toFixed(2)} essence` : undefined,
    interventionType: c.interventionType,
    godVoice: c.godVoice,
    probabilityBoost: c.probabilityBoost,
  }));

  // ── History ──
  const history: EncounterStageHistoryModel[] = template.steps.map((step, i) => ({
    stepId: step.id,
    stepLabel: step.name,
    status: i < currentIndex ? 'resolved' as const
      : i === currentIndex ? 'current' as const
      : 'future' as const,
  }));

  // ── Illustration ──
  const illustration = template.illustrationUrl
    ? {
        src: template.illustrationUrl,
        alt: template.illustrationAlt ?? `Scene from ${template.name}`,
      }
    : undefined;

  return {
    header: {
      title: template.name,
      locationLabel: '',
      threatLabel: template.threatRating,
      threadTier,
    },
    illustration,
    scene: {
      situationProse: enriched,
      pressureProse: currentStep?.narrative ?? '',
      noticeLines: [],
    },
    narrative: {
      paragraphs,
      references: [],
    },
    cast: [],
    factions: [],
    signals: [],
    choices,
    falloutPreview: [],
    history,
    resourceSummary: { quintessence: essence },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Game/encounter-stage/adapters/__tests__/buildSimpleEncounterStageModel.test.ts`
Expected: All pass.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/encounter-stage/adapters/buildSimpleEncounterStageModel.ts src/components/Game/encounter-stage/adapters/__tests__/buildSimpleEncounterStageModel.test.ts
git commit -m "feat: add buildSimpleEncounterStageModel adapter for legacy encounters"
```

---

### Task 6: Create EncounterVeil component — strongly threaded with art

**Files:**
- Create: `src/components/Game/EncounterVeil.tsx`
- Create: `src/components/Game/__tests__/EncounterVeil.test.tsx`

This is the core component. Start with strongly threaded tier only — full art, full prose, 3 choices. Other tiers and aftermath come in later tasks.

- [ ] **Step 1: Write the test file**

Create `src/components/Game/__tests__/EncounterVeil.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import type { EncounterStageModel } from '../encounter-stage/types';

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false,
    status: 'idle' as const,
    backendType: null,
    loadProgress: 0,
    error: null,
    isSpeaking: false,
    isLoading: false,
    isAvailable: false,
    init: vi.fn(),
    initWorker: vi.fn(),
    speak: vi.fn(),
    speakSections: vi.fn(),
    stop: vi.fn(),
    narrateChronicle: vi.fn(),
  }),
}));

const mockModel: EncounterStageModel = {
  header: {
    title: 'Gate Duty',
    subtitle: 'A test of authority',
    locationLabel: 'South Gate',
    threatLabel: 'moderate',
    threadTier: 'strong',
  },
  illustration: {
    src: '/concept-art/encounters/gate-duty.jpg',
    alt: 'A checkpoint at dusk',
    caption: 'The Checkpoint at Dusk',
  },
  scene: {
    situationProse: 'The torchlight gutters.',
    pressureProse: 'Time runs short.',
    noticeLines: [],
  },
  narrative: {
    paragraphs: [
      {
        id: 'p-0',
        segments: [{ text: 'The torchlight gutters as another caravan approaches.', emphasis: 'default' }],
      },
    ],
    references: [],
  },
  cast: [],
  factions: [],
  signals: [],
  choices: [
    {
      id: 'choice-support',
      label: 'Show mercy',
      intent: 'Let the grain through. The settlements are hungry.',
      essenceCost: 2,
      affordable: true,
      interventionType: 'supportive',
      godVoice: 'The hungry do not eat paperwork.',
      probabilityBoost: 0.2,
    },
    {
      id: 'choice-coerce',
      label: 'Seize it',
      intent: 'Hold the shipment. The truth matters more.',
      essenceCost: 4,
      affordable: true,
      interventionType: 'coercive',
      godVoice: 'Pull the thread.',
      probabilityBoost: 0.35,
    },
    {
      id: 'choice-withdraw',
      label: 'Step back',
      intent: 'Let Vasara decide alone.',
      essenceCost: 0,
      affordable: true,
      interventionType: 'withdrawn',
      probabilityBoost: 0,
    },
  ],
  falloutPreview: [],
  history: [
    { stepId: 'step-1', stepLabel: 'First Step', status: 'current' },
    { stepId: 'step-2', stepLabel: 'Second Step', status: 'future' },
  ],
  resourceSummary: { quintessence: 12 },
};

const defaultProps = {
  open: true,
  model: mockModel,
  threadTier: 'strong' as const,
  essence: 12,
  tick: 10,
  autoResolveTick: null as number | null,
  onIntervene: vi.fn(),
  onBoost: vi.fn(),
  onPeek: vi.fn(),
  onDisregard: vi.fn(),
  onAcknowledgeAftermath: vi.fn(),
  onAftermathReaction: vi.fn(),
};

describe('EncounterVeil', () => {
  it('renders when open is true', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<EncounterVeil {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays encounter title', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText('Gate Duty')).toBeInTheDocument();
  });

  it('displays narrative prose', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/torchlight gutters/)).toBeInTheDocument();
  });

  it('displays all choice intents', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/Let the grain through/)).toBeInTheDocument();
    expect(screen.getByText(/Hold the shipment/)).toBeInTheDocument();
    expect(screen.getByText(/Let Vasara decide/)).toBeInTheDocument();
  });

  it('calls onDisregard when Escape is pressed', () => {
    render(<EncounterVeil {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onDisregard).toHaveBeenCalled();
  });

  it('calls onIntervene with selected choice when Intervene is clicked', () => {
    const onIntervene = vi.fn();
    render(<EncounterVeil {...defaultProps} onIntervene={onIntervene} />);
    // Click a choice to select it
    fireEvent.click(screen.getByText(/Let the grain through/));
    // Click Intervene
    fireEvent.click(screen.getByText('Intervene'));
    expect(onIntervene).toHaveBeenCalledWith('choice-support', 2);
  });

  it('shows art title from illustration caption', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText('The Checkpoint at Dusk')).toBeInTheDocument();
  });

  it('renders without illustration when model has none', () => {
    const noArtModel = { ...mockModel, illustration: undefined };
    render(<EncounterVeil {...defaultProps} model={noArtModel} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gate Duty')).toBeInTheDocument();
  });

  it('displays thread tier label', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/Strongly Threaded/)).toBeInTheDocument();
  });

  it('displays step indicator', () => {
    render(<EncounterVeil {...defaultProps} />);
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement EncounterVeil component**

Create `src/components/Game/EncounterVeil.tsx`. This is the largest single file. Use the design spec (`Docs/plans/2026-04-07-encounter-veil-design.md`) and prototype (`Docs/prototypes/encounter-veil.html`) as the visual reference.

The component must:
- Use `createPortal` to render a full-screen `position: fixed; inset: 0` overlay on `document.body`
- Accept `EncounterStageModel` as its data contract
- Render dissolved art via `background-image` + CSS `mask-image: radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)`
- Render content in a right-aligned reading zone (52% width) with dark gradient overlay
- Render choices as prose blocks with type glow, god-voice reveal on select
- Include `role="dialog"` and `aria-modal="true"` for accessibility
- Listen for Escape key to call `onDisregard`
- Call `onIntervene(choiceId, essenceCost)` when a choice is selected and Intervene is clicked
- Include staggered entrance animations using CSS transitions with animation delays
- Render no-art fallback (centered 65% width content) when `model.illustration` is undefined

**Key CSS techniques to port from the prototype:**

```css
/* Art dissolution */
mask-image: radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%);

/* Reading zone gradient */
background: linear-gradient(to right, transparent 0%, rgba(10,10,15,0.55) 10%, rgba(10,10,15,0.82) 28%, rgba(10,10,15,0.93) 50%, rgba(10,10,15,0.97) 100%);

/* Choice type glow */
background: linear-gradient(to right, transparent, rgba(134,239,172,0.3), transparent); /* supportive */

/* Typography */
font-family: Georgia, 'Times New Roman', serif;
font-style: italic;
color: rgba(212, 196, 158, 0.75);
```

For phase 1, implement:
- Strongly threaded rendering (full art, full prose, 3 choices)
- No-art fallback
- Escape to close
- Choice selection → Intervene callback

Stub (return `null`) for:
- Lightly threaded timer
- Watched peek gate / boost slider
- Aftermath rendering

These stubs will be filled in Tasks 8, 9, and 10.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx`
Expected: All pass.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/EncounterVeil.tsx src/components/Game/__tests__/EncounterVeil.test.tsx
git commit -m "feat: add EncounterVeil component — strongly threaded with dissolved art"
```

---

### Task 7: Wire EncounterVeil into GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx`

Wire EncounterVeil alongside the existing modals. For phase 1, use the Veil when an EncounterStageModel is available, falling back to old modals otherwise. This is the safest integration point.

- [ ] **Step 1: Add imports**

At the top of `GameView.tsx`, add:

```typescript
import { EncounterVeil } from './EncounterVeil';
import { buildSimpleEncounterStageModel } from './encounter-stage/adapters/buildSimpleEncounterStageModel';
```

- [ ] **Step 2: Add unified encounterVeilModel memo**

Find the existing `encounterStageModel` memo in GameView.tsx. Below it (or replacing it), add a new memo that always produces an EncounterStageModel for any encounter:

```typescript
const encounterVeilModel = useMemo(() => {
  if (!tieredEncounterState) return null;
  // Existing adapter paths remain
  if (isGateDutyEncounterStage && encounterStageModel) return encounterStageModel;
  if (unifiedTemplateForStage && encounterStageModel) return encounterStageModel;
  // New: simple adapter for legacy encounters
  return buildSimpleEncounterStageModel({
    notification: tieredEncounterState.notification,
    encounter: tieredEncounterState.encounter,
    template: tieredEncounterState.template,
    agentName: tieredEncounterState.agentName,
    agentId: tieredEncounterState.agentId,
    graph: gameState.graph,
    threadTier: tieredEncounterState.threadTier,
    essence: SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0),
    tick: gameState.tick,
  });
}, [tieredEncounterState, isGateDutyEncounterStage, unifiedTemplateForStage, encounterStageModel, gameState.graph, gameState.essencePool, gameState.tick]);
```

- [ ] **Step 3: Replace the rendering block**

Find the existing conditional rendering at approximately lines 2809-2853. Replace both the EncounterStage and TieredEncounterModal blocks with:

```tsx
{tieredEncounterState && encounterVeilModel && (
  <EncounterVeil
    open={true}
    model={encounterVeilModel}
    threadTier={tieredEncounterState.threadTier}
    essence={SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0)}
    tick={gameState.tick}
    autoResolveTick={tieredEncounterState.notification.autoResolveTick}
    onIntervene={handleEncounterIntervene}
    onBoost={handleEncounterBoost}
    onPeek={handleEncounterPeek}
    onDisregard={handleEncounterDisregard}
    onAcknowledgeAftermath={handleEncounterAcknowledgeAftermath}
    onAftermathReaction={handleEncounterAftermathReaction}
  />
)}
```

Keep the old modals commented out (not deleted) for easy rollback:

```tsx
{/* Legacy encounter modals — replaced by EncounterVeil
{tieredEncounterState && shouldUseEncounterStage && encounterStageModel && (
  <EncounterStage ... />
)}
{tieredEncounterState && (!shouldUseEncounterStage || !encounterStageModel) && (
  <TieredEncounterModal ... />
)}
*/}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 5: Build check**

Run: `npx vite build`
Expected: Succeeds — confirms Vercel will deploy.

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 7: Smoke test in browser**

Run: `npm run dev` and open `http://localhost:5173/?view=game`. Trigger an encounter (either via gameplay or the debug panel CLI: `spawn encounter @hero explore`). Verify:
- Full-screen overlay appears with void background
- If encounter has art, art dissolves into the background
- Prose is readable in the right reading zone
- Choices render as prose blocks
- Clicking a choice + Intervene button works
- Escape closes the overlay
- Game resumes after closing

- [ ] **Step 8: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat: wire EncounterVeil into GameView for all encounters"
```

---

### Task 8: Add lightly threaded tier support

**Files:**
- Modify: `src/components/Game/EncounterVeil.tsx`
- Modify: `src/components/Game/__tests__/EncounterVeil.test.tsx`

- [ ] **Step 1: Write tests for lightly threaded behavior**

Add to `src/components/Game/__tests__/EncounterVeil.test.tsx`:

```typescript
describe('lightly threaded', () => {
  const lightProps = {
    ...defaultProps,
    threadTier: 'light' as const,
    autoResolveTick: 16,
    tick: 12,
  };

  it('displays auto-resolve timer', () => {
    render(<EncounterVeil {...lightProps} />);
    expect(screen.getByText(/auto-resolves in 4 tick/)).toBeInTheDocument();
  });

  it('shows Lightly Threaded label', () => {
    render(<EncounterVeil {...lightProps} />);
    expect(screen.getByText(/Lightly Threaded/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx -t "lightly threaded"`
Expected: FAIL

- [ ] **Step 3: Implement lightly threaded rendering**

In `EncounterVeil.tsx`, add:
- Auto-resolve timer bar: thin 2px bar at top of overlay with label showing ticks remaining (`autoResolveTick - tick`)
- Reduced art opacity (0.6 instead of 0.85)
- "Lightly Threaded · Notification" tier label
- "Close" instead of "Resume" on the disregard button

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/EncounterVeil.tsx src/components/Game/__tests__/EncounterVeil.test.tsx
git commit -m "feat: add lightly threaded tier to EncounterVeil with auto-resolve timer"
```

---

### Task 9: Add watched tier support (peek gate + boost)

**Files:**
- Modify: `src/components/Game/EncounterVeil.tsx`
- Modify: `src/components/Game/__tests__/EncounterVeil.test.tsx`

- [ ] **Step 1: Write tests for watched behavior**

Add to test file:

```typescript
describe('watched tier', () => {
  const watchedProps = {
    ...defaultProps,
    threadTier: 'watched' as const,
  };

  it('shows peek gate initially', () => {
    render(<EncounterVeil {...watchedProps} />);
    expect(screen.getByText(/Peer Through the Thread/)).toBeInTheDocument();
  });

  it('calls onPeek when peek button is clicked', () => {
    const onPeek = vi.fn();
    render(<EncounterVeil {...watchedProps} onPeek={onPeek} />);
    fireEvent.click(screen.getByText(/Peer Through the Thread/));
    expect(onPeek).toHaveBeenCalled();
  });

  it('shows Watched label', () => {
    render(<EncounterVeil {...watchedProps} />);
    expect(screen.getByText(/Watched/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx -t "watched tier"`
Expected: FAIL

- [ ] **Step 3: Implement watched tier**

In `EncounterVeil.tsx`, add:
- Peek gate: centered layout with icon, whisper prompt, and peek button
- When peek button clicked: call `onPeek()`, transition to revealed state (local `peeked` state)
- After peek: show short prose + boost slider (0-5 pips)
- Desaturated art (0.35 opacity, `filter: grayscale(40%)`)
- Boost slider calls `onBoost(amount)` via Commit button
- "Watched · Peek" tier label

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/EncounterVeil.tsx src/components/Game/__tests__/EncounterVeil.test.tsx
git commit -m "feat: add watched tier to EncounterVeil with peek gate and boost slider"
```

---

### Task 10: Add aftermath mode

**Files:**
- Modify: `src/components/Game/EncounterVeil.tsx`
- Modify: `src/components/Game/__tests__/EncounterVeil.test.tsx`

- [ ] **Step 1: Write tests for aftermath rendering**

Add to test file:

```typescript
describe('aftermath mode', () => {
  const aftermathModel: EncounterStageModel = {
    ...mockModel,
    aftermath: {
      title: 'Aftermath',
      overview: 'The grain passes through. Vasara watches the caravan disappear.',
      actorMoments: [
        {
          id: 'actor-1',
          actorName: 'Vasara',
          summaryLines: ['Gained a reputation for pragmatism.'],
        },
      ],
      changes: [
        {
          id: 'change-1',
          kind: 'reputation',
          title: "The Merchant's Debt",
          detail: 'The merchant remembers a kindness.',
          polarity: 'gain',
        },
      ],
    },
  };

  it('displays aftermath overview prose', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText(/grain passes through/)).toBeInTheDocument();
  });

  it('displays actor moments', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText('Vasara')).toBeInTheDocument();
    expect(screen.getByText(/reputation for pragmatism/)).toBeInTheDocument();
  });

  it('displays aftermath changes', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText("The Merchant's Debt")).toBeInTheDocument();
  });

  it('shows Return to the world button', () => {
    render(<EncounterVeil {...defaultProps} model={aftermathModel} />);
    expect(screen.getByText('Return to the world')).toBeInTheDocument();
  });

  it('calls onAcknowledgeAftermath when return button is clicked', () => {
    const onAcknowledge = vi.fn();
    render(<EncounterVeil {...defaultProps} model={aftermathModel} onAcknowledgeAftermath={onAcknowledge} />);
    fireEvent.click(screen.getByText('Return to the world'));
    expect(onAcknowledge).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx -t "aftermath"`
Expected: FAIL

- [ ] **Step 3: Implement aftermath rendering**

In `EncounterVeil.tsx`, when `model.aftermath` is present:
- Reduced art opacity (0.5) + `saturate(0.7)`
- Step dots all resolved
- Aftermath overview prose (same style as encounter prose)
- Actor moments: portrait circle (letter fallback) + name + summary lines
- Changes: title + detail + polarity-colored label
- Highlights: title + detail
- Aftermath reactions: clickable prose blocks calling `onAftermathReaction(reactionId)`
- Footer: "Return to the world" button calling `onAcknowledgeAftermath()`

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/Game/__tests__/EncounterVeil.test.tsx`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Game/EncounterVeil.tsx src/components/Game/__tests__/EncounterVeil.test.tsx
git commit -m "feat: add aftermath mode to EncounterVeil"
```

---

### Task 11: Add illustration URLs to existing templates

**Files:**
- Modify: `src/data/unified-action-templates.ts`

Four encounter images exist. Wire them to their templates.

- [ ] **Step 1: Find and update templates with matching encounter art**

Search `unified-action-templates.ts` for templates matching the four existing images:
- `gate-duty` → `/concept-art/encounters/gate-duty.jpg`
- `flawed-steel` → `/concept-art/encounters/flawed-steel.jpg`
- `soul-ferryman` → `/concept-art/encounters/soul-ferryman.jpg`
- `road-ambush` → `/concept-art/encounters/road-ambush.jpg`

For each template, add:
```typescript
illustrationUrl: '/concept-art/encounters/gate-duty.jpg',
illustrationAlt: 'A torchlit checkpoint beneath a stone gate at dusk',
```

Use appropriate alt text for each. Search the file for template IDs containing `gate_duty`, `flawed_steel`, `soul_ferryman`, `road_ambush` or similar names. If no exact match exists for an image, skip it — the images can be wired later when matching templates are identified.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add src/data/unified-action-templates.ts
git commit -m "content: add illustrationUrl to encounter templates with existing concept art"
```

---

### Task 12: Full verification pass

**Files:** None — verification only.

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Succeeds.

- [ ] **Step 4: Browser smoke test — encounter with art**

Open `http://localhost:5173/?view=game`. Use debug panel CLI:
```
spawn encounter @hero cg.quest.gate_duty
```
Verify: Full-screen veil with dissolved gate-duty art, prose, choices, Intervene works.

- [ ] **Step 5: Browser smoke test — encounter without art**

Trigger any encounter without an illustration URL. Verify: Centered prose on void, no broken layout.

- [ ] **Step 6: Browser smoke test — all three tiers**

Test at different court positions. Verify:
- Strongly threaded: full art, 3 choices, paused label
- Lightly threaded: timer bar, 2 choices
- Watched: peek gate → boost slider

- [ ] **Step 7: Commit any fixes, then push**

```bash
git push
```

---

### Task 13: Cleanup — remove old modals

**Files:**
- Modify: `src/components/Game/GameView.tsx`
- Delete: `src/components/Game/TieredEncounterModal.tsx`
- Delete: `src/components/Game/encounter-stage/EncounterStage.tsx`
- Delete: `src/components/Game/encounter-stage/__tests__/EncounterStage.test.tsx`

Only do this after the verification pass confirms the Veil handles all cases.

- [ ] **Step 1: Remove commented-out old modal JSX from GameView**

Delete the commented-out EncounterStage and TieredEncounterModal blocks from Task 7.

- [ ] **Step 2: Remove dead imports from GameView**

Remove imports for `TieredEncounterModal`, `EncounterStage`, and any now-unused variables like `shouldUseEncounterStage`.

- [ ] **Step 3: Delete old component files**

```bash
rm src/components/Game/TieredEncounterModal.tsx
rm src/components/Game/encounter-stage/EncounterStage.tsx
rm src/components/Game/encounter-stage/__tests__/EncounterStage.test.tsx
```

- [ ] **Step 4: Check for remaining imports of deleted files**

Search the codebase for any remaining imports of `TieredEncounterModal` or `EncounterStage`. Fix any that reference the deleted files. The `ThreadTier` type and `courtPositionToThreadTier` function were exported from `TieredEncounterModal.tsx` — these need to be moved to a shared location (e.g., `src/types/encounter.ts` or a new `src/types/encounterVisibility.ts` export) before deleting the file.

- [ ] **Step 5: Type-check + build + tests**

Run: `npx tsc --noEmit && npx vite build && npm test`
Expected: All clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "cleanup: remove TieredEncounterModal and EncounterStage, replaced by EncounterVeil"
```

- [ ] **Step 7: Push**

```bash
git push
```
