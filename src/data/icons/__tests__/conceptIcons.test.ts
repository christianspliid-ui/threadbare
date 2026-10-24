/**
 * Class-map coverage (THR-1904, plan THR-1879 § 5, § 7, Law 58).
 *
 * Union-keyed maps are total by type. This file covers what the type cannot: string-keyed
 * content that grows at runtime (sublocation types, attachment subcategories), the map's
 * `LocationType` reading `PLACE_ICON`, the Codex group ids, that every value names a registry
 * entry, and the resolver's fallback-and-warn-once behaviour.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ICON_CLASSES,
  ICON_FOR_ATTACHMENT_SUBCATEGORY,
  ICON_FOR_CHARTERED_GROUP,
  ICON_FOR_OMEN,
  PLACE_ICON,
  getFallbacksDrawn,
  iconForKey,
  iconForSublocation,
  resetConceptIconWarningsForTest,
  type IconClass,
} from '../conceptIcons';
import { ICON_REGISTRY } from '../iconRegistry';
import { isIconName } from '../../../components/shared/iconShape';
import { SUBCATEGORY_GLYPHS } from '../../../components/Game/attachmentGlyphs';
import { LOCATION_ICON_REGISTRY } from '../../../components/HexMapV2/locations/locationIconRegistry';
import { CARD_SUBCATEGORY_IDS, LEGENDARY_SUBCATEGORY_ID } from '../../../components/Codex/charteredKindsCodex';
import { CALLING_FALLBACK_PRESENTATION, CALLING_PRESENTATION } from '../../calling-content';
import { NUDGE_CARD_TYPE_ICON_NAMES } from '../../nudge-card-display';
import { NUDGE_CARD_TYPES } from '../../nudge-card-library';
import { getCodexCategories } from '../../../components/Codex/codexRegistry';

/** Keys of `map` with no entry among `liveKeys`, as "<map>: <key>" lines. */
function missingKeys(cls: IconClass, liveKeys: Iterable<string>): string[] {
  return [...liveKeys].filter((k) => !Object.prototype.hasOwnProperty.call(cls.map, k)).map((k) => `${cls.mapName}: ${k}`);
}

afterEach(() => {
  resetConceptIconWarningsForTest();
  vi.restoreAllMocks();
});

describe('every class value names a registry entry', () => {
  it.each(Object.values(ICON_CLASSES).map((c) => [c.mapName, c] as const))('%s', (_name, cls) => {
    for (const [key, icon] of Object.entries(cls.map)) {
      expect(isIconName(icon as string), `${cls.mapName}.${key} → ${String(icon)}`).toBe(true);
    }
  });

  it('the omen rules, calling rows, card types and Codex categories name registry entries', () => {
    for (const rule of Object.values(ICON_FOR_OMEN)) if ('icon' in rule) expect(isIconName(rule.icon)).toBe(true);
    for (const [title, row] of Object.entries(CALLING_PRESENTATION)) expect(isIconName(row.icon), title).toBe(true);
    expect(CALLING_FALLBACK_PRESENTATION.icon).toBe('fallback');
    for (const icon of Object.values(NUDGE_CARD_TYPE_ICON_NAMES)) expect(isIconName(icon)).toBe(true);
    for (const cat of getCodexCategories()) expect(isIconName(cat.icon), cat.id).toBe(true);
  });
});

describe('string-keyed sources have an entry for every live key', () => {
  // The sublocation-type arm compared against the legacy `sublocation-concept-art.ts` table,
  // which retired with the sheets (THR-1991); `ICON_FOR_SUBLOCATION_TYPE` is now its own source.

  it('every attachment subcategory the glyph table names has an icon', () => {
    expect(missingKeys(ICON_CLASSES['attachment-subcategory'], Object.keys(SUBCATEGORY_GLYPHS))).toEqual([]);
    expect(Object.keys(ICON_FOR_ATTACHMENT_SUBCATEGORY).sort()).toEqual(Object.keys(SUBCATEGORY_GLYPHS).sort());
  });

  it('every map LocationType has a place shape (THR-1878 reads PLACE_ICON by LocationType)', () => {
    expect(missingKeys(ICON_CLASSES.place, Object.keys(LOCATION_ICON_REGISTRY))).toEqual([]);
  });

  it('the Codex chartered groups match the ids the Codex writes', () => {
    expect(Object.keys(ICON_FOR_CHARTERED_GROUP).sort()).toEqual([...Object.values(CARD_SUBCATEGORY_IDS), LEGENDARY_SUBCATEGORY_ID].sort());
  });

  it('every card type in the library has a carved icon', () => {
    expect(Object.keys(NUDGE_CARD_TYPE_ICON_NAMES).sort()).toEqual(NUDGE_CARD_TYPES.map(t => t.id).sort());
  });

  it('a fixture key with no entry is named, map and key', () => {
    expect(missingKeys(ICON_CLASSES['sublocation-type'], ['market-district', 'mint'])).toEqual(['ICON_FOR_SUBLOCATION_TYPE: mint']);
  });
});

describe('places', () => {
  it('a cleared lair draws the lair; the open places draw their temporary own entries; elder ruin the fallback', () => {
    expect(PLACE_ICON.cleared_lair).toBe(PLACE_ICON.lair);
    expect(ICON_REGISTRY[PLACE_ICON.convergence].source.family).toBe('own');
    expect(PLACE_ICON.elder_ruin).toBe('fallback');
    expect(ICON_REGISTRY[PLACE_ICON.capital].source.family).toBe('game-icons');
  });

  it('a sublocation draws its own icon, else its parent place, else place-within', () => {
    expect(iconForSublocation('sublocation-type.tavern', 'town')).toBe('place-tavern');
    expect(iconForSublocation('tavern')).toBe('place-tavern');
    expect(iconForSublocation('sublocation-type.mint', 'castle')).toBe('place-castle');
    expect(iconForSublocation('sublocation-type.mint')).toBe('place-within');
  });
});

describe('iconForKey', () => {
  it('returns the entry for a known key without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(iconForKey(ICON_CLASSES.season, 'winter')).toBe('season-winter');
    expect(warn).not.toHaveBeenCalled();
    expect(getFallbacksDrawn()).toEqual([]);
  });

  it('an unknown key draws the fallback and warns once, naming the map', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(iconForKey(ICON_CLASSES['sublocation-type'], 'sublocation-type.mint')).toBe('fallback');
    expect(iconForKey(ICON_CLASSES['sublocation-type'], 'sublocation-type.mint')).toBe('fallback');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('ICON_FOR_SUBLOCATION_TYPE');
    expect(String(warn.mock.calls[0][0])).toContain('sublocation-type.mint');
    expect(getFallbacksDrawn()).toEqual([{ classId: 'sublocation-type', key: 'sublocation-type.mint' }]);
  });

  it('an inherited object property is not an entry', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(iconForKey(ICON_CLASSES.season, 'toString')).toBe('fallback');
  });
});
