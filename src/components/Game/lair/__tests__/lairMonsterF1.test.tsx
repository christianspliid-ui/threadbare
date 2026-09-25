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
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GraphNode } from '../../../../types/graph';
import { buildLairMonsterCardModel } from '../buildLairMonsterCardModel';
import { HexSidebar } from '../../HexSidebar';
import { countLivingMortals } from '../../worldPulseCount';
import { buildChipIconResolver } from '../../encounter-stage/adapters/chipCollaborators';
import { resolveEntityVisual } from '../../../shared/entityVisualResolver';
import { getPortraitUrl } from '../../../../data/portrait-assets';

const ELITE_ID = 'elite_lair_ashen_hollow_1';
const LAIR_ID = 'loc.lair.ashen_hollow';
const MONSTER_PORTRAIT = getPortraitUrl('monster');

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
    expect(card).toEqual({
      lairId: LAIR_ID,
      lairName: 'The Ashen Hollow',
      monster: { id: ELITE_ID, name: 'Grothmaw the Hollow' },
    });
  });

  it('omits the row for a dangling elite id', () => {
    const card = buildLairMonsterCardModel(graphWith(lairNode()), LAIR_ID);
    expect(card?.monster).toBeNull();
  });

  it('omits the row for a slain elite (F4 draws the slain reading)', () => {
    const card = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode({ deceased: true })), LAIR_ID);
    expect(card?.monster).toBeNull();
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

describe('HexSidebar lair block (F1)', () => {
  const baseProps = {
    terrain: 'hills' as const,
    hexCol: 3,
    hexRow: 4,
    sphereInfluence: null,
    regionData: null,
    agentsByLocation: {},
    lineOfSight: 'full' as const,
    cultures: [],
    factions: [],
    locations: [{
      id: LAIR_ID,
      name: 'The Ashen Hollow',
      properties: { locationSubtype: 'lair', lairTier: 'major', namedEliteId: ELITE_ID },
    }],
  };

  it('renders the monster by name, as a link, and no raw elite_ id anywhere', () => {
    const graph = graphWith(lairNode(), eliteNode());
    const onMonsterClick = vi.fn();
    const { container } = render(
      <HexSidebar
        {...baseProps}
        lairMonsterCards={{ [LAIR_ID]: buildLairMonsterCardModel(graph, LAIR_ID) }}
        onMonsterClick={onMonsterClick}
      />,
    );
    const link = screen.getByTestId('lair-monster-link');
    expect(link.textContent).toBe('Grothmaw the Hollow');
    fireEvent.click(link);
    expect(onMonsterClick).toHaveBeenCalledWith(ELITE_ID);
    expect(container.innerHTML).not.toContain('elite_');
  });

  it('renders no monster row, and still no raw id, when the elite does not resolve', () => {
    const graph = graphWith(lairNode());
    const { container } = render(
      <HexSidebar {...baseProps} lairMonsterCards={{ [LAIR_ID]: buildLairMonsterCardModel(graph, LAIR_ID) }} />,
    );
    expect(screen.queryByTestId('lair-monster-row')).toBeNull();
    expect(container.innerHTML).not.toContain('elite_');
  });

  it('renders no raw id when no card is supplied at all', () => {
    const { container } = render(<HexSidebar {...baseProps} />);
    expect(container.innerHTML).not.toContain('elite_');
  });
});

describe('World Pulse count (F1)', () => {
  it('counts living, non-monster individuals only', () => {
    const graph = graphWith(
      node({ id: 'a1', type: 'actor', properties: { actorType: 'individual' } }),
      node({ id: 'a2', type: 'actor', properties: { actorType: 'individual' } }),
      node({ id: 'a3', type: 'actor', properties: { actorType: 'individual', deceased: true } }),
      eliteNode(),
      node({ id: 'm2', type: 'actor', properties: { actorType: 'individual', monsterState: { family: 'beast' } } }),
      node({ id: 'c1', type: 'actor', properties: { actorType: 'culture' } }),
    );
    expect(countLivingMortals(graph)).toBe(2);
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
