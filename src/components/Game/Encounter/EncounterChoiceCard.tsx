import React from 'react';
import { MoralAxisTilt } from './MoralAxisTilt';
import type {
  EncounterChoiceContract,
  EncounterChoiceCost,
  EncounterChoiceReach,
} from '../../../types/encounter-contract';

const COST_LABEL: Record<EncounterChoiceCost, string> = {
  small_breath: 'small breath',
  fuller_breath: 'fuller breath',
  deep_draught: 'deep draught',
};

// Display label for each reach in the top-of-card sphere line. Lower-case
// because the inline style applies textTransform: uppercase.
const REACH_LABEL: Record<EncounterChoiceReach, string> = {
  iron: 'iron',
  gold: 'gold',
  shadow: 'shadow',
  veil: 'veil',
  heart: 'heart',
  eye: 'eye',
  stone: 'stone',
  star: 'star',
  quintessence: 'quintessence',
};

export interface EncounterChoiceCardProps {
  choice: EncounterChoiceContract;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: () => void;
  /**
   * Optional callback fired when the consumes-item indicator is hovered or
   * activated. Click on the indicator does not bubble to onSelect.
   */
  onConsumesItemHover?: (item: string) => void;
}

/**
 * EncounterChoiceCard — full divine-choice card per design plan §5.3.
 *
 * Renders a single `EncounterChoiceContract` as a keyboard-activatable
 * button. All sphere colour comes from the `data-reach` cascade
 * (`--reach-sphere`, `--reach-sphere-bright`); for `quintessence` we fall
 * back to the gold accent. No numeric stats are ever rendered.
 */
export function EncounterChoiceCard({
  choice,
  selected = false,
  dimmed = false,
  onSelect,
  onConsumesItemHover,
}: EncounterChoiceCardProps) {
  const isQuintessence = choice.reach === 'quintessence';
  const accent = isQuintessence
    ? 'var(--accent-gold)'
    : 'var(--reach-sphere-bright)';
  const accentDim = isQuintessence
    ? 'var(--accent-gold-dim)'
    : 'var(--reach-sphere)';

  const handleActivate = React.useCallback(() => {
    onSelect?.();
  }, [onSelect]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleActivate();
      }
    },
    [handleActivate],
  );

  // Border colour: sphere-bright when selected, otherwise subtle.
  const borderColor = selected ? accent : 'var(--border-subtle)';

  return (
    <div
      data-testid={`encounter-choice-card-${choice.reach}`}
      data-reach={isQuintessence ? undefined : choice.reach}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={choice.god_verb}
      className="pulse-gold-on-hover"
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 8,
        background: 'var(--bg-surface)',
        border: `1px solid ${borderColor}`,
        opacity: dimmed && !selected ? 0.35 : 1,
        transition: 'opacity 300ms ease-out, border-color 300ms ease-out',
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
      }}
    >
      {/* Top row: sphere label · cost */}
      <div
        data-testid="encounter-choice-card-sphere-line"
        style={{
          color: accent,
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {REACH_LABEL[choice.reach]} · {COST_LABEL[choice.cost]}
      </div>

      {/* God-verb display */}
      <div
        data-testid="encounter-choice-card-god-verb"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 18,
          fontStyle: 'italic',
          fontWeight: 400,
          color: 'var(--text-primary)',
          marginTop: 6,
        }}
      >
        {choice.god_verb}
      </div>

      {/* Sphere-dim divider, 36px wide */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          width: 36,
          background: accentDim,
          margin: '8px 0 10px',
        }}
      />

      {/* Body prose: agent reaction */}
      <div
        data-testid="encounter-choice-card-agent-reaction"
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--text-primary)',
        }}
      >
        {choice.agent_reaction}
      </div>

      {/* "Tilts toward: …" line */}
      <div
        data-testid="encounter-choice-card-tilts-toward"
        style={{
          color: 'var(--text-tertiary)',
          fontSize: 12,
          marginTop: 10,
        }}
      >
        Tilts toward: {choice.tilts_toward}
      </div>

      {/* Moral-axis pole tilt line */}
      <MoralAxisTilt reach={choice.reach} pole={choice.moral_axis_pole} />

      {/* Fail-forward line */}
      <div
        data-testid="encounter-choice-card-fail-forward"
        style={{
          color: 'var(--text-tertiary)',
          fontSize: 11,
          fontStyle: 'italic',
          marginTop: 6,
        }}
      >
        ↗ on fail — {choice.fail_forward}
      </div>

      {/* Consumes-item indicator (optional) */}
      {choice.consumes_item && (
        <div
          data-testid="encounter-choice-card-consumes-item"
          onClick={(event) => {
            event.stopPropagation();
            if (choice.consumes_item) {
              onConsumesItemHover?.(choice.consumes_item);
            }
          }}
          onMouseEnter={() => {
            if (choice.consumes_item) {
              onConsumesItemHover?.(choice.consumes_item);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: 11,
            marginTop: 6,
            cursor: 'help',
          }}
        >
          <span aria-hidden="true">◇</span>
          <span>consumes: {choice.consumes_item}</span>
        </div>
      )}
    </div>
  );
}
