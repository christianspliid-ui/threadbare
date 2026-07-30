import React, { useEffect, useMemo, useState } from 'react';
import type { ThreadedNode, ThreadCategory, SustainedControlNode, SustainedControlCategory } from '../../engine/retinue';
import { groupThreadedNodes, SUSTAIN_BAR_MIN_VISIBLE_FRACTION, SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS } from '../../engine/retinue';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { BalanceEvent, BalanceEncounterPoolCandidate } from '../../types/balanceEval';
import type { ActiveEncounterDisplay } from './encounterNotificationRuntime';
import { SectionHeading } from '../shared/SectionHeading';
import { Modal } from '../shared/Modal';
import { ActivityIcon, type ActivityKind } from '../shared/ActivityIcon';
import { EncounterBadge } from './EncounterBadge';
import type { EncounterBadgeModel } from './encounterBadgeModel';
import { ThreadTugBadge } from './ThreadTugBadge';
import type { ThreadTugBadgeModel } from './threadTugBadgeModel';
import { EntityNoticeBadge } from './EntityNoticeBadge';
import type { EntityNoticeBadgeModel } from './entityNoticeBadgeModel';
import { SphereIcon, sphereFromReach } from '../shared/SphereIcon';
import {
  getSustainedStatusLabel,
  getChampionBadgeLabel,
  LAPSE_WARNING_TOOLTIPS,
} from '../../data/sustained-control-status-prose';
import {
  getEncounterActivityIconKey,
  getSelectedEncounterPoolCandidate,
  groupEncounterPoolCandidates,
  summarizeEncounterPoolDominance,
} from './encounterActivityPresentation';
import type { AgentStrategicSummary } from '../../engine/strategicPresentation';
import { getBehaviorFamilyPresentation, STRATEGIC_BADGE_BG_OPACITY } from '../../engine/strategicPresentation';

// ─── Section config ───────────────────────────────────────────────

/**
 * Keys for the right-bar threads panel sections. Includes the five existing
 * thread categories plus two new sustained-control sections (THR-418):
 *  - `hex`: hex-level sustained controls (claims, wards, cultivations).
 *  - `source`: sublocation-level sustained controls (sanctified springs etc.).
 *
 * Location-targeted sustained controls fold into the existing `location` section
 * via `sustainedControlsByLocationId` rather than getting their own section.
 */
type ThreadSectionKey = ThreadCategory | 'hex' | 'source';

const SECTION_ORDER: ThreadSectionKey[] = [
  'agent', 'location', 'faction', 'army', 'artifact',
  'hex', 'source',
];

const SECTION_LABELS: Record<ThreadSectionKey, string> = {
  agent: 'Agents',
  location: 'Locations',
  faction: 'Factions',
  army: 'Armies',
  artifact: 'Artifacts',
  hex: 'Hexes',
  source: 'Sources',
};

/**
 * Thread categories whose rows can carry an entity-notice badge.
 *
 * Agents came first (THR-666); factions joined when faction-scoped news stopped
 * toasting globally (THR-667). Kept as a set rather than inlined equality checks
 * so the next anchor kind is one entry, in one place, matching
 * `EntityNoticeAnchorKind` on the engine side.
 */
const NOTICE_BADGE_CATEGORIES: ReadonlySet<ThreadSectionKey> = new Set<ThreadSectionKey>([
  'agent', 'faction',
]);

const SUSTAINED_CATEGORY_ICON: Record<SustainedControlCategory, ActivityKind> = {
  hex: 'hex-claim',
  source: 'source-bound',
  location: 'claim-flag',
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
  onToggleAttentionMode?: (threadEdgeId: string) => void;
  /** Per-agent strategic summaries for badge display. Only agents with strategic activity will have entries. */
  agentStrategicSummaries?: Map<string, AgentStrategicSummary>;
  /**
   * THR-664: pending encounter notifications keyed by the thread row they anchor
   * to. Replaces the global encounter toast queue — encounter activity shows on
   * the entity's own card.
   */
  encounterBadges?: Map<string, EncounterBadgeModel>;
  /** Opens the encounter modal for a badge's primary notification. */
  onOpenEncounterBadge?: (badge: EncounterBadgeModel) => void;
  /**
   * THR-665: unattended thread tugs keyed by the row they anchor to. Replaces the
   * map's tug vibration — the shaping-tier signal shows on the entity's own card.
   */
  tugBadges?: Map<string, ThreadTugBadgeModel>;
  /** Attends a tug badge's primary tug and selects the agent. */
  onAttendTugBadge?: (badge: ThreadTugBadgeModel) => void;
  /**
   * THR-666: per-agent beats (becomings, complications, milestones) keyed by the
   * row they anchor to. Replaces their global toasts — unthreaded agents never
   * appear here, since the threading gate drops their notifications upstream.
   * THR-667: also keyed by faction node id, for beats inside a threaded faction.
   */
  noticeBadges?: Map<string, EntityNoticeBadgeModel>;
  /** Opens the anchor's thread and clears its pending notices. */
  onOpenNoticeBadge?: (badge: EntityNoticeBadgeModel) => void;
  /**
   * Sustained-control rows from `getSustainedControlNodes`. THR-418 — renders Hexes
   * and Sources sections in the right-bar plus a folded "claim status" line on
   * location rows when an effect targets a thread'd location.
   *
   * Optional for backward compat: when undefined, no new sections appear.
   */
  sustainedControls?: SustainedControlNode[];
  /**
   * Optional callback invoked when a champion chip is clicked (agent rows).
   * Typically opens AgentProfileModal at the appropriate tab.
   */
  onChampionChipClick?: (agentId: string) => void;
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
  onToggleAttentionMode?: (threadEdgeId: string) => void;
  /** Strategic summary for this agent, if they have active strategic activity. */
  strategicSummary?: AgentStrategicSummary;
  /** THR-664: pending encounter notifications anchored to this row, if any. */
  encounterBadge?: EncounterBadgeModel;
  /** Opens the encounter modal for the badge's primary notification. */
  onOpenEncounterBadge?: (badge: EncounterBadgeModel) => void;
  /** THR-665: unattended thread tug anchored to this row, if any. */
  tugBadge?: ThreadTugBadgeModel;
  /** Attends the tug badge's primary tug and selects the agent. */
  onAttendTugBadge?: (badge: ThreadTugBadgeModel) => void;
  /** THR-666/THR-667: unread notices anchored to this row (agent or faction), if any. */
  noticeBadge?: EntityNoticeBadgeModel;
  /** Opens the anchor's thread and clears its pending notices. */
  onOpenNoticeBadge?: (badge: EntityNoticeBadgeModel) => void;
  /**
   * THR-418: optional click handler for the champion chip on agent rows.
   * When omitted, the chip renders as a static badge with no click affordance.
   */
  onChampionChipClick?: (agentId: string) => void;
  /**
   * THR-418: location rows can carry a one-line "claim status" derived from
   * any sustained controls targeting them. Optional.
   */
  locationClaimStatus?: string | null;
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
  onToggleAttentionMode,
  strategicSummary,
  encounterBadge,
  onOpenEncounterBadge,
  tugBadge,
  onAttendTugBadge,
  noticeBadge,
  onOpenNoticeBadge,
  onChampionChipClick,
  locationClaimStatus,
}: CompactThreadRowProps) {
  // THR-418: champion-chip presence only matters for agent rows.
  const championTemplateId = node.category === 'agent' ? node.championTemplateId : null;
  const championLabel = championTemplateId ? getChampionBadgeLabel(championTemplateId) : null;
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
    // THR-664: the location line is gone from agent rows — it duplicates the
    // detail panel and the row needs the space for the encounter badge. The zoom
    // affordance still resolves to the same location.
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

            {/* THR-664: encounter badge — the row's encounter affordance. Pending
                beats and unread aftermath surface here instead of a global toast. */}
            {encounterBadge && onOpenEncounterBadge && (
              <EncounterBadge badge={encounterBadge} onOpen={onOpenEncounterBadge} />
            )}

            {/* THR-665: tug badge — the row's "about to happen" affordance. Replaces
                the map's tug vibration; clicking attends the tug for its stated cost. */}
            {tugBadge && onAttendTugBadge && (
              <ThreadTugBadge badge={tugBadge} onAttend={onAttendTugBadge} />
            )}

            {/* THR-666: notice badge — word of this agent. Becomings, complications
                and milestones land here instead of the global toast queue; agents
                the player holds no thread to never produce one. THR-667: faction
                rows carry the same badge, for shifts inside the faction. */}
            {noticeBadge && onOpenNoticeBadge && (
              <EntityNoticeBadge badge={noticeBadge} onOpen={onOpenNoticeBadge} />
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

          {/* THR-418 — claim status on location rows when a sustained control targets this location */}
          {node.category === 'location' && locationClaimStatus && (
            <div
              data-testid="location-claim-status"
              className="truncate"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                fontStyle: 'italic',
                color: 'var(--text-tertiary)',
                lineHeight: 1.3,
              }}
            >
              {locationClaimStatus}
            </div>
          )}

          {/* THR-418 — champion chip on agent rows when championEffectId is set */}
          {node.category === 'agent' && championLabel && (
            <div>
              <button
                type="button"
                data-testid="champion-chip"
                data-champion-template-id={championTemplateId ?? ''}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onChampionChipClick) onChampionChipClick(node.id);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '1px 6px',
                  border: '1px solid var(--accent-gold)',
                  borderRadius: 999,
                  fontSize: 11, fontFamily: 'var(--font-body)',
                  fontStyle: 'italic', letterSpacing: '0.04em',
                  color: 'var(--accent-gold)',
                  backgroundColor: 'transparent',
                  cursor: onChampionChipClick ? 'pointer' : 'default',
                }}
                aria-label={`${championLabel} — open agent profile`}
              >
                ✦ {championLabel}
              </button>
            </div>
          )}

          {/* THR-479 — Aspect badge on agent rows for living Aspects of the god */}
          {node.category === 'agent' && node.isAspect && (
            <div>
              <span
                data-testid="aspect-badge"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '1px 6px',
                  border: '1px solid var(--sphere-star-bright, var(--accent-gold))',
                  borderRadius: 999,
                  fontSize: 11, fontFamily: 'var(--font-body)',
                  fontStyle: 'italic', letterSpacing: '0.04em',
                  color: 'var(--sphere-star-bright, var(--accent-gold))',
                  backgroundColor: 'transparent',
                }}
                aria-label="An aspect of the god — the apex beyond the five tiers"
                title="An aspect of the god. Beyond the five tiers; permanent; will outlast the body that holds it."
              >
                ❂ Aspect
              </span>
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

          {/* Row 3: auto toggle (agents only).
              THR-664 removed the encounter-pool button and the action chip — both
              duplicate the agent detail panel, and the encounter affordance is now
              the badge in row 1. */}
          {node.category === 'agent' && node.courtPosition && onToggleAttentionMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{ marginLeft: 'auto' }}>
                <AutoToggle
                  on={node.attentionMode === 'auto_resolve'}
                  onToggle={() => onToggleAttentionMode(node.threadEdgeId)}
                />
              </div>
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

// ─── SustainedControlRow (THR-418) ────────────────────────────────

interface SustainedControlRowProps {
  node: SustainedControlNode;
  onCenterOnHex: (hexLabel: string) => void;
}

function formatRunwayTooltip(node: SustainedControlNode): string {
  const cost = node.perTickCostTotal === 0 ? '—' : `−${node.perTickCostTotal.toFixed(0)} per tick`;
  const income = node.perTickIncomeTotal > 0
    ? `+${node.perTickIncomeTotal.toFixed(0)} per tick`
    : null;
  const net = node.netFlow >= 0
    ? `net +${node.netFlow.toFixed(0)} per tick`
    : `net ${node.netFlow.toFixed(0)} per tick`;
  const runway = !Number.isFinite(node.runwayTicks)
    ? 'Runway: indefinite'
    : `Runway: ~${Math.max(0, Math.floor(node.runwayTicks))} ticks at current reserves`;
  const established = `Active ${node.ticksActive} ticks`;
  const parts = [
    income ? `${cost} · ${income} (${net})` : `${cost} (${net})`,
    established,
    runway,
  ];
  return parts.join('\n');
}

function SustainedControlRow({ node, onCenterOnHex }: SustainedControlRowProps) {
  const [hovered, setHovered] = useState(false);
  const sphere = node.primarySphere;
  const borderColor = sphere
    ? `var(--sphere-${sphere})`
    : 'var(--accent-gold-dim)';

  // Sustain-bar fraction: runway / TIGHTENING threshold, clamped to [MIN_VISIBLE, 1].
  let barFraction = 1;
  if (Number.isFinite(node.runwayTicks)) {
    barFraction = Math.max(
      SUSTAIN_BAR_MIN_VISIBLE_FRACTION,
      Math.min(1, node.runwayTicks / SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS),
    );
  }

  const barColor = node.lapseRisk === 'critical'
    ? '#b03030'
    : node.lapseRisk === 'tightening'
      ? '#e0a020'
      : sphere
        ? `var(--sphere-${sphere})`
        : 'var(--accent-gold-dim)';

  const statusLabel = getSustainedStatusLabel(node.templateId, node.lapseRisk);
  const hexLabel = `${node.hexCol},${node.hexRow}`;

  const showLapseTooltip = node.lapseRisk === 'critical';
  const lapseTooltip = LAPSE_WARNING_TOOLTIPS[node.category];

  return (
    <div
      role="listitem"
      data-testid="sustained-control-row"
      data-effect-id={node.effectId}
      data-template-id={node.templateId}
      data-lapse-risk={node.lapseRisk}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `3px solid ${borderColor}`,
        borderTop: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        borderRadius: 4,
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-surface)',
        marginBottom: 2,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px 8px 9px' }}>
        <div style={{ paddingTop: 2, flexShrink: 0 }}>
          <ActivityIcon kind={SUSTAINED_CATEGORY_ICON[node.category]} size={16} color="var(--text-secondary)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span
              className="truncate"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--text-primary)',
                flex: 1,
                minWidth: 0,
              }}
            >
              {node.displayName}
            </span>
            <button
              type="button"
              aria-label={`Center map on ${node.displayName}`}
              onClick={(e) => { e.stopPropagation(); onCenterOnHex(hexLabel); }}
              style={{
                width: 22, height: 22, padding: 0,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="6" />
                <path d="M11 8 L11 14 M8 11 L14 11" />
                <path d="M20 20 L16 16" />
              </svg>
            </button>
          </div>
          <div
            className="truncate"
            title={showLapseTooltip ? lapseTooltip : undefined}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
              color: 'var(--text-tertiary)',
              lineHeight: 1.3,
            }}
          >
            {statusLabel}
            {node.perTickCostTotal > 0 && (
              <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontStyle: 'normal' }}>
                ⤓ {node.perTickCostTotal.toFixed(0)}/tick
              </span>
            )}
            {node.perTickIncomeTotal > 0 && (
              <span style={{ marginLeft: 6, color: 'var(--accent-gold)', fontStyle: 'normal' }}>
                ⤒ {node.perTickIncomeTotal.toFixed(0)}/tick
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        title={formatRunwayTooltip(node)}
        style={{
          position: 'relative', height: 2, borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}
      >
        <div
          data-testid="sustain-bar-fill"
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.round(barFraction * 100)}%`,
            backgroundColor: barColor,
            animation: node.lapseRisk === 'critical' ? 'mark-pulse 1.6s ease-in-out infinite' : undefined,
            transition: 'width 0.6s ease, background-color 0.4s ease',
          }}
        />
      </div>
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
  onToggleAttentionMode,
  agentStrategicSummaries,
  encounterBadges,
  onOpenEncounterBadge,
  tugBadges,
  onAttendTugBadge,
  noticeBadges,
  onOpenNoticeBadge,
  sustainedControls,
  onChampionChipClick,
}: ThreadsPanelProps) {
  // THR-418: bucket sustained controls by category and by parent location id (for folded-in
  // location-targeted effects). Source/hex buckets get their own sections; location targets
  // augment the existing Locations section with a one-line claim status.
  const sustainedByCategory = useMemo(() => {
    const byHex: SustainedControlNode[] = [];
    const bySource: SustainedControlNode[] = [];
    const byLocationId = new Map<string, SustainedControlNode[]>();
    for (const node of sustainedControls ?? []) {
      if (node.category === 'hex') {
        byHex.push(node);
      } else if (node.category === 'source') {
        bySource.push(node);
      } else if (node.category === 'location' && node.targetNodeId) {
        const existing = byLocationId.get(node.targetNodeId) ?? [];
        existing.push(node);
        byLocationId.set(node.targetNodeId, existing);
      }
    }
    return { byHex, bySource, byLocationId };
  }, [sustainedControls]);

  // Section default expansion: agents always open; sustained sections open when any row is
  // non-safe (the player needs to see at-risk controls); everything else collapsed.
  const initialExpansion = useMemo<Record<ThreadSectionKey, boolean>>(() => {
    const hexHasRisk = sustainedByCategory.byHex.some(n => n.lapseRisk !== 'safe');
    const sourceHasRisk = sustainedByCategory.bySource.some(n => n.lapseRisk !== 'safe');
    return {
      agent: true,
      location: false,
      faction: false,
      army: false,
      artifact: false,
      hex: hexHasRisk,
      source: sourceHasRisk,
    };
  // initialExpansion is the *first-render* default; subsequent toggles are user-driven.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [expandedSections, setExpandedSections] = useState<Record<ThreadSectionKey, boolean>>(initialExpansion);
  const [encounterPoolModal, setEncounterPoolModal] = useState<EncounterPoolModalState | null>(null);

  // Suppress unused-prop lint for onZoomToLocation — preserved in signature for callers
  void onZoomToLocation;

  const groups = groupThreadedNodes(threadedNodes);

  const toggleSection = (category: ThreadSectionKey) => {
    setExpandedSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const sustainedCount = (sustainedControls ?? []).length;
  const totalCount = threadedNodes.length + sustainedCount;
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
          // For the existing 5 thread categories, source data is `groups[category]`.
          // For the new sustained sections (`hex`, `source`), it's a SustainedControlNode[].
          const isSustainedSection = category === 'hex' || category === 'source';
          const sustainedGroup: SustainedControlNode[] = category === 'hex'
            ? sustainedByCategory.byHex
            : category === 'source'
              ? sustainedByCategory.bySource
              : [];
          const threadGroup = isSustainedSection
            ? []
            : groups[category as ThreadCategory];
          const groupSize = isSustainedSection ? sustainedGroup.length : threadGroup.length;
          if (groupSize === 0) return null;

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
                data-testid={`threads-section-header-${category}`}
              >
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {chevron}
                </span>
                <SectionHeading ornamental count={groupSize}>{label}</SectionHeading>
              </div>

              {/* Rows */}
              {isExpanded && (
                <div
                  role="list"
                  style={{ padding: '2px var(--space-2) 0' }}
                  data-testid={`threads-section-body-${category}`}
                >
                  {isSustainedSection
                    ? sustainedGroup.map((node) => (
                        <SustainedControlRow
                          key={node.effectId}
                          node={node}
                          onCenterOnHex={onCenterOnHex}
                        />
                      ))
                    : threadGroup.map((node) => {
                        const locationClaims = node.category === 'location'
                          ? sustainedByCategory.byLocationId.get(node.id)
                          : undefined;
                        const claimStatus = locationClaims && locationClaims.length > 0
                          ? getSustainedStatusLabel(locationClaims[0].templateId, locationClaims[0].lapseRisk)
                          : null;
                        return (
                          <CompactThreadRow
                            key={node.id}
                            node={node}
                            isSelected={node.id === selectedNodeId}
                            onNodeSelect={onNodeSelect}
                            onCenterOnHex={onCenterOnHex}
                            activeEncounters={activeEncounters}
                            agentEncounterDecision={node.category === 'agent' ? agentEncounterDecisions?.get(node.id) : undefined}
                            onToggleAttentionMode={onToggleAttentionMode}
                            strategicSummary={node.category === 'agent' ? agentStrategicSummaries?.get(node.id) : undefined}
                            encounterBadge={node.category === 'agent' ? encounterBadges?.get(node.id) : undefined}
                            onOpenEncounterBadge={onOpenEncounterBadge}
                            tugBadge={node.category === 'agent' ? tugBadges?.get(node.id) : undefined}
                            onAttendTugBadge={onAttendTugBadge}
                            noticeBadge={NOTICE_BADGE_CATEGORIES.has(node.category) ? noticeBadges?.get(node.id) : undefined}
                            onOpenNoticeBadge={onOpenNoticeBadge}
                            onChampionChipClick={onChampionChipClick}
                            locationClaimStatus={claimStatus}
                          />
                        );
                      })}
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
