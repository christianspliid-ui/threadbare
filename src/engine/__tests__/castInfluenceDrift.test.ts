/**
 * THR-1651 — Oneiric Sending and Divine Compulsion write a real value drift.
 *
 * Runs the *real* template ops (`divine.dream`, `divine.persuade`) through the
 * real executor, then reads the result the way production does: the stored
 * `divineInfluences` entry, `buildValueOverlay` (the agent re-score's input) and
 * the receipt line the player reads.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { buildValueOverlay, getDivineInfluences } from '../interventionEffects';
import { resolveCastValueDrift, valuePoleWord, describeActiveInfluences } from '../castInfluenceDrift';
import { castInfluenceReceiptLine } from '../playerReceipts';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { DREAM_VALUE_DRIFT, COMPULSION_VALUE_DRIFT } from '../../data/dream-content';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { VALUE_PAIRS } from '../../types/agent';
import type { AxiologicalProfile } from '../../types/agent';
import type { GraphOp } from '../../types/graphOp';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';

const GOD = 'asc-1';
const MORTAL = 'mortal-1';

function profile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base = Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
  return { ...base, ...overrides };
}

function templateOps(templateId: string): GraphOp[] {
  const t = getUnifiedTemplateById(templateId);
  if (!t) throw new Error(`missing template ${templateId}`);
  return t.steps.flatMap((s) => s.onSuccess ?? []) as GraphOp[];
}

function cast(graph: WorldGraph, templateId: string, tick = 10) {
  return executeGraphOps(graph, templateOps(templateId), {
    actorId: GOD,
    targetId: MORTAL,
    locationId: 'loc-1',
    tick,
  });
}

describe('THR-1651 cast value drifts', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    resetOpCounter();
    clearTraces();
    enableTracing();
    graph = new WorldGraph();
    // Iron-primary god: the bound pair is mercy_ruthlessness (Protector ↔ Conqueror).
    graph.addNode({
      id: GOD, type: 'actor', name: 'The God',
      properties: { domainAffinities: { iron: 0.9, heart: 0.4, gold: 0.1 } },
    });
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Here', properties: {} });
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  function addMortal(lean: number) {
    graph.addNode({
      id: MORTAL, type: 'actor', name: 'Wren',
      properties: { axiologicalProfile: profile({ mercy_ruthlessness: lean }) },
    });
  }

  it('a dream deepens the lean the target already has (positive lean → further positive)', () => {
    addMortal(0.3);
    expect(cast(graph, 'divine.dream').allSucceeded).toBe(true);

    const [entry] = getDivineInfluences(graph, MORTAL);
    expect(entry.interventionType).toBe('dream');
    expect(entry.valueDrifts).toEqual({ mercy_ruthlessness: DREAM_VALUE_DRIFT });
    // The rule resolves at apply time; it is not stored on the entry.
    expect((entry as unknown as Record<string, unknown>).valueDriftRule).toBeUndefined();

    const base = graph.getNode(MORTAL)!.properties.axiologicalProfile as AxiologicalProfile;
    const overlay = buildValueOverlay(base, [entry], 10);
    expect(overlay.mercy_ruthlessness).toBeGreaterThan(0.3);
    // Base profile is untouched — influence is an overlay.
    expect(base.mercy_ruthlessness).toBe(0.3);

    const applied = getTraces().filter((t) => t.category === 'influence.applied');
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatchObject({ valuePair: 'mercy_ruthlessness', drift: DREAM_VALUE_DRIFT, targetId: MORTAL });
  });

  it('a dream on a negative lean drifts further negative', () => {
    addMortal(-0.4);
    cast(graph, 'divine.dream');
    const [entry] = getDivineInfluences(graph, MORTAL);
    expect(entry.valueDrifts).toEqual({ mercy_ruthlessness: -DREAM_VALUE_DRIFT });
  });

  it('a dream on a target at exactly 0 writes no drift, no entry, and a no_lean trace', () => {
    addMortal(0);
    const result = cast(graph, 'divine.dream');
    expect(result.allSucceeded).toBe(true);
    expect(getDivineInfluences(graph, MORTAL)).toHaveLength(0);

    const noLean = getTraces().filter((t) => t.category === 'influence.no_lean');
    expect(noLean).toHaveLength(1);
    expect(noLean[0]).toMatchObject({ reason: 'no_lean', valuePair: 'mercy_ruthlessness', targetId: MORTAL });
    expect(getTraces().some((t) => t.category === 'influence.applied')).toBe(false);
  });

  it('compulsion drifts toward the reach pair\'s first-named pole, whatever the target leans', () => {
    addMortal(-0.5); // leans Conqueror
    cast(graph, 'divine.persuade');
    const [entry] = getDivineInfluences(graph, MORTAL);
    expect(entry.interventionType).toBe('persuade');
    expect(entry.valueDrifts).toEqual({ mercy_ruthlessness: COMPULSION_VALUE_DRIFT });

    const base = graph.getNode(MORTAL)!.properties.axiologicalProfile as AxiologicalProfile;
    expect(buildValueOverlay(base, [entry], 10).mercy_ruthlessness).toBeGreaterThan(-0.5);
  });

  it('compulsion drifts a target at 0 too — the god chooses the pole', () => {
    addMortal(0);
    cast(graph, 'divine.persuade');
    expect(getDivineInfluences(graph, MORTAL)[0].valueDrifts).toEqual({ mercy_ruthlessness: COMPULSION_VALUE_DRIFT });
  });

  it('the pair follows the god\'s primary reach', () => {
    graph.updateNode(GOD, { properties: { domainAffinities: { heart: 0.9, iron: 0.2 } } });
    graph.addNode({
      id: MORTAL, type: 'actor', name: 'Wren',
      properties: { axiologicalProfile: profile({ loyalty_ambition: -0.2 }) },
    });
    cast(graph, 'divine.dream');
    expect(getDivineInfluences(graph, MORTAL)[0].valueDrifts).toEqual({ loyalty_ambition: -DREAM_VALUE_DRIFT });
  });

  it('fail-soft: a caster with no reach affinities writes nothing and traces no_reach', () => {
    graph.updateNode(GOD, { properties: { domainAffinities: undefined } });
    addMortal(0.3);
    expect(cast(graph, 'divine.persuade').allSucceeded).toBe(true);
    expect(getDivineInfluences(graph, MORTAL)).toHaveLength(0);
    expect(getTraces().find((t) => t.category === 'influence.no_lean')).toMatchObject({ reason: 'no_reach', valuePair: null });
  });

  it('describeActiveInfluences reports the live drift with a player-word duration', () => {
    addMortal(0.3);
    cast(graph, 'divine.dream', 10);
    const [reading] = describeActiveInfluences(graph, MORTAL, 11);
    expect(reading.valueDrifts).toEqual({ mercy_ruthlessness: DREAM_VALUE_DRIFT });
    expect(reading.strength).toBeGreaterThan(0);
    expect(reading.durationLabel).not.toMatch(/\d/);
    // Past maxDuration it is gone, matching the overlay.
    expect(describeActiveInfluences(graph, MORTAL, 10 + 1000)).toHaveLength(0);
  });

  it('valuePoleWord names the pole a drift pushes toward', () => {
    expect(valuePoleWord('mercy_ruthlessness', 0.1)).toBe('mercy');
    expect(valuePoleWord('mercy_ruthlessness', -0.1)).toBe('ruthlessness');
  });

  it('resolution is stable after the write — the receipt reads the same drift', () => {
    addMortal(0.3);
    const before = resolveCastValueDrift(graph, GOD, MORTAL, { direction: 'own_lean', magnitude: DREAM_VALUE_DRIFT });
    cast(graph, 'divine.dream');
    const after = resolveCastValueDrift(graph, GOD, MORTAL, { direction: 'own_lean', magnitude: DREAM_VALUE_DRIFT });
    expect(after).toEqual(before);
  });

  describe('receipt lines', () => {
    function receiptLine(templateId: string, band: 'neutral' | 'strained' | 'setback') {
      const state = { graph } as unknown as GameState;
      const action = { actorId: GOD, targetId: MORTAL, startTick: 10 } as unknown as UnifiedAction;
      return castInfluenceReceiptLine(state, action, getUnifiedTemplateById(templateId)!, band, 'Wren');
    }

    it('a landed dream names the mortal and the pole in its first sentence', () => {
      addMortal(0.3);
      cast(graph, 'divine.dream');
      const line = receiptLine('divine.dream', 'neutral')!;
      const first = line.split('. ')[0];
      expect(first).toContain('Wren');
      expect(first).toContain('mercy');
      expect(receiptLine('divine.dream', 'strained')).toContain('mercy');
    });

    it('a dream on a zero lean reads "found nothing"', () => {
      addMortal(0);
      cast(graph, 'divine.dream');
      expect(receiptLine('divine.dream', 'neutral')).toMatch(/nothing/);
    });

    it('a failed cast keeps the resolver\'s own overview', () => {
      addMortal(0.3);
      expect(receiptLine('divine.dream', 'setback')).toBeUndefined();
    });

    it('never names a change that was not written (Law 56)', () => {
      addMortal(0.3); // lean exists, but no cast ran
      expect(receiptLine('divine.persuade', 'neutral')).toBeUndefined();
    });

    it('compulsion names the first pole', () => {
      addMortal(-0.5);
      cast(graph, 'divine.persuade');
      expect(receiptLine('divine.persuade', 'neutral')).toContain('mercy');
    });
  });
});
