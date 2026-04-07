import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import type { CosmologyProfile, HexCoord, HexTile } from './types';
import type { AscendantArchetype } from './types/influence';
import type { AscendantIdentity } from './types/remembrance';
import { createBalancedCosmology } from './engine/cosmology';
import { generateWorld } from './engine/hexGrid';
import { generateArchetypes } from './engine/ascendant';
import { MAP_SIZE_PRESETS, DEFAULT_MAP_SIZE, DEV_ASCENDANT_IDENTITY } from './engine/gameInit';
import type { MapSizePreset } from './engine/gameInit';
import { deriveCosmologyFromIdentity, deriveMapSize } from './engine/remembrance';
import HexMapV2 from './components/HexMapV2/HexMapV2';
import { CosmologyPanel } from './components/Cosmology/CosmologyPanel';
import { InfoPanel } from './components/UI/InfoPanel';
import { AscendantSelection } from './components/Ascendant/AscendantSelection';
import { GameView } from './components/Game/GameView';
import { MagicGlowTiles } from './components/UI/MagicGlowTiles';
import { HexV2View } from './components/HexMapV2/HexV2View';
import { StartPage } from './components/StartPage/StartPage';
import { RemembranceFlow } from './components/Remembrance/RemembranceFlow';

const ContentBrowser = lazy(() => import('./components/CMS/ContentBrowser'));
const Codex = lazy(() => import('./components/Codex/Codex'));

// V2 renderer grid dimensions: 80×120 = 9.6K hexes (dev scale — fast load)
// Production: 200×300 = 60K hexes (full world scale)
const HEXV2_COLS = 80;
const HEXV2_ROWS = 120;

type GamePhase =
  | { phase: 'start' }
  | { phase: 'worldgen' }
  | { phase: 'selection' }
  | { phase: 'remembrance' }
  | { phase: 'playing'; archetype: AscendantArchetype; avatarName: string }
  | { phase: 'playing-remembrance'; identity: AscendantIdentity };

/** Parse ?size= URL param into a valid MapSizePreset, falling back to default. */
function parseMapSizeParam(): MapSizePreset {
  const param = new URLSearchParams(window.location.search).get('size');
  if (param && param in MAP_SIZE_PRESETS) return param as MapSizePreset;
  return DEFAULT_MAP_SIZE;
}

/** Pick a random archetype and avatar name for dev quick-start. */
function quickStartPhase(seed: number): GamePhase {
  const seeded = new URLSearchParams(window.location.search).has('seeded');
  if (seeded) {
    // Full identity path — ascendant + The First pre-seeded
    return { phase: 'playing-remembrance', identity: DEV_ASCENDANT_IDENTITY };
  }
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
  if (viewParam === 'codex') return <Suspense fallback={<div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-muted)' }}>Loading Codex...</div>}><Codex /></Suspense>;
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
    viewParam === 'game' ? quickStartPhase(42) : { phase: 'start' }
  );
  const [cosmology, setCosmology] = useState<CosmologyProfile>(createBalancedCosmology());
  const [seed, setSeed] = useState(42);
  const [mapSize, setMapSize] = useState<MapSizePreset>(parseMapSizeParam);
  const previewSize = MAP_SIZE_PRESETS[mapSize];
  const [tiles, setTiles] = useState<HexTile[]>(() =>
    generateWorld(createBalancedCosmology(), previewSize.cols, previewSize.rows, 42).tiles
  );
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);

  const handleGenerate = useCallback(() => {
    const sz = MAP_SIZE_PRESETS[mapSize];
    setTiles(generateWorld(cosmology, sz.cols, sz.rows, seed).tiles);
    setSelectedHex(null);
    setHoveredHex(null);
  }, [cosmology, seed, mapSize]);

  const handleProceedToSelection = useCallback(() => {
    const sz = MAP_SIZE_PRESETS[mapSize];
    setTiles(generateWorld(cosmology, sz.cols, sz.rows, seed).tiles);
    setGamePhase({ phase: 'selection' });
  }, [cosmology, seed, mapSize]);

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

  // ── Start screen (default entry point) ──
  if (gamePhase.phase === 'start') {
    return (
      <StartPage
        onNewWorld={() => setGamePhase({ phase: 'remembrance' })}
        onAdvancedNewWorld={() => setGamePhase({ phase: 'worldgen' })}
      />
    );
  }

  // ── Remembrance flow (new world creation) ──
  if (gamePhase.phase === 'remembrance') {
    return (
      <RemembranceFlow
        seed={seed}
        onComplete={(identity) => {
          setGamePhase({ phase: 'playing-remembrance', identity });
        }}
      />
    );
  }

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
        mapSize={mapSize}
      />
    );
  }

  // ── Game view (playing via remembrance flow) ──
  if (gamePhase.phase === 'playing-remembrance') {
    const compat: AscendantArchetype = {
      id: gamePhase.identity.hungerId,
      name: gamePhase.identity.divineName,
      title: gamePhase.identity.divineName,
      description: gamePhase.identity.mandateDirection,
      sphereAlignment: gamePhase.identity.sphereAlignment,
      startingDomainAffinities: gamePhase.identity.domainAffinities,
      personalitySeed: gamePhase.identity.personalitySeed,
      flavorText: gamePhase.identity.mandateDirection,
    };

    const derivedCosmology = deriveCosmologyFromIdentity({
      sphereAlignment: gamePhase.identity.sphereAlignment,
      mortalTags: gamePhase.identity.mortalTags,
      hungerId: gamePhase.identity.hungerId,
    });

    const isDevSeeded = viewParam === 'game' && new URLSearchParams(window.location.search).has('seeded');

    return (
      <GameView
        archetype={compat}
        avatarName={gamePhase.identity.mortalName}
        cosmology={derivedCosmology}
        seed={seed}
        mapSize={deriveMapSize(gamePhase.identity.hungerId)}
        ascendantIdentity={gamePhase.identity}
        preSeeded={isDevSeeded}
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

        {/* Map size preset selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Realm Size
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {(Object.keys(MAP_SIZE_PRESETS) as MapSizePreset[]).map((key) => {
              const preset = MAP_SIZE_PRESETS[key];
              const isActive = key === mapSize;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setMapSize(key);
                    const sz = MAP_SIZE_PRESETS[key];
                    setTiles(generateWorld(cosmology, sz.cols, sz.rows, seed).tiles);
                    setSelectedHex(null);
                    setHoveredHex(null);
                  }}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    background: isActive ? 'rgba(212, 160, 64, 0.12)' : 'transparent',
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{preset.label}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>
                    {preset.cols}&times;{preset.rows} &mdash; {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
          cols={previewSize.cols}
          rows={previewSize.rows}
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
