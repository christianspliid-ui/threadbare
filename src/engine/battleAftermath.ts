/**
 * Battle Aftermath — TB-073 Phase 5.
 *
 * When battles/sieges resolve, destruction is applied scaled by outcome
 * severity. Affects trade routes, prosperity, settlement tier, sublocations,
 * sphere pressure, and commander fate.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 5
 * NFP: Tunability (all thresholds named), Determinism (commander fate seeded PRNG),
 *       Inspectability (DestructionTrace), Fail-soft (missing data → skip effect).
 */

import type { GameState } from '../types/gameState';
import type { BattleState, BattleResolutionType } from '../types/battle';
import type { ArmyState } from '../types/army';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import type { SphereName } from '../types/index';
import { emitTrace } from './traceBuffer';
import { disbandArmy } from './armyAttrition';
import { stampRealmSeat } from './realmSeat';
import { touchStructure } from './simulationRuntime';
import type { SimulationRuntime } from './simulationRuntime';
import { REALM_CONQUEST_SEVERITY } from '../data/realm-content';

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

// ─── Types ──────────────────────────────────────────────────────────────

export type DestructionSeverity = 'minor' | 'major' | 'total';

export type CommanderFate = 'retreated' | 'captured' | 'killed';

// ─── Constants ──────────────────────────────────────────────────────────

/** Momentum magnitude for total destruction */
export const TOTAL_DESTRUCTION_THRESHOLD = 10;

/** Momentum magnitude for major destruction */
export const MAJOR_DESTRUCTION_THRESHOLD = 6;

/** Prosperity reduction on minor defeat */
export const PROSPERITY_LOSS_MINOR = 0.20;

/** Prosperity reduction on major defeat */
export const PROSPERITY_LOSS_MAJOR = 0.50;

/** How long a captured commander is out of play */
export const COMMANDER_CAPTURE_DURATION = 10;

/** Probability of commander death on total defeat */
export const COMMANDER_DEATH_CHANCE_TOTAL = 0.30;

/** Refugee encounters at neighbors on major defeat */
export const REFUGEE_GENERATION_MAJOR = 1;

/** More refugees on total destruction */
export const REFUGEE_GENERATION_TOTAL = 3;

/** Sphere pressure magnitude multiplier for minor aftermath */
export const SPHERE_PRESSURE_MINOR_MULTIPLIER = 1.0;

/** Sphere pressure magnitude multiplier for major aftermath */
export const SPHERE_PRESSURE_MAJOR_MULTIPLIER = 2.0;

/** Sphere pressure magnitude multiplier for total aftermath */
export const SPHERE_PRESSURE_TOTAL_MULTIPLIER = 3.0;

/** Base sphere pressure applied per aftermath event */
export const AFTERMATH_BASE_SPHERE_PRESSURE = 3;

// ─── Severity Calculation ───────────────────────────────────────────────

/**
 * Calculate destruction severity from final momentum and loser's remaining strength.
 */
export function calculateDestructionSeverity(
  finalMomentum: number,
  loserCohesionPercent: number,
): DestructionSeverity {
  const magnitude = Math.abs(finalMomentum);
  if (magnitude >= TOTAL_DESTRUCTION_THRESHOLD && loserCohesionPercent < 0.15) return 'total';
  if (magnitude >= MAJOR_DESTRUCTION_THRESHOLD) return 'major';
  return 'minor';
}

// ─── Commander Fate ─────────────────────────────────────────────────────

/**
 * Determine what happens to the losing commander.
 * Minor: always retreat. Major: 50/50 capture/escape. Total: 30% death, 70% capture.
 */
export function determineCommanderFate(
  severity: DestructionSeverity,
  rng: () => number,
): CommanderFate {
  switch (severity) {
    case 'minor':
      return 'retreated';
    case 'major': {
      const roll = rng();
      return roll < 0.5 ? 'captured' : 'retreated';
    }
    case 'total': {
      const roll = rng();
      return roll < COMMANDER_DEATH_CHANCE_TOTAL ? 'killed' : 'captured';
    }
  }
}

// ─── Refugee Encounters ─────────────────────────────────────────────────

/**
 * Generate refugee encounter nodes at nearby non-ruined settlements.
 *
 * Finds settlements connected via `adjacent` edges to the battle hex.
 * Fail-soft: if no neighbors exist, returns empty array.
 */
export function generateRefugeeEncounters(
  state: GameState,
  battleHexId: string,
  count: number,
): string[] {
  if (count <= 0) return [];

  const graph = state.graph;
  const generated: string[] = [];

  // Find adjacent hexes via `adjacent` graph edges
  const adjEdges = [
    ...graph.getOutgoingEdges(battleHexId, 'adjacent'),
    ...graph.getIncomingEdges(battleHexId, 'adjacent'),
  ];

  const neighborIds = [...new Set(adjEdges.map(e =>
    e.source === battleHexId ? e.target : e.source,
  ))];

  // Find settlements at neighboring hexes (non-ruined)
  const neighborSettlements: string[] = [];
  for (const hexId of neighborIds) {
    // Check if hex itself is a settlement
    const hexNode = graph.getNode(hexId);
    if (hexNode?.properties.locationSubtype &&
        hexNode.properties.locationSubtype !== 'ruins' &&
        ['hamlet', 'town', 'city', 'capital'].includes(hexNode.properties.locationSubtype as string)) {
      neighborSettlements.push(hexId);
      continue;
    }

    // Check for location nodes at this hex
    const locNodes = graph.getNodesByType('location').filter(loc => {
      const locEdges = graph.getOutgoingEdges(loc.id, 'located_at');
      return locEdges.some(e => e.target === hexId);
    });
    for (const loc of locNodes) {
      if (loc.properties.locationSubtype &&
          loc.properties.locationSubtype !== 'ruins' &&
          ['hamlet', 'town', 'city', 'capital'].includes(loc.properties.locationSubtype as string)) {
        neighborSettlements.push(loc.id);
      }
    }
  }

  if (neighborSettlements.length === 0) return [];

  // Distribute refugees across available settlements (wrap if count > settlements)
  for (let i = 0; i < count; i++) {
    const targetId = neighborSettlements[i % neighborSettlements.length];
    const refugeeId = `refugee_enc_${battleHexId}_${state.tick}_${i}`;

    // Attach a refugee flag to the target settlement
    try {
      const targetNode = graph.getNode(targetId);
      if (targetNode) {
        const existingRefugees = (targetNode.properties.pendingRefugeeCount as number) ?? 0;
        graph.updateNode(targetId, {
          properties: { pendingRefugeeCount: existingRefugees + 1 },
        });
        generated.push(refugeeId);
      }
    } catch { /* fail-soft: settlement may have been modified */ }
  }

  return generated;
}

// ─── Sphere Pressure ────────────────────────────────────────────────────

/**
 * Apply victor's dominant sphere pressure to affected location.
 * Magnitude is multiplied by severity (1x minor / 2x major / 3x total).
 * On total: also erode loser's sphere scores toward minimum.
 *
 * Returns pending sphere pressure events to be merged into state.
 */
function buildSpherePressureEvents(
  state: GameState,
  victorArmyId: string,
  settlementId: string | undefined,
  severity: DestructionSeverity,
): SpherePressureEvent[] {
  const graph = state.graph;
  const events: SpherePressureEvent[] = [];

  if (!settlementId) return events;

  // Find victor's faction
  const victorFactionId = graph.getOutgoingEdges(victorArmyId, 'member_of')[0]?.target;
  if (!victorFactionId) return events;

  const factionNode = graph.getNode(victorFactionId);
  if (!factionNode) return events;

  // Find dominant sphere from faction's sphereAffinity
  const affinity = factionNode.properties.sphereAffinity as { scores?: Record<string, number> } | undefined;
  if (!affinity?.scores) return events;

  const dominantSphere = Object.entries(affinity.scores).reduce(
    (best, [sphere, score]) => score > best.score ? { sphere, score } : best,
    { sphere: '', score: -1 },
  );

  if (!dominantSphere.sphere) return events;

  const multiplier = severity === 'total' ? SPHERE_PRESSURE_TOTAL_MULTIPLIER
    : severity === 'major' ? SPHERE_PRESSURE_MAJOR_MULTIPLIER
    : SPHERE_PRESSURE_MINOR_MULTIPLIER;

  events.push({
    targetEntityId: settlementId,
    sphere: dominantSphere.sphere as SphereName,
    magnitude: AFTERMATH_BASE_SPHERE_PRESSURE * multiplier,
    source: 'environmental',
    sourceId: victorArmyId,
  });

  return events;
}

// ─── Conquest ────────────────────────────────────────────────────────────

/**
 * A town changes hands (THR-1155 § Engine E) — **the one runtime producer of a
 * faction's `controls` edge**.
 *
 * Before this, a won siege at total severity ran a power vacuum: the defender's edges
 * were deleted and the town was left nobody's. The victor's faction was already known
 * here and used only for sphere pressure. So the political border could shrink and
 * never grow, and *{Realm} takes {Location}* was a chronicle line with no producer —
 * which is why the map this feeds could only ever lose territory.
 *
 * The rule is *the army that sacks a town takes it for its faction*, which resolves
 * four ways:
 *
 * - the town has a faction holder → that edge is **retargeted** to the victor's faction
 *   (`retargetEdgeSource`, never delete-and-add — the edge id is the audit trail) and
 *   re-stamped `establishedTick` / `via: 'conquest'`;
 * - the town has none → the victor's faction **gains a fresh one**, because the rule is
 *   *takes it*, not *takes it from someone*: an earlier vacuum's leavings and wilds no
 *   Realm ever held are both takeable;
 * - the holder already **is** the victor's faction (a double aftermath) → nothing is
 *   written and the trace says `'retained'`;
 * - the victor army belongs to **no** faction (a rebel host, a monster horde with no
 *   definition) → the town falls into the vacuum exactly as it did before.
 *
 * A mortal's `controlType: 'strategic'` hold is deliberately **not** touched: the hold
 * is a commitment to the town, not to the faction, and what it means inside a new Realm
 * is THR-1448's question.
 *
 * NFP #4 (fail-soft): every graph write is guarded; a missing node, a vanished edge or
 * an absent runtime each degrade to less happening, never to a throw inside the tick.
 */
export function applyConquestOrVacuum(
  state: GameState,
  settlementId: string,
  victorArmyId: string,
  runtime?: SimulationRuntime,
): void {
  const graph = state.graph;

  const isFactionSourced = (edgeSource: string): boolean =>
    graph.getNode(edgeSource)?.properties.actorType === 'faction';

  const victorFactionId = graph.getOutgoingEdges(victorArmyId, 'member_of')[0]?.target;
  const victorIsFaction = victorFactionId !== undefined && isFactionSourced(victorFactionId);

  // The faction-sourced holders. A mortal's strategic stance also rides `controls`, so
  // the filter is what keeps conquest off THR-1448's ground.
  const factionEdges = graph.getIncomingEdges(settlementId, 'controls')
    .filter(e => isFactionSourced(e.source));
  const priorHolderId = factionEdges[0]?.source ?? null;

  // ── Vacuum: a victor with no faction takes nothing, exactly as before ──
  if (!victorIsFaction) {
    for (const edge of factionEdges) {
      try { graph.removeEdge(edge.id); } catch { /* already removed */ }
    }
    if (factionEdges.length > 0 && runtime) touchStructure(runtime);
    emitConquestTrace(state, {
      outcome: 'vacated',
      locationId: settlementId,
      fromFactionId: priorHolderId,
      toFactionId: null,
      victorArmyId,
      seatMoved: false,
    });
    // A Realm that just lost a town may have lost its seat with it.
    if (priorHolderId) { try { stampRealmSeat(graph, priorHolderId); } catch { /* fail-soft */ } }
    return;
  }

  // ── Retained: a double aftermath over the victor's own town writes nothing ──
  if (factionEdges.length > 0 && factionEdges.every(e => e.source === victorFactionId)) {
    emitConquestTrace(state, {
      outcome: 'retained',
      locationId: settlementId,
      fromFactionId: victorFactionId!,
      toFactionId: victorFactionId!,
      victorArmyId,
      seatMoved: false,
    });
    return;
  }

  // A seat rides on the *edge*, so retargeting one hands the loser's court to the
  // victor by accident. Noticed on the projection measurement (faction_1's seat went
  // null when faction_0 took `loc_10`): both sides are re-stamped below, and the trace
  // records that a court moved rather than leaving it to be discovered on the map.
  const seatMoved = factionEdges.some(e => e.properties.role === 'seat');

  let outcome: 'taken' | 'claimed';
  if (factionEdges.length > 0) {
    outcome = 'taken';
    for (const edge of factionEdges) {
      try {
        graph.retargetEdgeSource(edge.id, victorFactionId!);
        graph.updateEdge(edge.id, {
          properties: { establishedTick: state.tick, via: 'conquest' },
        });
      } catch { /* fail-soft: edge removed mid-aftermath */ }
    }
  } else {
    outcome = 'claimed';
    try {
      graph.addEdge({
        id: `e_controls_conquest_${victorFactionId}_${settlementId}_${state.tick}`,
        source: victorFactionId!,
        target: settlementId,
        type: 'controls',
        properties: { establishedTick: state.tick, via: 'conquest' },
      });
    } catch { /* fail-soft: duplicate id on a double aftermath */ }
  }

  if (runtime) touchStructure(runtime);

  // Re-stamp both courts. The victor may have inherited a `role: 'seat'` it never chose;
  // the loser may have been left seatless. `stampRealmSeat` is idempotent and returns
  // null for a Realm holding nothing, which is the fail-soft answer, not an error.
  try { stampRealmSeat(graph, victorFactionId!); } catch { /* fail-soft */ }
  if (priorHolderId && priorHolderId !== victorFactionId) {
    try { stampRealmSeat(graph, priorHolderId); } catch { /* fail-soft */ }
  }

  emitConquestTrace(state, {
    outcome,
    locationId: settlementId,
    fromFactionId: outcome === 'taken' ? priorHolderId : null,
    toFactionId: victorFactionId!,
    victorArmyId,
    seatMoved,
  });
}

/** The *takes / loses* line, in the words the chronicle reads (§ Content). */
function emitConquestTrace(
  state: GameState,
  fields: {
    outcome: 'taken' | 'claimed' | 'retained' | 'vacated';
    locationId: string;
    fromFactionId: string | null;
    toFactionId: string | null;
    victorArmyId: string;
    seatMoved: boolean;
  },
): void {
  const graph = state.graph;
  const nameOf = (id: string | null): string =>
    (id ? (graph.getNode(id)?.name ?? id) : 'no one');
  const place = nameOf(fields.locationId);

  const summary = fields.outcome === 'taken'
    ? `${nameOf(fields.toFactionId)} takes ${place} from ${nameOf(fields.fromFactionId)}`
    : fields.outcome === 'claimed'
      ? `${nameOf(fields.toFactionId)} takes ${place}`
      : fields.outcome === 'retained'
        ? `${nameOf(fields.toFactionId)} holds ${place} still`
        : `${nameOf(fields.fromFactionId)} loses ${place}`;

  emitTrace({
    tick: state.tick,
    category: 'realm_territory_change',
    summary,
    ...fields,
  });
}

// ─── Aftermath Application ──────────────────────────────────────────────

/**
 * Apply aftermath consequences when a battle/siege resolves.
 *
 * Called by resolveBattle after determining the outcome.
 */
export function applyAftermath(
  state: GameState,
  battleState: BattleState,
  resolutionType: BattleResolutionType,
  runtime?: SimulationRuntime,
): void {
  const graph = state.graph;

  if (resolutionType === 'stalemate') {
    // Stalemate: minor consequences, both sides withdraw
    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Battle stalemate — both sides withdraw with minor damage`,
      event: 'aftermath_stalemate',
    });
    return;
  }

  // Determine winner and loser
  const isAttackerVictory = resolutionType === 'attacker_victory';
  const victorArmyId = isAttackerVictory ? battleState.attackerArmyId : battleState.defenderArmyId;
  const loserArmyId = isAttackerVictory ? battleState.defenderArmyId : battleState.attackerArmyId;

  const loserNode = graph.getNode(loserArmyId);
  const loserState = loserNode?.properties.armyState as ArmyState | undefined;
  const loserQPercent = loserState
    ? loserState.cohesion / Math.max(1, loserState.cohesionMax)
    : 0;

  const severity = calculateDestructionSeverity(
    battleState.momentum,
    loserQPercent,
  );

  const rng = mulberry32(state.seed + state.tick * 73 + battleState.startedTick);

  // ── Settlement effects (for sieges) ──
  const settlementId = battleState.settlementId;
  const settlementNode = settlementId ? graph.getNode(settlementId) : null;
  let prosperityBefore = 0;
  let prosperityAfter = 0;
  let sublocationsDestroyed: string[] = [];
  let tradeRoutesSevered: string[] = [];

  if (settlementNode && isAttackerVictory) {
    // Prosperity damage.
    //
    // Read through a `typeof` guard, as `phaseUnrest`, `guildSeeding`, `sublocation`
    // and `complicationEffects` all already do. The `as number` cast this replaces was
    // the only unguarded reader of the field, and `?? 0` catches null but not a value
    // of the wrong *type* — so a settlement carrying a non-number went straight into
    // `prosperityBefore.toFixed(2)` in the trace line below and **threw inside the
    // tick loop** (NFP #4: a tick must never crash). `runTick`'s catch then returned
    // the unchanged state, so the tick stopped advancing and every later tick re-threw:
    // 300 `runTick` calls reached tick 167, and the run's events repeated forever.
    //
    // The corrupt value was real and predated this guard: `applyNodeChanges` understood
    // a relative change written as the string `'-25'` but not the object `{ delta: -25 }`
    // that `monster-encounter-content.ts` authors, so the executor wrote the object
    // verbatim into the property (measured on `origin/main` at tick 300 of seed 42:
    // three Locations carrying `{ delta: n }` in `properties.defense`).
    //
    // THR-1456 has since closed that writer — the executor now understands the object
    // spelling — so no *current* writer produces this shape. The guard stays anyway, and
    // deliberately: it owns the tick loop, which must survive bad data whoever wrote it
    // (NFP #4), and the next mis-shaped writer is not required to announce itself.
    const rawProsperity = settlementNode.properties.prosperity;
    prosperityBefore = typeof rawProsperity === 'number' ? rawProsperity : 0;
    const prosperityLoss = severity === 'total' ? 1.0
      : severity === 'major' ? PROSPERITY_LOSS_MAJOR
      : PROSPERITY_LOSS_MINOR;
    prosperityAfter = severity === 'total' ? 0 : Math.max(0, prosperityBefore * (1 - prosperityLoss));

    graph.updateNode(settlementId!, {
      properties: { prosperity: prosperityAfter },
    });

    // Settlement tier downgrade (major/total)
    if (severity === 'major' || severity === 'total') {
      const currentSubtype = settlementNode.properties.locationSubtype as string;
      const downgraded = downgradeSettlement(currentSubtype, severity);
      if (downgraded !== currentSubtype) {
        graph.updateNode(settlementId!, {
          properties: { locationSubtype: downgraded },
        });
      }
    }

    // Sublocation destruction (major: 1-2, total: all)
    const sublocations = graph.getOutgoingEdges(settlementId!, 'contains')
      .map(e => e.target)
      .filter(id => graph.getNode(id)?.type === 'location');

    if (severity === 'total') {
      sublocationsDestroyed = [...sublocations];
    } else if (severity === 'major' && sublocations.length > 0) {
      const count = Math.min(2, sublocations.length);
      // Seeded selection of which sublocations to destroy
      const shuffled = [...sublocations].sort(() => rng() - 0.5);
      sublocationsDestroyed = shuffled.slice(0, count);
    }

    for (const subId of sublocationsDestroyed) {
      try { graph.removeNode(subId); } catch { /* already gone */ }
    }

    // Trade route disruption
    const tradeEdges = [
      ...graph.getOutgoingEdges(settlementId!, 'trades_with'),
      ...graph.getIncomingEdges(settlementId!, 'trades_with'),
    ];

    if (severity === 'minor') {
      // Flag as threatened
      for (const edge of tradeEdges) {
        graph.updateEdge(edge.id, { properties: { ...edge.properties, threatened: true } });
      }
    } else {
      // Sever trade routes
      for (const edge of tradeEdges) {
        tradeRoutesSevered.push(edge.id);
        try { graph.removeEdge(edge.id); } catch { /* already gone */ }
      }
    }
  }

  // ── Conquest (the sack severity only) ──
  if (settlementId && settlementNode && isAttackerVictory && severity === REALM_CONQUEST_SEVERITY) {
    applyConquestOrVacuum(state, settlementId, victorArmyId, runtime);
  }

  // ── Sphere pressure ──
  const spherePressureEvents = settlementId && isAttackerVictory
    ? buildSpherePressureEvents(state, victorArmyId, settlementId, severity)
    : [];

  if (spherePressureEvents.length > 0) {
    const existing = (state.pendingSpherePressures ?? []) as SpherePressureEvent[];
    (state as Record<string, unknown>).pendingSpherePressures = [
      ...existing,
      ...spherePressureEvents,
    ];
  }

  // ── Refugee generation ──
  const refugeeCount = severity === 'total' ? REFUGEE_GENERATION_TOTAL
    : severity === 'major' ? REFUGEE_GENERATION_MAJOR
    : 0;

  // Find battle hex via the loser army's located_at edge (or victor's)
  const battleHexId = (() => {
    // Try victor army location
    const victorNode = graph.getNode(victorArmyId);
    const victorLoc = victorNode
      ? graph.getOutgoingEdges(victorArmyId, 'located_at')[0]?.target
      : undefined;
    if (victorLoc) return victorLoc;
    // Fall back to settlement's hex (for siege aftermath)
    if (settlementId) {
      const settlementLocEdge = graph.getOutgoingEdges(settlementId, 'located_at')[0];
      if (settlementLocEdge) return settlementLocEdge.target;
    }
    return undefined;
  })();

  const refugeeIds = battleHexId
    ? generateRefugeeEncounters(state, battleHexId, refugeeCount)
    : [];

  // ── Commander fate ──
  let commanderFate: CommanderFate = 'retreated';
  // commanded_by goes army → commander, so check outgoing from army
  const loserCmdEdges = loserNode ? graph.getOutgoingEdges(loserArmyId, 'commanded_by') : [];
  const commanderId = loserCmdEdges[0]?.target;

  if (commanderId) {
    commanderFate = determineCommanderFate(severity, rng);

    if (commanderFate === 'killed') {
      try { graph.removeNode(commanderId); } catch { /* already gone */ }
    } else if (commanderFate === 'captured') {
      // Mark commander as captured — out of play for N ticks
      const cmdNode = graph.getNode(commanderId);
      if (cmdNode) {
        graph.updateNode(commanderId, {
          properties: {
            capturedUntilTick: state.tick + COMMANDER_CAPTURE_DURATION,
            capturedBy: victorArmyId,
          },
        });
      }
    }
    // retreated: commander stays at current location, no special state
  }

  // ── Disband losing army ──
  if (loserNode) {
    disbandArmy(state, loserArmyId);
  }

  // ── Emit trace ──
  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Aftermath: ${severity} ${resolutionType} — prosperity ${prosperityBefore.toFixed(2)}→${prosperityAfter.toFixed(2)}, ${sublocationsDestroyed.length} sublocations destroyed, ${tradeRoutesSevered.length} routes severed, commander ${commanderFate}, ${refugeeIds.length} refugee events`,
    event: 'aftermath_applied',
    severity,
    resolutionType,
    settlementId,
    sublocationsDestroyed,
    tradeRoutesSevered,
    prosperityBefore,
    prosperityAfter,
    commanderFate,
    commanderId,
    refugeeCount: refugeeIds.length,
    spherePressureCount: spherePressureEvents.length,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────

function downgradeSettlement(currentSubtype: string, severity: DestructionSeverity): string {
  if (severity === 'total') return 'ruins';

  // Major: downgrade one tier
  switch (currentSubtype) {
    case 'capital': return 'city';
    case 'city': return 'town';
    case 'town': return 'hamlet';
    case 'hamlet': return 'hamlet'; // Can't downgrade further
    default: return currentSubtype;
  }
}
