// ── NarrationService ────────────────────────────────────────────────
// Public API wrapping the narration Web Worker. Handles model loading,
// text-to-speech, playback via Web Audio API, and lifecycle management.

import {
  NARRATION_MODEL_ID,
  NARRATION_DTYPE,
  NARRATION_DEVICE,
  NARRATION_VOICE,
  NARRATION_SPEED,
  NARRATION_SAMPLE_RATE,
  NARRATION_MAX_TEXT_LENGTH,
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
  private worker: Worker | null = null;
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private speakCounter = 0;
  private currentSpeakId: string | null = null;

  private _status: NarrationStatus = 'idle';
  private _loadProgress = 0;
  private _error: string | null = null;
  private listeners = new Set<NarrationListener>();

  // ── Public state ──────────────────────────────────────────────

  get status(): NarrationStatus { return this._status; }
  get loadProgress(): number { return this._loadProgress; }
  get error(): string | null { return this._error; }
  get isSpeaking(): boolean { return this._status === 'speaking'; }

  getState(): NarrationState {
    return { status: this._status, loadProgress: this._loadProgress, error: this._error };
  }

  subscribe(listener: NarrationListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const state = this.getState();
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

  async init(): Promise<void> {
    if (this._status === 'loading' || this._status === 'ready') return;

    this.setStatus('loading');
    this._loadProgress = 0;

    try {
      // Create worker using Vite's worker import pattern
      this.worker = new Worker(
        new URL('./NarrationWorker.ts', import.meta.url),
        { type: 'module' },
      );

      this.worker.onmessage = (e: MessageEvent) => this.handleWorkerMessage(e.data);
      this.worker.onerror = (e: ErrorEvent) => {
        console.error('[NarrationService] Worker error:', e.message);
        this.setStatus('error', e.message);
      };

      // Initialize AudioContext from user gesture context (caller ensures this)
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext({ sampleRate: NARRATION_SAMPLE_RATE });
      }

      // Tell worker to load the model
      this.worker.postMessage({
        type: 'init',
        modelId: NARRATION_MODEL_ID,
        dtype: NARRATION_DTYPE,
        device: NARRATION_DEVICE,
      });
    } catch (err) {
      console.error('[NarrationService] Init failed:', err);
      this.setStatus('error', String(err));
    }
  }

  // ── Speak ─────────────────────────────────────────────────────

  async speak(text: string, voice = NARRATION_VOICE, speed = NARRATION_SPEED): Promise<void> {
    if (!this.worker || this._status === 'loading') return;

    // If not ready, auto-init (but this shouldn't happen in normal flow)
    if (this._status === 'idle' || this._status === 'error') {
      await this.init();
      // Wait for ready — the speak will be triggered after init completes
      return;
    }

    // Stop any current playback
    this.stopPlayback();

    // Truncate at sentence boundary if too long
    let truncated = text;
    if (text.length > NARRATION_MAX_TEXT_LENGTH) {
      const cutoff = text.lastIndexOf('.', NARRATION_MAX_TEXT_LENGTH);
      truncated = cutoff > 0 ? text.slice(0, cutoff + 1) : text.slice(0, NARRATION_MAX_TEXT_LENGTH);
    }

    const id = String(++this.speakCounter);
    this.currentSpeakId = id;
    this.setStatus('speaking');

    this.worker.postMessage({
      type: 'speak',
      text: truncated,
      voice,
      speed,
      id,
    });
  }

  // ── Stop ──────────────────────────────────────────────────────

  stop(): void {
    this.stopPlayback();
    if (this.worker) {
      this.worker.postMessage({ type: 'stop' });
    }
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

  // ── Worker message handler ────────────────────────────────────

  private handleWorkerMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case 'init-progress': {
        this._loadProgress = msg.progress as number;
        this.notify();
        break;
      }

      case 'init-done': {
        this._loadProgress = 1;
        this.setStatus('ready');
        break;
      }

      case 'init-error': {
        console.error('[NarrationService] Model load failed:', msg.error);
        this.setStatus('error', msg.error as string);
        break;
      }

      case 'audio': {
        if (msg.id !== this.currentSpeakId) return; // Stale response
        this.playAudio(msg.audio as Float32Array, msg.sampleRate as number);
        break;
      }

      case 'speak-error': {
        if (msg.id !== this.currentSpeakId) return;
        console.error('[NarrationService] Speak failed:', msg.error);
        this.setStatus('ready');
        break;
      }

      case 'stopped': {
        if (msg.id !== this.currentSpeakId) return;
        this.setStatus('ready');
        break;
      }
    }
  }

  // ── Audio playback ────────────────────────────────────────────

  private playAudio(audioData: Float32Array, sampleRate: number) {
    if (!this.audioCtx) return;

    // Resume AudioContext if suspended (autoplay policy)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const buffer = this.audioCtx.createBuffer(1, audioData.length, sampleRate);
    buffer.copyToChannel(audioData, 0);

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
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
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
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
