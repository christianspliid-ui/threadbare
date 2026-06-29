/**
 * The Verdict That Burns — regional-scale branching encounter (THR-466).
 *
 * A threaded magistrate presides over a regional reckoning: the war-lord who
 * held the whole region together through the bad years stands accused of the
 * massacre at the fords, and the evidence is clean — witnesses, the burial pit,
 * the order in the lord's own hand. There is no doubt of guilt. There is only
 * the certainty that a true verdict pulls the keystone: the lord's militia is
 * the region's only army, the lord's kin are half its towns, and "guilty" means
 * the region comes apart in fire. The god can steel the magistrate to say the
 * true word and let the region burn for justice; or stay its hand and let the
 * magistrate do what a decent judge does when the whole region is at their back
 * — name the crime into the record, witness it forever, and withhold the hammer
 * that would bring everything down.
 *
 * Reach: eye (Witness ↔ Judge). Scale: regional — the verdict decides whether a
 * whole region holds together or burns.
 *
 * Player-as-god framing: both choices are god-actions. "Deliver the verdict" is
 * active intervention (coercive) — the god steels the magistrate past the
 * consequences. "Bear witness, withhold the hammer" is divine restraint — the
 * always-valid "let them handle it," which tilts Witness because a judge left to
 * feel the region behind the accused records the truth but cannot, alone, choose
 * to set it all on fire.
 *
 * TODO(THR-498): repeatability: 'unique' — bespoke regional marquee, fire ≤1×/playthrough.
 * Field does not exist on UnifiedActionTemplate until THR-498 lands.
 *
 * Authored directly to the exemplar quality bar (rival-shrine-betrayal 10/10,
 * flawed-steel 9/10) rather than via the 4-pass encounter-pipeline, which is not
 * supervisable inside an automated single-issue run. Held to the editorial REVISE
 * triggers: approach prose at every step, scene-specific god-verbs, cool failure
 * at every branch, human consequences over mechanical labels.
 */

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — The Word in the Magistrate's Mouth. The verdict is decided in fact
 * and undecided in nerve. Difficulty 0 — the choice is the point.
 */
const step0TheWord: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The hall was full and silent and the magistrate had the verdict in their mouth like a coin they could ' +
    'not bring themselves to spend. The facts were not in question. They had read the order in the war-lord\'s ' +
    'own hand — march on the fords, leave none — and they had stood at the lip of the burial pit and counted, ' +
    'and they had heard the three witnesses who had no reason left in the world to lie. The lord was guilty ' +
    'of the massacre at the fords. Everyone in the hall knew it, including the lord, who sat very straight and ' +
    'did not bother to deny it, because the lord also knew the other thing the magistrate knew: that the ' +
    'lord\'s militia was the only army the region had, that the lord\'s kin held half the towns, that the ' +
    'fragile decade of peace since the bad years rested entirely on this one murderer\'s broad back. "Guilty" ' +
    'was true. "Guilty" was also a torch laid to the whole region — the militia in revolt, the kin-towns ' +
    'rising, the bad years come round again with interest. The magistrate had spent their life believing the ' +
    'law was the law. They sat at the bench, in the silence, learning what that belief weighed when the scale ' +
    'on the other side was everyone. The god stood at the bench-rail and could feel the truth and the region ' +
    'both, pulling against each other in the magistrate\'s throat.',
  successAfterimage: 'The magistrate held the true verdict in their mouth and felt the whole region pulling against it.',
  failureAfterimage: 'The magistrate\'s voice cracked on the first syllable and they had to call a recess to keep from saying anything at all.',
};

/**
 * Step 1 — Deliver the Verdict (Judge). The god steels the magistrate to say the
 * true word; the lord is condemned, the law holds, and the region comes apart in
 * the fire that justice lit.
 */
const step1DeliverTheVerdict: ActionStep = {
  reach: 'eye',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god put steel in the magistrate the way a spine is put in a sentence — not courage exactly, more ' +
    'the cold refusal to let the size of a consequence change the size of a fact. And the magistrate said it. ' +
    '"Guilty," to the war-lord who had held the region together, "of the massacre at the fords," and then the ' +
    'sentence that the law required and the region could not survive. For one heartbeat the hall was the ' +
    'cleanest room in the world: the law had reached the man no one thought it could reach, the burial pit at ' +
    'the fords had been answered, the three witnesses had not died for nothing. Then the lord\'s captains ' +
    'stood up all along the back wall, and the clean heartbeat ended, and the region began to burn the way ' +
    'the magistrate had known it would. The militia revolted before the sentence was a day old. The kin-towns ' +
    'rose. The decade of peace went up like a dry barn. But no one in the region could ever again say that ' +
    'the law was only for the weak, because they had all watched it reach the strongest man alive and not ' +
    'flinch — and some of them, in the bad years that followed, held onto that the way you hold a coal in ' +
    'winter: it hurt, and it was the only warm thing they had.',
  successAfterimage: 'The true verdict was spoken, the law reached the unreachable man, and the region went up in the fire that justice lit.',
  failureAfterimage:
    'The verdict came out mangled — half-condemnation, a sentence softened mid-breath — so the law neither ' +
    'cleanly reached the lord nor cleanly spared the region, and the fire started anyway over a judgment no ' +
    'one quite respected.',
  successMetadata: { reputationDelta: 0.12 },
  failureMetadata: { reputationDelta: -0.12 },
};

/**
 * Step 1 — Bear Witness, Withhold the Hammer (Witness / divine restraint = "let
 * them handle it"). The god stays its hand; the magistrate names the crime into
 * the record forever but cannot, alone, set the region on fire — the truth is
 * witnessed, the sentence withheld, the region stands and the injustice with it.
 */
const step1BearWitness: ActionStep = {
  reach: 'eye',
  duration: { min: 2, max: 3 },
  difficulty: 0.4,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god gave the magistrate nothing to steel them, and left them alone at the bench with the truth and ' +
    'the whole region breathing behind it. And the magistrate, who was not a coward but who could feel every ' +
    'kin-town and every militia spear and every child of the next bad years sitting in the scale against the ' +
    'word "guilty," did the thing a witness does instead of the thing a judge does. They put the truth on the ' +
    'record — every fact, the order in the lord\'s hand, the count at the pit, the three witnesses named and ' +
    'sworn, so that no one, ever, in any year to come, could pretend the massacre at the fords had not ' +
    'happened or that this lord had not done it. And then they withheld the hammer. A technicality, dressed ' +
    'up in just enough law to stand: jurisdiction, a flaw in the writ, a sentence suspended on conditions ' +
    'the lord would meet because meeting them cost him nothing. The lord walked. The region did not burn. The ' +
    'decade of peace went on, bought at the price of one murderer kept on his feet — and the magistrate ' +
    'carried, ever after, the knowledge that they had seen a true thing clearly and chosen not to make it ' +
    'land, and that the burial pit at the fords had been witnessed but never quite answered. The record ' +
    'stood. The justice did not. They were not the same thing, and the magistrate had chosen the one that ' +
    'let the children of the next decade be born.',
  successAfterimage: 'The truth went on the record forever and the hammer was withheld, and the region kept its fragile decade of peace.',
  failureAfterimage:
    'The withholding came out as a botch — the truth half-recorded, the technicality too flimsy to respect — ' +
    'so the lord walked under a judgment that fooled no one and the record itself was left open to denial.',
  successMetadata: { reputationDelta: 0.1 },
  failureMetadata: { reputationDelta: -0.12 },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    deliver_the_verdict: step1DeliverTheVerdict,
    bear_witness: step1BearWitness,
  },
  fallback: { ...step1BearWitness },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

const VERDICT_DELIVERED_AFTERMATH = {
  overview:
    'The law reached the man no one thought it could reach, and the region paid for it in fire. The militia ' +
    'revolted, the kin-towns rose, and the decade of peace the war-lord had held together on his broad guilty ' +
    'back came apart in a single hard season — the bad years come round again, with interest. Thousands who ' +
    'were alive when the verdict was spoken were not alive a year later. And yet something had changed that ' +
    'the fire could not unburn: the region had watched its law reach all the way up to the strongest man ' +
    'alive and not flinch, and in the ash of the peace that cost them, a few of them began, for the first ' +
    'time, to believe that the law was actually for everyone. It was the most expensive thing the region ' +
    'had ever learned. The god\'s name was on the verdict that taught it.',
  changes: [
    {
      id: 'verdict_law_held',
      kind: 'future_hook' as const,
      title: 'The Law That Reached the Top',
      detail:
        'The war-lord was condemned for the massacre at the fords — the first time the region\'s law ever ' +
        'reached its strongest man. No one can ever again say the law is only for the weak. The region paid ' +
        'for that lesson in fire.',
      polarity: 'mixed' as const,
    },
    {
      id: 'verdict_region_burns',
      kind: 'future_hook' as const,
      title: 'The Decade Undone',
      detail:
        'The militia revolted, the kin-towns rose, and the fragile decade of peace went up like a dry barn. ' +
        'The bad years have come round again — and the god\'s blessing was on the verdict that lit them.',
      polarity: 'loss' as const,
    },
    {
      id: 'verdict_magistrate_marked',
      kind: 'reputation' as const,
      title: 'The Judge Who Did Not Flinch',
      detail:
        'The magistrate spoke the true word knowing what it cost. Half the region calls them the incorruptible ' +
        'one; the other half, burying its dead, calls them the hand that struck the match.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The verdict was true and the region is burning for it. The law reached the top and the peace is ash. ' +
    'What does the god do with the justice it chose to let land?',
  reactions: [
    {
      id: 'verdict_delivered_react_hold_the_line',
      label: 'Hold the line. Make the law\'s reach the region\'s new spine.',
      intent:
        'The peace is gone; do not let the lesson go with it. Pour the divine attention into the principle the ' +
        'fire bought — that the law reaches everyone — and make it the spine of whatever the region rebuilds ' +
        'from the ash, so the massacre at the fords stays answered and the next strong man knows it. Judge to ' +
        'the bone, building order on the cost already paid.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'verdict_law_enshrined',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god makes the verdict\'s principle the founding spine of the region\'s rebuilding — the law ' +
            'reaches everyone, and the fire that proved it will not be unlearned.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'eye.reckoning_echo',
          delayTicks: 18,
          priority: 1.1,
          seedLabel: 'The law that reached the top becomes founding principle',
        },
      ],
    },
    {
      id: 'verdict_delivered_react_walk_the_ash',
      label: 'Walk the ash. Be present for the region the verdict cost.',
      intent:
        'Justice was done and ordinary people are burying their children for it; do not look away from the ' +
        'price. Move the god\'s attention into the burning region — the kin-towns, the militia widows, the ' +
        'farmers caught between — and carry a hard mercy through the bad years the true verdict brought back, ' +
        'so the cost of justice is not paid in loneliness on top of fire.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'verdict_ash_walked',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god that let the verdict land now walks the region it burned — carrying a hard mercy through ' +
            'the bad years its own justice brought back.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'eye.aftermath_mercy',
          delayTicks: 14,
          priority: 1.15,
          seedLabel: 'The region that burned for justice',
        },
      ],
    },
  ],
} as const;

const HAMMER_WITHHELD_AFTERMATH = {
  overview:
    'The truth went into the record and the hammer stayed in the magistrate\'s hand, and the region kept its ' +
    'fragile decade of peace at the price of a murderer kept on his feet. The war-lord walked. The militia ' +
    'did not revolt; the kin-towns did not rise; the children of the next decade were born because the bad ' +
    'years did not come round. But the burial pit at the fords had been witnessed and never answered, and ' +
    'everyone who knew — and because of the record, everyone would always be able to know — carried the ' +
    'particular weight of a justice seen clearly and set deliberately aside. The lord lived out his years a ' +
    'free man with the truth of him written down where no one could deny it, which is a strange half-sentence: ' +
    'unpunished and unable, ever, to be innocent. The region chose its living children over its dead ones. ' +
    'The record will outlast everyone who made the choice.',
  changes: [
    {
      id: 'hammer_peace_kept',
      kind: 'future_hook' as const,
      title: 'The Decade That Held',
      detail:
        'The region did not burn. The militia stayed in its barracks, the kin-towns stayed quiet, and the ' +
        'fragile peace went on — bought with one murderer kept on his feet and a justice deliberately ' +
        'withheld.',
      polarity: 'mixed' as const,
    },
    {
      id: 'hammer_truth_recorded',
      kind: 'future_hook' as const,
      title: 'The Witnessed Crime',
      detail:
        'The massacre at the fords is on the record forever — every fact, the order in the lord\'s hand, the ' +
        'three witnesses sworn. The lord can never be innocent again, only unpunished. The truth was kept ' +
        'even where the justice was not.',
      polarity: 'gain' as const,
    },
    {
      id: 'hammer_justice_owed',
      kind: 'reputation' as const,
      title: 'The Debt at the Fords',
      detail:
        'The dead at the fords were witnessed and never answered. The magistrate carries the knowledge that ' +
        'they saw a true thing and chose not to make it land — and the region\'s peace rests on that quiet, ' +
        'permanent debt.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The hammer stayed down and the region kept its peace; the truth is on the record and the justice is ' +
    'owed. What does the god do with the reckoning it chose not to let fall?',
  reactions: [
    {
      id: 'hammer_withheld_react_keep_the_record',
      label: 'Keep the record. Make the witnessed truth the region\'s conscience.',
      intent:
        'The justice was withheld but the truth was kept; make the keeping count. Pour the divine attention ' +
        'into the record itself — let the named, sworn account of the fords become a thing the region returns ' +
        'to, a conscience that outlives the lord and refuses to let the massacre soften into rumor. Witness to ' +
        'the bone: the truth held even where the hammer could not fall.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'hammer_record_kept',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god makes the witnessed record of the fords into the region\'s living conscience — a truth ' +
            'kept burning where the justice was withheld, refusing to let the dead soften into rumor.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'eye.kept_record',
          delayTicks: 18,
          priority: 1.1,
          seedLabel: 'The record of the fords becomes the region\'s conscience',
        },
      ],
    },
    {
      id: 'hammer_withheld_react_collect_the_debt',
      label: 'Collect the debt. Find the lord a reckoning the region can survive.',
      intent:
        'The hammer was withheld to save the region, not to pardon the lord; the debt at the fords is still ' +
        'owed. Move the god\'s attention to the slow, careful work of bringing the war-lord a justice that ' +
        'does not pull the keystone — erode his grip, outlive his power, let the witnessed truth do its patient ' +
        'work until a reckoning becomes possible that the region can actually survive.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'hammer_debt_pursued',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god that withheld the hammer begins the patient work of collecting the debt at the fords — ' +
            'eroding the lord\'s grip until a reckoning the region can survive becomes possible.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'eye.slow_reckoning',
          delayTicks: 20,
          priority: 1.05,
          seedLabel: 'The patient collection of the fords debt',
        },
      ],
    },
  ],
} as const;

// ─── Template ──────────────────────────────────────────────────────────

export const VERDICT_THAT_BURNS_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'eye.reckoning.verdict_that_burns',
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  name: 'The Verdict That Burns',
  reach: 'eye',
  crudType: 'read',
  scale: 'regional',

  steps: [step0TheWord, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  motivations: ['revelation_discretion', 'mercy_ruthlessness'],

  locationSubtypes: ['city', 'capital', 'town', 'castle'],

  narrativeTemplates: {
    initiation:
      'A threaded magistrate must judge the war-lord who held the region together for a massacre the evidence ' +
      'proves beyond doubt — but a true verdict pulls the keystone and the region burns. The god decides ' +
      'whether the hammer falls or the truth is witnessed and the sentence withheld.',
    success:
      'The magistrate does what the god leans them toward — speaks the burning verdict or records the truth ' +
      'and withholds the hammer — and a whole region either goes up in the fire that justice lit or keeps its ' +
      'fragile peace at the price of a reckoning deferred.',
    failure:
      'The judgment comes out mangled — a half-condemnation, or a withholding too flimsy to respect — and the ' +
      'region gets neither clean justice nor clean peace.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',

  authoredChoices: {
    0: [
      {
        id: 'deliver_the_verdict',
        label: 'Steel them. Let the verdict fall.',
        intent:
          'Put the cold refusal in them to let the size of a consequence change the size of a fact, and let ' +
          'the true word out: guilty, and the sentence the law requires. The law will reach the strongest man ' +
          'alive for the first time in the region\'s history — and the region will burn for it, the militia ' +
          'in revolt, the kin-towns rising, the decade of peace gone up like a dry barn and the bad years come ' +
          'round again with your blessing on the verdict that lit them. Justice that lands, paid for by ' +
          'everyone who lives under it.',
        targetLabel: 'The magistrate',
        interventionType: 'coercive',
      },
      {
        id: 'bear_witness',
        label: 'Stay your hand. Let them witness, and withhold the hammer.',
        intent:
          'Give them nothing to steel them, and let a decent judge feel the whole region breathing behind the ' +
          'accused. They will put the truth on the record forever — every fact, every witness sworn, so the ' +
          'massacre can never be denied — and then withhold the sentence on a technicality dressed in just ' +
          'enough law to stand. The lord walks; the region keeps its fragile peace; the children of the next ' +
          'decade are born. The truth is kept where the justice is not, and the debt at the fords stays owed. ' +
          'Mercy to the living through a reckoning deferred.',
        targetLabel: 'The magistrate',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      deliver_the_verdict: VERDICT_DELIVERED_AFTERMATH,
      bear_witness: HAMMER_WITHHELD_AFTERMATH,
    },
    fallback: { ...HAMMER_WITHHELD_AFTERMATH },
  },

  description:
    'A regional-scale justice-versus-survival encounter: a threaded magistrate must judge the war-lord who ' +
    'holds the region together for a massacre the evidence proves, knowing a true verdict burns the region ' +
    'down, and the god decides whether the hammer falls or the truth is witnessed and withheld. Reach: eye ' +
    '(Witness ↔ Judge).',
});

export default VERDICT_THAT_BURNS_TEMPLATE;
