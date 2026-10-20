/**
 * EmergenceDilemmaModal — blocking decision surface when a delve completes
 * (THR-153, PR 5). Renders four choice cards in a 2×2 grid: Let, Claim,
 * Bargain, Corrupt. Inviable options (when consequenceRoll is not 'transformed')
 * render greyed with the reason in place. Cost previews compare against current
 * pool; unaffordable cards render greyed. A countdown says, in words, how long
 * is left before the choice auto-fires.
 *
 * Every player-facing string here routes through a display vocabulary
 * (`data/ruin-words.ts` for the fate, `getDurationWord` for the wait) rather
 * than interpolating engine values — THR-1080.
 *
 * THR-1897 (plan THR-1877 § D4, S4): the dilemma plays on the Stage, lit at the ruin's
 * place (else the mortal's), in the `elder` palette; compact, since a ruin carries no art
 * of its own today. The Stage's context line names the mortal and the place under the
 * header. Its `Modal` is gone; its words are not. The panel's body is the only scroll box
 * (Law 57).
 */

import React, { useMemo } from 'react';
import { Stage } from '../Game/stage/Stage';
import { StageContextLine } from '../Game/StoryBeatModal';
import { fallbackStageView, type StageVM } from '../../engine/views/stage/stageView';
import type { GameState } from '../../types/gameState';
import type { EmergenceChoice } from '../../engine/ruins/ruinTransformation';
import {
  POP_CLAIM_COST_MULTIPLIER,
  POP_CORRUPT_UP_FRONT_COST,
} from '../../engine/ruins/constants';
import { getRuinFateWord, getRuinFateClause } from '../../data/ruin-words';
import { getDurationWord } from '../../data/domain-words';

interface Props {
  gameState: GameState;
  onResolve: (choice: EmergenceChoice) => void;
  /** THR-1897 — the Stage view model (lit at the ruin); absent ⇒ nothing lit. */
  stageVM?: StageVM | null;
}

/** The Stage's accessible name. */
const STAGE_LABEL = 'Emergence Dilemma';

/**
 * What Escape and a backdrop click resolve to (Laws 23, 48).
 *
 * This surface has no dismiss — it is a forced choice with a countdown — so
 * the Stage's Escape had to be given a meaning rather than wired to a
 * no-op. `let` is the right one and is not a judgement call: it is exactly what
 * `phaseDelveEmergence` fires when `autoFiresTick` passes (`delveVariant.ts`,
 * `emergenceChoice: 'let'`). So the keypress cannot reach an outcome that
 * simply waiting would not, which is what keeps this clear of Law 48 — `let`
 * is the decline path and spends nothing; the three options that *do* spend
 * still require their own click.
 */
const CLOSE_RESOLVES_TO: EmergenceChoice = 'let';

const BODY: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const HEADER: React.CSSProperties = {
  font: '700 var(--text-xs)/1.2 var(--font-body)',
  color: 'var(--dlg-accent-text, var(--accent-gold))',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const TIMER: React.CSSProperties = {
  fontFamily: 'var(--font-body, sans-serif)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
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
  font: '700 var(--text-sm)/1.2 var(--font-body)',
  color: 'var(--dlg-accent-text, var(--accent-gold))',
};

const CARD_PROSE: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-primary)',
  lineHeight: 1.4,
};

const CARD_COST: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginTop: 'auto',
};

interface ChoiceSpec {
  choice: EmergenceChoice;
  label: string;
  poet: string;
  /**
   * The card's price as a sentence.
   *
   * A function rather than a string because Claim's price is not knowable at
   * module scope — it scales with the ruin's magnitude, which is why the card
   * used to read `Essence: magnitude × 20` and hand the player the algebra
   * while the component already held the answer (`claimCost`, computed at the
   * render site to decide affordability). Law 16 also retires the `key: value`
   * strip these all shared, so each one is now a sentence.
   */
  costSentence: (claimCost: number) => string;
}

const CHOICE_SPECS: ChoiceSpec[] = [
  {
    choice: 'let',
    label: 'Let it be',
    poet: 'Walk away. Let the ruin decide what it becomes.',
    costSentence: () => 'Costs you nothing.',
  },
  {
    choice: 'claim',
    label: 'Claim',
    poet: 'Plant your own banner in the stone. The Place will answer to you.',
    costSentence: claimCost => `Costs ${claimCost} essence.`,
  },
  {
    choice: 'bargain',
    label: 'Bargain',
    poet: 'Let the agent keep it. Owe them a favor that will ripen in time.',
    costSentence: () => 'Costs a favor you will owe.',
  },
  {
    choice: 'corrupt',
    label: 'Corrupt',
    poet: 'Mark the holder. Skim the stream. They will not know.',
    costSentence: () => `Costs ${POP_CORRUPT_UP_FRONT_COST} darkness essence.`,
  },
];

export function EmergenceDilemmaModal({ gameState, onResolve, stageVM }: Props) {
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
      return `This outcome cannot be claimed — the ruin was ${getRuinFateClause(pending.consequenceRoll)}.`;
    }
    if (c === 'claim' && !claimAffordable) return 'Not enough essence.';
    if (c === 'corrupt' && !corruptAffordable) return 'Not enough darkness essence.';
    return '';
  }

  const vm = stageVM ?? fallbackStageView({ kind: 'emergence-dilemma', hasArt: false, hasCast: false });

  return (
    <Stage
      kind="emergence-dilemma"
      vm={vm}
      label={STAGE_LABEL}
      onEscape={() => onResolve(CLOSE_RESOLVES_TO)}
      tick={gameState.tick}
      right={(
      <div data-emergence-dilemma-stage="" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--panel-padding, 20px)' }}>
        <div style={BODY}>
          <div style={HEADER}>
            <span>Emergence dilemma · {getRuinFateWord(pending.consequenceRoll)}</span>
            {/* Law 13 — the wait reads in words. `getDurationWord` is THR-1070's
                scale, adopted rather than restated: the two tickets were made
                mutex so the game would not grow a second phrasing for a wait.
                The zero case keeps the caller's own verb inflection, matching
                the `auto-resolving now` shape THR-1068 landed on the veil. */}
            <span style={TIMER}>
              {ticksRemaining === 0 ? 'Auto-firing now' : `Auto-fires ${getDurationWord(ticksRemaining)}`}
            </span>
          </div>
          <StageContextLine line={vm.contextLine} />
          <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 'var(--text-xs)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
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
                  onClick={() => enabled && onResolve(spec.choice)}
                  style={cardStyle}
                >
                  <div style={CARD_TITLE}>{spec.label}</div>
                  <div style={CARD_PROSE}>{spec.poet}</div>
                  {/* Law 25 — disabled-with-reason: the card dims and says why,
                      in place. This replaces a `title={reason}` hover tooltip,
                      the pattern Law 17 retired; the text was always here. */}
                  <div style={CARD_COST}>{enabled ? spec.costSentence(claimCost) : reason}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}
    />
  );
}
