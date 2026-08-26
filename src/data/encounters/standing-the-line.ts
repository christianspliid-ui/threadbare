/**
 * Standing the Line — a Personality Fork and the batch's Seeded Sequel parent.
 *
 * A pilgrim who cannot walk sits in the narrow place, and four riders are
 * coming who do not have to stop. The mortal decides — hold the road and pay
 * a price, or break the riders before they arrive — on the batch's `poleLean`
 * debut (`mercy_ruthlessness`, Iron's bound pair). Four of the ten endings
 * plant the batch's sequel, `encounter.border.one_body_short`.
 *
 * Batch: border-perils (THR-1221). Parent of `encounter.border.one_body_short`.
 * Encounter Factory v3, nudge-native, THR-1045 Composition Contract.
 *
 * Design doc:      `Docs/plans/encounters/standing-the-line-final.md`
 * Systems audit:    `Docs/plans/encounters/standing-the-line-systems.md`
 * Package critique:  `Docs/plans/encounters/standing-the-line-package.md` (verdict: PACKAGE FIX)
 * Reference fork shape: `src/data/encounters/apotheosis-ascension.ts`
 *
 * ── Prose Doctrine v2 (THR-1223 batch 3) ──
 * Rewritten 2026-08-25 in narrator mode under the batch-1 calibration rulings:
 * rewrite from scratch in basic game-master language ("clever specificity" is
 * the residue tell of the old mode), and a card's effect line never repeats a
 * word from the card's name. Zero mechanical changes — same steps, effects,
 * seeds, bands, hands; the F1/F2/F3 band-guarantee constraints below are
 * preserved verbatim in meaning.
 * Stake shape (Seed Dice, die 1): Threat + Choice, compounded on purpose.
 *
 * Narrator's checklist (12 questions), answered:
 *  1. P1 arrival with {name} and {location}, one per setting class — yes.
 *  2. P2 states the pilgrim's state and the riders coming, costs standing
 *     (a leg walked on since morning, no obligation to stop) — yes.
 *  3. P3 lands Threat (riders on a clock) + Choice (talk them down, or break
 *     them first) — yes.
 *  4. Opening ≤80 words composed with any P1 (64–68) — yes.
 *  5. Every sentence a narrator's report; no interior sensation, no camera —
 *     yes.
 *  6. Facts stated, never encoded — "cannot walk further" is said outright —
 *     yes.
 *  7. Every sentence serves challenge (the riders) / test (heart, then the
 *     fork) / outcome (who stands at the end) — yes.
 *  8. Nothing referenced before introduction; {cast:survivor} enters in the
 *     spine — yes.
 *  9. One named person on stage: {cast:survivor} — yes.
 * 10. Stake in one sentence: get the pilgrim through the riders' arrival, by
 *     word or by blade — yes.
 * 11. Cards named imperative verb+noun; effect lines are game effects; no
 *     name-word repetition — yes.
 * 12. All four declared classes have a skeleton opening — yes.
 *
 * ─── The package fix list, applied (THR-1221 Pass 4) ──────────────────
 *
 * `computeFinalActionOutcome` (`unifiedActionLifecycle.ts:300-319`) returns
 * `success_at_cost` the moment *any* step failed, so that band is reached by
 * `[failure, critical_success, critical_success]` exactly as readily as by a
 * run that limped — and `failure` is reachable only from the *final* step, so
 * an earlier step may have critically succeeded. Four of ten endings asserted
 * step-level facts their band cannot guarantee. Fixed:
 *
 * - **F1 / F1b** — `positive.success_at_cost`'s overview no longer claims *how*
 *   the negotiation at step 1 went (it does not know). It asserts only what the
 *   band guarantees: a real cost (the boot to the ribs, already SCAR-backed)
 *   and, per F1b option (a), two riders down as an unconditional fact of this
 *   *band* rather than a fact inferred from a specific step history — which is
 *   what makes the seed's premise (`one_body_short`'s "the dead lie where they
 *   fell") true by construction rather than by narration.
 * - **F2** — both poles' `failure` overviews no longer open on a step-1 claim
 *   (`positive`: "Nothing that was said made any difference"; `negative`: "The
 *   strike went in late"), since `failure` is a step-2-only band and step 1 may
 *   have critically succeeded on the way there. Reworded to locate the failure
 *   at step 2 — the handover breaking, the finish never arriving — which holds
 *   on every reachable history. Everything after the opening clause is kept
 *   verbatim.
 * - **F3** — `negative.critical_failure`'s opening no longer narrates step 1
 *   ("went up the road alone") on a truncation where step 1 never ran (a
 *   crit-fail at step 0). Reworded to put the riders in motion instead of the
 *   traveler. `positive.critical_failure` needed no change — it names no step.
 *
 * Other binding items from the package:
 * - **§ 9.5 correction** — no template field routes `action.targetId` through
 *   a cast key; on every firing route it is the location. Nothing in this
 *   packet reads `$target` for a person (every effect names its own endpoint),
 *   so the correction costs nothing here. Taken as a **gain** (package § D,
 *   finding R1): the PATH chip's `concepts` carries a second entry anchoring
 *   `$target` as `visualKind: 'location'` — the exact node `one_body_short`
 *   inherits — at zero cost to the authored `detail` text.
 * - **Wound stacking (C1)** — both `critical_failure` bands author the 2-stack
 *   wound as **one** `condition_attachment` effect with `stackCount: 2`, never
 *   two effect entries (`condition_attachment` addEdges unconditionally with no
 *   already-holds check, so two entries would mint two edges and double the
 *   modifier).
 * - **No `remove_condition`** is authored anywhere, so no `removeAll` hazard
 *   exists (package § B).
 * - **Reaction wiring is the correct shipping choice, not a stopgap** (package
 *   § C). `critical_failure` truncates at three structurally different step
 *   counts, so a per-step `successMetadata`/`failureMetadata` placement could
 *   not serve it — reactions live on the assembled band and are reachable
 *   regardless of which steps ran. Do **not** move the four pole-invariant
 *   writes (`bond_change`, `hidden_mark`, `encounter_seed`,
 *   `condition_attachment`) off reactions; § 1.6's primitive is not a
 *   prerequisite for this encounter (package's own finding, batch report item).
 * - **M1** corrected in this header and below: 18 chip instances, not 21
 *   (8 BOND + 4 PATH + 6 SCAR).
 */

import type {
  ActionStep,
  ActionStepBranch,
  EncounterAftermathChange,
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  StepNudge,
  TraitVariant,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { EncounterSupportActorSpec, EncounterSupportBundle } from '../../types/encounter';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Named constants (NFP #1) ────────────────────────────────────────

/** One in-world day (canon: 12 ticks/day) — the first hour there is light on the ground. */
const STANDING_THE_LINE_SEED_DELAY_TICKS = 12;

/** The actor-borne count mark's severity (§ 9's exact effect). */
const STANDING_THE_LINE_MARK_SEVERITY = 0.35;

/** A lighter mark on the worst band — nothing was counted, only noticed. */
const STANDING_THE_LINE_CRITFAIL_MARK_SEVERITY = 0.30;

/** A favour spoken between two people — moderate, the scale `toll-of-blades` set. */
const STANDING_THE_LINE_FAVOR_MAGNITUDE_RANGE: [number, number] = [0.25, 0.45];

/** A wound worse than the template default (24 ticks) — "measured in days, not hours". */
const STANDING_THE_LINE_CRITFAIL_WOUND_DURATION_TICKS = 48;
const STANDING_THE_LINE_CRITFAIL_WOUND_STACKS = 2;

/** Arm A — "Let them owe it": a claim kept, not yet a deep tie. */
const STANDING_THE_LINE_BOND_SENTIMENT_A = 0.15;
const STANDING_THE_LINE_BOND_TRUST_A = 0.08;
/** Arm B — "Tell them they owe nothing": the claim given away buys a deeper tie. */
const STANDING_THE_LINE_BOND_SENTIMENT_B = 0.24;
const STANDING_THE_LINE_BOND_TRUST_B = 0.16;
/** Thinner bonds — the failure bands, where the tie is real but not yet resolved. */
const STANDING_THE_LINE_BOND_SENTIMENT_THIN_A = 0.06;
const STANDING_THE_LINE_BOND_TRUST_THIN_A = 0.03;
const STANDING_THE_LINE_BOND_SENTIMENT_THIN_B = 0.09;
const STANDING_THE_LINE_BOND_TRUST_THIN_B = 0.05;
/** The lone small bond on the ruthless pole's worst band (no favour offered there). */
const STANDING_THE_LINE_BOND_SENTIMENT_MINIMAL = 0.05;
const STANDING_THE_LINE_BOND_TRUST_MINIMAL = 0.03;

/** § 7 — the trait hook, `trait.core.core_warmth.virtue` (the Warm pole, `coreRegistry.ts:123-124`). */
const WARM_TRAIT_REF = 'trait.core.core_warmth.virtue';
const STANDING_THE_LINE_TRAIT_FORECAST_DELTA = 0.05;
const STANDING_THE_LINE_TRAIT_DIFFICULTY_DELTA = -0.03;

// ─── Support bundle (§ 3) ─────────────────────────────────────────────

/**
 * `survivor` — a cross-encounter contract, not a local naming choice.
 * `encounter.border.one_body_short` binds the crossing person under exactly
 * this key (`one-body-short.ts` `survivorSpec`) and inherits it through
 * `inheritContext`; a key mismatch strips the token silently on the far side.
 * The **role** is `pilgrim` (this encounter's own voice); the **key** is
 * `survivor` (the cross-encounter contract) — the two are different things.
 */
const survivorSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'survivor',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['pilgrim'],
  supportRole: 'the_one_who_cannot_fight',
  spawnNpcRole: 'pilgrim',
  spawnName: 'Ilme Fenn',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [survivorSpec];

// ─── Trait hook (§ 7) ─────────────────────────────────────────────────

const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: WARM_TRAIT_REF,
    forecastDelta: STANDING_THE_LINE_TRAIT_FORECAST_DELTA,
    difficultyDelta: STANDING_THE_LINE_TRAIT_DIFFICULTY_DELTA,
    factorLine: 'Being Warm, they do not leave someone who cannot run.',
  },
];

// ─── The hands (§ 5) ────────────────────────────────────────────────

/**
 * Step 0 hand — `heart`, "Win their trust" (§ 5.1).
 *
 * Seven cards, seven distinct types, five spheres plus two ungated commons.
 * Four `poleLean` cards, two per direction, all at the default weight — the
 * god's lever on direction is exactly as strong in either hand.
 */
const STEP_0_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common pool, ungated. Abstains from the fork.
    id: 'line.s0.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'Steady the Voice',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Keep their words and hands level. It argues for neither answer.',
    bandProse: {
      success: 'Level was enough. The pilgrim listened instead of talking.',
      near_miss: 'The words held level the whole way. There was not enough time.',
    },
  },
  {
    // Type: Compulsion — sphere mind. Leans Mercy.
    id: 'line.s0.an_urge_in_sleep',
    libraryCardId: 'card.compulsion.signature.mind',
    name: 'Plant an Urge',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    imageTag: 'generic.memory',
    effectLine:
      'Put a want under their thinking — a want to bring everyone out of this alive. It leans them toward mercy.',
    bandProse: {
      success_at_cost: 'The want held to the end, and it cost them the answer they had ready.',
      failure: 'The want was there, and so was the fear, and the fear was louder.',
    },
  },
  {
    // Type: Kindled ambition — sphere spirit. Leans Mercy.
    id: 'line.s0.something_to_want',
    libraryCardId: 'card.kindled_ambition.signature.spirit',
    name: 'Kindle Hope',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.09,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    imageTag: 'generic.blessing',
    effectLine: 'Give them something to want beyond getting through this. It leans them toward mercy.',
    bandProse: {
      critical_success: 'They wanted this to end well, and wanting it made them convincing.',
      near_miss: 'The wanting was real. The leg was worse.',
    },
  },
  {
    // Type: Undertow — sphere darkness. Leans Ruthless, permanent drift.
    id: 'line.s0.the_easier_way',
    libraryCardId: 'card.undertow.signature.darkness',
    name: 'Offer the Shortcut',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.14,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
    valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.dark',
    effectLine:
      'Surface the quick, ugly answer so it arrives first. It leans them toward the ruthless answer, and moves them that way for good.',
    bandProse: {
      success: 'The quick answer arrived first and got itself said before the patient one could.',
      critical_failure: 'The quick answer was the only one left in them, and it came out at the wrong person.',
    },
  },
  {
    // Type: Signature (one-off — no `signature`-typed library member exists). Sphere force. Leans Ruthless.
    id: 'line.s0.weight_behind_it',
    name: 'Press the Weight',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.08,
    poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.strength',
    effectLine:
      'Make the world feel heavier and closer, more decidable by hand. It leans them toward the ruthless answer.',
    bandProse: {
      success_at_cost: 'Everything felt solvable by hand, and their hand moved before their mouth did.',
      failure: 'The world went heavy and stayed heavy. Heavy did not make it simple.',
    },
  },
  {
    // Type: Fellowship (one-off — the type has no library member). Sphere order. Abstains.
    id: 'line.s0.one_rope_many_hands',
    name: 'Bind the Company',
    sphere: 'order',
    requiresGroup: true,
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.oath',
    effectLine:
      'Only in a group: tighten what they already share, so nobody has to be persuaded twice. It argues for neither answer.',
    bandProse: {
      critical_success: 'The group moved as one, and the pilgrim believed the group before the person.',
      near_miss: 'The group spoke with one voice. The pilgrim had already decided not to hear it.',
    },
  },
  {
    // Type: Mercy — common pool, ungated. Rider no_crit_fail: the hand's only rider.
    id: 'line.s0.not_the_worst',
    libraryCardId: 'card.mercy.core',
    name: 'Soften the Fall',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.mercy',
    effectLine: 'Put a floor under the worst — it can still go badly, but not all the way down.',
    bandProse: {
      near_miss: 'It went badly and stopped there.',
      failure: 'It came apart, and the floor kept the pieces small.',
    },
  },
];

/**
 * Step 1 hand — `positive` pole, `gold`, "Talk them down" (§ 5.2).
 *
 * The question this hand answers: can the offer land, and what does landing
 * it cost the person making it?
 */
const STEP_1_POSITIVE_HAND: readonly StepNudge[] = [
  {
    // Type: Mercy — common, ungated. Rider no_crit_fail: the hand's only rider.
    id: 'line.s1a.not_the_worst',
    libraryCardId: 'card.mercy.core',
    name: 'Soften the Fall',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.mercy',
    effectLine: 'Put a floor under the worst — it can still go badly, but not all the way down.',
    bandProse: {
      near_miss: 'No price was agreed, and no blade came out. The second half of that was bought.',
      failure: 'It went wrong and went no further.',
    },
  },
  {
    // Type: Kindled ambition — sphere spirit.
    id: 'line.s1a.something_to_want',
    libraryCardId: 'card.kindled_ambition.signature.spirit',
    name: 'Kindle Appetite',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.11,
    imageTag: 'generic.blessing',
    effectLine: 'Wake in the riders a hunger for what they cannot get here — staying stops being worth it.',
    bandProse: {
      critical_success: 'They were already thinking about somewhere else, and somewhere else won.',
      near_miss: 'A road further on had their attention. Not enough of it.',
    },
  },
  {
    // Type: Undertow — sphere darkness, big delta, permanent drift.
    id: 'line.s1a.the_easier_way',
    libraryCardId: 'card.undertow.signature.darkness',
    name: 'Arm the Offer',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.15,
    valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.dark',
    effectLine:
      'Put an unspoken threat behind what is proposed. It moves the one proposing it toward the ruthless end for good.',
    bandProse: {
      success: 'The terms were taken. What stood behind the terms was what got taken seriously.',
      failure: 'The threat got heard without being said, and being threatened made the price an insult.',
      critical_failure: 'They heard the threat, believed it, and decided to answer it now instead of later.',
    },
  },
  {
    // Type: Signature (one-off). Sphere light.
    id: 'line.s1a.made_plain',
    name: 'Show the Worth',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.light',
    effectLine: 'Put a clean edge on what is offered, so it looks like a fair trade.',
    bandProse: {
      success_at_cost: 'It all looked better than it was, and they took a little extra for the trouble of looking.',
      near_miss: 'It looked good right up until somebody picked it up.',
    },
  },
  {
    // Type: Boost (one-off — the library signs no `matter` Boost). Sphere matter.
    id: 'line.s1a.sound_goods',
    name: 'Mend the Goods',
    sphere: 'matter',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.matter',
    effectLine: 'Make each thing be what it looks like — seams tight, metal true, weight right.',
    bandProse: {
      success: 'Everything offered was exactly what it looked like, and nobody needed a second look.',
      failure: 'Everything offered was sound. The offer was never the argument.',
    },
  },
];

/**
 * Step 1 hand — `negative` pole, `iron`, "Strike first" (§ 5.3).
 *
 * No rider — a first strike is the one moment where buying a floor is the
 * opposite of what the course is for.
 */
const STEP_1_NEGATIVE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common, ungated.
    id: 'line.s1b.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'Quicken the Hand',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.focus',
    effectLine: 'Shave a moment off the timing — the first move goes when it should, not a breath late.',
    bandProse: {
      success: 'It went a half-beat early, and the half-beat mattered.',
      near_miss: 'The timing was right. Everything after it took too long.',
    },
  },
  {
    // Type: Boost — sphere energy, second and last Boost (cap 2).
    id: 'line.s1b.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'Kindle Blood',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.11,
    imageTag: 'generic.energy',
    effectLine: 'The body spends everything it was saving in the next few seconds.',
    bandProse: {
      critical_success: 'The body gave everything at once, and it was enough.',
      failure: 'Everything went into it, and it went into the wrong man.',
    },
  },
  {
    // Type: Compulsion — sphere mind.
    id: 'line.s1b.an_urge_in_sleep',
    libraryCardId: 'card.compulsion.signature.mind',
    name: 'Turn Their Eyes',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.memory',
    effectLine: 'Give the riders something else to mind — a strap to check, a moment to lose.',
    bandProse: {
      success_at_cost: 'Two of them were looking at the wrong thing. The third was not.',
      near_miss: 'All four looked away at the same moment, and noticed that they had.',
    },
  },
  {
    // Type: Fellowship (one-off). Sphere order.
    id: 'line.s1b.one_rope_many_hands',
    name: 'Call the Count',
    sphere: 'order',
    requiresGroup: true,
    essenceCost: 2,
    forecastDelta: 0.12,
    imageTag: 'generic.oath',
    effectLine: 'Only in a group: they all move on the same beat without being told.',
    bandProse: {
      critical_success: 'They went in together on one beat, and four scattered riders could not answer it.',
      failure: 'Everyone moved together, into the same wrong place, at the same time.',
    },
  },
  {
    // Type: Undertow — sphere darkness, big delta, permanent drift.
    id: 'line.s1b.the_easier_way',
    libraryCardId: 'card.undertow.signature.darkness',
    name: 'Cut the Doubt',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.15,
    valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.dark',
    effectLine:
      'Take out the half-beat where a person checks whether this is necessary. It moves them toward the ruthless end for good.',
    bandProse: {
      success: 'They never asked whether this was necessary, and not asking made it fast.',
      failure: 'There was no hesitation, and no advantage in having none.',
      critical_failure: 'They went in without the pause that would have told them how many there were.',
    },
  },
];

/**
 * Step 2 hand — `positive` pole, `gold`, "Make it hold" (§ 5.4).
 *
 * The question this hand answers: will the bargain survive being paid?
 */
const STEP_2_POSITIVE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common, ungated.
    id: 'line.s2a.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'Steady the Hands',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Keep the shaking out of the part where nothing can be taken back.',
    bandProse: {
      success: 'Nothing shook, and a calm handover is most of a handover.',
      near_miss: 'Nothing shook. The counting went wrong anyway.',
    },
  },
  {
    // Type: Compulsion — sphere mind.
    id: 'line.s2a.an_urge_in_sleep',
    libraryCardId: 'card.compulsion.signature.mind',
    name: 'Plant Weariness',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.memory',
    effectLine: 'Leave a wish to be done with this under the thinking of everyone holding a weapon.',
    bandProse: {
      critical_success: 'Every one of them wanted to be somewhere else, and men who want to leave leave fast.',
      failure: 'One of them was in no hurry at all, and the others waited to see what he would do.',
    },
  },
  {
    // Type: Kindled ambition — sphere spirit.
    id: 'line.s2a.something_to_want',
    libraryCardId: 'card.kindled_ambition.signature.spirit',
    name: 'Kindle Honor',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.blessing',
    effectLine: 'Give one of them a reason to be the sort of person who keeps a bargain.',
    bandProse: {
      success_at_cost: 'One of them held the others to the bargain, and made sure everyone saw who had.',
      near_miss: 'Somebody wanted to be better than this, and was outvoted.',
    },
  },
  {
    // Type: Signature (one-off). Sphere time.
    id: 'line.s2a.not_the_first_time',
    name: 'Dull the Edge',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.time-slow',
    effectLine: 'Make the moment feel worn and ordinary — this has happened before, and it went the plain way.',
    bandProse: {
      success: 'It felt like a job they had done before, and they did it the same way.',
      critical_failure: 'It felt familiar, and what it reminded them of was a time somebody had cheated them.',
    },
  },
  {
    // Type: Fellowship (one-off). Sphere order.
    id: 'line.s2a.one_rope_many_hands',
    name: 'Hold the Line',
    sphere: 'order',
    requiresGroup: true,
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.oath',
    effectLine: 'Only in a group: keep their order steady, so nobody moves before they are meant to.',
    bandProse: {
      critical_success: 'Nobody on either side moved early, and nobody had to be told not to.',
      failure: 'Somebody at the back moved, and it was read as the start of a fight.',
    },
  },
];

/**
 * Step 2 hand — `negative` pole, `iron`, "Finish it" (§ 5.5).
 *
 * The question this hand answers: does it end here, or does it follow them?
 */
const STEP_2_NEGATIVE_HAND: readonly StepNudge[] = [
  {
    // Type: Mercy — common, ungated. Rider no_crit_fail: the hand's only rider.
    id: 'line.s2b.not_the_worst',
    libraryCardId: 'card.mercy.core',
    name: 'Soften the Fall',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.mercy',
    effectLine: 'Put a floor under the worst — it can still go badly, but not all the way down.',
    bandProse: {
      near_miss: 'It ended badly, and it ended there.',
      failure: 'It went wrong, and the floor held how far wrong it could go.',
    },
  },
  {
    // Type: Undertow — sphere darkness, permanent drift.
    id: 'line.s2b.the_easier_way',
    libraryCardId: 'card.undertow.signature.darkness',
    name: 'Silence Mercy',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.13,
    valueDrift: { axis: 'mercy_ruthlessness', toward: 'negative' },
    imageTag: 'generic.dark',
    effectLine: 'Take away the instinct to stop once someone is down. It moves them toward the ruthless end for good.',
    bandProse: {
      success: 'The instinct to stop never arrived, and it was over while the others were still deciding.',
      critical_failure: 'Stopping never occurred to them, and neither did looking behind them.',
    },
  },
  {
    // Type: Boost — sphere energy.
    id: 'line.s2b.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'Kindle Blood',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.energy',
    effectLine: 'When the arms go dead, there is one more blow in them.',
    bandProse: {
      critical_success: 'There was one more in them, and one more was all it took.',
      near_miss: 'There was one more in them. The road wanted three.',
    },
  },
  {
    // Type: Signature (one-off). Sphere force.
    id: 'line.s2b.weight_behind_it',
    name: 'Anchor the Feet',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.12,
    imageTag: 'generic.strength',
    effectLine: 'Footing holds where it should slip, and a blow lands with more behind it than the arm had.',
    bandProse: {
      success_at_cost: 'The ground held under one of them and not the other, and both of them noticed.',
      failure: 'Every step was solid. Solid footing in the wrong place is still the wrong place.',
    },
  },
  {
    // Type: Kindled ambition — sphere spirit.
    id: 'line.s2b.something_to_want',
    libraryCardId: 'card.kindled_ambition.signature.spirit',
    name: 'Kindle Longing',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.blessing',
    effectLine: 'Wake in the ones still standing a want to be alive somewhere else tomorrow.',
    bandProse: {
      success: 'One of them decided being alive elsewhere was the better trade, and the rest followed him out.',
      near_miss: 'Two of them wanted to be elsewhere and went. Two of them stayed.',
    },
  },
];

// ─── Steps (§ 4) ────────────────────────────────────────────────────

/**
 * Step 0 — the deciding step. `heart`, "Win their trust".
 *
 * `continue_weakened`: `applyAgentDecidedBranches` runs unconditionally before
 * `advanceStep`, so the mortal is owed their answer even on a bad reading — a
 * stumble folds toward `success_at_cost`, which both poles author. A
 * `critical_failure` still ends the action outright regardless of
 * `failBehavior` (`unifiedActionLifecycle.ts:177-181`), with the pole already
 * recorded — which is why both poles author a `critical_failure` band.
 */
const step0WinTheirTrust: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  purposeLine: 'Win their trust',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  nudges: STEP_0_HAND,
  // The setting-neutral P2+P3 spine (Doctrine v2). The per-class P1 arrival
  // lands above this at instantiation. The pilgrim is introduced here by cast
  // token, before any later prose refers to them.
  narrativeTemplate:
    'A pilgrim, {cast:survivor}, sits where the way narrows, one leg ruined, unable to walk further. Four ' +
    'riders are coming up the road, and nothing obliges them to stop.\n\n' +
    'There is time for one thing: get the pilgrim off the road and meet the riders with words, or go up the ' +
    'road and break them first.',
  successAfterimage: 'The pilgrim let themselves be moved, and stopped asking why.',
  failureAfterimage: 'The pilgrim would not be moved by a stranger, and stayed in the open.',
  successAtCostAfterimage: 'The pilgrim moved, still arguing, and the arguing carried a long way.',
  criticalSuccessAfterimage: 'The pilgrim took the offered arm at once and asked what to do.',
  criticalFailureAfterimage: 'The pilgrim decided the traveler was the danger, and shouted it.',
};

/**
 * Step 1, `positive` pole (Hold the Road) — `gold`, "Talk them down".
 * Carryover keys off step 0's `heart` outcome.
 */
const step1HoldTheRoad: ActionStep = {
  reach: 'gold',
  duration: { min: 2, max: 3 },
  difficulty: 0.40,
  purposeLine: 'Talk them down',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  nudges: STEP_1_POSITIVE_HAND,
  carryoverFactorLines: {
    critical_success: { text: 'The pilgrim believed them at once and is already off the road.', polarity: 'for', forecastDelta: 0.06 },
    success: { text: 'The pilgrim moved when told, which buys a little quiet.', polarity: 'for', forecastDelta: 0.04 },
    success_at_cost: { text: 'The pilgrim moved, and is making noise about the leg.', polarity: 'against', forecastDelta: -0.03 },
    near_miss: { text: 'The pilgrim is off the road and still in plain view.', polarity: 'against', forecastDelta: -0.04 },
    failure: { text: 'The pilgrim would not be moved, and is sitting in the open.', polarity: 'against', forecastDelta: -0.06 },
    critical_failure: { text: 'The pilgrim is shouting, and the riders have heard it.', polarity: 'against', forecastDelta: -0.08 },
  },
  narrativeTemplate:
    'The four riders are close now, and unhurried. There is time for one offer, made plainly, before they ' +
    'reach the narrow place.',
  successAfterimage: 'They listened to the end of it, which was more than they had to do.',
  failureAfterimage: 'They let the talking finish and came on anyway.',
  successAtCostAfterimage: 'They took the offer and added to it while it was being made.',
  criticalSuccessAfterimage: 'The lead rider heard the price, looked at who was standing in the road, and agreed to it.',
  criticalFailureAfterimage: 'The offer told them exactly how much there was to take.',
};

/**
 * Step 1, `negative` pole (Break the Pursuit) — `iron`, "Strike first".
 * Carryover keys off the same predecessor, read for a different purpose.
 */
const step1BreakThePursuit: ActionStep = {
  reach: 'iron',
  duration: { min: 2, max: 3 },
  difficulty: 0.40,
  purposeLine: 'Strike first',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  nudges: STEP_1_NEGATIVE_HAND,
  carryoverFactorLines: {
    critical_success: { text: 'The pilgrim is hidden and will stay hidden, whatever is heard.', polarity: 'for', forecastDelta: 0.06 },
    success: { text: 'The pilgrim knows to keep still, which is most of it.', polarity: 'for', forecastDelta: 0.04 },
    success_at_cost: { text: 'The traveler left with the leg still argued over behind them.', polarity: 'against', forecastDelta: -0.03 },
    near_miss: { text: 'Nobody told the pilgrim to keep quiet, and nobody had time.', polarity: 'against', forecastDelta: -0.05 },
    failure: { text: 'The pilgrim is in the open and the road is watching it.', polarity: 'against', forecastDelta: -0.06 },
    critical_failure: { text: 'The pilgrim is shouting after them, which carries a long way.', polarity: 'against', forecastDelta: -0.08 },
  },
  narrativeTemplate:
    'The four riders are close now, and unhurried. There is time to go up and meet them before they arrive ' +
    'together and ready.',
  successAfterimage: 'The first exchange went the traveler’s way, and the riders pulled off the road to think.',
  failureAfterimage: 'They had seen it coming from further off than anyone thought.',
  successAtCostAfterimage: 'The strike landed, and a blade came back the other way at the same time.',
  criticalSuccessAfterimage: 'Two were down before the third had gathered the reins.',
  criticalFailureAfterimage: 'The traveler went in at four men, and four was too many.',
};

/**
 * The step 1 fork. `decidedBy` pole mode on `mercy_ruthlessness` — Iron's
 * bound value pair, and the fork's own reach axis (§ 0e).
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'mercy_ruthlessness' },
  variants: {
    positive: step1HoldTheRoad,
    negative: step1BreakThePursuit,
  },
  fallback: { ...step1HoldTheRoad },
};

/**
 * Step 2, `positive` pole — `gold`, "Make it hold". `fail_action`: the last
 * step, so a failure here ends the action and the `failure` band renders.
 * Carryover keys off step 1's `gold` outcome.
 */
const step2MakeItHold: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0.28,
  purposeLine: 'Make it hold',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  nudges: STEP_2_POSITIVE_HAND,
  carryoverFactorLines: {
    critical_success: { text: 'The price stands agreed, and nobody has moved off it.', polarity: 'for', forecastDelta: 0.07 },
    success: { text: 'A price stands. It is only a matter of handing it over.', polarity: 'for', forecastDelta: 0.05 },
    success_at_cost: { text: 'The price stands, and one of them is still counting it.', polarity: 'against', forecastDelta: -0.03 },
    near_miss: { text: 'They agreed to nothing and did not ride on either.', polarity: 'against', forecastDelta: -0.05 },
    failure: { text: 'They heard it all out and agreed to none of it.', polarity: 'against', forecastDelta: -0.07 },
    critical_failure: { text: 'They were insulted by it and have not let it go.', polarity: 'against', forecastDelta: -0.10 },
  },
  narrativeTemplate:
    'What was said has to survive being paid. The goods change hands here, or the offer was only words.',
  successAfterimage: 'The goods changed hands. Nobody touched anybody, and nobody said much.',
  failureAfterimage: 'Halfway through the counting, somebody decided the whole pile was already theirs.',
  successAtCostAfterimage: 'They took the price, then stood there deciding whether it was all of it.',
  criticalSuccessAfterimage: 'They counted it once and were satisfied, and one of them was almost civil about it.',
  criticalFailureAfterimage: 'The bargain came apart in the counting, and it came apart fast.',
};

/**
 * Step 2, `negative` pole — `iron`, "Finish it". `fail_action`. Carryover
 * keys off step 1's `iron` outcome.
 */
const step2FinishIt: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.44,
  purposeLine: 'Finish it',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  nudges: STEP_2_NEGATIVE_HAND,
  carryoverFactorLines: {
    critical_success: { text: 'The first two are out of it, and the rest know it.', polarity: 'for', forecastDelta: 0.07 },
    success: { text: 'The first exchange went the traveler’s way, and they know it.', polarity: 'for', forecastDelta: 0.05 },
    success_at_cost: { text: 'The opening blow went home and cost more than it bought.', polarity: 'against', forecastDelta: -0.03 },
    near_miss: { text: 'The strike went in late, and they are turned around now.', polarity: 'against', forecastDelta: -0.05 },
    failure: { text: 'They were ready, and are coming on with their blood up.', polarity: 'against', forecastDelta: -0.08 },
    critical_failure: { text: 'The traveler is on the ground and the road is theirs.', polarity: 'against', forecastDelta: -0.10 },
  },
  narrativeTemplate:
    'It ends here because it is finished, or it follows them the rest of the day.',
  successAfterimage: 'Nobody on the ground was getting up, and the ones still mounted knew it.',
  failureAfterimage: 'Nobody finished it. It stopped because both sides had had enough.',
  successAtCostAfterimage: 'It ended. The cost came out of the traveler and nobody else.',
  criticalSuccessAfterimage: 'They ended it, and the road was empty inside a minute.',
  criticalFailureAfterimage: 'It ended with the traveler on the ground and the road belonging to somebody else.',
};

/**
 * The step 2 fork. Same `branchOnStep: 0` as step 1's fork — the engine reads
 * the pole already recorded against the deciding step
 * (`decidedBranchesForStep`, `branchDecision.ts:289`). No `decidedBy` here:
 * the choice was already made at step 0's resolution.
 */
const step2Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    positive: step2MakeItHold,
    negative: step2FinishIt,
  },
  fallback: { ...step2MakeItHold },
};

// ─── Aftermath effect builders ───────────────────────────────────────
//
// The four pole-invariant writes — `bond_change`, `hidden_mark`,
// `encounter_seed`, `condition_attachment` — fire on **both** reaction arms
// of a band, so a chip claiming them is backed regardless of which stance the
// player takes. Only the differentiator (`favor_creation` on arm A, the
// larger `bond_change` on arm B) rides one arm alone. This is not a
// stopgap — `critical_failure` truncates at three structurally different
// step counts, so reactions (assembled on the resolved band) are
// reachability-safe where step metadata could not serve it (package § C).

function bondChangeEffect(sentimentDelta: number, trustDelta: number): EncounterAftermathReactionEffect {
  return {
    kind: 'bond_change',
    withAgentId: '$cast:survivor',
    sentimentDelta,
    trustDelta,
  };
}

function favorCreationEffect(): EncounterAftermathReactionEffect {
  return {
    kind: 'favor_creation',
    magnitudeRange: STANDING_THE_LINE_FAVOR_MAGNITUDE_RANGE,
    context: 'carried off the road when they could not walk',
    debtorAgentId: '$cast:survivor',
  };
}

function seedEffect(): EncounterAftermathReactionEffect {
  return {
    kind: 'encounter_seed',
    templateId: 'encounter.border.one_body_short',
    inheritContext: true,
    delayTicks: STANDING_THE_LINE_SEED_DELAY_TICKS,
    seedLabel: 'The count on the road behind them',
  };
}

function woundEffect(): EncounterAftermathReactionEffect {
  return { kind: 'condition_attachment', templateId: 'trait.condition.wounded' };
}

/** C1: one effect, `stackCount: 2` — never two `condition_attachment` entries. */
function criticalWoundEffect(): EncounterAftermathReactionEffect {
  return {
    kind: 'condition_attachment',
    templateId: 'trait.condition.wounded',
    durationOverride: STANDING_THE_LINE_CRITFAIL_WOUND_DURATION_TICKS,
    stackCount: STANDING_THE_LINE_CRITFAIL_WOUND_STACKS,
  };
}

function countMarkEffect(): EncounterAftermathReactionEffect {
  return {
    kind: 'hidden_mark',
    category: 'secret_knowledge',
    targetAgentId: '$actor',
    severity: STANDING_THE_LINE_MARK_SEVERITY,
    label: 'The count on the road came up one short',
    revealFamilies: ['encounter.border'],
  };
}

function holdCriticalFailureMarkEffect(): EncounterAftermathReactionEffect {
  return {
    kind: 'hidden_mark',
    category: 'secret_knowledge',
    targetAgentId: '$actor',
    severity: STANDING_THE_LINE_CRITFAIL_MARK_SEVERITY,
    label: 'They know who was sitting in that road and who is not there now',
    revealFamilies: ['encounter.border'],
  };
}

function breakCriticalFailureMarkEffect(): EncounterAftermathReactionEffect {
  return {
    kind: 'hidden_mark',
    category: 'secret_knowledge',
    targetAgentId: '$actor',
    severity: STANDING_THE_LINE_CRITFAIL_MARK_SEVERITY,
    label: 'Walked into four men for somebody they had just met, and has never said why',
    revealFamilies: ['encounter.border'],
  };
}

/** Arm A — "Let them owe it". Present on every two-arm band. */
function armLetThemOweIt(
  sentimentDelta: number,
  trustDelta: number,
  extra: readonly EncounterAftermathReactionEffect[],
): EncounterAftermathReaction {
  return {
    id: 'standing_the_line.let_them_owe_it',
    label: 'Let them owe it',
    intent: 'The pilgrim says what they owe, out loud, and the traveler lets it stand.',
    effects: [bondChangeEffect(sentimentDelta, trustDelta), favorCreationEffect(), ...extra],
  };
}

/** Arm B — "Tell them they owe nothing". Present on every two-arm band. */
function armTellThemNothing(
  sentimentDelta: number,
  trustDelta: number,
  extra: readonly EncounterAftermathReactionEffect[],
): EncounterAftermathReaction {
  return {
    id: 'standing_the_line.tell_them_nothing',
    label: 'Tell them they owe nothing',
    intent: 'The traveler waves it off. Being believed about that lands harder than a debt would have.',
    effects: [bondChangeEffect(sentimentDelta, trustDelta), ...extra],
  };
}

const REACTION_PROMPT = 'What does the traveler do about what is owed?';

// ─── Chip builders (§ 8.1b — three shapes, 18 instances) ─────────────

const BOND_DETAIL = '{cast:survivor} will not forget who was standing there, and the two of them are tied by it now.';

function bondChip(id: string, causeClause: string): EncounterAftermathChange {
  return {
    id,
    kind: 'growth',
    direction: 'gain',
    title: 'A Bond Formed',
    stateNoun: { text: 'a bond formed', entityId: '$cast:survivor', visualKind: 'agent' },
    detail: BOND_DETAIL,
    polarity: 'gain',
    causeClause,
    concepts: [{ text: 'a bond formed', entityId: '$cast:survivor', visualKind: 'agent' }],
  };
}

/**
 * R1 (package § D): the PATH chip also anchors `$target` — the location the
 * action resolved to, which `inheritContext` hands the sequel unchanged
 * (§ 9.5 correction). "that ground" is already the phrase in `detail`.
 */
function pathChip(id: string): EncounterAftermathChange {
  return {
    id,
    kind: 'future_hook',
    direction: 'opens',
    title: 'A Scene Planted',
    stateNoun: { text: 'a scene planted', entityId: '$actor', visualKind: 'agent' },
    causeClause: 'Four came up the road and the count of what went back down does not match',
    detail: '{actor} will go over that ground again, and it will not come out even.',
    polarity: 'info',
    concepts: [
      { text: 'a scene planted', entityId: '$actor', visualKind: 'agent' },
      { text: 'that ground', entityId: '$target', visualKind: 'location' },
    ],
  };
}

function scarChip(id: string, causeClause: string, detail: string): EncounterAftermathChange {
  return {
    id,
    kind: 'trait',
    direction: 'loss',
    title: 'A Wound',
    stateNoun: { text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
    detail,
    polarity: 'loss',
    causeClause,
    concepts: [{ text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }],
  };
}

// ─── Aftermath — `positive` pole: Hold the Road (§ 8.2) ──────────────

const HOLD_THE_ROAD = {
  overview:
    'The riders took the price and went through. Nobody reached for a weapon. The traveler is lighter by ' +
    'most of what they carried. {cast:survivor} asks, from the ground, what happens now.',
  changes: [bondChip('standing_the_line.hold.success.bond', 'Stood in the road and paid to keep it that way')],
  reactionPrompt: REACTION_PROMPT,
  reactions: [
    armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_A, STANDING_THE_LINE_BOND_TRUST_A, []),
    armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_B, STANDING_THE_LINE_BOND_TRUST_B, []),
  ],
  byOutcome: {
    critical_success: {
      overview:
        'The lead rider looked at the price, looked at who was standing in the road, and took less than half ' +
        'of it. All four went by at a walk and kept their distance from the pilgrim. {cast:survivor} keeps ' +
        'insisting the leg is fine. It is not.',
      changes: [bondChip('standing_the_line.hold.critical_success.bond', 'Named a price four armed men decided not to argue with')],
      reactionPrompt: REACTION_PROMPT,
      reactions: [
        armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_A, STANDING_THE_LINE_BOND_TRUST_A, []),
        armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_B, STANDING_THE_LINE_BOND_TRUST_B, []),
      ],
    },
    // F1 / F1b — asserts only what a `success_at_cost` band guarantees: a real
    // cost (the boot, SCAR-backed) and, as an unconditional band-level fact
    // rather than a step-1 claim, two riders down. This is what makes the
    // seed's premise (§ 9's "the dead lie where they fell") true on every
    // reachable history, including [failure, critical_success, critical_success].
    success_at_cost: {
      overview:
        'The price was paid, and it cost more than it should have. The traveler took a boot to the ribs for ' +
        'arguing the last of it, and by the end two of the four riders were not getting back up. The rest ' +
        'rode through without looking back. Two are lying where the way goes narrow. {cast:survivor} asks, ' +
        'from the ground, what happens now.',
      changes: [
        bondChip('standing_the_line.hold.success_at_cost.bond', 'Stood in the road while a bargain came apart in their hands'),
        pathChip('standing_the_line.hold.success_at_cost.path'),
        scarChip(
          'standing_the_line.hold.success_at_cost.scar',
          'Argued over the last of the price and was answered with a boot',
          'Ribs that will complain about every hill between here and wherever they are going.',
        ),
      ],
      reactionPrompt: REACTION_PROMPT,
      reactions: [
        armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_A, STANDING_THE_LINE_BOND_TRUST_A, [seedEffect(), woundEffect(), countMarkEffect()]),
        armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_B, STANDING_THE_LINE_BOND_TRUST_B, [seedEffect(), woundEffect(), countMarkEffect()]),
      ],
    },
    // F2 — the opening no longer claims "nothing said made any difference"
    // (a step-1 fact `failure` does not guarantee, since step 1 may have
    // critically succeeded on the way to a step-2 failure). Relocated to the
    // handover, which `failure` (step-2-only) does guarantee broke.
    failure: {
      overview:
        'The bargain came apart in the paying. They took what was worth taking and put the traveler down for ' +
        'arguing about it. The traveler did not go down for free — two of theirs lie on the road and are not ' +
        'riding anywhere. The rest went on together. {cast:survivor} was under a cloak by then, and was not ' +
        'worth the trouble, and that is why they are still there.',
      changes: [
        scarChip(
          'standing_the_line.hold.failure.scar',
          'Argued instead of stepping aside, and was put down for it',
          'Bruises that will still be there a week after the argument is forgotten.',
        ),
        bondChip('standing_the_line.hold.failure.bond', 'Took a beating in the road instead of stepping out of it'),
        pathChip('standing_the_line.hold.failure.path'),
      ],
      reactionPrompt: REACTION_PROMPT,
      reactions: [
        armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_THIN_A, STANDING_THE_LINE_BOND_TRUST_THIN_A, [seedEffect(), woundEffect(), countMarkEffect()]),
        armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_THIN_B, STANDING_THE_LINE_BOND_TRUST_THIN_B, [seedEffect(), woundEffect(), countMarkEffect()]),
      ],
    },
    // No change needed — names no step, reads correctly from all three truncations.
    critical_failure: {
      overview:
        'The traveler went down early and stayed down, and the four took their time with the rest. By first ' +
        'light, the place where the pilgrim had been sitting was empty, the pack was gone, and the road north ' +
        'was full of hoofprints. {cast:survivor} is somewhere at the end of them.',
      changes: [
        scarChip(
          'standing_the_line.hold.critical_failure.scar',
          'Went down in the first minute and was not worth finishing',
          'A beating that will be measured in days, not hours.',
        ),
      ],
      reactions: [
        {
          id: 'standing_the_line.hold.let_them_lie',
          label: 'Let them lie until the light',
          intent: 'There is no reason to get up yet.',
          effects: [criticalWoundEffect(), holdCriticalFailureMarkEffect()],
        },
      ],
    },
  },
} as const;

// ─── Aftermath — `negative` pole: Break the Pursuit (§ 8.3) ──────────

const BREAK_THE_PURSUIT = {
  overview:
    'The traveler met them where the way is narrowest, and four riders strung out in a narrow place are not ' +
    'four riders. Two went down. The other two turned and rode back the way they came. Everyone who came up ' +
    'the road is accounted for. {cast:survivor} heard all of it and asks no questions.',
  changes: [bondChip('standing_the_line.break.success.bond', 'Went up the road alone so that nobody had to come down it')],
  reactionPrompt: REACTION_PROMPT,
  reactions: [
    armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_A, STANDING_THE_LINE_BOND_TRUST_A, []),
    armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_B, STANDING_THE_LINE_BOND_TRUST_B, []),
  ],
  byOutcome: {
    critical_success: {
      overview:
        'It was over in one exchange and nobody died. Two of them will remember the narrow place for a long ' +
        'time, and all four rode back down fast. The pilgrim, told to stay still, stayed still.',
      changes: [bondChip('standing_the_line.break.critical_success.bond', 'Ended it in one exchange without ending anybody')],
      reactionPrompt: REACTION_PROMPT,
      reactions: [
        armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_A, STANDING_THE_LINE_BOND_TRUST_A, []),
        armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_B, STANDING_THE_LINE_BOND_TRUST_B, []),
      ],
    },
    success_at_cost: {
      overview:
        'It worked, and it was ugly. Somewhere in the middle of it the traveler stopped a blade with an arm. ' +
        'The road is clear: two of them lie where the way narrows, and the rest went back down. When there ' +
        'was light enough to count the ground, the count came out one short of what had come up. ' +
        '{cast:survivor} heard all of it and has not mentioned it since.',
      changes: [
        bondChip('standing_the_line.break.success_at_cost.bond', 'Went up the road alone and came back down it bleeding'),
        pathChip('standing_the_line.break.success_at_cost.path'),
        scarChip(
          'standing_the_line.break.success_at_cost.scar',
          'Stopped a blade with an arm because there was nothing else to stop it with',
          'An arm that took a blade meant for somebody else, and will ache for it.',
        ),
      ],
      reactionPrompt: REACTION_PROMPT,
      reactions: [
        armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_A, STANDING_THE_LINE_BOND_TRUST_A, [seedEffect(), woundEffect(), countMarkEffect()]),
        armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_B, STANDING_THE_LINE_BOND_TRUST_B, [seedEffect(), woundEffect(), countMarkEffect()]),
      ],
    },
    // F2 — the opening no longer claims the strike itself went late (a
    // step-1 fact `failure` does not guarantee). Relocated to the finish,
    // which a step-2 `failure` does guarantee never arrived cleanly.
    failure: {
      overview:
        'It started well and would not end. The traveler got back to the narrow place a half-step ahead of ' +
        'them and made the rest of it expensive. The riders decided the road was not worth the price and ' +
        'pulled off it. Two of theirs stayed where they fell. What went back down the road did not match what ' +
        'came up it. {cast:survivor} has not moved from where they were told to sit.',
      changes: [
        scarChip(
          'standing_the_line.break.failure.scar',
          'Held the narrow place a half-step ahead of four men',
          'A half-step that cost more than the ground it bought.',
        ),
        bondChip('standing_the_line.break.failure.bond', 'Came back to the narrow place instead of past it'),
        pathChip('standing_the_line.break.failure.path'),
      ],
      reactionPrompt: REACTION_PROMPT,
      reactions: [
        armLetThemOweIt(STANDING_THE_LINE_BOND_SENTIMENT_THIN_A, STANDING_THE_LINE_BOND_TRUST_THIN_A, [seedEffect(), woundEffect(), countMarkEffect()]),
        armTellThemNothing(STANDING_THE_LINE_BOND_SENTIMENT_THIN_B, STANDING_THE_LINE_BOND_TRUST_THIN_B, [seedEffect(), woundEffect(), countMarkEffect()]),
      ],
    },
    // F3 — the opening no longer narrates step 1 ("went up the road alone")
    // on a truncation where step 1 never ran (a crit-fail at step 0). Puts
    // the riders in motion instead of the traveler; the rest is unchanged.
    critical_failure: {
      overview:
        'The traveler got three steps into it. The riders came the rest of the way down at a walk, went past ' +
        'the narrow place without slowing, and did not look at who was sitting in it — which is the only ' +
        'reason somebody is still sitting there.',
      changes: [
        scarChip(
          'standing_the_line.break.critical_failure.scar',
          'Went up a road alone to meet four men',
          'A beating that will be measured in days, not hours.',
        ),
      ],
      reactions: [
        {
          id: 'standing_the_line.break.let_them_lie',
          label: 'Let them lie until the light',
          intent: 'Somebody will come down the road eventually. It may as well be with the sun up.',
          effects: [
            criticalWoundEffect(),
            bondChangeEffect(STANDING_THE_LINE_BOND_SENTIMENT_MINIMAL, STANDING_THE_LINE_BOND_TRUST_MINIMAL),
            breakCriticalFailureMarkEffect(),
          ],
        },
      ],
    },
  },
} as const;

// ─── Template ──────────────────────────────────────────────────────────

const STANDING_THE_LINE_SETTINGS = ['stronghold', 'ruin', 'wayside', 'battlefield'] as const;

export const STANDING_THE_LINE_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope({
  id: 'encounter.border.standing_the_line',
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'Standing the Line',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',

  steps: [step0WinTheirTrust, step1Branch, step2Branch],

  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  settings: [...STANDING_THE_LINE_SETTINGS],
  // P1 arrival, one per class (Doctrine v2) — the P2/P3 spine lands below it
  // (step 0 narrativeTemplate).
  openings: {
    wayside: '{name} follows the long road down toward {location}.',
    ruin: 'The road takes {name} through the ruined town of {location}.',
    battlefield: '{name} crosses the old battlefield at {location} by the raised road.',
    stronghold: '{name} climbs the narrow approach to the shut gates of {location}.',
  },
  locationSubtypes: expandSettings([...STANDING_THE_LINE_SETTINGS]),

  traitVariants: TRAIT_VARIANTS,
  supportBundle: SUPPORT_BUNDLE,

  narrativeTemplates: {
    initiation:
      'The riders will reach the narrow place in the time it takes to walk a field. Whatever is to be done ' +
      'must be done before then.',
    success:
      'The road is quiet again. The pilgrim is off it, and the traveler is still standing.',
    failure:
      'Four riders came up the road and went on. What is left behind is not what was standing there.',
  },

  // Verified live: `npm run draw:consequences -- encounter.border.standing_the_line
  // --reach heart --rarity 3` returns exactly relationship / secret / story_seed.
  consequenceDraw: ['relationship', 'secret', 'story_seed'],

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: HOLD_THE_ROAD,
      negative: BREAK_THE_PURSUIT,
    },
    // Mercy pole, not the ruthless one: a fork that failed to resolve must not
    // default the mortal into starting a fight.
    fallback: { ...HOLD_THE_ROAD },
  },

  description:
    'A pilgrim who cannot walk sits where the road goes narrow, and four riders are coming who do not have ' +
    'to stop. The mortal decides — hold the road, or break the riders before they arrive — and the god argues ' +
    'both sides.',
});
