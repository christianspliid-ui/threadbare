/**
 * Hidden Marks — query and mutation helpers for the delayed-reveal hidden mark primitive.
 *
 * Hidden marks are concealed consequences placed on agents by encounter aftermath
 * effects. They persist on GameState (not on graph nodes) and are queryable by
 * future encounters to trigger investigation reveals.
 *
 * v2: Full reveal loop. Marks score matching encounters higher, consume
 * probabilistically at resolution, and decay over time.
 */

import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import type { HiddenMark } from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import { mulberry32 } from '../lib/prng';
import { generateMarkRevealMessage } from './hiddenMarkProse';

// ─── Decay constants (NFP #1) ─────────────────────────────────────

/** Probability multiplier for mark consumption: severity * REVEAL_PROBABILITY_MULT.
 * At severity 1.0 → 0.9 probability; at severity 0.5 → 0.45.
 * @range 0.5–1.0 */
export const REVEAL_PROBABILITY_MULT = 0.9;

/** Ticks after placedTick before decay begins. Gives gameplay time for natural reveal.
 * @range 10–40 */
export const MARK_DECAY_GRACE_TICKS = 20;

/** Fraction of current severity lost per tick once grace expires (exponential decay).
 * @range 0.01–0.05 */
export const MARK_DECAY_PER_TICK = 0.02;

/** Severity threshold below which the mark is dropped via decay.
 * @range 0.02–0.1 */
export const MARK_DECAY_FLOOR = 0.05;

/** Chronicle event significance for a successful revelation. High enough to toast.
 * @range 0.5–1.0 */
export const REVEAL_EVENT_SIGNIFICANCE = 0.7;

/** Chronicle event significance for a decay-dropped revelation. Below the ~0.5
 * toast threshold — logs to NarrativeLog without raising a toast.
 * @range 0.1–0.5 */
export const DECAY_EVENT_SIGNIFICANCE = 0.3;

// ─── Query helpers ────────────────────────────────────────────────

/** Get all hidden marks on a specific agent. */
export function getAgentHiddenMarks(state: GameState, agentId: string): readonly HiddenMark[] {
  return (state.hiddenMarks ?? []).filter(m => m.targetAgentId === agentId);
}

/** Get hidden marks by category across all agents. */
export function getHiddenMarksByCategory(state: GameState, category: HiddenMark['category']): readonly HiddenMark[] {
  return (state.hiddenMarks ?? []).filter(m => m.category === category);
}

/** Check if an agent has any hidden mark in a given category. */
export function hasHiddenMark(state: GameState, agentId: string, category: HiddenMark['category']): boolean {
  return (state.hiddenMarks ?? []).some(m => m.targetAgentId === agentId && m.category === category);
}

/**
 * Check if any hidden marks would be revealed by an encounter from a given family.
 * Returns marks whose revealFamilies include the given family prefix.
 */
export function checkMarkReveals(
  state: GameState,
  agentId: string,
  encounterFamily: string,
): readonly HiddenMark[] {
  return (state.hiddenMarks ?? []).filter(m =>
    m.targetAgentId === agentId &&
    m.revealFamilies?.some(f => encounterFamily.startsWith(f)),
  );
}

// ─── Mutation helpers ─────────────────────────────────────────────

/** Remove a specific mark by ID (after it has been revealed). Does NOT emit a trace. */
export function removeHiddenMark(state: GameState, markId: string): GameState {
  return {
    ...state,
    hiddenMarks: (state.hiddenMarks ?? []).filter(m => m.markId !== markId),
  };
}

/**
 * Reveal a hidden mark — remove it from state and emit a `hidden_mark_revealed` trace.
 * Use this instead of `removeHiddenMark` when a mark is consumed by a matching encounter
 * or action (i.e. a revealFamilies predicate matched).
 *
 * If the markId is not found, state is returned unchanged and no trace is emitted.
 */
export function revealHiddenMark(
  state: GameState,
  markId: string,
  tick: number,
  revealedBy: string,
): GameState {
  const mark = (state.hiddenMarks ?? []).find(m => m.markId === markId);
  if (!mark) return state;
  emitTrace({
    tick,
    category: 'hidden_mark_revealed',
    agentId: mark.targetAgentId,
    markId,
    actorId: mark.targetAgentId,
    revealedBy,
    ticksSincePlacement: tick - mark.placedTick,
    summary: `Hidden mark revealed: "${mark.label}" on ${mark.targetAgentId} by ${revealedBy}`,
  });
  return removeHiddenMark(state, markId);
}

// ─── Reveal-check helper ──────────────────────────────────────────

export interface MarkRevealCandidate {
  readonly mark: HiddenMark;
  readonly templateId: string;
  /** Probability of consumption at resolution: severity * REVEAL_PROBABILITY_MULT clamped [0,1] */
  readonly revealProbability: number;
}

/**
 * For a given agent and encounter templateId, returns all marks whose revealFamilies
 * match the templateId by prefix. Pure query — does NOT consume the mark.
 *
 * Accepts either a GameState or a pre-extracted marks array to keep scoring
 * functions dependency-minimal (they don't hold a full GameState).
 *
 * Used at scoring time (to boost matching candidates) and resolution time
 * (to probabilistically consume matched marks).
 */
export function evaluateMarkReveals(
  marksOrState: GameState | readonly HiddenMark[],
  agentId: string,
  templateId: string,
): readonly MarkRevealCandidate[] {
  const marks: readonly HiddenMark[] = Array.isArray(marksOrState)
    ? (marksOrState as readonly HiddenMark[])
    : ((marksOrState as GameState).hiddenMarks ?? []);
  return marks
    .filter(m =>
      m.targetAgentId === agentId &&
      m.revealFamilies?.some(f => templateId.startsWith(f)),
    )
    .map(m => ({
      mark: m,
      templateId,
      revealProbability: Math.min(1, m.severity * REVEAL_PROBABILITY_MULT),
    }));
}

// ─── Resolution-time consumption ─────────────────────────────────

export interface ConsumeMarksResult {
  nextState: GameState;
  /** Traces to emit outside any setState updater (avoids StrictMode double-emit). */
  tracesToEmit: Omit<TraceEntry, 'id' | 'timestamp'>[];
}

/**
 * At encounter resolution, probabilistically consume any marks on the actor whose
 * revealFamilies match the resolved templateId. Each matched mark rolls
 * rng() < severity * REVEAL_PROBABILITY_MULT; on hit the mark is removed,
 * hidden_mark_revealed is traced, and a chronicle event is appended.
 *
 * Deterministic: seed derived from (state.seed, tick, markId).
 *
 * Returns traces separately so the caller can emit them outside any React setState
 * updater — React StrictMode double-invokes updaters, which would cause duplicate
 * trace emission if emitTrace were called inside the updater.
 */
export function consumeMatchingMarks(
  state: GameState,
  agentId: string | undefined,
  templateId: string | undefined,
  tick: number,
): ConsumeMarksResult {
  if (!agentId || !templateId) return { nextState: state, tracesToEmit: [] };

  const candidates = evaluateMarkReveals(state, agentId, templateId);
  if (candidates.length === 0) return { nextState: state, tracesToEmit: [] };

  let s = state;
  const tracesToEmit: Omit<TraceEntry, 'id' | 'timestamp'>[] = [];

  for (const { mark } of candidates) {
    // Derive a deterministic seed per mark: mix world seed, tick, and markId chars
    let seedVal = s.seed + tick * 97;
    for (let i = 0; i < mark.markId.length; i++) {
      seedVal = (seedVal ^ (mark.markId.charCodeAt(i) * 2654435761)) >>> 0;
    }
    const rng = mulberry32(seedVal);
    const roll = rng();
    const threshold = Math.min(1, mark.severity * REVEAL_PROBABILITY_MULT);

    if (roll >= threshold) continue;
    // Never consume a mark placed this same tick — aftermath can plant a mark and this
    // function would otherwise immediately consume it, defeating the delayed-reveal mechanic.
    if (mark.placedTick >= tick) continue;

    // Collect trace for emission outside the setState updater
    tracesToEmit.push({
      tick,
      category: 'hidden_mark_revealed',
      agentId: mark.targetAgentId,
      markId: mark.markId,
      actorId: mark.targetAgentId,
      revealedBy: templateId,
      ticksSincePlacement: tick - mark.placedTick,
      summary: `Hidden mark revealed: "${mark.label}" on ${mark.targetAgentId} by ${templateId}`,
    });

    // Chronicle event — high significance to surface in NarrativeLog + ToastStack
    const revealEvent: TickEvent = {
      id: `mark_reveal_${mark.markId}_${tick}`,
      tick,
      type: 'ripple_consequence',
      message: generateMarkRevealMessage(s, mark, templateId, tick),
      significance: REVEAL_EVENT_SIGNIFICANCE,
      actorId: mark.targetAgentId,
    };

    s = {
      ...s,
      hiddenMarks: (s.hiddenMarks ?? []).filter(m => m.markId !== mark.markId),
      tickEvents: [...s.tickEvents, revealEvent],
      recentEvents: [...s.recentEvents, revealEvent].slice(-MAX_RECENT_EVENTS),
    };
  }

  return { nextState: s, tracesToEmit };
}
