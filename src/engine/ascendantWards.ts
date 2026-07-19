/**
 * Ascendant Ward Ops — graph-only composed GraphOps (THR-605).
 *
 * Four ascendant-facing verbs that were shipped as narrated no-ops (empty step
 * ops, no engine handling) now get a real, **consumed** world-state effect. Each
 * reuses an existing consumed substrate — no new node types, no new edge types,
 * no new `AttachmentEffect` kinds:
 *
 *   - `attune_artifact`  → appends a deterministic sphere-flavored `AttachmentEffect`
 *                          to the artifact's `properties.effects` (same array the
 *                          effect walker reads for the bearer) + stamps
 *                          `properties.attunedSphere`.
 *   - `curse_artifact`   → appends a per-tick quintessence-drain effect (the
 *                          negative twin of a bestowed regen — `tickResourceManipulate`
 *                          applies it to the bearer) + sets `cursed` / `curseConcealed`.
 *   - `nullify_artifact` → strips `effects` and clears all attune/curse/enchant
 *                          state — the inverse of imbue/enchant/attune/curse.
 *   - `fortify_location` → raises `properties.fortificationMultiplier` toward a
 *                          cap (read by `siegeResolution`; a breach lowers it).
 *
 * All four are pure graph + `GraphOpContext` (actor / target / tick) — they never
 * need full GameState — so they dispatch through the graph executor as cases (the
 * resolution split routes them via `graphOnlyOps` → `executeGraphOps`), the same
 * home the THR-611 essence-source ops chose. Each is fail-soft (NFP #4) and emits
 * a structured `ascendant_expression` trace on both success and no-op (NFP #2),
 * mirroring the imbue / bestow / anoint helpers.
 *
 * Design doc: Docs/plans/2026-07-05-six-noop-ascendant-actions.md
 *
 * NFP compliance:
 *   #1 Tunability: every magnitude/cap is a named constant below.
 *   #2 Inspectability: each op emits a success + fail-soft trace.
 *   #3 Determinism: attune's sphere-effect pick is fed a constant PRNG (`() => 0`)
 *      — deliberate, RNG-free alignment (distinct from imbue's random flavor).
 *   #4 Fail-soft: a missing / wrong-typed target no-ops and resolves as success,
 *      never throws.
 */

import type { WorldGraph } from './graph';
import type { GraphOp, GraphOpContext, GraphOpResult } from '../types/graphOp';
import { resolveRef } from '../types/graphOp';
import type { AttachmentEffect } from '../types/effects';
import { emitTrace } from './traceBuffer';
import { getAscendantPrimarySphere, ASCENDANT_EXPRESSION_TRACE_CATEGORY } from './ascendantExpression';
import { pickSphereFlavoredEffect } from './ascendantPrimitives';
import { getFortificationModifier } from './siegeResolution';

// ─── Constants (NFP #1) ─────────────────────────────────────────────────────

/** Additive bump to a location's `fortificationMultiplier` per fortify. */
export const FORTIFY_MULTIPLIER_BONUS = 0.5;
/** Cap so repeated fortify can't make a site effectively unbesiegeable. */
export const FORTIFY_MULTIPLIER_MAX = 3.0;
/** Per-tick quintessence drained from a cursed artifact's bearer. */
export const CURSE_QUINTESSENCE_DRAIN = 1;

/**
 * A constant PRNG for attune's deliberate, RNG-free alignment: it always selects
 * the first (canonical) sphere-flavored effect for the ascendant's sphere. This
 * is what distinguishes attune (fixed alignment) from imbue (seeded random pick).
 */
const CONSTANT_ZERO_RNG = (): number => 0;

// ─── Shared trace helper ────────────────────────────────────────────────────

type WardOpType = 'attune_artifact' | 'curse_artifact' | 'nullify_artifact' | 'fortify_location';

function emitWard(
  type: WardOpType,
  summary: string,
  fields: Record<string, unknown>,
  tick: number | undefined,
): void {
  emitTrace({
    tick: tick ?? 0,
    category: ASCENDANT_EXPRESSION_TRACE_CATEGORY,
    type,
    summary,
    ...fields,
  } as never);
}

// ─── attune_artifact ────────────────────────────────────────────────────────

/**
 * Attune an artifact to the acting ascendant's primary sphere: append one
 * deterministic sphere-flavored positive `AttachmentEffect` (the same array
 * `imbue_item` writes and the effect walker reads for the bearer) and stamp
 * `properties.attunedSphere`. Deliberate alignment, RNG-free.
 *
 * Fail-soft: missing target / non-artifact / no ascendant sphere / no effect for
 * that sphere → no-op trace, still resolves as success.
 */
export function applyAttuneArtifact(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const artifact = graph.getNode(targetId);
  if (!artifact || artifact.type !== 'artifact') {
    emitWard('attune_artifact', `attune no-op: ${targetId} is not an artifact`, { targetId, failSoft: 'not_artifact' }, ctx.tick);
    return { op, success: true };
  }

  const sphere = getAscendantPrimarySphere(graph, ctx.actorId);
  if (!sphere) {
    emitWard('attune_artifact', `attune no-op: actor ${ctx.actorId} has no primary sphere`, { targetId, failSoft: 'missing_sphere' }, ctx.tick);
    return { op, success: true };
  }

  const effect = pickSphereFlavoredEffect(sphere, CONSTANT_ZERO_RNG, ctx.tick ?? 0);
  if (!effect) {
    emitWard('attune_artifact', `attune no-op: no effect for sphere ${sphere}`, { targetId, sphere, failSoft: 'no_effect_for_sphere' }, ctx.tick);
    return { op, success: true };
  }

  const existing = (artifact.properties.effects as AttachmentEffect[] | undefined) ?? [];
  graph.updateNode(artifact.id, {
    properties: { ...artifact.properties, effects: [...existing, effect], attunedSphere: sphere },
  });

  emitWard('attune_artifact', `attune: ${artifact.name ?? targetId} aligned to ${sphere}`, { targetId, sphere }, ctx.tick);
  return { op, success: true };
}

// ─── curse_artifact ─────────────────────────────────────────────────────────

/**
 * Curse an artifact: append a concealed per-tick quintessence-drain
 * `AttachmentEffect` (the negative twin of the bestow regen — applied to whoever
 * bears it by `tickResourceManipulate`) and set `cursed` / `curseConcealed` so
 * the affliction travels with the object "without their knowledge".
 *
 * Fail-soft: missing target / non-artifact → no-op trace, resolves as success.
 */
export function applyCurseArtifact(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const artifact = graph.getNode(targetId);
  if (!artifact || artifact.type !== 'artifact') {
    emitWard('curse_artifact', `curse no-op: ${targetId} is not an artifact`, { targetId, failSoft: 'not_artifact' }, ctx.tick);
    return { op, success: true };
  }

  const curse: AttachmentEffect = {
    type: 'resource_manipulate',
    resource: 'quintessence',
    target: 'self',
    amount: -CURSE_QUINTESSENCE_DRAIN,
    mode: 'per_tick',
  };
  const existing = (artifact.properties.effects as AttachmentEffect[] | undefined) ?? [];
  graph.updateNode(artifact.id, {
    properties: { ...artifact.properties, effects: [...existing, curse], cursed: true, curseConcealed: true },
  });

  emitWard('curse_artifact', `curse: ${artifact.name ?? targetId} carries a concealed drain (-${CURSE_QUINTESSENCE_DRAIN}/tick quintessence)`, { targetId }, ctx.tick);
  return { op, success: true };
}

// ─── nullify_artifact ───────────────────────────────────────────────────────

/**
 * Nullify an artifact: strip every applied effect and clear all attune / curse /
 * enchant state, reducing it to an inert object. The inverse of
 * imbue / enchant / attune / curse — the bearer loses everything.
 *
 * Fail-soft: missing target / non-artifact → no-op trace, resolves as success.
 * Already-inert artifacts clear nothing and still succeed.
 */
export function applyNullifyArtifact(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const artifact = graph.getNode(targetId);
  if (!artifact || artifact.type !== 'artifact') {
    emitWard('nullify_artifact', `nullify no-op: ${targetId} is not an artifact`, { targetId, failSoft: 'not_artifact' }, ctx.tick);
    return { op, success: true };
  }

  const cleared = ((artifact.properties.effects as AttachmentEffect[] | undefined) ?? []).length;

  // `updateNode` shallow-merges properties, so cleared keys must be set to
  // `undefined` (not omitted) to actually strip the attune/curse/enchant state.
  graph.updateNode(artifact.id, {
    properties: {
      ...artifact.properties,
      effects: [],
      attunedSphere: undefined,
      cursed: undefined,
      curseConcealed: undefined,
      attachmentTier: undefined,
    },
  });

  emitWard(
    'nullify_artifact',
    cleared > 0
      ? `nullify: ${artifact.name ?? targetId} stripped of ${cleared} effect(s)`
      : `nullify: ${artifact.name ?? targetId} was already inert`,
    { targetId, clearedCount: cleared, failSoft: cleared > 0 ? undefined : 'already_inert' },
    ctx.tick,
  );
  return { op, success: true };
}

// ─── fortify_location ───────────────────────────────────────────────────────

/**
 * Fortify a location: raise its `fortificationMultiplier` by `FORTIFY_MULTIPLIER_BONUS`,
 * clamped to `FORTIFY_MULTIPLIER_MAX`. Reads the siege fallback
 * (`getFortificationModifier(locationSubtype)`) as the base when the multiplier
 * is unset, so the first fortify builds on the site's inherent defensibility.
 * Consumed by `siegeResolution` (a breach lowers this same field).
 *
 * Fail-soft: missing target node → no-op trace, resolves as success.
 */
export function applyFortifyLocation(
  graph: WorldGraph,
  op: GraphOp,
  ctx: GraphOpContext,
): GraphOpResult {
  const targetId = resolveRef(op.nodeId ?? op.target ?? '$target', ctx);
  const location = graph.getNode(targetId);
  if (!location) {
    emitWard('fortify_location', `fortify no-op: location ${targetId} not found`, { targetId, failSoft: 'missing_location' }, ctx.tick);
    return { op, success: true };
  }

  const before = (location.properties.fortificationMultiplier as number | undefined)
    ?? getFortificationModifier(location.properties.locationSubtype as string | undefined);
  const after = Math.min(FORTIFY_MULTIPLIER_MAX, before + FORTIFY_MULTIPLIER_BONUS);
  graph.updateNode(location.id, {
    properties: { ...location.properties, fortificationMultiplier: after },
  });

  emitWard('fortify_location', `fortify: ${location.name ?? targetId} defenses ${before.toFixed(2)} → ${after.toFixed(2)}`, { targetId, before, after }, ctx.tick);
  return { op, success: true };
}
