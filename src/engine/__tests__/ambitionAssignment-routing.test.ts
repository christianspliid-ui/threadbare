/**
 * The two inline `pursues` writers in `ambitionTick` route through
 * `assignAmbitionToActor` (THR-1348) — and what they write is byte-identical to what
 * the inline writes produced.
 *
 * "Byte-identical" is asserted on `JSON.stringify` of the edge and node property bags
 * against literals transcribed from the inline writers as they stood before routing
 * (`ambitionTick.ts` :955 mint-to-holder, :1023 re-evaluation, `main` 542b4d33). Key
 * order is part of the contract: `extraProperties` is spread last so the mint lane's
 * provenance and grievance fields land in the inline order.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { assignAmbitionToActor } from '../ambitionAssignment';
import { phaseAmbitionProgress, MILESTONE_CHECK_INTERVAL, AMBITION_REEVAL_INTERVAL, resetAmbitionEventCounter } from '../ambitionTick';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from '../ambitionShape';
import {
  AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
  findAmbitionTemplateById,
} from '../../data/ambition-templates';
import { REACH_DOMAINS } from '../../types/traits';
import {
  flushSpotlightPullTrace,
  resetSpotlightPullTrace,
  readSpotlightLedger,
  SPOTLIGHT_PULLED_TICK_KEY,
  SPOTLIGHT_PULL_DEMOTED_ID_KEY,
} from '../spotlightPull';

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed: 42, graph,
    cosmology: {} as never, tiles: [], clock: {} as never, ascendantId: 'asc_1',
    essencePool: {} as never, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [], doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [], stealthExposure: 0,
    visibilityMap: new Map() as never, familiarityMap: new Map() as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(), encounterProgress: [],
    actionsInProgress: [], unifiedActions: [], worldSoul: {} as never,
    echoDefinitions: [], echoStates: [], chronicle: {} as never,
  } as unknown as GameState;
}

beforeEach(() => { resetAmbitionEventCounter(); resetSpotlightPullTrace(); });
afterEach(() => { flushSpotlightPullTrace(); });

describe('assignAmbitionToActor writes what the inline writers wrote', () => {
  it('the re-evaluation shape: four keys, in order', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'a', type: 'actor', name: 'a', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
    // The re-evaluation writer selects from `AMBITION_TEMPLATES` only.
    const templateId = AMBITION_TEMPLATES[0].id;
    const r = assignAmbitionToActor(g, 'a', templateId, 75, { priority: 'primary' });
    expect(r.assigned).toBe(true);

    const edge = g.getOutgoingEdges('a', 'pursues')[0];
    expect(edge.id).toBe(`pursues_a_ambition.${templateId}`);
    // Transcribed from the inline re-evaluation writer.
    const inline = { priority: 'primary', status: 'active', assignedTick: 75, completedMilestones: [] };
    expect(JSON.stringify(edge.properties)).toBe(JSON.stringify(inline));

    const tmpl = AMBITION_TEMPLATES.find(t => t.id === templateId)!;
    const inlineNode = {
      [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE,
      templateId,
      displayName: tmpl.displayName ?? templateId,
      category: tmpl.category ?? 'survival',
      reachAffinity: tmpl.reachAffinity ?? {},
      totalMilestones: tmpl.milestones.length ?? 0,
    };
    expect(JSON.stringify(g.getNode(`ambition.${templateId}`)!.properties)).toBe(JSON.stringify(inlineNode));
  });

  it('the mint-to-holder shape: provenance then grievance state, in order, and a minted-pool template resolves', () => {
    // A template from the event-minted pool: `AMBITION_TEMPLATES.find` alone returned
    // `template_unknown` for every world-minted drive, which is why the mint lane
    // could never have routed here before THR-1348 widened the lookup.
    const minted = [...EVENT_MINTED_AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES][0];
    expect(AMBITION_TEMPLATES.find(t => t.id === minted.id)).toBeUndefined();
    expect(findAmbitionTemplateById(minted.id)).toBe(minted);

    const g = new WorldGraph();
    g.addNode({ id: 'h', type: 'actor', name: 'h', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
    const grievance = { grievance: true, culpritAgentId: 'c', harmMagnitude: 0.8, heat: 1, chainDepth: 0 };
    const r = assignAmbitionToActor(g, 'h', minted.id, 150, {
      priority: 'secondary',
      extraProperties: { mintedByEventId: 'evt_1', mintedByLabel: 'a razing', ...grievance },
    });
    expect(r.assigned).toBe(true);

    const edge = g.getOutgoingEdges('h', 'pursues')[0];
    // Transcribed from the inline mint-to-holder writer.
    const inline = {
      priority: 'secondary', status: 'active', assignedTick: 150, completedMilestones: [],
      mintedByEventId: 'evt_1', mintedByLabel: 'a razing', ...grievance,
    };
    expect(JSON.stringify(edge.properties)).toBe(JSON.stringify(inline));
  });

  it('skipSpotlightPull writes the edge and leaves the tier alone — the binder\'s support-mint contract', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'clerk', type: 'actor', name: 'clerk', properties: { actorType: 'individual', spotlightTier: 'ambient', npcRole: 'merchant' } });
    const strategic = AMBITION_TEMPLATES.find(t => t.strategicProfile)!.id;
    const r = assignAmbitionToActor(g, 'clerk', strategic, 9, { skipSpotlightPull: true, seed: 1 });
    expect(r.assigned).toBe(true);
    expect(r.pull).toEqual({ pulled: false, reason: 'not_applicable' });
    expect(g.getNode('clerk')!.properties.spotlightTier).toBe('ambient');
    expect(g.getNode('clerk')!.properties[SPOTLIGHT_PULLED_TICK_KEY]).toBeUndefined();
    expect(g.getOutgoingEdges('clerk', 'pursues')).toHaveLength(1);
  });

  it('refuses instead of throwing where the inline addEdge would have thrown on a duplicate id', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'a', type: 'actor', name: 'a', properties: { actorType: 'individual', spotlightTier: 'spotlight' } });
    expect(assignAmbitionToActor(g, 'a', 'ambition_avenge_fallen', 1).assigned).toBe(true);
    expect(assignAmbitionToActor(g, 'a', 'ambition_avenge_fallen', 2)).toMatchObject({ assigned: false, reason: 'already_pursued' });
  });
});

describe('the re-evaluation writer reaches the spotlight pull', () => {
  it('a notable mortal re-evaluated onto a strategic ambition is pulled into the spotlight — only the routed helper can do that', () => {
    // Every plain (non-strategic) template is pre-held as abandoned: `existingTemplateIds`
    // reads pursues edges of any status, so the re-eval can only select a strategic
    // one, and a strategic assignment on a notable holder pulls — which no inline
    // writer ever could. An assignment that lands without a pull fails this test.
    const g = new WorldGraph();
    const caps: Record<string, number> = {};
    for (const r of REACH_DOMAINS) caps[r] = 36; // raw (THR-1562: share 0.9)
    g.addNode({
      id: 'n', type: 'actor', name: 'Nessa',
      properties: { actorType: 'individual', spotlightTier: 'notable', npcRole: 'merchant', domainCapabilities: caps },
    });
    g.addNode({
      id: 's', type: 'actor', name: 'Sable',
      properties: { actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: caps },
    });
    // The swap candidate holds two plain wants: full, so the re-evaluation does not
    // hand it a strategic one and pull it straight back (which is correct behaviour,
    // and what this fixture is deliberately not measuring).
    // THR-1560: `ambition_avenge_fallen` gained a profile; its event-minted sibling is still plain.
    for (const plain of ['ambition_avenge_the_wrong', 'ambition_fulfill_destiny']) {
      expect(findAmbitionTemplateById(plain)?.strategicProfile).toBeUndefined();
      g.addNode({ id: `ambition.${plain}`, type: 'ambition', name: plain, properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: plain } });
      g.addEdge({ id: `pursues_s_ambition.${plain}`, source: 's', target: `ambition.${plain}`, type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 0, completedMilestones: [] } });
    }
    for (const t of AMBITION_TEMPLATES.filter(t => !t.strategicProfile)) {
      g.addNode({ id: `ambition.${t.id}`, type: 'ambition', name: t.id, properties: { [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE, templateId: t.id } });
      g.addEdge({ id: `pursues_n_ambition.${t.id}`, source: 'n', target: `ambition.${t.id}`, type: 'pursues', properties: { status: 'abandoned', priority: 'primary', assignedTick: 0, completedMilestones: [] } });
    }

    // The re-evaluation gate is `tick % AMBITION_REEVAL_INTERVAL === 0` inside a phase
    // that runs on `MILESTONE_CHECK_INTERVAL` — the first tick both open is their lcm.
    const tick = MILESTONE_CHECK_INTERVAL * AMBITION_REEVAL_INTERVAL
      / (function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); })(MILESTONE_CHECK_INTERVAL, AMBITION_REEVAL_INTERVAL);
    const out = phaseAmbitionProgress(makeState(g, tick));

    const active = g.getOutgoingEdges('n', 'pursues').filter(e => e.properties.status === 'active');
    expect(active.length).toBeGreaterThan(0); // not vacuous: something was assigned
    for (const e of active) {
      const templateId = g.getNode(e.target)!.properties.templateId as string;
      expect(findAmbitionTemplateById(templateId)?.strategicProfile).toBeDefined();
      expect(JSON.stringify(Object.keys(e.properties))).toBe(JSON.stringify(['priority', 'status', 'assignedTick', 'completedMilestones']));
    }

    expect(g.getNode('n')!.properties.spotlightTier).toBe('spotlight');
    expect(g.getNode('n')!.properties[SPOTLIGHT_PULLED_TICK_KEY]).toBe(tick);
    // The swap: n's pull displaced s. (s's own walk later in the same phase may
    // abandon a plain want on its first evaluation, re-select a strategic one and be
    // pulled straight back net-additive — correct, and bounded by the mark below.)
    expect(g.getNode('n')!.properties[SPOTLIGHT_PULL_DEMOTED_ID_KEY]).toBe('s');
    const events = out.tickEvents ?? [];
    expect(events.some(e => e.type === 'narrative' && e.actorId === 'n' && e.message.includes('sets their mind to'))).toBe(true);
    flushSpotlightPullTrace();
    const ledgerAfterFirst = readSpotlightLedger(g);
    expect(ledgerAfterFirst.pulled.some(p => p.id === 'n' && p.demotedId === 's' && p.tick === tick)).toBe(true);

    // No churn: a second pass re-evaluates whatever was abandoned, and the
    // `already_pulled` mark refuses every re-pull — the ledger's pulled set is unchanged.
    phaseAmbitionProgress(makeState(g, tick * 2));
    flushSpotlightPullTrace();
    expect(readSpotlightLedger(g).pulled).toEqual(ledgerAfterFirst.pulled);
  });
});
