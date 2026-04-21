// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import '../debug-bridge';

function requireDebugBridge() {
  expect(window.__DEBUG).toBeDefined();
  return window.__DEBUG!;
}

describe('debug bridge scene snapshot contract', () => {
  beforeEach(() => {
    const debug = requireDebugBridge();
    debug._registerSceneSnapshot(() => ({
      hexCount: 0,
      agentsVisible: 0,
      locationsVisible: 0,
      armiesVisible: 0,
      battlesVisible: 0,
      siegesVisible: 0,
      threadLines: 0,
      activityIcons: 0,
      fogEnabled: false,
      layersActive: [],
    }));
    debug._registerViewportForHex(() => null);
    debug._registerHexAtViewport(() => null);
  });

  it('snapshotScene returns registered structural counts', async () => {
    const debug = requireDebugBridge();
    const snapshot = {
      hexCount: 120,
      agentsVisible: 8,
      locationsVisible: 12,
      armiesVisible: 2,
      battlesVisible: 1,
      siegesVisible: 1,
      threadLines: 4,
      activityIcons: 3,
      fogEnabled: true,
      layersActive: ['agents', 'locations', 'threads', 'fog'],
    };

    debug._registerSceneSnapshot(() => snapshot);

    await expect(debug.snapshotScene()).resolves.toEqual(snapshot);
  });

  it('getViewportForHex and getHexAtViewport delegate to registered callbacks', () => {
    const debug = requireDebugBridge();

    debug._registerViewportForHex((col: number, row: number) => ({
      x: col * 10,
      y: row * 20,
      visible: true,
    }));
    debug._registerHexAtViewport((x: number, y: number) => ({
      col: Math.floor(x / 10),
      row: Math.floor(y / 20),
    }));

    expect(debug.getViewportForHex(3, 4)).toEqual({ x: 30, y: 80, visible: true });
    expect(debug.getHexAtViewport(39, 81)).toEqual({ col: 3, row: 4 });
  });
});
