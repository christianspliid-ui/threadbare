// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkerBackend } from '../WorkerBackend';

// Mock Worker class that lets us simulate messages
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

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

  describe('generateAudio (streaming)', () => {
    beforeEach(async () => {
      const p = backend.init();
      mockWorker.simulateMessage({ type: 'init-done' });
      await p;
    });

    it('relays audio chunks via onChunk callback and resolves to null', async () => {
      const chunks: { audio: Float32Array; sampleRate: number }[] = [];
      const signal = new AbortController().signal;
      const genPromise = backend.generateAudio(
        ['Hello world'], 'bm_george', 0.87, signal,
        (audio, sampleRate) => chunks.push({ audio, sampleRate }),
      );

      const speakCall = mockWorker.postMessage.mock.calls.find(
        (c) => c[0].type === 'speak',
      );
      expect(speakCall).toBeTruthy();

      // Simulate two streamed chunks
      const chunk1 = new Float32Array([0.1, 0.2, 0.3]);
      const chunk2 = new Float32Array([0.4, 0.5]);
      mockWorker.simulateMessage({
        type: 'audio-chunk', audio: chunk1, sampleRate: 24000, id: speakCall![0].id,
      });
      mockWorker.simulateMessage({
        type: 'audio-chunk', audio: chunk2, sampleRate: 24000, id: speakCall![0].id,
      });
      mockWorker.simulateMessage({ type: 'audio-done', id: speakCall![0].id });

      const result = await genPromise;
      expect(result).toBeNull(); // streaming returns null
      expect(chunks).toHaveLength(2);
      expect(chunks[0].audio).toEqual(chunk1);
      expect(chunks[1].audio).toEqual(chunk2);
    });

    it('rejects on speak-error', async () => {
      const signal = new AbortController().signal;
      const genPromise = backend.generateAudio(['Test'], 'bm_george', 1, signal);

      const speakCall = mockWorker.postMessage.mock.calls.find(
        (c) => c[0].type === 'speak',
      );

      mockWorker.simulateMessage({
        type: 'speak-error', error: 'Inference failed', id: speakCall![0].id,
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
