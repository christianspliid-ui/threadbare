// @vitest-environment jsdom
/**
 * THR-2186 — "See the work" lands on the work. The Inspector opens on the body tab a link
 * asks for: the history entry carries it, back/forward restore it, re-asking switches to
 * it, and an unknown tab falls back to the first tab without an error. With no tab the
 * sheet opens on Overview exactly as before. The two sheet rows that open nothing stop
 * promising a jump.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { HexTile } from '../../../../types';
import { GameScreenStateProvider, useGameScreenStore, type GameScreenStore } from '../../frame/GameScreenState';
import { InspectorHost } from '../InspectorHost';
import { startTabOf } from '../InspectorPage';
import { INITIAL_INSPECTOR_STATE, currentEntry, goBack, goForward, nameEntry, openFromMap, openSubject } from '../inspectorState';
import { UI_TOOLTIPS } from '../../../../data/ui-content';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hooksDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../hooks');

const ASC = 'asc';
const shutash = { kind: 'agent', id: 'shutash' } as const;
const kael = { kind: 'agent', id: 'kael' } as const;

function world(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'shutash', type: 'actor', name: 'Shutash', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'at1', source: 'shutash', target: 'quarter', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'at2', source: 'kael', target: 'quarter', type: 'located_at', properties: {} });
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

function mount() {
  let store!: GameScreenStore;
  const gameState = world();
  function Harness() {
    const s = useGameScreenStore();
    store = s;
    return (
      <GameScreenStateProvider value={s}>
        <InspectorHost gameState={gameState} runtime={null} extras={{}} onCast={vi.fn(() => ({ cast: true, reason: null }))} onShowOnMap={() => {}} />
      </GameScreenStateProvider>
    );
  }
  const utils = render(<Harness />);
  return { ...utils, store: () => store };
}

function activeTab(container: HTMLElement): string | null {
  return container.querySelector('[data-inspector-host] [role="tab"][aria-selected="true"]')?.textContent ?? null;
}

function firstRowLabel(container: HTMLElement): string | null {
  const panel = container.querySelector('[data-inspector-host] [role="tabpanel"]:not([hidden])');
  return panel?.querySelector('[data-section-label]')?.textContent ?? null;
}

describe('inspectorState — the tab rides the history entry (THR-2186)', () => {
  it('a new entry carries the asked tab; no tab leaves the entry as before', () => {
    const s = openSubject(INITIAL_INSPECTOR_STATE, shutash, 'wide', 'journey');
    expect(currentEntry(s)?.tab).toBe('journey');
    const plain = openSubject(INITIAL_INSPECTOR_STATE, shutash, 'wide');
    expect(currentEntry(plain)).toEqual({ subject: shutash, key: 'agent:shutash', name: '' });
  });

  it('re-asking the shown subject for a tab switches it and bumps the sequence; no tab is a no-op', () => {
    let s = openSubject(INITIAL_INSPECTOR_STATE, shutash, 'wide', 'journey');
    s = openSubject(s, shutash, 'wide', 'chronicle');
    expect(s.history).toHaveLength(1);
    expect(currentEntry(s)?.tab).toBe('chronicle');
    expect(currentEntry(s)?.tabSeq).toBe(1);
    s = openSubject(s, shutash, 'wide', 'chronicle');
    expect(currentEntry(s)?.tabSeq).toBe(2);
    expect(openSubject(s, shutash, 'wide')).toBe(s);
  });

  it('back and forward restore each entry\'s tab, and naming the entry keeps it', () => {
    let s = openSubject(INITIAL_INSPECTOR_STATE, shutash, 'wide', 'journey');
    s = nameEntry(s, 'agent:shutash', 'Shutash');
    s = openSubject(s, kael, 'wide', 'chronicle');
    s = goBack(s);
    expect(currentEntry(s)?.tab).toBe('journey');
    expect(currentEntry(s)?.name).toBe('Shutash');
    s = goForward(s);
    expect(currentEntry(s)?.tab).toBe('chronicle');
  });

  it('a map open passes the tab through unless pinned', () => {
    expect(currentEntry(openFromMap(INITIAL_INSPECTOR_STATE, shutash, 'docked', 'journey'))?.tab).toBe('journey');
  });

  it('startTabOf: the asked tab when drawn, else the first tab', () => {
    const tabs = [{ id: 'overview' }, { id: 'journey' }];
    expect(startTabOf(tabs, 'journey')).toBe('journey');
    expect(startTabOf(tabs, 'nope')).toBe('overview');
    expect(startTabOf(tabs, undefined)).toBe('overview');
    expect(startTabOf([], 'journey')).toBe('overview');
  });
});

describe('InspectorHost — opens on the asked tab (THR-2186)', () => {
  it('"See the work →" (journey) opens on Journey with "The work" as the first row', () => {
    const { container, store } = mount();
    act(() => store().setInspector(s => openSubject(s, shutash, 'wide', 'journey')));
    expect(activeTab(container)).toBe('Journey');
    expect(firstRowLabel(container)).toBe('The work');
  });

  it('chronicle opens on Chronicle; no tab opens on Overview as before', () => {
    const a = mount();
    act(() => a.store().setInspector(s => openSubject(s, shutash, 'wide', 'chronicle')));
    expect(activeTab(a.container)).toBe('Chronicle');
    a.unmount();
    const b = mount();
    act(() => b.store().setInspector(s => openSubject(s, shutash, 'wide')));
    const tabs = Array.from(b.container.querySelectorAll('[data-inspector-host] [role="tab"]'));
    expect(tabs.length).toBeGreaterThan(1);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('an unknown tab id opens on the first tab without an error', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, store } = mount();
    act(() => store().setInspector(s => openSubject(s, shutash, 'wide', 'no-such-tab')));
    const tabs = Array.from(container.querySelectorAll('[data-inspector-host] [role="tab"]'));
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('re-asking for Journey after the player clicked away jumps back to it', () => {
    const { container, store } = mount();
    act(() => store().setInspector(s => openSubject(s, shutash, 'wide', 'journey')));
    const overview = container.querySelector<HTMLElement>('[data-inspector-host] [role="tab"]')!;
    fireEvent.click(overview);
    expect(activeTab(container)).not.toBe('Journey');
    act(() => store().setInspector(s => openSubject(s, shutash, 'wide', 'journey')));
    expect(activeTab(container)).toBe('Journey');
  });
});

describe('the sheet rows stop promising a jump (THR-2186)', () => {
  it('neither ui.thread_work nor ui.thread_want_most says "Opens"', () => {
    expect(UI_TOOLTIPS['ui.thread_work'].desc).not.toMatch(/Opens/);
    expect(UI_TOOLTIPS['ui.thread_want_most'].desc).not.toMatch(/Opens/);
    expect(UI_TOOLTIPS['ui.thread_work'].desc).toContain('The Journey tab tells it in full.');
    expect(UI_TOOLTIPS['ui.thread_want_most'].desc).toContain('The Journey tab tells it in full.');
  });
});

describe('the sheet openers pass their tab to the Inspector (THR-2186)', () => {
  // openAgentSheetForId / handleViewProfile used to drop the tab on the Inspector path.
  const src = readFileSync(resolve(hooksDir, 'useAgentInteraction.ts'), 'utf8');
  it('openAgentSheetForId forwards initialTab', () => {
    expect(src).toMatch(/const openAgentSheetForId = [\s\S]*?openInspector\(\{ kind: 'agent', id: agentId \}, 'wide', false, initialTab\)/);
  });
  it('handleViewProfile forwards its tab', () => {
    expect(src).toMatch(/const handleViewProfile = [\s\S]*?openInspector\(\{ kind: 'agent', id: selectedAgentId \}, 'wide', false, tab\)/);
  });
});
