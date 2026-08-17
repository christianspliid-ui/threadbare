/**
 * `check:cast-targets` — THR-1165, across the **whole** action catalog.
 *
 * A persistent consequence (`bond_change`, `hidden_mark`, `attachment_grant`,
 * `membership_change`, `agent_relocation`) aimed at a `$cast:<key>` sentinel must
 * name a cast member the template itself casts, via a materializing spec. The rule
 * and the reasoning live in {@link castTargetViolations}; this runner only chooses
 * the population.
 *
 * The population is the whole catalog for the same reason `check:chip-anchors` is
 * (THR-1164): `check:encounter --all` sweeps only the `encounter.` prefix, 191 of
 * 683 templates, because the Composition Contract is written for encounters. Cast
 * sentinels have no such boundary — any template carrying a `supportBundle` can
 * aim an effect at one — so a runner scoped to the prefix would report green over
 * two thirds of its own worklist.
 *
 * Usage:
 *   npm run check:cast-targets
 *   npm run check:cast-targets -- --json
 *   npm run check:cast-targets -- encounter.slice.unsafe_bridge
 *
 * Exit codes:
 *   0  every persistent consequence names a cast member the scene casts
 *   1  at least one did not, or a named id resolved to no template
 */

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';
import { castTargetViolations } from '../src/data/content-eval/compositionContract';

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

interface CastTargetResult {
  readonly id: string;
  readonly violations: readonly string[];
}

const results: CastTargetResult[] = population
  .map(template => ({ id: template.id, violations: castTargetViolations(template) }))
  .filter(result => result.violations.length > 0);

const violationCount = results.reduce((sum, r) => sum + r.violations.length, 0);

if (wantsJson) {
  console.log(JSON.stringify({ checked: population.length, missing, violationCount, results }, null, 2));
} else {
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  check:cast-targets — persistent consequences name real cast');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  checked ${population.length}   templates failing ${results.length}   effects ${violationCount}`);
  console.log('');
  for (const result of results) {
    console.log(`  ✗ ${result.id}`);
    for (const violation of result.violations) console.log(`      ${violation}`);
  }
  for (const id of missing) console.log(`  ! ${id} — no such template`);
  if (results.length === 0 && missing.length === 0) {
    console.log('  every persistent consequence names a cast member the scene casts.');
  }
  console.log('');
}

process.exit(results.length > 0 || missing.length > 0 ? 1 : 0);
