// @vitest-environment jsdom
/**
 * THR-1844 — *The world remembers*, the first Remembrance step from run 2 on.
 * Plan § Done when, slice 3 (the jsdom half; the 1920×1080 capture is the browser half).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WorldRemembersBeat } from '../WorldRemembersBeat';
import { RemembranceFlow } from '../RemembranceFlow';
import { SAMPLE_UNSEALED_CARD_IDS, sampleAccount } from '../../../engine/accountStore';
import { emptyAccount } from '../../../engine/accountRecord';
import { HUNGER_CATALOG } from '../../../data/hunger-catalog';
import { WORLD_REMEMBERS_WORDS } from '../../../data/account-content';

describe('WorldRemembersBeat', () => {
  it('lists every live map echo with its memory word, the twelve hunger chips and the two unsealed cards', () => {
    const account = sampleAccount();
    render(<WorldRemembersBeat account={account} onContinue={vi.fn()} />);
    for (const def of account.echoDefinitions) {
      expect(screen.getByTestId(`world-remembers-echo-${def.id}`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId('world-remembers-memory').map(n => n.textContent)).toEqual([
      'Memory: still warm',
      'Memory: fading',
      'Memory: almost gone',
    ]);
    expect(screen.getAllByTestId(/^world-remembers-hunger-/)).toHaveLength(HUNGER_CATALOG.length);
    for (const id of SAMPLE_UNSEALED_CARD_IDS) {
      expect(screen.getByTestId(`world-remembers-power-${id}`)).toBeInTheDocument();
    }
    // The opposed monument says what it will stand against before the god is chosen.
    expect(screen.getByTestId('world-remembers-echo-echo_sample_monument').textContent).toMatch(/stand against a god of Entropy/);
    // No number on the step (Law 13).
    expect(screen.getByTestId('world-remembers-stands').textContent).not.toMatch(/\d/);
    expect(screen.getByTestId('world-remembers-hungers').textContent).not.toMatch(/\d/);
  });

  it('holds Go on until a stirring hunger is chosen, then hands back that hunger', () => {
    const onContinue = vi.fn();
    render(<WorldRemembersBeat account={sampleAccount()} onContinue={onContinue} />);
    const goOn = screen.getByTestId('world-remembers-go-on');
    expect(goOn).toBeDisabled();
    expect(screen.getByTestId('world-remembers-go-on-reason').textContent).toBe(WORLD_REMEMBERS_WORDS.goOnBlocked);
    expect(screen.getByTestId('world-remembers-hunger-kindle').getAttribute('data-hunger-state')).toBe('stirs');

    fireEvent.click(screen.getByTestId('world-remembers-wake-kindle'));
    expect(screen.getByTestId('world-remembers-hunger-kindle').getAttribute('data-hunger-state')).toBe('awake');
    expect(screen.getByTestId('world-remembers-hunger-preserve').getAttribute('data-hunger-state')).toBe('asleep');
    expect(screen.getByTestId('world-remembers-woken').textContent).toBe('Kindle wakes.');

    // The choice stays changeable until Go on.
    fireEvent.click(screen.getByTestId('world-remembers-wake-preserve'));
    expect(screen.getByTestId('world-remembers-hunger-kindle').getAttribute('data-hunger-state')).toBe('asleep');
    fireEvent.click(goOn);
    expect(onContinue).toHaveBeenCalledWith('preserve');
  });

  it('nothing stirring: Go on is open at once and the powers section hides when none unsealed', () => {
    const account = { ...sampleAccount(), stirringHungerIds: [], lastRun: { ...sampleAccount().lastRun!, unsealedCardIds: [] } };
    const onContinue = vi.fn();
    render(<WorldRemembersBeat account={account} onContinue={onContinue} />);
    expect(screen.getByTestId('world-remembers-go-on')).not.toBeDisabled();
    expect(screen.queryByTestId('world-remembers-powers')).toBeNull();
    expect(screen.getByText(WORLD_REMEMBERS_WORDS.noneStirs)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('world-remembers-go-on'));
    expect(onContinue).toHaveBeenCalledWith(null);
  });
});

describe('RemembranceFlow — The world remembers opens run 2 on', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('a first run never sees the step', () => {
    render(<RemembranceFlow seed={42} account={emptyAccount(42)} onComplete={vi.fn()} />);
    expect(screen.queryByTestId('world-remembers')).toBeNull();
    expect(screen.getByText('You remember...')).toBeInTheDocument();
  });

  it('a remembered run opens on it, and Go on moves to Origin', async () => {
    render(<RemembranceFlow seed={42} account={sampleAccount()} onComplete={vi.fn()} />);
    expect(screen.getByTestId('world-remembers')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('world-remembers-wake-kindle'));
    await act(async () => { fireEvent.click(screen.getByTestId('world-remembers-go-on')); });
    expect(screen.queryByTestId('world-remembers')).toBeNull();
    expect(screen.getByText('You remember...')).toBeInTheDocument();
  });
});
