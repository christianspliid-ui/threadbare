/**
 * The Returned Heir's appointment sequels (THR-1840) — seed-only shape and registration.
 *
 * Both are hand-authored outside the package compiler (`returned-heir-sequels.ts`), so
 * no generated structural test covers them. This pins what the appointment relies on: both
 * ids resolve in the registry, neither reaches the board (THR-1526), neither declares an
 * envelope, and the missed branch never writes to `$here` (it fires wherever the mortal is).
 */

import { describe, expect, it } from 'vitest';
import {
  RETURNED_HEIR_DEFAULTED,
  RETURNED_HEIR_DEFAULTED_ID,
  RETURNED_HEIR_SEQUELS,
  RETURNED_HEIR_SWORN,
  RETURNED_HEIR_SWORN_ID,
} from '../returned-heir-sequels';
import { getUnifiedTemplateById } from '../../unified-action-templates';

describe('The Returned Heir sequels — seed-only appointment branches', () => {
  it('carries the two branch ids the appointment names', () => {
    expect(RETURNED_HEIR_SEQUELS.map(t => t.id)).toEqual([
      'town.returned_heir_sworn',
      'town.returned_heir_defaulted',
    ]);
    expect(RETURNED_HEIR_SWORN.id).toBe(RETURNED_HEIR_SWORN_ID);
    expect(RETURNED_HEIR_DEFAULTED.id).toBe(RETURNED_HEIR_DEFAULTED_ID);
  });

  it('is registered, so the seed resolves when it comes due', () => {
    for (const id of [RETURNED_HEIR_SWORN_ID, RETURNED_HEIR_DEFAULTED_ID]) {
      expect(getUnifiedTemplateById(id), id).toBeDefined();
    }
  });

  it('never reaches the board: drawable false, no envelope', () => {
    for (const template of RETURNED_HEIR_SEQUELS) {
      expect(template.drawable, template.id).toBe(false);
      expect(template.locationSubtypes, template.id).toBeUndefined();
      expect(template.settings, template.id).toBeUndefined();
      expect(template.steps, template.id).toHaveLength(1);
    }
  });

  it('the missed branch never writes to $here', () => {
    const step = RETURNED_HEIR_DEFAULTED.steps[0];
    if (!('narrativeTemplate' in step)) throw new Error('expected a plain step');
    const effects = [...(step.successMetadata?.effects ?? []), ...(step.failureMetadata?.effects ?? [])];
    expect(effects.length).toBeGreaterThan(0);
    expect(JSON.stringify(effects)).not.toContain('$here');
  });
});
