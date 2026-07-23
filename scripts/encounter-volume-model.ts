/**
 * Encounter Volume Model (THR-475).
 *
 * Pure-arithmetic script — no engine load, no PRNG.
 * Derives the library-size targets from named constants in encounterSurface.ts
 * so the ~1,000-surface target is a tunable output, not an asserted number.
 *
 * Usage:
 *   npm run volume-model
 *
 * Two sections:
 *   - **Model** (THR-475): the arithmetic targets derived from named constants.
 *   - **Measured** (THR-573): the *actual* authored surface counts read from templates'
 *     `contextFragments` tables. This is what turns the ~1,000 target from an assertion
 *     into an observable — the gap between measured and target is the authoring backlog.
 *
 * Outputs dated md + json to Docs/playtests/coverage/.
 * Two runs on the same day produce byte-identical files.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  SURFACE_KEY_AXES,
  SURFACES_PER_RUN_TARGET,
  RELEVANT_FRACTION,
  RUNS_BEFORE_REPETITION,
} from '../src/engine/encounterSurface';
import { REACH_DOMAINS } from '../src/types/traits';
import { reportSurfaceFragments } from '../src/engine/content-eval/surfaceFragmentReport';

// ─── Constants used locally in the model ────────────────────────

const REACH_COUNT = REACH_DOMAINS.length;
const SUBLOCATION_TYPE_COUNT = 8; // Sublocation types in registry (estimate)
const SOCIAL_ROLE_COUNT = 6;     // NPC role enum cardinality (null + 5 roles)

// ─── Derived model ──────────────────────────────────────────────

function deriveModel() {
  const runPoolMinEligible = Math.ceil(SURFACES_PER_RUN_TARGET / RELEVANT_FRACTION);
  const totalLibraryTarget = runPoolMinEligible * RUNS_BEFORE_REPETITION;

  // Max theoretical cardinality: product of axis cardinalities × template count.
  // This is a ceiling; actual surfaces are bounded by authored template count.
  const axisCardinality: Record<string, number> = {
    reachPrimary: REACH_COUNT,
    sublocationTypeId: SUBLOCATION_TYPE_COUNT,
    socialRole: SOCIAL_ROLE_COUNT,
  };
  const axisCeilingProduct = SURFACE_KEY_AXES.reduce(
    (product, axis) => product * (axisCardinality[axis] ?? 1),
    1,
  );

  return {
    inputs: {
      SURFACES_PER_RUN_TARGET,
      RELEVANT_FRACTION,
      RUNS_BEFORE_REPETITION,
      SURFACE_KEY_AXES: [...SURFACE_KEY_AXES],
      axisCardinality,
    },
    derived: {
      runPoolMinEligible,
      totalLibraryTarget,
      axisCeilingProduct,
    },
    interpretation: {
      note: [
        `Run pool: need ≥${runPoolMinEligible} unique surfaces eligible per run to hit the ${SURFACES_PER_RUN_TARGET} target at ${RELEVANT_FRACTION * 100}% relevance.`,
        `Library target: ~${totalLibraryTarget} total surfaces for ${RUNS_BEFORE_REPETITION}-run replayability.`,
        `Axis ceiling: product of axis cardinalities = ${axisCeilingProduct} (ceiling before template count bounds it).`,
        `Phase 0 delivers the naming layer. Surface production (multiplication) begins Phase 1+.`,
      ],
    },
  };
}

// ─── Output ─────────────────────────────────────────────────────

/**
 * Measured mode (THR-573) — read the authored fragment tables and report real counts.
 * Pure: no PRNG, no session; entries arrive sorted by template id, so two runs are
 * byte-identical.
 */
function deriveMeasured() {
  const report = reportSurfaceFragments();
  return {
    summary: report.summary,
    templates: report.entries.map(e => ({
      templateId: e.templateId,
      templateName: e.templateName,
      surfaceCount: e.enumeration.surfaceCount,
      slots: e.slots.map(s => ({ slot: s.slot, axis: s.axis, values: s.values.length })),
      problems: e.enumeration.problems,
    })),
  };
}

function toDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMarkdown(
  model: ReturnType<typeof deriveModel>,
  measured: ReturnType<typeof deriveMeasured>,
  date: string,
): string {
  const { inputs, derived, interpretation } = model;
  return [
    `# Encounter Volume Model — ${date}`,
    '',
    '## Inputs',
    '',
    `| Constant | Value |`,
    `|----------|-------|`,
    `| SURFACES_PER_RUN_TARGET | ${inputs.SURFACES_PER_RUN_TARGET} |`,
    `| RELEVANT_FRACTION | ${inputs.RELEVANT_FRACTION} |`,
    `| RUNS_BEFORE_REPETITION | ${inputs.RUNS_BEFORE_REPETITION} |`,
    `| SURFACE_KEY_AXES | ${inputs.SURFACE_KEY_AXES.join(', ')} |`,
    '',
    '## Axis cardinality',
    '',
    `| Axis | Cardinality |`,
    `|------|-------------|`,
    ...Object.entries(inputs.axisCardinality).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## Derived targets',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Run pool min eligible | ${derived.runPoolMinEligible} |`,
    `| Total library target | ${derived.totalLibraryTarget} |`,
    `| Axis ceiling product | ${derived.axisCeilingProduct} |`,
    '',
    '## Interpretation',
    '',
    ...interpretation.note.map(n => `- ${n}`),
    '',
    '## Measured surfaces (authored fragment tables)',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Multiplied templates | ${measured.summary.multipliedTemplates} |`,
    `| Authored surfaces | ${measured.summary.authoredSurfaces} |`,
    `| Authored fragments | ${measured.summary.authoredFragments} |`,
    `| Templates with problems | ${measured.summary.templatesWithProblems} |`,
    '',
    `Coverage against the library target: **${measured.summary.authoredSurfaces} / ${derived.totalLibraryTarget}**.`,
    '',
    ...(measured.templates.length === 0
      ? ['_No template declares context fragments yet._']
      : [
          `| Template | Surfaces | Slots | Problems |`,
          `|----------|----------|-------|----------|`,
          ...measured.templates.map(
            t =>
              `| ${t.templateId} | ${t.surfaceCount} | ${t.slots.map(s => `${s.slot}×${s.axis}(${s.values})`).join(', ')} | ${t.problems.length === 0 ? '—' : t.problems.join('; ')} |`,
          ),
        ]),
    '',
    '_Generated by `npm run volume-model`. Two runs on the same day produce byte-identical output._',
  ].join('\n');
}

function run() {
  const model = deriveModel();
  const measured = deriveMeasured();
  const date = toDateStr();
  const outDir = path.resolve('Docs/playtests/coverage');

  fs.mkdirSync(outDir, { recursive: true });

  const mdPath = path.join(outDir, `${date}-encounter-volume-model.md`);
  const jsonPath = path.join(outDir, `${date}-encounter-volume-model.json`);

  fs.writeFileSync(mdPath, toMarkdown(model, measured, date), 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({ date, ...model, measured }, null, 2) + '\n', 'utf8');

  console.log(`Volume model written:`);
  console.log(`  ${mdPath}`);
  console.log(`  ${jsonPath}`);
  console.log('');
  console.log('Summary:');
  console.log(`  Run pool min eligible : ${model.derived.runPoolMinEligible}`);
  console.log(`  Total library target  : ${model.derived.totalLibraryTarget}`);
  console.log(`  Axis ceiling product  : ${model.derived.axisCeilingProduct}`);
  console.log('');
  console.log('Measured (authored fragment tables):');
  console.log(`  Multiplied templates  : ${measured.summary.multipliedTemplates}`);
  console.log(`  Authored surfaces     : ${measured.summary.authoredSurfaces}`);
  console.log(`  Authored fragments    : ${measured.summary.authoredFragments}`);
  console.log(`  Templates w/ problems : ${measured.summary.templatesWithProblems}`);
}

run();
