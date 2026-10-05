/**
 * The Well Sinking — slot 5 of journeyman-everyday-2 (THR-1677), the batch's
 * appointment floor. Two-step stone encounter: sink a shaft through ground full of
 * old unmarked workings, then line it before the night's rain brings the sides in.
 * On a lined well the reeve owes the second half of the fee, paid AT THE WELL on
 * the day its water runs clear — an `encounter_seed` carrying an `appointment`
 * block (THR-1479), so the spine may name the place and the day (prose rule 7b's
 * one lawful exception).
 * 
 * Brief: `Docs/plans/encounters/journeyman-everyday-2-brief.md`.
 * plotHookTaken: hook.mad_artificer — an old digger sank shafts under this plot
 * for years, alone, and marked none of them; his unsupervised work is what makes
 * the ground bad. No magic. The other two rolled hooks were set aside:
 * `political_labyrinth` would turn a craft test into a round of petitions, and
 * `impossible_choice` has no second thing worth keeping in a well contract.
 * Seed dice: p3 unmitigated risk (the old shafts; nobody can make the ground
 * safe) · opposition rival agent (orders) — a well-wright sinking the lord's well
 * on the next plot on the lord's orders, both shafts drawing on one spring ·
 * disposition friendly (the wright warns them of the rain, and may pass stone
 * over) · agentRole trespasser, read as the outsider sinking a well beside the
 * lord's own on the lord's spring · scale company.
 * 
 * ─── The narrator's 12 questions, answered ───────────────────────────
 *   1 P1 arrival?      Yes, per class: `{actor}` comes into / arrives in
 *                      `{location}` to sink the well the village (rural) or one
 *                      of its streets (urban) has paid for. Graph names only.
 *   2 P2 events?       The old well has gone foul; half the fee is already paid;
 *                      the plot sits over old unmarked shafts. Costs already paid.
 *   3 P3 one stake?    Unmitigated risk: break into an old shaft and it caves,
 *                      and the advance is lost.
 *   4 ≤80 words?       Opening + spine: 78 (rural) / 78 (urban).
 *   5 Read aloud?      Every sentence is a report; no interior sensation.
 *   6 Stated, never encoded? 'marked none', 'it caves in' are said outright.
 *   7 Every sentence works? Each is the challenge, the test, or the outcome.
 *   8 Nothing unintroduced? The reeve, the old shafts, the wright, the lord's
 *                      well, the one spring and the rain appear before any card
 *                      or chip names them.
 *   9 One named person? Step 0: `{cast:reeve}`. Step 1: `{cast:wright}`.
 *  10 Stake in a sentence? 'Can the well-sinker get a shaft down through old
 *                      workings and lined before the rain, and be paid for it?'
 *  11 Cards verb+noun, spell-style? Yes; four specials, mechanism-stating, no
 *                      digits, no name word repeated in the effect line.
 *  12 Opening per class? `rural` and `urban`, both written.
 * 
 * ─── Mechanical design block (designed before the prose) ─────────────
 *   Crux            The mortal has been paid half to sink a village well through
 *                   ground riddled with old shafts, and a lord's well-wright is
 *                   racing them for the same spring.
 *   Whose problem?  The agent's: their contract, their advance, their shaft.
 *   Reach = theme?  Step 0 tests Stone and is about digging through bad ground
 *                   without a cave-in. Step 1 tests Stone and is about lining the
 *                   shaft so it stands. Difficulties 0.42 → 0.45 (brief; open-draw
 *                   ceiling 0.45).
 *   Shape           Appointment (placed/timed seeded sequel, THR-1479). Step 1
 *                   success plants `encounter_seed` → kept
 *                   `town.well_first_water` (seed-only), with
 *                   `appointment: { locationId '$here', counterpartyId
 *                   '$cast:reeve', missed → town.well_gone_foul }`,
 *                   `inheritContext`, 36 ticks (three days: new wells run cloudy
 *                   until the silt settles). Both sequels are seed-only
 *                   (`drawable: false`, THR-1526), authored by the orchestrator
 *                   outside the factory catalog (the `hunt.trail_cold`
 *                   precedent), so neither carries an `encounter.` prefix.
 *   Consequence hand (binding, THR-1145): `membership` + `omen` — no swap.
 *                   `membership` — `membership_change` join `builders_fellowship`
 *                   (the shipped stonemasons' guild, factionType guild) on step 1
 *                   success: the lord's wright, a guildsman, watched the lining
 *                   stand and vouched for them. Chipped on every success band.
 *                   `omen` — `emit_omen` (cultural, global) on BOTH sides of step
 *                   1: a village reads a new well's first night as a sign for the
 *                   year — a good year if it stands (life), a bad one if it falls
 *                   in (entropy). No chip (an omen is dressing, not held state).
 *   Spine           `reputation_with` on `$here`, both directions (noun
 *                   `reputation with {location}`) — the village judges the work.
 *                   Critic pass: step 0 carries its own small `reputation_with
 *                   -0.03` on `failureMetadata`, because a step-0
 *                   critical_failure ends the action there (whatever the
 *                   failBehavior) and step 1's failure writes never fire on that
 *                   path — without it the critical_failure SCAR chip was unbacked.
 *   Cool failure?   Nobody is hurt or jailed. The shaft falls in, the spring goes
 *                   to the lord's well, the advance is spent, and the village
 *                   thinks less of the well-sinker.
 *   Trait hooks     Gate: none (everyday by construction). Variant: none — no
 *                   live trait fits shoring a shaft better than the reach does.
 *                   Trait-only nudge: none. Trait fragment: none.
 *   Systems quota   cast + seeds (appointment) + factions + reputation — four.
 *   Heavy Hand      none authored.
 */

import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

/**
 * The annotated literal: excess-property checking on the real type is this
 * file's deep validator ('check:typecheck' fails on any unknown field).
 * 'consequenceDraw' is STAMPED from the binding draw (THR-1145) — edit it only
 * by re-running the compiler or recording a 'consequenceSwap'.
 */
const TEMPLATE_BASE: UnifiedActionTemplate = {
  id: 'encounter.town.well_sinking',
  stakes: {
    goal: 'sink and line the new well before the night\'s rain',
    risk: 'see the shaft cave in and bury the advance',
    won: 'lined the new well before the rain came',
    lost: 'lost the shaft and the spring to the rain',
    lostBadly: 'watched the lining collapse and fill the shaft',
  },
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Well Sinking',
  reach: 'stone',
  crudType: 'create',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'preservation_transformation'],
  tags: ['#build'],
  settings: ['rural', 'urban'],
  openings: {
    rural: '{actor} comes into {location} to sink a new well for the village.',
    urban: '{actor} arrives in {location} to sink a new well for one of its streets.',
  },
  steps: [
    {
      reach: 'stone',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.42,
      purposeLine: 'Sink the shaft',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The old well has gone foul. {cast:reeve}, the reeve, keeps the well money. Half the fee has been '
        + 'paid in advance. The rest will be paid at the well on the day its water runs clear. For years, a '
        + 'digger sank shafts under this plot and marked none of them. If the new shaft breaks into one, it '
        + 'can cave in and waste the advance.',
      successAfterimage: 'They shored each yard as they dug and went down past the old workings without breaking into one.',
      failureAfterimage: 'They broke into an old shaft, and a yard of wall slid in before they could shore it.',
      successAtCostAfterimage: 'They got past the old workings, but a wall slumped and the morning went to digging it out.',
      criticalSuccessAfterimage: 'They found the old digger\'s shafts by the sound of the spade, shored around them, and were down '
        + 'by noon.',
      criticalFailureAfterimage: 'They broke into an old shaft, and the sides caved in and filled everything they had dug.',
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.03,
          },
        ],
      },
      deal: {
        count: 4,
        tags: ['craft', 'labor'],
      },
      nudges: [
        {
          id: 'well.wake_the_memory',
          name: 'Wake The Memory',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.memory',
          effectLine: 'Bring the old digger\'s shafts back to the reeve\'s mind, so they are named before anyone digs. '
            + 'A real help.',
          bandProse: {
            success: 'The reeve remembered where the old digger had worked and pointed out two spots before the spade '
              + 'went in.',
            failure: 'The reeve remembered where the old digger had worked, but only after the spade had gone through '
              + 'one.',
          },
        },
        {
          id: 'well.bind_the_sand',
          name: 'Bind The Sand',
          sphere: 'matter',
          essenceCost: 2,
          forecastDelta: 0.11,
          imageTag: 'generic.matter',
          effectLine: 'Make the loose ground in the shaft walls cling together, so the sides stand while they dig. A '
            + 'real help.',
          bandProse: {
            critical_success: 'The walls held like packed clay, and not a spadeful slid back in.',
            failure: 'The upper walls held firm and the ground ran loose where it met the old shaft.',
          },
        },
      ],
    },
    {
      reach: 'stone',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.45,
      purposeLine: 'Line the well',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'By evening the shaft is down to wet clay. On the next plot, {cast:wright}, a well-wright, is '
        + 'sinking another well on the lord\'s orders. Both shafts draw on one spring, and the first one '
        + 'lined with stone takes it. The wright calls across, friendly enough, that rain is coming '
        + 'tonight. An unlined shaft will fall in before morning.',
      successAfterimage: 'They set the lining course by course, and it stood when the rain came.',
      failureAfterimage: 'The rain came before the lining was done, and the sides slumped in the night.',
      successAtCostAfterimage: 'The lining stood, but they paid for extra stone out of the advance to finish it.',
      criticalSuccessAfterimage: 'They lined the shaft to the top before dark, and water was rising in it by morning.',
      criticalFailureAfterimage: 'The lining collapsed in the rain and filled the shaft with its own stone.',
      successMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'membership_change',
            factionId: 'builders_fellowship',
            op: 'join',
            targetAgentId: '$actor',
            chronicle: true,
          },
          {
            kind: 'emit_omen',
            category: 'cultural',
            intensity: 0.3,
            narrativeHook: 'A new well was lined before the rain, and the people who paid for it took its first night for a '
              + 'good year.',
            scope: {
              kind: 'global',
            },
            sphereAlignment: 'life',
          },
          {
            kind: 'encounter_seed',
            templateId: 'town.well_first_water',
            targetAgentId: '$actor',
            delayTicks: 36,
            seedLabel: 'The rest of the fee is paid at the new well on the day its water runs clear.',
            inheritContext: true,
            appointment: {
              locationId: '$here',
              counterpartyId: '$cast:reeve',
              missed: {
                templateId: 'town.well_gone_foul',
                seedLabel: 'Nobody from the work was at the well when its water ran clear, and the reeve comes looking with '
                  + 'the money held back.',
              },
            },
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: -0.05,
          },
          {
            kind: 'emit_omen',
            category: 'cultural',
            intensity: 0.3,
            narrativeHook: 'A new well fell in on its first night, and the people who paid for it took that for a bad year.',
            scope: {
              kind: 'global',
            },
            sphereAlignment: 'entropy',
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['craft', 'labor'],
      },
      nudges: [
        {
          id: 'well.hold_off_the_rain',
          name: 'Hold Off The Rain',
          sphere: 'time',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.ward',
          effectLine: 'Keep the clouds back until after dark, so the lining goes in against dry walls. A real help.',
          bandProse: {
            success: 'The rain held off until the last course was set.',
            failure: 'The rain held off for an hour and came down before the lining was halfway up.',
          },
        },
        {
          id: 'well.sway_the_neighbour',
          name: 'Sway The Neighbour',
          sphere: 'order',
          essenceCost: 1,
          forecastDelta: 0.1,
          imageTag: 'generic.warmth',
          effectLine: 'Move the well-wright next door to send spare facing over, so the lining is finished before dark. '
            + 'A small help.',
          bandProse: {
            success: 'The well-wright sent a barrow of spare facing over, and the lining was finished before dark.',
            success_at_cost: 'The well-wright sent spare facing over, and the lord\'s well went unlined an hour longer for it.',
            failure: 'The well-wright sent spare facing over, but it came too late to finish before the rain.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'reeve',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['elder', 'steward', 'clerk', 'merchant'],
      supportRole: 'reeve',
      spawnNpcRole: 'elder',
      spawnName: 'Wenna Marsh',
    },
    {
      kind: 'actor',
      key: 'wright',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['mason'],
      supportRole: 'rival_well_wright',
      spawnNpcRole: 'mason',
      spawnName: 'Tobin Hale',
    },
  ],
  narrativeTemplates: {
    initiation: '{location} has paid half in advance for a new well, and the plot sits over old shafts nobody '
      + 'marked.',
    success: 'The well was lined before the rain, and the rest of the fee is paid at the well when its water '
      + 'runs clear.',
    failure: 'The shaft fell in, and the new well was never finished.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'A new well has been sunk in {location}, or lost to the rain.',
      changes: [
        {
          id: 'well.the_shaft_sunk',
          kind: 'growth',
          title: 'A shaft, sunk',
          detail: 'A day shoring bad ground teaches the stone reach.',
          polarity: 'gain',
          concepts: [
            {
              text: 'stone reach',
              tooltipId: 'reach.stone',
            },
          ],
        },
      ],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: 'The spring came to {actor}\'s shaft first, and the lord\'s well on the next plot stands dry. '
            + '{cast:wright} came over in the morning to look down it.',
          changes: [
            {
              id: 'well.crit.the_villages_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks well of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'A well that stands',
              causeClause: 'A clean job',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'well.crit.fellowship_rolls',
              kind: 'faction_reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a guild membership',
                entityId: '$faction:builders_fellowship',
                visualKind: 'faction',
              },
              concepts: [
                {
                  text: 'the Builders Fellowship',
                  entityId: '$faction:builders_fellowship',
                  visualKind: 'faction',
                },
              ],
              title: 'Vouched for',
              causeClause: 'Vouched for by {cast:wright}',
              detail: '{actor} is on the rolls of the Builders Fellowship now.',
            },
            {
              id: 'well.crit.paid_at_the_well',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'appointment',
                entityId: '$appointment',
                visualKind: 'location',
              },
              concepts: [
                {
                  text: 'pays the rest',
                },
              ],
              title: 'Paid at the well',
              causeClause: 'The shaft stands',
              detail: '{cast:reeve} pays the rest at the well when its water runs clear.',
            },
          ],
        },
        success: {
          overview: 'The spring came into {actor}\'s shaft, and the lord\'s well on the next plot stands dry.',
          changes: [
            {
              id: 'well.win.the_villages_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks well of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'A well that stands',
              causeClause: 'Lined in time',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'well.win.fellowship_rolls',
              kind: 'faction_reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a guild membership',
                entityId: '$faction:builders_fellowship',
                visualKind: 'faction',
              },
              concepts: [
                {
                  text: 'the Builders Fellowship',
                  entityId: '$faction:builders_fellowship',
                  visualKind: 'faction',
                },
              ],
              title: 'Vouched for',
              causeClause: 'Vouched for by {cast:wright}',
              detail: '{actor} is on the rolls of the Builders Fellowship now.',
            },
            {
              id: 'well.win.paid_at_the_well',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'appointment',
                entityId: '$appointment',
                visualKind: 'location',
              },
              concepts: [
                {
                  text: 'pays the rest',
                },
              ],
              title: 'Paid at the well',
              causeClause: 'The shaft stands',
              detail: '{cast:reeve} pays the rest at the well when its water runs clear.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The spring came into {actor}\'s shaft, but the work went wrong in places and used up most of the '
            + 'advance.',
          changes: [
            {
              id: 'well.cost.the_villages_regard',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks well of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'Lined at a price',
              causeClause: 'Lined in time',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'well.cost.fellowship_rolls',
              kind: 'faction_reputation',
              category: 'bond',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'a guild membership',
                entityId: '$faction:builders_fellowship',
                visualKind: 'faction',
              },
              concepts: [
                {
                  text: 'the Builders Fellowship',
                  entityId: '$faction:builders_fellowship',
                  visualKind: 'faction',
                },
              ],
              title: 'Vouched for',
              causeClause: 'Vouched for by {cast:wright}',
              detail: '{actor} is on the rolls of the Builders Fellowship now.',
            },
            {
              id: 'well.cost.paid_at_the_well',
              kind: 'future_hook',
              category: 'path',
              direction: 'opens',
              polarity: 'gain',
              stateNoun: {
                text: 'appointment',
                entityId: '$appointment',
                visualKind: 'location',
              },
              concepts: [
                {
                  text: 'pays the rest',
                },
              ],
              title: 'Paid at the well',
              causeClause: 'The shaft stands',
              detail: '{cast:reeve} pays the rest at the well when its water runs clear.',
            },
          ],
        },
        failure: {
          overview: 'The spring went to the lord\'s well, and the advance went into the ground with the shaft.',
          changes: [
            {
              id: 'well.lost.the_villages_regard',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks less of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'Lost to the rain',
              causeClause: 'Unlined at nightfall',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
        critical_failure: {
          overview: '{location} counts the advance it paid as thrown away.',
          changes: [
            {
              id: 'well.broke.the_villages_regard',
              kind: 'reputation',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              stateNoun: {
                text: 'reputation with {location}',
                entityId: '$here',
                visualKind: 'location',
                tooltipId: 'ui.reputation_with',
              },
              concepts: [
                {
                  text: 'thinks less of',
                  tooltipId: 'ui.standing',
                },
              ],
              title: 'A well that fell in',
              causeClause: 'A shaft that fell in',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
      },
    },
  },
  description: 'A two-step stone job for a village or a street: sink a well shaft through ground full of old '
    + 'unmarked workings, then line it before the night\'s rain, racing a lord\'s well-wright for the '
    + 'same spring. A lined well wins the place\'s regard and a vouch into the Builders Fellowship, and '
    + 'plants an appointment: the reeve pays the second half of the fee at the well on the day its '
    + 'water runs clear (kept → first-water sequel, missed → gone-foul sequel). Either way the village '
    + 'reads the new well\'s first night as an omen.',
  locationSubtypes: expandSettings(['rural', 'urban']),
  consequenceDraw: ['membership', 'omen'],
};

export const WELL_SINKING_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
