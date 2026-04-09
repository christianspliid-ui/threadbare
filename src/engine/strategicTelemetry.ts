// src/engine/strategicTelemetry.ts
//
// Helpers for strategic decision summaries, dominance, and history formatting.
// Consumed by debug-bridge, CLI, and UI surfaces.

import type { StrategicRuntimeState, StrategicHistoryEntry, StrategicProjectRuntime, StrategicControlState, BehaviorFamily } from '../types/strategicAction';

// ─── Decision Summary ───────────────────────────────────────────────

export interface StrategicDecisionSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  failedProjects: number;
  totalControls: number;
  activeControls: number;
  historyEntries: number;
  dominantFamily: BehaviorFamily | null;
  recentHistory: StrategicHistoryEntry[];
}

export function getStrategicDecisionSummary(
  state: StrategicRuntimeState | undefined,
  agentId?: string,
): StrategicDecisionSummary {
  if (!state) {
    return {
      totalProjects: 0, activeProjects: 0, completedProjects: 0, failedProjects: 0,
      totalControls: 0, activeControls: 0, historyEntries: 0,
      dominantFamily: null, recentHistory: [],
    };
  }

  const projects = agentId
    ? state.projects.filter(p => p.actorId === agentId)
    : state.projects;
  const controls = agentId
    ? state.controls.filter(c => c.actorId === agentId)
    : state.controls;
  const history = agentId
    ? state.history.filter(h => h.actorId === agentId)
    : state.history;

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    failedProjects: projects.filter(p => p.status === 'failed').length,
    totalControls: controls.length,
    activeControls: controls.filter(c => c.active).length,
    historyEntries: history.length,
    dominantFamily: computeDominantFamily(history),
    recentHistory: history.slice(-10),
  };
}

// ─── History Formatting ─────────────────────────────────────────────

export function formatStrategicHistory(
  history: StrategicHistoryEntry[],
  limit = 20,
): string {
  if (history.length === 0) return 'No strategic history yet.';

  return history.slice(-limit).map(h => {
    const status = h.outcome === 'completed' ? '+' : h.outcome === 'failed' ? 'X' : '?';
    const catalyst = h.catalystSeeded ? ' [catalyst]' : '';
    const ops = h.graphOps.length > 0 ? ` (${h.graphOps.join(', ')})` : '';
    return `[${status}] tick ${h.tick}: ${h.displayName} (${h.verb})${ops}${catalyst}`;
  }).join('\n');
}

// ─── Project Formatting ─────────────────────────────────────────────

export function formatStrategicProjects(
  projects: StrategicProjectRuntime[],
): string {
  if (projects.length === 0) return 'No active strategic projects.';

  return projects.map(p => {
    const pct = Math.round((p.progress / p.progressRequired) * 100);
    const target = p.targetNodeId ?? 'none';
    return `[${p.status}] ${p.templateId} → ${target} (${pct}% — ${p.progress}/${p.progressRequired})`;
  }).join('\n');
}

// ─── Control Formatting ─────────────────────────────────────────────

export function formatStrategicControls(
  controls: StrategicControlState[],
): string {
  if (controls.length === 0) return 'No active control stances.';

  return controls.map(c => {
    const status = c.active ? 'active' : 'collapsed';
    const degradePct = Math.round(c.degradation * 100);
    return `[${status}] ${c.templateId} → ${c.targetNodeId} (neglect: ${c.neglectTicks}, degrade: ${degradePct}%)`;
  }).join('\n');
}

// ─── Dominance Calculation ──────────────────────────────────────────

function computeDominantFamily(history: StrategicHistoryEntry[]): BehaviorFamily | null {
  if (history.length === 0) return null;

  const counts = new Map<BehaviorFamily, number>();
  for (const h of history) {
    counts.set(h.behaviorFamily, (counts.get(h.behaviorFamily) ?? 0) + 1);
  }

  let max = 0;
  let dominant: BehaviorFamily | null = null;
  for (const [family, count] of counts) {
    if (count > max) {
      max = count;
      dominant = family;
    }
  }

  return dominant;
}
