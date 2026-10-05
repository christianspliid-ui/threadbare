/**
 * The Forged Charter — slot 1 of master-everyday (THR-1688), the batch's appointment slot.
 * Two-step master Eye job: weigh the town's charter of liberties against the count's rival copy
 * (hands, inks, seals), then name which of the count's steward's clerks forged it. On a named
 * forger the findings are read out at the inquest in the town hall on court day, in three days,
 * with the steward there to answer them — an `encounter_seed` carrying an `appointment` block
 * (THR-1479), so the step-1 spine may name the place and time (prose rule 7b's one lawful
 * exception). Kept → `town.charter_inquest_heard` (seed-only), missed →
 * `town.charter_inquest_defaulted` (seed-only), both hand-authored in `charter-inquest-sequels.ts`.
 * 
 * Pipeline: `Docs/plans/encounters/forged-charter-inquest-final.md` (editorial PASS WITH REVISIONS ·
 * systems READY WITH CAVEATS · package critic PASS: `forged-charter-inquest-package.md`).
 * plotHookRolled: hook.haunt_resolution, hook.desperate_escort, hook.meeting_to_keep.
 * plotHookTaken: hook.meeting_to_keep — the findings are worth nothing unless they are read at the
 * inquest, so the win plants a meeting rather than ending the job. Seed dice: p3 mystery (nobody
 * can say which copy is false) · opposition faction (territory: the count's claim on the town's
 * tolls) · disposition hostile (the steward does not want an outsider reading the rival copy) ·
 * agentRole trespasser (an outsider in a hall the count's people hold) · scale settlement.
 * Consequence hand (binding): knowledge (political_secret intelligence) + story_seed (the
 * appointment). Card types: Signature (entropy) · Signature (energy) on step 0; Signature (mind) ·
 * Stumble (chaos) on step 1. Step 0 failure writes reputation -0.03 so the critical_failure SCAR
 * has a backing write. The forger is spawn-only (no reuseNpcRoles; never `useScoredBinder`) so a
 * town clerk is never cast as the count's man. Narrator's 12 questions: final file section 19
 * (opening 78 words).
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
  id: 'encounter.town.forged_charter_inquest',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Forged Charter',
  reach: 'eye',
  crudType: 'read',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['revelation_discretion', 'tradition_novelty'],
  tags: ['#territorial'],
  settings: ['urban'],
  openings: {
    urban: '{actor} arrives in {location}, sent for by the town council.',
  },
  steps: [
    {
      reach: 'eye',
      duration: {
        min: 1,
        max: 2,
      },
      difficulty: 0.74,
      purposeLine: 'Weigh the two charters',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
      narrativeTemplate: 'The town\'s charter frees its market from the count\'s tolls. The count\'s lawyers now call it a '
        + 'forgery. His steward, {cast:steward}, has brought a rival copy that gives the tolls back to '
        + 'him.\n\n'
        + 'Both copies carry the old king\'s seal, and nobody in {location} can say which one is false. The '
        + 'council asks {actor} to find out. The steward does not want an outsider reading the rival copy.',
      successAfterimage: 'The count\'s copy was written in new ink on a scraped page, and its seal was cast from a mould.',
      failureAfterimage: 'They could not tell the two copies apart, and had only the council\'s word that the town\'s is '
        + 'the old one.',
      successAtCostAfterimage: 'They found the new ink on the count\'s copy, but only after the steward had kept it overnight.',
      criticalSuccessAfterimage: 'Before noon they could show the council where the count\'s copy had been scraped and written '
        + 'over, and the mould marks on its seal.',
      criticalFailureAfterimage: 'They said aloud that the town\'s copy looked newer, and the steward\'s lawyers wrote it down.',
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
          id: 'charter.test_the_ink',
          name: 'Test The Ink',
          sphere: 'entropy',
          essenceCost: 2,
          forecastDelta: 0.12,
          imageTag: 'generic.decay',
          effectLine: 'Let a breath of damp air reach both copies, so fresh writing blurs and old writing holds.',
          bandProse: {
            critical_success: 'The damp blurred the count\'s copy all over, and the town\'s copy did not run at all.',
            success: 'The damp made the ink on the count\'s copy run at the edges, and the town\'s held.',
            near_miss: 'The damp made a few letters on the count\'s copy run, too few to show the council.',
            failure: 'The damp reached both copies, and the old ink ran as badly as the new.',
          },
        },
        {
          id: 'charter.warm_the_wax',
          name: 'Warm The Wax',
          sphere: 'energy',
          essenceCost: 1,
          forecastDelta: 0.09,
          imageTag: 'generic.energy',
          effectLine: 'Raise the heat of the hearth beside the reading table, so a seal cast from a mould shows its '
            + 'seams.',
          bandProse: {
            success_at_cost: 'The hearth warmed the count\'s seal until its seams showed, and the steward moved both copies '
              + 'away from the fire.',
            failure: 'The hearth warmed both seals, and neither showed a seam.',
            critical_failure: 'The hearth grew so hot that the town\'s seal softened, and the steward\'s lawyers called it a '
              + 'cheap casting.',
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
      difficulty: 0.8,
      purposeLine: 'Name the forger',
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
      narrativeTemplate: 'A false charter needs a scribe who can copy an old hand. {cast:steward} keeps three of the '
        + 'count\'s clerks close at hand to write the steward\'s papers, and any of them could have made '
        + 'it. If {actor} names the one who did, the findings are read out at the inquest in the town hall '
        + 'on court day, in three days, with the steward there to answer them. If not, {location} will '
        + 'think less of {actor}.',
      successAfterimage: 'Asked to write out the charter\'s first line, {cast:forger} wrote it in the same hand as the '
        + 'count\'s copy.',
      failureAfterimage: 'Each clerk wrote the line in a plain, careful hand, and {actor} could not say which of them made '
        + 'the copy.',
      successAtCostAfterimage: '{cast:forger} wrote in the same hand as the count\'s copy, but the steward sent the clerk out of '
        + '{location} before the council could hold anyone.',
      criticalSuccessAfterimage: '{cast:forger} wrote out the charter\'s first line in the same hand as the count\'s copy, then '
        + 'said the steward had ordered it.',
      criticalFailureAfterimage: '{actor} named the wrong clerk, and the steward had that clerk\'s own letters read out to prove '
        + 'it.',
      successMetadata: {
        effects: [
          {
            kind: 'reputation_with',
            targetLocationId: '$here',
            delta: 0.06,
          },
          {
            kind: 'intelligence',
            category: 'political_secret',
            label: 'Who forged the count\'s charter',
            detail: 'One of the count\'s steward\'s own clerks wrote the count\'s copy of the charter.',
            reliability: 0.85,
            targetAgentId: '$actor',
          },
          {
            kind: 'encounter_seed',
            templateId: 'town.charter_inquest_heard',
            targetAgentId: '$actor',
            delayTicks: 36,
            inheritContext: true,
            seedLabel: 'The findings are read out at the inquest on court day, with the count\'s steward there to answer '
              + 'them.',
            appointment: {
              locationId: '$here',
              counterpartyId: '$cast:steward',
              missed: {
                templateId: 'town.charter_inquest_defaulted',
                seedLabel: 'The findings were not read on court day, and the count\'s steward comes looking for the master '
                  + 'who made them.',
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
        tags: ['insight', 'social'],
      },
      nudges: [
        {
          id: 'charter.wake_old_guilt',
          name: 'Wake Old Guilt',
          sphere: 'mind',
          essenceCost: 2,
          forecastDelta: 0.11,
          imageTag: 'generic.memory',
          effectLine: 'Send the count\'s clerks a night of bad dreams, so the one who made the copy comes to the table '
            + 'shaking.',
          bandProse: {
            critical_success: '{cast:forger} came to the table grey from a night without sleep, and could not hold the pen '
              + 'still.',
            success: 'One clerk came to the table without sleep, and it was {cast:forger}.',
            near_miss: 'One clerk came to the table shaking, but the steward said the clerk was only ill.',
            failure: 'The bad dreams found all three clerks, and every one of them came to the table shaking.',
          },
        },
        {
          id: 'charter.crack_the_inkwell',
          name: 'Crack The Inkwell',
          sphere: 'chaos',
          essenceCost: 1,
          forecastDelta: 0.09,
          imageTag: 'generic.luck',
          effectLine: 'Spill ink across the steward\'s papers, so fresh copies must be fetched from the clerks who '
            + 'wrote them.',
          bandProse: {
            success_at_cost: 'Ink ran across the steward\'s papers, and the fresh copies came back in the same hand as the '
              + 'count\'s charter.',
            failure: 'Ink ran across the steward\'s papers, but the steward had the fresh copies written by a town '
              + 'scribe.',
            critical_failure: 'Ink ran across the steward\'s papers, and the steward blamed {actor} for it in front of the '
              + 'council.',
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
      reuseNpcRoles: ['steward', 'noble'],
      supportRole: 'count\'s steward',
      spawnNpcRole: 'steward',
      spawnName: 'Aldric Vane',
    },
    {
      kind: 'actor',
      key: 'forger',
      delivery: 'lazy-materialize-on-trigger',
      persistence: 'must-persist',
      supportRole: 'count\'s clerk',
      spawnNpcRole: 'clerk',
      spawnName: 'Wat Penrose',
    },
  ],
  narrativeTemplates: {
    initiation: 'The town\'s charter in {location} has been called a forgery, and the town council has sent for a '
      + 'master to read it.',
    success: 'The forger was named, and the findings go before the inquest on court day.',
    failure: 'No forger was named.',
  },
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview: 'The town\'s charter in {location} has been read against the count\'s copy.',
      changes: [],
      reactions: [],
      byOutcome: {
        critical_success: {
          overview: 'The council locked both copies in the town chest under its own seal, with the steward watching.',
          changes: [
            {
              id: 'charter.crit.the_towns_regard',
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
              title: 'A charter defended',
              causeClause: 'The council\'s word on it',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'charter.crit.who_forged_it',
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
                  text: 'who wrote the count\'s copy',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Who forged it',
              causeClause: 'Made in the steward\'s household',
              detail: '{actor} knows who wrote the count\'s copy of the charter.',
            },
            {
              id: 'charter.crit.court_day',
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
                  text: 'answers the findings',
                },
              ],
              title: 'The inquest',
              causeClause: 'Court day in the town hall',
              detail: '{cast:steward} answers the findings in {location} in three days.',
            },
          ],
        },
        success: {
          overview: 'The council has the findings in writing, signed by {actor}.',
          changes: [
            {
              id: 'charter.win.the_towns_regard',
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
              title: 'A charter defended',
              causeClause: 'The council\'s word on it',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'charter.win.who_forged_it',
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
                  text: 'who wrote the count\'s copy',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Who forged it',
              causeClause: 'Made in the steward\'s household',
              detail: '{actor} knows who wrote the count\'s copy of the charter.',
            },
            {
              id: 'charter.win.court_day',
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
                  text: 'answers the findings',
                },
              ],
              title: 'The inquest',
              causeClause: 'Court day in the town hall',
              detail: '{cast:steward} answers the findings in {location} in three days.',
            },
          ],
        },
        success_at_cost: {
          overview: 'The council has the findings, but with the clerk gone they rest on {actor}\'s word alone.',
          changes: [
            {
              id: 'charter.cost.the_towns_regard',
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
              title: 'A charter defended',
              causeClause: 'The council\'s word on it',
              detail: '{location} thinks well of their work.',
            },
            {
              id: 'charter.cost.who_forged_it',
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
                  text: 'who wrote the count\'s copy',
                  tooltipId: 'ui.knowledge',
                },
              ],
              title: 'Who forged it',
              causeClause: 'Made in the steward\'s household',
              detail: '{actor} knows who wrote the count\'s copy of the charter.',
            },
            {
              id: 'charter.cost.court_day',
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
                  text: 'answers the findings',
                },
              ],
              title: 'The inquest',
              causeClause: 'Court day in the town hall',
              detail: '{cast:steward} answers the findings in {location} in three days.',
            },
          ],
        },
        failure: {
          overview: 'The council has no answer for the count\'s lawyers, and it sent for a master to give it one.',
          changes: [
            {
              id: 'charter.lost.the_towns_regard',
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
              title: 'A charter left undefended',
              causeClause: 'No forger named',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
        critical_failure: {
          overview: 'The count\'s lawyers now have a master\'s mistake to use against the town\'s charter.',
          changes: [
            {
              id: 'charter.broke.the_towns_regard',
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
              title: 'A wrong word',
              causeClause: 'Said before the council',
              detail: '{location} thinks less of their work.',
            },
          ],
        },
      },
    },
  },
  description: 'A master two-step Eye job for a town: weigh the town\'s charter of liberties against the '
    + 'count\'s rival copy (hands, inks, seals), then name which of the count\'s steward\'s clerks '
    + 'forged it. Naming the forger earns the town\'s regard and the knowledge of who wrote the false '
    + 'copy, and plants an appointment to read the findings at the inquest in the town hall on court '
    + 'day in three days (kept, the inquest-heard sequel; missed, the inquest-defaulted sequel). '
    + 'Failing costs the town\'s regard.',
  locationSubtypes: expandSettings(['urban']),
  consequenceDraw: ['knowledge', 'story_seed'],
};

export const FORGED_CHARTER_INQUEST_TEMPLATE: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
