/**
 * THR-1120 — the consequence chip's link half resolves an attachment template.
 *
 * The pathology this guards is a link that *looks* live and opens an empty
 * sheet, which is worse than no affordance (the rule `NarrativeSegments`
 * already states for entity ids). So the falsification cases carry as much
 * weight as the happy ones: a personality trait, an agent id, and a nonexistent
 * id must each resolve to `undefined` so the chip stays plain text.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { resolveAttachmentTemplateDetail } from '../attachmentTemplateDetail';

function graphWith(nodes: readonly { id: string; type: string; name: string; properties: Record<string, unknown> }[]): WorldGraph {
  const graph = new WorldGraph();
  for (const node of nodes) {
    graph.addNode({
      id: node.id,
      type: node.type as never,
      name: node.name,
      properties: node.properties as never,
    });
  }
  return graph;
}

const WOUNDED = {
  id: 'trait.condition.wounded',
  type: 'trait',
  name: 'Wounded',
  properties: {
    subcategory: 'condition',
    description: 'Suffering from injuries sustained in conflict.',
    tags: ['#condition', '#combat', '#negative'],
    flavorText: 'Blood seeps through hastily bound cloth.',
  },
};

describe('resolveAttachmentTemplateDetail — what resolves', () => {
  it('resolves a condition template to its sheet payload', () => {
    const detail = resolveAttachmentTemplateDetail(graphWith([WOUNDED]), 'trait.condition.wounded');

    expect(detail?.id).toBe('trait.condition.wounded');
    expect(detail?.name).toBe('Wounded');
    // No #blessing/#curse/#disease tag ⇒ the aggregator's own default.
    expect(detail?.subcategory).toBe('wound');
    expect(detail?.flavorText).toBe('Blood seeps through hastily bound cloth.');
  });

  it('falls back through mechanicalSummary → description → name, so the sheet is never blank', () => {
    const described = resolveAttachmentTemplateDetail(graphWith([WOUNDED]), 'trait.condition.wounded');
    expect(described?.mechanicalSummary).toBe('Suffering from injuries sustained in conflict.');

    const bare = resolveAttachmentTemplateDetail(
      graphWith([{ ...WOUNDED, properties: { subcategory: 'condition' } }]),
      'trait.condition.wounded',
    );
    expect(bare?.mechanicalSummary).toBe('Wounded');
  });

  it('reads the tag that claims the condition, in the aggregator’s priority order', () => {
    const blessed = resolveAttachmentTemplateDetail(
      graphWith([{ ...WOUNDED, properties: { subcategory: 'condition', tags: ['#blessing'] } }]),
      'trait.condition.wounded',
    );
    expect(blessed?.subcategory).toBe('blessing');
  });

  it('gives a bestowed power its own subcategory rather than a condition’s', () => {
    const detail = resolveAttachmentTemplateDetail(
      graphWith([{
        id: 'trait.bestowed.sight',
        type: 'trait',
        name: 'Borrowed Sight',
        properties: { subcategory: 'bestowed', grantedBy: 'The Witness' },
      }]),
      'trait.bestowed.sight',
    );
    expect(detail?.subcategory).toBe('bestowed_power');
    expect(detail?.grantedBy).toBe('The Witness');
  });

  it('resolves an artifact template as a possession', () => {
    const detail = resolveAttachmentTemplateDetail(
      graphWith([{
        id: 'artifact.stone',
        type: 'artifact',
        name: 'River Stone',
        properties: { subcategory: 'relics_talismans', tier: 2 },
      }]),
      'artifact.stone',
    );
    expect(detail?.subcategory).toBe('relics_talismans');
    expect(detail?.tier).toBe(2);
  });
});

describe('resolveAttachmentTemplateDetail — what must NOT resolve', () => {
  // Each of these would otherwise open a sheet with nothing in it, which reads
  // to the player as a broken game rather than as an absent feature.
  it('returns undefined for a trait that is not an attachment', () => {
    const detail = resolveAttachmentTemplateDetail(
      graphWith([{
        id: 'trait.personality.stubborn',
        type: 'trait',
        name: 'Stubborn',
        properties: { subcategory: 'personality' },
      }]),
      'trait.personality.stubborn',
    );
    expect(detail).toBeUndefined();
  });

  it('returns undefined for a node that is not an attachment at all', () => {
    const detail = resolveAttachmentTemplateDetail(
      graphWith([{ id: 'agent-1', type: 'actor', name: 'Kael', properties: {} }]),
      'agent-1',
    );
    expect(detail).toBeUndefined();
  });

  it('returns undefined for an id that resolves to no node, and for no id', () => {
    const graph = graphWith([WOUNDED]);
    expect(resolveAttachmentTemplateDetail(graph, 'trait.condition.does_not_exist')).toBeUndefined();
    expect(resolveAttachmentTemplateDetail(graph, undefined)).toBeUndefined();
  });

  it('does not invent per-bearer duration, which lives on the edge and not the template', () => {
    // THR-784: a value read off the shared node would be identical for every
    // carrier and true for none. The countdown belongs to the granted instance.
    const detail = resolveAttachmentTemplateDetail(
      graphWith([{ ...WOUNDED, properties: { ...WOUNDED.properties, ticksRemaining: 40, totalTicks: 40 } }]),
      'trait.condition.wounded',
    );
    expect(detail?.ticksRemaining).toBeUndefined();
    expect(detail?.totalTicks).toBeUndefined();
  });
});
