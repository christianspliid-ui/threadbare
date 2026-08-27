/**
 * Shared birth generators — the parts of "a new mortal exists" that more than one
 * path needs (THR-1296 §5).
 *
 * ## Why this module exists
 *
 * `phaseAgentLifecycle`'s births block was the only place in the engine that generated
 * a *complete* set of values for a person. Every other spawn path — the encounter
 * support bundle above all — wrote a fraction of one, which is the measured gap the
 * binder's mint path closes (recon THR-1289: support mints carry no
 * `axiologicalProfile`, no `domainCapabilities`, no `locationId`, no ambitions).
 *
 * Closing that gap by *copying* the births block into the binder would make two
 * generators to keep in step — the eligibility-drift shape the plan's §6 warns about
 * ("one function, never duplicated"). So the generator moved here, and both paths
 * call it.
 *
 * **Behaviour-preserving by construction.** This is `agentLifecycle`'s function moved,
 * not rewritten: the same draws in the same order off the caller's rng, so seed 42
 * still produces the world it produced before (NFP #3).
 */
import type { CosmologyProfile } from '../types/index';
import type { AxiologicalProfile } from '../types/agent';
import { VALUE_PAIRS } from '../types/agent';

/**
 * Values for a newly born mortal, biased by the world's cosmology.
 *
 * A high-entropy cosmology tilts `tradition_novelty` toward novelty; a settled one
 * tilts back. Every other axis is an unbiased draw in [-0.8, 0.8] — deliberately
 * short of the poles, so a birth is a person with leanings rather than a zealot.
 */
export function generateAxiologicalProfile(
  rng: () => number,
  cosmology: CosmologyProfile,
): AxiologicalProfile {
  const profile = {} as AxiologicalProfile;
  const chaosBias = (cosmology.entropy ?? 0) > 0.15 ? 0.2 : -0.1;

  for (const pair of VALUE_PAIRS) {
    const base = (rng() * 1.6) - 0.8;
    const bias = pair === 'tradition_novelty' ? chaosBias : 0;
    profile[pair] = Math.max(-1, Math.min(1, base + bias));
  }
  return profile;
}
