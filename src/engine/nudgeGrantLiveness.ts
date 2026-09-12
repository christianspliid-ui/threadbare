/**
 * Nudge grant liveness — every content id a card grants must resolve against
 * content that is actually built. THR-885.
 *
 * **Why this is a build gate and not a lint.** A card that says it leaves a
 * blade in the reeds, and names an artifact template nobody wrote, fails
 * *silently*: the grant no-ops deep inside the aftermath applier, the fiction
 * still prints, and the player is told a thing happened that did not. THR-844
 * is the standing evidence — 66 of 138 hidden-mark entries pointed at a reveal
 * family that had never existed, and nothing surfaced it for months because
 * dead references cost nothing at runtime.
 *
 * So: the reference is checked where it is cheapest to fix, at build time,
 * against the same catalogs the runtime will look in.
 *
 * Related: `validateTraitRefs` (`src/engine/traitRefValidation.ts`) does this job
 * for trait gates. This is the same idea over the card-grant surface.
 */

import type {
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../types/unifiedAction';
import { runnableStepSites } from '../types/unifiedAction';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import { ARTIFACT_TEMPLATES } from '../data/artifact-templates';
import { CONDITION_TRAIT_DEFINITIONS } from '../data/condition-trait-content';
// THR-1248 — the library play profiles, the one grant site that lives outside
// any template (see `validateLibraryGrantRefs`).
import { PLAY_PROFILES } from '../data/nudge-card-library';
// THR-1110 — every catalog `attachment_grant` can name. This list mirrors the
// sources `seedAttachments` puts in the graph plus the two registry-backed paths
// (`getAgreementTemplate`, `getCompanionTemplate`), so the gate asks exactly the
// question `instantiateReward` will ask at runtime.
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../data/starter-attachments';
import {
  REWARD_POSSESSIONS,
  REWARD_CONDITIONS,
  REWARD_BESTOWED_POWERS,
} from '../data/reward-attachment-catalog';
import {
  ANOMALY_SIGNATURE_ARTIFACTS,
  ANOMALY_BESTOWED_POWERS,
  ANOMALY_CONDITIONS,
} from '../data/anomaly-reward-catalog';
import { AGREEMENT_REWARD_TEMPLATES, filterAgreementTemplates } from '../data/agreement-reward-catalog';
import { COMPANION_TEMPLATES, filterCompanionTemplates } from '../data/companion-templates';
// THR-1146 — the `reward_draw` gate runs the *runtime's own* category/tag
// predicate against the seed catalogs, so gate and engine cannot drift.
import type { AttachmentCategory, RewardPoolRecipe } from '../types/attachments';
import { toContentQuery } from './rewardPool';
import {
  contentQueryHasCandidates,
  describeContentQuery,
  nodeContentCatalogs,
  type NodeLike,
} from './contentQuery';
import { staticContentCatalogs } from './contentCatalogView';
import { ENCOUNTER_FAMILY_TAGS } from './encounterSeeding';
import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../data/unified-action-templates';
import { isContentQueryRetrofitPending } from '../data/content-eval/contentQueryRetrofitPending';

/** Content kinds a card grant can name. */
export type NudgeGrantRefKind = 'ambition' | 'artifact' | 'condition' | 'attachment';

export interface DeadNudgeGrantRef {
  readonly templateId: string;
  /**
   * Where in the template the dead ref sits, in `allTemplateEffects` notation —
   * `step[2].card 'hold_the_line'`, `aftermath.declined.critical_failure.stand_outside`.
   *
   * THR-1171 replaced the old `stepIndex` + `nudgeId` pair: those two fields could
   * only address a card, which is precisely why the sweep could only *walk* cards.
   * A shape that cannot name an aftermath reaction is a shape that guarantees
   * aftermath reactions go unchecked.
   */
  readonly site: string;
  readonly effectKind: string;
  readonly refKind: NudgeGrantRefKind;
  /** The id that resolved against nothing. */
  readonly ref: string;
}

export interface NudgeGrantLivenessReport {
  /** Grant references checked — a zero here means the sweep matched nothing (see below). */
  readonly checkedRefs: number;
  /** Sites carrying at least one id-naming effect (cards, aftermath reactions, step metadata). */
  readonly sitesWithGrants: number;
  readonly dead: readonly DeadNudgeGrantRef[];
}

// ─── Catalog indexes ─────────────────────────────────────────────────

function buildLiveIndex(): Readonly<Record<NudgeGrantRefKind, ReadonlySet<string>>> {
  return {
    ambition: new Set(AMBITION_TEMPLATES.map((t) => t.id)),
    artifact: new Set(ARTIFACT_TEMPLATES.map((t) => t.id)),
    condition: new Set(CONDITION_TRAIT_DEFINITIONS.map((n) => n.id)),
    attachment: new Set([
      ...STARTER_POSSESSIONS.map((n) => n.id),
      ...STARTER_CONDITIONS.map((n) => n.id),
      ...REWARD_POSSESSIONS.map((n) => n.id),
      ...REWARD_CONDITIONS.map((n) => n.id),
      ...REWARD_BESTOWED_POWERS.map((n) => n.id),
      ...ANOMALY_SIGNATURE_ARTIFACTS.map((n) => n.id),
      ...ANOMALY_BESTOWED_POWERS.map((n) => n.id),
      ...ANOMALY_CONDITIONS.map((n) => n.id),
      ...CONDITION_TRAIT_DEFINITIONS.map((n) => n.id),
      ...AGREEMENT_REWARD_TEMPLATES.map((t) => t.id),
      ...COMPANION_TEMPLATES.map((t) => t.id),
    ]),
  };
}

/**
 * Content references a single grant effect makes, if any.
 *
 * Only effects that name a *catalog id* are checked. `emit_omen` names an
 * `OmenCategory`, which the type system already closes, and `favor_creation`
 * names no content at all — neither can rot, so neither is swept. Adding a new
 * id-naming effect kind means adding it here, or its cards go unchecked.
 */
function refsForEffect(
  effect: EncounterAftermathReactionEffect,
): readonly { kind: NudgeGrantRefKind; ref: string }[] {
  switch (effect.kind) {
    case 'assign_ambition':
      return [{ kind: 'ambition', ref: effect.templateId }];
    case 'spawn_artifact':
      // `templateId` is optional — a category-only spawn picks at runtime and
      // names nothing that can rot.
      return effect.templateId ? [{ kind: 'artifact', ref: effect.templateId }] : [];
    case 'remove_condition':
    case 'apply_condition':
      return [{ kind: 'condition', ref: effect.conditionTraitId }];
    case 'condition_attachment':
      return [{ kind: 'condition', ref: effect.templateId }];
    case 'attachment_grant':
      return [{ kind: 'attachment', ref: effect.templateId }];
    default:
      return [];
  }
}

// ─── Sweep ───────────────────────────────────────────────────────────

/**
 * Sweep a template pool for effects naming content that does not exist.
 *
 * Fail-soft in shape (returns a report, never throws) so a caller can decide
 * whether a dead ref is fatal. The test that owns this gate treats it as fatal.
 *
 * **Coverage is every site an effect can live at** (THR-1171), delegated to
 * {@link allTemplateEffects} — the same walk the `reward_draw` gate uses, so the
 * two cannot drift into disagreeing about what "shipped content" means.
 *
 * Until THR-1171 this walked `step.nudges[].grants` and nothing else, which left
 * the entire aftermath surface unswept. That is not a hypothetical hole: the
 * apotheosis capstone attached `trait.condition.grieving` — an id no catalog
 * defined — from a `critical_failure` band reaction, and this gate reported the
 * corpus clean for as long as the effect sat there. The `condition_attachment`
 * arm in `encounterAftermath` fails soft on a missing node, so the write silently
 * did nothing while the chip above it went on claiming the state (UI Law 56).
 * A gate that can only see one of the four places an effect is authored reports
 * green about the three it cannot see.
 */
export function validateNudgeGrantRefs(
  templates: readonly UnifiedActionTemplate[],
): NudgeGrantLivenessReport {
  const live = buildLiveIndex();
  const dead: DeadNudgeGrantRef[] = [];
  let checkedRefs = 0;
  let sitesWithGrants = 0;

  for (const template of templates) {
    for (const { effect, site } of allTemplateEffects(template)) {
      const refs = refsForEffect(effect);
      if (refs.length === 0) continue;
      sitesWithGrants++;
      for (const { kind, ref } of refs) {
        checkedRefs++;
        if (live[kind].has(ref)) continue;
        dead.push({
          templateId: template.id,
          site,
          effectKind: effect.kind,
          refKind: kind,
          ref,
        });
      }
    }
  }

  return { checkedRefs, sitesWithGrants, dead };
}

/**
 * The **fifth** authoring site an effect can live at: a library play profile.
 *
 * THR-1171 widened {@link validateNudgeGrantRefs} from `step.nudges[].grants` to
 * every site inside a *template*, on the argument that a gate which sees one of
 * several authoring surfaces reports green about the ones it cannot see.
 * THR-1247 then created a surface outside every template: `PLAY_PROFILES` grants
 * are authored once per library member and minted into a hand at deal time, so
 * `allTemplateEffects` structurally cannot reach them.
 *
 * That gap is worth closing at exactly the moment the corpus fills it (THR-1248):
 * a dealt card's grant is *more* dangerous than an authored one, not less,
 * because one dead id in a profile misfires in every encounter that member is
 * ever dealt into rather than in the single scene that named it.
 *
 * Deliberately the same `refsForEffect` walk and the same live index as the
 * template sweep — a second liveness rule for library grants would be exactly
 * the parallel path `nudgeDispatch` exists to prevent.
 */
export function validateLibraryGrantRefs(): NudgeGrantLivenessReport {
  const live = buildLiveIndex();
  const dead: DeadNudgeGrantRef[] = [];
  let checkedRefs = 0;
  let sitesWithGrants = 0;

  for (const [memberId, profile] of Object.entries(PLAY_PROFILES)) {
    for (const effect of profile.grants ?? []) {
      const refs = refsForEffect(effect);
      if (refs.length === 0) continue;
      sitesWithGrants++;
      for (const { kind, ref } of refs) {
        checkedRefs++;
        if (live[kind].has(ref)) continue;
        dead.push({
          templateId: memberId,
          site: `PLAY_PROFILES.${memberId}.grants`,
          effectKind: effect.kind,
          refKind: kind,
          ref,
        });
      }
    }
  }

  return { checkedRefs, sitesWithGrants, dead };
}

// ─── reward_draw pool liveness (THR-1146) ────────────────────────────

/**
 * A `reward_draw` recipe that matches no live attachment template.
 *
 * Distinct from {@link DeadNudgeGrantRef} because the dead thing is a *query*,
 * not an id: nothing is misspelled in isolation, the combination just selects
 * an empty set.
 */
export interface EmptyRewardDrawPool {
  readonly templateId: string;
  /** Where in the template the recipe sits — a card, a reaction, a band, a step. */
  readonly site: string;
  readonly categoryWeights: readonly string[];
  readonly tagFilters: readonly string[];
}

export interface RewardDrawPoolReport {
  /** Recipes checked — a zero means the sweep matched nothing (see below). */
  readonly checkedRecipes: number;
  /** Empty recipes the caller should treat as fatal. */
  readonly empty: readonly EmptyRewardDrawPool[];
  /**
   * Empty recipes named in `CONTENT_QUERY_RETROFIT_PENDING` (THR-1487). Reported rather
   * than hidden: a grandfather list a caller cannot see is a way to lose work.
   */
  readonly grandfathered: readonly EmptyRewardDrawPool[];
}

/** `templateId @ site` — the ratchet's key, spelled in one place so both sides agree. */
export function recipeKey(templateId: string, site: string): string {
  return `${templateId} @ ${site}`;
}

/**
 * Every attachment the world seeds, as `{ type, properties }` — the same shape
 * `assembleRewardPool` reads off the graph, so the gate can run the runtime's
 * own predicate against it.
 */
function liveAttachmentNodes(): readonly { type: string; properties: Record<string, unknown> }[] {
  return [
    ...STARTER_POSSESSIONS,
    ...STARTER_CONDITIONS,
    ...REWARD_POSSESSIONS,
    ...REWARD_CONDITIONS,
    ...REWARD_BESTOWED_POWERS,
    ...ANOMALY_SIGNATURE_ARTIFACTS,
    ...ANOMALY_BESTOWED_POWERS,
    ...ANOMALY_CONDITIONS,
  ] as unknown as { type: string; properties: Record<string, unknown> }[];
}

/**
 * Would this recipe draw *anything*?
 *
 * The pool is a union across categories, so one category with candidates is
 * enough. Deliberately band-agnostic: `assembleRewardPool` additionally weights
 * by the outcome's tier curve, and a recipe matching only tier-4 items really
 * does come up empty at `critical_failure` — but the band is not knowable at
 * authoring time, and the question worth gating is the one that is: *do these
 * tags name content that exists?*
 */
export function rewardRecipeHasCandidates(recipe: RewardPoolRecipe): boolean {
  // THR-1487: the node-shaped half of this question is now literally the runtime's own
  // resolver, over the nodes the world seeds. Before, the gate re-stated the carve and
  // the tag rule, which is the drift the header above warns about — the two agreed only
  // because someone kept checking.
  const catalogs = nodeContentCatalogs(liveAttachmentNodes() as unknown as readonly NodeLike[]);

  for (const [category, weight] of Object.entries(recipe.categoryWeights)) {
    if (!weight || weight <= 0) continue;

    // Registry-backed categories answer through the same filters the runtime uses.
    // They stay off the resolver on both sides: their real filter is per-bearer (a
    // companion at the cap, a unique already in the world), which is a fact about the
    // recipient and not about the content.
    if (category === 'companion') {
      if (filterCompanionTemplates(recipe.tagFilters).length > 0) return true;
      continue;
    }
    if (category === 'agreement') {
      if (filterAgreementTemplates(recipe.tagFilters).length > 0) return true;
      continue;
    }
    // THR-1297: `holding` is undrawable by design — `toContentQuery` answers null for
    // it, exactly as `rewardCategoryNodeQuery` always has, so a recipe weighting
    // `holding` reports "no candidates" here rather than reaching the runtime and
    // silently drawing nothing.
    const query = toContentQuery(recipe, category as AttachmentCategory);
    if (!query) continue;

    if (contentQueryHasCandidates(query, catalogs)) return true;
  }

  return false;
}

/** Every aftermath effect a template authors, wherever it puts it. */
function allTemplateEffects(
  template: UnifiedActionTemplate,
): readonly { effect: EncounterAftermathReactionEffect; site: string }[] {
  const out: { effect: EncounterAftermathReactionEffect; site: string }[] = [];

  const config = template.aftermathConfig;
  if (config) {
    type AftermathVariant = {
      reactions?: readonly { id: string; effects: readonly EncounterAftermathReactionEffect[] }[];
      byOutcome?: Readonly<Record<string, { reactions?: readonly { id: string; effects: readonly EncounterAftermathReactionEffect[] }[] } | undefined>>;
    };
    // `fallback` is optional in practice even where the type implies otherwise,
    // and `config.variants` can carry an undefined value — so both are filtered
    // rather than trusted (NFP #4). Until THR-1171 the `fallback` entry was
    // pushed unconditionally and dereferenced one line later, so a template that
    // authored variants and no fallback threw a TypeError out of a *gate*:
    // `check:encounter --all` would abort mid-corpus instead of reporting, and
    // the liveness sweep would take the whole test file down with it. A gate that
    // crashes on unusual-but-legal content is worse than one that misses it —
    // it makes the content look like a tooling failure.
    const variantEntries: [string, AftermathVariant | undefined][] = [
      ...Object.entries(config.variants),
      ['fallback', config.fallback],
    ];
    const variants: [string, AftermathVariant][] = variantEntries
      .filter((entry): entry is [string, AftermathVariant] => Boolean(entry[1]));
    for (const [variantKey, variant] of variants) {
      for (const reaction of variant.reactions ?? []) {
        for (const effect of reaction.effects) {
          out.push({ effect, site: `aftermath.${variantKey}.${reaction.id}` });
        }
      }
      // The band arm is load-bearing and easy to omit: a band authors its own
      // `reactions`, and a sweep reading only `variant.reactions` cannot see
      // what a `critical_failure` band pays out (THR-973).
      for (const [band, override] of Object.entries(variant.byOutcome ?? {})) {
        for (const reaction of override?.reactions ?? []) {
          for (const effect of reaction.effects) {
            out.push({ effect, site: `aftermath.${variantKey}.${band}.${reaction.id}` });
          }
        }
      }
    }
  }

  // Branch arms included (THR-1273): an arm grants its own ids, and skipping
  // branch nodes meant a card on the fork's chosen side could name a trait or
  // pool that does not exist and no liveness check would ever see it.
  for (const { step, label } of runnableStepSites(template.steps)) {
    // Step-outcome metadata carries the same effect vocabulary (THR-783).
    for (const effect of step.successMetadata?.effects ?? []) {
      out.push({ effect, site: `${label}.successMetadata` });
    }
    for (const effect of step.failureMetadata?.effects ?? []) {
      out.push({ effect, site: `${label}.failureMetadata` });
    }
    for (const nudge of step.nudges ?? []) {
      for (const effect of nudge.grants ?? []) {
        out.push({ effect, site: `${label}.card '${nudge.id}'` });
      }
    }
  }

  return out;
}

/**
 * Sweep a template pool for content queries that would resolve to nothing.
 *
 * Fail-soft in shape (returns a report, never throws); the caller decides
 * whether an empty pool is fatal. `check:encounter` and the corpus test both
 * treat it as fatal, which is the point — an empty pool at runtime means the
 * prose promised a prize and the player got nothing.
 *
 * **THR-1487 widened this in two directions at once.** It now runs the *runtime's own*
 * resolver (`rewardRecipeHasCandidates` → `contentQueryHasCandidates`) rather than a
 * mirrored predicate, and it now walks **both** routes a recipe can be authored on —
 * the `reward_draw` effect and `ActionStepOutcomeMetadata.rewardPool`, the older step
 * route that shared the draw path since THR-1146 but never shared a gate. The name
 * generalised with the coverage: what is checked is a content query, and the reward
 * recipe is the first thing that projects onto one.
 */
export function validateContentQueries(
  templates: readonly UnifiedActionTemplate[],
): RewardDrawPoolReport {
  const empty: EmptyRewardDrawPool[] = [];
  const grandfathered: EmptyRewardDrawPool[] = [];
  let checkedRecipes = 0;

  for (const template of templates) {
    for (const { recipe, site } of allTemplateRewardRecipes(template)) {
      checkedRecipes++;
      if (rewardRecipeHasCandidates(recipe)) continue;
      const row: EmptyRewardDrawPool = {
        templateId: template.id,
        site,
        categoryWeights: Object.keys(recipe.categoryWeights),
        tagFilters: recipe.tagFilters ?? [],
      };
      if (isContentQueryRetrofitPending(recipeKey(template.id, site))) {
        grandfathered.push(row);
      } else {
        empty.push(row);
      }
    }
  }

  return { checkedRecipes, empty, grandfathered };
}

/**
 * The pre-THR-1487 name. Kept as an alias for one release (NFP #6) so the existing
 * callers and their tests keep reading — the behaviour is a superset, because the sweep
 * now sees the step route too.
 *
 * @deprecated Use {@link validateContentQueries}.
 */
export const validateRewardDrawPools = validateContentQueries;

// ─── Encounter-seed liveness (THR-1488) ──────────────────────────────

/** Why a seed cannot arrive. */
export type DeadSeedKind =
  /** `templateId` names no registered template — the sequel can never spawn. */
  | 'dead_template'
  /** `query` resolves to nothing in the library — the family is empty as authored. */
  | 'empty_query'
  /**
   * `encounterFamily` names neither an alias row nor any template by prefix. Reported
   * but **not fatal**: this is the shipped backlog, 41 families deep, and it is
   * THR-1488's evidence rather than its regression.
   */
  | 'dead_family';

export interface DeadEncounterSeed {
  readonly templateId: string;
  readonly site: string;
  readonly kind: DeadSeedKind;
  /** What the seed named, in the form the author wrote or the describer prints. */
  readonly ref: string;
  readonly seedLabel: string;
}

export interface EncounterSeedLivenessReport {
  readonly checkedSeeds: number;
  /** Fatal: a named template or query that cannot produce a sequel. */
  readonly dead: readonly DeadEncounterSeed[];
  /** Advisory: a legacy family prefix matching nothing. Printed, never gating. */
  readonly deadFamilies: readonly DeadEncounterSeed[];
}

/**
 * Sweep a template pool for `encounter_seed` effects that promise a sequel nothing can
 * deliver (THR-1488).
 *
 * **The shape of rot this catches, and why the gate is new.** Three liveness gates
 * already live in this file — a dead grant id, an empty reward query, an undeclared
 * favour debtor — and none of them looked at seeds, which is the one effect whose whole
 * job is to promise something *later*. A seed is therefore the cheapest possible place
 * to ship a promise that never arrives: the aftermath prose says the stranger will find
 * them at the full moon, the effect plants a reference, nothing resolves it, and the
 * only symptom is a narrative event six ticks later that says a thread is "stirring".
 *
 * Measured when this gate was written: of the 51 distinct `encounterFamily` values the
 * corpus authors, **41 match no template at all** — the reveal-family rot of THR-844,
 * one system over, undetected for as long because nothing asked.
 *
 * **Two tiers on purpose.** `dead` is fatal: a literal id that names nothing, or a query
 * that resolves to nothing, is a defect in content written *after* the query exists, and
 * there is no reason to ship one. `deadFamilies` is advisory: the 41 predate the
 * mechanism, `ENCOUNTER_FAMILY_TAGS` deliberately leaves them on the pre-change prefix
 * path for a release, and failing them here would redden the corpus for work the plan
 * assigns elsewhere. Printing them is what makes the backlog countable — the whole
 * argument of this slice is that an unreported nothing is indistinguishable from a check
 * nobody wrote.
 *
 * Queries are answered by {@link staticContentCatalogs} — the library, not a world.
 * An encounter template is catalog-only content, so the library *is* the universe the
 * question is about, and a static view gives the same verdict on every seed and every
 * machine, which is what a gate needs.
 */
export function validateEncounterSeedRefs(
  templates: readonly UnifiedActionTemplate[],
): EncounterSeedLivenessReport {
  const catalogs = staticContentCatalogs();
  const dead: DeadEncounterSeed[] = [];
  const deadFamilies: DeadEncounterSeed[] = [];
  let checkedSeeds = 0;

  for (const template of templates) {
    for (const { effect, site } of allTemplateEffects(template)) {
      if (effect.kind !== 'encounter_seed') continue;
      checkedSeeds++;
      const row = (kind: DeadSeedKind, ref: string): DeadEncounterSeed =>
        ({ templateId: template.id, site, kind, ref, seedLabel: effect.seedLabel });

      // The resolution order the runtime uses, so the gate answers the question the
      // engine will actually ask rather than a flattened version of it.
      if (effect.templateId) {
        if (!getUnifiedTemplateById(effect.templateId)) {
          dead.push(row('dead_template', effect.templateId));
        }
        continue;
      }
      if (effect.query) {
        if (!contentQueryHasCandidates(effect.query, catalogs)) {
          dead.push(row('empty_query', describeContentQuery(effect.query)));
        }
        continue;
      }
      if (effect.encounterFamily) {
        const aliased = ENCOUNTER_FAMILY_TAGS[effect.encounterFamily];
        if (aliased) {
          // An aliased family resolves through the same resolver the runtime uses, so a
          // broken alias row is a real defect and fails.
          if (!contentQueryHasCandidates({ kind: 'encounter_template', tags: [aliased] }, catalogs)) {
            dead.push(row('empty_query', `${effect.encounterFamily} → ${aliased}`));
          }
          continue;
        }
        const prefix = `${effect.encounterFamily}.`;
        if (!UNIFIED_ACTION_TEMPLATES.some(t => t.id.startsWith(prefix))) {
          deadFamilies.push(row('dead_family', effect.encounterFamily));
        }
      }
      // A seed naming nothing at all is already a composition violation (`seeds` is a
      // connection key), so it is not restated here.
    }
  }

  return { checkedSeeds, dead, deadFamilies };
}

/**
 * Every `RewardPoolRecipe` a template authors, wherever it puts it (THR-1487).
 *
 * **The step route is the half that was missing.** `reward_draw` effects have been swept
 * since THR-1146; `ActionStepOutcomeMetadata.rewardPool` — the older route, and still the
 * one most steps use — was not, so a step that promised a prize by a filter matching
 * nothing shipped green. That is the same asymmetry the interface map records on
 * `reward-draw-shares-one-seeded-draw-with-the-step-route`: the two routes shared a draw
 * and did not share a gate.
 *
 * Exported so the shared-path test sweeps exactly the sites the gate does — a test
 * walking its own corpus could prove identity on recipes the gate never checks.
 */
export function allTemplateRewardRecipes(
  template: UnifiedActionTemplate,
): readonly { recipe: RewardPoolRecipe; site: string }[] {
  const out: { recipe: RewardPoolRecipe; site: string }[] = [];

  // Route 1 — the aftermath `reward_draw` effect, wherever `allTemplateEffects` finds it
  // (reaction, band override, branch arm, card grant, step metadata effects).
  for (const { effect, site } of allTemplateEffects(template)) {
    if (effect.kind !== 'reward_draw') continue;
    out.push({ recipe: effect.pool, site });
  }

  // Route 2 — the step route (THR-1487).
  for (const { step, label } of runnableStepSites(template.steps)) {
    if (step.successMetadata?.rewardPool) {
      out.push({ recipe: step.successMetadata.rewardPool, site: `${label}.successMetadata.rewardPool` });
    }
    if (step.failureMetadata?.rewardPool) {
      out.push({ recipe: step.failureMetadata.rewardPool, site: `${label}.failureMetadata.rewardPool` });
    }
  }

  return out;
}

/** One line per empty pool, for a test failure message or a CLI report. */
// ─── favor_creation debtor declaration (THR-1175) ────────────────────

/**
 * A `favor_creation` that does not name who owes.
 *
 * The third shape in this file's family, and the one that took a director probe
 * to see. `validateNudgeGrantRefs` catches an id that names nothing;
 * `validateRewardDrawPools` catches a query that selects nothing. This catches a
 * write whose *consumers exist and can never fire for the operand it will
 * receive* — well-formed, anchored, gate-passing, and inert.
 *
 * Concretely: the applier's debtor used to be `action.targetId` unconditionally.
 * That is a person only when the encounter happens to target one. The Grateful
 * Kin targets a location, so it minted "Sacred Grove owes them a favour" — an
 * edge whose only remaining lifecycle event was silent deletion at expiry,
 * because social leverage, tension drift and call-in all read an *individual's*
 * regard for another. The chip reported it truthfully. Everything downstream of
 * the chip was a lie by omission.
 *
 * The predicate is deliberately "must declare", not "must declare *correctly*".
 * Nothing static can prove where a scene sentinel binds at runtime — that is the
 * graph layer's job, and it now refuses bad endpoints loudly. What authoring time
 * *can* insist on is that the author made a choice: name the person (a cast
 * sentinel binds the scene's persistent agent, `$target` re-states the old
 * behaviour for encounters that really do target people), or express the
 * consequence as what it actually is. When the fiction is a place opening rather
 * than a person owing, the shape is `apply_condition` + `targetLocationId`, and
 * this gate never sees it.
 */
export interface UndeclaredFavorDebtor {
  readonly templateId: string;
  /** Where the effect sits — a card, a reaction, a band, a step. */
  readonly site: string;
}

export interface FavorDebtorReport {
  readonly checked: number;
  readonly undeclared: readonly UndeclaredFavorDebtor[];
}

/**
 * Sweep a template pool for `favor_creation` effects with no `debtorAgentId`.
 *
 * Fail-soft in shape (returns a report, never throws), like its two siblings, and
 * walks {@link allTemplateEffects} so it cannot disagree with them about what
 * "shipped content" means.
 */
export function validateFavorDebtors(
  templates: readonly UnifiedActionTemplate[],
): FavorDebtorReport {
  const undeclared: UndeclaredFavorDebtor[] = [];
  let checked = 0;

  for (const template of templates) {
    for (const { effect, site } of allTemplateEffects(template)) {
      if (effect.kind !== 'favor_creation') continue;
      checked++;
      const declared = typeof effect.debtorAgentId === 'string'
        && effect.debtorAgentId.trim().length > 0;
      if (declared) continue;
      undeclared.push({ templateId: template.id, site });
    }
  }

  return { checked, undeclared };
}

export function formatUndeclaredFavorDebtors(
  undeclared: readonly UndeclaredFavorDebtor[],
): string {
  if (undeclared.length === 0) return 'favor_creation debtors: all declared';
  return [
    `favor_creation with no declared debtor (${undeclared.length}):`,
    ...undeclared.map(u => `  ${u.templateId} @ ${u.site}`),
    '  A favour is owed by a person. Name them with `debtorAgentId`',
    '  (`$cast:<key>`, `$actor`, `$target`, or a literal agent id), or — when the',
    '  fiction is a place opening rather than a person owing — express it as',
    '  `apply_condition` with `targetLocationId` plus an `encounter_seed`.',
  ].join('\n');
}

export function formatEmptyRewardDrawPools(empty: readonly EmptyRewardDrawPool[]): string {
  return empty
    .map((e) =>
      `${e.templateId} ${e.site} reward_draw → no candidate matches `
      + `[${e.categoryWeights.join('/')}]`
      + `${e.tagFilters.length ? ` tags ${e.tagFilters.join(' ')}` : ' (no tag filter)'}`)
    .join('\n');
}

/** One line per dead ref, for a test failure message or a CLI report. */
export function formatDeadNudgeGrantRefs(dead: readonly DeadNudgeGrantRef[]): string {
  return dead
    .map((d) =>
      `${d.templateId} ${d.site} `
      + `${d.effectKind} → unknown ${d.refKind} '${d.ref}'`)
    .join('\n');
}
