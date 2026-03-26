import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveRevelation,
  applyRevelationMutations,
  revealLayer,
  TEMPLATE_REVELATION_MAP,
} from '../revelationResolver';
import { createDefaultHexRevelation } from '../../types/unifiedAction';
import type { HexRevelation } from '../../types/unifiedAction';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

beforeEach(() => {
  enableTracing();
  clearTraces();
});

// ─── resolveRevelation ──────────────────────────────────────────────────────

describe('resolveRevelation', () => {
  it('returns land revelation mutation for hex.survey on success', () => {
    const mutations = resolveRevelation('hex.survey', 3, 5, 'success', 10);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toEqual({ col: 3, row: 5, layer: 'land', source: 'hex.survey' });
  });

  it('returns soul revelation mutation for hex.sense_threads on success', () => {
    const mutations = resolveRevelation('hex.sense_threads', 1, 2, 'success', 5);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toEqual({ col: 1, row: 2, layer: 'soul', source: 'hex.sense_threads' });
  });

  it('returns empty array on failure', () => {
    const mutations = resolveRevelation('hex.survey', 3, 5, 'failure', 10);
    expect(mutations).toHaveLength(0);
  });

  it('returns empty array for unknown template IDs (fail-soft)', () => {
    const mutations = resolveRevelation('hex.bless_land', 3, 5, 'success', 10);
    expect(mutations).toHaveLength(0);
  });

  it('emits LayerRevealedTrace on success', () => {
    resolveRevelation('hex.survey', 3, 5, 'success', 10);
    const traces = getTraces();
    expect(traces.some(t => (t as any).type === 'layer_revealed')).toBe(true);
    const trace = traces.find(t => (t as any).type === 'layer_revealed') as any;
    expect(trace.category).toBe('revelation');
    expect(trace.hexCol).toBe(3);
    expect(trace.hexRow).toBe(5);
    expect(trace.layer).toBe('land');
    expect(trace.revealedBy).toBe('hex.survey');
  });

  it('does not emit trace on failure', () => {
    resolveRevelation('hex.survey', 3, 5, 'failure', 10);
    expect(getTraces()).toHaveLength(0);
  });
});

// ─── applyRevelationMutations ───────────────────────────────────────────────

describe('applyRevelationMutations', () => {
  it('creates new hex entry when none exists', () => {
    const result = applyRevelationMutations(undefined, [
      { col: 3, row: 5, layer: 'land', source: 'hex.survey' },
    ]);
    expect(result['3,5']).toEqual({ land: true, soul: false, people: false, ruins: false });
  });

  it('reveals a layer on an existing hex entry', () => {
    const existing: Record<string, HexRevelation> = {
      '3,5': { land: true, soul: false, people: false, ruins: false },
    };
    const result = applyRevelationMutations(existing, [
      { col: 3, row: 5, layer: 'soul', source: 'hex.sense_threads' },
    ]);
    expect(result['3,5']).toEqual({ land: true, soul: true, people: false, ruins: false });
  });

  it('is idempotent — revealing an already-revealed layer is a no-op', () => {
    const existing: Record<string, HexRevelation> = {
      '3,5': { land: true, soul: false, people: false, ruins: false },
    };
    const result = applyRevelationMutations(existing, [
      { col: 3, row: 5, layer: 'land', source: 'hex.survey' },
    ]);
    expect(result['3,5']).toEqual(existing['3,5']);
  });

  it('returns empty map when no mutations and undefined input', () => {
    const result = applyRevelationMutations(undefined, []);
    expect(result).toEqual({});
  });

  it('applies multiple mutations across different hexes', () => {
    const result = applyRevelationMutations(undefined, [
      { col: 0, row: 0, layer: 'land', source: 'hex.survey' },
      { col: 1, row: 2, layer: 'soul', source: 'hex.sense_threads' },
    ]);
    expect(result['0,0']?.land).toBe(true);
    expect(result['1,2']?.soul).toBe(true);
  });
});

// ─── revealLayer ────────────────────────────────────────────────────────────

describe('revealLayer', () => {
  it('reveals a single layer on a hex', () => {
    const result = revealLayer(undefined, 5, 10, 'ruins');
    expect(result['5,10']).toEqual({ land: false, soul: false, people: false, ruins: true });
  });

  it('preserves existing revelations on the same hex', () => {
    const existing: Record<string, HexRevelation> = {
      '5,10': { land: true, soul: false, people: false, ruins: false },
    };
    const result = revealLayer(existing, 5, 10, 'people');
    expect(result['5,10']).toEqual({ land: true, soul: false, people: true, ruins: false });
  });
});

// ─── createDefaultHexRevelation ─────────────────────────────────────────────

describe('createDefaultHexRevelation', () => {
  it('returns all layers unrevealed', () => {
    expect(createDefaultHexRevelation()).toEqual({
      land: false,
      soul: false,
      people: false,
      ruins: false,
    });
  });
});

// ─── TEMPLATE_REVELATION_MAP ────────────────────────────────────────────────

describe('TEMPLATE_REVELATION_MAP', () => {
  it('maps hex.survey to land', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.survey']).toBe('land');
  });

  it('maps hex.sense_threads to soul', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.sense_threads']).toBe('soul');
  });

  it('does not map bless/corrupt/seed (non-Find actions)', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.bless_land']).toBeUndefined();
    expect(TEMPLATE_REVELATION_MAP['hex.corrupt_land']).toBeUndefined();
    expect(TEMPLATE_REVELATION_MAP['hex.seed_life']).toBeUndefined();
  });

  // TB-046: New Find action revelation mappings
  it('maps hex.dowse_resources to land', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.dowse_resources']).toBe('land');
  });

  it('maps hex.sense_leylines to land', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.sense_leylines']).toBe('land');
  });

  it('maps hex.read_currents to soul', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.read_currents']).toBe('soul');
  });

  // TB-047: People & Ruins revelation mappings (pre-registered)
  it('maps hex.divine_populace to people', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.divine_populace']).toBe('people');
  });

  it('maps hex.scry_factions to people', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.scry_factions']).toBe('people');
  });

  it('maps hex.read_stones to ruins', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.read_stones']).toBe('ruins');
  });

  it('maps hex.whisper_intuition to ruins', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.whisper_intuition']).toBe('ruins');
  });
});
