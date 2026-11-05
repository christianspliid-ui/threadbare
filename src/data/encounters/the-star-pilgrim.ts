/**
 * The Star Pilgrim — reputation-gated encounter, Star reach, required-positive + blocked-by-negative.
 *
 * Gate: requiredTargetTraits: ['trait.reputation.star.positive']
 *       AND blocked when target has 'trait.reputation.star.negative'.
 * Pattern: required + blocked — the encounter requires genuine star-touched standing;
 *          those with tainted divine reputation cannot access it.
 *
 * THR-146: Middle tranche of reputation-gated content.
 *
 * ─── The mortal decides (THR-2160, THR-866 pattern) ──────────────────
 *
 * The god no longer clicks an ending. Step 0 was two cards whose ids were the
 * aftermath keys, so the click picked the ending. Now the fork decides on
 * `sacrifice_survival`: a Martyr (+1) pours out the full star-channel for the
 * child, a Survivor (−1) keeps their reserve, blesses, and points the father to
 * the sister shrine. The god argues with a composed hand — two pole-leaning
 * specials plus a Repertoire fill — and the mortal answers.
 *
 * - Fork axis: `sacrifice_survival`. `positive` = Channel the Radiance,
 *   `negative` = Bless and Send Onward. Variants, aftermath and `stakes.arms` are
 *   keyed to the pole (`branchDecision.ts` → `recordDecidedChoice`). The
 *   fallback stays the blessing (`negative`), as before: the radiance aftermath
 *   seeds `star.wider_pilgrimage`, which has no candidates yet, and a fallback
 *   copy would add a dead seed site (`encounterSeedLiveness.test.ts` ceiling).
 * - The two retired cards carried THR-528 per-choice moral marks (Star virtue);
 *   they leave with the cards, as in THR-2159.
 * - `aftermathConfig.branchOnStep` stays 0, the deciding step (THR-979).
 * - The step-1 prose is re-voiced so the mortal does it, not the god.
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

const fatherSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'father',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['civilian', 'traveler', 'pilgrim'],
  supportRole: 'pilgrim_father',
  spawnNpcRole: 'civilian',
  spawnName: 'the Father',
};

const childSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'child',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'scene-only',
  reuseNpcRoles: ['civilian'],
  supportRole: 'pilgrim_child',
  spawnNpcRole: 'civilian',
  spawnName: 'the Child',
};

const shrineSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'shrine',
  delivery: 'pre-seeded',
  persistence: 'must-persist',
  sublocationTypeId: 'shrine',
  fallbackName: 'The Roadside Shrine',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [fatherSpec, childSpec, shrineSpec];

// ─── Steps ───────────────────────────────────────────────────────

const step0TheChild: ActionStep = {
  reach: 'star',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The father had walked seven days with the child on his shoulders, which was visible ' +
    'in the set of his neck and the way he moved — not tired exactly, but past the point ' +
    'where tired was the word that applied. The child\'s breathing was shallow in the ' +
    'way that means the body is working at something the rest of the system ' +
    'is not being told about.\n\n' +
    'The father did not speak first. He stopped when the agent appeared and stood in the ' +
    'road and waited. Then he unwrapped the blanket from around the child\'s shoulders — ' +
    'slowly, the way people move when they are doing something they have been rehearsing ' +
    'for a long time and are now doing for the last time. He did not say {title}. ' +
    'He did not say anything. The unwrapping was the speech.',
  successAfterimage: 'The blanket folded back. The child\'s shallow breath. The father waiting.',
  failureAfterimage: 'The unwrapping, and then a silence that arrived at the wrong angle.',
  successAtCostAfterimage: 'The child lay bare to the road, and the father\'s knees had begun to give.',
  criticalSuccessAfterimage: 'The child\'s sickness, and what each mending would cost, stood clear at once.',
  criticalFailureAfterimage: 'The road blurred into dust and the child\'s breathing, and the agent chose half-blind.',
  purposeLine: 'Meet the child',
  // THR-2160 — the fork's argument. Two specials, one per pole of
  // `sacrifice_survival`; the Repertoire fills the rest of the hand.
  nudges: [
    {
      id: 'pilgrim.count_the_seven_days',
      name: 'Count The Seven Days',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'sacrifice_survival', toward: 'positive' },
      effectLine: 'Show them the seven days in the father\'s neck. A walk this long argues for the full channel.',
      bandProse: {
        success: '{actor} saw the seven days on the father, and opened wide.',
        failure: '{actor} saw the father\'s weariness, and held back still.',
      },
    },
    {
      id: 'pilgrim.point_to_the_shrine',
      name: 'Point To The Shrine',
      essenceCost: 1,
      forecastDelta: 0.06,
      poleLean: { axis: 'sacrifice_survival', toward: 'negative' },
      effectLine: 'Remind them the sister shrine is three hours away. A near keeper argues for a blessing.',
      bandProse: {
        success: '{actor} remembered the shrine road, and kept their strength.',
        failure: '{actor} thought of the shrine, and it seemed too far.',
      },
    },
  ],
  deal: { count: 3, tags: ['presence', 'lore'] },
};

const step1ChannelRadiance: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 4 },
  difficulty: 0.40,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.08 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The agent opened the full channel — the one that star-touch runs through when it ' +
    'runs, and that costs the one who opens it — and set it moving toward the child. Not ' +
    'curative exactly. Not a repair of something broken. More like a realignment of the ' +
    'terms the child\'s body was operating under.\n\n' +
    'The father felt it before the child did. His hands tightened on the child\'s legs ' +
    'and then released, the way hands release when they recognize that what they are ' +
    'holding has changed. The child\'s breathing shifted — not dramatically, not suddenly, ' +
    'but in the way that a room shifts when someone opens a window: the air is the same ' +
    'air, but it is moving now. The child opened their eyes. They looked at the agent. ' +
    'They did not say anything. They looked at their father. The father said: {title}. ' +
    'It was the first word he had said since stopping.',
  successMetadata: { reputationDelta: 0.08 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The child\'s breathing shifted. The father\'s hands released. The first word said.',
  failureAfterimage: 'The reach moved, but what it arrived at was not quite the shape the child\'s body needed — partial, unresolved.',
};

const step1BlessAndSend: ActionStep = {
  reach: 'star',
  duration: { min: 2, max: 3 },
  difficulty: 0.25,
  onSuccess: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.05 } },
  ],
  onFailure: [
    { op: 'update_node', nodeId: '$target', changes: { reputationDelta: 0.00 } },
  ],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The agent did not open the full channel. What they gave instead was a direction and a ' +
    'blessing of the kind that does not guarantee outcomes but changes the quality of the ' +
    'road toward them. The agent laid hands on the child\'s forehead for a moment — the ' +
    'old form, which the father recognized from something his own grandmother had done, ' +
    'which was not coincidence — and then pointed northeast, toward the sister shrine ' +
    'the {title} knew was three hours\' travel on a flat road.\n\n' +
    'The father listened. He wrapped the child back in the blanket. He turned northeast. ' +
    'He had not said thank you yet, which some people read as ingratitude and the agent ' +
    'read correctly as a man who had run out of the kind of emotional surplus that thanks ' +
    'requires and was saving everything remaining for the walk.',
  successMetadata: { reputationDelta: 0.05 },
  failureMetadata: { reputationDelta: 0.00 },
  successAfterimage: 'The father turned northeast. The walk had a direction now.',
  failureAfterimage: 'The direction was given, but something in the blessing did not land with full weight.',
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  // THR-2160 — the mortal decides. The fallback stays the blessing, as before the
  // conversion: the radiance aftermath seeds `star.wider_pilgrimage`, a family with no
  // candidates yet, and a fallback copy of it counts as a new dead seed site.
  decidedBy: { axis: 'sacrifice_survival' },
  variants: {
    positive: step1ChannelRadiance,
    negative: step1BlessAndSend,
  },
  fallback: { ...step1BlessAndSend },
};

// ─── Aftermath ───────────────────────────────────────────────────

const RADIANCE_AFTERMATH = {
  overview:
    'The father carried the child the rest of the way to the nearest settlement — ' +
    'not because the child could not walk, but because the child was asleep, which was ' +
    'the first time they had slept without waking in eleven days. The village healer ' +
    'examined the child and said: I don\'t know what changed, but something did. ' +
    'The father said nothing. The healer was not asking for an answer. In the next ' +
    'settlement, and then the next, people began saying that a child who had been ' +
    'dying was not dying anymore, and they began saying the word {title} in the same ' +
    'breath, and the word traveled faster than the father did.',
  changes: [
    {
      id: 'radiance_miracle_witnessed',
      kind: 'reputation' as const,
      title: 'The Miracle',
      detail: 'A child who had been dying was not dying anymore. The word for what changed was the {title}\'s name.',
      polarity: 'gain' as const,
    },
    {
      id: 'radiance_pilgrimage_starting',
      kind: 'future_hook' as const,
      title: 'The Next Valley',
      detail: 'The story is moving faster than the father. The next valley is already expecting something.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'A miracle was witnessed. The story is moving. Choose what you do with what it is becoming.',
  reactions: [
    {
      id: 'radiance_react_let_spread',
      label: 'Let the story carry what it carries.',
      intent: 'The miracle is what happened. What the next valley makes of it is their question, not the god\'s.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        {
          kind: 'hidden_mark' as const,
          category: 'secret_knowledge' as const,
          severity: 0.5,
          label: 'the pilgrim child who lived — miracle witnessed by the father and the village healer',
          revealFamilies: ['star.miracle', 'pilgrim', 'divine'],
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} reached through the star-channel and a child\'s breathing changed. The story is moving through the valley.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'star.wider_pilgrimage',
          delayTicks: 40,
          priority: 0.85,
          seedLabel: 'Word of the healing reaches the next valley',
        },
      ],
    },
    {
      id: 'radiance_react_quiet',
      label: 'Try to quiet the story.',
      intent: 'Not every miracle should become a pilgrimage route. Press for quieter witness.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} reached through the star-channel. The father was asked not to describe what he saw. He agreed. He does not know if he can keep that agreement.',
          significance: 0.6,
        },
      ],
    },
  ],
} as const;

const BLESS_AFTERMATH = {
  overview:
    'The father reached the sister shrine before evening. The keeper there — an old woman ' +
    'who had been tending that shrine for thirty years and had seen people arrive in many ' +
    'conditions — took one look at the child and said: sit, and began a different kind of ' +
    'care than the father had been able to provide alone. The child responded to it. ' +
    'Three days later the child was eating. Three days after that they were walking. ' +
    'The father sent a letter to no one in particular — addressed it to the shrine on the ' +
    'northeast road, to whoever had said: go there — saying that the child was walking ' +
    'and that he did not know how to name what had happened but was naming it anyway: ' +
    '{title}\'s mercy, which was as close as he could get.',
  changes: [
    {
      id: 'bless_referred_healing',
      kind: 'reputation' as const,
      title: 'The Shrine Keeper',
      detail: 'The direction was good. The keeper had what the father needed. The child walked.',
      polarity: 'gain' as const,
    },
    {
      id: 'bless_letter_sent',
      kind: 'future_hook' as const,
      title: 'The Letter to No One',
      detail: 'A letter was sent to the shrine. The father named what happened.',
      polarity: 'gain' as const,
    },
  ],
  reactionPrompt: 'The child is walking. The letter arrived at the shrine. Choose what the direction\'s outcome means.',
  reactions: [
    {
      id: 'bless_react_acknowledge',
      label: 'Acknowledge the letter.',
      intent: 'The father named it. Let the god confirm what he named was real.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        { kind: 'reputation_tally' as const, key: 'heart.positive', delta: 1 },
        {
          kind: 'encounter_seed' as const,
          query: { kind: 'encounter_template', tags: ['#temple_errand'] },
          delayTicks: 25,
          priority: 0.7,
          seedLabel: 'The father\'s journey continues with a different quality',
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} sent the father northeast. The child walked. The father named it mercy.',
          significance: 0.55,
        },
      ],
    },
    {
      id: 'bless_react_leave',
      label: 'Leave the letter unanswered.',
      intent: 'The blessing was real but does not need acknowledgment to have been what it was.',
      effects: [
        { kind: 'reputation_tally' as const, key: 'star.positive', delta: 1 },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The {title} sent a father and child northeast. The child walked. The letter at the shrine waits.',
          significance: 0.45,
        },
      ],
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

export const THE_STAR_PILGRIM_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'reputation.star.the_star_pilgrim',
  stakes: {
    goal: 'ease the sick child\'s breathing with a touch',
    risk: 'send the father off with the child still sick',
    won: 'eased the child\'s breathing and heard them speak',
    lost: 'reached the child but did not mend what was wrong',
    arms: {
      negative: {
        won: 'blessed the child and sent the father to the shrine',
        lost: 'sent the father onward with a weak blessing',
      },
    },
  },
  rarityTier: 1,
  intrinsicTier: 'shaping',
  name: 'The Star Pilgrim',
  reach: 'star',
  crudType: 'read',
  scale: 'local',

  steps: [step0TheChild, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  // THR-1515: `settlement` was a subtype no location carries; read as the author's "any
  // settlement" and spelled as town / city / capital, which is what the world writes.
  locationSubtypes: ['hamlet', 'road', 'wilderness', 'town', 'city', 'capital'],
  motivations: ['mercy_ruthlessness', 'loyalty_ambition'],

  targetCategories: ['actor'],

  requiredTargetTraits: ['trait.reputation.star.positive'],

  narrativeTemplates: {
    initiation:
      'A sick child carried on a father\'s shoulders reaches {title} — the parents walked ' +
      'seven days believing the star-touch of the target can cure what village healers could not.',
    success:
      'Something that was closed opened — through the star-channel directly, or through ' +
      'a direction that led to someone who could help. The child is breathing differently now.',
    failure:
      'The reach moved but did not arrive fully. The father left with a direction and something ' +
      'less certain than a miracle.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/the-star-pilgrim.webp',
  illustrationAlt: 'Wide shot: father holding cloth-wrapped child, shrine lintel behind them, dawn light, Threadbare palette.',

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      positive: RADIANCE_AFTERMATH,
      negative: BLESS_AFTERMATH,
    },
    fallback: { ...BLESS_AFTERMATH },
  },
});

export const THE_STAR_PILGRIM_TEMPLATE_CONTRACT: EncounterContract = buildLiteEncounterContract(THE_STAR_PILGRIM_TEMPLATE);
