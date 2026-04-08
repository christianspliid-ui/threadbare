import { describe, it, expect } from 'vitest';
import {
  generateNarrativeCandidates,
  generateSparkVisions,
  buildNarrativeResult,
} from '../meetingEncounter';
import { CANDIDATE_VIGNETTES } from '../../data/candidate-vignettes';
import { SPARK_VISION_CATALOG } from '../../data/spark-vision-catalog';

describe('generateNarrativeCandidates', () => {
  it('returns exactly 3 candidates', () => {
    const candidates = generateNarrativeCandidates(
      'hunger.gather', 'default', 42,
    );
    expect(candidates).toHaveLength(3);
  });

  it('produces deterministic results for same seed', () => {
    const a = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const b = generateNarrativeCandidates('hunger.gather', 'default', 42);
    expect(a.map(c => c.tempId)).toEqual(b.map(c => c.tempId));
  });

  it('produces different results for different seeds', () => {
    const a = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const b = generateNarrativeCandidates('hunger.gather', 'default', 99);
    const aIds = a.map(c => c.archetypeId);
    const bIds = b.map(c => c.archetypeId);
    expect(aIds).not.toEqual(bIds);
  });

  it('biases toward Hunger-resonant vignettes', () => {
    const reachCounts: Record<string, number> = {};
    for (let seed = 0; seed < 100; seed++) {
      const candidates = generateNarrativeCandidates('hunger.gather', 'default', seed);
      for (const c of candidates) {
        reachCounts[c.primaryReach] = (reachCounts[c.primaryReach] ?? 0) + 1;
      }
    }
    // Gather resonates with heart, veil, star — these should appear more often
    expect(reachCounts['heart'] ?? 0).toBeGreaterThan(reachCounts['shadow'] ?? 0);
  });

  it('falls back to full pool when Hunger has no matches', () => {
    const candidates = generateNarrativeCandidates(
      'hunger.nonexistent' as any, 'default', 42,
    );
    expect(candidates).toHaveLength(3);
  });

  it('each candidate has required fields', () => {
    const candidates = generateNarrativeCandidates('hunger.gather', 'default', 42);
    for (const c of candidates) {
      expect(c.tempId).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.vignetteText).toBeTruthy();
      expect(c.epithet).toBeTruthy();
      expect(c.imageAssetPath).toBeTruthy();
      expect(c.primaryReach).toBeTruthy();
      expect(c.secondaryReach).toBeTruthy();
      expect(c.reachCapabilities).toBeTruthy();
      expect(c.axiologicalSeed).toBeTruthy();
    }
  });
});

describe('generateSparkVisions', () => {
  it('returns exactly 3 visions for a given primary reach', () => {
    const visions = generateSparkVisions('iron', 'force', 42);
    expect(visions).toHaveLength(3);
  });

  it('all visions match the primary reach', () => {
    const visions = generateSparkVisions('gold', 'energy', 42);
    for (const v of visions) {
      expect(v.requiredPrimaryReach).toBe('gold');
    }
  });

  it('falls back to random visions if reach has fewer than 3', () => {
    for (const reach of ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'] as const) {
      const visions = generateSparkVisions(reach, 'force', 42);
      expect(visions.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('buildNarrativeResult', () => {
  it('builds a MeetingEncounterResult from narrative flow state', () => {
    const candidates = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const candidate = candidates[0];
    const visions = generateSparkVisions(candidate.primaryReach, 'life', 42);
    const vision = visions[0];

    const result = buildNarrativeResult({
      candidate,
      vision,
      dilemmaChoices: [],
      editedName: undefined,
      locationId: 'loc_test',
      ascendantSphere: 'life',
      tick: 10,
    });

    expect(result.name).toBe(candidate.name);
    expect(result.primaryReach).toBe(candidate.primaryReach);
    expect(result.secondaryReach).toBe(candidate.secondaryReach);
    expect(result.locationId).toBe('loc_test');
    expect(result.meetingChoiceRecord.sparkVisionId).toBe(vision.id);
    expect(result.portraitAssetPath).toBe(candidate.imageAssetPath);
    const investedReach = vision.reachInvestment;
    expect(result.reachCapabilities[investedReach]).toBeGreaterThan(
      candidate.reachCapabilities[investedReach],
    );
  });

  it('uses edited name when provided', () => {
    const candidates = generateNarrativeCandidates('hunger.gather', 'default', 42);
    const visions = generateSparkVisions(candidates[0].primaryReach, 'life', 42);

    const result = buildNarrativeResult({
      candidate: candidates[0],
      vision: visions[0],
      dilemmaChoices: [],
      editedName: 'Custom Name',
      locationId: 'loc_test',
      ascendantSphere: 'life',
      tick: 10,
    });

    expect(result.name).toBe('Custom Name');
  });
});
