/**
 * Ambition node shape — the single discriminator for the two ambition vocabularies.
 *
 * THR-1285. `type: 'ambition'` carries **two incompatible schemas**, and until this
 * module nothing on the node said which one you were holding:
 *
 * - **Template ambitions** (`ambition.<templateId>`) — the agent vocabulary. Minted by
 *   `worldSeed`, `gameInit`, `agentLifecycle`, `ambitionAssignment` and `ambitionTick`,
 *   keyed by `properties.templateId` into `AMBITION_TEMPLATES` /
 *   `EVENT_MINTED_AMBITION_TEMPLATES`. Pursued by `actorType: 'individual'` actors.
 * - **Faction ambitions** (`amb_<factionId>_<tick>`, `amb_campaign_*`) — the faction
 *   vocabulary. Minted by `factionAmbitions`, `factionGovernanceVerbs`, `notableAgendas`
 *   and `worldSeed`'s mercenary post-seeding, keyed by `properties.ambitionType` into
 *   the closed `FactionAmbitionType` union. Pursued by `faction` and `group` (army)
 *   actors. **There is no template registry for these** — `FactionAmbitionType` is six
 *   string literals consumed directly by `factionAmbitions` and `armySpawning`.
 *
 * The two never mix: no faction ambition has a `templateId`, and none ever should.
 *
 * ## Why the discriminator exists
 *
 * Without it the only available test was "does this node have a `templateId`?", which
 * reads every healthy faction ambition as a broken agent ambition. That misread is not
 * hypothetical — it produced THR-1285 itself, off the THR-1277 field survey: 13–14
 * `pursues` edges per run whose target lacked `templateId` were reported as agents whose
 * "drives resolve to nothing". They are not agents. Every one of those edges originates
 * from a `faction` or `group` actor, and both agent-side readers
 * (`ambitionTick.processAmbitionTick`, `phaseAgentDecision`'s strategic-candidate block)
 * filter to `actorType === 'individual'` *before* the `templateId` read — so the
 * fail-soft skip they were blamed for is unreachable by construction for those edges.
 *
 * Stamping the kind at creation (never a post-hoc repair sweep) makes each node
 * self-describing, so a sweep can ask the question it actually means. This is the same
 * fix, for the same failure class, as `sublocationShape.ts` (THR-1183): one mint shape
 * per vocabulary, one predicate module, no hand-rolled discriminators in readers.
 *
 * ## Reading legacy nodes
 *
 * A world saved before THR-1285 carries no `ambitionKind`. NFP #4 (fail-soft) says such
 * a node must degrade to "still classifiable", never to "invisible", so the predicates
 * below **infer** the kind from the payload when the stamp is absent: a `templateId`
 * means template-kind, an `ambitionType` means faction-kind. The stamp is authoritative
 * when present; inference is the back-compat path only.
 *
 * A node carrying *neither* is genuinely malformed and classifies as `'unknown'` — that
 * is the one shape worth tracing, and `ambitionTick` / `phaseAgentDecision` do.
 */
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';

/**
 * The vocabulary an ambition node belongs to.
 *
 * `'unknown'` is a read-time verdict for malformed or unclassifiable nodes, never a
 * value a writer stamps.
 */
export type AmbitionKind = 'template' | 'faction' | 'unknown';

/** Stamped by every template-vocabulary writer at creation. */
export const AMBITION_KIND_TEMPLATE = 'template' as const;

/** Stamped by every faction-vocabulary writer at creation. */
export const AMBITION_KIND_FACTION = 'faction' as const;

/** Property key holding the discriminator on an ambition node. */
export const AMBITION_KIND_KEY = 'ambitionKind' as const;

/**
 * Classify an ambition node's vocabulary.
 *
 * Reads the stamp when present; falls back to payload inference for worlds saved before
 * THR-1285. Returns `'unknown'` for a non-ambition node, a missing node, or a node
 * carrying neither `templateId` nor `ambitionType`.
 */
export function getAmbitionKind(node: GraphNode | undefined | null): AmbitionKind {
  if (!node || node.type !== 'ambition') return 'unknown';

  const props = node.properties as Record<string, unknown> | undefined;
  if (!props) return 'unknown';

  const stamped = props[AMBITION_KIND_KEY];
  if (stamped === AMBITION_KIND_TEMPLATE || stamped === AMBITION_KIND_FACTION) {
    return stamped;
  }

  // Back-compat inference for pre-THR-1285 saves (see module header).
  if (typeof props.templateId === 'string' && props.templateId) return AMBITION_KIND_TEMPLATE;
  if (typeof props.ambitionType === 'string' && props.ambitionType) return AMBITION_KIND_FACTION;

  return 'unknown';
}

/** True when the node belongs to the agent/template vocabulary. */
export function isTemplateAmbition(node: GraphNode | undefined | null): boolean {
  return getAmbitionKind(node) === AMBITION_KIND_TEMPLATE;
}

/** True when the node belongs to the faction vocabulary. */
export function isFactionAmbition(node: GraphNode | undefined | null): boolean {
  return getAmbitionKind(node) === AMBITION_KIND_FACTION;
}

/**
 * The `templateId` of a template-vocabulary ambition, or `undefined`.
 *
 * A faction ambition returns `undefined` because it *has* no template — that is the
 * correct answer, not a defect. Callers that need to distinguish "wrong vocabulary"
 * from "corrupt template ambition" should ask `getAmbitionKind` first.
 */
export function getAmbitionTemplateId(node: GraphNode | undefined | null): string | undefined {
  if (!isTemplateAmbition(node)) return undefined;
  const templateId = (node!.properties as Record<string, unknown>).templateId;
  return typeof templateId === 'string' && templateId ? templateId : undefined;
}

/** Every template-vocabulary ambition node in the graph. */
export function getTemplateAmbitionNodes(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('ambition').filter(isTemplateAmbition);
}

/** Every faction-vocabulary ambition node in the graph. */
export function getFactionAmbitionNodes(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('ambition').filter(isFactionAmbition);
}

// ─── Unevaluable-ambition tripwire (THR-1285) ────────────────────

/**
 * Why an individual actor's `pursues` edge could not be evaluated.
 *
 * - `faction_kind_ambition` — an individual pursues a faction-vocabulary ambition.
 *   Vocabularies crossed; the faction systems own that node, not the agent loop.
 * - `unclassifiable_ambition` — neither `templateId` nor `ambitionType` present.
 * - `missing_template_id` — classified template-kind but carries no usable id.
 * - `template_not_found` — the id resolves to no template in any pool.
 *
 * There is deliberately no `node_missing` member. `addEdge` refuses a dangling target
 * and `removeNode` cascades incident edges, so a `pursues` edge pointing at an absent
 * node cannot be built through the graph API — the readers keep their fail-soft skip
 * for it but do not trace, because a branch no test can reach proves nothing.
 */
export type AmbitionSkipReason =
  | 'faction_kind_ambition'
  | 'unclassifiable_ambition'
  | 'missing_template_id'
  | 'template_not_found';

/**
 * Emit the skip trace for an ambition an individual actor could not evaluate.
 *
 * **Expected volume in a healthy world is zero** (THR-1285), and that is the point: as
 * of this change no production writer can produce any of these shapes, and a 100-tick
 * seed-42 run emits none. It is a tripwire for a class that has never occurred, not an
 * instrument for the 13–14 `pursues` edges the ticket was filed about — those originate
 * from `faction` and `group` actors, which both agent-side readers exclude before ever
 * reaching this code, so no trace here could ever have seen them.
 *
 * Rides the existing `ambition_progress` category rather than registering a new one:
 * the four-site trace-category registration buys nothing for a tripwire, and `event`
 * already distinguishes the row.
 */
export function traceUnevaluableAmbition(
  tick: number,
  actorId: string,
  actorLabel: string,
  ambitionNodeId: string,
  reason: AmbitionSkipReason,
  templateId?: string,
): void {
  emitTrace({
    tick,
    category: 'ambition_progress',
    summary: `${actorLabel} could not evaluate ambition ${ambitionNodeId} (${reason})`,
    actorId,
    ambitionNodeId,
    event: 'skipped',
    reason,
    ...(templateId ? { templateId } : {}),
  });
}
