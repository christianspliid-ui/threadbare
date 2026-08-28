// @vitest-environment jsdom
/**
 * THR-1307 — the Hooks block read an edge type nothing writes.
 *
 * `HooksBlock` and `AscendantBar`'s hook count both walked
 * `getOutgoingEdges(ascendantId, 'has_attachment')`. `has_attachment` is not an
 * `EdgeType`, has no `EDGE_SCHEMA` row, and has never had a writer — so the array was
 * empty in every world and the three rows were unreachable code, indistinguishable
 * from a surface whose data merely happened to be empty this run.
 *
 * These tests are written against the **real producer and the real reader**, not a
 * fixture describing both sides. The world is built by `devSeedAscendantTestPackage`
 * — the same function `?view=game&seeded` calls — writing into a real `WorldGraph`.
 * That is what makes the repoint falsifiable: revert the reader to `has_attachment`
 * and every positive assertion here goes red, because nothing in the engine puts an
 * edge of that type on the graph for it to find.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HooksBlock, countHooks, extractChips } from '../HooksBlock';
import { WorldGraph } from '../../../../engine/graph';
import { devSeedAscendantTestPackage } from '../../../../engine/gameInit';
import type { GameState } from '../../../../types/gameState';
import { HOOK_LABEL_FALLBACK } from '../../../../data/ascendant-bar-content';

const ASCENDANT_ID = 'asc.test.1';

/**
 * A world carrying exactly what the dev seed writes onto the ascendant, and nothing
 * else — no worldgen, no tick loop. The seed needs only `graph` and `ascendantId`.
 */
function seededState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'Vess of the Long Dark',
    properties: {},
  });

  const state = { graph, ascendantId: ASCENDANT_ID } as unknown as GameState;
  devSeedAscendantTestPackage(state);
  return state;
}

describe('HooksBlock — reads the live carriers, not the writerless `has_attachment` (THR-1307)', () => {
  it('the seed writes has_trait and relates_to, and writes no has_attachment at all', () => {
    const { graph } = seededState();

    // The premise the whole ticket rests on. If this ever goes non-zero, the phantom
    // edge acquired a writer and the verdict below needs revisiting rather than the
    // reader being quietly repointed back.
    expect(graph.getOutgoingEdges(ASCENDANT_ID, 'has_attachment' as never)).toHaveLength(0);

    expect(graph.getOutgoingEdges(ASCENDANT_ID, 'has_trait').length).toBeGreaterThan(0);
    expect(graph.getOutgoingEdges(ASCENDANT_ID, 'relates_to').length).toBeGreaterThan(0);
  });

  it('buckets the seeded traits into conditions and clues by `subcategory`', () => {
    const { conditions, clues } = extractChips(seededState());

    // Named rows, not just counts: a bucketing bug that routed every trait to one row
    // would still satisfy a length-only assertion on the total.
    expect(conditions.map((c) => c.label)).toEqual(
      expect.arrayContaining(['Veiled', 'Thornmarked', 'Unforgotten', 'Cold of Eye']),
    );
    expect(clues.map((c) => c.label)).toEqual(
      expect.arrayContaining([
        'Whisper of the First Fall',
        'Rumor: The Sunken Vale',
        "The Thornweaver's Third Name",
      ]),
    );

    // A clue must not also land in Conditions, and vice versa — the two share an edge
    // family and are told apart only by `subcategory`.
    expect(conditions.map((c) => c.label)).not.toContain('Rumor: The Sunken Vale');
    expect(clues.map((c) => c.label)).not.toContain('Veiled');
  });

  it('reads vows off the agreement EDGE, so the chip carries the pact and not the counterparty', () => {
    const { vows } = extractChips(seededState());

    expect(vows.map((v) => v.label)).toEqual(
      expect.arrayContaining([
        'Pact: Thornweaver',
        'Oath: The Still Hour',
        'Debt: The Grey Seer',
        'Bound: The Watching Tower',
      ]),
    );

    // The counterparty node's own name must NOT be what the chip shows — that is the
    // specific wrong answer a loop reading `graph.getNode(edge.target)` would give.
    expect(vows.map((v) => v.label)).not.toContain('The Grey Seer');

    // The tooltip body is the agreement's terms, which live on the edge.
    const debt = vows.find((v) => v.label === 'Debt: The Grey Seer');
    expect(debt?.def).toContain('A Vision owed');

    // Each agreement type paints its own swatch rather than falling to neutral grey,
    // which on this row reads as a missing value.
    expect(new Set(vows.map((v) => v.valence))).toEqual(new Set(['pact', 'oath', 'debt']));
  });

  it('renders all three section headers with chips, where it previously rendered the empty line', () => {
    render(<HooksBlock gameState={seededState()} />);

    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getByText('Clues')).toBeInTheDocument();
    expect(screen.getByText('Vows & Bonds')).toBeInTheDocument();
    expect(screen.getByText('Veiled')).toBeInTheDocument();
    expect(screen.getByText('Pact: Thornweaver')).toBeInTheDocument();

    // The pre-THR-1307 surface, in every world. Its absence is the visible fix.
    expect(screen.queryByText('No marks, clues, or vows.')).toBeNull();
  });

  it('still renders the empty line when the ascendant genuinely carries nothing', () => {
    // Falsification of the test above: the empty state must remain reachable, or
    // "the chips render" would be a statement about the component always rendering.
    const graph = new WorldGraph();
    graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'Vess', properties: {} });
    const bare = { graph, ascendantId: ASCENDANT_ID } as unknown as GameState;

    render(<HooksBlock gameState={bare} />);
    expect(screen.getByText('No marks, clues, or vows.')).toBeInTheDocument();
    expect(countHooks(bare)).toBe(0);
  });
});

describe('AscendantBar hook count agrees with what HooksBlock renders (THR-1307)', () => {
  it('counts bucketed chips, not raw edges', () => {
    const state = seededState();
    const { conditions, clues, vows } = extractChips(state);

    expect(countHooks(state)).toBe(conditions.length + clues.length + vows.length);
    expect(countHooks(state)).toBeGreaterThan(0);
  });

  it('does not count a trait whose category matches no row', () => {
    // A `bestowed` power rides the same `has_trait` family and is deliberately not a
    // hook. The count must drop it exactly as the block does — the disagreement this
    // shared walk exists to prevent.
    const state = seededState();
    const before = countHooks(state);

    state.graph.addNode({
      id: 'trait.test.bestowed',
      type: 'trait',
      name: 'A Granted Sight',
      properties: { subcategory: 'bestowed', tier: 1 },
    });
    state.graph.addEdge({
      id: 'edge.has_trait.test.bestowed',
      source: ASCENDANT_ID,
      target: 'trait.test.bestowed',
      type: 'has_trait',
      properties: {},
    });

    expect(state.graph.getOutgoingEdges(ASCENDANT_ID, 'has_trait').length).toBeGreaterThan(0);
    expect(countHooks(state)).toBe(before);
  });
});

describe('UI Laws, live for the first time now that chips render (THR-1307)', () => {
  /** An agreement edge with no authored `agreementName` — the unnamed-content path. */
  function unnamedAgreementState(type: string): GameState {
    const graph = new WorldGraph();
    graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'Vess', properties: {} });
    graph.addNode({ id: 'cp.1', type: 'actor', name: 'The Grey Seer', properties: {} });
    graph.addEdge({
      id: 'edge.agreement.unnamed',
      source: ASCENDANT_ID,
      target: 'cp.1',
      type: 'relates_to',
      properties: { agreement: { type, tier: 1, terms: 'Owed.' } },
    });
    return { graph, ascendantId: ASCENDANT_ID } as unknown as GameState;
  }

  it('Law 14 — the agreement type enum never reaches the chip label', () => {
    const { vows } = extractChips(unnamedAgreementState('debt'));

    expect(vows).toHaveLength(1);
    expect(vows[0].label).toBe('A debt with The Grey Seer');

    // The precise thing forbidden is the enum used *as* the label's opening token —
    // `debt with The Grey Seer`, which is what interpolating `agreement.type` produced
    // before this. "debt" as an English noun inside the phrase is not the violation,
    // so the assertion is anchored rather than a bare word search that would forbid
    // the correct answer too.
    expect(vows[0].label).not.toMatch(/^debt\b/);
  });

  it('Law 14 — an agreement type with no word takes the plain-English stand-in, not the key', () => {
    const { vows } = extractChips(unnamedAgreementState('wergild_settlement'));

    expect(vows[0].label).toBe(HOOK_LABEL_FALLBACK.vow);
    expect(vows[0].label).not.toContain('wergild_settlement');
  });

  it('Law 25 — a chip with no open handler does not advertise itself as a control', () => {
    // `HooksBlock` passes no `onOpen`, so no chip may carry role=button/tabindex — a
    // keyboard-focusable control that silently does nothing is a released defect.
    const { container } = render(<HooksBlock gameState={seededState()} />);

    // Premise: chips really rendered, or "no buttons" is trivially true.
    const chip = screen.getByText('Veiled');
    expect(chip).toBeInTheDocument();

    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
    // The chip element itself carries no keyboard-focus affordance. Scoped to the
    // chip rather than the container: the shared `Tooltip` wrapper legitimately owns
    // a `tabindex` so the hover explanation is reachable from the keyboard, and a
    // container-wide sweep would forbid that too.
    expect(chip.getAttribute('tabindex')).toBeNull();
  });
});

describe('authored `category` still buckets alongside the engine `subcategory` (THR-1307)', () => {
  it('accepts a trait tagged with the authored vocabulary', () => {
    // Content may write either key. Dropping `category` to fix the reader would have
    // retired live authored content, so both are read — this pins that.
    const graph = new WorldGraph();
    graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'Vess', properties: {} });
    graph.addNode({
      id: 'trait.authored.mark',
      type: 'trait',
      name: 'Hollow-Marked',
      properties: { category: 'mark', description: 'A thinning.', valence: 'curse' },
    });
    graph.addEdge({
      id: 'edge.has_trait.authored',
      source: ASCENDANT_ID,
      target: 'trait.authored.mark',
      type: 'has_trait',
      properties: {},
    });

    const state = { graph, ascendantId: ASCENDANT_ID } as unknown as GameState;
    expect(extractChips(state).conditions.map((c) => c.label)).toEqual(['Hollow-Marked']);
  });
});
