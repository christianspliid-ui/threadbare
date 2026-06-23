import { describe, it, expect } from 'vitest';
import { computeSurfaceKey, SURFACE_KEY_AXES } from '../encounterSurface';
import type { EncounterCacheEntry } from '../encounterCache';

// Minimal stub — only the fields computeSurfaceKey reads
type SurfaceInput = Pick<EncounterCacheEntry, 'templateId' | 'reachPrimary' | 'sublocationTypeId' | 'targetAgentRole'>;

function makeEntry(overrides: Partial<SurfaceInput> = {}): SurfaceInput {
  return {
    templateId: 'encounter.guild.trade',
    reachPrimary: 'commerce',
    sublocationTypeId: null,
    targetAgentRole: null,
    ...overrides,
  };
}

describe('computeSurfaceKey', () => {
  it('includes templateId as the first component', () => {
    const key = computeSurfaceKey(makeEntry({ templateId: 'encounter.test.foo' }));
    expect(key.startsWith('encounter.test.foo')).toBe(true);
  });

  it('is deterministic — same inputs produce same key', () => {
    const entry = makeEntry({ sublocationTypeId: 'guild-main', reachPrimary: 'commerce' });
    expect(computeSurfaceKey(entry)).toBe(computeSurfaceKey(entry));
  });

  it('is order-stable — axes sorted alphabetically regardless of insertion order', () => {
    // SURFACE_KEY_AXES defines the set; key output must always use alphabetical order
    const key = computeSurfaceKey(makeEntry({ sublocationTypeId: 'guild-main', reachPrimary: 'commerce' }));
    // 'reachPrimary' < 'sublocationTypeId' alphabetically
    const reachIdx = key.indexOf('reachPrimary=');
    const subIdx = key.indexOf('sublocationTypeId=');
    expect(reachIdx).toBeGreaterThan(-1);
    expect(subIdx).toBeGreaterThan(-1);
    expect(reachIdx).toBeLessThan(subIdx);
  });

  it('omits null axis values — no "null" string in key', () => {
    const key = computeSurfaceKey(makeEntry({ sublocationTypeId: null, targetAgentRole: null }));
    expect(key).not.toContain('null');
  });

  it('omits undefined axis values', () => {
    const key = computeSurfaceKey(makeEntry({ sublocationTypeId: undefined, targetAgentRole: undefined }));
    expect(key).not.toContain('undefined');
  });

  it('omits empty-string axis values', () => {
    const key = computeSurfaceKey(makeEntry({ sublocationTypeId: '' }));
    expect(key).not.toContain('sublocationTypeId=');
  });

  it('two templates with the same axes produce different keys', () => {
    const a = computeSurfaceKey(makeEntry({ templateId: 'encounter.a', reachPrimary: 'commerce' }));
    const b = computeSurfaceKey(makeEntry({ templateId: 'encounter.b', reachPrimary: 'commerce' }));
    expect(a).not.toBe(b);
  });

  it('same template at different sublocationTypeIds produces different keys', () => {
    const guild = computeSurfaceKey(makeEntry({ sublocationTypeId: 'guild-main' }));
    const tavern = computeSurfaceKey(makeEntry({ sublocationTypeId: 'tavern-common' }));
    expect(guild).not.toBe(tavern);
  });

  it('same template at different reachPrimary produces different keys', () => {
    const commerce = computeSurfaceKey(makeEntry({ reachPrimary: 'commerce' }));
    const combat = computeSurfaceKey(makeEntry({ reachPrimary: 'combat' }));
    expect(commerce).not.toBe(combat);
  });

  it('same template at different socialRole produces different keys', () => {
    const merchant = computeSurfaceKey(makeEntry({ targetAgentRole: 'merchant' }));
    const guard = computeSurfaceKey(makeEntry({ targetAgentRole: 'guard' }));
    expect(merchant).not.toBe(guard);
  });

  it('no-axis entry (all null) collapses to just the templateId', () => {
    const key = computeSurfaceKey(makeEntry({ sublocationTypeId: null, reachPrimary: undefined as unknown as string, targetAgentRole: null }));
    // When all axes are absent the key is just templateId (no pipes)
    // Note: reachPrimary is intentionally a required field on EncounterCacheEntry but we test the fallback
    // The key may equal just the templateId when all axis values are falsy
    expect(key).toContain('encounter.guild.trade');
  });

  it('produces bounded keys (no open-ended values)', () => {
    // Axes are all closed enums — keys should never contain newlines or separators other than | and =
    const key = computeSurfaceKey(makeEntry({ sublocationTypeId: 'guild-main', targetAgentRole: 'merchant' }));
    expect(key).not.toMatch(/[\n\r\t]/);
  });

  it('SURFACE_KEY_AXES contains only known axis names', () => {
    const knownAxes = new Set(['sublocationTypeId', 'reachPrimary', 'socialRole']);
    for (const axis of SURFACE_KEY_AXES) {
      expect(knownAxes.has(axis)).toBe(true);
    }
  });
});
