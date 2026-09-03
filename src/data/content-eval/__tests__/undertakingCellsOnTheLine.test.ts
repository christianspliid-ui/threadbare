/**
 * The line on cells (THR-1392 slice 3): every derived cell passes the undertaking
 * contract in the shipped context, a cell package compiles to an override applied to
 * its cell and registers in an ambition's `cells`, the override cap holds, and the
 * Package View shows a cell's object instead of a kind row.
 */
import { describe, it, expect } from 'vitest';
import { UNDERTAKING_CELL_TEMPLATES, applyCellOverride, cellTemplateId } from '../../undertaking-cells';
import { getAllStrategicTemplates } from '../../../engine/strategicActionCandidates';
import {
  buildUndertakingContractContext,
  checkUndertakingContract,
  failedBlocks,
  undertakingWriteSet,
  OWNABLE_TARGET_RULE_TYPES,
} from '../undertakingContract';
import {
  undertakingPackageViolations,
  resolvePackageTemplate,
  emitUndertakingModule,
  emitUndertakingTest,
  registerInProfiles,
  registerInKindRows,
  compiledOverrideCount,
  type UndertakingContentPackage,
} from '../undertakingPackage';
import { CELL_OVERRIDE_MAX_PER_CELL } from '../../strategic-action-constants';
import { buildUndertakingPackage, undertakingPackageIndex, undertakingTemplateById } from '../../../components/CMS/undertaking-package/buildUndertakingPackage';

describe('the contract on cells', () => {
  it('every cell passes all ten blocks in the shipped context', () => {
    const corpus = [...getAllStrategicTemplates(), ...UNDERTAKING_CELL_TEMPLATES];
    const ctx = buildUndertakingContractContext(corpus);
    const failing: string[] = [];
    for (const cell of UNDERTAKING_CELL_TEMPLATES) {
      const report = checkUndertakingContract(cell, ctx);
      const blocks = failedBlocks(report);
      if (blocks.length > 0) failing.push(`${cell.id}: ${report.violations.map(v => `${v.block} — ${v.message}`).join('; ')}`);
    }
    expect(failing, failing.join('\n')).toEqual([]);
    expect(OWNABLE_TARGET_RULE_TYPES.has('object')).toBe(true);
  });

  it('a cell\'s write set is its object semantic, and is never empty', () => {
    for (const cell of UNDERTAKING_CELL_TEMPLATES) {
      const writes = undertakingWriteSet(cell);
      expect(writes.object).toEqual({ verb: cell.cellVariant, objectTypeId: cell.objectTypeId });
      expect(writes.empty).toBe(false);
    }
  });
});

const CELL = cellTemplateId('destroy', 'item');

const pkg: UndertakingContentPackage = {
  slug: 'burn-the-charts',
  cell: { variant: 'destroy', objectTypeId: 'item' },
  override: {
    displayName: 'Burn the charts',
    activityProse: ['{Actor} feeds {object} to the fire a page at a time while {owner} sleeps.'],
    completionProse: ['{Object} is ash. {Owner} will find the hearth cold and know.'],
  },
  profiles: ['ambition_seek_revenge'],
  docComment: ['The pilot brief\'s chart-burning, as an override on undo × attachment.'],
};

describe('a cell package', () => {
  it('validates, resolves to the cell with the override applied, and refuses what a cell does not accept', () => {
    expect(undertakingPackageViolations(pkg)).toEqual([]);
    const t = resolvePackageTemplate(pkg)!;
    expect(t.id).toBe(`${CELL}.burn-the-charts`);
    expect(t.baseCellId).toBe(CELL);
    expect(t.cellVariant).toBe('destroy');
    expect(t.objectTypeId).toBe('item');
    expect(t.displayName).toBe('Burn the charts');
    expect(t.activityProse).toEqual(pkg.override!.activityProse);
    expect(t.targetRule).toEqual({ type: 'object', objectTypeId: 'item', ownership: 'other' });
    expect(t.motiveGate?.length).toBeGreaterThan(0);
    expect(t.harmClass).toBe('property_destroyed');

    expect(undertakingPackageViolations({ ...pkg, cell: { variant: 'observe', objectTypeId: 'item' } })).toContainEqual(expect.stringContaining('does not exist'));
    expect(undertakingPackageViolations({ ...pkg, override: { ...pkg.override, targetRule: 'x' } as never })).toContainEqual(expect.stringContaining("override names 'targetRule'"));
    expect(undertakingPackageViolations({ ...pkg, kind: { kindId: 'chart_find', role: 'destroy' } })).toContainEqual(expect.stringContaining('carries no kind'));
    expect(undertakingPackageViolations({ ...pkg, profiles: [] })).toContainEqual(expect.stringContaining('profiles is empty'));
  });

  it('emits the override as a call on its cell, and a test that pins the cells registration', () => {
    const mod = emitUndertakingModule(pkg);
    expect(mod).toContain("import { applyCellOverride } from '../../undertaking-cells';");
    expect(mod).toContain(`applyCellOverride(\n  ${JSON.stringify(CELL)},\n  "burn-the-charts",`);
    expect(mod).toContain('Burn the charts');
    const test = emitUndertakingTest(pkg);
    expect(test).toContain('strategicProfile?.cells');
    expect(test).not.toContain('getUndertakingKindRow');
  });

  it('registers in the ambition\'s cells (opening the list when absent) and never in a kind row', () => {
    const withCells = `    id: 'ambition_seek_revenge',\n    strategicProfile: {\n      cells: [\n        'cell.destroy.item',\n      ],\n      templateIds: [\n        'strategic_x',\n      ],\n    },\n`;
    const edit = registerInProfiles(withCells, pkg);
    expect(edit.changed).toBe(true);
    expect(edit.source).toContain(`'${CELL}.burn-the-charts',`);
    expect(registerInProfiles(edit.source, pkg).changed).toBe(false);

    const without = `    id: 'ambition_seek_revenge',\n    strategicProfile: {\n      templateIds: [\n        'strategic_x',\n      ],\n    },\n`;
    const opened = registerInProfiles(without, pkg);
    expect(opened.changed).toBe(true);
    expect(opened.source).toMatch(/cells: \[\s*'cell.destroy.item\.burn-the-charts'\s*\],\n\s*templateIds:/);

    expect(registerInKindRows('anything', pkg)).toEqual({ source: 'anything', changed: false });
  });

  it('holds the override cap', () => {
    const factory = Array.from({ length: CELL_OVERRIDE_MAX_PER_CELL }, (_, i) => applyCellOverride(CELL, `v${i}`, {}));
    expect(compiledOverrideCount(CELL, factory)).toBe(CELL_OVERRIDE_MAX_PER_CELL);
    expect(compiledOverrideCount(CELL, [])).toBe(0);
    expect(() => applyCellOverride('cell.no.such', 'x', {})).toThrow(/not a cell/);
  });
});

describe('the Package View on a cell', () => {
  it('shows the object block instead of a kind row, and lists cells in the index', () => {
    const cell = undertakingTemplateById(CELL)!;
    const view = buildUndertakingPackage(cell);
    expect(view.kind).toBeUndefined();
    expect(view.object).toMatchObject({ objectTypeId: 'item', variant: 'destroy', ownership: "another's", baseCellId: undefined });
    expect(view.object!.siblings).toContain('cell.control_seize.item');
    expect(view.writeSet.object).toEqual({ verb: 'destroy', objectTypeId: 'item' });
    expect(view.verdict.passed).toBe(true);
    expect(undertakingPackageIndex().some(r => r.templateId === CELL)).toBe(true);

    const override = buildUndertakingPackage(resolvePackageTemplate(pkg)!);
    expect(override.object?.baseCellId).toBe(CELL);
  });
});
