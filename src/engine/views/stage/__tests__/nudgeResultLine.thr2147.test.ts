/**
 * THR-2147 (plan THR-2146 E1 + E2) — every card says what it buys.
 *
 * - The Balm on an unhurt mortal is withheld with `no_target`, never sold.
 * - The Balm on a Wounded mortal is playable and says "Ends <Name>'s Wounded."
 *   where the pips would be.
 * - A card that moves the odds carries no result line (its pips answer).
 * - Every library card that does not move the odds and carries a grant has a
 *   result line kind (Law 9 — a new kind cannot ship without its line).
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../graph';
import type { SphereName } from '../../../../types/index';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel, nudgeResultLine } from '../buildNudgePhaseModel';
import { PLAY_PROFILES } from '../../../../data/nudge-card-library';
import { isResultLineGrantKind } from '../../../../data/nudge-card-display';
import { EFFECTS_LINE_MAX_CHARS } from '../../../../data/actionEffectsProse';

const ACTOR = 'agent.elara';

const BALM: StepNudge = {
  id: 'balm',
  name: 'Balm',
  libraryCardId: 'card.balm.signature.life',
  essenceCost: 1,
  forecastDelta: 0,
  effectLine: 'A hurt they were carrying stops being carried.',
  grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$actor' }],
};

const BOOST: StepNudge = {
  id: 'boost',
  name: 'Boost',
  libraryCardId: 'card.boost.core',
  sphere: 'force' as SphereName,
  essenceCost: 1,
  forecastDelta: 0.1,
  effectLine: 'Leans the odds their way.',
};

const STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate: 'The ford is high.',
  nudges: [BALM, BOOST],
};

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.result_line',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Swollen Ford',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [STEP],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: { initiation: 'The ford is high.', success: 'Across.', failure: 'Back.' },
};

function buildGraph(wounded: boolean): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ACTOR, type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.ford', type: 'location', name: 'The Ford', properties: {} });
  graph.addNode({ id: 'trait.condition.wounded', type: 'trait', name: 'Wounded', properties: {} });
  if (wounded) {
    graph.addEdge({ id: 'elara_wounded', source: ACTOR, target: 'trait.condition.wounded', type: 'has_trait', properties: {} });
  }
  return graph;
}

const ACTION: UnifiedAction = {
  actionId: 'ua_result_1',
  actorId: ACTOR,
  templateId: TEMPLATE.id,
  targetId: 'loc.ford',
  scale: 'local',
  source: 'agent',
  startTick: 3,
  currentStep: 0,
  stepProgress: 0,
  stepDuration: 2,
  resolved: false,
  stepOutcomes: [],
};

function phaseFor(wounded: boolean) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: ACTION,
    step: STEP,
    graph: buildGraph(wounded),
    gameState: {
      essencePool: { force: 5 } as unknown as GameState['essencePool'],
      unlockedActionIds: [],
    } as Partial<GameState> as GameState,
  })!;
}

describe('THR-2147 — every card says what it buys', () => {
  it('withholds the Balm on an unhurt mortal with no_target, and lists it for the designer', () => {
    const phase = phaseFor(false);
    expect(phase.cards.map((c) => c.id)).not.toContain('balm');
    expect(phase.withheld.find((w) => w.id === 'balm')?.blockedCode).toBe('no_target');
  });

  it('deals the Balm on a Wounded mortal, and it says exactly what it ends', () => {
    const phase = phaseFor(true);
    const balm = phase.cards.find((c) => c.id === 'balm');
    expect(balm?.state).toBe('playable');
    expect(balm?.resultLine).toBe('Ends Elara’s Wounded.');
  });

  it('gives a card that moves the odds no result line — its pips answer', () => {
    const phase = phaseFor(true);
    expect(phase.cards.find((c) => c.id === 'boost')?.resultLine).toBeUndefined();
  });

  it('falls back to the kind sentence when the noun cannot be read', () => {
    const graph = new WorldGraph();
    const line = nudgeResultLine(BALM, graph, 'Elara');
    expect(line).toBe('Ends one of Elara’s conditions.');
  });

  it('every library card that does not move the odds has a result line, within the line cap', () => {
    const graph = buildGraph(true);
    for (const [id, profile] of Object.entries(PLAY_PROFILES)) {
      // A rider card (Mercy, Insurance) buys its rider, which its effect line
      // states; a recent_event grant there is a witness line, not the purchase.
      if (profile.forecastDelta !== 0 || !profile.grants?.length || profile.rider) continue;
      expect(profile.grants.some((g) => isResultLineGrantKind(g.kind)), `${id} has no result-line grant`).toBe(true);
      const line = nudgeResultLine({ id, grants: profile.grants, forecastDelta: 0 }, graph, 'Elara');
      expect(line, id).toBeTruthy();
      expect(line!.length, id).toBeLessThanOrEqual(EFFECTS_LINE_MAX_CHARS);
      expect(line, id).not.toMatch(/\d/); // Law 13
    }
  });
});
