// ── NarrationService ────────────────────────────────────────────────
// Dual-mode TTS: probes local Python server on localhost, falls back to
// browser-side Web Worker (kokoro-js) on deployed origins. Player must
// opt-in to the ~92MB model download.
//
// Streaming playback: worker backend streams audio chunks per sentence.
// Each chunk is queued and played sequentially — the player hears audio
// within 1-2 seconds while the rest generates in the background.

import type { TtsBackend, NarrationStatus } from './TtsBackend';
import { ServerBackend } from './ServerBackend';
import { WorkerBackend, encodeWav } from './WorkerBackend';
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

  /** Queue of WAV buffers waiting to be played (streaming mode). */
  private chunkQueue: ArrayBuffer[] = [];
  /** True while a chunk is currently playing. */
  private isPlayingChunk = false;
  /** True when generateAudio has resolved (no more chunks coming). */
  private streamDone = false;

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

  async init(): Promise<void> {
    if (this._status === 'loading' || this._status === 'ready') return;

    const hostname = window.location.hostname;
    if (!LOCAL_HOSTNAMES.includes(hostname)) {
      this.setStatus('available');
      return;
    }

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
    return this.speakSections([text], voice, speed);
  }

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

    // Reset streaming state
    this.chunkQueue = [];
    this.isPlayingChunk = false;
    this.streamDone = false;

    try {
      const result = await this.backend.generateAudio(
        filtered, voice, speed, this.abortController.signal,
        // onChunk callback — only used by WorkerBackend (streaming)
        (audio: Float32Array, sampleRate: number) => {
          if (id !== this.currentSpeakId) return;
          const wavBuffer = encodeWav(audio, sampleRate);
          this.chunkQueue.push(wavBuffer);
          this.playNextChunk(id);
        },
      );

      if (id !== this.currentSpeakId) return;

      if (result) {
        // Non-streaming path (ServerBackend returns full WAV)
        await this.playWav(result);
      } else {
        // Streaming path — mark stream as done so playNextChunk
        // knows to set status=ready after the last chunk finishes
        this.streamDone = true;
        // If nothing is playing and queue is empty, we're done
        if (!this.isPlayingChunk && this.chunkQueue.length === 0) {
          this.setStatus('ready');
        }
      }
    } catch (err) {
      if (id !== this.currentSpeakId) return;
      if ((err as Error).name === 'AbortError') return;
      if ((err as Error).message === 'Stopped') {
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
    // Clear chunk queue
    this.chunkQueue = [];
    this.isPlayingChunk = false;
    this.streamDone = false;

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

  /** Play a single complete WAV buffer (non-streaming path: ServerBackend). */
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

  /** Play the next queued chunk (streaming path: WorkerBackend). */
  private async playNextChunk(speakId: number): Promise<void> {
    if (this.isPlayingChunk) return; // Already playing, will chain via onended
    if (speakId !== this.currentSpeakId) return;

    const wavBuffer = this.chunkQueue.shift();
    if (!wavBuffer) {
      // No chunks available — if stream is done, we're finished
      if (this.streamDone) {
        this.isPlayingChunk = false;
        this.setStatus('ready');
      }
      return;
    }

    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.isPlayingChunk = true;

    try {
      const audioBuffer = await this.audioCtx.decodeAudioData(wavBuffer);

      if (speakId !== this.currentSpeakId) return;

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioCtx.destination);
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
          this.isPlayingChunk = false;
          this.playNextChunk(speakId);
        }
      };

      this.currentSource = source;
      source.start();
    } catch (err) {
      console.warn('[Narration] Chunk decode failed:', err);
      this.isPlayingChunk = false;
      this.playNextChunk(speakId); // Skip bad chunk, try next
    }
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
