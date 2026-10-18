// @vitest-environment jsdom
/**
 * THR-1911 — the Inspector host, rendered on a real world through the real store: it
 * opens at its size, the toolbar walks history and sizes, the Act row casts in two beats
 * (Law 48) and Esc steps one size down.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { HexTile } from '../../../../types';
import { GameScreenStateProvider, useGameScreenStore, type GameScreenStore } from '../../frame/GameScreenState';
import { InspectorHost } from '../InspectorHost';
import { openSubject } from '../inspectorState';

const ASC = 'asc';

function world(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'shutash', type: 'actor', name: 'Shutash', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'at1', source: 'shutash', target: 'quarter', type: 'located_at', properties: {} });
  graph.addNode({ id: 'cong', type: 'actor', name: 'The Congregation', properties: { actorType: 'faction' } });
  return {
    graph,
    ascendantId: ASC,
    tick: 12,
    seed: 42,
    tiles: [{ coord: { col: 3, row: 4 }, terrain: 'grassland', elevation: 0.5, moisture: 0.5 } as unknown as HexTile],
    recentEvents: [],
    familiarityMap: new Map(),
    essencePool: { spirit: 50, mind: 50 },
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    ascendantIdentity: { sphereAlignment: { primary: 'spirit', secondary: 'mind' } },
  } as unknown as GameState;
}

function mount(onCast = vi.fn(() => ({ cast: true, reason: null }))) {
  let store!: GameScreenStore;
  function Harness() {
    const s = useGameScreenStore();
    store = s;
    return (
      <GameScreenStateProvider value={s}>
        <InspectorHost gameState={world()} runtime={null} extras={{}} onCast={onCast} onShowOnMap={() => {}} />
      </GameScreenStateProvider>
    );
  }
  const utils = render(<Harness />);
  return { ...utils, store: () => store, onCast };
}

describe('InspectorHost (THR-1911)', () => {
  it('renders nothing while closed, then the subject at its size', () => {
    const { container, store } = mount();
    expect(container.querySelector('[data-inspector-host]')).toBeNull();
    act(() => store().setInspector(s => openSubject(s, { kind: 'faction', id: 'cong' }, 'wide')));
    const host = container.querySelector('[data-inspector-host]')!;
    expect(host.getAttribute('data-inspector-size')).toBe('wide');
    expect(host.textContent).toContain('The Congregation');
  });

  it('back and forward walk the history; widen cycles the size; close empties it', () => {
    const { container, store, getByLabelText } = mount();
    act(() => store().setInspector(s => openSubject(openSubject(s, { kind: 'location', id: 'quarter' }, 'docked'), { kind: 'agent', id: 'shutash' }, 'docked')));
    expect(container.querySelector('[data-inspector-page]')?.getAttribute('data-inspector-page')).toBe('agent:shutash');
    fireEvent.click(getByLabelText('Back'));
    expect(container.querySelector('[data-inspector-page]')?.getAttribute('data-inspector-page')).toBe('location:quarter');
    fireEvent.click(getByLabelText('Forward'));
    expect(container.querySelector('[data-inspector-page]')?.getAttribute('data-inspector-page')).toBe('agent:shutash');
    fireEvent.click(getByLabelText('Widen'));
    expect(container.querySelector('[data-inspector-host]')?.getAttribute('data-inspector-size')).toBe('wide');
    fireEvent.click(getByLabelText('Full view'));
    expect(container.querySelector('[data-inspector-host]')?.getAttribute('data-inspector-size')).toBe('full');
    fireEvent.click(getByLabelText('Close'));
    expect(container.querySelector('[data-inspector-host]')).toBeNull();
  });

  it('Esc steps one size down, then closes', () => {
    const { container, store } = mount();
    act(() => store().setInspector(s => ({ ...openSubject(s, { kind: 'agent', id: 'shutash' }, 'wide') })));
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(container.querySelector('[data-inspector-host]')?.getAttribute('data-inspector-size')).toBe('docked');
    act(() => { fireEvent.keyDown(document, { key: 'Escape' }); });
    expect(container.querySelector('[data-inspector-host]')).toBeNull();
  });

  it('the Act row casts in two beats: arm, then "Cast on <name>" (Law 48)', () => {
    const { container, store, onCast } = mount();
    act(() => store().setInspector(s => openSubject(s, { kind: 'agent', id: 'shutash' }, 'docked')));
    const card = container.querySelector<HTMLElement>('[data-act-card][data-available="true"] button');
    expect(card, 'the person has at least one castable card').not.toBeNull();
    fireEvent.click(card!);
    expect(onCast).not.toHaveBeenCalled();
    const cast = container.querySelector<HTMLElement>('[data-act-cast]')!;
    expect(cast.textContent).toBe('Cast on Shutash');
    fireEvent.click(cast);
    expect(onCast).toHaveBeenCalledTimes(1);
    expect((onCast.mock.calls[0] as unknown[])[1]).toEqual({ kind: 'agent', id: 'shutash' });
  });
});
