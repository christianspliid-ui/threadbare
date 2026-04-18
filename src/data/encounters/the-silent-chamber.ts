/**
 * The Silent Chamber — reputation-gated encounter, Veil reach, required-negative.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.veil.negative'] — a locked chamber
 *       in a censured guild's ruins opens only to those the guild has already silenced.
 * Pattern: required-negative — encounter surfaces only when veil.negative is held.
 *
 * THR-147: Final tranche of reputation-gated content.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const guildRuinSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'guild_ruin',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'ruin',
  fallbackName: 'The Censured Guild\'s Ruin',
};

const chamberSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'silent_chamber',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'vault',
  fallbackName: 'The Silent Chamber',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [guildRuinSpec, chamberSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheDoor: ActionStep = {
  reach: 'veil',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The guild had been censured three years ago. The ruin was the specific kind that ' +
    'comes from institutional dissolution rather than fire or siege — walls intact, ' +
    'roof partially standing, but the particular vacancy of a place whose purpose ' +
    'had been officially removed. The guild\'s sign was still mounted above the main ' +
    'arch, because nobody had been assigned to take it down.\n\n' +
    'The chamber was at the end of the inner corridor, behind a door that had not ' +
    'been forced and had not been opened by the investigators who had processed the ' +
    'ruin after the censure. The mechanism yielded when {title} approached it, which ' +
    'it had not done for anyone else, which was the point: the guild had built the ' +
    'lock to open for the kind of practitioner the guild itself had most worked to ' +
    'silence.\n\n' +
    'Inside: a single lantern that guttered and held, the way lanterns in chambers ' +
    'like this one do when the chamber expects to be entered. A manuscript on a ' +
    'low stone plinth, bound in undyed leather. Dust motes in the lantern light, ' +
    'suspended. The chamber had been waiting.',
  successAfterimage: 'The mechanism yielded. The lantern held. The manuscript on its plinth.',
  failureAfterimage: 'The chamber\'s threshold resisted — not entirely, but enough to make the entry feel uncertain.',
};

const step1ReadTheLore: ActionStep = {
  reach: 'veil',
  duration: { min: 2, max: 4 },
  difficulty: 0.40,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god settled the cost of attention through the agent and let the knowledge ' +
    'arrive. Not gently — the manuscript was forbidden because it was true, and ' +
    'true things of this kind arrive with the particular weight of information ' +
    'that changes the shape of what you knew before. The {title} paid the essence ' +
    'that the chamber demanded and let the text in.\n\n' +
    'The lantern held for as long as the reading took. When the agent rose from the ' +
    'plinth, the knowledge was already beginning to settle into the places where ' +
    'understanding goes when it arrives in this form — not stored, not filed, ' +
    'but structural. The kind of knowing that cannot be unknowed. The chamber ' +
    'did not let them leave unchanged, because the chamber had been built precisely ' +
    'to ensure that any {title} who entered it would leave carrying something the ' +
    'guild had meant to bury.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The reading done. The knowledge structural. The chamber let them leave.',
  failureAfterimage: 'The text was read but something in the reception was incomplete — the knowledge partial, not structural.',
};

const step1DestroyUnread: ActionStep = {
  reach: 'veil',
  duration: { min: 1, max: 2 },
  difficulty: 0.20,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god pressed the agent toward the lantern rather than the plinth — toward ' +
    'the ending rather than the reading. The {title} brought the flame to the ' +
    'manuscript\'s binding, which caught as undyed leather catches, without drama, ' +
    'just commitment. The pages were thorough and uniform, the way pages burn when ' +
    'they have been written by someone who knew what they were writing and did not ' +
    'protect their work against fire, because the protection was always supposed ' +
    'to be the locked door.\n\n' +
    'The agent walked out with clean hands and colder. The chamber\'s lantern had ' +
    'gone out on its own when the burning finished. The ruin behind them was ' +
    'the same ruin it had been before, except that the thing the guild had meant ' +
    'to preserve inside its most careful lock was now ash on a stone plinth.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The pages burned. Clean hands. The lantern out when the work was done.',
  failureAfterimage: 'The burning was begun but the manuscript resisted — what was left was partial ash and something that hadn\'t quite finished.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    read_the_forbidden_lore: step1ReadTheLore,
    destroy_the_manuscript_unread: step1DestroyUnread,
  },
  fallback: { ...step1ReadTheLore },
};

// ─── Aftermath ───────────────────────────────────────────────────

const READ_AFTERMATH = {
  overview:
    'What the manuscript had contained was not the kind of knowledge that improved ' +
    'circumstances by existing — it explained something about the guild\'s censure ' +
    'that the guild\'s censurers had decided the world was better off not knowing. ' +
    'The {title} now knew it. This was not comfortable. It was also not reversible. ' +
    'The remnant guild — the people who had scattered when the institution was dissolved ' +
    'and who still met in irregular locations to mourn what they had been — had ways ' +
    'of learning when the chamber had been opened. They would learn. The question ' +
    'of what they would do about a {title} who carried their buried text was one ' +
    'that would answer itself in time.',
  changes: [
    {
      id: 'read_knowledge_structural',
      kind: 'reputation' as const,
      title: 'The Silenced Manuscript',
      detail: 'Carried now in a mind the guild had already declared invalid. The remnant guild will find out.',
      polarity: 'mixed' as const,
    },
    {
      id: 'read_guild_investigation',
      kind: 'future_hook' as const,
      title: 'The Remnant Guild',
      detail: 'They have ways of knowing when the chamber was entered. What they do about it will depend on what they decide the {title} means to do with the text.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The knowledge is structural now. The remnant guild will know the chamber was opened. Choose what you do with what was buried there.',
  reactions: [
    {
      id: 'read_react_hold',
      label: 'Hold the knowledge without acting on it yet.',
      intent: 'The text was forbidden because it was true. Let it settle before deciding what truth requires.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.negative',
          delta: 1,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'forbidden_contact' as const,
          severity: 0.55,
          label: 'carries the silenced text — the censured guild\'s buried knowledge is now structural',
          revealFamilies: ['veil.inquisition', 'guild', 'forbidden_knowledge'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} read the silenced manuscript in the censured guild\'s locked chamber. The knowledge is structural now. The remnant guild has begun to notice.',
          significance: 0.7,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'veil.guild_investigation',
          delayTicks: 35,
          priority: 0.8,
          seedLabel: 'The remnant guild learns someone opened the chamber',
        },
      ],
    },
    {
      id: 'read_react_share',
      label: 'Bring the knowledge forward into the world.',
      intent: 'The guild buried this because it was true. The act of silencing is itself a record. Give the text back to the world that was meant not to have it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.negative',
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
          message: 'The {title} read the silenced text and then shared it. The guild\'s burial is undone. The remnant guild has a specific kind of problem now.',
          significance: 0.75,
        },
      ],
    },
  ],
} as const;

const DESTROY_AFTERMATH = {
  overview:
    'The chamber had been built to ensure the manuscript survived. The {title} had ' +
    'come in and done the thing the guild\'s censurers had decided not to do, which ' +
    'was simply end it. The remnant guild, when they learned the chamber had been ' +
    'entered and the manuscript destroyed, would have a reaction that was more ' +
    'complicated than relief and more complicated than grief — the particular ' +
    'response of people who had watched their institution collapse and had held ' +
    'onto one buried thing as a last record of what they had been, and now ' +
    'did not have even that. Whether they would forgive the {title} for taking it ' +
    'was a question that would take time to answer.',
  changes: [
    {
      id: 'destroy_clean_hands',
      kind: 'reputation' as const,
      title: 'The Destroyed Manuscript',
      detail: 'Gone. The guild\'s censurers didn\'t do it. The {title} did. The remnant guild has a specific grief now.',
      polarity: 'mixed' as const,
    },
    {
      id: 'destroy_rehabilitation_opening',
      kind: 'future_hook' as const,
      title: 'A Cautious Voice',
      detail: 'Someone has noticed that the {title} went into the chamber and came out having ended rather than continued what was buried there.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt:
    'The manuscript is ash. The remnant guild is going to have feelings about this. Choose how to hold the aftermath.',
  reactions: [
    {
      id: 'destroy_react_step_back',
      label: 'Step back and let the remnant guild process it.',
      intent: 'The act is done and cannot be undone. Give the remnant guild the space to react without the {title} visible in it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'veil.negative',
          delta: -1,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'veil.rehabilitation_overture',
          delayTicks: 40,
          priority: 0.7,
          seedLabel: 'A cautious voice offers a path back to standing',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} entered the silent chamber and burned the manuscript unread. The remnant guild knows. Whether this is forgiveness or its opposite has not been decided.',
          significance: 0.65,
        },
      ],
    },
    {
      id: 'destroy_react_approach_guild',
      label: 'Approach the remnant guild directly.',
      intent: 'The act deserves an explanation, or at least an acknowledgment. Face what was done rather than leaving it at a distance.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} approached the remnant guild after burning their buried text. The conversation that followed was not comfortable and was not nothing.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const THE_SILENT_CHAMBER_TEMPLATE: UnifiedActionTemplate = {
  id: 'reputation.veil.the_silent_chamber',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Silent Chamber',
  reach: 'veil',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheDoor, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['ruin', 'wilderness', 'settlement'],
  motivations: ['loyalty_ambition', 'mercy_ruthlessness'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.veil.negative'],

  narrativeTemplates: {
    initiation:
      'In the ruins of a censured guild, a chamber opens for {title} that has refused ' +
      'every other visitor. Inside: a single lantern, a manuscript the guild buried ' +
      'rather than destroyed, and the specific silence of a lock built to open for ' +
      'the kind of practitioner the guild most worked to silence.',
    success:
      'The chamber was entered and left changed. Either the manuscript was read and ' +
      'its knowledge is now structural, or the manuscript is ash and the lantern is out.',
    failure:
      'The chamber\'s threshold was crossed but something in the engagement ' +
      'was incomplete — the knowledge partial or the burning unfinished.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-silent-chamber.png',
  illustrationAlt: 'Wide shot: vaulted stone chamber, single guttering lantern, manuscript on a low stone plinth, dust motes suspended in the light, deep shadow at the edges.',

  authoredChoices: {
    0: [
      {
        id: 'read_the_forbidden_lore',
        label: 'Read the manuscript. Let the knowledge in.',
        intent:
          'The god settles the cost of attention through the agent and lets what was ' +
          'buried arrive whole. The chamber\'s lock opened for {title} because the ' +
          'guild had designed it that way — the silenced can read what the silence ' +
          'was built to conceal. The essence the chamber demands is paid. The ' +
          'knowledge is structural now. It cannot be unfelt.',
        essenceCost: 2,
        likelyBurden:
          'Forbidden because it was true. The remnant guild has ways of knowing ' +
          'when the chamber was entered, and they will decide what to do about ' +
          'a {title} who now carries their buried text.',
        interventionType: 'supportive',
      },
      {
        id: 'destroy_the_manuscript_unread',
        label: 'Burn the manuscript before reading it.',
        intent:
          'The god presses the agent toward ending rather than opening. The {title} ' +
          'came through the lock that refused everyone else — and used that access ' +
          'to do the thing the guild\'s censurers decided not to do. The lantern ' +
          'is brought to the binding. What the guild buried stays buried, in ash ' +
          'now instead of leather. Clean hands. Colder.',
        essenceCost: 0,
        likelyBurden:
          'The remnant guild held onto one buried thing. The {title} took it. ' +
          'Whether they will forgive this is a question that will take time to answer.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      read_the_forbidden_lore: READ_AFTERMATH,
      destroy_the_manuscript_unread: DESTROY_AFTERMATH,
    },
    fallback: { ...READ_AFTERMATH },
  },
};
