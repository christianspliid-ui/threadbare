/**
 * `check:chip-anchors` — Law 56 clause 2 across the **whole** action catalog.
 *
 * THR-1164. This runner exists for one reason, and it is a population reason
 * rather than a rule reason: `check:encounter --all` deliberately sweeps only the
 * `encounter.` prefix (191 of 683 templates), because the Composition Contract is
 * written for encounters and holding a divine verb to it would fail ~1,900
 * templates that were never in scope.
 *
 * The anchor clause has no such boundary. A consequence chip is a consequence
 * chip wherever it is authored, and the corpus proves it: of the 48 chips that
 * named a referent and anchored nothing, **19 sat under `hod.*`** — outside the
 * encounter prefix entirely. A clause living only inside the contract would have
 * reported green over 40% of its own worklist, which is the failure mode this
 * whole ticket is about. So the rule is one function
 * ({@link chipAnchorViolations}) read by two runners with different populations,
 * never two rules.
 *
 * Usage:
 *   npm run check:chip-anchors
 *   npm run check:chip-anchors -- --json
 *   npm run check:chip-anchors -- hod.quest.temple_vigil
 *
 * Exit codes:
 *   0  every chip that names a referent anchors it, and every anchor resolves
 *   1  at least one did not, or a named id resolved to no template
 */

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';
import { chipAnchorViolations } from '../src/data/content-eval/compositionContract';

const argv = process.argv.slice(2);
const wantsJson = argv.includes('--json');
const explicitIds = argv.filter(a => !a.startsWith('--'));

const byId = new Map(UNIFIED_ACTION_TEMPLATES.map(t => [t.id, t]));

const missing: string[] = [];
const population: UnifiedActionTemplate[] = [];

if (explicitIds.length === 0) {
  // The whole catalog, on purpose — see the header. No prefix filter.
  population.push(...UNIFIED_ACTION_TEMPLATES);
} else {
  for (const id of explicitIds) {
    const template = byId.get(id);
    if (template) population.push(template);
    else missing.push(id);
  }
}

interface AnchorResult {
  readonly id: string;
  readonly violations: readonly string[];
}

const results: AnchorResult[] = population
  .map(template => ({ id: template.id, violations: chipAnchorViolations(template) }))
  .filter(result => result.violations.length > 0);

const violationCount = results.reduce((sum, r) => sum + r.violations.length, 0);

if (wantsJson) {
  console.log(JSON.stringify({ checked: population.length, missing, violationCount, results }, null, 2));
} else {
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  check:chip-anchors — UI Law 56 clause 2, whole catalog');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  checked ${population.length}   templates failing ${results.length}   chips ${violationCount}`);
  console.log('');
  for (const result of results) {
    console.log(`  ✗ ${result.id}`);
    for (const violation of result.violations) console.log(`      ${violation}`);
  }
  for (const id of missing) console.log(`  ! ${id} — no such template`);
  if (results.length === 0 && missing.length === 0) {
    console.log('  every chip that names a referent anchors it, and every anchor resolves.');
  }
  console.log('');
}

process.exit(results.length > 0 || missing.length > 0 ? 1 : 0);
