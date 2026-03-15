/**
 * ScryOverlay — Full-screen divine court visualization and assignment UI.
 *
 * Displays the player's court structure with position slots (Apex/Inner/Outer),
 * sacred site and artifact holdings. Supports agent assignment via a three-step
 * picker (position → agent → title), title proposal viewing, and position demotion.
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
import { useScryContext } from './contexts/ScryContext';

type PickerMode = 'closed' | 'agent' | 'title';

interface PositionSlotProps {
  position: Position;
  onSelect: () => void;
}

const PositionSlot = memo(function PositionSlot(
  { position, onSelect }: PositionSlotProps
) {
  const rankLabel = position.rank.charAt(0).toUpperCase() + position.rank.slice(1);

  if (!position.activeTitle) {
    // Empty slot
    return (
      <button
        onClick={onSelect}
        className="w-full p-3 rounded-lg border transition-all hover:scale-105"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>{rankLabel}</div>
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{position.archetype}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Empty</div>
      </button>
    );
  }

  // Filled slot — non-interactive (one-way investiture)
  if (position.activeTitle) {
    const title = position.activeTitle;
    const sphereColor = title ? getSphereColor(title.sphereAffinity) : '#b4a078';

    return (
      <div
        className="w-full p-3 rounded-lg border text-left"
        style={{
          backgroundColor: 'var(--bg-raised)',
          borderColor: 'var(--border-subtle)',
          borderLeftColor: sphereColor,
          borderLeftWidth: '4px',
        }}
      >
        <div className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>{rankLabel}</div>
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{position.archetype}</div>
        {title && (
          <div>
            <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{title.name}</div>
          </div>
        )}
      </div>
    );
  }

  return null;
});

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
      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
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
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Choose Agent</h3>
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
            {eligible.map(agent => (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent)}
                className="w-full text-left p-3 rounded-lg border transition-all"
                style={{
                  backgroundColor: 'var(--bg-raised)',
                  borderColor: 'var(--border-subtle)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-raised)')}
              >
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{agent.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {agent.tierName} • {agent.locationName}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Top domain: <span className="capitalize">{agent.id.split('.')[0]}</span>
                </div>
              </button>
            ))}
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
}

const PositionSlotWithMenu = memo(
  function PositionSlotWithMenu({
    position,
    contextMenuOpen,
    onSelect,
    onDemote,
    onCloseMenu,
  }: PositionSlotWithMenuProps) {
    return (
      <div>
        <PositionSlot position={position} onSelect={onSelect} />
        {contextMenuOpen && (
          <ContextMenu onDemote={onDemote} onClose={onCloseMenu} />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (no re-render needed)
    return (
      prevProps.position.id === nextProps.position.id &&
      prevProps.position.assignedAgentId === nextProps.position.assignedAgentId &&
      prevProps.position.activeTitle?.id === nextProps.position.activeTitle?.id &&
      prevProps.contextMenuOpen === nextProps.contextMenuOpen &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.onDemote === nextProps.onDemote &&
      prevProps.onCloseMenu === nextProps.onCloseMenu
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
}

const PositionSlotRow = memo(function PositionSlotRow({
  position,
  contextMenuOpen,
  onPositionClick,
  onDemote,
  onCloseMenu,
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
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
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

  // IX-012: Backdrop click handler — close overlay when clicking outside content
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not child content
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
      <div className="w-full max-w-4xl mx-4 py-8" onClick={(e) => e.stopPropagation()}>
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
          className="rounded-lg border p-6 space-y-6"
          style={{
            backgroundColor: 'var(--bg-raised)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Apex */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Apex
            </h2>
            <div className="flex gap-4 justify-center">
              {apexPositions.map(pos => (
                <div key={pos.id} className="w-32">
                  <PositionSlotRow
                    position={pos}
                    contextMenuOpen={contextMenuPositionId === pos.id}
                    onPositionClick={handlePositionClick}
                    onDemote={handleDemote}
                    onCloseMenu={handleCloseContextMenu}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Inner */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Inner Circle
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {innerPositions.map(pos => (
                <div key={pos.id}>
                  <PositionSlotRow
                    position={pos}
                    contextMenuOpen={contextMenuPositionId === pos.id}
                    onPositionClick={handlePositionClick}
                    onDemote={handleDemote}
                    onCloseMenu={handleCloseContextMenu}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Outer */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Outer Reaches
            </h2>
            <div className="grid grid-cols-6 gap-2">
              {outerPositions.map(pos => (
                <div key={pos.id}>
                  <PositionSlotRow
                    position={pos}
                    contextMenuOpen={contextMenuPositionId === pos.id}
                    onPositionClick={handlePositionClick}
                    onDemote={handleDemote}
                    onCloseMenu={handleCloseContextMenu}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sacred Sites & Artifacts */}
          <div className="grid grid-cols-2 gap-6 mt-8">
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
                      borderColor: 'var(--border-subtle)',
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
                      borderColor: 'var(--border-subtle)',
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
            className="p-3 rounded-lg text-xs italic"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
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
