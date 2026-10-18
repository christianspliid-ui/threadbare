import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { IconButton } from '../shared/IconButton';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { FIRST_RUN_PROMPT_CAPTION, CLOCK_HELD_STAYS_PAUSED_DESC } from '../../data/ui-content';
import { clockHeldStatus } from '../../data/nudge-stage-content';
import { SPEED_DOWN_ARIA, SPEED_UP_ARIA } from '../../data/frame-content';
import { Icon } from '../shared/Icon';

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
   * THR-1724 / THR-1814 — what is holding the clock, by name (an encounter's
   * title, or the interrupt's holder name). The status line then reads "held by
   * the Chapter Ledger · runs on when it closes": Law 52, as amended 2026-10-04,
   * names an auto-pause here rather than on the surface itself. Absent ⇒ the
   * fallback holder ("this window").
   */
  heldBy?: string;
  /**
   * THR-1812 — a chapter answer this clock is turning toward ("turning · until
   * The Healer's Oath answers") or one waiting on a paused clock ("paused · The
   * Healer's Oath answers when time runs"). Replaces the running/paused words
   * when the clock is not held by an interrupt (Law 52).
   */
  answerStatus?: string;
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

/** THR-1716 — the ring wrapper's style; `--sphere-color` tints the `pulseGlow` keyframes. */
function firstRunRingStyle(reducedMotion: boolean): React.CSSProperties & { '--sphere-color': string } {
  return {
    display: 'inline-flex',
    borderRadius: 'var(--radius-sm, 4px)',
    '--sphere-color': 'var(--accent-gold, #d4a040)',
    ...(reducedMotion ? { boxShadow: FIRST_RUN_STATIC_RING } : { animation: FIRST_RUN_PULSE }),
  };
}

export const SPEED_STEPS = [1, 2, 3, 5, 10, 20];

const SEASON_ICONS: Record<string, string> = {
  spring: '∿', summer: '☼', autumn: '◇', winter: '❋',
};

export function SimulationControls({
  season, year, running, speed,
  onToggle, onStep, onSpeedChange, compact, held = false, heldBy, answerStatus, firstRunPrompt = false,
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
    // THR-1814: a held clock always names its holder and what happens when it closes.
    const statusText = held
      ? clockHeldStatus(heldBy, running)
      : answerStatus ? answerStatus
      : prompting ? FIRST_RUN_PROMPT_CAPTION
      // THR-1893: the speed stepper beside the date shows the speed, so the line no longer repeats it.
      : running ? 'running' : 'paused';
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
                style={firstRunRingStyle(reducedMotion)}
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
          {/* THR-1893 (frame plan § F3): the speed stepper, moved here from World Pulse so
              the persistent time control holds speed too (Law 52). The readout is a control
              setting, like a volume level, so it stays a numeral (Law 13). */}
          <Tooltip id="ui.sim_speed">
            <div data-testid="speed-stepper" className="flex items-center" style={{ gap: 'var(--space-1)' }}>
              <IconButton
                icon={<Icon name="slower" size="chip" decorative />}
                size="sm"
                onClick={speedDown}
                disabled={speed === SPEED_STEPS[0]}
                aria-label={SPEED_DOWN_ARIA}
              />
              <span
                data-testid="speed-readout"
                style={{
                  font: 'var(--type-body-small)',
                  fontVariantNumeric: 'lining-nums tabular-nums',
                  color: 'var(--text-primary)',
                  minWidth: '2rem',
                  textAlign: 'center',
                }}
              >
                {speed}×
              </span>
              <IconButton
                icon={<Icon name="faster" size="chip" decorative />}
                size="sm"
                onClick={speedUp}
                disabled={speed === SPEED_STEPS[SPEED_STEPS.length - 1]}
                aria-label={SPEED_UP_ARIA}
              />
            </div>
          </Tooltip>
        </div>
        {(() => {
          const status = (
            <span
              style={{
                font: 'var(--type-body-small)',
                color: prompting ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                fontStyle: 'italic',
                whiteSpace: 'nowrap',
              }}
              {...(prompting ? { 'data-testid': 'first-run-caption' } : {})}
              {...(held ? { 'data-testid': 'clock-held-status' } : {})}
            >
              {statusText}
            </span>
          );
          // The registry copy says time runs again; a clock paused before the hold
          // stays paused, so that branch carries its own line.
          return held
            ? <Tooltip id="ui.clock_held" desc={running ? undefined : CLOCK_HELD_STAYS_PAUSED_DESC}>{status}</Tooltip>
            : status;
        })()}
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
          <p className="figures-tabular" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Year {year}</p>
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
            <span className="flex-1 text-center figures-tabular" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{speed}×</span>
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
