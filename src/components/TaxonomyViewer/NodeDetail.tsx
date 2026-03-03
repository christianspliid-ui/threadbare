/**
 * NodeDetail Component
 *
 * Sidebar panel showing detailed information about a selected taxonomy node.
 * Displays the node's properties, connections, and relationships.
 */

import React from "react";
import { TaxonomyNode, TaxonomyEdge } from "../../types/taxonomy";
import { getEdgesForNode, getRelationshipType } from "../../engine/taxonomy";
import { TaxonomyGraph } from "../../types/taxonomy";
import "./NodeDetail.css";

interface NodeDetailProps {
  node: TaxonomyNode | null;
  graph: TaxonomyGraph;
  onClose: () => void;
}

/**
 * Groups edges by relationship type and relationship direction (incoming/outgoing).
 */
interface EdgeGroup {
  typeId: string;
  typeName: string;
  incoming: TaxonomyEdge[];
  outgoing: TaxonomyEdge[];
}

export const NodeDetail: React.FC<NodeDetailProps> = ({
  node,
  graph,
  onClose,
}) => {
  if (!node) {
    return (
      <div className="node-detail-panel closed">
        <p className="hint">Select a node to view details</p>
      </div>
    );
  }

  // Get all edges for this node
  const edges = getEdgesForNode(graph, node.id);

  // Group edges by relationship type
  const edgesByType = new Map<string, EdgeGroup>();
  for (const edge of edges) {
    const typeId = edge.type;
    const typeNode = getRelationshipType(graph, typeId);
    const typeName = typeNode?.name || typeId;

    if (!edgesByType.has(typeId)) {
      edgesByType.set(typeId, {
        typeId,
        typeName,
        incoming: [],
        outgoing: [],
      });
    }

    const group = edgesByType.get(typeId)!;
    if (edge.source === node.id) {
      group.outgoing.push(edge);
    } else {
      group.incoming.push(edge);
    }
  }

  // Get node names for edge display
  const getNodeName = (nodeId: string): string => {
    const n = graph.nodes.find((n) => n.id === nodeId);
    return n?.name || nodeId;
  };

  return (
    <div className="node-detail-panel open">
      <div className="panel-header">
        <h2 className="node-title">{node.name}</h2>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">
        {/* Category Badge */}
        <div className="category-badge" data-category={node.category}>
          {node.category}
        </div>

        {/* Description */}
        <div className="section">
          <h3 className="section-title">Description</h3>
          <p className="description">{node.description}</p>
        </div>

        {/* Node ID */}
        <div className="section">
          <h4 className="property-label">ID</h4>
          <code className="property-value">{node.id}</code>
        </div>

        {/* Properties */}
        {Object.keys(node.properties).length > 0 && (
          <div className="section">
            <h3 className="section-title">Properties</h3>
            <div className="properties-list">
              {Object.entries(node.properties).map(([key, value]) => (
                <div key={key} className="property">
                  <span className="property-label">{key}</span>
                  <span className="property-value">
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        {edges.length > 0 && (
          <div className="section">
            <h3 className="section-title">Connections</h3>
            <div className="connections-list">
              {Array.from(edgesByType.values()).map((group) => (
                <div key={group.typeId} className="edge-group">
                  <h4 className="edge-type-title">{group.typeName}</h4>

                  {/* Outgoing edges */}
                  {group.outgoing.length > 0 && (
                    <div className="edge-direction">
                      <span className="direction-label">→ generates/points to:</span>
                      <ul className="edge-list">
                        {group.outgoing.map((edge, idx) => (
                          <li key={idx} className="edge-item">
                            <span className="edge-target">
                              {getNodeName(edge.target)}
                            </span>
                            {edge.weight !== undefined && (
                              <span className="edge-weight">
                                {(edge.weight * 100).toFixed(0)}%
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Incoming edges */}
                  {group.incoming.length > 0 && (
                    <div className="edge-direction">
                      <span className="direction-label">← from:</span>
                      <ul className="edge-list">
                        {group.incoming.map((edge, idx) => (
                          <li key={idx} className="edge-item">
                            <span className="edge-source">
                              {getNodeName(edge.source)}
                            </span>
                            {edge.weight !== undefined && (
                              <span className="edge-weight">
                                {(edge.weight * 100).toFixed(0)}%
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {edges.length === 0 && (
          <div className="section">
            <p className="no-connections">No connections to other nodes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetail;
