import * as THREE from 'three';
import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';

const VERTEX_SHADER = /* glsl */ `
  attribute float aVisibilityState;
  attribute float aHoverMix;
  attribute float aSelectionMix;

  varying float vVisibilityState;
  varying float vHoverMix;
  varying float vSelectionMix;

  void main() {
    vVisibilityState = aVisibilityState;
    vHoverMix = aHoverMix;
    vSelectionMix = aSelectionMix;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uRememberedTint;
  uniform float uRememberedMix;
  uniform vec3 uHoverColor;
  uniform vec3 uSelectionColor;

  varying float vVisibilityState;
  varying float vHoverMix;
  varying float vSelectionMix;

  void main() {
    if (vVisibilityState < 0.5) discard;

    vec3 color = vVisibilityState < 1.5
      ? uBaseColor
      : mix(uBaseColor, uRememberedTint, uRememberedMix);

    color = mix(color, uHoverColor, clamp(vHoverMix, 0.0, 1.0));
    color = mix(color, uSelectionColor, clamp(vSelectionMix, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createVignetteInstanceMaterial(baseColorLinear: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: baseColorLinear.clone() },
      uRememberedTint: { value: new THREE.Color(0x6080a0) },
      uRememberedMix: { value: TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.REMEMBERED_TINT_MIX },
      uHoverColor: { value: new THREE.Color(0xf6e7a8) },
      uSelectionColor: { value: new THREE.Color(0xffd700) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: THREE.DoubleSide,
  });
}
