// @vitest-environment jsdom
/**
 * THR-1900 — the map keys run MAP_COMMANDS and stay inert in a text field, inside a
 * composite widget and under an open dialog (plan THR-1878 D9, Law 23).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, fireEvent, cleanup } from '@testing-library/react';
import { useMapHotkeys, bandCoversMap, setLastPointerTarget } from '../useMapHotkeys';
import { Modal } from '../../../shared/Modal';
import { Z_BAND } from '../../../shared/zBands';

afterEach(() => {
  setLastPointerTarget(null);
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

describe('useMapHotkeys — dialogs with no escape layer (review gate round 2)', () => {
  it('is inert while an aria-modal dialog is open, and while focus sits in any dialog', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const btn = document.createElement('button');
    dialog.appendChild(btn);
    document.body.appendChild(dialog);
    press('ArrowLeft');
    press('PageUp');
    dialog.setAttribute('aria-modal', 'false');
    btn.focus();
    press('Home', btn);
    expect(onCommand).not.toHaveBeenCalled();
    dialog.remove();
    press('PageUp');
    expect(onCommand).toHaveBeenCalledWith('zoom_in');
  });
});

describe('useMapHotkeys — scrollable panels keep their keys (review gate)', () => {
  function scrollingRail(): { rail: HTMLDivElement; row: HTMLDivElement } {
    const rail = document.createElement('div');
    rail.style.overflowY = 'auto';
    Object.defineProperty(rail, 'scrollHeight', { value: 900 });
    Object.defineProperty(rail, 'clientHeight', { value: 300 });
    const row = document.createElement('div');
    rail.appendChild(row);
    document.body.appendChild(rail);
    return { rail, row };
  }

  it('stands down after a click inside a panel that scrolls, and comes back after a click on the map', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    const { row } = scrollingRail();
    fireEvent.pointerDown(row);
    press('PageDown');
    press('ArrowDown');
    press('Home');
    expect(onCommand).not.toHaveBeenCalled();

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    fireEvent.pointerDown(canvas);
    press('PageDown');
    expect(onCommand).toHaveBeenCalledWith('zoom_out');
  });

  it('stands down while focus sits on a button inside a scrolling panel', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    const { row } = scrollingRail();
    const btn = document.createElement('button');
    row.appendChild(btn);
    btn.focus();
    press('ArrowUp', btn);
    expect(onCommand).not.toHaveBeenCalled();
  });

  it('a panel with nothing to scroll does not mute the keys', () => {
    const onCommand = vi.fn();
    renderHook(() => useMapHotkeys(onCommand));
    const rail = document.createElement('div');
    rail.style.overflowY = 'auto';
    document.body.appendChild(rail);
    fireEvent.pointerDown(rail);
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
