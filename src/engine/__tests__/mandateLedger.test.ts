/**
 * THR-2081 — only the god's own hand fills the Mandate.
 *
 * `phaseSpherePressure` credits the Mandate's god ledger from each entity's resolved
 * score change: the god's magnitude share of a level-up, and the opposition's share of
 * an erosion, capped at what the god holds there.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseSpherePressure } from '../phaseSpherePressure';
import {
  applyMandateCredits, heldKey, isGodCausedPush, isMandateOpposition, mandateCreditsFor, MANDATE_DOOM_STAGE_PUSH_EXEMPT,
} from '../mandateLedger';
import { createDefaultSphereAffinity, DOOM_PRESSURE_PER_TIER, DOOM_STAGE_PUSH_SOURCE_PREFIX } from '../../types/sphereAffinity';
import type { MandateCredit, SpherePressureEvent } from '../../types/sphereAffinity';
import type { SpherePressureTrace } from '../phaseSpherePressure';
import type { GameState } from '../../types/gameState';

const ASC = 'asc';

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'mortal', type: 'actor', name: 'Mortal', properties: { actorType: 'individual', sphereAffinity: createDefaultSphereAffinity() } });
  graph.addNode({ id: 'threaded', type: 'actor', name: 'Threaded', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'rival', type: 'actor', name: 'Rival', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Town', properties: { sphereAffinity: createDefaultSphereAffinity() } });
  graph.addEdge({ id: 'e-thread', source: ASC, target: 'threaded', type: 'thread', properties: {} } as never);
  return graph;
}

function push(over: Partial<SpherePressureEvent>): SpherePressureEvent {
  return { targetEntityId: 'town', sphere: 'mind', magnitude: 3, source: 'divine_action', sourceId: 'act', ...over };
}

function stateWith(graph: WorldGraph, pressures: SpherePressureEvent[]): GameState {
  return {
    graph,
    ascendantId: ASC,
    tick: 10,
    pendingSpherePressures: pressures,
    mandateDefinition: { runtimeKind: 'sphere_growth', primarySphere: 'mind', secondarySphere: 'spirit' },
    mandateState: { completed: false },
    controlEffects: [],
  } as unknown as GameState;
}

function creditsFrom(graph: WorldGraph, pressures: SpherePressureEvent[]): MandateCredit[] {
  return phaseSpherePressure(stateWith(graph, pressures)).pendingMandateCredits ?? [];
}

describe('THR-2081 — isGodCausedPush', () => {
  const graph = makeGraph();
  it('counts the god-only writers whoever is named', () => {
    for (const source of ['claim', 'seat', 'carry', 'attunement', 'prayer_answered', 'unbidden_aid'] as const) {
      expect(isGodCausedPush(push({ source }), graph, ASC)).toBe(true);
    }
  });
  it('counts a push the god caused, and a threaded mortal\'s encounter step', () => {
    expect(isGodCausedPush(push({ causedBy: ASC }), graph, ASC)).toBe(true);
    expect(isGodCausedPush(push({ source: 'encounter', causedBy: 'threaded' }), graph, ASC)).toBe(true);
  });
  it('counts a threaded mortal\'s live scene, which resolves as a unified action', () => {
    expect(isGodCausedPush(push({ causedBy: 'threaded' }), graph, ASC)).toBe(true);
    expect(isGodCausedPush(push({ source: 'control_effect', causedBy: 'threaded' }), graph, ASC)).toBe(false);
  });
  it('never counts an unattributed push, a mortal\'s own act, or a threaded mortal\'s non-encounter act', () => {
    expect(isGodCausedPush(push({}), graph, ASC)).toBe(false);
    expect(isGodCausedPush(push({ causedBy: 'mortal' }), graph, ASC)).toBe(false);
    expect(isGodCausedPush(push({ source: 'encounter', causedBy: 'mortal' }), graph, ASC)).toBe(false);
    expect(isGodCausedPush(push({ source: 'control_effect', causedBy: 'rival' }), graph, ASC)).toBe(false);
    expect(isGodCausedPush(push({ source: 'overchannel', causedBy: 'mortal' }), graph, ASC)).toBe(false);
  });
});

describe('THR-2081 — phaseSpherePressure credits the god ledger', () => {
  it('a mortal\'s resolved action with a sphere credits nothing', () => {
    expect(creditsFrom(makeGraph(), [push({ causedBy: 'mortal' })])).toEqual([]);
  });

  it('a rival-owned control effect credits nothing', () => {
    expect(creditsFrom(makeGraph(), [push({ source: 'control_effect', causedBy: 'rival' })])).toEqual([]);
  });

  it('a mortal\'s overchannel credits nothing', () => {
    expect(creditsFrom(makeGraph(), [push({ targetEntityId: 'mortal', source: 'overchannel', causedBy: 'mortal' })])).toEqual([]);
  });

  it('the god\'s cast credits its magnitude share times the entity weight', () => {
    // One level of Mind on a place (weight 1.0); the god pushed 3 of 4.
    const credits = creditsFrom(makeGraph(), [push({ causedBy: ASC }), push({ magnitude: 1, causedBy: 'mortal' })]);
    expect(credits).toHaveLength(1);
    expect(credits[0]).toMatchObject({ entityId: 'town', sphere: 'mind', cause: 'god' });
    expect(credits[0].points).toBeCloseTo(0.75, 6);
  });

  it('weighs a mortal the god raised at the world total\'s 0.2', () => {
    const credits = creditsFrom(makeGraph(), [push({ targetEntityId: 'mortal', causedBy: ASC })]);
    expect(credits[0].points).toBeCloseTo(0.2, 6);
  });

  it('a threaded mortal\'s encounter step credits', () => {
    const credits = creditsFrom(makeGraph(), [push({ source: 'encounter', causedBy: 'threaded', magnitude: 1 })]);
    expect(credits[0]).toMatchObject({ sphere: 'mind', cause: 'god', points: 1 });
  });

  it('credits only the Mandate\'s two spheres', () => {
    expect(creditsFrom(makeGraph(), [push({ sphere: 'life', causedBy: ASC })])).toEqual([]);
  });
});

describe('THR-2081 — opposition takes back only what the god built', () => {
  function erosionTrace(previousScore: number, newScore: number): SpherePressureTrace {
    return {
      category: 'sphere_pressure', tick: 1, entityId: 'town', sphere: 'mind', outcome: 'eroded',
      incomingPressure: 4, threshold: 1, previousScore, newScore, progressFilled: 0, progressRequired: 1,
      source: 'rival', sources: ['rival'], sourceIds: ['r'],
    };
  }
  // Mind's opposite (force) carries the raid.
  const raid = (magnitude: number): SpherePressureEvent => push({ sphere: 'force', source: 'rival', magnitude });

  it('a rival erosion on a place the god never touched debits nothing', () => {
    const debits = mandateCreditsFor('town', 1, [raid(4)], [erosionTrace(3, 1)], () => false);
    expect(debits[0].points).toBe(-2);
    const folded = applyMandateCredits({ primary: 5, secondary: 0 }, {}, debits, 'mind', 'spirit');
    expect(folded.ledger.primary).toBe(5);
    expect(folded.applied).toEqual([]);
  });

  it('a rival erosion on a place the god built debits at most what it built', () => {
    const debits = mandateCreditsFor('town', 1, [raid(4)], [erosionTrace(3, 0)], () => false);
    const held = { [heldKey('town', 'mind')]: 1 };
    const folded = applyMandateCredits({ primary: 5, secondary: 0 }, held, debits, 'mind', 'spirit');
    expect(folded.ledger.primary).toBe(4);
    expect(folded.held[heldKey('town', 'mind')]).toBeUndefined();
  });

  it('a non-opposition erosion debits nothing', () => {
    expect(mandateCreditsFor('town', 1, [push({ sphere: 'force', causedBy: 'mortal' })], [erosionTrace(3, 1)], () => false)).toEqual([]);
  });

  it('credits add to the ledger and to what is held', () => {
    const folded = applyMandateCredits(
      { primary: 0, secondary: 0 }, {},
      [{ entityId: 'town', sphere: 'spirit', points: 2, cause: 'god', sources: ['claim'] }],
      'mind', 'spirit',
    );
    expect(folded.ledger).toEqual({ primary: 0, secondary: 2 });
    expect(folded.held[heldKey('town', 'spirit')]).toBe(2);
    expect(folded.applied[0]).toMatchObject({ applied: 2, ledgerAfter: 2 });
  });
});

describe('THR-2090 — doom\'s stage tide no longer takes back the god\'s life', () => {
  function lifeErosion(): SpherePressureTrace {
    return {
      category: 'sphere_pressure', tick: 1, entityId: 'town', sphere: 'life', outcome: 'eroded',
      incomingPressure: 4, threshold: 1, previousScore: 3, newScore: 1, progressFilled: 0, progressRequired: 1,
      source: 'doom', sources: ['doom'], sourceIds: ['x'],
    };
  }
  // Life's opposite (entropy) carries each push.
  const entropy = (source: SpherePressureEvent['source'], sourceId: string): SpherePressureEvent =>
    push({ sphere: 'entropy', source, sourceId, magnitude: DOOM_PRESSURE_PER_TIER });
  const tide = entropy('doom', `${DOOM_STAGE_PUSH_SOURCE_PREFIX}1`);

  it('an erosion whose only opposite push is the stage tide debits nothing', () => {
    expect(MANDATE_DOOM_STAGE_PUSH_EXEMPT).toBe(true);
    expect(mandateCreditsFor('town', 1, [tide], [lifeErosion()], () => false)).toEqual([]);
  });

  it('a doom archetype card or a rival push still debits', () => {
    for (const p of [entropy('doom', 'doom-stage-card-blight'), entropy('rival', 'r')]) {
      const debits = mandateCreditsFor('town', 1, [p], [lifeErosion()], () => false);
      expect(debits).toHaveLength(1);
      expect(debits[0]).toMatchObject({ sphere: 'life', points: -2, cause: 'opposition' });
    }
  });

  it('the tide still dilutes the opposition share (denominator unchanged)', () => {
    const debits = mandateCreditsFor('town', 1, [tide, entropy('rival', 'r')], [lifeErosion()], () => false);
    expect(debits[0].points).toBe(-1);
  });

  it('a doom push with no sourceId is not the tide', () => {
    expect(isMandateOpposition({ ...tide, sourceId: undefined } as unknown as SpherePressureEvent)).toBe(true);
  });

  it('with the exemption off, the tide is opposition as before', () => {
    expect(isMandateOpposition(tide, false)).toBe(true);
    expect(isMandateOpposition(tide)).toBe(false);
  });
});
