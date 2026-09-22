/**
 * THR-1520 — the six trait content files are registered content catalogs.
 *
 * `contentObjects.test.ts` and `contentTags.test.ts` sweep every registered catalog, so
 * registering the files put them under both contracts by construction. What this file
 * pins is the *shape of the seating*, which those sweeps cannot tell from any other
 * valid registry:
 *
 *  - the five mortal-trait files are the `trait_template` kind and nothing else;
 *  - the condition-trait file and the economic file's scars / condition are the
 *    `condition_template` kind — the same nodes the graph carve has always returned,
 *    now visible to the registry;
 *  - the economic file, shared between the two kinds, is partitioned cleanly by prefix
 *    (every id lands in exactly one), the way the unified array is between encounter
 *    and action;
 *  - `check:attachment` sees them and passes them;
 *  - the resolver serves the kind, so "a mastery" is a query and not an id.
 */
import { describe, it, expect } from 'vitest';
import { CORE_TRAIT_DEFINITIONS } from '../core-trait-content';
import { PERSONALITY_TRAIT_DEFINITIONS } from '../personality-trait-content';
import { MASTERY_TRAIT_DEFINITIONS } from '../mastery-trait-content';
import { REPUTATION_TRAIT_DEFINITIONS } from '../reputation-trait-content';
import { ECONOMIC_TRAIT_DEFINITIONS } from '../economic-trait-content';
import { CONDITION_TRAIT_DEFINITIONS } from '../condition-trait-content';
import { getContentObjectKind, contentKindsForId } from '../content-objects';
import { entriesOfKind } from '../contentCatalogs';
import { authoredTags } from '../contentEntryTags';
import { isContentTag } from '../content-tags';
import { attachmentCorpus, checkAttachmentContract, failedBlocks } from '../content-eval/attachmentContract';
import { nodeContentCatalogs, resolveContentQuery } from '../../engine/contentQuery';
import { staticContentCatalogs } from '../../engine/contentCatalogView';

const MORTAL_TRAIT_FILES = [
  CORE_TRAIT_DEFINITIONS,
  PERSONALITY_TRAIT_DEFINITIONS,
  MASTERY_TRAIT_DEFINITIONS,
  REPUTATION_TRAIT_DEFINITIONS,
];

describe('trait catalogs seated in the content model (THR-1520)', () => {
  it('every mortal-trait definition is a trait_template entry, and only that', () => {
    const traitIds = new Set(entriesOfKind('trait_template').map(e => e.id));
    expect(traitIds.size).toBeGreaterThanOrEqual(10 + 16 + 7 + 17);
    for (const file of MORTAL_TRAIT_FILES) {
      for (const node of file) {
        expect(traitIds.has(node.id), `${node.id} not claimed by trait_template`).toBe(true);
        expect(contentKindsForId(node.id).map(k => k.id)).toEqual(['trait_template']);
      }
    }
  });

  it('the condition-trait file is the Condition kind — including the ten place conditions', () => {
    const conditionIds = new Set(entriesOfKind('condition_template').map(e => e.id));
    for (const node of CONDITION_TRAIT_DEFINITIONS) {
      expect(conditionIds.has(node.id), `${node.id} not claimed by condition_template`).toBe(true);
      expect(contentKindsForId(node.id).map(k => k.id)).toEqual(['condition_template']);
    }
    expect(conditionIds.has('trait.condition.location.festival')).toBe(true);
    // The catalogs that were already registered are still there — additive.
    expect(conditionIds.has('starter_bruised_ribs')).toBe(true);
  });

  it('partitions the shared economic file by prefix: every id lands in exactly one of the two kinds', () => {
    const trait = getContentObjectKind('trait_template')!;
    const condition = getContentObjectKind('condition_template')!;
    const both: string[] = [];
    const neither: string[] = [];
    for (const node of ECONOMIC_TRAIT_DEFINITIONS) {
      const isTrait = trait.idPrefixes.some(p => node.id.startsWith(p));
      const isCondition = condition.idPrefixes.some(p => node.id.startsWith(p));
      if (isTrait && isCondition) both.push(node.id);
      if (!isTrait && !isCondition) neither.push(node.id);
    }
    expect(both).toEqual([]);
    expect(neither).toEqual([]);
    // And the split follows the subcategory the file authors, so a scar is a Condition
    // and a mastery is a Trait — the registry did not invent a new discriminator.
    for (const node of ECONOMIC_TRAIT_DEFINITIONS) {
      const sub = node.properties.subcategory as string;
      const expected = sub === 'condition' || sub === 'scar' ? 'condition_template' : 'trait_template';
      expect(contentKindsForId(node.id).map(k => k.id), node.id).toEqual([expected]);
    }
  });

  it('every tag in the six files is seated — the ratchet stayed empty', () => {
    const files = [...MORTAL_TRAIT_FILES, ECONOMIC_TRAIT_DEFINITIONS, CONDITION_TRAIT_DEFINITIONS];
    const unseated: string[] = [];
    let tagged = 0;
    for (const file of files) {
      for (const node of file) {
        const tags = authoredTags(node);
        if (tags.length > 0) tagged++;
        for (const t of tags) if (!isContentTag(t)) unseated.push(`${node.id}: ${t}`);
      }
    }
    expect(tagged).toBeGreaterThan(60);
    expect(unseated).toEqual([]);
  });

  it('check:attachment sees the trait kind and passes every entry', () => {
    const corpus = attachmentCorpus().filter(({ kind }) => kind.id === 'trait_template');
    expect(corpus.length).toBeGreaterThanOrEqual(10 + 16 + 7 + 17 + 5);
    const failures = corpus
      .map(({ kind, entry }) => checkAttachmentContract(kind, entry))
      .filter(r => !r.passed)
      .map(r => `${r.entryId}: ${failedBlocks(r).join(', ')}`);
    expect(failures).toEqual([]);
    // The condition side too — the file's entries now sit under the polarity requirement.
    const conditionFailures = attachmentCorpus()
      .filter(({ kind, entry }) => kind.id === 'condition_template' && entry.id.startsWith('trait.'))
      .map(({ kind, entry }) => checkAttachmentContract(kind, entry))
      .filter(r => !r.passed)
      .map(r => `${r.entryId}: ${failedBlocks(r).join(', ')}`);
    expect(conditionFailures).toEqual([]);
  });

  it('the resolver serves the kind: "a mastery" is a query, over nodes and over the library alike', () => {
    const overNodes = resolveContentQuery(
      { kind: 'trait_template', tags: ['#mastery'] },
      nodeContentCatalogs([...MASTERY_TRAIT_DEFINITIONS, ...ECONOMIC_TRAIT_DEFINITIONS, ...CONDITION_TRAIT_DEFINITIONS]),
    ).map(h => h.id);
    expect(overNodes.length).toBe(MASTERY_TRAIT_DEFINITIONS.length + 2);
    expect(overNodes.every(id => id.startsWith('trait.mastery.'))).toBe(true);
    // A condition never answers a trait query, whichever file it came from.
    expect(overNodes.some(id => id.startsWith('trait.condition.') || id.startsWith('trait.scar.'))).toBe(false);

    const overLibrary = resolveContentQuery({ kind: 'trait_template', classes: ['reputation'] }, staticContentCatalogs()).map(h => h.id);
    expect(overLibrary.length).toBe(REPUTATION_TRAIT_DEFINITIONS.length + 2);
    // Falsification: a class the kind does not carve returns nothing.
    expect(resolveContentQuery({ kind: 'trait_template', classes: ['condition'] }, staticContentCatalogs())).toEqual([]);
  });
});
