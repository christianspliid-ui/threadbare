/**
 * Snapshot audit: encounterTypeToCrud mapping for all 10 EncounterType values.
 * Locks the audit conclusion from 2026-04-17 (THR-90) as a regression gate.
 * If this test fails, a contributor changed the mapping — update the JSDoc in
 * unified-action-templates.ts and add a rationale comment before changing this snapshot.
 */
import { describe, it, expect } from 'vitest';
import { encounterTypeToCrud } from '../unified-action-templates';
import type { EncounterType } from '../../types/encounter';

const EXPECTED_MAPPINGS: Record<EncounterType, 'create' | 'read' | 'update' | 'delete'> = {
  // Establishment / creation
  create: 'create',
  hire:   'create',
  build:  'create',
  // Extraction / gathering (steal stays 'read' — value redistributed, not destroyed)
  explore: 'read',
  acquire: 'read',
  steal:   'read',
  trade:   'read',
  // Removal
  duel: 'delete',
  // Modification / state change
  assist: 'update',
  lead:   'update',
};

describe('encounterTypeToCrud audit (THR-90)', () => {
  it('maps all 10 EncounterType values to the documented CRUD classification', () => {
    for (const [type, expected] of Object.entries(EXPECTED_MAPPINGS) as [EncounterType, string][]) {
      expect(
        encounterTypeToCrud(type),
        `encounterType '${type}' should map to '${expected}'`,
      ).toBe(expected);
    }
  });

  it('covers all 10 EncounterType values (no gaps)', () => {
    expect(Object.keys(EXPECTED_MAPPINGS)).toHaveLength(10);
  });

  it('returns update for unknown future types (fail-soft default)', () => {
    expect(encounterTypeToCrud('unknown_future_type')).toBe('update');
  });
});
