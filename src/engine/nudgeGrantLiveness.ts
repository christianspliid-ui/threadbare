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
import { isActionStepBranch } from '../types/unifiedAction';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import { ARTIFACT_TEMPLATES } from '../data/artifact-templates';
import { CONDITION_TRAIT_DEFINITIONS } from '../data/condition-trait-content';
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
import { rewardCategoryNodeQuery, rewardCandidateMatchesTags } from './rewardPool';

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
  readonly empty: readonly EmptyRewardDrawPool[];
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
  const nodes = liveAttachmentNodes();

  for (const [category, weight] of Object.entries(recipe.categoryWeights)) {
    if (!weight || weight <= 0) continue;

    // Registry-backed categories answer through the same filters the runtime uses.
    if (category === 'companion') {
      if (filterCompanionTemplates(recipe.tagFilters).length > 0) return true;
      continue;
    }
    if (category === 'agreement') {
      if (filterAgreementTemplates(recipe.tagFilters).length > 0) return true;
      continue;
    }

    const query = rewardCategoryNodeQuery(category as AttachmentCategory);
    if (!query) continue;

    const hit = nodes.some((n) =>
      n.type === query.nodeType
      && (query.subcategory === undefined || n.properties.subcategory === query.subcategory)
      && rewardCandidateMatchesTags(n.properties.tags, recipe.tagFilters));
    if (hit) return true;
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

  const steps = template.steps ?? [];
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    if (isActionStepBranch(step)) continue;
    // Step-outcome metadata carries the same effect vocabulary (THR-783).
    for (const effect of step.successMetadata?.effects ?? []) {
      out.push({ effect, site: `step[${stepIndex}].successMetadata` });
    }
    for (const effect of step.failureMetadata?.effects ?? []) {
      out.push({ effect, site: `step[${stepIndex}].failureMetadata` });
    }
    for (const nudge of step.nudges ?? []) {
      for (const effect of nudge.grants ?? []) {
        out.push({ effect, site: `step[${stepIndex}].card '${nudge.id}'` });
      }
    }
  }

  return out;
}

/**
 * Sweep a template pool for `reward_draw` recipes that would draw nothing.
 *
 * Fail-soft in shape (returns a report, never throws); the caller decides
 * whether an empty pool is fatal. `check:encounter` and the corpus test both
 * treat it as fatal, which is the point — an empty pool at runtime means the
 * prose promised a prize and the player got nothing.
 */
export function validateRewardDrawPools(
  templates: readonly UnifiedActionTemplate[],
): RewardDrawPoolReport {
  const empty: EmptyRewardDrawPool[] = [];
  let checkedRecipes = 0;

  for (const template of templates) {
    for (const { effect, site } of allTemplateEffects(template)) {
      if (effect.kind !== 'reward_draw') continue;
      checkedRecipes++;
      if (rewardRecipeHasCandidates(effect.pool)) continue;
      empty.push({
        templateId: template.id,
        site,
        categoryWeights: Object.keys(effect.pool.categoryWeights),
        tagFilters: effect.pool.tagFilters ?? [],
      });
    }
  }

  return { checkedRecipes, empty };
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
