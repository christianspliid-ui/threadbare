import React from 'react';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import type { PendingVignette } from '../../../types/journeyEngine';

const TEXT_COLOR = 'var(--text-primary)';

export interface JourneyDebugContentProps {
  encounterNotifications?: readonly EncounterNotification[];
  pendingVignettes?: readonly PendingVignette[];
  currentTick: number;
}

export function JourneyDebugContent({
  encounterNotifications,
  pendingVignettes,
  currentTick: _currentTick,
}: JourneyDebugContentProps) {
  const notifications = encounterNotifications ?? [];
  const vignettes = pendingVignettes ?? [];

  return (
    <div style={{ fontSize: '12px', color: TEXT_COLOR }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--accent-gold)' }}>
          Pending Vignettes ({vignettes.length})
        </div>
        {vignettes.length === 0 ? (
          <div style={{ opacity: 0.4, fontStyle: 'italic' }}>No pending vignettes.</div>
        ) : (
          vignettes.map(v => (
            <div
              key={v.id}
              style={{
                padding: '6px 8px',
                marginBottom: '4px',
                background: 'var(--bg-raised)',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontWeight: 500 }}>{v.data.agentName} — {v.data.phase}</div>
              <div style={{ opacity: 0.7, fontSize: '11px' }}>
                Beat {v.data.beatIndex + 1} | Template: {v.data.templateId}
                {v.data.isOrdeal && <span style={{ color: '#ffd700', marginLeft: '6px' }}>ORDEAL</span>}
              </div>
              <div style={{ opacity: 0.6, fontSize: '11px', marginTop: '2px' }}>
                {v.data.choices.length} choice{v.data.choices.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--accent-gold)' }}>
          Encounter Notifications ({notifications.length})
        </div>
        {notifications.length === 0 ? (
          <div style={{ opacity: 0.4, fontStyle: 'italic' }}>No active encounter notifications.</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              style={{
                padding: '6px 8px',
                marginBottom: '4px',
                background: 'var(--bg-raised)',
                borderRadius: '4px',
                border: `1px solid ${n.resolved ? 'var(--border-subtle)' : 'var(--accent-gold)'}`,
                opacity: n.resolved ? 0.5 : 1,
              }}
            >
              <div style={{ fontWeight: 500 }}>
                {n.agentName} — {n.encounterName}
                {n.courtPosition && (
                  <span style={{ opacity: 0.6, marginLeft: '6px', fontSize: '11px' }}>
                    [{n.courtPosition}]
                  </span>
                )}
              </div>
              <div style={{ opacity: 0.7, fontSize: '11px' }}>{n.prose}</div>
              <div style={{ opacity: 0.5, fontSize: '11px', marginTop: '2px' }}>
                Created tick {n.createdTick}
                {n.autoResolveTick != null && ` | Auto-resolve tick ${n.autoResolveTick}`}
                {n.viewed && ' | Viewed'}
                {n.resolved && ' | Resolved'}
                {` | ${n.choices.length} choices`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
