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
  it('returns land + people revelation mutations for hex.survey on success (THR-398)', () => {
    const mutations = resolveRevelation('hex.survey', 3, 5, 'success', 10);
    expect(mutations).toHaveLength(2);
    expect(mutations).toContainEqual({ col: 3, row: 5, layer: 'land', source: 'hex.survey' });
    expect(mutations).toContainEqual({ col: 3, row: 5, layer: 'people', source: 'hex.survey' });
  });

  it('returns empty array on failure', () => {
    const mutations = resolveRevelation('hex.survey', 3, 5, 'failure', 10);
    expect(mutations).toHaveLength(0);
  });

  it('returns empty array for unknown template IDs (fail-soft)', () => {
    const mutations = resolveRevelation('hex.bless_land', 3, 5, 'success', 10);
    expect(mutations).toHaveLength(0);
  });

  it('emits one LayerRevealedTrace per layer for hex.survey (two traces)', () => {
    resolveRevelation('hex.survey', 3, 5, 'success', 10);
    const traces = getTraces().filter(t => (t as any).type === 'layer_revealed');
    expect(traces).toHaveLength(2);
    const layers = traces.map(t => (t as any).layer);
    expect(layers).toContain('land');
    expect(layers).toContain('people');
    for (const trace of traces) {
      expect((trace as any).category).toBe('revelation');
      expect((trace as any).hexCol).toBe(3);
      expect((trace as any).hexRow).toBe(5);
      expect((trace as any).revealedBy).toBe('hex.survey');
      expect((trace as any).layers).toEqual(['land', 'people']);
    }
  });

  it('emits a single LayerRevealedTrace for single-layer templates', () => {
    resolveRevelation('hex.read_currents', 1, 2, 'success', 5);
    const traces = getTraces().filter(t => (t as any).type === 'layer_revealed');
    expect(traces).toHaveLength(1);
    expect((traces[0] as any).layer).toBe('soul');
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
      { col: 3, row: 5, layer: 'soul', source: 'hex.read_currents' },
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
      { col: 1, row: 2, layer: 'soul', source: 'hex.read_currents' },
    ]);
    expect(result['0,0']?.land).toBe(true);
    expect(result['1,2']?.soul).toBe(true);
  });

  it('applies both land and people mutations from a Survey cast', () => {
    const mutations = resolveRevelation('hex.survey', 4, 4, 'success', 1);
    const result = applyRevelationMutations(undefined, mutations);
    expect(result['4,4']).toEqual({ land: true, soul: false, people: true, ruins: false });
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
  it('maps hex.survey to [land, people] (THR-398: unified dual-layer)', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.survey']).toEqual(['land', 'people']);
  });

  it('does not contain retired templates (THR-398)', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.sense_threads']).toBeUndefined();
    expect(TEMPLATE_REVELATION_MAP['hex.sense_leylines']).toBeUndefined();
    expect(TEMPLATE_REVELATION_MAP['hex.divine_populace']).toBeUndefined();
    expect(TEMPLATE_REVELATION_MAP['hex.scry_factions']).toBeUndefined();
  });

  it('does not map bless/corrupt/seed (non-Find actions)', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.bless_land']).toBeUndefined();
    expect(TEMPLATE_REVELATION_MAP['hex.corrupt_land']).toBeUndefined();
    expect(TEMPLATE_REVELATION_MAP['hex.seed_life']).toBeUndefined();
  });

  it('maps hex.dowse_resources to land', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.dowse_resources']).toBe('land');
  });

  it('maps hex.read_currents to soul', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.read_currents']).toBe('soul');
  });

  it('maps hex.read_stones to ruins', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.read_stones']).toBe('ruins');
  });

  it('maps hex.whisper_intuition to ruins', () => {
    expect(TEMPLATE_REVELATION_MAP['hex.whisper_intuition']).toBe('ruins');
  });
});
