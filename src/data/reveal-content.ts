/**
 * Ceremonial reveal content (THR-799).
 *
 * The ceremony line and fallback flavor prose for the reveal presentation tier.
 * Everything here is *last resort*: a reveal surface reads the element's own
 * prose first (action flavor text, attachment prose, condition/trait prose) and
 * only falls through to this table when the element carries none. Missing prose
 * must never produce an empty quote well — it produces no well at all, or one of
 * these lines.
 *
 * Determinism (NFP #3): fallback selection is a stable index derived from the
 * element id, never a PRNG draw. The same element shows the same line for the
 * whole run and across runs.
 */

/** The kinds of minor element the ceremonial tier can present. */
export type RevealKind = 'trait' | 'attachment' | 'action_card' | 'event';

/** All reveal kinds, in presentation order — the StyleGuide iterates this. */
export const REVEAL_KINDS: readonly RevealKind[] = [
  'trait',
  'attachment',
  'action_card',
  'event',
] as const;

/**
 * The ceremony line at the top of a RevealCard — names the *kind* of moment,
 * not the item (the item name lands later, in the banner). Letterspaced display
 * caps; rendered in --text-primary, never gold (gold budget: the medallion ring
 * is the single bright-gold element per surface).
 *
 * Voice: the player is a god watching a mortal life turn. These read as the
 * world noting the change, not as a UI announcing an unlock.
 */
export const REVEAL_CATEGORY_TITLES: Record<RevealKind, string> = {
  trait: 'A NATURE REVEALED',
  attachment: 'A BOND FORMED',
  action_card: 'A NEW WORKING LEARNED',
  event: 'THE WORLD TURNS',
};

/**
 * Generic flavor lines, used only when the element has no prose of its own.
 * Two to three per kind so repeat reveals of prose-less elements do not read
 * identically; selection is by stable index (see `pickFallbackFlavor`).
 */
export const REVEAL_FALLBACK_FLAVOR: Record<RevealKind, readonly string[]> = {
  trait: [
    'It was always there. Only now does anyone have cause to name it.',
    'Some things a life carries quietly, until the day they show.',
    'The thread was spun this way from the first. The weave simply reached it.',
  ],
  attachment: [
    'What is held changes the hand that holds it.',
    'Every keeping is also a debt, though the ledger is slow.',
    'It will be carried a while, and then it will carry back.',
  ],
  action_card: [
    'A shape the world had not offered before, now offered.',
    'Some doors open only once the walker has walked far enough.',
    'The reach widens. What was beyond it is merely far, now.',
  ],
  event: [
    'The pattern shifts. Few will notice; fewer still will remember.',
    'Somewhere a small thing moved, and the larger things must answer.',
    'It happens the way weather happens — to everyone, unasked.',
  ],
};

/**
 * Stable, non-random index for fallback selection.
 *
 * A small FNV-1a-style accumulation over the id's char codes. Deterministic and
 * order-independent of any PRNG stream, so a reveal surface never perturbs
 * simulation determinism just by rendering (NFP #3).
 */
export function stableIndex(id: string, bucketCount: number): number {
  if (bucketCount <= 0) return 0;
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // >>> 0 forces the unsigned reading; Math.imul can leave the sign bit set.
  return (hash >>> 0) % bucketCount;
}

/**
 * The flavor line for an element that has none of its own.
 *
 * Returns `null` for an unrecognised kind so the caller omits the quote well
 * entirely rather than rendering an empty one (fail-soft, NFP #4).
 */
export function pickFallbackFlavor(kind: RevealKind, elementId: string): string | null {
  const pool = REVEAL_FALLBACK_FLAVOR[kind];
  if (!pool || pool.length === 0) return null;
  return pool[stableIndex(elementId, pool.length)] ?? null;
}

/**
 * The ceremony line for a kind, or `null` if the kind is unknown — an unknown
 * kind omits the title zone instead of printing a raw enum value at the player.
 */
export function revealCategoryTitle(kind: RevealKind): string | null {
  return REVEAL_CATEGORY_TITLES[kind] ?? null;
}
