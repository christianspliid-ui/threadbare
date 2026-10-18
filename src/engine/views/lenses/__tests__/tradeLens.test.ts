/**
 * The Trade lens's view model (THR-1898; THR-1878 plan § D4, § Done when → Lenses II;
 * THR-1822 D17 contract).
 *
 * Every hex on a known road is lit (the hex line, ends included); one road mark per
 * route, `threat` when threatened; the route words moved from the plain tooltip; the
 * ends' prosperity as words; the empty line with no known road.
 */
import { describe, it, expect } from 'vitest';
import { buildViewContext } from '../../viewContext';
import { assertSerialisable } from '../../__tests__/viewContract';
import { buildTradeLens, joinWords } from '../tradeLens';
import { lensLineText } from '../lensTypes';
import { hexLine } from '../../../../lib/hexMath';
import { lensFixture } from './lensFixture';

function trade(opts?: Parameters<typeof lensFixture>[0]) {
  const { state, tiles } = lensFixture(opts);
  return buildTradeLens(buildViewContext(null, state, tiles));
}
const hoverText = (vm: ReturnType<typeof trade>, key: string) => (vm.hover[key] ?? []).map(lensLineText);

describe('Trade lens view model', () => {
  it('lights every hex on each known road, ends included', () => {
    const vm = trade();
    const expected = new Set([
      ...hexLine({ col: 1, row: 1 }, { col: 4, row: 1 }, { includeEnds: true }),
      ...hexLine({ col: 1, row: 1 }, { col: 6, row: 3 }, { includeEnds: true }),
    ].map(h => `${h.col},${h.row}`));
    expect(vm.lit).toEqual([...expected].sort());
  });

  it('draws one road per route; a threatened route has tone threat', () => {
    const vm = trade();
    expect(vm.marks.map(m => [m.kind, m.hexKey, m.toHexKey, m.tone, m.weight])).toEqual([
      ['road', '1,1', '6,3', 'threat', 1],
      ['road', '1,1', '4,1', 'caravan', 2],
    ]);
  });

  it('tells the road words the plain tooltip showed, then the ends in words', () => {
    const vm = trade();
    expect(hoverText(vm, '4,1')).toEqual([
      'A road to Millbrook, carrying grain and salt.',
      'Millbrook is prosperous; Hesk Crossing is struggling and short of iron.',
    ]);
    expect(hoverText(vm, '6,3')).toEqual([
      'A road to Millbrook, carrying light trade.',
      'Threatened.',
      'Millbrook is prosperous; Farhold is modest.',
    ]);
  });

  it('names the far end as a ref segment', () => {
    const line = trade().hover['4,1'][0];
    expect(line.segments.find(s => s.ref)?.ref).toEqual({ kind: 'location', id: 'loc_mill', name: 'Millbrook' });
  });

  it('caps a busy end at the hover limit with the overflow line', () => {
    const lines = hoverText(trade(), '1,1');
    expect(lines.length).toBeLessThanOrEqual(4);
    expect(lines[lines.length - 1]).toBe('and more roads through here');
  });

  it('says so in words when there is no road you know of', () => {
    const vm = trade({ quiet: true });
    expect(vm.lit).toEqual([]);
    expect(vm.marks).toEqual([]);
    expect(vm.emptyLine).toBe('No trade road you know of yet.');
  });

  it('skips a road with neither end explored, and keeps unexplored hexes dark', () => {
    const vm = trade({ explored: ['4,1'] });
    expect(vm.marks.map(m => m.toHexKey)).toEqual(['4,1']);
    expect(vm.lit).toEqual(['4,1']);
    expect(Object.keys(vm.hover)).toEqual(['4,1']);
  });

  it('meets the view contract: serialisable, deterministic, no numbers in words', () => {
    const a = trade();
    expect(a).toEqual(trade());
    assertSerialisable(a);
    for (const lines of Object.values(a.hover)) for (const l of lines) expect(lensLineText(l)).not.toMatch(/\d/);
  });

  it('joins words the way the road line reads', () => {
    expect(joinWords(['grain'])).toBe('grain');
    expect(joinWords(['grain', 'salt'])).toBe('grain and salt');
    expect(joinWords(['grain', 'salt', 'iron'])).toBe('grain, salt and iron');
  });
});
