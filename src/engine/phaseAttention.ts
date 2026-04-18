// src/engine/phaseAttention.ts

/**
 * Phase: Attention Pool — runs once per tick.
 *
 * Responsibilities:
 *   1. Regen the ascendant's attention pool (read from graph node props, write back).
 *   2. Expire old thread tugs whose expiresTick <= currentTick.
 *   3. Generate new thread tugs for ALL active shaping encounters not yet tug'd
 *      (curator scoring). Note: encounters created this tick by phaseAgentDecision
 *      (which runs after phaseAttention) will be picked up next tick — this is the
 *      correct 1-tick delay described in the spec.
 *   4. Wire pacing governor: fire or queue story_beat encounters.
 *   5. Emit AttentionPoolTrace and CuratorDecisionTrace entries.
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-model-design.md
 */

import type { GameState } from '../types/gameState';
import type { ThreadTug, QueuedStoryBeat, DigestEntry } from '../types/attention';
import type { AttentionPoolTrace, CuratorDecisionTrace } from '../types/attention';
import type { ReachDomain } from '../types/traits';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { regenAttention } from './attentionPool';
import { scoreCurationCandidates } from './curator';
import type { CurationCandidate } from './curator';
import { appendDigestEntry } from './digestBuffer';
import {
  canFireStoryBeat,
  enqueueStoryBeat,
  dequeueStoryBeat,
} from './pacingGovernor';
import type { PacingState } from './pacingGovernor';
import {
  THREAD_TUG_LINGER,
  ATTENTION_BASE_CAPACITY,
  ATTENTION_BASE_REGEN,
} from '../data/attention-constants';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import { classifyChainStage, getChainProgress } from './encounterChains';
import { agentPursuesReach } from './encounterScoring';

// ─── Threat rating helpers ──────────────────────────────────────────────────

/** Map rarityTier (1–4) → threat rating string for curation candidate. */
function rarityToThreat(rarityTier: number): CurationCandidate['threatRating'] {
  switch (rarityTier) {
    case 1: return 'easy';
    case 2: return 'moderate';
    case 3: return 'hard';
    case 4: return 'deadly';
    default: return 'moderate';
  }
}

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

  // ── 3. Expire old tugs + produce missed-tug digest entries ───────────────

  const existingTugs: ThreadTug[] = state.activeThreadTugs ?? [];
  const expiredTugs = existingTugs.filter(t => t.expiresTick <= state.tick);
  const activeTugs  = existingTugs.filter(t => t.expiresTick > state.tick);

  // Accumulate digest entries from this phase alongside existing buffer
  const digestBuffer: DigestEntry[] = [...(state.digestBuffer ?? [])];

  // For each expired tug that was never attended, emit a missed-encounter digest entry.
  // (Attended tugs are already resolved via notification — they don't need a second entry.)
  for (const tug of expiredTugs) {
    if (tug.attended) continue;

    const agentNode = state.graph.getNode(tug.agentId);
    const missedEntry: DigestEntry = {
      agentId:             tug.agentId,
      agentName:           (agentNode?.properties as Record<string, unknown> | undefined)?.name as string ?? 'Unknown',
      encounterId:         tug.encounterId,
      encounterName:       'Missed Encounter',
      encounterType:       'explore',
      reachPrimary:        tug.reachPrimary,
      tick:                tug.createdTick,
      success:             true,  // auto-resolved at baseline
      significantOutcomes: [],
      capabilityChanges:   {},
      attachmentsGained:   [],
      attachmentsLost:     [],
      quintessenceDelta:   0,
      isNotable:           false,
      wasCuratedOut:       false, // player saw the tug but chose not to attend
      isDormantAgent:      false,
      sourceType:          'agent',
    };
    appendDigestEntry(digestBuffer, missedEntry);
  }

  // ── 4. Collect shaping candidates ────────────────────────────────────────────
  //
  // Scan ALL active shaping encounters — not just ones created this tick.
  // phaseAttention runs BEFORE phaseAgentDecision, so encounters created this
  // tick by decision phase won't appear until next tick. That 1-tick delay is
  // correct per spec ("New encounters from 2b surface in next tick's 2a.6").
  //
  // Skip any encounter that already has an active tug (idempotent — prevents
  // re-curating the same encounter every tick until it resolves).

  // Build a quick lookup map for templates
  const templateById = new Map<string, UnifiedActionTemplate>();
  for (const t of templates) templateById.set(t.id, t);

  // Set of actionIds that already have an active tug
  const tuggedActionIds = new Set<string>(activeTugs.map(t => t.actionId));

  const candidates: CurationCandidate[] = [];

  // 4a. Unified actions (current path)
  for (const ua of state.unifiedActions) {
    if (
      ua.effectiveTier !== 'shaping' ||
      ua.resolved ||
      tuggedActionIds.has(ua.actionId)
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

    // Look up the template for reach domain and threat rating
    const template = templateById.get(ua.templateId);
    const reachPrimary: string = template?.reach ?? 'combat';
    const threatRating = template ? rarityToThreat(template.rarityTier) : 'moderate';

    // Chain stage classification
    const agentNode = state.graph.getNode(ua.actorId);
    const chainProgress = getChainProgress(agentNode?.properties ?? {});
    const { isChainStage, isFinalChainStage } = classifyChainStage(ua.templateId, chainProgress);

    // Faction thread relevance: count fellow faction members who have an ascendant thread
    let factionThreadCount = 0;
    const memberOfEdges = state.graph.getOutgoingEdges(ua.actorId, 'member_of');
    if (memberOfEdges.length > 0) {
      const fellows = new Set<string>();
      for (const memberEdge of memberOfEdges) {
        const incomingMembers = state.graph.getIncomingEdges(memberEdge.target, 'member_of');
        for (const inc of incomingMembers) {
          if (inc.source === ua.actorId) continue;
          const hasThread = state.graph.getIncomingEdges(inc.source, 'thread')
            .some(e => e.source === state.ascendantId);
          if (hasThread) fellows.add(inc.source);
        }
      }
      factionThreadCount = fellows.size;
    }

    // Ambition alignment
    const matchesAmbition = template
      ? agentPursuesReach(state.graph, ua.actorId, template.reach as ReachDomain)
      : false;

    candidates.push({
      encounterId:        ua.actionId,   // unified action id is the encounter unit
      actionId:           ua.actionId,
      agentId:            ua.actorId,
      courtPosition,
      threatRating,
      reachPrimary,
      isChainStage,
      isFinalChainStage,
      factionThreadCount,
      matchesAmbition,
    });
  }

  // 4b. Legacy encounterProgress (pre-unified-action path)
  for (const ep of state.encounterProgress) {
    if (
      ep.effectiveTier !== 'shaping' ||
      ep.status        !== 'active'  ||
      tuggedActionIds.has(ep.encounterId)
    ) {
      continue;
    }

    // Resolve court position via thread edge
    const threadEdges = state.graph.getIncomingEdges(ep.actorId, 'thread');
    const threadEdge  = threadEdges.find(e => e.source === state.ascendantId);
    const courtPosition = (threadEdge?.properties as Record<string, unknown> | undefined)
      ?.courtPosition as CurationCandidate['courtPosition'] | undefined;

    if (!courtPosition || (courtPosition as string) === 'dormant') continue;

    // Faction thread relevance (same walk as unified path)
    let legacyFactionThreadCount = 0;
    const legacyMemberEdges = state.graph.getOutgoingEdges(ep.actorId, 'member_of');
    if (legacyMemberEdges.length > 0) {
      const legacyFellows = new Set<string>();
      for (const memberEdge of legacyMemberEdges) {
        const incomingMembers = state.graph.getIncomingEdges(memberEdge.target, 'member_of');
        for (const inc of incomingMembers) {
          if (inc.source === ep.actorId) continue;
          const hasThread = state.graph.getIncomingEdges(inc.source, 'thread')
            .some(e => e.source === state.ascendantId);
          if (hasThread) legacyFellows.add(inc.source);
        }
      }
      legacyFactionThreadCount = legacyFellows.size;
    }

    candidates.push({
      encounterId:        ep.encounterId,
      actionId:           ep.encounterId,
      agentId:            ep.actorId,
      courtPosition,
      threatRating:       'moderate',
      reachPrimary:       'combat',      // legacy encounters have no template ref here
      isChainStage:       false,         // no template id available on legacy path
      isFinalChainStage:  false,         // no template id available on legacy path
      factionThreadCount: legacyFactionThreadCount,
      matchesAmbition:    false,         // reach='combat' is placeholder; would falsely bias
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

  const newTugs: ThreadTug[] = selected.map(({ candidate: c, score }) => ({
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
    curationScore: score,
  }));

  // ── 6b. Digest entries for demoted (curated-out) candidates ──────────────

  for (const { candidate: c } of demoted) {
    const agentNode = state.graph.getNode(c.agentId);
    const curatedOutEntry: DigestEntry = {
      agentId:             c.agentId,
      agentName:           (agentNode?.properties as Record<string, unknown> | undefined)?.name as string ?? 'Unknown',
      encounterId:         c.encounterId,
      encounterName:       'Curated Out',
      encounterType:       'explore',
      reachPrimary:        c.reachPrimary as ReachDomain,
      tick:                state.tick,
      success:             true,
      significantOutcomes: [],
      capabilityChanges:   {},
      attachmentsGained:   [],
      attachmentsLost:     [],
      quintessenceDelta:   0,
      isNotable:           false,
      wasCuratedOut:       true, // curator chose to suppress this encounter
      isDormantAgent:      false,
      sourceType:          'agent',
    };
    appendDigestEntry(digestBuffer, curatedOutEntry);
  }

  // ── 7. Emit traces ─────────────────────────────────────────────────────────

  emitTrace({
    category: 'attention_pool',
    tick:     state.tick,
    summary:  `attention pool regen +${regenAmount.toFixed(2)} → ${regenned.attentionPool.toFixed(2)}/${regenned.attentionCapacity}`,
    previous: prevPool,
    current:  regenned.attentionPool,
    capacity: regenned.attentionCapacity,
    delta:    regenAmount,
    cause:    'regen',
  } satisfies Omit<AttentionPoolTrace, 'id' | 'timestamp'> as Omit<TraceEntry, 'id' | 'timestamp'>);

  for (const { candidate: c, score } of selected) {
    emitTrace({
      category: 'curator_decision', tick: state.tick, agentId: c.agentId,
      summary: `curator kept encounter ${c.encounterId} for agent ${c.agentId} (score ${score.toFixed(3)})`,
      encounterId: c.encounterId, decision: 'kept', curationScore: score, reason: 'selected_by_curator',
      isChainStage: c.isChainStage, isFinalChainStage: c.isFinalChainStage,
      factionThreadCount: c.factionThreadCount, matchesAmbition: c.matchesAmbition,
    } satisfies Omit<CuratorDecisionTrace, 'id' | 'timestamp'> as Omit<TraceEntry, 'id' | 'timestamp'>);
  }

  for (const { candidate: c, score } of demoted) {
    emitTrace({
      category: 'curator_decision', tick: state.tick, agentId: c.agentId,
      summary: `curator demoted encounter ${c.encounterId} for agent ${c.agentId} (score ${score.toFixed(3)})`,
      encounterId: c.encounterId, decision: 'curated_out', curationScore: score, reason: 'demoted_by_curator',
      isChainStage: c.isChainStage, isFinalChainStage: c.isFinalChainStage,
      factionThreadCount: c.factionThreadCount, matchesAmbition: c.matchesAmbition,
    } satisfies Omit<CuratorDecisionTrace, 'id' | 'timestamp'> as Omit<TraceEntry, 'id' | 'timestamp'>);
  }

  // ── 8. Pacing governor — story_beat encounters ────────────────────────────────

  // Read pacing state from ascendant node properties
  const pacingState: PacingState = {
    activeStoryBeat:   (props.pacingActiveStoryBeat   as string) ?? null,
    lastCompletedTick: (props.pacingLastCompletedTick as number) ?? -999,
    queue:             state.storyBeatQueue ?? [],
  };

  // Helper: resolve rough hex coords for an agent (best-effort; 0,0 fallback)
  function resolveAgentHex(actorId: string): { hexCol: number; hexRow: number } {
    const agentNode = state.graph.getNode(actorId);
    if (!agentNode) return { hexCol: 0, hexRow: 0 };
    const locEdges = state.graph.getOutgoingEdges(actorId, 'located_at');
    if (!locEdges.length) return { hexCol: 0, hexRow: 0 };
    const locNode = state.graph.getNode(locEdges[0].target);
    if (!locNode) return { hexCol: 0, hexRow: 0 };
    const lp = locNode.properties as Record<string, unknown>;
    const col = lp.hexCol as number | undefined;
    const row = lp.hexRow as number | undefined;
    if (col != null && row != null) return { hexCol: col, hexRow: row };
    // sublocation: try parent location
    const parentId = lp.parentLocationId as string | undefined;
    if (!parentId) return { hexCol: 0, hexRow: 0 };
    const parentNode = state.graph.getNode(parentId);
    if (!parentNode) return { hexCol: 0, hexRow: 0 };
    const pp = parentNode.properties as Record<string, unknown>;
    return {
      hexCol: (pp.hexCol as number) ?? 0,
      hexRow: (pp.hexRow as number) ?? 0,
    };
  }

  // Collect story_beat encounters from both unified actions and legacy progress
  const storyBeatDemotions: string[] = []; // encounterId → downgrade to 'shaping'

  // Unified action story beats
  for (const ua of state.unifiedActions) {
    if (ua.effectiveTier !== 'story_beat' || ua.resolved) continue;

    const hex = resolveAgentHex(ua.actorId);
    const beat: QueuedStoryBeat = {
      encounterId: ua.actionId,
      actionId:    ua.actionId,
      agentId:     ua.actorId,
      priority:    'template_intrinsic',
      queuedTick:  state.tick,
      hexCol:      hex.hexCol,
      hexRow:      hex.hexRow,
    };

    if (canFireStoryBeat(pacingState, state.tick)) {
      // Fire immediately — set it as the active beat
      pacingState.activeStoryBeat = ua.actionId;
    } else {
      const demoted = enqueueStoryBeat(pacingState, beat);
      if (demoted) {
        // Queue overflow — demote the ejected beat to shaping for curator pickup
        storyBeatDemotions.push(demoted.encounterId);
      }
    }
  }

  // Legacy encounterProgress story beats
  for (const ep of state.encounterProgress) {
    if (ep.effectiveTier !== 'story_beat' || ep.status !== 'active') continue;

    const hex = resolveAgentHex(ep.actorId);
    const beat: QueuedStoryBeat = {
      encounterId: ep.encounterId,
      agentId:     ep.actorId,
      priority:    'template_intrinsic',
      queuedTick:  state.tick,
      hexCol:      hex.hexCol,
      hexRow:      hex.hexRow,
    };

    if (canFireStoryBeat(pacingState, state.tick)) {
      pacingState.activeStoryBeat = ep.encounterId;
    } else {
      const demoted = enqueueStoryBeat(pacingState, beat);
      if (demoted) {
        storyBeatDemotions.push(demoted.encounterId);
      }
    }
  }

  // Try to dequeue a queued beat if the slot is open
  dequeueStoryBeat(pacingState, state.tick);

  // Apply demotions: change effectiveTier to 'shaping' so curator picks them up
  if (storyBeatDemotions.length > 0) {
    const demotionSet = new Set(storyBeatDemotions);
    for (const ua of state.unifiedActions) {
      if (demotionSet.has(ua.actionId) && ua.effectiveTier === 'story_beat') {
        (ua as { effectiveTier: string }).effectiveTier = 'shaping';
      }
    }
    for (const ep of state.encounterProgress) {
      if (demotionSet.has(ep.encounterId) && ep.effectiveTier === 'story_beat') {
        ep.effectiveTier = 'shaping';
      }
    }
  }

  // Write pacing state back to ascendant node props
  props.pacingActiveStoryBeat   = pacingState.activeStoryBeat;
  props.pacingLastCompletedTick = pacingState.lastCompletedTick;

  // ── 9. Return partial state ────────────────────────────────────────────────

  return {
    activeThreadTugs: [...activeTugs, ...newTugs],
    storyBeatQueue:   pacingState.queue,
    digestBuffer,
  };
}
