/**
 * Siege Resolution — TB-073 Phase 4.
 *
 * Sieges use the same battle node system as field battles with:
 * - Accelerating pacing (spotlight interval decreases over time)
 * - Asymmetric attrition (defenders lose less behind walls)
 * - Settlement-specific mechanics (fortification modifiers, starvation)
 * - Regional encounter generation (nearby entities get pulled in)
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 4
 * NFP: Tunability (all rates named), Determinism (pacing deterministic, PRNG seeded),
 *       Inspectability (SiegeTrace), Fail-soft (max duration forces resolution).
 */

import type { GameState } from '../types/gameState';
import type { BattleState } from '../types/battle';
import type { ArmyState } from '../types/army';
import {
  SIEGE_INITIAL_INTERVAL,
  SIEGE_ACCELERATION_RATE,
  SIEGE_MAX_DURATION,
  SIEGE_RESOLUTION_THRESHOLD,
  SIEGE_DEFENDER_MOMENTUM_BONUS,
  SIEGE_STARVATION_TICK,
  SIEGE_REGIONAL_ENCOUNTER_RANGE,
  SIEGE_COMBAT_ATTRITION_ATTACKER,
  BATTLE_MOMENTUM_PER_SPOTLIGHT_BASE,
  FORTIFICATION_BASIC,
  FORTIFICATION_GRAND,
  PREPARED_DEFENSE_MULTIPLIER,
  BREACH_FORTIFICATION_REDUCTION,
} from '../types/battle';
import { calculateInitialMomentum, resolveBattle } from './battleResolution';
import { emitTrace } from './traceBuffer';
import { hexDistance } from './delivery';
import type { BattleResolutionType } from '../types/battle';
import { resolveEffectiveTier } from './attentionTier';
import type { AttentionTier, DigestEntry, QueuedStoryBeat } from '../types/attention';
import type { CourtPosition } from '../types/influence';
import {
  SIEGE_SPOTLIGHT_TEMPLATES,
  SIEGE_REGIONAL_TEMPLATES,
} from '../data/siege-encounter-content';

// ─── Attention Tier Constants ────────────────────────────────────────────────

/** Fallback tier when a spotlight template is missing intrinsicTier (content gap). */
const SIEGE_SPOTLIGHT_TIER_DEFAULT: AttentionTier = 'shaping';

/** Fallback tier when a regional template is missing intrinsicTier (content gap). */
const SIEGE_REGIONAL_TIER_DEFAULT: AttentionTier = 'background';

/**
 * Court position used for tier resolution when no bonded actor is involved
 * in the siege's factions. 'retinue' preserves intrinsic tier exactly
 * (background→background, shaping→shaping, story_beat→story_beat),
 * ensuring siege beats still surface to the player.
 */
const SIEGE_SPOTLIGHT_COURT_POSITION_FALLBACK: CourtPosition = 'retinue';

// ─── PRNG ───────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Siege Pacing ───────────────────────────────────────────────────────

/**
 * Calculate spotlight interval for a siege at a given tick.
 * Decreases over time, floor of 1 (every-tick spotlights during crescendo).
 */
export function getSiegePacingInterval(ticksElapsed: number): number {
  return Math.max(1, SIEGE_INITIAL_INTERVAL - Math.floor(ticksElapsed / SIEGE_ACCELERATION_RATE));
}

/**
 * Determine the narrative phase of a siege based on ticks elapsed.
 */
export function getSiegePhase(ticksElapsed: number): 'opening' | 'early' | 'middle' | 'crescendo' {
  if (ticksElapsed <= 3) return 'opening';
  if (ticksElapsed <= 10) return 'early';
  if (ticksElapsed <= 20) return 'middle';
  return 'crescendo';
}

/**
 * Get fortification modifier for a settlement based on its subtype.
 */
export function getFortificationModifier(locationSubtype: string | undefined): number {
  switch (locationSubtype) {
    case 'capital':
    case 'city':
      return FORTIFICATION_GRAND;
    case 'town':
      return FORTIFICATION_BASIC;
    case 'hamlet':
      return PREPARED_DEFENSE_MULTIPLIER;
    default:
      return 1; // No fortification
  }
}

// ─── Spotlight Tier Helpers ──────────────────────────────────────────────────

const COURT_RANK: Record<CourtPosition, number> = {
  the_first: 3, retinue: 2, watched: 1, dormant: 0,
};

/**
 * Find the highest court position among agents bonded to the siege's
 * participating factions. Used to resolve spotlight effectiveTier.
 * Returns { courtPosition, bondedActorId } or the fallback if no match.
 */
function resolveSiegeFocusCourtPosition(
  state: GameState,
  bs: BattleState,
): { courtPosition: CourtPosition; bondedActorId: string | null } {
  if (!state.ascendantId) {
    return { courtPosition: SIEGE_SPOTLIGHT_COURT_POSITION_FALLBACK, bondedActorId: null };
  }

  const threadEdges = state.graph.getOutgoingEdges(state.ascendantId, 'thread');
  if (threadEdges.length === 0) {
    return { courtPosition: SIEGE_SPOTLIGHT_COURT_POSITION_FALLBACK, bondedActorId: null };
  }

  // Collect faction IDs involved in the siege
  const siegeFactionIds = new Set<string>();
  const attackerFaction = state.graph.getOutgoingEdges(bs.attackerArmyId, 'member_of')[0]?.target;
  if (attackerFaction) siegeFactionIds.add(attackerFaction);
  if (bs.settlementId) {
    const defenderFaction = state.graph.getOutgoingEdges(bs.settlementId, 'controlled_by')[0]?.target;
    if (defenderFaction) siegeFactionIds.add(defenderFaction);
  }

  let bestPosition: CourtPosition | null = null;
  let bestRank = -1;
  let bestActorId: string | null = null;

  for (const edge of threadEdges) {
    const pos = edge.properties?.courtPosition as CourtPosition | undefined;
    if (!pos || pos === 'dormant') continue;
    const rank = COURT_RANK[pos] ?? -1;
    if (rank <= bestRank) continue;

    // Only count agents in one of the siege factions
    const actorFaction = state.graph.getOutgoingEdges(edge.target, 'member_of')[0]?.target;
    if (!actorFaction || !siegeFactionIds.has(actorFaction)) continue;

    bestPosition = pos;
    bestRank = rank;
    bestActorId = edge.target;
  }

  if (!bestPosition) {
    return { courtPosition: SIEGE_SPOTLIGHT_COURT_POSITION_FALLBACK, bondedActorId: null };
  }
  return { courtPosition: bestPosition, bondedActorId: bestActorId };
}

/**
 * Select a spotlight template appropriate for the current siege phase.
 * Prefers phase-specific templates; falls back to 'any' templates.
 */
function selectSpotlightTemplate(
  phase: ReturnType<typeof getSiegePhase>,
  rng: () => number,
  templateId?: string,
): import('../data/siege-encounter-content').SiegeSpotlightTemplate | null {
  if (templateId) {
    return SIEGE_SPOTLIGHT_TEMPLATES.find(t => t.id === templateId) ?? null;
  }
  const phaseMatches = SIEGE_SPOTLIGHT_TEMPLATES.filter(
    t => t.phase === phase || t.phase === 'any',
  );
  if (phaseMatches.length === 0) return SIEGE_SPOTLIGHT_TEMPLATES[0] ?? null;
  return phaseMatches[Math.floor(rng() * phaseMatches.length)];
}

// ─── Siege Creation ─────────────────────────────────────────────────────

/**
 * Create a siege node when an army arrives at a hostile settlement.
 * Returns the siege node ID, or null on failure.
 */
export function createSiegeNode(
  state: GameState,
  attackerArmyId: string,
  settlementId: string,
  hexId: string,
): string | null {
  const graph = state.graph;
  const attackerNode = graph.getNode(attackerArmyId);
  const settlementNode = graph.getNode(settlementId);
  const hexNode = graph.getNode(hexId);

  if (!attackerNode || !settlementNode || !hexNode) return null;

  const attackerState = attackerNode.properties.armyState as ArmyState | undefined;
  if (!attackerState) return null;

  // Get settlement fortification
  const locationSubtype = settlementNode.properties.locationSubtype as string | undefined;
  const fortification = getFortificationModifier(locationSubtype);

  // Garrison strength: use settlement's approximate population as defender headcount
  // Simple heuristic: hamlet=50, town=200, city=500, capital=1000
  const garrisonHeadcount = getGarrisonSize(locationSubtype);

  // Initial momentum: attacker vs garrison with fortification
  const initialMomentum = calculateInitialMomentum(
    attackerState.headcount,
    garrisonHeadcount,
    fortification,
  ) - SIEGE_DEFENDER_MOMENTUM_BONUS; // Defenders get extra bonus

  const siegeId = `siege_${attackerArmyId}_${settlementId}_${state.tick}`;

  const battleState: BattleState = {
    battleType: 'siege',
    momentum: initialMomentum,
    backgroundProse: `${attackerNode.name} lays siege to ${settlementNode.name}.`,
    spotlightHistory: [],
    ticksSinceLastSpotlight: 0,
    startedTick: state.tick,
    settlementId,
    initialMomentumOffset: initialMomentum,
    attackerArmyId,
    defenderArmyId: settlementId, // Settlement acts as "defender army"
    thresholdsFired: [],
  };

  try {
    graph.addNode({
      id: siegeId,
      type: 'actor',
      name: `Siege of ${settlementNode.name}`,
      properties: {
        actorType: 'group',
        battleState,
        siegeRegionalEncountersSent: [] as string[], // Track sent regional encounters
        starvationFired: false,
      },
    });

    // participates_in: attacker → siege
    graph.addEdge({
      id: `e_participates_${attackerArmyId}_${siegeId}`,
      source: attackerArmyId,
      target: siegeId,
      type: 'participates_in',
      properties: { role: 'attacker', joinedTick: state.tick },
    });

    // located_at: siege → hex
    graph.addEdge({
      id: `e_located_at_${siegeId}`,
      source: siegeId,
      target: hexId,
      type: 'located_at',
      properties: {},
    });

    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Siege established: ${attackerNode.name} besieges ${settlementNode.name} (fortification: ${fortification}x, momentum: ${initialMomentum.toFixed(1)})`,
      event: 'siege_established',
      siegeId,
      attackerArmyId,
      settlementId,
      fortification,
      momentum: initialMomentum,
      phase: 'opening',
    });

    return siegeId;
  } catch (err) {
    try { graph.removeNode(siegeId); } catch { /* cleanup */ }
    return null;
  }
}

// ─── Siege Ticking ──────────────────────────────────────────────────────

/**
 * Process one tick of an active siege.
 * Extends tickBattle with siege-specific pacing and regional encounters.
 */
export function tickSiege(state: GameState, siegeNodeId: string): void {
  const graph = state.graph;
  const siegeNode = graph.getNode(siegeNodeId);
  if (!siegeNode) return;

  const bs = siegeNode.properties.battleState as BattleState;
  if (!bs || bs.battleType !== 'siege') return;

  const ticksElapsed = state.tick - bs.startedTick;
  const phase = getSiegePhase(ticksElapsed);
  const pacingInterval = getSiegePacingInterval(ticksElapsed);

  // Get attacker army
  const attackerNode = graph.getNode(bs.attackerArmyId);
  if (!attackerNode) {
    resolveBattle(state, siegeNodeId, 'defender_victory');
    return;
  }
  const attackerState = attackerNode.properties.armyState as ArmyState;

  // 1. Apply asymmetric combat attrition
  const newAttackerQ = Math.max(0, attackerState.quintessence - SIEGE_COMBAT_ATTRITION_ATTACKER);
  graph.updateNode(bs.attackerArmyId, {
    properties: {
      ...attackerNode.properties,
      armyState: { ...attackerState, quintessence: newAttackerQ },
    },
  });

  // 2. Spotlight processing with siege pacing
  let momentumShift = 0;
  let pacingSpotlightFired = false;
  const newTicksSinceSpotlight = bs.ticksSinceLastSpotlight + 1;

  if (newTicksSinceSpotlight >= pacingInterval) {
    const rng = mulberry32(state.seed + state.tick * 67 + siegeNodeId.length);
    const roll = rng();
    if (roll < 0.35) {
      momentumShift = BATTLE_MOMENTUM_PER_SPOTLIGHT_BASE;
      pacingSpotlightFired = true;
    } else if (roll < 0.75) {
      momentumShift = -BATTLE_MOMENTUM_PER_SPOTLIGHT_BASE; // Defenders have slight advantage in sieges
      pacingSpotlightFired = true;
    }
  }

  // 3. Starvation check
  const starvationFired = siegeNode.properties.starvationFired as boolean;
  let starvationSpotlightFired = false;
  if (ticksElapsed >= SIEGE_STARVATION_TICK && !starvationFired) {
    // Starvation shifts momentum toward attacker
    momentumShift += 1;
    starvationSpotlightFired = true;
    graph.updateNode(siegeNodeId, {
      properties: { ...siegeNode.properties, starvationFired: true },
    });
  }

  // 3a. Emit attention-tier digest entries for spotlights that fired this tick
  if (pacingSpotlightFired || starvationSpotlightFired) {
    const { courtPosition, bondedActorId } = resolveSiegeFocusCourtPosition(state, bs);

    const emitSpotlightDigest = (tplId: string | undefined) => {
      const rng2 = mulberry32(state.seed + state.tick * 113 + siegeNodeId.length);
      const tpl = selectSpotlightTemplate(phase, rng2, tplId);
      if (!tpl) return;

      const intrinsicTier = tpl.intrinsicTier ?? SIEGE_SPOTLIGHT_TIER_DEFAULT;
      const resolved = resolveEffectiveTier(intrinsicTier, courtPosition);
      const effectiveTier: AttentionTier = resolved === 'invisible' ? intrinsicTier : resolved;

      // Digest entry — siege spotlights surface to the Read the Threads panel
      const digestEntry: DigestEntry = {
        agentId: bondedActorId ?? bs.attackerArmyId,
        agentName: bondedActorId
          ? (state.graph.getNode(bondedActorId)?.name ?? 'Unknown')
          : (attackerNode.name ?? 'Siege'),
        encounterId: tpl.id,
        encounterName: tpl.title,
        encounterType: 'lead',
        reachPrimary: 'iron',
        tick: state.tick,
        success: true,
        significantOutcomes: [tpl.prose],
        capabilityChanges: {},
        attachmentsGained: [],
        attachmentsLost: [],
        quintessenceDelta: 0,
        isNotable: effectiveTier === 'story_beat',
        wasCuratedOut: false,
        isDormantAgent: false,
        sourceType: 'location',
      };
      if (!state.digestBuffer) {
        (state as { digestBuffer?: DigestEntry[] }).digestBuffer = [];
      }
      state.digestBuffer!.push(digestEntry);

      // Story-beat tier → enqueue directly
      if (effectiveTier === 'story_beat') {
        const siegeHex = (() => {
          const locEdge = state.graph.getOutgoingEdges(siegeNodeId, 'located_at')[0];
          const hexNode = locEdge ? state.graph.getNode(locEdge.target) : null;
          return {
            hexCol: (hexNode?.properties.hexCol as number | undefined) ?? 0,
            hexRow: (hexNode?.properties.hexRow as number | undefined) ?? 0,
          };
        })();
        const beat: QueuedStoryBeat = {
          encounterId: tpl.id,
          agentId: bondedActorId ?? bs.attackerArmyId,
          priority: 'template_intrinsic',
          queuedTick: state.tick,
          hexCol: siegeHex.hexCol,
          hexRow: siegeHex.hexRow,
        };
        if (!state.storyBeatQueue) {
          (state as { storyBeatQueue?: QueuedStoryBeat[] }).storyBeatQueue = [];
        }
        state.storyBeatQueue!.push(beat);
      }

      emitTrace({
        tick: state.tick,
        category: 'siege_spotlight_fired',
        summary: `Siege spotlight fired: ${tpl.title} (${intrinsicTier}→${effectiveTier}) at ${siegeNode.name}`,
        siegeId: siegeNodeId,
        templateId: tpl.id,
        intrinsicTier,
        effectiveTier,
        courtPositionUsed: courtPosition,
        bondedActorId,
      });
    };

    if (pacingSpotlightFired) emitSpotlightDigest(undefined);
    if (starvationSpotlightFired) emitSpotlightDigest('siege.spotlight.starvation');
  }

  const newMomentum = bs.momentum + momentumShift;
  const newSpotlightHistory = momentumShift !== 0
    ? [...bs.spotlightHistory, `siege_tick_${state.tick}_${phase}`]
    : bs.spotlightHistory;

  // Update battle state
  const updatedBattleState: BattleState = {
    ...bs,
    momentum: newMomentum,
    ticksSinceLastSpotlight: momentumShift !== 0 ? 0 : newTicksSinceSpotlight,
    spotlightHistory: newSpotlightHistory,
  };

  graph.updateNode(siegeNodeId, {
    properties: { ...graph.getNode(siegeNodeId)!.properties, battleState: updatedBattleState },
  });

  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Siege tick at ${siegeNode.name}: phase=${phase}, interval=${pacingInterval}, momentum ${bs.momentum.toFixed(1)}→${newMomentum.toFixed(1)}`,
    event: 'siege_tick',
    siegeId: siegeNodeId,
    phase,
    momentum: newMomentum,
    momentumShift,
    ticksElapsed,
    pacingInterval,
    attackerQ: newAttackerQ,
  });

  // 4. Generate regional encounters for nearby entities
  generateRegionalEncounters(state, siegeNodeId);

  // 5. Check resolution
  if (Math.abs(newMomentum) >= SIEGE_RESOLUTION_THRESHOLD) {
    const resolutionType: BattleResolutionType = newMomentum > 0
      ? 'attacker_victory' : 'defender_victory';
    resolveBattle(state, siegeNodeId, resolutionType);
    return;
  }

  if (ticksElapsed >= SIEGE_MAX_DURATION) {
    // Stalemate on timeout — attacker withdraws
    resolveBattle(state, siegeNodeId, 'stalemate');
    return;
  }

  if (newAttackerQ <= 0) {
    resolveBattle(state, siegeNodeId, 'defender_victory');
    return;
  }
}

// ─── Regional Encounter Generation ─────────────────────────────────────

/**
 * Generate regional encounters for entities near an active siege.
 *
 * Called each tick from tickSiege. Finds actors within SIEGE_REGIONAL_ENCOUNTER_RANGE
 * hexes and spawns appropriate encounter hooks based on their capabilities.
 * Deduplicates: one encounter per actor per siege.
 */
export function generateRegionalEncounters(state: GameState, siegeNodeId: string): void {
  const graph = state.graph;
  const siegeNode = graph.getNode(siegeNodeId);
  if (!siegeNode) return;

  const bs = siegeNode.properties.battleState as BattleState | undefined;
  if (!bs) return;

  // Get siege hex position
  const siegeLocEdge = graph.getOutgoingEdges(siegeNodeId, 'located_at')[0];
  if (!siegeLocEdge) return;
  const siegeHexNode = graph.getNode(siegeLocEdge.target);
  if (!siegeHexNode) return;

  const siegeCol = siegeHexNode.properties.hexCol as number | undefined;
  const siegeRow = siegeHexNode.properties.hexRow as number | undefined;
  if (siegeCol === undefined || siegeRow === undefined) return;

  // Track which actors already received a regional encounter from this siege
  const alreadySent = new Set<string>(
    (siegeNode.properties.siegeRegionalEncountersSent as string[] | undefined) ?? [],
  );

  // Collect attacker faction from the attacker army
  const attackerFaction = graph.getOutgoingEdges(bs.attackerArmyId, 'member_of')[0]?.target;

  // Find all actor nodes that are located at a hex within range
  const actorNodes = graph.getNodesByType('actor').filter(n => {
    // Skip battle/siege nodes (they have battleState)
    if (n.properties.battleState) return false;
    // Skip armies (they are managed separately)
    if (n.properties.armyState) return false;
    // Skip nodes already sent encounters
    if (alreadySent.has(n.id)) return false;
    // Skip nodes already in a battle
    const participatesEdges = graph.getOutgoingEdges(n.id, 'participates_in');
    if (participatesEdges.length > 0) return false;
    return true;
  });

  const newlySent: string[] = [];

  for (const actor of actorNodes) {
    // Get actor's hex position via located_at
    const locEdge = graph.getOutgoingEdges(actor.id, 'located_at')[0];
    if (!locEdge) continue;
    const hexNode = graph.getNode(locEdge.target);
    if (!hexNode) continue;

    const col = hexNode.properties.hexCol as number | undefined;
    const row = hexNode.properties.hexRow as number | undefined;
    if (col === undefined || row === undefined) continue;

    const dist = hexDistance({ col: siegeCol, row: siegeRow }, { col, row });
    if (dist > SIEGE_REGIONAL_ENCOUNTER_RANGE) continue;

    // Determine which encounter type this actor is eligible for
    const encounterType = selectRegionalEncounterType(state, actor.id, bs, attackerFaction);
    if (!encounterType) continue;

    // Look up the regional template to get intrinsicTier
    const regionalTemplate = SIEGE_REGIONAL_TEMPLATES.find(t => t.id === encounterType);
    const intrinsicTier: AttentionTier = regionalTemplate?.intrinsicTier ?? SIEGE_REGIONAL_TIER_DEFAULT;

    // Resolve actor's court position for effectiveTier
    let actorCourtPos: CourtPosition | null = null;
    if (state.ascendantId) {
      const threadEdge = state.graph.getOutgoingEdges(state.ascendantId, 'thread')
        .find(e => e.target === actor.id);
      actorCourtPos = (threadEdge?.properties?.courtPosition as CourtPosition | undefined) ?? null;
    }
    const resolvedTier = resolveEffectiveTier(intrinsicTier, actorCourtPos);
    const effectiveTier: AttentionTier = resolvedTier === 'invisible' ? 'background' : resolvedTier;

    emitTrace({
      tick: state.tick,
      category: 'siege_regional_seeded',
      summary: `Siege at ${siegeHexNode.name} draws in ${actor.name}: ${encounterType} (${intrinsicTier}→${effectiveTier}, ${dist} hexes)`,
      siegeId: siegeNodeId,
      templateId: encounterType,
      actorId: actor.id,
      intrinsicTier,
      effectiveTier,
      triggerType: regionalTemplate?.triggerType ?? 'shadow',
    });

    newlySent.push(actor.id);
  }

  if (newlySent.length > 0) {
    const updatedSent = [...alreadySent, ...newlySent];
    graph.updateNode(siegeNodeId, {
      properties: {
        ...graph.getNode(siegeNodeId)!.properties,
        siegeRegionalEncountersSent: updatedSent,
      },
    });
  }
}

/**
 * Determine what kind of regional encounter an actor is eligible for.
 * Returns null if the actor has no relevant connection to the siege.
 */
function selectRegionalEncounterType(
  state: GameState,
  actorId: string,
  bs: BattleState,
  attackerFactionId: string | undefined,
): string | null {
  const graph = state.graph;
  const actorNode = graph.getNode(actorId);
  if (!actorNode) return null;

  const actorFaction = graph.getOutgoingEdges(actorId, 'member_of')[0]?.target;
  const properties = actorNode.properties as Record<string, unknown>;

  // Shadow-capable agents near siege can smuggle supplies
  const isShadowCapable = (properties.shadowCapability as number ?? 0) > 0 ||
    (properties.domainCapabilities as Record<string, number> | undefined)?.['Shadow'] != null;

  // Heart-capable agents can negotiate terms
  const isHeartCapable = (properties.heartCapability as number ?? 0) > 0 ||
    (properties.domainCapabilities as Record<string, number> | undefined)?.['Heart'] != null;

  // Allied with attacker?
  const isAttackerAllied = attackerFactionId !== undefined && actorFaction === attackerFactionId;

  // Allied with defender?
  const defenderFaction = graph.getOutgoingEdges(bs.defenderArmyId, 'member_of')[0]?.target;
  const settleNode = bs.settlementId ? graph.getNode(bs.settlementId) : null;
  const settleFaction = settleNode
    ? graph.getOutgoingEdges(bs.settlementId!, 'controlled_by')[0]?.target
    : undefined;
  const isDefenderAllied = (actorFaction !== undefined) &&
    (actorFaction === defenderFaction || actorFaction === settleFaction);

  if (isAttackerAllied) return 'siege.regional.join_attackers';
  if (isDefenderAllied) return 'siege.regional.call_for_aid';
  if (isShadowCapable) return 'siege.regional.smuggle_supplies';
  if (isHeartCapable) return 'siege.regional.negotiate_terms';

  return null;
}

// ─── Breach Spotlight ───────────────────────────────────────────────────

/**
 * Apply breach fortification reduction when a breach spotlight resolves.
 * Reduces the settlement's fortification multiplier property.
 */
export function applyBreachFortificationReduction(state: GameState, siegeNodeId: string): void {
  const graph = state.graph;
  const siegeNode = graph.getNode(siegeNodeId);
  if (!siegeNode) return;

  const bs = siegeNode.properties.battleState as BattleState | undefined;
  if (!bs || !bs.settlementId) return;

  const settlementNode = graph.getNode(bs.settlementId);
  if (!settlementNode) return;

  const currentFortification = (settlementNode.properties.fortificationMultiplier as number)
    ?? getFortificationModifier(settlementNode.properties.locationSubtype as string | undefined);

  const reducedFortification = Math.max(1, currentFortification * BREACH_FORTIFICATION_REDUCTION);

  graph.updateNode(bs.settlementId, {
    properties: {
      ...settlementNode.properties,
      fortificationMultiplier: reducedFortification,
    },
  });

  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Breach at ${settlementNode.name}: fortification reduced from ${currentFortification.toFixed(1)}x to ${reducedFortification.toFixed(1)}x`,
    event: 'siege_breach',
    siegeId: siegeNodeId,
    settlementId: bs.settlementId,
    fortificationBefore: currentFortification,
    fortificationAfter: reducedFortification,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getGarrisonSize(locationSubtype: string | undefined): number {
  switch (locationSubtype) {
    case 'capital': return 1000;
    case 'city': return 500;
    case 'town': return 200;
    case 'hamlet': return 50;
    default: return 50;
  }
}
