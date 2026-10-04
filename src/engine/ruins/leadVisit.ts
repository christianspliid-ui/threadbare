/**
 * The visit to a lead's ruin (THR-1664, seeded things stay alive S3; plan doc
 * `Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md` § S3).
 *
 * The climb runs **hear → survey → visit → delve**. A survey is instant and always
 * `success`, so it can only ever write `narrowed` (`OBSERVE_CLUE_PRECISION_BY_BAND`).
 * The survey therefore arranges a visit — an appointment at the ruin, the hunt's shape
 * (THR-1560) — and the visit's own dice decide the lead (`CLUE_VISIT_PRECISION_BY_OUTCOME`).
 *
 * Three pure-ish helpers, each fail-soft (NFP #4):
 * - {@link siteClassAdmits} — the payoff's `siteClasses` gate, read by the planter.
 * - {@link claimLeadVisit} — the planter's lead gate: a `narrowed` lead on the site, no
 *   visit already pending; stamps `pendingVisitDueTick` (and the seed it is for) when it admits.
 * - {@link releaseLeadVisit} — undoes that stamp when the planter then refuses (THR-1696).
 * - {@link resolveVisitLead} — the `sharpen_clue` aftermath effect: how the visit ended sets the lead.
 *
 * No PRNG (NFP #3): the band is the encounter resolution's own seeded roll.
 */

import type { GraphEdge, GraphNode } from '../../types/graph';
import type { CluePrecision } from '../../types/knowledge';
import type { StepOutcome, UnifiedActionOutcome } from '../../types/unifiedAction';
import type { WorldGraph } from '../graph';
import { locationClassOf } from '../../data/world-objects';
import { isLocationNode } from '../sublocationShape';
import { resolveAgentHex } from '../relocationIntent';
import { resolveLocationToHex } from '../encounterAwareness';
import { emitTrace } from '../traceBuffer';
import {
  CLUE_VISIT_PRECISION_BY_OUTCOME,
  isLeadVisitPending,
  type ClueVisitVerdict,
} from './constants';

/** The subtype a Location carries, under either of the two property spellings. */
function locationSubtypeOf(node: GraphNode | undefined): string | undefined {
  if (!node) return undefined;
  return (node.properties.locationSubtype ?? node.properties.locationType) as string | undefined;
}

/**
 * Does the site belong to one of `classes`? Absent `classes` admits every site
 * (the field is optional, NFP #6). A site that is not a Location never matches a list.
 */
export function siteClassAdmits(site: GraphNode | undefined, classes: readonly string[] | undefined): boolean {
  if (!classes || classes.length === 0) return true;
  if (!site || !isLocationNode(site)) return false;
  const cls = locationClassOf(locationSubtypeOf(site));
  return cls !== undefined && classes.includes(cls);
}

/** The actor's one unconsumed lead on `ruinId`, if any. */
export function heldLead(graph: WorldGraph, actorId: string, ruinId: string): GraphEdge | undefined {
  return graph.getOutgoingEdges(actorId, 'knows_clue_of')
    .find(e => e.target === ruinId && e.properties?.consumed !== true);
}

/** Why the planter's lead gate refused. Carried on the refusal trace. */
export type LeadVisitRefusal = 'no_lead' | 'not_narrowed' | 'visit_pending';

/**
 * The planter's lead gate (plan § S3.1). Admits when the actor holds an unconsumed
 * `narrowed` lead on the site and no visit to it is pending; on admission stamps
 * `pendingVisitDueTick = dueTick` on the lead, which pauses its decay.
 *
 * **One pending visit per holder per ruin** (THR-1675 re-plan): a lead that already
 * carries a live stamp refuses `visit_pending` — the survey already refreshed the lead,
 * and nothing new is planted.
 *
 * A `located` lead refuses `not_narrowed`: the holder already knows where it lies, and
 * the next arrival admits the delve on its own.
 */
export function claimLeadVisit(
  graph: WorldGraph,
  actorId: string,
  siteId: string,
  tick: number,
  dueTick: number,
  /**
   * THR-1696 — the seed the visit will ride. Stamped beside the due tick so the visit's
   * resolution (kept or missed) acts on *this* ruin's lead, wherever the mortal stands.
   */
  seedId?: string,
): { admitted: true; leadId: string } | { admitted: false; reason: LeadVisitRefusal } {
  try {
    const lead = heldLead(graph, actorId, siteId);
    if (!lead) return { admitted: false, reason: 'no_lead' };
    const props = lead.properties as Record<string, unknown>;
    if (isLeadVisitPending(props.pendingVisitDueTick, tick)) return { admitted: false, reason: 'visit_pending' };
    if (props.precision !== 'narrowed') return { admitted: false, reason: 'not_narrowed' };
    props.pendingVisitDueTick = dueTick;
    if (seedId) props.pendingVisitSeedId = seedId;
    else delete props.pendingVisitSeedId;
    return { admitted: true, leadId: lead.id };
  } catch {
    return { admitted: false, reason: 'no_lead' };
  }
}

/**
 * Undo a {@link claimLeadVisit} stamp the planter did not honour (THR-1696). The gate
 * stamps before `plantAppointmentPromise` runs, and the planter can still refuse
 * (`over_max`, `place_unresolved`); a stamp left behind would spare the lead decay
 * and refuse every repeat survey `visit_pending` for a visit nobody arranged.
 *
 * Clears only the stamp this claim wrote (matched by due tick), so it never erases a
 * different visit. Fail-soft: a missing lead is a no-op.
 */
export function releaseLeadVisit(graph: WorldGraph, leadId: string, dueTick: number): void {
  try {
    const props = graph.getEdge(leadId)?.properties as Record<string, unknown> | undefined;
    if (!props || props.pendingVisitDueTick !== dueTick) return;
    delete props.pendingVisitDueTick;
    delete props.pendingVisitSeedId;
  } catch {
    // fail-soft (NFP #4)
  }
}

/** Result of {@link resolveVisitLead}, carried on the aftermath effect trace. */
export interface VisitLeadResult {
  readonly success: boolean;
  readonly failReason?: 'no_lead' | 'not_terminal';
  readonly ruinId?: string;
  readonly from?: CluePrecision;
  readonly to?: ClueVisitVerdict;
}

/**
 * The lead a visit acts on. First, the lead stamped with the seed that spawned this
 * visit (THR-1696) — the ruin the visit was arranged for, wherever the mortal now
 * stands, so a missed visit to ruin A never cools the lead on ruin B underfoot.
 * A seed that matches no lead never takes another visit's stamped lead. Without a seed
 * (a `?spawn=` review), or among unseeded pre-THR-1696 stamps: the actor's lead
 * with a *live* visit stamp, the one on the ruin they stand on first, else the soonest
 * due. A lapsed stamp never wins (THR-1696). With no live stamp, the lead on a ruin at
 * the actor's own hex. Deterministic: ties by edge id.
 */
function visitLead(graph: WorldGraph, actorId: string, tick: number, seedId?: string): GraphEdge | undefined {
  const leads = graph.getOutgoingEdges(actorId, 'knows_clue_of')
    .filter(e => e.properties?.consumed !== true)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (leads.length === 0) return undefined;
  let pool = leads;
  if (seedId) {
    const arranged = leads.find(e => e.properties?.pendingVisitSeedId === seedId);
    if (arranged) return arranged;
    // The seed's lead was re-stamped by a later survey, or consumed. A lead stamped for a
    // *different* seed belongs to another visit and is never this one's to resolve; only
    // a pre-THR-1696 stamp (no seed id) stays eligible below.
    // Nor is an unstamped lead: with a seed in hand, only a live unseeded stamp may stand in.
    pool = leads.filter(e => typeof e.properties?.pendingVisitSeedId !== 'string'
      && isLeadVisitPending(e.properties?.pendingVisitDueTick, tick));
    if (pool.length === 0) return undefined;
  }
  const hex = resolveAgentHex(graph, actorId);
  const onHex = (e: GraphEdge): boolean => {
    if (!hex) return false;
    const at = resolveLocationToHex(graph, e.target);
    return at !== null && at.col === hex.col && at.row === hex.row;
  };
  const stamped = pool.filter(e => isLeadVisitPending(e.properties?.pendingVisitDueTick, tick));
  const stampedHere = stamped.find(onHex);
  if (stampedHere) return stampedHere;
  if (stamped.length > 0) {
    return [...stamped].sort((a, b) =>
      (a.properties.pendingVisitDueTick as number) - (b.properties.pendingVisitDueTick as number))[0];
  }
  // The unstamped lead underfoot answers only a visit with no seed (a `?spawn=` review).
  return seedId ? undefined : pool.find(onHex);
}

/**
 * The `sharpen_clue` aftermath effect (plan § S3.3). Acts only on the actor's own lead —
 * never by Narrative Gravity (that is `spawn_clue`'s path, untouched).
 *
 * - `missed: true` (the cold template) — the lead goes cold whatever the outcome.
 * - otherwise `outcome` — how the encounter ends, absent while it goes on to another
 *   step — maps through `CLUE_VISIT_PRECISION_BY_OUTCOME`: `located` / `narrowed`
 *   sharpen (or refresh) the lead, `cold` consumes it. A step that does not end the
 *   encounter is a no-op (`not_terminal`), so the effect may ride every step that can.
 *
 * Every applied outcome clears the visit stamp: the visit happened, or it was missed.
 * Emits `ruins.clue_sharpened` when a lead changed.
 */
export function resolveVisitLead(
  graph: WorldGraph,
  actorId: string,
  tick: number,
  opts: {
    outcome?: UnifiedActionOutcome;
    /** The last step's band, carried onto the trace only. */
    band?: StepOutcome;
    missed?: boolean;
    /** THR-1696 — the seed that spawned the visit (`UnifiedAction.spawnedFromSeedId`). */
    seedId?: string;
  },
): VisitLeadResult {
  try {
    if (!opts.missed && !opts.outcome) return { success: false, failReason: 'not_terminal' };
    const lead = visitLead(graph, actorId, tick, opts.seedId);
    if (!lead) return { success: false, failReason: 'no_lead' };
    const props = lead.properties as Record<string, unknown>;
    const from = (props.precision as CluePrecision | undefined) ?? 'vague';
    const to: ClueVisitVerdict = opts.missed ? 'cold' : (CLUE_VISIT_PRECISION_BY_OUTCOME[opts.outcome!] ?? 'narrowed');
    delete props.pendingVisitDueTick;
    delete props.pendingVisitSeedId;
    if (to === 'cold') {
      props.consumed = true;
      props.consumedTick = tick;
    } else {
      // A lead only climbs: a `located` lead the visit rated `narrowed` stays located.
      props.precision = from === 'located' ? 'located' : to;
      props.discoveredTick = tick;
    }
    const ruinName = graph.getNode(lead.target)?.name ?? lead.target;
    emitTrace({
      category: 'ruins.clue_sharpened',
      tick,
      knowerId: actorId,
      targetRuinId: lead.target,
      from,
      to: to === 'cold' ? 'cold' : (props.precision as CluePrecision),
      via: opts.missed ? 'missed_visit' : 'visit',
      ...(opts.band ? { band: opts.band } : {}),
      summary: `${actorId} ${opts.missed ? 'missed the visit to' : 'visited'} ${ruinName}: lead ${from} → ${to === 'cold' ? 'cold' : String(props.precision)}`,
    });
    return { success: true, ruinId: lead.target, from, to };
  } catch {
    return { success: false, failReason: 'no_lead' };
  }
}
