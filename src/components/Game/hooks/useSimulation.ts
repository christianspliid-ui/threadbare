import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { HexTile } from '../../../types';
import type { AscendantArchetype } from '../../../types/influence';
import type { CosmologyProfile } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { RiverPath } from '../../../engine/worldGenData';
import { initializeGameState, initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, devPlaceAvatarAtSettlement, MAP_SIZE_PRESETS, DEFAULT_MAP_SIZE } from '../../../engine/gameInit';
import type { MapSizePreset } from '../../../engine/gameInit';
import type { AscendantIdentity } from '../../../types/remembrance';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../engine/orchestrator';
import { createSimulationRuntime, resetRuntimeCaches, ensureAreaProjection, ensureRealmProjection } from '../../../engine/simulationRuntime';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import {
  startTwilight,
  completeTwilight,
  computeHarvest,
} from '../../../engine/cycleEnd';
import { ageEnding, failTwilight, openTwilight, type TwilightBeats } from '../../../engine/twilight';
import type { AccountRecord } from '../../../types/account';
import { concludeRun, emptyAccount } from '../../../engine/accountRecord';
import { saveAccount } from '../../../engine/accountStore';
import type { HarvestResult } from '../../../engine/cycleEnd';
import { computeMaxEssence } from '../../../engine/influence';
import type { ScryState } from '../../../types/scry';
import { getScryTargetHexes } from '../../../engine/visibility';
import { runTickBatch } from '../../../engine/debugTickBatch';
import { offerArrivalSpineBeat } from '../../../engine/ascendantBeat';
import { isFirstBonded } from '../../../engine/meetingEncounter';
import { emitTrace } from '../../../engine/traceBuffer';
import type { ClockFirstRunTrace } from '../../../types/trace';

/** What started the clock the first time this session (THR-1716) — `clock.first_run`'s `source`. */
export type ClockFirstRunSource = ClockFirstRunTrace['source'];
import type { DebugTickBatchResult } from '../../../engine/debugTickBatch';
import type { DoomClockArchetype } from '../../../types/doomClock';

interface UseSimulationParams {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
  scryState: ScryState;
  mapSize?: MapSizePreset;
  ascendantIdentity?: AscendantIdentity;
  /**
   * Dev-only: bond The First (Kael Thornweaver) at init. Split out of the former
   * single `preSeeded` flag by THR-874 — pre-bonding The First makes
   * `isMeetTheFirstAvailable` false, so no dev URL could reach the Meet-The-First
   * beat while the two seeding actions shared one switch.
   */
  seedFirst?: boolean;
  /** Dev-only: inject the ascendant test package (actions, essence, test content). */
  seedTestPackage?: boolean;
  /**
   * Dev-only: move the avatar to a settled location so the Meet-The-First
   * auto-trigger can fire. The start shrine is not a settlement, so without this
   * the beat stays closed even with The First unbonded (THR-874).
   */
  placeAvatarForMeeting?: boolean;
  /** THR-1774: pin the doom (the showcase routes, `?doom=`). Absent → the world draws it. */
  doomArchetype?: DoomClockArchetype;
  /**
   * THR-1813 — the account record this run folds into at harvest (the stored one,
   * or the `?account=` fixture). Absent → an empty record on this seed.
   */
  account?: AccountRecord;
  /** THR-1813 — build this world from `account` (its echoes and tilt). False on the dev routes. */
  shapeWorldFromAccount?: boolean;
  /**
   * THR-1813 — write the concluded record to storage. False for a `?account=fresh`
   * / `?account=sample` session, which must never overwrite the stored record.
   * Default true.
   */
  persistAccount?: boolean;
  /** THR-1813 — an earlier run in this tab failed to save; this run is reported unkept too. */
  accountSaveFailed?: boolean;
  /** THR-1813 E6 — *Wake in a new world*: hand the concluded record up to `App`; `saved` false = the run-end save failed. */
  onWakeNewWorld?: (account: AccountRecord, saved: boolean) => void;
}

/** The record a finished run was folded into, and whether it was kept (THR-1813 E6). */
export interface ConcludedRun {
  account: AccountRecord;
  saved: boolean;
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function useSimulation({
  archetype,
  avatarName,
  cosmology,
  seed,
  scryState,
  mapSize = DEFAULT_MAP_SIZE,
  ascendantIdentity,
  seedFirst,
  seedTestPackage,
  placeAvatarForMeeting,
  doomArchetype,
  account,
  shapeWorldFromAccount,
  persistAccount = true,
  accountSaveFailed = false,
  onWakeNewWorld,
}: UseSimulationParams) {
  // ── Resolve map dimensions from preset ──
  const { cols: COLS, rows: ROWS } = MAP_SIZE_PRESETS[mapSize];

  // ── Initialize ──
  const initial = useMemo(
    () => {
      const result = ascendantIdentity
        ? initializeGameStateFromIdentity(ascendantIdentity, seed, cosmology, mapSize, doomArchetype, shapeWorldFromAccount ? account : undefined)
        : initializeGameState(archetype, avatarName, cosmology, seed, COLS, ROWS, doomArchetype);
      // Dev pre-seeding: the two actions are independently switchable (THR-874).
      // `?view=game&firstunmet` seeds the test package but leaves The First unbonded
      // so the Meet-The-First beat stays reachable.
      if (seedFirst) devSeedTheFirst(result.state);
      if (seedTestPackage) devSeedAscendantTestPackage(result.state);
      if (placeAvatarForMeeting) devPlaceAvatarAtSettlement(result.state);
      // THR-1716 E2: the arrival is a player event, so the opening beat is offered
      // here — never inside `initializeGameState`, which the CLI and every fixture
      // share. No-op when The First is already bonded (the pre-bonded dev routes).
      // THR-1837 E2: a world that arrives with The First unbonded fills its screen
      // one gift at a time. Never set in `initializeGameState` (CLI/fixtures keep
      // the full screen); the pre-bonded dev routes and warm starts stay unstaged.
      const staged = !isFirstBonded(result.state.graph, result.state.ascendantId)
        ? { openingRevealStaged: true as const }
        : {};
      const arrival = offerArrivalSpineBeat(result.state);
      if (arrival.ascendantBeats) {
        return { ...result, state: { ...result.state, ...arrival, ...staged }, arrivalBeatOffered: true };
      }
      return { ...result, state: { ...result.state, ...staged }, arrivalBeatOffered: false };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the account is read once, at world creation; a later save must not rebuild the world.
    [archetype, avatarName, cosmology, seed, COLS, ROWS, ascendantIdentity, mapSize, seedFirst, seedTestPackage, placeAvatarForMeeting, doomArchetype, shapeWorldFromAccount]
  );

  const [gameState, setGameState] = useState<GameState>(initial.state);
  const [tiles] = useState<HexTile[]>(initial.tiles);
  const [riverPaths] = useState<RiverPath[]>(initial.riverPaths);
  const [lakeIds] = useState<Int16Array>(initial.lakeIds);
  const [running, setRunning] = useState(false);
  /**
   * THR-1716 U3: true from the first time the clock runs in this session; never
   * reset (a page reload is a new arrival). Drives the first-run Play prompt.
   */
  const [clockEverRan, setClockEverRan] = useState(false);
  /** Who is about to start the clock — read once, when it first runs. Defaults to the Play control. */
  const firstRunSourceRef = useRef<ClockFirstRunSource | null>(null);
  /** Tag (or, with `null`, clear) who is about to start the clock. */
  const noteClockRunSource = useCallback((source: ClockFirstRunSource | null) => {
    firstRunSourceRef.current = source;
  }, []);
  /**
   * The world moved for the first time this session — by the running clock, a
   * Step, or a debug tick batch. Sets `clockEverRan` and traces `clock.first_run`
   * once; every later call is a no-op (ref-guarded, so the interval path is free).
   */
  const clockEverRanRef = useRef(false);
  const markClockRan = useCallback((fallback: ClockFirstRunSource) => {
    if (clockEverRanRef.current) return;
    clockEverRanRef.current = true;
    setClockEverRan(true);
    const source = firstRunSourceRef.current ?? fallback;
    firstRunSourceRef.current = null;
    emitTrace({
      tick: gameStateRef.current.tick,
      category: 'clock.first_run',
      source,
      summary: `clock ran for the first time (${source})`,
    });
  }, []);
  const [speed, setSpeed] = useState(1);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);
  /**
   * THR-1381 — the end-of-age ceremony's beats, built once when the Twilight opens;
   * null outside it. Non-null is the `age-twilight` surface's open flag.
   */
  const [twilightBeats, setTwilightBeats] = useState<TwilightBeats | null>(null);
  const twilightBeatsRef = useRef<TwilightBeats | null>(null);

  // TB-087: Per-session runtime owns caches and version counters
  const runtimeRef = useRef<SimulationRuntime>(createSimulationRuntime());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scryStateRef = useRef(scryState);
  scryStateRef.current = scryState;

  // Ref-based state to prevent React StrictMode double-invocation of runTick.
  // runTick has side effects (graph mutation, timeline appends, trace emits) that
  // are not idempotent — calling it twice per tick causes agents to move 2 hexes.
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // ── Tick ──
  const doTick = useCallback(() => {
    // THR-1716: a Step moves the world too, so the first-run prompt is done.
    markClockRan('play_control');
    const prev = gameStateRef.current;
    if (prev.phase === 'playing') {
      const targets = getScryTargetHexes(scryStateRef.current, prev.graph);
      const next = runTick(prev, targets, runtimeRef.current);
      setGameState(next);
    }
    // THR-1381: in the Twilight time is stopped — the ceremony is open and runs no tick;
    // its button (`completeTwilightNow`) is the only way out.
  }, [markClockRan]);

  // ── Debug: synchronous tick batch (THR-689) ──
  // Calling doTick() n times in a row would NOT advance n ticks: doTick reads
  // gameStateRef.current, which React only refreshes on render, so every iteration
  // would tick from the same `prev` and the counter would move by 1. The batch keeps
  // its own cursor and commits once at the end.
  const runTicksSync = useCallback((
    n: number,
    options: { markClock?: boolean } = {},
  ): Omit<DebugTickBatchResult, 'state'> => {
    // Auto-pause: leaving the interval armed would let it resume mid-inspection from
    // the state we just advanced, which is exactly the ambiguity the caller is avoiding.
    setRunning(false);
    // THR-1716: the world has moved, so the first-run prompt has done its job.
    // THR-1744: the warm start passes `markClock: false` so the arrival keeps the
    // first-run Play prompt — the player has not run the clock yet.
    if (n > 0 && options.markClock !== false) markClockRan('debug');
    const { state, ...result } = runTickBatch(
      gameStateRef.current,
      n,
      runtimeRef.current,
      s => getScryTargetHexes(scryStateRef.current, s.graph),
    );
    // Update the ref before setGameState so a subsequent call in the same task —
    // before React re-renders — starts from the advanced state, not the stale one.
    gameStateRef.current = state;
    setGameState(state);
    return result;
  }, [markClockRan]);

  const getLiveState = useCallback(() => gameStateRef.current, []);

  // ── The end of the age (THR-1381) ──
  /**
   * Leave the Twilight for the harvest — the ceremony's button, both fallbacks and
   * `endAgeNow` all come here. A `cause` marks a fallback (`twilight.fallback`).
   */
  const completeTwilightNow = useCallback((cause?: 'beats_threw' | 'mount_failed'): boolean => {
    const live = gameStateRef.current;
    if (live.phase !== 'twilight') return false;
    const next = cause ? failTwilight(live, cause) : completeTwilight(live);
    gameStateRef.current = next;
    setGameState(next);
    twilightBeatsRef.current = null;
    setTwilightBeats(null);
    setRunning(false);
    setHarvestResult(computeHarvest(next));
    return true;
  }, []);

  /** Build the beats once for a state in the Twilight; a throw goes straight to the harvest. */
  const openTwilightNow = useCallback((live: GameState) => {
    if (twilightBeatsRef.current || live.phase !== 'twilight') return;
    setRunning(false);
    const opened = openTwilight(live);
    if (opened.ok) {
      twilightBeatsRef.current = opened.beats;
      setTwilightBeats(opened.beats);
      return;
    }
    gameStateRef.current = opened.state;
    setGameState(opened.state);
    setHarvestResult(computeHarvest(opened.state));
  }, []);

  // The age-end check moved the phase to the Twilight (doom or the Mandate). Runs on
  // mount too, so a session loaded mid-ceremony reopens it (fail-soft table).
  useEffect(() => {
    if (gameState.phase === 'twilight' && !harvestResult) openTwilightNow(gameStateRef.current);
  }, [gameState.phase, harvestResult, openTwilightNow]);

  // ── First clock run (THR-1716 U3) ──
  useEffect(() => {
    if (running) markClockRan('play_control');
  }, [running, markClockRan]);

  // ── Auto-play ──
  useEffect(() => {
    if (running && gameState.phase !== 'harvest' && gameState.phase !== 'transition') {
      const ms = Math.max(50, 1000 / speed);
      intervalRef.current = setInterval(doTick, ms);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, speed, doTick, gameState.phase]);

  // ── The run end (THR-1813 E6) ──
  // The run is folded into the account and saved the moment the harvest is known,
  // so a failed save is on the harvest screen before the player wakes. The same-world
  // continuation (`transitionToNewCycle`) has no caller any more — Christian's ruling
  // on THR-1773: each run wakes in a new world.
  const baseAccountRef = useRef<AccountRecord>(account ?? emptyAccount(seed));
  baseAccountRef.current = account ?? baseAccountRef.current;
  const [concludedRun, setConcludedRun] = useState<ConcludedRun | null>(null);
  useEffect(() => {
    if (!harvestResult || concludedRun) return;
    const live = gameStateRef.current;
    const next = concludeRun(baseAccountRef.current, live, harvestResult);
    // An override session concludes in memory only; nothing failed, so no failure line.
    // A tab whose writes stopped after a failed save keeps reporting the run unkept
    // (review-gate cycle 3): its record is never written, so the screen must say so.
    const ok = persistAccount ? saveAccount(next, live.tick).ok : !accountSaveFailed;
    setConcludedRun({ account: next, saved: ok });
  }, [harvestResult, concludedRun, persistAccount, accountSaveFailed]);

  const handleWakeNewWorld = useCallback(() => {
    if (!concludedRun) return;
    setRunning(false);
    resetEventCounter();
    // A new world is a new game: the persistent id counters restart, so the next
    // world mints the same ids in this tab as after a reload (NFP 3, Decided 10).
    resetDecisionCache();
    // TB-087: the runtime's caches belong to the world that is ending.
    resetRuntimeCaches(runtimeRef.current);
    // A record that could not be kept is not carried either: the harvest screen told the
    // player the next world wakes as if for the first time, so it does — a new map on
    // the derived seed, with nothing remembered (review-gate round 2). `App` stops this tab's
    // writes on a failed save, so the earlier record on disk is never overwritten by it.
    onWakeNewWorld?.(concludedRun.saved
      ? concludedRun.account
      : emptyAccount(concludedRun.account.nextWorldSeed), concludedRun.saved);
  }, [concludedRun, onWakeNewWorld]);

  /** THR-1813 debug lever: end the age now — straight to the harvest, past the ceremony. */
  const endAgeNow = useCallback((): boolean => {
    const live = gameStateRef.current;
    if (harvestResult || live.phase === 'harvest') return false;
    setRunning(false);
    const next = completeTwilight(live.phase === 'twilight' ? live : startTwilight(live));
    gameStateRef.current = next;
    setGameState(next);
    twilightBeatsRef.current = null;
    setTwilightBeats(null);
    setHarvestResult(computeHarvest(next));
    return true;
  }, [harvestResult]);

  /**
   * THR-1381 debug lever: end the age now by the normal path (the Mandate if it is
   * fulfilled, else doom) and open the ceremony. False when the age has already ended.
   */
  const beginTwilightNow = useCallback((): boolean => {
    const live = gameStateRef.current;
    if (harvestResult || live.phase !== 'playing') return false;
    const next = startTwilight(live);
    const ending = ageEnding(next);
    emitTrace({
      tick: next.tick,
      category: 'age.ended',
      by: ending.kind,
      ...(ending.kind === 'doom' && ending.archetype ? { archetype: ending.archetype } : {}),
      summary: `age.ended: ${ending.title} (debug lever) — the Twilight begins`,
    });
    gameStateRef.current = next;
    setGameState(next);
    openTwilightNow(next);
    return true;
  }, [harvestResult, openTwilightNow]);

  /** THR-1813 debug read: the record `concludeRun` would write now, without saving. */
  const previewRunEnd = useCallback((): AccountRecord => {
    const live = gameStateRef.current;
    return concludeRun(baseAccountRef.current, live, harvestResult ?? computeHarvest(live));
  }, [harvestResult]);

  // Toggle running
  const handleToggleRunning = useCallback(() => {
    setRunning(r => !r);
  }, []);

  // Derived display values
  const seasonName = SEASONS[gameState.clock.season % 4] ?? 'spring';
  // THR-1452: was `Math.floor(gameState.tick / 120) + 1` — a divisor of the top bar's own that
  // disagreed threefold with the season rendered beside it. Both halves are the engine's clock
  // now; `+ 1` is display convention only (the engine's year is 0-based).
  const year = gameState.clock.year + 1;
  const maxEssence = useMemo(
    () => computeMaxEssence(gameState.graph, gameState.ascendantId),
    // TB-086: Key off worldVersion, not graph identity (graph is mutated in place)
    [gameState.graph, gameState.ascendantId, runtimeRef.current.worldVersion],
  );

  // THR-1155: the Area partition the map draws. The runtime owns it — this memo only
  // re-reads it — so the borders, the labels and anything that resolves an Area come
  // from one projection. Keyed on structuralCacheVersion because that is what the
  // `ensure` rebuilds on; an Area's membership is worldgen-fixed, so a per-tick
  // recompute would be waste.
  const areaProjection = useMemo(
    () => ensureAreaProjection(runtimeRef.current, gameState.graph, tiles),
    [gameState.graph, tiles, runtimeRef.current.structuralCacheVersion],
  );

  // THR-1155: the political map. Same ownership as the Area partition and the same
  // memo key — but unlike it, this one moves: a conquest bumps
  // `structuralCacheVersion`, the memo re-reads, and the red border follows the towns
  // the Realms now hold. The setter-less `regionData` state this replaced could not.
  const realmProjection = useMemo(
    () => ensureRealmProjection(runtimeRef.current, gameState.graph, tiles, gameState.clock.currentTick),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the tick is read, not keyed on:
    // keying it would rebuild the projection every tick, which is what the version counter exists to avoid.
    [gameState.graph, tiles, runtimeRef.current.structuralCacheVersion],
  );

  return {
    gameState,
    setGameState,
    tiles,
    riverPaths,
    lakeIds,
    areaProjection,
    realmProjection,
    running,
    speed,
    setSpeed,
    harvestResult,
    /** THR-1381: the end-of-age ceremony's beats (null outside the Twilight). */
    twilightBeats,
    /** THR-1381: *See what the age leaves* — and the fallbacks, with a cause. */
    completeTwilightNow,
    beginTwilightNow,
    doTick,
    /** THR-689: advance n ticks synchronously, bypassing the document.hidden-throttled interval. */
    runTicksSync,
    /** THR-1744: the live state as `runTicksSync` left it, before React re-renders. Read-only. */
    getLiveState,
    /** THR-1813: the record this run was folded into at harvest (null before the harvest). */
    concludedRun,
    /** THR-1813: the record this run folds into — the one the world was loaded with. */
    baseAccount: baseAccountRef.current,
    handleWakeNewWorld,
    endAgeNow,
    previewRunEnd,
    handleToggleRunning,
    setRunning,
    /** THR-1716: true once the clock has run in this session. */
    clockEverRan,
    /** THR-1716: the opening beat was offered at arrival, before any tick (E1/E2). */
    arrivalBeatOffered: initial.arrivalBeatOffered,
    /** THR-1716: tag who is about to start the clock, for `clock.first_run`. */
    noteClockRunSource,
    seasonName,
    year,
    maxEssence,
    COLS,
    ROWS,
    /** TB-086: Per-session runtime with version counters for change detection */
    runtime: runtimeRef.current,
  };
}
