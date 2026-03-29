/**
 * Faction Ambition Evaluation — TB-073 Phase 0.
 *
 * Factions develop ambitions that drive their behavior and military action.
 * Evaluated every FACTION_AMBITION_EVALUATION_INTERVAL ticks. Ambitions are
 * graph nodes connected to factions via `pursues` edges, identical to agent ambitions.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 0
 * NFP: Tunability (constants), Determinism (seeded PRNG), Inspectability (traces),
 *       Fail-soft (defaults to defensive_consolidation).
 */

import type { GameState } from '../types/gameState';
import type { FactionAmbitionType } from '../types/faction';
import { requiresMilitaryForce } from '../types/faction';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import { isEligibleForArmySpawn, selectCommander, spawnArmy } from './armySpawning';
import { emitTrace } from './traceBuffer';

// ─── Constants ───────────────────────────────────────────────────────────

/** How often faction ambitions are re-evaluated (ticks) */
export const FACTION_AMBITION_EVALUATION_INTERVAL = 5;

/** Minimum faction prosperity before territorial expansion is eligible */
export const EXPANSION_PROSPERITY_THRESHOLD = 0.6;

/** How fast grudges fade per tick */
export const REVENGE_GRIEVANCE_DECAY = 0.02;

/** Minimum ascendant influence tier before faction responds to divine mandate */
export const DIVINE_MANDATE_THREAD_THRESHOLD = 3;

// ─── PRNG (mulberry32 — same as all other engine modules) ───────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

// ─── Ambition Scoring ───────────────────────────────────────────────────

interface AmbitionCandidate {
  type: FactionAmbitionType;
  weight: number;
}

/**
 * Score eligible ambitions for a faction based on its definition weights and world context.
 */
function scoreEligibleAmbitions(
  state: GameState,
  factionId: string,
  definitionId: string,
): AmbitionCandidate[] {
  const def = FACTION_DEFINITIONS.get(definitionId);
  if (!def) return [];

  const weights = def.ambitionWeights ?? {};
  const candidates: AmbitionCandidate[] = [];

  // Check each ambition type against eligibility
  const ambitionTypes: FactionAmbitionType[] = [
    'resource_acquisition',
    'defensive_consolidation',
    'territorial_expansion',
    'cultural_dominance',
    'revenge',
    'divine_mandate',
  ];

  for (const type of ambitionTypes) {
    const baseWeight = weights[type] ?? 0;
    if (baseWeight <= 0) continue;

    // Eligibility checks
    if (type === 'territorial_expansion') {
      // Need minimum prosperity
      const factionNode = state.graph.getNode(factionId);
      const prosperity = (factionNode?.properties?.prosperity as number) ?? 0;
      if (prosperity < EXPANSION_PROSPERITY_THRESHOLD) continue;
    }

    if (type === 'divine_mandate') {
      // Need strong ascendant thread
      const threads = state.graph.getIncomingEdges(factionId, 'thread');
      if (threads.length === 0) continue;
    }

    candidates.push({ type, weight: baseWeight });
  }

  return candidates;
}

/**
 * Select an ambition type from weighted candidates using seeded PRNG.
 */
function selectAmbitionType(
  candidates: AmbitionCandidate[],
  rng: () => number,
): FactionAmbitionType {
  if (candidates.length === 0) return 'defensive_consolidation';
  if (candidates.length === 1) return candidates[0].type;

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  const roll = rng() * totalWeight;
  let cumulative = 0;
  for (const candidate of candidates) {
    cumulative += candidate.weight;
    if (roll < cumulative) return candidate.type;
  }
  return candidates[candidates.length - 1].type;
}

// ─── Phase ──────────────────────────────────────────────────────────────

/**
 * Evaluate and update faction ambitions.
 *
 * Runs every FACTION_AMBITION_EVALUATION_INTERVAL ticks. For each faction:
 * - If no active ambition, create one from weighted candidates
 * - If active ambition has invalid target, abandon it
 * - Decay grievances on revenge ambitions
 */
export function phaseFactionAmbitions(state: GameState): void {
  if (state.tick % FACTION_AMBITION_EVALUATION_INTERVAL !== 0) return;

  const factionNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction');

  for (const faction of factionNodes) {
    const definitionId = faction.properties.factionDefinitionId as string | undefined;
    if (!definitionId) continue;

    // Check for existing active ambition
    const pursuesEdges = state.graph.getOutgoingEdges(faction.id, 'pursues');
    const activeAmbition = pursuesEdges.length > 0
      ? state.graph.getNode(pursuesEdges[0].target)
      : null;

    if (activeAmbition) {
      let ambitionStillActive = true;

      // Check if target is still valid
      const targetId = activeAmbition.properties.targetNodeId as string | null;
      if (targetId && !state.graph.getNode(targetId)) {
        // Target destroyed — abandon ambition
        state.graph.removeNode(activeAmbition.id);
        emitTrace({
          tick: state.tick,
          category: 'faction_ambition',
          summary: `Faction ${faction.name} abandoned ${activeAmbition.properties.ambitionType} — target destroyed`,
          factionId: faction.id,
          ambitionType: activeAmbition.properties.ambitionType as FactionAmbitionType,
          event: 'abandoned',
          reason: 'target_destroyed',
        });
        ambitionStillActive = false;
      } else if (activeAmbition.properties.ambitionType === 'revenge') {
        // Decay grievances on revenge ambitions
        const decay = activeAmbition.properties.grievanceDecay as number ?? REVENGE_GRIEVANCE_DECAY;
        const priority = (activeAmbition.properties.priority as number ?? 1.0) - decay;
        if (priority <= 0) {
          state.graph.removeNode(activeAmbition.id);
          emitTrace({
            tick: state.tick,
            category: 'faction_ambition',
            summary: `Faction ${faction.name} abandoned revenge — grudge faded`,
            factionId: faction.id,
            ambitionType: 'revenge',
            event: 'abandoned',
            reason: 'grievance_decayed',
          });
          ambitionStillActive = false;
        } else {
          state.graph.updateNode(activeAmbition.id, {
            properties: { priority },
          });
        }
      }

      if (ambitionStillActive) continue; // Active ambition still valid — skip creation
    }

    // Create new ambition
    const rng = mulberry32(state.seed + state.tick * 47 + hashString(faction.id));
    const candidates = scoreEligibleAmbitions(state, faction.id, definitionId);
    const ambitionType = selectAmbitionType(candidates, rng);

    const ambitionId = `amb_${faction.id}_${state.tick}`;
    state.graph.addNode({
      id: ambitionId,
      type: 'ambition',
      name: `${faction.name} — ${ambitionType.replace(/_/g, ' ')}`,
      properties: {
        ambitionType,
        priority: ambitionType === 'revenge' ? 0.8 : 0.5,
        targetNodeId: null, // Will be set when army/action targets are chosen
        grievanceDecay: ambitionType === 'revenge' ? REVENGE_GRIEVANCE_DECAY : 0,
        createdTick: state.tick,
      },
    });

    state.graph.addEdge({
      id: `e_pursues_${faction.id}_${ambitionId}`,
      source: faction.id,
      target: ambitionId,
      type: 'pursues',
      properties: {
        priority: ambitionType === 'revenge' ? 0.8 : 0.5,
        status: 'active',
        milestones: [],
      },
    });

    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Faction ${faction.name} adopted ambition: ${ambitionType.replace(/_/g, ' ')}`,
      factionId: faction.id,
      ambitionType,
      event: 'created',
      reason: candidates.length === 0 ? 'default_fallback' : 'weighted_selection',
    });

    // ── Army spawning (TB-073 M2-02) ──
    // If the new ambition requires military force, attempt to spawn an army
    if (requiresMilitaryForce(ambitionType) && isEligibleForArmySpawn(state, faction.id)) {
      const commander = selectCommander(state, faction.id);
      if (commander) {
        spawnArmy(state, faction.id, commander, ambitionId);
      }
    }
  }
}
