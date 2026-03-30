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
  it('should have 15 chronicler vignette templates', () => {
    expect(Object.keys(CHRONICLER_VIGNETTES)).toHaveLength(15);
  });

  it('each vignette should be at least 40 characters', () => {
    for (const [ctx, vignette] of Object.entries(CHRONICLER_VIGNETTES)) {
      expect(vignette.length, `${ctx} too short`).toBeGreaterThanOrEqual(40);
    }
  });

  it('should have 14 sublocation flavor entries', () => {
    expect(Object.keys(SUBLOCATION_FLAVOR)).toHaveLength(14);
  });

  it('should have 30 artifact lore instances', () => {
    expect(ARTIFACT_LORE).toHaveLength(30);
  });

  it('each artifact lore should have name, prose, and sphereAffinity', () => {
    for (const lore of ARTIFACT_LORE) {
      expect(lore.name.length).toBeGreaterThan(0);
      expect(lore.prose.length).toBeGreaterThan(20);
      expect(lore.sphereAffinity).toBeDefined();
    }
  });

  it('should have 15 location type flavor entries', () => {
    expect(Object.keys(LOCATION_TYPE_FLAVOR)).toHaveLength(15);
  });

  it('should have 34 magic tradition flavor entries', () => {
    expect(Object.keys(MAGIC_TRADITION_FLAVOR)).toHaveLength(34);
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
