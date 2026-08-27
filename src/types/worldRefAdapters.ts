/**
 * Adapters between {@link WorldRef} and the four wire shapes already in the tree.
 *
 * THR-1212 slice 1. `WorldRef` is the normal form; these are the spokes. Nothing here
 * migrates a consumer — every existing shape stays the format its readers already
 * speak, and this module only makes the translation exist and be tested. Migration is
 * chartered per seam (strangler, standing preference).
 *
 * **Every adapter is partial and every adapter fails soft.** Returning `undefined` is
 * the contract, not an error path: a surface that cannot resolve a reference draws
 * plain text and no affordance rather than a dead link (NFP #4, Law 21). The adapters
 * are the single place that knows which kinds route and which render.
 *
 * Plan: `Docs/plans/2026-08-27-shared-anchor-machinery.md`
 */

import type { NavigationTarget } from './notification';
import type { EncounterAftermathConceptRef } from './unifiedAction';
import type { EntityVisualKind } from '../data/entity-visual-fallbacks';
import type { WorldRef, WorldRefKind } from './worldRef';
import { hexRefId, parseHexRefId } from './worldRef';

/**
 * The narrative-segment quadruple, structurally.
 *
 * Declared here rather than imported from `components/Game/encounter-stage/types` on
 * purpose: this is a types module under `src/types/`, and reaching up into a component
 * tree for a shape would invert the dependency direction for every consumer that later
 * imports it. The `entityKind` union is pinned to the segment's own union below so the
 * two cannot drift silently.
 */
export interface NarrativeSegmentRefLike {
  readonly entityId?: string;
  readonly tooltipId?: string;
  readonly entityKind?: 'agent' | 'faction' | 'artifact' | 'companion' | 'attachment' | 'location';
}

/**
 * The `EntityVisualRef` fields an adapter can honestly fill.
 *
 * Structural rather than imported for the same dependency-direction reason as above;
 * `EntityVisualRef` also carries caller-resolved art fields that a reference knows
 * nothing about, and inventing values for them would be worse than omitting them.
 */
export interface EntityVisualRefLike {
  readonly id: string;
  readonly kind?: EntityVisualKind;
  readonly name?: string;
}

/**
 * Kinds `EntityVisualKind` can draw, mapped from `WorldRefKind`.
 *
 * Absent members are deliberate, and each absence is a curated decision the anchor
 * catalog records rather than a gap:
 * - `attachment` — THR-1120: an attachment's art lives on its own template node and
 *   `AttachmentDetailView` draws it. `resolveIcon` skips this kind rather than
 *   resolving a wrong tile, so mapping it here would *create* the bug the union
 *   currently prevents at compile time.
 * - `hex`, `encounter`, `journey`, `receipt`, `codex` — no entity-visual family. A
 *   hex is drawn by the map, not by a tile; the other three are events and documents,
 *   not entities with portraits.
 *
 * `EntityVisualKind` additionally carries `avatar`, `npc-role` and `unknown`, which are
 * render-time refinements rather than referenceable kinds — they are projections *out*
 * of this map, never into it.
 */
const ENTITY_VISUAL_KIND_BY_WORLD_REF_KIND: Partial<Record<WorldRefKind, EntityVisualKind>> = {
  agent: 'agent',
  faction: 'faction',
  location: 'location',
  sublocation: 'sublocation',
  artifact: 'artifact',
  companion: 'companion',
  army: 'army',
};

/**
 * Route a reference to the navigation target that opens its sheet.
 *
 * Partial by design:
 * - `journey` needs an `agentId` the reference does not carry — the caller supplies it
 *   via {@link ToNavigationTargetOptions}, and without it the journey does not route.
 * - `codex` is reserved: no in-game codex destination exists (`?view=codex` tears down
 *   the running simulation), so it returns `undefined` until that surface is chartered.
 * - `sublocation` routes to the location sheet, which is the surface that draws it.
 * - `attachment` and `hex` have no `NavigationTarget` arm; `hex` is deliberately
 *   supported because the union *does* carry one, parsed from the `<col>,<row>` id.
 */
export interface ToNavigationTargetOptions {
  /** Required for a `journey` ref — `NavigationTarget` needs the traveller. */
  readonly agentId?: string;
}

export function toNavigationTarget(
  ref: WorldRef,
  options: ToNavigationTargetOptions = {},
): NavigationTarget | undefined {
  switch (ref.kind) {
    case 'agent':
      return { kind: 'agent', agentId: ref.id };
    case 'faction':
      return { kind: 'faction', factionId: ref.id };
    case 'encounter':
      return { kind: 'encounter', encounterId: ref.id };
    case 'receipt':
      return { kind: 'receipt', receiptId: ref.id };
    // A sublocation's sheet is the location sheet — same arm, same node id.
    case 'location':
    case 'sublocation':
      return { kind: 'location', locationNodeId: ref.id };
    case 'hex': {
      const coords = parseHexRefId(ref.id);
      return coords ? { kind: 'hex', col: coords.col, row: coords.row } : undefined;
    }
    case 'journey':
      return options.agentId
        ? { kind: 'journey', journeyId: ref.id, agentId: options.agentId }
        : undefined;
    // No NavigationTarget arm exists for these, by design (see the doc comment).
    case 'artifact':
    case 'attachment':
    case 'companion':
    case 'army':
    case 'codex':
      return undefined;
  }
}

/**
 * The visual reference that draws this thing's tile, when it has one.
 *
 * `undefined` for every kind absent from {@link ENTITY_VISUAL_KIND_BY_WORLD_REF_KIND} —
 * notably `attachment`, which is a deliberate absence rather than a missing case.
 */
export function toEntityVisualRef(ref: WorldRef): EntityVisualRefLike | undefined {
  const kind = ENTITY_VISUAL_KIND_BY_WORLD_REF_KIND[ref.kind];
  if (!kind) return undefined;
  return { id: ref.id, kind, name: ref.name };
}

/**
 * Read an aftermath chip's concept reference as a `WorldRef`.
 *
 * `undefined` when the chip names a concept with no entity behind it — a trait, a
 * standing, a bare tooltip — which is the common case and not a fault: such a chip
 * carries a tooltip and no link, exactly as Law 21 requires.
 */
export function fromConceptRef(ref: EncounterAftermathConceptRef): WorldRef | undefined {
  if (!ref.entityId || !ref.visualKind) return undefined;
  return {
    kind: ref.visualKind,
    id: ref.entityId,
    name: ref.visualName,
    tooltipId: ref.tooltipId,
  };
}

/**
 * Read a narrative segment's entity reference as a `WorldRef`.
 *
 * **An absent `entityKind` means `agent`** — preserved exactly, and load-bearing:
 * every pre-THR-1004 `entityId` came from the narrative linker's cast scan and was
 * opened through the agent handler, so defaulting to anything else (or to `undefined`)
 * would silently break every segment authored before that field existed.
 */
export function fromNarrativeSegment(segment: NarrativeSegmentRefLike): WorldRef | undefined {
  if (!segment.entityId) return undefined;
  return {
    kind: segment.entityKind ?? 'agent',
    id: segment.entityId,
    tooltipId: segment.tooltipId,
  };
}

/** Build a `hex` reference from coordinates. */
export function hexRef(col: number, row: number): WorldRef {
  return { kind: 'hex', id: hexRefId(col, row) };
}

/**
 * Read a `NavigationTarget` back as a `WorldRef`.
 *
 * Total over the union — every arm has a kind — which is why the reverse direction
 * carries no `undefined`. The `journey` arm drops its `agentId`, since that is routing
 * context rather than part of the journey's identity; `toNavigationTarget` takes it
 * back as an option.
 */
export function fromNavigationTarget(target: NavigationTarget): WorldRef {
  switch (target.kind) {
    case 'agent':
      return { kind: 'agent', id: target.agentId };
    case 'faction':
      return { kind: 'faction', id: target.factionId };
    case 'encounter':
      return { kind: 'encounter', id: target.encounterId };
    case 'receipt':
      return { kind: 'receipt', id: target.receiptId };
    case 'location':
      return { kind: 'location', id: target.locationNodeId };
    case 'journey':
      return { kind: 'journey', id: target.journeyId };
    case 'hex':
      return { kind: 'hex', id: hexRefId(target.col, target.row) };
  }
}
