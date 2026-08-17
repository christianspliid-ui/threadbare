/**
 * `check:encounter` — the Encounter Factory's machine gate. THR-1045.
 *
 * Plan: `Docs/plans/2026-08-08-encounter-factory-workflow.md` §2 Stage 3
 * ("the 'same quality every time' mechanism") and §1 (the Composition Contract).
 *
 * One command running the full quality-gate stack over one encounter, or over
 * the whole corpus. **Green is a precondition for a PR existing.** This is the
 * stage that scales: agents vary, gates do not.
 *
 * The stack, in order — structural first, so a template missing its aftermath is
 * told that before it is told about a weak adjective:
 *
 *   1. Composition Contract  `checkCompositionContract` — steps, hand, setting,
 *                            cast, rewards, aftermath, systems quota, images.
 *                            Delegates hand → `checkNudgeHand` and setting →
 *                            `validateSettingEnvelope` rather than restating them.
 *   2. Register detectors    `auditTemplate().failures` — vagueness, not-X-but-Y,
 *                            thin premise, second person, and divine
 *                            outcome-authorship (THR-1166: the god sways the
 *                            odds; fate settles the result). Abstraction and
 *                            intensifiers report into `warnings` and are
 *                            deliberately not read here (THR-1092): the
 *                            abstract-noun measure is a suffix proxy that counts
 *                            domain vocabulary against a template, so it ranks
 *                            rather than gates.
 *   3. Reference liveness    `validateNudgeGrantRefs` + `validateRewardDrawPools` — every id a card grants
 *                            resolves against built content. This is the
 *                            per-template sibling of `validateTraitRefs`, which
 *                            is a graph-wide sweep over every content surface
 *                            and so cannot name a block for one template; it
 *                            keeps its home in `__DEBUG.validateTraitRefs()`.
 *   4. Enrichment dry-run    every `{...}` token in authored prose is one
 *                            `enrichProse` resolves, and every `{cast:*}` /
 *                            `{frag:*}` names a key the template declares.
 *   5. Forecast arithmetic   a step's authored difficulty plus its whole hand
 *                            must stay inside the probability range, so a hand
 *                            cannot promise movement the resolver will clamp.
 *
 * **Ruling 3: no exemption mechanism.** A missing block is a hard fail and the
 * message names the block and the plan section. The only escape is
 * `RETROFIT_PENDING` — a per-template ratchet that only ever shrinks.
 *
 * Usage:
 *   npm run check:encounter -- encounter.slice.unsafe_bridge
 *   npm run check:encounter -- --all
 *   npm run check:encounter -- --all --json
 *   npm run check:encounter -- --all --list-failures   # regenerate the ratchet
 *
 * Exit codes:
 *   0  every checked template is clean, or fails only while on the ratchet
 *   1  a template not on the ratchet failed, an id did not resolve, or a
 *      ratchet entry is stale (listed but now passing)
 */

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';
import { isActionStepBranch } from '../src/types/unifiedAction';
import {
  authoredProse,
  checkCompositionContract,
  type CompositionReport,
} from '../src/data/content-eval/compositionContract';
import { RETROFIT_PENDING, isRetrofitPending } from '../src/data/content-eval/retrofitPending';
import { auditTemplate } from '../src/data/content-eval/nudgeAuditDetectors';
import { validateNudgeGrantRefs, validateRewardDrawPools } from '../src/engine/nudgeGrantLiveness';
import { NUDGE_GOLDEN_EXEMPLAR } from '../src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const wantsAll = argv.includes('--all');
const wantsJson = argv.includes('--json');
const wantsListFailures = argv.includes('--list-failures');
const explicitIds = argv.filter(a => !a.startsWith('--'));

if (!wantsAll && explicitIds.length === 0) {
  console.error('Usage: npm run check:encounter -- <templateId> | --all [--json] [--list-failures]');
  process.exit(1);
}

// ─── Forecast arithmetic ─────────────────────────────────────────────

/**
 * A step's probability may not leave `[0, 1]` once its whole hand is played.
 *
 * The resolver clamps, so a hand that sums past the ceiling is not a crash — it
 * is worse: the player spends essence on a card whose forecast word does not
 * move, and nothing in the UI says why. `checkNudgeHand` already caps the hand's
 * *total* delta; this is the other half, which that cap cannot see because it
 * does not know the step's authored difficulty.
 */
const PROBABILITY_MIN = 0;
const PROBABILITY_MAX = 1;

function forecastProblems(template: UnifiedActionTemplate): readonly string[] {
  const problems: string[] = [];
  for (const [index, step] of (template.steps ?? []).entries()) {
    if (isActionStepBranch(step)) continue;
    const hand = step.nudges ?? [];
    if (hand.length === 0) continue;
    // `difficulty` is the threshold the roll must beat, so the headroom a hand
    // has is measured against it directly.
    const base = step.difficulty;
    if (typeof base !== 'number') continue;
    const total = hand.reduce((sum, n) => sum + n.forecastDelta, 0);
    if (base + total > PROBABILITY_MAX + 1e-9) {
      problems.push(
        `step ${index}: difficulty ${base.toFixed(2)} + full hand ${total.toFixed(2)} = `
          + `${(base + total).toFixed(2)}, past ${PROBABILITY_MAX} — the last cards buy nothing`,
      );
    }
    const worst = hand.reduce((sum, n) => sum + Math.min(0, n.forecastDelta), 0);
    if (base + worst < PROBABILITY_MIN - 1e-9) {
      problems.push(
        `step ${index}: difficulty ${base.toFixed(2)} + negative hand ${worst.toFixed(2)} = `
          + `${(base + worst).toFixed(2)}, under ${PROBABILITY_MIN}`,
      );
    }
  }
  return problems;
}

// ─── Enrichment dry-run ──────────────────────────────────────────────

/**
 * Tokens `enrichProse` resolves without a colon argument.
 *
 * Read off `src/engine/proseEnrichment.ts`'s replacement chain. A token outside
 * this set survives enrichment verbatim and reaches the player as literal
 * `{whatever}` — the failure THR-1050 filed for reaction labels.
 */
const SIMPLE_TOKENS: ReadonlySet<string> = new Set([
  'name', 'actor', 'Actor', 'location', 'culture',
  'they', 'them', 'their', 's', 'They', 'Them', 'Their',
  'faction', 'group', 'title', 'target',
  'omen_adj', 'omen_verb', 'omen_noun', 'omen_atmosphere',
  'econ_adj', 'econ_noun', 'econ_atmosphere',
  'doom_verb', 'doom_adj', 'doom_atmosphere',
  'outcome_phrase', 'q_flavor',
]);

/** Namespaces the enricher resolves with a `:` argument. */
const NAMESPACED_TOKENS: ReadonlySet<string> = new Set([
  'cast', 'frag', 'target', 'intel', 'cause', 'artifact', 'ally', 'rival',
]);

function tokenProblems(template: UnifiedActionTemplate): readonly string[] {
  const problems: string[] = [];
  const declaredSlots = new Set((template.contextFragments ?? []).map(set => set.slot));

  for (const { text, where } of authoredProse(template)) {
    for (const match of text.matchAll(/\{([^}]*)\}/gu)) {
      const raw = match[1];
      // Conditional blocks (`{?has_cast:x}` … `{/has_cast:x}`) are structural,
      // not substitutions — the enricher strips them either way.
      if (raw.startsWith('?') || raw.startsWith('/')) continue;

      const colon = raw.indexOf(':');
      if (colon === -1) {
        if (!SIMPLE_TOKENS.has(raw)) {
          problems.push(`${where}: {${raw}} is not a token enrichProse resolves`);
        }
        continue;
      }

      const namespace = raw.slice(0, colon);
      const arg = raw.slice(colon + 1);
      if (!NAMESPACED_TOKENS.has(namespace)) {
        problems.push(`${where}: {${raw}} — unknown token namespace '${namespace}'`);
        continue;
      }
      // `{frag:<slot>}` is the one namespace whose argument the *template* owns,
      // so it is the one this can check without a runtime. An undeclared slot
      // strips to empty at render and the paragraph silently loses a sentence.
      // `{cast:*}` keys are checked by the contract's Cast block.
      if (namespace === 'frag' && !declaredSlots.has(arg)) {
        problems.push(`${where}: {frag:${arg}} names no slot in \`contextFragments\``);
      }
    }
  }
  return problems;
}

// ─── Per-template run ────────────────────────────────────────────────

interface TemplateResult {
  readonly id: string;
  readonly composition: CompositionReport;
  readonly register: readonly string[];
  readonly liveness: readonly string[];
  readonly tokens: readonly string[];
  readonly forecast: readonly string[];
  readonly failed: boolean;
  readonly pending: boolean;
}

function runOne(template: UnifiedActionTemplate): TemplateResult {
  const composition = checkCompositionContract(template);
  const register = auditTemplate(template).failures;
  const liveness = [
    ...validateNudgeGrantRefs([template]).dead.map(
      d => `step ${d.stepIndex} card '${d.nudgeId}' ${d.effectKind} → unknown ${d.refKind} '${d.ref}'`,
    ),
    // THR-1146 — a `reward_draw` whose recipe matches no live attachment is the
    // same rot in a different shape: nothing is misspelled, the query just
    // selects nothing, and at runtime the prose promises a prize that never
    // arrives. Tags carry their `#` — `'weapon'` matches nothing, `'#weapon'` does.
    ...validateRewardDrawPools([template]).empty.map(
      e => `${e.site} reward_draw → no candidate matches [${e.categoryWeights.join('/')}]`
        + `${e.tagFilters.length ? ` tags ${e.tagFilters.join(' ')}` : ' (no tag filter)'}`,
    ),
  ];
  const tokens = tokenProblems(template);
  const forecast = forecastProblems(template);

  const failed =
    composition.violations.length > 0
    || register.length > 0
    || liveness.length > 0
    || tokens.length > 0
    || forecast.length > 0;

  return {
    id: template.id,
    composition,
    register,
    liveness,
    tokens,
    forecast,
    failed,
    pending: isRetrofitPending(template.id),
  };
}

// ─── Resolve the population ──────────────────────────────────────────

const byId = new Map(UNIFIED_ACTION_TEMPLATES.map(t => [t.id, t]));

// The golden exemplar is addressable by id but is NOT corpus: it is registered
// in no pool, so `--all` must never sweep it. Adding it here is what lets an
// author run the gate against the worked example they are copying from —
// `npm run check:encounter -- fixture.encounter.swollen_ford` — and is the
// contract's own green reference.
byId.set(NUDGE_GOLDEN_EXEMPLAR.id, NUDGE_GOLDEN_EXEMPLAR);

/**
 * `--all` sweeps the encounter families, not the whole action catalog.
 *
 * The contract is written for encounters; a divine intervention verb or a mortal
 * action has no aftermath variants and no hand by design, and holding it to this
 * schema would fail ~1,900 templates that were never in scope. CI's path filter
 * (`src/data/encounters/**`) draws the same boundary.
 */
const ENCOUNTER_ID_PREFIXES: readonly string[] = ['encounter.'];

function isEncounter(template: UnifiedActionTemplate): boolean {
  return ENCOUNTER_ID_PREFIXES.some(prefix => template.id.startsWith(prefix));
}

const missing: string[] = [];
const population: UnifiedActionTemplate[] = [];

if (wantsAll) {
  population.push(...UNIFIED_ACTION_TEMPLATES.filter(isEncounter));
} else {
  for (const id of explicitIds) {
    const template = byId.get(id);
    if (template) population.push(template);
    else missing.push(id);
  }
}

const results = population.map(runOne);

// ─── Ratchet ─────────────────────────────────────────────────────────
//
// Two directions, both errors. An unlisted failure is new rot. A listed pass is
// a stale entry — the ratchet claiming a template is unfinished when it is
// finished, which is how an allowlist quietly stops meaning anything.

const unlistedFailures = results.filter(r => r.failed && !r.pending);
const staleEntries = wantsAll
  ? RETROFIT_PENDING.filter(id => {
      const result = results.find(r => r.id === id);
      // An id on the ratchet that resolves to no template at all is also stale —
      // a renamed or deleted template leaves its name behind otherwise.
      return result === undefined || !result.failed;
    })
  : [];

// ─── Report ──────────────────────────────────────────────────────────

if (wantsListFailures) {
  // The regeneration path: print exactly the array body for `retrofitPending.ts`.
  for (const id of results.filter(r => r.failed).map(r => r.id).sort()) {
    console.log(`  '${id}',`);
  }
  process.exit(0);
}

if (wantsJson) {
  console.log(
    JSON.stringify(
      {
        checked: results.length,
        missing,
        failures: unlistedFailures.length,
        pendingFailures: results.filter(r => r.failed && r.pending).length,
        staleRatchetEntries: staleEntries,
        results,
      },
      null,
      2,
    ),
  );
} else {
  const clean = results.filter(r => !r.failed);
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  check:encounter — Composition Contract + quality gates');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(
    `  checked ${results.length}   clean ${clean.length}   `
      + `failing ${unlistedFailures.length}   on ratchet ${results.filter(r => r.failed && r.pending).length}`,
  );
  console.log('');

  for (const result of results) {
    if (!result.failed) {
      console.log(`  ✓ ${result.id}  [systems: ${result.composition.systems.join(', ') || 'none'}]`);
      continue;
    }
    const badge = result.pending ? '· (retrofit pending)' : '✗';
    console.log(`  ${badge} ${result.id}`);
    // Grouped by block so the fix list reads as "what this encounter owes",
    // which is the shape an author acts on.
    for (const violation of result.composition.violations) {
      console.log(`      [${violation.block}] ${violation.message}`);
      console.log(`               → ${violation.planSection}`);
    }
    for (const line of result.register) console.log(`      [register] ${line}`);
    for (const line of result.liveness) console.log(`      [liveness] ${line}`);
    for (const line of result.tokens) console.log(`      [tokens] ${line}`);
    for (const line of result.forecast) console.log(`      [forecast] ${line}`);
  }
  console.log('');

  if (missing.length > 0) {
    console.log(`  ── Unresolved ids (${missing.length}) ──`);
    for (const id of missing) console.log(`  ! ${id}`);
    console.log('');
  }

  if (staleEntries.length > 0) {
    console.log(`  ── Stale ratchet entries (${staleEntries.length}) ──`);
    console.log('  These pass now (or no longer exist). Delete them from');
    console.log('  src/data/content-eval/retrofitPending.ts — the ratchet only shrinks.');
    for (const id of staleEntries) console.log(`  · ${id}`);
    console.log('');
  }

  const ok = unlistedFailures.length === 0 && missing.length === 0 && staleEntries.length === 0;
  console.log(`  ${ok ? 'OK' : 'FAILURES PRESENT'}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');
}

process.exit(unlistedFailures.length > 0 || missing.length > 0 || staleEntries.length > 0 ? 1 : 0);
