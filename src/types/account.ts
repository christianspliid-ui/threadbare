/**
 * THR-1813 — the account record: what carries between runs. Not a world save.
 *
 * It lives outside `GameState` (so the 700-importer type gains no field), enters
 * at world creation and leaves at run end. Only `accountStore.ts` reads or
 * writes it to storage; the engine is handed an object or nothing.
 */
import type { SphereName } from './index';
import type { EchoDefinition, EchoState } from './echo';
import type { FundamentState, HarvestType, ResonanceState } from './worldSoul';

export interface AccountLastRun {
  divineName: string;
  primary: SphereName;
  secondary: SphereName;
  hungerId: string;
  harvestType: HarvestType;
  /** THR-1844 — the cards this run's end unsealed (*Powers that may now rise*). */
  unsealedCardIds?: string[];
}

export interface AccountRecord {
  readonly version: 1;
  /** Runs completed (0 before the first harvest). */
  cycleCount: number;
  /** The seed the next world wakes on. */
  nextWorldSeed: number;
  awakeHungerIds: string[];
  /** Hungers whose second court has opened. */
  secondCourtHungerIds: string[];
  /** Hunger ids that stir at the next Remembrance (0 or 2); the first is favoured. */
  stirringHungerIds: string[];
  /** Cards unsealed beyond the run-1 market (THR-1811 ids). */
  unsealedCardIds: string[];
  echoDefinitions: EchoDefinition[];
  echoStates: EchoState[];
  fundament: FundamentState;
  resonance: ResonanceState;
  /** For the Remembrance step's words: the last god's name, spheres and hunger. */
  lastRun?: AccountLastRun;
}

/** Where the record a world was built from came from (`account.loaded`). */
export type AccountSource = 'stored' | 'empty' | 'fresh_param' | 'sample_param' | 'unreadable';

/** What `loadAccount` hands back: the record and how it was found. */
export interface LoadedAccount {
  account: AccountRecord;
  source: AccountSource;
}
