/**
 * Ascendant Action Primitives — shared spec types (THR-509).
 *
 * The four reusable building blocks the early expression cards (THR-508:
 * imbue / consecrate / bestow / anoint) and many future ascendant actions
 * sit on. Resolvers live in `src/engine/ascendantPrimitives.ts`; the spec
 * types that other *type* modules need (e.g. controlEffect.ts carries a
 * per-tick thread aura) live here to avoid an engine→types cycle.
 *
 * Design doc: Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md §4.4
 *
 * NFP compliance:
 *   #1 Tunability: default magnitudes are named constants here.
 *   #2 Inspectability: trace interfaces live with the resolvers.
 *   #3 Determinism: specs carry no randomness; any selection uses an injected
 *      seeded PRNG at resolution time.
 *   #4 Fail-soft: resolvers no-op + warn on unknown targets, never throw.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** Thread-edge field a co-located aura advances by default (drives tier promotion). */
export const CO_LOCATED_AURA_DEFAULT_FIELD = 'ticksAtCurrentTier' as const;

/**
 * Default devotion a consecrated site adds per tick to each co-located
 * thread's `ticksAtCurrentTier`, accelerating tier promotion. First consumer:
 * consecrate's faith-spread.
 */
export const CONSECRATE_DEVOTION_PER_TICK = 1;

// ─── CoLocatedThreadAuraSpec ──────────────────────────────────────────────────

/**
 * A location-scoped, per-tick mutation applied to every threaded agent
 * co-located with a target location. The location id and the ascendant
 * (thread owner) are supplied at resolution time — they are runtime context,
 * not part of the reusable spec, so the same spec rides any control effect.
 *
 * Carried on `ControlEffect.perTickThreadAuras` (see controlEffect.ts); the
 * control-effects phase applies it each tick via `applyCoLocatedThreadAura`.
 */
export interface CoLocatedThreadAuraSpec {
  /** Thread-edge property to increment. Defaults to `CO_LOCATED_AURA_DEFAULT_FIELD`. */
  readonly threadField?: string;
  /** Amount added to the field per application. */
  readonly magnitude: number;
  /**
   * Also affect agents standing at sublocations contained by the target
   * location (the three-tier hex→location→sublocation model). Default true.
   */
  readonly includeSublocations?: boolean;
}
