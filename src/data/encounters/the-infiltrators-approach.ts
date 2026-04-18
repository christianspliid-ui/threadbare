/**
 * The Infiltrator's Approach — reputation-gated encounter, Shadow reach, required-positive.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.shadow.positive']
 * Pattern: required-positive — Shadow+ (first tranche only used Shadow as a block, not a gate).
 *
 * THR-146: Middle tranche of reputation-gated content.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const strangerSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'hooded_stranger',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['spy', 'thief', 'assassin', 'rogue', 'civilian'],
  supportRole: 'petitioner',
  spawnNpcRole: 'civilian',
  spawnName: 'the Stranger',
};

const tavernBackRoomSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'tavern_back_room',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'sublocation-type.tavern',
  fallbackName: 'The Tavern\'s Back Room',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [strangerSpec, tavernBackRoomSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheProposal: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The back room had the quality of a space that had heard things before and was ' +
    'not surprised to hear them again. Two lamps. A table that leaned slightly toward ' +
    'the window. Someone had left a cup that no one had removed.\n\n' +
    'The hood stayed up. The stranger slid into the seat across from the agent the ' +
    'way someone slides into a seat when they have been watching the room long enough ' +
    'to know which approach goes unnoticed. They spoke low — names, specific names, ' +
    'the kind of names that do not travel as far as the stranger was implying unless ' +
    'the person saying them has actually been where the names come from. A rival master. ' +
    'A list of contacts. An offer: shelter under the {title}\'s reach, in exchange for ' +
    'the complete contents of the list.\n\n' +
    'The stranger had done their research. They knew what kind of shelter the {title} ' +
    'represents. That was the tell that mattered most.',
  successAfterimage: 'The hood stayed up. The names were specific. The tell was in the research.',
  failureAfterimage: 'The stranger laid out the proposal, but something in the room did not settle into the shape they had expected.',
};

const step1AcceptDeal: ActionStep = {
  reach: 'shadow',
  duration: { min: 2, max: 3 },
  difficulty: 0.30,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god said yes — not out loud, because the right answer in this kind of room ' +
    'is a gesture, not a word. A hand placed flat on the table for a moment, then ' +
    'lifted. The intelligence would come first; shelter would follow when it arrived ' +
    'and was verified as what the stranger said it was.\n\n' +
    'The stranger understood the structure of the agreement. They slid a folded paper ' +
    'across the table — not the full list, a sample, the names on top — and the agent ' +
    'read it with the quality of attention that tells a room the reader knows what ' +
    'they are looking at. The stranger watched the reader read and came to some ' +
    'conclusion about their own safety in the arrangement. Their posture changed in ' +
    'the way postures change when someone decides they are going to survive a decision.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The paper across the table. The quality of reading. The stranger\'s posture decided.',
  failureAfterimage: 'The agreement structure was clear, but something in the reading suggested the names were not quite what had been promised.',
};

const step1RevealToMaster: ActionStep = {
  reach: 'shadow',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god did not take the deal. It took the information — which is a different thing. ' +
    'The stranger was offering betrayal. The {title} accepted the betrayal and then ran it ' +
    'one layer deeper: through three cut-outs, before the stranger had left the building, ' +
    'word went to the rival master that their operative was in this room, had come to this ' +
    'table, had offered exactly this.\n\n' +
    'The stranger did not know. They finished speaking, received the god\'s considered ' +
    'silence, and left the way they came in. They had told themselves the meeting had ' +
    'gone well. The rival master would have a different opinion by morning, and the ' +
    'operative would have to resolve the gap between those two versions of events.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The stranger left thinking the meeting had gone well. The cut-outs were already moving.',
  failureAfterimage: 'The information moved, but the cut-outs weren\'t clean — something in the chain may trace back.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    accept_the_deal: step1AcceptDeal,
    reveal_to_master: step1RevealToMaster,
  },
  fallback: { ...step1AcceptDeal },
};

// ─── Aftermath ───────────────────────────────────────────────────

const ACCEPT_AFTERMATH = {
  overview:
    'The list was complete when it arrived, which it did in two pieces, three days apart. ' +
    'The delay was deliberate — the stranger was verifying that the shelter they had been ' +
    'promised was real before they delivered the second half. It was real. The stranger ' +
    'disappeared into the reach of the {title} and the rival master spent two weeks ' +
    'trying to find them before concluding they were probably dead, which was a ' +
    'misreading of the situation that the rival master would eventually correct at ' +
    'cost. The list was accurate. Every name on it was where the stranger had said they were.',
  changes: [
    {
      id: 'accept_list_delivered',
      kind: 'reputation' as const,
      title: 'The Traitor\'s List',
      detail: 'The list arrived in two pieces. Every name was accurate. The stranger is now sheltered.',
      polarity: 'gain' as const,
    },
    {
      id: 'accept_rival_searching',
      kind: 'future_hook' as const,
      title: 'The Rival Master',
      detail: 'The rival master thinks the stranger is dead. When they discover otherwise, the correction will have consequences.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The list is held. The stranger is sheltered. The rival master is looking in the wrong direction. Choose what moves next.',
  reactions: [
    {
      id: 'accept_react_act',
      label: 'Move on the names.',
      intent: 'The list was not obtained to sit. Set it in motion through whatever networks the {title} operates.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
        { kind: 'reputation_tally' as const, key: 'eye.positive', delta: 1 },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.45,
          label: 'holds the traitor\'s list — full contact network of the rival master\'s operation',
          revealFamilies: ['shadow.betrayal', 'spy', 'faction'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'shadow.rival_strike',
          delayTicks: 30,
          priority: 0.85,
          seedLabel: 'The betrayed master moves first',
        },
        {
          kind: 'spawn_clue' as const,
          source: 'spy_debrief' as const,
          precision: 'vague' as const,
          targetRuinId: '$nearest_ruin',
        },
      ],
    },
    {
      id: 'accept_react_hold',
      label: 'Hold the list in reserve.',
      intent: 'The intelligence is most valuable kept — not spent. Let it age.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} accepted the traitor\'s offer and holds the complete list. The stranger is sheltered. The rival master does not know where.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

const REVEAL_AFTERMATH = {
  overview:
    'The rival master\'s response was faster than the cut-outs had expected — which meant ' +
    'the master had contingencies for this exact scenario, which said something about how ' +
    'often their operatives were turned. The operative was recalled before they could act ' +
    'further. The manner of the recall was not friendly. By the time the operative understood ' +
    'what had happened, the rival master had already concluded that the meeting in the back ' +
    'room had been a test — a test the operative had failed. The operative was not given ' +
    'an opportunity to dispute this reading. None of this traced back to the {title}\'s table.',
  changes: [
    {
      id: 'reveal_master_purge',
      kind: 'reputation' as const,
      title: 'The Sold Traitor',
      detail: 'A betrayal was sold back to the betrayed. The master recalled the operative. The nature of the recall was final.',
      polarity: 'gain' as const,
    },
    {
      id: 'reveal_faction_instability',
      kind: 'future_hook' as const,
      title: 'The Purge Begins',
      detail: 'The master is now suspecting everyone. The faction\'s internal stability has a new shape.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The betrayal was returned to its source. The master is purging. Choose what the god does with that instability.',
  reactions: [
    {
      id: 'reveal_react_watch',
      label: 'Watch the purge. Note what surfaces.',
      intent: 'Instability reveals structure. Let the purge run and observe what it dislodges.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
        { kind: 'reputation_tally' as const, key: 'iron.positive', delta: 1 },
        {
          kind: 'hidden_mark' as const,
          category: 'concealed_action' as const,
          severity: 0.4,
          label: 'sold a traitor back to their own master through three cut-outs — untraceable',
          revealFamilies: ['shadow.loyalty', 'faction', 'spy'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'shadow.faction_turmoil',
          delayTicks: 20,
          priority: 0.8,
          seedLabel: 'The rival faction\'s purge begins',
        },
      ],
    },
    {
      id: 'reveal_react_leave',
      label: 'Leave the faction to its own accounting.',
      intent: 'The correction has been delivered. What it does to the faction is not the god\'s ongoing concern.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'shadow.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} sold a traitor back to their own master. The rival faction is in the early stages of a purge. No thread leads to the back room.',
          significance: 0.55,
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const THE_INFILTRATORS_APPROACH_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.shadow.the_infiltrators_approach',
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Infiltrator\'s Approach',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheProposal, step1Branch],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.shadow.positive'],

  narrativeTemplates: {
    initiation:
      'A hooded stranger slides into the seat across from {title} in a tavern\'s back booth. ' +
      'They propose a betrayal — selling out their own rival master in exchange for shelter ' +
      'under the {title}\'s reputation.',
    success:
      'The meeting ended with something moving — either the deal was accepted and the list ' +
      'is coming, or the betrayal was sold back to the one being betrayed. Either way, ' +
      'the stranger left the room without knowing which.',
    failure:
      'The proposal was heard, but something in the room\'s resolution left the outcome ' +
      'ambiguous — the deal half-made or the cut-outs incomplete.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-infiltrators-approach.webp',
  illustrationAlt: 'Wide shot: two figures across a tavern table, single lamp, deep shadow, Threadbare palette.',

  authoredChoices: {
    0: [
      {
        id: 'accept_the_deal',
        label: 'Accept. Take the intelligence, extend shelter.',
        intent:
          'The god places the flat hand on the table — the gesture of agreement in this ' +
          'kind of room. The stranger will deliver the list in pieces, verifying the shelter ' +
          'is real as they go. The intelligence on the rival master\'s network is the price; ' +
          'the stranger\'s continued existence inside the {title}\'s reach is the payment.',
        essenceCost: 1,
        likelyBurden:
          'A sheltered informant is a structural commitment. The rival master will eventually ' +
          'discover where their operative went, and the discovery will have a shape.',
        interventionType: 'supportive',
      },
      {
        id: 'reveal_to_master',
        label: 'Take the intelligence, then send it back to the master — through cut-outs.',
        intent:
          'The god does not shelter the stranger. It accepts the betrayal and then runs it ' +
          'one layer deeper: word goes to the rival master through three intermediaries before ' +
          'the stranger reaches the street. The stranger leaves the meeting thinking it went well. ' +
          'The master will have a different understanding by morning.',
        essenceCost: 1,
        likelyBurden:
          'The stranger will be recalled. The manner of the recall will not be friendly. ' +
          'The faction is now in the early stages of something that looks like a purge.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      accept_the_deal: ACCEPT_AFTERMATH,
      reveal_to_master: REVEAL_AFTERMATH,
    },
    fallback: { ...ACCEPT_AFTERMATH },
  },
};
