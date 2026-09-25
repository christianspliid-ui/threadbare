// Throwaway reader: how alive is a fresh world. Read-only.
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import type { MapSizePreset } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getGroupKind } from '../../../../src/engine/groupShape';
import { getLocationNodes, isPlaceNode, resolveToParentLocation } from '../../../../src/engine/sublocationShape';
import { locationClassOf, placeClassOf } from '../../../../src/data/world-objects';
import type { GameState } from '../../../../src/types/gameState';
for (const seed of [42, 99]) {
resetEventCounter(); resetReputationTraitInit();
const pr = MAP_SIZE_PRESETS['medium'];
const { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows);
const g = state.graph; const byHome: Record<string, number> = {}; const lead: Record<string, number> = {};
for (const n of g.getNodesByType('actor').filter(n => n.properties.spotlightTier === 'spotlight')) {
  const e = g.getOutgoingEdges(n.id, 'located_at')[0]; const t = e ? resolveToParentLocation(g, g.getNode(e.target)) : undefined;
  const cls = t ? (locationClassOf(t.properties.locationSubtype as string) ?? 'other') + ':' + t.properties.locationSubtype : 'none';
  byHome[cls] = (byHome[cls] ?? 0) + 1;
  const caps = (n.properties.domainCapabilities ?? {}) as Record<string, number>; const top = Object.entries(caps).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';
  lead[top] = (lead[top] ?? 0) + 1;
}
console.log(seed, JSON.stringify(byHome), JSON.stringify(lead));
}
