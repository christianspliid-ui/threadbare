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
resetEventCounter(); resetReputationTraitInit();
const rt = createSimulationRuntime(); const pr = MAP_SIZE_PRESETS['medium'];
let { state } = initializeGameState(generateArchetypes(4, 42)[0], 'C', createBalancedCosmology(), 42, pr.cols, pr.rows);
for (let i = 0; i < 20; i++) state = runTick(state, [], rt);
const u = getLocationNodes(state.graph).filter(n => !n.properties.locationSubtype);
const m: Record<string, number> = {};
for (const n of u) { const k = Object.keys(n.properties).sort().slice(0,12).join(','); m[n.id.replace(/[0-9]+/g,'#') + ' :: ' + k] = (m[n.id.replace(/[0-9]+/g,'#') + ' :: ' + k] ?? 0) + 1; }
console.log(u.length, JSON.stringify(m, null, 1)); console.log(JSON.stringify(u[0]?.properties).slice(0, 600));
