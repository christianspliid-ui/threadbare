import { useRef, useState, useEffect } from 'react';
import type { DoomClockState, DoomClockDefinition } from '../../types/doomClock';
import { ProgressBar } from '../shared/ProgressBar';
import { Tooltip } from '../shared/Tooltip';
import { DOOM_ARCHETYPE_COLORS } from '../../data/uiColorPalette';
import { SphereIcon } from '../icons';
import type { SphereName } from '../../types/index';

interface DoomBarProps {
  definition: DoomClockDefinition;
  state: DoomClockState;
}

/**
 * Archetypes that map cleanly to a sphere symbol.
 * Archetypes without a sphere equivalent fall back to Unicode glyphs.
 */
const DOOM_ARCHETYPE_SPHERE: Record<string, SphereName> = {
  breach: 'order',       // ◈ → order (systematic breakdown of structure)
  convergence: 'matter', // ⬡ → matter (crystalline lattice convergence)
  changing: 'life',      // ∿ → life (organic, shifting)
  ascension: 'force',    // ✦ → force (directional impact / ascent)
};

/** Fallback Unicode glyphs for archetypes without a sphere mapping */
const DOOM_ARCHETYPE_GLYPHS: Record<string, string> = {
  sundering: '⚡',
  failing: '◇',
  reckoning: '⚔',
};

export function DoomBar({ definition, state }: DoomBarProps) {
  const color = DOOM_ARCHETYPE_COLORS[definition.archetype] ?? DOOM_ARCHETYPE_COLORS.breach;
  const pct = Math.round(state.progress * 100);
  // currentStage is 1-5, so index into stages array with currentStage - 1
  const currentStageDef = definition.stages[state.currentStage - 1] ?? definition.stages[0];
  const stageName = currentStageDef?.name ?? 'Unknown';
  const archetypeSphere = DOOM_ARCHETYPE_SPHERE[definition.archetype];
  const fallbackGlyph = DOOM_ARCHETYPE_GLYPHS[definition.archetype] ?? '◈';

  // Track doom progress and trigger pulse on increase
  const prevProgressRef = useRef(state.progress);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevStageRef = useRef(state.currentStage);
  const [stageAnnouncement, setStageAnnouncement] = useState('');

  useEffect(() => {
    if (state.progress > prevProgressRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      prevProgressRef.current = state.progress;
      return () => clearTimeout(timer);
    }
    prevProgressRef.current = state.progress;
  }, [state.progress]);

  useEffect(() => {
    if (state.currentStage !== prevStageRef.current) {
      setStageAnnouncement(`Doom has reached ${stageName}`);
      prevStageRef.current = state.currentStage;
    }
  }, [state.currentStage, stageName]);

  return (
    <Tooltip
      id="ui.doom_bar"
      label={`${definition.archetype} — Stage ${state.currentStage}: ${stageName}`}
    >
      <div className="min-w-0" style={{ minWidth: '140px' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {archetypeSphere
              ? <SphereIcon sphere={archetypeSphere} size={14} />
              : <span style={{ fontSize: 'var(--text-sm)', color, fontWeight: 700 }}>{fallbackGlyph}</span>
            }
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {stageName}
            </span>
          </div>
          <span className="font-mono ml-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {state.expired ? 'UNMADE' : `${pct}%`}
          </span>
        </div>
        <div className={isPulsing ? 'pulse-doom' : ''}>
          <ProgressBar progress={state.progress} color={color} glow={true} />
        </div>
        <span className="sr-only" aria-live="assertive">
          {stageAnnouncement}
        </span>
      </div>
    </Tooltip>
  );
}
