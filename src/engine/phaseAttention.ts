// src/engine/phaseAttention.ts

/**
 * Phase: Attention Pool — runs once per tick.
 *
 * Responsibilities:
 *   1. Regen the ascendant's attention pool (read from graph node props, write back).
 *   2. Expire old thread tugs whose expiresTick <= currentTick.
 *   3. Generate new thread tugs for encounters with effectiveTier === 'shaping'
 *      that started this tick (via curator scoring).
 *   4. Emit AttentionPoolTrace and CuratorDecisionTrace entries.
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import type { GameState } from '../types/gameState';
import type { ThreadTug } from '../types/attention';
import type { AttentionPoolTrace, CuratorDecisionTrace } from '../types/attention';
import type { ReachDomain } from '../types/traits';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { regenAttention } from './attentionPool';
import { scoreCurationCandidates } from './curator';
import type { CurationCandidate } from './curator';
import {
  THREAD_TUG_LINGER,
  ATTENTION_BASE_CAPACITY,
  ATTENTION_BASE_REGEN,
} from '../data/attention-constants';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';

// ─── ID generation (tick-scoped counter) ────────────────────────────────────

let tugCounter = 0;
let tugCounterTick = -1;

function nextTugId(tick: number): string {
  if (tick !== tugCounterTick) {
    tugCounter = 0;
    tugCounterTick = tick;
  }
  return `tug_${tick}_${++tugCounter}`;
}

/** Reset for tests. */
export function resetTugCounter(): void {
  tugCounter = 0;
  tugCounterTick = -1;
}

// ─── Phase entry point ────────────────────────────────────────────────────────

/**
 * @param state     Current game state (read-only intent; node props mutated in-place per graph convention).
 * @param templates Unified action template registry (passed in to avoid circular imports).
 * @param rng       Seeded PRNG for curator tiebreaking.
 */
export function phaseAttention(
  state: GameState,
  templates: readonly UnifiedActionTemplate[],
  rng: () => number,
): Partial<GameState> {
  const ascendantNode = state.graph.getNode(state.ascendantId);
  if (!ascendantNode) return {};

  // ── 1. Read or initialise attention state from ascendant node properties ──

  const props = ascendantNode.properties as Record<string, unknown>;
  const prevPool = (props.attentionPool as number) ?? ATTENTION_BASE_CAPACITY;
  const prevState = {
    attentionPool:     prevPool,
    attentionCapacity: (props.attentionCapacity as number) ?? ATTENTION_BASE_CAPACITY,
    attentionRegen:    (props.attentionRegen    as number) ?? ATTENTION_BASE_REGEN,
  };

  // ── 2. Regen ─────────────────────────────────────────────────────────────

  const regenned = regenAttention(prevState);

  // Write back to node in-place (graph convention: mutate props directly)
  props.attentionPool     = regenned.attentionPool;
  props.attentionCapacity = regenned.attentionCapacity;
  props.attentionRegen    = regenned.attentionRegen;

  const regenAmount = regenned.attentionPool - prevPool;

  // ── 3. Expire old tugs ────────────────────────────────────────────────────

  const existingTugs: ThreadTug[] = state.activeThreadTugs ?? [];
  const activeTugs  = existingTugs.filter(t => t.expiresTick > state.tick);

  // ── 4. Collect shaping candidates from unified actions that started this tick ──

  // Build a quick lookup map for templates
  const templateById = new Map<string, UnifiedActionTemplate>();
  for (const t of templates) templateById.set(t.id, t);

  const candidates: CurationCandidate[] = [];

  for (const ua of state.unifiedActions) {
    if (
      ua.effectiveTier !== 'shaping' ||
      ua.startTick     !== state.tick  ||
      ua.resolved
    ) {
      continue;
    }

    // Resolve the agent's court position via the thread edge
    const threadEdges = state.graph.getIncomingEdges(ua.actorId, 'thread');
    const threadEdge  = threadEdges.find(e => e.source === state.ascendantId);
    const courtPosition = (threadEdge?.properties as Record<string, unknown> | undefined)
      ?.courtPosition as CurationCandidate['courtPosition'] | undefined;

    // dormant agents should not generate tugs
    if (!courtPosition || (courtPosition as string) === 'dormant') continue;

    // Look up the template for reach domain
    const template = templateById.get(ua.templateId);
    const reachPrimary: string = template?.reach ?? 'combat';

    candidates.push({
      encounterId:       ua.actionId,   // unified action id is the encounter unit
      actionId:          ua.actionId,
      agentId:           ua.actorId,
      courtPosition,
      threatRating:      'moderate',    // default — full threat mapping is a future pass
      reachPrimary,
      isChainStage:      false,         // chain stage detection is a future pass
      isFinalChainStage: false,
      factionThreadCount: 0,            // faction relevance is a future pass
      matchesAmbition:   false,         // ambition alignment is a future pass
    });
  }

  // ── 5. Run curator ────────────────────────────────────────────────────────

  // Build recency map from existing (still-active) tugs
  const lastTugAgentTicks = new Map<string, number>();
  for (const tug of activeTugs) {
    const prev = lastTugAgentTicks.get(tug.agentId);
    if (prev === undefined || tug.createdTick > prev) {
      lastTugAgentTicks.set(tug.agentId, tug.createdTick);
    }
  }

  // Last reach from the most recently created active tug
  const mostRecentTug = activeTugs.reduce<ThreadTug | null>(
    (best, t) => (!best || t.createdTick > best.createdTick) ? t : best,
    null,
  );
  const lastTugReach: string | null = mostRecentTug?.reachPrimary ?? null;

  // Sustainable rate = 1 tug per capacity unit per day (simple default)
  const sustainableRate = regenned.attentionCapacity;

  const { selected, demoted } = scoreCurationCandidates(
    candidates,
    lastTugAgentTicks,
    lastTugReach,
    state.tick,
    sustainableRate,
    rng,
  );

  // ── 6. Create ThreadTug records for selected candidates ───────────────────

  const newTugs: ThreadTug[] = selected.map(c => ({
    id:            nextTugId(state.tick),
    agentId:       c.agentId,
    encounterId:   c.encounterId,
    actionId:      c.actionId,
    reachPrimary:  c.reachPrimary as ReachDomain,
    threatLevel:   (c.threatRating === 'hard' || c.threatRating === 'deadly')
                     ? c.threatRating as 'hard' | 'deadly'
                     : 'moderate',
    courtPosition: c.courtPosition,
    createdTick:   state.tick,
    expiresTick:   state.tick + THREAD_TUG_LINGER,
    attended:      false,
    curationScore: 0, // score not surfaced from curator return; placeholder
  }));

  // ── 7. Emit traces ─────────────────────────────────────────────────────────

  const poolTrace: AttentionPoolTrace & { category: string; summary: string } = {
    type:     'attention_pool',
    tick:     state.tick,
    previous: prevPool,
    current:  regenned.attentionPool,
    capacity: regenned.attentionCapacity,
    delta:    regenAmount,
    cause:    'regen',
    // TraceBase required fields
    category: 'attention_pool',
    summary:  `attention pool regen +${regenAmount.toFixed(2)} → ${regenned.attentionPool.toFixed(2)}/${regenned.attentionCapacity}`,
  };
  emitTrace(poolTrace as unknown as TraceEntry);

  for (const c of selected) {
    const decTrace: CuratorDecisionTrace & { category: string; summary: string } = {
      type:          'curator_decision',
      tick:          state.tick,
      agentId:       c.agentId,
      encounterId:   c.encounterId,
      decision:      'kept',
      curationScore: 0,
      reason:        'selected_by_curator',
      // TraceBase required fields
      category: 'curator_decision',
      summary:  `curator kept encounter ${c.encounterId} for agent ${c.agentId}`,
    };
    emitTrace(decTrace as unknown as TraceEntry);
  }

  for (const c of demoted) {
    const decTrace: CuratorDecisionTrace & { category: string; summary: string } = {
      type:          'curator_decision',
      tick:          state.tick,
      agentId:       c.agentId,
      encounterId:   c.encounterId,
      decision:      'curated_out',
      curationScore: 0,
      reason:        'demoted_by_curator',
      // TraceBase required fields
      category: 'curator_decision',
      summary:  `curator demoted encounter ${c.encounterId} for agent ${c.agentId}`,
    };
    emitTrace(decTrace as unknown as TraceEntry);
  }

  // ── 8. Return partial state ────────────────────────────────────────────────

  return {
    activeThreadTugs: [...activeTugs, ...newTugs],
  };
}
