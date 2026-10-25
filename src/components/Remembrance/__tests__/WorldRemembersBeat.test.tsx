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
import { emptyAccount, shownWorldSoulMemories } from '../../../engine/accountRecord';
import { TWILIGHT_MEMORIES_SHOWN } from '../../../data/game-config';
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

  // THR-1971 — the carried World-Soul memories get their reader.
  it('lists each shown World-Soul memory summary verbatim, strongest first, with its memory word', () => {
    const account = sampleAccount();
    const shown = shownWorldSoulMemories(account);
    expect(shown.length).toBe(TWILIGHT_MEMORIES_SHOWN);
    render(<WorldRemembersBeat account={account} onContinue={vi.fn()} />);
    const section = screen.getByTestId('world-remembers-soul');
    expect(section.querySelector('h2')?.textContent).toBe(WORLD_REMEMBERS_WORDS.soulHeading);
    expect(screen.getAllByTestId('world-remembers-soul-summary').map(n => n.textContent)).toEqual(shown.map(s => s.memory.summary));
    expect(shown.map(s => s.word)).toEqual(['still warm', 'still warm', 'fading']);
    // The memory past its last word is not shown.
    expect(section.textContent).not.toContain('An older war');
    expect(section.textContent).not.toMatch(/\d/);
  });

  it('no memories (a first run, or an empty record): no section and no empty heading', () => {
    const account = { ...sampleAccount(), resonance: { ...sampleAccount().resonance, memories: [] } };
    render(<WorldRemembersBeat account={account} onContinue={vi.fn()} />);
    expect(screen.queryByTestId('world-remembers-soul')).toBeNull();
    expect(screen.queryByText(WORLD_REMEMBERS_WORDS.soulHeading)).toBeNull();
    expect(shownWorldSoulMemories(emptyAccount(42))).toEqual([]);
  });
});

describe('shownWorldSoulMemories', () => {
  it('ranks by significance × (1 − degradation), caps at TWILIGHT_MEMORIES_SHOWN and drops wordless memories', () => {
    const base = sampleAccount();
    const mem = (id: string, significance: number, degradation: number) =>
      ({ id, cycleOrigin: 1, memoryType: 'betrayal' as const, spheres: [], summary: id, significance, degradation });
    const account = {
      ...base,
      resonance: { ...base.resonance, memories: [mem('a', 0.5, 0), mem('b', 0.9, 0.5), mem('c', 0.6, 0.1), mem('d', 0.4, 0), mem('gone', 1, 0.92)] },
    };
    expect(shownWorldSoulMemories(account).map(s => s.memory.id)).toEqual(['c', 'a', 'b']);
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
