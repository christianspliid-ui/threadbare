/**
 * Custom shader material for textured hex terrain.
 * Samples a DataArrayTexture (terrain atlas) with per-vertex layer indices,
 * blends between terrain textures at hex edges, applies vertex colors as tint,
 * and supports Phong-style directional lighting with edge-of-world fog.
 */
import * as THREE from 'three';

/** How much the texture contributes vs. vertex color (0 = pure vertex color, 1 = pure texture) */
export const TEXTURE_STRENGTH = 0.65;

/** How many hex-widths from the edge the fog starts */
const FOG_EDGE_START = 3.0;

/** Background color the fog fades toward */
const FOG_COLOR = new THREE.Vector3(0.04, 0.04, 0.047); // matches BG_COLOR '#0a0a0c'

export const terrainVertexShader = /* glsl */ `
  attribute vec3 aTerrainLayer; // x=primary, y=secondary, z=blendWeight

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTerrainLayer;

  void main() {
    vUv = uv;
    vColor = color;
    vNormal = normalize(normalMatrix * normal);
    vTerrainLayer = aTerrainLayer;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const terrainFragmentShader = /* glsl */ `
  precision highp float;
  precision highp sampler2DArray;

  uniform sampler2DArray uTerrainAtlas;
  uniform float uTextureStrength;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform vec3 uAmbientColor;
  uniform float uAmbientIntensity;
  uniform vec4 uWorldBounds; // x=minX, y=minZ, z=maxX, w=maxZ
  uniform vec3 uFogColor;
  uniform float uFogEdgeWidth;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTerrainLayer;

  void main() {
    // Sample primary terrain texture
    vec3 uvPrimary = vec3(vUv, vTerrainLayer.x);
    vec4 texPrimary = texture(uTerrainAtlas, uvPrimary);

    // Sample secondary terrain texture (for edge blending)
    vec3 uvSecondary = vec3(vUv, vTerrainLayer.y);
    vec4 texSecondary = texture(uTerrainAtlas, uvSecondary);

    // Blend between primary and secondary based on blend weight
    float blendWeight = vTerrainLayer.z;
    vec4 texColor = mix(texPrimary, texSecondary, blendWeight);

    // === Texture-first approach ===
    // The painterly tiles carry the visual detail; vertex colors provide terrain hue.
    // Threadbare palette vertex colors are very dark (10-40%), so we extract hue only.

    // Lift texture out of darkness — these are moody painterly tiles
    vec3 tex = pow(texColor.rgb, vec3(0.5));

    // Extract hue direction from vertex color (normalize to unit brightness)
    float vLum = max(dot(vColor, vec3(0.299, 0.587, 0.114)), 0.01);
    vec3 vHue = vColor / vLum; // hue direction, ~1.0 brightness

    // Tint the texture with the terrain hue — preserves texture detail
    vec3 tinted = tex * vHue;

    // Blend: at center use more vertex hue, at edges let texture detail dominate
    vec3 baseColor = mix(vHue * 0.7, tinted, uTextureStrength);

    // Phong-style directional lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uSunDirection);
    float NdotL = max(dot(normal, lightDir), 0.0);

    // Wrap lighting for softer shadows (half-lambert)
    float wrap = NdotL * 0.5 + 0.5;
    vec3 diffuse = uSunColor * uSunIntensity * wrap;
    vec3 ambient = uAmbientColor * uAmbientIntensity;

    vec3 finalColor = baseColor * (ambient + diffuse);

    // Tone mapping — prevent blowout, keep darks rich
    finalColor = finalColor / (finalColor + vec3(1.0)); // Reinhard

    // Pull back toward Threadbare darkness — moody, not washed out
    finalColor = pow(finalColor, vec3(1.3)); // darken curve
    finalColor *= 0.85; // overall dim

    // Edge-of-world fog: fade to background near map boundaries
    float distLeft   = vWorldPos.x - uWorldBounds.x;
    float distBottom = vWorldPos.z - uWorldBounds.y;
    float distRight  = uWorldBounds.z - vWorldPos.x;
    float distTop    = uWorldBounds.w - vWorldPos.z;
    float minDist = min(min(distLeft, distRight), min(distBottom, distTop));
    float fogFactor = smoothstep(0.0, uFogEdgeWidth, minDist);
    finalColor = mix(uFogColor, finalColor, fogFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Create a ShaderMaterial for textured terrain rendering.
 * Must be called after the atlas texture is loaded.
 */
export function createTerrainMaterial(
  atlas: THREE.DataArrayTexture,
  sunDirection: THREE.Vector3,
  sunColor: THREE.Color,
  sunIntensity: number,
  ambientColor: THREE.Color,
  ambientIntensity: number,
  worldBounds?: { minX: number; minZ: number; maxX: number; maxZ: number },
): THREE.ShaderMaterial {
  const bounds = worldBounds ?? { minX: -1, minZ: -1, maxX: 100, maxZ: 100 };
  return new THREE.ShaderMaterial({
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: {
      uTerrainAtlas: { value: atlas },
      uTextureStrength: { value: TEXTURE_STRENGTH },
      uSunDirection: { value: sunDirection.normalize() },
      uSunColor: { value: sunColor },
      uSunIntensity: { value: sunIntensity },
      uAmbientColor: { value: ambientColor },
      uAmbientIntensity: { value: ambientIntensity },
      uWorldBounds: { value: new THREE.Vector4(bounds.minX, bounds.minZ, bounds.maxX, bounds.maxZ) },
      uFogColor: { value: FOG_COLOR },
      uFogEdgeWidth: { value: FOG_EDGE_START },
    },
    vertexColors: true,
    side: THREE.DoubleSide,
    extensions: {
      derivatives: true,
    },
  });
}
