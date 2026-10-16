import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { MandateDefinition, MandateState } from '../../types/mandate';
import { ProgressBar } from '../shared/ProgressBar';
import { Tooltip } from '../shared/Tooltip';
import { Overlay } from '../shared/Overlay';
import { MANDATE_TYPE_COLORS, SENTIMENT_GREEN, SENTIMENT_NEGATIVE } from '../../data/uiColorPalette';
import { sphereDeltaReading } from '../../engine/aftermathWords';
import { DeltaCluster } from '../shared/DeltaCluster';
import { sphereWord } from '../shared/formatEssence';

interface MandateTrackerProps {
  definition: MandateDefinition;
  state: MandateState;
}

const STAGE_ORDER = ['setup', 'escalation', 'culmination'] as const;
/** The stage name as the player reads it (Law 14: no raw keys). */
const STAGE_DISPLAY: Record<string, string> = {
  setup: 'Setup',
  escalation: 'Escalation',
  culmination: 'Culmination',
};
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

/**
 * THR-1451 — a sphere delta reads as a cluster of triangles, never `+7%`.
 *
 * The tracker and `MandateDetail` both draw this quantity, so both take the one
 * reading from `sphereDeltaReading` (which lives beside its ladder, UI Law 3)
 * rather than each keeping a formatter of its own. Nothing is drawn for a zero
 * delta — a sphere that has not moved says so in a word, not as `0%`.
 */
function DeltaReading({ delta, noun }: { delta: number | undefined; noun: string }) {
  const reading = sphereDeltaReading(delta, noun);
  if (!reading) return <span style={{ color: 'var(--text-muted)' }}>unmoved</span>;
  return <DeltaCluster direction={reading.direction} count={reading.count} label={reading.label} />;
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

// THR-1451: `value` widened to a node so a pill can carry a delta cluster instead
// of a formatted numeral. Every other caller still passes a string (NFP #6).
function SummaryPill({ label, value, color, tooltipId }: { label: string; value: ReactNode; color?: string; tooltipId?: string }) {
  return (
    <div style={{
      minWidth: '92px',
      padding: '8px 10px',
      borderRadius: '6px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
      }}>
        {tooltipId ? <Tooltip id={tooltipId}>{label}</Tooltip> : label}
      </div>
      <div style={{
        marginTop: '4px',
        fontSize: 'var(--text-xs)',
        fontWeight: 700,
        color: color ?? 'var(--text-primary)',
      }}>
        {value}
      </div>
    </div>
  );
}

/** Gap between the tracker and its popover (the old `mt-1`). */
const MANDATE_POPOVER_GAP_PX = 4;

export function MandateTracker({ definition, state }: MandateTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  /** Where the popover hangs: just under the tracker, measured when it opens. */
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const trackerRef = useRef<HTMLDivElement | null>(null);
  const color = MANDATE_TYPE_COLORS[definition.type] ?? MANDATE_TYPE_COLORS.graph_state;
  // THR-1424 (Law 15 ruling, 2026-09-10): mandate progress is a unitless proportion, and this
  // tier already renders it twice without a numeral — the stage pips and the `ProgressBar`.
  // So the percentage is dropped rather than banded to a word (an adverb is the wrong answer
  // to "how much?", Law 13 amendment 2026-08-12). `FULFILLED` and `NEW` survive: both name a
  // state of the mandate, not a magnitude, and `NEW` still reads off untouched progress.
  const displayText = state.completed ? 'FULFILLED' : state.progress <= 0 ? 'NEW' : '';
  const isSphereGrowth = definition.runtimeKind === 'sphere_growth';
  const nextCheckpoint = getNextCheckpoint(definition, state);
  const heldOmens = state.checkpointResults?.filter((result) => result.passed).length ?? 0;
  const omenCount = definition.checkpoints?.length ?? 0;
  const secondaryObjectiveProgress = getSecondaryObjectiveProgress(definition, state);

  const handleToggle = () => {
    if (!isExpanded) {
      const rect = trackerRef.current?.getBoundingClientRect();
      setAnchor(rect ? { top: rect.bottom + MANDATE_POPOVER_GAP_PX, left: rect.left, width: rect.width } : null);
    }
    setIsExpanded(!isExpanded);
  };
  const collapse = useCallback(() => setIsExpanded(false), []);

  return (
    <div ref={trackerRef} className="flex-1 min-w-0 relative" aria-live="polite" aria-label="Mandate progress">
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
              className="font-bold truncate"
              style={{ fontSize: 'var(--text-xs)', color, fontFamily: 'var(--font-body)' }}
            >
              {definition.name}
            </span>
          </Tooltip>
          {displayText && (
            <span className="figures-tabular flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color }}>
              {displayText}
            </span>
          )}
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
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
          >
            <span className="truncate">
              {definition.primarySphere}{' '}
              <DeltaReading delta={state.primaryDelta} noun={definition.primarySphere ?? 'Primary'} />
            </span>
            <span aria-hidden="true">•</span>
            <span className="truncate">
              {definition.secondarySphere}{' '}
              <DeltaReading delta={state.secondaryDelta} noun={definition.secondarySphere ?? 'Secondary'} />
            </span>
            {/* THR-1424: the checkpoint's doom threshold was a bare unitless proportion with
                no unit and no label — dropped per the Law 15 ruling. The checkpoint's name is
                carried in the expanded panel below, where it reads as a name rather than a
                numeral floating at the end of a sphere row. */}
          </div>
        )}
      </div>

      {/* THR-1884: the popover and its click-catcher are one Overlay — an invisible
          backdrop that closes on an outside click, the popover hung under the
          tracker, and Escape through the one registry (Law 23). */}
      <Overlay
        open={isExpanded}
        onClose={collapse}
        label={`${definition.name} mandate details`}
        band="focused"
        backdrop="none"
        closeOnBackdrop
        modal={false}
        animation="fade"
        surfaceStyle={anchor ? { position: 'fixed', top: anchor.top, left: anchor.left, width: anchor.width } : undefined}
      >
        <div
          className="border rounded shadow-lg p-4 max-w-md"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-medium)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="font-bold px-2 py-1 rounded"
              style={{
                fontSize: 'var(--text-xs)',
                backgroundColor: `${color}20`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {definition.type === 'graph_state' && 'Graph-state'}
              {definition.type === 'sphere_dominance' && 'Sphere-dominance'}
              {definition.type === 'narrative' && 'Narrative'}
              {definition.type === 'simulation_achievable' && 'Simulation'}
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
                  label={definition.primarySphere ? sphereWord(definition.primarySphere) : 'Primary'}
                  value={<DeltaReading delta={state.primaryDelta} noun={definition.primarySphere ?? 'Primary'} />}
                  color={color}
                />
                <SummaryPill
                  label={definition.secondarySphere ? sphereWord(definition.secondarySphere) : 'Secondary'}
                  value={<DeltaReading delta={state.secondaryDelta} noun={definition.secondarySphere ?? 'Secondary'} />}
                />
                <SummaryPill label="Omens held" value={omenCount > 0 ? `${heldOmens}/${omenCount}` : '0'} />
                <SummaryPill
                  label="Doom debt"
                  tooltipId="ui.doom_debt"
                  value={`${state.doomSeverityPenalties ?? 0}`}
                  color={(state.doomSeverityPenalties ?? 0) > 0 ? SENTIMENT_NEGATIVE : undefined}
                />
                {(state.counterOmensEarned ?? 0) > 0 && (
                  <SummaryPill
                    label="Counter-omens"
                    tooltipId="ui.counter_omens"
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
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}>
                  {/* THR-1424: `at N% doom` dropped — a unitless proportion with no non-numeric
                      rendering on this surface reads as nothing rather than as a word ladder. */}
                  Next omen: {nextCheckpoint.label}.
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
                    <span className="font-bold">{STAGE_DISPLAY[stageDef.stage] ?? stageDef.stage}</span>
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
      </Overlay>
    </div>
  );
}
