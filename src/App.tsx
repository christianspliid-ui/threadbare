import { useState, useCallback, useMemo } from 'react';
import type { CosmologyProfile, HexCoord, HexTile, OverlayMode } from './types';
import type { AscendantArchetype } from './types/influence';
import { createBalancedCosmology } from './engine/cosmology';
import { generateWorld } from './engine/hexGrid';
import { HexMap } from './components/HexMap/HexMap';
import { CosmologyPanel } from './components/Cosmology/CosmologyPanel';
import { InfoPanel } from './components/UI/InfoPanel';
import { AscendantSelection } from './components/Ascendant/AscendantSelection';
import { GameView } from './components/Game/GameView';
import { MagicGlowTiles } from './components/UI/MagicGlowTiles';

type GamePhase =
  | { phase: 'worldgen' }
  | { phase: 'selection' }
  | { phase: 'playing'; archetype: AscendantArchetype; avatarName: string };

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 15;

function App() {
  // Dev views via URL param: ?view=glow
  const viewParam = new URLSearchParams(window.location.search).get('view');
  if (viewParam === 'glow') return <MagicGlowTiles />;

  const [gamePhase, setGamePhase] = useState<GamePhase>({ phase: 'worldgen' });
  const [cosmology, setCosmology] = useState<CosmologyProfile>(createBalancedCosmology());
  const [seed, setSeed] = useState(42);
  const [tiles, setTiles] = useState<HexTile[]>(() =>
    generateWorld(createBalancedCosmology(), DEFAULT_COLS, DEFAULT_ROWS, 42)
  );
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');

  const handleGenerate = useCallback(() => {
    setTiles(generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, seed));
    setSelectedHex(null);
    setHoveredHex(null);
  }, [cosmology, seed]);

  const handleProceedToSelection = useCallback(() => {
    // Ensure world is generated with current settings before moving on
    setTiles(generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, seed));
    setGamePhase({ phase: 'selection' });
  }, [cosmology, seed]);

  const handleSelectArchetype = useCallback((archetype: AscendantArchetype, avatarName: string) => {
    setGamePhase({ phase: 'playing', archetype, avatarName });
  }, []);

  const hoveredTile = useMemo(() => {
    if (!hoveredHex) return null;
    return tiles.find(t => t.coord.col === hoveredHex.col && t.coord.row === hoveredHex.row) ?? null;
  }, [tiles, hoveredHex]);

  const selectedTile = useMemo(() => {
    if (!selectedHex) return null;
    return tiles.find(t => t.coord.col === selectedHex.col && t.coord.row === selectedHex.row) ?? null;
  }, [tiles, selectedHex]);

  // ── Ascendant selection screen ──
  if (gamePhase.phase === 'selection') {
    return <AscendantSelection seed={seed} onSelect={handleSelectArchetype} />;
  }

  // ── Game view (playing) ──
  if (gamePhase.phase === 'playing') {
    return (
      <GameView
        archetype={gamePhase.archetype}
        avatarName={gamePhase.avatarName}
        cosmology={cosmology}
        seed={seed}
      />
    );
  }

  // ── World generation screen (default) ──
  return (
    <div className="min-h-screen bg-amber-50 text-amber-950 flex">
      <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-amber-200 bg-stone-800">
        <h1 className="text-xl font-bold tracking-wide text-center text-amber-100">✧ Fantasy World Simulator ✧</h1>
        <CosmologyPanel
          cosmology={cosmology}
          seed={seed}
          onCosmologyChange={setCosmology}
          onSeedChange={setSeed}
          onGenerate={handleGenerate}
        />
        <InfoPanel tile={selectedTile ?? hoveredTile} />

        {/* Proceed to ascendant selection */}
        <button
          onClick={handleProceedToSelection}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300"
          style={{
            fontFamily: 'Cinzel, serif',
            background: 'linear-gradient(135deg, #b8860b 0%, #8b6914 100%)',
            color: '#fef3c7',
            boxShadow: '0 4px 15px rgba(184, 134, 11, 0.3)',
          }}
        >
          ✧ Shape Your Divinity ✧
        </button>
      </div>
      <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
        <HexMap
          tiles={tiles}
          cols={DEFAULT_COLS}
          rows={DEFAULT_ROWS}
          hoveredHex={hoveredHex}
          selectedHex={selectedHex}
          overlayMode={overlayMode}
          onHexClick={setSelectedHex}
          onHexHover={setHoveredHex}
        />
      </div>
    </div>
  );
}

export default App;
