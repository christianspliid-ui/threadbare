/**
 * Map-overlay z-bands (THR-1665, UI Law 35).
 *
 * Every HTML element positioned over the HexMapV2 canvas takes its z-index
 * from here — never a literal. The values are the sub-bands of the
 * "Map overlays" row (10–19) in `Docs/design-system/layout-zones.md`
 * § Z-Index Stacking Order; change them together with that table.
 *
 * The HexMapV2 container isolates its own stacking context
 * (`isolation: isolate`), so these values order the overlays among
 * themselves and can never outrank the HUD (20) or anything above it.
 *
 * Order, bottom to top: the canvas (0), the agent spotlight pulse, region
 * names, location names, and the hex hover tooltip on top — the tooltip is
 * what the player is reading right now, so no label may paint over it.
 */
export const MAP_OVERLAY_Z = {
  AGENT_PULSE: 11,
  REGION_LABELS: 12,
  LOCATION_LABELS: 13,
  HEX_TOOLTIP: 15,
} as const;
