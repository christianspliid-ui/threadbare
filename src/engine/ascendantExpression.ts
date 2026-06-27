/**
 * Ascendant Expression Cards — resolution helpers (THR-508).
 *
 * Generic divine verbs the player-god unlocks early via Ascendant Beats. The
 * verb is universal; the magic it produces is flavored by the ascendant's
 * primary domain + sphere (two-domain lock, THR-503).
 *
 * This module ships `imbue` — the one card from the §4.4 toolkit that composes
 * the already-shipped THR-509 primitives (`pickSphereFlavoredEffect`) and the
 * existing effect-walker (`collectAttachmentEffects` reads `properties.effects`
 * off possessed artifacts) end-to-end, with no new consumer subsystem.
 *
 * `consecrate` / `bestow` / `anoint` are split into their own issues — each
 * needs genuinely-new consumer wiring (location-sustained spawn bridge / agent
 * casting / a `chosen`-status power consumer) that nothing currently provides.
 *
 * Design doc: Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md §4.4
 *
 * NFP compliance:
 *   #1 Tunability: magnitudes live in src/data/ascendant-expression-constants.ts
 *      and the THR-509 SPHERE_EFFECT_TABLE.
 *   #2 Inspectability: emits a structured `ascendant_expression` trace.
 *   #3 Determinism: the only randomness is `pickSphereFlavoredEffect`, fed an
 *      injected seeded PRNG by the caller.
 *   #4 Fail-soft: unknown ascendant / artifact / sphere → no-op + warn, never throw.
 */

import type { WorldGraph } from './graph';
import type { SphereName } from '../types/index';
import type { AttachmentEffect } from '../types/effects';
import type { AscendantProperties } from '../types/influence';
import { pickSphereFlavoredEffect } from './ascendantPrimitives';
import { emitTrace } from './traceBuffer';

/** Trace category for expression-card resolution. Registered in TRACE_CATEGORIES. */
export const ASCENDANT_EXPRESSION_TRACE_CATEGORY = 'ascendant_expression' as const;

/**
 * Read the ascendant's primary sphere from its persisted sphere alignment.
 * Fail-soft: returns undefined when the node is missing or carries no alignment.
 */
export function getAscendantPrimarySphere(
  graph: WorldGraph,
  ascendantId: string,
): SphereName | undefined {
  const node = graph.getNode(ascendantId);
  const props = node?.properties as Partial<AscendantProperties> | undefined;
  return props?.sphereAlignment?.primary;
}

export interface ImbueItemResult {
  readonly success: boolean;
  /** The sphere-flavored effect appended to the artifact (null on no-op). */
  readonly effect: AttachmentEffect | null;
  /** Why the action no-opped, when it did. */
  readonly failSoft?: 'missing_artifact' | 'not_artifact' | 'missing_sphere' | 'no_effect_for_sphere';
}

/**
 * Imbue an artifact with a sphere-flavored power.
 *
 * Reads the ascendant's primary sphere, picks a sphere-flavored effect via the
 * THR-509 `pickSphereFlavoredEffect` primitive, and appends it to the target
 * artifact node's `effects` array. The effect is read by `collectAttachmentEffects`
 * for whichever agent holds the artifact (`possesses` edge), so the imbued power
 * actually applies — no new consumer needed.
 *
 * @param graph        World graph (mutated in place).
 * @param ascendantId  The player-god firing the verb (sphere source).
 * @param artifactId   Target artifact node.
 * @param rng          Injected seeded PRNG (`() => number` in [0,1)) for the pick.
 * @param tick         Current tick (for the trace).
 */
export function applyImbueItem(
  graph: WorldGraph,
  ascendantId: string,
  artifactId: string,
  rng: () => number,
  tick: number,
): ImbueItemResult {
  const artifact = graph.getNode(artifactId);
  if (!artifact) {
    emitNoOp(ascendantId, artifactId, 'missing_artifact', tick);
    return { success: false, effect: null, failSoft: 'missing_artifact' };
  }
  if (artifact.type !== 'artifact') {
    emitNoOp(ascendantId, artifactId, 'not_artifact', tick);
    return { success: false, effect: null, failSoft: 'not_artifact' };
  }

  const sphere = getAscendantPrimarySphere(graph, ascendantId);
  if (!sphere) {
    emitNoOp(ascendantId, artifactId, 'missing_sphere', tick);
    return { success: false, effect: null, failSoft: 'missing_sphere' };
  }

  const effect = pickSphereFlavoredEffect(sphere, rng, tick);
  if (!effect) {
    emitNoOp(ascendantId, artifactId, 'no_effect_for_sphere', tick);
    return { success: false, effect: null, failSoft: 'no_effect_for_sphere' };
  }

  const existing = (artifact.properties.effects as AttachmentEffect[] | undefined) ?? [];
  graph.updateNode(artifactId, {
    properties: { ...artifact.properties, effects: [...existing, effect] },
  });

  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'imbue_item',
    summary: `imbue: ${artifact.name ?? artifactId} gains ${sphere}-flavored power (${describeEffect(effect)})`,
    ascendantId,
    artifactId,
    sphere,
    effect,
  } as never);

  return { success: true, effect };
}

function describeEffect(effect: AttachmentEffect): string {
  if (effect.type === 'passive' && 'reach' in effect) {
    return `+${(effect as { value: number }).value} ${(effect as { reach: string }).reach}`;
  }
  return effect.type;
}

function emitNoOp(
  ascendantId: string,
  artifactId: string,
  reason: NonNullable<ImbueItemResult['failSoft']>,
  tick: number,
): void {
  emitTrace({
    tick,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type: 'imbue_item',
    summary: `imbue no-op: ${reason} (artifact ${artifactId})`,
    ascendantId,
    artifactId,
    failSoft: reason,
  } as never);
}
