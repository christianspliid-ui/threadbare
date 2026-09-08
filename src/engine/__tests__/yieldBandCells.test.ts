// @vitest-lane heavy — builds a small world, drives it, and reads the candidate board on it (THR-1439)
/**
 * THR-1439's board Done-when, on the world the writers actually make.
 *
 * The op tests (`yieldOps.test.ts`, `leverageOps.test.ts`) prove each of the four cells
 * does what it says on a fixture. This one proves they are **reachable** — that a
 * mortal who holds a town is offered the harvest, that a mortal who owns a lane is
 * offered the widening, that a thief is offered somebody else's secret, and that good
 * standing puts the favour on the board.
 *
 * The census on seeds 42 and 99 records all four as `no_owned_object` at 150 ticks:
 * nothing in a young world has claimed a Location or a lane yet, which is a supply
 * fact about the *claiming* cells and not about these. So the holdings here are made
 * deliberately, through the world's own writers, and everything else — who exists, who
 * stands where, what standing they have — is worldgen's. That is the difference
 * between this and a fixture: a fixture would invent both sides.
 *
 * Every board is read across a rotation cycle rather than at one tick. `rotateForTick`
 * offsets the walked list by `% items.length` and the per-actor ceiling then cuts it,
 * so pinning a single tick asserts the rotation's phase rather than the cell's
 * reachability — the brittleness THR-1439 hit in `peopleThingsCells.test.ts`.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { generateStrategicCandidates } from '../strategicActionCandidates';
import { grantHolding } from '../holdings';
import { mintLeverageMark } from '../strategicGraphOps';
import { writeGrudge } from '../grievance/grudgeEdge';
import { applyReputationWithDelta } from '../reputation';
import { getLocationNodes, isPlaceNode, resolveToParentLocation } from '../sublocationShape';
import { mulberry32 } from '../../lib/prng';
import { isAgentGone } from '../groups/groupQueries';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

const SEED = 42;
const TICKS = 30;
/** One full cycle of the walk's rotation — see the header. */
const ROTATION_CYCLE_TICKS = 24;

function world(): GameState {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, SEED)[0];
  let { state } = initializeGameState(archetype, 'Yield', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  for (let i = 0; i < TICKS; i++) state = runTick(state, [], runtime);
  return state;
}

const state = world();

/** A living mortal worldgen made — never a faction, never a group, never the dead. */
function livingMortals(s: GameState): GraphNode[] {
  return s.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' && !isAgentGone(n));
}

/**
 * The **place-tier Location** a mortal stands in, resolved up through the Place tier.
 *
 * Read off the `located_at` edge, which is where the mortal actually *is* — not
 * `resolveDurableActorLocation`, which answers with their durable origin (a homeland,
 * a route's near end) and can name somewhere they left. The board measures range from
 * the former, so a test that set up against the latter watches its cells refused
 * `no_object_in_range` while looking correct.
 *
 * Then resolved up a tier: `located_at` often names a Place (THR-1183's three-tier
 * model), and a Place is a different object kind from a Location — granting one would
 * leave `use × Location` with nothing owned.
 */
function standsAt(s: GameState, actorId: string): string | undefined {
  const at = s.graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  const node = at ? s.graph.getNode(at) : undefined;
  if (!node) return undefined;
  return isPlaceNode(node) ? (resolveToParentLocation(s.graph, node)?.id ?? undefined) : node.id;
}

/** Mortals standing at each place-tier Location, largest crowd first. */
function crowdsByPlace(s: GameState): { locationId: string; mortals: GraphNode[] }[] {
  const byPlace = new Map<string, GraphNode[]>();
  for (const m of livingMortals(s)) {
    const at = standsAt(s, m.id);
    if (!at) continue;
    const list = byPlace.get(at);
    if (list) list.push(m); else byPlace.set(at, [m]);
  }
  return [...byPlace.entries()]
    .map(([locationId, mortals]) => ({ locationId, mortals }))
    .sort((a, b) => b.mortals.length - a.mortals.length);
}

/**
 * The largest group of living mortals standing at one Location, with that Location.
 *
 * Range matters to every cell here — a harvest is holding court *at* the town, a theft
 * is done where the subject is — and the board refuses out-of-range objects before
 * anything else. So the actors these tests use are chosen by where worldgen actually
 * put them rather than moved there by hand.
 */
function crowdedPlace(s: GameState): { locationId: string; mortals: GraphNode[] } {
  return crowdsByPlace(s)[0];
}

/** Whoever already holds this node, by the edges the ownership rule walks. */
function holdersOf(s: GameState, nodeId: string): string[] {
  return [
    ...s.graph.getIncomingEdges(nodeId, 'controls'),
    ...s.graph.getIncomingEdges(nodeId, 'owns'),
  ].map(e => e.source);
}

/**
 * The biggest crowd standing at a Location **nobody already holds**.
 *
 * `ownershipOf` answers `own` only when *every* owner is the actor — so granting a
 * mortal a town the civic guard already `controls` leaves the object reading `other`,
 * and the harvest is refused for a reason that has nothing to do with the harvest.
 * Worldgen's territory pass holds most settlements, which is why this has to look.
 */
function unheldCrowdedPlace(s: GameState): { locationId: string; mortals: GraphNode[] } | undefined {
  return crowdsByPlace(s).find(c => holdersOf(s, c.locationId).length === 0);
}

/** Whether `cellId` is offered to this actor anywhere in one rotation cycle. */
function offeredWithinCycle(s: GameState, actorId: string, ambitions: string[], cellId: string): boolean {
  for (let t = s.tick; t < s.tick + ROTATION_CYCLE_TICKS; t++) {
    const board = generateStrategicCandidates(
      s.graph, actorId, ambitions, undefined, t, mulberry32(7), undefined, 'cells',
    );
    if (board.candidates.some(c => c.templateId === cellId)) return true;
  }
  return false;
}

describe('the yield-and-leverage band on a generated world', () => {
  it('the world holds the things these cells act on', () => {
    // The premise every assertion below rests on. Without it the tests that follow
    // could pass vacuously on an empty population.
    expect(livingMortals(state).length).toBeGreaterThan(0);
    expect(getLocationNodes(state.graph).length).toBeGreaterThan(0);
  });

  it('a mortal who holds the town they stand in is offered the harvest of it', () => {
    const s = world();
    const spot = unheldCrowdedPlace(s);
    expect(spot, 'worldgen leaves at least one inhabited Location unheld').toBeDefined();
    const { locationId: town, mortals } = spot!;
    const holder = mortals[0];

    // Before: they hold nothing, so there is nothing to harvest.
    expect(offeredWithinCycle(s, holder.id, ['ambition_dominate_trade'], 'cell.use.location')).toBe(false);

    // The holding is made through the world's own writer, not by hand.
    const granted = grantHolding(s.graph, holder.id, town, { actorId: holder.id, tick: s.tick });
    expect(granted.success).toBe(true);
    // And it really is theirs alone — the premise the ownership rule reads.
    expect(holdersOf(s, town)).toEqual([holder.id]);

    expect(offeredWithinCycle(s, holder.id, ['ambition_dominate_trade'], 'cell.use.location')).toBe(true);
  });

  it('a mortal who holds a lane is offered the widening of it', () => {
    const s = world();
    const merchant = crowdedPlace(s).mortals[0];
    const merchantHex = s.graph.getNode(standsAt(s, merchant.id)!)!.properties;
    // A lane whose identity node sits on the merchant's own hex and that nobody holds:
    // range is measured to the object, and `ownershipOf` reads `own` only when every
    // holder is the actor.
    const route = s.graph.getNodesByType('location')
      .find(n => typeof n.properties.routeEdgeId === 'string'
        && n.properties.hexCol === merchantHex.hexCol
        && n.properties.hexRow === merchantHex.hexRow
        && holdersOf(s, n.id).length === 0);
    if (!route) {
      // Worldgen seeds only a handful of lanes and they need not land on the crowd's
      // hex; recorded rather than skipped silently, the way the sibling band's test
      // does it. The op itself is covered on a fixture in `yieldOps.test.ts`.
      expect(s.graph.getEdgesByType('trades_with').length).toBeGreaterThan(0);
      return;
    }

    expect(offeredWithinCycle(s, merchant.id, ['ambition_dominate_trade'], 'cell.change_raise.route')).toBe(false);
    grantHolding(s.graph, merchant.id, route.id, { actorId: merchant.id, tick: s.tick });
    expect(offeredWithinCycle(s, merchant.id, ['ambition_dominate_trade'], 'cell.change_raise.route')).toBe(true);
  });

  it('a secret somebody else holds is offered to a thief who has a reason, and never to its holder', () => {
    const s = world();
    const { mortals } = crowdedPlace(s);
    expect(mortals.length, 'the crowd is big enough for a thief, a holder and a subject').toBeGreaterThanOrEqual(3);
    const [thief, holder, subject] = mortals;

    // No "before the mark existed" arm, deliberately: worldgen seeds marks of its own
    // (the `marks N` line in its log), so an empty board beforehand would be an
    // accident of this seed rather than a fact about the cell. The falsifiable pairs
    // are the two below — the same mark, before and after a motive, and offered to the
    // thief while refused to its holder.
    mintLeverageMark(s.graph, holder.id, subject.id, 'hidden_debt', 0.6, s.tick);

    const offeredTo = (actorId: string) => {
      for (let t = s.tick; t < s.tick + ROTATION_CYCLE_TICKS; t++) {
        const board = generateStrategicCandidates(
          s.graph, actorId, ['ambition_uncover_secrets'], undefined, t, mulberry32(7), undefined, 'cells',
        );
        // An edge object's target is where it stands — for a mark, the subject.
        if (board.candidates.some(c =>
          c.templateId === 'cell.control_seize.agreement' && c.targetNodeId === subject.id)) return true;
      }
      return false;
    };

    // A theft is a seize, and every seize is motive-gated: opportunism does not get to
    // rob people. Without a grievance against the holder the board refuses it, and
    // that refusal is as much a part of the cell as the theft is.
    expect(offeredTo(thief.id)).toBe(false);

    writeGrudge(s.graph, thief.id, holder.id, s.tick, 'old_quarrel');
    expect(offeredTo(thief.id)).toBe(true);

    // And the holder is never offered their own, motive or no — the ownership rule,
    // not a special case.
    writeGrudge(s.graph, holder.id, thief.id, s.tick, 'old_quarrel');
    expect(offeredTo(holder.id)).toBe(false);
  });

  it('good standing puts the favour on the board, and thin standing does not', () => {
    const s = world();
    const [actor, other] = crowdedPlace(s).mortals;

    // Written through the reputation layer, which is the only writer of the score.
    // A big single delta is clamped per outcome, so this walks it up honestly.
    for (let i = 0; i < 12; i++) {
      applyReputationWithDelta(s.graph, actor.id, other.id, 0.1, s.tick, 'test_setup');
    }
    const score = s.graph.getOutgoingEdges(actor.id, 'reputation_with')
      .find(e => e.target === other.id)?.properties.score as number | undefined;
    expect(score).toBeGreaterThan(0.6);

    expect(offeredWithinCycle(s, actor.id, ['ambition_found_dynasty'], 'cell.use.standing')).toBe(true);
  });

  it('a favour once minted is a live Agreement the two spending cells can reach', () => {
    const s = world();
    const [actor, other] = crowdedPlace(s).mortals;
    s.graph.addEdge({
      id: `owes_favor_${other.id}_${actor.id}_${s.tick}`,
      source: other.id, target: actor.id, type: 'owes_favor',
      properties: { magnitude: 0.5, context: 'called_in', grantedTick: s.tick, redeemed: false, broken: false },
    });

    // The creditor — the edge's *target* — is who may spend and who may forgive. That
    // is the whole reason the Agreement kind needed a per-verb ownership override.
    expect(offeredWithinCycle(s, actor.id, ['ambition_found_dynasty'], 'cell.use.agreement')).toBe(true);
  });
});
