/**
 * The seed-consumption ledger (THR-1514): what became of a seed, read off
 * `state.tickEvents` and `pendingEncounterSeeds` alone — never off the trace ring.
 *
 * The states here are the two fields the ledger reads plus `tick`; nothing else is
 * invented. The direct-template case names a real catalog entry and asserts it resolves,
 * so the fixture cannot pass by inventing an id.
 */
import { describe, it, expect } from 'vitest';

import { STRATEGIC_CATALYST_REACTION_ID } from '../../src/data/strategic-action-constants';
import { getUnifiedTemplateById } from '../../src/data/unified-action-templates';
import type { GameState, TickEvent } from '../../src/types/gameState';
import type { PendingEncounterSeed } from '../../src/types/unifiedAction';
import {
  SeedConsumptionLedger,
  consumptionOf,
  queryOutcomeOf,
} from '../seed-consumption-ledger.js';

const REAL_TEMPLATE = 'mct.quest.caravan_escort';

function seed(overrides: Partial<PendingEncounterSeed> & { seedId: string }): PendingEncounterSeed {
  return {
    sourceEncounterId: 'src',
    sourceReactionId: 'aftermath',
    targetAgentId: 'agent_1',
    eligibleAfterTick: 0,
    priority: 1,
    seedLabel: 'a seed',
    plantedTick: 0,
    ...overrides,
  };
}

function event(id: string, tick: number): TickEvent {
  return { id, tick, type: 'narrative', message: id, significance: 0.3 } as TickEvent;
}

function stateAt(tick: number, pending: readonly PendingEncounterSeed[], events: readonly TickEvent[]): GameState {
  return { tick, pendingEncounterSeeds: pending, tickEvents: events } as unknown as GameState;
}

describe('SeedConsumptionLedger', () => {
  it('registers a pending seed with its site and whether resolving it runs a content query', () => {
    expect(getUnifiedTemplateById(REAL_TEMPLATE)).toBeDefined();
    const ledger = new SeedConsumptionLedger();
    ledger.observe(stateAt(1, [
      seed({ seedId: 'catalyst_a', sourceReactionId: STRATEGIC_CATALYST_REACTION_ID, query: { kind: 'encounter_template', tags: ['#consortium_errand'] } }),
      seed({ seedId: 'direct_b', templateId: REAL_TEMPLATE }),
      seed({ seedId: 'aliased_c', encounterFamily: 'bf.quest' }),
      seed({ seedId: 'dangling_d', templateId: 'no.such.template', query: { kind: 'encounter_template', tags: ['#consortium_errand'] } }),
      seed({ seedId: 'bare_e' }),
    ], []));

    const by = (id: string) => ledger.get(id)!;
    expect(by('catalyst_a')).toMatchObject({ site: 'undertaking_catalyst', ranQuery: true, left: false });
    expect(by('direct_b')).toMatchObject({ site: 'encounter_seed', ranQuery: false });
    expect(by('aliased_c')).toMatchObject({ site: 'encounter_seed', ranQuery: true });
    // An unresolvable templateId falls through to the query, so the query runs.
    expect(by('dangling_d')).toMatchObject({ ranQuery: true });
    expect(by('bare_e')).toMatchObject({ ranQuery: false });
  });

  it('reads each consumption off the suffixed tick event, with the tick it happened on', () => {
    const ledger = new SeedConsumptionLedger();
    const seeds = [seed({ seedId: 's1' }), seed({ seedId: 's2' }), seed({ seedId: 's3' }), seed({ seedId: 's4' })];
    ledger.observe(stateAt(5, seeds, []));
    ledger.observe(stateAt(6, [seeds[3]], [
      event('s1_spawned', 6), event('s2_family_ready', 6), event('s3_orphaned', 6),
      // Unrelated events with the same suffix shape but no registered seed are counted, not attributed.
      event('somebody_else_expired', 6),
    ]));

    expect(ledger.get('s1')).toMatchObject({ consumption: 'spawned', consumedTick: 6, left: true });
    expect(ledger.get('s2')).toMatchObject({ consumption: 'family_ready', consumedTick: 6, left: true });
    expect(ledger.get('s3')).toMatchObject({ consumption: 'orphaned', consumedTick: 6, left: true });
    expect(ledger.get('s4')).toMatchObject({ left: false });
    expect(ledger.get('s4')!.consumption).toBeUndefined();
    expect(ledger.unregisteredConsumptions).toBe(1);
    expect(ledger.summary()).toMatchObject({
      observed: 4, spawned: 1, familyReady: 1, orphaned: 1, expired: 0, pending: 1, leftUnexplained: 0, unregisteredConsumptions: 1,
    });
  });

  it('reports a seed that left the pool with no consumption event as unexplained — never as consumed', () => {
    const ledger = new SeedConsumptionLedger();
    ledger.observe(stateAt(1, [seed({ seedId: 'gone' })], []));
    ledger.observe(stateAt(2, [], []));

    expect(ledger.get('gone')).toMatchObject({ left: true });
    expect(ledger.get('gone')!.consumption).toBeUndefined();
    expect(ledger.summary().leftUnexplained).toBe(1);
  });

  it('does not double-count a consumption event observed twice', () => {
    const ledger = new SeedConsumptionLedger();
    ledger.observe(stateAt(1, [seed({ seedId: 's' })], []));
    ledger.observe(stateAt(2, [], [event('s_spawned', 2)]));
    ledger.observe(stateAt(2, [], [event('s_spawned', 2)]));
    expect(ledger.summary().spawned).toBe(1);
  });
});

describe('consumptionOf / queryOutcomeOf', () => {
  it('names the four consumptions by suffix and nothing else', () => {
    expect(consumptionOf('x_spawned')).toBe('spawned');
    expect(consumptionOf('x_family_ready')).toBe('family_ready');
    expect(consumptionOf('x_expired')).toBe('expired');
    expect(consumptionOf('x_orphaned')).toBe('orphaned');
    expect(consumptionOf('x_planted')).toBeUndefined();
  });

  it('maps a consumption to what it says about the content query the seed ran', () => {
    const site = 'undertaking_catalyst' as const;
    expect(queryOutcomeOf({ site, ranQuery: true, consumption: 'spawned' })).toBe('resolved');
    expect(queryOutcomeOf({ site, ranQuery: true, consumption: 'family_ready' })).toBe('empty');
    expect(queryOutcomeOf({ site, ranQuery: true, consumption: 'orphaned' })).toBe('none');
    expect(queryOutcomeOf({ site, ranQuery: true, consumption: undefined })).toBe('none');
    // A direct-template spawn is not a query resolution, whatever the event says.
    expect(queryOutcomeOf({ site, ranQuery: false, consumption: 'spawned' })).toBe('none');
  });
});
