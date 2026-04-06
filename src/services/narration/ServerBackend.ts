// ── Server TTS Backend ─────────────────────────────────────────────
// Delegates speech synthesis to the local Python TTS server (tts-server.py).

import type { TtsBackend } from './TtsBackend';
import { NARRATION_SERVER_PROBE_TIMEOUT } from './narrationConstants';

export class ServerBackend implements TtsBackend {
  readonly type = 'server' as const;

  constructor(private readonly serverUrl: string) {}

  async init(): Promise<void> {
    const res = await fetch(`${this.serverUrl}/health`, {
      signal: AbortSignal.timeout(NARRATION_SERVER_PROBE_TIMEOUT),
    });
    if (!res.ok) throw new Error(`TTS server returned ${res.status}`);
  }

  async generateAudio(
    sections: string[],
    voice: string,
    speed: number,
    signal: AbortSignal,
    _onChunk?: (audio: Float32Array, sampleRate: number) => void,
  ): Promise<ArrayBuffer> {
    const res = await fetch(this.serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections, voice, speed }),
      signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`TTS server error ${res.status}: ${errText}`);
    }
    return res.arrayBuffer();
  }

  stop(): void {
    // Server backend has no in-flight work to cancel —
    // the AbortSignal on generateAudio handles cancellation.
  }

  dispose(): void {
    // Nothing to clean up.
  }
}
