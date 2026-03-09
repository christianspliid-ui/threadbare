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
import { SPHERE_NAMES } from '../types/index';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { NARRATIVE_ARCHETYPES } from '../data/archetype-content';
import { BORN_NAMES } from '../data/narrative-content';
import { assignCooperationStrategy } from './disposition';

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

/** Chance per tick of death for agents older than OLD_AGE_TICKS */
export const DEATH_CHANCE_OLD_AGE = 0.01;

/** Tick age threshold for old-age death chance */
export const OLD_AGE_TICKS = 200;

/** Chance per tick of birth at a location with enough agents */
export const BIRTH_CHANCE = 0.01;

/** Minimum agents at a location for birth to be possible */
export const BIRTH_DENSITY_THRESHOLD = 3;

/** Chance per tick per agent of migration */
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
    const bornTick = (actor.properties.bornTick as number) ?? 0;
    const age = state.tick - bornTick;

    let shouldDie = false;

    // Low reputation death
    if (rep < LOW_REP_THRESHOLD && rng() < DEATH_CHANCE_LOW_REP) {
      shouldDie = true;
    }
    // Old age death
    if (age > OLD_AGE_TICKS && rng() < DEATH_CHANCE_OLD_AGE) {
      shouldDie = true;
    }

    if (shouldDie) {
      // Remove all edges connected to this actor
      const outEdges = graph.getAllOutgoingEdges(actor.id);
      const inEdges = graph.getAllIncomingEdges(actor.id);
      for (const edge of [...outEdges, ...inEdges]) {
        graph.removeEdge(edge.id);
      }
      graph.removeNode(actor.id);

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_death' as any,
        message: `${actor.name} has departed from the world.`,
        significance: 0.7,
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
          id: `edge_at_${newId}`,
          source: newId,
          target: locId,
          type: 'contains',
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

        events.push({
          id: nextEventId(),
          tick: state.tick,
          type: 'agent_birth' as any,
          message: `${name} has emerged in ${locNode?.name ?? 'the world'}.`,
          significance: 0.5,
        });

        break; // At most one birth per tick
      }
    }
  }

  // ── Migrations ─────────────────────────────────────────
  const remainingActors = graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual' && !avatarNodeIds.has(n.id)
  );

  for (const actor of remainingActors) {
    if (rng() < MIGRATION_CHANCE) {
      const currentLocId = actor.properties.locationId as string | undefined;
      if (!currentLocId) continue;

      // Find adjacent locations
      const adjEdges = [
        ...graph.getOutgoingEdges(currentLocId, 'adjacent'),
        ...graph.getIncomingEdges(currentLocId, 'adjacent'),
      ];
      const adjLocIds = adjEdges.map(e =>
        e.source === currentLocId ? e.target : e.source
      );
      if (adjLocIds.length === 0) continue;

      // Pick a destination (prefer less populated locations)
      const dest = adjLocIds[Math.floor(rng() * adjLocIds.length)];

      // Update location
      actor.properties.locationId = dest;

      // Move contains edge
      const containsEdge = graph.getOutgoingEdges(actor.id, 'contains')
        .find(e => e.target === currentLocId) ??
        graph.getIncomingEdges(currentLocId, 'contains')
          .find(e => e.source === actor.id);
      if (containsEdge) {
        graph.removeEdge(containsEdge.id);
      }
      graph.addEdge({
        id: `edge_at_${actor.id}_${state.tick}`,
        source: actor.id,
        target: dest,
        type: 'contains',
        properties: {},
      });

      const destNode = graph.getNode(dest);
      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_migration' as any,
        message: `${actor.name} travels to ${destNode?.name ?? 'a new land'}.`,
        significance: 0.3,
      });

      break; // At most one migration per tick to keep events manageable
    }
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}
