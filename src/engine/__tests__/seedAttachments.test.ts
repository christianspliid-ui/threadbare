import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../../data/starter-attachments';
import type { CosmologyProfile, HexTile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function mockTiles(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland',
      });
    }
  }
  return tiles;
}

describe('seedAttachments', () => {
  it('adds all starter possession nodes to the graph', () => {
    const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const node of STARTER_POSSESSIONS) {
      expect(graph.getNode(node.id), `node ${node.id} missing`).toBeTruthy();
    }
  });

  it('adds all starter condition nodes to the graph', () => {
    const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (const node of STARTER_CONDITIONS) {
      expect(graph.getNode(node.id), `node ${node.id} missing`).toBeTruthy();
    }
  });

  describe('ind_0 — well-equipped warrior', () => {
    it('possesses starter_iron_blade with correct modifiers', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_0.possesses.starter_iron_blade');
      expect(edge).toBeTruthy();
      expect(edge?.type).toBe('possesses');
      expect(edge?.properties.modifiers).toEqual({ iron: 0.10 });
    });

    it('possesses starter_traveler_cloak', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_0.possesses.starter_traveler_cloak');
      expect(edge).toBeTruthy();
      expect(edge?.type).toBe('possesses');
    });

    it('has_trait starter_bruised_ribs with ticksRemaining and acquiredTick', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_0.has_trait.starter_bruised_ribs');
      expect(edge).toBeTruthy();
      expect(edge?.type).toBe('has_trait');
      expect(edge?.properties.ticksRemaining).toBe(12);
      expect(edge?.properties.totalTicks).toBe(20);
      expect(edge?.properties.acquiredTick).toBe(0);
      expect(edge?.properties.source).toBe('World seed');
    });
  });

  describe('ind_1 — mounted scout', () => {
    it('possesses starter_ashenmane_horse with cavalry grants', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_1.possesses.starter_ashenmane_horse');
      expect(edge).toBeTruthy();
      expect(edge?.properties.grants).toContain('cavalry_charge');
      expect(edge?.properties.grants).toContain('rapid_retreat');
    });

    it('has_trait starter_sun_touched with correct ticksRemaining', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_1.has_trait.starter_sun_touched');
      expect(edge).toBeTruthy();
      expect(edge?.properties.ticksRemaining).toBe(8);
      expect(edge?.properties.totalTicks).toBe(15);
    });
  });

  describe('ind_2 — scholar/mystic', () => {
    it('possesses starter_burned_codex', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      expect(graph.getEdge('seed.ind_2.possesses.starter_burned_codex')).toBeTruthy();
    });

    it('possesses starter_whispering_eye with veil modifier', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_2.possesses.starter_whispering_eye');
      expect(edge).toBeTruthy();
      expect(edge?.properties.modifiers).toMatchObject({ veil: 0.15, eye: 0.10 });
    });

    it('has_trait starter_revelation with correct modifiers from condition node', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_2.has_trait.starter_revelation');
      expect(edge).toBeTruthy();
      expect(edge?.properties.modifiers).toMatchObject({ star: 0.15, eye: 0.10 });
      expect(edge?.properties.ticksRemaining).toBe(15);
    });
  });

  describe('ind_3 — plague-touched traveler', () => {
    it('possesses starter_road_worn_mule', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      expect(graph.getEdge('seed.ind_3.possesses.starter_road_worn_mule')).toBeTruthy();
    });

    it('possesses starter_copper_market_rations', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      expect(graph.getEdge('seed.ind_3.possesses.starter_copper_market_rations')).toBeTruthy();
    });

    it('has_trait starter_plague_touched with correct ticksRemaining', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_3.has_trait.starter_plague_touched');
      expect(edge).toBeTruthy();
      expect(edge?.properties.ticksRemaining).toBe(25);
      expect(edge?.properties.totalTicks).toBe(40);
      expect(edge?.properties.modifiers).toMatchObject({ flesh: -0.10 });
    });
  });

  describe('ind_4 — elite with named weapon', () => {
    it('is bonded_to starter_ashenmane_fang with intimidate grant', () => {
      const { graph } = seedWorld(balancedCosmology(), mockTiles(), 42);
      const edge = graph.getEdge('seed.ind_4.bonded_to.starter_ashenmane_fang');
      expect(edge).toBeTruthy();
      expect(edge?.type).toBe('bonded_to');
      expect(edge?.properties.modifiers).toEqual({ iron: 0.15 });
      expect(edge?.properties.grants).toContain('intimidate');
    });
  });

  it('agents ind_5 and above have no starter attachment edges', () => {
    const { graph, individualIds } = seedWorld(balancedCosmology(), mockTiles(), 42);
    for (let i = 5; i < individualIds.length; i++) {
      const agentId = `ind_${i}`;
      const edges = graph.getOutgoingEdges(agentId).filter(
        e => e.type === 'possesses' || e.type === 'bonded_to' || e.type === 'has_trait'
      );
      // Cultural traits are granted via has_trait — filter to only seed attachment targets
      const starterIds = new Set([
        ...STARTER_POSSESSIONS.map(n => n.id),
        ...STARTER_CONDITIONS.map(n => n.id),
      ]);
      const attachmentEdges = edges.filter(e => starterIds.has(e.target));
      expect(attachmentEdges, `${agentId} should have no starter attachment edges`).toHaveLength(0);
    }
  });
});
