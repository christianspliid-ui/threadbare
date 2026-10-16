// @vitest-environment jsdom
/**
 * THR-1900 — the map keys run MAP_COMMANDS and stay inert in a text field, inside a
 * composite widget and under an open dialog (plan THR-1878 D9, Law 23).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, fireEvent, cleanup } from '@testing-library/react';
import { useMapHotkeys, bandCoversMap } from '../useMapHotkeys';
import { Modal } from '../../../shared/Modal';
import { Z_BAND } from '../../../shared/zBands';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

function press(key: string, target: EventTarget = document.body) {
  fireEvent.keyDown(target, { key });
}

describe('useMapHotkeys', () => {
  it('runs the command each key names', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    for (const key of ['PageUp', 'PageDown', 'Home', 'f', 'F', 'ArrowUp', 'ArrowLeft']) press(key);
    expect(onCommand.mock.calls.map(c => c[0])).toEqual([
      'zoom_in', 'zoom_out', 'centre_first', 'show_known_land', 'show_known_land', 'pan_up', 'pan_left',
    ]);
  });

  it('ignores other keys, modifier chords and Escape', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    press('+');
    press('w');
    press('Escape');
    fireEvent.keyDown(document.body, { key: 'PageUp', ctrlKey: true });
    expect(onCommand).not.toHaveBeenCalled();
  });

  it('is inert while focus is in a text field', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    press('Home', input);
    press('f', input);
    expect(onCommand).not.toHaveBeenCalled();
  });

  it('is inert inside a composite widget that uses the arrows itself', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    const list = document.createElement('div');
    list.setAttribute('role', 'tablist');
    const tab = document.createElement('button');
    list.appendChild(tab);
    document.body.appendChild(list);
    tab.focus();
    press('ArrowLeft', tab);
    press('Home', tab);
    expect(onCommand).not.toHaveBeenCalled();
  });

  it('is inert under an open dialog, and live again once it closes', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    const { unmount } = render(
      <Modal open onClose={() => {}} aria-label="Test dialog">
        <p>Body</p>
      </Modal>,
    );
    press('PageUp');
    expect(onCommand).not.toHaveBeenCalled();
    unmount();
    press('PageUp');
    expect(onCommand).toHaveBeenCalledWith('zoom_in');
  });
});

describe('bandCoversMap', () => {
  it('tooltips and in-map panels do not cover the map; drawers, the Stage and dialogs do', () => {
    expect(bandCoversMap(Z_BAND.mapOverlay)).toBe(false);
    expect(bandCoversMap(Z_BAND.tooltip)).toBe(false);
    expect(bandCoversMap(Z_BAND.drawer)).toBe(true);
    expect(bandCoversMap(Z_BAND.stage)).toBe(true);
    expect(bandCoversMap(Z_BAND.modal)).toBe(true);
    expect(bandCoversMap(Z_BAND.menu)).toBe(true);
  });
});
