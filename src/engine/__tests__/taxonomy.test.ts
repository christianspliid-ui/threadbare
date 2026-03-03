import { describe, it, expect } from "vitest";
import {
  loadTaxonomy,
  getNodesByCategory,
  getEdgesForNode,
  getConnectedNodes,
  getNodeById,
  getEdgesByType,
  getRelationshipType,
} from "../taxonomy";
import { TaxonomyNode, TaxonomyEdge, TaxonomyGraph } from "../../types/taxonomy";

describe("Taxonomy Engine", () => {
  // Test fixture data
  const fixtureNodes: TaxonomyNode[] = [
    {
      id: "test.node1",
      name: "Node 1",
      category: "foundation",
      description: "Test node 1",
      properties: { importance: 1.0 },
    },
    {
      id: "test.node2",
      name: "Node 2",
      category: "creation",
      description: "Test node 2",
      properties: { importance: 0.8 },
    },
    {
      id: "test.node3",
      name: "Node 3",
      category: "foundation",
      description: "Test node 3",
      properties: { importance: 0.6 },
    },
    {
      id: "rel.testrel",
      name: "Test Relationship",
      category: "relationship-type",
      description: "A test relationship type",
      properties: {
        pattern: "asymmetric",
        visualStyle: { color: "#ff0000" },
      },
    },
  ];

  const fixtureEdges: TaxonomyEdge[] = [
    {
      source: "test.node1",
      target: "test.node2",
      type: "rel.testrel",
      weight: 1.0,
    },
    {
      source: "test.node2",
      target: "test.node3",
      type: "rel.testrel",
      weight: 0.5,
    },
    {
      source: "test.node3",
      target: "test.node1",
      type: "rel.testrel",
      weight: 0.7,
    },
  ];

  const fixtureGraph: TaxonomyGraph = {
    nodes: fixtureNodes,
    edges: fixtureEdges,
  };

  describe("getNodesByCategory", () => {
    it("should return nodes matching the specified category", () => {
      const foundationNodes = getNodesByCategory(fixtureGraph, "foundation");
      expect(foundationNodes).toHaveLength(2);
      expect(foundationNodes.every((n) => n.category === "foundation")).toBe(
        true
      );
    });

    it("should return empty array for non-existent category", () => {
      const result = getNodesByCategory(fixtureGraph, "nonexistent");
      expect(result).toHaveLength(0);
    });

    it("should handle relationship-type category", () => {
      const relTypes = getNodesByCategory(fixtureGraph, "relationship-type");
      expect(relTypes).toHaveLength(1);
      expect(relTypes[0].id).toBe("rel.testrel");
    });
  });

  describe("getNodeById", () => {
    it("should return the node with matching ID", () => {
      const node = getNodeById(fixtureGraph, "test.node1");
      expect(node).toBeDefined();
      expect(node?.id).toBe("test.node1");
      expect(node?.name).toBe("Node 1");
    });

    it("should return undefined for non-existent ID", () => {
      const node = getNodeById(fixtureGraph, "nonexistent");
      expect(node).toBeUndefined();
    });
  });

  describe("getEdgesForNode", () => {
    it("should return all edges where node is source or target", () => {
      const edges = getEdgesForNode(fixtureGraph, "test.node1");
      expect(edges).toHaveLength(2);
      expect(
        edges.some((e) => e.source === "test.node1" && e.target === "test.node2")
      ).toBe(true);
      expect(
        edges.some((e) => e.source === "test.node3" && e.target === "test.node1")
      ).toBe(true);
    });

    it("should return empty array for node with no edges", () => {
      const orphanNode: TaxonomyNode = {
        id: "orphan",
        name: "Orphan",
        category: "foundation",
        description: "No edges",
        properties: {},
      };
      const graphWithOrphan: TaxonomyGraph = {
        nodes: [...fixtureNodes, orphanNode],
        edges: fixtureEdges,
      };
      const edges = getEdgesForNode(graphWithOrphan, "orphan");
      expect(edges).toHaveLength(0);
    });
  });

  describe("getConnectedNodes", () => {
    it("should return all nodes directly connected to the given node", () => {
      const connected = getConnectedNodes(fixtureGraph, "test.node1");
      const connectedIds = connected.map((n) => n.id);
      expect(connectedIds).toContain("test.node2"); // outgoing edge
      expect(connectedIds).toContain("test.node3"); // incoming edge
      expect(connectedIds).not.toContain("test.node1"); // self
    });

    it("should return empty array for isolated node", () => {
      const orphanNode: TaxonomyNode = {
        id: "orphan",
        name: "Orphan",
        category: "foundation",
        description: "No edges",
        properties: {},
      };
      const graphWithOrphan: TaxonomyGraph = {
        nodes: [...fixtureNodes, orphanNode],
        edges: fixtureEdges,
      };
      const connected = getConnectedNodes(graphWithOrphan, "orphan");
      expect(connected).toHaveLength(0);
    });

    it("should work with bidirectional edges", () => {
      const graphWithBidirectional: TaxonomyGraph = {
        nodes: fixtureNodes,
        edges: [
          {
            source: "test.node1",
            target: "test.node2",
            type: "rel.testrel",
            weight: 1.0,
          },
          {
            source: "test.node2",
            target: "test.node1",
            type: "rel.testrel",
            weight: 1.0,
          },
        ],
      };
      const connected = getConnectedNodes(graphWithBidirectional, "test.node1");
      expect(connected).toHaveLength(1);
      expect(connected[0].id).toBe("test.node2");
    });
  });

  describe("getEdgesByType", () => {
    it("should return all edges of the specified type", () => {
      const edges = getEdgesByType(fixtureGraph, "rel.testrel");
      expect(edges).toHaveLength(3);
      expect(edges.every((e) => e.type === "rel.testrel")).toBe(true);
    });

    it("should return empty array for non-existent relationship type", () => {
      const edges = getEdgesByType(fixtureGraph, "nonexistent.type");
      expect(edges).toHaveLength(0);
    });

    it("should handle multiple edge types", () => {
      const graphWithMultipleTypes: TaxonomyGraph = {
        nodes: fixtureNodes,
        edges: [
          {
            source: "test.node1",
            target: "test.node2",
            type: "rel.testrel",
            weight: 1.0,
          },
          {
            source: "test.node2",
            target: "test.node3",
            type: "other.rel",
            weight: 0.5,
          },
        ],
      };
      const edges1 = getEdgesByType(graphWithMultipleTypes, "rel.testrel");
      const edges2 = getEdgesByType(graphWithMultipleTypes, "other.rel");
      expect(edges1).toHaveLength(1);
      expect(edges2).toHaveLength(1);
    });
  });

  describe("getRelationshipType", () => {
    it("should return the relationship type node for a given type ID", () => {
      const relType = getRelationshipType(fixtureGraph, "rel.testrel");
      expect(relType).toBeDefined();
      expect(relType?.id).toBe("rel.testrel");
      expect(relType?.category).toBe("relationship-type");
    });

    it("should return undefined if relationship type not found", () => {
      const relType = getRelationshipType(fixtureGraph, "nonexistent.rel");
      expect(relType).toBeUndefined();
    });

    it("should extract visual style properties", () => {
      const relType = getRelationshipType(fixtureGraph, "rel.testrel");
      expect(relType?.properties.visualStyle).toBeDefined();
      expect(relType?.properties.visualStyle.color).toBe("#ff0000");
    });
  });

  describe("loadTaxonomy", () => {
    it("should load taxonomy from JSON files", async () => {
      const graph = await loadTaxonomy();
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it("should include foundation spheres", async () => {
      const graph = await loadTaxonomy();
      const foundationNodes = graph.nodes.filter(
        (n) => n.category === "foundation-sphere"
      );
      expect(foundationNodes.length).toBeGreaterThan(0);
    });

    it("should include creation spheres", async () => {
      const graph = await loadTaxonomy();
      const creationNodes = graph.nodes.filter(
        (n) => n.category === "creation-sphere"
      );
      expect(creationNodes.length).toBeGreaterThan(0);
    });

    it("should include magic traditions", async () => {
      const graph = await loadTaxonomy();
      const magicNodes = graph.nodes.filter(
        (n) => n.category === "magic-tradition"
      );
      expect(magicNodes.length).toBeGreaterThan(0);
    });

    it("should include relationship types", async () => {
      const graph = await loadTaxonomy();
      const relTypeNodes = graph.nodes.filter(
        (n) => n.category === "relationship-type"
      );
      expect(relTypeNodes.length).toBeGreaterThan(0);
    });

    it("should have valid edge references", async () => {
      const graph = await loadTaxonomy();
      const nodeIds = new Set(graph.nodes.map((n) => n.id));
      const relTypeIds = new Set(
        graph.nodes.filter((n) => n.category === "relationship-type").map((n) => n.id)
      );

      for (const edge of graph.edges) {
        expect(nodeIds.has(edge.source)).toBe(
          true,
          `Edge references non-existent source: ${edge.source}`
        );
        expect(nodeIds.has(edge.target)).toBe(
          true,
          `Edge references non-existent target: ${edge.target}`
        );
        expect(relTypeIds.has(edge.type)).toBe(
          true,
          `Edge references non-existent relationship type: ${edge.type}`
        );
      }
    });
  });
});
