// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterventionAudio } from '../hooks/useInterventionAudio';

describe('useInterventionAudio', () => {
  let mockOscillators: any[];
  let mockGains: any[];
  let mockContext: any;

  beforeAll(() => {
    // Set up once before all tests
    mockOscillators = [];
    mockGains = [];

    mockContext = {
      createOscillator: vi.fn(() => {
        const osc = {
          type: 'sine' as OscillatorType,
          frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          connect: vi.fn(function (this: any) {
            return this;
          }),
          start: vi.fn(),
          stop: vi.fn(),
        };
        mockOscillators.push(osc);
        return osc;
      }),
      createGain: vi.fn(() => {
        const gain = {
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(function (this: any) {
            return this;
          }),
        };
        mockGains.push(gain);
        return gain;
      }),
      destination: {} as AudioNode,
      currentTime: 0,
      state: 'running' as AudioContextState,
      resume: vi.fn(),
    };

    // Mock AudioContext constructor properly
    class MockAudioContext {
      createOscillator = mockContext.createOscillator;
      createGain = mockContext.createGain;
      destination = mockContext.destination;
      currentTime = mockContext.currentTime;
      state = mockContext.state;
      resume = mockContext.resume;
    }

    (globalThis as any).AudioContext = MockAudioContext;
  });

  it('returns a playCastSound function', () => {
    const { result } = renderHook(() => useInterventionAudio());
    expect(typeof result.current.playCastSound).toBe('function');
  });

  it('playCastSound creates oscillator and gain nodes', () => {
    const initialOscCount = mockOscillators.length;
    const initialGainCount = mockGains.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', false);
    });

    expect(mockOscillators.length).toBe(initialOscCount + 1);
    expect(mockGains.length).toBe(initialGainCount + 1);
  });

  it('playCastSound with detected=false creates one oscillator', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', false);
    });

    expect(mockOscillators.length).toBe(initialOscCount + 1);
  });

  it('playCastSound with detected=true creates two oscillators', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', true);
    });

    expect(mockOscillators.length).toBe(initialOscCount + 2);
  });

  it('applies sphere-specific frequency offsets (mind sphere base + rise)', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', false);
    });

    const mainOsc = mockOscillators[initialOscCount];
    // Mind has freqOffset 60: base 220 + 60 = 280, rise 440 + 60 = 500
    expect(mainOsc.frequency.setValueAtTime).toHaveBeenCalledWith(280, 0);
    expect(mainOsc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(500, 0.2);
  });

  it('applies sphere-specific frequency offsets (force sphere)', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('force', false);
    });

    const mainOsc = mockOscillators[initialOscCount];
    // Force has freqOffset -60: base 220 - 60 = 160, rise 440 - 60 = 380
    expect(mainOsc.frequency.setValueAtTime).toHaveBeenCalledWith(160, 0);
    expect(mainOsc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(380, 0.2);
  });

  it('sets correct waveform for mind sphere (sine)', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', false);
    });

    expect(mockOscillators[initialOscCount].type).toBe('sine');
  });

  it('sets correct waveform for force sphere (sawtooth)', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('force', false);
    });

    expect(mockOscillators[initialOscCount].type).toBe('sawtooth');
  });

  it('sets correct waveform for matter sphere (triangle)', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('matter', false);
    });

    expect(mockOscillators[initialOscCount].type).toBe('triangle');
  });

  it('applies gain envelope (attack and exponential decay)', () => {
    const initialGainCount = mockGains.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', false);
    });

    const gain = mockGains[initialGainCount];
    // Main tone: 0.15 initial, decay to 0.001
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.15, 0);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.2);
  });

  it('starts and stops oscillator with correct timing', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', false);
    });

    const osc = mockOscillators[initialOscCount];
    // AUDIO_DURATION_MS is 200ms = 0.2 seconds
    expect(osc.start).toHaveBeenCalledWith(0);
    expect(osc.stop).toHaveBeenCalledWith(0.2);
  });

  it('connects oscillator to gain to destination', () => {
    const initialOscCount = mockOscillators.length;
    const initialGainCount = mockGains.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', false);
    });

    const osc = mockOscillators[initialOscCount];
    const gain = mockGains[initialGainCount];
    expect(osc.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(mockContext.destination);
  });

  it('detection overlay uses sawtooth waveform', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', true);
    });

    const detectionOsc = mockOscillators[initialOscCount + 1];
    expect(detectionOsc.type).toBe('sawtooth');
  });

  it('detection overlay applies detune offset to frequencies', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', true);
    });

    const detectionOsc = mockOscillators[initialOscCount + 1];
    // Mind base 280 + 30 detune = 310, rise 500 - 30 detune = 470
    expect(detectionOsc.frequency.setValueAtTime).toHaveBeenCalledWith(310, 0);
    expect(detectionOsc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(470, 0.2);
  });

  it('detection overlay has lower gain than main tone', () => {
    const initialGainCount = mockGains.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('mind', true);
    });

    const mainGain = mockGains[initialGainCount];
    const detectionGain = mockGains[initialGainCount + 1];
    // Main: 0.15, Detection: 0.08
    expect(mainGain.gain.setValueAtTime).toHaveBeenCalledWith(0.15, 0);
    expect(detectionGain.gain.setValueAtTime).toHaveBeenCalledWith(0.08, 0);
  });

  it('uses default mind config for unknown sphere', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('unknownSphere', false);
    });

    const osc = mockOscillators[initialOscCount];
    // Should fall back to mind: sine waveform, freqOffset 60
    expect(osc.type).toBe('sine');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(280, 0);
  });

  it('supports energy sphere (freqOffset 20)', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('energy', false);
    });

    const osc = mockOscillators[initialOscCount];
    // Energy: sine waveform, freqOffset 20
    expect(osc.type).toBe('sine');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(240, 0); // 220 + 20
    expect(osc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(460, 0.2); // 440 + 20
  });

  it('supports entropy sphere (freqOffset -80)', () => {
    const initialOscCount = mockOscillators.length;
    const { result } = renderHook(() => useInterventionAudio());

    act(() => {
      result.current.playCastSound('entropy', false);
    });

    const osc = mockOscillators[initialOscCount];
    // Entropy: sawtooth waveform, freqOffset -80
    expect(osc.type).toBe('sawtooth');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(140, 0); // 220 - 80
    expect(osc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(360, 0.2); // 440 - 80
  });

  it('supports life, spirit, and time spheres', () => {
    const { result } = renderHook(() => useInterventionAudio());

    const sphereTests = [
      { name: 'life', expectedWaveform: 'sine' as OscillatorType, freqOffset: 0 },
      { name: 'spirit', expectedWaveform: 'sine' as OscillatorType, freqOffset: 80 },
      { name: 'time', expectedWaveform: 'triangle' as OscillatorType, freqOffset: 40 },
    ];

    sphereTests.forEach(({ name, expectedWaveform, freqOffset }) => {
      const initialOscCount = mockOscillators.length;
      act(() => {
        result.current.playCastSound(name, false);
      });
      const osc = mockOscillators[initialOscCount];
      expect(osc.type).toBe(expectedWaveform);
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(220 + freqOffset, 0);
    });
  });
});
