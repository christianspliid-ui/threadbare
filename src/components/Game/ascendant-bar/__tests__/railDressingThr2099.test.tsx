// @vitest-environment jsdom
/**
 * THR-2099 — art-led pass, slice 3: the god rail and the top bar are dressed, nothing added.
 *
 * - Every rail heading draws its carved shape from its registry row; rows with no shape yet
 *   are exactly `GOD_RAIL_NO_IDEA_ROWS` (they wait on THR-2104).
 * - A named mortal (The First, a vow's mortal counterparty, a Needs-you row's mortal) carries
 *   their face; a place, a hex or a missing node draws none.
 * - The Seat line draws its town's place shape and still centres the map.
 * - The doom item carries the `doom` shape; the omen draws no second icon.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import {
  GOD_RAIL_NO_IDEA_ROWS,
  GOD_RAIL_SECTIONS,
  TOP_BAR_ITEMS,
  godRailSectionIcon,
} from '../../../../data/frame-registry';
import { ICON_REGISTRY } from '../../../../data/icons/iconRegistry';
import { selectCovenantRows, selectHomeSeat } from '../selectors';
import { CovenantsBlock } from '../CovenantsBlock';
import { SeatLine } from '../SeatLine';
import { extractChips } from '../HooksBlock';
import { mortalFace } from '../../../../engine/views/entityVisualResolver';
import { buildNeedsYou, needsYouRowFace, withNeedsYouFaces, type NeedsYouSources } from '../../../../engine/views/needsYou';
import type { GameState } from '../../../../types/gameState';
import type { ControlEffect } from '../../../../types/controlEffect';
import type { AlertItem } from '../../../../types/notification';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant', homeSeatLocationId: 'loc-town' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'fac-1', type: 'actor', name: 'The Grey Court', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Varnholt', properties: { locationSubtype: 'town' } });
  return graph;
}

function state(graph: WorldGraph, controlEffects: ControlEffect[] = []): GameState {
  return { tick: 10, seed: 42, ascendantId: 'asc-1', graph, controlEffects } as unknown as GameState;
}

function effect(targetNodeId: string): ControlEffect {
  return {
    effectId: `cov_${targetNodeId}`,
    templateId: 'tpl_hold',
    ownerId: 'asc-1',
    targetNodeId,
    targetHexCol: 4,
    targetHexRow: 6,
    establishedTick: 3,
    ritualEssenceInvested: 2,
    perTickCost: { force: 0.5 },
    perTickMutations: [],
    perTickGraphOps: [],
    active: true,
    ticksActive: 5,
    narrativeTemplates: { established: 'E.', active: 'The oath holds.', lapsed: 'L.' },
  };
}

describe('THR-2099 rail heading icons (S3.1)', () => {
  it('every row without a shape, other than identity, is waiting on the icon pick', () => {
    const noIcon = GOD_RAIL_SECTIONS.filter((s) => s.icon === null && s.id !== 'identity').map((s) => s.id);
    expect(noIcon.sort()).toEqual([...GOD_RAIL_NO_IDEA_ROWS].sort());
  });

  it('every shape named on the rail and the doom item is a registry idea', () => {
    for (const s of GOD_RAIL_SECTIONS) if (s.icon) expect(ICON_REGISTRY[s.icon]).toBeDefined();
    expect(ICON_REGISTRY.doom).toBeDefined();
  });

  it('bodies read the row, never a literal', () => {
    expect(godRailSectionIcon('essence')).toBe('essence');
    expect(godRailSectionIcon('hand')).toBe('cards');
    expect(godRailSectionIcon('reaches')).toBeNull();
  });
});

describe('THR-2099 faces on named mortals (S3.2)', () => {
  it('mortalFace names mortals only', () => {
    const g = world();
    expect(mortalFace(g, 'kael')?.alt).toBe('Kael Thornweaver');
    expect(mortalFace(g, 'fac-1')).toBeNull();
    expect(mortalFace(g, 'asc-1')).toBeNull();
    expect(mortalFace(g, 'loc-town')).toBeNull();
    expect(mortalFace(g, 'gone')).toBeNull();
  });

  // A covenant is held on a place or a land (`spawnControlEffect` refuses any other target),
  // so its row keeps the place's name and draws no face.
  it('a covenant on a place keeps its name and draws no face', () => {
    const rows = selectCovenantRows(state(world(), [effect('loc-town')]));
    expect(rows[0].target).toBe('Varnholt');
    const { container } = render(<CovenantsBlock rows={rows} />);
    expect(container.querySelectorAll('[data-rail-face="true"]')).toHaveLength(0);
    expect(screen.getByText('Varnholt')).toBeInTheDocument();
  });

  it('a vow with a mortal counterparty leads with their face; the label is unchanged', () => {
    const g = world();
    g.addEdge({ id: 'e-vow', type: 'relates_to', source: 'asc-1', target: 'kael', properties: { agreement: { type: 'oath', terms: 'Keep the gate.' }, agreementName: 'The gate oath' } } as never);
    g.addEdge({ id: 'e-vow-f', type: 'relates_to', source: 'asc-1', target: 'fac-1', properties: { agreement: { type: 'pact', terms: 'Peace.' }, agreementName: 'The court pact' } } as never);
    const { vows } = extractChips(state(g));
    const byLabel = Object.fromEntries(vows.map((v) => [v.label, v]));
    expect(byLabel['The gate oath'].face?.alt).toBe('Kael Thornweaver');
    expect(byLabel['The court pact'].face).toBeUndefined();
  });
});

describe('THR-2099 the Seat line (S3.3)', () => {
  it("draws the town's place shape and still centres the map", () => {
    const seat = selectHomeSeat(state(world()));
    expect(seat).toEqual({ locationId: 'loc-town', name: 'Varnholt', icon: 'place-town' });
    const onCenter = vi.fn();
    const { container } = render(<SeatLine seat={seat} onCenter={onCenter} />);
    expect(container.querySelector('[data-icon="place-town"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(onCenter).toHaveBeenCalledWith('loc-town');
  });

  it('a subtype with no place shape draws none (fail-soft)', () => {
    const g = world();
    g.getNode('loc-town')!.properties.locationSubtype = 'no_such_place';
    expect(selectHomeSeat(state(g))?.icon).toBeNull();
  });
});

describe('THR-2099 the top bar (S3.5)', () => {
  it('doom carries the doom shape; the omen draws no second icon', () => {
    expect(TOP_BAR_ITEMS.find((i) => i.id === 'doom')?.icon).toBe('doom');
    expect(TOP_BAR_ITEMS.find((i) => i.id === 'omen')?.icon).toBeNull();
  });

  // One alert per tick, so none fold into a burst (alerts of one kind in one tick are one row).
  let tick = 0;
  function alert(id: string, navigationTarget?: AlertItem['navigationTarget']): AlertItem {
    tick += 1;
    return { id, tick, message: `${id} message`, icon: 'death', navigationTarget } as unknown as AlertItem;
  }

  it('a Needs-you row about a mortal carries their face; a row about a hex draws none', () => {
    const g = world();
    const src: NeedsYouSources = {
      currentTick: 10, beatOffer: null, receipts: [], namedPause: null, held: [],
      alerts: [
        alert('a-agent', { kind: 'agent', agentId: 'kael' }),
        alert('a-journey', { kind: 'journey', journeyId: 'j1', agentId: 'kael' }),
        alert('a-hex', { kind: 'hex', col: 2, row: 3 }),
        alert('a-stale', { kind: 'agent', agentId: 'gone' }),
      ],
    };
    const vm = withNeedsYouFaces(buildNeedsYou(src), g);
    const faces = Object.fromEntries(vm.groups.news.map((r) => [r.id, r.face?.alt ?? null]));
    expect(faces['alert:a-agent']).toBe('Kael Thornweaver');
    expect(faces['alert:a-journey']).toBe('Kael Thornweaver');
    expect(faces['alert:a-hex']).toBeNull();
    expect(faces['alert:a-stale']).toBeNull();
    expect(needsYouRowFace({ navigationTarget: { kind: 'hex', col: 1, row: 1 } }, g)).toBeNull();
  });
});
