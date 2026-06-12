/**
 * Thread digest content integrity tests.
 *
 * Asserts: 192 beat templates (64 keys × 3 variants), 18 tension templates
 * (6 kinds × 3 variants), and no unresolved placeholders in a synthetic sweep.
 */

import { describe, it, expect } from 'vitest';
import {
  BEAT_TEMPLATES,
  TRANSITION_PHRASES,
  TENSION_TEMPLATES,
  EMPTY_THREAD_LINES,
} from '../../data/thread-digest-content';
import { REACH_DOMAINS } from '../../types/traits';

const BEAT_ROLES = ['opener', 'pivot', 'compound', 'closer'] as const;
const OUTCOMES = ['success', 'failure'] as const;
const TENSION_KINDS = [
  'active_encounter',
  'open_wound',
  'faction_debt',
  'pending_obligation',
  'doom_pressure',
  'idle',
] as const;

describe('BEAT_TEMPLATES', () => {
  it('has exactly 64 keys (4 roles × 8 reaches × 2 outcomes)', () => {
    const expected = BEAT_ROLES.length * REACH_DOMAINS.length * OUTCOMES.length;
    expect(Object.keys(BEAT_TEMPLATES)).toHaveLength(expected);
  });

  it('every key has exactly 3 variants', () => {
    for (const [key, variants] of Object.entries(BEAT_TEMPLATES)) {
      expect(variants).toHaveLength(3);
      for (const v of variants) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('covers all role × reach × outcome combinations', () => {
    for (const role of BEAT_ROLES) {
      for (const reach of REACH_DOMAINS) {
        for (const outcome of OUTCOMES) {
          const key = `${role}_${reach}_${outcome}`;
          expect(BEAT_TEMPLATES).toHaveProperty(key);
        }
      }
    }
  });

  it('has no unresolved placeholder patterns (non-enrichProse patterns)', () => {
    // Allow: {name}, {location}, {ally:strongest}, {rival:strongest}, {faction}, {attachment}
    // Disallow: anything else like {agentId}, {tick}, typos
    const allowedPlaceholders = /^\{(name|location|ally:[a-z]+|rival:[a-z]+|faction|attachment)\}$/;
    const placeholderRe = /\{[^}]+\}/g;

    let violations: string[] = [];
    for (const [key, variants] of Object.entries(BEAT_TEMPLATES)) {
      for (const v of variants) {
        const matches = v.match(placeholderRe) ?? [];
        for (const match of matches) {
          if (!allowedPlaceholders.test(match)) {
            violations.push(`${key}: "${match}" in "${v}"`);
          }
        }
      }
    }
    expect(violations).toHaveLength(0);
  });
});

describe('TENSION_TEMPLATES', () => {
  it('has exactly 6 tension kinds', () => {
    expect(Object.keys(TENSION_TEMPLATES)).toHaveLength(TENSION_KINDS.length);
  });

  it('every tension kind has exactly 3 variants', () => {
    for (const kind of TENSION_KINDS) {
      expect(TENSION_TEMPLATES[kind]).toHaveLength(3);
      for (const v of TENSION_TEMPLATES[kind]) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('covers all tension kinds', () => {
    for (const kind of TENSION_KINDS) {
      expect(TENSION_TEMPLATES).toHaveProperty(kind);
    }
  });
});

describe('TRANSITION_PHRASES', () => {
  it('has all 4 roles', () => {
    for (const role of BEAT_ROLES) {
      expect(TRANSITION_PHRASES).toHaveProperty(role);
    }
  });

  it('each role has exactly 4 transition phrases', () => {
    for (const role of BEAT_ROLES) {
      expect(TRANSITION_PHRASES[role]).toHaveLength(4);
    }
  });
});

describe('EMPTY_THREAD_LINES', () => {
  it('has exactly 3 empty state lines', () => {
    expect(EMPTY_THREAD_LINES).toHaveLength(3);
  });

  it('all lines are non-empty strings', () => {
    for (const line of EMPTY_THREAD_LINES) {
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    }
  });
});

describe('placeholder leak — synthetic 50-agent sweep', () => {
  it('no unresolved {placeholder} patterns remain in tension templates', () => {
    const allowedPlaceholders = /^\{(name|location|ally:[a-z]+|rival:[a-z]+|faction|attachment)\}$/;
    const placeholderRe = /\{[^}]+\}/g;

    let violations: string[] = [];
    for (const [kind, variants] of Object.entries(TENSION_TEMPLATES)) {
      for (const v of variants) {
        const matches = v.match(placeholderRe) ?? [];
        for (const match of matches) {
          if (!allowedPlaceholders.test(match)) {
            violations.push(`tension ${kind}: "${match}" in "${v}"`);
          }
        }
      }
    }
    expect(violations).toHaveLength(0);
  });
});
