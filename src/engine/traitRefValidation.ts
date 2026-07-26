/**
 * validateTraitRefs — dev-only sweep for authored trait refs no trait can satisfy
 * (THR-786, Done-when #2).
 *
 * A trait hook is only as good as the ref it names. A predicate reading
 * `has_trait:negotiator` when no trait definition carries that id, name or tag is
 * silently, permanently false — the exact failure mode the plan's kill criteria call
 * out ("authored hooks referencing traits no producer mints"). Before this sweep
 * existed there was no way to see it: the predicate just returned false forever.
 *
 * ── Why a shape-driven deep walk ───────────────────────────────────────────────
 *
 * Refs are authored across hundreds of content files in six different shapes. Naming
 * every aggregate by hand would rot on the first new content file, so the sweep walks
 * the content namespaces and recognizes refs by *shape* instead:
 *
 * | Surface           | Shape recognized                                        |
 * |-------------------|---------------------------------------------------------|
 * | effect predicates | any string `has_trait:<ref>` / `lacks_trait:<ref>`      |
 * | ambition defs     | `requiredTraits` / `blockingTraits` / `boostingTraits`   |
 * | ambition graph conds | `{ type: 'agent_has_trait' \| 'agent_lacks_trait', trait }` |
 * | spell prereqs     | `prerequisites.requiredTraits[]`                        |
 * | item grants       | `{ type: 'trait_grant', grantedTrait }`                  |
 * | template gates    | `requiredTraits[].traitId` / `blockedByTraits[]`, `traitVariants[].traitId`, `StepNudge.requiredTrait` |
 *
 * A new content file authoring any of those shapes is swept the moment it is imported
 * by one of the namespaces below — no registration step to forget.
 */
import type { WorldGraph } from './graph';
import { buildTraitRefIndex, resolveTraitRefs } from './traitRefIndex';
import type { TraitRefIndex } from './traitRefIndex';

/** One authored ref that resolves to no trait definition. */
export interface DeadTraitRef {
  /** The ref as authored. */
  ref: string;
  /** Which authored shape it came from. */
  surface: TraitRefSurface;
  /** Best-effort path to the authoring site, e.g. `CHOICE_SET_MERCY_TEST.options[1]`. */
  path: string;
}

export type TraitRefSurface =
  | 'effect_predicate'
  | 'ambition_traits'
  | 'ambition_graph_condition'
  | 'spell_prerequisite'
  | 'item_grant'
  | 'template_gate';

export interface TraitRefValidationReport {
  /** Refs satisfiable by some trait definition or item grant. */
  resolved: number;
  /**
   * Distinct refs nothing can satisfy — no trait definition carries them and no item
   * grants them as a key. Each is a gate that can never pass.
   */
  dead: DeadTraitRef[];
  /**
   * Grant keys that back a gate but have no trait definition behind them
   * ("phantom traits", THR-737 shape).
   *
   * Not counted as dead: the grant→gate loop closes on the bare key, so the gate
   * *does* pass for a bearer holding the item. But the trait has no definition, so it
   * has no display name, no visibility, no `domainContributions` and cannot be shown
   * on the bearer's sheet — which the trait canon's "always visible once known" rule
   * will require. Reported separately so the two severities are not conflated.
   */
  phantomGrants: Array<{ ref: string; path: string }>;
  /** Refs resolving to >1 definition. Informational: ANY-match makes this legal. */
  highFanout: Array<{ ref: string; ids: string[] }>;
  /** Per-surface counts of refs seen, so a surface sweeping zero refs is visible. */
  perSurface: Record<TraitRefSurface, number>;
  /** Trait definition nodes present in the graph when the sweep ran. */
  traitDefinitions: number;
}

const PREDICATE_RE = /^(?:has|lacks)_trait:(.+)$/;

/** Bounds the walk against a cyclic or pathologically deep content object. */
const MAX_WALK_DEPTH = 12;

interface Collected {
  ref: string;
  surface: TraitRefSurface;
  path: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Recursively collect every trait ref in an authored content value.
 *
 * Fail-soft (NFP #4): a shape that does not match is skipped, never thrown on. A dev
 * sweep that crashes on one malformed payload reports nothing about the other five
 * surfaces, which is strictly worse than reporting what it could read.
 */
function collectRefs(
  value: unknown,
  path: string,
  out: Collected[],
  depth = 0,
  seen = new Set<unknown>(),
): void {
  if (depth > MAX_WALK_DEPTH) return;

  if (typeof value === 'string') {
    const m = PREDICATE_RE.exec(value);
    if (m) out.push({ ref: m[1], surface: 'effect_predicate', path });
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) collectRefs(value[i], `${path}[${i}]`, out, depth + 1, seen);
    return;
  }

  if (!isRecord(value)) return;
  if (seen.has(value)) return;
  seen.add(value);

  // ── Shaped surfaces, recognized before the generic descent ──

  const type = value.type;

  if (type === 'trait_grant' && typeof value.grantedTrait === 'string') {
    out.push({ ref: value.grantedTrait, surface: 'item_grant', path: `${path}.grantedTrait` });
  }

  if ((type === 'agent_has_trait' || type === 'agent_lacks_trait') && typeof value.trait === 'string') {
    out.push({ ref: value.trait, surface: 'ambition_graph_condition', path: `${path}.trait` });
  }

  for (const key of ['blockingTraits', 'boostingTraits'] as const) {
    const list = value[key];
    if (Array.isArray(list)) {
      list.forEach((r, i) => {
        if (typeof r === 'string') {
          out.push({ ref: r, surface: 'ambition_traits', path: `${path}.${key}[${i}]` });
        }
      });
    }
  }

  // `requiredTraits` is the collision point (Done-when #3): ambition and spell
  // authors write bare strings, `UnifiedActionTemplate` writes TraitPredicate objects.
  // Both are accepted here and attributed to the surface their element shape implies.
  const required = value.requiredTraits;
  if (Array.isArray(required)) {
    const spellish = isRecord(value.prerequisites) || path.includes('prerequisites');
    required.forEach((r, i) => {
      const p = `${path}.requiredTraits[${i}]`;
      if (typeof r === 'string') {
        out.push({
          ref: r,
          surface: spellish ? 'spell_prerequisite' : 'ambition_traits',
          path: p,
        });
      } else if (isRecord(r) && typeof r.traitId === 'string') {
        out.push({ ref: r.traitId, surface: 'template_gate', path: `${p}.traitId` });
      }
    });
  }

  const blockedBy = value.blockedByTraits;
  if (Array.isArray(blockedBy)) {
    blockedBy.forEach((r, i) => {
      if (typeof r === 'string') {
        out.push({ ref: r, surface: 'template_gate', path: `${path}.blockedByTraits[${i}]` });
      } else if (isRecord(r) && typeof r.traitId === 'string') {
        out.push({ ref: r.traitId, surface: 'template_gate', path: `${path}.blockedByTraits[${i}].traitId` });
      }
    });
  }

  // WS0 (THR-773) template-level trait hooks — declared and shipped.
  if (Array.isArray(value.traitVariants)) {
    value.traitVariants.forEach((v, i) => {
      if (isRecord(v) && typeof v.traitId === 'string') {
        out.push({ ref: v.traitId, surface: 'template_gate', path: `${path}.traitVariants[${i}].traitId` });
      }
    });
  }
  if (typeof value.requiredTrait === 'string') {
    out.push({ ref: value.requiredTrait, surface: 'template_gate', path: `${path}.requiredTrait` });
  }

  for (const [k, v] of Object.entries(value)) {
    collectRefs(v, `${path}.${k}`, out, depth + 1, seen);
  }
}

/**
 * Content namespaces swept. Each is a whole module namespace object, so any ref-shaped
 * field in any export is reached without listing exports one by one.
 *
 * Dynamic `import()` keeps this module out of the production graph: nothing here is
 * reachable unless `validateTraitRefs` is actually called from the debug bridge.
 */
async function loadContentSurfaces(): Promise<Array<[string, unknown]>> {
  const loaders: Array<[string, () => Promise<unknown>]> = [
    ['choice-set-catalog', () => import('../data/choice-set-catalog')],
    ['ambition-templates', () => import('../data/ambition-templates')],
    ['artifact-templates', () => import('../data/artifact-templates')],
    ['anomaly-reward-catalog', () => import('../data/anomaly-reward-catalog')],
    ['reward-attachment-catalog', () => import('../data/reward-attachment-catalog')],
    ['starter-attachments', () => import('../data/starter-attachments')],
    ['unified-action-templates', () => import('../data/unified-action-templates')],
    ['trait-modifiers', () => import('../data/trait-modifiers')],
  ];

  const loaded = await Promise.all(
    loaders.map(async ([name, load]): Promise<[string, unknown] | null> => {
      try {
        return [name, await load()];
      } catch (err) {
        console.warn(`[validateTraitRefs] could not load "${name}"; skipping`, err);
        return null;
      }
    }),
  );

  return loaded.filter((entry): entry is [string, unknown] => entry !== null);
}

/**
 * Sweep every authored trait ref against the trait definitions in `graph`.
 *
 * `index` may be supplied by the caller (the `SimulationRuntime`-owned one); omitted,
 * a throwaway index is built for this sweep. Either way nothing is cached at module
 * scope.
 */
export async function validateTraitRefs(
  graph: WorldGraph,
  index?: TraitRefIndex,
): Promise<TraitRefValidationReport> {
  const refIndex = index ?? buildTraitRefIndex(graph);

  const collected: Collected[] = [];
  for (const [name, mod] of await loadContentSurfaces()) {
    try {
      collectRefs(mod, name, collected);
    } catch (err) {
      console.warn(`[validateTraitRefs] sweep of "${name}" failed; continuing`, err);
    }
  }

  const perSurface: Record<TraitRefSurface, number> = {
    effect_predicate: 0,
    ambition_traits: 0,
    ambition_graph_condition: 0,
    spell_prerequisite: 0,
    item_grant: 0,
    template_gate: 0,
  };

  // An item grant is a second source of satisfaction: `collectGrantedTraits` returns
  // the bare key and every consumer unions it into the bearer's ref set, so a gate
  // naming a granted key passes even with no trait definition behind it. Collect the
  // grant keys first so gates they back are not misreported as dead.
  const grantKeys = new Set(collected.filter(c => c.surface === 'item_grant').map(c => c.ref));

  // Dedupe on ref+surface so one ref authored 40 times reports once per surface,
  // keeping the report readable while still naming a representative site.
  const deadByKey = new Map<string, DeadTraitRef>();
  const phantomByRef = new Map<string, { ref: string; path: string }>();
  const resolvedRefs = new Set<string>();
  const fanout = new Map<string, string[]>();

  for (const c of collected) {
    perSurface[c.surface]++;
    const ids = resolveTraitRefs(refIndex, c.ref);

    if (ids.size > 0) {
      resolvedRefs.add(c.ref);
      if (ids.size > 1) fanout.set(c.ref, [...ids]);
      continue;
    }

    // No definition. A grant declaration itself is a phantom trait; anything else
    // naming a granted key is satisfiable through that grant.
    if (c.surface === 'item_grant') {
      if (!phantomByRef.has(c.ref)) phantomByRef.set(c.ref, { ref: c.ref, path: c.path });
      resolvedRefs.add(c.ref);
      continue;
    }
    if (grantKeys.has(c.ref)) {
      resolvedRefs.add(c.ref);
      continue;
    }

    const key = `${c.surface}|${c.ref}`;
    if (!deadByKey.has(key)) deadByKey.set(key, { ref: c.ref, surface: c.surface, path: c.path });
  }

  return {
    resolved: resolvedRefs.size,
    dead: [...deadByKey.values()].sort((a, b) => a.ref.localeCompare(b.ref)),
    phantomGrants: [...phantomByRef.values()].sort((a, b) => a.ref.localeCompare(b.ref)),
    highFanout: [...fanout.entries()].map(([ref, ids]) => ({ ref, ids })),
    perSurface,
    traitDefinitions: graph.getNodesByType('trait').length,
  };
}
