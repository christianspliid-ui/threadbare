import type { NodeClass } from './schema';

export interface WorldEdge {
  type: string;
  to: string;
}

export interface WorldTags {
  archetype?: string[];
  reach?: string[];
  sphere?: string[];
}

export interface StatedAttributeSource {
  recipeId: string;
  firedAt: string;
}

export interface StatedAttribute {
  field: string;
  value: unknown;
  source: StatedAttributeSource;
}

export interface WorldNode {
  id: string;
  kind: string;
  name?: string;
  nodeClass?: NodeClass;
  class?: NodeClass;
  tags?: WorldTags;
  props?: Record<string, unknown>;
  edges?: WorldEdge[];
  statedAttributes?: StatedAttribute[];
}

export interface WorldSnapshot {
  nodes: WorldNode[];
  worldFlags?: Record<string, unknown>;
  doomClockTier?: number;
  firedCompositions?: string[];
}

export function getNodeClass(node: WorldNode): NodeClass {
  return node.nodeClass ?? node.class ?? 'generic';
}

export function withNodeClass(node: WorldNode, nodeClass: NodeClass): WorldNode {
  return {
    ...node,
    nodeClass,
    class: nodeClass,
  };
}
