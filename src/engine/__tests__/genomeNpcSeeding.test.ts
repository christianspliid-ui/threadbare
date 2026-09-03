/**
 * THR-1347 — `GenomeResult.npcs` reaches a generated world.
 *
 * **Every assertion here runs on `initializeGameState`, and none of them reads
 * `GenomeResult.npcs` as evidence of an outcome.** That is the whole point of the file.
 * `settlementGenome-materialize.test.ts` builds `GenomeResult` fixtures by hand and
 * asserts on what materialization produced; it was green for the entire life of the dead
 * read and would have stayed green under every arm of this ticket, because it never asks
 * whether an NPC node exists in a world. A field that reads as live while being inert can
 * only be falsified by counting actor nodes in a graph the seeder actually built.
 *
 * `genomeResult` is read in exactly one place below — as a *provenance cross-check* on
 * NPCs already found in the graph ("this role was authored here, not invented"). The
 * counts every claim rests on come from actor nodes.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import { isLocationNode, resolveToParentLocation } from '../sublocationShape';
import { GENOME_NPC_TOPUP_CAP, GENOME_NPC_PASS_PRIORITY } from '../settlementGenome/constants';
import type { GenomeResult } from '../settlementGenome/types';
import { LOCATION_ROLE_ROSTERS } from '../../types/npc';
import type { WorldGraph } from '../graph';

const SEEDS = [42, 99] as const;

/** The tiers that run the genome, and the `LOCATION_ROLE_ROSTERS` key each draws from. */
const TIER_ROSTER_KEY: Record<string, string> = {
  hamlet: 'hamlet',
  town: 'town',
  city: 'city',
  capital: 'capital',
};

interface StandingNpc {
  id: string;
  role: string;
  settlementId: string;
  tier: string;
  fromGenome: boolean;
  genomeSourcePass: string | undefined;
}

function generate(seed: number): WorldGraph {
  const archetype = generateArchetypes(4, seed)[0];
  const { cols, rows } = MAP_SIZE_PRESETS['medium'];
  const { state } = initializeGameState(
    archetype, 'GenomeNpcProbe', createBalancedCosmology(), seed, cols, rows,
  );
  return state.graph;
}

/** Genome-tier settlements in the graph, by id → tier. */
function settlementTiers(graph: WorldGraph): Map<string, string> {
  const tiers = new Map<string, string>();
  for (const node of graph.getNodesByType('location')) {
    if (!isLocationNode(node)) continue;
    const tier = node.properties.locationSubtype as string | undefined;
    if (tier && TIER_ROSTER_KEY[tier]) tiers.set(node.id, tier);
  }
  return tiers;
}

/**
 * Every individual NPC standing in a genome-tier settlement, resolved up from whatever
 * sublocation `NPC_ROLE_SUBLOCATION_MAP` placed it in.
 */
function standingNpcs(graph: WorldGraph, tiers: Map<string, string>): StandingNpc[] {
  const out: StandingNpc[] = [];
  for (const actor of graph.getNodesByType('actor')) {
    if (actor.properties.actorType !== 'individual') continue;
    const role = actor.properties.npcRole as string | undefined;
    if (!role) continue;
    const edge = graph.getOutgoingEdges(actor.id, 'located_at')[0];
    if (!edge) continue;
    const placement = resolveToParentLocation(graph, graph.getNode(edge.target));
    if (!placement) continue;
    const tier = tiers.get(placement.id);
    if (!tier) continue;
    out.push({
      id: actor.id,
      role,
      settlementId: placement.id,
      tier,
      fromGenome: actor.properties.npcSource === 'genome',
      genomeSourcePass: actor.properties.genomeSourcePass as string | undefined,
    });
  }
  return out;
}

describe('genome NPC seeding — generated worlds (THR-1347)', () => {
  for (const seed of SEEDS) {
    describe(`seed ${seed} / medium`, () => {
      const graph = generate(seed);
      const tiers = settlementTiers(graph);
      const npcs = standingNpcs(graph, tiers);

      it('generates genome-tier settlements populated with NPCs at all', () => {
        // Guards every assertion below against the vacuous-probe shape: a claim about a
        // population is worthless if the population is empty.
        expect(tiers.size).toBeGreaterThan(20);
        expect(npcs.length).toBeGreaterThan(200);
      });

      it('stands roles in the world that the tier roster cannot produce', () => {
        // The load-bearing assertion, and deliberately *not* "genome-stamped NPCs exist"
        // — that would only prove the stamp is written. `LOCATION_ROLE_ROSTERS` is the
        // only other producer of settlement NPCs, so a role absent from a settlement's
        // tier roster is a role no pre-THR-1347 world could hold. Reconstructing the
        // pre-change world exactly (drop the genome-stamped NPCs; the top-up is additive
        // and draws its names from its own PRNG stream, so it perturbed nothing else)
        // measured **0** on both seeds — against 87 here on seed 42 and 121 on seed 99.
        const offRoster = npcs.filter(
          n => !(LOCATION_ROLE_ROSTERS[TIER_ROSTER_KEY[n.tier]] ?? [])
            .some(entry => entry.role === n.role),
        );
        expect(offRoster.length).toBeGreaterThan(50);

        // ...and every one of them arrived through the genome path. If a role the roster
        // cannot produce ever appears without the genome stamp, a third producer has
        // grown, and this claim's baseline of 0 no longer holds.
        expect(offRoster.every(n => n.fromGenome)).toBe(true);
      });

      it('draws on all five genome passes, not just the cheap ones', () => {
        // `culture` and `reach` are the passes the eager worldgen genome cannot see, so
        // their presence here is what proves the top-up runs at the tail rather than
        // beside `seedNpcsAtLocations`. Seeding from the eager result would satisfy the
        // ticket's letter and leave 286 of 497 authored slots on seed 42 unreachable.
        const passes = new Set(
          npcs.filter(n => n.fromGenome).map(n => n.genomeSourcePass),
        );
        for (const pass of Object.keys(GENOME_NPC_PASS_PRIORITY)) {
          expect(passes).toContain(pass);
        }
      });

      it('never seeds the same role twice at one settlement', () => {
        // The double-seed check the ticket asks for, stated over the whole population
        // rather than over the two producers separately — that is the property that has
        // to hold no matter which producer minted which NPC.
        const bySettlement = new Map<string, Map<string, number>>();
        for (const n of npcs) {
          let counts = bySettlement.get(n.settlementId);
          if (!counts) bySettlement.set(n.settlementId, (counts = new Map()));
          counts.set(n.role, (counts.get(n.role) ?? 0) + 1);
        }
        const duplicated = [...bySettlement.entries()].flatMap(([settlementId, counts]) =>
          [...counts.entries()]
            .filter(([, count]) => count > 1)
            .map(([role, count]) => `${settlementId}/${role}×${count}`),
        );
        expect(duplicated).toEqual([]);
      });

      it('seeds only roles the settlement itself authored, within its tier cap', () => {
        const gained = new Map<string, StandingNpc[]>();
        for (const n of npcs) {
          if (!n.fromGenome) continue;
          const list = gained.get(n.settlementId) ?? [];
          list.push(n);
          gained.set(n.settlementId, list);
        }
        expect(gained.size).toBeGreaterThan(20);

        for (const [settlementId, list] of gained) {
          const settlement = graph.getNode(settlementId);
          const tier = settlement?.properties.locationSubtype as string;
          expect(list.length).toBeLessThanOrEqual(GENOME_NPC_TOPUP_CAP[tier] ?? 0);

          // The one `genomeResult` read in this file, and it is a cross-check on NPCs
          // already found in the graph — never the source of a count.
          const authored = new Set(
            ((settlement?.properties.genomeResult as GenomeResult | undefined)?.npcs ?? [])
              .map(entry => entry.role),
          );
          for (const n of list) expect(authored).toContain(n.role);
        }
      });
    });
  }

  it('is deterministic — the same seed builds the same genome NPCs', () => {
    const runs = [generate(42), generate(42)].map(graph => {
      const tiers = settlementTiers(graph);
      return standingNpcs(graph, tiers)
        .filter(n => n.fromGenome)
        .map(n => `${n.settlementId}|${n.role}|${n.genomeSourcePass}`)
        .sort();
    });
    expect(runs[0].length).toBeGreaterThan(50);
    expect(runs[0]).toEqual(runs[1]);
  });
});
