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
    // exactly the bar `followOnTags` fails.
    expect(classifyRow({ writes: 'x', consumers: [spawns('a', 'b')] })).toBe('dormant-hook');
  });

  it('a tally-point with no acting consumer is bookkeeping', () => {
    expect(classifyRow({ writes: 'x', consumers: [tally('a', 'b')] })).toBe('bookkeeping');
  });

  it('a reader that only reports is not a consumer', () => {
    // The whole ledger turns on this line. `followOnTags` has a reader; a grep for
    // readers calls that seam healthy; and this is where that answer is refused.
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

describe('consumption ledger — the followOnTags demonstration', () => {
  /**
   * The plan's falsification check (THR-1212, absorbed ruling 2): the ledger had to
   * surface `followOnTags` *on its own*, or the design was wrong and went back for
   * rework. It did — and this pins the reason it did, which is not that anyone
   * wrote "dead" in the row.
   *
   * If someone gives the tag a consumer that acts, this test fails, and that is
   * correct: the demonstration case would have stopped being one.
   */
  it('clearance_gate_tag classifies write-without-consumer, from its consumers alone', () => {
    const row = EFFECT_ROWS.clearance_gate_tag;
    expect(row.consumers.length).toBeGreaterThan(0);
    expect(row.consumers.every((c) => c.kind === 'reports')).toBe(true);
    expect(classifyRow(row)).toBe('write-without-consumer');
  });

  it('is the only write-without-consumer in the committed ledger', () => {
    const dead = [
      ...effectKinds.filter((m) => classifyRow(EFFECT_ROWS[m]) === 'write-without-consumer'),
      ...graphOps.filter((m) => classifyRow(GRAPH_OP_ROWS[m]) === 'write-without-consumer'),
    ];
    expect(dead).toEqual(['clearance_gate_tag']);
  });

  it('its cited reader really is the follow-on sentence, not a consumer', () => {
    // Pinned against the source rather than trusted from the row: the citation is
    // only evidence while the reader still does what the row says it does.
    const source = read('src/engine/unifiedActionResolution.ts');
    expect(source).toContain('gateFollowOnSentence');
    expect(source).toContain("kind: 'future_hook'");
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
