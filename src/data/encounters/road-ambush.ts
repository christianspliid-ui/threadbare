/**
 * Road Ambush — branching encounter using ActionStepBranch
 * and BranchAwareAftermathConfig primitives.
 *
 * A trade road ambush already in progress: six former soldiers have
 * blocked the road, the merchant's lead driver is wounded, and the
 * bandit captain is losing control of his youngest fighter. The god
 * must decide whether to Shield the Road or Turn the Chaos.
 *
 * Design doc: Docs/plans/encounters/road-ambush-final.md
 *
 * ─── The mortal decides (THR-2158, THR-866 pattern) ──────────────────
 *
 * The god no longer clicks an ending. Step 0 was two cards whose ids were the
 * aftermath keys, so the click picked the ending. Now the fork decides on
 * `mercy_ruthlessness`: a Protector (+1) shields the road, a Conqueror (−1)
 * turns the chaos to profit. The god argues with a composed hand — two
 * pole-leaning specials plus a Repertoire fill — and the mortal answers.
 *
 * - Fork axis: `mercy_ruthlessness`. `positive` = Shield the Road,
 *   `negative` = Turn the Chaos. Variants, aftermath and `stakes.arms` are keyed
 *   to the pole, because pole mode writes the bare pole key
 *   (`branchDecision.ts` → `recordDecidedChoice`).
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

const sorayaSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'soraya',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['merchant', 'trader', 'vendor'],
  supportRole: 'merchant',
  spawnNpcRole: 'wanderer',
  spawnName: 'Soraya Kelk',
};

const draganSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'dragan',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['soldier', 'guard', 'bandit'],
  supportRole: 'bandit_captain',
  spawnNpcRole: 'soldier',
  spawnName: 'Dragan Halfmast',
};

const leadDriverSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'lead_driver',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['driver', 'teamster', 'laborer'],
  supportRole: 'teamster',
  spawnNpcRole: 'laborer',
  spawnName: 'Lead Driver',
};

const tradeRoadSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'trade_road',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  sublocationTypeId: 'sublocation-type.gatehouse',
  fallbackName: 'The Trade Road',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  sorayaSpec,
  draganSpec,
  leadDriverSpec,
  tradeRoadSpec,
];

// ─── Step Definitions ────────────────────────────────────────────

/**
 * Step 0: The God Perceives the Violence.
 * The ambush is already underway. The god reads the threads of the
 * situation and decides how to intervene. Difficulty 0 —
 * the choice is the point, not the roll.
 */
const step0TheGodPerceivestheViolence: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god smelled the ambush before seeing it -- iron in the air, the sharp tang of a crossbow string recently released, and beneath that the sour-sweet stink of fear sweat from too many bodies in a confined space. The trade road bent around a stand of birches whose bark was peeling in long pale strips, and past the bend the road was blocked. A felled oak, its cut face still pale where the axe had bitten, lay across the packed earth between two waymarker stones that had been carved before anyone alive could remember. The stones were mossy, the runes worn to suggestions. The oak was fresh.\n\nThree wagons had stopped hard, the lead horses stamping and wide-eyed, their driver slumped sideways on the bench with a crossbow bolt standing from his left shoulder like a crude pennant. Blood had soaked through his coat and was dripping onto the footboard in a rhythm that would not last. Behind the second wagon, two guards fought from cover -- swords out, movements professional, economy of motion that said they had done this before but not against this many. Six figures in the ditches on either side, wearing tabards so faded that the insignia was only a memory in thread. Former soldiers. Their stances said discipline; their faces said hunger.\n\nA woman crouched in the bed of the third wagon, her hand white-knuckled around a short axe, watching the fight with the expression of someone calculating odds she did not like. {cast:soraya} had run goods along this road since before the border war, and she knew what an ambush looked like when it was going badly for the ambushers -- but also what it looked like when a robbery was about to become something worse. Near the lead wagon, the youngest of the attackers was advancing on the wounded driver with a short sword held wrong, the grip of someone who had learned to kill but not to fight, and his captain -- a thick man with a maimed hand and a voice going hoarse from shouting -- was trying to call him back without admitting that calling him back was a retreat.\n\nThe threads pulled tight in the dust and the shouting and the slow drip from the driver\'s shoulder. The god\'s attention settled on the road like a hand on a blade\'s edge.',
  successAfterimage: 'The god perceived the ambush and the weight of the choice it required.',
  failureAfterimage: 'The god perceived the ambush but could not hold the threads long enough to act.',
  successAtCostAfterimage: 'The god held the road in view, and the bolt in the driver went deeper while it looked.',
  criticalSuccessAfterimage: 'Every thread on the road stood clear, and the mortal saw them all.',
  criticalFailureAfterimage: 'The road blurred into dust and shouting, and the mortal chose half-blind.',
  purposeLine: 'Read the ambush',
  // THR-2158 — the fork's argument. Two specials, one per pole of
  // `mercy_ruthlessness`; the Repertoire fills the rest of the hand.
  nudges: [
    {
      id: 'ambush.show_the_driver',
      name: 'Show The Wounded Driver',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
      effectLine: 'Turn their eyes to the driver bleeding on the bench. A dying man argues for the shield.',
      bandProse: {
        success: '{actor} could not look away from the driver on the bench.',
        failure: '{actor} saw the driver bleeding, and looked past him anyway.',
      },
    },
    {
      id: 'ambush.show_the_cracked_crate',
      name: 'Show The Cracked Crate',
      sphere: 'chaos',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'mercy_ruthlessness', toward: 'negative' },
      effectLine: 'Let them notice the split crate and what spilled from it. Loose goods argue for the harvest.',
      bandProse: {
        success: '{actor} marked the spilled letters and the heavy little case.',
        failure: '{actor} saw the spilled crate, and the fight pulled their eyes away.',
      },
    },
  ],
  deal: { count: 3, tags: ['peril', 'insight'] },
};

/**
 * Step 1 — Shield the Road variant.
 * The god pours Iron-reach force into the defense of the caravan.
 * Iron reach at moderate difficulty (0.45) — working with existing
 * defenders, not fighting alone.
 */
const step1ShieldTheRoad: ActionStep = {
  reach: 'iron',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  difficultyContext: 'intel_sensitive',
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.10 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.05 },
    },
  ],
  failBehavior: 'fail_action',
  purposeLine: 'Hold the caravan line',
  deal: { count: 4, tags: ['might', 'peril'] },
  narrativeTemplate:
    'The shift was not dramatic -- no thunder, no blazing light, nothing the ballads would bother recording. The guard behind the second wagon found her footing on the packed earth as if the road itself had steadied under her, and her next strike caught the nearest attacker across the forearm with the clean efficiency of a cut made without hesitation. The second guard pressed forward. The lead driver, who should not have been able to stand, wrapped the reins around the brake lever and reached for the cargo hook behind his seat with his good hand -- not to fight, but to brace himself, to stay upright, to be present in the moment where survival required nothing more than not falling.\n\n{cast:dragan} saw it turn. He had commanded enough fights to know when the geometry of violence stops favoring you -- when the ground, the timing, the invisible weight of the fight tilts away from your side and every swing costs more than it earns. He shouted at the young soldier, a name swallowed by the distance, and the shout had the desperation of authority that knows it is about to be ignored or obeyed for the last time. The young man looked back. The wounded driver was still alive on the bench above him, blood dripping, hand wrapped white around the brake. The moment stretched. Then the young soldier lowered his sword -- not surrender, not exactly, but the body\'s recognition that whatever had been possible thirty seconds ago was no longer possible now.\n\nThe bandits withdrew into the ditch, into the birches, into the country that had made them. {cast:dragan} was the last to go. He looked back once, at the road, the wagons, the waymarker stones, with the expression of a man who had just learned something about the shape of the world that he did not yet have words for.',
  successAfterimage: 'The ambush broke. The defenders held. The road was quiet.',
  failureAfterimage: 'The intervention was too weak. The caravan guards were overwhelmed.',
};

/**
 * Step 1 — Turn the Chaos variant.
 * The god manipulates the stalemate rather than defending the caravan.
 * Iron reach at slightly lower difficulty (0.40) — but the risk is
 * different; exploitation can backfire if the manufactured pause collapses.
 */
const step1TurnTheChaos: ActionStep = {
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
  failBehavior: 'fail_action',
  purposeLine: 'Hold the false pause',
  deal: { count: 4, tags: ['shadow', 'peril'] },
  narrativeTemplate:
    'The pause settled over the road like a held breath. Not silence -- the horses still stamped, the wounded driver still groaned on the bench, the birch leaves still rattled in the wind that came off the ridge -- but a thickening, a weight in the air that pressed against every raised arm and clenched jaw. The two guards behind the second wagon felt it and stopped pressing forward, confused by their own hesitation. The bandits in the ditch felt it and held position, weapons up, unable to explain why they were not advancing. The young soldier near the lead wagon stood with his sword at his side, breathing hard, staring at the wounded driver as if he had forgotten what he had been about to do.\n\nIn that manufactured stillness, the god\'s attention was elsewhere. A crate in the second wagon had cracked during the first volley -- the crossbow bolt that missed the driver had struck the slat boards and split them. The contents had shifted. Sealed letters, a merchant\'s ledger, and a small case of something that weighed more than its size suggested: medicinal preparations, expensive ones, the kind that moved between capital cities and never appeared on a village market table. The god did not take them. The god ensured they were visible, accessible, retrievable -- arranged by coincidence in the dust beside a waymarker stone, as if the road itself had offered them up.\n\n{cast:dragan} stood in the ditch with his maimed hand pressed against the earth and his good hand around his sword, and he felt the weight of the pause like a question he could not articulate. Something was watching. Something had stopped the fight, and it was not mercy and it was not fear. It was attention -- vast, patient, interested. He looked up at the sky, which was ordinary. He looked down at his hands, which were shaking. And somewhere behind the exhaustion and the hunger and the knowledge that this road had nothing left to give him, a door opened that had not been there before.',
  successAfterimage: 'The manufactured pause held. The god extracted value from the wreckage.',
  failureAfterimage: 'The manufactured pause collapsed. The fight resumed worse than before.',
};

/**
 * Step 1: Branch point. The mortal decides on `mercy_ruthlessness` at step 0
 * (THR-2158); the fallback shields the road, the safer default.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  decidedBy: { axis: 'mercy_ruthlessness' },
  variants: {
    positive: step1ShieldTheRoad,
    negative: step1TurnTheChaos,
  },
  fallback: { ...step1ShieldTheRoad },
};

// ─── Aftermath Config ────────────────────────────────────────────

// THR-1208 — the real writes behind the standing chips below. Under THR-1206 a
// chip that says reputation must be backed by a reputation write; these are the
// `reputation_with` deltas (god ↔ named cast member) that back the three chips
// whose fiction genuinely is pairwise standing. Duplicated across both reactions
// of a band because the feeling comes from the rescue itself, not from which
// thread the god keeps afterward. Capped at REPUTATION_WITH_MAX_DELTA_PER_OUTCOME.
const ROAD_AMBUSH_SORAYA_GRATITUDE_DELTA = 0.08;
const ROAD_AMBUSH_SORAYA_WARINESS_DELTA = -0.04;
const ROAD_AMBUSH_DRAGAN_RESENTMENT_DELTA = -0.05;

const SHIELD_ROAD_AFTERMATH = {
  overview:
    'The caravan reformed slowly, the way hurt things reconstitute when the threat passes. {cast:soraya} climbed down from the third wagon and walked to the front of the line, stepping over the felled oak without looking at it, and knelt beside her driver. The bolt was deep but clean -- the bone was intact, the joint still moved, and the bleeding had slowed to a seep that said survival rather than crisis. She pressed a folded cloth against the wound and told him to hold it there and not to be brave about the pain. Then she stood and looked down the road where the bandits had disappeared, and her face held the expression of someone who had been afraid and was now angry and did not yet know which feeling would win.\n\nThe waymarker stones stood in the afternoon light with the patience of objects that have outlasted every ambush, every war, every season of neglect. The road was quiet. A split sack of grain leaked a thin trail of barley into the wheel ruts, and sparrows were already landing to feed. The violence was over. What it had meant -- whether the road was safer now or only empty -- remained an open question that the settlements on either end of this stretch would answer in the coming weeks by whether they sent their wagons or kept them home.',
  changes: [
    {
      id: 'shield_soraya_grateful',
      kind: 'reputation' as const,
      title: '{cast:soraya}',
      detail: 'Alive, grateful — and her regard for whatever held the road is positive and specific. She may become a trade contact along the route.',
      polarity: 'gain' as const,
    },
    {
      id: 'shield_driver_surviving',
      kind: 'shell_state' as const,
      title: 'Lead Driver',
      detail: 'Wounded but surviving. The scar is a story the caravan will tell.',
      polarity: 'mixed' as const,
    },
    {
      id: 'shield_dragan_retreated',
      kind: 'reputation' as const,
      title: '{cast:dragan}',
      detail: 'Retreated, diminished. He knows something intervened, though he cannot name it — and what he holds toward it is wary resentment.',
      polarity: 'mixed' as const,
    },
    {
      id: 'shield_road_safer',
      kind: 'future_hook' as const,
      title: 'Trade Road Safety',
      detail: 'Modest safety reputation improvement. The ambush failed. The road works, at least today.',
      polarity: 'gain' as const,
    },
  ],
  reactions: [
    {
      id: 'shield_reaction_let_road_carry',
      label: 'Let the road carry it forward.',
      intent: 'The god steps back and lets the caravan\'s survival speak for itself. Merchants will hear that the ambush failed. Trade traffic may recover. The god is remembered as a distant protector -- felt but not claimed. The road heals on its own schedule.',
      effects: [
        {
          // Watching a broken ambush from above with prior military_position intel —
          // the agent reads the bandit withdrawal as a column with structure.
          kind: 'intel_referenced_prose' as const,
          category: 'military_position' as const,
          prose: {
            reliable: 'What {name} knew of the patrol came back exact — same shifts, same gaps, the same tired hour when discipline thinned and the column blinked.',
            uncertain: 'Half the patrol pattern {name} carried held; the other half required careful watching — close enough to predict, off enough to require breath held at corners.',
            dubious: 'The military reading {name} had relied on was the reading of a settled garrison — the present force was unsettled, and the dossier had no answer for that.',
          },
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message: 'Merchants along the route hear that the ambush at the waymarker stones failed. Trade traffic may recover.',
          significance: 0.4,
        },
        // THR-1208 — the writes behind the two standing chips of this band.
        {
          kind: 'reputation_with' as const,
          targetAgentId: '$cast:soraya',
          delta: ROAD_AMBUSH_SORAYA_GRATITUDE_DELTA,
        },
        {
          kind: 'reputation_with' as const,
          targetAgentId: '$cast:dragan',
          delta: ROAD_AMBUSH_DRAGAN_RESENTMENT_DELTA,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'shield_reaction_mark_merchant',
      label: 'Mark the merchant for favor.',
      intent: 'The god maintains a thread of connection to {cast:soraya}. Her gratitude deepens into something more structured: she becomes a mortal agent of divine commerce, her routes carrying not just goods but the god\'s awareness along the road.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'debt' as const,
          severity: 0.4,
          label: 'Merchant marked for divine favor — trade intelligence thread',
          revealFamilies: ['liminal.quest', 'trade'],
        },
        // THR-1208 — same standing writes as the other reaction: the gratitude and
        // the resentment come from the rescue itself, not from the god's pick here.
        {
          kind: 'reputation_with' as const,
          targetAgentId: '$cast:soraya',
          delta: ROAD_AMBUSH_SORAYA_GRATITUDE_DELTA,
        },
        {
          kind: 'reputation_with' as const,
          targetAgentId: '$cast:dragan',
          delta: ROAD_AMBUSH_DRAGAN_RESENTMENT_DELTA,
        },
      ],
      closeAfterSelection: true,
    },
  ],
  reactionPrompt: 'The road is quiet. What thread does the god keep?',
} as const;

const TURN_CHAOS_AFTERMATH = {
  overview:
    'The fight did not end so much as evaporate. The bandits withdrew without a signal anyone could name, and the caravan guards lowered their swords with the bewildered caution of people who had been winning a fight that suddenly stopped mattering. {cast:soraya} climbed down from the third wagon and surveyed the damage: the driver wounded, a crate broken open, goods scattered in the dust. She picked up a sealed letter from the road, brushed the dirt from it, and tucked it into her coat with the efficiency of a woman who had been losing things on this road for twenty years and had stopped mourning each one.\n\n{cast:dragan}\'s band was gone. Not scattered the way a broken ambush scatters -- there had been no rout, no panic, just a withdrawal as if they had all remembered somewhere else they needed to be. The waymarker stones stood in their places, indifferent as milestones always are. The thread the god had planted in a broken soldier\'s mind was lighter than spider-silk and stronger than anything on that road.',
  changes: [
    {
      id: 'chaos_soraya_unsettled',
      kind: 'reputation' as const,
      title: '{cast:soraya}',
      detail: 'Alive, unsettled — wary, not grateful. She survived but was not protected, and she knows the difference. She will trade along this road again but trust is not part of the transaction.',
      polarity: 'mixed' as const,
    },
    {
      id: 'chaos_dragan_touched',
      kind: 'shell_state' as const,
      title: '{cast:dragan}',
      detail: 'Withdrawn with a thread of divine attention still on him. Confused, vulnerable, susceptible — a potential divine asset, unformed.',
      polarity: 'mixed' as const,
    },
    {
      id: 'chaos_goods_extracted',
      kind: 'item' as const,
      title: 'Extracted Goods',
      detail: 'Sealed correspondence and medicinal supplies retrieved from the cracked crate — intelligence value and material gain.',
      polarity: 'gain' as const,
    },
    {
      id: 'chaos_road_unchanged',
      kind: 'future_hook' as const,
      title: 'Trade Road Safety',
      detail: 'No reputation change. The ambush ended but not because anyone defended the road. Merchants will not feel safer.',
      polarity: 'info' as const,
    },
  ],
  reactions: [
    {
      id: 'chaos_reaction_let_thread_go',
      label: 'Let the thread go slack.',
      intent: 'The god releases the connection to {cast:dragan}. The bandit captain walks away with nothing but exhaustion and a memory he cannot explain. What he does next is his own.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The thread to {cast:dragan} is released. Whatever door opened in his mind closes quietly behind him.',
          significance: 0.3,
        },
        // THR-1208 — the write behind the standing chip: survived, not protected.
        {
          kind: 'reputation_with' as const,
          targetAgentId: '$cast:soraya',
          delta: ROAD_AMBUSH_SORAYA_WARINESS_DELTA,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'chaos_reaction_keep_line_taut',
      label: 'Keep the line taut.',
      intent: 'The god maintains the thread of attention on {cast:dragan}. Not a summons, not a command, but a persistent divine awareness that will find him again when circumstances align. The bandit captain becomes a watched figure.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'mystical_contract' as const,
          severity: 0.5,
          label: '{cast:dragan} — potential divine asset, thread maintained',
          revealFamilies: ['liminal.quest', 'road', 'iron'],
        },
        // THR-1208 — same standing write as the other reaction: her wariness comes
        // from the ambush, not from what the god does with the bandit captain.
        {
          kind: 'reputation_with' as const,
          targetAgentId: '$cast:soraya',
          delta: ROAD_AMBUSH_SORAYA_WARINESS_DELTA,
        },
      ],
      closeAfterSelection: true,
    },
  ],
  reactionPrompt: 'The road is quiet. What does the god do with what remains?',
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

export const ROAD_AMBUSH_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'liminal.quest.road_ambush',
  stakes: {
    goal: 'get the caravan through the road ambush',
    risk: 'see the caravan guards overwhelmed on the road',
    won: 'broke the ambush with the caravan guards standing',
    lost: 'saw the caravan guards overwhelmed',
    arms: {
      negative: {
        won: 'stalled the fight and took what the wreck offered',
        lost: 'saw the pause collapse and the fight turn worse',
      },
    },
  },
  tags: ['#threshold_errand'],
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'Road Ambush',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheGodPerceivestheViolence, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  narrativeTemplates: {
    initiation:
      'A trade road ambush already in progress: six former soldiers, a wounded driver, a merchant with a hand-axe, ' +
      'and a bandit captain losing control of his youngest fighter. The god arrives into violence, not preamble.',
    success:
      'The god acts on the road — shielding the caravan or harvesting the chaos — ' +
      'and the road and those who travel it are changed by the choice.',
    failure:
      'The intervention collapses. The violence runs its course without divine direction, ' +
      'and the road carries only what the mortals managed on their own.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/road-ambush.jpg',
  illustrationAlt: 'A trade road ambush in late afternoon light: a felled oak across packed earth, three wagons, caravan guards fighting from cover, and crouched figures in faded military tabards in the ditches on either side',

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: SHIELD_ROAD_AFTERMATH,
      negative: TURN_CHAOS_AFTERMATH,
    },
    fallback: { ...SHIELD_ROAD_AFTERMATH },
  },

  description:
    'A trade road ambush already in progress. Six former soldiers, a wounded driver, and a merchant holding her nerve. ' +
    'A god can lean toward shielding the caravan, or toward harvesting the chaos for strategic gain.',
});

export const ROAD_AMBUSH_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(ROAD_AMBUSH_TEMPLATE);
