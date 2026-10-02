/**
 * `requiresLocation` is authored, never defaulted (THR-1294).
 *
 * The checkpoint gate used to read `template.requiresLocation ?? DEFAULT`, so a
 * template that said nothing silently took whatever the constant said — and the
 * type comment, the constant and the plan disagreed about what that was. The
 * constant is gone; this pins the replacement: every `multi_tick_project`
 * template, in the authored packs and in the synthesised undertaking cells (and so
 * every factory override, which inherits through `applyCellOverride`), states the
 * flag where a content author looks.
 *
 * The walk is over the *live* registries, not a hand-kept list, so a new pack or a
 * new cell is covered on arrival. The falsification arm deletes one flag from a
 * real template and shows the predicate refuses it.
 */
import { describe, it, expect } from 'vitest';
import { getAllStrategicTemplates } from '../strategicActionCandidates';
import { UNDERTAKING_CELL_TEMPLATES } from '../../data/undertaking-cells';
import type { StrategicActionTemplate } from '../../types/strategicAction';

function allTemplates(): StrategicActionTemplate[] {
  return [...getAllStrategicTemplates(), ...UNDERTAKING_CELL_TEMPLATES];
}

/** The ids of multi-tick templates that do not author `requiresLocation`. */
function unauthored(templates: readonly StrategicActionTemplate[]): string[] {
  return templates
    .filter(t => t.executionMode === 'multi_tick_project')
    .filter(t => typeof t.requiresLocation !== 'boolean')
    .map(t => t.id);
}

describe('requiresLocation is authored on every multi-tick template (THR-1294)', () => {
  it('walks a non-empty population across packs and cells', () => {
    const multiTick = allTemplates().filter(t => t.executionMode === 'multi_tick_project');
    const packs = multiTick.filter(t => !t.id.startsWith('cell.'));
    const cells = multiTick.filter(t => t.id.startsWith('cell.'));
    // Guards against a vacuous pass: an empty walk would satisfy the next assertion.
    expect(packs.length).toBeGreaterThan(30);
    expect(cells.length).toBeGreaterThan(0);
  });

  it('no multi-tick template leaves the flag to a default', () => {
    expect(unauthored(allTemplates())).toEqual([]);
  });

  it('every authored value is `false` while nothing moves an agent to its stage', () => {
    // Not a preference: with `true`, 150-tick medium runs rolled 50/736 (seed 42)
    // and 15/668 (seed 99) checkpoints. Authoring `true` needs a stage mover first.
    const stageBound = allTemplates()
      .filter(t => t.executionMode === 'multi_tick_project' && t.requiresLocation === true)
      .map(t => t.id);
    expect(stageBound).toEqual([]);
  });

  it('is falsifiable — deleting one flag is caught', () => {
    const real = allTemplates().find(t => t.executionMode === 'multi_tick_project')!;
    const { requiresLocation: _dropped, ...stripped } = real;
    const broken = allTemplates().map(t => (t.id === real.id ? (stripped as StrategicActionTemplate) : t));
    expect(unauthored(broken)).toEqual([real.id]);
  });
});
