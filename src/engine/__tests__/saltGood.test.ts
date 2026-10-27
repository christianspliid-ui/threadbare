/**
 * THR-2069 — salt is a good (Docs/plans/2026-10-26-thr-2069-salt.md).
 *
 * Binds the plan's content and engine Done-whens: the ford scene's two outcome tables carry
 * a salt stock row on exactly the success bands, Smuggle Goods carries none, and a smuggled
 * salt write into a town with no salt brings the good in and counts the town as a salt place
 * in the regional-monopoly bearing index.
 */
import { describe, it, expect } from 'vitest';
import { SMUGGLERS_FORD_TEMPLATE } from '../../data/encounters/smugglers-ford';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { W_STOCK } from '../../data/economy-shift-constants';
import { RESOURCE_CLASSES, RESOURCE_TIER_PROSE } from '../../data/resource-classes';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { applyWorldEconomyShift } from '../economyShift';
import { buildBearingIndex } from '../regionalMonopoly';
import { WorldGraph } from '../graph';
import type { OutcomeEffect } from '../../types/unifiedAction';

type Band = 'critical_success' | 'success' | 'success_at_cost' | 'failure' | 'critical_failure';
const BANDS: readonly Band[] = ['critical_success', 'success', 'success_at_cost', 'failure', 'critical_failure'];

function saltRows(effects: Partial<Record<Band, readonly OutcomeEffect[]>> | undefined, band: Band): unknown[] {
  return (effects?.[band] ?? []).filter(e =>
    e.kind === 'economy_shift' && (e as { quantity?: string }).quantity === 'stock' && (e as { good?: string }).good === 'salt');
}

describe('salt (THR-2069)', () => {
  it('is a strategic trade good with matter first, and has its own Livelihood lines', () => {
    expect(RESOURCE_DEFINITIONS.salt.sphereAffinities[0]).toBe('matter');
    expect(RESOURCE_CLASSES.salt).toMatchObject({ category: 'strategic', primarySphere: 'matter', baseValue: 1.0 });
    expect(RESOURCE_TIER_PROSE.salt.scarce).toMatch(/^Salt is dear here\./);
  });

  it.each(['negative', 'positive'] as const)('the ford\'s %s variant writes salt stock on every success band and no failure band', variant => {
    const effects = SMUGGLERS_FORD_TEMPLATE.aftermathConfig?.variants?.[variant]?.outcomeEffects as
      Partial<Record<Band, readonly OutcomeEffect[]>> | undefined;
    const amounts = BANDS.map(band => saltRows(effects, band).map(e => (e as { amount: number }).amount));
    expect(amounts).toEqual([[W_STOCK.step], [W_STOCK.small], [W_STOCK.small], [], []]);
  });

  it('Smuggle Goods carries no salt row — its salt leaves the town', () => {
    const tpl = getUnifiedTemplateById('encounter.smuggle_goods');
    expect(tpl).toBeDefined();
    const json = JSON.stringify(tpl);
    expect(json).not.toMatch(/"good":"salt"/);
  });

  it('smuggled salt brings the good into a town with none, and the town bears salt for the monopoly rule', () => {
    const g = new WorldGraph();
    g.addNode({
      id: 'hamlet', type: 'location', name: 'Hesk Crossing',
      properties: { locationSubtype: 'town', terrain: 'plains', hexCol: 0, hexRow: 0, prosperity: 40, resources: { grain: { resourceId: 'grain', quantity: 30 } } },
    });
    expect(buildBearingIndex(g).get('salt')).toBeUndefined();
    applyWorldEconomyShift(g, { quantity: 'stock', amount: W_STOCK.small, good: 'salt', settlementId: 'hamlet' }, 10);
    const salt = (g.getNode('hamlet')!.properties.resources as Record<string, { quantity: number }>).salt;
    expect(salt.quantity).toBe(5);
    expect(buildBearingIndex(g).get('salt')?.map(p => p.id)).toEqual(['hamlet']);
  });
});
