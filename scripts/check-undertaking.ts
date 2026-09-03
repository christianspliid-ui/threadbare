/**
 * `check:undertaking` — the undertaking factory's machine gate. THR-1300 slice 1.
 *
 * Plan: `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md` § Stage 3. The
 * encounter line's `check-encounter.ts` is the sibling and decided the shape: one
 * command over one template or the whole corpus, structural blocks first, a warn
 * channel that prints and never exits non-zero, and a named ratchet instead of
 * exemptions. Where a rule differs it is stated in the plan; where it is not, the
 * encounter line's rule holds.
 *
 *   npm run check:undertaking -- <templateId> [<templateId>…]
 *   npm run check:undertaking -- --all [--json] [--list-failures]
 *
 * Exit codes: 0 when every template checked either passes or is on
 * `UNDERTAKING_RETROFIT_PENDING`; 1 when an unlisted template fails **or a listed
 * one now passes** (a stale ratchet entry is a lie about the corpus — the list only
 * ever shrinks, and this is what makes it shrink). `--list-failures` prints the
 * ids that currently fail, sorted, in the shape the ratchet file holds — regenerate
 * only to *remove* names.
 */

import { getAllStrategicTemplates } from '../src/engine/strategicActionCandidates';
import { UNDERTAKING_CELL_TEMPLATES } from '../src/data/undertaking-cells';
import {
  buildUndertakingContractContext,
  checkUndertakingContract,
  failedBlocks,
  type UndertakingReport,
} from '../src/data/content-eval/undertakingContract';
import {
  UNDERTAKING_RETROFIT_PENDING,
  isUndertakingRetrofitPending,
} from '../src/data/content-eval/undertakingRetrofitPending';

const argv = process.argv.slice(2);
const wantsAll = argv.includes('--all');
const wantsJson = argv.includes('--json');
const wantsListFailures = argv.includes('--list-failures');
const explicitIds = argv.filter(a => !a.startsWith('--'));

if (!wantsAll && explicitIds.length === 0) {
  console.error('Usage: npm run check:undertaking -- <templateId> | --all [--json] [--list-failures]');
  process.exit(1);
}

// The cells are contract-checked with the packs (THR-1392 slice 3): they exist in the
// repo whatever the flag says, and a cell that fails the contract is a defect now.
const corpus = [...getAllStrategicTemplates(), ...UNDERTAKING_CELL_TEMPLATES];
const ctx = buildUndertakingContractContext(corpus);
const byId = new Map(corpus.map(t => [t.id, t]));

const targets = wantsAll ? corpus : explicitIds.map(id => {
  const t = byId.get(id);
  if (!t) {
    console.error(`check:undertaking: unknown template id '${id}'`);
    process.exit(1);
  }
  return t;
});

if (wantsAll && corpus.length === 0) {
  console.error('check:undertaking: the corpus is empty — a sweep over nothing is not green');
  process.exit(1);
}

interface Row {
  readonly report: UndertakingReport;
  readonly pending: boolean;
  /** Fails the gate: failed and not on the ratchet, or on the ratchet and passing. */
  readonly gateFailure: 'unlisted_failure' | 'stale_ratchet_entry' | null;
}

const rows: Row[] = targets.map(t => {
  const report = checkUndertakingContract(t, ctx);
  const pending = isUndertakingRetrofitPending(t.id);
  const gateFailure = !report.passed && !pending
    ? 'unlisted_failure'
    : report.passed && pending
      ? 'stale_ratchet_entry'
      : null;
  return { report, pending, gateFailure };
});

if (wantsListFailures) {
  const failing = rows.filter(r => !r.report.passed).map(r => r.report.templateId).sort();
  console.log(failing.map(id => `  '${id}',`).join('\n'));
  console.error(`\n${failing.length} of ${rows.length} fail the contract today (${UNDERTAKING_RETROFIT_PENDING.length} on the ratchet).`);
  process.exit(0);
}

if (wantsJson) {
  console.log(JSON.stringify(rows.map(r => ({
    templateId: r.report.templateId,
    passed: r.report.passed,
    pending: r.pending,
    gateFailure: r.gateFailure,
    blocks: failedBlocks(r.report),
    violations: r.report.violations,
    warnings: r.report.warnings,
  }))));
} else {
  for (const r of rows) {
    const blocks = failedBlocks(r.report);
    const tag = r.report.passed ? 'PASS' : r.pending ? 'pending' : 'FAIL';
    if (!wantsAll || tag !== 'PASS' || r.report.warnings.length) {
      console.log(`${tag.padEnd(7)} ${r.report.templateId}${blocks.length ? `  [${blocks.join(', ')}]` : ''}`);
    }
    if (!wantsAll || tag === 'FAIL') {
      for (const x of r.report.violations) console.log(`         ${x.block}: ${x.message}`);
    }
    for (const w of r.report.warnings) console.log(`         [warn] ${w}`);
  }
  const passed = rows.filter(r => r.report.passed).length;
  const pending = rows.filter(r => r.pending && !r.report.passed).length;
  const unlisted = rows.filter(r => r.gateFailure === 'unlisted_failure');
  const stale = rows.filter(r => r.gateFailure === 'stale_ratchet_entry');
  console.log(`\ncheck:undertaking — ${rows.length} checked · ${passed} pass · ${pending} on the ratchet · ${unlisted.length} unlisted failure(s) · ${stale.length} stale ratchet entr${stale.length === 1 ? 'y' : 'ies'}`);
  for (const r of stale) console.log(`  stale: '${r.report.templateId}' now passes — remove it from UNDERTAKING_RETROFIT_PENDING in this commit`);
}

process.exit(rows.some(r => r.gateFailure !== null) ? 1 : 0);
