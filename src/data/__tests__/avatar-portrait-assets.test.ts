import { describe, it, expect } from 'vitest';
import {
  getOriginPortraitUrl,
  getSphereFrameUrl,
  ORIGIN_PORTRAITS,
  SPHERE_FRAMES,
} from '../avatar-portrait-assets';

describe('avatar-portrait-assets', () => {
  describe('ORIGIN_PORTRAITS', () => {
    it('has origin entries', () => {
      expect(Object.keys(ORIGIN_PORTRAITS).length).toBeGreaterThan(0);
    });

    it('maps origin.recent-shepherd to correct path', () => {
      expect(ORIGIN_PORTRAITS['origin.recent-shepherd']).toBe('/portraits/origin-recent-shepherd.jpg');
    });

    it('maps origin.ancient-scholar to correct path', () => {
      expect(ORIGIN_PORTRAITS['origin.ancient-scholar']).toBe('/portraits/origin-ancient-scholar.jpg');
    });
  });

  describe('SPHERE_FRAMES', () => {
    it('has sphere entries', () => {
      expect(Object.keys(SPHERE_FRAMES).length).toBeGreaterThan(0);
    });

    it('maps mind to correct path', () => {
      expect(SPHERE_FRAMES.mind).toBe('/portraits/frame-mind.jpg');
    });
  });

  describe('getOriginPortraitUrl', () => {
    it('returns portrait URL for known origin', () => {
      expect(getOriginPortraitUrl('origin.recent-shepherd')).toBe('/portraits/origin-recent-shepherd.jpg');
    });

    it('returns fallback for unknown origin (fail-soft)', () => {
      expect(getOriginPortraitUrl('origin.dev')).toBe('/portraits/origin-ancient-scholar.jpg');
    });

    it('returns fallback for empty string', () => {
      expect(getOriginPortraitUrl('')).toBe('/portraits/origin-ancient-scholar.jpg');
    });
  });

  describe('getSphereFrameUrl', () => {
    it('returns frame URL for each sphere', () => {
      expect(getSphereFrameUrl('force')).toBe('/portraits/frame-force.jpg');
      expect(getSphereFrameUrl('entropy')).toBe('/portraits/frame-entropy.jpg');
    });
  });
});
