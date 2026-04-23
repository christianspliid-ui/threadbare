import type { Composition } from '../schema';

export const WINNOWING_OF_LUCK_EVENT_RECIPE: Composition = {
  id: 'the-winnowing-of-luck',
  kind: 'event',
  preconditions: [
    {
      predicate: {
        op: 'composition-fired',
        id: 'merchant-consortium-court',
      },
      strength: 'hard',
      rationale: 'This event is a sequel to the consortium composition.',
    },
    {
      predicate: {
        op: 'has-faction-of-archetype',
        archetype: 'merchant_consortium',
        count: { gte: 1 },
      },
      strength: 'medium',
      rationale: 'Consortium presence is required but can be bootstrapped by creation paths.',
    },
    {
      predicate: {
        op: 'world-flag',
        key: 'omens.luck-thinning',
        value: true,
      },
      strength: 'soft',
      rationale: 'If no omen flag exists, event still fires in a quieter form.',
    },
  ],
  nodes: {
    consortiumCouncil: {
      tier: 'essential',
      resolve: {
        type: 'literal',
        ref: { kind: 'faction', id: 'faction.merchant-consortium' },
      },
    },
    wizardTower: {
      tier: 'essential',
      resolve: {
        type: 'find-rename-create',
        find: {
          op: 'and',
          terms: [
            { op: 'has-tag', axis: 'archetype', value: 'wizard_tower' },
            { op: 'node-class', class: 'generic' },
          ],
        },
        mark: {
          rename: 'Tower of Measured Fortune',
          promoteClass: 'promoted',
          statedAttributes: [{ field: 'name', value: 'Tower of Measured Fortune' }],
          addEdges: [{ edgeType: 'advises', toNodeKey: 'consortiumCouncil' }],
        },
        create: {
          kind: 'location',
          tags: {
            archetype: ['wizard_tower'],
            reach: ['order'],
            sphere: ['mind'],
          },
          initialEdges: [{ edgeType: 'advises', toNodeKey: 'consortiumCouncil' }],
          proceduralFill: true,
        },
      },
    },
    luckStone: {
      tier: 'essential',
      resolve: {
        type: 'find-rename-create',
        find: {
          op: 'has-tag',
          axis: 'archetype',
          value: 'luck_stone',
        },
        mark: {
          rename: 'Salt-Cracked Luck Stone',
          statedAttributes: [{ field: 'name', value: 'Salt-Cracked Luck Stone' }],
          addEdges: [{ edgeType: 'housed-in', toNodeKey: 'wizardTower' }],
        },
        create: {
          kind: 'artifact',
          tags: {
            archetype: ['luck_stone'],
            sphere: ['spirit'],
          },
          initialEdges: [{ edgeType: 'housed-in', toNodeKey: 'wizardTower' }],
          proceduralFill: true,
        },
      },
    },
    tradeWar: {
      tier: 'essential',
      resolve: {
        type: 'procedural',
        generator: 'generate-trade-war',
        constraints: {
          op: 'and',
          terms: [
            { op: 'has-tag', axis: 'sphere', value: 'gold' },
            { op: 'has-tag', axis: 'reach', value: 'order' },
          ],
        },
      },
    },
    displacedTribe: {
      tier: 'flavor',
      resolve: {
        type: 'procedural',
        generator: 'generate-displaced-tribe',
        constraints: {
          op: 'has-tag',
          axis: 'archetype',
          value: 'barbarian_tribe',
        },
      },
    },
    omenBroker: {
      tier: 'flavor',
      resolve: {
        type: 'find-rename-create',
        find: {
          op: 'has-tag',
          axis: 'archetype',
          value: 'omen_broker',
        },
        create: {
          kind: 'agent',
          tags: {
            archetype: ['omen_broker'],
            reach: ['order'],
            sphere: ['spirit'],
          },
          initialEdges: [{ edgeType: 'brokers', toNodeKey: 'tradeWar' }],
          proceduralFill: true,
        },
      },
    },
    tariffRiots: {
      tier: 'atmospheric',
      resolve: {
        type: 'procedural',
        generator: 'generate-tariff-riots',
        constraints: {
          op: 'has-tag',
          axis: 'sphere',
          value: 'gold',
        },
      },
    },
    crackedLedgerRumor: {
      tier: 'atmospheric',
      resolve: {
        type: 'literal',
        ref: { kind: 'encounter', id: 'encounter.cracked-ledger-rumor' },
      },
    },
    fortuneChorus: {
      tier: 'atmospheric',
      resolve: {
        type: 'find-rename-create',
        find: {
          op: 'has-tag',
          axis: 'archetype',
          value: 'fortune_chorus',
        },
        allowCreate: false,
        create: {
          kind: 'encounter',
          tags: {
            archetype: ['fortune_chorus'],
            sphere: ['spirit'],
          },
          proceduralFill: true,
        },
      },
    },
  },
  phases: [
    {
      id: 'phase-1-thinning',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 1 },
      activates: ['crackedLedgerRumor', 'tariffRiots'],
      storyBeat: {
        tier: 'notable',
        template: 'story-beat.winnowing-luck-thinning',
        priority: 'doom_clock',
      },
      rationale: 'Luck thins at the edges — first rumors and unrest.',
    },
    {
      id: 'phase-2-broker',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 2 },
      activates: ['omenBroker'],
      storyBeat: {
        tier: 'notable',
        template: 'story-beat.winnowing-omen-broker',
        priority: 'doom_clock',
      },
      rationale: 'Omen broker emerges as luck-trade intensifies.',
    },
    {
      id: 'phase-3-displacement',
      activatesAt: { op: 'doom-clock', comparator: 'gte', tier: 3 },
      activates: ['displacedTribe', 'fortuneChorus'],
      effects: [{ op: 'set-world-flag', key: 'events.winnowing-active', value: true }],
      storyBeat: {
        tier: 'story_beat',
        template: 'story-beat.winnowing-displacement',
        priority: 'doom_clock',
      },
      rationale: 'Displacement and fortune-chorus signal full winnowing.',
    },
  ],
  effects: [
    { op: 'advance-doom-clock', by: 1 },
    { op: 'set-world-flag', key: 'events.winnowing-active', value: true },
    { op: 'mark-composition-fired', id: 'the-winnowing-of-luck' },
  ],
  metadata: {
    author: 'codex',
    createdAt: '2026-04-20',
    tags: ['event', 'winnowing', 'merchant_consortium', 'luck'],
  },
};
