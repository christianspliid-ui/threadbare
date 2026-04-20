import { describe, expect, it } from 'vitest';

import type { Composition, FindRenameCreateResolve } from '../schema';
import { resolveFindCard, type WorldSnapshot } from '../findCard';

const BASE_RECIPE: Composition = {
  id: 'test-find-card-recipe',
  kind: 'event',
  preconditions: [],
  nodes: {},
  metadata: {
    author: 'codex',
    createdAt: '2026-04-20',
    tags: ['event', 'test-intent'],
  },
};

function buildSpec(overrides: Partial<FindRenameCreateResolve> = {}): FindRenameCreateResolve {
  return {
    type: 'find-rename-create',
    find: { op: 'has-tag', axis: 'archetype', value: 'merchant_agent' },
    create: {
      kind: 'agent',
      tags: {
        archetype: ['merchant_agent'],
        reach: ['order'],
      },
      initialEdges: [{ edgeType: 'serves', toNodeKey: 'consortiumCouncil' }],
      proceduralFill: true,
    },
    ...overrides,
  };
}

describe('resolveFindCard', () => {
  it('returns FOUND_AND_MARKED with deterministic tie-break ordering', () => {
    const world: WorldSnapshot = {
      nodes: [
        {
          id: 'agent.promoted-a',
          kind: 'agent',
          class: 'promoted',
          tags: { archetype: ['merchant_agent'] },
        },
        {
          id: 'agent.generic-b',
          kind: 'agent',
          class: 'generic',
          tags: { archetype: ['merchant_agent'] },
        },
        {
          id: 'agent.generic-a',
          kind: 'agent',
          class: 'generic',
          tags: { archetype: ['merchant_agent'] },
        },
      ],
    };

    const spec = buildSpec({
      mark: {
        rename: 'Guild Factor',
        promoteClass: 'promoted',
      },
    });
    const sharedCache = new Map<string, boolean>();

    const first = resolveFindCard('guildFactor', spec, world, BASE_RECIPE, { filterCache: sharedCache });
    const second = resolveFindCard('guildFactor', spec, world, BASE_RECIPE, { filterCache: sharedCache });

    expect(first.outcome).toBe('FOUND_AND_MARKED');
    expect(first.selectedNodeId).toBe('agent.generic-a');
    expect(first.candidateIds).toEqual(['agent.generic-a', 'agent.generic-b', 'agent.promoted-a']);
    expect(first.mutationPreview?.rename).toBe('Guild Factor');
    expect(first.log.outcome).toBe('FOUND_AND_MARKED');
    expect(first.log.mutationsApplied?.rename).toBe('Guild Factor');

    expect(second.selectedNodeId).toBe(first.selectedNodeId);
    expect(sharedCache.size).toBeGreaterThan(0);
  });

  it('returns CREATED when no candidate matches and allowCreate is true', () => {
    const world: WorldSnapshot = {
      nodes: [
        {
          id: 'location.other',
          kind: 'location',
          class: 'generic',
          tags: { archetype: ['wizard_tower'] },
        },
      ],
    };

    const result = resolveFindCard('omenBroker', buildSpec(), world, BASE_RECIPE);

    expect(result.outcome).toBe('CREATED');
    expect(result.creationPreview?.source).toBe('find-rename-create-fallback');
    expect(result.creationPreview?.createdId).toBe('test-find-card-recipe:omenBroker:created');
    expect(result.log.createdId).toBe('test-find-card-recipe:omenBroker:created');
  });

  it('returns HARD_FAILED when no candidate matches and allowCreate is false', () => {
    const world: WorldSnapshot = { nodes: [] };

    const result = resolveFindCard(
      'fortuneChorus',
      buildSpec({
        allowCreate: false,
      }),
      world,
      BASE_RECIPE
    );

    expect(result.outcome).toBe('HARD_FAILED');
    expect(result.message).toContain('allowCreate=false');
    expect(result.log.outcome).toBe('HARD_FAILED');
  });

  it('returns FOUND_BUT_REJECTED and does not apply partial mutation changes', () => {
    const world: WorldSnapshot = {
      nodes: [
        {
          id: 'location.wizard-tower-ash',
          kind: 'location',
          class: 'promoted',
          tags: { archetype: ['merchant_agent'] },
          props: { mutatingPromotedWithoutRespect: true },
        },
      ],
    };

    const result = resolveFindCard(
      'wizardTower',
      buildSpec({
        mark: {
          rename: 'Tower of Measured Fortune',
          promoteClass: 'threaded',
          addEdges: [{ edgeType: 'advises', toNodeKey: 'consortiumCouncil' }],
        },
      }),
      world,
      BASE_RECIPE
    );

    expect(result.outcome).toBe('FOUND_BUT_REJECTED');
    expect(result.creationPreview?.source).toBe('find-rename-create-rejected-fallback');
    expect(result.rejectionReasons?.length).toBeGreaterThan(0);
    expect(result.mutationPreview).toBeUndefined();
    expect(result.log.mutationsApplied).toBeUndefined();
  });
});
