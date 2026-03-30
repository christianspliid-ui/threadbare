import React, { useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { GraphEdge } from '../../../types/graph';
import { SENTIMENT_POSITIVE, SENTIMENT_NEUTRAL, SENTIMENT_NEGATIVE } from '../../../data/uiColorPalette';

// ─── Constants ──────────────────────────────────────────────────

/** Trust thresholds for bond classification */
const STRONG_BOND_THRESHOLD = 0.5;
const HOSTILE_BOND_THRESHOLD = -0.3;

// ─── Styles ─────────────────────────────────────────────────────

const CONTAINER_STYLE: React.CSSProperties = {
  fontSize: '12px',
  fontFamily: 'monospace',
  color: 'var(--text-primary)',
};

const HEADING_STYLE: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: 'var(--accent-gold)',
  marginBottom: '6px',
};

const EDGE_ROW_STYLE: React.CSSProperties = {
  padding: '6px 8px',
  marginBottom: '4px',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
};

const STAT_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  fontSize: '10px',
  color: 'var(--text-muted)',
  marginTop: '2px',
};

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '12px',
};

const EMPTY_STYLE: React.CSSProperties = {
  opacity: 0.5,
  textAlign: 'center' as const,
  padding: '16px',
  fontSize: '12px',
  color: 'var(--text-muted)',
};

// ─── Types ──────────────────────────────────────────────────────

interface RelationshipEntry {
  edge: GraphEdge;
  otherAgentId: string;
  otherAgentName: string;
  direction: 'outgoing' | 'incoming';
  trust: number;
  sentiment: number;
  strength: number;
  basis: string;
  classification: 'strong_positive' | 'hostile' | 'neutral' | 'stranger';
}

interface FactionMembership {
  factionId: string;
  factionName: string;
  rank: number;
  rankTitle: string;
}

// ─── Props ──────────────────────────────────────────────────────

export interface RelationshipGraphProps {
  agentId: string;
  graph: WorldGraph;
}

// ─── Helpers ────────────────────────────────────────────────────

function classifyBond(trust: number, strength: number): RelationshipEntry['classification'] {
  if (strength < 0.1) return 'stranger';
  if (trust >= STRONG_BOND_THRESHOLD) return 'strong_positive';
  if (trust <= HOSTILE_BOND_THRESHOLD) return 'hostile';
  return 'neutral';
}

function classificationColor(classification: RelationshipEntry['classification']): string {
  switch (classification) {
    case 'strong_positive': return SENTIMENT_POSITIVE;
    case 'hostile': return SENTIMENT_NEGATIVE;
    case 'neutral': return SENTIMENT_NEUTRAL;
    case 'stranger': return 'var(--text-muted)';
  }
}

function classificationLabel(classification: RelationshipEntry['classification']): string {
  switch (classification) {
    case 'strong_positive': return 'Strong Positive';
    case 'hostile': return 'Hostile';
    case 'neutral': return 'Neutral';
    case 'stranger': return 'Stranger';
  }
}

function rankToTitle(rank: number): string {
  if (rank >= 0.9) return 'Leader';
  if (rank >= 0.7) return 'Officer';
  if (rank >= 0.4) return 'Member';
  return 'Recruit';
}

// ─── Component ──────────────────────────────────────────────────

export const RelationshipGraph = React.memo(function RelationshipGraph({
  agentId,
  graph,
}: RelationshipGraphProps) {
  // Collect all relates_to edges in both directions
  const relationships = useMemo(() => {
    const entries: RelationshipEntry[] = [];

    const outgoing = graph.getOutgoingEdges(agentId, 'relates_to');
    for (const edge of outgoing) {
      const otherNode = graph.getNode(edge.target);
      const trust = (edge.properties?.trust as number) ?? 0;
      const sentiment = (edge.properties?.sentiment as number) ?? 0;
      const strength = (edge.properties?.strength as number) ?? 0;
      const basis = (edge.properties?.basis as string) ?? 'unknown';
      entries.push({
        edge,
        otherAgentId: edge.target,
        otherAgentName: otherNode?.name ?? edge.target,
        direction: 'outgoing',
        trust,
        sentiment,
        strength,
        basis,
        classification: classifyBond(trust, strength),
      });
    }

    const incoming = graph.getIncomingEdges(agentId, 'relates_to');
    for (const edge of incoming) {
      // Skip if we already have an outgoing edge to this agent
      if (entries.some((e) => e.otherAgentId === edge.source)) continue;
      const otherNode = graph.getNode(edge.source);
      const trust = (edge.properties?.trust as number) ?? 0;
      const sentiment = (edge.properties?.sentiment as number) ?? 0;
      const strength = (edge.properties?.strength as number) ?? 0;
      const basis = (edge.properties?.basis as string) ?? 'unknown';
      entries.push({
        edge,
        otherAgentId: edge.source,
        otherAgentName: otherNode?.name ?? edge.source,
        direction: 'incoming',
        trust,
        sentiment,
        strength,
        basis,
        classification: classifyBond(trust, strength),
      });
    }

    // Sort by strength descending
    entries.sort((a, b) => b.strength - a.strength);
    return entries;
  }, [agentId, graph]);

  // Collect faction memberships
  const factions = useMemo(() => {
    const memberships: FactionMembership[] = [];
    const memberEdges = graph.getOutgoingEdges(agentId, 'member_of');
    for (const edge of memberEdges) {
      const factionNode = graph.getNode(edge.target);
      const rank = (edge.properties?.rank as number) ?? 0;
      memberships.push({
        factionId: edge.target,
        factionName: factionNode?.name ?? edge.target,
        rank,
        rankTitle: rankToTitle(rank),
      });
    }
    return memberships;
  }, [agentId, graph]);

  if (relationships.length === 0 && factions.length === 0) {
    return (
      <div data-testid="relationship-graph" style={EMPTY_STYLE}>
        No relationships or faction memberships found.
      </div>
    );
  }

  return (
    <div data-testid="relationship-graph" style={CONTAINER_STYLE}>
      {/* Faction Memberships */}
      {factions.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={HEADING_STYLE}>Factions ({factions.length})</div>
          {factions.map((f) => (
            <div key={f.factionId} style={EDGE_ROW_STYLE}>
              <div style={{ fontWeight: 500 }}>{f.factionName}</div>
              <div style={STAT_ROW_STYLE}>
                <span>Rank: {f.rank.toFixed(2)}</span>
                <span>Title: {f.rankTitle}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Relationships */}
      {relationships.length > 0 && (
        <div style={SECTION_STYLE}>
          <div style={HEADING_STYLE}>Relationships ({relationships.length})</div>
          {relationships.map((r) => (
            <div key={r.edge.id} style={EDGE_ROW_STYLE} data-testid="relationship-entry">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>
                  {r.direction === 'outgoing' ? '\u2192' : '\u2190'} {r.otherAgentName}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: classificationColor(r.classification),
                    textTransform: 'uppercase',
                  }}
                  data-testid="bond-classification"
                >
                  {classificationLabel(r.classification)}
                </span>
              </div>
              <div style={STAT_ROW_STYLE}>
                <span>trust: {r.trust.toFixed(2)}</span>
                <span>sent: {r.sentiment.toFixed(2)}</span>
                <span>str: {r.strength.toFixed(2)}</span>
                <span>basis: {r.basis}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
