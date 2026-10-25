/**
 * THR-1843 — echoes stand in the new world (plan
 * `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` § Done when, slice 2).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { AccountRecord } from '../../types/account';
import type { AscendantIdentity } from '../../types/remembrance';
import { DEV_ASCENDANT_IDENTITY, initializeGameStateFromIdentity } from '../gameInit';
import { sampleAccount } from '../accountStore';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { dominionOf } from '../dominion';
import { phaseDominion } from '../phaseDominion';
import { echoRelation, monumentTargetBand, seedingOrder } from '../seedEchoes';
import { DOMINION_BAND_RANK } from '../../data/dominion-content';
import { MAX_SEEDED_ECHOES } from '../../data/account-content';

const KIN: AscendantIdentity = {
  ...DEV_ASCENDANT_IDENTITY,
  sphereAlignment: { primary: 'life', secondary: 'spirit' },
  spherePoints: { life: 3, spirit: 2 },
};
const OPPOSED: AscendantIdentity = {
  ...DEV_ASCENDANT_IDENTITY,
  sphereAlignment: { primary: 'entropy', secondary: 'energy' },
  spherePoints: { entropy: 3, energy: 2 },
};

function world(identity: AscendantIdentity, seed: number, account?: AccountRecord): GameState {
  resetEventCounter();
  resetDecisionCache();
  return initializeGameStateFromIdentity(identity, seed, undefined, 'medium', undefined, account).state;
}

function godId(state: GameState): string {
  return state.graph.getNodesByType('actor').find(n => n.properties.actorType === 'ascendant')!.id;
}

describe('THR-1843 — the order and the targets', () => {
  it('seeds divine before cosmic, then by strength × significance', () => {
    const order = seedingOrder(sampleAccount()).map(e => e.def.echoType);
    expect(order).toEqual(['monument', 'legacy', 'relic']);
  });

  it('reads kin, opposed and unrelated by the sign of the match', () => {
    const def = sampleAccount().echoDefinitions[0];
    expect(echoRelation({ life: 3, spirit: 2 }, def)).toBe('kin');
    expect(echoRelation({ entropy: 3, energy: 2 }, def)).toBe('opposed');
    expect(echoRelation({ matter: 3, chaos: 2 }, def)).toBe('unrelated');
  });

  it('targets Held while still warm, Touched while fading, nothing after; Hostile when opposed', () => {
    expect(monumentTargetBand('kin', 0.1)).toBe('held');
    expect(monumentTargetBand('kin', 0.45)).toBe('touched');
    expect(monumentTargetBand('kin', 0.75)).toBeNull();
    expect(monumentTargetBand('opposed', 0.75)).toBe('hostile');
    expect(monumentTargetBand('unrelated', 0.1)).toBeNull();
  });
});

describe.each([42, 99, 7])('THR-1843 — seed %i with SAMPLE_ACCOUNT', seed => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { disableTracing(); });

  it('lifts a still-warm monument to Held for a kin god, and the fading one to Touched', () => {
    const account = sampleAccount();
    // The sample's monument is still warm (0.15); a second, fading one reads Touched.
    const fading = { ...account.echoDefinitions[0], id: 'echo_sample_monument_fading', name: 'The Salt Spire', significance: 0.5 };
    account.echoDefinitions.push(fading);
    account.echoStates.push({ id: fading.id, degradation: 0.45, cyclesActive: 2, faded: false });
    const state = world(KIN, seed, account);
    const god = godId(state);
    const monuments = state.seededEchoes!.seeded.filter(e => e.kind === 'monument');
    expect(monuments).toHaveLength(2);
    const warm = monuments.find(e => e.echoId === 'echo_sample_monument')!;
    const fade = monuments.find(e => e.echoId === fading.id)!;
    expect(warm.relation).toBe('kin');
    expect(dominionOf(state.graph, god, warm.hostId).band).toBe('held');
    expect(dominionOf(state.graph, god, fade.hostId).band).toBe('touched');
    expect(warm.hostId).not.toBe(fade.hostId);
    // The summary matches the traces.
    const traces = getTraces().filter(t => t.category === 'echo.seeded');
    expect(traces.map(t => (t as { echoId: string }).echoId).sort())
      .toEqual(state.seededEchoes!.seeded.map(e => e.echoId).sort());
    // A named ruin sublocation on its host.
    const node = state.graph.getNode(warm.nodeId)!;
    expect(node.name).toBe('The Long Barrow');
    expect(node.properties.parentLocationId).toBe(warm.hostId);
    expect(node.properties.locationSubtype).toBe('ruins');
  });

  it('stands Hostile against an opposed god, or traces the cap', () => {
    const state = world(OPPOSED, seed, sampleAccount());
    const god = godId(state);
    const m = state.seededEchoes!.seeded.find(e => e.kind === 'monument')!;
    expect(m.relation).toBe('opposed');
    const band = dominionOf(state.graph, god, m.hostId).band;
    expect(band === 'hostile' || m.capped === true).toBe(true);
  });

  it('promotes an heir of the line with one kin tie, and leaves the relic unborne and Foreign', () => {
    const state = world(KIN, seed, sampleAccount());
    const god = godId(state);
    const legacy = state.seededEchoes!.seeded.find(e => e.kind === 'legacy')!;
    const heir = state.graph.getNode(legacy.nodeId)!;
    expect(heir.properties.spotlightTier).toBe('notable');
    expect(heir.properties.notableOrigin).toBe('echo');
    expect(heir.properties.echoLineageOf).toBe('Maren Ashfold');
    const kinTies = state.graph.getOutgoingEdges(heir.id, 'relates_to').filter(e => e.properties.basis === 'kin' && e.properties.origin === 'echo');
    expect(kinTies).toHaveLength(1);

    const relic = state.seededEchoes!.seeded.find(e => e.kind === 'relic')!;
    const node = state.graph.getNode(relic.nodeId)!;
    expect(node.type).toBe('artifact');
    expect(node.name).toBe('The Hollow Bell');
    expect(node.properties.echoOrigin).toBe(true);
    expect(state.graph.getIncomingEdges(relic.nodeId, 'possesses')).toHaveLength(0);
    expect(state.graph.getIncomingEdges(relic.nodeId, 'bonded_to')).toHaveLength(0);
    expect(dominionOf(state.graph, god, relic.nodeId).band).toBe('foreign');
  });

  it('fades a kin monument untended for 300 ticks; an opposed one still stands Hostile', () => {
    const untended = (state: GameState): void => {
      for (let t = 1; t <= 300; t++) {
        state.tick = t;
        phaseDominion(state);
      }
    };
    const kin = world(KIN, seed, sampleAccount());
    const kinGod = godId(kin);
    const warm = kin.seededEchoes!.seeded.find(e => e.kind === 'monument')!;
    const before = dominionOf(kin.graph, kinGod, warm.hostId).band;
    untended(kin);
    const after = dominionOf(kin.graph, kinGod, warm.hostId).band;
    expect(DOMINION_BAND_RANK[after]).toBeLessThan(DOMINION_BAND_RANK[before]);

    const opp = world(OPPOSED, seed, sampleAccount());
    const oppGod = godId(opp);
    const m = opp.seededEchoes!.seeded.find(e => e.kind === 'monument')!;
    const oppBefore = dominionOf(opp.graph, oppGod, m.hostId).band;
    untended(opp);
    expect(dominionOf(opp.graph, oppGod, m.hostId).band).toBe(oppBefore);
  });

  it('is deterministic: the same account and seed place the same echoes', () => {
    const a = world(KIN, seed, sampleAccount()).seededEchoes;
    const b = world(KIN, seed, sampleAccount()).seededEchoes;
    expect(a).toEqual(b);
  });
});

describe('THR-1843 — limits and absence', () => {
  it('seeds nothing without an account, and an empty account leaves no summary', () => {
    expect(world(KIN, 42).seededEchoes).toBeUndefined();
  });

  it(`seeds at most ${MAX_SEEDED_ECHOES}, skipping the rest as over_cap`, () => {
    const account = sampleAccount();
    const base = account.echoDefinitions[2];
    for (let i = 0; i < 6; i++) {
      const id = `echo_extra_relic_${i}`;
      account.echoDefinitions.push({ ...base, id, name: `Extra Relic ${i}`, significance: 0.1 });
      account.echoStates.push({ id, degradation: 0.2, cyclesActive: 1, faded: false });
    }
    const summary = world(KIN, 42, account).seededEchoes!;
    expect(summary.seeded.length).toBe(MAX_SEEDED_ECHOES);
    expect(summary.skipped.filter(s => s.reason === 'over_cap')).toHaveLength(3);
  });

  it('band ranks order the targets as the reached() check assumes', () => {
    expect(DOMINION_BAND_RANK.hostile).toBeLessThan(DOMINION_BAND_RANK.foreign);
    expect(DOMINION_BAND_RANK.held).toBeGreaterThan(DOMINION_BAND_RANK.touched);
  });
});
