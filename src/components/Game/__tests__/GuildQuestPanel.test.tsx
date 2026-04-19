// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { GuildQuestPanel } from '../GuildQuestPanel';
import type { GraphNode } from '../../../types/graph';
import {
  GUILD_QUEST_RADIUS,
  QUEST_HOOK_COOLDOWN_TICKS,
  RUIN_MAGNITUDE_MINOR_MAX,
  RUIN_MAGNITUDE_MAJOR_MAX,
} from '../../../engine/ruins/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGraph() {
  return new WorldGraph();
}

function addSettlement(
  graph: WorldGraph,
  id = 'loc-settlement',
  col = 10,
  row = 10,
): GraphNode {
  const node: GraphNode = {
    id,
    type: 'location',
    name: 'Emberton',
    properties: { hexCol: col, hexRow: row },
  };
  graph.addNode(node);
  return node;
}

function addGuildHall(graph: WorldGraph, settlementId: string, subId = 'subloc-guild'): void {
  graph.addNode({
    id: subId,
    type: 'location',
    name: 'Guild Hall',
    properties: { sublocationTypeId: 'sublocation-type.faction-hall', factionDefId: 'adventuring_guild' },
  });
  graph.addEdge({ id: `edge-${subId}`, source: settlementId, target: subId, type: 'contains', properties: {} });
}

function addRuin(
  graph: WorldGraph,
  id: string,
  col: number,
  row: number,
  magnitude: number,
  postedTick?: number,
  templateId?: string,
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Ruin ${id}`,
    properties: {
      ruinMagnitude: magnitude,
      hexCol: col,
      hexRow: row,
      ...(postedTick != null ? { questHookPostedTick: postedTick } : {}),
      ...(templateId ? { questHookTemplateId: templateId } : {}),
    },
  });
}

function renderPanel(
  graph: WorldGraph,
  settlement: GraphNode,
  tick = 100,
  onNavigateToRuin = vi.fn(),
) {
  return render(
    <GuildQuestPanel
      location={settlement}
      graph={graph}
      tick={tick}
      onNavigateToRuin={onNavigateToRuin}
    />
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GuildQuestPanel', () => {
  // 1. Renders null when no Guild sublocation
  it('renders null when no Guild sublocation present', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph);
    // Add a non-guild sublocation
    graph.addNode({ id: 'subloc-market', type: 'location', name: 'Market', properties: { factionDefId: 'merchant_consortium' } });
    graph.addEdge({ id: 'edge-market', source: settlement.id, target: 'subloc-market', type: 'contains', properties: {} });

    const { container } = renderPanel(graph, settlement);
    expect(container.firstChild).toBeNull();
  });

  // 2. Renders empty state when Guild present but no ruins in radius
  it('renders empty state when Guild present but no ruins in radius', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph);
    addGuildHall(graph, settlement.id);
    // No ruin nodes at all

    renderPanel(graph, settlement);
    expect(screen.getByText(/notice board is quiet/i)).toBeTruthy();
  });

  // 3. Renders empty state when ruins exist outside radius
  it('renders empty state when all ruins are outside GUILD_QUEST_RADIUS', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph, 'loc-s', 10, 10);
    addGuildHall(graph, settlement.id);
    // Ruin far away — col=10+radius+5 to guarantee beyond radius
    addRuin(graph, 'ruin-far', 10 + GUILD_QUEST_RADIUS + 5, 10, 0.5, 50, 'ag.quest.ruin_delve');

    renderPanel(graph, settlement, 100);
    expect(screen.getByText(/notice board is quiet/i)).toBeTruthy();
  });

  // 4. Renders empty state when ruins exist in radius but hook is stale
  it('renders empty state when hook tick is outside cooldown window', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph, 'loc-s', 10, 10);
    addGuildHall(graph, settlement.id);
    // Posted at tick 0; current tick = QUEST_HOOK_COOLDOWN_TICKS (exactly expired)
    addRuin(graph, 'ruin-stale', 11, 10, 0.5, 0, 'ag.quest.ruin_delve');

    renderPanel(graph, settlement, QUEST_HOOK_COOLDOWN_TICKS);
    expect(screen.getByText(/notice board is quiet/i)).toBeTruthy();
  });

  // 5. Renders a Minor-tier row
  it('renders a Minor-tier row for magnitude <= RUIN_MAGNITUDE_MINOR_MAX', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph, 'loc-s', 10, 10);
    addGuildHall(graph, settlement.id);
    addRuin(graph, 'ruin-minor', 12, 10, RUIN_MAGNITUDE_MINOR_MAX, 50, 'ag.quest.ruin_delve');

    renderPanel(graph, settlement, 100);
    expect(screen.getByText('Minor')).toBeTruthy();
    expect(screen.getByText('Delve into Ruins')).toBeTruthy();
    expect(screen.getByText(/Ruin ruin-minor/)).toBeTruthy();
  });

  // 6. Renders a Saga-tier row
  it('renders a Saga-tier row for magnitude above RUIN_MAGNITUDE_MAJOR_MAX', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph, 'loc-s', 10, 10);
    addGuildHall(graph, settlement.id);
    addRuin(graph, 'ruin-saga', 12, 10, 0.8, 50, 'ag.elite.lost_city');

    renderPanel(graph, settlement, 100);
    expect(screen.getByText('Saga')).toBeTruthy();
    expect(screen.getByText('Expedition to Lost City')).toBeTruthy();
  });

  // 7. Sort order: Saga first, then Major, then Minor; within tier closer first
  it('sorts Saga > Major > Minor, then by ascending distance', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph, 'loc-s', 10, 10);
    addGuildHall(graph, settlement.id);
    // Minor at distance 2, Saga at distance 3, Major at distance 1
    addRuin(graph, 'ruin-minor', 10, 12, RUIN_MAGNITUDE_MINOR_MAX, 50, 'ag.quest.ruin_delve');
    addRuin(graph, 'ruin-saga',  10, 13, 0.8,                      50, 'ag.elite.lost_city');
    addRuin(graph, 'ruin-major', 10, 11, (RUIN_MAGNITUDE_MINOR_MAX + RUIN_MAGNITUDE_MAJOR_MAX) / 2, 50, 'ag.senior.deep_expedition');

    renderPanel(graph, settlement, 100);
    const badges = screen.getAllByText(/Saga|Major|Minor/);
    expect(badges[0].textContent).toBe('Saga');
    expect(badges[1].textContent).toBe('Major');
    expect(badges[2].textContent).toBe('Minor');
  });

  // 8. Row click calls onNavigateToRuin with correct ruinId
  it('calls onNavigateToRuin with ruin locationId on row click', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph, 'loc-s', 10, 10);
    addGuildHall(graph, settlement.id);
    addRuin(graph, 'ruin-click', 11, 10, 0.5, 50, 'ag.quest.ruin_delve');

    const onNavigate = vi.fn();
    renderPanel(graph, settlement, 100, onNavigate);

    fireEvent.click(screen.getByText('Delve into Ruins').closest('button')!);
    expect(onNavigate).toHaveBeenCalledWith('ruin-click');
  });

  // 9. Returns null when hexCol missing from settlement
  it('returns null when settlement has no hexCol', () => {
    const graph = makeGraph();
    const settlement: GraphNode = {
      id: 'loc-no-hex',
      type: 'location',
      name: 'No Hex Town',
      properties: {},  // missing hexCol/hexRow
    };
    graph.addNode(settlement);
    addGuildHall(graph, settlement.id);

    const { container } = renderPanel(graph, settlement);
    expect(container.firstChild).toBeNull();
  });

  // 10. Missing questHookTemplateId falls back to "Expedition contract"
  it('falls back to "Expedition contract" when templateId is missing from registry', () => {
    const graph = makeGraph();
    const settlement = addSettlement(graph, 'loc-s', 10, 10);
    addGuildHall(graph, settlement.id);
    // Use a non-existent templateId
    addRuin(graph, 'ruin-unknown', 11, 10, 0.5, 50, 'ag.quest.unknown_template_xyz');

    renderPanel(graph, settlement, 100);
    expect(screen.getByText('Expedition contract')).toBeTruthy();
  });
});
