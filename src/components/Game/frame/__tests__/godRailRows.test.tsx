// @vitest-environment jsdom
/**
 * THR-1894 — the god rail drawn from GOD_RAIL_SECTIONS: pinned, the hand, folded rows
 * that start closed, open in place and persist (frame plan § F6, Done when slice 2).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { AscendantBar } from '../../ascendant-bar/AscendantBar';
import { initializeGameState } from '../../../../engine/gameInit';
import { generateArchetypes } from '../../../../engine/ascendant';
import { createBalancedCosmology } from '../../../../engine/cosmology';
import type { GameState } from '../../../../types/gameState';
import { GOD_RAIL_OPEN_ROWS_KEY } from '../../../../data/frame-registry';
import { ATTENTION_GAUGE_SHOWN } from '../../../../data/opening-reveal-table';

const archetype = generateArchetypes(4, 42)[0];
const { state } = initializeGameState(archetype, 'Vess', createBalancedCosmology(), 42, 16, 12);
const world = state as GameState;

function renderBar() {
  return render(
    <AscendantBar
      gameState={world}
      archetype={archetype}
      ascendantIdentity={null}
      avatarName="Vess"
      worldVersion={1}
      onOpenSheet={vi.fn()}
      onOpenMandate={vi.fn()}
    />,
  );
}

describe('the god rail from GOD_RAIL_SECTIONS', () => {
  beforeEach(() => localStorage.clear());

  it('draws the pinned sections, then the hand, then the folded rows, in list order', () => {
    renderBar();
    const rail = screen.getByTestId('god-rail');
    const order = [...rail.querySelectorAll<HTMLElement>('[data-god-rail-section]')].map((el) => el.dataset.godRailSection);
    expect(order.slice(0, 3)).toEqual(['identity', 'essence', 'hand']);
    expect(order).toContain('reaches');
    expect(rail.getAttribute('aria-label')).toBe('Ascendant status');
  });

  // THR-2060 U4: the gauge leaves until something spends Attention (ATTENTION_GAUGE_SHOWN).
  it('Attention sits under essence only while the gauge is shown', () => {
    renderBar();
    const essence = screen.getByTestId('god-rail').querySelector('[data-god-rail-section="essence"]')!;
    // THR-2062: no mortal on Lives on, so no tug can cost anything — no gauge.
    expect(essence.querySelector('[data-testid="god-rail-attention"]')).toBeNull();
  });

  it('THR-2062: the gauge appears once a mortal on Lives on is in the court', () => {
    const mortal = world.graph.getNodesByType('actor').find(n => n.properties.actorType === 'individual')!;
    world.graph.addEdge({
      id: 'thr2062_thread', source: world.ascendantId, target: mortal.id, type: 'thread',
      properties: { courtPosition: 'retinue', attentionMode: 'auto_resolve' },
    } as never);
    try {
      renderBar();
      const essence = screen.getByTestId('god-rail').querySelector('[data-god-rail-section="essence"]')!;
      expect(!!essence.querySelector('[data-testid="god-rail-attention"]')).toBe(ATTENTION_GAUGE_SHOWN);
    } finally {
      world.graph.removeEdge('thr2062_thread');
    }
  });

  it('every folded row starts closed, opens in place, and the open set persists across a reload', () => {
    renderBar();
    expect(screen.queryByTestId('god-rail-row-body-reaches')).toBeNull();
    fireEvent.click(screen.getByTestId('god-rail-row-reaches'));
    expect(screen.getByTestId('god-rail-row-body-reaches')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(GOD_RAIL_OPEN_ROWS_KEY) ?? '[]')).toEqual(['reaches']);
    cleanup();
    renderBar();
    expect(screen.getByTestId('god-rail-row-body-reaches')).toBeTruthy();
  });

  it('the Reaches row names the primary reach and its rung in one line', () => {
    renderBar();
    const summary = screen.getByTestId('god-rail-row-summary-reaches').textContent ?? '';
    expect(summary.length).toBeGreaterThan(0);
    expect(summary.length).toBeLessThanOrEqual(24);
  });
});
