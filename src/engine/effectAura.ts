/**
 * Effect Aura — proximity-based effect propagation.
 *
 * Calculates which aura effects from which source agents apply to which
 * target agents based on hex distance and faction filtering.
 *
 * Also handles reactive effect trigger evaluation — checks incoming events
 * against reactive effect triggers and fires them when appropriate.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name             | Default | Purpose                          |
 * |------------------|---------|----------------------------------|
 * | AURA_MAX_RADIUS  | 2       | Max hex radius for aura effects  |
 *
 * ─── Fail-soft ──────────────────────────────────────────────────
 * | Failure case              | Fallback                         |
 * |---------------------------|----------------------------------|
 * | Aura radius > cap         | Clamp to AURA_MAX_RADIUS         |
 * | No hex position for agent | Skip agent (no aura contribution)|
 * | Unknown faction filter    | Treat as 'all'                   |
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { WorldGraph } from './graph';
import type {
  AttachmentEffect,
  AuraEffect,
  AuraEntry,
  ReactiveEffect,
  EffectRuntimeState,
} from '../types/effects';
import { areFactionsHostile } from './factionNetwork';
import { AURA_MAX_RADIUS } from '../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Hex Distance
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute hex distance between two offset coordinates.
 * Uses axial conversion for accurate hex distance.
 */
function hexDistance(
  col1: number, row1: number,
  col2: number, row2: number,
): number {
  // Convert offset to axial (odd-r layout)
  const q1 = col1 - Math.floor(row1 / 2);
  const r1 = row1;
  const q2 = col2 - Math.floor(row2 / 2);
  const r2 = row2;

  // Cube distance
  const dq = q2 - q1;
  const dr = r2 - r1;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

// ═══════════════════════════════════════════════════════════════════
// Agent Position Resolution
// ═══════════════════════════════════════════════════════════════════

export interface AgentPosition {
  agentId: string;
  hexCol: number;
  hexRow: number;
  factionId?: string;
}

/**
 * Resolve an agent to the hex it stands on, via its single `located_at` edge.
 *
 * Exported since THR-1243 because resolution-time aura collection needs the
 * *target's* position before it can decide which emitters are near enough to be
 * worth walking — the same read, so an emitter and its target can never be
 * measured on two different position models.
 */
export function resolveAgentPosition(
  graph: WorldGraph,
  agentId: string,
): AgentPosition | null {
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locEdges.length === 0) return null;

  const locNode = graph.getNode(locEdges[0].target);
  if (!locNode) return null;

  let hexCol = locNode.properties.hexCol as number | undefined;
  let hexRow = locNode.properties.hexRow as number | undefined;

  // Resolve up from sublocation to parent location
  if (hexCol === undefined && locNode.properties.parentLocationId) {
    const parentId = locNode.properties.parentLocationId as string;
    const parentNode = graph.getNode(parentId);
    if (parentNode) {
      hexCol = parentNode.properties.hexCol as number | undefined;
      hexRow = parentNode.properties.hexRow as number | undefined;
    }
  }

  if (hexCol === undefined || hexRow === undefined) return null;

  const agentNode = graph.getNode(agentId);
  const factionId = agentNode?.properties.factionId as string | undefined;

  return { agentId, hexCol, hexRow, factionId };
}

// ═══════════════════════════════════════════════════════════════════
// Aura Collection
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all aura effects from all agents on the map.
 * Returns aura entries with source positions and parameters.
 */
export function collectAuraEffects(
  graph: WorldGraph,
): AuraEntry[] {
  const entries: AuraEntry[] = [];

  const agents = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  for (const agent of agents) {
    const pos = resolveAgentPosition(graph, agent.id);
    if (!pos) continue;

    // Walk attachment edges looking for aura effects
    const edgeTypes = ['possesses', 'bonded_to', 'has_trait'] as const;
    for (const edgeType of edgeTypes) {
      const edges = graph.getOutgoingEdges(agent.id, edgeType);
      for (const edge of edges) {
        const node = graph.getNode(edge.target);
        if (!node) continue;

        const effects = node.properties.effects as AttachmentEffect[] | undefined;
        if (!effects) continue;

        for (const effect of effects) {
          if (effect.type !== 'aura') continue;
          const aura = effect as AuraEffect;

          entries.push({
            sourceAgentId: agent.id,
            sourceAttachmentId: node.id,
            sourceFactionId: pos.factionId,
            radius: Math.min(aura.radius, AURA_MAX_RADIUS),
            targetFilter: aura.target,
            reach: aura.reach,
            value: aura.value,
            sourceHexCol: pos.hexCol,
            sourceHexRow: pos.hexRow,
          });
        }
      }
    }
  }

  return entries;
}

/**
 * Collect aura effects from emitters near enough to reach `targetPos` (THR-1243).
 *
 * The same walk as {@link collectAuraEffects}, with the distance test moved
 * *before* the attachment walk. That ordering is the whole point: resolving an
 * agent's position is one edge lookup and one or two node reads, while walking
 * its three attachment edge types and every attached node's `effects` array is
 * several times that. Testing distance first means the expensive half runs only
 * for the handful of agents standing within {@link AURA_MAX_RADIUS}, which is
 * what makes a resolution-time aura read affordable at all — the alternative,
 * collecting every aura on the map on every step resolution, costs more per
 * resolution than the per-tick proximity scan the plan ruled out.
 *
 * Pre-filters at the hard cap rather than at each aura's own radius, because the
 * per-aura radius test still belongs to {@link resolveAuraModifiers} — this
 * function only decides whose attachments are worth reading.
 */
export function collectAuraEffectsNear(
  graph: WorldGraph,
  targetPos: AgentPosition,
  maxRadius: number = AURA_MAX_RADIUS,
): AuraEntry[] {
  const entries: AuraEntry[] = [];

  const agents = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');

  for (const agent of agents) {
    if (agent.id === targetPos.agentId) continue;

    const pos = resolveAgentPosition(graph, agent.id);
    if (!pos) continue;

    const dist = hexDistance(pos.hexCol, pos.hexRow, targetPos.hexCol, targetPos.hexRow);
    if (dist > maxRadius) continue;

    for (const edgeType of ['possesses', 'bonded_to', 'has_trait'] as const) {
      const edges = graph.getOutgoingEdges(agent.id, edgeType);
      for (const edge of edges) {
        const node = graph.getNode(edge.target);
        if (!node) continue;

        const effects = node.properties.effects as AttachmentEffect[] | undefined;
        if (!effects) continue;

        for (const effect of effects) {
          if (effect.type !== 'aura') continue;
          const aura = effect as AuraEffect;

          entries.push({
            sourceAgentId: agent.id,
            sourceAttachmentId: node.id,
            sourceFactionId: pos.factionId,
            radius: Math.min(aura.radius, AURA_MAX_RADIUS),
            targetFilter: aura.target,
            reach: aura.reach,
            value: aura.value,
            sourceHexCol: pos.hexCol,
            sourceHexRow: pos.hexRow,
          });
        }
      }
    }
  }

  return entries;
}

/**
 * Whether one aura entry reaches one target — distance, self-exclusion, faction.
 *
 * Extracted (THR-1243) so emitter *selection* and modifier *aggregation* ask the
 * same question. A cap that ranked entries by a slightly different predicate than
 * the one that later sums them would silently drop an emitter that does apply
 * while keeping one that does not.
 */
export function auraApplies(
  graph: WorldGraph,
  aura: AuraEntry,
  targetAgentId: string,
  targetPos: AgentPosition,
): boolean {
  // Don't apply aura to its own source
  if (aura.sourceAgentId === targetAgentId) return false;

  // Check hex distance
  const dist = hexDistance(
    aura.sourceHexCol, aura.sourceHexRow,
    targetPos.hexCol, targetPos.hexRow,
  );
  if (dist > aura.radius) return false;

  // Check faction filter
  if (aura.targetFilter === 'allies') {
    if (!aura.sourceFactionId || aura.sourceFactionId !== targetPos.factionId) return false;
  } else if (aura.targetFilter === 'enemies') {
    if (!areFactionsHostile(graph, aura.sourceFactionId, targetPos.factionId)) return false;
  }

  return true;
}

/**
 * Resolve which aura effects apply to a specific agent.
 * Returns the total per-reach modifier from all applicable auras.
 */
export function resolveAuraModifiers(
  graph: WorldGraph,
  auras: readonly AuraEntry[],
  targetAgentId: string,
  targetPos: AgentPosition,
): Partial<Record<string, number>> {
  const modifiers: Record<string, number> = {};

  for (const aura of auras) {
    if (!auraApplies(graph, aura, targetAgentId, targetPos)) continue;
    modifiers[aura.reach] = (modifiers[aura.reach] ?? 0) + aura.value;
  }

  return modifiers;
}

/**
 * The at-most-`cap` emitters whose auras actually reach the target, strongest
 * first — THR-1243's stacking bound.
 *
 * Grouped by *source agent* rather than by aura entry, so one neighbour carrying
 * three aura items counts once against the cap. Ranking is by the magnitude the
 * emitter contributes to `reach`, with the emitter id as tie-break, so the same
 * world always selects the same emitters (NFP #3) — insertion order alone would
 * make the survivors depend on graph node order, which shifts as agents are born
 * and die for reasons unconnected to who is standing nearby.
 *
 * Returns the surviving entries, still unsummed, so the caller can name each
 * emitter's own contribution rather than one anonymous total.
 */
export function selectAuraEmitters(
  graph: WorldGraph,
  auras: readonly AuraEntry[],
  targetAgentId: string,
  targetPos: AgentPosition,
  reach: string,
  cap: number,
): Map<string, AuraEntry[]> {
  const byEmitter = new Map<string, AuraEntry[]>();

  for (const aura of auras) {
    if (aura.reach !== reach) continue;
    if (!auraApplies(graph, aura, targetAgentId, targetPos)) continue;
    const bucket = byEmitter.get(aura.sourceAgentId);
    if (bucket) bucket.push(aura);
    else byEmitter.set(aura.sourceAgentId, [aura]);
  }

  if (byEmitter.size <= cap) return byEmitter;

  const ranked = [...byEmitter.entries()]
    .map(([emitterId, entries]) => ({
      emitterId,
      entries,
      magnitude: Math.abs(entries.reduce((sum, e) => sum + e.value, 0)),
    }))
    .sort((a, b) =>
      b.magnitude - a.magnitude || (a.emitterId < b.emitterId ? -1 : a.emitterId > b.emitterId ? 1 : 0))
    .slice(0, Math.max(0, cap));

  return new Map(ranked.map(r => [r.emitterId, r.entries]));
}

// ═══════════════════════════════════════════════════════════════════
// Reactive Effect Evaluation
// ═══════════════════════════════════════════════════════════════════

export interface ReactiveCheckResult {
  fired: boolean;
  effect?: AttachmentEffect;
  duration?: number;
  attachmentId: string;
  trigger: string;
}

/**
 * Check if any reactive effects should fire for an incoming event.
 *
 * @param graph - World graph
 * @param agentId - Agent receiving the event
 * @param eventTrigger - What happened (attacked, damaged, etc.)
 * @param tick - Current tick
 * @param effectStates - Runtime states for cooldown tracking
 */
export function checkReactiveEffects(
  graph: WorldGraph,
  agentId: string,
  eventTrigger: string,
  tick: number,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): ReactiveCheckResult[] {
  const results: ReactiveCheckResult[] = [];

  const edgeTypes = ['possesses', 'bonded_to', 'has_trait'] as const;
  for (const edgeType of edgeTypes) {
    const edges = graph.getOutgoingEdges(agentId, edgeType);
    for (const edge of edges) {
      const node = graph.getNode(edge.target);
      if (!node) continue;

      const effects = node.properties.effects as AttachmentEffect[] | undefined;
      if (!effects) continue;

      for (const effect of effects) {
        if (effect.type !== 'reactive') continue;
        const reactive = effect as ReactiveEffect;

        // Check trigger match
        if (reactive.trigger !== eventTrigger) continue;

        // Check cooldown
        const state = effectStates?.get(node.id);
        if (state?.reactiveLastTriggeredTick !== undefined && reactive.cooldown) {
          const elapsed = tick - state.reactiveLastTriggeredTick;
          if (elapsed < reactive.cooldown) continue; // Still on cooldown
        }

        results.push({
          fired: true,
          effect: reactive.effect,
          duration: reactive.duration,
          attachmentId: node.id,
          trigger: eventTrigger,
        });
      }
    }
  }

  return results;
}
