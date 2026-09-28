import { describe, it, expect } from 'vitest';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { COLORATION_TOKEN, colorationSkipReason } from '../../engine/fragmentResolution';
import { ENCOUNTER_TEMPLATES, getAnyEncounterById } from '../encounter-content';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  isEncounterShapedTemplate,
} from '../unified-action-templates';
import { SOCIAL_SCENE_TEMPLATES } from '../social-scene-templates';
import { FACTION_ENCOUNTER_TEMPLATES } from '../faction-encounter-content';
import { MERCENARY_ENCOUNTER_TEMPLATES } from '../mercenary-encounter-content';
import { ARMY_ENCOUNTER_TEMPLATES } from '../army-encounter-content';
import { MONSTER_ENCOUNTER_TEMPLATES } from '../monster-encounter-content';
import { FIGHT_ENCOUNTER_TEMPLATES } from '../fights/fight-templates';
import { BORDERLAND_ENCOUNTER_TEMPLATES } from '../borderland-encounter-content';
import { SECRET_DISCOVERY_ENCOUNTER_TEMPLATES } from '../secret-encounter-content';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../engine/gameInit';
import { generateArchetypes } from '../../engine/ascendant';
import { createBalancedCosmology } from '../../engine/cosmology';
import { getLocationNodes } from '../../engine/sublocationShape';
import {
  gatherPlaceColoration,
  buildColorationCensus,
  getCurrentCultureOf,
  describeOpeningColoration,
} from '../../engine/openingColoration';
import { enrichProse, gatherNarrativeContext } from '../../engine/proseEnrichment';
import { SPHERE_FACT_MIN_SHARE } from '../culture-sphere-lines';
import type { WorldGraph } from '../../engine/graph';

/**
 * THR-1635 corpus guards.
 *
 * **The guard is the contract** for where the compile pass is applied: every template
 * in the stated universe carries exactly one `{frag:place_fact}` token unless the
 * compile pass itself exempts it (`colorationSkipReason`: excluded prefix, no reach,
 * branch-first, no step-0 prose). The universe (plan § Systems design, part 2):
 * `ENCOUNTER_TEMPLATES`, everything `getAnyEncounterById` resolves from its pools,
 * `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, and the encounter-shaped members of
 * `UNIFIED_ACTION_TEMPLATES`. Prints the count it checked; fails at zero.
 *
 * The leak guard renders step 0 of every guarded template through `enrichProse` on a
 * generated medium world at a culture-bearing town and a strong-sphere place, per seed,
 * and requires at least one culture line and one sphere line per seed — so it cannot pass
 * vacuously on a world where neither fires. One medium world builds in ~100 ms (fast lane).
 */

const POOLS: readonly (readonly UnifiedActionTemplate[])[] = [
  SOCIAL_SCENE_TEMPLATES,
  FACTION_ENCOUNTER_TEMPLATES,
  MERCENARY_ENCOUNTER_TEMPLATES,
  ARMY_ENCOUNTER_TEMPLATES,
  MONSTER_ENCOUNTER_TEMPLATES,
  FIGHT_ENCOUNTER_TEMPLATES,
  BORDERLAND_ENCOUNTER_TEMPLATES,
  SECRET_DISCOVERY_ENCOUNTER_TEMPLATES,
];

/** The guard universe, as the templates a renderer would actually be handed. */
function universe(): { source: string; template: UnifiedActionTemplate }[] {
  const out: { source: string; template: UnifiedActionTemplate }[] = [];
  for (const t of ENCOUNTER_TEMPLATES) out.push({ source: 'ENCOUNTER_TEMPLATES', template: t });
  for (const pool of POOLS) {
    for (const raw of pool) {
      const t = getAnyEncounterById(raw.id);
      if (t) out.push({ source: 'getAnyEncounterById', template: t });
    }
  }
  for (const t of LOCATION_BRANCHING_ENCOUNTER_TEMPLATES) out.push({ source: 'LOCATION_BRANCHING', template: t });
  for (const t of UNIFIED_ACTION_TEMPLATES) {
    if (isEncounterShapedTemplate(t)) out.push({ source: 'UNIFIED_ACTION_TEMPLATES', template: t });
  }
  return out;
}

function step0(t: UnifiedActionTemplate): string {
  return ((t.steps[0] as { narrativeTemplate?: string } | undefined)?.narrativeTemplate) ?? '';
}

function tokenCount(text: string): number {
  return text.split(COLORATION_TOKEN).length - 1;
}

describe('coloration compile guard (THR-1635)', () => {
  it('every template in the universe carries exactly one {frag:place_fact}, bar the compile pass exemptions', () => {
    const all = universe();
    const guarded = all.filter(({ template }) => colorationSkipReason(template) === null);
    const offenders = guarded
      .filter(({ template }) => tokenCount(step0(template)) !== 1)
      .map(({ source, template }) => `${source}: ${template.id} (${tokenCount(step0(template))} tokens)`);

    const skipped: Record<string, number> = {};
    for (const { template } of all) {
      const reason = colorationSkipReason(template);
      if (reason) skipped[reason] = (skipped[reason] ?? 0) + 1;
    }
    console.log(
      `[THR-1635 guard] checked ${guarded.length} template entries (${new Set(guarded.map(g => g.template.id)).size} ids); `
        + `skipped ${JSON.stringify(skipped)}`,
    );

    expect(guarded.length).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it('exempt templates carry no token, and no non-encounter registry member does', () => {
    const exemptWithToken = universe()
      .filter(({ template }) => colorationSkipReason(template) !== null && step0(template).includes(COLORATION_TOKEN))
      .map(({ template }) => template.id);
    expect(exemptWithToken).toEqual([]);

    const verbsWithToken = UNIFIED_ACTION_TEMPLATES
      .filter(t => !isEncounterShapedTemplate(t) && step0(t).includes(COLORATION_TOKEN))
      .map(t => t.id);
    expect(verbsWithToken).toEqual([]);
  });

  it('getAnyEncounterById returns one stable compiled object per template', () => {
    const id = MONSTER_ENCOUNTER_TEMPLATES[0].id;
    expect(getAnyEncounterById(id)).toBe(getAnyEncounterById(id));
  });
});

// ─── Generated-world leak guard ─────────────────────────────────────

function generate(seed: number): WorldGraph {
  const archetype = generateArchetypes(4, seed)[0];
  const { cols, rows } = MAP_SIZE_PRESETS.medium;
  const { state } = initializeGameState(archetype, 'ColorationProbe', createBalancedCosmology(), seed, cols, rows);
  return state.graph;
}

/**
 * Measured on current main (plan § Re-measured): culture-bearing and strong-sphere places.
 * Re-measured 2026-09-28 for THR-1632: fringe settlements (a culture outside every
 * heartland within 4 hexes, S1d) now carry a culture — 40 → 44 on seed 42, 60 → 81 on
 * seed 99. That plan names this opening line as an intended reader.
 */
const REMEASURE: Record<number, { withCulture: number; withStrongSphere: number }> = {
  42: { withCulture: 44, withStrongSphere: 35 },
  99: { withCulture: 81, withStrongSphere: 24 },
};
const CENSUS_TOLERANCE = 0.1;

describe('coloration on a generated medium world (THR-1635)', () => {
  const guarded = universe()
    .filter(({ template }) => colorationSkipReason(template) === null)
    .map(({ template }) => template);
  const unique = [...new Map(guarded.map(t => [t.id, t])).values()];

  for (const seed of [42, 99]) {
    it(`seed ${seed}: census matches the re-measure within ±10%, and stamps are distinct`, () => {
      const graph = generate(seed);
      const census = buildColorationCensus(graph);
      const want = REMEASURE[seed];
      expect(Math.abs(census.withCulture - want.withCulture)).toBeLessThanOrEqual(want.withCulture * CENSUS_TOLERANCE);
      expect(Math.abs(census.withStrongSphere - want.withStrongSphere))
        .toBeLessThanOrEqual(want.withStrongSphere * CENSUS_TOLERANCE);
      // At most three living cultures per foundation → no two share a stamp.
      const perFoundation = new Map<string, number>();
      for (const c of census.cultures) perFoundation.set(c.foundation, (perFoundation.get(c.foundation) ?? 0) + 1);
      if ([...perFoundation.values()].every(n => n <= 3)) expect(census.sharedStamps).toEqual([]);
    });

    it(`seed ${seed}: no Location reads an unauthored cell at any reach (THR-1638)`, () => {
      // Every living culture × every reach, and every place-dominating sphere × every
      // reach, resolves to an authored line — the slice-2 Done-when, swept through the
      // same resolver `window.__DEBUG.getOpeningColoration` reads.
      const graph = generate(seed);
      const reasons: Record<string, number> = {};
      const unauthored: string[] = [];
      for (const location of getLocationNodes(graph)) {
        const readout = describeOpeningColoration(graph, location.id);
        for (const [reach, r] of Object.entries(readout.perReach)) {
          if (!r) continue;
          reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
          if (r.reason.endsWith('_cell_unauthored')) {
            unauthored.push(`${location.id} ${reach}: ${r.reason} (${readout.foundation ?? readout.dominantSphere})`);
          }
        }
      }
      console.log(`[THR-1638 cell sweep] seed ${seed}: ${JSON.stringify(reasons)}`);
      expect(unauthored).toEqual([]);
      expect((reasons.culture ?? 0) + (reasons.sphere ?? 0)).toBeGreaterThan(0);
    });

    it(`seed ${seed}: step 0 of every guarded template renders with no raw token, and both line kinds fire`, () => {
      const graph = generate(seed);
      const locations = getLocationNodes(graph);
      const town = locations.find(l => !!getCurrentCultureOf(graph, l.id));
      const wild = locations.find(l => {
        const p = gatherPlaceColoration(graph, l.id);
        return !getCurrentCultureOf(graph, l.id) && (p.sphereShare ?? 0) >= SPHERE_FACT_MIN_SHARE;
      });
      expect(town, 'a culture-bearing town').toBeDefined();
      expect(wild, 'a strong-sphere place with no culture').toBeDefined();

      const agent = graph.getNodesByType('actor').find(n => n.properties.actorType === 'individual');
      expect(agent).toBeDefined();

      let cultureLines = 0;
      let sphereLines = 0;
      const leaks: string[] = [];
      for (const place of [town!, wild!]) {
        for (const template of unique) {
          const ctx = gatherNarrativeContext(graph, agent!.id, undefined, undefined, null, undefined, 0, {
            contextFragments: template.contextFragments,
            contextFragmentTemplateId: template.id,
            templateReach: template.reach,
          });
          // Stand the render at the probe place (the agent's own location is incidental).
          const placed = { ...ctx, placeColoration: gatherPlaceColoration(graph, place.id) };
          const out = enrichProse(step0(template), placed);
          if (/\{frag:|\{demonym\}|\{place\}/.test(out)) leaks.push(`${template.id}@${place.id}`);
          const withoutLine = enrichProse(step0(template).replace(COLORATION_TOKEN, ''), placed);
          if (out !== withoutLine) {
            if (place === town) cultureLines++;
            else sphereLines++;
          }
        }
      }
      console.log(`[THR-1635 leak guard] seed ${seed}: ${unique.length} templates × 2 places; culture lines ${cultureLines}, sphere lines ${sphereLines}`);
      expect(leaks).toEqual([]);
      expect(cultureLines).toBeGreaterThan(0);
      expect(sphereLines).toBeGreaterThan(0);
    });
  }
});
