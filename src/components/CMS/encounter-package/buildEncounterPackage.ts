/**
 * The Package View's model builder — THR-1046, Encounter Factory item 4.
 *
 * Plan: `Docs/plans/2026-08-08-encounter-factory-workflow.md` §3 item 4.
 * Christian's requirement, verbatim: *"a way of easily being able to see the
 * entire encounter content package."*
 *
 * **What this is.** One pure function turning a `UnifiedActionTemplate` into
 * every composed block, *resolved* — image tags become the paths they actually
 * hit, a seed's `templateId` becomes the target encounter's name, a card's
 * `libraryCardId` becomes its keyword, an aftermath's `byOutcome` becomes a
 * variant × band matrix. The surface then draws the model and adds no lookups of
 * its own.
 *
 * **Why resolved and not raw.** A designer reading raw template source already
 * has the file; what the file cannot tell them is what the *engine* will make of
 * it. `imageTag: 'generic.focus'` is either a manifest hit, a scored fallback, or
 * a category generic, and only the resolver knows which — which is precisely the
 * class of gap (declared-but-unresolving) the composition audit found. So every
 * block here reports its **resolution source**, not merely its authored value.
 *
 * **Pure, and no graph.** Templates plus committed catalogs, nothing live: the
 * CMS runs with no game state, and a package must render identically from a
 * shareable URL on a cold load. That also makes the whole model testable without
 * a world (`__tests__/buildEncounterPackage.test.ts`).
 *
 * **The verdict is not re-derived here.** `checkCompositionContract` (THR-1045)
 * is the single owner of what composition-complete means; this module calls it
 * and groups its violations by block. A second predicate over the same corpus is
 * the drift shape `check:predicate-copies` exists to prevent.
 */

import type {
  ActionStep,
  AftermathVariant,
  EncounterAftermathChange,
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  StepNudge,
  StepOutcome,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { isActionStepBranch } from '../../../types/unifiedAction';
import type {
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../../types/encounter';
import type { RewardPoolRecipe } from '../../../types/attachments';
import type { ReachDomain } from '../../../types/traits';
import type { SphereName } from '../../../types/index';
import {
  resolveEncounterImage,
  type EncounterImageSource,
} from '../../../data/encounterImageResolver';
import { UNIFIED_ACTION_TEMPLATES } from '../../../data/unified-action-templates';
import { withDefaultSupportBundle } from '../../../data/default-support-bundles';
import { difficultyWord } from '../../../engine/encounters/nudges';
import {
  checkCompositionContract,
  type CompositionBlock,
  type CompositionReport,
  type SystemConnection,
} from '../../../data/content-eval/compositionContract';
import { RETROFIT_PENDING } from '../../../data/content-eval/retrofitPending';
import { buildNudgeCardModel } from '../../Game/encounter-stage/adapters/buildNudgePhaseModel';
import type { EncounterStageNudgeCardModel } from '../../Game/encounter-stage/types';

// ─── Constants (NFP #1) ──────────────────────────────────────────────

/**
 * Packages a batch view renders side by side. Ruling 1 sets the batch at six;
 * this is that number as a *ceiling* on the URL, so a hand-written `?batch=` with
 * twenty ids draws six rather than melting the layout.
 */
export const PACKAGE_BATCH_MAX = 6;

/**
 * Afterimage bands the step block renders, in ladder order.
 *
 * Deliberately not `StepOutcome`'s full six: `near_miss` has no authored
 * afterimage field on `ActionStep` (it falls back to the success line), so
 * listing it would draw a row nobody can author.
 */
export const AFTERIMAGE_BANDS: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'failure',
  'critical_failure',
];

/**
 * Bands the aftermath matrix shows a row for — **every** band `byOutcome` accepts.
 *
 * This is `UnifiedActionOutcome`, the seven-value union `UnifiedAction.outcome`
 * carries, and deliberately **not** the six-value `StepOutcome` used for
 * afterimages above. The two overlap on six names and differ on two, which is
 * exactly why they get separate lists here: `near_miss` is a `StepOutcome` and not
 * an outcome band (a near miss advances the step, so the *action* resolves as a
 * success), while `contested_won` / `contested_lost` are outcome bands with no step
 * equivalent. Typing this list as the wrong union type-checks and then draws rows
 * nobody can author — the trap `AftermathOutcomeOverride`'s own doc comment warns
 * about.
 */
export const AFTERMATH_BANDS: readonly UnifiedActionOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'contested_won',
  'failure',
  'contested_lost',
  'critical_failure',
];

// ─── Model ───────────────────────────────────────────────────────────

/** One authored image reference and what it actually resolves to. */
export interface PackageImage {
  /** Where in the package this art is used — `step 0 illustration`, `card <id>`. */
  readonly where: string;
  /** The authored tag, when there was one. */
  readonly tag?: string;
  /** Resolved path, or `null` when the chain ended at the EntityVisual fallback. */
  readonly path: string | null;
  /** Which rung of the resolver produced it — the honesty this block exists for. */
  readonly source: EncounterImageSource;
  /** Manifest row id, when a row was involved. */
  readonly entryId?: string;
  /** True when the authored tag matched no manifest row (`exact_tag` missed). */
  readonly tagMissed: boolean;
}

/** One afterimage band on a step. */
export interface PackageAfterimage {
  readonly band: StepOutcome;
  readonly text?: string;
  /** False ⇒ the band falls back to the success/failure line with a `[band]` prefix. */
  readonly authored: boolean;
}

/** One nudge card, as the stage's own card row would draw it. */
export interface PackageCard {
  /** The stage card model — fed straight to the shared `NudgeCard` row. */
  readonly model: EncounterStageNudgeCardModel;
  readonly sphere?: SphereName;
  readonly libraryCardId?: string;
  /** Gate that hides this card when unmet, in words. Empty ⇒ always dealt. */
  readonly gates: readonly string[];
  /** Value-axis pole this card argues for, when it leans. */
  readonly lean?: string;
  /** World changes the card makes when committed (`grants`). */
  readonly grants: readonly EncounterAftermathReactionEffect[];
  /** Bands this card writes extra prose for. */
  readonly bandProse: readonly StepOutcome[];
  readonly art: PackageImage;
}

export interface PackageStep {
  readonly index: number;
  readonly reach: ReachDomain;
  /** Difficulty in words — the player-facing form (Law 13). */
  readonly difficultyWord: string;
  /** The raw number. Designer surface: the Law 13 trace/designer-view carve-out. */
  readonly difficulty: number;
  readonly purposeLine?: string;
  readonly narrative?: string;
  readonly failBehavior: string;
  readonly afterimages: readonly PackageAfterimage[];
  readonly factorLines: readonly { readonly text: string; readonly polarity: string }[];
  readonly cards: readonly PackageCard[];
  /** A branch node carries no prose or hand — it is drawn as a fork, not a step. */
  readonly branch?: {
    readonly onStep: number;
    readonly variantKeys: readonly string[];
    readonly decidedBy?: string;
  };
}

export interface PackageCastMember {
  readonly key: string;
  readonly supportRole: string;
  readonly spawnNpcRole: string;
  readonly spawnName?: string;
  readonly factionDefId?: string;
  readonly delivery: string;
  readonly persistence: string;
  readonly reuseNpcRoles: readonly string[];
  /**
   * True when this binding came from the family/setting default rather than the
   * template (THR-1044). The distinction matters to a reviewer: a defaulted cast
   * is real and spawns, but nobody wrote *this* scene's person.
   */
  readonly defaulted: boolean;
  readonly art: PackageImage;
}

export interface PackagePlace {
  readonly key: string;
  readonly sublocationTypeId: string;
  readonly fallbackName?: string;
  readonly delivery: string;
  readonly persistence: string;
  readonly defaulted: boolean;
}

export interface PackageReward {
  /** Where the recipe hangs — `step 0 success`, `step 1 failure`. */
  readonly where: string;
  readonly recipe: RewardPoolRecipe;
  /** Categories the pool draws from, weight-ordered. */
  readonly categories: readonly { readonly category: string; readonly weight: number }[];
}

/** One cell of the variant × band aftermath matrix. */
export interface PackageAftermathBand {
  readonly band: UnifiedActionOutcome;
  /** False ⇒ this band is unauthored and resolves to the variant's base ending. */
  readonly authored: boolean;
  readonly overview?: string;
  readonly changes: readonly EncounterAftermathChange[];
  readonly reactions: readonly EncounterAftermathReaction[];
}

export interface PackageAftermathVariant {
  /** `fallback`, or the choice id this variant is keyed to. */
  readonly key: string;
  readonly overview: string;
  readonly changes: readonly EncounterAftermathChange[];
  readonly reactionPrompt?: string;
  readonly reactions: readonly EncounterAftermathReaction[];
  readonly bands: readonly PackageAftermathBand[];
  /** How many of {@link AFTERMATH_BANDS} this variant authors. */
  readonly authoredBandCount: number;
}

export interface PackageSeed {
  readonly seedLabel: string;
  readonly delayTicks: number;
  readonly templateId?: string;
  /** Resolved target name, or `undefined` when the id names no live template. */
  readonly targetName?: string;
  /** True when `templateId` is set and resolves to nothing — a dead seed. */
  readonly targetMissing: boolean;
  readonly encounterFamily?: string;
  readonly inheritContext: boolean;
  /** Where the seed is planted — `fallback / critical_failure`, `step 0 success`. */
  readonly where: string;
}

/** Per-block pass/fail, as the Package View badges it. */
export interface PackageBlockVerdict {
  readonly block: CompositionBlock;
  readonly pass: boolean;
  readonly messages: readonly string[];
  /** Where the rule is written down — carried from the contract's violations. */
  readonly planSection?: string;
}

export interface PackageVerdict {
  readonly report: CompositionReport;
  readonly blocks: readonly PackageBlockVerdict[];
  readonly pass: boolean;
  /**
   * True when the template is on `RETROFIT_PENDING` — it predates the contract
   * and its failures do not fail CI. Shown, never hidden: a ratchet that is
   * invisible on the review surface is a ratchet nobody turns.
   */
  readonly retrofitPending: boolean;
}

export interface EncounterPackage {
  readonly templateId: string;
  readonly name: string;
  readonly spellName?: string;
  /** Id prefix — `encounter`, `mc`, `company`. */
  readonly family: string;
  readonly reach: ReachDomain;
  readonly rarityTier: number;
  readonly intrinsicTier: string;
  readonly scale: string;
  readonly description?: string;
  readonly settings: readonly string[];
  readonly openings: readonly { readonly settingClass: string; readonly text: string }[];
  readonly illustration: PackageImage;
  readonly steps: readonly PackageStep[];
  readonly cast: readonly PackageCastMember[];
  readonly places: readonly PackagePlace[];
  readonly rewards: readonly PackageReward[];
  readonly persistentEffects: readonly { readonly kind: string; readonly where: string }[];
  readonly aftermath: readonly PackageAftermathVariant[];
  readonly seeds: readonly PackageSeed[];
  readonly images: readonly PackageImage[];
  readonly systems: readonly SystemConnection[];
  readonly verdict: PackageVerdict;
  /** Every card in the package, for the batch view's variance read. */
  readonly cardCount: number;
}

// ─── Readers ─────────────────────────────────────────────────────────

const CONTRACT_BLOCKS: readonly CompositionBlock[] = [
  'steps',
  'hand',
  'setting',
  'cast',
  'rewards',
  'aftermath',
  'systems',
  'images',
];

/**
 * Effect kinds that leave something behind, for the rewards block's second half.
 *
 * Intentionally a *display* list, not a second copy of the contract's
 * `PERSISTENT_EFFECT_KINDS`: this decides what the surface labels "persistent",
 * while the contract decides whether the block passes. Were this the gate, it
 * would be a predicate copy; it is a caption, and it says so.
 */
const PERSISTENT_KINDS_SHOWN: ReadonlySet<string> = new Set([
  'spawn_artifact',
  'apply_condition',
  'condition_attachment',
  'assign_ambition',
  'grant_aspect',
  'unlock_action',
  'hidden_mark',
  'axiological_mark_apply',
  'secret_discovery',
  'spawn_clue',
  'spawn_unique_location',
  'encounter_seed',
  'bond_change',
  'thread_strengthen',
  'thread_weaken',
  'thread_break',
  'thread_branch',
  'favor_creation',
  'signature_warhost',
]);

/** Plain steps only, paired with their index in the authored array. */
function indexedSteps(
  template: UnifiedActionTemplate,
): readonly { readonly index: number; readonly step: ActionStep }[] {
  const out: { index: number; step: ActionStep }[] = [];
  (template.steps ?? []).forEach((step, index) => {
    if (!isActionStepBranch(step)) out.push({ index, step });
  });
  return out;
}

/** Resolve one image reference, reporting which rung answered. */
function imageFor(args: {
  where: string;
  tag?: string;
  specificUrl?: string | null;
  kind?: 'nudge' | 'scene';
  sphere?: SphereName;
  reach?: ReachDomain;
}): PackageImage {
  const resolved = resolveEncounterImage({
    tag: args.tag,
    specificUrl: args.specificUrl,
    kind: args.kind,
    sphere: args.sphere,
    reach: args.reach,
  });
  return {
    where: args.where,
    tag: args.tag,
    path: resolved.path,
    source: resolved.source,
    entryId: resolved.entry?.id,
    // A tag that was authored and did not produce an `exact_tag` hit missed the
    // manifest — whatever the later rungs then found for it.
    tagMissed: args.tag !== undefined && resolved.source !== 'exact_tag',
  };
}

/** The gates that hide a card, in words. */
function cardGates(nudge: StepNudge): readonly string[] {
  const gates: string[] = [];
  if (nudge.sphere) gates.push(`sphere · ${nudge.sphere}`);
  if (nudge.requiredTrait) gates.push(`trait · ${nudge.requiredTrait}`);
  if (nudge.requiredUnlock) gates.push(`unlock · ${nudge.requiredUnlock}`);
  if (nudge.requiresGroup) gates.push('in a company');
  if (nudge.requiresFavor) gates.push('owed a favor');
  return gates;
}

/**
 * A card's pole lean as one readable phrase.
 *
 * `StepNudgePoleLean` has three authoring forms — the shorthand `'a' | 'b'`, an
 * axis+pole object, and a route key — so this reads all three rather than the one
 * the first template happened to use.
 */
function cardLean(nudge: StepNudge): string | undefined {
  const lean = nudge.poleLean;
  if (lean === undefined) return undefined;
  if (typeof lean === 'string') return `pole ${lean}`;
  if ('route' in lean) return `route ${lean.route}`;
  return `${lean.axis} → ${lean.toward}`;
}

/** Every aftermath variant, keyed — choice variants first, then the fallback. */
function keyedVariants(
  template: UnifiedActionTemplate,
): readonly { readonly key: string; readonly variant: AftermathVariant }[] {
  const config = template.aftermathConfig;
  if (!config) return [];
  const out = Object.entries(config.variants ?? {}).map(([key, variant]) => ({ key, variant }));
  if (config.fallback) out.push({ key: 'fallback', variant: config.fallback });
  return out;
}

/** Reactions authored on a variant and inside each of its bands, with locations. */
function reactionSites(
  template: UnifiedActionTemplate,
): readonly { readonly reaction: EncounterAftermathReaction; readonly where: string }[] {
  const out: { reaction: EncounterAftermathReaction; where: string }[] = [];
  for (const { key, variant } of keyedVariants(template)) {
    for (const reaction of variant.reactions ?? []) out.push({ reaction, where: key });
    for (const [band, override] of Object.entries(variant.byOutcome ?? {})) {
      for (const reaction of override?.reactions ?? []) {
        out.push({ reaction, where: `${key} / ${band}` });
      }
    }
  }
  return out;
}

/** Every authored effect with the site that carries it. */
function effectSites(
  template: UnifiedActionTemplate,
): readonly { readonly effect: EncounterAftermathReactionEffect; readonly where: string }[] {
  const out: { effect: EncounterAftermathReactionEffect; where: string }[] = [];
  for (const { reaction, where } of reactionSites(template)) {
    for (const effect of reaction.effects) out.push({ effect, where });
  }
  for (const { index, step } of indexedSteps(template)) {
    for (const effect of step.successMetadata?.effects ?? []) {
      out.push({ effect, where: `step ${index} success` });
    }
    for (const effect of step.failureMetadata?.effects ?? []) {
      out.push({ effect, where: `step ${index} failure` });
    }
    for (const nudge of step.nudges ?? []) {
      for (const effect of nudge.grants ?? []) {
        out.push({ effect, where: `step ${index} card ${nudge.id}` });
      }
    }
  }
  return out;
}

// ─── Builder ─────────────────────────────────────────────────────────

/**
 * Build the full package model for one template.
 *
 * Fail-soft throughout (NFP #4): a template missing any block yields an empty
 * section plus a contract violation, never an exception. This renders content
 * authored by agents, so a malformed template must be *visible*, not fatal.
 */
export function buildEncounterPackage(
  rawTemplate: UnifiedActionTemplate,
): EncounterPackage {
  // The registry already merges defaults, but a template handed in directly
  // (a test, a fixture) has not been through that pass. Merging here makes the
  // model identical either way, and `defaulted` below reports which happened.
  const declaredBundle = rawTemplate.supportBundle ?? [];
  const template = declaredBundle.length > 0
    ? rawTemplate
    : withDefaultSupportBundle(rawTemplate);
  const bundleDefaulted = declaredBundle.length === 0
    && (template.supportBundle?.length ?? 0) > 0;

  const images: PackageImage[] = [];

  const illustration = imageFor({
    where: 'scene illustration',
    specificUrl: template.illustrationUrl,
    kind: 'scene',
    reach: template.reach,
  });
  images.push(illustration);

  // ── Steps ──────────────────────────────────────────────────────────
  const steps: PackageStep[] = (template.steps ?? []).map((raw, index): PackageStep => {
    if (isActionStepBranch(raw)) {
      return {
        index,
        reach: raw.fallback?.reach ?? template.reach,
        difficultyWord: difficultyWord(raw.fallback?.difficulty ?? 0),
        difficulty: raw.fallback?.difficulty ?? 0,
        failBehavior: raw.fallback?.failBehavior ?? 'fail_action',
        afterimages: [],
        factorLines: [],
        cards: [],
        branch: {
          onStep: raw.branchOnStep,
          variantKeys: Object.keys(raw.variants ?? {}),
          decidedBy: raw.decidedBy
            ? ('routes' in raw.decidedBy ? 'routes' : 'pole')
            : undefined,
        },
      };
    }

    const bandText: Partial<Record<StepOutcome, string | undefined>> = {
      critical_success: raw.criticalSuccessAfterimage,
      success: raw.successAfterimage,
      success_at_cost: raw.successAtCostAfterimage,
      failure: raw.failureAfterimage,
      critical_failure: raw.criticalFailureAfterimage,
    };

    const cards: PackageCard[] = (raw.nudges ?? []).map((nudge): PackageCard => {
      const art = imageFor({
        where: `card ${nudge.id}`,
        tag: nudge.imageTag,
        kind: 'nudge',
        sphere: nudge.sphere,
      });
      images.push(art);
      return {
        // No accessible spheres and no enrichment: the authored price and the
        // authored prose are what a designer is reviewing. A live discount or a
        // resolved `{they}` belongs to a playthrough, not to the package.
        model: buildNudgeCardModel(nudge, [], 'playable', (text) => text),
        sphere: nudge.sphere,
        libraryCardId: nudge.libraryCardId,
        gates: cardGates(nudge),
        lean: cardLean(nudge),
        grants: nudge.grants ?? [],
        bandProse: Object.keys(nudge.bandProse ?? {}) as StepOutcome[],
        art,
      };
    });

    return {
      index,
      reach: raw.reach,
      difficultyWord: difficultyWord(raw.difficulty),
      difficulty: raw.difficulty,
      purposeLine: raw.purposeLine,
      narrative: raw.narrativeTemplate,
      failBehavior: raw.failBehavior,
      afterimages: AFTERIMAGE_BANDS.map((band) => ({
        band,
        text: bandText[band],
        authored: (bandText[band] ?? '').trim() !== '',
      })),
      factorLines: (raw.factorLines ?? []).map((line) => ({
        text: line.text,
        polarity: line.polarity,
      })),
      cards,
    };
  });

  // ── Cast + places ──────────────────────────────────────────────────
  const cast: PackageCastMember[] = [];
  const places: PackagePlace[] = [];
  for (const spec of template.supportBundle ?? []) {
    if (spec.kind === 'actor') {
      const actor = spec as EncounterSupportActorSpec;
      const art = imageFor({
        where: `cast ${actor.key}`,
        kind: 'scene',
        reach: template.reach,
      });
      cast.push({
        key: actor.key,
        supportRole: actor.supportRole,
        spawnNpcRole: actor.spawnNpcRole,
        spawnName: actor.spawnName,
        factionDefId: actor.factionDefId,
        delivery: actor.delivery,
        persistence: actor.persistence,
        reuseNpcRoles: actor.reuseNpcRoles ?? [],
        defaulted: bundleDefaulted,
        art,
      });
    } else {
      const place = spec as EncounterSupportLocationSpec;
      places.push({
        key: place.key,
        sublocationTypeId: place.sublocationTypeId,
        fallbackName: place.fallbackName,
        delivery: place.delivery,
        persistence: place.persistence,
        defaulted: bundleDefaulted,
      });
    }
  }

  // ── Rewards ────────────────────────────────────────────────────────
  const rewards: PackageReward[] = [];
  for (const { index, step } of indexedSteps(template)) {
    const sides: readonly [string, RewardPoolRecipe | undefined][] = [
      [`step ${index} success`, step.successMetadata?.rewardPool],
      [`step ${index} failure`, step.failureMetadata?.rewardPool],
    ];
    for (const [where, recipe] of sides) {
      if (!recipe) continue;
      rewards.push({
        where,
        recipe,
        categories: Object.entries(recipe.categoryWeights ?? {})
          .map(([category, weight]) => ({ category, weight: Number(weight) || 0 }))
          .sort((a, b) => b.weight - a.weight),
      });
    }
  }

  const sites = effectSites(template);
  const persistentEffects = sites
    .filter(({ effect }) => PERSISTENT_KINDS_SHOWN.has(effect.kind))
    .map(({ effect, where }) => ({ kind: effect.kind, where }));

  // ── Aftermath matrix ───────────────────────────────────────────────
  const aftermath: PackageAftermathVariant[] = keyedVariants(template).map(({ key, variant }) => {
    const bands: PackageAftermathBand[] = AFTERMATH_BANDS.map((band) => {
      const override = variant.byOutcome?.[band];
      return {
        band,
        authored: override !== undefined,
        overview: override?.overview,
        changes: override?.changes ?? [],
        reactions: override?.reactions ?? [],
      };
    });
    return {
      key,
      overview: variant.overview,
      changes: variant.changes ?? [],
      reactionPrompt: variant.reactionPrompt,
      reactions: variant.reactions ?? [],
      bands,
      authoredBandCount: bands.filter((b) => b.authored).length,
    };
  });

  // ── Seeds ──────────────────────────────────────────────────────────
  const seeds: PackageSeed[] = sites
    .filter(({ effect }) => effect.kind === 'encounter_seed')
    .map(({ effect, where }) => {
      const seed = effect as Extract<
        EncounterAftermathReactionEffect,
        { kind: 'encounter_seed' }
      >;
      const target = seed.templateId
        ? UNIFIED_ACTION_TEMPLATES.find((t) => t.id === seed.templateId)
        : undefined;
      return {
        seedLabel: seed.seedLabel,
        delayTicks: seed.delayTicks,
        templateId: seed.templateId,
        targetName: target?.name,
        targetMissing: seed.templateId !== undefined && target === undefined,
        encounterFamily: seed.encounterFamily,
        inheritContext: seed.inheritContext === true,
        where,
      };
    });

  // ── Verdict (owned by THR-1045's contract) ──────────────────────────
  const report = checkCompositionContract(template);
  const blocks: PackageBlockVerdict[] = CONTRACT_BLOCKS.map((block) => {
    const hits = report.violations.filter((v) => v.block === block);
    return {
      block,
      pass: hits.length === 0,
      messages: hits.map((v) => v.message),
      planSection: hits[0]?.planSection,
    };
  });

  return {
    templateId: template.id,
    name: template.name,
    spellName: template.spellName,
    family: template.id.split('.')[0],
    reach: template.reach,
    rarityTier: template.rarityTier,
    intrinsicTier: template.intrinsicTier,
    scale: template.scale,
    description: template.description,
    settings: template.settings ?? [],
    openings: Object.entries(template.openings ?? {}).map(([settingClass, text]) => ({
      settingClass,
      text,
    })),
    illustration,
    steps,
    cast,
    places,
    rewards,
    persistentEffects,
    aftermath,
    seeds,
    images,
    systems: report.systems,
    verdict: {
      report,
      blocks,
      pass: report.violations.length === 0,
      retrofitPending: RETROFIT_PENDING.includes(template.id),
    },
    cardCount: steps.reduce((sum, step) => sum + step.cards.length, 0),
  };
}

// ─── Catalog ─────────────────────────────────────────────────────────

/** One row of the package picker. */
export interface PackageIndexRow {
  readonly templateId: string;
  readonly name: string;
  readonly family: string;
  readonly reach: ReachDomain;
  /** True when the template carries an authored nudge hand — the factory format. */
  readonly hasHand: boolean;
  readonly retrofitPending: boolean;
}

/**
 * Every template the Package View can render, cheaply.
 *
 * Deliberately the whole registry rather than only the nudge-era 15: the plan's
 * Done-when asks for "one retrofitted **and one legacy** encounter", and the
 * comparison between a composed package and a thin one is the point of the
 * surface. Rows sort hand-bearing first, then by id, so the composed content a
 * reviewer came for is at the top without hiding the rest.
 */
export function encounterPackageIndex(): readonly PackageIndexRow[] {
  const rows = UNIFIED_ACTION_TEMPLATES.map((template): PackageIndexRow => ({
    templateId: template.id,
    name: template.name,
    family: template.id.split('.')[0],
    reach: template.reach,
    hasHand: (template.steps ?? []).some(
      (step) => !isActionStepBranch(step) && (step.nudges?.length ?? 0) > 0,
    ),
    retrofitPending: RETROFIT_PENDING.includes(template.id),
  }));
  return rows.sort((a, b) => {
    if (a.hasHand !== b.hasHand) return a.hasHand ? -1 : 1;
    return a.templateId.localeCompare(b.templateId);
  });
}

/** Look one template up by id. `undefined` ⇒ the URL named nothing that exists. */
export function packageTemplateById(
  templateId: string,
): UnifiedActionTemplate | undefined {
  return UNIFIED_ACTION_TEMPLATES.find((t) => t.id === templateId);
}
