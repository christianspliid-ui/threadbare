# Dual-Mode TTS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the existing `NarrationWorker.ts` as a browser-side TTS backend alongside the current Python server backend, with automatic fallback and explicit player opt-in for model download. Spec: `Docs/plans/2026-04-06-dual-mode-tts-design.md`.

**Architecture:** Strategy pattern — `NarrationService` delegates to a `TtsBackend` interface (`ServerBackend` or `WorkerBackend`). On localhost, probes the Python server first; on deployed origins, skips the probe and offers the browser worker directly. Player must explicitly opt-in to the ~92MB model download.

**Tech Stack:** TypeScript, React hooks, Web Workers, `kokoro-js` (already in `package.json`), ONNX Runtime WASM, Vite.

**Residual risks:**
- COOP/COEP headers and worker init must be verified on the actual deployed Vercel URL (unit tests can't prove HTTPS/runtime behavior). Task 9 covers this.
- Hook/UI mock updates are required implementation work, not optional cleanup. Task 7 covers this.

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/services/narration/TtsBackend.ts` | **New.** Interface + `NarrationStatus` type (includes `'available'`). |
| `src/services/narration/ServerBackend.ts` | **New.** Implements `TtsBackend` via `fetch` to Python server. |
| `src/services/narration/WorkerBackend.ts` | **New.** Implements `TtsBackend` via Web Worker + `NarrationWorker.ts`. |
| `src/services/narration/narrationConstants.ts` | **Edit.** Add worker model constants. |
| `src/services/narration/NarrationService.ts` | **Edit.** Refactor to use `TtsBackend`, add origin check, `available` state, `initWorker()`. |
| `src/services/narration/NarrationWorker.ts` | **No change.** Already correct. |
| `src/services/narration/useNarration.ts` | **Edit.** Expose `initWorker`, `isAvailable`, `backendType`. Change `enabled` derivation. |
| `src/components/Game/HexChronicle.tsx` | **Edit.** Add opt-in button for `available` state. |
| `src/components/Game/LocationView.tsx` | **Edit.** Same. |
| `src/components/Game/encounter-stage/EncounterStage.tsx` | **Edit.** Same. |
| `src/components/Game/TieredEncounterModal.tsx` | **Edit.** Same. |
| `src/components/Game/encounter-stage/__tests__/EncounterStage.test.tsx` | **Edit.** Update mock shape. |
| `src/services/narration/__tests__/ServerBackend.test.ts` | **New.** Unit tests for server fetch logic. |
| `src/services/narration/__tests__/WorkerBackend.test.ts` | **New.** Unit tests for worker message protocol. |
| `src/services/narration/__tests__/NarrationService.test.ts` | **New.** Integration tests for dual-mode init. |
| `vercel.json` | **Edit.** Add COOP/COEP headers. |

---

### Task 1: Constants + Interface

**Files:**
- Edit: `src/services/narration/narrationConstants.ts`
- Create: `src/services/narration/TtsBackend.ts`

- [ ] **Step 1: Add worker constants to `narrationConstants.ts`**

Add these after the existing constants:

```typescript
/** HuggingFace model ID for browser-side TTS. */
export const NARRATION_WORKER_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

/** ONNX quantization level — q8 is ~92MB, good quality/size tradeoff. */
export const NARRATION_WORKER_DTYPE = 'q8';

/** WASM by default; kokoro-js auto-upgrades to WebGPU if available. */
export const NARRATION_WORKER_DEVICE = 'wasm';

/** Timeout for probing the Python TTS server (ms). */
export const NARRATION_SERVER_PROBE_TIMEOUT = 5000;

/** Silence duration between sections in worker mode (seconds). */
export const NARRATION_WORKER_SECTION_SILENCE = 0.6;
```

- [ ] **Step 2: Create `TtsBackend.ts` with interface and status type**

```typescript
// ── TTS Backend Interface ──────────────────────────────────────────
// Strategy pattern: NarrationService delegates to one of these.

export type NarrationStatus = 'idle' | 'loading' | 'available' | 'ready' | 'speaking' | 'error';

export interface TtsBackend {
  readonly type: 'server' | 'worker';
  init(onProgress?: (progress: number) => void): Promise<void>;
  generateAudio(sections: string[], voice: string, speed: number, signal: AbortSignal): Promise<ArrayBuffer>;
  stop(): void;
  dispose(): void;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: clean (new files are standalone, no imports from them yet)

- [ ] **Step 4: Commit**

```bash
git add src/services/narration/narrationConstants.ts src/services/narration/TtsBackend.ts
git commit -m "feat(tts): add TtsBackend interface and worker constants"
```

---

### Task 2: ServerBackend

**Files:**
- Create: `src/services/narration/ServerBackend.ts`
- Create: `src/services/narration/__tests__/ServerBackend.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerBackend } from '../ServerBackend';

const TTS_URL = 'http://localhost:3001/api/tts';

describe('ServerBackend', () => {
  let backend: ServerBackend;

  beforeEach(() => {
    backend = new ServerBackend(TTS_URL);
    vi.restoreAllMocks();
  });

  describe('init', () => {
    it('succeeds when server health check returns ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));
      await expect(backend.init()).resolves.toBeUndefined();
    });

    it('throws when server health check fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
      await expect(backend.init()).rejects.toThrow();
    });

    it('throws when fetch rejects (server not running)', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
      await expect(backend.init()).rejects.toThrow();
    });
  });

  describe('generateAudio', () => {
    it('sends sections, voice, speed and returns ArrayBuffer', async () => {
      const wavBytes = new Uint8Array([1, 2, 3, 4]).buffer;
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(wavBytes, { status: 200, headers: { 'Content-Type': 'audio/wav' } }),
      );

      const signal = new AbortController().signal;
      const result = await backend.generateAudio(['Hello'], 'bm_george', 0.87, signal);

      expect(result).toBeInstanceOf(ArrayBuffer);
      const call = vi.mocked(fetch).mock.calls[0];
      expect(call[0]).toBe(TTS_URL);
      const body = JSON.parse(call[1]!.body as string);
      expect(body).toEqual({ sections: ['Hello'], voice: 'bm_george', speed: 0.87 });
    });

    it('throws on non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Server error', { status: 500 }));
      const signal = new AbortController().signal;
      await expect(backend.generateAudio(['Hi'], 'bm_george', 1, signal)).rejects.toThrow('500');
    });

    it('passes abort signal to fetch', async () => {
      const controller = new AbortController();
      controller.abort();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('Aborted', 'AbortError'));
      await expect(backend.generateAudio(['Hi'], 'bm_george', 1, controller.signal)).rejects.toThrow();
    });
  });

  describe('type', () => {
    it('is "server"', () => {
      expect(backend.type).toBe('server');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/narration/__tests__/ServerBackend.test.ts`
Expected: FAIL — `ServerBackend` does not exist yet.

- [ ] **Step 3: Implement `ServerBackend.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/narration/__tests__/ServerBackend.test.ts`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/narration/ServerBackend.ts src/services/narration/__tests__/ServerBackend.test.ts
git commit -m "feat(tts): add ServerBackend with tests"
```

---

### Task 3: WorkerBackend

**Files:**
- Create: `src/services/narration/WorkerBackend.ts`
- Create: `src/services/narration/__tests__/WorkerBackend.test.ts`

- [ ] **Step 1: Write the failing tests**

The tests mock the Web Worker since we can't run actual ONNX inference in vitest. We simulate the worker's message protocol.

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkerBackend } from '../WorkerBackend';

// Mock Worker class that lets us simulate messages
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  // Test helper: simulate worker posting back
  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
  simulateError(message: string) {
    this.onerror?.(new ErrorEvent('error', { message }));
  }
}

// We need to intercept the Worker constructor. WorkerBackend creates
// the worker internally, so we patch the module to accept a factory.
// Alternative: pass a worker factory to the constructor for testability.

describe('WorkerBackend', () => {
  let mockWorker: MockWorker;
  let backend: WorkerBackend;

  beforeEach(() => {
    mockWorker = new MockWorker();
    // WorkerBackend accepts an optional worker factory for testing
    backend = new WorkerBackend(() => mockWorker as unknown as Worker);
  });

  afterEach(() => {
    backend.dispose();
  });

  describe('init', () => {
    it('sends init message and resolves on init-done', async () => {
      const initPromise = backend.init((p) => { /* progress */ });

      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'init' }),
      );

      mockWorker.simulateMessage({ type: 'init-done' });
      await expect(initPromise).resolves.toBeUndefined();
    });

    it('relays progress callbacks', async () => {
      const progress: number[] = [];
      const initPromise = backend.init((p) => progress.push(p));

      mockWorker.simulateMessage({ type: 'init-progress', progress: 0.5 });
      mockWorker.simulateMessage({ type: 'init-progress', progress: 0.9 });
      mockWorker.simulateMessage({ type: 'init-done' });

      await initPromise;
      expect(progress).toEqual([0.5, 0.9]);
    });

    it('rejects on init-error', async () => {
      const initPromise = backend.init();
      mockWorker.simulateMessage({ type: 'init-error', error: 'WASM failed' });
      await expect(initPromise).rejects.toThrow('WASM failed');
    });
  });

  describe('generateAudio', () => {
    beforeEach(async () => {
      const p = backend.init();
      mockWorker.simulateMessage({ type: 'init-done' });
      await p;
    });

    it('sends speak message and returns WAV ArrayBuffer', async () => {
      const signal = new AbortController().signal;
      const genPromise = backend.generateAudio(['Hello world'], 'bm_george', 0.87, signal);

      // Worker sends back audio for the section
      const audioData = new Float32Array([0.1, 0.2, 0.3]);
      const speakCall = mockWorker.postMessage.mock.calls.find(
        (c) => c[0].type === 'speak',
      );
      expect(speakCall).toBeTruthy();

      mockWorker.simulateMessage({
        type: 'audio',
        audio: audioData,
        sampleRate: 24000,
        id: speakCall![0].id,
      });

      const result = await genPromise;
      expect(result).toBeInstanceOf(ArrayBuffer);
      // Should be a valid WAV (starts with RIFF header)
      const view = new DataView(result);
      expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('RIFF');
    });

    it('rejects on speak-error', async () => {
      const signal = new AbortController().signal;
      const genPromise = backend.generateAudio(['Test'], 'bm_george', 1, signal);

      const speakCall = mockWorker.postMessage.mock.calls.find(
        (c) => c[0].type === 'speak',
      );

      mockWorker.simulateMessage({
        type: 'speak-error',
        error: 'Inference failed',
        id: speakCall![0].id,
      });

      await expect(genPromise).rejects.toThrow('Inference failed');
    });
  });

  describe('stop', () => {
    it('sends stop message to worker', async () => {
      const p = backend.init();
      mockWorker.simulateMessage({ type: 'init-done' });
      await p;

      backend.stop();
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'stop' });
    });
  });

  describe('type', () => {
    it('is "worker"', () => {
      expect(backend.type).toBe('worker');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/narration/__tests__/WorkerBackend.test.ts`
Expected: FAIL — `WorkerBackend` does not exist yet.

- [ ] **Step 3: Implement `WorkerBackend.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/narration/__tests__/WorkerBackend.test.ts`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/narration/WorkerBackend.ts src/services/narration/__tests__/WorkerBackend.test.ts
git commit -m "feat(tts): add WorkerBackend with tests"
```

---

### Task 4: Refactor NarrationService

**Files:**
- Edit: `src/services/narration/NarrationService.ts`
- Create: `src/services/narration/__tests__/NarrationService.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock before importing NarrationService
vi.mock('../ServerBackend', () => ({
  ServerBackend: vi.fn().mockImplementation(() => ({
    type: 'server',
    init: vi.fn(),
    generateAudio: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  })),
}));

vi.mock('../WorkerBackend', () => ({
  WorkerBackend: vi.fn().mockImplementation(() => ({
    type: 'worker',
    init: vi.fn(),
    generateAudio: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Reset singleton between tests
let getNarrationService: typeof import('../NarrationService').getNarrationService;
let _resetNarrationService: typeof import('../NarrationService')._resetNarrationService;
let ServerBackend: typeof import('../ServerBackend').ServerBackend;
let WorkerBackend: typeof import('../WorkerBackend').WorkerBackend;

describe('NarrationService', () => {
  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../NarrationService');
    getNarrationService = mod.getNarrationService;
    _resetNarrationService = mod._resetNarrationService;
    _resetNarrationService(); // ensure clean singleton per test
    const sbMod = await import('../ServerBackend');
    ServerBackend = sbMod.ServerBackend;
    const wbMod = await import('../WorkerBackend');
    WorkerBackend = wbMod.WorkerBackend;
  });

  describe('init on localhost', () => {
    beforeEach(() => {
      // jsdom defaults to http://localhost which is what we want
    });

    it('probes server and sets ready when server responds', async () => {
      const mockInit = vi.fn().mockResolvedValue(undefined);
      vi.mocked(ServerBackend).mockImplementation(() => ({
        type: 'server' as const,
        init: mockInit,
        generateAudio: vi.fn(),
        stop: vi.fn(),
        dispose: vi.fn(),
      }));

      const svc = getNarrationService();
      await svc.init();
      expect(svc.status).toBe('ready');
      expect(mockInit).toHaveBeenCalled();
    });

    it('sets available when server probe fails', async () => {
      vi.mocked(ServerBackend).mockImplementation(() => ({
        type: 'server' as const,
        init: vi.fn().mockRejectedValue(new Error('Connection refused')),
        generateAudio: vi.fn(),
        stop: vi.fn(),
        dispose: vi.fn(),
      }));

      const svc = getNarrationService();
      await svc.init();
      expect(svc.status).toBe('available');
    });
  });

  describe('init on non-localhost', () => {
    beforeEach(() => {
      // Simulate deployed origin
      Object.defineProperty(window, 'location', {
        value: { ...window.location, hostname: 'my-app.vercel.app' },
        writable: true,
      });
    });

    it('skips server probe and goes straight to available', async () => {
      const svc = getNarrationService();
      await svc.init();
      expect(svc.status).toBe('available');
      expect(ServerBackend).not.toHaveBeenCalled();
    });
  });

  describe('initWorker', () => {
    it('creates WorkerBackend and sets ready on success', async () => {
      const mockInit = vi.fn().mockResolvedValue(undefined);
      vi.mocked(WorkerBackend).mockImplementation(() => ({
        type: 'worker' as const,
        init: mockInit,
        generateAudio: vi.fn(),
        stop: vi.fn(),
        dispose: vi.fn(),
      }));

      const svc = getNarrationService();
      await svc.init(); // go to available
      await svc.initWorker();
      expect(svc.status).toBe('ready');
      expect(svc.backendType).toBe('worker');
    });

    it('sets available on worker init failure', async () => {
      vi.mocked(WorkerBackend).mockImplementation(() => ({
        type: 'worker' as const,
        init: vi.fn().mockRejectedValue(new Error('WASM failed')),
        generateAudio: vi.fn(),
        stop: vi.fn(),
        dispose: vi.fn(),
      }));

      const svc = getNarrationService();
      await svc.init();
      await svc.initWorker();
      // Should go back to available, not error (single failure)
      expect(svc.status).toBe('available');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/narration/__tests__/NarrationService.test.ts`
Expected: FAIL — NarrationService doesn't have the new API yet.

- [ ] **Step 3: Rewrite `NarrationService.ts`**

Replace the entire file. The new version uses `TtsBackend` and implements the origin-check + dual-mode init flow:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services/narration/__tests__/NarrationService.test.ts`
Expected: all PASS

- [ ] **Step 5: Type-check the full project**

Run: `npx tsc --noEmit`
Expected: clean. The old `NarrationStatus` type was defined inline in the old service; now it comes from `TtsBackend.ts`. Check that `useNarration.ts` still compiles (it imports from `NarrationService` — the type re-export should satisfy it).

- [ ] **Step 6: Commit**

```bash
git add src/services/narration/NarrationService.ts src/services/narration/__tests__/NarrationService.test.ts
git commit -m "feat(tts): refactor NarrationService to dual-mode with TtsBackend strategy"
```

---

### Task 5: Update `useNarration` hook

**Files:**
- Edit: `src/services/narration/useNarration.ts`

- [ ] **Step 1: Rewrite the hook**

```typescript
// ── useNarration React Hook ─────────────────────────────────────────
// Exposes NarrationService state to React components with automatic
// subscription management. Dual-mode: server or browser worker backend.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getNarrationService, type NarrationState } from './NarrationService';
import type { NarrationStatus } from './TtsBackend';
import { NARRATION_ENABLED } from './narrationConstants';

const DISABLED_STATE: NarrationState = {
  status: 'idle', loadProgress: 0, error: null, backendType: null,
};

export function useNarration() {
  const service = useRef(getNarrationService());
  const [state, setState] = useState<NarrationState>(() => {
    if (!NARRATION_ENABLED) return DISABLED_STATE;
    return service.current.getState();
  });

  useEffect(() => {
    if (!NARRATION_ENABLED) return;
    const unsubscribe = service.current.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Auto-probe on mount (checks origin, probes server on localhost)
  useEffect(() => {
    if (!NARRATION_ENABLED) return;
    service.current.init();
  }, []);

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      if (service.current.isSpeaking) {
        service.current.stop();
      }
    };
  }, []);

  const init = useCallback(async () => {
    if (!NARRATION_ENABLED) return;
    await service.current.init();
  }, []);

  /** Opt-in: download the ~92MB browser TTS model. */
  const initWorker = useCallback(async () => {
    if (!NARRATION_ENABLED) return;
    service.current.ensureAudioContext();
    await service.current.initWorker();
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!NARRATION_ENABLED) return;
    service.current.ensureAudioContext();
    await service.current.speak(text);
  }, []);

  const speakSections = useCallback(async (sections: string[]) => {
    if (!NARRATION_ENABLED) return;
    service.current.ensureAudioContext();
    await service.current.speakSections(sections);
  }, []);

  const stop = useCallback(() => {
    service.current.stop();
  }, []);

  const narrateChronicle = useCallback(async (containerEl: HTMLElement | null) => {
    if (!containerEl || !NARRATION_ENABLED) return;
    const proseElements = containerEl.querySelectorAll('.chronicle-prose');
    const sections: string[] = [];
    for (const el of proseElements) {
      const text = (el as HTMLElement).innerText?.trim();
      if (text) sections.push(text);
    }
    if (sections.length === 0) return;
    await speakSections(sections);
  }, [speakSections]);

  // Derived: enabled means feature flag is on AND status is not terminal error
  const enabled = NARRATION_ENABLED && state.status !== 'error';
  const status: NarrationStatus = state.status;

  return {
    enabled,
    status,
    backendType: state.backendType,
    loadProgress: state.loadProgress,
    error: state.error,
    isSpeaking: state.status === 'speaking',
    isLoading: state.status === 'loading',
    isAvailable: state.status === 'available',
    init,
    initWorker,
    speak,
    speakSections,
    stop,
    narrateChronicle,
  };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: clean

- [ ] **Step 3: Commit**

```bash
git add src/services/narration/useNarration.ts
git commit -m "feat(tts): update useNarration hook with dual-mode API"
```

---

### Task 6: Update UI surfaces (4 components)

**Files:**
- Edit: `src/components/Game/HexChronicle.tsx`
- Edit: `src/components/Game/LocationView.tsx`
- Edit: `src/components/Game/encounter-stage/EncounterStage.tsx`
- Edit: `src/components/Game/TieredEncounterModal.tsx`

All four follow the same pattern: add `isAvailable` and `initWorker` from the hook, add a conditional for the opt-in download button, update the visibility gate from `narrationEnabled` to `enabled && status !== 'idle'`.

- [ ] **Step 1: Update `HexChronicle.tsx`**

Change line 145:
```typescript
// OLD:
const { enabled: narrationEnabled, isLoading, isSpeaking, narrateChronicle, stop: stopNarration } = useNarration();

// NEW:
const { enabled: narrationEnabled, status: narrationStatus, isLoading, isSpeaking, isAvailable, initWorker, narrateChronicle, stop: stopNarration } = useNarration();
```

Change the `renderPlayBtn` function (around line 486):
```typescript
const renderPlayBtn = (ref: React.RefObject<HTMLDivElement | null>, chapterName: string) => {
  if (!narrationEnabled || narrationStatus === 'idle') return null;

  if (isAvailable) {
    return (
      <button
        onClick={() => initWorker()}
        title="Download voice narration (~90MB)"
        aria-label="Enable voice narration"
        style={playBtnStyle}
      >
        <Play size={10} style={{ marginLeft: '1px' }} />
      </button>
    );
  }

  return (
    <button
      onClick={() => handleNarrateChapter(ref)}
      title={isSpeaking ? 'Stop narration' : isLoading ? 'Loading...' : `Narrate ${chapterName}`}
      aria-label={isSpeaking ? 'Stop narration' : `Narrate ${chapterName}`}
      style={playBtnStyle}
    >
      {isLoading ? (
        <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
      ) : isSpeaking ? (
        <Square size={8} />
      ) : (
        <Play size={10} style={{ marginLeft: '1px' }} />
      )}
    </button>
  );
};
```

- [ ] **Step 2: Update `LocationView.tsx`**

Change line 805:
```typescript
// OLD:
const { enabled: narrationEnabled, isLoading, isSpeaking, speak, stop: stopNarration } = useNarration();

// NEW:
const { enabled: narrationEnabled, status: narrationStatus, isLoading, isSpeaking, isAvailable, initWorker, speak, stop: stopNarration } = useNarration();
```

Change the narration button rendering (around line 972):
```typescript
// OLD:
{narrationEnabled && (

// NEW:
{narrationEnabled && narrationStatus !== 'idle' && (
```

Before the existing button, add an opt-in branch inside that block:
```typescript
{narrationEnabled && narrationStatus !== 'idle' && (
  isAvailable ? (
    <button
      onClick={() => initWorker()}
      title="Download voice narration (~90MB)"
      aria-label="Enable voice narration"
      style={{ /* same style as existing narration button */ }}
    >
      <Play size={12} style={{ marginLeft: '1px' }} />
    </button>
  ) : (
    <button
      onClick={handleNarrateProse}
      /* ... existing button props ... */
    >
      {/* ... existing button content ... */}
    </button>
  )
)}
```

- [ ] **Step 3: Update `EncounterStage.tsx`**

Change line 134:
```typescript
// OLD:
const { enabled: narrationEnabled, isLoading, isSpeaking, speak, stop } = useNarration();

// NEW:
const { enabled: narrationEnabled, status: narrationStatus, isLoading, isSpeaking, isAvailable, initWorker, speak, stop } = useNarration();
```

In `handleNarrate` (line 171), add an early check:
```typescript
const handleNarrate = useCallback(async (id: string, text: string) => {
  if (!narrationEnabled || narrationStatus === 'idle' || !text.trim()) return;
  // ... rest unchanged
}, [narrationEnabled, narrationStatus, isSpeaking, activeNarrationId, stop, speak]);
```

Where narration buttons are rendered, add the `isAvailable` opt-in pattern. The exact location depends on how narration icons appear per-paragraph — add a conditional that shows a download icon when `isAvailable` and calls `initWorker()`.

- [ ] **Step 4: Update `TieredEncounterModal.tsx`**

Change the `NarrateButton` component (line 613):
```typescript
function NarrateButton({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { isSpeaking, narrateChronicle, stop, enabled, status, isAvailable, initWorker } = useNarration();

  const handleNarrate = useCallback(() => {
    if (isAvailable) {
      initWorker();
      return;
    }
    if (isSpeaking) {
      stop();
      return;
    }
    narrateChronicle(containerRef.current);
  }, [isAvailable, initWorker, isSpeaking, stop, narrateChronicle, containerRef]);

  if (!enabled || status === 'idle') return null;

  return (
    <button
      onClick={handleNarrate}
      title={isAvailable ? 'Download voice narration (~90MB)' : isSpeaking ? 'Stop narration' : 'Narrate this encounter'}
      className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{
        padding: '4px 10px',
        backgroundColor: isSpeaking ? 'var(--accent-gold-glow)' : 'transparent',
        border: `1px solid ${isSpeaking ? 'var(--accent-gold-dim)' : 'var(--border-subtle)'}`,
        color: isSpeaking ? 'var(--accent-gold)' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        fontSize: 11,
      }}
    >
      {isSpeaking ? '■' : '▶'}
      <span>{isAvailable ? 'Enable Voice' : isSpeaking ? 'Stop' : 'Narrate'}</span>
    </button>
  );
}
```

- [ ] **Step 5: Type-check + full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: type-check clean. Tests may fail if the EncounterStage mock is stale — that's expected and fixed in Task 7.

- [ ] **Step 6: Commit**

```bash
git add src/components/Game/HexChronicle.tsx src/components/Game/LocationView.tsx src/components/Game/encounter-stage/EncounterStage.tsx src/components/Game/TieredEncounterModal.tsx
git commit -m "feat(tts): update UI surfaces with dual-mode narration opt-in"
```

---

### Task 7: Update test mocks

**Files:**
- Edit: `src/components/Game/encounter-stage/__tests__/EncounterStage.test.tsx`

- [ ] **Step 1: Update the `useNarration` mock**

Change lines 10-24:
```typescript
vi.mock('../../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: true,
    status: 'ready' as const,
    backendType: 'server' as const,
    loadProgress: 1,
    error: null,
    isSpeaking: false,
    isLoading: false,
    isAvailable: false,
    init: vi.fn(),
    initWorker: vi.fn(),
    speak: speakMock,
    speakSections: vi.fn(),
    stop: stopMock,
    narrateChronicle: vi.fn(),
  }),
}));
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/components/Game/encounter-stage/__tests__/EncounterStage.test.ts`
Expected: all PASS

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Game/encounter-stage/__tests__/EncounterStage.test.tsx
git commit -m "test(tts): update EncounterStage mock for dual-mode hook shape"
```

---

### Task 8: Vercel configuration

**Files:**
- Edit: `vercel.json`

- [ ] **Step 1: Add COOP/COEP headers**

Replace the contents of `vercel.json`:
```json
{
  "buildCommand": "vite build",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Production build check**

Run: `npx vite build`
Expected: build succeeds (confirms Vercel deploy will work)

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat(tts): add COOP/COEP headers for WASM multi-threading"
```

---

### Task 9: Deploy verification

This task verifies the deployed path end-to-end. Unit tests can't prove HTTPS/runtime behavior — this must be checked on the actual Vercel deployment.

**Files:** None (verification only)

- [ ] **Step 1: Push to main and confirm Vercel deploy**

```bash
git push
```

Wait for Vercel deploy to complete.

- [ ] **Step 2: Verify COOP/COEP headers on deployed URL**

Open the deployed Vercel URL. Check response headers in browser DevTools (Network tab → document request → Response Headers). Confirm:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

If headers are missing, check `vercel.json` syntax.

- [ ] **Step 3: Verify no mixed-content console noise**

Open browser console on the deployed URL. Confirm there are **no** `Mixed Content` warnings or failed `localhost:3001` fetches. The origin check should have skipped the probe entirely.

- [ ] **Step 4: Verify worker opt-in flow**

Click any narration button — it should show "Enable Voice" (or play icon with download tooltip). Click it. Confirm:
- Progress indicator appears
- Model downloads from HuggingFace CDN (~92MB, check Network tab)
- After download, status changes to ready
- Click narrate again — audio should play

- [ ] **Step 5: Verify `SharedArrayBuffer` availability**

In browser console on the deployed URL, run: `typeof SharedArrayBuffer !== 'undefined'`
Expected: `true` (confirms COOP/COEP headers are enabling multi-threaded WASM). If `false`, the WASM falls back to single-threaded — still functional, just slower.

- [ ] **Step 6: If COEP breaks external resources**

If any images, fonts, or scripts from external CDNs fail to load (CORS errors in console), the `credentialless` policy may be too strict for some resources. Options:
- Add `crossorigin` attributes to affected resources
- Or relax to no COEP (lose multi-threading, WASM still works single-threaded)

Document any issues as impediments.

---

### Task 10: Documentation updates

**Files:**
- Edit: `.planning/BACKLOG.md`
- Edit: `Docs/project-status.md`
- Edit: `Docs/project-history.md`
- Edit: `Docs/changelog.md`

- [ ] **Step 1: Update backlog** — mark the TTS dual-mode item as `✅`, archive to `BACKLOG_HISTORY.md`
- [ ] **Step 2: Update project-status.md** — add one-line entry for dual-mode TTS
- [ ] **Step 3: Update project-history.md** — add `✅ Dual-mode TTS: browser worker backend with Vercel support`
- [ ] **Step 4: Update changelog.md** — append row: `| 2026-04-06 | narration | Added browser-side TTS via kokoro-js Web Worker; auto-fallback from Python server; COOP/COEP headers for Vercel | Vercel deployment support |`
- [ ] **Step 5: Commit**

```bash
git add .planning/BACKLOG.md .planning/BACKLOG_HISTORY.md Docs/project-status.md Docs/project-history.md Docs/changelog.md
git commit -m "docs: update docs for dual-mode TTS implementation"
```
