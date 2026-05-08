/**
 * The Brink Rescue — linear encounter with branching on the method.
 *
 * Someone is dying. The god senses the quintessence-thread pulling taut —
 * not breaking, not yet, but drawn to the limit that precedes breaking.
 * A fire, a drowning, a collapse: the specific disaster is local color.
 * The god's work is the same in any of them. The ward discovers itself
 * in the survivor's hands when they come back to themselves.
 *
 * Seeds: Hearthglass Ward on successful rescue.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';
import { parseEncounterContract } from '../encounter-contract-validators';
import type {
  EncounterArchetypePole,
  EncounterChoiceCost,
  EncounterChoiceReach,
  EncounterContract,
} from '../../types/encounter-contract';
import { MORAL_AXIS_POLES_BY_REACH, QUINTESSENCE_POLES } from '../../types/encounter-contract';

// ─── Support Bundle ──────────────────────────────────────────────

const survivorSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'survivor',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['laborer', 'farmer', 'dockworker', 'villager'],
  supportRole: 'person_in_danger',
  spawnNpcRole: 'laborer',
  spawnName: 'Pell Osran',
};

const bystanderSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'bystander',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['neighbor', 'guard', 'merchant', 'villager'],
  supportRole: 'witness',
  spawnNpcRole: 'laborer',
  spawnName: 'Nessa Vert',
};

const siteSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'disaster_site',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'scene-only',
  sublocationTypeId: 'sublocation-type.ruins',
  fallbackName: 'The Disaster Site',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  survivorSpec,
  bystanderSpec,
  siteSpec,
];

// ─── Step Definitions ────────────────────────────────────────────

/**
 * Step 0: The Thread Pulls Taut.
 * The god senses the quintessence-thread about to break.
 * Difficulty 0 — perceiving the emergency is not the challenge.
 * The choice is how to act.
 */
const step0TheThreadPullsTaut: ActionStep = {
  reach: 'star',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god felt it before it was visible: a quintessence-thread going taut in the weave of the settlement\'s ordinary morning. Not every thread in a settlement pulls like this. Most of them drift in the slow current of lives being lived without crisis, and the god had learned to distinguish between the tension of someone who is merely afraid and the tension of someone who is about to stop existing. This was the second kind. It had the specific vibration of a thread that was being drawn to its tensile limit — not fraying, not yet, but near enough that the difference between these two conditions would be decided in the next few minutes rather than the next few hours.\n\nThe disaster had begun with something ordinary, the way disasters usually begin. A cook-fire that spread when a spark caught the thatch of the building that shared a wall with the warehouse. A timber in the grain store that had been water-compromised for three seasons and had finally stopped holding. A section of dock that had been repaired once too often with wood that was not rated for the weight it was asked to carry. The specifics were local color; the god had seen the pattern enough times to recognize it in any setting. What mattered was that Pell Osran was inside whatever was collapsing or burning or flooding, and the settlement\'s morning was not going to produce anyone capable of getting him out before the thread broke.\n\nNessa Vert was already at the perimeter of the disaster, shouting in the direction of the entrance with the particular desperation of someone who has been shouting for long enough to know that shouting is insufficient and has not yet been presented with an alternative. She was holding a length of rope that she had grabbed from somewhere, because she was the kind of person who grabbed a length of rope from somewhere when something went wrong, but the rope was not usable at a safe distance from the fire or the collapse, and Nessa Vert was a practical person who understood that going to where the rope was usable was a question of whether she trusted the structure to hold her long enough to be useful. She did not trust it. She was still holding the rope. She was still shouting.\n\nThe quintessence-thread pulled another degree toward its limit, and the god made its choice.',
  successAfterimage: 'The god perceived the thread pulling taut and chose how to act before it broke.',
  failureAfterimage: 'The god perceived the crisis but arrived at the moment of it without clarity about how to act.',
};

/**
 * Step 1 — Thread the Survivor Out variant.
 * The god works directly on the structural conditions — the path through
 * the smoke and collapse, the moment a beam holds that should not have held.
 * Star reach at difficulty (0.45) — working with physical forces is precise work.
 */
const step1ThreadTheSurvivorOut: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0.45,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.08 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.04 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god\'s attention moved through the structure like water finding its level, reading the load distribution and the points of contact and the places where mass was bearing on compromised material. There was a path. There was almost always a path, if the one who needed it could find it without the three seconds of hesitation that the human mind requires when confronted with the experience of imminent structural failure. The god removed the hesitation.\n\nPell Osran moved as if he knew where he was going, which was not precisely true but was close enough. The god\'s work was in the confidence — not the knowledge, which Pell did not have, but the bone-certainty that the next step would hold and the following turn would lead toward air and light and the world on the other side of the smoke. When the crossbeam above him cracked — not broke, cracked, which was a different thing, enough to hold for eleven more seconds before it would no longer be a question of cracking — Pell did not look up. He turned left instead of right, which the god had made feel like his own choice rather than a correction, and the eleven seconds were more than sufficient.\n\nNessa Vert had moved to the only position from which the rope was useful by the time Pell reached the perimeter. She did not ask later how she had known to move there. She remembered deciding to do it, which was accurate as far as her memory of the event was concerned. The god had arranged the sequence of small conditions — a gap in the smoke that let her see the position, a shift in the crowd that cleared her path to it — that made her decision obvious in the moment she made it. Pell\'s hands found the rope. The beam behind him completed its failure and brought down the section of wall it had been holding, which was load-bearing only for what was behind it, not for what was in front of it, which was now Nessa Vert\'s rope and the open air of the settlement\'s morning.\n\nPell Osran sat in the street and coughed and did not speak for some time. In his coat pocket, which he did not check until he was sitting in Nessa Vert\'s kitchen an hour later with a cup of something warm, there was a small object he did not remember placing there: a bubble of glass with a coal-dark core, warm to the touch. He held it to the light and felt the warmth of it against his palm and could not explain what it was or where it had come from, but the explanation seemed less important than the fact of the warmth, which was present and specific and felt like something that had been given rather than found.',
  successAfterimage: 'The path through the collapse revealed itself to Pell step by step. He came out with the ward in his pocket.',
  failureAfterimage: 'The god\'s thread through the structure could not find a path that held. The beam came down before Pell reached it.',
};

/**
 * Step 1 — Work Through the Bystander variant.
 * The god works on Nessa Vert — investing enough courage in the bystander
 * that she goes in with the rope. Iron/Heart reach at difficulty (0.40).
 */
const step1WorkThroughTheBystander: ActionStep = {
  reach: 'iron',
  duration: { min: 2, max: 3 },
  difficulty: 0.40,
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.06 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.06 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god did not go into the structure. The god went into Nessa Vert instead — not with force, not with override, but with the particular quality of attention that locates the source of courage in a person and shows it to them without making it larger than it already is. Nessa Vert was already holding the rope. She had already assessed the structure and made a calculation about the risk of entering it. The calculation said no. The god did not change the calculation. The god found the part of her that had grabbed the rope before the calculation was finished and let it be seen by the rest of her, and let the rest of her make a different decision than the calculation would have produced on its own.\n\nShe went in through the gap in the east wall where the smoke was thinnest. The rope was tied to the iron ring of the grain store loading gate, which was structural and had not been involved in the fire or the collapse — the god had noticed this and placed the noticing where Nessa could act on it. She moved through the smoke with a cloth pressed to her face and the particular speed of someone who has decided that speed is the only variable she controls and has therefore decided to control it completely. She found Pell Osran in the inner room, conscious but disoriented, unable to determine which direction to move through the smoke to reach the outside.\n\nThe return was slower. Pell was heavier than Nessa had accounted for and the footing was uncertain and the smoke was thicker coming back through a route that was now also carrying the heat of the fire on the structure\'s east side. But the god was still there, in the back of Nessa\'s spine where courage lives in the body, and the combination of that presence and her own stubbornness and the rope she had tied to a structural piece of iron was sufficient. They came out through the gap in the east wall with Pell\'s arm over Nessa\'s shoulder and the rope wrapped twice around her wrist in case one of them fell.\n\nPell recovered in the street. Nessa sat down next to him and shook for a few minutes, which was the appropriate physiological response to what she had just done, and then stopped shaking, which was the appropriate response to finishing shaking. The god felt the quintessence-thread go slack and then return to its normal tension, which was different from the tautness of approach and felt, in the way that physics has no name for, like relief. In Pell\'s coat pocket, which neither of them checked until later, the small glass object was warm against the cloth.',
  successAfterimage: 'Nessa went in with the rope and came back with Pell. The ward found its way into his pocket before anyone thought to put it there.',
  failureAfterimage: 'The god\'s investment in Nessa\'s courage was not enough to move her past the calculation. She held the rope and could not make herself cross the threshold.',
};

/**
 * Step 1: Branch point.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    thread_the_survivor_out: step1ThreadTheSurvivorOut,
    work_through_the_bystander: step1WorkThroughTheBystander,
  },
  fallback: { ...step1ThreadTheSurvivorOut },
};

// ─── Aftermath Config ────────────────────────────────────────────

const THREAD_OUT_AFTERMATH = {
  overview:
    'The settlement\'s morning resumed around the disaster site the way mornings resume around disasters when the disaster has ended without fatalities: with the particular efficiency of people who have been frightened and are glad they don\'t have to process grief. The structure was a loss — or the section of dock was, or the warehouse, depending on which specific form the crisis had taken — and the loss was real and material and would require accounting. But Pell Osran was sitting in Nessa Vert\'s kitchen drinking something warm, and no one had died, and that fact reorganized the morning around itself as the primary event.\n\nNessa Vert had not gone in. She had held the rope from the outside, which was the position she had been in when the crisis resolved, and when people asked her about it afterward she described her role accurately, without false modesty and without the particular inflation that witnesses sometimes apply to their own actions in crisis narratives. She had been there. She had had the rope. She had not gone in. What she also did not say — because she did not have language for it — was that at some point during the crisis she had felt certain, with a certainty she could not trace to any specific observation, that the rope was not going to be needed, that whoever was inside was going to find their own way out. This certainty had turned out to be correct, which she experienced as having been right rather than as having been told.',
  changes: [
    {
      id: 'thread_pell_survived',
      kind: 'reputation' as const,
      title: 'Pell Osran',
      detail: 'Alive. Carries the ward without knowing what it is. The quintessence-thread has returned to normal tension.',
      polarity: 'gain' as const,
    },
    {
      id: 'thread_nessa_present',
      kind: 'reputation' as const,
      title: 'Nessa Vert',
      detail: 'Held the perimeter with a rope. Did not need to go in. She does not know why she was certain she did not need to.',
      polarity: 'mixed' as const,
    },
    {
      id: 'thread_ward_granted',
      kind: 'item' as const,
      title: 'Hearthglass Ward',
      detail: 'A bubble of furnace glass with a coal-dark core, warm to the touch. Placed in Pell\'s pocket by the god\'s work through the structure. It will activate once to prevent quintessence loss, then shatter.',
      polarity: 'gain' as const,
    },
    {
      id: 'thread_settlement_remembers',
      kind: 'future_hook' as const,
      title: 'A Rescue Without Explanation',
      detail: 'No one can explain how Pell found the exit. The settlement will discuss this quietly. The god may have planted a question about the nature of providence in the community.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'Pell is alive. The thread has gone slack. What does the god do with what remains?',
  reactions: [
    {
      id: 'thread_react_release',
      label: 'Release the thread entirely.',
      intent: 'The god withdraws from Pell Osran and from the disaster site. The ward is in his pocket and it will do what it does when it is needed. There is no further claim on him. The quintessence-thread that pulled taut is now his own to manage.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god releases its attention from the rescue. Pell Osran carries the ward into the ordinary morning.',
          significance: 0.4,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'thread_react_watch_survivor',
      label: 'Watch what he does with the extra morning.',
      intent: 'Someone who has just been given back a morning they were about to lose does something with it that they would not have done otherwise. The god stays close to Pell Osran — not invested, not directing, but watching what an unexpected survivor decides to do with the time they were almost out of.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'debt' as const,
          severity: 0.3,
          label: 'Pell Osran — survived by divine work. Watched for what he does with the extra time.',
          revealFamilies: ['liminal.quest', 'star', 'quintessence'],
        },
      ],
      closeAfterSelection: true,
    },
  ],
} as const;

const BYSTANDER_AFTERMATH = {
  overview:
    'Nessa Vert sat on the step outside her kitchen door for an hour after Pell had stopped shaking. She was not shaking anymore herself, but she was also not quite ready to go back inside where the cup was and the warmth was and the ordinary texture of the morning before the disaster. What she was doing was processing the fact that she had gone into a burning building — or a collapsing one, or a flooding one — with a rope and come back out with Pell Osran and no injury more serious than smoke in her lungs that would clear by tomorrow. She had done this. She knew she had done this. She could not fully account for the certainty she had felt when she crossed the threshold, or where it had come from, or why it had stayed present through the entire route in and the slower route out.\n\nPell, inside at the kitchen table, was holding the glass object he had found in his pocket and not speaking. He was turning it over in his hands, feeling the warmth that persisted in the coal-dark core, and feeling, alongside the warmth, something he would later describe to Nessa as the sense that someone had been paying attention at the right moment. Not to him specifically — he was not important enough for that, he told her, which she told him was not the right way to think about it, which he did not know how to argue with but felt was correct. Something had been paying attention. Whatever had been paying attention had apparently decided he should keep being alive, which was a decision he was in full agreement with, though he was uncertain what had informed it.',
  changes: [
    {
      id: 'bystander_pell_survived',
      kind: 'reputation' as const,
      title: 'Pell Osran',
      detail: 'Alive, rescued by Nessa. Carries the ward without understanding it. The thread is slack.',
      polarity: 'gain' as const,
    },
    {
      id: 'bystander_nessa_marked',
      kind: 'reputation' as const,
      title: 'Nessa Vert',
      detail: 'Did something she cannot fully explain. The courage that moved her past the threshold was real — it was also not entirely hers.',
      polarity: 'gain' as const,
    },
    {
      id: 'bystander_ward_placed',
      kind: 'item' as const,
      title: 'Hearthglass Ward',
      detail: 'Found in Pell\'s pocket. No one put it there in any way either of them can account for.',
      polarity: 'gain' as const,
    },
    {
      id: 'bystander_nessa_changed',
      kind: 'future_hook' as const,
      title: 'Nessa Vert, Changed',
      detail: 'She went in. She came back. She cannot explain the certainty that let her do it. This experience will shape how she responds the next time something requires that quality of commitment.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'Nessa is on the step. Pell is at the table with the ward in his hands. What does the god keep of this?',
  reactions: [
    {
      id: 'bystander_react_leave_them',
      label: 'Leave them to process it themselves.',
      intent: 'Whatever happened in the disaster site is now private between Pell and Nessa and whatever they choose to say about it. The god withdraws its attention from both of them. The ward will do its work when needed. The question of where the courage came from is not one the god will answer.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god releases its attention from the rescue. Nessa and Pell sit with what happened in their own time.',
          significance: 0.4,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'bystander_react_keep_nessa',
      label: 'Keep a thread to Nessa.',
      intent: 'She crossed a threshold that most people do not cross. The god\'s attention was the margin that let her do it, but she chose to use the margin, which is the more important part. A person who has chosen to use divine attention to cross a threshold once may be willing to do so again, and may be worth finding the next time a rope is needed in an impossible place.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'debt' as const,
          severity: 0.4,
          label: 'Nessa Vert — moved by divine courage through a threshold. Thread maintained for future need.',
          revealFamilies: ['liminal.quest', 'iron', 'star'],
        },
      ],
      closeAfterSelection: true,
    },
  ],
} as const;



const ENCOUNTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
const DEFAULT_FORECAST_FACTORS = ['threads shifting'] as const;
const DEFAULT_STATE_DESCRIPTOR = 'no descriptor';
const DEFAULT_TILTS_TOWARD = 'uncertain';
const DEFAULT_FALL_FORWARD = 'the threads tighten';
const DEFAULT_AGENT_REACTION = 'the moment shifts';

const EFFECTIVE_INTERVENTION_TO_COST: Record<EncounterChoiceIntervention, EncounterChoiceCost> = {
  supportive: 'small_breath',
  coercive: 'deep_draught',
  withdrawn: 'small_breath',
};

type EncounterChoiceIntervention = NonNullable<
  NonNullable<UnifiedActionTemplate['authoredChoices']>[number][number]['interventionType']
>;

type EncounterAuthoredChoice = NonNullable<NonNullable<UnifiedActionTemplate['authoredChoices']>[number]>[number];

function toEncounterChoiceCost(choice: EncounterAuthoredChoice): EncounterChoiceCost {
  if (choice.interventionType) {
    return EFFECTIVE_INTERVENTION_TO_COST[choice.interventionType];
  }

  if (choice.essenceCost === undefined || choice.essenceCost <= 1) {
    return 'small_breath';
  }
  if (choice.essenceCost === 2) {
    return 'fuller_breath';
  }
  return 'deep_draught';
}

function toStepFallbackReach(template: UnifiedActionTemplate, stepIndex: number): EncounterChoiceReach {
  const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;
  if (step && 'reach' in step && typeof step.reach === 'string') {
    return step.reach;
  }

  if (step && 'fallback' in step && step.fallback && typeof step.fallback.reach === 'string') {
    return step.fallback.reach;
  }

  return template.reach;
}

function toEncounterChoiceReach(
  template: UnifiedActionTemplate,
  stepIndex: number,
  choice: EncounterAuthoredChoice,
): EncounterChoiceReach {
  const nextStep = template.steps[stepIndex + 1] as UnifiedActionTemplate['steps'][number] | undefined;
  if (
    nextStep &&
    'variants' in nextStep &&
    choice.id &&
    typeof nextStep.variants === 'object' &&
    nextStep.variants !== null
  ) {
    const matchingVariant = (nextStep.variants as Record<string, { reach?: string }>)[choice.id];
    if (matchingVariant && typeof matchingVariant.reach === 'string') {
      return matchingVariant.reach as EncounterChoiceReach;
    }
  }

  return toStepFallbackReach(template, stepIndex);
}

function toEncounterArchetypePole(reach: EncounterChoiceReach, choice: EncounterAuthoredChoice): EncounterArchetypePole {
  const poles = reach === 'quintessence' ? QUINTESSENCE_POLES : MORAL_AXIS_POLES_BY_REACH[reach];
  if (choice.interventionType === 'coercive') {
    return poles[1];
  }
  return poles[0];
}

function encodeEncounterContractMetadata(contract: EncounterContract): string {
  return `${ENCOUNTER_CONTRACT_METADATA_KEY}:${JSON.stringify(contract)}`;
}

function buildFallbackEncounterChoice(template: UnifiedActionTemplate, stepIndex: number, reach: EncounterChoiceReach) {
  const poles = reach === 'quintessence' ? QUINTESSENCE_POLES : MORAL_AXIS_POLES_BY_REACH[reach];
  const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;
  return {
    reach,
    cost: 'small_breath' as const,
    god_verb: `choice-${stepIndex + 1}`,
    agent_reaction: step && 'successAfterimage' in step ? (step.successAfterimage ?? DEFAULT_AGENT_REACTION) : DEFAULT_AGENT_REACTION,
    tilts_toward: DEFAULT_TILTS_TOWARD,
    moral_axis_pole: poles[0],
    fail_forward: step && 'failureAfterimage' in step ? (step.failureAfterimage ?? DEFAULT_FALL_FORWARD) : DEFAULT_FALL_FORWARD,
  };
}

function buildLiteEncounterContract(template: UnifiedActionTemplate): EncounterContract {
  const authoredChoices = template.authoredChoices ?? {};
  const rawStepIndexes = Object.keys(authoredChoices).map((key) => Number(key)).filter((value) => Number.isInteger(value));
  const stepIndexes = (rawStepIndexes.length > 0 ? rawStepIndexes : template.steps.map((_, index) => index)).sort((a, b) => a - b);
  const capabilityAxisReach = template.reach === 'quintessence' ? 'star' : template.reach;

  const beats = stepIndexes.map((stepIndex) => {
    const encounterChoices = (authoredChoices[stepIndex] ?? []) as readonly EncounterAuthoredChoice[];
    const stepReach = toStepFallbackReach(template, stepIndex);
    const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;

    const mappedChoices = encounterChoices.map((choice) => {
      const reach = toEncounterChoiceReach(template, stepIndex, choice);
      return {
        reach,
        cost: toEncounterChoiceCost(choice),
        god_verb: choice.label,
        agent_reaction: choice.intent ?? DEFAULT_AGENT_REACTION,
        tilts_toward: choice.targetLabel ?? DEFAULT_TILTS_TOWARD,
        moral_axis_pole: toEncounterArchetypePole(reach, choice),
        fail_forward: choice.likelyBurden ?? DEFAULT_FALL_FORWARD,
      };
    });

    return {
      title: `Beat ${stepIndex + 1}`,
      forecast_factors: DEFAULT_FORECAST_FACTORS,
      prose: step && 'narrativeTemplate' in step ? (step.narrativeTemplate ?? template.narrativeTemplates.initiation) : template.narrativeTemplates.initiation,
      prose_tooltips: {},
      encounter_choices: mappedChoices.length > 0
        ? mappedChoices
        : [buildFallbackEncounterChoice(template, stepIndex, stepReach)],
    };
  });

  return parseEncounterContract({
    encounter: {
      id: template.id,
      protagonist: 'actor.placeholder',
      category: 'branching',
      rarity_tier: template.rarityTier,
      intrinsic_tier: template.intrinsicTier,
      place: {
        location: 'location.placeholder',
        ambient_state: {},
        painting: template.illustrationUrl ?? '/concept-art/encounters/placeholder.jpg',
      },
      cast: [],
      scene_state: {
        threads_in_play: [],
        factions_here: [],
        place_conditions: [],
        conditions_on_protagonist: [],
      },
      protagonist_view: {
        capability_axes: [capabilityAxisReach, capabilityAxisReach, capabilityAxisReach],
        items_relevant: [],
        vows_active_per_beat: {},
        callback_candidates: [],
        state_descriptor: template.description ?? DEFAULT_STATE_DESCRIPTOR,
      },
      beats,
      aftermath: {
        receipt: template.narrativeTemplates.success,
        changes: [],
      },
      ascendant_hand_filter: {
        eligible: [],
        rare_pulse: [],
      },
    },
  });
}

function withEncounterContract(template: UnifiedActionTemplate): UnifiedActionTemplate {
  const contract = buildLiteEncounterContract(template);
  return {
    ...template,
    illustrationAlt: encodeEncounterContractMetadata(contract),
  };
}

// ─── Template ────────────────────────────────────────────────────

export const BRINK_RESCUE_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'enc.brink_rescue',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Brink Rescue',
  reach: 'star',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheThreadPullsTaut, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['town', 'village', 'settlement', 'docks', 'mine'],
  motivations: ['mercy_ruthlessness', 'sacrifice_survival'],

  narrativeTemplates: {
    initiation:
      'A quintessence-thread pulls taut in the weave of the settlement\'s morning. ' +
      'Someone is about to stop existing inside a burning, flooding, or collapsing structure. ' +
      'The god senses the approach of the breaking point before it is visible.',
    success:
      'The god acts on the disaster — threading the survivor out directly or investing courage ' +
      'in a bystander with a rope — and the quintessence-thread returns to its ordinary tension. ' +
      'The ward finds its way into the survivor\'s pocket.',
    failure:
      'The intervention cannot find the path or cannot move the person who has the rope. ' +
      'The thread breaks. The morning becomes a different kind of morning.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/brink-rescue.jpg',
  illustrationAlt: 'A settlement structure in partial collapse or fire, smoke rising, a bystander at the perimeter holding a coil of rope, and inside — barely visible through the haze — a figure that is still alive',

  authoredChoices: {
    0: [
      {
        id: 'thread_the_survivor_out',
        label: 'Thread the Survivor Out',
        intent:
          'The god moves directly into the disaster — not into the body of the person inside, but into the structure itself, into the geometry of the collapse and the load distribution and the sequence in which things are about to fail. Star-reach attention finds the path through the smoke and the falling things: the beam that will hold for eleven seconds, the gap in the east wall that is structural rather than load-bearing, the turn left that leads to air rather than the turn right that leads to the fire\'s heart. The god makes this path legible to Pell Osran not as instruction but as bone-certainty, so that each step he takes feels like his own decision even though it was read in the physics of the structure minutes before he arrived at it.',
        targetLabel: 'Pell Osran',
        essenceCost: 2,
        likelyBurden:
          'Reading the structure requires reading it correctly. A god that misreads load distribution in a burning building threads a survivor into a beam that falls. Star-reach precision is not infallible when the structure is actively changing around the calculation.',
        interventionType: 'supportive',
      },
      {
        id: 'work_through_the_bystander',
        label: 'Work Through the Bystander',
        intent:
          'Nessa Vert is already at the perimeter with a rope. She has done the calculation about whether to enter the structure and the calculation said no. The god does not override the calculation. The god finds the part of her that grabbed the rope before the calculation was finished and makes it present to the rest of her as a question: if not now, when does the rope become useful? Iron-reach courage flows into the back of her spine, which is where courage lives in the body. What she does with that courage is still her choice. The god\'s investment is in making the choice possible, not in making it for her.',
        targetLabel: 'Nessa Vert',
        essenceCost: 2,
        likelyBurden:
          'Investing divine courage in a person and then having them decide not to use it is a particular kind of failure. If Nessa\'s calculation holds against the investment, the rope stays at the perimeter and the god has spent essence on a decision that was already made.',
        interventionType: 'supportive',
      },
    ],
    1: [
      {
        id: 'hold_the_structure',
        label: 'Hold the Structure',
        intent:
          'The god works at the level of mass and contact and load — precisely enough that the relevant beams hold for the time that is needed, not longer. This is the minimal intervention: not clearing the path, not making Pell faster, just ensuring that the structure does not fail in the specific places and moments that would turn a survivable route into an unsurvivable one. The god counts seconds and load-bearing points and asks the structure for eleven more.',
        essenceCost: 1,
        likelyBurden:
          'Minimal intervention means the path must already be findable. If Pell cannot identify the exit route on his own within the time that the structure holds, the minimal approach is insufficient.',
        interventionType: 'supportive',
      },
      {
        id: 'illuminate_the_route',
        label: 'Illuminate the Route',
        intent:
          'The god goes further: full Star-reach presence in the disaster, reading the structure entirely and making the optimal path legible to Pell as a felt certainty in his body at each decision point. He will not hesitate. He will not choose wrong turns. The god pays attention to every contingency in the route — including the beam that would otherwise fail prematurely — and holds all of it in place until Pell reaches the perimeter. The cost is full investment for the full duration of the exit.',
        essenceCost: 3,
        likelyBurden:
          'Full presence in the structure means the god cannot hedge or hold back any part of the attention. If the route becomes impossible despite full divine investment, the god has spent everything on a outcome that physics refused.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      thread_the_survivor_out: THREAD_OUT_AFTERMATH,
      work_through_the_bystander: BYSTANDER_AFTERMATH,
    },
    fallback: { ...THREAD_OUT_AFTERMATH },
  },

  description:
    'A quintessence-thread pulled taut in the settlement\'s morning weave: someone is dying inside a collapsing or burning structure. ' +
    'The god chooses between threading the survivor out directly or investing courage in a bystander who is already holding a rope.',
});

export const BRINK_RESCUE_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(BRINK_RESCUE_TEMPLATE);
