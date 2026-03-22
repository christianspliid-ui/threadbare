/**
 * ScryOverlay — Full-screen divine court visualization and assignment UI.
 *
 * Displays the player's court structure with position slots (Apex/Inner/Outer),
 * sacred site and artifact holdings. Supports agent assignment via a three-step
 * picker (position → agent → title), title proposal viewing, and position demotion.
 *
 * Visual features:
 * - Sphere-themed background art based on ascendant's primary sphere
 * - SVG thread connections between court positions in secondary sphere color
 * - Agent portraits in filled slots with domain-colored frames
 */

import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import type { Title, TitleProposal, Position } from '../../types/scry';
import { RANK_MIN_TIER } from '../../types/scry';
import type { SphereName } from '../../types';
import type { RetinueAgent } from '../../engine/retinue';
import {
  getCourtStructureDefinition,
  generateTitleProposals,
  getReassignmentCost,
} from '../../engine/scry';
import type { TitleGenerationParams } from '../../engine/scry';
import { getSphereColor } from '../../data/sphereIcons';
import { DOMAIN_COLORS, DEFAULT_AGENT_COLOR } from '../../data/agent-visual-content';
import { useScryContext } from './contexts/ScryContext';
import { Tooltip } from '../shared/Tooltip';

type PickerMode = 'closed' | 'agent' | 'title';

/** Court background image paths by sphere */
const COURT_BACKGROUNDS: Record<SphereName, string> = {
  force: '/backgrounds/court/force.png',
  matter: '/backgrounds/court/matter.png',
  energy: '/backgrounds/court/energy.png',
  life: '/backgrounds/court/life.png',
  mind: '/backgrounds/court/mind.png',
  spirit: '/backgrounds/court/spirit.png',
  time: '/backgrounds/court/time.png',
  entropy: '/backgrounds/court/entropy.png',
};

/** Slot size constants by rank */
const SLOT_SIZES = {
  apex: { width: 160, height: 224 },
  inner: { width: 128, height: 176 },
  outer: { width: 96, height: 128 },
} as const;

interface PositionSlotProps {
  position: Position;
  onSelect: () => void;
  retinueAgents: RetinueAgent[];
}

const PositionSlot = memo(function PositionSlot(
  { position, onSelect, retinueAgents }: PositionSlotProps
) {
  const rankLabel = position.rank.charAt(0).toUpperCase() + position.rank.slice(1);
  const size = SLOT_SIZES[position.rank];

  if (!position.activeTitle) {
    // Empty slot
    return (
      <button
        onClick={onSelect}
        className="rounded-lg border transition-all hover:scale-105 flex flex-col items-center justify-center"
        style={{
          width: size.width,
          height: size.height,
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-gold)',
        }}
      >
        <Tooltip id={`ui.scry_rank_${position.rank === 'apex' ? 'champion' : position.rank === 'inner' ? 'steward' : 'herald'}`}>
          <div className="text-xs font-bold mb-1 cursor-help" style={{ color: 'var(--text-secondary)' }}>{rankLabel}</div>
        </Tooltip>
        <div className="text-sm px-2 text-center" style={{ color: 'var(--text-primary)' }}>{position.archetype}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Empty</div>
      </button>
    );
  }

  // Filled slot — show portrait with domain-colored frame
  const title = position.activeTitle;
  const agent = retinueAgents.find(a => a.id === position.assignedAgentId);
  const frameColor = agent?.primaryDomain
    ? (DOMAIN_COLORS[agent.primaryDomain] ?? DEFAULT_AGENT_COLOR)
    : DEFAULT_AGENT_COLOR;

  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{
        width: size.width,
        height: size.height,
        border: `3px solid ${frameColor}`,
        boxShadow: `0 0 8px ${frameColor}40`,
      }}
    >
      {/* Portrait image or gradient fallback */}
      {agent?.portraitUrl ? (
        <img
          src={agent.portraitUrl}
          alt={agent.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${frameColor}30, ${frameColor}10, #0a0a0e)`,
          }}
        />
      )}

      {/* Dark gradient scrim at bottom for text readability */}
      <div
        className="absolute bottom-0 left-0 right-0 p-2"
        style={{
          background: 'linear-gradient(transparent, rgba(10, 10, 14, 0.85) 40%)',
        }}
      >
        <Tooltip id={`ui.scry_rank_${position.rank === 'apex' ? 'champion' : position.rank === 'inner' ? 'steward' : 'herald'}`}>
          <div className="text-xs font-bold cursor-help" style={{ color: 'var(--text-secondary)' }}>{rankLabel}</div>
        </Tooltip>
        {title && (
          <div
            className="text-xs mt-0.5 line-clamp-2 font-bold"
            style={{ color: frameColor }}
          >
            {title.name}
          </div>
        )}
        {agent && (
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
            {agent.name}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * SVG thread connections between court positions — tree hierarchy.
 * Draws curved bezier paths from Apex → Inner → Outer.
 */
function CourtThreads({ threadColor }: { threadColor: string }) {
  // Layout constants matching the grid layout
  // Apex: 1 slot centered
  // Inner: 3 slots evenly spaced
  // Outer: 6 slots evenly spaced
  const containerWidth = 800;

  // Vertical positions (approximate center of each row)
  const apexY = 112;
  const innerY = 300;
  const outerY = 470;

  // Horizontal positions
  const apexX = containerWidth / 2;
  const innerXs = [containerWidth * 0.2, containerWidth * 0.5, containerWidth * 0.8];
  const outerXs = Array.from({ length: 6 }, (_, i) => containerWidth * ((i + 0.5) / 6));

  const paths: string[] = [];

  // Apex → Inner connections
  for (const ix of innerXs) {
    const cp1y = apexY + (innerY - apexY) * 0.4;
    const cp2y = apexY + (innerY - apexY) * 0.6;
    paths.push(`M ${apexX} ${apexY} C ${apexX} ${cp1y}, ${ix} ${cp2y}, ${ix} ${innerY}`);
  }

  // Inner → Outer connections (each inner connects to 2 outer)
  for (let i = 0; i < 3; i++) {
    const ix = innerXs[i];
    const o1 = outerXs[i * 2];
    const o2 = outerXs[i * 2 + 1];
    const cp1y = innerY + (outerY - innerY) * 0.4;
    const cp2y = innerY + (outerY - innerY) * 0.6;
    paths.push(`M ${ix} ${innerY} C ${ix} ${cp1y}, ${o1} ${cp2y}, ${o1} ${outerY}`);
    paths.push(`M ${ix} ${innerY} C ${ix} ${cp1y}, ${o2} ${cp2y}, ${o2} ${outerY}`);
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${containerWidth} 560`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', opacity: 0.5 }}
    >
      <defs>
        <filter id="thread-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={threadColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          filter="url(#thread-glow)"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

interface ContextMenuProps {
  onDemote: () => void;
  onClose: () => void;
}

const ContextMenu = memo(function ContextMenu({
  onDemote,
  onClose,
}: ContextMenuProps) {
  return (
    <div
      className="absolute border rounded-lg shadow-lg z-40"
      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-gold)' }}
    >
      <button
        onClick={() => {
          onDemote();
          onClose();
        }}
        className="block w-full text-left px-3 py-2 text-sm transition"
        style={{ color: 'var(--text-primary)', backgroundColor: 'transparent' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        Demote
      </button>
    </div>
  );
});

interface AgentPickerPanelProps {
  position: Position;
  agents: RetinueAgent[];
  minTier: number;
  assignedAgentIds: Set<string>;
  onSelectAgent: (agent: RetinueAgent) => void;
  onClose: () => void;
}

const AgentPickerPanel = memo(function AgentPickerPanel({
  position,
  agents,
  minTier,
  assignedAgentIds,
  onSelectAgent,
  onClose,
}: AgentPickerPanelProps) {
  const eligible = agents.filter(a => a.tier >= minTier && !assignedAgentIds.has(a.id));

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: 'rgba(10, 10, 14, 0.6)' }}>
      <div
        className="border rounded-xl p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-gold)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <Tooltip id="ui.scry_assign">
            <h3 className="text-lg font-bold cursor-help" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Choose Agent</h3>
          </Tooltip>
          <button
            onClick={onClose}
            aria-label="Close Agent Picker"
            title="Close (Esc)"
            className="text-xl"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ✕
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
          Position: <span style={{ color: 'var(--text-primary)' }}>{position.archetype}</span>
          <br />
          Minimum tier: <span style={{ color: 'var(--text-primary)' }}>{minTier}</span>
        </p>

        {eligible.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No eligible agents available.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {eligible.map(agent => {
              const domainColor = agent.primaryDomain
                ? (DOMAIN_COLORS[agent.primaryDomain] ?? DEFAULT_AGENT_COLOR)
                : DEFAULT_AGENT_COLOR;
              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  className="w-full text-left p-3 rounded-lg border transition-all flex gap-3 items-center"
                  style={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-gold)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-raised)')}
                >
                  {/* Mini portrait */}
                  <div
                    className="w-10 h-14 rounded overflow-hidden flex-shrink-0"
                    style={{ border: `2px solid ${domainColor}` }}
                  >
                    {agent.portraitUrl ? (
                      <img src={agent.portraitUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${domainColor}30, #0a0a0e)` }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {agent.tierName} • {agent.locationName}
                    </div>
                    {agent.primaryDomain && (
                      <div className="text-xs mt-0.5 capitalize" style={{ color: domainColor }}>
                        {agent.primaryDomain}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

interface PositionSlotWithMenuProps {
  position: Position;
  contextMenuOpen: boolean;
  onSelect: () => void;
  onDemote: () => void;
  onCloseMenu: () => void;
  retinueAgents: RetinueAgent[];
}

const PositionSlotWithMenu = memo(
  function PositionSlotWithMenu({
    position,
    contextMenuOpen,
    onSelect,
    onDemote,
    onCloseMenu,
    retinueAgents,
  }: PositionSlotWithMenuProps) {
    return (
      <div>
        <PositionSlot position={position} onSelect={onSelect} retinueAgents={retinueAgents} />
        {contextMenuOpen && (
          <ContextMenu onDemote={onDemote} onClose={onCloseMenu} />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.position.id === nextProps.position.id &&
      prevProps.position.assignedAgentId === nextProps.position.assignedAgentId &&
      prevProps.position.activeTitle?.id === nextProps.position.activeTitle?.id &&
      prevProps.contextMenuOpen === nextProps.contextMenuOpen &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.onDemote === nextProps.onDemote &&
      prevProps.onCloseMenu === nextProps.onCloseMenu &&
      prevProps.retinueAgents === nextProps.retinueAgents
    );
  }
);

interface TitlePickerPanelProps {
  agent: RetinueAgent;
  proposals: TitleProposal[];
  reassignmentCost: number;
  onSelectTitle: (title: Title) => void;
  onBack: () => void;
}

interface PositionSlotRowProps {
  position: Position;
  contextMenuOpen: boolean;
  onPositionClick: (positionId: string) => void;
  onDemote: () => void;
  onCloseMenu: () => void;
  retinueAgents: RetinueAgent[];
}

const PositionSlotRow = memo(function PositionSlotRow({
  position,
  contextMenuOpen,
  onPositionClick,
  onDemote,
  onCloseMenu,
  retinueAgents,
}: PositionSlotRowProps) {
  const handleSelect = useCallback(() => {
    onPositionClick(position.id);
  }, [position.id, onPositionClick]);

  return (
    <PositionSlotWithMenu
      position={position}
      contextMenuOpen={contextMenuOpen}
      onSelect={handleSelect}
      onDemote={onDemote}
      onCloseMenu={onCloseMenu}
      retinueAgents={retinueAgents}
    />
  );
});

const TitlePickerPanel = memo(function TitlePickerPanel({
  agent,
  proposals,
  reassignmentCost,
  onSelectTitle,
  onBack,
}: TitlePickerPanelProps) {
  const { essencePool, primarySphere } = useScryContext();
  const canAfford = essencePool[primarySphere] >= reassignmentCost;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: 'rgba(10, 10, 14, 0.6)' }}>
      <div
        className="border rounded-xl p-6 max-w-2xl w-full mx-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-gold)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Select Title for {agent.name}</h3>
          <button
            onClick={onBack}
            aria-label="Back to Agent Picker"
            title="Back"
            className="text-xl"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ←
          </button>
        </div>

        <div className="mb-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Cost: <span style={{ color: 'var(--text-primary)' }}>{Math.ceil(reassignmentCost)}</span>{' '}
          <span className="capitalize">{primarySphere}</span> essence
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {proposals.map((proposal, idx) => {
            const title = proposal.title;
            const sphereColor = getSphereColor(title.sphereAffinity);

            return (
              <button
                key={idx}
                onClick={() => onSelectTitle(title)}
                disabled={!canAfford}
                className={`text-left p-3 rounded-lg border transition-all ${
                  !canAfford ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: 'var(--bg-raised)',
                  borderColor: sphereColor + '40',
                }}
              >
                <div
                  className="text-sm font-bold mb-1 line-clamp-2"
                  style={{ color: sphereColor }}
                >
                  {title.name}
                </div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{proposal.rationale}</div>
                {title.bonuses.length > 0 && (
                  <div className="text-xs mb-1" style={{ color: 'var(--positive)' }}>
                    {title.bonuses.length} bonus{title.bonuses.length > 1 ? 'es' : ''}
                  </div>
                )}
                {title.weaknesses.length > 0 && (
                  <div className="text-xs" style={{ color: 'var(--negative)' }}>
                    {title.weaknesses.length} weakness{title.weaknesses.length > 1 ? 'es' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!canAfford && (
          <div className="mt-4 text-xs" style={{ color: 'var(--negative)' }}>
            Insufficient {primarySphere} essence. Required: {Math.ceil(reassignmentCost)}, Available:{' '}
            {Math.floor(essencePool[primarySphere])}
          </div>
        )}
      </div>
    </div>
  );
});

export function ScryOverlay() {
  const {
    scryState,
    retinueAgents,
    essencePool,
    primarySphere,
    secondarySphere,
    seed,
    onAssign,
    onDemote,
    onClose,
  } = useScryContext();

  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('closed');
  const [selectedAgentForAssignment, setSelectedAgentForAssignment] = useState<RetinueAgent | null>(
    null
  );
  const [titleProposals, setTitleProposals] = useState<TitleProposal[] | null>(null);
  const [contextMenuPositionId, setContextMenuPositionId] = useState<string | null>(null);

  // IX-005: Track retinue agent IDs to detect when assigned agents leave
  const retinueIds = useMemo(() => new Set(retinueAgents.map(a => a.id)), [retinueAgents]);

  // IX-005: Validate that all assigned agents still exist in retinue
  useEffect(() => {
    for (const pos of scryState.positions) {
      if (pos.assignedAgentId && !retinueIds.has(pos.assignedAgentId)) {
        // Agent no longer in retinue — auto-demote
        onDemote(pos.id);
      }
    }
  }, [retinueIds, scryState.positions, onDemote]);

  // IX-012: Handle Escape key to close overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pickerMode !== 'closed') {
          setPickerMode('closed');
          setSelectedPositionId(null);
          setSelectedAgentForAssignment(null);
          setTitleProposals(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pickerMode, onClose]);

  const structDef = getCourtStructureDefinition(scryState.courtStructureType);
  if (!structDef) {
    return null;
  }

  const handlePositionClick = useCallback(
    (positionId: string) => {
      const position = scryState.positions.find(p => p.id === positionId);
      if (!position) return;

      if (!position.assignedAgentId) {
        // Open agent picker for empty position only (one-way investiture)
        setSelectedPositionId(positionId);
        setPickerMode('agent');
        setContextMenuPositionId(null);
      }
    },
    [scryState.positions, contextMenuPositionId]
  );

  const handleSelectAgent = useCallback(
    (agent: RetinueAgent) => {
      const position = scryState.positions.find(p => p.id === selectedPositionId);
      if (!position) return;

      setSelectedAgentForAssignment(agent);

      // Generate title proposals
      const params: TitleGenerationParams = {
        agent,
        positionRank: position.rank,
        structureType: scryState.courtStructureType,
        positionArchetype: position.archetype,
        primarySphere,
        seed: seed + agent.id.charCodeAt(0),
      };

      const usedIds = new Set(scryState.usedTitleIds);
      const proposals = generateTitleProposals(params).filter(
        p => !usedIds.has(p.title.id)
      );
      setTitleProposals(proposals);
      setPickerMode('title');
    },
    [selectedPositionId, scryState, primarySphere, seed]
  );

  const handleSelectTitle = useCallback(
    (title: Title) => {
      if (!selectedPositionId || !selectedAgentForAssignment) return;

      const position = scryState.positions.find(p => p.id === selectedPositionId);
      if (!position) return;

      const cost = getReassignmentCost(position.rank, scryState.totalReassignmentCount);

      onAssign(selectedPositionId, selectedAgentForAssignment.id, title, cost);

      // Reset picker
      setSelectedPositionId(null);
      setPickerMode('closed');
      setSelectedAgentForAssignment(null);
      setTitleProposals(null);
      setContextMenuPositionId(null);
    },
    [selectedPositionId, selectedAgentForAssignment, scryState, onAssign]
  );

  const handleDemote = useCallback(() => {
    if (!contextMenuPositionId) return;
    onDemote(contextMenuPositionId);
    setContextMenuPositionId(null);
  }, [contextMenuPositionId, onDemote]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuPositionId(null);
  }, []);

  const apexPositions = scryState.positions.filter(p => p.rank === 'apex');
  const innerPositions = scryState.positions.filter(p => p.rank === 'inner');
  const outerPositions = scryState.positions.filter(p => p.rank === 'outer');

  const minTierForSelectedPosition = selectedPositionId
    ? RANK_MIN_TIER[scryState.positions.find(p => p.id === selectedPositionId)?.rank || 'outer']
    : 1;

  const assignedAgentIds = useMemo(
    () => new Set(scryState.positions.map(p => p.assignedAgentId).filter(Boolean) as string[]),
    [scryState.positions]
  );

  // Thread color from secondary sphere
  const threadColor = getSphereColor(secondarySphere);

  // Background image from primary sphere
  const bgImage = COURT_BACKGROUNDS[primarySphere];

  // IX-012: Backdrop click handler — close overlay when clicking outside content
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      style={{
        backgroundColor: 'rgba(10, 10, 14, 0.95)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'auto',
      }}
      onClick={handleBackdropClick}
    >
      {/* Sphere-themed background image */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.15, mixBlendMode: 'screen' }}
        loading="eager"
      />

      <div className="w-full max-w-4xl mx-4 py-8 relative" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-6">
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>✦</div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Divine Court
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{structDef.name}</p>
            <p className="text-xs italic mt-1" style={{ color: 'var(--text-tertiary)' }}>{structDef.flavorText}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Divine Court"
            title="Close (Esc)"
            className="transition text-2xl"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ✕
          </button>
        </div>

        <div
          className="rounded-lg border p-6 space-y-6 relative"
          style={{
            backgroundColor: 'rgba(20, 18, 15, 0.85)',
            borderColor: 'var(--border-gold)',
          }}
        >
          {/* SVG thread connections behind position slots */}
          <CourtThreads threadColor={threadColor} />

          {/* FE-TT-15: Apex with tooltip */}
          <div className="relative z-10">
            <Tooltip id="ui.scry_rank_champion">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 cursor-help text-center" style={{ color: 'var(--text-secondary)' }}>
                Apex
              </h2>
            </Tooltip>
            <div className="flex gap-4 justify-center">
              {apexPositions.map(pos => (
                <div key={pos.id}>
                  <PositionSlotRow
                    position={pos}
                    contextMenuOpen={contextMenuPositionId === pos.id}
                    onPositionClick={handlePositionClick}
                    onDemote={handleDemote}
                    onCloseMenu={handleCloseContextMenu}
                    retinueAgents={retinueAgents}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FE-TT-15: Inner with tooltip */}
          <div className="relative z-10">
            <Tooltip id="ui.scry_rank_steward">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 cursor-help text-center" style={{ color: 'var(--text-secondary)' }}>
                Inner Circle
              </h2>
            </Tooltip>
            <div className="flex gap-4 justify-center">
              {innerPositions.map(pos => (
                <div key={pos.id}>
                  <PositionSlotRow
                    position={pos}
                    contextMenuOpen={contextMenuPositionId === pos.id}
                    onPositionClick={handlePositionClick}
                    onDemote={handleDemote}
                    onCloseMenu={handleCloseContextMenu}
                    retinueAgents={retinueAgents}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FE-TT-15: Outer with tooltip */}
          <div className="relative z-10">
            <Tooltip id="ui.scry_rank_herald">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 cursor-help text-center" style={{ color: 'var(--text-secondary)' }}>
                Outer Reaches
              </h2>
            </Tooltip>
            <div className="flex gap-3 justify-center flex-wrap">
              {outerPositions.map(pos => (
                <div key={pos.id}>
                  <PositionSlotRow
                    position={pos}
                    contextMenuOpen={contextMenuPositionId === pos.id}
                    onPositionClick={handlePositionClick}
                    onDemote={handleDemote}
                    onCloseMenu={handleCloseContextMenu}
                    retinueAgents={retinueAgents}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sacred Sites & Artifacts */}
          <div className="grid grid-cols-2 gap-6 mt-8 relative z-10">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                Sacred Sites
              </h2>
              <div className="space-y-2">
                {scryState.sacredSites.slice(0, 2).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-center text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-gold)',
                      border: '1px solid',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    ◇ Coming Soon
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                Divine Artifacts
              </h2>
              <div className="space-y-2">
                {scryState.artifacts.slice(0, 2).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-center text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-gold)',
                      border: '1px solid',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    ◇ Coming Soon
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Structure Bonus */}
          <div
            className="p-3 rounded-lg text-xs italic relative z-10"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-gold)',
              border: '1px solid',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="font-bold">Structure Bonus:</span> {structDef.structureBonus.description}
          </div>
        </div>
      </div>

      {/* Pickers */}
      {pickerMode === 'agent' && selectedPositionId && (
        <AgentPickerPanel
          position={scryState.positions.find(p => p.id === selectedPositionId)}
          agents={retinueAgents}
          minTier={minTierForSelectedPosition}
          assignedAgentIds={assignedAgentIds}
          onSelectAgent={handleSelectAgent}
          onClose={() => {
            setPickerMode('closed');
            setSelectedPositionId(null);
          }}
        />
      )}

      {pickerMode === 'title' && selectedAgentForAssignment && titleProposals && selectedPositionId && (
        <TitlePickerPanel
          agent={selectedAgentForAssignment}
          proposals={titleProposals}
          reassignmentCost={getReassignmentCost(
            scryState.positions.find(p => p.id === selectedPositionId)?.rank || 'outer',
            scryState.totalReassignmentCount
          )}
          onSelectTitle={handleSelectTitle}
          onBack={() => {
            setPickerMode('agent');
            setSelectedAgentForAssignment(null);
            setTitleProposals(null);
          }}
        />
      )}
    </div>
  );
}
