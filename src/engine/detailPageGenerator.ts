/**
 * Detail page generator — entry point that produces a fully resolved DetailPage
 * for the UI to render.
 *
 * Design doc: Docs/plans/2026-05-06-detail-page-data-model.md §4.2
 *
 * The UI calls `generateDetailPage(nodeId, pageKind, ctx)` synchronously when a
 * modal opens. The function is pure + cached, so opens are instant after the
 * first call on a given tick.
 *
 * Fail-soft: a missing nodeId, mismatched type, or empty section list returns
 * the unknown-entity stub. The modal never throws and never blanks.
 */

import type {
  DetailPage,
  GraphPageKind,
  PageLayoutKind,
  ProseSection,
  Section,
  SectionBase,
} from '../types/detailPage';
import type { GameState } from '../types/gameState';
import {
  DETAIL_AUTHORED_DEFAULT_TIER,
  DETAIL_FAILSOFT_STUB_SPHERE,
} from '../types/detailPage';
import type { WorldGraph } from './graph';
import { fromGraphNode } from '../types/worldRefAdapters';
import type { SimulationRuntime } from './simulationRuntime';
import {
  DETAIL_PAGE_REGISTRY,
  DETAIL_PROSE_CACHE_TTL_TICKS,
  KIND_LABELS,
  type SectionSchemaEntry,
} from '../data/detailPageTemplates';
import {
  fillPlaceholders,
  type SectionResolverContext,
} from './detailPageResolvers';
import {
  getShowcaseAuthoring,
  type AuthoredSection,
} from '../data/detail-page-showcase';
import { UNKNOWN_ENTITY_PROSE } from '../data/detail-page-fallback-templates';
import { getArchetype } from '../data/archetype-content';
import { humanizeKeySegment } from './aftermathWords';

// ─── Cache ────────────────────────────────────────────────────────────────────
//
// THR-577: cache ownership lives on `SimulationRuntime` (per the load-bearing
// decision "engine caches must be owned per session, not stored at module scope").
// Callers thread `runtime` through `GenerateDetailPageInput`; when it is absent
// (tests, isolated previews) the page is composed fresh without caching. Session
// reset clears it via `resetRuntimeCaches()`.

function cacheKey(nodeId: string, pageKind: GraphPageKind, tick: number): string {
  return `${pageKind}:${nodeId}:${tick}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GenerateDetailPageInput {
  /** The node to detail. */
  nodeId: string;
  /** Which page type to render. */
  pageKind: GraphPageKind;
  /** World graph (read-only). */
  graph: WorldGraph;
  /** Current tick. Drives cache invalidation. */
  tick: number;
  /** World seed for deterministic PRNG. */
  seed: number;
  /** Protagonist nodeId for "to her" / "toward him" framings. */
  protagonistId?: string;
  /** Active encounter context (drives "tilts this scene" / callbacks). */
  encounterContext?: SectionResolverContext['encounterContext'];
  /** Initial breadcrumb root, default ['Encounter']. */
  breadcrumbRoot?: string[];
  /**
   * Session runtime that owns the per-session detail-page cache (THR-577). When
   * present, same-tick re-opens return the cached page; when absent, the page is
   * composed fresh (no cross-session bleed).
   */
  runtime?: SimulationRuntime | null;
}

/**
 * Build a fully resolved DetailPage for the given node + kind.
 *
 * Cached per-tick. Returns the unknown-entity stub when the node is missing
 * or mismatches the requested kind.
 */
export function generateDetailPage(input: GenerateDetailPageInput): DetailPage {
  const {
    nodeId,
    pageKind,
    graph,
    tick,
    seed,
    protagonistId,
    encounterContext,
    breadcrumbRoot = ['Encounter'],
    runtime,
  } = input;

  const cache = runtime?.detailPageCache ?? null;

  // Auto-evict on tick advance (TTL). Runtime-owned so it never bleeds across sessions.
  if (cache && runtime && tick - runtime.detailPageCacheTick >= DETAIL_PROSE_CACHE_TTL_TICKS) {
    cache.clear();
    runtime.detailPageCacheTick = tick;
  }

  const key = cacheKey(nodeId, pageKind, tick);
  if (cache) {
    const cached = cache.get(key);
    if (cached) return cached;
  }

  const node = graph.getNode(nodeId);
  if (!node) {
    return unknownStub(nodeId, pageKind, breadcrumbRoot);
  }

  // Type-check: actor + faction both live on type='actor', dispatch on actorType.
  if (!nodeMatchesKind(node.type, node.properties?.actorType, pageKind)) {
    return unknownStub(nodeId, pageKind, breadcrumbRoot);
  }

  const isShowcase = node.properties?.showcase === true;
  const showcaseTemplateId = node.properties?.showcaseTemplate as string | undefined;
  const authored = isShowcase ? getShowcaseAuthoring(nodeId, showcaseTemplateId) : undefined;

  const resolverCtx: SectionResolverContext = {
    nodeId,
    pageKind,
    graph,
    seed,
    tick,
    protagonistId,
    encounterContext,
  };

  const sections = composeSections(pageKind, resolverCtx, authored?.sections, node.name);

  // If no mandatory section resolved at all, replace with the stub. Per the
  // fallback table, mandatory rows always have a fallbackResolver, but defend
  // against future schema edits that drop one.
  if (sections.length === 0) {
    return unknownStub(nodeId, pageKind, breadcrumbRoot);
  }

  // Compose header.
  const sphere = sphereForNode(node);
  const subtitle = subtitleForNode(node, pageKind);
  const kindLabel = KIND_LABELS[pageKind];
  // THR-1851 — the CTA carries its own address, and is offered only where one exists.
  const sheetRef = hasFullSheetFor(pageKind, node, protagonistId) ? fromGraphNode(node) : undefined;

  const page: DetailPage = {
    kind: pageKind,
    nodeId,
    trail: [...breadcrumbRoot, node.name],
    kindLabel,
    displayName: node.name,
    subtitle,
    sphere,
    isShowcase,
    sections,
    hasFullSheet: sheetRef !== undefined,
    ...(sheetRef ? { sheetRef } : {}),
  };

  if (cache) cache.set(key, page);
  return page;
}

// ─── Section resolution ───────────────────────────────────────────────────────

/**
 * Resolve one page kind's rows, in table order (THR-1876 § D6) — the loop every page
 * generator shares: `generateDetailPage`, `generateContentPage`, and the land, god and
 * record pages below. Each section carries its row's `visibleAt` and `tab`; the producer
 * never drops a section by width (each surface filters with `sectionVisibleAt`).
 */
export function composeSections(
  kind: PageLayoutKind,
  ctx: SectionResolverContext,
  authored?: Partial<Record<string, AuthoredSection>>,
  nodeName = '',
): Section[] {
  const schema = DETAIL_PAGE_REGISTRY[kind] ?? [];
  const sorted = [...schema].sort((a, b) => a.order - b.order);
  const sections: Section[] = [];
  for (const entry of sorted) {
    let resolved: Section | null = null;
    try {
      resolved = resolveSection(entry, ctx, authored?.[entry.typeId], nodeName);
    } catch {
      // Fail-soft (NFP #4): a resolver that throws skips its section, it never blanks the page.
      resolved = null;
    }
    if (resolved) sections.push(stampRow(resolved, entry));
  }
  return sections;
}

/** Copy a row's width, tab, icon and placement onto its section — only when the row declares them. */
function stampRow(section: Section, entry: SectionSchemaEntry): Section {
  if (!entry.visibleAt && !entry.tab && !entry.icon && !entry.placement) return section;
  return {
    ...section,
    ...(entry.visibleAt ? { visibleAt: entry.visibleAt } : {}),
    ...(entry.tab ? { tab: entry.tab } : {}),
    // THR-2097: a resolver's more specific idea (the ambition's own) wins over the row's.
    ...(entry.icon && !section.icon ? { icon: entry.icon } : {}),
    ...(entry.placement ? { placement: entry.placement } : {}),
  };
}

/** A page of a kind with no single node: its kind and its sections (THR-1876 § D6). */
export interface ComposedPage {
  kind: PageLayoutKind;
  sections: Section[];
}

/** The land page's body — HexChronicle's prose, moved (§ D7.3). Empty without a tile. */
export function generateLandPage(input: { state: GameState; col: number; row: number }): ComposedPage {
  const { state, col, row } = input;
  return {
    kind: 'land',
    sections: composeSections('land', {
      nodeId: `${col},${row}`,
      pageKind: 'land',
      graph: state.graph,
      seed: state.seed,
      tick: state.tick,
      state,
      hex: { col, row },
    }),
  };
}

/** The god's own page body — rows over the god rail's selectors (§ D7.9). */
export function generateGodPage(input: { state: GameState }): ComposedPage {
  const { state } = input;
  return {
    kind: 'god',
    sections: composeSections('god', {
      nodeId: state.ascendantId,
      pageKind: 'god',
      graph: state.graph,
      seed: state.seed,
      tick: state.tick,
      state,
    }),
  };
}

/**
 * A record's body (§ D7.8). A graph event node reads the `event` rows; an encounter,
 * journey or receipt reads the `record` rows over its store.
 */
export function generateRecordPage(input: {
  state: GameState;
  eventNodeId?: string;
  record?: { kind: 'encounter' | 'journey' | 'receipt'; id: string; name?: string };
}): ComposedPage {
  const { state, eventNodeId, record } = input;
  if (eventNodeId) {
    return {
      kind: 'record',
      sections: composeSections('event', {
        nodeId: eventNodeId,
        pageKind: 'event',
        graph: state.graph,
        seed: state.seed,
        tick: state.tick,
        protagonistId: state.ascendantId,
        state,
      }),
    };
  }
  return {
    kind: 'record',
    sections: composeSections('record', {
      nodeId: record?.id ?? '',
      pageKind: 'record',
      graph: state.graph,
      seed: state.seed,
      tick: state.tick,
      state,
      record,
    }),
  };
}

function resolveSection(
  entry: SectionSchemaEntry,
  ctx: SectionResolverContext,
  authored: AuthoredSection | undefined,
  nodeName: string,
): Section | null {
  // 1) Authored override path (only when schema marks this row overridable).
  if (entry.showcaseOverridable && authored) {
    const fromAuthored = sectionFromAuthored(entry, authored, nodeName);
    if (fromAuthored) return fromAuthored;
  }

  // 2) Default resolver.
  const fromDefault = entry.defaultResolver(ctx);
  if (fromDefault) return fromDefault;

  // 3) Fallback resolver.
  if (entry.fallbackResolver) {
    const fromFallback = entry.fallbackResolver(ctx);
    if (fromFallback) return fromFallback;
  }

  // 4) Mandatory rows still empty: synthesize a tier-routine ellipsis prose.
  if (entry.mandatory) {
    const stub: ProseSection = {
      kind: 'prose',
      typeId: entry.typeId,
      label: sectionLabelFromTypeId(entry.typeId),
      gold: false,
      tier: 'routine',
      source: 'mandatoryStub',
      prose: '…',
    };
    return stub;
  }

  return null;
}

/**
 * Convert an `AuthoredSection` override into the right typed Section variant.
 * Authoring drives the prose/chips fields; the kind is dictated by the
 * resolver-pair at this entry — we fall through to default if shape is wrong.
 */
function sectionFromAuthored(
  entry: SectionSchemaEntry,
  authored: AuthoredSection,
  nodeName: string,
): Section | null {
  const baseTier = authored.tier ?? DETAIL_AUTHORED_DEFAULT_TIER;
  const baseLabel = authored.label ?? sectionLabelFromTypeId(entry.typeId);
  const gold = authored.gold ?? false;

  const base: SectionBase = {
    label: baseLabel,
    gold,
    tier: baseTier,
    typeId: entry.typeId,
    source: `authored.${entry.typeId}`,
  };

  if (authored.prose) {
    const prose = fillPlaceholders(authored.prose, { name: nodeName, Name: nodeName });
    const proseSection: ProseSection = { ...base, kind: 'prose', prose };
    return proseSection;
  }

  if (authored.chips) {
    return { ...base, kind: 'chips', chips: authored.chips };
  }

  return null;
}

// ─── Stub & headers ───────────────────────────────────────────────────────────

function unknownStub(
  nodeId: string,
  pageKind: GraphPageKind,
  breadcrumbRoot: string[],
): DetailPage {
  return {
    kind: pageKind,
    nodeId,
    trail: [...breadcrumbRoot, 'Unknown'],
    kindLabel: KIND_LABELS[pageKind],
    displayName: 'Unknown',
    subtitle: 'this entity is no longer in the world',
    sphere: DETAIL_FAILSOFT_STUB_SPHERE,
    isShowcase: false,
    sections: [
      {
        kind: 'prose',
        typeId: 'unknown_stub',
        label: 'What we know',
        gold: false,
        tier: 'routine',
        source: 'unknownStubResolver',
        prose: UNKNOWN_ENTITY_PROSE,
      },
    ],
    hasFullSheet: false,
  };
}

function nodeMatchesKind(
  nodeType: string,
  actorType: unknown,
  pageKind: GraphPageKind,
): boolean {
  switch (pageKind) {
    case 'actor':
      return nodeType === 'actor' && actorType !== 'faction';
    case 'faction':
      return nodeType === 'actor' && actorType === 'faction';
    case 'item':
      return nodeType === 'artifact' || nodeType === 'artifact_legendary';
    case 'place':
      return nodeType === 'location' || nodeType === 'region';
    case 'event':
      return nodeType === 'event';
    // THR-1490 — a group is an `actor` node like a person and a faction, told apart by
    // `actorType: 'group'` (see `engine/groupShape.ts`). The actor arm above excludes
    // only factions, so without this arm an army would resolve as an `actor` page and be
    // asked for a portrait and a disposition that a column of soldiers does not have.
    case 'group':
      return nodeType === 'actor' && actorType === 'group';
    default:
      return false;
  }
}

function sphereForNode(node: { properties: Record<string, unknown> }): string {
  const influence = node.properties?.sphereInfluence as Record<string, number> | undefined;
  if (influence) {
    let best = 'force';
    let max = -Infinity;
    for (const [k, v] of Object.entries(influence)) {
      if (v > max) {
        max = v;
        best = k;
      }
    }
    return best;
  }
  return (node.properties?.sphere as string | undefined) ?? 'force';
}

/**
 * THR-1797: every subtitle source is a stored key (`true_believer`, `trade_guild`,
 * `river_ford`), so each one is worded before it reaches the card — the header
 * renders upper-case, and an unworded key read as `TRUE_BELIEVER`. A narrative
 * archetype takes its authored name; anything else is humanised. Empty or
 * non-string values fall through to the kind's default word.
 */
function wordedKey(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const worded = humanizeKeySegment(raw).replace(/\s+/g, ' ').toLowerCase();
  return worded.length > 0 ? worded : undefined;
}

function wordedArchetype(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  return getArchetype(raw)?.name ?? wordedKey(raw);
}

/** A section type id as its fallback label, sentence case: `recent_events` → "Recent events". */
function sectionLabelFromTypeId(typeId: string): string {
  const words = typeId.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function subtitleForNode(
  node: { name: string; properties: Record<string, unknown> },
  pageKind: GraphPageKind,
): string {
  const p = node.properties ?? {};
  switch (pageKind) {
    case 'actor':
      return wordedKey(p.role) ?? wordedArchetype(p.narrativeArchetype) ?? 'figure of the world';
    case 'item':
      return wordedKey(p.category) ?? 'artifact';
    case 'faction':
      return wordedKey(p.factionType) ?? 'faction';
    case 'place':
      return wordedKey(p.locationSubtype) ?? wordedKey(p.terrain) ?? 'place';
    case 'event':
      return wordedKey(p.eventType) ?? 'event';
    case 'group':
      // The group kind is the subtitle: a Host reads differently from a Network.
      return wordedKey(p.groupKind) ?? 'company';
  }
}

function hasFullSheetFor(
  pageKind: GraphPageKind,
  node: { id: string; properties: Record<string, unknown> },
  protagonistId: string | undefined,
): boolean {
  switch (pageKind) {
    case 'actor':
      // Per plan §4.2 the protagonists/co-protagonists have a "full sheet" CTA. THR-1851
      // widened it to every mortal individual — a ruler or notable reached from the
      // Notables list had a card with no way onward to the profile drawer.
      return Boolean(
        (protagonistId && (node.id === protagonistId || node.properties?.isPortfolioPinned === true)) ||
          node.properties?.actorType === 'individual',
      );
    case 'item':
    case 'faction':
    case 'place':
    case 'group':
      return true;
    // THR-1851 — no sheet exists for an event card (the router's encounter arm is
    // unwired), so a CTA there could only re-open the card it sits on.
    case 'event':
      return false;
  }
}
