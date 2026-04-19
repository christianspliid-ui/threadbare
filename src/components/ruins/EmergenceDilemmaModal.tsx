/**
 * EmergenceDilemmaModal — blocking decision surface when a delve completes
 * (THR-153, PR 5). Renders four choice cards in a 2×2 grid: Let, Claim,
 * Bargain, Corrupt. Inviable options (when consequenceRoll is not 'transformed')
 * render greyed with a tooltip. Cost previews compare against current pool;
 * unaffordable cards render greyed. A countdown pip shows auto-fire ticks
 * remaining.
 *
 * 1920×1080 compliant: max-height 85vh, no internal overflow.
 */

import React, { useMemo } from 'react';
import type { GameState } from '../../types/gameState';
import type { EmergenceChoice } from '../../engine/ruins/ruinTransformation';
import {
  POP_CLAIM_COST_MULTIPLIER,
  POP_CORRUPT_UP_FRONT_COST,
} from '../../engine/ruins/constants';

interface Props {
  gameState: GameState;
  onResolve: (choice: EmergenceChoice) => void;
}

const OVERLAY: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(8,6,4,0.78)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1200,
  pointerEvents: 'auto',
};

const MODAL: React.CSSProperties = {
  background: 'var(--bg-overlay, rgba(18,14,10,0.98))',
  border: '1px solid var(--border-gold, #8b7355)',
  borderRadius: '6px',
  width: 'min(720px, 92vw)',
  maxHeight: '85vh',
  padding: '18px 20px 20px',
  color: 'var(--text-primary, #e8dcc8)',
  fontFamily: 'var(--font-body, sans-serif)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const HEADER: React.CSSProperties = {
  font: 'var(--type-section-label, 700 11px/1.2 var(--font-display, serif))',
  letterSpacing: '0.1em',
  color: 'var(--accent-gold, #c9a227)',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const TIMER: React.CSSProperties = {
  fontFamily: 'var(--font-body, sans-serif)',
  fontSize: '11px',
  letterSpacing: 'normal',
  color: 'var(--text-muted, #8a7d6b)',
  textTransform: 'none',
};

const GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
};

const CARD_BASE: React.CSSProperties = {
  padding: '12px 14px',
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
  borderRadius: '4px',
  background: 'rgba(255,255,255,0.02)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minHeight: '120px',
  transition: 'border-color 120ms ease, background 120ms ease',
  textAlign: 'left',
};

const CARD_TITLE: React.CSSProperties = {
  font: '600 13px/1.2 var(--font-display, serif)',
  color: 'var(--accent-gold, #c9a227)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const CARD_PROSE: React.CSSProperties = {
  fontFamily: 'var(--font-display, serif)',
  fontStyle: 'italic',
  fontSize: '12px',
  color: 'var(--text-primary, #e8dcc8)',
  lineHeight: 1.4,
};

const CARD_COST: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted, #8a7d6b)',
  marginTop: 'auto',
};

interface ChoiceSpec {
  choice: EmergenceChoice;
  label: string;
  poet: string;
  costLabel: string;
}

const CHOICE_SPECS: ChoiceSpec[] = [
  {
    choice: 'let',
    label: 'Let It Be',
    poet: 'Walk away. Let the ruin decide what it becomes.',
    costLabel: 'No cost',
  },
  {
    choice: 'claim',
    label: 'Claim',
    poet: 'Plant your own banner in the stone. The Place will answer to you.',
    costLabel: 'Essence: magnitude × 20',
  },
  {
    choice: 'bargain',
    label: 'Bargain',
    poet: 'Let the agent keep it. Owe them a favor that will ripen in time.',
    costLabel: 'Costs a favor owed',
  },
  {
    choice: 'corrupt',
    label: 'Corrupt',
    poet: 'Mark the holder. Skim the stream. They will not know.',
    costLabel: `Essence: ${POP_CORRUPT_UP_FRONT_COST} (darkness)`,
  },
];

export function EmergenceDilemmaModal({ gameState, onResolve }: Props) {
  const pending = gameState.pendingEmergenceDecision;

  const totalEssence = useMemo(() => {
    if (!gameState.essencePool) return 0;
    return Object.values(gameState.essencePool).reduce((a, b) => a + (b ?? 0), 0);
  }, [gameState.essencePool]);

  if (!pending) return null;

  const ticksRemaining = Math.max(0, pending.autoFiresTick - gameState.tick);
  const isTransformed = pending.consequenceRoll === 'transformed';

  const claimCost = pending.ruinMagnitude * POP_CLAIM_COST_MULTIPLIER;
  const claimAffordable = totalEssence >= claimCost;
  const corruptAffordable = totalEssence >= POP_CORRUPT_UP_FRONT_COST;

  function isEnabled(c: EmergenceChoice): boolean {
    if (c === 'let') return true;
    if (!isTransformed) return false;
    if (c === 'claim') return claimAffordable;
    if (c === 'corrupt') return corruptAffordable;
    return true;
  }

  function disabledReason(c: EmergenceChoice): string {
    if (!isTransformed && c !== 'let') {
      return `This outcome cannot be claimed — the ruin was ${pending.consequenceRoll}.`;
    }
    if (c === 'claim' && !claimAffordable) return 'Not enough essence.';
    if (c === 'corrupt' && !corruptAffordable) return 'Not enough darkness essence.';
    return '';
  }

  return (
    <div style={OVERLAY} role="dialog" aria-modal="true" aria-label="Emergence Dilemma">
      <div style={MODAL}>
        <div style={HEADER}>
          <span>Emergence Dilemma · {pending.consequenceRoll}</span>
          <span style={TIMER}>Auto-fires in {ticksRemaining} ticks</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display, serif)', fontStyle: 'italic', fontSize: '13px', color: 'var(--text-primary, #e8dcc8)', lineHeight: 1.5 }}>
          The delve has reached its last breath. What do you do with what remains?
        </div>
        <div style={GRID}>
          {CHOICE_SPECS.map(spec => {
            const enabled = isEnabled(spec.choice);
            const reason = enabled ? '' : disabledReason(spec.choice);
            const cardStyle: React.CSSProperties = {
              ...CARD_BASE,
              opacity: enabled ? 1 : 0.45,
              cursor: enabled ? 'pointer' : 'not-allowed',
              borderColor: enabled ? 'var(--border-subtle, rgba(255,255,255,0.12))' : 'rgba(255,255,255,0.06)',
            };
            return (
              <button
                key={spec.choice}
                data-testid={`emergence-choice-${spec.choice}`}
                type="button"
                disabled={!enabled}
                title={reason || undefined}
                onClick={() => enabled && onResolve(spec.choice)}
                style={cardStyle}
              >
                <div style={CARD_TITLE}>{spec.label}</div>
                <div style={CARD_PROSE}>{spec.poet}</div>
                <div style={CARD_COST}>{enabled ? spec.costLabel : reason}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
