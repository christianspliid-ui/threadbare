/**
 * Agent residence — where an agent came from, and how long it has stayed put (THR-822).
 *
 * The world's agents are nomadic by design, and until this module nothing could ask
 * *where is this agent from*, *have they put down roots*, or *how long since they last
 * moved*. Two authored abandonment triggers describe exactly that state and were
 * permanently false for want of it (`accepted_exile`, `made_peace_with_the_land` —
 * see `ambition-templates.ts` and the `KNOWN_DEAD` block in
 * `__tests__/traitRefReconciliation.test.ts`).
 *
 * ── Why an observer, not ~24 instrumented writers ─────────────────────────────────
 *
 * The obvious implementation is an `arrivedTick` stamped onto the `located_at` edge at
 * every rewrite site. There are 24 such sites in `src/` today (`movementExecution`,
 * `phaseMovement`, `sublocation`, `siegeResolution`, `battleResolution`, six seeding
 * modules, …), and the count is not stable — a 25th writer added later would silently
 * strand its movers at a stale arrival tick, which reads as *more* settled than the
 * agent is. That is the failure this ticket exists to avoid: state that looks live and
 * is not.
 *
 * So residence is **observed**, not written at the source. `observeResidence` compares
 * the agent's current `located_at` target against the last one recorded on the actor
 * node; a difference restamps the arrival tick. Every mover is covered, including ones
 * that do not exist yet, and no movement code needs to know this module exists.
 *
 * ── Cadence, and what it costs ────────────────────────────────────────────────────
 *
 * The observer runs from `phaseAmbitionProgress`, which already walks every individual
 * actor every `MILESTONE_CHECK_INTERVAL` (15) ticks — so this adds one indexed
 * adjacency lookup per actor per interval and no new walk at all (NFP #7: reuse the
 * existing traversal, do not add a phase to be tidy).
 *
 * The price is that arrival ticks are quantized to that interval, and an agent that
 * leaves and returns inside one interval is never seen to have moved. Both are
 * acceptable against thresholds measured in tens of ticks (a game day is 12), and
 * neither can make an agent look *less* settled than it is — the error is always in the
 * direction of a longer apparent dwell, which the window rule below then bounds anyway.
 * If a finer cadence is ever wanted, move the `observeResidence` call to its own phase;
 * the read API here does not change.
 *
 * ── The window rule, and why it is the whole safety argument ──────────────────────
 *
 * An abandonment trigger is evaluated every tick from the ambition's first, with no
 * grace period, ahead of milestones (`ambitionLifecycle.ts`). A bare "has been settled
 * for N ticks" predicate therefore fires immediately for any long-lived agent who was
 * already sitting still when the ambition was assigned — the inverted-risk failure
 * THR-812 fixed for `target_agent_eliminated`, and strictly worse than the dead ref it
 * replaces (never abandoning beats never running).
 *
 * `dwellTicks` fixes that arithmetically rather than by proxy: dwell is measured from
 * `max(arrivedTick, windowStartTick)`, and the caller passes the ambition's
 * `assignedTick` as the window start. A settledness trigger therefore **cannot** fire
 * before `assignedTick + minTicks`, whatever the agent was doing beforehand. That is a
 * guarantee, not the "the eligibility floor happens to exclude it" idiom the older
 * triggers rely on — and it reads as the prose does: *they set out, and then they
 * stopped*.
 */

/**
 * The read surface residence needs. Structurally satisfied by `WorldGraph` and by
 * `ConditionGraph` (`graphConditions.ts`); declared here so neither module has to
 * import the other.
 *
 * **Method syntax, not arrow properties, and that is load-bearing.** Under
 * `strictFunctionTypes` a function-valued *property* is checked contravariantly in its
 * parameters, so `getOutgoingEdges(id, type?: string)` would reject `WorldGraph`'s
 * `(id, edgeType?: EdgeType)` — a narrower parameter is not assignable to a wider one.
 * Method syntax is bivariant, which is the intended behaviour for a structural view
 * that only ever *calls* these. Writing it the other way compiles nowhere and the
 * error names the caller, not this declaration.
 */
export interface ResidenceReadGraph {
  getNode(id: string): { id: string; properties: Record<string, unknown> } | undefined;
  getOutgoingEdges(id: string, type?: string): ReadonlyArray<{ target: string }>;
}

/** The write surface `observeResidence` needs, on top of the read surface. */
export interface ResidenceWriteGraph extends ResidenceReadGraph {
  updateNode(id: string, updates: { properties: Record<string, unknown> }): void;
}

// ─── Property names ──────────────────────────────────────────────
//
// Flat properties on the actor node (NFP #2 — flat state, inspectable without a
// decoder). Named as constants so a rename is one edit and a typo is a compile error.

/** The first position this agent was ever observed at — its origin. */
export const ORIGIN_LOCATION_PROP = 'originLocationId';
/** The position observed at the most recent observation. */
export const RESIDENCE_POSITION_PROP = 'residencePositionId';
/** The tick at which the agent was first observed at `RESIDENCE_POSITION_PROP`. */
export const RESIDENCE_ARRIVED_PROP = 'residenceArrivedTick';

// ─── Tunable dwell thresholds ────────────────────────────────────
//
// A game day is 12 ticks. Both sit well above the 15-tick observation interval, so the
// quantization noted in the header cannot dominate the measurement.

/**
 * Six days of not moving, counted from the tick the ambition was taken up, before an
 * agent who set out to flee is judged to have stayed instead.
 */
export const SETTLED_DWELL_TICKS = 72;

/**
 * Ten days rooted somewhere that is not home before an exile is judged to have accepted
 * it. Longer than `SETTLED_DWELL_TICKS` on purpose: giving up on a homeland is a slower
 * surrender than giving up on a road.
 */
export const EXILE_ACCEPTED_DWELL_TICKS = 120;

// ─── Snapshot ────────────────────────────────────────────────────

/** Everything recorded about one agent's residence. Fields are absent before first observation. */
export interface ResidenceSnapshot {
  /** First position ever observed for this agent. */
  originLocationId?: string;
  /** Position observed at the last observation. */
  positionId?: string;
  /** Tick at which `positionId` was first observed. */
  arrivedTick?: number;
}

/** What one observation did, for the aggregate trace. */
export type ResidenceObservation = 'first-sighting' | 'moved' | 'unchanged' | 'no-position';

/**
 * Read an agent's recorded residence. Pure; absent fields mean "not observed yet",
 * never a default that would read as evidence.
 */
export function readResidence(graph: ResidenceReadGraph, agentId: string): ResidenceSnapshot {
  const node = graph.getNode(agentId);
  if (!node) return {};
  const origin = node.properties[ORIGIN_LOCATION_PROP];
  const position = node.properties[RESIDENCE_POSITION_PROP];
  const arrived = node.properties[RESIDENCE_ARRIVED_PROP];
  return {
    originLocationId: typeof origin === 'string' ? origin : undefined,
    positionId: typeof position === 'string' ? position : undefined,
    arrivedTick: typeof arrived === 'number' ? arrived : undefined,
  };
}

/**
 * The agent's current position from the graph — the target of its single `located_at`
 * edge, at whichever tier of the hex → location → sublocation model it occupies.
 */
export function currentPositionId(graph: ResidenceReadGraph, agentId: string): string | undefined {
  return graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;
}

/**
 * Observe one agent's position and record any change. Idempotent within a tick.
 *
 * Fail-soft (NFP #4): an agent with no node or no `located_at` edge is left untouched
 * and reported as `no-position` — an agent between positions has not *arrived*
 * anywhere, and inventing an arrival tick for it would manufacture settledness.
 */
export function observeResidence(
  graph: ResidenceWriteGraph,
  agentId: string,
  tick: number,
): ResidenceObservation {
  const node = graph.getNode(agentId);
  if (!node) return 'no-position';

  const position = currentPositionId(graph, agentId);
  if (position === undefined) return 'no-position';

  const previous = node.properties[RESIDENCE_POSITION_PROP];
  if (previous === position) return 'unchanged';

  const properties: Record<string, unknown> = {
    [RESIDENCE_POSITION_PROP]: position,
    [RESIDENCE_ARRIVED_PROP]: tick,
  };
  // Origin is written once, at the first sighting. For a seeded agent that is where the
  // world put it; for one spawned mid-run it is where it entered the world. Both are
  // honestly "where this agent is from" — and neither needs a seeding site to cooperate.
  if (typeof node.properties[ORIGIN_LOCATION_PROP] !== 'string') {
    properties[ORIGIN_LOCATION_PROP] = position;
  }

  // `updateNode` merges properties and replaces the node object, so `node` is a stale
  // handle after this call — nothing below reads it.
  graph.updateNode(agentId, { properties });

  return previous === undefined ? 'first-sighting' : 'moved';
}

/**
 * How long the agent has held its current position, counted from the later of its
 * arrival and `windowStartTick`.
 *
 * Returns `undefined` when the answer is unknown (never `0`, which a caller could
 * mistake for a measured result). See the header for why the window is load-bearing.
 */
export function dwellTicks(
  residence: ResidenceSnapshot,
  currentTick: number,
  windowStartTick?: number,
): number | undefined {
  if (residence.arrivedTick === undefined) return undefined;
  const from = windowStartTick === undefined
    ? residence.arrivedTick
    : Math.max(residence.arrivedTick, windowStartTick);
  return Math.max(0, currentTick - from);
}

/**
 * True when the agent's observed position is not the position it originated at.
 *
 * Both halves must be known: an agent with no recorded origin is not "away from home",
 * it is unmeasured, and the difference matters for a gate that ends an ambition.
 */
export function isAwayFromOrigin(residence: ResidenceSnapshot): boolean {
  if (residence.originLocationId === undefined) return false;
  if (residence.positionId === undefined) return false;
  return residence.positionId !== residence.originLocationId;
}
