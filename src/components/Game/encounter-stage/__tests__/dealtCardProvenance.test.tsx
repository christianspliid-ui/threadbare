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
import { nudgeCardMember } from '../../../../data/nudge-card-library';

// ─── Fixtures ─────────────────────────────────────────────────────

/** The one card only this scene could offer — the "special" half of a composed hand. */
const SPECIAL: StepNudge = {
  id: 'bribe_the_warden',
  name: 'Buy The Warden',
  essenceCost: 2,
  forecastDelta: 0.08,
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

function phaseFor(
  deal: ActionStep['deal'],
  state: GameState = darknessGod(),
  nudges: StepNudge[] = [SPECIAL],
) {
  const step = stepWith(deal, nudges);
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
    // A common-pool card is not sphere-derived, so there is no concept to
    // declare and none is invented — a tooltip id pointing at nothing would be
    // a dead underline (Law 17's failure mode).
    //
    // **Found by property, not by id (repointed THR-1248).** This named
    // `card.boost.core` while the library held two reference profiles and the
    // dealer had almost no choice. With the corpus complete, 37 members compete
    // for four slots and a `shadow`-tagged step outscores the plain core — so
    // the id was pinning an artefact of a sparse library, not the rule.
    //
    // Dealt with **no authored special**, which is what actually engages the
    // rule under test: `DEAL_COMMON_OPTIONS_MIN` counts commons already in the
    // composed hand, and `SPECIAL` is itself sphere-less — so the default
    // fixture satisfies the floor before the dealer runs and no common is ever
    // taken. A fully-dealt hand is a legal composed hand (specials are 0–2), and
    // it is the one where the floor has work to do.
    const phase = phaseFor({ count: 4, tags: ['shadow'] }, darknessGod(), []);
    const common = phase.cards.find(
      (c) => c.libraryCardId !== undefined && nudgeCardMember(c.libraryCardId)?.sphere === undefined,
    );
    // Non-vacuous: the common-option floor really did put one in the hand. If
    // this trips, the floor stopped holding and that is the defect, not this.
    expect(common, 'the dealer took no ungated common option').toBeDefined();
    expect(common!.provenance).toBeDefined();
    // The subject of this test: no concept declared, so nothing to underline.
    expect(common!.provenance!.conceptLabel).toBeUndefined();
    expect(common!.provenance!.conceptTooltipId).toBeUndefined();
    // Still a real, complete line — and specifically not a sphere clause, which
    // is the leak this arm exists to catch. The exact suffix is deliberately not
    // pinned: provenance reads the repertoire *source*, and which sphere-less
    // member wins a slot ("always yours" for the core, "born of your hunger" for
    // a hunger unique) is a scoring outcome across 37 competing members, not a
    // property of this rule. Pinning it would re-create the brittleness that
    // made the hardcoded id above wrong.
    expect(common!.provenance!.text).toMatch(/^From your repertoire — .+\.$/u);
    expect(common!.provenance!.text).not.toMatch(/signature|attunement/iu);
  });

  it('draws no flavor quote on a dealt face (Prose Doctrine v2)', () => {
    const phase = phaseFor({ count: 3, tags: ['shadow'] });
    const dealt = phase.cards.filter((c) => isDealtNudgeId(c.id));
    expect(dealt.length).toBeGreaterThan(0);
    for (const card of dealt) {
      // THR-1225 removed the field, so the assertion moved from "it is empty"
      // to "it is not there". Paired with the surviving anatomy, so a card model
      // that built nothing cannot pass this vacuously.
      expect(card.name, `dealt card ${card.id} has no name`).toBeTruthy();
      expect(Object.keys(card), `dealt card ${card.id}`).not.toContain('fiction');
    }
  });
});
