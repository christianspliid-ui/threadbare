/**
 * THR-1813 — the account record, pure (plan § Engine pillar E2).
 *
 * What carries between runs: the god's echoes, the World-Soul's tilt, the
 * hungers that stir, and the seed the next world wakes on. Nothing here touches
 * storage (`accountStore.ts` is the only seam) and nothing grows the god: no
 * sphere points, essence, power, reaches or tiers ride the record (THR-1773 §3).
 */
import type { AccountLastRun, AccountRecord } from '../types/account';
import type { GameState } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { EchoDefinition, EchoState } from '../types/echo';
import type { FundamentState, ResonanceMemory, ResonanceState } from '../types/worldSoul';
import type { HarvestResult } from './cycleEnd';
import { createEchoState, degradeAllEchoes } from './echo';
import { blendFundaments, captureMemory, createDefaultFundament, createResonanceState, degradeMemories, pruneMemories, selectTopMemories } from './worldSoul';
import { captureAgeMemories, memoryCaptureReason } from './twilight';
import { emitTrace } from './traceBuffer';
import { RESONANCE_DEGRADE_PER_RUN, TWILIGHT_MEMORIES_SHOWN } from '../data/game-config';
import { getSpherePoints, rankSpherePoints } from './spherePoints';
import type { SpherePoints } from './spherePoints';
import { HUNGER_CATALOG } from '../data/hunger-catalog';
import type { CourtOption, HungerDefinition } from '../types/hunger';
import { toHungerId } from '../types/hunger';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { godCards } from './godProgression';
import {
  ACCOUNT_CARD_UNLOCKS_PER_RUN,
  ACCOUNT_SEED_PRIME,
  ACCOUNT_UNSEAL_PRIME,
  ACCOUNT_UNSEAL_PRIMARY_WEIGHT,
  ACCOUNT_UNSEAL_SECONDARY_WEIGHT,
  ACCOUNT_VERSION,
  FUNDAMENT_BLEND_PER_RUN,
  FUNDAMENT_REVERT,
  PLACE_TILT_GAIN,
  RUN_ONE_AWAKE_HUNGERS,
  STIRRING_HUNGER_COUNT,
  WORLD_TILT_GAIN,
  memoryWord,
} from '../data/account-content';

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Shape ───────────────────────────────────────────────────────────

/** A run-1 record: nothing remembered, four hungers awake. */
export function emptyAccount(seed: number): AccountRecord {
  return {
    version: ACCOUNT_VERSION,
    cycleCount: 0,
    nextWorldSeed: seed,
    awakeHungerIds: [...RUN_ONE_AWAKE_HUNGERS],
    secondCourtHungerIds: [],
    stirringHungerIds: [],
    unsealedCardIds: [],
    echoDefinitions: [],
    echoStates: [],
    fundament: createDefaultFundament(),
    resonance: createResonanceState(),
  };
}

export type AccountReadProblem = 'version' | 'shape';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');
const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Why a parsed value is not a readable record, or `null` when it is. A record
 * with an unknown version is never guessed at.
 */
export function accountReadProblem(raw: unknown): AccountReadProblem | null {
  if (!isObj(raw)) return 'shape';
  if (raw.version !== ACCOUNT_VERSION) return 'version';
  if (!isFiniteNum(raw.cycleCount) || !isFiniteNum(raw.nextWorldSeed)) return 'shape';
  if (!isStrArray(raw.awakeHungerIds) || !isStrArray(raw.secondCourtHungerIds)
    || !isStrArray(raw.stirringHungerIds) || !isStrArray(raw.unsealedCardIds)) return 'shape';
  if (!Array.isArray(raw.echoDefinitions) || !Array.isArray(raw.echoStates)) return 'shape';
  const f = raw.fundament;
  if (!isObj(f) || !isObj(f.sphereWeights) || !isFiniteNum(f.cycleCount)) return 'shape';
  for (const s of SPHERE_NAMES) if (!isFiniteNum((f.sphereWeights as Record<string, unknown>)[s])) return 'shape';
  const r = raw.resonance;
  if (!isObj(r) || !Array.isArray(r.memories) || !isFiniteNum(r.maxMemories)) return 'shape';
  return null;
}

/** The record a parsed value holds, or `null` (unknown version, wrong shape). */
export function migrateAccount(raw: unknown): AccountRecord | null {
  if (accountReadProblem(raw) !== null) return null;
  const r = raw as AccountRecord;
  // Copy, so the caller's parsed object is never shared with the record.
  return {
    version: ACCOUNT_VERSION,
    cycleCount: r.cycleCount,
    nextWorldSeed: r.nextWorldSeed,
    awakeHungerIds: [...r.awakeHungerIds],
    secondCourtHungerIds: [...r.secondCourtHungerIds],
    stirringHungerIds: [...r.stirringHungerIds],
    unsealedCardIds: [...r.unsealedCardIds],
    echoDefinitions: r.echoDefinitions.map(d => ({ ...d })),
    echoStates: r.echoStates.map(s => ({ ...s })),
    fundament: { sphereWeights: { ...r.fundament.sphereWeights }, cycleCount: r.fundament.cycleCount },
    resonance: { memories: r.resonance.memories.map(m => ({ ...m })), maxMemories: r.resonance.maxMemories },
    ...(r.lastRun ? { lastRun: copyLastRun(r.lastRun) } : {}),
  };
}

function copyLastRun(lastRun: AccountLastRun): AccountLastRun {
  const { unsealedCardIds, ...rest } = lastRun;
  return isStrArray(unsealedCardIds) ? { ...rest, unsealedCardIds: [...unsealedCardIds] } : { ...rest };
}

// ─── Reads ───────────────────────────────────────────────────────────

/** True when the record carries anything a world should be shaped by. */
export function accountShapesWorld(account: AccountRecord | null | undefined): account is AccountRecord {
  return !!account && account.cycleCount > 0;
}

/** Echo definitions whose state is still live (not faded), in record order. */
export function liveEchoes(account: AccountRecord): Array<{ def: EchoDefinition; state: EchoState }> {
  const states = new Map(account.echoStates.map(s => [s.id, s]));
  const out: Array<{ def: EchoDefinition; state: EchoState }> = [];
  for (const def of account.echoDefinitions) {
    const state = states.get(def.id);
    if (state && !state.faded) out.push({ def, state });
  }
  return out;
}

/**
 * THR-1971 — the World-Soul memories *The world remembers* shows: the live ones (a
 * memory word still names them), top `TWILIGHT_MEMORIES_SHOWN` by
 * `significance × (1 − degradation)`. Empty on a first run or an empty record.
 */
export function shownWorldSoulMemories(
  account: AccountRecord,
): Array<{ memory: ResonanceMemory; word: NonNullable<ReturnType<typeof memoryWord>> }> {
  const live = (account.resonance?.memories ?? []).filter(m => memoryWord(m.degradation) !== null);
  return selectTopMemories(live, TWILIGHT_MEMORIES_SHOWN).map(m => ({ memory: m, word: memoryWord(m.degradation)! }));
}

// ─── The sealed sets (THR-1844, slice 3 — plan E8) ───────────────────

/** Account hunger ids are bare (`gather`); a played god's identity stores `hunger.gather`. */
function bareHungerId(id: string): string {
  return toHungerId(id) ?? id;
}

/** Decided 11 — the hungers a god may wake as this run, in catalog order. */
export function awakeHungers(
  account: Pick<AccountRecord, 'awakeHungerIds'>,
  catalog: readonly HungerDefinition[] = HUNGER_CATALOG,
): HungerDefinition[] {
  const awake = new Set(account.awakeHungerIds.map(bareHungerId));
  return catalog.filter(h => awake.has(h.id));
}

/** Decided 12 — a hunger's default court, and its second once a run was played with it. */
export function openCourts(account: Pick<AccountRecord, 'secondCourtHungerIds'>, hunger: HungerDefinition): CourtOption[] {
  if (account.secondCourtHungerIds.some(id => bareHungerId(id) === hunger.id)) return [...hunger.courtOptions];
  const def = hunger.courtOptions.find(c => c.isDefault) ?? hunger.courtOptions[0];
  return def ? [def] : [];
}

/** The sphere a card belongs to for the unseal draw and the run-1 rule (`pricedIn ?? sphereAffinity`). */
function cardSphere(t: Pick<UnifiedActionTemplate, 'progression' | 'sphereAffinity'>): SphereName | undefined {
  return t.progression?.pricedIn ?? t.sphereAffinity ?? undefined;
}

/**
 * Decided 13 — the run-1 sealed set, computed from the catalog (never stored, so a
 * card authored later joins it by itself): every `market` card that is not Tier 1–2,
 * not generic, and not its sphere's cheapest Tier 3 (lowest `essenceCost`, then
 * catalog order). On the shipped catalog that leaves 23 sealed (THR-1794).
 */
export function runOneSealedCardIds(catalog: readonly UnifiedActionTemplate[]): string[] {
  const market = catalog.filter(t => t.progression?.offer === 'market');
  const cheapestTierThree = new Map<string, UnifiedActionTemplate>();
  for (const t of market) {
    const p = t.progression!;
    if (p.tier !== 3 || p.generic) continue;
    const sphere = cardSphere(t) ?? '';
    const held = cheapestTierThree.get(sphere);
    if (!held || (t.essenceCost ?? 0) < (held.essenceCost ?? 0)) cheapestTierThree.set(sphere, t);
  }
  const kept = new Set([...cheapestTierThree.values()].map(t => t.id));
  return market
    .filter(t => t.progression!.tier > 2 && !t.progression!.generic && !kept.has(t.id))
    .map(t => t.id);
}

/** E8 — the cards this account may not yet be offered: the run-1 set less what earlier runs unsealed. */
export function sealedCardIds(account: Pick<AccountRecord, 'unsealedCardIds'>, catalog: readonly UnifiedActionTemplate[]): string[] {
  const unsealed = new Set(account.unsealedCardIds);
  return runOneSealedCardIds(catalog).filter(id => !unsealed.has(id));
}

/** E8 — true when `cardId` is still sealed for this account. */
export function isCardSealed(
  account: Pick<AccountRecord, 'unsealedCardIds'>,
  cardId: string,
  catalog: readonly UnifiedActionTemplate[],
): boolean {
  return sealedCardIds(account, catalog).includes(cardId);
}

/**
 * Decided 13 — the run end's unseal draw: `ACCOUNT_CARD_UNLOCKS_PER_RUN` cards without
 * replacement from the sealed set, weight 3 on the god's primary sphere, 2 on its
 * secondary, 1 otherwise, on `mulberry32(worldSeed + ACCOUNT_UNSEAL_PRIME)` — one call
 * per pick. An empty sealed set draws nothing.
 */
export function drawUnsealedCards(
  account: Pick<AccountRecord, 'unsealedCardIds'>,
  pair: readonly SphereName[],
  worldSeed: number,
  catalog: readonly UnifiedActionTemplate[],
): { cardIds: string[]; weights: number[] } {
  const byId = new Map(catalog.map(t => [t.id, t]));
  const pool = sealedCardIds(account, catalog).map(id => {
    const sphere = cardSphere(byId.get(id) ?? {});
    const weight = sphere && sphere === pair[0] ? ACCOUNT_UNSEAL_PRIMARY_WEIGHT
      : sphere && sphere === pair[1] ? ACCOUNT_UNSEAL_SECONDARY_WEIGHT
      : 1;
    return { id, weight };
  });
  const rng = mulberry32(worldSeed + ACCOUNT_UNSEAL_PRIME);
  const cardIds: string[] = [];
  const weights: number[] = [];
  for (let k = 0; k < ACCOUNT_CARD_UNLOCKS_PER_RUN && pool.length > 0; k++) {
    const total = pool.reduce((acc, c) => acc + c.weight, 0);
    let r = rng() * total;
    let i = 0;
    while (i < pool.length - 1 && r >= pool[i].weight) {
      r -= pool[i].weight;
      i++;
    }
    const [picked] = pool.splice(i, 1);
    cardIds.push(picked.id);
    weights.push(picked.weight);
  }
  return { cardIds, weights };
}

/**
 * Decided 8 — the multiplier the account's tilt puts on each sphere of the next
 * world's cosmology profile: `1 + gain × (12 × weight − 1)`, so an even
 * fundament multiplies every sphere by 1. Floored at 0.
 */
export function worldTiltFactors(fundament: FundamentState): Record<SphereName, number> {
  const out = {} as Record<SphereName, number>;
  const n = SPHERE_NAMES.length;
  for (const s of SPHERE_NAMES) {
    const w = Number(fundament.sphereWeights[s]) || 0;
    out[s] = Math.max(0, 1 + WORLD_TILT_GAIN * (n * w - 1));
  }
  return out;
}

/**
 * THR-2028 — the multiplier the tilt puts on each sphere of a place's seeded
 * scores: the world factor scaled toward 1 by `PLACE_TILT_GAIN`. Floored at 0.
 */
export function placeTiltFactors(fundament: FundamentState): Record<SphereName, number> {
  const world = worldTiltFactors(fundament);
  const out = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) out[s] = Math.max(0, 1 + PLACE_TILT_GAIN * (world[s] - 1));
  return out;
}

// ─── The run end ─────────────────────────────────────────────────────

/** The god's bought points (or preset), the one read the Dominion uses. */
function godPoints(state: GameState): SpherePoints {
  return getSpherePoints(state.graph.getNode(state.ascendantId)?.properties);
}

/** The god's spheres as a fundament: bought points normalised to weights. */
function earnedFundament(points: SpherePoints, cycleCount: number): FundamentState {
  const sphereWeights = {} as Record<SphereName, number>;
  const total = SPHERE_NAMES.reduce((acc, s) => acc + Math.max(0, points[s] ?? 0), 0);
  for (const s of SPHERE_NAMES) {
    sphereWeights[s] = total > 0 ? Math.max(0, points[s] ?? 0) / total : 1 / SPHERE_NAMES.length;
  }
  return { sphereWeights, cycleCount };
}

/**
 * Decided 11 — the sealed hungers that share most spheres with the god's bought
 * pair, ties by catalog order. The first is the one the old god's echoes favour.
 */
export function stirringHungers(awake: readonly string[], pair: readonly SphereName[]): string[] {
  const awakeSet = new Set(awake);
  return HUNGER_CATALOG
    .map((h, i) => {
      const spheres = [h.sphereAlignment.primary, h.sphereAlignment.secondary];
      return { id: h.id, i, shared: spheres.filter(s => pair.includes(s)).length };
    })
    .filter(h => !awakeSet.has(h.id))
    .sort((a, b) => b.shared - a.shared || a.i - b.i)
    .slice(0, STIRRING_HUNGER_COUNT)
    .map(h => h.id);
}

/** Decided 10 — the next world's seed, derived (same account, same choices → same world). */
export function deriveNextWorldSeed(prevSeed: number, cycleCount: number): number {
  const r = mulberry32(prevSeed + ACCOUNT_SEED_PRIME * cycleCount)();
  return Math.floor(r * 2147483646) + 1;
}

/**
 * Fold a finished run into the record (E2). Pure: the input record is not
 * mutated. Carried echoes degrade and the faded drop; this harvest's divine and
 * cosmic echoes and the card echo join; the fundament blends toward the god's
 * spheres then back toward even (two `blendFundaments`, Decided 8); two sealed
 * hungers stir; the played hunger's second court opens; the next seed is derived.
 */
export function concludeRun(account: AccountRecord, state: GameState, harvest: HarvestResult): AccountRecord {
  // Carried echoes age one run.
  const degraded = degradeAllEchoes(account.echoStates).filter(s => !s.faded);
  const surviving = new Set(degraded.map(s => s.id));
  const carriedDefs = account.echoDefinitions.filter(d => surviving.has(d.id));

  // This run's echoes: the god's own first (Decided 5), then the cosmic, then the card.
  const fresh: EchoDefinition[] = [
    ...(harvest.divineEchoes ?? []),
    ...harvest.cosmicEchoCandidates.map(c => c.echoDefinition),
    ...(harvest.cardEcho ? [harvest.cardEcho] : []),
  ];
  // Worldgen reuses node ids, and a world built without the account (a dev route, or a
  // wake after a failed save) starts at cycle 1 again, so a harvest's echo ids
  // (`echo_<cycle>_<nodeId>`) can repeat across runs. Stamping the run number keeps
  // them unique in the record, so a new echo is never mistaken for a carried one.
  const runTag = `run${account.cycleCount + 1}_`;
  const seen = new Set(carriedDefs.map(d => d.id));
  const freshUnique = fresh
    .map(d => ({ ...d, id: runTag + d.id }))
    .filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true)));

  const points = godPoints(state);
  const ranked = rankSpherePoints(points);
  const blended = blendFundaments(account.fundament, earnedFundament(points, account.fundament.cycleCount), FUNDAMENT_BLEND_PER_RUN);
  const fundament = blendFundaments(blended, createDefaultFundament(), FUNDAMENT_REVERT);

  const hungerId = state.ascendantIdentity?.hungerId ?? '';
  // The second court opens on the bare id the record keeps (`gather`, not `hunger.gather`).
  const playedHunger = hungerId ? bareHungerId(hungerId) : '';
  const pair = ranked.slice(0, 2);
  const cycleCount = account.cycleCount + 1;
  // Decided 13 — two sealed cards unseal, weighted to the god's spheres.
  const unsealed = drawUnsealedCards(account, pair, state.seed, godCards());
  if (unsealed.cardIds.length > 0) {
    emitTrace({
      tick: state.tick,
      category: 'account.cards_unsealed',
      cardIds: unsealed.cardIds,
      weights: unsealed.weights,
      summary: `account: ${unsealed.cardIds.join(', ')} unsealed for the next world`,
    });
  }

  const primary = ranked[0] ?? state.ascendantIdentity?.sphereAlignment.primary;
  const secondary = ranked[1] ?? state.ascendantIdentity?.sphereAlignment.secondary ?? primary;
  const lastRun: AccountLastRun | undefined = primary && secondary
    ? {
        divineName: state.ascendantIdentity?.divineName ?? state.graph.getNode(state.ascendantId)?.name ?? '',
        primary,
        secondary,
        hungerId,
        harvestType: harvest.harvestType,
        unsealedCardIds: [...unsealed.cardIds],
      }
    : account.lastRun;

  return {
    version: account.version,
    cycleCount,
    nextWorldSeed: deriveNextWorldSeed(state.seed, cycleCount),
    awakeHungerIds: [...account.awakeHungerIds],
    secondCourtHungerIds: playedHunger && !account.secondCourtHungerIds.includes(playedHunger)
      ? [...account.secondCourtHungerIds, playedHunger]
      : [...account.secondCourtHungerIds],
    stirringHungerIds: stirringHungers(account.awakeHungerIds, pair),
    unsealedCardIds: [...account.unsealedCardIds, ...unsealed.cardIds],
    echoDefinitions: [...carriedDefs, ...freshUnique],
    echoStates: [...degraded, ...freshUnique.map(d => createEchoState(d.id))],
    fundament,
    resonance: concludeResonance(state, harvest, cycleCount),
    ...(lastRun ? { lastRun } : {}),
  };
}

/**
 * THR-1381 E5 — the World-Soul's memories at the end of the age. Every carried memory
 * fades by `RESONANCE_DEGRADE_PER_RUN` and the gone ones drop; then this age's (up to
 * three, `captureAgeMemories`) join, `captureMemory` evicting the weakest when full.
 */
function concludeResonance(state: GameState, harvest: HarvestResult, cycleCount: number): ResonanceState {
  const held = state.worldSoul?.resonance ?? createResonanceState();
  const degraded = degradeMemories(held.memories, RESONANCE_DEGRADE_PER_RUN);
  const carried = pruneMemories(degraded);
  if (carried.length < degraded.length) {
    const kept = new Set(carried.map(m => m.id));
    for (const m of degraded) {
      if (kept.has(m.id)) continue;
      emitTrace({ tick: state.tick, category: 'resonance.memory_evicted', memoryId: m.id, cause: 'faded', summary: `resonance: "${m.summary}" faded from the World-Soul` });
    }
  }
  let resonance: ResonanceState = { memories: carried, maxMemories: held.maxMemories };
  let fresh: ReturnType<typeof captureAgeMemories> = [];
  try {
    fresh = captureAgeMemories(state, harvest, cycleCount);
  } catch {
    // Fail-soft: an unreadable world keeps its carried memories and adds none.
  }
  for (const m of fresh) {
    const before = new Set(resonance.memories.map(x => x.id));
    const next = captureMemory(resonance, m);
    if (next === resonance) continue; // weaker than everything held: not kept
    for (const id of before) {
      if (!next.memories.some(x => x.id === id)) {
        emitTrace({ tick: state.tick, category: 'resonance.memory_evicted', memoryId: id, cause: 'full', summary: `resonance: ${id} dropped for a stronger memory` });
      }
    }
    resonance = next;
    emitTrace({
      tick: state.tick,
      category: 'resonance.memory_captured',
      memoryId: m.id,
      memoryType: m.memoryType,
      significance: m.significance,
      reason: memoryCaptureReason(m),
      summary: `resonance: the World-Soul keeps "${m.summary}"`,
    });
  }
  return { memories: resonance.memories.map(m => ({ ...m })), maxMemories: resonance.maxMemories };
}

/** Decided 11 — the player wakes one of the stirring hungers; the other sleeps again. */
export function wakeHunger(account: AccountRecord, hungerId: string): AccountRecord {
  if (!account.stirringHungerIds.includes(hungerId)) return account;
  emitTrace({
    tick: 0,
    category: 'account.hunger_woken',
    hungerId,
    favoured: account.stirringHungerIds[0] === hungerId,
    summary: `account: ${hungerId} wakes`,
  });
  return {
    ...account,
    awakeHungerIds: account.awakeHungerIds.includes(hungerId)
      ? [...account.awakeHungerIds]
      : [...account.awakeHungerIds, hungerId],
    stirringHungerIds: [],
  };
}

/**
 * Decided 8 — the next world's cosmology profile, bent by the account's tilt and
 * renormalised to sum 1. Returns the profile and the per-sphere factor applied
 * (`account.world_shaped`'s `tilt`).
 */
export function tiltCosmology(
  profile: Readonly<Record<SphereName, number>>,
  fundament: FundamentState,
): { profile: Record<SphereName, number>; tilt: Partial<Record<SphereName, number>> } {
  const factors = worldTiltFactors(fundament);
  const out = {} as Record<SphereName, number>;
  let sum = 0;
  for (const s of SPHERE_NAMES) {
    out[s] = (Number(profile[s]) || 0) * factors[s];
    sum += out[s];
  }
  if (sum <= 0) return { profile: { ...profile }, tilt: {} };
  const tilt: Partial<Record<SphereName, number>> = {};
  for (const s of SPHERE_NAMES) {
    out[s] /= sum;
    if (Math.abs(factors[s] - 1) > 1e-9) tilt[s] = Math.round(factors[s] * 1000) / 1000;
  }
  return { profile: out, tilt };
}
