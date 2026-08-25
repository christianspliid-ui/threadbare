/**
 * The Unclaimed Relic — a single-step `stone` endurance test: a freezing relic
 * in the open, everyone who tried to carry it out frostbitten, and one other
 * claimant waiting to try again.
 *
 * Batch: border-perils (THR-1221), row 3. Encounter Factory v3, nudge-native,
 * THR-1045 Composition Contract — no exemptions, even at one step.
 *
 * ── Prose Doctrine v2 (THR-1223 batch 1 — THE CALIBRATION CASE) ──
 * Rewritten 2026-08-25 in narrator mode, approved by the director in chat with
 * two corrections that now bind the whole rewrite: (a) rewrite from scratch in
 * basic game-master language — "clever specificity" (measured counts, paces,
 * writerly participles) is the residue tell of the old mode; (b) a card's
 * effect line never repeats a word from the card's name.
 * Stake shape (Seed Dice, die 1): Opportunity + Contest.
 *
 * Narrator's checklist (12 questions), answered:
 *  1. P1 arrival with {name} and the place, one per setting class — yes.
 *  2. P2 states the find and the cost already paid (frostbitten hands,
 *     dropped relic) — yes.
 *  3. P3 lands Opportunity + Contest, compounded on purpose — yes.
 *  4. Opening ≤80 words with any P1 (~66) — yes.
 *  5. Every sentence a narrator's report; no interior sensation, no camera —
 *     yes.
 *  6. Facts stated, never encoded (the chalk line and sweepings are gone) —
 *     yes.
 *  7. Every sentence serves challenge (the cold) / test (stone) / outcome
 *     (relic or frostbite) — yes.
 *  8. Nothing referenced before introduction; the claimant enters in the
 *     spine — yes.
 *  9. One named person on stage: {cast:claimant} — yes.
 * 10. Stake in one sentence: carry it out and keep it, or drop it frostbitten
 *     — yes.
 * 11. Cards named imperative verb+noun; effect lines are game effects; no
 *     name-word repetition — yes.
 * 12. All four declared classes have a skeleton opening — yes.
 *
 * Design doc: `Docs/plans/encounters/the-unclaimed-relic-final.md`
 * Systems audit: `Docs/plans/encounters/the-unclaimed-relic-systems.md`
 * Package critique: `Docs/plans/encounters/the-unclaimed-relic-package.md`
 *
 * `spawn_artifact` is deliberately category-only — no `templateId`, no `tier`.
 * `ARTIFACT_TEMPLATES` holds exactly three tier-4 legendaries, so naming one
 * here would either fail the liveness gate or hand a rarity-1 open-draw
 * encounter a cosmic artifact. A category-only spawn is the gate's own
 * documented no-rot shape (`nudgeGrantLiveness.ts:116-119`) with shipped
 * precedent in `vertical-slice.ts`. Leaving `tier` unset resolves
 * `effect.tier ?? 'common'` in `encounterAftermath.ts`, which takes a
 * `possesses` edge — exactly the rarity-1 outcome this encounter wants. Do not
 * add a `templateId` or a `tier` here.
 */

import type { ActionStep, StepNudge, TraitVariant, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { EncounterSupportActorSpec, EncounterSupportBundle } from '../../types/encounter';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Support Bundle ──────────────────────────────────────────────

const claimantSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'claimant',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['scout', 'ranger', 'mercenary'],
  supportRole: 'rival_claimant',
  spawnNpcRole: 'scout',
  spawnName: 'Orin Vask',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [claimantSpec];

// ─── The trait hook ──────────────────────────────────────────────

/**
 * `trait.core.core_humility.vice` — the "Proud" pole of Core humility. Built by
 * `CORE_TRAIT_DEFINITIONS` from `coreRegistry.ts:151`; a seeded definition, so
 * `validateTraitRefs()` does not report it dead. No gate, no trait-only card —
 * the batch's card-type budget for this hand allocates `trait_card` to other
 * rows, so the variant carries no `addNudgeIds`.
 */
const RELIC_TRAIT_REF = 'trait.core.core_humility.vice';

const TRAIT_VARIANTS: readonly TraitVariant[] = [
  {
    traitId: RELIC_TRAIT_REF,
    forecastDelta: 0.04,
    difficultyDelta: -0.02,
    factorLine: 'Being Proud, they will not leave what others could not carry.',
  },
];

// ─── The hand (6 cards, one nudge-bearing step) ─────────────────────
//
// Budget: cache (corpus debut), insurance, boost (x2), undertow, balm — the
// five types the batch design allocates to this row. 5 distinct types, 5
// distinct spheres (matter, order, darkness, life, energy), 1 ungated common
// option (the core Boost), 1 rider (Insurance's floor_at_cost). Every card
// carries libraryCardId and pays off in at least one failure band; the
// Undertow (0.16, >= NUDGE_BIG_DELTA) carries both failure and
// critical_failure.

const STEP_0_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — universal core, the hand's ungated common option.
    id: 'relic.a_little_more',
    libraryCardId: 'card.boost.core',
    name: 'Steady Grip',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine: 'Strengthen their hands — they hold on long after their strength should fail.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success: 'Their grip held to the end.',
      failure: 'The steadying held until the last moment — then their hands gave out anyway.',
    },
  },
  {
    // Type: Cache — sphere-keyed (matter), the type's corpus debut. Grants a
    // real, live REWARD_POSSESSIONS attachment: the ring of dropped gear made
    // usable.
    id: 'relic.left_behind',
    libraryCardId: 'card.cache.signature.matter',
    name: 'Uncover Cache',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.matter',
    effectLine: 'Reveal abandoned gear nearby — iron tongs they can use and keep.',
    fiction: 'Matter keeps its promises longer than people do.',
    grants: [
      {
        kind: 'attachment_grant',
        templateId: 'reward_tools_instruments_iron_tongs',
        targetAgentId: '$actor',
      },
    ],
    bandProse: {
      near_miss: 'The tongs closed on it and held. Their arms did not.',
      failure: 'The tongs came away with frost welded along the jaws, and would not open again until evening.',
    },
  },
  {
    // Type: Insurance — sphere-keyed (order), this hand's ONE rider.
    // Justification: order's signature buys the floor rather than the
    // ceiling, priced at the hand's essence ceiling because it converts both
    // plain failure bands into a paid arrival. The failure-texture fragment
    // sits on critical_failure — the only failure band floor_at_cost leaves
    // reachable while the card is active.
    id: 'relic.by_the_book',
    libraryCardId: 'card.insurance.signature.order',
    name: 'Bind Outcome',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'floor_at_cost',
    imageTag: 'generic.ward',
    effectLine: 'Guarantee success — they will carry the relic out, but pay for it in skin and gear.',
    fiction: 'Rules exist so the worst case has a name.',
    bandProse: {
      success_at_cost: 'The bargain held: they have the relic, and the price came out of their hands.',
      critical_failure: 'Even a bound outcome needs working hands, and both of theirs had failed.',
    },
  },
  {
    // Type: Undertow — sphere-keyed (darkness), big delta (>= NUDGE_BIG_DELTA),
    // so both failure bands are owed. valueDrift, not poleLean: this step
    // never forks, and poleLean moves nothing when a step does not fork.
    id: 'relic.the_easier_way',
    libraryCardId: 'card.undertow.signature.darkness',
    name: 'Feed Greed',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.16,
    valueDrift: { axis: 'asceticism_extravagance', toward: 'negative' },
    imageTag: 'generic.dark',
    effectLine: 'Fill them with hunger for the prize — they will not let go, even when they should.',
    fiction: 'It works. That is the problem.',
    bandProse: {
      critical_success: 'They held on past every reason to stop, and it came free in their hands.',
      failure: 'The hunger made them hold on too long, and the cold won anyway.',
      critical_failure: 'They would not let go, and the cold went up their arms and put them on the ground.',
    },
  },
  {
    // Type: Balm — sphere-keyed (life). Lifts the fear the ring is evidence
    // of, through the existing remove_condition door.
    id: 'relic.it_passes',
    libraryCardId: 'card.balm.signature.life',
    name: 'Banish Fear',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.warmth',
    effectLine: 'Grant them calm — they reach in unafraid and stay that way.',
    fiction: 'Most suffering ends. This one ends sooner.',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.terrified' }],
    bandProse: {
      success: 'They worked calmly and without hurry, and it was enough.',
      near_miss: 'The fear stayed gone. Their hands failed before their nerve did.',
      failure: 'They stayed calm the whole time. The cold beat them anyway.',
    },
  },
  {
    // Type: Boost — sphere-keyed (energy), the second and last Boost. Buys a
    // burst against the specific opposition (heat, aimed at cold) rather than
    // duration, which is what the core Boost buys — same verb, different
    // physics.
    id: 'relic.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'Kindle Blood',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.energy',
    effectLine: 'Send a surge of heat through their body — the cold cannot stall them.',
    fiction: 'Bodies hold more than they admit.',
    bandProse: {
      critical_success: 'The heat arrived, and they worked as if the cold had never touched them.',
      success_at_cost: 'The surge carried them through and left them shaking on the far side of it.',
      failure: 'The heat came and went. The cold was still there when it had gone.',
    },
  },
];

// ─── The step ────────────────────────────────────────────────────

/**
 * The one step. Reach `stone`, difficulty 0.42 -> `fair`, inside the open-draw
 * ceiling (NUDGE_OFF_REACH_MAX_DIFFICULTY, 0.45). No authored factorLines
 * (THR-892) — everything an earlier draft wanted to list reads identically on
 * every run, so it is priced into the difficulty and carried by the prose.
 *
 * failBehavior: fail_action — a single-step encounter, so a failed reach ends
 * it.
 */
const step0HoldOnToIt: ActionStep = {
  reach: 'stone',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Hold on to it',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  // The setting-neutral P2+P3 spine. The per-class P1 arrival lands above this
  // at instantiation (the converter compiles `openings` onto the reserved
  // `opening` fragment slot). The claimant is introduced here, before any
  // later prose refers to them.
  narrativeTemplate:
    'There {they} find a magic relic lying in the open: black iron, freezing cold. Everyone who tried to ' +
    'carry it away got frostbitten hands and dropped it. No one dares to touch it now.\n\n' +
    'The relic is unclaimed — whoever carries it out may keep it. Another treasure hunter, {cast:claimant}, ' +
    'is waiting nearby, ready to try again.',
  successAfterimage: 'They carried it out. Their hands are numb to the wrist.',
  failureAfterimage: 'Their grip failed and the relic dropped back into the frost.',
  successAtCostAfterimage: 'They came out with it and left skin on the iron.',
  criticalSuccessAfterimage: 'They lifted it clean and walked out of the cold with it under one arm.',
  criticalFailureAfterimage: 'They collapsed beside it, and the other claimant hauled them clear.',
  /**
   * `successMetadata` fires on `isStepSuccess`, which counts `near_miss` as a
   * success — so the prize rides every success-side band, unconditionally
   * backed (Law 56) rather than gated behind a particular reaction pick.
   */
  successMetadata: {
    effects: [
      {
        kind: 'spawn_artifact',
        category: 'relic',
        nameOverride: 'The Cold Reliquary',
        targetAgentId: '$actor',
        tags: ['#stone', '#relic', '#ancient'],
        messageOverride: 'The Cold Reliquary has left the place that kept it.',
      },
    ],
  },
  /** `failureMetadata` fires only on the two genuine failure bands. */
  failureMetadata: {
    effects: [
      {
        kind: 'apply_condition',
        conditionTraitId: 'trait.condition.terrified',
        durationTicks: 24, // two in-game days at 12 ticks/day
      },
    ],
  },
  nudges: STEP_0_HAND,
};

// ─── Aftermath ───────────────────────────────────────────────────
//
// Choice-less, so the five bands hang off `fallback.byOutcome`. No
// variant-level `changes` — every chip is band-scoped, so every chip is
// backed by a write that fires on the band it renders on (Law 56). One
// reaction per band, which is the only structure under which every chip is
// unconditionally backed: `AftermathOutcomeOverride.changes`/`reactions` are
// independent optional siblings, so a band's chips render regardless of which
// of its (here, exactly one) reactions the player picks.

export const THE_UNCLAIMED_RELIC_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope({
  id: 'encounter.border.the_unclaimed_relic',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Unclaimed Relic',
  reach: 'stone',
  crudType: 'read',
  scale: 'local',

  steps: [step0HoldOnToIt],

  apCost: 1,
  actorAffinities: ['individual'],

  /**
   * `asceticism_extravagance` (Mender <-> Magnate) is what the relic is worth
   * to them and the axis the Undertow drags; `preservation_transformation` is
   * Stone's own pair and the axis of whether a thing left in the ground
   * should be left there. Neither is a fork — this encounter has none — they
   * are the axes the scene tilts.
   */
  motivations: ['asceticism_extravagance', 'preservation_transformation'],

  /**
   * Setting envelope (THR-884). Four declared classes, one opening each;
   * `locationSubtypes` is derived via `expandSettings`, never hand-written.
   * A four-class envelope inherits no family default support bundle (THR-1044),
   * so this template declares its own — class-honest at all four classes,
   * checked against the shipped `LOCATION_ROLE_ROSTERS` defaults (§ 11 of the
   * design doc).
   */
  settings: ['stronghold', 'ruin', 'wayside', 'battlefield'],
  // P1 arrival, one per class — the P2/P3 spine lands below it (narrativeTemplate).
  openings: {
    wayside: '{name} stops to rest at {location}, an old camp off the cart track.',
    ruin: 'Travelling through the hills, {name} stops to shelter in the ruins of {location}.',
    battlefield: 'The shortest road runs across the old battlefield at {location}, and {name} takes it.',
    stronghold: '{name} arrives at the fortress of {location} at break of dawn.',
  },
  locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'Take the relic and it is theirs to keep or sell. Leave it, and someone else will claim it. The only ' +
      'guard it has is the cold.',
    success:
      '{name} carried the relic out. Their frozen hands will not close properly until evening.',
    failure:
      '{name} could not hold on and dropped the relic. It lies where it lay, and no one has claimed it.',
  },

  /**
   * consequenceDraw is binding — `check:encounter` recomputes it from the
   * template id. `relationship` is wired by `bond_change` (four of the five
   * bands); `possession` is wired by `spawn_artifact` (step success). No
   * `consequenceSwap` — both drawn families wire in context without one.
   */
  consequenceDraw: ['relationship', 'possession'],

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The relic lies where it lay, as cold as ever.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview:
            '{actor} lifted the relic out clean on the first try. {cast:claimant} watched it happen and asks how ' +
            'it was done.',
          changes: [
            {
              id: 'relic.crit.prize',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Cold Reliquary',
              causeClause: 'Lifted out clean on the first reach',
              detail: "The Cold Reliquary is in {actor}'s possessions now — black iron, and still cold to hold.",
              stateNoun: { text: 'the relic in their possessions', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'The Cold Reliquary' }],
            },
            {
              id: 'relic.crit.told_them_how',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Respect Earned',
              causeClause: 'They told the other claimant how it was done',
              detail: '{cast:claimant} thinks better of them for it, and says so.',
              stateNoun: { text: 'a bond warmed', entityId: '$cast:claimant', visualKind: 'agent' },
              concepts: [{ text: 'bond' }],
            },
          ],
          reactions: [
            {
              id: 'relic.tell_them_how',
              label: 'Let them be told how',
              intent: 'The secret is shared, and taken well.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:claimant',
                  sentimentDelta: 0.2,
                  trustDelta: 0.1,
                },
              ],
            },
          ],
        },
        success: {
          overview:
            '{actor} carried the relic out on the third try, hands frozen shut for an hour after. ' +
            '{cast:claimant} saw all of it and will tell the story.',
          changes: [
            {
              id: 'relic.success.prize',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Cold Reliquary',
              causeClause: 'It came out of the ring on the third try',
              detail: "The Cold Reliquary is in {actor}'s possessions now — black iron, and still cold to hold.",
              stateNoun: { text: 'the relic in their possessions', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'The Cold Reliquary' }],
            },
            {
              id: 'relic.success.watched_ground',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'The Place Is Watched',
              causeClause: 'It was taken in front of a witness who will not keep quiet',
              detail:
                '{target} is under watch now: people come to see whether there is a second one, and quiet work ' +
                'here is seen.',
              // THR-1172 — `visualKind: 'location'` makes this a live click, not merely a
              // legal name: the chip draws the place's tile and opens its profile. Added
              // 2026-08-24 after the anchor catalog was found to hard-code the pre-THR-1172
              // claim that no such member existed; this chip's first pass followed the
              // catalog and omitted it, which left it rendering a tier below its sibling in
              // the same batch.
              stateNoun: { text: 'a place under watch', entityId: '$target', visualKind: 'location' },
              concepts: [
                { text: 'under watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' },
              ],
            },
          ],
          reactions: [
            {
              id: 'relic.let_the_word_travel',
              label: 'Let the word travel',
              intent: 'The story spreads, and by morning the place has visitors.',
              effects: [
                {
                  kind: 'condition_attachment',
                  templateId: 'trait.condition.location.under_watch',
                  targetLocationId: '$target',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            '{actor} carried it out, but the frozen iron took skin off both palms. {cast:claimant} is looking ' +
            'for a clean rag among the dropped packs.',
          changes: [
            {
              id: 'relic.cost.prize',
              kind: 'item',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              title: 'The Cold Reliquary',
              causeClause: 'It came out, and the iron kept what it touched',
              detail: "The Cold Reliquary is in {actor}'s possessions now — black iron, and still cold to hold.",
              stateNoun: { text: 'the relic in their possessions', entityId: '$actor', visualKind: 'agent' },
              concepts: [{ text: 'The Cold Reliquary' }],
            },
            {
              id: 'relic.cost.left_skin',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Wounded Hands',
              causeClause: 'Both palms came off the iron raw',
              detail: '{actor} is wounded — gripping anything will hurt for a while.',
              stateNoun: { text: 'Wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' },
              concepts: [{ text: 'wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }],
            },
          ],
          reactions: [
            {
              id: 'relic.let_them_feel_it',
              label: 'Let them feel it',
              intent: 'The pain is not dulled. The hands get wrapped at the ring and the road waits an hour.',
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
            '{actor} could not hold on and dropped the relic. {cast:claimant} saw it happen and said nothing.',
          changes: [
            {
              id: 'relic.fail.the_fear_stayed',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Lasting Fright',
              causeClause: 'Their hands gave out before they got clear',
              detail: '{actor} is left badly shaken. It will pass in a couple of days.',
              stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'fright', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
            },
            {
              id: 'relic.fail.two_who_failed',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Shared Failure',
              causeClause: 'They failed at the same thing in front of each other',
              detail: '{cast:claimant} knows them now, and thinks no less of them.',
              stateNoun: { text: 'a bond warmed', entityId: '$cast:claimant', visualKind: 'agent' },
              concepts: [{ text: 'bond' }],
            },
          ],
          reactions: [
            {
              id: 'relic.let_them_share_a_fire',
              label: 'Let them share a fire',
              intent: 'The two of them sit down out of the cold and say little.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:claimant',
                  sentimentDelta: 0.15,
                  trustDelta: 0.1,
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            '{actor} would not let go and collapsed in the cold. {cast:claimant} dragged them clear, swearing ' +
            'the whole time. The two keep their distance now.',
          changes: [
            {
              id: 'relic.crit_fail.the_fear_stayed',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Lasting Fright',
              causeClause: 'They had to be dragged clear of it',
              detail: '{actor} is left badly shaken. It will pass in a couple of days.',
              stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'fright', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
            },
            {
              id: 'relic.crit_fail.held_off',
              kind: 'growth',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              title: 'Kept at a Distance',
              causeClause: 'A stranger had to drag them out of the cold',
              detail: '{cast:claimant} pulled them out, and has kept their distance since.',
              stateNoun: { text: 'a bond soured', entityId: '$cast:claimant', visualKind: 'agent' },
              concepts: [{ text: 'bond' }],
            },
          ],
          reactions: [
            {
              id: 'relic.let_the_distance_stand',
              label: 'Let the distance stand',
              intent: 'No thanks is said, and the distance stays.',
              effects: [
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:claimant',
                  sentimentDelta: -0.12,
                  trustDelta: -0.05,
                },
              ],
            },
          ],
        },
      },
    },
  },

  description:
    'A single-step recovery: a freezing relic in the open, everyone before them frostbitten, and a rival ' +
    'claimant waiting to try again.',
});
