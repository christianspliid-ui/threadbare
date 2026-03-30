/**
 * Intervention Tracking — records and retrieves divine intervention history.
 *
 * Every divine intervention (or choice not to intervene) on a bonded agent's
 * encounter is recorded. Feeds into the Return convergence model.
 *
 * --- Constants ---
 * | Name                                  | Default | Purpose                              |
 * |---------------------------------------|---------|--------------------------------------|
 * | INTERVENTION_HISTORY_MAX              | 100     | Max records kept per agent           |
 *
 * --- Fail-soft ---
 * | Failure                          | Fallback                         |
 * |----------------------------------|----------------------------------|
 * | Agent node missing               | No-op on record, empty on read   |
 * | interventionHistory missing      | Return empty array               |
 * | History exceeds max              | Trim oldest entries              |
 *
 * --- PRNG ---
 * None — tracking is deterministic.
 */

import type { WorldGraph } from './graph';
import type { SphereName } from '../types/index';

// --- Constants ---

export const INTERVENTION_HISTORY_MAX = 100;

// --- Types ---

export interface InterventionRecord {
  tick: number;
  agentId: string;
  encounterId: string;
  essenceSpent: number;
  sphereUsed: SphereName;
  probabilityBonus: number;
  outcome: 'success' | 'failure';
}

// --- Core Functions ---

/**
 * Record an intervention in an agent's intervention history.
 * Stored as append-only array on agent node properties.
 * Trims to INTERVENTION_HISTORY_MAX if exceeded.
 * No-op if agent node not found.
 */
export function recordIntervention(
  graph: WorldGraph,
  record: InterventionRecord,
): void {
  const node = graph.getNode(record.agentId);
  if (!node) return;

  const history = getInterventionHistory(graph, record.agentId);
  history.push(record);

  // Trim to max
  while (history.length > INTERVENTION_HISTORY_MAX) {
    history.shift();
  }

  graph.updateNode(record.agentId, {
    properties: { interventionHistory: history },
  });
}

/**
 * Retrieve the intervention history for an agent.
 * Returns empty array if agent not found or no history.
 */
export function getInterventionHistory(
  graph: WorldGraph,
  agentId: string,
): InterventionRecord[] {
  const node = graph.getNode(agentId);
  if (!node) return [];

  const history = node.properties.interventionHistory as InterventionRecord[] | undefined;
  if (!history || !Array.isArray(history)) return [];

  return [...history];
}
