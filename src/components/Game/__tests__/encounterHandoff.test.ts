import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  prepareEncounterHandoff,
  completeEncounterHandoff,
  ENCOUNTER_HANDOFF_TRANSITION_MS,
} from '../encounterHandoff';
import {
  enableTracing,
  disableTracing,
  clearTraces,
  getTraces,
} from '../../../engine/traceBuffer';

/**
 * Tests for the world view → encounter handoff orchestrator (THR-340 / Phase F2).
 * Verifies:
 *  - Spotlight value returned matches the toAgentId.
 *  - Transition duration is the named constant ENCOUNTER_HANDOFF_TRANSITION_MS.
 *  - A `spotlight_changed` trace is emitted with fromAgentId/toAgentId/trigger fields.
 *  - The audio hook fires `onTransitionStart` from prepare and `onTransitionEnd` from complete.
 */
describe('prepareEncounterHandoff', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('returns the next spotlightedAgent and the canonical transition duration', () => {
    const result = prepareEncounterHandoff({
      fromAgentId: null,
      toAgentId: 'agent-target',
      trigger: 'world_handoff',
      tick: 42,
    });
    expect(result.spotlightedAgent).toBe('agent-target');
    expect(result.transitionMs).toBe(ENCOUNTER_HANDOFF_TRANSITION_MS);
  });

  it('emits a spotlight_changed trace with fromAgentId/toAgentId/trigger when from is provided', () => {
    prepareEncounterHandoff({
      fromAgentId: 'agent-prev',
      toAgentId: 'agent-next',
      trigger: 'world_handoff',
      tick: 99,
    });
    const traces = getTraces();
    expect(traces.length).toBe(1);
    const t = traces[0] as unknown as Record<string, unknown>;
    expect(t.category).toBe('spotlight_changed');
    expect(t.fromAgentId).toBe('agent-prev');
    expect(t.toAgentId).toBe('agent-next');
    expect(t.trigger).toBe('world_handoff');
    expect(t.tick).toBe(99);
  });

  it('omits fromAgentId from the trace when none is supplied', () => {
    prepareEncounterHandoff({
      toAgentId: 'first-agent',
      trigger: 'world_handoff',
      tick: 1,
    });
    const t = getTraces()[0] as unknown as Record<string, unknown>;
    expect(t.fromAgentId).toBeUndefined();
    expect(t.toAgentId).toBe('first-agent');
  });

  it('invokes audio.onTransitionStart on prepare and audio.onTransitionEnd on complete', () => {
    let started = 0;
    let ended = 0;
    const audio = {
      onTransitionStart: () => { started += 1; },
      onTransitionEnd:   () => { ended += 1; },
    };
    prepareEncounterHandoff({
      toAgentId: 'agent-x',
      trigger: 'world_handoff',
      tick: 7,
      audio,
    });
    expect(started).toBe(1);
    expect(ended).toBe(0);
    completeEncounterHandoff(audio);
    expect(started).toBe(1);
    expect(ended).toBe(1);
  });
});
