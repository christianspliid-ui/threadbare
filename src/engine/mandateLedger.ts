/**
 * Mandate ledger — only the god's own hand fills the Mandate (THR-2081).
 *
 * The Mandate used to compare the world's whole total of the god's two spheres against
 * a baseline, so new towns, newborn mortals and trade drift filled it with no god
 * acting. It now counts the score the god's own pushes raised, weighted as the world
 * total weighs the entity, net of rival and doom wear on that same ground — but not
 * doom's world-wide stage tide (THR-2090, `MANDATE_DOOM_STAGE_PUSH_EXEMPT`).
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
import { DOOM_STAGE_PUSH_SOURCE_PREFIX } from '../types/sphereAffinity';
import type { SpherePressureTrace } from './phaseSpherePressure';
import { SPHERE_OPPOSITES } from './cosmology';
import {
  MANDATE_DEED_BAND_FACTOR,
  MANDATE_DEED_BASE_POINTS,
  MANDATE_DEED_POINTS_PER_ESSENCE,
  MANDATE_TREND_WINDOW_TICKS,
} from '../data/game-config';

/** Writers that only ever push for the god (Dominion tending, attunement, THR-1935 prayer). */
export const GOD_ONLY_SOURCES: ReadonlySet<PressureSource> = new Set<PressureSource>([
  'claim', 'seat', 'carry', 'attunement', 'prayer_answered', 'unbidden_aid',
]);

/** Writers whose erosion takes back what the god built. */
export const OPPOSITION_SOURCES: ReadonlySet<PressureSource> = new Set<PressureSource>(['rival', 'doom']);

/**
 * THR-2090 Decision 1: doom's flat per-stage entropy push lands on every location of
 * every world, so it took back exactly one sphere (life) regardless of archetype. When
 * true, that tide still lands but is not opposition; doom's archetype stage cards and
 * rivals still are. `false` restores the THR-2081 ledger byte for byte.
 */
export const MANDATE_DOOM_STAGE_PUSH_EXEMPT = true;

/**
 * Does this push take back what the god built? A rival or doom writer, except doom's
 * stage tide while the exemption holds. A push with no `sourceId` is not the tide.
 */
export function isMandateOpposition(
  p: SpherePressureEvent,
  exemptTide: boolean = MANDATE_DOOM_STAGE_PUSH_EXEMPT,
): boolean {
  if (!OPPOSITION_SOURCES.has(p.source)) return false;
  return !(
    exemptTide
    && p.source === 'doom'
    && typeof p.sourceId === 'string'
    && p.sourceId.startsWith(DOOM_STAGE_PUSH_SOURCE_PREFIX)
  );
}

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
  // THR-2094: a re-aimed push's town copy; its Place copy carries the credit.
  if (p.townEcho) return false;
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
      const oppShare = share(pressures, opp, p => isMandateOpposition(p));
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

// ─── THR-2208 — a bound mortal's deeds fill the Mandate ──────────────────────────

/** The band a whole chapter ended on, read as a step band for the deed factor. */
export function deedBandOf(outcome: string | undefined): DeedBand {
  switch (outcome) {
    case 'critical_success': return 'critical_success';
    case 'success':
    case 'contested_won': return 'success';
    case 'success_at_cost': return 'success_at_cost';
    case 'near_miss': return 'near_miss';
    case 'critical_failure': return 'critical_failure';
    default: return 'failure';
  }
}

export type DeedBand = keyof typeof MANDATE_DEED_BAND_FACTOR;

export interface MandateDeedCreditInput {
  actorId: string;
  /** The chapter template's `sphereAffinity`. Absent ⇒ the base part is 0. */
  chapterSphere?: SphereName;
  band: DeedBand;
  /** Essence the god paid, per sphere, on this chapter's cards. Absent (old save) ⇒ `{}`. */
  mandateSphereSpend?: Partial<Record<SphereName, number>>;
  primary: SphereName;
  secondary: SphereName;
}

/**
 * The Mandate credit a threaded mortal's closed chapter earns (plan Decision 1). One
 * credit per Mandate sphere that earns anything: `(chapterSphere === s ? base : 0) +
 * spend[s] × perEssence`, times the band's factor. Spend in any other sphere (a Doom
 * card, say) earns nothing — that is the Law 30 choice. Pure, no PRNG.
 */
export function mandateDeedCredit(input: MandateDeedCreditInput): MandateCredit[] {
  const factor = MANDATE_DEED_BAND_FACTOR[input.band] ?? 0;
  if (!(factor > 0)) return [];
  const spheres = input.primary === input.secondary ? [input.primary] : [input.primary, input.secondary];
  const credits: MandateCredit[] = [];
  for (const s of spheres) {
    const base = input.chapterSphere === s ? MANDATE_DEED_BASE_POINTS : 0;
    const spent = Math.max(0, input.mandateSphereSpend?.[s] ?? 0);
    const points = (base + (Number.isFinite(spent) ? spent : 0) * MANDATE_DEED_POINTS_PER_ESSENCE) * factor;
    if (points > 0) {
      credits.push({ entityId: input.actorId, sphere: s, points, cause: 'god', sources: ['encounter'], source: 'deed' });
    }
  }
  return credits;
}

/**
 * Add one commit's per-sphere charge to a chapter's running total (summed across
 * commits). Zero and non-finite entries are dropped; returns the input when nothing
 * was paid, so an empty hand writes nothing.
 */
export function addMandateSphereSpend(
  prior: Partial<Record<SphereName, number>> | undefined,
  charged: Partial<Record<SphereName, number>>,
): Partial<Record<SphereName, number>> | undefined {
  let next: Partial<Record<SphereName, number>> | undefined = prior;
  for (const [sphere, amount] of Object.entries(charged) as [SphereName, number | undefined][]) {
    if (!amount || !Number.isFinite(amount) || amount <= 0) continue;
    next = { ...(next ?? {}), [sphere]: (next?.[sphere] ?? 0) + amount };
  }
  return next;
}

/** One move of the ledger inside the trend window. */
export interface LedgerMove { tick: number; points: number }

/**
 * Keep the ledger's moves inside the last `window` ticks and add this tick's net
 * (plan Decision 2). Returns the kept moves and their sum — the trend reads the sum:
 * above 0 Rising, below 0 Slipping, else Holding.
 */
export function rollLedgerWindow(
  prior: readonly LedgerMove[] | undefined,
  tick: number,
  net: number,
  window: number = MANDATE_TREND_WINDOW_TICKS,
): { moves: LedgerMove[]; delta: number } {
  const moves = (prior ?? []).filter(m => tick - m.tick < window);
  if (Number.isFinite(net) && net !== 0) moves.push({ tick, points: net });
  const delta = moves.reduce((sum, m) => sum + m.points, 0);
  return { moves, delta };
}

/** Floating-point slack for the trend: a window that nets to dust reads Holding. */
export const MANDATE_TREND_EPSILON = 1e-6;

/** The trend the god rail and the inspector read from the window's net (THR-2208). */
export function mandateTrendOf(recentLedgerDelta: number | undefined): 'rising' | 'steady' | 'ebbing' {
  const d = recentLedgerDelta ?? 0;
  if (d > MANDATE_TREND_EPSILON) return 'rising';
  if (d < -MANDATE_TREND_EPSILON) return 'ebbing';
  return 'steady';
}

const NO_SPHERES: ReadonlySet<SphereName> = new Set<SphereName>();

/**
 * THR-2208 — the spheres whose spend on this mortal's chapter will credit the Mandate:
 * the Mandate's two when the run has a sphere-growth Mandate and the mortal is bound to
 * the god by a thread; empty otherwise. Fail-soft: a graph read that throws ⇒ empty.
 */
export function mandateDeedSpheres(
  state: Pick<GameState, 'mandateDefinition' | 'ascendantId'> | null | undefined,
  graph: Graph,
  actorId: string,
): ReadonlySet<SphereName> {
  const def = state?.mandateDefinition;
  const ascendantId = state?.ascendantId;
  if (!def || def.runtimeKind !== 'sphere_growth' || !def.primarySphere || !def.secondarySphere) return NO_SPHERES;
  if (!ascendantId || actorId === ascendantId) return NO_SPHERES;
  try {
    const threaded = graph.getIncomingEdges(actorId, 'thread').some(e => e.source === ascendantId);
    return threaded ? new Set<SphereName>([def.primarySphere, def.secondarySphere]) : NO_SPHERES;
  } catch {
    return NO_SPHERES;
  }
}
