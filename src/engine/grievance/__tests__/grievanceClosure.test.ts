/**
 * How a grievance ends — THR-1298 slice 6.
 *
 * Slice 5 proved a vendetta opens, holds one slot, and cools. This file proves it can
 * be *closed*: satisfied when the culprit dies or when the undertaking pursued under it
 * completes, settled by a third party, and — the half that decides whether the loop
 * terminates at all — suppressed from minting a counter-vendetta in the party who was
 * answered.
 *
 * Every refusal is paired with the arm that does fire, on the same fixture with one
 * field changed, because a "no grievance was written" assertion passes just as happily
 * against a condition nobody evaluates or a fixture too impoverished to mint at all.
 * The suppression suite additionally searches for a seed at which its fixture mints
 * *anything*, and fails if it finds none: minting is gated on a seeded base chance, so
 * both arms would otherwise agree on a world where nothing was ever going to mint.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { AmbitionTemplate, ActiveAmbition } from '../../../types/ambition';
import { evaluateGraphCondition } from '../../graphConditions';
import { evaluateAmbitionProgress } from '../../ambitionLifecycle';
import {
  findGrievanceForAmbitionTemplate,
  grievanceHeat01,
  satisfyGrievance,
  settleGrievance,
  findActiveGrievanceEdge,
} from '../grievanceLifecycle';
import { computeTemperamentWeight } from '../../decisionBoard';
import {
  buildAmbitionAgentSnapshot,
  mintAmbitionsFromEvents,
  resetAmbitionEventCounter,
} from '../../ambitionTick';
import { createUndertakingOutcomeNode } from '../undertakingOutcomeNode';
import { advanceStrategicProjects } from '../../strategicActionLifecycle';
import { mulberry32 } from '../../../lib/prng';
import {
  GRIEVANCE_OVERSHOOT_RATIO,
  GRIEVANCE_URGENCY_WEIGHT,
  GRIEVANCE_HEAT_INITIAL_MAX,
} from '../../../data/grievance-constants';
import { HARM_MAGNITUDE_BY_CLASS } from '../../../data/ambition-minting-rules';
import type { StrategicProjectRuntime } from '../../../types/strategicAction';

const VICTIM = 'actor.victim';
const CULPRIT = 'actor.culprit';
const SITE = 'loc.dunmar';
const REVENGE_NODE = 'ambition.ambition_seek_revenge';
const REVENGE_TEMPLATE = 'ambition_seek_revenge';

function addActor(graph: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  graph.addNode({
    id,
    name: id,
    type: 'actor',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      // All eight reaches, comfortably above every `reachFloors` in the pools this
      // suite draws from. A capability sheet with holes in it would make eligibility
      // the reason a template did not mint, and this suite is not about eligibility.
      domainCapabilities: {
        iron: 0.5, shadow: 0.5, eye: 0.5, gold: 0.5,
        heart: 0.5, stone: 0.5, star: 0.5, veil: 0.5,
      },
      ...props,
    },
  });
}

/** A victim holding an active vendetta against a living culprit, plus the site. */
function grievanceWorld(magnitude = 0.8, heat = GRIEVANCE_HEAT_INITIAL_MAX): WorldGraph {
  const graph = new WorldGraph();
  addActor(graph, VICTIM);
  addActor(graph, CULPRIT);
  graph.addNode({
    id: SITE,
    name: 'Dunmar',
    type: 'location',
    properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 },
  });
  graph.addNode({
    id: REVENGE_NODE,
    name: 'Seek Revenge',
    type: 'ambition',
    properties: { templateId: REVENGE_TEMPLATE },
  });
  graph.addEdge({
    id: `pursues_${VICTIM}_${REVENGE_NODE}`,
    source: VICTIM,
    target: REVENGE_NODE,
    type: 'pursues',
    properties: {
      priority: 'primary',
      status: 'active',
      assignedTick: 0,
      completedMilestones: [],
      grievance: true,
      culpritAgentId: CULPRIT,
      harmMagnitude: magnitude,
      chainDepth: 0,
      heat,
    },
  });
  return graph;
}

function kill(graph: WorldGraph, id: string): void {
  graph.updateNode(id, {
    properties: { ...graph.getNode(id)!.properties, deceased: true },
  });
}

// ─── Satisfaction door (b): the culprit dies ─────────────────────

describe('grievance_culprit_eliminated — the bindable satisfaction condition', () => {
  it('is satisfied when the culprit named by THIS edge is dead', () => {
    const graph = grievanceWorld();
    kill(graph, CULPRIT);
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;

    expect(evaluateGraphCondition(
      { type: 'grievance_culprit_eliminated' },
      graph,
      VICTIM,
      { pursuesProperties: edge.properties },
    )).toBe(true);
  });

  it('is not satisfied while that culprit lives — the one field that differs', () => {
    const graph = grievanceWorld(); // culprit alive; nothing else changed
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;

    expect(evaluateGraphCondition(
      { type: 'grievance_culprit_eliminated' },
      graph,
      VICTIM,
      { pursuesProperties: edge.properties },
    )).toBe(false);
  });

  it('reads the edge, not the agent: a dead culprit with no edge context is not evidence', () => {
    // The falsification that matters for THR-812's failure class. If the condition
    // resolved its target any other way — an authored `$`-ref, the agent's own node —
    // this arm would pass with the culprit dead and the binding absent, which is
    // exactly the auto-complete the old `target_agent_eliminated` shipped.
    const graph = grievanceWorld();
    kill(graph, CULPRIT);

    expect(evaluateGraphCondition(
      { type: 'grievance_culprit_eliminated' }, graph, VICTIM, undefined,
    )).toBe(false);
    expect(evaluateGraphCondition(
      { type: 'grievance_culprit_eliminated' }, graph, VICTIM, { pursuesProperties: {} },
    )).toBe(false);
  });

  it('is not satisfied when the culprit id names a node that is gone', () => {
    const graph = grievanceWorld();
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;
    graph.removeNode(CULPRIT);

    // Absence is not death. A vendetta against somebody the graph forgot must not
    // close itself — that is the missing-node auto-complete, one layer down.
    expect(evaluateGraphCondition(
      { type: 'grievance_culprit_eliminated' },
      graph,
      VICTIM,
      { pursuesProperties: edge.properties },
    )).toBe(false);
  });
});

describe('the condition reaches ambition evaluation through the pursues edge', () => {
  const template: AmbitionTemplate = {
    id: 'test_vendetta',
    displayName: 'Test Vendetta',
    category: 'vengeance',
    reachFloors: {},
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: [],
    bondModifiers: [],
    boostingTraits: [],
    reachAffinity: {},
    milestones: [
      {
        id: 'answered',
        condition: { type: 'grievance_culprit_eliminated' },
        prose: ['Done.'],
      },
    ],
    completion: { requires: 1, of: 1 },
    abandonmentTriggers: [],
    abandonmentCooldown: 10,
    selectionProse: ['x'],
    milestoneProse: { answered: ['x'] },
    completionProse: ['x'],
    abandonmentProse: ['x'],
  };

  const active: ActiveAmbition = {
    templateId: 'test_vendetta',
    priority: 'primary',
    status: 'active',
    assignedTick: 0,
    completedMilestones: [],
  };

  it('completes the ambition once the culprit dies', () => {
    const graph = grievanceWorld();
    kill(graph, CULPRIT);
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;

    const result = evaluateAmbitionProgress(
      template, active, graph, VICTIM, 30, edge.properties,
    );
    expect(result.status).toBe('completed');
    expect(result.newMilestones).toContain('answered');
  });

  it('leaves it active while the culprit lives', () => {
    const graph = grievanceWorld();
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;

    const result = evaluateAmbitionProgress(
      template, active, graph, VICTIM, 30, edge.properties,
    );
    expect(result.status).toBe('active');
    expect(result.newMilestones).toEqual([]);
  });

  it('leaves it active when the caller passes no edge — the wiring is load-bearing', () => {
    // The guard against the defect this signature change exists to prevent: if
    // `phaseAmbitionProgress` ever stops handing over `edge.properties`, the milestone
    // silently becomes unreachable and every vendetta runs to the cooling threshold.
    const graph = grievanceWorld();
    kill(graph, CULPRIT);

    const result = evaluateAmbitionProgress(template, active, graph, VICTIM, 30);
    expect(result.status).toBe('active');
  });
});

// ─── Closing the account ─────────────────────────────────────────

describe('satisfaction and settlement close the edge without leaving a grudge', () => {
  it('satisfyGrievance closes as completed, not abandoned', () => {
    const graph = grievanceWorld();
    const edge = findActiveGrievanceEdge(graph, VICTIM)!;

    satisfyGrievance(graph, edge, VICTIM, 40, 'answered by test');

    const closed = graph.getOutgoingEdges(VICTIM, 'pursues')[0]!;
    expect(closed.properties.status).toBe('completed');
    expect(closed.properties.resolvedTick).toBe(40);
    // The block survives the close — a provenance read still answers "because of whom".
    expect(closed.properties.culpritAgentId).toBe(CULPRIT);
    // No hostility manufactured by the closing itself: a successful revenge that left
    // the pair more hostile than the harm did could never end a chain.
    expect(graph.getOutgoingEdges(VICTIM, 'hostile_to')).toHaveLength(0);
    expect(findActiveGrievanceEdge(graph, VICTIM)).toBeUndefined();
  });

  it('settleGrievance closes the account it was paid for', () => {
    const graph = grievanceWorld();

    expect(settleGrievance(graph, VICTIM, CULPRIT, 'restitution', 50)).toBe(true);
    const closed = graph.getOutgoingEdges(VICTIM, 'pursues')[0]!;
    expect(closed.properties.status).toBe('completed');
    expect(closed.properties.settledBy).toBe('restitution');
  });

  it('refuses to settle a debt owed to somebody else', () => {
    const graph = grievanceWorld();
    addActor(graph, 'actor.stranger');

    // One field changed from the arm above: who is paying.
    expect(settleGrievance(graph, VICTIM, 'actor.stranger', 'restitution', 50)).toBe(false);
    expect(findActiveGrievanceEdge(graph, VICTIM)).toBeDefined();
  });
});

// ─── Board urgency ───────────────────────────────────────────────

describe('the board urgency term', () => {
  it('adds the full weight at maximum heat and nothing at zero', () => {
    const cold = computeTemperamentWeight(undefined, 'iron', false, 0);
    const hot = computeTemperamentWeight(undefined, 'iron', false, 1);
    expect(hot - cold).toBeCloseTo(GRIEVANCE_URGENCY_WEIGHT, 10);
    // The default must be the absent signal, or every ordinary candidate would inherit
    // a vendetta's urgency the moment the parameter was added.
    expect(computeTemperamentWeight(undefined, 'iron', false)).toBeCloseTo(cold, 10);
  });

  it('scales with the decay curve rather than switching on', () => {
    const half = computeTemperamentWeight(undefined, 'iron', false, 0.5);
    const cold = computeTemperamentWeight(undefined, 'iron', false, 0);
    expect(half - cold).toBeCloseTo(GRIEVANCE_URGENCY_WEIGHT * 0.5, 10);
  });

  it('resolves heat only for a candidate pursuing THAT grievance', () => {
    const graph = grievanceWorld(0.8, 0.6);

    const matching = findGrievanceForAmbitionTemplate(graph, VICTIM, REVENGE_TEMPLATE);
    expect(grievanceHeat01(matching)).toBeCloseTo(0.6, 10);

    // Same agent, same standing vendetta, a candidate serving a different ambition.
    // Without this the vendetta's urgency would boost everything the agent might do,
    // which is a hot-headed agent rather than a hot grievance.
    const other = findGrievanceForAmbitionTemplate(graph, VICTIM, 'ambition_dominate_trade');
    expect(other).toBeUndefined();
    expect(grievanceHeat01(other)).toBe(0);
  });

  it('reads zero from an agent with no grievance and from a malformed heat', () => {
    const graph = grievanceWorld();
    addActor(graph, 'actor.calm');
    expect(grievanceHeat01(
      findGrievanceForAmbitionTemplate(graph, 'actor.calm', REVENGE_TEMPLATE),
    )).toBe(0);

    const edge = findActiveGrievanceEdge(graph, VICTIM)!;
    graph.updateEdge(edge.id, {
      properties: { ...edge.properties, heat: Number.NaN },
    });
    expect(grievanceHeat01(findActiveGrievanceEdge(graph, VICTIM))).toBe(0);
  });
});

// ─── Satisfaction door (a): the answering undertaking completes ───

describe('an undertaking pursued under a grievance answers it on completion', () => {
  function completingProject(ambitionId: string): StrategicProjectRuntime {
    return {
      projectId: 'proj_answer',
      actorId: VICTIM,
      // A multi-tick harm verb: the completion terminal is the seam under test, and an
      // `instant` template never reaches it.
      templateId: 'strategic_raze_settlement',
      ambitionId,
      verb: 'destroy',
      behaviorFamily: 'warlord-expansion',
      targetNodeId: SITE,
      originLocationId: SITE,
      progress: 7,
      progressRequired: 8,
      startedTick: 2,
      lastProgressTick: 9,
      status: 'active',
    };
  }

  function stateFor(
    graph: WorldGraph, project: StrategicProjectRuntime, seed: number,
  ): GameState {
    return {
      cycle: 1, tick: 10, phase: 'playing', seed, graph,
      cosmology: { spheres: {} } as never, tiles: [], clock: { currentTick: 10 } as never,
      ascendantId: 'ascendant', ascendantIdentity: null, essencePool: {} as never,
      mandateDefinition: null, mandateState: null,
      rivalDefinitions: [], rivalStates: [],
      doomDefinition: {} as never, doomClock: {} as never,
      tickEvents: [], recentEvents: [], chronicleEntries: [], stealthExposure: 0,
      visibilityMap: new Map() as never, familiarityMap: new Map() as never,
      culturalInsightMap: new Map(), agentKnowledge: new Map(),
      encounterProgress: [], actionsInProgress: [], unifiedActions: [],
      worldSoul: {} as never, echoDefinitions: [], echoStates: [],
      chronicle: {} as never,
      strategicState: { projects: [project], controls: [], history: [] },
    } as unknown as GameState;
  }

  /** Every `evt_und_` node the run wrote. */
  function outcomeNodes(graph: WorldGraph) {
    return graph.getNodesByType('event')
      .filter(n => n.properties.eventType === 'undertaking_outcome');
  }

  function runAt(ambitionId: string, seed: number) {
    const graph = grievanceWorld(0.8);
    const state = stateFor(graph, completingProject(ambitionId), seed);
    const result = advanceStrategicProjects(state, graph, 10, mulberry32(42));
    return { graph, status: result.strategicState.projects[0]!.status };
  }

  /**
   * The world seed at which this fixture's final checkpoint actually lands.
   *
   * The checkpoint rolls off the *state* seed, not the rng handed to
   * `advanceStrategicProjects`, and a halted undertaking never reaches the terminal
   * this suite is about — so both arms would agree on a world where nothing completed.
   * Searched on the arm with no grievance in play, so the seed cannot be one chosen to
   * flatter the rule under test.
   */
  const COMPLETING_SEED = (() => {
    for (let s = 1; s <= 200; s++) {
      if (runAt('ambition_dominate_trade', s * 977).status === 'completed') return s * 977;
    }
    return undefined;
  })();

  it('the fixture actually completes at the searched seed', () => {
    expect(COMPLETING_SEED, 'no seed completes this undertaking — the suite would be vacuous')
      .toBeDefined();
  });

  it('closes the grievance and stamps the answer on the outcome node', () => {
    const { graph, status } = runAt(REVENGE_TEMPLATE, COMPLETING_SEED!);
    expect(status).toBe('completed');

    expect(findActiveGrievanceEdge(graph, VICTIM)).toBeUndefined();
    expect(graph.getOutgoingEdges(VICTIM, 'pursues')[0]!.properties.status).toBe('completed');

    const node = outcomeNodes(graph)[0];
    expect(node).toBeDefined();
    expect(node!.properties.answersGrievance).toBe(true);
    expect(node!.properties.answeredMagnitude).toBe(0.8);
    // An answer sits one link further down than the harm it answered.
    expect(node!.properties.chainDepth).toBe(1);
  });

  it('leaves an unrelated undertaking alone — one field changed: the ambition', () => {
    const { graph, status } = runAt('ambition_dominate_trade', COMPLETING_SEED!);
    expect(status).toBe('completed');

    // The vendetta stands: completing something else is not answering it.
    expect(findActiveGrievanceEdge(graph, VICTIM)).toBeDefined();
    const node = outcomeNodes(graph)[0];
    expect(node).toBeDefined();
    expect(node!.properties.answersGrievance).toBeUndefined();
    expect(node!.properties.chainDepth).toBe(0);
  });
});

// ─── Counter-mint suppression ────────────────────────────────────

describe('an answered party does not mint a counter-vendetta', () => {
  beforeEach(() => resetAmbitionEventCounter());

  const TICK = 100;

  /**
   * A world where CULPRIT has just been harmed by VICTIM's reprisal.
   *
   * `answeredMagnitude` is what the reprisal was answering; the reprisal's own harm
   * magnitude comes from its class, so `harmClass` is what makes it proportionate or
   * excessive.
   */
  function reprisalWorld(answeredMagnitude: number): WorldGraph {
    const graph = new WorldGraph();
    addActor(graph, VICTIM);
    addActor(graph, CULPRIT);
    graph.addNode({
      id: SITE,
      name: 'Dunmar',
      type: 'location',
      properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 },
    });
    graph.addEdge({
      id: `${CULPRIT}_located_at_${SITE}`,
      source: CULPRIT, target: SITE, type: 'located_at', properties: {},
    });

    const project: StrategicProjectRuntime = {
      projectId: 'proj_reprisal',
      actorId: VICTIM,
      templateId: 'strategic_raze_settlement',
      ambitionId: REVENGE_TEMPLATE,
      verb: 'destroy',
      behaviorFamily: 'warlord-expansion',
      targetNodeId: SITE,
      originLocationId: SITE,
      progress: 8,
      progressRequired: 8,
      startedTick: TICK - 10,
      lastProgressTick: TICK,
      status: 'completed',
    };

    createUndertakingOutcomeNode({
      graph,
      project,
      // 0.8 — enough to overshoot a 0.5 answer, not enough to overshoot a 0.8 one.
      harmClass: 'property_destroyed',
      tick: TICK,
      victimAgentId: CULPRIT,
      answersGrievance: true,
      answeredMagnitude,
      chainDepth: 1,
    });
    return graph;
  }

  /** What the mint lane offers this actor, driven through the real funnel. */
  function mintFor(graph: WorldGraph, actorId: string, seed: number) {
    return mintAmbitionsFromEvents(
      graph,
      actorId,
      TICK,
      seed,
      buildAmbitionAgentSnapshot(graph, actorId),
      new Set<string>(),
      new Map<string, number>(),
    );
  }

  it('mints when the answer overshot, and mints nothing when it was proportionate', () => {
    const reprisalMagnitude = HARM_MAGNITUDE_BY_CLASS.property_destroyed;

    // The two arms differ in ONE number — what the reprisal was answering.
    const overshotAnswer = 0.5;   // 0.8 > 0.5 × 1.5 = 0.75 ⇒ the chain re-opens
    const proportionate = 0.8;    // 0.8 ≤ 0.8 × 1.5 = 1.2  ⇒ suppressed
    expect(reprisalMagnitude > overshotAnswer * GRIEVANCE_OVERSHOOT_RATIO).toBe(true);
    expect(reprisalMagnitude > proportionate * GRIEVANCE_OVERSHOOT_RATIO).toBe(false);

    // Minting is gated on a seeded base chance, so a fixture that never mints would
    // make both arms agree for the wrong reason. Find a seed where the overshoot arm
    // genuinely mints; if none exists the fixture is the problem, not the rule.
    let workingSeed: number | undefined;
    for (let s = 1; s <= 200 && workingSeed === undefined; s++) {
      if (mintFor(reprisalWorld(overshotAnswer), CULPRIT, s)) workingSeed = s;
    }
    expect(workingSeed, 'no seed mints from the overshoot arm — fixture cannot prove the rule')
      .toBeDefined();

    const overshot = mintFor(reprisalWorld(overshotAnswer), CULPRIT, workingSeed!);
    expect(overshot).not.toBeNull();
    // The re-opened link is a real vendetta, not a soft drive.
    expect(overshot!.grievance?.culpritAgentId).toBe(VICTIM);

    // Same seed, same world, one number different.
    expect(mintFor(reprisalWorld(proportionate), CULPRIT, workingSeed!)).toBeNull();
  });

  it('suppresses only the answered party — a witness still gets their own drives', () => {
    // A harm that answers nothing suppresses nothing: the flag, not the relation, is
    // what the rule keys on, and a world where every reprisal silenced its witnesses
    // would be a quieter one than the design asks for.
    const witnessId = 'actor.witness';
    const withWitness = (answered: number): WorldGraph => {
      const graph = reprisalWorld(answered);
      addActor(graph, witnessId);
      graph.addEdge({
        id: `${witnessId}_located_at_${SITE}`,
        source: witnessId, target: SITE, type: 'located_at', properties: {},
      });
      return graph;
    };

    let workingSeed: number | undefined;
    for (let s = 1; s <= 200 && workingSeed === undefined; s++) {
      if (mintFor(withWitness(0.8), witnessId, s)) workingSeed = s;
    }
    expect(workingSeed, 'no seed mints for the witness — fixture cannot prove the scope')
      .toBeDefined();

    // 0.8 answered: the reprisal is proportionate, so the *answered party* is silenced
    // on this very node — and the witness beside them is not.
    const graph = withWitness(0.8);
    expect(mintFor(graph, CULPRIT, workingSeed!)).toBeNull();

    const witnessMinted = mintFor(graph, witnessId, workingSeed!);
    expect(witnessMinted).not.toBeNull();
    // A witness never inherits somebody else's revenge — a drive, never a vendetta.
    expect(witnessMinted!.grievance).toBeUndefined();
  });
});
