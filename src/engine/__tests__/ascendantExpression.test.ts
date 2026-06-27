/**
 * Tests for the ascendant expression cards (THR-508).
 *
 * Ships `imbue`: read the ascendant's primary sphere, pick a sphere-flavored
 * effect (THR-509 primitive), and append it to the target artifact's `effects`.
 * An integration test proves the imbued effect is read by the effect-walker for
 * whichever agent holds the artifact — i.e. it is genuinely wired, not dead
 * content.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import { mulberry32 } from '../../lib/prng';
import {
  getAscendantPrimarySphere,
  applyImbueItem,
} from '../ascendantExpression';
import { SPHERE_EFFECT_TABLE } from '../ascendantPrimitives';
import { collectAttachmentEffects } from '../effects/effectWalker';

// ─── Builders ──────────────────────────────────────────────────────────────

function addAscendant(g: WorldGraph, id: string, primary: SphereName, secondary: SphereName = 'matter'): void {
  g.addNode({
    id,
    type: 'actor',
    name: id,
    properties: { actorType: 'ascendant', sphereAlignment: { primary, secondary } },
  });
}

function addArtifact(g: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  g.addNode({ id, type: 'artifact', name: id, properties: props });
}

function possesses(g: WorldGraph, agentId: string, artifactId: string): void {
  g.addEdge({ id: `pos:${agentId}->${artifactId}`, source: agentId, target: artifactId, type: 'possesses', properties: {} });
}

const rng = () => mulberry32(42)();

// ═══════════════════════════════════════════════════════════════════════════
// getAscendantPrimarySphere
// ═══════════════════════════════════════════════════════════════════════════

describe('getAscendantPrimarySphere', () => {
  it('returns the persisted primary sphere', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', 'force');
    expect(getAscendantPrimarySphere(g, 'asc')).toBe('force');
  });

  it('returns undefined for a missing node (fail-soft)', () => {
    const g = new WorldGraph();
    expect(getAscendantPrimarySphere(g, 'nope')).toBeUndefined();
  });

  it('returns undefined when no sphere alignment is present', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'asc', properties: { actorType: 'ascendant' } });
    expect(getAscendantPrimarySphere(g, 'asc')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// applyImbueItem
// ═══════════════════════════════════════════════════════════════════════════

describe('applyImbueItem', () => {
  it('appends a sphere-flavored effect matching the ascendant primary sphere', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', 'force');
    addArtifact(g, 'art');

    const result = applyImbueItem(g, 'asc', 'art', rng, 1);

    expect(result.success).toBe(true);
    expect(result.effect).toEqual(SPHERE_EFFECT_TABLE.force![0]);

    const effects = g.getNode('art')!.properties.effects as unknown[];
    expect(effects).toHaveLength(1);
    expect(effects[0]).toEqual(SPHERE_EFFECT_TABLE.force![0]);
  });

  it('preserves any pre-existing effects (append, not replace)', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', 'life'); // → heart-flavored
    const existing = { type: 'passive', reach: 'iron', value: 0.1 };
    addArtifact(g, 'art', { effects: [existing] });

    applyImbueItem(g, 'asc', 'art', rng, 1);

    const effects = g.getNode('art')!.properties.effects as unknown[];
    expect(effects).toHaveLength(2);
    expect(effects[0]).toEqual(existing);
    expect(effects[1]).toEqual(SPHERE_EFFECT_TABLE.life![0]);
  });

  it('is deterministic for the same seed', () => {
    const make = () => {
      const g = new WorldGraph();
      addAscendant(g, 'asc', 'mind');
      addArtifact(g, 'art');
      applyImbueItem(g, 'asc', 'art', () => mulberry32(7)(), 1);
      return g.getNode('art')!.properties.effects;
    };
    expect(make()).toEqual(make());
  });

  // ─── Fail-soft (NFP #4) ───────────────────────────────────────────────────

  it('no-ops on a missing artifact', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', 'force');
    const result = applyImbueItem(g, 'asc', 'gone', rng, 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('missing_artifact');
  });

  it('no-ops when the target is not an artifact', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', 'force');
    g.addNode({ id: 'loc', type: 'location', name: 'loc', properties: {} });
    const result = applyImbueItem(g, 'asc', 'loc', rng, 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('not_artifact');
  });

  it('no-ops when the ascendant has no sphere alignment', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'asc', properties: { actorType: 'ascendant' } });
    addArtifact(g, 'art');
    const result = applyImbueItem(g, 'asc', 'art', rng, 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('missing_sphere');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: imbued effect is read by the holder's effect-walker (no dead content)
// ═══════════════════════════════════════════════════════════════════════════

describe('imbue wiring: imbued effect reaches the holder', () => {
  it('collectAttachmentEffects surfaces the imbued effect for the possessing agent', () => {
    const g = new WorldGraph();
    addAscendant(g, 'asc', 'force'); // → iron-flavored passive
    addArtifact(g, 'art');
    g.addNode({ id: 'mortal', type: 'actor', name: 'mortal', properties: { actorType: 'individual' } });
    possesses(g, 'mortal', 'art');

    // Before imbue: holder has no attachment effects.
    expect(collectAttachmentEffects(g, 'mortal')).toHaveLength(0);

    applyImbueItem(g, 'asc', 'art', rng, 1);

    // After imbue: the sphere-flavored effect is collected for the holder.
    const collected = collectAttachmentEffects(g, 'mortal');
    expect(collected).toHaveLength(1);
    expect(collected[0].effect).toEqual(SPHERE_EFFECT_TABLE.force![0]);
    expect(collected[0].attachmentId).toBe('art');
  });
});
