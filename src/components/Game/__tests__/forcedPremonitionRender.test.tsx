// @vitest-environment jsdom
/**
 * THR-1414 — the forced whisper renders on the real surface.
 *
 * `window.__DEBUG.forcePremonition(agent, 'whisper')` queues whatever
 * `buildWhisperPremonition` produces, with `showAfterTick` pulled to the current
 * tick so the modal opens without ticking. This asserts the two halves of that
 * claim against the shipped `PremonitionModal`:
 *
 *   1. a premonition built by the real engine builder (not a hand-written literal)
 *      renders its vignette and every nudge option it carries; and
 *   2. `showAfterTick === tick`, which is what makes GameView's `activePremonition`
 *      memo select it on the very next render.
 *
 * Browser-verify substitution: jsdom-render — unattended run, no startable dev server.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PremonitionModal } from '../PremonitionModal';
import { buildWhisperPremonition } from '../../../engine/phaseDivinePremonition';
import { WorldGraph } from '../../../engine/graph';
import { mulberry32 } from '../../../lib/prng';
import { PREMONITION_EXPIRY_TICKS } from '../../../data/premonition-constants';
import { SPHERE_NAMES } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';

const AGENT_ID = 'agent-kael';
const AGENT_NAME = 'Kael Thornweaver';
const TICK = 40;

const ESSENCE: EssencePool = Object.fromEntries(
  SPHERE_NAMES.map(s => [s, 10]),
) as EssencePool;

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: AGENT_NAME,
    properties: {
      actorType: 'individual',
      // Below GATHER_STRENGTH_QUINTESSENCE_THRESHOLD, so the builder has at least
      // one candidate to work with without depending on ambition state.
      quintessence: 0.4,
      domainCapabilities: { stone: 0.4, heart: 0.3 },
    },
  });
  return {
    graph,
    tick: TICK,
    ascendantId: 'ascendant-1',
    unifiedActions: [],
    encounterProgress: [],
    premonitionQueue: [],
  } as unknown as GameState;
}

/** Stage a whisper exactly the way the debug lever does. */
function forceWhisper() {
  const state = makeState();
  const agent = state.graph.getNode(AGENT_ID)!;
  const built = buildWhisperPremonition(agent, state, mulberry32(1234));
  if (!built) throw new Error('builder produced no whisper — the fixture has no nudge candidates');
  return {
    ...built,
    showAfterTick: state.tick,
    eligibleUntilTick: state.tick + PREMONITION_EXPIRY_TICKS,
  };
}

describe('THR-1414 — a forced whisper on the PremonitionModal', () => {
  it('is visible on the tick it was staged, with no display delay to wait out', () => {
    const premonition = forceWhisper();
    // The whole point of the lever: GameView selects on `tick >= showAfterTick`,
    // so a forced whisper must not carry the usual +10.
    expect(premonition.showAfterTick).toBe(TICK);
    expect(premonition.eligibleUntilTick).toBeGreaterThan(TICK);
  });

  it('renders the engine-built vignette and every nudge option it carries', () => {
    const premonition = forceWhisper();
    render(
      <PremonitionModal
        open
        premonition={premonition}
        essencePool={ESSENCE}
        graph={makeState().graph}
        onWhisperChoice={vi.fn()}
        onCompulsionChoice={vi.fn()}
        onViewAgent={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    // The prose the engine generated, not a literal this test authored.
    expect(screen.getByText(premonition.vignetteProse)).toBeTruthy();

    const options = premonition.whisperOptions ?? [];
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(screen.getByText(option.prose)).toBeTruthy();
    }
    expect(screen.getByText(AGENT_NAME)).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    // Falsification arm: without this, the assertions above would also pass on a
    // surface that ignores `open` and always paints.
    const premonition = forceWhisper();
    render(
      <PremonitionModal
        open={false}
        premonition={premonition}
        essencePool={ESSENCE}
        graph={makeState().graph}
        onWhisperChoice={vi.fn()}
        onCompulsionChoice={vi.fn()}
        onViewAgent={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.queryByText(premonition.vignetteProse)).toBeNull();
  });
});
