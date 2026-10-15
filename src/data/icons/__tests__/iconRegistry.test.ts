/**
 * Icon registry invariants (THR-1885, plan THR-1821 § Done when S3).
 *
 * Every check runs twice: on fixture registries (so each rule is seen to fail on the shape it
 * exists to catch) and on the real registry. Today the real registry holds one entry, so the
 * fixtures are what prove the rules bite; once THR-1879 vendors ~200 shapes, the real run is
 * what guards them.
 */

import { describe, expect, it } from 'vitest';
import {
  GAME_ICON_VIEWBOX,
  ICON_CREDITS,
  ICON_REGISTRY,
  iconCreditsOf,
  type IconEntry,
} from '../iconRegistry';
import { isWellFormedPathData } from '../../../components/shared/iconShape';

type Registry = Readonly<Record<string, IconEntry>>;

/** Names whose shape is identical to an earlier name's (Law 10: one idea, one icon). */
function duplicateShapes(registry: Registry): string[] {
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const [name, entry] of Object.entries(registry)) {
    const key = JSON.stringify(entry.shape);
    if (seen.has(key)) dupes.push(`${seen.get(key)} = ${name}`);
    else seen.set(key, name);
  }
  return dupes;
}

const emptyMeanings = (r: Registry) => Object.entries(r).filter(([, e]) => e.meaning.trim() === '').map(([n]) => n);
const malformedPaths = (r: Registry) =>
  Object.entries(r).filter(([, e]) => e.shape.paths.length === 0 || e.shape.paths.some((p) => !isWellFormedPathData(p.d))).map(([n]) => n);
const multiPathCarved = (r: Registry) =>
  Object.entries(r).filter(([, e]) => e.source.family === 'game-icons' && e.shape.paths.length !== 1).map(([n]) => n);

const carved = (author: string, d: string): IconEntry => ({
  meaning: `a ${author} shape`,
  shape: { viewBox: GAME_ICON_VIEWBOX, paths: [{ d }] },
  source: { family: 'game-icons', author, slug: 'x' },
});

const GOOD_FIXTURE: Registry = {
  close: carved('Lorc', 'M10 10L502 502M502 10L10 502'),
  pause: carved('Delapouite', 'M100 50h100v412H100zM312 50h100v412H312z'),
  scales: carved('Lorc', 'M256 32c10 0 20 10 20 20v400h-40V52c0-10 10-20 20-20z'),
  mine: { meaning: 'our mark', shape: { viewBox: '0 0 24 24', paths: [{ d: 'M2 2L22 22', opacity: 0.5 }, { d: 'M2 22L22 2' }] }, source: { family: 'own' } },
};

describe('icon registry rules on fixtures', () => {
  it('a clean fixture passes every rule', () => {
    expect(duplicateShapes(GOOD_FIXTURE)).toEqual([]);
    expect(emptyMeanings(GOOD_FIXTURE)).toEqual([]);
    expect(malformedPaths(GOOD_FIXTURE)).toEqual([]);
    expect(multiPathCarved(GOOD_FIXTURE)).toEqual([]);
  });

  it('two names sharing a shape fail (Law 10)', () => {
    expect(duplicateShapes({ ...GOOD_FIXTURE, shut: GOOD_FIXTURE.close })).toEqual(['close = shut']);
  });

  it('an empty meaning fails', () => {
    expect(emptyMeanings({ ...GOOD_FIXTURE, blank: { ...GOOD_FIXTURE.pause, meaning: '  ' } })).toEqual(['blank']);
  });

  it('path data that does not parse fails', () => {
    expect(malformedPaths({ ...GOOD_FIXTURE, broken: carved('Lorc', 'L10 10 M5') })).toEqual(['broken']);
    expect(malformedPaths({ ...GOOD_FIXTURE, junk: carved('Lorc', 'M10 10 X20 20') })).toEqual(['junk']);
    expect(malformedPaths({ ...GOOD_FIXTURE, odd: carved('Lorc', 'M10 10 20') })).toEqual(['odd']);
  });

  it('a carved entry with more than one path fails', () => {
    const layered: IconEntry = { ...GOOD_FIXTURE.close, shape: { viewBox: GAME_ICON_VIEWBOX, paths: [{ d: 'M0 0L1 1' }, { d: 'M1 0L0 1' }] } };
    expect(multiPathCarved({ ...GOOD_FIXTURE, layered })).toEqual(['layered']);
  });

  it('credits are the distinct game-icons authors, sorted', () => {
    expect(iconCreditsOf(GOOD_FIXTURE)).toEqual(['Delapouite', 'Lorc']);
    expect(iconCreditsOf({ mine: GOOD_FIXTURE.mine })).toEqual([]);
  });
});

describe('the shipped registry', () => {
  it('holds the fallback mark, drawn by us', () => {
    expect(ICON_REGISTRY.fallback.source.family).toBe('own');
  });

  it('passes every rule', () => {
    expect(duplicateShapes(ICON_REGISTRY)).toEqual([]);
    expect(emptyMeanings(ICON_REGISTRY)).toEqual([]);
    expect(malformedPaths(ICON_REGISTRY)).toEqual([]);
    expect(multiPathCarved(ICON_REGISTRY)).toEqual([]);
  });

  it('ICON_CREDITS lists exactly the distinct game-icons authors', () => {
    expect(ICON_CREDITS).toEqual(iconCreditsOf(ICON_REGISTRY));
  });

  it('vendors no game-icons shape yet — THR-1879 does, with its credits line', () => {
    const vendored = Object.values(ICON_REGISTRY as Registry).filter((e) => e.source.family === 'game-icons');
    expect(vendored).toEqual([]);
    expect(ICON_CREDITS).toEqual([]);
  });
});
