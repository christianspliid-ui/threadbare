// @vitest-environment jsdom
//
// THR-1424 — Law 15 ruling of 2026-09-10 on player-facing unitless proportions.
//
//   "The sanctioned reading for a player-facing unitless proportion is the surface's existing
//    non-numeric rendering, and where none exists the number is dropped rather than translated."
//
// This file is also the ticket's **Browser-verify substitution** (`jsdom-render`): the run that
// shipped it was a scheduled, unattended one, where `preview_start` is refused outright and the
// Playwright route is shut with it (verification-gates.md, impediments #546/#574). The sanctioned
// substitute is jsdom render assertions on the real components covering every face the change
// produces, plus absence where an element should no longer render — which is what the arms below
// enumerate, surface by surface.
//
// Every arm pairs its `not.toMatch(/%/)` with a POSITIVE assertion on the surviving reading. That
// pairing is the point: a negative arm alone passes just as happily on a surface that rendered
// nothing at all, so each one has to prove the bar, ring, pip row or name it points the player at
// is still there.
//
// Concretely, that pairing already earned its keep here. `MandateDetail`, `DoomClockDetail` and
// `JourneyVignetteModal` all render through `Modal`, which `createPortal`s to the end of `<body>`
// — so RTL's `container` is EMPTY for them, and a `container.textContent` arm is vacuously true
// no matter what the component does. The first draft of this file asserted exactly that and went
// green on three modals it had not looked at; the paired positive arm is what failed and exposed
// it. Modal surfaces below therefore assert on `baseElement` (document.body), never `container`.
//
// Note on scope: `formatDelta` (`+12%` on a sphere row) is deliberately untouched. A delta is a
// realised change, whose sanctioned language is the delta cluster of Law 15 — a different reading
// with its own ladder, and not what this ruling settles.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoomBar } from '../DoomBar';
import { MandateTracker } from '../MandateTracker';
import { MandateDetail } from '../MandateDetail';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import type { DoomClockDefinition, DoomClockState } from '../../../types/doomClock';
import type { MandateDefinition, MandateState } from '../../../types/mandate';
import type { JourneyVignetteData } from '../../../types/journeyEngine';

// ─── Fixtures ───────────────────────────────────────────────────────

const doomDefinition: DoomClockDefinition = {
  archetype: 'breach',
  totalTicks: 100,
  stages: [
    { stage: 1, name: 'Whispers', tickThreshold: 0.0, events: [] },
    { stage: 2, name: 'Signs', tickThreshold: 0.2, events: [] },
    { stage: 3, name: 'Tremors', tickThreshold: 0.4, events: [] },
    { stage: 4, name: 'Crisis', tickThreshold: 0.6, events: [] },
    { stage: 5, name: 'Culmination', tickThreshold: 0.8, events: [] },
  ],
};

const doomState: DoomClockState = {
  definitionArchetype: 'breach',
  currentTick: 25,
  totalTicks: 100,
  currentStage: 2,
  progress: 0.25,
  stageTransitions: [0, 20, 40, 60, 80],
  expired: false,
  tickModifier: 1.0,
  nextEscalationSeverityModifier: 0,
  counterOmens: 0,
  resolvedEvents: [],
};

const mandateDefinition: MandateDefinition = {
  id: 'mandate.1',
  type: 'graph_state',
  name: 'Node Dominance',
  description: 'Establish control over the world-graph',
  checkpoints: [
    {
      index: 0,
      doomProgressThreshold: 0.4,
      label: 'First Omen',
      description: 'Hold the opening omen.',
      requiredPrimaryDelta: 0.07,
      requiredSecondaryDelta: 0.04,
    },
  ],
  stages: [
    { stage: 'setup', description: 'Create foundational nodes', conditions: [{ type: 'custom', description: 'Nodes rise.', params: {} }] },
    { stage: 'escalation', description: 'Connect and strengthen', conditions: [{ type: 'custom', description: 'Edges rise.', params: {} }] },
    { stage: 'culmination', description: 'Achieve supremacy', conditions: [{ type: 'custom', description: 'Hold it.', params: {} }] },
  ],
};

const mandateState: MandateState = {
  mandateId: 'mandate.1',
  currentStage: 'setup',
  progress: 0.5,
  completed: false,
  failed: false,
};

const vignette: JourneyVignetteData = {
  agentId: 'agent.first',
  agentName: 'Kael Thornweaver',
  // A real `CampbellianPhase` — the union is call | road_of_trials | crisis | ordeal | return,
  // and `formatPhaseName` renders this one as `Call`.
  phase: 'call',
  doomClockPercent: 0.25,
  beatIndex: 0,
  templateId: 'journey.call.1',
  variantKey: 'default',
  setupProse: 'The road narrows where the elders would not walk.',
  tensionProse: 'He waits for a sign that is yours to give or withhold.',
  choices: [
    { id: 'choice.1', text: 'Send the sign.', effects: { interventionType: 'supportive' } },
  ],
  stateSnapshot: {} as JourneyVignetteData['stateSnapshot'],
  isOrdeal: false,
  tick: 25,
};

// ─── DoomBar — persistent chrome ────────────────────────────────────

describe('DoomBar — doom progress reads as the bar (THR-1424)', () => {
  it('renders no percentage, and keeps the stage name and progress bar', () => {
    const { container } = render(<DoomBar definition={doomDefinition} state={doomState} />);
    expect(container.textContent).not.toMatch(/%/);
    expect(screen.getByText('Signs')).toBeInTheDocument();
    expect(container.querySelector('div[style*="width: 25%"]')).toBeTruthy();
  });

  it('keeps UNMADE, which names a terminal state rather than a proportion', () => {
    const { container } = render(
      <DoomBar definition={doomDefinition} state={{ ...doomState, expired: true }} />
    );
    expect(screen.getByText('UNMADE')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
  });
});

// ─── MandateTracker — all three status faces ────────────────────────

describe('MandateTracker — mandate progress reads as pips and bar (THR-1424)', () => {
  it('in progress: no numeral, and the pips still render', () => {
    const { container } = render(
      <MandateTracker definition={mandateDefinition} state={mandateState} />
    );
    expect(container.textContent).not.toMatch(/%/);
    expect(screen.getAllByTestId('stage-pip').length).toBe(3);
  });

  it('fulfilled: the state word survives, because it is a state and not a magnitude', () => {
    const { container } = render(
      <MandateTracker
        definition={mandateDefinition}
        state={{ ...mandateState, completed: true, progress: 1 }}
      />
    );
    expect(screen.getByText('FULFILLED')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
  });

  it('untouched: NEW still reads off zero progress', () => {
    const { container } = render(
      <MandateTracker definition={mandateDefinition} state={{ ...mandateState, progress: 0 }} />
    );
    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/%/);
  });
});

// ─── MandateDetail — the modal the tracker opens ────────────────────

describe('MandateDetail — the Progress row is gone, the bar remains (THR-1424)', () => {
  it('renders no percentage and drops the Progress row entirely', () => {
    const { baseElement } = render(
      <MandateDetail open onClose={() => {}} definition={mandateDefinition} state={mandateState} />
    );
    expect(baseElement.textContent).not.toMatch(/%/);
    // Absence where the element should no longer render — the row label goes with the numeral,
    // because a "Progress" row whose value was only ever the numeral has nothing left to say.
    expect(screen.queryByText('Progress')).toBeNull();
  });

  it('keeps the progress bar, which is what the dropped row duplicated', () => {
    const { baseElement } = render(
      <MandateDetail open onClose={() => {}} definition={mandateDefinition} state={mandateState} />
    );
    // Falsification for the arm above: the bar's fill is CSS geometry, not a player-facing
    // numeral, and it is the reading the dropped row duplicated. `progress: 0.5` → `width: 50%`.
    expect(baseElement.querySelector('div[style*="width: 50%"]')).toBeTruthy();
  });

  it('reads the next omen as a name, with no threshold percentage after it', () => {
    // The Omen Track and the Next Omen row are gated behind `runtimeKind: 'sphere_growth'`, so a
    // `graph_state` fixture renders neither and every arm about them would pass on an absent
    // section. This fixture opts into the branch the assertions are actually about.
    render(
      <MandateDetail
        open
        onClose={() => {}}
        definition={{ ...mandateDefinition, runtimeKind: 'sphere_growth', primarySphere: 'mind', secondarySphere: 'spirit' }}
        state={mandateState}
      />
    );
    // Previously `First Omen (40%)`; now the name alone.
    expect(screen.getAllByText(/First Omen/).length).toBeGreaterThan(0);
  });

  it('still names what a checkpoint needs — the delta half is a different reading', () => {
    const { baseElement } = render(
      <MandateDetail
        open
        onClose={() => {}}
        definition={{ ...mandateDefinition, runtimeKind: 'sphere_growth', primarySphere: 'mind', secondarySphere: 'spirit' }}
        state={mandateState}
      />
    );
    // `Needs …` survives on purpose. Its magnitude is a realised-change delta, whose language is
    // the Law 15 delta cluster, so this ruling deliberately leaves it for that separate pass —
    // which is why THIS branch is the one place a `%` may still legitimately appear.
    expect(screen.getAllByText(/Needs/).length).toBeGreaterThan(0);
    // ...and the doom-threshold half of that same line is gone.
    expect(baseElement.textContent).not.toMatch(/%\s*doom/);
  });
});

// ─── JourneyVignetteModal — no non-numeric rendering, so it drops ───

describe('JourneyVignetteModal — the doom percentage drops outright (THR-1424)', () => {
  it('renders the phase badge without a doom percentage beside it', () => {
    const { baseElement } = render(
      <JourneyVignetteModal open onClose={() => {}} onChoice={() => {}} vignette={vignette} />
    );
    expect(baseElement.textContent).not.toMatch(/%/);
    expect(baseElement.textContent).not.toMatch(/doom/i);
    // The badge is what the surface actually has to say here. This is the "where none exists"
    // limb of the ruling: the badge names the journey PHASE, not the doom, so there was no
    // non-numeric rendering of the doom on this surface to fall back to — and inventing a word
    // ladder for it is precisely what the Law 13 amendment of 2026-08-12 forbids.
    expect(screen.getAllByText(/Call/).length).toBeGreaterThan(0);
    // Falsification: the modal really rendered, so the two negative arms are not vacuous.
    expect(screen.getByText(/The road narrows/)).toBeInTheDocument();
  });
});

// ─── DoomClockDetail — covered in DoomClockDetailNoPercentage.test.tsx ───
//
// The second named site keeps its own file, because its four faces (ring centre, next-beat
// label, stage-threshold column, expired state) are the ticket's headline example and read
// better as one focused suite than as a fifth block here.
