/**
 * THR-1844 slice 3 — choices that widen across runs: four hungers on run 1, one woken
 * each age, second courts, sealed god cards. Plan
 * `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` § Engine pillar E8/E9.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { AccountRecord } from '../../types/account';
import { initializeGameStateFromIdentity, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { computeHarvest, startTwilight } from '../cycleEnd';
import {
  awakeHungers,
  concludeRun,
  drawUnsealedCards,
  emptyAccount,
  isCardSealed,
  migrateAccount,
  openCourts,
  runOneSealedCardIds,
  sealedCardIds,
  wakeHunger,
} from '../accountRecord';
import { SAMPLE_UNSEALED_CARD_IDS, sampleAccount } from '../accountStore';
import { godCards, offerableCards } from '../godProgression';
import { offerAwakeHungers, MAX_HUNGERS_OFFERED } from '../remembrance';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import { ORIGIN_FRAGMENTS, DRIVE_FRAGMENTS } from '../../data/remembrance-fragments';
import { RUN_ONE_AWAKE_HUNGERS, ACCOUNT_CARD_UNLOCKS_PER_RUN } from '../../data/account-content';

function newWorld(account?: AccountRecord): GameState {
  resetEventCounter();
  resetDecisionCache();
  return initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small', undefined, account).state;
}

const hunger = (id: string) => HUNGER_CATALOG.find(h => h.id === id)!;

describe('THR-1844 — the sealed card set (Decided 13)', () => {
  const catalog = godCards();

  it('run 1 seals 23 market cards: every sphere-bound Tier 3 but its sphere\'s cheapest, and every sphere-bound Tier 4', () => {
    const sealed = runOneSealedCardIds(catalog);
    expect(sealed).toHaveLength(23);
    const byId = new Map(catalog.map(t => [t.id, t]));
    for (const id of sealed) {
      const p = byId.get(id)!.progression!;
      expect(p.offer).toBe('market');
      expect(p.generic).toBe(false);
      expect(p.tier).toBeGreaterThanOrEqual(3);
    }
    // Every sphere keeps exactly one open Tier 3 (its cheapest).
    const openTierThree = catalog.filter(t => t.progression?.offer === 'market' && t.progression.tier === 3
      && !t.progression.generic && !sealed.includes(t.id));
    const spheres = openTierThree.map(t => t.progression?.pricedIn ?? t.sphereAffinity);
    expect(new Set(spheres).size).toBe(spheres.length);
    // The run-1 market keeps 70 or more (THR-1773: "70 market cards").
    const market = catalog.filter(t => t.progression?.offer === 'market');
    expect(market.length - sealed.length).toBeGreaterThanOrEqual(70);
  });

  it('an unsealed card leaves the sealed set; the sample\'s two were sealed on run 1', () => {
    const runOne = runOneSealedCardIds(catalog);
    for (const id of SAMPLE_UNSEALED_CARD_IDS) expect(runOne).toContain(id);
    const sample = sampleAccount();
    expect(sealedCardIds(sample, catalog)).toHaveLength(runOne.length - SAMPLE_UNSEALED_CARD_IDS.length);
    expect(isCardSealed(sample, SAMPLE_UNSEALED_CARD_IDS[0], catalog)).toBe(false);
    expect(isCardSealed(emptyAccount(1), SAMPLE_UNSEALED_CARD_IDS[0], catalog)).toBe(true);
  });

  it('the unseal draw is two cards, deterministic, weighted to the god\'s spheres', () => {
    const a = drawUnsealedCards(emptyAccount(1), ['spirit', 'life'], 42, catalog);
    const b = drawUnsealedCards(emptyAccount(1), ['spirit', 'life'], 42, catalog);
    expect(a).toEqual(b);
    expect(a.cardIds).toHaveLength(ACCOUNT_CARD_UNLOCKS_PER_RUN);
    expect(new Set(a.cardIds).size).toBe(a.cardIds.length);
    for (const id of a.cardIds) expect(runOneSealedCardIds(catalog)).toContain(id);
    // Over many worlds, the god's primary sphere is drawn more often than an even share.
    let spirit = 0;
    let total = 0;
    const byId = new Map(catalog.map(t => [t.id, t]));
    // Draw seeds, not ticks: no world is built in this loop.
    for (const seed of Array.from({ length: 300 }, (_, i) => i + 1)) {
      for (const id of drawUnsealedCards(emptyAccount(1), ['spirit', 'life'], seed, catalog).cardIds) {
        total++;
        const t = byId.get(id)!;
        if ((t.progression?.pricedIn ?? t.sphereAffinity) === 'spirit') spirit++;
      }
    }
    const spiritShare = runOneSealedCardIds(catalog).filter(id => {
      const t = byId.get(id)!;
      return (t.progression?.pricedIn ?? t.sphereAffinity) === 'spirit';
    }).length / runOneSealedCardIds(catalog).length;
    expect(spirit / total).toBeGreaterThan(spiritShare);
  });

  it('nothing is drawn once every card is unsealed', () => {
    const all = { unsealedCardIds: runOneSealedCardIds(catalog) };
    expect(drawUnsealedCards(all, ['spirit', 'life'], 42, catalog).cardIds).toEqual([]);
  });
});

describe('THR-1844 — hungers and courts (Decided 11, 12)', () => {
  it('run 1 wakes Gather, Witness, Reclaim and Sever, each with its default court only', () => {
    const account = emptyAccount(1);
    expect(awakeHungers(account).map(h => h.id)).toEqual(
      HUNGER_CATALOG.filter(h => RUN_ONE_AWAKE_HUNGERS.includes(h.id)).map(h => h.id),
    );
    for (const h of awakeHungers(account)) {
      const courts = openCourts(account, h);
      expect(courts).toHaveLength(1);
      expect(courts[0].isDefault).toBe(true);
    }
  });

  it('a hunger played for a run opens its second court (bare or stored id)', () => {
    expect(openCourts({ secondCourtHungerIds: ['gather'] }, hunger('gather'))).toHaveLength(2);
    expect(openCourts({ secondCourtHungerIds: ['hunger.gather'] }, hunger('gather'))).toHaveLength(2);
    expect(openCourts({ secondCourtHungerIds: ['gather'] }, hunger('witness'))).toHaveLength(1);
  });

  it('Transformation offers only awake hungers, tops up to two, and leads with the woken one', () => {
    const awake = awakeHungers(emptyAccount(1));
    const awakeIds = new Set(awake.map(h => h.id));
    for (const origin of ORIGIN_FRAGMENTS.slice(0, 6)) {
      for (const drive of DRIVE_FRAGMENTS.slice(0, 6)) {
        const offered = offerAwakeHungers(origin, drive, awake, 42);
        expect(offered.length).toBeGreaterThanOrEqual(2);
        for (const h of offered) expect(awakeIds.has(h.id)).toBe(true);
      }
    }
    const woken = wakeHunger(sampleAccount(), 'kindle');
    const offered = offerAwakeHungers(ORIGIN_FRAGMENTS[0], DRIVE_FRAGMENTS[0], awakeHungers(woken), 42, 'kindle');
    expect(offered[0].id).toBe('kindle');
    expect(offered.length).toBeLessThanOrEqual(MAX_HUNGERS_OFFERED);
  });

  it('waking a hunger traces whether it was the favoured one', () => {
    enableTracing();
    clearTraces();
    try {
      wakeHunger(sampleAccount(), 'preserve');
      const t = getTraces().find(x => x.category === 'account.hunger_woken') as { hungerId: string; favoured: boolean } | undefined;
      expect(t).toMatchObject({ hungerId: 'preserve', favoured: false });
    } finally {
      disableTracing();
    }
  });
});

describe('THR-1844 — the run end unseals, the next world seals (E9)', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => disableTracing());

  it('concludeRun unseals two cards, records them on lastRun, and traces the draw', () => {
    const state = newWorld();
    startTwilight(state);
    const after = concludeRun(emptyAccount(42), state, computeHarvest(state));
    expect(after.unsealedCardIds).toHaveLength(ACCOUNT_CARD_UNLOCKS_PER_RUN);
    expect(after.lastRun?.unsealedCardIds).toEqual(after.unsealedCardIds);
    const t = getTraces().find(x => x.category === 'account.cards_unsealed') as { cardIds: string[]; weights: number[] } | undefined;
    expect(t?.cardIds).toEqual(after.unsealedCardIds);
    expect(t?.weights).toHaveLength(ACCOUNT_CARD_UNLOCKS_PER_RUN);
    // The record round-trips with the run's unseals.
    expect(migrateAccount(JSON.parse(JSON.stringify(after)))?.lastRun?.unsealedCardIds).toEqual(after.unsealedCardIds);
  });

  it('a world built from an account carries its sealed set; one built without stays unsealed', () => {
    expect(newWorld().sealedCardIds).toBeUndefined();
    const sealedRunOne = newWorld(emptyAccount(42)).sealedCardIds ?? [];
    expect(sealedRunOne).toHaveLength(23);
    const sample = newWorld(sampleAccount()).sealedCardIds ?? [];
    expect(sample).toHaveLength(23 - SAMPLE_UNSEALED_CARD_IDS.length);
  });

  it('offerableCards never offers a sealed card, at any rung', () => {
    const open = newWorld();
    const sealed = newWorld(emptyAccount(42));
    const sealedSet = new Set(sealed.sealedCardIds);
    for (let rung = 1; rung <= 4; rung++) {
      const offered = offerableCards(sealed, rung).map(t => t.id);
      for (const id of offered) expect(sealedSet.has(id)).toBe(false);
      // The open world at the same rung offers at least as much: the filter only removes.
      expect(offerableCards(open, rung).length).toBeGreaterThanOrEqual(offered.length);
    }
    const topRungSealedOffered = offerableCards(open, 4).filter(t => sealedSet.has(t.id));
    expect(topRungSealedOffered.length).toBeGreaterThan(0);
  });
});
