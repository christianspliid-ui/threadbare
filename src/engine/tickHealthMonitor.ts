/**
 * Tick Health Monitor — validates structural integrity of GameState after each tick.
 *
 * This is NOT the trace system (which records what happened) — this catches things
 * that *shouldn't* happen: tick regression, NaN values, unbounded growth, missing graph.
 *
 * The crash log captures both health check failures and unhandled tick exceptions,
 * stored in a rolling buffer accessible via window.__DEBUG in dev mode.
 */
import type { GameState } from '../types/gameState';

// ─── Constants ────────────────────────────────────────────────────

export const ENCOUNTER_NOTIFICATION_WARN_THRESHOLD = 500;
export const UNIFIED_ACTIONS_WARN_THRESHOLD = 1000;
export const CONTROL_EFFECTS_WARN_THRESHOLD = 200;
export const HEALTH_LOG_BUFFER_SIZE = 100;

// ─── Types ────────────────────────────────────────────────────────

export interface TickHealthFinding {
  check: string;
  severity: 'critical' | 'error' | 'warning';
  message: string;
  detail?: unknown;
}

export interface TickHealthReport {
  tick: number;
  timestamp: number;
  healthy: boolean;
  findings: TickHealthFinding[];
}

export interface CrashLogEntry {
  type: 'tick_exception' | 'health_check_failed' | 'validator_error';
  tick: number;
  timestamp: number;
  error?: string;
  stack?: string;
  findings?: TickHealthFinding[];
}

// ─── Buffers ──────────────────────────────────────────────────────

let healthLog: TickHealthReport[] = [];
let crashLog: CrashLogEntry[] = [];
let latestReport: TickHealthReport | null = null;

// ─── Core Validator ───────────────────────────────────────────────

/**
 * Validate tick output for structural problems.
 * Pure function (reads state, writes nothing). Never throws — catches its own errors.
 *
 * @param prev - Previous GameState (null on first tick — skips delta checks)
 * @param next - New GameState to validate
 */
export function validateTickOutput(
  prev: GameState | null,
  next: GameState,
): TickHealthReport {
  try {
    const findings: TickHealthFinding[] = [];

    // ── Critical checks ──

    if (next === undefined || next === null) {
      findings.push({
        check: 'state_defined',
        severity: 'critical',
        message: 'Next state is undefined or null',
      });
      // Can't run further checks on null state
      const report: TickHealthReport = {
        tick: prev?.tick ?? -1,
        timestamp: Date.now(),
        healthy: false,
        findings,
      };
      storeReport(report);
      return report;
    }

    if (prev !== null) {
      if (next.tick !== prev.tick + 1) {
        findings.push({
          check: 'tick_advanced',
          severity: 'critical',
          message: `Tick did not advance by 1: expected ${prev.tick + 1}, got ${next.tick}`,
          detail: { expected: prev.tick + 1, actual: next.tick },
        });
      }
    }

    if (!next.graph || next.graph.getStats().nodeCount === 0) {
      findings.push({
        check: 'graph_intact',
        severity: 'critical',
        message: 'Graph is missing or has zero nodes',
      });
    }

    // Essence NaN check
    if (next.essencePool) {
      const nanSpheres = Object.entries(next.essencePool)
        .filter(([, v]) => typeof v === 'number' && Number.isNaN(v))
        .map(([k]) => k);
      if (nanSpheres.length > 0) {
        findings.push({
          check: 'essence_not_nan',
          severity: 'critical',
          message: `NaN values in essencePool: ${nanSpheres.join(', ')}`,
          detail: { nanSpheres },
        });
      }
    }

    // ── Error checks ──

    if (next.graph) {
      const agents = next.graph.getNodesByType('actor')
        .filter(n => n.properties?.actorType === 'individual' || n.subtype === 'individual');
      if (agents.length === 0) {
        findings.push({
          check: 'agents_present',
          severity: 'error',
          message: 'No agent nodes found in graph',
        });
      }

      // Duplicate agent check
      const agentIds = agents.map(a => a.id);
      const uniqueIds = new Set(agentIds);
      if (uniqueIds.size !== agentIds.length) {
        findings.push({
          check: 'no_duplicate_agents',
          severity: 'error',
          message: `Duplicate agent IDs found: ${agentIds.length} total, ${uniqueIds.size} unique`,
          detail: { total: agentIds.length, unique: uniqueIds.size },
        });
      }
    }

    const recentLen = next.recentEvents?.length ?? 0;
    // MAX_RECENT_EVENTS is 100 in orchestrator; allow small overflow
    if (recentLen > 110) {
      findings.push({
        check: 'recent_events_bounded',
        severity: 'error',
        message: `recentEvents has ${recentLen} entries (expected <= 110)`,
        detail: { length: recentLen },
      });
    }

    if (next.doomClock && next.doomClock.currentProgress < 0) {
      findings.push({
        check: 'doom_not_negative',
        severity: 'error',
        message: `Doom clock progress is negative: ${next.doomClock.currentProgress}`,
        detail: { currentProgress: next.doomClock.currentProgress },
      });
    }

    // ── Warning checks ──

    if (next.tickEvents?.length === 0 && prev !== null) {
      findings.push({
        check: 'events_produced',
        severity: 'warning',
        message: 'Tick produced zero events',
      });
    }

    const notifLen = next.encounterNotifications?.length ?? 0;
    if (notifLen > ENCOUNTER_NOTIFICATION_WARN_THRESHOLD) {
      findings.push({
        check: 'encounter_notifications_bounded',
        severity: 'warning',
        message: `encounterNotifications has ${notifLen} entries (threshold: ${ENCOUNTER_NOTIFICATION_WARN_THRESHOLD})`,
        detail: { length: notifLen },
      });
    }

    const actionsLen = next.unifiedActions?.length ?? 0;
    if (actionsLen > UNIFIED_ACTIONS_WARN_THRESHOLD) {
      findings.push({
        check: 'unified_actions_bounded',
        severity: 'warning',
        message: `unifiedActions has ${actionsLen} entries (threshold: ${UNIFIED_ACTIONS_WARN_THRESHOLD})`,
        detail: { length: actionsLen },
      });
    }

    const effectsLen = next.controlEffects?.length ?? 0;
    if (effectsLen > CONTROL_EFFECTS_WARN_THRESHOLD) {
      findings.push({
        check: 'control_effects_bounded',
        severity: 'warning',
        message: `controlEffects has ${effectsLen} entries (threshold: ${CONTROL_EFFECTS_WARN_THRESHOLD})`,
        detail: { length: effectsLen },
      });
    }

    // ── Build report ──

    const healthy = !findings.some(f => f.severity === 'critical' || f.severity === 'error');
    const report: TickHealthReport = {
      tick: next.tick,
      timestamp: Date.now(),
      healthy,
      findings,
    };

    storeReport(report);
    return report;

  } catch (err) {
    // Fail-soft: validator itself crashed
    const report: TickHealthReport = {
      tick: next?.tick ?? prev?.tick ?? -1,
      timestamp: Date.now(),
      healthy: false,
      findings: [{
        check: 'validator_error',
        severity: 'critical',
        message: `Validator threw: ${err instanceof Error ? err.message : String(err)}`,
        detail: { stack: err instanceof Error ? err.stack : undefined },
      }],
    };
    storeReport(report);
    console.error('[TickHealthMonitor] Validator error:', err);
    return report;
  }
}

// ─── Storage ──────────────────────────────────────────────────────

function storeReport(report: TickHealthReport): void {
  healthLog.push(report);
  if (healthLog.length > HEALTH_LOG_BUFFER_SIZE) {
    healthLog = healthLog.slice(-HEALTH_LOG_BUFFER_SIZE);
  }
  latestReport = report;
}

export function appendCrashLog(entry: CrashLogEntry): void {
  crashLog.push(entry);
  if (crashLog.length > HEALTH_LOG_BUFFER_SIZE) {
    crashLog = crashLog.slice(-HEALTH_LOG_BUFFER_SIZE);
  }
}

// ─── Accessors ────────────────────────────────────────────────────

export function getLatestReport(): TickHealthReport | null {
  return latestReport;
}

export function getHealthLog(): ReadonlyArray<TickHealthReport> {
  return healthLog;
}

export function getCrashLog(): ReadonlyArray<CrashLogEntry> {
  return crashLog;
}

export function clearCrashLog(): void {
  crashLog = [];
}

export function clearHealthLog(): void {
  healthLog = [];
  latestReport = null;
}

/**
 * Export a complete diagnostics snapshot for debugging.
 * Returns a JSON-serializable blob with health reports, crash log,
 * and state size metrics.
 */
export function exportDiagnostics(currentState?: GameState): Record<string, unknown> {
  return {
    exportedAt: new Date().toISOString(),
    healthLog: [...healthLog],
    crashLog: [...crashLog],
    latestReport,
    stateMetrics: currentState ? {
      tick: currentState.tick,
      graphNodes: currentState.graph?.getStats().nodeCount ?? 0,
      tickEvents: currentState.tickEvents?.length ?? 0,
      recentEvents: currentState.recentEvents?.length ?? 0,
      unifiedActions: currentState.unifiedActions?.length ?? 0,
      encounterNotifications: currentState.encounterNotifications?.length ?? 0,
      controlEffects: currentState.controlEffects?.length ?? 0,
      chronicleEntries: currentState.chronicleEntries?.length ?? 0,
    } : null,
  };
}

// ─── Test Helpers ─────────────────────────────────────────────────

/** Reset all internal state — for tests only. */
export function _resetForTests(): void {
  healthLog = [];
  crashLog = [];
  latestReport = null;
}
