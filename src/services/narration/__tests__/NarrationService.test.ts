// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock before importing NarrationService
vi.mock('../ServerBackend', () => ({
  ServerBackend: vi.fn().mockImplementation(function () {
    return {
      type: 'server',
      init: vi.fn(),
      generateAudio: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
    };
  }),
}));

vi.mock('../WorkerBackend', () => ({
  WorkerBackend: vi.fn().mockImplementation(function () {
    return {
      type: 'worker',
      init: vi.fn(),
      generateAudio: vi.fn(),
      stop: vi.fn(),
      dispose: vi.fn(),
    };
  }),
}));

// Reset singleton between tests
let getNarrationService: typeof import('../NarrationService').getNarrationService;
let _resetNarrationService: typeof import('../NarrationService')._resetNarrationService;
let ServerBackend: typeof import('../ServerBackend').ServerBackend;
let WorkerBackend: typeof import('../WorkerBackend').WorkerBackend;

describe('NarrationService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
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
      vi.mocked(ServerBackend).mockImplementation(function () {
        return {
          type: 'server' as const,
          init: mockInit,
          generateAudio: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
        };
      });

      const svc = getNarrationService();
      await svc.init();
      expect(svc.status).toBe('ready');
      expect(mockInit).toHaveBeenCalled();
    });

    it('sets available when server probe fails', async () => {
      vi.mocked(ServerBackend).mockImplementation(function () {
        return {
          type: 'server' as const,
          init: vi.fn().mockRejectedValue(new Error('Connection refused')),
          generateAudio: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
        };
      });

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
      vi.mocked(WorkerBackend).mockImplementation(function () {
        return {
          type: 'worker' as const,
          init: mockInit,
          generateAudio: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
        };
      });

      const svc = getNarrationService();
      await svc.init(); // go to available
      await svc.initWorker();
      expect(svc.status).toBe('ready');
      expect(svc.backendType).toBe('worker');
    });

    it('sets available on worker init failure', async () => {
      vi.mocked(WorkerBackend).mockImplementation(function () {
        return {
          type: 'worker' as const,
          init: vi.fn().mockRejectedValue(new Error('WASM failed')),
          generateAudio: vi.fn(),
          stop: vi.fn(),
          dispose: vi.fn(),
        };
      });

      const svc = getNarrationService();
      await svc.init();
      await svc.initWorker();
      // Should go back to available, not error (single failure)
      expect(svc.status).toBe('available');
    });
  });
});
