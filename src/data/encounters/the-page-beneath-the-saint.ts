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
  // THR-2134: all player text rewritten to Prose Doctrine v2 (opening skeleton).
  narrativeTemplate:
    '{actor}, an archivist, is working late in the sealed lower stacks of the great library at {location}.\n\n' +
    '{actor} finds the faith\'s founding chronicle, in the first scribe\'s own hand. It says the saint never ' +
    'healed the dying at the river. The miracle was staged with a borrowed corpse and a paid witness, and ' +
    'the relic came from a butcher\'s shop.\n\n' +
    'The whole region lives by that faith. {actor} must decide what to do with the page.',
  successAfterimage: '{actor} held the chronicle under the lamp and could not put it down.',
  failureAfterimage: '{actor}\'s hands shook so badly that the old page nearly tore.',
  // THR-1667 S3: the missing afterimages. Step 0 is the authored choice, so it
  // carries no hand (a hand on a choice step would replace the fork).
  successAtCostAfterimage: '{actor} kept hold of the chronicle, but gripped it hard enough to crack the page along its fold.',
  criticalSuccessAfterimage:
    '{actor} found a note in the margin from a later scribe. That scribe had read the same page and drawn ' +
    'a small cross beside it.',
  criticalFailureAfterimage:
    'The lamp went out. {actor} found the stair in the dark and came up with the page crushed in one fist.',
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
    'The god shows {actor} the dying farmers the faith comforts, and makes the page seem cruel beside them. ' +
    '{actor} writes false notes into the library\'s copies, calling the old hand unreliable. Then {actor} ' +
    'seals the original in a wall deeper in the stacks, and mortars the stone shut.',
  successAfterimage: 'The page went back into the dark, deeper than before. The faith stood untouched.',
  failureAfterimage:
    '{actor} sealed the page but botched the false notes. A sharp reader could follow them back one day.',
  // THR-1667 S3: the missing afterimages and a dealt hand.
  successAtCostAfterimage:
    'The page was sealed, but the mortaring took three nights. A novice saw {actor} on the lowest stair with a trowel.',
  criticalSuccessAfterimage:
    '{actor} sealed the page and then burned the only shelf-list that named it. No one will know which wall to open.',
  criticalFailureAfterimage:
    '{actor} broke down halfway through the false notes. A junior reader found {actor} weeping, with the ' +
    'page open on the desk.',
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
    'The god gives {actor} nothing, and leaves {actor} alone with the page. {actor} makes careful copies, ' +
    'with the proof of the page\'s age set out plainly. {actor} gives one copy to the youngest reader in ' +
    'the order and lets the others travel.',
  successAfterimage: 'The chronicle came into the open, and the faith split around it.',
  failureAfterimage:
    'The truth leaked out half-proven and easy to deny. The region got a long rumour instead of a reckoning.',
  // THR-1667 S3: the missing afterimages and a dealt hand.
  successAtCostAfterimage:
    'The chronicle came into the open, but the order took {actor}\'s keys the day the copies went out.',
  criticalSuccessAfterimage:
    'The order\'s own high reader compared the page with the relic\'s papers, and declared in chapter that ' +
    'the page was genuine.',
  criticalFailureAfterimage:
    'The order called the chronicle a forgery before the copies were a day old. {actor} was named a ' +
    'heretic, and the copies burned in the square.',
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
    'The region\'s faith goes on as before: the calendar, the courts, the lamps lit for the dying. All of it ' +
    'rests on a forged founding. {actor} has become the most devout believer in the region, and knows ' +
    'exactly what is sealed in the lower stacks.',
  changes: [
    {
      id: 'page_faith_preserved',
      kind: 'future_hook' as const,
      title: 'A Faith Kept Whole',
      detail: 'The faith stands undisturbed on a forged founding.',
      polarity: 'gain' as const,
    },
    {
      id: 'page_archivist_haunted',
      kind: 'reputation' as const,
      title: 'The Most Devout in the Region',
      detail: '{actor} buried the truth, and now prays louder than anyone.',
      polarity: 'mixed' as const,
    },
    {
      id: 'page_buried_timebomb',
      kind: 'future_hook' as const,
      title: 'The Page in the Wall',
      detail: 'The true chronicle is mortared into a wall. Someone may find it.',
      polarity: 'loss' as const,
    },
  ],
  reactionPrompt: 'The faith stands, and the true page is hidden. What does the god do now?',
  reactions: [
    {
      id: 'page_buried_react_bless_the_comfort',
      label: 'Bless the comfort.',
      intent: 'Make the faith\'s comfort real for the dying and the grieving, whatever its founding was.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god blesses the comfort the faith gives the dying, whatever its founding was.',
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
      label: 'Stay with the keeper.',
      intent: 'Stay near {actor}, who carries the secret alone and prays every day to a saint who never lived.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message: 'The god stays near {actor}, who carries the buried secret alone.',
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
    'The faith has split. The old believers grieve a miracle they now know was staged. The young are building ' +
    'a colder, more honest faith of their own. The dying no longer have the saint\'s river to hope for. Some ' +
    'curse {actor} for it, and a few give thanks.',
  changes: [
    {
      id: 'page_faith_shattered',
      kind: 'future_hook' as const,
      title: 'A Faith Split in Two',
      detail: 'Old believers and young reformers are fighting in every parish.',
      polarity: 'mixed' as const,
    },
    {
      id: 'page_truth_freed',
      kind: 'future_hook' as const,
      title: 'The Truth in the Open',
      detail: 'Copies of the true chronicle are everywhere. No one can call them back.',
      polarity: 'gain' as const,
    },
    {
      id: 'page_archivist_marked',
      kind: 'reputation' as const,
      title: 'The One Who Read the Page',
      detail: 'Half the region hates {actor}. The other half gives thanks for the truth.',
      polarity: 'mixed' as const,
    },
  ],
  reactionPrompt: 'The truth is out, and the faith is split. What does the god do now?',
  reactions: [
    {
      id: 'page_surfaced_react_tend_the_grieving',
      label: 'Comfort the grieving.',
      intent: 'Sit with the faithful who lost their comfort, and help them face death without it.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 1,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'ripple_consequence' as const,
          message: 'The god sits with the faithful who lost their comfort to the truth.',
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
      label: 'Bless the reformers.',
      intent: 'Bless the young reformers, so that what they build stands on honest ground.',
      effects: [
        {
          kind: 'reputation_tally' as const,
          key: 'veil.positive',
          delta: 2,
        },
        {
          kind: 'recent_event' as const,
          eventType: 'narrative' as const,
          message: 'The god blesses the young reformers and the honest faith they are building.',
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
        'The secret did not keep for even a season. A junior reader found {actor} weeping over the open ' +
        'chronicle and was told a clumsy lie. The page went back into the wall all the same. But two people ' +
        'now know it exists, and one of them never agreed to keep quiet.',
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
        'The order called the chronicle a forgery and named {actor} a heretic from every pulpit. The faith did ' +
        'not split. It hardened, and more lamps burn for the saint than before. {actor} lives outside the ' +
        'library now, on what a few believers can spare.',
      changes: [],
      reactionPrompt: 'The faith has hardened, and {actor} is out in the cold. What does the god do now?',
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
    lost: 'sealed the page but botched the false notes',
    lostBadly: 'was found weeping over the open page',
    arms: {
      let_the_truth_surface: {
        won: 'carried the chronicle into the open',
        lost: 'leaked the truth half-proven and easy to deny',
        lostBadly: 'was named a heretic as the copies burned',
      },
    },
  },
  rarityTier: 4,
  intrinsicTier: 'story_beat',
  // THR-1982 — the premise casts a fixed job; a mortal whose trade is outside
  // this list does not draw it (a roleless mortal still does).
  protagonistRoles: ['scribe', 'librarian', 'scholar', 'researcher', 'sage', 'clerk', 'acolyte', 'priest'],
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
      'A threaded archivist has found proof that a regional faith\'s saint was invented. A god can push the ' +
      'page back into the dark, or leave the archivist to bring it out.',
    success:
      'The archivist seals the page away or carries it into the open. The faith stands on a known lie, or ' +
      'splits around the truth.',
    failure:
      'The archivist\'s work goes wrong: a botched burial, or a truth leaked half-proven. The region gets ' +
      'neither comfort nor a reckoning.',
  },


  authoredChoices: {
    0: [
      {
        id: 'bury_it_deeper',
        label: 'Bury it deeper. Let the comfort stand.',
        intent:
          'Make the truth feel cruel and the lie feel kind, and push the archivist to seal the page away.',
        targetLabel: 'The archivist',
        essenceCost: 2, // THR-1800 — the god's push is paid for
        interventionType: 'coercive',
      },
      {
        id: 'let_the_truth_surface',
        label: 'Hold back. Let the truth surface.',
        intent: 'Give the archivist nothing, no vision and no push, and leave them alone with the page.',
        targetLabel: 'The archivist',
        essenceCost: 0, // THR-1800 — staying your hand costs nothing
        interventionType: 'withdrawn',
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
    'An archivist has found proof that a regional faith\'s founding saint was invented. A god can '
    + 'push the truth back into the dark, or let the archivist bring it out.',
});

export default PAGE_BENEATH_THE_SAINT_TEMPLATE;
