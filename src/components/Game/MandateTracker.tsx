import { useState, useEffect } from 'react';
import type { MandateDefinition, MandateState } from '../../types/mandate';

interface MandateTrackerProps {
  definition: MandateDefinition;
  state: MandateState;
}

const TYPE_COLORS: Record<string, string> = {
  graph_state: '#d4a574',       // warm amber
  sphere_dominance: '#5c6bc0',  // indigo
  narrative: '#9c27b0',         // purple
};

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

function renderStagePip(status: 'filled' | 'half' | 'empty') {
  if (status === 'filled') {
    return (
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#d4a574' }} data-testid="stage-pip" />
    );
  }
  if (status === 'half') {
    return (
      <div
        className="w-2 h-2 rounded-full border"
        style={{ borderColor: '#d4a574', backgroundColor: '#d4a57466' }}
        data-testid="stage-pip"
      />
    );
  }
  return (
    <div className="w-2 h-2 rounded-full border" style={{ borderColor: '#d4a574/30' }} data-testid="stage-pip" />
  );
}

export function MandateTracker({ definition, state }: MandateTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = TYPE_COLORS[definition.type] ?? '#d4a574';
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
            <span
              className="text-xs font-bold uppercase tracking-wider truncate"
              style={{ color, fontFamily: 'Cinzel, serif' }}
            >
              {definition.name}
            </span>
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
        <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}80`,
            }}
          />
        </div>
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
                      color: isCompleted ? '#10b981' : isCurrent ? color : '#6b7280',
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
                        <div key={condIdx} style={{ color: cond.met ? '#10b981' : '#9ca3af' }}>
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
