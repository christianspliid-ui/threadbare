// @vitest-environment jsdom
/**
 * THR-1330 — the Hooks chip's link half.
 *
 * THR-1307 made the three rows reachable and, in doing so, put chips carrying a
 * tooltip and neither an image nor a link on screen — Law 1's gap. The verdict
 * implemented here: a chip links when, and only when, the concept it names resolves
 * to a sheet, decided by `attachmentDetailFromNode` — the same classifier
 * `resolveAttachmentTemplateDetail` runs for the aftermath consequence chip
 * (THR-1120). No image, on that ticket's standing ruling that `EntityVisualKind`
 * excludes `attachment` rather than draw a wrong glyph for the class.
 *
 * As with `hooksBlockCarrier.test.tsx`, the world here is built by the real producer
 * — `devSeedAscendantTestPackage`, the function `?view=game&seeded` calls — so the
 * probe is asked about real seeded nodes rather than about a fixture that invented
 * both the trait and the answer.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HooksBlock, extractChips } from '../HooksBlock';
import { WorldGraph } from '../../../../engine/graph';
import { devSeedAscendantTestPackage } from '../../../../engine/gameInit';
import { attachmentDetailFromNode } from '../../../../engine/attachmentTemplateDetail';
import type { GameState } from '../../../../types/gameState';

const ASCENDANT_ID = 'asc.test.1';

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

describe('THR-1330 — a chip links only where a sheet actually resolves', () => {
  it('every seeded condition carries a sheet id, and it is the trait node the sheet draws', () => {
    const state = seededState();
    const { conditions } = extractChips(state);

    // Premise: the row is populated, or "all of them link" is vacuously true over an
    // empty array (the failure mode `hooksBlockCarrier` was written to expose).
    expect(conditions.length).toBeGreaterThan(0);

    for (const chip of conditions) {
      expect(chip.sheetId).toBe(chip.id);
      // The id is not merely present — it opens a sheet with content in it. Asking the
      // resolver rather than trusting the field is what makes this a link and not a
      // string: a `sheetId` that resolved to `undefined` is Law 21's dead link that
      // looks live, and would pass an assertion on the field alone.
      expect(attachmentDetailFromNode(state.graph.getNode(chip.sheetId!))).toBeDefined();
    }
  });

  it('clues carry no sheet id — the `clue` subcategory is outside the attachment set', () => {
    const state = seededState();
    const { clues } = extractChips(state);

    expect(clues.length).toBeGreaterThan(0);
    expect(clues.map((c) => c.sheetId)).toEqual(clues.map(() => undefined));

    // Falsifies the assertion above: the clue nodes exist and are found by the walk —
    // they simply have no page. Without this, "no clue links" would also hold if the
    // clue row had silently stopped being extracted at all.
    for (const chip of clues) {
      expect(state.graph.getNode(chip.id)).toBeDefined();
      expect(attachmentDetailFromNode(state.graph.getNode(chip.id))).toBeUndefined();
    }
  });

  it('vows carry no sheet id — an agreement is edge state and has no node to draw', () => {
    const state = seededState();
    const { vows } = extractChips(state);

    expect(vows.length).toBeGreaterThan(0);
    for (const chip of vows) {
      expect(chip.sheetId).toBeUndefined();
      // The reason, pinned: the chip's id is an edge id, and no node answers to it.
      expect(state.graph.getNode(chip.id)).toBeUndefined();
    }
  });
});

describe('THR-1330 — the affordance follows the destination, not the handler', () => {
  it('a condition chip opens the attachment sheet with its template id', () => {
    const onOpenAttachment = vi.fn();
    render(<HooksBlock gameState={seededState()} onOpenAttachment={onOpenAttachment} />);

    fireEvent.click(screen.getByText('Veiled'));

    expect(onOpenAttachment).toHaveBeenCalledTimes(1);
    // The template node id, which is what `resolveAttachmentTemplateDetail` takes —
    // not the chip label, and not an edge id.
    expect(onOpenAttachment).toHaveBeenCalledWith('trait.dev.veiled');
  });

  it('Enter and Space both open it, as `role="button"` promises', () => {
    const onOpenAttachment = vi.fn();
    render(<HooksBlock gameState={seededState()} onOpenAttachment={onOpenAttachment} />);
    const chip = screen.getByText('Veiled');

    fireEvent.keyDown(chip, { key: 'Enter' });
    fireEvent.keyDown(chip, { key: ' ' });

    expect(onOpenAttachment).toHaveBeenCalledTimes(2);
  });

  it('Law 25 — a clue keeps no control affordance even when the bar IS wired', () => {
    // The regression THR-1307's own test cannot catch: it renders the block with no
    // handler at all, so every chip is inert for the trivial reason. Here the handler
    // is present and a clue must still be inert, because it has nowhere to go.
    const onOpenAttachment = vi.fn();
    render(<HooksBlock gameState={seededState()} onOpenAttachment={onOpenAttachment} />);

    const clue = screen.getByText('Rumor: The Sunken Vale');
    expect(clue.getAttribute('role')).toBeNull();
    expect(clue.getAttribute('tabindex')).toBeNull();
    // The cursor is the advertisement the player reads before committing to a click.
    expect(clue.style.cursor).toBe('default');

    fireEvent.click(clue);
    expect(onOpenAttachment).not.toHaveBeenCalled();

    // Falsification: in the same render, a condition DOES carry all three. Without
    // this the assertions above would pass on a block that had stopped wiring anything.
    const condition = screen.getByText('Veiled');
    expect(condition.getAttribute('role')).toBe('button');
    expect(condition.getAttribute('tabindex')).toBe('0');
    expect(condition.style.cursor).toBe('pointer');
  });

  it('a vow is inert for the same reason, in the same wired render', () => {
    const onOpenAttachment = vi.fn();
    render(<HooksBlock gameState={seededState()} onOpenAttachment={onOpenAttachment} />);

    const vow = screen.getByText('Debt: The Grey Seer');
    expect(vow.getAttribute('role')).toBeNull();
    fireEvent.click(vow);
    expect(onOpenAttachment).not.toHaveBeenCalled();
  });

  it('an authored `mark` follows the classifier, not the row it landed in', () => {
    // A `category: 'mark'` trait buckets into Conditions but is NOT an attachment
    // subcategory, so it must fail open like a clue. This is the case a per-row rule
    // ("conditions link") would get wrong, and the reason the probe is per-chip.
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

    const [chip] = extractChips(state).conditions;
    expect(chip.label).toBe('Hollow-Marked');
    expect(chip.sheetId).toBeUndefined();

    const onOpenAttachment = vi.fn();
    render(<HooksBlock gameState={state} onOpenAttachment={onOpenAttachment} />);
    fireEvent.click(screen.getByText('Hollow-Marked'));
    expect(onOpenAttachment).not.toHaveBeenCalled();
  });
});
