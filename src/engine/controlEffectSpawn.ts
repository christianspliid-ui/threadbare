/**
 * Control Effect Spawning — create ControlEffect instances from successful
 * sustained unified actions.
 *
 * Two-object lifecycle bridge:
 *   Phase 1 (Establishment): UnifiedAction resolves successfully
 *   Phase 2 (Persistence): ControlEffect spawned here, ticked by phaseControlEffects
 *
 * NFP compliance:
 *   #1 Tunability: no magic numbers — all values come from ControlSpec
 *   #2 Inspectability: emits ControlEffectEstablishedTrace (+ a relic-mint trace)
 *   #3 Determinism: no PRNG. The THR-518 relic mint is a deterministic graph
 *      mutation (id + content derived from owner/target/tick).
 *   #4 Fail-soft: returns null if template lacks controlSpec; relic mint no-ops
 *      without a graph.
 */

import type { UnifiedAction, UnifiedActionTemplate } from '../types/unifiedAction';
import type { ControlEffect, ControlSpec, MintUpkeepRelicSpec } from '../types/controlEffect';
import type { TickEvent } from '../types/gameState';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';
import { isHexTargetId, parseHexTargetId } from './hexActionBridge';

// ─── Counter ────────────────────────────────────────────────────────────────

let effectCounter = 0;

/** Reset counter for deterministic testing. */
export function resetEffectCounter(): void {
  effectCounter = 0;
}

// ─── Spawn ──────────────────────────────────────────────────────────────────

/**
 * Spawn a ControlEffect from a successfully resolved sustained action.
 *
 * Two target shapes are supported:
 * - **Hex target** (`hex_COL_ROW`): the classic land-control case. The effect is
 *   anchored to the hex; `targetNodeId` stays undefined.
 * - **Location-node target** (a node id, e.g. consecrate on a temple/shrine —
 *   THR-511): the location's `hexCol`/`hexRow` anchor the effect on the map AND
 *   `targetNodeId` is set to the location id, so node-scoped per-tick effects
 *   (`perTickThreadAuras` faith-spread, `sustainThreshold` on `location`) resolve
 *   against the right node. Requires `graph` to resolve the location's coords.
 *
 * The THR-509 spec fields (`perTickThreadAuras`, `upkeepArtifactId`) are carried
 * onto the effect for both shapes; the consumer side (`phaseControlEffects` +
 * `getUpkeepStatus` / `applyCoLocatedThreadAura`) already reads them.
 *
 * Returns null if:
 * - template.durationMode is not 'sustained'
 * - template.controlSpec is missing
 * - the target is neither a hex nor a location node that resolves to hex coords
 *
 * The caller is responsible for pushing the result onto GameState.controlEffects[].
 */
export function spawnControlEffect(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  tick: number,
  graph?: WorldGraph,
): { effect: ControlEffect; event: TickEvent } | null {
  // Guard: only sustained actions with a controlSpec spawn effects
  if (template.durationMode !== 'sustained' || !template.controlSpec) {
    return null;
  }

  if (!action.targetId) return null;

  // Resolve the target to hex coords (+ optional location node id).
  let col: number;
  let row: number;
  let targetNodeId: string | undefined;

  if (isHexTargetId(action.targetId)) {
    const coords = parseHexTargetId(action.targetId);
    if (!coords) return null;
    col = coords.col;
    row = coords.row;
  } else if (graph) {
    // Location-node target (THR-511): resolve the location's hex coords and
    // record the node id so node-scoped per-tick effects target it.
    const node = graph.getNode(action.targetId);
    if (!node || node.type !== 'location') return null;
    const hc = node.properties.hexCol;
    const hr = node.properties.hexRow;
    if (typeof hc !== 'number' || typeof hr !== 'number') return null;
    col = hc;
    row = hr;
    targetNodeId = action.targetId;
  } else {
    // No graph available to resolve a non-hex target — fail-soft, no effect.
    return null;
  }

  const spec: ControlSpec = template.controlSpec;
  const effectId = `ctrl_${++effectCounter}`;

  // THR-518 relic variant: mint a permanent relic and bind it as this effect's
  // dynamic upkeep substitute. A static `spec.upkeepArtifactId` cannot reference
  // a not-yet-created node, so the mint happens here (effect construction time,
  // where the graph is in scope) and overrides the static id. Deterministic id +
  // content (no PRNG). Requires a graph; fail-soft to no mint without one.
  const mintedRelicId =
    spec.mintUpkeepRelic && graph
      ? mintUpkeepRelicArtifact(graph, spec.mintUpkeepRelic, action.actorId, targetNodeId, col, row, tick)
      : undefined;

  const effect: ControlEffect = {
    effectId,
    templateId: action.templateId,
    ownerId: action.actorId,
    targetHexCol: col,
    targetHexRow: row,
    ...(targetNodeId ? { targetNodeId } : {}),

    // Establishment
    establishedTick: tick,
    ritualEssenceInvested: action.essencePaid ?? 0,

    // Sustain (copied from ControlSpec)
    perTickCost: spec.perTickCost,
    perTickIncome: spec.perTickIncome,
    sustainThreshold: spec.sustainThreshold,

    // Ongoing effects
    perTickMutations: spec.perTickMutations ?? [],
    perTickGraphOps: spec.perTickGraphOps ?? [],
    // THR-509 spec fields — carried through so consecrate's faith-spread and the
    // relic-upkeep substitute resolve at tick time (phaseControlEffects reads them).
    perTickThreadAuras: spec.perTickThreadAuras,
    // THR-518: a freshly-minted relic overrides any static upkeep artifact id.
    upkeepArtifactId: mintedRelicId ?? spec.upkeepArtifactId,

    // State — starts active
    active: true,
    ticksActive: 0,

    // Contestation
    contestPrerequisites: spec.contestPrerequisites,

    // Narrative
    narrativeTemplates: spec.narrativeTemplates,
  };

  // Emit trace
  emitTrace({
    id: 0,
    category: 'control_effect',
    tick,
    timestamp: tick,
    summary: `${template.name} established on hex (${col},${row})${targetNodeId ? ` [${targetNodeId}]` : ''}`,
    type: 'control_effect_established',
    effectId,
    templateId: action.templateId,
    ownerId: action.actorId,
    targetHex: { col, row },
    targetNodeId,
    ritualEssenceInvested: action.essencePaid ?? 0,
  } as any);

  // Tick event
  const event: TickEvent = {
    id: `ctrl_established_${effectId}`,
    tick,
    type: 'control_effect_established',
    message: `${template.name} established — sustained divine presence on hex (${col},${row}).`,
    significance: 0.7,
  };

  return { effect, event };
}

// ─── Relic mint (THR-518) ─────────────────────────────────────────────────────

/**
 * Mint a permanent relic artifact to serve as a control effect's upkeep
 * substitute, and bind it to the establishing ascendant via a `possesses` edge.
 * Returns the new node's id so `spawnControlEffect` can set `upkeepArtifactId`.
 *
 * The relic is a *load-bearing* node, not dead content: its existence is read
 * every tick by `getUpkeepStatus` (it waives the effect's `perTickCost`), and
 * its destruction lapses the effect (`upkeep_relic_destroyed`) — the rival
 * contestation vector. `lossCondition: 'permanent'` keeps ambient decay/theft
 * systems from reaping it, so only deliberate destruction ends the consecration.
 *
 * Deterministic: the id and properties derive from owner/target/tick — no PRNG.
 */
function mintUpkeepRelicArtifact(
  graph: WorldGraph,
  spec: MintUpkeepRelicSpec,
  ownerId: string,
  targetNodeId: string | undefined,
  col: number,
  row: number,
  tick: number,
): string {
  const anchor = targetNodeId ?? `hex_${col}_${row}`;
  const relicId = `relic_consecrate_${ownerId}_${anchor}_${tick}`;

  graph.addNode({
    id: relicId,
    type: 'artifact',
    name: spec.relicName,
    properties: {
      source: 'consecrate_relic',
      lossCondition: 'permanent',
      consecratedBy: ownerId,
      consecratedNodeId: targetNodeId,
      consecratedHex: { col, row },
      createdTick: tick,
      effects: [],
    },
  });
  graph.addEdge({
    id: `${relicId}_edge`,
    source: ownerId,
    target: relicId,
    type: 'possesses',
    properties: { modifiers: {}, grants: [], tags: spec.tags ?? ['consecration_relic'] },
  });

  emitTrace({
    id: 0,
    category: 'control_effect',
    tick,
    timestamp: tick,
    summary: `relic "${spec.relicName}" minted to sustain consecration on ${anchor} (zero upkeep)`,
    type: 'control_effect_relic_minted',
    relicId,
    ownerId,
    targetNodeId,
    targetHex: { col, row },
  } as any);

  return relicId;
}
