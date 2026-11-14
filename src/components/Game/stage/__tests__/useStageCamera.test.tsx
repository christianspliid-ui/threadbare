// @vitest-environment jsdom
/**
 * The Stage camera (THR-2056 → THR-2166 → THR-2221).
 *
 * THR-2221 — on a running clock the bonded mortal's chapters open every few seconds; a
 * camera that framed each one and re-centred on each close read as a camera following him
 * (warm playtest round 4). Now the open frames a place only when it is not already inside
 * the Stage's window, and the close never moves the camera.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState, type RefObject } from 'react';
import type { HexMapV2Handle } from '../../../HexMapV2/HexMapV2';
import { frameAlreadyInWindow, useStageCamera } from '../useStageCamera';
import { IDLE_STAGE, type StageScreenState } from '../stageState';
import { hexScreenWidth } from '../../../HexMapV2/camera/stageCamera';

const CANVAS = { left: 0, top: 48, right: 1305, bottom: 1080 };
const WINDOW = { x: 1615, y: 48, w: 305, h: 1032 };

function fakeMap(litAt: { x: number; y: number }) {
  const view = { x: 100, y: 200, k: 6, w: 1305, h: 1032 };
  return {
    view,
    litAt,
    setStageFocus: vi.fn(),
    setStageOptionHover: vi.fn(),
    getCameraState: () => ({ k: view.k, minK: 1, maxK: 20, viewport: { ...view } }),
    getViewportForHex: () => ({ ...litAt, visible: true }),
    projectHex: vi.fn(() => litAt),
    getCanvasRect: () => CANVAS,
    centerHexesAt: vi.fn(() => Promise.resolve('eased' as const)),
  };
}

function openStage(frame: string[] = ['13,9']): StageScreenState {
  return {
    ...IDLE_STAGE,
    kind: 'story-beat',
    phase: 'open',
    focus: {
      lit: ['13,9'], options: [], strength: 0.7, frame,
      windowRect: WINDOW, instant: false,
    } as unknown as StageScreenState['focus'],
  };
}

function run(map: ReturnType<typeof fakeMap>, initial: StageScreenState = openStage()) {
  const ref = { current: map } as unknown as RefObject<HexMapV2Handle>;
  return renderHook(() => {
    const [stage, setStage] = useState<StageScreenState>(initial);
    useStageCamera(ref, stage, setStage);
    return { stage, setStage };
  });
}

async function settleOpen() {
  await act(async () => { await Promise.resolve(); });
}

async function closeAndSettle(hook: ReturnType<typeof run>) {
  act(() => hook.result.current.setStage(IDLE_STAGE));
  // Let any frame-deferred work run, so "never called" covers a deferred re-centre too.
  for (let i = 0; i < 6; i++) await act(async () => { vi.advanceTimersByTime(20); });
}

/** A point well inside the Stage window. */
const IN_WINDOW = { x: WINDOW.x + WINDOW.w / 2, y: 564 };
/** A point on the canvas, left of the Stage window. */
const OUTSIDE_WINDOW = { x: 1256, y: 564 };

describe('frameAlreadyInWindow (THR-2221)', () => {
  const k = 6;
  const half = hexScreenWidth(k) / 2;

  it('a place whose whole hex sits in the window is inside', () => {
    expect(frameAlreadyInWindow([IN_WINDOW], WINDOW, k)).toBe(true);
  });

  it('a place whose hex straddles the window edge is outside', () => {
    expect(frameAlreadyInWindow([{ x: WINDOW.x + half - 1, y: 564 }], WINDOW, k)).toBe(false);
    expect(frameAlreadyInWindow([{ x: WINDOW.x + half, y: 564 }], WINDOW, k)).toBe(true);
  });

  it('every framed place must be inside; an unprojectable one is outside; an empty frame is not inside', () => {
    expect(frameAlreadyInWindow([IN_WINDOW, OUTSIDE_WINDOW], WINDOW, k)).toBe(false);
    expect(frameAlreadyInWindow([IN_WINDOW, null], WINDOW, k)).toBe(false);
    expect(frameAlreadyInWindow([], WINDOW, k)).toBe(false);
  });
});

describe('useStageCamera — open (THR-2221)', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout'] }); });
  afterEach(() => { vi.useRealTimers(); });

  it('a place already inside the window: the camera stays, centerHexesAt is not called', async () => {
    const map = fakeMap(IN_WINDOW);
    const hook = run(map);
    await settleOpen();
    expect(map.centerHexesAt).not.toHaveBeenCalled();
    expect(hook.result.current.stage.cameraSettled).toBe(true);
    expect(hook.result.current.stage.cameraMode).toBe('stayed');
  });

  it('a place outside the window: the camera frames it in the window', async () => {
    const map = fakeMap(OUTSIDE_WINDOW);
    const hook = run(map);
    await settleOpen();
    expect(map.centerHexesAt).toHaveBeenCalledTimes(1);
    expect(map.centerHexesAt.mock.calls[0][1]).toEqual({ x: WINDOW.x + WINDOW.w / 2, y: WINDOW.y + WINDOW.h / 2 });
    expect(hook.result.current.stage.cameraMode).toBe('eased');
  });

  it('a premonition with one option off-window frames them all', async () => {
    const map = fakeMap(IN_WINDOW);
    map.projectHex.mockImplementation(((col: number) => (col === 13 ? IN_WINDOW : OUTSIDE_WINDOW)) as never);
    run(map, openStage(['13,9', '4,4']));
    await settleOpen();
    expect(map.centerHexesAt).toHaveBeenCalledTimes(1);
  });

  it('two chapters at the same place in a row: once framed, the second does not move the camera', async () => {
    const map = fakeMap(OUTSIDE_WINDOW);
    const hook = run(map);
    await settleOpen();
    expect(map.centerHexesAt).toHaveBeenCalledTimes(1);
    // The frame put the place in the window.
    map.litAt.x = IN_WINDOW.x;
    await closeAndSettle(hook);
    act(() => hook.result.current.setStage(openStage()));
    await settleOpen();
    expect(map.centerHexesAt).toHaveBeenCalledTimes(1);
    expect(hook.result.current.stage.cameraMode).toBe('stayed');
  });
});

describe('useStageCamera — close never moves the camera (THR-2221)', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout'] }); });
  afterEach(() => { vi.useRealTimers(); });

  it('a place left at the right edge (outside the middle third) is not re-centred', async () => {
    const map = fakeMap(OUTSIDE_WINDOW);
    const hook = run(map);
    await settleOpen();
    map.centerHexesAt.mockClear();
    await closeAndSettle(hook);
    expect(map.centerHexesAt).not.toHaveBeenCalled();
    expect(map.setStageFocus).toHaveBeenLastCalledWith(null);
    expect(hook.result.current.stage.closeCamera).toEqual({ hex: '13,9', recentred: false });
  });

  it('a place in the middle of the canvas stays too', async () => {
    const map = fakeMap({ x: 700, y: 600 });
    const hook = run(map);
    await settleOpen();
    map.centerHexesAt.mockClear();
    await closeAndSettle(hook);
    expect(map.centerHexesAt).not.toHaveBeenCalled();
  });

  it('THR-2166 record kept: a pan after the frame settled is reported as the player moving the map', async () => {
    const map = fakeMap(OUTSIDE_WINDOW);
    const hook = run(map);
    await settleOpen();
    map.centerHexesAt.mockClear();
    map.view.x += 40; // 40 world units × k 6 = 240 px
    await closeAndSettle(hook);
    expect(map.centerHexesAt).not.toHaveBeenCalled();
    expect(hook.result.current.stage.closeCamera).toEqual({ hex: '13,9', recentred: false, playerMoved: true });
  });

  it('a zoom after the frame settled also counts as the player moving the map', async () => {
    const map = fakeMap(OUTSIDE_WINDOW);
    const hook = run(map);
    await settleOpen();
    map.view.k = 8;
    await closeAndSettle(hook);
    expect(hook.result.current.stage.closeCamera?.playerMoved).toBe(true);
  });
});
