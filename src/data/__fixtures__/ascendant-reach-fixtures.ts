/**
 * Ascendant-reach test fixtures (THR-494).
 *
 * Eight deterministic `AscendantIdentity` fixtures — one per primary Reach —
 * built from the canonical 1:1 Sphere↔Reach map. These let batch harnesses
 * (e.g. `scripts/gameplay-report.ts`) run "one ascendant per primary reach"
 * instead of a random archetype, which is the foundation of the Content Health
 * Report matrix (parent THR-493).
 *
 * Determinism: every field is fixed (no PRNG). Same reach → identical identity
 * across runs, so `initializeGameStateFromIdentity(fixture, seed)` is fully
 * reproducible.
 */

import type { AscendantIdentity } from '../../types/remembrance';
import type { ReachDomain } from '../../types/traits';
import type { CreationSphereName } from '../../types/index';
import { CREATION_SPHERE_NAMES } from '../../types/index';
import type { AxiologicalProfile } from '../../types/agent';
import { VALUE_PAIRS } from '../../types/agent';

// ─── Canonical 1:1 Sphere↔Reach map ──────────────────────────────────
//
// The primary Sphere that fuels each Reach. One Sphere per Reach, one Reach
// per Sphere. Authoritative for the reach-fixtures; do NOT confuse with the
// fuzzy one-to-many affinity maps used elsewhere (meetingEncounter.ts,
// agendaGenerator.ts) — those serve randomized selection, not pinned identity.

/** Reach → its paired primary Creation Sphere (1:1). */
export const REACH_PRIMARY_SPHERE: Record<ReachDomain, CreationSphereName> = {
  iron: 'force',
  stone: 'matter',
  eye: 'energy',
  gold: 'life',
  veil: 'mind',
  heart: 'spirit',
  star: 'time',
  shadow: 'entropy',
};

/** The 8 primary reaches, in canonical order — the report matrix axis. */
export const REPORT_ASCENDANT_REACHES: ReachDomain[] = [
  'iron', 'stone', 'eye', 'gold', 'veil', 'heart', 'star', 'shadow',
];

/** Inverse of REACH_PRIMARY_SPHERE: Creation Sphere → its paired Reach. */
const SPHERE_PRIMARY_REACH: Record<CreationSphereName, ReachDomain> =
  Object.fromEntries(
    (Object.entries(REACH_PRIMARY_SPHERE) as [ReachDomain, CreationSphereName][])
      .map(([reach, sphere]) => [sphere, reach]),
  ) as Record<CreationSphereName, ReachDomain>;

// ─── Fixture builder ─────────────────────────────────────────────────

/** Primary affinity score for the pinned reach (top of the domain profile). */
const PRIMARY_DOMAIN_AFFINITY = 5;
/** Secondary affinity score for the reach paired to the secondary sphere. */
const SECONDARY_DOMAIN_AFFINITY = 3;

/** All-neutral axiological profile (every value pair at 0.0). */
function neutralPersonality(): AxiologicalProfile {
  const profile = {} as AxiologicalProfile;
  for (const pair of VALUE_PAIRS) profile[pair] = 0;
  return profile;
}

function cap(reach: string): string {
  return reach.charAt(0).toUpperCase() + reach.slice(1);
}

/**
 * Build a deterministic `AscendantIdentity` pinned to a given primary reach.
 *
 * The primary sphere is the reach's paired Creation Sphere (per `map`); the
 * secondary sphere is the next Creation Sphere cyclically (always distinct
 * from the primary). Domain affinities top out at the pinned reach.
 */
export function buildReachAscendantIdentity(
  reach: ReachDomain,
  map: Record<ReachDomain, CreationSphereName> = REACH_PRIMARY_SPHERE,
): AscendantIdentity {
  const primarySphere = map[reach];
  const primaryIdx = CREATION_SPHERE_NAMES.indexOf(primarySphere);
  const secondarySphere =
    CREATION_SPHERE_NAMES[(primaryIdx + 1) % CREATION_SPHERE_NAMES.length];
  const secondaryReach = SPHERE_PRIMARY_REACH[secondarySphere];

  return {
    mortalName: `${cap(reach)}born`,
    originFragmentId: 'origin.reach-fixture',
    driveFragmentId: 'drive.reach-fixture',
    timeSinceAscension: 'ancient',
    mortalTags: [reach, primarySphere],
    divineName: `The ${cap(reach)} Sovereign`,
    hungerId: `hunger.reach.${reach}`,
    hungerName: `${cap(reach)} Hunger`,
    mandateDirection: `Drive the world toward ${reach} through the ${primarySphere} sphere.`,
    courtType: 'circle',
    sphereAlignment: { primary: primarySphere, secondary: secondarySphere },
    domainAffinities: {
      [reach]: PRIMARY_DOMAIN_AFFINITY,
      [secondaryReach]: SECONDARY_DOMAIN_AFFINITY,
    },
    personalitySeed: neutralPersonality(),
    ascendantLens: {
      perceptionStyle: `You see the world as ${reach} made manifest.`,
      emotionalTone: `Steady devotion to the ${primarySphere} sphere.`,
    },
  };
}

// ─── Baked fixtures ──────────────────────────────────────────────────

/** The 8 pinned-reach ascendant identities, keyed by primary reach. */
export const ASCENDANT_REACH_FIXTURES: Record<ReachDomain, AscendantIdentity> =
  Object.fromEntries(
    REPORT_ASCENDANT_REACHES.map((reach) => [reach, buildReachAscendantIdentity(reach)]),
  ) as Record<ReachDomain, AscendantIdentity>;

/**
 * Look up the pinned-reach ascendant identity for a reach.
 *
 * Fail-soft: an unknown reach throws a clear error listing the valid reaches,
 * so harness arg parsing surfaces a usable message rather than `undefined`.
 */
export function getAscendantReachIdentity(reach: string): AscendantIdentity {
  const identity = ASCENDANT_REACH_FIXTURES[reach as ReachDomain];
  if (!identity) {
    throw new Error(
      `Unknown ascendant reach "${reach}". Valid reaches: ${REPORT_ASCENDANT_REACHES.join(', ')}.`,
    );
  }
  return identity;
}
