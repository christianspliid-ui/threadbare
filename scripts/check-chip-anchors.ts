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
 * ## `--baseline` — the ratchet over the population clause 2 cannot see (THR-1212)
 *
 * Clause 2 scopes itself to chips that *declare* a referent. Chips declaring
 * neither a `stateNoun` nor a `concepts` list are outside it by design, and the
 * default run above reports green over all of them. Green there means
 * **unmeasured**, not clean. `--baseline` counts that population
 * (`chipsWithoutReferent`) and compares it against the committed
 * `chip-referent-baseline.json`, failing only on an **increase**.
 *
 * Why a ratchet rather than a sweep: the population is in the hundreds, spread
 * across mechanical faction families (cheap to anchor), `reputation.*` chips that
 * need Law 13 visibility-parity triage *before* anchoring, and a prose-priced
 * long tail. A gate failing on the standing count would be red on arrival and
 * block every PR; a ratchet lets the factory retrofit line (THR-1130 / THR-1222)
 * drain it at batch cadence while nothing new is authored into it.
 *
 * **What this gate does NOT catch, stated so it is not mistaken for coverage it
 * lacks.** It compares totals. A change that anchors three chips in one template
 * while authoring three unanchored ones in another passes, because the total did
 * not move. Per-template growth is printed, but it is advisory — the gate is the
 * total, mirroring `check:typecheck`, whose pattern the plan cited by name. If
 * such a swap ever actually happens, that is the defect evidence that charters
 * tightening this into a per-template ratchet; it is not assumed in advance.
 *
 * **Refresh semantics.** A legitimate *decrease* — a retrofit batch anchoring
 * chips — refreshes the file with `npm run check:chip-anchors -- --baseline
 * --update` and says why in the commit body. This is a **tree-diffing gate**: it
 * scores the working tree at the instant it runs, so an `--update` snapshots
 * whatever exists then and anything authored afterwards is measured against a
 * baseline that predates it. Per the standing CLAUDE.md rule (THR-896 / THR-976),
 * **run it as the last action before `git push`**, after every closeout edit —
 * never at its numbered position in the gate list.
 *
 * Usage:
 *   npm run check:chip-anchors
 *   npm run check:chip-anchors -- --json
 *   npm run check:chip-anchors -- hod.quest.temple_vigil
 *   npm run check:chip-anchors -- --baseline
 *   npm run check:chip-anchors -- --baseline --update
 *
 * Exit codes:
 *   0  every chip that names a referent anchors it, and every anchor resolves
 *      (and, under --baseline, the no-referent count has not risen)
 *   1  at least one did not, or a named id resolved to no template, or the
 *      no-referent count rose above the committed baseline
 */

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';
import { chipAnchorViolations } from '../src/data/content-eval/compositionContract';
import {
  BASELINE_COMMAND,
  BASELINE_PATH,
  growthReport,
  noReferentCounts,
  readBaseline,
  writeBaseline,
} from './chip-referent-ratchet';

/** The `--baseline` arm. Returns the process exit code. */
function runBaseline(population: readonly UnifiedActionTemplate[], update: boolean): number {
  const { total, perTemplate } = noReferentCounts(population);

  if (update) {
    writeBaseline(total, perTemplate);
    console.log(
      `check:chip-anchors: baseline updated — ${total} no-referent chip(s) across `
        + `${perTemplate.size} template(s). Commit ${BASELINE_PATH} and say why in the commit body.`,
    );
    return 0;
  }

  const read = readBaseline();
  if (!read.ok) {
    console.error(`check:chip-anchors: FAIL — ${read.message}`);
    return 1;
  }
  const baseline = read.baseline;

  if (total > baseline.total) {
    console.error(
      'check:chip-anchors: FAIL — chips declaring no referent increased: '
        + `${baseline.total} → ${total} (+${total - baseline.total}).`,
    );
    const grew = growthReport(perTemplate, baseline);
    if (grew.length > 0) {
      console.error('');
      console.error('Templates whose no-referent count rose (advisory — the gate is the total):');
      for (const line of grew) console.error(`  - ${line}`);
    }
    console.error('');
    console.error(
      'Fix: give the new chips a referent — a `stateNoun` pointing at the object the ending '
        + 'wrote, or a `concepts` entry naming it — or fold the sentence into the band overview '
        + 'and delete the chip (Law 56 clause 2).',
    );
    console.error(
      `The standing ${baseline.total} is the older authoring shape and is NOT yours to sweep — `
        + 'it drains at factory-retrofit cadence (THR-1130 / THR-1222). This gate only blocks '
        + 'making it worse.',
    );
    return 1;
  }

  if (total < baseline.total) {
    console.log(
      `check:chip-anchors: OK — ${total} no-referent chip(s), DOWN `
        + `${baseline.total - total} from the ${baseline.total} baseline. Please run `
        + `\`${BASELINE_COMMAND} --update\` and commit ${BASELINE_PATH} so the ratchet holds `
        + 'the new floor.',
    );
    return 0;
  }

  console.log(
    `check:chip-anchors: OK — ${total} no-referent chip(s) across ${perTemplate.size} `
      + 'template(s), unchanged from baseline.',
  );
  return 0;
}

const argv = process.argv.slice(2);
const wantsJson = argv.includes('--json');
const wantsBaseline = argv.includes('--baseline');
const wantsUpdate = argv.includes('--update');
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

if (wantsBaseline) {
  // Refusing the combination rather than quietly picking one: `--update` writes
  // the ceiling from `population`, so a caller passing template ids alongside it
  // would commit a baseline covering a handful of templates and silently drop the
  // rest of the corpus out from under the gate.
  if (wantsUpdate && explicitIds.length > 0) {
    console.error(
      'check:chip-anchors: FAIL — `--baseline --update` writes the whole-catalog ceiling; '
        + 'it cannot be scoped to named templates.',
    );
    process.exit(1);
  }
  // A named id that does not exist must fail here too. Scoring a ratchet over a
  // population the caller did not actually select would report a reassuringly
  // small number for entirely the wrong reason.
  if (missing.length > 0) {
    for (const id of missing) console.error(`  ! ${id} — no such template`);
    process.exit(1);
  }
  process.exit(runBaseline(population, wantsUpdate));
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
