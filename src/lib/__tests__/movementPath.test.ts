/**
 * Tests for getFixedSlotOffset — fixed hex-geometry slot positioning.
 *
 * Verifies balanced distribution, angular positions, edge cases,
 * and no overlap between agent (edge-midpoint) and location (vertex) slots.
 */

import { describe, it, expect } from 'vitest';
import { getFixedSlotOffset, Point } from '../movementPath';

// Mirror the constants from agent-visual-content.ts
const VERTEX_ANGLES_DEG: readonly number[] = [0, 60, 120, 180, 240, 300];
const EDGE_MID_ANGLES_DEG: readonly number[] = [30, 90, 150, 210, 270, 330];
const SLOT_RING_RADIUS = 6;

/** Helper: distance between two points. */
function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

describe('getFixedSlotOffset', () => {
  describe('basic positioning', () => {
    it('returns offset at the expected radius', () => {
      const offset = getFixedSlotOffset(0, 1, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const r = Math.sqrt(offset.x ** 2 + offset.y ** 2);
      expect(r).toBeCloseTo(SLOT_RING_RADIUS, 5);
    });

    it('returns {0, 0} equivalent radius for 0 entities', () => {
      // 0 entities → empty indices → falls back to slotIdx 0, angleDeg from array
      // This is a fail-soft case: function still returns a valid point
      const offset = getFixedSlotOffset(0, 0, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      // Should return a point at SLOT_RING_RADIUS distance (fail-soft: picks slot 0)
      const r = Math.sqrt(offset.x ** 2 + offset.y ** 2);
      expect(r).toBeCloseTo(SLOT_RING_RADIUS, 5);
    });
  });

  describe('balanced distribution at each count (1-6)', () => {
    it('1 agent: single slot at 30° (top-right edge)', () => {
      const offset = getFixedSlotOffset(0, 1, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      // 30° - 90° = -60° → cos(-60°) * 6 = 3, sin(-60°) * 6 ≈ -5.196
      expect(offset.x).toBeCloseTo(3, 3);
      expect(offset.y).toBeCloseTo(-5.196, 2);
    });

    it('2 agents: opposite edges (30° and 210°)', () => {
      const a = getFixedSlotOffset(0, 2, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const b = getFixedSlotOffset(1, 2, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      // Opposite slots should be ~2*radius apart
      expect(dist(a, b)).toBeCloseTo(SLOT_RING_RADIUS * 2, 3);
    });

    it('3 agents: every other slot (120° apart)', () => {
      const offsets = [0, 1, 2].map(i =>
        getFixedSlotOffset(i, 3, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS),
      );
      // All pairwise distances should be equal (equilateral triangle)
      const d01 = dist(offsets[0], offsets[1]);
      const d12 = dist(offsets[1], offsets[2]);
      const d02 = dist(offsets[0], offsets[2]);
      expect(d01).toBeCloseTo(d12, 3);
      expect(d12).toBeCloseTo(d02, 3);
    });

    it('6 agents: all 6 slots occupied', () => {
      const offsets = [0, 1, 2, 3, 4, 5].map(i =>
        getFixedSlotOffset(i, 6, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS),
      );
      // All at same radius
      for (const o of offsets) {
        expect(Math.sqrt(o.x ** 2 + o.y ** 2)).toBeCloseTo(SLOT_RING_RADIUS, 5);
      }
      // All pairwise distances > 0 (no overlaps)
      for (let i = 0; i < offsets.length; i++) {
        for (let j = i + 1; j < offsets.length; j++) {
          expect(dist(offsets[i], offsets[j])).toBeGreaterThan(0.1);
        }
      }
    });
  });

  describe('location vertex slots', () => {
    it('1 location at vertex slot 0° (top)', () => {
      const offset = getFixedSlotOffset(0, 1, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS);
      // 0° - 90° = -90° → cos(-90°) * 6 ≈ 0, sin(-90°) * 6 = -6
      expect(offset.x).toBeCloseTo(0, 3);
      expect(offset.y).toBeCloseTo(-SLOT_RING_RADIUS, 3);
    });

    it('3 locations: equilateral distribution', () => {
      const offsets = [0, 1, 2].map(i =>
        getFixedSlotOffset(i, 3, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS),
      );
      const d01 = dist(offsets[0], offsets[1]);
      const d12 = dist(offsets[1], offsets[2]);
      const d02 = dist(offsets[0], offsets[2]);
      expect(d01).toBeCloseTo(d12, 3);
      expect(d12).toBeCloseTo(d02, 3);
    });
  });

  describe('no overlap between agent and location slots', () => {
    it('all 6 agent slots are distinct from all 6 location slots', () => {
      const agentOffsets = [0, 1, 2, 3, 4, 5].map(i =>
        getFixedSlotOffset(i, 6, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS),
      );
      const locOffsets = [0, 1, 2, 3, 4, 5].map(i =>
        getFixedSlotOffset(i, 6, VERTEX_ANGLES_DEG, SLOT_RING_RADIUS),
      );

      for (const a of agentOffsets) {
        for (const l of locOffsets) {
          // Minimum separation: 30° at radius 6 ≈ 3.1 world units
          expect(dist(a, l)).toBeGreaterThan(3.0);
        }
      }
    });
  });

  describe('edge cases / fail-soft', () => {
    it('entityIndex beyond available slots clamps to slot 0', () => {
      // 1 entity but index 5 → indices[5] is undefined → falls back to 0
      const offset = getFixedSlotOffset(5, 1, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const r = Math.sqrt(offset.x ** 2 + offset.y ** 2);
      expect(r).toBeCloseTo(SLOT_RING_RADIUS, 5);
    });

    it('totalEntities > 6 clamps to 6', () => {
      const offset = getFixedSlotOffset(0, 10, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const r = Math.sqrt(offset.x ** 2 + offset.y ** 2);
      expect(r).toBeCloseTo(SLOT_RING_RADIUS, 5);
    });

    it('negative totalEntities clamps to 0', () => {
      const offset = getFixedSlotOffset(0, -1, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const r = Math.sqrt(offset.x ** 2 + offset.y ** 2);
      expect(r).toBeCloseTo(SLOT_RING_RADIUS, 5);
    });

    it('empty slotAnglesDeg falls back to angle 0°', () => {
      const offset = getFixedSlotOffset(0, 1, [], SLOT_RING_RADIUS);
      // angle 0° - 90° = -90° → (0, -radius)
      expect(offset.x).toBeCloseTo(0, 3);
      expect(offset.y).toBeCloseTo(-SLOT_RING_RADIUS, 3);
    });
  });

  describe('determinism', () => {
    it('same inputs always produce same output', () => {
      const a = getFixedSlotOffset(2, 4, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      const b = getFixedSlotOffset(2, 4, EDGE_MID_ANGLES_DEG, SLOT_RING_RADIUS);
      expect(a.x).toBe(b.x);
      expect(a.y).toBe(b.y);
    });
  });
});
