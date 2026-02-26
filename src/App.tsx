import { useState, useCallback, useMemo } from 'react';
import type { CosmologyProfile, HexCoord, HexTile, ForceName, OverlayMode } from './types';
import { FORCE_NAMES } from './types';
import { createBalancedCosmology } from './engine/cosmology';
import { generateWorld } from './engine/hexGrid';
import { HexMap } from './components/HexMap/HexMap';
import { CosmologyPanel } from './components/Cosmology/CosmologyPanel';
import { InfoPanel } from './components/UI/InfoPanel';

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 15;

function App() {
  const [cosmology, setCosmology] = useState<CosmologyProfile>(createBalancedCosmology());
  const [seed, setSeed] = useState(42);
  const [tiles, setTiles] = useState<HexTile[]>(() =>
    generateWorld(createBalancedCosmology(), DEFAULT_COLS, DEFAULT_ROWS, 42)
  );
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [selectedForce, setSelectedForce] = useState<ForceName | null>(null);

  const handleGenerate = useCallback(() => {
    setTiles(generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, seed));
    setSelectedHex(null);
    setHoveredHex(null);
  }, [cosmology, seed]);

  const hoveredTile = useMemo(() => {
    if (!hoveredHex) return null;
    return tiles.find(t => t.coord.col === hoveredHex.col && t.coord.row === hoveredHex.row) ?? null;
  }, [tiles, hoveredHex]);

  const selectedTile = useMemo(() => {
    if (!selectedHex) return null;
    return tiles.find(t => t.coord.col === selectedHex.col && t.coord.row === selectedHex.row) ?? null;
  }, [tiles, selectedHex]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-gray-800">
        <h1 className="text-xl font-bold tracking-wide text-center">✧ Fantasy World Simulator ✧</h1>
        <CosmologyPanel
          cosmology={cosmology} seed={seed}
          onCosmologyChange={setCosmology} onSeedChange={setSeed} onGenerate={handleGenerate}
        />
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Force Overlay</h3>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setOverlayMode('none')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                overlayMode === 'none' ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}>Off</button>
            {FORCE_NAMES.map(force => (
              <button key={force}
                onClick={() => { setOverlayMode('single'); setSelectedForce(force); }}
                className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${
                  overlayMode === 'single' && selectedForce === force
                    ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                }`}>{force}</button>
            ))}
          </div>
        </div>
        <InfoPanel tile={selectedTile ?? hoveredTile} />
      </div>
      <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <HexMap
          tiles={tiles} cols={DEFAULT_COLS} rows={DEFAULT_ROWS}
          hoveredHex={hoveredHex} selectedHex={selectedHex}
          overlayMode={overlayMode} selectedForce={selectedForce}
          onHexClick={setSelectedHex} onHexHover={setHoveredHex}
        />
      </div>
    </div>
  );
}

export default App;
