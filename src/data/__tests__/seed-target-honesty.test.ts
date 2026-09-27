/**
 * THR-1565 — a seed must name a sequel whose opening is true for the parent
 * that planted it.
 *
 * Three seeds told the wrong story:
 *
 * 1. The Healer at the Ward-Gate seeded `encounter.slice.grateful_kin`, whose
 *    opening is kin to *the family from the fen road* — the Swindled Family.
 *    From the Healer it thanked the mortal for a kindness they never did.
 * 2. The Swindled Family's decline and fallback endings seeded the Swindled
 *    Family itself, under a label promising news of the family — and the scene
 *    replayed the first meeting.
 * 3. `encounter.shrine_offering` planted a seed with no `templateId`, no
 *    `query` and no `encounterFamily`, which `evaluateEncounterSeeds` discards at maturity every time.
 *
 * All three were retired rather than re-pointed: no authored sequel is true for
 * a Thornwall household, a "news of the family" scene, or a heading from the
 * stones. These pins hold the retirements and the general shapes behind them.
 */
import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { SLICE_TEMPLATE_IDS } from '../encounters/vertical-slice';

interface SeedLike {
  kind: 'encounter_seed';
  templateId?: string;
  query?: unknown;
  encounterFamily?: string;
  seedLabel?: string;
  appointment?: { missed?: SeedLike };
}

/**
 * Every `encounter_seed` object anywhere inside a template — base reactions,
 * branch arms, outcome bands, appointment branches. A deep walk rather than a
 * typed traversal because the point is to find seeds wherever an author put
 * them, including shapes a typed walker would not know to descend into.
 */
function seedsIn(template: UnifiedActionTemplate): SeedLike[] {
  const found: SeedLike[] = [];
  const seen = new Set<unknown>();
  const walk = (node: unknown): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if ((node as { kind?: unknown }).kind === 'encounter_seed') found.push(node as SeedLike);
    for (const value of Object.values(node as Record<string, unknown>)) walk(value);
  };
  walk(template.aftermathConfig);
  return found;
}

const byId = (id: string): UnifiedActionTemplate => {
  const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
  if (!template) throw new Error(`template ${id} not in UNIFIED_ACTION_TEMPLATES`);
  return template;
};

describe('seed targets tell the right story (THR-1565)', () => {
  it('no seed in the corpus names no template, no query and no family', () => {
    // The shrine_offering shape: a seed with nothing to resolve to is dropped at
    // maturity, so any chip it backs promises something that never arrives.
    const empty = UNIFIED_ACTION_TEMPLATES.flatMap(t =>
      seedsIn(t)
        .filter(s => s.templateId === undefined && s.query === undefined && s.encounterFamily === undefined)
        .map(s => `${t.id}: '${s.seedLabel ?? '(no label)'}'`),
    );
    expect(empty).toEqual([]);
  });

  it('shrine_offering plants no seed at all', () => {
    expect(seedsIn(byId('encounter.shrine_offering'))).toEqual([]);
  });

  it('the Swindled Family never seeds itself, so no ending replays the first meeting', () => {
    const family = byId(SLICE_TEMPLATE_IDS.family);
    const selfSeeds = seedsIn(family).filter(s => s.templateId === SLICE_TEMPLATE_IDS.family);
    expect(selfSeeds).toEqual([]);
  });

  it('the Grateful Kin is seeded only by the Swindled Family, the family its opening names', () => {
    // Its step-0 opening is kin to "the family from the fen road". Any other
    // parent makes that sentence false.
    const kin = byId(SLICE_TEMPLATE_IDS.gratefulKin);
    const opening = kin.steps[0];
    expect(opening && !isActionStepBranch(opening) ? opening.narrativeTemplate : '')
      .toMatch(/family from the fen road/);

    const parents = UNIFIED_ACTION_TEMPLATES
      .filter(t => seedsIn(t).some(s => s.templateId === SLICE_TEMPLATE_IDS.gratefulKin))
      .map(t => t.id);
    expect(parents).toEqual([SLICE_TEMPLATE_IDS.family]);
  });

  it('the Healer at the Ward-Gate is in the corpus the checks above walk', () => {
    // Guards the pins above against going vacuous: if the Healer dropped out of
    // UNIFIED_ACTION_TEMPLATES, "only the Family seeds the Kin" would pass for
    // the wrong reason.
    const healer = byId('healer.quest.wandering_healer_shrine_access');
    expect(seedsIn(healer).map(s => s.templateId)).not.toContain(SLICE_TEMPLATE_IDS.gratefulKin);
  });
});
