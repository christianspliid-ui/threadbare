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
import type { FundamentState } from '../types/worldSoul';
import type { HarvestResult } from './cycleEnd';
import { createEchoState, degradeAllEchoes } from './echo';
import { blendFundaments, createDefaultFundament, createResonanceState } from './worldSoul';
import { getSpherePoints, rankSpherePoints } from './spherePoints';
import type { SpherePoints } from './spherePoints';
import { HUNGER_CATALOG } from '../data/hunger-catalog';
import {
  ACCOUNT_SEED_PRIME,
  ACCOUNT_VERSION,
  FUNDAMENT_BLEND_PER_RUN,
  FUNDAMENT_REVERT,
  RUN_ONE_AWAKE_HUNGERS,
  STIRRING_HUNGER_COUNT,
  WORLD_TILT_GAIN,
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
    ...(r.lastRun ? { lastRun: { ...r.lastRun } } : {}),
  };
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
  // Every world starts at cycle 1 and worldgen reuses node ids, so a harvest's
  // echo ids (`echo_1_<nodeId>`) repeat across runs. Stamping the run number makes
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
  const pair = ranked.slice(0, 2);
  const cycleCount = account.cycleCount + 1;

  const primary = ranked[0] ?? state.ascendantIdentity?.sphereAlignment.primary;
  const secondary = ranked[1] ?? state.ascendantIdentity?.sphereAlignment.secondary ?? primary;
  const lastRun: AccountLastRun | undefined = primary && secondary
    ? {
        divineName: state.ascendantIdentity?.divineName ?? state.graph.getNode(state.ascendantId)?.name ?? '',
        primary,
        secondary,
        hungerId,
        harvestType: harvest.harvestType,
      }
    : account.lastRun;

  return {
    version: account.version,
    cycleCount,
    nextWorldSeed: deriveNextWorldSeed(state.seed, cycleCount),
    awakeHungerIds: [...account.awakeHungerIds],
    secondCourtHungerIds: hungerId && !account.secondCourtHungerIds.includes(hungerId)
      ? [...account.secondCourtHungerIds, hungerId]
      : [...account.secondCourtHungerIds],
    stirringHungerIds: stirringHungers(account.awakeHungerIds, pair),
    // Decided 13's draw lands with slice 3 (THR-1844); until then nothing unseals.
    unsealedCardIds: [...account.unsealedCardIds],
    echoDefinitions: [...carriedDefs, ...freshUnique],
    echoStates: [...degraded, ...freshUnique.map(d => createEchoState(d.id))],
    fundament,
    resonance: {
      memories: state.worldSoul.resonance.memories.map(m => ({ ...m })),
      maxMemories: state.worldSoul.resonance.maxMemories,
    },
    ...(lastRun ? { lastRun } : {}),
  };
}

/** Decided 11 — the player wakes one of the stirring hungers; the other sleeps again. */
export function wakeHunger(account: AccountRecord, hungerId: string): AccountRecord {
  if (!account.stirringHungerIds.includes(hungerId)) return account;
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
