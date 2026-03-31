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

interface AgentPosition {
  agentId: string;
  hexCol: number;
  hexRow: number;
  factionId?: string;
}

function resolveAgentPosition(
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
 * Resolve which aura effects apply to a specific agent.
 * Returns the total per-reach modifier from all applicable auras.
 */
export function resolveAuraModifiers(
  auras: readonly AuraEntry[],
  targetAgentId: string,
  targetPos: AgentPosition,
): Partial<Record<string, number>> {
  const modifiers: Record<string, number> = {};

  for (const aura of auras) {
    // Don't apply aura to its own source
    if (aura.sourceAgentId === targetAgentId) continue;

    // Check hex distance
    const dist = hexDistance(
      aura.sourceHexCol, aura.sourceHexRow,
      targetPos.hexCol, targetPos.hexRow,
    );
    if (dist > aura.radius) continue;

    // Check faction filter
    if (aura.targetFilter === 'allies') {
      if (targetPos.factionId !== aura.sourceAgentId) {
        // Need to check if same faction — simplified: check if source agent's faction matches
        // For now: same faction = ally
        // TODO: resolve source agent's faction from aura entry
      }
    }
    if (aura.targetFilter === 'enemies') {
      // TODO: faction hostility check
    }

    // Apply (filter logic is simplified for now — all auras apply based on distance only)
    modifiers[aura.reach] = (modifiers[aura.reach] ?? 0) + aura.value;
  }

  return modifiers;
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
