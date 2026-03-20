/**
 * WebGL hex map renderer using React Three Fiber.
 * Procedural terrain mesh with texture atlas, elevation, directional lighting,
 * slight isometric camera tilt, and hex outlines.
 * Drop-in alternative to the SVG HexMap component.
 */
import { useRef, useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { HexTile, HexCoord } from '../../../types';
import { buildHexMeshGeometry, faceIndexToHex, HEX_OUTLINE_OPACITY, HEX_OUTLINE_COLOR } from './hexMeshGeometry';
import { loadTerrainAtlas } from './terrainAtlas';
import { createTerrainMaterial } from './terrainShader';
import { PropLayer } from './PropLayer';
import { WaterLayer } from './WaterLayer';
import { LocationLayer } from './LocationLayer';
import { CliffLayer } from './CliffLayer';
import { GodRayLayer } from './GodRayLayer';
import { ShorelineLayer } from './ShorelineLayer';
import { CloudShadowLayer } from './CloudShadowLayer';
import { HexTileLayer } from './HexTileLayer';
import { TiltShift } from './TiltShiftEffect';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import type { LocationSubtype } from '../../../types';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

const BG_COLOR = '#0a0a0c';

/** Camera tilt angle in degrees (0 = top-down, 90 = horizon) */
const CAMERA_TILT_DEG = 22;

/** Sun direction — position of directional light */
const SUN_DIRECTION = new THREE.Vector3(8, 6, -4);
const SUN_INTENSITY = 1.8;
const SUN_COLOR = new THREE.Color('#fff0d8');

/** Ambient light */
const AMBIENT_INTENSITY = 0.8;
const AMBIENT_COLOR = new THREE.Color('#b0b8d0');

/** Hemisphere light */
const HEMI_SKY_COLOR = '#90a8d0';
const HEMI_GROUND_COLOR = '#5a4828';
const HEMI_INTENSITY = 0.4;

// ── Props ───────────────────────────────────────────────────────────────────

interface WebGLHexMapProps {
  tiles: HexTile[];
  cols: number;
  rows: number;
  hexSize?: number;
  seed?: number;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
  locationOverlays?: Map<string, LocationSubtype>;
}

export interface WebGLHexMapHandle {
  centerOn: (x: number, y: number, scale?: number) => void;
}

// ── Selection ring overlay ──────────────────────────────────────────────────

function SelectionRing({ hex, color, tiles }: { hex: HexCoord | null; color: string; tiles: HexTile[] }) {
  if (!hex) return null;
  const px = hex.col * HEX_SCALE_X;
  const pz = hex.row * HEX_SCALE_Y + (hex.col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);
  const tile = tiles.find(t => t.coord.col === hex.col && t.coord.row === hex.row);
  const elev = tile ? tile.geoParams.elevation : 0;
  const y = elev * elev * 0.7 + 0.03;

  const ringGeo = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) {
      const angle = (Math.PI / 180) * (60 * (i % 6));
      points.push(new THREE.Vector3(0.92 * Math.cos(angle), 0, 0.92 * Math.sin(angle)));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <line geometry={ringGeo} position={[px, y, pz]}>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}

// ── Hover highlight ─────────────────────────────────────────────────────────

function HoverHighlight({ hex, tiles }: { hex: HexCoord | null; tiles: HexTile[] }) {
  if (!hex) return null;
  const px = hex.col * HEX_SCALE_X;
  const pz = hex.row * HEX_SCALE_Y + (hex.col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);
  const tile = tiles.find(t => t.coord.col === hex.col && t.coord.row === hex.row);
  const elev = tile ? tile.geoParams.elevation : 0;
  const y = elev * elev * 0.7 + 0.02;

  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      const x = 0.95 * Math.cos(angle);
      const z = 0.95 * Math.sin(angle);
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    }
    shape.closePath();
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  return (
    <mesh geometry={geo} position={[px, y, pz]}>
      <meshBasicMaterial color="#d4af37" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Hex mesh scene object ───────────────────────────────────────────────────

function HexMeshScene({
  tiles, cols, rows, seed,
  hoveredHex, selectedHex,
  onHexClick, onHexHover,
  locationOverlays,
}: WebGLHexMapProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [atlas, setAtlas] = useState<THREE.DataArrayTexture | null>(null);

  const { geometry, hexFaceRanges, outlineGeometry } = useMemo(
    () => buildHexMeshGeometry(tiles, cols, rows, 30, seed ?? 42),
    [tiles, cols, rows, seed],
  );

  // Load terrain atlas
  useEffect(() => {
    let cancelled = false;
    loadTerrainAtlas().then(tex => {
      if (!cancelled) setAtlas(tex);
    }).catch(err => {
      console.warn('[WebGLHexMap] Failed to load terrain atlas, using fallback:', err);
    });
    return () => { cancelled = true; };
  }, []);

  // Compute world bounds for edge fog
  const worldBounds = useMemo(() => ({
    minX: -HEX_SCALE_X,
    minZ: -HEX_SCALE_Y,
    maxX: (cols - 1) * HEX_SCALE_X + HEX_SCALE_X,
    maxZ: (rows - 1) * HEX_SCALE_Y + HEX_SCALE_Y,
  }), [cols, rows]);

  // Create custom shader material when atlas is available
  const terrainMaterial = useMemo(() => {
    if (!atlas) return null;
    return createTerrainMaterial(
      atlas,
      SUN_DIRECTION.clone(),
      SUN_COLOR.clone(),
      SUN_INTENSITY,
      AMBIENT_COLOR.clone(),
      AMBIENT_INTENSITY,
      worldBounds,
    );
  }, [atlas, worldBounds]);

  // Fallback material while atlas loads
  const fallbackMaterial = useMemo(() =>
    new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 8,
      specular: new THREE.Color('#1a1510'),
    }),
  []);

  const handlePointerMove = useCallback((e: THREE.Event & { faceIndex?: number }) => {
    if (e.faceIndex !== undefined && e.faceIndex !== null) {
      const coord = faceIndexToHex(e.faceIndex, hexFaceRanges);
      onHexHover(coord);
    } else {
      onHexHover(null);
    }
  }, [hexFaceRanges, onHexHover]);

  const handleClick = useCallback((e: THREE.Event & { faceIndex?: number }) => {
    if (e.faceIndex !== undefined && e.faceIndex !== null) {
      const coord = faceIndexToHex(e.faceIndex, hexFaceRanges);
      if (coord) onHexClick(coord);
    }
  }, [hexFaceRanges, onHexClick]);

  const handlePointerLeave = useCallback(() => {
    onHexHover(null);
  }, [onHexHover]);

  return (
    <>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={terrainMaterial ?? fallbackMaterial}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        onPointerLeave={handlePointerLeave}
      />
      <lineSegments geometry={outlineGeometry}>
        <lineBasicMaterial color={HEX_OUTLINE_COLOR} transparent opacity={HEX_OUTLINE_OPACITY} fog />
      </lineSegments>
      <HexTileLayer tiles={tiles} />
      <CliffLayer tiles={tiles} seed={seed ?? 42} />
      <WaterLayer tiles={tiles} />
      <ShorelineLayer tiles={tiles} />
      <PropLayer tiles={tiles} seed={seed ?? 42} />
      <LocationLayer tiles={tiles} locationOverlays={locationOverlays} />
      <GodRayLayer tiles={tiles} locationOverlays={locationOverlays} />
      <CloudShadowLayer worldWidth={cols * HEX_SCALE_X} worldHeight={rows * HEX_SCALE_Y} />
      <HoverHighlight hex={hoveredHex} tiles={tiles} />
      <SelectionRing hex={selectedHex} color="#d4af37" tiles={tiles} />
    </>
  );
}

// ── WASD keyboard panning ────────────────────────────────────────────────────

/** Pan speed in world units per second */
const PAN_SPEED = 12;

function WASDControls({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const keysDown = useRef(new Set<string>());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        keysDown.current.add(k);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const { camera } = useThree();

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || keysDown.current.size === 0) return;

    const speed = PAN_SPEED * delta / (camera as THREE.OrthographicCamera).zoom * 40;
    let dx = 0;
    let dz = 0;

    if (keysDown.current.has('a')) dx -= speed;
    if (keysDown.current.has('d')) dx += speed;
    if (keysDown.current.has('w')) dz -= speed;
    if (keysDown.current.has('s')) dz += speed;

    controls.target.x += dx;
    controls.target.z += dz;
    camera.position.x += dx;
    camera.position.z += dz;
    controls.update();
  });

  return null;
}

// ── Main component ──────────────────────────────────────────────────────────

export const WebGLHexMap = forwardRef<WebGLHexMapHandle, WebGLHexMapProps>(({
  tiles, cols, rows, hexSize = 30, seed,
  hoveredHex, selectedHex,
  onHexClick, onHexHover,
  locationOverlays,
}, ref) => {
  const controlsRef = useRef<any>(null);

  const worldWidth = cols * HEX_SCALE_X + 2;
  const worldHeight = rows * HEX_SCALE_Y + 2;

  // Camera position: tilted slightly from the south
  const tiltRad = (CAMERA_TILT_DEG * Math.PI) / 180;
  const camDist = 50;
  const camX = worldWidth / 2;
  const camY = camDist * Math.cos(tiltRad);
  const camZ = worldHeight / 2 + camDist * Math.sin(tiltRad);

  useImperativeHandle(ref, () => ({
    centerOn: (x: number, y: number, scale?: number) => {
      const wx = x / hexSize * HEX_SCALE_X / HEX_SCALE_X;
      const wz = y / hexSize;
      if (controlsRef.current) {
        controlsRef.current.target.set(wx, 0, wz);
        controlsRef.current.update();
      }
    },
  }), [hexSize]);

  return (
    <div style={{ width: '100%', height: '100%', background: BG_COLOR }}>
      <Canvas
        orthographic
        camera={{
          position: [camX, camY, camZ],
          zoom: 40,
          near: 0.1,
          far: 200,
          up: [0, 1, 0],
        }}
        flat
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(BG_COLOR);
          camera.lookAt(worldWidth / 2, 0, worldHeight / 2);
          camera.updateProjectionMatrix();
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Scene fog for non-shader objects (props, water, locations).
            Distance-based from camera — tuned so edges fade similarly to terrain shader fog. */}
        <fog attach="fog" args={[BG_COLOR, 60, 120]} />

        {/* Lighting for fallback material (custom shader handles its own) */}
        <ambientLight intensity={AMBIENT_INTENSITY} color={AMBIENT_COLOR} />
        <directionalLight
          position={[SUN_DIRECTION.x, SUN_DIRECTION.y, SUN_DIRECTION.z]}
          intensity={SUN_INTENSITY}
          color={SUN_COLOR}
        />
        <hemisphereLight args={[HEMI_SKY_COLOR, HEMI_GROUND_COLOR, HEMI_INTENSITY]} />

        <HexMeshScene
          tiles={tiles}
          cols={cols}
          rows={rows}
          hexSize={hexSize}
          seed={seed}
          hoveredHex={hoveredHex}
          selectedHex={selectedHex}
          onHexClick={onHexClick}
          onHexHover={onHexHover}
          locationOverlays={locationOverlays}
        />
        <MapControls
          ref={controlsRef}
          enableRotate
          enableDamping
          dampingFactor={0.1}
          minZoom={10}
          maxZoom={300}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          screenSpacePanning
          makeDefault
          target={[worldWidth / 2, 0, worldHeight / 2]}
        />
        <WASDControls controlsRef={controlsRef} />
        <EffectComposer>
          <TiltShift />
        </EffectComposer>
      </Canvas>
    </div>
  );
});

WebGLHexMap.displayName = 'WebGLHexMap';
