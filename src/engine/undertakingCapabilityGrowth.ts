/**
 * The capability rider — a completed undertaking grows the Reach it leaned on
 * (THR-1440, Christian's standing rider on the grid, THR-1397 2026-09-03).
 *
 * One writer, called from exactly one place: the **project** completion terminal in
 * `strategicActionLifecycle.ts`. Everything else about a Reach — the tier words, the
 * calling, the sheet — *reads* `domainCapabilities`; before this module nothing in
 * the undertaking lifecycle wrote it, so the rider was recorded on the map and paid
 * nowhere.
 *
 * **Why not the instant terminal too**, against the ticket's letter ("every cell
 * owes it"): an instant cell has no checkpoints and therefore cannot fail, so the
 * rider's own price clause — a failed or abandoned work grows nothing — has nothing
 * to bite on. Paid there it is a no-risk farm, and it was measured as one: with the
 * instant path paying, the starvation contract's hero (all eight Reaches zeroed,
 * stranded on a barren hex) never idles even at 60 ticks, because `observe × area`
 * always targets its own hex and the first free watch lifts Eye off zero, widening
 * awareness enough to supply the next. The full note is at the instant terminal.
 *
 * NFP #1: both numbers are named constants in `strategic-action-constants.ts`.
 * NFP #4: every seam here fails soft and returns `undefined` — a missing actor, a
 * missing template, a template with no reach profile, an actor that carries no
 * `domainCapabilities` at all (most of the world: 11 of 331 mortals on seed 42 /
 * small carry the field). No growth is never an error.
 */
import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { StrategicActionTemplate, UndertakingCapabilityGrowth } from '../types/strategicAction';
import {
  CAPABILITY_MAX,
  UNDERTAKING_COMPLETION_CAPABILITY_GROWTH,
  UNDERTAKING_DEFAULT_TIER,
} from '../data/strategic-action-constants';

/**
 * The Reach a work leaned on: the highest-weighted entry in the template's
 * `reachProfile`, tie-broken by `REACH_DOMAINS` order so the answer is deterministic
 * whatever order the profile's keys were written in (NFP #3).
 *
 * A cell's profile is `CELL_REACH_BY_VERB[verb]` — assigned at synthesis in
 * `undertaking-cells.ts` — and a legacy authored template carries its own, so both
 * models answer through this one read rather than through two lookups that could
 * disagree about what a `destroy` leans on.
 */
export function leaningReachOf(
  template: Pick<StrategicActionTemplate, 'reachProfile'> | undefined,
): ReachDomain | undefined {
  const profile = template?.reachProfile;
  if (!profile) return undefined;
  let best: ReachDomain | undefined;
  let bestWeight = -Infinity;
  // Walk in REACH_DOMAINS order and take strictly-greater only: the first domain in
  // canonical order wins a tie.
  for (const reach of REACH_DOMAINS) {
    const weight = profile[reach];
    if (weight === undefined) continue;
    if (weight > bestWeight) {
      bestWeight = weight;
      best = reach;
    }
  }
  return best;
}

/** What a completion of this tier pays. Absent tier falls to the default the grid uses. */
export function completionGrowthForTier(tier: 1 | 2 | 3 | undefined): number {
  return UNDERTAKING_COMPLETION_CAPABILITY_GROWTH[(tier ?? UNDERTAKING_DEFAULT_TIER) - 1];
}

/**
 * Pay the rider for one completed undertaking, returning what was paid so the caller
 * can carry it on the history entry and the completion trace.
 *
 * Mutates the actor node in place through `graph.updateNode`, which is the graph's
 * own writer and shallow-merges properties. The returned `delta` is what actually
 * landed after the `CAPABILITY_MAX` clamp — an already-saturated Reach returns
 * `undefined` rather than a zero-delta growth, so a reader never has to distinguish
 * "grew by nothing" from "grew".
 *
 * Call it BEFORE the calling recompute at the same terminal: a grown Reach that
 * crosses a tier should rename the mortal's calling on the same tick, which is the
 * point of the rider.
 */
export function growCapabilityOnCompletion(
  graph: WorldGraph,
  actorId: string,
  template: Pick<StrategicActionTemplate, 'reachProfile'> | undefined,
  tier: 1 | 2 | 3 | undefined,
): UndertakingCapabilityGrowth | undefined {
  const reach = leaningReachOf(template);
  if (!reach) return undefined;

  const node = graph.getNode(actorId);
  const caps = node?.properties?.domainCapabilities as Record<string, number> | undefined;
  // A mortal who carries no capability model is not given one by finishing a job —
  // the field is seeded on spotlight individuals and factions, and minting it here
  // would hand an ambient extra a protagonist's sheet.
  if (!caps || typeof caps !== 'object') return undefined;

  const current = typeof caps[reach] === 'number' ? caps[reach] : 0;
  if (current >= CAPABILITY_MAX) return undefined;

  const grown = Math.min(CAPABILITY_MAX, current + completionGrowthForTier(tier));
  const delta = grown - current;
  if (delta <= 0) return undefined;

  graph.updateNode(actorId, {
    properties: { ...node!.properties, domainCapabilities: { ...caps, [reach]: grown } },
  });

  return { reach, delta };
}
