import type { MandateDefinition, MandateStage, MandateState } from '../../types/mandate';
import { Modal } from '../shared/Modal';
import { ProgressBar } from '../shared/ProgressBar';
import { MANDATE_TYPE_COLORS, SENTIMENT_GREEN, SENTIMENT_NEGATIVE } from '../../data/uiColorPalette';

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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function formatDelta(delta: number | undefined): string {
  if (delta == null || !Number.isFinite(delta)) return '0%';
  const pct = Math.round(delta * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

function formatMetricValue(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return '0';
  return value >= 100 ? Math.round(value).toString() : value.toFixed(1);
}

function formatCourtLabel(courtType: string | undefined): string {
  if (!courtType) return 'Unshaped';
  return courtType.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getNextCheckpoint(definition: MandateDefinition, state: MandateState) {
  const results = state.checkpointResults ?? [];
  return (definition.checkpoints ?? []).find(
    (checkpoint) => !results.some((result) => result.index === checkpoint.index),
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      minWidth: '120px',
      padding: '10px 12px',
      borderRadius: '6px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
      }}>
        {label}
      </div>
      <div style={{
        marginTop: '4px',
        fontSize: '14px',
        fontWeight: 700,
        color: color ?? 'var(--text-primary)',
      }}>
        {value}
      </div>
    </div>
  );
}

function MetricTrack({
  label,
  current,
  baseline,
  delta,
  target,
  color,
}: {
  label: string;
  current: number | undefined;
  baseline: number | undefined;
  delta: number | undefined;
  target: number | undefined;
  color: string;
}) {
  const progress = target && target > 0 ? clamp01((delta ?? 0) / target) : 0;

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: '6px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xs)',
          color,
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{ fontSize: '11px', color: color, fontWeight: 700 }}>
          {formatDelta(delta)} / {formatDelta(target)}
        </span>
      </div>
      <ProgressBar progress={progress} color={color} glow={progress >= 1} />
      <div style={{
        marginTop: '6px',
        fontSize: '10px',
        color: 'var(--text-muted)',
      }}>
        Baseline {formatMetricValue(baseline)} → Current {formatMetricValue(current)}
      </div>
    </div>
  );
}

function CheckpointRow({
  checkpoint,
  result,
  color,
}: {
  checkpoint: NonNullable<MandateDefinition['checkpoints']>[number];
  result: MandateState['checkpointResults'] extends Array<infer T> ? T | undefined : undefined;
  color: string;
}) {
  const label = result
    ? result.passed
      ? result.exceeded ? 'Exceeded' : 'Held'
      : 'Missed'
    : 'Awaiting';
  const tone = result
    ? result.passed
      ? result.exceeded ? SENTIMENT_GREEN : color
      : SENTIMENT_NEGATIVE
    : 'var(--text-muted)';

  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: '6px',
      backgroundColor: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600 }}>
            {checkpoint.label}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {Math.round(checkpoint.doomProgressThreshold * 100)}% doom · needs {formatDelta(checkpoint.requiredPrimaryDelta)}
          </div>
        </div>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '3px',
          color: tone,
          backgroundColor: `${tone === 'var(--text-muted)' ? '#9ca3af' : tone}15`,
          border: `1px solid ${tone === 'var(--text-muted)' ? '#4b5563' : tone}30`,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}>
          {label}
        </span>
      </div>
      {result && (
        <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
          Observed {formatDelta(result.observedPrimaryDelta)} on tick {result.evaluatedTick}.
        </div>
      )}
    </div>
  );
}

export function MandateDetail({ open, onClose, definition, state }: MandateDetailProps) {
  const color = MANDATE_TYPE_COLORS[definition.type] ?? MANDATE_TYPE_COLORS.graph_state;
  const pct = Math.round(state.progress * 100);
  const typeLabel = MANDATE_TYPE_LABELS[definition.type] ?? 'Unknown';
  const isSphereGrowth = definition.runtimeKind === 'sphere_growth';
  const nextCheckpoint = getNextCheckpoint(definition, state);
  const primaryProgress = definition.primaryTargetDelta
    ? clamp01((state.primaryDelta ?? 0) / definition.primaryTargetDelta)
    : 0;
  const secondaryProgress = definition.secondaryTargetDelta
    ? clamp01((state.secondaryDelta ?? 0) / definition.secondaryTargetDelta)
    : 0;

  let statusLabel = 'New';
  let statusColor = color;
  if (state.completed) {
    statusLabel = 'Fulfilled';
    statusColor = SENTIMENT_GREEN;
  } else if (state.failed) {
    statusLabel = 'Failed';
    statusColor = SENTIMENT_NEGATIVE;
  } else if (pct > 0) {
    statusLabel = 'In Progress';
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={780}>
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

        {isSphereGrowth && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
            <SummaryCard label={definition.primarySphere ?? 'Primary'} value={formatDelta(state.primaryDelta)} color={color} />
            <SummaryCard label={definition.secondarySphere ?? 'Secondary'} value={formatDelta(state.secondaryDelta)} />
            <SummaryCard
              label="Omens Held"
              value={`${state.checkpointResults?.filter((result) => result.passed).length ?? 0}/${definition.checkpoints?.length ?? 0}`}
            />
            <SummaryCard
              label="Counter-Omens"
              value={`${state.counterOmensEarned ?? 0}`}
              color={(state.counterOmensEarned ?? 0) > 0 ? SENTIMENT_GREEN : undefined}
            />
            <SummaryCard
              label="Doom Debt"
              value={`${state.doomSeverityPenalties ?? 0}`}
              color={(state.doomSeverityPenalties ?? 0) > 0 ? SENTIMENT_NEGATIVE : undefined}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: '0 0 210px' }}>
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
            {definition.primarySphere && (
              <DetailRow label="Primary Sphere" value={definition.primarySphere} color={color} />
            )}
            {definition.secondarySphere && (
              <DetailRow label="Secondary Sphere" value={definition.secondarySphere} />
            )}
            {definition.courtType && (
              <DetailRow label="Court Shape" value={formatCourtLabel(definition.courtType)} />
            )}
            {nextCheckpoint && (
              <DetailRow
                label="Next Omen"
                value={`${nextCheckpoint.label} (${Math.round(nextCheckpoint.doomProgressThreshold * 100)}%)`}
              />
            )}
            {definition.tickLimit && (
              <DetailRow label="Time Limit" value={`${definition.tickLimit} ticks`} color="#ea580c" />
            )}
            {state.assignedTick != null && (
              <DetailRow label="Assigned" value={`Tick ${state.assignedTick}`} />
            )}

            {definition.secondaryObjective && (
              <div style={{
                marginTop: '14px',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}>
                  Court Task
                </div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {definition.secondaryObjective.label}
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {definition.secondaryObjective.description}
                </div>
                <div style={{ marginTop: '6px', fontSize: '10px', color: state.secondaryObjectiveCompleted ? SENTIMENT_GREEN : 'var(--text-muted)' }}>
                  {state.secondaryObjectiveCurrent ?? 0}/{definition.secondaryObjective.target}
                </div>
              </div>
            )}
          </div>

          <div style={{
            width: '1px',
            alignSelf: 'stretch',
            background: `linear-gradient(to bottom, transparent, ${color}40, transparent)`,
          }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            {isSphereGrowth && (
              <>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '12px',
                }}>
                  Sphere Rise
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <MetricTrack
                    label={definition.primarySphere ?? 'Primary'}
                    current={state.primaryCurrent}
                    baseline={definition.primaryBaseline}
                    delta={state.primaryDelta}
                    target={definition.primaryTargetDelta}
                    color={color}
                  />
                  <MetricTrack
                    label={definition.secondarySphere ?? 'Secondary'}
                    current={state.secondaryCurrent}
                    baseline={definition.secondaryBaseline}
                    delta={state.secondaryDelta}
                    target={definition.secondaryTargetDelta}
                    color="var(--text-secondary)"
                  />
                </div>

                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '12px',
                }}>
                  Omen Track
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  {(definition.checkpoints ?? []).map((checkpoint) => (
                    <CheckpointRow
                      key={checkpoint.index}
                      checkpoint={checkpoint}
                      result={state.checkpointResults?.find((result) => result.index === checkpoint.index)}
                      color={color}
                    />
                  ))}
                </div>
              </>
            )}

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {STAGE_ORDER.map((stageKey) => {
                const stageDef = definition.stages.find((stage) => stage.stage === stageKey);
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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

      <Modal.Footer>
        <div style={{
          width: '100%',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          opacity: 0.7,
        }}>
          {isSphereGrowth
            ? 'Your remembrance shapes the mandate: keep the spheres rising, hold the omens, and enter the climax ahead of doom.'
            : 'Fulfill all stages to advance your influence over the world.'}
        </div>
      </Modal.Footer>
    </Modal>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: '12px',
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
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}
