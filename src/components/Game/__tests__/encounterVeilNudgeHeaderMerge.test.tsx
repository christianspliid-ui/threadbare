// @vitest-environment jsdom
/**
 * THR-1478 — the nudge stage's reading merges into the veil's context strip.
 *
 * Director find, attended chat 2026-09-12, on The Swindled Family's scene
 * screen: *"we have redundancy in the interface. please merge these two into
 * one. i think the right placing is above the prose."* The context strip above
 * the prose and the test panel below it were drawing the same portrait and the
 * same reach.
 *
 * **Why this file is not covered by `NudgeStageIconography.test.tsx`.** That
 * file renders `NudgePhaseShell` standalone — the meeting-beats placement, where
 * the panel legitimately stays. It would go green through the entire period the
 * *veil* still drew two blocks, because it never mounts the veil. The merge is a
 * claim about composition, so the test has to mount the composed surface: the
 * shipped `encounter.slice.swindled_family` template, through the real
 * `buildUnifiedEncounterStageModel`, into the real `EncounterVeil` — the same
 * harness shape `encounterVeilAuthoredStance.test.tsx` established.
 *
 * The ordering and live-forecast arms are the two that could not be written as
 * presence checks: a surface that drew the marks in a *second* block below the
 * prose, or drew them from a second hand state that never moved, would satisfy
 * "the die is on screen" while looking exactly like the bug.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EncounterVeil } from '../EncounterVeil';
import { buildUnifiedEncounterStageModel } from '../encounter-stage/adapters/buildUnifiedEncounterStageModel';
import { forecastWithNudges } from '../encounter-stage/useNudgeHand';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { WorldGraph } from '../../../engine/graph';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';

/**
 * The hand is dimmed to unplayable without a pool. `buildNudgePhaseModel` reads
 * essence from `gameState.essencePool` — not from the veil's `essence` prop —
 * and a sphere holding nothing withholds its cards outright. Measured on this
 * fixture: with no pool, four of the five cards were withheld and the fifth came
 * back `essence_unavailable`, so nothing would toggle and the live-forecast arm
 * below would have proved nothing.
 */
const RICH_POOL = {
  essencePool: Object.fromEntries(
    ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy',
      'chaos', 'order', 'light', 'darkness'].map((s) => [s, 40]),
  ),
} as unknown as GameState;

vi.mock('../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false, status: 'idle' as const, backendType: null, loadProgress: 0,
    error: null, isSpeaking: false, isLoading: false, isAvailable: false,
    init: vi.fn(), initWorker: vi.fn(), speak: vi.fn(), speakSections: vi.fn(),
    stop: vi.fn(), narrateChronicle: vi.fn(),
  }),
}));

const AGENT_ID = 'agent.swindled_probe';
const AGENT_NAME = 'Kael Thornweaver';
const TARGET_ID = 'loc.market_row';

/** The director's own review target — the screen the two screenshots were of. */
const SLICE: UnifiedActionTemplate = (() => {
  const t = UNIFIED_ACTION_TEMPLATES.find((x) => x.id === 'encounter.slice.swindled_family');
  if (!t) throw new Error('encounter.slice.swindled_family is not in the shipped catalog');
  return t;
})();

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT_ID, type: 'actor', name: AGENT_NAME,
    properties: {
      actorType: 'individual',
      // A capability-less actor forecasts at the floor, where the whole hand
      // cannot lift the tier off `doomed` — the live-forecast arm's
      // anti-vacuity guard caught exactly that. Measured on this fixture
      // (base tier → tier with all five cards played): `{}` doomed → doomed,
      // `heart: 6` doomed → doomed (the capability sigmoid is still near its
      // floor), `heart: 12` perilous → favorable. Twelve is the value that
      // gives the hand somewhere to move the die to.
      domainCapabilities: { heart: 12 },
    },
  });
  graph.addNode({ id: TARGET_ID, type: 'location', name: 'Market Row', properties: {} });
  return graph;
}

function buildAction(): UnifiedAction {
  return {
    actionId: 'ua_veil_merge_0',
    actorId: AGENT_ID,
    templateId: SLICE.id,
    targetId: TARGET_ID,
    scale: SLICE.scale,
    source: 'agent',
    startTick: 1,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

function buildNotification(): EncounterNotification {
  return {
    id: 'notif_veil_merge',
    agentId: AGENT_ID,
    agentName: AGENT_NAME,
    courtPosition: 'the_first',
    encounterId: SLICE.id,
    encounterName: SLICE.name,
    prose: 'They are still standing where the coin changed hands.',
    choices: [],
    createdTick: 1,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
  };
}

function renderVeil() {
  const model = buildUnifiedEncounterStageModel({
    template: SLICE,
    activeAction: buildAction(),
    notification: buildNotification(),
    agentName: AGENT_NAME,
    threadTier: 'strong',
    graph: buildGraph(),
    essence: 12,
    gameState: RICH_POOL,
  });

  render(
    <EncounterVeil
      open
      model={model}
      threadTier="strong"
      essence={12}
      tick={10}
      autoResolveTick={null}
      onIntervene={vi.fn()}
      onBoost={vi.fn()}
      onPeek={vi.fn()}
      onDisregard={vi.fn()}
      onAcknowledgeAftermath={vi.fn()}
      onAftermathReaction={vi.fn()}
      onCommitNudges={vi.fn()}
    />,
  );

  return model;
}

describe('THR-1478 — one header block above the prose', () => {
  it('mounts the nudge stage at all (anti-vacuity for every arm below)', () => {
    const model = renderVeil();

    // Every absence assertion below is vacuous on a veil that never rendered a
    // nudge phase — it would pass by containing nothing.
    expect(model.nudgePhase, 'the slice built no nudge phase').toBeTruthy();
    expect(model.nudgePhase!.cards.length).toBeGreaterThan(0);
    expect(screen.getByTestId('nudge-phase-shell')).toBeInTheDocument();
    expect(screen.getByTestId('nudge-card-row')).toBeInTheDocument();
  });

  it('retires the second block: no test panel, one portrait, one reach', () => {
    const model = renderVeil();

    // The panel below the prose is gone from this placement entirely.
    expect(screen.queryByTestId('nudge-test-panel'), 'the test panel is still below the prose').toBeNull();
    expect(screen.queryByTestId('nudge-actor-portrait'), 'the second portrait survived').toBeNull();

    // The reach is drawn exactly once, as the icon — not once as an icon and
    // once as the context strip's text chip.
    const reaches = screen.getAllByTestId('nudge-reach-chip');
    expect(reaches, 'reach drawn more than once').toHaveLength(1);
    const reachLabel = model.header.reachLabel;
    expect(reachLabel, 'header carries no reach label to duplicate').toBeTruthy();
    // The text chip rendered the label as a text node; the icon carries it as an
    // accessible name. Counting text nodes is what separates the two.
    const textChips = screen
      .queryAllByText(reachLabel!, { exact: true })
      .filter((el) => el.tagName !== 'svg');
    expect(textChips, 'the text reach chip is still beside the icon').toHaveLength(0);
  });

  it('puts the marks above the prose, not in a second block below it', () => {
    renderVeil();

    const header = screen.getByTestId('encounter-context-block');
    const die = screen.getByTestId('nudge-forecast-die');
    const unit = screen.getByTestId('nudge-test-unit');

    // Containment: the marks are *inside* the one header block, so they cannot
    // be a second strip that happens to sit above the prose.
    expect(header.contains(die), 'the forecast die is outside the header block').toBe(true);
    expect(header.contains(unit), 'the difficulty is outside the header block').toBe(true);

    // Ordering: the header precedes the hand. `DOCUMENT_POSITION_FOLLOWING`
    // means the hand comes after the header in document order — the placement
    // the director asked for, asserted as order rather than as presence.
    const hand = screen.getByTestId('nudge-phase-shell');
    expect(
      header.compareDocumentPosition(hand) & Node.DOCUMENT_POSITION_FOLLOWING,
      'the hand does not follow the header',
    ).toBeTruthy();
  });

  it('spends no word on the objective, the forecast label, or the tier', () => {
    const model = renderVeil();
    const dialog = screen.getByRole('dialog').textContent ?? '';

    // *"remove the objective (hear them out). it is noise."*
    const objective = model.nudgePhase!.testPanel.purposeLine;
    expect(objective, 'the slice authors no objective to remove').toBeTruthy();
    expect(dialog, 'the objective is still on the surface').not.toContain(objective);

    // *"remove the word forecast."*
    expect(dialog, 'the Forecast label survived').not.toMatch(/\bForecast\b/);

    // The difficulty band word is gone from the surface but still reachable as
    // the mark's accessible name — a move, not a deletion (Law 11).
    const band = model.nudgePhase!.testPanel.difficultyWord;
    expect(dialog, 'the difficulty word survived on the surface').not.toContain(band);
    expect(screen.getByTestId('nudge-test-unit').getAttribute('aria-label')).toContain(band);
  });

  it('reads the same hand the cards toggle — one selection, two subtrees', () => {
    const model = renderVeil();
    const phase = model.nudgePhase!;

    const baseTier = screen.getByTestId('nudge-forecast-die').getAttribute('data-forecast-tier');
    expect(baseTier).toBe(phase.baseForecast.tier);

    // Play the whole hand. Blocked cards refuse the toggle, so the selection is
    // read back off the DOM rather than assumed — the expected forecast is then
    // computed from what actually got selected.
    for (const card of phase.cards) {
      fireEvent.click(screen.getByTestId(`nudge-card-${card.id}`));
    }
    const selected = phase.cards
      .filter((c) => screen.getByTestId(`nudge-card-${c.id}`).getAttribute('data-nudge-state') === 'selected')
      .map((c) => c.id);
    expect(selected.length, 'no card would toggle — the arm proves nothing').toBeGreaterThan(0);

    const expected = forecastWithNudges(phase, selected);
    // Anti-vacuity: if the played hand cannot move the tier off its base, a die
    // wired to a *stale* second hand would pass this arm unchanged.
    expect(expected.tier, 'the hand cannot move the tier — arm is vacuous').not.toBe(
      phase.baseForecast.tier,
    );

    const die = screen.getByTestId('nudge-forecast-die');
    expect(die.getAttribute('data-forecast-tier')).toBe(expected.tier);
    expect(die.getAttribute('aria-label')).toContain(expected.word);
    // And the "was …" read appears, because the tier moved.
    expect(screen.getByTestId('nudge-forecast-moved').textContent).toContain(
      phase.baseForecast.word,
    );
  });

  it('names the three marks at first contact (Law 12)', () => {
    localStorage.removeItem('threadbare.ui.nudgeReadingLegendSeen');
    renderVeil();

    const legend = screen.getByTestId('nudge-reading-legend');
    expect(screen.getByTestId('encounter-context-block').contains(legend)).toBe(true);

    // Law 51 — dismissing it is remembered, not re-taught on the next encounter.
    fireEvent.click(screen.getByTestId('nudge-reading-legend-dismiss'));
    expect(screen.queryByTestId('nudge-reading-legend')).toBeNull();
    expect(localStorage.getItem('threadbare.ui.nudgeReadingLegendSeen')).toBe('true');
  });
});
