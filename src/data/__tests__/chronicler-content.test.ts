import { describe, it, expect } from 'vitest';
import {
  CHRONICLER_VIGNETTES,
  SUBLOCATION_FLAVOR,
  ARTIFACT_LORE,
  LOCATION_TYPE_FLAVOR,
  MAGIC_TRADITION_FLAVOR,
  getVignetteByContext,
  getSubLocationFlavor,
  getArtifactLore,
} from '../chronicler-content';

describe('chronicler-content', () => {
  it('should have chronicler vignette templates', () => {
    expect(Object.keys(CHRONICLER_VIGNETTES).length).toBeGreaterThan(0);
  });

  it('each vignette should be at least 40 characters', () => {
    for (const [ctx, vignette] of Object.entries(CHRONICLER_VIGNETTES)) {
      expect(vignette.length, `${ctx} too short`).toBeGreaterThanOrEqual(40);
    }
  });

  it('should have sublocation flavor entries', () => {
    expect(Object.keys(SUBLOCATION_FLAVOR).length).toBeGreaterThan(0);
  });

  it('should have artifact lore instances', () => {
    expect(ARTIFACT_LORE.length).toBeGreaterThan(0);
  });

  it('each artifact lore should have name, prose, and sphereAffinity', () => {
    for (const lore of ARTIFACT_LORE) {
      expect(lore.name.length).toBeGreaterThan(0);
      expect(lore.prose.length).toBeGreaterThan(20);
      expect(lore.sphereAffinity).toBeDefined();
    }
  });

  it('should have location type flavor entries', () => {
    expect(Object.keys(LOCATION_TYPE_FLAVOR).length).toBeGreaterThan(0);
  });

  it('should have magic tradition flavor entries', () => {
    expect(Object.keys(MAGIC_TRADITION_FLAVOR).length).toBeGreaterThan(0);
  });

  it('getVignetteByContext should return vignettes', () => {
    const v = getVignetteByContext('location');
    expect(v).toBeDefined();
    expect(v!.length).toBeGreaterThan(0);
  });

  it('getSubLocationFlavor should return flavor', () => {
    const f = getSubLocationFlavor('market');
    expect(f).toBeDefined();
  });

  it('getArtifactLore should filter by sphere', () => {
    const lore = getArtifactLore('force');
    expect(lore.length).toBe(5);
  });
});
