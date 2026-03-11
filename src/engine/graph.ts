/**
 * WorldGraph — the runtime simulation graph.
 *
 * Typed property graph with O(1) node/edge access via Maps,
 * and adjacency index for fast neighborhood queries.
 */
import type { GraphNode, GraphEdge, GraphMutation, NodeType, EdgeType } from '../types/graph';

export class WorldGraph {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();

  // Adjacency indices for O(1) neighborhood queries
  private outgoing = new Map<string, Set<string>>(); // nodeId → Set<edgeId>
  private incoming = new Map<string, Set<string>>(); // nodeId → Set<edgeId>

  // --- Node operations ---

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Duplicate node ID: ${node.id}`);
    }
    this.nodes.set(node.id, { ...node, properties: { ...node.properties } });
    this.outgoing.set(node.id, new Set());
    this.incoming.set(node.id, new Set());
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  removeNode(id: string): void {
    // Remove all connected edges first
    const allEdges = this.getAllEdgesForNode(id);
    for (const edge of allEdges) {
      this.removeEdge(edge.id);
    }
    this.nodes.delete(id);
    this.outgoing.delete(id);
    this.incoming.delete(id);
  }

  updateNode(id: string, updates: Partial<GraphNode>): void {
    const existing = this.nodes.get(id);
    if (!existing) throw new Error(`Node not found: ${id}`);
    this.nodes.set(id, {
      ...existing,
      ...updates,
      id: existing.id, // ID is immutable
      properties: updates.properties
        ? { ...existing.properties, ...updates.properties }
        : existing.properties,
    });
  }

  getNodesByType(type: NodeType): GraphNode[] {
    const result: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) result.push(node);
    }
    return result;
  }

  // --- Edge operations ---

  addEdge(edge: GraphEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`Duplicate edge ID: ${edge.id}`);
    }
    if (!this.nodes.has(edge.source)) {
      throw new Error(`Source node not found: ${edge.source}`);
    }
    if (!this.nodes.has(edge.target)) {
      throw new Error(`Target node not found: ${edge.target}`);
    }
    this.edges.set(edge.id, { ...edge, properties: { ...edge.properties } });
    this.outgoing.get(edge.source)!.add(edge.id);
    this.incoming.get(edge.target)!.add(edge.id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (!edge) return;
    this.outgoing.get(edge.source)?.delete(id);
    this.incoming.get(edge.target)?.delete(id);
    this.edges.delete(id);
  }

  updateEdge(id: string, updates: Partial<GraphEdge>): void {
    const existing = this.edges.get(id);
    if (!existing) throw new Error(`Edge not found: ${id}`);
    this.edges.set(id, {
      ...existing,
      ...updates,
      id: existing.id,
      properties: updates.properties
        ? { ...existing.properties, ...updates.properties }
        : existing.properties,
    });
  }

  getOutgoingEdges(nodeId: string, edgeType?: EdgeType): GraphEdge[] {
    const edgeIds = this.outgoing.get(nodeId);
    if (!edgeIds) return [];
    const result: GraphEdge[] = [];
    for (const eid of edgeIds) {
      const edge = this.edges.get(eid)!;
      if (!edgeType || edge.type === edgeType) result.push(edge);
    }
    return result;
  }

  getIncomingEdges(nodeId: string, edgeType?: EdgeType): GraphEdge[] {
    const edgeIds = this.incoming.get(nodeId);
    if (!edgeIds) return [];
    const result: GraphEdge[] = [];
    for (const eid of edgeIds) {
      const edge = this.edges.get(eid)!;
      if (!edgeType || edge.type === edgeType) result.push(edge);
    }
    return result;
  }

  getAllEdgesForNode(nodeId: string): GraphEdge[] {
    return [
      ...this.getOutgoingEdges(nodeId),
      ...this.getIncomingEdges(nodeId),
    ];
  }

  getEdgesByType(type: EdgeType): GraphEdge[] {
    const result: GraphEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.type === type) result.push(edge);
    }
    return result;
  }

  getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  getNeighborIds(nodeId: string): string[] {
    const neighbors = new Set<string>();
    for (const edge of this.getOutgoingEdges(nodeId)) {
      neighbors.add(edge.target);
    }
    for (const edge of this.getIncomingEdges(nodeId)) {
      neighbors.add(edge.source);
    }
    return [...neighbors];
  }

  // --- Batch mutations ---

  applyMutations(mutations: GraphMutation[]): void {
    for (const mut of mutations) {
      switch (mut.type) {
        case 'add_node':
          this.addNode(mut.data as GraphNode);
          break;
        case 'remove_node':
          this.removeNode(mut.nodeId!);
          break;
        case 'update_node':
          this.updateNode(mut.nodeId!, mut.data as Partial<GraphNode>);
          break;
        case 'add_edge':
          this.addEdge(mut.data as GraphEdge);
          break;
        case 'remove_edge':
          this.removeEdge(mut.edgeId!);
          break;
        case 'update_edge':
          this.updateEdge(mut.edgeId!, mut.data as Partial<GraphEdge>);
          break;
      }
    }
  }

  // --- Stats ---

  getStats(): { nodeCount: number; edgeCount: number } {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
    };
  }
}
