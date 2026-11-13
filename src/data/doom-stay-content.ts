/**
 * Stay the Unmaking — the god's answer to the Doom clock (THR-2207, slice 2 of
 * `Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md`).
 *
 * The card's id and every player-facing line the Doom notice adds. The numbers
 * live in `game-config.ts` (`DOOM_STAY_*`); the card's text lives on its template
 * in `unified-action-templates.ts`. No number reaches the player here (Law 17: the
 * cost chip is the one place a cost is a number).
 */

/** The sustained self card that slows Doom while held. */
export const DOOM_STAY_TEMPLATE_ID = 'divine.self.stay_the_unmaking';

/** The Doom notice's second button, shown while the card is held and not active. */
export const DOOM_STAY_BUTTON = 'Stay it';

/**
 * The Doom notice's second body line while the card is held and not active.
 * `{Sphere}` is the god's primary sphere, the pool that pays the upkeep.
 */
export const DOOM_STAY_HINT = 'Stay the Unmaking slows it. Holding it draws on your {Sphere} essence every day.';

/** Fallback for `{Sphere}` when the god's primary cannot be read. */
export const DOOM_STAY_HINT_SPHERE_FALLBACK = 'primary';

/** The Doom notice's second body line while the card is already held active. */
export const DOOM_STAY_ACTIVE_LINE = 'You are holding it back.';

/** Fill the hint's `{Sphere}` slot; an empty slot reads the fallback (PC-3). */
export function doomStayHint(sphereLabel: string | undefined): string {
  const label = sphereLabel && sphereLabel.trim().length > 0 ? sphereLabel : DOOM_STAY_HINT_SPHERE_FALLBACK;
  return DOOM_STAY_HINT.replace('{Sphere}', label);
}
