import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildDashboardData,
  parseStatusValue,
  slugifyHeading,
} from '../generate-ul-dashboard-data';

const README_FIXTURE = `# Ubiquitous Language — Index

| Shard | Content | Content-adjacent |
|---|---|---|
| [Cosmology.md](./Cosmology.md) | Reaches | ✅ |
| [Graph.md](./Graph.md) | Nodes | ❌ |

## Term Index

### Cosmology

- **[Reach](./Cosmology.md#reach)** — one of eight action domains
- **[Sphere](./Cosmology.md#sphere)** — a cosmic energy

### Graph

- **[Node](./Graph.md#node)** — basic graph entity
`;

const COSMOLOGY_FIXTURE = `# Ubiquitous Language — Cosmology

Content-adjacent shard.

---

### Reach

**Aliases:** Action Domain, ReachDomain
**Also see:** \`[[Sphere]]\`, \`[[Node]]\`
**Status:** canonical

One of eight axes. Reaches classify *what* an actor does.

---

### Sphere

**Aliases:** Cosmic Energy
**Also see:** \`[[Reach]]\`, \`[[Missing Term]]\`
**Status:** canonical

A cosmic energy that fuels action.
`;

const GRAPH_FIXTURE = `# Ubiquitous Language — Graph

Not content-adjacent.

---

### Node

**Aliases:** GraphNode
**Status:** weird-status

Basic entity.

---

### Unset Weave

**Aliases:** unset-weave framing
**Status:** rejected

A framing that was considered and refused; never admitted to canon.

---

### Seated Word

**Status:** canonical (seated by THR-1380 with the THR-1299 implementation)

A term whose status line carries its provenance.

---

### Dashed Word

**Status:** proposed — resolver lands in THR-1487 (THR-1481 slice 3)

A term whose note follows an em-dash.

---

### Old Word

**Status:** retired (THR-108; entry corrected 2026-08-28, THR-1339)

A term withdrawn with its successor recorded.

---

### Missing Word

No status line at all.
`;

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ul-gen-'));
  fs.writeFileSync(path.join(tmpDir, 'README.md'), README_FIXTURE, 'utf8');
  fs.writeFileSync(path.join(tmpDir, 'Cosmology.md'), COSMOLOGY_FIXTURE, 'utf8');
  fs.writeFileSync(path.join(tmpDir, 'Graph.md'), GRAPH_FIXTURE, 'utf8');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('slugifyHeading', () => {
  it('matches GitHub auto-anchor format', () => {
    expect(slugifyHeading('Reach')).toBe('reach');
    expect(slugifyHeading('Sphere Alignment')).toBe('sphere-alignment');
    expect(slugifyHeading('IPK (Instant Prose Kernel)')).toBe(
      'ipk-instant-prose-kernel',
    );
    expect(slugifyHeading('Fixes THR-XX')).toBe('fixes-thr-xx');
  });
});

describe('buildDashboardData', () => {
  it('parses shards, terms, aliases, and status', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });

    expect(data.schemaVersion).toBe(1);
    expect(data.shards).toHaveLength(2);
    expect(data.shards.map((s) => s.id)).toEqual(['cosmology', 'graph']);
    expect(data.shards[0].contentAdjacent).toBe(true);
    expect(data.shards[1].contentAdjacent).toBe(false);
    expect(data.shards[0].termCount).toBe(2);

    const reach = data.terms.find((t) => t.slug === 'reach');
    expect(reach).toBeDefined();
    expect(reach?.aliases).toEqual(['Action Domain', 'ReachDomain']);
    expect(reach?.status).toBe('canonical');
    expect(reach?.oneLiner).toBe('one of eight action domains');
    expect(reach?.body).toMatch(/One of eight axes/);
    expect(reach?.contentAdjacent).toBe(true);
    expect(reach?.sourcePath).toBe(
      'Docs/ubiquitous-language/Cosmology.md#reach',
    );
  });

  it('resolves cross-shard See-Also wikilinks', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });
    const reach = data.terms.find((t) => t.slug === 'reach');
    expect(reach?.seeAlso).toHaveLength(2);

    const sphereLink = reach?.seeAlso.find((l) => l.termName === 'Sphere');
    expect(sphereLink?.resolvedSlug).toBe('cosmology#sphere');

    const nodeLink = reach?.seeAlso.find((l) => l.termName === 'Node');
    expect(nodeLink?.resolvedSlug).toBe('graph#node');
  });

  it('emits an unresolved_see_also warning for missing terms', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });
    const missing = data.warnings.find(
      (w) => w.kind === 'unresolved_see_also' && w.detail.includes('Missing Term'),
    );
    expect(missing).toBeDefined();
    expect(missing?.shardId).toBe('cosmology');
    expect(missing?.termSlug).toBe('sphere');
  });

  it('emits a missing_status warning for unrecognized status values', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });
    const missingStatus = data.warnings.find(
      (w) => w.kind === 'missing_status' && w.termSlug === 'node',
    );
    expect(missingStatus).toBeDefined();
    const node = data.terms.find((t) => t.slug === 'node');
    expect(node?.status).toBe('unknown');
  });

  // THR-1470: an unrecognized value is ONE warning, not two. Before the fix the
  // "No `**Status:**` line found" warning keyed on the degraded `unknown` status
  // rather than on the line's absence, so every unrecognized value fired both
  // and the spurious second buried the genuine missing-line cases.
  it('emits exactly one warning for an unrecognized value and one for an absent line', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });
    const forNode = data.warnings.filter(
      (w) => w.kind === 'missing_status' && w.termSlug === 'node',
    );
    expect(forNode).toHaveLength(1);
    expect(forNode[0].detail).toMatch(/Unrecognized status value "weird-status"/);

    const forMissing = data.warnings.filter(
      (w) => w.kind === 'missing_status' && w.termSlug === 'missing-word',
    );
    expect(forMissing).toHaveLength(1);
    expect(forMissing[0].detail).toMatch(/No `\*\*Status:\*\*` line found/);
    expect(data.terms.find((t) => t.slug === 'missing-word')?.status).toBe('unknown');
  });

  // THR-1470: the membership predicate — a value that BEGINS WITH a status word
  // parses to that status, and the annotation survives as `statusNote`. The
  // warning list per term is asserted empty for the same reason the THR-991 case
  // does it: the pre-fix failure was two warnings on a term whose `.status`
  // alone would not have told you which.
  it('parses annotated status values to the leading word and keeps the note', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });
    const warningsFor = (slug: string) =>
      data.warnings.filter((w) => w.kind === 'missing_status' && w.termSlug === slug);

    const seated = data.terms.find((t) => t.slug === 'seated-word');
    expect(seated?.status).toBe('canonical');
    expect(seated?.statusNote).toBe('seated by THR-1380 with the THR-1299 implementation');
    expect(warningsFor('seated-word')).toEqual([]);

    const dashed = data.terms.find((t) => t.slug === 'dashed-word');
    expect(dashed?.status).toBe('proposed');
    expect(dashed?.statusNote).toBe('resolver lands in THR-1487 (THR-1481 slice 3)');
    expect(warningsFor('dashed-word')).toEqual([]);

    const old = data.terms.find((t) => t.slug === 'old-word');
    expect(old?.status).toBe('retired');
    expect(old?.statusNote).toBe('THR-108; entry corrected 2026-08-28, THR-1339');
    expect(warningsFor('old-word')).toEqual([]);

    // A bare status carries no note.
    expect(data.terms.find((t) => t.slug === 'reach')?.statusNote).toBeNull();
  });
});

describe('parseStatusValue', () => {
  it('accepts every status word bare, in any case', () => {
    for (const word of ['canonical', 'proposed', 'deprecated', 'rejected', 'retired']) {
      expect(parseStatusValue(word)).toEqual({ status: word, note: null });
      expect(parseStatusValue(word.toUpperCase())).toEqual({ status: word, note: null });
    }
  });

  it('strips one separator and one whole-value parenthetical pair', () => {
    expect(parseStatusValue('canonical (seated 2026-09-03, THR-1390)')).toEqual({
      status: 'canonical',
      note: 'seated 2026-09-03, THR-1390',
    });
    expect(parseStatusValue('canonical — seated in `src/data/content-tags.ts` by THR-1486')).toEqual({
      status: 'canonical',
      note: 'seated in `src/data/content-tags.ts` by THR-1486',
    });
    expect(parseStatusValue('canonical: note')).toEqual({ status: 'canonical', note: 'note' });
    // Two sibling groups are not one pair — the outer parens stay.
    expect(parseStatusValue('canonical (a) (b)')).toEqual({
      status: 'canonical',
      note: '(a) (b)',
    });
    // An empty parenthetical is a bare status.
    expect(parseStatusValue('canonical ()')).toEqual({ status: 'canonical', note: null });
  });

  it('does not treat a prefix of a status word as a match', () => {
    expect(parseStatusValue('canonical-ish')).toEqual({ status: 'unknown', note: null });
    expect(parseStatusValue('canonicalised')).toEqual({ status: 'unknown', note: null });
    expect(parseStatusValue('weird-status')).toEqual({ status: 'unknown', note: null });
    expect(parseStatusValue('')).toEqual({ status: 'unknown', note: null });
  });

  // THR-991: `rejected` is a real status, not an unrecognized value degrading to
  // `unknown`. Asserting the warning list is EMPTY rather than that the status
  // parsed: the pre-fix failure emitted two warnings for one entry — the
  // unrecognized-value one and, because the degraded status was `unknown`, the
  // "No `**Status:**` line found" one. A test that only read `.status` would
  // pass while the second warning still fired.
  it('accepts `rejected` as a status without warning', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });

    const unsetWeave = data.terms.find((t) => t.slug === 'unset-weave');
    expect(unsetWeave?.status).toBe('rejected');
    expect(
      data.warnings.filter(
        (w) => w.kind === 'missing_status' && w.termSlug === 'unset-weave',
      ),
    ).toEqual([]);
  });

  // THR-714: byte-identical, not merely equal-modulo-a-timestamp. A per-run
  // field made two PRs that both ran `prebuild` carry different blobs, which
  // conflicts on every cascade merge and silently stalls armed auto-merges.
  it('serializes byte-identically across runs with unchanged sources', () => {
    const a = buildDashboardData({ sourceRoot: tmpDir });
    const b = buildDashboardData({ sourceRoot: tmpDir });
    expect(JSON.stringify(a, null, 2)).toBe(JSON.stringify(b, null, 2));
  });

  it('emits no wall-clock field', () => {
    const data = buildDashboardData({ sourceRoot: tmpDir });
    expect(Object.keys(data)).not.toContain('generatedAt');
  });
});
