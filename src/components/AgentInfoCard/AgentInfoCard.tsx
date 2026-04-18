/**
 * AgentInfoCard — side panel showing full agent details.
 *
 * Opened by clicking an agent dot on the hex map.
 * Shows profile, inventory, relationships, and movement status.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementState } from '../../types/movement';
import { AGENT_INFO_SECTION_LABELS } from '../../data/agent-info-content';
import { DOMAIN_COLORS, DEFAULT_AGENT_COLOR } from '../../data/agent-visual-content';

interface AgentInfoCardProps {
  graph: WorldGraph;
  agentId: string;
  onClose: () => void;
}

export const AgentInfoCard: React.FC<AgentInfoCardProps> = ({ graph, agentId, onClose }) => {
  const agent = graph.getNode(agentId);
  if (!agent) return null;

  const props = agent.properties ?? {};
  const domains = props.domainCapabilities as Record<string, number> | undefined;
  const movementState = props.movementState as MovementState | undefined;
  const archetype = props.narrativeArchetype as string | undefined;

  // Get faction membership
  const factionEdges = graph.getOutgoingEdges(agentId, 'member_of');
  const factions = factionEdges.map(e => graph.getNode(e.target)).filter(Boolean);

  // Get current location
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  const currentLoc = locEdges.length > 0 ? graph.getNode(locEdges[0].target) : null;

  return (
    <div className="agent-info-card" style={{
      position: 'absolute', right: 0, top: 0, width: 320,
      background: '#1a1a2e', color: '#e0e0e0', padding: 16,
      borderLeft: '2px solid #333', height: '100%', overflowY: 'auto',
    }}>
      <button onClick={onClose} style={{ float: 'right', cursor: 'pointer' }}>✕</button>
      <h2 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{agent.name}</h2>
      {archetype && <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginBottom: 12 }}>{archetype}</div>}

      {/* Profile */}
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', borderBottom: '1px solid #333', paddingBottom: 4 }}>
          {AGENT_INFO_SECTION_LABELS.profile}
        </h3>
        {domains && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {Object.entries(domains)
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([domain, value]) => (
                <span key={domain} style={{
                  background: DOMAIN_COLORS[domain] ?? DEFAULT_AGENT_COLOR,
                  padding: '2px 6px', borderRadius: 4, fontSize: 'var(--text-xs)',
                }}>
                  {domain}: {value.toFixed(1)}
                </span>
              ))}
          </div>
        )}
      </section>

      {/* Relationships */}
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', borderBottom: '1px solid #333', paddingBottom: 4 }}>
          {AGENT_INFO_SECTION_LABELS.relationships}
        </h3>
        {factions.length > 0 ? (
          <ul style={{ margin: '8px 0', paddingLeft: 16, fontSize: 'var(--text-xs)' }}>
            {factions.map(f => f && <li key={f.id}>{f.name}</li>)}
          </ul>
        ) : (
          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.5, marginTop: 8 }}>No faction membership</div>
        )}
      </section>

      {/* Movement */}
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 'var(--text-sm)', borderBottom: '1px solid #333', paddingBottom: 4 }}>
          {AGENT_INFO_SECTION_LABELS.movement}
        </h3>
        <div style={{ fontSize: 'var(--text-xs)', marginTop: 8 }}>
          <div>Location: {currentLoc?.name ?? 'Unknown'}</div>
          {movementState?.destinationId && (
            <div>Destination: {graph.getNode(movementState.destinationId)?.name ?? movementState.destinationId}</div>
          )}
          {movementState?.movementQueue && movementState.movementQueue.length > 0 && (
            <div>Steps remaining: {movementState.movementQueue.length}</div>
          )}
        </div>
      </section>
    </div>
  );
};
