/**
 * Agent Lifecycle Engine — death, birth, and migration mechanics.
 *
 * Adds population dynamics so the world evolves over time instead of
 * staying frozen with the same agents from world seeding.
 *
 * All functions are pure (read graph, return events + mutations).
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { SphereName } from '../types/index';
import type { ReachDomain } from '../types/traits';
import { SPHERE_NAMES } from '../types/index';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { NARRATIVE_ARCHETYPES } from '../data/archetype-content';
import { BORN_NAMES } from '../data/narrative-content';
import { assignCooperationStrategy } from './disposition';
import { assignInitialAmbitions } from './ambitionAssignment';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Tunable Constants ───────────────────────────────────────────

/** Chance per tick of death for agents with reputation < LOW_REP_THRESHOLD */
export const DEATH_CHANCE_LOW_REP = 0.02;

/** Reputation threshold below which death chance applies */
export const LOW_REP_THRESHOLD = 0.1;

/** Chance per tick of birth at a location with enough agents */
export const BIRTH_CHANCE = 0.01;

/** Minimum agents at a location for birth to be possible */
export const BIRTH_DENSITY_THRESHOLD = 3;

/** Chance per tick per agent of migration
 * @deprecated Replaced by phaseMovement with axiological scoring (DES-009 Task 7)
 */
export const MIGRATION_CHANCE = 0.02;

// ─── ID Generator ────────────────────────────────────────────────

let lifecycleCounter = 0;
function nextLifecycleId(prefix: string): string {
  return `${prefix}_lc_${++lifecycleCounter}`;
}

export function resetLifecycleCounter(): void {
  lifecycleCounter = 0;
}

// ─── Phase: Agent Lifecycle ──────────────────────────────────────

export function phaseAgentLifecycle(state: GameState, nextEventId: () => string): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 71);
  const events: TickEvent[] = [];
  const graph = state.graph;

  // Filter individuals but EXCLUDE the player's avatar — the avatar must not
  // die from old age, low reputation, or migrate via lifecycle mechanics.
  const avatarNodeIds = new Set<string>();
  {
    const ascendantNode = graph.getNode(state.ascendantId);
    if (ascendantNode) {
      const avatarEdges = graph.getIncomingEdges(state.ascendantId, 'avatar_of');
      for (const e of avatarEdges) {
        avatarNodeIds.add(e.source);
      }
    }
  }

  const actors = graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual' && !avatarNodeIds.has(n.id)
  );

  let deathOccurred = false;

  // ── Deaths ─────────────────────────────────────────────
  for (const actor of actors) {
    const rep = (actor.properties.reputationScore as number) ?? DEFAULT_REPUTATION;

    let shouldDie = false;

    // Low reputation death
    if (rep < LOW_REP_THRESHOLD && rng() < DEATH_CHANCE_LOW_REP) {
      shouldDie = true;
    }

    if (shouldDie) {
      // Capture location before removing edges
      const locEdges = graph.getOutgoingEdges(actor.id, 'located_at');
      const deathLocNode = locEdges.length > 0 ? graph.getNode(locEdges[0].target) : undefined;
      const deathHexCoords = deathLocNode?.properties?.hexCol != null
        ? { col: deathLocNode.properties.hexCol as number, row: deathLocNode.properties.hexRow as number }
        : undefined;

      // Remove all edges connected to this actor
      const allEdges = graph.getAllEdgesForNode(actor.id);
      for (const edge of allEdges) {
        graph.removeEdge(edge.id);
      }
      graph.removeNode(actor.id);

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_death' as any,
        message: `${actor.name} has departed from the world.`,
        significance: 0.7,
        notification: { channel: 'toast' },
        hexCoords: deathHexCoords,
      });

      deathOccurred = true;
    }
  }

  // ── Births ─────────────────────────────────────────────
  // Only if no death occurred this tick (population balance)
  if (!deathOccurred) {
    const locationIds = graph.getNodesByType('location').map(n => n.id);

    for (const locId of locationIds) {
      // Count agents at this location
      const agentsHere = graph.getIncomingEdges(locId, 'contains')
        .map(e => graph.getNode(e.source))
        .filter(n => n && n.properties.actorType === 'individual');

      if (agentsHere.length >= BIRTH_DENSITY_THRESHOLD && rng() < BIRTH_CHANCE) {
        const newId = nextLifecycleId('born');
        const name = BORN_NAMES[Math.floor(rng() * BORN_NAMES.length)];

        // Inherit sphere from location's dominant sphere
        const locNode = graph.getNode(locId);
        const sphereInf = (locNode?.properties?.sphereInfluence ?? {}) as Record<string, number>;
        let dominantSphere: SphereName = SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)];
        let maxInf = 0;
        for (const sp of SPHERE_NAMES) {
          if ((sphereInf[sp] ?? 0) > maxInf) {
            maxInf = sphereInf[sp];
            dominantSphere = sp;
          }
        }

        const archetype = NARRATIVE_ARCHETYPES[Math.floor(rng() * NARRATIVE_ARCHETYPES.length)];
        const domainCaps: Record<string, number> = {};
        const reaches = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh'];
        for (const r of reaches) {
          domainCaps[r] = 0.1 + rng() * 0.4;
        }

        const cooperationStrategy = assignCooperationStrategy(archetype.id, {} as any, rng);

        graph.addNode({
          id: newId,
          type: 'actor',
          name,
          properties: {
            actorType: 'individual',
            axiologicalProfile: {},
            domainCapabilities: domainCaps,
            locationId: locId,
            narrativeArchetype: archetype.id,
            cooperationStrategy,
            reputationScore: DEFAULT_REPUTATION,
            bornTick: state.tick,
          },
        });

        graph.addEdge({
          id: `${newId}_located_at_${locId}`,
          source: newId,
          target: locId,
          type: 'located_at',
          properties: {},
        });

        // Inherit culture from a parent at this location
        const parentCultures = agentsHere
          .filter(a => a !== null)
          .flatMap(a => graph.getOutgoingEdges(a!.id, 'belongs_to'));
        if (parentCultures.length > 0) {
          const parentCulture = parentCultures[Math.floor(rng() * parentCultures.length)];
          graph.addEdge({
            id: `edge_culture_${newId}`,
            source: newId,
            target: parentCulture.target,
            type: 'belongs_to',
            properties: { strength: 0.6 },
          });
        }

        // Assign initial ambitions
        const agentSnapshot = {
          domainCapabilities: domainCaps as Record<ReachDomain, number>,
          traits: [] as string[],  // newly born agents have no traits yet
          culturalSpheres: parentCultures.length > 0
            ? [dominantSphere]
            : [],
          bonds: [],  // newly born agents have no bonds yet
        };
        const ambitionAssignments = assignInitialAmbitions(
          AMBITION_TEMPLATES,
          agentSnapshot,
          state.seed + state.tick * 113 + newId.charCodeAt(0),
        );

        for (const assignment of ambitionAssignments) {
          // Find or create the ambition template node in the graph
          const ambitionNodeId = `ambition.${assignment.templateId}`;
          if (!graph.getNode(ambitionNodeId)) {
            const template = AMBITION_TEMPLATES.find(t => t.id === assignment.templateId);
            if (template) {
              graph.addNode({
                id: ambitionNodeId,
                type: 'ambition',
                name: template.displayName,
                properties: {
                  templateId: template.id,
                  displayName: template.displayName,
                  category: template.category,
                  reachAffinity: template.reachAffinity,
                  totalMilestones: template.milestones.length,
                },
              });
            }
          }

          graph.addEdge({
            id: `edge_pursues_${newId}_${assignment.templateId}`,
            source: newId,
            target: ambitionNodeId,
            type: 'pursues',
            properties: {
              priority: assignment.priority,
              status: 'active',
              assignedTick: state.tick,
              completedMilestones: [],
            },
          });
        }

        events.push({
          id: nextEventId(),
          tick: state.tick,
          type: 'agent_birth' as any,
          message: `${name} has emerged in ${locNode?.name ?? 'the world'}.`,
          significance: 0.5,
          notification: { channel: 'toast' },
          hexCoords: locNode?.properties?.hexCol != null
            ? { col: locNode.properties.hexCol as number, row: locNode.properties.hexRow as number }
            : undefined,
        });

        break; // At most one birth per tick
      }
    }
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}
