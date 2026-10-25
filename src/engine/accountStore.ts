/**
 * THR-1813 — the account record's storage seam (plan § Engine pillar E3).
 *
 * The ONLY module that touches storage. The engine, the CLI and every test pass
 * an `AccountRecord` object or none; nothing in the tick loop reads storage.
 * A cleared browser resets the record. Storage that fails never blocks the game:
 * a failed read is run 1, a failed write is reported and the run goes on.
 */
import type { AccountRecord, LoadedAccount } from '../types/account';
import type { EchoDefinition } from '../types/echo';
import { ACCOUNT_STORAGE_KEY, ACCOUNT_UNREADABLE_KEY } from '../data/account-content';
import { accountReadProblem, emptyAccount, liveEchoes, migrateAccount, sealedCardIds } from './accountRecord';
import { godCards } from './godProgression';
import { createDefaultFundament, createResonanceState } from './worldSoul';
import { emitTrace } from './traceBuffer';

function storage(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? (globalThis as { localStorage: Storage }).localStorage
      : null;
  } catch {
    return null;
  }
}

function echo(id: string, echoType: EchoDefinition['echoType'], name: string, spheres: EchoDefinition['sphereAffinities'], significance: number): EchoDefinition {
  return {
    id,
    echoType,
    source: 'divine',
    originNodeId: `sample_${id}`,
    originCycle: 0,
    name,
    summary: `Echo of ${name} from cycle 0.`,
    sphereAffinities: spheres,
    significance,
    injection: { injectionType: echoType === 'legacy' ? 'cultural_template' : echoType === 'monument' ? 'location_feature' : 'quest_seed', description: `Seeds from ${name} (cycle 0).` },
  };
}

/** The two cards `sampleAccount()` unsealed (both sealed on run 1, both Spirit). */
export const SAMPLE_UNSEALED_CARD_IDS: readonly string[] = ['loc.awaken_spirit', 'action.consecrate-relic'];

/**
 * `?account=sample` — a one-run record with one echo of each kind, for browser
 * verification (plan E3). The past god was Life/Spirit.
 */
export function sampleAccount(): AccountRecord {
  const defs = [
    echo('echo_sample_monument', 'monument', 'The Long Barrow', ['life', 'spirit'], 0.8),
    echo('echo_sample_legacy', 'legacy', 'Maren Ashfold', ['life', 'spirit'], 0.7),
    echo('echo_sample_relic', 'relic', 'The Hollow Bell', ['life', 'spirit'], 0.6),
  ];
  const fundament = createDefaultFundament();
  fundament.sphereWeights.life += 0.02;
  fundament.sphereWeights.spirit += 0.015;
  const sum = Object.values(fundament.sphereWeights).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(fundament.sphereWeights) as Array<keyof typeof fundament.sphereWeights>) {
    fundament.sphereWeights[k] /= sum;
  }
  fundament.cycleCount = 2;
  return {
    ...emptyAccount(4242),
    cycleCount: 1,
    nextWorldSeed: 4242,
    secondCourtHungerIds: ['gather'],
    stirringHungerIds: ['kindle', 'preserve'],
    // THR-1844: two Spirit cards out of the run-1 reservoir, as a Life/Spirit god's run end would draw.
    unsealedCardIds: [...SAMPLE_UNSEALED_CARD_IDS],
    echoDefinitions: defs,
    echoStates: defs.map((d, i) => ({ id: d.id, degradation: [0.15, 0.45, 0.75][i] ?? 0, cyclesActive: 1, faded: false })),
    fundament,
    resonance: createResonanceState(),
    lastRun: { divineName: 'The Shepherd', primary: 'life', secondary: 'spirit', hungerId: 'gather', harvestType: 'bittersweet', unsealedCardIds: [...SAMPLE_UNSEALED_CARD_IDS] },
  };
}

function traceLoaded(loaded: LoadedAccount): LoadedAccount {
  const a = loaded.account;
  emitTrace({
    tick: 0,
    category: 'account.loaded',
    source: loaded.source,
    cycleCount: a.cycleCount,
    liveEchoes: liveEchoes(a).length,
    awakeHungers: a.awakeHungerIds.length,
    sealedCards: sealedCardIds(a, godCards()).length,
    summary: `account loaded (${loaded.source}): cycle ${a.cycleCount}, ${liveEchoes(a).length} live echoes`,
  });
  return loaded;
}

/**
 * Read the record. `search` is the page's query string: `?account=fresh` ignores
 * the stored record for the session, `?account=sample` loads `sampleAccount()`.
 * Missing → empty; unparsable or unmigratable → empty, the raw text kept under
 * `ACCOUNT_UNREADABLE_KEY` and `account.unreadable` traced.
 */
export function loadAccount(search = '', seed = 42): LoadedAccount {
  const param = new URLSearchParams(search).get('account');
  if (param === 'fresh') return traceLoaded({ account: emptyAccount(seed), source: 'fresh_param' });
  if (param === 'sample') return traceLoaded({ account: sampleAccount(), source: 'sample_param' });

  const store = storage();
  let raw: string | null = null;
  try {
    raw = store?.getItem(ACCOUNT_STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw === null) return traceLoaded({ account: emptyAccount(seed), source: 'empty' });

  let parsed: unknown;
  let reason: 'parse' | 'version' | 'shape' | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    reason = 'parse';
  }
  const account = reason === null ? migrateAccount(parsed) : null;
  if (account) return traceLoaded({ account, source: 'stored' });

  reason = reason ?? accountReadProblem(parsed) ?? 'shape';
  try {
    store?.setItem(ACCOUNT_UNREADABLE_KEY, raw);
  } catch {
    // Keeping the raw text is a courtesy; failing to keep it changes nothing.
  }
  emitTrace({ tick: 0, category: 'account.unreadable', reason, summary: `account record unreadable (${reason}); starting empty` });
  return traceLoaded({ account: emptyAccount(seed), source: 'unreadable' });
}

/** Write the record. Never throws: a failed write is traced and reported. */
export function saveAccount(account: AccountRecord, tick = 0): { ok: boolean; error?: string } {
  let result: { ok: boolean; error?: string };
  const store = storage();
  if (!store) {
    result = { ok: false, error: 'storage unavailable' };
  } else {
    try {
      store.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
      result = { ok: true };
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  emitTrace({
    tick,
    category: 'account.saved',
    cycleCount: account.cycleCount,
    ok: result.ok,
    ...(result.error ? { error: result.error } : {}),
    summary: result.ok ? `account saved: cycle ${account.cycleCount}` : `account save failed: ${result.error}`,
  });
  return result;
}
