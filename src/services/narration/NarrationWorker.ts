// ── Narration Web Worker ────────────────────────────────────────────
// Runs Kokoro TTS inference off the main thread using the streaming API.
// Yields audio per-sentence via audio-chunk messages so playback can
// start before the full text is synthesized.
//
// Message protocol:
//   Main → Worker: { type: 'init', modelId, dtype, device }
//   Main → Worker: { type: 'speak', text, voice, speed, id }
//   Main → Worker: { type: 'stop' }
//   Worker → Main: { type: 'init-progress', progress }
//   Worker → Main: { type: 'init-done' }
//   Worker → Main: { type: 'init-error', error }
//   Worker → Main: { type: 'audio-chunk', audio: Float32Array, sampleRate, id }
//   Worker → Main: { type: 'audio-done', id }
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
        tts = await KokoroTTS.from_pretrained(msg.modelId, {
          dtype: msg.dtype,
          device: msg.device,
          progress_callback: (progress: { status: string; progress?: number }) => {
            if (progress.progress != null) {
              self.postMessage({ type: 'init-progress', progress: progress.progress / 100 });
            }
          },
        });
        self.postMessage({ type: 'init-done' });
      } catch (err) {
        self.postMessage({ type: 'init-error', error: String(err) });
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
        const stream = tts.stream(msg.text, {
          voice: msg.voice,
          speed: msg.speed,
        });

        for await (const chunk of stream) {
          if (aborted) {
            self.postMessage({ type: 'stopped', id: msg.id });
            return;
          }

          const audioData = chunk.audio.audio;
          const sampleRate = chunk.audio.sampling_rate;

          self.postMessage(
            { type: 'audio-chunk', audio: audioData, sampleRate, id: msg.id },
            [audioData.buffer],
          );
        }

        if (!aborted) {
          self.postMessage({ type: 'audio-done', id: msg.id });
        }
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
