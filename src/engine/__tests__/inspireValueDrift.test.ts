/**
 * THR-2088 — Breath of Purpose (`divine.inspire`) writes a real value drift.
 *
 * Before this, the card's `apply_influence` entry carried no `valueDrifts`, so
 * the mortal's page read "Inspired" and `buildValueOverlay` — the decision
 * path's input — moved nothing. Runs the real template ops through the real
 * executor and reads the result the way production does.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { executeGraphOps, resetOpCounter } from '../graphOpExecutor';
import { buildValueOverlay, getDivineInfluences } from '../interventionEffects';
import { castInfluenceReceiptLine } from '../playerReceipts';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { INSPIRE_VALUE_DRIFT, DREAM_VALUE_DRIFT, COMPULSION_VALUE_DRIFT } from '../../data/dream-content';
import { ACTION_EFFECTS_PROSE } from '../../data/actionEffectsProse';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../traceBuffer';
import { VALUE_PAIRS } from '../../types/agent';
import type { AxiologicalProfile } from '../../types/agent';
import type { GraphOp } from '../../types/graphOp';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';

const GOD = 'asc-1';
const MORTAL = 'mortal-1';

function profile(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const base = Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
  return { ...base, ...overrides };
}

function castInspire(graph: WorldGraph, tick = 10) {
  const t = getUnifiedTemplateById('divine.inspire')!;
  const ops = t.steps.flatMap((s) => (isActionStepBranch(s) ? [] : s.onSuccess ?? [])) as GraphOp[];
  return executeGraphOps(graph, ops, { actorId: GOD, targetId: MORTAL, locationId: 'loc-1', tick });
}

describe('THR-2088 Inspire value drift', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    resetOpCounter();
    clearTraces();
    enableTracing();
    graph = new WorldGraph();
    // Iron-primary god: the bound pair is mercy_ruthlessness.
    graph.addNode({
      id: GOD, type: 'actor', name: 'The God',
      properties: { domainAffinities: { iron: 0.9, heart: 0.4 } },
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

  it('moves the decision-path overlay in the direction the mortal already leans', () => {
    addMortal(-0.3);
    expect(castInspire(graph).allSucceeded).toBe(true);

    const [entry] = getDivineInfluences(graph, MORTAL);
    expect(entry.interventionType).toBe('inspire_intervention');
    expect(entry.valueDrifts).toEqual({ mercy_ruthlessness: -INSPIRE_VALUE_DRIFT });

    const base = graph.getNode(MORTAL)!.properties.axiologicalProfile as AxiologicalProfile;
    const overlay = buildValueOverlay(base, [entry], 10);
    expect(overlay.mercy_ruthlessness).toBeLessThan(-0.3);
    expect(base.mercy_ruthlessness).toBe(-0.3);

    const applied = getTraces().filter((t) => t.category === 'influence.applied');
    expect(applied).toHaveLength(1);
    expect(applied[0]).toMatchObject({
      interventionType: 'inspire_intervention', valuePair: 'mercy_ruthlessness', drift: -INSPIRE_VALUE_DRIFT,
    });
  });

  it('a mortal at exactly 0 gets no entry, so no "Inspired" chip shows that is not real', () => {
    addMortal(0);
    expect(castInspire(graph).allSucceeded).toBe(true);
    expect(getDivineInfluences(graph, MORTAL)).toHaveLength(0);
    expect(getTraces().find((t) => t.category === 'influence.no_lean')).toMatchObject({ reason: 'no_lean' });
  });

  it('sits between the dream and the compulsion in strength', () => {
    expect(INSPIRE_VALUE_DRIFT).toBeGreaterThan(DREAM_VALUE_DRIFT);
    expect(INSPIRE_VALUE_DRIFT).toBeLessThan(COMPULSION_VALUE_DRIFT);
  });

  it('the receipt names the mortal and the pole, and found-nothing on a zero lean', () => {
    const state = { graph } as unknown as GameState;
    const action = { actorId: GOD, targetId: MORTAL, startTick: 10 } as unknown as UnifiedAction;
    const tpl = getUnifiedTemplateById('divine.inspire')!;

    addMortal(0.4);
    castInspire(graph);
    const first = castInfluenceReceiptLine(state, action, tpl, 'neutral', 'Wren')!.split('. ')[0];
    expect(first).toContain('Wren');
    expect(first).toContain('mercy');
    expect(castInfluenceReceiptLine(state, action, tpl, 'strained', 'Wren')).toContain('mercy');

    graph.removeNode(MORTAL);
    addMortal(0);
    castInspire(graph);
    expect(castInfluenceReceiptLine(state, action, tpl, 'neutral', 'Wren')).toMatch(/nothing/);
  });

  it('the card text no longer promises a flame that lasts while belief is unchallenged', () => {
    const tpl = getUnifiedTemplateById('divine.inspire')!;
    expect(tpl.description).not.toMatch(/unchallenged/);
    expect(tpl.description).toMatch(/already care for/);
    expect(ACTION_EFFECTS_PROSE['divine.inspire']).toMatch(/already lean/);
  });
});
