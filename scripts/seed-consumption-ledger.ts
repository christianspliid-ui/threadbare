/**
 * The seed-consumption ledger — how a proof or census decides what became of a
 * planted encounter seed **off state, never off the trace ring** (THR-1514).
 *
 * ## Why this exists
 *
 * The trace buffer is a 2000-entry ring, and a seeded run emits tens of thousands of
 * traces, so whether a given `content.query_resolved` / `content.query_empty` is still
 * there when a proof looks depends on when it looked and how it harvested — and the
 * harvest both proofs used stopped at the ring's first eviction (`ring-harvest.ts`).
 * `check:undertaking-live` let the *absence* of a `content.query_empty` decide its
 * `catalyst_seeded` fail branch and printed "the seed was consumed … but no query trace
 * survived", which authored a false Medium engine bug (THR-1510, "silent state-write
 * drop"; impediment row 1049). Re-measured with this exact probe: 17 of 17 catalyst
 * seeds across two worlds consumed, 0 dropped.
 *
 * ## What is durable
 *
 * Every path that consumes a seed in `evaluateEncounterSeeds` writes one
 * `TickEvent` onto `state.tickEvents` whose id is the seed id plus a suffix:
 *
 *   `_spawned`       — a template resolved (direct id, query, or prefix scan) and an
 *                      action was spawned; `unifiedActions[].spawnedFromSeedId` is
 *                      the cross-check while the action survives its retention.
 *   `_family_ready`  — the seed named a family (by query or prefix) and no member
 *                      was eligible where it was judged: the *withered* case.
 *   `_expired`       — neither template nor family nor query; nothing to resolve.
 *   `_orphaned`      — the target is no longer a live node.
 *
 * Tick events live on the state and are replaced each tick, so a ledger that
 * observes the state after **every** `runTick` sees every consumption exactly once.
 * A seed still in `pendingEncounterSeeds` was not consumed; a seed that left it
 * with no suffixed event is the only remaining *unknown* — and it is reported as
 * unknown, never as dropped.
 *
 * ## What a consumption says about the content query
 *
 * A `_spawned` is a query **resolution** only when the seed actually ran a query:
 * `seedContentQuery(seed)` is defined and no direct `templateId` short-circuited it.
 * A `_family_ready` on such a seed is a query that resolved **empty**. Neither
 * `_expired` nor `_orphaned` ran a query. That is the classification the census
 * needs per site, and it is decided here once so the two scripts cannot disagree.
 *
 * Deliberately pure over the state it is handed: it never emits, never mutates, and
 * its output is a function of the sequence of states it observed (NFP #2, #3).
 */
import { seedContentQuery, seedQuerySite } from '../src/engine/encounterSeeding';
import { getUnifiedTemplateById } from '../src/data/unified-action-templates';
import type { GameState } from '../src/types/gameState';
import type { PendingEncounterSeed } from '../src/types/unifiedAction';
import type { ContentQuerySite } from '../src/types/contentQuery';

// ─── Shapes ─────────────────────────────────────────────────────────

/** The four ways a seed leaves `pendingEncounterSeeds`, named by the tick-event suffix. */
export type SeedConsumption = 'spawned' | 'family_ready' | 'expired' | 'orphaned';

/** Suffix → consumption, in the order the seeding phase can write them. */
export const SEED_CONSUMPTION_SUFFIXES: Readonly<Record<SeedConsumption, string>> = {
  spawned: '_spawned',
  family_ready: '_family_ready',
  expired: '_expired',
  orphaned: '_orphaned',
};

export interface SeedLedgerEntry {
  readonly seedId: string;
  /** The seed as first observed pending — provenance, query, anchor, target. */
  readonly seed: PendingEncounterSeed;
  /** The query site its resolution is traced at (`seedQuerySite`). */
  readonly site: ContentQuerySite;
  /**
   * Whether resolving this seed runs a content query at all: it carries one (authored,
   * or aliased from a family prefix) and no direct `templateId` resolves ahead of it.
   */
  readonly ranQuery: boolean;
  /** Tick the ledger first saw it pending. */
  readonly observedTick: number;
  /** How it was consumed, once a suffixed tick event names it. */
  readonly consumption?: SeedConsumption;
  readonly consumedTick?: number;
  /** True once the seed is gone from `pendingEncounterSeeds`, whether or not an event named it. */
  readonly left: boolean;
}

/** One row of the census's state-derived per-site tally. */
export interface SeedConsumptionRecord {
  readonly site: ContentQuerySite;
  readonly ranQuery: boolean;
  readonly consumption: SeedConsumption | undefined;
}

// ─── Ledger ─────────────────────────────────────────────────────────

export class SeedConsumptionLedger {
  private readonly entries = new Map<string, SeedLedgerEntry>();
  /**
   * Suffixed tick events whose seed the ledger never saw pending — a seed planted
   * and consumed inside one tick, or one already pending before the ledger started.
   * Counted so a report can say the sweep was incomplete rather than silently under.
   */
  private unregistered = 0;

  /**
   * Observe a state after a `runTick`. Registers every pending seed not yet known,
   * then reads this tick's events for consumptions of known seeds, then marks any
   * known seed no longer pending as having left.
   */
  observe(state: GameState): void {
    const pending = state.pendingEncounterSeeds ?? [];
    const pendingIds = new Set<string>();
    for (const seed of pending) {
      pendingIds.add(seed.seedId);
      if (this.entries.has(seed.seedId)) continue;
      const directTemplate = seed.templateId ? getUnifiedTemplateById(seed.templateId) : undefined;
      this.entries.set(seed.seedId, {
        seedId: seed.seedId,
        seed,
        site: seedQuerySite(seed),
        ranQuery: !directTemplate && seedContentQuery(seed) !== undefined,
        observedTick: state.tick,
        left: false,
      });
    }

    for (const event of state.tickEvents) {
      const consumption = consumptionOf(event.id);
      if (!consumption) continue;
      const seedId = event.id.slice(0, -SEED_CONSUMPTION_SUFFIXES[consumption].length);
      const entry = this.entries.get(seedId);
      if (!entry) { this.unregistered++; continue; }
      if (entry.consumption) continue;
      this.entries.set(seedId, { ...entry, consumption, consumedTick: event.tick, left: true });
    }

    for (const [seedId, entry] of this.entries) {
      if (!entry.left && !pendingIds.has(seedId)) {
        this.entries.set(seedId, { ...entry, left: true });
      }
    }
  }

  all(): readonly SeedLedgerEntry[] {
    return [...this.entries.values()];
  }

  get(seedId: string): SeedLedgerEntry | undefined {
    return this.entries.get(seedId);
  }

  /** The per-site rows the census folds. */
  records(): readonly SeedConsumptionRecord[] {
    return this.all().map(e => ({ site: e.site, ranQuery: e.ranQuery, consumption: e.consumption }));
  }

  get unregisteredConsumptions(): number {
    return this.unregistered;
  }

  /** Counts for a report: planted, each consumption, pending at the end, and the unknowns. */
  summary(): SeedLedgerSummary {
    const entries = this.all();
    const by = (c: SeedConsumption) => entries.filter(e => e.consumption === c).length;
    return {
      observed: entries.length,
      spawned: by('spawned'),
      familyReady: by('family_ready'),
      expired: by('expired'),
      orphaned: by('orphaned'),
      pending: entries.filter(e => !e.left).length,
      leftUnexplained: entries.filter(e => e.left && !e.consumption).length,
      unregisteredConsumptions: this.unregistered,
    };
  }
}

export interface SeedLedgerSummary {
  readonly observed: number;
  readonly spawned: number;
  readonly familyReady: number;
  readonly expired: number;
  readonly orphaned: number;
  readonly pending: number;
  /** Left `pendingEncounterSeeds` with no suffixed tick event: the only honest "unknown". */
  readonly leftUnexplained: number;
  readonly unregisteredConsumptions: number;
}

/** Which consumption a tick-event id names, if any. Pure; exported for the fold's tests. */
export function consumptionOf(eventId: string): SeedConsumption | undefined {
  for (const [consumption, suffix] of Object.entries(SEED_CONSUMPTION_SUFFIXES) as [SeedConsumption, string][]) {
    if (eventId.endsWith(suffix)) return consumption;
  }
  return undefined;
}

/**
 * What a consumption says about the content query the seed ran, per site.
 * `resolved` — the query picked a template and an action spawned;
 * `empty` — the query found no eligible member (the seed withered);
 * `none` — no query ran (direct template, expired, orphaned) or nothing consumed it yet.
 */
export function queryOutcomeOf(record: SeedConsumptionRecord): 'resolved' | 'empty' | 'none' {
  if (!record.ranQuery) return 'none';
  if (record.consumption === 'spawned') return 'resolved';
  if (record.consumption === 'family_ready') return 'empty';
  return 'none';
}
