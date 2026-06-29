/**
 * The Comet at the Turning — cosmic-scale branching encounter (THR-466).
 *
 * A threaded prophet stands at the turning of an age. A comet crosses the sky,
 * and the whole world looks up at once, waiting to be told what it means. The
 * god can pour the vastness through the prophet — open them until they read the
 * omen as the end of the old order, and proclaim the turning — or stay its hand
 * and let the frightened, faithful human read the human meaning: hold fast, the
 * sky is only the sky, the age endures.
 *
 * Reach: star (Wanderer ↔ Anchor). Scale: cosmic — the proclamation reshapes the
 * fate of nations, not one settlement.
 *
 * Player-as-god framing: both choices are god-actions. "Open the vastness" is
 * active intervention (coercive amplification). "Let them read it" is divine
 * restraint — the always-valid "let them handle it," which tilts Anchor because
 * an un-amplified mortal, reading the sky alone, reaches for reassurance.
 *
 * TODO(THR-498): repeatability: 'unique' — bespoke cosmic marquee, fire ≤1×/playthrough.
 * Field does not exist on UnifiedActionTemplate until THR-498 lands.
 *
 * Authored directly to the exemplar quality bar (rival-shrine-betrayal 10/10,
 * flawed-steel 9/10) rather than via the 4-pass encounter-pipeline, which is not
 * supervisable inside an automated single-issue run. Held to the editorial REVISE
 * triggers: approach prose at every step, scene-specific god-verbs, cool failure
 * at every branch, human consequences over mechanical labels.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — The Sky Opens. The comet crosses; the prophet looks up; the world
 * waits for a reading. Difficulty 0 — the choice is the point, not a roll.
 */
const step0TheSkyOpens: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'For three nights the comet had hung in the western sky like a wound that would not close, and on the ' +
    'third night the prophet climbed above the rooftops to read it. Below, the whole settlement had gone ' +
    'quiet in the particular way of people who have stopped pretending the sky is ordinary. Couriers waited ' +
    'at the foot of the hill with horses already saddled; whatever the prophet said by morning would be ' +
    'carried to the capitals before the comet rose again, and the capitals would carry it to the nations, ' +
    'and the nations would decide — on the strength of one mortal\'s upturned face — whether this was the ' +
    'hinge of the age or merely a light in the dark. The prophet did not yet know which. They knew only ' +
    'that they were the one looking, and that the world had agreed to believe them. The god stood with ' +
    'them at the top of the hill, in the cold, where the comet\'s light fell on both alike.',
  successAfterimage: 'The prophet stood beneath the comet, and a waiting world held its breath.',
  failureAfterimage: 'The prophet faltered at the threshold of the reading, and the cold crept in.',
};

/**
 * Step 1 — Proclaim the Turning (Wanderer). The god opens the prophet to the
 * vastness until the omen reads as an ending; they proclaim the age must move on.
 * The proclamation can land or fumble — carrying a world-shaking prophecy is hard.
 */
const step1ProclaimTheTurning: ActionStep = {
  reach: 'star',
  duration: { min: 3, max: 4 },
  difficulty: 0.5,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god opened the prophet the way one opens a window onto a height — and the prophet felt the age ' +
    'beneath them go suddenly small, one breath among uncountable breaths, a candle the cosmos had lit and ' +
    'would, in its own time, set down. There was no fear in it, only a terrible spaciousness: the certainty ' +
    'that everything held to be permanent was a guest in a house that had stood before it and would stand ' +
    'after. When the prophet came down at dawn they did not soften it. They told the couriers the truth they ' +
    'had been given — that the old order had reached the end of its turning, that thrones and borders and ' +
    'the long sleep of custom were ending, and that the only sin left was to cling. The couriers rode. The ' +
    'words went out to reshape the fate of nations, and a god had set them loose.',
  successAfterimage: 'The prophet proclaimed the turning, and the comet\'s reading rode out to the nations.',
  failureAfterimage:
    'The vastness came too fast; the prophet spoke the turning in a voice that shook, and half the couriers ' +
    'rode out carrying a prophecy and half carrying a rumor that the seer had lost their nerve.',
  successMetadata: { reputationDelta: 0.18 },
  failureMetadata: { reputationDelta: -0.12 },
};

/**
 * Step 1 — Let Them Read It (Anchor / divine restraint = "let them handle it").
 * The god stays its hand and steadies only the prophet's footing; the human reads
 * the human meaning — reassurance, continuity, hold fast.
 */
const step1LetThemReadIt: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god did not pour. It only steadied the prophet\'s footing on the cold hill, the way you might ' +
    'put a hand to the back of someone leaning too far over an edge, and let them read the sky as the ' +
    'mortal they were. And a mortal, alone under a comet, with a settlement of frightened people praying ' +
    'at the foot of the hill, reaches for the meaning that lets everyone sleep. By dawn the prophet had ' +
    'found it: the comet was a sign, yes, but a sign of constancy — that the heavens still kept their ' +
    'old appointments, that the age was being watched over, not ended, that the people should hold to ' +
    'what they knew and not be moved. The couriers carried reassurance to the capitals. The nations ' +
    'exhaled. Something that had wanted to be born under that light went quietly back to sleep, unmade ' +
    'and unmourned, and only the god knew it had ever stirred.',
  successAfterimage: 'The prophet read continuity in the comet, and a frightened world was told to hold fast.',
  failureAfterimage:
    'The prophet reached for reassurance and could not quite close their hand on it; the reading came out ' +
    'hedged, and the nations were left to argue over what the hedging meant.',
  successMetadata: { reputationDelta: 0.1 },
  failureMetadata: { reputationDelta: -0.08 },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    proclaim_the_turning: step1ProclaimTheTurning,
    let_them_read_it: step1LetThemReadIt,
  },
  fallback: { ...step1LetThemReadIt },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

const TURNING_AFTERMATH = {
  overview:
    'A prophecy of endings does not arrive like weather; it arrives like a crack running through ice. In ' +
    'the first season nothing visibly broke. Then a border lord, reading the comet as license, let fall a ' +
    'claim his grandfather had only ever whispered. A guild that had governed a craft for two centuries ' +
    'found its apprentices suddenly unwilling to wait their turn. Pilgrims left their fields and walked ' +
    'toward the horizon for no reason they could name except that a prophet had told them the world was ' +
    'allowed to move. Not all of it was ruin and not all of it was freedom; it was simply the turning, ' +
    'and the god had been the one to whisper *now*. The old order would not end in a year. But it had ' +
    'been told, on the authority of heaven, that it was permitted to.',
  changes: [
    {
      id: 'turning_age_proclaimed',
      kind: 'future_hook' as const,
      title: 'The Age Was Told to Turn',
      detail:
        'The comet was proclaimed an ending. Across the nations, what was settled has begun to come ' +
        'unsettled — claims reopened, customs questioned, the long sleep of permanence disturbed. The ' +
        'turning is slow and irreversible.',
      polarity: 'mixed' as const,
    },
    {
      id: 'turning_prophet_renown',
      kind: 'reputation' as const,
      title: 'The Seer Who Named the Hinge',
      detail:
        'The prophet is now the one who read the turning of the age. Their word carries the weight of ' +
        'a fulfilled omen — and the resentment of everyone the turning unseats.',
      polarity: 'mixed' as const,
    },
    {
      id: 'turning_displaced',
      kind: 'future_hook' as const,
      title: 'Those the Turning Unseats',
      detail:
        'Every ending makes refugees of those who built their lives on the thing that ended. The ' +
        'dispossessed of the old order will look for a god — to curse, or to follow.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The age has been told to turn. The nations are coming unsettled, and the displaced are looking for ' +
    'somewhere to put their faith or their grief. What does the god do with a world it has set loose?',
  reactions: [
    {
      id: 'turning_react_fan_the_wandering',
      label: 'Fan the wandering. Send the freed toward the horizon.',
      intent:
        'Lean into the turning. Steady the pilgrims who have left their fields, bless the roads that lead ' +
        'away from the old certainties, and let the age dissolve toward whatever comes next — Wanderer to ' +
        'the bone.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'age_turned_wanderer',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god who named the turning now blesses the roads that lead away from it — pilgrims and ' +
            'the dispossessed alike walk toward a horizon no map yet covers.',
          significance: 0.85,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'star.wider_pilgrimage',
          delayTicks: 16,
          priority: 1.2,
          seedLabel: 'The wandering after the turning',
        },
      ],
    },
    {
      id: 'turning_react_walk_among_displaced',
      label: 'Walk among the displaced. Catch what the turning throws down.',
      intent:
        'Take responsibility for the cost. Move the god\'s attention to those the ending has unhoused — ' +
        'the unseated lord, the apprentice with no guild, the farmer who walked away from a field that ' +
        'was feeding them. An age that turns leaves casualties; a god can choose to be present for them.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'age_turned_shepherd',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god turns toward the wreckage of the old order — not to mourn it, but to be there for ' +
            'the ones it falls on. The turning has a shepherd as well as a herald.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'star.referred_pilgrim',
          delayTicks: 12,
          priority: 1.1,
          seedLabel: 'A casualty of the turning seeks the god',
        },
      ],
    },
  ],
} as const;

const ANCHORED_AFTERMATH = {
  overview:
    'Reassurance, given from a height, is a kind of architecture: it holds things up. The prophet\'s reading ' +
    'of continuity travelled the same roads a prophecy of endings would have, and where the one would have ' +
    'cracked the ice, this one thickened it. Border lords let their grandfathers\' claims keep sleeping. ' +
    'Apprentices went back to waiting their turn. The pilgrims who had begun to drift toward the horizon ' +
    'turned around at the news that heaven, after all, kept its old appointments, and went home to fields ' +
    'that were glad to have them. It was not nothing. A great deal of grief was prevented. And somewhere ' +
    'beneath the steadied surface, the thing that had wanted to be born under that comet lay still, and ' +
    'the god — who had felt it stir, and chosen restraint — was the only one who would ever grieve it.',
  changes: [
    {
      id: 'anchored_age_held',
      kind: 'future_hook' as const,
      title: 'The Age Was Told to Hold',
      detail:
        'The comet was read as constancy. The old order is reassured, intact, and a little more certain ' +
        'of its own permanence than it was before — for good and for ill. What was settled stays settled.',
      polarity: 'mixed' as const,
    },
    {
      id: 'anchored_grief_prevented',
      kind: 'reputation' as const,
      title: 'The Grief That Did Not Come',
      detail:
        'The displacements, the unseatings, the long sad roads of an ending age — none of them happened. ' +
        'No one will ever know they were spared, least of all the people who were spared them.',
      polarity: 'gain' as const,
    },
    {
      id: 'anchored_unborn',
      kind: 'future_hook' as const,
      title: 'The Thing Left Unborn',
      detail:
        'Something wanted to come into the world under that light and was, by the god\'s restraint, ' +
        'denied. It will not stir again soon. Only the god knows what was not allowed to begin.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The age has been told to hold. The people are reassured and the grief was prevented, but a god knows ' +
    'the cost of constancy. What does the god do with a world it has steadied?',
  reactions: [
    {
      id: 'anchored_react_deepen_the_anchor',
      label: 'Deepen the anchor. Make the constancy a covenant.',
      intent:
        'Commit to the holding. Where the prophet gave reassurance, give permanence — bless the customs ' +
        'that endured, steady the thrones that kept their seats, and make of this comet a founding sign ' +
        'that the age was meant to last. Anchor to the bone.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'age_held_anchor',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god who steadied the prophet now blesses the things that held — the old customs become ' +
            'covenants, and the comet is remembered as the sign that the age was meant to endure.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'star.referred_pilgrim',
          delayTicks: 16,
          priority: 1.1,
          seedLabel: 'A keeper of the anchored age seeks the god',
        },
      ],
    },
    {
      id: 'anchored_react_grieve_the_unborn',
      label: 'Grieve the unborn. Keep watch for when it stirs again.',
      intent:
        'Honor what was not allowed to begin. The god alone felt the thing that wanted to be born under ' +
        'the comet; the god alone can keep faith with it — watching the threads for the next thin place ' +
        'where the turning might come around again, and choosing, next time, with open eyes.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'age_held_watchful',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god keeps a private grief for the age that was not allowed to turn, and watches the ' +
            'threads for the next time the sky thins and the choice comes around again.',
          significance: 0.7,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'star.wider_pilgrimage',
          delayTicks: 24,
          priority: 1.0,
          seedLabel: 'The turning comes around again',
        },
      ],
    },
  ],
} as const;

// ─── Template ──────────────────────────────────────────────────────────

export const COMET_AT_THE_TURNING_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'star.turning.comet_omen',
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  name: 'The Comet at the Turning',
  reach: 'star',
  crudType: 'update',
  scale: 'cosmic',

  steps: [step0TheSkyOpens, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  motivations: ['tradition_change', 'revelation_discretion'],

  locationSubtypes: ['settlement', 'town', 'city', 'capital'],

  narrativeTemplates: {
    initiation:
      'A comet hangs in the western sky, and a threaded prophet has climbed above the rooftops to read it ' +
      'while the nations wait. Whatever they proclaim by morning will be carried to the capitals — the end ' +
      'of the age, or the proof that it endures. The god decides what the prophet sees in the sky.',
    success:
      'The prophet reads the comet — as an ending or as a constancy — and the reading rides out to reshape ' +
      'the fate of nations, for good and for ill, on the strength of one upturned face and one god\'s choice.',
    failure:
      'The reading comes out shaken and hedged, and the nations are left to quarrel over what the prophet ' +
      'meant; the omen turns the age all the same, only messier, and no one quite in command of it.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',

  authoredChoices: {
    0: [
      {
        id: 'proclaim_the_turning',
        label: 'Open the vastness to them.',
        intent:
          'Pour the height through the prophet until the age beneath them goes small — one breath among ' +
          'uncountable breaths — and they read the comet as the ending it could be. They will proclaim the ' +
          'turning: that the old order has reached the end of its season and the only sin left is to cling. ' +
          'The words will reshape the fate of nations. Some of what they unseat needed unseating; some of ' +
          'it was holding people up.',
        targetLabel: 'The prophet',
        interventionType: 'coercive',
      },
      {
        id: 'let_them_read_it',
        label: 'Stay your hand. Let them read the sky alone.',
        intent:
          'Pour nothing. Steady only their footing on the cold hill, and let the frightened, faithful human ' +
          'read the human meaning — that the heavens keep their old appointments, that the age is watched ' +
          'over and not ended, that the people should hold fast. The nations will exhale. A great deal of ' +
          'grief will be prevented, and something that wanted to be born under the comet will go quietly ' +
          'back to sleep, mourned by no one but you.',
        targetLabel: 'The prophet',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      proclaim_the_turning: TURNING_AFTERMATH,
      let_them_read_it: ANCHORED_AFTERMATH,
    },
    fallback: { ...ANCHORED_AFTERMATH },
  },

  description:
    'A cosmic-scale turning-of-the-age encounter: a threaded prophet reads a comet the whole world is ' +
    'watching, and the god decides whether the omen means an ending or an enduring. Reach: star ' +
    '(Wanderer ↔ Anchor).',
});

export default COMET_AT_THE_TURNING_TEMPLATE;
