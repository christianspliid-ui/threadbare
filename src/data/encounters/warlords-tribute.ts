/**
 * Warlord's Tribute — reputation-gated encounter, Iron reach, required-positive.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.iron.positive'] at level 2+ (Known).
 * Pattern: required-positive — encounter surfaces only for agents with recognized martial honor.
 *
 * THR-32: First tranche of reputation-gated content.
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

const warlordSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'warlord',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['warlord', 'captain', 'commander', 'mercenary'],
  supportRole: 'warlord',
  spawnNpcRole: 'mercenary',
  spawnName: 'the Warlord',
};

const hallSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'hall',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'great-hall',
  fallbackName: 'The Warlord\'s Hall',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [warlordSpec, hallSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheHall: ActionStep = {
  reach: 'iron',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The warlord\'s hall smelled of tallow smoke and old iron. Banners hung from the ' +
    'rafters — war-bands that had bled for him, factions that owed their survival to his ' +
    'blade — and the men on the benches had the particular stillness of soldiers who have ' +
    'learned to read a room before they move. When the agent entered, the stillness deepened. ' +
    'Not from fear. From recognition.\n\n' +
    'The warlord himself sat on a raised chair at the hall\'s far end, not a throne but close ' +
    'enough — a statement made of carved oak and elevation rather than jewels. He was watching ' +
    'with the careful, professional attention of a man who had survived his profession long ' +
    'enough to develop a taxonomy of dangerous people. He had clearly placed the agent in a ' +
    'specific category of that taxonomy. The placement, from his expression, was not unflattering.\n\n' +
    '{title}. The guards at the door had parted without being asked. That was how it started ' +
    'with the ones who carried that particular weight. The warlord set down the cup he was ' +
    'holding and made a small gesture that sent most of the room away.',
  successAfterimage: 'The hall fell quiet around the two of them. A recognition between dangerous people.',
  failureAfterimage: 'The hall fell quiet, but the recognition felt different — calculation rather than respect.',
};

const step1AcceptTribute: ActionStep = {
  reach: 'iron',
  duration: { min: 3, max: 4 },
  difficulty: 0.40,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.05 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god settled a current of gravitas through the agent — not heat, not force, but ' +
    'the particular weight of someone who has earned the right to receive what is being ' +
    'offered. The warlord rose from his chair, which he would not have done for most people ' +
    'in that room. He crossed to a locked chest behind the dais and unlocked it with a key ' +
    'he wore at his belt.\n\n' +
    'The tribute was generous: coin enough to matter, and a single short blade — the kind a ' +
    'captain gives to mark an alliance, not the kind they give to arm a soldier. The warlord ' +
    'placed it on the table between them with both hands and stepped back. The men on the ' +
    'benches watched without watching. Everyone understood what was happening. The {title} ' +
    'had walked into their hall and their leader had acknowledged the weight.\n\n' +
    'The agent accepted. Not eagerly — that would have been wrong — but with the particular ' +
    'economy of someone for whom this kind of recognition is not new, and for whom the blade ' +
    'means what the warlord intended it to mean.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: -0.05 },
  successAfterimage: 'The tribute accepted, the alliance acknowledged. The warlord\'s blade rests in the agent\'s keeping.',
  failureAfterimage: 'The tribute felt awkward in its acceptance — something in the weight of the moment failed to land.',
};

const step1DemandOath: ActionStep = {
  reach: 'iron',
  duration: { min: 3, max: 4 },
  difficulty: 0.55,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.15 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god sent a current of demand through the agent — iron-edged, precise, the kind ' +
    'of force that does not ask permission to reshape what it touches. The tribute was not ' +
    'enough. The god wanted the man\'s oath, which was a different thing entirely: not gold, ' +
    'not a blade, but a binding. The room understood this immediately. The men on the benches ' +
    'shifted their weight.\n\n' +
    'The warlord did not sit back down. That was the tell — a man who sits back down is buying ' +
    'time, and this one\'s time had run out. He looked at the agent with the expression of someone ' +
    'who has fought enough battles to know which ones he cannot win before the first blow is struck. ' +
    'The calculation was visible and it was honest. Then he placed his right fist against his chest.\n\n' +
    'He named three conditions. The god accepted one and rejected two. That was not the speech he ' +
    'had prepared — the rejection of the other two was clearly not in the script — but the warlord ' +
    'incorporated the revision without stumbling. Professional. The oath was given in the old form, ' +
    'witnessed by his own commanders, and the room smelled different when it was done: like something ' +
    'that had been one thing was now another thing, and the change could not be undone.',
  successMetadata: { reputationDelta: -0.05 },
  failureMetadata: { reputationDelta: -0.15 },
  successAfterimage: 'An oath extracted under pressure. The warlord gave it, but his commanders saw the cost.',
  failureAfterimage: 'The demand for an oath broke against the warlord\'s pride. He refused — and the hall saw it happen.',
};

const step1WithdrawHand: ActionStep = {
  reach: 'iron',
  duration: { min: 2, max: 3 },
  difficulty: 0.20,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god folded its presence back and let the moment find its own shape. The warlord ' +
    'offered what he had prepared — the coin, the blade, the formal words — and the agent ' +
    'received them with the measured courtesy of someone who neither needed the tribute ' +
    'nor wanted to make its inadequacy visible. A clean exchange. Both parties preserved.\n\n' +
    'The warlord\'s men relaxed in stages, the way soldiers do when the particular kind of ' +
    'tension that means somebody might die has resolved without dying. Someone near the back ' +
    'of the hall let out a breath that the person next to them pretended not to hear.',
  successMetadata: { reputationDelta: 0 },
  failureMetadata: { reputationDelta: 0 },
  successAfterimage: 'A clean exchange, neither pressed nor refused. The warlord\'s hall breathed again.',
  failureAfterimage: 'Withdrawn, but the moment felt incomplete — like a debt deferred rather than settled.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    accept_the_tribute: step1AcceptTribute,
    demand_the_oath: step1DemandOath,
    withdraw_your_hand: step1WithdrawHand,
  },
  fallback: { ...step1AcceptTribute },
};

// ─── Aftermath ───────────────────────────────────────────────────

const ACCEPT_AFTERMATH = {
  overview:
    'The warlord\'s blade was housed in the agent\'s quarters before the evening fires were ' +
    'lit. In the hall, his commanders had gone back to their conversation, but it was a different ' +
    'conversation than before — one that had the agent\'s name in it, used in a specific way. ' +
    'The warlord himself sent three men to the east gate before dawn: an informal honor guard, ' +
    'or something close to it. He would not have done that for a stranger. He was doing it for ' +
    'the {title}, which was a thing he understood even if he would have been hard-pressed to ' +
    'explain why he understood it.',
  changes: [
    {
      id: 'accept_tribute_alliance',
      kind: 'reputation' as const,
      title: 'The Warlord',
      detail: 'A professional alliance acknowledged. The warlord\'s hall knows the agent\'s name now.',
      polarity: 'gain' as const,
    },
    {
      id: 'accept_tribute_blade',
      kind: 'future_hook' as const,
      title: 'The Captain\'s Blade',
      detail: 'The short blade marks an alliance. The warlord\'s men will remember who carries it.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt:
    'The tribute is held. The warlord\'s recognition is real. Choose what you keep from this.',
  reactions: [
    {
      id: 'accept_react_hold_alliance',
      label: 'Hold the alliance close.',
      intent: 'Keep the warlord\'s recognition as a living thread — the alliance will have future weight.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'iron.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The warlord\'s tribute is accepted. The {title}\'s name is spoken differently in that hall now.',
          significance: 0.65,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'iron.alliance',
          delayTicks: 20,
          priority: 1.0,
          seedLabel: 'Warlord calls on the alliance',
        },
      ],
    },
    {
      id: 'accept_react_redistribute',
      label: 'Pass the coin to the settlement.',
      intent: 'The tribute flows through the agent to the people of this place — a different kind of recognition.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The warlord\'s gold finds its way to the settlement\'s common stores. The {title} gives what they were given.',
          significance: 0.55,
        },
      ],
    },
  ],
} as const;

const OATH_AFTERMATH = {
  overview:
    'The oath sat in the warlord\'s chest like a stone he had not chosen to swallow. His ' +
    'commanders were careful with him for three days after. The agent had gotten what they ' +
    'came for — but the lieutenants had seen the extraction, and a warlord\'s lieutenants ' +
    'have long memories. Whatever future the alliance held, it had been built on a foundation ' +
    'that the warlord would spend years deciding how to interpret. Depending on the world, ' +
    'that might mean loyalty hardened by pride, or a debt that would find its own way to be repaid.',
  changes: [
    {
      id: 'oath_alliance_strained',
      kind: 'reputation' as const,
      title: 'The Warlord',
      detail: 'An oath given under pressure. He will honor it, but the manner of its giving lives in the hall.',
      polarity: 'mixed' as const,
    },
    {
      id: 'oath_lieutenants_watching',
      kind: 'future_hook' as const,
      title: 'The Lieutenants',
      detail: 'Three commanders watched their leader bow. The weight of that moment is distributed now.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The oath is held. The price of holding it lives in the warlord\'s hall. Choose how you carry this.',
  reactions: [
    {
      id: 'oath_react_let_it_harden',
      label: 'Let the oath harden on its own.',
      intent: 'Leave the obligation where it landed and let the warlord make of it what he will.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'iron.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'betrayal' as const,
          severity: 0.4,
          label: 'Extracted an oath from the warlord under public pressure — his lieutenants remember',
          revealFamilies: ['iron.alliance', 'mercenary', 'military'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The warlord\'s oath is held at cost. His commanders have filed what they witnessed.',
          significance: 0.6,
        },
      ],
    },
    {
      id: 'oath_react_acknowledge_price',
      label: 'Send word that the demand was recognized.',
      intent: 'The god acknowledges the burden of what was asked. The warlord receives something that is not an apology but is not nothing either.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'iron.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god\'s attention passes through the warlord\'s hall once more — not forgiveness, but acknowledgement. The stone in the warlord\'s chest shifts slightly.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'iron.alliance',
          delayTicks: 15,
          priority: 1.1,
          seedLabel: 'Warlord tests the oath he was made to give',
        },
      ],
    },
  ],
} as const;

const WITHDRAWN_AFTERMATH = {
  overview:
    'The exchange completed without drama and left without drama. The warlord poured two ' +
    'cups of something after and did not offer explanations. His men went back to their dice. ' +
    'Whatever the meeting had been — alliance, acknowledgment, a simple recognition of professional ' +
    'courtesy — it had not become a story yet. Stories require some shape of consequence to grow ' +
    'around. This one had been smooth all the way through, which was either wisdom or a missed chance.',
  changes: [
    {
      id: 'withdrawn_clean_exchange',
      kind: 'reputation' as const,
      title: 'The Warlord',
      detail: 'An unremarkable meeting by his standards. Neither debt nor alliance.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'A clean exchange. No shape was pressed. Choose whether to leave it smooth.',
  reactions: [
    {
      id: 'withdrawn_react_leave',
      label: 'Leave it smooth.',
      intent: 'The moment is already what it is. Walk away from the hall without adding weight to it.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god did not press the warlord\'s hall into a shape. The meeting was what it was.',
          significance: 0.4,
        },
      ],
    },
    {
      id: 'withdrawn_react_plant_seed',
      label: 'Let the blade become an opening.',
      intent: 'The tribute blade is a beginning, not a record. Leave a thread of intention in the warlord\'s awareness.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'iron.positive',
          delta: 1,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'iron.alliance',
          delayTicks: 25,
          priority: 0.9,
          seedLabel: 'Warlord remembers the blade he gave and what it meant',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The tribute blade rests in the agent\'s keeping. The warlord did not forget he gave it.',
          significance: 0.5,
        },
      ],
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

export const WARLORDS_TRIBUTE_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.iron.warlords_tribute',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'Warlord\'s Tribute',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheHall, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city', 'fortress'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.iron.positive'],

  narrativeTemplates: {
    initiation:
      'A warlord recognizes the {title} and offers tribute — coin and blade, the language ' +
      'of professional respect. The hall has gone quiet in the particular way halls do when ' +
      'dangerous people are deciding what they mean to each other.',
    success:
      'The exchange concluded with both parties knowing something about the other they did ' +
      'not know before. The warlord\'s tribute has changed hands, and the hall will remember it.',
    failure:
      'The exchange did not complete cleanly. The warlord\'s tribute remains ungiven, or given ' +
      'in a way that left a residue neither party wanted.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/warlords-tribute.jpg',
  illustrationAlt: 'A smoke-dimmed hall: war-band banners overhead, an armored warlord at a raised dais, a tribute blade laid across a table between them.',

  authoredChoices: {
    0: [
      {
        id: 'accept_the_tribute',
        label: 'Accept the tribute.',
        intent:
          'The god settles the agent into the posture of someone who has earned this recognition ' +
          'and knows how to receive it without diminishing either party. The warlord\'s hall will ' +
          'read the acceptance correctly: not greed, not gratitude, but the acknowledgment of a ' +
          'professional standing between professionals.',
        essenceCost: 1,
        likelyBurden:
          'Acceptance without oath binds nothing. The warlord has given his tribute and remains ' +
          'uncommitted. The alliance is implied, not sealed.',
        interventionType: 'supportive',
      },
      {
        id: 'demand_the_oath',
        label: 'Demand their oath instead.',
        intent:
          'The god presses past the tribute and into the warlord\'s chest, where oaths live. ' +
          'Coin and blade are transactional. An oath is structural — it changes what the warlord ' +
          'is, in relation to the agent, from this moment forward. The hall will see this demand. ' +
          'The warlord\'s commanders will file it in the part of their memory they do not forget.',
        essenceCost: 2,
        likelyBurden:
          'An oath extracted is not an oath given. The warlord\'s pride has a long memory and ' +
          'his lieutenants have longer ones. What is gained in binding may be lost in resentment.',
        interventionType: 'coercive',
      },
      {
        id: 'withdraw_your_hand',
        label: 'Let the exchange be what it is.',
        intent:
          'The god does not press. The tribute is offered and received in the neutral register ' +
          'of professional courtesy — neither alliance nor debt, just two dangerous people acknowledging ' +
          'each other\'s existence. Clean. Uncommitted. Whatever the warlord makes of it afterward ' +
          'is his to make.',
        essenceCost: 0,
        likelyBurden:
          'Nothing is lost that was not already unearned. But nothing is gained either — the ' +
          'warlord\'s hall will remember a meeting that was smooth and not much else.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      accept_the_tribute: ACCEPT_AFTERMATH,
      demand_the_oath: OATH_AFTERMATH,
      withdraw_your_hand: WITHDRAWN_AFTERMATH,
    },
    fallback: { ...ACCEPT_AFTERMATH },
  },
});

export const WARLORDS_TRIBUTE_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(WARLORDS_TRIBUTE_TEMPLATE);
