import * as THREE from 'three';

export const TERRAIN_TEXTURE_LAB_SHADER_CONSTANTS = {
  OUTLINE_COLOR: '#D4A040',
  OUTLINE_OPACITY: 0.5,
  BACKGROUND_COLOR: '#0a0a0e',
} as const;

export const TERRAIN_TEXTURE_LAB_VERTEX_SHADER = /* glsl */ `
  attribute vec3 aBaseColor;
  attribute vec3 aHighlightColor;
  attribute vec3 aShadowColor;
  attribute vec4 aNoiseParams1;
  attribute vec4 aNoiseParams2;
  attribute float aAnimationSpeed;
  attribute float aRecipe;
  attribute float aInstanceSeed;

  varying vec2 vUv;
  varying vec3 vBaseColor;
  varying vec3 vHighlightColor;
  varying vec3 vShadowColor;
  varying vec4 vNoiseParams1;
  varying vec4 vNoiseParams2;
  varying float vAnimationSpeed;
  varying float vRecipe;
  varying float vInstanceSeed;

  void main() {
    vUv = uv;
    vBaseColor = aBaseColor;
    vHighlightColor = aHighlightColor;
    vShadowColor = aShadowColor;
    vNoiseParams1 = aNoiseParams1;
    vNoiseParams2 = aNoiseParams2;
    vAnimationSpeed = aAnimationSpeed;
    vRecipe = aRecipe;
    vInstanceSeed = aInstanceSeed;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uGlobalSeed;

  varying vec2 vUv;
  varying vec3 vBaseColor;
  varying vec3 vHighlightColor;
  varying vec3 vShadowColor;
  varying vec4 vNoiseParams1;
  varying vec4 vNoiseParams2;
  varying float vAnimationSpeed;
  varying float vRecipe;
  varying float vInstanceSeed;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec2 hash22(vec2 p) {
    float n = hash21(p);
    return fract(vec2(n, hash21(p + n + 3.1)));
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 5; i++) {
      value += amplitude * valueNoise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      amplitude *= 0.52;
    }

    return value;
  }

  float ridgedFbm(vec2 p, float sharpness) {
    float value = 0.0;
    float amplitude = 0.5;
    float ridgePower = mix(1.2, 4.0, clamp(sharpness, 0.0, 1.0));

    for (int i = 0; i < 5; i++) {
      float n = valueNoise(p) * 2.0 - 1.0;
      n = abs(n);
      n = pow(1.0 - n, ridgePower);
      value += n * amplitude;
      p = p * 2.08 + vec2(8.3, 2.8);
      amplitude *= 0.55;
    }

    return clamp(value, 0.0, 1.0);
  }

  float cellular(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float minDistance = 10.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = hash22(i + neighbor);
        vec2 diff = neighbor + point - f;
        minDistance = min(minDistance, dot(diff, diff));
      }
    }

    return sqrt(minDistance);
  }

  vec2 warp(vec2 p, float scale, float strength) {
    vec2 q = vec2(
      fbm(p * scale + vec2(0.0, 0.0)),
      fbm(p * scale + vec2(5.2, 1.3))
    );
    return p + (q - 0.5) * strength;
  }

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  float getRecipePattern(vec2 p, vec2 warped) {
    float primaryScale = max(vNoiseParams1.x, 0.001);
    float detailScale = max(vNoiseParams1.y, 0.001);
    float mixAmount = clamp(vNoiseParams2.x, 0.0, 1.0);
    float ridgeStrength = clamp(vNoiseParams2.z, 0.0, 1.0);
    float banding = clamp(vNoiseParams2.w, 0.0, 1.0);

    if (vRecipe < 0.5) {
      float lowland = fbm(warped * primaryScale);
      float grain = valueNoise((rotate2d(0.45) * warped) * detailScale + vec2(0.0, 19.4));
      return mix(lowland, grain, 0.35 + mixAmount * 0.25);
    }

    if (vRecipe < 1.5) {
      float clumps = 1.0 - smoothstep(0.18, 0.72, cellular(warped * primaryScale));
      float moss = fbm(warped * detailScale + vec2(3.3, 11.8));
      return mix(moss, clumps, 0.45 + mixAmount * 0.3);
    }

    if (vRecipe < 2.5) {
      vec2 ridgeUv = rotate2d(0.68) * warped;
      float ridge = ridgedFbm(ridgeUv * primaryScale, ridgeStrength);
      float striation = 0.5 + 0.5 * sin((ridgeUv.x + ridgeUv.y * 0.35) * detailScale * 2.2);
      return mix(ridge, striation, banding * 0.45);
    }

    if (vRecipe < 3.5) {
      vec2 duneUv = rotate2d(-0.52) * warped;
      float dunes = 0.5 + 0.5 * sin(duneUv.y * detailScale * 2.0 + fbm(duneUv * primaryScale) * 6.28318);
      float drift = fbm(duneUv * detailScale * 0.55 + vec2(8.2, 2.4));
      return mix(drift, dunes, 0.5 + banding * 0.35);
    }

    if (vRecipe < 4.5) {
      vec2 waveUv = rotate2d(0.36) * warped;
      float wave = 0.5 + 0.5 * sin((waveUv.x * 0.85 + waveUv.y * 1.15) * detailScale * 2.2 + uTime * vAnimationSpeed);
      float foam = 1.0 - smoothstep(0.16, 0.62, cellular(waveUv * primaryScale + vec2(uTime * 0.08, -uTime * 0.04)));
      return mix(wave, foam, 0.18 + mixAmount * 0.22);
    }

    vec2 marshUv = rotate2d(-0.28) * warped;
    float pools = 1.0 - smoothstep(0.14, 0.6, cellular(marshUv * primaryScale));
    float silt = fbm(marshUv * detailScale + vec2(12.0, 1.4));
    return mix(silt, pools, 0.55 + mixAmount * 0.25);
  }

  void main() {
    float warpScale = max(vNoiseParams1.z, 0.001);
    float warpStrength = max(vNoiseParams1.w, 0.0);
    float contrast = max(vNoiseParams2.y, 0.01);

    vec2 centeredUv = vUv - 0.5;
    float seedOffset = uGlobalSeed * 0.017 + vInstanceSeed * 0.123;
    vec2 p = centeredUv * 4.0 + vec2(seedOffset, seedOffset * 1.37);
    vec2 warped = warp(p + vec2(13.0, 7.0), warpScale, warpStrength);

    float pattern = getRecipePattern(p, warped);
    pattern = clamp((pattern - 0.5) * contrast + 0.5, 0.0, 1.0);

    vec3 lowColor = mix(vShadowColor, vBaseColor, 0.45);
    vec3 highColor = mix(vBaseColor, vHighlightColor, 0.78);
    vec3 color = mix(lowColor, highColor, pattern);

    float vignette = smoothstep(0.58, 0.08, length(centeredUv));
    color = mix(color * 0.82, color * 1.05, vignette);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createTerrainTextureLabMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uGlobalSeed: { value: 42 },
    },
    vertexShader: TERRAIN_TEXTURE_LAB_VERTEX_SHADER,
    fragmentShader: TERRAIN_TEXTURE_LAB_FRAGMENT_SHADER,
  });
}
