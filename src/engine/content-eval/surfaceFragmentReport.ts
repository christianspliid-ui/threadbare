/**
 * Surface-fragment inventory (THR-573).
 *
 * Pure, deterministic sweep over every authored pool that can carry
 * `contextFragments`, reporting the measured surface count per template plus any
 * authoring problems. Independent of any live session — the DebugPanel "Fragments" tab,
 * the `__DEBUG` bridge, and the volume-model script all read this one module, so the
 * ~1,000-surface target is an observable rather than an assertion.
 */

import { UNIFIED_ACTION_TEMPLATES, LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../../data/unified-action-templates';
import { SOCIAL_SCENE_TEMPLATES } from '../../data/social-scene-templates';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { enumerateTemplateSurfaces, type SurfaceEnumeration } from '../fragmentResolution';

/** One template's fragment inventory. */
export interface SurfaceFragmentEntry {
  readonly templateId: string;
  readonly templateName: string;
  readonly slots: ReadonlyArray<{
    readonly slot: string;
    readonly axis: string;
    /** Non-default authored values on this slot. */
    readonly values: readonly string[];
    readonly hasDefault: boolean;
  }>;
  readonly enumeration: SurfaceEnumeration;
}

export interface SurfaceFragmentReport {
  readonly entries: readonly SurfaceFragmentEntry[];
  readonly summary: {
    /** Templates that declare at least one fragment slot. */
    readonly multipliedTemplates: number;
    /** Total authored surfaces contributed by those templates. */
    readonly authoredSurfaces: number;
    /** Total individual authored fragment variants (excluding `'*'` defaults). */
    readonly authoredFragments: number;
    /** Templates carrying at least one authoring problem. */
    readonly templatesWithProblems: number;
  };
}

/** Every pool a fragment-carrying template can live in. Deduped by id. */
function allFragmentTemplates(): readonly UnifiedActionTemplate[] {
  const seen = new Set<string>();
  const out: UnifiedActionTemplate[] = [];
  for (const t of [
    ...UNIFIED_ACTION_TEMPLATES,
    ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
    // Social scenes are generated per-agent rather than registered in the unified pool,
    // so they must be swept explicitly or the proof unit would be invisible here.
    ...SOCIAL_SCENE_TEMPLATES,
  ]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    if (t.contextFragments && t.contextFragments.length > 0) out.push(t);
  }
  return out;
}

/**
 * Build the fragment inventory. Pure and deterministic — templates are visited in a
 * stable pool order and sorted by id, so two runs are byte-identical.
 */
export function reportSurfaceFragments(): SurfaceFragmentReport {
  const entries = allFragmentTemplates()
    .map<SurfaceFragmentEntry>(t => ({
      templateId: t.id,
      templateName: t.name,
      slots: (t.contextFragments ?? []).map(set => {
        const keys = Object.keys(set.variants ?? {});
        return {
          slot: set.slot,
          axis: set.axis,
          values: keys.filter(k => k !== '*').sort(),
          hasDefault: keys.includes('*'),
        };
      }),
      enumeration: enumerateTemplateSurfaces(t),
    }))
    .sort((a, b) => a.templateId.localeCompare(b.templateId));

  return {
    entries,
    summary: {
      multipliedTemplates: entries.length,
      authoredSurfaces: entries.reduce((n, e) => n + e.enumeration.surfaceCount, 0),
      authoredFragments: entries.reduce(
        (n, e) => n + e.slots.reduce((m, s) => m + s.values.length, 0),
        0,
      ),
      templatesWithProblems: entries.filter(e => e.enumeration.problems.length > 0).length,
    },
  };
}
