/**
 * The Broken Seal — a two-step `star` -> `stone` delve with carryover: the
 * seal over the stair down is broken, the keepers will stop anyone who goes
 * near it, and another treasure hunter is already below.
 *
 * Batch: deep-places (THR-1223 follow-on), slot 1. Encounter Factory v3,
 * nudge-native, THR-1045 Composition Contract.
 *
 * ── Prose Doctrine v2 ──
 * Narrator mode throughout; no branching (`decidedBy`/`authoredChoices`) —
 * this is a test, not a fork (design doc § 1, row 6).
 *
 * Design doc: `Docs/plans/encounters/the-broken-seal-final.md`
 * Editorial pass: `Docs/plans/encounters/the-broken-seal-editorial.md`
 * Systems audit: `Docs/plans/encounters/the-broken-seal-systems.md`
 * Package critique: `Docs/plans/encounters/the-broken-seal-package.md`
 *
 * Package-critic corrections applied at Pass 4 (both from
 * `the-broken-seal-package.md` § Fix list):
 *  1. `seal.crit_fail.the_wanting`'s `stateNoun` drops `visualKind: 'agent'` —
 *     the sentence is about the ambition (a lawful `named` anchor), not the
 *     person, and the packet's own §13 table already claimed only one
 *     `individual`-anchored chip (`seal.fail.driven_out`). `entityId: '$actor'`
 *     stays — it is the carrier route the anchor catalog names for an
 *     ambition.
 *  2. Both `assign_ambition` effects (critical_success, critical_failure) carry
 *     a code comment recording that `assignAmbitionToActor` refuses on
 *     `no_free_slot` (measured ~21% of actors in a mature world, no eviction)
 *     — a corpus-wide, engine-side limitation, not a defect in this template.
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

const rivalSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'rival',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['pilgrim', 'hermit', 'oracle'],
  supportRole: 'rival_delver',
  spawnNpcRole: 'wanderer',
  spawnName: 'Idren Kall',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [rivalSpec];

// ─── The trait hook ──────────────────────────────────────────────

/**
 * `trait.core.core_hope.virtue` — the "Hopeful" pole of Core hope. Built by
 * `CORE_TRAIT_DEFINITIONS` from `coreRegistry.ts`; a seeded definition, so
 * `validateTraitRefs()` does not report it dead. This is the continuum's
 * fourth shipped encounter user (`vertical-slice.ts`, `company-drama.ts`,
 * `the-garrisons-price.ts` carry the other three), picked for fit — the
 * step's action is going on into the dark after the light stops, an outlook
 * question hope governs.
 */
const BROKEN_SEAL_TRAIT_REF = 'trait.core.core_hope.virtue';

const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: BROKEN_SEAL_TRAIT_REF,
    forecastDelta: 0.04,
    difficultyDelta: -0.02,
    factorLine: 'Being Hopeful, they do not turn back in the dark.',
    addNudgeIds: ['seal.draw_on_character'],
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
    id: 'seal.buy_the_floor',
    libraryCardId: 'card.insurance.core',
    name: 'Buy The Floor',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'floor_at_cost',
    imageTag: 'generic.ward',
    effectLine:
      'They come through it, however badly it goes. What that costs is taken out of their kit and their hide.',
    fiction: 'Every plan should survive being wrong.',
    bandProse: {
      success_at_cost: 'They reached the bottom. The descent collected what it was owed on the way.',
      critical_failure: 'The floor was bought and paid for. The stone under it was not.',
    },
  },
  {
    id: 'seal.show_the_obvious',
    libraryCardId: 'card.whisper.signature.light',
    name: 'Show The Obvious',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.1,
    reveals: 'next_step_demand',
    imageTag: 'generic.light',
    effectLine: 'They see what the next test will demand of them before they start it.',
    fiction: 'Nothing was hidden. It was only unlit.',
    bandProse: {
      critical_success: 'They saw the size of the climb ahead and picked the descent that would let them make it.',
      failure: 'They knew exactly what was coming and still could not find a line down to meet it.',
    },
  },
  {
    id: 'seal.pay_it_elsewhere',
    libraryCardId: 'card.bargain.signature.entropy',
    name: 'Pay It Elsewhere',
    sphere: 'entropy',
    essenceCost: 0,
    forecastDelta: 0.12,
    costs: { doomDelta: 0.05 },
    imageTag: 'generic.decay',
    effectLine: "The help lands now. The world's clock runs faster for it.",
    fiction: 'Nothing is free. Some prices are only slower.',
    bandProse: {
      success: "The descent came easy. The price for it landed on the world's clock instead.",
      failure: 'The debt was taken on. The dark did not ease for it.',
    },
  },
  {
    id: 'seal.plant_an_urge',
    libraryCardId: 'card.compulsion.signature.mind',
    name: 'Plant An Urge',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.memory',
    effectLine: 'Their own mind starts pushing them forward, and it will not let go.',
    fiction: 'By morning it feels like their own idea.',
    bandProse: {
      success: 'The pushing came from inside them, and it carried them past the place they would have stopped.',
      critical_failure: 'Their own mind would not let them stop, and they were still going when the stone gave.',
    },
  },
  {
    id: 'seal.call_them_onward',
    libraryCardId: 'card.omen.hunger.wander',
    name: 'Call Them Onward',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.rumor',
    effectLine: 'Steer what comes after toward the same ground they found here.',
    fiction: 'Every road is asking to be followed.',
    grants: [
      {
        kind: 'emit_omen',
        category: 'cultural',
        intensity: 0.35,
        narrativeHook: 'A seal that was shut on purpose is open, and the country has started saying so.',
        scope: { kind: 'global' },
        sphereAlignment: 'time',
      },
    ],
    bandProse: {
      success: 'They got down, and word of an open seal will travel further than they will.',
      near_miss: 'The omen went out ahead of them. It did not carry them to the bottom.',
    },
  },
  {
    id: 'seal.ease_the_suffering',
    libraryCardId: 'card.balm.signature.life',
    name: 'Ease The Suffering',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.warmth',
    effectLine: 'Take their fear off them, and keep it off for as long as this lasts.',
    fiction: 'Most suffering ends. This one ends sooner.',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.terrified' }],
    bandProse: {
      success: 'They went down unafraid, and unafraid was enough.',
      near_miss: 'They were not afraid at any point of it. The stone still did not hold.',
    },
  },
  {
    id: 'seal.draw_on_character',
    libraryCardId: 'card.trait_card.core',
    name: 'Draw On Character',
    requiredTrait: BROKEN_SEAL_TRAIT_REF,
    essenceCost: 0,
    forecastDelta: 0.08,
    imageTag: 'generic.oath',
    effectLine: 'Being who they are, they keep going after others would stop.',
    fiction: 'Character is the one resource nobody spends.',
    bandProse: {
      success: 'They went on after the light gave out, because they had never believed it ended there.',
      failure: 'Belief carried them past the last of the light, and the dark did not care.',
    },
  },
];

// ─── Step 1 hand — 6 cards ───────────────────────────────────────

const STEP_1_HAND: readonly StepNudge[] = [
  {
    id: 'seal.press_the_odds',
    libraryCardId: 'card.boost.core',
    name: 'Press The Odds',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Hold them together past the point they should give out.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success: 'The last of it came from a reserve they had not counted on having.',
      failure: 'There was one more lift in them. The stair asked for more than that.',
    },
  },
  {
    id: 'seal.widen_the_swing',
    libraryCardId: 'card.gambit.attunement.chaos',
    name: 'Widen The Swing',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.03,
    rider: 'all_or_nothing',
    imageTag: 'generic.luck',
    effectLine: 'The middling results fall away. It ends clean or it ends badly.',
    fiction: 'Practice does not make chaos safer. It makes it larger.',
    bandProse: {
      critical_success: 'No half-measure survived. What was left was one clean carry, top to bottom.',
      critical_failure: 'The middle had been taken out of it, and only the bad end was left.',
    },
  },
  {
    id: 'seal.hide_the_deed',
    libraryCardId: 'card.veil.signature.darkness',
    name: 'Hide The Deed',
    sphere: 'darkness',
    essenceCost: 3,
    forecastDelta: 0.08,
    costs: { detectionDelta: -0.1 },
    imageTag: 'generic.dark',
    effectLine: 'The help lands unseen. No rival god notices the hand behind it.',
    fiction: 'The kindest help leaves no fingerprints.',
    bandProse: {
      success: 'Nobody up there could say who had helped, only that it went easier than it should have.',
      near_miss: 'The hand behind it was never seen. It was also never enough.',
    },
  },
  {
    id: 'seal.set_aside_for_them',
    libraryCardId: 'card.cache.hunger.gather',
    name: 'Set Aside For Them',
    essenceCost: 2,
    forecastDelta: 0.07,
    imageTag: 'generic.matter',
    effectLine: 'Reveal what an earlier party left behind: a bone ward, free to take and keep.',
    fiction: 'Someone always put something by.',
    grants: [
      {
        kind: 'attachment_grant',
        templateId: 'reward_relics_talismans_bone_ward',
        targetAgentId: '$actor',
      },
    ],
    bandProse: {
      success_at_cost: 'The ward came up with them. Most of what they went down with did not.',
      failure: "They came up with a dead stranger's charm and none of what they went for.",
    },
  },
  {
    id: 'seal.throw_full_weight',
    libraryCardId: 'card.heavy_hand.signature.force',
    name: 'Throw Full Weight',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.16,
    costs: { detectionDelta: 0.15 },
    imageTag: 'generic.strength',
    effectLine: 'Push hard and openly. Rival gods will see whose hand did it.',
    fiction: 'Subtlety is a choice. This is not it.',
    bandProse: {
      critical_success: 'The load went light in their hands and stayed light to the top.',
      failure: 'The weight came off it and the stone underneath still would not hold them.',
      critical_failure:
        'It went so plainly that they stopped to look at their own hands, and the stair gave while they stood there.',
    },
  },
  {
    id: 'seal.kindle_a_wanting',
    libraryCardId: 'card.kindled_ambition.signature.spirit',
    name: 'Kindle A Wanting',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.06,
    imageTag: 'generic.blessing',
    effectLine: 'Set an old desire alight again. They will not put down what they came for.',
    fiction: 'A life turns on what it reaches for.',
    grants: [
      {
        // Wiring fix (Pass 4): the design doc named `ambition_chase_the_wonder`,
        // which the systems audit's line citation (ambition-templates.ts:1289)
        // in fact places inside `EVENT_MINTED_AMBITION_TEMPLATES`, not
        // `AMBITION_TEMPLATES` — `nudgeGrantLiveness.ts` validates `assign_ambition`
        // grants only against `AMBITION_TEMPLATES`, so the doc's id fails the
        // liveness gate. `ambition_arcane_enlightenment` is a live
        // `AMBITION_TEMPLATES` member (line 289), distinct from the aftermath's
        // own `ambition_uncover_secrets` per the doc's own no-collision rule,
        // and its selection prose ("The old texts whispered of a threshold. He
        // meant to cross it.") is the same shape of old desire rekindled. Prose
        // above is unchanged; only this id moved.
        kind: 'assign_ambition',
        templateId: 'ambition_arcane_enlightenment',
        targetAgentId: '$actor',
        narrativeHook: 'They had seen the edge of it once and could not leave it in the ground.',
      },
    ],
    bandProse: {
      success: 'They had wanted easier work that morning. By the top of the stair they wanted this more.',
      failure: 'The old wanting was awake and had nowhere to go but back down the stair.',
    },
  },
];

// ─── The steps ───────────────────────────────────────────────────

/**
 * Step 0 — `star`, "Find the stair down". `continue_weakened` is the shape: a
 * bad descent does not end the encounter, it hands step 1 a worse starting
 * position, carried by `carryoverFactorLines` on step 1. No authored
 * `factorLines` (variance rule) and no `carryoverFactorLines` (first step has
 * no predecessor). No `successMetadata`/`failureMetadata` — step 0's
 * mechanical consequence IS the carryover.
 */
const step0FindTheStairDown: ActionStep = {
  reach: 'star',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  purposeLine: 'Find the stair down',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The setting-neutral P2+P3 spine. The per-class P1 arrival lands above this
  // at instantiation (compileOpeningEnvelope prepends the `{frag:opening}`
  // token). The rival is introduced here, before any later prose refers to
  // them.
  narrativeTemplate:
    'There {they} find the keepers packing to leave. The seal on the stair down has been broken open. ' +
    'Two of them went below yesterday and one came back.\n\n' +
    'The keepers will stop anyone who goes near the stair. It was shut before any of them were born, ' +
    'and that is reason enough. Another treasure hunter, {cast:rival}, went down an hour ago.',
  criticalSuccessAfterimage: 'They found a clean line down and reached the bottom with light to spare.',
  successAfterimage: 'They got down. It was slow, and the last of it was a hard drop.',
  successAtCostAfterimage: 'They reached the bottom, and left a coil of rope and half a lamp of oil behind them.',
  failureAfterimage: 'They lost the line in the dark and came down hard on the broken stone.',
  criticalFailureAfterimage: 'The stone gave under them and put them at the bottom in the dark, badly hurt.',
  nudges: STEP_0_HAND,
};

/**
 * Step 1 — `stone`, "Carry it back up". `carryoverFactorLines` is the one
 * authored factor surface that survives the variance rule — keyed on the band
 * step 0 rolled, so a different roll shows a different line or none.
 */
const step1CarryItBackUp: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.44,
  purposeLine: 'Carry it back up',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'Below the broken stair the ceiling comes down to a crawl. The keeper who did not come back is in ' +
    'the crawl. At the end of it there is a sealed coffer, heavy enough to need both arms. Getting it ' +
    'up is the hard part. The keepers are still at the top, and the light is nearly gone.',
  carryoverFactorLines: {
    critical_success: {
      text: 'They know the short line back up and still have light.',
      polarity: 'for',
      forecastDelta: 0.06,
    },
    success: {
      text: 'They found the route down and can retrace it.',
      polarity: 'for',
      forecastDelta: 0.03,
    },
    success_at_cost: {
      text: 'The rope they left below is not coming back up.',
      polarity: 'against',
      forecastDelta: -0.03,
    },
    near_miss: {
      text: 'The lamp burned most of its oil on the descent.',
      polarity: 'against',
      forecastDelta: -0.04,
    },
    failure: {
      text: 'They came down blind and do not know the route back.',
      polarity: 'against',
      forecastDelta: -0.06,
    },
    critical_failure: {
      text: 'They are hurt, and the route up is the one that gave.',
      polarity: 'against',
      forecastDelta: -0.08,
    },
  },
  /**
   * `successMetadata` fires on `isStepSuccess`, which counts `near_miss` as a
   * success — so the prize rides every success-side band unconditionally,
   * backed by a write rather than gated behind a reaction pick.
   */
  successMetadata: {
    effects: [
      {
        kind: 'attachment_grant',
        templateId: 'reward_tomes_scrolls_veilscript_fragment',
        targetAgentId: '$actor',
      },
    ],
  },
  /**
   * `failureMetadata` fires only on the two genuine failure bands, which is
   * where the `movement` consequence family lands: driven up and out, and put
   * on the road away from the place.
   *
   * Effect-ordering note: `agent_relocation` is idempotent under a repeat
   * write (`setRelocationIntent` replaces); `condition_attachment` is not
   * (unconditional `has_trait` add). No other step writes `exhausted`, so
   * nothing here can double.
   */
  failureMetadata: {
    effects: [
      {
        kind: 'condition_attachment',
        templateId: 'trait.condition.exhausted',
        targetAgentId: '$actor',
      },
      {
        kind: 'agent_relocation',
        targetAgentId: '$actor',
        destination: { kind: 'away', minHexDistance: 3 },
        mode: 'travel',
      },
    ],
  },
  criticalSuccessAfterimage: 'They came up the stair with the coffer under one arm and walked past the keepers.',
  successAfterimage: 'They got it to the top. Their arms were shaking by the last turn.',
  successAtCostAfterimage: 'They brought it up, and their pack and their rope are still at the bottom.',
  failureAfterimage: 'The keepers held the head of the stair, and they came away empty.',
  criticalFailureAfterimage: "They were hauled out of the dark by the ankles and dropped at the keepers' feet.",
  nudges: STEP_1_HAND,
};

// ─── Aftermath ───────────────────────────────────────────────────
//
// Choice-less encounter (no fork, no `decidedBy`), so the five bands hang off
// `fallback.byOutcome`. `changes: []` at the variant level, so no chip
// renders on a face that performs no write (Law 56). One reaction per band,
// each carrying a real write — the only structure under which every chip is
// unconditionally backed, since `AftermathOutcomeOverride.changes` and
// `.reactions` are independent optional siblings.

export const THE_BROKEN_SEAL_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope({
  id: 'encounter.delve.the_broken_seal',
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Broken Seal',
  reach: 'star',
  crudType: 'read',
  scale: 'local',

  steps: [step0FindTheStairDown, step1CarryItBackUp],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * `sacrifice_survival` (Star's own pair — what the coffer is worth risking)
   * and `courage_prudence` (go down at all) are the axes the scene tilts
   * without forking; this encounter has no branch, so neither is a fork
   * decision.
   */
  motivations: ['sacrifice_survival', 'courage_prudence'],

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
  // (step0's narrativeTemplate).
  openings: {
    sacred: '{name} stops at the sanctuary of {location} in the afternoon.',
    arcane: '{name} arrives at the tower of {location} late in the day.',
    ruin: '{name} reaches the ruins of {location} with half a day of light left.',
  },
  locationSubtypes: expandSettings(['ruin', 'arcane', 'sacred']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'Carry the coffer up and it is theirs. The other hunter is below and looking for it too. ' +
      'The keepers want the stair shut, whoever comes up it.',
    success:
      '{name} carried the coffer up out of the dark. The keepers watched them go and did not stop them.',
    failure:
      '{name} did not bring the coffer up. It is still below, and the keepers still hold the stair.',
  },

  /**
   * consequenceDraw is binding — `check:encounter` recomputes it from the
   * template id and independently reproduced the same hand at Pass 3
   * (`npm run draw:consequences -- encounter.delve.the_broken_seal --reach
   * star --rarity 2`). `drive` is wired by the two `assign_ambition` band
   * reactions below (critical_success, critical_failure); `movement` is
   * wired by step 1's `failureMetadata.agent_relocation`. No
   * `consequenceSwap` — both drawn families wire in context without one.
   */
  consequenceDraw: ['drive', 'movement'],

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The seal is broken either way. What came up the stair is the rest of it.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview:
            'The coffer is up and still sealed. {actor} has it, and the keepers did not take it off them. ' +
            'What comes out of it is the reason {actor} will not leave buried ground alone again. ' +
            '{cast:rival} is still below, and still looking.',
          changes: [
            {
              id: 'seal.crit.prize',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Veilscript Fragment',
              causeClause: 'Carried up clean, before the light went',
              detail:
                "A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move " +
                'when they look away.',
              stateNoun: {
                text: 'a fragment gained',
                entityId: 'reward_tomes_scrolls_veilscript_fragment',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Veilscript Fragment',
                  entityId: 'reward_tomes_scrolls_veilscript_fragment',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'seal.crit.testament',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Silent Testament',
              causeClause: 'The lid came off at the top of the stair',
              detail:
                "The Silent Testament was under the seal. It is {actor}'s to carry, and it is not going to be " +
                'given back.',
              stateNoun: {
                text: 'a testament gained',
                entityId: 'reward_tomes_scrolls_the_silent_testament',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'The Silent Testament',
                  entityId: 'reward_tomes_scrolls_the_silent_testament',
                  visualKind: 'attachment',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'seal.let_them_open_it',
              label: 'Let them open it here',
              intent: 'The lid comes off at the top of the stair, in front of everyone who wanted it shut.',
              effects: [
                {
                  kind: 'attachment_grant',
                  templateId: 'reward_tomes_scrolls_the_silent_testament',
                  targetAgentId: '$actor',
                },
                {
                  // `assignAmbitionToActor` refuses on `no_free_slot` when the
                  // actor already holds MAX_ACTIVE_AMBITIONS (2) active
                  // `pursues` edges, with no eviction — measured ~21% of
                  // actors in a mature world (the-broken-seal-package.md §
                  // A3). This is a corpus-wide, engine-side limitation, not a
                  // defect in this template: the chip that carries this claim
                  // is deliberately unchipped on this band (the overview says
                  // it, and its chip lives on critical_failure instead).
                  kind: 'assign_ambition',
                  templateId: 'ambition_uncover_secrets',
                  targetAgentId: '$actor',
                  narrativeHook: 'A seal put down on purpose, and now they know what it was holding.',
                },
              ],
            },
          ],
        },
        success: {
          overview:
            'The keepers argued about it at the head of the stair and then let the coffer pass. {cast:rival} ' +
            'came up empty an hour later and will tell everyone what is down there. The stair will not be ' +
            'quiet for long.',
          changes: [
            {
              id: 'seal.success.prize',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Veilscript Fragment',
              causeClause: 'It came up the stair on the last of the light',
              detail:
                "A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move " +
                'when they look away.',
              stateNoun: {
                text: 'a fragment gained',
                entityId: 'reward_tomes_scrolls_veilscript_fragment',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Veilscript Fragment',
                  entityId: 'reward_tomes_scrolls_veilscript_fragment',
                  visualKind: 'attachment',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'seal.let_the_stair_stand_open',
              label: 'Let the stair stand open',
              intent: 'Nobody shuts it behind them. Whatever else is down there is down there for the taking.',
              effects: [
                {
                  kind: 'encounter_seed',
                  encounterFamily: 'encounter.delve',
                  targetAgentId: '$actor',
                  delayTicks: 24,
                  priority: 1.1,
                  inheritContext: true,
                  seedLabel: 'The coffer was not the only thing under that seal, and the stair is still open.',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            '{actor} came up under the weight of the coffer with their hands and shins torn open. ' +
            'The keepers watched from the head of the stair and did not help.',
          changes: [
            {
              id: 'seal.cost.prize',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'Veilscript Fragment',
              causeClause: 'It came up, and the stair took its fee off the carrier',
              detail:
                "A Veilscript Fragment came up in the coffer and is in {actor}'s hands now. The letters move " +
                'when they look away.',
              stateNoun: {
                text: 'a fragment gained',
                entityId: 'reward_tomes_scrolls_veilscript_fragment',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'Veilscript Fragment',
                  entityId: 'reward_tomes_scrolls_veilscript_fragment',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'seal.cost.wounded',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Torn Hands',
              causeClause: 'They hauled it up broken stone with bare hands',
              detail: '{actor} is wounded. Lifting and gripping will hurt until it heals.',
              stateNoun: { text: 'Wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
              concepts: [{ text: 'wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' }],
            },
          ],
          reactions: [
            {
              id: 'seal.let_them_carry_the_hurt',
              label: 'Let them carry the hurt out with it',
              intent: 'No one binds the hands. The coffer goes on the road with them as they are.',
              effects: [
                {
                  kind: 'condition_attachment',
                  templateId: 'trait.condition.wounded',
                  targetAgentId: '$actor',
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            '{actor} came up empty and is on the road away from here now. {cast:rival} is still down there, ' +
            'and nobody is going to stop them coming up with it.',
          changes: [
            {
              id: 'seal.fail.worn_out',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Spent On The Stair',
              causeClause: 'A climb up broken stone with no rest at the top',
              detail: '{actor} is exhausted, and will be slow on the road until they have rested.',
              stateNoun: { text: 'Exhausted', entityId: 'trait.condition.exhausted', visualKind: 'attachment' },
              concepts: [{ text: 'exhausted', entityId: 'trait.condition.exhausted', visualKind: 'attachment' }],
            },
            {
              id: 'seal.fail.driven_out',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'mixed',
              title: 'Put On The Road',
              causeClause: 'The keepers had the head of the stair and would not let them back on it',
              detail: '{actor} is travelling away from {location} now, and will not stop until they are well clear of it.',
              stateNoun: { text: 'a journey set', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'travelling away' }],
            },
          ],
          reactions: [
            {
              id: 'seal.let_the_failure_sit',
              label: 'Let the failure sit with them',
              intent: 'No one softens it for them. They walk out of here carrying it.',
              effects: [
                {
                  kind: 'quintessence_shift',
                  delta: -0.04,
                  targetAgentId: '$actor',
                  source: 'the_broken_seal',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            '{cast:rival} came out beside {actor}, and neither of them got the lid off the coffer. Nobody is ' +
            'going down that stair again this season.',
          changes: [
            {
              id: 'seal.crit_fail.shut',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Stair Is Shut',
              causeClause: 'The keepers brought the head of the stair down behind them',
              detail: '{target} is closed. The descent is broken in, and no one is getting down it until somebody digs.',
              stateNoun: { text: 'a place closed', entityId: '$target', visualKind: 'location' },
              concepts: [
                { text: 'closed', entityId: 'trait.condition.location.pass_closed', visualKind: 'attachment' },
              ],
            },
            {
              // Package critic correction (the-broken-seal-package.md § A2 /
              // Fix list #1): `visualKind: 'agent'` is dropped from this
              // stateNoun. The sentence is about the ambition — a lawful
              // `named` anchor — not about the person, and this is the
              // encounter's only `individual`-anchored chip
              // (`seal.fail.driven_out` is the other). `entityId: '$actor'`
              // stays — it is the carrier route the anchor catalog names for
              // an ambition (seen on the pursuing actor's sheet).
              id: 'seal.crit_fail.the_wanting',
              kind: 'growth',
              category: 'boon',
              direction: 'gain',
              // Wiring fix (Pass 4): the design doc paired `polarity: 'mixed'`
              // with `direction: 'gain'`, which is exactly the disagreement
              // THR-1205's corpus test (consequenceSignalCorpus.test.ts)
              // exists to catch — `mixed` is rejected outright whenever a
              // direction is declared, because a consequence that both costs
              // and grants is two chips, not one with a foot on each side.
              // The write here is unambiguously a gain (a new ambition), so
              // polarity now agrees with direction; the bittersweet framing
              // stays in the prose (causeClause, detail), where it belongs.
              polarity: 'gain',
              title: 'They Have To Know',
              causeClause: 'They were dragged out before the lid came off',
              detail: '{actor} is pursuing Uncover Ancient Secrets now, and the coffer they never opened is the reason.',
              stateNoun: { text: 'a new ambition', entityId: '$actor' },
              concepts: [{ text: 'Uncover Ancient Secrets' }],
            },
          ],
          reactions: [
            {
              id: 'seal.let_them_shut_it',
              label: 'Let them shut it',
              intent: 'The keepers get their stair back. What was under the seal stays under it.',
              effects: [
                {
                  kind: 'condition_attachment',
                  templateId: 'trait.condition.location.pass_closed',
                  targetLocationId: '$target',
                },
                {
                  // See the critical_success reaction's comment: this write
                  // conditionally no-ops on a full ambition slot. Corpus-wide
                  // engine limitation (the-broken-seal-package.md § A3), not a
                  // defect here.
                  kind: 'assign_ambition',
                  templateId: 'ambition_uncover_secrets',
                  targetAgentId: '$actor',
                  narrativeHook: 'They were dragged out before the lid came off, and it has not left them since.',
                },
              ],
            },
          ],
        },
      },
    },
  },

  description:
    'A two-step delve: the seal over the stair is broken, the keepers who kept it are leaving and ' +
    'will stop anyone who goes near it, and another treasure hunter is already below.',
});
