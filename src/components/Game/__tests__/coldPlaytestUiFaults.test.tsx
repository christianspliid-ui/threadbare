// @vitest-environment jsdom
/**
 * THR-1604 — three of the five interface faults the first cold playtest hit.
 * (The Cast-button jump is asserted in ActionDrawer.test.tsx and the Enter-to-
 * submit name in Remembrance/__tests__/OriginBeat.enter.test.tsx.)
 *
 *  - The "Rivals" / "Notables" words beside their icons did nothing; testers
 *    clicked the word and concluded the panel was broken.
 *  - The Chapter Ledger launcher showed every archived encounter in the world
 *    ("416") beside a ledger whose default view said "No chapters yet".
 *  - Nothing offered a way back to the title screen.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RivalsButton } from '../RivalsButton';
import { NotablesButton } from '../NotablesButton';
import { SettingsPanel } from '../SettingsPanel';
import { countThreadedChapters } from '../ChapterLedger';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { GameState } from '../../../types/gameState';

describe('Rivals / Notables chip labels open their panels (THR-1604)', () => {
  it('opens the Rivals panel from the word, not only the icon', () => {
    render(<RivalsButton definitions={[]} states={[]} />);
    expect(screen.queryByText(/No rival gods stir/)).toBeNull();
    fireEvent.click(screen.getByTestId('rivals-chip-label'));
    expect(screen.getByText(/No rival gods stir/)).toBeTruthy();
  });

  it('opens the Notables panel from the word, not only the icon', () => {
    const gameState = { activeCompositions: [] } as unknown as GameState;
    render(<NotablesButton gameState={gameState} />);
    expect(screen.queryByTestId('dropdown-panel')).toBeNull();
    fireEvent.click(screen.getByTestId('notables-chip-label'));
    expect(screen.getByTestId('dropdown-panel')).toBeTruthy();
  });
});

describe('Chapter Ledger badge counts what the ledger lists (THR-1604)', () => {
  function chapter(id: string, threaded: boolean): ChapterRecord {
    return { actionId: id, threaded } as unknown as ChapterRecord;
  }

  it('counts threaded chapters only, so an unthreaded archive reads zero', () => {
    const gameState = {
      chapterArchive: [chapter('a', false), chapter('b', false), chapter('c', true)],
      unifiedActions: [],
      ascendantId: 'asc',
      graph: { getIncomingEdges: () => [] },
    } as unknown as GameState;
    expect(countThreadedChapters(gameState)).toBe(1);
  });

  it('reads zero on a world with no archive and no ascendant', () => {
    const gameState = { unifiedActions: [], graph: { getIncomingEdges: () => [] } } as unknown as GameState;
    expect(countThreadedChapters(gameState)).toBe(0);
  });
});

describe('Settings — Return to title (THR-1604)', () => {
  function baseProps() {
    return {
      open: true,
      onClose: vi.fn(),
      fogDisabled: false,
      onToggleFog: vi.fn(),
      debugPanelOpen: false,
      onToggleDebug: vi.fn(),
      showOrganicShore: false,
      onToggleOrganicShore: vi.fn(),
      musicVolume: 0.5,
      onMusicVolume: vi.fn(),
      bgVolume: 0.5,
      onBgVolume: vi.fn(),
      uiVolume: 0.5,
      onUiVolume: vi.fn(),
      audioMuted: false,
      onToggleAudioMute: vi.fn(),
    };
  }

  it('is absent when the exit is not wired', () => {
    render(<SettingsPanel {...baseProps()} />);
    expect(screen.queryByTestId('exit-to-title')).toBeNull();
  });

  it('asks first, says the world will be lost, and only then leaves', () => {
    const onExit = vi.fn();
    render(<SettingsPanel {...baseProps()} onExitToTitle={onExit} />);
    fireEvent.click(screen.getByTestId('exit-to-title'));
    expect(onExit).not.toHaveBeenCalled();
    expect(screen.getByTestId('exit-to-title-confirm').textContent).toMatch(/This world will be lost/);
    fireEvent.click(screen.getByTestId('exit-to-title-yes'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('stays in the world when the confirm is declined', () => {
    const onExit = vi.fn();
    render(<SettingsPanel {...baseProps()} onExitToTitle={onExit} />);
    fireEvent.click(screen.getByTestId('exit-to-title'));
    fireEvent.click(screen.getByTestId('exit-to-title-cancel'));
    expect(onExit).not.toHaveBeenCalled();
    expect(screen.getByTestId('exit-to-title')).toBeTruthy();
  });
});
