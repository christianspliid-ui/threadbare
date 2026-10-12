// @vitest-environment jsdom
/**
 * THR-1815 — say it before it happens.
 *
 * Four things the game already did were only visible after the player acted.
 * These guards drive the real surfaces and assert what the player reads before
 * committing:
 * - the meeting hand says what a miss does, above commit, and follows the lean;
 * - the sphere pour says what it changes;
 * - a premonition cost names the Reach's sphere;
 * - the picker names the person on focus, and labels every portrait.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { FormativeTestBeat, type ConvertedTest } from '../FormativeTestBeat';
import { SensingBeat, candidateLabel } from '../SensingBeat';
import { NudgePhaseShell } from '../../Game/encounter-stage/shells/NudgePhaseShell';
import { buildMeetingNudgePhaseModel } from '../buildMeetingNudgePhaseModel';
import { SpheresStep } from '../../Remembrance/SpheresStep';
import { PremonitionModal, premonitionReachNote } from '../../Game/PremonitionModal';
import { selectDilemmas } from '../../../engine/meetingEncounter';
import { poleWordsFor, selectMeetingMissLine } from '../../../engine/meetingFateLine';
import { ENRICHED_DILEMMA_LIBRARY } from '../../../data/meeting-dilemma-library';
import { REMEMBRANCE_SPHERE_COPY, SPHERE_POUR_REFILL_SENTENCE } from '../../../data/sphere-points-content';
import { UI_TOOLTIPS } from '../../../data/ui-content';
import { WorldGraph } from '../../../engine/graph';
import { SPHERE_NAMES } from '../../../types';
import type { FormativeTest, NarrativeCandidate } from '../../../types/meetingEncounter';
import type { PremonitionEvent } from '../../../types/premonition';
import type { EssencePool } from '../../../types/influence';

// ─── Meeting hand: the miss line ─────────────────────────────────

const CONVERTED = ENRICHED_DILEMMA_LIBRARY.filter((t) => t.test != null);

/** A test holding a card that leans to each pole, found by scan so content edits keep it. */
function pickFixture() {
  for (const template of CONVERTED) {
    const test = template.test as FormativeTest;
    const leanA = test.nudges.find((n) => n.poleLean === 'a' && n.essenceCost <= 50);
    const leanB = test.nudges.find((n) => n.poleLean === 'b' && n.essenceCost <= 50);
    if (leanA && leanB) return { template, test, leanA, leanB };
  }
  return undefined;
}
const FIXTURE = pickFixture();

const CANDIDATE = { tempId: 'cand.0', name: 'Wren Ashdown', sphere: 'life' } as unknown as NarrativeCandidate;
const POOL = { life: 500 };

function tests(): ConvertedTest[] {
  const { template, test } = FIXTURE!;
  const instance = selectDilemmas([template], 'iron', 'gold', 'life', 'any-archetype', 'village', 42)
    .find((i) => i.templateId === template.id)!;
  return [{ instance, test }];
}

function renderBeat() {
  render(
    <FormativeTestBeat
      candidate={CANDIDATE}
      tests={tests()}
      locationName="Hollowmere"
      essencePool={POOL}
      seed={7}
      onComplete={() => {}}
    />,
  );
  act(() => { vi.advanceTimersByTime(2000); });
}

describe('THR-1815 — the meeting hand says a miss can flip her', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fixture holds a card leaning each way', () => {
    expect(FIXTURE, 'a converted test with an a-leaning and a b-leaning card').toBeDefined();
  });

  it('with no lean, the line says fate picks — above the commit', () => {
    renderBeat();
    const line = screen.getByTestId('nudge-miss-line');
    expect(line.textContent).toBe('With no lean, fate picks which way Wren Ashdown goes.');
    const commit = screen.getByTestId('nudge-commit');
    expect(line.compareDocumentPosition(commit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a hand leaning to pole A names pole B, and the line follows the lean as cards change', () => {
    renderBeat();
    const words = poleWordsFor(FIXTURE!.test.valuePair);
    fireEvent.click(screen.getByTestId(`nudge-card-${FIXTURE!.leanA.id}`));
    expect(screen.getByTestId('nudge-miss-line').textContent)
      .toBe(`On a miss, Wren Ashdown may become ${words.b} instead.`);

    fireEvent.click(screen.getByTestId(`nudge-card-${FIXTURE!.leanA.id}`));
    fireEvent.click(screen.getByTestId(`nudge-card-${FIXTURE!.leanB.id}`));
    expect(screen.getByTestId('nudge-miss-line').textContent)
      .toBe(`On a miss, Wren Ashdown may become ${words.a} instead.`);
  });

  it('a shell with no missLine (every other host) renders none', () => {
    const phase = buildMeetingNudgePhaseModel({
      test: FIXTURE!.test, testId: 'x', stepIndex: 0, essencePool: POOL, agentName: 'Wren', locationName: 'Hollowmere',
    });
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(screen.queryByTestId('nudge-miss-line')).toBeNull();
  });

  it('fail-soft: an unresolvable opposite pole reads the generic line, never a raw slot', () => {
    const line = selectMeetingMissLine(undefined, 'a', 'Wren');
    expect(line).toBe('On a miss, fate may push Wren the other way.');
    expect(line).not.toMatch(/[{}]/);
  });
});

// ─── Spheres setup: the pour line ────────────────────────────────

describe('THR-1815 — the pour says what it changes', () => {
  it('renders the pour line under the prompt', () => {
    render(<SpheresStep preset={{ mind: 3, spirit: 2 }} visible onConfirm={vi.fn()} onChooseAgain={vi.fn()} />);
    const line = screen.getByTestId('sphere-pour-meaning');
    expect(line.textContent).toBe(
      'Every pool starts the same. What you pour decides which pools refill fastest, and your deepest sphere pays your upkeep.',
    );
    expect(line.textContent).toBe(REMEMBRANCE_SPHERE_COPY.pourMeaning);
  });

  it('the essence-row hover ends with the same sentence, word for word (PC-6)', () => {
    const desc = UI_TOOLTIPS['ui.essence.row'].desc;
    expect(desc.endsWith(`${SPHERE_POUR_REFILL_SENTENCE}.`)).toBe(true);
    expect(REMEMBRANCE_SPHERE_COPY.pourMeaning).toContain(SPHERE_POUR_REFILL_SENTENCE);
    expect(desc.length).toBeLessThanOrEqual(200);
  });
});

// ─── Premonition: the cost names the Reach's sphere ──────────────

const ESSENCE = Object.fromEntries(SPHERE_NAMES.map(s => [s, 10])) as EssencePool;

const WHISPER: PremonitionEvent = {
  id: 'prem-1',
  type: 'whisper',
  agentId: 'agent-kael',
  agentName: 'Kael Thornweaver',
  tick: 12,
  showAfterTick: 12,
  eligibleUntilTick: 24,
  vignetteProse: 'A road unwalked turns in the sleeping mind.',
  whisperOptions: [
    // The writer's own shape (phaseDivinePremonition.ts): a reach_bias row also carries
    // targetSphere = REACH_TO_SPHERE[reach]. A fixture without it hid a guard that
    // blanked the note on every live whisper (review gate, round 1).
    { category: 'reach_bias', targetReach: 'gold', targetSphere: 'life', essenceCost: 1, sphere: 'life', prose: 'Turn them toward the market', flavorText: 'Coin remembers.' },
    { category: 'sphere_bias', targetSphere: 'mind', essenceCost: 1, sphere: 'mind', prose: 'Turn them inward', flavorText: 'A thought.' },
  ],
};

describe('THR-1815 — the premonition cost names the Reach\'s sphere', () => {
  it('a Reach-row cost reads "1 Life essence · Gold draws on Life", the sphere word hoverable', () => {
    render(
      <PremonitionModal
        open
        premonition={WHISPER}
        essencePool={ESSENCE}
        graph={new WorldGraph()}
        onWhisperChoice={vi.fn()}
        onCompulsionChoice={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const costs = screen.getAllByTestId('premonition-option-cost');
    expect(costs[0].textContent).toBe('1 Life essence · Gold draws on Life');
    // A sphere row (no targetReach) keeps today's cost.
    expect(costs[1].textContent).toBe('1 Mind essence');
    const note = screen.getByTestId('premonition-reach-note');
    expect(note.querySelector('[data-tooltip-id="sphere.life"]')).not.toBeNull();
  });

  it('fail-soft: no note when the bill is not the Reach\'s sphere', () => {
    expect(premonitionReachNote('gold', 'mind')).toBeNull();
    expect(premonitionReachNote(undefined, 'life')).toBeNull();
    expect(premonitionReachNote('gold', 'life')).toEqual({ before: 'Gold draws on ', sphere: 'life', after: '' });
  });
});

// ─── Picker: name + epithet on focus ─────────────────────────────

const PICKS = [
  { tempId: 't0', name: 'Elara', epithet: "merchant's daughter, sharp-tongued, restless", vignetteText: 'She counts coins twice.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
  { tempId: 't1', name: 'Bram', epithet: 'ferryman, patient', vignetteText: 'He waits.', imageAssetPath: '', placeholderGradient: 'linear-gradient(#000,#111)' },
] as unknown as NarrativeCandidate[];

describe('THR-1815 — the picker names the person', () => {
  it('every candidate carries an aria-label; a name shows only on focus', () => {
    render(<SensingBeat candidates={PICKS} openingProse="You sense them." onSelect={vi.fn()} />);
    expect(screen.getByTestId('sensing-candidate-0').getAttribute('aria-label'))
      .toBe("Elara, merchant's daughter, sharp-tongued, restless");
    expect(screen.getByTestId('sensing-candidate-1').getAttribute('aria-label')).toBe('Bram, ferryman, patient');
    // Resting cluster: no names.
    expect(screen.queryByTestId('sensing-candidate-name-0')).toBeNull();

    fireEvent.click(screen.getByTestId('sensing-candidate-0'));
    expect(screen.getByTestId('sensing-candidate-name-0').textContent).toBe('Elara');
    expect(screen.getByTestId('sensing-candidate-epithet-0').textContent)
      .toBe("merchant's daughter, sharp-tongued, restless");
    expect(screen.queryByTestId('sensing-candidate-name-1')).toBeNull();
  });

  it('fail-soft label: whichever part exists; neither ⇒ none', () => {
    expect(candidateLabel('Elara', '')).toBe('Elara');
    expect(candidateLabel(undefined, 'ferryman')).toBe('ferryman');
    expect(candidateLabel('', ' ')).toBeUndefined();
  });
});
