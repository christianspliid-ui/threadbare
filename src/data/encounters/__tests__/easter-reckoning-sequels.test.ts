/**
 * The Easter Reckoning's appointment sequels (THR-1757) — seed-only shape and registration.
 *
 * Both are hand-authored outside the package compiler (`easter-reckoning-sequels.ts`), so
 * no generated structural test covers them. This pins what the appointment relies on: both
 * ids resolve in the registry, neither reaches the board (THR-1526), neither declares an
 * envelope, and the missed branch never writes to `$here` (it fires wherever the mortal is).
 */

import { describe, expect, it } from 'vitest';
import {
  EASTER_RECKONING_DEFAULTED,
  EASTER_RECKONING_DEFAULTED_ID,
  EASTER_RECKONING_HEARD,
  EASTER_RECKONING_HEARD_ID,
  EASTER_RECKONING_SEQUELS,
} from '../easter-reckoning-sequels';
import { getUnifiedTemplateById } from '../../unified-action-templates';

describe('The Easter Reckoning sequels — seed-only appointment branches', () => {
  it('carries the two branch ids the appointment names', () => {
    expect(EASTER_RECKONING_SEQUELS.map(t => t.id)).toEqual([
      'town.easter_reckoning_heard',
      'town.easter_reckoning_defaulted',
    ]);
    expect(EASTER_RECKONING_HEARD.id).toBe(EASTER_RECKONING_HEARD_ID);
    expect(EASTER_RECKONING_DEFAULTED.id).toBe(EASTER_RECKONING_DEFAULTED_ID);
  });

  it('is registered, so the seed resolves when it comes due', () => {
    for (const id of [EASTER_RECKONING_HEARD_ID, EASTER_RECKONING_DEFAULTED_ID]) {
      expect(getUnifiedTemplateById(id), id).toBeDefined();
    }
  });

  it('never reaches the board: drawable false, no envelope', () => {
    for (const template of EASTER_RECKONING_SEQUELS) {
      expect(template.drawable, template.id).toBe(false);
      expect(template.locationSubtypes, template.id).toBeUndefined();
      expect(template.settings, template.id).toBeUndefined();
      expect(template.steps, template.id).toHaveLength(1);
    }
  });

  it('the missed branch never writes to $here', () => {
    const step = EASTER_RECKONING_DEFAULTED.steps[0];
    if (!('narrativeTemplate' in step)) throw new Error('expected a plain step');
    const effects = [...(step.successMetadata?.effects ?? []), ...(step.failureMetadata?.effects ?? [])];
    expect(effects.length).toBeGreaterThan(0);
    expect(JSON.stringify(effects)).not.toContain('$here');
  });
});
