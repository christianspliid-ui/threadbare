/**
 * The Encounter Content Package — the factory's compile step. THR-1246.
 *
 * Director ask (Christian, chat, 2026-08-25): take the authoring agent's output
 * and configure it as game content mechanically, so the agent's context is
 * spent on content substance rather than on schema-learning. Pass 4's required
 * reading used to be the types file, two exemplar encounters, the ~5,700-line
 * registration file and a test exemplar — per encounter. This module replaces
 * that with a package the agent fills and a compiler that does the rest.
 *
 * ─── What a package is ───────────────────────────────────────────────
 * A JSON-serializable object carrying ONLY content substance: the template's
 * authored fields (prose verbatim, hands, aftermath, support bundle) plus a
 * slug and an optional doc-comment. Everything mechanical is the compiler's:
 *
 *   - `locationSubtypes` derived via `expandSettings(settings)` — never
 *     hand-written (the placeless-prose failure THR-884 closed);
 *   - `consequenceDraw` STAMPED from the binding draw (recomputed from
 *     id + reach + rarity, THR-1145) — never hand-copied, so it cannot drift
 *     from what `check:encounter` recomputes;
 *   - the `compileOpeningEnvelope` wrapper, imports, and const naming;
 *   - registration in BOTH catalog arrays (`UNIFIED_ACTION_TEMPLATES` and
 *     `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`), idempotently — with the
 *     location-cache half opt-out for group-exclusive templates (the THR-733
 *     note in the registration file);
 *   - a structural test with expected values baked from the package, so the
 *     scaffold cannot be vacuously green.
 *
 * ─── Why this is not a second format that can drift ──────────────────
 * The package's `template` field IS `UnifiedActionTemplate` (minus the two
 * derived fields), so there is no parallel vocabulary and no field mapping.
 * The legacy raw-entry converter's documented failure — a silent field
 * *allowlist* that drops what it does not know — is structurally impossible
 * here: the compiler copies the template through untouched, and the emitted
 * file annotates the object literal with the real type, so every unknown or
 * misshapen field is an excess-property/type error that `check:typecheck`
 * fails loudly. The deep validator is the TypeScript compiler on the real
 * type; this module only adds the semantic rules types cannot carry.
 *
 * ─── Placement ───────────────────────────────────────────────────────
 * Authoring-time only, like the rest of `content-eval/`: pure functions, no
 * fs (the CLI in `scripts/compile-encounter.ts` owns the writes), and nothing
 * under `src/engine/**` or `src/components/**` may import it.
 */

import type { ActionStep, StepNudge, UnifiedActionTemplate } from '../../types/unifiedAction';
import { expandSettings, validateSettingEnvelope } from '../settingClasses';
import {
  HAND_COMMON_OPTIONS_MIN,
  HAND_SPHERE_COVERAGE_MIN,
  NUDGE_BIG_DELTA,
  NUDGE_HAND_MAX,
  NUDGE_HAND_MIN,
} from './nudgeAuthoringConstants';
import { drawConsequenceHand } from './consequenceDraw';

// ─── Constants (NFP #1) ──────────────────────────────────────────────

/** Emitted string literals wrap near this column, split at word boundaries. */
export const EMIT_STRING_WRAP_COLUMN = 96;

/** The registration file every compiled encounter is added to. */
export const REGISTRATION_FILE_RELPATH = 'src/data/unified-action-templates.ts';

/**
 * The two catalog arrays a compiled encounter registers in.
 *
 * The first is the RAW array, deliberately: `UNIFIED_ACTION_TEMPLATES` is a
 * *derived* export (`RAW_UNIFIED_ACTION_TEMPLATES.map(...)` applying technical
 * effects, default support bundles and group affinity), so an entry inserted
 * "into" the derived declaration would actually land inside whatever array
 * closes next — the real registration file's own test arm caught exactly that.
 */
export const REGISTRATION_ARRAYS = [
  'RAW_UNIFIED_ACTION_TEMPLATES',
  'LOCATION_BRANCHING_ENCOUNTER_TEMPLATES',
] as const;

/**
 * Top-level package keys. Anything else is a LOUD error — the safe polarity.
 * (Template-level keys are deliberately NOT runtime-checked: the emitted file
 * annotates the literal with `UnifiedActionTemplate`, so the TypeScript
 * compiler rejects unknown fields with a named error. A runtime key list here
 * would be a hand-maintained shadow of the type — the drift the module header
 * forbids.)
 */
export const PACKAGE_TOP_LEVEL_KEYS = [
  'slug',
  'doc',
  'constName',
  'registerInLocationCache',
  'template',
] as const;

/** The seven legal `byOutcome` keys (the `UnifiedActionOutcome` union). */
export const AFTERMATH_OUTCOME_KEYS = [
  'success',
  'failure',
  'contested_won',
  'contested_lost',
  'critical_success',
  'critical_failure',
  'success_at_cost',
] as const;

// ─── The package ─────────────────────────────────────────────────────

/**
 * The template's content-substance fields: the real type minus the one field
 * the compiler always stamps. `locationSubtypes` stays present-but-optional in
 * the real type; a package that declares `settings` must leave it out (it is
 * derived), and one with no envelope may pass it explicitly.
 */
export type EncounterPackageTemplate = Omit<UnifiedActionTemplate, 'consequenceDraw'>;

export interface EncounterContentPackage {
  /** Kebab-case file slug — becomes `src/data/encounters/<slug>.ts`. */
  readonly slug: string;
  /**
   * Header doc-comment lines, emitted verbatim into the file's block comment —
   * the home for the narrator's-checklist evidence and authoring rationale the
   * exemplars carry.
   */
  readonly doc?: readonly string[];
  /** Exported const name. Derived from the slug when omitted. */
  readonly constName?: string;
  /**
   * Register in `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` as well (default
   * true). Group-exclusive templates set false — the location cache cannot
   * resolve them and the reachability suite reads that as the THR-811
   * polarity trap (the THR-733 note in the registration file).
   */
  readonly registerInLocationCache?: boolean;
  readonly template: EncounterPackageTemplate;
}

/** `the-cold-crossing` → `THE_COLD_CROSSING_TEMPLATE`. */
export function deriveConstName(slug: string): string {
  return `${slug.replace(/-/g, '_').toUpperCase()}_TEMPLATE`;
}

// ─── Validation ──────────────────────────────────────────────────────

function isPlainStep(step: unknown): step is ActionStep {
  return typeof step === 'object' && step !== null && 'narrativeTemplate' in step;
}

/**
 * Unknown top-level keys on a parsed (untyped) package. Split from
 * {@link encounterPackageViolations} because the CLI must run it BEFORE
 * casting the parsed JSON — a check that runs after the cast is decoration.
 */
export function unknownPackageKeys(parsed: object): readonly string[] {
  return Object.keys(parsed).filter(
    key => !(PACKAGE_TOP_LEVEL_KEYS as readonly string[]).includes(key),
  );
}

/**
 * Semantic violations — the rules the type system cannot carry. Returns
 * human-readable lines, never throws (NFP #4). Deep field typing is NOT
 * checked here by design; see the module header.
 */
export function encounterPackageViolations(pkg: EncounterContentPackage): readonly string[] {
  const problems: string[] = [];
  const template = pkg.template;

  // ── Identity ──
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(pkg.slug)) {
    problems.push(`slug '${pkg.slug}' is not kebab-case`);
  }
  if (!template?.id) {
    problems.push('template.id is missing');
  } else {
    if (!/^encounter\.[a-z0-9_]+\.[a-z0-9_]+$/.test(template.id)) {
      problems.push(
        `template.id '${template.id}' does not match encounter.<family>.<name>`,
      );
    }
    const idTail = template.id.split('.').pop();
    if (idTail !== pkg.slug.replace(/-/g, '_')) {
      problems.push(
        `template.id tail '${idTail}' does not match slug '${pkg.slug}' — the binding `
          + 'consequence draw is seeded by the id, so an id/slug mismatch invites a '
          + 'file whose recorded hand belongs to a different name',
      );
    }
  }
  if (pkg.constName !== undefined && !/^[A-Z][A-Z0-9_]*$/.test(pkg.constName)) {
    problems.push(`constName '${pkg.constName}' is not CONSTANT_CASE`);
  }

  // ── The stamped field must not be authored ──
  if ((template as { consequenceDraw?: unknown }).consequenceDraw !== undefined) {
    problems.push(
      'template.consequenceDraw is authored — the compiler stamps it from the binding '
        + 'draw (id + reach + rarity); delete the field',
    );
  }

  // ── Envelope ──
  const settings = template?.settings;
  if (settings && settings.length > 0) {
    if ((template as { locationSubtypes?: unknown }).locationSubtypes !== undefined) {
      problems.push(
        'template.locationSubtypes is authored alongside `settings` — it is derived via '
          + 'expandSettings(); delete the field',
      );
    }
    problems.push(
      ...validateSettingEnvelope({
        id: template.id ?? pkg.slug,
        settings,
        openings: template.openings,
        locationSubtypes: expandSettings(settings),
      }).map(line => `envelope: ${line}`),
    );
  }

  // ── Steps + hands ──
  const steps = template?.steps ?? [];
  if (steps.length === 0) problems.push('template.steps is empty');
  steps.forEach((step, index) => {
    if (!isPlainStep(step)) return; // branch steps carry their own variants
    if (typeof step.difficulty === 'number' && (step.difficulty < 0 || step.difficulty > 1)) {
      problems.push(`step ${index}: difficulty ${step.difficulty} outside [0, 1]`);
    }
    const hand = (step.nudges ?? []) as readonly StepNudge[];
    if (hand.length === 0) return;

    if (hand.length < NUDGE_HAND_MIN || hand.length > NUDGE_HAND_MAX) {
      problems.push(
        `step ${index}: hand of ${hand.length} outside ${NUDGE_HAND_MIN}–${NUDGE_HAND_MAX}`,
      );
    }
    const spheres = new Set(hand.map(nudge => nudge.sphere).filter(Boolean));
    if (spheres.size < HAND_SPHERE_COVERAGE_MIN) {
      problems.push(
        `step ${index}: ${spheres.size} distinct sphere(s) in the hand — floor is `
          + `${HAND_SPHERE_COVERAGE_MIN}`,
      );
    }
    const commons = hand.filter(
      nudge =>
        nudge.sphere === undefined
        && nudge.requiredTrait === undefined
        && nudge.requiresGroup === undefined
        && nudge.requiresFavor === undefined,
    );
    if (commons.length < HAND_COMMON_OPTIONS_MIN) {
      problems.push(
        `step ${index}: ${commons.length} ungated common (sphere-less) option(s) — floor is `
          + `${HAND_COMMON_OPTIONS_MIN}`,
      );
    }
    const riders = hand.filter(nudge => nudge.rider !== undefined);
    if (riders.length > 1) {
      problems.push(
        `step ${index}: ${riders.length} rider cards in one hand — at most one `
          + `(${riders.map(nudge => nudge.id).join(', ')})`,
      );
    }
    for (const nudge of hand) {
      const bands = nudge.bandProse ?? {};
      const hasFailureFragment = 'failure' in bands || 'critical_failure' in bands;
      if (!hasFailureFragment) {
        problems.push(
          `step ${index}: nudge '${nudge.id}' has no failure-band fragment — the god's `
            + 'hand must be traceable in failure',
        );
      }
      if ((nudge.forecastDelta ?? 0) >= NUDGE_BIG_DELTA) {
        if (!('failure' in bands) || !('critical_failure' in bands)) {
          problems.push(
            `step ${index}: big-delta nudge '${nudge.id}' (Δ${nudge.forecastDelta}) must `
              + 'cover both failure bands',
          );
        }
      }
    }
    // One shared prefix per encounter ('relic.a_little_more' style) and no
    // duplicate ids — the corpus convention, checked as consistency rather
    // than as a derivation nothing actually follows.
    const prefixes = new Set(hand.map(nudge => nudge.id.split('.')[0]));
    if (prefixes.size > 1) {
      problems.push(
        `step ${index}: nudge ids carry ${prefixes.size} different prefixes `
          + `(${[...prefixes].join(', ')}) — one encounter, one prefix`,
      );
    }
    if (hand.some(nudge => !nudge.id.includes('.'))) {
      problems.push(`step ${index}: a nudge id has no '<prefix>.' — ids are namespaced`);
    }
    const ids = new Set(hand.map(nudge => nudge.id));
    if (ids.size !== hand.length) {
      problems.push(`step ${index}: duplicate nudge ids in the hand`);
    }
  });

  // ── Aftermath ──
  const byOutcome = template?.aftermathConfig?.fallback?.byOutcome;
  if (byOutcome) {
    for (const key of Object.keys(byOutcome)) {
      if (!(AFTERMATH_OUTCOME_KEYS as readonly string[]).includes(key)) {
        problems.push(
          `aftermath fallback.byOutcome key '${key}' is not a UnifiedActionOutcome — `
            + 'near_miss and StepOutcome values do not key aftermath bands',
        );
      }
    }
  }

  return problems;
}

// ─── Assembly ────────────────────────────────────────────────────────

/**
 * The template as the game will hold it: the package's fields untouched, plus
 * the two derived fields. Pure; the emitted file reproduces exactly this.
 */
export function assembleTemplate(pkg: EncounterContentPackage): UnifiedActionTemplate {
  const template = pkg.template as UnifiedActionTemplate;
  const settings = template.settings;
  const locationSubtypes =
    settings && settings.length > 0 ? expandSettings(settings) : template.locationSubtypes;
  return {
    ...template,
    ...(locationSubtypes ? { locationSubtypes } : {}),
    consequenceDraw: drawConsequenceHand({
      templateId: template.id,
      reach: template.reach,
      rarityTier: template.rarityTier,
    }),
  };
}

// ─── TS emission ─────────────────────────────────────────────────────

/** Injected verbatim where a field's value is code, not data. */
class RawCode {
  readonly code: string;
  constructor(code: string) {
    this.code = code;
  }
}

const IDENTIFIER_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function escapeSegment(segment: string): string {
  return segment.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

/**
 * A string as TS source. Long prose is emitted as a `'…' + '…'` concatenation
 * split at paragraph and word boundaries so the generated file stays
 * hand-editable — the runtime value is byte-identical (pinned by round-trip
 * test), which is what "prose is verbatim" means once a machine owns the copy.
 */
export function printTsString(value: string, indent: string): string {
  const escaped = escapeSegment(value);
  if (escaped.length <= EMIT_STRING_WRAP_COLUMN) return `'${escaped}'`;

  // Split at paragraph breaks first (keeping the break with the left chunk),
  // then wrap each paragraph at word boundaries.
  const paragraphs = escaped.split(/(?<=\\n\\n)/);
  const chunks: string[] = [];
  for (const paragraph of paragraphs) {
    let rest = paragraph;
    while (rest.length > EMIT_STRING_WRAP_COLUMN) {
      let cut = rest.lastIndexOf(' ', EMIT_STRING_WRAP_COLUMN);
      if (cut <= 0) cut = EMIT_STRING_WRAP_COLUMN;
      chunks.push(rest.slice(0, cut + 1));
      rest = rest.slice(cut + 1);
    }
    if (rest.length > 0) chunks.push(rest);
  }
  return chunks.map(chunk => `'${chunk}'`).join(`\n${indent}  + `);
}

function printValue(value: unknown, indent: string): string {
  if (value instanceof RawCode) return value.code;
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
      return printTsString(value, indent);
    case 'number':
    case 'boolean':
      return String(value);
    case 'object':
      break;
    default:
      throw new Error(`cannot emit a ${typeof value} value`);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const simple =
      value.every(entry => typeof entry === 'string' || typeof entry === 'number')
      && value.reduce<number>((n, entry) => n + String(entry).length + 4, 0) < 70;
    if (simple) {
      return `[${value.map(entry => printValue(entry, indent)).join(', ')}]`;
    }
    const inner = value
      .map(entry => `${indent}  ${printValue(entry, `${indent}  `)},`)
      .join('\n');
    return `[\n${inner}\n${indent}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, entry]) => entry !== undefined,
  );
  if (entries.length === 0) return '{}';
  const inner = entries
    .map(([key, entry]) => {
      const printedKey = IDENTIFIER_KEY.test(key) ? key : `'${escapeSegment(key)}'`;
      return `${indent}  ${printedKey}: ${printValue(entry, `${indent}  `)},`;
    })
    .join('\n');
  return `{\n${inner}\n${indent}}`;
}

/**
 * The encounter module's full source. The literal is annotated with the real
 * type on an intermediate const — a FRESH object literal against an annotated
 * type is what buys excess-property checking, so an unknown field in the
 * package becomes a named `check:typecheck` failure instead of silently
 * shipping (the anti-allowlist half of the design; passing the literal
 * straight into the generic `compileOpeningEnvelope` would not check it).
 */
export function emitEncounterModule(pkg: EncounterContentPackage): string {
  const assembled = assembleTemplate(pkg);
  const constName = pkg.constName ?? deriveConstName(pkg.slug);
  const settings = pkg.template.settings;
  const derivesSubtypes = settings !== undefined && settings.length > 0;

  const emittable: Record<string, unknown> = { ...assembled };
  if (derivesSubtypes) {
    emittable.locationSubtypes = new RawCode(
      `expandSettings([${settings.map(cls => `'${cls}'`).join(', ')}])`,
    );
  }

  const docLines =
    pkg.doc && pkg.doc.length > 0
      ? pkg.doc
      : [`${assembled.name} — compiled from its content package by compile:encounter (THR-1246).`];
  const doc = ['/**', ...docLines.map(line => ` * ${line.replace(/\*\//g, '*\\/')}`), ' */'].join(
    '\n',
  );

  const settingImports = derivesSubtypes
    ? "import { compileOpeningEnvelope, expandSettings } from '../settingClasses';"
    : "import { compileOpeningEnvelope } from '../settingClasses';";

  return `${doc}

import type { UnifiedActionTemplate } from '../../types/unifiedAction';
${settingImports}

/**
 * The annotated literal: excess-property checking on the real type is this
 * file's deep validator ('check:typecheck' fails on any unknown field).
 * 'consequenceDraw' is STAMPED from the binding draw (THR-1145) — edit it only
 * by re-running the compiler or recording a 'consequenceSwap'.
 */
const TEMPLATE_BASE: UnifiedActionTemplate = ${printValue(emittable, '')};

export const ${constName}: UnifiedActionTemplate = compileOpeningEnvelope(TEMPLATE_BASE);
`;
}

// ─── Generated structural test ───────────────────────────────────────

/**
 * A structural test with expected values BAKED from the package — step count,
 * hand composition, sphere set, the stamped draw — so the scaffold asserts
 * this encounter's actual shape rather than passing vacuously on any template.
 */
export function emitEncounterTest(pkg: EncounterContentPackage): string {
  const assembled = assembleTemplate(pkg);
  const constName = pkg.constName ?? deriveConstName(pkg.slug);
  const plainSteps = assembled.steps.filter(isPlainStep);
  const handAssertions = plainSteps
    .map((step, index) => {
      const hand = (step.nudges ?? []) as readonly StepNudge[];
      if (hand.length === 0) return '';
      const ids = hand.map(nudge => `'${nudge.id}'`).join(', ');
      const spheres = [...new Set(hand.map(nudge => nudge.sphere).filter(Boolean))]
        .sort()
        .map(sphere => `'${sphere}'`)
        .join(', ');
      return `
  it('step ${index} deals the authored hand', () => {
    const step = ${constName}.steps[${index}];
    if (!('narrativeTemplate' in step)) throw new Error('expected a plain step');
    expect((step.nudges ?? []).map(nudge => nudge.id)).toEqual([${ids}]);
    const spheres = [...new Set((step.nudges ?? []).map(nudge => nudge.sphere).filter(Boolean))].sort();
    expect(spheres).toEqual([${spheres}]);
  });`;
    })
    .join('\n');

  const settings = assembled.settings ?? [];
  const envelopeAssertion =
    settings.length > 0
      ? `
  it('derives its location subtypes from the declared envelope', () => {
    expect(${constName}.settings).toEqual([${settings.map(cls => `'${cls}'`).join(', ')}]);
    expect(${constName}.locationSubtypes).toEqual(expandSettings([${settings
      .map(cls => `'${cls}'`)
      .join(', ')}]));
  });`
      : '';

  const draw = assembled.consequenceDraw ?? [];

  // Imports are conditional so a settings-less encounter's generated test does
  // not carry an unused import — TS6133 would land it on the ratchet.
  const settingImport =
    settings.length > 0 ? "\nimport { expandSettings } from '../../settingClasses';" : '';

  return `/**
 * ${assembled.name} — structural test generated by compile:encounter (THR-1246).
 * Expected values are baked from the content package, so this file asserts the
 * encounter's actual shape rather than any template's.
 */

import { describe, expect, it } from 'vitest';
import { ${constName} } from '../${pkg.slug}';${settingImport}
import { drawConsequenceHand } from '../../content-eval/consequenceDraw';

describe('${assembled.name} — template structure', () => {
  it('carries its identity', () => {
    expect(${constName}.id).toBe('${assembled.id}');
    expect(${constName}.reach).toBe('${assembled.reach}');
    expect(${constName}.rarityTier).toBe(${assembled.rarityTier});
    expect(${constName}.steps).toHaveLength(${assembled.steps.length});
  });
${handAssertions}${envelopeAssertion}

  it('records exactly the hand its id draws (binding, THR-1145)', () => {
    expect(${constName}.consequenceDraw).toEqual([${draw.map(family => `'${family}'`).join(', ')}]);
    expect(${constName}.consequenceDraw).toEqual(
      drawConsequenceHand({
        templateId: '${assembled.id}',
        reach: '${assembled.reach}',
        rarityTier: ${assembled.rarityTier},
      }),
    );
  });
});
`;
}

// ─── Registration ────────────────────────────────────────────────────

export interface RegistrationResult {
  readonly source: string;
  /** Which arrays actually gained an entry (idempotence: [] on a re-run). */
  readonly changed: readonly string[];
}

/**
 * Add the import line and the array entries to the registration file's
 * source. Pure text transform; idempotent — re-running on already-registered
 * source returns it unchanged with `changed: []`, so the CLI can always run
 * it and report honestly. Throws only when the file no longer contains the
 * landmarks (a structural change a human must see, not paper over).
 */
export function registerTemplateInSource(
  source: string,
  pkg: EncounterContentPackage,
): RegistrationResult {
  const constName = pkg.constName ?? deriveConstName(pkg.slug);
  const importLine = `import { ${constName} } from './encounters/${pkg.slug}';`;
  const changed: string[] = [];
  let out = source;

  if (!out.includes(importLine)) {
    const importPattern = /^import \{ [A-Z0-9_]+(?:, [A-Z0-9_]+)* \} from '\.\/encounters\/[^']+';$/gm;
    let lastMatch: RegExpExecArray | null = null;
    for (let match = importPattern.exec(out); match; match = importPattern.exec(out)) {
      lastMatch = match;
    }
    if (!lastMatch) {
      throw new Error(
        `no './encounters/…' import lines found in ${REGISTRATION_FILE_RELPATH} — `
          + 'the registration landmarks have moved; register by hand and update the compiler',
      );
    }
    const insertAt = lastMatch.index + lastMatch[0].length;
    out = `${out.slice(0, insertAt)}\n${importLine}${out.slice(insertAt)}`;
    changed.push('import');
  }

  const arrays: string[] = [REGISTRATION_ARRAYS[0]];
  if (pkg.registerInLocationCache !== false) arrays.push(REGISTRATION_ARRAYS[1]);

  for (const arrayName of arrays) {
    // `const X` matches both `const X` and `export const X` declarations.
    const declarationIndex = out.indexOf(`const ${arrayName}`);
    if (declarationIndex === -1) {
      throw new Error(
        `array '${arrayName}' not found in ${REGISTRATION_FILE_RELPATH} — `
          + 'the registration landmarks have moved; register by hand and update the compiler',
      );
    }
    const closeIndex = out.indexOf('\n];', declarationIndex);
    if (closeIndex === -1) {
      throw new Error(`array '${arrayName}' has no closing '];' — register by hand`);
    }
    const span = out.slice(declarationIndex, closeIndex);
    if (new RegExp(`\\b${constName}\\b`).test(span)) continue;
    out = `${out.slice(0, closeIndex)}\n  ${constName},${out.slice(closeIndex)}`;
    changed.push(arrayName);
  }

  return { source: out, changed };
}
