/**
 * THR-1212 slice 4 — the consumption ledger's guards, pinned.
 *
 * The ledger's claim is that these 89 writes have been checked, so every way it
 * could quietly stop being true is a defect worth a test:
 *
 * - a new effect kind or op arriving with no row (the silent default: absence
 *   reads as "consumed", because that is what every other row says);
 * - a citation that no longer resolves (the interface map's read-site rot, which
 *   is invisible precisely because a plausible `file:symbol` pair looks checked);
 * - a `write-without-consumer` shipping unremarked;
 * - and — the one that would hollow out the whole artifact — the class ceasing to
 *   be *derived*, so a row could assert its own verdict.
 *
 * `check:generated-freshness` catches a stale committed copy at merge time. It
 * cannot assert that a guard **fires**, which is what these do.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import {
  AFTERMATH_TYPES_REL,
  EFFECT_ROWS,
  EFFECT_UNION_NAME,
  GRAPH_OP_ROWS,
  GRAPH_OP_TYPES_REL,
  GRAPH_OP_UNION_NAME,
  acts,
  assertConsumerSitesResolve,
  assertEveryMemberHasRow,
  assertWriteWithoutConsumerIsDeferred,
  classifyRow,
  parseDiscriminatedUnionKinds,
  parseStringUnionMembers,
  reports,
  spawns,
  tally,
  type LedgerRow,
} from '../consumption-ledger-sources.ts';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const read = (rel: string): string => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8');

const effectKinds = parseDiscriminatedUnionKinds(
  read(AFTERMATH_TYPES_REL),
  EFFECT_UNION_NAME,
  AFTERMATH_TYPES_REL,
);
const graphOps = parseStringUnionMembers(
  read(GRAPH_OP_TYPES_REL),
  GRAPH_OP_UNION_NAME,
  GRAPH_OP_TYPES_REL,
);

describe('consumption ledger — derived membership', () => {
  it('parses a non-empty membership from both unions', () => {
    // The vacuous-probe guard: every assertion below is over these two
    // populations, and all of them pass trivially if either parses to nothing.
    expect(effectKinds.length).toBeGreaterThan(0);
    expect(graphOps.length).toBeGreaterThan(0);
  });

  it('every union member has a curated row', () => {
    expect(() => assertEveryMemberHasRow(effectKinds, EFFECT_ROWS, EFFECT_UNION_NAME)).not.toThrow();
    expect(() => assertEveryMemberHasRow(graphOps, GRAPH_OP_ROWS, GRAPH_OP_UNION_NAME)).not.toThrow();
  });

  it('fails by name on a member with no row', () => {
    expect(() =>
      assertEveryMemberHasRow([...graphOps, 'probe_unrowed_op'], GRAPH_OP_ROWS, GRAPH_OP_UNION_NAME),
    ).toThrow(/probe_unrowed_op/);
  });

  it('fails by name on a stale row naming a member that no longer exists', () => {
    // The direction that makes the curated half self-correcting rather than a
    // comment that rots: a row about deleted code is as wrong as a missing one.
    expect(() =>
      assertEveryMemberHasRow(
        graphOps.filter((op) => op !== 'add_node'),
        GRAPH_OP_ROWS,
        GRAPH_OP_UNION_NAME,
      ),
    ).toThrow(/add_node/);
  });
});

describe('consumption ledger — citations are evidence', () => {
  it('every cited consumer site resolves against the file it names', () => {
    expect(() => assertConsumerSitesResolve(EFFECT_ROWS, EFFECT_UNION_NAME, read)).not.toThrow();
    expect(() => assertConsumerSitesResolve(GRAPH_OP_ROWS, GRAPH_OP_UNION_NAME, read)).not.toThrow();
  });

  it('fails when a cited symbol is absent from the cited file', () => {
    const fabricated: Record<string, LedgerRow> = {
      probe: { writes: 'x', consumers: [acts('src/types/graphOp.ts', 'aSymbolThatIsNotThere')] },
    };
    expect(() => assertConsumerSitesResolve(fabricated, 'probe', read)).toThrow(
      /aSymbolThatIsNotThere/,
    );
  });

  it('fails when a cited file does not exist', () => {
    const fabricated: Record<string, LedgerRow> = {
      probe: { writes: 'x', consumers: [acts('src/engine/noSuchFile.ts', 'anything')] },
    };
    expect(() => assertConsumerSitesResolve(fabricated, 'probe', read)).toThrow(/does not exist/);
  });
});

describe('consumption ledger — the class is derived, never authored', () => {
  it('an acting consumer makes a row acted-on', () => {
    expect(classifyRow({ writes: 'x', consumers: [acts('a', 'b')] })).toBe('acted-on');
  });

  it('a spawn with no acting consumer is a dormant hook', () => {
    // Hooks are not passive (THR-1161): the class requires a real spawn, which is
    // exactly the bar `followOnTags` failed before it was retired.
    expect(classifyRow({ writes: 'x', consumers: [spawns('a', 'b')] })).toBe('dormant-hook');
  });

  it('a tally-point with no acting consumer is bookkeeping', () => {
    expect(classifyRow({ writes: 'x', consumers: [tally('a', 'b')] })).toBe('bookkeeping');
  });

  it('a reader that only reports is not a consumer', () => {
    // The whole ledger turns on this line. `followOnTags` had a reader; a grep for
    // readers called that seam healthy; and this is where that answer was refused.
    expect(classifyRow({ writes: 'x', consumers: [reports('a', 'b')] })).toBe(
      'write-without-consumer',
    );
  });

  it('no consumers at all is write-without-consumer', () => {
    expect(classifyRow({ writes: 'x', consumers: [] })).toBe('write-without-consumer');
  });
});

describe('consumption ledger — write-without-consumer is deferred, not silent', () => {
  it('the committed rows all satisfy the deferral rule', () => {
    expect(() => assertWriteWithoutConsumerIsDeferred(EFFECT_ROWS, EFFECT_UNION_NAME)).not.toThrow();
    expect(() =>
      assertWriteWithoutConsumerIsDeferred(GRAPH_OP_ROWS, GRAPH_OP_UNION_NAME),
    ).not.toThrow();
  });

  it('fails by name on a dead write with no ticket', () => {
    const undeferred: Record<string, LedgerRow> = {
      probe_dead_write: { writes: 'x', consumers: [reports('a', 'b')] },
    };
    expect(() => assertWriteWithoutConsumerIsDeferred(undeferred, 'probe')).toThrow(
      /probe_dead_write/,
    );
  });

  it('a ticketed dead write is allowed through', () => {
    const deferred: Record<string, LedgerRow> = {
      probe: { writes: 'x', consumers: [reports('a', 'b')], deferralTicket: 'THR-1' },
    };
    expect(() => assertWriteWithoutConsumerIsDeferred(deferred, 'probe')).not.toThrow();
  });
});

describe('consumption ledger — the followOnTags demonstration, after the retirement', () => {
  /**
   * The plan's falsification check (THR-1212, absorbed ruling 2): the ledger had to
   * surface `followOnTags` *on its own*, or the design was wrong and went back for
   * rework. It did, slice 6 retired the member it found, and these tests are what
   * that block became.
   *
   * **A deletion can weaken the test that proved it was warranted, and this is the
   * shape of that trap.** The old assertion read `toEqual(['clearance_gate_tag'])`;
   * the honest post-retirement form is `toEqual([])`, which also passes when the
   * corpus is empty, when membership stops being derived, or when `classifyRow`
   * returns nothing at all. So "zero" is asserted only alongside the two things
   * that make zero mean something: a non-empty population, and a classifier still
   * demonstrably able to return the class — the latter proved on synthetic rows in
   * the `class is derived, never authored` block above, which is deliberately not
   * coupled to any live member and so survives every future retirement.
   */
  it('still has a population to classify, so an empty dead-list means something', () => {
    expect(effectKinds.length).toBeGreaterThan(0);
    expect(graphOps.length).toBeGreaterThan(0);
  });

  it('no longer carries the retired member in its derived membership', () => {
    // Membership comes from the union, so this fails by name if the effect kind is
    // ever reintroduced — at which point it owes a row, and a real consumer.
    expect(effectKinds).not.toContain('clearance_gate_tag');
    expect(Object.keys(EFFECT_ROWS)).not.toContain('clearance_gate_tag');
  });

  it('has no write-without-consumer left in the committed ledger', () => {
    const dead = [
      ...effectKinds.filter((m) => classifyRow(EFFECT_ROWS[m]) === 'write-without-consumer'),
      ...graphOps.filter((m) => classifyRow(GRAPH_OP_ROWS[m]) === 'write-without-consumer'),
    ];
    expect(dead).toEqual([]);
  });

  it('has lost the reader the retired row cited', () => {
    // The row's evidence was that its only reader merely reported. The retirement
    // deleted that reader, and this pins the deletion against the source rather
    // than trusting the diff.
    const source = read('src/engine/unifiedActionResolution.ts');
    expect(source).not.toContain('gateFollowOnSentence');
  });
});

describe('consumption ledger — the committed artifact', () => {
  it('is registered in both freshness registries', () => {
    // Slice 2's lesson: an unregistered source is invisible to the freshness gate,
    // so the artifact can publish an answer computed from code that has since moved
    // and the gate still reports OK.
    const artifact = 'Docs/canon/consumption-ledger.generated.md';
    expect(read('scripts/check-generated-freshness.ts')).toContain(artifact);
    expect(read('scripts/generated-artifact-sources.ts')).toContain(artifact);
  });

  it('is refreshed by prebuild', () => {
    expect(read('package.json')).toContain('generate-consumption-ledger &&');
  });

  it('exists and names every member', () => {
    const ledger = read('Docs/canon/consumption-ledger.generated.md');
    for (const member of [...effectKinds, ...graphOps]) {
      expect(ledger).toContain(`\`${member}\``);
    }
  });
});
