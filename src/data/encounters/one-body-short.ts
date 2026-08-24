/**
 * One Body Short — a single-step `eye` reading test: a fight that ended before
 * the agent got here (or that they walked away from), a ground that has to be
 * accounted for, and a count that comes out one short.
 *
 * Batch: border-perils (THR-1221). The sequel-payoff half of the batch's
 * `Seeded Sequel` pair — parent: `encounter.border.standing_the_line`.
 * Encounter Factory v3, nudge-native, THR-1045 Composition Contract — no
 * exemptions, even at one step (ruling 3).
 *
 * Design doc: `Docs/plans/encounters/one-body-short-final.md`
 * Systems audit: `Docs/plans/encounters/one-body-short-systems.md`
 * Package critique: `Docs/plans/encounters/one-body-short-package.md`
 *
 * The pole-agnostic contract (design doc § 8.3): this packet does not know,
 * and must never assume, which of the parent's two poles (`mercy_ruthlessness`)
 * was taken. No line names a pole, claims the agent was present for the fight,
 * or gives the survivor a pronoun — reuse binds whoever is standing there.
 */

import type { ActionStep, StepNudge, TraitVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterSupportActorSpec, EncounterSupportBundle } from '../../types/encounter';
import { expandSettings } from '../settingClasses';

// ─── Support Bundle ──────────────────────────────────────────────

/**
 * `survivor` — the cast key `encounter.border.standing_the_line` must bind the
 * crossing person under, so `inheritContext` lines the parent's cast up with
 * this scene (design doc § 8.4a). A declared key always resolves (THR-696), so
 * a mismatch on the parent's side still reads correctly here — it only loses
 * the sequel callback, not correctness.
 */
const survivorSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'survivor',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['mercenary', 'scout', 'ranger', 'wanderer'],
  supportRole: 'fellow_survivor',
  spawnNpcRole: 'mercenary',
  spawnName: 'Ivo Renn',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [survivorSpec];

// ─── The trait hook ──────────────────────────────────────────────

/**
 * `trait.core.core_warmth.virtue` — the "Warm" pole of Core warmth. Built by
 * `core-trait-content.ts` (`CORE_CONTINUA` → `core_warmth`), a seeded
 * definition, so `validateTraitRefs()` does not report it dead. Deliberately
 * not the exemplar's `core_integrity.virtue` — Warm fits the step's action (a
 * person who knows the dead as people notices which one is missing), and it
 * keeps the corpus off a single continuum.
 */
const GRIEF_TRAIT_REF = 'trait.core.core_warmth.virtue';

const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: GRIEF_TRAIT_REF,
    forecastDelta: 0.03,
    difficultyDelta: -0.02,
    factorLine: 'Being Warm, they look at each face before moving on.',
    addNudgeIds: ['short.who_they_are'],
  },
];

// ─── The hand (6 cards, one nudge-bearing step) ─────────────────────
//
// Budget: whisper, omen, long_game, boost (x2, the <=2 cap), trait_card — 5
// distinct types (floor 3). Zero riders. Spheres: light, energy, time,
// darkness = 4 distinct, at HAND_SPHERE_COVERAGE_MIN. Two common
// (sphere-less) options, one ungated. Summed forecastDelta = 0.41, inside
// NUDGE_HAND_MAX_TOTAL_DELTA (0.70). No card reaches NUDGE_BIG_DELTA (0.15).

const STEP_0_HAND: readonly StepNudge[] = [
  {
    // Type: Whisper — sphere-keyed (light). No `reveals` field: the Whisper
    // type's only implemented reveal kind is `next_step_demand`, and this is
    // a one-step encounter, so declaring it would ship a lever that cannot
    // fire (the live-layer trap). The card is a Whisper through its host
    // system instead — the library's own type row names `Intelligence` as its
    // `hostSystem` — and this card writes a real `intelligence` record.
    id: 'short.plain_sight',
    libraryCardId: 'card.whisper.signature.light',
    name: 'Plain Sight',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.10,
    imageTag: 'generic.light',
    effectLine:
      'You set what ground like this usually says beside what this ground is saying, so the difference stands out. A real help.',
    fiction: 'Nothing was hidden. It was only unlit.',
    grants: [
      {
        kind: 'intelligence',
        category: 'military_position',
        label: 'The shape of the fight',
        detail: 'Where each side stood on this ground, and the place where one of them stopped being accounted for.',
        reliability: 0.7,
      },
    ],
    bandProse: {
      success: 'Laid against what such ground usually shows, the gap in this one was obvious.',
      near_miss: 'The comparison held from place to place and then stopped. The last one stayed a blank.',
    },
  },
  {
    // Type: Boost (common, ungated) — the hand's ungated common option.
    id: 'short.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'A Little More',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'You steady them enough to keep their eyes on what is in front of them. A small help.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success_at_cost: 'They held their eyes on it long past wanting to. The count came out. The looking stayed.',
      failure: 'Steady was not the missing part. They looked at it straight and read it wrong.',
    },
  },
  {
    // Type: Boost — sphere-keyed (energy), the second and last Boost. Buys the
    // completeness of the search, where the common Boost buys the will to
    // keep looking — same verb, different question.
    id: 'short.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'A Sudden Surge',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.vigor',
    effectLine:
      'The body finds enough left to turn over every last one instead of stopping at the easy ones. A real help.',
    fiction: 'Bodies hold more than they admit.',
    bandProse: {
      critical_success: 'They went through every body on the ground, and the ground gave up the whole account.',
      failure: 'They had the strength to finish the search. It finished, and left them holding the same short count.',
    },
  },
  {
    // Type: Omen — sphere-keyed (time). Deliberately about recurrence, so it
    // is not the same omen as the one the `short.say_the_count` reaction
    // emits (§ 7.3 of the design doc) — two `emit_omen` sites are only
    // legitimate here because they say different things.
    id: 'short.this_has_happened',
    libraryCardId: 'card.omen.signature.time',
    name: 'This Has Happened',
    sphere: 'time',
    essenceCost: 1,
    forecastDelta: 0.05,
    imageTag: 'generic.time-slow',
    effectLine:
      'You give them the feeling this has happened before, so their hands know where to look before their eyes do. A faint help, and the days after bend toward what it turns up.',
    fiction: 'Nothing happens only once.',
    grants: [
      {
        kind: 'emit_omen',
        category: 'cultural',
        intensity: 0.30,
        narrativeHook: 'This has happened before in this country, and the people who remember it are counting again.',
        scope: { kind: 'global' },
        sphereAlignment: 'time',
      },
    ],
    bandProse: {
      success: 'The count closed, and word of the place that held a death and no body will travel.',
      near_miss: 'The place felt like one they had stood in before. The count still stopped one short.',
    },
  },
  {
    // Type: Long Game — sphere-keyed (darkness), the type's corpus debut.
    // Deliberately no libraryCardId: the library is generated from four
    // tables and `long_game` appears in none that would give it a usable
    // member — it is not in UNIVERSAL_CORE_TYPES and darkness's only signed
    // member (`card.long_game.hunger.sever`) is a hunger unique held only by
    // a Sever god, sphere-less by construction and mechanically the wrong
    // face (it cuts a tie; this one plants one). Pointing this card at it
    // would misdescribe it and drop the hand from 4 distinct spheres to 3,
    // under HAND_SPHERE_COVERAGE_MIN, because darkness enters this hand
    // through this card or not at all. Recorded as a one-off, which the brief
    // permits as a choice; library membership is out of scope for this batch.
    id: 'short.left_for_later',
    name: 'Left For Later',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.04,
    imageTag: 'generic.dark',
    effectLine:
      'You set a mark on them nobody can see, so what they carry out of here finds them again further on. A slight help now; the mark is the part that lasts.',
    fiction: 'What is buried keeps.',
    grants: [
      {
        kind: 'hidden_mark',
        category: 'secret_knowledge',
        severity: 0.55,
        label: 'Knows what this ground did not give back',
        revealFamilies: ['encounter.border'],
      },
    ],
    bandProse: {
      success: 'What they read here went under the skin where nobody will see it, and it will keep.',
      failure: 'The ground kept its answer. The mark stayed anyway, and it will find a road to surface on.',
    },
  },
  {
    // Type: Trait card — cost 0, hidden without the trait, unlocked into the
    // hand by the traitVariant's addNudgeIds.
    id: 'short.who_they_are',
    libraryCardId: 'card.trait_card.core',
    name: 'Who They Are',
    requiredTrait: GRIEF_TRAIT_REF,
    essenceCost: 0,
    forecastDelta: 0.07,
    imageTag: 'generic.memory',
    effectLine:
      'No essence. Being Warm, they take people one at a time instead of as a crowd, and one at a time is how the odd one shows.',
    fiction: 'Character is the one resource nobody spends.',
    bandProse: {
      success_at_cost: 'They gave each of them a face before moving on, and got the count. Every one of those faces came back to them later.',
      critical_failure: 'They gave each of them a face, and then could not put a single one down, and stopped being able to count at all.',
    },
  },
];

// ─── The step ────────────────────────────────────────────────────

/**
 * The one step. Reach `eye`, difficulty 0.40 -> `fair`. `intrinsicTier:
 * 'story_beat'` (a seeded sequel has an author-chosen audience), so the
 * open-draw ceiling (NUDGE_OFF_REACH_MAX_DIFFICULTY, which binds `background`
 * only) does not apply — authored at `fair` anyway, because the audience was
 * selected for surviving a fight, not for holding `eye`.
 *
 * No authored factorLines (THR-892) — everything an earlier draft wanted to
 * list reads identically on every run, so it is priced into the difficulty
 * and carried by the prose. No carryoverFactorLines — first and only step.
 *
 * failBehavior: fail_action — the only step; failing it ends the action.
 */
const step0ReadTheGround: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0.40,
  purposeLine: 'Read the ground',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // The setting-neutral spine. The declared opening lands above this at
  // instantiation. The survivor is introduced here, before any later prose
  // refers to them, with no pronoun anywhere.
  narrativeTemplate:
    'The fighting stopped a while ago and nothing has moved since. The other survivor sits apart with open ' +
    'hands, not looking at the ground. The dead lie where they fell, and the count comes out one short. One ' +
    'place has everything a death leaves except the body: beaten ground, a dropped blade, nobody lying ' +
    'between them.',
  successAfterimage: 'They walked it twice and got the same answer both times: one death here, and no body to bury.',
  failureAfterimage: 'They counted until the light went and never made the numbers agree.',
  successAtCostAfterimage: 'They got the count. It took turning over faces they will keep seeing.',
  criticalSuccessAfterimage: 'They read the whole ground down to the drag-marks, and the drag-marks led away.',
  criticalFailureAfterimage: 'The count broke apart in their hands and took the rest of the ground with it.',
  /**
   * `successMetadata` fires on `isStepSuccess`, which counts `near_miss` — a
   * near miss got through, so the mark and the possession draw are correct
   * there.
   *
   * **This was `secret_discovery`, and the deferral that stood here was wrong.**
   * The draft recorded the target question as a cross-draft reconciliation with
   * `standing_the_line` — something row 4 could fix by declaring its action's
   * target as the crossing person. It cannot. `action.targetId` is set from
   * `sel.entry.targetAgentId ?? sel.entry.locationId`
   * (`phaseAgentDecision.ts:1059`), and `targetAgentId` is populated *only* by
   * `socialEncounterGeneration.ts`, for scenes aimed at an agent who already
   * exists. A `supportBundle` actor is materialized *using* the already-resolved
   * target as an input, so it can never be that target, and no template field
   * routes targeting through a cast key. The `?spawn=` route hard-codes
   * `targetId: locationId` (`debugEncounterTools.ts:434-440`), and the seeded
   * route copies the parent's own `targetId`, which is a location by the same
   * argument. So `action.targetId` was the location on every firing route,
   * `createSecretEdge` refuses a non-actor endpoint (`secretGeneration.ts`,
   * THR-1175), and the write always no-opped — green at `check:encounter`,
   * which passes on kind presence, and dead at runtime. That is the identical
   * shape this template already swapped the `thread` family away from, and it
   * should have been caught here rather than deferred.
   *
   * `hidden_mark` is the fix rather than a workaround. It carries its own
   * `targetAgentId`, a `SCENE_SENTINEL_FIELDS` member, so `$cast:survivor` binds
   * the person this scene actually cast and nothing depends on `action.targetId`
   * at all. It sits in the same `secret` family row as `secret_discovery`
   * (`consequenceDraw.ts`: `['hidden_mark', 'secret_discovery',
   * 'favor_creation']`), so the recorded draw stays satisfied, and in
   * `CHIP_BACKING_EFFECT_KINDS` (via `PERSISTENT_EFFECT_KINDS`), so
   * `short.the_unsaid` stays a backed chip.
   *
   * **Not a second copy of the `short.left_for_later` grant.** That mark carries
   * no target, so it falls through to the action's actor: it is what the *reader*
   * walks off carrying, and it exists only if the god spends on the card. This
   * one bears on the *survivor* — what the person who was already here is not
   * saying — and fires on any success. Different bearer, different fact,
   * different route. Same category and reveal family on purpose: both are
   * knowledge a later border scene can put in the open, and the family's
   * currency is exactly that.
   */
  successMetadata: {
    rewardPool: { categoryWeights: { possession: 1.0 } },
    effects: [
      {
        kind: 'hidden_mark',
        category: 'secret_knowledge',
        severity: 0.45,
        // Reads as a phrase somebody says out loud, because that is how the
        // `secret_knowledge` reveal table spends `{mark_label}`. Deliberately
        // the neutral fact — the mark fires on `success` and `near_miss` too,
        // where nothing says the missing one walked.
        label: 'the death on this ground with no body under it',
        revealFamilies: ['encounter.border'],
        targetAgentId: '$cast:survivor',
      },
    ],
  },
  /**
   * `failureMetadata` fires only on the two genuine failure bands. The grief
   * condition is reach-coherent: `trait.condition.grieving` carries
   * `domainContributions: { heart: -0.08, eye: -0.05 }`, so failing an `eye`
   * test leaves the agent measurably worse at the next one. Not authored on
   * the success side (design doc § 7.2) — a recovery there would make the
   * shift a tax on playing well rather than a consequence of the fiction.
   */
  failureMetadata: {
    effects: [
      { kind: 'condition_attachment', templateId: 'trait.condition.grieving' },
      { kind: 'quintessence_shift', delta: -0.06, source: 'one_body_short.count_that_will_not_close' },
    ],
  },
  nudges: STEP_0_HAND,
};

// ─── Aftermath ───────────────────────────────────────────────────
//
// Choice-less at the mortal level — the fork in this encounter belongs to the
// god (the two aftermath reactions), not the mortal. Bands hang off
// `fallback.byOutcome`. Reactions live on `fallback` so every band offers the
// same fork, except `success_at_cost`, which re-declares both stances because
// it is a SUCCESS_BANDS member and `applyAftermathOutcomeBand` substitutes
// reactions wholesale (design doc § 7.4).

export const ONE_BODY_SHORT_TEMPLATE: UnifiedActionTemplate = {
  id: 'encounter.border.one_body_short',
  rarityTier: 2,
  intrinsicTier: 'story_beat',
  name: 'One Body Short',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',

  steps: [step0ReadTheGround],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * `revelation_discretion` (Eye's own pair, Seeker <-> Sentinel) is the axis
   * the aftermath fork tilts — say the count out loud versus carry it alone;
   * `sacrifice_survival` (Star — Martyr <-> Survivor) is what the missing
   * body itself asks. Neither is a fork this template resolves — the mortal
   * makes none (design doc § 0 question 6) — they are the axes the scene
   * tilts, same reading as `THE_UNCLAIMED_RELIC_TEMPLATE`'s pair.
   */
  motivations: ['revelation_discretion', 'sacrifice_survival'],

  /**
   * Setting envelope (THR-884). Four declared classes, one opening each;
   * `locationSubtypes` derived via `expandSettings`, never hand-written.
   */
  settings: ['wayside', 'ruin', 'battlefield', 'stronghold'],
  openings: {
    wayside:
      'The road runs past a stand of thorn and a firepit kicked apart. Trampled ground leads off the track ' +
      'and into the open, where there is nothing to put your back against. It is cold enough to see breath. ' +
      'The air carries iron and wet horse. Crows have found the place and are working in from the edges.',
    ruin:
      'Half a wall still stands and the rest is floor plan — door sills opening onto nothing, a stair that ' +
      'ends in air. Ash and old mortar coat everything, and the fight has put fresh tracks through both. ' +
      'Sound carries oddly here; a stone turning over three rooms away arrives late. It smells of wet char.',
    battlefield:
      'This ground was fought over before and never cleaned up. Old iron comes up through the turf where ' +
      'the rain has worked at it, and the mounds are settled and grassed over. The new dead lie among them, ' +
      'still in their own shapes. Flies have already arrived. The wind comes across flat and does not stop.',
    stronghold:
      'The gate stands open with nobody on it. Inside, the yard is packed dirt and a horse trough gone ' +
      'still, and the walls throw the cold straight back down. Somewhere above, a door is banging in its ' +
      'frame and nobody is going up to stop it. The place smells of smoke that has already gone out.',
  },
  locationSubtypes: expandSettings(['wayside', 'ruin', 'battlefield', 'stronghold']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'The fight is over, and the road on does not start until the dead are accounted for. Nobody leaves ' +
      'ground like this without knowing who is on it.',
    success:
      'The dead are counted. What the count turns out to say is worse than a wrong number, and it is ' +
      'written down now.',
    failure:
      'The count will not close. The ground keeps its arithmetic to itself, and the road on starts with the ' +
      'question still open.',
  },

  /**
   * consequenceDraw is binding — `check:encounter` recomputes it from the
   * template id. The recorded hand carries one swap.
   */
  consequenceDraw: ['secret', 'omen'],
  consequenceSwap: {
    from: 'thread',
    to: 'omen',
    reason:
      'thread_* effects read `ascendantId`/`mortalId` as literal node ids; neither is a SCENE_SENTINEL_FIELDS ' +
      'member and the ascendant node id is minted per run, so no authorable literal exists. The write no-ops ' +
      'with `thread_mutation_skipped` while check:encounter passes on kind presence — a family that is green ' +
      'at the gate and dead at runtime. `omen` (weight 4 in eye) is also the better fiction: a death that did ' +
      'not stay dead is what the sky says is coming.',
  },

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The ground is counted and the count is written down. What is missing from it is missing from every account after this one.',
      changes: [],
      reactionPrompt: 'What does the god do with a count nobody else has heard?',
      reactions: [
        {
          id: 'short.say_the_count',
          label: 'Let them say the count out loud',
          intent: 'The account goes into the record, and the country starts hearing that its dead are not staying put.',
          effects: [
            {
              kind: 'emit_omen',
              category: 'cultural',
              intensity: 0.35,
              narrativeHook: 'A death was counted on the border with no body under it, and the telling has started.',
              scope: { kind: 'global' },
            },
            {
              kind: 'recent_event',
              eventType: 'narrative',
              message: 'They said the count out loud, and what was missing from it went into the record.',
            },
          ],
        },
        {
          id: 'short.carry_it_alone',
          label: 'Let them carry the count alone',
          intent: 'Nobody else hears it, so nobody else has to carry it.',
          effects: [
            { kind: 'quintessence_shift', delta: -0.04, source: 'one_body_short.carried_alone' },
            {
              kind: 'recent_event',
              eventType: 'narrative',
              message: 'They kept the count to themselves and walked on with it.',
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'The account closes on one death and no body for it, and on a set of marks leading off the place ' +
            'that nobody dragged. Whoever went down here got up and walked out. {cast:survivor} watched it ' +
            'happen and has not mentioned it since.',
          changes: [
            /**
             * The chip reports the `hidden_mark` on `successMetadata`, and every
             * field names that write: a mark on the survivor, invisible, that a
             * later `encounter.border` scene can surface. It used to report a
             * `knows_secret_of` edge, which never existed — see the note on
             * `successMetadata`. `$cast:survivor` is the same binding the write
             * uses, so anchor and write agree at the same endpoint (rule 0c),
             * and they now agree under `?spawn=` as well, where `$target`
             * resolved to a campsite.
             */
            {
              id: 'short.the_unsaid',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              title: 'What was not said',
              stateNoun: { text: 'a mark nobody can see', entityId: '$cast:survivor', visualKind: 'agent' },
              detail:
                '{cast:survivor} watched the missing one walk off this ground and told nobody. What is left on ' +
                '{cast:survivor} is a mark nobody can see, and a later road along the border can bring it up.',
              polarity: 'info',
              causeClause: 'Reading the drag-marks to their end',
              concepts: [{ text: 'a mark nobody can see', entityId: '$cast:survivor', visualKind: 'agent' }],
            },
          ],
        },
        success: {
          overview:
            'The account closes. The place where the missing one went down is as plain as the places that ' +
            'still have somebody lying in them, and it is empty. {cast:survivor} does not explain it, and is ' +
            'not asked to.',
          changes: [
            // Same chip, same write, minus the causeClause — they got the answer
            // without the drag-marks, so this band cannot claim them.
            {
              id: 'short.the_unsaid',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              title: 'What was not said',
              stateNoun: { text: 'a mark nobody can see', entityId: '$cast:survivor', visualKind: 'agent' },
              detail:
                '{cast:survivor} knows why one place on this ground is empty and did not say it. What is left on ' +
                '{cast:survivor} is a mark nobody can see, and a later road along the border can bring it up.',
              polarity: 'info',
              concepts: [{ text: 'a mark nobody can see', entityId: '$cast:survivor', visualKind: 'agent' }],
            },
          ],
        },
        success_at_cost: {
          overview:
            'The count is right. Getting it right meant looking at each of them long enough to be sure, one ' +
            'after another, and that is not work anybody puts down at the end of it.',
          changes: [
            {
              id: 'short.the_faces',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              title: 'The faces, kept',
              stateNoun: { text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' },
              detail: 'Turning over every face to be sure left them grieving, and it does not lift on the road.',
              polarity: 'loss',
              concepts: [{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }],
            },
          ],
          /**
           * `success_at_cost` is a SUCCESS_BANDS member, so `failureMetadata`
           * cannot fire here — the grieving condition is re-declared on this
           * band's own reactions instead (design doc § 7.4, a Law 56 fix, not
           * a flourish). `applyAftermathOutcomeBand` substitutes reactions
           * wholesale, so both stances are re-declared and both carry the
           * condition.
           */
          reactions: [
            {
              id: 'short.say_the_count',
              label: 'Let them say the count out loud',
              intent: 'The account goes into the record, and the country starts hearing that its dead are not staying put.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.grieving' },
                {
                  kind: 'emit_omen',
                  category: 'cultural',
                  intensity: 0.35,
                  narrativeHook: 'A death was counted on the border with no body under it, and the telling has started.',
                  scope: { kind: 'global' },
                },
                {
                  kind: 'recent_event',
                  eventType: 'narrative',
                  message: 'They said the count out loud, and what was missing from it went into the record.',
                },
              ],
            },
            {
              id: 'short.carry_it_alone',
              label: 'Let them carry the count alone',
              intent: 'Nobody else hears it, so nobody else has to carry it.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.grieving' },
                { kind: 'quintessence_shift', delta: -0.04, source: 'one_body_short.carried_alone' },
                {
                  kind: 'recent_event',
                  eventType: 'narrative',
                  message: 'They kept the count to themselves and walked on with it.',
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            'The count never agrees with itself. They walk off the ground holding a number that is wrong by ' +
            'one and cannot say which one, and there is nobody left here to ask. {cast:survivor} does not ' +
            'know either, and has stopped trying to guess.',
          changes: [
            {
              // `kind: 'trait'` because the chip anchors an *attachment* node
              // (`stateNoun.entityId: 'trait.condition.grieving'`,
              // `visualKind: 'attachment'`) — the same form both proved
              // siblings use (`standing-the-line.ts:1002`,
              // `the-sign-over-the-ruin.ts:731`). It was `shell_state`, which
              // is the kind for a state on the shell with no attachment node
              // behind it (`short.something_gave` below is correctly that).
              // The mis-declaration was not cosmetic: `classifyChangeKind`
              // renders `shell_state`+loss as a **toll** rather than a
              // **wound** (`buildAftermathConsequences.ts:403-421`), and
              // `buildEncounterAftermathOverview` counts it among *hooks*
              // rather than traits (`unifiedActionResolution.ts:779-782`), so
              // the shell reported a toll and a hook while the agent walked
              // off carrying a live `grieving` edge. It also made the change
              // contribute to no system connection at all in
              // `systemsOfChange`, which is what Stage 4 read as an unapplied
              // condition. Backing write: step 0 `failureMetadata`
              // `condition_attachment` — traced live at
              // `condition_attachment[0]: trait.condition.grieving →
              // asc.archetype.chaos_0 ×1`.
              id: 'short.grief_without_a_grave',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              title: 'Grief without a grave',
              stateNoun: { text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' },
              detail: 'A death they could not account for left them grieving, with no body to put it on.',
              polarity: 'loss',
              concepts: [{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }],
            },
          ],
        },
        critical_failure: {
          overview:
            'The ground stops making sense under them. Every pass changes the number, and by the last one ' +
            'they are counting the same body twice to make it come out. {cast:survivor} takes them by the ' +
            'arm and walks them off it. The count is never made.',
          changes: [
            {
              // `kind: 'trait'` because the chip anchors an *attachment* node
              // (`stateNoun.entityId: 'trait.condition.grieving'`,
              // `visualKind: 'attachment'`) — the same form both proved
              // siblings use (`standing-the-line.ts:1002`,
              // `the-sign-over-the-ruin.ts:731`). It was `shell_state`, which
              // is the kind for a state on the shell with no attachment node
              // behind it (`short.something_gave` below is correctly that).
              // The mis-declaration was not cosmetic: `classifyChangeKind`
              // renders `shell_state`+loss as a **toll** rather than a
              // **wound** (`buildAftermathConsequences.ts:403-421`), and
              // `buildEncounterAftermathOverview` counts it among *hooks*
              // rather than traits (`unifiedActionResolution.ts:779-782`), so
              // the shell reported a toll and a hook while the agent walked
              // off carrying a live `grieving` edge. It also made the change
              // contribute to no system connection at all in
              // `systemsOfChange`, which is what Stage 4 read as an unapplied
              // condition. Backing write: step 0 `failureMetadata`
              // `condition_attachment` — traced live at
              // `condition_attachment[0]: trait.condition.grieving →
              // asc.archetype.chaos_0 ×1`.
              id: 'short.grief_without_a_grave',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              title: 'Grief without a grave',
              stateNoun: { text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' },
              detail: 'A death they could not account for left them grieving, with no body to put it on.',
              polarity: 'loss',
              concepts: [{ text: 'grieving', entityId: 'trait.condition.grieving', visualKind: 'attachment' }],
            },
            {
              id: 'short.something_gave',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              title: 'Worn through',
              stateNoun: { text: 'quintessence', entityId: '$actor', visualKind: 'agent' },
              detail: 'Counting ground that would not stay counted wore at their quintessence.',
              polarity: 'loss',
              causeClause: 'Three passes over the same ground and three different numbers',
              concepts: [{ text: 'quintessence', entityId: '$actor', visualKind: 'agent' }],
            },
          ],
        },
      },
    },
  },

  description:
    'A single-step reading: a fight already over, a ground that has to be accounted for, and a count that ' +
    'comes out one short.',
};
