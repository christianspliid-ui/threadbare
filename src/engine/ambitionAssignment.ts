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
import { findAmbitionTemplateById } from '../data/ambition-templates';
import { AMBITION_KIND_KEY, AMBITION_KIND_TEMPLATE } from './ambitionShape';
import { pullHolderIntoSpotlight, type SpotlightPullOptions, type SpotlightPullResult } from './spotlightPull';

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
  /**
   * What the spotlight pull did after the edge was written (THR-1348) — present only
   * when `assigned`. A pulled result carries the one chronicle event the caller
   * appends to the tick; the helper itself writes no events.
   */
  readonly pull?: SpotlightPullResult;
}

export interface AssignAmbitionOptions extends SpotlightPullOptions {
  readonly priority?: AmbitionPriority;
  readonly mintedByLabel?: string;
  /**
   * Further `pursues` edge properties, spread last — the mint lane's provenance
   * (`mintedByEventId`, `mintedByLabel`) and the grievance state that lives edge-side
   * because ambition nodes are shared per template (THR-726, THR-1298). Added so the
   * two writers `ambitionTick` carried inline could route through here without
   * changing a byte of what they write (THR-1348).
   */
  readonly extraProperties?: Readonly<Record<string, unknown>>;
  /**
   * Write the edge but do not run the spotlight pull. The one production caller is
   * the undertaking binder's support mint (`mintInhabitant`), whose contract is that a
   * clerk or fence minted for someone else's work is an *ambient* face and the same
   * person whatever tick the queue drains — a pull would change both. Whether a minted
   * extra should ever be a builder is the same question THR-1523 asks about newborns;
   * until it is answered the binder opts out here, explicitly, rather than by sitting
   * outside the helper.
   */
  readonly skipSpotlightPull?: boolean;
}

/**
 * Assign one ambition to one actor: find-or-create the shared ambition node, then
 * write the `pursues` edge — then let the spotlight pull run (THR-1348).
 *
 * **Extracted, not invented (THR-885).** This exact node+edge write was copied
 * three times inside `ambitionTick` and `agentLifecycle`, which is precisely why
 * nothing *outside* those phases could ever assign an ambition — reactive
 * ambition templates had no dispatcher at all (THR-812 / THR-726) and sat
 * unreachable. Callers outside the tick phase (the `assign_ambition` aftermath
 * effect, i.e. The Kindled Ambition card) route through here so a card-planted
 * ambition and a world-minted one are byte-identical on the graph.
 *
 * **The one hook (THR-1348).** `ambitionTick`'s two inline writers — the
 * mint-to-holder write and the re-evaluation write — now route through here too, so
 * a card-planted, world-minted, birth-assigned and re-evaluated ambition all pass
 * `pullHolderIntoSpotlight` once, at assignment. Templates are resolved across all
 * three pools (`findAmbitionTemplateById`) because the mint lane assigns from the
 * event-minted and grievance pools, which `AMBITION_TEMPLATES` alone does not hold.
 *
 * Fail-soft: every rejection is a returned reason, never a throw — the tick loop
 * must not crash on a card naming a template that was retired (NFP #4).
 */
export function assignAmbitionToActor(
  graph: WorldGraph,
  actorId: string,
  templateId: string,
  tick: number,
  options: AssignAmbitionOptions = {},
): AmbitionAssignmentResult {
  if (!graph.getNode(actorId)) return { assigned: false, reason: 'actor_missing' };

  const template = findAmbitionTemplateById(templateId);
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
        [AMBITION_KIND_KEY]: AMBITION_KIND_TEMPLATE,
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
      ...(options.extraProperties ?? {}),
    },
  });

  // Attention follows ambition (THR-1348): after the edge, never before — the pull
  // reads the holder's own ambitions when it decides who may step back.
  const pull: SpotlightPullResult = options.skipSpotlightPull
    ? { pulled: false, reason: 'not_applicable' }
    : pullHolderIntoSpotlight(graph, actorId, templateId, tick, {
        rng: options.rng,
        seed: options.seed,
        busyActorIds: options.busyActorIds,
        followedAgentIds: options.followedAgentIds,
        projects: options.projects,
        unwatchedBuildersEnabled: options.unwatchedBuildersEnabled,
      });

  return { assigned: true, priority, ambitionNodeId, pull };
}

/**
 * Did this assignment spend the holder's one pull for the batch (THR-1523 §5)? True
 * once the pull ran at all — pulled or refused. A batch (a newborn's two wants, one
 * re-evaluation pass) passes `skipSpotlightPull` to every later assignment after this
 * reads true, so a refused holder is refused once, not once per want, and the census
 * counts mortals rather than wants.
 */
export function spentSpotlightPull(result: AmbitionAssignmentResult): boolean {
  if (!result.assigned || !result.pull) return false;
  return result.pull.pulled || result.pull.reason !== 'not_applicable';
}
