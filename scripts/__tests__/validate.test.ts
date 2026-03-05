import { describe, it, expect } from 'vitest';
import { validateWorldModel } from '../validate-world-model';
import worldModel from '../../src/data/world-model.json';

describe('validateWorldModel', () => {
  it('returns no errors for the current world-model.json', () => {
    const result = validateWorldModel(worldModel);
    expect(result.errors).toEqual([]);
  });

  it('detects missing edge targets', () => {
    const bad = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 1,
        edgeCount: 1,
        categories: ['test'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          category: 'test',
          description: 't',
          properties: {},
        },
      ],
      edges: [
        {
          source: 'a',
          target: 'nonexistent',
          type: 'rel.underpins',
          weight: 1,
        },
      ],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('nonexistent'))).toBe(true);
  });

  it('detects duplicate node IDs', () => {
    const bad = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 2,
        edgeCount: 0,
        categories: ['test'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          category: 'test',
          description: 't',
          properties: {},
        },
        {
          id: 'a',
          name: 'A2',
          category: 'test',
          description: 't',
          properties: {},
        },
      ],
      edges: [],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('warns on orphan nodes', () => {
    const orphaned = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 3,
        edgeCount: 1,
        categories: ['test'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          category: 'test',
          description: 't',
          properties: {},
        },
        {
          id: 'b',
          name: 'B',
          category: 'test',
          description: 't',
          properties: {},
        },
        {
          id: 'c',
          name: 'C',
          category: 'test',
          description: 't',
          properties: {},
        },
      ],
      edges: [
        {
          source: 'a',
          target: 'b',
          type: 'rel.underpins',
          weight: 1,
        },
      ],
    };
    const result = validateWorldModel(orphaned);
    expect(result.warnings.some((w) => w.includes('c'))).toBe(true);
  });

  it('detects meta count mismatch', () => {
    const bad = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 999,
        edgeCount: 0,
        categories: ['test'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          category: 'test',
          description: 't',
          properties: {},
        },
      ],
      edges: [],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.some((e) => e.includes('nodeCount'))).toBe(true);
  });

  it('detects missing required node fields', () => {
    const bad = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 1,
        edgeCount: 0,
        categories: ['test'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          // missing category
          description: 't',
          properties: {},
        },
      ],
      edges: [],
    };
    const result = validateWorldModel(bad);
    expect(
      result.errors.some((e) => e.includes('missing required field'))
    ).toBe(true);
  });

  it('detects unknown categories', () => {
    const bad = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 1,
        edgeCount: 0,
        categories: ['valid-category'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          category: 'invalid-category',
          description: 't',
          properties: {},
        },
      ],
      edges: [],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.some((e) => e.includes('unknown category'))).toBe(true);
  });

  it('detects missing edge sources', () => {
    const bad = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 1,
        edgeCount: 1,
        categories: ['test'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          category: 'test',
          description: 't',
          properties: {},
        },
      ],
      edges: [
        {
          source: 'nonexistent',
          target: 'a',
          type: 'rel.underpins',
          weight: 1,
        },
      ],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes('source not found'))).toBe(true);
  });

  it('detects invalid edge types', () => {
    const bad = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 1,
        edgeCount: 1,
        categories: ['test'],
      },
      nodes: [
        {
          id: 'a',
          name: 'A',
          category: 'test',
          description: 't',
          properties: {},
        },
        {
          id: 'b',
          name: 'B',
          category: 'test',
          description: 't',
          properties: {},
        },
      ],
      edges: [
        {
          source: 'a',
          target: 'b',
          type: 'invalid.type',
          weight: 1,
        },
      ],
    };
    const result = validateWorldModel(bad);
    expect(result.errors.some((e) => e.includes('not found in relationship types'))).toBe(true);
  });

  it('skips orphan warnings for relationship-type nodes', () => {
    const model = {
      meta: {
        version: '1.0.0',
        generated: '',
        nodeCount: 1,
        edgeCount: 0,
        categories: ['relationship-type'],
      },
      nodes: [
        {
          id: 'rel.test',
          name: 'Test Rel',
          category: 'relationship-type',
          description: 't',
          properties: {},
        },
      ],
      edges: [],
    };
    const result = validateWorldModel(model);
    expect(result.warnings.some((w) => w.includes('rel.test'))).toBe(false);
  });
});
