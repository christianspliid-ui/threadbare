/**
 * THR-2168 — a cast's receipt contradicted itself: a dream that found nothing
 * still framed itself "It went as you meant it to", and a hex-targeted cast
 * printed its node id ("hex_17_14") as the target's name.
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { processPlayerReceipts, receiptTargetName, type PlayerActionReceipt } from '../playerReceipts';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import {
  RECEIPT_FRAME_LINES,
  RECEIPT_FRAME_LINES_NO_HOLD,
  selectReceiptFrameLine,
} from '../../data/receipt-content';
import { findValueDriftInfluence } from '../castInfluenceDrift';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { OutcomeBand } from '../outcomeConsequences';

function makeAction(templateId: string, overrides?: Partial<UnifiedAction>): UnifiedAction {
  return {
    actionId: 'ua-2168',
    actorId: 'asc-1',
    templateId,
    targetId: 'mortal-1',
    scale: 'personal',
    source: 'player',
    startTick: 3,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    completedAtTick: 7,
    stepOutcomes: [],
    aftermathSummary: { encounterId: 'enc', outcome: 'success', overview: 'The working settled.', changes: [] },
    ...overrides,
  };
}

function makeState(actions: UnifiedAction[], withPlace = false): GameState {
  const graph = new WorldGraph();
  // No primary reach on the god: a value-drifting cast resolves `no_reach` and
  // reads its `found_nothing` line on a clean band.
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Witness', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'mortal-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  if (withPlace) {
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Ashford', properties: { hexCol: 17, hexRow: 14 } });
  }
  return {
    tick: 7,
    graph,
    tiles: [{ coord: { col: 17, row: 14 }, geoParams: {} as never, terrain: 'deep_forest' }],
    ascendantId: 'asc-1',
    tickEvents: [],
    recentEvents: [],
    unifiedActions: actions,
  } as unknown as GameState;
}

function receiptsFor(state: GameState): PlayerActionReceipt[] {
  const result = processPlayerReceipts(state, {} as never);
  return [...((result as { playerActionReceipts?: PlayerActionReceipt[] }).playerActionReceipts ?? [])];
}

const DRIFT_TEMPLATES = UNIFIED_ACTION_TEMPLATES.filter((t) => findValueDriftInfluence(t));

describe('THR-2168 — a cast that found nothing does not say it went as meant', () => {
  it('there is at least one value-drifting cast to check', () => {
    expect(DRIFT_TEMPLATES.length).toBeGreaterThan(0);
  });

  it.each(DRIFT_TEMPLATES.map((t) => [t.id]))('%s on a clean band marks the receipt no-hold', (id) => {
    const receipts = receiptsFor(makeState([makeAction(id, { aftermathSummary: { encounterId: 'enc', outcome: 'success', overview: 'The working settled.', changes: [], narrativeTag: 'neutral' } as UnifiedAction['aftermathSummary'] })]));
    expect(receipts).toHaveLength(1);
    const r = receipts[0];
    // The overview is the found-nothing line …
    expect(r.overview).toMatch(/as they were/);
    expect(r.tookNoHold).toBe(true);
    // … and the frame line the dialog leads with comes from the no-hold pool.
    const frame = selectReceiptFrameLine(r.outcomeBand, r.actionId, r.tookNoHold);
    expect(RECEIPT_FRAME_LINES_NO_HOLD).toContain(frame);
    for (const band of Object.keys(RECEIPT_FRAME_LINES) as OutcomeBand[]) {
      expect(RECEIPT_FRAME_LINES[band]).not.toContain(frame);
    }
  });

  it('an ordinary cast is not marked no-hold and keeps its band line', () => {
    const plain = UNIFIED_ACTION_TEMPLATES.find(
      (t) => (t.actorAffinities?.includes('ascendant') ?? false) && !findValueDriftInfluence(t),
    )!;
    const r = receiptsFor(makeState([makeAction(plain.id)]))[0];
    expect(r.tookNoHold).toBeUndefined();
    expect(RECEIPT_FRAME_LINES_NO_HOLD).not.toContain(selectReceiptFrameLine(r.outcomeBand, r.actionId, r.tookNoHold));
  });
});

const HEX_TEMPLATES = UNIFIED_ACTION_TEMPLATES.filter((t) =>
  (t.targetCategories ?? []).some((c) => c === 'hex' || c === 'location'),
);

describe('THR-2168 — a hex-targeted receipt never prints a node id', () => {
  it('there are hex-targetable cards to check', () => {
    expect(HEX_TEMPLATES.length).toBeGreaterThan(0);
  });

  it.each(HEX_TEMPLATES.map((t) => [t.id]))('%s cast on hex_17_14 names the place, never the id', (id) => {
    for (const withPlace of [false, true]) {
      const receipts = receiptsFor(makeState([makeAction(id, { targetId: 'hex_17_14' })], withPlace));
      for (const r of receipts) {
        const text = [r.targetName, r.overview, r.toastMessage ?? ''].join(' | ');
        expect(text).not.toMatch(/hex_\d+_\d+/);
        expect(r.targetName).toBe(withPlace ? 'Ashford' : 'the deep forest');
      }
    }
  });

  it('receiptTargetName: node name, yourself, hex place, and no name for an unknown id', () => {
    const state = makeState([], true);
    expect(receiptTargetName(state, { actorId: 'asc-1', targetId: 'mortal-1' })).toBe('Kael');
    expect(receiptTargetName(state, { actorId: 'asc-1', targetId: 'asc-1' })).toBe('yourself');
    expect(receiptTargetName(state, { actorId: 'asc-1', targetId: 'hex_17_14' })).toBe('Ashford');
    expect(receiptTargetName(makeState([]), { actorId: 'asc-1', targetId: 'hex_3_4' })).toBe('the wilds');
    expect(receiptTargetName(state, { actorId: 'asc-1', targetId: 'node_gone_9' })).toBe('');
  });
});
