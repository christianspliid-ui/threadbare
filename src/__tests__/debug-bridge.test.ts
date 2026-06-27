// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('listAftermathReactions and pickAftermathReaction delegate to registered callbacks', () => {
    const debug = requireDebugBridge();
    debug._registerAftermathBridge({
      listAftermathReactions: (agentId: string) => {
        if (agentId !== 'serafina') return { reactions: [], error: 'No agent' };
        return {
          reactions: [
            { id: 'reaction-a', label: 'Take the safer route' },
            { id: 'reaction-b', label: 'Take the risky route' },
          ],
        };
      },
      pickAftermathReaction: (agentId: string, reactionId?: string) => {
        if (agentId !== 'serafina') return { success: false, message: 'No agent' };
        return {
          success: true,
          reactionId: reactionId ?? 'reaction-a',
          touchedWorld: true,
          touchedStructure: false,
          message: 'Applied aftermath reaction.',
        };
      },
    });

    expect(debug.listAftermathReactions('serafina')).toEqual({
      reactions: [
        { id: 'reaction-a', label: 'Take the safer route' },
        { id: 'reaction-b', label: 'Take the risky route' },
      ],
    });
    expect(debug.pickAftermathReaction('serafina')).toEqual({
      success: true,
      reactionId: 'reaction-a',
      touchedWorld: true,
      touchedStructure: false,
      message: 'Applied aftermath reaction.',
    });
  });

  it('getForeshadowing resolves using latest ranked candidate for matched agent', async () => {
    vi.doMock('../engine/foreshadowing/encounterForeshadowing', () => ({
      getEncounterForeshadowing: () => ({
        prose: 'Serafina reads the wind and prepares the quarantine line.',
        variantId: 'plague.briefed.eye',
        signals: { intelligenceTier: 'briefed', topMotive: 'capability', dominantReach: 'eye' },
        interventionAttribution: null,
        resolvedAtTick: 12,
      }),
    }));

    const debug = requireDebugBridge();
    const graph = {
      getNodesByType: () => [{ id: 'agent-1', name: 'Serafina' }],
    } as unknown as import('../engine/graph').WorldGraph;
    const decision = {
      rankedEncounterPool: [{
        rank: 1,
        templateId: 'encounter.plague_outbreak',
        templateName: 'Plague Outbreak',
        locationId: 'location-1',
        locationName: 'Ashmarket',
        action: 'start_local',
        reachPrimary: 'eye',
        reachSecondary: 'heart',
        encounterType: 'assist',
        threatBand: 'hard',
        stepCount: 2,
        totalTickCost: 5,
        rewardEstimate: 0.7,
        completionProb: 0.62,
        travelCost: 0,
        finalScore: 1.23,
        selected: true,
      }],
    } as unknown as import('../types/balanceEval').BalanceEvent;

    debug._registerGameStateProvider(() => ({
      graph,
      tick: 12,
    } as unknown as import('../types/gameState').GameState));
    debug._registerRuntimeProvider(() => ({
      balanceTelemetry: {
        latestEncounterDecisionByAgent: new Map([['agent-1', decision]]),
      },
    } as unknown as import('../engine/simulationRuntime').SimulationRuntime));

    await expect(debug.getForeshadowing('Serafina')).resolves.toMatchObject({
      templateId: 'encounter.plague_outbreak',
      templateName: 'Plague Outbreak',
      locationName: 'Ashmarket',
      variantId: 'plague.briefed.eye',
      prose: 'Serafina reads the wind and prepares the quarantine line.',
      resolvedAtTick: 12,
    });
  });

  it('listForeshadowingTraces filters by agent query', async () => {
    const debug = requireDebugBridge();
    const { clearTraces, enableTracing, emitTrace } = await import('../engine/traceBuffer');
    clearTraces();
    enableTracing();

    emitTrace({
      category: 'foreshadowing',
      tick: 8,
      agentId: 'agent-1',
      encounterId: 'encounter.plague_outbreak',
      variantsConsidered: ['plague.briefed.eye'],
      variantPicked: 'plague.briefed.eye',
      signals: { intelligenceTier: 'briefed', topMotive: 'capability', dominantReach: 'eye' },
      interventionAttributionId: null,
      cacheHit: false,
      summary: 'foreshadowing resolved for encounter.plague_outbreak',
    });
    emitTrace({
      category: 'foreshadowing',
      tick: 9,
      agentId: 'agent-2',
      encounterId: 'encounter.deep_descent',
      variantsConsidered: [],
      variantPicked: null,
      signals: { intelligenceTier: 'rumor', topMotive: 'threat', dominantReach: 'iron' },
      interventionAttributionId: null,
      cacheHit: false,
      summary: 'foreshadowing resolved for encounter.deep_descent',
    });

    debug._registerGameStateProvider(() => ({
      graph: {
        getNodesByType: () => [
          { id: 'agent-1', name: 'Serafina' },
          { id: 'agent-2', name: 'Kael' },
        ],
      },
    } as unknown as import('../types/gameState').GameState));

    const traces = await debug.listForeshadowingTraces('Sera');
    expect(traces).toHaveLength(1);
    expect(traces[0].agentId).toBe('agent-1');
  });

  it('listStarterActions is empty (THR-501) and listLockedActions excludes unlocked IDs', async () => {
    const debug = requireDebugBridge();
    debug._registerGameStateProvider(() => ({
      unlockedActionIds: ['divine.inspire'],
    } as unknown as import('../types/gameState').GameState));

    // THR-501 retired the Starter-12 floor — STARTER_ACTION_IDS is now empty.
    const starters = await debug.listStarterActions();
    expect(starters).toHaveLength(0);

    const locked = await debug.listLockedActions();
    // Former starters are now locked until a beat unlocks them.
    expect(locked.some((entry) => entry.id === 'divine.dream')).toBe(true);
    // Explicitly-unlocked IDs are still excluded from the locked list.
    expect(locked.some((entry) => entry.id === 'divine.inspire')).toBe(false);
  });

  it('grantAction delegates to action bridge callback', async () => {
    const debug = requireDebugBridge();
    debug._registerActionBridge({
      listActions: () => [],
      fireAction: () => ({ success: false, message: 'unused' }),
      grantAction: (actionId: string) => ({ success: true, actionId, message: `Unlocked ${actionId}` }),
    });

    await expect(debug.grantAction('action.test_unlock')).resolves.toEqual({
      success: true,
      actionId: 'action.test_unlock',
      message: 'Unlocked action.test_unlock',
    });
  });
});
