/**
 * Rival-influence marker adapter tests (THR-66, THR-621, THR-829).
 *
 * Rivals are not graph nodes, so the layer never reads an edge. Two inputs are
 * pinned here: essence-source drains (THR-621, read off the source bag) and
 * materialized schemes (THR-829, read off composition state + move-done flags,
 * replacing the `sponsors_scheme` edge that could never bind).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { RivalDefinition } from '../../types/rival';
import type { ActiveComposition } from '../../types/gameState';
import { CORRUPTIVE_FAMILY } from '../../data/rival-schemes';
import { schemeFlags } from '../rival';
import { buildRivalInfluenceMarkers, buildRivalSchemeTargets } from '../rivalInfluenceMarkers';

const RIVAL_ID = 'rival.ashen';

function makeRival(id = RIVAL_ID): RivalDefinition {
  return {
    id,
    name: 'The Ashen',
    sphereAlignment: {} as RivalDefinition['sphereAlignment'],
    behavior: 'subtle',
    oppositionStrength: 0.7,
    description: 'test rival',
    primarySphere: 'darkness',
    secondarySphere: 'mind',
  };
}

function graphWithSource(
  props: Record<string, unknown>,
  hex: { col: number; row: number } = { col: 4, row: 7 },
): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'shrine-1',
    type: 'location',
    name: 'Ashfall Shrine',
    properties: { hexCol: hex.col, hexRow: hex.row, essenceSource: props },
  });
  return graph;
}

describe('buildRivalInfluenceMarkers — essence-source drains (THR-621)', () => {
  it('marks the hex of a source a known rival is contesting', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: RIVAL_ID,
    });
    const markers = buildRivalInfluenceMarkers(graph, [makeRival()]);

    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      col: 4,
      row: 7,
      rivalId: RIVAL_ID,
      targetId: 'shrine-1',
      reason: 'source_contested',
    });
  });

  it('distinguishes a desecrated source from a merely contested one', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0,
      tier: 'desecrated',
      contestedBy: RIVAL_ID,
      desecrated: true,
    });
    expect(buildRivalInfluenceMarkers(graph, [makeRival()])[0].reason).toBe('source_desecrated');
  });

  it('emits nothing for an uncontested source, or a drainer that is not a known rival', () => {
    const clean = graphWithSource({ kind: 'shrine', sanctity: 0.9, tier: 'flowering' });
    expect(buildRivalInfluenceMarkers(clean, [makeRival()])).toEqual([]);

    const stranger = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: 'rival.unknown',
    });
    expect(buildRivalInfluenceMarkers(stranger, [makeRival()])).toEqual([]);
  });

  it('fail-softs on a host with no hex coordinates', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'floating',
      type: 'location',
      name: 'floating',
      properties: {
        essenceSource: { kind: 'shrine', sanctity: 0.5, tier: 'contested', contestedBy: RIVAL_ID },
      },
    });
    expect(buildRivalInfluenceMarkers(graph, [makeRival()])).toEqual([]);
  });

  it('returns an empty list when there are no rivals at all', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: RIVAL_ID,
    });
    expect(buildRivalInfluenceMarkers(graph, [])).toEqual([]);
  });
});

describe('buildRivalSchemeTargets — materialized schemes from state (THR-829)', () => {
  const MATERIALIZE_PHASE = CORRUPTIVE_FAMILY.beats.find((b) => b.move === 'materialize')!.phaseId;

  function comp(extra: Partial<ActiveComposition> = {}): ActiveComposition {
    return {
      compositionId: 'rival-scheme-1',
      firedAtTick: 0,
      activatedPhaseIds: [MATERIALIZE_PHASE],
      phaseActivationTicks: {},
      resolvedNodes: { target: 'shrine-1' },
      status: 'active',
      lastEvaluationTick: 0,
      sponsorRivalId: RIVAL_ID,
      schemeFamily: CORRUPTIVE_FAMILY.id,
      ...extra,
    };
  }
  const doneFlags = { [schemeFlags.moveDone('rival-scheme-1', MATERIALIZE_PHASE)]: true };

  it('returns a rival-sponsored composition once its materialize move has fired', () => {
    expect(buildRivalSchemeTargets([comp()], doneFlags)).toEqual([
      { rivalId: RIVAL_ID, targetId: 'shrine-1', compositionId: 'rival-scheme-1' },
    ]);
  });

  it('skips schemes that have not materialized, have failed, lack a target, or are not rival-sponsored', () => {
    expect(buildRivalSchemeTargets([comp()], {})).toEqual([]);
    expect(buildRivalSchemeTargets([comp({ status: 'failed' })], doneFlags)).toEqual([]);
    expect(buildRivalSchemeTargets([comp({ resolvedNodes: {} })], doneFlags)).toEqual([]);
    expect(buildRivalSchemeTargets([comp({ sponsorRivalId: undefined })], doneFlags)).toEqual([]);
    expect(buildRivalSchemeTargets([comp({ schemeFamily: 'no-such-family' })], doneFlags)).toEqual([]);
    expect(buildRivalSchemeTargets(undefined, doneFlags)).toEqual([]);
  });

  it('marks the target hex with reason scheme, tinted and attributed to the rival', () => {
    const graph = graphWithSource({ kind: 'shrine', sanctity: 0.9, tier: 'flowering' });
    const markers = buildRivalInfluenceMarkers(
      graph,
      [makeRival()],
      buildRivalSchemeTargets([comp()], doneFlags),
    );
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      col: 4,
      row: 7,
      rivalId: RIVAL_ID,
      targetId: 'shrine-1',
      reason: 'scheme',
    });
  });

  it('a live drain wins a hex that is also schemed against', () => {
    const graph = graphWithSource({
      kind: 'shrine',
      sanctity: 0.5,
      tier: 'contested',
      contestedBy: RIVAL_ID,
    });
    const markers = buildRivalInfluenceMarkers(
      graph,
      [makeRival()],
      buildRivalSchemeTargets([comp()], doneFlags),
    );
    expect(markers).toHaveLength(1);
    expect(markers[0].reason).toBe('source_contested');
  });

  it('skips a scheme target that is unplaceable or sponsored by an unknown rival', () => {
    const graph = graphWithSource({ kind: 'shrine', sanctity: 0.9, tier: 'flowering' });
    const ghost = [{ rivalId: RIVAL_ID, targetId: 'nowhere', compositionId: 'x' }];
    expect(buildRivalInfluenceMarkers(graph, [makeRival()], ghost)).toEqual([]);
    const stranger = [{ rivalId: 'rival.unknown', targetId: 'shrine-1', compositionId: 'x' }];
    expect(buildRivalInfluenceMarkers(graph, [makeRival()], stranger)).toEqual([]);
  });
});
