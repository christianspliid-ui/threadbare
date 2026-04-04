/**
 * Flawed Steel — branching encounter using ActionStepBranch
 * and BranchAwareAftermathConfig primitives.
 *
 * A forge-master discovers her apprentice has been secretly selling
 * flawed weapons to a mercenary company. The mercenaries camp outside
 * the settlement demanding replacements or blood-price. The god
 * chooses whether to forge the truth or temper the narrative.
 *
 * Design doc: Docs/plans/encounters/flawed-steel-revised.md
 * Systems audit: Docs/plans/encounters/flawed-steel-systems.md
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const marenSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'maren_ironhewn',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['smith', 'artisan', 'crafter', 'weaponsmith'],
  supportRole: 'forge-master',
  spawnNpcRole: 'smith',
  spawnName: 'Maren Ironhewn',
};

const dallaSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'dalla',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  preferredLocationKey: 'forge',
  reuseNpcRoles: ['apprentice'],
  supportRole: 'apprentice',
  spawnNpcRole: 'apprentice',
  spawnName: 'Dalla',
};

const torveSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'torve_ashgrip',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['mercenary', 'captain', 'soldier'],
  supportRole: 'mercenary captain',
  spawnNpcRole: 'mercenary',
  spawnName: 'Torve Ashgrip',
};

const forgeSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'forge',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'workshop',
  fallbackName: 'Ironhewn Forge',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  marenSpec,
  dallaSpec,
  torveSpec,
  forgeSpec,
];

// ─── Step Definitions ────────────────────────────────────────────

/**
 * Step 0: The Reckoning at the Anvil.
 * The god perceives the cold forge, Maren's paralysis, Torve's demand,
 * and Dalla behind the coal shed door. Difficulty 0 — the choice is
 * the point, not the roll.
 */
const step0TheReckoning: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The first thing the god noticed was the sound — not the ringing of hammer on ' +
    'steel that a forge should make in the morning hours, but silence. Maren Ironhewn\'s ' +
    'forge had gone cold for the first time in eleven years, and the absence of its rhythm ' +
    'left a gap in the settlement\'s morning like a missing heartbeat. The quenching trough ' +
    'still held water dark with yesterday\'s scale. Racks of finished blades lined the ' +
    'back wall, each one stamped with Maren\'s mark, each one a promise the settlement ' +
    'had learned to trust without thinking. On the anvil, where hot steel should have been ' +
    'taking shape, there was only a letter — written in a hand steady enough that the ink ' +
    'had not bled once, even on the words that were threats. And through the wall of the ' +
    'coal shed came the sound of breathing: Dalla, who had been Maren\'s hands and eyes ' +
    'for nine years, sitting in the dark with the knowledge of what she had done settling ' +
    'into her bones like cold iron.\n\n' +
    'Maren stood with her back to the shed door. She had not turned around since locking ' +
    'it. Her hands, scarred and calloused from three decades of metalwork, hung at her ' +
    'sides with the particular stillness of someone who did not trust what they might do ' +
    'if they moved. Outside the eastern gate, the Greycloaks\' cook-fires sent thin smoke ' +
    'above the tree line — fifty-odd professional soldiers who had marched here not for ' +
    'conquest but for the simple, terrible reason that the weapons they had paid for would ' +
    'break when they were needed most.\n\n' +
    'The threads of this place pulled taut against each other, and the god could feel ' +
    'each one: Maren\'s pride, fraying. Dalla\'s shame, hardening into something that ' +
    'might become defiance if left long enough. Torve\'s patience, measured in hours. ' +
    'And beneath it all, the question the settlement had not yet asked itself — how many ' +
    'other blades bearing Maren\'s stamp had already gone into the world carrying the same ' +
    'flaw, and how many of those blades had already failed in hands that trusted them.',
};

/**
 * Step 1 — Forge the Truth variant.
 * Maren opens the gate, brings Dalla before Torve, gives a full
 * accounting. Heart reach at moderate difficulty (0.45) — sincerity
 * under pressure.
 */
const step1ForgeTheTruth: ActionStep = {
  reach: 'heart',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  onSuccess: [
    // Maren's reputation takes a public hit but recovers — honest reckoning
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  onFailure: [
    // Negotiation collapses — Greycloaks take inventory by force
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.20 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'Something shifted in the forge-master\'s bearing — not confidence, not yet, but ' +
    'the particular resolve of someone who has decided that the worst thing is not the ' +
    'truth but the silence around it. Maren Ironhewn crossed to the coal shed, drew the ' +
    'bolt, and told Dalla to stand up. The girl rose with the stiffness of someone who ' +
    'had been sitting in the dark for two days, blinking against the morning light as if ' +
    'it were an accusation. Maren did not speak to her. She walked to the eastern gate, ' +
    'Dalla behind her, and the militia captain — who had been hoping for instructions ' +
    'that would not come — stepped aside when he saw the look on the forge-master\'s face.\n\n' +
    'Torve Ashgrip was sitting on a camp stool outside her command tent, sharpening a ' +
    'knife that did not need sharpening. She looked up as the gate opened and saw the ' +
    'forge-master walking toward her with a young woman trailing half a step behind, ' +
    'blinking against the light like someone pulled out of a cellar. The forge-master ' +
    'stopped at the edge of the Greycloak camp and said, in a voice that carried without ' +
    'being raised, that she had come to give a full accounting. That the fault was in her ' +
    'forge, under her name, and that the woman responsible was standing beside her. That ' +
    'she would hear whatever terms the captain proposed. Torve set the knife down. She did ' +
    'not smile, but something in her posture eased — the recognition of someone who had ' +
    'chosen the harder road and could be dealt with accordingly.',
  successMetadata: {
    reputationDelta: -0.05,
  },
  failureMetadata: {
    reputationDelta: -0.20,
  },
};

/**
 * Step 1 — Temper the Narrative variant.
 * The god whispers managed truth into Maren's framing. Shadow reach
 * at moderate difficulty (0.40) — the deception must hold under
 * professional scrutiny.
 */
const step1TemperTheNarrative: ActionStep = {
  reach: 'shadow',
  duration: { min: 3, max: 4 },
  difficulty: 0.40,
  onSuccess: [
    // Maren's reputation preserved — managed truth holds
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.05 },
    },
  ],
  onFailure: [
    // Torve sees through it — double betrayal stain
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.25 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god\'s touch was lighter than breath — a whisper threaded through the morning ' +
    'air, settling into the gaps between what Maren Ironhewn knew and what she was ' +
    'willing to say aloud. The forge-master\'s hands steadied. Her jaw set not with the ' +
    'rigidity of confession but with the practiced calm of a craftswoman presenting ' +
    'finished work: here is what happened, here is what I propose, here is why you should ' +
    'accept it. She left Dalla in the coal shed. Some truths held the rest of the structure ' +
    'up the way a tang holds a blade. Pull one and the whole thing comes apart in your hands. ' +
    'This truth — the full scope of what Dalla had done, the months of it, the number of ' +
    'blades — was one of those.\n\n' +
    'Maren walked to the eastern gate alone and asked the militia captain to open it. She ' +
    'carried a ledger and a sample replacement blade, still warm from a night of solitary ' +
    'work at the forge. Torve Ashgrip met her at the camp\'s edge with the expression of ' +
    'someone who had expected to wait another day. The forge-master presented the situation ' +
    'as she had been guided to frame it: a materials defect in a single ore shipment, caught ' +
    'during quality review, affecting a known subset of the commissioned weapons. Regrettable. ' +
    'Remediable. Already being addressed. She placed the sample blade on the table between ' +
    'them. Torve picked it up, tested the edge against her thumb, and studied the tang where ' +
    'the last one had broken. The steel held. The conversation that followed was professional, ' +
    'measured, and efficient — two women who understood that commerce runs on the ability to ' +
    'absorb mistakes without burning the relationship that produced them. What Torve did not ' +
    'see, because the god\'s influence made it easy not to see, was the tremor in Maren\'s ' +
    'hands when she closed the ledger. The numbers in it were true. They were also incomplete.',
  successMetadata: {
    reputationDelta: 0.05,
  },
  failureMetadata: {
    reputationDelta: -0.25,
  },
};

/**
 * Step 1: Branch point. Resolves based on the choice made at Step 0.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    forge_the_truth: step1ForgeTheTruth,
    temper_the_narrative: step1TemperTheNarrative,
  },
  fallback: { ...step1ForgeTheTruth },
};

// ─── Aftermath Config ────────────────────────────────────────────

const FORGE_TRUTH_AFTERMATH = {
  overview:
    'By evening the Greycloaks had a schedule and the settlement had a wound that would ' +
    'scar cleanly. Maren Ironhewn sat on the step outside her forge with a cup of something ' +
    'she was not drinking, watching the Greycloak camp\'s fires settle into their nighttime ' +
    'rhythm. The replacement work would take three weeks. Her hands ached with the particular ' +
    'fatigue of someone who had carried a weight with her body that should have been carried ' +
    'by a structure. Dalla was gone — walked out through the eastern gate under Torve\'s ' +
    'supervision, to begin the season of labor that would become the shape of her debt. The ' +
    'girl had not looked back. Maren had not expected her to. The guild elders had already ' +
    'begun discussing what they were calling "the audit" — a review of every apprentice\'s ' +
    'output across every forge in the district. It would be expensive, tedious, and necessary. ' +
    'The settlement would remember this as the season the forge went cold, and what came after. ' +
    'What kind of memory that became depended on what was built from here.',
  changes: [
    {
      id: 'truth_maren_reputation',
      kind: 'reputation' as const,
      title: 'Maren Ironhewn',
      detail: 'Reputation damaged publicly but recovering. The forge-master faced the crisis honestly.',
      polarity: 'mixed' as const,
    },
    {
      id: 'truth_dalla_exiled',
      kind: 'reputation' as const,
      title: 'Dalla',
      detail: 'Removed from the settlement. Serving the Greycloaks to clear her debt.',
      polarity: 'loss' as const,
    },
    {
      id: 'truth_torve_positive',
      kind: 'reputation' as const,
      title: 'Torve Ashgrip',
      detail: 'Cautiously positive toward the settlement. Respects the honest accounting.',
      polarity: 'gain' as const,
    },
    {
      id: 'truth_guild_audit',
      kind: 'future_hook' as const,
      title: 'Guild Under Self-Review',
      detail: 'The craft guild begins auditing all apprentice output. Institutional reform in motion.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The forge is relighting. The settlement is learning what happened. Choose what you keep hold of now that the reckoning itself is over.',
  reactions: [
    {
      id: 'truth_react_guild_self_govern',
      label: 'Let the guild learn to govern itself.',
      intent: 'Step back and allow the institutional response — the audit, the new oversight — to proceed on its own momentum. The settlement learns to police its own craft.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'guild_self_governance',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god steps back from the forge. The guild\'s audit proceeds under its own authority — institutional reform as community-owned process, not divine mandate.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'crafting.quest',
          delayTicks: 20,
          priority: 1.0,
          seedLabel: 'Guild reform and institutional overhaul',
        },
      ],
    },
    {
      id: 'truth_react_keep_maren_close',
      label: 'Keep the forge-master close.',
      intent: 'Maintain a thread of connection to Maren as she rebuilds. The forge becomes a place where divine attention lingers.',
      effects: [
        {
          kind: 'reputation_score' as const,
          delta: 0.05,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'forge_master_patronage',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god\'s attention lingers at the forge. Maren Ironhewn rebuilds under subtle divine guidance — more capable, but also more dependent.',
          significance: 0.6,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'crafting.quest',
          delayTicks: 15,
          priority: 1.1,
          seedLabel: 'Forge-master as ongoing mortal thread',
        },
      ],
    },
  ],
} as const;

const TEMPER_NARRATIVE_AFTERMATH = {
  overview:
    'The Greycloaks broke camp the following morning, satisfied. Torve Ashgrip shook ' +
    'Maren\'s hand at the gate and said something about reliability being worth more than ' +
    'perfection, and Maren nodded as if this were a compliment rather than an unwitting ' +
    'irony. The replacement schedule was generous; the reduced rates for future contracts ' +
    'were a concession that would cost the forge, but the forge would survive. Dalla left ' +
    'the settlement two days later, quietly, with a letter of reference that did not mention ' +
    'the reason for her departure. Maren had written it herself, at the kitchen table, with ' +
    'the door closed. It was the kindest thing she had done for the girl, and it was also a ' +
    'lie, and she knew that both of those things were true simultaneously.\n\n' +
    'The settlement returned to its rhythms. The forge relit. Maren\'s hammer rang again ' +
    'in the morning hours. But the god could feel, beneath the surface restoration, the ' +
    'hidden weight of what had been contained rather than released. The concealed truth sat ' +
    'in the forge like an ember banked in ash — not burning, but not cold. Torve Ashgrip ' +
    'would eventually learn how many blades had actually been compromised. Or she would not, ' +
    'and the knowledge would simply live in Maren\'s hands, in the way she inspected every ' +
    'piece of steel that left her forge with a thoroughness that looked like mastery but ' +
    'felt, to her, like penance.',
  changes: [
    {
      id: 'temper_maren_reputation',
      kind: 'reputation' as const,
      title: 'Maren Ironhewn',
      detail: 'Reputation preserved publicly. Carrying a hidden debt — the concealed truth.',
      polarity: 'mixed' as const,
    },
    {
      id: 'temper_dalla_disappeared',
      kind: 'reputation' as const,
      title: 'Dalla',
      detail: 'Quietly removed from the settlement. No public record of the reason.',
      polarity: 'mixed' as const,
    },
    {
      id: 'temper_torve_neutral',
      kind: 'reputation' as const,
      title: 'Torve Ashgrip',
      detail: 'Professionally neutral toward the settlement. Satisfied but not loyal.',
      polarity: 'mixed' as const,
    },
    {
      id: 'temper_hidden_truth',
      kind: 'future_hook' as const,
      title: 'The Concealed Truth',
      detail: 'The full scope of Dalla\'s fraud is hidden. An ember banked in ash.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The surface has settled. Beneath it, the truth sits unburned. Choose what you keep hold of now that the checkpoint itself is over.',
  reactions: [
    {
      id: 'temper_react_let_silence_hold',
      label: 'Let the silence hold.',
      intent: 'Allow the managed truth to settle into the community\'s memory unchallenged. Maren bears the weight alone. The concealment becomes permanent — or as permanent as any lie.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'concealed_truth_accepted',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god allows the managed truth to settle. The concealment may hold indefinitely — or it may surface at the worst possible time.',
          significance: 0.6,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'deception' as const,
          severity: 0.5,
          label: 'Concealed the full scope of Dalla\'s weapons fraud at Maren\'s forge',
          revealFamilies: ['investigation', 'mercenary', 'crafting'],
        },
      ],
    },
    {
      id: 'temper_react_prepare_reckoning',
      label: 'Prepare for the reckoning.',
      intent: 'Plant a seed of readiness in Maren — not revealing the truth, but ensuring she is prepared for the day it surfaces. The forge-master begins quietly setting aside resources.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'deferred_reckoning_prepared',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god prepares Maren for the day the concealed truth surfaces — resources set aside, relationships built, a new apprentice trained with more careful oversight.',
          significance: 0.7,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'deception' as const,
          severity: 0.4,
          label: 'Concealed the full scope of Dalla\'s weapons fraud — but prepared for eventual discovery',
          revealFamilies: ['investigation', 'mercenary', 'crafting'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'crafting.quest',
          delayTicks: 25,
          priority: 1.2,
          seedLabel: 'The truth surfaces at Maren\'s forge',
        },
      ],
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const FLAWED_STEEL_TEMPLATE: UnifiedActionTemplate = {
  id: 'crafting.quest.flawed_steel',
  rarityTier: 2,
  name: 'Flawed Steel',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheReckoning, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['settlement', 'town', 'city'],
  motivations: ['loyalty_ambition', 'honesty_cunning'],

  narrativeTemplates: {
    initiation:
      'A forge-master\'s apprentice has been secretly selling flawed weapons to a ' +
      'mercenary company. The mercenaries camp outside the settlement demanding ' +
      'replacements or blood-price. The forge has gone cold. The god notices.',
    success:
      'The crisis at the forge resolves — through honest reckoning or managed truth — ' +
      'and the settlement\'s craft institutions either reform or carry a hidden weight ' +
      'into the future.',
    failure:
      'The negotiation collapses. Trust is broken, weapons are seized, and the ' +
      'settlement\'s defensive supply chain fractures under the weight of fraud ' +
      'and failed diplomacy.',
  },

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      forge_the_truth: FORGE_TRUTH_AFTERMATH,
      temper_the_narrative: TEMPER_NARRATIVE_AFTERMATH,
    },
    fallback: { ...FORGE_TRUTH_AFTERMATH },
  },
};
