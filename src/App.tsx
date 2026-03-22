import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import type { CosmologyProfile, HexCoord, HexTile } from './types';
import type { AscendantArchetype } from './types/influence';
import { createBalancedCosmology } from './engine/cosmology';
import { generateWorld } from './engine/hexGrid';
import { generateArchetypes } from './engine/ascendant';
import HexMapV2 from './components/HexMapV2/HexMapV2';
import { CosmologyPanel } from './components/Cosmology/CosmologyPanel';
import { InfoPanel } from './components/UI/InfoPanel';
import { AscendantSelection } from './components/Ascendant/AscendantSelection';
import { GameView } from './components/Game/GameView';
import { MagicGlowTiles } from './components/UI/MagicGlowTiles';
import { HexV2View } from './components/HexMapV2/HexV2View';

const ContentBrowser = lazy(() => import('./components/CMS/ContentBrowser'));

// V2 renderer grid dimensions: 80×120 = 9.6K hexes (dev scale — fast load)
// Production: 200×300 = 60K hexes (full world scale)
const HEXV2_COLS = 80;
const HEXV2_ROWS = 120;

type GamePhase =
  | { phase: 'worldgen' }
  | { phase: 'selection' }
  | { phase: 'playing'; archetype: AscendantArchetype; avatarName: string };

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 15;

/** Pick a random archetype and avatar name for dev quick-start. */
function quickStartPhase(seed: number): GamePhase {
  const archetypes = generateArchetypes(4, seed);
  const archetype = archetypes[seed % archetypes.length];
  const avatarName = 'The Dev Oracle';
  return { phase: 'playing', archetype, avatarName };
}

function App() {
  // Dev views via URL param: ?view=glow | ?view=cms | ?view=game
  const viewParam = new URLSearchParams(window.location.search).get('view');
  if (viewParam === 'glow') return <MagicGlowTiles />;
  if (viewParam === 'cms') return <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-muted)' }}>Loading Content Browser...</div>}><ContentBrowser /></Suspense>;
  // Three.js renderer V2 — 60K hex grid at full world scale
  if (viewParam === 'hexv2') {
    const hexv2Result = generateWorld(createBalancedCosmology(), HEXV2_COLS, HEXV2_ROWS, 42);
    return (
      <HexV2View
        tiles={hexv2Result.tiles}
        cols={HEXV2_COLS}
        rows={HEXV2_ROWS}
        seed={42}
        riverPaths={hexv2Result.riverPaths}
        lakeIds={hexv2Result.lakeIds}
      />
    );
  }

  const [gamePhase, setGamePhase] = useState<GamePhase>(() =>
    viewParam === 'game' ? quickStartPhase(42) : { phase: 'worldgen' }
  );
  const [cosmology, setCosmology] = useState<CosmologyProfile>(createBalancedCosmology());
  const [seed, setSeed] = useState(42);
  const [tiles, setTiles] = useState<HexTile[]>(() =>
    generateWorld(createBalancedCosmology(), DEFAULT_COLS, DEFAULT_ROWS, 42).tiles
  );
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);

  const handleGenerate = useCallback(() => {
    setTiles(generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, seed).tiles);
    setSelectedHex(null);
    setHoveredHex(null);
  }, [cosmology, seed]);

  const handleProceedToSelection = useCallback(() => {
    // Ensure world is generated with current settings before moving on
    setTiles(generateWorld(cosmology, DEFAULT_COLS, DEFAULT_ROWS, seed).tiles);
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
        <HexMapV2
          tiles={tiles}
          cols={DEFAULT_COLS}
          rows={DEFAULT_ROWS}
          hoveredHex={hoveredHex}
          selectedHex={selectedHex}
          onHexClick={setSelectedHex}
          onHexHover={setHoveredHex}
        />
      </div>
    </div>
  );
}

export default App;
