/**
 * The Sign Over the Ruin — a two-step `veil` → `eye` Puzzle–Investigation–
 * Resolution: a remnant hanging over a broken stone that will not be read,
 * two readings already hardened into factions, and a true report that has
 * to land in a room that has already voted.
 *
 * Batch: border-perils (THR-1221), row 2. Encounter Factory v3, nudge-native,
 * THR-1045 Composition Contract.
 *
 * Design doc: `Docs/plans/encounters/the-sign-over-the-ruin-final.md`
 * Systems audit: `Docs/plans/encounters/the-sign-over-the-ruin-systems.md`
 * Package critique: `Docs/plans/encounters/the-sign-over-the-ruin-package.md` —
 * verdict PACKAGE FIX. The three-item fix list in its own § "Fix list" is
 * applied below.
 *
 * ── Prose Doctrine v2 (THR-1223 batch 2) ──
 * Rewritten 2026-08-25 in narrator mode under the batch-1 calibration rulings:
 * rewrite from scratch in basic game-master language ("clever specificity" is
 * the residue tell of the old mode), and a card's effect line never repeats a
 * word from the card's name. Zero mechanical changes — same steps, effects,
 * seeds, bands, hands.
 * Stake shape (Seed Dice, die 1): Mystery + Threat, compounded on purpose.
 *
 * Narrator's checklist (12 questions), answered:
 *  1. P1 arrival with {name} and {location}, one per setting class — yes.
 *  2. P2 states the sign's arrival and the standing cost (a camp split in
 *     two, a day of argument) — yes.
 *  3. P3 lands Mystery (a sign nobody can read) + Threat (two sides close to
 *     blows) — yes.
 *  4. Opening ≤80 words composed with any P1 (66–69) — yes.
 *  5. Every sentence a narrator's report; no interior sensation, no camera —
 *     yes.
 *  6. Facts stated, never encoded — "nobody can read it" is said outright —
 *     yes.
 *  7. Every sentence serves challenge (the sign) / test (veil, then eye) /
 *     outcome (the reading and what the camp does with it) — yes.
 *  8. Nothing referenced before introduction; {cast:witness} enters in the
 *     spine — yes.
 *  9. One named person on stage: {cast:witness} — yes.
 * 10. Stake in one sentence: read the sign truly and land the reading in a
 *     camp that has already voted — yes.
 * 11. Cards named imperative verb+noun; effect lines are game effects; no
 *     name-word repetition — yes.
 * 12. All four declared classes have a skeleton opening — yes.
 *
 * **Fix list applied, summary:**
 * 1. The mercy reaction `sign.take_the_fear_off_them` now declares
 *    `removeAll: true`. Reason: `condition_attachment` (`encounterAftermath.ts`)
 *    adds a `has_trait` edge unconditionally, with no already-holds check and
 *    an edge id keyed on the tick, so step 0's and step 1's `failureMetadata`
 *    firing on the same run (the plain `failure` band — the commonest bad
 *    ending) leaves the agent Terrified **twice**, on two edges. Without
 *    `removeAll`, `remove_condition` removes only the oldest edge
 *    (`encounterAftermath.ts`, a `reduce` on `appliedAt`), so the reaction's
 *    promised "let them put it down" silently lifted only half of it.
 * 2. The double application itself is accepted, not eliminated: it is the
 *    only shape the two-bucket `successMetadata`/`failureMetadata` schema
 *    admits that still backs the `critical_failure` band's chips on the path
 *    where step 0 alone rolls `critical_failure` and step 1 never runs (the
 *    Pass-3 repair — see step 0's `failureMetadata` below). `removeAll: true`
 *    is the compensating change, not a fix for the double itself. Closing the
 *    double at its source would need a step-outcome-severity `EffectPredicate`
 *    the effect schema does not have (no member reads a step outcome's
 *    severity, only its success/failure split) — logged BACKLOG in the
 *    systems audit, not attempted here.
 *
 * `agent_relocation` is idempotent under a repeat write (`setRelocationIntent`
 * replaces); `condition_attachment` is not (unconditional `has_trait` add, no
 * dedupe in `effects/effectWalker.ts`'s per-edge walk) — so only the Terrified
 * condition doubles on the compound path, never the relocation intent.
 */

import type { ActionStep, StepNudge, TraitVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterSupportActorSpec, EncounterSupportBundle } from '../../types/encounter';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Support Bundle ──────────────────────────────────────────────

/**
 * `witness` — the pilgrim who has stood at the sign since first light and
 * says nothing. Class-honest at all four declared classes: only `wilderness`
 * (a `wayside` subtype) seeds NPCs from `LOCATION_ROLE_ROSTERS`, so reuse
 * fires there (`pilgrim`/`wanderer`/`hermit`) and the other three classes
 * spawn. `must-persist` — the body is targeted by name in the
 * `critical_failure` overview and by key in the "Steady the one who stayed"
 * reaction.
 */
const witnessSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'witness',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['pilgrim', 'wanderer', 'hermit'],
  supportRole: 'first_witness',
  spawnNpcRole: 'pilgrim',
  spawnName: 'Neven Arbeck',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [witnessSpec];

// ─── The trait hook ──────────────────────────────────────────────

/**
 * `trait.core.core_humility.virtue` — the "Humble" pole of Core humility.
 * Built from the canonical Core registry (`coreRegistry.ts` ->
 * `core-trait-content.ts`), a seeded definition, so `validateTraitRefs()`
 * does not report it dead. Humility is what decides whether a true report
 * *lands* in a room that has already voted — step 1's actual test — rather
 * than whether the report is accurate, which step 0 already tests and prices
 * into its difficulty. No new continuum was minted: the live 5-entry core
 * registry already carries the best-fitting trait.
 */
const SIGN_TRAIT_REF = 'trait.core.core_humility.virtue';

const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: SIGN_TRAIT_REF,
    forecastDelta: 0.03,
    difficultyDelta: -0.02,
    factorLine: 'Being Humble, they offer the reading instead of ruling on it.',
    addNudgeIds: ['sign.a_reading_offered'],
  },
];

// ─── Step 0 hand — `veil`, "Read the sign" (5 cards) ──────────────────
//
// Budget: whisper, omen, veil, boost (x2, the <=2 cap) — the batch's
// card-type budget for this row, including the batch-required veil debut.
// 4 distinct types, 4 distinct spheres (light, time, darkness, energy), 1
// ungated common option (A1), 0 riders. Sum forecastDelta 0.35, inside
// NUDGE_HAND_MAX_TOTAL_DELTA (0.70). No card reaches NUDGE_BIG_DELTA (0.15).
//
// Two-member types (whisper, veil) split deliberately: the deeper-gated
// member sits in whichever hand can afford to lose it. Hand A deals the
// darkness attunement (20 lifetime essence) and the light signature
// (starting); hand B deals the darkness signature (starting) and the light
// attunement (60 lifetime essence, the library's highest bar) — see step 1's
// hand comment for why that split, not the reverse, is what keeps both
// hands' dealt floor at four.

const STEP_0_HAND: readonly StepNudge[] = [
  {
    id: 'sign.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'Steady the Eye',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Keep their attention on the stone and off the argument behind them.',
    bandProse: {
      success: 'Held to the task, they read the whole sign and not just the loudest part of it.',
      near_miss: 'They kept looking after everyone else stopped. The reading still slipped away.',
    },
  },
  {
    id: 'sign.plain_sight',
    libraryCardId: 'card.whisper.signature.light',
    name: 'Cast Light',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.08,
    reveals: 'next_step_demand',
    imageTag: 'generic.light',
    effectLine: 'Put a glow under the sign so its edges show, and show them what the next test will ask.',
    bandProse: {
      critical_success: 'Lit from below, the sign read clear from edge to edge.',
      failure: 'The glow landed on the stone and showed every crack in it. The sign above it stayed dark.',
    },
  },
  {
    id: 'sign.this_has_happened',
    libraryCardId: 'card.omen.signature.time',
    name: 'Stir Memory',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.time-slow',
    effectLine:
      'Give them the sense they have stood under this before, so the strangeness stops fighting their eyes. Word of the sign will travel.',
    grants: [
      {
        kind: 'emit_omen',
        category: 'cultural',
        intensity: 0.35,
        scope: { kind: 'global' },
        sphereAlignment: 'time',
        narrativeHook:
          'A sign came down over the border ground and was read out loud, and the country has begun repeating both readings.',
      },
    ],
    bandProse: {
      success_at_cost: 'It steadied their eyes. It also took an hour they cannot account for.',
      near_miss: 'It all felt familiar. It was not.',
    },
  },
  {
    // The type's content debut — `veil` is one of the eight library types
    // with zero authored users corpus-wide. Both members deal in this
    // encounter, one per hand.
    id: 'sign.nothing_to_find',
    libraryCardId: 'card.veil.attunement.darkness',
    name: 'Hide the Hand',
    sphere: 'darkness',
    essenceCost: 3,
    forecastDelta: 0.06,
    costs: { detectionDelta: -0.2 },
    imageTag: 'generic.dark',
    effectLine: 'Work the dark in close — the reading comes easier, and no rival god finds a trace of the work.',
    bandProse: {
      success: 'The reading came easier than it should have, and left no trace for any rival to find.',
      critical_failure: 'No rival will ever trace what was done here. There is little left to trace it to.',
    },
  },
  {
    id: 'sign.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'Kindle Blood',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.energy',
    effectLine: "Put a body's reserve behind them — they keep looking long past where a person stops.",
    bandProse: {
      critical_success: 'They outlasted it. The sign gave up first and showed its whole edge.',
      failure: 'They looked long past their limit. The sign stayed as blurred as when they started.',
    },
  },
];

// ─── Step 1 hand — `eye`, "Say what is there" (6 cards) ────────────────
//
// Budget as above plus mercy and trait_card — 6 distinct types. 4 distinct
// spheres, 1 ungated common option (B1), 1 rider (B1's `no_crit_fail` — the
// hand's one rider, justified at B1). Sum forecastDelta 0.39. No card
// reaches NUDGE_BIG_DELTA.

const STEP_1_HAND: readonly StepNudge[] = [
  {
    // The hand's ONE rider. Justification: this scene's disaster band is the
    // one where a true reading gets its speaker named as the cause. Mercy is
    // the only card that answers "how far down can this go", and a second
    // rider would answer that same question twice.
    id: 'sign.not_the_worst',
    libraryCardId: 'card.mercy.core',
    name: 'Soften the Fall',
    essenceCost: 1,
    forecastDelta: 0.02,
    rider: 'no_crit_fail',
    imageTag: 'generic.mercy',
    effectLine: 'Take the bottom out of the disaster — it can still go badly, but not all the way down.',
    bandProse: {
      near_miss: 'They stopped one sentence short of the dangerous one.',
      failure: 'It went badly, and it went no further.',
    },
  },
  {
    // No `reveals` on this card, deliberately: this is the final step, and a
    // card printing a reveal it cannot deliver would be a promise the
    // surface breaks.
    id: 'sign.the_whole_shape',
    libraryCardId: 'card.whisper.attunement.light',
    name: 'Read the Crowd',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.crowd',
    effectLine: 'Show them which faces are settled and which are still open, before a word is said.',
    bandProse: {
      critical_success: 'They spoke to the three faces still open, and the rest of the camp followed those three.',
      failure: 'They read the crowd right and said it anyway. Being right changed nothing.',
    },
  },
  {
    // The step-0 instance carries the emit_omen grant. This one does not —
    // emitting the same cultural omen twice in one encounter would double a
    // world change the fiction only made once.
    id: 'sign.this_has_happened_again',
    libraryCardId: 'card.omen.signature.time',
    name: 'Stir Memory',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.time-slow',
    effectLine: 'Give the camp the sense it has heard this before — a new answer lands as an old one.',
    bandProse: {
      success: 'It landed as if it had been agreed long ago.',
      near_miss: 'The camp half-remembered agreeing, and stopped there.',
    },
  },
  {
    id: 'sign.no_one_saw',
    libraryCardId: 'card.veil.signature.darkness',
    name: 'Veil the Words',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.05,
    costs: { detectionDelta: -0.12 },
    imageTag: 'generic.dark',
    effectLine: "Draw the dark in close while they speak — nobody finds a god's hand in what is said.",
    bandProse: {
      success_at_cost: 'Nobody found a god in what was said. They found the person who said it.',
      critical_failure: 'There was no godly mark on it. The camp did not need one to pick a culprit.',
    },
  },
  {
    id: 'sign.a_sudden_surge_again',
    libraryCardId: 'card.boost.signature.energy',
    name: 'Kindle Blood',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.energy',
    effectLine: "Put a body's reserve behind the voice — it carries over the shouting instead of folding under it.",
    bandProse: {
      success: 'The voice carried over both sides and held long enough.',
      critical_failure: 'The voice carried — far enough that the whole camp heard the part that damned them.',
    },
  },
  {
    // Cost 0 because the price was paid by being this person. Hidden — never
    // dimmed — for an agent who does not hold the trait; unlocked into the
    // hand by the template's traitVariant via addNudgeIds.
    id: 'sign.a_reading_offered',
    libraryCardId: 'card.trait_card.core',
    name: 'Offer the Reading',
    requiredTrait: SIGN_TRAIT_REF,
    essenceCost: 0,
    forecastDelta: 0.08,
    imageTag: 'generic.oath',
    effectLine:
      'No essence. Being Humble, they give it as one answer among several, and a crowd that expected a verdict hears them out.',
    bandProse: {
      critical_success: 'They gave it as one answer, and the camp took it up and argued it fairly.',
      failure: 'They gave it as one answer among several. The camp was past taking answers.',
    },
  },
];

// ─── Step 0 ─────────────────────────────────────────────────────

/**
 * Step 0 — `veil`, "Read the sign". Difficulty 0.40 -> `fair`, inside the
 * open-draw ceiling (NUDGE_OFF_REACH_MAX_DIFFICULTY, 0.45). No authored
 * factorLines (THR-892) — the remnant not moving like light, the bad glare,
 * everyone already having an opinion, are true on every run and are priced
 * into the difficulty and carried by the prose.
 *
 * `failBehavior: 'continue_weakened'` — a bad reading is still a reading,
 * and step 1 has to carry it. Except for `critical_failure`, which the
 * engine always treats as an immediate `fail_action` regardless of this
 * setting (`advanceStep`) — which is exactly why this step also carries its
 * own `failureMetadata` below.
 */
const step0ReadTheSign: ActionStep = {
  reach: 'veil',
  duration: { min: 1, max: 2 },
  difficulty: 0.40,
  purposeLine: 'Read the sign',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The setting-neutral P2+P3 spine (Doctrine v2). The per-class P1 arrival
  // lands above this at instantiation. The pilgrim is introduced here — by
  // cast token — before any later prose refers to them.
  narrativeTemplate:
    'Something crossed the sky here and left a sign hanging over the broken stone. Nobody can read it. Half ' +
    'the camp calls it a blessing, half a warning, and the argument has run all day.\n\n' +
    'A pilgrim, {cast:witness}, has watched the stone since first light and says nothing. Both sides demand ' +
    'an answer, and they are close to blows.',
  criticalSuccessAfterimage:
    'They read the whole sign. It is not meant for this ground, and they now know where it points.',
  successAfterimage:
    'They read it steadily and came down with an answer they can stand behind. The sign is not meant for ' +
    'this ground.',
  successAtCostAfterimage: 'They got the reading. The glare cost them an hour of blurred sight.',
  failureAfterimage: 'The glare beat them. They came down with no reading they trust.',
  criticalFailureAfterimage: 'They came down certain of a shape that is not up there.',
  /**
   * `successMetadata` fires on `isStepSuccess`, which counts `near_miss` as a
   * success. The reward-pool draw and the clue both ride every success-side
   * roll of this step.
   */
  successMetadata: {
    rewardPool: { categoryWeights: { possession: 1.0 } },
    effects: [
      // `knowledge` family, wired but deliberately unchipped (Law 56
      // clause 0b, failure shape 1): `$nearest_ruin` resolves through
      // `findAnyRuinId`, a uniformly-random pick with no distance term and
      // no relation to the ruin in the prose, returning null in a world
      // with none. A chip naming "the way to X" would be an Unsafe Bridge
      // defect in a new place. The words the player actually reads — that
      // the sign was not aimed at this ground — live in this step's own
      // criticalSuccessAfterimage and successAfterimage above, as base
      // text landing on the same rolls this effect fires on.
      { kind: 'spawn_clue', source: 'encounter_outcome', precision: 'vague', targetRuinId: '$nearest_ruin' },
    ],
  },
  /**
   * Added at the systems pass (Pass 3): this step's own `critical_failure`
   * always ends the action immediately (`advanceStep`), bypassing
   * `continue_weakened` above and skipping step 1 entirely — so the
   * action-level `critical_failure` band's two chips, authored against step
   * 1's `failureMetadata` alone, were unbacked on that path. Duplicating the
   * two effects here closes it. Accepted trade-off: this block also fires on
   * a plain step-0 `failure` that continues to a step-1 success/failure, so
   * on the compound path "step 0 fails, step 1 also fails" the write below
   * lands twice — see the file header and `removeAll: true` on the mercy
   * reaction, the compensating change.
   */
  failureMetadata: {
    effects: [
      { kind: 'condition_attachment', templateId: 'trait.condition.terrified', targetAgentId: '$actor' },
      { kind: 'agent_relocation', targetAgentId: '$actor', destination: { kind: 'away', minHexDistance: 3 }, mode: 'travel' },
    ],
  },
  nudges: STEP_0_HAND,
};

// ─── Step 1 ─────────────────────────────────────────────────────

/**
 * Step 1 — `eye`, "Say what is there". Difficulty 0.42 -> `fair`. The final
 * step, so its band prose is the peak-eligible surface.
 * `carryoverFactorLines` — variant by construction, keyed on the band step 0
 * rolled (THR-892).
 *
 * `failBehavior: 'fail_action'` — the final step; failing it ends the action.
 */
const step1SayWhatIsThere: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 1 },
  difficulty: 0.42,
  purposeLine: 'Say what is there',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  carryoverFactorLines: {
    critical_success: {
      text: 'They read it edge to edge, and it shows when they speak.',
      polarity: 'for',
      forecastDelta: 0.05,
    },
    success: {
      text: 'They came down with a reading they can state plainly.',
      polarity: 'for',
      forecastDelta: 0.03,
    },
    success_at_cost: {
      text: 'The glare from the stone is still in their eyes.',
      polarity: 'against',
      forecastDelta: -0.02,
    },
    near_miss: {
      text: 'They half-read it on the stone, and they know it.',
      polarity: 'against',
      forecastDelta: -0.03,
    },
    failure: {
      text: 'They are speaking with no reading to stand on.',
      polarity: 'against',
      forecastDelta: -0.06,
    },
    critical_failure: {
      text: 'They are certain, and certain of the wrong shape.',
      polarity: 'against',
      forecastDelta: -0.08,
    },
  },
  narrativeTemplate:
    'They come down with a reading. The camp turns to hear it. Both sides want their own answer back, and ' +
    'nobody is waiting to be persuaded.',
  criticalSuccessAfterimage: 'They said it plainly, and both sides put their answers down and listened.',
  successAfterimage: 'They said it plainly, and enough of the camp took it.',
  successAtCostAfterimage: 'The reading landed. So did a hard name for the one who gave it.',
  failureAfterimage: 'They said it, and each side heard only its own answer confirmed.',
  criticalFailureAfterimage: 'They said it, and the camp decided the reader was the problem.',
  /**
   * `successMetadata` fires on `isStepSuccess`. `$target` binds to the
   * location for this template family by construction
   * (`generateUnifiedCandidates` always sets `targetId: locationId` for a
   * `locationSubtypes`-gated candidate).
   */
  successMetadata: {
    effects: [
      { kind: 'condition_attachment', templateId: 'trait.condition.location.under_watch', targetLocationId: '$target' },
      {
        kind: 'agent_relocation',
        targetAgentId: '$actor',
        destination: { kind: 'nearest_settlement' },
        mode: 'travel',
      },
    ],
  },
  /**
   * `failureMetadata` fires on `failure` and `critical_failure` only
   * (`isStepSuccess` counts `near_miss` as advancing). See step 0's own
   * `failureMetadata` above for the reachability gap this duplicates
   * against, and the file header for the accepted double on the compound
   * failure path.
   */
  failureMetadata: {
    effects: [
      { kind: 'condition_attachment', templateId: 'trait.condition.terrified', targetAgentId: '$actor' },
      { kind: 'agent_relocation', targetAgentId: '$actor', destination: { kind: 'away', minHexDistance: 3 }, mode: 'travel' },
    ],
  },
  nudges: STEP_1_HAND,
};

// ─── Aftermath ───────────────────────────────────────────────────
//
// Choice-less at the mortal level (design block row 6 — this is a test, not
// a fork), so the five bands hang off `fallback.byOutcome`. Reactions live
// on `fallback` and are available on every band.

export const THE_SIGN_OVER_THE_RUIN_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope({
  id: 'encounter.border.the_sign_over_the_ruin',
  /**
   * `rarityTier: 3` — required for `drawnHandForTemplate` to actually draw
   * `['condition', 'knowledge', 'movement']` at `reach: 'veil'` (verified
   * live via `check:encounter`; at rarityTier 1-2 the same id/reach draws
   * `['condition', 'membership']` instead, which the design doc does not
   * record). `intrinsicTier: 'background'` (open-draw ambient) is
   * independent of rarityTier and still applies.
   */
  rarityTier: 3,
  intrinsicTier: 'background',
  name: 'The Sign Over the Ruin',
  /**
   * `reach: 'veil'` — the field `checkConsequenceDraw` / `drawnHandForTemplate`
   * read (`template.reach`, not any step's own reach). `eye` is step 1's
   * reach, not the template's.
   */
  reach: 'veil',
  crudType: 'read',
  scale: 'local',

  steps: [step0ReadTheSign, step1SayWhatIsThere],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * `tradition_novelty` (Veil's own pair, Archivist <-> Heretic) is the axis
   * of an omen that has already hardened into two readings before anyone
   * read it truly. `revelation_discretion` (Eye's own pair, Seeker <->
   * Sentinel) is the axis of whether a true statement gets said in a room
   * that has voted. Neither is a fork — this encounter has none — they are
   * the axes the scene tilts.
   */
  motivations: ['tradition_novelty', 'revelation_discretion'],

  /**
   * Setting envelope (THR-884). Four declared classes, one opening each;
   * `locationSubtypes` derived via `expandSettings`, never hand-written. A
   * four-class envelope inherits no THR-1044 family default support bundle,
   * so this template declares its own — class-honest at all four (design
   * doc § 8, § 12).
   */
  settings: ['stronghold', 'ruin', 'wayside', 'battlefield'],
  // P1 arrival, one per class (Doctrine v2) — the P2/P3 spine lands below it
  // (step 0 narrativeTemplate).
  openings: {
    ruin: '{name} arrives at the ruins of {location} in the morning.',
    battlefield: 'The road brings {name} to the old battlefield at {location}.',
    wayside: '{name} stops for the night at the waystation of {location}.',
    stronghold: '{name} arrives before the walls of {location}.',
  },
  locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'The sign came down at first light and everyone here watched it. Nobody has worked or moved on since.',
    success:
      'The true reading is out. What the camp does with it has already started.',
    failure:
      'The reading did not hold. Both sides keep the answer they came with, and the argument stays.',
  },

  /**
   * consequenceDraw is binding — `check:encounter` recomputes it from the
   * template id, `template.reach` and `template.rarityTier`. `condition` is
   * wired by the `terrified` write (step 0 and step 1 `failureMetadata`);
   * `knowledge` by `spawn_clue` (step 0 `successMetadata`); `movement` by
   * `agent_relocation` (both directions, step 1). No `consequenceSwap` — all
   * three drawn families wire in context.
   */
  consequenceDraw: ['condition', 'knowledge', 'movement'],

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The camp has its answer now, or it has its argument. Everyone here will retell it later as if they ' +
        'had known all along.',
      changes: [],
      reactionPrompt: 'What do you carry out of this?',
      reactions: [
        {
          id: 'sign.steady_the_one_who_stayed',
          label: 'Steady the one who stayed',
          intent: 'The pilgrim did not look away and did not pick a side. Give that a fire to burn on.',
          effects: [
            { kind: 'condition_attachment', templateId: 'trait.condition.inspired', targetAgentId: '$cast:witness' },
          ],
        },
        {
          // Fix #1 (package.md fix list item 1): `removeAll: true` added.
          // Terrified can be on the agent twice (step 0's and step 1's
          // failureMetadata both firing on the compound failure path), and
          // the un-flagged form removes only the oldest edge, so the
          // reaction's stated intent ("let them put it down") would not
          // happen on the band it most often appears on.
          id: 'sign.take_the_fear_off_them',
          label: 'Take the fear off them',
          intent: 'They stood in front of it longer than a person should. Let them put it down.',
          effects: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.terrified', removeAll: true }],
        },
        {
          id: 'sign.let_the_country_carry_it',
          label: 'Let the country carry it',
          intent: 'Neither reading needs you now. Let the roads argue it out.',
          effects: [
            {
              kind: 'emit_omen',
              category: 'cultural',
              intensity: 0.4,
              scope: { kind: 'global' },
              sphereAlignment: 'time',
              narrativeHook:
                'Two readings of the sign over the border ground are travelling faster than the people who made them.',
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'The reading came out whole and the camp took it whole. Both sides went quiet at once. Two of the ' +
            'loudest walked up to the stone afterwards and looked at it properly for the first time. People ' +
            'will keep watch on this place from now on.',
          changes: [
            {
              // Backing write: step 1 successMetadata -> condition_attachment
              // on $target. Step 1 always runs on this band. Categorised
              // `scar`, not `path` (systems-pass correction): the write is
              // real, but nothing in the corpus reads
              // trait.condition.location.under_watch, so PATH's
              // forward-looking promise would overclaim. SCAR's narrower
              // claim — the place *is* watched now — is true regardless.
              id: 'sign.the_place_is_watched',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Eyes On This Ground',
              causeClause: 'The reading was said out loud and taken, in front of everyone camped here',
              detail:
                '{target} carries Under Watch now — people keep eyes on it, and quiet work here is harder and ' +
                'likelier to be seen.',
              stateNoun: { text: 'a watched place', entityId: '$target', visualKind: 'location' },
              concepts: [
                { text: 'Under Watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' },
              ],
            },
          ],
        },
        success: {
          overview:
            'The reading is out and enough people took it. The argument will go on another week, but it will ' +
            'be a better argument now. There is a road down from here, and people willing to walk it with them.',
          changes: [
            {
              // Backing write: step 1 successMetadata -> agent_relocation,
              // nearest_settlement. The `under_watch` write also fires on
              // this band (same successMetadata) and is deliberately left
              // unchipped here — the beat this ending is about is the road
              // out, and a chip on every success-side band stops being
              // reserved.
              id: 'sign.carried_onward',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              title: 'Carried Off This Ground',
              causeClause: 'The reading landed, and half the camp wanted it said again where more people could hear it',
              detail: '{actor} is set on the road to the nearest settlement, to say it where it will travel further.',
              stateNoun: { text: 'a journey set', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'the nearest settlement' }],
            },
          ],
        },
        success_at_cost: {
          // No `changes` authored — deliberate. Two writes do fire on this
          // band (step 1's successMetadata runs on isStepSuccess, which
          // counts success_at_cost as success), but both are already chipped
          // on the bands they are about (critical_success, success); this
          // band's own beat — attention and reputation among people who
          // scatter tomorrow — has no effect behind it, so the words stay in
          // the overview, which claims nothing.
          overview:
            'They got it said. From the second sentence on, the question stopped being the sign and became ' +
            'the stranger claiming to read it. Both old readings still stand. So does a third one now, about them.',
          changes: [],
        },
        failure: {
          overview:
            'The reading did not hold on the stone or in front of the crowd. Both sides keep what they came ' +
            'with. {cast:witness} has not moved. The stone put a fear into them that will need walking off.',
          changes: [
            {
              // Backing write: step 1 failureMetadata -> condition_attachment
              // terrified on $actor. Plain `failure` is only reachable
              // through step 1's own failure-side roll, so this is backed on
              // every path to this band.
              id: 'sign.what_the_looking_cost',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'What The Looking Cost',
              causeClause: 'They stood in front of the remnant longer than anyone else on the ground and came down with no reading',
              detail: '{actor} carries Terrified — a fear from the stone that takes the steadiness out of standing their ground.',
              stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
            },
          ],
        },
        critical_failure: {
          overview:
            'They were certain, and certain of the wrong shape. The camp heard the difference before they ' +
            'finished. By dusk both sides had agreed on one thing: the reader was to blame. {cast:witness} ' +
            'walks them off the ground, points them at a road, and does not say which reading was right.',
          changes: [
            {
              // Backing writes: both paths to this band now fire this
              // effect — step 1's own failureMetadata (path B) and, since
              // the systems-pass fix, step 0's own failureMetadata (path A,
              // where step 0 alone rolls critical_failure and step 1 never
              // runs).
              id: 'sign.what_the_looking_cost_worse',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'What The Looking Cost',
              causeClause: 'They stared it down, got the shape wrong, and heard the whole ground turn while they were still talking',
              detail: '{actor} carries Terrified — a fear from the stone that takes the steadiness out of standing their ground.',
              stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
            },
            {
              id: 'sign.run_off_the_ground',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'loss',
              title: 'A Road Out',
              causeClause: 'Both sides settled on the same answer about who was to blame, and it was the one who read it',
              detail: '{actor} is set on the road away from {target}, with no destination past being elsewhere.',
              stateNoun: { text: 'a journey set', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'the road away' }],
            },
          ],
        },
      },
    },
  },

  description:
    'A two-step Puzzle-Investigation: a remnant hanging over a broken stone that resists being read, two ' +
    'readings already hardened into factions, and a true report that has to land in a room that has voted.',
});
