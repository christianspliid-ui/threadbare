/**
 * avatar-framing.ts — the words that tell the player which figure is them (THR-1609).
 *
 * Cold playtest round 1: all three testers mistook the avatar — which carries the
 * past-life name the player typed in the remembrance — for a mortal to follow. The
 * avatar keeps that name (the player named their own past self; that is the hook),
 * so every surface that shows it frames it as the player's own mortal shape.
 * Plan: Docs/plans/2026-09-27-thr-1605-the-opening.md § S6.
 */

/** Suffix on the avatar's sheet header: "{name} — your mortal shape". */
export const AVATAR_SHEET_SUFFIX = 'your mortal shape';

/** Hex-map hover line on the avatar's hex. */
export function avatarHoverLine(avatarName: string): string {
  const name = avatarName.trim();
  return name ? `You walk here as ${name}.` : 'You walk here.';
}

/**
 * The god's title shown under the avatar's sheet header — the direct answer to "who
 * am I?". The divine name leads; the archetype title follows, or the hunger ("the
 * Witness") when the archetype carries no title.
 */
export function avatarGodTitleLine(
  divineName: string | undefined,
  archetypeTitle: string | undefined,
  hungerName?: string,
): string {
  const divine = divineName?.trim();
  const hunger = hungerName?.trim();
  // An identity-derived archetype carries the divine name as its title; repeating
  // it says nothing, so the hunger stands in.
  const archetype = archetypeTitle?.trim();
  const title = archetype && archetype !== divine ? archetype : (hunger ? `the ${hunger}` : '');
  if (divine && title && divine !== title) return `You are ${divine}, ${title}`;
  const only = divine || title;
  return only ? `You are ${only}` : 'You are the god who wears it';
}
