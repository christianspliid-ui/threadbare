/**
 * THR-1900 — the named coverage test for the map's key and button list (plan THR-1878 D9,
 * Law 58). A new map command is one row in `MAP_COMMANDS`; this test fails when its key
 * collides with a top-bar key or a lens key, or its button has no registered tooltip.
 */
import { describe, it, expect } from 'vitest';
import { MAP_COMMANDS, MAP_PAN_DIRECTIONS, mapCommandForKey, mapControlStates } from '../map-commands';
import { MAP_LENSES } from '../map-lenses';
import { TOP_BAR_KEYS } from '../top-bar-keys';
import { getUITooltip } from '../ui-content';

const fold = (k: string) => k.toLowerCase();

describe('map key lists (MAP_COMMANDS, MAP_LENSES, TOP_BAR_KEYS)', () => {
  const lists: Record<string, string[]> = {
    MAP_COMMANDS: MAP_COMMANDS.flatMap(c => [...c.keys]),
    MAP_LENSES: MAP_LENSES.map(l => l.key),
    TOP_BAR_KEYS: [...TOP_BAR_KEYS],
  };

  it('are pairwise disjoint, case-folded', () => {
    const names = Object.keys(lists);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = new Set(lists[names[i]].map(fold));
        const clash = lists[names[j]].map(fold).filter(k => a.has(k));
        expect(clash, `${names[i]} and ${names[j]} share keys`).toEqual([]);
      }
    }
  });

  it('no key runs two map commands', () => {
    const seen = new Map<string, string>();
    for (const cmd of MAP_COMMANDS) {
      for (const key of cmd.keys) {
        expect(seen.get(key), `key "${key}" is bound twice in MAP_COMMANDS`).toBeUndefined();
        seen.set(key, cmd.id);
      }
    }
  });

  it('never binds Escape (Law 23) and keeps THR-1828\'s speed and widen keys', () => {
    const all = lists.MAP_COMMANDS.map(fold);
    for (const reserved of ['escape', '+', '=', '-', 'w']) expect(all).not.toContain(reserved);
  });

  it('every command with a button has a registered tooltip and an aria-label', () => {
    for (const cmd of MAP_COMMANDS) {
      if (!cmd.button) continue;
      const tip = getUITooltip(cmd.button.tooltipId);
      expect(tip, `MAP_COMMANDS "${cmd.id}": tooltip ${cmd.button.tooltipId} is not registered`).not.toBeNull();
      expect(tip?.desc).toMatch(/Key /);
      expect(cmd.button.ariaLabel.length).toBeGreaterThan(0);
      expect(cmd.button.icon !== null || (cmd.button.glyph ?? '').length > 0, `${cmd.id} draws nothing`).toBe(true);
    }
  });

  it('every key-only command is a pan with a direction', () => {
    for (const cmd of MAP_COMMANDS) {
      if (cmd.button) continue;
      expect(MAP_PAN_DIRECTIONS[cmd.id], `${cmd.id} has no button and no pan direction`).toBeDefined();
    }
  });

  it('the cluster is Zoom in, Zoom out, Centre on my First, Show known land, in that order', () => {
    expect(MAP_COMMANDS.filter(c => c.button).map(c => c.id))
      .toEqual(['zoom_in', 'zoom_out', 'centre_first', 'show_known_land']);
    expect(mapCommandForKey('PageUp')?.id).toBe('zoom_in');
    expect(mapCommandForKey('Home')?.id).toBe('centre_first');
    expect(mapCommandForKey('F')?.id).toBe('show_known_land');
  });
});

describe('mapControlStates (Law 25: disabled with a reason)', () => {
  it('nothing disabled mid-range with a focus target', () => {
    expect(mapControlStates({ atMax: false, atMin: false, hasFocusTarget: true }).every(s => !s.disabled)).toBe(true);
  });

  it('names the reason at each limit', () => {
    const byId = Object.fromEntries(
      mapControlStates({ atMax: true, atMin: true, hasFocusTarget: false }).map(s => [s.id, s.reason]),
    );
    expect(byId).toEqual({
      zoom_in: 'Closest view',
      zoom_out: 'Widest view',
      centre_first: 'No one to centre on yet',
      show_known_land: null,
    });
  });
});
