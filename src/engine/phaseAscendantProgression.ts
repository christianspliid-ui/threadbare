/**
 * Ascendant Progression — god-side capability growth (THR-613, plan §3, Slice 1).
 *
 * Two responsibilities, both engine substrate:
 *
 *  1. `accruePlayerReachPractice` — called from the unified-action resolution loop
 *     when the player (ascendant) resolves an action carrying an in-domain `reach`.
 *     It grows `ascendant.properties.reachPractice[reach]`, which `computeRawScore`
 *     folds into Domain Capability through the same sigmoid the agents use (one
 *     source of truth, no parallel XP number — load-bearing: "ascendants use the same
 *     prerequisite system as agents").
 *
 *  2. `phaseAscendantProgression` — a leaf tick phase that runs immediately before the
 *     Ascendant Beat Director. It derives the ascendant's live tier per permanent
 *     reach, compares against `reachTierSnapshot`, and on an upward crossing sets the
 *     Director's `pending` slot to a Deepening beat. Because it runs first and the
 *     Director skips when `pending` is set, a Deepening beat naturally preempts the
 *     cadence draw for that tick (highest progression priority) — with zero change to
 *     the Director itself (mutex-safe with THR-611's beat-enqueue work).
 *
 * Fail-soft throughout (NFP #4): missing ascendant / affinities / beat state → no-op.
 * Deterministic (NFP #3): pure derivation from graph state; no PRNG.
 */

import type { GameState } from '../types/gameState';
import type { ReachDomain } from '../types/traits';
import type { AscendantProperties } from '../types/influence';
import type { PendingBeat, GodProgressionState } from '../types/ascendantBeat';
import {
  createInitialGodProgression,
  rungMarks,
  rungForMarks,
  spineDone,
  rungGiftsFor,
  parseRungGiftBeatId,
  rungGiftDefinition,
  isRungOpeningGift,
} from './godProgression';
import { resolveReachSignatureGrant } from './ascendantBeat';
import { getUnifiedTemplateById } from '../data/unified-action-templates';
import { RUNG_GIFT_SPACING, RUNG_BEAT_PRESENTATION } from '../data/god-progression-content';
import type { ChronicleEntry } from '../types/narrative';
import type { SphereName } from '../types/index';
import { computeReachShare, computeTier } from './domainCapability';
import { rankedAffinityReaches } from './reachPractice';
import { emitTrace } from './traceBuffer';
import {
  DEEPENING_BEAT_MAX_PER_TICK,
  MILESTONE_SOURCES_FOR_BEAT,
  MILESTONE_FLOWERING_FOR_BEAT,
  MILESTONE_SOURCE_BEAT_ID,
  MILESTONE_COMPANY_BEAT_ID,
  MILESTONE_GATHERING_BEAT_ID,
  MILESTONE_EMPTY_ROAD_BEAT_ID,
  MILESTONE_GUTTERING_THREAD_BEAT_ID,
  WELLSPRING_MILESTONE_BEAT_ID,
  WELLSPRING_MILESTONE_TICKS_AFTER_BOND,
  MILESTONE_HELD_GROUND_BEAT_ID,
  MILESTONE_HELD_GROUND_FLOWERING,
  deepeningBeatIdForReach,
} from '../data/player-progression';
import { deepeningChronicleProse } from '../data/ascendant-deepening-beats';
import { milestoneChronicleProse, getMilestoneBeatById } from '../data/ascendant-milestone-beats';
import { resolveDoomWokeAtTick } from './doomClock';
import { allGrantsHeld } from './beatGrantsHeld';
import { countControlledSources, heldSources } from './essenceSources';
import {
  getAllGroups, isGroupThreaded, isAgentGone, getFormerGroupMembers,
} from './groups/groupQueries';
import { DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK } from '../data/group-constants';
import { isBrokenMortal } from './brokenState';

type EmitInput = Parameters<typeof emitTrace>[0];

// THR-1811: moved to `reachPractice.ts` (breaks a module cycle); re-exported for existing importers.
export { accruePlayerReachPractice, rankedAffinityReaches } from './reachPractice';

/**
 * Tick phase: detect god-side tier crossings and enqueue a Deepening beat.
 * Returns a `Partial<GameState>` merged by the orchestrator; `{}` when there is
 * nothing to enqueue. Mutates the ascendant's `reachTierSnapshot` in place (property
 * bag on the node) as the crossing bookkeeping.
 */
export function phaseAscendantProgression(state: GameState): Partial<GameState> {
  const graph = state.graph;
  const ascId = state.ascendantId;
  const node = graph.getNode(ascId);
  if (!node) return {}; // fail-soft: no ascendant
  const props = node.properties as unknown as AscendantProperties;
  const reaches = rankedAffinityReaches(props);
  if (reaches.length === 0) return {}; // fail-soft: no permanent reaches

  const beats = state.ascendantBeats;
  const turn = state.tick;

  // A Deepening beat may be enqueued only once the onboarding spine is exhausted and
  // no beat is already pending — so it never interleaves the scripted opening and
  // honours the max-one-pending invariant.
  const canEnqueue = !!beats && beats.spineCursor === -1 && !beats.pending;

  const snapshot: Partial<Record<ReachDomain, number>> = { ...(props.reachTierSnapshot ?? {}) };
  let snapshotChanged = false;
  let pending: PendingBeat | null = null;
  let enqueuedThisTick = 0;
  // Chronicle lines written 1:1 with each enqueued Deepening beat (plan §4.3). The god's
  // primary sphere colours the entry; fall back to 'order' when the alignment is absent
  // (fail-soft — a chronicle line must never crash the phase).
  const newChronicle: ChronicleEntry[] = [];
  const primarySphere: SphereName = props.sphereAlignment?.primary ?? 'order';

  for (const reach of reaches) {
    // The god's tier reads the reach share (THR-1580): one tier per 4 raw across the
    // mortal range, so Deepening beats arrive evenly and a tier-10 god stands where a
    // raw-40 mortal master does (the pre-refit curve hit tier 10 at raw ~15.5).
    const cap = computeReachShare(graph, ascId, reach);
    const tier = computeTier(cap);
    const prev = snapshot[reach];

    if (prev === undefined) {
      // First run for this reach: seed from the current tier, no spurious beat.
      snapshot[reach] = tier;
      snapshotChanged = true;
      continue;
    }

    if (tier > prev && canEnqueue && enqueuedThisTick < DEEPENING_BEAT_MAX_PER_TICK) {
      // Advance the snapshot one step and enqueue the matching Deepening beat.
      const toTier = prev + 1;
      snapshot[reach] = toTier;
      snapshotChanged = true;
      enqueuedThisTick += 1;
      pending = {
        beatId: deepeningBeatIdForReach(reach),
        kind: 'deepening',
        offeredTurn: turn,
        boundNodeIds: [ascId],
        trigger: { kind: 'turn', minTurn: turn },
      };
      emitTrace({
        category: 'ascendant.progression.tier_up',
        tick: turn,
        turn,
        reach,
        fromTier: prev,
        toTier,
        summary: `Domain Capability in ${reach} rose ${prev} → ${toTier}`,
      } as unknown as EmitInput);
      emitTrace({
        category: 'ascendant.progression.deepening_enqueued',
        tick: turn,
        turn,
        reach,
        beatId: pending.beatId,
        summary: `Deepening beat enqueued: ${pending.beatId}`,
      } as unknown as EmitInput);
      // Write the run's book: one chronicle line per tier crossing (plan §4.3), reach-named
      // and sphere-coloured, alongside the Deepening vignette the beat will present.
      newChronicle.push({
        id: `deepening-${reach}-${turn}`,
        tier: 'chronicle',
        title: `A Deepening in ${reach.charAt(0).toUpperCase() + reach.slice(1)}`,
        prose: deepeningChronicleProse(reach),
        promptContext: {
          actors: [ascId],
          location: '',
          sphere: primarySphere,
          mood: 'reverent',
        },
        tick: turn,
      });
    }
    // If a crossing is detected but we cannot enqueue this tick (pending occupied,
    // spine active, or the per-tick cap is hit) the snapshot is left unchanged, so the
    // same crossing is re-detected next tick — no beat is lost and none double-fires.
  }

  // Axis B (breadth): the essence-source milestone (plan §4.2). Checked only when a
  // Deepening did not take the slot this tick — a tier crossing is the rarer, more
  // personal moment, so it wins the tick and the milestone re-detects on the next one
  // (it is threshold-based, not edge-based, so waiting loses nothing).
  const firedMilestones: string[] = [...(props.milestoneBeatsFired ?? [])];

  /**
   * THR-1747: enqueue a grant-bearing milestone, or — when the god already holds every
   * card it grants (an old save that drew the retired pool beat, a showcase that
   * pre-grants) — record it fired without offering it (THR-647: never offer a held card).
   * Returns true when the beat took the pending slot.
   */
  const offerOrSkipGrantMilestone = (
    beatId: string,
    title: string,
    detail: { bondTick?: number; sourceCount?: number; floweringCount?: number },
    why: string,
  ): boolean => {
    const def = getMilestoneBeatById(beatId);
    const held = def ? allGrantsHeld(def, state) : false;
    firedMilestones.push(beatId);
    node.properties.milestoneBeatsFired = firedMilestones;
    emitTrace({
      category: 'ascendant.progression.milestone_enqueued',
      tick: turn,
      turn,
      beatId,
      ...detail,
      ...(held ? { skipped: 'all_grants_held' as const } : {}),
      summary: held
        ? `Milestone beat ${beatId} recorded without offering it — every card it grants is already held (${why})`
        : `Milestone beat enqueued: ${beatId} (${why})`,
    });
    if (held) return false;
    pending = {
      beatId,
      kind: 'milestone',
      offeredTurn: turn,
      boundNodeIds: [ascId],
      trigger: { kind: 'turn', minTurn: turn },
    };
    newChronicle.push({
      id: `milestone-${beatId}-${turn}`,
      tier: 'chronicle',
      title,
      prose: milestoneChronicleProse(beatId),
      promptContext: {
        actors: [ascId],
        location: '',
        sphere: primarySphere,
        mood: 'reverent',
      },
      tick: turn,
    });
    return true;
  };

  // THR-1747: the Wellspring milestone — the five source verbs at a fixed moment after the
  // bond, ahead of the source milestone (which needs sources those verbs win). The bond is
  // read through `resolveDoomWokeAtTick`, never the raw field: an old save with no
  // `wokeAtTick` reads as bonded at tick 0 and is still offered the verbs it can no longer
  // draw from the pool; `null` (the clock still sleeps) never fires. Threshold-based, so a
  // pending beat holding the slot only delays it.
  //
  // Unlike every other milestone it does NOT wait for the onboarding spine to finish.
  // The spine's five gifts are turn-scheduled out to tick ~145 (`SPINE_TRIGGER_TURNS`),
  // and gating on `spineCursor === -1` put the Wellspring ~145 ticks after the bond on
  // seeds 42 / 7 / 1337 — a miss of the plan's "offered by tick 60" predicate (Done-when 3,
  // whose remedy names the spine as in scope). It takes an empty slot between two spine
  // gifts instead; the next gift waits for it like it waits for any pending beat.
  const canEnqueueDuringSpine = !!beats && !beats.pending;
  if (canEnqueueDuringSpine && !pending && !firedMilestones.includes(WELLSPRING_MILESTONE_BEAT_ID)) {
    const woke = resolveDoomWokeAtTick(state.doomClock);
    if (woke !== null && turn >= woke + WELLSPRING_MILESTONE_TICKS_AFTER_BOND) {
      offerOrSkipGrantMilestone(
        WELLSPRING_MILESTONE_BEAT_ID,
        'The Wellspring',
        { bondTick: woke },
        `${turn - woke} ticks after the bond`,
      );
    }
  }
  if (canEnqueue && !pending && !firedMilestones.includes(MILESTONE_SOURCE_BEAT_ID)) {
    const { total, flowering } = countControlledSources(graph, ascId);
    if (total >= MILESTONE_SOURCES_FOR_BEAT || flowering >= MILESTONE_FLOWERING_FOR_BEAT) {
      pending = {
        beatId: MILESTONE_SOURCE_BEAT_ID,
        kind: 'milestone',
        offeredTurn: turn,
        boundNodeIds: [ascId],
        trigger: { kind: 'turn', minTurn: turn },
      };
      // Recorded at enqueue (not on resolution): a milestone names a threshold crossed
      // once, so it must not re-fire if the beat is dismissed or the count later dips.
      firedMilestones.push(MILESTONE_SOURCE_BEAT_ID);
      node.properties.milestoneBeatsFired = firedMilestones;
      emitTrace({
        category: 'ascendant.progression.milestone_enqueued',
        tick: turn,
        turn,
        beatId: MILESTONE_SOURCE_BEAT_ID,
        sourceCount: total,
        floweringCount: flowering,
        summary: `Milestone beat enqueued: ${MILESTONE_SOURCE_BEAT_ID} (${total} source(s), ${flowering} flowering)`,
      } as unknown as EmitInput);
      newChronicle.push({
        id: `milestone-${MILESTONE_SOURCE_BEAT_ID}-${turn}`,
        tier: 'chronicle',
        title: 'A Wellspring',
        prose: milestoneChronicleProse(MILESTONE_SOURCE_BEAT_ID),
        promptContext: {
          actors: [ascId],
          location: '',
          sphere: primarySphere,
          mood: 'reverent',
        },
        tick: turn,
      });
    }
  }

  // THR-1747: the held-ground milestone — MILESTONE_HELD_GROUND_FLOWERING flowering
  // sources grant the four held-ground income cards that shipped with no grant path.
  // Same one-per-tick discipline; skipped (not offered) when all four are already held.
  // Counts held sources only (heldSources skips the home seat), so the milestone agrees
  // with the Covenants list and the upkeep charge: a flowering seat is not held ground.
  if (canEnqueue && !pending && !firedMilestones.includes(MILESTONE_HELD_GROUND_BEAT_ID)) {
    const held = heldSources(graph, ascId);
    const total = held.length;
    const flowering = held.filter(({ src }) => src.tier === 'flowering').length;
    if (flowering >= MILESTONE_HELD_GROUND_FLOWERING) {
      offerOrSkipGrantMilestone(
        MILESTONE_HELD_GROUND_BEAT_ID,
        'Held Ground',
        { sourceCount: total, floweringCount: flowering },
        `${flowering} flowering source(s)`,
      );
    }
  }

  // THR-74: the company milestone — the first threaded company gathers on the road.
  // Same one-per-tick discipline as the source milestone above: gated on `!pending`, so a
  // Deepening or the source milestone wins the slot and this re-detects next tick (the
  // condition is a standing state, not an edge, so waiting loses nothing). The scan is
  // cheap — a handful of company nodes — and stops entirely once the beat has fired
  // (dedup via `milestoneBeatsFired`), so it costs nothing for the rest of the run.
  if (canEnqueue && !pending && !firedMilestones.includes(MILESTONE_COMPANY_BEAT_ID)) {
    const hasThreadedCompany = getAllGroups(graph).some(
      g =>
        (g.properties as Record<string, unknown>).groupStatus !== 'disbanded' &&
        isGroupThreaded(graph, g.id, ascId),
    );
    if (hasThreadedCompany) {
      pending = {
        beatId: MILESTONE_COMPANY_BEAT_ID,
        kind: 'milestone',
        offeredTurn: turn,
        boundNodeIds: [ascId],
        trigger: { kind: 'turn', minTurn: turn },
      };
      firedMilestones.push(MILESTONE_COMPANY_BEAT_ID);
      node.properties.milestoneBeatsFired = firedMilestones;
      emitTrace({
        category: 'ascendant.progression.milestone_enqueued',
        tick: turn,
        turn,
        beatId: MILESTONE_COMPANY_BEAT_ID,
        summary: `Milestone beat enqueued: ${MILESTONE_COMPANY_BEAT_ID} (first threaded company)`,
      } as unknown as EmitInput);
      newChronicle.push({
        id: `milestone-${MILESTONE_COMPANY_BEAT_ID}-${turn}`,
        tier: 'chronicle',
        title: 'A Company',
        prose: milestoneChronicleProse(MILESTONE_COMPANY_BEAT_ID),
        promptContext: {
          actors: [ascId],
          location: '',
          sphere: primarySphere,
          mood: 'reverent',
        },
        tick: turn,
      });
    }
  }

  // THR-74: the gathering-bonds milestone — the first time the ascendant threads
  // DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK living mortals, unlocking Draw Together. Same
  // one-per-tick discipline (`!pending`, so the company milestone above wins the slot when
  // both fire the same tick and this re-detects next tick). The scan counts outgoing
  // `thread` edges to living individuals and stops once the beat has fired (dedup via
  // `milestoneBeatsFired`), so it costs nothing for the rest of the run.
  if (canEnqueue && !pending && !firedMilestones.includes(MILESTONE_GATHERING_BEAT_ID)) {
    let threadedLiving = 0;
    for (const edge of graph.getOutgoingEdges(ascId, 'thread')) {
      const target = graph.getNode(edge.target);
      if (!target || target.properties.actorType !== 'individual') continue;
      if (isAgentGone(target)) continue;
      threadedLiving++;
      if (threadedLiving >= DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK) break;
    }
    if (threadedLiving >= DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK) {
      pending = {
        beatId: MILESTONE_GATHERING_BEAT_ID,
        kind: 'milestone',
        offeredTurn: turn,
        boundNodeIds: [ascId],
        trigger: { kind: 'turn', minTurn: turn },
      };
      firedMilestones.push(MILESTONE_GATHERING_BEAT_ID);
      node.properties.milestoneBeatsFired = firedMilestones;
      emitTrace({
        category: 'ascendant.progression.milestone_enqueued',
        tick: turn,
        turn,
        beatId: MILESTONE_GATHERING_BEAT_ID,
        summary: `Milestone beat enqueued: ${MILESTONE_GATHERING_BEAT_ID} (${DRAW_TOGETHER_MIN_THREADED_FOR_UNLOCK}+ threaded mortals)`,
      } as unknown as EmitInput);
      newChronicle.push({
        id: `milestone-${MILESTONE_GATHERING_BEAT_ID}-${turn}`,
        tier: 'chronicle',
        title: 'Scattered Threads',
        prose: milestoneChronicleProse(MILESTONE_GATHERING_BEAT_ID),
        promptContext: {
          actors: [ascId],
          location: '',
          sphere: primarySphere,
          mood: 'reverent',
        },
        tick: turn,
      });
    }
  }

  // THR-732: the empty-road milestone — the first time a company the ascendant was
  // bound to has ended, unlocking Reunite + Sunder. Same one-per-tick discipline as
  // the two above. Threading is read through the company's *former* members, because
  // dissolution closes every `member_of` edge: `isGroupThreaded` walks live membership
  // and would see an empty roster on exactly the nodes this milestone is about.
  if (canEnqueue && !pending && !firedMilestones.includes(MILESTONE_EMPTY_ROAD_BEAT_ID)) {
    const hasEndedThreadedCompany = getAllGroups(graph).some(g => {
      if ((g.properties as Record<string, unknown>).groupStatus !== 'disbanded') return false;
      return getFormerGroupMembers(graph, g.id).some(m =>
        graph.getIncomingEdges(m.id, 'thread').some(e => e.source === ascId),
      );
    });
    if (hasEndedThreadedCompany) {
      pending = {
        beatId: MILESTONE_EMPTY_ROAD_BEAT_ID,
        kind: 'milestone',
        offeredTurn: turn,
        boundNodeIds: [ascId],
        trigger: { kind: 'turn', minTurn: turn },
      };
      firedMilestones.push(MILESTONE_EMPTY_ROAD_BEAT_ID);
      node.properties.milestoneBeatsFired = firedMilestones;
      emitTrace({
        category: 'ascendant.progression.milestone_enqueued',
        tick: turn,
        turn,
        beatId: MILESTONE_EMPTY_ROAD_BEAT_ID,
        summary: `Milestone beat enqueued: ${MILESTONE_EMPTY_ROAD_BEAT_ID} (first threaded company disbanded)`,
      } as unknown as EmitInput);
      newChronicle.push({
        id: `milestone-${MILESTONE_EMPTY_ROAD_BEAT_ID}-${turn}`,
        tier: 'chronicle',
        title: 'An Empty Road',
        prose: milestoneChronicleProse(MILESTONE_EMPTY_ROAD_BEAT_ID),
        promptContext: {
          actors: [ascId],
          location: '',
          sphere: primarySphere,
          mood: 'reverent',
        },
        tick: turn,
      });
    }
  }

  // THR-773: the guttering-thread milestone — the first time a mortal the ascendant
  // is threaded to is worn into the broken state, unlocking Rekindle the Thread.
  // Same one-per-tick discipline as the three above. The predicate reads
  // `isBrokenMortal` rather than the raw threshold so the beat fires on the same
  // state the card actually answers — and deliberately *not* on
  // `BROKEN_GATE_ENABLED`, which gates the state's consequences, not its existence:
  // the mortal is worn out whether or not the candidacy gate is live, so the god
  // should be offered the mercy either way.
  if (canEnqueue && !pending && !firedMilestones.includes(MILESTONE_GUTTERING_THREAD_BEAT_ID)) {
    const hasBrokenThreadedMortal = graph.getOutgoingEdges(ascId, 'thread').some(e => {
      const mortal = graph.getNode(e.target);
      return mortal?.type === 'actor' && isBrokenMortal(mortal);
    });
    if (hasBrokenThreadedMortal) {
      pending = {
        beatId: MILESTONE_GUTTERING_THREAD_BEAT_ID,
        kind: 'milestone',
        offeredTurn: turn,
        boundNodeIds: [ascId],
        trigger: { kind: 'turn', minTurn: turn },
      };
      firedMilestones.push(MILESTONE_GUTTERING_THREAD_BEAT_ID);
      node.properties.milestoneBeatsFired = firedMilestones;
      emitTrace({
        category: 'ascendant.progression.milestone_enqueued',
        tick: turn,
        turn,
        beatId: MILESTONE_GUTTERING_THREAD_BEAT_ID,
        summary: `Milestone beat enqueued: ${MILESTONE_GUTTERING_THREAD_BEAT_ID} (first threaded mortal broken)`,
      } as unknown as EmitInput);
      newChronicle.push({
        id: `milestone-${MILESTONE_GUTTERING_THREAD_BEAT_ID}-${turn}`,
        tier: 'chronicle',
        title: 'A Guttering Thread',
        prose: milestoneChronicleProse(MILESTONE_GUTTERING_THREAD_BEAT_ID),
        promptContext: {
          actors: [ascId],
          location: '',
          sphere: primarySphere,
          mood: 'reverent',
        },
        tick: turn,
      });
    }
  }

  // THR-1811: the card ladder. Rungs open on summed attunement marks; each opening queues
  // its key gifts, which take an empty slot one per RUNG_GIFT_SPACING. Checked after the
  // milestones (they name rarer moments) and before the Director, so a key gift wins an
  // empty slot over an offering.
  const ladder = stepGodProgression(state, canEnqueue && !pending, turn);
  if (ladder.pending) {
    pending = ladder.pending;
    if (ladder.chronicle) {
      newChronicle.push({
        ...ladder.chronicle,
        promptContext: { actors: [ascId], location: '', sphere: primarySphere, mood: 'reverent' },
      });
    }
  }

  if (snapshotChanged) {
    node.properties.reachTierSnapshot = snapshot;
  }
  const patch: Partial<GameState> = {};
  if (ladder.godProgression) patch.godProgression = ladder.godProgression;
  if (pending && beats) {
    patch.ascendantBeats = { ...beats, pending, lastBeatTurn: turn };
  }
  if (newChronicle.length > 0) {
    // Fail-soft (NFP #4): a legacy save / minimal fixture may lack the array.
    patch.chronicleEntries = [...(state.chronicleEntries ?? []), ...newChronicle];
  }
  return patch;
}

/**
 * THR-1811 — one tick of the card ladder.
 *
 *  1. Open every rung the summed marks now reach (the stored rung only rises), tracing
 *     `progression.rung_opened` and queueing that rung's key gifts.
 *  2. When `canOffer` and `turn ≥ nextRungGiftTick`, pop the queue head into the slot as a
 *     `rung_gift` beat. A held card (or a signature already held / unresolvable) is skipped
 *     at once and the next one taken (THR-647: never offer a held card).
 *
 * Returns the next `godProgression` only when it changed. Fail-soft: any error → no change.
 */
function stepGodProgression(
  state: GameState,
  canOffer: boolean,
  turn: number,
): {
  godProgression?: GodProgressionState;
  pending?: PendingBeat;
  chronicle?: Omit<ChronicleEntry, 'promptContext'>;
} {
  try {
    const prev = state.godProgression ?? createInitialGodProgression();
    let gp: GodProgressionState = prev;
    const marks = rungMarks(state);
    const target = rungForMarks(marks, spineDone(state));
    while (gp.rung < target) {
      const rung = gp.rung + 1;
      const gifts = rungGiftsFor(rung);
      gp = {
        ...gp,
        rung,
        rungOpenedTick: { ...gp.rungOpenedTick, [rung]: turn },
        rungGiftQueue: [...gp.rungGiftQueue, ...gifts],
      };
      emitTrace({
        category: 'progression.rung_opened',
        tick: turn,
        rung,
        rungMarks: marks,
        queuedGiftIds: gifts,
        summary: `progression.rung_opened: rung ${rung} (${marks} marks), ${gifts.length} key gift(s) queued`,
      });
    }

    let pending: PendingBeat | undefined;
    let chronicle: Omit<ChronicleEntry, 'promptContext'> | undefined;
    if (canOffer && gp.rungGiftQueue.length > 0 && turn >= gp.nextRungGiftTick) {
      const queue = [...gp.rungGiftQueue];
      const held = new Set(state.unlockedActionIds ?? []);
      while (queue.length > 0 && !pending) {
        const beatId = queue.shift()!;
        const parsed = parseRungGiftBeatId(beatId);
        const def = rungGiftDefinition(beatId);
        const cardId = def?.grantsReachSignature
          ? resolveReachSignatureGrant(state, def.grantsReachSignature)
          : def?.grantsActionIds?.[0] ?? null;
        const missing = !parsed || !cardId || (!def?.grantsReachSignature && !getUnifiedTemplateById(cardId));
        const skip: 'held' | 'missing' | null = missing ? 'missing' : held.has(cardId) ? 'held' : null;
        emitTrace({
          category: 'progression.rung_gift_offered',
          tick: turn,
          rung: parsed?.rung ?? 0,
          actionId: cardId ?? beatId,
          ...(skip ? { skipped: skip } : {}),
          summary: skip
            ? `progression.rung_gift_offered: ${beatId} skipped (${skip})`
            : `progression.rung_gift_offered: ${beatId} → ${cardId}`,
        });
        if (skip) continue;
        pending = {
          beatId,
          kind: 'rung_gift',
          offeredTurn: turn,
          boundNodeIds: [state.ascendantId],
          trigger: { kind: 'turn', minTurn: turn },
        };
        if (isRungOpeningGift(beatId)) {
          const words = RUNG_BEAT_PRESENTATION[parsed!.rung];
          if (words) {
            chronicle = { id: `rung-${parsed!.rung}-${turn}`, tier: 'chronicle', title: words.title, prose: words.prose, tick: turn };
          }
        }
      }
      gp = {
        ...gp,
        rungGiftQueue: queue,
        nextRungGiftTick: pending ? turn + RUNG_GIFT_SPACING : gp.nextRungGiftTick,
      };
    }
    return {
      ...(gp !== prev || !state.godProgression ? { godProgression: gp } : {}),
      ...(pending ? { pending } : {}),
      ...(chronicle ? { chronicle } : {}),
    };
  } catch (err) {
    // Fail-soft (NFP #4): no ladder change this tick; the next tick re-detects.
    console.warn(`[stepGodProgression] error (turn ${turn}): ${err instanceof Error ? err.message : String(err)}`);
    return {};
  }
}

/** One reach's live progression readout — for the debug bridge + (Slice 3+) UI. */
export interface AscendantReachProgress {
  reach: ReachDomain;
  isPrimary: boolean;
  rawPractice: number;
  /** Reach share (0–1, THR-1580) — the scale `tier` is read from. */
  capability: number;
  tier: number;
  snapshotTier: number | null;
  pendingDeepening: boolean;
}

/**
 * Pure read of the ascendant's progression state (THR-613 §3.6 / §5.E). Independent
 * of tracing; safe to call from `__DEBUG.getAscendantProgression()`.
 */
export function getAscendantProgress(state: GameState): {
  reaches: AscendantReachProgress[];
  pendingBeatId: string | null;
} | null {
  const graph = state.graph;
  const node = graph.getNode(state.ascendantId);
  if (!node) return null;
  const props = node.properties as unknown as AscendantProperties;
  const ranked = rankedAffinityReaches(props);
  const snapshot = props.reachTierSnapshot ?? {};
  const practice = props.reachPractice ?? {};
  const pendingBeatId = state.ascendantBeats?.pending?.beatId ?? null;
  const reaches: AscendantReachProgress[] = ranked.map((reach, i) => {
    // Same reach share as the phase's tier read (THR-1580) — the bar and the beat agree.
    const capability = computeReachShare(graph, state.ascendantId, reach);
    return {
      reach,
      isPrimary: i === 0,
      rawPractice: practice[reach] ?? 0,
      capability,
      tier: computeTier(capability),
      snapshotTier: snapshot[reach] ?? null,
      pendingDeepening:
        pendingBeatId === deepeningBeatIdForReach(reach),
    };
  });
  return { reaches, pendingBeatId };
}
