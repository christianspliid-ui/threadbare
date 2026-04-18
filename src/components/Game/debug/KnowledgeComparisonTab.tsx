/**
 * KnowledgeComparisonTab — debug panel sub-tab comparing engine-known
 * vs player-known data per agent.
 *
 * For each agent in the agentKnowledge map, shows two columns:
 * - Engine side: total capabilities (domains, values, bonds from graph)
 * - Player side: revealed counts from AgentKnowledge
 * - Gaps highlighted in red (unrevealed counts)
 *
 * Lazy-renders: only when the tab is mounted.
 */

import React, { useMemo } from 'react';
import type { AgentKnowledge } from '../../../types/agentKnowledge';
import type { WorldGraph } from '../../../engine/graph';

// ─── Props ────────────────────────────────────────────────────────

interface KnowledgeComparisonTabProps {
  agentKnowledge: Map<string, AgentKnowledge>;
  graph?: WorldGraph;
}

// ─── Constants ────────────────────────────────────────────────────

/** Total axiological value pairs in the game */
const TOTAL_VALUE_PAIRS = 10;

/** Total reach domains */
const TOTAL_DOMAINS = 9;

// ─── Styles ───────────────────────────────────────────────────────

const CONTAINER_STYLE: React.CSSProperties = {
  padding: '8px',
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const EMPTY_STYLE: React.CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: 'var(--text-xs)',
  opacity: 0.6,
};

const TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'var(--text-xs)',
  fontFamily: 'monospace',
};

const TH_STYLE: React.CSSProperties = {
  padding: '4px 6px',
  textAlign: 'left',
  color: 'var(--text-muted)',
  fontSize: 'var(--text-xs)',
  borderBottom: '1px solid var(--border-subtle)',
  fontWeight: 600,
  background: 'var(--bg-abyss)',
};

const TD_STYLE: React.CSSProperties = {
  padding: '4px 6px',
  borderBottom: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  verticalAlign: 'top',
};

const AGENT_NAME_STYLE: React.CSSProperties = {
  ...TD_STYLE,
  fontWeight: 600,
  color: 'var(--accent-gold)',
  maxWidth: '100px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// ─── Component ────────────────────────────────────────────────────

export function KnowledgeComparisonTab({ agentKnowledge, graph }: KnowledgeComparisonTabProps) {
  const agentRows = useMemo(() => {
    return Array.from(agentKnowledge.entries()).map(([agentId, knowledge]) => {
      // Get agent name from graph
      const agentNode = graph?.getNode(agentId);
      const agentName = agentNode?.name ?? agentId;

      // Engine side: count total bonds from relates_to edges
      const totalBonds = graph
        ? graph.getOutgoingEdges(agentId, 'relates_to').length +
          graph.getIncomingEdges(agentId, 'relates_to').length
        : 0;

      // Player side: revealed counts
      const revealedValues = knowledge.revealedValues.size;
      const revealedDomains = knowledge.revealedDomains.size;
      const revealedBonds = knowledge.revealedBonds.size;
      const revealedPossessions = knowledge.revealedPossessions.size;
      const revealedAmbitions = knowledge.revealedAmbitions.size;
      const dispositionRevealed = knowledge.dispositionRevealed;

      // Gap calculation (unrevealed)
      const valueGap = TOTAL_VALUE_PAIRS - revealedValues;
      const domainGap = TOTAL_DOMAINS - revealedDomains;
      const bondGap = Math.max(0, totalBonds - revealedBonds);

      return {
        agentId,
        agentName,
        totalBonds,
        revealedValues,
        revealedDomains,
        revealedBonds,
        revealedPossessions,
        revealedAmbitions,
        dispositionRevealed,
        valueGap,
        domainGap,
        bondGap,
        interactionDepth: knowledge.interactionDepth,
        coLocationTicks: knowledge.coLocationTicks,
      };
    });
  }, [agentKnowledge, graph]);

  if (agentRows.length === 0) {
    return (
      <div style={CONTAINER_STYLE}>
        <div style={EMPTY_STYLE}>No agent knowledge tracked yet.</div>
      </div>
    );
  }

  return (
    <div style={CONTAINER_STYLE}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
        {agentRows.length} agents tracked
      </div>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>Agent</th>
            <th style={TH_STYLE} title="Values revealed / total">Values</th>
            <th style={TH_STYLE} title="Domains revealed / total">Domains</th>
            <th style={TH_STYLE} title="Bonds revealed / total graph edges">Bonds</th>
            <th style={TH_STYLE} title="Items revealed">Items</th>
            <th style={TH_STYLE} title="Disposition known">Disp</th>
            <th style={TH_STYLE} title="Interaction depth">Depth</th>
          </tr>
        </thead>
        <tbody>
          {agentRows.map(row => (
            <tr key={row.agentId}>
              <td style={AGENT_NAME_STYLE} title={row.agentId}>
                {row.agentName.length > 14 ? `${row.agentName.slice(0, 14)}…` : row.agentName}
              </td>
              <td style={TD_STYLE}>
                <GapDisplay revealed={row.revealedValues} total={TOTAL_VALUE_PAIRS} gap={row.valueGap} />
              </td>
              <td style={TD_STYLE}>
                <GapDisplay revealed={row.revealedDomains} total={TOTAL_DOMAINS} gap={row.domainGap} />
              </td>
              <td style={TD_STYLE}>
                <GapDisplay revealed={row.revealedBonds} total={row.totalBonds} gap={row.bondGap} />
              </td>
              <td style={TD_STYLE}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.revealedPossessions}</span>
              </td>
              <td style={TD_STYLE}>
                <span style={{ color: row.dispositionRevealed ? '#4ade80' : '#f87171', fontSize: 'var(--text-xs)' }}>
                  {row.dispositionRevealed ? 'yes' : 'no'}
                </span>
              </td>
              <td style={TD_STYLE}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {row.interactionDepth.toFixed(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-component ────────────────────────────────────────────────

function GapDisplay({ revealed, total, gap }: { revealed: number; total: number; gap: number }) {
  return (
    <span>
      <span style={{ color: 'var(--text-primary)' }}>{revealed}</span>
      <span style={{ color: 'var(--text-muted)' }}>/{total}</span>
      {gap > 0 && (
        <span style={{ color: '#f87171', marginLeft: '3px', fontSize: 'var(--text-xs)' }}>
          ({gap} hidden)
        </span>
      )}
    </span>
  );
}
