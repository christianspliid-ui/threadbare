/**
 * Tilt-shift post-processing effect for miniature/diorama look.
 * Applies a vertical gradient blur that keeps the center sharp
 * and blurs the top and bottom edges, simulating a macro lens.
 */
import { forwardRef, useMemo } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Center of the sharp focus band (0 = top, 0.5 = center, 1 = bottom) */
const FOCUS_CENTER = 0.45;

/** Width of the sharp focus band (0–1, larger = more in focus) */
const FOCUS_WIDTH = 0.45;

/** Maximum blur strength at the edges */
const BLUR_STRENGTH = 2.0;

/** Number of blur samples (higher = smoother but slower) */
const BLUR_SAMPLES = 6;

// ── Custom Effect ───────────────────────────────────────────────────────────

const tiltShiftShader = /* glsl */ `
  uniform float uFocusCenter;
  uniform float uFocusWidth;
  uniform float uBlurStrength;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Distance from focus band center (0 = in focus, 1 = max blur)
    float dist = abs(uv.y - uFocusCenter);
    float blurAmount = smoothstep(uFocusWidth * 0.5, uFocusWidth * 0.5 + 0.2, dist);
    blurAmount *= uBlurStrength;

    if (blurAmount < 0.01) {
      outputColor = inputColor;
      return;
    }

    // Simple vertical blur
    vec4 sum = inputColor;
    float totalWeight = 1.0;
    vec2 texelSize = 1.0 / resolution;

    for (int i = 1; i <= ${BLUR_SAMPLES}; i++) {
      float offset = float(i) * blurAmount * texelSize.y;
      float weight = 1.0 - float(i) / float(${BLUR_SAMPLES + 1});
      sum += texture2D(inputBuffer, uv + vec2(0.0, offset)) * weight;
      sum += texture2D(inputBuffer, uv - vec2(0.0, offset)) * weight;
      // Also sample horizontally for a softer look
      sum += texture2D(inputBuffer, uv + vec2(offset * 0.5, 0.0)) * weight * 0.5;
      sum += texture2D(inputBuffer, uv - vec2(offset * 0.5, 0.0)) * weight * 0.5;
      totalWeight += weight * 3.0;
    }

    outputColor = sum / totalWeight;

    // Slight vignette at the blurred edges for extra miniature feel
    float vignette = 1.0 - blurAmount * 0.08;
    outputColor.rgb *= vignette;
  }
`;

class TiltShiftEffectImpl extends Effect {
  constructor() {
    super('TiltShiftEffect', tiltShiftShader, {
      uniforms: new Map<string, Uniform>([
        ['uFocusCenter', new Uniform(FOCUS_CENTER)],
        ['uFocusWidth', new Uniform(FOCUS_WIDTH)],
        ['uBlurStrength', new Uniform(BLUR_STRENGTH)],
      ]),
    });
  }
}

// ── React wrapper ───────────────────────────────────────────────────────────

export const TiltShift = forwardRef<TiltShiftEffectImpl>((_props, ref) => {
  const effect = useMemo(() => new TiltShiftEffectImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});

TiltShift.displayName = 'TiltShift';
