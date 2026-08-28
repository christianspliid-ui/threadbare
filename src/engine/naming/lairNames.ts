/**
 * The lair namer — THR-1312.
 *
 * Both lair writers named their node with a counter: `Lair ${lairIndex}` at worldgen
 * and `Lair (spawned t${tick})` on escalation. Measured on seed 42 / medium / tick 30,
 * that was 17 of 17 lairs — not a fallback, the only naming path lairs had. Lairs are
 * a *wilderness* class, and THR-1297 slice 5 made wilderness a primary destination
 * (700 of 798 idle decisions happened at lairs), so the surface went from rarely-seen
 * to frequently-seen in the same release. `HexSidebar` renders `loc.name` verbatim
 * under a "Monster Lair" header, so "Lair 7" was reaching players directly.
 *
 * **Never a second namer.** This module owns a grammar, not a set of primitives —
 * `hashSeed`, `pickFrom` and the seeded-offset collision walk are imported from
 * `workNames.ts`, which is where THR-1291 §5 put them. Two hash rules would be two
 * namers wearing one name. What is genuinely different here is the *keying*: a work
 * is named for what was done (reach + foundation), a lair for what the place is and
 * what haunts it (terrain family + dominant sphere). Different question, same idiom.
 *
 * **The name is written once, at creation, and never re-derived.** That is what makes
 * `cleared_lair` keep its identity for free: clearing flips a subtype, and since
 * nothing re-stamps the name, "The Choking Snare" stays "The Choking Snare" and the
 * surface's own header does the work of saying it has a past. A rename on clearing
 * was the other option and is the wrong one — it would erase the only thing tying the
 * cleared place to the lair the player remembers fighting.
 *
 * Determinism (NFP #3): every name is a pure function of the lair's node id, drawn
 * from a PRNG this module seeds itself. It deliberately does **not** consume the
 * caller's stream, so wiring it into `seedMonsterLairs` cannot shift worldgen's
 * existing draw sequence — the same seed places the same lairs on the same hexes as
 * before this change; only their names differ.
 *
 * Fail-soft (NFP #4): never throws, never returns blank, never returns a raw id. The
 * ladder is flavored name → bare family noun.
 */

import { mulberry32 } from '../../lib/prng';
import type { SphereName } from '../../types/index';
import { hashSeed, pickFrom } from './workNames';
import {
  LAIR_NOUNS_BY_FAMILY,
  LAIR_ROOTS_BY_FAMILY,
  LAIR_ROOTS_BY_SPHERE,
  LAIR_NAME_PATTERNS,
  familyForTerrain,
  lairFallbackNoun,
  type LairNameFamily,
} from '../../data/lair-name-content';

// ─────────────────────────────────────────────────────────────────────────────
// Constants (NFP #1 — every magic number is named)
// ─────────────────────────────────────────────────────────────────────────────

/** Distinct renderings tried before the namer falls back to the bare noun. */
export const LAIR_NAME_MAX_ATTEMPTS = 8;

// ─────────────────────────────────────────────────────────────────────────────
// The lair name
// ─────────────────────────────────────────────────────────────────────────────

/** Everything the lair namer may key off. All optional but `lairId`. */
export interface LairNameContext {
  /** Seeds the PRNG — the lair node's id. Same id always yields the same name. */
  lairId: string;
  /** The hex's terrain; selects the naming family. Unknown terrain falls to `burrow`. */
  terrain?: string;
  /** The lair's `dominantSphere` — the "what haunts it" flavor table. */
  dominantSphere?: SphereName | string;
  /** Names already taken; the namer walks around collisions. */
  usedNames?: ReadonlySet<string>;
}

/**
 * Name a lair.
 *
 * Called at both creation seams — `seedMonsterLairs` at worldgen and
 * `spawnAdjacentLair` on escalation — and nowhere else. A lair is named when it
 * appears and keeps that name for the rest of the run, through tier upgrades and
 * through clearing.
 */
export function generateLairName(ctx: LairNameContext): string {
  const rng = mulberry32(hashSeed(ctx.lairId));
  const family = familyForTerrain(ctx.terrain);

  // Terrain and sphere roots join one pool rather than one replacing the other, so a
  // name tilts toward place or toward haunting without becoming formulaic. The sphere
  // lookup is widened to string index because `dominantSphere` arrives from graph
  // properties as an unvalidated string while the table is keyed by the closed set
  // (the `?? []` is the fail-soft row, same idiom as the work namer's).
  const roots: string[] = [
    ...LAIR_ROOTS_BY_FAMILY[family],
    ...(ctx.dominantSphere
      ? (LAIR_ROOTS_BY_SPHERE as Record<string, readonly string[]>)[ctx.dominantSphere] ?? []
      : []),
  ];

  // Every draw happens exactly once, before any branch reads it — the eager-render
  // idiom that keeps the draw count independent of which inputs are present.
  const noun = pickFrom(rng, LAIR_NOUNS_BY_FAMILY[family]) ?? lairFallbackNoun(family);

  // Rendered across *every* root rather than one drawn root. The work namer draws one
  // root because its pools are large and its collisions rare; a lair's pool is one
  // family's seven roots plus a sphere's four, and a medium map seeds ~17 lairs that
  // cluster hard by terrain — drawing one root would hand the collision walk two
  // candidates and force the bare-noun fallback often enough to be visible. Rendering
  // the cross product costs no extra draws (the offset below is the only one) and
  // gives the walk ~22 distinct names to find a free one in.
  const rendered = renderLairPatterns(roots, noun);

  if (rendered.length > 0) {
    const used = ctx.usedNames;
    const start = Math.floor(rng() * rendered.length) % rendered.length;
    const attempts = Math.min(LAIR_NAME_MAX_ATTEMPTS, rendered.length);
    for (let i = 0; i < attempts; i++) {
      const candidate = rendered[(start + i) % rendered.length];
      if (!used || !used.has(candidate)) return candidate;
    }
    // Every attempt collided — the bare noun below is a *better* answer than a
    // knowingly duplicate name, so fall through rather than returning one.
  }

  return `The ${noun}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render every pattern against every root. A pattern naming a token we have no value
 * for is dropped rather than rendered with a hole — "never a blank, never a raw id"
 * is enforced here and not left to the caller.
 */
function renderLairPatterns(roots: readonly string[], noun: string): string[] {
  const out: string[] = [];
  for (const root of roots) {
    if (!root) continue;
    for (const pattern of LAIR_NAME_PATTERNS) {
      const name = pattern
        .replace(/\{root\}/g, root)
        .replace(/\{noun\}/g, noun)
        .replace(/\s+/g, ' ')
        .trim();
      if (name.length > 0) out.push(name);
    }
  }
  return out;
}

export type { LairNameFamily };
