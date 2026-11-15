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
  BeatChoice,
  OrdealOutcome,
  OrdealRollSpec,
  SceneActivity,
  VisionScene,
} from '../types/journeyEngine';
import {
  PHASE_BOUNDARIES,
  CALL_PHASE_END,
  TRIALS_PHASE_END,
  CRISIS_PHASE_END,
  ORDEAL_PHASE_END,
  MAX_PENDING_VIGNETTES,
  JOURNEY_REACH_CHANGE_RAW_SCALE,
  ORDEAL_BAND_TO_OUTCOME,
  ORDEAL_FALLBACK_DIFFICULTY,
  ORDEAL_REACH,
  ORDEAL_SCALE,
  VISION_SCENE_FIT_BONUS,
  VISION_SCENE_MISMATCH_PENALTY,
} from '../types/journeyEngine';
import type { StepOutcome } from '../types/unifiedAction';
import type { StrategicRuntimeState } from '../types/strategicAction';
import type { ForecastTier } from '../types/traces/encounter-traces';
import { CLIMAX_BARE_FORECAST, DIFFICULTY_WORD_BANDS, FIT_ITERATIONS } from '../data/nudge-constants';
import {
  ORDEAL_FIRST_FALLBACK,
  ORDEAL_STAKES_LINE,
  ORDEAL_WEIGHT_LINE,
  VISION_ACTIVITY_BY_PLACE_KIND,
  VISION_ACTIVITY_BY_UNDERTAKING_VERB,
  VISION_SCENE_OPENERS,
} from '../data/vision-scene-content';
import { ambitionPronounsFor, resolveAmbitionPronouns } from './ambitionProse';
import { isFirstApotheosisPending } from './aspects';
import { FIRST_RETURN_APOTHEOSIS_WAIT_DOOM_CAP } from '../data/aspect-content';
import { computeCapability } from './domainCapability';
import { fitDifficultyToForecast, scaledStepProbability } from './scaledForecast';
// The core's re-export of the forecast classifier: this module reaches the dice only
// through `stepResolutionCore` (the importer pin in stepResolutionCore.contract.test.ts).
import { classifyStepForecastTier as classifyForecast, resolveStepCore } from './stepResolutionCore';
import { drawLuckRoll, readLuckState } from './luck';
import { rollTableUnit } from '../lib/drawTable';
import { outcomePinFor } from './debugOutcomePin';
import { resolveToParentLocation } from './sublocationShape';
import { getStrategicTemplate } from './strategicActionCandidates';
import type { ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import {
  getThreadsFrom,
  getActorTraits,
  getAgentAmbitions,
  getAgentFaction,
  getAgentBonds,
  getAgentMemberships,
} from './graphQueries';
import { FACTION_RANK_SENIOR } from '../data/agent-behavior-constants';
import { emitTrace } from './traceBuffer';
import { mulberry32 } from '../lib/prng';
import { executeReturn } from './returnEngine';
import { durationLabel } from './aftermathWords';
import {
  RETURN_CLOSE_LABEL,
  RETURN_FIRST_FALLBACK_NAME,
  RETURN_OPEN_THREAD_CLAUSE,
  RETURN_REMAINING_LINE,
} from '../data/return-content';
import { touchWorld, type SimulationRuntime } from './simulationRuntime';
import type { ReturnResolutionResult } from '../types/returnEngine';

// ─── The Return's last-days line (THR-2228) ───────────────────────

/**
 * Whether another mortal can take the First's place before the age ends: the god
 * holds no other `the_first` thread, and the Return's slot cooldown runs out before
 * the Doom does. There is no other thread cap in the game; the First slot (its
 * cooldown, `firstSlotCooldownUntil`) is the one limit on who carries the story next.
 */
export function isFirstSlotOpenBeforeAgeEnds(
  graph: WorldGraph,
  ascendantId: string,
  cooldownTicks: number,
  /** Game ticks until the Doom ends (not Doom-clock units; the caller converts by its step). */
  gameTicksUntilAgeEnds: number,
): boolean {
  const holdsFirst = graph.getOutgoingEdges(ascendantId, 'thread').some(e =>
    (e.properties.courtPosition as string | undefined) === 'the_first');
  if (holdsFirst) return false;
  const cooldown = Number.isFinite(cooldownTicks) ? Math.max(0, cooldownTicks) : 0;
  return cooldown < gameTicksUntilAgeEnds;
}

/**
 * The Return's line: "{first}'s story is told. The age has {timeWord} left." plus the
 * open-thread clause only when `threadOpen` (UI Law 56). `{timeWord}` is the Doom
 * panel's own reading of the ticks left (`durationLabel`, THR-2219). Pure.
 */
export function buildReturnRemainingLine(args: {
  firstName: string | undefined;
  doomTicksRemaining: number;
  threadOpen: boolean;
}): string {
  const first = args.firstName?.trim() || RETURN_FIRST_FALLBACK_NAME;
  const ticks = Number.isFinite(args.doomTicksRemaining) ? Math.max(0, args.doomTicksRemaining) : 0;
  const line = RETURN_REMAINING_LINE
    .replace('{first}', first)
    .replace('{timeWord}', durationLabel(ticks));
  return args.threadOpen ? line + RETURN_OPEN_THREAD_CLAUSE : line;
}

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
  // `rank` is on the declared 0–1 scale (MemberOfEdgeProperties), so the old literal
  // `>= 3` was permanently false and this filter silently collapsed to its role half
  // (THR-1151). FACTION_RANK_SENIOR is the same axis, anchored to the lieutenant tier.
  const leaderMemberships = memberships.filter(
    m => (m.edge.properties.role as string) === 'leader'
      || (m.edge.properties.rank as number) >= FACTION_RANK_SENIOR
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
      locationsControlled: graph.getOutgoingEdges(agentId, 'controls').filter(e => graph.getNode(e.target)?.type === 'location').length,
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
 * A beat fires on entering a new phase, or when the doom clock has reached the
 * threshold of the phase's next beat not yet recorded in the beat history
 * (THR-2233: reached, not merely crossed this tick — a missed crossing catches up).
 */
export function shouldBeatFire(
  doomProgress: number,
  prevDoomProgress: number,
  storyPhase: CampbellianPhase,
  beatHistory: BeatOutcome[],
  journeyStartDoom?: number,
): { shouldFire: boolean; phase: CampbellianPhase; beatIndex: number } {
  const currentPhase = getJourneyPhase(doomProgress);

  // THR-2233 — no First reaches the Return without their Ordeal. In the Return phase
  // with no Ordeal recorded (its window passed while a vision waited, a doom step
  // jumped it, or the First was threaded that late), the Ordeal fires first — checked
  // before the phase-entry branch, which would otherwise hand straight to the Return.
  // `phaseJourneyBeat` then records storyPhase 'ordeal', so once it is answered the
  // Return fires as the next phase entry. (Replaces the old ≥ ORDEAL_FORCE_FIRE_THRESHOLD
  // force-fire, which only ran when storyPhase was already 'return' — never, since the
  // Return clears the court position.)
  if (currentPhase === 'return' && !beatHistory.some(b => b.phase === 'ordeal')) {
    return { shouldFire: true, phase: 'ordeal', beatIndex: 0 };
  }

  // Check if we've entered a new phase
  if (currentPhase !== storyPhase) {
    // Phase transition — the first beat of the new phase should fire
    const beatsInNewPhase = beatHistory.filter(b => b.phase === currentPhase).length;
    const thresholds = getBeatThresholds(currentPhase);
    if (beatsInNewPhase < thresholds.length) {
      return { shouldFire: true, phase: currentPhase, beatIndex: beatsInNewPhase };
    }
  }

  // THR-2233 — catch-up rule. Within the current phase, the next unplayed beat
  // fires once the Doom has reached its threshold, not only on the tick it was
  // crossed: a crossing that landed while a vision was pending (or on a doom step
  // taken outside `phaseDoom`) used to lose that beat for good. One beat per tick,
  // in order; the count of this phase's `beatHistory` entries stays the index, so
  // no beat fires twice. `prevDoomProgress` is no longer read here — kept in the
  // signature for callers. A beat whose phase has ended is not caught up: the
  // phase-entry branch above hands over to the next phase.
  void prevDoomProgress;

  const thresholds = getBeatThresholds(currentPhase);
  const beatsInPhase = beatHistory.filter(b => b.phase === currentPhase).length;
  // Beats that passed before this First's journey began are never caught up: the
  // entry vision plays as #0 and the later ones skip them (`journeyStartDoom`).
  const nextIndex = beatsInPhase + beatsBeforeJourney(thresholds, journeyStartDoom);

  if (nextIndex < thresholds.length && doomProgress >= thresholds[nextIndex]) {
    return { shouldFire: true, phase: currentPhase, beatIndex: nextIndex };
  }

  return { shouldFire: false, phase: currentPhase, beatIndex: -1 };
}

/**
 * THR-2233 — how many of a phase's within-phase beats (index ≥ 1; #0 is the entry
 * vision, always played) lie at or before the Doom progress where this First's
 * journey began. Zero when the journey started in an earlier phase or the floor is
 * unknown (no vision yet, or a pre-THR-2233 save).
 */
export function beatsBeforeJourney(thresholds: number[], journeyStartDoom: number | undefined): number {
  if (journeyStartDoom == null || !Number.isFinite(journeyStartDoom)) return 0;
  let skipped = 0;
  for (let i = 1; i < thresholds.length; i++) {
    if (thresholds[i] <= journeyStartDoom) skipped++;
  }
  return skipped;
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
  played: readonly BeatOutcome[] = [],
  scene?: VisionScene,
): { template: JourneyBeatTemplate; variant: BeatVariant } | null {
  // Filter templates valid for this phase, minus the moments already lived (THR-1854)
  const validTemplates = excludePlayed(templates.filter(t => t.validPhases.includes(phase)), played);

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
      // THR-2226 — the scene term: a moment that fits what the First is doing wins
      // over one that does not, so a battlefield vision never fires over a shrine.
      const score = variant.score(snapshot) + sceneScoreTerm(variant, scene?.activity);
      scored.push({ template, variant, score });
    }
  }

  if (scored.length === 0) return null;

  // THR-2226 — when some moment fits the scene, a tagged moment that does not is
  // never drawn: the weighted top-3 pick could otherwise still land on it.
  const activity = scene?.activity;
  if (activity && scored.some(c => sceneFit(c.variant, activity) === 'fit')) {
    for (let i = scored.length - 1; i >= 0; i--) {
      if (sceneFit(scored[i].variant, activity) === 'mismatch') scored.splice(i, 1);
    }
  }

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

/**
 * THR-1854: a moment the First has already lived is not offered again. The scorer
 * favours the same variant while her state holds still, so without this the weighted
 * pick served `trials_temptation` twice in one Road of Trials, word for word.
 *
 * Narrowest exclusion that still leaves a candidate (fail-soft, NFP #4): drop every
 * template already played; if that empties the phase, drop only the played variants;
 * if that empties it too, repeat rather than skip the beat.
 */
function excludePlayed(
  phaseTemplates: JourneyBeatTemplate[],
  played: readonly BeatOutcome[],
): JourneyBeatTemplate[] {
  if (played.length === 0) return phaseTemplates;
  const playedTemplates = new Set(played.map(b => b.templateId));
  const unplayed = phaseTemplates.filter(t => !playedTemplates.has(t.id));
  if (unplayed.length > 0) return unplayed;

  const playedVariants = new Set(played.map(b => `${b.templateId}::${b.variantKey}`));
  const freshVariants = phaseTemplates
    .map(t => ({ ...t, variants: t.variants.filter(v => !playedVariants.has(`${t.id}::${v.key}`)) }))
    .filter(t => t.variants.length > 0);
  return freshVariants.length > 0 ? freshVariants : phaseTemplates;
}

// ─── Vision Scene (THR-2226) ────────────────────────────────────────

/** How a variant's `scenes` tag reads against the First's activity. */
export function sceneFit(variant: BeatVariant, activity: SceneActivity | undefined): 'fit' | 'mismatch' | 'untagged' {
  if (!variant.scenes || variant.scenes.length === 0 || !activity) return 'untagged';
  return variant.scenes.includes(activity) ? 'fit' : 'mismatch';
}

/** The scene's contribution to a variant's score (`VISION_SCENE_*`). */
function sceneScoreTerm(variant: BeatVariant, activity: SceneActivity | undefined): number {
  switch (sceneFit(variant, activity)) {
    case 'fit': return VISION_SCENE_FIT_BONUS;
    case 'mismatch': return -VISION_SCENE_MISMATCH_PENALTY;
    default: return 0;
  }
}

/**
 * THR-2226 — where the First is and what they are doing, read once when a vision is
 * built. The place is the `located_at` target, resolved up to its Location for the
 * name and kind. The activity is the verb of an active undertaking when the First has
 * one (`VISION_ACTIVITY_BY_UNDERTAKING_VERB`), else the place's kind
 * (`VISION_ACTIVITY_BY_PLACE_KIND`), else `rest`. A chapter in progress needs no tier
 * of its own: it plays where the First stands, which the place already reads.
 *
 * Pure: reads the graph and the strategic state, draws nothing. Fail-soft (NFP #4):
 * no position reads as `rest` with no place.
 */
export function readVisionScene(
  graph: WorldGraph,
  agentId: string,
  strategicState?: StrategicRuntimeState,
): VisionScene {
  let placeId: string | undefined;
  let placeName: string | undefined;
  let placeKind: string | undefined;
  try {
    const locEdge = graph.getOutgoingEdges(agentId, 'located_at')[0];
    const here = locEdge ? graph.getNode(locEdge.target) : undefined;
    const place = resolveToParentLocation(graph, here) ?? here;
    if (place) {
      placeId = place.id;
      placeName = typeof place.name === 'string' && place.name.trim() ? place.name : undefined;
      const kind = place.properties?.locationSubtype ?? place.properties?.locationType;
      placeKind = typeof kind === 'string' ? kind : undefined;
    }
  } catch {
    // fail-soft: no place
  }

  let activity: SceneActivity | undefined;
  for (const project of strategicState?.projects ?? []) {
    if (project.actorId !== agentId || project.status !== 'active') continue;
    const verb = getStrategicTemplate(project.templateId)?.undertakingVerb;
    const mapped = verb ? VISION_ACTIVITY_BY_UNDERTAKING_VERB[verb] : undefined;
    if (mapped) { activity = mapped; break; }
  }
  if (!activity && placeKind) activity = VISION_ACTIVITY_BY_PLACE_KIND[placeKind];

  return { placeId, placeName, placeKind, activity: activity ?? 'rest' };
}

/**
 * The clause a vision's setup opens with, then the setup itself (THR-2226). The
 * setup's first letter is lowered to read on from the clause, unless it opens on
 * the role title, which becomes the mortal's name.
 */
export function openWithScene(setupProse: string, scene: VisionScene | undefined): string {
  if (!scene || !setupProse) return setupProse;
  const opener = VISION_SCENE_OPENERS[scene.activity];
  if (!opener) return setupProse;
  const lead = scene.placeName
    ? opener.withPlace.replace('{place}', scene.placeName)
    : opener.withoutPlace;
  const body = /^The First\b/.test(setupProse)
    ? setupProse
    : setupProse.charAt(0).toLowerCase() + setupProse.slice(1);
  return `${lead} ${body}`;
}

// ─── The Ordeal's roll (THR-2226) ───────────────────────────────────

/** The difficulty word (`DIFFICULTY_WORD_BANDS`) for a difficulty. */
function ordealDifficultyWord(difficulty: number): string {
  for (const band of DIFFICULTY_WORD_BANDS) {
    if (difficulty >= band.min) return band.word;
  }
  return DIFFICULTY_WORD_BANDS[DIFFICULTY_WORD_BANDS.length - 1].word;
}

/**
 * Fit the Ordeal for this mortal: the difficulty at which stepping back leaves the
 * bare chance `CLIMAX_BARE_FORECAST`, computed once and stored on the vision so the
 * shown forecast and the roll read one value (Law 18). Pure: never deals the bag.
 */
export function buildOrdealRollSpec(graph: WorldGraph, agentId: string): OrdealRollSpec {
  let capability = 0;
  try {
    capability = computeCapability(graph, agentId, ORDEAL_REACH);
  } catch {
    capability = 0;
  }
  const fit = fitDifficultyToForecast(capability, CLIMAX_BARE_FORECAST, {
    scale: ORDEAL_SCALE,
    fallbackDifficulty: ORDEAL_FALLBACK_DIFFICULTY,
    iterations: FIT_ITERATIONS,
  });
  return {
    reach: ORDEAL_REACH,
    scale: ORDEAL_SCALE,
    capability,
    difficulty: fit.difficulty,
    bareChance: fit.bareChance,
    fitted: fit.fitted,
  };
}

/** The chance the Ordeal rolls against with `lean` added — the core's own number. */
export function ordealChance(spec: OrdealRollSpec, lean: number): number {
  return scaledStepProbability({
    actorId: '',
    domain: spec.reach,
    capability: spec.capability,
    difficulty: spec.difficulty,
    sphereFactor: 0,
    actionModifiers: lean,
    testShapers: [],
  }, spec.scale);
}

/**
 * Give an Ordeal vision its fitted roll, the forecast word each choice leaves and
 * the trial's difficulty word. Anything but an Ordeal comes back unchanged.
 */
export function attachOrdealRoll(graph: WorldGraph, vignette: JourneyVignetteData): JourneyVignetteData {
  if (!vignette.isOrdeal) return vignette;
  const spec = buildOrdealRollSpec(graph, vignette.agentId);
  const forecastByChoice: Record<string, ForecastTier> = {};
  for (const choice of vignette.choices) {
    forecastByChoice[choice.id] = classifyForecast(ordealChance(spec, choice.effects.ordealLean ?? 0));
  }
  const difficultyWord = ordealDifficultyWord(spec.difficulty);
  const first = vignette.agentName.trim() || ORDEAL_FIRST_FALLBACK;
  const pronouns = ambitionPronounsFor(vignette.agentGender);
  return {
    ...vignette,
    ordealRoll: spec,
    forecastByChoice,
    difficultyWord,
    ordealLines: {
      weight: ORDEAL_WEIGHT_LINE.replace('{first}', first),
      stakes: resolveAmbitionPronouns(ORDEAL_STAKES_LINE.replace('{difficultyWord}', difficultyWord), pronouns),
    },
  };
}

/** What the Ordeal's roll landed. */
export interface OrdealRollResult {
  band: StepOutcome;
  outcome: OrdealOutcome;
  godPaid: boolean;
  chance: number;
  bareChance: number;
  roll: number;
}

/**
 * THR-2226 — roll the Ordeal (plan THR-2204 slice 1). One `resolveStepCore` call on
 * the stored fitted difficulty, with the choice's lean as the modifier. The d100 is
 * dealt from the First's marble bag (`drawLuckRoll`, Law 4); the core's own draw —
 * and the plain dice when the bag is off — come from a keyed unit stream
 * `journey.ordeal:${seed}:${firstId}:${beatIndex}`, never the tick's shared stream,
 * because this runs at click time while the game is paused (NFP #3, Law 8). A
 * `?outcome=` pin on the Ordeal template is honoured as on every step.
 *
 * Emits one `journey.ordeal_roll` trace. Returns null for anything but an Ordeal or
 * an unknown choice (fail-soft: nothing is written).
 */
export function rollOrdeal(
  graph: WorldGraph,
  seed: number,
  ascendantId: string,
  vignette: JourneyVignetteData,
  choiceId: string,
  tick: number,
): OrdealRollResult | null {
  if (!vignette.isOrdeal) return null;
  const choice = vignette.choices.find(c => c.id === choiceId);
  if (!choice) return null;
  // An old save's vision carries no stored fit: fit it now (fail-soft).
  const spec = vignette.ordealRoll ?? buildOrdealRollSpec(graph, vignette.agentId);
  const lean = choice.effects.ordealLean ?? 0;
  const agentId = vignette.agentId;
  const luckDrawIndex = readLuckState(graph.getNode(agentId)).bagDraws;
  const luckRoll = drawLuckRoll(graph, seed, ascendantId, agentId, tick);
  let draws = 0;
  const rng = (): number => rollTableUnit('journey.ordeal', `${seed}:${agentId}:${vignette.beatIndex}:${draws++}`);
  const core = resolveStepCore({
    actorId: agentId,
    reach: spec.reach,
    capability: spec.capability,
    difficulty: spec.difficulty,
    scale: spec.scale,
    actionModifiers: lean,
    testShapers: [],
    variancePolicy: 'agent',
    quintessencePolicy: 'none',
    bandOverride: outcomePinFor(vignette.templateId),
    luckRoll,
    tick,
    sourceLabel: 'encounter',
  }, rng);
  const band = core.outcome;
  const outcome = ORDEAL_BAND_TO_OUTCOME[band] ?? 'scraped_through';
  const godPaid = choice.effects.interventionType !== 'withdrawn' || (choice.effects.essenceCost ?? 0) > 0;
  emitTrace({
    category: 'journey.ordeal_roll',
    tick,
    agentId,
    summary: `${vignette.agentName}'s Ordeal (${vignette.templateId}): "${choice.id}" leaned ${lean.toFixed(2)}, `
      + `chance ${core.probability.toFixed(2)} (bare ${spec.bareChance.toFixed(2)}), rolled ${core.roll} → ${band} (${outcome})`,
    actorId: agentId,
    choiceId: choice.id,
    difficulty: spec.difficulty,
    lean,
    bareChance: spec.bareChance,
    chance: core.probability,
    roll: core.roll,
    luckDrawIndex: luckRoll !== undefined ? luckDrawIndex : undefined,
    band,
    outcome,
    godPaid,
  });
  return { band, outcome, godPaid, chance: core.probability, bareChance: spec.bareChance, roll: core.roll };
}

/** The Ordeal's result as written to the thread edge, or null before it is rolled. */
export function readOrdealResult(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
): { outcome: OrdealOutcome } | null {
  const edge = getThreadsFrom(graph, ascendantId).find(e => e.target === agentId);
  const props = edge?.properties as ThreadEdgeProperties | undefined;
  if (!props?.ordealOutcome) return null;
  return { outcome: props.ordealOutcome };
}

/** The reply line for an Ordeal choice at a rolled outcome (`consequenceProse` is the fallback). */
export function ordealConsequence(choice: BeatChoice, outcome: OrdealOutcome | undefined): string | null {
  return (outcome ? choice.effects.consequenceByOutcome?.[outcome] : undefined)
    ?? choice.effects.consequenceProse
    ?? null;
}

// ─── Beat Execution ─────────────────────────────────────────────────

/** THR-2198 — the role title the journey content was authored around. */
const FIRST_ROLE_TITLE = /\b[Tt]he First\b/g;

/**
 * THR-2198 — journey prose names the mortal, not the role. Every variant was authored
 * around "The First"; a round-7 tester read "The First stands at the threshold…" as a
 * placeholder. Fail-soft: a blank name leaves the text as authored.
 */
export function personalizeJourneyText(text: string, agentName: string): string {
  const name = agentName.trim();
  if (!name || !text) return text;
  return text.replace(FIRST_ROLE_TITLE, name);
}

/**
 * THR-2226 — the mortal's name for the role title, then the mortal's own pronouns for
 * the `{they}` / `{them}` / `{their}` / `{theirs}` tokens (never a default "they"
 * over a gendered mortal; an unrecorded gender reads they/them).
 */
function personalizeLine(text: string, agentName: string, gender: unknown): string {
  return resolveAmbitionPronouns(personalizeJourneyText(text, agentName), ambitionPronounsFor(gender));
}

function personalizeChoice(choice: BeatChoice, agentName: string, gender?: unknown): BeatChoice {
  const { consequenceProse, consequenceByOutcome } = choice.effects;
  let effects = choice.effects;
  if (consequenceProse !== undefined) {
    effects = { ...effects, consequenceProse: personalizeLine(consequenceProse, agentName, gender) };
  }
  if (consequenceByOutcome) {
    const lines: Partial<Record<OrdealOutcome, string>> = {};
    for (const [outcome, line] of Object.entries(consequenceByOutcome) as [OrdealOutcome, string | undefined][]) {
      if (line !== undefined) lines[outcome] = personalizeLine(line, agentName, gender);
    }
    effects = { ...effects, consequenceByOutcome: lines };
  }
  return { ...choice, text: personalizeLine(choice.text, agentName, gender), effects };
}

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
  scene?: VisionScene,
  gender?: string,
): JourneyVignetteData {
  return {
    agentId,
    agentName,
    phase,
    doomClockPercent,
    beatIndex,
    templateId: template.id,
    variantKey: variant.key,
    // THR-2226 — the setup opens where the First is, doing what they are doing.
    setupProse: personalizeLine(openWithScene(variant.setupProse, scene), agentName, gender),
    tensionProse: personalizeLine(variant.tensionProse, agentName, gender),
    choices: variant.choices.map(choice => personalizeChoice(choice, agentName, gender)),
    stateSnapshot: snapshot,
    isOrdeal: phase === 'ordeal',
    tick,
    ...(scene ? { scene } : {}),
    ...(gender ? { agentGender: gender } : {}),
  };
}

/**
 * THR-2226 — the whole vision for a beat: the scene read, the vignette built in it,
 * and, on an Ordeal, its fitted roll. Shared by the tick phase and the debug lever
 * that opens a vision on demand, so both build the same thing.
 */
export function composeJourneyVignette(
  graph: WorldGraph,
  agentId: string,
  phase: CampbellianPhase,
  beatIndex: number,
  doomClockPercent: number,
  template: JourneyBeatTemplate,
  variant: BeatVariant,
  snapshot: StateSnapshot,
  tick: number,
  scene?: VisionScene,
): JourneyVignetteData {
  const agent = graph.getNode(agentId);
  const gender = typeof agent?.properties?.gender === 'string' ? agent.properties.gender : undefined;
  const data = buildVignetteData(
    agentId, agent?.name ?? '', phase, beatIndex, doomClockPercent, template, variant, snapshot, tick, scene, gender,
  );
  return attachOrdealRoll(graph, data);
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
  ordealResult?: Pick<OrdealRollResult, 'band' | 'outcome' | 'godPaid'> | null,
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

  // THR-2226 — the Ordeal's outcome comes from its roll, never from the choice
  // (Law 10). An old save's choice still carrying `ordealOutcome` is ignored; with no
  // roll, nothing is written and the Return reads its default (`scraped_through`).
  if (vignetteData.isOrdeal && ordealResult) {
    updatedProps.ordealOutcome = ordealResult.outcome;
    // THR-2229 — the band, whether the god paid and how hard it leaned, for the
    // Twilight's Ordeal line and the agency census (H6).
    updatedProps.ordealBand = ordealResult.band;
    updatedProps.ordealGodPaid = ordealResult.godPaid;
    updatedProps.ordealLean = choice?.effects.ordealLean ?? 0;
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

/** What a beat choice actually moved on the First, after clamping (THR-1854). */
export interface BeatChoiceEffectResult {
  agentId: string;
  choiceId: string;
  /** Applied axiological deltas — the change that landed, not the one declared. */
  axiological: Partial<Record<ValuePair, number>>;
  /** Applied raw `domainCapabilities` deltas. */
  reaches: Partial<Record<ReachDomain, number>>;
  /** The choice's reply line, shown to the player as the answer to the click. */
  consequenceProse: string | null;
}

/**
 * Apply a beat choice's declared shifts to the First (THR-1854).
 *
 * `applyBeatChoice` records the beat on the thread edge; this writes what the choice
 * does to the mortal herself, which nothing did before: `axiologicalShifts` move her
 * `axiologicalProfile` (clamped to [-1, 1], the meeting's rule), and `reachChanges`
 * move her raw `domainCapabilities` at the meeting's ×100 conversion
 * (`JOURNEY_REACH_CHANGE_RAW_SCALE`), floored at 0. Writes in place on the graph; the
 * caller bumps `worldVersion`.
 *
 * Emits one `journey.choice_applied` trace naming every delta that landed.
 *
 * Fail-soft (NFP #4): an unknown choice or a missing agent changes nothing and
 * returns null; a non-finite declared delta is skipped.
 */
export function applyBeatChoiceEffects(
  graph: WorldGraph,
  vignetteData: JourneyVignetteData,
  choiceId: string,
  tick: number,
): BeatChoiceEffectResult | null {
  const choice = vignetteData.choices.find(c => c.id === choiceId);
  const agent = graph.getNode(vignetteData.agentId);
  if (!choice || !agent) return null;

  const axiological: Partial<Record<ValuePair, number>> = {};
  const profile = { ...((agent.properties.axiologicalProfile as Partial<Record<ValuePair, number>>) ?? {}) };
  for (const [pair, shift] of Object.entries(choice.effects.axiologicalShifts ?? {})) {
    if (typeof shift !== 'number' || !Number.isFinite(shift)) continue;
    const key = pair as ValuePair;
    const before = profile[key] ?? 0;
    const after = Math.max(-1, Math.min(1, before + shift));
    profile[key] = after;
    if (after !== before) axiological[key] = after - before;
  }

  const reaches: Partial<Record<ReachDomain, number>> = {};
  const capabilities = { ...((agent.properties.domainCapabilities as Partial<Record<ReachDomain, number>>) ?? {}) };
  for (const [reach, change] of Object.entries(choice.effects.reachChanges ?? {})) {
    if (typeof change !== 'number' || !Number.isFinite(change)) continue;
    const key = reach as ReachDomain;
    const before = capabilities[key] ?? 0;
    const after = Math.max(0, before + change * JOURNEY_REACH_CHANGE_RAW_SCALE);
    capabilities[key] = after;
    if (after !== before) reaches[key] = after - before;
  }

  const changed = Object.keys(axiological).length > 0 || Object.keys(reaches).length > 0;
  if (changed) {
    graph.updateNode(agent.id, {
      properties: { axiologicalProfile: profile, domainCapabilities: capabilities },
    });
  }

  emitTrace({
    category: 'journey.choice_applied',
    tick,
    agentId: agent.id,
    summary: `${agent.name}'s journey choice "${choice.id}" (${vignetteData.templateId}/${vignetteData.variantKey}) `
      + (changed
        ? `moved ${[...Object.entries(axiological), ...Object.entries(reaches)]
          .map(([k, d]) => `${k} ${d > 0 ? '+' : ''}${Number(d).toFixed(2)}`).join(', ')}`
        : 'moved nothing on the First'),
    templateId: vignetteData.templateId,
    variantKey: vignetteData.variantKey,
    choiceId: choice.id,
    axiological,
    reaches,
  });

  return {
    agentId: agent.id,
    choiceId: choice.id,
    axiological,
    reaches,
    consequenceProse: choice.effects.consequenceProse ?? null,
  };
}

/**
 * The player's journey choice, written to the world (THR-1822 § D15): the thread
 * edge records the beat (`applyBeatChoice`), the choice's effects land on the
 * First (`applyBeatChoiceEffects`), and `worldVersion` bumps so every cached view
 * model re-reads — while paused, the moment the player acts. Returns false, writing
 * nothing, when the god holds no thread to the vignette's mortal.
 *
 * The essence price is the caller's: it is charged against GameState, not the graph.
 *
 * THR-2226: on an Ordeal the choice is a lean, and the roll happens here, at the
 * click (`rollOrdeal`, on the world `seed`). Its band is written to the thread edge,
 * where the vision's result line reads it (`readOrdealResult`).
 */
export function recordJourneyChoice(
  graph: WorldGraph,
  runtime: SimulationRuntime | null,
  ascendantId: string,
  vignetteData: JourneyVignetteData,
  choiceId: string,
  tick: number,
  seed = 0,
): boolean {
  const threadEdge = getThreadsFrom(graph, ascendantId).find(e => e.target === vignetteData.agentId);
  if (!threadEdge) return false;
  const ordealResult = vignetteData.isOrdeal
    ? rollOrdeal(graph, seed, ascendantId, vignetteData, choiceId, tick)
    : null;
  const { updatedProps } = applyBeatChoice(
    threadEdge.properties as unknown as ThreadEdgeProperties, vignetteData, choiceId, ordealResult,
  );
  graph.updateEdge(threadEdge.id, { properties: updatedProps });
  applyBeatChoiceEffects(graph, vignetteData, choiceId, tick);
  if (runtime) touchWorld(runtime);
  return true;
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
    // THR-2207: the step actually taken, which a doom_rate_multiplier scales.
    ? (doomClock.currentTick - (doomClock.lastStep ?? doomClock.tickModifier)) / doomClock.totalTicks
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
  let nextEventSeq = 0;

  for (const threadEdge of firstThreads) {
    const threadProps = threadEdge.properties as ThreadEdgeProperties;
    const agentNode = graph.getNode(threadEdge.target);
    if (!agentNode) continue;

    // Skip if this agent already has a pending vignette (waiting for player choice)
    if (newVignettes.some(v => v.data.agentId === threadEdge.target)) continue;

    const storyPhase = threadProps.storyPhase ?? 'call';
    const beatHistory = threadProps.beatHistory ?? [];

    const beatCheck = shouldBeatFire(doomProgress, prevDoomProgress, storyPhase, beatHistory, threadProps.journeyStartDoom);

    if (!beatCheck.shouldFire) continue;

    // THR-2234 — the Return waits for the First's Apotheosis: while the offer is due,
    // seeded or being played, the Return holds and fires the tick after it resolves
    // (the phase-entry rule re-checks every tick). Fail-soft: at the Doom cap the
    // Return fires anyway, so the age never ends without its last chapter.
    if (
      beatCheck.phase === 'return'
      && doomProgress < FIRST_RETURN_APOTHEOSIS_WAIT_DOOM_CAP
      && isFirstApotheosisPending(state, threadEdge)
    ) {
      emitTrace({
        category: 'journey.return_waits',
        tick,
        agentId: threadEdge.target,
        actorId: threadEdge.target,
        summary: `${agentNode.name}'s Return waits for the Apotheosis (Doom ${doomProgress.toFixed(3)})`,
        doomProgress,
      });
      continue;
    }

    // THR-2233 — the journey's floor: where the Doom stood at this First's first vision.
    if (beatHistory.length === 0 && threadProps.journeyStartDoom == null) {
      graph.updateEdge(threadEdge.id, { properties: { journeyStartDoom: doomProgress } });
      const startPhase = getJourneyPhase(doomProgress);
      const skipped = beatsBeforeJourney(getBeatThresholds(startPhase), doomProgress);
      emitTrace({
        category: 'journey.start_floor',
        tick,
        agentId: threadEdge.target,
        summary: `${agentNode.name}'s journey begins at Doom ${doomProgress.toFixed(3)} in the ${formatPhaseName(startPhase)}`
          + (skipped > 0 ? `; ${skipped} ${formatPhaseName(startPhase)} vision(s) passed before the bond and will not play` : ''),
        actorId: threadEdge.target,
        journeyStartDoom: doomProgress,
        phase: startPhase,
        skippedBeats: skipped,
      });
    }

    // ── Return Phase: trigger convergence algorithm instead of normal vignette ──
    if (beatCheck.phase === 'return') {
      const returnResult = executeReturn(state, threadEdge.target, threadEdge.id, threadProps);

      // Add return events
      newEvents.push(...returnResult.events);

      // Update thread edge with return state
      graph.updateEdge(threadEdge.id, {
        properties: { ...returnResult.threadUpdate },
      });

      // THR-2228 — the last days, named: time left in the Doom panel's words, and
      // whether another mortal can still carry the thread before the age ends.
      const doomTicksRemaining = Math.max(0, doomClock.totalTicks - doomClock.currentTick);
      // The Return cooldown is in game ticks; the Doom moves `lastStep` units per game
      // tick (a nudge can speed or slow it), so compare in game ticks at its current pace.
      const doomStep = doomClock.lastStep ?? doomClock.tickModifier;
      const gameTicksUntilAgeEnds = Number.isFinite(doomStep) && doomStep > 0
        ? doomTicksRemaining / doomStep
        : doomTicksRemaining;
      const remainingLine = buildReturnRemainingLine({
        firstName: agentNode.name,
        doomTicksRemaining,
        threadOpen: isFirstSlotOpenBeforeAgeEnds(graph, ascendantId, returnResult.result.cooldownTicks, gameTicksUntilAgeEnds),
      });

      // Build a special return vignette for the UI to display
      const returnVignetteData: JourneyVignetteData = {
        closeLabel: RETURN_CLOSE_LABEL,
        remainingLine,
        agentId: threadEdge.target,
        agentName: agentNode.name,
        phase: 'return',
        doomClockPercent: doomProgress,
        beatIndex: 0,
        templateId: 'return_convergence',
        variantKey: returnResult.result.outcome,
        setupProse: returnResult.result.returnProse,
        tensionProse: returnResult.result.rippleResults.map(r => r.prose).join('\n\n'),
        choices: [], // No choices — the Return is algorithmic
        stateSnapshot: buildStateSnapshot(graph, threadEdge.target, threadProps),
        isOrdeal: false,
        tick,
      };

      newVignettes.push({
        id: `vignette_return_${threadEdge.target}_${tick}`,
        data: returnVignetteData,
        priority: 100,
        queuedTick: tick,
      });

      // Store the return result on the pending vignette for UI consumption
      // The UI can read returnOutcome from variantKey

      continue; // Skip normal vignette flow
    }

    // ── Normal beat flow (Call, Road of Trials, Crisis, Ordeal) ──

    // Build state snapshot
    const snapshot = buildStateSnapshot(graph, threadEdge.target, threadProps);

    // THR-2226 — where the First is and what they are doing, read before the pick.
    const scene = readVisionScene(graph, threadEdge.target, state.strategicState);

    // Select template + variant
    const beatSeed = hashSeed(seed, threadEdge.target, beatCheck.phase, beatCheck.beatIndex);
    const selection = selectTemplate(templates, beatCheck.phase, snapshot, beatSeed, beatHistory, scene);

    if (!selection) {
      // Fail-soft: no template available, skip this beat
      continue;
    }

    const { template, variant } = selection;

    emitTrace({
      category: 'journey.vision_scene',
      tick,
      agentId: threadEdge.target,
      summary: `${agentNode.name}'s ${formatPhaseName(beatCheck.phase)} vision reads ${scene.activity}`
        + `${scene.placeName ? ` at ${scene.placeName}` : ''}: ${template.id}/${variant.key} (${sceneFit(variant, scene.activity)})`,
      actorId: threadEdge.target,
      activity: scene.activity,
      placeId: scene.placeId,
      variantKey: variant.key,
      fit: sceneFit(variant, scene.activity),
    });

    // Build vignette data — on an Ordeal, with its fitted roll (THR-2226)
    const vignetteData = composeJourneyVignette(
      graph,
      threadEdge.target,
      beatCheck.phase,
      beatCheck.beatIndex,
      doomProgress,
      template,
      variant,
      snapshot,
      tick,
      scene,
    );

    // Queue the vignette
    const vignetteId = `vignette_${threadEdge.target}_${tick}_${beatCheck.phase}`;
    newVignettes.push({
      id: vignetteId,
      data: vignetteData,
      priority: 100, // The First always gets max priority
      queuedTick: tick,
    });

    // Update story phase on the thread edge — to the phase of the beat that fired
    // (THR-2233: a missed Ordeal fired in the Return phase records 'ordeal', so the
    // Return still arrives as the next phase entry once the Ordeal is answered).
    const newPhase = beatCheck.phase;
    if (newPhase !== storyPhase) {
      // Phase transition event
      newEvents.push({
        id: `evt_journey_${tick}_${nextEventSeq++}`,
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
      id: `evt_journey_${tick}_${nextEventSeq++}`,
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
