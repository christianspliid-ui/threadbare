import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { IconButton } from '../shared/IconButton';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { FIRST_RUN_PROMPT_CAPTION } from '../../data/ui-content';

interface SimulationControlsProps {
  /*
   * THR-1426: `tick` was removed rather than left unused. Both of this component's
   * tiers rendered it as a bare clock index and both dropped it, so the prop had no
   * remaining reader — and `noUnusedLocals` makes a kept-but-dead prop a build error,
   * not a harmless leftover. Season and year are what orient the player here.
   */
  season: string;
  year: number;
  running: boolean;
  speed: number;
  onToggle: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  compact?: boolean;
  /**
   * True while an interrupt holds the clock (THR-1711). `running` is then the
   * state the clock returns to on close, not the frozen live clock, so the button
   * shows what a press will do; the status line says the world is held.
   */
  held?: boolean;
  /**
   * THR-1724 — what is holding the clock, by name (an encounter's title). The
   * status line then reads "paused · The Unsafe Bridge": Law 52, as amended
   * 2026-10-04, names an encounter's auto-pause here rather than on the
   * encounter surface itself. Absent ⇒ the generic held wording.
   */
  heldBy?: string;
  /**
   * THR-1716 — the clock has never run and nothing holds it: the Play control
   * pulses and the status line asks for it, until the first run. A static ring
   * under `prefers-reduced-motion` (Law 44).
   */
  firstRunPrompt?: boolean;
}

/** THR-1716 — one slow breath of the first-run ring. */
const FIRST_RUN_PULSE = 'pulseGlow 2.4s ease-in-out infinite';
/** THR-1716 — the ring drawn without motion (Law 44). */
const FIRST_RUN_STATIC_RING = '0 0 0 2px var(--accent-gold, #d4a040)';

export const SPEED_STEPS = [1, 2, 3, 5, 10, 20];

const SEASON_ICONS: Record<string, string> = {
  spring: '∿', summer: '☼', autumn: '◇', winter: '❋',
};

export function SimulationControls({
  season, year, running, speed,
  onToggle, onStep, onSpeedChange, compact, held = false, heldBy, firstRunPrompt = false,
}: SimulationControlsProps) {
  const reducedMotion = usePrefersReducedMotion();
  function speedDown() {
    const idx = SPEED_STEPS.indexOf(speed);
    const prev = SPEED_STEPS[Math.max(idx - 1, 0)];
    if (prev !== undefined && prev !== speed) onSpeedChange(prev);
  }

  function speedUp() {
    const idx = SPEED_STEPS.indexOf(speed);
    const next = SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)];
    if (next !== undefined && next !== speed) onSpeedChange(next);
  }

  if (compact) {
    const prompting = firstRunPrompt && !running && !held;
    const statusText = held
      ? (heldBy ? `paused · ${heldBy}` : running ? 'held · runs on after' : 'held · stays paused')
      : prompting ? FIRST_RUN_PROMPT_CAPTION
      : running ? `running ×${speed}` : 'paused';
    const playButton = (
      <IconButton
        icon={<span>{running ? '⏸' : '⏵'}</span>}
        size="sm"
        active={running}
        onClick={onToggle}
        aria-label={running ? 'Pause simulation' : 'Play simulation'}
      />
    );
    return (
      <div className="topbar-tier">
        <span className="topbar-section-label">Time</span>
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          {/* THR-1426 (Shape 1): the tooltip named the engine's clock index (Laws 13/14). The
              control it labels is play/pause, so the tooltip says what the control does. */}
          {prompting ? (
            // THR-1716: the first-run ring sits on a wrapper so the button's own
            // styles stay untouched; it goes for good once the clock first runs.
            <Tooltip id="ui.sim_first_run">
              <span
                data-testid="first-run-prompt"
                data-motion={reducedMotion ? 'static' : 'pulse'}
                style={{
                  display: 'inline-flex',
                  borderRadius: 'var(--radius-sm, 4px)',
                  '--sphere-color': 'var(--accent-gold, #d4a040)',
                  ...(reducedMotion
                    ? { boxShadow: FIRST_RUN_STATIC_RING }
                    : { animation: FIRST_RUN_PULSE }),
                } as React.CSSProperties}
              >
                {playButton}
              </span>
            </Tooltip>
          ) : (
            <Tooltip label={running ? 'Pause' : 'Play'} desc="Hold the world still, or let it run on">
              {playButton}
            </Tooltip>
          )}
          <span
            style={{
              font: 'var(--type-body-small)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            {/* THR-1426 (Shape 1): was `tick {tick} · {season} · year {year}`. The season and
                year are the orientation a player uses; the raw tick index in front of them was
                the engine's clock (Laws 13/14) and read as noise beside a real calendar. */}
            {season} · year {year}
          </span>
        </div>
        <span
          style={{
            font: 'var(--type-body-small)',
            color: prompting ? 'var(--text-secondary)' : 'var(--text-tertiary)',
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
          }}
          {...(prompting ? { 'data-testid': 'first-run-caption' } : {})}
        >
          {statusText}
        </span>
      </div>
    );
  }

  return (
    <div className="panel-glass space-y-3" style={{ padding: 'var(--panel-padding)' }}>
      <div className="flex items-center justify-between">
        <h2
          className="font-bold uppercase tracking-widest"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Time
        </h2>
        {/* THR-1426 (Shape 1): the `Tick N` counter is dropped from this header for the same
            reason as the compact tier's — an engine clock index with no reading (Laws 13/14).
            The season-and-year block directly below is the orientation this panel exists for. */}
      </div>

      {/* Season & year display */}
      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-2xl">{SEASON_ICONS[season] ?? '🌍'}</span>
        <div className="text-center">
          <p className="font-semibold capitalize" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{season}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Year {year}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Tooltip id="ui.sim_play_pause">
          <Button
            variant={running ? 'primary' : 'secondary'}
            fullWidth
            onClick={onToggle}
          >
            {running ? '⏸ Pause' : '▶ Play'}
          </Button>
        </Tooltip>
        <Button
          variant="secondary"
          onClick={onStep}
          disabled={running}
        >
          ⏭ Step
        </Button>
      </div>

      {/* Speed */}
      <Tooltip id="ui.sim_speed">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Speed</span>
          <div className="flex items-center gap-2 flex-1">
            <IconButton
              icon={<span>◀</span>}
              size="sm"
              onClick={speedDown}
              disabled={speed === SPEED_STEPS[0]}
              aria-label="Decrease speed"
            />
            <span className="flex-1 text-center font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{speed}×</span>
            <IconButton
              icon={<span>▶</span>}
              size="sm"
              onClick={speedUp}
              disabled={speed === SPEED_STEPS[SPEED_STEPS.length - 1]}
              aria-label="Increase speed"
            />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
