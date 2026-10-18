// @vitest-environment jsdom
/**
 * THR-1911 review-gate finding 1 — an intervention card cast from a person's page has no
 * drawer behind it, so `wheelSlots` is null. The cast carries its own slot, and the
 * agenda picker's confirm reads it: the intervention resolves instead of returning early
 * and leaving `pendingIntervention` stuck.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import type { WheelSlot } from '../../../engine/wheel';
import { WorldGraph } from '../../../engine/graph';

vi.mock('../hooks/useInterventionAudio', () => ({ useInterventionAudio: () => ({ playCastSound: vi.fn() }) }));

function state(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'The Weaver', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'agent_1', type: 'actor', name: 'Shutash', properties: { actorType: 'individual', narrativeArchetype: 'seeker', axiologicalProfile: { courage_prudence: 0.4, loyalty_ambition: 0.6 } } });
  return {
    graph, ascendantId: 'asc', tick: 3, seed: 42,
    essencePool: { mind: 50, spirit: 50, time: 10, life: 10, matter: 10, force: 10, energy: 10, entropy: 10 },
    recentEvents: [], familiarityMap: new Map(), unifiedActions: [], encounterProgress: [], agentKnowledge: new Map(),
  } as unknown as GameState;
}

const archetype = { id: 'a', name: 'The Weaver', sphereAlignment: { primary: 'mind', secondary: 'spirit' }, description: '' } as unknown as AscendantArchetype;

const slot: WheelSlot = {
  id: 'intervention_inspire', label: 'Inspire', type: 'intervention', angleDeg: 0, available: true, lockedReason: null,
  essenceCost: 2, sphere: 'mind', interventionType: 'inspire_intervention', rangeStatus: 'unlimited', hexDistance: null, description: '',
} as WheelSlot;

describe('an intervention cast from the Inspector (no drawer)', () => {
  it('carries its slot into the picker, and the confirm resolves it', () => {
    const setGameState = vi.fn();
    const openInspector = vi.fn();
    const { result } = renderHook(() => useAgentInteraction({ gameState: state(), setGameState, archetype, onOpenScry: vi.fn(), openInspector }));

    act(() => result.current.handleAgentSelect('agent_1'));
    expect(result.current.wheelSlots).toBeNull(); // the drawer never opens with the Inspector wired
    expect(openInspector).toHaveBeenCalledWith({ kind: 'agent', id: 'agent_1' }, 'docked');

    act(() => result.current.beginIntervention('agent_1', slot));
    expect(result.current.agendaPickerOpen).toBe(true);
    expect(result.current.pendingIntervention?.slot?.id).toBe('intervention_inspire');

    const agenda = result.current.pendingAgendas![0];
    act(() => result.current.handleAgendaSelect(agenda));
    act(() => result.current.handleInterventionConfirm());
    expect(setGameState).toHaveBeenCalled();
    expect(result.current.pendingIntervention).toBeNull();
  });
});
