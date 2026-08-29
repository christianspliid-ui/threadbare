import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { AmbitionTemplate } from '../../types/ambition';
import {
  isAutonomousDecisionActor,
  measureStrategicReachability,
} from '../strategicKindReachability';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from '../ambitionShape';

// ─── Fixtures ─────────────────────────────────────────────────────
//
// Deliberately hand-built rather than lifted from `AMBITION_TEMPLATES`: the
// subtraction rule below needs two ambitions that share a template, and pinning
// that against live content would make the test re-pass the day the content
// changes rather than the day the rule breaks.

function template(
  id: string,
  behaviorFamily: string,
  templateIds: readonly string[],
): AmbitionTemplate {
  return {
    id,
    displayName: id,
    category: 'dominion',
    reachFloors: {},
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: [],
    bondModifiers: [],
    boostingTraits: [],
    reachAffinity: {},
    milestones: [],
    strategicProfile: { behaviorFamily, preferredVerbs: ['create'], templateIds, reachEmphasis: {} },
  } as unknown as AmbitionTemplate;
}

function addActor(
  graph: WorldGraph,
  id: string,
  spotlightTier: string | undefined,
  pursuing: readonly string[],
  actorType = 'individual',
) {
  graph.addNode({
    id, name: id, type: 'actor',
    properties: { actorType, ...(spotlightTier === undefined ? {} : { spotlightTier }) },
  });
  for (const templateId of pursuing) {
    const ambitionId = `ambition.${templateId}`;
    if (!graph.getNode(ambitionId)) {
      graph.addNode({
        id: ambitionId, name: templateId, type: 'ambition',
        properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId },
      });
    }
    graph.addEdge({
      id: `pursues_${id}_${ambitionId}`,
      source: id, target: ambitionId, type: 'pursues',
      properties: { status: 'active', priority: 'primary' },
    });
  }
}

// ─── isAutonomousDecisionActor ────────────────────────────────────

describe('isAutonomousDecisionActor', () => {
  it('accepts a spotlight individual', () => {
    const g = new WorldGraph();
    addActor(g, 'a', 'spotlight', []);
    expect(isAutonomousDecisionActor(g.getNode('a')!)).toBe(true);
  });

  it('rejects notable and ambient tiers — the THR-1329 finding', () => {
    const g = new WorldGraph();
    addActor(g, 'n', 'notable', []);
    addActor(g, 'm', 'ambient', []);
    expect(isAutonomousDecisionActor(g.getNode('n')!)).toBe(false);
    expect(isAutonomousDecisionActor(g.getNode('m')!)).toBe(false);
  });

  it('defaults a missing spotlightTier to spotlight, matching phaseAgentDecision', () => {
    const g = new WorldGraph();
    addActor(g, 'legacy', undefined, []);
    expect(isAutonomousDecisionActor(g.getNode('legacy')!)).toBe(true);
  });

  it('rejects non-individual actors even at spotlight tier', () => {
    const g = new WorldGraph();
    addActor(g, 'grp', 'spotlight', [], 'group');
    expect(isAutonomousDecisionActor(g.getNode('grp')!)).toBe(false);
  });
});

// ─── measureStrategicReachability ─────────────────────────────────

describe('measureStrategicReachability', () => {
  const trade = template('amb_trade', 'merchant', ['t_route', 't_survey']);
  const war = template('amb_war', 'warlord', ['t_raid']);

  it('reports an ambition reachable when a spotlight actor pursues it', () => {
    const g = new WorldGraph();
    addActor(g, 'hero', 'spotlight', ['amb_trade']);
    const r = measureStrategicReachability(g, { templates: [trade, war] });

    const row = r.rows.find(x => x.ambitionId === 'amb_trade')!;
    expect(row.reachable).toBe(true);
    expect(row.autonomousHolders).toBe(1);
    expect(r.unreachableTemplateIds).not.toContain('t_route');
  });

  it('reports SILENCED when the only holders sit below the decision tier', () => {
    // This is seed 99 in miniature: the ambition is assigned, an actor wants it,
    // and it can still never reach the strategic board.
    const g = new WorldGraph();
    addActor(g, 'npc', 'notable', ['amb_trade']);
    addActor(g, 'born', 'ambient', ['amb_trade']);
    const r = measureStrategicReachability(g, { templates: [trade, war] });

    const row = r.rows.find(x => x.ambitionId === 'amb_trade')!;
    expect(row.reachable).toBe(false);
    expect(row.autonomousHolders).toBe(0);
    expect(row.silencedHolders).toBe(2);
    expect(r.silencedFamilies).toContain('merchant');
    expect(r.unreachableTemplateIds).toEqual(expect.arrayContaining(['t_route', 't_survey']));
  });

  it('distinguishes "nobody wants it" from "wanted but silenced"', () => {
    const g = new WorldGraph();
    addActor(g, 'hero', 'spotlight', ['amb_war']);
    const r = measureStrategicReachability(g, { templates: [trade, war] });

    // amb_trade is unreachable because zero actors pursue it — not silenced.
    expect(r.unreachableFamilies).toContain('merchant');
    expect(r.silencedFamilies).not.toContain('merchant');
  });

  it('does not call a template unreachable when a second ambition offers it', () => {
    // The bug this pins: taking the union of unreachable rows' templateIds without
    // subtracting the reachable ones reported `strategic_craft_masterwork` and
    // `strategic_chart_the_wilds` as unreachable on a seed where a sibling ambition
    // offered them to five autonomous holders. Two ambitions genuinely share
    // `builder-civic` and two share `scholar-seeker` in live content.
    const forge = template('amb_forge', 'builder', ['t_masterwork', 't_forge_only']);
    const greatWork = template('amb_great', 'builder', ['t_masterwork']);

    const g = new WorldGraph();
    addActor(g, 'hero', 'spotlight', ['amb_great']); // nobody pursues amb_forge
    const r = measureStrategicReachability(g, { templates: [forge, greatWork] });

    expect(r.rows.find(x => x.ambitionId === 'amb_forge')!.reachable).toBe(false);
    expect(r.rows.find(x => x.ambitionId === 'amb_great')!.reachable).toBe(true);
    // Shared template stays reachable; the forge-only one does not.
    expect(r.unreachableTemplateIds).not.toContain('t_masterwork');
    expect(r.unreachableTemplateIds).toContain('t_forge_only');
    // ...and the family is reachable, because one of its two ambitions is.
    expect(r.unreachableFamilies).not.toContain('builder');
  });

  it('ignores inactive pursues edges and excluded actors', () => {
    const g = new WorldGraph();
    addActor(g, 'hero', 'spotlight', ['amb_trade']);
    // Abandoned ambitions must not count as holders.
    const edge = g.getOutgoingEdges('hero', 'pursues')[0];
    edge.properties.status = 'abandoned';
    expect(measureStrategicReachability(g, { templates: [trade] })
      .rows[0].reachable).toBe(false);

    edge.properties.status = 'active';
    expect(measureStrategicReachability(g, {
      templates: [trade], excludedActorIds: new Set(['hero']),
    }).rows[0].reachable).toBe(false);
  });

  it('skips ambition nodes with no templateId rather than crediting them', () => {
    // THR-1285 shape: a corrupt ambition must not be counted as a holder of
    // whatever id happens to be missing.
    const g = new WorldGraph();
    g.addNode({ id: 'a', name: 'a', type: 'actor', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
    g.addNode({ id: 'ambition.broken', name: 'broken', type: 'ambition', properties: {} });
    g.addEdge({
      id: 'pursues_a_broken', source: 'a', target: 'ambition.broken',
      type: 'pursues', properties: { status: 'active' },
    });

    const r = measureStrategicReachability(g, { templates: [trade] });
    expect(r.rows[0].autonomousHolders).toBe(0);
    expect(r.autonomousActorCount).toBe(1);
  });
});
