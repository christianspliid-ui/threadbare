/**
 * ScryOverlay — Full-screen divine court visualization and assignment UI.
 *
 * Displays the player's court structure with position slots (Apex/Inner/Outer),
 * sacred site and artifact holdings. Supports agent assignment via a three-step
 * picker (position → agent → title), title proposal viewing, and position demotion.
 */

import { useState, useCallback } from 'react';
import type { ScryState, Title, TitleProposal } from '../../types/scry';
import { RANK_MIN_TIER } from '../../types/scry';
import type { SphereName } from '../../types';
import type { EssencePool } from '../../types/influence';
import type { RetinueAgent } from '../../engine/retinue';
import {
  getCourtStructureDefinition,
  generateTitleProposals,
  getReassignmentCost,
} from '../../engine/scry';
import type { TitleGenerationParams } from '../../engine/scry';

interface ScryOverlayProps {
  scryState: ScryState;
  retinueAgents: RetinueAgent[];
  essencePool: EssencePool;
  primarySphere: SphereName;
  tick: number;
  seed: number;
  onAssign: (positionId: string, agentId: string, title: Title, cost: number) => void;
  onDemote: (positionId: string) => void;
  onClose: () => void;
}

type PickerMode = 'closed' | 'agent' | 'title';

const SPHERE_COLORS: Record<SphereName, string> = {
  force: '#d4a574',
  matter: '#9d7b5a',
  energy: '#e87534',
  life: '#7cb342',
  mind: '#9c27b0',
  spirit: '#5c6bc0',
  time: '#00bcd4',
  entropy: '#b71c1c',
};

function PositionSlot({
  position,
  onSelect,
}: {
  position: any;
  onSelect: () => void;
}) {
  const rankLabel = position.rank.charAt(0).toUpperCase() + position.rank.slice(1);

  if (!position.activeTitle) {
    // Empty slot
    return (
      <button
        onClick={onSelect}
        className="w-full p-3 rounded-lg border transition-all hover:scale-105"
        style={{
          backgroundColor: 'rgba(30, 24, 18, 0.6)',
          borderColor: 'rgba(180, 160, 120, 0.15)',
        }}
      >
        <div className="text-xs font-bold text-amber-200/70 mb-1">{rankLabel}</div>
        <div className="text-sm text-amber-100">{position.archetype}</div>
        <div className="text-xs text-amber-200/40 mt-1">Empty</div>
      </button>
    );
  }

  // Filled slot
  if (position.activeTitle) {
    const title = position.activeTitle;
    const sphereColor = title ? SPHERE_COLORS[title.sphereAffinity as SphereName] || '#b4a078' : '#b4a078';

    return (
      <button
        onClick={onSelect}
        className="w-full p-3 rounded-lg border transition-all hover:scale-105 text-left"
        style={{
          backgroundColor: 'rgba(30, 24, 18, 0.8)',
          borderColor: 'rgba(180, 160, 120, 0.15)',
          borderLeftColor: sphereColor,
          borderLeftWidth: '4px',
        }}
      >
        <div className="text-xs font-bold text-amber-200/70 mb-1">{rankLabel}</div>
        <div className="text-sm text-amber-100">{position.archetype}</div>
        {title && (
          <div>
            <div className="text-xs text-amber-200/60 mt-1 line-clamp-2">{title.name}</div>
          </div>
        )}
      </button>
    );
  }

  return null;
}

function ContextMenu({
  onDemote,
  onClose,
}: {
  onDemote: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute bg-stone-800 border rounded-lg shadow-lg z-40"
      style={{ borderColor: 'rgba(180, 160, 120, 0.2)' }}
    >
      <button
        onClick={() => {
          onDemote();
          onClose();
        }}
        className="block w-full text-left px-3 py-2 text-sm text-amber-200 hover:bg-stone-700/50 transition"
      >
        Demote
      </button>
    </div>
  );
}

function AgentPickerPanel({
  position,
  agents,
  minTier,
  onSelectAgent,
  onClose,
}: {
  position: any;
  agents: RetinueAgent[];
  minTier: number;
  onSelectAgent: (agent: RetinueAgent) => void;
  onClose: () => void;
}) {
  const eligible = agents.filter(a => a.tier >= minTier);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
      <div
        className="bg-stone-900 border rounded-xl p-6 max-w-md w-full mx-4"
        style={{ borderColor: 'rgba(180, 160, 120, 0.2)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-amber-100">Choose Agent</h3>
          <button
            onClick={onClose}
            aria-label="close picker"
            className="text-amber-200/50 hover:text-amber-200 text-xl"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-amber-200/50 mb-4">
          Position: <span className="text-amber-100">{position.archetype}</span>
          <br />
          Minimum tier: <span className="text-amber-100">{minTier}</span>
        </p>

        {eligible.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-amber-200/50">No eligible agents available.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {eligible.map(agent => (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent)}
                className="w-full text-left p-3 rounded-lg border transition-all hover:bg-stone-700/50"
                style={{
                  backgroundColor: 'rgba(30, 24, 18, 0.6)',
                  borderColor: 'rgba(180, 160, 120, 0.15)',
                }}
              >
                <div className="text-sm font-bold text-amber-100">{agent.name}</div>
                <div className="text-xs text-amber-200/60 mt-0.5">
                  {agent.tierName} • {agent.locationName}
                </div>
                <div className="text-xs text-amber-200/40 mt-1">
                  Top domain: <span className="capitalize">{agent.id.split('.')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TitlePickerPanel({
  agent,
  proposals,
  essencePool,
  reassignmentCost,
  primarySphere,
  onSelectTitle,
  onBack,
}: {
  agent: RetinueAgent;
  proposals: TitleProposal[];
  essencePool: EssencePool;
  reassignmentCost: number;
  primarySphere: SphereName;
  onSelectTitle: (title: Title) => void;
  onBack: () => void;
}) {
  const canAfford = essencePool[primarySphere] >= reassignmentCost;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
      <div
        className="bg-stone-900 border rounded-xl p-6 max-w-2xl w-full mx-4"
        style={{ borderColor: 'rgba(180, 160, 120, 0.2)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-amber-100">Select Title for {agent.name}</h3>
          <button
            onClick={onBack}
            aria-label="back to agent picker"
            className="text-amber-200/50 hover:text-amber-200 text-xl"
          >
            ←
          </button>
        </div>

        <div className="mb-4 text-xs text-amber-200/50">
          Cost: <span className="text-amber-100">{Math.ceil(reassignmentCost)}</span>{' '}
          <span className="capitalize">{primarySphere}</span> essence
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {proposals.map((proposal, idx) => {
            const title = proposal.title;
            const sphereColor = SPHERE_COLORS[title.sphereAffinity];

            return (
              <button
                key={idx}
                onClick={() => onSelectTitle(title)}
                disabled={!canAfford}
                className={`text-left p-3 rounded-lg border transition-all ${
                  !canAfford ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: 'rgba(30, 24, 18, 0.6)',
                  borderColor: sphereColor + '40',
                }}
              >
                <div
                  className="text-sm font-bold mb-1 line-clamp-2"
                  style={{ color: sphereColor }}
                >
                  {title.name}
                </div>
                <div className="text-xs text-amber-200/60 mb-1">{proposal.rationale}</div>
                {title.bonuses.length > 0 && (
                  <div className="text-xs text-green-400/80 mb-1">
                    {title.bonuses.length} bonus{title.bonuses.length > 1 ? 'es' : ''}
                  </div>
                )}
                {title.weaknesses.length > 0 && (
                  <div className="text-xs text-red-400/80">
                    {title.weaknesses.length} weakness{title.weaknesses.length > 1 ? 'es' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!canAfford && (
          <div className="mt-4 text-xs text-red-400/70">
            Insufficient {primarySphere} essence. Required: {Math.ceil(reassignmentCost)}, Available:{' '}
            {Math.floor(essencePool[primarySphere])}
          </div>
        )}
      </div>
    </div>
  );
}

export function ScryOverlay({
  scryState,
  retinueAgents,
  essencePool,
  primarySphere,
  seed,
  onAssign,
  onDemote,
  onClose,
}: ScryOverlayProps) {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('closed');
  const [selectedAgentForAssignment, setSelectedAgentForAssignment] = useState<RetinueAgent | null>(
    null
  );
  const [titleProposals, setTitleProposals] = useState<TitleProposal[] | null>(null);
  const [contextMenuPositionId, setContextMenuPositionId] = useState<string | null>(null);

  const structDef = getCourtStructureDefinition(scryState.courtStructureType);
  if (!structDef) {
    return null;
  }

  const handlePositionClick = useCallback(
    (positionId: string) => {
      const position = scryState.positions.find(p => p.id === positionId);
      if (!position) return;

      if (position.assignedAgentId) {
        // Show context menu for filled position
        setContextMenuPositionId(contextMenuPositionId === positionId ? null : positionId);
      } else {
        // Open agent picker for empty position
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

      const proposals = generateTitleProposals(params);
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

  const apexPositions = scryState.positions.filter(p => p.rank === 'apex');
  const innerPositions = scryState.positions.filter(p => p.rank === 'inner');
  const outerPositions = scryState.positions.filter(p => p.rank === 'outer');

  const minTierForSelectedPosition = selectedPositionId
    ? RANK_MIN_TIER[scryState.positions.find(p => p.id === selectedPositionId)?.rank || 'outer']
    : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      style={{
        backgroundColor: 'rgba(10, 8, 6, 0.95)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'auto',
      }}
    >
      <div className="w-full max-w-4xl mx-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-6">
          <div>
            <div className="text-xs text-amber-200/50 uppercase tracking-widest mb-1">✦</div>
            <h1 className="text-3xl font-bold text-amber-100" style={{ fontFamily: 'Cinzel, serif' }}>
              The Scry
            </h1>
            <p className="text-sm text-amber-200/60 mt-1">{structDef.name}</p>
            <p className="text-xs text-amber-200/40 italic mt-1">{structDef.flavorText}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            className="text-amber-200/50 hover:text-amber-200 transition text-2xl"
          >
            ✕
          </button>
        </div>

        <div
          className="rounded-lg border p-6 space-y-6"
          style={{
            backgroundColor: 'rgba(20, 15, 10, 0.8)',
            borderColor: 'rgba(180, 160, 120, 0.15)',
          }}
        >
          {/* Apex */}
          <div>
            <h2 className="text-sm font-bold text-amber-200/70 uppercase tracking-wider mb-3">
              Apex
            </h2>
            <div className="flex gap-4 justify-center">
              {apexPositions.map(pos => (
                <div key={pos.id} className="w-32">
                  <PositionSlot
                    position={pos}
                    onSelect={() => handlePositionClick(pos.id)}
                  />
                  {contextMenuPositionId === pos.id && (
                    <ContextMenu
                      onDemote={handleDemote}
                      onClose={() => setContextMenuPositionId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inner */}
          <div>
            <h2 className="text-sm font-bold text-amber-200/70 uppercase tracking-wider mb-3">
              Inner Circle
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {innerPositions.map(pos => (
                <div key={pos.id}>
                  <PositionSlot
                    position={pos}
                    onSelect={() => handlePositionClick(pos.id)}
                  />
                  {contextMenuPositionId === pos.id && (
                    <ContextMenu
                      onDemote={handleDemote}
                      onClose={() => setContextMenuPositionId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Outer */}
          <div>
            <h2 className="text-sm font-bold text-amber-200/70 uppercase tracking-wider mb-3">
              Outer Reaches
            </h2>
            <div className="grid grid-cols-6 gap-2">
              {outerPositions.map(pos => (
                <div key={pos.id}>
                  <PositionSlot
                    position={pos}
                    onSelect={() => handlePositionClick(pos.id)}
                  />
                  {contextMenuPositionId === pos.id && (
                    <ContextMenu
                      onDemote={handleDemote}
                      onClose={() => setContextMenuPositionId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sacred Sites & Artifacts */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div>
              <h2 className="text-sm font-bold text-amber-200/70 uppercase tracking-wider mb-3">
                Sacred Sites
              </h2>
              <div className="space-y-2">
                {scryState.sacredSites.slice(0, 2).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-center text-xs text-amber-200/50"
                    style={{
                      backgroundColor: 'rgba(30, 24, 18, 0.4)',
                      borderColor: 'rgba(180, 160, 120, 0.1)',
                      border: '1px solid',
                    }}
                  >
                    ◇ Coming Soon
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-amber-200/70 uppercase tracking-wider mb-3">
                Divine Artifacts
              </h2>
              <div className="space-y-2">
                {scryState.artifacts.slice(0, 2).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg text-center text-xs text-amber-200/50"
                    style={{
                      backgroundColor: 'rgba(30, 24, 18, 0.4)',
                      borderColor: 'rgba(180, 160, 120, 0.1)',
                      border: '1px solid',
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
            className="p-3 rounded-lg text-xs text-amber-200/60 italic"
            style={{
              backgroundColor: 'rgba(30, 24, 18, 0.4)',
              borderColor: 'rgba(180, 160, 120, 0.1)',
              border: '1px solid',
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
          essencePool={essencePool}
          reassignmentCost={getReassignmentCost(
            scryState.positions.find(p => p.id === selectedPositionId)?.rank || 'outer',
            scryState.totalReassignmentCount
          )}
          primarySphere={primarySphere}
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
