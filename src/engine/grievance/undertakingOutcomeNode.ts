/**
 * Undertaking Outcome Event Nodes (THR-1298)
 *
 * A harm done in the world writes itself into what its victim wants next. This module
 * is the first half of that: it promotes a harm-carrying undertaking outcome from an
 * ephemeral `TickEvent` into a durable graph `event` node, which is the only shape the
 * mint lane can read.
 *
 * Sibling to `encounterEventNode.ts` — deliberately the *same* edge shape
 * (`participated_in` with `role`, `occurred_at` to the site) and a *distinct*
 * `eventType` and id namespace. The shape is reused because `gatherMintTuples` already
 * classifies `participated_in role:'target'` as `victim`; the eventType is distinct
 * because these nodes carry a `harmClass` rather than a `reachTested`, and routing them
 * through the encounter rules table would key a razing off whichever Reach the verb
 * happened to test. Two vocabularies, two tables, one lane.
 *
 * NFP #4 (Fail-soft): every graph write is individually guarded. An undertaking's
 * terminal path completes whether or not its outcome node lands — the node is a
 * write-only side effect, never a precondition.
 */

import type { WorldGraph } from '../graph';
import type { StrategicProjectRuntime, UndertakingHarmClass } from '../../types/strategicAction';
import { HARM_MAGNITUDE_BY_CLASS } from '../../data/ambition-minting-rules';
import { getFactionLeaderId } from '../factionNetwork';
import { emitTrace } from '../traceBuffer';
import type { TraceEntry } from '../../types/trace';

/** Id prefix for undertaking outcome event nodes — distinct from `evt_` (encounters). */
export const UNDERTAKING_EVENT_NODE_ID_PREFIX = 'evt_und_';

export interface CreateUndertakingOutcomeParams {
  readonly graph: WorldGraph;
  readonly project: StrategicProjectRuntime;
  readonly harmClass: UndertakingHarmClass;
  readonly tick: number;
  /**
   * Who did it. Normally the project's actor; passed explicitly so the seize site can
   * name the taker rather than re-deriving them.
   */
  readonly culpritAgentId?: string;
  /**
   * Who it was done to. Absent is legal and common — a harm whose owner could not be
   * resolved still registers for witnesses (fail-soft row 1).
   */
  readonly victimAgentId?: string;
  /** The ascendant, so the god-stays-out ruling can be enforced rather than assumed. */
  readonly ascendantId?: string;
  /** How far down a revenge chain this harm sits. Fresh harms are 0. */
  readonly chainDepth?: number;
  /** Set when this outcome answers an existing grievance (suppresses the counter-mint). */
  readonly answersGrievance?: boolean;
  readonly answeredMagnitude?: number;
  /**
   * `true` for a harm with no culprit — the owner's own undertaking collapsed under
   * them (`undertaking_abandoned`).
   *
   * This is not cosmetic. A self-facing outcome writes the owner in the **victim**
   * role, not the primary one, because the mint lane reads `role: 'target'` as "this
   * was done to them" and reads everything else as "they did it" — and a self-facing
   * node written the ordinary way would name the owner as their own culprit, mint
   * nothing at all (the lane skips non-victim undertaking edges), and, if it did mint,
   * would offer them a vendetta against themselves.
   */
  readonly selfFacing?: boolean;
}

/**
 * Write the graph event node for a harm-carrying undertaking outcome.
 *
 * Returns the node id, or `undefined` when nothing was written — an unknown harm class,
 * a god-driven outcome, or a graph write that threw.
 */
export function createUndertakingOutcomeNode(
  params: CreateUndertakingOutcomeParams,
): string | undefined {
  const {
    graph, project, harmClass, tick, victimAgentId, ascendantId,
    chainDepth = 0, answersGrievance, answeredMagnitude, selfFacing,
  } = params;

  // A self-facing outcome has no culprit at all — not "the actor as their own culprit".
  const culpritAgentId = selfFacing ? undefined : (params.culpritAgentId ?? project.actorId);

  // The god stays out of the grievance economy by construction: every emission site is
  // an agent-driven undertaking terminal, so this can only fire if that ever stops
  // being true. It is a guard against a *future* wiring change, not a live case — but
  // the ruling (THR-1282) is load-bearing enough to assert rather than trust, because
  // the failure it prevents is mortals nursing vendettas against their own god.
  if (ascendantId && (culpritAgentId ?? project.actorId) === ascendantId) return undefined;

  const harmMagnitude = HARM_MAGNITUDE_BY_CLASS[harmClass];
  if (harmMagnitude === undefined) return undefined;

  const eventNodeId = `${UNDERTAKING_EVENT_NODE_ID_PREFIX}${project.projectId}_${tick}`;

  try {
    graph.addNode({
      id: eventNodeId,
      type: 'event',
      name: `${project.templateId} (${harmClass})`,
      properties: {
        eventType: 'undertaking_outcome',
        harmClass,
        templateId: project.templateId,
        verb: project.verb,
        tick,
        harmMagnitude,
        chainDepth,
        ...(culpritAgentId && { culpritAgentId }),
        ...(victimAgentId && { victimAgentId }),
        ...(project.targetNodeId && { targetNodeId: project.targetNodeId }),
        ...(answersGrievance && { answersGrievance }),
        ...(answeredMagnitude !== undefined && { answeredMagnitude }),
      },
    });
  } catch (err) {
    console.warn(`[UndertakingOutcomeNode] Failed to create event node ${eventNodeId}:`, err);
    return undefined;
  }

  // ── participated_in: culprit → event (role 'primary') ──
  if (culpritAgentId) {
    try {
      graph.addEdge({
        id: `${culpritAgentId}_participated_in_${eventNodeId}`,
        source: culpritAgentId,
        target: eventNodeId,
        type: 'participated_in',
        // `outcome` is required by the `participated_in` schema (edgeSchema.ts). A harm
        // that landed *is* the undertaking succeeding, from the hand that dealt it.
        properties: { role: 'primary', outcome: 'success', harmClass, tick },
      });
    } catch (err) {
      console.warn(`[UndertakingOutcomeNode] Failed to add primary edge for ${culpritAgentId}:`, err);
    }
  }

  // ── participated_in: victim → event (role 'target') ──
  //
  // `role: 'target'` is the exact key `gatherMintTuples` reads as `victim`. Writing
  // anything else here would classify the wronged party as a mere participant and
  // offer them the bystander's drives.
  if (victimAgentId && victimAgentId !== culpritAgentId) {
    // Reached by the self-facing case too: there `culpritAgentId` is undefined, so the
    // owner takes the victim role uncontested — which is exactly what makes their own
    // abandoned work mint them a drive to rebuild.
    try {
      graph.addEdge({
        id: `${victimAgentId}_participated_in_${eventNodeId}`,
        source: victimAgentId,
        target: eventNodeId,
        type: 'participated_in',
        properties: { role: 'target', outcome: 'success', harmClass, tick },
      });
    } catch (err) {
      console.warn(`[UndertakingOutcomeNode] Failed to add victim edge for ${victimAgentId}:`, err);
    }
  }

  // ── participated_in: faction victim's leader → event (role 'target') (THR-1383) ──
  //
  // A faction holds no `pursues` edges and the ambition phase walks individuals only,
  // so a harm done to a guild used to reach nobody — six of the thirteen culprit-carrying
  // harms on the observation run evaporated this way. The leader carries it: a second
  // target edge, tagged `viaFactionId` so the provenance prose can say whose hall it was
  // and so the tuple builder can tell the two relations apart. The faction's own edge
  // stays — it is the honest record of who was harmed. A leaderless faction, or one led
  // by the culprit, routes nowhere (fail-soft: the harm still registers for witnesses).
  if (victimAgentId) {
    const victim = graph.getNode(victimAgentId);
    if (victim?.type === 'actor' && victim.properties.actorType === 'faction') {
      const leaderId = getFactionLeaderId(graph, victimAgentId);
      if (leaderId && leaderId !== culpritAgentId && leaderId !== victimAgentId) {
        try {
          graph.addEdge({
            id: `${leaderId}_participated_in_${eventNodeId}`,
            source: leaderId,
            target: eventNodeId,
            type: 'participated_in',
            properties: { role: 'target', outcome: 'success', harmClass, tick, viaFactionId: victimAgentId },
          });
        } catch (err) {
          console.warn(`[UndertakingOutcomeNode] Failed to add leader edge for ${leaderId}:`, err);
        }
      }
    }
  }

  // ── occurred_at: event → site ──
  //
  // The site is what makes witnesses possible: the mint lane finds witnesses by
  // walking `occurred_at` back from the location they are standing in. Prefer the
  // undertaking's own origin over the actor's current position — by completion time
  // the actor may have moved on, and a razing belongs to the place it happened.
  const siteId = project.originLocationId
    ?? graph.getOutgoingEdges(project.actorId, 'located_at')[0]?.target;
  if (siteId) {
    try {
      graph.addEdge({
        id: `${eventNodeId}_occurred_at_${siteId}`,
        source: eventNodeId,
        target: siteId,
        type: 'occurred_at',
        properties: { tick },
      });
    } catch (err) {
      console.warn(`[UndertakingOutcomeNode] Failed to add occurred_at edge for ${eventNodeId}:`, err);
    }
  }

  emitTrace({
    category: 'undertaking_outcome_event',
    tick,
    projectId: project.projectId,
    harmClass,
    culpritAgentId: culpritAgentId ?? project.actorId,
    victimAgentId,
    harmMagnitude,
    chainDepth,
    answersGrievance,
    summary: culpritAgentId
      ? (victimAgentId
        ? `${harmClass}: ${culpritAgentId} → ${victimAgentId} (magnitude ${harmMagnitude})`
        : `${harmClass}: ${culpritAgentId}, no victim resolved`)
      : `${harmClass}: self-facing, ${victimAgentId ?? project.actorId} (magnitude ${harmMagnitude})`,
  } as TraceEntry);

  return eventNodeId;
}
