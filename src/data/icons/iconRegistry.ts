/**
 * The icon registry (THR-1885, plan `2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`
 * § Content pillar → Data tables, § Icon).
 *
 * One entry per icon **name**, named by idea in kebab-case (`close`, `scales`; place types
 * prefixed `place-`). Each entry carries:
 *
 * - `meaning` — the one idea the shape stands for (Law 10: one icon, one idea). Never empty.
 * - `shape` — `{ viewBox, paths: { d, opacity? }[] }`. **Path data, never React
 *   components** (THR-1834), so a Unity port can turn the same data into a sprite atlas, and
 *   so the map's texture builder (`locationIconTextures.ts`) can rasterise the same entry the
 *   panels draw. A carved game-icons shape is one path at opacity 1; a drawing of our own may
 *   layer several.
 * - `source` — `{ family: 'game-icons', author, slug }` (vendored from the CC BY 3.0 set on its
 *   512 × 512 grid; nothing is fetched at runtime) or `{ family: 'own' }`.
 *
 * **What this file holds today:** the format and one entry, `fallback`, a shape we draw — the
 * designed neutral mark `Icon` shows for a name that reaches it without an entry (Law 4). No
 * game-icons shape is vendored here, so this file carries no licence obligation yet. THR-1879
 * vendors the carved subset (~200 shapes, the eleven `place-*` shapes among them), the
 * concept → shape table and the credits line; the rule it inherits: **the credits line ships in
 * the same PR as the first `game-icons` entry**, because the deployed build is public.
 *
 * Read shapes through `src/components/shared/iconShape.ts` (Law 3: one resolver), never by
 * indexing this object from a component.
 */

/** One path of an icon shape. `opacity` defaults to 1. */
export interface IconPath {
  readonly d: string;
  readonly opacity?: number;
}

/** An icon's geometry: a viewBox and the paths drawn inside it, every one filled `currentColor`. */
export interface IconShape {
  readonly viewBox: string;
  readonly paths: readonly IconPath[];
}

/** Where a shape comes from. A `game-icons` author is credited by `ICON_CREDITS`. */
export type IconSource =
  | { readonly family: 'game-icons'; readonly author: string; readonly slug: string }
  | { readonly family: 'own' };

export interface IconEntry {
  /** The one idea this icon means (Law 10). */
  readonly meaning: string;
  readonly shape: IconShape;
  readonly source: IconSource;
}

/** The game-icons.net grid every vendored shape is drawn on. */
export const GAME_ICON_VIEWBOX = '0 0 512 512';

/** The grid our own drawings use. */
export const OWN_ICON_VIEWBOX = '0 0 24 24';

/** Opacity of the fallback mark's outer ring — the inner diamond reads first. */
const FALLBACK_RING_OPACITY = 0.4;

/**
 * Every icon the game can draw. `satisfies` keeps the literal keys (so `IconName` is the exact
 * set) while checking each entry against `IconEntry`.
 */
export const ICON_REGISTRY = {
  fallback: {
    meaning: 'An icon that has not been drawn yet',
    shape: {
      viewBox: OWN_ICON_VIEWBOX,
      paths: [
        // A neutral diamond inside a fainter diamond ring: says "a mark belongs here" without
        // claiming any meaning of its own, so it can never be mistaken for a real concept.
        { d: 'M12 2L22 12L12 22L2 12ZM12 5.5L5.5 12L12 18.5L18.5 12Z', opacity: FALLBACK_RING_OPACITY },
        { d: 'M12 8L16 12L12 16L8 12Z' },
      ],
    },
    source: { family: 'own' },
  },
} as const satisfies Record<string, IconEntry>;

/** A name the registry draws. An unknown literal is a compile error. */
export type IconName = keyof typeof ICON_REGISTRY;

/** The name `Icon` falls back to (Law 4). */
export const FALLBACK_ICON_NAME: IconName = 'fallback';

/**
 * The distinct `game-icons` authors of a registry, sorted — the input to the CC BY 3.0 credits
 * line (THR-1879 writes the words and picks the home). A function of the registry, never a
 * hand-kept list, so the credits cannot drift from the shipped set.
 */
export function iconCreditsOf(registry: Readonly<Record<string, IconEntry>>): string[] {
  const authors = new Set<string>();
  for (const entry of Object.values(registry)) {
    if (entry.source.family === 'game-icons') authors.add(entry.source.author);
  }
  return [...authors].sort((a, b) => a.localeCompare(b));
}

/** Every game-icons author the shipped registry draws from. Empty until THR-1879 vendors a shape. */
export const ICON_CREDITS: readonly string[] = iconCreditsOf(ICON_REGISTRY);
