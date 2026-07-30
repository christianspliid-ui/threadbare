/**
 * buildMeetingNudgePhaseModel — THR-868 (WS6 UI).
 *
 * Turns a `FormativeTest` or the `BondTest` into the **same**
 * `EncounterStageNudgePhaseModel` the WS2 encounter stage renders, so
 * `NudgePhaseShell` is consumed whole rather than forked (plan § UI pillar,
 * item 1: "do not fork WS2 components; add presentation props if needed").
 *
 * Why a meeting-local adapter instead of reusing `buildNudgePhaseModel`: that
 * one takes a `UnifiedActionTemplate` + live `UnifiedAction` + `WorldGraph`
 * actor, and derives capability and standing modifiers from the acting agent's
 * node. In the meeting **none of those exist yet** — the candidate is not a
 * graph node until `createAgentFromMeeting` runs at the end of the flow. So the
 * meeting resolves against fixed stand-in inputs, and this adapter mirrors them
 * exactly.
 *
 * **The forecast contract.** `resolveMeetingBand` (engine) rolls
 * `resolveAction` with `MEETING_TEST_ACTOR_ID` / `MEETING_TEST_REACH` /
 * `MEETING_TEST_CAPABILITY` / `MEETING_TEST_SPHERE_FACTOR` and the played hand's
 * summed `forecastDelta` as `actionModifiers`. This builder constructs the
 * identical `ResolutionInput`, which is what `useNudgeHand` recomputes the
 * displayed word from. Both readers import the four constants from
 * `meeting-nudge-constants.ts` — there is no second copy, so the word the
 * player reads is the band fate will roll.
 *
 * Pure: mutates nothing and takes no rng draw.
 *
 * Plan: `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion.md`
 */

import type { SphereName } from '../../types/index';
import type { ResolutionInput } from '../../types/resolution';
import type { ForecastTier } from '../../types/traces/encounter-traces';
import type { StepFactorLine } from '../../types/unifiedAction';
import type { BondTest, FormativeTest, MeetingStepNudge } from '../../types/meetingEncounter';
import { forecastAction } from '../../engine/resolutionService';
import { difficultyWord } from '../../engine/encounters/nudges';
import {
  MEETING_TEST_ACTOR_ID,
  MEETING_TEST_CAPABILITY,
  MEETING_TEST_REACH,
  MEETING_TEST_SPHERE_FACTOR,
} from '../../data/meeting-nudge-constants';
import {
  FORECAST_TIER_WORDS,
  NUDGE_FREE_COST_LABEL,
  NUDGE_BLOCKED_REASONS,
  NUDGE_RIDER_LABELS,
} from '../../data/nudge-stage-content';
import { SPHERE_NAMES } from '../../types/index';
import type {
  EncounterStageFactorLineModel,
  EncounterStageForecastModel,
  EncounterStageNudgeCardModel,
  EncounterStageNudgePhaseModel,
} from '../Game/encounter-stage/types';

/** Reach art is 1-indexed on disk; the meeting always shows the base tier. */
const MEETING_REACH_ICON_TIER = 1;

/** Synthetic action id — the meeting has no `UnifiedAction` to borrow one from. */
const MEETING_ACTION_ID = 'meeting:formative';

export interface BuildMeetingNudgePhaseArgs {
  /** The test being rendered. Both shapes carry the fields the panel needs. */
  test: FormativeTest | BondTest;
  /** Stable id for this test — the template id, or the bond test's own id. */
  testId: string;
  /** Which test in the sequence (0-indexed); the bond test is last. */
  stepIndex: number;
  /** Ascendant's essence pool, per sphere. Absent ⇒ every priced card dims. */
  essencePool?: Readonly<Record<string, number>>;
  /**
   * Candidate name for `{agent.name}` substitution.
   *
   * Meeting content is authored with the same placeholders the setup prose uses,
   * but `NudgePhaseShell` renders card and factor strings verbatim — it is a
   * generic encounter surface and knows nothing about the meeting's candidate.
   * So substitution has to happen here, or the player reads a literal
   * `{agent.name}` on every card.
   */
  agentName?: string;
  /** Location name for `{agent.location}` substitution. */
  locationName?: string;
}

/** Replace the meeting's authoring placeholders. Absent values are left alone. */
function fill(text: string, agentName?: string, locationName?: string): string {
  let out = text;
  if (agentName) out = out.replace(/\{agent\.name\}/g, agentName);
  if (locationName) out = out.replace(/\{agent\.location\}/g, locationName);
  return out;
}

function costLabelFor(cost: number): string | undefined {
  if (cost <= 0) return NUDGE_FREE_COST_LABEL;
  return `${cost} essence`;
}

function forecastModelFrom(tier: ForecastTier, probability: number): EncounterStageForecastModel {
  return { tier, word: FORECAST_TIER_WORDS[tier], probability };
}

function factorModels(
  lines: readonly StepFactorLine[],
  agentName?: string,
  locationName?: string,
): EncounterStageFactorLineModel[] {
  return lines.map((line, index) => ({
    id: `authored:${index}`,
    text: fill(line.text, agentName, locationName),
    polarity: line.polarity,
  }));
}

/**
 * Total essence readable across the pool. The meeting's cards are sphere-
 * *flavored* but not sphere-gated: the god is reaching with raw attention, so a
 * card's sphere colours its fiction rather than locking it behind a pool the
 * player may not hold. Gating them would make most of a hand unplayable on turn
 * one of a run, which is exactly when this encounter fires.
 */
function totalEssence(pool: Readonly<Record<string, number>> | undefined): number {
  if (!pool) return 0;
  return SPHERE_NAMES.reduce((sum, s) => sum + (pool[s] ?? 0), 0);
}

/**
 * Build the meeting's nudge phase.
 *
 * Fail-soft (NFP #4): a test with an empty hand still returns a model — the
 * shell renders its empty-hand line and the player commits an unled moment,
 * which is a legitimate outcome, not an error state.
 */
export function buildMeetingNudgePhaseModel(
  args: BuildMeetingNudgePhaseArgs,
): EncounterStageNudgePhaseModel {
  const { test, testId, stepIndex, essencePool, agentName, locationName } = args;

  const available = totalEssence(essencePool);
  const difficulty = Math.max(0, Math.min(1, Number.isFinite(test.difficulty) ? test.difficulty : 0.5));

  // The exact inputs `resolveMeetingBand` rolls against, with the nudge
  // contribution left at zero — `useNudgeHand` adds the selected deltas onto
  // `actionModifiers` and recalls `forecastAction`, which is the same pure call
  // resolution makes. Hence the displayed word cannot drift from the rolled band.
  const forecastInput: ResolutionInput = {
    actorId: MEETING_TEST_ACTOR_ID,
    domain: MEETING_TEST_REACH,
    capability: MEETING_TEST_CAPABILITY,
    difficulty,
    sphereFactor: MEETING_TEST_SPHERE_FACTOR,
    actionModifiers: 0,
  };

  const baseSummary = forecastAction(forecastInput);
  const baseForecast = forecastModelFrom(
    baseSummary.forecastTier,
    baseSummary.successProbability,
  );

  // Every authored card renders. A card the player cannot currently afford
  // *dims with its reason* rather than vanishing — the WS2 render policy, and
  // the reason the budget moving mid-decision does not make cards flicker.
  const cards: EncounterStageNudgeCardModel[] = (test.nudges as readonly MeetingStepNudge[]).map(
    (nudge) => {
      const unaffordable = nudge.essenceCost > available;
      return {
        id: nudge.id,
        name: fill(nudge.name, agentName, locationName),
        fiction: fill(nudge.fiction, agentName, locationName),
        effectLine: fill(nudge.effectLine, agentName, locationName),
        essenceCost: nudge.essenceCost,
        costLabel: costLabelFor(nudge.essenceCost),
        sphere: nudge.sphere as SphereName | undefined,
        imageTag: nudge.imageTag,
        state: unaffordable ? 'dimmed' : 'playable',
        ...(unaffordable
          ? {
              blockedCode: 'essence_unavailable' as const,
              blockedReason: NUDGE_BLOCKED_REASONS.essence_unavailable,
            }
          : {}),
        riderLabel: nudge.rider ? NUDGE_RIDER_LABELS[nudge.rider] : undefined,
        forecastDelta: nudge.forecastDelta,
      };
    },
  );

  return {
    actionId: MEETING_ACTION_ID,
    templateId: testId,
    stepIndex,
    // No motive strip: the motive is the whole frame of the encounter (the god
    // is choosing a first mortal), so a chip restating it would be noise.
    testPanel: {
      reach: MEETING_TEST_REACH,
      reachLabel: MEETING_TEST_REACH.charAt(0).toUpperCase() + MEETING_TEST_REACH.slice(1),
      reachIconUrl: `/assets/reaches/${MEETING_TEST_REACH}-${MEETING_REACH_ICON_TIER}.png`,
      purposeLine: fill(test.purposeLine, agentName, locationName),
      difficultyWord: difficultyWord(difficulty),
      difficultyValue: difficulty,
      factors: factorModels(test.factorLines, agentName, locationName),
    },
    baseForecast,
    forecastInput,
    traitModifierTotal: 0,
    cards,
    // Nothing is withheld: the meeting's hand is fully authored per test and
    // has no sphere/unlock/trait gates to hide behind.
    withheld: [],
    committedIds: [],
    availableEssence: available,
    committedCost: 0,
  };
}
