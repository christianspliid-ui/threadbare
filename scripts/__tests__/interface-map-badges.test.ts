/**
 * THR-1316 — the pins that keep the 🟣 HOLLOW badge from becoming vocabulary
 * nobody wired.
 *
 * HOLLOW is the interface map's expression of the UL's `claim-without-anchor`
 * class, added by absorbed ruling 3 of the shared-anchor-machinery plan. It is
 * **pin-only** — no mechanical check assigns it — which is exactly the shape that
 * rots without noticing: a badge that nothing can produce and nothing asserts
 * would sit in the union looking wired while the ratchet quietly excluded it.
 *
 * Two properties are worth a test rather than a comment:
 *
 *   1. HOLLOW is in `TICKETED_BADGES`. Dropping it there is a one-word edit that
 *      nothing else fails on, and the consequence is a released content defect
 *      shipping without a remediation ticket — the exact escape the LEAKED
 *      ratchet exists to prevent.
 *   2. The registry stays honest about it. HOLLOW may only arrive via
 *      `badgeOverride`, whose `deferralTicket` `validateRegistry` already checks;
 *      the test drives that real path rather than restating the type.
 *
 * `BADGE_LABEL` needs no test — `Record<ContractBadge, string>` makes a missing
 * label a compile error, and a test asserting what the compiler already enforces
 * is ceremony.
 */

import { describe, it, expect } from 'vitest';

import {
  CONTRACTS,
  TICKETED_BADGES,
  validateRegistry,
  type Contract,
} from '../interface-contracts.ts';

/** A minimal well-formed row, so each case varies exactly one thing. */
function row(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'test-row',
    producerSystem: CONTRACTS[0].producerSystem,
    consumerSystem: CONTRACTS[0].consumerSystem,
    intent: 'fixture',
    mechanism: { kind: 'function', symbols: ['someSymbol'] },
    writeSites: [],
    readSites: [],
    ...overrides,
  };
}

describe('interface-map badge vocabulary (THR-1316)', () => {
  it('ratchets HOLLOW alongside LEAKED, so a pinned hollow claim must carry a ticket', () => {
    expect([...TICKETED_BADGES].sort()).toEqual(['HOLLOW', 'LEAKED']);
  });

  it('accepts a HOLLOW pin that cites a well-formed remediation ticket', () => {
    const errors = validateRegistry([
      row({
        badgeOverride: {
          badge: 'HOLLOW',
          reason: 'fixture — a chip naming an object with no referent',
          deferralTicket: 'THR-1130',
        },
      }),
    ]);
    expect(errors).toEqual([]);
  });

  it('rejects a HOLLOW pin whose ticket is not a THR reference', () => {
    const errors = validateRegistry([
      row({
        badgeOverride: {
          badge: 'HOLLOW',
          reason: 'fixture',
          deferralTicket: 'see the plan doc',
        },
      }),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].problem).toContain('is not a THR-<n> reference');
  });

  it('carries no HOLLOW row today — the class is measured by check:chip-anchors, not here', () => {
    // Not a wish: the canon page and the UL entry both state that the population
    // lives at template granularity under the chip-anchor ratchet. If a row is
    // ever legitimately pinned HOLLOW, this expectation is the place that says so
    // out loud, and updating it is the deliberate act of recording the first one.
    const pinned = CONTRACTS.filter((c) => c.badgeOverride?.badge === 'HOLLOW');
    expect(pinned).toEqual([]);
  });
});
