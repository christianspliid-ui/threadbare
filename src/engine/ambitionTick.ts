/**
 * Ambition Tick Processor — periodic milestone checking and re-evaluation.
 *
 * Runs every MILESTONE_CHECK_INTERVAL ticks to check active ambitions for
 * milestone completion, full completion, and abandonment. Runs re-evaluation
 * of empty ambition slots every AMBITION_REEVAL_INTERVAL ticks.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { ActiveAmbition } from '../types/ambition';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import { evaluateAmbitionProgress } from './ambitionLifecycle';
import { assignInitialAmbitions } from './ambitionAssignment';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import { emitTrace } from './traceBuffer';
import type { AmbitionAgentSnapshot } from './ambitionSelection';

// ─── Tunable Constants ───────────────────────────────────────────

/** Check milestones every N ticks */
export const MILESTONE_CHECK_INTERVAL = 15;

/** Re-evaluate empty ambition slots every N ticks */
export const AMBITION_REEVAL_INTERVAL = 25;

// ─── ID Generation ───────────────────────────────────────────────

let ambitionEventCounter = 0;
function nextAmbitionEventId(): string {
  return `amb_evt_${++ambitionEventCounter}`;
}

/** Reset for testing */
export function resetAmbitionEventCounter(): void {
  ambitionEventCounter = 0;
}

// ─── Main Phase Function ─────────────────────────────────────────

export function phaseAmbitionProgress(state: GameState): Partial<GameState> {
  // Only run on milestone check intervals
  if (state.tick % MILESTONE_CHECK_INTERVAL !== 0) {
    return {};
  }

  const { graph, tick } = state;
  const newEvents: TickEvent[] = [];

  // Get all individual actors
  const actors = graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual',
  );

  for (const actor of actors) {
    // Get active pursues edges
    const pursuesEdges = graph.getOutgoingEdges(actor.id, 'pursues');
    const activeEdges = pursuesEdges.filter(
      e => (e.properties.status as string) === 'active',
    );

    // ── Evaluate each active ambition ──
    for (const edge of activeEdges) {
      const ambitionNode = graph.getNode(edge.target);
      if (!ambitionNode) continue; // fail-soft

      const templateId = ambitionNode.properties.templateId as string;
      if (!templateId) continue; // fail-soft

      const template = AMBITION_TEMPLATES.find(t => t.id === templateId);
      if (!template) continue; // fail-soft

      // Build ActiveAmbition from edge properties
      const active: ActiveAmbition = {
        templateId,
        priority: (edge.properties.priority as ActiveAmbition['priority']) ?? 'secondary',
        status: 'active',
        assignedTick: (edge.properties.assignedTick as number) ?? 0,
        completedMilestones: (edge.properties.completedMilestones as string[]) ?? [],
      };

      const result = evaluateAmbitionProgress(template, active, graph, actor.id);

      // ── Status changed: completion or abandonment ──
      if (result.status !== 'active') {
        graph.updateEdge(edge.id, {
          properties: {
            ...edge.properties,
            status: result.status,
            completedMilestones: [...result.allCompletedMilestones],
            resolvedTick: tick,
          },
        });

        const eventType = result.status === 'completed'
          ? 'ambition_completed'
          : 'ambition_abandoned';

        const prose = result.status === 'completed'
          ? template.completionProse[0] ?? `${actor.name} completed: ${template.displayName}`
          : template.abandonmentProse[0] ?? `${actor.name} abandoned: ${template.displayName}`;

        newEvents.push({
          id: nextAmbitionEventId(),
          tick,
          type: eventType,
          message: prose,
          significance: result.status === 'completed' ? 0.8 : 0.5,
          actorId: actor.id,
          notification: result.status === 'completed'
            ? { channel: 'alert', icon: 'discovery' }
            : { channel: 'alert', icon: 'dilemma' },
        });

        emitTrace({
          tick,
          category: 'ambition_progress',
          actorId: actor.id,
          templateId,
          result: result.status,
          milestones: result.allCompletedMilestones,
        });

        continue; // Don't check milestones for resolved ambitions
      }

      // ── New milestones completed (still active) ──
      if (result.newMilestones.length > 0) {
        graph.updateEdge(edge.id, {
          properties: {
            ...edge.properties,
            completedMilestones: [...result.allCompletedMilestones],
          },
        });

        for (const milestoneId of result.newMilestones) {
          const milestone = template.milestones.find(m => m.id === milestoneId);
          const prose = milestone?.prose[0]
            ?? `${actor.name} progressed toward: ${template.displayName}`;

          newEvents.push({
            id: nextAmbitionEventId(),
            tick,
            type: 'ambition_milestone',
            message: prose,
            significance: 0.6,
            actorId: actor.id,
            notification: { channel: 'toast' },
          });

          emitTrace({
            tick,
            category: 'ambition_progress',
            actorId: actor.id,
            templateId,
            result: 'milestone',
            milestoneId,
          });
        }
      }
    }

    // ── Re-evaluation of empty slots ──
    if (tick % AMBITION_REEVAL_INTERVAL === 0) {
      const currentActiveCount = graph.getOutgoingEdges(actor.id, 'pursues')
        .filter(e => (e.properties.status as string) === 'active')
        .length;

      if (currentActiveCount < 2) {
        // Build agent snapshot from graph state
        const caps = (actor.properties.domainCapabilities as Record<ReachDomain, number>) ?? {} as Record<ReachDomain, number>;

        // Get traits from has_trait edges
        const traitEdges = graph.getOutgoingEdges(actor.id, 'has_trait');
        const traits = traitEdges
          .map(e => graph.getNode(e.target)?.name ?? e.target)
          .filter(Boolean);

        // Get cultural spheres from belongs_to edges
        const cultureEdges = graph.getOutgoingEdges(actor.id, 'belongs_to');
        const culturalSpheres: SphereName[] = [];
        for (const ce of cultureEdges) {
          const cultureNode = graph.getNode(ce.target);
          const spheres = cultureNode?.properties.spheres as SphereName[] | undefined;
          if (spheres) culturalSpheres.push(...spheres);
        }

        // Get bonds from relates_to edges
        const bondEdges = graph.getOutgoingEdges(actor.id, 'relates_to');
        const bonds = bondEdges.map(e => ({
          bondType: (e.properties.basis as string) ?? 'unknown',
        }));

        const agentSnapshot: AmbitionAgentSnapshot = {
          domainCapabilities: caps,
          traits,
          culturalSpheres,
          bonds,
        };

        // Exclude templates already pursued (active or otherwise)
        const allPursued = graph.getOutgoingEdges(actor.id, 'pursues');
        const existingTemplateIds = new Set(
          allPursued.map(e => {
            const node = graph.getNode(e.target);
            return node?.properties.templateId as string;
          }).filter(Boolean),
        );

        const availableTemplates = AMBITION_TEMPLATES.filter(
          t => !existingTemplateIds.has(t.id),
        );

        if (availableTemplates.length > 0) {
          const slotsNeeded = 2 - currentActiveCount;
          const seed = state.seed + tick + actor.id.length;
          const assignments = assignInitialAmbitions(availableTemplates, agentSnapshot, seed);

          for (const assignment of assignments.slice(0, slotsNeeded)) {
            // Find or create shared ambition template node
            const ambitionNodeId = `ambition.${assignment.templateId}`;
            if (!graph.getNode(ambitionNodeId)) {
              const tmpl = AMBITION_TEMPLATES.find(t => t.id === assignment.templateId);
              graph.addNode({
                id: ambitionNodeId,
                type: 'ambition',
                name: tmpl?.displayName ?? assignment.templateId,
                properties: {
                  templateId: assignment.templateId,
                  displayName: tmpl?.displayName ?? assignment.templateId,
                  category: tmpl?.category ?? 'survival',
                  reachAffinity: tmpl?.reachAffinity ?? {},
                  totalMilestones: tmpl?.milestones.length ?? 0,
                },
              });
            }

            // Create pursues edge
            const edgeId = `pursues_${actor.id}_${ambitionNodeId}`;
            graph.addEdge({
              id: edgeId,
              source: actor.id,
              target: ambitionNodeId,
              type: 'pursues',
              properties: {
                priority: assignment.priority,
                status: 'active',
                assignedTick: tick,
                completedMilestones: [],
              },
            });

            const template = AMBITION_TEMPLATES.find(t => t.id === assignment.templateId);
            const prose = template?.selectionProse[0]
              ?? `${actor.name} takes up a new ambition: ${assignment.templateId}`;

            newEvents.push({
              id: nextAmbitionEventId(),
              tick,
              type: 'ambition_assigned',
              message: prose,
              significance: 0.5,
              actorId: actor.id,
              notification: { channel: 'toast' },
            });

            emitTrace({
              tick,
              category: 'ambition_progress',
              actorId: actor.id,
              templateId: assignment.templateId,
              result: 'assigned',
              priority: assignment.priority,
            });
          }
        }
      }
    }
  }

  if (newEvents.length === 0) return {};

  return {
    tickEvents: [...state.tickEvents, ...newEvents],
  };
}
