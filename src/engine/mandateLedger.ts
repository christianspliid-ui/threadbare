/**
 * Mandate ledger — only the god's own hand fills the Mandate (THR-2081).
 *
 * The Mandate used to compare the world's whole total of the god's two spheres against
 * a baseline, so new towns, newborn mortals and trade drift filled it with no god
 * acting. It now counts the score the god's own pushes raised, weighted as the world
 * total weighs the entity, net of rival and doom wear on that same ground.
 *
 * Credits are computed in `phaseSpherePressure`, where each entity's pushes and the
 * score change they made are both in hand; `phaseMandate` folds them into
 * `mandateState.godLedger`. Pure functions, no PRNG (NFP 3).
 *
 * Plan: Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md
 */

import type { SphereName } from '../types/index';
import type { GameState } from '../types/gameState';
import type { MandateCredit, PressureSource, SpherePressureEvent } from '../types/sphereAffinity';
import type { SpherePressureTrace } from './phaseSpherePressure';
import { SPHERE_OPPOSITES } from './cosmology';

/** Writers that only ever push for the god (Dominion tending, attunement, THR-1935 prayer). */
export const GOD_ONLY_SOURCES: ReadonlySet<PressureSource> = new Set<PressureSource>([
  'claim', 'seat', 'carry', 'attunement', 'prayer_answered', 'unbidden_aid',
]);

/** Writers whose erosion takes back what the god built. */
export const OPPOSITION_SOURCES: ReadonlySet<PressureSource> = new Set<PressureSource>(['rival', 'doom']);

type Graph = GameState['graph'];

/** Writers whose push counts when the actor is a mortal the god holds a thread to. */
const THREADED_SCENE_SOURCES: ReadonlySet<PressureSource> = new Set<PressureSource>(['encounter', 'divine_action']);

/**
 * Was this push the god's doing? A god-only writer, a push the god itself caused, or
 * the scene of a mortal the god holds a thread to (plan Decision 2). A live scene
 * resolves as a unified action, so its push is `divine_action`; the legacy encounter
 * step is `encounter`. A push without `causedBy` from any other writer is never the
 * god's (fail-soft: an unlisted writer cannot inflate the Mandate).
 */
export function isGodCausedPush(p: SpherePressureEvent, graph: Graph, ascendantId: string): boolean {
  if (GOD_ONLY_SOURCES.has(p.source)) return true;
  if (!p.causedBy || !ascendantId) return false;
  if (p.causedBy === ascendantId) return true;
  if (!THREADED_SCENE_SOURCES.has(p.source)) return false;
  try {
    return graph.getOutgoingEdges(ascendantId, 'thread').some(e => e.target === p.causedBy);
  } catch {
    return false;
  }
}

function share(pushes: SpherePressureEvent[], sphere: SphereName, counts: (p: SpherePressureEvent) => boolean): number {
  let mine = 0;
  let all = 0;
  for (const p of pushes) {
    if (p.sphere !== sphere) continue;
    const m = Math.abs(p.magnitude);
    all += m;
    if (counts(p)) mine += m;
  }
  return all > 0 ? mine / all : 0;
}

/**
 * The Mandate credits one entity's resolved pressure makes. For each trace whose score
 * moved: a level-up credits `Δscore × weight × godShare` (the god's pushes' magnitude in
 * that sphere over all magnitude in it); an erosion debits `Δscore × weight × oppShare`
 * (rival and doom magnitude in the opposite sphere over all magnitude there). Zero
 * credits are dropped. `spheres`, when given, limits credits to the Mandate's two.
 */
export function mandateCreditsFor(
  entityId: string,
  weight: number,
  pressures: SpherePressureEvent[],
  traces: SpherePressureTrace[],
  isGod: (p: SpherePressureEvent) => boolean,
  spheres?: ReadonlySet<SphereName>,
): MandateCredit[] {
  if (!(weight > 0)) return [];
  const credits: MandateCredit[] = [];
  for (const t of traces) {
    if (spheres && !spheres.has(t.sphere)) continue;
    const delta = t.newScore - t.previousScore;
    if (delta > 0) {
      const godShare = share(pressures, t.sphere, isGod);
      const points = delta * weight * godShare;
      if (points > 0) credits.push({ entityId, sphere: t.sphere, points, cause: 'god', sources: t.sources });
    } else if (delta < 0) {
      const opp = SPHERE_OPPOSITES[t.sphere];
      if (!opp) continue;
      const oppShare = share(pressures, opp, p => OPPOSITION_SOURCES.has(p.source));
      const points = delta * weight * oppShare;
      if (points < 0) credits.push({ entityId, sphere: t.sphere, points, cause: 'opposition', sources: t.sources });
    }
  }
  return credits;
}

export interface MandateLedger {
  primary: number;
  secondary: number;
}

export interface AppliedMandateCredit extends MandateCredit {
  /** The signed points that actually moved the ledger (a debit is capped by what is held). */
  applied: number;
  ledgerAfter: number;
}

export function heldKey(entityId: string, sphere: SphereName): string {
  return `${entityId}|${sphere}`;
}

/**
 * Fold credits into the ledger. A credit adds to the ledger and to what the god holds
 * on that entity in that sphere; a debit takes back at most what is held there, so wear
 * on ground the god never touched costs nothing (plan Decision 3). Credits in any other
 * sphere are ignored. Pure: returns new objects.
 */
export function applyMandateCredits(
  ledger: MandateLedger,
  held: Record<string, number>,
  credits: MandateCredit[],
  primary: SphereName,
  secondary: SphereName,
): { ledger: MandateLedger; held: Record<string, number>; applied: AppliedMandateCredit[] } {
  const nextLedger = { ...ledger };
  const nextHeld = { ...held };
  const applied: AppliedMandateCredit[] = [];
  for (const c of credits) {
    const slot = c.sphere === primary ? 'primary' : c.sphere === secondary ? 'secondary' : null;
    if (!slot || !Number.isFinite(c.points) || c.points === 0) continue;
    const key = heldKey(c.entityId, c.sphere);
    let moved: number;
    if (c.points > 0) {
      moved = c.points;
      nextHeld[key] = (nextHeld[key] ?? 0) + moved;
    } else {
      const have = nextHeld[key] ?? 0;
      moved = -Math.min(have, -c.points);
      if (moved === 0) continue;
      const left = have + moved;
      if (left > 0) nextHeld[key] = left;
      else delete nextHeld[key];
    }
    nextLedger[slot] += moved;
    applied.push({ ...c, applied: moved, ledgerAfter: nextLedger[slot] });
  }
  return { ledger: nextLedger, held: nextHeld, applied };
}
