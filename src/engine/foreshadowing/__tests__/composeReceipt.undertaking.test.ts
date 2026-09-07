/**
 * The receipt tooltip renders an `undertaking` pull in words (THR-1432): the deed
 * from the receipt's provenance, never the outcome node id or a cell id.
 */

import { describe, it, expect } from 'vitest';
import { composeReceiptForeshadowing } from '../composeReceipt';
import { DEED_UNKNOWN, MOTIVE_CLAUSES, STAKE_CLAUSES } from '../../../data/foreshadowing-content';
import type { MotiveReceipt } from '../../../types/foreshadowing';

const DEED = 'the razing of Dunmar — Hesk\'s work';

function receipt(overrides: Partial<MotiveReceipt> = {}): MotiveReceipt {
  return {
    templateId: 'encounter.plague_outbreak',
    locationId: 'loc-1',
    contributions: [{ kind: 'undertaking', weight: 0.7, provenance: { nodeId: 'evt_und_proj_raze_10', detail: DEED } }],
    intelTier: 'briefed',
    expectation: 'perilous',
    dominantReach: 'iron',
    decidedAtTick: 12,
    ...overrides,
  };
}

const INPUT = { agentId: 'agent-1', encounterId: 'encounter.plague_outbreak', agentName: 'Maerin Vell', subjectPronoun: 'she', locationName: 'Ashmarket' };

describe('composeReceiptForeshadowing — the undertaking pull (THR-1432)', () => {
  it('the tooltip names the deed and never the node or a cell id', () => {
    for (let tick = 0; tick < 12; tick++) {
      const { tooltipProse, compositionKeys } = composeReceiptForeshadowing(INPUT, receipt({ decidedAtTick: tick }));
      expect(tooltipProse).toContain('the razing of Dunmar');
      expect(tooltipProse).not.toMatch(/evt_und_|cell\.|[{}]/);
      expect(compositionKeys).toContain('pull:undertaking');
    }
  });

  it('a pull with no deed on it still reads whole', () => {
    const { tooltipProse } = composeReceiptForeshadowing(INPUT, receipt({ contributions: [{ kind: 'undertaking', weight: 0.7 }] }));
    expect(tooltipProse).toContain(DEED_UNKNOWN);
    expect(tooltipProse).not.toMatch(/[{}]/);
  });

  it('an undertaking as the second contribution supplies its own stake clause', () => {
    const { prose } = composeReceiptForeshadowing(INPUT, receipt({
      contributions: [
        { kind: 'personality', weight: 0.5 },
        { kind: 'undertaking', weight: 0.4, provenance: { nodeId: 'evt_und_proj_raze_10', detail: DEED } },
      ],
    }));
    expect(prose).not.toMatch(/[{}]/);
    expect(STAKE_CLAUSES.undertaking!.length).toBeGreaterThanOrEqual(3);
  });

  it('the pool carries at least four variants, each naming the deed', () => {
    expect(MOTIVE_CLAUSES.undertaking.length).toBeGreaterThanOrEqual(4);
    for (const clause of MOTIVE_CLAUSES.undertaking) expect(clause).toMatch(/\{deed\}/);
  });
});
