/**
 * WebGL hex map renderer using React Three Fiber.
 * KayKit GLTF hex tiles with perspective camera, shadow maps,
 * ambient occlusion, and post-processing for a miniature diorama look.
 *
 * Inspired by Felix Turner's hex-map-wfc rendering pipeline.
 */
import { useRef, useMemo, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { EffectComposer, N8AO, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { HexTile, HexCoord } from '../../../types';
import { buildHexMeshGeometry, faceIndexToHex } from './hexMeshGeometry';
import { PropLayer } from './PropLayer';
import { WaterLayer } from './WaterLayer';
import { LocationLayer } from './LocationLayer';
import { GodRayLayer } from './GodRayLayer';
import { HexTileLayer } from './HexTileLayer';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import type { LocationSubtype } from '../../../types';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Background color — soft blue-grey sky (matches Felix Turner's scene BG) */
const BG_COLOR = '#98a4bb';

/** Camera FOV — narrow lens for miniature/tilt-shift feel */
const CAMERA_FOV = 20;

/** Camera initial distance from target */
const CAMERA_DISTANCE = 100;

/** Camera initial tilt angle in degrees (0 = top-down, 90 = horizon) */
const CAMERA_TILT_DEG = 35;

/** Sun direction — position of directional light */
const SUN_POSITION = new THREE.Vector3(50, 100, 50);
const SUN_INTENSITY = 2.0;
const SUN_COLOR = new THREE.Color('#fff0d8');

/** Ambient light */
const AMBIENT_INTENSITY = 0.6;
const AMBIENT_COLOR = new THREE.Color('#b0b8d0');

/** Hemisphere light */
const HEMI_SKY_COLOR = '#90a8d0';
const HEMI_GROUND_COLOR = '#5a4828';
const HEMI_INTENSITY = 0.3;

/** Shadow map size */
const SHADOW_MAP_SIZE = 2048;

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
  const y = elev * elev * 0.7 + 0.08;

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
  const y = elev * elev * 0.7 + 0.07;

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

// ── Invisible raycast mesh (procedural terrain for click/hover detection) ───

function RaycastMesh({
  tiles, cols, rows, seed,
  onHexClick, onHexHover,
}: {
  tiles: HexTile[];
  cols: number;
  rows: number;
  seed?: number;
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
}) {
  const { geometry, hexFaceRanges } = useMemo(
    () => buildHexMeshGeometry(tiles, cols, rows, 30, seed ?? 42),
    [tiles, cols, rows, seed],
  );

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

  // Invisible material — only used for raycasting, not rendered
  const invisibleMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide,
    }),
  []);

  return (
    <mesh
      geometry={geometry}
      material={invisibleMaterial}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onPointerLeave={handlePointerLeave}
    />
  );
}

// ── Scene contents ──────────────────────────────────────────────────────────

function HexMeshScene({
  tiles, cols, rows, seed,
  hoveredHex, selectedHex,
  onHexClick, onHexHover,
  locationOverlays,
}: WebGLHexMapProps) {
  return (
    <>
      {/* Invisible raycast surface for click/hover detection */}
      <RaycastMesh
        tiles={tiles}
        cols={cols}
        rows={rows}
        seed={seed}
        onHexClick={onHexClick}
        onHexHover={onHexHover}
      />
      {/* GLTF hex tile terrain */}
      <HexTileLayer tiles={tiles} />
      {/* Water */}
      <WaterLayer tiles={tiles} />
      {/* Decorations and overlays */}
      <PropLayer tiles={tiles} seed={seed ?? 42} />
      <LocationLayer tiles={tiles} locationOverlays={locationOverlays} />
      <GodRayLayer tiles={tiles} locationOverlays={locationOverlays} />
      {/* Selection indicators */}
      <HoverHighlight hex={hoveredHex} tiles={tiles} />
      <SelectionRing hex={selectedHex} color="#d4af37" tiles={tiles} />
    </>
  );
}

// ── Dynamic sun that follows camera ─────────────────────────────────────────

function DynamicSun({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!lightRef.current || !controlsRef.current) return;
    const target = controlsRef.current.target;
    // Sun offset from camera target — always lights from the same angle
    lightRef.current.position.set(
      target.x + SUN_POSITION.x,
      SUN_POSITION.y,
      target.z + SUN_POSITION.z,
    );
    lightRef.current.target.position.set(target.x, 0, target.z);
    lightRef.current.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={SUN_INTENSITY}
      color={SUN_COLOR}
      castShadow
      shadow-mapSize-width={SHADOW_MAP_SIZE}
      shadow-mapSize-height={SHADOW_MAP_SIZE}
      shadow-camera-near={1}
      shadow-camera-far={300}
      shadow-camera-left={-60}
      shadow-camera-right={60}
      shadow-camera-top={60}
      shadow-camera-bottom={-60}
      shadow-bias={-0.0005}
    />
  );
}

// ── WASD keyboard panning ────────────────────────────────────────────────────

/** Pan speed in world units per second */
const PAN_SPEED = 40;

function WASDControls({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const keysDown = useRef(new Set<string>());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
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

    // Scale speed by camera distance for consistent feel
    const dist = camera.position.distanceTo(controls.target);
    const speed = PAN_SPEED * delta * (dist / 100);
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

  // Perspective camera position: tilted from the south, looking at map center
  const tiltRad = (CAMERA_TILT_DEG * Math.PI) / 180;
  const camX = worldWidth / 2;
  const camY = CAMERA_DISTANCE * Math.cos(tiltRad);
  const camZ = worldHeight / 2 + CAMERA_DISTANCE * Math.sin(tiltRad);

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
        camera={{
          fov: CAMERA_FOV,
          position: [camX, camY, camZ],
          near: 1,
          far: 500,
          up: [0, 1, 0],
        }}
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(BG_COLOR);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          camera.lookAt(worldWidth / 2, 0, worldHeight / 2);
          camera.updateProjectionMatrix();
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Soft fog for distance fade */}
        <fog attach="fog" args={[BG_COLOR, 80, 200]} />

        {/* Lighting — matches Felix Turner's setup */}
        <ambientLight intensity={AMBIENT_INTENSITY} color={AMBIENT_COLOR} />
        <DynamicSun controlsRef={controlsRef} />
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
          minDistance={25}
          maxDistance={300}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          screenSpacePanning={false}
          makeDefault
          target={[worldWidth / 2, 0, worldHeight / 2]}
        />
        <WASDControls controlsRef={controlsRef} />
        <EffectComposer>
          <N8AO
            aoRadius={1.0}
            intensity={1.5}
            halfRes
          />
          <Vignette eskil={false} offset={0.3} darkness={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
});

WebGLHexMap.displayName = 'WebGLHexMap';
