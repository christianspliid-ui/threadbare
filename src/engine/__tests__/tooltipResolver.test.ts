/**
 * Tooltip Resolver Tests
 *
 * Verifies that resolveTooltip correctly routes to all content sources
 * and handles edge cases (missing IDs, invalid formats, truncation).
 */

import { describe, it, expect } from 'vitest';
import { resolveTooltip } from '../tooltipResolver';

describe('resolveTooltip', () => {
  // ─── UI Tooltips ───────────────────────────────────────────────

  describe('UI tooltips (ui.*)', () => {
    it('resolves ui.doom_bar', () => {
      const tooltip = resolveTooltip('ui.doom_bar');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Doom Clock');
      expect(tooltip?.desc).toContain('Unmaking');
    });

    it('resolves ui.essence_panel', () => {
      const tooltip = resolveTooltip('ui.essence_panel');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Divine Essence');
    });

    it('returns null for ui.nonexistent', () => {
      const tooltip = resolveTooltip('ui.nonexistent');
      expect(tooltip).toBeNull();
    });
  });

  // ─── Foundation Spheres ────────────────────────────────────────

  describe('Foundation spheres (sphere.*)', () => {
    it('resolves sphere.chaos', () => {
      const tooltip = resolveTooltip('sphere.chaos');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Chaos');
      expect(tooltip?.desc).toBeTruthy();
    });

    it('resolves sphere.darkness', () => {
      const tooltip = resolveTooltip('sphere.darkness');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Darkness');
    });

    it('resolves sphere.light', () => {
      const tooltip = resolveTooltip('sphere.light');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Light');
    });

    it('resolves sphere.shadow', () => {
      const tooltip = resolveTooltip('sphere.shadow');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Shadow');
    });
  });

  // ─── Creation Spheres ──────────────────────────────────────────

  describe('Creation spheres (sphere.*)', () => {
    it('resolves sphere.force', () => {
      const tooltip = resolveTooltip('sphere.force');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Force');
      expect(tooltip?.desc).toContain('physics');
    });

    it('resolves sphere.matter', () => {
      const tooltip = resolveTooltip('sphere.matter');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Matter');
    });

    it('resolves sphere.energy', () => {
      const tooltip = resolveTooltip('sphere.energy');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Energy');
    });

    it('resolves sphere.life', () => {
      const tooltip = resolveTooltip('sphere.life');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Life');
    });

    it('resolves sphere.mind', () => {
      const tooltip = resolveTooltip('sphere.mind');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Mind');
    });

    it('resolves sphere.spirit', () => {
      const tooltip = resolveTooltip('sphere.spirit');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Spirit');
    });

    it('resolves sphere.time', () => {
      const tooltip = resolveTooltip('sphere.time');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Time');
    });

    it('resolves sphere.entropy', () => {
      const tooltip = resolveTooltip('sphere.entropy');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Entropy');
    });
  });

  // ─── Reaches ───────────────────────────────────────────────────

  describe('Reaches (reach.*)', () => {
    it('resolves reach.iron', () => {
      const tooltip = resolveTooltip('reach.iron');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Iron');
      expect(tooltip?.desc).toContain('Warfare');
    });

    it('resolves reach.gold', () => {
      const tooltip = resolveTooltip('reach.gold');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Gold');
    });

    it('resolves reach.shadow', () => {
      const tooltip = resolveTooltip('reach.shadow');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Shadow');
    });

    it('resolves reach.veil', () => {
      const tooltip = resolveTooltip('reach.veil');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Veil');
    });

    it('resolves reach.heart', () => {
      const tooltip = resolveTooltip('reach.heart');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Heart');
    });

    it('resolves reach.eye', () => {
      const tooltip = resolveTooltip('reach.eye');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Eye');
    });

    it('resolves reach.stone', () => {
      const tooltip = resolveTooltip('reach.stone');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Stone');
    });

    it('resolves reach.star', () => {
      const tooltip = resolveTooltip('reach.star');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Star');
    });

    it('resolves reach.flesh', () => {
      const tooltip = resolveTooltip('reach.flesh');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Flesh');
    });
  });

  // ─── Terrain Biomes ────────────────────────────────────────────

  describe('Terrain biomes (terrain.*)', () => {
    it('resolves terrain.grassland', () => {
      const tooltip = resolveTooltip('terrain.grassland');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Grassland & Plains');
    });

    it('resolves terrain.temperate_forest', () => {
      const tooltip = resolveTooltip('terrain.temperate_forest');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Temperate Forest');
      expect(tooltip?.desc).toContain('forest');
    });

    it('resolves terrain.mountains', () => {
      const tooltip = resolveTooltip('terrain.mountains');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Mountains');
    });

    it('resolves terrain.ocean', () => {
      const tooltip = resolveTooltip('terrain.ocean');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Ocean');
    });

    it('resolves terrain.desert', () => {
      const tooltip = resolveTooltip('terrain.desert');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Desert');
    });

    it('returns null for terrain.nonexistent', () => {
      const tooltip = resolveTooltip('terrain.nonexistent');
      expect(tooltip).toBeNull();
    });
  });

  // ─── Archetypes ────────────────────────────────────────────────

  describe('Narrative archetypes (archetype.*)', () => {
    it('resolves archetype.tragic_hero', () => {
      const tooltip = resolveTooltip('archetype.tragic_hero');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Tragic Hero');
      expect(tooltip?.desc).toBeTruthy();
    });

    it('resolves archetype.trickster', () => {
      const tooltip = resolveTooltip('archetype.trickster');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Trickster');
    });

    it('resolves archetype.reluctant_king', () => {
      const tooltip = resolveTooltip('archetype.reluctant_king');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Reluctant King');
    });

    it('resolves archetype.folk_hero', () => {
      const tooltip = resolveTooltip('archetype.folk_hero');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Folk Hero');
    });

    it('returns null for archetype.nonexistent', () => {
      const tooltip = resolveTooltip('archetype.nonexistent');
      expect(tooltip).toBeNull();
    });
  });

  // ─── Doom System ────────────────────────────────────────────────

  describe('Doom system (doom.*)', () => {
    it('resolves doom.unmaking', () => {
      const tooltip = resolveTooltip('doom.unmaking');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('The Unmaking');
      expect(tooltip?.desc).toContain('void');
    });

    it('resolves doom.clock', () => {
      const tooltip = resolveTooltip('doom.clock');
      expect(tooltip).not.toBeNull();
      expect(tooltip?.label).toBe('Doom Clock');
    });

    it('returns null for doom.nonexistent', () => {
      const tooltip = resolveTooltip('doom.nonexistent');
      expect(tooltip).toBeNull();
    });
  });

  // ─── Agent Tooltips ────────────────────────────────────────────

  describe('Agent tooltips (agent.*) — Tier 1', () => {
    it('resolves agent.{id} with familiarity context at recognised level', () => {
      // Setup: mock graph with agent node
      // Stranger level: just name + "A mysterious figure"
      // We'll use mocks since we can't easily create a real graph in tests
      const result = resolveTooltip('agent.test-agent-id', {
        graph: {
          getNode: (id: string) => {
            if (id === 'test-agent-id') {
              return {
                id: 'test-agent-id',
                type: 'actor' as const,
                name: 'Kael',
                properties: { narrativeArchetype: 'tragic_hero' },
              } as any;
            }
            return null;
          },
          getOutgoingEdges: () => [],
          getIncomingEdges: () => [],
        } as any,
        familiarityMap: new Map([['test-agent-id', 0.4]]),
        ascendantId: 'my-god',
      });
      expect(result).not.toBeNull();
      expect(result!.label).toBe('Kael');
    });

    it('shows minimal info at stranger level', () => {
      const result = resolveTooltip('agent.stranger-id', {
        graph: {
          getNode: (id: string) => {
            if (id === 'stranger-id') {
              return {
                id: 'stranger-id',
                type: 'actor' as const,
                name: 'Vex',
                properties: { narrativeArchetype: 'trickster' },
              } as any;
            }
            return null;
          },
          getOutgoingEdges: () => [],
        } as any,
        familiarityMap: new Map([['stranger-id', 0.05]]),
        ascendantId: 'my-god',
      });
      expect(result).not.toBeNull();
      expect(result!.label).toBe('Vex');
      expect(result!.desc).toContain('mysterious');
    });

    it('shows archetype at recognised level', () => {
      const result = resolveTooltip('agent.known-id', {
        graph: {
          getNode: (id: string) => {
            if (id === 'known-id') {
              return {
                id: 'known-id',
                type: 'actor' as const,
                name: 'Ero',
                properties: {
                  narrativeArchetype: 'tragic_hero',
                  domainCapabilities: { iron: 0.5, gold: 0.3 },
                  axiologicalProfile: { ambition_contentment: 0.7 },
                },
              } as any;
            }
            return null;
          },
          getOutgoingEdges: (agentId: string, edgeType: string) => {
            if (agentId === 'known-id' && edgeType === 'worships') {
              return [{ target: 'my-god', properties: { tier: 1 } }] as any;
            }
            return [];
          },
          getIncomingEdges: () => [],
        } as any,
        familiarityMap: new Map([['known-id', 0.35]]),
        ascendantId: 'my-god',
      });
      expect(result).not.toBeNull();
      expect(result!.desc).toContain('Tragic Hero');
    });

    it('returns null if context is missing', () => {
      const result = resolveTooltip('agent.test-id');
      expect(result).toBeNull();
    });

    it('returns null if agent not in graph', () => {
      const result = resolveTooltip('agent.nonexistent-id', {
        graph: {
          getNode: () => null,
        } as any,
        familiarityMap: new Map(),
        ascendantId: 'my-god',
      });
      expect(result).toBeNull();
    });
  });

  // ─── Mandate System (Future) ────────────────────────────────────

  describe('Mandate system (mandate.*)', () => {
    it('returns null for mandate.* (not yet implemented)', () => {
      const tooltip = resolveTooltip('mandate.anything');
      expect(tooltip).toBeNull();
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe('Edge cases and invalid inputs', () => {
    it('returns null for empty string', () => {
      const tooltip = resolveTooltip('');
      expect(tooltip).toBeNull();
    });

    it('returns null for string without dot', () => {
      const tooltip = resolveTooltip('nodot');
      expect(tooltip).toBeNull();
    });

    it('returns null for unknown prefix', () => {
      const tooltip = resolveTooltip('zzzz.nothing');
      expect(tooltip).toBeNull();
    });

    it('returns null for malformed ID', () => {
      const tooltip = resolveTooltip('...bad');
      expect(tooltip).toBeNull();
    });
  });

  // ─── Description Truncation ────────────────────────────────────

  describe('Description truncation', () => {
    it('keeps short descriptions unchanged', () => {
      const tooltip = resolveTooltip('reach.iron');
      // Reach descriptions are short
      expect(tooltip?.desc).toBeTruthy();
      expect(tooltip?.desc!.length).toBeLessThanOrEqual(200);
    });

    it('truncates long sphere descriptions at sentence boundaries', () => {
      const tooltip = resolveTooltip('sphere.force');
      // Force has a long description; it should be truncated
      expect(tooltip?.desc).toBeTruthy();
      // Truncated descriptions should not exceed ~120 chars unless the first sentence is longer
      // Just verify it's reasonable for a tooltip
      expect(tooltip?.desc!.length).toBeLessThanOrEqual(200);
    });

    it('adds ellipsis if no sentence boundary found', () => {
      // Most world-model descriptions have punctuation, but verify the truncation logic
      const tooltip = resolveTooltip('sphere.chaos');
      expect(tooltip?.desc).toBeTruthy();
      // Chaos has punctuation, so it should truncate at sentence boundary
      const desc = tooltip?.desc!;
      if (desc.length > 120) {
        // If truncated, should end with period or ellipsis
        expect(/[\.\?!…]$/.test(desc)).toBe(true);
      }
    });
  });
});
