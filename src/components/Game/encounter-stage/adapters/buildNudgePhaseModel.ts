/**
 * buildNudgePhaseModel — THR-775 (WS2 interface).
 *
 * Turns the WS0 engine substrate (`nudges.ts`, `motiveClassifier.ts`,
 * `outcomeForecast.ts`) into the stage's nudge phase. Pure and read-only: it
 * mutates nothing, takes no rng draw, and calls only functions resolution
 * itself calls, so the forecast word the player reads is the word resolution
 * will compute from the same inputs.
 *
 * **Render policy per `NudgeBlockedCode`** (the Vision audit's blocking find).
 * WS0 routes `essence_unavailable` into `dimmed`, and a player's budget moves
 * *inside* one encounter as they toggle spends — so hiding unaffordable cards
 * would make them flicker in and out mid-decision. Hence:
 *
 * | code | player stage | designer view |
 * |---|---|---|
 * | (none — playable) | rendered | rendered |
 * | `essence_unavailable` | dimmed, with its reason | rendered |
 * | `sphere_locked` | withheld (ruling 4) | listed |
 * | `unlock_missing` | withheld (ruling 4) | listed |
 * | `trait_missing` | never rendered | listed |
 *
 * Withholding sphere/unlock cards is a *deliberate divergence* from the v3
 * mockup, which dimmed them to teach the pool. That teaching role moves to the
 * designer view; the player stage keeps the replayability pool unspoiled.
 *
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § WS2
 */

import type { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { SphereName } from '../../../../types/index';
import type { HungerId } from '../../../../types/hunger';
import {
  buildRepertoire,
  echoCardsFromDefinitions,
} from '../../../../engine/nudgeCardRepertoire';
import type { ResolutionInput } from '../../../../types/resolution';
import type { ForecastTier } from '../../../../types/traces/encounter-traces';
import type {
  ActionStep,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { computeCapability } from '../../../../engine/domainCapability';
import { locationTypeFromProperties } from '../../../../engine/encounterCache';
import { settingClassForSubtype } from '../../../../data/settingClasses';
import { computeResolutionModifiers } from '../../../../engine/resolutionModifiers';
import { forecastAction } from '../../../../engine/resolutionService';
import {
  buildNudgeHand,
  collectHeldTraitIds,
  collectNudgeModifiers,
  difficultyWord,
  resolveTraitVariants,
  sumModifiers,
  sumVariantDifficultyDelta,
  totalNudgeCost,
  type NudgeBlockedCode,
} from '../../../../engine/encounters/nudges';
import { classifyMotive, readMotiveReceipt } from '../../../../engine/encounters/motiveClassifier';
import { computeForecast } from '../../../../engine/encounters/outcomeForecast';
import { adaptUnifiedActionTemplateToEncounterContract } from '../../../../engine/encounter-contract-adapter';
import { getDomainTier } from '../../../../data/domain-words';
import {
  FORECAST_TIER_WORDS,
  MOTIVE_CHIP_LABELS,
  MOTIVE_FALLBACK_SENTENCES,
  NUDGE_BLOCKED_REASONS,
  NUDGE_FREE_COST_LABEL,
  NUDGE_RIDER_LABELS,
} from '../../../../data/nudge-stage-content';
import { SPHERE_NAMES } from '../../../../types/index';
import type {
  EncounterStageFactorLineModel,
  EncounterStageForecastModel,
  EncounterStageNudgeCardModel,
  EncounterStageNudgePhaseModel,
  EncounterStageWithheldNudgeModel,
} from '../types';

/** Domain capability is 0–1; the reach word scales are indexed off 0–10. */
const CAPABILITY_TO_DOMAIN_SCALE = 10;

/** Reach art is 1-indexed on disk (`iron-1.png` … `iron-5.png`). */
const REACH_ICON_TIER_OFFSET = 1;

/**
 * Codes the player stage withholds entirely. `essence_unavailable` is
 * deliberately absent — see the render-policy table above.
 */
const WITHHELD_CODES: ReadonlySet<NudgeBlockedCode> = new Set([
  'sphere_locked',
  'unlock_missing',
]);

export interface BuildNudgePhaseModelArgs {
  template: UnifiedActionTemplate;
  activeAction: UnifiedAction;
  /** The resolved step definition for `activeAction.currentStep`. */
  step: ActionStep;
  graph: WorldGraph;
  gameState?: GameState;
}

/**
 * THR-884 — the `SettingClass` an in-flight encounter is playing out in.
 *
 * Walks the actor's `located_at` edge one tier at a time: an agent standing in a
 * sublocation resolves up to its parent location, because the setting envelope is a
 * property of the *place* (a temple), not of the room inside it. Returns undefined
 * off the authorable set, which is the `'*'` fallback rather than an error (NFP #4).
 */
function settingClassForAction(
  graph: WorldGraph,
  action: UnifiedAction,
): string | undefined {
  const actorId = action.actorId;
  if (!actorId) return undefined;
  const locatedAt = graph.getOutgoingEdges(actorId, 'located_at')[0];
  if (!locatedAt) return undefined;
  let node = graph.getNode(locatedAt.target);
  const parentId = node?.properties?.parentLocationId as string | undefined;
  if (parentId) node = graph.getNode(parentId) ?? node;
  return settingClassForSubtype(
    locationTypeFromProperties(node?.properties as Record<string, unknown> | undefined),
  );
}

/** Cost in words — a free (trait) option says so rather than showing a zero. */
function costLabelFor(cost: number): string | undefined {
  if (cost <= 0) return NUDGE_FREE_COST_LABEL;
  return `${cost} essence`;
}

function forecastModelFrom(tier: ForecastTier, probability: number): EncounterStageForecastModel {
  return { tier, word: FORECAST_TIER_WORDS[tier], probability };
}

/**
 * The encounter's own authored factor lines for this step, sliced by the same
 * probability-driven count rule the forecast phase applies. Fail-soft: a
 * template with no decodable contract, or a step past the end of the beat list,
 * contributes no lines rather than throwing.
 */
function authoredFactorLines(
  template: UnifiedActionTemplate,
  stepIndex: number,
  probability: number,
): readonly string[] {
  try {
    const contract = adaptUnifiedActionTemplateToEncounterContract(template);
    const beat = contract.encounter.beats[stepIndex];
    // `EncounterForecastFactors` is a tuple with optional tail entries, so the
    // holes are dropped before the pool is sliced.
    const pool = (beat?.forecast_factors ?? []).filter(
      (line): line is string => typeof line === 'string' && line.length > 0,
    );
    return computeForecast(
      { forecastFactors: pool },
      { baseProbability: probability, modifiers: [] },
    ).factors;
  } catch {
    return [];
  }
}

/**
 * Essence readable per sphere, with the ungated (common-pool) case summing the
 * whole pool. Mirrors the reader `__DEBUG.getEncounterNudges` uses so the hand
 * the bridge reports and the hand the stage renders can never disagree.
 */
function essenceReader(pool: Readonly<Record<string, number>> | undefined) {
  return (sphere: SphereName | undefined): number => {
    if (!pool) return 0;
    if (sphere) return pool[sphere] ?? 0;
    return Object.values(pool).reduce((sum, v) => sum + (v ?? 0), 0);
  };
}

/**
 * Build the stage's nudge phase, or `undefined` when this step has no authored
 * hand — the caller branches on that to keep legacy templates on the legacy
 * screen (per-template rollout, no flag day).
 *
 * Fail-soft (NFP #4): a missing agent node, an absent essence pool, and a
 * throwing motive classification all degrade to a rendered stage rather than a
 * blank one. Nothing here can throw into the tick loop — it runs in the UI.
 */
export function buildNudgePhaseModel(
  args: BuildNudgePhaseModelArgs,
): EncounterStageNudgePhaseModel | undefined {
  const { template, activeAction, step, graph, gameState } = args;

  const authored = step.nudges;
  if (!authored || authored.length === 0) return undefined;

  const actorId = activeAction.actorId;
  const heldTraits = collectHeldTraitIds(graph, actorId);
  const pool = gameState?.essencePool as Readonly<Record<string, number>> | undefined;
  const availableEssenceFor = essenceReader(pool);

  // Accessible spheres are the ones the ascendant actually holds essence in.
  // An empty/absent pool yields an empty list, which dims every sphere card
  // rather than throwing — the fail-soft path, not a special case.
  const accessibleSpheres = SPHERE_NAMES.filter((s) => (pool?.[s] ?? 0) > 0);

  // THR-887 — the god's repertoire, so an authored option signed by a sphere
  // this god does not hold is withheld rather than merely priced.
  //
  // Gated on a *present* `ascendantIdentity`, and deliberately left `undefined`
  // without one. A legacy archetype-based run has no sphere identity to read,
  // and defaulting it to "no spheres" would silently withhold every signature
  // card from those runs — a behavior change dressed as a fallback. Absent
  // identity ⇒ absent gate ⇒ today's behavior exactly (NFP #6).
  const identity = gameState?.ascendantIdentity;
  const repertoireCardIds = identity
    ? new Set(
        buildRepertoire({
          primary: identity.sphereAlignment?.primary,
          secondary: identity.sphereAlignment?.secondary,
          hunger: identity.hungerId as HungerId | undefined,
          unlockedActionIds: new Set(gameState?.unlockedActionIds ?? []),
          echoCards: echoCardsFromDefinitions(gameState?.echoDefinitions ?? []),
        }).map((entry) => entry.member.id),
      )
    : undefined;

  const hand = buildNudgeHand(step, template, {
    availableEssence: availableEssenceFor,
    accessibleSpheres,
    unlockedTemplateIds: new Set(gameState?.unlockedActionIds ?? []),
    heldTraits,
    repertoireCardIds,
    // THR-884 — the setting class the scene plays out in, so a card that authored
    // `fictionBySetting` shows the line written for *this* kind of place. Resolved
    // through the cache's own precedence helper, so it is the same class the
    // template was filtered in under. A card without variants is untouched, which
    // is why threading this changes no rendered output for today's corpus.
    settingClass: settingClassForAction(graph, activeAction),
  });

  const variants = resolveTraitVariants(template, heldTraits);

  // ── Forecast baseline ───────────────────────────────────────────
  // The same additive channel resolution uses: capability + standing modifiers
  // + trait-variant contribution. The *nudge* contribution is deliberately
  // excluded here — `forecastInput.actionModifiers` is the floor the hand adds
  // its selected deltas onto, so the hook can recompute without re-deriving
  // capability on every toggle.
  const capability = computeCapability(graph, actorId, step.reach);
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  const locationId = locEdges.length > 0 ? locEdges[0].target : '';
  const standing = computeResolutionModifiers(
    graph,
    actorId,
    locationId,
    step.reach,
    template.sphereAffinity,
  );
  const traitModifierTotal = sumModifiers(collectNudgeModifiers(step, undefined, variants));
  const variantDifficultyDelta = sumVariantDifficultyDelta(variants);
  const effectiveDifficulty = Math.max(0, Math.min(1, step.difficulty + variantDifficultyDelta));

  const forecastInput: ResolutionInput = {
    actorId,
    domain: step.reach,
    capability,
    difficulty: effectiveDifficulty,
    sphereFactor: 0,
    actionModifiers: standing.totalModifier + traitModifierTotal,
    // `collectTestShapers` returns `ResolvedTestShaper` (attachment-centric
    // field names) while `ResolutionInput` wants `ResolutionTestShaper`. The
    // two carry the same information under different names, so the mapping is
    // explicit rather than cast — a rename on either side should break here
    // loudly instead of silently dropping the shapers from the forecast.
    testShapers: (standing.testShapers ?? []).map((shaper) => ({
      sourceAttachmentId: shaper.attachmentId,
      sourceAttachmentName: shaper.attachmentName,
      trigger: shaper.trigger,
      steps: shaper.steps,
      maxMargin: shaper.maxMargin,
    })),
  };

  const baseSummary = forecastAction(forecastInput);
  const baseForecast = forecastModelFrom(
    baseSummary.forecastTier,
    baseSummary.successProbability,
  );

  // ── Cards ───────────────────────────────────────────────────────
  const cards: EncounterStageNudgeCardModel[] = [];
  const withheld: EncounterStageWithheldNudgeModel[] = [];

  for (const entry of hand.playable) {
    const { nudge } = entry;
    cards.push({
      id: nudge.id,
      libraryCardId: nudge.libraryCardId,
      name: nudge.name,
      fiction: nudge.fiction,
      effectLine: nudge.effectLine,
      essenceCost: nudge.essenceCost,
      costLabel: costLabelFor(nudge.essenceCost),
      sphere: nudge.sphere,
      imageTag: nudge.imageTag,
      state: 'playable',
      riderLabel: nudge.rider ? NUDGE_RIDER_LABELS[nudge.rider] : undefined,
      forecastDelta: nudge.forecastDelta,
    });
  }

  for (const entry of hand.dimmed) {
    const { nudge, blocked } = entry;
    if (blocked && WITHHELD_CODES.has(blocked)) {
      withheld.push({ id: nudge.id, name: nudge.name, blockedCode: blocked });
      continue;
    }
    cards.push({
      id: nudge.id,
      libraryCardId: nudge.libraryCardId,
      name: nudge.name,
      fiction: nudge.fiction,
      effectLine: nudge.effectLine,
      essenceCost: nudge.essenceCost,
      costLabel: costLabelFor(nudge.essenceCost),
      sphere: nudge.sphere,
      imageTag: nudge.imageTag,
      state: 'dimmed',
      blockedCode: blocked,
      blockedReason: blocked ? NUDGE_BLOCKED_REASONS[blocked] : undefined,
      riderLabel: nudge.rider ? NUDGE_RIDER_LABELS[nudge.rider] : undefined,
      forecastDelta: nudge.forecastDelta,
    });
  }

  // Trait-gated cards the agent cannot hold: never in the player stage, listed
  // for the designer so an authored-but-unreachable card stays visible to us.
  const byId = new Map(authored.map((n) => [n.id, n]));
  for (const id of hand.hidden) {
    withheld.push({
      id,
      name: byId.get(id)?.name ?? id,
      blockedCode: 'trait_missing',
    });
  }

  // ── Test panel ──────────────────────────────────────────────────
  // Authored factor lines first (the encounter's own account of the odds),
  // then the live trait-derived lines.
  //
  // THR-820 gave the step a `factorLines` field, so a nudge-native encounter
  // declares its own polarity and the panel colours authored lines the way it
  // colours a trait line. A step without it falls back to the contract's
  // `beat.forecast_factors` — the same authored pool `phaseAscendantHandFilter`
  // reads, sliced by the same `computeForecast` count rule, so the stage and
  // the notification never quote different numbers of factors. That pool is a
  // bare string tuple with no sign, hence `neutral`: claiming a polarity there
  // would invent information the encounter never stated.
  const factors: EncounterStageFactorLineModel[] = [];
  if (step.factorLines && step.factorLines.length > 0) {
    for (const [index, line] of step.factorLines.entries()) {
      factors.push({ id: `authored:${index}`, text: line.text, polarity: line.polarity });
    }
  } else {
    for (const [index, text] of authoredFactorLines(template, activeAction.currentStep,
      baseSummary.successProbability).entries()) {
      factors.push({ id: `authored:${index}`, text, polarity: 'neutral' });
    }
  }
  for (const variant of variants) {
    // A trait factor names its trait (canon rule 1). Polarity reads off the
    // trait's own contribution: easing the step or steepening it.
    const helps = (variant.forecastDelta ?? 0) >= 0 && (variant.difficultyDelta ?? 0) <= 0;
    factors.push({
      id: `trait:${variant.traitId}`,
      text: variant.factorLine,
      polarity: helps ? 'for' : 'against',
      source: `trait:${variant.traitId}`,
    });
  }

  const reachTier = getDomainTier(capability * CAPABILITY_TO_DOMAIN_SCALE);

  // ── Motive ──────────────────────────────────────────────────────
  // Fail-soft: any throw inside classification renders CHANCE with the generic
  // sentence rather than losing the header (plan's fail-soft table).
  let motive: EncounterStageNudgePhaseModel['motive'];
  try {
    const receipt = readMotiveReceipt(graph.getNode(actorId)?.properties);
    const source = classifyMotive(receipt, {
      playerSourced: activeAction.source === 'player',
    });
    motive = {
      source,
      chipLabel: MOTIVE_CHIP_LABELS[source],
      sentence: MOTIVE_FALLBACK_SENTENCES[source],
    };
  } catch {
    motive = {
      source: 'chance',
      chipLabel: MOTIVE_CHIP_LABELS.chance,
      sentence: MOTIVE_FALLBACK_SENTENCES.chance,
    };
  }

  const committedIds = [...(activeAction.activeNudges ?? [])];

  return {
    actionId: activeAction.actionId,
    templateId: template.id,
    stepIndex: activeAction.currentStep,
    motive,
    testPanel: {
      reach: step.reach,
      reachLabel: step.reach.charAt(0).toUpperCase() + step.reach.slice(1),
      reachIconUrl: `/assets/reaches/${step.reach}-${reachTier + REACH_ICON_TIER_OFFSET}.png`,
      purposeLine: step.purposeLine,
      difficultyWord: difficultyWord(effectiveDifficulty),
      difficultyValue: effectiveDifficulty,
      factors,
    },
    baseForecast,
    forecastInput,
    traitModifierTotal,
    cards,
    withheld,
    committedIds,
    availableEssence: availableEssenceFor(undefined),
    committedCost: totalNudgeCost(step, committedIds),
  };
}
