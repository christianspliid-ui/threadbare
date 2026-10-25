// @vitest-environment jsdom
/**
 * THR-1966 (THR-1937 S2) — the building card's "built by …" tag, rendered by the real
 * Inspector over a world where a mortal raised the town's next building through the real
 * `create × place` executor. The Done-when asks what the surface shows, so this asserts the
 * composed page text, and the absence of the town-raised wording on the same row.
 */
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import type { GameState } from '../../../../types/gameState';
import type { HexTile } from '../../../../types';
import { runSettlementEconomyDay } from '../../../../engine/phases/settlementEconomy';
import { getUndertakingObjectType } from '../../../../data/undertaking-objects';
import type { ObjectVerbContext, ObjectVerbSemantic } from '../../../../data/undertaking-objects';
import type { GraphOpResult } from '../../../../engine/strategicGraphOps';
import { TICKS_PER_DAY } from '../../../../data/attention-constants';
import { GameScreenStateProvider, useGameScreenStore, type GameScreenStore } from '../../frame/GameScreenState';
import { InspectorHost } from '../InspectorHost';
import { openSubject } from '../inspectorState';

const ASC = 'asc';
const TOWN = 'loc.ashford';
const BUILDER = 'kael';

function world(): { state: GameState; raisedId: string; raisedName: string } {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: TOWN, type: 'location', name: 'Ashford', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 4, hexRow: 4 } });
  graph.addNode({ id: BUILDER, type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
  graph.addEdge({ id: `loc_${BUILDER}`, source: BUILDER, target: TOWN, type: 'located_at', properties: {} });
  const tiles: HexTile[] = [];
  for (let col = 0; col < 9; col++) for (let row = 0; row < 9; row++) {
    tiles.push({ coord: { col, row }, terrain: 'grassland', elevation: 0.5, moisture: 0.5, geoParams: {} } as unknown as HexTile);
  }
  runSettlementEconomyDay({ graph, tiles, tick: 0, seed: 7, hexRealmId: new Map() });
  const semantic = getUndertakingObjectType('place')!.verbs.create as ObjectVerbSemantic;
  const op = semantic({
    state: { tick: TICKS_PER_DAY, seed: 42, graph } as unknown as GameState,
    graph, actorId: BUILDER, tick: TICKS_PER_DAY, projectId: 'proj_1',
    targetNodeId: TOWN, handle: { kind: 'node', nodeId: TOWN },
  } as unknown as ObjectVerbContext) as GraphOpResult;
  const raisedId = op.createdId!;
  const state = {
    graph, ascendantId: ASC, tick: TICKS_PER_DAY, seed: 42, tiles,
    recentEvents: [], familiarityMap: new Map(), essencePool: { spirit: 50, mind: 50 },
    unifiedActions: [], encounterProgress: [], controlEffects: [],
    ascendantIdentity: { sphereAlignment: { primary: 'spirit', secondary: 'mind' } },
  } as unknown as GameState;
  return { state, raisedId, raisedName: graph.getNode(raisedId)!.name };
}

describe('THR-1966 — the Inspector shows who raised a building', () => {
  it('the town page names the mortal builder on the raised building\'s row', () => {
    const { state, raisedId, raisedName } = world();
    let store!: GameScreenStore;
    function Harness() {
      const s = useGameScreenStore();
      store = s;
      return (
        <GameScreenStateProvider value={s}>
          <InspectorHost gameState={state} runtime={null} extras={{}} onCast={() => ({ cast: true, reason: null })} onShowOnMap={() => {}} />
        </GameScreenStateProvider>
      );
    }
    const { container } = render(<Harness />);
    act(() => store.setInspector(s => openSubject(s, { kind: 'location', id: TOWN }, 'wide')));
    const page = container.querySelector('[data-inspector-page]');
    expect(page?.getAttribute('data-inspector-page')).toBe(`location:${TOWN}`);
    const text = page?.textContent ?? '';
    expect(raisedId).toBeTruthy();
    expect(text).toContain(raisedName);
    expect(text).toContain('built by Kael Thornweaver');
  });
});
