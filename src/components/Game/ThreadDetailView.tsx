import React, { useMemo, useState } from 'react';
import type { AgentInfoCardData } from '../../engine/agentDetail';
import type { ThreadedNode, ThreadCategory } from '../../engine/retinue';
import type { WorldGraph } from '../../engine/graph';
import type { BalanceEvent } from '../../types/balanceEval';
import type { DigestEntry } from '../../types/attention';
import type { StrategicRuntimeState } from '../../types/strategicAction';
import type { SimulationRuntime } from '../../engine/simulationRuntime';
import { TIER_COLORS } from '../../data/uiColorPalette';
import { getSphereColor } from '../../data/sphereIcons';
import type { ReachDomain } from '../../types/traits';
import { getFactionNetworkSummary } from '../../engine/factionNetwork';
import { queryDigest } from '../../engine/digestBuffer';
import { RecentActivityLog } from './RecentActivityLog';
import {
  getAgentStrategicSummary,
  getAgentStrategicHistory,
  getBehaviorFamilyPresentation,
} from '../../engine/strategicPresentation';
import {
  buildIntelligenceDisplay,
  INTEL_PANEL_FOG_MIN_TIER,
} from '../../engine/intelligence';
import { getEncounterForeshadowing } from '../../engine/foreshadowing/encounterForeshadowing';
import { AgentIntelligencePanel } from './AgentIntelligencePanel';
import type { IntelligenceRecord } from '../../types/unifiedAction';
import type { ForeshadowingResult } from '../../engine/foreshadowing/types';

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
  agentEncounterDecision?: BalanceEvent | null;
  onClose: () => void;
  onViewProfile: (nodeId: string, category: ThreadCategory) => void;
  onZoomToLocation?: (locationId: string) => void;
  graph?: WorldGraph;
  /** Encounter digest buffer — used to show recent activity for agent nodes. */
  digestBuffer?: DigestEntry[];
  /** Current simulation tick — used to window recent digest entries. */
  currentTick?: number;
  /** Session runtime cache ownership (foreshadowing cache + telemetry refs). */
  runtime?: SimulationRuntime;
  /** The tick at which this agent was last viewed — used to highlight new entries. */
  lastViewedTick?: number;
  /** Strategic runtime state — enables the "Designs" section for agent nodes. */
  strategicState?: StrategicRuntimeState;
  /** Intelligence records — enables the "Intelligence" section for bonded agent nodes. */
  intelligenceRecords?: readonly IntelligenceRecord[];
  /** Resolver for encounter foreshadowing prose (THR-389). Called on row click, results cached in runtime. */
  getForeshadowing?: (agentId: string, encounterId: string) => ForeshadowingResult;
}

export const ThreadDetailView = React.memo(function ThreadDetailView({
  node,
  agentInfoCard,
  agentEncounterDecision,
  onClose,
  onViewProfile,
  onZoomToLocation: _onZoomToLocation,
  graph,
  digestBuffer,
  currentTick,
  runtime,
  lastViewedTick = 0,
  strategicState,
  intelligenceRecords,
  getForeshadowing,
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
          <AgentDetailBody
            node={node}
            agentInfoCard={agentInfoCard}
            agentEncounterDecision={agentEncounterDecision}
            digestBuffer={digestBuffer}
            currentTick={currentTick}
            runtime={runtime}
            lastViewedTick={lastViewedTick}
            strategicState={strategicState}
            graph={graph}
            intelligenceRecords={intelligenceRecords}
            getForeshadowing={getForeshadowing}
          />
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

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 'var(--space-2)',
        border: '1px solid color-mix(in srgb, var(--border-gold) 45%, transparent)',
        borderRadius: '8px',
        backgroundColor: 'color-mix(in srgb, var(--bg-deep) 70%, transparent)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          marginBottom: 'var(--space-1)',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {children}
      </div>
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

function getVisibleEncounterPool(decision?: BalanceEvent | null): number | null {
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

function formatActivityLabel(
  activityLabel: string,
  decision?: BalanceEvent | null,
): string {
  const visiblePool = getVisibleEncounterPool(decision);
  if (visiblePool === null) return activityLabel;
  const noun = visiblePool === 1 ? 'option' : 'options';
  return `${activityLabel} (from ${visiblePool} ${noun})`;
}

function formatDecisionType(decisionType?: string): string {
  switch (decisionType) {
    case 'start_local': return 'Start Local';
    case 'attempt_remote': return 'Attempt Remote';
    case 'queue_movement': return 'Queue Movement';
    case 'forced_travel': return 'Forced Travel';
    case 'idle': return 'Idle';
    case 'strategic_instant': return 'Strategic Action';
    case 'strategic_project': return 'Strategic Project';
    case 'strategic_control': return 'Strategic Control';
    default: return 'Unknown';
  }
}

function formatIdleReason(idleReason?: string): string | null {
  if (!idleReason) return null;
  switch (idleReason) {
    case 'no_candidates_after_filter': return 'No candidates after filter';
    case 'no_candidates_after_cooldown': return 'All candidates on cooldown';
    case 'below_score_threshold': return 'Best score below threshold';
    default: return idleReason.replaceAll('_', ' ');
  }
}

function EncounterDecisionPanel({
  decision,
  agentId,
  graph,
  runtime,
  tick,
}: {
  decision: BalanceEvent;
  agentId: string;
  graph?: WorldGraph;
  runtime?: SimulationRuntime;
  tick?: number;
}) {
  const visiblePool = getVisibleEncounterPool(decision);
  const stages = [
    { label: 'Cached', value: decision.filterCacheSize },
    { label: 'Awareness', value: decision.filterAfterAwareness },
    { label: 'Visibility', value: decision.filterAfterVisibility },
    { label: 'Prereqs', value: decision.filterAfterPrerequisites },
    { label: 'Threat', value: decision.filterAfterThreat },
    { label: 'Capability', value: decision.filterAfterCap },
    { label: 'Cooldown', value: decision.candidatesAfterCooldown },
  ].filter(stage => stage.value !== undefined);
  const rankedPool = decision.rankedEncounterPool ?? [];

  const foreshadowingByCandidate = useMemo(() => {
    const results = new Map<string, string>();
    if (!graph || !runtime || tick === undefined) return results;
    for (const candidate of rankedPool) {
      try {
        const foreshadowing = getEncounterForeshadowing({
          runtime,
          graph,
          tick,
          agentId,
          decision,
          candidate,
        });
        results.set(`${candidate.rank}:${candidate.templateId}:${candidate.locationId}`, foreshadowing.prose);
      } catch {
        // Fail-soft: one bad candidate must not collapse the panel.
      }
    }
    return results;
  }, [agentId, decision, graph, rankedPool, runtime, tick]);

  const isStrategic = decision.decisionType?.startsWith('strategic_');

  return (
    <DetailSection title={isStrategic ? 'Strategic Action' : 'Encounter Pool'}>
      {!isStrategic && visiblePool !== null && (
        <DetailField label="Viable now" value={visiblePool} />
      )}
      <DetailField label="Decision" value={formatDecisionType(decision.decisionType)} />
      {decision.templateId && (
        <DetailField label="Template" value={decision.templateId} />
      )}
      {decision.targetLocationSubtype && (
        <DetailField label="Heading" value={decision.targetLocationSubtype} />
      )}
      {decision.travelCost !== undefined && decision.travelCost > 0 && (
        <DetailField label="Travel cost" value={decision.travelCost} />
      )}
      {decision.bestScore !== undefined && (
        <DetailField label="Best score" value={decision.bestScore.toFixed(2)} />
      )}
      {formatIdleReason(decision.idleReason) && (
        <DetailField label="Idle reason" value={formatIdleReason(decision.idleReason)!} />
      )}
      {stages.length > 0 && (
        <DetailField
          label="Funnel"
          value={stages.map(stage => `${stage.label} ${stage.value}`).join(' -> ')}
        />
      )}
      {!isStrategic && rankedPool.length > 0 && (
        <div style={{ marginTop: 'var(--space-1)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: '4px' }}>
            Ranked options
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {rankedPool.map(candidate => {
              const key = `${candidate.rank}:${candidate.templateId}:${candidate.locationId}`;
              const prose = foreshadowingByCandidate.get(key);
              return (
                <details key={key} style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 6px' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                    #{candidate.rank} {candidate.templateName} @ {candidate.locationName} (score {candidate.finalScore.toFixed(2)})
                  </summary>
                  {prose && (
                    <div style={{ marginTop: '6px', color: 'var(--text-primary)', fontSize: 'var(--text-xs)', lineHeight: 1.4 }}>
                      {prose}
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </div>
      )}
    </DetailSection>
  );
}

// Agent detail body
function AgentDetailBody({
  node,
  agentInfoCard,
  agentEncounterDecision,
  digestBuffer,
  currentTick,
  runtime,
  lastViewedTick = 0,
  strategicState,
  graph,
  intelligenceRecords,
  getForeshadowing,
}: {
  node: import('../../engine/retinue').ThreadedAgent;
  agentInfoCard?: AgentInfoCardData | null;
  agentEncounterDecision?: BalanceEvent | null;
  digestBuffer?: DigestEntry[];
  currentTick?: number;
  runtime?: SimulationRuntime;
  lastViewedTick?: number;
  strategicState?: StrategicRuntimeState;
  graph?: WorldGraph;
  intelligenceRecords?: readonly IntelligenceRecord[];
  getForeshadowing?: (agentId: string, encounterId: string) => ForeshadowingResult;
}) {
  const activityLabel = node.activityLabel
    ? formatActivityLabel(node.activityLabel, agentEncounterDecision)
    : null;

  const strategicSummary = useMemo(() => {
    if (!strategicState || !graph || currentTick === undefined) return null;
    return getAgentStrategicSummary(strategicState, node.id, graph, currentTick);
  }, [strategicState, node.id, graph, currentTick]);

  const strategicHistory = useMemo(() => {
    if (!strategicState || currentTick === undefined) return [];
    return getAgentStrategicHistory(strategicState, node.id, currentTick);
  }, [strategicState, node.id, currentTick]);

  const recentEntries = useMemo(() => {
    if (!digestBuffer) return [];
    return queryDigest(digestBuffer, {
      agentId: node.id,
      fromTick: Math.max(0, (currentTick ?? 0) - 48),
      toTick: currentTick ?? 999,
    });
  }, [digestBuffer, currentTick, node.id]);

  const intelligenceEntries = useMemo(
    () => buildIntelligenceDisplay(intelligenceRecords, node.id, graph, currentTick),
    [intelligenceRecords, node.id, graph, currentTick],
  );

  const isStranger = node.tier < INTEL_PANEL_FOG_MIN_TIER;

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
        {activityLabel && (
          <DetailField label="Activity" value={activityLabel} />
        )}

        {agentEncounterDecision && (
          <EncounterDecisionPanel
            decision={agentEncounterDecision}
            agentId={node.id}
            graph={graph}
            runtime={runtime}
            tick={currentTick}
          />
        )}

        {/* Recent Activity Log — background encounter digest for this agent */}
        {recentEntries.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
            <RecentActivityLog entries={recentEntries} lastViewedTick={lastViewedTick} />
          </div>
        )}

        {/* Designs — strategic activity for this agent */}
        {strategicSummary && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-1)' }}>
              Designs
            </div>
            {strategicSummary.activeProject && (() => {
              const pres = getBehaviorFamilyPresentation(strategicSummary.behaviorFamily);
              return (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: pres.color }}>{pres.glyph}</span>
                  {' '}{strategicSummary.activeProject.displayName}
                  <span style={{ color: 'var(--text-muted)' }}> — {strategicSummary.activeProject.progressLabel}</span>
                </div>
              );
            })()}
            {strategicSummary.primaryControl && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
                {strategicSummary.primaryControl.targetName}
                <span style={{ color: 'var(--text-muted)' }}> — {strategicSummary.primaryControl.healthLabel}</span>
              </div>
            )}
            {strategicHistory.length > 0 && (
              <div style={{ marginTop: 'var(--space-1)' }}>
                {strategicHistory.slice(0, 3).map((entry, i) => (
                  <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    <span style={{ color: entry.outcome === 'completed' ? '#6a9a6e' : entry.outcome === 'failed' ? '#b85450' : 'var(--text-muted)' }}>
                      {entry.outcome === 'completed' ? '✓' : entry.outcome === 'failed' ? '✕' : '—'}
                    </span>
                    {' '}{entry.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Intelligence — what this agent knows */}
        <AgentIntelligencePanel entries={intelligenceEntries} isStranger={isStranger} />
      </>
    );
  }

  // Fallback when no agentInfoCard
  return (
    <>
      {node.locationName && (
        <DetailField label="Location" value={node.locationName} />
      )}
      {activityLabel && (
        <DetailField label="Activity" value={activityLabel} />
      )}
      {node.factionName && (
        <DetailField label="Faction" value={node.factionName} />
      )}
      {agentEncounterDecision && (
        <EncounterDecisionPanel
          decision={agentEncounterDecision}
          agentId={node.id}
          graph={graph}
          runtime={runtime}
          tick={currentTick}
        />
      )}

      {/* Recent Activity Log — background encounter digest for this agent */}
      {recentEntries.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
          <RecentActivityLog entries={recentEntries} lastViewedTick={lastViewedTick} />
        </div>
      )}

      {/* Intelligence — what this agent knows */}
      <AgentIntelligencePanel entries={intelligenceEntries} isStranger={isStranger} />
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
