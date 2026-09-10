import type { MandateDefinition, MandateStage, MandateState } from '../../types/mandate';
import { Modal } from '../shared/Modal';
import { ProgressBar } from '../shared/ProgressBar';
import { MANDATE_TYPE_COLORS, SENTIMENT_GREEN, SENTIMENT_NEGATIVE } from '../../data/uiColorPalette';
import { durationLabel, elapsedLabel } from '../../engine/aftermathWords';

interface MandateDetailProps {
  open: boolean;
  onClose: () => void;
  definition: MandateDefinition;
  state: MandateState;
  /**
   * Current simulation tick, so the stage and evaluation rows can read *how long ago*
   * instead of printing the engine's clock index (THR-1426). Optional so the modal
   * still renders in a fixture that has no clock — those rows then read `less than a
   * day`, which is English rather than a crash (NFP #4).
   */
  currentTick?: number;
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
        fontSize: 'var(--text-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
      }}>
        {label}
      </div>
      <div style={{
        marginTop: '4px',
        fontSize: 'var(--text-sm)',
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
        <span style={{ fontSize: 'var(--text-xs)', color: color, fontWeight: 700 }}>
          {formatDelta(delta)} / {formatDelta(target)}
        </span>
      </div>
      <ProgressBar progress={progress} color={color} glow={progress >= 1} />
      <div style={{
        marginTop: '6px',
        fontSize: 'var(--text-xs)',
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
  currentTick,
}: {
  checkpoint: NonNullable<MandateDefinition['checkpoints']>[number];
  /*
   * THR-1426: was `MandateState['checkpointResults'] extends Array<infer T> ? T | undefined
   * : undefined`. `checkpointResults` is optional, so the type being tested is
   * `Array<…> | undefined`, which does **not** extend `Array<infer T>` — the conditional
   * always took its false branch and resolved to `undefined`, making every field access on
   * `result` an error against `never`. The `NonNullable` unwrap is what the original was
   * reaching for; it also clears the pre-existing `passed` / `exceeded` / `observedPrimaryDelta`
   * errors this row was already carrying.
   */
  result?: NonNullable<MandateState['checkpointResults']>[number];
  color: string;
  currentTick?: number;
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
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 600 }}>
            {checkpoint.label}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
            {/* THR-1424: the `N% doom` half is a unitless proportion and is dropped. The
                `needs …` half is a sphere delta, a realised-change magnitude whose sanctioned
                language is the delta cluster (Law 15 rescope) — a different reading, tracked
                separately, so it is deliberately left untouched here. */}
            Needs {formatDelta(checkpoint.requiredPrimaryDelta)}
          </div>
        </div>
        <span style={{
          fontSize: 'var(--text-xs)',
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
        <div style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {/* THR-1426 (Shape 1): `on tick 412` named the engine's clock on a player-facing
              line (Laws 13/14). When a checkpoint was evaluated matters only relative to
              now, which is what `elapsedLabel` reads. */}
          Observed {formatDelta(result.observedPrimaryDelta)}{' '}
          {elapsedLabel((currentTick ?? result.evaluatedTick) - result.evaluatedTick)} ago.
        </div>
      )}
    </div>
  );
}

export function MandateDetail({ open, onClose, definition, state, currentTick }: MandateDetailProps) {
  const color = MANDATE_TYPE_COLORS[definition.type] ?? MANDATE_TYPE_COLORS.graph_state;
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
  } else if (state.progress > 0) {
    // THR-1424: this read the rounded `pct` that fed the dropped Progress row. It reads the
    // raw progress directly now — the status word is a state, not a magnitude, so it survives
    // the ruling; only the numeral it happened to share a variable with is gone.
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
            fontSize: 'var(--text-xs)',
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
              fontSize: 'var(--text-xs)',
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
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}>
              Details
            </div>

            <DetailRow label="Type" value={typeLabel} color={color} />
            <DetailRow label="Stage" value={`${STAGE_DISPLAY[state.currentStage]} (${STAGE_ORDER.indexOf(state.currentStage) + 1}/3)`} />
            {/* THR-1424 (Law 15 ruling, 2026-09-10): the Progress row was a unitless proportion
                numeral duplicating the `ProgressBar` this modal already renders above. Dropped,
                not banded — the bar is the reading. */}
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
              /* THR-1424: the parenthesised threshold was a unitless proportion — dropped, so
                 the row carries the omen's name alone. */
              <DetailRow label="Next Omen" value={nextCheckpoint.label} />
            )}
            {definition.tickLimit && (
              /* THR-1425: a mandate's limit is a duration, so it reads through `durationLabel`.
                 The row label already says "Time Limit", so the value carries only the term —
                 spelling `ticks` into it put the engine unit on the surface twice (Law 14). */
              <DetailRow label="Time Limit" value={durationLabel(definition.tickLimit)} color="#ea580c" />
            )}
            {/* THR-1426 (Shape 1): the `Assigned: Tick N` row is dropped rather than converted.
                It printed the engine's clock index (Laws 13/14), and unlike the checkpoint and
                stage rows there is nothing a player does with when a mandate was handed down —
                the mandate's live term is already carried by the `Time Limit` row above. A
                reading nobody acts on is answered by removing the row, not by rephrasing it. */}

            {definition.secondaryObjective && (
              <div style={{
                marginTop: '14px',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}>
                  Court Task
                </div>
                <div style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {definition.secondaryObjective.label}
                </div>
                <div style={{ marginTop: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {definition.secondaryObjective.description}
                </div>
                <div style={{ marginTop: '6px', fontSize: 'var(--text-xs)', color: state.secondaryObjectiveCompleted ? SENTIMENT_GREEN : 'var(--text-muted)' }}>
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
                  fontSize: 'var(--text-xs)',
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
                  fontSize: 'var(--text-xs)',
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
                      currentTick={currentTick}
                    />
                  ))}
                </div>
              </>
            )}

            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
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
                        fontSize: 'var(--text-xs)',
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
                        {/* THR-1426 (Shape 1): was `tick {stageCompletedTick}` — the engine's
                            clock index beside a completed stage (Laws 13/14). A finished stage
                            is read by when it closed relative to now. */}
                        {isPast && stageCompletedTick != null && (
                          <span style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                            marginLeft: '8px',
                          }}>
                            {elapsedLabel((currentTick ?? stageCompletedTick) - stageCompletedTick)} ago
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      fontSize: 'var(--text-xs)',
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
                              fontSize: 'var(--text-xs)',
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
                                fontSize: 'var(--text-xs)',
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
          fontSize: 'var(--text-xs)',
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
      fontSize: 'var(--text-xs)',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
