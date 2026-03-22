/**
 * Hex composition system type definitions.
 *
 * These types define the slot-based layout contract consumed by the rendering
 * pipeline (Plan 02) and SVG asset plans (Plans 03-04).
 *
 * NFP #1: All slot names and tier names are typed unions — no magic strings.
 * NFP #2: Pure data types with no side effects.
 */

/** The 9 layout slots within a hex tile. FILL = full-hex coverage; RING = all 6 outer slots. */
export type HexSlot = 'CENTER' | 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW' | 'FILL' | 'RING';

/** Visual footprint size of an entity within its assigned slot. */
export type FootprintSize = 'full' | 'large' | 'medium' | 'small' | 'tiny';

/** Zoom tier thresholds matching STATE.md decisions:
 *  hero-local >= 15, regional >= 5 && < 15, continental >= 1.5 && < 5, full-world < 1.5
 */
export type ZoomTier = 'hero-local' | 'regional' | 'continental' | 'full-world';

/**
 * A suppression rule: if the suppressor entity is placed, it may hide another entity type.
 * when='always' → suppress regardless of slot
 * when='same-slot' → suppress only if both are in the same slot
 * when='footprint-overlap' → suppress if footprints geometrically overlap (reserved for Phase 6)
 */
export interface SuppressRule {
  target: string;  // entityType to suppress, e.g. 'terrain-signifier'
  when: 'always' | 'same-slot' | 'footprint-overlap';
}

/**
 * Declarative description of how a visual entity should be composed onto a hex.
 * Each entity type (terrain-signifier, major-location, agent, etc.) registers one manifest.
 *
 * NFP #2: Pure data — no render calls, no side effects.
 */
export interface HexVisualManifest {
  /** Unique entity type identifier (e.g., 'terrain-signifier', 'major-location') */
  entityType: string;
  /** Preferred placement slot. Resolver tries this first. */
  preferredSlot: HexSlot;
  /** Visual footprint size for overlap/suppression evaluation. */
  footprint: FootprintSize;
  /** Entities this manifest suppresses when placed. Evaluated after slot assignment. */
  suppresses: SuppressRule[];
  /** Zoom tiers at which this entity is rendered (visibility filter). */
  visibleAt: ZoomTier[];
  /** Priority for slot assignment. Higher value = assigned first (gets preferred slot). */
  priority: number;
  /** Ordered fallback slots if preferredSlot is occupied. If all slots taken, entity is hidden. */
  fallbackSlots?: HexSlot[];
}

/**
 * Result of resolveHexComposition for a single entity on a hex.
 * The resolver returns one CompositionResult per input entity.
 *
 * NFP #2: Inspectable — every rendering decision is explicitly recorded here.
 */
export interface CompositionResult {
  /** entityType identifier from the input HexVisualManifest */
  entity: string;
  /** Assigned slot (may be a fallback if preferred was occupied) */
  slot: HexSlot;
  /** Whether this entity should be rendered (false = suppressed or no slot available) */
  visible: boolean;
}
