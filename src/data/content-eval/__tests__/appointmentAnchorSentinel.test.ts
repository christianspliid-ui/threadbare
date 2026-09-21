/**
 * THR-1518 — `$appointment`, so a PATH chip can link the place a promise binds the
 * mortal to.
 *
 * The engine-derived seed chip already links the appointment's place
 * (`buildAftermathConsequences` resolves the seed's own `locationId`); an *authored*
 * chip had no form that could. `$here` is where the scene is happening, which for a
 * `$cast:<key>` appointment is a different place, and a literal location id is minted
 * per world and correctly refused. So `check:chip-anchors` gains the form, conditional
 * like `$artifact` on the template actually planting one.
 *
 * ## Falsification
 *
 *   1. **A template that plants no appointment is refused.** The static half must say
 *      no when told `plantsAppointment: false`; otherwise every chip could claim a
 *      meeting and fail soft to text at render, which reads as a styling choice.
 *   2. **A junk sentinel is still refused**, and the refusal names the new form.
 *   3. **Resolution reads the promise edge, not the actor's position.** The actor
 *      stands at the town; the promise binds them to the crossroads. A resolver that
 *      fell through to `$here` would answer the town and look correct.
 *   4. **The soonest promise wins, by due tick, never by edge order.** Two promises,
 *      the later-due one inserted first.
 *   5. **Fail-soft returns `undefined`, never a wrong id** — no promise, a promise whose
 *      place is gone, a favour that is not an appointment, no actor.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import {
  ANCHOR_SENTINEL_APPOINTMENT,
  ANCHOR_SENTINEL_HERE,
  classifyAnchorDeclaration,
  resolveAnchorDeclaration,
} from '../chipAnchorDeclarations';

const noCastKeys = { supportKeys: new Set<string>() };

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-traveller', type: 'actor', name: 'Wren',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-stranger', type: 'actor', name: 'The Stranger',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc-town', type: 'location', name: 'Ashfall',
    properties: { locationSubtype: 'town', hexCol: 4, hexRow: 7 },
  });
  graph.addNode({
    id: 'loc-crossroads', type: 'location', name: 'The Wayside Crossroads',
    properties: { locationSubtype: 'crossroads', hexCol: 9, hexRow: 2 },
  });
  graph.addNode({
    id: 'loc-ford', type: 'location', name: 'The Ford',
    properties: { locationSubtype: 'ford', hexCol: 1, hexRow: 1 },
  });
  // The actor stands at the town — falsification arm 3's decoy answer.
  graph.addEdge({
    id: 'located_at_actor-traveller_loc-town',
    source: 'actor-traveller', target: 'loc-town', type: 'located_at', properties: {},
  });
  return graph;
}

/** The promise edge exactly as `encounterAftermath` writes it. */
function promise(
  graph: WorldGraph,
  id: string,
  block: { seedId: string; locationId: string; dueTick: number },
  target = 'actor-stranger',
): void {
  graph.addEdge({
    id,
    source: 'actor-traveller',
    target,
    type: 'owes_favor',
    properties: { favorType: 'meeting', magnitude: 0.5, appointment: block },
  });
}

function context(graph: WorldGraph, over: Record<string, unknown> = {}) {
  return {
    graph,
    actorId: 'actor-traveller',
    targetId: undefined,
    castNodeIdByKey: new Map<string, string>(),
    encounterTemplateId: 'encounter.slice.bargain_at_crossroads',
    ...over,
  } as Parameters<typeof resolveAnchorDeclaration>[1];
}

describe('THR-1518 — `$appointment` as a chip anchor', () => {
  describe('classification (the static half)', () => {
    it('accepts `$appointment` on a template that plants one', () => {
      expect(
        classifyAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, { ...noCastKeys, plantsAppointment: true }),
      ).toEqual({ ok: true, form: 'appointment' });
    });

    it('refuses `$appointment` on a template that plants none (falsification arm 1)', () => {
      const verdict = classifyAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, {
        ...noCastKeys,
        plantsAppointment: false,
      });
      expect(verdict.ok).toBe(false);
      expect(verdict.ok === false && verdict.reason).toContain('appointment');
    });

    it('accepts it when the caller cannot say — the static half asks "could this ever resolve"', () => {
      expect(classifyAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, noCastKeys))
        .toEqual({ ok: true, form: 'appointment' });
    });

    it('still refuses a sentinel this build does not resolve, and names the new form (arm 2)', () => {
      const verdict = classifyAnchorDeclaration('$appointments', noCastKeys);
      expect(verdict.ok).toBe(false);
      expect(verdict.ok === false && verdict.reason).toContain('not a sentinel this build resolves');
      expect(verdict.ok === false && verdict.reason).toContain(ANCHOR_SENTINEL_APPOINTMENT);
    });
  });

  describe('resolution (the runtime half)', () => {
    it('answers the place the promise binds them to, not where they stand (arm 3)', () => {
      const graph = buildWorld();
      promise(graph, 'owes_favor_appt_seed_1', { seedId: 'seed_1', locationId: 'loc-crossroads', dueTick: 140 });

      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, context(graph))).toBe('loc-crossroads');
      // The decoy: `$here` on the same world answers the town, so a resolver that
      // fell through to it would be caught by the assertion above.
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_HERE, context(graph))).toBe('loc-town');
    });

    it('picks the soonest-due promise, whatever order the edges were written in (arm 4)', () => {
      const graph = buildWorld();
      promise(graph, 'owes_favor_appt_seed_late', { seedId: 'seed_late', locationId: 'loc-ford', dueTick: 300 });
      promise(graph, 'owes_favor_appt_seed_soon', { seedId: 'seed_soon', locationId: 'loc-crossroads', dueTick: 140 });

      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, context(graph))).toBe('loc-crossroads');
    });

    it('still answers a broken promise — the reckoning chip is about the place they did not reach', () => {
      const graph = buildWorld();
      graph.addEdge({
        id: 'owes_favor_appt_seed_1',
        source: 'actor-traveller', target: 'actor-stranger', type: 'owes_favor',
        properties: {
          favorType: 'meeting', magnitude: 0.5, broken: true, brokenTick: 153,
          appointment: { seedId: 'seed_1', locationId: 'loc-crossroads', dueTick: 140 },
        },
      });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, context(graph))).toBe('loc-crossroads');
    });

    it('returns undefined, never a wrong id, when nothing binds them (arm 5)', () => {
      // No promise at all.
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, context(buildWorld()))).toBeUndefined();

      // A favour that is not an appointment.
      const plainFavour = buildWorld();
      plainFavour.addEdge({
        id: 'owes_favor_plain', source: 'actor-traveller', target: 'actor-stranger',
        type: 'owes_favor', properties: { favorType: 'debt', magnitude: 0.3 },
      });
      expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, context(plainFavour))).toBeUndefined();

      // A promise whose place the world has lost.
      const placeLost = buildWorld();
      promise(placeLost, 'owes_favor_appt_seed_1', { seedId: 'seed_1', locationId: 'loc-gone', dueTick: 140 });
      const resolved = resolveAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, context(placeLost));
      expect(resolved).toBeUndefined();
      expect(resolved).not.toBe('loc-town');

      // No actor in hand.
      const withPromise = buildWorld();
      promise(withPromise, 'owes_favor_appt_seed_1', { seedId: 'seed_1', locationId: 'loc-crossroads', dueTick: 140 });
      expect(
        resolveAnchorDeclaration(ANCHOR_SENTINEL_APPOINTMENT, context(withPromise, { actorId: undefined })),
      ).toBeUndefined();
    });
  });
});
