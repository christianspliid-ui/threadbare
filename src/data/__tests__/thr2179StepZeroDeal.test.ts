/**
 * THR-2179 (slice 2) — the five chapters The First most often met alone now
 * deal the god a hand on step 0, and only on step 0.
 *
 * Asserted on the SHIPPED objects (`getUnifiedTemplateById`), never on the raw
 * authoring arrays: `encounter-content.ts` runs its entries through a field
 * allowlist converter, which once dropped `deal` silently (THR-1634 E1).
 */
import { describe, expect, it } from 'vitest';
import { getUnifiedTemplateById } from '../unified-action-templates';
import { chapterOffersPlayerMove } from '../../engine/playerStepHold';
import { DEAL_DEFAULT_COUNT } from '../nudge-constants';

const STEP_ZERO_DEAL_TEMPLATES: ReadonlyArray<readonly [string, string]> = [
  ['ts.quest.consecrate_ground', 'lore'],
  ['encounter.the_haggle', 'finesse'],
  ['ts.quest.tend_shrine', 'lore'],
  ['encounter.market_haggle', 'finesse'],
  ['ts.quest.heal_the_sick', 'presence'],
];

describe('THR-2179 — step-0 dealt hand on the five alone chapters', () => {
  it.each(STEP_ZERO_DEAL_TEMPLATES)('%s deals a pure-fill hand on step 0', (id, tag) => {
    const template = getUnifiedTemplateById(id);
    expect(template, `${id} is registered`).toBeDefined();
    const step0 = template!.steps![0];
    expect(step0.deal).toEqual({ count: DEAL_DEFAULT_COUNT, tags: [tag] });
    // Pure fill: no authored specials were added alongside the deal.
    expect(step0.nudges ?? []).toHaveLength(0);
  });

  it.each(STEP_ZERO_DEAL_TEMPLATES)('%s keeps steps 1+ the mortal\'s own', (id) => {
    const template = getUnifiedTemplateById(id)!;
    const later = template.steps!.slice(1);
    expect(later.length).toBeGreaterThan(0);
    for (const step of later) {
      expect(step.deal).toBeUndefined();
    }
  });

  it.each(STEP_ZERO_DEAL_TEMPLATES)('%s now offers the player a move (THR-2178 "Waits for you")', (id) => {
    expect(chapterOffersPlayerMove(getUnifiedTemplateById(id))).toBe(true);
  });
});
