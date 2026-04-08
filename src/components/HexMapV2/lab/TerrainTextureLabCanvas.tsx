import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type {
  LabTerrainKey,
  TerrainTextureLabConfig,
  TerrainTextureLabViewSettings,
  TerrainTexturePreviewHex,
} from './terrainTextureLabPresets';
import { TERRAIN_TEXTURE_LAB_CONSTANTS } from './terrainTextureLabPresets';
import {
  createTerrainTextureLabMaterial,
  TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS,
} from './terrainTextureLabShader';

interface TerrainTextureLabCanvasProps {
  configs: Record<LabTerrainKey, TerrainTextureLabConfig>;
  previewHexes: TerrainTexturePreviewHex[];
  seed: number;
  animationEnabled: boolean;
  globalTimeScale: number;
  viewSettings: TerrainTextureLabViewSettings;
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mesh: THREE.InstancedMesh;
  material: THREE.ShaderMaterial;
}

const RECIPE_INDEX: Record<TerrainTextureLabConfig['recipe'], number> = {
  grain: 0,
  canopy: 1,
  ridges: 2,
  dunes: 3,
  ripples: 4,
  marsh: 5,
};

function buildHexGeometry(size: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const inverseDiameter = 1 / (2 * size);

  for (let i = 0; i < 6; i++) {
    const a0 = (Math.PI / 180) * (60 * i);
    const a1 = (Math.PI / 180) * (60 * ((i + 1) % 6));

    const x0 = size * Math.cos(a0);
    const y0 = size * Math.sin(a0);
    const x1 = size * Math.cos(a1);
    const y1 = size * Math.sin(a1);

    positions.push(0, 0, 0);
    positions.push(x0, y0, 0);
    positions.push(x1, y1, 0);

    uvs.push(0.5, 0.5);
    uvs.push(0.5 + x0 * inverseDiameter, 0.5 + y0 * inverseDiameter);
    uvs.push(0.5 + x1 * inverseDiameter, 0.5 + y1 * inverseDiameter);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

function hexColorToLinear(hex: string): [number, number, number] {
  const color = new THREE.Color();
  color.setStyle(hex, THREE.SRGBColorSpace);
  return [color.r, color.g, color.b];
}

function getHexCenter(col: number, row: number, radius: number): { x: number; y: number } {
  const horizontal = radius * 1.5;
  const vertical = radius * Math.sqrt(3);
  return {
    x: col * horizontal,
    y: -(row * vertical + (col % 2 === 1 ? vertical * 0.5 : 0)),
  };
}

function createOutline(size: number): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push(new THREE.Vector3(size * Math.cos(angle), size * Math.sin(angle), 0));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS.OUTLINE_COLOR,
    transparent: true,
    opacity: TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS.OUTLINE_OPACITY,
  });
  return new THREE.LineLoop(geometry, material);
}

function fitPerspectiveCamera(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  container: HTMLDivElement,
  sceneBounds: { minX: number; maxX: number; minY: number; maxY: number },
  viewSettings: TerrainTextureLabViewSettings,
) {
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);
  const aspect = width / height;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, TERRAIN_TEXTURE_LAB_CONSTANTS.PIXEL_RATIO_CAP));

  camera.aspect = aspect;
  camera.fov = TERRAIN_TEXTURE_LAB_CONSTANTS.CAMERA_FOV_DEGREES;
  camera.updateProjectionMatrix();

  const centerX = (sceneBounds.minX + sceneBounds.maxX) * 0.5;
  const centerY = (sceneBounds.minY + sceneBounds.maxY) * 0.5;
  const halfWidth = (sceneBounds.maxX - sceneBounds.minX) * 0.5;
  const halfHeight = (sceneBounds.maxY - sceneBounds.minY) * 0.5;
  const radius = Math.max(Math.hypot(halfWidth, halfHeight), 1);

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov * 0.5) * camera.aspect);
  const limitingFov = Math.min(verticalFov, horizontalFov);
  const zoom = Math.max(viewSettings.zoom, 0.01);
  const distance = (radius * TERRAIN_TEXTURE_LAB_CONSTANTS.CAMERA_FIT_MARGIN) / Math.sin(limitingFov * 0.5) / zoom;

  const tilt = THREE.MathUtils.degToRad(viewSettings.tiltDegrees);
  const rotation = THREE.MathUtils.degToRad(viewSettings.rotationDegrees);
  const horizontalDistance = distance * Math.sin(tilt);

  camera.position.set(
    centerX + Math.cos(rotation) * horizontalDistance,
    centerY + Math.sin(rotation) * horizontalDistance,
    distance * Math.cos(tilt),
  );
  camera.lookAt(centerX, centerY, 0);
  camera.updateMatrixWorld();
}

function updateMeshAttributes(
  mesh: THREE.InstancedMesh,
  configs: Record<LabTerrainKey, TerrainTextureLabConfig>,
  previewHexes: TerrainTexturePreviewHex[],
  seed: number,
) {
  const geometry = mesh.geometry;
  const count = previewHexes.length;
  const baseColor = new Float32Array(count * 3);
  const highlightColor = new Float32Array(count * 3);
  const shadowColor = new Float32Array(count * 3);
  const noiseParams1 = new Float32Array(count * 4);
  const noiseParams2 = new Float32Array(count * 4);
  const animationSpeed = new Float32Array(count);
  const recipe = new Float32Array(count);
  const instanceSeed = new Float32Array(count);

  const matrix = new THREE.Matrix4();

  for (let i = 0; i < previewHexes.length; i++) {
    const previewHex = previewHexes[i];
    const config = configs[previewHex.terrainKey];
    const center = getHexCenter(previewHex.col, previewHex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
    matrix.makeTranslation(center.x, center.y, 0);
    mesh.setMatrixAt(i, matrix);

    const [baseR, baseG, baseB] = hexColorToLinear(config.baseColor);
    const [highlightR, highlightG, highlightB] = hexColorToLinear(config.highlightColor);
    const [shadowR, shadowG, shadowB] = hexColorToLinear(config.shadowColor);

    baseColor.set([baseR, baseG, baseB], i * 3);
    highlightColor.set([highlightR, highlightG, highlightB], i * 3);
    shadowColor.set([shadowR, shadowG, shadowB], i * 3);

    noiseParams1.set(
      [config.primaryScale, config.detailScale, config.warpScale, config.warpStrength],
      i * 4,
    );
    noiseParams2.set(
      [config.mixAmount, config.contrast, config.ridgeStrength, config.banding],
      i * 4,
    );
    animationSpeed[i] = config.animationSpeed;
    recipe[i] = RECIPE_INDEX[config.recipe];
    instanceSeed[i] = seed + i * 13;
  }

  geometry.setAttribute('aBaseColor', new THREE.InstancedBufferAttribute(baseColor, 3));
  geometry.setAttribute('aHighlightColor', new THREE.InstancedBufferAttribute(highlightColor, 3));
  geometry.setAttribute('aShadowColor', new THREE.InstancedBufferAttribute(shadowColor, 3));
  geometry.setAttribute('aNoiseParams1', new THREE.InstancedBufferAttribute(noiseParams1, 4));
  geometry.setAttribute('aNoiseParams2', new THREE.InstancedBufferAttribute(noiseParams2, 4));
  geometry.setAttribute('aAnimationSpeed', new THREE.InstancedBufferAttribute(animationSpeed, 1));
  geometry.setAttribute('aRecipe', new THREE.InstancedBufferAttribute(recipe, 1));
  geometry.setAttribute('aInstanceSeed', new THREE.InstancedBufferAttribute(instanceSeed, 1));

  mesh.instanceMatrix.needsUpdate = true;
}

export function TerrainTextureLabCanvas({
  configs,
  previewHexes,
  seed,
  animationEnabled,
  globalTimeScale,
  viewSettings,
}: TerrainTextureLabCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneRefs | null>(null);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const animationEnabledRef = useRef(animationEnabled);
  const globalTimeScaleRef = useRef(globalTimeScale);
  const seedRef = useRef(seed);
  const viewSettingsRef = useRef(viewSettings);

  const sceneBounds = useMemo(() => {
    const centers = previewHexes.map(hex => getHexCenter(hex.col, hex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS));
    const xs = centers.map(center => center.x);
    const ys = centers.map(center => center.y);
    return {
      minX: Math.min(...xs) - TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
      maxX: Math.max(...xs) + TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
      minY: Math.min(...ys) - TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
      maxY: Math.max(...ys) + TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
    };
  }, [previewHexes]);

  useEffect(() => {
    animationEnabledRef.current = animationEnabled;
    globalTimeScaleRef.current = globalTimeScale;
  }, [animationEnabled, globalTimeScale]);

  useEffect(() => {
    seedRef.current = seed;
  }, [seed]);

  useEffect(() => {
    viewSettingsRef.current = viewSettings;
    const sceneRefs = sceneRef.current;
    const container = containerRef.current;
    if (!sceneRefs || !container) return;
    fitPerspectiveCamera(sceneRefs.camera, sceneRefs.renderer, container, sceneBounds, viewSettings);
  }, [sceneBounds, viewSettings]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, TERRAIN_TEXTURE_LAB_CONSTANTS.PIXEL_RATIO_CAP));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS.BACKGROUND_COLOR);

    const camera = new THREE.PerspectiveCamera(
      TERRAIN_TEXTURE_LAB_CONSTANTS.CAMERA_FOV_DEGREES,
      width / height,
      1,
      4000,
    );
    camera.up.set(0, 0, 1);

    const geometry = buildHexGeometry(TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
    const material = createTerrainTextureLabMaterial();
    const mesh = new THREE.InstancedMesh(geometry, material, previewHexes.length);
    mesh.frustumCulled = false;
    updateMeshAttributes(mesh, configs, previewHexes, seed);
    scene.add(mesh);

    const outlineGroup = new THREE.Group();
    for (const previewHex of previewHexes) {
      const outline = createOutline(TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
      const center = getHexCenter(previewHex.col, previewHex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
      outline.position.set(center.x, center.y, 0.5);
      outlineGroup.add(outline);
    }
    scene.add(outlineGroup);

    sceneRef.current = { renderer, scene, camera, mesh, material };

    const fitCamera = () => {
      fitPerspectiveCamera(camera, renderer, container, sceneBounds, viewSettingsRef.current);
    };

    fitCamera();

    const animate = (time: number) => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = (time - startTimeRef.current) * 0.001;
      material.uniforms.uTime.value = animationEnabledRef.current ? elapsed * globalTimeScaleRef.current : 0;
      material.uniforms.uGlobalSeed.value = seedRef.current;
      renderer.render(scene, camera);
    };

    frameRef.current = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => fitCamera());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      outlineGroup.children.forEach(child => {
        if (child instanceof THREE.LineLoop) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
      sceneRef.current = null;
    };
  }, [previewHexes, sceneBounds]);

  useEffect(() => {
    const sceneRefs = sceneRef.current;
    if (!sceneRefs) return;
    updateMeshAttributes(sceneRefs.mesh, configs, previewHexes, seed);
    sceneRefs.material.uniforms.uGlobalSeed.value = seed;
  }, [configs, previewHexes, seed]);

  useEffect(() => {
    const sceneRefs = sceneRef.current;
    if (!sceneRefs) return;
    startTimeRef.current = performance.now();
    sceneRefs.material.uniforms.uTime.value = 0;
  }, [animationEnabled, globalTimeScale]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 20% 20%, rgba(34,34,40,0.65), rgba(10,10,14,0.96))',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
