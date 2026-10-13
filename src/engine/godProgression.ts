/**
 * God-card progression — the ladder and the world's offering (THR-1811).
 *
 * Plan: `Docs/plans/2026-10-13-thr-1811-god-card-progression-and-offerings.md`.
 *
 * Pure reads over GameState + the template catalog. Nothing here writes: the rung
 * detector lives in `phaseAscendantProgression`, the offering draw and the take-up in
 * `ascendantBeat.ts`. Every caller reads the same functions, so the drawer, the
 * offering, the modal and the debug bridge never disagree about a price.
 *
 *  - The rung reads the sum of attunement marks over the god's bought spheres
 *    (`getAttunementMarksCrossed`, THR-1765). Rung 1 opens when the spine ends.
 *  - A market card at or below the open rung, not held, inside the god's reaches,
 *    may be offered. The sphere gate is off by default (`OFFERING_IN_SPHERE_ONLY`).
 *  - The price is essence *earned* through the card's sphere, less what was already
 *    spent on offerings (`offeringSpentBySphere`). The earned counter is never written.
 *
 * NFP #3: no randomness here except `drawOffering`, which takes the caller's seeded
 * rng and calls it once per pick. NFP #4: every read fails soft to "nothing".
 */

import type { GameState } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { CardProgression, UnifiedActionTemplate } from '../types/unifiedAction';
import type { BeatDefinition, GodProgressionState } from '../types/ascendantBeat';
import type { AscendantProperties } from '../types/influence';
import type { ReachDomain } from '../types/traits';
import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../data/unified-action-templates';
import { TICKS_PER_DAY } from '../data/attention-constants';
import {
  PROGRESSION_RUNG_MARKS,
  PROGRESSION_MAX_RUNG,
  PRICE_BY_TIER,
  OFFERING_PRICE_ESCALATION,
  OFF_SPHERE_PRICE_MULT,
  OFFERING_SIZE,
  OFFERING_MIN_TTL_TICKS,
  OFFERING_IN_SPHERE_ONLY,
  FRESH_RUNG_WEIGHT,
  SECONDARY_SIGNATURE_RUNG,
  SECONDARY_SIGNATURE_GIFT_TOKEN,
  OFFERING_BEAT_ID,
  RUNG_GIFT_BEAT_PREFIX,
  OFFERING_COPY,
  type OfferingPriceWord,
} from '../data/god-progression-content';
import { getAttunementMarksCrossed, godSpherePoints } from './dominion';
import { isWithinGodReaches } from './targetActions';
import { getAscendantDomainAffinities } from './ascendant';

type Tier = 1 | 2 | 3 | 4;

// ─── The catalog ─────────────────────────────────────────────────────

let godCardCache: readonly UnifiedActionTemplate[] | null = null;

/** Every ascendant-castable card (`actorAffinities ∋ 'ascendant'`), in catalog order. Static data, so cached. */
export function godCards(): readonly UnifiedActionTemplate[] {
  if (!godCardCache) {
    godCardCache = UNIFIED_ACTION_TEMPLATES.filter(t => (t.actorAffinities ?? []).includes('ascendant'));
  }
  return godCardCache;
}

/** A card's progression block, or undefined (the gate fails the build on a god card without one). */
export function cardProgression(template: Pick<UnifiedActionTemplate, 'progression'> | undefined): CardProgression | undefined {
  return template?.progression;
}

// ─── The god ─────────────────────────────────────────────────────────

function ascendantProps(state: GameState): AscendantProperties | null {
  try {
    return (state.graph.getNode(state.ascendantId)?.properties as AscendantProperties | undefined) ?? null;
  } catch {
    return null;
  }
}

/** The god's primary and secondary spheres (fail-soft: nulls). */
export function godSpheres(state: GameState): { primary: SphereName | null; secondary: SphereName | null } {
  const a = ascendantProps(state)?.sphereAlignment;
  return { primary: a?.primary ?? null, secondary: a?.secondary ?? null };
}

/** The spheres the god bought points in. Fail-soft: none. */
export function boughtSpheres(state: GameState): SphereName[] {
  try {
    const points = godSpherePoints(state.graph, state.ascendantId);
    return SPHERE_NAMES.filter(s => (points[s] ?? 0) > 0);
  } catch {
    return [];
  }
}

// ─── Rungs ───────────────────────────────────────────────────────────

/** Σ attunement marks crossed over the god's bought spheres (plan § Decided 6). Fail-soft: 0. */
export function rungMarks(state: GameState): number {
  let sum = 0;
  for (const s of boughtSpheres(state)) {
    try {
      sum += getAttunementMarksCrossed(state, s);
    } catch {
      // one sphere's read failing never zeroes the others
    }
  }
  return sum;
}

/** The rung `marks` opens: 0 before the spine ends, else the count of thresholds reached (capped at 4). */
export function rungForMarks(marks: number, spineDone: boolean): number {
  if (!spineDone) return 0;
  let n = 0;
  for (const m of PROGRESSION_RUNG_MARKS) if (marks >= m) n++;
  return Math.min(n, PROGRESSION_MAX_RUNG);
}

/** True once the opening spine has run out. */
export function spineDone(state: GameState): boolean {
  return state.ascendantBeats?.spineCursor === -1;
}

/** The god's stored rung (0 when absent). The stored rung only rises. */
export function currentRung(state: GameState): number {
  return state.godProgression?.rung ?? 0;
}

export function createInitialGodProgression(): GodProgressionState {
  return { rung: 0, rungOpenedTick: {}, rungGiftQueue: [], nextRungGiftTick: 0 };
}

/** Rung-gift beat id: `beat.rung.<n>.<cardId>`. */
export function rungGiftBeatId(rung: number, cardToken: string): string {
  return `${RUNG_GIFT_BEAT_PREFIX}${rung}.${cardToken}`;
}

/** Parse a rung-gift beat id, or null for any other id. */
export function parseRungGiftBeatId(beatId: string): { rung: number; cardToken: string } | null {
  if (!beatId.startsWith(RUNG_GIFT_BEAT_PREFIX)) return null;
  const rest = beatId.slice(RUNG_GIFT_BEAT_PREFIX.length);
  const dot = rest.indexOf('.');
  if (dot <= 0) return null;
  const rung = Number(rest.slice(0, dot));
  const cardToken = rest.slice(dot + 1);
  if (!Number.isInteger(rung) || rung < 1 || rung > PROGRESSION_MAX_RUNG || !cardToken) return null;
  return { rung, cardToken };
}

/**
 * The rung's key gifts as beat ids, in catalog order: every `giftBy: 'rung'` card of
 * that tier. Rung `SECONDARY_SIGNATURE_RUNG` is led by the god's secondary reach
 * signature (plan § Decided 7).
 */
export function rungGiftsFor(rung: number): string[] {
  const ids = godCards()
    .filter(t => t.progression?.offer === 'gift' && t.progression.giftBy === 'rung' && t.progression.tier === rung)
    .map(t => rungGiftBeatId(rung, t.id));
  return rung === SECONDARY_SIGNATURE_RUNG
    ? [rungGiftBeatId(rung, SECONDARY_SIGNATURE_GIFT_TOKEN), ...ids]
    : ids;
}

/** True when the beat id is its rung's opening gift (its first key). */
export function isRungOpeningGift(beatId: string): boolean {
  const parsed = parseRungGiftBeatId(beatId);
  return !!parsed && rungGiftsFor(parsed.rung)[0] === beatId;
}

/**
 * True when `beatId` is the first gift of its rung the god is actually given: no earlier
 * gift of that rung is in the beat history. A skipped head (held, or no secondary reach)
 * therefore hands the rung's opening words to the next key instead of opening silently.
 */
export function isRungOpeningOffer(state: Pick<GameState, 'ascendantBeats'>, beatId: string): boolean {
  const parsed = parseRungGiftBeatId(beatId);
  if (!parsed) return false;
  const prefix = `${RUNG_GIFT_BEAT_PREFIX}${parsed.rung}.`;
  return !(state.ascendantBeats?.history ?? []).some(h => h.beatId.startsWith(prefix) && h.beatId !== beatId);
}

/** The catalogue entry a rung-gift beat resolves through (built from its id; never stored). */
export function rungGiftDefinition(beatId: string): BeatDefinition | null {
  const parsed = parseRungGiftBeatId(beatId);
  if (!parsed) return null;
  const base = { beatId, kind: 'rung_gift' as const, trigger: { kind: 'turn' as const } };
  if (parsed.cardToken === SECONDARY_SIGNATURE_GIFT_TOKEN) {
    return { ...base, grantsReachSignature: 'secondary' };
  }
  return { ...base, grantsActionIds: [parsed.cardToken] };
}

/** The offering's synthetic catalogue entry. Its cards ride on the pending beat. */
export const OFFERING_BEAT_DEFINITION: BeatDefinition = {
  beatId: OFFERING_BEAT_ID,
  kind: 'offering',
  trigger: { kind: 'cadence' },
};

// ─── Prices ──────────────────────────────────────────────────────────

/** The sphere whose earned essence pays for a card: the primary for a generic card, else `pricedIn` → `sphereAffinity` → the primary. */
export function priceSphere(template: UnifiedActionTemplate, state: GameState): SphereName | null {
  const primary = godSpheres(state).primary;
  const p = template.progression;
  if (p?.generic) return primary;
  return p?.pricedIn ?? template.sphereAffinity ?? primary;
}

/** `PRICE_BY_TIER[tier] × (1 + escalation × cards already taken up at that tier)`, rounded. */
export function priceOf(template: UnifiedActionTemplate, state: GameState): number {
  const tier = (template.progression?.tier ?? 1) as Tier;
  const bought = state.offeringBoughtByTier?.[tier] ?? 0;
  return Math.round((PRICE_BY_TIER[tier] ?? PRICE_BY_TIER[1]) * (1 + OFFERING_PRICE_ESCALATION * bought));
}

/** Earned minus spent in a sphere, floored at 0. Missing counters read as 0. */
export function spendable(state: GameState, sphere: SphereName): number {
  const earned = Number(state.essenceEarnedBySphere?.[sphere]) || 0;
  const spent = Number(state.offeringSpentBySphere?.[sphere]) || 0;
  return Math.max(0, earned - spent);
}

export interface OfferingPayment {
  readonly sphere: SphereName;
  readonly amount: number;
  readonly word: Exclude<OfferingPriceWord, 'beyond'>;
}

/**
 * Who pays (plan § Decided 9): the card's own sphere if its balance covers the price;
 * else the primary at `OFF_SPHERE_PRICE_MULT` × the price if that covers it; else null
 * ("Beyond you yet"). A generic card's own sphere is the primary.
 */
export function payment(template: UnifiedActionTemplate, state: GameState): OfferingPayment | null {
  const price = priceOf(template, state);
  const own = priceSphere(template, state);
  if (own && spendable(state, own) >= price) return { sphere: own, amount: price, word: 'paid_from' };
  const primary = godSpheres(state).primary;
  if (primary && primary !== own) {
    const doubled = price * OFF_SPHERE_PRICE_MULT;
    if (spendable(state, primary) >= doubled) return { sphere: primary, amount: doubled, word: 'at_double' };
  }
  return null;
}

/** Title-case a sphere name for the screen. */
function sphereWord(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The price phrase the player reads (no number, Law 13). */
export function pricePhrase(template: UnifiedActionTemplate, state: GameState): { word: OfferingPriceWord; text: string; sphere: SphereName | null } {
  const pay = payment(template, state);
  if (!pay) return { word: 'beyond', text: OFFERING_COPY.beyond, sphere: null };
  const tpl = pay.word === 'paid_from' ? OFFERING_COPY.paidFrom : OFFERING_COPY.atDouble;
  return { word: pay.word, text: tpl.replace('{sphere}', sphereWord(pay.sphere)), sphere: pay.sphere };
}

// ─── The offering ────────────────────────────────────────────────────

/**
 * Cards the world may offer at `rung`: god cards whose progression is `market`, tier ≤
 * rung, not held, inside the god's reaches; and — only when `OFFERING_IN_SPHERE_ONLY`
 * is on — sphereless or in the god's primary or secondary.
 */
export function offerableCards(state: GameState, rung: number = currentRung(state)): UnifiedActionTemplate[] {
  if (rung < 1) return [];
  const held = new Set(state.unlockedActionIds ?? []);
  let affinities: Partial<Record<ReachDomain, number>> | undefined;
  try {
    affinities = getAscendantDomainAffinities(state.graph, state.ascendantId);
  } catch {
    affinities = undefined;
  }
  const { primary, secondary } = godSpheres(state);
  return godCards().filter(t => {
    const p = t.progression;
    if (!p || p.offer !== 'market' || p.tier > rung) return false;
    if (held.has(t.id)) return false;
    if (!isWithinGodReaches(t, affinities)) return false;
    if (OFFERING_IN_SPHERE_ONLY && t.sphereAffinity && t.sphereAffinity !== primary && t.sphereAffinity !== secondary) {
      return false;
    }
    return true;
  });
}

/** Identity descriptor the Director's bias rule reads: reach from the card, sphere from its price sphere. */
export interface OfferingIdentity {
  readonly reach?: ReachDomain;
  readonly sphere?: SphereName;
}

/**
 * Draw weight: identity weight × `FRESH_RUNG_WEIGHT` on the newest rung's cards ×
 * `offerWeight`. A generic card is unbiased (identity weight 1). `bias` is the
 * Director's `computeIdentityBias` adapter; omitted → 1 (debug readouts).
 */
export function offeringWeight(
  template: UnifiedActionTemplate,
  state: GameState,
  rung: number,
  bias?: (identity: OfferingIdentity) => number,
): number {
  const p = template.progression;
  if (!p) return 0;
  const identity = p.generic || !bias
    ? 1
    : Math.max(0, bias({ reach: template.reach, sphere: priceSphere(template, state) ?? undefined }));
  const fresh = p.tier === rung ? FRESH_RUNG_WEIGHT : 1;
  return identity * fresh * Math.max(0, p.offerWeight ?? 1);
}

/** Draw up to `OFFERING_SIZE` distinct cards by weight, without replacement; one rng call per pick. */
export function drawOffering(
  candidates: readonly UnifiedActionTemplate[],
  weightOf: (t: UnifiedActionTemplate) => number,
  rng: () => number,
  size: number = OFFERING_SIZE,
): string[] {
  const pool = candidates.map(t => ({ id: t.id, w: Math.max(0, weightOf(t)) }));
  const picks: string[] = [];
  while (picks.length < size && pool.length > 0) {
    const total = pool.reduce((a, b) => a + b.w, 0);
    let idx = pool.length - 1;
    if (total > 0) {
      let roll = rng() * total;
      for (let i = 0; i < pool.length; i++) {
        roll -= pool[i].w;
        if (roll < 0) { idx = i; break; }
      }
    } else {
      rng(); // keep one call per pick even when every weight is 0
      idx = 0;
    }
    picks.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return picks;
}

/** The first day boundary (multiple of `TICKS_PER_DAY`) at least `OFFERING_MIN_TTL_TICKS` after `turn`. */
export function offeringExpiresTurn(turn: number): number {
  const earliest = turn + OFFERING_MIN_TTL_TICKS;
  return Math.ceil(earliest / TICKS_PER_DAY) * TICKS_PER_DAY;
}

// ─── Readouts (modal + debug) ────────────────────────────────────────

export interface OfferedCardView {
  readonly actionId: string;
  readonly name: string;
  readonly tier: number;
  readonly price: number;
  readonly word: OfferingPriceWord;
  readonly phrase: string;
  readonly paySphere: SphereName | null;
  readonly affordable: boolean;
}

/** What each offered card costs the god right now. Unknown ids are dropped (fail-soft). */
export function describeOffering(state: GameState, actionIds: readonly string[]): OfferedCardView[] {
  const out: OfferedCardView[] = [];
  for (const id of actionIds) {
    const t = getUnifiedTemplateById(id);
    if (!t) continue;
    const phrase = pricePhrase(t, state);
    const pay = payment(t, state);
    out.push({
      actionId: id,
      name: t.name,
      tier: t.progression?.tier ?? 1,
      price: pay?.amount ?? priceOf(t, state),
      word: phrase.word,
      phrase: phrase.text,
      paySphere: phrase.sphere,
      affordable: pay !== null,
    });
  }
  return out;
}

export interface GodProgressionReadout {
  rung: number;
  rungMarks: number;
  rungOpenedTick: Record<number, number>;
  rungGiftQueue: string[];
  nextRungGiftTick: number;
  spendableBySphere: Partial<Record<SphereName, number>>;
  spentBySphere: Partial<Record<SphereName, number>>;
  boughtByTier: Partial<Record<Tier, number>>;
  offerableCount: number;
  pendingOffering: {
    cardIds: string[];
    prices: number[];
    words: OfferingPriceWord[];
    expiresTurn: number | null;
  } | null;
}

/** The whole ladder as one plain object — `window.__DEBUG.getGodProgression()` and the DebugPanel read this. */
export function getGodProgressionReadout(state: GameState): GodProgressionReadout {
  const gp = state.godProgression ?? createInitialGodProgression();
  const spendableBySphere: Partial<Record<SphereName, number>> = {};
  for (const s of SPHERE_NAMES) {
    const v = spendable(state, s);
    if (v > 0) spendableBySphere[s] = v;
  }
  const pending = state.ascendantBeats?.pending;
  let pendingOffering: GodProgressionReadout['pendingOffering'] = null;
  if (pending?.kind === 'offering') {
    const views = describeOffering(state, pending.offeredActionIds ?? []);
    pendingOffering = {
      cardIds: views.map(v => v.actionId),
      prices: views.map(v => v.price),
      words: views.map(v => v.word),
      expiresTurn: pending.expiresTurn ?? null,
    };
  }
  return {
    rung: gp.rung,
    rungMarks: rungMarks(state),
    rungOpenedTick: { ...gp.rungOpenedTick },
    rungGiftQueue: [...gp.rungGiftQueue],
    nextRungGiftTick: gp.nextRungGiftTick,
    spendableBySphere,
    spentBySphere: { ...(state.offeringSpentBySphere ?? {}) },
    boughtByTier: { ...(state.offeringBoughtByTier ?? {}) },
    offerableCount: offerableCards(state, gp.rung).length,
    pendingOffering,
  };
}
