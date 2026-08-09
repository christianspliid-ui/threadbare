/**
 * The Composition Contract — THR-1045, Encounter Factory implementation item 2.
 *
 * Plan: `Docs/plans/2026-08-08-encounter-factory-workflow.md` §1 (the contract
 * table) and its Rulings block of 2026-08-08.
 *
 * **What this is for.** The composition audit (THR-1039) found the engine
 * resolving nine composition-block classes live while the authored corpus used
 * almost none of them: the 15 nudge-era encounters carry zero cast bundles, zero
 * `rewardPool`, zero `concepts`. Quality was whatever one authoring session
 * happened to produce. This function is the inverse — a checkable schema saying
 * what "composition-complete" means, so that scale produces composed encounters
 * rather than many thin ones fast.
 *
 * **Ruling 3: there is no exemption mechanism.** The plan's §1 originally
 * allowed `composition: { cast: { exempt: "..." } }`; Christian deleted it in
 * the 2026-08-08 grill round. A shape that cannot carry a block is a future
 * *encounter type with its own contract*, not a waiver. So every violation here
 * is a hard failure, and the only escape is `RETROFIT_PENDING` — a ratchet that
 * names a template *once*, only ever shrinks, and is not per-block.
 *
 * **Pure and authoring-time.** No graph, no fs, no runtime — every rule reads
 * the template plus committed catalogs, so the gate is fast enough to run per
 * template in CI and importable from a browser surface (the Package View,
 * THR-1046, renders these verdicts). Nothing under `src/engine/**` or the tick
 * loop may import it.
 *
 * **Two blocks delegate rather than restate**: `hand` runs `checkNudgeHand` and
 * `setting` runs `validateSettingEnvelope`. Restating either would give the
 * corpus two rules that drift; the contract's job is to say *which* blocks an
 * encounter owes, not to re-derive rules that already have owners.
 */

import type {
  ActionStep,
  AftermathVariant,
  EncounterAftermathChange,
  EncounterAftermathReactionEffect,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { EncounterSupportSpec } from '../../types/encounter';
import { ENCOUNTER_IMAGE_LIBRARY } from '../encounter-image-library';
import { validateSettingEnvelope } from '../settingClasses';
import { checkNudgeHand, nudgeBearingSteps } from './nudgeHandChecklist';

// ─── Contract constants (NFP #1 — every magic number is named) ───────

/** Steps per encounter. The contract's shape, not the engine's limit. */
export const COMPOSITION_STEPS_MIN = 1;
export const COMPOSITION_STEPS_MAX = 3;

/**
 * Outcome bands an aftermath must author (ruling 7): success / failure / one
 * extreme. A **floor, not a norm** — author more wherever the encounter warrants.
 */
export const COMPOSITION_BYOUTCOME_MIN_BANDS = 3;

/**
 * Game-system connections an encounter must make (Christian's standing rule,
 * nudge-authoring-spec §262–276). Counted from the manifest, so a connection
 * declared but never authored cannot inflate the count.
 */
export const COMPOSITION_SYSTEMS_QUOTA_MIN = 3;

/** Bands that read as the encounter having gone well. */
const SUCCESS_BANDS: readonly UnifiedActionOutcome[] = [
  'success',
  'contested_won',
  'critical_success',
  'success_at_cost',
];

/** Bands that read as the encounter having gone badly. */
const FAILURE_BANDS: readonly UnifiedActionOutcome[] = [
  'failure',
  'contested_lost',
  'critical_failure',
];

/**
 * The tails. Ruling 7 asks for "one extreme" on top of success and failure —
 * these are the bands a single playthrough is least likely to roll and which
 * therefore go unwritten unless a contract asks for them.
 */
const EXTREME_BANDS: readonly UnifiedActionOutcome[] = [
  'critical_success',
  'critical_failure',
  'success_at_cost',
];

/**
 * Aftermath effect kinds that leave something behind after the scene closes.
 *
 * This is the operative half of the Rewards block: "something persistent, per
 * THR-973's bar". An effect that only prints — `recent_event`, `emit_omen` —
 * is scene dressing, and an encounter whose entire consequence is dressing is
 * exactly the thin content the contract exists to stop shipping.
 *
 * Written as an exhaustive-by-inspection list rather than a negation, so a new
 * effect kind is un-counted until someone decides it persists.
 */
const PERSISTENT_EFFECT_KINDS: ReadonlySet<string> = new Set([
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
  'faction_splinter',
  'faction_absorb',
  'faction_dissolve',
  'faction_declare_war',
  'faction_force_peace',
]);

/** Effect kinds that move a reputation surface. */
const REPUTATION_EFFECT_KINDS: ReadonlySet<string> = new Set([
  'reputation_score',
  'reputation_tally',
  'reputation_set',
  'faction_reputation_gain',
]);

/** Effect kinds that touch a faction as an entity, not merely its standing. */
const FACTION_EFFECT_KINDS: ReadonlySet<string> = new Set([
  'faction_reputation_gain',
  'faction_splinter',
  'faction_absorb',
  'faction_dissolve',
  'faction_declare_war',
  'faction_force_peace',
]);

/** Effect kinds that put a condition on someone. */
const CONDITION_EFFECT_KINDS: ReadonlySet<string> = new Set([
  'apply_condition',
  'remove_condition',
  'condition_attachment',
]);

// ─── Report shape ────────────────────────────────────────────────────

/**
 * The contract's blocks, as the plan's §1 table names them.
 *
 * A violation carries its block so a report can group by what is missing rather
 * than by which template is loudest, and so the Package View can badge a block
 * red without parsing prose.
 */
export type CompositionBlock =
  | 'steps'
  | 'hand'
  | 'setting'
  | 'cast'
  | 'rewards'
  | 'aftermath'
  | 'systems'
  | 'images';

export interface CompositionViolation {
  readonly templateId: string;
  readonly block: CompositionBlock;
  /** Human-readable, naming what is missing and where. */
  readonly message: string;
  /** Where the rule is written down, so a failure is answerable without a search. */
  readonly planSection: string;
}

/** Which system each counted connection came from, for the report. */
export type SystemConnection =
  | 'cast'
  | 'rewards'
  | 'seeds'
  | 'conditions'
  | 'reputation'
  | 'factions';

export interface CompositionReport {
  readonly templateId: string;
  readonly violations: readonly CompositionViolation[];
  /** The systems the manifest actually connects to, in canonical order. */
  readonly systems: readonly SystemConnection[];
  /** Outcome bands the aftermath authors, across every variant. */
  readonly bands: readonly UnifiedActionOutcome[];
}

const PLAN = 'Docs/plans/2026-08-08-encounter-factory-workflow.md';

/** The plan section each block's rule is written in. */
const PLAN_SECTION: Readonly<Record<CompositionBlock, string>> = {
  steps: `${PLAN} §1 — Steps`,
  hand: `${PLAN} §1 — Nudge hand`,
  setting: `${PLAN} §1 — Setting envelope`,
  cast: `${PLAN} §1 — Cast (ruling 6)`,
  rewards: `${PLAN} §1 — Rewards/penalties`,
  aftermath: `${PLAN} §1 — Aftermath (ruling 7)`,
  systems: `${PLAN} §1 — Systems quota`,
  images: `${PLAN} §1 — Images`,
};

// ─── Manifest readers ────────────────────────────────────────────────

/** Plain steps only — a branch node carries no prose, hand, or afterimages. */
function plainSteps(template: UnifiedActionTemplate): readonly ActionStep[] {
  return (template.steps ?? []).filter(
    (step): step is ActionStep => !isActionStepBranch(step),
  );
}

/** Every aftermath variant on the template — choice-keyed and fallback alike. */
function aftermathVariants(template: UnifiedActionTemplate): readonly AftermathVariant[] {
  const config = template.aftermathConfig;
  if (!config) return [];
  return [...Object.values(config.variants), config.fallback];
}

/**
 * Every aftermath effect the template authors anywhere — variant reactions and
 * the reactions inside an outcome band alike.
 *
 * The band arm is load-bearing and easy to omit: a band may author its own
 * `reactions`, and a sweep that reads only `variant.reactions` cannot see the
 * seed a `critical_failure` band plants (THR-973). `vertical-slice.test.ts`
 * learned this the same way.
 */
function allAftermathEffects(
  template: UnifiedActionTemplate,
): readonly EncounterAftermathReactionEffect[] {
  const out: EncounterAftermathReactionEffect[] = [];
  for (const variant of aftermathVariants(template)) {
    for (const reaction of variant.reactions ?? []) out.push(...reaction.effects);
    for (const band of Object.values(variant.byOutcome ?? {})) {
      for (const reaction of band?.reactions ?? []) out.push(...reaction.effects);
    }
  }
  // Step-outcome metadata carries the same effect vocabulary (THR-783), and an
  // encounter may put its whole consequence there rather than in an aftermath.
  for (const step of plainSteps(template)) {
    out.push(...(step.successMetadata?.effects ?? []));
    out.push(...(step.failureMetadata?.effects ?? []));
  }
  return out;
}

/** Every aftermath change authored on the template, band overrides included. */
function allAftermathChanges(
  template: UnifiedActionTemplate,
): readonly EncounterAftermathChange[] {
  const out: EncounterAftermathChange[] = [];
  for (const variant of aftermathVariants(template)) {
    out.push(...variant.changes);
    for (const band of Object.values(variant.byOutcome ?? {})) {
      out.push(...(band?.changes ?? []));
    }
  }
  return out;
}

/** Outcome bands authored anywhere on the template's aftermath. */
function authoredBands(template: UnifiedActionTemplate): readonly UnifiedActionOutcome[] {
  const bands = new Set<UnifiedActionOutcome>();
  for (const variant of aftermathVariants(template)) {
    for (const band of Object.keys(variant.byOutcome ?? {}) as UnifiedActionOutcome[]) {
      bands.add(band);
    }
  }
  return [...bands];
}

/** Actor specs in the resolved support bundle — cast, as opposed to places. */
function castSpecs(template: UnifiedActionTemplate): readonly EncounterSupportSpec[] {
  return (template.supportBundle ?? []).filter(spec => spec.kind === 'actor');
}

/**
 * Whether the template carries a reward draw or a persistent consequence.
 *
 * Two authoring routes, either sufficient: a `rewardPool` recipe on a step's
 * outcome metadata, or an aftermath effect that leaves something behind.
 */
function hasReward(template: UnifiedActionTemplate): boolean {
  for (const step of plainSteps(template)) {
    if (step.successMetadata?.rewardPool || step.failureMetadata?.rewardPool) return true;
  }
  return allAftermathEffects(template).some(e => PERSISTENT_EFFECT_KINDS.has(e.kind));
}

/**
 * The game systems this encounter actually connects to.
 *
 * Counted from what is authored, never from what is declared: an encounter that
 * *names* a faction in prose but touches no faction surface has not connected to
 * the faction system, and a quota that counted prose would be satisfiable by
 * writing the word.
 */
export function systemConnections(
  template: UnifiedActionTemplate,
): readonly SystemConnection[] {
  const effects = allAftermathEffects(template);
  const changes = allAftermathChanges(template);
  const found = new Set<SystemConnection>();

  if (castSpecs(template).length > 0) found.add('cast');
  if (hasReward(template)) found.add('rewards');
  if (effects.some(e => e.kind === 'encounter_seed')) found.add('seeds');
  if (effects.some(e => CONDITION_EFFECT_KINDS.has(e.kind))) found.add('conditions');

  const reputationChange = changes.some(
    c => c.kind === 'reputation' || c.kind === 'reputation_tally' || c.kind === 'faction_reputation',
  );
  if (reputationChange || effects.some(e => REPUTATION_EFFECT_KINDS.has(e.kind))) {
    found.add('reputation');
  }

  const factionCast = castSpecs(template).some(
    spec => spec.kind === 'actor' && spec.factionDefId !== undefined,
  );
  const factionChange = changes.some(c => c.kind === 'faction_reputation');
  if (factionCast || factionChange || effects.some(e => FACTION_EFFECT_KINDS.has(e.kind))) {
    found.add('factions');
  }

  // Canonical order, so two templates connecting to the same systems report
  // identically regardless of authoring order (NFP #3).
  const ORDER: readonly SystemConnection[] = [
    'cast',
    'rewards',
    'seeds',
    'conditions',
    'reputation',
    'factions',
  ];
  return ORDER.filter(s => found.has(s));
}

// ─── The contract ────────────────────────────────────────────────────

/**
 * Run every Composition Contract block over one template.
 *
 * Returns a report whose `violations` is empty iff the template is
 * composition-complete. Ordered by block, most structural first, so a fix list
 * reads top-down.
 *
 * Never throws (NFP #4): a malformed template produces violations, not an
 * exception, because this runs in CI over content authored by agents.
 */
export function checkCompositionContract(
  template: UnifiedActionTemplate,
): CompositionReport {
  const violations: CompositionViolation[] = [];
  const add = (block: CompositionBlock, message: string): void => {
    violations.push({
      templateId: template.id,
      block,
      message,
      planSection: PLAN_SECTION[block],
    });
  };

  // ─── Steps ─────────────────────────────────────────────────────────
  const steps = plainSteps(template);
  if (steps.length < COMPOSITION_STEPS_MIN || steps.length > COMPOSITION_STEPS_MAX) {
    add(
      'steps',
      `${steps.length} plain step(s), outside ${COMPOSITION_STEPS_MIN}–${COMPOSITION_STEPS_MAX}`,
    );
  }
  for (const [index, step] of steps.entries()) {
    if (!step.reach) add('steps', `step ${index} declares no reach`);
    if (typeof step.difficulty !== 'number') add('steps', `step ${index} declares no difficulty`);
    if (!step.narrativeTemplate?.trim()) add('steps', `step ${index} has no narrativeTemplate`);
  }

  // ─── Hand (delegated) ──────────────────────────────────────────────
  // `checkNudgeHand` returns a single `no-hand` violation for a template with no
  // nudge-bearing step, which is exactly the contract's answer too: a factory
  // encounter owes a hand. Deliberately *not* re-stated here.
  for (const violation of checkNudgeHand(template)) add('hand', violation);

  // ─── Setting envelope (delegated) ──────────────────────────────────
  for (const problem of validateSettingEnvelope(template)) add('setting', problem);
  if ((template.settings?.length ?? 0) === 0) {
    add('setting', 'declares no `settings` — the envelope is what binds cast and openings');
  }

  // ─── Cast (ruling 6) ───────────────────────────────────────────────
  // The binding is mandatory; `{cast:*}` tokens are not. Christian's ruling:
  // authors write role-voiced prose ("the keeper waits…"), and the template must
  // declare the binding that makes her a real spawned person — portrait, cast
  // strip, click, persistence. Tokens are the tool for spots where the generated
  // name earns something, not a requirement everywhere.
  //
  // Read off the *resolved* bundle, so an `encounter.*` family default satisfies
  // this exactly as an explicit bundle does (THR-1044). `UNIFIED_ACTION_TEMPLATES`
  // applies `withDefaultSupportBundle` at assembly, so a template read from the
  // live catalog carries whichever it resolved to.
  const cast = castSpecs(template);
  if (cast.length === 0) {
    add(
      'cast',
      'no actor support binding — declare a `supportBundle` actor spec, or an '
        + '`encounter.*` id whose setting class carries a family default',
    );
  }

  // A `{cast:<key>}` token that names no spec strips silently at render, so the
  // sentence loses its person and nothing surfaces. Check declaration, which is
  // the whole guarantee the resolver offers (THR-696).
  const castKeys = new Set((template.supportBundle ?? []).map(spec => spec.key));
  for (const { text, where } of authoredProse(template)) {
    for (const match of text.matchAll(/\{cast:([A-Za-z0-9_.-]+)\}/gu)) {
      const key = match[1];
      if (!castKeys.has(key)) {
        add('cast', `${where}: {cast:${key}} names no key in the support bundle`);
      }
    }
  }

  // ─── Rewards / penalties ───────────────────────────────────────────
  if (!hasReward(template)) {
    add(
      'rewards',
      'nothing persists — author a `rewardPool` draw on a step outcome, or an '
        + 'aftermath effect that leaves something behind (spawn_artifact, a condition, a seed, …)',
    );
  }

  // ─── Aftermath ─────────────────────────────────────────────────────
  const variants = aftermathVariants(template);
  const bands = authoredBands(template);
  if (variants.length === 0) {
    add('aftermath', 'no `aftermathConfig` — the encounter has no authored ending');
  } else {
    if (bands.length < COMPOSITION_BYOUTCOME_MIN_BANDS) {
      add(
        'aftermath',
        `authors ${bands.length} outcome band(s), under the floor of `
          + `${COMPOSITION_BYOUTCOME_MIN_BANDS} (success / failure / one extreme)`,
      );
    }
    if (!bands.some(b => SUCCESS_BANDS.includes(b))) {
      add('aftermath', 'no success-side band — the encounter has no authored win');
    }
    if (!bands.some(b => FAILURE_BANDS.includes(b))) {
      add('aftermath', 'no failure-side band — the encounter has no authored loss');
    }
    if (!bands.some(b => EXTREME_BANDS.includes(b))) {
      add(
        'aftermath',
        'no extreme band — author at least one of '
          + `${EXTREME_BANDS.join(', ')}; the tails are the endings a playthrough never reaches`,
      );
    }
    for (const [index, variant] of variants.entries()) {
      if (!variant.overview?.trim()) add('aftermath', `variant ${index} has no overview`);
    }
  }

  // `concepts` per change (Law 2). Plan §1's Aftermath row.
  //
  // TODO(THR-1053): this rule and `EncounterAftermathChange.concepts`' own
  // doc comment disagree — the type says `concepts` is "absent on authored
  // changes … carry their entity links through the narrative linker instead"
  // (THR-1004), the plan requires it on every change and ruling 3 forbids
  // exemptions. The plan is followed here because it is the later, explicitly
  // ruled decision; THR-1053 settles which stands. Note the cost of being wrong
  // is bounded and visible: `concepts` is authored nowhere in the corpus, so
  // this one rule is a large share of why the ratchet holds all 191 templates.
  for (const change of allAftermathChanges(template)) {
    if ((change.concepts?.length ?? 0) === 0) {
      add('aftermath', `change '${change.id}' declares no \`concepts\` (Law 2)`);
    }
  }

  // ─── Systems quota ─────────────────────────────────────────────────
  const systems = systemConnections(template);
  if (systems.length < COMPOSITION_SYSTEMS_QUOTA_MIN) {
    add(
      'systems',
      `connects to ${systems.length} game system(s) `
        + `[${systems.join(', ') || 'none'}], under the quota of ${COMPOSITION_SYSTEMS_QUOTA_MIN}`,
    );
  }

  // ─── Images ────────────────────────────────────────────────────────
  // Resolve, don't trust. A card whose `imageTag` names no library row falls
  // back to the category generic at render — silently, so the art an author
  // believed they picked is simply never seen.
  //
  // Narrowed against plan §1 on purpose: the plan's row reads "step illustration
  // tag + card art tags", and there is no step-level image field in
  // `ActionStep` — only `UnifiedActionTemplate.illustrationUrl` (a path, not a
  // library id). So the checkable rule is card tags resolving, plus a declared
  // `illustrationUrl` being public-absolute. Requiring an illustration to exist
  // is a content requirement, not a resolution one.
  const libraryIds = new Set(ENCOUNTER_IMAGE_LIBRARY.map(entry => entry.id));
  for (const step of nudgeBearingSteps(template)) {
    for (const nudge of step.nudges) {
      if (nudge.imageTag && !libraryIds.has(nudge.imageTag)) {
        add(
          'images',
          `card '${nudge.id}' names imageTag '${nudge.imageTag}', which is not a library row`,
        );
      }
    }
  }
  if (template.illustrationUrl && !template.illustrationUrl.startsWith('/')) {
    add(
      'images',
      `illustrationUrl '${template.illustrationUrl}' must be public-absolute (start with "/")`,
    );
  }

  return { templateId: template.id, violations, systems, bands };
}

/**
 * Every authored prose string on a template, with a label naming where it came
 * from.
 *
 * Exported because the runner's token dry-run sweeps the same surface — one
 * definition of "the prose this template authors", so a field added to the
 * format reaches both the contract and the dry-run at once.
 */
export function authoredProse(
  template: UnifiedActionTemplate,
): readonly { readonly text: string; readonly where: string }[] {
  const out: { text: string; where: string }[] = [];
  const push = (text: string | undefined, where: string): void => {
    if (text && text.trim() !== '') out.push({ text, where });
  };

  for (const [cls, text] of Object.entries(template.openings ?? {})) {
    push(text, `opening[${cls}]`);
  }

  for (const [index, step] of plainSteps(template).entries()) {
    const at = `step ${index}`;
    push(step.narrativeTemplate, `${at}.narrativeTemplate`);
    push(step.purposeLine, `${at}.purposeLine`);
    push(step.successAfterimage, `${at}.successAfterimage`);
    push(step.failureAfterimage, `${at}.failureAfterimage`);
    push(step.successAtCostAfterimage, `${at}.successAtCostAfterimage`);
    push(step.criticalSuccessAfterimage, `${at}.criticalSuccessAfterimage`);
    push(step.criticalFailureAfterimage, `${at}.criticalFailureAfterimage`);
    for (const line of step.factorLines ?? []) push(line.text, `${at}.factorLine`);
    for (const [band, line] of Object.entries(step.carryoverFactorLines ?? {})) {
      push(line?.text, `${at}.carryover[${band}]`);
    }
    for (const nudge of step.nudges ?? []) {
      push(nudge.name, `${at}.card[${nudge.id}].name`);
      push(nudge.effectLine, `${at}.card[${nudge.id}].effectLine`);
      push(nudge.fiction, `${at}.card[${nudge.id}].fiction`);
      for (const [cls, text] of Object.entries(nudge.fictionBySetting ?? {})) {
        push(text, `${at}.card[${nudge.id}].fictionBySetting[${cls}]`);
      }
      for (const [band, text] of Object.entries(nudge.bandProse ?? {})) {
        push(text, `${at}.card[${nudge.id}].bandProse[${band}]`);
      }
    }
  }

  for (const [index, variant] of aftermathVariants(template).entries()) {
    push(variant.overview, `aftermath[${index}].overview`);
    push(variant.reactionPrompt, `aftermath[${index}].reactionPrompt`);
    for (const change of variant.changes) {
      push(change.title, `aftermath[${index}].change[${change.id}].title`);
      push(change.detail, `aftermath[${index}].change[${change.id}].detail`);
    }
    for (const [band, override] of Object.entries(variant.byOutcome ?? {})) {
      push(override?.overview, `aftermath[${index}].byOutcome[${band}].overview`);
      for (const change of override?.changes ?? []) {
        push(change.title, `aftermath[${index}].byOutcome[${band}].change[${change.id}].title`);
        push(change.detail, `aftermath[${index}].byOutcome[${band}].change[${change.id}].detail`);
      }
    }
  }

  for (const set of template.contextFragments ?? []) {
    for (const [key, text] of Object.entries(set.variants)) {
      push(text, `fragment[${set.slot}][${key}]`);
    }
  }

  return out;
}
