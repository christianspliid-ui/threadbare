/**
 * The Swollen Ford — the nudge-model golden exemplar, in the locked THR-883
 * format (communication pivot + setting envelopes + card system).
 *
 * **This is a fixture, not content.** It is deliberately absent from
 * `UNIFIED_ACTION_TEMPLATES` and from every pool: no mortal will ever draw it.
 * Its job is to be the one worked example the authoring skills point at — every
 * rule of the locked format is visible here once, in a shape a person can copy.
 * `nudgeModel.test.ts` § *golden exemplar* asserts the checklist against it, so
 * a rule that drifts out of the skill and a rule that drifts out of the
 * exemplar both break a test.
 *
 * It supersedes the Darkhollow Vault (WS1, pre-pivot). What changed and why:
 *
 *   - **Prose does the scene; cards do the rules** (THR-883 pivot). A card
 *     carries a generic name and one plain mechanical `effectLine` stating what
 *     the god does and why that moves the odds. Zero scene-bespoke card prose.
 *     The scene lives in the openings, the step spine, and the band prose.
 *
 *     **The flavor quote is retired** (Prose Doctrine v2, 2026-08-25; THR-1224).
 *     Every card below still carries a `fiction` string and **no card face draws
 *     one** — `NudgePhaseShell` stopped rendering the field, and the doctrine
 *     strikes "the flavor quote" by name. The strings survive here only because
 *     emptying them corpus-wide collides with the doctrine-v2 rewrite (THR-1223)
 *     and rides THR-1225. **Do not copy the `fiction` lines when using this as a
 *     worked example** — copy the names, the effect lines, and the band prose.
 *
 *     The name shape also tightened: doctrine v2 wants **imperative verb + noun**
 *     within four words ("Widen The Swing", never "The Wider Swing"), reported at
 *     warn level by `doctrineV2Checks.ts`. This fixture's names predate that rule
 *     and are rewritten with the rest of the corpus under THR-1223.
 *   - **Setting envelope** (THR-884). The template declares `settings` from the
 *     8-class vocabulary and one opening per declared class; the spine below the
 *     opening is setting-neutral. `locationSubtypes` is derived, never
 *     hand-written.
 *   - **Hands are cut from the 21-type card library** (THR-885 mechanics; the
 *     library data model is THR-887). Each card below names its library type in
 *     a comment. No two cards in a hand answer the same question.
 *   - **Cost channels and grants** (THR-885). The Bargain pays in doom instead
 *     of essence; the Heavy Hand pays in detection; the Omen and the Balm
 *     change the world through `grants`, in the existing aftermath effect
 *     vocabulary, pinned live by `validateNudgeGrantRefs`.
 *   - **The Composition Contract** (THR-1045, Encounter Factory rulings
 *     2026-08-08). Every block present, no exemptions: a cast binding that is
 *     honest across the whole envelope (the fellow traveler), a reward that
 *     persists (the rewardPool draw + the condition effects), an aftermath
 *     banded to the byOutcome floor, and the systems quota met from the
 *     authored manifest. The gate this file stays green under:
 *     `npm run check:encounter -- fixture.encounter.swollen_ford`.
 *
 * Authoring skills: `.claude/skills/encounter-pipeline`,
 * `.claude/skills/template-encounter-rewrite` — both defer to
 * `encounter-pipeline/reference/nudge-authoring-spec.md`, which this file is
 * the worked example for.
 * Plans: `Docs/plans/2026-07-30-encounter-authoring-frameworks.md`,
 * `Docs/plans/2026-07-30-nudge-card-repertoire.md`,
 * `Docs/plans/2026-08-08-encounter-factory-workflow.md` (§1 + Rulings).
 *
 * ─── The scene-writer's checklist, answered in writing ───────────────
 * (Decision 1 of the frameworks plan. Every scene answers all of these before
 * it ships; a "no" means rewrite first. Answers below cover both openings and
 * the shared spine.)
 *
 *  A1 Where are we?        Rural: a valley river crossing below a village —
 *                          stake line, guide-rope, mill traffic. Wayside: the
 *                          same river where no town claims it — leaning posts,
 *                          a dead camp. Both grounded before anyone acts.
 *  A2 How does it feel?    Rain three days running; mud and wet grain on the
 *                          air (rural); cold camp, beaten ash, grey light
 *                          thinning (wayside); slick rope and thigh-deep
 *                          current in the spine.
 *  A3 Who is here?         Rural: a miller's boy with damp sacks, watching the
 *                          water. Wayside: no one at first — the cold camp
 *                          accounts for whoever came before. In either class, a
 *                          fellow traveler stops at the water's edge in the
 *                          spine (the cast binding), introduced before anything
 *                          refers to them. Nothing acts unannounced.
 *  A4 What must we know?   The flood moved the shallows; the stake line is
 *                          drowned; the mortal's road runs through the water.
 *                          All stated before the first step is asked for.
 *  A5 Complication last?   Yes — each opening builds the place; the spine lands
 *                          the flood on top of it.
 *  B6 Nothing unintroduced? The rope, stakes, bed, reeds, and far bank all
 *                          appear in prose before any card or factor names them.
 *  B7 Visible causes?      Rising water from three days of rain; the drop at
 *                          midstream from the drowned old bed.
 *  B8 No contradictions?   One river, one rope, one flood. The rural opening
 *                          leaves the hour open; the wayside opening sets
 *                          failing light, which the step-0 near-miss fragment
 *                          ("The daylight did not") leans on either way.
 *  C9 Would a real person? Crossing now is motivated (initiation names the
 *                          cost of balking); the ferocity of the alternative
 *                          route makes the attempt human.
 *  C10 People as people?   The miller's boy waits out the flood beside his
 *                          sacks; the empty camp is the wariness of those who
 *                          left; the fellow traveler keeps a stranger's
 *                          distance at the water's edge — and wades in only
 *                          when a life is in the river.
 *  C11 True costs?         Cold, exhaustion, lost gear, skin — carried in
 *                          factor lines, afterimages, and the aftermath note.
 *  D12 Stake in a sentence? "Do they cross tonight with gear and skin intact,
 *                          or does the river take its toll and the road two
 *                          more days?" Good outcome: across, wet, road intact.
 *                          Bad outcome: swept back battered, or the rope torn
 *                          loose and the crossing closed behind them.
 *  D13 Cards grounded?     Every card acts on what the scene established: the
 *                          light on the water, the rope, the current, the
 *                          body's weariness. Delete the river and every card
 *                          below is senseless.
 *  D14 Mechanism, not mood? Every `effectLine` states what the god does and why
 *                          it moves the odds, in plain words, no numbers — the
 *                          pip row renders magnitude.
 *  D15 Openings cover the envelope? `settings: ['rural','wayside']`, one
 *                          opening each, enforced by `validateSettingEnvelope`.
 *
 * ─── Mechanical design block (spec step 1 — designed before the prose) ─
 *   Whose problem?   The agent's, by construction: the flooded river is in
 *                    their road. Protagonist, never bystander.
 *   Reach = theme?   Step 0 tests Eye and is *about* reading truly; step 1
 *                    tests Stone and is *about* endurance. Chosen first; the
 *                    scene grew from them.
 *   Mechanics in play? Trait hook (core_integrity.virtue → the trait card and
 *                    variant), condition (exhausted → the Balm's target),
 *                    group state (the Fellowship card's gate), doom clock and
 *                    detection pressure (the two cost channels), omen system
 *                    (the Omen card's grant), cast binding (the fellow
 *                    traveler), reward pool (the river's snag-line draw). All
 *                    decided before writing; every one surfaces in a card, a
 *                    gate, a binding, or an outcome.
 *   Rewards/tension? Passage, time, and dry gear are the base reward — and the
 *                    river's snag-line pays a drawn possession scaled by how
 *                    clean the crossing was (the rewardPool draw; the Omen
 *                    card's "the flood keeps turning things up" is the same
 *                    fact in the fiction). The toll on failure is cold, lost
 *                    days, lost kit. Tension sits on the crossing itself
 *                    (step 1).
 *   Systems quota?   cast + rewards + conditions — three from the authored
 *                    manifest, which is the contract's floor and what
 *                    `check:encounter` reports for this file.
 *   Mortal choice?   None — this scene is a test, not a fork. (A choice would
 *                    name its value axis and resolve by the mortal's values
 *                    plus the god's lean, never by the player.)
 *   Promises pay off? The opening promises exactly what the steps deliver: a
 *                    reading and a crossing. No mystery is opened that the
 *                    bands do not close. The fellow traveler in the spine is a
 *                    presence, not a mystery — and at the worst ending they
 *                    are the hands that pull the agent out of the reeds.
 *
 * ─── Vignette record (checklist step 1 declarations) ─────────────────
 *   Motive hooks   — all four routes are honest here: `mission` (sent across),
 *                    `choice` (their own errand), `chance` (the road put the
 *                    river in front of them), `divine` (led to the water).
 *                    A crossing is whoever's road it interrupts.
 *   Quintessence   — moderate. Open-draw ambient content: failure costs gear,
 *   stakes           warmth, and days; a critical failure is a battering and
 *                    exhaustion, never a scripted death.
 *   Scene tag      — `river.ford.flooded` (WS4 vocabulary; until the manifest
 *                    exists the fallback chain ends at EntityVisual).
 *   Aftermath      — `aftermathConfig` with the byOutcome floor (ruling 7):
 *                    success / failure / critical_failure, the fellow-traveler
 *                    reveal at the worst band, and object references
 *                    throughout — the rewardPool draw, the omen and condition
 *                    grants on the cards, exhaustion minted by the step's
 *                    failure outcome and lifted by the fallback's rest
 *                    reaction.
 *                    (An earlier revision of this file read "no
 *                    aftermathConfig — a background crossing resolves through
 *                    the default assembly"; the contract retired that
 *                    allowance, because the default assembly is where every
 *                    ending reads the same at every band.)
 *
 * ─── Reachability (THR-821) ──────────────────────────────────────────
 * Open-draw ambient content (`intrinsicTier: 'background'`), so both steps sit
 * at or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45): 0.35 and 0.40. This
 * demonstrates the open-draw branch of the reachability rule — the Darkhollow
 * Vault demonstrated the other branch (a steep step gated to actors who hold
 * the reach). Pick one branch and honor it; a severe step on an open draw is a
 * decorative hand.
 */

import type {
  ActionStep,
  StepNudge,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import { expandSettings } from '../../settingClasses';

/**
 * The one live trait this encounter hooks. A ref, resolved ANY-of across node
 * id / short id / display name / tag (THR-786), so the full node id is the
 * form least likely to rot. `trait.core.core_integrity.virtue` is the "True"
 * pole of the Core integrity continuum (`src/data/core-trait-content.ts`) — a
 * seeded definition, so `validateTraitRefs()` does not report it dead. The
 * checklist forbids hooking anything the sweep flags (THR-800).
 */
export const EXEMPLAR_TRAIT_REF = 'trait.core.core_integrity.virtue';

// ─── Step 0 hand: reading the water ──────────────────────────────────
//
// Six cards, six different library types (Boost ×3 at three different angles is
// deliberate: nerve, light, and memory are three different questions about a
// reading — the no-two-cards-answer-the-same-question rule is about the
// decision a card creates, and each of these buys a different kind of
// certainty). Five spheres plus one common option. One rider. Every card
// carries at least one failure-texture fragment; between them the hand covers
// all six StepOutcomes.

const STEP_0_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared `focus` family, the common option. Title, effect,
    // and quote are library-generic: this exact card face reads correctly in
    // any encounter where a mortal's nerve is the variable.
    id: 'ford.steady_breath',
    name: 'Steady Breath',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You settle their nerve, so the eye rests on the water instead of the crossing to come. A small help.',
    bandProse: {
      success: 'Read calm, the river showed its seams.',
      near_miss: 'The calm held to the end. The daylight did not.',
    },
  },
  {
    // Type: Boost — sphere-keyed (light). Same verb as Steady Breath, different
    // physics: this one changes the scene, not the reader.
    id: 'ford.a_break_of_light',
    name: 'A Break of Light',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.light',
    effectLine:
      'You thin the overcast, and low sun crosses the water: shallows show pale, the channel shows dark. A real help.',
    bandProse: {
      critical_success:
        'Under the sudden sun the whole ford showed itself, pale stake to pale stake.',
      failure: 'The light came true. It lit a channel that had moved since the stakes went in.',
    },
  },
  {
    // Type: Boost — sphere-keyed (mind). The third angle on the reading:
    // experience the mortal already owns, surfaced on cue.
    id: 'ford.old_lessons',
    name: 'Old Lessons',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.memory',
    effectLine:
      'You surface every crossing they have made before this one, so the river reads familiar. A real help.',
    bandProse: {
      success_at_cost:
        'Old crossings guided them, and one old crossing put its fear back in their chest.',
      failure: 'Every ford they remembered was a tamer river than this one.',
    },
  },
  {
    // Type: Omen — sphere-keyed (time), and the hand's world-changing card: the
    // grant plants a cultural omen through the existing `emit_omen` door, so
    // future encounter draws bend toward what the flood uncovered. The grant id
    // path is pinned live by `validateNudgeGrantRefs`.
    //
    // `fictionBySetting` (THR-884), demonstrated once: the quote names class
    // scenery, so it carries one line per declared class with the generic quote
    // as the default. Most library cards never need this field.
    id: 'ford.a_sign_given',
    name: 'A Sign Given',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.dark',
    effectLine:
      'A faint help now, and the days after bend toward what the flood uncovered here.',
    grants: [
      {
        kind: 'emit_omen',
        category: 'cultural',
        intensity: 0.35,
        narrativeHook:
          'The flood keeps turning up what the valley buried, and the valley has begun to talk.',
        scope: { kind: 'global' },
        sphereAlignment: 'time',
      },
    ],
    bandProse: {
      success: 'The marked shallow held, and word of what the flood gave up will travel.',
      near_miss: 'The sign was given and read. The reading still stopped short of the far bank.',
    },
  },
  {
    // Type: Bargain — sphere-keyed (entropy). Free in essence, paid on the doom
    // clock through `costs` (THR-885 cost channels). Zero essence outside a
    // trait card is legal exactly when a non-essence channel carries the price.
    id: 'ford.pay_it_later',
    name: 'Pay It Later',
    sphere: 'entropy',
    essenceCost: 0,
    forecastDelta: 0.12,
    imageTag: 'generic.decay',
    costs: { doomDelta: 0.05 },
    effectLine:
      'No essence changes hands: the world’s doom clock runs a shade faster instead. A strong help.',
    bandProse: {
      success: 'The line came clear at no cost they could see. The clock ran on.',
      failure: 'The debt was taken on, and the river kept no side of the bargain.',
    },
  },
  {
    // Type: Gambit — sphere-keyed (chaos), and this hand's ONE rider. The
    // justification the checklist demands: chaos's signature reshapes the
    // ladder instead of climbing it, priced cheap because the widened downside
    // IS the price. One rider per hand — a second would answer the same
    // question (what shape does the outcome take) twice.
    id: 'ford.no_half_measures',
    name: 'No Half Measures',
    sphere: 'chaos',
    essenceCost: 1,
    forecastDelta: 0.03,
    rider: 'all_or_nothing',
    imageTag: 'generic.luck',
    effectLine:
      'The middling readings wash out: they find the true line clean, or commit to a false one. The middle drops away.',
    bandProse: {
      critical_success: 'The river resolved into one clean line, plain as a drawn map.',
      failure: 'No middle reading survived. The one left in their hands was wrong.',
      critical_failure: 'Certainty took them. The false line looked truest of all.',
    },
  },
];

// ─── Step 1 hand: the crossing ───────────────────────────────────────
//
// Six cards, six library types. Four spheres plus the common option plus the
// trait card. Two gated cards demonstrate the runtime filters: the trait card
// hides without the trait, Shared Burden hides outside a group — so the dealt
// hand lands at four to six cards, which is the dealt-size doctrine.

const STEP_1_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — shared `strength` family, the common option.
    id: 'ford.second_wind',
    name: 'Second Wind',
    essenceCost: 1,
    forecastDelta: 0.1,
    imageTag: 'generic.strength',
    effectLine:
      'When their arms go dead on the rope, the body finds one more pull. A real help.',
    bandProse: {
      success: 'The last pull came from a reserve they had never needed before.',
      failure: 'There was one more pull in them. The river asked for three.',
    },
  },
  {
    // Type: Insurance — sphere-keyed (order), and this hand's ONE rider.
    // Justification: order's signature buys the floor, priced at the hand's
    // ceiling because it converts both plain failures into a paid arrival.
    // Its failure-texture fragment sits on critical_failure — the only failure
    // band `floor_at_cost` leaves reachable while the card is active.
    id: 'ford.safe_passage',
    name: 'Safe Passage',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'floor_at_cost',
    imageTag: 'generic.ward',
    effectLine:
      'However the river runs, they reach the far bank. The price, if it comes due, is paid in gear and skin.',
    bandProse: {
      success_at_cost: 'Arrival had been bought in advance. The river took its fee off their back.',
      critical_failure: 'The rope parted, and no bought arrival could reach them in the water.',
    },
  },
  {
    // Type: Heavy Hand — sphere-keyed (force). Big delta (≥ NUDGE_BIG_DELTA, so
    // both failure and critical_failure fragments are owed), cheap in essence,
    // paid in detection pressure through `costs` — rival gods see the working.
    id: 'ford.main_strength',
    name: 'Main Strength',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.16,
    imageTag: 'generic.energy',
    costs: { detectionDelta: 0.15 },
    effectLine:
      'The current slackens against them the whole width of the river. Rival gods can hardly miss the hand that did it.',
    bandProse: {
      critical_success: 'They walked the drowned ford through a river holding its breath.',
      failure: 'The current went slack, and still the bed rolled a stone under their leading foot.',
      critical_failure:
        'The current died so plainly that they stopped mid-river to stare, and the cold made its argument.',
    },
  },
  {
    // Type: Balm — sphere-keyed (life). The grant lifts a condition through the
    // existing `remove_condition` door, pinned live by `validateNudgeGrantRefs`.
    // Under THR-887 the library Balm binds by selector (the bearer's worst
    // active condition) and is not dealt when there is no condition to lift;
    // until then the authored instance names the condition it treats.
    id: 'ford.fresh_legs',
    name: 'Fresh Legs',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.warmth',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }],
    // The critique pass rewrote this face: the earlier "three days of
    // road-weariness" invented agent history the graph does not hold (rule 7)
    // on an ungated card. The face now assumes only what any Balm target has.
    effectLine:
      'Their weariness lifts before the first step in. They cross on a rested body.',
    bandProse: {
      success: 'A rested body took the drop at midstream like a stair.',
      near_miss: 'Fresh legs reached midstream ahead of the surge. The surge still came.',
    },
  },
  {
    // Type: Trait card — cost 0, because the price was paid by being this
    // person. Hidden (never dimmed) for an agent without the trait; unlocked
    // into the hand by the template's traitVariant via `addNudgeIds`.
    id: 'ford.a_word_kept',
    name: 'A Word Kept',
    requiredTrait: EXEMPLAR_TRAIT_REF,
    essenceCost: 0,
    forecastDelta: 0.08,
    imageTag: 'generic.oath',
    // Prose rule 6: the card reads only the trait it is gated on — no invented
    // promise or errand the graph does not hold. Setting out to cross is
    // scene-local fact; being True is the state read.
    effectLine:
      'No essence. They set out to cross, and being True, they do not turn back.',
    bandProse: {
      success: 'The promise pulled from the far bank, and they went to it.',
      // "The promise held. The riverbed did not." was the third "The X held.
      // The Y did not." in twelve cards — a house mannerism the critique's
      // echo check caught across replays, invisible within any single hand.
      failure: 'The promise pulled them forward, and the riverbed dropped from under their feet.',
    },
  },
  {
    // Type: Fellowship — sphere-keyed (spirit), dealt only in groups
    // (`requiresGroup`, THR-885 runtime filter). An unmet requirement hides the
    // card: a solo traveler never sees a company he does not have.
    id: 'ford.shared_burden',
    name: 'Shared Burden',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.1,
    requiresGroup: true,
    imageTag: 'generic.blessing',
    effectLine:
      'Only in company: the group crosses as one body, each pair of hands steadying the next through the water.',
    bandProse: {
      success: 'They went over as a chain, and the chain held to the last link.',
      near_miss: 'The chain held to the far bank. The last pack on the last back did not.',
    },
  },
];

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — Eye. Purpose line: "Read the water". Difficulty 0.35 → `fair`,
 * inside the open-draw ceiling.
 *
 * **No authored `factorLines` — the variance rule (Christian, chat
 * 2026-07-30).** A factor line earns its place only if it could have read
 * differently: it reports the broader game context — the agent (skill, traits,
 * equipment), the hex, global modifiers, earlier steps of this encounter.
 * Everything this step's earlier draft listed ("Floodwater carries silt…",
 * "The rain has not stopped…") is true on every run, so it is priced into
 * `difficulty: 0.35` and carried by the prose, and listing it was clutter.
 * The panel's variance lines (reach skill, trait deltas, carryovers) are
 * derived, not authored here.
 *
 * `continue_weakened`: a failed reading does not end the encounter — they can
 * still put a foot in on a bad line, which is exactly what the step 1 prose
 * then has to carry.
 */
const step0ReadTheWater: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.35,
  purposeLine: 'Read the water',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  // The setting-neutral spine. The declared openings land above this at
  // instantiation (the converter compiles `openings` onto the reserved
  // `opening` fragment slot), so nothing here may name a mill or a camp.
  // The fellow traveler (the cast binding) is introduced here, in the
  // setting-neutral spine, so they exist for both openings before any later
  // prose refers to them (checklist B6). Role-voiced, no token: no sentence
  // here earns the generated name — ruling 6's default register. The scene
  // word budget (60) is why the traveler's sentence displaced the old
  // dips-are-a-map clause rather than joining it.
  narrativeTemplate:
    'The river runs brown and loud over the drowned ford. The guide-rope dips where the ' +
    'current pulls hardest. The flood has moved the shallows since the stakes were set. ' +
    'Another traveler stops at the water’s edge, weighing the same crossing. Before the ' +
    'first step in, the water has to be read: where it piles, where it slides.',
  successAfterimage: 'They found the line: stake to stake, following the rope’s dip.',
  failureAfterimage: 'The brown water gave up no line worth trusting.',
  successAtCostAfterimage: 'They read the line true, and paid an hour of cold rain for it.',
  criticalSuccessAfterimage: 'The river read like a map, every shallow showing pale.',
  criticalFailureAfterimage: 'The line they chose was a liar’s line, angled into the channel.',
  nudges: STEP_0_HAND,
};

/**
 * Step 1 — Stone. Purpose line: "Make the crossing". Difficulty 0.40 → `fair`,
 * inside the open-draw ceiling.
 *
 * The final step, so its band prose is the peak-eligible surface. It still
 * holds the plainness rule for anything label-class.
 */
const step1MakeTheCrossing: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.4,
  // Same variance rule as step 0: the rope's record and the drop at midstream
  // are every-run facts, priced into 0.4. The one line an earlier draft had
  // that would qualify — cold from an hour lost in step 0's rain — is a
  // *carryover* from a prior step outcome, which is derived state, not a
  // static authored string (schema for carryover lines is ticketed).
  purposeLine: 'Make the crossing',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  /**
   * The reward draw (Composition Contract — Rewards). The flood turns things
   * up — the Omen card's own hook — and a crossing done well comes with what
   * the river snagged on the rope-line from whoever tried this ford before. A
   * seeded draw from the possession library: the tier curve and bad-outcome
   * chance resolve from the outcome band, so a clean crossing draws better
   * than a ragged one, and the result renders as an item change (the PRIZE
   * chip), composing with the authored ending since THR-1042.
   *
   * No `tagFilters` on purpose: a filter naming a tag no attachment template
   * carries is a silently empty pool — the THR-844 rot class in a new place —
   * so filter only on tags verified live. Note `successMetadata` fires on
   * `isStepSuccess`, which counts `near_miss` as a success.
   */
  successMetadata: {
    rewardPool: { categoryWeights: { possession: 1.0 } },
  },
  /**
   * The failure side mints the state the endings narrate (prose rule 7,
   * production half): a failed crossing leaves the body spent, so `exhausted`
   * is applied by the step outcome itself — the THR-783 per-step effect
   * channel — and the failure-side endings may then speak of it as fact.
   * (`near_miss` counts as a success under `isStepSuccess`, so it does not
   * fire this — a near miss got through.) The critique pass forced this
   * shape: an earlier draft asserted the exhaustion in the critical_failure
   * change while gating its application behind a mislabeled reaction, which
   * was prose claiming state the mechanics had not written.
   */
  failureMetadata: {
    effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted' }],
  },
  narrativeTemplate:
    'The water takes the first step at the shin and the third at the thigh. The rope runs ' +
    'slick under both hands, and the current leans in with the patience of weight. Midstream, ' +
    'the old bed drops a full hand’s depth. The far bank is close enough to count reeds ' +
    'on. Between here and there, the river decides.',
  successAfterimage: 'They came up the far bank streaming, rope-burned and across.',
  failureAfterimage:
    'The river took the crossing back at midstream and returned them to the near bank.',
  successAtCostAfterimage: 'They made the far bank short a boot, a bag, and a strip of skin.',
  criticalSuccessAfterimage: 'They crossed clean, and stood on the far bank with breath to spare.',
  criticalFailureAfterimage: 'The rope tore free, and the river carried them hard downstream.',
  nudges: STEP_1_HAND,
};

// ─── The template ────────────────────────────────────────────────────

/**
 * The exemplar, authored end-to-end against the locked format.
 *
 * Registered nowhere. Imported by `nudgeModel.test.ts` and read by authoring
 * sessions; if it ever appears in a pool, that is the bug.
 */
export const NUDGE_GOLDEN_EXEMPLAR: UnifiedActionTemplate = {
  id: 'fixture.encounter.swollen_ford',
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Swollen Ford',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',

  steps: [step0ReadTheWater, step1MakeTheCrossing],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * The axes this crossing tilts: cross tonight or wait out the flood
   * (courage vs prudence), and what the errand on the far bank is worth in
   * gear and skin (sacrifice vs survival).
   */
  motivations: ['courage_prudence', 'sacrifice_survival'],

  /**
   * Setting envelope (THR-884). The envelope is declared, the subtype list is
   * derived — never hand-written. `validateSettingEnvelope` holds all four
   * honesty rules over this trio of fields, and the exemplar test runs it.
   */
  // The critique pass caught two things here (2026-08-09): both openings and the
  // initiation opened on the same "Three days of rain…" clause — the seam-echo
  // class the detectors cannot see — so the initiation now owns the rain and
  // each opening owns the water. And the wayside opening never introduced the
  // stakes the spine's "since the stakes were set" refers to (a B6 failure at
  // one class of a two-class envelope), so it drives them now.
  settings: ['rural', 'wayside'],
  openings: {
    rural:
      'The valley’s river is up to its banks and still rising. The crossing serves the ' +
      'village on the far slope: stake line under the water, guide-rope strung post to ' +
      'post. A miller’s boy waits on the near bank beside sacks going damp, watching the ' +
      'water climb the posts. The air is all mud and wet grain.',
    wayside:
      'The river is over its banks and still climbing. Out here the crossing belongs to ' +
      'no town: a guide-rope strung between leaning posts, stakes driven at the old ' +
      'shallow, left by travelers years gone. A cold camp sits above the waterline, ash ' +
      'beaten flat by the rain. No roof stands within a day’s walk, and the grey light ' +
      'is thinning.',
  },
  locationSubtypes: expandSettings(['rural', 'wayside']),

  /**
   * Checklist step 5 — the trait hook, all four answers explicit:
   *   Gate?             No — a river stops everyone equally.
   *   Variant?          Yes — the one below.
   *   Trait-only card?  Yes — `ford.a_word_kept`, unlocked via `addNudgeIds`.
   *   Trait fragment?   No — the card's own band fragments carry it.
   */
  traitVariants: [
    {
      traitId: EXEMPLAR_TRAIT_REF,
      forecastDelta: 0.04,
      difficultyDelta: -0.02,
      factorLine: 'Being True, they will not turn back at midstream.',
      addNudgeIds: ['ford.a_word_kept'],
    },
  ],

  narrativeTemplates: {
    initiation:
      'Three days of rain have put the river over its ford, and the road runs through it. ' +
      'Cross tonight, and the road stays a road. Balk, and it is two days around by the ' +
      'high bridge, through country the flood has already claimed.',
    success:
      'The river gave up the crossing: wet to the ribs, rope-burned, across. The road runs ' +
      'on from the far bank.',
    // Prose rule 6: no invented errand — a chance wanderer draws this encounter
    // too, so the failure text claims only the road itself.
    failure:
      'The river kept the crossing. The road on the far bank will wait, and the water ' +
      'between has not gotten kinder.',
  },

  /**
   * Cast (Composition Contract, ruling 6 — THR-1045). The spine introduces a
   * fellow traveler stopped by the same flood; this is the binding that makes
   * them a real spawned person rather than a noun — portrait, cast strip,
   * click, persistence.
   *
   * Ruling 6's two halves, both demonstrated:
   *   - **Role-voiced inline is the default.** The spine writes "another
   *     traveler stops at the water's edge" — no token, because no sentence
   *     there earns the generated name.
   *   - **The token lands where the name earns something.** The
   *     critical_failure ending names the stranger who pulled the agent out
   *     of the reeds (`{cast:traveler}` in the byOutcome overview) — ruling
   *     6's "reveal" case. Greetings and sequel callbacks are the other
   *     earning spots.
   *
   * **Class-honesty — the rule this bundle exists to teach.** An explicit
   * bundle must read correctly at every class the envelope declares. This
   * template spans rural + wayside, so the bound person is one both classes
   * seed: `wanderer` / `pilgrim` appear in both rosters
   * (`LOCATION_ROLE_ROSTERS`). An earlier draft bound "the miller's boy" —
   * rural-honest, wayside-placeless — exactly the failure that keeps the
   * THR-1044 family defaults away from multi-class templates, and the reason
   * a multi-class template must declare its bundle explicitly (the
   * setting-keyed `encounter.*` default only reaches single-class envelopes;
   * this fixture's `fixture.encounter.*` id inherits nothing either way).
   *
   * `spawnName` is a real name, not a role phrase: a declared key always
   * resolves (THR-696), so this string is what `{cast:traveler}` renders
   * whenever no live NPC was reused. And the prose never genders the
   * traveler — reuse binds whoever is standing there.
   */
  supportBundle: [
    {
      kind: 'actor',
      key: 'traveler',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['wanderer', 'pilgrim'],
      supportRole: 'fellow_traveler',
      spawnNpcRole: 'wanderer',
      spawnName: 'Maren Ashford',
    },
  ],

  /**
   * Aftermath (Composition Contract, ruling 7 — THR-1045).
   *
   * Supersedes this file's original "no `aftermathConfig` — a background
   * crossing resolves through the default assembly" note. That was correct
   * under the pre-contract format and is not under this one: the contract's
   * floor is three outcome bands (success / failure / one extreme), because the
   * tails are precisely the endings a single playthrough never rolls and which
   * therefore go unwritten unless something asks for them.
   *
   * Choice-less, so the bands hang off `fallback` — which is the whole reason
   * THR-969 put `byOutcome` on the variant rather than beside it.
   *
   * Every change declares `concepts` (Law 2): the substring of `detail` that
   * names a game concept, so the chip can carry its tooltip.
   */
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The river has had its say. What it took and what it left are both on the far bank now.',
      changes: [
        {
          id: 'ford.the_crossing',
          kind: 'growth',
          title: 'The crossing, read',
          detail: 'A flooded ford teaches the stone reach faster than a dry one ever will.',
          polarity: 'gain',
          concepts: [{ text: 'stone reach', tooltipId: 'reach.stone' }],
        },
      ],
      reactions: [
        {
          id: 'ford.rest_the_body',
          label: 'Let them rest before the road',
          effects: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }],
        },
      ],
      // The critique pass gave each ending surface its own image: the
      // afterimage keeps the rope-burn, `narrativeTemplates` keeps "the river
      // kept the crossing", and these overviews say only what they alone can
      // say — the same fact three times in three voices is an echo, not an
      // ending.
      byOutcome: {
        success: {
          overview:
            'The crossing is behind them, gear and skin intact. The far bank road is dry '
            + 'ground the flood did not reach.',
        },
        failure: {
          overview:
            'The near bank keeps them. It is two days around by the high bridge now, on '
            + 'legs the river has already taxed.',
        },
        // The extreme the floor asks for. A critical failure is a battering and
        // exhaustion — never a scripted death (this file's stakes rule). This
        // is also where the cast token earns its place (ruling 6's "reveal"):
        // the stranger who pulls the agent out of the river becomes a named,
        // clickable person at the moment it matters.
        critical_failure: {
          overview:
            'The rope went slack at midstream and the current had them. It is the fellow '
            + 'traveler — {cast:traveler} — who wades into the reeds and pulls them out, '
            + 'half-drowned and stripped of all they carried.',
          // The exhaustion this change narrates is minted by step 1's
          // `failureMetadata` — narrate only what the mechanics wrote. An
          // earlier draft carried a reaction here labelled "Let the valley
          // remember this water" whose effect was `apply_condition:
          // exhausted` — a click whose label promised memory and delivered
          // harm, the interactive-plainness violation the critique pass
          // caught. Bands do not owe reactions; the fallback's rest reaction
          // is the honest mercy on every band.
          changes: [
            {
              id: 'ford.the_river_took_it',
              kind: 'item',
              title: 'What the river took',
              detail: 'The current stripped what was carried and left an exhaustion that will not walk off.',
              polarity: 'loss',
              // THR-1033 left this word plain, because `condition.*` is not one
              // of the tooltip registry's prefixes (Law 17) and an id there
              // would have rendered as a dead underline. THR-1164 gives it the
              // route it was missing: the condition is an **attachment**, whose
              // `entityId` is the template node id and whose `attachment.*`
              // tooltip is derived from it. The word the ending narrates now
              // reaches the condition the ending wrote.
              concepts: [
                { text: 'exhaustion', entityId: 'trait.condition.exhausted', visualKind: 'attachment' },
              ],
            },
          ],
        },
      },
    },
  },

  description:
    'A two-step flooded river crossing: read the water, then cross on the rope. The ' +
    'nudge-model golden exemplar, authored end-to-end against the locked THR-883 card format ' +
    'and the THR-1045 Composition Contract.',
};
