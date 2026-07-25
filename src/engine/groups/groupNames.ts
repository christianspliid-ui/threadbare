/**
 * Company Name Generation — THR-74
 *
 * Seeded proper-name generator for companies. Deterministic (NFP #3): the PRNG is
 * seeded from the company's node id, so regenerating a name for the same company
 * always yields the same string, independent of tick order or call count.
 *
 * The generated name is written to the company node's `name` field, which means
 * every existing prose resolver renders it with no extra wiring.
 */

import { mulberry32 } from '../../lib/prng';
import type { GroupFormationCause } from './groupQueries';
import {
  GROUP_NAME_ADJECTIVES,
  GROUP_NAME_NOUNS,
  GROUP_NAME_BAND_WORDS,
  GROUP_NAME_SINGULAR_NOUNS,
  GROUP_NAME_CAUSE_ADJECTIVES,
  GROUP_NAME_SPHERE_ADJECTIVES,
  GROUP_NAME_FALLBACK,
  GROUP_REFORMED_NAME_PATTERNS,
} from '../../data/group-name-content';

/** Everything the generator may key off. All fields optional but `groupId`. */
export interface GroupNameContext {
  /** Seeds the PRNG — same id always produces the same name. */
  groupId: string;
  /** Why the company formed; weights in extra adjectives. */
  cause?: GroupFormationCause;
  /**
   * The faction that fielded this band (THR-731). Present only for `band_spawn`,
   * and it unlocks the possessive pattern — a band is known by whose it is
   * ("The Arcane Circle's Knives"), which is how mortals would speak of it.
   */
  factionName?: string;
  /** Leader's name — required by two of the four patterns. */
  leaderName?: string;
  /** Name of the location the company formed at ("Company of the Ashford Bridge"). */
  locationName?: string;
  /** Sphere id, when Draw Together caused the formation. */
  sphereId?: string;
  /**
   * The disbanded company's name, when this is a Reunite re-formation (THR-732).
   * Present → the name is a variant of *that* name rather than a fresh draw, so
   * the player recognises the company that came back.
   */
  predecessorName?: string;
}

/**
 * Turn a string id into a stable 32-bit seed.
 * Plain FNV-1a — deterministic across runs and platforms.
 */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, pool: readonly T[]): T | undefined {
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

/**
 * Generate a company name.
 *
 * Never throws and never returns an empty string: if every word pool comes back
 * empty the fallback `"{leader}'s Company"` is used, and if even the leader name
 * is unknown it degrades to `"The Company"` (fail-soft table row).
 */
export function generateGroupName(ctx: GroupNameContext): string {
  const rng = mulberry32(hashSeed(ctx.groupId));

  // Reunite (THR-732): a company that came back keeps its old name, worn. Returns
  // before the general pools are drawn — a reunion whose name were freshly generated
  // would be unrecognisable as the same company, which is the entire point of the verb.
  // Falls through to the ordinary path when the predecessor's name is unknown, where
  // the `reunite` cause adjectives ("Returned", "Unfinished") carry the flavor instead.
  if (ctx.predecessorName) {
    const reformed = renderReformedName(rng, ctx.predecessorName);
    if (reformed) return reformed;
  }

  // Cause- and sphere-flavored adjectives join the general pool rather than
  // replacing it, so flavor tilts the name without making it formulaic.
  const adjectives: string[] = [
    ...GROUP_NAME_ADJECTIVES,
    ...(ctx.cause ? GROUP_NAME_CAUSE_ADJECTIVES[ctx.cause] ?? [] : []),
    ...(ctx.sphereId ? GROUP_NAME_SPHERE_ADJECTIVES[ctx.sphereId] ?? [] : []),
  ];

  // Render every pattern once (each draws from `rng`, so the sequence is fixed),
  // then choose among the ones whose required inputs were present. Rendering
  // eagerly keeps the PRNG draw count independent of which inputs are available,
  // which is what makes the name stable for a given group id.
  const adj1 = pick(rng, adjectives);
  const noun1 = pick(rng, GROUP_NAME_NOUNS);
  const band = pick(rng, GROUP_NAME_BAND_WORDS);
  const singular = pick(rng, GROUP_NAME_SINGULAR_NOUNS);
  const adj2 = pick(rng, adjectives);

  const rendered: Array<string | undefined> = ctx.factionName
    // A band is named for whose it is, not where it met. Offering only the two
    // faction-possessive patterns keeps bands from picking up the wandering-
    // company idiom ("Company of the Ashford Bridge") that belongs to mortals
    // who chose each other.
    ? [
        noun1 ? `${possessive(ctx.factionName)} ${noun1}` : undefined,
        adj1 && noun1 ? `The ${adj1} ${noun1} of ${ctx.factionName}` : undefined,
      ]
    : [
        adj1 && noun1 ? `The ${adj1} ${noun1}` : undefined,
        ctx.locationName ? `Company of the ${ctx.locationName}` : undefined,
        ctx.leaderName && band ? `${possessive(ctx.leaderName)} ${band}` : undefined,
        singular && adj2 ? `The ${singular} of the ${adj2} Road` : undefined,
      ];

  const available = rendered.filter((n): n is string => n !== undefined);
  if (available.length > 0) {
    return available[Math.floor(rng() * available.length) % available.length];
  }

  if (ctx.leaderName) return GROUP_NAME_FALLBACK.replace('{leader}', possessive(ctx.leaderName));
  return 'The Company';
}

/** English possessive that doesn't produce "Thomas's" for names already ending in s. */
function possessive(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}

/**
 * Render a Reunite re-formation name from the predecessor's (THR-732).
 *
 * Substitutes the three article-aware tokens documented on
 * {@link GROUP_REFORMED_NAME_PATTERNS}. Returns undefined when the pattern pool is
 * empty or the predecessor name is blank, so the caller falls back to the ordinary
 * generator rather than producing a name with an unresolved `{old}` in it.
 */
function renderReformedName(rng: () => number, predecessorName: string): string | undefined {
  const old = predecessorName.trim();
  if (old.length === 0 || GROUP_REFORMED_NAME_PATTERNS.length === 0) return undefined;

  const bare = old.replace(/^(the|a|an)\s+/i, '');
  const oldLower = /^the\s+/i.test(old) ? `the ${bare}` : old;

  const pattern = GROUP_REFORMED_NAME_PATTERNS[
    Math.floor(rng() * GROUP_REFORMED_NAME_PATTERNS.length) % GROUP_REFORMED_NAME_PATTERNS.length
  ];
  return pattern
    .replace(/\{oldLower\}/g, oldLower)
    .replace(/\{bare\}/g, bare)
    .replace(/\{old\}/g, old);
}
