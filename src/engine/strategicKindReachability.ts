/**
 * Strategic kind reachability — does this world contain an actor who can actually
 * pursue each strategic behaviour family? (THR-1329)
 *
 * **Why this exists.** A strategic template is only ever offered to an agent that
 * (a) reaches the autonomous decision loop in `phaseAgentDecision`, which runs the
 * *spotlight* tier only, and (b) holds an active ambition whose `strategicProfile`
 * lists that template. Both halves are silent when they fail. Nothing refuses, so
 * nothing is traced: `strategic_candidate_board` is never emitted for an agent that
 * never reaches the loop, and the board's own `refusals` array can only report
 * templates that were *considered*.
 *
 * The result is the failure THR-1329 measured. On seed 99, 195 of 722 actors are
 * eligible for `ambition_dominate_trade` and three actively pursue it — but all
 * three sit at `notable`/`ambient` tier, so the trade template is never a candidate,
 * `create_trade_route` is never called, and the `trade_route` kind cannot exist.
 * Meanwhile census liveness read 98.7%, its highest of either seed. A kind can be
 * perfectly live and perfectly absent at once, and no instrument said so.
 *
 * This module is that instrument. It answers one question per behaviour family —
 * *is there anybody in this world who could take this?* — and reports the tier split
 * when the answer is no, so "nobody qualified" is distinguishable from "the ones who
 * qualify have no agency path".
 *
 * **It deliberately does not widen anything.** A world whose merchants have no
 * viable partners is a legitimate world; a world where the only merchants are
 * ambient is a measurable fact. This reports, it does not remedy.
 */
import type { WorldGraph } from './graph';
import { profileWorkIds } from './strategicActionCandidates';
import type { GraphNode } from '../types/graph';
import type { AmbitionTemplate } from '../types/ambition';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import { getAmbitionTemplateId } from './ambitionShape';

/**
 * The tier whose actors run the autonomous decision loop.
 *
 * Legacy nodes without `spotlightTier` default to `spotlight`, matching
 * `phaseAgentDecision`'s own read — the default is load-bearing, not cosmetic,
 * because worldgen-era fixtures omit the property entirely.
 */
export const AUTONOMOUS_DECISION_TIER = 'spotlight';

/**
 * Does this node reach the autonomous decision loop at all?
 *
 * **Shared with `phaseAgentDecision` on purpose (THR-1329).** An instrument that
 * re-implements the population it measures drifts away from it silently, and then
 * reports reachability for a loop that no longer exists. The avatar exclusion stays
 * at the call site: the decision phase skips the player's avatar because the player
 * drives it, which is not a statement about whether the tier has agency.
 */
export function isAutonomousDecisionActor(node: GraphNode): boolean {
  return node.properties.actorType === 'individual'
    && (node.properties.spotlightTier ?? AUTONOMOUS_DECISION_TIER) === AUTONOMOUS_DECISION_TIER;
}

/** One behaviour family's standing in one world. */
export interface StrategicReachabilityRow {
  readonly ambitionId: string;
  readonly behaviorFamily: string;
  /** Templates that become unreachable when `reachable` is false. */
  readonly templateIds: readonly string[];
  /** Actors pursuing this ambition who reach the decision loop. The number that matters. */
  readonly autonomousHolders: number;
  /** Actors pursuing it who do NOT reach the loop — notable, ambient, non-individual. */
  readonly silencedHolders: number;
  /** True when at least one holder can act on it. */
  readonly reachable: boolean;
}

export interface StrategicReachabilityReport {
  readonly rows: readonly StrategicReachabilityRow[];
  /** Families with zero autonomous holders. */
  readonly unreachableFamilies: readonly string[];
  /** Every strategic template rendered unreachable, deduped across families. */
  readonly unreachableTemplateIds: readonly string[];
  /**
   * Families unreachable *despite* somebody pursuing them — the sharp case. A family
   * nobody wants is a world that made a choice; a family wanted only by actors with
   * no agency path is a gap between the ambition system and the decision loop.
   */
  readonly silencedFamilies: readonly string[];
  readonly autonomousActorCount: number;
}

/**
 * Measure which strategic behaviour families the given world can actually reach.
 *
 * Pure — reads the graph, writes nothing (NFP #2). `excludedActorIds` carries the
 * caller's own exclusions (the player's avatar) so this module does not have to know
 * what an avatar is.
 */
export function measureStrategicReachability(
  graph: WorldGraph,
  options: {
    readonly templates?: readonly AmbitionTemplate[];
    readonly excludedActorIds?: ReadonlySet<string>;
  } = {},
): StrategicReachabilityReport {
  const templates = options.templates ?? AMBITION_TEMPLATES;
  const excluded = options.excludedActorIds ?? new Set<string>();

  // One pass over the actors: for each ambition template id, how many holders reach
  // the loop and how many do not.
  const autonomous = new Map<string, number>();
  const silenced = new Map<string, number>();
  let autonomousActorCount = 0;

  for (const node of graph.getNodesByType('actor')) {
    if (excluded.has(node.id)) continue;
    const acts = isAutonomousDecisionActor(node);
    if (acts) autonomousActorCount++;

    for (const edge of graph.getOutgoingEdges(node.id, 'pursues')) {
      if ((edge.properties as Record<string, unknown> | undefined)?.status !== 'active') continue;
      // Ask the shape module rather than `properties.templateId` — the THR-1285
      // tripwire. A corrupt ambition node must not be counted as a holder of
      // whatever template id happens to be missing.
      const templateId = getAmbitionTemplateId(graph.getNode(edge.target));
      if (!templateId) continue;
      const bucket = acts ? autonomous : silenced;
      bucket.set(templateId, (bucket.get(templateId) ?? 0) + 1);
    }
  }

  const rows: StrategicReachabilityRow[] = [];
  for (const template of templates) {
    const profile = template.strategicProfile;
    if (!profile) continue; // No strategic profile — nothing to reach.
    const autonomousHolders = autonomous.get(template.id) ?? 0;
    rows.push({
      ambitionId: template.id,
      behaviorFamily: profile.behaviorFamily,
      templateIds: profileWorkIds(profile),
      autonomousHolders,
      silencedHolders: silenced.get(template.id) ?? 0,
      reachable: autonomousHolders > 0,
    });
  }

  const unreachable = rows.filter(r => !r.reachable);

  // A template is unreachable only when *no* reachable ambition offers it. Two
  // ambitions share `builder-civic` and two share `scholar-seeker`, and several
  // templates appear in more than one profile — so subtracting the reachable set is
  // load-bearing, not defensive. Taking the union of unreachable rows' templates
  // alone reported `strategic_craft_masterwork` as unreachable on a seed where a
  // second ambition offered it to five autonomous holders.
  const reachableTemplates = new Set(rows.filter(r => r.reachable).flatMap(r => r.templateIds));
  const unreachableTemplateIds = [
    ...new Set(unreachable.flatMap(r => r.templateIds)),
  ].filter(t => !reachableTemplates.has(t));

  // Same subtraction at the family level: `builder-civic` is carried by two
  // ambitions, so one of them having no holders does not make the family unreachable.
  const reachableFamilies = new Set(rows.filter(r => r.reachable).map(r => r.behaviorFamily));
  const unreachableFamilies = [
    ...new Set(unreachable.map(r => r.behaviorFamily)),
  ].filter(f => !reachableFamilies.has(f));

  return {
    rows,
    unreachableFamilies,
    unreachableTemplateIds,
    silencedFamilies: unreachableFamilies.filter(f =>
      unreachable.some(r => r.behaviorFamily === f && r.silencedHolders > 0)),
    autonomousActorCount,
  };
}
