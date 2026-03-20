import React, { useMemo, useState, useCallback } from 'react';
import type { EncounterCacheEntry } from '../../../engine/encounterCache';
import type { EncounterProgress } from '../../../types/encounter';
import { ENCOUNTER_ABANDON_COOLDOWN, ENCOUNTER_COMPLETION_COOLDOWN } from '../../../types/encounter';
import { getAnyEncounterById } from '../../../data/encounter-content';

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
}: EncounterCacheViewProps) {
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  const toggleLocation = useCallback((locId: string) => {
    setExpandedLocation(prev => prev === locId ? null : locId);
  }, []);

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
          filteredActive.map(p => (
            <div key={`${p.actorId}-${p.encounterId}-${p.startedTick}`} style={ENCOUNTER_ITEM_STYLE}>
              <div style={ROW_STYLE}>
                <span style={LABEL_STYLE}>Agent</span>
                <span style={VALUE_STYLE}>{p.actorId.slice(-8)}</span>
              </div>
              <div style={ROW_STYLE}>
                <span style={LABEL_STYLE}>Encounter</span>
                <span style={VALUE_STYLE}>{getEncounterName(p.encounterId)}</span>
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
          ))
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
            return (
              <div key={`${p.actorId}-${p.encounterId}-${p.startedTick}`} style={ENCOUNTER_ITEM_STYLE}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Agent</span>
                  <span style={VALUE_STYLE}>{p.actorId.slice(-8)}</span>
                </div>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>Encounter</span>
                  <span style={VALUE_STYLE}>{getEncounterName(p.encounterId)}</span>
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
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {entries.length} encounters
                </span>
              </div>
              {expandedLocation === locId && entries.map(e => (
                <div key={e.templateId} style={ENCOUNTER_ITEM_STYLE}>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>
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
