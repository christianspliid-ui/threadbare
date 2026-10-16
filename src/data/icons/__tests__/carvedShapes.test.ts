/**
 * Carved coverage (THR-1904, plan THR-1879 § 4, § 5): every `carved('<slug>')` entry in the
 * registry has its shape vendored, and every vendored shape is used by an entry. Also pins the
 * vendoring script's path transforms (parse, mirror, round) on small fixtures.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CARVED_SHAPES, GAME_ICONS_SOURCE } from '../carvedShapes.generated';
import { GAME_ICONS_AUTHOR_NAMES, GAME_ICONS_REPO_COMMIT } from '../gameIconsSource';
import { ICON_REGISTRY } from '../iconRegistry';
import { isWellFormedPathData } from '../../../components/shared/iconShape';
import {
  formatPath,
  mirrorPath,
  parsePath,
  readCarvedRequests,
  unusedVendoredKeys,
  unvendoredMessages,
  type CarvedRequest,
} from '../../../../scripts/vendor-game-icons';

const REGISTRY_SOURCE = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../iconRegistry.ts'), 'utf8');

describe('carved coverage on the real registry', () => {
  it('every carved entry names a vendored shape', async () => {
    const requests = await readCarvedRequests(REGISTRY_SOURCE);
    expect(requests.length).toBeGreaterThan(0);
    expect(unvendoredMessages(requests, CARVED_SHAPES)).toEqual([]);
  });

  it('every vendored shape is used by an entry', async () => {
    const requests = await readCarvedRequests(REGISTRY_SOURCE);
    expect(unusedVendoredKeys(requests, CARVED_SHAPES)).toEqual([]);
  });

  it('the parser finds one carved call per carved registry entry, each with its entry name', async () => {
    const requests = await readCarvedRequests(REGISTRY_SOURCE);
    const carvedEntries = Object.entries(ICON_REGISTRY).filter(([, e]) => e.source.family === 'game-icons').map(([n]) => n);
    expect(requests.map((r) => r.entry).sort()).toEqual(carvedEntries.sort());
  });

  it('records the pinned commit, the licence and a credited name for every author', () => {
    expect(GAME_ICONS_SOURCE.commit).toBe(GAME_ICONS_REPO_COMMIT);
    expect(GAME_ICONS_SOURCE.licence).toBe('CC BY 3.0');
    for (const record of Object.values(CARVED_SHAPES)) {
      expect(GAME_ICONS_AUTHOR_NAMES[record.authorDir], record.slug).toBe(record.author);
      expect(isWellFormedPathData(record.d), record.slug).toBe(true);
    }
  });

  it('forward is back mirrored — a different shape from the same file', () => {
    expect(ICON_REGISTRY.forward.shape).not.toEqual(ICON_REGISTRY.back.shape);
    expect(ICON_REGISTRY.forward.source).toEqual(ICON_REGISTRY.back.source);
  });
});

describe('carved coverage rules on fixtures', () => {
  const fixtureShapes = { 'crossed-swords': {}, 'return-arrow@mirrored': {} };

  it('an entry naming an unvendored slug fails with the entry, the slug and the command', () => {
    const requests: CarvedRequest[] = [
      { slug: 'crossed-swords', mirror: false, entry: 'battle' },
      { slug: 'no-such-shape', mirror: false, entry: 'mystery' },
    ];
    const messages = unvendoredMessages(requests, fixtureShapes);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('mystery');
    expect(messages[0]).toContain('"no-such-shape"');
    expect(messages[0]).toContain('npm run icons:vendor');
  });

  it('a mirrored request is a different key from the plain one', () => {
    expect(unvendoredMessages([{ slug: 'return-arrow', mirror: false, entry: 'back' }], fixtureShapes)).toHaveLength(1);
    expect(unvendoredMessages([{ slug: 'return-arrow', mirror: true, entry: 'forward' }], fixtureShapes)).toEqual([]);
  });

  it('a vendored shape no entry uses is named', () => {
    expect(unusedVendoredKeys([{ slug: 'crossed-swords', mirror: false }], fixtureShapes)).toEqual(['return-arrow@mirrored']);
  });

  it('reads slugs, authors and the mirror flag from carved() calls, and the entry each sits in', async () => {
    const source = `const R = {
      a: { meaning: 'A', ...carved('crown', { author: 'lorc' }) },
      'b-c': { meaning: 'B', ...carved('return-arrow', { mirror: true }) },
      // carved('in-a-comment')
      d: { meaning: 'carved("in-a-string")', ...carved('anvil') },
    };`;
    expect(await readCarvedRequests(source)).toEqual([
      { slug: 'crown', author: 'lorc', mirror: false, entry: 'a' },
      { slug: 'return-arrow', author: undefined, mirror: true, entry: 'b-c' },
      { slug: 'anvil', author: undefined, mirror: false, entry: 'd' },
    ]);
  });
});

describe('vendoring path transforms', () => {
  it('parses arc flags written with no separator', () => {
    const [, arc] = parsePath('M10 10a5 5 0 0110 0z');
    expect(arc).toEqual({ cmd: 'a', args: [5, 5, 0, 0, 1, 10, 0] });
  });

  it('rounds to one decimal and drops a needless minus zero', () => {
    expect(formatPath(parsePath('M10.04 20.06L-0.04 5.55'))).toBe('M10 20.1L0 5.6');
  });

  it('mirrors absolute x across the grid, negates relative dx, and flips arc sweep', () => {
    const mirrored = mirrorPath(parsePath('M100 50L200 60h10v5l-20 3a5 5 30 0 1 10 0z'), 512);
    expect(formatPath(mirrored)).toBe('M412 50L312 60h-10v5l20 3a5 5-30 0 0-10 0z');
  });

  it('treats a path-opening lowercase m as absolute when mirroring', () => {
    expect(formatPath(mirrorPath(parsePath('m100 50l10 0'), 512))).toBe('m412 50l-10 0');
  });

  it('mirroring twice gives the path back', () => {
    const d = 'M408.3 119.5l-37.7 52.2 19.6 44.4c1.9-.3 3.9-.5 6-.5a34.3 34.3 0 0 1 34.3 34.3z';
    expect(formatPath(mirrorPath(mirrorPath(parsePath(d))))).toBe(formatPath(parsePath(d)));
  });
});
