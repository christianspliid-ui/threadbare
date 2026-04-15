import React, { useEffect, useState } from 'react';
import type { ThreadedNode, ThreadCategory } from '../../engine/retinue';
import { groupThreadedNodes } from '../../engine/retinue';
import type { EncounterTemplate } from '../../types/encounter';
import type { BalanceEvent, BalanceEncounterPoolCandidate } from '../../types/balanceEval';
import type { ActiveEncounterDisplay } from './encounterNotificationRuntime';
import { SectionHeading } from '../shared/SectionHeading';
import { IconButton } from '../shared/IconButton';
import { Modal } from '../shared/Modal';
import { StepDots } from '../shared/StepDots';
import { TIER_COLORS, TIER_COLOR_DEFAULT } from '../../data/uiColorPalette';
import {
  getEncounterActivityGlyph,
  getEncounterActivityIconKey,
  getSelectedEncounterPoolCandidate,
  groupEncounterPoolCandidates,
  summarizeEncounterPoolDominance,
} from './encounterActivityPresentation';
import type { AgentStrategicSummary } from '../../engine/strategicPresentation';
import { getBehaviorFamilyPresentation, STRATEGIC_BADGE_BG_OPACITY } from '../../engine/strategicPresentation';

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
  agentEncounterDecisions?: Map<string, BalanceEvent>;
  onEncounterClick?: (agentId: string, encounter: ActiveEncounterDisplay, template: EncounterTemplate) => void;
  onToggleAttentionMode?: (threadEdgeId: string) => void;
  /** Per-agent strategic summaries for badge display. Only agents with strategic activity will have entries. */
  agentStrategicSummaries?: Map<string, AgentStrategicSummary>;
}

interface EncounterPoolModalState {
  agentName: string;
  decision: BalanceEvent;
}

type EncounterPoolViewMode = 'raw' | 'grouped';

// ─── Compact row ─────────────────────────────────────────────────

interface CompactThreadRowProps {
  node: ThreadedNode;
  isSelected: boolean;
  onNodeSelect: (nodeId: string, category: ThreadCategory) => void;
  onCenterOnHex: (locationId: string) => void;
  activeEncounters?: Map<string, { encounter: ActiveEncounterDisplay; template: EncounterTemplate }>;
  agentEncounterDecision?: BalanceEvent;
  onEncounterClick?: (agentId: string, encounter: ActiveEncounterDisplay, template: EncounterTemplate) => void;
  onToggleAttentionMode?: (threadEdgeId: string) => void;
  onOpenEncounterPool?: (agentName: string, decision: BalanceEvent) => void;
  /** Strategic summary for this agent, if they have active strategic activity. */
  strategicSummary?: AgentStrategicSummary;
}

function getVisibleEncounterPool(decision?: BalanceEvent): number | null {
  if (!decision) return null;
  return decision.candidatesAfterCooldown
    ?? decision.filterAfterCap
    ?? decision.filterAfterThreat
    ?? decision.filterAfterPrerequisites
    ?? decision.filterAfterVisibility
    ?? decision.filterAfterAwareness
    ?? decision.filterCacheSize
    ?? null;
}

function getEncounterPoolBaseline(decision?: BalanceEvent): number | null {
  return decision?.filterCacheSize ?? null;
}

function getEncounterPoolCandidates(decision?: BalanceEvent): BalanceEncounterPoolCandidate[] {
  return decision?.rankedEncounterPool ?? [];
}

function formatEncounterPoolMeta(candidate: BalanceEncounterPoolCandidate): string {
  return `${candidate.reachPrimary}/${candidate.reachSecondary} | ${candidate.encounterType} | ${candidate.threatBand} | ${candidate.stepCount} steps | ~${candidate.totalTickCost} ticks | reward ${candidate.rewardEstimate.toFixed(1)}`;
}

function formatEncounterPoolDestination(candidate: BalanceEncounterPoolCandidate): string | null {
  const destination = candidate.sublocationName ?? candidate.locationName;
  if (!destination) return null;
  if (candidate.action === 'queue_movement') return `Heading to ${destination}`;
  if (candidate.action === 'attempt_remote') return `Remote at ${destination}`;
  if (candidate.sublocationName) return `At ${destination}`;
  return null;
}

function EncounterPoolModal({
  state,
  onClose,
}: {
  state: EncounterPoolModalState | null;
  onClose: () => void;
}) {
  const [viewMode, setViewMode] = useState<EncounterPoolViewMode>('raw');
  const candidates = getEncounterPoolCandidates(state?.decision);
  const groupedCandidates = groupEncounterPoolCandidates(candidates);
  const dominance = summarizeEncounterPoolDominance(candidates, 10);
  const visibleCount = getVisibleEncounterPool(state?.decision);
  const baselineCount = getEncounterPoolBaseline(state?.decision);

  useEffect(() => {
    if (state) setViewMode('raw');
  }, [state?.agentName, state?.decision.seq, state?.decision.tick]);

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      maxWidth={720}
      aria-label={state ? `${state.agentName} encounter pool` : 'Encounter pool'}
    >
      <Modal.Header onClose={onClose}>
        {state ? `${state.agentName}'s Encounter Pool` : 'Encounter Pool'}
      </Modal.Header>
      <Modal.Body>
        {state && (
          <div
            style={{
              marginBottom: 'var(--space-3)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Pool {visibleCount ?? 0}
              {baselineCount !== null && baselineCount !== visibleCount ? ` / ${baselineCount}` : ''}
            </div>
            <div style={{ marginTop: '4px', color: 'var(--text-tertiary)' }}>
              Ordered by the agent&apos;s current decision score.
            </div>
            <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
              Unique templates in top {dominance.windowSize}: {dominance.uniqueTemplates}
            </div>
            {dominance.dominantTemplateName && (
              <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                Top {dominance.windowSize} contains {dominance.dominantTemplateCount} copies of {dominance.dominantTemplateName}
                {' '}({Math.round(dominance.dominantTemplateShare * 100)}%)
              </div>
            )}
            <div
              role="tablist"
              aria-label="Encounter pool display mode"
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                marginTop: '10px',
              }}
            >
              {([
                { mode: 'raw' as const, label: `Raw priority list (${candidates.length})` },
                { mode: 'grouped' as const, label: `Grouped templates (${groupedCandidates.length})` },
              ]).map(({ mode, label }) => {
                const selected = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setViewMode(mode)}
                    style={{
                      borderRadius: '999px',
                      border: `1px solid ${selected ? 'rgba(212, 160, 64, 0.45)' : 'rgba(255,255,255,0.08)'}`,
                      backgroundColor: selected ? 'rgba(212, 160, 64, 0.12)' : 'rgba(255,255,255,0.02)',
                      color: selected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-xs)',
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {candidates.length === 0 ? (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            No ranked encounter pool is available for this agent yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {viewMode === 'raw'
              ? candidates.map((candidate) => {
                  const destinationLine = formatEncounterPoolDestination(candidate);
                  return (
                    <div
                      key={`${candidate.rank}-${candidate.templateId}-${candidate.locationId}`}
                      data-testid="encounter-pool-item"
                      style={{
                        border: '1px solid rgba(212, 160, 64, 0.18)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        backgroundColor: candidate.selected ? 'rgba(212, 160, 64, 0.08)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--accent-gold)',
                          }}
                        >
                          #{candidate.rank} {candidate.templateName}
                        </div>
                        {candidate.selected && (
                          <div
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 'var(--text-xs)',
                              color: 'var(--bg-abyss)',
                              backgroundColor: 'var(--accent-gold)',
                              borderRadius: '999px',
                              padding: '2px 8px',
                              flexShrink: 0,
                            }}
                          >
                            Chosen
                          </div>
                        )}
                      </div>

                      {(destinationLine || candidate.locationName) && (
                        <div
                          style={{
                            marginTop: '4px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {destinationLine ?? candidate.locationName}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: '4px',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {formatEncounterPoolMeta(candidate)}
                      </div>

                      <div
                        style={{
                          marginTop: '4px',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Score {candidate.finalScore.toFixed(2)} · completion {(candidate.completionProb * 100).toFixed(0)}%
                        {candidate.travelCost > 0 ? ` · travel ${candidate.travelCost.toFixed(2)}` : ''}
                      </div>
                    </div>
                  );
                })
              : groupedCandidates.map((groupedCandidate) => {
                  const { primary } = groupedCandidate;
                  const destinationLine = formatEncounterPoolDestination(primary);
                  const extraDestinations = Math.max(0, groupedCandidate.destinations.length - 1);
                  return (
                    <div
                      key={`${primary.rank}-${groupedCandidate.key}`}
                      data-testid="encounter-pool-item"
                      style={{
                        border: '1px solid rgba(212, 160, 64, 0.18)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        backgroundColor: primary.selected ? 'rgba(212, 160, 64, 0.08)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--space-2)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--accent-gold)',
                          }}
                        >
                          #{primary.rank} {primary.templateName}
                        </div>
                        {primary.selected && (
                          <div
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 'var(--text-xs)',
                              color: 'var(--bg-abyss)',
                              backgroundColor: 'var(--accent-gold)',
                              borderRadius: '999px',
                              padding: '2px 8px',
                              flexShrink: 0,
                            }}
                          >
                            Chosen
                          </div>
                        )}
                      </div>

                      {(destinationLine || primary.locationName) && (
                        <div
                          style={{
                            marginTop: '4px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {destinationLine ?? primary.locationName}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: '4px',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {formatEncounterPoolMeta(primary)}
                      </div>

                      {groupedCandidate.count > 1 && (
                        <div
                          style={{
                            marginTop: '4px',
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {groupedCandidate.count} destinations
                          {groupedCandidate.destinations[0] ? ` · best at ${groupedCandidate.destinations[0]}` : ''}
                          {extraDestinations > 0 ? ` + ${extraDestinations} more` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}

function CompactThreadRow({
  node,
  isSelected,
  onNodeSelect,
  onCenterOnHex,
  activeEncounters,
  agentEncounterDecision,
  onEncounterClick,
  onToggleAttentionMode,
  onOpenEncounterPool,
  strategicSummary,
}: CompactThreadRowProps) {
  const tierColor = TIER_COLORS[node.tier] || TIER_COLOR_DEFAULT;
  const [hovered, setHovered] = useState(false);
  const isDormant = node.category === 'agent' && node.courtPosition === 'dormant';

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
  const encounterPool = node.category === 'agent'
    ? getVisibleEncounterPool(agentEncounterDecision)
    : null;
  const encounterPoolBaseline = node.category === 'agent'
    ? getEncounterPoolBaseline(agentEncounterDecision)
    : null;
  const encounterDecisionCandidate = node.category === 'agent'
    ? getSelectedEncounterPoolCandidate(agentEncounterDecision)
    : null;
  const decisionBadgeGlyph = encounterDecisionCandidate
    ? getEncounterActivityGlyph(
        getEncounterActivityIconKey(encounterDecisionCandidate.encounterType, agentEncounterDecision?.decisionType),
      )
    : null;

  // Strategic badge — agents only, when there is active strategic activity
  const familyPresentation = strategicSummary
    ? getBehaviorFamilyPresentation(strategicSummary.behaviorFamily)
    : null;
  const strategicBadgeText = strategicSummary
    ? (() => {
        if (strategicSummary.activeProject) {
          return `${strategicSummary.activeProject.displayName} — ${strategicSummary.activeProject.progressLabel}`;
        }
        if (strategicSummary.primaryControl) {
          const suffix = strategicSummary.controlCount > 1
            ? ` +${strategicSummary.controlCount - 1}`
            : '';
          return `Holds ${strategicSummary.primaryControl.targetName}${suffix}`;
        }
        return null;
      })()
    : null;

  return (
    <div
      role="listitem"
      aria-selected={isSelected}
      data-testid="thread-entry"
      onClick={() => onNodeSelect(node.id, node.category)}
      className={`rounded cursor-pointer transition-colors duration-150${isSelected ? ' ring-2 ring-amber-400/60' : ''}`}
      style={{
        backgroundColor: isSelected ? 'var(--bg-raised)' : hovered ? 'var(--bg-hover)' : 'var(--bg-raised)',
        borderLeft: `3px solid ${isDormant ? 'var(--text-muted)' : tierColor}`,
        opacity: isDormant ? 0.5 : 1,
        borderTop: isSelected ? '1px solid rgba(212,160,64,0.3)' : '1px solid transparent',
        borderRight: isSelected ? '1px solid rgba(212,160,64,0.3)' : '1px solid transparent',
        borderBottom: isSelected ? '1px solid rgba(212,160,64,0.3)' : '1px solid transparent',
        padding: '4px 8px',
        marginBottom: '2px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Name line + family glyph + eye icon */}
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
        {/* Behavior family glyph — only for agents with strategic activity */}
        {familyPresentation && (
          <span
            title={familyPresentation.label}
            style={{
              fontSize: '12px',
              color: familyPresentation.color,
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {familyPresentation.glyph}
          </span>
        )}
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

      {/* Bottom row: encounter pool button + strategic badge (flex, share space) */}
      {(node.category === 'agent' && (encounterPool !== null || strategicBadgeText)) && (
        <div className="flex items-center gap-1" style={{ marginTop: '2px', minWidth: 0 }}>
          {/* Strategic badge — flex-1 so it takes available space, truncates if needed */}
          {strategicBadgeText && familyPresentation && (
            <div
              className="truncate"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '1px 4px',
                borderRadius: 4,
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.2,
                color: familyPresentation.color,
                backgroundColor: `color-mix(in srgb, ${familyPresentation.color} ${Math.round(STRATEGIC_BADGE_BG_OPACITY * 100)}%, transparent)`,
              }}
              title={strategicBadgeText}
            >
              {familyPresentation.glyph} {strategicBadgeText}
            </div>
          )}
          {/* Encounter pool button — flex-shrink-0 so it doesn't get squeezed */}
          {encounterPool !== null && (
            <button
              type="button"
              data-testid="encounter-pool-button"
              aria-label={`Open encounter pool for ${node.name}`}
              onClick={(e) => {
                e.stopPropagation();
                if (agentEncounterDecision && onOpenEncounterPool) {
                  onOpenEncounterPool(node.name, agentEncounterDecision);
                }
              }}
              style={{
                flexShrink: 0,
                padding: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: encounterPool > 0 ? 'var(--text-secondary)' : 'var(--accent-gold)',
                lineHeight: 1.2,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: agentEncounterDecision && onOpenEncounterPool ? 'pointer' : 'default',
                textDecoration: agentEncounterDecision && onOpenEncounterPool ? 'underline' : 'none',
                textUnderlineOffset: '2px',
              }}
            >
              Pool {encounterPool}
              {encounterPoolBaseline !== null && encounterPoolBaseline !== encounterPool ? ` / ${encounterPoolBaseline}` : ''}
            </button>
          )}
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
          <span>
            {getEncounterActivityGlyph(
              getEncounterActivityIconKey(agentEncounter.template.encounterType),
            )}
          </span>
          <span className="truncate">{agentEncounter.template.name}</span>
          <StepDots
            total={agentEncounter.template.steps.length}
            current={agentEncounter.encounter.currentStepIndex}
          />
        </button>
      )}

      {!agentEncounter && encounterDecisionCandidate && agentEncounterDecision?.decisionType !== 'idle' && (
        <div
          className="flex items-center gap-1 mt-0.5 text-left rounded px-1"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold)',
            backgroundColor: 'rgba(212,175,55,0.08)',
            padding: '1px 4px',
          }}
        >
          <span>{decisionBadgeGlyph}</span>
          <span className="truncate">{encounterDecisionCandidate.templateName}</span>
        </div>
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
  agentEncounterDecisions,
  onEncounterClick,
  onToggleAttentionMode,
  agentStrategicSummaries,
}: ThreadsPanelProps) {
  // Agents open by default; all other sections collapsed
  const [expandedSections, setExpandedSections] = useState<Record<ThreadCategory, boolean>>({
    agent: true,
    location: false,
    faction: false,
    army: false,
    artifact: false,
  });
  const [encounterPoolModal, setEncounterPoolModal] = useState<EncounterPoolModalState | null>(null);

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
    <>
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
                    agentEncounterDecision={node.category === 'agent' ? agentEncounterDecisions?.get(node.id) : undefined}
                    onEncounterClick={onEncounterClick}
                    onToggleAttentionMode={onToggleAttentionMode}
                    onOpenEncounterPool={(agentName, decision) => setEncounterPoolModal({ agentName, decision })}
                    strategicSummary={node.category === 'agent' ? agentStrategicSummaries?.get(node.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      </div>
      <EncounterPoolModal
        state={encounterPoolModal}
        onClose={() => setEncounterPoolModal(null)}
      />
    </>
  );
});
