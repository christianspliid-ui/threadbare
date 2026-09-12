/**
 * `check:attachment` — the attachment line's machine gate. THR-1486, slice 2 of THR-1481.
 *
 * The attachment pipeline was the last content line with no gate at all. `check-encounter`
 * and `check-undertaking` are the siblings and decided the shape: one command over one
 * entry or the whole corpus, structural blocks only, a named ratchet instead of
 * exemptions, and `--list-failures` printing ids in the shape the ratchet file holds.
 *
 *   npm run check:attachment -- <entryId> [<entryId>…]
 *   npm run check:attachment -- --all [--json] [--list-failures]
 *
 * Exit codes: 0 when every entry checked either passes or is on
 * `CONTENT_TAG_RETROFIT_PENDING`; 1 when an unlisted entry fails **or a listed one now
 * passes** — a stale ratchet entry is a lie about the corpus, and refusing it is what
 * makes the list shrink.
 *
 * The contract itself lives in `src/data/content-eval/attachmentContract.ts`; this file
 * is argument parsing and printing, so the rules stay testable without a process.
 */

import {
  attachmentCorpus,
  checkAttachmentContract,
  failedBlocks,
  type AttachmentReport,
} from '../src/data/content-eval/attachmentContract';
import { CONTENT_TAG_RETROFIT_PENDING } from '../src/data/content-eval/contentTagRetrofitPending';

const argv = process.argv.slice(2);
const wantsAll = argv.includes('--all');
const wantsJson = argv.includes('--json');
const wantsListFailures = argv.includes('--list-failures');
const explicitIds = argv.filter(a => !a.startsWith('--'));

if (!wantsAll && explicitIds.length === 0) {
  console.error('Usage: npm run check:attachment -- <entryId> | --all [--json] [--list-failures]');
  process.exit(1);
}

const corpus = attachmentCorpus();
const selected = wantsAll ? corpus : corpus.filter(row => explicitIds.includes(row.entry.id));

if (!wantsAll) {
  const missing = explicitIds.filter(id => !corpus.some(row => row.entry.id === id));
  if (missing.length > 0) {
    console.error(`check:attachment: no attachment entry with id(s): ${missing.join(', ')}`);
    console.error(`  The gate covers ${corpus.length} entries across the six attachment kinds; run with --all to list them.`);
    process.exit(1);
  }
}

const reports: AttachmentReport[] = selected.map(row => checkAttachmentContract(row.kind, row.entry));
const failing = reports.filter(r => !r.passed && !r.ratcheted);
const ratcheted = reports.filter(r => r.ratcheted);

// A ratchet entry that now passes is stale. Only meaningful over the whole corpus —
// a single-id run has not looked at the other listed ids and must not claim they rot.
const stale = wantsAll
  ? CONTENT_TAG_RETROFIT_PENDING.filter(id => {
      const report = reports.find(r => r.entryId === id);
      return report ? report.passed : true;
    })
  : [];

if (wantsListFailures) {
  for (const r of [...failing, ...ratcheted].map(r => r.entryId).sort()) console.log(`  '${r}',`);
}

if (wantsJson) {
  console.log(
    JSON.stringify(
      {
        checked: reports.length,
        passed: reports.filter(r => r.passed).length,
        failing: failing.map(r => ({ id: r.entryId, kind: r.kindId, blocks: failedBlocks(r) })),
        ratcheted: ratcheted.map(r => r.entryId),
        stale,
      },
      null,
      2,
    ),
  );
} else {
  for (const r of failing) {
    console.error(`FAIL ${r.entryId} (${r.kindId}) — ${failedBlocks(r).join(', ')}`);
    for (const b of r.blocks) {
      for (const f of b.failures) console.error(`       ${b.id}: ${f}`);
    }
  }
  for (const id of stale) {
    console.error(`STALE ratchet entry ${id} — it passes now (or no longer exists); remove it from contentTagRetrofitPending.ts`);
  }
  const verdict = failing.length === 0 && stale.length === 0 ? 'OK' : 'FAIL';
  console.log(
    `check:attachment: ${verdict} — ${reports.length} entr${reports.length === 1 ? 'y' : 'ies'} checked, ` +
      `${reports.filter(r => r.passed).length} pass, ${failing.length} fail, ${ratcheted.length} ratcheted, ${stale.length} stale.`,
  );
}

process.exit(failing.length === 0 && stale.length === 0 ? 0 : 1);
