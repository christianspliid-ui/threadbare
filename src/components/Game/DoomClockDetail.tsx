import type { DoomClockDefinition, DoomClockState } from '../../types/doomClock';
import { Modal } from '../shared/Modal';
import { DOOM_ARCHETYPE_COLORS } from '../../data/uiColorPalette';

interface DoomClockDetailProps {
  open: boolean;
  onClose: () => void;
  definition: DoomClockDefinition;
  state: DoomClockState;
}

const DOOM_ARCHETYPE_GLYPHS: Record<string, string> = {
  breach: '◈',
  convergence: '⬡',
  changing: '∿',
  sundering: '⚡',
  failing: '◇',
  ascension: '✦',
  reckoning: '⚔',
};

const DOOM_ARCHETYPE_FLAVOR: Record<string, string> = {
  breach: 'An outside force tears at the fabric of reality. Each stage weakens the veil further.',
  convergence: 'All forces are drawn inexorably toward a single cataclysmic point.',
  changing: 'A new cosmic order rises to replace the old. The world transforms irreversibly.',
  sundering: 'The world itself fractures. Land, sea, and sky tear apart at the seams.',
  failing: 'A core force of creation weakens. The foundations of existence erode.',
  ascension: 'Something approaches godhood — and the world may not survive its arrival.',
  reckoning: 'Past debts come due. The sins of former cycles demand payment.',
};

/** SVG ring constants */
const RING = { cx: 80, cy: 80, r: 64, stroke: 7 } as const;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING.r;

export function DoomClockDetail({ open, onClose, definition, state }: DoomClockDetailProps) {
  const color = DOOM_ARCHETYPE_COLORS[definition.archetype] ?? DOOM_ARCHETYPE_COLORS.breach;
  const glyph = DOOM_ARCHETYPE_GLYPHS[definition.archetype] ?? '◈';
  const pct = Math.round(state.progress * 100);
  const flavor = DOOM_ARCHETYPE_FLAVOR[definition.archetype] ?? '';
  const ticksRemaining = Math.max(0, state.totalTicks - state.currentTick);

  return (
    <Modal open={open} onClose={onClose} maxWidth={720}>
      {/* Header — glyph + archetype name, color-accented */}
      <Modal.Header onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', color, filter: `drop-shadow(0 0 6px ${color}80)` }}>{glyph}</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
          }}>
            THE {definition.archetype.toUpperCase()}
          </span>
        </div>
      </Modal.Header>

      <Modal.Body>
        {/* Flavor text — sets the tone */}
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          fontStyle: 'italic',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          {flavor}
        </p>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: '24px' }}>

          {/* LEFT: Progress ring + stats */}
          <div style={{
            flex: '0 0 200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* SVG ring */}
            <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '16px' }}>
              <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                {/* Outer glow */}
                <circle
                  cx={RING.cx} cy={RING.cy} r={RING.r}
                  fill="none" stroke={`${color}15`} strokeWidth={RING.stroke + 8}
                />
                {/* Background track */}
                <circle
                  cx={RING.cx} cy={RING.cy} r={RING.r}
                  fill="none" stroke="#2a2a2e" strokeWidth={RING.stroke}
                />
                {/* Progress arc */}
                <circle
                  cx={RING.cx} cy={RING.cy} r={RING.r}
                  fill="none" stroke={color} strokeWidth={RING.stroke}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - state.progress)}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.5s ease',
                    filter: `drop-shadow(0 0 4px ${color}80)`,
                  }}
                />
                {/* Stage tick marks */}
                {definition.stages.map((stage, i) => {
                  const angle = stage.tickThreshold * 2 * Math.PI - Math.PI / 2;
                  const inner = RING.r - 12;
                  const outer = RING.r + 12;
                  const x1 = RING.cx + inner * Math.cos(angle);
                  const y1 = RING.cy + inner * Math.sin(angle);
                  const x2 = RING.cx + outer * Math.cos(angle);
                  const y2 = RING.cy + outer * Math.sin(angle);
                  const isPast = i < state.currentStage - 1;
                  return (
                    <line key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isPast ? `${color}60` : '#3a3a3e'}
                      strokeWidth={1.5}
                      // SVG is rotated -90deg, tick marks render correctly in rotated space
                    />
                  );
                })}
              </svg>
              {/* Center content */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: state.expired ? '#dc2626' : color,
                  lineHeight: 1,
                  textShadow: `0 0 12px ${color}40`,
                }}>
                  {state.expired ? '∞' : `${pct}%`}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {state.expired ? 'UNMADE' : 'elapsed'}
                </span>
              </div>
            </div>

            {/* Stat rows */}
            <div style={{ width: '100%' }}>
              <StatRow label="Current Stage" value={`${state.currentStage} of 5`} color={color} />
              <StatRow label="Ticks Elapsed" value={`${state.currentTick} / ${state.totalTicks}`} />
              <StatRow label="Ticks Remaining" value={`${ticksRemaining}`} />
              {state.tickModifier !== 1.0 && (
                <StatRow
                  label="Speed Modifier"
                  value={`×${state.tickModifier.toFixed(2)}`}
                  color={state.tickModifier > 1 ? '#dc2626' : '#22c55e'}
                />
              )}
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{
            width: '1px',
            alignSelf: 'stretch',
            background: `linear-gradient(to bottom, transparent, ${color}40, transparent)`,
          }} />

          {/* RIGHT: Escalation timeline */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}>
              Escalation
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {definition.stages.map((stage, idx) => {
                const isPast = idx < state.currentStage - 1;
                const isCurrent = idx === state.currentStage - 1;
                const isFuture = idx > state.currentStage - 1;

                return (
                  <div key={idx} style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: isCurrent ? `${color}10` : 'transparent',
                    border: isCurrent ? `1px solid ${color}30` : '1px solid transparent',
                    transition: 'background-color 0.2s',
                  }}>
                    {/* Stage row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {/* Timeline indicator */}
                      <div style={{
                        width: '18px', height: '18px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        backgroundColor: isPast ? `${color}30` : isCurrent ? color : '#2a2a2e',
                        border: isFuture ? '1.5px solid #3a3a3e' : 'none',
                        boxShadow: isCurrent ? `0 0 8px ${color}60` : 'none',
                        fontSize: '10px',
                        color: isPast ? color : isCurrent ? '#0a0a0e' : '#4a4a4e',
                        fontWeight: 700,
                      }}>
                        {isPast ? '✓' : stage.stage}
                      </div>

                      {/* Name */}
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: isCurrent ? color : isPast ? 'var(--text-secondary)' : 'var(--text-muted)',
                        flex: 1,
                      }}>
                        {stage.name}
                      </span>

                      {/* Threshold badge */}
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: isPast ? `${color}80` : 'var(--text-muted)',
                        opacity: isFuture ? 0.5 : 1,
                      }}>
                        {Math.round(stage.tickThreshold * 100)}%
                      </span>
                    </div>

                    {/* Current stage: show events */}
                    {isCurrent && stage.events.length > 0 && (
                      <div style={{ marginTop: '8px', marginLeft: '26px' }}>
                        {stage.events.map((event, eventIdx) => (
                          <div key={eventIdx} style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            marginBottom: '4px',
                            paddingLeft: '10px',
                            borderLeft: `2px solid ${color}40`,
                          }}>
                            {event.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal.Body>

      {/* Footer — thematic flavor */}
      <Modal.Footer>
        <div style={{
          width: '100%',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          opacity: 0.7,
        }}>
          The doom clock advances each tick. When it expires, the world is unmade.
        </div>
      </Modal.Footer>
    </Modal>
  );
}

/** Compact label–value row for the stats column */
function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '5px 0',
      borderBottom: '1px solid #1a1a1e',
      fontSize: '11px',
    }}>
      <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '10px' }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono, monospace)',
        color: color ?? 'var(--text-secondary)',
        fontWeight: 600,
      }}>
        {value}
      </span>
    </div>
  );
}
