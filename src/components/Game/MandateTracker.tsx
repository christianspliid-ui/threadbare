import { useState, useEffect } from 'react';
import type { MandateDefinition, MandateState } from '../../types/mandate';
import { ProgressBar } from '../shared/ProgressBar';
import { Tooltip } from '../shared/Tooltip';
import { MANDATE_TYPE_COLORS, SENTIMENT_GREEN, SENTIMENT_NEGATIVE } from '../../data/uiColorPalette';

interface MandateTrackerProps {
  definition: MandateDefinition;
  state: MandateState;
}

const STAGE_ORDER = ['setup', 'escalation', 'culmination'] as const;

function getStagePipStatus(
  stage: string,
  currentStage: string,
  completed: boolean
): 'filled' | 'half' | 'empty' {
  if (completed && stage === 'culmination') return 'filled';
  const currentIndex = STAGE_ORDER.indexOf(currentStage as any);
  const stageIndex = STAGE_ORDER.indexOf(stage as any);
  if (stageIndex < currentIndex) return 'filled';
  if (stageIndex === currentIndex) return 'half';
  return 'empty';
}

const PIP_COLOR = MANDATE_TYPE_COLORS.graph_state;

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

export function MandateTracker({ definition, state }: MandateTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = MANDATE_TYPE_COLORS[definition.type] ?? MANDATE_TYPE_COLORS.graph_state;
  const pct = Math.round(state.progress * 100);
  const displayText = state.completed ? 'FULFILLED' : pct === 0 ? 'NEW' : `${pct}%`;
  const currentStageDef = definition.stages.find(s => s.stage === state.currentStage);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Close popover with Escape key
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
    <div className="flex-1 min-w-0 relative">
      {/* Compact Bar */}
      <div
        onClick={handleToggle}
        className="cursor-pointer px-4 py-2 bg-stone-800/95 border-b border-amber-900/30 hover:bg-stone-700/95 transition-colors relative z-50"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <Tooltip id="ui.mandate_tracker">
              <span
                className="text-xs font-bold uppercase tracking-wider truncate"
                style={{ color, fontFamily: 'Cinzel, serif' }}
              >
                {definition.name}
              </span>
            </Tooltip>
            <div className="flex gap-1 flex-shrink-0">
              {STAGE_ORDER.map(stage => (
                <div key={stage}>
                  {renderStagePip(getStagePipStatus(stage, state.currentStage, state.completed))}
                </div>
              ))}
            </div>
          </div>
          <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color }}>
            {displayText}
          </span>
        </div>
        <ProgressBar progress={state.progress} color={color} glow={true} />
      </div>

      {/* Expanded Popover */}
      {isExpanded && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-stone-800/98 border border-amber-900/40 rounded shadow-lg p-4 z-50 max-w-md"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Type Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold uppercase px-2 py-1 rounded"
              style={{
                backgroundColor: `${color}20`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {definition.type === 'graph_state' && 'GRAPH-STATE'}
              {definition.type === 'sphere_dominance' && 'SPHERE-DOMINANCE'}
              {definition.type === 'narrative' && 'NARRATIVE'}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-amber-200/80 mb-3">{definition.description}</p>

          {/* 3-Stage Timeline */}
          <div className="space-y-3 mb-3">
            {definition.stages.map((stageDef, idx) => {
              const isCompleted =
                STAGE_ORDER.indexOf(stageDef.stage as any) < STAGE_ORDER.indexOf(state.currentStage as any) ||
                (state.completed && stageDef.stage === 'culmination');
              const isCurrent = stageDef.stage === state.currentStage;

              return (
                <div key={stageDef.stage} className="text-xs">
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

          {/* Close hint */}
          <div className="text-xs text-amber-900/60 text-center">Click to close</div>
        </div>
      )}

      {/* Backdrop click handler */}
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
