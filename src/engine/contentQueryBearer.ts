/**
 * The bearer's side of a content query (THR-1520, traits wave 2 slice 2).
 *
 * `resolveContentQuery` is pure and bearer-blind on purpose: a gate can ask it the same
 * question at authoring time that the running world asks at draw time, and the two
 * cannot drift because there is one predicate. But one term on a query is *about the
 * recipient* — `requiresBearerTrait`, "only a Master Smith may be dealt this" — and a
 * resolver that read the bearer would stop being that predicate. So the term is judged
 * here, at the call site, through the engine's one trait gate (`resolveTraitPredicate`,
 * THR-786), and the resolver never sees it.
 *
 * Kept in its own module rather than beside the resolver so `contentQuery.ts` keeps
 * its import graph — it is called from *inside* the data layer (`undertaking-objects`),
 * and `traits.ts` reaches the trait-ref index — and so the split is visible in the file
 * structure: the resolver is the rule, this is the one thing the rule delegates.
 */
import type { WorldGraph } from './graph';
import type { ContentQuery } from '../types/contentQuery';
import type { TraitPredicate } from '../types/traits';
import { resolveTraitPredicate } from './traits';

/**
 * Does the bearer satisfy a query's `requiresBearerTrait` term?
 *
 * - No term → `true`: the query says nothing about the bearer.
 * - A term and a bearer → the trait gate's verdict, with item-granted traits counted
 *   when the caller supplies them.
 * - A term and **no bearer** (`bearerId` undefined) → `false`. Nothing offered rather
 *   than offered wrongly — the rule companions have followed since THR-1096, and the
 *   only honest answer when the term cannot be judged.
 *
 * Pure over the graph; no PRNG, no trace. The site that calls it owns its telemetry,
 * as with every other content-query outcome (NFP #4).
 */
export function contentQueryAdmitsBearer(
  graph: WorldGraph,
  bearerId: string | undefined,
  query: Pick<ContentQuery, 'requiresBearerTrait'>,
  opts?: { grantedTraits?: ReadonlySet<string> },
): boolean {
  const term: TraitPredicate | undefined = query.requiresBearerTrait;
  if (term === undefined) return true;
  if (bearerId === undefined) return false;
  return resolveTraitPredicate(graph, bearerId, term, opts);
}
