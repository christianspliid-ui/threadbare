import React, { useState } from 'react';
import type { ThreadedNode, ThreadCategory } from '../../engine/retinue';
import { groupThreadedNodes } from '../../engine/retinue';
import type { EncounterTemplate } from '../../types/encounter';
import type { ActiveEncounterDisplay } from './encounterNotificationRuntime';
import { SectionHeading } from '../shared/SectionHeading';
import { IconButton } from '../shared/IconButton';
import { StepDots } from '../shared/StepDots';
import { TIER_COLORS, TIER_COLOR_DEFAULT } from '../../data/uiColorPalette';

// ─── Section config ───────────────────────────────────────────────

const SECTION_ORDER: ThreadCategory[] = ['agent', 'location', 'faction', 'army', 'artifact'];
const SECTION_LABELS: Record<ThreadCategory, string> = {
  agent: 'Agents',
  location: 'Locations',
  faction: 'Factions',
  army: 'Armies',
  artifact: 'Artifacts',
};

// ─── Props ────────────────────────────────────────────────────────

interface ThreadsPanelProps {
  threadedNodes: ThreadedNode[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string, category: ThreadCategory) => void;
  onCenterOnHex: (locationIdOrHexCoords: string) => void;
  onZoomToLocation?: (locationId: string) => void;
  activeEncounters?: Map<string, { encounter: ActiveEncounterDisplay; template: EncounterTemplate }>;
  onEncounterClick?: (agentId: string, encounter: ActiveEncounterDisplay, template: EncounterTemplate) => void;
  onToggleAttentionMode?: (threadEdgeId: string) => void;
}

// ─── Compact row ─────────────────────────────────────────────────

interface CompactThreadRowProps {
  node: ThreadedNode;
  isSelected: boolean;
  onNodeSelect: (nodeId: string, category: ThreadCategory) => void;
  onCenterOnHex: (locationId: string) => void;
  activeEncounters?: Map<string, { encounter: ActiveEncounterDisplay; template: EncounterTemplate }>;
  onEncounterClick?: (agentId: string, encounter: ActiveEncounterDisplay, template: EncounterTemplate) => void;
  onToggleAttentionMode?: (threadEdgeId: string) => void;
}

function CompactThreadRow({
  node,
  isSelected,
  onNodeSelect,
  onCenterOnHex,
  activeEncounters,
  onEncounterClick,
  onToggleAttentionMode,
}: CompactThreadRowProps) {
  const tierColor = TIER_COLORS[node.tier] || TIER_COLOR_DEFAULT;
  const [hovered, setHovered] = useState(false);

  // Derive secondary info line
  let secondaryInfo = '';
  let eyeLocationId: string | null = null;

  if (node.category === 'agent') {
    secondaryInfo = node.locationName + ' \u00b7 ' + node.activityLabel;
    eyeLocationId = node.locationId;
  } else if (node.category === 'location') {
    secondaryInfo = node.controllingFaction
      ? node.controllingFaction + ' \u00b7 ' + node.prosperityLabel
      : node.prosperityLabel;
    eyeLocationId = node.id;
  } else if (node.category === 'faction') {
    const spherePart = node.dominantSphere ? node.dominantSphere + ' sphere \u00b7 ' : '';
    secondaryInfo = spherePart + node.territoryCount + ' hexes \u00b7 ' + node.memberCount + ' members';
    // factions don't have a single location to center on
  } else if (node.category === 'army') {
    secondaryInfo = node.size + ' strong \u00b7 ' + node.objective;
    eyeLocationId = null; // location comes from locationName but we need locationId
  } else if (node.category === 'artifact') {
    if (node.bearerName) {
      secondaryInfo = 'Carried by ' + node.bearerName;
    } else if (node.locationName) {
      secondaryInfo = 'In ' + node.locationName + ' vaults';
    } else {
      secondaryInfo = '(location unknown)';
    }
  }

  // For agents: check for active encounter
  const agentEncounter =
    node.category === 'agent' && activeEncounters
      ? activeEncounters.get(node.id)
      : undefined;

  return (
    <div
      role="listitem"
      aria-selected={isSelected}
      data-testid="thread-entry"
      onClick={() => onNodeSelect(node.id, node.category)}
      className={`rounded cursor-pointer transition-colors duration-150${isSelected ? ' ring-2 ring-amber-400/60' : ''}`}
      style={{
        backgroundColor: isSelected ? 'var(--bg-raised)' : hovered ? 'var(--bg-hover)' : 'var(--bg-raised)',
        borderLeft: `3px solid ${tierColor}`,
        borderTop: isSelected ? '1px solid rgba(212,160,64,0.3)' : '1px solid transparent',
        borderRight: isSelected ? '1px solid rgba(212,160,64,0.3)' : '1px solid transparent',
        borderBottom: isSelected ? '1px solid rgba(212,160,64,0.3)' : '1px solid transparent',
        padding: '4px 8px',
        marginBottom: '2px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Name line + eye icon */}
      <div className="flex items-center justify-between gap-1" style={{ minWidth: 0 }}>
        <span
          className="truncate"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            flex: 1,
            minWidth: 0,
          }}
        >
          {node.name}
        </span>
        {eyeLocationId && (
          <IconButton
            icon={<span>&#x1F441;</span>}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCenterOnHex(eyeLocationId!);
            }}
            aria-label={`Center map on ${node.name}`}
            title={`Center map on ${node.name}`}
            style={{
              border: 'none',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              flexShrink: 0,
              backgroundColor: 'transparent',
            }}
          />
        )}
      </div>

      {/* Secondary info line */}
      {secondaryInfo && (
        <div
          className="truncate"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xs)',
            fontWeight: 400,
            color: 'var(--text-tertiary)',
            lineHeight: 1.2,
          }}
        >
          {secondaryInfo}
        </div>
      )}

      {/* Encounter badge (agents only) */}
      {agentEncounter && onEncounterClick && (
        <button
          className="flex items-center gap-1 mt-0.5 text-left rounded px-1"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold)',
            backgroundColor: 'rgba(212,175,55,0.08)',
            cursor: 'pointer',
            border: 'none',
            padding: '1px 4px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEncounterClick(node.id, agentEncounter.encounter, agentEncounter.template);
          }}
        >
          <span>&#x2694;</span>
          <span className="truncate">{agentEncounter.template.name}</span>
          <StepDots
            total={agentEncounter.template.steps.length}
            current={agentEncounter.encounter.currentStepIndex}
          />
        </button>
      )}

      {/* Attention mode toggle (agents only, court position required) */}
      {node.category === 'agent' && node.courtPosition && onToggleAttentionMode && (
        <button
          className="flex items-center gap-1 mt-0.5 text-left rounded transition-colors"
          style={{
            fontSize: 'var(--text-xs)',
            color: node.attentionMode === 'pause' ? 'var(--accent-gold)' : 'var(--text-tertiary)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none',
            padding: '1px 4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAttentionMode(node.threadEdgeId);
          }}
          aria-label={`Toggle attention mode for ${node.name}`}
          title={node.attentionMode === 'pause'
            ? 'Pause: encounters interrupt the simulation for your decision. Click to switch to Auto.'
            : 'Auto: encounters resolve in the background. Click to switch to Pause.'}
        >
          <span>{node.attentionMode === 'pause' ? '⏸' : '▶'}</span>
          <span>{node.attentionMode === 'pause' ? 'Pause' : 'Auto'}</span>
        </button>
      )}
    </div>
  );
}

// ─── ThreadsPanel ─────────────────────────────────────────────────

export const ThreadsPanel = React.memo(function ThreadsPanel({
  threadedNodes,
  selectedNodeId,
  onNodeSelect,
  onCenterOnHex,
  onZoomToLocation,
  activeEncounters,
  onEncounterClick,
  onToggleAttentionMode,
}: ThreadsPanelProps) {
  // Agents open by default; all other sections collapsed
  const [expandedSections, setExpandedSections] = useState<Record<ThreadCategory, boolean>>({
    agent: true,
    location: false,
    faction: false,
    army: false,
    artifact: false,
  });

  const groups = groupThreadedNodes(threadedNodes);

  const toggleSection = (category: ThreadCategory) => {
    setExpandedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Empty state
  const totalCount = threadedNodes.length;
  if (totalCount === 0) {
    return (
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            padding: 'var(--space-4)',
            paddingBottom: 'var(--space-2)',
          }}
        >
          Threads
        </div>
        <div
          className="italic text-center animate-breathe"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            padding: 'var(--space-4)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>No Threads</div>
          The threads of fate lie still. Intervene in the world to establish connections.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Panel title */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          padding: 'var(--space-4)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        Threads
      </div>

      {/* Sections */}
      {SECTION_ORDER.map((category) => {
        const group = groups[category];
        if (group.length === 0) return null;

        const isExpanded = expandedSections[category];
        const label = SECTION_LABELS[category];
        const chevron = isExpanded ? '\u25BC' : '\u25B6';

        return (
          <div key={category} style={{ marginBottom: 'var(--space-2)' }}>
            {/* Collapsible section header */}
            <div
              className="flex items-center gap-1 cursor-pointer select-none"
              onClick={() => toggleSection(category)}
              style={{ paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)' }}
            >
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                {chevron}
              </span>
              <SectionHeading count={group.length}>{label}</SectionHeading>
            </div>

            {/* Rows (only when expanded) */}
            {isExpanded && (
              <div
                role="list"
                style={{ padding: '2px var(--space-2) 0' }}
              >
                {group.map((node) => (
                  <CompactThreadRow
                    key={node.id}
                    node={node}
                    isSelected={node.id === selectedNodeId}
                    onNodeSelect={onNodeSelect}
                    onCenterOnHex={onCenterOnHex}
                    activeEncounters={activeEncounters}
                    onEncounterClick={onEncounterClick}
                    onToggleAttentionMode={onToggleAttentionMode}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
