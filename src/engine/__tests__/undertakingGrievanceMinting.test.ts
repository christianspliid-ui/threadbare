/**
 * THR-1298 — a harm mints a drive, and names who did it.
 *
 * The defect this closes: `gatherMintTuples` read only `encounter_outcome` nodes, while
 * every undertaking outcome was a flat `TickEvent`, so **no undertaking outcome could
 * mint anything** — including the abandonment event doc 1 emitted expressly for this
 * lane. These tests drive the real lane rather than a fixture of it, because a fixture
 * that invents both the node shape and the reader's expectation verifies fiction.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../traceBuffer';
import {
  mintAmbitionsFromEvents,
  buildAmbitionAgentSnapshot,
  MINT_LOOKBACK_TICKS,
} from '../ambitionTick';
import { createUndertakingOutcomeNode } from '../grievance/undertakingOutcomeNode';
import { UNDERTAKING_MINTING_RULES, HARM_MAGNITUDE_BY_CLASS } from '../../data/ambition-minting-rules';
import type { StrategicProjectRuntime } from '../../types/strategicAction';
import type { UndertakingOutcomeEventTrace } from '../../types/trace';

const VICTIM = 'actor.victim';
const CULPRIT = 'actor.culprit';
const BYSTANDER = 'actor.bystander';
const SITE = 'loc.dunmar';
const TICK = 75;

function makeProject(overrides: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj_raze_1',
    actorId: CULPRIT,
    templateId: 'strategic_raze_settlement',
    ambitionId: 'ambition_conquer_territory',
    verb: 'destroy',
    // A real member of the closed `BehaviorFamily` union. This read 'conquest' until
    // THR-1298 slice 5 — not a member of anything, kept alive by the `as` cast below.
    behaviorFamily: 'warlord-expansion',
    targetNodeId: SITE,
    originLocationId: SITE,
    progress: 10,
    progressRequired: 10,
    startedTick: 60,
    lastProgressTick: TICK,
    status: 'completed',
    ...overrides,
  } as StrategicProjectRuntime;
}

function makeWorld(): WorldGraph {
  const graph = new WorldGraph();
  for (const [id, name] of [[VICTIM, 'Sera'], [CULPRIT, 'Hesk'], [BYSTANDER, 'Wren']] as const) {
    graph.addNode({
      id, type: 'actor', name,
      properties: {
        actorType: 'individual',
        domainCapabilities: { iron: 0.4, shadow: 0.3, heart: 0.3, stone: 0.3, gold: 0.3 },
      },
    });
  }
  graph.addNode({ id: SITE, type: 'location', name: 'Dunmar', properties: {} });
  // The bystander is standing in it; the victim is not, so their claim comes from the
  // victim edge alone. That separation is what makes the witness arm meaningful.
  graph.addEdge({ id: 'bystander_loc', source: BYSTANDER, target: SITE, type: 'located_at', properties: {} });
  graph.addEdge({ id: 'culprit_loc', source: CULPRIT, target: SITE, type: 'located_at', properties: {} });
  return graph;
}

/** First seed in [0, limit) that produces a mint — deterministic across runs. */
function firstMint(graph: WorldGraph, actorId: string, limit = 80) {
  const snapshot = buildAmbitionAgentSnapshot(graph, actorId);
  for (let s = 0; s < limit; s++) {
    const minted = mintAmbitionsFromEvents(graph, actorId, TICK, s, snapshot, new Set(), new Map());
    if (minted) return minted;
  }
  return null;
}

describe('createUndertakingOutcomeNode', () => {
  it('writes the node and the two participation roles the mint lane reads', () => {
    const graph = makeWorld();
    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    });

    expect(nodeId).toBeDefined();
    const node = graph.getNode(nodeId!)!;
    expect(node.type).toBe('event');
    expect(node.properties.eventType).toBe('undertaking_outcome');
    expect(node.properties.harmClass).toBe('property_destroyed');
    expect(node.properties.culpritAgentId).toBe(CULPRIT);
    expect(node.properties.harmMagnitude).toBe(HARM_MAGNITUDE_BY_CLASS.property_destroyed);

    const roleOf = (actorId: string) => graph.getOutgoingEdges(actorId, 'participated_in')
      .find((e) => e.target === nodeId)?.properties.role;
    expect(roleOf(CULPRIT)).toBe('primary');
    // 'target' is the exact key gatherMintTuples classifies as `victim`.
    expect(roleOf(VICTIM)).toBe('target');
    expect(graph.getOutgoingEdges(nodeId!, 'occurred_at')[0]?.target).toBe(SITE);
  });

  it('refuses to write a harm the god dealt', () => {
    const graph = makeWorld();
    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject({ actorId: 'asc_1' }), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM, ascendantId: 'asc_1',
    });
    expect(nodeId).toBeUndefined();
  });

  it('gives a self-facing harm the victim role and no culprit', () => {
    const graph = makeWorld();
    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject({ actorId: VICTIM }), harmClass: 'undertaking_abandoned',
      tick: TICK, victimAgentId: VICTIM, selfFacing: true,
    })!;
    expect(graph.getNode(nodeId)!.properties.culpritAgentId).toBeUndefined();
    expect(
      graph.getOutgoingEdges(VICTIM, 'participated_in')
        .find((e) => e.target === nodeId)?.properties.role,
    ).toBe('target');
  });
});

describe('the mint lane reads undertaking outcomes', () => {
  it('mints a grievance naming the culprit for the victim of a razing', () => {
    const graph = makeWorld();
    createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    });

    const minted = firstMint(graph, VICTIM);
    expect(minted).not.toBeNull();

    const offered = new Set(
      (UNDERTAKING_MINTING_RULES.property_destroyed.victim ?? []).map((e) => e.templateId),
    );
    expect(offered.has(minted!.templateId)).toBe(true);
    expect(minted!.eventClass).toBe('property_destroyed');
    // Provenance reads aloud and carries no digits (the receipt is prose, not telemetry).
    expect(minted!.mintedByLabel).toContain('Dunmar');
    expect(minted!.mintedByLabel).toContain('Hesk');
    expect(/\d/.test(minted!.mintedByLabel)).toBe(false);
  });

  /**
   * The controlled arm for the grievance block. Same harm, same lane, one input
   * perturbed — the culprit is unknown — and the perturbation is *confirmed to apply*
   * (the node really has no `culpritAgentId`) before the absence is asserted.
   */
  it('mints the drive but no grievance when the harm names no hand', () => {
    const graph = makeWorld();
    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    })!;
    // Perturb: strip the culprit, and prove the strip landed.
    delete graph.getNode(nodeId)!.properties.culpritAgentId;
    graph.getOutgoingEdges(CULPRIT, 'participated_in')
      .filter((e) => e.target === nodeId)
      .forEach((e) => graph.removeEdge(e.id));
    expect(graph.getNode(nodeId)!.properties.culpritAgentId).toBeUndefined();

    const minted = firstMint(graph, VICTIM);
    expect(minted).not.toBeNull();
    expect(minted!.grievance).toBeUndefined();
    // …and the control: with the culprit present, the same lane can produce one.
    const withCulprit = makeWorld();
    createUndertakingOutcomeNode({
      graph: withCulprit, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    });
    const grievanceSeeds = Array.from({ length: 80 }, (_, s) => s)
      .map((s) => mintAmbitionsFromEvents(
        withCulprit, VICTIM, TICK, s,
        buildAmbitionAgentSnapshot(withCulprit, VICTIM), new Set(), new Map(),
      ))
      .filter((m) => m?.grievance);
    expect(grievanceSeeds.length).toBeGreaterThan(0);
    expect(grievanceSeeds[0]!.grievance!.culpritAgentId).toBe(CULPRIT);
    expect(grievanceSeeds[0]!.grievance!.harmMagnitude)
      .toBe(HARM_MAGNITUDE_BY_CLASS.property_destroyed);
  });

  it('offers a witness soft drives only, never a grievance', () => {
    const graph = makeWorld();
    createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    });

    const witnessIds = new Set(
      (UNDERTAKING_MINTING_RULES.property_destroyed.witness ?? []).map((e) => e.templateId),
    );
    let sawAny = false;
    for (let s = 0; s < 80; s++) {
      const minted = mintAmbitionsFromEvents(
        graph, BYSTANDER, TICK, s,
        buildAmbitionAgentSnapshot(graph, BYSTANDER), new Set(), new Map(),
      );
      if (!minted) continue;
      sawAny = true;
      expect(witnessIds.has(minted.templateId)).toBe(true);
      expect(minted.grievance).toBeUndefined();
    }
    // Guard the vacuous arm: "never a grievance" is trivially true over zero mints.
    expect(sawAny).toBe(true);
  });

  it('mints nothing for the hand that dealt the harm', () => {
    const graph = makeWorld();
    createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    });
    // The culprit both acted in it and stands at the site, so both the participation
    // arm and the witness arm must decline them.
    for (let s = 0; s < 80; s++) {
      expect(mintAmbitionsFromEvents(
        graph, CULPRIT, TICK, s,
        buildAmbitionAgentSnapshot(graph, CULPRIT), new Set(), new Map(),
      )).toBeNull();
    }
  });

  it('mints soft rebuild drives from the owner own abandoned undertaking', () => {
    const graph = makeWorld();
    createUndertakingOutcomeNode({
      graph, project: makeProject({ actorId: VICTIM }), harmClass: 'undertaking_abandoned',
      tick: TICK, victimAgentId: VICTIM, selfFacing: true,
    });

    const minted = firstMint(graph, VICTIM);
    expect(minted).not.toBeNull();
    const offered = new Set(
      (UNDERTAKING_MINTING_RULES.undertaking_abandoned.victim ?? []).map((e) => e.templateId),
    );
    expect(offered.has(minted!.templateId)).toBe(true);
    expect(minted!.grievance).toBeUndefined();
  });

  it('ignores a harm outside the lookback window', () => {
    const graph = makeWorld();
    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    })!;
    graph.getNode(nodeId)!.properties.tick = TICK - MINT_LOOKBACK_TICKS - 5;
    for (let s = 0; s < 40; s++) {
      expect(mintAmbitionsFromEvents(
        graph, VICTIM, TICK, s,
        buildAmbitionAgentSnapshot(graph, VICTIM), new Set(), new Map(),
      )).toBeNull();
    }
  });
});

/**
 * THR-1444 — a harm that outlives the place it was aimed at.
 *
 * `originLocationId` is a plain string stamped when the undertaking is created;
 * `WorldGraph.removeNode` cascades incident edges but cannot reach it. A settlement
 * retired mid-flight therefore left the origin dangling, and the old
 * `origin ?? actor position` chain never reached its fallback — a dangling string is
 * still truthy. `addEdge` threw into a `catch` that only warned, and the event landed
 * durably with **no site**. Nothing reads a `console.warn`, and the sweep that emitted
 * it printed `PASS`.
 *
 * These drive the real lane rather than asserting the guard's own return value: the
 * claim under test is *the harm is still witnessable*, and only a witness minting can
 * settle that. Each arm perturbs one input and confirms the perturbation applied.
 */
describe('an undertaking that outlives its origin location (THR-1444)', () => {
  const REFUGE = 'loc.refuge';

  /**
   * The origin is razed while the undertaking is in flight; the culprit has since
   * moved to `REFUGE`, where the bystander stands. Returns the world *after* the
   * removal, with the perturbation confirmed.
   */
  function makeWorldWithDeadOrigin(): WorldGraph {
    const graph = makeWorld();
    graph.addNode({ id: REFUGE, type: 'location', name: 'Refuge', properties: {} });

    // Move both the culprit and the witness off the doomed site, so the removal
    // cannot take their `located_at` edges with it.
    for (const actorId of [CULPRIT, BYSTANDER]) {
      graph.getOutgoingEdges(actorId, 'located_at').forEach((e) => graph.removeEdge(e.id));
      graph.addEdge({
        id: `${actorId}_loc_refuge`, source: actorId, target: REFUGE,
        type: 'located_at', properties: {},
      });
    }

    graph.removeNode(SITE);

    // Confirm the perturbation: the origin the project still names is gone, and the
    // culprit stands somewhere that is not.
    expect(graph.getNode(SITE)).toBeUndefined();
    expect(makeProject().originLocationId).toBe(SITE);
    expect(graph.getOutgoingEdges(CULPRIT, 'located_at')[0]?.target).toBe(REFUGE);
    return graph;
  }

  function traceFor(nodeProjectId: string) {
    return getTraces().find(
      (t): t is UndertakingOutcomeEventTrace =>
        t.category === 'undertaking_outcome_event' && t.projectId === nodeProjectId,
    );
  }

  beforeEach(() => {
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('stamps the harm where the actor actually stands, so a witness can still see it', () => {
    const graph = makeWorldWithDeadOrigin();
    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    })!;

    // The edge exists at all — this is the assertion that was false before the fix.
    expect(graph.getOutgoingEdges(nodeId, 'occurred_at')[0]?.target).toBe(REFUGE);

    // …and the point of the edge: somebody standing there can witness the harm. An
    // edge assertion alone would not distinguish a site from a *witnessable* site.
    const witnessIds = new Set(
      (UNDERTAKING_MINTING_RULES.property_destroyed.witness ?? []).map((e) => e.templateId),
    );
    let witnessed = false;
    for (let s = 0; s < 80; s++) {
      const minted = mintAmbitionsFromEvents(
        graph, BYSTANDER, TICK, s,
        buildAmbitionAgentSnapshot(graph, BYSTANDER), new Set(), new Map(),
      );
      if (minted && witnessIds.has(minted.templateId)) { witnessed = true; break; }
    }
    expect(witnessed).toBe(true);

    const trace = traceFor('proj_raze_1');
    expect(trace?.siteResolution).toBe('actor_position');
    expect(trace?.siteId).toBe(REFUGE);
    // The signal that used to be an unread console.warn.
    expect(trace?.siteOriginStale).toBe(true);
  });

  it('still prefers the undertaking own origin when that origin is alive', () => {
    const graph = makeWorld();
    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    })!;

    // The controlled arm: same lane, same project, one input un-perturbed. A razing
    // belongs to the place it happened, not to wherever the razer wandered next.
    expect(graph.getOutgoingEdges(nodeId, 'occurred_at')[0]?.target).toBe(SITE);
    const trace = traceFor('proj_raze_1');
    expect(trace?.siteResolution).toBe('origin');
    expect(trace?.siteOriginStale).toBeUndefined();
  });

  it('records a deliberately siteless harm rather than throwing, when nothing is left to point at', () => {
    const graph = makeWorldWithDeadOrigin();
    // Strip the last anchor too: the culprit is nowhere the graph knows about.
    graph.getOutgoingEdges(CULPRIT, 'located_at').forEach((e) => graph.removeEdge(e.id));
    expect(graph.getOutgoingEdges(CULPRIT, 'located_at')).toHaveLength(0);

    const nodeId = createUndertakingOutcomeNode({
      graph, project: makeProject(), harmClass: 'property_destroyed',
      tick: TICK, victimAgentId: VICTIM,
    });

    // Fail-soft (NFP #4): the event is still durably written and still names its
    // culprit — losing the site must not lose the record of who did it.
    expect(nodeId).toBeDefined();
    expect(graph.getNode(nodeId!)!.properties.culpritAgentId).toBe(CULPRIT);
    expect(graph.getOutgoingEdges(nodeId!, 'occurred_at')).toHaveLength(0);

    const trace = traceFor('proj_raze_1');
    expect(trace?.siteResolution).toBe('unresolved');
    expect(trace?.siteId).toBeUndefined();
    expect(trace?.siteOriginStale).toBe(true);
  });
});
