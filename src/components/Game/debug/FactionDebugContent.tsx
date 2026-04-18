import React, { useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import { FACTION_DEFINITIONS } from '../../../data/faction-definitions';
import type { MemberOfEdgeProperties } from '../../../types/disposition';
import { computeRankFromReputation } from '../../../types/faction';
import { getTraitsForNode } from '../../../engine/traits';

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: 'var(--text-primary)',
  opacity: 0.4,
  fontSize: 'var(--text-xs)',
};

const DETAIL_BG = 'var(--bg-raised)';
const DETAIL_BORDER = 'var(--border-subtle)';

export interface FactionDebugContentProps {
  graph?: WorldGraph;
  onZoomToLocation?: (locationId: string) => void;
}

export function FactionDebugContent({ graph, onZoomToLocation }: FactionDebugContentProps) {
  if (!graph) return <div style={EMPTY_STATE_STYLE}>No graph loaded.</div>;

  const factionData = useMemo(() => {
    const results: Array<{
      defId: string;
      name: string;
      factionNodeId: string;
      reputationTraits: Array<{ traitId: string; label: string }>;
      members: Array<{ id: string; name: string; rank: string; reputation: number; locationId: string | null; locationName: string | null }>;
      armies: Array<{ id: string; name: string; locationId: string | null; locationName: string | null }>;
    }> = [];

    for (const [defId, def] of FACTION_DEFINITIONS) {
      const factionNodes = graph.getNodesByType('actor')
        .filter(n => n.properties.factionDefId === defId);
      if (factionNodes.length === 0) continue;

      for (const factionNode of factionNodes) {
        const memberEdges = graph.getIncomingEdges(factionNode.id, 'member_of');
        const members = memberEdges
          .filter(edge => {
            const node = graph.getNode(edge.source);
            return node && !node.properties.armyState;
          })
          .map(edge => {
            const agentNode = graph.getNode(edge.source);
            const props = edge.properties as Partial<MemberOfEdgeProperties>;
            const rep = props.reputation ?? 0;
            const rank = computeRankFromReputation(rep, def);
            const locEdges = graph.getOutgoingEdges(edge.source, 'located_at');
            const locNode = locEdges[0] ? graph.getNode(locEdges[0].target) : null;
            return {
              id: edge.source,
              name: agentNode?.name ?? '?',
              rank: rank.name,
              reputation: rep,
              locationId: locNode?.id ?? null,
              locationName: locNode?.name ?? null,
            };
          }).sort((a, b) => b.reputation - a.reputation);

        const armyMembers = memberEdges
          .filter(edge => {
            const node = graph.getNode(edge.source);
            return node && node.properties.armyState != null;
          })
          .map(edge => {
            const armyNode = graph.getNode(edge.source)!;
            const locEdges = graph.getOutgoingEdges(edge.source, 'located_at');
            const locNode = locEdges[0] ? graph.getNode(locEdges[0].target) : null;
            return {
              id: armyNode.id,
              name: armyNode.name,
              locationId: locNode?.id ?? null,
              locationName: locNode?.name ?? null,
            };
          });

        const reputationTraits = getTraitsForNode(graph, factionNode.id)
          .filter(e => e.target.startsWith('trait.reputation.') && !e.target.includes('power'))
          .map(e => {
            const level = (e.properties as { level?: number }).level ?? 1;
            const stars = '★'.repeat(level) + '☆'.repeat(3 - level);
            const label = `${e.target.replace('trait.reputation.', '').replace('.', ' ')} ${stars}`;
            return { traitId: e.target, label };
          });

        results.push({
          defId,
          name: factionNode.name,
          factionNodeId: factionNode.id,
          reputationTraits,
          members,
          armies: armyMembers,
        });
      }
    }
    return results;
  }, [graph]);

  if (factionData.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>No factions found in graph.</div>;
  }

  return (
    <div data-testid="factions-tab-content">
      {factionData.map(faction => (
        <div key={faction.factionNodeId} style={{ marginBottom: '16px' }}>
          <div style={{ padding: '8px 12px', background: DETAIL_BG, borderRadius: '4px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: 'var(--text-xs)' }}>
              {faction.name}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {faction.members.length} member{faction.members.length !== 1 ? 's' : ''}
            </div>
            {faction.reputationTraits.length > 0 && (
              <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {faction.reputationTraits.map(t => (
                  <span
                    key={t.traitId}
                    title={t.traitId}
                    style={{
                      fontSize: 'var(--text-xs)',
                      background: 'var(--bg-deep)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      padding: '1px 5px',
                      color: 'var(--text-secondary)',
                    }}
                  >{t.label}</span>
                ))}
              </div>
            )}
          </div>

          {faction.armies.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', padding: '2px 12px', fontWeight: 600 }}>Armies</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {faction.armies.map(army => (
                  <div
                    key={army.id}
                    style={{
                      padding: '6px 12px',
                      background: DETAIL_BG,
                      border: `1px solid ${DETAIL_BORDER}`,
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{army.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{army.locationName ?? '—'}</span>
                      {onZoomToLocation && army.locationId && (
                        <button
                          onClick={() => onZoomToLocation(army.locationId!)}
                          title={`Zoom to ${army.locationName}`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--text-xs)', lineHeight: 1 }}
                        >&#x1F441;</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {faction.members.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No members
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', padding: '2px 12px', fontWeight: 600 }}>Members</div>
              {faction.members.map(member => (
                <div
                  key={member.id}
                  style={{
                    padding: '6px 12px',
                    background: DETAIL_BG,
                    border: `1px solid ${DETAIL_BORDER}`,
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-primary)' }}>{member.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>{member.rank}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {member.locationName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{member.locationName}</span>
                        {onZoomToLocation && member.locationId && (
                          <button
                            onClick={() => onZoomToLocation(member.locationId!)}
                            title={`Zoom to ${member.locationName}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'var(--text-xs)', lineHeight: 1 }}
                          >&#x1F441;</button>
                        )}
                      </div>
                    )}
                    <div style={{ width: '60px', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(member.reputation * 100)}%`, height: '100%', background: 'var(--accent-gold)', borderRadius: '2px' }} />
                    </div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums' }}>
                      {(member.reputation * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
