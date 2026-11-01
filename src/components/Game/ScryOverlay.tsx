/**
 * ScryOverlay — the Divine Court: an L dialog (THR-1880, Law 57) with the court's
 * name, flavour and art in the left column and its seats in the right.
 *
 * Displays the player's court structure with position slots (Apex/Inner/Outer),
 * sacred site and artifact holdings. Supports agent assignment via a three-step
 * picker (position → agent → title), title proposal viewing, and position demotion.
 * Each picker is a view in the right column, not a box over the court: "Back to the
 * court" or Escape returns to the seats, and a second Escape closes the court.
 *
 * Visual features:
 * - Sphere-themed court art (16:9, the left column) from the ascendant's primary sphere
 * - SVG thread connections between court positions in secondary sphere color
 * - Agent portraits in filled slots with domain-colored frames
 */

import { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
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
import { formatEssencePool } from '../shared/formatEssence';
import { Modal } from '../shared/Modal';
import { SheetColumns } from '../shared/SheetColumns';
import { Button } from '../shared/Button';
import { SCRY_BACK_TO_COURT_LABEL, COURT_WORDS, fillCourtWords } from '../../data/ui-content';
import { TITLE_BONUS_WORDS, TITLE_CHIP_TOOLTIPS } from '../../data/scry-content';
import { TIER_NAMES } from '../../data/influence-content';
import type { InfluenceTier } from '../../types/influence';
import { dialogHeadingIcon } from '../../data/view-content';
import { EntityVisual } from '../shared/EntityVisual';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';
import { Icon } from '../shared/Icon';
import { QuietSlot } from '../shared/QuietSlot';
import { Chip } from '../shared/Chip';

/**
 * THR-2101 (decision 3) — a seat's face through the one face path, filling its frame. The
 * descriptor comes from the dialog host (`ScryContext.faces`); none → the frame stays empty.
 */
function SeatFace({ face }: { face: EntityVisualDescriptor | undefined }) {
  if (!face) return null;
  return (
    <div data-dialog-face={face.tier} className="absolute inset-0">
      <EntityVisual size="portrait" shape="rounded" descriptor={face} style={{ height: '100%', aspectRatio: 'auto', borderRadius: 0, border: 'none' }} />
    </div>
  );
}

/** "Top 3 positions…" → "top 3 positions…", for the bonus sentence's middle. */
function lowerFirst(text: string): string {
  return text.length > 0 ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/** A heading's carved shape (THR-2101, S5.2), or nothing when the heading has no idea yet. */
function HeadingShape({ name }: { name: ReturnType<typeof dialogHeadingIcon> }) {
  if (!name) return null;
  return (
    <span data-dialog-heading-icon={name} style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 6 }}>
      <Icon name={name} size="floor" decorative />
    </span>
  );
}

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
  onAgentClick?: (agentId: string) => void;
  retinueAgents: RetinueAgent[];
}

const PositionSlot = memo(function PositionSlot(
  { position, onSelect, onAgentClick, retinueAgents }: PositionSlotProps
) {
  const { faces } = useScryContext();
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
    <button
      onClick={() => agent && onAgentClick?.(agent.id)}
      className="rounded-lg overflow-hidden relative transition-all hover:scale-105 hover:brightness-110"
      style={{
        width: size.width,
        height: size.height,
        border: `3px solid ${frameColor}`,
        boxShadow: `0 0 8px ${frameColor}40`,
        cursor: 'pointer',
      }}
    >
      {/* The seat's face through the one face path (THR-2101) — the designed tile when unpainted */}
      <SeatFace face={agent ? faces?.[agent.id] : undefined} />

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
    </button>
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
  const { faces } = useScryContext();
  const eligible = agents.filter(a => a.tier >= minTier && !assignedAgentIds.has(a.id));
  const tierWord = TIER_NAMES[minTier as InfluenceTier] ?? TIER_NAMES[1];

  return (
    <div
      data-testid="scry-agent-picker"
      className="border rounded-xl p-6"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-gold)' }}
    >
        <div className="flex items-center justify-between mb-4">
          <Tooltip id="ui.scry_assign">
            <h3 className="text-lg font-bold cursor-help" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Choose Agent</h3>
          </Tooltip>
          <Button variant="secondary" size="sm" onClick={onClose} title="Back to the court (Esc)">
            {SCRY_BACK_TO_COURT_LABEL}
          </Button>
        </div>
        {/* THR-2101 (decision 4): one sentence, never "Position / Minimum tier" (Law 16). */}
        <p className="text-xs mb-4" data-testid="scry-seat-sentence" style={{ color: 'var(--text-secondary)' }}>
          {fillCourtWords(COURT_WORDS.seatTakes, { archetype: position.archetype, tier: tierWord })}
        </p>

        {eligible.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No eligible agents available.</p>
          </div>
        ) : (
          <div className="space-y-2">
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
                    className="w-10 h-14 rounded overflow-hidden flex-shrink-0 relative"
                    style={{ border: `2px solid ${domainColor}` }}
                  >
                    <SeatFace face={faces?.[agent.id]} />
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
  );
});

interface PositionSlotWithMenuProps {
  position: Position;
  contextMenuOpen: boolean;
  onSelect: () => void;
  onAgentClick?: (agentId: string) => void;
  onDemote: () => void;
  onCloseMenu: () => void;
  retinueAgents: RetinueAgent[];
}

const PositionSlotWithMenu = memo(
  function PositionSlotWithMenu({
    position,
    contextMenuOpen,
    onSelect,
    onAgentClick,
    onDemote,
    onCloseMenu,
    retinueAgents,
  }: PositionSlotWithMenuProps) {
    return (
      <div>
        <PositionSlot position={position} onSelect={onSelect} onAgentClick={onAgentClick} retinueAgents={retinueAgents} />
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
      prevProps.onAgentClick === nextProps.onAgentClick &&
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
  onAgentClick?: (agentId: string) => void;
  onDemote: () => void;
  onCloseMenu: () => void;
  retinueAgents: RetinueAgent[];
}

const PositionSlotRow = memo(function PositionSlotRow({
  position,
  contextMenuOpen,
  onPositionClick,
  onAgentClick,
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
      onAgentClick={onAgentClick}
      onDemote={onDemote}
      onCloseMenu={onCloseMenu}
      retinueAgents={retinueAgents}
    />
  );
});

/**
 * THR-2101 (S5.4, R7) — a title's bonuses and weaknesses as chips of words, never counts.
 * A bonus reads `TITLE_BONUS_WORDS[target]` (its `description` is "+N to primary_domain"); a
 * weakness reads its own `description`. No chip prints a value; a chip with no words drops.
 */
export function TitleEffectChips({ title, agentName }: { title: Title; agentName: string }) {
  const bonusWords = title.bonuses
    .map(b => (TITLE_BONUS_WORDS as Readonly<Record<string, string>>)[b.target])
    .filter((w): w is string => Boolean(w));
  const weaknessWords = title.weaknesses.map(w => w.description).filter(Boolean);
  if (bonusWords.length === 0 && weaknessWords.length === 0) return null;
  const tip = (line: string) => fillCourtWords(line, { name: agentName });
  return (
    <div className="flex flex-wrap gap-1 mt-1" data-testid="scry-title-chips">
      {bonusWords.map((word, i) => (
        <Tooltip key={`b${i}`} label={word} desc={tip(TITLE_CHIP_TOOLTIPS.bonus)} focusable={false}>
          <span data-title-chip="bonus"><Chip role="state" size="sm" tint="positive" label={word} /></span>
        </Tooltip>
      ))}
      {weaknessWords.map((word, i) => (
        <Tooltip key={`w${i}`} label={word} desc={tip(TITLE_CHIP_TOOLTIPS.weakness)} focusable={false}>
          <span data-title-chip="weakness"><Chip role="state" size="sm" tint="negative" label={word} /></span>
        </Tooltip>
      ))}
    </div>
  );
}

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
    <div
      data-testid="scry-title-picker"
      className="border rounded-xl p-6"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-gold)' }}
    >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Select Title for {agent.name}</h3>
          <Button variant="secondary" size="sm" onClick={onBack} title="Back to the court (Esc)">
            {SCRY_BACK_TO_COURT_LABEL}
          </Button>
        </div>

        {/* THR-2101 (decision 4): the cost as a sentence; the essence shape explains the word. */}
        <div className="mb-4 text-xs flex items-center gap-1" data-testid="scry-cost-sentence" style={{ color: 'var(--text-secondary)' }}>
          <Icon name="essence" size="floor" tooltipId="ui.essence_panel" decorative />
          {fillCourtWords(COURT_WORDS.cost, { cost: Math.ceil(reassignmentCost), sphere: primarySphere })}
        </div>

        <div className="grid grid-cols-2 gap-3">
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
                <TitleEffectChips title={title} agentName={agent.name} />
              </button>
            );
          })}
        </div>

        {!canAfford && (
          <div className="mt-4 text-xs flex items-center gap-1" data-testid="scry-shortfall-sentence" style={{ color: 'var(--negative)' }}>
            <Icon name="essence" size="floor" tooltipId="ui.essence_panel" decorative />
            {fillCourtWords(COURT_WORDS.shortfall, {
              have: formatEssencePool(essencePool[primarySphere]),
              sphere: primarySphere,
              cost: Math.ceil(reassignmentCost),
            })}
          </div>
        )}
    </div>
  );
});

/** How long a seat a pick just filled stays highlighted after the view returns (THR-1880). */
export const SCRY_FILLED_SEAT_HIGHLIGHT_MS = 1600;

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
    onAgentSelect,
    faces,
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

  // The court's Escape belongs to Modal (THR-1880, Law 23): with a picker view open it
  // returns to the seats; with the seats showing it closes the court.
  const returnToSeats = useCallback(() => {
    setPickerMode('closed');
    setSelectedPositionId(null);
    setSelectedAgentForAssignment(null);
    setTitleProposals(null);
  }, []);
  const handleEscape = useCallback(() => {
    if (pickerMode !== 'closed') returnToSeats();
    else onClose();
  }, [pickerMode, returnToSeats, onClose]);

  // The seat a pick just filled stays highlighted for a moment after the view returns.
  const [filledSeatId, setFilledSeatId] = useState<string | null>(null);
  const filledSeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (filledSeatTimer.current) clearTimeout(filledSeatTimer.current);
  }, []);

  const structDef = getCourtStructureDefinition(scryState.courtStructureType);

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

      // Back to the seats, the filled one highlighted (THR-1880).
      setFilledSeatId(selectedPositionId);
      if (filledSeatTimer.current) clearTimeout(filledSeatTimer.current);
      filledSeatTimer.current = setTimeout(() => setFilledSeatId(null), SCRY_FILLED_SEAT_HIGHLIGHT_MS);
      returnToSeats();
      setContextMenuPositionId(null);
    },
    [selectedPositionId, selectedAgentForAssignment, scryState, onAssign, returnToSeats]
  );

  const handleDemote = useCallback(() => {
    if (!contextMenuPositionId) return;
    onDemote(contextMenuPositionId);
    setContextMenuPositionId(null);
  }, [contextMenuPositionId, onDemote]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuPositionId(null);
  }, []);

  // Find The First agent from retinue (auto-populated, not manually assigned)
  const theFirstAgent = useMemo(
    () => retinueAgents.find(a => a.courtPosition === 'the_first') ?? null,
    [retinueAgents],
  );

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

  // A seat a pick just filled carries a gold ring for SCRY_FILLED_SEAT_HIGHLIGHT_MS.
  const seatHighlight = (positionId: string) =>
    filledSeatId === positionId
      ? {
          'data-filled-highlight': 'true',
          style: {
            borderRadius: '8px',
            boxShadow: '0 0 0 3px var(--accent-gold)',
            transition: 'box-shadow var(--anim-fast, 150ms) ease-out',
          },
        }
      : { style: { transition: 'box-shadow var(--anim-fast, 150ms) ease-out' } };

  if (!structDef) {
    return null;
  }

  const showingPicker = pickerMode !== 'closed' && selectedPositionId !== null;

  // THR-1880: an L dialog (Law 57). Modal portals to <body> (THR-1709), caps the panel
  // at 85vh and owns Escape; the court's name, flavour and art sit left, the seats right.
  return (
    <Modal open onClose={handleEscape} size="l" aria-label="Divine Court">
      <div data-testid="scry-overlay" className="flex flex-col overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
        {/* Header — outside the scroll regions, so the ✕ is always reachable */}
        <div className="flex items-center justify-between px-6 pt-5 shrink-0">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Divine Court
          </h1>
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

        <SheetColumns
          asideLabel="The court"
          mainLabel={showingPicker ? 'Choose for the seat' : 'The seats'}
          aside={
            <>
              {/* Sphere-themed court art, 16:9 across the column (Law 5) */}
              <div className="rounded-lg overflow-hidden border mb-4" style={{ aspectRatio: '16 / 9', borderColor: 'var(--border-gold)' }}>
                <img src={bgImage} alt="" className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>✦</div>
              <p className="text-lg" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{structDef.name}</p>
              <p className="text-xs italic mt-1" style={{ color: 'var(--text-tertiary)' }}>{structDef.flavorText}</p>
              {/* Structure Bonus */}
              <div
                className="p-3 rounded-lg text-xs italic mt-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-gold)',
                  border: '1px solid',
                  color: 'var(--text-secondary)',
                }}
              >
                {/* THR-2101 (decision 4): a sentence in the structure's own words, no "Label:". */}
                <span data-testid="scry-structure-bonus">
                  {fillCourtWords(COURT_WORDS.structureBonus, {
                    structure: structDef.name,
                    bonus: lowerFirst(structDef.structureBonus.description),
                  })}
                </span>
              </div>
              {/* Sacred Sites & Artifacts */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                    <HeadingShape name={dialogHeadingIcon('courtSacredSites')} />
                    Sacred Sites
                  </h2>
                  {/* THR-2101 (decision 5): no sacred site yet → one quiet line, not "Coming Soon". */}
                  <QuietSlot data-testid="scry-empty-sacred-sites">{COURT_WORDS.emptySacredSite}</QuietSlot>
                </div>

                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                    <HeadingShape name={dialogHeadingIcon('courtArtifacts')} />
                    Divine Artifacts
                  </h2>
                  <QuietSlot data-testid="scry-empty-artifacts">{COURT_WORDS.emptyArtifact}</QuietSlot>
                </div>
              </div>
            </>
          }
        >
          {showingPicker ? (
            <div data-testid="scry-picker-view">
              {/* Picker views — in this column, never over the court (THR-1880) */}
              {pickerMode === 'agent' && selectedPositionId && (
                <AgentPickerPanel
                  position={scryState.positions.find(p => p.id === selectedPositionId)}
                  agents={retinueAgents}
                  minTier={minTierForSelectedPosition}
                  assignedAgentIds={assignedAgentIds}
                  onSelectAgent={handleSelectAgent}
                  onClose={returnToSeats}
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
                  onBack={returnToSeats}
                />
              )}
            </div>
          ) : (
            <div
              className="rounded-lg border p-6 space-y-6 relative"
              data-testid="scry-overlay-body"
              style={{
                backgroundColor: 'rgba(20, 18, 15, 0.85)',
                borderColor: 'var(--border-gold)',
              }}
            >
              {/* SVG thread connections behind position slots */}
              <CourtThreads threadColor={threadColor} />

              {/* The First — auto-populated from court position, above all other ranks */}
              {theFirstAgent && (
                <div className="relative z-10 mb-2">
                  <h2
                    className="text-sm font-bold uppercase tracking-wider mb-3 text-center"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    The First
                  </h2>
                  <div className="flex justify-center">
                    <button
                      onClick={() => onAgentSelect?.(theFirstAgent.id)}
                      className="rounded-lg overflow-hidden relative transition-all hover:scale-105 hover:brightness-110"
                      style={{
                        width: SLOT_SIZES.apex.width,
                        height: SLOT_SIZES.apex.height,
                        border: '3px solid var(--accent-gold)',
                        boxShadow: '0 0 12px rgba(212, 160, 64, 0.35)',
                        cursor: 'pointer',
                      }}
                    >
                      <SeatFace face={faces?.[theFirstAgent.id]} />
                      <div
                        className="absolute bottom-0 left-0 right-0 p-2"
                        style={{
                          background: 'linear-gradient(transparent, rgba(10, 10, 14, 0.85) 40%)',
                        }}
                      >
                        <div
                          className="text-xs font-bold"
                          style={{ color: 'var(--accent-gold)' }}
                        >
                          The First
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {theFirstAgent.name}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* FE-TT-15: Apex with tooltip */}
              <div className="relative z-10">
                <Tooltip id="ui.scry_rank_champion">
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-3 cursor-help text-center" style={{ color: 'var(--text-secondary)' }}>
                    Apex
                  </h2>
                </Tooltip>
                <div className="flex gap-4 justify-center">
                  {apexPositions.map(pos => (
                    <div key={pos.id} {...seatHighlight(pos.id)}>
                      <PositionSlotRow
                        position={pos}
                        contextMenuOpen={contextMenuPositionId === pos.id}
                        onPositionClick={handlePositionClick}
                        onAgentClick={onAgentSelect}
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
                    <div key={pos.id} {...seatHighlight(pos.id)}>
                      <PositionSlotRow
                        position={pos}
                        contextMenuOpen={contextMenuPositionId === pos.id}
                        onPositionClick={handlePositionClick}
                        onAgentClick={onAgentSelect}
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
                    <div key={pos.id} {...seatHighlight(pos.id)}>
                      <PositionSlotRow
                        position={pos}
                        contextMenuOpen={contextMenuPositionId === pos.id}
                        onPositionClick={handlePositionClick}
                        onAgentClick={onAgentSelect}
                        onDemote={handleDemote}
                        onCloseMenu={handleCloseContextMenu}
                        retinueAgents={retinueAgents}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </SheetColumns>
      </div>
    </Modal>
  );
}
