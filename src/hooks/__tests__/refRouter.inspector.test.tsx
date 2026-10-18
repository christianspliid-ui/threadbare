// @vitest-environment jsdom
/**
 * THR-1911 (Inspector plan § D4, § D13) — with `openInspector` wired, the router's card
 * and sheet arms open the Inspector (the detail stack retired with THR-1912). One case per
 * route a caller can take through the router; the callers in § D13 all reach one of these
 * (map clicks and the selection handlers call the same `openInspector` directly).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { WorldGraph } from '../../engine/graph';
import type { NavigationTarget } from '../../types/notification';
import type { AnyRef } from '../../types/contentRef';
import { useRefRouter, type RefRouter } from '../useRefRouter';
import { SURFACE_BY_WORLD_REF } from '../../data/surface-registry';
import { WORLD_REF_KINDS, type WorldRefKind } from '../../types/worldRef';

function graph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'veiren', type: 'actor', name: 'Captain Veiren', properties: { actorType: 'individual' } });
  g.addNode({ id: 'guard', type: 'actor', name: 'The Iron Guard', properties: { actorType: 'faction' } });
  g.addNode({ id: 'market', type: 'location', name: 'The Iron Market', properties: {} });
  return g;
}

function mount(openSheet: (t: NavigationTarget) => boolean = () => false) {
  const openInspector = vi.fn();
  const openCodexEntry = vi.fn(() => true);
  let router!: RefRouter;
  function Harness() {
    router = useRefRouter({
      graph: graph(), tick: 1, seed: 42, openSheet, openCodexEntry, codexHasEntry: () => true, openInspector,
    });
    return null;
  }
  render(<Harness />);
  const open = (ref: AnyRef, mode?: 'card' | 'sheet') => act(() => { router.open(ref, mode); });
  return { open, openInspector, openCodexEntry, router: () => router };
}

describe('the router opens the Inspector (THR-1911)', () => {
  it.each(WORLD_REF_KINDS.map(k => [k] as [WorldRefKind]))('a %s card opens at its row size', (kind) => {
    const { open, openInspector } = mount();
    open({ kind, id: 'x' });
    expect(openInspector).toHaveBeenCalledWith({ kind, id: 'x' }, SURFACE_BY_WORLD_REF[kind].opensAt ?? 'docked');
  });

  it('factions and past events open wide as a card (THR-1827 call 12)', () => {
    for (const kind of ['faction', 'encounter', 'journey', 'receipt'] as const) {
      expect(SURFACE_BY_WORLD_REF[kind].opensAt).toBe('wide');
    }
    for (const kind of ['agent', 'location', 'sublocation', 'hex', 'artifact', 'army'] as const) {
      expect(SURFACE_BY_WORLD_REF[kind].opensAt ?? 'docked').toBe('docked');
    }
  });

  it.each(WORLD_REF_KINDS.filter(k => k !== 'encounter').map(k => [k] as [WorldRefKind]))('a %s sheet opens wide and never calls openSheet', (kind) => {
    const openSheet = vi.fn(() => true);
    const { open, openInspector } = mount(openSheet);
    open({ kind, id: 'x' }, 'sheet');
    expect(openInspector).toHaveBeenCalledWith({ kind, id: 'x' }, 'wide');
    expect(openSheet).not.toHaveBeenCalled();
  });

  it('a live encounter plays on the Stage (openSheet answers), and a past one opens its record wide', () => {
    const live = mount(() => true);
    live.open({ kind: 'encounter', id: 'e1' }, 'sheet');
    expect(live.openInspector).not.toHaveBeenCalled();

    const past = mount(() => false);
    past.open({ kind: 'encounter', id: 'e1' }, 'sheet');
    expect(past.openInspector).toHaveBeenCalledWith({ kind: 'encounter', id: 'e1' }, 'wide');
  });

  it('a content card opens docked; a content sheet still opens the Codex', () => {
    const { open, openInspector, openCodexEntry } = mount();
    open({ kind: 'action_template', id: 'divine.whisper' });
    expect(openInspector).toHaveBeenCalledWith({ kind: 'action_template', id: 'divine.whisper' }, 'docked');
    openInspector.mockClear();
    open({ kind: 'action_template', id: 'divine.whisper' }, 'sheet');
    expect(openCodexEntry).toHaveBeenCalledWith('divine.whisper');
    expect(openInspector).not.toHaveBeenCalled();
  });

  it('every world kind can open as a sheet (canOpen)', () => {
    const { router } = mount();
    for (const kind of WORLD_REF_KINDS) expect(router().canOpen({ kind, id: 'x' }, 'sheet')).toBe(true);
  });
});
