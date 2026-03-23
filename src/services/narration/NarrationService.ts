// ── NarrationService ────────────────────────────────────────────────
// Calls the local Kokoro TTS server (tts-server.py) for GPU-accelerated
// speech synthesis. Falls back to error state if server is unavailable.

import {
  NARRATION_VOICE,
  NARRATION_SPEED,
  NARRATION_MAX_TEXT_LENGTH,
  NARRATION_TTS_SERVER_URL,
} from './narrationConstants';

export type NarrationStatus = 'idle' | 'loading' | 'ready' | 'speaking' | 'error';

export type NarrationListener = (state: NarrationState) => void;

export interface NarrationState {
  status: NarrationStatus;
  loadProgress: number;
  error: string | null;
}

let instance: NarrationServiceImpl | null = null;

class NarrationServiceImpl {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private abortController: AbortController | null = null;
  private speakCounter = 0;
  private currentSpeakId = 0;

  private _status: NarrationStatus = 'idle';
  private _loadProgress = 0;
  private _error: string | null = null;
  private _cachedState: NarrationState = { status: 'idle', loadProgress: 0, error: null };
  private listeners = new Set<NarrationListener>();

  // ── Public state ──────────────────────────────────────────────

  get status(): NarrationStatus { return this._status; }
  get loadProgress(): number { return this._loadProgress; }
  get error(): string | null { return this._error; }
  get isSpeaking(): boolean { return this._status === 'speaking'; }

  /** Returns a cached snapshot — same reference if nothing changed (required by useSyncExternalStore). */
  getState(): NarrationState {
    return this._cachedState;
  }

  subscribe(listener: NarrationListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this._cachedState = { status: this._status, loadProgress: this._loadProgress, error: this._error };
    const state = this._cachedState;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  private setStatus(status: NarrationStatus, error?: string) {
    this._status = status;
    if (error !== undefined) this._error = error;
    this.notify();
  }

  // ── Init ──────────────────────────────────────────────────────

  /** Check if the TTS server is available. */
  async init(): Promise<void> {
    if (this._status === 'loading' || this._status === 'ready') return;

    this.setStatus('loading');
    this._loadProgress = 0.5;
    this.notify();

    try {
      const res = await fetch(`${NARRATION_TTS_SERVER_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      this._loadProgress = 1;
      this.setStatus('ready');
    } catch {
      // Server not running — that's OK, narration just won't work
      this.setStatus('error', 'TTS server not available. Start it with: .venv/Scripts/python.exe tts-server.py');
    }
  }

  /** Ensure AudioContext exists — call from a user gesture to satisfy autoplay policy. */
  ensureAudioContext(): void {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // ── Speak ─────────────────────────────────────────────────────

  async speak(text: string, voice = NARRATION_VOICE, speed = NARRATION_SPEED): Promise<void> {
    this.ensureAudioContext();

    if (this._status === 'loading') return;
    if (this._status === 'idle' || this._status === 'error') {
      await this.init();
      if (this._status !== 'ready') return;
    }

    // Stop any current playback
    this.stopPlayback();

    // Truncate at sentence boundary if too long
    let truncated = text;
    if (text.length > NARRATION_MAX_TEXT_LENGTH) {
      const cutoff = text.lastIndexOf('.', NARRATION_MAX_TEXT_LENGTH);
      truncated = cutoff > 0 ? text.slice(0, cutoff + 1) : text.slice(0, NARRATION_MAX_TEXT_LENGTH);
    }

    const id = ++this.speakCounter;
    this.currentSpeakId = id;
    this.setStatus('speaking');

    // Cancel any in-flight request
    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      const res = await fetch(`${NARRATION_TTS_SERVER_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: truncated, voice, speed }),
        signal: this.abortController.signal,
      });

      if (id !== this.currentSpeakId) return; // Stale

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`TTS server error ${res.status}: ${errText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (id !== this.currentSpeakId) return; // Stale

      await this.playWav(arrayBuffer);
    } catch (err) {
      if (id !== this.currentSpeakId) return;
      if ((err as Error).name === 'AbortError') return;
      console.error('[NarrationService] Speak failed:', err);
      this.setStatus('ready');
    }
  }

  // ── Stop ──────────────────────────────────────────────────────

  stop(): void {
    this.stopPlayback();
    this.abortController?.abort();
    if (this._status === 'speaking') {
      this.setStatus('ready');
    }
  }

  private stopPlayback() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
      this.currentSource = null;
    }
  }

  // ── Audio playback ────────────────────────────────────────────

  private async playWav(wavBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    const audioBuffer = await this.audioCtx.decodeAudioData(wavBuffer);

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
        this.setStatus('ready');
      }
    };

    this.currentSource = source;
    source.start();
  }

  // ── Cleanup ───────────────────────────────────────────────────

  dispose() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this._status = 'idle';
    this._loadProgress = 0;
    this.listeners.clear();
  }
}

/** Get the singleton NarrationService instance. */
export function getNarrationService(): NarrationServiceImpl {
  if (!instance) {
    instance = new NarrationServiceImpl();
  }
  return instance;
}
