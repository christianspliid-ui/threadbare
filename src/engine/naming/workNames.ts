/**
 * The work namer — THR-1297 §5 (slice 4), resolving THR-1291.
 *
 * **"Never a second namer" is resolved by generalizing the namer that already exists.**
 * `groups/groupNames.ts` was structurally the ruled design already — a context of bound
 * entities, additive flavor lexicons, pattern sets chosen by input presence, eager
 * rendering so the PRNG draw count is input-independent, and a correct `possessive()`.
 * This module owns those primitives now; the group namer imports them and is this
 * module's first caller.
 *
 * **What deliberately did *not* happen:** the group namer's own pattern set and draw
 * sequence are untouched. Folding companies onto the work grammar would have re-rolled
 * every company name in every existing world — a player-facing rename with no ticket
 * behind it, and exactly the class of silent regression slice 1's golden comparison
 * exists to catch. `__tests__/groupNameStability.test.ts` pins that they did not move.
 * One set of naming *primitives*, two grammars; that is what "never a second namer"
 * asked for — one rule for possessives, one seed rule, one fallback discipline.
 *
 * Determinism (NFP #3): every name is a pure function of the named node's id. The
 * phonetic flavor draws from a *separately salted* stream so that whether a culture
 * signature is available cannot shift the main sequence.
 *
 * Fail-soft (NFP #4): never throws, never returns blank, and never returns a raw
 * template or kind id on a player surface — the ladder is anchored name → flavored
 * name → possessive → terminal family noun.
 */

import { mulberry32 } from '../../lib/prng';
import type { ReachDomain } from '../../types/traits';
import type { CulturePhoneticSignature } from '../../types/culture';
import { generatePhoneticName } from '../culturePhonetics';
import {
  WORK_ROOTS_BY_REACH,
  WORK_ROOTS_BY_FOUNDATION,
  WORK_NOUNS_BY_FAMILY,
  WORK_NAME_PATTERNS,
  WORK_SUCCESSOR_NAME_PATTERNS,
  FAILURE_SCAR_LEXICON,
  FAILURE_SCAR_FALLBACK,
  familyForKind,
  familyFallbackNoun,
  type WorkNameFamily,
} from '../../data/work-name-content';

// ─────────────────────────────────────────────────────────────────────────────
// Constants (NFP #1 — every magic number is named)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Share of works that take a culture-phonetic root instead of a lexicon root, when
 * a signature is available at all. Tuned low: phonetic roots read as *foreign* and
 * are the seasoning, not the dish.
 */
export const WORK_NAME_PHONETIC_CHANCE = 0.35;

/** Distinct renderings tried before the namer falls back to the possessive. */
export const WORK_NAME_MAX_ATTEMPTS = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Shared naming primitives — the "one namer" surface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Turn a string id into a stable 32-bit seed. Plain FNV-1a — deterministic across
 * runs and platforms. Exported because every namer in the engine must agree on how
 * an id becomes a seed; two hash rules would be two namers wearing one name.
 */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Uniform pick from a pool; `undefined` on an empty pool, never a throw. */
export function pickFrom<T>(rng: () => number, pool: readonly T[]): T | undefined {
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

/**
 * English possessive that doesn't produce "Thomas's" for names already ending in s.
 *
 * The single implementation. Before this module it existed once in `groupNames.ts`
 * and *not at all* in the strategic-pack naming path, where `"{actor}'s Workshop"`
 * was string-substituted raw — which is the trailing-s bug §5 lists among its
 * fixes-in-passing.
 */
export function possessive(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}

/**
 * Strip a leading article so a name can be re-articled by a pattern.
 * Shared with the successor grammar and the group namer's reformation grammar.
 */
function bareName(name: string): string {
  return name.replace(/^(the|a|an)\s+/i, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// The work name
// ─────────────────────────────────────────────────────────────────────────────

/** Everything the work namer may key off. All optional but `workId`. */
export interface WorkNameContext {
  /** Seeds the PRNG — the named node's id. Same id always yields the same name. */
  workId: string;
  /** The undertaking kind; selects the naming family. Unknown kinds fall to `place`. */
  kindId?: string;
  /** The founder's leading reach — the "manner" flavor table. */
  reach?: ReachDomain;
  /** The culture's foundation bias — the "people" flavor table. */
  foundation?: string;
  /**
   * The name of the thing the undertaking *touched* — a bound location from the
   * released binding ledger, the target node, or the origin location. This is where
   * "Saltway" comes from: the work is named for the ground it was done on.
   */
  anchorName?: string;
  /** The founder's name. Rendered possessive before use — never substituted raw. */
  actorName?: string;
  /**
   * The name of a destroyed work this one replaces. Present → a successor grammar
   * runs first ("The Second Saltway"), so a rebuilt work is recognisable as the
   * same work returning. THR-1291 §3: names outlive owners, and outlive the work.
   */
  predecessorName?: string;
  /**
   * The thing's *own* noun, when it has a more specific one than its family offers
   * — "Research Circle" for a `research_circle` sublocation, where the `place`
   * family would say "House".
   *
   * **Why this exists.** Measured on a 150-tick seed-42 run: christening replaced
   * "Rill's Research Circle at Ardenmor Keep" with "The Ardenmor Keep House". That
   * is a proper name, which is what §5 asked for, but it reads *worse* — a player
   * loses what the place is, and a generic family noun on a specific thing is a
   * clarity regression on a player-facing surface. Passing the thing's own noun
   * keeps the earned-name grammar (reach flavor + anchor) while the noun still says
   * what it is: "The Deepset Research Circle of Ardenmor Keep".
   *
   * Per-kind lexicons proper are slice 5's (the ten kind rows); this keeps slice 4
   * from shipping a regression while that lands.
   */
  nounOverride?: string;
  /** Culture signature for phonetic flavor. Absent → lexicon roots only. */
  phoneticSignature?: CulturePhoneticSignature;
  /** Culture id, for the phonetic tracer. */
  cultureId?: string;
  /** Names already taken; the namer retries around collisions. */
  usedNames?: ReadonlySet<string>;
  /** Tick, for the phonetic tracer. */
  tick?: number;
}

/**
 * Name a completed work.
 *
 * Called at the completion seam (`strategicActionLifecycle`), never before: until an
 * undertaking completes it wears the working possessive from {@link workingName}.
 * A thing earns its name by being finished — THR-1291 §2.
 */
export function generateWorkName(ctx: WorkNameContext): string {
  const rng = mulberry32(hashSeed(ctx.workId));
  const family = familyForKind(ctx.kindId);

  // A work raised where a destroyed one stood keeps that name, worn. Returns before
  // the general pools so a rebuild is recognisable; falls through when the
  // predecessor's name is unusable, rather than emitting an unresolved token.
  if (ctx.predecessorName) {
    const successor = renderSuccessorName(rng, ctx.predecessorName);
    if (successor) return successor;
  }

  // Flavor roots are additive — reach and foundation join one pool rather than one
  // replacing the other, so a name tilts without becoming formulaic. Both are widened
  // to string index: `reach` and `foundation` arrive from graph properties as
  // unvalidated strings while the tables are keyed by closed sets (the `?? []` is the
  // fail-soft row, same idiom as the group namer's sphere lookup).
  const roots: string[] = [
    ...(ctx.reach
      ? (WORK_ROOTS_BY_REACH as Record<string, readonly string[]>)[ctx.reach] ?? []
      : []),
    ...(ctx.foundation
      ? (WORK_ROOTS_BY_FOUNDATION as Record<string, readonly string[]>)[ctx.foundation] ?? []
      : []),
  ];

  const nouns = WORK_NOUNS_BY_FAMILY[family];

  // Every draw happens exactly once, before any branch reads it — the eager-render
  // idiom that keeps the draw count independent of which inputs are present.
  const lexicalRoot = pickFrom(rng, roots);
  // The draw happens even when an override is present, so the override cannot shift
  // the PRNG sequence — the same work names the same way whether or not its type
  // happened to carry a specific noun.
  const drawnNoun = pickFrom(rng, nouns) ?? familyFallbackNoun(family);
  const noun = ctx.nounOverride?.trim() || drawnNoun;
  const phoneticRoll = rng();

  // Phonetics draws from its own salted stream. `generatePhoneticName` consumes a
  // variable number of draws internally (it retries), so sharing the main stream
  // would make the whole name depend on whether a culture happened to be resolvable.
  const phoneticRoot = resolvePhoneticRoot(ctx, phoneticRoll);
  const root = phoneticRoot ?? lexicalRoot;

  const actorPossessive = ctx.actorName ? possessive(ctx.actorName) : undefined;
  const anchor = ctx.anchorName ? bareName(ctx.anchorName) : undefined;

  const rendered: string[] = [
    ...(anchor ? renderPatterns(WORK_NAME_PATTERNS.anchored, { root, noun, anchor, actor: actorPossessive }) : []),
    ...(root ? renderPatterns(WORK_NAME_PATTERNS.flavored, { root, noun, anchor, actor: actorPossessive }) : []),
    ...(actorPossessive ? renderPatterns(WORK_NAME_PATTERNS.possessive, { root, noun, anchor, actor: actorPossessive }) : []),
  ];

  // Uniqueness: walk the rendered set from a seeded offset rather than re-drawing, so
  // a collision costs a different pattern and never a different PRNG history.
  if (rendered.length > 0) {
    const used = ctx.usedNames;
    const start = Math.floor(rng() * rendered.length) % rendered.length;
    const attempts = Math.min(WORK_NAME_MAX_ATTEMPTS, rendered.length);
    for (let i = 0; i < attempts; i++) {
      const candidate = rendered[(start + i) % rendered.length];
      if (!used || !used.has(candidate)) return candidate;
    }
    // Every attempt collided — the possessive below is a *better* answer than a
    // knowingly duplicate name, so fall through rather than returning one.
  }

  if (actorPossessive) return `${actorPossessive} ${noun}`;
  return `The ${noun}`;
}

/**
 * The name an undertaking wears *before* it completes — "Corran's Ring".
 *
 * Not a lesser version of the earned name: it is a different claim. A work in
 * progress belongs to whoever is doing it; a finished one belongs to the world and
 * takes a proper name (THR-1291 §2).
 */
export function workingName(actorName: string | undefined, kindId: string | undefined): string {
  const noun = familyFallbackNoun(familyForKind(kindId));
  if (!actorName || actorName.trim().length === 0) return `The ${noun}`;
  return `${possessive(actorName)} ${noun}`;
}

/**
 * Name a *visible* failure for the failure-name register.
 *
 * The register is distinct from earned names by design (review ruling 2.2): a scar
 * records that someone tried here and it went badly, which is a fact about the
 * ground rather than a name the work earned. Clean failures write nothing — the
 * caller gates on `undertaking_failed_visible`, not this function.
 */
export function generateFailureScarName(scarId: string, actorName: string | undefined): string {
  const rng = mulberry32(hashSeed(scarId));
  const folly = pickFrom(rng, FAILURE_SCAR_LEXICON) ?? FAILURE_SCAR_LEXICON[0];
  if (!actorName || actorName.trim().length === 0) return FAILURE_SCAR_FALLBACK;
  return `${possessive(actorName)} ${folly}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

interface PatternParts {
  root: string | undefined;
  noun: string;
  anchor: string | undefined;
  actor: string | undefined;
}

/**
 * Render every pattern whose tokens are all satisfiable. A pattern naming a token we
 * have no value for is dropped rather than rendered with a hole — "never a blank,
 * never a raw id" is enforced here and not left to the caller.
 */
function renderPatterns(patterns: readonly string[], parts: PatternParts): string[] {
  const out: string[] = [];
  for (const pattern of patterns) {
    if (pattern.includes('{root}') && !parts.root) continue;
    if (pattern.includes('{anchor}') && !parts.anchor) continue;
    if (pattern.includes('{actor}') && !parts.actor) continue;
    const rendered = pattern
      .replace(/\{root\}/g, parts.root ?? '')
      .replace(/\{noun\}/g, parts.noun)
      .replace(/\{anchor\}/g, parts.anchor ?? '')
      .replace(/\{actor\}/g, parts.actor ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    if (rendered.length > 0) out.push(rendered);
  }
  return out;
}

/**
 * A culture-phonetic root, or undefined when phonetics is unavailable or the roll
 * did not fire. Salted stream — see the note at the call site.
 */
function resolvePhoneticRoot(ctx: WorkNameContext, roll: number): string | undefined {
  if (!ctx.phoneticSignature) return undefined;
  if (roll >= WORK_NAME_PHONETIC_CHANCE) return undefined;
  try {
    const phoneticRng = mulberry32(hashSeed(`${ctx.workId}:phonetic`));
    const name = generatePhoneticName(
      ctx.phoneticSignature,
      'work',
      phoneticRng,
      new Set<string>(),
      ctx.cultureId ?? 'unknown',
      ctx.tick ?? 0,
    );
    return name ?? undefined;
  } catch {
    // `generatePhoneticName` reads signature fields directly and throws on a
    // malformed one (a signature missing `vowels` dies in `buildSyllable`). Culture
    // signatures are built from graph properties, so a partial one is a live
    // possibility — and this module's contract is that naming never throws into a
    // tick phase. Lexicon roots are the fallback, which is a name either way.
    return undefined;
  }
}

/**
 * Render a successor name from a destroyed work's. Mirrors the group namer's
 * reformation grammar token-for-token (`{old}` / `{bare}` / `{oldLower}`).
 */
function renderSuccessorName(rng: () => number, predecessorName: string): string | undefined {
  const old = predecessorName.trim();
  if (old.length === 0 || WORK_SUCCESSOR_NAME_PATTERNS.length === 0) return undefined;

  const bare = bareName(old);
  const oldLower = /^the\s+/i.test(old) ? `the ${bare}` : old;

  const pattern = WORK_SUCCESSOR_NAME_PATTERNS[
    Math.floor(rng() * WORK_SUCCESSOR_NAME_PATTERNS.length) % WORK_SUCCESSOR_NAME_PATTERNS.length
  ];
  return pattern
    .replace(/\{oldLower\}/g, oldLower)
    .replace(/\{bare\}/g, bare)
    .replace(/\{old\}/g, old);
}

export type { WorkNameFamily };
