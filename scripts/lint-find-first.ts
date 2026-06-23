#!/usr/bin/env node

/**
 * lint-find-first.ts — advisory lint flagging Change/Control action templates
 * that are not Find-gated.
 *
 * ── Background (THR-476, from THR-414 verdict #3) ───────────────────────────
 * The rulebook keeps "Find gates Change/Control" as a SOFT per-template
 * convention enforced by lint, NOT a hard engine invariant. This script is that
 * lint.
 *
 * ── Load-bearing interpretation: what "Found" means today ───────────────────
 * There is no per-template Find-prerequisite field on UnifiedActionTemplate.
 * The engine's "perceive before you act" gate is LAYER REVELATION
 * (`narrativeLayer`, consumed by Gate 7 in getTargetActionSlots). So this lint
 * treats **"Found" === "narrativeLayer present (revelation-gated)."** We do NOT
 * add a schema field here — introducing an explicit Find-prerequisite field
 * would be a separate design decision, out of scope for this issue.
 *
 * ── Rule ────────────────────────────────────────────────────────────────────
 * Scope to `crudType === 'update'` (Change/Control verbs). A template PASSES if:
 *   - `narrativeLayer` is set (revelation-gated → Found), OR
 *   - `starter === true` (starter-floor actions are always visible — THR-419), OR
 *   - `id ∈ FIND_GATE_EXEMPT_IDS` (curated allowlist with per-id rationale).
 * Otherwise it is FLAGGED as a warning.
 *
 * ── Severity / exit code ────────────────────────────────────────────────────
 * Warning only. The script always exits 0 — this is advisory. The flagged list
 * is the worklist for content authors. Promoting it to a CI-blocking error is a
 * deliberate follow-up (mirrors `lint:encounter-content`, which exits non-zero
 * only on errors, never on warnings).
 *
 * ── FIND_GATE_EXEMPT_IDS convention ─────────────────────────────────────────
 * Script-local allowlist of update-templates that are legitimately ungated.
 * Every entry MUST carry a one-line rationale comment. Keep it small — an entry
 * is an admission that the layer-revelation heuristic does not capture this
 * template's real Find gate. Prefer fixing the template (add `narrativeLayer`)
 * over adding an exemption.
 */

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';

/**
 * Update-templates that are legitimately exempt from the Find gate.
 * Each entry needs a rationale. Empty by default — start strict; the flagged
 * list is the worklist, and exemptions are added only when a template's real
 * Find gate genuinely lives outside the layer-revelation heuristic.
 */
export const FIND_GATE_EXEMPT_IDS: ReadonlySet<string> = new Set<string>([
  // (none yet — add `id, // rationale` lines here as real exemptions surface)
]);

/** Minimal shape the classifier needs — keeps the rule testable with fixtures. */
export type FindGateTemplate = Pick<
  UnifiedActionTemplate,
  'id' | 'crudType' | 'narrativeLayer' | 'starter'
>;

export type FindGateVerdict =
  | 'out-of-scope' // crudType !== 'update' — rule does not apply
  | 'gated' // narrativeLayer present (revelation-gated → Found)
  | 'starter' // starter-floor action, always visible (THR-419)
  | 'exempt' // id on the curated allowlist
  | 'violation'; // Change/Control with no Find gate — flagged

/**
 * Pure classification of a single template against the Find-first rule.
 * `violation` is the only flagged verdict; everything else passes.
 */
export function classifyFindGate(template: FindGateTemplate): FindGateVerdict {
  if (template.crudType !== 'update') {
    return 'out-of-scope';
  }
  if (template.narrativeLayer !== undefined) {
    return 'gated';
  }
  if (template.starter === true) {
    return 'starter';
  }
  if (FIND_GATE_EXEMPT_IDS.has(template.id)) {
    return 'exempt';
  }
  return 'violation';
}

export interface FindGateViolation {
  readonly id: string;
  readonly name: string;
  readonly reach: string;
}

export interface FindFirstLintSummary {
  readonly templateCount: number;
  readonly updateCount: number;
  readonly gatedCount: number;
  readonly starterCount: number;
  readonly exemptCount: number;
  readonly violationCount: number;
}

export interface FindFirstLintResult {
  readonly violations: readonly FindGateViolation[];
  readonly summary: FindFirstLintSummary;
}

/** Run the Find-first rule across a corpus of templates. */
export function runFindFirstLint(
  templates: readonly UnifiedActionTemplate[] = UNIFIED_ACTION_TEMPLATES,
): FindFirstLintResult {
  const violations: FindGateViolation[] = [];
  let updateCount = 0;
  let gatedCount = 0;
  let starterCount = 0;
  let exemptCount = 0;

  for (const template of templates) {
    const verdict = classifyFindGate(template);
    if (verdict === 'out-of-scope') {
      continue;
    }
    updateCount += 1;
    switch (verdict) {
      case 'gated':
        gatedCount += 1;
        break;
      case 'starter':
        starterCount += 1;
        break;
      case 'exempt':
        exemptCount += 1;
        break;
      case 'violation':
        violations.push({ id: template.id, name: template.name, reach: template.reach });
        break;
    }
  }

  // Stable, grouped output: sort violations by reach then id.
  violations.sort((a, b) => a.reach.localeCompare(b.reach) || a.id.localeCompare(b.id));

  return {
    violations,
    summary: {
      templateCount: templates.length,
      updateCount,
      gatedCount,
      starterCount,
      exemptCount,
      violationCount: violations.length,
    },
  };
}

function printResult(result: FindFirstLintResult): void {
  console.info(
    `find-first-lint: scanning ${result.summary.templateCount} templates (${result.summary.updateCount} Change/Control)...`,
  );

  if (result.violations.length > 0) {
    let currentReach = '';
    for (const violation of result.violations) {
      if (violation.reach !== currentReach) {
        currentReach = violation.reach;
        console.info(`\n[${currentReach}]`);
      }
      console.info(
        `  WARNING ${violation.id} (${violation.name}) — crudType:'update' with no Find gate (no narrativeLayer, not starter, not exempt)`,
      );
    }
    console.info('');
  }

  console.info(
    `Summary: ${result.summary.updateCount} Change/Control | ${result.summary.gatedCount} gated | ${result.summary.starterCount} starter | ${result.summary.exemptCount} exempt | ${result.summary.violationCount} warnings`,
  );
}

function runCli(): number {
  let result: FindFirstLintResult;
  try {
    result = runFindFirstLint();
  } catch (error) {
    console.error(`find-first-lint failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
  printResult(result);
  // Advisory: warnings never fail the run. Only a thrown error (above) exits 1.
  return 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const currentFilePath = fileURLToPath(import.meta.url);
if (invokedPath === currentFilePath) {
  process.exit(runCli());
}
