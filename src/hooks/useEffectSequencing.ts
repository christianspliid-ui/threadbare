import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS,
  REGISTRATION_FLIP_CONDITION_ATTACHMENT_MS,
  REGISTRATION_FLIP_ENCOUNTER_SEED_MS,
  REGISTRATION_FLIP_FACTION_MS,
  REGISTRATION_FLIP_HIDDEN_MARK_MS,
  REGISTRATION_FLIP_INTELLIGENCE_MS,
  REGISTRATION_FLIP_RECENT_EVENT_MS,
  REGISTRATION_FLIP_REPUTATION_SCORE_MS,
  REGISTRATION_FLIP_REPUTATION_TALLY_MS,
  REGISTRATION_FLIP_SPAWN_ARTIFACT_MS,
  REGISTRATION_GATE_LINE,
  REGISTRATION_GATE_PAUSE_MS,
  REGISTRATION_GATE_THRESHOLD,
  REGISTRATION_LANE_ECHO_STRIP_MS,
  REGISTRATION_LANE_HERO_PANEL_FIRST_MS,
  REGISTRATION_LANE_HERO_PANEL_SECOND_MS,
  REGISTRATION_LANE_PLAYER_ONLY_MS,
  REGISTRATION_LANE_RIGHT_RAIL_CAST_MS,
  REGISTRATION_LANE_RIGHT_RAIL_STATE_MS,
  REGISTRATION_OVERLAP_DELAY_MS,
  REGISTRATION_PULSE_RING_DECAY_MS,
} from '../data/encounter-experience-constants';

/**
 * Phase D2 — EffectRegistration sequencing controller (THR-335).
 *
 * Computes lane assignments, per-effect delays, and pulse-ring suppression
 * for a batch of aftermath effects per canonical UI spec §4.2 (lane windows)
 * and §4.3 (discipline rules).
 *
 * Plan doc: Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md §3 Phase D2
 * Spec: Docs/plans/2026-05-04-encounter-ui-canonical.md §4
 */

export type EffectKind =
  | 'intelligence'
  | 'condition_attachment'
  | 'reputation_tally'
  | 'reputation_score'
  | 'encounter_seed'
  | 'hidden_mark'
  | 'recent_event'
  | 'spawn_artifact'
  | 'faction'
  | 'archetype_drift_register';

/** Logical landing surfaces. Multiple effect kinds can share a lane. */
export type EffectLane =
  | 'hero_panel'
  | 'right_rail_cast'
  | 'right_rail_state'
  | 'echo_strip'
  | 'player_only';

export interface EffectInput {
  /** Stable identifier for keying / settle callbacks. */
  readonly id: string;
  readonly kind: EffectKind;
}

export interface SequencedEffect extends EffectInput {
  /** Delay (ms) before this effect's animation starts, relative to resolution. */
  readonly delay: number;
  /** Lane assigned per §4.2. */
  readonly lane: EffectLane;
  /** Order index in the resolved sequence (0-based). */
  readonly order: number;
  /** Whether the pulse ring should fire (§4.3 #2 suppression). */
  readonly enablePulseRing: boolean;
  /** True if this effect waits for the second-breath gate (§4.3 #4). */
  readonly gated: boolean;
}

export interface EffectSequencingResult {
  /** Effects ordered by start time, with per-effect delays + lane + flags. */
  readonly sequenced: readonly SequencedEffect[];
  /** Prose-log gate-line when > 5 effects fire from one resolution; null otherwise. */
  readonly gateLine: string | null;
  /** Whether the second-breath gate is active (effects 6+ are gated). */
  readonly hasSecondBreathGate: boolean;
  /** Mark a single effect as fully landed. Audio cue (post-v1) only fires for first call. */
  readonly onEffectSettled: (effectId: string) => void;
  /** True after the *first* effect's settle has fired in this batch. */
  readonly firstSettleFired: boolean;
  /** Reset the controller (e.g. on next encounter resolution). */
  readonly reset: () => void;
}

const FLIP_DURATION_MS: Readonly<Record<EffectKind, number>> = {
  intelligence: REGISTRATION_FLIP_INTELLIGENCE_MS,
  condition_attachment: REGISTRATION_FLIP_CONDITION_ATTACHMENT_MS,
  reputation_tally: REGISTRATION_FLIP_REPUTATION_TALLY_MS,
  reputation_score: REGISTRATION_FLIP_REPUTATION_SCORE_MS,
  encounter_seed: REGISTRATION_FLIP_ENCOUNTER_SEED_MS,
  hidden_mark: REGISTRATION_FLIP_HIDDEN_MARK_MS,
  recent_event: REGISTRATION_FLIP_RECENT_EVENT_MS,
  spawn_artifact: REGISTRATION_FLIP_SPAWN_ARTIFACT_MS,
  faction: REGISTRATION_FLIP_FACTION_MS,
  archetype_drift_register: REGISTRATION_FLIP_ARCHETYPE_DRIFT_MS,
};

const KIND_TO_LANE: Readonly<Record<EffectKind, EffectLane>> = {
  intelligence: 'hero_panel',
  condition_attachment: 'hero_panel',
  spawn_artifact: 'hero_panel',
  archetype_drift_register: 'hero_panel',
  encounter_seed: 'hero_panel',
  reputation_tally: 'right_rail_cast',
  reputation_score: 'right_rail_cast',
  faction: 'right_rail_state',
  recent_event: 'echo_strip',
  hidden_mark: 'player_only',
};

const LANE_START_MS: Readonly<Record<EffectLane, number>> = {
  hero_panel: REGISTRATION_LANE_HERO_PANEL_FIRST_MS,
  right_rail_cast: REGISTRATION_LANE_RIGHT_RAIL_CAST_MS,
  right_rail_state: REGISTRATION_LANE_RIGHT_RAIL_STATE_MS,
  echo_strip: REGISTRATION_LANE_ECHO_STRIP_MS,
  player_only: REGISTRATION_LANE_PLAYER_ONLY_MS,
};

/**
 * Lane priority for the §4.2 ordering: tightest scope first, widest last.
 * Hero panel < cast < state < echo < player-only. Lower number = earlier.
 */
const LANE_ORDER: Readonly<Record<EffectLane, number>> = {
  hero_panel: 0,
  right_rail_cast: 1,
  right_rail_state: 2,
  echo_strip: 3,
  player_only: 4,
};

/**
 * Stable schedule computation. Pure function — easy to unit-test.
 * Effects are sorted by lane order, then by their input order. Within a lane,
 * delays cascade so successive card-flips don't overlap > 50% (rule §4.3 #1).
 */
export function computeSequencedEffects(
  effects: readonly EffectInput[],
): { sequenced: readonly SequencedEffect[]; gateLine: string | null } {
  if (effects.length === 0) {
    return { sequenced: [], gateLine: null };
  }

  const decorated = effects.map((e, idx) => ({
    effect: e,
    inputOrder: idx,
    lane: KIND_TO_LANE[e.kind],
  }));
  decorated.sort((a, b) => {
    const laneDelta = LANE_ORDER[a.lane] - LANE_ORDER[b.lane];
    if (laneDelta !== 0) return laneDelta;
    return a.inputOrder - b.inputOrder;
  });

  const lastFlipEndByLane = new Map<EffectLane, number>();
  const lastPulseEndByLane = new Map<EffectLane, number>();

  const sequenced: SequencedEffect[] = [];
  let heroPanelLandings = 0;

  decorated.forEach(({ effect, lane }, order) => {
    const flipDuration = FLIP_DURATION_MS[effect.kind];
    const laneStart = LANE_START_MS[lane];

    // Hero panel allows two registration windows per §4.2.
    let baseStart = laneStart;
    if (lane === 'hero_panel' && heroPanelLandings >= 1) {
      baseStart = Math.max(baseStart, REGISTRATION_LANE_HERO_PANEL_SECOND_MS);
    }
    if (lane === 'hero_panel') heroPanelLandings += 1;

    // Discipline rule §4.3 #1: prevent back-to-back overlaps > 50% in the same lane.
    const previousFlipEnd = lastFlipEndByLane.get(lane) ?? 0;
    const overlapHalfPoint = previousFlipEnd - flipDuration / 2;
    let delay = baseStart;
    if (delay < overlapHalfPoint) {
      delay = previousFlipEnd - flipDuration / 2 + REGISTRATION_OVERLAP_DELAY_MS;
    }

    // Discipline rule §4.3 #2: pulse rings never stack on the same lane within decay.
    const previousPulseEnd = lastPulseEndByLane.get(lane) ?? 0;
    const pulseStillActive = delay < previousPulseEnd;
    const enablePulseRing = !pulseStillActive;

    // Discipline rule §4.3 #4: second-breath gate after 5 effects.
    const gated = order >= REGISTRATION_GATE_THRESHOLD;
    const finalDelay = gated
      ? delay + REGISTRATION_GATE_PAUSE_MS
      : delay;

    const flipEnd = finalDelay + flipDuration;
    lastFlipEndByLane.set(lane, flipEnd);
    if (enablePulseRing) {
      lastPulseEndByLane.set(lane, finalDelay + REGISTRATION_PULSE_RING_DECAY_MS);
    }

    sequenced.push({
      id: effect.id,
      kind: effect.kind,
      delay: finalDelay,
      lane,
      order,
      enablePulseRing,
      gated,
    });
  });

  const gateLine =
    effects.length > REGISTRATION_GATE_THRESHOLD ? REGISTRATION_GATE_LINE : null;

  return { sequenced, gateLine };
}

/**
 * Hook form: same schedule, plus settle tracking + onEffectSettled callback.
 * Callers consume {sequenced} to render landings, pass {onEffectSettled} into
 * each EffectRegistration component, and read {firstSettleFired} for the
 * post-v1 audio H1 first-registration gate.
 */
export function useEffectSequencing(
  effects: readonly EffectInput[],
): EffectSequencingResult {
  const { sequenced, gateLine } = useMemo(
    () => computeSequencedEffects(effects),
    [effects],
  );

  const settledIdsRef = useRef<Set<string>>(new Set());
  const [firstSettleFired, setFirstSettleFired] = useState(false);

  const reset = useCallback(() => {
    settledIdsRef.current = new Set();
    setFirstSettleFired(false);
  }, []);

  // Reset settle tracking when the effects list identity changes.
  useEffect(() => {
    settledIdsRef.current = new Set();
    setFirstSettleFired(false);
  }, [effects]);

  const onEffectSettled = useCallback((effectId: string) => {
    if (settledIdsRef.current.has(effectId)) return;
    settledIdsRef.current.add(effectId);
    if (settledIdsRef.current.size === 1) {
      setFirstSettleFired(true);
    }
  }, []);

  return {
    sequenced,
    gateLine,
    hasSecondBreathGate: gateLine !== null,
    onEffectSettled,
    firstSettleFired,
    reset,
  };
}
