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

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch, AftermathVariant, EncounterAftermathChange } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';
import { DEAL_DEFAULT_COUNT } from '../nudge-constants';

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
  // THR-2134: all player text rewritten to Prose Doctrine v2 (opening skeleton).
  narrativeTemplate:
    '{actor}, a prophet, climbs the hill above {location} on the third night of the comet.\n\n' +
    'The whole town has stopped work to watch the sky. Some farmers have already burned their seed ' +
    'grain in fear. Couriers wait below with saddled horses. At dawn they will carry {actor}\'s reading to the capitals, and the nations will act on it.\n\n' +
    '{actor} must say what the comet means: the end of the old age, or a sign that the age holds.',
  successAfterimage: '{actor} kept watch on the hilltop all night, under the comet.',
  failureAfterimage: '{actor} lost their nerve at the top of the hill and nearly came back down.',
  // THR-1667 S3: the missing afterimages. Step 0 is the authored choice, so it
  // carries no hand (a hand on a choice step would replace the fork).
  successAtCostAfterimage:
    '{actor} kept watch through the night, but the cold took the feeling from two fingers for good.',
  criticalSuccessAfterimage:
    'Before dawn, {actor} saw a clear sign in the comet, and is sure of the reading.',
  criticalFailureAfterimage:
    '{actor} slipped on the icy path and cut their head. {actor} will give the reading hurt and shaken.',
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
    'The god shows {actor} how small the age is beside the sky. At dawn {actor} comes down the hill and ' +
    'tells the couriers that the old order is ending. Thrones, borders and old customs will pass, and no ' +
    'one should cling to them. The couriers ride for the capitals.',
  successAfterimage: '{actor} proclaimed the turning, and the couriers carried it to the nations.',
  failureAfterimage:
    '{actor} spoke the turning in a shaking voice. Half the couriers carried a prophecy, and half carried ' +
    'a rumour that the prophet had lost their nerve.',
  criticalSuccessAfterimage:
    '{actor} spoke with such certainty that the couriers believed every word. Old royal houses began to ' +
    'plan for their own end.',
  criticalFailureAfterimage:
    '{actor} named wars and ruins that were never in the comet. The couriers carried those too, and a ' +
    'peace that would have held is breaking now.',
  // THR-1667 S3: the missing at-cost line and a dealt hand.
  successAtCostAfterimage:
    '{actor} proclaimed the turning, but lost their voice doing it. They whispered the last words to the couriers.',
  deal: { count: DEAL_DEFAULT_COUNT, tags: ['presence', 'lore'] },
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
    'The god holds back and only keeps {actor} steady on the hill. {actor} reads the sky alone, with a ' +
    'frightened town praying below. At dawn {actor} must give the couriers a reading the town can ' +
    'live with.',
  successAfterimage: '{actor} read the comet as constancy, and the nations were told to hold fast.',
  failureAfterimage:
    '{actor} read the comet as constancy, but sounded unsure. Some of the nations doubted the reading.',
  criticalSuccessAfterimage:
    'The reading outlasted the comet. Priests repeated it for a generation as proof that the heavens keep their order.',
  criticalFailureAfterimage:
    '{actor} told the nations to hold fast, though hard years were coming. The nations obeyed and stored no grain.',
  // THR-1667 S3: the missing at-cost line and a dealt hand.
  successAtCostAfterimage:
    '{actor} read the comet as constancy, but kept quiet about a second sign that pointed to an ending.',
  deal: { count: DEAL_DEFAULT_COUNT, tags: ['presence', 'insight'] },
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
    'The nations have been told the age may end. In the first season a border lord pressed an old claim ' +
    'on his neighbour\'s land. Apprentices left their guilds without waiting their turn. Pilgrims left ' +
    'their fields and walked away from home. Some apprentices found new work, and some border towns burned.',
  changes: [
    {
      id: 'turning_age_proclaimed',
      kind: 'future_hook' as const,
      title: 'The Age Told to Turn',
      detail: 'Old claims and customs are being questioned across the nations.',
      polarity: 'mixed' as const,
    },
    {
      id: 'turning_prophet_renown',
      kind: 'reputation' as const,
      title: 'The Seer of the Turning',
      detail: '{actor} is famous now, and resented by everyone the turning unseats.',
      polarity: 'mixed' as const,
    },
    {
      id: 'turning_displaced',
      kind: 'future_hook' as const,
      title: 'Those the Turning Unseats',
      detail: 'People who lost their place are looking for a god to curse or follow.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt: 'Many people have lost their place. Where does the god turn now?',
  reactions: [
    {
      id: 'turning_react_fan_the_wandering',
      label: 'Bless the roads away.',
      intent:
        'Help the pilgrims and wanderers who have left home. The old order loosens faster.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'star.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god blesses the roads that the pilgrims and the dispossessed walk away on.',
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
      label: 'Help those who lost their place.',
      intent:
        'Turn to the people the turning unseated: the lord without land, the apprentice without a guild, ' +
        'the farmer without a field.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'star.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message: 'The god turns to the people the turning unseated, and stays with them.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          query: { kind: 'encounter_template', tags: ['#temple_errand'] },
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
    'The nations have been told to hold fast. Border lords left their old claims alone. Apprentices stayed ' +
    'in their guilds, and the pilgrims went home to their fields.',
  changes: [
    {
      id: 'anchored_age_held',
      kind: 'future_hook' as const,
      title: 'The Age Told to Hold',
      detail: 'The old order is reassured, and surer of itself than before.',
      polarity: 'mixed' as const,
    },
    {
      id: 'anchored_grief_prevented',
      kind: 'reputation' as const,
      title: 'The Grief That Did Not Come',
      detail: 'No one was driven from home or office. No one knows they were spared.',
      polarity: 'gain' as const,
    },
    {
      id: 'anchored_unborn',
      kind: 'future_hook' as const,
      title: 'The Change Left Unbegun',
      detail: 'The old order will not be questioned again for a long time.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt: 'The age holds, and the people are calm. What does the god do next?',
  reactions: [
    {
      id: 'anchored_react_deepen_the_anchor',
      label: 'Make the old ways a covenant.',
      intent:
        'Bless the customs and the rulers that held. The comet is remembered as the sign that the age will last.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'star.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god blesses the customs that held. The comet is remembered as the sign that the age will last.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          query: { kind: 'encounter_template', tags: ['#temple_errand'] },
          delayTicks: 16,
          priority: 1.1,
          seedLabel: 'A keeper of the anchored age seeks the god',
        },
      ],
    },
    {
      id: 'anchored_react_grieve_the_unborn',
      label: 'Wait for the turn to come again.',
      intent: 'Keep watch for the next sign that could turn the age, and choose again when it comes.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'star.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message: 'The god keeps watch for the next sign that could turn the age.',
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

// ─── Band endings (THR-1667 S3) ───────────────────────────────────────
//
// Every step on both paths continues weakened, so a critical failure is the one
// losing band each path owes (THR-1509 per-path coverage). A band ending retells
// how the existing change landed and keeps only the base chips still true; it
// never adds one (UI Law 56).

/** The subset of a variant's own chips, by id — never a new chip. */
function keepChanges(
  variant: { readonly changes: readonly EncounterAftermathChange[] },
  ids: readonly string[],
): readonly EncounterAftermathChange[] {
  return variant.changes.filter((change) => ids.includes(change.id));
}

// The age was still told to turn, and the turning still unseats people. The
// prophet's renown as the one who read the hinge is what a false reading loses.
const TURNING_ENDINGS: AftermathVariant = {
  ...TURNING_AFTERMATH,
  byOutcome: {
    critical_failure: {
      overview:
        'The prophecy went out wrong. A border lord mustered his men for a war the comet never promised, and ' +
        'his neighbour mustered to meet him. Pilgrims set out for a drowned city that does not exist. The old ' +
        'order is coming apart, but along lines no one chose.',
      changes: keepChanges(TURNING_AFTERMATH, ['turning_age_proclaimed', 'turning_displaced']),
    },
  },
};

// The age was still told to hold, and what wanted to be born still sleeps. The
// grief it prevented is what a wrong reassurance does not prevent.
const ANCHORED_ENDINGS: AftermathVariant = {
  ...ANCHORED_AFTERMATH,
  byOutcome: {
    critical_failure: {
      overview:
        'The nations held fast, as they were told. Border lords stayed behind walls that are already failing. ' +
        'The pilgrims went home to fields that cannot feed them through the hard years ahead. Famine will ' +
        'reach them unprepared.',
      changes: keepChanges(ANCHORED_AFTERMATH, ['anchored_age_held', 'anchored_unborn']),
      reactionPrompt: 'The nations are unready. What does the god do now?',
    },
  },
};

// ─── Template ──────────────────────────────────────────────────────────

export const COMET_AT_THE_TURNING_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'star.turning.comet_omen',
  stakes: {
    goal: 'read the comet as the turning of the age',
    risk: 'send false wars and ruins out as prophecy',
    won: 'proclaimed the turning to the nations',
    lost: 'spoke the turning in a shaking voice',
    lostBadly: 'named false wars and ruins as prophecy',
    arms: {
      let_them_read_it: {
        won: 'told the nations to hold fast',
        lost: 'gave a hedged reading the nations argued over',
        lostBadly: 'told the nations to hold fast before hard years',
      },
    },
  },
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  // THR-1982 — the premise casts a fixed job; a mortal whose trade is outside
  // this list does not draw it (a roleless mortal still does).
  protagonistRoles: ['oracle', 'priest', 'acolyte', 'pilgrim', 'hermit', 'herald', 'chaplain', 'warrior_priest'],
  name: 'The Comet at the Turning',
  reach: 'star',
  crudType: 'update',
  scale: 'cosmic',

  steps: [step0TheSkyOpens, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  motivations: ['tradition_novelty', 'revelation_discretion'],

  // THR-1515: `settlement` dropped — no location carries that subtype, so it gated nothing.

  locationSubtypes: ['town', 'city', 'capital'],

  narrativeTemplates: {
    initiation:
      'A comet hangs in the sky, and a threaded prophet must tell the nations what it means: the end of the ' +
      'age, or a sign that it holds. A god can sway the reading.',
    success:
      'The prophet reads the comet, and couriers carry the reading to the nations.',
    failure:
      'The prophet\'s reading comes out shaken, and the nations argue over what it meant.',
  },


  authoredChoices: {
    0: [
      {
        id: 'proclaim_the_turning',
        label: 'Show them the size of the sky.',
        intent:
          'Make the age look small to the prophet, and push them toward a reading of endings.',
        targetLabel: 'The prophet',
        essenceCost: 2, // THR-1800 — the god's push is paid for
        interventionType: 'coercive',
      },
      {
        id: 'let_them_read_it',
        label: 'Hold back. Let them read the sky alone.',
        intent: 'Push nothing. Only keep the prophet steady on the cold hill, and let them decide alone.',
        targetLabel: 'The prophet',
        essenceCost: 0, // THR-1800 — staying your hand costs nothing
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      proclaim_the_turning: TURNING_ENDINGS,
      let_them_read_it: ANCHORED_ENDINGS,
    },
    fallback: { ...ANCHORED_ENDINGS },
  },

  description:
    'A comet crosses the sky, and a prophet must tell the nations whether the age is ending or holding. '
    + 'A god can sway the reading.',
});

export default COMET_AT_THE_TURNING_TEMPLATE;
