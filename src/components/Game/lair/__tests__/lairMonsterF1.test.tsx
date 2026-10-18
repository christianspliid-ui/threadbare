// @vitest-environment jsdom
/**
 * THR-1550 (plan doc `Docs/plans/2026-09-23-fight-on-screen.md`, slice F1) —
 * monsters named and counted right.
 *
 * Done-when, one assertion each: the lair card names the monster; no raw
 * `elite_` id renders in the sidebar; the World Pulse count is the living,
 * non-monster individuals; a chip anchored to a monster draws the monster
 * portrait rather than an initial-letter tile.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GraphNode } from '../../../../types/graph';
import { buildLairMonsterCardModel } from '../buildLairMonsterCardModel';
import { buildChipIconResolver } from '../../encounter-stage/adapters/chipCollaborators';
import { resolveEntityVisual } from '../../../shared/entityVisualResolver';
import { getMonsterPortraitUrl } from '../../../../data/portrait-assets';

const ELITE_ID = 'elite_lair_ashen_hollow_1';
const LAIR_ID = 'loc.lair.ashen_hollow';
// THR-1554 — the fixture elite is a beast, so it draws the beast family portrait.
const MONSTER_PORTRAIT = getMonsterPortraitUrl('beast');

function node(partial: Partial<GraphNode> & Pick<GraphNode, 'id' | 'type'>): GraphNode {
  return { name: partial.id, properties: {}, ...partial };
}

function lairNode(extra: Record<string, unknown> = {}): GraphNode {
  return node({
    id: LAIR_ID,
    type: 'location',
    name: 'The Ashen Hollow',
    properties: { locationSubtype: 'lair', lairTier: 'major', namedEliteId: ELITE_ID, ...extra },
  });
}

function eliteNode(extra: Record<string, unknown> = {}): GraphNode {
  return node({
    id: ELITE_ID,
    type: 'actor',
    name: 'Grothmaw the Hollow',
    properties: {
      actorType: 'individual',
      isMonsterElite: true,
      lairId: LAIR_ID,
      monsterState: { family: 'beast', dread: 'fair', might: 'strong', clockSize: 6, clockFilled: 0 },
      ...extra,
    },
  });
}

function graphWith(...nodes: GraphNode[]): WorldGraph {
  const g = new WorldGraph();
  for (const n of nodes) g.addNode(n);
  return g;
}

afterEach(() => cleanup());

describe('buildLairMonsterCardModel (F1 — the name)', () => {
  it('names the living monster that holds the lair', () => {
    const card = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode()), LAIR_ID, 60);
    // F4 (THR-1552) widened the row with the sentence and the clock; F1 pins the name.
    expect(card).toMatchObject({
      lairId: LAIR_ID,
      lairName: 'The Ashen Hollow',
      monster: { id: ELITE_ID, name: 'Grothmaw the Hollow', deceased: false },
    });
  });

  it('omits the row for a dangling elite id', () => {
    const card = buildLairMonsterCardModel(graphWith(lairNode()), LAIR_ID);
    expect(card?.monster).toBeNull();
  });

  it('reads a slain elite as slain, not as a living row (F4, THR-1552)', () => {
    const card = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode({ deceased: true })), LAIR_ID);
    expect(card?.monster).toMatchObject({ id: ELITE_ID, deceased: true, clock: { word: 'slain' } });
  });

  it('omits the row when the node carries no name of its own', () => {
    const nameless = { ...eliteNode(), name: ELITE_ID };
    const card = buildLairMonsterCardModel(graphWith(lairNode(), nameless), LAIR_ID);
    expect(card?.monster).toBeNull();
  });

  it('omits the row when the named node is not a monster', () => {
    const mortal = node({ id: ELITE_ID, type: 'actor', name: 'Tam', properties: { actorType: 'individual' } });
    const card = buildLairMonsterCardModel(graphWith(lairNode(), mortal), LAIR_ID);
    expect(card?.monster).toBeNull();
  });

  it('returns null for a missing lair (fail-soft)', () => {
    expect(buildLairMonsterCardModel(graphWith(), 'loc.nowhere')).toBeNull();
  });
});

describe('the monster EntityVisual kind (F1)', () => {
  it('deriveKind returns monster for an isMonster node, drawing the monster portrait', () => {
    const d = resolveEntityVisual({ id: ELITE_ID }, graphWith(eliteNode()));
    expect(d.kind).toBe('monster');
    expect(d.tier).toBe('art');
    expect(d.src).toBe(MONSTER_PORTRAIT);
  });

  it('is not knowledge-gated: a stranger still sees the beast (Law 8)', () => {
    const d = resolveEntityVisual({ id: ELITE_ID }, graphWith(eliteNode()), { knowledgeLevel: 'stranger' });
    expect(d.src).toBe(MONSTER_PORTRAIT);
  });

  it('refines an explicit agent kind on a monster node (the hex drawer rows)', () => {
    const d = resolveEntityVisual({ id: ELITE_ID, kind: 'agent' }, graphWith(eliteNode()));
    expect(d.kind).toBe('monster');
    expect(d.src).toBe(MONSTER_PORTRAIT);
    expect(d.glyph).not.toBe('G');
  });

  it('an ordinary mortal stays an agent', () => {
    const mortal = node({ id: 'a1', type: 'actor', name: 'Tam', properties: { actorType: 'individual' } });
    expect(resolveEntityVisual({ id: 'a1' }, graphWith(mortal)).kind).toBe('agent');
  });

  it('a chip anchored to a monster draws the monster portrait, not an initial-letter tile', () => {
    const resolveIcon = buildChipIconResolver(graphWith(eliteNode()));
    const icon = resolveIcon({
      text: 'Grothmaw the Hollow',
      entityId: ELITE_ID,
      visualKind: 'agent',
      visualName: 'Grothmaw the Hollow',
    });
    expect(icon?.kind).toBe('monster');
    expect(icon?.src).toBe(MONSTER_PORTRAIT);
  });

  it('a chip anchored to an ordinary mortal keeps the agent kind', () => {
    const mortal = node({ id: 'a1', type: 'actor', name: 'Tam', properties: { actorType: 'individual' } });
    const icon = buildChipIconResolver(graphWith(mortal))({ text: 'Tam', entityId: 'a1', visualKind: 'agent' });
    expect(icon?.kind).toBe('agent');
  });
});
