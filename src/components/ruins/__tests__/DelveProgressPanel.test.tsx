// @vitest-environment jsdom
/**
 * THR-1080 — the delve panel stopped speaking schema.
 *
 * This surface had no test either, and carried the most literal instance of
 * the Law 14 defect in the codebase: the emergence banner printed two
 * *truncated node ids* (`agentId.slice(0, 14)`) directly to the player. It
 * also rendered the `DelveScale` enum as a chip and two raw tick counts.
 *
 * The panel is a fixed-width absolutely-positioned overlay, so the closing
 * test pins the containment the wider replacement wording relies on — the
 * pixel capture is owed (impediment #546) and a layout claim in prose is not
 * evidence.
 */

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DelveProgressPanel } from '../DelveProgressPanel';
import type { GameState } from '../../../types/gameState';
import type { WorldGraph } from '../../../engine/graph';
import type { ActiveDelve } from '../../../engine/ruins/delveTypes';

const ASCENDANT = 'asc-1';

function makeGraph(names: Record<string, string>): WorldGraph {
  return {
    getOutgoingEdges: (source: string, type: string) =>
      source === ASCENDANT && type === 'thread' ? [{ target: 'agent-1' }] : [],
    getNode: (id: string) => (names[id] ? { id, name: names[id] } : undefined),
  } as unknown as WorldGraph;
}

function makeDelve(over: Partial<ActiveDelve> = {}): ActiveDelve {
  return {
    delveId: 'delve-1',
    agentId: 'agent-1',
    ruinId: 'ruin-1',
    ruinMagnitude: 0.5,
    sphereAlignment: 'spirit',
    archetype: 'vault',
    delveScale: 'major',
    beatIndex: 2,
    totalBeats: 5,
    startedTick: 1,
    nextBeatTick: 14,
    beatHistory: [],
    partialCount: 0,
    aborted: false,
    ...over,
  } as ActiveDelve;
}

function makeState(over: Partial<GameState> = {}): GameState {
  return { tick: 10, activeDelves: [makeDelve()], ...over } as unknown as GameState;
}

const NAMES = { 'agent-1': 'Vara Stonewake', 'ruin-1': 'Hollowbarrow' };

function renderPanel(state: GameState, names: Record<string, string> = NAMES) {
  return render(
    <DelveProgressPanel
      gameState={state}
      graph={makeGraph(names)}
      ascendantId={ASCENDANT}
      onStateUpdate={vi.fn()}
    />,
  );
}

describe('DelveProgressPanel — player-facing language (THR-1080)', () => {
  it('names the agent and the ruin instead of printing truncated node ids', () => {
    const { container } = renderPanel(
      makeState({
        pendingEmergenceDecision: {
          delveId: 'delve-1', agentId: 'agent-1', ruinId: 'ruin-1',
          ruinMagnitude: 0.5, sphereAlignment: 'spirit',
          consequenceRoll: 'transformed', autoFiresTick: 18,
        },
      } as Partial<GameState>),
    );
    const text = container.textContent ?? '';
    expect(text).toContain('Vara Stonewake');
    expect(text).toContain('Hollowbarrow');
    // The exact defect: `agent-1 · ruin-1`, sliced uuids shown to the player.
    expect(text).not.toContain('agent-1');
    expect(text).not.toContain('ruin-1');
  });

  it('fails open to plain English when a node is missing from the graph (NFP #4)', () => {
    const { container } = renderPanel(
      makeState({
        pendingEmergenceDecision: {
          delveId: 'delve-1', agentId: 'agent-gone', ruinId: 'ruin-gone',
          ruinMagnitude: 0.5, sphereAlignment: 'spirit',
          consequenceRoll: 'transformed', autoFiresTick: 18,
        },
      } as Partial<GameState>),
      {},
    );
    const text = container.textContent ?? '';
    expect(text).toContain('One of yours');
    expect(text).toContain('a ruin');
    expect(text).not.toContain('agent-gone');
  });

  it('says when the emergence auto-resolves in words, not ticks', () => {
    const { container } = renderPanel(
      makeState({
        pendingEmergenceDecision: {
          delveId: 'delve-1', agentId: 'agent-1', ruinId: 'ruin-1',
          ruinMagnitude: 0.5, sphereAlignment: 'spirit',
          consequenceRoll: 'transformed', autoFiresTick: 18,
        },
      } as Partial<GameState>),
    );
    const text = container.textContent ?? '';
    expect(text).toContain('auto-resolves as Let before long');
    expect(text).not.toMatch(/\d+ ticks?/);
  });

  it('renders the delve scale through the display vocabulary', () => {
    const { container } = renderPanel(makeState());
    expect(container.textContent).toContain('Major');
    // The chip printed the bare enum key.
    expect(container.textContent).not.toContain('major');
  });

  it('counts down to the next beat in words', () => {
    // tick 10, nextBeatTick 14 -> 4 ticks -> the middle duration band.
    const { container } = renderPanel(makeState());
    expect(container.textContent).toContain('Next beat shortly');
    expect(container.textContent).not.toMatch(/\d+ ticks?/);
  });

  it('still says "Resolving…" when the next beat is due this tick', () => {
    const { container } = renderPanel(
      makeState({ activeDelves: [makeDelve({ nextBeatTick: 10 })] } as Partial<GameState>),
    );
    expect(container.textContent).toContain('Resolving…');
  });

  it('keeps the overlay scroll-bounded, so wider wording wraps rather than overflows', () => {
    // The pixel capture is owed (impediment #546). The replacement strings are
    // longer than the ids and numerals they replace, so what must hold is that
    // the panel is still a fixed-width, height-capped, scrolling container —
    // which makes horizontal overflow unreachable and vertical growth bounded.
    const { container } = renderPanel(makeState());
    const panel = container.querySelector('[aria-label="Active delves panel"]') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.width).toBe('320px');
    expect(panel.style.overflowY).toBe('auto');
    expect(panel.style.maxHeight).toBe('420px');
  });
});
