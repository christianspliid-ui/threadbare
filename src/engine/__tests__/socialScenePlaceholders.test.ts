/**
 * THR-1516 — `{sphere_flavor}` must never reach a player, and the social-scene pool
 * must carry the no-raw-braces lock THR-716 asked for and THR-933 only gave to
 * `buildSimpleEncounterStageModel`.
 *
 * Law 43: "Placeholders never leak. Every player-facing string passes enrichment; a raw
 * `{token}` reaching a screen is a released defect with a regression lock." This file is
 * that lock for `src/data/social-scene-templates.ts`.
 *
 * The defect: `SPHERE_COLORING` and `getSphereFlavorPhrase` were authored with the
 * intended usage in their own header and had zero callers, while `enrichProse()` — the
 * function `unifiedActionResolution` renders step prose through — had never learned the
 * token. 28 authored occurrences shipped raw for ~50 days after the `{actor}` half.
 *
 * Falsification: with the `{sphere_flavor}` block in `enrichProse` removed, the first
 * three `describe`s go red on the raw token; with a template deleted from
 * `SOCIAL_SCENE_APPROACHES`, the map-completeness test names it.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  enrichProse,
  gatherNarrativeContext,
  resolveActorSphere,
  resetSphereFlavorWarnings,
  type NarrativeContext,
} from '../proseEnrichment';
import {
  SPHERE_COLORING,
  SOCIAL_SCENE_APPROACHES,
  getSocialApproachForTemplate,
  getSphereFlavorPhrase,
  type SocialApproach,
} from '../../data/social-scene-sphere-coloring';
import { SOCIAL_SCENE_TEMPLATES } from '../../data/social-scene-templates';
import { SPHERE_NAMES, type SphereName } from '../../types/index';
import { isActionStepBranch, type ActionStep } from '../../types/unifiedAction';
import { WorldGraph } from '../graph';

const RAW_TOKEN = /\{[^}]*\}/g;

function ctx(overrides?: Partial<NarrativeContext>): NarrativeContext {
  return {
    agentName: 'The Unchained',
    agentId: 'asc.archetype.chaos_0',
    archetypeId: 'rebel',
    cultureName: 'The Aurelians',
    primaryReach: 'heart',
    titles: [],
    notableArtifacts: [],
    strongAllies: [],
    rivals: [],
    currentLocationName: 'Wraithwood',
    completedPhases: [],
    beatHistory: [],
    pronouns: { they: 'they', them: 'them', their: 'their', s: 's' },
    ...overrides,
  };
}

/** Every player-facing prose field on a unified template, branches included. */
function proseFields(template: (typeof SOCIAL_SCENE_TEMPLATES)[number]): string[] {
  const out: string[] = [];
  const push = (v: unknown) => { if (typeof v === 'string' && v.length > 0) out.push(v); };
  push(template.narrativeTemplates?.initiation);
  push(template.narrativeTemplates?.success);
  push(template.narrativeTemplates?.failure);
  const pushStep = (step: ActionStep) => {
    push(step.narrativeTemplate);
    push(step.purposeLine);
    push(step.successAfterimage);
    push(step.failureAfterimage);
    push(step.successAtCostAfterimage);
    push(step.criticalSuccessAfterimage);
    push(step.criticalFailureAfterimage);
  };
  for (const step of template.steps ?? []) {
    if (isActionStepBranch(step)) {
      for (const variant of Object.values(step.variants)) pushStep(variant);
      pushStep(step.fallback);
    } else {
      pushStep(step);
    }
  }
  return out;
}

/** Ids of every social template that authors the token — the ticket's predicate. */
const TEMPLATES_WITH_TOKEN = SOCIAL_SCENE_TEMPLATES.filter(t =>
  proseFields(t).some(f => f.includes('{sphere_flavor}')),
);

beforeEach(() => resetSphereFlavorWarnings());

// ─── The ticket's evidence line ───────────────────────────────────

describe('enrichProse resolves {sphere_flavor} (THR-1516)', () => {
  it('resolves the exact line from the ticket evidence to the recruit × sphere phrase', () => {
    // Verbatim step 3 of `social_scene.recruitment_pitch`, as the CLI rendered it raw.
    const out = enrichProse(
      'The offer is laid out plainly: purpose, pay, and place in something larger. {sphere_flavor}.',
      ctx({ socialApproach: 'recruit', actorSphere: 'chaos' }),
    );
    expect(out).toBe(
      `The offer is laid out plainly: purpose, pay, and place in something larger. ${SPHERE_COLORING.recruit.chaos}.`,
    );
    expect(out).not.toMatch(RAW_TOKEN);
  });

  it('picks the phrase by (approach, sphere) — a different sphere reads differently', () => {
    const line = 'The oath is spoken aloud. {sphere_flavor}. The words bind.';
    const order = enrichProse(line, ctx({ socialApproach: 'swear', actorSphere: 'order' }));
    const chaos = enrichProse(line, ctx({ socialApproach: 'swear', actorSphere: 'chaos' }));
    expect(order).toContain(SPHERE_COLORING.swear.order);
    expect(chaos).toContain(SPHERE_COLORING.swear.chaos);
    expect(order).not.toBe(chaos);
  });

  it('resolves beside already-working tokens', () => {
    const out = enrichProse(
      '{actor} raises a cup and speaks. Briefly, but with intent. {sphere_flavor}.',
      ctx({ socialApproach: 'celebrate', actorSphere: 'life' }),
    );
    expect(out).toBe(`The Unchained raises a cup and speaks. Briefly, but with intent. ${SPHERE_COLORING.celebrate.life}.`);
  });
});

// ─── Fail-soft ────────────────────────────────────────────────────

describe('{sphere_flavor} fail-soft (NFP #4)', () => {
  it('strips the token and its sentence period when the template has no approach', () => {
    const out = enrichProse(
      'The offer is laid out plainly. {sphere_flavor}.',
      ctx({ actorSphere: 'chaos' }),
    );
    expect(out).toBe('The offer is laid out plainly.');
    expect(out).not.toMatch(RAW_TOKEN);
  });

  it('strips when the actor has no sphere', () => {
    const out = enrichProse(
      'The oath is spoken aloud. {sphere_flavor}. The words bind.',
      ctx({ socialApproach: 'swear' }),
    );
    expect(out).toBe('The oath is spoken aloud. The words bind.');
  });

  it('never throws on an unmapped pair', () => {
    expect(() => getSphereFlavorPhrase('nonsense' as SocialApproach, 'chaos')).not.toThrow();
    expect(getSphereFlavorPhrase('nonsense' as SocialApproach, 'chaos')).toBeUndefined();
    expect(getSphereFlavorPhrase('swear', undefined)).toBeUndefined();
  });
});

// ─── Content completeness ─────────────────────────────────────────

describe('SPHERE_COLORING and SOCIAL_SCENE_APPROACHES are complete', () => {
  it('every approach carries a non-empty phrase for all 12 spheres', () => {
    // The table was authored for 8 creation-ish spheres against a 12-sphere type; an
    // actor aligned to light/darkness/spirit/time would have stripped silently.
    const gaps: string[] = [];
    for (const [approach, flavors] of Object.entries(SPHERE_COLORING)) {
      for (const sphere of SPHERE_NAMES) {
        const phrase = (flavors as Record<SphereName, string>)[sphere];
        if (typeof phrase !== 'string' || phrase.trim().length === 0) gaps.push(`${approach}.${sphere}`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it('every social-scene template that authors the token is bound to an approach (predicate, not count)', () => {
    const unbound = TEMPLATES_WITH_TOKEN
      .filter(t => getSocialApproachForTemplate(t.id) === undefined)
      .map(t => t.id);
    expect(unbound).toEqual([]);
    // The predicate must not be vacuous: the corpus does author the token.
    expect(TEMPLATES_WITH_TOKEN.length).toBeGreaterThan(0);
  });

  it('every id in the approach map names a real social-scene template', () => {
    const ids = new Set(SOCIAL_SCENE_TEMPLATES.map(t => t.id));
    const stale = Object.keys(SOCIAL_SCENE_APPROACHES).filter(id => !ids.has(id));
    expect(stale).toEqual([]);
  });
});

// ─── The Law 43 lock THR-716 asked for ─────────────────────────────

describe('Law 43 regression lock — the social-scene pool leaks no raw token of any shape', () => {
  it('no enriched prose field contains a raw {token} for every (template, sphere)', () => {
    const leaks: string[] = [];
    for (const template of SOCIAL_SCENE_TEMPLATES) {
      const socialApproach = getSocialApproachForTemplate(template.id);
      for (const actorSphere of SPHERE_NAMES) {
        for (const field of proseFields(template)) {
          const enriched = enrichProse(
            field,
            ctx({ socialApproach, actorSphere, contextFragmentTemplateId: template.id, contextFragments: template.contextFragments }),
          );
          for (const match of enriched.matchAll(RAW_TOKEN)) {
            leaks.push(`${template.id} [${actorSphere}]: ${match[0]} in "${enriched}"`);
          }
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it('the token resolves to a phrase (not a strip) for every template that authors it, on every sphere', () => {
    // Stronger than "no raw token": the fail-soft strip would also pass the sweep above,
    // so this arm asserts the *phrase* landed — the write-without-consumer is closed.
    const stripped: string[] = [];
    for (const template of TEMPLATES_WITH_TOKEN) {
      const socialApproach = getSocialApproachForTemplate(template.id)!;
      for (const actorSphere of SPHERE_NAMES) {
        const phrase = SPHERE_COLORING[socialApproach][actorSphere];
        for (const field of proseFields(template).filter(f => f.includes('{sphere_flavor}'))) {
          const enriched = enrichProse(field, ctx({ socialApproach, actorSphere }));
          if (!enriched.includes(phrase)) stripped.push(`${template.id} [${actorSphere}]`);
        }
      }
    }
    expect(stripped).toEqual([]);
  });
});

// ─── Context gathering ────────────────────────────────────────────

describe('gatherNarrativeContext threads both halves of the lookup', () => {
  function graphWith(properties: Record<string, unknown>): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'a1', type: 'actor', name: 'Kael', properties: { actorType: 'individual', ...properties } });
    return g;
  }

  it('reads sphereAlignment.primary off an ascendant', () => {
    const g = graphWith({ sphereAlignment: { primary: 'chaos', secondary: 'energy' } });
    expect(resolveActorSphere(g, 'a1')).toBe('chaos');
  });

  it('reads the dominant sphereAffinity score off a mortal', () => {
    const scores = Object.fromEntries(SPHERE_NAMES.map(s => [s, 0])) as Record<SphereName, number>;
    scores.mind = 3;
    scores.order = 1;
    const g = graphWith({ sphereAffinity: { scores, progress: { ...scores } } });
    expect(resolveActorSphere(g, 'a1')).toBe('mind');
  });

  it('is undefined for an all-zero affinity, a bare node, and a missing node', () => {
    const zero = Object.fromEntries(SPHERE_NAMES.map(s => [s, 0])) as Record<SphereName, number>;
    expect(resolveActorSphere(graphWith({ sphereAffinity: { scores: zero, progress: zero } }), 'a1')).toBeUndefined();
    expect(resolveActorSphere(graphWith({}), 'a1')).toBeUndefined();
    expect(resolveActorSphere(new WorldGraph(), 'ghost')).toBeUndefined();
  });

  it('binds the approach from the threaded template id, falling back to the fragment id', () => {
    const g = graphWith({ sphereAlignment: { primary: 'order', secondary: 'life' } });
    const viaTemplateId = gatherNarrativeContext(g, 'a1', undefined, undefined, undefined, undefined, 0, {
      templateId: 'social_scene.oath_swearing',
    });
    expect(viaTemplateId.socialApproach).toBe('swear');
    expect(viaTemplateId.actorSphere).toBe('order');

    const viaFragmentId = gatherNarrativeContext(g, 'a1', undefined, undefined, undefined, undefined, 0, {
      contextFragmentTemplateId: 'social_scene.the_accusation',
    });
    expect(viaFragmentId.socialApproach).toBe('accuse');

    const nonSocial = gatherNarrativeContext(g, 'a1', undefined, undefined, undefined, undefined, 0, {
      templateId: 'encounter.slice.unsafe_bridge',
    });
    expect(nonSocial.socialApproach).toBeUndefined();
  });
});
