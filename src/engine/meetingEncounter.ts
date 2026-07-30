/**
 * Meeting Encounter Engine — "Meet The First" agent generation.
 *
 * Handles the 4-step choice-based encounter that creates a bonded agent:
 *   1. Candidate generation from player intent (reach + sphere)
 *   2. Dilemma selection and axiological profile shaping
 *   3. Spark investment and trait assignment
 *   4. Agent creation and thread establishment
 *
 * Pure functions + seeded PRNG. No side effects except graph mutation
 * in the final createAgentFromMeeting step.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
// AscendantLens + deriveIntentFromHunger removed — narrative flow derives intent in the sensing beat
import { REACH_VALUE_PAIR, VALUE_PAIRS } from '../types/agent';
import { REACH_DOMAINS } from '../types/traits';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { assignCooperationStrategy } from './disposition';
import type {
  MeetingEncounterState,
  MeetingCandidate,
  MeetingEncounterResult,
  MeetingChoiceRecord,
  DilemmaTemplate,
  DilemmaInstance,
  DilemmaChoiceRecord,
  EnrichedDilemmaTemplate,
  IntentOption,
  NarrativeCandidate,
  SparkVision,
  BondOutcome,
  BondTest,
  FormativeOutcome,
  FormativeTest,
  MeetingPoleLean,
  MeetingStepNudge,
} from '../types/meetingEncounter';
import {
  INTENT_OPTIONS,
  MEETING_CANDIDATE_COUNT,
  MEETING_DILEMMA_COUNT_MIN,
  MEETING_DILEMMA_COUNT_MAX,
  DILEMMA_SHIFT_MAGNITUDE,
  PRIMARY_REACH_BASE,
  SECONDARY_REACH_BASE,
  OTHER_REACH_BASE,
  REACH_VARIANCE,
  ASCENDANT_REACH_BIAS,
} from '../types/meetingEncounter';
import type { StepOutcome } from '../types/unifiedAction';
import type { BondReception } from '../data/meeting-nudge-constants';
import {
  BOND_RECEPTION_BY_BAND,
  BOND_RECEPTION_FALLBACK,
  MEETING_NEUTRAL_LEAN_COIN,
  MEETING_POLE_SHIFT_BY_BAND,
  MEETING_QUINTESSENCE_FLOOR,
  MEETING_SCAR_EROSION_BY_BAND,
  MEETING_TEST_ACTOR_ID,
  MEETING_TEST_CAPABILITY,
  MEETING_TEST_REACH,
  MEETING_TEST_SPHERE_FACTOR,
} from '../data/meeting-nudge-constants';
import { QUINTESSENCE_DEFAULT } from '../types/quintessence';
import { applyRider, selectActiveRider, totalNudgeCost } from './encounters/nudges';
import { mapResolverOutcomeToStep } from './unifiedActionResolution';
import { resolveAction } from './resolutionService';
import { CANDIDATE_VIGNETTES, type CandidateVignette } from '../data/candidate-vignettes';
import { SPARK_VISION_CATALOG } from '../data/spark-vision-catalog';
import { ARCHETYPE_NAME_MAP } from '../data/meeting-content';
import { mulberry32 } from '../lib/prng';
import { pickCulturalName } from '../data/culture-name-pools';

// ─── Per-tick Meeting Counter ─────────────────────────────────────

/**
 * Per-tick sequence counter for meeting agent IDs.
 * Reset once per tick by orchestrator via resetMeetingCounter().
 * NFP #3: Determinism — tick+counter replaces Math.random() for IDs.
 */
let meetingCounter = 0;
export function resetMeetingCounter(): void {
  meetingCounter = 0;
}

// ─── Seeded PRNG ──────────────────────────────────────────────────

/** Create a seeded PRNG from a base seed + salt string. */
function createSeededRng(baseSeed: number, salt: string): () => number {
  // Simple hash: mix seed with salt characters
  let h = baseSeed;
  for (let i = 0; i < salt.length; i++) {
    h = ((h << 5) - h + salt.charCodeAt(i)) | 0;
  }
  let s = h;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Step 1: Intent Filtering ─────────────────────────────────────

/**
 * Filter and weight intent options based on ascendant's sphere/reach affinities.
 * Returns all 9 options but reordered — ascendant-aligned options first.
 */
export function getFilteredIntentOptions(
  ascendantSphereAlignment: { primary: SphereName; secondary: SphereName },
  ascendantReachAffinities: Partial<Record<ReachDomain, number>>,
  seed: number,
): IntentOption[] {
  const rng = createSeededRng(seed, 'intent_filter');

  // Score each option by affinity
  const scored = INTENT_OPTIONS.map(opt => {
    const affinity = ascendantReachAffinities[opt.reach] ?? 0;
    // Higher affinity = higher score, with some randomness
    const score = affinity * ASCENDANT_REACH_BIAS + rng() * (1 - ASCENDANT_REACH_BIAS);
    return { ...opt, score };
  });

  // Sort by score descending (highest affinity first)
  scored.sort((a, b) => b.score - a.score);

  return scored.map(({ score: _score, ...opt }) => opt);
}

// ─── Step 1: Candidate Generation ─────────────────────────────────

/**
 * Generate meeting candidates based on player's intent choices.
 * Creates MEETING_CANDIDATE_COUNT candidates from scratch.
 */
export function generateCandidates(
  primaryReach: ReachDomain,
  secondaryReach: ReachDomain,
  sphere: SphereName,
  locationCultureId: string,
  archetypeNameMap: Record<string, string>,
  seed: number,
  foundationBias?: string,
  primarySphereName?: string,
): MeetingCandidate[] {
  const rng = createSeededRng(seed, 'candidates');
  const candidates: MeetingCandidate[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < MEETING_CANDIDATE_COUNT; i++) {
    const candidateRng = createSeededRng(seed, `candidate_${i}`);

    // Generate archetype ID from primary×secondary reach combination
    const archetypeKey = `${primaryReach}_${secondaryReach}`;
    const archetypeId = archetypeKey;
    const archetypeName = archetypeNameMap[archetypeKey] ?? 'Wanderer';

    // Generate axiological profile (random, hidden from player)
    const profile = generateAxiologicalProfile(candidateRng);

    // Generate reach capabilities (primary boosted, secondary slightly boosted)
    const capabilities = generateReachCapabilities(primaryReach, secondaryReach, candidateRng);

    // Assign cooperation strategy
    const cooperationStrategy = assignCooperationStrategy(archetypeId, profile, candidateRng);

    // Generate personality hints (visible to player, derived from profile)
    const hints = derivePersonalityHints(profile);

    const name = generateCandidateName(candidateRng, usedNames, foundationBias, primarySphereName);

    candidates.push({
      tempId: `meeting_candidate_${i}`,
      name,
      archetypeId,
      cultureId: locationCultureId,
      primaryReach,
      secondaryReach,
      sphere,
      vignetteText: '', // Filled by content layer
      personalityHints: hints,
      axiologicalSeed: profile,
      reachCapabilities: capabilities,
      cooperationStrategy,
      appearanceSeed: Math.floor(candidateRng() * 2147483647),
    });
  }

  return candidates;
}

/**
 * Generate a random axiological profile.
 * Each value pair gets a random value between -0.8 and +0.8.
 */
function generateAxiologicalProfile(rng: () => number): AxiologicalProfile {
  const profile: Record<string, number> = {};
  for (const pair of VALUE_PAIRS) {
    profile[pair] = (rng() * 1.6) - 0.8;
  }
  return profile as AxiologicalProfile;
}

/**
 * Generate reach capabilities with primary and secondary boosted.
 */
function generateReachCapabilities(
  primary: ReachDomain,
  secondary: ReachDomain,
  rng: () => number,
): Record<ReachDomain, number> {
  const caps: Partial<Record<ReachDomain, number>> = {};
  for (const reach of REACH_DOMAINS) {
    if (reach === primary) {
      caps[reach] = PRIMARY_REACH_BASE + (rng() * REACH_VARIANCE * 2 - REACH_VARIANCE);
    } else if (reach === secondary) {
      caps[reach] = SECONDARY_REACH_BASE + (rng() * REACH_VARIANCE * 2 - REACH_VARIANCE);
    } else {
      caps[reach] = OTHER_REACH_BASE + (rng() * REACH_VARIANCE * 2 - REACH_VARIANCE);
    }
    // Clamp to [0, 1]
    caps[reach] = Math.max(0, Math.min(1, caps[reach]!));
  }
  return caps as Record<ReachDomain, number>;
}

/**
 * Derive personality hints from axiological profile.
 * Returns 2-3 human-readable hints like "willful", "merciful".
 */
function derivePersonalityHints(profile: AxiologicalProfile): string[] {
  const hints: string[] = [];
  const entries = Object.entries(profile) as [ValuePair, number][];

  // Sort by absolute value (strongest traits first)
  entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  // Take top 3 strongest traits
  for (const [pair, value] of entries.slice(0, 3)) {
    hints.push(getPersonalityHint(pair, value));
  }

  return hints;
}

/** Map a value pair + magnitude to a personality hint word. */
function getPersonalityHint(pair: ValuePair, value: number): string {
  const HINT_MAP: Record<ValuePair, [string, string]> = {
    mercy_ruthlessness: ['merciful', 'ruthless'],
    asceticism_extravagance: ['austere', 'lavish'],
    honesty_cunning: ['honest', 'cunning'],
    tradition_novelty: ['traditional', 'innovative'],
    loyalty_ambition: ['loyal', 'ambitious'],
    revelation_discretion: ['candid', 'guarded'],
    preservation_transformation: ['conservative', 'transformative'],
    sacrifice_survival: ['selfless', 'pragmatic'],
    courage_prudence: ['bold', 'cautious'],
  };
  const [virtue, flaw] = HINT_MAP[pair];
  return value >= 0 ? virtue : flaw;
}

/** Generate a candidate name, preferring culture-specific pools when available. */
function generateCandidateName(
  rng: () => number,
  usedNames: Set<string>,
  foundationBias?: string,
  primarySphere?: string,
): string {
  return pickCulturalName(foundationBias ?? '', primarySphere ?? '', rng, usedNames);
}

// ─── Step 2: Dilemma Selection ────────────────────────────────────

/**
 * Select dilemmas for a meeting encounter.
 * Ensures one dilemma targets the primary reach's value pair.
 * Fills remaining slots from reach-specific, domain-specific, and general pools.
 */
export function selectDilemmas(
  templates: DilemmaTemplate[],
  primaryReach: ReachDomain,
  secondaryReach: ReachDomain,
  sphere: SphereName,
  archetypeId: string,
  locationSubtype: string,
  seed: number,
): DilemmaInstance[] {
  const rng = createSeededRng(seed, 'dilemma_select');

  // Determine count (2-3)
  const count = MEETING_DILEMMA_COUNT_MIN +
    Math.floor(rng() * (MEETING_DILEMMA_COUNT_MAX - MEETING_DILEMMA_COUNT_MIN + 1));

  const selected: DilemmaTemplate[] = [];
  const usedIds = new Set<string>();

  // Helper: filter eligible templates
  const eligible = (t: DilemmaTemplate) =>
    !usedIds.has(t.id) &&
    (t.archetypeIds == null || t.archetypeIds.length === 0 || t.archetypeIds.includes(archetypeId)) &&
    (t.locationSubtypes == null || t.locationSubtypes.length === 0 || t.locationSubtypes.includes(locationSubtype));

  // 1. One axiological dilemma targeting the primary reach's value pair
  const primaryPair = REACH_VALUE_PAIR[primaryReach];
  const axiologicalCandidates = templates.filter(t =>
    t.category === 'axiological' && t.targetValuePair === primaryPair && eligible(t)
  );
  if (axiologicalCandidates.length > 0) {
    const pick = axiologicalCandidates[Math.floor(rng() * axiologicalCandidates.length)];
    selected.push(pick);
    usedIds.add(pick.id);
  }

  // 2. Fill remaining slots from other categories
  const remainingNeeded = count - selected.length;
  const otherCandidates = templates.filter(t => eligible(t) && !usedIds.has(t.id));

  // Prefer diversity: try to pick from different categories
  const byCategory = new Map<string, DilemmaTemplate[]>();
  for (const t of otherCandidates) {
    const cat = byCategory.get(t.category) ?? [];
    cat.push(t);
    byCategory.set(t.category, cat);
  }

  // Priority: reach_specific matching primary/secondary, then domain_specific matching sphere, then general
  const prioritized: DilemmaTemplate[] = [];
  const reachSpecific = otherCandidates.filter(t =>
    t.category === 'reach_specific' && (t.targetReach === primaryReach || t.targetReach === secondaryReach)
  );
  const domainSpecific = otherCandidates.filter(t =>
    t.category === 'domain_specific' && t.targetSphere === sphere
  );
  const general = otherCandidates.filter(t => t.category === 'general');
  const otherAxio = otherCandidates.filter(t =>
    t.category === 'axiological' && !usedIds.has(t.id)
  );

  prioritized.push(...reachSpecific, ...domainSpecific, ...general, ...otherAxio);

  // Deduplicate
  const seen = new Set<string>();
  const uniquePrioritized = prioritized.filter(t => {
    if (seen.has(t.id) || usedIds.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  // Pick remaining
  for (let i = 0; i < remainingNeeded && i < uniquePrioritized.length; i++) {
    // Weighted random from prioritized list (earlier = higher weight)
    const idx = Math.floor(rng() * Math.min(uniquePrioritized.length, remainingNeeded * 3));
    const clamped = Math.min(idx, uniquePrioritized.length - 1);
    const pick = uniquePrioritized.splice(clamped, 1)[0];
    if (pick) {
      selected.push(pick);
      usedIds.add(pick.id);
    }
  }

  // Fail-soft: if we don't have enough, pad with any remaining eligible
  while (selected.length < MEETING_DILEMMA_COUNT_MIN) {
    const any = templates.find(t => eligible(t) && !usedIds.has(t.id));
    if (!any) break;
    selected.push(any);
    usedIds.add(any.id);
  }

  // Convert to instances.
  //
  // `test` rides along when the source template has been converted (THR-868).
  // This mapper is an explicit field allowlist, so the field has to be named
  // here or the converted path is unreachable no matter how many templates
  // carry a test. `DilemmaTemplate` does not declare it — only the enriched
  // subtype does — hence the guarded read rather than a plain property access.
  return selected.map(t => {
    const test = (t as Partial<EnrichedDilemmaTemplate>).test;
    return {
      templateId: t.id,
      category: t.category,
      setup: t.setup,
      godVoice: t.godVoice,
      choices: t.choices,
      ...(test ? { test } : {}),
    };
  });
}

// ─── Step 2: Apply Dilemma Choice ─────────────────────────────────

/**
 * Apply a dilemma choice to the accumulated meeting state.
 * Returns the updated axiological profile shifts and gate tags.
 */
export function applyDilemmaChoice(
  state: MeetingEncounterState,
  dilemmaIndex: number,
  choiceId: string,
): DilemmaChoiceRecord | null {
  if (!state.dilemmas || dilemmaIndex >= state.dilemmas.length) return null;

  const dilemma = state.dilemmas[dilemmaIndex];
  const choice = dilemma.choices.find(c => c.id === choiceId);
  if (!choice) return null;

  // Build choice record
  const record: DilemmaChoiceRecord = {
    dilemmaId: dilemma.templateId,
    category: dilemma.category,
    choiceId,
    gateTags: choice.gateTags,
    axiologicalShifts: choice.axiologicalShifts,
    reachChanges: choice.reachChanges,
    traitSeeds: choice.traitSeeds,
  };

  return record;
}

/**
 * Apply accumulated dilemma choices to a candidate's base profile.
 * Returns the modified axiological profile.
 */
export function applyAxiologicalShifts(
  baseProfile: AxiologicalProfile,
  records: DilemmaChoiceRecord[],
): AxiologicalProfile {
  const result = { ...baseProfile };
  for (const record of records) {
    for (const [pair, shift] of Object.entries(record.axiologicalShifts)) {
      const key = pair as ValuePair;
      result[key] = Math.max(-1, Math.min(1, (result[key] ?? 0) + shift));
    }
  }
  return result;
}

/**
 * Apply accumulated reach changes from dilemma choices.
 */
export function applyReachChanges(
  baseCapabilities: Record<ReachDomain, number>,
  records: DilemmaChoiceRecord[],
): Record<ReachDomain, number> {
  const result = { ...baseCapabilities };
  for (const record of records) {
    if (record.reachChanges) {
      for (const [reach, delta] of Object.entries(record.reachChanges)) {
        const key = reach as ReachDomain;
        result[key] = Math.max(0, Math.min(1, (result[key] ?? 0) + delta));
      }
    }
  }
  return result;
}

// ─── Formative & Bond Tests (THR-868, WS6) ────────────────────────
//
// The meeting's converted beats resolve on the **same** attended ladder every
// WS2 encounter uses: `resolveAction` (sigmoid → d100 → OutcomeType) mapped to
// `StepOutcome` by the canonical `mapResolverOutcomeToStep`, with the committed
// hand's named deltas summed into `actionModifiers` and any rider applied after.
// There is no meeting-local resolver and no second band table — a parallel
// ladder here would drift from the one the rest of the game teaches.

// The three resolution inputs this ladder rolls against —
// `MEETING_TEST_CAPABILITY`, `MEETING_TEST_SPHERE_FACTOR`, `MEETING_TEST_REACH`
// (plus the `MEETING_TEST_ACTOR_ID` stand-in) — are imported from
// `meeting-nudge-constants.ts`. They were module-private here until the stage
// adapter needed them: the forecast word the player reads is computed from the
// same three values, so a UI-side copy would let the shown forecast drift from
// the band this function actually rolls. One definition, both readers.

/**
 * Net pole lean of a played hand.
 *
 * Cards with no `poleLean` abstain — they move the odds without arguing for an
 * outcome. A tie counts as `'none'`: a god who pulled equally both ways has not
 * chosen, and gets pure fate rather than a silent tiebreak toward pole `a`.
 */
export function computeNetPoleLean(
  nudges: readonly MeetingStepNudge[],
  playedNudgeIds: readonly string[],
): MeetingPoleLean {
  const byId = new Map(nudges.map((n) => [n.id, n]));
  let a = 0;
  let b = 0;
  for (const id of playedNudgeIds) {
    const lean = byId.get(id)?.poleLean;
    if (lean === 'a') a++;
    else if (lean === 'b') b++;
  }
  if (a > b) return 'a';
  if (b > a) return 'b';
  return 'none';
}

/**
 * Resolve one band on the shared attended ladder, given a hand.
 *
 * Returns the post-rider `StepOutcome`. Riders take **zero** rng draws (WS0
 * semantics), so the d100 a given seed produces is identical with or without
 * them — only the band mapping changes.
 */
function resolveMeetingBand(
  difficulty: number,
  nudges: readonly MeetingStepNudge[],
  playedNudgeIds: readonly string[],
  rng: () => number,
): StepOutcome {
  const byId = new Map(nudges.map((n) => [n.id, n]));
  const nudgeDelta = playedNudgeIds.reduce(
    (sum, id) => sum + (byId.get(id)?.forecastDelta ?? 0),
    0,
  );

  const result = resolveAction(
    {
      actorId: MEETING_TEST_ACTOR_ID,
      domain: MEETING_TEST_REACH,
      capability: MEETING_TEST_CAPABILITY,
      difficulty: Math.max(0, Math.min(1, Number.isFinite(difficulty) ? difficulty : 0.5)),
      sphereFactor: MEETING_TEST_SPHERE_FACTOR,
      actionModifiers: nudgeDelta,
    },
    rng,
    undefined,
    'encounter',
  );

  // `rollBreakdown` is optional on `ResolutionResult`; absent means "no
  // near-miss information", which maps to the ordinary success/failure bands.
  const band = mapResolverOutcomeToStep(result.outcome, result.rollBreakdown?.nearMiss ?? false);
  // `selectActiveRider` reads a `{ nudges }` shape — `MeetingStepNudge` is
  // structurally a `StepNudge`, which is the whole point of the local extension.
  const rider = selectActiveRider({ nudges }, playedNudgeIds, 'meeting.formative_test');
  return applyRider(band, rider);
}

/** Which pole a band writes, given how the hand leaned and a seeded coin. */
function resolveWrittenPole(
  netLean: MeetingPoleLean,
  band: StepOutcome,
  rng: () => number,
): 'a' | 'b' {
  const magnitude = MEETING_POLE_SHIFT_BY_BAND[band] ?? 0;
  // A zero-lean hand gets pure fate: the coin picks the pole outright, and the
  // band only decides how hard it lands. Drawing the coin unconditionally would
  // desynchronise the stream between leaned and unleaned hands, so it is drawn
  // only on this branch — the one place its value is used.
  if (netLean === 'none') {
    return rng() < MEETING_NEUTRAL_LEAN_COIN ? 'a' : 'b';
  }
  const leaned = netLean;
  const opposite = leaned === 'a' ? 'b' : 'a';
  // Negative magnitude means the moment broke the other way.
  return magnitude >= 0 ? leaned : opposite;
}

/** Prose slot for a resolved formative test. */
function selectFormativeProse(
  test: FormativeTest,
  band: StepOutcome,
  writtenPole: 'a' | 'b',
): string {
  const magnitude = MEETING_POLE_SHIFT_BY_BAND[band] ?? 0;
  const prose = test.bandProse;
  if (magnitude > 0 && band === 'success_at_cost') return prose.tempered;
  if (magnitude >= 0) return writtenPole === 'a' ? prose.cleanA : prose.cleanB;
  if (band === 'near_miss') return prose.tempered;
  return writtenPole === 'a' ? prose.brokenIntoA : prose.brokenIntoB;
}

/**
 * Resolve a formative test — a present-tense trial the god leans and fate settles.
 *
 * Pure and seeded: same test + same played hand + same seed → same outcome, every
 * time (NFP #3). The caller owns the essence spend; `essenceSpent` here is what
 * the played hand *costs*, computed from the authored cards.
 */
export function resolveFormativeTest(
  test: FormativeTest,
  testIndex: number,
  templateId: string,
  playedNudgeIds: readonly string[],
  seed: number,
): FormativeOutcome {
  const rng = createSeededRng(seed, `meeting_test_${testIndex}`);
  const netLean = computeNetPoleLean(test.nudges, playedNudgeIds);
  const band = resolveMeetingBand(test.difficulty, test.nudges, playedNudgeIds, rng);
  const writtenPole = resolveWrittenPole(netLean, band, rng);

  const magnitude = Math.abs(MEETING_POLE_SHIFT_BY_BAND[band] ?? 0);
  // Sign is relative to pole `a`, matching `AxiologicalProfile` polarity: the
  // first-named pole of a `ValuePair` is the positive direction.
  const shift = writtenPole === 'a' ? magnitude : -magnitude;

  return {
    testIndex,
    templateId,
    valuePair: test.valuePair,
    netLean,
    playedNudgeIds: [...playedNudgeIds],
    band,
    writtenPole,
    shift,
    quintessenceErosion: MEETING_SCAR_EROSION_BY_BAND[band] ?? 0,
    essenceSpent: totalNudgeCost({ nudges: test.nudges }, playedNudgeIds),
    prose: selectFormativeProse(test, band, writtenPole),
  };
}

/**
 * Resolve the bond test — the climax.
 *
 * The bond **always forms**. Fate decides only how the mortal receives it, and
 * every band including the worst produces a real relationship: a defiant First
 * still bonds, and defies you.
 *
 * Fail-soft: a malformed template (a reception slot missing its content) falls
 * back to `bargain` rather than throwing, so the meeting can never dead-end on
 * its own last beat.
 */
export function resolveBondTest(
  bondTest: BondTest,
  playedNudgeIds: readonly string[],
  seed: number,
): BondOutcome {
  const rng = createSeededRng(seed, 'meeting_bond');
  const band = resolveMeetingBand(bondTest.difficulty, bondTest.nudges, playedNudgeIds, rng);

  const mapped = BOND_RECEPTION_BY_BAND[band] ?? BOND_RECEPTION_FALLBACK;
  let reception: BondReception = mapped;
  let content = bondTest.receptions[reception];
  if (!content) {
    console.warn(
      `[meetingEncounter] bond test '${bondTest.id}' has no content for reception '${reception}' — falling back to '${BOND_RECEPTION_FALLBACK}'`,
    );
    reception = BOND_RECEPTION_FALLBACK;
    content = bondTest.receptions[BOND_RECEPTION_FALLBACK];
  }

  return {
    band,
    reception,
    playedNudgeIds: [...playedNudgeIds],
    essenceSpent: totalNudgeCost({ nudges: bondTest.nudges }, playedNudgeIds),
    prose: content?.prose ?? '',
    traitSeed: content?.traitSeed ?? '',
  };
}

/**
 * Fold resolved test outcomes into a `MeetingEncounterResult`.
 *
 * Runs *after* `buildNarrativeResult`, which already applied the legacy dilemma
 * shifts — a converted meeting simply has no legacy records to apply, so the two
 * paths compose instead of competing. Never mutates its input.
 *
 * Scarring accumulates across the formative tests and clamps at
 * `MEETING_QUINTESSENCE_FLOOR`: a First can be marked by a bad meeting but never
 * starts `critical` or `broken` (grill verdict 6).
 */
export function applyMeetingOutcomes(
  result: MeetingEncounterResult,
  formativeOutcomes: readonly FormativeOutcome[],
  bondOutcome: BondOutcome | undefined,
): MeetingEncounterResult {
  const axiologicalProfile = { ...result.axiologicalProfile };
  let erosion = 0;

  for (const outcome of formativeOutcomes) {
    const current = axiologicalProfile[outcome.valuePair] ?? 0;
    axiologicalProfile[outcome.valuePair] = Math.max(-1, Math.min(1, current + outcome.shift));
    erosion += outcome.quintessenceErosion;
  }

  // TODO(THR-872): `traitSeeds` has three producers and no consumer —
  // `createAgentFromMeeting` never lands it on the graph, so the reception seed
  // appended here is currently discarded along with every dilemma and spark
  // seed. Appending it anyway keeps the reception's authored seed in one place
  // for when THR-872 gives the channel a reader; it is not new dead weight.
  const traitSeeds = [...result.traitSeeds];
  if (bondOutcome?.traitSeed) traitSeeds.push(bondOutcome.traitSeed);

  const startingQuintessence = erosion > 0
    ? Math.max(MEETING_QUINTESSENCE_FLOOR, QUINTESSENCE_DEFAULT - erosion)
    : undefined;

  return {
    ...result,
    axiologicalProfile,
    traitSeeds,
    startingQuintessence,
    bondReception: bondOutcome?.reception,
    meetingChoiceRecord: {
      ...result.meetingChoiceRecord,
      formativeOutcomes: formativeOutcomes.map((o) => ({ ...o })),
      bondReception: bondOutcome?.reception,
    },
  };
}

// ─── Step 4: Create Agent ─────────────────────────────────────────

/**
 * Create the final agent from a completed meeting encounter.
 * Adds the agent node, thread edge, and located_at edge to the graph.
 * Returns the new agent's node ID.
 */
export function createAgentFromMeeting(
  graph: WorldGraph,
  result: MeetingEncounterResult,
  ascendantId: string,
  tick: number,
): string {
  // NFP #3: Determinism — use tick+sequence counter instead of Math.random() for agent IDs.
  const agentId = `ind_meeting_${tick}_${meetingCounter++}`;

  // Create agent node with standard individual properties
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: result.name,
    properties: {
      actorType: 'individual',
      axiologicalProfile: result.axiologicalProfile,
      domainCapabilities: Object.fromEntries(
        Object.entries(result.reachCapabilities).map(([k, v]) => [k, Math.round(v * 100)])
      ),
      locationId: result.locationId,
      narrativeArchetype: result.archetypeId,
      cooperationStrategy: result.cooperationStrategy,
      reputationScore: DEFAULT_REPUTATION,
      primaryReach: result.primaryReach,
      secondaryReach: result.secondaryReach,
      sphere: result.sphere,
      flavorChoices: result.flavorChoices ?? null,
      portraitAssetPath: result.portraitAssetPath ?? null,
      appearanceSeed: result.appearanceSeed,
      createdByMeeting: true,
      // Formative-test scarring (THR-868). Spread rather than written
      // unconditionally so an unscarred First carries no `quintessence`
      // property at all and the existing `QUINTESSENCE_DEFAULT` fallback
      // applies — the legacy path's node shape is unchanged.
      ...(result.startingQuintessence !== undefined
        ? { quintessence: result.startingQuintessence }
        : {}),
    },
  });

  // Create located_at edge
  graph.addEdge({
    id: `${agentId}_located_at_${result.locationId}`,
    source: agentId,
    target: result.locationId,
    type: 'located_at',
    properties: {},
  });

  // Create thread edge (ascendant → mortal) with court position 'the_first'
  graph.addEdge({
    id: `edge_thread_${ascendantId}_${agentId}`,
    source: ascendantId,
    target: agentId,
    type: 'thread',
    properties: {
      courtPosition: 'the_first',
      tier: 1,
      ticksAtCurrentTier: 0,
      establishedTick: tick,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      awareness: 'faith',
      readBackstoryTier: 0,
      attentionMode: 'auto_resolve',
      storyPhase: 'call',
      meetingChoiceRecord: result.meetingChoiceRecord,
      beatHistory: [],
      // How the mortal received the bond (THR-868). Absent on legacy-path
      // threads, which is a meaningful distinction — see `MeetingChoiceRecord`.
      ...(result.bondReception !== undefined
        ? { bondReception: result.bondReception }
        : {}),
    },
  });

  return agentId;
}

// ─── Narrative Candidate Generation ─────────────────────────────────

/** Number of narrative candidates to show the player. */
const NARRATIVE_CANDIDATE_COUNT = 3;

/** Score multiplier applied to vignettes that resonate with the active Hunger. */
const HUNGER_RESONANCE_WEIGHT = 2.0;

/**
 * Generate 3 narrative candidates biased by Hunger resonance.
 * Vignettes that list `hungerId` in their `hungerResonance` array receive a
 * higher score and are more likely to appear.  The RNG ensures determinism
 * for the same seed while still producing different results across seeds.
 */
export function generateNarrativeCandidates(
  hungerId: string,
  cultureId: string,
  seed: number,
  foundationBias?: string,
  primarySphere?: string,
): NarrativeCandidate[] {
  const rng = mulberry32(seed ^ 0x4d454554); // 'MEET' salt

  // Score vignettes by Hunger resonance
  const scored = CANDIDATE_VIGNETTES.map(v => {
    const resonance = v.hungerResonance.includes(hungerId) ? HUNGER_RESONANCE_WEIGHT : 0;
    const jitter = rng() * 0.5;
    return { vignette: v, score: resonance + jitter };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pick top candidates, preferring diversity of primary reach
  const selected: CandidateVignette[] = [];
  const usedPrimaryReaches = new Set<string>();

  for (const { vignette } of scored) {
    if (selected.length >= NARRATIVE_CANDIDATE_COUNT) break;
    if (usedPrimaryReaches.has(vignette.primaryReach) && selected.length < NARRATIVE_CANDIDATE_COUNT - 1) {
      const remaining = scored.filter(s =>
        !selected.includes(s.vignette) && !usedPrimaryReaches.has(s.vignette.primaryReach),
      );
      if (remaining.length > 0) continue;
    }
    selected.push(vignette);
    usedPrimaryReaches.add(vignette.primaryReach);
  }

  // Fill if diversity filter was too aggressive
  if (selected.length < NARRATIVE_CANDIDATE_COUNT) {
    for (const { vignette } of scored) {
      if (selected.length >= NARRATIVE_CANDIDATE_COUNT) break;
      if (!selected.includes(vignette)) {
        selected.push(vignette);
      }
    }
  }

  const usedNames = new Set<string>();

  return selected.map((vignette, i) => {
    const archetypeKey = `${vignette.primaryReach}_${vignette.secondaryReach}`;
    const archetypeId = ARCHETYPE_NAME_MAP[archetypeKey] ?? 'Wanderer';
    const axiologicalSeed = generateAxiologicalProfile(rng);
    const reachCapabilities = generateReachCapabilities(vignette.primaryReach, vignette.secondaryReach, rng);
    const cooperationStrategy = assignCooperationStrategy(archetypeId, axiologicalSeed, rng);
    const name = generateCandidateName(rng, usedNames, foundationBias, primarySphere);

    return {
      tempId: `candidate_${seed}_${i}`,
      name,
      archetypeId,
      cultureId,
      primaryReach: vignette.primaryReach,
      secondaryReach: vignette.secondaryReach,
      sphere: deriveSphereFromReaches(vignette.primaryReach, vignette.secondaryReach, rng),
      vignetteText: vignette.prose,
      epithet: vignette.epithet,
      imageAssetPath: vignette.imageAssetPath,
      placeholderGradient: vignette.placeholderGradient,
      axiologicalSeed,
      reachCapabilities,
      cooperationStrategy,
      appearanceSeed: Math.floor(rng() * 2147483647),
    };
  });
}

/** Derive a sphere from primary/secondary reach using canonical affinity map. */
function deriveSphereFromReaches(
  primary: ReachDomain,
  _secondary: ReachDomain,
  rng: () => number,
): SphereName {
  const REACH_SPHERE_MAP: Record<string, SphereName[]> = {
    iron:   ['force', 'matter'],
    gold:   ['matter', 'energy'],
    shadow: ['entropy', 'mind'],
    veil:   ['spirit', 'mind'],
    heart:  ['life', 'spirit'],
    eye:    ['mind', 'time'],
    stone:  ['matter', 'time'],
    star:   ['spirit', 'light'],
  };
  const options = REACH_SPHERE_MAP[primary] ?? ['force'];
  return options[Math.floor(rng() * options.length)];
}

/**
 * Generate reach-matched spark visions for the player to choose from.
 * Returns 3 visions whose `requiredPrimaryReach` matches the candidate's
 * primary reach.  If fewer than 3 matching visions exist, fills from the
 * rest of the catalog using a seeded shuffle.
 */
export function generateSparkVisions(
  primaryReach: ReachDomain,
  _ascendantPrimarySphere: SphereName,
  seed: number,
): SparkVision[] {
  const matching = SPARK_VISION_CATALOG.filter(
    v => v.requiredPrimaryReach === primaryReach,
  );

  if (matching.length >= 3) {
    return matching.slice(0, 3);
  }

  const rng = mulberry32(seed ^ 0x5350524b); // 'SPRK' salt
  const others = SPARK_VISION_CATALOG.filter(
    v => v.requiredPrimaryReach !== primaryReach,
  );
  // Fisher-Yates shuffle for deterministic ordering
  const shuffled = [...others];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const result = [...matching];
  for (const v of shuffled) {
    if (result.length >= 3) break;
    result.push(v);
  }
  return result.slice(0, 3);
}

/**
 * Input shape for buildNarrativeResult.
 */
export interface NarrativeResultInput {
  candidate: NarrativeCandidate;
  vision: SparkVision;
  dilemmaChoices: DilemmaChoiceRecord[];
  editedName: string | undefined;
  locationId: string;
  ascendantSphere: SphereName;
  tick: number;
}

/**
 * Assemble a MeetingEncounterResult from the narrative-flow choices.
 * Applies dilemma axiological shifts, the spark vision's reach investment,
 * and collects all founding gate tags and trait seeds.
 */
export function buildNarrativeResult(input: NarrativeResultInput): MeetingEncounterResult {
  const { candidate, vision, dilemmaChoices, editedName, locationId, ascendantSphere, tick } = input;

  // Apply dilemma axiological shifts
  let profile = { ...candidate.axiologicalSeed };
  for (const choice of dilemmaChoices) {
    for (const [pair, shift] of Object.entries(choice.axiologicalShifts)) {
      const current = profile[pair as ValuePair] ?? 0;
      profile[pair as ValuePair] = Math.max(-1, Math.min(1, current + (shift ?? 0)));
    }
  }

  // Apply vision reach investment
  const reachCapabilities = { ...candidate.reachCapabilities };
  reachCapabilities[vision.reachInvestment] = Math.min(
    1,
    (reachCapabilities[vision.reachInvestment] ?? 0) + vision.investmentAmount,
  );

  const foundingGateTags = dilemmaChoices.flatMap(c => c.gateTags);
  const traitSeeds = [
    ...dilemmaChoices.flatMap(c => c.traitSeeds ?? []),
    ...vision.traitGrants,
  ];

  const meetingChoiceRecord: MeetingChoiceRecord = {
    encounterTick: tick,
    locationId,
    candidateIndex: 0,
    archetypeId: candidate.archetypeId,
    dilemmaChoices,
    sparkVisionId: vision.id,
    ascendantSphere,
    foundingGateTags,
  };

  return {
    name: editedName ?? candidate.name,
    archetypeId: candidate.archetypeId,
    cultureId: candidate.cultureId,
    axiologicalProfile: profile,
    reachCapabilities,
    primaryReach: candidate.primaryReach,
    secondaryReach: candidate.secondaryReach,
    sphere: candidate.sphere,
    cooperationStrategy: candidate.cooperationStrategy,
    foundingGateTags,
    traitSeeds,
    portraitAssetPath: candidate.imageAssetPath,
    appearanceSeed: candidate.appearanceSeed,
    meetingChoiceRecord,
    locationId,
  };
}

// ─── State Machine Helpers ────────────────────────────────────────

/**
 * Create initial meeting encounter state.
 *
 * The new narrative flow generates candidates via the orchestrator during
 * the sensing beat, so we no longer derive intent here.
 */
export function createMeetingEncounterState(
  locationId: string,
  ascendantId: string,
  tick: number,
): MeetingEncounterState {
  return {
    id: `meeting_${tick}_${locationId}`,
    currentStep: 'sensing',
    locationId,
    ascendantId,
    startedTick: tick,
    status: 'active',
  };
}

/**
 * Location subtypes where the Meet-The-First beat can open.
 *
 * The dilemmas describe merchants, guards, children and councils, so the beat
 * needs a place people actually live. Exported (THR-874) because the GameView
 * auto-trigger and the `?firstunmet` dev seeder both gate on it — they held
 * separate inline copies, and a drift between them silently made the beat
 * unreachable from the one dev URL built to reach it.
 */
export const MEETING_SETTLED_LOCATION_SUBTYPES: readonly string[] = [
  'town', 'city', 'hamlet', 'village', 'capital',
  'port', 'outpost', 'fortress', 'monastery', 'trading_post',
];

/**
 * Check if the Meet The First action is available.
 * Requires: no active First, cooldown expired, location has agents.
 */
export function isMeetTheFirstAvailable(
  graph: WorldGraph,
  ascendantId: string,
  currentTick: number,
): boolean {
  // Check no existing 'the_first' court position
  const threads = graph.getOutgoingEdges(ascendantId, 'thread');
  const hasActiveFirst = threads.some(e =>
    (e.properties.courtPosition as string) === 'the_first'
  );
  if (hasActiveFirst) return false;

  // Check cooldown
  const ascendant = graph.getNode(ascendantId);
  if (ascendant) {
    const cooldownUntil = (ascendant.properties.firstSlotCooldownUntil as number) ?? 0;
    if (currentTick < cooldownUntil) return false;
  }

  return true;
}

/**
 * Build the final MeetingEncounterResult from a completed state.
 */
export function buildMeetingResult(
  state: MeetingEncounterState,
  ascendantSphere: SphereName,
): MeetingEncounterResult | null {
  if (state.status !== 'active' || !state.candidates || state.selectedCandidateIndex == null) {
    return null;
  }

  const candidate = state.candidates[state.selectedCandidateIndex];
  if (!candidate) return null;

  const records = state.dilemmaChoiceRecords ?? [];

  // Apply all dilemma shifts to the candidate's base profile
  const finalProfile = applyAxiologicalShifts(candidate.axiologicalSeed, records);

  // Apply reach changes
  const finalCapabilities = applyReachChanges(candidate.reachCapabilities, records);

  // Collect all gate tags and trait seeds
  const gateTags = records.flatMap(r => r.gateTags);
  const traitSeeds = [
    ...records.flatMap(r => r.traitSeeds ?? []),
    ...(state.accumulatedTraitSeeds ?? []),
  ];

  const name = state.editedName ?? candidate.name;

  const meetingChoiceRecord: MeetingChoiceRecord = {
    encounterTick: state.startedTick,
    locationId: state.locationId,
    candidateIndex: state.selectedCandidateIndex ?? 0,
    archetypeId: candidate.archetypeId,
    dilemmaChoices: records,
    sparkVisionId: state.sparkVisionId ?? '',
    ascendantSphere,
    foundingGateTags: gateTags,
  };

  return {
    name,
    archetypeId: candidate.archetypeId,
    cultureId: candidate.cultureId,
    axiologicalProfile: finalProfile,
    reachCapabilities: finalCapabilities,
    primaryReach: candidate.primaryReach,
    secondaryReach: candidate.secondaryReach,
    sphere: candidate.sphere,
    cooperationStrategy: candidate.cooperationStrategy,
    foundingGateTags: gateTags,
    traitSeeds,
    flavorChoices: state.flavorChoices,
    appearanceSeed: candidate.appearanceSeed,
    meetingChoiceRecord,
    locationId: state.locationId,
  };
}
