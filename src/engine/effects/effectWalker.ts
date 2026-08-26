/**
 * Effect Walker — shared attachment effect collector.
 *
 * All effect handlers (resolver, tick, events, queries) need to walk an agent's
 * attachment edges and collect effects. This module provides that shared infrastructure.
 *
 * Design doc: Docs/plans/2026-04-05-effect-primitive-architecture.md
 */

import type { WorldGraph } from '../graph';
import type { AttachmentEffect, EffectRuntimeState } from '../../types/effects';
import {
  MAX_EFFECTS_PER_ATTACHMENT,
  ACTION_TRIGGER_MAX_PER_ATTACHMENT,
} from '../../data/effect-constants';

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

/** Edge types that can carry attachments with effects. */
export const ATTACHMENT_EDGE_TYPES = ['possesses', 'bonded_to', 'has_trait'] as const;

/**
 * Maximum effects read per attachment (content guard).
 *
 * THR-1242: this was a private `MAX_EFFECTS_PER_NODE = 12` while
 * `MAX_EFFECTS_PER_ATTACHMENT = 6` sat in `effect-constants` with a CMS row and
 * no enforcement anywhere. Two numbers for one idea, and the one in force was
 * the one nobody could tune — the same duplicate-spelling pathology this stage
 * removes from the effect vocabulary, one layer down. The declared constant is
 * now the one the walker obeys.
 */
const MAX_EFFECTS_PER_NODE = MAX_EFFECTS_PER_ATTACHMENT;

/**
 * Max `action_trigger` effects honoured per attachment (THR-1242).
 *
 * Also promoted from advisory. `action_trigger` is the one primitive that fires
 * *actions* rather than modifying a number, so an attachment declaring six of
 * them is six action dispatches per qualifying event — the combinatorial case
 * the content guards exist for. Excess entries are dropped at the boundary
 * rather than at the dispatcher, so every downstream consumer sees the same
 * bounded list.
 */
const MAX_ACTION_TRIGGERS_PER_NODE = ACTION_TRIGGER_MAX_PER_ATTACHMENT;

/**
 * Apply both content guards to one attachment's authored effect list.
 *
 * Order matters: the `action_trigger` cap is applied *within* the surviving
 * slice, not before it, so the two guards compose the way a reader expects —
 * "at most N effects, of which at most M are triggers".
 */
function applyContentGuards(effects: readonly AttachmentEffect[]): AttachmentEffect[] {
  const bounded = effects.slice(0, MAX_EFFECTS_PER_NODE);
  let triggersSeen = 0;
  return bounded.filter(effect => {
    if (effect.type !== 'action_trigger') return true;
    triggersSeen += 1;
    return triggersSeen <= MAX_ACTION_TRIGGERS_PER_NODE;
  });
}

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

/** A single effect with its source attachment context. */
export interface AttachedEffect {
  readonly attachmentId: string;
  readonly attachmentName: string;
  readonly attachmentTier: number;
  readonly effect: AttachmentEffect;
  readonly runtimeState?: EffectRuntimeState;
}

// ═══════════════════════════════════════════════════════════════════
// Walker
// ═══════════════════════════════════════════════════════════════════

/**
 * Collect all effects from an agent's attachments.
 *
 * Walks possesses, bonded_to, and has_trait edges, reads effects[] from
 * each target node, pairs with runtime state from the effectStates map.
 *
 * Suppression: edges with `active === false` are skipped entirely —
 * this is the single suppression seam for inactive/overflowed attachments.
 *
 * Agreement edges: `relates_to` edges where `agreement` is truthy carry
 * effects on `edge.properties.effects` (not on a target node). These use
 * `edge.id` as attachment identity instead of a node ID.
 *
 * @param graph - World graph
 * @param agentId - Agent to collect for
 * @param effectStates - Per-attachment runtime state (cooldowns, stacks, etc.)
 * @returns All effects with source context
 */
export function collectAttachmentEffects(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): AttachedEffect[] {
  const entries: AttachedEffect[] = [];

  // ─── Node-backed attachments (possesses, bonded_to, has_trait) ───
  for (const edgeType of ATTACHMENT_EDGE_TYPES) {
    const edges = graph.getOutgoingEdges(agentId, edgeType);
    for (const edge of edges) {
      // Inactive suppression — skip deactivated attachments
      if (edge.properties.active === false) continue;

      const node = graph.getNode(edge.target);
      if (!node) continue;

      const effects = node.properties.effects as AttachmentEffect[] | undefined;
      if (!effects || !Array.isArray(effects)) continue;

      const attachmentName = node.name ?? node.id;
      const attachmentTier = (node.properties.tier as number) ?? 1;
      const runtimeState = effectStates?.get(node.id);
      const effectsToRead = applyContentGuards(effects);

      for (const effect of effectsToRead) {
        entries.push({
          attachmentId: node.id,
          attachmentName,
          attachmentTier,
          effect,
          runtimeState,
        });
      }
    }
  }

  // ─── Edge-backed agreements (relates_to with agreement === true) ───
  const relatesToEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  for (const edge of relatesToEdges) {
    if (!edge.properties.agreement) continue;
    if (edge.properties.active === false) continue;

    const effects = edge.properties.effects as AttachmentEffect[] | undefined;
    if (!effects || !Array.isArray(effects)) continue;

    const attachmentName = (edge.properties.agreementName as string) ?? 'Agreement';
    const attachmentTier = (edge.properties.tier as number) ?? 1;
    const runtimeState = effectStates?.get(edge.id);
    const effectsToRead = applyContentGuards(effects);

    for (const effect of effectsToRead) {
      entries.push({
        attachmentId: edge.id,
        attachmentName,
        attachmentTier,
        effect,
        runtimeState,
      });
    }
  }

  return entries;
}

/**
 * Check whether an agent has any attachments with the new effects[] format.
 * Used to determine whether to use the new resolver or legacy path.
 * Also checks agreement edges for edge-backed effects.
 */
export function hasEffectsFormat(
  graph: WorldGraph,
  agentId: string,
): boolean {
  for (const edgeType of ATTACHMENT_EDGE_TYPES) {
    const edges = graph.getOutgoingEdges(agentId, edgeType);
    for (const edge of edges) {
      if (edge.properties.active === false) continue;
      const node = graph.getNode(edge.target);
      if (!node) continue;
      const effects = node.properties.effects;
      if (effects && Array.isArray(effects) && effects.length > 0) {
        return true;
      }
    }
  }

  // Check agreement edges
  const relatesToEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  for (const edge of relatesToEdges) {
    if (!edge.properties.agreement) continue;
    if (edge.properties.active === false) continue;
    const effects = edge.properties.effects;
    if (effects && Array.isArray(effects) && effects.length > 0) {
      return true;
    }
  }

  return false;
}
