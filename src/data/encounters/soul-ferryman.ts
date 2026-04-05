/**
 * Soul Ferryman — branching encounter using ActionStepBranch
 * and BranchAwareAftermathConfig primitives.
 *
 * A fog-shrouded river crossing where the ferryman charges soul-qualities
 * instead of coin. The god must decide whether to break the bargain
 * or steady a courier through it.
 *
 * Design doc: Docs/plans/encounters/soul-ferryman-opus-final.md
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

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
    'The fog sat on the river like a hand pressed over a mouth. It did not move. It did not thin toward the banks or gather in the hollows between the limestone ridges the way honest fog does; it simply occupied the crossing, grey-white and absolute, as if the air itself had opinions about who should pass. The punt was visible only as a shape -- flat-bottomed, dark-planked, riding low in the current with the stillness of something that had been waiting longer than wood should last. The man standing on it held a pole that was taller than he was, its end wrapped in river-weed that he had not cleaned because the weed was part of it now, part of him, part of the arrangement. He was thin in the way that fog-country people are thin, as if the damp had found its way into his joints and eaten whatever softness had once lived there. His name was Vesik. He had been the ferryman for thirty-one years, and in that time he had never once asked for coin. On the near bank, a young man in a courier\'s dustcoat stood beside a horse that would not stop pulling at its tether. The horse could smell the fog. The courier could smell it too -- river-silt and something older, something that made the teeth ache -- but he had letters to deliver and the ford was four days south, and so he stood at the waterline and listened to the ferryman explain, in a voice as flat and careful as a man reading terms he did not write, exactly what the crossing would cost.',
  successAfterimage: 'The god perceived the crossing and the weight of the bargain that holds it.',
  failureAfterimage: 'The god perceived the crossing but could not hold the fog long enough to act.',
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
  narrativeTemplate:
    'The god reached into the fog the way a hand reaches into still water -- slowly, and with the knowledge that whatever lives below will feel the disturbance. The contract was not visible. It was not a scroll or a chain or a mark on Vesik\'s skin. It was a pressure, a tautness in the space between the ferryman and the river, as if the current held one end of a rope and the man held the other and both had been pulling for so long that neither remembered a time before the tension. The god found the rope. The god cut it. Vesik made a sound that was not a word. He dropped the pole. It floated for a moment, trailing its river-weed like hair, and then the current took it and it was gone. The punt rocked. On the near bank, Diehl stepped back from the waterline, because the fog had moved for the first time in his memory -- not thinning, exactly, but shifting, as if the thing that held it in place had lost its grip. Vesik sat down heavily on the punt\'s wet planks and pressed his hands against his face, and when he lowered them his eyes were different. They were the eyes of a man who had just woken from a dream that lasted thirty-one years, and who could not yet tell whether waking was mercy or punishment.',
  successAfterimage: 'The contract broke. Vesik woke from thirty-one years. The crossing is closed.',
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
  narrativeTemplate:
    'The god leaned into the courier\'s fear the way wind leans into a candle -- not enough to extinguish, just enough to steady. Diehl felt it. He did not know what it was. He thought perhaps it was the memory of his father telling him that a man who stops walking has already decided to fail, or perhaps it was nothing more than the particular quality of light that sometimes breaks through fog and makes the world seem briefly navigable. He stepped onto the punt. The planks were wet and the wood was cold, and the punt sank a quarter-inch under his weight in a way that made him think of something settling into place. Vesik looked at him. The ferryman\'s fog-pale eyes moved across the courier\'s face the way a needle moves across cloth -- finding the weave, testing the tension -- and whatever he found there he accepted without expression. "Your certainty," Vesik said, "that you are doing the right thing." He said it the way a shopkeeper names a price -- without apology, without explanation, as a statement of what the transaction requires. Diehl opened his mouth to ask what that meant, and then closed it, because he already knew. He could feel it: the particular weight of conviction that had carried him through the last six days on the road, the private assurance that the letters mattered, that his errand was worth the saddle-ache and the cold mornings and the long miles. Vesik held out his hand. Diehl took it. And the ferryman poled them out into the fog, and the current took them, and the near bank disappeared behind them like a sentence left unfinished.',
  successAfterimage: 'Diehl crossed. The toll was paid. The letters will reach the garrison.',
  failureAfterimage: 'The touch did not reach. Diehl turned south for the ford. Letters four days late.',
};

/**
 * Step 1: Branch point. Resolves based on the choice made at Step 0.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    break_the_bargain: step1BreakTheBargain,
    steady_the_courier: step1SteadyTheCourier,
  },
  fallback: { ...step1BreakTheBargain },
};

// ─── Aftermath Config ────────────────────────────────────────────

const BREAK_BARGAIN_AFTERMATH = {
  overview:
    'By the following morning the fog had thinned enough that the limestone ridges were visible from both banks, and travelers who had been crossing at this point for years stood at the waterline and stared at the empty river as if something had died. The punt had lodged in a mudbank downstream, half-submerged, its wood already greying in the open air as if thirty-one years of service were catching up to it all at once. Vesik was sitting on the near bank with his knees drawn up, watching the water. He had not spoken since the contract broke. Diehl had stayed with him through the night, though he could not have said why, and when morning came the courier left his horse tethered and walked downstream to the ford, carrying his satchel on foot, because the letters still needed delivering and some obligations do not dissolve when the fog does. The river ran clear and cold and ordinary, and whatever had lived in the contract between Vesik and the current was gone, and the crossing was gone with it, and the travelers who had paid their soul-tolls over thirty-one years would not get them back, because the river does not make refunds.',
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
      kind: 'reputation' as const,
      title: 'Vesik',
      detail: 'Freed from the thirty-one-year contract. Disoriented, purposeless, but alive with his own eyes.',
      polarity: 'mixed' as const,
    },
    {
      id: 'break_diehl_whole',
      kind: 'reputation' as const,
      title: 'Diehl',
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
    'Diehl reached the far bank as the fog was thickening into its afternoon density, and when he stepped off the punt he stumbled -- not from the motion of the water, but from the sudden lightness of a man who has set down a weight he did not know he was carrying and discovered he needed it. Vesik poled back without a word. The punt disappeared into the fog, and the sound of the pole dipping into the water faded, and Diehl stood on the muddy bank with his satchel of letters and tried to remember why he had been so sure they mattered. They probably did. He would deliver them. He would do his job. He would continue being Diehl in every way that could be measured or observed. But the private engine that had driven him -- the felt conviction that his work meant something, that carrying messages between people who needed to speak to each other was a form of service worth the road -- was quiet now, and in its place was a space that was not empty but was no longer warm. He walked toward the garrison. The horse was still on the other side. Someone would bring it around eventually. Behind him, the fog closed over the crossing like a mouth.',
  changes: [
    {
      id: 'steady_crossing_persists',
      kind: 'future_hook' as const,
      title: 'Silt Crossing Persists',
      detail: 'The toll continues. Travelers still pay with soul-qualities. Vesik is unchanged.',
      polarity: 'mixed' as const,
    },
    {
      id: 'steady_diehl_diminished',
      kind: 'reputation' as const,
      title: 'Diehl',
      detail: 'Diminished — his certainty that he is doing the right thing was the toll. Letters delivered on time. The garrison will have their correspondence.',
      polarity: 'loss' as const,
    },
    {
      id: 'steady_letters_delivered',
      kind: 'reputation' as const,
      title: 'The Garrison',
      detail: 'Sealed military correspondence delivered on time. The courier completed his errand.',
      polarity: 'gain' as const,
    },
    {
      id: 'steady_vesik_unchanged',
      kind: 'reputation' as const,
      title: 'Vesik',
      detail: 'The ferryman continues his contract unchanged. The river keeps what it was owed.',
      polarity: 'mixed' as const,
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const SOUL_FERRYMAN_TEMPLATE: UnifiedActionTemplate = {
  id: 'liminal.quest.soul_ferryman',
  rarityTier: 2,
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

  authoredChoices: {
    0: [
      {
        id: 'break_the_bargain',
        label: 'Break the Bargain',
        intent:
          'Reach into the fog and find the contract — not a scroll, not a mark, but a tautness ' +
          'between the man and the river that has held for thirty-one years. Cut it. The god is ' +
          'not rescuing anyone from an evil; the ferryman is not a thief. The god is deciding ' +
          'whether this transaction should continue. Severing the contract frees Vesik from a ' +
          'bargain he made when he was drowning and young, but it closes the only crossing for ' +
          'twenty miles. Siltside loses its trade route. The bonesetter who navigates by memory ' +
          'alone will still find her way, but the grain-trader and the dozen families who have ' +
          'built their lives around the toll will feel this cut for years.',
        targetLabel: 'Vesik',
        essenceCost: 3,
        likelyBurden:
          'The crossing closes. The ford is four days south. Siltside loses its trade artery, ' +
          'and Diehl walks to the garrison on foot. The river does not make refunds.',
        interventionType: 'coercive',
      },
      {
        id: 'steady_the_courier',
        label: 'Steady the Courier',
        intent:
          'Lean into Diehl\'s fear — not enough to break it, just enough to move him. He has been ' +
          'standing at the waterline for an hour. He has the letters. He has the will, somewhere ' +
          'beneath the smell of the fog and the horse that won\'t board. The god offers the quality ' +
          'of light that sometimes breaks through fog and makes the world seem briefly navigable. ' +
          'Diehl steps onto the punt. Vesik names his price. The crossing continues. This is not ' +
          'rescue — it is a nudge that keeps the wound open and the community around it intact. ' +
          'The god chooses the crossing over the courier, and the courier loses something he ' +
          'didn\'t know he was carrying.',
        targetLabel: 'Diehl',
        essenceCost: 1,
        likelyBurden:
          'Diehl will reach the garrison and deliver the letters. He will continue being Diehl ' +
          'in every way that can be observed. But the private engine that drove him will be quiet, ' +
          'and in its place will be a space that is not empty but is no longer warm.',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      break_the_bargain: BREAK_BARGAIN_AFTERMATH,
      steady_the_courier: STEADY_COURIER_AFTERMATH,
    },
    fallback: { ...BREAK_BARGAIN_AFTERMATH },
  },

  description:
    'A fog-shrouded river crossing where the ferryman charges soul-qualities instead of coin. ' +
    'The god must decide whether to break the bargain or steady a courier through it.',
};
