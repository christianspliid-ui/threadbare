/**
 * The Courtyard Duel — branching encounter using ActionStepBranch
 * and BranchAwareAftermathConfig primitives.
 *
 * A duel is already underway in a courtyard — blades drawn, audience
 * assembled, honor and reputation balanced on the outcome. One duelist
 * fights with skill and precision; the other fights with everything else.
 * The god decides whether to tip the contest toward Iron mastery or
 * manipulate the terms so the right outcome is guaranteed by other means.
 *
 * Seeds: Duelist's Luck Token on honor-intact survival.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
  EncounterSupportLocationSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const vaeraSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'vaera',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['soldier', 'guard', 'champion'],
  supportRole: 'challenged_duelist',
  spawnNpcRole: 'soldier',
  spawnName: 'Vaera Olt',
};

const challSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'challenger',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['mercenary', 'soldier', 'duelist'],
  supportRole: 'challenger',
  spawnNpcRole: 'mercenary',
  spawnName: 'Breck Thornise',
};

const witnessSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'witness_official',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'scene-only',
  reuseNpcRoles: ['official', 'magistrate', 'elder'],
  supportRole: 'duel_arbiter',
  spawnNpcRole: 'official',
  spawnName: 'Arbiter',
};

const courtyardSpec: EncounterSupportLocationSpec = {
  kind: 'location',
  key: 'courtyard',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  sublocationTypeId: 'sublocation-type.courtyard',
  fallbackName: 'The Courtyard',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  vaeraSpec,
  challSpec,
  witnessSpec,
  courtyardSpec,
];

// ─── Step Definitions ────────────────────────────────────────────

/**
 * Step 0: The God Reads the Bout.
 * The duel is already in motion — two figures circling in the dust,
 * an audience arranged along the courtyard walls. Difficulty 0:
 * the god perceives the situation and chooses how to weigh in.
 */
const step0TheGodReadsTheBout: ActionStep = {
  reach: 'eye',
  duration: { min: 1, max: 2 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The courtyard had been swept clean that morning — someone had done it deliberately, the god could tell, because the flagstones were not merely clear of debris but scoured of the windblown grit that usually collected against the east wall by midday. Whoever had prepared this space had wanted the footing honest. The two figures at the center of it were already past their opening passes: Vaera Olt had drawn a thin line of blood across the challenger\'s forearm in the exchange, and Breck Thornise had answered by pressing hard enough to force her back three steps toward the water trough. The audience lined the walls the way audiences line walls when they have been told not to cross a boundary and are choosing to honor it — barely. Merchants in good coats, two off-duty militia officers whose hands kept drifting toward their sword hilts as reflex, a woman in the livery of the garrison who was writing in a ledger without looking down.\n\nThe arbiter stood at the north gate with a white sash folded over one arm, the traditional token of a stopped bout. He had not raised it. His expression said he was watching something that had gone slightly beyond the parameters of the arrangement that had been described to him when he agreed to officiate, and he was deciding whether the divergence was technical or catastrophic. It was not yet catastrophic.\n\nVaera Olt fought with her weight forward, which was aggressive for someone in her situation — she was the challenged party, the one who had been named to answer a specific accusation in the formal language of the Code, and challengers who fight aggressive in the early passes are usually either very good or afraid. She was very good. The god could see it in the economy of her movements: nothing wasted, every step placing the blade where it needed to be, the particular quality of attention that looks like calm but is actually speed disguised as patience. Her problem was not her skill. Her problem was that Breck Thornise was bigger than her by a stone and a half, and in the third pass he had found the truth of that difference: every time he drove the bind, she had to give ground or break the line.\n\nBreck was not elegant. He was effective, which is a different and sometimes more dangerous thing. He had trained with someone who had taught him to use his weight as a weapon before the blade, and in the fourth exchange he had done something with his footwork that the god recognized as a deliberate setup for the conclusion he intended — not the killing blow, but the disarming one, the one that ends a duel with honor technically intact and one party on the ground. The Code allowed it. The audience would accept it. Vaera Olt would not recover from the standing in the way that mattered: the accusation that had brought them here would stand unrefuted, and the truth of it would be decided by who got up last.\n\nThe god\'s attention settled on the courtyard like a hand on a scale.',
  successAfterimage: 'The god read the bout and the weight of the choice it required.',
  failureAfterimage: 'The god perceived the duel but could not hold the threads long enough to act with clarity.',
};

/**
 * Step 1 — Tip Toward Skill variant.
 * The god pours Iron-reach precision into Vaera's technique, finding
 * the angles Breck's weight advantage cannot follow.
 * Iron reach at moderate difficulty (0.50) — working with a skilled duelist's
 * existing form, not replacing it.
 */
const step1TipTowardSkill: ActionStep = {
  reach: 'iron',
  duration: { min: 3, max: 4 },
  difficulty: 0.50,
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.12 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.08 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The shift arrived not as force but as precision — something in the angle of the afternoon light, or in the way sound moved differently through air that had been touched by divine attention, or perhaps in nothing visible at all. Vaera Olt felt it as a sharpening: the next exchange came toward her and she was already moving to where it would be, her blade finding the deflection before her eyes had time to track the thrust. The bind that Breck had been setting up — the one the god had watched him prepare through four careful passes — arrived to find the geometry wrong, his weight committed forward onto a line that was no longer there.\n\nHe recovered. He was good enough to recover, and the god had not touched his footwork, had not muddied his proprioception or injected doubt into his muscles. This was not sabotage. This was the difference between a fighter who is skilled and a fighter who is in a moment of perfect skill, and the god had leaned Vaera Olt into the latter while doing nothing about Breck Thornise at all. The distinction mattered. He knew he had not been interfered with. He simply found himself, in the space of the next thirty seconds, unable to close the gap between what he was trying to do and what his body was managing.\n\nThe disarming blow, when it came, was Vaera\'s. Clean, angular, and accompanied by a footwork sequence that the militia officers along the wall would discuss with each other afterward — quietly, and with the particular deference of professionals who had just watched something technically excellent happen. Breck Thornise\'s blade rang against the flagstones. He stepped back. The arbiter\'s white sash stayed folded over his arm because there was nothing to stop — the bout had ended properly, within the Code, with one party standing and one party having made the concession that ends the formal language of a duel. The woman in garrison livery was still writing in her ledger. Now she had something different to write.\n\nVaera Olt stood in the center of the swept courtyard with her blade at rest and her breathing controlled and her expression unreadable. The audience along the walls had a quality of stunned attention that meant the outcome was not what they had expected, and the god could feel the moment they began to adjust their understanding of what they had witnessed — not from certainty of what it meant to certainty of what it would be used to mean, which is a different thing and often more important.',
  successAfterimage: 'Vaera\'s technique sharpened past what weight could answer. The duel ended on honest terms.',
  failureAfterimage: 'The intervention could not close the gap. Breck\'s mass and reach overwhelmed even perfect form.',
};

/**
 * Step 1 — Manipulate the Terms variant.
 * The god works on the arbiter and the Code — not the fight itself,
 * but the framing of what constitutes a valid conclusion.
 * Gold/Heart reach at difficulty (0.45) — softer thread, but fragile.
 */
const step1ManipulateTheTerms: ActionStep = {
  reach: 'gold',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  onSuccess: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: 0.06 },
    },
  ],
  onFailure: [
    {
      op: 'update_node',
      nodeId: '$target',
      changes: { reputationDelta: -0.12 },
    },
  ],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The god did not touch the fight. The fight was already lost on its current terms — Breck Thornise was going to execute his closing move in the next exchange, and nothing short of direct intervention in the bodies of the people involved would change the physical outcome. The god worked instead on the frame around the fight: the Code, the arbiter, the ledger, the meaning.\n\nThe woman in garrison livery looked up from her writing. The arbiter shifted his weight in a way that changed how the white sash sat against his arm. A merchant near the south wall said something to his companion that made his companion turn to look at the bout from a different angle, and when he turned back his face held a new consideration. None of this was dramatic. All of it was real. The god was redistributing attention — drawing the audience toward a different reading of what they were witnessing, one in which the technical terms of the Code mattered less than the question the Code was originally designed to answer: which of these two people should be trusted.\n\nBreck Thornise executed his closing move. He did it cleanly and correctly. Vaera Olt went down hard against the water trough with a blow to the sword arm that would have ended any honest bout. The arbiter raised his sash. And then he held it there — not dropped, as the Code required for a formal stop, but held, chest height, while he turned to look at the garrison representative.\n\nThe argument that followed took eleven minutes. It was conducted in the formal language of the Code, which meant that its substance was about precedent and interpretation rather than about what had actually happened, and in that language the outcome was not determined by who had disarmed whom but by what the arbiter formally recorded as the character of the exchange. The god\'s thread ran through the eleven minutes like wiring behind a wall: invisible, weight-bearing, essential. When the arbiter finally set the sash down and spoke his finding, Breck Thornise did not recognize the language of the outcome that was being used to describe his victory. He had won the bout on its physical terms. What he had not won — what the framing had made available for the arbiter\'s finding to contest — was the accusation. Vaera Olt left the courtyard under no formal judgment. She had not won. But she had not lost what she had come there to protect.',
  successAfterimage: 'The terms shifted around the fight. Vaera left the courtyard under no formal judgment.',
  failureAfterimage: 'The arbiter held firm to the physical record. Breck\'s disarm stood as a clean win on every count.',
};

/**
 * Step 1: Branch point. Resolves based on the choice made at Step 0.
 */
const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    tip_toward_skill: step1TipTowardSkill,
    manipulate_the_terms: step1ManipulateTheTerms,
  },
  fallback: { ...step1TipTowardSkill },
};

// ─── Aftermath Config ────────────────────────────────────────────

const TIP_SKILL_AFTERMATH = {
  overview:
    'The duel\'s outcome settled into the courtyard the way outcomes settle when they are unambiguous and witnessed by enough people to resist revision. Breck Thornise collected his blade from the flagstones without speaking and walked to the north gate and left through it, and the crowd parted for him with the particular courtesy extended to people who have just been publicly humiliated by someone they assumed they would defeat. The arbiter recorded the finding in formal language. The woman from the garrison copied the finding into her ledger. The accusation that had brought Vaera Olt to this courtyard was formally unproven — not dismissed, because the Code does not allow for dismissal, only for findings — and the standing that had stood behind the accusation would take time to repair, but repair was possible now where it had not been an hour ago.\n\nVaera Olt sat on the edge of the water trough with her sword across her knees and her sleeves rolled to the elbow, looking at the flagstones. She had won. The win had the quality of wins that come from being given something — not because she did not deserve it, not because her form had not been extraordinary in the final exchange, but because she knew the sharpening she had felt in those last passes had not come entirely from inside her. Something had steadied her hand at the moment the closing move arrived. She did not know what it was. She was not sure she wanted to know. But she was sitting on the water trough in the swept courtyard with the bout decided in her favor, and somewhere in her coat pocket was the brass token that had been passed to her by the arbiter\'s assistant after the finding — a nicked, well-worn thing that the Code required be transferred to the victor of any formally contested duel, carried by the arbiter\'s office as a symbol of favorable outcome. She pressed her thumb against the nick in its edge and felt, obscurely, that the weight of the thing was not entirely accounted for by its size.',
  changes: [
    {
      id: 'skill_vaera_standing',
      kind: 'reputation' as const,
      title: 'Vaera Olt',
      detail: 'The accusation is formally unproven. Her standing survives, shaken but intact. The token is in her possession.',
      polarity: 'gain' as const,
    },
    {
      id: 'skill_breck_diminished',
      kind: 'reputation' as const,
      title: 'Breck Thornise',
      detail: 'Lost a bout he was favored to win, publicly. His standing behind the accusation is compromised.',
      polarity: 'mixed' as const,
    },
    {
      id: 'skill_token_awarded',
      kind: 'item' as const,
      title: "Duelist's Luck Token",
      detail: 'The victory token transferred by the arbiter\'s office as Code requires. It carries the weight of the divine attention that sharpened Vaera\'s last exchange.',
      polarity: 'gain' as const,
    },
    {
      id: 'skill_courtyard_witness',
      kind: 'future_hook' as const,
      title: 'The Witnessed Outcome',
      detail: 'Enough people watched. The bout will be discussed. What it meant — whether skill or something else decided it — is now a question in circulation.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The courtyard is clearing. Vaera Olt is still sitting on the water trough. What does the god keep of this?',
  reactions: [
    {
      id: 'skill_react_let_win_stand',
      label: 'Let the win stand on its own.',
      intent: 'The god withdraws its attention from the courtyard completely. The outcome belongs to Vaera\'s form, to the swept flagstones, to the formal language of the Code. Whatever thread connected the god\'s attention to that final exchange goes slack. The win is hers alone, now and in the record.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The courtyard duel resolved in Vaera Olt\'s favor. The god\'s attention withdraws cleanly from the outcome.',
          significance: 0.4,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'skill_react_keep_thread',
      label: 'Keep a thread to Vaera.',
      intent: 'The god holds a light connection to Vaera Olt — not a command, not a claim, but a continued awareness. She carries the token. The token carries the mark of the divine attention that shaped her final pass. That thread is worth maintaining; a duelist who has felt what it is to move with divine sharpening may seek that feeling again.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'debt' as const,
          severity: 0.4,
          label: 'Vaera Olt — divine thread maintained after courtyard duel. The token is the mark.',
          revealFamilies: ['liminal.quest', 'duel', 'iron'],
        },
      ],
      closeAfterSelection: true,
    },
  ],
} as const;

const MANIPULATE_TERMS_AFTERMATH = {
  overview:
    'The eleven-minute argument at the gate became the story. Not the fight — the fight had been straightforward in its physical facts, even if those facts had been insufficient to decide the thing — but the argument, which had been opaque and technical and had concluded in a finding that everyone could see but no one could cleanly attack. The merchants went back to their booths. The militia officers stopped reaching for their sword hilts. The woman from the garrison sealed her ledger and walked away under the north gate without making eye contact with anyone.\n\nBreck Thornise had won the bout. The finding said he had not won the accusation. These were two different verdicts recorded in the same formal language, and the language was precise enough that they could coexist without contradiction, but only if you had been trained in the Code since childhood and could follow the terminology. Most of the audience could not. What they took away was: Vaera Olt walked out of that courtyard free of judgment. Whatever Breck had been trying to prove, the arbiter had found a way to not-find-it. That is not the same as innocence, but in a context where reputation is built from accumulated impressions rather than formal records, not-guilty is often indistinguishable from innocent if enough time passes and no one with standing pursues it.\n\nVaera Olt was not grateful. She was too experienced to confuse a narrow escape with a vindication, and whatever had shifted the argument in those eleven minutes did not feel like luck to her in the same way that luck usually felt. It felt like a hand. She could not describe the hand. She walked out of the courtyard with her accusation formally unaddressed and her standing technically intact and the particular wariness of someone who has just been saved by something that did not ask permission.',
  changes: [
    {
      id: 'terms_vaera_escaped',
      kind: 'reputation' as const,
      title: 'Vaera Olt',
      detail: 'Standing intact through technical finding. Not vindicated — escaped. She knows something intervened.',
      polarity: 'mixed' as const,
    },
    {
      id: 'terms_breck_contested',
      kind: 'reputation' as const,
      title: 'Breck Thornise',
      detail: 'Physically won but formally inconclusive. His accusation is unresolved, which may be worse than losing.',
      polarity: 'mixed' as const,
    },
    {
      id: 'terms_arbiter_mark',
      kind: 'future_hook' as const,
      title: 'The Arbiter\'s Finding',
      detail: 'The eleven-minute argument is now on the formal record. Anyone who reads it carefully will see the seam where the framing shifted.',
      polarity: 'info' as const,
    },
    {
      id: 'terms_accusation_dormant',
      kind: 'future_hook' as const,
      title: 'The Dormant Accusation',
      detail: 'Formally unaddressed. Someone may pursue it again under different circumstances.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt: 'The courtyard is empty. The accusation is sleeping, not dead. What does the god do with what was bought here?',
  reactions: [
    {
      id: 'terms_react_let_sleep',
      label: 'Let the accusation sleep.',
      intent: 'The god releases its attention from the finding and from Vaera Olt. The technical framing that saved her is now part of the formal record. Whether anyone pursues the accusation again is not the god\'s business. What was spent was worth what was bought.',
      effects: [
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god withdraws from the courtyard outcome. The dormant accusation remains on the record — unresolved, sleeping.',
          significance: 0.3,
        },
      ],
      closeAfterSelection: true,
    },
    {
      id: 'terms_react_bury_accusation',
      label: 'Work to bury the accusation properly.',
      intent: 'The finding bought time, not resolution. The accusation lives in the record and in Breck Thornise\'s standing, and it will resurface unless something actively closes it. The god plants a thread in the situation — not intervention, but readiness: when the next opportunity to decisively address the accusation arises, it will be legible to those paying attention.',
      effects: [
        {
          kind: 'hidden_mark' as const,
          category: 'mystical_contract' as const,
          severity: 0.5,
          label: 'Dormant accusation against Vaera Olt — god has invested in burial. Thread maintained.',
          revealFamilies: ['liminal.quest', 'social', 'gold'],
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'liminal.quest',
          delayTicks: 30,
          priority: 1.0,
          seedLabel: 'The dormant accusation resurfaces — Breck Thornise seeks second satisfaction',
        },
      ],
      closeAfterSelection: true,
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const COURTYARD_DUEL_TEMPLATE: UnifiedActionTemplate = {
  id: 'enc.courtyard_duel',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  name: 'The Courtyard Duel',
  reach: 'iron',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheGodReadsTheBout, step1Branch],

  apCost: 1,
  essenceCost: 2,

  actorAffinities: ['individual'],
  locationSubtypes: ['town', 'castle', 'keep', 'fortress'],
  motivations: ['courage_prudence', 'justice_mercy'],

  narrativeTemplates: {
    initiation:
      'A formal duel is already underway in a swept courtyard — blades drawn, arbiter present, ' +
      'an accusation on the line. One fighter is better. The other is bigger. The god arrives ' +
      'as the bout moves toward its conclusion.',
    success:
      'The god acts on the duel — tipping precision or shifting the terms — and the outcome ' +
      'lands differently than it would have. Vaera Olt leaves the courtyard carrying something ' +
      'the Code says belongs to the victor.',
    failure:
      'The intervention fails to move the fight where it needed to go. The physical facts ' +
      'of the bout stand uncontested, and the accusation behind the duel stands with them.',
  },

  supportBundle: SUPPORT_BUNDLE,

  illustrationUrl: '/concept-art/encounters/courtyard-duel.jpg',
  illustrationAlt: 'Two figures circling in a swept stone courtyard at midday — blades drawn, weight differential visible in their stances, an arbiter with a folded white sash at the gate, and an audience arranged along the walls',

  authoredChoices: {
    0: [
      {
        id: 'tip_toward_skill',
        label: 'Tip Toward Skill',
        intent:
          'The god\'s attention settles into Vaera Olt\'s form and finds the angles that Breck Thornise\'s weight cannot follow. This is not making her something she is not — she is already skilled, already precise, already working with form that earned her the bout on technical terms. The god sharpens what is already there: the read on his closing setup arrives a fraction of a second earlier, the deflection lands at the geometry that redirects rather than blocks, the footwork in the final exchange puts the disarm on a line that his recovery cannot reach. The intervention is nearly invisible because it works entirely within Vaera\'s existing capability. That is also what makes it honest, by whatever standard the god uses for honesty.',
        targetLabel: 'Vaera Olt',
        essenceCost: 2,
        likelyBurden:
          'Breck Thornise is large and trained and not without skill of his own. If the sharpening is not enough to close the gap between his mass advantage and her technique, the intervention is wasted at the moment the bout needed it most.',
        interventionType: 'supportive',
      },
      {
        id: 'manipulate_the_terms',
        label: 'Manipulate the Terms',
        intent:
          'The fight cannot be won on its physical facts. The god accepts this and works instead on the frame: the Code\'s formal language, the arbiter\'s reading of precedent, the weight that the garrison representative\'s ledger carries in the official record. Gold-reach attention flows outward along the threads of institutional authority that surround the courtyard — not into the principals, but into the people who will determine what the fight is recorded as meaning. The bout itself plays out as physics requires. The eleven minutes afterward are where the god\'s work happens.',
        targetLabel: 'the arbiter',
        essenceCost: 2,
        likelyBurden:
          'A finding that cannot be attacked on its technical merits is still a finding that can be felt as wrong by everyone who witnessed the physical bout. If Breck Thornise or the forces behind the accusation pursue the matter with enough standing, the eleven-minute argument is a door, not a wall.',
        interventionType: 'coercive',
      },
    ],
    1: [
      {
        id: 'hold_the_line_precise',
        label: 'Hold the Line Precise',
        intent:
          'The god works with economical force — not flooding Vaera with capability she does not have, but removing the margins of error that would have cost her the next exchange. The footwork reads true. The blade does not hesitate at the bind. The god\'s investment is in precision at the critical moment, not in transformation. What comes out of the exchange will be recognizable as Vaera\'s own work, which matters for what the bout means afterward.',
        essenceCost: 1,
        likelyBurden:
          'Precision at a single critical moment is a narrow investment. If Breck reads the deflection and adapts before the closing opportunity arrives, the god\'s window has passed.',
        interventionType: 'supportive',
      },
      {
        id: 'press_all_the_way',
        label: 'Press All the Way',
        intent:
          'The god stops holding back. Full Iron-reach attention flows into the bout\'s geometry, finding every angle that favors Vaera\'s form and leaving Breck Thornise with the particular experience of fighting someone who is, in this moment, not quite reachable. The outcome becomes nearly certain. The god\'s presence in the final exchange will be felt by those with the sensitivity to read it: the militia officers, the arbiter, Breck himself. The bout ends as intended. What it costs to have it end this way is a question for afterward.',
        essenceCost: 3,
        likelyBurden:
          'Full investment leaves a mark. Breck Thornise will know something was in the courtyard that was not supposed to be. Whether he says so is his choice, but the knowledge will not leave him.',
        interventionType: 'coercive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      tip_toward_skill: TIP_SKILL_AFTERMATH,
      manipulate_the_terms: MANIPULATE_TERMS_AFTERMATH,
    },
    fallback: { ...TIP_SKILL_AFTERMATH },
  },

  description:
    'A formal duel in progress: one skilled fighter, one heavier challenger, and an accusation that will stand or fall with the bout. ' +
    'The god chooses between tipping the fight toward technical mastery or manipulating the Code\'s formal framing to decide the outcome by other means.',
};
