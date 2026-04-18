import type {
  EncounterStageShellStateModel,
  EncounterStageSignalModel,
} from '../types';

interface ClearanceGatePanelProps {
  shellState?: EncounterStageShellStateModel;
  signals: EncounterStageSignalModel[];
}

const VISIBILITY_LABEL: Record<EncounterStageSignalModel['visibility'], string> = {
  hidden: 'Hidden',
  known: 'Known',
  revealed: 'Revealed',
};

const VISIBILITY_COLOR: Record<EncounterStageSignalModel['visibility'], string> = {
  hidden: 'var(--text-tertiary)',
  known: 'var(--accent-gold)',
  revealed: '#fca5a5',
};

export function ClearanceGatePanel({ shellState, signals }: ClearanceGatePanelProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      {shellState && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-gold)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-tertiary)',
              marginBottom: 6,
            }}
          >
            How The Gate Feels
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              color: 'var(--text-primary)',
              marginBottom: shellState.stateHint ? 6 : 0,
            }}
          >
            {shellState.stateLabel}
          </div>
          {shellState.stateHint && (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
              }}
            >
              {shellState.stateHint}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-subtle)',
        }}
      >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-tertiary)',
              marginBottom: 8,
            }}
          >
          What You Notice
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {signals.map(signal => (
            <div
              key={signal.id}
              style={{
                display: 'grid',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {signal.label}
                </span>
                <span
                  style={{
                    color: VISIBILITY_COLOR[signal.visibility],
                    fontSize: 'var(--text-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {signal.visibilityLabel ?? VISIBILITY_LABEL[signal.visibility]}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                {signal.observation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
