/**
 * Holdings — writer migration and the cross-cutting integrations (THR-1297, slice 3).
 *
 * The plan's disposition table promised two things this file has to actually check:
 * that the two un-flagged agent `controls` writers now write `owns`, and that the
 * integrations which had to learn about the new edge did (the counter tuples, the
 * idempotency guards, the graph condition, and home ground).
 *
 * Each assertion is paired with its negative where the negative is what makes it mean
 * something — a home-ground test that only asserts the bonus appears would pass just as
 * well if the bonus were unconditional.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { grantHolding } from '../holdings';
import { executeGraphOps } from '../graphOpExecutor';
import { claimControl } from '../strategicGraphOps';
import { evaluateGraphCondition } from '../graphConditions';
import { collectTerrainContributions } from '../resolutionModifiers';
import { ACTION_TEMPLATES } from '../../data/action-template-content';
import { FACTION_CONTROL_BONUS } from '../../data/agent-behavior-constants';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc.mill', type: 'location', name: 'Greywater Mill',
    properties: { hexCol: 3, hexRow: 4, locationSubtype: 'market', locationType: 'market', terrain: 'plains' },
  });
  return graph;
}

describe('the two un-flagged agent controls writers migrated to owns', () => {
  it('conquer and establish_network mint owns, not controls', () => {
    // These two authored templates were writing agent ownership onto `controls` with
    // no flag separating it from faction territory — the retroactive decision the
    // plan's disposition table makes explicit. Pinned by template id so a future
    // content edit that reverts one is caught here rather than in a territory
    // consumer six systems away.
    const migrated = ['action.iron.conquer', 'action.shadow.establish-network'];
    const found: Array<{ id: string; edgeTypes: string[] }> = [];

    for (const t of ACTION_TEMPLATES) {
      const ops = [...(t.onSuccess ?? []), ...(t.onFailure ?? [])] as unknown as Array<Record<string, unknown>>;
      const edgeTypes = ops
        .filter(o => o.op === 'add_edge' && typeof o.edgeType === 'string')
        .map(o => o.edgeType as string);
      if (edgeTypes.length > 0) found.push({ id: t.id, edgeTypes });
    }

    for (const id of migrated) {
      const row = found.find(f => f.id === id);
      expect(row, `template ${id} should exist and mint an edge`).toBeDefined();
      expect(row!.edgeTypes).toContain('owns');
      expect(row!.edgeTypes).not.toContain('controls');
    }
  });

  it('an authored add_edge of owns routes through the holdings writer', () => {
    // The single-writer doctrine has to hold for CONTENT-authored ownership too,
    // which is the half that lets `controls` drift into five property shapes. A raw
    // addEdge here would produce an `owns` edge with an empty property bag —
    // violating its own requiredProperties — and no bearer-side face at all.
    const graph = world();
    const batch = executeGraphOps(
      graph,
      [{ op: 'add_edge', edgeType: 'owns', source: '$actor', target: '$target' }],
      { actorId: 'agent.kael', targetId: 'loc.mill', locationId: 'loc.mill', tick: 7 },
    );

    expect(batch.results[0].success).toBe(true);

    const edge = graph.getOutgoingEdges('agent.kael', 'owns')[0];
    expect(edge).toBeDefined();
    // The required properties the schema row demands — present because the writer
    // stamped them, not because the content author remembered to.
    expect(edge.properties.acquiredTick).toBe(7);
    expect(edge.properties.via).toBe('conquest');

    // And the face exists, so the place shows on the sheet.
    const face = graph.getOutgoingEdges('agent.kael', 'possesses')
      .map(e => graph.getNode(e.target))
      .find(n => n?.properties?.attachmentCategory === 'holding');
    expect(face).toBeDefined();
  });
});

describe('idempotency guards see owns', () => {
  it('claimControl refuses a target already held as a holding', () => {
    // Otherwise a place could carry a live `owns` edge AND a live strategic control
    // stance, and `releaseControl` — which only retires `controlType: 'strategic'`
    // edges — would clear one and leave the other standing.
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', { tick: 5 });

    const result = claimControl(graph, 'agent.kael', 'loc.mill', 10);

    expect(result.success).toBe(false);
    expect(result.error).toBe('already_controls');
  });

  it('but still allows claiming a target nobody holds — the guard is not a blanket refusal', () => {
    const graph = world();
    const result = claimControl(graph, 'agent.kael', 'loc.mill', 10);
    expect(result.success).toBe(true);
  });
});

describe('agent_controls_location reads owns', () => {
  it('matches a location the agent owns', () => {
    // The condition's name finally becomes honest: an AGENT holding a place holds it
    // on `owns` now, so content asking "does this agent hold a market?" would have
    // silently missed every holding.
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', { tick: 5 });

    expect(evaluateGraphCondition(
      { type: 'agent_controls_location', locationType: 'market' },
      graph, 'agent.kael',
    )).toBe(true);
  });

  it('does not match when the agent owns nothing of that type', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', { tick: 5 });

    expect(evaluateGraphCondition(
      { type: 'agent_controls_location', locationType: 'castle' },
      graph, 'agent.kael',
    )).toBe(false);
  });
});

describe('standing on your own holding is home ground', () => {
  it('an owner scores the home-ground bonus on their own land', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', { tick: 5 });

    const parts = collectTerrainContributions(graph, 'agent.kael', 'loc.mill');
    const ownership = parts.find(p => p.sourceId === 'agent.kael');

    expect(ownership).toBeDefined();
    expect(ownership!.value).toBe(FACTION_CONTROL_BONUS);
    // Attributed to the OWNER, not to a faction they may not even belong to — the
    // receipt has to read "Kael Thornweaver", or the player is told a faction helped
    // them when none did.
    expect(ownership!.sourceName).toBe('Kael');
  });

  it('a non-owner standing in the same place gets no such bonus', () => {
    // The negative that makes the positive mean something: without it, an
    // unconditional bonus would pass the test above.
    const graph = world();
    graph.addNode({ id: 'agent.mira', type: 'actor', name: 'Mira', properties: { actorType: 'individual' } });
    grantHolding(graph, 'agent.kael', 'loc.mill', { tick: 5 });

    const parts = collectTerrainContributions(graph, 'agent.mira', 'loc.mill');
    expect(parts.find(p => p.sourceId === 'agent.kael')).toBeUndefined();
    expect(parts.find(p => p.kind === 'faction')).toBeUndefined();
  });

  it('ownership overrides a hostile faction verdict on the same hex', () => {
    // The gap the inventory found, stated as a test: before this, an owner whose hex
    // flew another banner scored the HOSTILE_TERRITORY_PENALTY at home.
    const graph = world();
    graph.addNode({ id: 'faction.rivals', type: 'actor', name: 'The Rivals', properties: { actorType: 'faction' } });
    graph.addEdge({
      id: 'e-controls', source: 'faction.rivals', target: 'loc.mill',
      type: 'controls', properties: { influence: 0.8 },
    });
    graph.addEdge({
      id: 'e-hate', source: 'agent.kael', target: 'faction.rivals',
      type: 'relates_to', properties: { sentiment: -0.6 },
    });
    grantHolding(graph, 'agent.kael', 'loc.mill', { tick: 5 });

    const parts = collectTerrainContributions(graph, 'agent.kael', 'loc.mill');
    const factionPart = parts.find(p => p.kind === 'faction');

    expect(factionPart).toBeDefined();
    expect(factionPart!.value).toBeGreaterThan(0);
    expect(factionPart!.sourceId).toBe('agent.kael');
  });
});
