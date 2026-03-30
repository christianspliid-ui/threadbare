import { describe, it, expect } from 'vitest';
import {
  DIVINE_INFLUENCE_CONSTANTS,
  CONSEQUENCE_TEMPLATES,
  SPHERE_AUDIO_CONFIG,
  getConsequenceMessage,
} from '../intervention-feedback-content';

describe('DIVINE_INFLUENCE_CONSTANTS', () => {
  it('has duration for every intervention type', () => {
    const types = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'];
    for (const t of types) {
      const key = `${t.toUpperCase()}_DURATION` as keyof typeof DIVINE_INFLUENCE_CONSTANTS;
      expect(DIVINE_INFLUENCE_CONSTANTS[key]).toBeDefined();
    }
  });

  it('all durations are positive integers', () => {
    const durationKeys = Object.keys(DIVINE_INFLUENCE_CONSTANTS).filter(k => k.endsWith('_DURATION'));
    for (const key of durationKeys) {
      const val = DIVINE_INFLUENCE_CONSTANTS[key as keyof typeof DIVINE_INFLUENCE_CONSTANTS];
      expect(val).toBeGreaterThan(0);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('has feedback timing constants', () => {
    expect(DIVINE_INFLUENCE_CONSTANTS.CARD_PULSE_MS).toBe(200);
    expect(DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS).toBe(600);
  });

  it('has audio base frequency constants', () => {
    expect(DIVINE_INFLUENCE_CONSTANTS.AUDIO_BASE_FREQ).toBe(220);
    expect(DIVINE_INFLUENCE_CONSTANTS.AUDIO_DURATION_MS).toBe(200);
  });
});

describe('CONSEQUENCE_TEMPLATES', () => {
  it('has templates for all 8 intervention types', () => {
    const types = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'coincidence', 'omen', 'afflict_bless'];
    for (const t of types) {
      expect(CONSEQUENCE_TEMPLATES[t]).toBeDefined();
      expect(CONSEQUENCE_TEMPLATES[t].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('agent-targeting templates contain {agent} placeholder', () => {
    const agentTypes = ['dream', 'persuade', 'deceive', 'intimidate', 'inspire_intervention', 'afflict_bless'];
    for (const t of agentTypes) {
      for (const tmpl of CONSEQUENCE_TEMPLATES[t]) {
        expect(tmpl).toContain('{agent}');
      }
    }
  });

  it('location-targeting templates contain {location} or {sphere} placeholder', () => {
    const locTypes = ['coincidence', 'omen'];
    for (const t of locTypes) {
      for (const tmpl of CONSEQUENCE_TEMPLATES[t]) {
        const hasLocation = tmpl.includes('{location}') || tmpl.includes('{sphere}');
        expect(hasLocation).toBe(true);
      }
    }
  });
});

describe('getConsequenceMessage', () => {
  it('substitutes {agent} and {value_direction} placeholders', () => {
    const msg = getConsequenceMessage('dream', {
      agentName: 'Kael',
      valueDirection: 'courage over prudence',
      sphere: 'mind',
    }, 42);
    expect(msg).toContain('Kael');
    expect(msg.length).toBeGreaterThan(10);
  });

  it('returns different templates for different seeds', () => {
    const msgs = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      msgs.add(getConsequenceMessage('persuade', {
        agentName: 'Mira',
        valueDirection: 'loyalty',
        sphere: 'spirit',
      }, seed));
    }
    expect(msgs.size).toBeGreaterThan(1);
  });

  it('handles missing optional parameters gracefully', () => {
    const msg = getConsequenceMessage('dream', {
      agentName: 'Kael',
    }, 0);
    expect(msg).toContain('Kael');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('substitutes all placeholders correctly for inspire_intervention', () => {
    const msg = getConsequenceMessage('inspire_intervention', {
      agentName: 'Thane',
      domain: 'Force',
      sphere: 'life',
    }, 0);
    expect(msg).toContain('Thane');
    expect(msg).toContain('Force');
  });

  it('handles location-based interventions', () => {
    const msg = getConsequenceMessage('coincidence', {
      location: 'The Crystal Spire',
      sphere: 'time',
    }, 0);
    expect(msg).toContain('Crystal Spire');
    expect(msg).toContain('time');
  });
});

describe('SPHERE_AUDIO_CONFIG', () => {
  it('maps every creation sphere to audio configuration', () => {
    const spheres = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];
    for (const s of spheres) {
      expect(SPHERE_AUDIO_CONFIG[s]).toBeDefined();
      expect(SPHERE_AUDIO_CONFIG[s].freqOffset).toBeDefined();
      expect(SPHERE_AUDIO_CONFIG[s].waveform).toBeDefined();
    }
  });

  it('all frequency offsets are within reasonable range', () => {
    for (const [sphere, config] of Object.entries(SPHERE_AUDIO_CONFIG)) {
      expect(config.freqOffset).toBeGreaterThanOrEqual(-100);
      expect(config.freqOffset).toBeLessThanOrEqual(100);
    }
  });

  it('waveforms are valid oscillator types', () => {
    const validWaveforms = ['sine', 'triangle', 'sawtooth', 'square'];
    for (const config of Object.values(SPHERE_AUDIO_CONFIG)) {
      expect(validWaveforms).toContain(config.waveform);
    }
  });

  it('force and entropy have sawtooth waveforms', () => {
    expect(SPHERE_AUDIO_CONFIG.force.waveform).toBe('sawtooth');
    expect(SPHERE_AUDIO_CONFIG.entropy.waveform).toBe('sawtooth');
  });
});
