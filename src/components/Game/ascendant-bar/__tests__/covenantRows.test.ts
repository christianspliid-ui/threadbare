/**
 * Contract tests for the Ascendant Bar's Covenants readout (THR-613 Slice 4, §5.A).
 *
 * The invariants that matter: only the god's own active controls are listed, a target
 * resolves to its node name (falling back to the hex), the upkeep line is prose-first
 * (never a raw float), a contested control is flagged, and a control the player has
 * already queued for release leaves the panel immediately (optimistic).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import { selectCovenantRows } from '../selectors';
import { COVENANT_UPKEEP_COPY } from '../../../../data/ascendant-bar-content';
import type { GameState } from '../../../../types/gameState';
import type { ControlEffect } from '../../../../types/controlEffect';

function makeEffect(overrides: Partial<ControlEffect> = {}): ControlEffect {
  return {
    effectId: 'cov_1',
    templateId: 'tpl_hold',
    ownerId: 'asc-1',
    targetHexCol: 4,
    targetHexRow: 6,
    establishedTick: 3,
    ritualEssenceInvested: 2,
    perTickCost: { force: 0.5 },
    perTickMutations: [],
    perTickGraphOps: [],
    active: true,
    ticksActive: 5,
    narrativeTemplates: {
      established: 'Established.',
      active: 'Your will presses on the fortress gates.',
      lapsed: 'Lapsed.',
    },
    ...overrides,
  };
}

function covState(opts: {
  controlEffects?: ControlEffect[];
  pendingControlReleases?: string[];
  targetNodes?: Array<{ id: string; name: string }>;
}): GameState {
  const graph = new WorldGraph();
  for (const n of opts.targetNodes ?? []) {
    graph.addNode({ id: n.id, type: 'location', name: n.name, properties: {} });
  }
  return {
    tick: 10,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    controlEffects: opts.controlEffects ?? [],
    pendingControlReleases: opts.pendingControlReleases,
  } as unknown as GameState;
}

describe('selectCovenantRows', () => {
  it('lists the god\'s active controls with the ongoing prose as the title', () => {
    const rows = selectCovenantRows(covState({ controlEffects: [makeEffect()] }));
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Your will presses on the fortress gates.');
    expect(rows[0].effectId).toBe('cov_1');
  });

  it('resolves the target to its node name when present', () => {
    const rows = selectCovenantRows(
      covState({
        controlEffects: [makeEffect({ targetNodeId: 'loc-9' })],
        targetNodes: [{ id: 'loc-9', name: 'Ironhold Keep' }],
      }),
    );
    expect(rows[0].target).toBe('Ironhold Keep');
  });

  it('falls back to the hex when the target node is missing (fail-soft)', () => {
    const rows = selectCovenantRows(
      covState({ controlEffects: [makeEffect({ targetNodeId: 'gone', targetHexCol: 4, targetHexRow: 6 })] }),
    );
    expect(rows[0].target).toBe('the land at (4, 6)');
  });

  it('reads the upkeep as a cost phrase when the control drains essence', () => {
    const rows = selectCovenantRows(covState({ controlEffects: [makeEffect({ perTickCost: { force: 0.5 } })] }));
    expect(rows[0].upkeepLine).toBe(COVENANT_UPKEEP_COPY.cost);
  });

  it('reads the upkeep as income when it net-generates and has no cost', () => {
    const rows = selectCovenantRows(
      covState({ controlEffects: [makeEffect({ perTickCost: {}, perTickIncome: { energy: 0.8 } })] }),
    );
    expect(rows[0].upkeepLine).toBe(COVENANT_UPKEEP_COPY.income);
  });

  it('reads the upkeep as self-sustaining when there is no cost or income', () => {
    const rows = selectCovenantRows(covState({ controlEffects: [makeEffect({ perTickCost: {} })] }));
    expect(rows[0].upkeepLine).toBe(COVENANT_UPKEEP_COPY.free);
  });

  it('flags a contested control (a contestation encounter is live)', () => {
    const rows = selectCovenantRows(
      covState({ controlEffects: [makeEffect({ encounterNodeId: 'enc-1' })] }),
    );
    expect(rows[0].contested).toBe(true);
  });

  it('excludes inactive controls', () => {
    const rows = selectCovenantRows(covState({ controlEffects: [makeEffect({ active: false })] }));
    expect(rows).toHaveLength(0);
  });

  it('excludes controls owned by someone other than the ascendant', () => {
    const rows = selectCovenantRows(covState({ controlEffects: [makeEffect({ ownerId: 'rival-1' })] }));
    expect(rows).toHaveLength(0);
  });

  it('hides a control already queued for release (optimistic)', () => {
    const rows = selectCovenantRows(
      covState({
        controlEffects: [makeEffect({ effectId: 'cov_1' })],
        pendingControlReleases: ['cov_1'],
      }),
    );
    expect(rows).toHaveLength(0);
  });

  it('returns [] when the god holds no controls', () => {
    const rows = selectCovenantRows(covState({ controlEffects: [] }));
    expect(rows).toEqual([]);
  });
});
