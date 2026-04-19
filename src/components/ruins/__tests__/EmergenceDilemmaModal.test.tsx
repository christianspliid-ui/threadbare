// @vitest-environment jsdom
/**
 * UI smoke test for EmergenceDilemmaModal (THR-153).
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
