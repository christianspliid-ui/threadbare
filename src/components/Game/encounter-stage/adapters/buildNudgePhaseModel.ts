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
import { formatEssenceLabel } from '../../../shared/formatEssence';
import type { GameState } from '../../../../types/gameState';
import type { SphereName } from '../../../../types/index';
import { toHungerId } from '../../../../types/hunger';
import {
  buildRepertoire,
  echoCardsFromDefinitions,
} from '../../../../engine/nudgeCardRepertoire';
import type { ResolutionInput } from '../../../../types/resolution';
import type { ForecastTier } from '../../../../types/traces/encounter-traces';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { isActionStepBranch } from '../../../../types/unifiedAction';
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
  effectiveNudgeCost,
  priorStepOutcome,
  resolveCarryoverLine,
  resolveTraitVariants,
  sumModifiers,
  sumVariantDifficultyDelta,
  totalNudgeCost,
  type NudgeBlockedCode,
} from '../../../../engine/encounters/nudges';
import {
  deriveStepFactorLines,
  deriveWhisperRevealLine,
  type WhisperNextStep,
} from '../../../../engine/encounters/stepFactorLines';
import {
  NUDGE_COST_CHANNEL_DISPLAY,
  nudgeCardKeyword,
  type NudgeCostChannelId,
} from '../../../../data/nudge-card-display';
import {
  classifyMotive,
  readMotiveReceipt,
  type MotiveSource,
} from '../../../../engine/encounters/motiveClassifier';
import { computeForecast } from '../../../../engine/encounters/outcomeForecast';
import { adaptUnifiedActionTemplateToEncounterContract } from '../../../../engine/encounter-contract-adapter';
import {
  enrichProse,
  gatherNarrativeContext,
  type NarrativeContext,
} from '../../../../engine/proseEnrichment';
import type { SimulationRuntime } from '../../../../engine/simulationRuntime';
import {
  FORECAST_TIER_WORDS,
  MOTIVE_CHIP_LABELS,
  MOTIVE_FALLBACK_SENTENCES,
  MOTIVE_INTRO_VARIANTS,
  MOTIVE_MISSION_FALLBACK,
  NUDGE_BLOCKED_REASONS,
  NUDGE_FREE_COST_LABEL,
  NUDGE_RIDER_LABELS,
} from '../../../../data/nudge-stage-content';
import { SPHERE_NAMES } from '../../../../types/index';
import type {
  EncounterStageCostChannelModel,
  EncounterStageFactorLineModel,
  EncounterStageForecastModel,
  EncounterStageNudgeCardModel,
  EncounterStageNudgePhaseModel,
  EncounterStageWithheldNudgeModel,
} from '../types';

/**
 * Stand-in when the acting node has no resolvable name, so a motive intro line
 * substitutes a noun rather than leaking `{actor}` onto the stage (NFP #4).
 */
const MOTIVE_ACTOR_FALLBACK = 'The mortal';

/** Contribution kinds that read as assigned work — the errand `{mission}` names. */
const MOTIVE_MISSION_KINDS: ReadonlySet<string> = new Set([
  'ambition',
  'chain',
  'reputation',
  'bond',
]);

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
  /**
   * THR-923 — the enrichment context authored nudge prose is resolved against.
   *
   * Optional so no caller *breaks*, but never load-bearing: absent, the builder
   * gathers its own from `graph` + the acting id. Enrichment is therefore a
   * property of this builder rather than of remembering to pass something, which
   * is the whole reason the gap existed — every field below was assigned straight
   * off the template and no caller had a reason to notice.
   */
  narrativeContext?: NarrativeContext;
  /** Phrase-dedup history for `{outcome_phrase}` / `{q_flavor}`; fail-soft when absent. */
  runtime?: SimulationRuntime;
  /**
   * Build the phase even when this step authored no nudges (THR-1121).
   *
   * The caller sets this when the step has nothing else to offer either — no
   * authored choices, and no generic stance set now that
   * `generateInterventionChoices` is retired. The result is the stage's
   * **fate-alone** screen: the motive line, the test panel, `Nothing here answers
   * to you. Let it play out.` in place of the hand, and `Let fate decide` as the
   * only move.
   *
   * That is the Nudge Model working rather than a gap — a step where the god has
   * no purchase is a real state the model is *for*, and it now reads that way
   * instead of falling back to a paid stance triple. Left `false`, the builder
   * keeps its original bail so a step with an authored *choice* hand still gets
   * the choice screen (30 templates rely on it, pending WS5 conversion).
   */
  allowEmptyHand?: boolean;
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
  // THR-1006 — never interpolate the raw float: accumulated fractional costs
  // reach this as `193.60000000000005`.
  return formatEssenceLabel(cost);
}

/**
 * THR-890 — the non-essence prices a card charges, in display form.
 *
 * A zero delta contributes no row: an authored `{ doomDelta: 0 }` is a channel
 * the card declared and then did not use, and drawing it would promise a price
 * that never arrives. Direction, not just sign, picks the wording — a card that
 * *slows* the doom clock is charging nothing and should not read as a cost.
 */
function costChannelsFor(nudge: StepNudge): EncounterStageCostChannelModel[] | undefined {
  const costs = nudge.costs;
  if (!costs) return undefined;

  const deltas: readonly [NudgeCostChannelId, number | undefined][] = [
    ['detection', costs.detectionDelta],
    ['doom', costs.doomDelta],
  ];

  const channels: EncounterStageCostChannelModel[] = [];
  for (const [id, delta] of deltas) {
    if (delta === undefined || delta === 0) continue;
    const display = NUDGE_COST_CHANNEL_DISPLAY[id][delta > 0 ? 'worse' : 'better'];
    channels.push({ id, icon: display.icon, label: display.label, delta });
  }
  return channels.length > 0 ? channels : undefined;
}

/**
 * One authored option as a card the row can draw.
 *
 * Shared by the playable and dimmed passes so the two can never drift on price,
 * keyword, or cost channels — the only thing that differs between them is the
 * `state`/`blocked` pair the caller supplies.
 *
 * **Price is the effective price.** `effectiveNudgeCost` is what `buildNudgeHand`
 * used to judge affordability and what `totalNudgeCost` will charge at commit, so
 * anything else here would quote one number and bill another (THR-885's whole
 * reason for exporting that helper).
 *
 * **Every authored string leaves here enriched (THR-923).** `name`, `fiction` and
 * `effectLine` are authored prose and carry the same placeholder vocabulary the
 * rest of the encounter does; assigning them straight off the template shipped
 * literal `{they}` / `{actor}` onto the stage. `fiction` is already the
 * setting-resolved string by this point — `buildNudgeHand` folds `fictionBySetting`
 * into it — so enriching here covers the variant as well as the default.
 */
export function buildNudgeCardModel(
  nudge: StepNudge,
  accessibleSpheres: readonly SphereName[],
  state: 'playable' | 'dimmed',
  enrich: (text: string) => string,
  blocked?: NudgeBlockedCode,
): EncounterStageNudgeCardModel {
  const cost = effectiveNudgeCost(nudge, accessibleSpheres);
  const keyword = nudgeCardKeyword(nudge.libraryCardId);
  return {
    id: nudge.id,
    libraryCardId: nudge.libraryCardId,
    keyword: keyword?.keyword,
    keywordIcon: keyword?.icon,
    name: enrich(nudge.name),
    fiction: enrich(nudge.fiction),
    effectLine: enrich(nudge.effectLine),
    essenceCost: cost,
    discounted: cost < Math.max(0, nudge.essenceCost),
    costLabel: costLabelFor(cost),
    costChannels: costChannelsFor(nudge),
    sphere: nudge.sphere,
    imageTag: nudge.imageTag,
    state,
    blockedCode: blocked,
    blockedReason: blocked ? NUDGE_BLOCKED_REASONS[blocked] : undefined,
    riderLabel: nudge.rider ? NUDGE_RIDER_LABELS[nudge.rider] : undefined,
    forecastDelta: nudge.forecastDelta,
  };
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
 * The named errand behind a `mission`-classified motive, for `{mission}`.
 *
 * Reads the heaviest mission-kind contribution's provenance node and returns its
 * name. Fail-soft at every hop (NFP #4): no receipt, no mission contribution, no
 * node id, or a node the graph has since culled all yield `undefined`, and the
 * caller substitutes {@link MOTIVE_MISSION_FALLBACK} rather than leaking a raw
 * placeholder onto the stage.
 */
function missionNameFor(
  graph: WorldGraph,
  receipt: ReturnType<typeof readMotiveReceipt>,
): string | undefined {
  const contributions = receipt?.contributions;
  if (!contributions || contributions.length === 0) return undefined;

  let best: { weight: number; nodeId: string } | undefined;
  for (const c of contributions) {
    if (!MOTIVE_MISSION_KINDS.has(c.kind)) continue;
    const nodeId = c.provenance?.nodeId;
    if (!nodeId) continue;
    if (!best || c.weight > best.weight) best = { weight: c.weight, nodeId };
  }
  if (!best) return undefined;

  const name = graph.getNode(best.nodeId)?.name;
  return name && name.length > 0 ? name : undefined;
}

/**
 * FNV-1a, 32-bit. Deterministic; same input → same output, every session.
 *
 * **Not `hashEntityId` (djb2), and the difference is load-bearing.** djb2's
 * multiplier is 33, and 33 ≡ 0 (mod 3) — so every positional term above the last
 * character vanishes modulo 3, and any two seeds differing only in an earlier
 * character land on the *same* index. The intro pools are exactly 3 variants
 * long, so djb2 pinned every encounter to one line: 24 distinct action ids
 * selected one variant, which the variant-spread test caught. The same trap waits
 * at any pool length divisible by 3 or 11. FNV-1a's 16777619 multiplier is
 * coprime to both and mixes into the low bits, so a small modulo stays uniform.
 *
 * djb2 remains correct where it is used today — `gradientIndexForId` takes it
 * modulo a gradient count with no such factor.
 */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Pick and fill this encounter's motive intro line.
 *
 * **Deterministic by construction (NFP #3).** The variant index is a hash of the
 * action id and step index, so the same encounter opens with the same line in
 * every session and on every re-render. No rng draw is taken here; taking one
 * would make the opening line of a scene differ between the forecast the player
 * read and the stage they are looking at.
 *
 * Substitution is total: every placeholder resolves to a real string, so the
 * Done-when's "no raw `{actor}` leaks" holds even when the graph knows neither
 * the actor's name nor the errand's.
 */
function motiveIntroLine(args: {
  source: MotiveSource;
  actorName?: string;
  missionName?: string;
  seed: string;
}): string {
  const variants = MOTIVE_INTRO_VARIANTS[args.source];
  const template = variants[hashSeed(args.seed) % variants.length];
  const values: Record<string, string> = {
    actor: args.actorName && args.actorName.length > 0 ? args.actorName : MOTIVE_ACTOR_FALLBACK,
    mission: args.missionName ?? MOTIVE_MISSION_FALLBACK,
  };
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
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
 * What the step after `currentStep` demands, as far as it can honestly be read.
 *
 * A branch entry resolves to `unsettled` rather than being unwrapped: which
 * variant runs depends on how the current step lands, so its reach and
 * difficulty are not facts yet. Reading one anyway would let the Whisper quote a
 * demand the encounter may never make.
 */
function readNextStepDemand(
  template: UnifiedActionTemplate,
  currentStep: number,
): WhisperNextStep {
  const next = template.steps?.[currentStep + 1];
  if (!next) return { kind: 'none' };
  if (isActionStepBranch(next)) return { kind: 'unsettled' };
  return { kind: 'demand', reach: next.reach, difficulty: next.difficulty };
}

/**
 * Build the stage's nudge phase, or `undefined` when this step has no authored
 * hand and the caller has something else to render — the caller branches on that
 * to keep authored-choice templates on the choice screen (per-template rollout,
 * no flag day). With `allowEmptyHand`, an unauthored step builds anyway and
 * renders fate-alone (THR-1121).
 *
 * Fail-soft (NFP #4): a missing agent node, an absent essence pool, and a
 * throwing motive classification all degrade to a rendered stage rather than a
 * blank one. Nothing here can throw into the tick loop — it runs in the UI.
 */
export function buildNudgePhaseModel(
  args: BuildNudgePhaseModelArgs,
): EncounterStageNudgePhaseModel | undefined {
  const { template, activeAction, step, graph, gameState } = args;

  // THR-1121 — normalized to an array rather than left possibly-undefined. The
  // early return below used to guarantee non-emptiness for everything after it,
  // so the withheld-card pass further down dereferences this directly; with
  // `allowEmptyHand` that guarantee is gone and an unauthored step would throw
  // there instead of rendering fate-alone.
  const authored = step.nudges ?? [];
  if (authored.length === 0 && !args.allowEmptyHand) return undefined;

  const actorId = activeAction.actorId;

  // THR-923 — every authored string this builder emits goes through here.
  //
  // The gap this closes was structural, not a typo: the nudge adapter assigned
  // card fiction, effect lines, factor lines and the purpose line straight off
  // the template, so an encounter that resolved `{they}` correctly in its header
  // (built by `buildUnifiedEncounterStageModel`, which does enrich) shipped the
  // raw token two inches below it on the same card. Reusing the caller's context
  // when it threads one keeps this to zero extra graph traversals on the live
  // path; gathering our own otherwise means a test or a future caller cannot
  // silently reopen the hole.
  const ctx =
    args.narrativeContext ??
    gatherNarrativeContext(
      graph,
      actorId,
      undefined,
      undefined,
      undefined,
      gameState,
      undefined,
      {
        targetId: activeAction.targetId,
        supportBundle: template.supportBundle,
        supportBindings: activeAction.supportBindings,
        contextFragments: template.contextFragments,
        contextFragmentTemplateId: template.id,
      },
    );
  const enrich = (text: string): string => enrichProse(text, ctx, { runtime: args.runtime });

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
          // THR-891 — `hungerId` is stored dotted (`hunger.witness`) while the
          // library keys on the bare id. This was an `as HungerId` cast, which
          // type-checks and is false: the lookup missed for every god, so no
          // hunger unique was ever dealt. `toHungerId` is the real conversion.
          hunger: toHungerId(identity.hungerId),
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
  // THR-892 — the carryover line the prior step's band earned, if the author wrote
  // one. It contributes to the floor exactly as a trait variant does, so the hand
  // adds its selected deltas on top of a forecast that already carries it.
  const carryover = resolveCarryoverLine(step, priorStepOutcome(activeAction));
  const traitModifierTotal = sumModifiers(
    collectNudgeModifiers(step, undefined, variants, priorStepOutcome(activeAction)),
  );
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
    cards.push(buildNudgeCardModel(entry.nudge, accessibleSpheres, 'playable', enrich));
  }

  for (const entry of hand.dimmed) {
    const { nudge, blocked } = entry;
    if (blocked && WITHHELD_CODES.has(blocked)) {
      withheld.push({ id: nudge.id, name: enrich(nudge.name), blockedCode: blocked });
      continue;
    }
    cards.push(buildNudgeCardModel(nudge, accessibleSpheres, 'dimmed', enrich, blocked));
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
      factors.push({ id: `authored:${index}`, text: enrich(line.text), polarity: line.polarity });
    }
  } else {
    for (const [index, text] of authoredFactorLines(template, activeAction.currentStep,
      baseSummary.successProbability).entries()) {
      factors.push({ id: `authored:${index}`, text: enrich(text), polarity: 'neutral' });
    }
  }
  for (const variant of variants) {
    // A trait factor names its trait (canon rule 1). Polarity reads off the
    // trait's own contribution: easing the step or steepening it.
    const helps = (variant.forecastDelta ?? 0) >= 0 && (variant.difficultyDelta ?? 0) <= 0;
    factors.push({
      id: `trait:${variant.traitId}`,
      text: enrich(variant.factorLine),
      polarity: helps ? 'for' : 'against',
      source: `trait:${variant.traitId}`,
      // THR-892 — the model carries the number beside the text so the row can
      // draw pips. A variant that declares no delta contributes no pips rather
      // than a zero row.
      delta: variant.forecastDelta,
    });
  }

  // ── Derived lines (THR-892) ─────────────────────────────────────
  // The variance rule: a line earns its place only if it could have read
  // differently on another run. These are projections of the numbers resolution
  // already computed — `capability` and `standing.contributions` — so the panel
  // can never quote a factor the roll did not apply.
  //
  // Appended after the authored/trait lines so the encounter's own account leads
  // and the world's contribution follows.
  for (const line of deriveStepFactorLines({
    actorName: graph.getNode(actorId)?.name,
    reach: step.reach,
    capability,
    contributions: standing.contributions,
    carryover,
  })) {
    factors.push({
      id: line.id,
      text: line.text,
      polarity: line.polarity,
      source: line.source,
      delta: line.delta === 0 ? undefined : line.delta,
    });
  }

  // ── The Whisper's reveal (THR-1179) ─────────────────────────────
  // The one card that pays for a *line* rather than for odds. It renders only
  // once no matter how many Whispers are committed — a second copy of the same
  // sentence is not a second reveal, and the player should not be able to buy
  // the panel into repeating itself.
  //
  // Last in panel order on purpose: the reveal is about a step that has not
  // happened, so it reads as a glimpse past the end of the list rather than as
  // another factor bearing on this roll (it carries no delta and draws no pips).
  const revealsNextDemand = (activeAction.activeNudges ?? []).some(
    (id) => authored.find((n) => n.id === id)?.reveals === 'next_step_demand',
  );
  if (revealsNextDemand) {
    const line = deriveWhisperRevealLine({
      nextStep: readNextStepDemand(template, activeAction.currentStep),
      difficultyWord,
    });
    factors.push({
      id: line.id,
      text: enrich(line.text),
      polarity: line.polarity,
      source: line.source,
    });
  }

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
      // THR-972 — the line that introduces the scene, fully substituted here so
      // the shell never has to know about placeholders.
      introLine: motiveIntroLine({
        source,
        actorName: graph.getNode(actorId)?.name,
        missionName: missionNameFor(graph, receipt),
        seed: `${activeAction.actionId}:${activeAction.currentStep}`,
      }),
    };
  } catch {
    motive = {
      source: 'chance',
      chipLabel: MOTIVE_CHIP_LABELS.chance,
      sentence: MOTIVE_FALLBACK_SENTENCES.chance,
      introLine: motiveIntroLine({
        source: 'chance',
        seed: `${activeAction.actionId}:${activeAction.currentStep}`,
      }),
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
      purposeLine: step.purposeLine != null ? enrich(step.purposeLine) : undefined,
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
    // `accessibleSpheres` threaded through for the same reason the card models
    // quote the effective price: omitting it re-quotes a discounted hand at its
    // authored cost, so a reopened stage would report a total the commit path
    // never charged (THR-890).
    committedCost: totalNudgeCost(step, committedIds, accessibleSpheres),
  };
}
