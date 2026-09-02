// THR-1298 slice 7 — the reactive loop's read model.
//
// Slices 1–6 built a harm into a drive and gave that drive an ending. Nothing a player
// opens could see any of it. These guards cover the two reads that changed that: the
// vendetta half of `ActiveIntent`, and `getAgentGrudges`.
//
// Every guard here is falsifiable — the comment above each block names the mutation that
// kills it, and each was run and reverted before the suite was trusted.

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getAgentInfoCard, getAgentGrudges } from '../agentDetail';
import {
  AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
  findAmbitionTemplateById,
} from '../../data/ambition-templates';
import { getGrievanceHeatWord, GRUDGE_CAUSE_CLAUSE_UNKNOWN } from '../../data/grievance-prose';
import {
  GRIEVANCE_HEAT_BAND_BURNING,
  GRIEVANCE_HEAT_BAND_HOT,
} from '../../data/grievance-constants';

const AGENT_ID = 'agent.victim';
const ASC_ID = 'asc.test';
const CULPRIT_ID = 'agent.culprit';

// ─── Fixture ─────────────────────────────────────────────────────

function addActor(graph: WorldGraph, id: string, name: string): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 5, gold: 3, shadow: 2, veil: 1, heart: 1, eye: 1, stone: 1, star: 1 },
      axiologicalProfile: { loyalty_ambition: 0.7 },
    },
  });
}

/** A threaded victim, a culprit, and the ascendant watching. */
function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  addActor(graph, AGENT_ID, 'Test Agent');
  addActor(graph, CULPRIT_ID, 'Sera Ashfall');
  graph.addNode({ id: ASC_ID, type: 'actor', name: 'Ascendant', properties: { actorType: 'individual' } });
  graph.addEdge({
    id: `thread_${AGENT_ID}`,
    source: ASC_ID,
    target: AGENT_ID,
    type: 'thread',
    properties: { tier: 2 },
  });
  return graph;
}

/**
 * A `pursues` edge, optionally carrying grievance state.
 *
 * The ambition node deliberately carries no grievance fields: the whole point of the
 * per-instance design is that the node is shared and only the edge knows whose harm it
 * was, so a fixture that stamped the node could pass against a reader that ignored edges.
 */
function addPursues(
  graph: WorldGraph,
  agentId: string,
  templateId: string,
  edgeProps: Record<string, unknown> = {},
): void {
  const template = findAmbitionTemplateById(templateId);
  const ambitionNodeId = `ambition.${templateId}`;
  if (!graph.getNode(ambitionNodeId)) {
    graph.addNode({
      id: ambitionNodeId,
      type: 'ambition',
      name: template?.displayName ?? templateId,
      properties: {
        templateId,
        displayName: template?.displayName ?? templateId,
        category: template?.category ?? 'survival',
        reachAffinity: template?.reachAffinity ?? {},
        totalMilestones: template?.milestones.length ?? 0,
      },
    });
  }
  graph.addEdge({
    id: `pursues_${agentId}_${templateId}`,
    source: agentId,
    target: ambitionNodeId,
    type: 'pursues',
    properties: { priority: 'primary', status: 'active', assignedTick: 1, completedMilestones: [], ...edgeProps },
  });
}

function addHostile(
  graph: WorldGraph,
  from: string,
  to: string,
  properties: Record<string, unknown>,
): void {
  graph.addEdge({ id: `hostile_${from}_${to}`, source: from, target: to, type: 'hostile_to', properties });
}

/**
 * The vengeance template, resolved from the pool that actually holds it.
 *
 * Non-null-asserted on purpose: an id typo or a retired template must fail *here*, at
 * import, rather than downstream as "the reader produced no intent" — which is what a
 * missing template looks like from the assertion's side, and is a different defect.
 */
const REVENGE_TEMPLATE: string = GRIEVANCE_AMBITION_TEMPLATES.find(t => t.id === 'ambition_seek_revenge')!.id;
/** Any non-vengeance template, so the negative arm is a genuine ordinary want. */
const PLAIN_TEMPLATE: string = AMBITION_TEMPLATES.find(t => t.id !== REVENGE_TEMPLATE)!.id;

function cardFor(graph: WorldGraph, level: 'known' | 'recognised' = 'known') {
  return getAgentInfoCard(graph, AGENT_ID, ASC_ID, level, 0, 10);
}

// ─── Heat words ──────────────────────────────────────────────────

describe('getGrievanceHeatWord', () => {
  // Falsified by: returning a constant word. A frozen implementation fails the
  // "all three appear" assertion; one with the comparisons swapped fails monotonicity.
  it('is monotonic across the whole heat range and reaches all three words', () => {
    const SEVERITY = { cooling: 0, hot: 1, burning: 2 } as const;
    const seen = new Set<string>();
    let previous = -1;

    // Sweep the range heat actually occupies (0 → the ceiling), not the type's range.
    for (let heat = 0; heat <= 1.0001; heat += 0.01) {
      const word = getGrievanceHeatWord(heat);
      seen.add(word);
      const severity = SEVERITY[word];
      expect(severity).toBeGreaterThanOrEqual(previous);
      previous = severity;
    }

    expect([...seen].sort()).toEqual(['burning', 'cooling', 'hot']);
  });

  // Falsified by: changing either `>=` to `>`. The bands are half-open at the bottom, so
  // a grievance sitting exactly on a threshold belongs to the hotter word.
  it('includes its own thresholds in the hotter band', () => {
    expect(getGrievanceHeatWord(GRIEVANCE_HEAT_BAND_BURNING)).toBe('burning');
    expect(getGrievanceHeatWord(GRIEVANCE_HEAT_BAND_HOT)).toBe('hot');
  });

  // Falsified by: dropping the Number.isFinite guard — NaN then falls through every
  // comparison to 'cooling' by accident rather than by decision, and undefined throws.
  it('reads a missing or non-finite heat as cooling rather than throwing', () => {
    expect(getGrievanceHeatWord(undefined)).toBe('cooling');
    expect(getGrievanceHeatWord(NaN)).toBe('cooling');
    // A finite heat above the ceiling is still the hottest thing on the scale.
    expect(getGrievanceHeatWord(2)).toBe('burning');
    expect(getGrievanceHeatWord(Infinity)).toBe('cooling');
  });
});

// ─── Intent provenance ───────────────────────────────────────────

describe('ActiveIntent — vendetta provenance (THR-1298)', () => {
  it('surfaces the culprit, the heat word and the minting event from the edge', () => {
    const graph = makeWorld();
    addPursues(graph, AGENT_ID, REVENGE_TEMPLATE, {
      grievance: true,
      culpritAgentId: CULPRIT_ID,
      heat: 0.9,
      mintedByLabel: 'the razing of Thornhall',
      mintedByEventId: 'event.razing.1',
    });

    const intent = cardFor(graph)?.intents?.[0];
    expect(intent?.grievance).toEqual({
      culpritId: CULPRIT_ID,
      culpritName: 'Sera Ashfall',
      heatWord: 'burning',
    });
    expect(intent?.mintedByLabel).toBe('the razing of Thornhall');
  });

  // The controlled arm. Falsified by: setting `grievance` unconditionally — this arm then
  // grows a grievance block on an ordinary want and fails, which is the failure the
  // positive arm alone could never catch.
  it('leaves an ordinary want with no grievance block at all', () => {
    const graph = makeWorld();
    addPursues(graph, AGENT_ID, PLAIN_TEMPLATE);

    const intent = cardFor(graph)?.intents?.[0];
    expect(intent).toBeDefined();
    expect(intent?.grievance).toBeUndefined();
    expect(intent?.mintedByLabel).toBeUndefined();
  });

  // Falsified by: reading the culprit name without the id fallback — the name then goes
  // undefined and the vendetta renders as if it were against nobody, which is exactly the
  // moment a player most wants to see it is still being carried.
  it('falls back to the culprit id when the culprit node is gone', () => {
    const graph = makeWorld();
    graph.removeNode(CULPRIT_ID);
    addPursues(graph, AGENT_ID, REVENGE_TEMPLATE, {
      grievance: true,
      culpritAgentId: CULPRIT_ID,
      heat: 0.5,
    });

    const grievance = cardFor(graph)?.intents?.[0]?.grievance;
    expect(grievance?.culpritName).toBe(CULPRIT_ID);
    expect(grievance?.heatWord).toBe('hot');
  });

  // Falsified by: making culpritId non-optional. A harm whose culprit never resolved
  // still mints a drive (fail-soft table row 1), and that drive must still render.
  it('renders a culprit-less grievance rather than dropping the drive', () => {
    const graph = makeWorld();
    addPursues(graph, AGENT_ID, REVENGE_TEMPLATE, { grievance: true, heat: 0.2 });

    const intent = cardFor(graph)?.intents?.[0];
    expect(intent).toBeDefined();
    expect(intent?.grievance).toEqual({ heatWord: 'cooling' });
  });
});

// ─── Grudges ─────────────────────────────────────────────────────

describe('getAgentGrudges', () => {
  // Falsified by: reading only outgoing edges. The mentorship writer writes one direction
  // only, so a one-sided grudge would vanish from the sheet that exists to show it.
  it('reads both directions and reports each pair once', () => {
    const graph = makeWorld();
    addHostile(graph, AGENT_ID, CULPRIT_ID, { cause: 'grievance_cooled', since: 4 });
    addHostile(graph, CULPRIT_ID, AGENT_ID, { cause: 'grievance_cooled', since: 4 });

    const grudges = getAgentGrudges(graph, AGENT_ID);
    expect(grudges).toEqual([
      { targetId: CULPRIT_ID, targetName: 'Sera Ashfall', causeClause: 'an old wrong that never quite closed' },
    ]);
  });

  it('finds a grudge written only in the incoming direction', () => {
    const graph = makeWorld();
    addHostile(graph, CULPRIT_ID, AGENT_ID, { basis: 'mentorship_break' });

    expect(getAgentGrudges(graph, AGENT_ID)).toEqual([
      { targetId: CULPRIT_ID, targetName: 'Sera Ashfall', causeClause: 'a teaching that ended badly' },
    ]);
  });

  // Falsified by: filtering on `node.type === 'actor'` alone — which is what the first
  // draft of this reader did, and it admits every one of these. A faction is not a
  // separate node type: it is an `actor` carrying `actorType: 'faction'`, so the type
  // check passes and a guild lands in a list of *people*. Caught by the typechecker
  // rejecting `type: 'faction'` in this very fixture.
  it.each(['faction', 'culture', 'group'])(
    'excludes a %s — a collective is not somebody you have history with',
    (actorType) => {
      const graph = makeWorld();
      graph.addNode({
        id: `collective.${actorType}`,
        type: 'actor',
        name: 'The Arcane Circle',
        properties: { actorType },
      });
      addHostile(graph, `collective.${actorType}`, AGENT_ID, { reason: 'excommunicated' });

      expect(getAgentGrudges(graph, AGENT_ID)).toEqual([]);
    },
  );

  // The controlled arm for the exclusion above: prove the fixture's *shape* can be seen
  // at all, so the three exclusions are not passing because a `hostile_to` edge written
  // this way is invisible to the reader for some other reason.
  it('keeps an individual written the same way', () => {
    const graph = makeWorld();
    addHostile(graph, CULPRIT_ID, AGENT_ID, { reason: 'excommunicated' });

    expect(getAgentGrudges(graph, AGENT_ID).map(g => g.targetId)).toEqual([CULPRIT_ID]);
  });

  // Falsified by: reading only `cause`. Two of the three live writers use another key,
  // and an unread key renders as the unknown clause on an edge that knows its own cause.
  it('reads provenance across all three key spellings', () => {
    const graph = makeWorld();
    addActor(graph, 'agent.b', 'Bram');
    addActor(graph, 'agent.c', 'Corin');
    addHostile(graph, AGENT_ID, CULPRIT_ID, { cause: 'group_engagement' });
    addHostile(graph, AGENT_ID, 'agent.b', { basis: 'mentorship_break' });
    addHostile(graph, AGENT_ID, 'agent.c', { reason: 'excommunicated' });

    const clauses = getAgentGrudges(graph, AGENT_ID).map(g => g.causeClause);
    expect(clauses).not.toContain(GRUDGE_CAUSE_CLAUSE_UNKNOWN);
    expect(new Set(clauses).size).toBe(3);
  });

  // A notable's declared feud writes `hostile_to` with no provenance key at all.
  it('renders an unclassified grudge with the unknown clause rather than dropping it', () => {
    const graph = makeWorld();
    addHostile(graph, AGENT_ID, CULPRIT_ID, { family: 'feud', establishedTick: 3 });

    expect(getAgentGrudges(graph, AGENT_ID)[0]?.causeClause).toBe(GRUDGE_CAUSE_CLAUSE_UNKNOWN);
  });

  // Falsified by: dropping the sort. Edge iteration order is insertion order, so an
  // unsorted read reshuffles the prose whenever a grudge is written (NFP #3).
  it('orders by node id so the prose never reshuffles between reads', () => {
    const graph = makeWorld();
    addActor(graph, 'agent.zeta', 'Zeta');
    addActor(graph, 'agent.alpha', 'Alpha');
    addHostile(graph, AGENT_ID, 'agent.zeta', { cause: 'group_engagement' });
    addHostile(graph, AGENT_ID, 'agent.alpha', { cause: 'group_engagement' });

    expect(getAgentGrudges(graph, AGENT_ID).map(g => g.targetId))
      .toEqual(['agent.alpha', 'agent.zeta']);
  });

  it('never reports a self-grudge', () => {
    const graph = makeWorld();
    graph.addEdge({
      id: 'hostile_self',
      source: AGENT_ID,
      target: AGENT_ID,
      type: 'hostile_to',
      properties: { cause: 'group_engagement' },
    });

    expect(getAgentGrudges(graph, AGENT_ID)).toEqual([]);
  });
});

// ─── Card gating ─────────────────────────────────────────────────

describe('getAgentInfoCard — grudges', () => {
  // Falsified by: gating grudges at a lower level than bonds — the player would then
  // learn who someone hates before they know who they trust.
  it('withholds grudges below the knowledge level that reveals bonds', () => {
    const graph = makeWorld();
    addHostile(graph, AGENT_ID, CULPRIT_ID, { cause: 'grievance_cooled' });

    expect(cardFor(graph, 'recognised')?.grudges).toBeUndefined();
    expect(cardFor(graph, 'known')?.grudges).toHaveLength(1);
  });

  // Falsified by: assigning the array unconditionally — the tab then renders an empty
  // "Blood" heading for every agent who has never wronged anyone.
  it('omits the field entirely when no blood stands', () => {
    const graph = makeWorld();
    expect(cardFor(graph, 'known')?.grudges).toBeUndefined();
  });
});
