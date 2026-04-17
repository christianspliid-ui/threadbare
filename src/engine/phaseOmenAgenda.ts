/**
 * Phase Omen Agenda — THR-19
 *
 * Runs as Phase 1.7 (after phaseDoom, before action processing).
 * Selects and rotates short-lived omen tracks in primary/secondary slots.
 * Emits atmospheric micro-event beats on interval.
 *
 * NFP Compliance:
 * - #1 Tunability: all thresholds are named constants
 * - #2 Inspectability: selection traces log all candidates + scores
 * - #3 Determinism: seeded PRNG via mulberry32
 * - #4 Fail-soft: every branch terminates safely; missing templates → fallback
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { OmenState, ActiveOmen, OmenTrackTemplate, CompletedOmen, EmittedOmen, OmenCategory } from '../types/omen';
import { EMITTED_OMEN_SCORE_WEIGHT } from '../data/game-config';
import { hexDistance } from '../lib/hexMath';
import {
  OMEN_TEMPLATES,
  getDoomEchoTemplates,
  getEligibleSphereSurgeTemplates,
  getSeasonalTemplates,
  getOmenTemplateById,
} from '../data/omenTemplates';
import { emitTrace } from './traceBuffer';
import { appendRecentEvent } from './encounterAftermath';

// ─── Tunable Constants (NFP #1) ──────────────────────────────────

/** Earliest tick an omen can first activate */
export const OMEN_FIRST_ACTIVATION_TICK = 3;
/** Minimum selection score for the secondary slot to activate */
export const OMEN_SECONDARY_THRESHOLD = 0.4;
/** Default ticks between omen beat emissions when template doesn't specify */
export const OMEN_BEAT_INTERVAL_DEFAULT = 3;
/** Significance for omen_beat TickEvents */
export const OMEN_BEAT_SIGNIFICANCE = 0.5;
/** Significance for omen_started / omen_expired TickEvents */
export const OMEN_START_SIGNIFICANCE = 0.7;
/** Maximum encounter type bias from omens (clamped) */
export const OMEN_ENCOUNTER_BIAS_CAP = 0.4;
/** Max sphere pressure per tick from a sphere-surge omen */
export const OMEN_SPHERE_PRESSURE_CAP = 0.05;
/** Minimum sphere dominance fraction to trigger a sphere-surge omen (per-sphere normalized weight) */
export const OMEN_SPHERE_DOMINANCE_THRESHOLD = 0.25;
/** Max completed omens retained in history */
export const OMEN_MAX_HISTORY = 20;
/** Whether doom stage transitions force-expire the primary omen */
export const OMEN_DOOM_STAGE_FORCE_EXPIRE = true;

// ─── Internal helpers ────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let eventCounter = 0;
export function resetOmenCounter(): void {
  eventCounter = 0;
}

function nextEventId(tick: number): string {
  return `omen_evt_${tick}_${eventCounter++}`;
}

/** Pick one item from array via PRNG. Returns undefined if empty. */
function pickRandom<T>(items: T[], rng: () => number): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}

/** Choose duration within the template range via PRNG. */
function chooseDuration(range: [number, number], rng: () => number): number {
  const [min, max] = range;
  if (min >= max) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

/** Trim history to max size, keeping most recent. */
function trimHistory(history: CompletedOmen[]): CompletedOmen[] {
  if (history.length <= OMEN_MAX_HISTORY) return history;
  return history.slice(history.length - OMEN_MAX_HISTORY);
}

// ─── Cultural condition evaluation ──────────────────────────────

function evaluateCulturalConditions(state: GameState): {
  factionConflictCount: number;
  avgProsperity: number;
  avgUnrest: number;
  recentDeaths: number;
  recentDiscoveries: number;
} {
  const graph = state.graph;

  // Faction conflict: count faction-pair edges with hostility
  const factionNodes = graph.getNodesByType('faction');
  let factionConflictCount = 0;
  const seen = new Set<string>();
  for (const a of factionNodes) {
    for (const b of factionNodes) {
      if (a.id >= b.id) continue;
      const key = `${a.id}|${b.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const edges = graph.getEdgesBetween?.(a.id, b.id, 'faction_relation') ?? [];
      for (const edge of edges) {
        const trust = (edge.properties?.trust as number) ?? 0;
        if (trust < -0.3) { factionConflictCount++; break; }
      }
    }
  }

  // Prosperity and unrest: average across settlement nodes
  const settlements = graph.getNodesByType('location').filter(n => {
    const subtype = n.properties?.locationSubtype as string | undefined;
    return ['hamlet', 'town', 'city', 'capital'].includes(subtype ?? '');
  });

  let totalProsperity = 0;
  let totalUnrest = 0;
  const count = settlements.length || 1;
  for (const s of settlements) {
    totalProsperity += (s.properties?.prosperity as number) ?? 50;
    totalUnrest += (s.properties?.unrest as number) ?? 0;
  }
  const avgProsperity = totalProsperity / count;
  const avgUnrest = totalUnrest / count;

  // Recent deaths and discoveries from recentEvents (last 5 ticks)
  const recentCutoff = state.tick - 5;
  let recentDeaths = 0;
  let recentDiscoveries = 0;
  for (const evt of state.recentEvents) {
    if (evt.tick < recentCutoff) continue;
    if (evt.type === 'npc_graduated') recentDeaths++;
    if (evt.type === 'domain_revealed' || evt.type === 'hidden_site_discovered' || evt.type === 'elder_site_discovered') {
      recentDiscoveries++;
    }
  }

  return { factionConflictCount, avgProsperity, avgUnrest, recentDeaths, recentDiscoveries };
}

function evaluateCulturalTemplate(
  template: OmenTrackTemplate,
  conditions: ReturnType<typeof evaluateCulturalConditions>,
): number {
  if (template.category !== 'cultural' || !template.culturalTrigger) return 0;
  const { type, threshold } = template.culturalTrigger;
  switch (type) {
    case 'faction_conflict':
      return conditions.factionConflictCount >= threshold ? 0.8 : 0;
    case 'low_prosperity':
      return conditions.avgProsperity < threshold ? 0.8 : 0;
    case 'high_prosperity':
      return conditions.avgProsperity >= threshold ? 0.8 : 0;
    case 'high_unrest':
      return conditions.avgUnrest >= threshold ? 0.8 : 0;
    case 'mass_death':
      return conditions.recentDeaths >= threshold ? 0.8 : 0;
    case 'discovery_surge':
      return conditions.recentDiscoveries >= threshold ? 0.8 : 0;
    default:
      return 0;
  }
}

// ─── Sphere dominance ───────────────────────────────────────────

function getSphereDominance(state: GameState): Partial<Record<string, number>> {
  // Use fundament.sphereWeights (normalized, updated each tick by phaseSphereAggregation)
  return state.worldSoul.fundament.sphereWeights ?? {};
}

// ─── Selection pipelines ─────────────────────────────────────────

interface SelectionResult {
  template: OmenTrackTemplate | null;
  candidates: Array<{ templateId: string; score: number }>;
  reason: string;
}

function selectPrimaryOmen(
  state: GameState,
  currentTemplateId: string | null,
  rng: () => number,
): SelectionResult {
  const archetype = state.doomDefinition?.archetype ?? '';
  const stage = state.doomClock?.currentStage ?? 0;

  // 1. Try doom-echo templates for current archetype + stage
  const doomCandidates = getDoomEchoTemplates(archetype, stage);

  // Exclude the currently active template to promote variety on re-selection
  const filtered = doomCandidates.filter(t => t.id !== currentTemplateId);
  const pool = filtered.length > 0 ? filtered : doomCandidates;

  if (pool.length > 0) {
    const scored: Array<{ templateId: string; score: number }> = pool.map(t => ({
      templateId: t.id,
      score: 1.0,  // Doom-echo candidates all score equally; pick via PRNG
    }));
    const pick = pickRandom(pool, rng);
    return {
      template: pick ?? null,
      candidates: scored,
      reason: `doom_stage_${stage}_${archetype}`,
    };
  }

  // 2. Fall back to seasonal
  const seasonals = getSeasonalTemplates();
  if (seasonals.length === 0) {
    return { template: null, candidates: [], reason: 'no_candidates' };
  }
  const seasonalPick = pickRandom(seasonals, rng);
  return {
    template: seasonalPick ?? null,
    candidates: seasonals.map(t => ({ templateId: t.id, score: 0.5 })),
    reason: 'seasonal_fallback',
  };
}

function selectSecondaryOmen(
  state: GameState,
  primaryId: string | null,
  rng: () => number,
): SelectionResult {
  const sphereDominance = getSphereDominance(state);
  const cultural = evaluateCulturalConditions(state);

  const candidates: Array<{ template: OmenTrackTemplate; score: number }> = [];

  // Sphere-surge candidates
  const sphereSurge = getEligibleSphereSurgeTemplates(sphereDominance);
  for (const t of sphereSurge) {
    if (t.id === primaryId) continue;
    const dom = sphereDominance[t.sphereTrigger!.sphere] ?? 0;
    const score = Math.min(1.0, dom / OMEN_SPHERE_DOMINANCE_THRESHOLD);
    candidates.push({ template: t, score });
  }

  // Cultural candidates
  const culturalTemplates = OMEN_TEMPLATES.filter(t => t.category === 'cultural');
  for (const t of culturalTemplates) {
    if (t.id === primaryId) continue;
    const score = evaluateCulturalTemplate(t, cultural);
    if (score > 0) candidates.push({ template: t, score });
  }

  if (candidates.length === 0) {
    return { template: null, candidates: [], reason: 'no_secondary_candidates' };
  }

  // Sort by score descending, pick from top tier
  candidates.sort((a, b) => b.score - a.score);
  const topScore = candidates[0].score;
  const topTier = candidates.filter(c => c.score >= topScore * 0.8);

  if (topScore < OMEN_SECONDARY_THRESHOLD) {
    return {
      template: null,
      candidates: candidates.map(c => ({ templateId: c.template.id, score: c.score })),
      reason: `below_threshold_${topScore.toFixed(2)}`,
    };
  }

  const pick = pickRandom(topTier, rng);
  return {
    template: pick?.template ?? null,
    candidates: candidates.map(c => ({ templateId: c.template.id, score: c.score })),
    reason: `selected_score_${topScore.toFixed(2)}`,
  };
}

// ─── Beat emission ───────────────────────────────────────────────

function emitBeats(
  omen: ActiveOmen,
  tick: number,
  state: GameState,
  rng: () => number,
  events: TickEvent[],
  recentEvents: TickEvent[],
): { updatedOmen: ActiveOmen; events: TickEvent[]; recentEvents: TickEvent[] } {
  const template = getOmenTemplateById(omen.templateId);
  if (!template || template.beats.length === 0) {
    return { updatedOmen: omen, events, recentEvents };
  }

  let updatedLastBeatTick = omen.lastBeatTick;
  let updatedEvents = events;
  let updatedRecentEvents = recentEvents;

  for (const beat of template.beats) {
    const interval = beat.interval ?? OMEN_BEAT_INTERVAL_DEFAULT;
    if (tick - omen.lastBeatTick < interval) continue;

    // Pick a prose variant
    const prose = pickRandom(beat.prose, rng);
    if (!prose) continue;

    // Simple location substitution
    const locations = state.graph.getNodesByType('location');
    const locationName = pickRandom(locations, rng)?.name ?? 'the settlement';
    const resolvedProse = prose.replace(/{location}/g, locationName);

    const event: TickEvent = {
      id: nextEventId(tick),
      tick,
      type: 'omen_beat',
      message: resolvedProse,
      significance: beat.significance ?? OMEN_BEAT_SIGNIFICANCE,
      sphere: omen.sphere,
    };

    updatedEvents = [...updatedEvents, event];
    updatedRecentEvents = appendRecentEvent(updatedRecentEvents, event);
    updatedLastBeatTick = tick;

    emitTrace({
      id: Date.now() + Math.floor(rng() * 1000),
      tick,
      timestamp: Date.now(),
      category: 'omen_beat',
      summary: `omen_beat [${omen.slot}] ${omen.name}: ${resolvedProse.slice(0, 60)}`,
      omenId: omen.templateId,
      slot: omen.slot,
      prose: resolvedProse,
    } as import('../types/trace').OmenBeatTrace);
  }

  return {
    updatedOmen: { ...omen, lastBeatTick: updatedLastBeatTick },
    events: updatedEvents,
    recentEvents: updatedRecentEvents,
  };
}

// ─── Main phase ──────────────────────────────────────────────────

/**
 * Phase 1.7: Omen Agenda
 *
 * 1. Expiry check — expire omens that have exceeded their duration
 * 2. Force-expire primary on doom stage transition (if OMEN_DOOM_STAGE_FORCE_EXPIRE)
 * 3. Selection — fill empty slots with new omen tracks
 * 4. Beat emission — fire atmospheric micro-events on interval
 */
export function phaseOmenAgenda(state: GameState): Partial<GameState> {
  if (state.tick < OMEN_FIRST_ACTIVATION_TICK) return {};

  const rng = mulberry32(state.seed + state.tick * 59);
  const tick = state.tick;

  let current = state.omenState ?? { primary: null, secondary: null, history: [] };
  let tickEvents = [...state.tickEvents];
  let recentEvents = [...state.recentEvents];
  let pendingSpherePressures = [...(state.pendingSpherePressures ?? [])];

  // ── 1. Expiry check ──────────────────────────────────────────

  function expireOmen(
    omen: ActiveOmen,
    reason: 'duration' | 'forced',
  ): CompletedOmen {
    const completed: CompletedOmen = {
      templateId: omen.templateId,
      startTick: omen.startTick,
      endTick: tick,
    };

    const expireEvent: TickEvent = {
      id: nextEventId(tick),
      tick,
      type: 'omen_expired',
      message: reason === 'forced'
        ? `The ${omen.name} gives way as the world shifts.`
        : `The ${omen.name} fades. The world breathes differently now.`,
      significance: getOmenTemplateById(omen.templateId)?.chronicleSignificance ?? 0.6,
      sphere: omen.sphere,
    };
    tickEvents = [...tickEvents, expireEvent];
    recentEvents = appendRecentEvent(recentEvents, expireEvent);
    return completed;
  }

  const newHistory = [...current.history];

  // Check doom stage transition (compare current doom stage to what was active before)
  const currentDoomStage = state.doomClock.currentStage ?? 0;
  const primaryExpiredByDoom = (
    OMEN_DOOM_STAGE_FORCE_EXPIRE &&
    current.primary !== null &&
    state.tickEvents.some(e => e.type === 'doom_escalation')
  );

  let primary = current.primary;
  let secondary = current.secondary;

  // Expire primary if doom transition or duration exceeded
  if (primary !== null) {
    const elapsed = tick - primary.startTick;
    if (primaryExpiredByDoom) {
      const completed = expireOmen(primary, 'forced');
      newHistory.push(completed);
      primary = null;
    } else if (elapsed >= primary.duration) {
      const completed = expireOmen(primary, 'duration');
      newHistory.push(completed);
      primary = null;
    }
  }

  // Expire secondary if duration exceeded
  if (secondary !== null) {
    const elapsed = tick - secondary.startTick;
    if (elapsed >= secondary.duration) {
      const completed = expireOmen(secondary, 'duration');
      newHistory.push(completed);
      secondary = null;
    }
  }

  // ── 2. Selection for empty slots ─────────────────────────────

  if (primary === null) {
    const result = selectPrimaryOmen(state, null, rng);

    emitTrace({
      id: Date.now() + Math.floor(rng() * 1000),
      tick,
      timestamp: Date.now(),
      category: 'omen_selection',
      summary: `omen_selection [primary] → ${result.template?.id ?? 'none'} (${result.reason})`,
      slot: 'primary',
      candidates: result.candidates,
      selected: result.template?.id ?? null,
      reason: result.reason,
    } as import('../types/trace').OmenSelectionTrace);

    if (result.template) {
      const template = result.template;
      const duration = chooseDuration(template.durationRange, rng);
      primary = {
        templateId: template.id,
        name: template.name,
        category: template.category,
        sphere: template.sphereTrigger?.sphere,
        startTick: tick,
        duration,
        slot: 'primary',
        lastBeatTick: tick - 1,  // Allow first beat this tick
      };

      const startEvent: TickEvent = {
        id: nextEventId(tick),
        tick,
        type: 'omen_started',
        message: `A new omen settles over the world — ${template.name}.`,
        significance: OMEN_START_SIGNIFICANCE,
        sphere: primary.sphere,
      };
      tickEvents = [...tickEvents, startEvent];
      recentEvents = appendRecentEvent(recentEvents, startEvent);
    }
  }

  if (secondary === null) {
    const result = selectSecondaryOmen(state, primary?.templateId ?? null, rng);

    emitTrace({
      id: Date.now() + Math.floor(rng() * 1000),
      tick,
      timestamp: Date.now(),
      category: 'omen_selection',
      summary: `omen_selection [secondary] → ${result.template?.id ?? 'none'} (${result.reason})`,
      slot: 'secondary',
      candidates: result.candidates,
      selected: result.template?.id ?? null,
      reason: result.reason,
    } as import('../types/trace').OmenSelectionTrace);

    if (result.template) {
      const template = result.template;
      const duration = chooseDuration(template.durationRange, rng);
      secondary = {
        templateId: template.id,
        name: template.name,
        category: template.category,
        sphere: template.sphereTrigger?.sphere,
        startTick: tick,
        duration,
        slot: 'secondary',
        lastBeatTick: tick - 1,
      };

      const startEvent: TickEvent = {
        id: nextEventId(tick),
        tick,
        type: 'omen_started',
        message: `${template.name} rises as a secondary omen.`,
        significance: OMEN_START_SIGNIFICANCE * 0.8,
        sphere: secondary.sphere,
      };
      tickEvents = [...tickEvents, startEvent];
      recentEvents = appendRecentEvent(recentEvents, startEvent);
    }
  }

  // ── 3. Beat emission ─────────────────────────────────────────

  if (primary !== null) {
    const beatResult = emitBeats(primary, tick, state, rng, tickEvents, recentEvents);
    primary = beatResult.updatedOmen;
    tickEvents = beatResult.events;
    recentEvents = beatResult.recentEvents;
  }

  if (secondary !== null) {
    const beatResult = emitBeats(secondary, tick, state, rng, tickEvents, recentEvents);
    secondary = beatResult.updatedOmen;
    tickEvents = beatResult.events;
    recentEvents = beatResult.recentEvents;
  }

  // ── 4. Sphere pressure from sphere-surge omens ───────────────
  // Push small per-tick pressure to a sample of settlements for the feedback loop.

  const settlements = state.graph.getNodesByType('location').filter(n => {
    const subtype = n.properties?.locationSubtype as string | undefined;
    return ['hamlet', 'town', 'city', 'capital'].includes(subtype ?? '');
  }).slice(0, 5);  // Cap at 5 targets to keep overhead bounded

  for (const omen of [primary, secondary]) {
    if (omen === null || settlements.length === 0) continue;
    const template = getOmenTemplateById(omen.templateId);
    if (!template?.spherePressure) continue;
    const rawMagnitude = Math.min(template.spherePressure.magnitude, OMEN_SPHERE_PRESSURE_CAP);
    // Distribute across sample settlements (per-entity magnitude is smaller)
    const perEntityMagnitude = rawMagnitude / settlements.length;
    for (const settlement of settlements) {
      pendingSpherePressures = [
        ...pendingSpherePressures,
        {
          targetEntityId: settlement.id,
          sphere: template.spherePressure.sphere,
          magnitude: perEntityMagnitude,
          source: 'environmental' as const,
          sourceId: omen.templateId,
        },
      ];
    }
  }

  // ── 5. Build updated OmenState ────────────────────────────────

  const omenState: OmenState = {
    primary,
    secondary,
    history: trimHistory(newHistory),
  };

  return {
    omenState,
    tickEvents,
    recentEvents,
    pendingSpherePressures,
  };
}

// ─── Encounter bias derivation (used by encounter seeding) ──────

/**
 * Derive the merged encounter type bias from currently active omens.
 * Called by encounter seeding (Phase 2a.8) to adjust encounter scoring.
 * Returns a partial record of encounter type → bias modifier (capped at ±OMEN_ENCOUNTER_BIAS_CAP).
 */
export function deriveOmenEncounterBias(
  omenState: OmenState | undefined,
): Partial<Record<string, number>> {
  if (!omenState) return {};

  const bias: Record<string, number> = {};

  function mergeBias(template: OmenTrackTemplate | undefined): void {
    if (!template) return;
    for (const [type, value] of Object.entries(template.encounterBias)) {
      const existing = bias[type] ?? 0;
      bias[type] = Math.max(-OMEN_ENCOUNTER_BIAS_CAP, Math.min(OMEN_ENCOUNTER_BIAS_CAP, existing + value));
    }
  }

  const primaryTemplate = omenState.primary ? getOmenTemplateById(omenState.primary.templateId) : undefined;
  const secondaryTemplate = omenState.secondary ? getOmenTemplateById(omenState.secondary.templateId) : undefined;

  mergeBias(primaryTemplate);
  mergeBias(secondaryTemplate);

  return bias;
}

// ─── Emitted omen decay phase (THR-115) ──────────────────────────

/**
 * Remove expired EmittedOmen entries from GameState.
 * Runs adjacent to phaseOmenAgenda (Phase 1.7). O(n) with n ≤ EMITTED_OMEN_MAX_ACTIVE.
 */
export function phaseEmittedOmenDecay(state: GameState): Partial<GameState> {
  const omens = state.emittedOmens;
  if (!omens || omens.length === 0) return {};

  const tick = state.tick;
  const remaining: EmittedOmen[] = [];

  for (const omen of omens) {
    if (tick > omen.expiresTick) {
      emitTrace({
        tick,
        category: 'omen_decayed',
        omenId: omen.omenId,
        livedTicks: tick - omen.emittedTick,
        summary: `omen_decayed: ${omen.omenId} expired (lived ${tick - omen.emittedTick} ticks)`,
      });
    } else {
      remaining.push(omen);
    }
  }

  if (remaining.length === omens.length) return {};
  return { emittedOmens: remaining };
}

// ─── Emitted omen encounter type affinity (THR-115) ─────────────

/**
 * Category-to-encounter-type affinity for emitted omens.
 * Emitted omens don't have encounter templates so we use this static mapping.
 */
const EMITTED_OMEN_ENCOUNTER_AFFINITY: Partial<Record<OmenCategory, string[]>> = {
  doom_echo: ['duel', 'steal'],
  sphere_surge: ['explore', 'create'],
  cultural: ['assist', 'trade', 'lead'],
  seasonal: ['acquire', 'build'],
};

/**
 * Derive encounter type bias from active EmittedOmens for a specific hex.
 * Additive with existing omenBias; combined total remains capped at ±OMEN_ENCOUNTER_BIAS_CAP.
 */
export function deriveEmittedOmenEncounterBias(
  emittedOmens: readonly EmittedOmen[] | undefined,
  agentHexCol: number,
  agentHexRow: number,
): Partial<Record<string, number>> {
  if (!emittedOmens || emittedOmens.length === 0) return {};

  const bias: Record<string, number> = {};

  for (const omen of emittedOmens) {
    if (!isOmenInScope(omen, agentHexCol, agentHexRow)) continue;

    const affinity = EMITTED_OMEN_ENCOUNTER_AFFINITY[omen.category];
    if (!affinity) continue;

    const boost = omen.intensity * EMITTED_OMEN_SCORE_WEIGHT;
    for (const encounterType of affinity) {
      bias[encounterType] = (bias[encounterType] ?? 0) + boost;
    }
  }

  return bias;
}

function isOmenInScope(omen: EmittedOmen, hexCol: number, hexRow: number): boolean {
  const scope = omen.scope;
  if (scope.kind === 'global') return true;
  if (scope.kind === 'regional') return true; // region matching deferred; treat as in-scope
  if (scope.kind === 'local') {
    const radius = scope.radius ?? 2;
    const dist = hexDistance({ col: hexCol, row: hexRow }, { col: scope.hexCol, row: scope.hexRow });
    return dist <= radius;
  }
  return true;
}
