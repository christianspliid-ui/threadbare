// ── NarrationService ────────────────────────────────────────────────
// Dual-mode TTS: probes local Python server on localhost, falls back to
// browser-side Web Worker (kokoro-js) on deployed origins. Player must
// opt-in to the ~92MB model download.

import type { TtsBackend, NarrationStatus } from './TtsBackend';
import { ServerBackend } from './ServerBackend';
import { WorkerBackend } from './WorkerBackend';
import {
  NARRATION_VOICE,
  NARRATION_SPEED,
  NARRATION_TTS_SERVER_URL,
} from './narrationConstants';

export type { NarrationStatus };

export type NarrationListener = (state: NarrationState) => void;

export interface NarrationState {
  status: NarrationStatus;
  loadProgress: number;
  error: string | null;
  backendType: 'server' | 'worker' | null;
}

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

let instance: NarrationServiceImpl | null = null;

class NarrationServiceImpl {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private abortController: AbortController | null = null;
  private speakCounter = 0;
  private currentSpeakId = 0;
  private backend: TtsBackend | null = null;

  private _status: NarrationStatus = 'idle';
  private _loadProgress = 0;
  private _error: string | null = null;
  private _cachedState: NarrationState = {
    status: 'idle', loadProgress: 0, error: null, backendType: null,
  };
  private listeners = new Set<NarrationListener>();

  // ── Public state ──────────────────────────────────────────────

  get status(): NarrationStatus { return this._status; }
  get loadProgress(): number { return this._loadProgress; }
  get error(): string | null { return this._error; }
  get isSpeaking(): boolean { return this._status === 'speaking'; }
  get backendType(): 'server' | 'worker' | null { return this.backend?.type ?? null; }

  /** Returns a cached snapshot — same reference if nothing changed (required by useSyncExternalStore). */
  getState(): NarrationState {
    return this._cachedState;
  }

  subscribe(listener: NarrationListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this._cachedState = {
      status: this._status,
      loadProgress: this._loadProgress,
      error: this._error,
      backendType: this.backend?.type ?? null,
    };
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

  /** Check if the TTS server is available. On non-localhost, skip server probe. */
  async init(): Promise<void> {
    if (this._status === 'loading' || this._status === 'ready') return;

    // On non-localhost origins, skip the server probe entirely.
    // A fetch to http://localhost:3001 from HTTPS is mixed-content-blocked.
    const hostname = window.location.hostname;
    if (!LOCAL_HOSTNAMES.includes(hostname)) {
      this.setStatus('available');
      return;
    }

    // On localhost, probe the Python server
    this.setStatus('loading');
    this._loadProgress = 0.5;
    this.notify();

    try {
      const serverBackend = new ServerBackend(NARRATION_TTS_SERVER_URL);
      await serverBackend.init();
      this.backend = serverBackend;
      this._loadProgress = 1;
      this.setStatus('ready');
    } catch {
      this.setStatus('available');
    }
  }

  /** Opt-in: download the browser TTS model and initialize the worker backend. */
  async initWorker(): Promise<void> {
    if (this._status === 'ready' || this._status === 'loading') return;

    this.setStatus('loading');
    this._loadProgress = 0;
    this.notify();

    try {
      const workerBackend = new WorkerBackend();
      await workerBackend.init((progress) => {
        this._loadProgress = progress;
        this.notify();
      });
      this.backend = workerBackend;
      this._loadProgress = 1;
      this.setStatus('ready');
    } catch (err) {
      console.warn('[Narration] Worker init failed:', err);
      this.setStatus('available', String(err));
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

  /** Speak a single text block. */
  async speak(text: string, voice = NARRATION_VOICE, speed = NARRATION_SPEED): Promise<void> {
    return this.speakSections([text], voice, speed);
  }

  /** Speak multiple text sections. */
  async speakSections(sections: string[], voice = NARRATION_VOICE, speed = NARRATION_SPEED): Promise<void> {
    this.ensureAudioContext();

    if (this._status === 'loading') return;
    if (this._status !== 'ready' && this._status !== 'speaking') return;
    if (!this.backend) return;

    const filtered = sections.map(s => s.trim()).filter(Boolean);
    if (filtered.length === 0) return;

    this.stopPlayback();

    const id = ++this.speakCounter;
    this.currentSpeakId = id;
    this.setStatus('speaking');

    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      const wavBuffer = await this.backend.generateAudio(
        filtered, voice, speed, this.abortController.signal,
      );

      if (id !== this.currentSpeakId) return;

      await this.playWav(wavBuffer);
    } catch (err) {
      if (id !== this.currentSpeakId) return;
      if ((err as Error).name === 'AbortError') return;
      if ((err as Error).message === 'Stopped') {
        // Best-effort stop from worker — not an error
        this.setStatus('ready');
        return;
      }
      console.warn('[Narration] Speak failed:', err);
      this.setStatus('ready');
    }
  }

  // ── Stop ──────────────────────────────────────────────────────

  stop(): void {
    this.stopPlayback();
    this.abortController?.abort();
    this.backend?.stop();
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
    this.backend?.dispose();
    this.backend = null;
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

/** Reset the singleton — for testing only. */
export function _resetNarrationService(): void {
  instance?.dispose();
  instance = null;
}
