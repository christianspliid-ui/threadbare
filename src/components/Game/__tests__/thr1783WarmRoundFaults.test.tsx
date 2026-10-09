// @vitest-environment jsdom
/**
 * THR-1783 — two faults from warm playtest round 1.
 *
 * 1. The God's Will / whisper prices read "3 essence" without naming the pool
 *    each option bills, and the engine charged `state.essencePool` in place,
 *    outside `setGameState`.
 * 2. The First's "Asks you / Lives on" control read as a status label; it now
 *    exposes itself as a switch.
 */

import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PremonitionModal } from '../PremonitionModal';
import { AutoToggle } from '../ThreadsPanel';
import { WorldGraph } from '../../../engine/graph';
import {
  applyCompulsionChoice,
  applyWhisperChoice,
  spendPremonitionEssence,
} from '../../../engine/premonitionActions';
import { SPHERE_NAMES } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';
import type { CompulsionCandidate, PremonitionEvent, WhisperNudge } from '../../../types/premonition';

const AGENT_ID = 'agent-kael';

function funded(n: number): EssencePool {
  return Object.fromEntries(SPHERE_NAMES.map(s => [s, n])) as EssencePool;
}

const FORCE_CANDIDATE: CompulsionCandidate = {
  templateId: 'encounter.slice.unsafe_bridge',
  encounterName: 'The Unsafe Bridge',
  encounterHook: 'The planks have been loose since the thaw.',
  encounterType: 'explore',
  reach: 'iron',
  sphere: 'force',
  threatRating: 'fair',
  hexDistance: 1,
  score: 0.4,
  essenceCost: 3,
  locationId: 'loc-1',
  locationName: 'Fenmarch Crossing',
};

const LIFE_NUDGE: WhisperNudge = {
  category: 'reach_bias',
  targetReach: 'stone',
  essenceCost: 2,
  sphere: 'life',
  prose: 'Turn them toward the wall',
  flavorText: 'The stones remember hands.',
};

const BASE: PremonitionEvent = {
  id: 'prem-1',
  type: 'compulsion',
  agentId: AGENT_ID,
  agentName: 'Kael Thornweaver',
  tick: 12,
  showAfterTick: 12,
  eligibleUntilTick: 24,
  vignetteProse: 'A road unwalked turns in the sleeping mind.',
  compulsionCandidates: [FORCE_CANDIDATE],
};

function renderModal(premonition: PremonitionEvent) {
  return render(
    <PremonitionModal
      open
      premonition={premonition}
      essencePool={funded(10)}
      onWhisperChoice={vi.fn()}
      onCompulsionChoice={vi.fn()}
      onDismiss={vi.fn()}
    />,
  );
}

function makeState(pool: EssencePool): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: AGENT_ID, type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
  return { graph, essencePool: pool, tick: 12 } as unknown as GameState;
}

describe('premonition prices name the pool they bill (THR-1783)', () => {
  it('a Force compulsion option reads "3 Force essence"', () => {
    renderModal(BASE);
    expect(screen.getByTestId('premonition-option-cost').textContent).toBe('3 Force essence');
  });

  it('a Life whisper option reads "2 Life essence"', () => {
    renderModal({ ...BASE, type: 'whisper', compulsionCandidates: undefined, whisperOptions: [LIFE_NUDGE] });
    expect(screen.getByTestId('premonition-option-cost').textContent).toBe('2 Life essence');
  });
});

describe('premonition spend goes through state, not in place (THR-1783)', () => {
  it('applyCompulsionChoice leaves the pool untouched and reports the spend', () => {
    const pool = funded(10);
    const state = makeState(pool);
    const result = applyCompulsionChoice(state, AGENT_ID, 'Kael Thornweaver', FORCE_CANDIDATE);
    expect(result.success).toBe(true);
    expect(result.essenceSpent).toBe(3);
    expect(state.essencePool).toBe(pool);
    expect(pool.force).toBe(10);
  });

  it('applyWhisperChoice leaves the pool untouched and reports the spend', () => {
    const pool = funded(10);
    const state = makeState(pool);
    const result = applyWhisperChoice(state, AGENT_ID, 'Kael Thornweaver', LIFE_NUDGE);
    expect(result.success).toBe(true);
    expect(result.essenceSpent).toBe(2);
    expect(pool.life).toBe(10);
  });

  it('an unaffordable choice still refuses', () => {
    const state = makeState(funded(1));
    expect(applyCompulsionChoice(state, AGENT_ID, 'Kael Thornweaver', FORCE_CANDIDATE).success).toBe(false);
  });

  it('spendPremonitionEssence returns a new pool billed on the named sphere only', () => {
    const pool = funded(10);
    const next = spendPremonitionEssence(pool, 'force', 3);
    expect(next).not.toBe(pool);
    expect(next.force).toBe(7);
    expect(next.life).toBe(10);
    expect(pool.force).toBe(10);
  });

  it('spendPremonitionEssence fails soft on an unaffordable or empty cost', () => {
    const pool = funded(2);
    expect(spendPremonitionEssence(pool, 'force', 3)).toBe(pool);
    expect(spendPremonitionEssence(pool, 'force', 0)).toBe(pool);
  });
});

function SwitchHarness({ initial }: { initial: boolean }) {
  const [asking, setAsking] = useState(initial);
  return <AutoToggle asking={asking} name="Kael" onToggle={() => { setAsking(a => !a); return { ok: true }; }} />;
}

describe('attention toggle is a switch (THR-1783)', () => {
  it('exposes role="switch" with aria-checked tracking Asks you', () => {
    render(<SwitchHarness initial />);
    const control = screen.getByRole('switch');
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.textContent).toContain('Asks you');
    fireEvent.click(control);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('switch').textContent).toContain('Lives on');
  });

  it('wears a visible border, not a transparent one', () => {
    render(<SwitchHarness initial={false} />);
    const control = screen.getByRole('switch');
    expect(control.style.border).not.toContain('transparent');
    expect(screen.getByTestId('attention-toggle-track')).not.toBeNull();
  });
});
