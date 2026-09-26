// @vitest-environment jsdom
/**
 * THR-1552 (plan doc `Docs/plans/2026-09-23-fight-on-screen.md`, slice F4): the
 * lair card.
 *
 * Done-when, one assertion each: the card is a sentence with square clock pips
 * and a word; the temper clause is absent before any fight and present after one;
 * a slain monster reads "slain" in the lair block of a legendary lair and in the
 * Cleared Lair Section; "slain by {name}" renders when the monster's sheet names
 * the killer and not when it does not; the card matches `listMonsters`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GraphNode } from '../../../../types/graph';
import { listMonsters } from '../../../../engine/monsters/listMonsters';
import { getAgentInfoCard } from '../../../../engine/agentDetail';
import { buildLairMonsterCardModel } from '../buildLairMonsterCardModel';
import { HexSidebar } from '../../HexSidebar';
import { DREAD_PHRASES, MIGHT_PHRASES, TEMPER_CLAUSES, FIGHT_CLOCK_PIP_SIZE } from '../../../../data/fight-screen-content';

const ELITE_ID = 'elite_lair_ashen_hollow_1';
const OLD_ELITE_ID = 'elite_lair_ashen_hollow_0';
const KILLER_ID = 'agent.tam_rook';
const LAIR_ID = 'loc.lair.ashen_hollow';
const TICK = 100;

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

function eliteNode(extra: Record<string, unknown> = {}, card: Record<string, unknown> = {}, id = ELITE_ID): GraphNode {
  return node({
    id,
    type: 'actor',
    name: 'Grothmaw the Hollow',
    properties: {
      actorType: 'individual',
      isMonsterElite: true,
      lairId: LAIR_ID,
      monsterState: {
        family: 'beast',
        dread: 'steep',
        might: 'steep',
        clockSize: 6,
        clockFilled: 0,
        clockUpdatedTick: TICK,
        temperShown: false,
        ...card,
      },
      ...extra,
    },
  });
}

function killerNode(): GraphNode {
  return node({ id: KILLER_ID, type: 'actor', name: 'Tam Rook', properties: { actorType: 'individual' } });
}

const TEMPER_TRAIT_ID = 'trait.temper.berserk';

/**
 * A graph holding `nodes`. Temper lives on a `has_trait` edge, not on the card
 * (`types/monster.ts`), so every monster fixture gets the berserk edge the mint
 * would write.
 */
function graphWith(...nodes: GraphNode[]): WorldGraph {
  const g = new WorldGraph();
  g.addNode(node({ id: TEMPER_TRAIT_ID, type: 'trait', name: 'Berserk' }));
  for (const n of nodes) g.addNode(n);
  for (const n of nodes) {
    if (n.properties?.isMonsterElite !== true) continue;
    g.addEdge({ id: `e.${n.id}.temper`, source: n.id, target: TEMPER_TRAIT_ID, type: 'has_trait', properties: {} });
  }
  return g;
}

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
};

function renderSidebar(graph: WorldGraph, subtype: 'lair' | 'cleared_lair', lairTier = 'major', onMonsterClick = vi.fn()) {
  const lair = graph.getNode(LAIR_ID)!;
  return render(
    <HexSidebar
      {...baseProps}
      locations={[{ id: LAIR_ID, name: lair.name, properties: { ...lair.properties, locationSubtype: subtype, lairTier } }]}
      lairMonsterCards={{ [LAIR_ID]: buildLairMonsterCardModel(graph, LAIR_ID, TICK) }}
      onMonsterClick={onMonsterClick}
    />,
  );
}

afterEach(() => cleanup());

describe('buildLairMonsterCardModel (F4: the card)', () => {
  it('says the card as a sentence: the family line, the Dread and Might phrases', () => {
    const card = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode()), LAIR_ID, TICK)!;
    const text = card.monster!.sentenceText.toLowerCase();
    expect(text).toContain(DREAD_PHRASES.steep);
    expect(text).toContain(MIGHT_PHRASES.steep);
    expect(card.monster!.sentence.find((s) => s.role === 'dread')?.tooltipId).toBe('fight.dread');
    expect(card.monster!.sentence.find((s) => s.role === 'might')?.tooltipId).toBe('fight.might');
  });

  it('shows the clock as a word: untouched, then half-broken', () => {
    const untouched = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode()), LAIR_ID, TICK)!;
    expect(untouched.monster!.clock).toMatchObject({ size: 6, filled: 0, word: 'untouched' });
    const half = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode({}, { clockFilled: 3 })), LAIR_ID, TICK)!;
    expect(half.monster!.clock).toMatchObject({ size: 6, filled: 3, word: 'half-broken', ariaLabel: 'half-broken' });
  });

  it('keeps the temper clause back until the monster has fought, then says it', () => {
    const before = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode()), LAIR_ID, TICK)!;
    expect(before.monster!.temperShown).toBe(false);
    expect(before.monster!.sentenceText).not.toContain(TEMPER_CLAUSES.berserk);
    const after = buildLairMonsterCardModel(graphWith(lairNode(), eliteNode({}, { temperShown: true })), LAIR_ID, TICK)!;
    expect(after.monster!.temperShown).toBe(true);
    expect(after.monster!.sentenceText).toContain(TEMPER_CLAUSES.berserk);
  });

  it('finds a legendary lair\'s slain beast by reverse lookup on its lairId', () => {
    // A felled legendary lair keeps its lair but loses its namedEliteId (plan doc 3).
    const graph = graphWith(
      lairNode({ lairTier: 'legendary', namedEliteId: undefined }),
      eliteNode({ deceased: true, deceasedTick: 90, deathCause: 'fight' }),
    );
    const card = buildLairMonsterCardModel(graph, LAIR_ID, TICK)!;
    expect(card.monster).toMatchObject({ id: ELITE_ID, deceased: true, clock: { word: 'slain', filled: 6, size: 6 } });
  });

  it('picks the latest death when a lair has lost more than one beast', () => {
    const graph = graphWith(
      lairNode({ namedEliteId: undefined }),
      eliteNode({ deceased: true, deceasedTick: 40, deathCause: 'fight' }, {}, OLD_ELITE_ID),
      eliteNode({ deceased: true, deceasedTick: 90, deathCause: 'fight' }),
    );
    expect(buildLairMonsterCardModel(graph, LAIR_ID, TICK)!.monster!.id).toBe(ELITE_ID);
  });

  it('prefers a living monster over a slain predecessor', () => {
    const graph = graphWith(
      lairNode(),
      eliteNode({ deceased: true, deceasedTick: 40, deathCause: 'fight' }, {}, OLD_ELITE_ID),
      eliteNode(),
    );
    expect(buildLairMonsterCardModel(graph, LAIR_ID, TICK)!.monster).toMatchObject({ id: ELITE_ID, deceased: false });
  });

  it('names the killer when the sheet names one (a fight death is seen)', () => {
    const graph = graphWith(
      lairNode({ namedEliteId: undefined }),
      eliteNode({ deceased: true, deceasedTick: 90, deathCause: 'fight', slainBy: KILLER_ID }),
      killerNode(),
    );
    // The card and the sheet agree about who did it.
    expect(getAgentInfoCard(graph, ELITE_ID, '', 'stranger', 0, TICK)?.death?.by).toBe('Tam Rook');
    const card = buildLairMonsterCardModel(graph, LAIR_ID, TICK)!;
    expect(card.monster).toMatchObject({ slainBy: 'Tam Rook', slainById: KILLER_ID });
  });

  it('names nobody when the sheet names nobody (an unseen kill)', () => {
    const graph = graphWith(
      lairNode({ namedEliteId: undefined }),
      eliteNode({ deceased: true, deceasedTick: 90, deathCause: 'plot', slainBy: KILLER_ID }),
      killerNode(),
    );
    expect(getAgentInfoCard(graph, ELITE_ID, '', 'stranger', 0, TICK)?.death?.by).toBeUndefined();
    const card = buildLairMonsterCardModel(graph, LAIR_ID, TICK)!;
    expect(card.monster!.deceased).toBe(true);
    expect(card.monster!.slainBy).toBeUndefined();
    expect(card.monster!.slainById).toBeUndefined();
  });

  it('matches listMonsters for the same monster', () => {
    const graph = graphWith(lairNode(), eliteNode({}, { clockFilled: 2, temperShown: true }));
    const listed = listMonsters(graph).find((m) => m.id === ELITE_ID)!;
    const card = buildLairMonsterCardModel(graph, LAIR_ID, TICK)!.monster!;
    expect(card.id).toBe(listed.id);
    expect(card.name).toBe(listed.name);
    expect(card.deceased).toBe(listed.deceased);
    expect(card.temperShown).toBe(listed.temperShown);
    expect(card.clock.size).toBe(listed.clockSize);
    // No recovery has elapsed at TICK, so the recovered clock equals the stored one.
    expect(card.clock.filled).toBe(listed.clockFilled);
    expect(card.sentenceText.toLowerCase()).toContain(DREAD_PHRASES[listed.dread]);
    expect(card.sentenceText.toLowerCase()).toContain(MIGHT_PHRASES[listed.might]);
    expect(listed.temper).toBe('berserk');
    expect(card.sentenceText).toContain(TEMPER_CLAUSES[listed.temper]);
  });
});

describe('HexSidebar lair card (F4)', () => {
  it('renders the sentence, square pips at the pip size, and the clock word, with no digits', () => {
    const graph = graphWith(lairNode(), eliteNode({}, { clockFilled: 3 }));
    renderSidebar(graph, 'lair');
    const card = screen.getByTestId('lair-monster-card');
    expect(within(card).getByTestId('lair-monster-sentence').textContent).toContain(MIGHT_PHRASES.steep);
    expect(within(card).getByTestId('lair-monster-clock-word').textContent).toBe('half-broken');
    const pips = within(card).getByTestId('lair-monster-pips');
    expect(pips.querySelector('[aria-label="half-broken"]')).not.toBeNull();
    const pip = pips.querySelector('[aria-label="half-broken"] > *') as HTMLElement | null;
    expect(pip?.style.width).toBe(`${FIGHT_CLOCK_PIP_SIZE}px`);
    // Law 13/16: no numeral, no `word: value` strip.
    expect(card.textContent).not.toMatch(/\d/);
    expect(card.textContent).not.toMatch(/\b(dread|might|clock)\s*:/i);
  });

  it('keeps the temper clause off the card before any fight and shows it after one', () => {
    renderSidebar(graphWith(lairNode(), eliteNode()), 'lair');
    expect(screen.getByTestId('lair-monster-card').textContent).not.toContain(TEMPER_CLAUSES.berserk);
    cleanup();
    renderSidebar(graphWith(lairNode(), eliteNode({}, { temperShown: true })), 'lair');
    expect(screen.getByTestId('lair-monster-card').textContent).toContain(TEMPER_CLAUSES.berserk);
  });

  it('shows a legendary lair\'s slain beast in the lair block, killer named and linked', () => {
    const graph = graphWith(
      lairNode({ lairTier: 'legendary', namedEliteId: undefined }),
      eliteNode({ deceased: true, deceasedTick: 90, deathCause: 'fight', slainBy: KILLER_ID }),
      killerNode(),
    );
    const onMonsterClick = vi.fn();
    const { container } = renderSidebar(graph, 'lair', 'legendary', onMonsterClick);
    const card = screen.getByTestId('lair-monster-card');
    expect(card.getAttribute('data-deceased')).toBe('true');
    expect(within(card).getByTestId('lair-monster-clock-word').textContent).toBe('slain by Tam Rook');
    fireEvent.click(within(card).getByTestId('lair-monster-killer'));
    expect(onMonsterClick).toHaveBeenCalledWith(KILLER_ID);
    expect(container.innerHTML).not.toContain('elite_');
  });

  it('shows a cleared major lair\'s slain beast in the Cleared Lair Section, unnamed killer', () => {
    const graph = graphWith(
      lairNode({ locationSubtype: 'cleared_lair', namedEliteId: undefined }),
      eliteNode({ deceased: true, deceasedTick: 90, deathCause: 'plot', slainBy: KILLER_ID }),
      killerNode(),
    );
    const { container } = renderSidebar(graph, 'cleared_lair');
    expect(container.textContent).toContain('Cleared Lair');
    const card = screen.getByTestId('lair-monster-card');
    expect(within(card).getByTestId('lair-monster-clock-word').textContent).toBe('slain');
    expect(within(card).queryByTestId('lair-monster-killer')).toBeNull();
    expect(container.innerHTML).not.toContain('elite_');
  });

  it('renders no card in the Cleared Lair Section when no slain beast names the lair', () => {
    const graph = graphWith(lairNode({ locationSubtype: 'cleared_lair', namedEliteId: undefined }));
    renderSidebar(graph, 'cleared_lair');
    expect(screen.queryByTestId('lair-monster-card')).toBeNull();
  });
});
