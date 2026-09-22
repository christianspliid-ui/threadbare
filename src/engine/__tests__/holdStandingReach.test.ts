// @vitest-lane heavy — builds a small world, claims a town on it, and drives it through the tick loop (THR-1448)
/**
 * THR-1448's Done-when on the world the writers actually make.
 *
 * `holdStanding.test.ts` proves the reading and its write on a fixture. This proves the
 * wiring on a world worldgen built: a real mortal claims a real town on a Realm's ground
 * through the world's own writer, the `2a.55` pass opens the standing with the Realm
 * the political map names, the keeper is supplied the town-keeper content and a
 * stranger in the same town is not, the decayed-*stranger* arm holds, the board term
 * spreads on the keeper's own standing, and collapsing the hold closes the standing
 * and leaves the membership.
 *
 * What is worldgen's and what is deliberate: who exists, where they stand, which
 * Realm claims which ground — worldgen's. The hold is made through `claimControl`
 * on a Location the mortal stands at, because a young world has claimed nothing.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime, ensureRealmProjection, type SimulationRuntime } from '../simulationRuntime';
import { claimControl } from '../strategicGraphOps';
import { cellTemplateId } from '../../data/undertaking-cells';
import { getStrategicTemplate } from '../strategicActionCandidates';
import { createHoldReader, groundRealmNodeId, heldTownAffinity } from '../holdStanding';
import { generateFactionQuestCandidates } from '../factionQuestGeneration';
import { filterByPrerequisites } from '../encounterFilterPipeline';
import { scoreUnifiedBoard } from '../decisionBoard';
import { findMembershipEdge } from '../factionMembership';
import { getFactionDefinition } from '../../data/faction-definition-lookup';
import { computeRankFromReputation } from '../../types/faction';
import { isPlaceNode, resolveToParentLocation, getLocationNodes } from '../sublocationShape';
import { isAgentGone } from '../groups/groupQueries';
import { isAutonomousDecisionActor } from '../strategicKindReachability';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import {
  HOLD_STANDING_REPUTATION_SEED,
  HELD_TOWN_AFFINITY_WEIGHT,
} from '../../data/strategic-action-constants';
import type { GameState } from '../../types/gameState';
import type { StrategicControlState } from '../../types/strategicAction';
import type { ScoredStrategicCandidate } from '../strategicActionScoring';
import type { EncounterCacheEntry } from '../encounterCache';
import type { MemberOfEdgeProperties } from '../../types/disposition';
import type { ReachDomain } from '../../types/traits';

const SEED = 42;
const WARMUP_TICKS = 20;
const PETITION = 'encounter.realm.keepers_petition';
const RECKONING = 'encounter.realm.crowns_reckoning';
const COURT = ['encounter.realm.court_summons', 'encounter.realm.border_levy', 'encounter.realm.tithe_demanded'];
/** Every arm here drives `runTick`; the THR-1517 rule: a derived ceiling, never the default. */
const TIMEOUT_MS = 120_000;

function world(): { state: GameState; runtime: SimulationRuntime } {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, SEED)[0];
  let { state } = initializeGameState(archetype, 'Keepers', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  for (let i = 0; i < WARMUP_TICKS; i++) state = runTick(state, [], runtime);
  return { state, runtime };
}

function standsAt(s: GameState, actorId: string): string | undefined {
  const at = s.graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  const node = at ? s.graph.getNode(at) : undefined;
  if (!node) return undefined;
  return isPlaceNode(node) ? (resolveToParentLocation(s.graph, node)?.id ?? undefined) : node.id;
}

function holdersOf(s: GameState, nodeId: string): string[] {
  return [...s.graph.getIncomingEdges(nodeId, 'controls'), ...s.graph.getIncomingEdges(nodeId, 'owns')].map(e => e.source);
}

/**
 * A living mortal standing at an unheld Location whose ground a Realm claims. A
 * *deciding* mortal (spotlight, runs the board) is preferred so the reported
 * distribution below has boards to read; any mortal will do for the rest.
 */
function pickKeeperOnRealmGround(s: GameState, runtime: SimulationRuntime): { keeper: string; town: string; realm: string } {
  const projection = ensureRealmProjection(runtime, s.graph, s.tiles, s.tick);
  let fallback: { keeper: string; town: string; realm: string } | null = null;
  for (const m of s.graph.getNodesByType('actor')) {
    if (m.properties.actorType !== 'individual' || isAgentGone(m)) continue;
    if (m.id === s.ascendantId) continue;
    const at = standsAt(s, m.id);
    if (!at || holdersOf(s, at).length > 0) continue;
    const realm = groundRealmNodeId(s.graph, projection, at);
    if (!realm) continue;
    // Not already a member of that Realm — we want to see the membership minted.
    if (findMembershipEdge(s.graph, m.id, realm)) continue;
    const pick = { keeper: m.id, town: at, realm };
    if (isAutonomousDecisionActor(m)) return pick;
    fallback ??= pick;
  }
  if (fallback) return fallback;
  throw new Error('no mortal standing at an unheld town on a Realm\'s ground in the small world — the fixture is wrong, not the engine');
}

function anotherMortal(s: GameState, notId: string): string {
  for (const m of s.graph.getNodesByType('actor')) {
    if (m.properties.actorType !== 'individual' || isAgentGone(m) || m.id === notId || m.id === s.ascendantId) continue;
    return m.id;
  }
  throw new Error('no second mortal');
}

function stanceOn(actorId: string, locationId: string, tick: number): StrategicControlState {
  return {
    controlId: `ctrl_${actorId}_${locationId}`, actorId,
    templateId: cellTemplateId('control:claim', 'location'), ambitionId: 'ambition_reach_test',
    targetNodeId: locationId, verb: 'control', behaviorFamily: 'merchant-expansion',
    establishedTick: tick, neglectTicks: 0, active: true, degradation: 0,
  };
}

function useCell(actorId: string, targetNodeId: string, index: number): ScoredStrategicCandidate {
  const templateId = cellTemplateId('use', 'location');
  return {
    candidateId: `cand_${index}`, templateId, ambitionId: 'ambition_reach_test', actorId,
    verb: getStrategicTemplate(templateId)!.verb, executionMode: 'instant', behaviorFamily: 'merchant-expansion',
    displayName: 'hold court', targetNodeId, objectTypeId: 'location', objectHandle: { kind: 'node', nodeId: targetNodeId },
    scoreComponents: { ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0, catalystValue: 0, roleFit: 0, travelPenalty: 0, varietyPenalty: 0 },
    finalScore: 1, generationReason: 'ambition_progression',
  };
}

function entry(templateId: string, locationId: string): EncounterCacheEntry {
  return {
    templateId, locationId, sublocationId: null, sublocationTypeId: null,
    reachPrimary: 'heart' as ReachDomain, reachSecondary: 'gold' as ReachDomain, threatRating: 'trivial',
    encounterType: 'social', motivations: [], requiresPresence: false, remotePenalty: 0, questPriority: 3,
    isQuestEncounter: false, totalTickCost: 2, successRewardEstimate: 0.04, stepCount: 2,
    stepDifficulties: [0.35, 0.4], stepReaches: ['heart' as ReachDomain, 'gold' as ReachDomain],
  };
}

type LifecycleTrace = { category: string; event: string; realmNodeId?: string; membershipMinted?: boolean; actorId: string; targetNodeId: string };
const lifecycle = () => getTraces().filter(t => t.category === 'strategic_control_lifecycle') as unknown as LifecycleTrace[];

describe('THR-1448 — a held town is a faction position, on a generated world', () => {
  it('claim → position_opened with the ground’s Realm → keeper supplied, stranger not → decayed arm → board spread → collapse closes, membership stays', () => {
    const built = world();
    let state = built.state;
    const rt = built.runtime;

    const { keeper, town, realm } = pickKeeperOnRealmGround(state, rt);
    const realmDefId = state.graph.getNode(realm)!.properties.factionDefId as string;
    expect(getFactionDefinition(realmDefId), 'the Realm resolves to a per-world definition').toBeDefined();

    // ── Claim through the world's own writer, the way the cell does ──
    expect(claimControl(state.graph, keeper, town, state.tick).success).toBe(true);
    const stance = stanceOn(keeper, town, state.tick);
    state = {
      ...state,
      strategicState: {
        ...(state.strategicState ?? { projects: [], controls: [], history: [] }),
        controls: [...(state.strategicState?.controls ?? []), stance],
      },
    };

    // ── One tick: 2a.55 opens the standing ──
    enableTracing();
    clearTraces();
    state = runTick(state, [], rt);

    const opened = lifecycle().filter(t => t.event === 'position_opened' && t.actorId === keeper);
    expect(opened, 'position_opened traced for the keeper').toHaveLength(1);
    expect(opened[0].realmNodeId).toBe(realm);
    expect(opened[0].membershipMinted).toBe(true);
    expect(rt.holdStandings.get(stance.controlId)).toEqual({ actorId: keeper, targetNodeId: town, realmNodeId: realm });

    const edge = findMembershipEdge(state.graph, keeper, realm);
    expect(edge, 'the membership the hold opened').toBeDefined();
    const props = edge!.properties as Partial<MemberOfEdgeProperties>;
    expect(props.reputation).toBe(HOLD_STANDING_REPUTATION_SEED);
    expect(props.rank).toBe(0); // never written by this plan
    expect(computeRankFromReputation(props.reputation!, getFactionDefinition(realmDefId)!).id).toBe('subject');

    const keeperName = state.graph.getNode(keeper)!.name;
    const townName = state.graph.getNode(town)!.name;
    expect(state.tickEvents.some(e => e.message === `${keeperName} keeps ${townName} for ${state.graph.getNode(realm)!.name}`),
      'the chronicle line').toBe(true);

    // ── The keeper is supplied the town-keeper rows; a stranger in the world is not ──
    const reader = () => createHoldReader(
      state.graph, state.strategicState?.controls,
      () => ensureRealmProjection(rt, state.graph, state.tiles, state.tick),
    );
    const supplied = generateFactionQuestCandidates(state.graph, keeper, town, state.tick, reader()).map(c => c.templateId);
    expect(supplied).toContain(PETITION);
    expect(supplied).toContain(RECKONING);
    for (const court of COURT) expect(supplied, `${court} at subject`).toContain(court);

    const stranger = anotherMortal(state, keeper);
    const strangerSupplied = generateFactionQuestCandidates(state.graph, stranger, town, state.tick, reader()).map(c => c.templateId);
    expect(strangerSupplied).not.toContain(PETITION);
    expect(strangerSupplied).not.toContain(RECKONING);

    const entries = [entry(PETITION, town), entry(RECKONING, town)];
    expect(filterByPrerequisites(entries, keeper, state.graph, reader()).map(e => e.templateId)).toEqual([PETITION, RECKONING]);
    expect(filterByPrerequisites(entries, stranger, state.graph, reader())).toHaveLength(0);

    // ── The decayed-stranger arm, falsified: drop the keeper below subject ──
    const subjectFloor = getFactionDefinition(realmDefId)!.rankTiers.find(t => t.id === 'subject')!.minReputation;
    state.graph.updateEdge(edge!.id, { properties: { ...edge!.properties, reputation: subjectFloor / 2 } });
    const decayed = generateFactionQuestCandidates(state.graph, keeper, town, state.tick, reader()).map(c => c.templateId);
    expect(decayed).toContain(PETITION);
    expect(decayed).toContain(RECKONING);
    for (const court of COURT) expect(decayed, `${court} must stop at stranger`).not.toContain(court);
    state.graph.updateEdge(edge!.id, { properties: { ...edge!.properties, reputation: HOLD_STANDING_REPUTATION_SEED } });

    // ── The board term, on the keeper's real standing: not vacuous ──
    const standing = reader().standingFor(keeper);
    expect(standing?.realmNodeId).toBe(realm);
    const otherTown = getLocationNodes(state.graph).find(l => l.id !== town && heldTownAffinity(standing, l.id) === 0)!.id;
    const board = scoreUnifiedBoard({
      graph: state.graph, agentId: keeper, tick: state.tick, encounterCandidates: [],
      strategicCandidates: [useCell(keeper, town, 0), useCell(keeper, otherTown, 1)],
      holdStanding: standing,
    });
    const held = board.entries.find(e => e.candidateIndex === 0)!;
    const away = board.entries.find(e => e.candidateIndex === 1)!;
    expect(held.heldTownAffinity).toBe(1);
    expect(away.heldTownAffinity).toBe(0);
    expect(held.temperamentWeight - away.temperamentWeight).toBeCloseTo(HELD_TOWN_AFFINITY_WEIGHT, 10);

    // Reported, not gated: how the term distributed across the keeper's live boards.
    clearTraces();
    for (let i = 0; i < 10; i++) state = runTick(state, [], rt);
    const boards = getTraces().filter(t => t.category === 'decision_board_comparison' && (t as { agentId?: string }).agentId === keeper) as unknown as
      Array<{ boardTop: Array<{ family: string; heldTownAffinity?: number }> }>;
    const seen = boards.flatMap(b => b.boardTop.filter(e => e.family === 'strategic_action').map(e => e.heldTownAffinity ?? 0));
    console.info(`[THR-1448] keeper ${keeperName}: ${boards.length} boards, strategic entries ${seen.length}, heldTownAffinity values ${JSON.stringify([...new Set(seen)])}`);
    for (const b of boards) for (const e of b.boardTop) if (e.family === 'strategic_action') expect(typeof e.heldTownAffinity).toBe('number');

    // ── Collapse the hold: the standing closes, the membership stays ──
    const live = state.strategicState!.controls.find(c => c.controlId === stance.controlId);
    expect(live, 'the stance survived the ten ticks (grace is ten)').toBeDefined();
    state = {
      ...state,
      strategicState: {
        ...state.strategicState!,
        controls: state.strategicState!.controls.map(c => c.controlId === stance.controlId ? { ...c, active: false } : c),
      },
    };
    clearTraces();
    state = runTick(state, [], rt);

    const closed = lifecycle().filter(t => t.event === 'position_closed' && t.actorId === keeper);
    expect(closed).toHaveLength(1);
    expect(closed[0].realmNodeId).toBe(realm);
    expect(rt.holdStandings.has(stance.controlId)).toBe(false);
    expect(findMembershipEdge(state.graph, keeper, realm), 'the court remembers its keeper').toBeDefined();
    expect(reader().standingFor(keeper)).toBeNull();

    disableTracing();
  }, TIMEOUT_MS);
});
