import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
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

const ContentBrowser = lazy(() => import('./components/CMS/ContentBrowser'));

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
  if (viewParam === 'cms') return <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-muted)' }}>Loading Content Browser...</div>}><ContentBrowser /></Suspense>;

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
    <div className="h-screen flex overflow-hidden grain" style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-primary)' }}>
      <div
        className="w-80 flex-shrink-0 overflow-y-auto"
        style={{
          padding: 'var(--panel-padding)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <h1
          className="text-center tracking-wide"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            color: 'var(--text-primary)',
          }}
        >
          Fantasy World Simulator
        </h1>
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
          className="w-full py-3 rounded-lg font-semibold transition-all duration-300"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, #8b6914 100%)',
            color: 'var(--bg-abyss)',
            boxShadow: '0 4px 15px rgba(212, 160, 64, 0.25)',
            letterSpacing: '0.05em',
          }}
        >
          Shape Your Divinity
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--bg-abyss)' }}>
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
