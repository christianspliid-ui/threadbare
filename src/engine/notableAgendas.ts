/**
 * Notable Agendas — THR-630 (War Phase D, the living world around the wars).
 *
 * A spotlight-budgeted roster of prominent unthreaded notables (seated
 * faction/nation leaders via `leads` edges) each carry one four-phase agenda
 * composition on the shipped THR-225 phase runner — the same machinery as the
 * THR-66 rival schemes, whose executor shape this mirrors deliberately.
 *
 * Determinism (NFP #3): all randomness comes from the seeded rng constructed
 * per tick; target selection is rng-free (nearest-by-hex, id tiebreak).
 * Fail-soft (NFP #4): unknown families, missing nodes, and unresolvable hexes
 * skip quietly; the phase never throws.
 *
 * Thread-takeover: threading a notable tug-gates their agenda — a threaded
 * sponsor's agenda stops investing (frozen, not failed) and threaded notables
 * are never selected for new launches. The player's attention displaces the
 * world's autonomy, exactly as the plan intends.
 */

import type { GameState, ActiveComposition, TickEvent } from '../types/gameState';
import type { Phase } from '../composition-dsl/schema';
import type { WorldGraph } from './graph';
import type { SphereName } from '../types/index';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { mulberry32 } from '../lib/prng';
import { hexDistance } from '../lib/hexMath';
import { resolveLocationToHex } from './encounterAwareness';
import { getFactionLeaderId } from './factionNetwork';
import { spawnArmy, selectCommander } from './armySpawning';
import {
  ARMY_SPAWN_IRON_TIER_MIN,
  ARMY_SPAWN_GOLD_TIER_MIN,
  MAX_ARMIES_PER_FACTION,
} from '../types/army';
import { computeCapability, computeTier } from './domainCapability';
import { emitTrace } from './traceBuffer';
import type {
  NotableAgendaLaunchedTrace,
  NotableAgendaPhaseAdvancedTrace,
  NotableAgendaCounteredTrace,
  NotableAgendaCompletedTrace,
  NotableRosterScanTrace,
} from '../types/trace';
import {
  NOTABLE_AGENDA_FAMILIES,
  getNotableAgendaFamily,
  type NotableAgendaFamily,
} from '../data/notable-agendas';
import {
  MAX_ACTIVE_NOTABLE_AGENDAS,
  NOTABLE_PROMINENCE_WEIGHT_SCOPE,
  NOTABLE_PROMINENCE_WEIGHT_POWER,
  NOTABLE_PROMINENCE_WEIGHT_DRIVE,
  NOTABLE_PROMINENCE_WEIGHT_PROXIMITY,
  NOTABLE_SCOPE_CONTROLS_NORM,
  NOTABLE_PROXIMITY_NORM_HEXES,
  NOTABLE_AGENDA_PHASE_INVEST_TICKS,
  NOTABLE_AGENDA_LAUNCH_COOLDOWN_TICKS,
  NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS,
  NOTABLE_AGENDA_COUNTERS_TO_FAIL,
  NOTABLE_AGENDA_STALL_TICKS,
  NOTABLE_AGENDA_SPHERE_PRESSURE_PER_PHASE,
  NOTABLE_AGENDA_CRACK_PRESSURE_MULTIPLIER,
} from '../data/notable-agenda-config';

// ─── World-flag helpers ────────────────────────────────────────────────────
// Single source of truth for agenda flag names (mirrors rival `schemeFlags`).

export const agendaFlags = {
  ready: (compositionId: string, phaseId: string) =>
    `agenda.${compositionId}.${phaseId}-ready`,
  moveDone: (compositionId: string, phaseId: string) =>
    `agenda.${compositionId}.${phaseId}-done`,
  invest: (compositionId: string) => `agenda.${compositionId}.invest`,
  counters: (compositionId: string) => `agenda.${compositionId}.counters`,
  stallUntil: (compositionId: string) => `agenda.${compositionId}.stall-until`,
  completedNoted: (compositionId: string) => `agenda.${compositionId}.completed-noted`,
  lastLaunch: (notableId: string) => `agenda.notable.${notableId}.last-launch`,
} as const;

// ─── Trace helper ──────────────────────────────────────────────────────────
// emitTrace's Omit<TraceEntry, K> collapses the union to common fields, so
// per-type extras can't be passed directly (same issue the rival executor
// works around). One union-typed helper, one cast.

type NotableTraceInput =
  | Omit<NotableAgendaLaunchedTrace, 'id' | 'timestamp'>
  | Omit<NotableAgendaPhaseAdvancedTrace, 'id' | 'timestamp'>
  | Omit<NotableAgendaCounteredTrace, 'id' | 'timestamp'>
  | Omit<NotableAgendaCompletedTrace, 'id' | 'timestamp'>
  | Omit<NotableRosterScanTrace, 'id' | 'timestamp'>;

function emitNotableTrace(trace: NotableTraceInput): void {
  emitTrace(trace as Parameters<typeof emitTrace>[0]);
}

// ─── Notable discovery + prominence ────────────────────────────────────────

/**
 * All faction leaders, resolved through the canonical seam
 * (`getFactionLeaderId`: derivation with `leads`-edge override) — a raw
 * `leads` scan finds nothing on real worlds, where most leaders are derived,
 * not anointed. One roster entry per notable (dedupe keeps the first faction
 * in id order).
 */
export function listNotables(graph: WorldGraph): { notableId: string; factionId: string }[] {
  const factions = graph
    .getNodesByType('actor')
    .filter((n) => n.properties.actorType === 'faction')
    .sort((a, b) => a.id.localeCompare(b.id));
  const out: { notableId: string; factionId: string }[] = [];
  const seen = new Set<string>();
  for (const faction of factions) {
    let leaderId: string | null = null;
    try {
      leaderId = getFactionLeaderId(graph, faction.id);
    } catch {
      continue; // fail-soft: a faction whose summary throws has no notable
    }
    if (!leaderId || seen.has(leaderId)) continue;
    seen.add(leaderId);
    out.push({ notableId: leaderId, factionId: faction.id });
  }
  // Deterministic order regardless of graph iteration order.
  out.sort((a, b) => a.notableId.localeCompare(b.notableId));
  return out;
}

/** True when the ascendant has a thread to this actor (thread-takeover gate). */
export function isThreadedByPlayer(state: GameState, actorId: string): boolean {
  const ascendantId = state.ascendantId;
  if (!ascendantId) return false;
  return state.graph
    .getIncomingEdges(actorId, 'thread')
    .some((e) => e.source === ascendantId);
}

/** Resolve any actor to a hex via its located_at chain (null when unresolvable). */
function actorHex(graph: WorldGraph, actorId: string): { col: number; row: number } | null {
  const locEdge = graph.getOutgoingEdges(actorId, 'located_at')[0];
  if (!locEdge) return null;
  return resolveLocationToHex(graph, locEdge.target);
}

/**
 * Prominence ∈ [0,1]: scope·W_SCOPE + power·W_POWER + drive·W_DRIVE +
 * proximity·W_PROXIMITY (plan §A). Each component ∈ [0,1]:
 * - scope: faction `controls` edge count / NOTABLE_SCOPE_CONTROLS_NORM, capped.
 * - power: best domainCapabilities value / 100 (0–100 scale, lowercase keys).
 * - drive: mean |axiologicalProfile value| (±1 pairs — intensity, not virtue).
 * - proximity: 1 − hexDist(notable, nearest player-threaded actor)/NORM, floored;
 *   0 when the player has no threads or positions are unresolvable.
 */
export function scoreNotableProminence(
  state: GameState,
  notableId: string,
  factionId: string,
): number {
  const graph = state.graph;

  const controlsCount = graph.getOutgoingEdges(factionId, 'controls').length;
  const scope = Math.min(1, controlsCount / NOTABLE_SCOPE_CONTROLS_NORM);

  const node = graph.getNode(notableId);
  const caps = (node?.properties.domainCapabilities ?? {}) as Record<string, number>;
  const capValues = Object.values(caps).filter((v): v is number => typeof v === 'number');
  const power = capValues.length > 0 ? Math.min(1, Math.max(...capValues) / 100) : 0;

  const profile = (node?.properties.axiologicalProfile ?? {}) as Record<string, number>;
  const profileValues = Object.values(profile).filter(
    (v): v is number => typeof v === 'number',
  );
  const drive =
    profileValues.length > 0
      ? Math.min(
          1,
          profileValues.reduce((s, v) => s + Math.abs(v), 0) / profileValues.length,
        )
      : 0;

  let proximity = 0;
  const ascendantId = state.ascendantId;
  const myHex = actorHex(graph, notableId);
  if (ascendantId && myHex) {
    let best = Infinity;
    for (const thread of graph.getOutgoingEdges(ascendantId, 'thread')) {
      const theirHex = actorHex(graph, thread.target);
      if (!theirHex) continue;
      const d = hexDistance(myHex, theirHex);
      if (d < best) best = d;
    }
    if (best !== Infinity) {
      proximity = Math.max(0, 1 - best / NOTABLE_PROXIMITY_NORM_HEXES);
    }
  }

  return (
    scope * NOTABLE_PROMINENCE_WEIGHT_SCOPE +
    power * NOTABLE_PROMINENCE_WEIGHT_POWER +
    drive * NOTABLE_PROMINENCE_WEIGHT_DRIVE +
    proximity * NOTABLE_PROMINENCE_WEIGHT_PROXIMITY
  );
}

// ─── Target selection ──────────────────────────────────────────────────────

/**
 * Claim target: the nearest location controlled by a faction other than the
 * notable's own, not already under an active agenda/scheme. Rng-free —
 * nearest by hex distance, id tiebreak — so launches are deterministic.
 */
export function selectClaimTarget(
  state: GameState,
  notableId: string,
  factionId: string,
  alreadyTargeted: ReadonlySet<string>,
): { targetId: string; targetName: string } | undefined {
  const graph = state.graph;
  const myHex = actorHex(graph, notableId);
  if (!myHex) return undefined;

  let best: { targetId: string; targetName: string; dist: number } | undefined;
  for (const node of graph.getNodesByType('actor')) {
    if (node.properties.actorType !== 'faction') continue;
    if (node.id === factionId) continue;
    for (const controls of graph.getOutgoingEdges(node.id, 'controls')) {
      const locId = controls.target;
      if (alreadyTargeted.has(locId)) continue;
      const locNode = graph.getNode(locId);
      if (!locNode || locNode.type !== 'location') continue;
      if (locNode.properties.locationSubtype === 'ruins') continue;
      const hex = resolveLocationToHex(graph, locId);
      if (!hex) continue;
      const dist = hexDistance(myHex, hex);
      if (
        !best ||
        dist < best.dist ||
        (dist === best.dist && locId.localeCompare(best.targetId) < 0)
      ) {
        best = { targetId: locId, targetName: locNode.name, dist };
      }
    }
  }
  return best ? { targetId: best.targetId, targetName: best.targetName } : undefined;
}

/**
 * Rite target: the nearest holding the notable's own faction controls.
 * Rng-free — nearest by hex distance, id tiebreak.
 */
export function selectOwnHoldingTarget(
  state: GameState,
  notableId: string,
  factionId: string,
  alreadyTargeted: ReadonlySet<string>,
): { targetId: string; targetName: string } | undefined {
  const graph = state.graph;
  const myHex = actorHex(graph, notableId);
  if (!myHex) return undefined;

  let best: { targetId: string; targetName: string; dist: number } | undefined;
  for (const controls of graph.getOutgoingEdges(factionId, 'controls')) {
    const locId = controls.target;
    if (alreadyTargeted.has(locId)) continue;
    const locNode = graph.getNode(locId);
    if (!locNode || locNode.type !== 'location') continue;
    if (locNode.properties.locationSubtype === 'ruins') continue;
    const hex = resolveLocationToHex(graph, locId);
    if (!hex) continue;
    const dist = hexDistance(myHex, hex);
    if (
      !best ||
      dist < best.dist ||
      (dist === best.dist && locId.localeCompare(best.targetId) < 0)
    ) {
      best = { targetId: locId, targetName: locNode.name, dist };
    }
  }
  return best ? { targetId: best.targetId, targetName: best.targetName } : undefined;
}

/**
 * Feud target: the nearest other-faction notable. Rng-free — nearest by hex
 * distance, id tiebreak. `notables` is the roster the caller already built.
 */
export function selectFeudTarget(
  state: GameState,
  notableId: string,
  factionId: string,
  notables: ReadonlyArray<{ notableId: string; factionId: string }>,
  alreadyTargeted: ReadonlySet<string>,
): { targetId: string; targetName: string } | undefined {
  const graph = state.graph;
  const myHex = actorHex(graph, notableId);
  if (!myHex) return undefined;

  let best: { targetId: string; targetName: string; dist: number } | undefined;
  for (const other of notables) {
    if (other.notableId === notableId || other.factionId === factionId) continue;
    if (alreadyTargeted.has(other.notableId)) continue;
    const node = graph.getNode(other.notableId);
    if (!node) continue;
    const hex = actorHex(graph, other.notableId);
    if (!hex) continue;
    const dist = hexDistance(myHex, hex);
    if (
      !best ||
      dist < best.dist ||
      (dist === best.dist && other.notableId.localeCompare(best.targetId) < 0)
    ) {
      best = { targetId: other.notableId, targetName: node.name, dist };
    }
  }
  return best ? { targetId: best.targetId, targetName: best.targetName } : undefined;
}

/**
 * Dispatch target selection by the family's targetKind. Returns undefined for
 * `none` (agenda anchors on the notable) and for kinds with no valid target
 * (the notable sits this scan out).
 */
export function selectAgendaTarget(
  state: GameState,
  family: NotableAgendaFamily,
  notableId: string,
  factionId: string,
  notables: ReadonlyArray<{ notableId: string; factionId: string }>,
  alreadyTargeted: ReadonlySet<string>,
): { targetId: string; targetName: string } | undefined | 'none' {
  switch (family.targetKind) {
    case 'location':
      return selectClaimTarget(state, notableId, factionId, alreadyTargeted);
    case 'own-location':
      return selectOwnHoldingTarget(state, notableId, factionId, alreadyTargeted);
    case 'notable':
      return selectFeudTarget(state, notableId, factionId, notables, alreadyTargeted);
    case 'none':
      return 'none';
  }
}

// ─── Launch builder ────────────────────────────────────────────────────────

function substituteAgendaProse(
  raw: string,
  notableName: string,
  factionName: string,
  targetName: string,
): string {
  return raw
    .replace(/\{notable\}/g, notableName)
    .replace(/\{faction\}/g, factionName)
    .replace(/\{target\}/g, targetName);
}

export interface AgendaLaunchPlan {
  composition: ActiveComposition;
  /** world-flag deltas to merge: phase-1 armed + invest counter + cooldown stamp. */
  worldFlagUpdates: Record<string, unknown>;
}

/**
 * Build an agenda launch: a four-phase ActiveComposition attributed to the
 * notable, plus the world-flag deltas that arm phase 1. Pure — the seeded
 * variantRng picks one prose variant per beat and bakes it into the phase
 * rationale so the runner's Chronicle entry is attributed.
 */
export function buildNotableAgenda(
  notableId: string,
  notableName: string,
  factionName: string,
  family: NotableAgendaFamily,
  launchTick: number,
  targetId: string | undefined,
  targetName: string | undefined,
  variantRng: () => number,
): AgendaLaunchPlan {
  const compositionId = `notable-agenda-${notableId}-${family.id}-t${launchTick}`;
  const boundTargetName = targetName ?? 'the reach';

  const phases: Phase[] = family.beats.map((beat) => {
    const variants = beat.proseVariants;
    const chosen = variants[Math.floor(variantRng() * variants.length)] ?? variants[0];
    return {
      id: beat.phaseId,
      activatesAt: {
        op: 'world-flag',
        key: agendaFlags.ready(compositionId, beat.phaseId),
        value: true,
      },
      activates: [],
      rationale: substituteAgendaProse(chosen, notableName, factionName, boundTargetName),
    };
  });

  const composition: ActiveComposition = {
    compositionId,
    firedAtTick: launchTick,
    activatedPhaseIds: [],
    phaseActivationTicks: {},
    resolvedNodes: targetId ? { target: targetId } : {},
    status: 'active',
    lastEvaluationTick: launchTick,
    phases,
    sponsorNotableId: notableId,
    agendaFamily: family.id,
  };

  const worldFlagUpdates: Record<string, unknown> = {
    [agendaFlags.ready(compositionId, family.beats[0].phaseId)]: true,
    [agendaFlags.invest(compositionId)]: 0,
    [agendaFlags.lastLaunch(notableId)]: launchTick,
  };

  return { composition, worldFlagUpdates };
}

// ─── Counter-play detection ────────────────────────────────────────────────

/** True when the player has pushed back on an agenda's target (same surface
 *  as rival-scheme counter-play: control/holding the target, or a thread to
 *  someone standing there). */
function detectAgendaCounter(
  state: GameState,
  composition: ActiveComposition,
): { countered: boolean; byActorId?: string } {
  const targetId = composition.resolvedNodes.target;
  if (!targetId) return { countered: false };
  const targetNode = state.graph.getNode(targetId);
  if (!targetNode) return { countered: true }; // target destroyed → agenda loses its ground
  const ascendantId = state.ascendantId;
  if (!ascendantId) return { countered: false };
  // Actor target (feud): a player thread to the target notable is protection.
  if (targetNode.type === 'actor') {
    const threads = state.graph.getIncomingEdges(targetId, 'thread');
    if (threads.some((e) => e.source === ascendantId)) {
      return { countered: true, byActorId: targetId };
    }
    return { countered: false };
  }
  for (const type of ['controls', 'holds_place_of_power'] as const) {
    const inc = state.graph.getIncomingEdges(targetId, type);
    const hit = inc.find((e) => e.source === ascendantId);
    if (hit) return { countered: true, byActorId: ascendantId };
  }
  const occupants = state.graph.getIncomingEdges(targetId, 'located_at');
  for (const occ of occupants) {
    const threads = state.graph.getIncomingEdges(occ.source, 'thread');
    if (threads.some((e) => e.source === ascendantId)) {
      return { countered: true, byActorId: occ.source };
    }
  }
  return { countered: false };
}

// ─── Campaign: the war hand-off ────────────────────────────────────────────

/**
 * Raise a real army for the notable's campaign: the notable commands it in
 * person, the objective is `conquer` on the campaign's target, and the
 * shipped army/battle/siege machinery owns everything from here — the agenda
 * only narrates. Fail-soft no-op when the faction is spawn-ineligible
 * (army cap, missing commander position, etc.); the muster beat then stays
 * narration-only, which is a bluff the world can survive.
 */
function raiseCampaignArmy(
  state: GameState,
  notableId: string,
  compositionId: string,
  targetId: string,
): void {
  const graph = state.graph;
  const factionId =
    graph.getOutgoingEdges(notableId, 'leads')[0]?.target ??
    graph.getOutgoingEdges(notableId, 'member_of')[0]?.target;
  if (!factionId) return;

  // Campaign-specific eligibility: the shipped isEligibleForArmySpawn requires
  // the faction's CURRENT ambition to be military, but the campaign itself is
  // the military intent. Army cap and gold gate stay; the ambition-type check
  // is what the campaign replaces.
  let existingArmyCount = 0;
  for (const edge of graph.getIncomingEdges(factionId, 'member_of')) {
    if (graph.getNode(edge.source)?.properties.armyState) existingArmyCount++;
  }
  if (existingArmyCount >= MAX_ARMIES_PER_FACTION) return;
  const goldTier = computeTier(computeCapability(graph, factionId, 'gold'));
  if (goldTier < ARMY_SPAWN_GOLD_TIER_MIN) return;

  // The notable commands in person when iron-capable and not already
  // commanding; otherwise their best marshal leads in their name.
  let commanderId: string | null = null;
  const notableIronTier = computeTier(computeCapability(graph, notableId, 'iron'));
  const alreadyCommanding = graph.getIncomingEdges(notableId, 'commanded_by').length > 0;
  if (notableIronTier >= ARMY_SPAWN_IRON_TIER_MIN && !alreadyCommanding) {
    commanderId = notableId;
  } else {
    commanderId = selectCommander(state, factionId);
  }
  if (!commanderId) return;

  const factionNode = graph.getNode(factionId);
  const ambitionId = `amb_campaign_${notableId}_${state.tick}`;
  graph.addNode({
    id: ambitionId,
    type: 'ambition',
    name: `${factionNode?.name ?? factionId} — campaign`,
    properties: {
      ambitionType: 'territorial_expansion',
      priority: 0.7,
      targetNodeId: targetId,
      grievanceDecay: 0,
      createdTick: state.tick,
      compositionId,
    },
  });

  const armyId = spawnArmy(state, factionId, commanderId, ambitionId);
  if (!armyId) return;

  // Point the army at the campaign's target (spawnArmy defaults to the
  // nearest hostile settlement; the campaign has a declared object).
  const armyNode = graph.getNode(armyId);
  const armyState = armyNode?.properties.armyState as
    | { objective: unknown }
    | undefined;
  if (armyNode && armyState) {
    graph.updateNode(armyId, {
      properties: {
        ...armyNode.properties,
        armyState: {
          ...armyState,
          objective: { type: 'conquer', targetNodeId: targetId, estimatedAttrition: 0 },
        },
      },
    });
  }
}

// ─── Succession: heir anointment ───────────────────────────────────────────

/**
 * Anoint a deterministic heir for the notable's faction: the lowest-id living
 * individual member who is not the notable and holds no will_succeed edge yet.
 * No-op (fail-soft) when the faction already has an anointed successor or has
 * no eligible member — the naming beat stays narration-only in that case.
 */
function anointDeterministicHeir(
  state: GameState,
  notableId: string,
  compositionId: string,
): void {
  const graph = state.graph;
  const factionId = graph.getOutgoingEdges(notableId, 'leads')[0]?.target
    ?? graph.getOutgoingEdges(notableId, 'member_of')[0]?.target;
  if (!factionId) return;
  if (graph.getIncomingEdges(factionId, 'will_succeed').length > 0) return;

  const memberIds = graph
    .getIncomingEdges(factionId, 'member_of')
    .map((e) => e.source)
    .filter((id) => id !== notableId)
    .filter((id) => {
      // Death removes the node entirely (phaseFactionSuccession convention),
      // so node existence = living.
      const n = graph.getNode(id);
      return (
        n?.type === 'actor' &&
        n.properties.actorType === 'individual' &&
        n.properties.armyState == null
      );
    })
    .sort((a, b) => a.localeCompare(b));
  const heirId = memberIds[0];
  if (!heirId) return;

  graph.addEdge({
    id: `edge_will_succeed_${heirId}_${factionId}`,
    source: heirId,
    target: factionId,
    type: 'will_succeed',
    properties: {
      anointedTick: state.tick,
      anointedBy: notableId,
      compositionId,
    },
  });
}

// ─── The tick phase ────────────────────────────────────────────────────────

function readNum(flags: Record<string, unknown>, key: string): number {
  const v = flags[key];
  return typeof v === 'number' ? v : 0;
}

/**
 * Maintain active notable agendas (execute moves, counter-play, invest) and,
 * on roster ticks, launch new agendas up to MAX_ACTIVE_NOTABLE_AGENDAS.
 * Runs after phaseRivalActions in the orchestrator.
 */
export function phaseNotableAgendas(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 53);
  const events: TickEvent[] = [];
  const spherePressures: SpherePressureEvent[] = [];
  const worldFlags: Record<string, unknown> = { ...(state.worldFlags ?? {}) };
  let activeCompositions: ActiveComposition[] = [...(state.activeCompositions ?? [])];

  const agendaComps = activeCompositions.filter(
    (c) => c.sponsorNotableId && c.agendaFamily && c.status !== 'failed',
  );

  // ── 1. Maintain each live agenda ──
  for (const active of agendaComps) {
    const family = getNotableAgendaFamily(active.agendaFamily!);
    if (!family) continue; // fail-soft: unknown family
    const compId = active.compositionId;
    const notableId = active.sponsorNotableId!;
    const notableNode = state.graph.getNode(notableId);
    const notableName = notableNode?.name ?? 'a notable';
    const targetId = active.resolvedNodes.target;
    const targetNode = targetId ? state.graph.getNode(targetId) : undefined;
    const targetName = targetNode?.name;
    const pressureTarget = targetNode && targetId ? targetId : notableId;
    const sphere: SphereName = family.sphereLean[0] ?? 'order';

    // 1a. Execute the concrete move for each activated-but-not-yet-moved phase.
    for (const phaseId of active.activatedPhaseIds) {
      const doneKey = agendaFlags.moveDone(compId, phaseId);
      if (worldFlags[doneKey] === true) continue;
      const beat = family.beats.find((b) => b.phaseId === phaseId);
      if (!beat) {
        worldFlags[doneKey] = true;
        continue;
      }
      try {
        switch (beat.move) {
          case 'rumor':
            break; // narration only — the runner emits the Chronicle beat
          case 'materialize': {
            // Succession's naming is mechanically real: anoint a deterministic
            // heir via a will_succeed edge, which phaseFactionSuccession
            // consumes when the seat next empties.
            if (family.id === 'succession') {
              anointDeterministicHeir(state, notableId, compId);
            }
            if (family.id === 'campaign' && targetId) {
              raiseCampaignArmy(state, notableId, compId, targetId);
            }
            if (targetNode && targetId) {
              // Location targets bind sponsors_scheme (schema: actor→location);
              // actor targets (feud) bind hostile_to — the existing inter-actor
              // hostility edge, which is what a declared feud is.
              const edgeType =
                targetNode.type === 'actor' ? ('hostile_to' as const) : ('sponsors_scheme' as const);
              const edgeId = `edge_${edgeType}_${notableId}_${compId}`;
              const exists = state.graph
                .getOutgoingEdges(notableId, edgeType)
                .some((e) => e.id === edgeId);
              if (!exists) {
                state.graph.addEdge({
                  id: edgeId,
                  source: notableId,
                  target: targetId,
                  type: edgeType,
                  properties: {
                    compositionId: compId,
                    family: family.id,
                    sponsorKind: 'notable',
                    establishedTick: state.tick,
                  },
                });
              }
            }
            spherePressures.push({
              targetEntityId: pressureTarget,
              sphere,
              magnitude: NOTABLE_AGENDA_SPHERE_PRESSURE_PER_PHASE,
              source: 'notable',
              sourceId: notableId,
            });
            break;
          }
          case 'escalate':
            spherePressures.push({
              targetEntityId: pressureTarget,
              sphere,
              magnitude: NOTABLE_AGENDA_SPHERE_PRESSURE_PER_PHASE,
              source: 'notable',
              sourceId: notableId,
            });
            break;
          case 'crack': {
            spherePressures.push({
              targetEntityId: pressureTarget,
              sphere,
              magnitude:
                NOTABLE_AGENDA_SPHERE_PRESSURE_PER_PHASE *
                NOTABLE_AGENDA_CRACK_PRESSURE_MULTIPLIER,
              source: 'notable',
              sourceId: notableId,
            });
            events.push({
              id: `notable_agenda_crack_${compId}_${state.tick}`,
              tick: state.tick,
              type: 'rival_action',
              message: `${notableName}'s ${family.label.toLowerCase()} comes due over ${targetName ?? 'the reach'}.`,
              significance: 0.8,
              notification: { channel: 'toast' },
            });
            break;
          }
        }
      } catch {
        emitTrace({
          category: 'engine_warning' as const,
          tick: state.tick,
          summary: `notable.agenda_move_failed ${compId}/${phaseId}`,
        });
      }
      worldFlags[doneKey] = true;
      emitNotableTrace({
        category: 'notable.agenda_phase_advanced' as const,
        tick: state.tick,
        summary: `${notableName} advances ${family.id}/${phaseId} (${beat.move})`,
        notableId,
        compositionId: compId,
        phaseId,
        move: beat.move,
        targetNodeId: targetId,
      });
    }

    // Completion noting — runner marks status 'completed' when all phases fired.
    if (active.status === 'completed') {
      const notedKey = agendaFlags.completedNoted(compId);
      if (worldFlags[notedKey] !== true) {
        worldFlags[notedKey] = true;
        emitNotableTrace({
          category: 'notable.agenda_completed' as const,
          tick: state.tick,
          summary: `${notableName}'s ${family.id} agenda completed`,
          notableId,
          compositionId: compId,
        });
      }
      continue;
    }

    // Thread-takeover: a threaded sponsor's agenda freezes (no counter churn,
    // no invest) — the player's attention displaces autonomy.
    if (isThreadedByPlayer(state, notableId)) continue;

    // 1b. Counter-play detection.
    const stallUntil = readNum(worldFlags, agendaFlags.stallUntil(compId));
    if (stallUntil > state.tick) continue;
    const counter = detectAgendaCounter(state, active);
    if (counter.countered) {
      const counters = readNum(worldFlags, agendaFlags.counters(compId)) + 1;
      worldFlags[agendaFlags.counters(compId)] = counters;
      if (counters >= NOTABLE_AGENDA_COUNTERS_TO_FAIL) {
        activeCompositions = activeCompositions.map((c) =>
          c.compositionId === compId ? { ...c, status: 'failed' as const } : c,
        );
        for (const edgeId of [
          `edge_sponsors_scheme_${notableId}_${compId}`,
          `edge_hostile_to_${notableId}_${compId}`,
        ]) {
          try {
            state.graph.removeEdge(edgeId);
          } catch {
            /* fail-soft: edge may not exist yet */
          }
        }
        emitNotableTrace({
          category: 'notable.agenda_countered' as const,
          tick: state.tick,
          summary: `${notableName}'s ${family.id} agenda failed`,
          notableId,
          compositionId: compId,
          outcome: 'failed' as const,
          byActorId: counter.byActorId,
        });
      } else {
        const nextBeat = family.beats.find(
          (b) => !active.activatedPhaseIds.includes(b.phaseId),
        );
        if (nextBeat) worldFlags[agendaFlags.ready(compId, nextBeat.phaseId)] = false;
        worldFlags[agendaFlags.invest(compId)] = 0;
        worldFlags[agendaFlags.stallUntil(compId)] = state.tick + NOTABLE_AGENDA_STALL_TICKS;
        emitNotableTrace({
          category: 'notable.agenda_countered' as const,
          tick: state.tick,
          summary: `${notableName}'s ${family.id} agenda stalled`,
          notableId,
          compositionId: compId,
          outcome: 'stalled' as const,
          byActorId: counter.byActorId,
        });
      }
      continue;
    }

    // 1c. Investment → arm the next phase once the previous one has fired.
    const readyCount = family.beats.filter(
      (b) => worldFlags[agendaFlags.ready(compId, b.phaseId)] === true,
    ).length;
    if (readyCount < family.beats.length) {
      const invest = readNum(worldFlags, agendaFlags.invest(compId)) + 1;
      const nextBeat = family.beats[readyCount];
      const prevBeat = family.beats[readyCount - 1];
      const prevFired = prevBeat
        ? active.activatedPhaseIds.includes(prevBeat.phaseId) &&
          worldFlags[agendaFlags.moveDone(compId, prevBeat.phaseId)] === true
        : true;
      if (invest >= NOTABLE_AGENDA_PHASE_INVEST_TICKS && nextBeat && prevFired) {
        worldFlags[agendaFlags.ready(compId, nextBeat.phaseId)] = true;
        worldFlags[agendaFlags.invest(compId)] = 0;
      } else {
        worldFlags[agendaFlags.invest(compId)] = invest;
      }
    }
  }

  // ── 2. Roster scan on cadence: launch new agendas up to budget ──
  if (state.tick % NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS === 0 && state.tick > 0) {
    const liveAgendas = activeCompositions.filter(
      (c) => c.sponsorNotableId && c.agendaFamily && c.status === 'active',
    );
    const busyNotables = new Set(liveAgendas.map((c) => c.sponsorNotableId!));
    const alreadyTargeted = new Set<string>();
    for (const c of activeCompositions) {
      if (c.status === 'active' && c.resolvedNodes.target) {
        alreadyTargeted.add(c.resolvedNodes.target);
      }
    }

    let slots = Math.max(0, MAX_ACTIVE_NOTABLE_AGENDAS - liveAgendas.length);
    let launched = 0;
    let skippedThreaded = 0;

    const allNotables = listNotables(state.graph);
    const candidates = allNotables
      .filter((n) => !busyNotables.has(n.notableId))
      .map((n) => ({
        ...n,
        prominence: scoreNotableProminence(state, n.notableId, n.factionId),
      }))
      .sort(
        (a, b) =>
          b.prominence - a.prominence || a.notableId.localeCompare(b.notableId),
      );

    for (const cand of candidates) {
      if (slots <= 0) break;
      if (isThreadedByPlayer(state, cand.notableId)) {
        skippedThreaded++;
        continue; // thread-takeover: threaded notables never launch autonomously
      }
      const lastLaunch = readNum(worldFlags, agendaFlags.lastLaunch(cand.notableId));
      if (lastLaunch > 0 && state.tick - lastLaunch < NOTABLE_AGENDA_LAUNCH_COOLDOWN_TICKS) {
        continue;
      }
      const family =
        NOTABLE_AGENDA_FAMILIES[Math.floor(rng() * NOTABLE_AGENDA_FAMILIES.length)] ??
        NOTABLE_AGENDA_FAMILIES[0];
      if (!family) break;
      let targetId: string | undefined;
      let targetName: string | undefined;
      const target = selectAgendaTarget(
        state,
        family,
        cand.notableId,
        cand.factionId,
        allNotables,
        alreadyTargeted,
      );
      if (target === undefined) continue; // no valid target — this notable sits out
      if (target !== 'none') {
        targetId = target.targetId;
        targetName = target.targetName;
      }
      const notableNode = state.graph.getNode(cand.notableId);
      const factionNode = state.graph.getNode(cand.factionId);
      const plan = buildNotableAgenda(
        cand.notableId,
        notableNode?.name ?? 'a notable',
        factionNode?.name ?? 'their faction',
        family,
        state.tick,
        targetId,
        targetName,
        rng,
      );
      activeCompositions = [...activeCompositions, plan.composition];
      Object.assign(worldFlags, plan.worldFlagUpdates);
      if (targetId) alreadyTargeted.add(targetId);
      slots--;
      launched++;
      emitNotableTrace({
        category: 'notable.agenda_launched' as const,
        tick: state.tick,
        summary: `${notableNode?.name ?? cand.notableId} launches ${family.id}${targetName ? ` against ${targetName}` : ''}`,
        notableId: cand.notableId,
        compositionId: plan.composition.compositionId,
        family: family.id,
        prominence: cand.prominence,
        targetNodeId: targetId,
      });
    }

    // ONE aggregate trace per scan — never per-notable (ring-buffer budget).
    emitNotableTrace({
      category: 'notable.roster_scan' as const,
      tick: state.tick,
      summary: `notable roster scan: ${candidates.length} scored, ${liveAgendas.length + launched} active, ${launched} launched`,
      candidatesScored: candidates.length,
      activeAgendas: liveAgendas.length + launched,
      launched,
      skippedThreaded,
    });
  }

  const result: Partial<GameState> = {
    worldFlags,
    activeCompositions,
  };
  if (events.length > 0) {
    result.tickEvents = [...(state.tickEvents ?? []), ...events];
  }
  if (spherePressures.length > 0) {
    result.pendingSpherePressures = [
      ...(state.pendingSpherePressures ?? []),
      ...spherePressures,
    ];
  }
  return result;
}
