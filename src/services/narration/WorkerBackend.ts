// ── Worker TTS Backend ─────────────────────────────────────────────
// Delegates speech synthesis to a Web Worker running kokoro-js (ONNX).
// Uses the streaming API: worker posts audio-chunk messages per sentence,
// which are relayed to NarrationService for immediate playback.
// Best-effort stop: stop() flips the worker's aborted flag; the player
// sees instant stop because playback is cut on the main thread.

import type { TtsBackend } from './TtsBackend';
import {
  NARRATION_WORKER_MODEL_ID,
  NARRATION_WORKER_DTYPE,
  NARRATION_WORKER_DEVICE,
} from './narrationConstants';

type WorkerFactory = () => Worker;

/** Encode Float32Array PCM + sample rate into a WAV ArrayBuffer. */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

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
    onChunk?: (audio: Float32Array, sampleRate: number) => void;
    resolve: () => void;
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
    onChunk?: (audio: Float32Array, sampleRate: number) => void,
  ): Promise<ArrayBuffer | null> {
    if (!this.worker) throw new Error('Worker not initialized');

    // Join sections into one text — the streaming API splits by sentence automatically
    const text = sections.join('. ');

    return new Promise<ArrayBuffer | null>((resolve, reject) => {
      const id = `speak-${++idCounter}`;
      this.pendingSpeak = { id, onChunk, resolve: () => resolve(null), reject };
      this.worker!.postMessage({ type: 'speak', text, voice, speed, id });
    });
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
      case 'audio-chunk': {
        if (this.pendingSpeak && this.pendingSpeak.id === msg.id) {
          this.pendingSpeak.onChunk?.(msg.audio as Float32Array, msg.sampleRate as number);
        }
        break;
      }
      case 'audio-done': {
        if (this.pendingSpeak && this.pendingSpeak.id === msg.id) {
          this.pendingSpeak.resolve();
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
        if (this.pendingSpeak) {
          this.pendingSpeak.reject(new Error('Stopped'));
          this.pendingSpeak = null;
        }
        break;
    }
  }

  private handleError(_e: ErrorEvent) {
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
