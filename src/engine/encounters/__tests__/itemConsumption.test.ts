import { describe, expect, it, vi } from 'vitest';
import { consumeItemForChoice } from '../itemConsumption';
import { WorldGraph } from '../../graph';

const CTX = { encounterId: 'enc-1', beatIndex: 0, tick: 10 };

function makeGraph(agentId: string, itemId?: string): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: agentId, type: 'actor', properties: {} });
  if (itemId) {
    g.addNode({ id: itemId, type: 'artifact', properties: {} });
    g.addEdge({ id: `${agentId}-possesses-${itemId}`, type: 'possesses', source: agentId, target: itemId, properties: {} });
  }
  return g;
}

describe('consumeItemForChoice', () => {
  describe('happy path', () => {
    it('returns consumed=true when the possesses edge exists', () => {
      const g = makeGraph('agt', 'item-1');
      const result = consumeItemForChoice(g, 'agt', 'item-1', CTX);
      expect(result.consumed).toBe(true);
    });

    it('removes the possesses edge from the graph', () => {
      const g = makeGraph('agt', 'item-1');
      consumeItemForChoice(g, 'agt', 'item-1', CTX);
      expect(g.getOutgoingEdges('agt', 'possesses')).toHaveLength(0);
    });

    it('emits a trace with correct fields', () => {
      const g = makeGraph('agt', 'item-1');
      const { trace } = consumeItemForChoice(g, 'agt', 'item-1', CTX);
      expect(trace).not.toBeNull();
      expect(trace!.category).toBe('item_consumed_by_choice');
      expect(trace!.agentId).toBe('agt');
      expect(trace!.itemId).toBe('item-1');
      expect(trace!.encounterId).toBe('enc-1');
      expect(trace!.beatIndex).toBe(0);
      expect(trace!.tick).toBe(10);
    });
  });

  describe('fail-soft: missing item', () => {
    it('returns consumed=false when agent has no possesses edges', () => {
      const g = makeGraph('agt'); // no item
      const result = consumeItemForChoice(g, 'agt', 'item-ghost', CTX);
      expect(result.consumed).toBe(false);
    });

    it('returns trace=null when item is absent', () => {
      const g = makeGraph('agt');
      const { trace } = consumeItemForChoice(g, 'agt', 'item-ghost', CTX);
      expect(trace).toBeNull();
    });

    it('emits a console.warn when item is absent', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const g = makeGraph('agt');
      consumeItemForChoice(g, 'agt', 'item-ghost', CTX);
      expect(warn).toHaveBeenCalledOnce();
      warn.mockRestore();
    });

    it('does not throw when item is absent (fail-soft)', () => {
      const g = makeGraph('agt');
      expect(() => consumeItemForChoice(g, 'agt', 'item-ghost', CTX)).not.toThrow();
    });

    it('does not remove any other edges when item is absent', () => {
      const g = makeGraph('agt', 'item-real');
      consumeItemForChoice(g, 'agt', 'item-ghost', CTX);
      expect(g.getOutgoingEdges('agt', 'possesses')).toHaveLength(1);
    });
  });
});
