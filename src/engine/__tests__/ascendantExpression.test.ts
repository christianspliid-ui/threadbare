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
import type { ReachDomain } from '../../types/traits';
import {
  getAscendantPrimarySphere,
  getAscendantPrimaryReach,
  applyImbueItem,
  applyBestowPower,
  applyAnointFaction,
} from '../ascendantExpression';
import type { ChosenStatus } from '../ascendantPrimitives';
import { SPHERE_EFFECT_TABLE } from '../ascendantPrimitives';
import {
  BESTOW_REACH_BONUS,
  BESTOW_QUINTESSENCE_REGEN,
} from '../../data/ascendant-expression-constants';
import { collectAttachmentEffects } from '../effects/effectWalker';
import { tickEffects } from '../effectTick';

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

function addAscendantWithReach(
  g: WorldGraph,
  id: string,
  affinities: Partial<Record<ReachDomain, number>>,
): void {
  g.addNode({
    id,
    type: 'actor',
    name: id,
    properties: {
      actorType: 'ascendant',
      sphereAlignment: { primary: 'force', secondary: 'matter' },
      domainAffinities: affinities,
    },
  });
}

function addMortal(g: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  g.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual', ...props } });
}

function addFaction(g: WorldGraph, id: string, props: Record<string, unknown> = {}): void {
  g.addNode({ id, type: 'actor', name: id, properties: { actorType: 'faction', ...props } });
}

function thread(
  g: WorldGraph,
  ascendantId: string,
  mortalId: string,
  awareness?: 'unaware' | 'intuition' | 'faith' | 'communion',
): void {
  g.addEdge({
    id: `thr:${ascendantId}->${mortalId}`,
    source: ascendantId,
    target: mortalId,
    type: 'thread',
    properties: awareness ? { awareness } : {},
  });
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

// ═══════════════════════════════════════════════════════════════════════════
// getAscendantPrimaryReach (THR-512)
// ═══════════════════════════════════════════════════════════════════════════

describe('getAscendantPrimaryReach', () => {
  it('returns the highest-affinity reach', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3, heart: 5, gold: 2 });
    expect(getAscendantPrimaryReach(g, 'asc')).toBe('heart');
  });

  it('returns undefined for a missing node (fail-soft)', () => {
    const g = new WorldGraph();
    expect(getAscendantPrimaryReach(g, 'nope')).toBeUndefined();
  });

  it('returns undefined when no affinities are persisted', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'asc', properties: { actorType: 'ascendant' } });
    expect(getAscendantPrimaryReach(g, 'asc')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// applyBestowPower (THR-512)
// ═══════════════════════════════════════════════════════════════════════════

describe('applyBestowPower', () => {
  it('mints a divine-gift artifact possessed by the agent with both boons', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3, heart: 5 });
    addMortal(g, 'mortal');
    thread(g, 'asc', 'mortal', 'faith');

    const result = applyBestowPower(g, 'asc', 'mortal', 1);

    expect(result.success).toBe(true);
    expect(result.artifactId).toBe('bestow_asc_mortal_1');

    // The gift node carries exactly the two effects.
    const gift = g.getNode('bestow_asc_mortal_1')!;
    expect(gift.type).toBe('artifact');
    const effects = gift.properties.effects as unknown[];
    expect(effects).toEqual([
      { type: 'passive', reach: 'heart', value: BESTOW_REACH_BONUS },
      { type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: BESTOW_QUINTESSENCE_REGEN, mode: 'per_tick' },
    ]);

    // The agent possesses it.
    const possessed = g.getOutgoingEdges('mortal', 'possesses').map((e) => e.target);
    expect(possessed).toContain('bestow_asc_mortal_1');
  });

  it('communion awareness also passes the faith gate', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { veil: 4 });
    addMortal(g, 'mortal');
    thread(g, 'asc', 'mortal', 'communion');
    expect(applyBestowPower(g, 'asc', 'mortal', 1).success).toBe(true);
  });

  // ─── Awareness gate (BESTOW_MIN_AWARENESS = 'faith') ──────────────────────

  it('no-ops when awareness is below faith (intuition)', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3 });
    addMortal(g, 'mortal');
    thread(g, 'asc', 'mortal', 'intuition');
    const result = applyBestowPower(g, 'asc', 'mortal', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('insufficient_awareness');
    expect(g.getNode('bestow_asc_mortal_1')).toBeUndefined();
  });

  it('no-ops when awareness is unset (treated as unaware)', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3 });
    addMortal(g, 'mortal');
    thread(g, 'asc', 'mortal'); // no awareness
    const result = applyBestowPower(g, 'asc', 'mortal', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('insufficient_awareness');
  });

  // ─── Fail-soft (NFP #4) ───────────────────────────────────────────────────

  it('no-ops on a missing agent', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3 });
    const result = applyBestowPower(g, 'asc', 'gone', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('missing_agent');
  });

  it('no-ops when there is no thread to the agent', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3 });
    addMortal(g, 'mortal'); // unthreaded
    const result = applyBestowPower(g, 'asc', 'mortal', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('no_thread');
  });

  it('no-ops when the ascendant has no reach affinities', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'asc', properties: { actorType: 'ascendant' } });
    addMortal(g, 'mortal');
    thread(g, 'asc', 'mortal', 'faith');
    const result = applyBestowPower(g, 'asc', 'mortal', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('missing_reach');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration: bestowed boons genuinely apply to the holder (no dead content)
// ═══════════════════════════════════════════════════════════════════════════

describe('bestow wiring: both boons reach the agent', () => {
  it('collectAttachmentEffects surfaces the reach passive for the agent', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3, heart: 5 });
    addMortal(g, 'mortal');
    thread(g, 'asc', 'mortal', 'faith');

    expect(collectAttachmentEffects(g, 'mortal')).toHaveLength(0);
    applyBestowPower(g, 'asc', 'mortal', 1);

    const collected = collectAttachmentEffects(g, 'mortal');
    const passive = collected.find((c) => c.effect.type === 'passive');
    expect(passive).toBeDefined();
    expect(passive!.effect).toEqual({ type: 'passive', reach: 'heart', value: BESTOW_REACH_BONUS });
  });

  it('the per-tick quintessence regen actually restores quintessence (effectTick)', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3 });
    addMortal(g, 'mortal', { quintessence: 0.5, quintessenceMax: 1.0 });
    thread(g, 'asc', 'mortal', 'faith');

    applyBestowPower(g, 'asc', 'mortal', 1);
    tickEffects(g, 'mortal', 2, new Map());

    const q = g.getNode('mortal')!.properties.quintessence as number;
    expect(q).toBeCloseTo(0.5 + BESTOW_QUINTESSENCE_REGEN, 6);
  });

  it('the quintessence regen is clamped to quintessenceMax (never overfills)', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3 });
    addMortal(g, 'mortal', { quintessence: 1.0, quintessenceMax: 1.0 });
    thread(g, 'asc', 'mortal', 'faith');

    applyBestowPower(g, 'asc', 'mortal', 1);
    tickEffects(g, 'mortal', 2, new Map());

    expect(g.getNode('mortal')!.properties.quintessence).toBe(1.0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// applyAnointFaction (THR-513)
// ═══════════════════════════════════════════════════════════════════════════

describe('applyAnointFaction', () => {
  it('flags the faction chosen with the (actor × primary-reach) power', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 3, gold: 5 }); // primary reach = gold
    addFaction(g, 'guild');

    const result = applyAnointFaction(g, 'asc', 'guild', 7);

    expect(result.success).toBe(true);
    expect(result.alreadyChosen).toBe(false);
    expect(result.power?.id).toBe('chosen.gold.reputation');

    const chosen = g.getNode('guild')!.properties.chosen as ChosenStatus;
    expect(chosen.byAscendantId).toBe('asc');
    expect(chosen.domain).toBe('gold');
    expect(chosen.grantedTick).toBe(7);
    expect(chosen.power?.id).toBe('chosen.gold.reputation');
  });

  it('selects the power by the ascendant primary reach (iron → leadership aura)', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { iron: 9, heart: 2 });
    addFaction(g, 'legion');
    const result = applyAnointFaction(g, 'asc', 'legion', 1);
    expect(result.power?.id).toBe('chosen.iron.leadership_aura');
  });

  it('re-anointing reports alreadyChosen and the latest patron wins', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc1', { gold: 5 });
    addAscendantWithReach(g, 'asc2', { iron: 5 });
    addFaction(g, 'guild');

    applyAnointFaction(g, 'asc1', 'guild', 1);
    const second = applyAnointFaction(g, 'asc2', 'guild', 2);

    expect(second.alreadyChosen).toBe(true);
    const chosen = g.getNode('guild')!.properties.chosen as ChosenStatus;
    expect(chosen.byAscendantId).toBe('asc2');
    expect(chosen.domain).toBe('iron');
  });

  it('all eight reaches resolve to a non-null faction power (THR-513 completed the table)', () => {
    const reaches: ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
    for (const reach of reaches) {
      const g = new WorldGraph();
      addAscendantWithReach(g, 'asc', { [reach]: 5 });
      addFaction(g, 'fac');
      const result = applyAnointFaction(g, 'asc', 'fac', 1);
      expect(result.power, `reach ${reach} should map to a power`).not.toBeNull();
    }
  });

  // ─── Fail-soft (NFP #4) ───────────────────────────────────────────────────

  it('no-ops on a missing faction', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { gold: 5 });
    const result = applyAnointFaction(g, 'asc', 'gone', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('missing_faction');
  });

  it('no-ops when the target is not a faction (an individual actor)', () => {
    const g = new WorldGraph();
    addAscendantWithReach(g, 'asc', { gold: 5 });
    addMortal(g, 'mortal');
    const result = applyAnointFaction(g, 'asc', 'mortal', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('not_faction');
    expect(g.getNode('mortal')!.properties.chosen).toBeUndefined();
  });

  it('no-ops when the ascendant has no reach affinities', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'asc', properties: { actorType: 'ascendant' } });
    addFaction(g, 'guild');
    const result = applyAnointFaction(g, 'asc', 'guild', 1);
    expect(result.success).toBe(false);
    expect(result.failSoft).toBe('missing_reach');
  });
});
