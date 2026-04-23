import type { Composition } from '../schema';

export const CHAIN_WEAKENS_EVENT_RECIPE: Composition = {
  id: 'the-chain-weakens',
  kind: 'event',
  preconditions: [
    {
      predicate: { op: 'has-agent-of-archetype', archetype: 'azath_warden', count: { gte: 1 } },
      strength: 'hard',
      rationale: 'An Azath warden must exist for the chain to threaten.',
    },
    {
      predicate: { op: 'doom-clock', comparator: 'gte', tier: 1 },
      strength: 'medium',
      rationale: 'Event ignites only when doom has begun to accumulate.',
    },
  ],
  nodes: {
    azath: {
      tier: 'essential',
      resolve: {
        type: 'find-rename-create',
        find: { op: 'has-tag', axis: 'archetype', value: 'azath_prison' },
        mark: {
          rename: 'The Weakening Chain',
          promoteClass: 'threaded',
          statedAttributes: [{ field: 'name', value: 'The Weakening Chain' }],
        },
        create: {
          kind: 'location',
          tags: { archetype: ['azath_prison'], sphere: ['void'] },
          proceduralFill: true,
        },
      },
    },
    chainWarden: {
      tier: 'essential',
      resolve: {
        type: 'find-rename-create',
        find: { op: 'has-tag', axis: 'archetype', value: 'azath_warden' },
        mark: {
          addEdges: [{ edgeType: 'guards', toNodeKey: 'azath' }],
        },
        create: {
          kind: 'agent',
          tags: { archetype: ['azath_warden'], sphere: ['void'] },
          initialEdges: [{ edgeType: 'guards', toNodeKey: 'azath' }],
          proceduralFill: true,
        },
      },
    },
    plagueBringer: {
      tier: 'essential',
      resolve: {
        type: 'find-rename-create',
        find: { op: 'has-tag', axis: 'archetype', value: 'plague_herald' },
        create: {
          kind: 'agent',
          tags: { archetype: ['plague_herald'], sphere: ['void'] },
          proceduralFill: true,
        },
        allowCreate: true,
      },
    },
    shieldAnvil: {
      tier: 'essential',
      resolve: {
        type: 'find-rename-create',
        find: { op: 'has-tag', axis: 'archetype', value: 'divine_champion' },
        create: {
          kind: 'agent',
          tags: { archetype: ['divine_champion'], sphere: ['order'] },
          proceduralFill: true,
        },
        allowCreate: true,
      },
    },
    rumorMandate: {
      tier: 'flavor',
      resolve: {
        type: 'find-rename-create',
        find: { op: 'has-tag', axis: 'archetype', value: 'whisper_mandate' },
        create: {
          kind: 'encounter',
          tags: { archetype: ['whisper_mandate'], sphere: ['void'] },
          proceduralFill: true,
        },
        allowCreate: true,
      },
    },
    crackedGlyph: {
      tier: 'atmospheric',
      resolve: {
        type: 'find-rename-create',
        find: { op: 'has-tag', axis: 'archetype', value: 'azath_glyph' },
        create: {
          kind: 'location',
          tags: { archetype: ['azath_glyph'], sphere: ['void'] },
          proceduralFill: true,
        },
        allowCreate: true,
      },
    },
  },
  phases: [
    {
      id: 'phase-1-rumor',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 1 },
      activates: ['rumorMandate'],
      storyBeat: {
        tier: 'notable',
        template: 'story-beat.chain-weakens-rumor',
        priority: 'doom_clock',
        voice: 'divine',
      },
      rationale: 'Rumor-level mandate introduces the event to the ascendant at tier 1.',
    },
    {
      id: 'phase-2-plague',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 2 },
      activates: ['plagueBringer'],
      effects: [{ op: 'set-world-flag', key: 'chain-weakens.plague-materialized', value: true }],
      storyBeat: {
        tier: 'story_beat',
        template: 'story-beat.chain-weakens-plague-bringer',
        priority: 'doom_clock',
        voice: 'divine',
      },
      rationale: 'Plague-bringer materializes — the event becomes concrete.',
    },
    {
      id: 'phase-3-absorbing',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 3 },
      activates: ['shieldAnvil'],
      storyBeat: {
        tier: 'story_beat',
        template: 'story-beat.chain-weakens-shield-anvil',
        priority: 'doom_clock',
        voice: 'mortal',
      },
      rationale: 'Shield-Anvil begins absorbing; a counter-force rises.',
    },
    {
      id: 'phase-4-crack',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 4 },
      activates: ['crackedGlyph'],
      effects: [
        { op: 'advance-doom-clock', by: 1 },
        { op: 'mark-composition-fired', id: 'the-chain-weakens' },
      ],
      storyBeat: {
        tier: 'story_beat',
        template: 'story-beat.chain-weakens-azath-cracks',
        priority: 'doom_clock',
        voice: 'divine',
      },
      rationale: 'Azath structurally cracks — climax of the event.',
    },
    {
      // Conditional phases. A phase's activatesAt can reference state other phases have produced.
      // This lets you gate a beat on "did something prior happen?" without hardcoding phase ordering.
      // Use world-flag for cross-phase and cross-recipe flags.
      // Use has-faction-of-archetype / has-agent-of-archetype to gate on presence of actors.
      // Use and / or / not to compose.
      id: 'phase-5-reckoning',
      activatesAt: {
        op: 'and',
        terms: [
          { op: 'doom-clock', comparator: 'gte', tier: 4 },
          { op: 'world-flag', key: 'chain-weakens.plague-materialized', value: true },
          { op: 'has-faction-of-archetype', archetype: 'divine_champion_order', count: { gte: 1 } },
        ],
      },
      activates: [],
      storyBeat: {
        tier: 'story_beat',
        template: 'story-beat.chain-weakens-reckoning',
        priority: 'doom_clock',
        voice: 'mortal',
      },
      rationale:
        'After the Azath cracks, if the plague materialized AND an aligned order survived to witness it, a reckoning beat fires. Exercises world-flag + has-faction-of-archetype predicates.',
    },
  ],
  effects: [{ op: 'mark-composition-fired', id: 'the-chain-weakens' }],
  metadata: {
    author: 'cowork-thr-225',
    createdAt: '2026-04-23',
    tags: ['doom-event', 'saga', 'azath', 'void'],
  },
};
