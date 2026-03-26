/**
 * Journey Engine — doom-clock-scheduled hero's journey arc for The First.
 *
 * TB-035 Phase 2. The doom clock determines WHEN beats fire,
 * the First's world state determines WHICH variant fires,
 * and the player's vignette choice determines WHAT happens.
 *
 * Integration: called from orchestrator after doom phase advances.
 * Produces PendingVignette entries on GameState; UI consumes them.
 */

import type { WorldGraph } from './graph';
import type { GameState, TickEvent } from '../types/gameState';
import type { CampbellianPhase, ThreadEdgeProperties } from '../types/influence';
import type {
  StateSnapshot,
  BeatOutcome,
  JourneyBeatTemplate,
  JourneyVignetteData,
  PendingVignette,
  BeatVariant,
} from '../types/journeyEngine';
import {
  PHASE_BOUNDARIES,
  CALL_PHASE_END,
  TRIALS_PHASE_END,
  CRISIS_PHASE_END,
  ORDEAL_PHASE_END,
  ORDEAL_FORCE_FIRE_THRESHOLD,
  MAX_PENDING_VIGNETTES,
} from '../types/journeyEngine';
import {
  getThreadsFrom,
  getActorTraits,
  getAgentAmbitions,
  getAgentFaction,
  getAgentBonds,
  getAgentMemberships,
} from './graphQueries';
import { emitTrace } from './traceBuffer';
import { mulberry32 } from '../lib/prng';

// ─── Phase Boundary Logic ──────────────────────────────────────────

/**
 * Get the Campbellian phase for a given doom clock progress fraction.
 */
export function getJourneyPhase(doomProgress: number): CampbellianPhase {
  if (doomProgress < CALL_PHASE_END) return 'call';
  if (doomProgress < TRIALS_PHASE_END) return 'road_of_trials';
  if (doomProgress < CRISIS_PHASE_END) return 'crisis';
  if (doomProgress < ORDEAL_PHASE_END) return 'ordeal';
  return 'return';
}

/**
 * Get the phase boundary definition for a Campbellian phase.
 */
export function getPhaseBoundary(phase: CampbellianPhase) {
  return PHASE_BOUNDARIES.find(b => b.phase === phase)!;
}

/**
 * Calculate the beat thresholds within a phase.
 * Returns an array of doom clock fractions at which beats should fire.
 */
export function getBeatThresholds(phase: CampbellianPhase): number[] {
  const boundary = getPhaseBoundary(phase);
  const { start, end, beatCount } = boundary;

  if (beatCount <= 1) {
    // Single beat fires at midpoint of the phase
    return [start + (end - start) / 2];
  }

  // Multiple beats: evenly spaced within the phase
  const step = (end - start) / (beatCount + 1);
  return Array.from({ length: beatCount }, (_, i) => start + step * (i + 1));
}

// ─── State Snapshot ─────────────────────────────────────────────────

/**
 * Build a state snapshot for The First — the four-axis world state
 * used for template variant selection.
 */
export function buildStateSnapshot(
  graph: WorldGraph,
  agentId: string,
  threadProps: ThreadEdgeProperties,
): StateSnapshot {
  const agentNode = graph.getNode(agentId);
  const props = agentNode?.properties ?? {};

  // Power axis
  const domainCapabilities = (props.domainCapabilities as Record<string, number>) ?? {};
  const primaryReach = (props.primaryReach as string) ?? '';
  const primaryReachLevel = domainCapabilities[primaryReach] ?? 0;
  const traits = getActorTraits(graph, agentId);
  const tierLevel = threadProps.tier ?? 0;

  // Influence axis
  const memberships = getAgentMemberships(graph, agentId);
  const leaderMemberships = memberships.filter(
    m => (m.edge.properties.role as string) === 'leader' || (m.edge.properties.rank as number) >= 3
  );
  const bonds = getAgentBonds(graph, agentId);
  const enemyBonds = bonds.filter(b => b.sentiment < -0.3);
  // Count agreements: outgoing 'party_to' edges (agreements the agent participates in)
  const agreements = graph.getOutgoingEdges(agentId, 'party_to');

  // Relationship axis
  const interventionTracking = threadProps.interventionTracking as
    | { totalVignettes?: number; playerIntervened?: number } | undefined;
  const totalVignettes = interventionTracking?.totalVignettes ?? 0;
  const playerIntervened = interventionTracking?.playerIntervened ?? 0;
  const interventionRatio = totalVignettes > 0 ? playerIntervened / totalVignettes : 0;

  // Ambition axis
  const ambitions = getAgentAmbitions(graph, agentId);
  const activeAmbitions = ambitions.filter(a => a.status === 'active');
  const completedAmbitions = ambitions.filter(a => a.status === 'completed');
  const failedAmbitions = ambitions.filter(a => a.status === 'failed' || a.status === 'abandoned');
  const firstActiveAmbition = activeAmbitions[0];
  const ambitionCategory = firstActiveAmbition?.ambition?.properties?.category as string | undefined;

  return {
    power: {
      primaryReachLevel,
      totalTraits: traits.length,
      tierLevel,
    },
    influence: {
      factionsLed: leaderMemberships.length,
      locationsControlled: 0, // TODO: Phase 3+ will add location control tracking
      agreementsForged: agreements.length,
      enemiesMade: enemyBonds.length,
    },
    relationship: {
      threadTier: threadProps.tier,
      interventionRatio,
      attentionMode: threadProps.attentionMode ?? 'pause',
    },
    ambition: {
      activeAmbitions: activeAmbitions.length,
      completedMilestones: completedAmbitions.length,
      failedAttempts: failedAmbitions.length,
      ambitionCategory,
    },
  };
}

// ─── Beat Scheduling ────────────────────────────────────────────────

/**
 * Check if a journey beat should fire for The First this tick.
 *
 * A beat fires when the doom clock crosses a beat threshold
 * that hasn't been recorded in the beat history yet.
 */
export function shouldBeatFire(
  doomProgress: number,
  prevDoomProgress: number,
  storyPhase: CampbellianPhase,
  beatHistory: BeatOutcome[],
): { shouldFire: boolean; phase: CampbellianPhase; beatIndex: number } {
  const currentPhase = getJourneyPhase(doomProgress);

  // Check if we've entered a new phase
  if (currentPhase !== storyPhase) {
    // Phase transition — the first beat of the new phase should fire
    const beatsInNewPhase = beatHistory.filter(b => b.phase === currentPhase).length;
    const thresholds = getBeatThresholds(currentPhase);
    if (beatsInNewPhase < thresholds.length) {
      return { shouldFire: true, phase: currentPhase, beatIndex: beatsInNewPhase };
    }
  }

  // Check if we crossed a beat threshold within the current phase
  const thresholds = getBeatThresholds(currentPhase);
  const beatsInPhase = beatHistory.filter(b => b.phase === currentPhase).length;

  for (let i = beatsInPhase; i < thresholds.length; i++) {
    if (prevDoomProgress < thresholds[i] && doomProgress >= thresholds[i]) {
      return { shouldFire: true, phase: currentPhase, beatIndex: i };
    }
  }

  // Force-fire Ordeal if we've passed the threshold and it hasn't fired yet
  if (
    doomProgress >= ORDEAL_FORCE_FIRE_THRESHOLD &&
    !beatHistory.some(b => b.phase === 'ordeal') &&
    currentPhase === 'return'
  ) {
    return { shouldFire: true, phase: 'ordeal', beatIndex: 0 };
  }

  return { shouldFire: false, phase: currentPhase, beatIndex: -1 };
}

// ─── Template Selection ─────────────────────────────────────────────

/**
 * Select the best template for a beat from the available templates.
 * Filters by phase, then scores variants against the state snapshot.
 */
export function selectTemplate(
  templates: JourneyBeatTemplate[],
  phase: CampbellianPhase,
  snapshot: StateSnapshot,
  seed: number,
): { template: JourneyBeatTemplate; variant: BeatVariant } | null {
  // Filter templates valid for this phase
  const validTemplates = templates.filter(t => t.validPhases.includes(phase));

  if (validTemplates.length === 0) {
    // Try fallback template
    const fallback = templates.find(t => t.isFallback && t.validPhases.includes(phase));
    if (!fallback || fallback.variants.length === 0) return null;
    return { template: fallback, variant: fallback.variants[0] };
  }

  // Score all variants across all valid templates
  const scored: Array<{ template: JourneyBeatTemplate; variant: BeatVariant; score: number }> = [];
  for (const template of validTemplates) {
    for (const variant of template.variants) {
      const score = variant.score(snapshot);
      scored.push({ template, variant, score });
    }
  }

  if (scored.length === 0) return null;

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Use seeded RNG to pick from the top candidates (top 3 or all if fewer)
  const rng = mulberry32(seed);
  const topCount = Math.min(3, scored.length);
  const topCandidates = scored.slice(0, topCount);

  // Weighted random from top candidates
  const totalScore = topCandidates.reduce((sum, c) => sum + Math.max(c.score, 0.1), 0);
  let roll = rng() * totalScore;
  for (const candidate of topCandidates) {
    roll -= Math.max(candidate.score, 0.1);
    if (roll <= 0) {
      return { template: candidate.template, variant: candidate.variant };
    }
  }

  // Fallback to highest scorer
  return { template: scored[0].template, variant: scored[0].variant };
}

// ─── Beat Execution ─────────────────────────────────────────────────

/**
 * Build a JourneyVignetteData from a fired beat.
 * This is the data the UI needs to render the vignette modal.
 */
export function buildVignetteData(
  agentId: string,
  agentName: string,
  phase: CampbellianPhase,
  beatIndex: number,
  doomClockPercent: number,
  template: JourneyBeatTemplate,
  variant: BeatVariant,
  snapshot: StateSnapshot,
  tick: number,
): JourneyVignetteData {
  return {
    agentId,
    agentName,
    phase,
    doomClockPercent,
    beatIndex,
    templateId: template.id,
    variantKey: variant.key,
    setupProse: variant.setupProse,
    tensionProse: variant.tensionProse,
    choices: variant.choices,
    stateSnapshot: snapshot,
    isOrdeal: phase === 'ordeal',
    tick,
  };
}

// ─── Apply Beat Choice ──────────────────────────────────────────────

/**
 * Apply a beat choice's effects and record the outcome in beat history.
 * Returns the updated thread edge properties.
 */
export function applyBeatChoice(
  threadProps: ThreadEdgeProperties,
  vignetteData: JourneyVignetteData,
  choiceId: string,
): {
  updatedProps: Partial<ThreadEdgeProperties>;
  beatOutcome: BeatOutcome;
} {
  const choice = vignetteData.choices.find(c => c.id === choiceId);

  const beatOutcome: BeatOutcome = {
    phase: vignetteData.phase,
    tick: vignetteData.tick,
    templateId: vignetteData.templateId,
    variantKey: vignetteData.variantKey,
    playerChoiceId: choiceId,
    stateSnapshot: vignetteData.stateSnapshot,
  };

  const updatedBeatHistory = [...(threadProps.beatHistory ?? []), beatOutcome];
  const currentPhase = getJourneyPhase(vignetteData.doomClockPercent);

  const updatedProps: Partial<ThreadEdgeProperties> = {
    beatHistory: updatedBeatHistory,
    storyPhase: currentPhase,
  };

  // Record ordeal outcome if this is the Ordeal phase
  if (vignetteData.isOrdeal && choice?.effects.ordealOutcome) {
    updatedProps.ordealOutcome = choice.effects.ordealOutcome;
  }

  // Update intervention tracking
  if (choice) {
    const tracking = (threadProps.interventionTracking ?? {}) as Record<string, number>;
    const totalVignettes = (tracking.totalVignettes as number ?? 0) + 1;
    const playerIntervened = (tracking.playerIntervened as number ?? 0) +
      (choice.effects.interventionType !== 'withdrawn' ? 1 : 0);
    const playerWithdrew = (tracking.playerWithdrew as number ?? 0) +
      (choice.effects.interventionType === 'withdrawn' ? 1 : 0);
    const supportiveCount = (tracking.supportiveCount as number ?? 0) +
      (choice.effects.interventionType === 'supportive' ? 1 : 0);
    const coerciveCount = (tracking.coerciveCount as number ?? 0) +
      (choice.effects.interventionType === 'coercive' ? 1 : 0);

    updatedProps.interventionTracking = {
      totalVignettes,
      playerIntervened,
      playerWithdrew,
      interventionRatio: playerIntervened / totalVignettes,
      supportiveCount,
      coerciveCount,
    };
  }

  return { updatedProps, beatOutcome };
}

// ─── Orchestrator Phase ─────────────────────────────────────────────

/**
 * Journey beat phase — called from orchestrator after doom phase.
 *
 * Checks all First-position thread edges for pending beat thresholds.
 * If a beat should fire, builds a vignette and queues it.
 *
 * Returns partial GameState update (pendingVignettes, tickEvents).
 */
export function phaseJourneyBeat(
  state: GameState,
  templates: JourneyBeatTemplate[],
): Partial<GameState> {
  const { graph, ascendantId, doomClock, tick, seed } = state;
  const doomProgress = doomClock.progress;

  // Calculate previous doom progress (before this tick's advance)
  const prevDoomProgress = doomClock.currentTick > 0
    ? (doomClock.currentTick - doomClock.tickModifier) / doomClock.totalTicks
    : 0;

  // Find all First-position threads
  const threads = getThreadsFrom(graph, ascendantId);
  const firstThreads = threads.filter(
    e => (e.properties as ThreadEdgeProperties).courtPosition === 'the_first'
      && (e.properties as ThreadEdgeProperties).storyPhase != null
  );

  if (firstThreads.length === 0) {
    return {};
  }

  const newEvents: TickEvent[] = [];
  const newVignettes: PendingVignette[] = [...(state.pendingVignettes ?? [])];
  let nextEventId = state.tickEvents.length;

  for (const threadEdge of firstThreads) {
    const threadProps = threadEdge.properties as ThreadEdgeProperties;
    const agentNode = graph.getNode(threadEdge.target);
    if (!agentNode) continue;

    // Skip if this agent already has a pending vignette (waiting for player choice)
    if (newVignettes.some(v => v.data.agentId === threadEdge.target)) continue;

    const storyPhase = threadProps.storyPhase ?? 'call';
    const beatHistory = threadProps.beatHistory ?? [];

    const beatCheck = shouldBeatFire(doomProgress, prevDoomProgress, storyPhase, beatHistory);

    if (!beatCheck.shouldFire) continue;

    // Build state snapshot
    const snapshot = buildStateSnapshot(graph, threadEdge.target, threadProps);

    // Select template + variant
    const beatSeed = hashSeed(seed, threadEdge.target, beatCheck.phase, beatCheck.beatIndex);
    const selection = selectTemplate(templates, beatCheck.phase, snapshot, beatSeed);

    if (!selection) {
      // Fail-soft: no template available, skip this beat
      continue;
    }

    const { template, variant } = selection;

    // Build vignette data
    const vignetteData = buildVignetteData(
      threadEdge.target,
      agentNode.name,
      beatCheck.phase,
      beatCheck.beatIndex,
      doomProgress,
      template,
      variant,
      snapshot,
      tick,
    );

    // Queue the vignette
    const vignetteId = `vignette_${threadEdge.target}_${tick}_${beatCheck.phase}`;
    newVignettes.push({
      id: vignetteId,
      data: vignetteData,
      priority: 100, // The First always gets max priority
      queuedTick: tick,
    });

    // Update story phase on the thread edge
    const newPhase = getJourneyPhase(doomProgress);
    if (newPhase !== storyPhase) {
      // Phase transition event
      newEvents.push({
        id: `evt_${nextEventId++}`,
        tick,
        type: 'journey_phase_change',
        message: `${agentNode.name}'s journey enters the ${formatPhaseName(newPhase)} phase`,
        significance: 0.8,
        actorId: threadEdge.target,
      });

      // Update thread edge's story phase
      graph.updateEdge(threadEdge.id, {
        properties: { storyPhase: newPhase },
      });
    }

    // Journey beat event
    newEvents.push({
      id: `evt_${nextEventId++}`,
      tick,
      type: 'journey_beat',
      message: `A moment of destiny unfolds for ${agentNode.name}`,
      significance: beatCheck.phase === 'ordeal' ? 1.0 : 0.9,
      actorId: threadEdge.target,
    });

    // Emit trace
    emitTrace({
      type: 'journey_beat',
      tick,
      agentId: threadEdge.target,
      phase: beatCheck.phase,
      doomClockPercent: doomProgress,
      stateSnapshot: snapshot,
      templateId: template.id,
      variantKey: variant.key,
      playerChoiceId: '', // Filled when player makes choice
      isOrdeal: beatCheck.phase === 'ordeal',
    });
  }

  // Cap pending vignettes
  const cappedVignettes = newVignettes
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_PENDING_VIGNETTES);

  return {
    tickEvents: [...state.tickEvents, ...newEvents],
    pendingVignettes: cappedVignettes.length > 0 ? cappedVignettes : undefined,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Simple hash for deterministic seeding per beat. */
function hashSeed(gameSeed: number, agentId: string, phase: string, beatIndex: number): number {
  let hash = gameSeed;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash << 5) - hash + agentId.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < phase.length; i++) {
    hash = ((hash << 5) - hash + phase.charCodeAt(i)) | 0;
  }
  hash = ((hash << 5) - hash + beatIndex) | 0;
  return Math.abs(hash);
}

/** Format a Campbellian phase name for display. */
export function formatPhaseName(phase: CampbellianPhase): string {
  switch (phase) {
    case 'call': return 'Call';
    case 'road_of_trials': return 'Road of Trials';
    case 'crisis': return 'Crisis';
    case 'ordeal': return 'Ordeal';
    case 'return': return 'Return';
  }
}
