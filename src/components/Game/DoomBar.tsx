import { useRef, useState, useEffect } from 'react';
import type { DoomClockState, DoomClockDefinition } from '../../types/doomClock';
import { ProgressBar } from '../shared/ProgressBar';
import { Tooltip } from '../shared/Tooltip';
import { DOOM_ARCHETYPE_COLORS } from '../../data/uiColorPalette';
import { SphereIcon } from '../icons';
import { DOOM_CLIMAX_START } from '../../data/game-config';
import { TOPBAR_LOCKED_SUFFIX, getUITooltip } from '../../data/ui-content';
import {
  DOOM_ARCHETYPE_SPHERE,
  doomArchetypeDisplayName,
  doomArchetypeGlyph,
} from '../../data/doom-archetype-presentation';

interface DoomBarProps {
  definition: DoomClockDefinition;
  state: DoomClockState;
  journeyLabel?: string;
  /**
   * THR-1814 — an encounter veil holds the top bar: the hover stays live and adds
   * the line that the panel opens when the chapter closes (Law 25).
   */
  locked?: boolean;
  /**
   * THR-1875 (frame plan § F3, yield step 3) — the stage name leaves line 1 when the top
   * bar is short of room. It stays in the tooltip's label, so it is one hover away.
   */
  hideStageName?: boolean;
}

/** THR-1875 — where the stage name ellipsizes before yield step 3 moves it into the tooltip. */
export const TOPBAR_DOOM_MAX_REM = 15;
/** THR-1875 — the expired state's word, sentence case (THR-1833: no capitals, no monospace). */
export const DOOM_UNMADE_WORD = 'Unmade';

function getNextStageHint(definition: DoomClockDefinition, state: DoomClockState): string {
  if (state.expired) return 'The doom has landed';
  if (state.progress >= DOOM_CLIMAX_START) return 'Climax window';

  const nextStage = definition.stages.find((stage) => stage.stage > state.currentStage);
  if (!nextStage) return 'Final omen';

  return `Next: ${nextStage.name}`;
}

export function DoomBar({ definition, state, journeyLabel, locked = false, hideStageName = false }: DoomBarProps) {
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

  // THR-1875 (§ F9): the journey line and the next-stage hint moved off the bar into
  // its tooltip — the label keeps today's composition, the description gains the hint.
  const baseDesc = getUITooltip('ui.doom_bar')?.desc ?? '';
  const desc = [baseDesc, `${nextStageHint}.`, locked ? TOPBAR_LOCKED_SUFFIX : ''].filter(Boolean).join(' ');
  const slotWord = state.expired ? DOOM_UNMADE_WORD : stageName;

  return (
    <Tooltip
      id="ui.doom_bar"
      label={`${doomName} — Stage ${state.currentStage}: ${stageName} — ${journeyHint}`}
      desc={desc}
    >
      <div className="topbar-tier min-w-0" data-doom-stage-shown={hideStageName ? 'false' : 'true'}>
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="topbar-section-label">Doom</span>
            <Tooltip id={`doom.${definition.archetype}`}>
              <span className="inline-flex items-center" data-doom-sigil={definition.archetype} aria-label={doomName}>
                {archetypeSphere
                  ? <SphereIcon sphere={archetypeSphere} size={14} />
                  : <span style={{ fontSize: 'var(--text-sm)', color, fontWeight: 700 }}>{fallbackGlyph}</span>
                }
              </span>
            </Tooltip>
            {!hideStageName && (
              <span
                className="truncate"
                data-testid="doom-stage-name"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: `${TOPBAR_DOOM_MAX_REM}rem` }}
              >
                {slotWord}
              </span>
            )}
          </div>
          {/* THR-1424 (Law 15 ruling, 2026-09-10): doom progress is a unitless proportion, and
              this tier already renders it as the `ProgressBar` below plus the stage name beside
              it. The numeral is dropped, never banded — an adverb is the wrong answer to
              "how much?" (Law 13 amendment, 2026-08-12). `UNMADE` survives: it is a terminal
              state, not a proportion. */}
          {/* THR-1424: the bar below is the reading; no numeral. The expired state's
              word sits in the stage name's slot (THR-1875). */}
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
