import React, { useState } from 'react';
import type { PendingEncounterSeed } from '../../../types/unifiedAction';
import type { RetinueAgent } from '../../../engine/retinue';
import type { RegionDetectionState } from '../../../types/gameState';
import {
  DETECTION_THRESHOLD_ENCOUNTER,
  DETECTION_THRESHOLD_NOTICE,
  DETECTION_THRESHOLD_TURN,
} from '../../../data/encounter-experience-constants';
import { TRACE_CATEGORY_COLORS } from '../../../data/uiColorPalette';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

const ENCOUNTER_SEED_READY_LOOKAHEAD = 0;

interface EncounterSeedsTabProps {
  seeds: readonly PendingEncounterSeed[];
  currentTick: number;
  retinueAgents?: readonly RetinueAgent[];
  regionalDetectionPressure?: readonly RegionDetectionState[];
}

type FilterMode = 'all' | 'ready' | 'waiting';

function resolveAgentName(id: string, retinueAgents?: readonly RetinueAgent[]): string {
  return retinueAgents?.find(a => a.id === id)?.name ?? `${id.slice(-8)} (unresolved)`;
}

function truncateId(id: string): string {
  return id.length > 8 ? `…${id.slice(-8)}` : id;
}

const MONO: React.CSSProperties = { fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' };

function SeedRow({ seed, currentTick, retinueAgents }: { seed: PendingEncounterSeed; currentTick: number; retinueAgents?: readonly RetinueAgent[] }) {
  const isReady = seed.eligibleAfterTick <= currentTick + ENCOUNTER_SEED_READY_LOOKAHEAD;
  const tickDelta = seed.eligibleAfterTick - currentTick;
  const ticksAgo = currentTick - seed.plantedTick;
  const templateColor = TRACE_CATEGORY_COLORS['encounter_seed_triggered'] ?? '#0d9488';
  const familyColor = TRACE_CATEGORY_COLORS['encounter_seed_planted'] ?? '#2dd4bf';

  return (
    <div style={{
      fontSize: 'var(--text-xs)', color: 'var(--text-primary)',
      borderLeft: `2px solid ${isReady ? templateColor : 'var(--border-subtle)'}`,
      paddingLeft: '6px', marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ flex: 1, fontWeight: 500 }}>{seed.seedLabel}</span>
        <span style={{
          fontSize: 'var(--text-xs)',
          color: isReady ? templateColor : 'var(--text-muted)',
          fontWeight: isReady ? 600 : 400,
        }}>
          {isReady ? '● ready' : `+${tickDelta}t`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
        {seed.templateId ? (
          <span style={{
            fontSize: 'var(--text-xs)', color: templateColor,
            background: `color-mix(in srgb, ${templateColor} 10%, transparent)`,
            padding: '1px 4px', borderRadius: '2px',
          }}>
            tmpl: {seed.templateId}
          </span>
        ) : (
          <span style={{
            fontSize: 'var(--text-xs)', color: familyColor,
            background: `color-mix(in srgb, ${familyColor} 10%, transparent)`,
            padding: '1px 4px', borderRadius: '2px',
          }}>
            family: {seed.encounterFamily ?? '—'}
          </span>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
          → {resolveAgentName(seed.targetAgentId, retinueAgents)}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginLeft: 'auto' }}>
          pri {seed.priority}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
        <span style={MONO} title={seed.seedId}>{truncateId(seed.seedId)}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>planted tick {seed.plantedTick} ({ticksAgo}t ago)</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
        <span style={MONO} title={seed.sourceEncounterId}>enc: {truncateId(seed.sourceEncounterId)}</span>
        <span style={MONO} title={seed.sourceReactionId}>rx: {truncateId(seed.sourceReactionId)}</span>
      </div>
    </div>
  );
}

function describeDetectionBand(pressure: number): string {
  if (pressure >= DETECTION_THRESHOLD_ENCOUNTER) return 'encounter';
  if (pressure >= DETECTION_THRESHOLD_TURN) return 'turn';
  if (pressure >= DETECTION_THRESHOLD_NOTICE) return 'notice';
  return 'quiet';
}

export function EncounterSeedsTab({
  seeds,
  currentTick,
  retinueAgents,
  regionalDetectionPressure = [],
}: EncounterSeedsTabProps) {
  const [filter, setFilter] = useState<FilterMode>('all');

  const detectionRows = regionalDetectionPressure
    .slice()
    .sort((a, b) => b.pressure - a.pressure || a.regionId.localeCompare(b.regionId));

  if (seeds.length === 0) {
    return <div style={EMPTY_STATE_STYLE}>Seed queue empty.</div>;
  }

  const sorted = seeds
    .slice()
    .sort((a, b) => {
      const diff = a.eligibleAfterTick - b.eligibleAfterTick;
      if (diff !== 0) return diff;
      const pDiff = b.priority - a.priority;
      if (pDiff !== 0) return pDiff;
      return a.plantedTick - b.plantedTick;
    });

  const filtered = sorted.filter(s => {
    if (filter === 'ready') return s.eligibleAfterTick <= currentTick + ENCOUNTER_SEED_READY_LOOKAHEAD;
    if (filter === 'waiting') return s.eligibleAfterTick > currentTick + ENCOUNTER_SEED_READY_LOOKAHEAD;
    return true;
  });

  const chipBase: React.CSSProperties = {
    fontSize: 'var(--text-xs)', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', border: 'none',
  };
  const chipActive: React.CSSProperties = {
    ...chipBase, background: 'var(--accent-gold)', color: '#000', fontWeight: 600,
  };
  const chipInactive: React.CSSProperties = {
    ...chipBase, background: 'var(--bg-raised)', color: 'var(--text-muted)',
  };

  return (
    <div style={{ padding: '8px 10px' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Detection pressure by region
        </div>
        {detectionRows.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No pressure registered yet.</div>
        ) : (
          detectionRows.map((entry) => (
            <div
              key={entry.regionId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '8px',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-primary)',
                marginBottom: '3px',
              }}
            >
              <span>{entry.regionId}</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{entry.pressure.toFixed(3)}</span>
              <span style={{ color: 'var(--text-muted)' }}>{describeDetectionBand(entry.pressure)}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {(['all', 'ready', 'waiting'] as FilterMode[]).map(f => (
          <button key={f} style={filter === f ? chipActive : chipInactive} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${seeds.length})` : f === 'ready' ? 'Ready now' : 'Waiting'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
          No seeds match this filter.
        </div>
      ) : (
        filtered.map(s => <SeedRow key={s.seedId} seed={s} currentTick={currentTick} retinueAgents={retinueAgents} />)
      )}
    </div>
  );
}
