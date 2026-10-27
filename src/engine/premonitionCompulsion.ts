/**
 * Compulsion generation — creates Compulsion premonition events from the agent
 * decision pipeline's scored candidates.
 *
 * Called from phaseAgentDecision between scoring and commitment for agents
 * with court position 'the_first' or 'retinue'.
 *
 * @see Docs/plans/2026-04-04-divine-premonition-design.md
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { ChapterRecord } from '../types/chapterRecord';
import type { PremonitionEvent, CompulsionCandidate } from '../types/premonition';
import type { ScoredCandidate } from './encounterScoring';
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import {
  COMPULSION_CANDIDATE_COUNT,
  COMPULSION_MIN_STORY_OPTIONS,
  COMPULSION_COOLDOWN_TICKS,
  COMPULSION_ESSENCE_COST_MIN,
  COMPULSION_ESSENCE_COST_MAX,
  PREMONITION_DISPLAY_DELAY_TICKS,
  PREMONITION_EXPIRY_TICKS,
  REACH_TO_SPHERE,
} from '../data/premonition-constants';
import {
  COMPULSION_VIGNETTE_TEMPLATES,
  getQuintessenceProseTier,
  composeRetconLine,
  resolveAgentPronouns,
  COMPULSION_UNNAMED_ENCOUNTER_NOUN,
} from '../data/premonition-content';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import { isRoutineTemplate } from './attentionCadence';
import { compulsionDoneMessage } from './premonitionSteer';
import { getFirstPathFor } from './firstPath';
import { emitTrace } from './traceBuffer';

// ─── Helper: seeded pick from array ─────────────────────────────

function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Map textual threat rating to 0..1 for cost scaling. */
function threatToNorm(rating: string): number {
  switch (rating) {
    case 'trivial': return 0;
    case 'easy':    return 0.25;
    case 'moderate': return 0.5;
    case 'hard':    return 0.75;
    case 'deadly':  return 1;
    default:        return 0.25;
  }
}

/** A dotted template id such as `encounter.town.oath_breaker_rite` — never player-facing. */
export const TEMPLATE_ID_SHAPE = /^[a-z0-9_]+\.[a-z0-9_.]+$/;

/**
 * THR-1852 — the player-facing name of a compulsion target. Resolves through
 * `getUnifiedTemplateById` (the unified index, then every encounter pool), because
 * `getAnyEncounterById` alone misses the authored encounters registered only in
 * `UNIFIED_ACTION_TEMPLATES` and the id leaked into the God's Will modal and toasts.
 * A miss, or a name that is itself id-shaped, falls back to a generic noun.
 */
export function resolveCompulsionEncounterName(templateId: string): string {
  const name = getUnifiedTemplateById(templateId)?.name?.trim();
  if (!name || name === templateId || TEMPLATE_ID_SHAPE.test(name)) {
    return COMPULSION_UNNAMED_ENCOUNTER_NOUN;
  }
  return name;
}

// ─── Compulsion Eligibility ─────────────────────────────────────

export function isCompulsionEligible(
  graph: WorldGraph,
  ascendantId: string | null,
  agentId: string,
): boolean {
  if (!ascendantId) return false;
  // Only actors qualify for compulsion — not factions, locations, etc.
  const agentNode = graph.getNode(agentId);
  if (!agentNode || agentNode.type !== 'actor') return false;
  const edges = graph.getOutgoingEdges(ascendantId, 'thread');
  const threadEdge = edges.find(e => e.target === agentId);
  if (!threadEdge) return false;

  const courtPosition = (threadEdge.properties?.courtPosition as string) ?? null;
  return courtPosition === 'the_first' || courtPosition === 'retinue';
}

// ─── Re-fire Suppression ────────────────────────────────────────

/**
 * Should a Compulsion be offered to this agent on this tick?
 *
 * Eligibility says *who* may be compelled; this says *when*. Without it the
 * compulsion path minted a brand-new event every single tick — choosing wrote a
 * target the emitter never read, and dismissing wrote nothing at all, so the
 * modal returned forever (THR-1137). The Whisper phase has had both halves of
 * this gate since it shipped; the compulsion path had neither.
 *
 * @param pending     premonitions already queued from earlier ticks
 * @param pendingThisTick premonitions minted so far during this tick's agent loop
 */
/**
 * Property a debug lever stamps to make the next scoring moment emit a compulsion
 * regardless of cooldown. Dev-only (`window.__DEBUG.forcePremonition`, THR-1414);
 * nothing in the simulation writes it. Cleared by the emitter after one use, so a
 * forced compulsion is one-shot and never leaves the agent permanently exempt.
 */
export const FORCE_COMPULSION_FLAG = 'debugForceCompulsion';

export function shouldEmitCompulsion(
  agentNode: GraphNode,
  tick: number,
  pending: readonly PremonitionEvent[],
  pendingThisTick: readonly PremonitionEvent[],
): boolean {
  const agentId = agentNode.id;

  // Debug force (THR-1414): bypass the cooldown, but never the one-live-premonition
  // rule below — two stacked offers for one agent is a UI state the game never has.
  const forced = agentNode.properties?.[FORCE_COMPULSION_FLAG] === true;
  if (forced) {
    if (pending.some(p => p.agentId === agentId && p.eligibleUntilTick > tick)) return false;
    if (pendingThisTick.some(p => p.agentId === agentId)) return false;
    return true;
  }

  // Gate 1: one live premonition per agent at a time. Expired entries do not
  // block — they are dropped from the queue at the end of this same phase.
  if (pending.some(p => p.agentId === agentId && p.eligibleUntilTick > tick)) return false;
  if (pendingThisTick.some(p => p.agentId === agentId)) return false;

  // Gate 2: cooldown since the last offer, whatever became of it.
  const lastTick = agentNode.properties?.lastCompulsionTick as number | undefined;
  if (typeof lastTick === 'number' && tick - lastTick < COMPULSION_COOLDOWN_TICKS) return false;

  return true;
}

// ─── Build Compulsion Event ─────────────────────────────────────

/**
 * THR-2068 — God's Will offers only work that becomes a chapter. Routine templates
 * (`isRoutineTemplate`) never appear; options fill from `topCandidates`, then from
 * `rankedCandidates` in ranked order, deduplicated by template, up to
 * `COMPULSION_CANDIDATE_COUNT`. Fewer than `COMPULSION_MIN_STORY_OPTIONS` → null (no
 * offer; the caller stamps no cooldown).
 */
export function buildCompulsionEvent(
  state: GameState,
  agentId: string,
  agentName: string,
  topCandidates: ScoredCandidate[],
  rng: () => number,
  rankedCandidates: readonly ScoredCandidate[] = [],
): PremonitionEvent | null {
  if (topCandidates.length === 0) return null;

  const { graph } = state;
  const agentNode = graph.getNode(agentId);
  if (!agentNode) return null;

  const quintessence = (agentNode.properties?.quintessence as number | undefined) ?? 1.0;
  if (quintessence <= 0) return null;

  // Story scenes only, top list first then the ranked list; dedup by templateId
  // (keep the first — highest-scored — instance).
  const seen = new Set<string>();
  const candidates: ScoredCandidate[] = [];
  for (const c of [...topCandidates, ...rankedCandidates]) {
    if (candidates.length >= COMPULSION_CANDIDATE_COUNT) break;
    if (seen.has(c.entry.templateId) || isRoutineTemplate(c.entry.templateId)) continue;
    seen.add(c.entry.templateId);
    candidates.push(c);
  }
  if (candidates.length < COMPULSION_MIN_STORY_OPTIONS) return null;

  // Resolve agent hex once for distance computation
  const agentLocationId = graph.getOutgoingEdges(agentId, 'located_at')[0]?.target ?? null;
  const agentHex = agentLocationId ? resolveLocationToHex(graph, agentLocationId) : null;

  // THR-1802 — one shared threat tier across every offer makes the confidence
  // clause identical on each option ("hardly a challenge" ×3), so drop it.
  const sharedThreatTier = candidates.length > 1
    && candidates.every(c => c.entry.threatRating === candidates[0].entry.threatRating);

  // Build CompulsionCandidate entries
  const compulsionCandidates: CompulsionCandidate[] = candidates.map(c => {
    const encounterName = resolveCompulsionEncounterName(c.entry.templateId);
    const reach = c.entry.reachPrimary;
    const sphere = c.entry.sphereAffinity ?? REACH_TO_SPHERE[reach] ?? 'force';
    const locationNode = graph.getNode(c.entry.locationId);
    const locationName = locationNode?.name ?? 'unknown';

    // Hex distance: same algorithm as encounterScoring.ts
    const entryHex = resolveLocationToHex(graph, c.entry.locationId);
    const dist = (agentHex && entryHex) ? hexDistance(agentHex, entryHex) : 0;

    // Essence cost scales with threat
    const threatNorm = threatToNorm(c.entry.threatRating);
    const essenceCost = Math.round(
      COMPULSION_ESSENCE_COST_MIN + threatNorm * (COMPULSION_ESSENCE_COST_MAX - COMPULSION_ESSENCE_COST_MIN),
    );

    // Retcon prose: composable data-driven hook
    const hook = composeRetconLine(rng, {
      encounterType: c.entry.encounterType,
      reach,
      threatRating: c.entry.threatRating,
      hexDistance: dist,
      requiresPresence: c.entry.requiresPresence,
      locationName,
      agentName,
      omitConfidence: sharedThreatTier,
    });

    return {
      templateId: c.entry.templateId,
      encounterName,
      encounterHook: hook,
      encounterType: c.entry.encounterType,
      reach,
      sphere,
      threatRating: c.entry.threatRating,
      hexDistance: dist,
      score: c.finalScore,
      essenceCost,
      locationId: c.entry.locationId,
      locationName,
      ...((c.firstPathPull ?? 1) > 1 ? { fitsPath: true as const } : {}),
    };
  });

  // Generate vignette
  const proseTier = getQuintessenceProseTier(quintessence);
  const vignetteTemplate = seededPick(COMPULSION_VIGNETTE_TEMPLATES[proseTier], rng);
  const vignetteProse = resolveAgentPronouns(vignetteTemplate, agentName);

  // THR-2068 — the path title backs the option's "Fits the …" line.
  const firstPathTitle = compulsionCandidates.some(c => c.fitsPath)
    ? getFirstPathFor(graph, state.ascendantId, agentId)?.title
    : undefined;

  const showAfterTick = state.tick + PREMONITION_DISPLAY_DELAY_TICKS;
  return {
    id: `compulsion_${agentId}_${state.tick}`,
    type: 'compulsion',
    agentId,
    agentName,
    tick: state.tick,
    showAfterTick,
    eligibleUntilTick: showAfterTick + PREMONITION_EXPIRY_TICKS,
    vignetteProse,
    compulsionCandidates,
    ...(firstPathTitle ? { firstPathTitle } : {}),
  };
}

// ─── Compulsion done line (THR-2068) ────────────────────────────

/**
 * One toast per newly archived compelled chapter: "Your will is done. The Haggle:
 * Morthane held." — in the chapter's own band word — plus a `compulsion_outcome`
 * `done` trace carrying the band. A paid steer is never silent, routine work included.
 * Never throws per record: a broken record is skipped.
 */
export function buildCompulsionDoneEvents(records: readonly ChapterRecord[], tick: number): TickEvent[] {
  const events: TickEvent[] = [];
  for (const rec of records) {
    if (!rec.compelled) continue;
    try {
      const message = compulsionDoneMessage(rec.actorName, resolveCompulsionEncounterName(rec.templateId), rec.outcome);
      emitTrace({
        category: 'divine_premonition',
        subtype: 'compulsion_outcome',
        tick,
        agentId: rec.actorId,
        agentName: rec.actorName,
        templateId: rec.templateId,
        outcome: 'done',
        heldTicks: rec.resolvedTick - rec.startTick,
        ...(rec.outcome ? { band: rec.outcome } : {}),
        summary: message,
      });
      events.push({
        id: `divine_steer_done_${rec.actionId}`,
        tick,
        type: 'divine_premonition',
        message,
        significance: 0.6,
        isInterventionBeat: true,
        actorId: rec.actorId,
        notification: { channel: 'toast' },
      });
    } catch {
      // Fail-soft: one broken record never drops the others' lines.
    }
  }
  return events;
}
