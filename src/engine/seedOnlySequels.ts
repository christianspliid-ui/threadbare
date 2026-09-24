/**
 * Seed-only sequels — who plants what (THR-1526).
 *
 * Plan: `Docs/plans/2026-09-24-thr-1526-seed-only-encounters.md` § Content gates.
 *
 * A template marked `drawable: false` is never offered by the decision board: it starts
 * only when something *names* it. This module answers the two questions the gates need
 * about that promise:
 *
 *   1. **Who names it?** {@link buildSeedPlanterIndex} walks every place the corpus can
 *      name an encounter template — a template's `encounter_seed` effects (literal
 *      `templateId`, `query`, legacy `encounterFamily`, and an appointment's kept and
 *      missed branch), the undertaking-cell appointments, and the strategic packs'
 *      catalysts — and maps each named template to the sites that name it.
 *   2. **What should an author be told?** {@link seedOnlyWarnings} — a non-drawable
 *      template nothing plants (unreachable content), and an `encounter.*` seed target
 *      on the board that has not declared `drawable` either way.
 *
 * Queries are answered by {@link staticContentCatalogs} — the library, not a world — so
 * the verdict is the same on every seed and every machine, which is what a gate needs
 * (the `validateEncounterSeedRefs` rule, one file over).
 *
 * Pure. No tick-loop participation, no traces (it runs in gates and tests only).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import type { ContentQuery } from '../types/contentQuery';
import type { StrategicActionTemplate } from '../types/strategicAction';
import { allTemplateEffects } from './nudgeGrantLiveness';
import { staticContentCatalogs } from './contentCatalogView';
import { resolveContentQuery, describeContentQuery } from './contentQuery';
import type { ContentCatalogs } from './contentQuery';
import { ENCOUNTER_FAMILY_TAGS } from './encounterSeeding';
import { UNDERTAKING_CELL_APPOINTMENTS } from '../data/undertaking-cells';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
} from '../data/unified-action-templates';
import { ENCOUNTER_TEMPLATES } from '../data/encounter-content';

/**
 * Non-drawable templates the **engine** plants, by id — never named by authored content,
 * so the planter walk cannot see them (traps, apotheosis, army, route, economic
 * spawns). An entry here silences the no-planter warning. Empty today: every shipped
 * `drawable: false` template is planted by content.
 */
export const ENGINE_PLANTED_SEED_ONLY_IDS: readonly string[] = [];

/** One place the corpus names an encounter template. */
export interface SeedPlantSite {
  /** The template or pack entry that plants (for undertaking cells, the cell id). */
  readonly planterId: string;
  /** Human-readable site, e.g. `aftermath.fallback.reactions[0]`. */
  readonly site: string;
  /** `kept` / `missed` for an appointment's two branches; `plain` for any other seed. */
  readonly branch: 'plain' | 'kept' | 'missed';
  /** How the target was named. */
  readonly by: 'templateId' | 'query' | 'family';
  /** The query, when named by query (for the foreign-query pin). */
  readonly query?: ContentQuery;
}

export interface SeedPlanterIndex {
  /** Every named template id → the sites that name it. */
  readonly plantersOf: ReadonlyMap<string, readonly SeedPlantSite[]>;
  /** Ids named by a literal `templateId` seed (the undeclared-target warning's population). */
  readonly literalTargets: ReadonlySet<string>;
  /** Every site that names by query, with its resolved hits (the foreign-query pin). */
  readonly querySites: readonly { site: SeedPlantSite; hits: readonly string[] }[];
}

function encounterHits(query: ContentQuery, catalogs: ContentCatalogs): string[] {
  return resolveContentQuery(query, catalogs)
    .filter(h => h.kind === 'encounter_template')
    .map(h => h.id);
}

/**
 * Build the planter index over a corpus. `templates` defaults to the whole unified
 * catalog; `strategicTemplates` should be `getAllStrategicTemplates()` (passed in rather
 * than imported, so this module does not pull the strategic-candidate engine into every
 * gate that loads it).
 */
export function buildSeedPlanterIndex(
  strategicTemplates: readonly StrategicActionTemplate[] = [],
  templates: readonly UnifiedActionTemplate[] = UNIFIED_ACTION_TEMPLATES,
): SeedPlanterIndex {
  const catalogs = staticContentCatalogs();
  const plantersOf = new Map<string, SeedPlantSite[]>();
  const literalTargets = new Set<string>();
  const querySites: { site: SeedPlantSite; hits: readonly string[] }[] = [];

  const add = (id: string, site: SeedPlantSite) => {
    const list = plantersOf.get(id);
    if (list) list.push(site);
    else plantersOf.set(id, [site]);
  };
  const addQuery = (query: ContentQuery, site: SeedPlantSite) => {
    const hits = encounterHits(query, catalogs);
    querySites.push({ site, hits });
    for (const id of hits) add(id, site);
  };

  for (const template of templates) {
    for (const { effect, site } of allTemplateEffects(template)) {
      if (effect.kind !== 'encounter_seed') continue;
      const kept: 'plain' | 'kept' = effect.appointment ? 'kept' : 'plain';

      if (effect.templateId) {
        literalTargets.add(effect.templateId);
        add(effect.templateId, { planterId: template.id, site, branch: kept, by: 'templateId' });
      } else if (effect.query) {
        addQuery(effect.query, { planterId: template.id, site, branch: kept, by: 'query', query: effect.query });
      } else if (effect.encounterFamily) {
        const aliased = ENCOUNTER_FAMILY_TAGS[effect.encounterFamily];
        const familySite: SeedPlantSite = { planterId: template.id, site, branch: kept, by: 'family' };
        if (aliased) {
          for (const id of encounterHits({ kind: 'encounter_template', tags: [aliased] }, catalogs)) add(id, familySite);
        } else {
          const prefix = `${effect.encounterFamily}.`;
          for (const t of UNIFIED_ACTION_TEMPLATES) if (t.id.startsWith(prefix)) add(t.id, familySite);
        }
      }

      const missed = effect.appointment?.missed;
      if (missed?.templateId) {
        literalTargets.add(missed.templateId);
        add(missed.templateId, { planterId: template.id, site: `${site}.appointment.missed`, branch: 'missed', by: 'templateId' });
      } else if (missed?.query) {
        addQuery(missed.query, {
          planterId: template.id, site: `${site}.appointment.missed`, branch: 'missed', by: 'query', query: missed.query,
        });
      }
    }
  }

  for (const [cellId, payoff] of Object.entries(UNDERTAKING_CELL_APPOINTMENTS)) {
    addQuery(payoff.meeting, { planterId: cellId, site: 'undertaking.meeting', branch: 'kept', by: 'query', query: payoff.meeting });
    addQuery(payoff.missed.query, {
      planterId: cellId, site: 'undertaking.missed', branch: 'missed', by: 'query', query: payoff.missed.query,
    });
  }

  for (const strategic of strategicTemplates) {
    if (strategic.catalystQuery) {
      addQuery(strategic.catalystQuery, {
        planterId: strategic.id, site: 'catalystQuery', branch: 'plain', by: 'query', query: strategic.catalystQuery,
      });
    } else {
      for (const id of strategic.catalystEncounterIds ?? []) {
        add(id, { planterId: strategic.id, site: 'catalystEncounterIds', branch: 'plain', by: 'templateId' });
      }
    }
  }

  return { plantersOf, literalTargets, querySites };
}

/**
 * The ids the encounter cache can register — the arrays `buildEntriesForLocationAndSublocations`
 * reads (sacred-route destinations are drawn from these too). A template outside all of
 * them never reaches the board regardless of its flag.
 */
export function cacheFedTemplateIds(): ReadonlySet<string> {
  return new Set([
    ...ENCOUNTER_TEMPLATES.map(t => t.id),
    ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES.map(t => t.id),
    ...CACHE_REGISTERED_REGIONAL_TEMPLATES.map(t => t.id),
  ]);
}

/**
 * The two `check:encounter` warnings (THR-1526). Warn, never fail — the corpus tests in
 * `encounterSeedLiveness.test.ts` are the fatal gate; these are the author's early signal.
 *
 *  1. A `drawable: false` template that nothing plants is unreachable content.
 *  2. An `encounter.*` literal seed target that the board can register (cache-fed array,
 *     non-empty envelope) must *declare* `drawable` — `false` if its opening assumes its
 *     parent, `true` if it stands alone. Forgetting is the standing exposure.
 */
export function seedOnlyWarnings(
  template: UnifiedActionTemplate,
  index: SeedPlanterIndex,
  cacheFed: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  if (template.drawable === false
    && !index.plantersOf.has(template.id)
    && !ENGINE_PLANTED_SEED_ONLY_IDS.includes(template.id)) {
    out.push('drawable: false, but nothing plants it — no seed, appointment branch or catalyst names it, '
      + 'so it can never fire (THR-1526). Plant it, or add it to ENGINE_PLANTED_SEED_ONLY_IDS if the engine does.');
  }
  if (template.id.startsWith('encounter.')
    && template.drawable === undefined
    && index.literalTargets.has(template.id)
    && cacheFed.has(template.id)
    && (template.locationSubtypes?.length ?? 0) > 0) {
    const planters = [...new Set((index.plantersOf.get(template.id) ?? []).map(s => s.planterId))];
    out.push(`seed target on the board with no \`drawable\` declared (planted by ${planters.join(', ')}) — `
      + 'declare `drawable: false` if its opening assumes its parent, `drawable: true` if it stands alone (THR-1526)');
  }
  return out;
}

/** One-line description of a plant site, for test failure messages. */
export function describePlantSite(site: SeedPlantSite): string {
  return `${site.planterId} ${site.site} (${site.branch}, by ${site.by}${site.query ? ` ${describeContentQuery(site.query)}` : ''})`;
}
