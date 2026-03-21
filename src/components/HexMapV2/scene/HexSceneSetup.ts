import * as THREE from 'three';

/**
 * Scene-level constants for the Three.js hex renderer.
 * NFP #1: Every magic number is named here.
 */
export const SCENE_CONSTANTS = {
  BACKGROUND_COLOR: 0x0a0a0c,  // Matches --bg-abyss; dark canvas background
  PIXEL_RATIO_CAP:  2,          // Prevent extreme DPI scaling on high-resolution displays
  NEAR_PLANE:       0.1,
  FAR_PLANE:        10000,
} as const;

/**
 * All Three.js scene objects needed for the render loop.
 */
export interface HexScene {
  renderer: THREE.WebGLRenderer;
  scene:    THREE.Scene;
  camera:   THREE.OrthographicCamera;
  /** Clean up GPU resources and the renderer DOM element. */
  dispose:  () => void;
}

/**
 * Initializes the Three.js renderer, scene, and orthographic camera.
 * The canvas element is owned by the caller (React ref) — do not dispose it here.
 */
export function createHexScene(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): HexScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, SCENE_CONSTANTS.PIXEL_RATIO_CAP));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_CONSTANTS.BACKGROUND_COLOR);

  const halfW = width / 2;
  const halfH = height / 2;
  const camera = new THREE.OrthographicCamera(
    -halfW, halfW,
     halfH, -halfH,
    SCENE_CONSTANTS.NEAR_PLANE,
    SCENE_CONSTANTS.FAR_PLANE,
  );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  const dispose = () => {
    renderer.dispose();
  };

  return { renderer, scene, camera, dispose };
}

/**
 * Updates renderer output size and camera frustum after a container resize.
 * Called by ResizeObserver in HexMapV2.
 */
export function resizeHexScene(hexScene: HexScene, width: number, height: number): void {
  const { renderer, camera } = hexScene;
  renderer.setSize(width, height);

  const halfW = width / 2;
  const halfH = height / 2;
  camera.left   = -halfW;
  camera.right  =  halfW;
  camera.top    =  halfH;
  camera.bottom = -halfH;
  camera.updateProjectionMatrix();
}
