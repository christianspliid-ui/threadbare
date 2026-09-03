/**
 * The Undertaking Content Package — what `compile:undertaking` consumes (THR-1300
 * slice 3). `encounterPackage.ts` (THR-1246) is the sibling and decided the shape:
 * the package **is** the real template type plus the registration fields, so there
 * is no parallel vocabulary and the field-allowlist failure the legacy converter had
 * is impossible by construction — an unknown template field is a named
 * `check:typecheck` error on the emitted literal, never a silent drop.
 *
 *   {
 *     slug, template: StrategicActionTemplate (prose verbatim),
 *     kind: { kindId, role, row? }, profiles: [ambition ids], docComment?
 *   }
 *
 * The compiler (`scripts/compile-undertaking.ts`) validates, emits
 * `src/data/strategic-packs/factory/<slug>.ts` and its test, registers the export in
 * the factory aggregate, appends the id to the named kind row's column
 * **idempotently** — creating a row for a kind not yet registered **only when the
 * package is its first destroy**, so the registry's own rule (no row without
 * counter-play) is honoured by the tool that writes rows — and appends the id to each
 * named ambition profile. The compiled file is the canonical, hand-editable artifact
 * from then on: a configurator, not a build step.
 */

import type { StrategicActionTemplate, UndertakingKindId, UndertakingObjectTypeId, UndertakingVerbVariant } from '../../types/strategicAction';
import { applyCellOverride, cellTemplateId, getCellTemplate, type UndertakingCellOverride } from '../undertaking-cells';
import { CELL_OVERRIDE_MAX_PER_CELL } from '../strategic-action-constants';
import { FACTORY_STRATEGIC_TEMPLATES } from '../strategic-packs/factory/index';
import {
  AMBITION_TEMPLATES,
  EVENT_MINTED_AMBITION_TEMPLATES,
  GRIEVANCE_AMBITION_TEMPLATES,
} from '../ambition-templates';
import { getAllUndertakingKindRows } from '../undertaking-kinds';
import { printTsString } from './encounterPackage';

// ─── Shape ────────────────────────────────────────────────────────

export const UNDERTAKING_PACKAGE_TOP_LEVEL_KEYS = ['slug', 'template', 'kind', 'profiles', 'docComment', 'cell', 'override'] as const;

export const KIND_ROWS_FILE_RELPATH = 'src/data/undertaking-kinds.ts';
export const AMBITION_TEMPLATES_FILE_RELPATH = 'src/data/ambition-templates.ts';
export const FACTORY_INDEX_FILE_RELPATH = 'src/data/strategic-packs/factory/index.ts';
export const FACTORY_DIR_RELPATH = 'src/data/strategic-packs/factory';

export type UndertakingKindRole = 'create' | 'update' | 'destroy';

export interface UndertakingPackageKind {
  readonly kindId: UndertakingKindId;
  readonly role: UndertakingKindRole;
  /**
   * Required only when the kind has no row yet **and** this package is its first
   * destroy — the row is created from these fields. Ignored otherwise.
   */
  readonly row?: {
    readonly tier: 1 | 2 | 3;
    readonly displayName: string;
    readonly objectShape: string;
    readonly ownable: boolean;
    readonly lexicon: string;
  };
}

/**
 * A cell package (THR-1392 slice 3): an authored override on a derived cell instead
 * of a whole template. `template` and `kind` are absent — the cell supplies both —
 * and `profiles` registers the override in each ambition's `cells`.
 */
export interface UndertakingCellPackageSpec {
  readonly variant: UndertakingVerbVariant;
  readonly objectTypeId: UndertakingObjectTypeId;
}

export interface UndertakingContentPackage {
  /** kebab-case; names the files. */
  readonly slug: string;
  /** The real type. Prose verbatim. */
  readonly template?: StrategicActionTemplate;
  readonly kind?: UndertakingPackageKind;
  /** Present on a cell package; `template` and `kind` are then derived. */
  readonly cell?: UndertakingCellPackageSpec;
  readonly override?: UndertakingCellOverride;
  /** Ambition template ids whose `strategicProfile.templateIds` gain this id. */
  readonly profiles: readonly string[];
  /** Optional file header lines. */
  readonly docComment?: readonly string[];
}

export function deriveUndertakingConstName(slug: string): string {
  return `${slug.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}_TEMPLATE`;
}

export function unknownUndertakingPackageKeys(parsed: object): readonly string[] {
  const known = new Set<string>(UNDERTAKING_PACKAGE_TOP_LEVEL_KEYS);
  return Object.keys(parsed).filter(k => !known.has(k));
}

const ROLE_FOR_VERB: Readonly<Record<string, readonly UndertakingKindRole[]>> = {
  create: ['create'],
  change: ['update'],
  gather_info: ['update'],
  control: ['update'],
  destroy: ['destroy'],
};

/** Every ambition id any of the three template lists carries. */
export function knownAmbitionIds(): ReadonlySet<string> {
  return new Set([...AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES].map(a => a.id));
}

/**
 * Structural violations the compiler refuses on. Contract violations are the gate's
 * business (`check:undertaking` runs after compile); these are the ones that would
 * make registration itself wrong.
 */
/** Whether the package is a cell package. */
export function isCellPackage(pkg: UndertakingContentPackage): boolean {
  return pkg.cell !== undefined;
}

/** The base cell id a cell package overrides. */
export function packageCellId(pkg: UndertakingContentPackage): string | undefined {
  return pkg.cell ? cellTemplateId(pkg.cell.variant, pkg.cell.objectTypeId) : undefined;
}

/**
 * The template a package stands for: its own, or the cell with the override applied.
 * Returns undefined when a cell package names a cell that does not exist.
 */
export function resolvePackageTemplate(pkg: UndertakingContentPackage): StrategicActionTemplate | undefined {
  if (pkg.cell) {
    const cellId = packageCellId(pkg)!;
    if (!getCellTemplate(cellId)) return undefined;
    return applyCellOverride(cellId, pkg.slug, pkg.override ?? {});
  }
  return pkg.template;
}

/** How many compiled overrides a cell already carries in the factory aggregate. */
export function compiledOverrideCount(cellId: string, factory: readonly StrategicActionTemplate[] = FACTORY_STRATEGIC_TEMPLATES): number {
  return factory.filter(t => t.baseCellId === cellId).length;
}

export function undertakingPackageViolations(pkg: UndertakingContentPackage): readonly string[] {
  if (pkg.cell) {
    const v: string[] = [];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.slug ?? '')) v.push(`slug '${pkg.slug}' is not kebab-case`);
    const cellId = packageCellId(pkg)!;
    if (!getCellTemplate(cellId)) v.push(`cell '${cellId}' does not exist — the object type declares no '${pkg.cell.variant}' semantic`);
    if (pkg.template) v.push('a cell package carries no template — the cell supplies it');
    if (pkg.kind) v.push('a cell package carries no kind — the object type supplies it');
    const legalOverride = ['displayName', 'activityProse', 'completionProse', 'cast', 'creationEffects', 'executionMode', 'projectDuration', 'catalystEncounterIds', 'reachProfile'];
    for (const k of Object.keys(pkg.override ?? {})) if (!legalOverride.includes(k)) v.push(`override names '${k}', which is not an override a cell accepts (${legalOverride.join(', ')})`);
    if (getCellTemplate(cellId) && compiledOverrideCount(cellId) >= CELL_OVERRIDE_MAX_PER_CELL) {
      v.push(`cell '${cellId}' already carries ${CELL_OVERRIDE_MAX_PER_CELL} compiled overrides (CELL_OVERRIDE_MAX_PER_CELL) — one more is a pack again`);
    }
    if (!Array.isArray(pkg.profiles) || pkg.profiles.length === 0) v.push('profiles is empty — the override would be unreachable (no ambition names it)');
    const known = knownAmbitionIds();
    for (const id of pkg.profiles ?? []) if (!known.has(id)) v.push(`profiles names '${id}', which is not an ambition template`);
    return v;
  }
  const v: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.slug ?? '')) v.push(`slug '${pkg.slug}' is not kebab-case`);
  const t = pkg.template;
  if (!t || typeof t !== 'object') { v.push('template is missing'); return v; }
  if (!t.id?.startsWith('strategic_')) v.push(`template.id '${t.id}' lacks the 'strategic_' prefix`);
  if (t.id !== `strategic_${(pkg.slug ?? '').replace(/-/g, '_')}`) v.push(`template.id '${t.id}' does not match the slug (expected 'strategic_${(pkg.slug ?? '').replace(/-/g, '_')}')`);
  if (!pkg.kind?.kindId) v.push('kind.kindId is missing');
  const legal = ROLE_FOR_VERB[t.verb] ?? [];
  if (!pkg.kind?.role || !legal.includes(pkg.kind.role)) v.push(`kind.role '${pkg.kind?.role}' is not legal for verb '${t.verb}' (expected ${legal.join(' | ') || 'none'})`);
  const rows = getAllUndertakingKindRows();
  const row = rows.find(r => r.kindId === pkg.kind?.kindId);
  if (!row) {
    if (pkg.kind?.role !== 'destroy') {
      v.push(`kind '${pkg.kind?.kindId}' has no row, and only a destroy may open one — until a kind can be undone it is not a kind`);
    } else if (!pkg.kind.row) {
      v.push(`kind '${pkg.kind.kindId}' has no row; the first destroy must carry kind.row { tier, displayName, objectShape, ownable, lexicon }`);
    }
  }
  if (t.verb === 'destroy') {
    if (!t.motiveGate?.length) v.push('a destroy verb carries no motiveGate');
    if (!t.harmClass) v.push('a destroy verb carries no harmClass');
  }
  if (!Array.isArray(pkg.profiles) || pkg.profiles.length === 0) v.push('profiles is empty — the template would be unreachable (no ambition names it)');
  const known = knownAmbitionIds();
  for (const id of pkg.profiles ?? []) if (!known.has(id)) v.push(`profiles names '${id}', which is not an ambition template`);
  if (!t.activityProse?.length || !t.completionProse?.length) v.push('activityProse and completionProse must each carry at least one entry');
  return v;
}

// ─── Emission ─────────────────────────────────────────────────────

const IDENTIFIER_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function printValue(value: unknown, indent: string): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string': return printTsString(value, indent);
    case 'number':
    case 'boolean': return String(value);
    case 'object': break;
    default: throw new Error(`cannot emit a ${typeof value} value`);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const simple = value.every(e => typeof e === 'string' || typeof e === 'number')
      && value.reduce<number>((n, e) => n + String(e).length + 4, 0) < 70;
    if (simple) return `[${value.map(e => printValue(e, indent)).join(', ')}]`;
    return `[\n${value.map(e => `${indent}  ${printValue(e, `${indent}  `)},`).join('\n')}\n${indent}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([, e]) => e !== undefined);
  if (entries.length === 0) return '{}';
  const inner = entries
    .map(([k, e]) => `${indent}  ${IDENTIFIER_KEY.test(k) ? k : `'${k.replace(/'/g, "\\'")}'`}: ${printValue(e, `${indent}  `)},`)
    .join('\n');
  return `{\n${inner}\n${indent}}`;
}

export function emitUndertakingModule(pkg: UndertakingContentPackage): string {
  const constName = deriveUndertakingConstName(pkg.slug);
  const template = resolvePackageTemplate(pkg);
  if (!template) throw new Error(`emitUndertakingModule: package '${pkg.slug}' resolves to no template`);
  const docLines = pkg.docComment?.length
    ? pkg.docComment
    : [`${template.displayName} — compiled from its content package by compile:undertaking (${pkg.cell ? 'THR-1392' : 'THR-1300'}).`];
  const doc = ['/**', ...docLines.map(l => ` * ${l.replace(/\*\//g, '*\\/')}`), ' */'].join('\n');
  if (pkg.cell) {
    // A cell override is emitted as the call, not the flattened template: the cell's
    // tables and rule stay the registry's, so a later retune of the verb tables
    // reaches every compiled override without recompiling it.
    return `${doc}
import type { StrategicActionTemplate } from '../../../types/strategicAction';
import { applyCellOverride } from '../../undertaking-cells';

export const ${constName}: StrategicActionTemplate = applyCellOverride(
  ${JSON.stringify(packageCellId(pkg))},
  ${JSON.stringify(pkg.slug)},
  ${printValue(pkg.override ?? {}, '')},
);
`;
  }
  return `${doc}
import type { StrategicActionTemplate } from '../../../types/strategicAction';

export const ${constName}: StrategicActionTemplate = ${printValue(template, '')};
`;
}

export function emitUndertakingTest(pkg: UndertakingContentPackage): string {
  const constName = deriveUndertakingConstName(pkg.slug);
  const t = resolvePackageTemplate(pkg)!;
  if (pkg.cell) {
    return `/**
 * ${t.displayName} — structural pins baked from its cell package by
 * compile:undertaking (THR-1392). The contract and the live proof own quality;
 * this file owns the shape: the override applies to its cell, the prose round-trips
 * byte-identically, and the two registrations (factory aggregate, ambition cells)
 * hold.
 */
import { describe, it, expect } from 'vitest';
import { ${constName} } from '../${pkg.slug}';
import { FACTORY_STRATEGIC_TEMPLATES } from '../index';
import { getStrategicTemplate } from '../../../../engine/strategicActionCandidates';
import { AMBITION_TEMPLATES, EVENT_MINTED_AMBITION_TEMPLATES, GRIEVANCE_AMBITION_TEMPLATES } from '../../../ambition-templates';

describe('${t.id} (compiled cell override)', () => {
  it('is its cell with the override applied, prose verbatim', () => {
    expect(${constName}.id).toBe(${JSON.stringify(t.id)});
    expect(${constName}.baseCellId).toBe(${JSON.stringify(packageCellId(pkg))});
    expect(${constName}.cellVariant).toBe(${JSON.stringify(t.cellVariant)});
    expect(${constName}.objectTypeId).toBe(${JSON.stringify(t.objectTypeId)});
    expect(${constName}.displayName).toBe(${JSON.stringify(t.displayName)});
    expect(${constName}.activityProse).toEqual(${JSON.stringify(t.activityProse)});
    expect(${constName}.completionProse).toEqual(${JSON.stringify(t.completionProse)});
  });

  it('is registered in the factory aggregate and the template registry', () => {
    expect(FACTORY_STRATEGIC_TEMPLATES.some(x => x.id === ${constName}.id)).toBe(true);
    expect(getStrategicTemplate(${constName}.id)?.id).toBe(${constName}.id);
  });

  it('is reachable through every profile the package named, in its cells', () => {
    const all = [...AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES];
    for (const ambitionId of ${JSON.stringify(pkg.profiles)}) {
      const ambition = all.find(a => a.id === ambitionId);
      expect(ambition?.strategicProfile?.cells, ambitionId).toContain(${constName}.id);
    }
  });
});
`;
  }
  return `/**
 * ${t.displayName} — structural pins baked from its content package by
 * compile:undertaking (THR-1300). The contract and the live proof own quality;
 * this file owns the shape: the prose round-trips byte-identically, and the three
 * registrations (factory aggregate, kind row, ambition profiles) all hold.
 */
import { describe, it, expect } from 'vitest';
import { ${constName} } from '../${pkg.slug}';
import { FACTORY_STRATEGIC_TEMPLATES } from '../index';
import { getStrategicTemplate } from '../../../../engine/strategicActionCandidates';
import { getUndertakingKindForTemplate, getUndertakingKindRow } from '../../../undertaking-kinds';
import { AMBITION_TEMPLATES, EVENT_MINTED_AMBITION_TEMPLATES, GRIEVANCE_AMBITION_TEMPLATES } from '../../../ambition-templates';

describe('${t.id} (compiled)', () => {
  it('carries its identity and prose verbatim', () => {
    expect(${constName}.id).toBe(${JSON.stringify(t.id)});
    expect(${constName}.verb).toBe(${JSON.stringify(t.verb)});
    expect(${constName}.executionMode).toBe(${JSON.stringify(t.executionMode)});
    expect(${constName}.displayName).toBe(${JSON.stringify(t.displayName)});
    expect(${constName}.activityProse).toEqual(${JSON.stringify(t.activityProse)});
    expect(${constName}.completionProse).toEqual(${JSON.stringify(t.completionProse)});
  });

  it('is registered in the factory aggregate and the template registry', () => {
    expect(FACTORY_STRATEGIC_TEMPLATES.some(x => x.id === ${constName}.id)).toBe(true);
    expect(getStrategicTemplate(${constName}.id)?.id).toBe(${constName}.id);
  });

  it('sits in the ${pkg.kind!.role} column of its kind row', () => {
    expect(getUndertakingKindForTemplate(${constName}.id)).toBe(${JSON.stringify(pkg.kind!.kindId)});
    const row = getUndertakingKindRow(${JSON.stringify(pkg.kind!.kindId)})!;
    expect(row.${pkg.kind!.role}TemplateIds).toContain(${constName}.id);
  });

  it('is reachable through every profile the package named', () => {
    const all = [...AMBITION_TEMPLATES, ...EVENT_MINTED_AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES];
    for (const ambitionId of ${JSON.stringify(pkg.profiles)}) {
      const ambition = all.find(a => a.id === ambitionId);
      expect(ambition?.strategicProfile?.templateIds, ambitionId).toContain(${constName}.id);
    }
  });
});
`;
}

// ─── Registration (idempotent source edits) ──────────────────────

export interface SourceEdit {
  readonly source: string;
  readonly changed: boolean;
}

/** Add the compiled export to `FACTORY_STRATEGIC_TEMPLATES`, once. */
export function registerInFactoryIndex(source: string, pkg: UndertakingContentPackage): SourceEdit {
  const constName = deriveUndertakingConstName(pkg.slug);
  const importLine = `import { ${constName} } from './${pkg.slug}';`;
  let out = source;
  let changed = false;
  if (!out.includes(importLine)) {
    const anchor = "import type { StrategicActionTemplate } from '../../../types/strategicAction';";
    const at = out.indexOf(anchor);
    if (at === -1) throw new Error(`${FACTORY_INDEX_FILE_RELPATH}: type import landmark not found — register by hand and update the compiler`);
    const insertAt = at + anchor.length;
    out = `${out.slice(0, insertAt)}\n${importLine}${out.slice(insertAt)}`;
    changed = true;
  }
  const decl = 'export const FACTORY_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [';
  const declAt = out.indexOf(decl);
  if (declAt === -1) throw new Error(`${FACTORY_INDEX_FILE_RELPATH}: aggregate landmark not found — register by hand and update the compiler`);
  const closeAt = out.indexOf('\n];', declAt);
  if (closeAt === -1) throw new Error(`${FACTORY_INDEX_FILE_RELPATH}: aggregate has no closing '];'`);
  const body = out.slice(declAt + decl.length, closeAt);
  if (!new RegExp(`(^|\\s)${constName},`).test(body)) {
    out = `${out.slice(0, closeAt)}\n  ${constName},${out.slice(closeAt)}`;
    changed = true;
  }
  return { source: out, changed };
}

function insertIntoStringArray(source: string, arrayStartAt: number, id: string, fileLabel: string, arrayLabel: string): SourceEdit {
  const open = source.indexOf('[', arrayStartAt);
  if (open === -1) throw new Error(`${fileLabel}: '${arrayLabel}' has no opening '['`);
  const close = source.indexOf(']', open);
  if (close === -1) throw new Error(`${fileLabel}: '${arrayLabel}' has no closing ']'`);
  const body = source.slice(open + 1, close);
  if (new RegExp(`'${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`).test(body)) return { source, changed: false };
  const multiline = body.includes('\n');
  const trimmed = body.trim();
  let newBody: string;
  if (multiline) {
    const indentMatch = body.match(/\n([ \t]+)'/);
    const indent = indentMatch?.[1] ?? '      ';
    const withoutTrailing = body.replace(/\s+$/, '');
    newBody = `${withoutTrailing}${withoutTrailing.trim().endsWith(',') || withoutTrailing.trim() === '' ? '' : ','}\n${indent}'${id}',\n${indent.slice(0, Math.max(0, indent.length - 2))}`;
  } else {
    newBody = trimmed === '' ? `'${id}'` : `${trimmed.replace(/,\s*$/, '')}, '${id}'`;
  }
  return { source: `${source.slice(0, open + 1)}${newBody}${source.slice(close)}`, changed: true };
}

/**
 * Append the template id to the named kind row's C/U/D column in
 * `undertaking-kinds.ts`, idempotently. A kind with no row is opened **only by its
 * first destroy** (with `kind.row` supplied); any other role on a row-less kind is
 * refused — the registry's rule, honoured by the tool that writes rows.
 */
export function registerInKindRows(source: string, pkg: UndertakingContentPackage): SourceEdit {
  // A cell has no row; the object type is its membership (THR-1392 slice 3).
  if (pkg.cell || !pkg.kind) return { source, changed: false };
  const { kindId, role } = pkg.kind;
  const column = `${role}TemplateIds`;
  const rowAt = source.indexOf(`kindId: '${kindId}'`);
  if (rowAt === -1) {
    if (role !== 'destroy') {
      throw new Error(`kind '${kindId}' has no row and this package is a ${role}, not a destroy — a kind cannot be registered without its counter-play`);
    }
    const spec = pkg.kind.row;
    if (!spec) throw new Error(`kind '${kindId}' has no row; the first destroy must carry kind.row`);
    const arrayDecl = 'export const UNDERTAKING_KIND_ROWS: readonly UndertakingKindRow[] = [';
    const declAt = source.indexOf(arrayDecl);
    if (declAt === -1) throw new Error(`${KIND_ROWS_FILE_RELPATH}: registry landmark not found — register by hand and update the compiler`);
    const closeAt = source.indexOf('\n];', declAt);
    if (closeAt === -1) throw new Error(`${KIND_ROWS_FILE_RELPATH}: registry has no closing '];'`);
    const rowText = [
      '',
      `  // ── Opened by the undertaking factory (THR-1300): first destroy \`${pkg.template!.id}\` ──`,
      '  {',
      `    kindId: '${kindId}',`,
      `    tier: ${spec.tier},`,
      `    displayName: ${JSON.stringify(spec.displayName)},`,
      `    objectShape: ${JSON.stringify(spec.objectShape)},`,
      `    ownable: ${spec.ownable},`,
      '    createTemplateIds: [],',
      '    updateTemplateIds: [],',
      `    destroyTemplateIds: ['${pkg.template!.id}'],`,
      `    lexicon: '${spec.lexicon}',`,
      '  },',
    ].join('\n');
    return { source: `${source.slice(0, closeAt)}${rowText}${source.slice(closeAt)}`, changed: true };
  }
  const rowEnd = source.indexOf('\n  },', rowAt);
  const columnAt = source.indexOf(`${column}:`, rowAt);
  if (columnAt === -1 || (rowEnd !== -1 && columnAt > rowEnd)) {
    throw new Error(`${KIND_ROWS_FILE_RELPATH}: row '${kindId}' has no '${column}' — register by hand`);
  }
  return insertIntoStringArray(source, columnAt, pkg.template!.id, KIND_ROWS_FILE_RELPATH, `${kindId}.${column}`);
}

/** Append the template id to each named ambition's `strategicProfile.templateIds`, idempotently. */
export function registerInProfiles(source: string, pkg: UndertakingContentPackage): SourceEdit {
  let out = source;
  let changed = false;
  for (const ambitionId of pkg.profiles) {
    const idAt = out.indexOf(`id: '${ambitionId}'`);
    if (idAt === -1) throw new Error(`${AMBITION_TEMPLATES_FILE_RELPATH}: ambition '${ambitionId}' not found`);
    const nextId = out.indexOf("\n    id: '", idAt + 1);
    const profileAt = out.indexOf('strategicProfile:', idAt);
    if (profileAt === -1 || (nextId !== -1 && profileAt > nextId)) {
      throw new Error(`${AMBITION_TEMPLATES_FILE_RELPATH}: ambition '${ambitionId}' has no strategicProfile — a profile must exist before a template can be registered into it`);
    }
    const idsAt = out.indexOf('templateIds:', profileAt);
    if (idsAt === -1) throw new Error(`${AMBITION_TEMPLATES_FILE_RELPATH}: ambition '${ambitionId}' profile has no templateIds`);
    const templateId = resolvePackageTemplate(pkg)!.id;
    if (pkg.cell) {
      // A cell override registers in the profile's `cells` list (THR-1392 slice 3),
      // opened just above `templateIds` when the profile has none yet.
      let cellsAt = out.indexOf('cells:', profileAt);
      if (cellsAt === -1 || cellsAt > idsAt) {
        const lineStart = out.lastIndexOf('\n', idsAt) + 1;
        const indent = out.slice(lineStart, idsAt);
        out = `${out.slice(0, lineStart)}${indent}cells: [],\n${out.slice(lineStart)}`;
        cellsAt = out.indexOf('cells:', profileAt);
      }
      const edit = insertIntoStringArray(out, cellsAt, templateId, AMBITION_TEMPLATES_FILE_RELPATH, `${ambitionId}.cells`);
      out = edit.source;
      changed = changed || edit.changed;
      continue;
    }
    const edit = insertIntoStringArray(out, idsAt, templateId, AMBITION_TEMPLATES_FILE_RELPATH, `${ambitionId}.templateIds`);
    out = edit.source;
    changed = changed || edit.changed;
  }
  return { source: out, changed };
}
