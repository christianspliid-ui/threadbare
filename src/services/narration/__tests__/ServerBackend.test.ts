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
