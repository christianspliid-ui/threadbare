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
import { getFactionDefinition } from '../data/faction-definition-lookup';
import { isEligibleForArmySpawn, selectCommander, spawnArmy } from './armySpawning';
import { deriveFactionProsperity } from './factionNetwork';
import { emitTrace } from './traceBuffer';
import { AMBITION_KIND_FACTION, AMBITION_KIND_KEY } from './ambitionShape';
import { factionMonopolyResourceIds, isFactionAmbitionMet } from './undertakingEconomy';
import type { FactionAmbitionMetTrace } from '../types/trace';

// ─── Constants ───────────────────────────────────────────────────────────

/** How often faction ambitions are re-evaluated (ticks) */
export const FACTION_AMBITION_EVALUATION_INTERVAL = 5;

/**
 * Minimum derived faction prosperity (war chest) before territorial expansion
 * is eligible. Compared against `deriveFactionProsperity` — the SUM of the
 * faction's settlement prosperity on the /100 scale, so 0.6 = 60 raw
 * prosperity points across holdings (THR-711). Tuned to the measured world
 * scale (seeds 42/99, t169): guild seats run 0–0.36, monster lairs 0, and the
 * big landed nations carry no factionDefId so they never reach this gate at
 * all — 0.30 makes expansion reachable for a genuinely prospering seat while
 * keeping it the rarer, earned war flavor (revenge stays the common one).
 */
export const EXPANSION_PROSPERITY_THRESHOLD = 0.3;

/** How fast grudges fade per tick */
export const REVENGE_GRIEVANCE_DECAY = 0.02;

/** Minimum ascendant influence tier before faction responds to divine mandate */
export const DIVINE_MANDATE_THREAD_THRESHOLD = 3;

// ─── PRNG (mulberry32 — same as all other engine modules) ───────────────

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

// ─── Ambition Scoring ───────────────────────────────────────────────────

export interface AmbitionCandidate {
  type: FactionAmbitionType;
  weight: number;
}

/**
 * Score eligible ambitions for a faction based on its definition weights and world context.
 */
export function scoreEligibleAmbitions(
  state: GameState,
  factionId: string,
  definitionId: string,
): AmbitionCandidate[] {
  const def = getFactionDefinition(definitionId, state.dynamicFactionDefinitions);
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
      // Need minimum prosperity — derived from the faction's held settlements
      // (a `prosperity` property was never written to faction nodes, which
      // kept this gate permanently closed; THR-711).
      const prosperity = deriveFactionProsperity(state.graph, factionId);
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
export function selectAmbitionType(
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

// ─── Army spawn attempt ─────────────────────────────────────────────────

/**
 * Attempt to raise an army for a faction pursuing a military ambition.
 *
 * Fires for BOTH newly-created and standing military ambitions (THR-614): a
 * faction that becomes spawn-eligible only after its ambition was set (e.g. it
 * later gains an Iron-tier commander, or was ineligible at ambition creation)
 * would otherwise never raise an army, because the original spawn attempt was a
 * one-shot at ambition-creation time. `isEligibleForArmySpawn` already caps at
 * `MAX_ARMIES_PER_FACTION`, so re-attempting each evaluation interval is a no-op
 * once an army exists — no spam.
 */
function maybeSpawnArmy(
  state: GameState,
  factionId: string,
  _ambitionType: FactionAmbitionType,
  ambitionId: string,
): void {
  // THR-1973: a realm or free company keeps a standing army under any ambition;
  // `isEligibleForArmySpawn` reads both that and the military-ambition gate.
  if (!isEligibleForArmySpawn(state, factionId)) return;
  const commander = selectCommander(state, factionId);
  if (commander) {
    spawnArmy(state, factionId, commander, ambitionId, { charge: true });
  }
}

// ─── Phase ──────────────────────────────────────────────────────────────

export type AdoptRevengeResult = 'adopted' | 'kept_military' | 'no_faction';

/**
 * A faction that lost a town to another lord takes up revenge against it (THR-1957,
 * hunger and unrest S2). The first writer of the ambition's declared
 * `grievanceSourceId` / `targetNodeId`: who wronged it and the town it wants back.
 * The relationship itself rides the `relates_to` edge the caller writes; these ids
 * only say what the ambition is about.
 *
 * A faction already pursuing a military ambition keeps it (`kept_military`). Any other
 * active ambition gives way to the grudge, and every army that pursued it (a standing
 * army's `pursues` edge, written once at spawn) is re-pointed at the revenge — at the
 * army cap no new host spawns, so without the move the faction's one army would pursue
 * nothing and war aims would never read the grudge. Shape, priority and decay are the ones the
 * evaluation pass writes for a revenge it picks itself, and the army spawn is tried the
 * same way.
 */
export function adoptRevengeAmbition(
  state: GameState,
  factionId: string,
  grievanceSourceId: string,
  targetNodeId: string,
  reason: string,
): AdoptRevengeResult {
  const graph = state.graph;
  const faction = graph.getNode(factionId);
  if (!faction || faction.properties.actorType !== 'faction') return 'no_faction';
  for (const e of graph.getOutgoingEdges(factionId, 'pursues')) {
    const amb = graph.getNode(e.target);
    if (!amb) continue;
    const type = amb.properties.ambitionType as FactionAmbitionType | undefined;
    if (type && requiresMilitaryForce(type)) return 'kept_military';
  }
  const followers: string[] = [];
  for (const e of [...graph.getOutgoingEdges(factionId, 'pursues')]) {
    const amb = graph.getNode(e.target);
    if (!amb) continue;
    for (const inc of graph.getIncomingEdges(amb.id, 'pursues')) {
      if (inc.source !== factionId && !followers.includes(inc.source)) followers.push(inc.source);
    }
    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Faction ${faction.name} set aside ${String(amb.properties.ambitionType)} for revenge — ${reason}`,
      factionId,
      locationId: targetNodeId,
      result: 'superseded_by_revenge',
    });
    graph.removeNode(amb.id);
  }

  const ambitionId = `amb_${factionId}_${state.tick}_revenge`;
  graph.addNode({
    id: ambitionId,
    type: 'ambition',
    name: `${faction.name} — revenge`,
    properties: {
      [AMBITION_KIND_KEY]: AMBITION_KIND_FACTION,
      ambitionType: 'revenge',
      priority: 0.8,
      targetNodeId,
      grievanceSourceId,
      grievanceDecay: REVENGE_GRIEVANCE_DECAY,
      createdTick: state.tick,
    },
  });
  graph.addEdge({
    id: `e_pursues_${factionId}_${ambitionId}`,
    source: factionId,
    target: ambitionId,
    type: 'pursues',
    properties: { priority: 0.8, status: 'active', milestones: [] },
  });
  for (const armyId of followers) {
    if (!graph.getNode(armyId)) continue;
    try {
      graph.addEdge({
        id: `e_pursues_${armyId}_${ambitionId}`,
        source: armyId,
        target: ambitionId,
        type: 'pursues',
        properties: { priority: 0.8, status: 'active', milestones: [] },
      });
    } catch { /* fail-soft: duplicate id */ }
  }
  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Faction ${faction.name} adopted ambition: revenge on ${graph.getNode(grievanceSourceId)?.name ?? grievanceSourceId} — ${reason}`,
    factionId,
    locationId: targetNodeId,
    result: 'revenge_adopted',
  });
  maybeSpawnArmy(state, factionId, 'revenge', ambitionId);
  return 'adopted';
}

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
    // factionSeeding.ts writes factionDefId; factionDefinitionId is the legacy key.
    // Support both for backward compatibility with any hand-crafted test fixtures.
    const definitionId = (faction.properties.factionDefId ?? faction.properties.factionDefinitionId) as string | undefined;
    if (!definitionId) continue;

    // Check for existing active ambition
    const pursuesEdges = state.graph.getOutgoingEdges(faction.id, 'pursues');
    const activeAmbition = pursuesEdges.length > 0
      ? state.graph.getNode(pursuesEdges[0].target)
      : null;

    // THR-1967: a met ambition hands the next pick to this type, skipping the draw.
    let forcedNext: FactionAmbitionType | null = null;

    if (activeAmbition) {
      let ambitionStillActive = true;

      // Check if target is still valid
      const targetId = activeAmbition.properties.targetNodeId as string | null;
      if (isFactionAmbitionMet(state.graph, faction.id, activeAmbition.properties.ambitionType)) {
        // THR-1967 (undertakings S3): a regional monopoly meets `resource_acquisition`.
        // Closed the way an abandonment is (the node and its `pursues` edges go), and the
        // next pick is `defensive_consolidation`, so the holder guards what it won.
        const monopolyResourceIds = factionMonopolyResourceIds(state.graph, faction.id);
        state.graph.removeNode(activeAmbition.id);
        emitTrace({
          tick: state.tick,
          category: 'faction_ambition',
          summary: `Faction ${faction.name} achieved resource acquisition — holds a regional monopoly`,
          factionId: faction.id,
          result: 'achieved',
        });
        emitTrace({
          tick: state.tick,
          category: 'undertaking.economy.ambition_met',
          factionId: faction.id,
          ambition: 'resource_acquisition',
          monopolyResourceIds,
          next: 'defensive_consolidation',
          summary: `${faction.name} holds a regional monopoly (${monopolyResourceIds.join(', ')}) — turns to guarding it`,
        } as FactionAmbitionMetTrace);
        forcedNext = 'defensive_consolidation';
        ambitionStillActive = false;
      } else if (targetId && !state.graph.getNode(targetId)) {
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

      if (ambitionStillActive) {
        // Standing military ambition: retry the spawn in case the faction only
        // became eligible after the ambition was first set (THR-614 activation).
        maybeSpawnArmy(
          state,
          faction.id,
          activeAmbition.properties.ambitionType as FactionAmbitionType,
          activeAmbition.id,
        );
        continue; // Active ambition still valid — skip creation
      }
    }

    // Create new ambition
    const rng = mulberry32(state.seed + state.tick * 47 + hashString(faction.id));
    const candidates = scoreEligibleAmbitions(state, faction.id, definitionId);
    const ambitionType = forcedNext ?? selectAmbitionType(candidates, rng);

    const ambitionId = `amb_${faction.id}_${state.tick}`;
    state.graph.addNode({
      id: ambitionId,
      type: 'ambition',
      name: `${faction.name} — ${ambitionType.replace(/_/g, ' ')}`,
      properties: {
        [AMBITION_KIND_KEY]: AMBITION_KIND_FACTION,
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
      summary: `Faction ${faction.name} adopted ambition: ${ambitionType.replace(/_/g, ' ')}`
        + (ambitionType === 'territorial_expansion'
          ? ` (derived prosperity ${deriveFactionProsperity(state.graph, faction.id).toFixed(2)} ≥ ${EXPANSION_PROSPERITY_THRESHOLD})`
          : ''),
      factionId: faction.id,
      ambitionType,
      event: 'created',
      reason: forcedNext ? 'ambition_met' : candidates.length === 0 ? 'default_fallback' : 'weighted_selection',
    });

    // ── Army spawning (TB-073 M2-02) ──
    // If the new ambition requires military force, attempt to spawn an army.
    maybeSpawnArmy(state, faction.id, ambitionType, ambitionId);
  }
}
