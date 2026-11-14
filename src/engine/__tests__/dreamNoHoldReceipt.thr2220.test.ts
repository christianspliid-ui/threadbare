/**
 * THR-2220 — a dream that took no hold still said "held" and "Heart grew".
 *
 * THR-2168 fixed the receipt's opening line only. The diagnosis: `tookNoHold` is
 * right (the drift reads the target's base profile, which no cast writes), so the
 * cast truly moved no one. What contradicted it was the caster's own practice
 * growth ("Heart grew") and the band word "held" — also a Dominion tier.
 *
 * Runs the real `divine.dream` through the real `executeStepResult`, then the
 * real receipt phase, so the chips checked are the ones the resolver wrote.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { createSimulationRuntime } from '../simulationRuntime';
import { castStepFoundNoHold } from '../castInfluenceDrift';
import { processPlayerReceipts, type PlayerActionReceipt } from '../playerReceipts';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import {
  RECEIPT_BAND_WORD_NO_HOLD,
  RECEIPT_FRAME_LINES_NO_HOLD,
  receiptBandWord,
  selectReceiptFrameLine,
} from '../../data/receipt-content';
import { DOMINION_BAND_WORDS } from '../../data/dominion-content';
import { VALUE_PAIRS } from '../../types/agent';
import type { AxiologicalProfile } from '../../types/agent';
import type { GameState } from '../../types/gameState';
import type { GraphOp } from '../../types/graphOp';
import type { UnifiedAction, ActionStep } from '../../types/unifiedAction';
import type { OutcomeBand } from '../outcomeConsequences';

const GOD = 'asc-1';
const MORTAL = 'mortal-1';

function profile(lean: number): AxiologicalProfile {
  const base = Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
  // Iron-primary god → the dream drifts mercy_ruthlessness.
  return { ...base, mercy_ruthlessness: lean };
}

function castDream(lean: number) {
  const template = getUnifiedTemplateById('divine.dream')!;
  const step = template.steps[0] as ActionStep;
  const graph = new WorldGraph();
  graph.addNode({
    id: GOD, type: 'actor', name: 'The Witness',
    properties: { domainAffinities: { iron: 0.9, heart: 0.4 } },
  });
  graph.addNode({ id: MORTAL, type: 'actor', name: 'Kael', properties: { axiologicalProfile: profile(lean) } });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Ashford', properties: {} });
  const state = { tick: 5, graph, unifiedActions: [], ascendantId: GOD, tickEvents: [], recentEvents: [] } as unknown as GameState;
  const rng = () => 0.5;
  const created = createUnifiedAction({
    actorId: GOD, templateId: template.id, targetId: MORTAL,
    scale: template.scale, source: 'player', template, tick: state.tick, rng,
  });
  const { updatedAction } = executeStepResult(
    created, template, 'success', (step.onSuccess ?? []) as GraphOp[], state, rng, state.tick,
    { capability: 60, probability: 0.5, roll: 40 }, createSimulationRuntime(),
  );
  const resolved: UnifiedAction = {
    ...updatedAction,
    resolved: true,
    outcome: 'success',
    completedAtTick: state.tick,
    playerReceiptEmitted: false,
  };
  state.unifiedActions = [resolved];
  const result = processPlayerReceipts(state, {} as never) as { playerActionReceipts?: PlayerActionReceipt[] };
  return { resolved, receipt: (result.playerActionReceipts ?? [])[0], step, state };
}

describe('THR-2220 — a dream that found no hold claims nothing else', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    resetOpCounter();
  });

  it('control: a dream on a mortal who leans grows the caster and does not read no-hold', () => {
    const { resolved, receipt } = castDream(0.3);
    expect(receipt).toBeDefined();
    expect(receipt.tookNoHold).toBeUndefined();
    expect((resolved.aftermathChanges ?? []).some((c) => c.kind === 'growth')).toBe(true);
  });

  it('a dream on a mortal at exactly 0 reads no-hold and carries no change chip', () => {
    const { resolved, receipt } = castDream(0);
    expect(receipt.tookNoHold).toBe(true);
    expect((resolved.aftermathChanges ?? []).some((c) => c.kind === 'growth')).toBe(false);
    expect(receipt.changes).toEqual([]);
    expect(RECEIPT_FRAME_LINES_NO_HOLD).toContain(
      selectReceiptFrameLine(receipt.outcomeBand, receipt.actionId, receipt.tookNoHold),
    );
    expect(receiptBandWord(receipt.outcomeBand, receipt.tookNoHold)).toBe(RECEIPT_BAND_WORD_NO_HOLD);
  });

  it('castStepFoundNoHold reads the same resolver the executor wrote with', () => {
    const lean = castDream(0.3);
    expect(castStepFoundNoHold(lean.state.graph, GOD, MORTAL, lean.step)).toBe(false);
    const flat = castDream(0);
    expect(castStepFoundNoHold(flat.state.graph, GOD, MORTAL, flat.step)).toBe(true);
    // An ordinary step (no drift rule) never reads no-hold.
    expect(castStepFoundNoHold(flat.state.graph, GOD, MORTAL, { onSuccess: [] })).toBe(false);
    expect(castStepFoundNoHold(flat.state.graph, GOD, undefined, flat.step)).toBe(false);
  });
});

describe('THR-2220 — no receipt band word is a Dominion tier word', () => {
  const tierWords = Object.values(DOMINION_BAND_WORDS).map((w) => w.toLowerCase());
  const bands: OutcomeBand[] = ['surge', 'neutral', 'strained', 'fortunate', 'setback', 'catastrophe'];

  it.each(bands)('%s', (band) => {
    for (const noHold of [false, true]) {
      const words = receiptBandWord(band, noHold).toLowerCase().split(/\s+/);
      for (const tier of tierWords) expect(words).not.toContain(tier);
    }
  });
});
