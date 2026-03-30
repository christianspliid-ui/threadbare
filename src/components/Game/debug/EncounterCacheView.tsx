import React, { useMemo, useState, useCallback } from 'react';
import type { EncounterCacheEntry } from '../../../engine/encounterCache';
import type { EncounterProgress } from '../../../types/encounter';
import { ENCOUNTER_ABANDON_COOLDOWN, ENCOUNTER_COMPLETION_COOLDOWN } from '../../../types/encounter';
import { getAnyEncounterById } from '../../../data/encounter-content';
import type { WorldGraph } from '../../../engine/graph';
import type { GraphNode } from '../../../types/graph';
import { getTimeline, getTrackedAgentIds } from '../../../engine/encounterTimeline';
import { formatEncounterLog, makeFilename, formatAllAgentsLog, makeAllAgentsFilename } from '../../../engine/encounterLogExporter';
import { getLocationEncounterHistory, getAgentEncounterHistory, EVENT_NODE_ID_PREFIX } from '../../../engine/encounterEventNode';

// ─── Styles ─────────────────────────────────────────────────────

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '12px',
  padding: '8px',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: 'monospace',
  color: 'var(--text-primary)',
};

const HEADING_STYLE: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  color: 'var(--accent-gold)',
  marginBottom: '6px',
};

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 0',
  gap: '8px',
};

const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--text-muted)',
  minWidth: '100px',
};

const VALUE_STYLE: React.CSSProperties = {
  color: 'var(--text-primary)',
  textAlign: 'right' as const,
  flex: 1,
};

const LOCATION_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 0',
  borderBottom: '1px solid var(--border-subtle)',
  cursor: 'pointer',
};

const ENCOUNTER_ITEM_STYLE: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '11px',
  borderLeft: '2px solid var(--border-subtle)',
  marginLeft: '8px',
  marginBottom: '2px',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  abandoned: '#f87171',
  completed: '#60a5fa',
};

const OUTCOME_COLORS: Record<string, string> = {
  success: '#4ade80',
  critical_success: '#facc15',
  failure: '#f87171',
  critical_failure: '#ef4444',
};

const CLICKABLE_NAME_STYLE: React.CSSProperties = {
  color: 'var(--accent-gold)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  textUnderlineOffset: '2px',
};

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '16px',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: '12px',
  opacity: 0.6,
};

// ─── Types ──────────────────────────────────────────────────────

export interface EncounterCacheViewProps {
  cacheEntries: readonly EncounterCacheEntry[];
  encounterProgress: readonly EncounterProgress[];
  currentTick: number;
  followAgentId?: string;
  /** Callback to zoom the map to a location's hex */
  onZoomToLocation?: (locationId: string) => void;
  /** World graph for looking up location names */
  graph?: WorldGraph;
  /** World seed for log export header */
  seed?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function getCooldownEnd(p: EncounterProgress): number {
  const lastStep = p.history[p.history.length - 1];
  const endTick = lastStep?.tick ?? p.startedTick;
  if (p.status === 'abandoned') return endTick + ENCOUNTER_ABANDON_COOLDOWN;
  if (p.status === 'completed') return endTick + ENCOUNTER_COMPLETION_COOLDOWN;
  return 0;
}

function getEncounterName(id: string): string {
  return getAnyEncounterById(id)?.name ?? id;
}

// ─── Component ──────────────────────────────────────────────────

export const EncounterCacheView = React.memo(function EncounterCacheView({
  cacheEntries,
  encounterProgress,
  currentTick,
  followAgentId,
  onZoomToLocation,
  graph,
  seed,
}: EncounterCacheViewProps) {
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [selectedExportAgent, setSelectedExportAgent] = useState<string | null>(null);

  const toggleLocation = useCallback((locId: string) => {
    setExpandedLocation(prev => prev === locId ? null : locId);
  }, []);

  // Build agent list for export dropdown from graph (all individual actors)
  const exportAgents = useMemo(() => {
    if (!graph) return [];
    const actors = graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual')
      .map(n => ({ id: n.id, name: n.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return actors;
  }, [graph]);

  // Auto-select followed agent or first tracked agent
  const effectiveExportAgent = selectedExportAgent ?? followAgentId ?? null;

  const handleExportLog = useCallback(() => {
    if (!effectiveExportAgent) return;
    const timeline = getTimeline(effectiveExportAgent);
    const agentNode = graph?.getNode(effectiveExportAgent);
    const agentName = agentNode?.name ?? effectiveExportAgent;
    const seedStr = seed != null ? String(seed) : 'unknown';
    const tickRange: [number, number] = timeline.length > 0
      ? [timeline[0].tick, timeline[timeline.length - 1].tick]
      : [0, 0];

    const tsv = formatEncounterLog(timeline, {
      agentId: effectiveExportAgent,
      agentName,
      seed: seedStr,
      tickRange,
    });

    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = makeFilename(seedStr, agentName);
    a.click();
    URL.revokeObjectURL(url);
  }, [effectiveExportAgent, graph, seed]);

  // Check if any agents have timeline data (recomputed each render — cheap call)
  const hasTrackedAgents = getTrackedAgentIds().length > 0;

  const handleExportAllLogs = useCallback(() => {
    const trackedIds = getTrackedAgentIds();
    if (trackedIds.length === 0) return;
    const seedStr = seed != null ? String(seed) : 'unknown';
    const agents = trackedIds.map(id => {
      const node = graph?.getNode(id);
      return { id, name: node?.name ?? id, timeline: getTimeline(id) };
    });

    const tsv = formatAllAgentsLog(agents, seedStr);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = makeAllAgentsFilename(seedStr);
    a.click();
    URL.revokeObjectURL(url);
  }, [graph, seed]);

  // Map templateId → locationId for encounter progress lookups
  const templateToLocation = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of cacheEntries) {
      map.set(entry.templateId, entry.locationId);
    }
    return map;
  }, [cacheEntries]);

  // Group cache entries by location
  const byLocation = useMemo(() => {
    const map = new Map<string, EncounterCacheEntry[]>();
    for (const entry of cacheEntries) {
      const existing = map.get(entry.locationId);
      if (existing) existing.push(entry);
      else map.set(entry.locationId, [entry]);
    }
    return map;
  }, [cacheEntries]);

  // Active encounters
  const activeEncounters = useMemo(
    () => encounterProgress.filter(p => p.status === 'active'),
    [encounterProgress],
  );

  // Cooldowns (abandoned/completed with remaining cooldown)
  const activeCooldowns = useMemo(() => {
    return encounterProgress.filter(p => {
      if (p.status === 'active') return false;
      return getCooldownEnd(p) > currentTick;
    });
  }, [encounterProgress, currentTick]);

  // Filter to followed agent if set
  const filteredActive = followAgentId
    ? activeEncounters.filter(p => p.actorId === followAgentId)
    : activeEncounters;

  const filteredCooldowns = followAgentId
    ? activeCooldowns.filter(p => p.actorId === followAgentId)
    : activeCooldowns;

  return (
    <div data-testid="encounter-cache-view">
      {/* Export Controls */}
      <div style={{ ...SECTION_STYLE, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <label style={{ ...LABEL_STYLE, minWidth: 'auto', fontSize: '11px' }}>Export Log:</label>
        <select
          value={effectiveExportAgent ?? ''}
          onChange={(e) => setSelectedExportAgent(e.target.value || null)}
          style={{
            flex: 1,
            background: 'var(--bg-deep)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            padding: '3px 6px',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          <option value="">Select agent...</option>
          {exportAgents.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
          ))}
        </select>
        <button
          onClick={handleExportLog}
          disabled={!effectiveExportAgent}
          title={effectiveExportAgent ? 'Export encounter timeline as TSV' : 'Select an agent'}
          style={{
            background: effectiveExportAgent ? 'var(--accent-gold)' : 'var(--bg-deep)',
            color: effectiveExportAgent ? 'var(--bg-deep)' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
            cursor: effectiveExportAgent ? 'pointer' : 'not-allowed',
            opacity: effectiveExportAgent ? 1 : 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          Export TSV
        </button>
        <button
          onClick={handleExportAllLogs}
          disabled={!hasTrackedAgents}
          title="Export all tracked agents' encounter timelines as a single TSV"
          style={{
            background: hasTrackedAgents ? 'var(--accent-gold)' : 'var(--bg-deep)',
            color: hasTrackedAgents ? 'var(--bg-deep)' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
            cursor: hasTrackedAgents ? 'pointer' : 'not-allowed',
            opacity: hasTrackedAgents ? 1 : 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          Export All
        </button>
      </div>

      {/* Summary Stats */}
      <div style={SECTION_STYLE}>
        <div style={HEADING_STYLE}>Cache Summary</div>
        <div style={ROW_STYLE}>
          <span style={LABEL_STYLE}>Total entries</span>
          <span style={VALUE_STYLE}>{cacheEntries.length}</span>
        </div>
        <div style={ROW_STYLE}>
          <span style={LABEL_STYLE}>Locations</span>
          <span style={VALUE_STYLE}>{byLocation.size}</span>
        </div>
        <div style={ROW_STYLE}>
          <span style={LABEL_STYLE}>Active encounters</span>
          <span style={VALUE_STYLE}>{activeEncounters.length}</span>
        </div>
        <div style={ROW_STYLE}>
          <span style={LABEL_STYLE}>On cooldown</span>
          <span style={VALUE_STYLE}>{activeCooldowns.length}</span>
        </div>
      </div>

      {/* Active Encounters */}
      <div style={SECTION_STYLE}>
        <div style={HEADING_STYLE}>
          Active Encounters {followAgentId ? '(filtered)' : ''}
        </div>
        {filteredActive.length === 0 ? (
          <div style={EMPTY_STATE_STYLE}>No active encounters</div>
        ) : (
          filteredActive.map(p => {
            const locId = templateToLocation.get(p.encounterId);
            return (
            <div key={`${p.actorId}-${p.encounterId}-${p.startedTick}`} style={ENCOUNTER_ITEM_STYLE}>
              <div style={ROW_STYLE}>
                <span style={LABEL_STYLE}>Agent</span>
                <span style={VALUE_STYLE}>{p.actorId.slice(-8)}</span>
              </div>
              <div style={ROW_STYLE}>
                <span style={LABEL_STYLE}>Encounter</span>
                <span
                  style={{ ...VALUE_STYLE, ...(onZoomToLocation && locId ? CLICKABLE_NAME_STYLE : {}) }}
                  onClick={onZoomToLocation && locId ? () => onZoomToLocation(locId) : undefined}
                  title={locId ? `Zoom to ${locId}` : undefined}
                >
                  {getEncounterName(p.encounterId)}
                </span>
              </div>
              <div style={ROW_STYLE}>
                <span style={LABEL_STYLE}>Step</span>
                <span style={VALUE_STYLE}>
                  {p.currentEncounterIndex + 1}
                  {p.occupiedUntilTick != null && (
                    <> (busy until tick {p.occupiedUntilTick})</>
                  )}
                </span>
              </div>
              <div style={ROW_STYLE}>
                <span style={LABEL_STYLE}>Status</span>
                <span style={{ ...VALUE_STYLE, color: STATUS_COLORS[p.status] }}>{p.status}</span>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Cooldowns */}
      <div style={SECTION_STYLE}>
        <div style={HEADING_STYLE}>
          Cooldowns {followAgentId ? '(filtered)' : ''}
        </div>
        {filteredCooldowns.length === 0 ? (
          <div style={EMPTY_STATE_STYLE}>No active cooldowns</div>
        ) : (
          filteredCooldowns.map(p => {
            const end = getCooldownEnd(p);
            const remaining = end - currentTick;
            const locId = templateToLocation.get(p.encounterId);
            return (
              <div key={`${p.actorId}-${p.encounterId}-${p.startedTick}`} style={ENCOUNTER_ITEM_STYLE}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Agent</span>
                  <span style={VALUE_STYLE}>{p.actorId.slice(-8)}</span>
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Encounter</span>
                  <span
                    style={{ ...VALUE_STYLE, ...(onZoomToLocation && locId ? CLICKABLE_NAME_STYLE : {}) }}
                    onClick={onZoomToLocation && locId ? () => onZoomToLocation(locId) : undefined}
                    title={locId ? `Zoom to ${locId}` : undefined}
                  >
                    {getEncounterName(p.encounterId)}
                  </span>
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Reason</span>
                  <span style={{ ...VALUE_STYLE, color: STATUS_COLORS[p.status] }}>{p.status}</span>
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Remaining</span>
                  <span style={VALUE_STYLE}>{remaining} ticks (ends tick {end})</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event History (TB-077 Phase 1D) */}
      <EventHistorySection
        graph={graph}
        followAgentId={followAgentId}
        currentTick={currentTick}
      />

      {/* Cache by Location */}
      <div style={SECTION_STYLE}>
        <div style={HEADING_STYLE}>Cache by Location</div>
        {byLocation.size === 0 ? (
          <div style={EMPTY_STATE_STYLE}>Cache empty</div>
        ) : (
          Array.from(byLocation.entries()).map(([locId, entries]) => (
            <div key={locId}>
              <div
                style={LOCATION_ROW_STYLE}
                onClick={() => toggleLocation(locId)}
              >
                <span style={{ color: 'var(--text-primary)' }}>
                  {expandedLocation === locId ? '\u25BC' : '\u25B6'} {locId}
                  {graph && (() => { const n = graph.getNode(locId); return n ? ` (${n.name})` : ''; })()}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {entries.length} encounters
                </span>
              </div>
              {expandedLocation === locId && entries.map(e => (
                <div key={e.templateId} style={ENCOUNTER_ITEM_STYLE}>
                  <div
                    style={{
                      marginBottom: '2px',
                      ...(onZoomToLocation ? CLICKABLE_NAME_STYLE : { color: 'var(--text-primary)' }),
                    }}
                    onClick={onZoomToLocation ? () => onZoomToLocation(e.locationId) : undefined}
                    title={`Zoom to ${e.locationId}`}
                  >
                    {getEncounterName(e.templateId)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    {e.reachPrimary}/{e.reachSecondary} | {e.encounterType} | {e.threatRating} | {e.stepCount} steps | ~{e.totalTickCost} ticks | reward {e.successRewardEstimate.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// ─── Event History Section (TB-077 Phase 1D) ───────────────────

function formatEventTick(tick: number, currentTick: number): string {
  const ago = currentTick - tick;
  return ago === 0 ? 'this tick' : `${ago} tick${ago === 1 ? '' : 's'} ago`;
}

function EventNodeRow({ event, currentTick }: { event: GraphNode; currentTick: number }) {
  const outcome = event.properties.outcome as string;
  const color = OUTCOME_COLORS[outcome] ?? 'var(--text-muted)';
  return (
    <div style={{ ...ENCOUNTER_ITEM_STYLE, borderLeftColor: color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
        <span style={{ color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.name}
        </span>
        <span style={{ color, fontWeight: 600, whiteSpace: 'nowrap', fontSize: '10px' }}>
          {outcome?.replace('_', ' ')}
        </span>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
        {event.properties.reachTested} | {event.properties.encounterType} | tick {event.properties.tick as number} ({formatEventTick(event.properties.tick as number, currentTick)})
      </div>
    </div>
  );
}

const EventHistorySection = React.memo(function EventHistorySection({
  graph,
  followAgentId,
  currentTick,
}: {
  graph?: WorldGraph;
  followAgentId?: string;
  currentTick: number;
}) {
  const [expandedLoc, setExpandedLoc] = useState<string | null>(null);

  // Count total event nodes in the graph
  const eventNodeCount = useMemo(() => {
    if (!graph) return 0;
    return graph.getNodesByType('event')
      .filter(n => n.properties.eventType === 'encounter_outcome').length;
  }, [graph, currentTick]); // re-count when tick changes

  // Agent encounter history (if following an agent)
  const agentHistory = useMemo(() => {
    if (!graph || !followAgentId) return [];
    return getAgentEncounterHistory(graph, followAgentId, 10);
  }, [graph, followAgentId, currentTick]);

  // Top locations by event count (most active locations)
  const topLocations = useMemo(() => {
    if (!graph) return [];
    // Find all locations that have occurred_at edges
    const locationCounts = new Map<string, number>();
    const eventNodes = graph.getNodesByType('event')
      .filter(n => n.properties.eventType === 'encounter_outcome');
    for (const evt of eventNodes) {
      const edges = graph.getOutgoingEdges(evt.id, 'occurred_at');
      for (const e of edges) {
        locationCounts.set(e.target, (locationCounts.get(e.target) ?? 0) + 1);
      }
    }
    return Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([locId, count]) => ({
        id: locId,
        name: graph.getNode(locId)?.name ?? locId,
        count,
      }));
  }, [graph, currentTick]);

  // Events for expanded location
  const expandedLocEvents = useMemo(() => {
    if (!graph || !expandedLoc) return [];
    return getLocationEncounterHistory(graph, expandedLoc, 10);
  }, [graph, expandedLoc, currentTick]);

  if (!graph) return null;

  return (
    <div style={SECTION_STYLE}>
      <div style={HEADING_STYLE}>Event History (Graph Nodes)</div>

      {/* Summary row */}
      <div style={ROW_STYLE}>
        <span style={LABEL_STYLE}>Event nodes</span>
        <span style={VALUE_STYLE}>{eventNodeCount}</span>
      </div>
      <div style={ROW_STYLE}>
        <span style={LABEL_STYLE}>Locations with history</span>
        <span style={VALUE_STYLE}>{topLocations.length}</span>
      </div>

      {/* Agent history (when following) */}
      {followAgentId && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ ...HEADING_STYLE, fontSize: '10px', color: 'var(--text-secondary)' }}>
            Followed Agent History ({agentHistory.length})
          </div>
          {agentHistory.length === 0 ? (
            <div style={{ ...EMPTY_STATE_STYLE, padding: '6px' }}>No encounter history yet</div>
          ) : (
            agentHistory.map(evt => (
              <EventNodeRow key={evt.id} event={evt} currentTick={currentTick} />
            ))
          )}
        </div>
      )}

      {/* Top locations by event count */}
      {topLocations.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ ...HEADING_STYLE, fontSize: '10px', color: 'var(--text-secondary)' }}>
            Most Active Locations
          </div>
          {topLocations.map(loc => (
            <div key={loc.id}>
              <div
                style={{ ...LOCATION_ROW_STYLE, cursor: 'pointer' }}
                onClick={() => setExpandedLoc(prev => prev === loc.id ? null : loc.id)}
              >
                <span style={{ color: 'var(--text-primary)' }}>
                  {expandedLoc === loc.id ? '\u25BC' : '\u25B6'} {loc.name}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {loc.count} event{loc.count === 1 ? '' : 's'}
                </span>
              </div>
              {expandedLoc === loc.id && expandedLocEvents.map(evt => (
                <EventNodeRow key={evt.id} event={evt} currentTick={currentTick} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
