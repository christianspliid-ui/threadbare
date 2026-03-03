/**
 * TaxonomyViewer Component
 *
 * Renders the cosmological taxonomy as an interactive force-directed graph.
 * Uses d3-force for layout simulation and SVG for rendering.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { loadTaxonomy } from "../../engine/taxonomy";
import { TaxonomyNode, TaxonomyEdge, TaxonomyGraph, CATEGORY_COLORS } from "../../types/taxonomy";
import { getRelationshipType } from "../../engine/taxonomy";
import NodeDetail from "./NodeDetail";
import "./TaxonomyViewer.css";

interface D3Node extends TaxonomyNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface D3Link extends TaxonomyEdge {
  source: D3Node;
  target: D3Node;
}

export const TaxonomyViewer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  const [graph, setGraph] = useState<TaxonomyGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    new Set()
  );

  // Get unique categories for filter buttons
  const categories = useMemo(() => {
    if (!graph) return [];
    const cats = new Set(graph.nodes.map((n) => n.category));
    return Array.from(cats).sort();
  }, [graph]);

  // Load taxonomy on mount
  useEffect(() => {
    loadTaxonomy().then((taxonomy) => {
      setGraph(taxonomy);
    });
  }, []);

  // Filter nodes and edges based on hidden categories
  const filteredData = useMemo(() => {
    if (!graph) return null;

    const visibleNodes = graph.nodes.filter(
      (n) => !hiddenCategories.has(n.category)
    );
    const nodeIds = new Set(visibleNodes.map((n) => n.id));

    const visibleEdges = graph.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return {
      nodes: visibleNodes,
      edges: visibleEdges,
    };
  }, [graph, hiddenCategories]);

  // Initialize and update d3 simulation
  useEffect(() => {
    if (!svgRef.current || !filteredData) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create a new simulation
    const simulation = d3
      .forceSimulation(filteredData.nodes as D3Node[])
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(filteredData.edges as D3Link[])
          .id((d) => d.id)
          .distance((d) => {
            // Adjust link distance based on edge weight
            const weight = d.weight ?? 1;
            return 100 / weight;
          })
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    // Clear previous content
    svg.selectAll("*").remove();

    // Define arrowhead marker
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("refX", 8)
      .attr("refY", 3)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3, 0 6")
      .attr("fill", "#666");

    // Create groups for links and nodes
    const linkGroup = svg.append("g").attr("class", "links");
    const nodeGroup = svg.append("g").attr("class", "nodes");

    // Render links (edges)
    const links = linkGroup
      .selectAll("line")
      .data(filteredData.edges as D3Link[])
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("stroke", (d) => {
        const relType = getRelationshipType(graph!, d.type);
        if (relType?.properties.visualStyle?.color) {
          return relType.properties.visualStyle.color;
        }
        return "#999";
      })
      .attr("stroke-dasharray", (d) => {
        const relType = getRelationshipType(graph!, d.type);
        if (relType?.properties.visualStyle?.dashArray) {
          return relType.properties.visualStyle.dashArray;
        }
        return "0";
      })
      .attr("stroke-width", (d) => {
        const weight = d.weight ?? 1;
        return 1 + weight * 1.5;
      })
      .attr("marker-end", (d) => {
        const relType = getRelationshipType(graph!, d.type);
        if (relType?.properties.visualStyle?.arrowHead) {
          return "url(#arrowhead)";
        }
        return "none";
      });

    // Render nodes
    const nodes = nodeGroup
      .selectAll("g")
      .data(filteredData.nodes as D3Node[])
      .enter()
      .append("g")
      .attr("class", "node-group")
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    nodes
      .append("circle")
      .attr("r", (d) => {
        const importance = d.properties?.importance ?? 0.5;
        return 8 + importance * 8;
      })
      .attr("fill", (d) => {
        const color = CATEGORY_COLORS[d.category as keyof typeof CATEGORY_COLORS];
        return color || "#999";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d);
        // Pulse the node
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("r", (d: D3Node) => {
            const importance = d.properties?.importance ?? 0.5;
            return 12 + importance * 8;
          })
          .transition()
          .duration(200)
          .attr("r", (d: D3Node) => {
            const importance = d.properties?.importance ?? 0.5;
            return 8 + importance * 8;
          });
      });

    // Add labels (only for important nodes to reduce clutter)
    nodes
      .append("text")
      .attr("class", "node-label")
      .attr("dy", "0.3em")
      .attr("text-anchor", "middle")
      .text((d) => {
        const importance = d.properties?.importance ?? 0.5;
        return importance > 0.6 ? d.name.substring(0, 10) : "";
      })
      .attr("font-size", (d) => {
        const importance = d.properties?.importance ?? 0.5;
        return 9 + importance * 3;
      })
      .attr("fill", "#fff")
      .attr("font-weight", "600")
      .attr("pointer-events", "none");

    // Update positions on tick
    simulation.on("tick", () => {
      links
        .attr("x1", (d) => d.source.x || 0)
        .attr("y1", (d) => d.source.y || 0)
        .attr("x2", (d) => d.target.x || 0)
        .attr("y2", (d) => d.target.y || 0);

      nodes.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      svg.attr("width", newWidth).attr("height", newHeight);
      simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      simulation.stop();
    };
  }, [filteredData, graph]);

  const toggleCategory = (category: string) => {
    const newHidden = new Set(hiddenCategories);
    if (newHidden.has(category)) {
      newHidden.delete(category);
    } else {
      newHidden.add(category);
    }
    setHiddenCategories(newHidden);
  };

  return (
    <div className="taxonomy-viewer-container">
      <div className="viewer-header">
        <h1 className="viewer-title">Cosmological Taxonomy</h1>
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-button ${
                hiddenCategories.has(category) ? "hidden" : "visible"
              }`}
              onClick={() => toggleCategory(category)}
              title={`Toggle ${category}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="viewer-content">
        <div className="graph-container" ref={containerRef}>
          <svg ref={svgRef} className="graph-svg" />
          {!graph && (
            <div className="loading-message">Loading taxonomy...</div>
          )}
        </div>

        <div className="detail-panel-wrapper">
          <NodeDetail
            node={selectedNode}
            graph={graph || { nodes: [], edges: [] }}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default TaxonomyViewer;
