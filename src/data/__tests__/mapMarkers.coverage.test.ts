/**
 * mapMarkers.coverage.test.ts — the named Law 58 test for MAP_MARKERS
 * (THR-1878 plan § D5; plain rows by THR-1899).
 *
 * A marker kind is one row in `src/data/map-markers.ts`. This test fails, naming
 * the list and the kind, when a row is incomplete.
 */
import { describe, it, expect } from 'vitest';
import {
  MAP_MARKERS,
  MAP_MARKER_KINDS,
  ZOOM_BANDS,
  agentMarkerKind,
  isLabelObstacleIn,
  legendEntriesFor,
  markerDrawIn,
  markerSizePx,
} from '../map-markers';
import { MAP_LENSES } from '../map-lenses';
import { getUITooltip } from '../ui-content';
import { FALLBACK_ICON_NAME } from '../icons/iconRegistry';
import { isIconName } from '../../components/shared/iconShape';
import { BATTLE_ICON, SIEGE_ICON } from '../../components/HexMapV2/scene/BattleIndicatorLayer';

const LENS_IDS = new Set(MAP_LENSES.map(l => l.id));

describe('MAP_MARKERS coverage (Law 58)', () => {
  it.each(MAP_MARKER_KINDS)('MAP_MARKERS.%s has a size for every zoom band, or is sized by its mesh', (kind) => {
    const { sizePx } = MAP_MARKERS[kind];
    if (sizePx === 'mesh') return;
    for (const band of ZOOM_BANDS) {
      expect(sizePx, `MAP_MARKERS.${kind}.sizePx is missing band ${band}`).toHaveProperty(band);
      const v = sizePx[band];
      expect(v === null || (typeof v === 'number' && v > 0), `MAP_MARKERS.${kind}.sizePx.${band} = ${String(v)}`).toBe(true);
    }
  });

  it.each(MAP_MARKER_KINDS)('MAP_MARKERS.%s: a lens kind lists its own lens and has a legend entry', (kind) => {
    const def = MAP_MARKERS[kind];
    if (def.lens === null) return;
    expect(def.legendIn, `MAP_MARKERS.${kind} must show in its own lens's legend`).toContain(def.lens);
    expect(def.legend.length, `MAP_MARKERS.${kind} has no legend entry`).toBeGreaterThan(0);
  });

  it.each(MAP_MARKER_KINDS)('MAP_MARKERS.%s: every lens it names exists in MAP_LENSES', (kind) => {
    const def = MAP_MARKERS[kind];
    for (const lens of [def.lens, ...def.legendIn]) {
      if (lens === null) continue;
      expect(LENS_IDS.has(lens), `MAP_MARKERS.${kind} names lens '${lens}', which is not in MAP_LENSES`).toBe(true);
    }
  });

  it.each(MAP_MARKER_KINDS)('MAP_MARKERS.%s: every legend tooltip is registered', (kind) => {
    for (const entry of MAP_MARKERS[kind].legend) {
      expect(entry.word.trim().length, `MAP_MARKERS.${kind} has an empty legend word`).toBeGreaterThan(0);
      expect(getUITooltip(entry.tooltipId), `MAP_MARKERS.${kind} legend tooltip '${entry.tooltipId}' is not in UI_TOOLTIPS`).not.toBeNull();
    }
  });

  it.each(MAP_MARKER_KINDS)('MAP_MARKERS.%s: its icon is a registry name, never the fallback (THR-1898)', (kind) => {
    const icon = MAP_MARKERS[kind].icon;
    if (icon === null) return;
    expect(isIconName(icon), `MAP_MARKERS.${kind}.icon '${icon}' is not in ICON_REGISTRY`).toBe(true);
    expect(icon, `MAP_MARKERS.${kind} draws the fallback icon`).not.toBe(FALLBACK_ICON_NAME);
  });

  it('battle and siege rows name the carved shapes the sprites draw (THR-1898)', () => {
    expect(MAP_MARKERS.battle.icon).toBe(BATTLE_ICON);
    expect(MAP_MARKERS.siege.icon).toBe(SIEGE_ICON);
    expect(MAP_MARKERS.battle.legendIn).toContain('trouble');
    expect(MAP_MARKERS.siege.legendIn).toContain('trouble');
  });

  it('the plain agent rows carry THR-1831 § 4\'s sizes', () => {
    expect(MAP_MARKERS.agent.sizePx).toEqual({ fullWorld: null, continental: 10, regional: 14, heroLocal: 48 });
    expect(MAP_MARKERS.threadedAgent.sizePx).toEqual({ fullWorld: 12, continental: 32, regional: 40, heroLocal: 64 });
    expect(MAP_MARKERS.avatar.sizePx).toEqual({ fullWorld: 12, continental: 32, regional: 40, heroLocal: 82 });
  });

  it('draw kinds by band: a mortal is a dot then a portrait; a threaded one a pip, a medallion, a portrait', () => {
    expect(ZOOM_BANDS.map(b => markerDrawIn('agent', b))).toEqual(['dot', 'dot', 'dot', 'portrait']);
    expect(ZOOM_BANDS.map(b => markerDrawIn('threadedAgent', b))).toEqual(['pip', 'medallion', 'medallion', 'portrait']);
    expect(ZOOM_BANDS.map(b => markerDrawIn('avatar', b))).toEqual(['pip', 'medallion', 'medallion', 'portrait']);
  });

  it('label obstacles: threaded medallions and the avatar always, other portraits close in only', () => {
    for (const band of ZOOM_BANDS) {
      expect(isLabelObstacleIn('threadedAgent', band)).toBe(true);
      expect(isLabelObstacleIn('avatar', band)).toBe(true);
      expect(isLabelObstacleIn('army', band)).toBe(false);
    }
    expect(isLabelObstacleIn('agent', 'heroLocal')).toBe(true);
    expect(isLabelObstacleIn('agent', 'regional')).toBe(false);
  });

  it('markerSizePx is null for a mesh-sized kind', () => {
    expect(markerSizePx('army', 'regional')).toBeNull();
    expect(markerSizePx('threadedAgent', 'regional')).toBe(40);
  });

  it('agentMarkerKind: the avatar wins over threaded, threaded over plain', () => {
    expect(agentMarkerKind({ isAvatar: true, isThreaded: true })).toBe('avatar');
    expect(agentMarkerKind({ isThreaded: true })).toBe('threadedAgent');
    expect(agentMarkerKind({})).toBe('agent');
  });

  it('legends derive from the list: no plain row joins the Dominion legend', () => {
    expect(legendEntriesFor('dominion')).toEqual([]);
  });
});
