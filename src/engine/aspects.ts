/**
 * Aspect apex state — selectors, grant, eligibility, seeding, and death→echo. (THR-479)
 *
 * "Aspect" is the apex milestone *beyond* the five Influence tiers: a mortal
 * who has become a partial aspect of the god. It is a distinct `aspect_of`
 * graph edge (ascendant → mortal), never garbage-collected, and surviving the
 * mortal's death as a mythic echo. See
 * Docs/plans/2026-06-23-thr479-aspect-apex-state.md.
 *
 * Fail-soft (NFP #4): every path no-ops rather than throwing — a missing
 * thread, a missing node, or a duplicate grant degrade gracefully.
 */

import type { WorldGraph } from './graph';
import type { GraphEdge } from '../types/graph';
import type { AspectEdgeProperties, InfluenceTier, ThreadEdgeProperties } from '../types/influence';
import type { GameState, TickEvent } from '../types/gameState';
import type { PendingEncounterSeed } from '../types/unifiedAction';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld } from './simulationRuntime';
import { accumulateImportance } from './rarity';
import { emitTrace } from './traceBuffer';
import {
  ASPECT_ELIGIBILITY_TICKS,
  ASPECT_REOFFER_COOLDOWN_TICKS,
  ASPECT_GRAVITY_BONUS,
  APOTHEOSIS_ENCOUNTER_TEMPLATE_ID,
  APOTHEOSIS_PREMONITION_LINE,
} from '../data/aspect-content';
import { APOTHEOSIS_PREMONITION_LEAD_TICKS } from '../data/nudge-constants';
import { fillApotheosisLine } from './apotheosisLines';

// ─── Selectors ───────────────────────────────────────────────────────

/** All `aspect_of` edges held by an ascendant (living Aspects + mythic echoes). */
export function getAspectEdges(graph: WorldGraph, ascendantId: string): GraphEdge[] {
  return graph.getOutgoingEdges(ascendantId, 'aspect_of');
}

/** Living Aspect edges only (excludes mythic echoes — a dead Aspect no longer channels). */
export function getLivingAspectEdges(graph: WorldGraph, ascendantId: string): GraphEdge[] {
  return getAspectEdges(graph, ascendantId).filter(e => e.properties.mythicEcho !== true);
}

/** The `aspect_of` edge naming a mortal, if any (incoming). */
export function getAspectEdgeForMortal(graph: WorldGraph, mortalId: string): GraphEdge | undefined {
  return graph.getIncomingEdges(mortalId, 'aspect_of')[0];
}

/** Whether a mortal is an Aspect (living or echo). */
export function isAspect(graph: WorldGraph, mortalId: string): boolean {
  return graph.getIncomingEdges(mortalId, 'aspect_of').length > 0;
}

// ─── Grant ───────────────────────────────────────────────────────────

export interface GrantAspectParams {
  /** The mortal becoming an Aspect. */
  mortalId: string;
  /** Tick of the grant. */
  tick: number;
  /** Encounter instance id of the apotheosis capstone. */
  originEncounterId: string;
  /** Explicit ascendant; defaults to the source of the mortal's thread edge. */
  ascendantId?: string;
  /** Narrative label. */
  reason?: string;
}

export interface GrantAspectResult {
  granted: boolean;
  reason: 'created' | 'already_aspect' | 'thread_missing' | 'mortal_missing';
  ascendantId?: string;
  mortalId: string;
  edgeId?: string;
}

/**
 * Grant the Aspect apex milestone to a mortal. Idempotent — granting a second
 * time for the same pair is a no-op. Pure graph mutation + importance bump +
 * `aspect_attained` trace. Chronicle/event surfacing is the caller's job.
 */
export function grantAspect(
  graph: WorldGraph,
  params: GrantAspectParams,
  runtime?: SimulationRuntime,
): GrantAspectResult {
  const { mortalId, tick, originEncounterId, reason } = params;

  const mortalNode = graph.getNode(mortalId);
  if (!mortalNode) {
    return { granted: false, reason: 'mortal_missing', mortalId };
  }

  // Resolve the ascendant from the mortal's incoming thread edge when not given.
  const threadEdges = graph.getIncomingEdges(mortalId, 'thread');
  const ascendantId = params.ascendantId ?? threadEdges[0]?.source;
  if (!ascendantId) {
    return { granted: false, reason: 'thread_missing', mortalId };
  }

  // Idempotency: already an Aspect of this ascendant.
  const existing = graph
    .getOutgoingEdges(ascendantId, 'aspect_of')
    .find(e => e.target === mortalId);
  if (existing) {
    return { granted: false, reason: 'already_aspect', ascendantId, mortalId, edgeId: existing.id };
  }

  const threadEdge = threadEdges.find(e => e.source === ascendantId);
  const sourceTier = ((threadEdge?.properties as ThreadEdgeProperties | undefined)?.tier ?? 4) as InfluenceTier;

  const edgeId = `aspect_of_${ascendantId}_${mortalId}`;
  const properties: AspectEdgeProperties = {
    attainedTick: tick,
    originEncounterId,
    sourceTier,
    survivesDeath: true,
  };

  try {
    graph.addEdge({ id: edgeId, source: ascendantId, target: mortalId, type: 'aspect_of', properties });
  } catch {
    // Duplicate edge id (race) — treat as already-aspect, fail-soft.
    return { granted: false, reason: 'already_aspect', ascendantId, mortalId, edgeId };
  }

  // Narrative-gravity bump: the Aspect anchors curated encounters more often.
  accumulateImportance(mortalNode, ASPECT_GRAVITY_BONUS);

  if (runtime) touchWorld(runtime);

  emitTrace({
    tick,
    category: 'aspect_attained',
    agentId: mortalId,
    ascendantId,
    mortalId,
    originEncounterId,
    sourceTier,
    summary: `aspect_attained: ${ascendantId} → ${mortalId} (tier ${sourceTier}${reason ? `, ${reason}` : ''})`,
  });

  return { granted: true, reason: 'created', ascendantId, mortalId, edgeId };
}

// ─── Eligibility + seeding ─────────────────────────────────────────────

/**
 * Whether a thread edge is eligible to seed the apotheosis capstone:
 * held at tier 4 for at least ASPECT_ELIGIBILITY_TICKS, with the re-offer
 * cooldown respected.
 */
export function isApotheosisEligible(threadEdge: GraphEdge, tick: number): boolean {
  const props = threadEdge.properties as ThreadEdgeProperties & { apotheosisOfferedTick?: number };
  if (props.tier !== 4) return false;
  if ((props.ticksAtCurrentTier ?? 0) < ASPECT_ELIGIBILITY_TICKS) return false;
  if (
    typeof props.apotheosisOfferedTick === 'number' &&
    tick - props.apotheosisOfferedTick < ASPECT_REOFFER_COOLDOWN_TICKS
  ) {
    return false;
  }
  return true;
}

/** The thread edge's apotheosis bookkeeping (stamped in place, like the offer tick). */
type ApotheosisThreadProps = ThreadEdgeProperties & {
  apotheosisOfferedTick?: number;
  /** THR-2227 — the tick the premonition for the coming offer fired. */
  apotheosisPremonitionTick?: number;
};

/**
 * THR-2227 — ticks until this tier-4 thread is offered the Apotheosis: the rest of
 * the eligibility hold, or the rest of the re-offer cooldown, whichever is longer.
 * `Infinity` below tier 4 (no offer is coming).
 */
export function ticksUntilApotheosisOffer(threadEdge: GraphEdge, tick: number): number {
  const props = threadEdge.properties as unknown as ApotheosisThreadProps;
  if (props.tier !== 4) return Number.POSITIVE_INFINITY;
  const holdLeft = ASPECT_ELIGIBILITY_TICKS - (props.ticksAtCurrentTier ?? 0);
  const coolLeft = typeof props.apotheosisOfferedTick === 'number'
    ? ASPECT_REOFFER_COOLDOWN_TICKS - (tick - props.apotheosisOfferedTick)
    : 0;
  return Math.max(0, holdLeft, coolLeft);
}

/**
 * THR-2227 — is the premonition due? Once per offer: when the offer is
 * `APOTHEOSIS_PREMONITION_LEAD_TICKS` away or closer and no premonition has fired
 * since the last offer.
 */
export function apotheosisPremonitionDue(threadEdge: GraphEdge, tick: number): boolean {
  const props = threadEdge.properties as unknown as ApotheosisThreadProps;
  if (props.tier !== 4) return false;
  const lastOffer = typeof props.apotheosisOfferedTick === 'number' ? props.apotheosisOfferedTick : Number.NEGATIVE_INFINITY;
  // Warned already only when the warning fired since the last offer AND during the
  // current tier-4 stint: a thread that fell below tier 4 and climbed back is warned again.
  const stintStart = tick - (props.ticksAtCurrentTier ?? 0);
  if (
    typeof props.apotheosisPremonitionTick === 'number'
    && props.apotheosisPremonitionTick > lastOffer
    && props.apotheosisPremonitionTick >= stintStart
  ) return false;
  return ticksUntilApotheosisOffer(threadEdge, tick) <= APOTHEOSIS_PREMONITION_LEAD_TICKS;
}

/**
 * Tick phase: seed the bespoke apotheosis capstone onto any tier-4 mortal that
 * has held the top rung long enough and is not already an Aspect. Pushes
 * PendingEncounterSeeds consumed by evaluateEncounterSeeds in the same tick.
 *
 * Must run immediately before evaluateEncounterSeeds.
 */
export function seedApotheosisEncounters(
  state: GameState,
  tick: number,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  const graph = state.graph;
  const ascendant = graph.getNode(state.ascendantId);
  if (!ascendant) return {};

  const threadEdges = graph.getOutgoingEdges(state.ascendantId, 'thread');
  if (threadEdges.length === 0) return {};

  const existingSeeds = state.pendingEncounterSeeds ?? [];
  const alreadyAspect = new Set(
    getAspectEdges(graph, state.ascendantId).map(e => e.target),
  );
  const alreadySeeded = new Set(
    existingSeeds
      .filter(s => s.templateId === APOTHEOSIS_ENCOUNTER_TEMPLATE_ID)
      .map(s => s.targetAgentId),
  );
  const alreadyActive = new Set(
    (state.unifiedActions ?? [])
      .filter(a => !a.resolved && a.templateId === APOTHEOSIS_ENCOUNTER_TEMPLATE_ID)
      .map(a => a.actorId),
  );

  const newSeeds: PendingEncounterSeed[] = [];
  const premonitionEvents: TickEvent[] = [];

  for (const edge of threadEdges) {
    const mortalId = edge.target;
    if (alreadyAspect.has(mortalId) || alreadySeeded.has(mortalId) || alreadyActive.has(mortalId)) {
      continue;
    }
    const mortalNode = graph.getNode(mortalId);
    if (!mortalNode || mortalNode.properties.actorType !== 'individual') continue;
    if (mortalNode.properties.deceased === true) continue;

    // THR-2227 — the premonition: once per offer, when the offer comes into view
    // (the eligibility hold starts), so a god can save essence for it. It always
    // lands on an earlier tick than the offer: a tick that fires it seeds nothing.
    if (apotheosisPremonitionDue(edge, tick)) {
      const props = edge.properties as unknown as ApotheosisThreadProps;
      props.apotheosisPremonitionTick = tick;
      const message = fillApotheosisLine(APOTHEOSIS_PREMONITION_LINE, mortalNode.name, mortalNode.properties.gender);
      premonitionEvents.push({
        id: `apotheosis_premonition_${mortalId}_${tick}`,
        tick,
        type: 'divine_premonition',
        message,
        significance: 0.7,
        isInterventionBeat: true,
        actorId: mortalId,
        notification: { channel: 'toast' },
      });
      emitTrace({
        tick,
        category: 'apotheosis.premonition',
        agentId: mortalId,
        mortalId,
        ticksUntilOffer: ticksUntilApotheosisOffer(edge, tick),
        summary: `apotheosis.premonition: ${mortalId} nears the threshold`,
      });
      continue;
    }

    if (!isApotheosisEligible(edge, tick)) continue;

    newSeeds.push({
      seedId: `apotheosis_${mortalId}_${tick}`,
      sourceEncounterId: 'system.apotheosis_eligibility',
      sourceReactionId: 'eligibility',
      templateId: APOTHEOSIS_ENCOUNTER_TEMPLATE_ID,
      targetAgentId: mortalId,
      eligibleAfterTick: tick,
      priority: 1.5,
      seedLabel: 'A mortal stands at the threshold of apotheosis.',
      plantedTick: tick,
      // THR-1929: the capstone fires wherever the mortal stands — its envelope binds
      // the opening prose, never whether it can fire — so it skips the place wait.
      firesPlaceless: true,
    });

    // Stamp the offer so we respect the re-offer cooldown and don't double-seed.
    (edge.properties as ThreadEdgeProperties & { apotheosisOfferedTick?: number }).apotheosisOfferedTick = tick;
  }

  if (newSeeds.length === 0 && premonitionEvents.length === 0) return {};

  if (runtime) touchWorld(runtime);
  return {
    ...(newSeeds.length > 0 ? { pendingEncounterSeeds: [...existingSeeds, ...newSeeds] } : {}),
    ...(premonitionEvents.length > 0 ? { tickEvents: [...(state.tickEvents ?? []), ...premonitionEvents] } : {}),
  };
}

// ─── Death → mythic echo ───────────────────────────────────────────────

export interface AspectEchoResult {
  /** True if the dying mortal was an Aspect and was retained as a mythic echo. */
  isEcho: boolean;
  /** Ascendants whose Aspect this was. */
  ascendantIds: string[];
}

/**
 * Called from the death phase BEFORE node removal. If the dying mortal is an
 * Aspect, retain the node and the `aspect_of` edge as a mythic echo: remove all
 * other edges, set mythicEcho on the node and the aspect_of edge(s), and emit
 * `aspect_echoed`. Returns isEcho=true so the caller skips removeNode.
 *
 * A non-Aspect returns isEcho=false and the caller proceeds with normal death.
 */
export function markAspectEchoOnDeath(
  graph: WorldGraph,
  mortalId: string,
  tick: number,
  runtime?: SimulationRuntime,
): AspectEchoResult {
  const aspectEdges = graph
    .getIncomingEdges(mortalId, 'aspect_of')
    .filter(e => e.target === mortalId);
  if (aspectEdges.length === 0) {
    return { isEcho: false, ascendantIds: [] };
  }

  const mortalNode = graph.getNode(mortalId);
  if (!mortalNode) {
    // Node already gone — nothing to retain.
    return { isEcho: false, ascendantIds: [] };
  }

  const aspectEdgeIds = new Set(aspectEdges.map(e => e.id));

  // Remove every edge EXCEPT the aspect_of edge(s) — the conduit closes, the
  // bond endures. (Removing located_at frees the hex so spatial systems skip
  // the retained echo node.)
  for (const edge of graph.getAllEdgesForNode(mortalId)) {
    if (!aspectEdgeIds.has(edge.id)) {
      graph.removeEdge(edge.id);
    }
  }

  const ascendantIds: string[] = [];
  for (const edge of aspectEdges) {
    const props = edge.properties as AspectEdgeProperties;
    props.mythicEcho = true;
    props.echoedTick = tick;
    ascendantIds.push(edge.source);
  }

  // Retain the node, marked as a deceased mythic echo.
  mortalNode.properties.deceased = true;
  mortalNode.properties.mythicEcho = true;

  if (runtime) touchWorld(runtime);

  for (const ascendantId of ascendantIds) {
    emitTrace({
      tick,
      category: 'aspect_echoed',
      agentId: mortalId,
      ascendantId,
      mortalId,
      summary: `aspect_echoed: ${ascendantId} → ${mortalId} died; bond persists as mythic echo`,
    });
  }

  return { isEcho: true, ascendantIds };
}
