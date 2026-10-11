// @vitest-environment jsdom
/**
 * THR-1818 — the hover tooltip names terrain in player words from the one
 * display-name map the hex detail panel also reads, draws the river as a word
 * rather than an emoji, and gets out of the way when the player clicks.
 */
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { HexCoord, TerrainType } from '../../../types';
import { HexTooltip, HEX_TOOLTIP_RIVER_LABEL } from '../interaction/HexTooltip';
import { useHexTooltipDelay } from '../interaction/useHexTooltipDelay';
import { INTERACTION_CONSTANTS } from '../interaction/HexRaycaster';
import {
  TERRAIN_PALETTE,
  TERRAIN_DISPLAY_OVERRIDES,
  terrainDisplayName,
} from '../palette/terrainPalette';

/**
 * Every member of the TerrainType union. Typed as a total record so a new
 * terrain key is a typecheck failure here until it is listed.
 */
const ALL_TERRAIN_TYPES: Record<TerrainType, true> = {
  ocean: true, deep_ocean: true, tropical_ocean: true, coastal_shallows: true, coast: true,
  lake: true, river: true, reef: true,
  grassland: true, farmland: true, savanna: true, steppe: true, floodplain: true,
  temperate_forest: true, dense_forest: true, boreal_forest: true, jungle: true,
  tropical_forest: true, evergreen_forest: true, light_forest: true, dead_forest: true,
  swamp: true, marsh: true, moor_bog: true,
  hills: true, mountains: true, high_mountains: true, plateau: true, badlands: true, mountain_pass: true,
  forested_hills: true,
  great_home_trees: true, broken_lands: true, oasis: true,
  desert: true, rocky_desert: true, sand_dunes: true, tundra: true, glacier: true, volcano: true,
  arctic: true, snow_fields: true,
};

const EVERY_TERRAIN_KEY = [
  ...new Set([
    ...Object.keys(ALL_TERRAIN_TYPES),
    ...Object.keys(TERRAIN_PALETTE),
    ...Object.keys(TERRAIN_DISPLAY_OVERRIDES),
  ]),
];

const base = {
  coord: { col: 4, row: 7 },
  screenX: 300, screenY: 300, canvasWidth: 1920, canvasHeight: 1080,
};

describe('terrain display names (THR-1818)', () => {
  it.each(EVERY_TERRAIN_KEY)('%s reaches the tooltip as a display name, never snake_case', key => {
    const { container, unmount } = render(
      <HexTooltip {...base} terrainName={key} terrainKey={key} />,
    );
    const text = container.textContent ?? '';
    expect(text).toBe(terrainDisplayName(key));
    expect(text).not.toContain('_');
    expect(text.charAt(0)).toBe(text.charAt(0).toUpperCase());
    if (key.includes('_')) expect(text).not.toContain(key);
    unmount();
  });

  it('water reads by what the player sees — one map for tooltip and detail panel', () => {
    expect(terrainDisplayName('tropical_ocean')).toBe('Ocean');
    expect(terrainDisplayName('coastal_shallows')).toBe('Shallow Waters');
    render(<HexTooltip {...base} terrainName="deep_ocean" terrainKey="deep_ocean" />);
    expect(screen.getByText('Deep Ocean')).toBeTruthy();
  });

  it('a raw key passed only as terrainName is still resolved', () => {
    const { container } = render(<HexTooltip {...base} terrainName="temperate_forest" />);
    expect(container.textContent).toBe('Temperate Forest');
  });
});

describe('river feature (THR-1818)', () => {
  it('names the river in words, with no emoji', () => {
    const { container } = render(
      <HexTooltip {...base} terrainName="plateau" terrainKey="plateau" hasRiver />,
    );
    expect(screen.getByTestId('hex-tooltip-river').textContent).toContain(HEX_TOOLTIP_RIVER_LABEL);
    expect(container.textContent).toBe('Plateau · River');
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('does not say River twice on a river hex', () => {
    render(<HexTooltip {...base} terrainName="river" terrainKey="river" hasRiver />);
    expect(screen.queryByTestId('hex-tooltip-river')).toBeNull();
  });
});

describe('useHexTooltipDelay — click hides the tooltip (THR-1818)', () => {
  const DELAY = INTERACTION_CONSTANTS.TOOLTIP_HOVER_DELAY_MS;
  const a: HexCoord = { col: 1, row: 1 };
  const b: HexCoord = { col: 2, row: 1 };

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    return renderHook(({ hovered }: { hovered: HexCoord | null }) => useHexTooltipDelay(hovered), {
      initialProps: { hovered: null as HexCoord | null },
    });
  }

  it('shows after the hover delay', () => {
    const { result, rerender } = setup();
    rerender({ hovered: a });
    expect(result.current.tooltipHex).toBeNull();
    act(() => { vi.advanceTimersByTime(DELAY); });
    expect(result.current.tooltipHex).toEqual(a);
  });

  it('a click hides a shown tooltip and keeps it hidden on the same hex', () => {
    const { result, rerender } = setup();
    rerender({ hovered: a });
    act(() => { vi.advanceTimersByTime(DELAY); });
    act(() => { result.current.suppressTooltip(); });
    expect(result.current.tooltipHex).toBeNull();
    // Pointer jitters within the same hex: a fresh coord object, same cell.
    rerender({ hovered: { ...a } });
    act(() => { vi.advanceTimersByTime(DELAY * 3); });
    expect(result.current.tooltipHex).toBeNull();
  });

  it('a click cancels a tooltip still waiting on its delay', () => {
    const { result, rerender } = setup();
    rerender({ hovered: a });
    act(() => { vi.advanceTimersByTime(DELAY - 1); });
    act(() => { result.current.suppressTooltip(); });
    act(() => { vi.advanceTimersByTime(DELAY * 3); });
    expect(result.current.tooltipHex).toBeNull();
  });

  it('moving to a new hex brings the tooltip back', () => {
    const { result, rerender } = setup();
    rerender({ hovered: a });
    act(() => { vi.advanceTimersByTime(DELAY); });
    act(() => { result.current.suppressTooltip(); });
    rerender({ hovered: b });
    act(() => { vi.advanceTimersByTime(DELAY); });
    expect(result.current.tooltipHex).toEqual(b);
  });

  it('leaving the map and returning to the clicked hex shows it again', () => {
    const { result, rerender } = setup();
    rerender({ hovered: a });
    act(() => { vi.advanceTimersByTime(DELAY); });
    act(() => { result.current.suppressTooltip(); });
    rerender({ hovered: null });
    rerender({ hovered: a });
    act(() => { vi.advanceTimersByTime(DELAY); });
    expect(result.current.tooltipHex).toEqual(a);
  });
});
