// @vitest-environment jsdom
/**
 * THR-2103 — art-led pass, slice 7: the lists and notices, rendered.
 *
 * - An unknown mortal draws the silhouette tier (no image) in Notables and in Threads; the
 *   initials medallion is gone, and a Threads hex row draws as before (no picture).
 * - Every Threads section heading and the panel title carry their shapes; the chevron is the
 *   carved disclosure icon.
 * - World Omens draws its shape on the title, and every history row draws its omen mark.
 * - `DoomClockDetail` reads the one doom glyph table and declares none of its own (decision 8).
 * - A toast with a target leads with the subject's picture and keeps its trailing kind icon.
 * - The hover card shows its subject's picture beside the name.
 * - `readListDressing` (behind `__DEBUG.getListDressing`) reads it all back.
 */
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WorldGraph } from '../../../engine/graph';
import { NotablesPanel } from '../NotablesPanel';
import { ThreadsPanel } from '../ThreadsPanel';
import { OmenDetail } from '../OmenDetail';
import { ToastStack } from '../ToastStack';
import { HoverCard } from '../../shared/HoverCard';
import { readListDressing } from '../listDressing';
import { rowVisual } from '../../../engine/views/rowVisual';
import type { ThreadedNode, SustainedControlNode } from '../../../engine/retinue';
import type { GameState, ActiveComposition } from '../../../types/gameState';
import type { FamiliarityMap } from '../../../types/familiarity';
import type { OmenState } from '../../../types/omen';
import type { ToastItem } from '../../../types/notification';
import type { DetailPage } from '../../../types/detailPage';
import { OMEN_TEMPLATES } from '../../../data/omenTemplates';

afterEach(cleanup);

const noop = () => {};
const PORTRAIT = '/portraits/maren.png';

function graph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'n1', type: 'actor', name: 'Maren Hale', properties: { actorType: 'individual', portraitAssetPath: PORTRAIT } });
  g.addNode({ id: 'loc1', type: 'location', name: 'Farwatch', properties: { locationSubtype: 'town', hexCol: 0, hexRow: 0 } });
  return g;
}

const strangers = new Map() as unknown as FamiliarityMap;
const known = new Map([['n1', 1]]) as unknown as FamiliarityMap;

describe('THR-2103 Notables', () => {
  function state(familiarityMap: FamiliarityMap): GameState {
    const comp: ActiveComposition = {
      compositionId: 'notable-agenda-n1-claim-t12',
      firedAtTick: 12,
      activatedPhaseIds: ['whisper'],
      phaseActivationTicks: {},
      resolvedNodes: { target: 'loc1' },
      status: 'active',
      lastEvaluationTick: 20,
      sponsorNotableId: 'n1',
      agendaFamily: 'claim',
    };
    return { tick: 20, seed: 42, graph: graph(), worldFlags: {}, familiarityMap, activeCompositions: [comp] } as unknown as GameState;
  }

  it('an unknown mortal draws the silhouette tier, never their portrait (Law 8)', () => {
    render(<NotablesPanel gameState={state(strangers)} />);
    const row = document.querySelector('[data-notable-id="n1"]')!;
    expect(row.getAttribute('data-row-subject')).toBe('agent');
    expect(row.getAttribute('data-row-art')).toBe('fallback');
    expect(row.querySelector('img')).toBeNull();
  });

  it('a known mortal draws their face, and the title carries the notables shape', () => {
    render(<NotablesPanel gameState={state(known)} />);
    const row = document.querySelector('[data-notable-id="n1"]')!;
    expect(row.getAttribute('data-row-art')).toBe('art');
    expect(row.querySelector('img')?.getAttribute('src')).toBe(PORTRAIT);
    const [dressing] = readListDressing();
    expect(dressing).toMatchObject({ surface: 'notables', subjectRows: 1, subjectRowsBare: 0 });
    expect(dressing.headingIcons).toContain('notables');
  });
});

describe('THR-2103 Threads', () => {
  const agent = {
    id: 'n1', name: 'Maren Hale', tier: 2, tierName: 'Devoted', category: 'agent', threadEdgeId: 't1',
    attentionMode: 'auto_resolve', courtPosition: null, threadStrength: 1, locationId: 'loc1', locationName: 'Farwatch',
    activityLabel: 'Idling', portraitUrl: null, primaryDomain: 'iron', factionName: null,
    championEffectId: null, championTemplateId: null,
  } as unknown as ThreadedNode;
  const place = {
    id: 'loc1', name: 'Farwatch', tier: 1, tierName: 'Touched', category: 'location', threadEdgeId: 't2',
    attentionMode: 'auto_resolve', courtPosition: null, hexCol: 0, hexRow: 0, prosperityLabel: 'Modest', controllingFaction: null,
  } as unknown as ThreadedNode;
  const hex: SustainedControlNode = {
    category: 'hex', effectId: 'eff-hex-1', templateId: 'hex.claim_dominion', displayName: 'Iron Hold', hexCol: 5, hexRow: 3,
    perTickCostTotal: 2, perTickIncomeTotal: 0, netFlow: -2, ticksActive: 12, lapseRisk: 'safe', runwayTicks: 50, primarySphere: 'force',
  } as SustainedControlNode;

  function renderThreads(familiarityMap: FamiliarityMap) {
    const g = graph();
    const ctx = { graph: g, familiarityMap };
    const threadVisuals = {
      n1: rowVisual(ctx, { kind: 'agent', id: 'n1' }),
      loc1: rowVisual(ctx, { kind: 'location', id: 'loc1' }),
    };
    return render(
      <ThreadsPanel
        threadedNodes={[agent, place]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        sustainedControls={[hex]}
        threadVisuals={threadVisuals}
      />,
    );
  }

  it('an unknown mortal draws the silhouette tier; the initials medallion is gone', () => {
    renderThreads(strangers);
    const rows = screen.getAllByTestId('thread-entry');
    const mortal = rows.find(r => r.textContent?.includes('Maren Hale'))!;
    expect(mortal.getAttribute('data-row-art')).toBe('fallback');
    expect(within(mortal).getByTestId('thread-visual').getAttribute('data-entity-visual-tier')).toBe('fallback');
    expect(mortal.querySelector('svg text')).toBeNull();
  });

  it('every subject row draws a picture; the hex row draws as before', () => {
    renderThreads(known);
    // Open the folded sections, so the place and hex rows render.
    for (const key of ['location', 'hex']) {
      if (!screen.queryByTestId(`threads-section-body-${key}`)) fireEvent.click(screen.getByTestId(`threads-section-header-${key}`));
    }
    const [dressing] = readListDressing();
    // Every rendered thread row names its subject (folded sections render no rows).
    expect(dressing).toMatchObject({ surface: 'threads', subjectRows: screen.getAllByTestId('thread-entry').length, subjectRowsBare: 0 });
    expect(dressing.subjectRows).toBeGreaterThan(0);
    const hexBody = screen.getByTestId('threads-section-body-hex');
    expect(within(hexBody).queryByTestId('thread-visual')).toBeNull();
    expect(hexBody.querySelector('[data-row-subject]')).toBeNull();
  });

  it('the title and every section heading carry their shapes, and the chevron is carved', () => {
    renderThreads(known);
    const [dressing] = readListDressing();
    expect(dressing.headingIcons).toEqual(expect.arrayContaining(['threads', 'person', 'place', 'hex']));
    const header = screen.getByTestId('threads-section-header-agent');
    expect(header.textContent).not.toMatch(/[▼▶]/);
    expect(header.querySelector('svg')).toBeTruthy();
  });
});

describe('THR-2103 World Omens', () => {
  it('the title carries the omen shape and every history row draws its omen mark', () => {
    const [a, b] = OMEN_TEMPLATES;
    const omenState = {
      primary: null,
      secondary: null,
      history: [
        { templateId: a.id, startTick: 10, endTick: 40 },
        { templateId: b.id, startTick: 50, endTick: 80 },
      ],
    } as unknown as OmenState;
    render(<OmenDetail omenState={omenState} currentTick={100} onClose={noop} />);
    const rows = screen.getAllByTestId('omen-history-row');
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(within(row).getByTestId('omen-history-mark')).toBeTruthy();
    const dressing = readListDressing().find(d => d.surface === 'omens');
    expect(dressing?.headingIcons).toEqual(['omen']);
  });
});

describe('THR-2103 the doom keeps one glyph table (decision 8)', () => {
  it('DoomClockDetail imports DOOM_ARCHETYPE_GLYPHS and declares no table of its own', () => {
    const src = readFileSync(resolve(__dirname, '../DoomClockDetail.tsx'), 'utf8');
    expect(src).toMatch(/import \{[^}]*DOOM_ARCHETYPE_GLYPHS[^}]*\} from '..\/..\/data\/doom-archetype-presentation'/);
    expect(src).not.toMatch(/const DOOM_ARCHETYPE_GLYPHS/);
  });
});

describe('THR-2103 toasts (decision 4)', () => {
  it('leads with the subject picture and keeps the trailing kind icon', () => {
    const toast: ToastItem = {
      id: 't1', message: 'Maren Hale hears of a road.', count: 1, createdTick: 1, expiresAt: Date.now() + 60_000,
      navigationTarget: { kind: 'agent', agentId: 'n1' },
    };
    const visual = rowVisual({ graph: graph(), familiarityMap: known }, { kind: 'agent', id: 'n1' });
    render(<ToastStack toasts={[toast]} onDismiss={noop} onNavigate={noop} toastVisuals={{ t1: visual }} />);
    const el = screen.getByTestId('toast');
    expect(el.getAttribute('data-row-art')).toBe('art');
    expect(within(el).getByTestId('row-picture')).toBeTruthy();
    expect(el.querySelector('[title="Open their page"]')).toBeTruthy();
    expect(readListDressing()).toEqual([{ surface: 'toasts', subjectRows: 1, subjectRowsBare: 0, headingIcons: [] }]);
  });

  it('a toast about a hex names no subject and draws as before', () => {
    const toast: ToastItem = {
      id: 't2', message: 'The land stirs.', count: 1, createdTick: 1, expiresAt: Date.now() + 60_000,
      navigationTarget: { kind: 'hex', col: 1, row: 1 },
    };
    render(<ToastStack toasts={[toast]} onDismiss={noop} onNavigate={noop} toastVisuals={{}} />);
    const el = screen.getByTestId('toast');
    expect(el.getAttribute('data-row-subject')).toBeNull();
    expect(within(el).queryByTestId('row-picture')).toBeNull();
  });
});

describe('THR-2103 hover card (decision 5)', () => {
  it('shows the subject picture beside the name', () => {
    const anchor = document.createElement('span');
    document.body.appendChild(anchor);
    const page = { kindLabel: 'ACTOR', displayName: 'Maren Hale', subtitle: 'A mortal', sphere: 'order', sections: [] } as unknown as DetailPage;
    const visual = rowVisual({ graph: graph(), familiarityMap: strangers }, { kind: 'agent', id: 'n1' });
    render(<HoverCard page={page} anchorEl={anchor} visual={visual} />);
    expect(screen.getByTestId('hover-card-visual').getAttribute('data-entity-visual-tier')).toBe('fallback');
    expect(readListDressing().find(d => d.surface === 'hover-card')).toMatchObject({ subjectRows: 1, subjectRowsBare: 0 });
  });
});

describe('THR-2103 readListDressing', () => {
  it('reads [] when no list surface is open', () => {
    expect(readListDressing()).toEqual([]);
  });
});
