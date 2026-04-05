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
  successAfterimage: 'The god perceived the threads of the forge and chose how to pull.',
  failureAfterimage: 'The god perceived the threads of the forge but could not find purchase.',
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
  successAfterimage: 'Maren faced the Greycloaks with a full accounting. The truth was painful, but Torve respected the honesty.',
  failureAfterimage: 'Maren tried to face the Greycloaks openly, but the negotiation collapsed under the weight of the full disclosure.',
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
  successAfterimage: 'The managed truth held. Torve accepted the framing and the forge survived without burning the relationship.',
  failureAfterimage: 'Torve saw through the managed truth. The attempted deception stung worse than the original fraud.',
};

/**
 * Step 1: Branch point. Resolves based on the choice made at Step 0.
 */
/**
 * Step 1 — Withdrawn variant: Keep Your Hand Folded.
 * The god does not intervene. The settlement resolves on its own.
 * Heart reach at low difficulty (0.25) — the situation may resolve
 * badly without divine pressure, but it resolves honestly.
 */
const step1KeepYourHandFolded: ActionStep = {
  reach: 'heart',
  duration: { min: 3, max: 4 },
  difficulty: 0.25,
  onSuccess: [],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.10 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god did not move. Maren Ironhewn stood at her anvil for another hour, ' +
    'and then she did what forge-masters have always done when the metal will not ' +
    'take the shape they need: she set down her tools and walked to the gate under ' +
    'her own power. What followed was neither the clean reckoning of divine honesty ' +
    'nor the managed efficiency of divine pragmatism. It was the messy, halting, ' +
    'human negotiation of a woman whose pride and whose guilt were fighting for ' +
    'control of the same pair of hands. Torve listened. Maren stumbled over the ' +
    'words she had not rehearsed. Dalla was brought from the coal shed by a militia ' +
    'captain who did not understand what he was walking into. The Greycloaks did not ' +
    'get the accounting they deserved, and Maren did not get the dignity she wanted, ' +
    'and the settlement watched from the walls with the uneasy awareness that the ' +
    'forge — the thing that made their weapons — had been compromised, and no one ' +
    'was entirely sure how badly.',
  successMetadata: {
    reputationDelta: 0,
  },
  failureMetadata: {
    reputationDelta: -0.10,
  },
  successAfterimage: 'The settlement resolved its own crisis — messily, but without divine interference.',
  failureAfterimage: 'Without divine guidance, the negotiation collapsed into recrimination and armed tension.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    forge_the_truth: step1ForgeTheTruth,
    temper_the_narrative: step1TemperTheNarrative,
    keep_your_hand_folded: step1KeepYourHandFolded,
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

const WITHDRAWN_AFTERMATH = {
  overview:
    'The settlement handled it the way settlements handle things when no one is steering: ' +
    'unevenly, with raised voices and lowered expectations. Maren gave Torve a partial ' +
    'accounting and Torve took what she could get. The Greycloaks left with a replacement ' +
    'schedule that satisfied no one fully and offended no one enough to fight over. Dalla ' +
    'was expelled by the guild elders in a closed session that leaked within the hour. ' +
    'The forge relit, but the settlement\'s confidence in its own craft infrastructure ' +
    'had taken a wound that no god had shaped and no god could easily mend.',
  changes: [
    {
      id: 'withdrawn_maren_reputation',
      kind: 'reputation' as const,
      title: 'Maren Ironhewn',
      detail: 'Handled the crisis alone. Reputation damaged but not destroyed.',
      polarity: 'mixed' as const,
    },
    {
      id: 'withdrawn_dalla_expelled',
      kind: 'reputation' as const,
      title: 'Dalla',
      detail: 'Expelled by the guild in a closed session. Left without ceremony.',
      polarity: 'loss' as const,
    },
    {
      id: 'withdrawn_torve_neutral',
      kind: 'reputation' as const,
      title: 'Torve Ashgrip',
      detail: 'Unsatisfied but unwilling to escalate. The Greycloaks will not return to this forge.',
      polarity: 'loss' as const,
    },
    {
      id: 'withdrawn_messy_resolution',
      kind: 'future_hook' as const,
      title: 'A Messy Resolution',
      detail: 'The settlement remembers a crisis that was survived, not solved. No institutional reform, no clean story.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The forge is relit but the settlement is unsettled. You did not shape this outcome. Choose what stays with you.',
  reactions: [
    {
      id: 'withdrawn_react_accept',
      label: 'Accept the outcome.',
      intent: 'The settlement resolved its own crisis. The result is imperfect but it is theirs. Walk away clean.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god chose not to intervene at the forge. The settlement found its own imperfect resolution.',
          significance: 0.5,
        },
      ],
    },
    {
      id: 'withdrawn_react_watch',
      label: 'Watch what grows from the wreckage.',
      intent: 'Something will grow from this — resentment, reform, or quiet adaptation. Stay close enough to see which.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'forge_crisis_observer',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god watches the forge\'s aftermath unfold without intervention — waiting to see what the settlement builds from its own wreckage.',
          significance: 0.5,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'crafting.quest',
          delayTicks: 20,
          priority: 0.9,
          seedLabel: 'Aftermath of the unmanaged forge crisis',
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

  illustrationUrl: '/concept-art/encounters/flawed-steel.jpg',
  illustrationAlt: 'The interior of a cold forge at dawn — racks of finished blades, an anvil with a demand letter, and the forge-master standing with her back to a bolted coal shed door.',

  authoredChoices: {
    1: [
      {
        id: 'temper_the_moment',
        label: 'Temper the Moment',
        intent:
          'The god moves with a craftsperson\'s restraint — a light hand on the bellows, ' +
          'not a hammer blow. The intervention arrives as a current of steadiness rather ' +
          'than a command: Maren\'s voice settles, Dalla\'s chin lifts a fraction, Torve\'s ' +
          'expression reads the room and finds it coherent. The god shapes the conditions ' +
          'of the scene without rewriting it. What the mortal does next remains theirs to own.',
        essenceCost: 1,
        likelyBurden:
          'A light touch may not hold under scrutiny. Torve is a professional and Maren\'s ' +
          'composure is not the same thing as her honesty — the forge-master still has to carry the weight herself.',
        interventionType: 'supportive',
      },
      {
        id: 'strike_while_the_iron_burns',
        label: 'Strike While the Iron Burns',
        intent:
          'The god reaches through the morning air with unmistakable divine force — not a nudge ' +
          'but a strike on hot metal, reshaping the scene while it is still malleable. Whatever ' +
          'path was chosen at the anvil, the god now makes it land with full authority. Torve ' +
          'will sense something beyond the mortal. Maren will feel herself carried on a current ' +
          'that is not entirely her own. The outcome becomes nearly inevitable — and the god\'s ' +
          'fingerprints are left in the cooling steel.',
        essenceCost: 3,
        likelyBurden:
          'Force at the forge leaves marks. Maren may come to rely on the god\'s hand rather than ' +
          'her own resolve, and Torve Ashgrip does not forget the feeling of being steered.',
        interventionType: 'coercive',
      },
    ],
    0: [
      {
        id: 'forge_the_truth',
        label: 'Forge the truth',
        intent:
          'Steady the forge-master\'s resolve and tilt her toward public honesty. ' +
          'Let the weight of what Dalla did settle into Maren\'s bearing until the ' +
          'only path that feels survivable is the one that begins with opening the ' +
          'gate and saying what happened. This is the heavier pull — not because ' +
          'honesty is hard to find, but because the shame it carries will be public, ' +
          'and public shame changes institutions. The guild will audit. The settlement ' +
          'will remember. Maren will stand in the open with her failure visible, and ' +
          'the god who steadied her hand will feel the cost of every eye that watches.',
        targetLabel: 'Maren Ironhewn',
        essenceCost: 2,
        likelyBurden:
          'The settlement will remember this as the season the forge went cold. ' +
          'Maren\'s reputation takes the hit honestly — but honest hits leave cleaner scars.',
        interventionType: 'supportive',
      },
      {
        id: 'temper_the_narrative',
        label: 'Temper the narrative',
        intent:
          'Whisper into the gaps between what Maren knows and what she is willing ' +
          'to say aloud. Reshape how Torve Ashgrip perceives the scale of the problem — ' +
          'not a lie, but a managed truth. A materials defect caught early, not a sustained ' +
          'fraud. The god\'s touch is lighter here, subtler: a shimmer in perception, a ' +
          'nudge toward the version of events that lets the forge survive without burning ' +
          'the relationship that funds it. But managed truths have weight. They sit in the ' +
          'hands of the person who manages them, and they do not dissolve with time.',
        targetLabel: 'Torve Ashgrip',
        essenceCost: 2,
        likelyBurden:
          'The concealed truth becomes a hidden debt. Torve may eventually learn ' +
          'how many blades were actually compromised — and the deception will sting worse than the fraud.',
        interventionType: 'coercive',
      },
      {
        id: 'keep_your_hand_folded',
        label: 'Keep your hand folded',
        intent:
          'Hold your essence. Let Maren stand at the anvil with the letter in her hand ' +
          'and find her own way to the gate — or not. Let Torve\'s patience run to its ' +
          'natural end. Let Dalla breathe in the coal shed until shame or defiance wins. ' +
          'The settlement will resolve this the way settlements always resolve things when ' +
          'no god leans on the scales: messily, slowly, with the outcome shaped by whoever ' +
          'has the most nerve at the worst moment.',
        targetLabel: 'the settlement',
        essenceCost: 0,
        likelyBurden:
          'You keep your strength, but you may lose authorship of the outcome entirely. ' +
          'The story that leaves the forge will not bear your shape.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      forge_the_truth: FORGE_TRUTH_AFTERMATH,
      temper_the_narrative: TEMPER_NARRATIVE_AFTERMATH,
      keep_your_hand_folded: WITHDRAWN_AFTERMATH,
    },
    fallback: { ...FORGE_TRUTH_AFTERMATH },
  },
};
