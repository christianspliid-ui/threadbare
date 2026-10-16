/**
 * Where the carved icons come from (THR-1904, plan `2026-10-14-thr-1879-type-and-icons-rollout.md`
 * § 4 and § Constants).
 *
 * The constants the vendoring script (`scripts/vendor-game-icons.ts`) and the registry share.
 * This file has no runtime imports, so the script can load it directly under
 * `node --experimental-strip-types`.
 */

/** The upstream repository every carved shape is vendored from. */
export const GAME_ICONS_REPO = 'game-icons/icons';

/** The upstream commit every carved shape is vendored from (the tree read on 2026-10-14). */
export const GAME_ICONS_REPO_COMMIT = '82d948812bfe3f269ef8f731dcdb07b08160edc4';

/** Decimal places kept in vendored path coordinates (0.1 of a 512 unit is 1/150 px at 34 px). */
export const ICON_PATH_DECIMALS = 1;

/** The vendoring script warns when the generated shapes pass this gzip size (measured ~104 KB at 229 shapes). */
export const ICON_SHAPES_GZIP_BUDGET_KB = 150;

/**
 * Upstream author directory → the name the author uses on game-icons.net, which is the name
 * the credits screen prints. An author directory missing here stops the vendoring script and
 * names it, so a new author is credited on purpose, never by accident.
 */
export const GAME_ICONS_AUTHOR_NAMES: Readonly<Record<string, string>> = {
  'caro-asercion': 'Caro Asercion',
  cathelineau: 'Cathelineau',
  darkzaitzev: 'DarkZaitzev',
  delapouite: 'Delapouite',
  faithtoken: 'Faithtoken',
  guard13007: 'Guard13007',
  'heavenly-dog': 'HeavenlyDog',
  lorc: 'Lorc',
  lucasms: 'Lucas',
  quoting: 'Quoting',
  sbed: 'Sbed',
  skoll: 'Skoll',
};

/** One vendored shape, as `carvedShapes.generated.ts` stores it. */
export interface CarvedShapeRecord {
  /** The upstream file name without `.svg`. */
  readonly slug: string;
  /** The upstream directory, which is the author. */
  readonly authorDir: string;
  /** The credited name (`GAME_ICONS_AUTHOR_NAMES[authorDir]`). */
  readonly author: string;
  /** True when the script stored the shape mirrored left to right. */
  readonly mirrored: boolean;
  /** The one glyph path on the 512 × 512 grid, background square dropped. */
  readonly d: string;
}

/** Options a registry entry may pass to `carved()`. */
export interface CarvedOptions {
  /** The author directory, required when the slug exists under two authors upstream. */
  readonly author?: string;
  /** Store the shape mirrored left to right (`forward` is `return-arrow` mirrored). */
  readonly mirror?: boolean;
}

/** The key a vendored shape is stored under: the slug, or `<slug>@mirrored`. */
export function carvedShapeKey(slug: string, mirror = false): string {
  return mirror ? `${slug}@mirrored` : slug;
}

/** What `GAME_ICONS_SOURCE.changes` says was done to the upstream files. */
export const GAME_ICONS_CHANGES =
  'recoloured through currentColor; background square dropped; coordinates rounded to one decimal; return-arrow also stored mirrored';

/**
 * CC BY 3.0 § 4(a): a licensee may not put technological measures on the work that restrict a
 * recipient's rights under the licence. The web build has none. Before any build ships on a
 * storefront that wraps the game in DRM (for example Steam's optional wrapper), whoever handles
 * legal checks this clause (THR-1834 call 1). Shipping without the wrapper avoids the question.
 */
export const GAME_ICONS_DRM_NOTE =
  'CC BY 3.0 § 4(a) forbids technological measures that restrict the licence. Check this before shipping in a DRM wrapper.';
