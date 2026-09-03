/**
 * Entity Visual resolver (THR-637) — the single answer to "what image represents
 * this entity?" for every detail surface.
 *
 * One resolver, a per-kind source list, one fallback chain. Surfaces call this
 * instead of re-inventing portrait / concept-art / illustration plumbing. Each
 * THR-638 art batch lands as one added branch in `resolveSource` — zero
 * component changes. All five batches have landed: NPC-role portraits, encounter
 * illustrations (via `ref.knownSrc` from the stage model), faction sigils,
 * artifact category art, sublocation category art. Every `EntityVisualKind` now
 * has a source; the glyph tier is reached only when a kind's own lookup misses.
 *
 * Pure + synchronous. Reads graph nodes; never mutates, never runs in a tick
 * phase, emits no traces (inspectability is served by `__DEBUG.resolveEntityVisual`
 * — a trace per modal render would spam the buffer at UI frequency). Never throws.
 *
 * NFP #3 (determinism): the fallback gradient is chosen by a stable hash of the
 *   entity id; `pickConceptArt` scores deterministically. No `Math.random`.
 * NFP #4 (fail-soft): every failure case falls through to the glyph tier; a
 *   missing node, unknown kind, or absent art all resolve to a designed tile.
 */

import type { WorldGraph } from '../../engine/graph';
import type { GraphNode } from '../../types/graph';
import type { KnowledgeLevel } from '../../types/familiarity';
import { KNOWLEDGE_LEVELS } from '../../types/familiarity';
import type { TerrainType } from '../../types';
import type { SphereInfluence } from '../../engine/hexZoom';
import { getAgentPortraitUrlFromProperties } from '../../data/portrait-assets';
import { getOriginPortraitUrl } from '../../data/avatar-portrait-assets';
import { getFactionSigilUrlFromProperties } from '../../data/faction-sigil-assets';
import { getAttachmentArtUrl } from '../../data/artifact-category-art';
import { pickConceptArt } from '../../data/concept-art-assets';
import { getSublocationArtUrl } from '../../data/sublocation-category-art';
import {
  type EntityVisualKind,
  fallbackGlyphFor,
  gradientIndexForId,
} from '../../data/entity-visual-fallbacks';

export type { EntityVisualKind } from '../../data/entity-visual-fallbacks';

/**
 * Minimum knowledge at which an agent/NPC's curated art renders. Below this the
 * resolver returns the fallback (silhouette) tier even when art exists — hoisting
 * the inline `knowledgeLevel !== 'stranger'` checks the surfaces did by hand into
 * one place. Applies to person kinds ONLY (agent / avatar / npc-role); locations,
 * encounters, and items are never knowledge-gated (intel is additive, never
 * subtractive — THR-138 closed space).
 *
 * `KnowledgeLevel` is an ordinal enum (`KNOWLEDGE_LEVELS` order); there is no
 * numeric knowledge threshold.
 */
export const ENTITY_VISUAL_MIN_KNOWLEDGE: KnowledgeLevel = 'recognised';

/** A reference to the entity whose visual we want. */
export interface EntityVisualRef {
  /** Stable id — graph lookup key AND the gradient hash seed. */
  id: string;
  /**
   * Entity kind. If omitted, derived from the graph node's type/actorType.
   * Provide it explicitly when the entity is not a graph node (e.g. an
   * encounter illustration, an NPC role).
   */
  kind?: EntityVisualKind;
  /** Display name for alt text + the fallback initial. Falls back to node name, then id. */
  name?: string;
  /**
   * Art the caller already resolved (e.g. an encounter stage model's
   * `portraitUrl` / `illustration.src`). Wins over graph lookup — lets
   * graph-free surfaces (EncounterVeil, aftermath) use the primitive.
   */
  knownSrc?: string | null;
}

/** Optional hints the resolver needs for kinds it cannot fully resolve from a node alone. */
export interface ResolveEntityVisualOpts {
  /**
   * Viewer's knowledge of a person entity. Absent ⇒ treated as fully known
   * (fail-open) — a surface that does not gate keeps showing art, unchanged.
   */
  knowledgeLevel?: KnowledgeLevel;
  /** Hex terrain for a location/hex — required for `pickConceptArt` landscape selection. */
  terrain?: TerrainType;
  /** Hex sphere influence for `pickConceptArt` scoring (optional; scoring tolerates null). */
  sphereInfluence?: SphereInfluence | null;
}

/** The resolver's decision: which tier, the chosen source, and the fallback glyph. */
export interface EntityVisualDescriptor {
  tier: 'art' | 'fallback';
  /** Present on the `art` tier. */
  src?: string;
  /** Always present — the fallback glyph, also the `<img>` onError swap target. */
  glyph: string;
  /** Stable gradient index in [0, ENTITY_GRADIENT_COUNT). */
  gradientIndex: number;
  /** Alt text / accessible label. */
  alt: string;
  /** The kind the resolver settled on (after derivation). */
  kind: EntityVisualKind;
}

/** Map a graph node's type + actorType to an EntityVisualKind. */
function deriveKind(node: GraphNode | null): EntityVisualKind {
  if (!node) return 'unknown';
  switch (node.type) {
    case 'actor': {
      const actorType = node.properties?.actorType;
      if (actorType === 'god' || actorType === 'ascendant') return 'avatar';
      if (actorType === 'faction' || actorType === 'culture') return 'faction';
      return 'agent';
    }
    case 'location': {
      const props = node.properties ?? {};
      // A sublocation is a location node parented to another location.
      if (props.sublocationTypeId !== undefined || props.parentLocationId !== undefined) {
        return 'sublocation';
      }
      return 'location';
    }
    case 'artifact':
    case 'artifact_legendary':
      return 'artifact';
    case 'companion':
      return 'companion';
    default:
      return 'unknown';
  }
}

/** True when a person entity's knowledge ranks below the art-render threshold. */
function belowKnowledgeThreshold(level: KnowledgeLevel | undefined): boolean {
  if (level === undefined) return false; // fail-open
  return KNOWLEDGE_LEVELS.indexOf(level) < KNOWLEDGE_LEVELS.indexOf(ENTITY_VISUAL_MIN_KNOWLEDGE);
}

/**
 * Per-kind primary art source. Returns a URL, or null to fall through to the
 * glyph tier. THR-638 registries slot in here — one branch each.
 */
function resolveSource(
  kind: EntityVisualKind,
  node: GraphNode | null,
  opts: ResolveEntityVisualOpts,
): string | null {
  switch (kind) {
    case 'agent':
    case 'npc-role':
      // Bespoke portrait path → archetype portrait (both handled by the helper).
      return getAgentPortraitUrlFromProperties(node?.properties);
    case 'companion':
      // A template may ship a portrait; most do not, and the initials tile is
      // the designed result rather than a gap (THR-1096).
      return getAgentPortraitUrlFromProperties(node?.properties);
    case 'avatar': {
      const props = node?.properties ?? {};
      const bespoke = getAgentPortraitUrlFromProperties(props);
      if (bespoke) return bespoke;
      const originId = props.originFragmentId;
      return typeof originId === 'string' ? getOriginPortraitUrl(originId) : null;
    }
    case 'location':
      // Real 16:9 landscape from the concept-art scorer. Needs terrain; without
      // it (caller passed no hint) fall through to the location glyph tile.
      if (opts.terrain === undefined) return null;
      return pickConceptArt(opts.terrain, node ? [node] : [], opts.sphereInfluence ?? null);
    case 'faction':
      // Procedural heraldry (THR-638), derived from the faction's own reach
      // profile. The node id is required for the property-backed tier — most
      // factions in a live world have no `factionDefId`, so their heraldry is
      // per-node and keys off the id.
      return getFactionSigilUrlFromProperties(node?.properties, node?.id);
    case 'artifact':
      // Bespoke plate for this exact item, else the plate for its category
      // (THR-638). Only ~7 of ~143 artifacts in a live world have bespoke art,
      // so the category tier is what actually renders most of the time.
      return getAttachmentArtUrl(node?.id, node?.properties?.subcategory as string | undefined);
    case 'sublocation': {
      // Category plate keyed by `sublocationTypeId` (THR-638). Every sublocation
      // node in a live world carries that property, which is why it is the key;
      // `genomeTags` rides along as a forward-compatible fallback only — it is
      // populated on 44% of them, so keying off it would blank the rest.
      const props = node?.properties ?? {};
      return getSublocationArtUrl(
        typeof props.sublocationTypeId === 'string' ? props.sublocationTypeId : undefined,
        Array.isArray(props.genomeTags) ? (props.genomeTags as string[]) : undefined,
      );
    }
    // encounter: illustrations arrive via ref.knownSrc from the stage model.
    // Anything else falls to the designed glyph tile.
    default:
      return null;
  }
}

/**
 * Resolve the visual for an entity. See module header for the contract.
 *
 * @param ref    entity reference (id required; kind/name/knownSrc optional)
 * @param graph  world graph for node lookup, or null for graph-free surfaces
 * @param opts   knowledge gate + location hints
 */
export function resolveEntityVisual(
  ref: EntityVisualRef,
  graph: WorldGraph | null | undefined,
  opts: ResolveEntityVisualOpts = {},
): EntityVisualDescriptor {
  const node = graph?.getNode(ref.id) ?? null;
  const kind = ref.kind ?? deriveKind(node);
  const name = ref.name ?? node?.name ?? ref.id;
  const gradientIndex = gradientIndexForId(ref.id);
  const glyph = fallbackGlyphFor(kind, name);
  const alt = name;

  // Caller-provided art wins over graph lookup.
  let src: string | null = ref.knownSrc ?? resolveSource(kind, node, opts);

  // Knowledge gate — person kinds only; never locations/encounters/items.
  const isPerson = kind === 'agent' || kind === 'avatar' || kind === 'npc-role';
  if (isPerson && belowKnowledgeThreshold(opts.knowledgeLevel)) {
    src = null;
  }

  return src
    ? { tier: 'art', src, glyph, gradientIndex, alt, kind }
    : { tier: 'fallback', glyph, gradientIndex, alt, kind };
}
