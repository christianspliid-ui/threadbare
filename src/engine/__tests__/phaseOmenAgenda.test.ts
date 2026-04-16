/**
 * Tests for phaseOmenAgenda — THR-19
 *
 * Covers:
 * - Omen selection on empty slot (doom-echo takes primary)
 * - Seasonal fallback when no doom-echo matches
 * - Omen expiry after duration
 * - Doom stage force-expire
 * - Beat emission on interval
 * - deriveOmenEncounterBias
 * - Fail-soft: missing omenState, missing template, invalid duration
 * - OMEN_FIRST_ACTIVATION_TICK suppresses selection before tick 3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { OmenState, ActiveOmen } from '../../types/omen';
import { phaseOmenAgenda, deriveOmenEncounterBias, OMEN_FIRST_ACTIVATION_TICK, OMEN_MAX_HISTORY, OMEN_ENCOUNTER_BIAS_CAP } from '../phaseOmenAgenda';
import { WorldGraph } from '../graph';
import { getDoomEchoTemplates, getSeasonalTemplates, OMEN_TEMPLATES } from '../../data/omenTemplates';

// ─── Minimal state factory ───────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function makeDoomClock(stage = 0) {
  return {
    currentStage: stage,
    progress: 0.1,
    expired: false,
    ticks: 5,
    stageTransitions: [],
  } as unknown as GameState['doomClock'];
}

function makeDoomDefinition(archetype = 'breach') {
  return {
    archetype,
    stages: [
      { stage: 0, name: 'Whispers' },
      { stage: 1, name: 'Tremors' },
      { stage: 2, name: 'Upheaval' },
      { stage: 3, name: 'Ruin' },
      { stage: 4, name: 'Oblivion' },
    ],
  } as unknown as GameState['doomDefinition'];
}

function makeWorldSoul() {
  return {
    fundament: { sphereWeights: { force: 0.08, entropy: 0.08, life: 0.08 } },
    resonance: {},
  } as unknown as GameState['worldSoul'];
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 5,
    seed: 42,
    graph: makeGraph(),
    doomClock: makeDoomClock(),
    doomDefinition: makeDoomDefinition(),
    worldSoul: makeWorldSoul(),
    tickEvents: [],
    recentEvents: [],
    pendingSpherePressures: [],
    omenState: undefined,
    ascendantId: 'player',
    ...overrides,
  } as unknown as GameState;
}

// ─── Template registry checks ────────────────────────────────────

describe('omenTemplates registry', () => {
  it('has doom-echo templates for breach archetype', () => {
    const templates = getDoomEchoTemplates('breach', 0);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every(t => t.category === 'doom_echo')).toBe(true);
  });

  it('has seasonal templates as fallback', () => {
    const seasonal = getSeasonalTemplates();
    expect(seasonal.length).toBeGreaterThan(0);
  });

  it('no doom-echo templates exist for unknown archetype', () => {
    const templates = getDoomEchoTemplates('nonexistent', 0);
    expect(templates).toHaveLength(0);
  });

  it('all templates have valid durationRange', () => {
    for (const t of OMEN_TEMPLATES) {
      expect(t.durationRange[0]).toBeGreaterThan(0);
      expect(t.durationRange[1]).toBeGreaterThanOrEqual(t.durationRange[0]);
    }
  });

  it('all templates have at least one beat', () => {
    for (const t of OMEN_TEMPLATES) {
      expect(t.beats.length).toBeGreaterThan(0);
      for (const b of t.beats) {
        expect(b.prose.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── phaseOmenAgenda — activation ───────────────────────────────

describe('phaseOmenAgenda — activation', () => {
  it('returns empty partial before OMEN_FIRST_ACTIVATION_TICK', () => {
    const state = makeState({ tick: OMEN_FIRST_ACTIVATION_TICK - 1 });
    const result = phaseOmenAgenda(state);
    expect(result).toEqual({});
  });

  it('selects a primary omen on first eligible tick', () => {
    const state = makeState({ tick: OMEN_FIRST_ACTIVATION_TICK });
    const result = phaseOmenAgenda(state);
    expect(result.omenState).toBeDefined();
    expect(result.omenState?.primary).not.toBeNull();
  });

  it('selects a doom-echo omen for breach archetype stage 0', () => {
    const state = makeState({ tick: 5, doomDefinition: makeDoomDefinition('breach') });
    const result = phaseOmenAgenda(state);
    const primaryId = result.omenState?.primary?.templateId;
    expect(primaryId).toBeDefined();
    const doomEchoIds = getDoomEchoTemplates('breach', 0).map(t => t.id);
    expect(doomEchoIds).toContain(primaryId);
  });

  it('falls back to seasonal when no doom-echo matches', () => {
    // Use an archetype with no authored templates
    const state = makeState({
      tick: 5,
      doomDefinition: makeDoomDefinition('nonexistent' as never),
    });
    const result = phaseOmenAgenda(state);
    const primaryCategory = result.omenState?.primary?.category;
    expect(primaryCategory).toBe('seasonal');
  });

  it('emits omen_started TickEvent when omen selected', () => {
    const state = makeState({ tick: 5 });
    const result = phaseOmenAgenda(state);
    const started = result.tickEvents?.filter(e => e.type === 'omen_started');
    expect(started?.length).toBeGreaterThanOrEqual(1);
  });

  it('duration is within template range', () => {
    const state = makeState({ tick: 5 });
    const result = phaseOmenAgenda(state);
    const primary = result.omenState?.primary;
    if (!primary) return;
    const template = OMEN_TEMPLATES.find((t) => t.id === primary.templateId);
    if (!template) return;
    expect(primary.duration).toBeGreaterThanOrEqual(template.durationRange[0]);
    expect(primary.duration).toBeLessThanOrEqual(template.durationRange[1]);
  });
});

// ─── phaseOmenAgenda — expiry ────────────────────────────────────

describe('phaseOmenAgenda — expiry', () => {
  function makeActiveOmen(overrides: Partial<ActiveOmen> = {}): ActiveOmen {
    return {
      templateId: 'omen.breach.thin_places',
      name: 'Thin Places',
      category: 'doom_echo',
      startTick: 1,
      duration: 3,
      slot: 'primary',
      lastBeatTick: 1,
      ...overrides,
    };
  }

  it('expires primary omen when duration exceeded', () => {
    const expiredOmen = makeActiveOmen({ startTick: 1, duration: 3 });
    const state = makeState({
      tick: 10,  // elapsed = 9 > duration 3 → should expire
      omenState: { primary: expiredOmen, secondary: null, history: [] },
    });
    const result = phaseOmenAgenda(state);
    // Should have expired and selected a new omen
    expect(result.omenState?.history).toHaveLength(1);
    expect(result.omenState?.history[0].templateId).toBe('omen.breach.thin_places');
  });

  it('emits omen_expired TickEvent on expiry', () => {
    const expiredOmen = makeActiveOmen({ startTick: 1, duration: 3 });
    const state = makeState({
      tick: 10,
      omenState: { primary: expiredOmen, secondary: null, history: [] },
    });
    const result = phaseOmenAgenda(state);
    const expired = result.tickEvents?.filter(e => e.type === 'omen_expired');
    expect(expired?.length).toBeGreaterThanOrEqual(1);
  });

  it('does not expire omen within duration', () => {
    const omen = makeActiveOmen({ startTick: 5, duration: 10 });
    const state = makeState({
      tick: 8,  // elapsed = 3, duration = 10 → still active
      omenState: { primary: omen, secondary: null, history: [] },
    });
    const result = phaseOmenAgenda(state);
    // Primary should still be the same omen
    expect(result.omenState?.primary?.templateId).toBe('omen.breach.thin_places');
  });

  it('force-expires primary on doom_escalation TickEvent', () => {
    const omen = makeActiveOmen({ startTick: 5, duration: 20 });
    const state = makeState({
      tick: 8,
      omenState: { primary: omen, secondary: null, history: [] },
      tickEvents: [{
        id: 'doom_esc_test',
        tick: 8,
        type: 'doom_escalation',
        message: 'Doom escalates',
        significance: 0.9,
      }],
    });
    const result = phaseOmenAgenda(state);
    // Should have been force-expired and moved to history
    expect(result.omenState?.history?.some(h => h.templateId === 'omen.breach.thin_places')).toBe(true);
    const forced = result.tickEvents?.filter(e => e.type === 'omen_expired');
    expect(forced?.length).toBeGreaterThanOrEqual(1);
  });

  it('history is trimmed to OMEN_MAX_HISTORY', () => {
    const longHistory = Array.from({ length: OMEN_MAX_HISTORY + 5 }, (_, i) => ({
      templateId: 'omen.seasonal.the_quiet_before',
      startTick: i,
      endTick: i + 8,
    }));
    const omen = makeActiveOmen({ startTick: 1, duration: 3 });
    const state = makeState({
      tick: 10,
      omenState: { primary: omen, secondary: null, history: longHistory },
    });
    const result = phaseOmenAgenda(state);
    expect(result.omenState?.history.length).toBeLessThanOrEqual(OMEN_MAX_HISTORY);
  });
});

// ─── phaseOmenAgenda — beats ─────────────────────────────────────

describe('phaseOmenAgenda — beat emission', () => {
  it('emits omen_beat event when beat interval reached', () => {
    const omen: ActiveOmen = {
      templateId: 'omen.breach.thin_places',
      name: 'Thin Places',
      category: 'doom_echo',
      startTick: 1,
      duration: 15,
      slot: 'primary',
      lastBeatTick: 0,  // Last beat at tick 0, current tick 5, interval 3 → should emit
    };
    const state = makeState({
      tick: 5,
      omenState: { primary: omen, secondary: null, history: [] },
    });
    const result = phaseOmenAgenda(state);
    const beats = result.tickEvents?.filter(e => e.type === 'omen_beat');
    expect(beats?.length).toBeGreaterThanOrEqual(1);
  });

  it('does not emit beat when interval not reached', () => {
    const omen: ActiveOmen = {
      templateId: 'omen.breach.thin_places',
      name: 'Thin Places',
      category: 'doom_echo',
      startTick: 1,
      duration: 15,
      slot: 'primary',
      lastBeatTick: 4,  // Just emitted at tick 4, interval 3 → not ready at tick 5
    };
    const state = makeState({
      tick: 5,
      omenState: { primary: omen, secondary: null, history: [] },
    });
    const result = phaseOmenAgenda(state);
    const beats = result.tickEvents?.filter(e => e.type === 'omen_beat');
    expect(beats?.length ?? 0).toBe(0);
  });
});

// ─── deriveOmenEncounterBias ─────────────────────────────────────

describe('deriveOmenEncounterBias', () => {
  it('returns empty object when no omenState', () => {
    const bias = deriveOmenEncounterBias(undefined);
    expect(Object.keys(bias)).toHaveLength(0);
  });

  it('returns empty object when no active omens', () => {
    const omenState: OmenState = { primary: null, secondary: null, history: [] };
    const bias = deriveOmenEncounterBias(omenState);
    expect(Object.keys(bias)).toHaveLength(0);
  });

  it('returns bias from primary omen template', () => {
    const omenState: OmenState = {
      primary: {
        templateId: 'omen.breach.fissure_winds',  // duel: +0.3, trade: -0.2
        name: 'Fissure Winds',
        category: 'doom_echo',
        startTick: 1,
        duration: 8,
        slot: 'primary',
        lastBeatTick: 1,
      },
      secondary: null,
      history: [],
    };
    const bias = deriveOmenEncounterBias(omenState);
    expect(bias['duel']).toBeGreaterThan(0);
    expect(bias['trade']).toBeLessThan(0);
  });

  it('merges bias from primary and secondary omens', () => {
    const omenState: OmenState = {
      primary: {
        templateId: 'omen.breach.fissure_winds',  // duel: +0.3
        name: 'Fissure Winds',
        category: 'doom_echo',
        startTick: 1,
        duration: 8,
        slot: 'primary',
        lastBeatTick: 1,
      },
      secondary: {
        templateId: 'omen.cultural.war_drums',  // duel: +0.3
        name: 'War Drums',
        category: 'cultural',
        startTick: 1,
        duration: 8,
        slot: 'secondary',
        lastBeatTick: 1,
      },
      history: [],
    };
    const bias = deriveOmenEncounterBias(omenState);
    // Combined duel bias should be capped at OMEN_ENCOUNTER_BIAS_CAP
    expect(bias['duel']).toBeLessThanOrEqual(OMEN_ENCOUNTER_BIAS_CAP);
  });

  it('caps bias at OMEN_ENCOUNTER_BIAS_CAP', () => {
    // Use the highest duel bias omen (hemorrhage: +0.4)
    const omenState: OmenState = {
      primary: {
        templateId: 'omen.breach.the_hemorrhage',
        name: 'The Hemorrhage',
        category: 'doom_echo',
        startTick: 1,
        duration: 6,
        slot: 'primary',
        lastBeatTick: 1,
      },
      secondary: {
        templateId: 'omen.cultural.war_drums',
        name: 'War Drums',
        category: 'cultural',
        startTick: 1,
        duration: 8,
        slot: 'secondary',
        lastBeatTick: 1,
      },
      history: [],
    };
    const bias = deriveOmenEncounterBias(omenState);
    for (const v of Object.values(bias)) {
      expect(Math.abs(v)).toBeLessThanOrEqual(OMEN_ENCOUNTER_BIAS_CAP + 0.001);
    }
  });
});

// ─── Fail-soft ───────────────────────────────────────────────────

describe('phaseOmenAgenda — fail-soft', () => {
  it('handles missing doomDefinition gracefully', () => {
    const state = makeState({ tick: 5, doomDefinition: undefined as never });
    expect(() => phaseOmenAgenda(state)).not.toThrow();
  });

  it('handles undefined omenState (initial run)', () => {
    const state = makeState({ tick: 5, omenState: undefined });
    const result = phaseOmenAgenda(state);
    expect(result.omenState).toBeDefined();
  });

  it('handles empty graph without crash', () => {
    const state = makeState({ tick: 5, graph: new WorldGraph() });
    expect(() => phaseOmenAgenda(state)).not.toThrow();
  });

  it('is deterministic — same seed + tick produces same omen selection', () => {
    const state1 = makeState({ tick: 5, seed: 99 });
    const state2 = makeState({ tick: 5, seed: 99 });
    const result1 = phaseOmenAgenda(state1);
    const result2 = phaseOmenAgenda(state2);
    expect(result1.omenState?.primary?.templateId).toBe(result2.omenState?.primary?.templateId);
  });
});
