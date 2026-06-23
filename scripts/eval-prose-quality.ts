// CLI: offline prose-quality evaluation harness (THR-472).
// Usage:
//   npm run eval:prose                  # evaluate built-in fixture corpus
//   npm run eval:prose -- --help        # print usage
//
// Output: structured report to stdout; exits 1 if any entry bands 'fail'.

import * as fs from 'fs';
import * as path from 'path';
import {
  EvalInput,
  ProseQualityBatchResult,
  ProseQualityResult,
  scoreProseBatch,
} from '../src/engine/content-eval/proseQualityScore';
import {
  BAD_PROSE_FLOWERY,
  BAD_PROSE_HARD_EXCLUSION,
  BAD_PROSE_STATIC_STRINGS,
  BAD_PROSE_TELL_DONT_SHOW,
  GOOD_PROSE_FIXTURES,
} from '../src/data/__fixtures__/prose-quality-eval';

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(): { help: boolean; jsonFile?: string; fixturesOnly: boolean } {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) return { help: true, fixturesOnly: true };
  const jsonIdx = args.indexOf('--file');
  const jsonFile = jsonIdx >= 0 ? args[jsonIdx + 1] : undefined;
  return { help: false, jsonFile, fixturesOnly: !jsonFile };
}

function printHelp(): void {
  console.log(`
eval-prose-quality — offline prose quality scorer (THR-472)

Usage:
  npm run eval:prose                       Evaluate built-in fixture corpus
  npm run eval:prose -- --file <path>      Evaluate entries from a JSON file

JSON file format:
  Array of EvalInput objects:
  [
    {
      "entryId": "encounter.my-entry",
      "contentType": "encounter",
      "marquee": false,
      "fields": { "prose": "{name} did something." }
    }
  ]

Exit codes:
  0  All entries band 'pass' or 'warn'
  1  One or more entries band 'fail'
`.trim());
}

// ---------------------------------------------------------------------------
// Input loading
// ---------------------------------------------------------------------------

function loadFromFile(filePath: string): EvalInput[] {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`Error: file not found: ${abs}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(abs, 'utf-8');
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      console.error('Error: JSON file must contain an array of EvalInput objects');
      process.exit(1);
    }
    return parsed as EvalInput[];
  } catch {
    console.error(`Error: could not parse JSON from ${abs}`);
    process.exit(1);
  }
}

function getFixtureCorpus(): EvalInput[] {
  return [
    ...GOOD_PROSE_FIXTURES,
    ...BAD_PROSE_FLOWERY,
    ...BAD_PROSE_HARD_EXCLUSION,
    ...BAD_PROSE_STATIC_STRINGS,
    ...BAD_PROSE_TELL_DONT_SHOW,
  ];
}

// ---------------------------------------------------------------------------
// Report rendering
// ---------------------------------------------------------------------------

function bandIcon(band: string): string {
  switch (band) {
    case 'pass': return '✓';
    case 'warn': return '⚠';
    case 'fail': return '✗';
    case 'error': return '!';
    default: return '?';
  }
}

function printEntry(entry: ProseQualityResult): void {
  const icon = bandIcon(entry.band);
  const marq = entry.marquee ? ' [marquee]' : '';
  console.log(`  ${icon} [${entry.band.toUpperCase().padEnd(4)}] ${entry.entryId}${marq}  (score: ${entry.score})`);
  for (const flag of entry.flags) {
    const sev = flag.severity.padEnd(4);
    console.log(`       ${sev}  ${flag.category}  ${flag.field}: ${flag.detail}`);
    if (flag.evidence) console.log(`             evidence: "${flag.evidence}"`);
  }
}

function printReport(result: ProseQualityBatchResult, label: string): void {
  const { summary } = result;
  console.log(`\n══════════════════════════════════════════`);
  console.log(`  Prose Quality Report — ${label}`);
  console.log(`══════════════════════════════════════════`);
  console.log(`  Total: ${summary.total}  Pass: ${summary.pass}  Warn: ${summary.warn}  Fail: ${summary.fail}  Error: ${summary.error}`);
  console.log('');

  if (result.bottomTail.length > 0) {
    console.log('  ── Bottom tail (worst entries) ──');
    for (const entry of result.bottomTail) {
      printEntry(entry);
    }
    console.log('');
  }

  if (result.marqueeEntries.length > 0) {
    console.log('  ── Marquee entries ──');
    for (const entry of result.marqueeEntries) {
      printEntry(entry);
    }
    console.log('');
  }

  const failCount = summary.fail + summary.error;
  if (failCount > 0) {
    console.log(`  ── All failing entries (${failCount}) ──`);
    for (const entry of result.entries.filter(e => e.band === 'fail' || e.band === 'error')) {
      printEntry(entry);
    }
    console.log('');
  }

  console.log(`══════════════════════════════════════════\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const opts = parseArgs();

if (opts.help) {
  printHelp();
  process.exit(0);
}

const entries = opts.jsonFile ? loadFromFile(opts.jsonFile) : getFixtureCorpus();
const label = opts.jsonFile ? path.basename(opts.jsonFile) : 'fixture corpus';

if (entries.length === 0) {
  console.log('No entries to evaluate.');
  process.exit(0);
}

const result = scoreProseBatch(entries);
printReport(result, label);

const hasFailures = result.summary.fail > 0 || result.summary.error > 0;
process.exit(hasFailures ? 1 : 0);
