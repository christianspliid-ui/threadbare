/**
 * Resolve a {@link WorldRef} to a node id in *this* world.
 *
 * THR-1212 slice 1. The runtime half of the shared anchor machinery, and the half the
 * pilot proved matters: **a static type is necessary, never sufficient** (THR-1160).
 * THR-1165 is the proof case — two `$cast:` sentinels passed every compile-time check
 * while resolving to nothing in play, so the caravan they named was never there. A
 * typed seam without a live resolver and a no-op gate is a seam that type-checks and
 * lies.
 *
 * Sentinel resolution delegates to `resolveAnchorDeclaration` rather than
 * reimplementing the grammar. One rule read three times — the Law 56 gate, the chip
 * renderer, and now any `WorldRef` consumer — was THR-1164's explicit design, and a
 * second copy of the sentinel table is precisely the fork it exists to prevent.
 *
 * Plan: `Docs/plans/2026-08-27-shared-anchor-machinery.md`
 */

import type { WorldGraph } from './graph';
import type { WorldRef, WorldRefKind } from '../types/worldRef';
import { parseHexRefId } from '../types/worldRef';
import { resolveAnchorDeclaration } from '../data/content-eval/chipAnchorDeclarations';

export interface WorldRefResolutionContext {
  readonly graph: WorldGraph;
  /** The agent the reference resolved for — what `$actor` means. */
  readonly actorId?: string;
  /** The agent the reference was aimed at — what `$target` means. */
  readonly targetId?: string;
  /** Resolved support bindings, keyed as the template declared them. */
  readonly castNodeIdByKey?: ReadonlyMap<string, string>;
  /** The template id of the encounter being resolved — what `$artifact` searches by. */
  readonly encounterTemplateId?: string;
  /**
   * Where this resolution was attempted, for the drop log. Free-form and
   * developer-facing (`'aftermath-chip'`, `'narrative-segment'`); it never reaches a
   * player surface.
   */
  readonly surface?: string;
  /** Current tick, recorded on a drop so a drop can be placed in the run. */
  readonly tick?: number;
}

/** A resolution that returned nothing, as recorded for {@link getWorldRefDrops}. */
export interface WorldRefDrop {
  readonly refKind: WorldRefKind;
  readonly id: string;
  readonly surface: string;
  readonly tick: number;
}

/**
 * Ring-buffer bound for the drop log.
 *
 * A drop is cheap and can happen on every rendered chip, so the log is capped rather
 * than allowed to grow: this is a debugging aid, not an audit trail. Named per NFP #1
 * so changing how much history is kept is changing a number.
 */
export const WORLDREF_DROP_LOG_MAX = 200;

const dropLog: WorldRefDrop[] = [];

/**
 * Record a resolution that returned nothing.
 *
 * Deliberately *not* a trace-buffer emission: this fires from render-time consumers in
 * the UI layer, and an engine trace per rendered chip would drown the buffer it shares
 * with the tick loop. NFP #2 (inspectability) is served through the debug bridge
 * instead — `window.__DEBUG.getWorldRefDrops()`.
 */
function recordDrop(ref: WorldRef, context: WorldRefResolutionContext): void {
  dropLog.push({
    refKind: ref.kind,
    id: ref.id,
    surface: context.surface ?? 'unknown',
    tick: context.tick ?? -1,
  });
  if (dropLog.length > WORLDREF_DROP_LOG_MAX) {
    dropLog.splice(0, dropLog.length - WORLDREF_DROP_LOG_MAX);
  }
}

/**
 * Every recorded drop, oldest first, capped at {@link WORLDREF_DROP_LOG_MAX}.
 *
 * Returns a copy — a caller that mutated the live buffer would corrupt the very
 * evidence it came to read.
 */
export function getWorldRefDrops(): readonly WorldRefDrop[] {
  return [...dropLog];
}

/** Empty the drop log. For tests and for starting a fresh observation window. */
export function clearWorldRefDrops(): void {
  dropLog.length = 0;
}

/**
 * The node id this reference names in the current world, or `undefined`.
 *
 * Never throws (NFP #4). Every `undefined` is recorded in the drop log, so a surface
 * falling soft to plain text is visible to a developer rather than silent.
 *
 * Two kinds resolve without touching the graph, because their ids are not node ids:
 * `hex` identity is coordinates, and `codex` is reserved with no destination at all.
 */
export function resolveWorldRef(
  ref: WorldRef,
  context: WorldRefResolutionContext,
): string | undefined {
  const resolved = resolveWorldRefInner(ref, context);
  if (resolved === undefined) recordDrop(ref, context);
  return resolved;
}

function resolveWorldRefInner(
  ref: WorldRef,
  context: WorldRefResolutionContext,
): string | undefined {
  // Reserved: nothing to resolve to, and saying so is the point (see WORLD_REF_RESERVED_KINDS).
  if (ref.kind === 'codex') return undefined;

  // A hex names coordinates, not a node. Validate the form and hand it back unchanged
  // so a caller can route it; a malformed id drops rather than routing to hex NaN,NaN.
  if (ref.kind === 'hex') {
    return parseHexRefId(ref.id) ? ref.id : undefined;
  }

  try {
    return resolveAnchorDeclaration(ref.id, {
      graph: context.graph,
      actorId: context.actorId,
      targetId: context.targetId,
      castNodeIdByKey: context.castNodeIdByKey ?? new Map<string, string>(),
      encounterTemplateId: context.encounterTemplateId,
    });
  } catch {
    // The tick loop must never crash on a reference (NFP #4). A resolver that threw
    // would take down whatever surface was drawing, so a throw is a drop.
    return undefined;
  }
}
