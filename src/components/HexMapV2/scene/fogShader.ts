/**
 * fogShader.ts — Vertex and fragment shader sources for parchment fog-of-war hex fill.
 *
 * The shader supports three visual states via a per-instance float attribute (aFogState):
 * - 0.0 (unexplored): samples a parchment texture
 * - 0.5 (remembered): uses instance color (sepia-tinted CPU-side)
 * - 1.0 (visible): uses instance color (full terrain color)
 *
 * NFP #1: All magic numbers are named constants in PARCHMENT_FOG_CONSTANTS.
 * NFP #4: Fail-soft — if parchment texture fails to load, shader uses fallback color uniform.
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const PARCHMENT_FOG_CONSTANTS = {
  /** Path to the pre-baked parchment texture asset. */
  PARCHMENT_TEXTURE_PATH: '/textures/parchment-512.png',
  /** Blend factor for sepia tint: 0 = original color, 1 = full sepia. */
  SEPIA_STRENGTH: 0.7,
  /** Brightness multiplier for remembered hexes (slight dimming vs visible). */
  SEPIA_BRIGHTNESS_SCALE: 0.85,
  /** Per-instance fog state value: unexplored (parchment texture). */
  FOG_STATE_UNEXPLORED: 0.0,
  /** Per-instance fog state value: remembered (sepia-tinted terrain). */
  FOG_STATE_REMEMBERED: 0.5,
  /** Per-instance fog state value: visible (full terrain color). */
  FOG_STATE_VISIBLE: 1.0,
  /** Solid color fallback if parchment texture fails to load. */
  PARCHMENT_FALLBACK_COLOR: '#3d3025',
} as const;

// ── Vertex Shader ────────────────────────────────────────────────────────────

export const FOG_VERTEX_SHADER = /* glsl */ `
  attribute float aFogState;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vFogState;

  void main() {
    vUv = uv;
    vColor = instanceColor;
    vFogState = aFogState;

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// ── Fragment Shader ──────────────────────────────────────────────────────────

export const FOG_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uParchmentTex;
  uniform vec3 uParchmentFallback;
  uniform float uHasTexture;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vFogState;

  void main() {
    if (vFogState < 0.25) {
      // Unexplored: parchment texture or solid fallback
      if (uHasTexture > 0.5) {
        gl_FragColor = texture2D(uParchmentTex, vUv);
      } else {
        gl_FragColor = vec4(uParchmentFallback, 1.0);
      }
    } else {
      // Remembered (0.5) or Visible (1.0): instance color
      gl_FragColor = vec4(vColor, 1.0);
    }
  }
`;
