/**
 * Group-name stability golden — THR-1297 slice 4.
 *
 * Slice 4 moved `hashSeed` / `pick` / `possessive` out of `groupNames.ts` and into the
 * shared work-namer module ("never a second namer"). Those three primitives decide
 * every company name in every existing world, so the refactor had exactly one way to
 * be wrong that no type or unit test would catch: a changed draw sequence, silently
 * renaming every company that has ever formed.
 *
 * This is a **differential**, not a captured literal — it compares the live namer
 * against a byte-copy of `origin/main`'s implementation held at
 * `../__groupNamesBaseline.ts`. A captured-literal golden would be the refactor
 * agreeing with itself the moment someone regenerated the fixtures; a differential
 * cannot be regenerated into agreement, because the other side is the old code.
 *
 * Slice 1's lesson applies and was applied: its first golden passed 9/9 while being
 * vacuous, because the corpus contained none of the shape under test. So the contexts
 * below deliberately exercise **every branch** of the generator — each pattern-gating
 * input present and absent, the faction-possessive fork, the reunite fork, the
 * s-ending possessive, and the total-fallback path.
 */

import { describe, it, expect } from 'vitest';
import { generateGroupName, type GroupNameContext } from '../groupNames';
import { generateGroupName as generateGroupNameBaseline } from './groupNamesBaseline';

/**
 * One entry per branch the generator can take. `id` varies across cases so the
 * seeded pattern choice varies too — a corpus that only ever picked pattern 0 would
 * be the vacuous-golden failure again.
 */
const CASES: ReadonlyArray<{ label: string; ctx: GroupNameContext }> = [
  // ── the plain wandering-company fork (no faction) ────────────────────────────
  { label: 'bare id only', ctx: { groupId: 'group_alpha' } },
  { label: 'leader only', ctx: { groupId: 'group_beta', leaderName: 'Kael Thornweaver' } },
  { label: 'location only', ctx: { groupId: 'group_gamma', locationName: 'Ashford Bridge' } },
  { label: 'leader + location', ctx: { groupId: 'group_delta', leaderName: 'Corran', locationName: 'Millbrook' } },
  { label: 'cause flavor', ctx: { groupId: 'group_eps', cause: 'seeking_companions', leaderName: 'Vesna' } },
  { label: 'sphere flavor', ctx: { groupId: 'group_zeta', sphereId: 'entropy', locationName: 'Cinderhold' } },
  { label: 'unknown sphere id (fail-soft arm)', ctx: { groupId: 'group_eta', sphereId: 'not_a_sphere' } },
  { label: 'every input at once', ctx: { groupId: 'group_theta', cause: 'seeking_companions', sphereId: 'life', leaderName: 'Iselle', locationName: 'Greenhollow' } },

  // ── the possessive rule itself — the primitive that moved ────────────────────
  { label: 'leader ending in s', ctx: { groupId: 'group_iota', leaderName: 'Thomas' } },
  { label: 'leader ending in s, with location', ctx: { groupId: 'group_kappa', leaderName: 'Silas', locationName: 'Redfen' } },

  // ── the faction-possessive fork (bands) ──────────────────────────────────────
  { label: 'faction only', ctx: { groupId: 'group_lambda', factionName: 'The Arcane Circle' } },
  { label: 'faction ending in s', ctx: { groupId: 'group_mu', factionName: 'The Lorekeepers' } },
  { label: 'faction + leader + location (faction wins)', ctx: { groupId: 'group_nu', factionName: 'The Civic Guard', leaderName: 'Bran', locationName: 'Stonegate' } },

  // ── the reunite fork ─────────────────────────────────────────────────────────
  { label: 'predecessor with article', ctx: { groupId: 'group_xi', predecessorName: 'The Ashen Blades' } },
  { label: 'predecessor without article', ctx: { groupId: 'group_omicron', predecessorName: 'Nightwatch' } },
  { label: 'predecessor blank falls through', ctx: { groupId: 'group_pi', predecessorName: '   ', leaderName: 'Maro' } },
  { label: 'predecessor + full context', ctx: { groupId: 'group_rho', predecessorName: 'The Red Company', leaderName: 'Alia', locationName: 'Farhaven', cause: 'reunite' } },
];

describe('group names are unchanged by the slice-4 primitive extraction', () => {
  it.each(CASES)('$label', ({ ctx }) => {
    expect(generateGroupName(ctx)).toBe(generateGroupNameBaseline(ctx));
  });

  it('the corpus actually exercises every pattern fork (anti-vacuity)', () => {
    const names = CASES.map(c => generateGroupName(c.ctx));
    // A corpus collapsing to one or two distinct renderings would pass the
    // differential above while proving nothing about the branches it never took.
    expect(new Set(names).size).toBeGreaterThanOrEqual(10);
    // And the faction fork must really be distinguishable from the plain fork.
    expect(names.some(n => n.includes('Arcane Circle'))).toBe(true);
  });

  it('is deterministic — the same context names the same company twice', () => {
    for (const { ctx } of CASES) {
      expect(generateGroupName(ctx)).toBe(generateGroupName(ctx));
    }
  });

  it('never returns a blank or an unresolved token', () => {
    for (const { ctx } of CASES) {
      const name = generateGroupName(ctx);
      expect(name.trim().length).toBeGreaterThan(0);
      expect(name).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });
});
