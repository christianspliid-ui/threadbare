import React from 'react';
import type { AgentInfoCardData } from '../../engine/agentDetail';
import type { ThreadedNode, ThreadCategory } from '../../engine/retinue';
import type { WorldGraph } from '../../engine/graph';
import { TIER_COLORS } from '../../data/uiColorPalette';
import { getSphereColor } from '../../data/sphereIcons';
import type { ReachDomain } from '../../types/traits';
import { getFactionNetworkSummary } from '../../engine/factionNetwork';

// Domain display names (8 reaches after flesh removal)
const DOMAIN_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
  flesh: 'Flesh',
};

// Category display labels
const CATEGORY_LABELS: Record<ThreadCategory, string> = {
  agent: 'Agent',
  location: 'Location',
  faction: 'Faction',
  army: 'Army',
  artifact: 'Artifact',
};

interface ThreadDetailViewProps {
  node: ThreadedNode;
  /** Pre-built agent info card — only provided when category is 'agent' */
  agentInfoCard?: AgentInfoCardData | null;
  onClose: () => void;
  onViewProfile: (nodeId: string, category: ThreadCategory) => void;
  onZoomToLocation?: (locationId: string) => void;
  graph?: WorldGraph;
}

export const ThreadDetailView = React.memo(function ThreadDetailView({
  node,
  agentInfoCard,
  onClose,
  onViewProfile,
  onZoomToLocation: _onZoomToLocation,
  graph,
}: ThreadDetailViewProps) {
  const tierColor = TIER_COLORS[node.tier] ?? '#6b7280';
  const tierBgColor = `color-mix(in srgb, ${tierColor} 20%, transparent)`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          padding: 'var(--space-4)',
          paddingBottom: 'var(--space-2)',
          backgroundColor: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-gold)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontVariant: 'small-caps',
              letterSpacing: '0.05em',
            }}
          >
            {CATEGORY_LABELS[node.category]}
          </span>
          <button
            onClick={onClose}
            aria-label="Close detail"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent-gold)',
              fontSize: 'var(--text-base)',
              lineHeight: 1,
              padding: '0 var(--space-1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            ✕
          </button>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            fontWeight: 700,
            color: 'var(--text-base)',
            margin: 0,
          }}
        >
          {node.name}
        </h2>

        {/* Tier badge */}
        <span
          style={{
            display: 'inline-block',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: tierColor,
            backgroundColor: tierBgColor,
            padding: '2px 6px',
            borderRadius: '4px',
            alignSelf: 'flex-start',
          }}
        >
          {node.tierName}
        </span>
      </div>

      {/* Body — adaptive per category */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {node.category === 'agent' && (
          <AgentDetailBody node={node} agentInfoCard={agentInfoCard} />
        )}
        {node.category === 'location' && (
          <LocationDetailBody node={node} graph={graph} />
        )}
        {node.category === 'faction' && (
          <FactionDetailBody node={node} graph={graph} />
        )}
        {node.category === 'army' && (
          <ArmyDetailBody node={node} />
        )}
        {node.category === 'artifact' && (
          <ArtifactDetailBody node={node} />
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 'var(--space-4)',
          paddingTop: 'var(--space-2)',
          backgroundColor: 'var(--bg-deep)',
          borderTop: '1px solid var(--border-gold)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onViewProfile(node.id, node.category)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--accent-gold)',
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-body)',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          View Full Profile →
        </button>
      </div>
    </div>
  );
});

ThreadDetailView.displayName = 'ThreadDetailView';

// ─── Per-category body components ─────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-base)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        fontWeight: 400,
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{label}: </span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function SphereField({ label, sphereName }: { label: string; sphereName: string }) {
  const color = getSphereColor(sphereName);
  return (
    <div
      style={{
        fontSize: 'var(--text-base)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
        fontWeight: 400,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{label}: </span>
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span style={{ color: color, fontWeight: 700, textTransform: 'capitalize' }}>{sphereName}</span>
    </div>
  );
}

// Agent detail body
function AgentDetailBody({
  node,
  agentInfoCard,
}: {
  node: import('../../engine/retinue').ThreadedAgent;
  agentInfoCard?: AgentInfoCardData | null;
}) {
  if (agentInfoCard) {
    return (
      <>
        {/* Domain capabilities grid (2x4) */}
        {agentInfoCard.domains && agentInfoCard.domains.length > 0 && (
          <div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Domains
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2px var(--space-2)',
              }}
            >
              {agentInfoCard.domains.map((dom, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {DOMAIN_NAMES[dom.domain] ?? dom.domain}: {dom.word}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sphere alignment */}
        {agentInfoCard.primarySphere && (
          <SphereField label="Sphere" sphereName={agentInfoCard.primarySphere} />
        )}

        {/* Quintessence */}
        {agentInfoCard.quintessence && (
          <DetailField label="Quintessence" value={agentInfoCard.quintessence} />
        )}

        {/* Current activity */}
        {node.activityLabel && (
          <DetailField label="Activity" value={node.activityLabel} />
        )}
      </>
    );
  }

  // Fallback when no agentInfoCard
  return (
    <>
      {node.locationName && (
        <DetailField label="Location" value={node.locationName} />
      )}
      {node.activityLabel && (
        <DetailField label="Activity" value={node.activityLabel} />
      )}
      {node.factionName && (
        <DetailField label="Faction" value={node.factionName} />
      )}
    </>
  );
}

// Location detail body
function LocationDetailBody({
  node,
  graph,
}: {
  node: import('../../engine/retinue').ThreadedLocation;
  graph?: WorldGraph;
}) {
  // Count agents at location if graph is provided
  let agentNames: string[] = [];
  if (graph) {
    const locEdges = graph.getIncomingEdges(node.id, 'located_at');
    const actorNodes = locEdges
      .map(e => graph.getNode(e.source))
      .filter(n => n && n.type === 'actor' && n.properties?.actorType !== 'ascendant');
    agentNames = actorNodes.slice(0, 3).map(n => n!.name);
    const totalCount = actorNodes.length;
    if (totalCount > 3) {
      agentNames = [...agentNames, `+${totalCount - 3} more`];
    }
  }

  return (
    <>
      {node.prosperityLabel && (
        <DetailField label="Prosperity" value={node.prosperityLabel} />
      )}
      {node.controllingFaction && (
        <DetailField label="Faction" value={node.controllingFaction} />
      )}
      {agentNames.length > 0 && (
        <DetailField label="Agents present" value={agentNames.join(', ')} />
      )}
    </>
  );
}

// Faction detail body — sphere alignment FIRST per CONTEXT.md locked decision
function FactionDetailBody({
  node,
  graph,
}: {
  node: import('../../engine/retinue').ThreadedFaction;
  graph?: WorldGraph;
}) {
  const summary = graph ? getFactionNetworkSummary(graph, node.id) : null;
  const topReaches = summary?.dominantReaches.slice(0, 3) ?? [];
  return (
    <>
      {/* Sphere alignment FIRST per CONTEXT.md locked decision */}
      {node.dominantSphere && (
        <SphereField label="Sphere" sphereName={node.dominantSphere} />
      )}
      {summary?.leader && (
        <DetailField label="Leader" value={summary.leader.name} />
      )}
      {summary?.governingSeats.length ? (
        <DetailField label="Seat" value={summary.governingSeats[0].name} />
      ) : null}
      {node.territoryCount > 0 && (
        <DetailField label="Control" value={`${node.territoryCount} holdings`} />
      )}
      <DetailField label="Members" value={`${summary?.memberCount ?? node.memberCount} members`} />
      {topReaches.length > 0 && (
        <DetailField label="Reaches" value={topReaches.map(reach => DOMAIN_NAMES[reach]).join(', ')} />
      )}
      {summary?.activeAmbition && (
        <DetailField label="Agenda" value={summary.activeAmbition.name} />
      )}
    </>
  );
}

// Army detail body
function ArmyDetailBody({
  node,
}: {
  node: import('../../engine/retinue').ThreadedArmy;
}) {
  return (
    <>
      {node.size > 0 && (
        <DetailField label="Strength" value={`${node.size} strong`} />
      )}
      {node.locationName && (
        <DetailField label="Location" value={node.locationName} />
      )}
      {node.objective && (
        <DetailField label="Objective" value={node.objective} />
      )}
      {node.factionName && (
        <DetailField label="Faction" value={node.factionName} />
      )}
    </>
  );
}

// Artifact detail body
function ArtifactDetailBody({
  node,
}: {
  node: import('../../engine/retinue').ThreadedArtifact;
}) {
  let bearerDisplay: string;
  if (node.bearerName) {
    bearerDisplay = `Carried by ${node.bearerName}`;
  } else if (node.locationName) {
    bearerDisplay = `In ${node.locationName}`;
  } else {
    bearerDisplay = '(location unknown)';
  }

  return (
    <>
      <DetailField label="Bearer" value={bearerDisplay} />
    </>
  );
}
