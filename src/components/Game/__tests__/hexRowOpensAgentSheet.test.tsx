// @vitest-environment jsdom
/**
 * THR-1705 — a mortal's row in the hex panel opens that mortal, and the hand
 * says who it will hit.
 *
 * Cold playtest round 2: three of three testers clicked a name in a hex's people
 * list and saw only a highlight. The click had run `handleAgentSelect`, which moves
 * the cast target and opens the drawer but sets no thread node, so the right panel
 * never changed. One tester then cast with The First on screen, and the spell
 * landed on the mortal clicked minutes earlier — the drawer never named its target.
 *
 * The harness composes the real hook, the real `HexDetailView`, and the real
 * `ActionDrawer`, wired the way `GameView` wires them. `GameView` itself boots the
 * world, so its wiring is asserted against the source, as THR-1500 did.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import { HexDetailView } from '../HexDetailView';
import { ActionDrawer } from '../ActionDrawer';
import { WorldGraph } from '../../../engine/graph';
import { generateArchetypes } from '../../../engine/ascendant';
import { SPHERE_NAMES } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';
import type { HexTile } from '../../../types';
import type { WheelSlot } from '../../../engine/wheel';

const COORD = { col: 3, row: 4 };
const ASCENDANT_ID = 'ascendant-1';
const STRANGER_ID = 'ind_thessa';
const STRANGER_NAME = 'Thessa';

const ARCHETYPE = generateArchetypes(1, 42)[0];
const ESSENCE: EssencePool = Object.fromEntries(SPHERE_NAMES.map(s => [s, 40])) as EssencePool;

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASCENDANT_ID, type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
  // Not threaded and not in the retinue — the stranger case the defect hit.
  graph.addNode({
    id: STRANGER_ID,
    type: 'actor',
    name: STRANGER_NAME,
    properties: { actorType: 'individual', hexCol: COORD.col, hexRow: COORD.row },
  } as never);
  return {
    graph,
    tick: 60,
    seed: 42,
    ascendantId: ASCENDANT_ID,
    essencePool: ESSENCE,
    familiarityMap: new Map(),
    agentKnowledge: new Map(),
    unifiedActions: [],
    encounterProgress: [],
    premonitionQueue: [],
    chapterArchive: [],
  } as unknown as GameState;
}

const TILE = { coord: COORD, terrain: 'plains', geoParams: { elevation: 0.1, temperature: 0.5, moisture: 0.5 } } as unknown as HexTile;

const SLOTS: WheelSlot[] = [{
  id: 'gaze', label: 'Piercing Gaze', type: 'target_action', angleDeg: 0, available: true, lockedReason: null,
  essenceCost: 1, sphere: 'mind', interventionType: null, rangeStatus: 'in_range', hexDistance: null,
  description: '', effectsLine: 'Reads a mortal.', crudType: 'read', reach: 'veil', scale: 'local',
  scaleWord: 'Local', forecastTier: 'uncertain', templateId: 'gaze',
} as unknown as WheelSlot];

type Api = ReturnType<typeof useAgentInteraction>;

/** `GameView`'s right panel and drawer, reduced to the gates this defect lives in. */
function Harness({ state, onWire }: { state: GameState; onWire: (api: Api) => void }) {
  const api = useAgentInteraction({
    gameState: state,
    setGameState: () => undefined,
    archetype: ARCHETYPE,
    onOpenScry: () => undefined,
    omniscienceMode: true,
  });
  onWire(api);
  const selected = api.selectedAgentId;
  return (
    <>
      {api.selectedThreadNode && <div data-testid="thread-detail">{api.selectedThreadNode.nodeId}</div>}
      {api.selectedHexCoord && !api.selectedThreadNode && (
        <HexDetailView
          coord={api.selectedHexCoord}
          tile={TILE}
          onClose={api.handleHexDetailClose}
          onGoToChronicle={() => undefined}
          graph={state.graph}
          onAgentClick={(agentId) => api.handleThreadNodeSelect(agentId, 'agent')}
        />
      )}
      {api.drawerOpen && selected && (
        <ActionDrawer
          open
          slots={SLOTS}
          targetName={state.graph.getNode(selected)?.name ?? ''}
          targetLabel=""
          onSlotClick={() => undefined}
          onClose={() => undefined}
        />
      )}
    </>
  );
}

describe('THR-1705 — a hex-panel row opens its mortal and the hand names them', () => {
  it('a row click opens the mortal and the drawer says who it will hit', () => {
    let api!: Api;
    render(<Harness state={makeState()} onWire={(a) => { api = a; }} />);
    act(() => api.handleHexSelect(COORD));

    fireEvent.click(screen.getByText(STRANGER_NAME));

    expect(api.selectedThreadNode).toEqual({ nodeId: STRANGER_ID, category: 'agent' });
    expect(screen.getByTestId('thread-detail').textContent).toBe(STRANGER_ID);
    expect(api.selectedAgentId).toBe(STRANGER_ID);
    expect(screen.getByTestId('action-drawer-target').textContent).toBe(`Casting on ${STRANGER_NAME}`);
  });

  it('GameView wires the hex panel row to the thread-node opener, not the bare select', () => {
    const source = readFileSync(resolve(__dirname, '..', 'GameView.tsx'), 'utf8');
    const block = source.match(/<HexDetailView[\s\S]*?\/>/)?.[0] ?? '';
    expect(block).toContain("onAgentClick={(agentId) => handleThreadNodeSelect(agentId, 'agent')}");
    expect(block).not.toMatch(/onAgentClick=\{handleAgentSelect\}/);
  });

  it('GameView names a stranger in the drawer, not only a retinue member', () => {
    const source = readFileSync(resolve(__dirname, '..', 'GameView.tsx'), 'utf8');
    expect(source).toContain('targetName={selectedRetinueAgent?.name ?? gameState.graph.getNode(selectedAgentId)?.name ??');
  });
});
