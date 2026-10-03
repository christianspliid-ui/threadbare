// @vitest-environment jsdom
/**
 * THR-1700 — a held non-stacking sustained verb shows locked on its own target.
 *
 * Re-casting Hearthfire Blessing on a tavern the god already blesses used to
 * charge the full establishment price and establish nothing (THR-662's spawn
 * guard refuses the duplicate silently). The hand now locks the card "Already
 * held". This pins the whole UI path at the layer the player sees: the real
 * hook (`useTargetActions`) reading `gameState.controlEffects`, the real
 * template, and the real card face built from the slot.
 *
 * This is the run's browser-verify evidence (jsdom-render route): the Done-when
 * is a presence/state claim — "shows locked" — and a held blessing cannot be
 * staged on a live tavern from the debug bridge.
 */

import { describe, expect, it } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { useTargetActions } from '../useTargetActions';
import { WorldGraph } from '../../../../engine/graph';
import { actionCardModel } from '../../actionCardModel';
import { CardFace } from '../../../shared/CardFace';
import type { GameState } from '../../../../types/gameState';
import type { ControlEffect } from '../../../../types/controlEffect';
import type { TargetContext } from '../../../../types/targetContext';
import type { AscendantArchetype } from '../../../../types/influence';

const ASCENDANT = 'asc.test';
const TAVERN = 'loc.tavern';
const TEMPLATE = 'sub.sanctify_tavern';

const tavernTarget: TargetContext = {
  nodeId: TAVERN,
  nodeType: 'location',
  displayName: 'The Lantern',
  displayLabel: 'tavern',
  subtype: 'sublocation',
  traitIds: [],
  sphereAffinity: null,
  position: null,
  properties: { sublocationTypeId: 'sublocation-type.tavern' },
};

const archetype = {
  sphereAlignment: { primary: 'life', secondary: 'spirit' },
} as unknown as AscendantArchetype;

function heldBlessing(overrides: Partial<ControlEffect> = {}): ControlEffect {
  return {
    effectId: 'ctrl_1',
    templateId: TEMPLATE,
    ownerId: ASCENDANT,
    targetHexCol: 0,
    targetHexRow: 0,
    targetNodeId: TAVERN,
    establishedTick: 1,
    ritualEssenceInvested: 15,
    perTickCost: { life: 1 },
    perTickMutations: [],
    perTickGraphOps: [],
    active: true,
    ticksActive: 4,
    narrativeTemplates: { established: '', active: '', lapsed: '' },
    ...overrides,
  };
}

function gameStateWith(controlEffects: ControlEffect[]): GameState {
  return {
    graph: new WorldGraph(),
    ascendantId: ASCENDANT,
    essencePool: { mind: 50, spirit: 50, force: 50, life: 50, order: 50, chaos: 50, time: 50, void: 50 },
    hexRevelation: {},
    unlockedActionIds: [TEMPLATE],
    controlEffects,
  } as unknown as GameState;
}

function blessingSlot(controlEffects: ControlEffect[]) {
  const { result } = renderHook(() => useTargetActions({
    target: tavernTarget,
    gameState: gameStateWith(controlEffects),
    archetype,
    drawerOpen: true,
  }));
  return result.current?.find(s => s.templateId === TEMPLATE);
}

describe('useTargetActions — held lock (THR-1700)', () => {
  it('locks Hearthfire Blessing on a tavern the god already blesses, and the card says so', () => {
    const slot = blessingSlot([heldBlessing()]);
    expect(slot).toBeDefined();
    expect(slot!.available).toBe(false);
    expect(slot!.lockedReason).toBe('Already held');

    const model = actionCardModel(slot!);
    expect(model.disabled || model.dimmed).toBe(true);
    render(<CardFace model={model} designerView={false} onToggle={() => {}} />);
    expect(screen.getByText('Already held')).toBeTruthy();
  });

  it('offers the blessing as castable when none is held there', () => {
    const slot = blessingSlot([]);
    expect(slot).toBeDefined();
    expect(slot!.available).toBe(true);
    expect(slot!.lockedReason).toBeNull();

    render(<CardFace model={actionCardModel(slot!)} designerView={false} onToggle={() => {}} />);
    expect(screen.queryByText('Already held')).toBeNull();
  });

  it('offers it again once the held blessing has lapsed', () => {
    const slot = blessingSlot([heldBlessing({ active: false })]);
    expect(slot!.available).toBe(true);
  });
});
