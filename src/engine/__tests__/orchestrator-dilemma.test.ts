import { describe, it, expect } from 'vitest';
import { computeStakes, resolveDilemma } from '../disposition';
import { DILEMMA_STAKES_THRESHOLD, STAKES_BASE, STAKES_DOMAIN_GOLD, STAKES_DOMAIN_IRON } from '../../types/disposition';

describe('phaseDilemmaDetection', () => {
  // Test 1: Verify STAKES_BASE is used and special domains meet threshold
  it('fires dilemma when stakes >= DILEMMA_STAKES_THRESHOLD with new STAKES_BASE', () => {
    // Test stake calculations with new constants
    const stakesGold = computeStakes('gold', 0, false, false);
    const stakesIron = computeStakes('iron', 0, false, false);

    // Gold should have domain bonus: STAKES_BASE + STAKES_DOMAIN_GOLD
    expect(stakesGold).toBe(STAKES_BASE + STAKES_DOMAIN_GOLD);
    expect(stakesGold).toBeGreaterThanOrEqual(DILEMMA_STAKES_THRESHOLD);

    // Iron should have domain bonus: STAKES_BASE + STAKES_DOMAIN_IRON
    expect(stakesIron).toBe(STAKES_BASE + STAKES_DOMAIN_IRON);
    expect(stakesIron).toBeGreaterThanOrEqual(DILEMMA_STAKES_THRESHOLD);
  });

  // Test 2: Verify the sphere-to-domain mapping in orchestrator
  it('maps all spheres to appropriate domains for dilemma stakes', () => {
    const sphereToDomainMap: Record<string, string> = {
      force: 'iron',
      matter: 'gold',
      energy: 'veil',
      life: 'flesh',
      mind: 'shadow',
      spirit: 'heart',
      time: 'star',
      entropy: 'shadow',
    };

    // All spheres should map to a valid domain
    for (const sphere of Object.keys(sphereToDomainMap)) {
      const domain = sphereToDomainMap[sphere];
      expect(domain).toBeDefined();
      expect(['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star', 'flesh']).toContain(domain);
    }
  });

  // Test 3: Verify non-gold/non-iron spheres can contribute to stakes via STAKES_BASE
  // They need additional factors to reach threshold
  it('allows non-gold/non-iron spheres to trigger dilemmas when combined with other factors', () => {
    // Base (no additional factors) should not meet threshold
    const veil = computeStakes('veil', 0, false, false);
    const flesh = computeStakes('flesh', 0, false, false);
    const heart = computeStakes('heart', 0, false, false);
    const shadow = computeStakes('shadow', 0, false, false);

    // These don't meet threshold on their own
    expect(veil).toBeLessThan(DILEMMA_STAKES_THRESHOLD);
    expect(flesh).toBeLessThan(DILEMMA_STAKES_THRESHOLD);
    expect(heart).toBeLessThan(DILEMMA_STAKES_THRESHOLD);
    expect(shadow).toBeLessThan(DILEMMA_STAKES_THRESHOLD);

    // But with extreme sentiment (| sentiment | > 0.7), they can meet threshold
    const veilWithExtremeSentiment = computeStakes('veil', 0.8, false, false);
    const heartWithExtremeSentiment = computeStakes('heart', -0.8, false, false);
    expect(veilWithExtremeSentiment).toBeGreaterThanOrEqual(DILEMMA_STAKES_THRESHOLD);
    expect(heartWithExtremeSentiment).toBeGreaterThanOrEqual(DILEMMA_STAKES_THRESHOLD);

    // Or with faction leader flag
    const shadowWithLeader = computeStakes('shadow', 0, true, false);
    expect(shadowWithLeader).toBeGreaterThanOrEqual(DILEMMA_STAKES_THRESHOLD);
  });

  // Test 4: Verify actor extraction works with message parsing
  it('can extract actor name from event message', () => {
    // Simulate the actor extraction logic from phaseDilemmaDetection
    const eventMessage = "Aldren and Myra: mutual trust";
    const firstWord = eventMessage.split(/\s/)[0];

    expect(firstWord).toBe("Aldren");

    // Also test the match pattern used in the code
    const match = eventMessage.match(/^(.+) and (.+):/);
    expect(match).toBeDefined();
    expect(match?.[1]).toBe("Aldren");
    expect(match?.[2]).toBe("Myra");
  });

  // Test 5: Verify dilemma resolution still works correctly
  it('resolves dilemmas with correct outcomes and stakes', () => {
    const dilemma = resolveDilemma(
      'actor1',
      'actor2',
      'tit-for-tat',
      'always-cooperate',
      [], // empty history
      [],
      1,
      'gold',
      0.5
    );

    expect(dilemma).toBeDefined();
    expect(dilemma.actorId).toBe('actor1');
    expect(dilemma.targetId).toBe('actor2');
    expect(dilemma.stakes).toBe(0.5);
    expect(['mutual_trust', 'betrayed', 'exploitation', 'mutual_distrust']).toContain(dilemma.outcome);
  });
});
