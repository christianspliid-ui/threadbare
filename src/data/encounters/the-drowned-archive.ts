/**
 * The Drowned Archive — a three-step `shadow` -> `eye` -> `veil` delve: the
 * record vault under the settlement is flooding, a page has surfaced saying
 * the founding families never owned the ground, and the thing that has kept
 * the rest of the record will only give it up for a true answer, spoken the
 * way the record spells it.
 *
 * Batch: deep-places (THR-1223 follow-on), slot 2. Encounter Factory v3,
 * nudge-native, THR-1045 Composition Contract.
 *
 * ── Prose Doctrine v2 ──
 * Narrator mode throughout; no branching (`decidedBy`/`authoredChoices`) —
 * this is a test, not a fork (design doc § 1, row 6).
 *
 * Design doc: `Docs/plans/encounters/the-drowned-archive-final.md`
 * Editorial pass: `Docs/plans/encounters/the-drowned-archive-editorial.md`
 * Systems audit: `Docs/plans/encounters/the-drowned-archive-systems.md`
 * Package critique: `Docs/plans/encounters/the-drowned-archive-package.md`
 *
 * Package-critic correction already applied in the final packet before Pass 4
 * (`the-drowned-archive-package.md` § Fix list #1, "A1"): the five
 * `*_charter_known` / `*_kept_name` / `*_one_line` chips originally pointed
 * `stateNoun` at `$target` with `visualKind: 'location'`, but the write behind
 * them (`intelligence`) only ever touches the actor — `targetEntityId` cannot
 * be authored (see the comment on § 12 below). Re-anchored to
 * `entityId: '$actor'` with `visualKind` dropped so the chip's click lands
 * where the state actually changed. Implemented as written below; not
 * reverted.
 */

import type {
  ActionStep,
  StepNudge,
  TraitVariant,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { EncounterSupportActorSpec, EncounterSupportBundle } from '../../types/encounter';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Support Bundle ──────────────────────────────────────────────

const keeperSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'keeper',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['acolyte', 'monk', 'chaplain'],
  supportRole: 'record_keeper',
  spawnNpcRole: 'scribe',
  spawnName: 'Sennet Ryle',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [keeperSpec];

// ─── The trait hook ──────────────────────────────────────────────

/**
 * `trait.core.core_integrity.virtue` — the "True" pole of the Core integrity
 * continuum. Built by `CORE_TRAIT_DEFINITIONS` from `CORE_CONTINUA`
 * (`coreRegistry.ts`); a seeded definition, so `validateTraitRefs()` does not
 * report it dead. Picked for fit: the continuum's own `reachCouplings` are
 * `shadow: +1` and `eye: +1` — two of this encounter's three reaches — and it
 * `governs: 'inner self matches outer'`, which is the warden's law stated as a
 * character trait.
 *
 * Engine correction carried from the design doc (§ 10, systems pass finding):
 * `TraitVariant` is template-scoped, not step-scoped — `resolveTraitVariants`
 * runs on every step's resolution regardless of which step is current, so
 * this factor line renders on all three steps rather than only step 1. The
 * line below is phrased as a general statement about the trait-holder's
 * honesty (not narrowly about reading) so it reads correctly wherever it
 * appears — the schema has no way to scope it to one step.
 */
const DROWNED_ARCHIVE_TRAIT_REF = 'trait.core.core_integrity.virtue';

const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: DROWNED_ARCHIVE_TRAIT_REF,
    forecastDelta: 0.05,
    difficultyDelta: -0.02,
    factorLine: 'Being True, they will not shade what they find to please anyone.',
    addNudgeIds: ['archive.draw_on_character'],
  },
];

// ─── Step 0 hand — 7 cards ─────────────────────────────────────────
//
// Every card uses its library member's authored face verbatim (name + quote
// from CARD_CONTENT in nudge-card-library.ts); `id` is the library title in
// snake case. `effectLine` and `imageTag` stay hand-authored. `fiction` is
// retired by Prose Doctrine v2 and drawn by no surface — each card carries
// its library member's existing `quote` verbatim rather than new dead prose.

const STEP_0_HAND: readonly StepNudge[] = [
  {
    id: 'archive.clear_the_traces',
    libraryCardId: 'card.veil.attunement.darkness',
    name: 'Clear The Traces',
    sphere: 'darkness',
    essenceCost: 3,
    forecastDelta: 0.07,
    costs: { detectionDelta: -0.1 },
    valueDrift: { axis: 'revelation_discretion', toward: 'negative' },
    imageTag: 'generic.dark',
    effectLine: 'Leave no mark behind. No rival power can follow the hand back to its source.',
    bandProse: {
      success: 'Nobody upstairs could say who helped them down.',
      near_miss: 'The hand behind it went unseen. It also went unfinished.',
    },
  },
  {
    id: 'archive.loosen_their_footing',
    libraryCardId: 'card.stumble.signature.chaos',
    name: 'Loosen Their Footing',
    sphere: 'chaos',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.luck',
    effectLine: 'The ground turns against whoever would stop them, and gives way under them.',
    bandProse: {
      critical_success: 'The dark below shifted first, and they went down through the gap it left.',
      failure: 'The ground gave in the wrong place, and it gave under them.',
    },
  },
  {
    id: 'archive.find_what_remains',
    libraryCardId: 'card.cache.signature.matter',
    name: 'Find What Remains',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.matter',
    effectLine: 'Reveal a scroll case left by an earlier party. Oiled leather, theirs to keep.',
    grants: [
      {
        kind: 'attachment_grant',
        templateId: 'reward_tools_instruments_scroll_case',
        targetAgentId: '$actor',
      },
    ],
    bandProse: {
      success_at_cost: 'The case came up with them. Most of their own kit did not.',
      failure: 'They kept the case. Everything else they carried out was wet through.',
    },
  },
  {
    id: 'archive.read_the_whole_shape',
    libraryCardId: 'card.whisper.attunement.light',
    name: 'Read The Whole Shape',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.1,
    reveals: 'next_step_demand',
    imageTag: 'generic.focus',
    effectLine: 'Show them the layout of the place before they move through it.',
    bandProse: {
      critical_success: 'They knew the room before they entered it, and never put a foot wrong.',
      failure: 'They had the whole layout and were heard anyway.',
    },
  },
  {
    id: 'archive.spare_the_worst',
    libraryCardId: 'card.mercy.core',
    name: 'Spare The Worst',
    essenceCost: 2,
    forecastDelta: 0.04,
    rider: 'no_crit_fail',
    imageTag: 'generic.mercy',
    effectLine: 'However badly this goes, it cannot end in disaster.',
    bandProse: {
      near_miss: 'They got through on the last of it, and no further harm followed.',
      failure: 'It went badly and stopped there, and no worse thing came of it.',
    },
  },
  {
    id: 'archive.mend_what_broke',
    libraryCardId: 'card.balm.hunger.reclaim',
    name: 'Mend What Broke',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.vigor',
    effectLine: 'Close their wounds where they stand. The hurt stops slowing them.',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded' }],
    bandProse: {
      success: 'They moved without a limp and were not heard.',
      near_miss: 'The hurt was gone and they still made noise on the stair.',
    },
  },
  {
    id: 'archive.send_a_dream',
    libraryCardId: 'card.compulsion.hunger.haunt',
    name: 'Send A Dream',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.memory',
    effectLine: 'An urge arrives in their sleep and stays. For a while they will go looking.',
    grants: [
      {
        kind: 'plant_compulsion',
        targetAgentId: '$actor',
        encounterBias: { explore: 0.6 },
        narrativeHook: 'Since the rain they have dreamed of rooms under rooms, and woken wanting to look.',
      },
    ],
    bandProse: {
      success: 'They went down like a person who had been here before, because in sleep they had.',
      critical_failure: 'The urge kept them going after they should have turned back, and they were seen.',
    },
  },
];

// ─── Step 1 hand — 5 cards ─────────────────────────────────────────
//
// New in this pass (design doc § 7): the gate has a hand. Cut from four
// spheres never dealt anywhere else in this encounter — order, force, spirit
// (batch-fresh) and mind (one documented reuse, mirroring the brief's own
// recorded-deviation pattern; full derivation `the-drowned-archive-systems.md`
// § 0).

const STEP_1_HAND: readonly StepNudge[] = [
  {
    id: 'archive.open_the_ledger',
    libraryCardId: 'card.favor.signature.order',
    name: 'Open The Ledger',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.ward',
    effectLine: 'Offer the keeper a plain account of what turns up down there. The debt this creates is theirs to spend.',
    // The library's Favor is dealt in its *create* direction, not its *call*
    // direction — it mints a debt rather than spending an existing one, so it
    // correctly authors no `requiresFavor` gate (that field lives on
    // `StepNudge`, never on the library member — systems pass, open question b).
    grants: [
      {
        kind: 'favor_creation',
        debtorAgentId: '$cast:keeper',
        magnitudeRange: [0.15, 0.25],
        context: 'A plain account, offered before it was asked for.',
      },
    ],
    bandProse: {
      success: 'The keeper heard everything they found, and owes for it now.',
      failure: 'The account they gave was thin, and the keeper counted it anyway.',
    },
  },
  {
    id: 'archive.throw_full_weight',
    libraryCardId: 'card.heavy_hand.signature.force',
    name: 'Throw Full Weight',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.11,
    costs: { detectionDelta: 0.12 },
    imageTag: 'generic.energy',
    effectLine: 'Push straight through the water and the dark without care for who notices. It costs nothing but attention.',
    bandProse: {
      critical_success: 'They went at it without care for noise, and the shelf gave up everything at once.',
      failure: 'The push got them nowhere, and every rival power watching this ground saw it happen.',
    },
  },
  {
    id: 'archive.kindle_a_wanting',
    libraryCardId: 'card.kindled_ambition.signature.spirit',
    name: 'Kindle A Wanting',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.warmth',
    effectLine: 'Give them a reason to finish the shelf even after the light fails. Desire carries where nerve runs out.',
    // `ambition_uncover_secrets` confirmed live (ambition-templates.ts:490) —
    // the only ambition template whose premise (uncovering hidden truth)
    // matches this card's fiction without inventing one.
    grants: [
      {
        kind: 'assign_ambition',
        templateId: 'ambition_uncover_secrets',
        priority: 'secondary',
        targetAgentId: '$actor',
        narrativeHook: 'They came up from the vault still turning the charter over, wanting to know what else is buried.',
      },
    ],
    bandProse: {
      success_at_cost: 'They finished the shelf wanting more than the charter alone could give them.',
      near_miss: 'The wanting outlasted the reading, and they stopped one page short.',
    },
  },
  {
    id: 'archive.plant_an_urge',
    libraryCardId: 'card.compulsion.signature.mind',
    name: 'Plant An Urge',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.time-slow',
    effectLine: 'A need to keep reading takes root and does not let go until the shelf is empty.',
    // The batch's one deliberate reuse of a member slot 1 also deals
    // (card.compulsion.signature.mind) — a documented deviation from the
    // batch brief's own over-exposure table, for the reason given in the
    // design doc § 7: that table is the brief's own policy, not a code or
    // spec floor, and the brief already overrides it twice for its own
    // rolled dice.
    grants: [
      {
        kind: 'plant_compulsion',
        targetAgentId: '$actor',
        encounterBias: { explore: 0.4 },
        narrativeHook: 'Since the charter, they cannot stop turning its one sentence over, and want to go back down for the rest.',
      },
    ],
    bandProse: {
      success: 'They read on past the point of sense, and it paid for itself.',
      critical_failure: 'The need to keep reading is what kept them there while the water rose.',
    },
  },
  {
    id: 'archive.read_the_architecture',
    libraryCardId: 'card.whisper.hunger.witness',
    name: 'Read The Architecture',
    essenceCost: 2,
    forecastDelta: 0.08,
    reveals: 'next_step_demand',
    imageTag: 'generic.crowd',
    effectLine: 'Notice how the room itself was built to test the person now standing in it. That shapes what waits below.',
    bandProse: {
      critical_success: 'They saw how the shelves were arranged to slow down a careless reader, and were not careless.',
      near_miss: 'They saw the room\'s shape and still ran out of light one shelf short of the last.',
    },
  },
];

// ─── Step 2 hand — 7 cards ─────────────────────────────────────────

const STEP_2_HAND: readonly StepNudge[] = [
  {
    id: 'archive.offer_the_easier_way',
    libraryCardId: 'card.undertow.signature.darkness',
    name: 'Offer The Easier Way',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.16,
    valueDrift: { axis: 'honesty_cunning', toward: 'negative' },
    imageTag: 'generic.strength',
    effectLine: 'Fill them with the pull toward what is quick and good enough. It works, and it stays with them.',
    // forecastDelta 0.16 >= NUDGE_BIG_DELTA (0.15), so both failure bands
    // carry a fragment.
    bandProse: {
      critical_success: 'The answer came out smooth and complete, and the warden took it.',
      failure: 'The answer that would do was not the one it wanted.',
      critical_failure: 'They said a name they had made up, and the warden knew it as they said it.',
    },
  },
  {
    id: 'archive.risk_everything',
    libraryCardId: 'card.gambit.signature.chaos',
    name: 'Risk Everything',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.03,
    rider: 'all_or_nothing',
    imageTag: 'generic.blade',
    effectLine: 'The middle outcomes fall away. It lands clean or it lands hard.',
    bandProse: {
      critical_success: 'There was no middle left to land in, and it landed high.',
      critical_failure: 'They had no soft landing left, and they used the hard one.',
    },
  },
  {
    id: 'archive.read_the_pattern',
    libraryCardId: 'card.omen.signature.time',
    name: 'Read The Pattern',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.04,
    imageTag: 'generic.rumor',
    effectLine: 'Steady their hand. The season after this leans toward more of the same.',
    grants: [
      {
        kind: 'emit_omen',
        category: 'seasonal',
        intensity: 0.3,
        narrativeHook: 'The rain has opened cellars all over the country, and people have started going down into them.',
        scope: { kind: 'global' },
        sphereAlignment: 'time',
      },
    ],
    bandProse: {
      success: 'It went well for them, and the season after this will bring more of the same.',
      near_miss: 'It leaned their way and then stopped short.',
    },
  },
  {
    id: 'archive.pay_it_elsewhere',
    libraryCardId: 'card.bargain.signature.entropy',
    name: 'Pay It Elsewhere',
    sphere: 'entropy',
    essenceCost: 0,
    forecastDelta: 0.09,
    costs: { doomDelta: 0.05 },
    imageTag: 'generic.decay',
    effectLine: "No essence spent. The world's own ending comes nearer to cover the cost.",
    bandProse: {
      success: "They got through. The debt for it was booked against the world's ending.",
      failure: 'The cost was booked against the world, and the vault gave up no more for it.',
    },
  },
  {
    // One-off, no `libraryCardId` — `side_bet` is a declared library type
    // (nudge-card-library.ts) with zero members; the design doc blesses a
    // one-off here explicitly rather than naming a member that does not
    // exist (the THR-844 rot class).
    id: 'archive.salvage_one_fact',
    name: 'Salvage One Fact',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.blessing',
    effectLine: 'A steady hand now, and a piece of the truth kept win or lose.',
    grants: [
      {
        kind: 'intelligence',
        category: 'cultural_knowledge',
        label: 'A Name Off The Shelf',
        detail: 'One name, read in passing from a record kept in this place, and remembered.',
        reliability: 0.6,
        targetAgentId: '$actor',
      },
    ],
    bandProse: {
      success_at_cost: 'They came out short of the charter and long one true name.',
      failure: 'They lost the argument and kept the name, which is more than they went down with.',
    },
  },
  {
    id: 'archive.light_the_deed',
    libraryCardId: 'card.heavy_hand.hunger.illuminate',
    name: 'Light The Deed',
    essenceCost: 2,
    forecastDelta: 0.12,
    costs: { detectionDelta: 0.15 },
    valueDrift: { axis: 'revelation_discretion', toward: 'positive' },
    imageTag: 'generic.light',
    effectLine: 'Push hard and in the open. The help is unmistakable, and every rival power sees whose hand it was.',
    bandProse: {
      critical_success: 'The help was plain to see and it worked. Rival powers are looking at this ground now.',
      failure: 'It was done in the open and it failed in the open.',
    },
  },
  {
    id: 'archive.draw_on_character',
    libraryCardId: 'card.trait_card.core',
    name: 'Draw On Character',
    requiredTrait: DROWNED_ARCHIVE_TRAIT_REF,
    essenceCost: 0,
    forecastDelta: 0.06,
    imageTag: 'generic.oath',
    effectLine: 'What they already are carries them through. Nothing is spent to make it so.',
    bandProse: {
      success: 'They answered without shading it, and the answer was enough.',
      failure: 'They told it the truth. The truth was not what it was waiting for.',
    },
  },
];

// ─── The steps ───────────────────────────────────────────────────

/**
 * Step 0 — `shadow`, "Go down unheard". `continue_weakened` is the shape: a
 * loud entry does not end the encounter, it hands step 1 a worse starting
 * position, carried by step 1's `carryoverFactorLines`. No authored
 * `factorLines` (variance rule) and no `carryoverFactorLines` (first step has
 * no predecessor). No `successMetadata`/`failureMetadata` — step 0's
 * mechanical consequence IS the carryover.
 */
const step0GoDownUnheard: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.38,
  purposeLine: 'Go down unheard',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The setting-neutral P2+P3 spine. The per-class P1 arrival lands above this
  // at instantiation (compileOpeningEnvelope prepends the `{frag:opening}`
  // token). The keeper and the warden are both introduced here, before any
  // later prose refers to them.
  narrativeTemplate:
    'There {they} find the record vault under water. A page floated up this morning: the founding ' +
    'families never owned this ground. {cast:keeper} went down as far as the water and turned back. A ' +
    'warden sits in the dark below.\n\n' +
    'The water is rising. By dark it will be over the shelves, and the rest of the record is gone.',
  criticalSuccessAfterimage: 'They came down the stair without a sound. The warden never looked up.',
  successAfterimage: 'They got down. The noise carried, and the warden looked up once.',
  successAtCostAfterimage: 'Their lamp and most of their kit went into the water on the way down.',
  failureAfterimage: 'They went in loud, and the warden has been watching them since.',
  criticalFailureAfterimage: 'They went off the last of the stair into black water and came up loud and seen.',
  nudges: STEP_0_HAND,
};

/**
 * Step 1 — `eye`, "Read the shelves". `carryoverFactorLines` is keyed on the
 * band step 0 rolled, so a different roll shows a different line or none.
 */
const step1ReadTheShelves: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Read the shelves',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'Below the water line the shelves are still standing. The warden sits on the ledge above the last ' +
    'of them and has not moved. The charter box is on that last shelf, and the water is at the bottom ' +
    'of it.',
  carryoverFactorLines: {
    critical_success: {
      text: 'The dark below has not heard them, so they can work slowly.',
      polarity: 'for',
      forecastDelta: 0.06,
    },
    success: {
      text: 'The warden looked up once and went back to waiting.',
      polarity: 'for',
      forecastDelta: 0.02,
    },
    success_at_cost: {
      text: 'They came down with no lamp and are reading by hand.',
      polarity: 'against',
      forecastDelta: -0.04,
    },
    near_miss: {
      text: 'The noise they made on the stair has not settled yet.',
      polarity: 'against',
      forecastDelta: -0.02,
    },
    failure: {
      text: 'They were heard on the stair and are watched now.',
      polarity: 'against',
      forecastDelta: -0.05,
    },
    critical_failure: {
      text: 'They came down hard into the water and are soaked through.',
      polarity: 'against',
      forecastDelta: -0.07,
    },
  },
  criticalSuccessAfterimage: 'They read the whole charter through, and know every name on it.',
  successAfterimage: 'They found the charter and read enough to know the loose page was torn from it.',
  successAtCostAfterimage: 'They got the charter up out of the box and left the rest of the shelf under water.',
  failureAfterimage: 'The ink had gone. They came away with a wet box and no names.',
  criticalFailureAfterimage: 'They could not get the lid up, and the box went back down where they found it.',
  nudges: STEP_1_HAND,
};

/**
 * Step 2 — `veil`, "Answer the warden". `fail_action` here (not
 * `continue_weakened`) — this is the last step, and every write lands in the
 * aftermath rather than in step metadata.
 */
const step2AnswerTheWarden: ActionStep = {
  reach: 'veil',
  duration: { min: 1, max: 2 },
  difficulty: 0.44,
  purposeLine: 'Answer the warden',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The warden stands between the stair and the water now. It has harmed no one and it has let nothing ' +
    'out. It wants the name of whoever the records were left with, spoken as the record spells it. It ' +
    'will hear one answer.',
  carryoverFactorLines: {
    critical_success: {
      text: 'They read every name on the charter and can use one.',
      polarity: 'for',
      forecastDelta: 0.07,
    },
    success: {
      text: 'The torn page gave them a name to say.',
      polarity: 'for',
      forecastDelta: 0.04,
    },
    success_at_cost: {
      text: 'They have the charter and not the rest of the shelf.',
      polarity: 'against',
      forecastDelta: -0.02,
    },
    near_miss: {
      text: 'They read the box lid and little else.',
      polarity: 'against',
      forecastDelta: -0.03,
    },
    failure: {
      text: 'The ink was gone before they read a single name.',
      polarity: 'against',
      forecastDelta: -0.06,
    },
    critical_failure: {
      text: 'The box is in the water and they have no name.',
      polarity: 'against',
      forecastDelta: -0.08,
    },
  },
  criticalSuccessAfterimage: 'They gave the warden a name it accepted, and walked out with the charter dry.',
  successAfterimage: 'They answered it, and it let the charter go. The box stayed.',
  successAtCostAfterimage: 'They got the charter out. The warden set a mark on them for taking it.',
  failureAfterimage: 'The warden would not have the answer, and the box went back on the shelf.',
  criticalFailureAfterimage: 'The shelf went over into the water, and they came up the stair with the charter still down there.',
  nudges: STEP_2_HAND,
};

// ─── Aftermath ───────────────────────────────────────────────────
//
// Choice-less encounter (no fork, no `decidedBy`), so the five bands hang off
// `fallback.byOutcome`. `changes: []` at the variant level, so no chip
// renders on a face that performs no write (Law 56). One reaction per band,
// each carrying a real write — the only structure under which every chip is
// unconditionally backed.

export const THE_DROWNED_ARCHIVE_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope({
  id: 'encounter.delve.the_drowned_archive',
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Drowned Archive',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local', // ActionScale has no `settlement` member — see design doc § 17 finding 4

  steps: [step0GoDownUnheard, step1ReadTheShelves, step2AnswerTheWarden],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * `honesty_cunning` (Shadow's own pair — the warden asks for a true name)
   * is carried by the Undertow's `valueDrift` (step 2) against the trait
   * card's opposite pull. `revelation_discretion` (Eye's own pair — bring it
   * into the open or keep it under) is carried by the Veil's `valueDrift`
   * (step 0) and the Heavy Hand's (step 2, hunger variant). No fork — this is
   * a test the scene tilts, never decides.
   */
  motivations: ['revelation_discretion', 'honesty_cunning'],

  /**
   * Setting envelope (THR-884). Three declared classes, one opening each;
   * `locationSubtypes` is derived via `expandSettings`, never hand-written. A
   * three-class envelope inherits no family default support bundle
   * (THR-1044), so this template declares its own — class-honest at all
   * three classes (design doc § 5): only `shrine` and `temple` carry rosters
   * among the eight expanded subtypes, and every `reuseNpcRoles` entry is
   * drawn from what `sacred` actually seeds.
   */
  settings: ['ruin', 'arcane', 'sacred'],
  // P1 arrival, one per class — the P2/P3 spine lands below it
  // (step0's narrativeTemplate). The weather is load-bearing: the rain is why
  // the vault is filling and the filling is the clock.
  openings: {
    ruin: '{name} gets out of the rain at the ruins of {location}.',
    arcane: '{name} waits out the storm at the tower of {location}.',
    sacred: '{name} takes shelter from the rain at the sanctuary of {location}.',
  },
  locationSubtypes: expandSettings(['ruin', 'arcane', 'sacred']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'Bring the rest of the records up before the water takes them. {cast:keeper} cannot ask anyone ' +
      'with a claim on this ground to go down.',
    success:
      '{name} brought the charter up out of the water. What it says about this ground is out with it.',
    failure:
      '{name} came up without the charter. The water is still rising, and the shelves are where they were.',
  },

  /**
   * consequenceDraw is binding — `check:encounter` recomputes it from the
   * template id. `consequenceSwap` records the one recorded deviation: both
   * slots of the batch drew `movement`, and slot 1 is its honest home (its
   * failure bands are being driven back out of the ground), so this
   * encounter swaps to `knowledge`, which is what the scene was already
   * about.
   */
  consequenceDraw: ['relationship', 'knowledge'],
  consequenceSwap: {
    from: 'movement',
    to: 'knowledge',
    reason:
      "both slots of this batch drew movement, and slot 1 is its honest home — its failure bands are " +
      "being driven back out of the ground. This encounter's prize is the record itself, so knowledge " +
      'is what the scene was already about.',
  },

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The water keeps rising, and the shelves it has not reached yet are the last of the record.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview:
            '{actor} came up with the charter dry and {cast:keeper} read it at the vault door. The founding ' +
            "families of {location} held this ground on another house's grant, and the charter names where " +
            'that grant was filed. The water is over the low shelves now and nobody minds.',
          changes: [
            {
              id: 'archive.crit.charter_known',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Whole Charter',
              causeClause: 'It came up dry and was read at the door',
              detail:
                '{actor} carries an intelligence record on {location} now: the founding families held this ' +
                "ground on another house's grant.",
              // Package-critic fix (A1): entityId '$actor', no visualKind. The
              // write behind this chip (`intelligence`) only ever has an
              // agent end — see the comment on the reaction's `intelligence`
              // effect below — so the tile has to open the agent's own sheet,
              // not the settlement's.
              stateNoun: { text: 'a record gained', entityId: '$actor' },
              concepts: [{ text: 'intelligence record' }],
            },
            {
              id: 'archive.crit.keeper_trusts',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Keeper Trusts Them',
              causeClause: 'A stranger with no claim brought the record up',
              detail: '{cast:keeper} thinks well of {actor} now and will say so to anyone who asks.',
              // The encounter's one `individual`-anchored chip (brief ceiling: 1).
              stateNoun: { text: 'a bond warmed', entityId: '$cast:keeper', visualKind: 'agent' },
              concepts: [{ text: 'bond' }],
            },
          ],
          reactions: [
            {
              id: 'archive.read_it_at_the_door',
              label: 'Read it aloud at the door',
              intent: 'The charter is read out where the families can hear it.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'political_secret',
                  label: 'The Charter Under The Water',
                  detail:
                    'The founding families of this settlement held their ground on a grant from another ' +
                    'house, and the grant names where it was filed.',
                  reliability: 0.95,
                  targetAgentId: '$actor',
                  // Deliberately omits `targetEntityId` — it is not in
                  // SCENE_SENTINEL_FIELDS (encounterAftermath.ts), so a
                  // literal there would ship as the literal string and never
                  // bind. Every `intelligence` effect in this template omits
                  // it for the same reason (design doc § 12, finding 3).
                },
                {
                  // $nearest_ruin resolves through findAnyRuinId — a
                  // uniformly-random ruin anywhere in the world, not the
                  // nearest one (package critic § Fix list #4).
                  kind: 'spawn_clue',
                  source: 'encounter_outcome',
                  precision: 'narrowed',
                  targetRuinId: '$nearest_ruin',
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:keeper',
                  sentimentDelta: 0.22,
                  trustDelta: 0.15,
                },
              ],
            },
          ],
        },
        success: {
          overview:
            '{actor} brought the charter up wet and readable. {cast:keeper} has it and the families have ' +
            'heard. There is a watcher at the vault door now.',
          changes: [
            {
              id: 'archive.success.watched',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Vault Is Watched',
              causeClause: 'The page is public and the rest of the records are not',
              detail: '{target} is under watch now. Quiet work here is seen, and everyone with a claim knows how to get down there.',
              stateNoun: { text: 'a place under watch', entityId: '$target', visualKind: 'location' },
              concepts: [
                { text: 'under watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' },
              ],
            },
            {
              id: 'archive.success.charter_known',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Charter Read',
              causeClause: 'It came up wet and still legible',
              detail:
                '{actor} carries an intelligence record on {location}: the founding families were granted ' +
                'this ground by another house.',
              stateNoun: { text: 'a record gained', entityId: '$actor' },
              concepts: [{ text: 'intelligence record' }],
            },
          ],
          reactions: [
            {
              id: 'archive.leave_it_with_the_keeper',
              label: "Leave it in the keeper's hands",
              intent: 'The charter stays with the office that kept it, and the vault door gets a watcher.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'political_secret',
                  label: 'The Charter Under The Water',
                  detail: 'The founding families of this settlement were granted their ground by another house.',
                  reliability: 0.8,
                  targetAgentId: '$actor',
                },
                {
                  kind: 'condition_attachment',
                  templateId: 'trait.condition.location.under_watch',
                  targetLocationId: '$target',
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:keeper',
                  sentimentDelta: 0.1,
                  trustDelta: 0.06,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            '{actor} got the charter out and the warden set a price on it. The mark it left has not faded, ' +
            'and {cast:keeper} will not say what it means.',
          changes: [
            {
              id: 'archive.cost.marked',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Marked By The Warden',
              causeClause: 'They carried a record past the warden that kept it',
              detail: '{actor} is cursed. The mark sits where the warden set it and does not fade on its own.',
              stateNoun: { text: 'Cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' },
              concepts: [{ text: 'cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' }],
            },
            {
              id: 'archive.cost.charter_known',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Charter Bought',
              causeClause: "It came out, and the warden took its price for it",
              detail:
                "{actor} carries an intelligence record on {location}, bought at the warden's price: the " +
                'founding families held this ground on a grant.',
              stateNoun: { text: 'a record gained', entityId: '$actor' },
              concepts: [{ text: 'intelligence record' }],
            },
          ],
          reactions: [
            {
              id: 'archive.take_the_mark',
              label: 'Take the mark and say nothing',
              intent: 'Nobody lifts what the warden set. The charter is out, and that is the trade.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'political_secret',
                  label: 'The Charter Under The Water',
                  detail: 'The founding families of this settlement held their ground on a grant from another house.',
                  reliability: 0.75,
                  targetAgentId: '$actor',
                },
                {
                  kind: 'condition_attachment',
                  templateId: 'trait.condition.cursed',
                  targetAgentId: '$actor',
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            '{actor} came up without the charter. The warden would not have the answer and put the box back on ' +
            'the shelf. {cast:keeper} sat with them afterwards and asked what they had read. One name is all ' +
            'they had, and they gave it. The water drops in the dry season, and the shelf will still be there.',
          changes: [
            {
              id: 'archive.fail.shaken',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Left Shaken',
              causeClause: 'The warden refused them at arm\'s length',
              detail: '{actor} is terrified. It will pass in a couple of days.',
              stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
            },
            {
              id: 'archive.fail.kept_name',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'One Name Kept',
              causeClause: 'They read one line before the warden turned them out',
              detail: '{actor} carries an unreliable intelligence record on {location}: one name from the charter, and no proof of it.',
              stateNoun: { text: 'a record gained', entityId: '$actor' },
              concepts: [{ text: 'intelligence record' }],
            },
          ],
          reactions: [
            {
              id: 'archive.sit_and_hear_it',
              label: 'Sit down and hear what they read',
              intent: 'The keeper sits with them and hears what they got off the shelf.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'cultural_knowledge',
                  label: 'One Name From The Charter',
                  detail: 'A single name read off a settlement charter, with no document left to prove it by.',
                  reliability: 0.4,
                  targetAgentId: '$actor',
                },
                {
                  kind: 'condition_attachment',
                  templateId: 'trait.condition.terrified',
                  targetAgentId: '$actor',
                },
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:keeper',
                  sentimentDelta: 0.12,
                  trustDelta: 0.05,
                },
                {
                  kind: 'encounter_seed',
                  encounterFamily: 'encounter.delve',
                  targetAgentId: '$actor',
                  delayTicks: 36,
                  priority: 1.05,
                  inheritContext: true,
                  seedLabel: 'The water will drop in the dry season, and the rest of the shelf is still on it.',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'The shelf went into the water with the box on it. {actor} got out. {cast:keeper} has lost the ' +
            'whole record of {location} and is grieving it. One line of the charter is still in {actor}\'s ' +
            'head.',
          changes: [
            {
              id: 'archive.crit_fail.keeper_grieves',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Keeper Grieves',
              causeClause: 'The shelf went into the water with the records on it',
              detail: '{cast:keeper} is grieving. The records of {location} are gone and the loss was watched.',
              stateNoun: { text: 'Grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' },
              concepts: [{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }],
            },
            {
              id: 'archive.crit_fail.one_line',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'One Line Remembered',
              causeClause: 'They read a line off the charter before the shelf tipped',
              detail: '{actor} carries an unreliable intelligence record on {location}: one line of a charter nobody can produce now.',
              stateNoun: { text: 'a record gained', entityId: '$actor' },
              concepts: [{ text: 'intelligence record' }],
            },
          ],
          reactions: [
            {
              id: 'archive.tell_it_plainly',
              label: 'Tell the keeper plainly',
              intent: 'Nothing is softened. The records are gone, and the keeper hears it straight.',
              effects: [
                {
                  kind: 'intelligence',
                  category: 'cultural_knowledge',
                  label: 'One Line Of A Lost Charter',
                  detail: 'A remembered line from a settlement charter that no longer exists in any copy.',
                  reliability: 0.3,
                  targetAgentId: '$actor',
                },
                {
                  kind: 'condition_attachment',
                  templateId: 'trait.condition.grieving',
                  targetAgentId: '$cast:keeper',
                },
              ],
            },
          ],
        },
      },
    },
  },

  description:
    'A three-step delve: the record vault is flooding, a page has surfaced saying the ' +
    'founding families never owned the ground, and the thing that has been keeping the rest will ' +
    'only give it up for a true answer, spoken the way the record spells it.',
});
