import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type {
  LabTerrainKey,
  TerrainTextureLabConfig,
  TerrainTextureLabModelDefinition,
  TerrainTextureLabModelPlacement,
  TerrainTextureLabViewSettings,
  TerrainTexturePreviewHex,
} from './terrainTextureLabPresets';
import { TERRAIN_TEXTURE_LAB_CONSTANTS } from './terrainTextureLabPresets';
import {
  createTerrainTextureLabMaterial,
  TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS,
} from './terrainTextureLabShader';
import {
  getTerrainTextureLabHexCenter,
} from './terrainTextureLabLayout';
import type {
  TerrainTextureLabVignetteClickTarget,
  TerrainTextureLabVignetteDebugDot,
  TerrainTextureLabVignetteSlotAnchor,
  TerrainTextureLabVignetteZoneRule,
} from './terrainTextureLabVignettePrototype';

interface TerrainTextureLabCanvasProps {
  configs: Record<LabTerrainKey, TerrainTextureLabConfig>;
  previewHexes: TerrainTexturePreviewHex[];
  models: TerrainTextureLabModelDefinition[];
  placements: TerrainTextureLabModelPlacement[];
  slotAnchors: TerrainTextureLabVignetteSlotAnchor[];
  zoneRules: TerrainTextureLabVignetteZoneRule[];
  fillerDots: TerrainTextureLabVignetteDebugDot[];
  clickTargets: TerrainTextureLabVignetteClickTarget[];
  selectedHexId: string | null;
  selectedClickTargetId: string | null;
  seed: number;
  animationEnabled: boolean;
  globalTimeScale: number;
  viewSettings: TerrainTextureLabViewSettings;
  onHexSelect: (hexId: string) => void;
  onLandmarkSelect: (targetId: string, hexId: string) => void;
  onZoom?: (delta: number) => void;
}

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mesh: THREE.InstancedMesh;
  material: THREE.ShaderMaterial;
  modelGroup: THREE.Group;
  zoneGroup: THREE.Group;
  slotAnchorGroup: THREE.Group;
  fillerDotGroup: THREE.Group;
  selectionOutline: THREE.LineLoop;
  landmarkSelectionRing: THREE.LineLoop;
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

function createOutline(
  size: number,
  color = TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS.OUTLINE_COLOR,
  opacity = TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS.OUTLINE_OPACITY,
) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push(new THREE.Vector3(size * Math.cos(angle), size * Math.sin(angle), 0));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  return new THREE.LineLoop(geometry, material);
}

function createCircleOutline(
  radius: number,
  color: string,
  opacity: number,
  segments: number = 24,
): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < segments; index++) {
    const angle = (Math.PI * 2 * index) / segments;
    points.push(new THREE.Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  return new THREE.LineLoop(geometry, material);
}

function createCircleFill(
  radius: number,
  color: string,
  opacity: number,
): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(radius, 24);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

function disposeLineLoop(loop: THREE.LineLoop) {
  loop.geometry.dispose();
  (loop.material as THREE.Material).dispose();
}

function disposeMesh(mesh: THREE.Mesh) {
  mesh.geometry.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) material.dispose();
}

function disposeObjectResources(root: THREE.Object3D): void {
  const disposedMaterials = new Set<THREE.Material>();
  root.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!disposedMaterials.has(material)) {
        material.dispose();
        disposedMaterials.add(material);
      }
    }
  });
}

function clearGroupChildren(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[group.children.length - 1];
    group.remove(child);
  }
}

function disposeAndClearGroupChildren(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[group.children.length - 1];
    group.remove(child);
    if (child instanceof THREE.LineLoop) disposeLineLoop(child);
    if (child instanceof THREE.Mesh) disposeMesh(child);
  }
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
    const center = getTerrainTextureLabHexCenter(previewHex.col, previewHex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
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
  models,
  placements,
  slotAnchors,
  zoneRules,
  fillerDots,
  clickTargets,
  selectedHexId,
  selectedClickTargetId,
  seed,
  animationEnabled,
  globalTimeScale,
  viewSettings,
  onHexSelect,
  onLandmarkSelect,
  onZoom,
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
  const onHexSelectRef = useRef(onHexSelect);
  const onLandmarkSelectRef = useRef(onLandmarkSelect);
  const onZoomRef = useRef(onZoom);
  const clickTargetsRef = useRef(clickTargets);
  const loaderRef = useRef<GLTFLoader | null>(null);
  const templateCacheRef = useRef<Map<string, Promise<THREE.Group>>>(new Map());
  const resolvedTemplateRef = useRef<Map<string, THREE.Group>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());

  const sceneBounds = useMemo(() => {
    const centers = previewHexes.map(hex => getTerrainTextureLabHexCenter(hex.col, hex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS));
    const xs = centers.map(center => center.x);
    const ys = centers.map(center => center.y);
    return {
      minX: Math.min(...xs) - TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
      maxX: Math.max(...xs) + TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
      minY: Math.min(...ys) - TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
      maxY: Math.max(...ys) + TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.4,
    };
  }, [previewHexes]);

  const previewHexMap = useMemo(() => {
    return new Map(previewHexes.map(hex => [hex.id, hex]));
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
    onHexSelectRef.current = onHexSelect;
  }, [onHexSelect]);

  useEffect(() => {
    onLandmarkSelectRef.current = onLandmarkSelect;
  }, [onLandmarkSelect]);

  useEffect(() => {
    onZoomRef.current = onZoom;
  }, [onZoom]);

  useEffect(() => {
    clickTargetsRef.current = clickTargets;
  }, [clickTargets]);

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
    loaderRef.current = new GLTFLoader();

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
      const center = getTerrainTextureLabHexCenter(previewHex.col, previewHex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
      outline.position.set(center.x, center.y, 0.5);
      outlineGroup.add(outline);
    }
    scene.add(outlineGroup);

    const modelGroup = new THREE.Group();
    modelGroup.name = 'TerrainTextureLabModels';
    scene.add(modelGroup);

    const zoneGroup = new THREE.Group();
    zoneGroup.name = 'TerrainTextureLabZones';
    scene.add(zoneGroup);

    const slotAnchorGroup = new THREE.Group();
    slotAnchorGroup.name = 'TerrainTextureLabSlotAnchors';
    scene.add(slotAnchorGroup);

    const fillerDotGroup = new THREE.Group();
    fillerDotGroup.name = 'TerrainTextureLabFillerDots';
    scene.add(fillerDotGroup);

    const selectionOutline = createOutline(
      TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * 1.08,
      '#F6E7A8',
      0.95,
    );
    selectionOutline.visible = false;
    selectionOutline.position.z = TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z + 0.5;
    scene.add(selectionOutline);

    const landmarkSelectionRing = createCircleOutline(18, '#F6E7A8', 0.96, 32);
    landmarkSelectionRing.visible = false;
    landmarkSelectionRing.position.z = TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z + 1.25;
    scene.add(landmarkSelectionRing);

    sceneRef.current = {
      renderer,
      scene,
      camera,
      mesh,
      material,
      modelGroup,
      zoneGroup,
      slotAnchorGroup,
      fillerDotGroup,
      selectionOutline,
      landmarkSelectionRing,
    };

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

    const handlePointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      let nearestTarget: TerrainTextureLabVignetteClickTarget | null = null;
      let nearestDistanceSquared = Number.POSITIVE_INFINITY;
      for (const target of clickTargetsRef.current) {
        const projected = new THREE.Vector3(
          target.position.x,
          target.position.y,
          TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z + 1,
        ).project(camera);
        const screenX = rect.left + ((projected.x + 1) * 0.5) * rect.width;
        const screenY = rect.top + ((-projected.y + 1) * 0.5) * rect.height;
        const dx = screenX - event.clientX;
        const dy = screenY - event.clientY;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > target.radiusPx * target.radiusPx) continue;
        if (distanceSquared >= nearestDistanceSquared) continue;
        nearestTarget = target;
        nearestDistanceSquared = distanceSquared;
      }

      if (nearestTarget) {
        onLandmarkSelectRef.current(nearestTarget.id, nearestTarget.hexId);
        return;
      }

      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const intersections = raycasterRef.current.intersectObject(mesh, false);
      const hit = intersections[0];
      if (!hit || hit.instanceId == null) return;

      const previewHex = previewHexes[hit.instanceId];
      if (!previewHex) return;
      onHexSelectRef.current(previewHex.id);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = -Math.sign(event.deltaY || 1);
      const magnitude = Math.min(Math.abs(event.deltaY) * 0.001, 0.15);
      const delta = direction * Math.max(magnitude, 0.03);
      onZoomRef.current?.(delta);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('wheel', handleWheel);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      outlineGroup.children.forEach(child => {
        if (child instanceof THREE.LineLoop) disposeLineLoop(child);
      });
      disposeAndClearGroupChildren(zoneGroup);
      disposeAndClearGroupChildren(slotAnchorGroup);
      disposeAndClearGroupChildren(fillerDotGroup);
      disposeLineLoop(selectionOutline);
      disposeLineLoop(landmarkSelectionRing);
      clearGroupChildren(modelGroup);
      resolvedTemplateRef.current.forEach(template => disposeObjectResources(template));
      resolvedTemplateRef.current.clear();
      templateCacheRef.current.clear();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
      sceneRef.current = null;
      loaderRef.current = null;
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

  useEffect(() => {
    const sceneRefs = sceneRef.current;
    const previewHex = selectedHexId ? previewHexMap.get(selectedHexId) : null;
    if (!sceneRefs || !previewHex) {
      if (sceneRefs) sceneRefs.selectionOutline.visible = false;
      return;
    }

    const center = getTerrainTextureLabHexCenter(previewHex.col, previewHex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
    sceneRefs.selectionOutline.visible = true;
    sceneRefs.selectionOutline.position.set(
      center.x,
      center.y,
      TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z + 0.5,
    );
  }, [previewHexMap, selectedHexId]);

  useEffect(() => {
    const sceneRefs = sceneRef.current;
    if (!sceneRefs) return;

    disposeAndClearGroupChildren(sceneRefs.zoneGroup);
    disposeAndClearGroupChildren(sceneRefs.slotAnchorGroup);
    disposeAndClearGroupChildren(sceneRefs.fillerDotGroup);

    const zoneColors: Record<TerrainTextureLabZoneRule['mode'], { color: string; opacity: number }> = {
      hard_keepout: { color: '#F6A97B', opacity: 0.72 },
      soft_fill: { color: '#D4C27C', opacity: 0.55 },
      free_fill: { color: '#5FA06D', opacity: 0.3 },
    };

    for (const zone of zoneRules) {
      const ring = createCircleOutline(zone.radius, zoneColors[zone.mode].color, zoneColors[zone.mode].opacity);
      ring.position.set(zone.center.x, zone.center.y, 0.95);
      sceneRefs.zoneGroup.add(ring);
    }

    for (const anchor of slotAnchors) {
      const marker = createCircleFill(anchor.occupied ? 4.8 : 3.4, anchor.occupied ? '#F6E7A8' : '#D4C27C', anchor.occupied ? 0.96 : 0.72);
      marker.position.set(anchor.position.x, anchor.position.y, 1.05);
      sceneRefs.slotAnchorGroup.add(marker);
    }

    for (const dot of fillerDots) {
      const radius = dot.mode === 'soft_fill'
        ? Math.max(1.6, dot.scale * 0.24)
        : Math.max(2.1, dot.scale * 0.28);
      const color = dot.mode === 'soft_fill' ? '#B5D48A' : '#5A8C49';
      const opacity = dot.mode === 'soft_fill' ? 0.7 : 0.82;
      const marker = createCircleFill(radius, color, opacity);
      marker.position.set(dot.position.x, dot.position.y, 1.15);
      sceneRefs.fillerDotGroup.add(marker);
    }
  }, [fillerDots, slotAnchors, zoneRules]);

  useEffect(() => {
    const sceneRefs = sceneRef.current;
    const selectedTarget = selectedClickTargetId
      ? clickTargets.find(target => target.id === selectedClickTargetId) ?? null
      : null;
    if (!sceneRefs || !selectedTarget) {
      if (sceneRefs) sceneRefs.landmarkSelectionRing.visible = false;
      return;
    }

    sceneRefs.landmarkSelectionRing.visible = true;
    sceneRefs.landmarkSelectionRing.position.set(
      selectedTarget.position.x,
      selectedTarget.position.y,
      TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z + 1.25,
    );
  }, [clickTargets, selectedClickTargetId]);

  useEffect(() => {
    const sceneRefs = sceneRef.current;
    const loader = loaderRef.current;
    if (!sceneRefs || !loader) return;

    let cancelled = false;
    clearGroupChildren(sceneRefs.modelGroup);

    async function loadTemplate(model: TerrainTextureLabModelDefinition): Promise<THREE.Group> {
      const cached = templateCacheRef.current.get(model.id);
      if (cached) return cached;

      const promise = loader.loadAsync(model.sourceUrl).then((gltf) => {
        const materialCache = new Map<THREE.Material, THREE.MeshBasicMaterial>();
        gltf.scene.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          const original = Array.isArray(child.material) ? child.material[0] : child.material;
          if (!materialCache.has(original)) {
            const originalColor = original instanceof THREE.MeshStandardMaterial || original instanceof THREE.MeshBasicMaterial
              ? original.color.clone()
              : new THREE.Color('#ffffff');
            materialCache.set(original, new THREE.MeshBasicMaterial({
              color: originalColor,
              side: THREE.DoubleSide,
            }));
          }
          child.material = materialCache.get(original)!;
          child.castShadow = false;
          child.receiveShadow = false;
        });

        if (model.sourceKind !== 'builtin') {
          const bounds = new THREE.Box3().setFromObject(gltf.scene);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const footprintRadius = Math.max(size.x, size.y) * 0.5;
          const autoScale = footprintRadius > 0
            ? TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_TARGET_FOOTPRINT_RADIUS / footprintRadius
            : 1;

          gltf.scene.position.x -= center.x;
          gltf.scene.position.y -= center.y;
          gltf.scene.position.z -= bounds.min.z;
          gltf.scene.scale.setScalar(autoScale);
        }

        resolvedTemplateRef.current.set(model.id, gltf.scene);
        return gltf.scene;
      });

      templateCacheRef.current.set(model.id, promise);
      return promise;
    }

    async function syncPlacements() {
      for (const placement of placements) {
        const model = models.find(entry => entry.id === placement.modelId);
        const previewHex = previewHexMap.get(placement.hexId);
        if (!model || !previewHex) continue;

        try {
          const template = await loadTemplate(model);
          if (cancelled) return;

          const clone = template.clone(true);
          const center = getTerrainTextureLabHexCenter(previewHex.col, previewHex.row, TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS);
          clone.position.set(
            center.x,
            center.y,
            TERRAIN_TEXTURE_LAB_CONSTANTS.MODEL_LAYER_Z + placement.heightOffset,
          );
          clone.scale.setScalar(placement.scale);
          clone.rotation.z = THREE.MathUtils.degToRad(placement.rotationDegrees);
          sceneRefs.modelGroup.add(clone);
        } catch (error) {
          console.warn(`[TerrainTextureLab] Failed to load model ${model.sourceUrl}:`, error);
        }
      }
    }

    void syncPlacements();

    return () => {
      cancelled = true;
      clearGroupChildren(sceneRefs.modelGroup);
    };
  }, [models, placements, previewHexMap]);

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
