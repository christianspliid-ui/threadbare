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
import type { OmenState, ActiveOmen, OmenTrackTemplate, CompletedOmen, EmittedOmen, EmittedOmenProvenance, OmenCategory } from '../types/omen';
import type { GraphNode } from '../types/graph';
import type { UndertakingHarmClass } from '../types/strategicAction';
import type { UndertakingPortentTrace } from '../types/trace';
import {
  EMITTED_OMEN_SCORE_WEIGHT,
  EMITTED_OMEN_MAX_ACTIVE,
  EMITTED_OMEN_LOCAL_DEFAULT_RADIUS,
  OMEN_UNDERTAKING_LOOKBACK_TICKS,
  OMEN_UNDERTAKING_WEIGHT_BY_HARM,
  OMEN_UNDERTAKING_FOLLOWED_WEIGHT,
  OMEN_UNDERTAKING_MAX_PER_TICK,
  OMEN_UNDERTAKING_DURATION_TICKS,
  OMEN_UNDERTAKING_CATEGORY_BY_HARM,
} from '../data/game-config';
import { HARM_MAGNITUDE_BY_CLASS, HARM_CLASS_LABELS } from '../data/ambition-minting-rules';
import { hexDistance } from '../lib/hexMath';
import {
  OMEN_TEMPLATES,
  UNDERTAKING_PORTENT_HOOKS,
  getDoomEchoTemplates,
  getEligibleSphereSurgeTemplates,
  getSeasonalTemplates,
  getOmenTemplateById,
} from '../data/omenTemplates';
import { emitTrace } from './traceBuffer';
import { appendRecentEvent } from './encounterAftermath';
import { isUndertakingOutcomeEventId } from './grievance/undertakingOutcomeNode';
import { isFollowed } from './followedAgents';
import { resolveToParentLocation } from './sublocationShape';
import type { WorldGraph } from './graph';

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
/** Weight applied when blending worldSoul.spherePressures into apparent sphere dominance (THR-120) */
export const SPHERE_PRESSURE_OMEN_BIAS_WEIGHT = 1.0;
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
  const base: Partial<Record<string, number>> = state.worldSoul.fundament.sphereWeights ?? {};
  const pressures = state.worldSoul.spherePressures;
  if (!pressures || Object.keys(pressures).length === 0) return base;

  const result: Partial<Record<string, number>> = { ...base };
  for (const [sphere, pressure] of Object.entries(pressures)) {
    result[sphere] = (result[sphere] ?? 0) + pressure * SPHERE_PRESSURE_OMEN_BIAS_WEIGHT;
  }
  return result;
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

// ─── A mortal's work casts omens (THR-1432) ──────────────────────

/** One outcome node the portent step weighed, with the terms that ranked it. */
export interface PortentCandidate {
  readonly node: GraphNode;
  readonly harmClass: UndertakingHarmClass;
  readonly harmMagnitude: number;
  readonly followed: boolean;
  readonly score: number;
}

export interface PortentResult {
  /** The omen cast this tick, or null — with why. */
  readonly omen: EmittedOmen | null;
  readonly candidates: readonly PortentCandidate[];
  readonly reason: string;
}

/** The property stamped on an outcome node once it has portended, so it never portends twice. */
export const PORTENDED_TICK_PROPERTY = 'portendedTick';

function nameOf(graph: WorldGraph, id: unknown): string | undefined {
  if (typeof id !== 'string') return undefined;
  const name = graph.getNode(id)?.name;
  return typeof name === 'string' && name.trim().length > 0 ? name : undefined;
}

/**
 * The place a portent hangs over: the thing the work was done *to* when that is a
 * place (a razed town portends over the town, not over the hex the razer set out
 * from), else the `occurred_at` site — either resolved to the settlement a room sits in.
 */
function portentSite(graph: WorldGraph, node: GraphNode): GraphNode | undefined {
  const targetId = node.properties?.targetNodeId;
  const target = typeof targetId === 'string' ? graph.getNode(targetId) : undefined;
  const siteId = graph.getOutgoingEdges(node.id, 'occurred_at')[0]?.target;
  const site = (target?.type === 'location' ? target : undefined) ?? (siteId ? graph.getNode(siteId) : undefined);
  if (!site) return undefined;
  return (site.type === 'location' ? resolveToParentLocation(graph, site) : undefined) ?? site;
}

/**
 * The deed in words — the same shape the grievance lane's mint label takes
 * ("the razing of Dunmar — Hesk's work"), built from the node rather than the mint so
 * a harm nobody minted a drive from still reads whole.
 */
function portentDeed(graph: WorldGraph, node: GraphNode, harmClass: UndertakingHarmClass, site: GraphNode | undefined): string {
  const stem = HARM_CLASS_LABELS[harmClass];
  const targetName = nameOf(graph, node.properties?.targetNodeId) ?? site?.name;
  // "the razing of Dunmar", but "the work abandoned at Horsepolis" — a self-facing
  // harm has no object to be *of*.
  const joiner = harmClass === 'undertaking_abandoned' ? 'at' : 'of';
  const placed = targetName ? `${stem} ${joiner} ${targetName}` : stem;
  const culpritName = nameOf(graph, node.properties?.culpritAgentId);
  return culpritName ? `${placed} — ${culpritName}'s work` : placed;
}

/**
 * Weigh every recent `undertaking_outcome` node and return the one that portends.
 *
 * Score = the node's own `harmMagnitude` × `OMEN_UNDERTAKING_WEIGHT_BY_HARM` × the
 * attention term (`OMEN_UNDERTAKING_FOLLOWED_WEIGHT` when the god follows the culprit
 * or the victim). Ties are broken by one seeded draw, and only then — a clear winner
 * costs the phase's PRNG nothing (NFP #3). Fail-soft: a node with no harm class, no
 * magnitude, or outside the lookback is skipped; a throw on one node skips that node.
 *
 * Pure with respect to state: the caller stamps the winner and appends the omen.
 */
export function castUndertakingPortent(state: GameState, rng: () => number): PortentResult {
  const graph = state.graph;
  const tick = state.tick;
  const cutoff = tick - OMEN_UNDERTAKING_LOOKBACK_TICKS;
  const candidates: PortentCandidate[] = [];

  for (const node of graph.getNodesByType('event')) {
    try {
      if (!isUndertakingOutcomeEventId(node.id)) continue;
      const p = node.properties ?? {};
      if (p.eventType !== 'undertaking_outcome') continue;
      const nodeTick = typeof p.tick === 'number' ? p.tick : Number.NEGATIVE_INFINITY;
      if (nodeTick < cutoff || nodeTick > tick) continue;
      if (typeof p[PORTENDED_TICK_PROPERTY] === 'number') continue;
      const harmClass = p.harmClass as UndertakingHarmClass;
      const weight = OMEN_UNDERTAKING_WEIGHT_BY_HARM[harmClass];
      if (weight === undefined) continue;
      const harmMagnitude = typeof p.harmMagnitude === 'number' ? p.harmMagnitude : (HARM_MAGNITUDE_BY_CLASS[harmClass] ?? 0);
      if (harmMagnitude <= 0) continue;
      const parties = [p.culpritAgentId, p.victimAgentId].filter((id): id is string => typeof id === 'string');
      const followed = parties.some(id => isFollowed(state, graph, id));
      const score = harmMagnitude * weight * (followed ? OMEN_UNDERTAKING_FOLLOWED_WEIGHT : 1);
      candidates.push({ node, harmClass, harmMagnitude, followed, score });
    } catch (err) {
      console.warn(`[OmenAgenda] portent candidate ${node.id} skipped:`, err);
    }
  }

  if (candidates.length === 0) return { omen: null, candidates, reason: 'no_recent_outcome' };
  if (OMEN_UNDERTAKING_MAX_PER_TICK <= 0) return { omen: null, candidates, reason: 'disabled' };

  // Score descending, id ascending — the same state always ranks the same way.
  candidates.sort((a, b) => b.score - a.score || (a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0));
  const top = candidates[0].score;
  const ties = candidates.filter(c => c.score === top);
  const pick = ties.length === 1 ? ties[0] : (pickRandom(ties, rng) ?? ties[0]);

  const node = pick.node;
  const p = node.properties ?? {};
  const site = portentSite(graph, node);
  const deed = portentDeed(graph, node, pick.harmClass, site);
  const placeName = site?.name ?? 'the place';
  const hook = UNDERTAKING_PORTENT_HOOKS[pick.harmClass]
    .replace(/\{deed\}/g, deed)
    .replace(/\{place\}/g, placeName);
  const hexCol = site?.properties?.hexCol;
  const hexRow = site?.properties?.hexRow;
  const scope: EmittedOmen['scope'] = typeof hexCol === 'number' && typeof hexRow === 'number'
    ? { kind: 'local', hexCol, hexRow, radius: EMITTED_OMEN_LOCAL_DEFAULT_RADIUS }
    : { kind: 'global' };

  const provenance: EmittedOmenProvenance = {
    kind: 'undertaking',
    outcomeNodeId: node.id,
    templateId: typeof p.templateId === 'string' ? p.templateId : '',
    verb: typeof p.verb === 'string' ? p.verb : '',
    harmClass: pick.harmClass,
    deed,
    ...(typeof p.culpritAgentId === 'string' && { culpritAgentId: p.culpritAgentId }),
    ...(typeof p.victimAgentId === 'string' && { victimAgentId: p.victimAgentId }),
    ...(site && { siteId: site.id }),
    followed: pick.followed,
  };

  const omen: EmittedOmen = {
    omenId: `omen_und_${node.id}`,
    sourceEncounterId: node.id,
    sourceReactionId: 'undertaking_outcome',
    category: OMEN_UNDERTAKING_CATEGORY_BY_HARM[pick.harmClass],
    // The world feels the harm at its own weight; attention decides which harm, not how loud.
    intensity: Math.max(0, Math.min(1, pick.harmMagnitude * OMEN_UNDERTAKING_WEIGHT_BY_HARM[pick.harmClass])),
    scope,
    narrativeHook: hook,
    emittedTick: tick,
    expiresTick: tick + OMEN_UNDERTAKING_DURATION_TICKS,
    provenance,
  };

  return { omen, candidates, reason: ties.length === 1 ? 'top_score' : `tie_draw_${ties.length}` };
}

// ─── Main phase ──────────────────────────────────────────────────

/**
 * Phase 1.7: Omen Agenda
 *
 * 1. Expiry check — expire omens that have exceeded their duration
 * 2. Force-expire primary on doom stage transition (if OMEN_DOOM_STAGE_FORCE_EXPIRE)
 * 3. Selection — fill empty slots with new omen tracks
 * 4. Beat emission — fire atmospheric micro-events on interval
 * 5. Sphere pressure from sphere-surge omens
 * 6. A mortal's work casts a portent (THR-1432) — the loudest recent undertaking
 *    outcome becomes an emitted omen
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

  // ── 5. A mortal's work casts a portent (THR-1432) ─────────────
  // Last on purpose: every draw above is unchanged whether or not a portent is cast,
  // so a razing cannot re-roll the seasonal omen (NFP #3).

  let emittedOmens: EmittedOmen[] | undefined;
  try {
    const portent = castUndertakingPortent(state, rng);
    if (portent.omen) {
      const omen = portent.omen;
      const outcomeNode = state.graph.getNode(omen.provenance!.outcomeNodeId);
      if (outcomeNode) outcomeNode.properties[PORTENDED_TICK_PROPERTY] = tick;

      let updated = [...(state.emittedOmens ?? []), omen];
      if (updated.length > EMITTED_OMEN_MAX_ACTIVE) {
        // Evict the oldest — the same rule the aftermath's emit_omen applies.
        const evicted = updated.reduce((oldest, o) => (o.emittedTick < oldest.emittedTick ? o : oldest), updated[0]);
        emitTrace({
          tick, category: 'omen_decayed',
          omenId: evicted.omenId, livedTicks: tick - evicted.emittedTick,
          failReason: 'cap_evicted',
          summary: `omen_decayed: ${evicted.omenId} evicted (cap_evicted)`,
        });
        updated = updated.filter(o => o !== evicted);
      }
      emittedOmens = updated;

      const significance = Math.max(0.5, Math.min(0.85, 0.5 + omen.intensity * 0.3));
      const portentEvent: TickEvent = {
        id: nextEventId(tick),
        tick,
        type: 'narrative',
        message: omen.narrativeHook,
        significance,
        ...(omen.provenance?.culpritAgentId && { actorId: omen.provenance.culpritAgentId }),
      };
      tickEvents = [...tickEvents, portentEvent];
      recentEvents = appendRecentEvent(recentEvents, portentEvent);

      const winner = portent.candidates.find(c => c.node.id === omen.provenance!.outcomeNodeId);
      emitTrace({
        tick,
        category: 'omen_emitted',
        ...(omen.provenance?.culpritAgentId && { agentId: omen.provenance.culpritAgentId }),
        omenId: omen.omenId,
        omenCategory: omen.category,
        intensity: omen.intensity,
        expiresTick: omen.expiresTick,
        sourceEncounterId: omen.sourceEncounterId,
        sourceReactionId: 'undertaking_outcome',
        outcomeNodeId: omen.provenance!.outcomeNodeId,
        harmClass: omen.provenance!.harmClass,
        score: winner?.score ?? 0,
        followed: omen.provenance!.followed,
        candidates: portent.candidates.map(c => ({ outcomeNodeId: c.node.id, harmClass: c.harmClass, score: c.score, followed: c.followed })),
        summary: `omen_emitted[portent]: ${omen.provenance!.harmClass} — ${omen.provenance!.deed} (${portent.reason}, ${portent.candidates.length} weighed)`,
      } satisfies Omit<UndertakingPortentTrace, 'id' | 'timestamp'>);
    }
  } catch (err) {
    // Fail-soft: a portent is a reading of the world, never a precondition of the tick.
    console.warn('[OmenAgenda] portent step failed:', err);
  }

  // ── 6. Build updated OmenState ────────────────────────────────

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
    ...(emittedOmens !== undefined && { emittedOmens }),
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
