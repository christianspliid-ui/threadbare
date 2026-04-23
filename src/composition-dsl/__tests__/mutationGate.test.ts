import { describe, expect, it } from 'vitest';

import {
  checkTripwire,
  evaluateMutabilityGate,
  mutateNode,
  promoteIfGeneric,
  type MutationContext,
} from '../mutationGate';
import type { WorldNode } from '../worldTypes';

const BASE_CONTEXT: MutationContext = {
  recipeId: 'test-recipe',
  firedAt: '2026-04-20T00:00:00Z',
};

function buildNode(overrides: Partial<WorldNode> = {}): WorldNode {
  return {
    id: 'node.test',
    kind: 'agent',
    nodeClass: 'generic',
    class: 'generic',
    ...overrides,
  };
}

describe('mutability gate', () => {
  it('covers gate combinations across nodeClass and context flags', () => {
    const nodeClasses: Array<WorldNode['nodeClass']> = ['generic', 'promoted', 'threaded'];
    const promotedFlags = [false, true];
    const ownershipFlags = [false, true];

    for (const nodeClass of nodeClasses) {
      for (const respectsPromoted of promotedFlags) {
        for (const ownsThread of ownershipFlags) {
          const node = buildNode({ id: `node-${nodeClass}`, nodeClass, class: nodeClass });
          const context: MutationContext = {
            ...BASE_CONTEXT,
            respectsPromoted,
            ownsThreads: ownsThread ? [node.id] : [],
          };

          const decision = evaluateMutabilityGate(node, context);
          if (nodeClass === 'generic') {
            expect(decision.ok).toBe(true);
            continue;
          }

          if (nodeClass === 'promoted') {
            expect(decision.ok).toBe(respectsPromoted);
            continue;
          }

          expect(decision.ok).toBe(ownsThread);
        }
      }
    }
  });

  it('enforces one-way class transitions', () => {
    const genericNode = buildNode({ nodeClass: 'generic', class: 'generic' });
    const promotedNode = buildNode({ nodeClass: 'promoted', class: 'promoted' });
    const threadedNode = buildNode({ nodeClass: 'threaded', class: 'threaded' });

    const genericToPromoted = mutateNode(
      genericNode,
      { setNodeClass: 'promoted' },
      BASE_CONTEXT
    );
    expect(genericToPromoted.ok).toBe(true);

    const genericToThreaded = mutateNode(
      genericNode,
      { setNodeClass: 'threaded' },
      BASE_CONTEXT
    );
    expect(genericToThreaded.ok).toBe(false);

    const promotedToThreaded = mutateNode(
      promotedNode,
      { setNodeClass: 'threaded' },
      { ...BASE_CONTEXT, respectsPromoted: true }
    );
    expect(promotedToThreaded.ok).toBe(true);

    const threadedToGeneric = mutateNode(
      threadedNode,
      { setNodeClass: 'generic' },
      { ...BASE_CONTEXT, ownsThreads: [threadedNode.id] }
    );
    expect(threadedToGeneric.ok).toBe(false);
  });
});

describe('stated-attribute tripwire', () => {
  it('rejects contradictory writes to stated attributes', () => {
    const node = buildNode({
      name: 'Aine',
      statedAttributes: [
        {
          field: 'name',
          value: 'Aine',
          source: { recipeId: 'seed', firedAt: '2026-04-19T00:00:00Z' },
        },
      ],
    });
    const result = mutateNode(
      node,
      { rename: 'Gus' },
      BASE_CONTEXT
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toContain('Tripwire conflict');
    }
  });

  it('allows additive array changes for stated attributes', () => {
    const node = buildNode({
      statedAttributes: [
        {
          field: 'allies',
          value: ['one'],
          source: { recipeId: 'seed', firedAt: '2026-04-19T00:00:00Z' },
        },
      ],
      props: {
        allies: ['one'],
      },
    });

    const decision = checkTripwire(
      node,
      { allies: ['one', 'two'] },
      BASE_CONTEXT
    );
    expect(decision.ok).toBe(true);
  });

  it('allows override only when rationale is provided', () => {
    const node = buildNode({
      statedAttributes: [
        {
          field: 'leaderName',
          value: 'Aine',
          source: { recipeId: 'seed', firedAt: '2026-04-19T00:00:00Z' },
        },
      ],
      props: {
        leaderName: 'Aine',
      },
    });

    const blocked = mutateNode(
      node,
      { setProps: { leaderName: 'Gus' } },
      { ...BASE_CONTEXT, overrideTripwire: true }
    );
    expect(blocked.ok).toBe(false);

    const allowed = mutateNode(
      node,
      { setProps: { leaderName: 'Gus' } },
      {
        ...BASE_CONTEXT,
        overrideTripwire: true,
        overrideRationale: 'hand-authored retcon for campaign reset',
      }
    );
    expect(allowed.ok).toBe(true);
  });
});

describe('promoteIfGeneric', () => {
  it('promotes surfaced generic nodes and records stated name attribute', () => {
    const node = buildNode({ name: 'Guild Factor' });
    const promoted = promoteIfGeneric(node, {
      recipeId: 'the-winnowing-of-luck',
      surfacedAt: '2026-04-20T00:00:00Z',
      reason: 'render:guildFactor',
    });

    expect(promoted.promoted).toBe(true);
    expect(promoted.node.nodeClass).toBe('promoted');
    expect(promoted.node.statedAttributes?.some((entry) => entry.field === 'name')).toBe(true);
  });
});
