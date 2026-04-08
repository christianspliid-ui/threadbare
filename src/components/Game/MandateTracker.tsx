import { useEffect, useState } from 'react';
import type { MandateDefinition, MandateState } from '../../types/mandate';
import { ProgressBar } from '../shared/ProgressBar';
import { Tooltip } from '../shared/Tooltip';
import { AnimateMount } from '../shared/AnimateMount';
import { MANDATE_TYPE_COLORS, SENTIMENT_GREEN, SENTIMENT_NEGATIVE } from '../../data/uiColorPalette';

interface MandateTrackerProps {
  definition: MandateDefinition;
  state: MandateState;
}

const STAGE_ORDER = ['setup', 'escalation', 'culmination'] as const;
const PIP_COLOR = MANDATE_TYPE_COLORS.graph_state;

function getStagePipStatus(
  stage: string,
  currentStage: string,
  completed: boolean,
): 'filled' | 'half' | 'empty' {
  if (completed && stage === 'culmination') return 'filled';
  const currentIndex = STAGE_ORDER.indexOf(currentStage as any);
  const stageIndex = STAGE_ORDER.indexOf(stage as any);
  if (stageIndex < currentIndex) return 'filled';
  if (stageIndex === currentIndex) return 'half';
  return 'empty';
}

function renderStagePip(status: 'filled' | 'half' | 'empty') {
  if (status === 'filled') {
    return (
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIP_COLOR }} data-testid="stage-pip" />
    );
  }
  if (status === 'half') {
    return (
      <div
        className="w-2 h-2 rounded-full border"
        style={{ borderColor: PIP_COLOR, backgroundColor: `${PIP_COLOR}66` }}
        data-testid="stage-pip"
      />
    );
  }
  return (
    <div className="w-2 h-2 rounded-full border" style={{ borderColor: `${PIP_COLOR}4d` }} data-testid="stage-pip" />
  );
}

function formatDelta(delta: number | undefined): string {
  if (delta == null || !Number.isFinite(delta)) return '0%';
  const pct = Math.round(delta * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

function getNextCheckpoint(definition: MandateDefinition, state: MandateState) {
  const results = state.checkpointResults ?? [];
  return (definition.checkpoints ?? []).find(
    (checkpoint) => !results.some((result) => result.index === checkpoint.index),
  );
}

function getSecondaryObjectiveProgress(definition: MandateDefinition, state: MandateState): string | null {
  if (!definition.secondaryObjective) return null;
  const current = state.secondaryObjectiveCurrent ?? 0;
  return `${current}/${definition.secondaryObjective.target}`;
}

function SummaryPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      minWidth: '92px',
      padding: '8px 10px',
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
        fontSize: '12px',
        fontWeight: 700,
        color: color ?? 'var(--text-primary)',
      }}>
        {value}
      </div>
    </div>
  );
}

export function MandateTracker({ definition, state }: MandateTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = MANDATE_TYPE_COLORS[definition.type] ?? MANDATE_TYPE_COLORS.graph_state;
  const pct = Math.round(state.progress * 100);
  const displayText = state.completed ? 'FULFILLED' : pct === 0 ? 'NEW' : `${pct}%`;
  const isSphereGrowth = definition.runtimeKind === 'sphere_growth';
  const nextCheckpoint = getNextCheckpoint(definition, state);
  const heldOmens = state.checkpointResults?.filter((result) => result.passed).length ?? 0;
  const omenCount = definition.checkpoints?.length ?? 0;
  const secondaryObjectiveProgress = getSecondaryObjectiveProgress(definition, state);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div className="flex-1 min-w-0 relative" aria-live="polite" aria-label="Mandate progress">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="cursor-pointer px-2 py-1 rounded border transition-colors relative flex flex-col gap-1 min-w-0"
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${color}25`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${color}15`;
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Tooltip id="ui.mandate_tracker">
            <span
              className="font-bold uppercase truncate"
              style={{ fontSize: '10px', color, fontFamily: 'var(--font-display)' }}
            >
              {definition.name}
            </span>
          </Tooltip>
          <span className="font-mono flex-shrink-0" style={{ fontSize: '10px', color }}>
            {displayText}
          </span>
          <div className="flex gap-0.5 items-center ml-auto">
            {STAGE_ORDER.map((stage) => (
              <span key={stage}>
                {renderStagePip(getStagePipStatus(stage, state.currentStage, state.completed))}
              </span>
            ))}
          </div>
        </div>

        {isSphereGrowth && (
          <div
            className="flex items-center gap-1.5 min-w-0"
            style={{ fontSize: '9px', color: 'var(--text-muted)' }}
          >
            <span className="truncate">
              {definition.primarySphere} {formatDelta(state.primaryDelta)}
            </span>
            <span aria-hidden="true">•</span>
            <span className="truncate">
              {definition.secondarySphere} {formatDelta(state.secondaryDelta)}
            </span>
            {nextCheckpoint && (
              <span className="ml-auto flex-shrink-0">
                {Math.round(nextCheckpoint.doomProgressThreshold * 100)}%
              </span>
            )}
          </div>
        )}
      </div>

      <AnimateMount show={isExpanded} animation="anim-fade-down">
        <div
          role="dialog"
          aria-label={`${definition.name} mandate details`}
          className="absolute top-full left-0 right-0 mt-1 border rounded shadow-lg p-4 z-50 max-w-md"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-medium)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-bold uppercase px-2 py-1 rounded"
              style={{
                fontSize: 'var(--text-xs)',
                backgroundColor: `${color}20`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {definition.type === 'graph_state' && 'GRAPH-STATE'}
              {definition.type === 'sphere_dominance' && 'SPHERE-DOMINANCE'}
              {definition.type === 'narrative' && 'NARRATIVE'}
              {definition.type === 'simulation_achievable' && 'SIMULATION'}
            </span>
          </div>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {definition.description}
          </p>

          {isSphereGrowth && (
            <div style={{ marginBottom: '12px' }}>
              <ProgressBar progress={state.progress} color={color} glow={state.completed} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                <SummaryPill
                  label={definition.primarySphere ?? 'Primary'}
                  value={formatDelta(state.primaryDelta)}
                  color={color}
                />
                <SummaryPill label={definition.secondarySphere ?? 'Secondary'} value={formatDelta(state.secondaryDelta)} />
                <SummaryPill label="Omens Held" value={omenCount > 0 ? `${heldOmens}/${omenCount}` : '0'} />
                <SummaryPill
                  label="Doom Debt"
                  value={`${state.doomSeverityPenalties ?? 0}`}
                  color={(state.doomSeverityPenalties ?? 0) > 0 ? SENTIMENT_NEGATIVE : undefined}
                />
                {(state.counterOmensEarned ?? 0) > 0 && (
                  <SummaryPill
                    label="Counter-Omens"
                    value={`${state.counterOmensEarned ?? 0}`}
                    color={SENTIMENT_GREEN}
                  />
                )}
                {definition.secondaryObjective && secondaryObjectiveProgress && (
                  <SummaryPill
                    label={definition.secondaryObjective.label}
                    value={secondaryObjectiveProgress}
                    color={state.secondaryObjectiveCompleted ? SENTIMENT_GREEN : undefined}
                  />
                )}
              </div>
              {nextCheckpoint && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}>
                  Next omen: {nextCheckpoint.label} at {Math.round(nextCheckpoint.doomProgressThreshold * 100)}% doom.
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 mb-3">
            {definition.stages.map((stageDef, idx) => {
              const isCompleted =
                STAGE_ORDER.indexOf(stageDef.stage as any) < STAGE_ORDER.indexOf(state.currentStage as any) ||
                (state.completed && stageDef.stage === 'culmination');
              const isCurrent = stageDef.stage === state.currentStage;

              return (
                <div key={stageDef.stage} style={{ fontSize: 'var(--text-xs)' }}>
                  <div
                    className="flex items-center gap-2 mb-1"
                    style={{
                      color: isCompleted ? SENTIMENT_GREEN : isCurrent ? color : '#6b7280',
                      opacity: isCompleted || isCurrent ? 1 : 0.5,
                    }}
                  >
                    <span className="font-bold">{idx + 1}.</span>
                    <span className="font-bold uppercase">{stageDef.stage}</span>
                    {isCompleted && <span>✓</span>}
                  </div>
                  {isCurrent && (
                    <div className="ml-6 space-y-1">
                      {stageDef.conditions.map((cond, condIdx) => (
                        <div key={condIdx} style={{ color: cond.met ? SENTIMENT_GREEN : '#9ca3af' }}>
                          <span>{cond.met ? '✓' : '○'}</span>
                          <span className="ml-1">{cond.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
            Click to close
          </div>
        </div>
      </AnimateMount>

      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
