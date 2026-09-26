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
import { GRIEF_BOND_MAX, GRIEF_BOND_MIN_SENTIMENT } from '../../data/grievance-constants';
import { getFactionLeaderId } from '../factionNetwork';
import { isAgentGone } from '../groups/groupQueries';
import { emitTrace } from '../traceBuffer';
import type { TraceEntry, UndertakingOutcomeSiteResolution } from '../../types/trace';

/** Id prefix for undertaking outcome event nodes — distinct from `evt_` (encounters). */
export const UNDERTAKING_EVENT_NODE_ID_PREFIX = 'evt_und_';

/**
 * Whether an event id names an undertaking outcome node. The one test every reader of
 * the namespace goes through (the grievance mint, the omen agenda's portent, the
 * receipt's `undertaking` provenance — THR-1432), so the prefix cannot be re-spelled.
 */
export function isUndertakingOutcomeEventId(id: string | undefined | null): boolean {
  return typeof id === 'string' && id.startsWith(UNDERTAKING_EVENT_NODE_ID_PREFIX);
}

/**
 * A harm that did not come from an undertaking (THR-1548). Two kinds: a death in a
 * fight, and a commander killed in a battle's aftermath (THR-1566). It supplies exactly what the writer reads from `project` — an id, the
 * template, the thing the harm was done *to* (the victim, so the omen deed reads "the
 * killing of <victim>" as the plot's does) and where it happened — and nothing else,
 * so every consumer of the reactive loop reads a fight death as the harm it is.
 */
export interface OutcomeNonUndertakingSource {
  readonly kind: 'fight' | 'battle';
  /**
   * The fight's actor (the fighter), or the victorious commander for a battle. The
   * site fallback walks their `located_at`.
   */
  readonly actorId: string;
  /** The fight action's id, or the battle node's id — the node's `projectId` and part of its id. */
  readonly actionId: string;
  readonly templateId: string;
  /** What the harm was done to — the victim. Written as the node's `targetNodeId`. */
  readonly targetNodeId?: string;
  /** Where it happened, when the caller captured it; else the actor's position. */
  readonly siteId?: string;
}

export interface CreateUndertakingOutcomeParams {
  readonly graph: WorldGraph;
  /**
   * The undertaking that did the harm. Optional only when `source` is given
   * (THR-1548): a harm with neither writes nothing.
   */
  readonly project?: StrategicProjectRuntime;
  /** A non-undertaking source (THR-1548). Ignored when `project` is present. */
  readonly source?: OutcomeNonUndertakingSource;
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

/** The project fields the writer reads — a project, or a normalised non-undertaking source. */
type OutcomeProjectFields = Pick<
  StrategicProjectRuntime, 'projectId' | 'actorId' | 'templateId' | 'targetNodeId' | 'originLocationId'
> & { readonly verb: string };

/** What `resolveOutcomeSite` decided, carried into the trace verbatim. */
export interface ResolvedOutcomeSite {
  /** Absent when neither anchor named a live node. */
  readonly siteId?: string;
  readonly siteResolution: UndertakingOutcomeSiteResolution;
  /** Only set when the origin was present *and* dead — the recovery signal (THR-1444). */
  readonly siteOriginStale?: true;
}

/**
 * The site to stamp a harm with, resolved against a node the graph actually holds
 * (THR-1444).
 *
 * `project.originLocationId` is a plain string, stamped once when the undertaking is
 * created and never revisited; undertakings then run for hundreds of ticks.
 * `WorldGraph.removeNode` cascades incident edges — so a `located_at` edge can never
 * dangle — but it cannot reach a string held on a project runtime. A settlement
 * retired mid-flight therefore leaves the origin pointing at nothing, and the old
 * `origin ?? actor position` chain never reached its fallback, because a dangling
 * string is still truthy. `addEdge` threw, a `catch` warned, and the event landed
 * durably with no site at all: a harm nobody can witness, which mints no grievance.
 * Measured as *every* subsequent cell that actor ran failing identically.
 *
 * Preference order is deliberately unchanged where both anchors are live: the
 * undertaking's own origin wins, because by completion time the actor may have moved
 * on and a razing belongs to the place it happened. What changes is that a dead origin
 * now falls through to where the actor stands, and a wholly unresolvable site becomes
 * a trace field rather than an exception nobody reads.
 */
export function resolveOutcomeSite(
  graph: WorldGraph,
  project: Pick<StrategicProjectRuntime, 'originLocationId' | 'actorId'>,
): ResolvedOutcomeSite {
  const origin = project.originLocationId;
  if (origin && graph.getNode(origin)) return { siteId: origin, siteResolution: 'origin' };

  // `origin` being set but absent from the graph is the failure this function exists
  // for; flag it so a rising count is visible instead of silent.
  const originStale = origin ? { siteOriginStale: true as const } : {};

  const position = graph.getOutgoingEdges(project.actorId, 'located_at')[0]?.target;
  if (position && graph.getNode(position)) {
    return { siteId: position, siteResolution: 'actor_position', ...originStale };
  }

  return { siteResolution: 'unresolved', ...originStale };
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
    graph, harmClass, tick, victimAgentId, ascendantId,
    chainDepth = 0, answersGrievance, answeredMagnitude, selfFacing,
  } = params;

  // THR-1548: a non-undertaking source is normalised into the fields the writer reads
  // off a project, so everything below is one path. Its node id carries the source kind
  // (`evt_und_fight_<actionId>_<tick>`) under the same prefix every reader keys on.
  const source = params.project ? undefined : params.source;
  const project: OutcomeProjectFields | undefined = params.project ?? (source && {
    projectId: source.actionId,
    actorId: source.actorId,
    templateId: source.templateId,
    verb: source.kind,
    targetNodeId: source.targetNodeId,
    originLocationId: source.siteId,
  });
  if (!project) return undefined;

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

  const eventNodeId = source
    ? `${UNDERTAKING_EVENT_NODE_ID_PREFIX}${source.kind}_${project.projectId}_${tick}`
    : `${UNDERTAKING_EVENT_NODE_ID_PREFIX}${project.projectId}_${tick}`;

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
        // For inspection only: every consumer reads a fight death as an undertaking harm.
        ...(source && { source: source.kind }),
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

  // ── participated_in: a slain victim's bonds → event (role 'target') (THR-1536) ──
  //
  // A retained death (the plot, band casualties, commissioned killings) leaves the
  // victim's target edge on a corpse, and the ambition phase skips the dead — so a
  // killing used to reach only witnesses standing at the site. The victim's warmest
  // living bonds carry it instead, tagged `viaBondOf` so the provenance prose can say
  // whose death it was. Same shape as the faction-leader routing above. The corpse's
  // own edge stays: it is the honest record of who was harmed.
  //
  // Only a harm with a culprit grieves anyone. A self-facing outcome names its owner as
  // the victim — and when the owner died mid-undertaking, that owner is dead here — but
  // a friend's unfinished work collapsing is not a wound done to their bonds; routing it
  // would hand the living a drive to rebuild something nobody destroyed. Measured on the
  // seed-42 census: all eight bond edges it first wrote were `undertaking_abandoned`.
  const griefBondIds = victimAgentId && culpritAgentId
    ? routeGriefToBonds(graph, eventNodeId, victimAgentId, culpritAgentId, harmClass, tick)
    : [];

  // ── occurred_at: event → site ──
  //
  // The site is what makes witnesses possible: the mint lane finds witnesses by
  // walking `occurred_at` back from the location they are standing in.
  const { siteId, siteResolution, siteOriginStale } = resolveOutcomeSite(graph, project);
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
    ...(siteId && { siteId }),
    siteResolution,
    ...(siteOriginStale && { siteOriginStale }),
    ...(griefBondIds.length > 0 && { griefBondIds }),
    summary: culpritAgentId
      ? (victimAgentId
        ? `${harmClass}: ${culpritAgentId} → ${victimAgentId} (magnitude ${harmMagnitude})`
        : `${harmClass}: ${culpritAgentId}, no victim resolved`)
      : `${harmClass}: self-facing, ${victimAgentId ?? project.actorId} (magnitude ${harmMagnitude})`,
  } as TraceEntry);

  return eventNodeId;
}

/**
 * Route a slain individual's harm to their warmest living bonds (THR-1536).
 *
 * Fires only when the victim is an individual who is already gone at write time — a
 * living victim carries their own wound, and a faction is routed to its leader above.
 * Bonds are `relates_to` edges in either direction whose `sentiment` is at least
 * `GRIEF_BOND_MIN_SENTIMENT`; the stronger direction wins when both exist. The culprit,
 * the dead, and anything that is not a living individual are never reached. Ties break
 * on id so the choice is deterministic (NFP #3).
 *
 * Returns the ids actually written, for the trace. Every write is guarded (NFP #4): a
 * victim with no qualifying bond writes nothing, and the harm still registers for
 * witnesses through `occurred_at`.
 */
function routeGriefToBonds(
  graph: WorldGraph,
  eventNodeId: string,
  victimAgentId: string,
  culpritAgentId: string | undefined,
  harmClass: UndertakingHarmClass,
  tick: number,
): string[] {
  const victim = graph.getNode(victimAgentId);
  if (victim?.type !== 'actor' || victim.properties.actorType !== 'individual') return [];
  if (!isAgentGone(victim)) return [];

  const warmth = new Map<string, number>();
  const consider = (otherId: string, sentiment: unknown): void => {
    if (typeof sentiment !== 'number' || sentiment < GRIEF_BOND_MIN_SENTIMENT) return;
    if (otherId === victimAgentId || otherId === culpritAgentId) return;
    const other = graph.getNode(otherId);
    if (other?.type !== 'actor' || other.properties.actorType !== 'individual') return;
    if (isAgentGone(other)) return;
    warmth.set(otherId, Math.max(warmth.get(otherId) ?? -Infinity, sentiment));
  };
  for (const e of graph.getOutgoingEdges(victimAgentId, 'relates_to')) consider(e.target, e.properties.sentiment);
  for (const e of graph.getIncomingEdges(victimAgentId, 'relates_to')) consider(e.source, e.properties.sentiment);

  const chosen = [...warmth.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, GRIEF_BOND_MAX)
    .map(([id]) => id);

  const written: string[] = [];
  for (const bondId of chosen) {
    try {
      graph.addEdge({
        id: `${bondId}_participated_in_${eventNodeId}`,
        source: bondId,
        target: eventNodeId,
        type: 'participated_in',
        properties: { role: 'target', outcome: 'success', harmClass, tick, viaBondOf: victimAgentId },
      });
      written.push(bondId);
    } catch (err) {
      console.warn(`[UndertakingOutcomeNode] Failed to add grief edge for ${bondId}:`, err);
    }
  }
  return written;
}
