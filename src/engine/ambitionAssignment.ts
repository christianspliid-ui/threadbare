/**
 * Ambition Assignment — assigns initial ambitions to newly born agents.
 *
 * Wraps the selection funnel to produce 0-2 prioritized assignments
 * (1 primary + 0-1 secondary). Pure function — does not modify graph.
 */
import type { AmbitionTemplate, AmbitionPriority } from '../types/ambition';
import type { AmbitionAgentSnapshot } from './ambitionSelection';
import type { WorldGraph } from './graph';
import { selectAmbitions } from './ambitionSelection';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';

export interface AmbitionAssignment {
  templateId: string;
  priority: AmbitionPriority;
}

/**
 * Assign initial ambitions to a newly created agent.
 * Returns 0-2 assignments (1 primary + 0-1 secondary).
 * Pure function — does not modify graph.
 */
export function assignInitialAmbitions(
  templates: readonly AmbitionTemplate[],
  agent: AmbitionAgentSnapshot,
  seed: number,
): AmbitionAssignment[] {
  const selected = selectAmbitions(templates, agent, {
    maxAmbitions: 2,
    threshold: 0.0,
    seed,
  });

  return selected.map((s, i) => ({
    templateId: s.templateId,
    priority: (i === 0 ? 'primary' : 'secondary') as AmbitionPriority,
  }));
}

// ─── Graph-writing assignment (THR-885) ──────────────────────────────

/** Active ambitions an actor may pursue at once — the slot rule `ambitionTick` enforces. */
export const MAX_ACTIVE_AMBITIONS = 2;

export interface AmbitionAssignmentResult {
  /** False when the actor was missing, already pursued this template, or had no free slot. */
  readonly assigned: boolean;
  readonly reason?: 'actor_missing' | 'template_unknown' | 'already_pursued' | 'no_free_slot';
  /** Priority actually granted — present only when `assigned`. */
  readonly priority?: AmbitionPriority;
  /** Shared ambition node the `pursues` edge points at — present only when `assigned`. */
  readonly ambitionNodeId?: string;
}

/**
 * Assign one ambition to one actor: find-or-create the shared ambition node, then
 * write the `pursues` edge.
 *
 * **Extracted, not invented (THR-885).** This exact node+edge write was copied
 * three times inside `ambitionTick` and `agentLifecycle`, which is precisely why
 * nothing *outside* those phases could ever assign an ambition — reactive
 * ambition templates had no dispatcher at all (THR-812 / THR-726) and sat
 * unreachable. Callers outside the tick phase (the `assign_ambition` aftermath
 * effect, i.e. The Kindled Ambition card) route through here so a card-planted
 * ambition and a world-minted one are byte-identical on the graph.
 *
 * Fail-soft: every rejection is a returned reason, never a throw — the tick loop
 * must not crash on a card naming a template that was retired (NFP #4).
 */
export function assignAmbitionToActor(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  tick: number,
  options: { readonly priority?: AmbitionPriority; readonly mintedByLabel?: string } = {},
): AmbitionAssignmentResult {
  if (!graph.getNode(actorId)) return { assigned: false, reason: 'actor_missing' };

  const template = AMBITION_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return { assigned: false, reason: 'template_unknown' };

  const pursues = graph.getOutgoingEdges(actorId, 'pursues');
  const ambitionNodeId = `ambition.${templateId}`;
  if (pursues.some((e) => e.target === ambitionNodeId)) {
    return { assigned: false, reason: 'already_pursued' };
  }

  const activeCount = pursues.filter((e) => (e.properties.status as string) === 'active').length;
  if (activeCount >= MAX_ACTIVE_AMBITIONS) return { assigned: false, reason: 'no_free_slot' };

  if (!graph.getNode(ambitionNodeId)) {
    graph.addNode({
      id: ambitionNodeId,
      type: 'ambition',
      name: template.displayName ?? templateId,
      properties: {
        templateId,
        displayName: template.displayName ?? templateId,
        category: template.category ?? 'survival',
        reachAffinity: template.reachAffinity ?? {},
        totalMilestones: template.milestones.length ?? 0,
      },
    });
  }

  // Slot rule mirrors `ambitionTick`: first active ambition is primary.
  const priority: AmbitionPriority = options.priority ?? (activeCount === 0 ? 'primary' : 'secondary');

  graph.addEdge({
    id: `pursues_${actorId}_${ambitionNodeId}`,
    source: actorId,
    target: ambitionNodeId,
    type: 'pursues',
    properties: {
      priority,
      status: 'active',
      assignedTick: tick,
      completedMilestones: [],
      ...(options.mintedByLabel ? { mintedByLabel: options.mintedByLabel } : {}),
    },
  });

  return { assigned: true, priority, ambitionNodeId };
}
