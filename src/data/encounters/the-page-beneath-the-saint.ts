/**
 * The Page Beneath the Saint — regional-scale branching encounter (THR-466).
 *
 * A threaded archivist, deep in the sealed lower stacks of a regional faith's
 * great library, has found the founding chronicle in its original hand — and it
 * proves the saint the whole region venerates was an invention: the miracle
 * staged, the relic dressed, the doctrine grown from a forged page. That faith
 * orders a region — its calendar, its courts, the comfort a hundred thousand
 * people take to their graves. The god can press the truth back down into the
 * dark and let the comforting order stand; or stay its hand and let the
 * archivist do what archivists, left alone with a true thing, eventually do —
 * bring it into the light, and let the faith come apart.
 *
 * Reach: veil (Seer ↔ Manipulator). Scale: regional — the truth, or its burial,
 * decides the faith that governs a whole region.
 *
 * Player-as-god framing: both choices are god-actions. "Bury it deeper" is
 * active intervention (coercive) — the god works on the archivist's certainty
 * and on the evidence until the lie holds. "Let the truth surface" is divine
 * restraint — the always-valid "let them handle it," which here is the
 * *disruptive* pole: a scholar cannot sit forever on a proof, and left to their
 * own nature the archivist surfaces it and the order built on the lie cracks.
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

import type { UnifiedActionTemplate, ActionStep, ActionStepBranch, AftermathVariant } from '../../types/unifiedAction';
import { withEncounterContract } from '../encounter-contract-builder';
import { DEAL_DEFAULT_COUNT } from '../nudge-constants';

// ─── Steps ───────────────────────────────────────────────────────────

/**
 * Step 0 — The Find in the Lower Stacks. The archivist holds the original
 * chronicle and weighs a true thing against a useful one. Difficulty 0 — the
 * choice is the point.
 */
const step0TheFind: ActionStep = {
  reach: 'veil',
  duration: { min: 2, max: 3 },
  difficulty: 0,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The lamp had burned down to a thumb-width and the archivist had not noticed. They were holding the ' +
    'founding chronicle — the real one, in the first scribe\'s own cramped hand, sealed two centuries ago in ' +
    'the lowest course of the stacks where no pilgrim ever goes — and reading, for the third time, the ' +
    'sentence that took the floor out from under a whole region. The saint had not healed the dying at the ' +
    'river. There had been no river-miracle. There had been a frightened young preacher, a borrowed corpse, ' +
    'a paid witness, and a relic dressed from a butcher\'s shop, and from those four cheap things had grown ' +
    'the faith that now set the region\'s calendar, married its couples, judged its thieves, and sat at the ' +
    'bedside of every dying farmer for a hundred miles to tell them the river was waiting. The archivist ' +
    'loved that faith. They had given it their eyes and their back and their best decades. And they were holding ' +
    'the page that unmade it, in a guttering light, knowing that to know a true thing is already to have ' +
    'half-decided what to do with it. The god stood in the dark between the shelves and could feel the weight ' +
    'of the page and the weight of the hundred thousand graves it would reopen.',
  successAfterimage: 'The archivist held the founding chronicle in the failing lamplight and could not put it down.',
  failureAfterimage: 'The archivist\'s hands shook so badly that the brittle page nearly tore, and they had to set it flat and breathe.',
  // THR-1667 S3: the missing afterimages. Step 0 is the authored choice, so it
  // carries no hand (a hand on a choice step would replace the fork).
  successAtCostAfterimage: 'The archivist kept hold of the chronicle, but gripped it hard enough to crack the page along its old fold.',
  criticalSuccessAfterimage:
    'Under the lamp the archivist found a second hand in the margin: a later scribe who had read the same page, ' +
    'and had written nothing but a small cross beside it.',
  criticalFailureAfterimage:
    'The lamp went out. The archivist groped for the stair in the dark and came up with the page crushed in ' +
    'one fist.',
};

/**
 * Step 1 — Bury It Deeper (Manipulator). The god works on the archivist's
 * certainty and on the evidence until the comforting lie holds and the region's
 * faith stands, undisturbed, on a forgery the god helped re-seal.
 */
const step1BuryItDeeper: ActionStep = {
  reach: 'veil',
  duration: { min: 3, max: 4 },
  difficulty: 0.45,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god did not tell the archivist to lie. It did something quieter and more total: it made the truth ' +
    'feel like cruelty. It let them see the dying farmer at the bedside, and the widow lighting the river-lamp, ' +
    'and the child who slept because the river was waiting — and it let the chronicle, by comparison, look ' +
    'like vanity, like a scholar\'s itch to be right at the cost of everyone\'s peace. And the archivist, who ' +
    'was not weak but was tired and had been taught all their life to revere the order they served, agreed. ' +
    'They copied the page back into ambiguity — a marginal note here, a "later hand, unreliable" there — and ' +
    'they sealed the original deeper than they had found it, in a course of stone they mortared themselves so ' +
    'no one would ever read what they had read. The faith stood. The calendar turned. The farmers died ' +
    'comforted. And the archivist became, for the rest of their life, the most devout person in the region, ' +
    'the way a man is loudest about a debt he has decided never to pay. They had kept the peace. They had ' +
    'also become the second forger, two centuries after the first, and they knew it every single morning.',
  successAfterimage: 'The truth went back into the dark, deeper than before, and the region\'s faith stood untouched.',
  failureAfterimage:
    'The burial half-took — the archivist sealed the page but botched the marginal forgeries, leaving a ' +
    'scholar\'s thread that a sharper successor will one day pull, so the lie holds for now and rots for later.',
  // THR-1667 S3: the missing afterimages and a dealt hand.
  successAtCostAfterimage:
    'The truth went back into the dark, but the mortaring took three nights, and a novice saw the archivist on ' +
    'the lowest stair with a trowel in hand.',
  criticalSuccessAfterimage:
    'The archivist sealed the page and then, unasked, burned the only shelf-list that named it. No one will ' +
    'know which wall to open.',
  criticalFailureAfterimage:
    'The archivist broke halfway through the forgeries and wept at their desk. A junior reader found them there, ' +
    'with the original page lying open beside them.',
  deal: { count: DEAL_DEFAULT_COUNT, tags: ['lore', 'presence'] },
  successMetadata: { reputationDelta: 0.14 },
  failureMetadata: { reputationDelta: -0.1 },
};

/**
 * Step 1 — Let the Truth Surface (Seer / divine restraint = "let them handle it").
 * The god stays its hand; the archivist's own nature wins; they bring the
 * chronicle into the light, and the regional faith comes apart around the truth.
 */
const step1LetTheTruthSurface: ActionStep = {
  reach: 'veil',
  duration: { min: 2, max: 3 },
  difficulty: 0.4,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'continue_weakened',
  narrativeTemplate:
    'The god gave the archivist nothing — no comforting vision, no permission, no push — and left them alone ' +
    'with the page and their own nature. And the thing about a person who has spent forty years learning to ' +
    'tell a true document from a false one is that they cannot, in the end, un-know which is which. They did ' +
    'not denounce the faith from a rooftop. They did it the way archivists do anything: they made copies, ' +
    'fair and careful, with the provenance laid out so plainly that no one could call it a forgery in turn, ' +
    'and they put one into the hands of the youngest, fiercest reader in the order, and they let the truth ' +
    'do its own walking. It walked fast. Within a season the river-miracle was a scandal, within a year a ' +
    'schism, and the faith that had ordered the region for two centuries cracked down the middle — the old ' +
    'devout clinging to a comfort they now knew was staged, the young building something colder and truer ' +
    'in the rubble. The dying farmers were not comforted anymore. But they were not lied to anymore either, ' +
    'and a few of them, at the end, said they\'d rather have the real dark than the painted river. The ' +
    'archivist was hated by half the region and thanked by the other half and slept, for the first time in ' +
    'a year, all the way through the night.',
  successAfterimage: 'The chronicle reached the light, and the region\'s faith broke open around a truth it could not bury again.',
  failureAfterimage:
    'The truth surfaced clumsily — leaked half-proven, easy to deny — so the faith neither held clean nor ' +
    'broke clean, and the region got a long ugly rumor instead of a reckoning.',
  // THR-1667 S3: the missing afterimages and a dealt hand.
  successAtCostAfterimage:
    'The chronicle reached the light, but the order took the archivist\'s keys the day the copies went out. The ' +
    'archivist watched the schism begin from outside the library door.',
  criticalSuccessAfterimage:
    'The first to read the copies was the order\'s own high reader, who laid the page beside the relic\'s ' +
    'certificate and said aloud, in chapter, that the page was genuine.',
  criticalFailureAfterimage:
    'The order called the chronicle a forgery before the copies were a day old. The archivist was named a ' +
    'heretic from every pulpit, and the copies burned in the square.',
  deal: { count: DEAL_DEFAULT_COUNT, tags: ['lore', 'insight'] },
  successMetadata: { reputationDelta: 0.08 },
  failureMetadata: { reputationDelta: -0.13 },
};

const step1Branch: ActionStepBranch = {
  branchOnStep: 0,
  variants: {
    bury_it_deeper: step1BuryItDeeper,
    let_the_truth_surface: step1LetTheTruthSurface,
  },
  fallback: { ...step1LetTheTruthSurface },
};

// ─── Aftermath ─────────────────────────────────────────────────────────

const TRUTH_BURIED_AFTERMATH = {
  overview:
    'A buried truth does not stop being true; it only stops being known, and starts being load-bearing. The ' +
    'region went on as it had — the calendar, the courts, the river-lamps in the windows of the dying — and ' +
    'every stone of that order now rested, knowingly, on a forgery a god had helped re-seal. The comfort was ' +
    'real. The farmers died easier for it. But somewhere in the lowest course of the stacks the original page ' +
    'waited in its fresh mortar, and the archivist who sealed it grew old as the region\'s most fervent ' +
    'believer, carrying the one fact that could end everything like a stone swallowed whole. Peace had been ' +
    'kept. It had been kept the way a wound is kept by not looking at it, and the god\'s name was now on the ' +
    'not-looking.',
  changes: [
    {
      id: 'page_faith_preserved',
      kind: 'future_hook' as const,
      title: 'A Faith Kept Whole',
      detail:
        'The regional faith stands undisturbed. Its calendar turns, its courts judge, its river-lamps burn ' +
        'in the windows of the dying — all of it resting, now knowingly, on the forged founding the god helped ' +
        'press back into the dark.',
      polarity: 'gain' as const,
    },
    {
      id: 'page_archivist_haunted',
      kind: 'reputation' as const,
      title: 'The Most Devout Person in the Region',
      detail:
        'The archivist sealed the truth with their own hands and became the loudest believer alive — a ' +
        'fervor that is really a debt they have decided never to pay. They know, every morning, what they buried.',
      polarity: 'mixed' as const,
    },
    {
      id: 'page_buried_timebomb',
      kind: 'future_hook' as const,
      title: 'The Page in the Wall',
      detail:
        'The original chronicle waits in a fresh course of mortar in the lowest stacks. It is not gone. It ' +
        'is load-bearing — and a sharper successor, some quiet century from now, may yet read what the god buried.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt:
    'The truth is sealed and the region\'s faith stands whole on top of it. The archivist carries the one ' +
    'fact that could end it all. What does the god do with the comfort it chose to protect?',
  reactions: [
    {
      id: 'page_buried_react_bless_the_comfort',
      label: 'Bless the comfort. Make the faith\'s mercy real even if its founding was not.',
      intent:
        'Commit to the lie\'s good fruit. The founding was forged, but the bedside comfort, the marriages, ' +
        'the river-lamps are real mercies to real people — pour the divine attention into them, make the faith ' +
        'true going forward by the good it does, and let the staged river stay a kindness rather than a fraud. ' +
        'Manipulator who chose to author a mercy instead of a truth.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god pours itself into the faith it chose to keep whole — making the bedside comfort and the ' +
            'river-lamps into mercies that are real now, whatever the founding was.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          query: { kind: 'encounter_template', tags: ['#temple_errand'] },
          delayTicks: 18,
          priority: 1.1,
          seedLabel: 'The faith becomes true by its fruit',
        },
      ],
    },
    {
      id: 'page_buried_react_ease_the_keeper',
      label: 'Ease the keeper. Sit with the archivist who carries what you buried.',
      intent:
        'The peace was bought with one person\'s permanent unease; do not abandon them to it. Move the god\'s ' +
        'attention to the archivist who sealed the page and now performs a devotion they no longer believe — ' +
        'be present in their long penance, and make sure the one who paid for the region\'s comfort is not ' +
        'left utterly alone with it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god turns toward the archivist who buried the truth on its behalf — sitting with the keeper ' +
            'of the secret through a devotion that is really a sentence.',
          significance: 0.72,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'veil.kept_secret',
          delayTicks: 15,
          priority: 1.15,
          seedLabel: 'The keeper of the buried page',
        },
      ],
    },
  ],
} as const;

const TRUTH_SURFACED_AFTERMATH = {
  overview:
    'A truth let out of the dark is a fire that warms and burns the same hands. The region\'s faith broke — ' +
    'not all at once, but the way a great house comes down once the founding stone is shown to be false: a ' +
    'schism, then a scattering, then two centuries of order suddenly unsure what to do with a Tuesday. The ' +
    'old devout grieved a comfort they could no longer un-know was staged. The young built something colder ' +
    'and harder and, in its way, more honest, in the rubble of the river-faith. Many dying farmers went into ' +
    'the real dark without the painted river, and some of them cursed the archivist for it, and a few of them ' +
    'thanked them. No one in the region is comforted the way they were a year ago. Everyone in the region is ' +
    'standing, for the first time in two centuries, on what is actually there.',
  changes: [
    {
      id: 'page_faith_shattered',
      kind: 'future_hook' as const,
      title: 'A Faith Come Apart',
      detail:
        'The regional faith has cracked down the middle — old devout against young reformers, a schism ' +
        'spreading through every parish. The comfort it gave a hundred thousand people is gone; what replaces ' +
        'it is colder, truer, and not yet finished being built.',
      polarity: 'mixed' as const,
    },
    {
      id: 'page_truth_freed',
      kind: 'future_hook' as const,
      title: 'The Truth Let Walk',
      detail:
        'The founding chronicle is in the open, copied past any recall, its provenance too plain to deny. The ' +
        'region builds on what is actually there now — harder ground, but real ground.',
      polarity: 'gain' as const,
    },
    {
      id: 'page_archivist_marked',
      kind: 'reputation' as const,
      title: 'The One Who Read the Page',
      detail:
        'The archivist is hated by the half of the region that lost its comfort and thanked by the half that ' +
        'wanted the truth. They are the name attached to the end of a two-century faith, and they sleep ' +
        'through the night for the first time in a year.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt:
    'The truth is out and the faith is coming apart around it — grief on one side, cold new honesty on the ' +
    'other. What does the god do with the order it chose not to protect?',
  reactions: [
    {
      id: 'page_surfaced_react_tend_the_grieving',
      label: 'Tend the grieving. Be present for the comfort that broke.',
      intent:
        'The truth was worth letting out; the grief it caused is still real. Move the god\'s attention to the ' +
        'old devout who lost the river they were promised at the bedside — do not gloat over the broken lie, ' +
        'but sit with the people whose comfort it took, and help them find a way to die without the painted ' +
        'river. Seer who refuses to be cruel about being right.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message:
            'The god that let the truth out now sits with the ones it cost — tending the old devout through ' +
            'the loss of a comfort they can no longer believe.',
          significance: 0.75,
        },
        {
          kind: 'encounter_seed' as const,
          query: { kind: 'encounter_template', tags: ['#temple_errand'] },
          delayTicks: 16,
          priority: 1.05,
          seedLabel: 'The faithful who lost the river',
        },
      ],
    },
    {
      id: 'page_surfaced_react_father_the_new',
      label: 'Father the new. Bless what the young build in the rubble.',
      intent:
        'A faith broke; something is being built where it stood. Turn the divine attention to the young ' +
        'reformers raising a colder, truer order on the cleared ground — bless the hard honest thing they\'re ' +
        'making, and make sure the region\'s next two centuries are founded on a stone that is actually what ' +
        'it claims to be. Seer who stays to midwife the truth\'s consequences.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message:
            'The god blesses the colder, truer order rising in the broken faith\'s place — founding the ' +
            'region\'s next age on ground that is honestly what it says it is.',
          significance: 0.8,
        },
        {
          kind: 'encounter_seed' as const,
          encounterFamily: 'veil.new_canon',
          delayTicks: 20,
          priority: 1.1,
          seedLabel: 'The honest faith rising from the rubble',
        },
      ],
    },
  ],
} as const;

// ─── Band endings (THR-1667 S3) ───────────────────────────────────────
//
// Every step on both paths continues weakened, so a critical failure is the one
// losing band each path owes (THR-1509 per-path coverage). A band ending retells
// how the existing change landed; it never adds a chip (UI Law 56).

// The burial still holds on a critical failure, only worse kept: all three
// base chips stay true, so the band restates the overview alone.
const TRUTH_BURIED_ENDINGS: AftermathVariant = {
  ...TRUTH_BURIED_AFTERMATH,
  byOutcome: {
    critical_failure: {
      overview:
        'The burial did not hold its secret even for a season. A junior reader found the archivist weeping over ' +
        'the open chronicle, asked what it was, and was told a lie too clumsy to believe. The page went back into ' +
        'the wall all the same, and the region went on lighting its river-lamps. But two people now know the ' +
        'page exists, and one of them never agreed to keep it.',
    },
  },
};

// On a critical failure the truth did not surface: the order denied it and the
// faith hardened. Every base chip says the faith broke and the truth walked, and
// both reactions tend what the break left, so the band carries neither.
const TRUTH_SURFACED_ENDINGS: AftermathVariant = {
  ...TRUTH_SURFACED_AFTERMATH,
  byOutcome: {
    critical_failure: {
      overview:
        'The truth came out too fast and too thinly proven. The order called the chronicle a forgery before the ' +
        'ink on the copies was dry, named the archivist a heretic from every pulpit, and burned the copies in ' +
        'the square. The faith did not break. It hardened. The river-lamps burn in more windows than before, and ' +
        'the archivist lives outside the library now, on what the few who believed them can spare.',
      changes: [],
      reactionPrompt:
        'The truth was denied and the faith has hardened around the lie. The archivist is out in the cold for ' +
        'reading it. What does the god do now?',
      reactions: [],
    },
  },
};

// ─── Template ──────────────────────────────────────────────────────────

export const PAGE_BENEATH_THE_SAINT_TEMPLATE: UnifiedActionTemplate = withEncounterContract({
  id: 'veil.truth.page_beneath_saint',
  stakes: {
    goal: 'seal the forged saint’s page back in the dark',
    risk: 'be found weeping over the open page',
    won: 'sealed the saint’s page deeper in the stacks',
    lost: 'sealed the page but botched the forgeries',
    lostBadly: 'was found weeping over the open page',
    arms: {
      let_the_truth_surface: {
        won: 'carried the chronicle into the light',
        lost: 'leaked the truth half-proven and easy to deny',
        lostBadly: 'was named a heretic as the copies burned',
      },
    },
  },
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  name: 'The Page Beneath the Saint',
  reach: 'veil',
  crudType: 'read',
  scale: 'regional',

  steps: [step0TheFind, step1Branch],

  apCost: 1,
  essenceCost: 3,

  actorAffinities: ['individual'],
  motivations: ['tradition_novelty', 'honesty_cunning'],

  locationSubtypes: ['temple', 'living_archive', 'city', 'capital'],

  narrativeTemplates: {
    initiation:
      'A threaded archivist has found the original founding chronicle of a regional faith. It is proof that ' +
      'the venerated saint was an invention, and that the whole order rests on a forged page. A god can press ' +
      'the comforting truth deeper into the dark, or the disruptive one into the light.',
    success:
      'The archivist does what the god leans them toward — re-seals the page deeper, or carries it into the ' +
      'light. A faith that orders a whole region either stands untouched on a known lie, or comes apart ' +
      'around a truth it can no longer bury.',
    failure:
      'The choosing goes clumsy — a botched burial that rots for later, or a half-leaked truth too easy to ' +
      'deny. The region gets neither a clean comfort nor a clean reckoning.',
  },

  illustrationUrl: '/concept-art/encounters/placeholder.jpg',

  authoredChoices: {
    0: [
      {
        id: 'bury_it_deeper',
        label: 'Bury it deeper. Let the comfort stand.',
        intent:
          'Make the truth feel like cruelty and the lie feel like mercy, until the archivist re-seals the ' +
          'page deeper than they found it. The regional faith will stand untouched — its calendar, its courts, ' +
          'the river-lamps in the windows of the dying. All of it rests, knowingly, on a forgery you helped ' +
          'press back into the dark. The comfort is real and the farmers die easier for it; the cost is one ' +
          'keeper carrying the fact that could end everything, for the rest of their life, with your name on ' +
          'the not-looking.',
        targetLabel: 'The archivist',
        interventionType: 'coercive',
      },
      {
        id: 'let_the_truth_surface',
        label: 'Stay your hand. Let the truth surface.',
        intent:
          'Give them nothing — no vision, no permission, no push — and let a person who spent forty years ' +
          'learning true from false do what they cannot help doing: bring the proof into the light. The faith ' +
          'that ordered the region for two centuries will crack. Schism, scattering, the old devout grieving ' +
          'a comfort they now know was staged, the young building something colder and truer in the rubble. ' +
          'The dying will not be comforted the way they were; they will also not be lied to. A reckoning ' +
          'through restraint, paid for by everyone who loved the river.',
        targetLabel: 'The archivist',
        interventionType: 'supportive',
      },
    ],
  },

  aftermathConfig: {
    branchOnStep: 0,
    variants: {
      bury_it_deeper: TRUTH_BURIED_ENDINGS,
      let_the_truth_surface: TRUTH_SURFACED_ENDINGS,
    },
    fallback: { ...TRUTH_SURFACED_ENDINGS },
  },

  description:
    'A regional-scale truth-versus-comfort encounter: a threaded archivist has found proof that a regional ' +
    'faith\'s founding saint was forged, and a god can press the truth back into the dark ' +
    'or let the scholar carry it into the light. Reach: veil (Seer ↔ Manipulator).',
});

export default PAGE_BENEATH_THE_SAINT_TEMPLATE;
