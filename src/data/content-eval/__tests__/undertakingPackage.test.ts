/**
 * The undertaking compiler's contract (THR-1300 slice 3):
 *   - a package round-trips to a factory module whose prose is byte-identical;
 *   - registration into the factory index, the kind row and the profiles is idempotent;
 *   - a row-less kind opens only on its first destroy;
 *   - unknown top-level keys and role/verb mismatches are refused by name.
 *
 * The sources are edited as *strings* here — the same functions the CLI runs on the real
 * files — so the test proves the edit, not the filesystem.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import {
  AMBITION_TEMPLATES_FILE_RELPATH,
  FACTORY_INDEX_FILE_RELPATH,
  KIND_ROWS_FILE_RELPATH,
  deriveUndertakingConstName,
  emitUndertakingModule,
  emitUndertakingTest,
  registerInFactoryIndex,
  registerInKindRows,
  registerInProfiles,
  undertakingPackageViolations,
  unknownUndertakingPackageKeys,
  type UndertakingContentPackage,
} from '../undertakingPackage';
import { getStrategicTemplate } from '../../../engine/strategicActionCandidates';
import { AMBITION_TEMPLATES } from '../../ambition-templates';

const EXEMPLAR = getStrategicTemplate('strategic_establish_trade_route')!;
const PROFILE_WITH_STRATEGIC = AMBITION_TEMPLATES.find(a => a.strategicProfile?.templateIds.length)!;

function pkgFrom(overrides: Partial<UndertakingContentPackage> = {}): UndertakingContentPackage {
  return {
    slug: 'establish-trade-route',
    template: EXEMPLAR,
    kind: { kindId: 'trade_route', role: 'create' },
    profiles: [PROFILE_WITH_STRATEGIC.id],
    ...overrides,
  };
}

describe('undertaking package — validation', () => {
  it('refuses unknown top-level keys by name', () => {
    expect(unknownUndertakingPackageKeys({ slug: 'x', template: {}, kind: {}, profiles: [], extra: 1, imageTag: 'y' }))
      .toEqual(['extra', 'imageTag']);
  });

  it('accepts a well-formed package built from a shipped exemplar', () => {
    expect(undertakingPackageViolations(pkgFrom())).toEqual([]);
  });

  it('refuses a role that does not match the verb, a slug/id mismatch, and an unknown profile', () => {
    const v = undertakingPackageViolations(pkgFrom({ slug: 'other-slug', kind: { kindId: 'trade_route', role: 'destroy' }, profiles: ['ambition.does_not_exist'] }));
    expect(v.some(x => x.includes('does not match the slug'))).toBe(true);
    expect(v.some(x => x.includes("kind.role 'destroy' is not legal for verb 'create'"))).toBe(true);
    expect(v.some(x => x.includes("'ambition.does_not_exist'"))).toBe(true);
  });

  it('refuses a create in a kind that has no row — only a destroy may open one', () => {
    const v = undertakingPackageViolations(pkgFrom({ kind: { kindId: 'brand_new_kind', role: 'create' } }));
    expect(v.some(x => x.includes('only a destroy may open one'))).toBe(true);
  });
});

describe('undertaking package — emission round-trip', () => {
  it('pins the prose byte-identically in the module and the test', () => {
    const pkg = pkgFrom();
    const module = emitUndertakingModule(pkg);
    const constName = deriveUndertakingConstName(pkg.slug);
    expect(constName).toBe('ESTABLISH_TRADE_ROUTE_TEMPLATE');
    expect(module).toContain(`export const ${constName}: StrategicActionTemplate = {`);
    expect(module).toContain(`id: '${EXEMPLAR.id}'`);
    // The emitter wraps long strings across `+` continuations; joining the fragments must give the exact source text.
    const flattened = module.replace(/'\n\s+\+ '/g, '');
    for (const line of [...EXEMPLAR.activityProse, ...EXEMPLAR.completionProse]) {
      expect(flattened).toContain(line.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
    }
    const test = emitUndertakingTest(pkg);
    expect(test).toContain(JSON.stringify(EXEMPLAR.activityProse));
    expect(test).toContain(JSON.stringify(EXEMPLAR.completionProse));
    expect(test).toContain(`row.createTemplateIds).toContain(${constName}.id)`);
  });
});

describe('undertaking package — registration is idempotent', () => {
  const pkg = pkgFrom({
    slug: 'poison-the-well',
    template: { ...EXEMPLAR, id: 'strategic_poison_the_well' },
  });

  it('adds the export to the factory index once', () => {
    const source = readFileSync(FACTORY_INDEX_FILE_RELPATH, 'utf8');
    const once = registerInFactoryIndex(source, pkg);
    expect(once.changed).toBe(true);
    expect(once.source).toContain("import { POISON_THE_WELL_TEMPLATE } from './poison-the-well';");
    expect(once.source).toMatch(/= \[\n(?:.*\n)*  POISON_THE_WELL_TEMPLATE,\n\];/);
    const twice = registerInFactoryIndex(once.source, pkg);
    expect(twice.changed).toBe(false);
    expect(twice.source).toBe(once.source);
  });

  it('appends the id to an existing kind row column once', () => {
    const source = readFileSync(KIND_ROWS_FILE_RELPATH, 'utf8');
    const once = registerInKindRows(source, pkg);
    expect(once.changed).toBe(true);
    expect(once.source.split("'strategic_poison_the_well'").length).toBe(2);
    const twice = registerInKindRows(once.source, pkg);
    expect(twice.changed).toBe(false);
    expect(twice.source).toBe(once.source);
  });

  it('opens a new row only for a destroy carrying kind.row, and refuses any other role', () => {
    const source = readFileSync(KIND_ROWS_FILE_RELPATH, 'utf8');
    const destroy: UndertakingContentPackage = {
      ...pkg,
      template: { ...pkg.template, verb: 'destroy' },
      kind: { kindId: 'salted_field', role: 'destroy', row: { tier: 1, displayName: 'Salted field', objectShape: 'location.properties.salted', ownable: true, lexicon: 'place' } },
    };
    const opened = registerInKindRows(source, destroy);
    expect(opened.changed).toBe(true);
    expect(opened.source).toContain("kindId: 'salted_field'");
    expect(opened.source).toContain("destroyTemplateIds: ['strategic_poison_the_well']");
    expect(registerInKindRows(opened.source, destroy).changed).toBe(false);
    expect(() => registerInKindRows(source, { ...destroy, kind: { kindId: 'salted_field', role: 'create' } }))
      .toThrow(/cannot be registered without its counter-play/);
    expect(() => registerInKindRows(source, { ...destroy, kind: { kindId: 'salted_field', role: 'destroy' } }))
      .toThrow(/must carry kind\.row/);
  });

  it('appends the id to each named profile once and refuses an ambition without a profile', () => {
    const source = readFileSync(AMBITION_TEMPLATES_FILE_RELPATH, 'utf8');
    const once = registerInProfiles(source, pkg);
    expect(once.changed).toBe(true);
    expect(once.source.split("'strategic_poison_the_well'").length).toBe(2);
    const twice = registerInProfiles(once.source, pkg);
    expect(twice.changed).toBe(false);
    expect(twice.source).toBe(once.source);
    const noProfile = AMBITION_TEMPLATES.find(a => !a.strategicProfile);
    if (noProfile) {
      expect(() => registerInProfiles(source, { ...pkg, profiles: [noProfile.id] })).toThrow(/has no strategicProfile/);
    }
  });
});
