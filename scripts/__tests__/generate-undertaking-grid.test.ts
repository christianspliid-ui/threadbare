/**
 * The subsystem × verb view's three-way reach join (THR-1431).
 *
 * The view used to ask one question — does a live cell act on a kind this subsystem
 * *owns*. Five subsystems own no kind and so read UNTOUCHED although a mortal's work
 * reaches every one of them each run, which would have under-counted every explorer
 * calling once THR-1403 computes the map's fourth per-calling gate off this view.
 *
 * Each of the three ways in is pinned here **and falsified** by removing its source: a
 * pin that still passes with its cause taken away is measuring nothing. The falsifiers
 * perturb the builder's own inputs rather than a fixture, so they run against the real
 * registry — a fixture asserting both sides of the join would only verify itself.
 */
import { describe, it, expect } from 'vitest';

import { buildGrid, buildOpReach, buildSubsystemView, type Cell } from '../generate-undertaking-grid';
import { UNTOUCHED_BY_DESIGN } from '../undertaking-grid-dispositions';
import { SUBSYSTEMS } from '../subsystems-registry';

const repoRoot = process.cwd();
const { cells } = buildGrid();
const { reaches, problems: opProblems } = buildOpReach(repoRoot, cells);
const { rows, problems } = buildSubsystemView(cells, reaches);

const row = (name: string) => {
  const r = rows.find(x => x.subsystem === name);
  if (!r) throw new Error(`no subsystem row for '${name}'`);
  return r;
};

/** Re-run the view with every live cell of these kinds demoted — the owned-kind falsifier. */
function withoutLiveCellsOf(kinds: readonly string[], reachSet = reaches) {
  const owned = new Set<string>(kinds);
  const demoted: Cell[] = cells.map(c => (owned.has(c.kind) && c.status === 'live' ? { ...c, status: 'wanted' as const } : c));
  return buildSubsystemView(demoted, reachSet).rows;
}

describe('undertaking grid — the op-module join (THR-1431)', () => {
  it('sees every live cell in the registry source', () => {
    // The join parses the registry file. If that parsing silently broke, every cell
    // would resolve to nothing and the view would quietly go back to the old answer —
    // so the absence of "cannot see it" problems is the load-bearing assertion here.
    expect(opProblems.filter(p => p.includes('cannot see it'))).toEqual([]);
    expect(opProblems).toEqual([]);
  });

  it('resolves live cells to real engine modules, not a hand map', () => {
    expect(reaches.length).toBeGreaterThan(10); // a non-empty population: the guard is not vacuous
    // A sustained mode has no semantic function, so it resolves through the module that
    // PRODUCES the op result — `claim_control` is returned only by `strategicGraphOps`.
    const claim = reaches.find(r => r.cell === 'Claim × location');
    expect(claim?.modules).toContain('strategicGraphOps.ts');
    expect(claim?.subsystems).toContain('Strategic Projects & Control');
    for (const r of reaches) {
      expect(r.modules.length).toBeGreaterThan(0);
      expect(r.subsystems.length).toBeGreaterThan(0);
    }
  });
});

describe('undertaking grid — the three ways a subsystem is reached (THR-1431)', () => {
  it('counts every registry subsystem exactly once', () => {
    expect(rows).toHaveLength(SUBSYSTEMS.length);
    expect(new Set(rows.map(r => r.subsystem)).size).toBe(SUBSYSTEMS.length);
  });

  it('reaches the five subsystems the owned-kind join alone could not see', () => {
    // THR-1401's measurement: each is reached by a mortal's work every run, and each
    // read UNTOUCHED because it owns no world-object kind.
    for (const name of [
      'Strategic Projects & Control',
      'Movement & Colocation',
      'Intelligence, Knowledge & Familiarity',
      'Ruins, Clues & Delves',
      'Spheres & Quintessence',
    ]) {
      expect(row(name).status, `${name} should no longer read UNTOUCHED`).not.toBe('untouched');
    }
  });

  it('owned kind — pinned, and falsified by demoting the cells that own it', () => {
    const worldGen = row('World Generation, Terrain & Places');
    expect(worldGen.status).toBe('live-touched');
    expect(worldGen.kinds.length).toBeGreaterThan(0);

    const falsified = withoutLiveCellsOf(worldGen.kinds);
    expect(falsified.find(r => r.subsystem === worldGen.subsystem)?.status).not.toBe('live-touched');
  });

  it('the operation\'s home module — pinned, and falsified by removing the op reach', () => {
    // Personality & Emergent Traits owns `trait`, which carries no live cell; it is
    // reached only because destroy × Condition's cure runs in `traits.ts`. Take that
    // away and nothing else reaches it, so the fall is all the way to UNTOUCHED.
    const traits = row('Personality & Emergent Traits');
    expect(traits.status).toBe('reached-by-op');
    expect(traits.reachedByOps.length).toBeGreaterThan(0);

    const falsified = buildSubsystemView(cells, reaches.filter(r => !r.subsystems.includes(traits.subsystem))).rows;
    expect(falsified.find(r => r.subsystem === traits.subsystem)?.status).toBe('untouched');
  });

  it('a reader — pinned, and falsified by demoting the live cells it reads', () => {
    // Quintessence reads what use × Power leaves: the soul-price becomes a
    // `QuintessenceEvent` (THR-1428 R4). A reader only counts as reach while the
    // subsystem it reads actually has live cells, which is what this removes.
    const spheres = row('Spheres & Quintessence');
    expect(spheres.status).toBe('reads');
    expect(spheres.readsFrom.map(x => x.from)).toContain('Attachments, Items & Possessions');

    const falsified = withoutLiveCellsOf(row('Attachments, Items & Possessions').kinds);
    expect(falsified.find(r => r.subsystem === spheres.subsystem)?.status).toBe('untouched');
  });
});

describe('undertaking grid — the by-design list is total both ways (THR-1401)', () => {
  it('builds clean against the real registry', () => {
    expect(problems).toEqual([]);
  });

  it('every UNTOUCHED subsystem says why a mortal\'s work never moves it', () => {
    const untouched = rows.filter(r => r.status === 'untouched');
    expect(untouched.length).toBeGreaterThan(0);
    for (const r of untouched) expect(r.byDesign, `${r.subsystem} is UNTOUCHED with no reason`).toBeTruthy();
  });

  it('no by-design reason survives for a subsystem something now reaches', () => {
    expect(UNTOUCHED_BY_DESIGN.length).toBeGreaterThan(0);
    for (const u of UNTOUCHED_BY_DESIGN) {
      expect(row(u.subsystem).status, `${u.subsystem} is reached now — its by-design reason is stale`).toBe('untouched');
      expect(u.reason.trim().length).toBeGreaterThan(0);
    }
  });
});
