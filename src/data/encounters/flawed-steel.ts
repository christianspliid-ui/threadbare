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

import type {
  UnifiedActionTemplate,
  ActionStep,
  ActionStepBranch,
  AftermathVariant,
  EncounterAftermathChange,
} from '../../types/unifiedAction';
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
 * The forge is cold, Dalla is locked in the coal shed, and Torve waits at
 * the gate for an answer. Difficulty 0 — the choice is the point, not the
 * roll. (THR-2110: all player text rewritten to Prose Doctrine v2.)
 */
const step0TheReckoning: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    '{cast:maren_ironhewn}\'s forge stands cold this morning, for the first time in years.\n\n' +
    'Her apprentice, {cast:dalla}, has been selling flawed blades under {cast:maren_ironhewn}\'s stamp. ' +
    'One broke in a fight. Now the Greycloaks, a mercenary company, are camped at the gate. Their captain, ' +
    '{cast:torve_ashgrip}, wants new blades or blood-price.\n\n' +
    '{cast:maren_ironhewn} has locked {cast:dalla} in the coal shed. She must go out and answer the captain. ' +
    'No one yet knows how many bad blades went out.',
  successAfterimage: '{cast:maren_ironhewn} put down her tools and turned toward the gate.',
  failureAfterimage: '{cast:maren_ironhewn} stood at the cold anvil and could not make herself move.',
  // THR-1634 S1: the rest of the ladder.
  successAtCostAfterimage:
    '{cast:maren_ironhewn} went to the gate an hour late, and {cast:torve_ashgrip} was angrier for the wait.',
  criticalSuccessAfterimage:
    '{cast:maren_ironhewn} counted the bad blades in her ledger before she went. She knows the whole number now.',
  criticalFailureAfterimage:
    '{cast:maren_ironhewn} shouted at the shed door, and {cast:dalla} stopped answering her.',
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
    'The god steadies {cast:maren_ironhewn}\'s nerve. She unbolts the coal shed and walks her apprentice ' +
    'out to the Greycloak camp. There she tells {cast:torve_ashgrip} the whole truth. The flaw came from ' +
    'her forge, under her name, and the apprentice beside her sold it. Then she asks for the captain\'s terms.',
  successMetadata: {
    reputationDelta: -0.05,
  },
  failureMetadata: {
    reputationDelta: -0.20,
  },
  successAfterimage: '{cast:torve_ashgrip} heard the whole account and accepted it. She respects a smith who owns her fault.',
  failureAfterimage: 'The talks broke down. {cast:torve_ashgrip} would not trust a forge that had sold bad steel for months.',
  // THR-1634 S1.
  successAtCostAfterimage: '{cast:torve_ashgrip} accepted the account on hard terms: free replacements, and a month of work without pay.',
  criticalSuccessAfterimage: '{cast:torve_ashgrip} offered her hand first. The Greycloaks will speak well of the forge in other towns.',
  criticalFailureAfterimage: 'The full count of bad blades was worse than anyone expected. {cast:torve_ashgrip} tore up the contract on the spot.',
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
    'The god leans {cast:maren_ironhewn} toward a smaller story. She leaves her apprentice in the shed and ' +
    'goes to the gate alone, with a ledger and a new blade. She tells {cast:torve_ashgrip} that one bad ' +
    'load of ore caused the flaw. Every number in the ledger is true. It leaves out months of sales.',
  successMetadata: {
    reputationDelta: 0.05,
  },
  failureMetadata: {
    reputationDelta: -0.25,
  },
  successAfterimage: '{cast:torve_ashgrip} tested the new blade, believed the story, and agreed to a schedule for replacements.',
  failureAfterimage: '{cast:torve_ashgrip} saw through the story. Being lied to angered her more than the bad steel had.',
  // THR-1634 S1.
  successAtCostAfterimage: '{cast:torve_ashgrip} believed the story, but asked a lower price on every future contract.',
  criticalSuccessAfterimage: '{cast:torve_ashgrip} thanked the forge for catching the flaw, and promised it more orders.',
  criticalFailureAfterimage: '{cast:torve_ashgrip} caught the lie as they shook hands, and said so loud enough for the whole settlement to hear.',
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
    'The god holds back. After an hour, {cast:maren_ironhewn} walks to the gate on her own. She has not ' +
    'planned what to say, and she stumbles through it. A town guard brings {cast:dalla} out of the shed ' +
    'without being asked. The settlement watches from the walls.',
  successMetadata: {
    reputationDelta: 0,
  },
  failureMetadata: {
    reputationDelta: -0.10,
  },
  successAfterimage: '{cast:maren_ironhewn} gave part of the account, and {cast:torve_ashgrip} took it. The settlement got through with no god\'s help.',
  failureAfterimage: '{cast:maren_ironhewn} and {cast:torve_ashgrip} traded accusations, and the Greycloaks reached for their weapons.',
  // THR-1634 S1.
  successAtCostAfterimage: 'The settlement got through, but the quarrel at the gate cost {cast:maren_ironhewn} her seat among the guild elders.',
  criticalSuccessAfterimage: '{cast:maren_ironhewn} found the right words on her own. {cast:torve_ashgrip} accepted a rough but honest account.',
  criticalFailureAfterimage: 'The quarrel at the gate spread to the guild and the townsfolk. By nightfall, the settlement had split into two sides.',
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
    'The Greycloaks have a schedule for new blades, and the work will take three weeks. {cast:dalla} ' +
    'has left with them under guard, to work off her debt. The guild elders have ordered an audit of ' +
    'every apprentice in the district. {cast:maren_ironhewn}\'s name took a public blow, but people ' +
    'trust her word.',
  changes: [
    {
      id: 'truth_maren_reputation',
      kind: 'reputation' as const,
      title: '{cast:maren_ironhewn}',
      detail: 'Her name took a blow in public, and is mending. She told the truth.',
      polarity: 'mixed' as const,
    },
    {
      id: 'truth_dalla_exiled',
      kind: 'reputation' as const,
      title: '{cast:dalla}',
      detail: 'Gone from the settlement. She works for the Greycloaks to pay what she owes.',
      polarity: 'loss' as const,
    },
    {
      id: 'truth_torve_positive',
      kind: 'reputation' as const,
      title: '{cast:torve_ashgrip}',
      detail: 'Warmer toward the settlement. She respects the honest account.',
      polarity: 'gain' as const,
    },
    {
      id: 'truth_guild_audit',
      kind: 'future_hook' as const,
      title: 'Guild Under Self-Review',
      detail: 'The craft guild is checking the work of every apprentice it has.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The forge is lit again, and the audit has begun. Where does the god\'s attention go now?',
  reactions: [
    {
      id: 'truth_react_guild_self_govern',
      label: 'Let the guild learn to govern itself.',
      intent: 'Step back. Let the guild run its own checks and learn to police its own craft.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god steps back from the forge. The guild runs its audit on its own authority.',
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
      intent: 'Stay near {cast:maren_ironhewn} while she rebuilds. She grows more skilled, and leans on the god more.',
      effects: [
        {
          kind: 'reputation_score' as const,
          delta: 0.05,
        },
        {
          kind: 'reputation_tally' as const,
          key: 'heart.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god stays near the forge. {cast:maren_ironhewn} rebuilds with its help, more skilled and more dependent.',
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
    'The Greycloaks have broken camp, satisfied. {cast:maren_ironhewn} agreed to lower prices on future ' +
    'contracts, and the forge can bear the cost. {cast:dalla} has left quietly, with a letter of ' +
    'reference that does not say why. The forge is working again. The Greycloaks never learned how ' +
    'many flawed blades went out.',
  changes: [
    {
      id: 'temper_maren_reputation',
      kind: 'reputation' as const,
      title: '{cast:maren_ironhewn}',
      detail: 'Her name is safe in public. She keeps the full story to herself.',
      polarity: 'mixed' as const,
    },
    {
      id: 'temper_dalla_disappeared',
      kind: 'reputation' as const,
      title: '{cast:dalla}',
      detail: 'Gone quietly. No record says why she left.',
      polarity: 'mixed' as const,
    },
    {
      id: 'temper_torve_neutral',
      kind: 'reputation' as const,
      title: '{cast:torve_ashgrip}',
      detail: 'Satisfied with the deal, and loyal to no one. She buys here while the price is right.',
      polarity: 'mixed' as const,
    },
    {
      id: 'temper_hidden_truth',
      kind: 'future_hook' as const,
      title: 'The Concealed Truth',
      detail: 'The full count of {cast:dalla}\'s bad blades is hidden. It can still come out.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt: 'The deal holds, and the truth stays hidden. What does the god do with the secret?',
  reactions: [
    {
      id: 'temper_react_let_silence_hold',
      label: 'Let the silence hold.',
      intent: 'Leave the secret buried. {cast:maren_ironhewn} carries it alone, for as long as it stays hidden.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'shadow.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god leaves the forge\'s secret buried. It may hold for good, or come out at the worst time.',
          significance: 0.6,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'deception' as const,
          severity: 0.5,
          label: 'Concealed the full scope of {cast:dalla}\'s weapons fraud at {cast:maren_ironhewn}\'s forge',
          revealFamilies: ['investigation', 'mercenary', 'crafting'],
        },
      ],
    },
    {
      id: 'temper_react_prepare_reckoning',
      label: 'Prepare for the reckoning.',
      intent: 'Ready {cast:maren_ironhewn} for the day the truth comes out. She starts setting money aside and training a new apprentice with care.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god readies {cast:maren_ironhewn} for the day the secret comes out. She sets money aside and watches her new apprentice closely.',
          significance: 0.7,
        },
        {
          kind: 'hidden_mark' as const,
          category: 'deception' as const,
          severity: 0.4,
          label: 'Concealed the full scope of {cast:dalla}\'s weapons fraud — but prepared for eventual discovery',
          revealFamilies: ['investigation', 'mercenary', 'crafting'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'crafting.quest',
          delayTicks: 25,
          priority: 1.2,
          seedLabel: 'The truth surfaces at {cast:maren_ironhewn}\'s forge',
        },
      ],
    },
  ],
} as const;

const WITHDRAWN_AFTERMATH = {
  overview:
    'The settlement handled the crisis with no god\'s help. {cast:torve_ashgrip} took what she could get. ' +
    'The Greycloaks left with a replacement schedule nobody liked. The guild elders expelled {cast:dalla} ' +
    'in a closed session, and the news was out within the hour. The forge is lit again, but people doubt ' +
    'its steel.',
  changes: [
    {
      id: 'withdrawn_maren_reputation',
      kind: 'reputation' as const,
      title: '{cast:maren_ironhewn}',
      detail: 'She handled it alone. Her name is hurt, and still standing.',
      polarity: 'mixed' as const,
    },
    {
      id: 'withdrawn_dalla_expelled',
      kind: 'reputation' as const,
      title: '{cast:dalla}',
      detail: 'Expelled by the guild elders. She left with no farewell.',
      polarity: 'loss' as const,
    },
    {
      id: 'withdrawn_torve_neutral',
      kind: 'reputation' as const,
      title: '{cast:torve_ashgrip}',
      detail: 'The Greycloaks will not buy from this forge again.',
      polarity: 'loss' as const,
    },
    {
      id: 'withdrawn_messy_resolution',
      kind: 'future_hook' as const,
      title: 'A Messy Resolution',
      detail: 'No reform follows, and the settlement trusts its forge less than before.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The settlement found its own rough answer. Does the god walk away, or keep watching?',
  reactions: [
    {
      id: 'withdrawn_react_accept',
      label: 'Accept the outcome.',
      intent: 'Walk away. The answer is rough, and it belongs to the settlement.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god stayed out of the trouble at the forge, and left the settlement to its own answer.',
          significance: 0.5,
        },
      ],
    },
    {
      id: 'withdrawn_react_watch',
      label: 'Keep watching the settlement.',
      intent: 'Stay close and watch what the settlement builds next: anger, reform or a quiet fix.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'eye.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god keeps watching the forge, to see what the settlement does next.',
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

// ─── Band endings (THR-1634 S1) ──────────────────────────────────
//
// Every arm is `fail_action`, so each path can end on `failure` and
// `critical_failure` (`reachableLosingBandsOnPath`), and each variant's base
// ending is written in the success register. These overrides re-tell how the
// ending landed on a loss. They reuse only chips the variant already carries,
// dropping the ones a loss makes untrue (UI Law 56: no chip without a write
// behind it), and add no effect.

/** The subset of a variant's own chips, by id — never a new chip. */
function keepChanges(
  variant: { readonly changes: readonly EncounterAftermathChange[] },
  ids: readonly string[],
): readonly EncounterAftermathChange[] {
  return variant.changes.filter((change) => ids.includes(change.id));
}

const FORGE_TRUTH_ENDINGS: AftermathVariant = {
  ...FORGE_TRUTH_AFTERMATH,
  byOutcome: {
    failure: {
      overview:
        'The Greycloaks have taken the forge\'s finished stock as payment and gone. {cast:dalla} went with ' +
        'them under guard, to work off her debt. {cast:maren_ironhewn}\'s racks stand empty. The guild elders ' +
        'have begun an audit of every apprentice in the district.',
      changes: keepChanges(FORGE_TRUTH_AFTERMATH, ['truth_dalla_exiled', 'truth_guild_audit']),
    },
    critical_failure: {
      overview:
        'No mercenary company will buy from this forge again. {cast:torve_ashgrip} seized the finished stock ' +
        'and called {cast:maren_ironhewn} a fraud at the gate. {cast:torve_ashgrip} tells the same story in ' +
        'every town on the Greycloaks\' road. {cast:dalla} left in chains. The guild\'s audit starts with {cast:maren_ironhewn}\'s own racks.',
      changes: keepChanges(FORGE_TRUTH_AFTERMATH, ['truth_dalla_exiled', 'truth_guild_audit']),
    },
  },
};

// The managed truth's base chips all say the concealment held, and its two
// reactions both keep it. On a loss it did not hold, so the losing bands carry
// no chip and no reaction rather than a false one.
const TEMPER_NARRATIVE_ENDINGS: AftermathVariant = {
  ...TEMPER_NARRATIVE_AFTERMATH,
  byOutcome: {
    failure: {
      overview:
        'The Greycloaks took the blades they were owed and cancelled every future contract. {cast:dalla} left ' +
        'that night, with no reference. The forge is lit again, but the settlement knows ' +
        '{cast:maren_ironhewn} tried to hide how many blades were flawed.',
      changes: [],
      reactions: [],
    },
    critical_failure: {
      overview:
        'The whole settlement now knows the forge lied. The Greycloaks took every blade on the racks. In each ' +
        'town on their road they say {cast:maren_ironhewn}\'s stamp cannot be trusted. {cast:dalla} ran before ' +
        'the guild could send for her. Fewer customers come to the forge now.',
      changes: [],
      reactions: [],
    },
  },
};

const WITHDRAWN_ENDINGS: AftermathVariant = {
  ...WITHDRAWN_AFTERMATH,
  byOutcome: {
    failure: {
      overview:
        'The militia had to stand between the two sides at the gate. The Greycloaks left with less than they ' +
        'were owed, and swore never to buy here again. The guild elders expelled {cast:dalla} that evening. ' +
        'The forge is lit again, and fewer customers come.',
    },
    critical_failure: {
      overview:
        'The quarrel spread from the gate to the guild hall. The elders argued in public about who trained ' +
        '{cast:dalla} and who vouched for her. {cast:torve_ashgrip} left with part of an account and no new ' +
        'blades. The guild expelled {cast:dalla}. Half the settlement no longer buys from the forge.',
    },
  },
};

const ENCOUNTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
// THR-1725 — a beat with no authored factor lines carries none, never filler.
const DEFAULT_FORECAST_FACTORS = [] as const;
const DEFAULT_STATE_DESCRIPTOR = 'no descriptor';
const DEFAULT_TILTS_TOWARD = 'uncertain';

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
    agent_reaction: (step && 'successAfterimage' in step ? step.successAfterimage : undefined) || template.narrativeTemplates.success,
    tilts_toward: DEFAULT_TILTS_TOWARD,
    moral_axis_pole: poles[0],
    fail_forward: (step && 'failureAfterimage' in step ? step.failureAfterimage : undefined) || template.narrativeTemplates.failure,
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
        agent_reaction: choice.intent || choice.label,
        tilts_toward: choice.targetLabel ?? DEFAULT_TILTS_TOWARD,
        moral_axis_pole: toEncounterArchetypePole(reach, choice),
        fail_forward: choice.likelyBurden || template.narrativeTemplates.failure,
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

export const FLAWED_STEEL_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'crafting.quest.flawed_steel',
  stakes: {
    goal: 'settle the flawed-blade fraud with the mercenaries',
    risk: 'see the forge called a fraud on the road',
    won: 'settled the fraud with a full account',
    lost: 'lost the forge\'s finished stock to the mercenaries',
    lostBadly: 'saw the forge called a fraud in every town',
    arms: {
      temper_the_narrative: {
        won: 'settled the fraud with a smaller story',
        lost: 'saw the story fail and every contract cancelled',
        lostBadly: 'saw the lie caught at the handshake',
      },
      keep_your_hand_folded: {
        won: 'saw the settlement settle it alone',
        lost: 'saw the gate talk turn to a standoff',
        lostBadly: 'saw the settlement turn on itself',
      },
    },
  },
  tags: ['#craft_commission'],
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'Flawed Steel',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheReckoning, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  // THR-1511: `capital` added — a masterwork made in a capital brought no commission,
  // 3 of the 7 catalyst withers on seed 42 / medium / 200 ticks. (`settlement` is not a
  // subtype any location carries; kept so no drawn set narrows, but it gates nothing.)
  // THR-1515: `hamlet` added — a village forge sells flawed steel as readily as a city
  // one, and a masterwork made at a hamlet had no commission to follow it. `settlement`
  // dropped: no location carries it, so it gated nothing and read as real to an author.
  locationSubtypes: ['hamlet', 'town', 'city', 'capital'],
  motivations: ['loyalty_ambition', 'honesty_cunning'],

  narrativeTemplates: {
    initiation:
      'A forge-master\'s apprentice has sold flawed blades to a mercenary company. The ' +
      'mercenaries are camped at the gate, demanding new blades or blood-price. The forge ' +
      'has gone cold.',
    success:
      'The forge settles with the mercenaries, by a full account, a smaller story, or ' +
      'whatever the settlement manages on its own.',
    failure:
      'The talks at the gate fail. The mercenaries seize the forge\'s blades, and the ' +
      'settlement loses their trust.',
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
          'Calm the people at the gate a little. {cast:maren_ironhewn} still has to carry the talk herself.',
        essenceCost: 1,
        likelyBurden:
          'A light touch may not be enough. {cast:torve_ashgrip} may still doubt what ' +
          '{cast:maren_ironhewn} tells her.',
        interventionType: 'supportive',
      },
      {
        id: 'strike_while_the_iron_burns',
        label: 'Strike While the Iron Burns',
        intent:
          'Push hard on the talk at the gate. Whatever {cast:maren_ironhewn} chose to say lands with force, ' +
          'and everyone there feels the push.',
        essenceCost: 3,
        likelyBurden:
          '{cast:maren_ironhewn} may come to lean on the god\'s push, and {cast:torve_ashgrip} will remember ' +
          'being steered.',
        interventionType: 'coercive',
      },
    ],
    0: [
      {
        id: 'forge_the_truth',
        label: 'Forge the truth',
        intent:
          'Steady {cast:maren_ironhewn} so she opens the gate and tells the whole truth. Her shame will ' +
          'be public.',
        targetLabel: '{cast:maren_ironhewn}',
        essenceCost: 2,
        likelyBurden:
          'The whole settlement will know the forge failed. {cast:maren_ironhewn}\'s name takes the blow ' +
          'in public.',
        interventionType: 'supportive',
      },
      {
        id: 'temper_the_narrative',
        label: 'Temper the narrative',
        intent:
          'Lean {cast:maren_ironhewn} toward a smaller story: one bad load of ore, caught early. The real ' +
          'count stays hidden.',
        targetLabel: '{cast:torve_ashgrip}',
        essenceCost: 2,
        likelyBurden:
          'The hidden count becomes a debt. If {cast:torve_ashgrip} learns it, the lie will anger her ' +
          'more than the fraud.',
        interventionType: 'coercive',
      },
      {
        id: 'keep_your_hand_folded',
        label: 'Keep your hand folded',
        intent:
          'Hold back. {cast:maren_ironhewn} must find her own way to the gate, and whoever has the most ' +
          'nerve sets the terms.',
        targetLabel: 'the settlement',
        essenceCost: 0,
        likelyBurden:
          'The god keeps its essence. The settlement\'s answer will be its own, and it may be a poor one.',
        interventionType: 'withdrawn',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      forge_the_truth: FORGE_TRUTH_ENDINGS,
      temper_the_narrative: TEMPER_NARRATIVE_ENDINGS,
      keep_your_hand_folded: WITHDRAWN_ENDINGS,
    },
    fallback: { ...FORGE_TRUTH_ENDINGS },
  },
});

export const FLAWED_STEEL_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(FLAWED_STEEL_TEMPLATE);
