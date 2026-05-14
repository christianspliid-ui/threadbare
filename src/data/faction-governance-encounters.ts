/**
 * Faction Governance Encounters (THR-400) — four seeded encounters that fire
 * downstream of the four governance verbs:
 *
 *   - faction.encounter.dissent_surfaces        — seeded by Stir Dissent threshold
 *   - faction.encounter.leader_at_a_crossroads  — seeded by Whisper to the Leader
 *   - faction.encounter.doctrine_surfaces       — seeded by Recover Doctrine
 *   - faction.encounter.doubter_chooses         — seeded by Surface a Doubter
 *
 * Authored in the per-scene god-verb style (2026-05-04 encounter-experience
 * direction): each encounter is a 2-beat scene with 2–3 choices, prose written
 * in the Threadbearer voice (short, charged, mythic — not tooltip dumps).
 *
 * Enrichment placeholders used: `{name}` (the actor), `{?has_ally}` (a
 * threaded ally co-presence), `{?has_artifact}` (a remembered artifact),
 * `{location}` (the encounter site). See systemic wiring guide §1.
 *
 * Plan: Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md §8.3
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';

// ─── faction.encounter.dissent_surfaces ─────────────────────────────────────

export const FACTION_DISSENT_SURFACES_TEMPLATE: UnifiedActionTemplate = {
  id: 'faction.encounter.dissent_surfaces',
  name: 'Dissent Surfaces',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning', 'loyalty_ambition'],
  narrativeTemplates: {
    initiation: 'finds that the room has been waiting for them to speak',
    success: 'the grievance is voiced — the faction will not be the same',
    failure: 'the grievance hardens; what was speakable becomes unspeakable',
  },
  steps: [
    {
      reach: 'shadow',
      duration: { min: 1, max: 2 },
      difficulty: 0.30,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The dissent the god planted has surfaced in {name}. They have been carrying it through ' +
        'three meetings now: the small slight no one remembered, the doctrine they always thought ' +
        'was wrong, the one promotion that wasn\'t given. ' +
        '{?has_ally}{ally} can see it on their face — the question of whether to say it out loud.{/has_ally}' +
        '{?no_ally}There is no one else here who will carry it. The grievance is theirs alone.{/no_ally}',
      successAfterimage: 'The room is quieter than it should be. {name} draws a breath.',
      failureAfterimage: 'The moment passes. {name} swallows it.',
    },
    {
      reach: 'shadow',
      duration: { min: 1, max: 2 },
      difficulty: 0.40,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: { categoryWeights: { condition: 0.60, possession: 0.20, bestowed_power: 0.20 } },
        reputationDelta: -0.05,
      },
      failureMetadata: {
        rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
      },
      narrativeTemplate:
        'They speak. Not loudly. The room hears it anyway. ' +
        'There is no taking it back: the faction will respond — discipline, exile, or, more rarely, ' +
        'agreement. {name} carries the grievance now as something said, not something held.',
      successAfterimage: 'The faction must answer. {name} has made it so.',
      failureAfterimage: 'They swallow it again. The grievance lodges deeper.',
    },
  ],
};

// ─── faction.encounter.leader_at_a_crossroads ───────────────────────────────

export const FACTION_LEADER_CROSSROADS_TEMPLATE: UnifiedActionTemplate = {
  id: 'faction.encounter.leader_at_a_crossroads',
  name: 'Leader at a Crossroads',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'courage_prudence'],
  narrativeTemplates: {
    initiation: 'arrives at the decision they have been carrying',
    success: 'they answer in their own voice — the one the god named is the one that rises',
    failure: 'they answer in their own voice — but it is not the one the god expected',
  },
  steps: [
    {
      reach: 'heart',
      duration: { min: 1, max: 2 },
      difficulty: 0.25,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        '{name} sits with the decision. The faction is waiting on it: ally or refuse, ' +
        'march or hold, forgive or punish. They have been turning the question over for days. ' +
        'Something inside them whispers an answer that feels like their own. ' +
        '{?has_artifact}{artifact:any} rests within reach — a reminder of what they have already ' +
        'committed to.{/has_artifact}',
      successAfterimage: 'The answer surfaces. {name} recognizes it.',
      failureAfterimage: 'The whispers tangle. The decision drifts.',
    },
    {
      reach: 'heart',
      duration: { min: 1, max: 2 },
      difficulty: 0.40,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: { categoryWeights: { condition: 0.40, possession: 0.30, bestowed_power: 0.30 } },
        reputationDelta: 0.05,
      },
      failureMetadata: {
        rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
      },
      narrativeTemplate:
        '{name} speaks. The faction listens — not because they must, but because they trust the voice. ' +
        'The decision lands. It is small enough that no one outside the faction will notice this week, ' +
        'and large enough that no one inside the faction will forget it.',
      successAfterimage: 'The leader has chosen. The faction tilts.',
      failureAfterimage: 'The leader has chosen — and the choice was not the god\'s.',
    },
  ],
};

// ─── faction.encounter.doctrine_surfaces ────────────────────────────────────

export const FACTION_DOCTRINE_SURFACES_TEMPLATE: UnifiedActionTemplate = {
  id: 'faction.encounter.doctrine_surfaces',
  name: 'Doctrine Surfaces',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'star',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['tradition_novelty', 'loyalty_ambition'],
  narrativeTemplates: {
    initiation: 'reads the doctrine aloud for the first time in three generations',
    success: 'the faction recognizes it — and is changed by the recognition',
    failure: 'the faction recognizes it — and refuses it',
  },
  steps: [
    {
      reach: 'star',
      duration: { min: 1, max: 2 },
      difficulty: 0.30,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        '{name} carries the recovered teaching to {location}. The faction gathers ' +
        'around the words — most have never heard them, but some of the oldest members ' +
        'recognize the cadence the way you recognize a song from a half-remembered ' +
        'childhood. The question is whether the teaching is theirs to take back.',
      successAfterimage: 'The doctrine sits in the air. {name} waits to see what falls.',
      failureAfterimage: 'The room rejects it before {name} can finish.',
    },
    {
      reach: 'star',
      duration: { min: 1, max: 2 },
      difficulty: 0.45,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: { categoryWeights: { condition: 0.30, possession: 0.30, bestowed_power: 0.40 } },
        reputationDelta: 0.08,
      },
      failureMetadata: {
        rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
      },
      narrativeTemplate:
        'The verdict comes from the faction itself — not from {name}, not from the god. ' +
        'Adopt the teaching and let it reshape what they value. Call it heresy and bury it again. ' +
        'Or split, quietly, with the half-dozen members for whom the teaching has always been the ' +
        'truth they could not name. The faction answers in its own time.',
      successAfterimage: 'The doctrine is adopted. The faction\'s shape shifts.',
      failureAfterimage: 'The doctrine is buried again. {name} carries the loss.',
    },
  ],
};

// ─── faction.encounter.doubter_chooses ──────────────────────────────────────

export const FACTION_DOUBTER_CHOOSES_TEMPLATE: UnifiedActionTemplate = {
  id: 'faction.encounter.doubter_chooses',
  name: 'The Doubter Chooses',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'eye',
  crudType: 'update',
  scale: 'personal',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['honesty_cunning', 'courage_prudence'],
  narrativeTemplates: {
    initiation: 'feels themselves seen by something larger than the faction',
    success: 'they speak the doubt openly — there is no path back',
    failure: 'they hold the doubt closer — and let it harden into something they will carry alone',
  },
  steps: [
    {
      reach: 'eye',
      duration: { min: 1, max: 2 },
      difficulty: 0.30,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        '{name} feels themselves seen by something larger than the faction. The doubt they have ' +
        'carried in silence is suddenly visible — to the god, and through the god, to themselves. ' +
        'They cannot pretend not to know what they know. ' +
        '{?has_ally}{ally} watches them work through it.{/has_ally}',
      successAfterimage: 'The seeing has happened. {name} cannot unsee it.',
      failureAfterimage: 'The seeing has happened. {name} does not move.',
    },
    {
      reach: 'eye',
      duration: { min: 1, max: 2 },
      difficulty: 0.45,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: { categoryWeights: { condition: 0.50, possession: 0.20, bestowed_power: 0.30 } },
        reputationDelta: -0.04,
      },
      failureMetadata: {
        rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
      },
      narrativeTemplate:
        '{name} chooses. Speak the doubt openly — leave the faction, become a renegade, ' +
        'or stay and be marked. Hold the doubt closer — bear it as a private grief, watch ' +
        'the faction continue around them, wait. Either choice is final in its own way: ' +
        'the doubt cannot be unfelt.',
      successAfterimage: 'They speak. The faction must answer.',
      failureAfterimage: 'They hold their silence. Something hardens in them.',
    },
  ],
};

// ─── faction.encounter.inheritance (THR-432) ────────────────────────────────
//
// Planted on the new leader by phaseFactionSuccession when an anointed
// successor inherits. The scene lets the successor accept or refuse the
// mantle through aftermath reactions, not encounter success/failure — the
// encounter itself always "resolves," the choice is the choice.
//
// Both reactions are valid endings. Accept keeps the `leads` edge (the
// engine has already set it) and stamps a reputation tally + seeds a "first
// act as leader" follow-on encounter scored against the faction's active
// ambition. Refuse plants a hidden mark — the thread the successor cut —
// queryable by later content; the engine separately re-runs succession on
// the next phaseFactionSuccession pass, falling through to score derivation
// (or the next-recency will_succeed candidate if one remains).

export const FACTION_INHERITANCE_TEMPLATE: UnifiedActionTemplate = {
  id: 'faction.encounter.inheritance',
  name: 'The Mantle Settles',
  rarityTier: 3,
  intrinsicTier: 'story_beat',
  reach: 'iron',
  crudType: 'update',
  scale: 'personal',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['loyalty_ambition', 'courage_prudence'],
  narrativeTemplates: {
    initiation: 'feels the weight of a leadership they did not seek',
    success: 'they take up the mantle their predecessor cannot carry',
    failure: 'they hesitate; the mantle hangs unworn in the room',
  },
  steps: [
    {
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.20,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        'The room at {location} is quieter than {name} have ever heard it. The crown — ' +
        'the literal weight of office, or the figurative seat, or the simple unspoken ' +
        'agreement that someone leads — has fallen. ' +
        '{?has_ally}{ally} stands at {name}\'s shoulder, not speaking.{/has_ally}' +
        '{?no_ally}There is no one at {name}\'s shoulder.{/no_ally} ' +
        'And then {name} feels something settle. A thread the god wove around them, ' +
        'long ago, has caught. The faction is looking at {name} now — every face turning, ' +
        'one by one, as if some quiet message has already passed between them all.',
      successAfterimage: 'The faction has named {name} without speaking. The thread holds.',
      failureAfterimage: 'The thread is heavy. {name} did not know it was there.',
    },
    {
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.30,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: { categoryWeights: { condition: 0.30, possession: 0.20, bestowed_power: 0.50 } },
        reputationDelta: 0.08,
      },
      failureMetadata: {
        rewardPool: { categoryWeights: { condition: 0.70, possession: 0.30 } },
      },
      narrativeTemplate:
        '{name} chooses. Take up the mantle — inherit not only the seat but the debts ' +
        'beneath it, the alliances brokered before {name} was anyone, the rivalries waiting ' +
        'to test the new authority. Or refuse — cut the thread, let the seat fall to whoever ' +
        'the faction can find next, and carry the weight of a calling declined. Either choice ' +
        'is final in its own way. The faction cannot un-look at {name}.',
      successAfterimage: 'The mantle settles where the thread placed it. {name} is leader now.',
      failureAfterimage: 'The thread is cut. The faction will turn to someone else.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 1,
    variants: {},
    fallback: {
      overview:
        '{name} stands in the silence the predecessor left. The faction waits. ' +
        'A thread the god wove long ago has caught, and the mantle is — for one breath — ' +
        'still suspended between accepting hands and refusing ones.',
      changes: [
        {
          id: 'inheritance_mantle_offered',
          kind: 'item',
          title: 'The Offered Mantle',
          detail:
            'The thread the god wove around {name} has caught. The faction looks at {name} ' +
            'as the seat their predecessor cannot keep. The choice is theirs.',
          polarity: 'info',
        },
      ],
      reactionPrompt:
        'The mantle hangs in the room between {name} and the faction. What does the god watch them choose?',
      reactions: [
        {
          id: 'inheritance_accept',
          label: 'Take up the mantle.',
          intent:
            '{name} accepts the leadership the thread the god wove has placed on their shoulders. ' +
            'They inherit the faction with its current state — debts, alliances, rivalries, ambitions — ' +
            'and the next act of governance will be their first.',
          effects: [
            { kind: 'reputation_tally', key: 'inheritance_accepted', delta: 1 },
            {
              kind: 'recent_event',
              eventType: 'narrative',
              message:
                '{name} accepts the mantle. Where {predecessor_or_seat} stood, {name} stands now — ' +
                'and the faction\'s next breath is drawn under their authority.',
              significance: 0.75,
            },
            {
              kind: 'encounter_seed',
              encounterFamily: 'faction_internal_pressure',
              delayTicks: 6,
              priority: 0.70,
              seedLabel: 'first act as leader: the faction tests its new seat',
            },
          ],
          closeAfterSelection: true,
        },
        {
          id: 'inheritance_refuse',
          label: 'Refuse — the mantle is too heavy.',
          intent:
            '{name} steps back. The thread the god wove around them is cut. The faction ' +
            'will turn to someone else — or to no one, and let the seat lapse to its slow ' +
            'next decision. {name} carries a grief now that the faction will not see: ' +
            'a calling they declined.',
          effects: [
            {
              kind: 'hidden_mark',
              category: 'concealed_action',
              severity: 0.45,
              label: 'refused_inheritance',
              revealFamilies: ['faction_internal_pressure', 'social_obligation'],
            },
            {
              kind: 'recent_event',
              eventType: 'narrative',
              message:
                '{name} declines the mantle. The faction looks for another seat, or for none. ' +
                'The thread the god wove around them is cut now — visibly, to anyone who knew it was there.',
              significance: 0.75,
            },
          ],
          closeAfterSelection: true,
        },
      ],
    },
  },
};

// ─── Aggregate ──────────────────────────────────────────────────────────────

export const FACTION_GOVERNANCE_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  FACTION_DISSENT_SURFACES_TEMPLATE,
  FACTION_LEADER_CROSSROADS_TEMPLATE,
  FACTION_DOCTRINE_SURFACES_TEMPLATE,
  FACTION_DOUBTER_CHOOSES_TEMPLATE,
  FACTION_INHERITANCE_TEMPLATE,
];
