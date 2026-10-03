/**
 * The Hired Knives (slug hired-knives) — THR-1703, the first content behind #rival_strike.
 * 
 * Final design: `Docs/plans/encounters/hired-knives-final.md` (brief, draft, editorial, systems, package passes alongside).
 * Seed-only (`drawable: false`): planted by `recordDetectionCrossings` (shadow.rival_strike) and the
 * Infiltrator's Approach seed. Two steps, Shadow then Iron, linear, carryover keyed on step 1's band.
 * 
 * Narrator checklist: P1 arrival per setting class (rural / urban / wayside); P2 three days followed, asked
 * after by name; P3 unmitigated risk ("will not wait another night"); spine 50 words; the rival and the two
 * strangers are off-stage / scene-only; one named person, {cast:warner}, both steps.
 * 
 * Consequence hand: relationship (bond_change with the warner) + drive (plant_compulsion, optional
 * assign_ambition ambition_seek_revenge on critical_success). Wounded on failure.
 * Cost channels: Hide Their Passing pays detection down; Shatter The Blades pays it up (costs.detectionDelta).
 * Accepted deviations: D1 success_at_cost bond is step 1's strain netted against step 2; D2 critical_failure
 * claims only the BOND chip (a step-1 critical failure ends the action with step 1's writes only);
 * D3 no sender node, so Seek Revenge is offered as a reaction with no named target.
 * Chip titles are implementation-authored (the final doc fixes detail text, not titles).
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
  id: 'encounter.rival.hired_knives',
  tags: ['#rival_strike'],
  rarityTier: 2,
  intrinsicTier: 'background',
  name: 'The Hired Knives',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence', 'sacrifice_survival'],
  drawable: false,
  settings: ['rural', 'urban', 'wayside'],
  openings: {
    rural: '{actor} comes into {location} at dusk by the cart road.',
    urban: '{actor} comes through the gate of {location} at dusk.',
    wayside: '{actor} stops for the night at {location}, off the road.',
  },
  steps: [
    {
      reach: 'shadow',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.4,
      purposeLine: 'Shake the tail',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'Two strangers have followed {actor} for three days. Tonight they are closer than before. '
        + '{cast:warner} has seen them too, and says they asked for {actor} by name.\n\n'
        + 'A rival sent them, because a god\'s help was seen around {actor}. Nothing has happened yet. They '
        + 'will not wait another night.',
      criticalSuccessAfterimage: 'They shook the strangers, doubled back, and watched them search in the wrong direction.',
      successAfterimage: 'They lost the strangers for an hour, and chose where to be when they came back.',
      successAtCostAfterimage: 'They lost the strangers by running, but the strangers saw where they went.',
      failureAfterimage: 'The strangers stayed on them, and now they know {cast:warner}\'s face too.',
      criticalFailureAfterimage: 'They doubled back straight into the strangers and had to run with the knives at their backs.',
      deal: {
        count: 4,
        tags: ['shadow', 'peril'],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:warner',
            sentimentDelta: -0.05,
            trustDelta: -0.05,
          },
        ],
      },
      nudges: [
        {
          id: 'knives.hide_their_passing',
          name: 'Hide Their Passing',
          sphere: 'darkness',
          essenceCost: 3,
          forecastDelta: 0.08,
          costs: {
            detectionDelta: -0.1,
          },
          imageTag: 'generic.dark',
          effectLine: 'Blur every sign of where they went. No rival god sees this working, and the notice already on '
            + 'this region fades a little.',
          bandProse: {
            critical_success: 'The strangers lost the trail so completely that they stopped and argued about it.',
            success: 'The trail went cold in the strangers\' hands, and no rival god saw why.',
            success_at_cost: 'The trail went cold, and stayed cold only while {actor} kept moving.',
            near_miss: 'Nobody saw the god\'s hand. The strangers did not need to; they had already guessed where '
              + '{actor} would go.',
            failure: 'The trail went cold, and the strangers simply waited where it had to come out.',
          },
        },
        {
          id: 'knives.doubt_every_face',
          name: 'Doubt Every Face',
          requiredTrait: 'trait.core.core_hope.vice',
          essenceCost: 0,
          forecastDelta: 0.08,
          imageTag: 'generic.focus',
          effectLine: 'Their Bitter suspicion turns on the people behind them and picks out the ones who do not belong.',
          bandProse: {
            success: 'Being Bitter, {actor} had counted the faces behind them long before tonight.',
            failure: '{actor} suspected everyone behind them, and so suspected the wrong two.',
            critical_failure: '{actor} watched the people behind so hard that the two ahead walked straight up.',
          },
        },
      ],
    },
    {
      reach: 'iron',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.45,
      purposeLine: 'Survive the knives',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'The strangers find {actor} again before dawn. Both draw knives and close in, one from each side. '
        + '{cast:warner} shouts and backs away. {actor} has to get past the knives or through them.',
      criticalSuccessAfterimage: 'They took the knife off the first stranger, and the second one ran.',
      successAfterimage: 'They got past the knives and out of reach, unhurt.',
      successAtCostAfterimage: 'They got clear, but loudly, and everyone close by saw the knives.',
      failureAfterimage: 'One knife cut them before they broke away and ran.',
      criticalFailureAfterimage: 'The first knife landed before they saw it, and they ran bleeding.',
      carryoverFactorLines: {
        critical_success: {
          text: 'They chose the ground before the knives arrived.',
          polarity: 'for',
          forecastDelta: 0.08,
        },
        success: {
          text: 'They saw the knives coming.',
          polarity: 'for',
          forecastDelta: 0.05,
        },
        failure: {
          text: 'The knives are closer than they should be.',
          polarity: 'against',
          forecastDelta: -0.05,
        },
      },
      deal: {
        count: 4,
        tags: ['might', 'peril'],
      },
      successMetadata: {
        effects: [
          {
            kind: 'bond_change',
            withAgentId: '$cast:warner',
            sentimentDelta: 0.1,
            trustDelta: 0.1,
          },
          {
            kind: 'plant_compulsion',
            targetAgentId: '$actor',
            encounterBias: {
              hire: -0.3,
              trade: -0.2,
              assist: -0.2,
            },
            durationTicks: 72,
            narrativeHook: 'Hunted by hired knives, and wary of strangers for a while.',
          },
        ],
      },
      failureMetadata: {
        effects: [
          {
            kind: 'apply_condition',
            conditionTraitId: 'trait.condition.wounded',
            targetAgentId: '$actor',
          },
          {
            kind: 'bond_change',
            withAgentId: '$cast:warner',
            sentimentDelta: -0.1,
            trustDelta: -0.1,
          },
          {
            kind: 'plant_compulsion',
            targetAgentId: '$actor',
            encounterBias: {
              duel: -0.4,
              explore: -0.3,
              steal: -0.2,
            },
            durationTicks: 96,
            narrativeHook: 'Cut by hired knives, and shying from fights and far roads.',
          },
        ],
      },
      nudges: [
        {
          id: 'knives.shatter_the_blades',
          name: 'Shatter The Blades',
          sphere: 'force',
          essenceCost: 2,
          forecastDelta: 0.16,
          costs: {
            detectionDelta: 0.15,
          },
          imageTag: 'generic.blade',
          effectLine: 'Steel snaps in the attackers\' hands at the first blow. Rival gods can hardly miss the hand that '
            + 'did it.',
          bandProse: {
            critical_success: 'Both knives broke on the first blow, and both strangers ran.',
            failure: 'One knife broke. The other did not, and it found {actor}.',
            critical_failure: 'The steel broke with a crack heard far off, and it brought the second stranger straight to '
              + '{actor}.',
          },
        },
        {
          id: 'knives.rouse_the_witness',
          name: 'Rouse The Witness',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.1,
          imageTag: 'generic.rumor',
          effectLine: 'Fill a bystander with a sudden urge to shout, loud enough to bring others running.',
          bandProse: {
            success: '{cast:warner} shouted without meaning to, and the strangers did not want the company.',
            success_at_cost: '{cast:warner}\'s shout brought help, and brought it late.',
            near_miss: '{cast:warner} shouted, and the strangers hurried to finish before help came.',
            failure: '{cast:warner} shouted, and no one came in time.',
          },
        },
      ],
    },
  ],
  traitVariants: [
    {
      traitId: 'trait.core.core_hope.vice',
      forecastDelta: 0.04,
      factorLine: 'Being Bitter, they have been watching their back all along.',
      addNudgeIds: ['knives.doubt_every_face'],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'warner',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['innkeeper', 'wanderer', 'pilgrim', 'hunter'],
      supportRole: 'warner',
      spawnNpcRole: 'wanderer',
      spawnName: 'Corra Venn',
    },
  ],
  narrativeTemplates: {
    initiation: 'The people following {actor} were hired to do more than follow.',
    success: 'The knives missed, and the strangers are gone from {actor}\'s trail.',
    failure: 'The hired knives caught up with {actor}, and {actor} had to run.',
  },
  aftermathConfig: {
    branchOnStep: 1,
    variants: {},
    fallback: {
      overview: 'The strangers are gone. Nobody here has said who paid them.',
      changes: [],
      byOutcome: {
        critical_success: {
          overview: 'One of the strangers let it slip before the end: they had been paid to stop a god\'s help.',
          changes: [
            {
              id: 'knives.cs.wary',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              title: 'Wary of strangers',
              detail: 'For a while they avoid hiring, trading with, or helping strangers.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'hiring, trading with, or helping strangers',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'knives.cs.bond',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:warner',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              title: 'A warning heeded',
              detail: 'Heeded the warning — {cast:warner} trusts {actor} more.',
              polarity: 'gain',
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.reputation_with',
                },
              ],
            },
          ],
          reactionPrompt: 'What do they carry out of it?',
          reactions: [
            {
              id: 'knives.kindle_revenge',
              label: 'Kindle a hunger for revenge',
              intent: 'They wake wanting to repay the strike, whether or not the payer is ever found.',
              effects: [
                {
                  kind: 'assign_ambition',
                  templateId: 'ambition_seek_revenge',
                  targetAgentId: '$actor',
                  narrativeHook: 'Heard a hired knife say it was paid to stop a god\'s help, and wants it repaid.',
                },
              ],
            },
            {
              id: 'knives.leave_anger_be',
              label: 'Leave their anger be',
              intent: 'No grudge is kindled. The god\'s hand stays still.',
              effects: [],
            },
          ],
        },
        success: {
          overview: 'By morning the strangers had left {location}, and nobody there knew who had paid them.',
          changes: [
            {
              id: 'knives.s.wary',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              title: 'Wary of strangers',
              detail: 'For a while they avoid hiring, trading with, or helping strangers.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'hiring, trading with, or helping strangers',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'knives.s.bond',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:warner',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              title: 'A warning heeded',
              detail: 'Heeded the warning — {cast:warner} trusts {actor} more.',
              polarity: 'gain',
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.reputation_with',
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview: '{actor} is clear of the strangers, but only just.',
          changes: [
            {
              id: 'knives.sac.wary',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              title: 'Wary of strangers',
              detail: 'For a while they avoid hiring, trading with, or helping strangers.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'hiring, trading with, or helping strangers',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'knives.sac.bond',
              kind: 'reputation',
              category: 'bond',
              direction: 'gain',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:warner',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              title: 'Stood together',
              detail: '{cast:warner} trusts {actor} more now.',
              polarity: 'gain',
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.reputation_with',
                },
              ],
            },
          ],
        },
        failure: {
          overview: '{actor} escaped the strangers, but left {cast:warner} behind to face them alone.',
          changes: [
            {
              id: 'knives.f.wounded',
              kind: 'trait',
              category: 'scar',
              direction: 'loss',
              polarity: 'loss',
              title: 'Wounded',
              detail: '{actor} is wounded until the cut heals.',
              stateNoun: {
                text: 'Wounded',
                entityId: 'trait.condition.wounded',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'wounded',
                  entityId: 'trait.condition.wounded',
                  visualKind: 'attachment',
                },
              ],
            },
            {
              id: 'knives.f.fear',
              kind: 'shell_state',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'compulsion',
                tooltipId: 'ui.compulsion',
              },
              title: 'Shying from danger',
              detail: 'For a while they shy from fights and far roads.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'fights and far roads',
                  entityId: '$actor',
                  visualKind: 'agent',
                },
              ],
            },
            {
              id: 'knives.f.bond',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:warner',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              title: 'Left behind',
              detail: '{cast:warner} trusts {actor} less now.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.reputation_with',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview: '{actor} lived through the night, and {cast:warner} saw how close it came.',
          changes: [
            {
              id: 'knives.cf.bond',
              kind: 'reputation',
              category: 'bond',
              direction: 'loss',
              stateNoun: {
                text: 'reputation with {target}',
                entityId: '$cast:warner',
                visualKind: 'agent',
                tooltipId: 'ui.reputation_with',
              },
              title: 'Too close to the knives',
              detail: 'Too dangerous to stand near — {cast:warner} trusts {actor} less.',
              polarity: 'loss',
              concepts: [
                {
                  text: 'trusts',
                  tooltipId: 'ui.reputation_with',
                },
              ],
            },
          ],
        },
      },
    },
  },
  description: 'A two-step rival strike seeded by regional detection pressure: shake two hired followers, then '
    + 'survive their knives. The god\'s card choices pay the region\'s notice down or up; the warner\'s '
    + 'bond, a lean toward or away from strangers and fights, and Wounded on a loss carry on.',
  locationSubtypes: expandSettings(['rural', 'urban', 'wayside']),
  consequenceDraw: ['relationship', 'drive'],
};

export const HIRED_KNIVES_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
