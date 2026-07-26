/**
 * TraitRefIndex — the content-side inverse of the trait predicate (THR-786).
 *
 * Maps a **trait ref** (node id, short id, display name, or tag) to the *set* of
 * trait definition node ids that carry it. ANY-match: a ref shared by several trait
 * definitions resolves to all of them, and a predicate naming that ref is satisfied
 * by a bearer holding any one — which is exactly the union semantics the six
 * pre-unification read sites had between them, preserved by construction rather than
 * by a tie-break rule. (An earlier draft resolved duplicates by lowest id; that was
 * a behavior change wearing a fail-soft costume, and the plan's NFP audit rejected it.)
 *
 * ── Why the index is not on the predicate hot path ─────────────────────────────
 *
 * For a boolean gate against a *specific bearer*, "expand ref → ids, then test
 * whether the bearer holds any of those ids" and "test whether the ref appears among
 * the refs of the traits the bearer holds" answer the identical question. The second
 * form needs only the bearer's own `has_trait` edges, so `resolveTraitPredicate`
 * (see `traits.ts`) uses it and touches no index at all. That keeps the runtime cost
 * at today's per-bearer edge walk (NFP #7) and removes any load-order coupling.
 *
 * The index earns its place where there is **no bearer**: sweeping authored content
 * for refs that no trait definition can ever satisfy (`validateTraitRefs`). That is a
 * dev-only, whole-graph question, which is why the index is `SimulationRuntime`-owned
 * and lazily built (per the engine-caches-per-session rule — never a module-scope
 * singleton, which would bleed across playthroughs).
 */
import type { WorldGraph } from './graph';
import type {
  TraitDefinitionProperties,
  TraitAssignmentProperties,
  TraitPredicate,
} from '../types/traits';

/** Ref → the set of trait definition node ids carrying that ref. */
export type TraitRefIndex = ReadonlyMap<string, ReadonlySet<string>>;

/**
 * The only graph capability the bearer walk needs: read a node, and read a node's
 * outgoing edges of a type.
 *
 * Structural rather than `WorldGraph` so the walk serves `graphConditions` too, whose
 * `ConditionGraph` is a deliberately narrow interface. `WorldGraph` satisfies this
 * shape as-is.
 *
 * Declared with **method syntax**, not function-valued properties, and that is
 * load-bearing: under `strictFunctionTypes` a function *property* is checked
 * contravariantly in its parameters, so `getOutgoingEdges: (id: string, type?: string)
 * => …` would reject `WorldGraph`, whose real signature narrows the second parameter
 * to `EdgeType`. Method syntax is checked bivariantly and accepts both `WorldGraph`
 * and the narrower test stubs. (`ConditionGraph` uses property syntax and carries
 * exactly that pre-existing incompatibility — see the THR-489 baseline.)
 */
export interface TraitGraphView {
  getNode(id: string): { id: string; name?: string; properties: Record<string, unknown> } | undefined;
  getOutgoingEdges(
    id: string,
    type?: string,
  ): ReadonlyArray<{ target: string; properties: Record<string, unknown> }>;
}

/** Node-id prefix every authored trait definition uses. */
const TRAIT_ID_PREFIX = 'trait.';

/**
 * Every ref form by which a trait definition node may be named. Shared by the index
 * (content → ids) and the bearer walk (`collectBearerTraitRefs`), so the two
 * directions can never drift apart in what counts as a ref.
 *
 * The four forms, and which pre-unification site consulted each:
 *  - node id           `trait.mastery.smithing`  — filter pipeline, spells, ambitions
 *  - short id          `mastery.smithing`        — `graphConditions` (`trait.` + key)
 *  - display name      `Master Smith`            — ambition snapshot (live); spells and
 *                                                  effect predicates *intended* it but
 *                                                  read the absent `properties.name`
 *  - tag               `#craft`                  — effect predicates, spells, ambitions
 *
 * `properties.traitId` is included for completeness because `graphConditions` reads
 * it, but no producer has ever written it (verified 2026-07-26) — it is a dead ref
 * form kept only so the migration cannot narrow that site.
 */
export function traitRefsForNode(node: {
  id: string;
  name?: string;
  properties: Record<string, unknown>;
}): string[] {
  const refs: string[] = [node.id];

  if (node.id.startsWith(TRAIT_ID_PREFIX)) {
    refs.push(node.id.slice(TRAIT_ID_PREFIX.length));
  }

  const declaredId = node.properties?.traitId;
  if (typeof declaredId === 'string' && declaredId.length > 0) refs.push(declaredId);

  if (typeof node.name === 'string' && node.name.length > 0) refs.push(node.name);

  const tags = (node.properties as Partial<TraitDefinitionProperties>)?.tags;
  if (Array.isArray(tags)) {
    for (const tag of tags) if (typeof tag === 'string' && tag.length > 0) refs.push(tag);
  }

  return refs;
}

/**
 * Build the ref → ids index from every `trait` node in the graph.
 *
 * Reads the graph rather than the static content tables on purpose: culture traits
 * are minted at worldgen (`trait.culture.culture_0`), so a table-only index would
 * miss exactly the dynamically-generated definitions that `graphConditions` was
 * widened to match in the first place.
 */
export function buildTraitRefIndex(graph: WorldGraph): TraitRefIndex {
  const index = new Map<string, Set<string>>();

  for (const node of graph.getNodesByType('trait')) {
    for (const ref of traitRefsForNode(node)) {
      let ids = index.get(ref);
      if (!ids) {
        ids = new Set<string>();
        index.set(ref, ids);
      }
      ids.add(node.id);
    }
  }

  return index;
}

/**
 * Trait definition ids a ref resolves to. Empty set ⇒ the ref is unsatisfiable by
 * any trait currently in the graph (what `validateTraitRefs` reports).
 */
export function resolveTraitRefs(index: TraitRefIndex, ref: string): ReadonlySet<string> {
  return index.get(ref) ?? EMPTY_ID_SET;
}

const EMPTY_ID_SET: ReadonlySet<string> = new Set<string>();

// ─── Bearer side ──────────────────────────────────────────────────

/**
 * Every ref by which one bearer's held traits can be named, mapped to the highest
 * assignment level backing that ref.
 *
 * The level is a **max** across the traits sharing a ref, which is what makes
 * ANY-match and `minLevel` compose correctly: a bearer holding `#craft` at level 1
 * via one trait and level 3 via another satisfies `{ traitId: '#craft', minLevel: 3 }`.
 */
export type BearerTraitRefs = ReadonlyMap<string, number>;

/**
 * Walk one bearer's `has_trait` edges and collect every ref form of every trait held,
 * at the level of that assignment.
 *
 * `grantedTraits` is passed in rather than collected here so this module stays free of
 * any `effects/` dependency — `effects/effectQueries` already imports
 * `effects/effectPredicates`, which imports this module's consumers, so importing
 * `collectGrantedTraits` here would close an import cycle. Every call site already
 * has the granted set in hand (the filter pipeline caches it lazily per agent), so
 * threading it costs nothing and keeps the per-tick walk count unchanged.
 *
 * Granted traits enter at `GRANTED_TRAIT_EFFECTIVE_LEVEL` (1) — a `trait_grant`
 * carries no level of its own, so it satisfies a level-bearing gate at that tier and
 * no higher, matching the pre-unification filter-pipeline rule exactly.
 *
 * Fail-soft (NFP #4): a dangling `has_trait` target is skipped; a throwing edge walk
 * yields whatever was collected. A malformed trait must never break a gate.
 */
export function collectBearerTraitRefs(
  graph: TraitGraphView,
  bearerId: string,
  opts?: { grantedTraits?: ReadonlySet<string>; grantedLevel?: number },
): BearerTraitRefs {
  const refs = new Map<string, number>();

  const record = (ref: string, level: number): void => {
    const prior = refs.get(ref);
    if (prior === undefined || level > prior) refs.set(ref, level);
  };

  try {
    for (const edge of graph.getOutgoingEdges(bearerId, 'has_trait')) {
      const node = graph.getNode(edge.target);
      const level = (edge.properties as Partial<TraitAssignmentProperties>)?.level;
      const effectiveLevel = typeof level === 'number' ? level : 1;

      // A dangling target still contributes its id: the edge is the assignment, and
      // an id-form gate must not stop matching just because the definition node was
      // removed. (Pre-unification, the filter pipeline compared `e.target` directly
      // and never dereferenced the node for the id case.)
      record(edge.target, effectiveLevel);
      if (!node) continue;

      for (const ref of traitRefsForNode(node)) record(ref, effectiveLevel);
    }
  } catch {
    // Fall through with the partial map — see fail-soft note above.
  }

  const grantedLevel = opts?.grantedLevel ?? 1;
  if (opts?.grantedTraits) {
    for (const key of opts.grantedTraits) record(key, grantedLevel);
  }

  return refs;
}

/**
 * Test one `TraitPredicate` against a pre-collected bearer ref map.
 *
 * Split from `collectBearerTraitRefs` so a call site testing many predicates against
 * one bearer — the encounter filter pipeline runs every candidate template against
 * every agent every tick — walks the graph once and matches N times, preserving
 * today's cost profile (NFP #7).
 */
export function bearerMatchesPredicate(refs: BearerTraitRefs, pred: TraitPredicate): boolean {
  const level = refs.get(pred.traitId);
  if (level === undefined) return false;
  return pred.minLevel == null || level >= pred.minLevel;
}
