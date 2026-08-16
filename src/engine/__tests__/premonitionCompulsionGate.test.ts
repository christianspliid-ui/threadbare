/**
 * THR-1137 — Compulsion re-fire suppression.
 *
 * The shipped bug: an eligible agent was offered a brand-new Compulsion every
 * single tick, forever, because nothing the player did wrote state the emitter
 * read. These tests pin the gate that stops it.
 */

import { describe, it, expect } from 'vitest';
import { shouldEmitCompulsion } from '../premonitionCompulsion';
import { COMPULSION_COOLDOWN_TICKS } from '../../data/premonition-constants';
import type { GraphNode } from '../../types/graph';
import type { PremonitionEvent } from '../../types/premonition';

function agent(props: Record<string, unknown> = {}): GraphNode {
  return {
    id: 'actor_kael',
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual', ...props },
  } as unknown as GraphNode;
}

function premonition(agentId: string, eligibleUntilTick: number): PremonitionEvent {
  return { id: `p_${agentId}_${eligibleUntilTick}`, agentId, eligibleUntilTick } as unknown as PremonitionEvent;
}

describe('shouldEmitCompulsion', () => {
  it('offers a compulsion to an agent who has never had one', () => {
    expect(shouldEmitCompulsion(agent(), 40, [], [])).toBe(true);
  });

  it('refuses while that agent already has a live premonition queued', () => {
    const queued = [premonition('actor_kael', 45)];
    expect(shouldEmitCompulsion(agent(), 40, queued, [])).toBe(false);
  });

  it('ignores another agent\'s queued premonition', () => {
    const queued = [premonition('actor_someone_else', 45)];
    expect(shouldEmitCompulsion(agent(), 40, queued, [])).toBe(true);
  });

  it('refuses a second emission inside the same tick', () => {
    const thisTick = [premonition('actor_kael', 53)];
    expect(shouldEmitCompulsion(agent(), 40, [], thisTick)).toBe(false);
  });

  it('is not blocked by a queue entry that has already expired', () => {
    // eligibleUntilTick 39 < tick 40 — the phase drops it at the end of this tick,
    // so it must not hold the gate shut on its way out.
    const stale = [premonition('actor_kael', 39)];
    expect(shouldEmitCompulsion(agent({ lastCompulsionTick: undefined }), 40, stale, [])).toBe(true);
  });

  describe('cooldown after an offer', () => {
    // The pre-fix behaviour these three falsify: a fresh event on the very next
    // tick, regardless of what the player did with the last one.
    it('refuses on the very next tick after an offer', () => {
      expect(shouldEmitCompulsion(agent({ lastCompulsionTick: 40 }), 41, [], [])).toBe(false);
    });

    it('refuses one tick short of the full cooldown', () => {
      const tick = 40 + COMPULSION_COOLDOWN_TICKS - 1;
      expect(shouldEmitCompulsion(agent({ lastCompulsionTick: 40 }), tick, [], [])).toBe(false);
    });

    it('offers again once the cooldown has fully elapsed', () => {
      const tick = 40 + COMPULSION_COOLDOWN_TICKS;
      expect(shouldEmitCompulsion(agent({ lastCompulsionTick: 40 }), tick, [], [])).toBe(true);
    });

    it('holds across the whole window — no tick in it emits', () => {
      const emitted = [];
      for (let tick = 41; tick < 40 + COMPULSION_COOLDOWN_TICKS; tick++) {
        if (shouldEmitCompulsion(agent({ lastCompulsionTick: 40 }), tick, [], [])) emitted.push(tick);
      }
      expect(emitted).toEqual([]);
    });
  });

  it('the stamp is written at emission, so all three endings are covered', () => {
    // Chosen, dismissed and expired differ only in what the UI did with the
    // event — none of them writes lastCompulsionTick, and none needs to.
    const stamped = agent({ lastCompulsionTick: 40 });
    expect(shouldEmitCompulsion(stamped, 41, [], [])).toBe(false); // chosen
    expect(shouldEmitCompulsion(stamped, 44, [], [])).toBe(false); // dismissed
    expect(shouldEmitCompulsion(stamped, 54, [], [])).toBe(false); // expired
  });
});
