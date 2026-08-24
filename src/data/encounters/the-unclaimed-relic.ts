/**
 * The Unclaimed Relic — a single-step `stone` endurance test: a relic sitting in
 * the open, a cold with a radius that has stopped everyone else from carrying it
 * out, and one other claimant working up to a second try.
 *
 * Batch: border-perils (THR-1221), row 3. Encounter Factory v3, nudge-native,
 * THR-1045 Composition Contract — no exemptions, even at one step.
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
import { expandSettings } from '../settingClasses';

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
    name: 'A Little More',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You steady them at the point where effort usually gives out, so the last of it counts. A small help.',
    fiction: 'Most things fail by a margin.',
    bandProse: {
      success: 'The last of the strength was there when it was asked for.',
      failure: 'The steadying held right up until their hands stopped answering.',
    },
  },
  {
    // Type: Cache — sphere-keyed (matter), the type's corpus debut. Grants a
    // real, live REWARD_POSSESSIONS attachment: the ring of dropped gear made
    // usable.
    id: 'relic.left_behind',
    libraryCardId: 'card.cache.signature.matter',
    name: 'Left Behind',
    sphere: 'matter',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.matter',
    effectLine:
      'You turn up what an earlier hand set down and never came back for, and put it where they will find it. A real help, and it stays theirs after.',
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
    name: 'By The Book',
    sphere: 'order',
    essenceCost: 3,
    forecastDelta: 0.04,
    rider: 'floor_at_cost',
    imageTag: 'generic.ward',
    effectLine:
      'However badly it goes, they come away holding what they came for. The price, if it comes due, is paid in skin and in gear.',
    fiction: 'Rules exist so the worst case has a name.',
    bandProse: {
      success_at_cost: 'The floor had been bought before they reached in. The cost came off their hands.',
      critical_failure: 'A bought floor still needs a hand to stand on it, and both of theirs had stopped.',
    },
  },
  {
    // Type: Undertow — sphere-keyed (darkness), big delta (>= NUDGE_BIG_DELTA),
    // so both failure bands are owed. valueDrift, not poleLean: this step
    // never forks, and poleLean moves nothing when a step does not fork.
    id: 'relic.the_easier_way',
    libraryCardId: 'card.undertow.signature.darkness',
    name: 'The Easier Way',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.16,
    valueDrift: { axis: 'asceticism_extravagance', toward: 'negative' },
    imageTag: 'generic.dark',
    effectLine:
      'You let the wanting run out ahead of the caution, so they hold on past the point they would have let go. A strong help, and they will want the next thing this badly too.',
    fiction: 'It works. That is the problem.',
    bandProse: {
      critical_success: 'They held on past every reason to stop, and it came free in their hands.',
      failure: 'Wanting it did not warm their fingers. They let go a long time after they should have.',
      critical_failure: 'They would not let go, and the cold went up their arms and put them on the ground.',
    },
  },
  {
    // Type: Balm — sphere-keyed (life). Lifts the fear the ring is evidence
    // of, through the existing remove_condition door.
    id: 'relic.it_passes',
    libraryCardId: 'card.balm.signature.life',
    name: 'It Passes',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.05,
    imageTag: 'generic.warmth',
    effectLine:
      'The fear goes out of them before they reach in, and does not come back while they work. A faint help, and it stays gone after.',
    fiction: 'Most suffering ends. This one ends sooner.',
    grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.terrified' }],
    bandProse: {
      success: 'They took their time about it, unhurried, and time was what it needed.',
      near_miss: 'The fear stayed gone. Their hands went before their nerve did.',
      failure: 'Fear never entered it. The cold did not need help.',
    },
  },
  {
    // Type: Boost — sphere-keyed (energy), the second and last Boost. Buys a
    // burst against the specific opposition (heat, aimed at cold) rather than
    // duration, which is what the core Boost buys — same verb, different
    // physics.
    id: 'relic.a_sudden_surge',
    libraryCardId: 'card.boost.signature.energy',
    name: 'A Sudden Surge',
    sphere: 'energy',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.energy',
    effectLine:
      'You drive a hard pulse of heat through them at the moment it is needed, so the body answers instead of stalling. A real help.',
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
  // The setting-neutral spine. The declared opening lands above this at
  // instantiation (the converter compiles `openings` onto the reserved
  // `opening` fragment slot). Order: relic -> the cold -> the ring of dropped
  // gear -> the other claimant. The claimant is introduced here, in the
  // setting-neutral spine, before any later prose refers to them.
  narrativeTemplate:
    'The relic sits where it was left: black iron, the size of a loaf. The air around it pulls the heat out ' +
    'of a hand in about ten counts. Packs and a dropped boot lie in a rough ring three paces out. Someone ' +
    'else is already here, waiting at that ring, chafing warmth back into both hands.',
  successAfterimage: 'They got it up and got clear, hands dead to the wrist.',
  failureAfterimage: 'Their grip opened before the count ran out, and the relic dropped back into its own frost.',
  successAtCostAfterimage: 'They came out with it and left skin on the iron.',
  criticalSuccessAfterimage: 'They lifted it clean and walked out of the cold with it under one arm.',
  criticalFailureAfterimage: 'They went down beside it, and the cold had them until the other one hauled them clear.',
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

export const THE_UNCLAIMED_RELIC_TEMPLATE: UnifiedActionTemplate = {
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
  openings: {
    wayside:
      'A cart track runs out here into scrub and stops at a hollow where people have camped for years. Old ' +
      'fire-scars, a windbreak of piled thorn. The wind carries dust and dry sage across it. Nothing has ' +
      'been burned in the pit for a long while, and the thorn wall has gone grey.',
    ruin:
      'Half a hall stands, roof long gone, the floor under a mat of frost-burnt grass. Rooks argue on the ' +
      'wall-heads and will not come lower. The stone holds none of the afternoon in it, and a steady ' +
      'draught crosses the doorway at ankle height.',
    battlefield:
      'The field slopes down to a ditch that was dug in a hurry and filled in worse. Crows work the far end ' +
      'of it. The ground gives underfoot, soft with a season of rain, and the smell that comes up is wet ' +
      'clay and old rot.',
    stronghold:
      "The fort's yard is swept and the gate is manned. This corner is used by nobody. Someone chalked a " +
      'line across the flags and nothing crosses it — the boots on the wall walk come that far and turn ' +
      'back, and the sweepings pile against the chalk. The flags inside the line are cold through a boot sole.',
  },
  locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield']),

  traitVariants: TRAIT_VARIANTS,

  narrativeTemplates: {
    initiation:
      'Nobody who has come here has carried it out. That is the whole of what is known about it. Take it ' +
      'and it is theirs, to sell or to keep. Leave it, and the road is a road again by nightfall and the ' +
      'relic waits for whoever comes next.',
    success:
      'The cold gave it up. It came out of the ring in a pair of hands that will not close properly until ' +
      'evening.',
    failure:
      'The cold won the argument. The relic sits where it sat, and there is one more pair of hands that ' +
      'could not hold it.',
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
      overview: 'The cold has not moved. It will be here tomorrow, and the day after, and it will be exactly this cold.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview:
            '{cast:claimant} has not moved from the ring, and asks, plainly, how it was done. The frost holds the ' +
            'shape it sat in, a clean black circle the other claimant will not step into.',
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
              title: 'Two who were there',
              causeClause: 'The answer was given at the ring instead of kept',
              detail: '{cast:claimant} thinks better of them for it, and says so.',
              stateNoun: { text: 'a bond warmed', entityId: '$cast:claimant', visualKind: 'agent' },
              concepts: [{ text: 'bond' }],
            },
          ],
          reactions: [
            {
              id: 'relic.tell_them_how',
              label: 'Let them be told how',
              intent: 'The answer is given at the ring, hands still numb, and taken well.',
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
            'Their hands stayed shut for an hour afterwards, and the other claimant worked the fingers open one ' +
            'at a time. That is a story now, and it will be told at the next fire.',
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
              title: 'Word about this place',
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
              intent: 'The telling is not muddied, and by morning the place has visitors.',
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
            'The iron kept a strip off both palms, and it did not bleed until the warmth came back. The other ' +
            'claimant is already going through the dropped packs for a clean rag.',
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
              title: 'Hands that will not close',
              causeClause: 'Both palms came off the iron raw',
              detail: '{actor} is carrying a wound that will make a fist an argument for a while.',
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
            'Their own pack is on the ground now, three paces out, in the ring with the others. The other ' +
            'claimant did not remark on it, and that was decent.',
          changes: [
            {
              id: 'relic.fail.the_fear_stayed',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'What did not let go',
              causeClause: 'Their hands opened before the cold did',
              detail: '{actor} is carrying the fright out of here with them, and it will be a couple of days before it goes.',
              stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'fright', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
            },
            {
              id: 'relic.fail.two_who_failed',
              kind: 'growth',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              title: 'Two who failed at it',
              causeClause: 'They failed at the same thing in front of each other',
              detail: '{cast:claimant} counts them as a known quantity now.',
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
            '{cast:claimant} swore about it the whole way out, and was still swearing when the arms came ' +
            'unlocked. Afterwards the ring got a stride wider, and the two of them kept opposite sides of it.',
          changes: [
            {
              id: 'relic.crit_fail.the_fear_stayed',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'What did not let go',
              causeClause: 'They had to be dragged clear of it',
              detail: '{actor} is carrying the fright out of here with them, and it will be a couple of days before it goes.',
              stateNoun: { text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' },
              concepts: [{ text: 'fright', entityId: 'trait.condition.terrified', visualKind: 'attachment' }],
            },
            {
              id: 'relic.crit_fail.held_off',
              kind: 'growth',
              category: 'bond',
              direction: 'loss',
              polarity: 'loss',
              title: 'Hauled out, and held off',
              causeClause: 'A stranger had to put hands on them to get them out',
              detail: '{cast:claimant} pulled them out and has kept a stride between them since.',
              stateNoun: { text: 'a bond soured', entityId: '$cast:claimant', visualKind: 'agent' },
              concepts: [{ text: 'bond' }],
            },
          ],
          reactions: [
            {
              id: 'relic.let_the_distance_stand',
              label: 'Let the distance stand',
              intent: 'The thanks does not get said, and the ring stays a stride wider.',
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
    'A single-step recovery: a relic in the open, a cold that has stopped everyone else, and one other ' +
    'person still working up to a second try.',
};
