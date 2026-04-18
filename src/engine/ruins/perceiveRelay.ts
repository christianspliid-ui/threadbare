/**
 * Perceive & Relay divine action resolution — PR 3 of the Ruins Layer (THR-151).
 *
 * Implements resolution for 7 divine actions:
 *   Perceive family (hex-targeted, narrativeLayer: 'ruins'):
 *     divine.perceive.cast_attention      — spawn vague clue at hex
 *     divine.perceive.refine_the_hush     — upgrade vague → narrowed
 *     divine.perceive.listen_for_a_name   — reveal originCultureId, narrowed clue
 *     divine.perceive.read_the_threads    — reveal Place of Power (if present)
 *     divine.perceive.taste_the_wake      — surface rival divine_mark secrets
 *
 *   Relay family (agent-targeted):
 *     divine.relay.compose_a_clue         — deposit clue on bonded agent + mark
 *     divine.relay.whisper_the_direction  — override agent's movement destination
 *
 * All actions are fail-soft: any missing data emits a trace and returns without
 * crashing the tick loop.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { KnowsClueOfEdgeProperties } from '../../types/knowledge';
import type { KnowsSecretOfEdgeProperties } from '../../types/secretsFavors';
import type { MovementState } from '../../types/movement';
import { emitTrace } from '../traceBuffer';
import { hexDistance } from '../../lib/hexMath';
import { produceClueConsequence, findAnyRuinId } from './clueLifecycle';

// Hex distance within which a bonded agent satisfies the adjacency gate.
const ADJACENCY_GATE_HEX_RADIUS = 1;

/** The 7 template IDs handled by this module */
export const PERCEIVE_RELAY_TEMPLATE_IDS = new Set([
  'divine.perceive.cast_attention',
  'divine.perceive.refine_the_hush',
  'divine.perceive.listen_for_a_name',
  'divine.perceive.read_the_threads',
  'divine.perceive.taste_the_wake',
  'divine.relay.compose_a_clue',
  'divine.relay.whisper_the_direction',
]);

// ─── Internal helpers ──────────────────────────────────────────────────────────

/** Resolve an agent's hex coordinates from their located_at edge chain. */
function resolveAgentHex(
  agentId: string,
  graph: WorldGraph,
): { col: number; row: number } | null {
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (!locEdges.length) return null;

  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return null;

  const lp = locNode.properties as Record<string, unknown>;
  const col = lp.hexCol as number | undefined;
  const row = lp.hexRow as number | undefined;
  if (col != null && row != null) return { col, row };

  // Sublocation: walk up to parent location
  const parentId = lp.parentLocationId as string | undefined;
  if (!parentId) return null;
  const parentNode = graph.getNode(parentId);
  if (!parentNode) return null;
  const pp = parentNode.properties as Record<string, unknown>;
  const pc = pp.hexCol as number | undefined;
  const pr = pp.hexRow as number | undefined;
  return pc != null && pr != null ? { col: pc, row: pr } : null;
}

/** Returns IDs of bonded agents (thread edges from ascendant) within hexRadius of (col, row). */
function bondedAgentsNearHex(
  col: number,
  row: number,
  ascendantId: string,
  hexRadius: number,
  graph: WorldGraph,
): string[] {
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  const result: string[] = [];

  for (const edge of threadEdges) {
    const agentHex = resolveAgentHex(edge.target, graph);
    if (!agentHex) continue;
    if (hexDistance({ col: agentHex.col, row: agentHex.row }, { col, row }) <= hexRadius) {
      result.push(edge.target);
    }
  }
  return result;
}

/** All location nodes on a given hex that have a ruinMagnitude property. */
function ruinsOnHex(col: number, row: number, graph: WorldGraph): string[] {
  return graph.getNodesByType('location')
    .filter(n => {
      const p = n.properties as Record<string, unknown>;
      return p.hexCol === col && p.hexRow === row && typeof p.ruinMagnitude === 'number';
    })
    .map(n => n.id);
}

/** All location nodes on a hex that are Places of Power. */
function placesOfPowerOnHex(col: number, row: number, graph: WorldGraph): string[] {
  return graph.getNodesByType('location')
    .filter(n => {
      const p = n.properties as Record<string, unknown>;
      return p.hexCol === col && p.hexRow === row && p.isPlaceOfPower === true;
    })
    .map(n => n.id);
}

/** Read ruin magnitude / sphere / culture from a ruin node, with safe defaults. */
function readRuinProps(ruinId: string, graph: WorldGraph): {
  magnitude: number;
  sphereAlignment: string;
  originCultureId: string;
} {
  const node = graph.getNode(ruinId);
  const p = (node?.properties ?? {}) as Record<string, unknown>;
  return {
    magnitude: (p.ruinMagnitude as number | undefined) ?? 0.5,
    sphereAlignment: (p.sphereAlignment as string | undefined) ?? '',
    originCultureId: (p.originCultureId as string | undefined) ?? '',
  };
}

// ─── Action resolvers ──────────────────────────────────────────────────────────

function resolveCastAttention(
  col: number,
  row: number,
  state: GameState,
  rng: () => number,
): void {
  const ruinIds = ruinsOnHex(col, row, state.graph);
  if (ruinIds.length === 0) {
    emitTrace({
      category: 'ruins.clue_suppressed_no_eligible_recipient',
      tick: state.tick,
      targetRuinId: `hex_${col}_${row}`,
      ruinMagnitude: 0,
      requiredMinTier: 'background',
      candidatePoolSize: 0,
      candidatesByTier: { background: 0, shaping: 0, story_beat: 0 },
      summary: `cast_attention: no ruin found at hex (${col},${row})`,
    });
    return;
  }

  const candidatePool = bondedAgentsNearHex(col, row, state.ascendantId, ADJACENCY_GATE_HEX_RADIUS, state.graph);
  if (candidatePool.length === 0) {
    emitTrace({
      category: 'ruins.clue_suppressed_no_eligible_recipient',
      tick: state.tick,
      targetRuinId: ruinIds[0],
      ruinMagnitude: 0,
      requiredMinTier: 'background',
      candidatePoolSize: 0,
      candidatesByTier: { background: 0, shaping: 0, story_beat: 0 },
      summary: `cast_attention: no bonded agent within ${ADJACENCY_GATE_HEX_RADIUS} hex(es) of (${col},${row})`,
    });
    return;
  }

  const ruinId = ruinIds[0];
  const { magnitude, sphereAlignment, originCultureId } = readRuinProps(ruinId, state.graph);

  produceClueConsequence({
    candidatePool,
    targetRuinId: ruinId,
    ruinMagnitude: magnitude,
    ruinSphereAlignment: sphereAlignment,
    ruinOriginCultureId: originCultureId,
    source: 'divine_whisper',
    precision: 'vague',
    composedByGodId: state.ascendantId,
    ascendantId: state.ascendantId,
    tick: state.tick,
    graph: state.graph,
    encounterProgress: state.encounterProgress ?? [],
    rng,
  });
}

function resolveRefineTheHush(
  col: number,
  row: number,
  state: GameState,
  rng: () => number,
): void {
  const ruinIds = ruinsOnHex(col, row, state.graph);
  if (ruinIds.length === 0) return;

  const candidatePool = bondedAgentsNearHex(col, row, state.ascendantId, ADJACENCY_GATE_HEX_RADIUS, state.graph);
  if (candidatePool.length === 0) {
    emitTrace({
      category: 'ruins.clue_suppressed_no_eligible_recipient',
      tick: state.tick,
      targetRuinId: ruinIds[0],
      ruinMagnitude: 0,
      requiredMinTier: 'background',
      candidatePoolSize: 0,
      candidatesByTier: { background: 0, shaping: 0, story_beat: 0 },
      summary: `refine_the_hush: no bonded agent within ${ADJACENCY_GATE_HEX_RADIUS} hex(es) of (${col},${row})`,
    });
    return;
  }

  const ruinId = ruinIds[0];
  const { magnitude, sphereAlignment, originCultureId } = readRuinProps(ruinId, state.graph);

  // Find a vague clue from any bonded agent to this ruin; upgrade it.
  let upgraded = false;
  for (const agentId of candidatePool) {
    const clueEdges = state.graph.getOutgoingEdges(agentId, 'knows_clue_of')
      .filter(e => e.target === ruinId);
    for (const edge of clueEdges) {
      const props = edge.properties as unknown as KnowsClueOfEdgeProperties;
      if (!props.consumed && props.precision === 'vague') {
        state.graph.updateEdge(edge.id, {
          properties: {
            ...(edge.properties as Record<string, unknown>),
            precision: 'narrowed',
          },
        });
        emitTrace({
          category: 'ruins.clue_discovered',
          tick: state.tick,
          knowerId: agentId,
          targetRuinId: ruinId,
          source: 'divine_whisper',
          precision: 'narrowed',
          magnitude: props.magnitude,
          composedByGodId: state.ascendantId,
          summary: `Clue refined: ${agentId} → ${ruinId} upgraded vague → narrowed via divine_whisper`,
        });
        upgraded = true;
        break;
      }
    }
    if (upgraded) break;
  }

  if (!upgraded) {
    // No vague clue to refine — spawn a narrowed clue directly via Narrative Gravity
    produceClueConsequence({
      candidatePool,
      targetRuinId: ruinId,
      ruinMagnitude: magnitude,
      ruinSphereAlignment: sphereAlignment,
      ruinOriginCultureId: originCultureId,
      source: 'divine_whisper',
      precision: 'narrowed',
      composedByGodId: state.ascendantId,
      ascendantId: state.ascendantId,
      tick: state.tick,
      graph: state.graph,
      encounterProgress: state.encounterProgress ?? [],
      rng,
    });
  }
}

function resolveListenForAName(
  col: number,
  row: number,
  state: GameState,
  rng: () => number,
): void {
  const ruinIds = ruinsOnHex(col, row, state.graph);
  if (ruinIds.length === 0) return;

  const candidatePool = bondedAgentsNearHex(col, row, state.ascendantId, ADJACENCY_GATE_HEX_RADIUS, state.graph);
  if (candidatePool.length === 0) {
    emitTrace({
      category: 'ruins.clue_suppressed_no_eligible_recipient',
      tick: state.tick,
      targetRuinId: ruinIds[0],
      ruinMagnitude: 0,
      requiredMinTier: 'background',
      candidatePoolSize: 0,
      candidatesByTier: { background: 0, shaping: 0, story_beat: 0 },
      summary: `listen_for_a_name: no bonded agent within ${ADJACENCY_GATE_HEX_RADIUS} hex(es) of (${col},${row})`,
    });
    return;
  }

  const ruinId = ruinIds[0];
  const { magnitude, sphereAlignment, originCultureId } = readRuinProps(ruinId, state.graph);

  const detail = originCultureId
    ? `Origin culture identified: ${originCultureId}`
    : 'Origin culture unknown — too ancient or too ruined';

  produceClueConsequence({
    candidatePool,
    targetRuinId: ruinId,
    ruinMagnitude: magnitude,
    ruinSphereAlignment: sphereAlignment,
    ruinOriginCultureId: originCultureId,
    source: 'divine_whisper',
    precision: 'narrowed',
    detail,
    composedByGodId: state.ascendantId,
    ascendantId: state.ascendantId,
    tick: state.tick,
    graph: state.graph,
    encounterProgress: state.encounterProgress ?? [],
    rng,
  });
}

function resolveReadTheThreads(
  col: number,
  row: number,
  state: GameState,
  rng: () => number,
): void {
  const popIds = placesOfPowerOnHex(col, row, state.graph);
  if (popIds.length === 0) {
    emitTrace({
      category: 'ruins.clue_suppressed_no_eligible_recipient',
      tick: state.tick,
      targetRuinId: `hex_${col}_${row}`,
      ruinMagnitude: 0,
      requiredMinTier: 'background',
      candidatePoolSize: 0,
      candidatesByTier: { background: 0, shaping: 0, story_beat: 0 },
      summary: `read_the_threads: no Place of Power at hex (${col},${row})`,
    });
    return;
  }

  const popId = popIds[0];
  const { magnitude, sphereAlignment, originCultureId } = readRuinProps(popId, state.graph);

  // No adjacency gate for read_the_threads; any known agent can receive it.
  const allThreaded = state.graph.getOutgoingEdges(state.ascendantId, 'thread').map(e => e.target);
  const candidatePool = allThreaded.length > 0 ? allThreaded : [];

  if (candidatePool.length === 0) return;

  produceClueConsequence({
    candidatePool,
    targetRuinId: popId,
    ruinMagnitude: magnitude,
    ruinSphereAlignment: sphereAlignment,
    ruinOriginCultureId: originCultureId,
    source: 'divine_whisper',
    precision: 'vague',
    detail: 'A Place of Power pulses here — a convergence of world-soul energy',
    composedByGodId: state.ascendantId,
    ascendantId: state.ascendantId,
    tick: state.tick,
    graph: state.graph,
    encounterProgress: state.encounterProgress ?? [],
    rng,
  });
}

function resolveTasteTheWake(
  col: number,
  row: number,
  state: GameState,
): void {
  const adjacentBonded = bondedAgentsNearHex(col, row, state.ascendantId, ADJACENCY_GATE_HEX_RADIUS, state.graph);
  if (adjacentBonded.length === 0) return;

  // Scan all agents on the target hex for divine_mark secrets
  const agentsOnHex = state.graph.getNodesByType('actor').filter(a => {
    const hex = resolveAgentHex(a.id, state.graph);
    return hex && hex.col === col && hex.row === row;
  });

  let foundAny = false;
  for (const agent of agentsOnHex) {
    const markEdges = state.graph.getOutgoingEdges(agent.id, 'knows_secret_of')
      .filter(e => {
        const p = e.properties as unknown as KnowsSecretOfEdgeProperties;
        return p.secretType === 'divine_mark' && !p.revealed;
      });

    for (const markEdge of markEdges) {
      const markProps = markEdge.properties as unknown as KnowsSecretOfEdgeProperties;
      const markingGodId = markEdge.target; // knows_secret_of target = subject = the god who marked

      emitTrace({
        category: 'ruins.divine_mark_discovered',
        tick: state.tick,
        discoveringGodId: state.ascendantId,
        agentId: agent.id,
        markingGodId,
        summary: `Divine mark discovered: ${agent.id} was marked by ${markingGodId} (tick ${markProps.discoveredTick})`,
      });
      foundAny = true;
    }
  }

  if (!foundAny) {
    emitTrace({
      category: 'ruins.clue_suppressed_no_eligible_recipient',
      tick: state.tick,
      targetRuinId: `hex_${col}_${row}`,
      ruinMagnitude: 0,
      requiredMinTier: 'background',
      candidatePoolSize: 0,
      candidatesByTier: { background: 0, shaping: 0, story_beat: 0 },
      summary: `taste_the_wake: no divine marks found at hex (${col},${row})`,
    });
  }
}

function resolveComposeAClue(
  agentId: string,
  state: GameState,
  rng: () => number,
): void {
  const agentNode = state.graph.getNode(agentId);
  if (!agentNode) return;

  // Verify the agent is bonded
  const isBonded = state.graph.getOutgoingEdges(state.ascendantId, 'thread').some(e => e.target === agentId);
  if (!isBonded) return;

  const ruinId = findAnyRuinId(state.graph, rng);
  if (!ruinId) return;

  const { magnitude, sphereAlignment, originCultureId } = readRuinProps(ruinId, state.graph);

  // Create knows_clue_of edge directly (bypassing Narrative Gravity — god composes it)
  const edgeId = `clue_${agentId}_${ruinId}_${state.tick}_composed`;
  const edgeProps: KnowsClueOfEdgeProperties = {
    magnitude,
    precision: 'narrowed',
    source: 'divine_whisper',
    discoveredTick: state.tick,
    consumed: false,
    detail: 'Knowledge whispered directly by a god',
    composedByGodId: state.ascendantId,
  };

  try {
    state.graph.addEdge({
      id: edgeId,
      source: agentId,
      target: ruinId,
      type: 'knows_clue_of',
      properties: edgeProps as unknown as Record<string, unknown>,
    });
  } catch {
    return; // Edge may already exist — fail soft
  }

  emitTrace({
    category: 'ruins.clue_discovered',
    tick: state.tick,
    knowerId: agentId,
    targetRuinId: ruinId,
    source: 'divine_whisper',
    precision: 'narrowed',
    magnitude,
    composedByGodId: state.ascendantId,
    summary: `Clue composed by god: ${agentId} ← ${ruinId} via divine_whisper (narrowed)`,
  });

  // Leave a divine_mark secret on the agent (discoverable via taste_the_wake)
  const markEdgeId = `secret_${agentId}_${state.ascendantId}_${state.tick}_divine_mark`;
  const markProps: KnowsSecretOfEdgeProperties = {
    secretType: 'divine_mark',
    magnitude: 0.5,
    discoveredTick: state.tick,
    source: 'divine_revelation',
    revealed: false,
    detail: `God ${state.ascendantId} composed a clue for this agent`,
  };

  try {
    state.graph.addEdge({
      id: markEdgeId,
      source: agentId,
      target: state.ascendantId,
      type: 'knows_secret_of',
      properties: markProps as unknown as Record<string, unknown>,
    });
  } catch {
    // Mark creation failed — non-fatal
  }

  emitTrace({
    category: 'ruins.divine_mark_composed',
    tick: state.tick,
    agentId,
    markingGodId: state.ascendantId,
    summary: `Divine mark composed on ${agentId} by god ${state.ascendantId}`,
  });

  void sphereAlignment; void originCultureId; // used for future multi-sphere cost, suppress unused lint
}

function resolveWhisperTheDirection(
  agentId: string,
  state: GameState,
  rng: () => number,
): void {
  const agentNode = state.graph.getNode(agentId);
  if (!agentNode) return;

  // Verify the agent is bonded
  const isBonded = state.graph.getOutgoingEdges(state.ascendantId, 'thread').some(e => e.target === agentId);
  if (!isBonded) return;

  // Find nearest ruin location to the agent
  const agentHex = resolveAgentHex(agentId, state.graph);
  if (!agentHex) return;

  const allRuins = state.graph.getNodesByType('location').filter(n =>
    typeof (n.properties as Record<string, unknown>).ruinMagnitude === 'number'
  );
  if (allRuins.length === 0) return;

  // Pick the closest ruin (by hex distance) that the agent isn't already at
  let nearestRuinId: string | null = null;
  let nearestDist = Infinity;

  for (const ruin of allRuins) {
    const p = ruin.properties as Record<string, unknown>;
    const rc = p.hexCol as number | undefined;
    const rr = p.hexRow as number | undefined;
    if (rc == null || rr == null) continue;

    const dist = hexDistance({ col: agentHex.col, row: agentHex.row }, { col: rc, row: rr });
    if (dist > 0 && dist < nearestDist) {
      nearestDist = dist;
      nearestRuinId = ruin.id;
    }
  }

  if (!nearestRuinId) return;

  // Override the agent's movement destination by mutating their movementState
  const agentProps = agentNode.properties as Record<string, unknown>;
  const existingMovState = agentProps.movementState as MovementState | undefined;

  const nudgedMovState: MovementState = existingMovState
    ? { ...existingMovState, destinationId: nearestRuinId, movementQueue: [] }
    : {
        destinationId: nearestRuinId,
        movementQueue: [],
        ticksAccumulated: 0,
        currentEdgeCost: 1,
        lastDecisionTick: state.tick,
        movementHistory: [],
      };

  state.graph.updateNode(agentId, {
    properties: { ...agentProps, movementState: nudgedMovState },
  });

  emitTrace({
    category: 'ruins.clue_discovered',
    tick: state.tick,
    knowerId: agentId,
    targetRuinId: nearestRuinId,
    source: 'divine_whisper',
    precision: 'vague',
    magnitude: readRuinProps(nearestRuinId, state.graph).magnitude,
    composedByGodId: state.ascendantId,
    summary: `Whisper direction: ${agentId} nudged toward ruin ${nearestRuinId} (dist ${nearestDist})`,
  });

  void rng; // consumed by findAnyRuinId-style future expansions
}

// ─── Main entry point ──────────────────────────────────────────────────────────

/**
 * Dispatch a resolved Perceive or Relay divine action to the appropriate handler.
 * targetId is either `hex_COL_ROW` (Perceive) or an agent ID (Relay).
 *
 * Fail-soft: all handlers are individually wrapped; any error is caught here.
 */
export function resolvePerceiveRelayAction(
  templateId: string,
  state: GameState,
  targetId: string | undefined,
  rng: () => number,
): void {
  if (!targetId) return;

  try {
    if (templateId.startsWith('divine.perceive.')) {
      // Hex-targeted: parse hex_COL_ROW
      const hexMatch = targetId.match(/^hex_(-?\d+)_(-?\d+)$/);
      if (!hexMatch) return;
      const col = parseInt(hexMatch[1], 10);
      const row = parseInt(hexMatch[2], 10);

      switch (templateId) {
        case 'divine.perceive.cast_attention':
          resolveCastAttention(col, row, state, rng);
          break;
        case 'divine.perceive.refine_the_hush':
          resolveRefineTheHush(col, row, state, rng);
          break;
        case 'divine.perceive.listen_for_a_name':
          resolveListenForAName(col, row, state, rng);
          break;
        case 'divine.perceive.read_the_threads':
          resolveReadTheThreads(col, row, state, rng);
          break;
        case 'divine.perceive.taste_the_wake':
          resolveTasteTheWake(col, row, state);
          break;
      }
    } else {
      // Agent-targeted: targetId is agent ID
      switch (templateId) {
        case 'divine.relay.compose_a_clue':
          resolveComposeAClue(targetId, state, rng);
          break;
        case 'divine.relay.whisper_the_direction':
          resolveWhisperTheDirection(targetId, state, rng);
          break;
      }
    }
  } catch (err) {
    console.warn('[perceiveRelay] fail-soft:', templateId, err);
  }
}
