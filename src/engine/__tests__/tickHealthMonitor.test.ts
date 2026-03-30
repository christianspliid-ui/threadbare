import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateTickOutput,
  appendCrashLog,
  getCrashLog,
  getLatestReport,
  getHealthLog,
  clearCrashLog,
  clearHealthLog,
  exportDiagnostics,
  _resetForTests,
  ENCOUNTER_NOTIFICATION_WARN_THRESHOLD,
  UNIFIED_ACTIONS_WARN_THRESHOLD,
  CONTROL_EFFECTS_WARN_THRESHOLD,
  HEALTH_LOG_BUFFER_SIZE,
} from '../tickHealthMonitor';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';

// ─── Helpers ──────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'actor-1', type: 'actor', name: 'Alice',
    properties: { actorType: 'individual' },
  });
  g.addNode({
    id: 'loc-1', type: 'location', name: 'Market',
    properties: {},
  });
  return g;
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 10,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph: makeGraph(),
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: { creation: 5, entropy: 3, force: 2, life: 4, matter: 1, mind: 6, spirit: 2, time: 1 } as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: { currentProgress: 10, currentStage: 1 } as any,
    tickEvents: [{ id: 'e1', type: 'agent_action' } as any],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('tickHealthMonitor', () => {
  beforeEach(() => {
    _resetForTests();
  });

  describe('validateTickOutput', () => {
    it('returns healthy for a valid state transition', () => {
      const prev = makeState({ tick: 9 });
      const next = makeState({ tick: 10 });
      const report = validateTickOutput(prev, next);
      expect(report.healthy).toBe(true);
      expect(report.findings).toHaveLength(0);
      expect(report.tick).toBe(10);
    });

    it('detects tick not advancing by 1', () => {
      const prev = makeState({ tick: 9 });
      const next = makeState({ tick: 12 });
      const report = validateTickOutput(prev, next);
      expect(report.healthy).toBe(false);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'tick_advanced', severity: 'critical' }),
      );
    });

    it('skips delta checks when prev is null (first tick)', () => {
      const next = makeState({ tick: 1 });
      const report = validateTickOutput(null, next);
      expect(report.healthy).toBe(true);
      // No tick_advanced finding
      expect(report.findings.find(f => f.check === 'tick_advanced')).toBeUndefined();
    });

    it('detects empty graph', () => {
      const emptyGraph = new WorldGraph();
      const prev = makeState({ tick: 9 });
      const next = makeState({ tick: 10, graph: emptyGraph });
      const report = validateTickOutput(prev, next);
      expect(report.healthy).toBe(false);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'graph_intact', severity: 'critical' }),
      );
    });

    it('detects NaN in essencePool', () => {
      const prev = makeState({ tick: 9 });
      const next = makeState({
        tick: 10,
        essencePool: { creation: NaN, entropy: 3 } as any,
      });
      const report = validateTickOutput(prev, next);
      expect(report.healthy).toBe(false);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'essence_not_nan', severity: 'critical' }),
      );
    });

    it('detects no agents in graph', () => {
      const g = new WorldGraph();
      g.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
      const prev = makeState({ tick: 9 });
      const next = makeState({ tick: 10, graph: g });
      const report = validateTickOutput(prev, next);
      expect(report.healthy).toBe(false);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'agents_present', severity: 'error' }),
      );
    });

    it('detects negative doom progress', () => {
      const prev = makeState({ tick: 9 });
      const next = makeState({
        tick: 10,
        doomClock: { currentProgress: -5, currentStage: 1 } as any,
      });
      const report = validateTickOutput(prev, next);
      expect(report.healthy).toBe(false);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'doom_not_negative', severity: 'error' }),
      );
    });

    it('warns on zero tick events', () => {
      const prev = makeState({ tick: 9 });
      const next = makeState({ tick: 10, tickEvents: [] });
      const report = validateTickOutput(prev, next);
      // Still healthy (warning, not error)
      expect(report.healthy).toBe(true);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'events_produced', severity: 'warning' }),
      );
    });

    it('warns when encounterNotifications exceed threshold', () => {
      const prev = makeState({ tick: 9 });
      const notifications = Array.from({ length: ENCOUNTER_NOTIFICATION_WARN_THRESHOLD + 1 }, (_, i) => ({
        id: `n-${i}`, agentId: 'a1', agentName: 'A', courtPosition: null,
        encounterId: 'e1', encounterName: 'E', prose: '', choices: [],
        createdTick: 1, autoResolveTick: null, viewed: false, resolved: false,
      }));
      const next = makeState({ tick: 10, encounterNotifications: notifications as any });
      const report = validateTickOutput(prev, next);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'encounter_notifications_bounded', severity: 'warning' }),
      );
    });

    it('warns when unifiedActions exceed threshold', () => {
      const prev = makeState({ tick: 9 });
      const actions = Array.from({ length: UNIFIED_ACTIONS_WARN_THRESHOLD + 1 }, (_, i) => ({
        actionId: `a-${i}`, actorId: 'actor-1', templateId: 't1', targetId: 'loc-1',
        scale: 'personal', source: 'agent', startTick: 1, currentStep: 0,
        stepProgress: 0, stepDuration: 1, resolved: false, stepOutcomes: [],
      }));
      const next = makeState({ tick: 10, unifiedActions: actions as any });
      const report = validateTickOutput(prev, next);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'unified_actions_bounded', severity: 'warning' }),
      );
    });

    it('warns when controlEffects exceed threshold', () => {
      const prev = makeState({ tick: 9 });
      const effects = Array.from({ length: CONTROL_EFFECTS_WARN_THRESHOLD + 1 }, (_, i) => ({
        effectId: `e-${i}`,
      }));
      const next = makeState({ tick: 10, controlEffects: effects as any });
      const report = validateTickOutput(prev, next);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'control_effects_bounded', severity: 'warning' }),
      );
    });

    it('catches its own errors (fail-soft)', () => {
      const prev = makeState({ tick: 9 });
      // next with a graph that throws on getNodes
      const next = makeState({ tick: 10 });
      Object.defineProperty(next, 'graph', {
        get() {
          return {
            getNodes: () => { throw new Error('graph exploded'); },
          };
        },
      });
      const report = validateTickOutput(prev, next);
      expect(report.healthy).toBe(false);
      expect(report.findings).toContainEqual(
        expect.objectContaining({ check: 'validator_error', severity: 'critical' }),
      );
    });
  });

  describe('crash log', () => {
    it('appends and retrieves crash log entries', () => {
      appendCrashLog({
        type: 'tick_exception',
        tick: 5,
        timestamp: Date.now(),
        error: 'boom',
      });
      expect(getCrashLog()).toHaveLength(1);
      expect(getCrashLog()[0].error).toBe('boom');
    });

    it('clears crash log', () => {
      appendCrashLog({ type: 'tick_exception', tick: 1, timestamp: 0, error: 'x' });
      clearCrashLog();
      expect(getCrashLog()).toHaveLength(0);
    });

    it('enforces buffer size limit', () => {
      for (let i = 0; i < HEALTH_LOG_BUFFER_SIZE + 20; i++) {
        appendCrashLog({ type: 'tick_exception', tick: i, timestamp: 0, error: `err-${i}` });
      }
      expect(getCrashLog().length).toBeLessThanOrEqual(HEALTH_LOG_BUFFER_SIZE);
      // Should have the latest entries
      expect(getCrashLog()[getCrashLog().length - 1].error).toBe(`err-${HEALTH_LOG_BUFFER_SIZE + 19}`);
    });
  });

  describe('health log', () => {
    it('stores reports from validateTickOutput', () => {
      const prev = makeState({ tick: 9 });
      const next = makeState({ tick: 10 });
      validateTickOutput(prev, next);
      expect(getHealthLog()).toHaveLength(1);
      expect(getLatestReport()?.tick).toBe(10);
    });

    it('enforces buffer size limit', () => {
      for (let i = 0; i < HEALTH_LOG_BUFFER_SIZE + 20; i++) {
        const prev = makeState({ tick: i });
        const next = makeState({ tick: i + 1 });
        validateTickOutput(prev, next);
      }
      expect(getHealthLog().length).toBeLessThanOrEqual(HEALTH_LOG_BUFFER_SIZE);
    });

    it('clears health log', () => {
      validateTickOutput(null, makeState({ tick: 1 }));
      clearHealthLog();
      expect(getHealthLog()).toHaveLength(0);
      expect(getLatestReport()).toBeNull();
    });
  });

  describe('exportDiagnostics', () => {
    it('returns a serializable snapshot', () => {
      const state = makeState({ tick: 10 });
      validateTickOutput(null, state);
      appendCrashLog({ type: 'tick_exception', tick: 1, timestamp: 0, error: 'test' });

      const diag = exportDiagnostics(state);
      expect(diag.exportedAt).toBeDefined();
      expect(diag.healthLog).toHaveLength(1);
      expect(diag.crashLog).toHaveLength(1);
      expect(diag.latestReport).toBeDefined();
      expect((diag.stateMetrics as any).tick).toBe(10);
    });

    it('works without state argument', () => {
      const diag = exportDiagnostics();
      expect(diag.stateMetrics).toBeNull();
    });
  });
});
