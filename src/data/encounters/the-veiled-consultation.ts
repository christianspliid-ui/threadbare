/**
 * The Veiled Consultation — reputation-gated encounter, Veil + Eye reach, multi-trait AND.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.veil.positive', 'trait.reputation.eye.positive']
 *       Both must be present (AND logic). Min level 2 on Veil, 1 on Eye.
 * Pattern: multi-trait AND — the encounter only surfaces for agents recognized as BOTH
 *          Arcane Sage and Oracle. Neither reputation alone is sufficient.
 *
 * THR-32: First tranche of reputation-gated content.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const sageSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'sage',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['scholar', 'mage', 'sage', 'arcanist', 'lorekeeper'],
  supportRole: 'mage-scholar',
  spawnNpcRole: 'scholar',
  spawnName: 'the Sage',
};

const librarySpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'study',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'library',
  fallbackName: 'The Scholar\'s Study',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [sageSpec, librarySpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheApproach: ActionStep = {
  reach: 'veil',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The study was the kind of room that accumulated — not cluttered, but dense with the ' +
    'particular layering of someone who has been thinking in the same space for a long time. ' +
    'Ink on the table\'s edge. Shelves where the organization made sense only to the person ' +
    'who had made it, which was fine because no one else needed it to make sense. A single ' +
    'oil lamp that cast the room in amber and made the shadows architectural.\n\n' +
    'The sage had the text open on the table when the agent arrived. Not open casually — ' +
    'open in the deliberate way of someone who has arranged a presentation, who knows exactly ' +
    'what they want to show and has positioned themselves so that the showing will proceed as ' +
    'they intend. The parchment was old and the ink on it was older still, and the traceries ' +
    'that wound through the text were not decorative: they were part of the text itself, a ' +
    'second layer of meaning laid alongside the first, for eyes that knew how to read both ' +
    'simultaneously.\n\n' +
    '"The Arcane Sage who also sees," the sage said, in the tone of someone confirming a ' +
    'calculation they had already run twice. "I had heard it was you. It had to be you. The ' +
    'text asks a question that requires someone who can hold two kinds of knowing at once — ' +
    'the formal structure and the living consequence." They gestured at the chair across the table. ' +
    'The lamp flame did not move. The traceries on the parchment caught the light at an angle ' +
    'that made them appear, briefly, to be moving on their own. "{title}. Please sit."',
  successAfterimage: 'The sage\'s careful arrangement found its audience. The text waited between them.',
  failureAfterimage: 'The sage had prepared for this meeting and the preparation showed — which meant the gap between preparation and reality showed too.',
};

const step1InterpretPlainly: ActionStep = {
  reach: 'veil',
  duration: { min: 3, max: 5 },
  difficulty: 0.45,
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
    'The god steadied the agent\'s perception toward the text and let the two kinds of ' +
    'knowing open simultaneously — the structural (what the words declared) and the living ' +
    '(what the words would produce if the declaration were acted upon). Most people can hold ' +
    'one kind. Very few can hold both at once without the second kind overwriting the first, ' +
    'or the first suppressing the second to protect itself. The agent held both.\n\n' +
    'The interpretation took time. The sage did not interrupt. They had the patience of ' +
    'someone who has been waiting to hear this reading for a long time and is not going to ' +
    'compromise it by rushing the last part. When the agent was done, the sage was quiet ' +
    'for a long moment, and then they reached for a fresh sheet of parchment and a clean pen.\n\n' +
    '"The implication you\'ve named in the third tracery," the sage said, "I could not see. ' +
    'I could feel that something was there but I couldn\'t bring it into focus from inside ' +
    'the formal structure." They wrote something. Not the interpretation — that was already ' +
    'done — but a note to themselves, in a hand so small it would be invisible to anyone ' +
    'who was not looking for it. "The consequence is serious," they added. "I will need time ' +
    'to consider whether the serious consequence is the instruction or the warning." They ' +
    'looked at the {title} with the expression of someone who has just understood that ' +
    'the question they asked was smaller than the answer they received.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: -0.05 },
  successAfterimage: 'The interpretation complete. The sage received something they had been waiting for — and found it larger than expected.',
  failureAfterimage: 'The interpretation was attempted but something in the double-knowing slipped. The traceries remained partly opaque.',
};

const step1WithholdHalf: ActionStep = {
  reach: 'shadow',
  duration: { min: 3, max: 5 },
  difficulty: 0.50,
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
    'The god introduced a selective pressure into the agent\'s perception — not falsifying ' +
    'the reading, but choosing which of the two kinds of knowing to make visible. The ' +
    'structural interpretation was offered in full. The living consequence was offered ' +
    'in half. Not a lie: a strategic partial truth, the kind that is technically complete ' +
    'and practically incomplete in the specific places where incompleteness creates leverage.\n\n' +
    'The sage was a professional. They listened to the interpretation with the particular ' +
    'quality of attention that involves checking internal notes as you go — running the ' +
    'stated interpretation against what you already know, watching for the places where ' +
    'the surface smooths over something that should have a texture. They found the place ' +
    'where the living consequence had been withheld. The god watched them find it.\n\n' +
    'The sage did not say anything about what they had found. They were too careful for that. ' +
    'But their posture changed slightly — the careful professional recalibration of someone ' +
    'who has just understood that the person across the table from them is not giving everything ' +
    'they have, and who has filed that understanding in the part of their assessment that does not ' +
    'forget. The interpretation still stood. The relationship had a new quality in it now.',
  successMetadata: { reputationDelta: -0.05 },
  failureMetadata: { reputationDelta: -0.15 },
  successAfterimage: 'The partial interpretation delivered. The sage received it, and also received the knowledge that it was partial.',
  failureAfterimage: 'The withholding was too visible. The sage recognized the gap and the relationship closed around it.',
};

const step1RefuseReading: ActionStep = {
  reach: 'veil',
  duration: { min: 2, max: 3 },
  difficulty: 0.20,
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.10 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.20 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god held the agent back from the text entirely — not from incapacity but from ' +
    'refusal. The two kinds of knowing were present and available; the agent simply did ' +
    'not open them toward what was being asked. The sage waited. The silence in the room ' +
    'became the kind that requires interpretation.\n\n' +
    'The agent said: I see what the text holds. I will not tell you what it holds. This is ' +
    'not the right question for the right time. The sage received this with the expression ' +
    'of someone who has been given an answer that was not an answer, and who is deciding, ' +
    'in real time, whether the person who refused them is an obstacle or an instruction.\n\n' +
    'They chose instruction — because the alternative was that the person who carried both ' +
    'the Arcane Sage and the Oracle reputations simultaneously was simply being unhelpful, ' +
    'and that seemed unlikely. They rolled the parchment closed. "Then I will have to ' +
    'approach this differently," they said, which was the sound of a professional reconfiguring ' +
    'their work rather than abandoning it. Outside the study, word spread before the ' +
    'week was out: the Oracle refused the Sage\'s question. The word had texture to it.',
  successMetadata: { reputationDelta: -0.10 },
  failureMetadata: { reputationDelta: -0.20 },
  successAfterimage: 'Refusal delivered. The sage will approach the question differently now. The word has already spread.',
  failureAfterimage: 'The refusal landed badly. The sage felt dismissed rather than redirected, and the distinction was not academic.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    interpret_plainly: step1InterpretPlainly,
    withhold_half_as_leverage: step1WithholdHalf,
    refuse_the_reading: step1RefuseReading,
  },
  fallback: { ...step1InterpretPlainly },
};

// ─── Aftermath ───────────────────────────────────────────────────

const PLAIN_AFTERMATH = {
  overview:
    'The sage spent three days with the interpretation before sending word. The message ' +
    'that arrived was longer than expected and carried a second sealed section that was ' +
    'not addressed to the agent but to a name the agent did not recognize — a scholar at ' +
    'a different institution, apparently, who had been working on a related question for years ' +
    'and who the sage judged needed to know what the living consequence actually was. The seal ' +
    'was intact. The sage had not asked for permission to forward what they had received. ' +
    'That was either trust or an assumption of trust, and the distinction mattered.',
  changes: [
    {
      id: 'plain_sage_moved',
      kind: 'reputation' as const,
      title: 'The Sage',
      detail: 'Acting on the interpretation. The consequence is in motion now.',
      polarity: 'gain' as const,
    },
    {
      id: 'plain_second_scholar',
      kind: 'future_hook' as const,
      title: 'The Unseen Correspondent',
      detail: 'A scholar elsewhere received the forwarded consequence. The interpretation has new readers.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The interpretation is in motion. Choose how you hold what it produces.',
  reactions: [
    {
      id: 'plain_react_follow_consequence',
      label: 'Follow the living consequence.',
      intent: 'The interpretation told the sage what would happen. Let the god watch it unfold.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title}\'s interpretation ripples outward. The sage is moving on it. The second scholar has read the forwarded section.',
          significance: 0.7,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'veil.knowledge',
          delayTicks: 30,
          priority: 1.0,
          seedLabel: 'The sage returns with a larger question shaped by the first interpretation',
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
      id: 'plain_react_copy_text',
      label: 'Copy the text for your own records.',
      intent: 'What was read once can be read again. The god moves the agent to make a record.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.4,
          label: 'Holds a copy of the Sage\'s sealed text — the second layer of meaning, personally recorded',
          revealFamilies: ['veil.knowledge', 'investigation', 'arcane'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} copies the text before returning it. The living consequence is now in two sets of hands.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

const WITHHELD_AFTERMATH = {
  overview:
    'The sage sent for the agent once, formally, through proper channels, to discuss ' +
    '"a matter of scholarly exchange." The language was courteous and the intent was legible: ' +
    'they were going to try again, with a different approach, and they were hoping the context ' +
    'of formal channels would produce a different result. The agent could respond or not respond. ' +
    'Either response would tell the sage something. The sage had constructed the invitation to ' +
    'make both outcomes informative, which was the mark of a professional who understood that ' +
    'a closed door is not a dead end if you\'ve learned what kind of lock it has.',
  changes: [
    {
      id: 'withheld_sage_formal',
      kind: 'reputation' as const,
      title: 'The Sage',
      detail: 'Sent a formal follow-up. The partial interpretation sits in their notes alongside the knowledge that it was partial.',
      polarity: 'mixed' as const,
    },
    {
      id: 'withheld_leverage_held',
      kind: 'future_hook' as const,
      title: 'The Withheld Consequence',
      detail: 'Half the reading was kept. The sage knows this. The leverage is real — so is the cost of having used it.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The sage\'s formal invitation is open. The withheld consequence is still held. Choose what to do with the balance.',
  reactions: [
    {
      id: 'withheld_react_respond',
      label: 'Answer the formal invitation.',
      intent: 'The god moves the agent toward the follow-up — whatever the sage has prepared, it is worth hearing.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'shadow.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} answers the sage\'s formal invitation. The second conversation begins from a known position.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'veil.knowledge',
          delayTicks: 40,
          priority: 1.1,
          seedLabel: 'The sage calls in the favor created by the withheld interpretation',
        },
      ],
    },
    {
      id: 'withheld_react_hold',
      label: 'Leave the invitation unanswered.',
      intent: 'The withheld consequence remains in suspension. The sage is still waiting.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'betrayal' as const,
          severity: 0.3,
          label: 'Withheld half a reading from the Sage and left their formal follow-up unanswered',
          revealFamilies: ['veil.knowledge', 'arcane', 'scholar'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The sage\'s invitation sits unanswered. The partial interpretation remains partial. The {title} carries the withheld half.',
          significance: 0.5,
        },
      ],
    },
  ],
} as const;

const REFUSED_AFTERMATH = {
  overview:
    'The Oracle refused the question. That was the version of the story that traveled, ' +
    'which was not exactly the story that happened — the agent had not refused because ' +
    'they lacked the reading, but because the reading had a cost the god had decided not ' +
    'to pay yet — but the traveling version was close enough. The sage, for their part, ' +
    'did not correct the version. They had received the refusal as an instruction. They ' +
    'were acting accordingly, which meant approaching the question from a direction they ' +
    'would not have thought to try if the Oracle had simply read the text and told them ' +
    'what it said. Sometimes a refusal builds the thing it refuses to give.',
  changes: [
    {
      id: 'refused_sage_redirected',
      kind: 'reputation' as const,
      title: 'The Sage',
      detail: 'Redirected by refusal. Working on a different approach now.',
      polarity: 'mixed' as const,
    },
    {
      id: 'refused_word_traveling',
      kind: 'future_hook' as const,
      title: 'The Refusal\'s Reputation',
      detail: 'The Oracle refused the Sage\'s question. The word is traveling. Its meaning will be assigned by whoever receives it.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The refusal is now a story in motion. Choose what shape it takes.',
  reactions: [
    {
      id: 'refused_react_let_travel',
      label: 'Let the word travel as it will.',
      intent: 'The refusal means what those who hear it decide it means. The god does not correct the interpretation.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.negative',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The refusal travels. The Oracle\'s silence has been read into a dozen different explanations, none of them wrong.',
          significance: 0.6,
        },
      ],
    },
    {
      id: 'refused_react_send_word',
      label: 'Send the sage a partial answer.',
      intent: 'Not the reading — something smaller. A direction, not a destination. Enough to redirect without yielding the whole text.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'A partial answer reaches the sage — not the reading, but a direction. The refusal becomes a redirection.',
          significance: 0.65,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'veil.knowledge',
          delayTicks: 25,
          priority: 0.9,
          seedLabel: 'The sage returns having followed the partial direction',
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const VEILED_CONSULTATION_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.veil.the_veiled_consultation',
  rarityTier: 3,
  intrinsicTier: 'shaping',
  name: 'The Veiled Consultation',
  reach: 'veil',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheApproach, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city', 'tower', 'academy'],
  motivations: ['tradition_novelty', 'revelation_discretion'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.veil.positive', 'trait.reputation.eye.positive'],

  narrativeTemplates: {
    initiation:
      'A mage-scholar brings a sealed text that only someone who holds both the Arcane Sage ' +
      'and the Oracle reputations can read properly — the formal structure and the living ' +
      'consequence simultaneously. The sage has been waiting for the right reader. {title} ' +
      'is the one they calculated it had to be.',
    success:
      'The consultation resolved — through plain reading, strategic withholding, or outright ' +
      'refusal. Whatever the mode, the sage received something from the encounter that will ' +
      'change the direction of their work.',
    failure:
      'The consultation did not complete cleanly. The text\'s second layer resisted, or the ' +
      'approach failed under the sage\'s professional attention.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-veiled-consultation.jpg',
  illustrationAlt: 'A narrow lamp-lit room. An elder sage unrolls a parchment across a low table; the agent\'s hand rests at the scroll\'s edge. Ink traceries glow faintly. Deep indigo, lamp-amber, scroll-cream.',

  authoredChoices: {
    0: [
      {
        id: 'interpret_plainly',
        label: 'Read it fully — both kinds at once.',
        intent:
          'The god opens both kinds of knowing simultaneously and lets the agent hold what ' +
          'few people can hold: the formal structure of the text and the living consequence ' +
          'of acting on it, at the same time. The reading will cost something to deliver and ' +
          'something to receive. The sage will receive it completely.',
        essenceCost: 2,
        likelyBurden:
          'Full reading of both layers means the consequence is now out and moving. Whatever ' +
          'the text held, it is no longer sealed. The sage will act on what they received.',
        interventionType: 'supportive',
      },
      {
        id: 'withhold_half_as_leverage',
        label: 'Give the structure, keep the consequence.',
        intent:
          'The god shapes the agent\'s disclosure: the formal interpretation fully delivered, ' +
          'the living consequence strategically withheld. The sage will receive a complete ' +
          'structural reading and an incomplete living one. The gap will be perceptible to ' +
          'a professional. That perceptibility is the point.',
        essenceCost: 2,
        likelyBurden:
          'The sage will identify the gap. A professional who identifies a gap and does not ' +
          'say so has filed it. The relationship will carry that filing.',
        interventionType: 'coercive',
      },
      {
        id: 'refuse_the_reading',
        label: 'Refuse entirely.',
        intent:
          'The god holds the agent back from both kinds of knowing. The text sits unopened. ' +
          'The refusal is complete and the reason for it is not given. The sage will interpret ' +
          'the silence as they will — as a restriction, an instruction, or a cost they have not ' +
          'yet paid. The word will travel. Its meaning will be assigned.',
        essenceCost: 0,
        likelyBurden:
          'The Oracle who refuses shapes what people believe the Oracle knows. The word is ' +
          'already becoming a story. The story\'s shape is now out of the god\'s direct control.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      interpret_plainly: PLAIN_AFTERMATH,
      withhold_half_as_leverage: WITHHELD_AFTERMATH,
      refuse_the_reading: REFUSED_AFTERMATH,
    },
    fallback: { ...PLAIN_AFTERMATH },
  },
};
