import { describe, expect, it } from 'vitest';
import { SPHERE_NAMES } from '../../types/index';

/**
 * Corpus invariant: every populated `sphereAffinity` on an authored action template is one
 * of the twelve Spheres (THR-1114).
 *
 * **Why a corpus sweep and not two assertions.** THR-1114 arrived naming two offenders —
 * `action.secrets.plant_secret` carrying `shadow` (a *Reach* in a Sphere field) and
 * `artifact.nullify` carrying `void` (nothing in the current cosmology at all). Both are
 * fixed in `unified-action-templates.ts`. Pinning only those two ids would close the two
 * instances and leave the *class* open: `sphereAffinity` is typed `SphereName`, but the
 * authored corpus is large enough that a wrong literal survives review, and it degrades
 * quietly — `resolveDisplay` renders a capitalised fallback, so the player sees a plausible
 * "Void sphere" rather than a raw key, and the Codex claims a sphere alignment the cosmology
 * does not have. The field is also read by prerequisite checks and scoring, not only by the
 * Codex, so a non-Sphere value is a behaviour defect wearing a display costume.
 *
 * **Why the glob rather than a hand-listed set of arrays.** `UNIFIED_ACTION_TEMPLATES` is
 * one of ~40 exported template arrays across `src/data` (faction shards, army, borderland,
 * arcane-circle, thread, revelation, …). A sweep scoped to the array the Codex happens to
 * enumerate would have reported this file clean while offenders sat in the faction shards —
 * the partial-coverage shape that lets a "corpus" guard pass vacuously. The glob collects
 * whatever is exported, so a new shard is covered the day it is authored, with no list to
 * remember to extend.
 */
/**
 * The negative pattern is load-bearing, not tidiness. `import.meta.glob` *imports* every
 * match eagerly, and importing a sibling `*.test.ts` registers its `describe`/`it` blocks
 * into this file — the first draft of this sweep reported "3956 tests" from three, and ran
 * the whole data suite a second time. Filtering `__tests__` while walking the exports is too
 * late; the damage is done at import.
 */
const dataModules = import.meta.glob(['../**/*.ts', '!../**/__tests__/**'], {
  eager: true,
}) as Record<string, Record<string, unknown>>;

interface AffinityBearer {
  readonly id: string;
  readonly sphereAffinity: unknown;
}

/** A template is anything exported carrying a string `id` alongside `steps` — the shape the engine resolves. */
function isTemplateLike(value: unknown): value is { id: string; sphereAffinity?: unknown } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && Array.isArray(candidate.steps);
}

function collectAffinityBearers(): AffinityBearer[] {
  const bearers: AffinityBearer[] = [];
  const seen = new Set<unknown>();

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }
    if (!isTemplateLike(value) || seen.has(value)) return;
    seen.add(value);
    if (value.sphereAffinity !== undefined && value.sphereAffinity !== null) {
      bearers.push({ id: value.id, sphereAffinity: value.sphereAffinity });
    }
  };

  for (const [path, moduleExports] of Object.entries(dataModules)) {
    if (path.includes('__tests__')) continue;
    for (const exportValue of Object.values(moduleExports)) visit(exportValue);
  }

  return bearers.sort((a, b) => a.id.localeCompare(b.id));
}

const AFFINITY_BEARERS = collectAffinityBearers();

/**
 * Non-vacuity floor. Measured 2026-09-10 on the built corpus; pinned well below the observed
 * count so authoring churn does not trip it, but far enough above zero that a glob that
 * silently stops resolving (a moved directory, a renamed export convention) fails loudly
 * instead of passing over an empty set. A guard over nothing is the failure mode this exists
 * to prevent — the assertion below is only worth its line if it ran over real templates.
 */
const MEASURED_AFFINITY_FLOOR = 150;

describe('sphereAffinity corpus invariant (THR-1114)', () => {
  it('sweeps a non-empty template population', () => {
    expect(AFFINITY_BEARERS.length).toBeGreaterThanOrEqual(MEASURED_AFFINITY_FLOOR);
  });

  it('every populated sphereAffinity is one of the twelve Spheres', () => {
    const spheres = new Set<string>(SPHERE_NAMES);
    const offenders = AFFINITY_BEARERS.filter(
      (bearer) => typeof bearer.sphereAffinity !== 'string' || !spheres.has(bearer.sphereAffinity),
    ).map((bearer) => `${bearer.id} -> ${String(bearer.sphereAffinity)}`);

    expect(offenders).toEqual([]);
  });

  /**
   * The guard's own falsification arm. Without it, the assertion above is indistinguishable
   * from one whose membership test is inverted, mis-typed, or reading a field nobody
   * populates — all of which pass green over a clean corpus. This proves the predicate can
   * still reject, using the exact values THR-1114 removed plus `star`, the third name its
   * parent ticket suspected.
   */
  it('rejects the non-Sphere values that motivated this guard', () => {
    const spheres = new Set<string>(SPHERE_NAMES);
    for (const notASphere of ['shadow', 'void', 'star']) {
      expect(spheres.has(notASphere)).toBe(false);
    }
    expect(spheres.has('darkness')).toBe(true);
    expect(spheres.has('entropy')).toBe(true);
  });
});
