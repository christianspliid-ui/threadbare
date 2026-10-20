/**
 * THR-1986 (plan `2026-10-18-thr-1980-words-teach-themselves.md` E4) — the
 * Chronicle tells growth only about mortals the god holds a thread to, and in
 * words: no tier number, no `Q`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { phaseNarrative, resetEventCounter } from '../orchestrator';
import { buildTierUpProse, shouldSkipForChronicle } from '../chronicleGrowth';
import { WorldGraph } from '../graph';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import type { GameState, TickEvent } from '../../types/gameState';

function makeState(threaded: boolean): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'vara', type: 'actor', name: 'Vara', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'stranger', type: 'actor', name: 'Oren', properties: { actorType: 'individual' } });
  if (threaded) {
    graph.addEdge({ id: 't1', type: 'thread', source: 'asc', target: 'vara', properties: {} });
  }
  return { graph, ascendantId: 'asc', tickEvents: [], chronicleEntries: [], tick: 7 } as unknown as GameState;
}

function tierUp(actorId: string, name: string): TickEvent {
  return {
    id: `te-${actorId}`,
    tick: 7,
    type: 'tier_promotion',
    message: `${name} reached shadow tier 6: "Shadow Master"`,
    significance: 0.8,
    actorId,
    chronicleGate: 'threaded_only',
    playerProse: `${name} is now subtle in Shadow and is called Shadow Master.`,
  };
}

beforeEach(() => {
  resetEventCounter();
  clearTraces();
  enableTracing();
});
afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('Chronicle growth gate (THR-1986 E4)', () => {
  it('a stranger\'s tier-up writes no Chronicle entry and traces chronicle.intake.skipped', () => {
    const state = makeState(true);
    state.tickEvents = [tierUp('stranger', 'Oren')];
    const out = phaseNarrative(state);
    expect(out.chronicleEntries).toHaveLength(0);
    const skipped = getTraces().filter(t => t.category === 'chronicle.intake.skipped');
    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toMatchObject({ eventId: 'te-stranger', eventType: 'tier_promotion', actorId: 'stranger', reason: 'not_threaded' });
  });

  it('a threaded mortal\'s tier-up enters in words — no digit, no Q — and message is untouched', () => {
    const state = makeState(true);
    const event = tierUp('vara', 'Vara');
    state.tickEvents = [event];
    const out = phaseNarrative(state);
    expect(out.chronicleEntries).toHaveLength(1);
    const entry = out.chronicleEntries![0];
    expect(entry.prose).toBe('Vara is now subtle in Shadow and is called Shadow Master.');
    expect(entry.prose).not.toMatch(/\d/);
    expect(entry.prose).not.toMatch(/Q\b/);
    expect(event.message).toBe('Vara reached shadow tier 6: "Shadow Master"');
  });

  it('an ungated event still enters the Chronicle for anyone (only growth is gated)', () => {
    const state = makeState(false);
    state.tickEvents = [{ id: 'te-x', tick: 7, type: 'agent_action_resolved', message: 'Oren holds the bridge.', significance: 0.85, actorId: 'stranger' }];
    expect(phaseNarrative(state).chronicleEntries).toHaveLength(1);
  });

  it('a rarity graduation for an unthreaded actor writes no Chronicle entry by the event path', () => {
    const state = makeState(false);
    state.tickEvents = [{
      id: 'te-grad', tick: 7, type: 'tier_promotion', message: 'Oren has achieved Storied status.',
      significance: 0.9, actorId: 'stranger', chronicleGate: 'threaded_only',
    }];
    expect(phaseNarrative(state).chronicleEntries).toHaveLength(0);
  });

  it('…and by the direct-push path: both rarity blocks ask the gate before pushing', () => {
    const state = makeState(false);
    expect(shouldSkipForChronicle(state, 'stranger', 'rarity-grad-stranger-7', 'rarity_graduation')).toBe(true);
    expect(getTraces().some(t => t.category === 'chronicle.intake.skipped' && (t as { eventType?: string }).eventType === 'rarity_graduation')).toBe(true);
    expect(shouldSkipForChronicle(makeState(true), 'vara', 'rarity-grad-vara-7', 'rarity_graduation')).toBe(false);
    // Source pin: every direct graduation push in the orchestrator is guarded.
    const src = readFileSync(resolve(__dirname, '../orchestrator.ts'), 'utf8');
    const pushes = src.match(/graduationChronicles\.push\(/g) ?? [];
    const guarded = src.match(/if \(!shouldSkipForChronicle\([^)]*'rarity_graduation'\)\) graduationChronicles\.push\(/g) ?? [];
    expect(pushes.length).toBeGreaterThan(0);
    expect(guarded.length).toBe(pushes.length);
  });

  it('the god\'s own avatar counts as followed (avatar_of, no thread)', () => {
    const state = makeState(false);
    state.graph.addNode({ id: 'vessel', type: 'actor', name: 'Vessel', properties: { actorType: 'individual' } });
    state.graph.addEdge({ id: 'av', type: 'avatar_of', source: 'vessel', target: 'asc', properties: {} });
    state.tickEvents = [tierUp('vessel', 'Vessel')];
    expect(phaseNarrative(state).chronicleEntries).toHaveLength(1);
  });

  it('a missing actorId reads as not threaded', () => {
    expect(shouldSkipForChronicle(makeState(true), undefined, 'e', 'tier_promotion')).toBe(true);
  });
});

describe('buildTierUpProse (CHRONICLE_TIER_UP_LINE)', () => {
  it('names the reach word, the reach and the title, with no digit', () => {
    const state = makeState(true);
    const line = buildTierUpProse(state.graph, 'vara', 'Vara', 'shadow', 'Shadow Master');
    expect(line).toMatch(/^Vara is now (an? )?[a-z' -]+ in Shadow and is called Shadow Master\.$/);
    expect(line).not.toMatch(/\d/);
  });

  it('returns undefined rather than a raw token when a part is missing', () => {
    const state = makeState(true);
    expect(buildTierUpProse(state.graph, 'vara', 'Vara', 'shadow', '')).toBeUndefined();
  });
});
