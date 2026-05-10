import React, { useEffect, useMemo, useState } from 'react';
import type { ThreadedNode, ThreadCategory } from '../../engine/retinue';
import { groupThreadedNodes } from '../../engine/retinue';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { BalanceEvent, BalanceEncounterPoolCandidate } from '../../types/balanceEval';
import type { ForeshadowingResult } from '../../engine/foreshadowing/types';
import { Tooltip } from '../shared/Tooltip';
import type { ActiveEncounterDisplay } from './encounterNotificationRuntime';
import { SectionHeading } from '../shared/SectionHeading';
import { Modal } from '../shared/Modal';
import { StepDots } from '../shared/StepDots';
import { ActivityIcon } from '../shared/ActivityIcon';
import { SphereIcon, sphereFromReach } from '../shared/SphereIcon';
import {
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
  activeEncounters?: Map<string, { encounter: ActiveEncounterDisplay; template: UnifiedActionTemplate }>;
  agentEncounterDecisions?: Map<string, BalanceEvent>;
  onEncounterClick?: (agentId: string, encounter: ActiveEncounterDisplay, template: UnifiedActionTemplate) => void;
  onToggleAttentionMode?: (threadEdgeId: string) => void;
  /** Per-agent strategic summaries for badge display. Only agents with strategic activity will have entries. */
  agentStrategicSummaries?: Map<string, AgentStrategicSummary>;
  getForeshadowing?: (agentId: string, encounterId: string) => ForeshadowingResult;
}

interface EncounterPoolModalState {
  agentName: string;
  decision: BalanceEvent;
}

type EncounterPoolViewMode = 'raw' | 'grouped';

// ─── Compact row props ────────────────────────────────────────────

interface CompactThreadRowProps {
  node: ThreadedNode;
  isSelected: boolean;
  onNodeSelect: (nodeId: string, category: ThreadCategory) => void;
  onCenterOnHex: (locationId: string) => void;
  activeEncounters?: Map<string, { encounter: ActiveEncounterDisplay; template: UnifiedActionTemplate }>;
  agentEncounterDecision?: BalanceEvent;
  onEncounterClick?: (agentId: string, encounter: ActiveEncounterDisplay, template: UnifiedActionTemplate) => void;
  onToggleAttentionMode?: (threadEdgeId: string) => void;
  onOpenEncounterPool?: (agentName: string, decision: BalanceEvent) => void;
  /** Strategic summary for this agent, if they have active strategic activity. */
  strategicSummary?: AgentStrategicSummary;
  getForeshadowing?: (agentId: string, encounterId: string) => ForeshadowingResult;
}

// ─── Utility functions ────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────

interface ThreadPortraitProps {
  name: string;
  id: string;
  sphere: string | null;
  selected: boolean;
  size?: number;
}

function ThreadPortrait({ name, id, sphere, selected, size = 52 }: ThreadPortraitProps) {
  const initials = useMemo(() => {
    const parts = String(name || '?').trim().split(/\s+/);
    const a = parts[0]?.[0] || '?';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase();
  }, [name]);
  const seed = useMemo(() => {
    let h = 0;
    for (const c of String(id || name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
  }, [id, name]);
  const rot = ((seed % 13) - 6) * 0.6;
  const sphereVar = sphere ? `var(--sphere-${sphere})` : 'var(--accent-gold-dim)';
  const sphereBrightVar = sphere ? `var(--sphere-${sphere}-bright)` : 'var(--accent-gold)';
  const ring = selected ? 'var(--accent-gold)' : 'var(--accent-gold-dim)';
  const gradId = `pf-${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0, display: 'block' }}>
      <defs>
        <radialGradient id={`${gradId}-g`} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor={sphereBrightVar} stopOpacity="0.55" />
          <stop offset="60%" stopColor={sphereVar} stopOpacity="0.30" />
          <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <g transform={`rotate(${rot} 24 24)`}>
        <circle cx="24" cy="24" r="22" fill="none" stroke={ring} strokeWidth="0.6" opacity="0.7" />
        <circle cx="24" cy="24" r="20.2" fill="none" stroke={ring} strokeWidth="0.4" opacity="0.35" />
        <circle cx="24" cy="24" r="19" fill={`url(#${gradId}-g)`} />
        {([0, 90, 180, 270] as const).map(a => (
          <line key={a} x1="24" y1="3.5" x2="24" y2="5.5"
            transform={`rotate(${a} 24 24)`}
            stroke={ring} strokeWidth="0.6" opacity="0.55" />
        ))}
        <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
          fontFamily="var(--font-display)"
          fontSize={initials.length > 1 ? 17 : 21}
          fontWeight="600" letterSpacing="1"
          fill={selected ? 'var(--accent-gold)' : 'var(--text-primary)'}
          style={{ textTransform: 'uppercase' }}
        >{initials}</text>
      </g>
    </svg>
  );
}

function ThreadActionChip({ label }: { label: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 4,
      fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
      color: 'var(--accent-gold)',
      fontStyle: 'italic', letterSpacing: '0.02em',
      minWidth: 0, overflow: 'hidden',
    }}>
      <span style={{ color: 'var(--text-muted)', fontStyle: 'normal', flexShrink: 0 }}>⇢</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function AutoToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={on ? 'Auto mode active — click to pause' : 'Paused — click to enable auto'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '2px 8px 2px 4px',
        background: hov ? 'var(--bg-hover)' : 'transparent',
        border: '1px solid transparent', borderRadius: 4,
        color: on ? 'var(--text-secondary)' : 'var(--text-muted)',
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span style={{
        width: 0, height: 0,
        borderLeft: `6px solid ${on ? 'var(--accent-gold-dim)' : 'currentColor'}`,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
      }} />
      Auto
    </button>
  );
}

// ─── Encounter Pool Modal ─────────────────────────────────────────

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

// ─── CompactThreadRow ─────────────────────────────────────────────

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
  getForeshadowing,
}: CompactThreadRowProps) {
  const [hovered, setHovered] = useState(false);
  const isDormant = node.category === 'agent' && node.courtPosition === 'dormant';

  // Sphere for border color and portrait tint
  const sphere: string | null =
    node.category === 'agent' ? (sphereFromReach(node.primaryDomain) ?? null)
    : node.category === 'faction' ? (node.dominantSphere ?? null)
    : null;

  const borderColor = isDormant
    ? 'var(--text-muted)'
    : sphere
      ? (isSelected ? `var(--sphere-${sphere}-bright)` : `var(--sphere-${sphere})`)
      : 'var(--accent-gold-dim)';

  // Agent-specific encounter data
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

  // Activity icon kind (agents only)
  const activityKind = node.category === 'agent'
    ? (agentEncounter
        ? getEncounterActivityIconKey(agentEncounter.template.encounterType)
        : encounterDecisionCandidate
          ? getEncounterActivityIconKey(
              encounterDecisionCandidate.encounterType,
              agentEncounterDecision?.decisionType,
            )
          : 'hourglass' as const)
    : null;

  // Action chip label (active encounter > pending decision > activity label)
  const actionChipLabel: string | null = node.category === 'agent'
    ? (agentEncounter
        ? agentEncounter.template.name
        : encounterDecisionCandidate && agentEncounterDecision?.decisionType !== 'idle'
          ? encounterDecisionCandidate.templateName
          : node.activityLabel)
    : null;

  // Foreshadowing prose for tooltip on pending encounter chip (not active encounters)
  const foreshadowingProse: string | undefined =
    node.category === 'agent' && encounterDecisionCandidate && getForeshadowing && !agentEncounter
      ? getForeshadowing(node.id, encounterDecisionCandidate.templateId).prose
      : undefined;

  // Strategic badge
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

  // Secondary info line
  let secondaryInfo = '';
  let eyeLocationId: string | null = null;

  if (node.category === 'agent') {
    secondaryInfo = node.locationName;
    eyeLocationId = node.locationId;
  } else if (node.category === 'location') {
    secondaryInfo = node.controllingFaction
      ? node.controllingFaction + ' \u00b7 ' + node.prosperityLabel
      : node.prosperityLabel;
    eyeLocationId = node.id;
  } else if (node.category === 'faction') {
    const spherePart = node.dominantSphere ? node.dominantSphere + ' sphere \u00b7 ' : '';
    secondaryInfo = spherePart + node.territoryCount + ' hexes \u00b7 ' + node.memberCount + ' members';
  } else if (node.category === 'army') {
    secondaryInfo = node.size + ' strong \u00b7 ' + node.objective;
  } else if (node.category === 'artifact') {
    if (node.bearerName) {
      secondaryInfo = 'Carried by ' + node.bearerName;
    } else if (node.locationName) {
      secondaryInfo = 'In ' + node.locationName + ' vaults';
    } else {
      secondaryInfo = '(location unknown)';
    }
  }

  // Strength bar color: sphere-tinted when healthy, yellow/red when damaged
  const strengthBarColor = sphere && node.threadStrength > 0.5
    ? `var(--sphere-${sphere})`
    : node.threadStrength > 0.25 ? '#e0a020' : '#b03030';

  return (
    <div
      role="listitem"
      aria-selected={isSelected}
      data-testid="thread-entry"
      onClick={() => onNodeSelect(node.id, node.category)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `3px solid ${borderColor}`,
        borderTop: `1px solid ${isSelected ? 'rgba(212,160,64,0.3)' : 'var(--border-subtle)'}`,
        borderRight: `1px solid ${isSelected ? 'rgba(212,160,64,0.3)' : 'var(--border-subtle)'}`,
        borderBottom: `1px solid ${isSelected ? 'rgba(212,160,64,0.3)' : 'var(--border-subtle)'}`,
        borderRadius: 4,
        background: isSelected ? 'var(--accent-gold-glow)' : hovered ? 'var(--bg-hover)' : 'var(--bg-surface)',
        outline: isSelected ? '1px solid var(--border-accent)' : 'none',
        opacity: isDormant ? 0.5 : 1,
        cursor: 'pointer',
        transition: 'background-color .15s ease',
        marginBottom: 2,
      }}
    >
      {/* Main row: portrait (agents) + content */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px 10px 9px' }}>
        {/* Portrait — agents only */}
        {node.category === 'agent' && (
          <ThreadPortrait
            name={node.name}
            id={node.id}
            sphere={sphere}
            selected={isSelected}
            size={52}
          />
        )}

        {/* Content column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
          {/* Row 1: name · strategic glyph · activity icon · zoom · sphere icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {/* Priority pip — visible when this thread has a pending encounter (THR-340 §5.8) */}
            {node.category === 'agent' && agentEncounter && (
              <span
                data-testid="thread-priority-pip"
                aria-label="Needs attention"
                title="Needs attention"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-gold, #d4a040)',
                  boxShadow: '0 0 6px var(--accent-gold, #d4a040)',
                  flexShrink: 0,
                  animation: 'mark-pulse 1.6s ease-in-out infinite',
                }}
              />
            )}
            <span
              className="truncate"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: node.category === 'agent' ? 17 : 'var(--text-xs)',
                fontWeight: 600,
                color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)',
                letterSpacing: node.category === 'agent' ? '0.04em' : undefined,
                textTransform: node.category === 'agent' ? 'uppercase' : undefined,
                flex: 1,
                minWidth: 0,
              }}
            >
              {node.name}
            </span>

            {/* Strategic behavior glyph */}
            {familyPresentation && (
              <span
                title={strategicBadgeText ?? familyPresentation.label}
                style={{ fontSize: 'var(--text-xs)', color: familyPresentation.color, flexShrink: 0, lineHeight: 1 }}
              >
                {familyPresentation.glyph}
              </span>
            )}

            {/* Activity icon — agents only */}
            {node.category === 'agent' && activityKind && (
              <ActivityIcon kind={activityKind} size={18} color="var(--text-secondary)" />
            )}

            {/* Zoom to location */}
            {eyeLocationId && (
              <button
                type="button"
                aria-label={`Center map on ${node.name}`}
                onClick={(e) => { e.stopPropagation(); onCenterOnHex(eyeLocationId!); }}
                style={{
                  width: 22, height: 22, padding: 0,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M11 8 L11 14 M8 11 L14 11" />
                  <path d="M20 20 L16 16" />
                </svg>
              </button>
            )}

            {/* Sphere icon — agents only */}
            {node.category === 'agent' && sphere && (
              <SphereIcon sphere={sphere} size={16} />
            )}
          </div>

          {/* Row 2: secondary info */}
          {secondaryInfo && (
            <div
              className="truncate"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                lineHeight: 1.4,
              }}
            >
              {secondaryInfo}
            </div>
          )}

          {/* Strategic badge row (agents with active strategic activity) */}
          {node.category === 'agent' && strategicBadgeText && familyPresentation && (
            <div
              className="truncate"
              title={strategicBadgeText}
              style={{
                padding: '1px 4px',
                borderRadius: 4,
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.2,
                color: familyPresentation.color,
                backgroundColor: `color-mix(in srgb, ${familyPresentation.color} ${Math.round(STRATEGIC_BADGE_BG_OPACITY * 100)}%, transparent)`,
              }}
            >
              {familyPresentation.glyph} {strategicBadgeText}
            </div>
          )}

          {/* Row 3: pool · action chip · auto toggle (agents only) */}
          {node.category === 'agent' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {/* Encounter pool button */}
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
                  {encounterPoolBaseline !== null && encounterPoolBaseline !== encounterPool
                    ? ` / ${encounterPoolBaseline}`
                    : ''}
                </button>
              )}

              {/* Action chip — encounter in progress shows clickable step-chip, otherwise label */}
              {actionChipLabel !== null && (
                agentEncounter && onEncounterClick ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEncounterClick(node.id, agentEncounter.encounter, agentEncounter.template);
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                      color: 'var(--accent-gold)',
                      fontStyle: 'italic', letterSpacing: '0.02em',
                      cursor: 'pointer',
                      minWidth: 0, overflow: 'hidden', flex: 1,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'normal', flexShrink: 0 }}>⇢</span>
                    <span className="truncate">{agentEncounter.template.name}</span>
                    <StepDots
                      total={agentEncounter.template.steps.length}
                      current={agentEncounter.encounter.currentStepIndex}
                    />
                  </button>
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {foreshadowingProse ? (
                      <Tooltip label={actionChipLabel} desc={foreshadowingProse}>
                        <ThreadActionChip label={actionChipLabel} />
                      </Tooltip>
                    ) : (
                      <ThreadActionChip label={actionChipLabel} />
                    )}
                  </div>
                )
              )}

              {/* Auto toggle */}
              {node.courtPosition && onToggleAttentionMode && (
                <div style={{ marginLeft: 'auto' }}>
                  <AutoToggle
                    on={node.attentionMode === 'auto_resolve'}
                    onToggle={() => onToggleAttentionMode(node.threadEdgeId)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thread strength bar — full-width band at the bottom of the row */}
      {node.threadStrength < 1.0 && (
        <div style={{
          position: 'relative', height: 2, borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.round(node.threadStrength * 100)}%`,
            backgroundColor: strengthBarColor,
            transition: 'width 0.6s ease, background-color 0.4s ease',
          }} />
        </div>
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
  getForeshadowing,
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

  // Suppress unused-prop lint for onZoomToLocation — preserved in signature for callers
  void onZoomToLocation;

  const groups = groupThreadedNodes(threadedNodes);

  const toggleSection = (category: ThreadCategory) => {
    setExpandedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const totalCount = threadedNodes.length;
  if (totalCount === 0) {
    return (
      <div className="panel" style={{ padding: 'var(--space-3)' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
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
      <div className="panel" style={{ padding: 'var(--space-3)' }}>
        {/* Panel title */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
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
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {chevron}
                </span>
                <SectionHeading ornamental count={group.length}>{label}</SectionHeading>
              </div>

              {/* Rows */}
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
                      getForeshadowing={getForeshadowing}
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
