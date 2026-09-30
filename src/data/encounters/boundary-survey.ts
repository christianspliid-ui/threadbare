/**
 * The Boundary Survey — slot 1 of expert-everyday-2 (THR-1679), the batch's appointment slot.
 * Two-step expert Eye job: read the moved boundary stones against the charter, then find the
 * true line from its marks. On a found line the assize books the surveyor to the beating of the
 * bounds in three days — an `encounter_seed` carrying an `appointment` block (THR-1479), so the
 * spine may name the place and time (prose rule 7b's one lawful exception). Kept →
 * `town.bounds_beaten` (seed-only), missed → `town.bounds_stone_uprooted` (seed-only), both
 * hand-authored in `boundary-survey-sequels.ts`.
 * 
 * Pipeline: `Docs/plans/encounters/boundary-survey-final.md` (editorial PASS WITH REVISIONS ·
 * systems READY WITH CAVEATS · package critic PASS: `boundary-survey-package.md`).
 * plotHookTaken: hook.betrayal_revealed blended with hook.oath_breaking_scandal — the friendly
 * reeve, who swears to the bounds every year, moved the stones himself to clear a debt to the
 * lord. Seed dice: p3 mystery · opposition faction (doctrine: only a survey sworn from the
 * charter's marks counts) · disposition friendly · agentRole trespasser · scale region.
 * Consequence hand (binding): possession (#map reward pool) + knowledge (political_secret).
 * Card types: Whisper (life) · Stumble (chaos) on step 0; Signature (order) · Compulsion (mind)
 * on step 1. Step 0 failure writes reputation -0.03 so the critical_failure SCAR has a backing write.
 * Narrator's 12 questions: see final file section 19 (opening 78 words).
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
  id: 'encounter.town.boundary_survey',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Boundary Survey',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning', 'tradition_novelty'],
  tags: ['#territorial'],
  settings: ['rural'],
  openings: {
    rural: '{actor} comes into {location}, sent for by the county assize.',
  },
  steps: [
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.58,
      purposeLine: 'Read the moved stones',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The stones marking the bounds between the lord\'s land and the village common have moved. The '
        + 'common is smaller than it was.\n\n'
        + 'The charter says a survey sworn from its marks settles the line. {cast:steward}, the lord\'s '
        + 'steward, holds the charter and says nothing has moved. Nobody in {location} will say who moved '
        + 'the stones. If {actor} cannot find the true line, {location} will think less of them.',
      successAfterimage: 'They found where the stones used to stand. Each one had been moved out onto the common.',
      failureAfterimage: 'They could not tell where the stones used to stand, and had only the charter to go on.',
      successAtCostAfterimage: 'They found where most of the stones used to stand, but the plough had wiped out the rest.',
      criticalSuccessAfterimage: 'By noon they had found where every stone used to stand, and each one had been moved out onto the '
        + 'common.',
      criticalFailureAfterimage: 'They took the moved stones for the old ones, and said so in front of {cast:steward}.',
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
        count: 3,
        tags: ['insight', 'lore'],
      },
      nudges: [
        {
          id: 'bounds.quicken_the_turf',
          name: 'Quicken The Turf',
          sphere: 'life',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.vigor',
          effectLine: 'Make the grass along the bounds grow in a night, so ground that was dug shows a darker green.',
          bandProse: {
            critical_success: 'Overnight the grass had grown dark green in a ring wherever a stone had been lifted.',
            success: 'Overnight the grass had grown darker over every patch that had been dug.',
            near_miss: 'The grass grew darker over the dug ground, but sheep had grazed it short by noon.',
            failure: 'The grass grew darker over all the ploughed ground, dug or not.',
          },
        },
        {
          id: 'bounds.loose_the_wind',
          name: 'Loose The Wind',
          sphere: 'chaos',
          essenceCost: 1,
          forecastDelta: 0.1,
          imageTag: 'generic.luck',
          effectLine: 'Send a gust across the common as the steward unrolls the charter, so it blows open and every '
            + 'mark on it is read aloud.',
          bandProse: {
            success_at_cost: 'The gust blew the charter open and its marks were read aloud, and then {cast:steward} took it '
              + 'back to the lord\'s house.',
            failure: 'The gust blew the charter open, but the ink at the fold had faded past reading.',
            critical_failure: 'The gust blew the charter into the ditch, and {cast:steward} blamed {actor} for it.',
          },
        },
      ],
    },
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.66,
      purposeLine: 'Find the true line',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'The charter marks the line by an old oak, a spring and a wayside cross. The oak was felled years '
        + 'ago. {cast:reeve}, who leads the beating of the bounds each year and swears to them, shows '
        + '{actor} where it stood, but a line from there misses the cross. The true line runs across the '
        + 'lord\'s land, and the lord\'s men watch anyone who crosses it. If the line is found, a new stone '
        + 'is set at this year\'s beating of the bounds, in three days, with the lord\'s steward as '
        + 'witness.',
      successAfterimage: 'They found the true line from the spring and the cross. When it was read out, {cast:reeve} owned '
        + 'to moving the stones.',
      failureAfterimage: 'They could not make the spring and the cross agree on one line.',
      successAtCostAfterimage: 'They found the true line a day late, after measuring once from the wrong place. When it was read '
        + 'out, {cast:reeve} owned to moving the stones.',
      criticalSuccessAfterimage: 'They found the true line by dusk, and {cast:reeve} owned to moving the stones before it was read '
        + 'out.',
      criticalFailureAfterimage: 'They swore to the moved stones as the true line.',
      successMetadata: {
        rewardPool: {
          categoryWeights: {
            possession: 1,
          },
          tagFilters: ['#map'],
        },
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'intelligence',
            category: 'political_secret',
            label: 'Why the stones moved',
            detail: 'The reeve owed the lord a debt and moved the stones to clear it.',
            reliability: 0.85,
            targetAgentId: '$actor',
          },
          {
            kind: 'encounter_seed',
            templateId: 'town.bounds_beaten',
            targetAgentId: '$actor',
            delayTicks: 36,
            inheritContext: true,
            seedLabel: 'A new stone is set at this year\'s beating of the bounds, with the steward as witness.',
            appointment: {
              locationId: '$here',
              counterpartyId: '$cast:steward',
              missed: {
                templateId: 'town.bounds_stone_uprooted',
                seedLabel: 'Nobody from the survey was at the beating of the bounds, and the steward comes looking for the '
                  + 'surveyor.',
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
            delta: -0.06,
          },
        ],
      },
      deal: {
        count: 3,
        tags: ['insight', 'journey'],
      },
      nudges: [
        {
          id: 'bounds.call_up_the_oath',
          name: 'Call Up The Oath',
          sphere: 'order',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.oath',
          effectLine: 'Hold the reeve to the word sworn at every beating of the bounds, so the reeve points to the '
            + 'oak\'s true place.',
          bandProse: {
            success: '{cast:reeve} had already gone back and shown them the oak\'s true place.',
            success_at_cost: '{cast:reeve} had shown them the oak\'s true place, and would not look at the village afterwards.',
            failure: '{cast:reeve} started toward the oak\'s true place, then stopped and kept to the first answer.',
          },
        },
        {
          id: 'bounds.walk_the_old_line',
          name: 'Walk The Old Line',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.11,
          imageTag: 'generic.memory',
          effectLine: 'Send them a night\'s dream of the bounds being beaten, so they wake set on measuring from the '
            + 'spring.',
          bandProse: {
            critical_success: 'They had woken before dawn and gone straight to the spring, and every measure after it ran true.',
            near_miss: 'They woke set on starting from the spring, and lost the morning to mist.',
            failure: 'They woke set on starting from the spring, but the spring had shifted with the years.',
            critical_failure: 'They woke sure of the line in the dream, and trusted it over the charter\'s marks.',
          },
        },
      ],
    },
  ],
  supportBundle: [
    {
      kind: 'actor',
      key: 'steward',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['steward', 'noble', 'clerk'],
      supportRole: 'steward',
      spawnNpcRole: 'steward',
      spawnName: 'Edric Payne',
    },
    {
      kind: 'actor',
      key: 'reeve',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      reuseNpcRoles: ['elder'],
      supportRole: 'reeve',
      spawnNpcRole: 'elder',
      spawnName: 'Wat Hollis',
    },
  ],
  narrativeTemplates: {
    initiation: 'The stones between the lord\'s land and the common in {location} have moved, and the county '
      + 'assize has sent for a surveyor.',
    success: 'The true line was found, and a new stone is set at this year\'s beating of the bounds.',
    failure: 'The true line was not found.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The boundary between the lord\'s land and the common in {location} has been surveyed, or lost.',
      changes: [],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: '{cast:steward} told the lord\'s men the survey was fair. The assize paid {actor} in kind.',
          changes: [
            {
              id: 'bounds.crit.the_lines_regard',
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
              title: 'A line proved',
              causeClause: 'Sworn before the village',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'bounds.crit.why_it_moved',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'why the stones were moved',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Why the stones moved',
              causeClause: '{cast:reeve} owed the lord',
              detail: '{actor} knows why the stones were moved.',
            },
            {
              id: 'bounds.crit.beating_of_the_bounds',
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
                  text: 'witnesses it set',
                },
              ],
              title: 'The beating of the bounds',
              causeClause: 'A new stone for the line',
              detail: '{cast:steward} witnesses it set in {location} in three days.',
            },
          ],
        },
        success: {
          overview: 'The village has its common back. The assize paid {actor} in kind.',
          changes: [
            {
              id: 'bounds.win.the_lines_regard',
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
              title: 'A line proved',
              causeClause: 'Sworn before the village',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'bounds.win.why_it_moved',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'why the stones were moved',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Why the stones moved',
              causeClause: '{cast:reeve} owed the lord',
              detail: '{actor} knows why the stones were moved.',
            },
            {
              id: 'bounds.win.beating_of_the_bounds',
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
                  text: 'witnesses it set',
                },
              ],
              title: 'The beating of the bounds',
              causeClause: 'A new stone for the line',
              detail: '{cast:steward} witnesses it set in {location} in three days.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The lord\'s men turned {actor} off the land once before the survey was done. The assize paid '
            + 'them in kind all the same.',
          changes: [
            {
              id: 'bounds.cost.the_lines_regard',
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
              title: 'A line proved',
              causeClause: 'Sworn before the village',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'bounds.cost.why_it_moved',
              kind: 'shell_state',
              category: 'boon',
              direction: 'gain',
              polarity: 'gain',
              stateNoun: {
                text: 'knowledge',
                tooltipId: 'ui.knowledge',
              },
              concepts: [
                {
                  text: 'why the stones were moved',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Why the stones moved',
              causeClause: '{cast:reeve} owed the lord',
              detail: '{actor} knows why the stones were moved.',
            },
            {
              id: 'bounds.cost.beating_of_the_bounds',
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
                  text: 'witnesses it set',
                },
              ],
              title: 'The beating of the bounds',
              causeClause: 'A new stone for the line',
              detail: '{cast:steward} witnesses it set in {location} in three days.',
            },
          ],
        },
        failure: {
          overview: 'The lord keeps the grazing that the moved stones took from the common. {location} sent for a '
            + 'sworn surveyor to stop exactly that.',
          changes: [
            {
              id: 'bounds.lost.the_lines_regard',
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
              title: 'A line not proved',
              causeClause: 'No line sworn',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
        critical_failure: {
          overview: '{location} sent for a sworn surveyor to win back its common, and is worse off than before.',
          changes: [
            {
              id: 'bounds.broke.the_lines_regard',
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
              title: 'A false survey',
              causeClause: 'Their word for the lord',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
      },
    },
  },
  description: 'An expert two-step Eye job for a village: read where the boundary stones between the lord\'s '
    + 'land and the common used to stand, then find the true line from the charter\'s marks, with the '
    + 'friendly reeve who moved the stones walking the bounds beside the surveyor. A found line wins '
    + 'the village\'s regard, a map in kind from the assize and the knowledge of why the stones were '
    + 'moved, and plants an appointment at the beating of the bounds in three days (kept, the '
    + 'bounds-beaten sequel; missed, the stone-uprooted sequel). A lost survey costs the village\'s '
    + 'regard.',
  locationSubtypes: expandSettings(['rural']),
  consequenceDraw: ['possession', 'knowledge'],
};

export const BOUNDARY_SURVEY_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
