import * as THREE from 'three';
import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';

const VERTEX_SHADER = /* glsl */ `
  attribute float aVisibilityState;
  attribute float aHoverMix;

  varying float vVisibilityState;
  varying float vHoverMix;

  void main() {
    vVisibilityState = aVisibilityState;
    vHoverMix = aHoverMix;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uRememberedTint;
  uniform float uRememberedMix;
  uniform vec3 uHoverColor;

  varying float vVisibilityState;
  varying float vHoverMix;

  void main() {
    if (vVisibilityState < 0.5) discard;

    vec3 color = vVisibilityState < 1.5
      ? uBaseColor
      : mix(uBaseColor, uRememberedTint, uRememberedMix);

    color = mix(color, uHoverColor, clamp(vHoverMix, 0.0, 1.0));
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
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    side: THREE.DoubleSide,
  });
}
