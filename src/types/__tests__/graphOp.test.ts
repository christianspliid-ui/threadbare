import { describe, it, expect } from 'vitest';
import type { GraphOp, GraphOpResult, GraphOpContext, SymbolicRef } from '../graphOp';
import { SYMBOLIC_REFS, isSymbolicRef, resolveRef } from '../graphOp';

describe('GraphOp types', () => {
  it('should export SYMBOLIC_REFS constant with $actor, $target, $location', () => {
    expect(SYMBOLIC_REFS).toContain('$actor');
    expect(SYMBOLIC_REFS).toContain('$target');
    expect(SYMBOLIC_REFS).toContain('$location');
  });

  it('isSymbolicRef should identify symbolic references', () => {
    expect(isSymbolicRef('$actor')).toBe(true);
    expect(isSymbolicRef('$target')).toBe(true);
    expect(isSymbolicRef('$location')).toBe(true);
    expect(isSymbolicRef('node.123')).toBe(false);
    expect(isSymbolicRef('agent.1')).toBe(false);
  });

  it('resolveRef should resolve symbolic refs from context', () => {
    const ctx: GraphOpContext = {
      actorId: 'agent.1',
      targetId: 'loc.market',
      locationId: 'hex.5',
    };
    expect(resolveRef('$actor', ctx)).toBe('agent.1');
    expect(resolveRef('$target', ctx)).toBe('loc.market');
    expect(resolveRef('$location', ctx)).toBe('hex.5');
    expect(resolveRef('literal.id', ctx)).toBe('literal.id');
  });

  it('resolveRef should handle extras in context', () => {
    const ctx: GraphOpContext = {
      actorId: 'agent.1',
      targetId: 'loc.market',
      locationId: 'hex.5',
      extras: {
        'custom_ref': 'custom.value',
      },
    };
    expect(resolveRef('custom_ref', ctx)).toBe('custom.value');
  });

  it('should support GraphOp for add_node operations', () => {
    const op: GraphOp = {
      op: 'add_node',
      nodeType: 'actor',
      nodeName: 'test actor',
      properties: { actorType: 'individual' },
    };
    expect(op.op).toBe('add_node');
    expect(op.nodeType).toBe('actor');
  });

  it('should support GraphOp for add_edge operations with symbolic refs', () => {
    const op: GraphOp = {
      op: 'add_edge',
      edgeType: 'relates_to',
      source: '$actor',
      target: '$target',
      properties: { sentiment: 'friendly' },
    };
    expect(op.op).toBe('add_edge');
    expect(op.source).toBe('$actor');
    expect(op.target).toBe('$target');
  });

  it('should support GraphOp for update_node operations', () => {
    const op: GraphOp = {
      op: 'update_node',
      nodeId: '$actor',
      changes: { name: 'new name' },
    };
    expect(op.op).toBe('update_node');
    expect(op.nodeId).toBe('$actor');
  });

  it('should support GraphOpResult with success and error states', () => {
    const successResult: GraphOpResult = {
      op: { op: 'add_node', nodeType: 'actor' },
      success: true,
      createdId: 'actor.123',
    };
    expect(successResult.success).toBe(true);
    expect(successResult.createdId).toBe('actor.123');

    const failureResult: GraphOpResult = {
      op: { op: 'add_edge', edgeType: 'relates_to' },
      success: false,
      error: 'Source node not found',
    };
    expect(failureResult.success).toBe(false);
    expect(failureResult.error).toBe('Source node not found');
  });
});
