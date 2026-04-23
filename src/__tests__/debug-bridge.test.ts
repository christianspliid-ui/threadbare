// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import '../debug-bridge';

function requireDebugBridge() {
  expect(window.__DEBUG).toBeDefined();
  return window.__DEBUG!;
}

function makeTickEvent(id: string, tick: number): import('../types/gameState').TickEvent {
  return {
    id,
    tick,
    type: 'narrative',
    message: `event-${id}`,
    significance: 0.5,
  };
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
    debug._registerOpenModalsProvider(() => []);
    debug._registerActiveUIStateProvider(() => ({
      view: 'game',
      selectedAgentId: null,
      selectedLocationId: null,
      selectedFactionId: null,
      selectedHex: null,
      openModals: [],
      actionDrawerOpen: false,
      scryActive: false,
      cameraFocusHex: null,
    }));
    debug._registerGameStateProvider(() => null);
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

  it('getEventsSince returns recentEvents with tick strictly greater than threshold', async () => {
    const debug = requireDebugBridge();
    const events = [
      makeTickEvent('e-1', 9),
      makeTickEvent('e-2', 10),
      makeTickEvent('e-3', 12),
    ];

    debug._registerGameStateProvider(() => ({
      recentEvents: events,
    } as unknown as import('../types/gameState').GameState));

    await expect(debug.getEventsSince(9)).resolves.toEqual([events[1], events[2]]);
    await expect(debug.getEventsSince(0)).resolves.toEqual(events);
  });

  it('getOpenModals and getActiveUIState expose registered UI snapshot', async () => {
    const debug = requireDebugBridge();
    debug._registerOpenModalsProvider(() => ['AgendaPicker', 'PremonitionModal']);
    debug._registerActiveUIStateProvider(() => ({
      view: 'game',
      selectedAgentId: 'agent-1',
      selectedLocationId: 'location-1',
      selectedFactionId: null,
      selectedHex: { col: 8, row: 13 },
      openModals: [],
      actionDrawerOpen: true,
      scryActive: true,
      cameraFocusHex: { col: 7, row: 11 },
    }));

    await expect(debug.getOpenModals()).resolves.toEqual(['AgendaPicker', 'PremonitionModal']);
    await expect(debug.getActiveUIState()).resolves.toEqual({
      view: 'game',
      selectedAgentId: 'agent-1',
      selectedLocationId: 'location-1',
      selectedFactionId: null,
      selectedHex: { col: 8, row: 13 },
      openModals: ['AgendaPicker', 'PremonitionModal'],
      actionDrawerOpen: true,
      scryActive: true,
      cameraFocusHex: { col: 7, row: 11 },
    });
  });
});
