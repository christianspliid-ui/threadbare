/**
 * Entity Visual — fallback data tables (THR-637).
 *
 * When no curated art exists for an entity, the Entity Visual Header pattern
 * renders a *designed* fallback tile: an authored glyph on one of a small set of
 * Threadbare-palette gradients. These are deliberate states, not placeholder
 * gray — see `Docs/design-system/entity-visual-header.md`.
 *
 * NFP #1 (tunability): the gradient palette and glyph map are plain tables — swap
 *   a colour or glyph by editing one entry.
 * NFP #3 (determinism): the gradient for an entity is chosen by a stable hash of
 *   its id (`gradientIndexForId`), so an entity keeps its colour identity across
 *   sessions and saves. No `Math.random`.
 *
 * THR-638 seam: when curated art registries for factions / artifacts /
 *   sublocations / NPC roles land, they replace the fallback *source* in the
 *   resolver's per-kind switch — this glyph table remains the last-resort tier.
 */

/** Entity kinds the visual pattern understands. Drives glyph + source resolution. */
export type EntityVisualKind =
  | 'agent'
  | 'avatar'
  | 'location'
  | 'sublocation'
  | 'encounter'
  | 'faction'
  | 'artifact'
  | 'army'
  | 'npc-role'
  | 'unknown';

/** Person-like kinds render an initial (or silhouette) rather than a category glyph. */
const PERSON_KINDS: ReadonlySet<EntityVisualKind> = new Set<EntityVisualKind>([
  'agent',
  'avatar',
  'npc-role',
]);

/** True when a kind's fallback tile shows a name initial / silhouette. */
export function isPersonKind(kind: EntityVisualKind): boolean {
  return PERSON_KINDS.has(kind);
}

// ── Gradient palette ────────────────────────────────────────────────

/** One fallback gradient: a CSS background plus a legible glyph colour. */
export interface EntityGradient {
  id: string;
  /** CSS `background` value — deep Threadbare base with a single hue lean. */
  background: string;
  /** Colour for the glyph/initial painted over the gradient. */
  glyphColor: string;
}

/**
 * Six Threadbare-palette gradients. Each is a dark void base with one muted hue
 * lean drawn from the sphere/veil vocabulary (ember, gold, spirit, life, matter,
 * entropy). The id-hash picks one per entity — never random.
 */
export const ENTITY_GRADIENTS: EntityGradient[] = [
  {
    id: 'ember',
    background: 'linear-gradient(135deg, rgba(120,53,15,0.45) 0%, rgba(10,10,15,0.95) 74%)',
    glyphColor: 'rgba(224, 168, 120, 0.75)',
  },
  {
    id: 'gold',
    background: 'linear-gradient(135deg, rgba(212,175,55,0.30) 0%, rgba(10,10,15,0.95) 72%)',
    glyphColor: 'rgba(212, 196, 158, 0.8)',
  },
  {
    id: 'spirit',
    background: 'linear-gradient(135deg, rgba(88,60,120,0.44) 0%, rgba(10,10,15,0.95) 74%)',
    glyphColor: 'rgba(190, 168, 224, 0.72)',
  },
  {
    id: 'life',
    background: 'linear-gradient(135deg, rgba(45,90,60,0.44) 0%, rgba(10,10,15,0.95) 74%)',
    glyphColor: 'rgba(150, 200, 165, 0.72)',
  },
  {
    id: 'matter',
    background: 'linear-gradient(135deg, rgba(48,72,104,0.44) 0%, rgba(10,10,15,0.95) 74%)',
    glyphColor: 'rgba(150, 178, 214, 0.72)',
  },
  {
    id: 'entropy',
    background: 'linear-gradient(135deg, rgba(110,40,48,0.44) 0%, rgba(10,10,15,0.95) 74%)',
    glyphColor: 'rgba(214, 150, 156, 0.72)',
  },
];

/** Number of fallback gradients the id-hash selects from. */
export const ENTITY_GRADIENT_COUNT = ENTITY_GRADIENTS.length;

// ── Category glyphs ─────────────────────────────────────────────────

/**
 * Category glyph for the fallback tile, keyed by entity kind. Person kinds are
 * absent here — they use a name initial via `fallbackGlyphFor`. Authored in
 * Threadbare style; readable at chip size (`--text-xs`).
 */
const CATEGORY_GLYPHS: Partial<Record<EntityVisualKind, string>> = {
  location: '⌂',    // ⌂ house — a place
  sublocation: '◈', // ◈ diamond with inner dot — a place within a place
  encounter: '✦',   // ✦ four-pointed star — a moment
  faction: '⚜',     // ⚜ fleur-de-lis — a banner / sigil
  artifact: '◆',    // ◆ filled diamond — a made thing
  army: '⚔',        // ⚔ crossed swords — a force in the field (THR-1023)
  unknown: '◇',     // ◇ white diamond
};

/** Glyph shown when a person kind has no name to derive an initial from. */
export const SILHOUETTE_GLYPH = '◍'; // ◍ circle with vertical fill — a veiled figure

/** Last-resort glyph for any kind with no category entry. */
const DEFAULT_GLYPH = '◇'; // ◇

/**
 * The fallback glyph for an entity. Person kinds render the name's first
 * character (uppercased); place/thing kinds render their category glyph.
 */
export function fallbackGlyphFor(kind: EntityVisualKind, name: string | undefined): string {
  if (isPersonKind(kind)) {
    const initial = (name ?? '').trim().charAt(0);
    return initial ? initial.toUpperCase() : SILHOUETTE_GLYPH;
  }
  return CATEGORY_GLYPHS[kind] ?? DEFAULT_GLYPH;
}

// ── Stable id hash → gradient index ─────────────────────────────────

/**
 * Deterministic djb2 string hash. Same input → same output, every session.
 * Used only to pick a fallback gradient; never for gameplay resolution.
 */
export function hashEntityId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h + id.charCodeAt(i)) | 0; // h * 33 + c, wrapped to int32
  }
  return Math.abs(h);
}

/** Stable gradient index in [0, ENTITY_GRADIENT_COUNT) for an entity id. */
export function gradientIndexForId(id: string): number {
  return hashEntityId(id) % ENTITY_GRADIENT_COUNT;
}
