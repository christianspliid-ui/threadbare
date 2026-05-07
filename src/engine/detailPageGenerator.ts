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
  DetailPageKind,
  ProseSection,
  Section,
  SectionBase,
} from '../types/detailPage';
import {
  DETAIL_AUTHORED_DEFAULT_TIER,
  DETAIL_FAILSOFT_STUB_SPHERE,
} from '../types/detailPage';
import type { WorldGraph } from './graph';
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

// ─── Cache ────────────────────────────────────────────────────────────────────
//
// Module-scoped per-runtime cache. Per Load-Bearing Decisions, this should
// migrate to SimulationRuntime ownership when a runtime exists. Until then,
// `clearDetailPageCache()` is exposed for test isolation and session resets.

const _detailCache = new Map<string, DetailPage>();
let _lastCachedTick = -Infinity;

/** Reset the detail page cache. Use between test cases or when the world resets. */
export function clearDetailPageCache(): void {
  _detailCache.clear();
  _lastCachedTick = -Infinity;
}

function cacheKey(nodeId: string, pageKind: DetailPageKind, tick: number): string {
  return `${pageKind}:${nodeId}:${tick}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GenerateDetailPageInput {
  /** The node to detail. */
  nodeId: string;
  /** Which page type to render. */
  pageKind: DetailPageKind;
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
  /** Initial breadcrumb root, default ['ENCOUNTER']. */
  breadcrumbRoot?: string[];
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
    breadcrumbRoot = ['ENCOUNTER'],
  } = input;

  // Auto-evict on tick advance.
  if (tick - _lastCachedTick >= DETAIL_PROSE_CACHE_TTL_TICKS) {
    _detailCache.clear();
    _lastCachedTick = tick;
  }

  const key = cacheKey(nodeId, pageKind, tick);
  const cached = _detailCache.get(key);
  if (cached) return cached;

  const node = graph.getNode(nodeId);
  if (!node) {
    return unknownStub(nodeId, pageKind, breadcrumbRoot);
  }

  // Type-check: actor + faction both live on type='actor', dispatch on actorType.
  if (!nodeMatchesKind(node.type, node.properties?.actorType, pageKind)) {
    return unknownStub(nodeId, pageKind, breadcrumbRoot);
  }

  const schema = DETAIL_PAGE_REGISTRY[pageKind];
  const sortedSchema = [...schema].sort((a, b) => a.order - b.order);

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

  const sections: Section[] = [];
  for (const entry of sortedSchema) {
    const resolved = resolveSection(entry, resolverCtx, authored?.sections[entry.typeId], node.name);
    if (resolved) sections.push(resolved);
  }

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
    hasFullSheet: hasFullSheetFor(pageKind, node, protagonistId),
  };

  _detailCache.set(key, page);
  return page;
}

// ─── Section resolution ───────────────────────────────────────────────────────

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
      label: entry.typeId.replace(/_/g, ' ').toUpperCase(),
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
  const baseLabel = authored.label ?? entry.typeId.replace(/_/g, ' ').toUpperCase();
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
  pageKind: DetailPageKind,
  breadcrumbRoot: string[],
): DetailPage {
  return {
    kind: pageKind,
    nodeId,
    trail: [...breadcrumbRoot, 'UNKNOWN'],
    kindLabel: KIND_LABELS[pageKind],
    displayName: 'Unknown',
    subtitle: 'this entity is no longer in the world',
    sphere: DETAIL_FAILSOFT_STUB_SPHERE,
    isShowcase: false,
    sections: [
      {
        kind: 'prose',
        typeId: 'unknown_stub',
        label: 'WHAT WE KNOW',
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
  pageKind: DetailPageKind,
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

function subtitleForNode(
  node: { name: string; properties: Record<string, unknown> },
  pageKind: DetailPageKind,
): string {
  switch (pageKind) {
    case 'actor':
      return (node.properties?.role as string | undefined)
        ?? (node.properties?.narrativeArchetype as string | undefined)
        ?? 'figure of the world';
    case 'item':
      return (node.properties?.category as string | undefined) ?? 'artifact';
    case 'faction':
      return (node.properties?.factionType as string | undefined) ?? 'faction';
    case 'place':
      return (node.properties?.locationSubtype as string | undefined)
        ?? (node.properties?.terrain as string | undefined)
        ?? 'place';
    case 'event':
      return (node.properties?.eventType as string | undefined) ?? 'event';
  }
}

function hasFullSheetFor(
  pageKind: DetailPageKind,
  node: { id: string; properties: Record<string, unknown> },
  protagonistId: string | undefined,
): boolean {
  switch (pageKind) {
    case 'actor':
      // Per plan §4.2: only protagonists/co-protagonists have a "full sheet" CTA.
      return Boolean(
        protagonistId && (node.id === protagonistId || node.properties?.isPortfolioPinned === true),
      );
    case 'item':
    case 'faction':
    case 'place':
    case 'event':
      return true;
  }
}
