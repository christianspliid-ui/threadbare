import type { Composition } from '../schema';

export const MERCHANT_CONSORTIUM_FACTION_RECIPE: Composition = {
  id: 'merchant-consortium-court',
  kind: 'faction',
  preconditions: [
    {
      predicate: {
        op: 'has-faction-of-archetype',
        archetype: 'merchant_consortium',
        count: { gte: 1 },
      },
      strength: 'medium',
      rationale: 'Anchor faction should usually exist, but medium allows bootstrap creation behavior.',
    },
  ],
  nodes: {
    patronFaction: {
      tier: 'essential',
      resolve: {
        type: 'literal',
        ref: { kind: 'faction', id: 'faction.merchant-consortium' },
      },
    },
    guildFactor: {
      tier: 'essential',
      resolve: {
        type: 'find-rename-create',
        find: {
          op: 'and',
          terms: [
            { op: 'has-tag', axis: 'archetype', value: 'merchant_agent' },
            { op: 'node-class', class: 'generic' },
          ],
        },
        mark: {
          rename: 'Guild Factor',
          promoteClass: 'promoted',
          addEdges: [{ edgeType: 'serves', toNodeKey: 'patronFaction' }],
        },
        create: {
          kind: 'agent',
          tags: {
            archetype: ['merchant_agent'],
            reach: ['order'],
            sphere: ['gold'],
          },
          initialEdges: [{ edgeType: 'serves', toNodeKey: 'patronFaction' }],
          proceduralFill: true,
        },
      },
    },
    tariffScribes: {
      tier: 'flavor',
      resolve: {
        type: 'procedural',
        generator: 'generate-tariff-scribes',
        constraints: {
          op: 'has-tag',
          axis: 'sphere',
          value: 'gold',
        },
      },
    },
    marketWhispers: {
      tier: 'atmospheric',
      resolve: {
        type: 'find-rename-create',
        find: {
          op: 'has-tag',
          axis: 'archetype',
          value: 'market-gossip',
        },
        allowCreate: false,
        create: {
          kind: 'encounter',
          tags: {
            archetype: ['market-gossip'],
            sphere: ['gold'],
          },
          proceduralFill: true,
        },
      },
    },
  },
  effects: [{ op: 'mark-composition-fired', id: 'merchant-consortium-court' }],
  metadata: {
    author: 'codex',
    createdAt: '2026-04-20',
    tags: ['faction', 'gold', 'merchant_consortium'],
  },
};
