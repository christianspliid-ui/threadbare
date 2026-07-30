/**
 * The Darkhollow Vault — the nudge-model golden exemplar. THR-774 (WS1).
 *
 * **This is a fixture, not content.** It is deliberately absent from
 * `UNIFIED_ACTION_TEMPLATES` and from every pool: no mortal will ever draw it.
 * Its job is to be the one worked example the authoring skills point at — every
 * rule in the 8-step checklist is visible here, in a shape a person can copy.
 * `nudgeModel.test.ts` asserts the checklist against it, so a rule that drifts
 * out of the skill and a rule that drifts out of the exemplar both break a test.
 *
 * Authoring skills: `.claude/skills/encounter-pipeline`,
 * `.claude/skills/template-encounter-rewrite`.
 * Plan: `Docs/plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md` § WS1.
 *
 * ─── Step 1 of the checklist: the vignette record ────────────────────
 * The three vignette declarations have no schema field yet (the manifest that
 * will hold the scene tag is WS4). They are recorded here because the checklist
 * requires them to be *decided*, not because the engine reads them:
 *
 *   Motive hooks   — which sources may route an agent here: `mission` (a guild
 *                    or faction sends them for the reliquary) and `choice` (a
 *                    thief who heard about the vault). Not `chance`: nobody
 *                    wanders three floors under Darkhollow by accident.
 *   Quintessence   — heavy. Two steps, both above `fair`, a lethal trap on the
 *   stakes           second. A critical failure here is the erosion class the
 *                    broken-state gate was scaled against.
 *   Scene tag      — `vault.underground.sealed` (WS4 vocabulary; until the
 *                    manifest exists the fallback chain ends at EntityVisual).
 */

import type {
  ActionStep,
  StepNudge,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';

/**
 * The one live trait this encounter hooks. A ref, resolved ANY-of across node
 * id / short id / display name / tag (THR-786), so the full node id is the
 * form least likely to rot. `trait.core.core_integrity.virtue` is the "True"
 * pole of the Core integrity continuum (`src/data/core-trait-content.ts`) — a
 * seeded definition, so `validateTraitRefs()` does not report it dead. The
 * checklist forbids hooking anything the sweep flags (THR-800 tracks the 62
 * refs that currently fail it).
 */
export const EXEMPLAR_TRAIT_REF = 'trait.core.core_integrity.virtue';

// ─── Step 0 hand: reading the lock ───────────────────────────────────
//
// Six cards. Four distinct spheres (light, mind, time, entropy) plus two
// sphere-less options, one of them the trait-only card. Every card carries at
// least one failure-band fragment; between them the hand covers all six
// StepOutcomes, so no band ever reads as if the god had not been there.

const STEP_0_HAND: readonly StepNudge[] = [
  {
    // Shared generic pool — the `focus` family. Reads correctly in any encounter
    // where a mortal's own nerve is the variable, which is the genericity bar.
    id: 'darkhollow.vault.steady_the_hands',
    name: 'Steady the hands',
    // THR-890 — a universal-core library id, so the card prints its keyword.
    // Core members are held by every god regardless of sphere, so tagging one
    // adds the chip without changing which cards this hand deals (a
    // sphere-signature id would engage THR-887's repertoire gate and withhold
    // the card from any god not aligned to that sphere).
    libraryCardId: 'card.boost.core',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    fiction:
      'The tremor in their fingers goes out of them. The sixth pin gets the same touch as the first.',
    effectLine: 'A small, reliable push toward reading it right.',
    bandProse: {
      success: 'The sixth pin turned under a hand that did not shake.',
      near_miss: 'Steady hands got five pins clean. The sixth was already cracked.',
    },
  },
  {
    id: 'darkhollow.vault.wake_the_sealed_lamp',
    name: 'Wake the sealed lamp',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.light',
    fiction:
      "The lamp's wick catches a second time, brighter, and the mason's cut marks stand out of the iron in hard shadow.",
    effectLine: 'Better light on the marks. A real help.',
    bandProse: {
      critical_success:
        'In the doubled light the whole row read at once, and the door came open on the first pass.',
      failure: 'The light was good. The marks it showed belonged to a different door.',
    },
  },
  {
    id: 'darkhollow.vault.recall_the_masons_hand',
    name: "Recall the mason's hand",
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.12,
    imageTag: 'darkhollow.mason-mark',
    fiction:
      "A dead mason's habit surfaces in them: this one always cut his marks left to right, and started low.",
    effectLine: 'Strong help. They work the pins in the cut order.',
    bandProse: {
      success_at_cost:
        "The mason's order was right. Getting to it cost them the skin of two knuckles.",
      failure: "They had the mason's order right. The rust had moved two pins out of it.",
    },
  },
  {
    // forecastDelta 0.16 is at or above NUDGE_BIG_DELTA, so this card owes
    // fragments for BOTH failure and critical_failure: a nudge that moved the
    // odds this far and still lost has to read differently at each depth.
    id: 'darkhollow.vault.slow_the_tumblers',
    name: 'Slow the tumblers',
    sphere: 'time',
    essenceCost: 3,
    forecastDelta: 0.16,
    imageTag: 'generic.time-slow',
    fiction:
      'Inside the door, six pins fall at a quarter speed. Each one gives its own small click, spaced out to be counted.',
    effectLine: 'A large help. Every pin announces itself.',
    bandProse: {
      failure:
        'They counted every click. The seventh pin, the one the mason never cut a mark for, made no sound at all.',
      critical_failure:
        'Slowed, the pins fell in order, and the counterweight fell with them, unhurried, down onto the stair.',
    },
  },
  {
    id: 'darkhollow.vault.rust_the_last_pin',
    name: 'Rust the last pin',
    sphere: 'entropy',
    essenceCost: 2,
    forecastDelta: 0.11,
    imageTag: 'darkhollow.rusted-pin',
    fiction:
      'Two hundred years of damp arrive in one pin at once. It crumbles under a thumb instead of turning.',
    effectLine: 'Good help on the pin that fights hardest.',
    bandProse: {
      critical_failure:
        'The pin gave. So did the two seated either side of it, and the row came apart in their hand.',
    },
  },
  {
    // Trait-only card: cost 0, because the price was paid by being this person.
    // Hidden (never dimmed) for an agent without the trait — a card they can
    // never unlock is noise, not a goal. Reachable by two routes: holding the
    // trait directly, or the template's traitVariant naming it in addNudgeIds.
    id: 'darkhollow.vault.the_true_hand',
    name: 'Read it honestly',
    // THR-890 — `trait_card` is the universal-core type for exactly this shape:
    // gated on who the mortal is, priced at nothing.
    libraryCardId: 'card.trait_card.core',
    requiredTrait: EXEMPLAR_TRAIT_REF,
    essenceCost: 0,
    forecastDelta: 0.08,
    imageTag: 'generic.oath',
    fiction:
      'They stop looking for the trick. The lock was built by a man who wanted it opened by the right person.',
    effectLine: 'A steady help, and it costs no essence.',
    bandProse: {
      near_miss:
        'They read it honestly, and it opened honestly, on the one pin that had rotted through.',
    },
  },
];

// ─── Step 1 hand: taking it unseen ───────────────────────────────────
//
// Six cards, five distinct spheres plus one sphere-less common option. This is
// the final step, so its band prose is the peak-eligible surface.

const STEP_1_HAND: readonly StepNudge[] = [
  {
    // Shared generic pool — the `luck` family.
    id: 'darkhollow.vault.a_moments_luck',
    name: "A moment's luck",
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.luck',
    fiction:
      'The warden stops on the second floor to work a stone out of his boot. It takes him a while.',
    effectLine: 'A small push. The night runs slightly late.',
    bandProse: {
      success: 'The warden sat down to his boot, and the stair was empty when they climbed it.',
      near_miss: 'The warden was late. He was not late enough to miss the open door.',
    },
  },
  {
    id: 'darkhollow.vault.thicken_the_dark',
    name: 'Thicken the dark',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.12,
    imageTag: 'generic.dark',
    fiction:
      "The lamplight stops at their wrists. The rest of the room goes to a black that the warden's own lamp will not cut.",
    effectLine: 'Strong cover. Very little of them is visible.',
    bandProse: {
      critical_success:
        'They crossed the room in a dark that held, took the reliquary, and were never seen at all.',
      failure: "The dark hid them well. It hid the plinth's second step from them just as well.",
    },
  },
  {
    id: 'darkhollow.vault.hold_the_slab',
    name: 'Hold the slab',
    sphere: 'force',
    essenceCost: 3,
    forecastDelta: 0.14,
    imageTag: 'darkhollow.counterweight',
    fiction:
      'The counterweight slab hangs where it is. It does not fall while their hands are off the plinth.',
    effectLine: 'A large help against the trap on the plinth.',
    bandProse: {
      success_at_cost:
        'The slab held long enough. It came down on the doorway they had meant to leave by.',
      failure: 'The slab held. The floor under it, two centuries wet, did not.',
    },
  },
  {
    // THR-890 — the hand's detection-cost card. The band prose already said
    // running is loud on wet stone and the warden had been a soldier; the cost
    // channel makes the card charge for it instead of only regretting it
    // afterwards. Paid through the region detection API (THR-885), never a
    // second path to the same place.
    id: 'darkhollow.vault.quicken_the_step',
    name: 'Quicken the step',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.1,
    costs: { detectionDelta: 0.1 },
    imageTag: 'generic.strength',
    fiction:
      'Their legs find the speed of a much younger runner for the length of one room and one stair.',
    effectLine: 'Good help. They are out faster than the round.',
    bandProse: {
      critical_failure:
        'They ran. Running is loud on wet stone, and the warden had been a soldier.',
    },
  },
  {
    // The encounter's ONE rider, and the justification the checklist demands.
    // `no_crit_fail` is priced at 4 (the hand's ceiling) and given the smallest
    // useful delta on purpose: it buys survival, not success. That trade is the
    // whole reason the card exists — a god who spends here has chosen to keep
    // the mortal over getting the reliquary, and the fragment says so. Riders
    // stay rare because a rider on every card turns the ladder into a floor.
    id: 'darkhollow.vault.keep_the_thread_taut',
    name: 'Keep the thread taut',
    // THR-890 — `no_crit_fail` *is* Mercy ("critical failure becomes ordinary
    // failure"), and Mercy is universal core, so the keyword names the trade the
    // comment above spells out.
    libraryCardId: 'card.mercy.core',
    sphere: 'spirit',
    essenceCost: 4,
    forecastDelta: 0.09,
    rider: 'no_crit_fail',
    imageTag: 'generic.blessing',
    fiction:
      "The god's thread pulls tight enough to feel. They will walk out of this room on their own feet.",
    effectLine: 'A modest push, and no disaster tonight.',
    bandProse: {
      failure: 'The thread held them up. It did not put the reliquary in their hands.',
    },
  },
  {
    // Second big-delta card (0.17 ≥ NUDGE_BIG_DELTA): both failure bands owed.
    //
    // THR-890 — the hand's doom-cost card. Entropy signs the Bargain, and this
    // is the bargain's shape: the largest help on the step, bought partly off
    // the clock rather than out of the pool. Paid through the doom API.
    id: 'darkhollow.vault.unmake_the_seal',
    name: 'Unmake the seal',
    sphere: 'entropy',
    essenceCost: 3,
    forecastDelta: 0.17,
    costs: { doomDelta: 0.05 },
    imageTag: 'darkhollow.seal',
    fiction:
      "The wax and lead around the reliquary's base give up their grip and run, and the case lifts free.",
    effectLine: 'A large help lifting it off the plinth.',
    bandProse: {
      failure:
        'The seal let go. The plinth, relieved of its weight, let go of the floor plate under it.',
      critical_failure:
        'Lead ran off the plinth and onto their boots, and they were still scraping at it when the lamp came down the stair.',
    },
  },
];

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — Eye. Purpose line: "Read the lock". Difficulty 0.45 → `steep`.
 *
 * Test-panel factor lines (checklist step 2 — two to four, each concrete, each
 * naming its source *in the sentence*). THR-820 gave them a schema field, so
 * they sit on the step where the panel reads them; before that they lived as
 * fixture-local constants no render path could reach.
 */
const step0ReadTheLock: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.45,
  purposeLine: 'Read the lock',
  factorLines: [
    { text: 'The mason cut his mark beside the third pin.', polarity: 'for' },
    { text: 'Two centuries of rust have swollen every pin.', polarity: 'against' },
    {
      text: "Darkhollow's own records name the vault, and never its key.",
      polarity: 'against',
    },
  ],
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'Three floors down, the lamp finds the door. Six iron pins in a row, each one seated in a ' +
    'socket the mason cut by hand. The order matters. Get it wrong and the counterweight drops ' +
    'the ceiling into the stair. They set their palm flat on the cold iron and start reading.',
  successAfterimage: 'The sixth pin turned, and the door gave without a sound.',
  failureAfterimage: "The fourth pin held, and the mason's order stayed a secret.",
  successAtCostAfterimage: 'The door opened on a pin that cracked going over.',
  criticalSuccessAfterimage: 'Six pins in six moves. The door swung before the lamp guttered.',
  criticalFailureAfterimage:
    'The third pin sheared, and above the stair the counterweight began to move.',
  nudges: STEP_0_HAND,
};

/**
 * Step 1 — Shadow. Purpose line: "Leave no trace". Difficulty 0.6 → `severe`.
 *
 * The final step, so this is the peak-eligible surface: the band prose here and
 * the fate-reveal line may reach where step 0's may not. It still holds the
 * plainness rule for anything label-class.
 */
const step1TakeItUnseen: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.6,
  purposeLine: 'Leave no trace',
  factorLines: [
    // The one line that cuts for them, and the reason the critical-success
    // afterimage can say they swept the floor behind them.
    { text: 'The vault is one room, and one room is quickly swept.', polarity: 'for' },
    { text: 'The vault floor is dust, and dust keeps every print.', polarity: 'against' },
    {
      text: "Darkhollow's night warden walks the third floor twice.",
      polarity: 'against',
    },
    {
      text: 'The reliquary on the plinth is heavier than it looks.',
      polarity: 'against',
    },
  ],
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The vault is one room and a plinth. Dust lies on the floor undisturbed since the sealing, ' +
    'and it takes a print the moment a boot touches it. On the plinth, the reliquary. Above it, ' +
    'a warden who walks the third floor twice a night.',
  successAfterimage: 'They left with the reliquary, and the dust kept their secret.',
  failureAfterimage: 'The reliquary stayed on its plinth, and the dust kept a boot print.',
  successAtCostAfterimage: 'They got the reliquary out. The warden got a look at the stair.',
  criticalSuccessAfterimage: 'They took it, swept the floor behind them, and reset the door.',
  criticalFailureAfterimage:
    "The warden's lamp found them on the stair with the reliquary in hand.",
  nudges: STEP_1_HAND,
};

// ─── Test-panel authored data (checklist step 2) ─────────────────────
//
// THR-820: purpose lines and factor lines now live on `ActionStep.purposeLine`
// and `ActionStep.factorLines` (see the two step definitions above), which is
// the path `buildNudgePhaseModel` reads. They were previously exported here as
// `EXEMPLAR_REACH_PURPOSE_LINES` / `EXEMPLAR_FACTOR_LINES` — fixture-local
// constants that only the test file consumed, so the exemplar looked compliant
// while no render path could reach either field. Do not reintroduce them:
// authored panel data belongs on the step.

// ─── The template ────────────────────────────────────────────────────

/**
 * The exemplar, authored end-to-end against the WS1 checklist.
 *
 * Registered nowhere. Imported by `nudgeModel.test.ts` and read by authoring
 * sessions; if it ever appears in a pool, that is the bug.
 */
export const NUDGE_GOLDEN_EXEMPLAR: UnifiedActionTemplate = {
  id: 'fixture.encounter.darkhollow_vault',
  rarityTier: 2,
  intrinsicTier: 'story_beat',
  name: 'The Darkhollow Vault',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',

  steps: [step0ReadTheLock, step1TakeItUnseen],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * The axes this encounter tilts. A vault theft is a Shadow scene — the mortal
   * either reads the lock as its builder meant it read, or forces it — and it
   * asks whether the reliquary is worth the stair coming down on them.
   */
  motivations: ['honesty_cunning', 'sacrifice_survival'],

  /**
   * Checklist step 5 — the trait hook. One variant, carrying all four of the
   * things a variant can carry: a named forecast modifier, a difficulty ease, a
   * player-facing factor line that names the trait, and a trait-only card
   * unlocked into step 0's hand.
   */
  traitVariants: [
    {
      traitId: EXEMPLAR_TRAIT_REF,
      forecastDelta: 0.05,
      difficultyDelta: -0.03,
      factorLine: 'Being True, they read the lock rather than force it.',
      addNudgeIds: ['darkhollow.vault.the_true_hand'],
    },
  ],

  narrativeTemplates: {
    initiation:
      'A sealed vault sits three floors under Darkhollow, behind a lock a mason built to be ' +
      'read rather than broken. Someone has come down for what is on the plinth.',
    success:
      'The lock read true and the dust kept its secret. The reliquary left Darkhollow in the ' +
      'dark, and the door was closed behind it.',
    failure:
      'The pins held, or the floor gave. The reliquary is still on its plinth, and Darkhollow ' +
      'knows someone came down for it.',
  },

  description:
    'A two-step vault theft: read a mason-built lock, then cross a dusty room under a walking ' +
    'warden. The nudge-model golden exemplar.',
};
