/**
 * THR-1643 — the Agent Thread cards write a thread the attention system can see.
 *
 * `bind_thread_agent` and `bind_thread_agent_strong` used to write the `thread`
 * edge with `courtPosition: null`. `resolveEffectiveTier` and `phaseAttention`
 * both read a missing position as "skip", so a player who paid essence to thread
 * a mortal got a thread the curation layer never looked at — while the map drew
 * the same thread as 'watched'. The fix stamps 'watched', the attention model's
 * entry tier, so engine and map agree.
 *
 * Built through the real template ops and the real executor chokepoint, so a
 * regression in either the template row or the op path turns this red.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps } from '../graphOpExecutor';
import { resolveEffectiveTier } from '../attentionTier';
import { THREAD_CREATION_TEMPLATES } from '../../data/unified-action-templates';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { CourtPosition } from '../../types/influence';

/**
 * The god already holds a First. Since THR-1644 (D3) a thread written while
 * the god holds none makes that mortal The First — that route is pinned in
 * `threadingRite.thr1644.test.ts`; this file pins the card's own position.
 */
function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'first', type: 'actor', name: 'Ilse', properties: { actorType: 'individual' } });
  g.addEdge({ id: 'edge_thread_asc_first', source: 'asc', target: 'first', type: 'thread', properties: { courtPosition: 'the_first' } });
  g.addNode({ id: 'mortal', type: 'actor', name: 'Wren', properties: { actorType: 'individual' } });
  return g;
}

function threadMortalWith(templateId: string): CourtPosition | null {
  const template = THREAD_CREATION_TEMPLATES.find(t => t.id === templateId);
  expect(template, `template ${templateId} exists`).toBeDefined();
  const step = template!.steps[0];
  if (isActionStepBranch(step)) throw new Error(`${templateId} step 0 is a branch`);
  const g = makeGraph();
  const result = executeGraphOps(g, [...step.onSuccess], {
    actorId: 'asc',
    targetId: 'mortal',
    locationId: 'mortal',
    tick: 3,
  });
  expect(result.allSucceeded).toBe(true);
  const edge = g.getOutgoingEdges('asc', 'thread').find(e => e.target === 'mortal');
  expect(edge, 'thread edge written').toBeDefined();
  return (edge!.properties.courtPosition as CourtPosition | null) ?? null;
}

describe('THR-1643 — Agent Thread stamps a court position', () => {
  it.each(['bind_thread_agent', 'bind_thread_agent_strong'])(
    '%s writes courtPosition "watched" and is visible to attention',
    (templateId) => {
      const position = threadMortalWith(templateId);
      expect(position).toBe('watched');
      // A story-beat encounter reaches the curation layer as shaping; nothing reads invisible.
      expect(resolveEffectiveTier('story_beat', position)).toBe('shaping');
      for (const tier of ['background', 'shaping', 'story_beat'] as const) {
        expect(resolveEffectiveTier(tier, position)).not.toBe('invisible');
      }
    },
  );
});
