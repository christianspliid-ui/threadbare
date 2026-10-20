/**
 * THR-1955 — every Merchant Consortium quest id resolves to a template (war aims S2 § Data
 * tables). Before S2, seven of its ten ids named no template and drew nothing.
 */

import { describe, it, expect } from 'vitest';
import { MERCHANT_CONSORTIUM_DEFINITION } from '../merchant-consortium-definition';
import { getUnifiedTemplateById } from '../unified-action-templates';

describe('Merchant Consortium quest ids (THR-1955)', () => {
  it('resolves every quest, social, join and promotion id to a template', () => {
    const d = MERCHANT_CONSORTIUM_DEFINITION;
    const ids = [
      ...(d.questTemplateIds ?? []),
      ...(d.socialTemplateIds ?? []),
      d.joinEncounterTemplateId,
      d.promotionEncounterTemplateId,
    ].filter((x): x is string => typeof x === 'string');
    const missing = ids.filter(id => !getUnifiedTemplateById(id));
    expect(missing).toEqual([]);
  });

  it('keeps the mapped trade quests and drops the royal charter (the crown grants it later)', () => {
    const q = MERCHANT_CONSORTIUM_DEFINITION.questTemplateIds ?? [];
    expect(q).toContain('mct.senior.trade_monopoly');
    expect(q).toContain('mct.elite.market_domination');
    expect(q).not.toContain('mct.elite.royal_charter');
    expect(new Set(q).size).toBe(q.length);
  });
});
