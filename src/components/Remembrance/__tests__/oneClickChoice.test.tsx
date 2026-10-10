// @vitest-environment jsdom
/**
 * THR-1716 U4 — one-click remembrance. Each picture screen chooses on one click.
 * The stirring and drive screens hold the chosen picture with "Choose again" and
 * Escape before moving on; the origin and transformation screens still end in
 * their own Continue. Arrow keys move focus along a row, and Enter on a focused
 * picture is the button's native click, so a click on the focused button stands
 * in for it here (jsdom does not synthesise Enter → click).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StirringBeat } from '../StirringBeat';
import { DriveBeat } from '../DriveBeat';
import { OriginBeat } from '../OriginBeat';
import { TransformationBeat } from '../TransformationBeat';
import {
  STIRRING_CHOSEN_HOLD_MS,
  DRIVE_CHOSEN_HOLD_MS,
  ORIGIN_NAMING_REVEAL_MS,
  TRANSFORMATION_COURT_REVEAL_MS,
} from '../remembranceChoice';
import { HUNGER_CATALOG } from '../../../data/hunger-catalog';
import type { RemembranceFragment, StirringImage } from '../../../types/remembrance';

const images: StirringImage[] = [
  { id: 'stirring.a', imageAssetPath: '', fragmentClusters: [] },
  { id: 'stirring.b', imageAssetPath: '', fragmentClusters: [] },
];

function fragment(id: string, beat: 'origin' | 'drive'): RemembranceFragment {
  return {
    id, beat, prose: `prose of ${id}`, imageAssetPath: '',
    stirringClusters: [], tags: [], domainLeanings: [], sphereDirection: [], hungerWeights: {},
  } as unknown as RemembranceFragment;
}

const drives = [fragment('drive.a', 'drive'), fragment('drive.b', 'drive')];
const origins = [fragment('origin.a', 'origin'), fragment('origin.b', 'origin')];

beforeEach(() => vi.useFakeTimers());
/** THR-1804: the choice rows fade in and take no clicks until they are visible. */
const CARDS_FADE_IN_MS = 1000;
function revealCards() { act(() => { vi.advanceTimersByTime(CARDS_FADE_IN_MS); }); }
afterEach(() => vi.useRealTimers());

describe('StirringBeat — one click (THR-1716)', () => {
  it('one click chooses, and the flow moves on after the hold', () => {
    const onSelect = vi.fn();
    render(<StirringBeat images={images} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('stirring-stirring.a'));
    expect(screen.getByTestId('stirring-chosen-stirring.a')).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(STIRRING_CHOSEN_HOLD_MS); });
    expect(onSelect).toHaveBeenCalledWith(images[0]);
  });

  it('"Choose again" during the hold returns to the row and cancels the move', () => {
    const onSelect = vi.fn();
    render(<StirringBeat images={images} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('stirring-stirring.a'));
    fireEvent.click(screen.getByTestId('remembrance-choose-again'));
    expect(screen.getByTestId('stirring-stirring.b')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(STIRRING_CHOSEN_HOLD_MS * 2); });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Escape during the hold undoes the choice', () => {
    const onSelect = vi.fn();
    render(<StirringBeat images={images} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('stirring-stirring.b'));
    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => { vi.advanceTimersByTime(STIRRING_CHOSEN_HOLD_MS * 2); });
    expect(onSelect).not.toHaveBeenCalled();
    // Choose again, and this time let it run.
    fireEvent.click(screen.getByTestId('stirring-stirring.a'));
    act(() => { vi.advanceTimersByTime(STIRRING_CHOSEN_HOLD_MS); });
    expect(onSelect).toHaveBeenCalledWith(images[0]);
  });

  it('arrow keys move focus along the row; the focused picture chooses', () => {
    const onSelect = vi.fn();
    render(<StirringBeat images={images} onSelect={onSelect} />);
    const first = screen.getByTestId('stirring-stirring.a');
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByTestId('stirring-stirring.b'));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(first);
    fireEvent.click(document.activeElement!);
    act(() => { vi.advanceTimersByTime(STIRRING_CHOSEN_HOLD_MS); });
    expect(onSelect).toHaveBeenCalledWith(images[0]);
  });
});

describe('DriveBeat — one click (THR-1716)', () => {
  it('one click chooses, and the flow moves on after the hold', () => {
    const onSelect = vi.fn();
    render(<DriveBeat fragments={drives} onSelect={onSelect} />);
    revealCards();
    fireEvent.click(screen.getByTestId('drive-drive.b'));
    expect(screen.getByTestId('drive-chosen-drive.b')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(DRIVE_CHOSEN_HOLD_MS); });
    expect(onSelect).toHaveBeenCalledWith(drives[1]);
  });

  it('"Choose again" and Escape undo during the hold', () => {
    const onSelect = vi.fn();
    render(<DriveBeat fragments={drives} onSelect={onSelect} />);
    revealCards();
    fireEvent.click(screen.getByTestId('drive-drive.a'));
    fireEvent.click(screen.getByTestId('remembrance-choose-again'));
    fireEvent.click(screen.getByTestId('drive-drive.b'));
    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => { vi.advanceTimersByTime(DRIVE_CHOSEN_HOLD_MS * 2); });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByTestId('drive-drive.a')).toBeTruthy();
  });
});

describe('OriginBeat — one click, Continue still needed (THR-1716)', () => {
  it('one click chooses and reveals naming; nothing advances without Continue', () => {
    const onSelect = vi.fn();
    render(<OriginBeat fragments={origins} onSelect={onSelect} />);
    revealCards();
    fireEvent.click(screen.getByTestId('origin-origin.a'));
    act(() => { vi.advanceTimersByTime(ORIGIN_NAMING_REVEAL_MS * 5); });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId('mortal-name-input'), { target: { value: 'Maren' } });
    fireEvent.click(screen.getByTestId('origin-continue'));
    expect(onSelect).toHaveBeenCalledWith(origins[0], 'Maren');
  });

  it('before Continue, "Choose again" lets a different origin be chosen; the name is kept', () => {
    const onSelect = vi.fn();
    render(<OriginBeat fragments={origins} onSelect={onSelect} />);
    revealCards();
    fireEvent.click(screen.getByTestId('origin-origin.a'));
    act(() => { vi.advanceTimersByTime(ORIGIN_NAMING_REVEAL_MS); });
    fireEvent.change(screen.getByTestId('mortal-name-input'), { target: { value: 'Maren' } });
    fireEvent.click(screen.getByTestId('remembrance-choose-again'));
    fireEvent.click(screen.getByTestId('origin-origin.b'));
    act(() => { vi.advanceTimersByTime(ORIGIN_NAMING_REVEAL_MS); });
    fireEvent.click(screen.getByTestId('origin-continue'));
    expect(onSelect).toHaveBeenCalledWith(origins[1], 'Maren');
  });
});

describe('TransformationBeat — one click, Continue still needed (THR-1716)', () => {
  const hungers = HUNGER_CATALOG.slice(0, 2);
  const drive = drives[0];

  it('one click chooses a hunger and the court step follows; the court still needs Continue', () => {
    const onSelect = vi.fn();
    render(<TransformationBeat hungers={[...hungers]} driveFragment={drive} onSelect={onSelect} />);
    revealCards();
    fireEvent.click(screen.getByTestId(`hunger-${hungers[0].id}`));
    act(() => { vi.advanceTimersByTime(TRANSFORMATION_COURT_REVEAL_MS); });
    expect(screen.getByTestId('court-confirm')).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('court-confirm'));
    // THR-1749: the spheres buy sits between court and reveal; it opens on the preset.
    fireEvent.click(screen.getByTestId('spheres-confirm'));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toBe(hungers[0]);
    expect(onSelect.mock.calls[0][2]).toEqual({ [hungers[0].sphereAlignment.primary]: 3, [hungers[0].sphereAlignment.secondary]: 2 });
  });

  it('"Choose again" on the court step returns to the hunger row', () => {
    const onSelect = vi.fn();
    render(<TransformationBeat hungers={[...hungers]} driveFragment={drive} onSelect={onSelect} />);
    revealCards();
    fireEvent.click(screen.getByTestId(`hunger-${hungers[0].id}`));
    act(() => { vi.advanceTimersByTime(TRANSFORMATION_COURT_REVEAL_MS); });
    fireEvent.click(screen.getByTestId('remembrance-choose-again'));
    expect(screen.getByTestId(`hunger-${hungers[1].id}`)).toBeTruthy();
    revealCards(); // the hunger row fades back in (THR-1804)
    fireEvent.click(screen.getByTestId(`hunger-${hungers[1].id}`));
    act(() => { vi.advanceTimersByTime(TRANSFORMATION_COURT_REVEAL_MS); });
    fireEvent.click(screen.getByTestId('court-confirm'));
    // THR-1749: the spheres buy sits between court and reveal; it opens on the preset.
    fireEvent.click(screen.getByTestId('spheres-confirm'));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onSelect.mock.calls[0][0]).toBe(hungers[1]);
  });
});

describe("THR-1804 — a card row still fading in takes no clicks", () => {
  it("DriveBeat ignores a click before the row is visible", () => {
    const onSelect = vi.fn();
    render(<DriveBeat fragments={drives} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("drive-drive.a"));
    expect(screen.queryByTestId("drive-chosen-drive.a")).toBeNull();
    act(() => { vi.advanceTimersByTime(DRIVE_CHOSEN_HOLD_MS * 2); });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("OriginBeat ignores a click before the row is visible", () => {
    const onSelect = vi.fn();
    render(<OriginBeat fragments={origins} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("origin-origin.a"));
    act(() => { vi.advanceTimersByTime(ORIGIN_NAMING_REVEAL_MS * 2); });
    // Nothing was chosen, so Enter in the name field submits nothing.
    fireEvent.keyDown(screen.getByTestId("mortal-name-input"), { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("TransformationBeat ignores a hunger click before the row is visible", () => {
    const hungers = HUNGER_CATALOG.slice(0, 2);
    render(<TransformationBeat hungers={[...hungers]} driveFragment={drives[0]} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByTestId(`hunger-${hungers[0].id}`));
    act(() => { vi.advanceTimersByTime(TRANSFORMATION_COURT_REVEAL_MS * 2); });
    expect(screen.queryByTestId("court-confirm")).toBeNull();
  });

  it("a hidden row is pointer-events: none (the RevealBeat pattern)", () => {
    render(<DriveBeat fragments={drives} onSelect={vi.fn()} />);
    const row = screen.getByTestId("drive-drive.a").parentElement as HTMLElement;
    expect(row.style.pointerEvents).toBe("none");
    revealCards();
    expect(row.style.pointerEvents).toBe("auto");
  });
});
