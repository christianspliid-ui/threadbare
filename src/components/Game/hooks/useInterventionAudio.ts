import { useRef, useCallback } from 'react';
import {
  SPHERE_AUDIO_CONFIG,
  DIVINE_INFLUENCE_CONSTANTS,
} from '../../../data/intervention-feedback-content';

/**
 * useInterventionAudio — Web Audio API synthesis hook
 *
 * Plays a sphere-colored rising tone when an intervention is confirmed.
 * Each sphere has its own pitch offset and waveform. When detected,
 * a secondary discordant tone is layered for emphasis.
 */
export function useInterventionAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    // Resume audio context if suspended (required on some browsers after user interaction)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playCastSound = useCallback(
    (sphere: string, detected: boolean) => {
      const ctx = getContext();
      const config = SPHERE_AUDIO_CONFIG[sphere] ?? SPHERE_AUDIO_CONFIG.mind;
      const {
        AUDIO_BASE_FREQ,
        AUDIO_RISE_FREQ,
        AUDIO_DURATION_MS,
        AUDIO_DETECTION_DETUNE,
      } = DIVINE_INFLUENCE_CONSTANTS;

      const baseFreq = AUDIO_BASE_FREQ + config.freqOffset;
      const riseFreq = AUDIO_RISE_FREQ + config.freqOffset;
      const durationSec = AUDIO_DURATION_MS / 1000;

      // Main oscillator — rising tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = config.waveform;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(
        riseFreq,
        ctx.currentTime + durationSec
      );
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + durationSec
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationSec);

      // Detection overlay — discordant secondary tone
      if (detected) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(
          baseFreq + AUDIO_DETECTION_DETUNE,
          ctx.currentTime
        );
        osc2.frequency.linearRampToValueAtTime(
          riseFreq - AUDIO_DETECTION_DETUNE,
          ctx.currentTime + durationSec
        );
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + durationSec
        );
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + durationSec);
      }
    },
    [getContext]
  );

  return { playCastSound };
}
