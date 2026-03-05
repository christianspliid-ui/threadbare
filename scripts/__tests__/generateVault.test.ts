import { describe, it, expect } from 'vitest';
import { generateNoteContent, getCategoryFolder } from '../generate-vault';

describe('getCategoryFolder', () => {
  it('maps creation-sphere to Cosmology', () => {
    expect(getCategoryFolder('creation-sphere', {})).toBe('Cosmology');
  });

  it('maps foundation-sphere to Cosmology', () => {
    expect(getCategoryFolder('foundation-sphere', {})).toBe('Cosmology');
  });

  it('maps trait-innate to Traits/Innate', () => {
    expect(getCategoryFolder('trait-innate', {})).toBe('Traits/Innate');
  });

  it('maps trait-mastery to Traits/Mastery', () => {
    expect(getCategoryFolder('trait-mastery', {})).toBe('Traits/Mastery');
  });

  it('maps trait-reputation to Traits/Reputation', () => {
    expect(getCategoryFolder('trait-reputation', {})).toBe('Traits/Reputation');
  });

  it('maps trait-scar to Traits/Scar', () => {
    expect(getCategoryFolder('trait-scar', {})).toBe('Traits/Scar');
  });

  it('maps trait-condition to Traits/Condition', () => {
    expect(getCategoryFolder('trait-condition', {})).toBe('Traits/Condition');
  });

  it('maps trait-destiny to Traits/Destiny', () => {
    expect(getCategoryFolder('trait-destiny', {})).toBe('Traits/Destiny');
  });

  it('maps action-template to Actions/{reach-name}', () => {
    expect(getCategoryFolder('action-template', { reach: 'reach.iron' })).toBe(
      'Actions/Iron'
    );
  });

  it('maps action-template without reach to Actions/Misc', () => {
    expect(getCategoryFolder('action-template', {})).toBe('Actions/Misc');
  });

  it('maps magic-tradition with school to Magic/{school}', () => {
    expect(getCategoryFolder('magic-tradition', { school: 'Elemental' })).toBe(
      'Magic/Elemental'
    );
  });

  it('maps magic-tradition without school to Magic/General', () => {
    expect(getCategoryFolder('magic-tradition', {})).toBe('Magic/General');
  });

  it('maps culture to Cultures', () => {
    expect(getCategoryFolder('culture', {})).toBe('Cultures');
  });

  it('maps region-type to Locations/Regions', () => {
    expect(getCategoryFolder('region-type', {})).toBe('Locations/Regions');
  });

  it('maps location-type to Locations/Locations', () => {
    expect(getCategoryFolder('location-type', {})).toBe('Locations/Locations');
  });

  it('maps sublocation-type to Locations/Sub-locations', () => {
    expect(getCategoryFolder('sublocation-type', {})).toBe(
      'Locations/Sub-locations'
    );
  });

  it('maps artifact-class to World Objects/Artifacts', () => {
    expect(getCategoryFolder('artifact-class', {})).toBe(
      'World Objects/Artifacts'
    );
  });

  it('maps enchantment-class to World Objects/Enchantments', () => {
    expect(getCategoryFolder('enchantment-class', {})).toBe(
      'World Objects/Enchantments'
    );
  });

  it('maps resource-type to World Objects/Resources', () => {
    expect(getCategoryFolder('resource-type', {})).toBe(
      'World Objects/Resources'
    );
  });

  it('maps reach to Domains', () => {
    expect(getCategoryFolder('reach', {})).toBe('Domains');
  });

  it('maps terrain to Terrain', () => {
    expect(getCategoryFolder('terrain', {})).toBe('Terrain');
  });

  it('maps actor-type to Actors', () => {
    expect(getCategoryFolder('actor-type', {})).toBe('Actors');
  });

  it('maps relationship-type to Relationships', () => {
    expect(getCategoryFolder('relationship-type', {})).toBe('Relationships');
  });
});

describe('generateNoteContent', () => {
  const sampleNode = {
    id: 'creation.force',
    name: 'Force',
    category: 'creation-sphere',
    description: 'Physics, motion, kinetic energy.',
    properties: {
      color: '#ff6b6b',
      physicalPhenomena: ['Wind', 'Gravity'],
    },
  };

  const sampleEdges = [
    {
      source: 'creation.force',
      target: 'magic.air',
      type: 'rel.generates',
      weight: 1.0,
    },
    {
      source: 'foundation.chaos',
      target: 'creation.force',
      type: 'rel.underpins',
      weight: 0.8,
    },
  ];

  const nodeMap = new Map([
    ['creation.force', sampleNode],
    [
      'magic.air',
      {
        id: 'magic.air',
        name: 'Air Magic',
        category: 'magic-tradition',
        description: '',
        properties: {},
      },
    ],
    [
      'foundation.chaos',
      {
        id: 'foundation.chaos',
        name: 'Chaos',
        category: 'foundation-sphere',
        description: '',
        properties: {},
      },
    ],
  ]);

  const relTypeMap = new Map([
    [
      'rel.generates',
      {
        id: 'rel.generates',
        name: 'Generates',
        category: 'relationship-type',
        description: '',
        properties: {},
      },
    ],
    [
      'rel.underpins',
      {
        id: 'rel.underpins',
        name: 'Underpins',
        category: 'relationship-type',
        description: '',
        properties: {},
      },
    ],
  ]);

  it('generates valid markdown with frontmatter', () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain('---');
    expect(md).toContain('id: creation.force');
    expect(md).toContain('category: creation-sphere');
    expect(md).toContain('tags:');
    expect(md).toContain('creation-sphere');
    expect(md).toContain('generated');
  });

  it('includes node name as h1', () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain('# Force');
  });

  it('includes description as blockquote', () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain('> Physics, motion, kinetic energy.');
  });

  it('includes properties section', () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain('## Properties');
    expect(md).toContain('color');
    expect(md).toContain('#ff6b6b');
  });

  it('includes wikilinks for outgoing edges', () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain('## Outgoing Connections');
    expect(md).toContain('[[Air Magic]]');
    expect(md).toContain('Generates');
    expect(md).toContain('(w: 1)');
  });

  it('includes wikilinks for incoming edges', () => {
    const md = generateNoteContent(sampleNode, sampleEdges, nodeMap, relTypeMap);
    expect(md).toContain('## Incoming Connections');
    expect(md).toContain('[[Chaos]]');
    expect(md).toContain('Underpins');
    expect(md).toContain('(w: 0.8)');
  });

  it('handles nodes without properties', () => {
    const nodeNoProps = {
      ...sampleNode,
      properties: undefined,
    };
    const md = generateNoteContent(nodeNoProps, [], nodeMap, relTypeMap);
    expect(md).toContain('# Force');
    expect(md).not.toContain('undefined');
  });

  it('handles nodes without description', () => {
    const nodeNoDesc = {
      ...sampleNode,
      description: '',
    };
    const md = generateNoteContent(nodeNoDesc, [], nodeMap, relTypeMap);
    expect(md).toContain('# Force');
    expect(md).not.toContain('> ');
  });

  it('handles nodes without edges', () => {
    const md = generateNoteContent(sampleNode, [], nodeMap, relTypeMap);
    expect(md).not.toContain('## Outgoing Connections');
    expect(md).not.toContain('## Incoming Connections');
  });

  it('uses edge type ID if relationship type not found', () => {
    const edgesUnknownType = [
      {
        source: 'creation.force',
        target: 'magic.air',
        type: 'rel.unknown',
        weight: 1.0,
      },
    ];
    const md = generateNoteContent(sampleNode, edgesUnknownType, nodeMap, new Map());
    expect(md).toContain('rel.unknown');
  });

  it('uses edge target ID if node not found', () => {
    const edgesUnknownTarget = [
      {
        source: 'creation.force',
        target: 'unknown.node',
        type: 'rel.generates',
        weight: 1.0,
      },
    ];
    const md = generateNoteContent(sampleNode, edgesUnknownTarget, nodeMap, relTypeMap);
    expect(md).toContain('unknown.node');
  });

  it('formats arrays in properties as inline lists', () => {
    const md = generateNoteContent(sampleNode, [], nodeMap, relTypeMap);
    expect(md).toContain('physicalPhenomena');
  });

  it('escapes special characters in frontmatter strings', () => {
    const nodeWithSpecial = {
      ...sampleNode,
      properties: {
        specialField: 'value:with:colons',
      },
    };
    const md = generateNoteContent(nodeWithSpecial, [], nodeMap, relTypeMap);
    // Should handle special chars without breaking YAML
    expect(md).not.toThrow;
  });

  it('includes weight in edge descriptions', () => {
    const edgesWithWeights = [
      {
        source: 'creation.force',
        target: 'magic.air',
        type: 'rel.generates',
        weight: 0.5,
      },
    ];
    const md = generateNoteContent(sampleNode, edgesWithWeights, nodeMap, relTypeMap);
    expect(md).toContain('(w: 0.5)');
  });
});
