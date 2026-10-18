/**
 * THR-1893 — the frame's lists (frame plan § F2, Law 58). Each failure names the list
 * and the entry to add.
 */
import { describe, it, expect } from 'vitest';
import {
  FRAME_HOTKEYS,
  LEDGER_LINES,
  LEDGER_RAIL_HOTKEY,
  LEDGER_RAIL_SECTIONS,
  LEDGER_TABS,
  NOT_YET_LISTED,
  frameRevealClaims,
} from '../frame-registry';
import { OPENING_REVEAL_TABLE } from '../opening-reveal-table';
import { TOP_BAR_KEYS } from '../top-bar-keys';
import { getUITooltip } from '../ui-content';
import { ICON_REGISTRY } from '../icons/iconRegistry';

function uniq(ids: string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}

describe('frame registry — check 1: words, icons, tooltips', () => {
  it('ids are unique per list', () => {
    expect(uniq(LEDGER_RAIL_SECTIONS.map(s => s.id)), 'duplicate LEDGER_RAIL_SECTIONS ids').toEqual([]);
    expect(uniq(LEDGER_TABS.map(t => t.id)), 'duplicate LEDGER_TABS ids').toEqual([]);
    expect(uniq(LEDGER_LINES.map(l => l.id)), 'duplicate LEDGER_LINES ids').toEqual([]);
  });

  it('every entry has a word label and every tooltipId resolves in the ui.* registry', () => {
    const entries = [
      ...LEDGER_RAIL_SECTIONS.map(s => ({ list: 'LEDGER_RAIL_SECTIONS', id: s.id, label: s.label, tooltipId: s.tooltipId })),
      ...LEDGER_TABS.map(t => ({ list: 'LEDGER_TABS', id: t.id, label: t.label, tooltipId: t.tooltipId })),
      ...LEDGER_LINES.map(l => ({ list: 'LEDGER_LINES', id: l.id, label: l.label, tooltipId: l.tooltipId })),
    ];
    for (const e of entries) {
      expect(e.label.trim().length, `${e.list}.${e.id} has no word label`).toBeGreaterThan(0);
      if (e.tooltipId) expect(getUITooltip(e.tooltipId), `${e.list}.${e.id}: tooltip ${e.tooltipId} is not registered in ui-content.ts`).not.toBeNull();
    }
  });

  it('every strip icon is in the icon registry, and every strip count has both forms', () => {
    const strips = [
      ...LEDGER_RAIL_SECTIONS.map(s => ({ who: `LEDGER_RAIL_SECTIONS.${s.id}`, strip: s.strip })),
      ...LEDGER_TABS.filter(t => t.strip).map(t => ({ who: `LEDGER_TABS.${t.id}`, strip: t.strip! })),
    ];
    for (const { who, strip } of strips) {
      expect(strip.icon in ICON_REGISTRY, `${who}: icon '${strip.icon}' is not in ICON_REGISTRY`).toBe(true);
      expect(strip.countLabel.one).toContain('{n}');
      expect(strip.countLabel.other).toContain('{n}');
    }
  });
});

describe('frame registry — check 2: the reveal table and the frame agree', () => {
  const claims = frameRevealClaims();
  const tableSurfaces = OPENING_REVEAL_TABLE.map(r => r.surface);

  it('every opening-reveal surface is claimed by exactly one frame entry or named as not yet listed', () => {
    for (const surface of tableSurfaces) {
      const by = claims.filter(c => c.surface === surface).map(c => c.claimedBy);
      const later = NOT_YET_LISTED[surface];
      expect(
        by.length + (later ? 1 : 0),
        `opening-reveal surface '${surface}' has no frame entry: add it to TOP_BAR_ITEMS, GOD_RAIL_SECTIONS, LEDGER_RAIL_SECTIONS or LEDGER_TABS`
          + (by.length > 1 ? ` (claimed twice: ${by.join(', ')})` : '')
          + (by.length && later ? ` (claimed by ${by.join(', ')} and still in NOT_YET_LISTED for ${later})` : ''),
      ).toBe(1);
    }
  });

  it('every claim names a surface the table has', () => {
    for (const c of claims) expect(tableSurfaces, `${c.claimedBy} claims '${c.surface}', which OPENING_REVEAL_TABLE does not have`).toContain(c.surface);
    for (const s of Object.keys(NOT_YET_LISTED)) expect(tableSurfaces, `NOT_YET_LISTED names '${s}', which OPENING_REVEAL_TABLE does not have`).toContain(s);
  });

  it('NOT_YET_LISTED names only the god rail (THR-1894) and the top bar (THR-1875)', () => {
    for (const [surface, ticket] of Object.entries(NOT_YET_LISTED)) {
      expect(['THR-1894', 'THR-1875'], `NOT_YET_LISTED.${surface}`).toContain(ticket);
    }
  });

  it('World Pulse has retired: no reveal row and no frame entry', () => {
    expect(tableSurfaces as string[]).not.toContain('world_pulse');
  });
});

describe('frame registry — check 3: keys reach TOP_BAR_KEYS through FRAME_HOTKEYS', () => {
  it('L is declared once, on the registry, and spread into TOP_BAR_KEYS', () => {
    expect(LEDGER_RAIL_HOTKEY).toBe('l');
    for (const k of FRAME_HOTKEYS) expect(TOP_BAR_KEYS, `FRAME_HOTKEYS '${k}' missing from TOP_BAR_KEYS`).toContain(k);
  });
});
