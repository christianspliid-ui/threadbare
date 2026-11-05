/**
 * Soul Ferryman — branching encounter using ActionStepBranch
 * and BranchAwareAftermathConfig primitives.
 *
 * A fog-shrouded river crossing where the ferryman charges soul-qualities
 * instead of coin. The god may press to break the bargain
 * or steady a courier through it.
 *
 * Design doc: Docs/plans/encounters/soul-ferryman-opus-final.md
 *
 * ─── The mortal decides (THR-2158, THR-866 pattern) ──────────────────
 *
 * The god no longer clicks an ending. Step 0 was two cards whose ids were the
 * aftermath keys, so the click picked the ending. Now the fork decides on
 * `sacrifice_survival`: a Martyr (+1) pays the soul toll so the letters cross
 * on time, a Survivor (−1) refuses the price and breaks the bargain. The god
 * argues with a composed hand — two pole-leaning specials plus a Repertoire
 * fill — and the mortal answers.
 *
 * - Fork axis: `sacrifice_survival`. `positive` = Steady the Courier,
 *   `negative` = Break the Bargain. Variants, aftermath and `stakes.arms` are
 *   keyed to the pole, because pole mode writes the bare pole key.
 * - `aftermathConfig.branchOnStep` stays 0, the deciding step (THR-979).
 * - Step 1's old approach cards picked nothing; each arm now deals an ordinary
 *   hand from the god's Repertoire.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';
import { parseEncounterContract } from '../encounter-contract-validators';
import type {
  EncounterChoiceReach,
  EncounterContract,
} from '../../types/encounter-contract';
import { MORAL_AXIS_POLES_BY_REACH, QUINTESSENCE_POLES } from '../../types/encounter-contract';

// ─── Support Bundle ──────────────────────────────────────────────

const vesikSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'vesik',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['boatman', 'ferryman', 'laborer'],
  supportRole: 'ferryman',
  spawnNpcRole: 'laborer',
  spawnName: 'Vesik',
};

const diehlSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'diehl',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['courier', 'wanderer', 'clerk'],
  supportRole: 'courier',
  spawnNpcRole: 'wanderer',
  spawnName: 'Diehl',
};

const siltCrossingSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'silt_crossing',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  sublocationTypeId: 'sublocation-type.gatehouse',
  fallbackName: 'The Silt Crossing',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  vesikSpec,
  diehlSpec,
  siltCrossingSpec,
];

// ─── Step Definitions ────────────────────────────────────────────

/**
 * Step 0: The Crossing.
 * The god perceives the fog, the ferryman, the courier's hesitation,
 * and the weight of thirty-one years of soul-tolls. Difficulty 0 —
 * the choice is the point, not the roll.
 */
const step0TheCrossing: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The fog sat on the river like a hand pressed over a mouth. It did not move. It did not thin toward the banks or gather in the hollows between the limestone ridges the way honest fog does; it simply occupied the crossing, grey-white and absolute, as if the air itself had opinions about who should pass. The punt was visible only as a shape -- flat-bottomed, dark-planked, riding low in the current with the stillness of something that had been waiting longer than wood should last. The man standing on it held a pole that was taller than he was, its end wrapped in river-weed that he had not cleaned because the weed was part of it now, part of him, part of the arrangement. He was thin in the way that fog-country people are thin, as if the damp had found its way into his joints and eaten whatever softness had once lived there. His name was {cast:vesik}. He had been the ferryman for thirty-one years, and in that time he had never once asked for coin. On the near bank, a young man in a courier\'s dustcoat stood beside a horse that would not stop pulling at its tether. The horse could smell the fog. The courier could smell it too -- river-silt and something older, something that made the teeth ache -- but he had letters to deliver and the ford was four days south, and so he stood at the waterline and listened to the ferryman explain, in a voice as flat and careful as a man reading terms he did not write, exactly what the crossing would cost.',
  successAfterimage: 'The god perceived the crossing and the weight of the bargain that holds it.',
  failureAfterimage: 'The god perceived the crossing but could not hold the fog long enough to act.',
  successAtCostAfterimage: 'The god held the fog apart, and the cold of the river crept into the courier.',
  criticalSuccessAfterimage: 'The fog thinned to a veil, and the whole bargain lay open to see.',
  criticalFailureAfterimage: 'The fog closed over everything, and the answer was given in the dark.',
  purposeLine: 'Weigh the toll',
  // THR-2158 — the fork's argument. Two specials, one per pole of
  // `sacrifice_survival`; the Repertoire fills the rest of the hand.
  nudges: [
    {
      id: 'ferryman.recall_the_letters',
      name: 'Recall The Letters',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'sacrifice_survival', toward: 'positive' },
      effectLine: 'Remind them of the sealed letters and who waits on them. A duty argues for paying the toll.',
      bandProse: {
        success: '{actor} felt the letters against their chest, and the weight of them.',
        failure: '{actor} thought of the letters, and the fog thought louder.',
      },
    },
    {
      id: 'ferryman.name_the_price',
      name: 'Name The Price',
      sphere: 'spirit',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'sacrifice_survival', toward: 'negative' },
      effectLine: 'Make plain what the ferryman takes from every soul he carries. A clear price argues for refusing it.',
      bandProse: {
        success: '{actor} saw the price plainly, and would not pay it.',
        failure: '{actor} heard the price named, and the fog swallowed the words.',
      },
    },
  ],
  deal: { count: 3, tags: ['journey', 'insight'] },
};

/**
 * Step 1 — Break the Bargain variant.
 * The god reaches into the contract between Vesik and the river
 * and severs it. Star reach (divine/transcendent) at moderate
 * difficulty (0.50) — the river has held this contract for thirty-one years.
 */
const step1BreakTheBargain: ActionStep = {
  reach: 'star',
  duration: { min: 3, max: 4 },
  difficulty: 0.50,
  onSuccess: [
    // Vesik is freed — the crossing closes, Vesik is disoriented but alive
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.10 },
    },
  ],
  onFailure: [
    // The river notices — essence spent, nothing changes
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  failBehavior: 'fail_action',
  purposeLine: 'Cut the river contract',
  deal: { count: 4, tags: ['lore', 'peril'] },
  narrativeTemplate:
    'The god reached into the fog the way a hand reaches into still water -- slowly, and with the knowledge that whatever lives below will feel the disturbance. The contract was not visible. It was not a scroll or a chain or a mark on {cast:vesik}\'s skin. It was a pressure, a tautness in the space between the ferryman and the river, as if the current held one end of a rope and the man held the other and both had been pulling for so long that neither remembered a time before the tension. The god found the rope. The god cut it. {cast:vesik} made a sound that was not a word. He dropped the pole. It floated for a moment, trailing its river-weed like hair, and then the current took it and it was gone. The punt rocked. On the near bank, {cast:diehl} stepped back from the waterline, because the fog had moved for the first time in his memory -- not thinning, exactly, but shifting, as if the thing that held it in place had lost its grip. {cast:vesik} sat down heavily on the punt\'s wet planks and pressed his hands against his face, and when he lowered them his eyes were different. They were the eyes of a man who had just woken from a dream that lasted thirty-one years, and who could not yet tell whether waking was mercy or punishment.',
  successAfterimage: 'The contract broke. {cast:vesik} woke from thirty-one years. The crossing is closed.',
  failureAfterimage: 'The river resisted. The contract held. Essence spent into the fog.',
};

/**
 * Step 1 — Steady the Courier variant.
 * The god leans into Diehl's fear, just enough to steady him onto
 * the punt. Heart reach at lower difficulty (0.35) — steadying
 * a mortal's resolve is gentler work than severing a river-contract.
 */
const step1SteadyTheCourier: ActionStep = {
  reach: 'heart',
  duration: { min: 3, max: 4 },
  difficulty: 0.35,
  onSuccess: [
    // Diehl crosses — letters delivered, toll paid
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.05 },
    },
  ],
  onFailure: [
    // Touch doesn't reach — Diehl takes the detour, letters late
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  failBehavior: 'fail_action',
  purposeLine: 'Board the punt',
  deal: { count: 4, tags: ['presence', 'journey'] },
  narrativeTemplate:
    'The god leaned into the courier\'s fear the way wind leans into a candle -- not enough to extinguish, just enough to steady. {cast:diehl} felt it. He did not know what it was. He thought perhaps it was the memory of his father telling him that a man who stops walking has already decided to fail, or perhaps it was nothing more than the quality of light that sometimes breaks through fog and makes the world seem briefly navigable. He stepped onto the punt. The planks were wet and the wood was cold, and the punt sank a quarter-inch under his weight in a way that made him think of something settling into place. {cast:vesik} looked at him. The ferryman\'s fog-pale eyes moved across the courier\'s face the way a needle moves across cloth -- finding the weave, testing the tension -- and whatever he found there he accepted without expression. "Your certainty," {cast:vesik} said, "that you are doing the right thing." He said it the way a shopkeeper names a price -- without apology, without explanation, as a statement of what the transaction requires. {cast:diehl} opened his mouth to ask what that meant, and then closed it, because he already knew. He could feel it: the weight of conviction that had carried him through the last six days on the road, the private assurance that the letters mattered, that his errand was worth the saddle-ache and the cold mornings and the long miles. {cast:vesik} held out his hand. {cast:diehl} took it. And the ferryman poled them out into the fog, and the current took them, and the near bank disappeared behind them like a sentence left unfinished.',
  successAfterimage: '{cast:diehl} crossed. The toll was paid. The letters will reach the garrison.',
  failureAfterimage: 'The touch did not reach. {cast:diehl} turned south for the ford. Letters four days late.',
};

/**
 * Step 1: Branch point. The mortal decides on `sacrifice_survival` at step 0
 * (THR-2158); the fallback breaks the bargain, as it always did.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'sacrifice_survival' },
  variants: {
    positive: step1SteadyTheCourier,
    negative: step1BreakTheBargain,
  },
  fallback: { ...step1BreakTheBargain },
};

// ─── Aftermath Config ────────────────────────────────────────────

const BREAK_BARGAIN_AFTERMATH = {
  overview:
    'By the following morning the fog had thinned enough that the limestone ridges were visible from both banks, and travelers who had been crossing at this point for years stood at the waterline and stared at the empty river as if something had died. The punt had lodged in a mudbank downstream, half-submerged, its wood already greying in the open air as if thirty-one years of service were catching up to it all at once. {cast:vesik} was sitting on the near bank with his knees drawn up, watching the water. He had not spoken since the contract broke. {cast:diehl} had stayed with him through the night, though he could not have said why, and when morning came the courier left his horse tethered and walked downstream to the ford, carrying his satchel on foot, because the letters still needed delivering and some obligations do not dissolve when the fog does. The river ran clear and cold and ordinary, and whatever had lived in the contract between {cast:vesik} and the current was gone, and the crossing was gone with it, and the travelers who had paid their soul-tolls over thirty-one years would not get them back, because the river does not make refunds.',
  changes: [
    {
      id: 'break_crossing_closed',
      kind: 'future_hook' as const,
      title: 'Silt Crossing Closed',
      detail: 'The punt is gone. Travelers must use the downstream ford — four days out of the way. Siltside hamlet trade disrupted.',
      polarity: 'loss' as const,
    },
    {
      id: 'break_vesik_unbound',
      kind: 'shell_state' as const,
      title: '{cast:vesik}',
      detail: 'Freed from the thirty-one-year contract. Disoriented, purposeless, but alive with his own eyes.',
      polarity: 'mixed' as const,
    },
    {
      id: 'break_diehl_whole',
      kind: 'shell_state' as const,
      title: '{cast:diehl}',
      detail: 'Whole — no soul-toll paid. Letters delivered late via the ford.',
      polarity: 'mixed' as const,
    },
    {
      id: 'break_fog_thinning',
      kind: 'future_hook' as const,
      title: 'Fog Thinning',
      detail: 'The fog that held the crossing is dissipating. Something that has occupied this stretch of river for decades is clearing.',
      polarity: 'gain' as const,
    },
  ],
} as const;

const STEADY_COURIER_AFTERMATH = {
  overview:
    '{cast:diehl} reached the far bank as the fog was thickening into its afternoon density, and when he stepped off the punt he stumbled -- not from the motion of the water, but from the sudden lightness of a man who has set down a weight he did not know he was carrying and discovered he needed it. {cast:vesik} poled back without a word. The punt disappeared into the fog, and the sound of the pole dipping into the water faded, and {cast:diehl} stood on the muddy bank with his satchel of letters and tried to remember why he had been so sure they mattered. They probably did. He would deliver them. He would do his job. He would continue being {cast:diehl} in every way that could be measured or observed. But the private engine that had driven him -- the felt conviction that his work meant something, that carrying messages between people who needed to speak to each other was a form of service worth the road -- was quiet now, and in its place was a space that was not empty but was no longer warm. He walked toward the garrison. The horse was still on the other side. Someone would bring it around eventually. Behind him, the fog closed over the crossing like a mouth.',
  changes: [
    {
      id: 'steady_crossing_persists',
      kind: 'future_hook' as const,
      title: 'Silt Crossing Persists',
      detail: 'The toll continues. Travelers still pay with soul-qualities. {cast:vesik} is unchanged.',
      polarity: 'mixed' as const,
    },
    {
      id: 'steady_diehl_diminished',
      kind: 'shell_state' as const,
      title: '{cast:diehl}',
      detail: 'Diminished — his certainty that he is doing the right thing was the toll. Letters delivered on time. The garrison will have their correspondence.',
      polarity: 'loss' as const,
    },
    {
      id: 'steady_letters_delivered',
      kind: 'shell_state' as const,
      title: 'The Garrison',
      detail: 'Sealed military correspondence delivered on time. The courier completed his errand.',
      polarity: 'gain' as const,
    },
    {
      id: 'steady_vesik_unchanged',
      kind: 'shell_state' as const,
      title: '{cast:vesik}',
      detail: 'The ferryman continues his contract unchanged. The river keeps what it was owed.',
      polarity: 'mixed' as const,
    },
  ],
} as const;



const ENCOUNTER_CONTRACT_METADATA_KEY = '__encounter_contract_v1';
// THR-1725 — a beat with no authored factor lines carries none, never filler.
const DEFAULT_FORECAST_FACTORS = [] as const;
const DEFAULT_STATE_DESCRIPTOR = 'no descriptor';
const DEFAULT_TILTS_TOWARD = 'uncertain';

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
  const stepIndexes = template.steps.map((_, index) => index);
  const capabilityAxisReach = template.reach === 'quintessence' ? 'star' : template.reach;

  const beats = stepIndexes.map((stepIndex) => {
    const stepReach = toStepFallbackReach(template, stepIndex);
    const step = template.steps[stepIndex] as UnifiedActionTemplate['steps'][number] | undefined;

    return {
      title: `Beat ${stepIndex + 1}`,
      forecast_factors: DEFAULT_FORECAST_FACTORS,
      prose: step && 'narrativeTemplate' in step ? (step.narrativeTemplate ?? template.narrativeTemplates.initiation) : template.narrativeTemplates.initiation,
      prose_tooltips: {},
      encounter_choices: [buildFallbackEncounterChoice(template, stepIndex, stepReach)],
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

export const SOUL_FERRYMAN_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'liminal.quest.soul_ferryman',
  stakes: {
    goal: 'cross the fog river past the soul ferryman',
    risk: 'turn south for the ford, four days late',
    won: 'broke the ferryman\'s contract with the river',
    lost: 'left the ferryman bound to the river',
    arms: {
      positive: {
        won: 'crossed and paid the toll, letters still on time',
        lost: 'turned south for the ford, four days late',
      },
    },
  },
  tags: ['#threshold_errand'],
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'Soul Ferryman',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheCrossing, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  motivations: ['sacrifice_survival', 'mercy_ruthlessness'],

  narrativeTemplates: {
    initiation:
      'A fog-shrouded river crossing where the ferryman charges soul-qualities instead of coin. ' +
      'A courier stands at the waterline deciding whether to pay. The god watches from the fog.',
    success:
      'The god acts at the crossing — severing the river-contract or steadying the courier — ' +
      'and the Silt and those who depend on it are changed by the choice.',
    failure:
      'The fog swallows the intervention. Nothing changes. The river holds its contract, ' +
      'the courier hesitates, and minor essence drains into the current.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/soul-ferryman.jpg',
  illustrationAlt: 'A gaunt ferryman stands on a dark punt in thick fog, pole in hand, while a courier hesitates at the waterline',

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: STEADY_COURIER_AFTERMATH,
      negative: BREAK_BARGAIN_AFTERMATH,
    },
    fallback: { ...BREAK_BARGAIN_AFTERMATH },
  },

  description:
    'A fog-shrouded river crossing where the ferryman charges soul-qualities instead of coin. ' +
    'A god can press to break the bargain, or steady a courier through it.',
});

export const SOUL_FERRYMAN_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(SOUL_FERRYMAN_TEMPLATE);
