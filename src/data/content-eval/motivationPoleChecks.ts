/**
 * Motivation pole-pin checks (THR-1525).
 *
 * Since THR-1525 `motivations` names what a scene is *about*, and an unpinned
 * axis draws mortals who lean strongly either way on it. `motivationPoles` pins
 * an axis to one pole. Pinning the axis one of the template's own forks decides
 * on draws only one arm's mortals to the fork — occasionally the point, usually
 * the THR-1524 starvation shape re-authored by hand. So it is a **warning**, not
 * a gate: a one-arm draw can be intended.
 *
 * Pure and template-local so `scripts/check-encounter.ts` and the fixture test
 * share one implementation.
 */

import type { ValuePair } from '../../types/agent';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { isActionStepBranch, isRouteDecision } from '../../types/unifiedAction';

/** Every value axis the template's own forks decide on (pole axes + route axes). */
export function forkAxes(template: Pick<UnifiedActionTemplate, 'steps'>): ReadonlySet<ValuePair> {
  const axes = new Set<ValuePair>();
  for (const entry of template.steps ?? []) {
    if (!isActionStepBranch(entry) || !entry.decidedBy) continue;
    const decision = entry.decidedBy;
    if (isRouteDecision(decision)) {
      for (const route of decision.routes) if (route.axis) axes.add(route.axis);
    } else {
      axes.add(decision.axis);
    }
  }
  return axes;
}

/**
 * One warning line per pinned motivation that is also one of the template's
 * fork axes. Also warns (same channel) on a pin naming an axis absent from
 * `motivations`, which scoring silently ignores.
 */
export function pinnedForkAxisWarnings(
  template: Pick<UnifiedActionTemplate, 'steps' | 'motivations' | 'motivationPoles'>,
): string[] {
  const poles = template.motivationPoles;
  if (!poles) return [];
  const warnings: string[] = [];
  const forks = forkAxes(template);
  for (const [axis, pole] of Object.entries(poles) as [ValuePair, string | undefined][]) {
    if (pole !== 'positive' && pole !== 'negative') continue;
    if (!template.motivations.includes(axis)) {
      warnings.push(
        `motivationPoles pins '${axis}', which is not in motivations — scoring ignores it (THR-1525)`,
      );
      continue;
    }
    if (forks.has(axis)) {
      warnings.push(
        `motivationPoles pins '${axis}' to ${pole}, and a fork on this template decides on '${axis}' — `
        + `only that pole's mortals will be drawn to the fork (THR-1525; see nudge-authoring-spec step 6)`,
      );
    }
  }
  return warnings;
}
