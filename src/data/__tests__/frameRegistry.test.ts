/**
 * THR-1893 — the frame's lists (frame plan § F2, Law 58). Each failure names the list
 * and the entry to add.
 */
import { describe, it, expect } from 'vitest';
import {
  FRAME_HOTKEYS,
  GOD_RAIL_SECTIONS,
  LEDGER_LINES,
  LEDGER_RAIL_HOTKEY,
  LEDGER_RAIL_SECTIONS,
  LEDGER_TABS,
  NEEDS_YOU_HOTKEY,
  TOP_BAR_ITEMS,
  TOOLTIP_NONE_REASONS,
  frameRevealClaims,
} from '../frame-registry';
import { OPENING_REVEAL_TABLE } from '../opening-reveal-table';
import { MAP_LENSES } from '../map-lenses';
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
    expect(uniq(GOD_RAIL_SECTIONS.map(g => g.id)), 'duplicate GOD_RAIL_SECTIONS ids').toEqual([]);
    expect(uniq(TOP_BAR_ITEMS.map(t => t.id)), 'duplicate TOP_BAR_ITEMS ids').toEqual([]);
  });

  // THR-1875 (§ F3): a top-bar item with an icon always shows its word (THR-1834 § 5);
  // a missing tooltip has a named reason.
  it('every top-bar item with an icon has a word, and every tooltipId resolves or has a reason', () => {
    for (const t of TOP_BAR_ITEMS) {
      if (t.icon) {
        expect(t.label.trim().length, `TOP_BAR_ITEMS.${t.id} has an icon but no word label`).toBeGreaterThan(0);
        expect(t.icon in ICON_REGISTRY, `TOP_BAR_ITEMS.${t.id}: icon '${t.icon}' is not in ICON_REGISTRY`).toBe(true);
      }
      if (t.tooltipId) expect(getUITooltip(t.tooltipId), `TOP_BAR_ITEMS.${t.id}: tooltip ${t.tooltipId} is not registered`).not.toBeNull();
      else expect(TOOLTIP_NONE_REASONS[t.id], `TOP_BAR_ITEMS.${t.id} has no tooltip and no reason in TOOLTIP_NONE_REASONS`).toBeTruthy();
    }
  });

  it('every entry has a word label and every tooltipId resolves in the ui.* registry', () => {
    const entries = [
      ...LEDGER_RAIL_SECTIONS.map(s => ({ list: 'LEDGER_RAIL_SECTIONS', id: s.id, label: s.label, tooltipId: s.tooltipId })),
      ...LEDGER_TABS.map(t => ({ list: 'LEDGER_TABS', id: t.id, label: t.label, tooltipId: t.tooltipId })),
      ...LEDGER_LINES.map(l => ({ list: 'LEDGER_LINES', id: l.id, label: l.label, tooltipId: l.tooltipId })),
      ...GOD_RAIL_SECTIONS.map(g => ({ list: 'GOD_RAIL_SECTIONS', id: g.id, label: g.label, tooltipId: g.tooltipId })),
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
  // THR-2060: a `lens_*` surface belongs to the lens bar alone (MAP_LENSES); other lenses
  // share the surface of the panel they arrive with, which a frame entry already claims.
  const claims = [
    ...frameRevealClaims(),
    ...MAP_LENSES.filter(l => l.revealSurface.startsWith('lens_')).map(l => ({ surface: l.revealSurface, claimedBy: `MAP_LENSES.${l.id}` })),
  ];
  const tableSurfaces = OPENING_REVEAL_TABLE.map(r => r.surface);

  it('every opening-reveal surface is claimed by exactly one frame entry', () => {
    for (const surface of tableSurfaces) {
      const by = claims.filter(c => c.surface === surface).map(c => c.claimedBy);
      expect(
        by.length,
        `opening-reveal surface '${surface}' has no frame entry: add it to TOP_BAR_ITEMS, GOD_RAIL_SECTIONS, LEDGER_RAIL_SECTIONS or LEDGER_TABS`
          + (by.length > 1 ? ` (claimed twice: ${by.join(', ')})` : ''),
      ).toBe(1);
    }
  });

  it('every claim names a surface the table has', () => {
    for (const c of claims) expect(tableSurfaces, `${c.claimedBy} claims '${c.surface}', which OPENING_REVEAL_TABLE does not have`).toContain(c.surface);
  });

  it('World Pulse has retired: no reveal row and no frame entry', () => {
    expect(tableSurfaces as string[]).not.toContain('world_pulse');
  });
});

describe('frame registry — the god rail (THR-1894, plan § F6)', () => {
  it('runs top to bottom: pinned sections, then the hand, then the folded rows', () => {
    const sorted = [...GOD_RAIL_SECTIONS].sort((a, b) => a.order - b.order);
    const rank = { pinned: 0, fill: 1, folded: 2 } as const;
    for (let i = 1; i < sorted.length; i++) {
      expect(rank[sorted[i].place], `GOD_RAIL_SECTIONS.${sorted[i].id} sits above a ${sorted[i - 1].place} section`).toBeGreaterThanOrEqual(rank[sorted[i - 1].place]);
    }
    expect(GOD_RAIL_SECTIONS.filter(g => g.place === 'fill').map(g => g.id)).toEqual(['hand']);
  });

  it('Attention is claimed by the essence section, and Investiture by the hand', () => {
    const claims = frameRevealClaims();
    expect(claims.find(c => c.surface === 'attention')?.claimedBy).toBe('GOD_RAIL_SECTIONS.essence');
    expect(claims.find(c => c.surface === 'investiture')?.claimedBy).toBe('GOD_RAIL_SECTIONS.hand');
  });

  it('covenants, signatures and hooks do not render empty (THR-1814 rule 4)', () => {
    expect(GOD_RAIL_SECTIONS.filter(g => !g.rendersWhenEmpty).map(g => g.id).sort()).toEqual(['covenants', 'hooks', 'signatures']);
  });
});

describe('frame registry — check 3: keys reach TOP_BAR_KEYS through FRAME_HOTKEYS', () => {
  it('L is declared once, on the registry, and spread into TOP_BAR_KEYS', () => {
    expect(LEDGER_RAIL_HOTKEY).toBe('l');
    for (const k of FRAME_HOTKEYS) expect(TOP_BAR_KEYS, `FRAME_HOTKEYS '${k}' missing from TOP_BAR_KEYS`).toContain(k);
  });

  it('N (Needs you) is declared on its TOP_BAR_ITEMS entry and reaches TOP_BAR_KEYS', () => {
    expect(NEEDS_YOU_HOTKEY).toBe('n');
    expect(TOP_BAR_ITEMS.find(t => t.id === 'needs_you')?.hotkey).toBe('n');
    expect(TOP_BAR_KEYS).toContain('n');
    expect(TOP_BAR_KEYS).toContain('N');
  });
});
