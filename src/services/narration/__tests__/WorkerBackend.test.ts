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
