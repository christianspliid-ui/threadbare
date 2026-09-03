/**
 * The calling — a mortal's derived, readable identity (THR-1299 slice 5,
 * THR-1281 §7b).
 *
 * `BehaviorFamily` retired as mechanics; the calling replaces it as *presentation*.
 * It is computed, never stored as a stat: a deterministic argmax over the naming
 * table (`src/data/calling-content.ts`) from three inputs —
 *
 * - the **leading reach pair** (the two highest `domainCapabilities`),
 * - the **active ambition** (its category, and the undertaking kinds its own
 *   templates build — the volatile input, weighted heaviest because deeds move it),
 * - the **personality lean** (the sign of the value pair a title is cut for).
 *
 * ## Hysteresis — the grill-me risk row
 *
 * Wrong values flicker or fossilize. Recompute is **event-driven** at three sites
 * (ambition assignment / completion / abandonment, undertaking completion, reach
 * tier promotion), never per tick (NFP #7), and a challenger replaces the
 * incumbent only when both hold: the incumbent has been held at least
 * `CALLING_MIN_HOLD_TICKS`, and the challenger's score beats the incumbent's
 * *current* score by `CALLING_SCORE_MARGIN`. A change emits a `calling_changed`
 * TickEvent at `CALLING_CHANGE_SIGNIFICANCE` for spotlight mortals (a calling
 * change is a chronicle moment, per the ruling) and a `CallingChangeTrace`.
 *
 * Stored on the agent node as `properties.calling` / `callingTitleKey` /
 * `callingSinceTick` / `callingScore` — a derived label with no traversal
 * consumer is node-internal data, not a relationship.
 *
 * No PRNG. Ties break by table order.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { TickEvent } from '../types/gameState';
import type { ReachDomain } from '../types/traits';
import type { AxiologicalProfile } from '../types/agent';
import type { AmbitionCategory } from '../types/ambition';
import type { BehaviorFamily, UndertakingKindId } from '../types/strategicAction';
import type { CallingChangeTrace } from '../types/trace';
import { REACH_DOMAINS } from '../types/traits';
import {
  CALLING_ROWS,
  BEHAVIOR_FAMILY_TO_CALLING,
  CALLING_PRESENTATION,
  CALLING_FALLBACK_PRESENTATION,
  type CallingRow,
} from '../data/calling-content';
import {
  CALLING_AMBITION_WEIGHT,
  CALLING_REACH_WEIGHT,
  CALLING_PERSONALITY_WEIGHT,
  CALLING_MIN_HOLD_TICKS,
  CALLING_SCORE_MARGIN,
  CALLING_CHANGE_SIGNIFICANCE,
  CALLING_FALLBACK_TITLE,
} from '../data/strategic-action-constants';
import { getAgentAmbitions } from './graphQueries';
import { findAmbitionTemplateById } from '../data/ambition-templates';
import { getStrategicTemplate, profileWorkIds } from './strategicActionCandidates';
import { emitTrace } from './traceBuffer';

export type CallingChangeCause = 'ambition_change' | 'undertaking_complete' | 'tier_promotion' | 'initial';

export interface Calling {
  readonly titleKey: string;
  readonly title: string;
  readonly score: number;
}

export interface CallingPresentation {
  readonly titleKey: string;
  readonly title: string;
  readonly glyph: string;
  readonly color: string;
}

/** The stored calling on a node, or null when none has been derived yet. */
export interface StoredCalling {
  readonly titleKey: string;
  readonly title: string;
  readonly sinceTick: number;
  readonly score: number;
}

// ─── Inputs ──────────────────────────────────────────────────────────

/** The two highest-capability reaches, highest first; fewer when the map is thin. */
export function leadingReachPair(node: GraphNode | undefined): ReachDomain[] {
  const caps = (node?.properties?.domainCapabilities ?? {}) as Partial<Record<ReachDomain, number>>;
  return REACH_DOMAINS
    .filter(r => typeof caps[r] === 'number' && (caps[r] as number) > 0)
    .sort((a, b) => (caps[b] as number) - (caps[a] as number) || REACH_DOMAINS.indexOf(a) - REACH_DOMAINS.indexOf(b))
    .slice(0, 2);
}

export interface AmbitionInput {
  readonly category: AmbitionCategory;
  readonly wantedKinds: readonly UndertakingKindId[];
}

/**
 * The active primary ambition (else the first active one), with the kinds its
 * strategic templates build — what the mortal is actually working toward.
 */
export function activeAmbitionInput(graph: WorldGraph, agentId: string): AmbitionInput | null {
  const entries = getAgentAmbitions(graph, agentId).filter(a => a.status === 'active');
  if (entries.length === 0) return null;
  const primary = entries.find(e => e.edge.properties?.priority === 'primary') ?? entries[0];
  const templateId = primary.ambition.properties?.templateId as string | undefined;
  const template = templateId ? findAmbitionTemplateById(templateId) : undefined;
  if (!template) return null;
  const kinds = new Set<UndertakingKindId>();
  for (const id of template.strategicProfile ? profileWorkIds(template.strategicProfile) : []) {
    const kindId = (getStrategicTemplate(id) as { kindId?: UndertakingKindId } | undefined)?.kindId;
    if (kindId) kinds.add(kindId);
  }
  return { category: template.category, wantedKinds: [...kinds] };
}

// ─── Scoring ─────────────────────────────────────────────────────────

/**
 * Score one row for one mortal, in [0, 1].
 *
 * Reach term: the primary reach counts double, so a row cut for the mortal's
 * own leading reach beats one that only shares their second. Ambition term:
 * category match, plus a bonus when the row names a kind the ambition actually
 * builds. Personality term: a leaned row scores 1 when the mortal leans that
 * way, 0 when they lean against; a plain row takes the neutral half.
 */
export function scoreCallingRow(
  row: CallingRow,
  reaches: readonly ReachDomain[],
  ambition: AmbitionInput | null,
  profile: AxiologicalProfile | undefined,
): number {
  const [primary, secondary] = reaches;
  let reach = 0;
  if (primary && row.reachPair.includes(primary)) reach += 2 / 3;
  if (secondary && row.reachPair.includes(secondary)) reach += 1 / 3;

  let amb = 0;
  if (ambition) {
    if (row.ambitionCategories.includes(ambition.category)) amb += 0.7;
    if (row.wantedKinds && ambition.wantedKinds.some(k => row.wantedKinds!.includes(k))) amb += 0.3;
  }

  // A row that matches neither the mortal's reaches nor their ambition is not
  // a fit at all — the personality half-credit is a tie-breaker between fits,
  // never a reason to name someone.
  if (reach === 0 && amb === 0) return 0;

  let personality = 0.5;
  if (row.personality) {
    const raw = profile?.[row.personality.pair];
    const lean = typeof raw === 'number' ? Math.sign(raw) : 0;
    personality = lean === 0 ? 0.5 : lean === row.personality.pole ? 1 : 0;
  }

  return CALLING_REACH_WEIGHT * reach
    + CALLING_AMBITION_WEIGHT * amb
    + CALLING_PERSONALITY_WEIGHT * personality;
}

/** Derive the best-scoring calling for a mortal. Deterministic; ties break by table order. */
export function deriveCalling(graph: WorldGraph, agentId: string): Calling {
  const node = graph.getNode(agentId);
  const reaches = leadingReachPair(node);
  const ambition = activeAmbitionInput(graph, agentId);
  const profile = node?.properties?.axiologicalProfile as AxiologicalProfile | undefined;

  let best: Calling = { titleKey: 'wanderer', title: CALLING_FALLBACK_TITLE, score: 0 };
  let bestScore = -1;
  for (const row of CALLING_ROWS) {
    const score = scoreCallingRow(row, reaches, ambition, profile);
    if (score > bestScore) {
      bestScore = score;
      best = { titleKey: row.titleKey, title: row.title, score };
    }
  }
  // A profile no row fits at all keeps the fallback rather than the first row.
  return bestScore > 0 ? best : { titleKey: 'wanderer', title: CALLING_FALLBACK_TITLE, score: 0 };
}

// ─── Storage ─────────────────────────────────────────────────────────

export function readStoredCalling(node: GraphNode | undefined): StoredCalling | null {
  const p = node?.properties as Record<string, unknown> | undefined;
  if (!p || typeof p.calling !== 'string' || typeof p.callingTitleKey !== 'string') return null;
  return {
    title: p.calling,
    titleKey: p.callingTitleKey,
    sinceTick: typeof p.callingSinceTick === 'number' ? p.callingSinceTick : 0,
    score: typeof p.callingScore === 'number' ? p.callingScore : 0,
  };
}

function writeCalling(graph: WorldGraph, agentId: string, calling: Calling, tick: number): void {
  try {
    graph.updateNode(agentId, {
      properties: {
        calling: calling.title,
        callingTitleKey: calling.titleKey,
        callingSinceTick: tick,
        callingScore: calling.score,
      },
    });
  } catch {
    // Fail-soft: a node that cannot be updated keeps whatever it had.
  }
}

// ─── Recompute — the hysteresis gate ─────────────────────────────────

export interface CallingChange {
  readonly agentId: string;
  readonly from: string | null;
  readonly to: string;
  readonly event: TickEvent | null;
}

/**
 * Recompute at one of the three trigger sites.
 *
 * First derivation stamps without a change event (`cause: 'initial'` in the trace,
 * no chronicle line — nothing changed, a name was found). After that a challenger
 * wins only past both gates. Returns the change, or null when nothing moved.
 */
export function recomputeCalling(
  graph: WorldGraph,
  agentId: string,
  tick: number,
  cause: CallingChangeCause,
): CallingChange | null {
  const node = graph.getNode(agentId);
  if (!node || node.properties?.actorType !== 'individual') return null;

  const challenger = deriveCalling(graph, agentId);
  const incumbent = readStoredCalling(node);

  if (!incumbent) {
    // A mortal the scorer cannot place — no capabilities, no ambition; the ambient
    // population at world init — stays *unnamed* rather than stamped with the
    // fallback. Stamping would start their hold clock on a name that says nothing,
    // and the surfaces already render the fallback for an unnamed mortal.
    if (challenger.score <= 0) return null;
    writeCalling(graph, agentId, challenger, tick);
    emitTrace({
      category: 'calling_change',
      tick,
      agentId,
      fromTitleKey: null,
      toTitleKey: challenger.titleKey,
      cause: 'initial',
      incumbentScore: 0,
      challengerScore: challenger.score,
      summary: `calling: ${node.name} is first called ${challenger.title}`,
    } as CallingChangeTrace & { summary: string });
    return { agentId, from: null, to: challenger.titleKey, event: null };
  }

  if (challenger.titleKey === incumbent.titleKey) {
    // Same name, fresher score — keep the hold clock, refresh the score.
    if (challenger.score !== incumbent.score) {
      try {
        graph.updateNode(agentId, { properties: { callingScore: challenger.score } });
      } catch { /* fail-soft */ }
    }
    return null;
  }

  // The incumbent is re-scored against today's inputs, so a name the deeds have
  // left behind loses its lead honestly rather than defending a stale score.
  const incumbentRow = CALLING_ROWS.find(r => r.titleKey === incumbent.titleKey);
  const incumbentScore = incumbentRow
    ? scoreCallingRow(
      incumbentRow,
      leadingReachPair(node),
      activeAmbitionInput(graph, agentId),
      node.properties?.axiologicalProfile as AxiologicalProfile | undefined,
    )
    : 0;

  const heldLongEnough = tick - incumbent.sinceTick >= CALLING_MIN_HOLD_TICKS;
  const clearsMargin = challenger.score - incumbentScore >= CALLING_SCORE_MARGIN;
  if (!heldLongEnough || !clearsMargin) return null;

  writeCalling(graph, agentId, challenger, tick);
  emitTrace({
    category: 'calling_change',
    tick,
    agentId,
    fromTitleKey: incumbent.titleKey,
    toTitleKey: challenger.titleKey,
    cause,
    incumbentScore,
    challengerScore: challenger.score,
    summary: `calling: ${node.name} — ${incumbent.title} → ${challenger.title} (${cause})`,
  } as CallingChangeTrace & { summary: string });

  const spotlight = node.properties?.spotlightTier === 'spotlight';
  const event: TickEvent | null = spotlight && CALLING_CHANGE_SIGNIFICANCE > 0
    ? {
      id: `calling_changed_${agentId}_${tick}`,
      tick,
      type: 'calling_changed',
      message: `${node.name} is no longer called ${incumbent.title}. The world calls them ${challenger.title} now.`,
      significance: CALLING_CHANGE_SIGNIFICANCE,
      actorId: agentId,
    }
    : null;

  return { agentId, from: incumbent.titleKey, to: challenger.titleKey, event };
}

// ─── Presentation ────────────────────────────────────────────────────

function presentationFor(titleKey: string, title: string): CallingPresentation {
  const p = CALLING_PRESENTATION[titleKey] ?? CALLING_FALLBACK_PRESENTATION;
  return { titleKey, title, glyph: p.glyph, color: p.color };
}

/** Title for a persisted family — the legacy fallback for old history records. */
export function legacyFamilyCalling(family: BehaviorFamily | null | undefined): CallingPresentation {
  const titleKey = family ? BEHAVIOR_FAMILY_TO_CALLING[family] : undefined;
  const row = titleKey ? CALLING_ROWS.find(r => r.titleKey === titleKey) : undefined;
  return row ? presentationFor(row.titleKey, row.title) : presentationFor('wanderer', CALLING_FALLBACK_TITLE);
}

/**
 * What the four render sites draw: the stored calling when one exists, else the
 * legacy family's seed title, else the fallback. Read-only — a surface never
 * triggers a recompute (that is the three event sites' job).
 */
export function getCallingPresentation(
  node: GraphNode | undefined,
  legacyFamily?: BehaviorFamily | null,
): CallingPresentation {
  const stored = readStoredCalling(node);
  if (stored) return presentationFor(stored.titleKey, stored.title);
  return legacyFamilyCalling(legacyFamily);
}
