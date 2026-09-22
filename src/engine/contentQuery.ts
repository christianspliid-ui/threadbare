/**
 * The one content-query resolver (THR-1487, slice 3 of THR-1481).
 *
 * **One resolver, two catalog views, no second predicate.** The failure this module
 * exists to prevent is the one the reward pool already learned about: a gate that
 * reimplements the runtime's matching rule drifts from it, and then green gates guard
 * nothing (`rewardCategoryNodeQuery`'s header says so in as many words). So there is
 * exactly one {@link resolveContentQuery}, and the two things that need it — the running
 * world and the authoring-time gate — differ only in where their *candidates* come from:
 *
 * - {@link graphContentCatalogs} — the live world. Items, conditions, powers and
 *   legendaries are graph nodes, because that is where the reward pool has always read
 *   them and because a world may hold content the catalogs never shipped.
 * - {@link nodeContentCatalogs} — an explicit node list, which is how the authoring gate
 *   asks the runtime's own question over the nodes the world seeds.
 * - `staticContentCatalogs` / `sessionContentCatalogs` in `./contentCatalogView.ts` —
 *   the catalog-backed halves, kept in a separate module because reaching a catalog
 *   means importing all of them, and `src/data/undertaking-objects.ts` calls this
 *   resolver from *inside* that import graph. See that file's header.
 *
 * All of them produce {@link ContentQueryCandidate}s and all are read by the same filter.
 *
 * **The kinds this module can serve.** The four graph-backed ones. A catalog-only kind
 * (encounter, action, undertaking, ambition, omen, card, agreement, companion) resolves
 * empty here and is answered by `sessionContentCatalogs`. Slice 4 is what puts a query on
 * `encounter_seed`; this slice makes the machinery exist and proves it against the one
 * consumer that already ships.
 *
 * **Laziness is the performance story (NFP #7).** A catalog view scans a kind the first
 * time it is asked for and never again. That is what makes it safe for
 * `assembleRewardPool` to build a view per draw — it scans exactly the kinds the recipe
 * names, which is exactly what the pre-change code did — while a long-lived session view
 * on `SimulationRuntime` (`ensureContentCatalogs`) pays the scan once for the debug and
 * CLI levers.
 *
 * **Determinism (NFP #3).** {@link resolveContentQuery} is pure and totally ordered:
 * registry kind order, then id ascending. It takes no PRNG. {@link drawFromContentQuery}
 * is the module's only `rng()` call, and it is the only place
 * {@link CONTENT_QUERY_MAX_CANDIDATES} bites — a *draw* is bounded, a *resolve* is not,
 * because a caller doing its own weighted selection (the reward pool does) must see the
 * whole set or its weights stop summing to what they summed to.
 */
import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type { ContentObjectKindId } from '../data/content-objects';
import { CONTENT_OBJECT_KINDS } from '../data/content-objects';
import { effectiveTags, type ContentCatalogEntry } from '../data/contentEntryTags';
import type { RarityTier } from '../types/rarity';
import type {
  ContentQuery,
  ContentQueryHit,
  ContentQuerySite,
  ContentTierWindow,
} from '../types/contentQuery';
import { emitTrace } from './traceBuffer';
import { LOCATION_CONDITION_ID_PREFIX } from '../data/condition-trait-content';
import { REWARD_EDGE_SOURCE } from '../types/attachments';


// ─── Tunable constants (NFP #1) ─────────────────────────────────────

/**
 * The class word that opts a `condition_template` query *into* a place's conditions
 * (THR-790). A bearer kind, not a `subcategory`: the six shipped location conditions
 * and the four minted ones all carry `subcategory: 'condition'`, and what tells them
 * apart from a mortal's is the id prefix `LOCATION_CONDITION_ID_PREFIX`.
 */
export const LOCATION_BEARER_CLASS = 'location';

/**
 * Cap on the resolved set a **draw** picks from. Inherits the role
 * `FAMILY_SEED_MAX_CANDIDATES` plays for family seeding: past this many candidates the
 * sorted head is kept and `content.query_truncated` fires, so an over-broad query is
 * visible rather than merely slow.
 *
 * Deliberately not applied by {@link resolveContentQuery}. A caller that weights the set
 * itself — `assembleRewardPool` — must see all of it.
 */
export const CONTENT_QUERY_MAX_CANDIDATES = 64;

// ─── Candidates and catalog views ───────────────────────────────────

/**
 * One thing a query could return, flattened to the four fields matching reads.
 *
 * `tags` is the entry's **effective** tags (authored ∪ projected, per the registry's
 * `projections` column) — the plan's projection rule, so an encounter that types
 * `reach: 'iron'` is found by `#iron` without anyone authoring the tag twice.
 */
export interface ContentQueryCandidate {
  readonly kind: ContentObjectKindId;
  readonly id: string;
  /** The class within the kind (`bestowed` / `spell`, `condition` / `scar`), or null. */
  readonly cls: string | null;
  /** The declared tier, or null when the entry does not carry one. */
  readonly tier: RarityTier | null;
  readonly tags: readonly string[];
}

/** A source of candidates, scanned lazily and memoised per kind. */
export interface ContentCatalogs {
  candidates(kind: ContentObjectKindId): readonly ContentQueryCandidate[];
}

/** Registry order, so a multi-kind query's results are grouped the way the registry reads. */
const KIND_ORDER: readonly ContentObjectKindId[] = CONTENT_OBJECT_KINDS.map(k => k.id);

/**
 * How a graph-backed kind is recognised in the world graph.
 *
 * `classes` is the closed set of `subcategory` values that belong to the kind — the
 * discriminator the catalogs themselves use, measured against them (THR-1487): 46
 * condition entries all spell `condition`, 21 bestowed powers all spell `bestowed`, and
 * the spell half of Power is seeded as `subcategory: 'spell'` by `spellDefinitionNode`.
 * `null` means every node of the type belongs, which is the honest answer for items: an
 * item's subcategory names its *form* (`arms`, `vestments`, …), not a class, and the
 * reward pool has always taken all of them.
 */
const GRAPH_BACKED: Readonly<Partial<Record<ContentObjectKindId, {
  readonly nodeType: string;
  readonly classes: readonly string[] | null;
}>>> = {
  item_template: { nodeType: 'artifact', classes: null },
  legendary_template: { nodeType: 'artifact_legendary', classes: null },
  condition_template: { nodeType: 'trait', classes: ['condition', 'scar'] },
  power_template: { nodeType: 'trait', classes: ['bestowed', 'spell'] },
  // THR-1520 — a mortal's own traits, the five classes the trait content files author.
  // `innate`, `destiny` and `experience` are minted, never authored, so they are not a
  // content kind's candidates; a query for "a mastery" finds the seeded definitions.
  trait_template: { nodeType: 'trait', classes: ['core', 'personality', 'mastery', 'reputation', 'cultural'] },
};

function readTier(value: unknown): RarityTier | null {
  return typeof value === 'number' && value >= 1 && value <= 4
    ? (Math.round(value) as RarityTier)
    : null;
}

function readClass(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A graph node as a candidate, reading tags the way the reward pool always has. */
function candidateFromNode(kind: ContentObjectKindId, node: GraphNode): ContentQueryCandidate {
  const props = node.properties as Record<string, unknown>;
  return {
    kind,
    id: node.id,
    cls: readClass(props.subcategory),
    tier: readTier(props.tier),
    // The node is entry-shaped for `effectiveTags` (an `id` plus a property bag), which
    // is why items and conditions can share one tag reader with the template kinds.
    tags: effectiveTags(kind, node as unknown as ContentCatalogEntry),
  };
}

/** Wraps a per-kind scanner in the memoisation every view wants. */
function lazyCatalogs(scan: (kind: ContentObjectKindId) => readonly ContentQueryCandidate[]): ContentCatalogs {
  const memo = new Map<ContentObjectKindId, readonly ContentQueryCandidate[]>();
  return {
    candidates(kind) {
      const cached = memo.get(kind);
      if (cached) return cached;
      const built = scan(kind);
      memo.set(kind, built);
      return built;
    },
  };
}

/** The node-shaped half of a view: carve `nodes` into the kind, by type then class. */
function carveNodes(
  kind: ContentObjectKindId,
  nodes: readonly NodeLike[],
): readonly ContentQueryCandidate[] {
  const shape = GRAPH_BACKED[kind];
  if (!shape) return [];
  const out: ContentQueryCandidate[] = [];
  for (const node of nodes) {
    if (node.type !== shape.nodeType) continue;
    // THR-1520 — a prize `instantiateReward` cloned onto a mortal is a *held thing*, not
    // library content: it wears the template's type and tags, so the by-type scan found
    // it and the pool could deal another mortal a clone of somebody's clone (and, after
    // dedup by template id, deal the *same* mortal their own prize again by that route).
    // The stamp the instantiator writes is the declaration; `rewardPool-dedup.test.ts`
    // carries the pre-fix arm.
    if (node.properties.source === REWARD_EDGE_SOURCE) continue;
    const candidate = candidateFromNode(kind, node as GraphNode);
    if (shape.classes && (candidate.cls === null || !shape.classes.includes(candidate.cls))) continue;
    out.push(candidate);
  }
  return out;
}

/** The minimum a node must be for the carve to read it. Graph nodes and catalog literals both are. */
export interface NodeLike {
  readonly id: string;
  readonly type: string;
  readonly properties: Record<string, unknown>;
}

/**
 * The live world's view — the graph-backed kinds, off the graph.
 *
 * Cheap to construct and cheap to throw away: nothing is scanned until a kind is asked
 * for, which is why `assembleRewardPool` builds one per draw and pays exactly the
 * `getNodesByType` scan it replaced.
 *
 * **A kind that is not graph-backed resolves empty here, on purpose.** Encounters,
 * actions, undertakings, ambitions, omens and cards live in catalogs rather than in the
 * world, and reaching them means importing every catalog in the game — which closed an
 * initialisation cycle through `undertaking-cells` when the condition pool moved onto
 * this resolver (THR-1487). `sessionContentCatalogs` in `contentCatalogView.ts` is the
 * composed view that answers both halves; it is what the debug and CLI levers use, and
 * what slice 4's `encounter_seed` query will use. The engine sites that run *inside* the
 * data layer use this one.
 */
export function graphContentCatalogs(graph: WorldGraph): ContentCatalogs {
  return lazyCatalogs((kind) => {
    const shape = GRAPH_BACKED[kind];
    if (!shape) return [];
    // Ask the graph by type first — the index the graph already keeps — then carve.
    const nodes = graph.getNodesByType(
      shape.nodeType as Parameters<WorldGraph['getNodesByType']>[0],
    ) as unknown as readonly NodeLike[];
    return carveNodes(kind, nodes);
  });
}

/** True when a kind's candidates live in the world graph rather than only in a catalog. */
export function isGraphBackedKind(kind: ContentObjectKindId): boolean {
  return GRAPH_BACKED[kind] !== undefined;
}

/**
 * A view over an explicit node list (THR-1487).
 *
 * What `validateContentQueries` reads. It exists rather than the gate reusing
 * `staticContentCatalogs` because the two universes are genuinely different and
 * the difference matters: the registry's item catalogs include `TREASURE_MAPS`, which
 * `seedAttachments` does not put in the world, so a gate reading the registry would call
 * a recipe live that draws nothing at runtime. The gate therefore names *the nodes the
 * world seeds* and asks the runtime's predicate over them — same rule, right universe.
 *
 * Non-node-backed kinds resolve empty here. That is deliberate and not a hole: the gate
 * only ever asks node-backed questions, because the registry-backed reward categories
 * (agreement, companion) are filtered per bearer and keep their own catalog filters on
 * both the runtime and the gate side.
 */
export function nodeContentCatalogs(nodes: readonly NodeLike[]): ContentCatalogs {
  return lazyCatalogs(kind => carveNodes(kind, nodes));
}

// ─── Resolution (pure, no PRNG) ─────────────────────────────────────

function kindsOf(query: ContentQuery): readonly ContentObjectKindId[] {
  const named = Array.isArray(query.kind) ? query.kind : [query.kind as ContentObjectKindId];
  // Registry order, de-duplicated — a query naming a kind twice must not return it twice.
  return KIND_ORDER.filter(k => named.includes(k));
}

function tierInWindow(tier: RarityTier | null, window: ContentTierWindow | undefined): boolean {
  if (window === undefined) return true;
  // An entry with no declared tier passes every window — `pickConditionTemplate`'s rule
  // since it was written, and the alternative silently drops untiered content.
  if (tier === null) return true;
  if (typeof window === 'number') return tier === window;
  if (window.min !== undefined && tier < window.min) return false;
  if (window.max !== undefined && tier > window.max) return false;
  return true;
}

/**
 * Every narrowing term except `exclude` — split out so a detailed resolve can say which
 * candidates the exclude list removed, rather than folding them into "did not match".
 * `requiresBearerTrait` is deliberately not read here: it is a term about the bearer,
 * judged at the call site (`contentQueryAdmitsBearer`), and a resolver that read it
 * would stop being pure.
 */
function matchesExceptExclude(candidate: ContentQueryCandidate, query: ContentQuery): boolean {
  // THR-790 — the bearer-kind carve. `condition_template` is every `trait` node of
  // class `condition` or `scar`, and that has always included the place's conditions
  // (`trait.condition.location.*`): measured on `main` 2026-09-21, 45 shipped
  // `condition` recipes with no tag filter could deal a mortal *Festival*. The
  // substrate already declares which conditions are a place's — the id prefix is the
  // declaration (THR-1143) — so a `condition_template` query excludes ids under it
  // unless it names the place class, `classes: ['location']`, which is the opt-in
  // path and returns *only* the place's conditions. No new field, no new
  // discriminator; `contentQuery-bearerKind.test.ts` carries the pre-fix arm.
  const wantsPlace = query.classes?.includes(LOCATION_BEARER_CLASS) ?? false;
  if (candidate.kind === 'condition_template') {
    const isPlace = candidate.id.startsWith(LOCATION_CONDITION_ID_PREFIX);
    if (isPlace !== wantsPlace) return false;
  }
  // `location` is a bearer word, not a `subcategory`; it never has to match `cls`.
  const classWords = query.classes?.filter(c => c !== LOCATION_BEARER_CLASS);
  if (classWords && classWords.length > 0) {
    if (candidate.cls === null || !classWords.includes(candidate.cls)) return false;
  }
  // ALL-of. An entry with no tags fails any non-empty filter — the reward pool's rule
  // (`rewardCandidateMatchesTags` returns false for a tagless node), preserved exactly.
  if (query.tags && query.tags.length > 0) {
    if (!query.tags.every(t => candidate.tags.includes(t))) return false;
  }
  if (query.anyTags && query.anyTags.length > 0) {
    if (!query.anyTags.some(t => candidate.tags.includes(t))) return false;
  }
  if (!tierInWindow(candidate.tier, query.tier)) return false;
  return true;
}

function isExcluded(candidate: ContentQueryCandidate, query: ContentQuery): boolean {
  return query.exclude !== undefined && query.exclude.includes(candidate.id);
}

/** A resolve that also names what `exclude` took away (THR-1520). */
export interface ContentQueryResolution {
  readonly hits: readonly ContentQueryHit[];
  /**
   * Candidates that matched every other term and were removed by `exclude` — what the
   * bearer would have been dealt again. Sorted by id within each kind, like `hits`.
   * Empty when the query carries no exclude list.
   */
  readonly excludedIds: readonly string[];
}

/**
 * {@link resolveContentQuery} plus the ids the exclude list removed.
 *
 * Same purity, same order. The reward pool reads this so `content.query_*` can carry
 * the count of what dedup dropped, and `__DEBUG.queryContent` the ids themselves —
 * a dedup that cannot be seen is a dedup that cannot be tuned.
 */
export function resolveContentQueryDetailed(
  query: ContentQuery,
  catalogs: ContentCatalogs,
): ContentQueryResolution {
  const hits: ContentQueryHit[] = [];
  const excludedIds: string[] = [];
  for (const kind of kindsOf(query)) {
    const matched = catalogs.candidates(kind)
      .filter(c => matchesExceptExclude(c, query))
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const c of matched) {
      if (isExcluded(c, query)) excludedIds.push(c.id);
      else hits.push({ kind: c.kind, id: c.id, tier: c.tier });
    }
  }
  return { hits, excludedIds };
}

/**
 * Every candidate a query matches, in a total order: registry kind order, then id
 * ascending.
 *
 * Pure, and deliberately uncapped — see {@link CONTENT_QUERY_MAX_CANDIDATES}. Gates call
 * this; they never draw.
 */
export function resolveContentQuery(
  query: ContentQuery,
  catalogs: ContentCatalogs,
): readonly ContentQueryHit[] {
  // The plain resolve is the detailed one minus the bookkeeping — one predicate, so the
  // two can never disagree about what a query returns.
  return resolveContentQueryDetailed(query, catalogs).hits;
}

/** True when one candidate satisfies every term of the query, `exclude` included. */
export function candidateMatches(candidate: ContentQueryCandidate, query: ContentQuery): boolean {
  return matchesExceptExclude(candidate, query) && !isExcluded(candidate, query);
}

/** True when the query names content that exists. The one predicate every gate asks. */
export function contentQueryHasCandidates(query: ContentQuery, catalogs: ContentCatalogs): boolean {
  return resolveContentQuery(query, catalogs).length > 0;
}

/**
 * One short, stable string naming a query — `query:encounter_template#circle_errand`
 * (THR-1488).
 *
 * It lives here, with the resolver, because three places need to *say* what a query was
 * and they must say it the same way: a seed trace's `resolvedTemplateId` slot, the
 * undertaking write set (where it stands in for a catalyst id in a list of strings), and
 * a gate's failure line. Three local stringifiers would drift, and then a report and a
 * trace about the same query would not be greppable together.
 *
 * Every narrowing field appears, so two queries that differ anywhere describe
 * differently — a describer that dropped `tier` or `exclude` would make a real
 * divergence invisible in exactly the report meant to reveal it.
 */
export function describeContentQuery(query: ContentQuery): string {
  const kinds = Array.isArray(query.kind) ? [...query.kind].join('+') : query.kind;
  const parts = [`query:${kinds}`];
  if (query.classes?.length) parts.push(`:${query.classes.join(',')}`);
  for (const t of query.tags ?? []) parts.push(t);
  if (query.anyTags?.length) parts.push(`(${query.anyTags.join('|')})`);
  if (query.tier !== undefined) {
    parts.push(typeof query.tier === 'number'
      ? `@t${query.tier}`
      : `@t${query.tier.min ?? ''}-${query.tier.max ?? ''}`);
  }
  if (query.exclude?.length) parts.push(`-[${query.exclude.join(',')}]`);
  if (query.requiresBearerTrait) {
    const { traitId, minLevel } = query.requiresBearerTrait;
    parts.push(`?bearer:${traitId}${minLevel !== undefined ? `>=${minLevel}` : ''}`);
  }
  return parts.join('');
}

// ─── The one seeded pick ────────────────────────────────────────────

/**
 * Resolve, cap, and take one — the module's only PRNG call.
 *
 * Uniform over the capped head. A caller wanting *weighted* selection (the reward pool
 * weights by tier curve) resolves and draws itself; this is the plain case, which is
 * what family seeding and catalyst seeding want.
 */
export function drawFromContentQuery(
  query: ContentQuery,
  catalogs: ContentCatalogs,
  rng: () => number,
): ContentQueryHit | undefined {
  const all = resolveContentQuery(query, catalogs);
  if (all.length === 0) return undefined;
  const capped = all.length > CONTENT_QUERY_MAX_CANDIDATES
    ? all.slice(0, CONTENT_QUERY_MAX_CANDIDATES)
    : all;
  return capped[Math.min(capped.length - 1, Math.floor(rng() * capped.length))];
}

// ─── Tracing ────────────────────────────────────────────────────────

/**
 * Record what a query site found. One call, both outcomes — a site that traced only its
 * hits would make an empty query look like a site that never ran, which is the
 * indistinguishability THR-844's rot hid behind for a year.
 */
export function traceContentQuery(params: {
  readonly site: ContentQuerySite;
  readonly query: ContentQuery;
  /**
   * How many candidates the site found.
   *
   * A count rather than the hits themselves, because the reward pool's count is its
   * *weighted pool size* — assembled from the resolved set and then filtered by the tier
   * curve — and passing a synthesised hit array to satisfy a signature is the kind of
   * lie that makes a trace stop meaning what it says.
   */
  readonly candidateCount: number;
  readonly tick: number;
  readonly pickedId?: string;
  readonly actorId?: string;
  readonly templateId?: string;
  /**
   * Where a location-gated site judged the query (THR-1511): the Location whose
   * subtype the `locationSubtypes` filter read, and whether that was the seed's
   * `resolutionLocationId` anchor or the target's own feet. Absent on sites that
   * carry no location gate.
   */
  readonly judgedAtLocationId?: string;
  readonly judgedAt?: 'resolution_anchor' | 'target_location';
  /**
   * How many candidates the query's `exclude` list removed (THR-1520) — what the bearer
   * would otherwise have been dealt again. Zero when the site populates no exclude list;
   * a site that does populate one owes the count, since the trace cannot derive it from
   * the list's length (an excluded id the query would not have matched anyway is not a
   * removal).
   */
  readonly excludedCount?: number;
}): void {
  const { site, query, candidateCount, tick, pickedId, actorId, templateId, judgedAtLocationId, judgedAt } = params;
  const excludedCount = params.excludedCount ?? 0;
  const heldNote = excludedCount > 0 ? ` (${excludedCount} already held)` : '';
  if (candidateCount === 0) {
    emitTrace({
      category: 'content.query_empty',
      tick,
      site,
      query,
      actorId,
      templateId,
      judgedAtLocationId,
      judgedAt,
      excludedCount,
      summary: `${site}: query matched nothing${heldNote}`,
    });
    return;
  }
  emitTrace({
    category: 'content.query_resolved',
    tick,
    site,
    query,
    candidateCount,
    truncated: candidateCount > CONTENT_QUERY_MAX_CANDIDATES,
    pickedId,
    actorId,
    templateId,
    judgedAtLocationId,
    judgedAt,
    excludedCount,
    summary: `${site}: ${candidateCount} candidate${candidateCount === 1 ? '' : 's'}${heldNote}${pickedId ? ` → ${pickedId}` : ''}`,
  });
}
