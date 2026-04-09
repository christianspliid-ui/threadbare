/**
 * NPC Graduation — importance tracking and spotlight tier promotion.
 *
 * When an NPC's importance score crosses a threshold, they are promoted
 * to a higher tier with richer properties. This enables emergent narrative
 * significance: background characters rise to prominence through play.
 *
 * Design doc: NPC Framework v1
 * NFP: Tunability (thresholds from NPC_CONSTANTS), Determinism (seeded PRNG per actor),
 *      Fail-soft (no-op on missing nodes/legacy nodes), Inspectability (NpcGraduatedEvent).
 */

import type { WorldGraph } from './graph';
import type { GameState } from '../types/gameState';
import { NPC_CONSTANTS } from '../types/npc';
import type { SpotlightTier } from '../types/npc';
import { VALUE_PAIRS } from '../types/agent';
import type { AxiologicalProfile } from '../types/agent';
import { NARRATIVE_ARCHETYPES } from '../data/archetype-content';

// ─── Seeded PRNG ──────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple string hash for deterministic per-actor PRNG seeding */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** Emitted when an NPC is promoted to a higher spotlight tier. */
export interface NpcGraduatedEvent {
  type: 'npc_graduated';
  id: string;
  tick: number;
  message: string;
  significance: number;
  actorId: string;
  fromTier: 'ambient' | 'notable' | 'spotlight';
  toTier: 'notable' | 'spotlight';
  trigger: 'threshold' | 'player_action' | 'story_event';
  reason: string;
  importance: number;
}

// ─── Importance source delta table (NFP #1: all numbers named) ───────────────

type ImportanceSource =
  | 'player_action'
  | 'encounter_reference'
  | 'edge_created'
  | 'trait_gained'
  | 'location_contested';

const IMPORTANCE_DELTAS: Record<ImportanceSource, number> = {
  player_action:       NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION,
  encounter_reference: NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE,
  edge_created:        NPC_CONSTANTS.IMPORTANCE_EDGE_CREATED,
  trait_gained:        NPC_CONSTANTS.IMPORTANCE_TRAIT_GAINED,
  location_contested:  NPC_CONSTANTS.IMPORTANCE_LOCATION_CONTESTED,
};

// ─── Role → wealth lookup (NFP #1) ───────────────────────────────────────────

const ROLE_WEALTH: Record<string, number> = {
  merchant:      60,
  trader:        55,
  noble:         70,
  innkeeper:     40,
  smith:         45,
  guard:         25,
  guard_captain: 35,
  healer:        30,
  priest:        20,
};
const DEFAULT_WEALTH = 20;

// ─── Tier ordering (for comparison) ──────────────────────────────────────────

const TIER_ORDER: Record<SpotlightTier, number> = {
  ambient:   0,
  notable:   1,
  spotlight: 2,
};

function pickNarrativeArchetypeId(rng: () => number): string {
  const archetype = NARRATIVE_ARCHETYPES[Math.floor(rng() * NARRATIVE_ARCHETYPES.length)];
  return archetype?.id ?? 'wanderer';
}

// ─── bumpImportance ───────────────────────────────────────────────────────────

/**
 * Increment the importance property on an NPC node.
 * No-op for spotlight agents or legacy nodes (no spotlightTier property).
 */
export function bumpImportance(
  graph: WorldGraph,
  actorId: string,
  source: ImportanceSource,
): void {
  const node = graph.getNode(actorId);
  if (!node) return;

  const tier = node.properties.spotlightTier as SpotlightTier | undefined;
  // No-op for legacy nodes (no spotlightTier) or already-spotlight agents
  if (tier === undefined || tier === 'spotlight') return;

  const current = (node.properties.importance as number | undefined) ?? 0;
  const delta = IMPORTANCE_DELTAS[source];
  graph.updateNode(actorId, {
    properties: { importance: current + delta },
  });
}

// ─── hydrateToTier ────────────────────────────────────────────────────────────

/**
 * Promote an NPC by adding missing properties for the target tier.
 * Does not downgrade — if current tier >= target tier, this is a no-op.
 */
export function hydrateToTier(
  graph: WorldGraph,
  actorId: string,
  targetTier: 'notable' | 'spotlight',
  rng: () => number,
): void {
  const node = graph.getNode(actorId);
  if (!node) return;

  const currentTier = (node.properties.spotlightTier as SpotlightTier | undefined) ?? 'ambient';

  // No-op if already at or above the target tier
  if (TIER_ORDER[currentTier] >= TIER_ORDER[targetTier]) return;

  const updates: Record<string, unknown> = {
    spotlightTier: targetTier,
  };

  // For notable or spotlight: generate axiological profile if missing
  if (targetTier === 'notable' || targetTier === 'spotlight') {
    if (typeof node.properties.narrativeArchetype !== 'string') {
      updates.narrativeArchetype = pickNarrativeArchetypeId(rng);
    }

    if (!node.properties.axiologicalProfile) {
      const profile: Partial<AxiologicalProfile> = {};
      for (const pair of VALUE_PAIRS) {
        // Random float in [-1, 1]
        profile[pair] = rng() * 2 - 1;
      }
      updates.axiologicalProfile = profile as AxiologicalProfile;
    }

    // Set wealth based on role if missing
    if (node.properties.wealth === undefined) {
      const role = (node.properties.npcRole as string | undefined) ?? '';
      updates.wealth = ROLE_WEALTH[role] ?? DEFAULT_WEALTH;
    }

    // Set reputationScore to 0 if missing
    if (node.properties.reputationScore === undefined) {
      updates.reputationScore = 0;
    }
  }

  // For spotlight: generate domainCapabilities and set cooperationStrategy
  if (targetTier === 'spotlight') {
    if (!node.properties.domainCapabilities) {
      updates.domainCapabilities = {
        iron:   10 + Math.floor(rng() * 41),
        gold:   10 + Math.floor(rng() * 41),
        shadow: 10 + Math.floor(rng() * 41),
        veil:   10 + Math.floor(rng() * 41),
        heart:  10 + Math.floor(rng() * 41),
        eye:    10 + Math.floor(rng() * 41),
        stone:  10 + Math.floor(rng() * 41),
        star:   10 + Math.floor(rng() * 41),
        flesh:  10 + Math.floor(rng() * 41),
      };
    }

    if (!node.properties.cooperationStrategy) {
      updates.cooperationStrategy = 'tit_for_tat';
    }
  }

  graph.updateNode(actorId, { properties: updates });
}

// ─── phaseNpcGraduation ───────────────────────────────────────────────────────

/**
 * Scan all NPC actor nodes and promote those whose importance crosses tier thresholds.
 *
 * Phase 2.38 in the orchestrator tick loop.
 * Returns NpcGraduatedEvent[] for each promotion that occurred this tick.
 * Newly promoted actors are not re-evaluated in the same tick.
 */
export function phaseNpcGraduation(state: GameState): NpcGraduatedEvent[] {
  const events: NpcGraduatedEvent[] = [];

  const actorNodes = state.graph.getNodesByType('actor');

  for (const actor of actorNodes) {
    const tier = actor.properties.spotlightTier as SpotlightTier | undefined;
    // Skip spotlight agents and legacy nodes
    if (tier === undefined || tier === 'spotlight') continue;

    const importance = (actor.properties.importance as number | undefined) ?? 0;

    // Seeded PRNG for this actor (deterministic, per-actor)
    const rng = mulberry32(state.seed + hashString(actor.id) * 71);

    if (tier === 'ambient' && importance >= NPC_CONSTANTS.NOTABLE_THRESHOLD) {
      // Promote ambient → notable
      hydrateToTier(state.graph, actor.id, 'notable', rng);

      events.push({
        type: 'npc_graduated',
        id: `npc_grad_${state.tick}_${actor.id}`,
        tick: state.tick,
        message: `${actor.name} has risen to prominence as a notable figure.`,
        significance: 0.5,
        actorId: actor.id,
        fromTier: 'ambient',
        toTier: 'notable',
        trigger: 'threshold',
        reason: `importance ${importance} >= ${NPC_CONSTANTS.NOTABLE_THRESHOLD}`,
        importance,
      });
    } else if (tier === 'notable' && importance >= NPC_CONSTANTS.SPOTLIGHT_THRESHOLD) {
      // Check edge count: outgoing + incoming relates_to edges
      const outEdges = state.graph.getOutgoingEdges(actor.id, 'relates_to');
      const inEdges = state.graph.getIncomingEdges(actor.id, 'relates_to');
      const edgeCount = outEdges.length + inEdges.length;

      if (edgeCount >= NPC_CONSTANTS.SPOTLIGHT_MIN_EDGES) {
        // Promote notable → spotlight
        hydrateToTier(state.graph, actor.id, 'spotlight', rng);

        events.push({
          type: 'npc_graduated',
          id: `npc_grad_${state.tick}_${actor.id}`,
          tick: state.tick,
          message: `${actor.name} has become a fully realized spotlight agent.`,
          significance: 0.7,
          actorId: actor.id,
          fromTier: 'notable',
          toTier: 'spotlight',
          trigger: 'threshold',
          reason: `importance ${importance} >= ${NPC_CONSTANTS.SPOTLIGHT_THRESHOLD}, edges ${edgeCount} >= ${NPC_CONSTANTS.SPOTLIGHT_MIN_EDGES}`,
          importance,
        });
      }
    }
  }

  return events;
}
