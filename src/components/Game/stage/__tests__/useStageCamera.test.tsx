// @vitest-environment jsdom
/**
 * THR-2056 — the Stage's close effect. The Stage eases the lit place into the window at the
 * map's right edge; on close, a place left outside the visible map's middle third is eased
 * to the visible map's centre (it used to be nudged only 48 px inside the edge, so the map
 * drifted to the right edge chapter after chapter). A place inside the middle third stays.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useState, type RefObject } from 'react';
import type { HexMapV2Handle } from '../../../HexMapV2/HexMapV2';
import { useStageCamera } from '../useStageCamera';
import { IDLE_STAGE, type StageScreenState } from '../stageState';

const CANVAS = { left: 0, top: 48, right: 1305, bottom: 1080 };

function fakeMap(litAt: { x: number; y: number }) {
  return {
    setStageFocus: vi.fn(),
    setStageOptionHover: vi.fn(),
    getCameraState: () => ({ k: 6, minK: 1, maxK: 20 }),
    getViewportForHex: () => ({ ...litAt, visible: true }),
    projectHex: () => litAt,
    getCanvasRect: () => CANVAS,
    centerHexesAt: vi.fn(() => Promise.resolve('eased' as const)),
  };
}

const OPEN: StageScreenState = {
  ...IDLE_STAGE,
  kind: 'story-beat',
  phase: 'open',
  focus: {
    lit: ['13,9'], options: [], strength: 0.7, frame: ['13,9'],
    windowRect: { x: 1615, y: 48, w: 305, h: 1032 }, instant: false,
  } as unknown as StageScreenState['focus'],
};

function run(map: ReturnType<typeof fakeMap>) {
  const ref = { current: map } as unknown as RefObject<HexMapV2Handle>;
  return renderHook(() => {
    const [stage, setStage] = useState<StageScreenState>(OPEN);
    useStageCamera(ref, stage, setStage);
    return { stage, setStage };
  });
}

async function closeAndSettle(hook: ReturnType<typeof run>) {
  act(() => hook.result.current.setStage(IDLE_STAGE));
  // The close waits STAGE_LAYOUT_SETTLE_FRAMES animation frames for the rails to move.
  for (let i = 0; i < 4; i++) await act(async () => { vi.advanceTimersByTime(20); });
}

describe('useStageCamera — close (THR-2056)', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout'] }); });
  afterEach(() => { vi.useRealTimers(); });

  it('a place left at the right edge is eased to the visible-canvas centre at the kept zoom', async () => {
    const map = fakeMap({ x: 1256, y: 564 });
    const hook = run(map);
    map.centerHexesAt.mockClear();
    await closeAndSettle(hook);
    expect(map.centerHexesAt).toHaveBeenLastCalledWith(['13,9'], { x: 652.5, y: 564 }, { zoom: 6, instant: false });
    expect(hook.result.current.stage.closeCamera).toEqual({ hex: '13,9', recentred: true });
  });

  it('a place already in the middle third stays: the camera does not move', async () => {
    const map = fakeMap({ x: 700, y: 600 });
    const hook = run(map);
    map.centerHexesAt.mockClear();
    await closeAndSettle(hook);
    expect(map.centerHexesAt).not.toHaveBeenCalled();
    expect(hook.result.current.stage.closeCamera).toEqual({ hex: '13,9', recentred: false });
  });
});
