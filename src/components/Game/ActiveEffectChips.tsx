/**
 * ActiveEffectChips — what your hand is doing to a mortal, as chips (THR-1606).
 *
 * One renderer for `card.activeEffects` (Law 3). Until THR-1606 the block lived
 * inline in `AgentInfoCard`, which is imported but mounted nowhere live, so the
 * player could never see a dream or a compulsion on the mortal it touched. It now
 * mounts on the thread detail and the profile sheet under "Under your hand".
 *
 * Each chip is one real `divineInfluences` entry or court position (Law 56): the
 * engine drops expired influences before the card is built. The chip wears its
 * sheet noun (Dreaming / Compelled), its sphere tint, and on hover what it does
 * and when it fades (`ActiveEffect.hover`, a `durationLabel` reading — Law 13).
 */
import type { ActiveEffect } from '../../engine/agentDetail';
import { Tooltip } from '../shared/Tooltip';
import { getSphereColor } from '../../data/sphereIcons';
import { durationLabel } from '../../engine/aftermathWords';

export interface ActiveEffectChipsProps {
  effects: readonly ActiveEffect[] | undefined;
  /** Section heading shown above the chips; omitted in compact placements. */
  heading?: string;
}

/** The heading the sheet surfaces use (Law 17: a plain game phrase, no jargon). */
export const UNDER_YOUR_HAND_HEADING = 'Under your hand';

export function ActiveEffectChips({ effects, heading }: ActiveEffectChipsProps) {
  if (!effects || effects.length === 0) return null;
  return (
    <div data-testid="active-effect-chips">
      {heading && (
        <div
          className="uppercase tracking-wider mb-1"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
        >
          {heading}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {effects.map((effect, idx) => {
          const sphereColor = effect.sphere ? getSphereColor(effect.sphere) : 'var(--accent-gold)';
          const isCourtPosition = effect.type === 'scry_court';
          const strengthPct = effect.strength != null ? Math.round(effect.strength * 100) : null;

          return (
            <Tooltip
              key={idx}
              label={effect.label}
              desc={
                isCourtPosition
                  ? 'Court position in your divine Scry'
                  : // THR-1606: the effect in words, when the influence carries one.
                    // Otherwise THR-1423's reading stands: `durationLabel`, never ticks
                    // (Law 13), and no clause at all for a permanent effect (NFP #4).
                    // THR-1424: the unitless strength is dropped from the tooltip — the
                    // bar below is its reading (Law 15 ruling, 2026-09-10).
                    effect.hover
                      ?? (effect.ticksRemaining != null
                        ? `${durationLabel(effect.ticksRemaining)} remaining`
                        : undefined)
              }
            >
              <span
                data-testid="active-effect-chip"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-help"
                style={{
                  fontSize: 'var(--text-xs)',
                  backgroundColor: `color-mix(in srgb, ${sphereColor} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${sphereColor} 40%, transparent)`,
                  color: sphereColor,
                }}
              >
                {isCourtPosition ? '♛' : '◈'}
                <span>{effect.label}</span>
                {!isCourtPosition && strengthPct != null && (
                  <span
                    style={{
                      width: '1.5rem',
                      height: '3px',
                      borderRadius: '2px',
                      backgroundColor: `color-mix(in srgb, ${sphereColor} 25%, transparent)`,
                      display: 'inline-block',
                      position: 'relative',
                      verticalAlign: 'middle',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${strengthPct}%`,
                        borderRadius: '2px',
                        backgroundColor: sphereColor,
                      }}
                    />
                  </span>
                )}
              </span>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
