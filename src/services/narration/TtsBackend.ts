// ── TTS Backend Interface ──────────────────────────────────────────
// Strategy pattern: NarrationService delegates to one of these.

export type NarrationStatus = 'idle' | 'loading' | 'available' | 'ready' | 'speaking' | 'error';

export interface TtsBackend {
  readonly type: 'server' | 'worker';
  init(onProgress?: (progress: number) => void): Promise<void>;
  generateAudio(
    sections: string[],
    voice: string,
    speed: number,
    signal: AbortSignal,
    onChunk?: (audio: Float32Array, sampleRate: number) => void,
  ): Promise<ArrayBuffer | null>;
  stop(): void;
  dispose(): void;
}
