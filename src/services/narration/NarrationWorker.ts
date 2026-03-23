// ── Narration Web Worker ────────────────────────────────────────────
// Runs Kokoro TTS inference off the main thread so it doesn't block
// the Three.js render loop or React UI.
//
// Message protocol:
//   Main → Worker: { type: 'init', modelId, dtype, device }
//   Main → Worker: { type: 'speak', text, voice, speed, id }
//   Main → Worker: { type: 'stop' }
//   Worker → Main: { type: 'init-progress', progress }
//   Worker → Main: { type: 'init-done' }
//   Worker → Main: { type: 'init-error', error }
//   Worker → Main: { type: 'audio', audio: Float32Array, sampleRate, id }
//   Worker → Main: { type: 'speak-error', error, id }
//   Worker → Main: { type: 'stopped', id }

import { KokoroTTS } from 'kokoro-js';

let tts: InstanceType<typeof KokoroTTS> | null = null;
let currentSpeakId: string | null = null;
let aborted = false;

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  switch (msg.type) {
    case 'init': {
      try {
        // Try requested device, fall back to WASM if WebGPU unavailable in worker
        let device = msg.device;
        if (device === 'webgpu' && typeof navigator !== 'undefined' && !navigator.gpu) {
          console.warn('[NarrationWorker] WebGPU not available in worker, falling back to WASM');
          device = 'wasm';
        }

        tts = await KokoroTTS.from_pretrained(msg.modelId, {
          dtype: msg.dtype,
          device,
          progress_callback: (progress: { status: string; progress?: number }) => {
            if (progress.progress != null) {
              self.postMessage({ type: 'init-progress', progress: progress.progress / 100 });
            }
          },
        });
        self.postMessage({ type: 'init-done' });
      } catch (err) {
        // If WebGPU init fails, retry with WASM
        if (msg.device === 'webgpu' && !tts) {
          try {
            console.warn('[NarrationWorker] WebGPU init failed, retrying with WASM');
            tts = await KokoroTTS.from_pretrained(msg.modelId, {
              dtype: msg.dtype,
              device: 'wasm',
              progress_callback: (progress: { status: string; progress?: number }) => {
                if (progress.progress != null) {
                  self.postMessage({ type: 'init-progress', progress: progress.progress / 100 });
                }
              },
            });
            self.postMessage({ type: 'init-done' });
          } catch (fallbackErr) {
            self.postMessage({ type: 'init-error', error: String(fallbackErr) });
          }
        } else {
          self.postMessage({ type: 'init-error', error: String(err) });
        }
      }
      break;
    }

    case 'speak': {
      if (!tts) {
        self.postMessage({ type: 'speak-error', error: 'Model not loaded', id: msg.id });
        return;
      }

      currentSpeakId = msg.id;
      aborted = false;

      try {
        const result = await tts.generate(msg.text, {
          voice: msg.voice,
          speed: msg.speed,
        });

        if (aborted) {
          self.postMessage({ type: 'stopped', id: msg.id });
          return;
        }

        // RawAudio has .audio (Float32Array) and .sampling_rate
        const audioData = result.audio;
        const sampleRate = result.sampling_rate;

        self.postMessage(
          { type: 'audio', audio: audioData, sampleRate, id: msg.id },
          // Transfer the underlying buffer for zero-copy
          [audioData.buffer],
        );
      } catch (err) {
        if (!aborted) {
          self.postMessage({ type: 'speak-error', error: String(err), id: msg.id });
        }
      } finally {
        currentSpeakId = null;
      }
      break;
    }

    case 'stop': {
      aborted = true;
      if (currentSpeakId) {
        self.postMessage({ type: 'stopped', id: currentSpeakId });
      }
      break;
    }
  }
};
