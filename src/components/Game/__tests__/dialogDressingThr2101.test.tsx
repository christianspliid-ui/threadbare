// @vitest-environment jsdom
/**
 * THR-2101 — art-led pass, slice 5: the dialogs.
 *
 * - Every dialog heading that names a concept draws its carved shape from its row; the rows
 *   with no shape yet are exactly `DIALOG_NO_IDEA_HEADINGS` (they wait on THR-2104).
 * - The Ledger's row and chapter open on the mortal's face, gated by what the god knows
 *   (a stranger is the silhouette, PC-6); a dead mortal keeps the designed tile.
 * - The receipt shows who the act touched, and a relic change shows its painting.
 * - The court speaks in sentences and word chips: no "Label: value" line, no count, no
 *   bonus chip with a numeral or a raw key; its two empty rows are quiet slots.
 * - A beat never prints a raw action id.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { DIALOG_HEADING_ICONS, DIALOG_NO_IDEA_HEADINGS, dialogHeadingIcon } from '../../../data/view-content';
import { ICON_REGISTRY } from '../../../data/icons/iconRegistry';
import { ledgerRowFace } from '../../../engine/threadedChapters';
import { courtFaces, dialogSubjectFace, receiptChangeArt, receiptTargetVisual } from '../../../engine/views/dialogDressing';
import { Modal } from '../../shared/Modal';
import { ChapterView } from '../ChapterView';
import { DivineReceiptModal } from '../DivineReceiptModal';
import { ScryOverlay, TitleEffectChips } from '../ScryOverlay';
import { ScryProvider } from '../contexts/ScryContext';
import { AscendantBeatModal } from '../AscendantBeatModal';
import { createScryState, initializeCourt } from '../../../engine/scry';
import { SPHERE_NAMES } from '../../../types/index';
import type { EssencePool } from '../../../types/influence';
import type { RetinueAgent } from '../../../engine/retinue';
import type { Title } from '../../../types/scry';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { PlayerActionReceipt } from '../../../engine/playerReceipts';
import type { PendingBeat } from '../../../types/ascendantBeat';
import type { FamiliarityMap } from '../../../types/familiarity';

const PORTRAIT = '/portraits/maren.png';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'maren', type: 'actor', name: 'Maren Ashfold', properties: { actorType: 'individual', portraitAssetPath: PORTRAIT } });
  graph.addNode({ id: 'fac-1', type: 'actor', name: 'The Grey Court', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Varnholt', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'relic-1', type: 'artifact', name: 'The Ember Ring', properties: { subcategory: 'relics_talismans' } });
  return graph;
}

const known = (): FamiliarityMap => new Map([['maren', 1]]) as unknown as FamiliarityMap;

describe('THR-2101 dialog heading shapes (S5.2)', () => {
  it('every heading with no shape is waiting on the icon pick, and every shape is a registry idea', () => {
    const rows = Object.entries(DIALOG_HEADING_ICONS);
    expect(rows.filter(([, v]) => v === null).map(([k]) => k).sort()).toEqual([...DIALOG_NO_IDEA_HEADINGS].sort());
    for (const [, v] of rows) if (v) expect(ICON_REGISTRY[v]).toBeDefined();
  });

  it('Modal.Header draws the row it is handed, and nothing for null', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} aria-label="t"><Modal.Header icon={dialogHeadingIcon('chapterLedger')}>Chapter Ledger</Modal.Header></Modal>,
    );
    expect(document.querySelector('[data-dialog-heading-icon]')?.getAttribute('data-dialog-heading-icon')).toBe('chapter-ledger');
    rerender(<Modal open onClose={() => {}} aria-label="t"><Modal.Header icon={dialogHeadingIcon('court')}>Divine Court</Modal.Header></Modal>);
    expect(document.querySelector('[data-dialog-heading-icon]')).toBeNull();
  });
});

describe('THR-2101 faces (S5.1)', () => {
  it('a Ledger row about a stranger draws the silhouette; a known mortal draws the portrait', () => {
    const graph = world();
    const row = { actorId: 'maren', actorName: 'Maren Ashfold' };
    expect(ledgerRowFace({ graph, familiarityMap: new Map() as unknown as FamiliarityMap }, row)?.tier).toBe('fallback');
    const face = ledgerRowFace({ graph, familiarityMap: known() }, row);
    expect(face?.tier).toBe('art');
    expect(face?.src).toBe(PORTRAIT);
    expect(face?.alt).toBe('Maren Ashfold');
  });

  it('a dead mortal keeps the designed tile under the stored name; a god or faction draws none', () => {
    const graph = world();
    const dead = ledgerRowFace({ graph, familiarityMap: known() }, { actorId: 'gone', actorName: 'Old Tobin' });
    expect(dead?.tier).toBe('fallback');
    expect(dead?.alt).toBe('Old Tobin');
    expect(ledgerRowFace({ graph, familiarityMap: known() }, { actorId: 'fac-1', actorName: 'x' })).toBeNull();
    expect(dialogSubjectFace({ graph, familiarityMap: known() }, 'asc-1')).toBeNull();
    expect(dialogSubjectFace({ graph, familiarityMap: known() }, undefined)).toBeNull();
  });

  it('ChapterView opens on the face it is handed, at the dialog face width', () => {
    const graph = world();
    const chapter = {
      actionId: 'a1', templateName: 'A Quiet Debt', actorId: 'maren', actorName: 'Maren Ashfold',
      targetId: 'loc-town', targetName: 'Varnholt', resolved: false, threaded: true, steps: [], participants: [],
    } as unknown as ChapterRecord;
    render(<ChapterView chapter={chapter} face={ledgerRowFace({ graph, familiarityMap: new Map() as unknown as FamiliarityMap }, chapter)} />);
    const face = screen.getByTestId('chapter-view-face');
    expect(face.getAttribute('data-dialog-face')).toBe('fallback');
    expect(face.style.width).toBe('var(--dialog-subject-portrait-w)');
  });

  it('court faces resolve through the one face path for every seat', () => {
    const faces = courtFaces({ graph: world(), familiarityMap: known() }, [
      { id: 'maren', name: 'Maren Ashfold' },
      { id: 'gone', name: 'Old Tobin' },
    ]);
    expect(faces.maren.tier).toBe('art');
    expect(faces.gone.tier).toBe('fallback');
  });
});

describe('THR-2101 the receipt (decision 2, S5.3)', () => {
  const receipt = (over: Partial<PlayerActionReceipt> = {}): PlayerActionReceipt => ({
    id: 'r1', actionId: 'act1', templateId: 'tpl', templateName: 'Ember Ward', targetId: 'maren', targetName: 'Maren Ashfold',
    essencePaid: 4, startTick: 1, resolvedTick: 5, outcome: 'success', outcomeBand: 'success', overview: '',
    changes: [
      { id: 'c1', kind: 'item', title: 'Gained a relic', detail: 'The Ember Ring is hers.', polarity: 'gain', category: 'boon',
        concepts: [{ text: 'The Ember Ring', entityId: 'relic-1', visualKind: 'artifact' }] },
      { id: 'c2', kind: 'standing', title: 'Trusted', detail: 'She trusts you more.', polarity: 'gain' },
    ],
    presentation: 'modal', acknowledged: false,
    ...over,
  } as unknown as PlayerActionReceipt);

  it('the target is a medallion for a mortal, a place or a faction; nothing for yourself', () => {
    const state = { graph: world(), familiarityMap: known() };
    expect(receiptTargetVisual(state, receipt())?.tier).toBe('art');
    expect(receiptTargetVisual(state, receipt({ targetId: 'loc-town', targetName: 'Varnholt' }))?.kind).toBe('location');
    expect(receiptTargetVisual(state, receipt({ targetId: 'fac-1', targetName: 'The Grey Court' }))?.kind).toBe('faction');
    expect(receiptTargetVisual(state, receipt({ targetId: 'asc-1', targetName: 'yourself' }))).toBeNull();
    expect(receiptTargetVisual(state, receipt({ targetId: 'nobody' }))).toBeNull();
  });

  it('a change naming a relic draws its painting; a plain change draws none', () => {
    const graph = world();
    const r = receipt();
    const art = receiptChangeArt({ graph }, r.changes);
    expect(art.c1).toBe('/assets/items/categories/relics-talismans.jpg');
    expect(art.c2).toBeUndefined();
    render(
      <DivineReceiptModal open receipt={r} onAcknowledge={vi.fn()}
        targetVisual={receiptTargetVisual({ graph, familiarityMap: known() }, r)} changeArt={art} />,
    );
    const tiles = screen.getAllByTestId('divine-receipt-relic-tile');
    expect(tiles).toHaveLength(1);
    expect(tiles[0].getAttribute('src')).toBe(art.c1);
    expect(screen.getByTestId('divine-receipt-target').getAttribute('data-dialog-face')).toBe('art');
    expect(document.querySelector('[data-dialog-heading-icon]')?.getAttribute('data-dialog-heading-icon')).toBe('receipt');
    expect(document.querySelector('[data-consequence-icon]')).not.toBeNull();
  });
});

describe('THR-2101 the court in sentences (S5.4)', () => {
  const agents = [
    { id: 'maren', name: 'Maren Ashfold', tier: 3, tierName: 'Champion', locationId: 'l', locationName: 'Varnholt', domainCapabilities: {}, profile: {}, factionName: null },
  ] as unknown as RetinueAgent[];
  const pool = Object.fromEntries(SPHERE_NAMES.map(s => [s, 1])) as EssencePool;
  const context = {
    scryState: initializeCourt(createScryState(), 'high_house'),
    retinueAgents: agents,
    essencePool: pool,
    primarySphere: 'force' as const,
    secondarySphere: 'mind' as const,
    tick: 10,
    seed: 42,
    faces: courtFaces({ graph: world(), familiarityMap: known() }, agents),
    onAssign: vi.fn(),
    onDemote: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders no "Label: value" line and draws the two empty rows as quiet slots', () => {
    render(<ScryProvider value={context}><ScryOverlay /></ScryProvider>);
    const text = document.body.textContent ?? '';
    for (const label of ['Position:', 'Minimum tier:', 'Cost:', 'Required:', 'Available:', 'Structure Bonus:', 'Coming Soon']) {
      expect(text).not.toContain(label);
    }
    expect(screen.getByTestId('scry-empty-sacred-sites').textContent).toBe('No sacred site is bound to your court yet.');
    expect(screen.getByTestId('scry-empty-artifacts').textContent).toBe('No divine artifact rests in your court yet.');
    const shapes = [...document.querySelectorAll('[data-dialog-heading-icon]')].map(el => el.getAttribute('data-dialog-heading-icon'));
    expect(shapes).toEqual(['place', 'relic']);
  });

  it('the seat picker speaks one sentence with the tier word', () => {
    render(<ScryProvider value={context}><ScryOverlay /></ScryProvider>);
    fireEvent.click(screen.getAllByText(/Empty/i)[0]);
    expect(screen.getByTestId('scry-seat-sentence').textContent).toMatch(/^The .+'s seat takes a mortal who is Champion or more\.$/);
    expect(document.querySelector('[data-testid="scry-agent-picker"] [data-dialog-face]')?.getAttribute('data-dialog-face')).toBe('art');
  });

  it('a title shows its bonus and weakness as words, never a count, a numeral or a raw key', () => {
    const title = {
      id: 't', name: 'Warden of Ash', rank: 'apex', sphereAffinity: 'force', domainAffinity: 'iron', flavorText: '',
      bonuses: [
        { type: 'domain_bonus', target: 'primary_domain', value: 3.2, description: '+3.20 to primary_domain' },
        { type: 'custom', target: 'unknown_target', value: 1, description: '+1 to unknown_target' },
      ],
      weaknesses: [{ type: 'domain_bonus', target: 'heart', value: -1, description: 'Diminished social grace' }],
    } as unknown as Title;
    render(<TitleEffectChips title={title} agentName="Maren" />);
    const bonus = [...document.querySelectorAll('[data-title-chip="bonus"]')].map(el => el.textContent ?? '');
    const weakness = [...document.querySelectorAll('[data-title-chip="weakness"]')].map(el => el.textContent ?? '');
    expect(bonus).toEqual(['Sharper in their first reach']);
    expect(weakness).toEqual(['Diminished social grace']);
    for (const word of bonus) expect(word).not.toMatch(/[\d_]/);
    expect(document.body.textContent).not.toMatch(/\d+ bonus|\d+ weakness/);
  });
});

describe('THR-2101 the beat (S5.5, Law 14)', () => {
  it('a granted card with no catalog entry prints nothing, never its raw id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <AscendantBeatModal open pending={{ beatId: 'beat.pool.not_authored_anywhere', kind: 'investment', offeredTurn: 1 } as PendingBeat}
        onResolve={vi.fn()} signatureGrantId="debug.no_such_card_thr2101" />,
    );
    expect(document.body.textContent).not.toContain('debug.no_such_card_thr2101');
    expect(document.body.textContent).not.toContain('You will learn:');
    warn.mockRestore();
  });

  it('a beat about a mortal shows their face in the medallion', () => {
    const face = dialogSubjectFace({ graph: world(), familiarityMap: known() }, 'maren');
    render(
      <AscendantBeatModal open pending={{ beatId: 'beat.pool.not_authored_anywhere', kind: 'investment', offeredTurn: 1 } as PendingBeat}
        onResolve={vi.fn()} subjectFace={face} />,
    );
    expect(screen.getByTestId('reveal-medallion').closest('[data-dialog-face]')?.getAttribute('data-dialog-face')).toBe('art');
  });
});
