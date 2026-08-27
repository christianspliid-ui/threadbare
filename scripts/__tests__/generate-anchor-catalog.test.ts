/**
 * THR-1154 — the anchor catalog's self-maintenance, pinned.
 *
 * The catalog is only worth citing if it is current, and it is only current
 * because an unannotated union member fails the build. That guard is the whole
 * mechanism, and its failure mode is silent in the direction that matters: a new
 * `NodeType` with no curated row would simply be *absent* from the table, and
 * absence reads exactly like "not an anchor". An author would then fold a chip
 * that was in fact perfectly anchorable.
 *
 * `check:generated-freshness` catches staleness at merge time. These give the same
 * answer in milliseconds, on the PR that introduces the regression — and unlike the
 * freshness gate they can assert the guard *fires*, which regenerating cannot.
 *
 * The `nation` pin is the other half. That gap is a finding, not a permanent fact:
 * THR-1155 exists to close it. When it does, this test fails and whoever closed it
 * is told, in the failure message, that the catalog's gap table now lies.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import {
  ACTOR_TYPE_ROWS,
  ATTACHMENT_ROWS,
  CODEX_SURFACE_TICKET,
  CONSUMER_UNION_SPECS,
  EDGE_TYPE_ROWS,
  NODE_TYPE_ROWS,
  WORLD_REF_TYPES_REL,
  assertEveryKindDescribed,
  assertEveryMemberAnnotated,
  assertKindUnionCoverage,
  assertMirroredUnionsAgree,
  parseDiscriminatedUnionKinds,
  parsePropertyUnionMembers,
  parseUnionMembers,
  parseVisualKinds,
  stripLineComments,
} from '../anchor-catalog-sources.ts';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const read = (rel: string): string => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf-8');

const graphSource = stripLineComments(read('src/types/graph.ts'));
const attachmentSource = stripLineComments(read('src/types/attachments.ts'));
const aftermathSource = read('src/types/unifiedAction.ts');

const nodeTypes = parseUnionMembers(graphSource, 'NodeType', 'src/types/graph.ts');
const actorTypes = parseUnionMembers(graphSource, 'ActorType', 'src/types/graph.ts');
const edgeTypes = parseUnionMembers(graphSource, 'EdgeType', 'src/types/graph.ts');
const attachmentCategories = parseUnionMembers(
  attachmentSource,
  'AttachmentCategory',
  'src/types/attachments.ts',
);

describe('anchor catalog — membership is derived from the live unions', () => {
  it('parses every union non-empty', () => {
    // A zero-member parse is the dangerous shape: it would render an empty
    // section that reads as "there are no legal anchors of this kind".
    expect(nodeTypes.length).toBeGreaterThan(0);
    expect(actorTypes.length).toBeGreaterThan(0);
    expect(edgeTypes.length).toBeGreaterThan(0);
    expect(attachmentCategories.length).toBeGreaterThan(0);
  });

  it('throws rather than returning empty when a union moves or is renamed', () => {
    expect(() =>
      parseUnionMembers(graphSource, 'NodeTypeThatWasRenamed', 'src/types/graph.ts'),
    ).toThrow(/could not find `export type NodeTypeThatWasRenamed`/);
  });
});

describe('anchor catalog — every live member is classified', () => {
  it.each([
    ['NodeType', nodeTypes, NODE_TYPE_ROWS],
    ['ActorType', actorTypes, ACTOR_TYPE_ROWS],
    ['EdgeType', edgeTypes, EDGE_TYPE_ROWS],
    ['AttachmentCategory', attachmentCategories, ATTACHMENT_ROWS],
  ] as const)('%s', (unionName, members, rows) => {
    expect(() => assertEveryMemberAnnotated(members, rows, unionName)).not.toThrow();
  });
});

describe('anchor catalog — the guard actually fires', () => {
  it('names an unclassified member instead of silently omitting it', () => {
    expect(() =>
      assertEveryMemberAnnotated([...nodeTypes, 'siege_engine'], NODE_TYPE_ROWS, 'NodeType'),
    ).toThrow(/no curated anchor row: 'siege_engine'/);
  });

  it('names a curated row whose member no longer exists', () => {
    // The other drift direction: a member is deleted from the union and its row
    // is left behind, so the catalog advertises an anchor the code cannot make.
    expect(() =>
      assertEveryMemberAnnotated(
        nodeTypes.filter((member) => member !== 'companion'),
        NODE_TYPE_ROWS,
        'NodeType',
      ),
    ).toThrow(/no longer exists: 'companion'/);
  });
});

describe('anchor catalog — the findings it records', () => {
  it('records `nation` as a gap, because no node type models one', () => {
    // The director enumerated `nation` as a legal anchor; the game has no
    // representation of one. If this fails, THR-1155 has landed a real nation
    // object — update the catalog's gap table, which now understates the game.
    expect(nodeTypes).not.toContain('nation');
    expect(NODE_TYPE_ROWS['nation' as keyof typeof NODE_TYPE_ROWS]).toBeUndefined();
  });

  it('records `region` as the real "named area", so the gap table stays honest', () => {
    expect(nodeTypes).toContain('region');
    expect(NODE_TYPE_ROWS.region.status).toBe('named');
  });

  it('pins the link-routing set to `visualKind`, which is what openEntity switches on', () => {
    // Widening this union widens what a chip can click, which changes `linked`
    // vs `named` across the catalog. That should be a deliberate review, not a
    // silent consequence — so it fails here first.
    //
    // It did, and this is the review. **THR-1172 added `location`**: a place the
    // ending moved someone to or opened a road to was previously unnameable as a
    // clickable referent, so a scene could name the ground it stood on and the
    // word could not even declare itself openable. The destination already
    // existed (`LocationProfileModal`, reached by the thread list and the hex
    // map) — only the door was missing. `region` stays out: it is a named area
    // with no sheet, and the row above pins that distinction.
    expect(parseVisualKinds(aftermathSource, 'src/types/unifiedAction.ts')).toEqual([
      'agent',
      'faction',
      'artifact',
      'companion',
      'attachment',
      'location',
    ]);
  });

  it('keeps the RESERVED enchantment edges out of the anchorable set', () => {
    // `enchanted` / `warded` / `cursed` / `blessed` are declared and unimplemented.
    // Advertising them would invite a chip claiming state nothing can write —
    // precisely the Law 56 defect, arrived at from the opposite direction.
    for (const reserved of ['enchanted', 'warded', 'cursed', 'blessed']) {
      expect(edgeTypes).toContain(reserved);
      expect(EDGE_TYPE_ROWS[reserved].status).toBe('reserved');
    }
  });

  it('keeps location a lawful anchor, so a critic cannot fold chips for being unclickable', () => {
    // The expensive misreading: treating "cannot be clicked" as "not anchored"
    // would strip most legitimate consequences out of the corpus, since culture
    // and bond are `named` rather than `linked` and are anchored all the same.
    //
    // `location` moved to `linked` in THR-1221: `visualKind` genuinely carries a
    // `'location'` member (`src/types/unifiedAction.ts` — the union is
    // agent | faction | artifact | companion | attachment | location), and the
    // veil routes it. The catalog had hard-coded the pre-THR-1172 claim that no
    // such member existed, which is why this assertion could go stale without
    // the freshness gate noticing: the sentence is hand-written in the sources
    // file, so the artifact was simultaneously fresh and wrong.
    expect(NODE_TYPE_ROWS.location.status).toBe('linked');
    expect(ACTOR_TYPE_ROWS.culture.status).toBe('named');
    expect(NODE_TYPE_ROWS.relationship.status).toBe('named');
  });
});

describe('anchor catalog — the committed artifact', () => {
  const OUTPUT_REL = '.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md';

  it('is committed and carries its do-not-edit banner', () => {
    const body = read(OUTPUT_REL);
    expect(body).toContain('GENERATED by scripts/generate-anchor-catalog.ts');
    expect(body).toContain('npm run generate-anchor-catalog');
  });

  it('names every live union member somewhere in the rendered tables', () => {
    const body = read(OUTPUT_REL);
    const everyMember = [...nodeTypes, ...actorTypes, ...edgeTypes, ...attachmentCategories];
    const missing = everyMember.filter((member) => !body.includes(`\`${member}\``));
    expect(missing).toEqual([]);
  });
});

// ─── THR-1212 slice 2 — the membership spine and the coverage lint ────────────

/**
 * The spine's guards, falsified rather than merely exercised.
 *
 * Each `assert*` below is checked twice: once against the live tree (it must pass,
 * which is what keeps the catalog honest today) and once against a mutated input
 * (it must throw, which is the only thing proving the guard is not vacuous). The
 * second half is the point — a coverage lint that cannot fail is a lint that will
 * report success on the day the vocabularies drift apart.
 */

const worldRefSource = stripLineComments(read(WORLD_REF_TYPES_REL));
const worldRefKinds = parseUnionMembers(worldRefSource, 'WorldRefKind', WORLD_REF_TYPES_REL);

/** Read one spec's members exactly as the generator does. */
const membersOf = (spec: (typeof CONSUMER_UNION_SPECS)[number]): string[] => {
  const source = read(spec.sourceRel);
  switch (spec.read.via) {
    case 'named-union':
      return parseUnionMembers(stripLineComments(source), spec.read.typeName, spec.sourceRel);
    case 'property':
      return parsePropertyUnionMembers(source, spec.read.propertyName, spec.sourceRel);
    case 'discriminated-union':
      return parseDiscriminatedUnionKinds(source, spec.read.typeName, spec.sourceRel);
  }
};

const liveCoverages = CONSUMER_UNION_SPECS.map((spec) =>
  assertKindUnionCoverage(spec, membersOf(spec), worldRefKinds),
);

describe('kind vocabulary — the spine parses and every consumer union is covered', () => {
  it('parses `WorldRefKind` non-empty from an import-free module', () => {
    // The module is deliberately import-free so it can be read as text; if that
    // ever stops being true this still passes, but the header says why it matters.
    expect(worldRefKinds.length).toBeGreaterThan(0);
    expect(worldRefKinds).toContain('agent');
    expect(worldRefKinds).toContain('codex');
  });

  it.each(CONSUMER_UNION_SPECS.map((spec) => [spec.label, spec] as const))(
    '%s parses non-empty and passes the coverage lint',
    (_label, spec) => {
      const members = membersOf(spec);
      // Vacuity guard: a zero-member parse would make every coverage assertion below
      // trivially true, which is exactly how a lint reports success while blind.
      expect(members.length).toBeGreaterThan(0);
      expect(() => assertKindUnionCoverage(spec, members, worldRefKinds)).not.toThrow();
    },
  );

  it('registers seven consumer vocabularies, each at a real declaration', () => {
    expect(CONSUMER_UNION_SPECS).toHaveLength(7);
    for (const spec of CONSUMER_UNION_SPECS) {
      expect(fs.existsSync(path.join(REPO_ROOT, spec.sourceRel))).toBe(true);
    }
  });
});

describe('kind vocabulary — the hub-and-spoke falsification test', () => {
  it('has far more members mapping to the spine than not', () => {
    const mapped = liveCoverages.reduce((sum, c) => sum + c.mapped.length, 0);
    const extra = liveCoverages.reduce((sum, c) => sum + c.extra.length, 0);

    // The plan's kill criterion, as a live assertion: the hub is fiction if the
    // spokes routinely name things `WorldRefKind` cannot express. Asserted as a
    // ratio rather than pinned counts — members legitimately come and go, and a
    // pinned number would fail for the wrong reason.
    expect(mapped).toBeGreaterThan(extra * 5);
  });

  it('pins the only three unmappable members, which are all render-time refinements', () => {
    // If this list grows, the design question the plan named is live again and
    // belongs in a Linear comment — not in an extra disposition row added quietly.
    const extras = liveCoverages.flatMap((c) => c.extra).sort();
    expect(extras).toEqual(['avatar', 'npc-role', 'unknown']);
  });

  it('leaves `codex` unspoken by every consumer union, which is what reserved means', () => {
    const speaks = liveCoverages.filter((c) => c.members.includes('codex'));
    expect(speaks.map((c) => c.spec.label)).toEqual([]);
  });
});

describe('kind vocabulary — the coverage lint actually fires', () => {
  const spec = CONSUMER_UNION_SPECS.find((s) => s.label === 'NavigationTarget')!;
  const members = membersOf(spec);

  it('names a member the spine cannot express', () => {
    expect(() =>
      assertKindUnionCoverage(spec, [...members, 'weather_front'], worldRefKinds),
    ).toThrow(/not `WorldRefKind`s and have no disposition: 'weather_front'/);
  });

  it('names a spine kind dropped without a reason', () => {
    // A new kind nobody has dispositioned anywhere — absence must not read as
    // "obviously not applicable".
    expect(() =>
      assertKindUnionCoverage(spec, members, [...worldRefKinds, 'settlement_ring']),
    ).toThrow(/lacks 1 `WorldRefKind`\(s\) with no disposition: 'settlement_ring'/);
  });

  it('names a stale `extraMembers` row', () => {
    const stale = { ...spec, extraMembers: { avatar: 'stale — avatar is not a NavigationTarget arm' } };
    expect(() => assertKindUnionCoverage(stale, members, worldRefKinds)).toThrow(
      /stale `extraMembers` row\(s\): 'avatar'/,
    );
  });

  it('names a stale `absentKinds` row the day the codex arm lands', () => {
    // The promise made to THR-1315 in its coordination block: add a `codex` arm and
    // the generator refuses to keep publishing the reserved badge. This is that
    // promise, executable — the union is mutated as if the arm shipped.
    expect(() =>
      assertKindUnionCoverage(spec, [...members, 'codex'], worldRefKinds),
    ).toThrow(/stale `absentKinds` row\(s\): 'codex'/);
  });
});

describe('kind vocabulary — the four chip/segment unions are pinned to each other', () => {
  it('agree today', () => {
    expect(() => assertMirroredUnionsAgree(liveCoverages)).not.toThrow();
  });

  it('catches the drift the coverage lint cannot see — all four move, the constant does not', () => {
    // This is the *reachable* failure, and the only one this guard uniquely owns.
    //
    // A controlled arm during development showed that adding a member to one mirror
    // alone fails earlier, inside assertKindUnionCoverage, because all four specs
    // share one absentKinds record. So the interesting case is the one where the four
    // stay consistent with each other and CHIP_UNION_MEMBERS — the only written record
    // of what "pinned" means — is left stale behind them.
    const allFourMoved = liveCoverages.map((coverage) =>
      coverage.spec.label.endsWith('entityKind') ||
      coverage.spec.label.endsWith('nounEntityKind') ||
      coverage.spec.label.endsWith('visualKind')
        ? { ...coverage, members: [...coverage.members, 'army'] }
        : coverage,
    );
    expect(() => assertMirroredUnionsAgree(allFourMoved)).toThrow(/expected:/);
  });

  it('names which mirror disagrees, and with what', () => {
    // Contract-level: the message has to identify the file, because the reader's next
    // action is to open it. Reached here by constructing the state directly, since the
    // coverage lint intercepts this shape in the live pipeline.
    const drifted = liveCoverages.map((coverage) =>
      coverage.spec.label === 'NarrativeSegmentRefLike.entityKind'
        ? { ...coverage, members: [...coverage.members, 'army'] }
        : coverage,
    );
    expect(() => assertMirroredUnionsAgree(drifted)).toThrow(
      /NarrativeSegmentRefLike\.entityKind \(src\/types\/worldRefAdapters\.ts\)/,
    );
  });

  it('pins the canonical spelling to what the four unions actually say', () => {
    // If CHIP_UNION_MEMBERS and the live unions disagree, one of them is wrong and
    // this is the test that says so rather than letting the constant rot quietly.
    const mirrors = liveCoverages.filter((c) => c.spec.label !== 'EntityVisualKind'
      && c.spec.label !== 'NavigationTarget'
      && c.spec.label !== 'EntityNoticeAnchorKind');
    expect(mirrors).toHaveLength(4);
    for (const mirror of mirrors) {
      expect([...mirror.members].sort()).toEqual(
        ['agent', 'artifact', 'attachment', 'companion', 'faction', 'location'],
      );
    }
  });
});

describe('kind vocabulary — the parsers refuse to guess', () => {
  it('reads all seven `NavigationTarget` arms despite semicolons inside the braces', () => {
    const notificationSource = read('src/types/notification.ts');
    expect(
      parseDiscriminatedUnionKinds(notificationSource, 'NavigationTarget', 'src/types/notification.ts'),
    ).toEqual(['agent', 'encounter', 'hex', 'location', 'faction', 'journey', 'receipt']);
  });

  it('is why the plain union parser cannot be used here', () => {
    // The failure this parser exists to avoid, demonstrated rather than asserted in
    // a comment: `[^;]*` stops at the first `;` *inside* the first arm, so the plain
    // parser reports a one-member union and every coverage check downstream would be
    // computed against a union that does not exist.
    const notificationSource = stripLineComments(read('src/types/notification.ts'));
    const naive = parseUnionMembers(notificationSource, 'NavigationTarget', 'src/types/notification.ts');
    expect(naive).toEqual(['agent']);
  });

  it('throws rather than picking one when a property union is declared twice', () => {
    const twice = `
      interface A { readonly entityKind?: 'agent' | 'faction'; }
      interface B { entityKind?: 'agent' | 'artifact'; }
    `;
    expect(() => parsePropertyUnionMembers(twice, 'entityKind', 'fake.ts')).toThrow(
      /declared 2 times/,
    );
  });

  it('does not let a longer property name satisfy a shorter one', () => {
    // `nounEntityKind` must not answer a request for `entityKind`, and vice versa —
    // both live in the same file, and a boundary slip would silently check one union
    // twice while never checking the other.
    const onlyNoun = `interface A { nounEntityKind?: 'agent' | 'faction'; }`;
    expect(() => parsePropertyUnionMembers(onlyNoun, 'entityKind', 'fake.ts')).toThrow(
      /could not find property `entityKind`/,
    );
  });

  it('throws when a discriminated union never terminates at depth zero', () => {
    const truncated = `export type Broken = | { kind: 'agent'; id: string }`;
    expect(() => parseDiscriminatedUnionKinds(truncated, 'Broken', 'fake.ts')).toThrow(
      /no terminating/,
    );
  });
});

describe('kind vocabulary — the spine annotation is complete in both directions', () => {
  it('describes every live kind', () => {
    expect(() => assertEveryKindDescribed(worldRefKinds)).not.toThrow();
  });

  it('names an undescribed kind', () => {
    expect(() => assertEveryKindDescribed([...worldRefKinds, 'ley_line'])).toThrow(
      /no spine description: 'ley_line'/,
    );
  });

  it('names a description whose kind was removed', () => {
    expect(() =>
      assertEveryKindDescribed(worldRefKinds.filter((kind) => kind !== 'receipt')),
    ).toThrow(/no longer exists: 'receipt'/);
  });
});

describe('kind vocabulary — the committed artifact carries the spine', () => {
  const OUTPUT_REL = '.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md';

  it('renders the spine section, every kind, and the codex deferral', () => {
    const body = read(OUTPUT_REL);
    expect(body).toContain('## The kind vocabulary');
    for (const kind of worldRefKinds) {
      expect(body).toContain(`\`${kind}\``);
    }
    // The reserved row must cite a ticket, or it reads as an oversight — which is
    // the whole reason THR-1315 was filed before this catalog was rendered.
    expect(body).toContain(CODEX_SURFACE_TICKET);
  });

  it('names every consumer vocabulary it checked', () => {
    const body = read(OUTPUT_REL);
    const missing = CONSUMER_UNION_SPECS.filter((spec) => !body.includes(spec.label));
    expect(missing.map((spec) => spec.label)).toEqual([]);
  });
});
