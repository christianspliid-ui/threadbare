/**
 * Remembrance milestone prose — reachability tests (THR-1198).
 *
 * The defect this ticket closed was not malformed content: the 48 template
 * strings were well-formed for months while reaching no player, because they
 * were keyed to ids no live game mints. Shape assertions were green the whole
 * time. So these tests assert *reachability* through the production resolver,
 * against ids derived from the same sources `generateRememberedMandate` derives
 * them from — the Hunger catalog and the sphere list — rather than from a
 * hand-written fixture that could invent both sides.
 */

import { describe, it, expect } from 'vitest';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import {
  REMEMBRANCE_HUNGER_PROSE,
  REMEMBRANCE_SPHERE_PROSE,
} from '../../data/mandate-remembrance-prose';
import { SPHERE_NAMES } from '../../types/index';
import {
  resolveMilestoneProse,
  type MandateProseTransition,
} from '../mandateMilestoneProse';

const TRANSITIONS: MandateProseTransition[] = [
  'setup_to_escalation',
  'escalation_to_culmination',
  'completed',
  'failed',
];

/** Never a real line, so a fallback can never be mistaken for authored text. */
const SENTINEL = '__NO_AUTHORED_PROSE__';

describe('remembrance milestone prose', () => {
  // A population this small is worth pinning: every sweep below iterates one of
  // these two lists, and an empty list would pass each of them vacuously.
  it('sweeps a non-empty population', () => {
    expect(HUNGER_CATALOG.length).toBe(12);
    expect(SPHERE_NAMES.length).toBe(12);
    expect(TRANSITIONS.length).toBe(4);
  });

  describe('the identity path — mandate.remembrance.{hunger}', () => {
    it('every Hunger resolves authored prose for every transition', () => {
      for (const hunger of HUNGER_CATALOG) {
        // The exact id shape gameInit:512 mints via generateRememberedMandate.
        const mandateId = `mandate.remembrance.${hunger.id}`;
        for (const transition of TRANSITIONS) {
          const resolved = resolveMilestoneProse(mandateId, transition, SENTINEL);
          expect(
            resolved.authored,
            `${mandateId}.${transition} is unreachable`,
          ).toBe(true);
          expect(resolved.text).not.toBe(SENTINEL);
          expect(resolved.key).toBe(`remembrance.${hunger.id}.${transition}`);
        }
      }
    });

    it("prefers the god's own Hunger over its sphere family", () => {
      const gather = HUNGER_CATALOG.find((h) => h.id === 'gather');
      expect(gather).toBeDefined();
      const primary = gather!.sphereAlignment.primary;

      const resolved = resolveMilestoneProse(
        'mandate.remembrance.gather',
        'completed',
        SENTINEL,
        primary,
      );
      expect(resolved.key).toBe('remembrance.gather.completed');
      expect(resolved.text).not.toBe(
        REMEMBRANCE_SPHERE_PROSE[`remembrance.sphere.${primary}.completed`],
      );
    });
  });

  describe('the identity-less path — mandate.remembrance.{primary}_{secondary}', () => {
    it('every one of the 132 ordered sphere pairs resolves authored prose', () => {
      let pairsChecked = 0;

      for (const primary of SPHERE_NAMES) {
        for (const secondary of SPHERE_NAMES) {
          if (primary === secondary) continue;
          pairsChecked++;
          // The exact id shape gameInit:306 mints when no identity exists.
          const mandateId = `mandate.remembrance.${primary}_${secondary}`;
          for (const transition of TRANSITIONS) {
            const resolved = resolveMilestoneProse(
              mandateId,
              transition,
              SENTINEL,
              primary,
            );
            expect(
              resolved.authored,
              `${mandateId}.${transition} is unreachable`,
            ).toBe(true);
            expect(resolved.key).toBe(
              `remembrance.sphere.${primary}.${transition}`,
            );
          }
        }
      }

      // 12 spheres × 11 — the measured key space the sphere table exists to cover.
      expect(pairsChecked).toBe(132);
    });
  });

  describe('fallback', () => {
    it('falls back when nothing is authored and no sphere is supplied', () => {
      const resolved = resolveMilestoneProse(
        'mandate.remembrance.chaos_energy',
        'completed',
        'fallback line',
      );
      expect(resolved.authored).toBe(false);
      expect(resolved.text).toBe('fallback line');
      expect(resolved.key).toBeUndefined();
    });

    it('falls back for an id belonging to no authored family', () => {
      const resolved = resolveMilestoneProse(
        'mandate.no_such_mandate',
        'failed',
        'fallback line',
      );
      expect(resolved.authored).toBe(false);
      expect(resolved.text).toBe('fallback line');
    });
  });

  describe('content shape', () => {
    it('authors exactly the two tables the resolver reads, with no collisions', () => {
      expect(Object.keys(REMEMBRANCE_HUNGER_PROSE)).toHaveLength(12 * 4);
      expect(Object.keys(REMEMBRANCE_SPHERE_PROSE)).toHaveLength(12 * 4);

      const overlap = Object.keys(REMEMBRANCE_HUNGER_PROSE).filter(
        (k) => k in REMEMBRANCE_SPHERE_PROSE,
      );
      expect(overlap).toEqual([]);
    });

    it('every line is a substantial, non-exclamatory sentence', () => {
      const all = { ...REMEMBRANCE_HUNGER_PROSE, ...REMEMBRANCE_SPHERE_PROSE };
      for (const [key, text] of Object.entries(all)) {
        expect(typeof text).toBe('string');
        expect(text.length, `${key} is too short to be a beat`).toBeGreaterThan(40);
        // Threadbare voice: no exclamation marks, no breathless enthusiasm.
        expect(text, `${key} carries an exclamation mark`).not.toMatch(/!/);
      }
    });
  });
});
