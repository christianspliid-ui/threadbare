import type { MandateDefinition, MandateState, MandateStage } from '../../types/mandate';
import { Modal } from '../shared/Modal';
import { ProgressBar } from '../shared/ProgressBar';
import { MANDATE_TYPE_COLORS, SENTIMENT_GREEN } from '../../data/uiColorPalette';

interface MandateDetailProps {
  open: boolean;
  onClose: () => void;
  definition: MandateDefinition;
  state: MandateState;
}

const STAGE_ORDER: MandateStage[] = ['setup', 'escalation', 'culmination'];

const MANDATE_TYPE_LABELS: Record<string, string> = {
  graph_state: 'Graph-State',
  sphere_dominance: 'Sphere-Dominance',
  narrative: 'Narrative',
  simulation_achievable: 'Simulation',
};

const STAGE_DISPLAY: Record<MandateStage, string> = {
  setup: 'Setup',
  escalation: 'Escalation',
  culmination: 'Culmination',
};

export function MandateDetail({ open, onClose, definition, state }: MandateDetailProps) {
  const color = MANDATE_TYPE_COLORS[definition.type] ?? MANDATE_TYPE_COLORS.graph_state;
  const pct = Math.round(state.progress * 100);
  const typeLabel = MANDATE_TYPE_LABELS[definition.type] ?? 'Unknown';

  // Status
  let statusLabel = 'New';
  let statusColor = color;
  if (state.completed) {
    statusLabel = 'Fulfilled';
    statusColor = SENTIMENT_GREEN;
  } else if (state.failed) {
    statusLabel = 'Failed';
    statusColor = '#dc2626';
  } else if (pct > 0) {
    statusLabel = 'In Progress';
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={720}>
      {/* Header */}
      <Modal.Header onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', color, filter: `drop-shadow(0 0 6px ${color}80)` }}>⚑</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
            letterSpacing: '0.03em',
          }}>
            {definition.name}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '10px',
            fontWeight: 600,
            padding: '3px 8px',
            backgroundColor: `${color}15`,
            color,
            border: `1px solid ${color}30`,
            borderRadius: '3px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {typeLabel}
          </span>
        </div>
      </Modal.Header>

      <Modal.Body>
        {/* Description + progress summary */}
        <div style={{
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 14px 0',
          }}>
            {definition.description}
          </p>

          {/* Progress bar with status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <ProgressBar progress={state.progress} color={statusColor} glow={state.completed} />
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '3px',
              backgroundColor: `${statusColor}15`,
              color: statusColor,
              border: `1px solid ${statusColor}30`,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: '24px' }}>

          {/* LEFT: Objective details */}
          <div style={{ flex: '0 0 180px' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}>
              Details
            </div>

            <DetailRow label="Type" value={typeLabel} color={color} />
            <DetailRow label="Stage" value={`${STAGE_DISPLAY[state.currentStage]} (${STAGE_ORDER.indexOf(state.currentStage) + 1}/3)`} />
            <DetailRow label="Progress" value={`${pct}%`} color={color} />
            {definition.targetSphere && (
              <DetailRow label="Target Sphere" value={definition.targetSphere} />
            )}
            {definition.tickLimit && (
              <DetailRow label="Time Limit" value={`${definition.tickLimit} ticks`} color="#ea580c" />
            )}
            {state.assignedTick != null && (
              <DetailRow label="Assigned" value={`Tick ${state.assignedTick}`} />
            )}
          </div>

          {/* Vertical divider */}
          <div style={{
            width: '1px',
            alignSelf: 'stretch',
            background: `linear-gradient(to bottom, transparent, ${color}40, transparent)`,
          }} />

          {/* RIGHT: Stage timeline with conditions */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}>
              Path to Fulfillment
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {STAGE_ORDER.map((stageKey) => {
                const stageDef = definition.stages.find(s => s.stage === stageKey);
                if (!stageDef) return null;

                const stageIdx = STAGE_ORDER.indexOf(stageKey);
                const currentStageIdx = STAGE_ORDER.indexOf(state.currentStage);
                const isPast = stageIdx < currentStageIdx || (state.completed && stageIdx === 2);
                const isCurrent = stageIdx === currentStageIdx && !state.completed;
                const isFuture = stageIdx > currentStageIdx && !state.completed;
                const stageCompletedTick = state.stageCompletedTicks?.[stageKey];

                return (
                  <div key={stageKey} style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: isCurrent ? `${color}10` : 'transparent',
                    border: isCurrent ? `1px solid ${color}30` : '1px solid transparent',
                  }}>
                    {/* Stage header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Numbered circle indicator */}
                      <div style={{
                        width: '20px', height: '20px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        backgroundColor: isPast ? `${color}30` : isCurrent ? color : '#2a2a2e',
                        border: isFuture ? '1.5px solid #3a3a3e' : 'none',
                        boxShadow: isCurrent ? `0 0 8px ${color}60` : 'none',
                        fontSize: '10px',
                        color: isPast ? color : isCurrent ? '#0a0a0e' : '#4a4a4e',
                        fontWeight: 700,
                      }}>
                        {isPast ? '✓' : stageIdx + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: isCurrent ? color : isPast ? 'var(--text-secondary)' : 'var(--text-muted)',
                          textTransform: 'uppercase',
                        }}>
                          {STAGE_DISPLAY[stageKey]}
                        </span>
                        {isPast && stageCompletedTick != null && (
                          <span style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            marginLeft: '8px',
                          }}>
                            tick {stageCompletedTick}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stage description */}
                    <div style={{
                      fontSize: '11px',
                      color: isFuture ? 'var(--text-muted)' : 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginTop: '6px',
                      marginLeft: '28px',
                      opacity: isFuture ? 0.6 : 1,
                    }}>
                      {stageDef.description}
                    </div>

                    {/* Conditions */}
                    {stageDef.conditions.length > 0 && (
                      <div style={{ marginTop: '8px', marginLeft: '28px' }}>
                        {stageDef.conditions.map((cond, condIdx) => {
                          const met = !!cond.met;
                          const condColor = met ? SENTIMENT_GREEN : isFuture ? 'var(--text-muted)' : 'var(--text-secondary)';
                          return (
                            <div key={condIdx} style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: '6px',
                              fontSize: '11px',
                              color: condColor,
                              marginBottom: '3px',
                              opacity: isFuture ? 0.5 : 1,
                            }}>
                              <span style={{
                                flexShrink: 0,
                                width: '14px',
                                height: '14px',
                                borderRadius: '3px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                backgroundColor: met ? `${SENTIMENT_GREEN}20` : '#1a1a1e',
                                border: met ? `1px solid ${SENTIMENT_GREEN}40` : '1px solid #2a2a2e',
                                color: met ? SENTIMENT_GREEN : '#4a4a4e',
                              }}>
                                {met ? '✓' : ' '}
                              </span>
                              <span style={{ lineHeight: 1.4 }}>{cond.description}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer>
        <div style={{
          width: '100%',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          opacity: 0.7,
        }}>
          Fulfill all stages to advance your influence over the world.
        </div>
      </Modal.Footer>
    </Modal>
  );
}

/** Compact label–value row */
function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '5px 0',
      borderBottom: '1px solid #1a1a1e',
      fontSize: '11px',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <span style={{
        fontWeight: 600,
        color: color ?? 'var(--text-secondary)',
      }}>
        {value}
      </span>
    </div>
  );
}
