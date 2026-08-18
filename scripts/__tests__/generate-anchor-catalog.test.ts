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
  EDGE_TYPE_ROWS,
  NODE_TYPE_ROWS,
  assertEveryMemberAnnotated,
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
    // would strip most legitimate consequences out of the corpus, since every
    // location, culture, region and bond is `named` rather than `linked`.
    expect(NODE_TYPE_ROWS.location.status).toBe('named');
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
