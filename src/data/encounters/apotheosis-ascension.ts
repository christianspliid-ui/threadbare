/**
 * The Apotheosis — the capstone covenant that makes a mortal an Aspect of the god. (THR-479)
 *
 * A Tier-1 bespoke marquee, seeded onto a mortal who has held the top Influence
 * rung (Enthralled / tier 4) long enough that the bond has worn the soul thin
 * enough to pour through.
 *
 * Trigger: seeded by seedApotheosisEncounters (engine/aspects.ts) when a tier-4
 * thread has held for ASPECT_ELIGIBILITY_TICKS. Self-targeting onto the mortal.
 *
 * Design docs: Docs/plans/2026-06-23-thr479-aspect-apex-state.md (the mechanic)
 *              Docs/plans/2026-08-11-thr-866-apotheosis-nudge-conversion.md (this shape)
 *
 * ─── Nudge-model conversion (THR-1086, closing THR-866) ──────────────
 *
 * This was the last template in the game carrying `authoredChoices`. The god no
 * longer presses a button and receives an ending. The **mortal** answers, on the
 * axis this encounter has always been about — `sacrifice_survival`, Star's bound
 * value pair, Martyr (+1) against Survivor (−1) — and the god argues with a hand
 * of nudges on the threshold step.
 *
 * Three consequences worth stating, because each one is load-bearing and each
 * one is a place a later edit could silently break the encounter:
 *
 * 1. **`variants` key `'positive'` / `'negative'` and nothing else.** Pole mode
 *    writes the bare pole key through the ordinary choice-history path
 *    (`branchDecision.ts` → `recordDecidedChoice`), so a variant keyed anything
 *    else is unreachable forever and silently — the THR-844 shape. Both the step
 *    fork and `aftermathConfig.variants` are pinned by test.
 *
 * 2. **`aftermathConfig.branchOnStep` names the *deciding* step (0), not the
 *    fork's own index.** The fork sits at `steps[1]` and decides on step 0; the
 *    engine records the choice against the step that resolved. Naming 1 here
 *    would read a step no choice is ever written to (THR-979 cost the vertical
 *    slice both its endings exactly this way).
 *
 * 3. **The grant rides `successMetadata`, not a reaction.** The director's note
 *    that used to sit here said the "unmade" fail-forward was deferred "so the
 *    grant path stays deterministic". It ships now, and the grant is still
 *    deterministic — because `grant_aspect` fires from the Martyr step's
 *    `successMetadata.effects` (THR-783), automatically, on the resolved band.
 *    See the block comment on `step1Ascend` for why this is the only placement
 *    that satisfies the design constraint.
 */

import type {
  UnifiedActionTemplate,
  ActionStep,
  ActionStepBranch,
  StepNudge,
} from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';
import { APOTHEOSIS_ENCOUNTER_TEMPLATE_ID } from '../aspect-content';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';
import {
  APOTHEOSIS_THRESHOLD_DIFFICULTY,
  APOTHEOSIS_VESSEL_DIFFICULTY,
  APOTHEOSIS_WITHDRAWAL_DIFFICULTY,
} from '../nudge-constants';

/**
 * The setting envelope (THR-884).
 *
 * Four classes, not eight. A mortal worn thin by tier-4 devotion lives where
 * people live and prays where people pray, so the encounter plays in settlements,
 * at shrines, and on the road. It does not play in a fortress muster yard, a
 * mage's tower, a collapsed ruin, or a battlefield — declaring those would buy
 * coverage the prose has never been written for.
 *
 * The envelope is declarative only for *this* template's reachability: the
 * apotheosis seed carries an explicit `templateId` (`aspects.ts`), and the
 * location-subtype filter in `encounterSeeding.ts` gates **family-only** seeds.
 * So `locationSubtypes` changes where the opening prose binds, never whether the
 * capstone can fire.
 */
const APOTHEOSIS_SETTINGS = ['rural', 'urban', 'sacred', 'wayside'] as const;

// ─── Law 56 backing tuning (THR-1141, NFP #1) ────────────────────────
//
// The four failure endings each describe a mortal left damaged — worn through,
// broken, doubting, hesitating on a shrine step. Until this ticket none of them
// wrote anything: the template's only write is the `grant_aspect` on the
// success side, so every failure chip claimed a mark the encounter never made.
// UI Law 56 says a chip reports state the engine wrote, so the damage the prose
// describes is now damage the sheet carries.
//
// The conditions are chosen from the live catalog, not minted: a failed
// apotheosis is a wounding and a grief, and `trait.condition.wounded` /
// `trait.condition.grieving` both resolve. Minting a bespoke condition for one
// encounter is the kind of green-fielding the systems inventory exists to stop.
//
// THR-1171 — that claim was half false when written: `wounded` existed and
// `grieving` did not, so the `condition_attachment` below hit the fail-soft miss
// in `encounterAftermath` and wrote nothing, while the chip above it went on
// reporting the grief (a UI Law 56 breach, in the ticket that was fixing UI Law
// 56 breaches). The sentence read as checked, which is what kept anyone from
// checking it. `trait.condition.grieving` is now a real definition in
// `condition-trait-content.ts` — two independent encounters had reached for the
// same missing word, which is a vocabulary gap rather than two authoring slips —
// and the liveness sweep now walks aftermath, so a comment like this one can no
// longer be the only thing standing between a dead id and the player.

/** A frame opened and not filled (~60 game days). Long, because it is not a bruise. */
const APOTHEOSIS_UNMADE_DURATION_TICKS = 720;
/** A frame that came apart (~120 game days) and stacked, because it is worse. */
const APOTHEOSIS_RUINED_DURATION_TICKS = 1440;
const APOTHEOSIS_RUINED_STACKS = 2;
/** What the pouring took out of the soul it was poured through. */
const APOTHEOSIS_UNMADE_QUINTESSENCE = -0.15;
const APOTHEOSIS_RUINED_QUINTESSENCE = -0.3;
/** A doubt entering a devotion that had none. The thread holds; the trust dips. */
const APOTHEOSIS_DOUBT_TRUST = -0.12;
/** Twenty years of unhesitating mornings, and now a pause. */
const APOTHEOSIS_PAUSE_TRUST = -0.25;
const APOTHEOSIS_PAUSE_DURATION_TICKS = 480;

// ─── The god's hand ──────────────────────────────────────────────────

/**
 * Step 0's hand — seven cards, `NUDGE_HAND_MIN`..`MAX` (4–8).
 *
 * Shape check against `nudgeAuthoringConstants.ts`, which owns every number here
 * (the guardrails are inherited, never restated):
 *   • one sphere-less common option (`HAND_COMMON_OPTIONS_MIN`)
 *   • six distinct spheres (`HAND_SPHERE_COVERAGE_MIN` is 4)
 *   • pole-leaning cards for **both** poles — two Martyr, two Survivor — so the
 *     fork is argued in both directions and neither is the hand's default
 *   • summed `forecastDelta` 0.49, under `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70)
 *
 * No card carries `libraryCardId`. That field gates a card behind the god's
 * unlocked repertoire (`nudges.ts`), and an apex beat that can deal an empty
 * hand is worse than one whose cards are always available. The card *type* each
 * option instances is named in its comment, from the 21-type library.
 */
const APOTHEOSIS_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — common pool, no sphere. Abstains from the fork: it steadies
    // the hands holding the doorway and argues for neither answer.
    id: 'apotheosis.steady_hands',
    name: 'Steady Hands',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'You hold your own hands still at the threshold, so the doorway stops shivering while they answer. A small help, and it argues for neither side.',
    bandProse: {
      near_miss: 'The hands held. The doorway did not, quite, and the edges of it kept moving.',
      failure: 'Steady hands on a thin place still leave it a thin place, and it tore at one corner.',
    },
  },
  {
    // Type: Boost — spirit. Leans Martyr: the years already given are an argument
    // for giving the rest.
    id: 'apotheosis.the_years_they_gave',
    name: 'The Years They Gave',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.08,
    poleLean: { axis: 'sacrifice_survival', toward: 'positive' },
    imageTag: 'generic.memory',
    effectLine: 'You lay out every year they already spent on you, in order, where they can see it. A real help, and it argues for pouring through.',
    bandProse: {
      near_miss: 'The years stood up and were counted, and the count was so long it frightened them.',
      failure: 'The years came back all at once, and under the weight of them the mortal could not hear the doorway at all.',
    },
  },
  {
    // Type: Boost — light. Leans Survivor: an ordinary morning, shown plainly, is
    // the strongest argument for staying finite.
    id: 'apotheosis.let_the_morning_in',
    name: 'Let The Morning In',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.07,
    poleLean: { axis: 'sacrifice_survival', toward: 'negative' },
    imageTag: 'generic.light',
    effectLine: 'You bring one ordinary morning up around them — bread, cold floor, a neighbour shouting. A small help, and it argues for staying mortal.',
    bandProse: {
      near_miss: 'The morning arrived and the bread smelled right, and they nearly turned toward it.',
      failure: 'The morning came in thin and grey and made no case for itself at all.',
    },
  },
  {
    // Type: Boost — time. Abstains: it buys the scene length, not a direction.
    id: 'apotheosis.hold_the_hour_open',
    name: 'Hold The Hour Open',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.time-slow',
    effectLine: 'You stretch the hour around the doorway so the answer is not rushed. The largest help in the hand, and it argues for neither side.',
    bandProse: {
      near_miss: 'The hour ran long and they used all of it, and still arrived at the edge unready.',
      failure: 'The hour ran long, and a long hour at a thin place is a long hour to be frightened in.',
    },
  },
  {
    // Type: Whisper — mind. Leans Survivor: an honest price, named aloud, mostly
    // argues against paying it.
    id: 'apotheosis.count_what_it_costs',
    name: 'Count What It Costs',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.07,
    poleLean: { axis: 'sacrifice_survival', toward: 'negative' },
    imageTag: 'generic.oath',
    effectLine: 'You show them the price honestly — the strain, the stretching, the body that has to carry it. A small help, and it argues for staying mortal.',
    bandProse: {
      near_miss: 'They read the price through twice and could not make the last line come out even.',
      failure: 'The price read as a wall of figures, and they stopped reading partway down.',
    },
  },
  {
    // Type: Mercy — order. Rider `no_crit_fail`: a god buying disaster-proofing on
    // an irreversible act. Abstains from the fork; it changes the floor, not the side.
    id: 'apotheosis.nothing_breaks_tonight',
    name: 'Nothing Breaks Tonight',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.ward',
    effectLine: 'You set an order under the scene so it cannot come apart at the worst seam. Little help with the odds, and the disaster is off the table.',
    bandProse: {
      near_miss: 'The rule under the room held the seams together while everything above them shook.',
      failure: 'It went badly, and the rule under the room kept it from going worse.',
    },
  },
  {
    // Type: Boost — life. Leans Martyr: a body given one more breath of capacity
    // is a body arguing it can hold what is coming.
    id: 'apotheosis.one_more_breath',
    name: 'One More Breath',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.08,
    poleLean: { axis: 'sacrifice_survival', toward: 'positive' },
    imageTag: 'generic.strength',
    effectLine: 'You widen the body a fraction — lungs, heart, the room behind the ribs. A real help, and it argues for pouring through.',
    bandProse: {
      near_miss: 'The body took the extra breath and found it was one breath short of enough.',
      failure: 'The extra breath went in and came straight back out, and the ribs stayed the size they were.',
    },
  },
];

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — The Threshold. The god holds a thin place thin; the mortal answers.
 *
 * `continue_weakened`: a stumble here must not end the encounter, because the
 * decision is recorded *before* `advanceStep` runs (`applyAgentDecidedBranches`
 * is called unconditionally) and the mortal is owed their answer even on a bad
 * night. A stumble instead folds the whole action to `success_at_cost`, which is
 * what the "at cost" endings on both poles are written for.
 *
 * A `critical_failure` here still ends the action outright — `advanceStep` forces
 * `fail_action` on a crit-fail whatever the step declares — and the pole is
 * already in choice history, so the crit-fail band of the *decided* pole renders.
 * Both poles author that band for exactly this reason.
 */
const step0TheThreshold: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: APOTHEOSIS_THRESHOLD_DIFFICULTY,
  purposeLine: 'Hold the doorway',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  nudges: APOTHEOSIS_HAND,
  narrativeTemplate:
    'There is a devotion that stops being a feeling and becomes a doorway, and the god found one ' +
    'standing open. The mortal had given what a mortal can give — years, certainty, the shape of an ' +
    'ordinary life worn down like a coin handled too long — and in the giving the boundary between ' +
    'worshipper and worshipped had gone thin as wet paper. The god could see through it. Not into the ' +
    'mortal: *out* through them, as though their eyes had become a second window onto the world, and ' +
    'through that window the god glimpsed standing in two places at once — walking a dusty road on ' +
    'tired feet, and hanging in the high cold air above the whole of it, both, together, from here on. ' +
    'Doorways like this open once, and they do not stay open. The god can hold it while the mortal ' +
    'answers. The god cannot answer for them.',
  successAfterimage: 'The god held the doorway steady, and the faithful one stood in it and decided.',
  failureAfterimage: 'The doorway shuddered under the god’s grip, and the decision was made in a shaking room.',
  successAtCostAfterimage: 'The doorway held, and holding it burned through more essence than the god had meant to spend.',
  criticalSuccessAfterimage: 'The threshold stood open and unshaking, wide enough to think inside.',
  criticalFailureAfterimage: 'The thin place tore at the edges and closed itself, with the answer half-spoken.',
};

/**
 * Step 1, Martyr pole (`positive`) — the vessel opens.
 *
 * ─── Where the grant sits, and why (the ticket's one open wiring call) ───
 *
 * On this step's `successMetadata.effects`. Not in the aftermath at all.
 *
 * The plan left the choice between the Martyr variant's upper-band
 * `byOutcome.reactions` and that override's `changes`. Reading the types settles
 * it: **`changes` is display-only** — `EncounterAftermathChange` carries `id`,
 * `kind`, `title`, `detail`, `polarity` and no `effects` field, so "promote it to
 * `changes`" grants nothing. That leaves `reactions`, and a reaction is a click.
 *
 * The design constraint is explicit that an irreversible world-write must not sit
 * behind a click the player would never decline — and post-conversion that click
 * would be pure theatre, because by the time this band renders the mortal has
 * already said yes and the frame has already held. `successMetadata.effects`
 * (THR-783) dispatches through the *same* `applyEncounterAftermathReaction` a
 * reaction does, with the same effect vocabulary and the same tracing, and fires
 * automatically on the resolved band. Nobody clicks; the grant is the ending.
 *
 * It also makes the band gating exact rather than approximate. The split is
 * `isStepSuccess`, so:
 *   • `critical_success` / `success` / `success_at_cost` / `near_miss` → granted
 *   • `failure` / `critical_failure` → **not** granted; this is the unmade ending
 * A band-keyed `byOutcome.reactions` could not have expressed that as cleanly:
 * `applyAftermathOutcomeBand` replaces `reactions` wholesale, so any band that
 * authored its own reactions would have dropped the grant by omission.
 *
 * `fail_action`: an unmade apotheosis is a failed action and should say so. It
 * also makes the ending demonstrable — `?outcome=failure` only lands on a step
 * declaring `fail_action`, otherwise `computeFinalActionOutcome` folds a failed
 * final step into `success_at_cost` and the pin diverges.
 */
const step1Ascend: ActionStep = {
  reach: 'star',
  duration: { min: 3, max: 4 },
  difficulty: APOTHEOSIS_VESSEL_DIFFICULTY,
  purposeLine: 'Fill the vessel',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  successMetadata: {
    effects: [
      {
        kind: 'grant_aspect' as const,
        reason: 'apotheosis',
      },
    ],
  },
  narrativeTemplate:
    'The mortal said yes with the same quiet certainty that had carried them this far, and the god ' +
    'leaned through. There is no thunder in it. Apotheosis is a filling — a dry riverbed when the rains ' +
    'come, first a darkening of the dust, then a thread of water, then the whole channel running with ' +
    'what was always meant to be there and had only been waiting. The mortal does not cry out. They go ' +
    'still, the stillness of a held breath that does not need to end. What happens next is a question ' +
    'about the frame: no body holds the divine without strain, and to be filled is to be stretched.',
  successAfterimage: 'The vessel opened and held, and an aspect of the god walks the world on mortal feet.',
  failureAfterimage: 'The frame strained, and split, and what was poured in ran back out through the cracks.',
  successAtCostAfterimage: 'The vessel held, and left a tremor in the left hand that will not settle again.',
  criticalSuccessAfterimage: 'The filling ran clean to the brim, and the frame took it as though built for it.',
  criticalFailureAfterimage: 'The frame came apart under the pouring, and the god pulled back from a ruin it had made.',
};

/**
 * Step 1, Survivor pole (`negative`) — the doorway closes.
 *
 * No `successMetadata`: no band on this pole grants anything, which is the
 * mechanical statement of "direction stays with the decision". A Survivor
 * decision never becomes an aspect because the roll went well.
 */
const step1Withhold: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: APOTHEOSIS_WITHDRAWAL_DIFFICULTY,
  purposeLine: 'Close it gently',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The mortal looked through the open doorway at everything they could become, and chose to remain ' +
    'their own. The god does not argue. What is left is the closing, and a closing can be done well or ' +
    'badly: the god thins the doorway from its own side, a little at a time, so that what fades from ' +
    'the faithful one is an offer and not a limb. They will live and die as a mortal. They will carry ' +
    'their faith to the grave as a private and human matter, and never feel the cold high air or the ' +
    'strain of holding more than a single life can hold.',
  successAfterimage: 'The doorway thinned and faded, and the faithful one was left whole and entirely their own.',
  failureAfterimage: 'The doorway did not thin so much as snap, and the faithful one felt it go.',
  successAtCostAfterimage: 'The doorway closed, and closing it cost the god a measure of what had opened it.',
  criticalSuccessAfterimage: 'The closing was so gentle the faithful one only remembered a good morning.',
  criticalFailureAfterimage: 'The doorway tore closed, and took a strip of the devotion out with it.',
};

/**
 * The fork. `decidedBy` pole mode on `sacrifice_survival` — Star's bound value
 * pair, the axis this encounter has always been a question about.
 *
 * `variants` key `'positive'` (Martyr) and `'negative'` (Survivor) because that
 * is what `recordDecidedChoice` writes; `fallback` takes Survivor, which is the
 * conservative direction — a fork that failed to resolve must not mint a
 * permanent, irreversible edge by default.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'sacrifice_survival' },
  variants: {
    positive: step1Ascend,
    negative: step1Withhold,
  },
  fallback: { ...step1Withhold },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

/**
 * Martyr pole. Base variant is the clean `success` ending — the aspect is made.
 * `byOutcome` overrides carry the other four reachable bands (THR-969).
 *
 * `contested_won` / `contested_lost` are deliberately unauthored: this template
 * is self-targeting and never contested, so those two `UnifiedActionOutcome`
 * values are unreachable here and authoring them would ship prose no player can
 * arrive at — dead content wearing a full band table.
 */
const ASCEND_AFTERMATH = {
  overview:
    'By the next dawn those who knew the mortal best could not say what had changed, only that it had. ' +
    'They stand the same and speak the same and answer to the same name, and to be near them is to feel ' +
    'the air go close and strange, as before a storm that never quite breaks. The faithful call it ' +
    'blessing. The fearful call it wrongness. Both are right. An aspect of the god moves among mortals ' +
    'now, and the world will bend a little, here and there, around the place where heaven has learned to walk.',
  changes: [
    {
      id: 'apotheosis_aspect_attained',
      kind: 'future_hook' as const,
      title: 'An Aspect Walks',
      detail:
        'The mortal is a partial aspect of the god — past the five tiers of influence, a permanent bond ' +
        'that channels a trickle of essence and bends curated events toward them. It cannot be undone, ' +
        'and it will outlast the body that holds it.',
      polarity: 'gain' as const,
    },
  ],
  byOutcome: {
    critical_success: {
      overview:
        'The filling ran clean to the brim. No strain showed at the seams, and by dawn the faithful one ' +
        'was moving through their own house as though they had been built to carry this and had only ' +
        'been waiting to be handed it. They cooked breakfast. The bread rose higher than bread rises.',
      changes: [
        {
          id: 'apotheosis_clean_vessel',
          kind: 'future_hook' as const,
          title: 'A Clean Vessel',
          detail:
            'The aspect is made, and made without damage — the frame took the divine without a crack to ' +
            'nurse. A permanent bond, and a body still fit to carry it.',
          polarity: 'gain' as const,
        },
      ],
    },
    success_at_cost: {
      overview:
        'The vessel held, and the holding cost. The aspect is made and will outlast the body, and the ' +
        'body now has a tremor in the left hand that was not there at dusk and will not leave. They ' +
        'notice it while pouring water. They set the jug down, look at the hand, and go on pouring.',
      changes: [
        {
          id: 'apotheosis_the_tremor',
          kind: 'trait' as const,
          title: 'What The Filling Cost',
          detail:
            'The aspect is made. The frame that took it did not come through clean, and carries the ' +
            'strain where anyone close enough can see it.',
          polarity: 'mixed' as const,
        },
      ],
    },
    failure: {
      overview:
        'The frame did not hold. The god felt it go — a seam parting under the pouring, the same sound a ' +
        'green log makes in a hot fire — and drew back before more went in than could be got out again. ' +
        'The mortal lived. They are at their own table by morning, eating, answering to their name, and ' +
        'there is a stillness behind the eyes that arrives one breath late to everything now.',
      changes: [
        {
          id: 'apotheosis_unmade',
          kind: 'trait' as const,
          title: 'Unmade',
          detail:
            'They were opened and not filled. No aspect was made, no bond past tier four, and the soul ' +
            'that was worn thin enough to pour through was worn through instead.',
          polarity: 'loss' as const,
        },
      ],
      // Law 56 (THR-1141): 'Unmade' says the soul was worn through. That is a
      // wound and an erosion, and both are now written on the mortal.
      reactions: [
        {
          id: 'apotheosis.unmade.let_them_be',
          label: 'Let them be',
          intent: 'They are at their own table by morning. Leave them there.',
          effects: [
            {
              kind: 'condition_attachment' as const,
              templateId: 'trait.condition.wounded',
              durationOverride: APOTHEOSIS_UNMADE_DURATION_TICKS,
              targetAgentId: '$target',
            },
            {
              kind: 'quintessence_shift' as const,
              delta: APOTHEOSIS_UNMADE_QUINTESSENCE,
              targetAgentId: '$target',
            },
          ],
        },
      ],
    },
    critical_failure: {
      overview:
        'The frame came apart. Not all at once and not quietly: the god had a portion of itself already ' +
        'through the doorway when the mortal gave under it, and pulling back tore what it was pulling ' +
        'back from. What sits at the table by morning eats when food is put in front of it. The village ' +
        'still uses the old name. Whether the old name still fits is a question the village will spend ' +
        'the winter not asking aloud.',
      changes: [
        {
          id: 'apotheosis_ruined_vessel',
          kind: 'trait' as const,
          title: 'What Came Back',
          detail:
            'The pouring broke the frame it was poured into. No aspect, no grant, and the devotion that ' +
            'made the mortal eligible is now the wound that shows.',
          polarity: 'loss' as const,
        },
      ],
      // 'What Came Back' is the worst ending the template has. The condition is
      // indefinite because nothing in the fiction gives this one back.
      reactions: [
        {
          id: 'apotheosis.ruined.let_them_be',
          label: 'Let them be',
          intent: 'The village still uses the old name.',
          effects: [
            {
              kind: 'condition_attachment' as const,
              templateId: 'trait.condition.wounded',
              durationOverride: APOTHEOSIS_RUINED_DURATION_TICKS,
              stackCount: APOTHEOSIS_RUINED_STACKS,
              targetAgentId: '$target',
            },
            {
              kind: 'quintessence_shift' as const,
              delta: APOTHEOSIS_RUINED_QUINTESSENCE,
              targetAgentId: '$target',
            },
          ],
        },
      ],
    },
  },
} as const;

/**
 * Survivor pole. Base variant is the clean `success` ending — the doorway closes
 * and the thread survives it. Four band overrides, same reachability reasoning as
 * the Martyr pole above.
 *
 * The re-offer is governed by `ASPECT_REOFFER_COOLDOWN_TICKS` against the
 * `apotheosisOfferedTick` stamped at seed time (`aspects.ts`), which is
 * outcome-independent. So these endings describe how the *mortal* is left, and
 * none of them claims to lengthen the cooldown — the plan called for using the
 * existing constant rather than minting a second, and a `detail` line promising a
 * delay no code applies would be a contract written and never read.
 */
const WITHHOLD_AFTERMATH = {
  overview:
    'The mortal woke to an ordinary sky and an ordinary body and went about the work of being alive, ' +
    'with no memory of the threshold and the faintest residue of an ache, like the ghost of a dream ' +
    'about flying. The thread to the god held. The devotion held. The faithful one remains what they ' +
    'have always been, wholly and finitely their own, and there is a grace in that which the god chose ' +
    'not to argue with.',
  changes: [
    {
      id: 'apotheosis_declined',
      kind: 'future_hook' as const,
      title: 'The Doorway Closed',
      detail:
        'The mortal remained mortal, at the height of mortal devotion (tier 4). The offer can come ' +
        'again once the cooldown has worn around.',
      polarity: 'mixed' as const,
    },
  ],
  byOutcome: {
    critical_success: {
      overview:
        'The closing was so gentle that what the faithful one kept was a good morning. They woke rested ' +
        'for the first time in a season, prayed at the usual hour, and meant it more than they had in ' +
        'years. Whatever the god had almost done, what it did instead was let them sleep.',
      changes: [
        {
          id: 'apotheosis_closed_clean',
          kind: 'reputation_tally' as const,
          title: 'Closed Clean',
          detail:
            'The doorway shut without the faithful one ever knowing it opened, and the devotion came ' +
            'through the night stronger than it went in.',
          polarity: 'gain' as const,
        },
      ],
    },
    success_at_cost: {
      overview:
        'The doorway closed, and closing it took more out of the god than opening it had. The faithful ' +
        'one is fine, and better than fine — they slept through it. The god spent the rest of the night ' +
        'holding a thin place shut against its own appetite for the person on the other side.',
      changes: [
        {
          id: 'apotheosis_held_shut',
          kind: 'shell_state' as const,
          title: 'Held Shut',
          detail:
            'The mortal came through whole. The closing drew down the god’s own reserve, which is a ' +
            'price paid entirely on the divine side of the doorway.',
          polarity: 'mixed' as const,
        },
      ],
    },
    failure: {
      overview:
        'The doorway did not thin so much as snap, and the faithful one felt it go. They could not name ' +
        'it. They knew a door had been open and was shut, that it had been about them, and that they had ' +
        'not been asked in a language they could hear. They prayed the next morning at the usual hour ' +
        'and listened afterward, which they had never done before.',
      changes: [
        {
          id: 'apotheosis_the_withdrawal_felt',
          kind: 'trait' as const,
          title: 'The Withdrawal, Felt',
          detail:
            'The closing was clumsy and the mortal registered it. The thread holds at tier four, and ' +
            'the devotion under it now has a doubt in it that was not there.',
          polarity: 'loss' as const,
        },
      ],
      // 'The Withdrawal, Felt' says the thread holds and the devotion under it
      // has a doubt in it. A held thread with dipped trust is exactly a bond
      // edge, so the doubt is written there rather than described.
      reactions: [
        {
          id: 'apotheosis.withdrawal.listen',
          label: 'Let them listen',
          intent: 'They prayed at the usual hour, and listened afterward.',
          effects: [
            {
              kind: 'bond_change' as const,
              withAgentId: '$target',
              sentimentDelta: 0,
              trustDelta: APOTHEOSIS_DOUBT_TRUST,
              reciprocal: false,
            },
          ],
        },
      ],
    },
    critical_failure: {
      overview:
        'The doorway tore closed and took a strip of the devotion out with it. The faithful one woke ' +
        'with the certainty that they had been weighed and set down, and no memory of the weighing. They ' +
        'went to the shrine at the usual hour and stood outside it for a while first. Twenty years of ' +
        'unhesitating mornings, and now a pause on the step.',
      changes: [
        {
          id: 'apotheosis_the_pause_on_the_step',
          kind: 'trait' as const,
          title: 'The Pause On The Step',
          detail:
            'The closing wounded what it was protecting. The thread survives, and the faithful one now ' +
            'hesitates before a shrine they used to walk straight into.',
          polarity: 'loss' as const,
        },
      ],
      // The worst of the declined endings: the thread survives, so the write is
      // a deeper trust dip than 'The Withdrawal, Felt' — plus the grief of
      // twenty years of certainty ending. `grieving` is the live condition that
      // names a loss with no body to bury.
      reactions: [
        {
          id: 'apotheosis.pause.stand_outside',
          label: 'Let them stand outside a while',
          intent: 'They will go in. Not yet.',
          effects: [
            {
              kind: 'bond_change' as const,
              withAgentId: '$target',
              sentimentDelta: 0,
              trustDelta: APOTHEOSIS_PAUSE_TRUST,
              reciprocal: false,
            },
            {
              kind: 'condition_attachment' as const,
              templateId: 'trait.condition.grieving',
              durationOverride: APOTHEOSIS_PAUSE_DURATION_TICKS,
              targetAgentId: '$target',
            },
          ],
        },
      ],
    },
  },
} as const;

// ─── Template ──────────────────────────────────────────────────────────

export const APOTHEOSIS_ASCENSION_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(
  withEncounterContract({
    id: APOTHEOSIS_ENCOUNTER_TEMPLATE_ID,
    rarityTier: 4,
    intrinsicTier: 'story_beat',
    name: 'The Apotheosis',
    reach: 'star',
    crudType: 'update',
    scale: 'local',

    steps: [step0TheThreshold, step1Branch],

    apCost: 1,

    actorAffinities: ['individual'],
    // `'tradition_change'` used to sit beside this one and is gone. It is not a
    // member of `ValuePair` — the pair is `tradition_novelty` — so it never
    // matched anything and carried a standing type error in the red baseline.
    // Deleted rather than corrected to `tradition_novelty`: repairing the spelling
    // would *activate* a motivation this encounter has never actually scored on,
    // which is a live change to draw behaviour and outside this ticket. What is
    // left is the axis the encounter is about and the fork now decides on.
    motivations: ['sacrifice_survival'],

    settings: [...APOTHEOSIS_SETTINGS],
    openings: {
      rural:
        'They are in the field they have worked since they were tall enough to swing, and the light on ' +
        'it has gone wrong in a way only the god can see.',
      urban:
        'They are on a stair between two rented rooms, in a city that has never once looked at them ' +
        'twice, and the stairwell has gone quiet the way a held breath is quiet.',
      sacred:
        'They are on the shrine floor at the hour they are always on the shrine floor, and tonight the ' +
        'floor is the thinnest place for a hundred miles.',
      wayside:
        'They are a day out from anywhere, with a small fire and a folded coat for a pillow, and the ' +
        'dark around the fire has stopped being ordinary dark.',
    },
    locationSubtypes: expandSettings([...APOTHEOSIS_SETTINGS]),

    narrativeTemplates: {
      initiation:
        'A mortal worn thin by devotion stands at a doorway only the god can see. The god can hold it ' +
        'open while they answer, and argue for the answer it wants — and the answer is theirs.',
      success:
        'The faithful one answered at the threshold, and the god held the doorway steady while they did.',
      failure:
        'The thin place gave out before the threshold could be held, and the doorway shut on a half-spoken answer.',
    },

    illustrationUrl: '/concept-art/encounters/placeholder.jpg',

    aftermathConfig: {
      // The *deciding* step (0), not the fork's index (1). See the header note —
      // the engine records the pole against the step that resolved, and naming
      // the fork's own index reads a step no choice is ever written to (THR-979).
      branchOnStep: 0,
      variants: {
        positive: ASCEND_AFTERMATH,
        negative: WITHHOLD_AFTERMATH,
      },
      fallback: { ...WITHHOLD_AFTERMATH },
    },

    description:
      'The capstone covenant of divine influence: a mortal worn thin by devotion can be raised into a ' +
      'partial aspect of the god — a permanent apex beyond the five Influence tiers.',
  }),
);
