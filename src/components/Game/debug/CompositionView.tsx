import React from 'react';
import type { ActiveComposition } from '../../../types/gameState';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

interface CompositionViewProps {
  activeCompositions?: readonly ActiveComposition[];
  currentTick: number;
  doomClockStage?: number;
}

const STATUS_COLOR: Record<ActiveComposition['status'], string> = {
  active: '#7ec8a4',
  completed: '#5a9fd4',
  failed: '#d47a7a',
};

export function CompositionView({ activeCompositions, currentTick, doomClockStage }: CompositionViewProps) {
  const compositions = activeCompositions ?? [];

  if (compositions.length === 0) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No active compositions. Compositions appear here when a phased event recipe fires.
      </div>
    );
  }

  return (
    <div style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#d0d0d0' }}>
      {doomClockStage !== undefined && (
        <div style={{ marginBottom: '8px', color: '#aaa' }}>
          Doom clock tier: <strong style={{ color: '#c5a44a' }}>{doomClockStage}</strong>
        </div>
      )}
      {compositions.map((comp) => (
        <CompositionEntry key={comp.compositionId} comp={comp} currentTick={currentTick} />
      ))}
    </div>
  );
}

function CompositionEntry({ comp, currentTick }: { comp: ActiveComposition; currentTick: number }) {
  const phases = (comp as ActiveComposition & { phases?: import('../../../composition-dsl/schema').Phase[] }).phases ?? [];
  const activatedCount = comp.activatedPhaseIds.length;
  const totalCount = phases.length;

  return (
    <div style={{
      marginBottom: '12px',
      border: '1px solid #333',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '6px 8px',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: STATUS_COLOR[comp.status], fontWeight: 'bold', fontSize: '10px' }}>
          {comp.status.toUpperCase()}
        </span>
        <span style={{ flex: 1, color: '#e0e0e0' }}>{comp.compositionId}</span>
        <span style={{ color: '#888' }}>fired t{comp.firedAtTick}</span>
        {totalCount > 0 && (
          <span style={{ color: '#aaa' }}>{activatedCount}/{totalCount} phases</span>
        )}
      </div>
      {phases.length > 0 && (
        <div style={{ padding: '6px 8px', background: '#111' }}>
          {phases.map((phase) => {
            const activated = comp.activatedPhaseIds.includes(phase.id);
            const activationTick = comp.phaseActivationTicks[phase.id];
            return (
              <div key={phase.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                marginBottom: '4px',
                opacity: activated ? 1 : 0.55,
              }}>
                <span style={{ color: activated ? '#7ec8a4' : '#555', width: '12px' }}>
                  {activated ? '✓' : '·'}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: activated ? '#d0d0d0' : '#888' }}>{phase.id}</span>
                  {activated && activationTick !== undefined && (
                    <span style={{ marginLeft: '6px', color: '#666', fontSize: '10px' }}>
                      t{activationTick}
                    </span>
                  )}
                  {!activated && phase.activatesAt.op === 'doom-clock' && (
                    <span style={{ marginLeft: '6px', color: '#555', fontSize: '10px' }}>
                      waiting doom-clock {phase.activatesAt.comparator} {phase.activatesAt.tier}
                    </span>
                  )}
                  {phase.rationale && (
                    <div style={{ color: '#666', fontSize: '10px', marginTop: '1px' }}>
                      {phase.rationale}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ padding: '4px 8px', background: '#0d0d0d', color: '#555', fontSize: '10px' }}>
        last eval: t{comp.lastEvaluationTick}
        {comp.status === 'active' && comp.lastEvaluationTick < currentTick - 1 && (
          <span style={{ marginLeft: '6px', color: '#d47a7a' }}>⚠ stale</span>
        )}
      </div>
    </div>
  );
}
