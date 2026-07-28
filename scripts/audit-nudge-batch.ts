/**
 * WS5 batch evidence harness — THR-838.
 *
 * Every WS5 batch owes before/after scores on the WS3 audit's detectors plus
 * the WS1 hand checklist. Before this script those detectors lived in a
 * throwaway file, so an "after" number was never comparable to the audit's
 * "before". This runs the committed detectors
 * (`src/data/content-eval/nudgeAuditDetectors.ts`) and the committed checklist
 * (`nudgeHandChecklist.ts`) over any set of shipped template ids.
 *
 * Usage:
 *   npm run audit:nudge-batch -- --ids encounter.rest_and_reflect,encounter.sharpen_blades
 *   npm run audit:nudge-batch -- --file Docs/audits/ws5-batch-1-ids.txt
 *   npm run audit:nudge-batch -- --ids <...> --json
 *   npm run audit:nudge-batch -- --ids <...> --hand      # also run the hand checklist
 *
 * Exit codes:
 *   0  every requested template is clean on the detectors (and the hand
 *      checklist when --hand is passed)
 *   1  at least one template trips a threshold, or an id did not resolve
 *
 * A requested id that resolves to no template is an **error**, not a skip: a
 * batch report that silently drops two thirds of its population reads as PASS
 * while proving nothing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';
import { auditTemplate, type NudgeAuditScores } from '../src/data/content-eval/nudgeAuditDetectors';
import { checkNudgeHand, nudgeBearingSteps } from '../src/data/content-eval/nudgeHandChecklist';

// ─── Args ────────────────────────────────────────────────────────────

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const wantsJson = process.argv.includes('--json');
const wantsHand = process.argv.includes('--hand');

function requestedIds(): string[] {
  const inline = argValue('--ids');
  if (inline) return inline.split(',').map(s => s.trim()).filter(Boolean);

  const file = argValue('--file');
  if (file) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.error(`Error: file not found: ${abs}`);
      process.exit(1);
    }
    return fs
      .readFileSync(abs, 'utf-8')
      .split(/\r?\n/u)
      .map(line => line.replace(/^[-*`\s]+|[`\s,]+$/gu, ''))
      .filter(line => line.length > 0 && !line.startsWith('#'));
  }

  console.error('Error: pass --ids <a,b,c> or --file <path>');
  process.exit(1);
}

// ─── Resolve ─────────────────────────────────────────────────────────

const byId = new Map<string, UnifiedActionTemplate>(
  UNIFIED_ACTION_TEMPLATES.map(t => [t.id, t]),
);

const ids = requestedIds();
const missing: string[] = [];
const resolved: UnifiedActionTemplate[] = [];
for (const id of ids) {
  const template = byId.get(id);
  if (template) resolved.push(template);
  else missing.push(id);
}

// ─── Score ───────────────────────────────────────────────────────────

interface Row {
  readonly scores: NudgeAuditScores;
  readonly handViolations: readonly string[];
  readonly hasHand: boolean;
}

const rows: Row[] = resolved.map(template => ({
  scores: auditTemplate(template),
  handViolations: wantsHand ? checkNudgeHand(template) : [],
  hasHand: nudgeBearingSteps(template).length > 0,
}));

const detectorFailures = rows.filter(r => r.scores.failures.length > 0);
const handFailures = wantsHand ? rows.filter(r => r.handViolations.length > 0) : [];

// ─── Report ──────────────────────────────────────────────────────────

if (wantsJson) {
  console.log(JSON.stringify({ requested: ids.length, missing, rows }, null, 2));
} else {
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  WS5 nudge batch audit');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(
    `  requested ${ids.length}   resolved ${resolved.length}   missing ${missing.length}`,
  );
  console.log('');
  console.log('  id                                        words  abstr  vague  nXbY  2nd  hand');
  console.log('  ────────────────────────────────────────  ─────  ─────  ─────  ────  ───  ────');
  for (const { scores, hasHand } of rows) {
    const mark = scores.failures.length === 0 ? ' ' : '✗';
    console.log(
      `${mark} ${scores.templateId.padEnd(40).slice(0, 40)}  ${String(scores.words).padStart(5)}  ` +
        `${scores.abstractDensity.toFixed(2).padStart(5)}  ${scores.vaguenessDensity.toFixed(2).padStart(5)}  ` +
        `${String(scores.notXButY).padStart(4)}  ${String(scores.secondPerson).padStart(3)}  ` +
        `${(hasHand ? 'yes' : '—').padStart(4)}`,
    );
  }
  console.log('');

  if (detectorFailures.length > 0) {
    console.log(`  ── Detector failures (${detectorFailures.length}) ──`);
    for (const { scores } of detectorFailures) {
      console.log(`  ✗ ${scores.templateId}`);
      for (const failure of scores.failures) console.log(`      ${failure}`);
    }
    console.log('');
  }

  if (wantsHand && handFailures.length > 0) {
    console.log(`  ── Hand-checklist violations (${handFailures.length}) ──`);
    for (const { scores, handViolations } of handFailures) {
      console.log(`  ✗ ${scores.templateId}`);
      for (const violation of handViolations) console.log(`      ${violation}`);
    }
    console.log('');
  }

  if (missing.length > 0) {
    console.log(`  ── Unresolved ids (${missing.length}) ──`);
    for (const id of missing) console.log(`  ! ${id}`);
    console.log('');
  }

  const clean = detectorFailures.length === 0 && handFailures.length === 0 && missing.length === 0;
  console.log(`  ${clean ? 'CLEAN' : 'FAILURES PRESENT'}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');
}

process.exit(detectorFailures.length > 0 || handFailures.length > 0 || missing.length > 0 ? 1 : 0);
