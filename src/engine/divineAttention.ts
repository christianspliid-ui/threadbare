/**
 * Divine Attention State — tracks divine focus/attunement/scrying on agents.
 *
 * Stored as `divineAttention` property on agent nodes. Read/written by
 * divine actions (Attune/Scry/Focus) and read by vignette notification system.
 *
 * --- Constants ---
 * | Name                   | Default | Purpose                                    |
 * |------------------------|---------|--------------------------------------------|
 * | ATTUNE_COST_DISCOUNT   | 0.3     | Essence cost reduction when attuned        |
 * | SCRY_DURATION_TICKS    | 10      | How long Scry grants awareness             |
 * | FOCUS_DURATION_TICKS   | 3       | How long Divine Focus lasts                |
 * | FOCUS_EFFICIENCY_BOOST | 0.4     | Bond efficiency bonus during Focus         |
 *
 * --- Fail-soft ---
 * | Failure                          | Fallback                      |
 * |----------------------------------|-------------------------------|
 * | Agent node missing               | Return DEFAULT_DIVINE_ATTENTION |
 * | divineAttention property missing | Return DEFAULT_DIVINE_ATTENTION |
 * | Expired attention found          | Clear to 'none', count as decayed |
 *
 * --- PRNG ---
 * None — attention state is deterministic.
 */

import type { WorldGraph } from './graph';

// --- Constants ---

export const ATTUNE_COST_DISCOUNT = 0.3;
export const SCRY_DURATION_TICKS = 10;
export const FOCUS_DURATION_TICKS = 3;
export const FOCUS_EFFICIENCY_BOOST = 0.4;

// --- Types ---

export interface DivineAttention {
  level: 'none' | 'scried' | 'attuned' | 'focused';
  costDiscount: number;
  efficiencyBoost: number;
  expiresAtTick?: number;
}

export const DEFAULT_DIVINE_ATTENTION: DivineAttention = {
  level: 'none',
  costDiscount: 0,
  efficiencyBoost: 0,
};

// --- Core Functions ---

/**
 * Read divine attention state from an agent node.
 * Returns DEFAULT_DIVINE_ATTENTION if agent not found or property missing.
 */
export function getDivineAttention(graph: WorldGraph, agentId: string): DivineAttention {
  const node = graph.getNode(agentId);
  if (!node) return { ...DEFAULT_DIVINE_ATTENTION };

  const attention = node.properties.divineAttention as DivineAttention | undefined;
  if (!attention) return { ...DEFAULT_DIVINE_ATTENTION };

  return {
    level: attention.level ?? 'none',
    costDiscount: attention.costDiscount ?? 0,
    efficiencyBoost: attention.efficiencyBoost ?? 0,
    expiresAtTick: attention.expiresAtTick,
  };
}

/**
 * Set divine attention state on an agent node.
 * No-op if agent not found.
 */
export function setDivineAttention(
  graph: WorldGraph,
  agentId: string,
  attention: DivineAttention,
): void {
  const node = graph.getNode(agentId);
  if (!node) return;

  graph.updateNode(agentId, {
    properties: { divineAttention: { ...attention } },
  });
}

/**
 * Decay expired divine attention across all actor nodes.
 * Walks all actors, clears attention where currentTick >= expiresAtTick.
 * Returns count of attention states that were decayed.
 */
export function decayDivineAttention(graph: WorldGraph, currentTick: number): number {
  let decayedCount = 0;

  const actors = graph.getNodesByType('actor');
  for (const actor of actors) {
    const attention = actor.properties.divineAttention as DivineAttention | undefined;
    if (!attention || attention.level === 'none') continue;

    if (attention.expiresAtTick !== undefined && currentTick >= attention.expiresAtTick) {
      graph.updateNode(actor.id, {
        properties: { divineAttention: { ...DEFAULT_DIVINE_ATTENTION } },
      });
      decayedCount++;
    }
  }

  return decayedCount;
}
