/**
 * Ambition Assignment — assigns initial ambitions to newly born agents.
 *
 * Wraps the selection funnel to produce 0-2 prioritized assignments
 * (1 primary + 0-1 secondary). Pure function — does not modify graph.
 */
import type { AmbitionTemplate, AmbitionPriority } from '../types/ambition';
import type { AmbitionAgentSnapshot } from './ambitionSelection';
import { selectAmbitions } from './ambitionSelection';

export interface AmbitionAssignment {
  templateId: string;
  priority: AmbitionPriority;
}

/**
 * Assign initial ambitions to a newly created agent.
 * Returns 0-2 assignments (1 primary + 0-1 secondary).
 * Pure function — does not modify graph.
 */
export function assignInitialAmbitions(
  templates: readonly AmbitionTemplate[],
  agent: AmbitionAgentSnapshot,
  seed: number,
): AmbitionAssignment[] {
  const selected = selectAmbitions(templates, agent, {
    maxAmbitions: 2,
    threshold: 0.0,
    seed,
  });

  return selected.map((s, i) => ({
    templateId: s.templateId,
    priority: (i === 0 ? 'primary' : 'secondary') as AmbitionPriority,
  }));
}
