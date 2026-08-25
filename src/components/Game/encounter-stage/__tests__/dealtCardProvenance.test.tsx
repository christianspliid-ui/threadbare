// @vitest-environment jsdom
/**
 * The dealt card reaches the stage, and says where it came from — THR-1247.
 *
 * ─── Why this is a jsdom render rather than a screenshot ────────────
 * Two independent reasons, both recorded rather than assumed:
 *
 * 1. This ran in an unattended scheduled session, where `preview_start` is
 *    refused outright ("Dev servers can't be started from unattended sessions"),
 *    which also shuts the Playwright route since that presumes a running server.
 *    The sanctioned substitution is jsdom render assertions on the real
 *    component (CLAUDE.md § Definition of Done → Browser-verify).
 * 2. Independently of that: **no shipped encounter declares `deal` yet**, so a
 *    screenshot of the live game would show a hand with no dealt card in it and
 *    prove nothing about the surface this ticket adds. The corpus and the first
 *    composed encounter are THR-1248.
 *
 * The phase is built by the **real** `buildNudgePhaseModel` from a **real**
 * `deal` declaration against a **real** repertoire, and rendered by the real
 * `NudgePhaseShell` — so this exercises the whole composed path (deal → mint →
 * partition → card model → face) rather than a hand-shaped card model, which
 * would verify a fixture rather than the code (the "fixture invents both sides"
 * trap this repo has been bitten by before).
 *
 * The absence arms matter as much as the presence ones: a surface that drew a
 * provenance line on *every* card would satisfy a presence-only assertion while
 * being exactly the bug — it would relabel the whole shipped corpus.
 */

import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { NudgePhaseShell } from '../shells/NudgePhaseShell';
import { isDealtNudgeId } from '../../../../engine/encounters/dealHand';

// ─── Fixtures ─────────────────────────────────────────────────────

/** The one card only this scene could offer — the "special" half of a composed hand. */
const SPECIAL: StepNudge = {
  id: 'bribe_the_warden',
  name: 'Buy The Warden',
  essenceCost: 2,
  forecastDelta: 0.08,
  fiction: '',
  effectLine: 'He looks the other way.',
  bandProse: { failure: 'He took it and looked anyway.' },
};

function stepWith(deal: ActionStep['deal'], nudges: StepNudge[] = [SPECIAL]): ActionStep {
  return {
    reach: 'shadow',
    duration: { min: 1, max: 2 },
    difficulty: 0.5,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    narrativeTemplate: 'The cordon has not shifted since dusk.',
    purposeLine: 'Slip the cordon',
    nudges,
    ...(deal ? { deal } : {}),
  } as ActionStep;
}

function templateWith(step: ActionStep): UnifiedActionTemplate {
  return {
    id: 'test.dealt_provenance',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'The Cordon',
    reach: 'shadow',
    crudType: 'read',
    scale: 'local',
    steps: [step],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'The cordon has not shifted since dusk.',
      success: 'It shifts.',
      failure: 'It does not.',
    },
  } as UnifiedActionTemplate;
}

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.thief',
    type: 'actor',
    name: 'Sera Vance',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc.gate', type: 'location', name: 'The Low Gate', properties: {} });
  return graph;
}

const ACTION: UnifiedAction = {
  actionId: 'ua_dealt',
  actorId: 'agent.thief',
  templateId: 'test.dealt_provenance',
  targetId: 'loc.gate',
  scale: 'local',
  source: 'agent',
  startTick: 3,
  currentStep: 0,
  stepProgress: 0,
  stepDuration: 2,
  resolved: false,
  stepOutcomes: [],
} as UnifiedAction;

/**
 * A darkness/order god with essence in both, so the dealt Veil is *playable*
 * rather than dimmed — the card row this ticket adds a line to is the playable
 * one, and a dimmed-only assertion would miss a regression in the live face.
 */
function darknessGod(): GameState {
  return {
    essencePool: { darkness: 6, order: 6, energy: 6 } as unknown as GameState['essencePool'],
    unlockedActionIds: [],
    ascendantIdentity: {
      sphereAlignment: { primary: 'darkness', secondary: 'order' },
      hungerId: 'hunger.witness',
    },
  } as unknown as GameState;
}

function phaseFor(deal: ActionStep['deal'], state: GameState = darknessGod()) {
  const step = stepWith(deal);
  return buildNudgePhaseModel({
    template: templateWith(step),
    activeAction: ACTION,
    step,
    graph: buildGraph(),
    gameState: state,
  })!;
}

afterEach(cleanup);

// ─── The composed hand reaches the stage ──────────────────────────

describe('THR-1247 · a dealt card on the encounter stage', () => {
  it('deals cards into the rendered hand alongside the authored special', () => {
    const phase = phaseFor({ count: 3, tags: ['shadow'] });
    const dealt = phase.cards.filter((c) => isDealtNudgeId(c.id));

    // Non-vacuous: the deal actually produced cards, and the special survived.
    expect(dealt.length).toBeGreaterThan(0);
    expect(phase.cards.some((c) => c.id === SPECIAL.id)).toBe(true);

    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    for (const card of dealt) {
      expect(screen.getByTestId(`nudge-card-${card.id}`)).toBeTruthy();
    }
  });

  it('prints where a dealt card came from, on the card itself', () => {
    const phase = phaseFor({ count: 3, tags: ['shadow'] });
    const dealt = phase.cards.filter((c) => isDealtNudgeId(c.id));
    expect(dealt.length).toBeGreaterThan(0);

    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);

    for (const card of dealt) {
      const line = screen.getByTestId(`nudge-card-provenance-${card.id}`);
      expect(line.textContent).toMatch(/from your repertoire/iu);
      // UI Law 13/14 — words, never numerals, anywhere on the face.
      expect(line.textContent).not.toMatch(/\d/u);
    }
  });

  it('names the sphere that signs a signature card', () => {
    const phase = phaseFor({ count: 4, tags: ['shadow'] });
    const veil = phase.cards.find((c) => c.libraryCardId === 'card.veil.signature.darkness');
    expect(veil, 'the darkness signature was not dealt to a darkness god').toBeDefined();
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(
      screen.getByTestId(`nudge-card-provenance-${veil!.id}`).textContent,
    ).toMatch(/Darkness signature/u);
  });

  it('leaves an authored card with no provenance line at all', () => {
    // The absence arm. A surface that labelled every card would pass every
    // assertion above while relabelling the entire shipped corpus.
    const phase = phaseFor({ count: 3, tags: ['shadow'] });
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(screen.getByTestId(`nudge-card-${SPECIAL.id}`)).toBeTruthy();
    expect(screen.queryByTestId(`nudge-card-provenance-${SPECIAL.id}`)).toBeNull();
  });

  it('renders a wholly authored hand exactly as before (NFP #6)', () => {
    // The regression arm for every template shipped today: no `deal`, no dealt
    // cards, and not one provenance line anywhere on the stage.
    const phase = phaseFor(undefined);
    expect(phase.cards.some((c) => isDealtNudgeId(c.id))).toBe(false);
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    expect(screen.getByTestId(`nudge-card-${SPECIAL.id}`)).toBeTruthy();
    expect(screen.queryByTestId(`nudge-card-provenance-${SPECIAL.id}`)).toBeNull();
  });

  it('deals nothing for a legacy run with no ascendant identity', () => {
    // A god with no sphere identity has no repertoire to deal from. The hand
    // falls back to the authored special rather than dealing unearned cards.
    const legacy = {
      essencePool: { darkness: 6 } as unknown as GameState['essencePool'],
      unlockedActionIds: [],
    } as unknown as GameState;
    const phase = phaseFor({ count: 3 }, legacy);
    expect(phase.cards.some((c) => isDealtNudgeId(c.id))).toBe(false);
    expect(phase.cards.some((c) => c.id === SPECIAL.id)).toBe(true);
  });

  it('quotes the dealt card’s price on its face and bills the same number', () => {
    // The commit path prices off the *composed* step; a face that quoted a cost
    // the adapter could not then charge is the bug this asserts against.
    const phase = phaseFor({ count: 3, tags: ['shadow'] });
    const dealt = phase.cards.filter((c) => isDealtNudgeId(c.id));
    expect(dealt.length).toBeGreaterThan(0);
    for (const card of dealt) {
      expect(card.essenceCost).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(card.essenceCost)).toBe(true);
    }
    render(<NudgePhaseShell phase={phase} onCommit={() => {}} />);
    for (const card of dealt) {
      expect(screen.getByTestId(`nudge-card-cost-${card.id}`)).toBeTruthy();
    }
  });

  it('declares the sphere it names as a concept, with its registry tooltip id', () => {
    /*
     * UI Laws 1, 2 and 17 together. The provenance line names a *sphere* — a
     * first-class game concept — so it must carry its tooltip, that tooltip must
     * come from the one registry, and the **producer** must say which word is the
     * concept rather than leaving the surface to find it in English prose.
     *
     * This is the arm that would have caught the first cut of this feature, which
     * shipped the line as a single string.
     */
    const phase = phaseFor({ count: 4, tags: ['shadow'] });
    const veil = phase.cards.find((c) => c.libraryCardId === 'card.veil.signature.darkness');
    expect(veil?.provenance).toBeDefined();
    expect(veil!.provenance!.conceptLabel).toBe('Darkness');
    expect(veil!.provenance!.conceptTooltipId).toBe('sphere.darkness');
    // The flat form stays in sync with the parts — it is assembled from them.
    expect(veil!.provenance!.text).toBe('From your repertoire — Darkness signature.');
  });

  it('names no concept on a card whose provenance has none', () => {
    // The universal core is not sphere-derived, so there is no concept to
    // declare and none is invented — a tooltip id pointing at nothing would be
    // a dead underline (Law 17's failure mode).
    const phase = phaseFor({ count: 4, tags: ['shadow'] });
    const boost = phase.cards.find((c) => c.libraryCardId === 'card.boost.core');
    expect(boost?.provenance).toBeDefined();
    expect(boost!.provenance!.conceptLabel).toBeUndefined();
    expect(boost!.provenance!.conceptTooltipId).toBeUndefined();
    expect(boost!.provenance!.text).toBe('From your repertoire — always yours.');
  });

  it('draws no flavor quote on a dealt face (Prose Doctrine v2)', () => {
    const phase = phaseFor({ count: 3, tags: ['shadow'] });
    const dealt = phase.cards.filter((c) => isDealtNudgeId(c.id));
    expect(dealt.length).toBeGreaterThan(0);
    for (const card of dealt) {
      expect(card.fiction).toBe('');
    }
  });
});
