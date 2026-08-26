/**
 * Effect vocabulary consolidation — stage 4 (THR-1242).
 *
 * The load-bearing half of this stage is the *migration*, not the deletion: a
 * green typecheck after removing a union member proves only that nothing
 * referenced the member, never that the capability it named survived. So these
 * tests come in two shapes:
 *
 *   1. **Retirement sweeps** — no content anywhere still names a retired
 *      spelling, asserted against the real catalogs rather than a fixture. A
 *      fixture here would verify fiction (the `reference_fixture_invents_both_sides`
 *      shape): the whole claim is about what the shipped catalogs contain.
 *   2. **Capability proofs** — each migrated capability still fires, through its
 *      new mechanism, at the site that owns it.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { WorldGraph } from '../../graph';
import { isImmuneToTag, isImmuneToAnyTag, normalizeTag, getRevealRanges } from '../effectQueries';
import { applySuppressions } from '../effectSuppression';
import { collectAttachmentEffects } from '../effectWalker';
import { MAX_EFFECTS_PER_ATTACHMENT, ACTION_TRIGGER_MAX_PER_ATTACHMENT } from '../../../data/effect-constants';
import { TERRAIN_OVERLAY_DEFINITIONS } from '../../../data/terrain-overlays';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

/** Every content file that can carry an `effects: []` list. */
const CONTENT_FILES = [
  'src/data/reward-attachment-catalog.ts',
  'src/data/starter-attachments.ts',
  'src/data/anomaly-reward-catalog.ts',
  'src/data/artifact-templates.ts',
  'src/data/spell-templates.ts',
  'src/data/choice-set-catalog.ts',
  'src/data/dream-content.ts',
] as const;

/** The nine spellings stage 4 retired. */
const RETIRED_SPELLINGS = [
  'graph_mutation', 'outcome_shift', 'auto_succeed',
  'reroll', 'swap_reach',
  'haste', 'slow', 'freeze_duration',
  'create_barrier',
] as const;

// ═══════════════════════════════════════════════════════════════════
// 1. Retirement sweeps
// ═══════════════════════════════════════════════════════════════════

describe('retired spellings have no content refs (THR-1242)', () => {
  // Matches only an effect-type position (`type: 'x'`), so the sweep cannot be
  // fooled by the word "slow" appearing in an adjective table — which it does,
  // in `archetype-content` and `narrative-content`. A bare substring sweep here
  // would report a false positive forever and train the next reader to ignore it.
  const typePosition = (spelling: string) => new RegExp(`type:\\s*'${spelling}'`);

  for (const file of CONTENT_FILES) {
    const src = readFileSync(join(REPO_ROOT, file), 'utf8');
    for (const spelling of RETIRED_SPELLINGS) {
      it(`${file} declares no '${spelling}' effect`, () => {
        expect(src).not.toMatch(typePosition(spelling));
      });
    }
  }
});

describe('the glyph table holds no key for a retired spelling (THR-1242)', () => {
  it('every EFFECT_TYPE_GLYPHS key is a live effect type', () => {
    const src = readFileSync(join(REPO_ROOT, 'src/components/Game/attachmentGlyphs.ts'), 'utf8');
    const block = src.slice(
      src.indexOf('const EFFECT_TYPE_GLYPHS'),
      src.indexOf('const EFFECT_FALLBACK_GLYPH'),
    );
    const keys = [...block.matchAll(/^\s{2}(\w+):\s*'/gm)].map(m => m[1]);

    // The table is `Record<string, string>`, so TypeScript cannot catch a key
    // for a type that no longer exists — it is dead data that renders for
    // nothing and reads to the next author as a live primitive.
    expect(keys.length).toBeGreaterThan(20);
    for (const spelling of RETIRED_SPELLINGS) {
      expect(keys).not.toContain(spelling);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Capability proofs
// ═══════════════════════════════════════════════════════════════════

/** An agent carrying one attachment whose effects are supplied by the test. */
function graphWithBearer(
  effects: AttachmentEffect[],
  opts: { agentId?: string; attachmentId?: string; subcategory?: string } = {},
): { graph: WorldGraph; agentId: string; attachmentId: string } {
  const agentId = opts.agentId ?? 'agent-1';
  const attachmentId = opts.attachmentId ?? 'item-1';
  const graph = new WorldGraph();
  graph.addNode({ id: agentId, type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
  graph.addNode({
    id: attachmentId, type: 'artifact', name: 'Test Item',
    properties: { effects, tier: 1, ...(opts.subcategory ? { subcategory: opts.subcategory } : {}) },
  });
  graph.addEdge({ id: `e_${agentId}_${attachmentId}`, source: agentId, target: attachmentId, type: 'possesses', properties: {} });
  return { graph, agentId, attachmentId };
}

describe('tag_immunity is live and namespace-normalized (THR-1242)', () => {
  it('normalizeTag strips one leading # and leaves a bare tag alone', () => {
    expect(normalizeTag('#fear')).toBe('fear');
    expect(normalizeTag('fear')).toBe('fear');
    // Only one level — '##x' is not a spelling anything produces, and silently
    // collapsing it would hide a content typo rather than surface it.
    expect(normalizeTag('##fear')).toBe('#fear');
  });

  it('matches across the namespace boundary in both directions', () => {
    const bare = graphWithBearer([{ type: 'tag_immunity', tags: ['fear'] }]);
    expect(isImmuneToTag(bare.graph, bare.agentId, '#fear')).toBe(true);

    const hashed = graphWithBearer([{ type: 'tag_immunity', tags: ['#fear'] }]);
    expect(isImmuneToTag(hashed.graph, hashed.agentId, 'fear')).toBe(true);
  });

  it('does not match a different tag', () => {
    const { graph, agentId } = graphWithBearer([{ type: 'tag_immunity', tags: ['#fear'] }]);
    expect(isImmuneToTag(graph, agentId, '#poison')).toBe(false);
  });

  it('isImmuneToAnyTag returns the matching tag, not just true', () => {
    const { graph, agentId } = graphWithBearer([{ type: 'tag_immunity', tags: ['#poison'] }]);
    // Naming the tag is what lets the infliction site trace *why* nothing landed.
    expect(isImmuneToAnyTag(graph, agentId, ['#condition', '#poison', '#negative'])).toBe('#poison');
    expect(isImmuneToAnyTag(graph, agentId, ['#condition', '#negative'])).toBeNull();
  });

  it('a suppressed immunity does not protect', () => {
    const { graph, agentId, attachmentId } = graphWithBearer([{ type: 'tag_immunity', tags: ['#fear'] }]);
    const states = new Map<string, EffectRuntimeState>([[attachmentId, { suppressed: true }]]);
    expect(isImmuneToTag(graph, agentId, '#fear', states)).toBe(false);
  });
});

describe('reveal ranges are readable (THR-1242)', () => {
  it('reports the declared range per target', () => {
    const { graph, agentId } = graphWithBearer([
      { type: 'reveal', target: 'hexes', range: 2 },
      { type: 'reveal', target: 'encounters', range: 3 },
    ]);
    const r = getRevealRanges(graph, agentId);
    expect(r.hexes).toBe(2);
    expect(r.encounters).toBe(3);
    expect(r.agent).toBe(0);
  });

  it("'all' reads as Infinity so callers can Math.min it without a special case", () => {
    const { graph, agentId } = graphWithBearer([{ type: 'reveal', target: 'encounters', range: 'all' }]);
    expect(getRevealRanges(graph, agentId).encounters).toBe(Infinity);
  });

  it('highest wins rather than summing — two lenses are not twice one lens', () => {
    const { graph, agentId } = graphWithBearer([
      { type: 'reveal', target: 'hexes', range: 2 },
      { type: 'reveal', target: 'hexes', range: 5 },
    ]);
    expect(getRevealRanges(graph, agentId).hexes).toBe(5);
  });

  it('reads 0 for an agent with no reveal at all', () => {
    const { graph, agentId } = graphWithBearer([{ type: 'passive', reach: 'eye', value: 0.05 }]);
    expect(getRevealRanges(graph, agentId)).toEqual({ hexes: 0, encounters: 0, agent: 0, attachments: 0 });
  });
});

describe('suppress writes the flag its four readers honour (THR-1242)', () => {
  /** A bearer carrying a self-scoped suppressor plus one other attachment. */
  function suppressorAndVictim(target: 'spell' | 'aura' | 'all_effects', ticks = 4) {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
    graph.addNode({
      id: 'suppressor', type: 'artifact', name: 'Null Circlet',
      properties: { effects: [{ type: 'suppress', target, scope: { scope: 'self' }, ticks }], tier: 3 },
    });
    graph.addNode({
      id: 'victim', type: 'artifact', name: 'Aura Ring',
      properties: { effects: [{ type: 'aura', reach: 'heart', value: 0.05, radius: 1 }], tier: 2 },
    });
    graph.addEdge({ id: 'e1', source: 'a1', target: 'suppressor', type: 'possesses', properties: {} });
    graph.addEdge({ id: 'e2', source: 'a1', target: 'victim', type: 'possesses', properties: {} });
    return graph;
  }

  it('suppresses a matching attachment and records the expiry', () => {
    const graph = suppressorAndVictim('aura', 4);
    const { states, suppressedCount } = applySuppressions(graph, new Map(), 10, ['a1']);

    expect(suppressedCount).toBe(1);
    expect(states.get('victim')?.suppressed).toBe(true);
    expect(states.get('victim')?.suppressedUntilTick).toBe(14);
  });

  it('never suppresses its own source — the self-cancel trap', () => {
    // An `all_effects` suppressor that silenced itself would switch off on its
    // first tick and stay off, which in the trace is indistinguishable from the
    // primitive never having been wired at all.
    const graph = suppressorAndVictim('all_effects', 6);
    const { states } = applySuppressions(graph, new Map(), 1, ['a1']);

    expect(states.get('suppressor')?.suppressed).toBeUndefined();
    expect(states.get('victim')?.suppressed).toBe(true);
  });

  it('leaves a non-matching class alone', () => {
    // `target: 'spell'` against an attachment that declares only an aura.
    const graph = suppressorAndVictim('spell', 4);
    const { states, suppressedCount } = applySuppressions(graph, new Map(), 1, ['a1']);
    expect(suppressedCount).toBe(0);
    expect(states.get('victim')?.suppressed).toBeUndefined();
  });

  it('lifts once the tick passes the expiry', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Bearer', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'victim', type: 'artifact', name: 'Ring', properties: { effects: [{ type: 'aura', reach: 'heart', value: 0.05, radius: 1 }] } });
    graph.addEdge({ id: 'e2', source: 'a1', target: 'victim', type: 'possesses', properties: {} });

    // No suppressor left in the world — the silence must still lift on schedule,
    // because attachments are destroyed from sites that know nothing about this.
    const prior = new Map<string, EffectRuntimeState>([['victim', { suppressed: true, suppressedUntilTick: 12 }]]);

    expect(applySuppressions(graph, prior, 11, ['a1']).states.get('victim')?.suppressed).toBe(true);

    const lifted = applySuppressions(graph, prior, 12, ['a1']);
    expect(lifted.states.get('victim')?.suppressed).toBe(false);
    expect(lifted.liftedCount).toBe(1);
  });

  it('leaves an expiry-less suppression alone — it is not this pass’s to lift', () => {
    const graph = suppressorAndVictim('spell', 4);
    const prior = new Map<string, EffectRuntimeState>([['victim', { suppressed: true }]]);
    const { states, liftedCount } = applySuppressions(graph, prior, 99, ['a1']);
    expect(states.get('victim')?.suppressed).toBe(true);
    expect(liftedCount).toBe(0);
  });

  it('does not mutate the map it was given', () => {
    const graph = suppressorAndVictim('aura', 4);
    const input = new Map<string, EffectRuntimeState>();
    applySuppressions(graph, input, 10, ['a1']);
    expect(input.size).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Content guards, promoted to enforced
// ═══════════════════════════════════════════════════════════════════

describe('walker content guards are enforced, not advisory (THR-1242)', () => {
  it('reads at most MAX_EFFECTS_PER_ATTACHMENT effects', () => {
    const many: AttachmentEffect[] = Array.from(
      { length: MAX_EFFECTS_PER_ATTACHMENT + 4 },
      () => ({ type: 'passive', reach: 'iron', value: 0.01 }) as AttachmentEffect,
    );
    const { graph, agentId } = graphWithBearer(many);
    expect(collectAttachmentEffects(graph, agentId)).toHaveLength(MAX_EFFECTS_PER_ATTACHMENT);
  });

  it('honours at most ACTION_TRIGGER_MAX_PER_ATTACHMENT action triggers', () => {
    const effects: AttachmentEffect[] = Array.from(
      { length: ACTION_TRIGGER_MAX_PER_ATTACHMENT + 3 },
      () => ({ type: 'action_trigger', trigger: 'movement_complete', payloads: [] }) as unknown as AttachmentEffect,
    );
    const { graph, agentId } = graphWithBearer(effects);
    const read = collectAttachmentEffects(graph, agentId).filter(e => e.effect.type === 'action_trigger');
    expect(read).toHaveLength(ACTION_TRIGGER_MAX_PER_ATTACHMENT);
  });

  it('the trigger cap does not consume the effect budget of other types', () => {
    // The two guards compose as "at most N effects, of which at most M are
    // triggers" — dropping a trigger must not free a slot for something else,
    // or the bound stops being a bound on the walk.
    const effects: AttachmentEffect[] = [
      { type: 'action_trigger', trigger: 'movement_complete', payloads: [] } as unknown as AttachmentEffect,
      { type: 'action_trigger', trigger: 'movement_complete', payloads: [] } as unknown as AttachmentEffect,
      { type: 'action_trigger', trigger: 'movement_complete', payloads: [] } as unknown as AttachmentEffect,
      { type: 'passive', reach: 'iron', value: 0.01 },
    ];
    const { graph, agentId } = graphWithBearer(effects);
    const read = collectAttachmentEffects(graph, agentId).map(e => e.effect.type);
    expect(read.filter(t => t === 'action_trigger')).toHaveLength(ACTION_TRIGGER_MAX_PER_ATTACHMENT);
    expect(read).toContain('passive');
  });
});

describe('the barrier overlays exist and are defined (THR-1242)', () => {
  it('warded and shrouded both have definitions', () => {
    // `create_barrier`'s two arms migrated onto these. A migration onto an
    // overlay with no definition would typecheck and render as an unnamed tint.
    expect(TERRAIN_OVERLAY_DEFINITIONS.warded?.type).toBe('warded');
    expect(TERRAIN_OVERLAY_DEFINITIONS.shrouded?.type).toBe('shrouded');
  });
});
