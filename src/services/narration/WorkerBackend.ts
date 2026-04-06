// ── Worker TTS Backend ─────────────────────────────────────────────
// Delegates speech synthesis to a Web Worker running kokoro-js (ONNX WASM).
// Best-effort stop: kokoro-js generate() has no abort signal, so stop()
// flips a flag and suppresses the result. The player sees instant stop.

import type { TtsBackend } from './TtsBackend';
import {
  NARRATION_WORKER_MODEL_ID,
  NARRATION_WORKER_DTYPE,
  NARRATION_WORKER_DEVICE,
  NARRATION_WORKER_SECTION_SILENCE,
} from './narrationConstants';

type WorkerFactory = () => Worker;

/** Encode Float32Array PCM + sample rate into a WAV ArrayBuffer. */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Generate a Float32Array of silence at the given sample rate and duration. */
function silenceBuffer(sampleRate: number, durationSec: number): Float32Array {
  return new Float32Array(Math.round(sampleRate * durationSec));
}

let idCounter = 0;

export class WorkerBackend implements TtsBackend {
  readonly type = 'worker' as const;

  private worker: Worker | null = null;
  private readonly workerFactory: WorkerFactory;
  private pendingInit: {
    resolve: () => void;
    reject: (err: Error) => void;
    onProgress?: (p: number) => void;
  } | null = null;
  private pendingSpeak: {
    id: string;
    resolve: (audio: Float32Array, sampleRate: number) => void;
    reject: (err: Error) => void;
  } | null = null;

  constructor(workerFactory?: WorkerFactory) {
    this.workerFactory = workerFactory ?? (() =>
      new Worker(new URL('./NarrationWorker.ts', import.meta.url), { type: 'module' })
    );
  }

  async init(onProgress?: (progress: number) => void): Promise<void> {
    this.worker = this.workerFactory();
    this.worker.onmessage = (e) => this.handleMessage(e.data);
    this.worker.onerror = (e) => this.handleError(e);

    return new Promise<void>((resolve, reject) => {
      this.pendingInit = { resolve, reject, onProgress };
      this.worker!.postMessage({
        type: 'init',
        modelId: NARRATION_WORKER_MODEL_ID,
        dtype: NARRATION_WORKER_DTYPE,
        device: NARRATION_WORKER_DEVICE,
      });
    });
  }

  async generateAudio(
    sections: string[],
    voice: string,
    speed: number,
    _signal: AbortSignal,
  ): Promise<ArrayBuffer> {
    if (!this.worker) throw new Error('Worker not initialized');

    const allSamples: Float32Array[] = [];
    let finalSampleRate = 24000;

    for (let i = 0; i < sections.length; i++) {
      const { audio, sampleRate } = await this.speakOne(sections[i], voice, speed);
      finalSampleRate = sampleRate;
      allSamples.push(audio);

      // Add silence gap between sections (not after the last one)
      if (i < sections.length - 1) {
        allSamples.push(silenceBuffer(sampleRate, NARRATION_WORKER_SECTION_SILENCE));
      }
    }

    // Concatenate all buffers
    const totalLength = allSamples.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of allSamples) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    return encodeWav(combined, finalSampleRate);
  }

  stop(): void {
    this.worker?.postMessage({ type: 'stop' });
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pendingInit = null;
    this.pendingSpeak = null;
  }

  // ── Private ──────────────────────────────────────────────────────

  private speakOne(
    text: string,
    voice: string,
    speed: number,
  ): Promise<{ audio: Float32Array; sampleRate: number }> {
    return new Promise((resolve, reject) => {
      const id = `speak-${++idCounter}`;
      this.pendingSpeak = {
        id,
        resolve: (audio, sampleRate) => resolve({ audio, sampleRate }),
        reject,
      };
      this.worker!.postMessage({ type: 'speak', text, voice, speed, id });
    });
  }

  private handleMessage(msg: { type: string; [key: string]: unknown }) {
    switch (msg.type) {
      case 'init-progress':
        this.pendingInit?.onProgress?.(msg.progress as number);
        break;
      case 'init-done':
        this.pendingInit?.resolve();
        this.pendingInit = null;
        break;
      case 'init-error':
        this.pendingInit?.reject(new Error(msg.error as string));
        this.pendingInit = null;
        break;
      case 'audio': {
        if (this.pendingSpeak && this.pendingSpeak.id === msg.id) {
          this.pendingSpeak.resolve(msg.audio as Float32Array, msg.sampleRate as number);
          this.pendingSpeak = null;
        }
        break;
      }
      case 'speak-error': {
        if (this.pendingSpeak && this.pendingSpeak.id === msg.id) {
          this.pendingSpeak.reject(new Error(msg.error as string));
          this.pendingSpeak = null;
        }
        break;
      }
      case 'stopped':
        // Best-effort stop completed — resolve pending speak as rejected
        if (this.pendingSpeak) {
          this.pendingSpeak.reject(new Error('Stopped'));
          this.pendingSpeak = null;
        }
        break;
    }
  }

  private handleError(_e: ErrorEvent) {
    // Worker crashed — reject any pending operations
    if (this.pendingInit) {
      this.pendingInit.reject(new Error('Worker crashed during init'));
      this.pendingInit = null;
    }
    if (this.pendingSpeak) {
      this.pendingSpeak.reject(new Error('Worker crashed during speech'));
      this.pendingSpeak = null;
    }
    this.worker = null;
  }
}
