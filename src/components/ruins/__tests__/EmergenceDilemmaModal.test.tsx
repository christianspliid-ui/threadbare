// @vitest-environment jsdom
/**
 * UI smoke test for EmergenceDilemmaModal (THR-153).
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EmergenceDilemmaModal } from '../EmergenceDilemmaModal';
import type { GameState } from '../../../types/gameState';
import type { DelveConsequenceRoll } from '../../../engine/ruins/delveTypes';

function makeState(roll: DelveConsequenceRoll): GameState {
  return {
    tick: 10,
    essencePool: {
      chaos: 50, order: 50, light: 50, darkness: 50,
      force: 0, matter: 0, energy: 0, life: 0,
      mind: 0, spirit: 50, time: 0, entropy: 0,
    },
    pendingEmergenceDecision: {
      delveId: 'd1',
      agentId: 'a1',
      ruinId: 'r1',
      ruinMagnitude: 0.5,
      sphereAlignment: 'spirit',
      consequenceRoll: roll,
      autoFiresTick: 18,
    },
  } as unknown as GameState;
}

describe('EmergenceDilemmaModal', () => {
  it('renders four choice buttons', () => {
    const onResolve = vi.fn();
    render(<EmergenceDilemmaModal gameState={makeState('transformed')} onResolve={onResolve} />);
    expect(screen.getByTestId('emergence-choice-let')).toBeTruthy();
    expect(screen.getByTestId('emergence-choice-claim')).toBeTruthy();
    expect(screen.getByTestId('emergence-choice-bargain')).toBeTruthy();
    expect(screen.getByTestId('emergence-choice-corrupt')).toBeTruthy();
  });

  it('disables claim / bargain / corrupt when consequenceRoll is not transformed', () => {
    const onResolve = vi.fn();
    render(<EmergenceDilemmaModal gameState={makeState('scarred')} onResolve={onResolve} />);
    expect(screen.getByTestId('emergence-choice-claim').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('emergence-choice-bargain').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('emergence-choice-corrupt').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('emergence-choice-let').hasAttribute('disabled')).toBe(false);
  });

  it('fires onResolve with the chosen option', () => {
    const onResolve = vi.fn();
    render(<EmergenceDilemmaModal gameState={makeState('transformed')} onResolve={onResolve} />);
    fireEvent.click(screen.getByTestId('emergence-choice-let'));
    expect(onResolve).toHaveBeenCalledWith('let');
  });

  it('renders nothing when no pendingEmergenceDecision', () => {
    const onResolve = vi.fn();
    const state = { ...makeState('transformed'), pendingEmergenceDecision: undefined };
    const { container } = render(
      <EmergenceDilemmaModal gameState={state as GameState} onResolve={onResolve} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

/**
 * THR-1080 — the surface stopped speaking schema.
 *
 * These assert the *composed* surface rather than the vocabulary (that is
 * pinned in `data/__tests__/ruin-words.test.ts`), because the three defects
 * were all render-site interpolations that a correct vocabulary would not
 * have prevented on its own.
 */
describe('EmergenceDilemmaModal — player-facing language (THR-1080)', () => {
  const ALL_ROLLS: DelveConsequenceRoll[] = [
    'catastrophic', 'scarred', 'marked', 'triumphant', 'transformed',
  ];

  // These assert against `document.body` because the surface is portalled, so
  // a leftover render from a previous case would be indistinguishable from
  // this one's output. Explicit rather than relying on auto-cleanup.
  afterEach(cleanup);

  it('never renders a raw consequenceRoll key in either leak site', () => {
    for (const roll of ALL_ROLLS) {
      const { unmount } = render(
        <EmergenceDilemmaModal gameState={makeState(roll)} onResolve={vi.fn()} />,
      );
      // `Modal` renders through a portal, so the surface is on document.body —
      // asserting against the render `container` here would pass against an
      // empty node and prove nothing.
      const surface = document.body.textContent ?? '';
      expect(surface, `surface for ${roll}`).not.toBe('');

      // The two exact defect shapes: the bare key as the header's fate token,
      // and the bare key completing the disabled-card sentence. Asserting the
      // key is absent *entirely* would be wrong — `left scarred` legitimately
      // contains `scarred`; it is presented copy, not a leaked key.
      expect(surface, `header leak for ${roll}`).not.toContain(`· ${roll}`);
      expect(surface, `sentence leak for ${roll}`).not.toContain(`the ruin was ${roll}.`);
      unmount();
    }
  });

  it('renders the fate through the display vocabulary in the header', () => {
    render(<EmergenceDilemmaModal gameState={makeState('transformed')} onResolve={vi.fn()} />);
    expect(screen.getByText(/Emergence Dilemma · Remade/)).toBeTruthy();
  });

  it('says how long is left in words, not ticks', () => {
    // tick 10, autoFiresTick 18 -> 8 ticks left -> the widest duration band.
    render(<EmergenceDilemmaModal gameState={makeState('transformed')} onResolve={vi.fn()} />);
    expect(screen.getByText('Auto-fires before long')).toBeTruthy();
    expect(screen.queryByText(/\d+ ticks?/)).toBeNull();
  });

  it('says "now" rather than a zero countdown when the deadline has passed', () => {
    const state = makeState('transformed');
    (state as { tick: number }).tick = 99; // well past autoFiresTick
    render(<EmergenceDilemmaModal gameState={state} onResolve={vi.fn()} />);
    expect(screen.getByText('Auto-firing now')).toBeTruthy();
  });

  it('shows the evaluated claim cost, never the formula', () => {
    // ruinMagnitude 0.5 x POP_CLAIM_COST_MULTIPLIER 20 = 10.
    render(<EmergenceDilemmaModal gameState={makeState('transformed')} onResolve={vi.fn()} />);
    const claimCard = screen.getByTestId('emergence-choice-claim');
    expect(claimCard.textContent).toContain('Costs 10 essence.');
    expect(claimCard.textContent).not.toContain('magnitude');
    expect(claimCard.textContent).not.toContain('×');
  });

  it('drops the key:value cost strip on every card (Law 16)', () => {
    render(<EmergenceDilemmaModal gameState={makeState('transformed')} onResolve={vi.fn()} />);
    for (const choice of ['let', 'claim', 'bargain', 'corrupt']) {
      const card = screen.getByTestId(`emergence-choice-${choice}`);
      expect(card.textContent, `${choice} card`).not.toMatch(/Essence:/);
      // Every cost now reads as a sentence.
      expect(card.textContent, `${choice} card`).toMatch(/Costs .*\./);
    }
  });

  it('explains an unclaimable outcome in game language', () => {
    render(<EmergenceDilemmaModal gameState={makeState('scarred')} onResolve={vi.fn()} />);
    expect(
      screen.getAllByText('This outcome cannot be claimed — the ruin was left scarred.').length,
    ).toBeGreaterThan(0);
  });
});
