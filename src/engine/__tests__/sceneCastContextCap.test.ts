/**
 * THR-1726 — a `{cast:<key>}` token the template declares must never strip to "".
 *
 * The Unsafe Bridge read "The keeper, , takes two coppers" on the deployed build:
 * its bundle composes six inherited setting defaults (wayside + rural) ahead of its
 * own subject, and `resolveSceneCastContext` capped the map at
 * `CAST_CONTEXT_MAX_MEMBERS` (6) by bundle position, so the keeper was cut and her
 * token stripped. The Riders' caravan master had the same shape.
 *
 * Two locks: a corpus-wide graph-free one (every declared key a template's prose
 * names is in the cast context even with nothing bound), and a live one that stages
 * the slice encounters on a generated world and reads the attended stage's prose.
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { CAST_CONTEXT_MAX_MEMBERS, resolveSceneCastContext } from '../proseEnrichment';
import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../../data/unified-action-templates';
import { SLICE_TEMPLATE_IDS } from '../../data/encounters/vertical-slice';
import { initializeGameState } from '../gameInit';
import { prepareDebugEncounterSpawn } from '../debugEncounterTools';
import { buildUnifiedEncounterStageModel } from '../../components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel';
import type { EncounterSupportBundle } from '../../types/encounter';

/** Every `{cast:<key>}` named anywhere in a template outside its bundle. */
function referencedCastKeys(template: { supportBundle?: unknown }): Set<string> {
  const { supportBundle: _bundle, ...rest } = template;
  const text = JSON.stringify(rest);
  return new Set([...text.matchAll(/\{cast:([A-Za-z0-9_.-]+)\}/g)].map(m => m[1]));
}

describe('resolveSceneCastContext cap (THR-1726)', () => {
  it('admits every declared key a template\'s prose names, even with nothing bound', () => {
    const graph = new WorldGraph();
    const misses: string[] = [];
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      const bundle = template.supportBundle;
      if (!bundle || bundle.length === 0) continue;
      const declared = new Set(bundle.filter(s => s.delivery !== 'blocked-primitive').map(s => s.key));
      const cast = resolveSceneCastContext(graph, bundle, []) ?? {};
      for (const key of referencedCastKeys(template)) {
        if (declared.has(key) && !cast[key]?.name) misses.push(`${template.id} → {cast:${key}}`);
      }
    }
    expect(misses).toEqual([]);
  });

  it('keeps a scene\'s own subject over six inherited defaults, and emits in bundle order', () => {
    const defaults = Array.from({ length: CAST_CONTEXT_MAX_MEMBERS }, (_, i) => ({
      kind: 'actor' as const,
      key: `default_${i}`,
      delivery: 'pre-seeded' as const,
      persistence: 'must-persist' as const,
      supportRole: 'bystander',
      spawnNpcRole: 'wanderer',
      spawnName: `Default ${i}`,
    }));
    const bundle = [
      ...defaults,
      {
        kind: 'actor' as const,
        key: 'subject',
        delivery: 'lazy-materialize-on-trigger' as const,
        persistence: 'must-persist' as const,
        supportRole: 'bridge_toll_keeper',
        spawnNpcRole: 'hermit',
        spawnName: 'Halda Brenn',
      },
    ] as EncounterSupportBundle;

    const cast = resolveSceneCastContext(new WorldGraph(), bundle, [])!;
    expect(Object.keys(cast)).toHaveLength(CAST_CONTEXT_MAX_MEMBERS);
    expect(cast.subject?.name).toBe('Halda Brenn');
    // The cut falls on the last inherited default, and the map keeps bundle order.
    expect(Object.keys(cast)).toEqual([...defaults.slice(0, -1).map(d => d.key), 'subject']);
  });

  it('stages the slice encounters with every cast name filled in', () => {
    const init = initializeGameState({
      name: 'Oracle', sphereAlignment: { primary: 'thread', secondary: 'winter' }, title: 'Oracle',
      decreeNouns: [], themes: [], startingMutations: [],
    } as never, 'Oracle', { reachDomains: [], spheres: [] } as never, 42, 32, 24);
    const state = init.state;

    const ids = [
      SLICE_TEMPLATE_IDS.bridge,
      SLICE_TEMPLATE_IDS.pass,
      SLICE_TEMPLATE_IDS.caravan,
      SLICE_TEMPLATE_IDS.crossroads,
      SLICE_TEMPLATE_IDS.family,
    ];
    const prose: Record<string, string> = {};
    for (const id of ids) {
      const prepared = prepareDebugEncounterSpawn(state, '@hero', id, {});
      expect(prepared.success, `${id}: ${prepared.message}`).toBe(true);
      const model = buildUnifiedEncounterStageModel({
        template: getUnifiedTemplateById(id)!,
        activeAction: prepared.unifiedAction!,
        notification: prepared.notification!,
        agentName: 'Oracle',
        threadTier: 'threaded' as never,
        graph: state.graph,
        essence: 0,
        gameState: state,
        tick: state.tick,
      });
      prose[id] = model.narrative.paragraphs
        .map(p => p.segments.map(s => s.text).join(''))
        .join('\n\n');
    }

    for (const [id, text] of Object.entries(prose)) {
      expect(text, id).not.toMatch(/, ,|\{cast:/);
    }
    expect(prose[SLICE_TEMPLATE_IDS.bridge]).toContain('The keeper, Halda Brenn, takes two coppers');
    expect(prose[SLICE_TEMPLATE_IDS.caravan]).toContain('The caravan master, Ferrin Oake, says');
  });
});
