// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPanel } from '../SettingsPanel';

/** The panel's non-Trouble props, none of which this suite is about. */
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

describe('SettingsPanel — Trouble section (THR-1134)', () => {
  it('stays absent when the capture handler is not wired', () => {
    render(<SettingsPanel {...baseProps()} />);
    expect(screen.queryByText('Trouble')).toBeNull();
    expect(screen.queryByRole('button', { name: /save a snapshot/i })).toBeNull();
  });

  it('offers the three controls once wired', () => {
    render(
      <SettingsPanel
        {...baseProps()}
        recordingTrouble={false}
        onToggleRecordTrouble={vi.fn()}
        includeWorldInSnapshot={false}
        onToggleIncludeWorld={vi.fn()}
        onSaveSnapshot={vi.fn()}
      />,
    );
    expect(screen.getByText('Trouble')).toBeTruthy();
    expect(screen.getByText('Record what happens')).toBeTruthy();
    expect(screen.getByText('Include the whole world')).toBeTruthy();
    expect(screen.getByRole('button', { name: /save a snapshot/i })).toBeTruthy();
  });

  /**
   * Laws 13/14: no numerals on the surface. The cost of recording and the size of
   * the world tier are said in words; the figures live in the file and on the
   * ticket. This asserts on the section's own text so an unrelated numeral
   * elsewhere in the panel cannot make it pass or fail.
   */
  it('says the costs in words, with no numerals anywhere in the section', () => {
    render(
      <SettingsPanel
        {...baseProps()}
        recordingTrouble={false}
        onToggleRecordTrouble={vi.fn()}
        includeWorldInSnapshot={false}
        onToggleIncludeWorld={vi.fn()}
        onSaveSnapshot={vi.fn()}
      />,
    );
    expect(screen.getByText('Slows the world a little while it is on.')).toBeTruthy();
    expect(screen.getByText('A much larger file.')).toBeTruthy();

    const section = screen.getByText('Trouble').parentElement!;
    expect(section.textContent ?? '').not.toMatch(/[0-9]/);
  });

  it('reports each toggle state to assistive tech and fires its handler', () => {
    const onToggleRecordTrouble = vi.fn();
    const onToggleIncludeWorld = vi.fn();
    const onSaveSnapshot = vi.fn();
    render(
      <SettingsPanel
        {...baseProps()}
        recordingTrouble
        onToggleRecordTrouble={onToggleRecordTrouble}
        includeWorldInSnapshot={false}
        onToggleIncludeWorld={onToggleIncludeWorld}
        onSaveSnapshot={onSaveSnapshot}
      />,
    );

    const record = screen.getByRole('button', { name: /toggle recording what happens/i });
    const world = screen.getByRole('button', { name: /include the whole world in the snapshot/i });
    expect(record.getAttribute('aria-pressed')).toBe('true');
    expect(world.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(record);
    fireEvent.click(world);
    fireEvent.click(screen.getByRole('button', { name: /save a snapshot/i }));

    expect(onToggleRecordTrouble).toHaveBeenCalledTimes(1);
    expect(onToggleIncludeWorld).toHaveBeenCalledTimes(1);
    expect(onSaveSnapshot).toHaveBeenCalledTimes(1);
  });
});
