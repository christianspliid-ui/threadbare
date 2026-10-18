/**
 * mapLenses.coverage.test.ts — the named Law 58 test for MAP_LENSES (THR-1878 plan § D1).
 *
 * A map lens is one row in `src/data/map-lenses.ts`, one entry in `LENS_SELECTORS`
 * (`src/engine/views/lenses/lensView.ts`) and its marks in `MAP_MARKERS`. A hex lens
 * writes no layer code. This test fails, naming the list and the missing entry, when
 * any of those is incomplete.
 */
import { describe, it, expect } from 'vitest';
import { MAP_LENSES, MAP_LENS_KEYS, mapLensForKey, mapLensById, isMapLensId } from '../map-lenses';
import { MAP_MARKERS, legendEntriesFor } from '../map-markers';
import { MAP_COMMANDS } from '../map-commands';
import { TOP_BAR_KEYS } from '../top-bar-keys';
import { getUITooltip } from '../ui-content';
import { LENS_SELECTORS, HEX_LENS_SELECTORS, selectLensView, lensLayerOf, type HexLensId } from '../../engine/views/lenses/lensView';
import { buildViewContext } from '../../engine/views/viewContext';
import { dominionLensVM } from '../../engine/dominionViewModels';
import { lensFixture } from '../../engine/views/lenses/__tests__/lensFixture';

const fold = (k: string) => k.toLowerCase();

describe('MAP_LENSES coverage (Law 58)', () => {
  it('ids are unique', () => {
    const ids = MAP_LENSES.map(l => l.id);
    expect(new Set(ids).size, 'MAP_LENSES has a duplicate id').toBe(ids.length);
  });

  it('keys are unique, inside 1–5, never 5 (reserved), and disjoint from TOP_BAR_KEYS and MAP_COMMANDS', () => {
    const keys = MAP_LENSES.map(l => l.key);
    expect(new Set(keys).size, 'MAP_LENSES has a duplicate key').toBe(keys.length);
    const taken = new Set([...TOP_BAR_KEYS, ...MAP_COMMANDS.flatMap(c => [...c.keys])].map(fold));
    for (const lens of MAP_LENSES) {
      expect(MAP_LENS_KEYS, `MAP_LENSES.${lens.id} key '${lens.key}' is outside 1–5`).toContain(lens.key);
      expect(lens.key, `MAP_LENSES.${lens.id} takes the reserved key 5`).not.toBe('5');
      expect(taken.has(fold(lens.key)), `MAP_LENSES.${lens.id} key '${lens.key}' collides with TOP_BAR_KEYS or MAP_COMMANDS`).toBe(false);
      expect(mapLensForKey(lens.key)?.id).toBe(lens.id);
    }
  });

  it.each(MAP_LENSES.map(l => [l.id, l] as const))('MAP_LENSES.%s: its tooltip is registered and its label is set', (_id, lens) => {
    expect(lens.label.trim().length, `MAP_LENSES.${lens.id} has no label`).toBeGreaterThan(0);
    expect(getUITooltip(lens.tooltipId), `MAP_LENSES.${lens.id} tooltip '${lens.tooltipId}' is not in UI_TOOLTIPS`).not.toBeNull();
    expect(lens.legend.length, `MAP_LENSES.${lens.id} has no legend lines`).toBeGreaterThan(0);
  });

  it.each(MAP_LENSES.map(l => [l.id, l] as const))('MAP_LENSES.%s: LENS_SELECTORS has its entry, drawn by the same layer family', (_id, lens) => {
    const entry = (LENS_SELECTORS as Record<string, { layer: string } | undefined>)[lens.id];
    expect(entry, `LENS_SELECTORS has no entry for MAP_LENSES.${lens.id}`).toBeDefined();
    expect(entry?.layer, `LENS_SELECTORS.${lens.id} draws with '${entry?.layer}', MAP_LENSES says '${lens.layer}'`).toBe(lens.layer);
    expect(lensLayerOf(lens.id)).toBe(lens.layer);
  });

  it('LENS_SELECTORS names no lens that MAP_LENSES lacks', () => {
    for (const id of Object.keys(LENS_SELECTORS)) {
      expect(isMapLensId(id), `LENS_SELECTORS.${id} has no MAP_LENSES row`).toBe(true);
    }
  });

  const hexLenses = MAP_LENSES.filter(l => l.layer === 'hex').map(l => l.id as HexLensId);

  it.each(hexLenses)('hex lens %s emits only mark kinds MAP_MARKERS lists for it', (lensId) => {
    const { state, tiles } = lensFixture();
    const vm = HEX_LENS_SELECTORS[lensId].build(buildViewContext(null, state, tiles));
    expect(vm.marks.length, `${lensId} emits no marks on the shared lens fixture`).toBeGreaterThan(0);
    for (const mark of vm.marks) {
      const row = (MAP_MARKERS as Record<string, { lens: string | null } | undefined>)[mark.kind];
      expect(row, `${lensId} emits mark kind '${mark.kind}', which has no MAP_MARKERS row`).toBeDefined();
      expect(row?.lens, `MAP_MARKERS.${mark.kind} belongs to lens '${row?.lens}', not '${lensId}'`).toBe(lensId);
    }
  });

  it.each(hexLenses)('hex lens %s has a derived legend mark row', (lensId) => {
    expect(legendEntriesFor(lensId).length, `no MAP_MARKERS row shows in the ${lensId} legend`).toBeGreaterThan(0);
  });

  it('the derived Threads legend is the plan\'s, word for word', () => {
    expect(legendEntriesFor('threads').map(e => e.word)).toEqual(['The First', 'Retinue', 'Watched', 'Heading']);
  });

  it('the Dominion arm of selectLensView deep-equals dominionLensVM (no runtime: the off view)', () => {
    const { state, tiles } = lensFixture();
    const view = selectLensView(buildViewContext(null, state, tiles), 'dominion');
    expect(view.layer).toBe('dominion');
    expect(view.vm).toEqual(dominionLensVM(null, null, [], false));
  });

  it('an id with no row resolves to no lens (the plain fallback)', () => {
    expect(mapLensById('nope')).toBeUndefined();
    expect(isMapLensId('nope')).toBe(false);
    expect(mapLensById(null)).toBeUndefined();
  });
});
