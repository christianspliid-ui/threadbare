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
 * apotheosis seed carries an explicit `templateId` (`aspects.ts`) and is planted
 * `firesPlaceless`, so the templateId place wait in `encounterSeeding.ts` (THR-1929)
 * skips it. So `locationSubtypes` changes where the opening prose binds, never
 * whether the capstone can fire.
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
    // THR-2134: every card's player text rewritten to Prose Doctrine v2; three
    // names renamed verb + noun. Card ids are unchanged.
    effectLine: 'Keep the doorway still while they answer. This argues for neither side.',
    bandProse: {
      near_miss: 'The doorway still shook at its edges while they answered.',
      failure: 'The doorway stayed thin, and it tore at one corner.',
    },
  },
  {
    // Type: Boost — spirit. Leans Martyr: the years already given are an argument
    // for giving the rest.
    id: 'apotheosis.the_years_they_gave',
    name: 'Remember the Years',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.08,
    poleLean: { axis: 'sacrifice_survival', toward: 'positive' },
    imageTag: 'generic.memory',
    effectLine: 'Show them every season they have already given. This argues for saying yes.',
    bandProse: {
      near_miss: 'They counted the seasons, and the count was so long it frightened them.',
      failure: 'All those seasons came back at once, and they could not think past them.',
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
    effectLine: 'Show them one ordinary day: bread, a cold floor, a neighbour shouting. This argues for saying no.',
    bandProse: {
      near_miss: 'The bread smelled right, and they nearly turned toward it.',
      failure: 'The ordinary day came in thin and grey, and made no case for itself.',
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
    effectLine: 'Slow time at the doorway, so the answer is not rushed. This argues for neither side.',
    bandProse: {
      near_miss: 'Time ran slow and they used all of it, and still came to the answer unready.',
      failure: 'Time ran slow, and they spent the long wait afraid.',
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
    effectLine: 'Show them the true price: the strain on a body that must carry a god. This argues for saying no.',
    bandProse: {
      near_miss: 'They weighed the price twice and still could not make it come out even.',
      failure: 'The price was too much to take in, and they stopped weighing it.',
    },
  },
  {
    // Type: Mercy — order. Rider `no_crit_fail`: a god buying disaster-proofing on
    // an irreversible act. Abstains from the fork; it changes the floor, not the side.
    id: 'apotheosis.nothing_breaks_tonight',
    name: 'Ward the Night',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.ward',
    effectLine: 'Set a rule under the scene, so the worst ending cannot happen.',
    bandProse: {
      near_miss: 'The rule held everything together while the room shook.',
      failure: 'It went badly, but the rule kept it from going worse.',
    },
  },
  {
    // Type: Boost — life. Leans Martyr: a body given one more breath of capacity
    // is a body arguing it can hold what is coming.
    id: 'apotheosis.one_more_breath',
    name: 'Fill the Lungs',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.08,
    poleLean: { axis: 'sacrifice_survival', toward: 'positive' },
    imageTag: 'generic.strength',
    effectLine: 'Give their body more room to carry a god. This argues for saying yes.',
    bandProse: {
      near_miss: 'The body took the extra room and was still one breath short.',
      failure: 'The extra strength went in and came straight back out.',
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
  // THR-2134: rewritten to the opening skeleton. The setting opening (P1, with
  // `{location}`) is prepended by `compileOpeningEnvelope`; this is P2 and P3.
  narrativeTemplate:
    '{actor} has given the god years of devotion, and it has worn the boundary between them thin. ' +
    'Tonight a doorway stands open in {actor}. Through it, {actor} could become a living part of the god.\n\n' +
    'The doorway will not stay open long. The god can hold it while {actor} answers, but the answer is ' +
    '{actor}\'s.',
  successAfterimage: 'The god held the doorway steady, and {actor} stood in it and decided.',
  failureAfterimage: 'The doorway shook under the god’s hold, and {actor} decided in a shaking room.',
  successAtCostAfterimage: 'The doorway held, but holding it cost the god more essence than it meant to spend.',
  criticalSuccessAfterimage: 'The doorway stood open and still, and {actor} had all the time they needed to think.',
  criticalFailureAfterimage: 'The doorway tore at the edges and closed, with {actor}\'s answer half-spoken.',
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
    '{actor} says yes, and the god pours itself in through the doorway. {actor} goes still and quiet. ' +
    'No body holds a god without strain. Now the question is whether {actor}\'s body will hold.',
  successAfterimage: 'The body held. {actor} is an aspect of the god now, walking the world on mortal feet.',
  failureAfterimage: '{actor}\'s body split under the strain, and what was poured in ran back out.',
  successAtCostAfterimage: 'The body held, but it left a tremor in {actor}\'s left hand that will not go away.',
  criticalSuccessAfterimage: 'The god filled {actor} to the brim, and the body took it as if built for it.',
  criticalFailureAfterimage: '{actor}\'s body came apart under the pouring, and the god pulled back from the ruin.',
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
    '{actor} looks at what they could become, and chooses to stay mortal. The god does not argue. Now ' +
    'the god must close the doorway slowly, so that {actor} loses only the offer and not a part of themselves.',
  successAfterimage: 'The doorway closed slowly, and {actor} was left whole and their own.',
  failureAfterimage: 'The doorway snapped shut, and {actor} felt it go.',
  successAtCostAfterimage: 'The doorway closed, but closing it cost the god some of its own essence.',
  criticalSuccessAfterimage: 'The closing was so gentle that {actor} remembers only a good morning.',
  criticalFailureAfterimage: 'The doorway tore shut, and took part of {actor}\'s faith with it.',
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
    '{actor} is an aspect of the god now. They look the same, speak the same and answer to the same name. ' +
    'But the people near them feel something strange in the air. The faithful call it a blessing, and the ' +
    'fearful call it wrong.',
  changes: [
    {
      id: 'apotheosis_aspect_attained',
      kind: 'future_hook' as const,
      title: 'An Aspect Walks',
      detail: '{actor} is bound to the god for good, and sends it a trickle of essence.',
      polarity: 'gain' as const,
    },
  ],
  byOutcome: {
    critical_success: {
      overview:
        'The filling ran clean. {actor} came through without a mark, and by dawn was cooking breakfast as on ' +
        'any other day. The bread rose higher than bread should.',
      changes: [
        {
          id: 'apotheosis_clean_vessel',
          kind: 'future_hook' as const,
          title: 'A Clean Vessel',
          detail: 'The aspect is made, and {actor}\'s body came through unharmed.',
          polarity: 'gain' as const,
        },
      ],
    },
    success_at_cost: {
      overview:
        'The aspect is made, but the body paid for it. {actor} has a tremor in the left hand that was not ' +
        'there at dusk. {actor} notices it while pouring water, sets the jug down, and then goes on pouring.',
      changes: [
        {
          id: 'apotheosis_the_tremor',
          kind: 'trait' as const,
          title: 'What The Filling Cost',
          detail: 'The aspect is made, and {actor}\'s body shows the strain.',
          polarity: 'mixed' as const,
        },
      ],
    },
    failure: {
      overview:
        'The body did not hold. The god pulled back before more went in than could come out again. {actor} ' +
        'lived, and by morning sits at the table, eating and answering to their name. But {actor} is a beat ' +
        'slow to everything now.',
      changes: [
        {
          id: 'apotheosis_unmade',
          kind: 'trait' as const,
          title: 'Unmade',
          detail: 'No aspect was made. {actor} was opened and not filled, and is worn through.',
          polarity: 'loss' as const,
        },
      ],
      // Law 56 (THR-1141): 'Unmade' says the soul was worn through. That is a
      // wound and an erosion, and both are now written on the mortal.
      reactions: [
        {
          id: 'apotheosis.unmade.let_them_be',
          label: 'Let them be',
          intent: 'No second attempt. What came back eats and answers, and that is enough.',
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
        'The body came apart. Part of the god was already inside when {actor} gave way, and pulling back ' +
        'tore what was left. What sits at the table now eats when food is set before it. The neighbours ' +
        'still use the old name, and do not ask aloud whether it still fits.',
      changes: [
        {
          id: 'apotheosis_ruined_vessel',
          kind: 'trait' as const,
          title: 'What Came Back',
          detail: 'No aspect was made. The pouring broke {actor}, and the damage shows.',
          polarity: 'loss' as const,
        },
      ],
      // 'What Came Back' is the worst ending the template has. The condition is
      // indefinite because nothing in the fiction gives this one back.
      reactions: [
        {
          id: 'apotheosis.ruined.let_them_be',
          label: 'Let them be',
          intent: 'Ask nothing of what sits there. The god does not try to mend what it tore.',
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
    '{actor} woke under an ordinary sky in an ordinary body, and went about the day. {actor} does not ' +
    'remember the doorway, only a faint ache. The bond to the god held, and so did the faith.',
  changes: [
    {
      id: 'apotheosis_declined',
      kind: 'future_hook' as const,
      title: 'The Doorway Closed',
      detail: '{actor} stayed mortal and is still devoted. The offer can come again later.',
      polarity: 'mixed' as const,
    },
  ],
  byOutcome: {
    critical_success: {
      overview:
        'The closing was so gentle that {actor} kept only a good morning. {actor} woke rested for the first ' +
        'time in a season, and prayed at the usual hour with more feeling than in years.',
      changes: [
        {
          id: 'apotheosis_closed_clean',
          kind: 'reputation_tally' as const,
          title: 'Closed Clean',
          detail: 'The doorway shut before {actor} knew it had opened, and the faith came through stronger.',
          polarity: 'gain' as const,
        },
      ],
    },
    success_at_cost: {
      overview:
        'The doorway closed, but closing it drained the god more than opening it had. {actor} slept through ' +
        'it and is well. The god spent the rest of the night holding the doorway shut.',
      changes: [
        {
          id: 'apotheosis_held_shut',
          kind: 'shell_state' as const,
          title: 'Held Shut',
          detail: '{actor} came through whole. The closing drew on the god’s own essence.',
          polarity: 'mixed' as const,
        },
      ],
    },
    failure: {
      overview:
        'The closing was clumsy, and {actor} knew something had happened. {actor} could not name it, only ' +
        'that a door had been open and was now shut, and that it had been about them. The next morning ' +
        '{actor} prayed at the usual hour, and then listened for an answer.',
      changes: [
        {
          id: 'apotheosis_the_withdrawal_felt',
          kind: 'trait' as const,
          title: 'The Withdrawal, Felt',
          detail: 'The bond holds, but {actor}\'s faith now has a doubt in it.',
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
          intent: 'Do not answer. An honest doubt is worth more than one talked away.',
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
        'The closing went badly. {actor} woke sure they had been weighed and set aside, with no memory of ' +
        'the weighing. At the usual hour {actor} went to the shrine, and stood outside it a long while ' +
        'before going in.',
      changes: [
        {
          id: 'apotheosis_the_pause_on_the_step',
          kind: 'trait' as const,
          title: 'The Pause On The Step',
          detail: '{actor} now stops outside a shrine they used to walk straight into.',
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
    stakes: {
      goal: 'answer while the doorway is held open',
      risk: 'come apart under the pouring',
      won: 'said yes and became a living aspect',
      lost: 'said yes, and the body split under the strain',
      lostBadly: 'came apart under the pouring',
      arms: {
        negative: {
          won: 'chose to stay mortal and woke whole',
          lost: 'chose to stay mortal and felt the doorway snap shut',
          lostBadly: 'felt the doorway tear shut and take some faith with it',
        },
      },
    },
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
    // THR-1292 slice 1 has since taken that activation on deliberately and swept
    // the surviving legacy spellings to canon repo-wide. This entry stayed deleted
    // rather than restored — the sweep repairs authored motivations, it does not
    // re-author removed ones. Restoring it is a content call for plan doc 2.
    motivations: ['sacrifice_survival'],

    settings: [...APOTHEOSIS_SETTINGS],
    openings: {
      rural: '{actor} is working the fields outside {location} at dusk.',
      urban: '{actor} is climbing the stair to a rented room in {location}, late at night.',
      sacred: '{actor} kneels on the shrine floor at {location} at the usual hour of prayer.',
      wayside: '{actor} has stopped for the night at {location}, a day\'s walk from home.',
    },
    locationSubtypes: expandSettings([...APOTHEOSIS_SETTINGS]),

    narrativeTemplates: {
      initiation:
        'A mortal worn thin by devotion stands at a doorway only the god can see. The god can hold it ' +
        'open and argue for an answer, but the answer is the mortal\'s.',
      success:
        'The mortal answered at the doorway while the god held it steady.',
      failure:
        'The doorway gave out before the god could hold it, and shut on a half-spoken answer.',
    },


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
      'A mortal worn thin by long devotion can be raised into a living part of the god. Once it is '
      + 'done, it cannot be undone.',
  }),
);
