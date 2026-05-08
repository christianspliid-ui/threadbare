import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildDashboardData,
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

  it('produces a deterministic shape across runs (modulo generatedAt)', () => {
    const a = buildDashboardData({ sourceRoot: tmpDir });
    const b = buildDashboardData({ sourceRoot: tmpDir });
    const stripTs = (data: ReturnType<typeof buildDashboardData>) => {
      const { generatedAt: _ts, ...rest } = data;
      return rest;
    };
    expect(stripTs(a)).toEqual(stripTs(b));
  });
});
