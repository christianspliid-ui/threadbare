/**
 * THR-1813 slice 1 — the account record, the harvest's divine picks and a new
 * world built from the record. Plan § Done when (slice 1).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { AccountRecord } from '../../types/account';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { computeHarvest, startTwilight } from '../cycleEnd';
import type { HarvestResult } from '../cycleEnd';
import {
  concludeRun,
  deriveNextWorldSeed,
  emptyAccount,
  migrateAccount,
  stirringHungers,
  tiltCosmology,
  wakeHunger,
} from '../accountRecord';
import { loadAccount, sampleAccount, saveAccount } from '../accountStore';
import { buildRepertoire, echoCardsFromDefinitions } from '../nudgeCardRepertoire';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { createDefaultFundament } from '../worldSoul';
import { ACCOUNT_STORAGE_KEY, ACCOUNT_UNREADABLE_KEY, RUN_ONE_AWAKE_HUNGERS } from '../../data/account-content';
import { SPHERE_NAMES } from '../../types/index';

const ECHO_CARD = 'card.heavy_hand.signature.force';

function newWorld(account?: AccountRecord): GameState {
  // The id counters are module state; the wake path resets them the same way (useSimulation).
  resetEventCounter();
  resetDecisionCache();
  return initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small', undefined, account).state;
}

/** Node ids and sphere scores — the parts of a world an account could move. */
function worldHash(state: GameState): string {
  const nodes = [...state.graph.getAllNodes()].sort((a, b) => (a.id < b.id ? -1 : 1));
  return JSON.stringify(nodes.map(n => [n.id, (n.properties as { sphereAffinity?: { scores?: unknown } }).sphereAffinity?.scores ?? null]));
}

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
  key() { return null; }
  get length() { return this.data.size; }
}

describe('THR-1813 — concludeRun on a seed-42 harvest', () => {
  let state: GameState;
  let harvest: HarvestResult;

  beforeAll(() => {
    enableTracing();
    clearTraces();
    state = newWorld();
    devSeedTheFirst(state);
    state.cardPlayTally = { [ECHO_CARD]: { timesPlayed: 3, peakSignificance: 0.8 } };
    harvest = computeHarvest(startTwilight(state));
  });

  afterEach(() => undefined);

  it('picks the god\'s own echoes by rule and traces each slot', () => {
    const picks = getTraces().filter(t => t.category === 'harvest.divine_echo_picked');
    expect(picks).toHaveLength(harvest.divineEchoSlots);
    const picked = picks.filter(t => (t as { kind: string }).kind !== 'none');
    expect(picked.length).toBe(harvest.divineEchoes?.length ?? 0);
    // The First is threaded by devSeedTheFirst, so at least the Legacy slot fills.
    expect(harvest.divineEchoes?.some(e => e.echoType === 'legacy')).toBe(true);
    for (const e of harvest.divineEchoes ?? []) expect(e.source).toBe('divine');
    // A divine pick is never carried twice as a cosmic echo too.
    const divineNodes = new Set((harvest.divineEchoes ?? []).map(e => e.originNodeId));
    for (const c of harvest.cosmicEchoCandidates) expect(divineNodes.has(c.node.id)).toBe(false);
  });

  it('carries the god\'s bought pair on every echo it picks (Decided 5)', () => {
    const pair = harvest.cosmicEchoCandidates[0]?.echoDefinition.sphereAffinities ?? [];
    expect(pair).toHaveLength(2);
    expect([...pair].sort()).toEqual([DEV_ASCENDANT_IDENTITY.sphereAlignment.primary, DEV_ASCENDANT_IDENTITY.sphereAlignment.secondary].sort());
  });

  it('folds the run into the record', () => {
    const before = emptyAccount(42);
    const after = concludeRun(before, state, harvest);
    expect(after.cycleCount).toBe(1);
    const ids = new Set(after.echoDefinitions.map(d => d.id));
    for (const d of harvest.divineEchoes ?? []) expect(ids.has(`run1_${d.id}`)).toBe(true);
    expect(after.echoDefinitions.some(d => d.echoType === 'card' && d.cardEcho?.cardId === ECHO_CARD)).toBe(true);
    expect(after.echoStates).toHaveLength(after.echoDefinitions.length);
    // Two blendFundaments: toward the god, then back toward even (Decided 8).
    expect(after.fundament.cycleCount).toBe(before.fundament.cycleCount + 2);
    const primary = DEV_ASCENDANT_IDENTITY.sphereAlignment.primary;
    expect(after.fundament.sphereWeights[primary]).toBeGreaterThan(before.fundament.sphereWeights[primary]);
    expect(after.nextWorldSeed).toBe(concludeRun(before, state, harvest).nextWorldSeed);
    expect(after.nextWorldSeed).not.toBe(42);
    expect(after.stirringHungerIds).toHaveLength(2);
    for (const h of after.stirringHungerIds) expect(RUN_ONE_AWAKE_HUNGERS).not.toContain(h);
    expect(after.secondCourtHungerIds).toContain(DEV_ASCENDANT_IDENTITY.hungerId);
    expect(after.lastRun?.hungerId).toBe(DEV_ASCENDANT_IDENTITY.hungerId);
    // Pure: the input record is untouched.
    expect(before.cycleCount).toBe(0);
    expect(before.echoDefinitions).toHaveLength(0);
  });

  it('keeps a later run echo of a reused node id beside the carried one (review round 1)', () => {
    // Every world starts at cycle 1 and worldgen reuses node ids, so two runs'
    // harvests mint the same raw echo ids; the record must keep both.
    const first = concludeRun(emptyAccount(42), state, harvest);
    const second = concludeRun(first, state, harvest);
    const divine = harvest.divineEchoes ?? [];
    expect(divine.length).toBeGreaterThan(0);
    for (const d of divine) {
      expect(second.echoDefinitions.some(x => x.id === `run1_${d.id}`)).toBe(true);
      expect(second.echoDefinitions.some(x => x.id === `run2_${d.id}`)).toBe(true);
    }
    expect(new Set(second.echoDefinitions.map(x => x.id)).size).toBe(second.echoDefinitions.length);
  });

  it('ages carried echoes and drops the faded', () => {
    const carried = sampleAccount();
    carried.echoStates = carried.echoStates.map((s, i) => ({ ...s, degradation: i === 0 ? 0.8 : 0.1 }));
    const after = concludeRun(carried, state, harvest);
    expect(after.echoDefinitions.some(d => d.id === carried.echoDefinitions[0].id)).toBe(false);
    const kept = after.echoStates.find(s => s.id === carried.echoDefinitions[1].id);
    expect(kept?.degradation).toBeCloseTo(0.25);
    expect(after.cycleCount).toBe(2);
  });
});

describe('THR-1813 — the record round-trips and fails soft', () => {
  let store: MemoryStorage;
  const g = globalThis as { localStorage?: unknown };
  let saved: unknown;

  beforeEach(() => {
    saved = g.localStorage;
    store = new MemoryStorage();
    g.localStorage = store;
    enableTracing();
    clearTraces();
  });
  afterEach(() => {
    g.localStorage = saved;
  });

  it('migrateAccount round-trips a record', () => {
    const a = sampleAccount();
    expect(migrateAccount(JSON.parse(JSON.stringify(a)))).toEqual(a);
  });

  it('save then load returns the same record', () => {
    const a = sampleAccount();
    expect(saveAccount(a).ok).toBe(true);
    const loaded = loadAccount('', 7);
    expect(loaded.source).toBe('stored');
    expect(loaded.account).toEqual(a);
  });

  it.each([
    ['an unknown version', JSON.stringify({ ...sampleAccount(), version: 2 }), 'version'],
    ['a non-object', JSON.stringify([1, 2, 3]), 'shape'],
    ['truncated JSON', JSON.stringify(sampleAccount()).slice(0, 40), 'parse'],
  ])('%s yields the empty record and traces account.unreadable', (_label, raw, reason) => {
    store.setItem(ACCOUNT_STORAGE_KEY, raw);
    const loaded = loadAccount('', 9);
    expect(loaded.source).toBe('unreadable');
    expect(loaded.account).toEqual(emptyAccount(9));
    const t = getTraces().find(x => x.category === 'account.unreadable') as { reason: string } | undefined;
    expect(t?.reason).toBe(reason);
    // The raw text is kept, never thrown away.
    expect(store.getItem(ACCOUNT_UNREADABLE_KEY)).toBe(raw);
  });

  it('no storage at all is run 1, and a save says it failed', () => {
    g.localStorage = undefined;
    delete g.localStorage;
    expect(loadAccount('', 3).source).toBe('empty');
    const r = saveAccount(emptyAccount(3));
    expect(r.ok).toBe(false);
    const t = getTraces().find(x => x.category === 'account.saved') as { ok: boolean } | undefined;
    expect(t?.ok).toBe(false);
  });

  it('?account=fresh ignores the stored record; ?account=sample loads the fixture', () => {
    saveAccount(sampleAccount());
    expect(loadAccount('?account=fresh', 5)).toEqual({ account: emptyAccount(5), source: 'fresh_param' });
    expect(loadAccount('?account=sample', 5).source).toBe('sample_param');
  });
});

describe('THR-1813 — a world built from the record', () => {
  afterEach(() => disableTracing());

  it('no account and an empty account both build today\'s world', () => {
    const today = worldHash(newWorld());
    expect(worldHash(newWorld(emptyAccount(42)))).toBe(today);
  });

  it('a carried record loads its echoes, and the card echo reaches the repertoire', () => {
    const state = newWorld();
    devSeedTheFirst(state);
    state.cardPlayTally = { [ECHO_CARD]: { timesPlayed: 2, peakSignificance: 0.6 } };
    const record = concludeRun(emptyAccount(42), state, computeHarvest(startTwilight(state)));

    enableTracing();
    clearTraces();
    const next = newWorld(record);
    expect(next.echoDefinitions.map(d => d.id).sort()).toEqual(record.echoDefinitions.map(d => d.id).sort());
    expect(next.worldSoul.fundament.cycleCount).toBe(record.fundament.cycleCount);
    const shaped = getTraces().find(t => t.category === 'account.world_shaped') as { echoesLoaded: number } | undefined;
    expect(shaped?.echoesLoaded).toBe(record.echoDefinitions.length);

    const entries = buildRepertoire({
      primary: DEV_ASCENDANT_IDENTITY.sphereAlignment.primary,
      secondary: DEV_ASCENDANT_IDENTITY.sphereAlignment.secondary,
      echoCards: echoCardsFromDefinitions(next.echoDefinitions),
    });
    expect(entries.some(e => e.member.id === ECHO_CARD && e.source === 'echo')).toBe(true);
  });

  it('the tilt bends the cosmology toward the carried spheres and an even fundament leaves it alone', () => {
    const profile = Object.fromEntries(SPHERE_NAMES.map(s => [s, 1 / SPHERE_NAMES.length])) as Record<(typeof SPHERE_NAMES)[number], number>;
    expect(tiltCosmology(profile, createDefaultFundament()).tilt).toEqual({});
    const sample = sampleAccount();
    const { profile: tilted } = tiltCosmology(profile, sample.fundament);
    expect(tilted.life).toBeGreaterThan(profile.life);
    expect(SPHERE_NAMES.reduce((a, s) => a + tilted[s], 0)).toBeCloseTo(1);
  });
});

describe('THR-1813 — hungers and the next seed', () => {
  it('two sealed hungers stir, the most kindred first', () => {
    const stir = stirringHungers(RUN_ONE_AWAKE_HUNGERS, ['life', 'spirit']);
    expect(stir).toHaveLength(2);
    for (const h of stir) expect(RUN_ONE_AWAKE_HUNGERS).not.toContain(h);
  });

  it('waking a stirring hunger makes it awake and quiets the other', () => {
    const a = { ...emptyAccount(1), stirringHungerIds: ['kindle', 'preserve'] };
    const woken = wakeHunger(a, 'kindle');
    expect(woken.awakeHungerIds).toContain('kindle');
    expect(woken.awakeHungerIds).not.toContain('preserve');
    expect(woken.stirringHungerIds).toEqual([]);
    expect(wakeHunger(a, 'bind')).toBe(a);
  });

  it('the next seed is derived, not rolled', () => {
    expect(deriveNextWorldSeed(42, 1)).toBe(deriveNextWorldSeed(42, 1));
    expect(deriveNextWorldSeed(42, 1)).not.toBe(deriveNextWorldSeed(42, 2));
  });
});
