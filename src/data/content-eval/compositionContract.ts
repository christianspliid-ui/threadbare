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
  EncounterAftermathConceptRef,
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { EncounterSupportSpec } from '../../types/encounter';
import { ENCOUNTER_IMAGE_LIBRARY } from '../encounter-image-library';
import { validateSettingEnvelope } from '../settingClasses';
import { checkNudgeHand, nudgeBearingSteps } from './nudgeHandChecklist';
import { checkConsequenceDraw, familiesWiredByEffects } from './consequenceDraw';
import {
  ANCHOR_SENTINEL_ACTOR,
  ANCHOR_SENTINEL_CAST_PREFIX,
  ANCHOR_SENTINEL_FACTION_PREFIX,
  classifyAnchorDeclaration,
} from './chipAnchorDeclarations';

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

/**
 * Effect kinds that can back an authored consequence chip — UI Law 56.
 *
 * Deliberately its own list rather than a reuse of {@link PERSISTENT_EFFECT_KINDS},
 * which is scoped to the *Rewards* block ("does this encounter leave the player
 * something") and would answer a narrower question than the law asks. Law 56 asks
 * only whether the engine wrote state a later system can read. So this set is the
 * persistent kinds, plus:
 *
 * - **the reputation kinds** — a standing move is written state, and the ruling
 *   explicitly contemplates state the game writes without surfacing it;
 * - **the kinds that were simply never added to the persistent set.** That set is
 *   documented as "exhaustive-by-inspection … un-counted until someone decides it
 *   persists", and nobody ever decided about these. An attachment grant, a
 *   companion joining, an intelligence record, a planted compulsion, a
 *   quintessence shift, a clearance-gate tag, a registered archetype drift and a
 *   sphere amplification all write state the simulation reads later. Adding them
 *   *here* rather than widening the persistent set keeps the change additive
 *   (NFP #6): the Rewards block and the systems quota score exactly as before.
 *
 * `recent_event`, `intel_referenced_prose` and `emit_omen` stay out. The first two
 * print. `emit_omen` is the debatable one — an omen carries a duration and biases
 * later encounter selection — but this module already classifies it as scene
 * dressing, and a chip-backing rule is the wrong place to reverse that. The
 * practical effect is nil: the one swept chip whose fiction is an omen ("The
 * Season") is backed by an intelligence record alongside it.
 */
const CHIP_BACKING_EFFECT_KINDS: ReadonlySet<string> = new Set([
  ...PERSISTENT_EFFECT_KINDS,
  ...REPUTATION_EFFECT_KINDS,
  'attachment_grant',
  'grant_companion',
  'remove_companion',
  'intelligence',
  'plant_compulsion',
  'quintessence_shift',
  'clearance_gate_tag',
  'archetype_drift_register',
  'sphere_influence_amplify',
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
  | 'images'
  | 'draw';

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

/**
 * Canonical order, so two templates connecting to the same systems report
 * identically regardless of authoring order (NFP #3). Also the enumeration
 * {@link systemSurfacesForOutcome} initialises from — one list, so a seventh
 * connection cannot be added to the type and silently missed by that record.
 */
export const SYSTEM_CONNECTIONS: readonly SystemConnection[] = [
  'cast',
  'rewards',
  'seeds',
  'conditions',
  'reputation',
  'factions',
];

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
  // The one block whose rule is not in the factory-workflow plan: the draw was
  // designed later, in the palette-expansion pass (THR-1145).
  draw: 'Docs/plans/2026-08-16-consequence-palette-expansion.md § The Consequence Draw',
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
    // `changes` is declared required, so an unguarded spread reads as safe — but
    // the red baseline (THR-489) lets a mis-shaped literal compile, and ten
    // `hod.*` templates key `variants` by *step index → band* rather than
    // `choiceId → AftermathVariant`, which puts an object with no `changes` here.
    // The spread then threw `changes is not iterable` on every one of them,
    // against this module's own "never throws" contract (THR-1046 found it by
    // building a package for every live template). The shape defect itself is
    // tracked separately; this guard is what keeps a malformed template producing
    // violations rather than an exception. Shape defect: THR-1054.
    out.push(...(variant.changes ?? []));
    for (const band of Object.values(variant.byOutcome ?? {})) {
      out.push(...(band?.changes ?? []));
    }
  }
  return out;
}

/**
 * Every step the template can actually run, branch arms included.
 *
 * {@link plainSteps} answers a different question — "which steps carry prose,
 * a hand and a difficulty" — and so drops branch nodes entirely. For "does this
 * template write any state", dropping them is a false negative with teeth: a
 * branching encounter puts its whole consequence inside `variants`/`fallback`,
 * and a naive `steps[]` walk reports every one of them as writing nothing.
 * That is the exact shape the THR-1141 corpus audit flagged as the gate's likely
 * first bug, so the walk lives here once rather than in each caller.
 */
function allRunnableSteps(template: UnifiedActionTemplate): readonly ActionStep[] {
  const out: ActionStep[] = [];
  for (const step of template.steps ?? []) {
    if (isActionStepBranch(step)) {
      out.push(...Object.values(step.variants), step.fallback);
    } else {
      out.push(step);
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

// ─── Chip backing (UI Law 56, THR-1141) ──────────────────────────────

/**
 * One ending a player can actually be shown — a variant resolved at one band.
 *
 * The unit matters because {@link applyAftermathOutcomeBand} substitutes
 * **wholesale**: a band's `changes` replace the variant's rather than adding to
 * them, and so do its `reactions`. A sweep that unions both levels (which
 * {@link allAftermathChanges} deliberately does, for the "authored anywhere"
 * questions) therefore cannot answer Law 56, because it will credit a chip on
 * one band with a write that only exists on another.
 *
 * `band: undefined` is the base face — the ending reached whenever the roll
 * lands on an outcome the variant did not override. It is reachable on nearly
 * every template, since no encounter authors all seven bands.
 */
interface AftermathFace {
  readonly variantKey: string;
  readonly band?: UnifiedActionOutcome;
  readonly changes: readonly EncounterAftermathChange[];
  readonly reactions: readonly EncounterAftermathReaction[];
}

/** Every (variant × band) ending the config can render, resolved as the engine does. */
function aftermathFaces(template: UnifiedActionTemplate): readonly AftermathFace[] {
  const config = template.aftermathConfig;
  if (!config) return [];
  const out: AftermathFace[] = [];

  const entries: (readonly [string, AftermathVariant | undefined])[] = [
    ...Object.entries(config.variants ?? {}),
    ['fallback', config.fallback],
  ];

  for (const [variantKey, variant] of entries) {
    if (!variant) continue;
    // Same `?? []` guards as `allAftermathChanges` — the red baseline (THR-489)
    // lets a mis-shaped variant compile with neither field (THR-1054), and this
    // module never throws (NFP #4).
    const baseChanges = variant.changes ?? [];
    const baseReactions = variant.reactions ?? [];
    out.push({ variantKey, changes: baseChanges, reactions: baseReactions });

    for (const [band, override] of Object.entries(variant.byOutcome ?? {})) {
      if (!override) continue;
      out.push({
        variantKey,
        band: band as UnifiedActionOutcome,
        // `??`, not a merge: this is the resolver's own substitution rule.
        changes: override.changes ?? baseChanges,
        reactions: override.reactions ?? baseReactions,
      });
    }
  }

  return out;
}

/**
 * Whether a step's writes can reach a face, given which half of the ladder it is.
 *
 * `successMetadata` fires on a win and `failureMetadata` on a loss, so crediting
 * both to every face would let a chip on a `critical_failure` band be "backed" by
 * a reward the run never drew. The base face takes both, because it is reached by
 * whichever bands the variant left unoverridden — either half may be one of them.
 */
function stepWritesReachFace(
  face: AftermathFace,
  half: 'success' | 'failure',
): boolean {
  if (face.band === undefined) return true;
  return half === 'success'
    ? SUCCESS_BANDS.includes(face.band)
    : FAILURE_BANDS.includes(face.band);
}

/**
 * Writes the template performs on a step, reachable from this face.
 *
 * Reads **three** authoring routes, because an encounter may put its whole
 * consequence in any of them: step-outcome effects (THR-783), a `rewardPool`
 * recipe, and the step's own `onSuccess`/`onFailure` graph operations. The third
 * is the one a chip-backing sweep is most likely to miss and the most direct
 * evidence there is — `soul_ferryman` writes every one of its twelve chips'
 * consequences as an `update_node` op and authors no aftermath effect at all, so
 * a gate reading only `effects` calls the corpus's most systemically-wired
 * encounter a Law 56 violation twelve times over.
 */
function stepBackingForFace(
  template: UnifiedActionTemplate,
  face: AftermathFace,
): readonly string[] {
  const out: string[] = [];
  for (const [index, step] of allRunnableSteps(template).entries()) {
    for (const [half, meta, ops] of [
      ['success', step.successMetadata, step.onSuccess],
      ['failure', step.failureMetadata, step.onFailure],
    ] as const) {
      if (!stepWritesReachFace(face, half)) continue;
      for (const effect of meta?.effects ?? []) {
        if (CHIP_BACKING_EFFECT_KINDS.has(effect.kind)) {
          out.push(`step ${index} ${half}Metadata.${effect.kind}`);
        }
      }
      if (meta?.rewardPool) out.push(`step ${index} ${half}Metadata.rewardPool`);
      for (const op of ops ?? []) out.push(`step ${index} on${half === 'success' ? 'Success' : 'Failure'}.${op.op}`);
    }
  }
  return out;
}

/** Writes a face's own reactions perform. */
function reactionBackingForFace(face: AftermathFace): readonly string[] {
  const out: string[] = [];
  for (const reaction of face.reactions) {
    for (const effect of reaction.effects ?? []) {
      if (CHIP_BACKING_EFFECT_KINDS.has(effect.kind)) {
        out.push(`reaction '${reaction.id}'.${effect.kind}`);
      }
    }
  }
  return out;
}

/**
 * The writes that can back the chips on one ending. Exported for the CMS Package
 * View and the sweep runner, which both want to *show* the backing rather than
 * merely learn that some exists.
 */
export function chipBackingForFace(
  template: UnifiedActionTemplate,
  face: AftermathFace,
): readonly string[] {
  return [...reactionBackingForFace(face), ...stepBackingForFace(template, face)];
}

/**
 * UI Law 56 — every consequence chip is backed by a write the engine performed.
 *
 * Christian's ruling, 2026-08-16, on the Unsafe Bridge's `PATH · THE RIVER
 * CROSSING`: *"the chips specifically show only things that have updated the game
 * state … we do not show prose in this section. basic game UX."* A chip whose
 * band writes nothing is scene prose wearing a chip's frame — it promises the
 * player an inspectable consequence and there is nothing to inspect.
 *
 * **This is a floor, not a semantic match.** The gate asks whether the ending
 * carrying a chip performs *any* qualifying write; it cannot ask whether that
 * particular write is the one the chip's sentence describes, because no machine
 * reads the sentence. Per-chip semantic verdicts are the author's, recorded in
 * the sweep — the floor is what stops the shipped shape (authored chip, empty
 * `effects`, no seed, no reward pool) from ever recurring silently.
 *
 * Engine-*derived* chips are out of scope by construction: they are a snapshot
 * diff assembled at resolution time, so their backing is the diff itself. Only
 * authored `changes` reach this function.
 */
function chipBackingViolations(template: UnifiedActionTemplate): readonly string[] {
  const out: string[] = [];
  for (const face of aftermathFaces(template)) {
    if (face.changes.length === 0) continue;
    if (chipBackingForFace(template, face).length > 0) continue;
    const where = face.band ? `${face.variantKey}/${face.band}` : face.variantKey;
    for (const change of face.changes) {
      out.push(
        `change '${change.id}' on ${where} claims state nothing wrote — `
          + 'that ending performs no qualifying write (Law 56). Back it with a real '
          + 'effect (a seed, a condition, a bond, a standing move), or fold the '
          + 'sentence into the band overview and delete the chip',
      );
    }
  }
  return out;
}

/**
 * UI Law 56 clause 2 — a chip that names a referent must anchor it.
 *
 * Clause 1 ({@link chipBackingViolations}) asks whether a write fired. This asks
 * what it was *about*: the referent must be an existing graph object, resolvable
 * in the live world, and the chip must point at that object. THR-1153 is why the
 * clause was needed — a chip could name the thing the ending changed and render
 * the name as inert text while the same object, decorated one line below inside
 * the sentence, clicked through. The most concentrated referent on the chip was
 * its least reachable one.
 *
 * **What counts as declaring a referent.** A `stateNoun` is the chip's referent
 * by construction — it is the word naming the changed object, drawn as the
 * `CATEGORY · NOUN` tag. Failing that, a non-empty `concepts` list is the older
 * authoring shape's way of naming one. A chip declaring **neither** is outside
 * this clause on purpose: it makes no claim the clause could be about, and the
 * `concepts` rule plus the composition ratchet already hold those templates.
 *
 * **The second half is the one that matters more.** A declared `entityId` that
 * resolves to nothing is worse than no anchor at all — it renders as a live link
 * and goes nowhere (Law 21), which is indistinguishable from a working link until
 * a player clicks it. So every declaration form is classified here, before the
 * content ships, against the same rule the renderer resolves with.
 */
export function chipAnchorViolations(template: UnifiedActionTemplate): readonly string[] {
  const out: string[] = [];
  const supportKeys = new Set((template.supportBundle ?? []).map(spec => spec.key));
  // Faces overlap — a band that authors no `changes` inherits the variant's, so
  // the same chip is reachable on several endings. Reporting it once keeps the
  // fix list the shape an author acts on.
  const reported = new Set<string>();

  for (const face of aftermathFaces(template)) {
    const where = face.band ? `${face.variantKey}/${face.band}` : face.variantKey;
    for (const change of face.changes) {
      if (reported.has(change.id)) continue;

      const declared = [change.stateNoun, ...(change.concepts ?? [])].filter(
        (ref): ref is EncounterAftermathConceptRef => ref !== undefined,
      );
      for (const ref of declared) {
        if (!ref.entityId) continue;
        const verdict = classifyAnchorDeclaration(ref.entityId, { supportKeys });
        if (verdict.ok) continue;
        reported.add(change.id);
        out.push(
          `change '${change.id}' on ${where} declares an anchor that cannot resolve: `
            + `${verdict.reason} (Law 56 clause 2). A dead pointer renders as a live link`,
        );
      }
      if (reported.has(change.id)) continue;

      // The referent half. `stateNoun` wins when present — it is the chip's own
      // claim about what changed, and a decorated concept elsewhere in the
      // sentence does not discharge it.
      const referent = change.stateNoun ?? undefined;
      if (referent) {
        if (referent.entityId || referent.tooltipId) continue;
        reported.add(change.id);
        out.push(
          `change '${change.id}' on ${where} names '${referent.text}' and anchors nothing `
            + '(Law 56 clause 2). Point the noun at the object the ending wrote — '
            + `'${ANCHOR_SENTINEL_ACTOR}', '${ANCHOR_SENTINEL_CAST_PREFIX}<key>', `
            + `'${ANCHOR_SENTINEL_FACTION_PREFIX}<defId>', an attachment template id, or a `
            + 'tooltip id — or fold the sentence into the band overview and delete the chip',
        );
        continue;
      }

      const concepts = change.concepts ?? [];
      if (concepts.length === 0) continue;
      if (concepts.some(c => c.entityId || c.tooltipId)) continue;
      reported.add(change.id);
      out.push(
        `change '${change.id}' on ${where} names [${concepts.map(c => c.text).join('; ')}] `
          + 'and anchors none of them (Law 56 clause 2). Anchor the one the ending '
          + 'actually wrote, or fold the sentence into the band overview',
      );
    }
  }
  return out;
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
  if (hasRewardPoolRecipe(template)) return true;
  return allAftermathEffects(template).some(e => PERSISTENT_EFFECT_KINDS.has(e.kind));
}

/**
 * Whether any step outcome carries a `rewardPool` recipe.
 *
 * Split out of {@link hasReward} because the consequence draw needs this half
 * alone: a `rewardPool` is the pre-`reward_draw` authoring route to a possession,
 * so it satisfies the `possession` family, while the persistent-effect half of
 * `hasReward` says nothing about which family was wired.
 */
function hasRewardPoolRecipe(template: UnifiedActionTemplate): boolean {
  for (const step of plainSteps(template)) {
    if (step.successMetadata?.rewardPool || step.failureMetadata?.rewardPool) return true;
  }
  return false;
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

  return SYSTEM_CONNECTIONS.filter(s => found.has(s));
}

// ─── Where a connection is authored (THR-1132) ───────────────────────

/**
 * The three places a system connection can be authored, relative to one run.
 *
 * {@link systemConnections} answers "does this template touch the seed system
 * *at all*" — the right question for Stage 3, which reads a template and never
 * runs it. Stage 4 runs it, and a run reaches exactly one outcome band and picks
 * at most one reaction, so the same union answer over-promises there: a seed
 * authored on `critical_failure` cannot arrive on a run that rolled
 * `success_at_cost`, and one riding a reaction cannot arrive until somebody
 * picks it.
 *
 * Reporting that absence as a *failure* is what THR-1132 measured: on unmodified
 * `main` the six slice templates scored 0 proved / 6 failed with every ✗ of this
 * shape. So the live proof asks this narrower question instead, and the two
 * consumers keep sharing one walk of the template — a second hand-rolled
 * "where is this authored" predicate is exactly the drift the module's header
 * warns about.
 */
export interface SystemSurface {
  /** Authored where this run's band reaches it without a reaction pick. */
  readonly unconditional: boolean;
  /**
   * Ids of the reactions carrying this connection on a band this run can reach.
   *
   * Ids rather than a flag, because a run applies exactly *one* reaction: a seed
   * on `leave_them_to_it` is unreachable on a run that picked `pay_them_back`,
   * and a boolean cannot tell those apart. Sorted, so the set reads identically
   * regardless of authoring order (NFP #3).
   */
  readonly reactionIds: readonly string[];
  /** Authored on some outcome band other than the one this run rolled. */
  readonly otherBand: boolean;
}

/** One authored effect or change, tagged with where it sits. */
interface LocatedAuthoring {
  readonly systems: readonly SystemConnection[];
  /** The reaction carrying it, or `undefined` when it fires without a pick. */
  readonly reactionId?: string;
  /** `undefined` = variant-level, so every band reaches it. */
  readonly band?: UnifiedActionOutcome;
}

/**
 * Whether an effect kind promises a persistent consequence.
 *
 * Exported so the live proof can look for the *right* arrival evidence: a
 * `favor_creation` lands as a graph edge and a trace, never as an `item` or
 * `trait` change, so a stage that reads only `aftermathSummary.changes` reports
 * an arrived reward as missing (THR-1132).
 */
export function isPersistentEffectKind(kind: string): boolean {
  return PERSISTENT_EFFECT_KINDS.has(kind);
}

/** Which connections one effect contributes. Mirrors {@link systemConnections}'s arms. */
function systemsOfEffect(effect: EncounterAftermathReactionEffect): readonly SystemConnection[] {
  const out: SystemConnection[] = [];
  if (PERSISTENT_EFFECT_KINDS.has(effect.kind)) out.push('rewards');
  if (effect.kind === 'encounter_seed') out.push('seeds');
  if (CONDITION_EFFECT_KINDS.has(effect.kind)) out.push('conditions');
  if (REPUTATION_EFFECT_KINDS.has(effect.kind)) out.push('reputation');
  if (FACTION_EFFECT_KINDS.has(effect.kind)) out.push('factions');
  return out;
}

/** Which connections one aftermath change contributes. */
function systemsOfChange(change: EncounterAftermathChange): readonly SystemConnection[] {
  const out: SystemConnection[] = [];
  if (change.kind === 'item' || change.kind === 'trait') out.push('rewards');
  if (change.kind === 'trait') out.push('conditions');
  if (
    change.kind === 'reputation'
    || change.kind === 'reputation_tally'
    || change.kind === 'faction_reputation'
  ) {
    out.push('reputation');
  }
  if (change.kind === 'faction_reputation') out.push('factions');
  return out;
}

/** Every authored effect and change, tagged with its band and reaction provenance. */
function locatedAuthoring(template: UnifiedActionTemplate): readonly LocatedAuthoring[] {
  const out: LocatedAuthoring[] = [];
  const push = (
    systems: readonly SystemConnection[],
    reactionId?: string,
    band?: UnifiedActionOutcome,
  ): void => {
    if (systems.length > 0) out.push({ systems, reactionId, band });
  };

  for (const variant of aftermathVariants(template)) {
    // Same `?? []` guard as `allAftermathChanges`, for the same reason: the red
    // baseline lets a mis-shaped variant compile with no `changes` (THR-1054).
    for (const change of variant.changes ?? []) push(systemsOfChange(change));
    for (const reaction of variant.reactions ?? []) {
      for (const effect of reaction.effects) push(systemsOfEffect(effect), reaction.id);
    }
    for (const [band, override] of Object.entries(variant.byOutcome ?? {})) {
      const outcome = band as UnifiedActionOutcome;
      for (const change of override?.changes ?? []) {
        push(systemsOfChange(change), undefined, outcome);
      }
      for (const reaction of override?.reactions ?? []) {
        for (const effect of reaction.effects) push(systemsOfEffect(effect), reaction.id, outcome);
      }
    }
  }

  // Step-outcome metadata (THR-783) fires with the step, not with an aftermath
  // pick, so it is unconditional and band-agnostic here. A `rewardPool` recipe
  // is the same: it is the other authoring route `hasReward` accepts.
  for (const step of plainSteps(template)) {
    for (const effect of step.successMetadata?.effects ?? []) push(systemsOfEffect(effect));
    for (const effect of step.failureMetadata?.effects ?? []) push(systemsOfEffect(effect));
    if (step.successMetadata?.rewardPool || step.failureMetadata?.rewardPool) {
      push(['rewards']);
    }
  }

  return out;
}

/**
 * Where each system connection is authored, relative to the band a run rolled.
 *
 * `outcome === undefined` (the run never resolved) collapses to the union
 * answer: nothing is `otherBand` when there is no band to be other than, which
 * keeps an unresolved run reporting the same failures it does today rather than
 * excusing them.
 *
 * A connection can be authored in several places at once — the returned flags
 * are independent, not a partition.
 */
export function systemSurfacesForOutcome(
  template: UnifiedActionTemplate,
  outcome: UnifiedActionOutcome | undefined,
): Readonly<Record<SystemConnection, SystemSurface>> {
  interface MutableSurface {
    unconditional: boolean;
    reactionIds: Set<string>;
    otherBand: boolean;
  }
  const building = {} as Record<SystemConnection, MutableSurface>;
  for (const system of SYSTEM_CONNECTIONS) {
    building[system] = { unconditional: false, reactionIds: new Set(), otherBand: false };
  }

  for (const entry of locatedAuthoring(template)) {
    const reachesThisRun = entry.band === undefined || outcome === undefined || entry.band === outcome;
    for (const system of entry.systems) {
      if (!reachesThisRun) {
        building[system].otherBand = true;
      } else if (entry.reactionId !== undefined) {
        building[system].reactionIds.add(entry.reactionId);
      } else {
        building[system].unconditional = true;
      }
    }
  }

  // Cast is neither band- nor reaction-scoped: a support bundle is prepared at
  // stage time, before any roll. It reports as unconditional so a caller reading
  // this record uniformly gets today's answer for it.
  if (castSpecs(template).length > 0) building.cast.unconditional = true;
  if (castSpecs(template).some(spec => spec.kind === 'actor' && spec.factionDefId !== undefined)) {
    building.factions.unconditional = true;
  }

  const surfaces = {} as Record<SystemConnection, SystemSurface>;
  for (const system of SYSTEM_CONNECTIONS) {
    surfaces[system] = {
      unconditional: building[system].unconditional,
      reactionIds: [...building[system].reactionIds].sort(),
      otherBand: building[system].otherBand,
    };
  }
  return surfaces;
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

  // Per-chip backing (Law 56). Resolved per *face*, not unioned across the
  // template — see `chipBackingViolations`.
  for (const violation of chipBackingViolations(template)) add('aftermath', violation);

  // Law 56 clause 2 (THR-1164). Reported under the same block as clause 1 — an
  // author fixing an ending's chips wants both halves in one list.
  for (const violation of chipAnchorViolations(template)) add('aftermath', violation);

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

  // ─── Consequence draw (THR-1145) ───────────────────────────────────
  // Presence-conditional: a template with no `consequenceDraw` is silent here.
  // The corpus predates the draw, and requiring the field would fail exactly the
  // templates that are *not* on the ratchet — the ones the factory has already
  // finished. See `checkConsequenceDraw`'s doc comment for why that trade runs
  // this way round. The effects walk is shared rather than repeated: this module
  // owns "what does this template author", and a second walk is the drift its
  // header warns about.
  for (const problem of checkConsequenceDraw(
    template,
    familiesWiredByEffects(allAftermathEffects(template), hasRewardPoolRecipe(template)),
  )) {
    add('draw', problem);
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
    // Guarded for the same reason as `allAftermathChanges` — see the note there
    // (mis-shaped `variants` entries, THR-1054). Both readers of `variant.changes`
    // must guard, or the one that does not is the one that throws.
    for (const change of variant.changes ?? []) {
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
