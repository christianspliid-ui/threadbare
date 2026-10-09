import { useRef, useState, useEffect } from 'react';
import type { DoomClockState, DoomClockDefinition } from '../../types/doomClock';
import { ProgressBar } from '../shared/ProgressBar';
import { Tooltip } from '../shared/Tooltip';
import { DOOM_ARCHETYPE_COLORS } from '../../data/uiColorPalette';
import { SphereIcon } from '../icons';
import { DOOM_CLIMAX_START } from '../../data/game-config';
import {
  DOOM_ARCHETYPE_SPHERE,
  doomArchetypeDisplayName,
  doomArchetypeGlyph,
} from '../../data/doom-archetype-presentation';

interface DoomBarProps {
  definition: DoomClockDefinition;
  state: DoomClockState;
  journeyLabel?: string;
}

function getNextStageHint(definition: DoomClockDefinition, state: DoomClockState): string {
  if (state.expired) return 'The doom has landed';
  if (state.progress >= DOOM_CLIMAX_START) return 'Climax window';

  const nextStage = definition.stages.find((stage) => stage.stage > state.currentStage);
  if (!nextStage) return 'Final omen';

  return `Next: ${nextStage.name}`;
}

export function DoomBar({ definition, state, journeyLabel }: DoomBarProps) {
  const color = DOOM_ARCHETYPE_COLORS[definition.archetype] ?? DOOM_ARCHETYPE_COLORS.breach;
  // currentStage is 1-5, so index into stages array with currentStage - 1
  const currentStageDef = definition.stages[state.currentStage - 1] ?? definition.stages[0];
  const stageName = currentStageDef?.name ?? 'Unknown';
  // THR-1774: the sigil is the sphere the doom's own cards press (one table, held
  // equal to the cards by test); a doom that presses none shows its glyph.
  const archetypeSphere = DOOM_ARCHETYPE_SPHERE[definition.archetype];
  const fallbackGlyph = doomArchetypeGlyph(definition.archetype);
  const doomName = doomArchetypeDisplayName(definition.archetype);
  const nextStageHint = getNextStageHint(definition, state);
  const journeyHint = journeyLabel ? `The First: ${journeyLabel}` : 'The First awaits';

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
      label={`${doomName} — Stage ${state.currentStage}: ${stageName}${journeyLabel ? ` — ${journeyHint}` : ''}`}
    >
      <div className="topbar-tier min-w-0" style={{ minWidth: '170px' }}>
        <span className="topbar-section-label">Doom</span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tooltip id={`doom.${definition.archetype}`}>
              <span className="inline-flex items-center" data-doom-sigil={definition.archetype} aria-label={doomName}>
                {archetypeSphere
                  ? <SphereIcon sphere={archetypeSphere} size={14} />
                  : <span style={{ fontSize: 'var(--text-sm)', color, fontWeight: 700 }}>{fallbackGlyph}</span>
                }
              </span>
            </Tooltip>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {stageName}
            </span>
          </div>
          {/* THR-1424 (Law 15 ruling, 2026-09-10): doom progress is a unitless proportion, and
              this tier already renders it as the `ProgressBar` below plus the stage name beside
              it. The numeral is dropped, never banded — an adverb is the wrong answer to
              "how much?" (Law 13 amendment, 2026-08-12). `UNMADE` survives: it is a terminal
              state, not a proportion. */}
          {state.expired && (
            <span className="font-mono ml-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              UNMADE
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-between gap-2"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
        >
          <span className="truncate">{journeyHint}</span>
          <span className="truncate" style={{ maxWidth: '84px', textAlign: 'right' }}>{nextStageHint}</span>
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
