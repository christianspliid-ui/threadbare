// @vitest-environment jsdom
/**
 * THR-1912 — a notification opens the Inspector.
 *
 * `Browser-verify substitution: jsdom-render` for the "opens from a notification" arm of
 * the S4 browser smoke: in the seeded run the debug levers kept a Stage encounter open and
 * no navigable toast surfaced in the session. The chain below is the real one — the
 * toast's `onNavigate` is `useNotificationNavigation(refRouter)`, and the router is the
 * real `useRefRouter` — so only the Inspector itself is a spy.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { useRefRouter } from '../../../hooks/useRefRouter';
import { useNotificationNavigation } from '../hooks/useNotificationNavigation';
import type { NavigationTarget } from '../../../types/notification';

function mount(openSheet: (t: NavigationTarget) => boolean = () => true) {
  const graph = new WorldGraph();
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  const openInspector = vi.fn();
  const { result } = renderHook(() => {
    const router = useRefRouter({ graph, tick: 1, seed: 42, openSheet, openInspector });
    return useNotificationNavigation(router);
  });
  return { navigate: (t: NavigationTarget) => act(() => { result.current(t); }), openInspector };
}

describe('a notification opens its subject in the Inspector (THR-1912)', () => {
  it('a person notification opens their page wide', () => {
    const { navigate, openInspector } = mount();
    navigate({ kind: 'agent', agentId: 'kael' });
    expect(openInspector).toHaveBeenCalledWith(expect.objectContaining({ kind: 'agent', id: 'kael' }), 'wide');
  });

  it('a hex notification opens the land page wide', () => {
    const { navigate, openInspector } = mount();
    navigate({ kind: 'hex', col: 3, row: 4 });
    expect(openInspector).toHaveBeenCalledWith(expect.objectContaining({ kind: 'hex' }), 'wide');
  });

  it('a live encounter notification plays on the Stage, not in the Inspector', () => {
    const openSheet = vi.fn(() => true);
    const { navigate, openInspector } = mount(openSheet);
    navigate({ kind: 'encounter', encounterId: 'enc-1' } as NavigationTarget);
    expect(openSheet).toHaveBeenCalledTimes(1);
    expect(openInspector).not.toHaveBeenCalled();
  });
});
