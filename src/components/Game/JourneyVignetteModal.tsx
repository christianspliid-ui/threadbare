/**
 * JourneyVignetteModal — auto-interrupt modal for The First's journey beats.
 *
 * Displays the beat's setup prose, tension prose, and player choices.
 * Special treatment for the Ordeal (higher stakes UI).
 */

import { memo, useState, useCallback } from 'react';
import { Modal } from '../shared/Modal';
import type { JourneyVignetteData, BeatChoice } from '../../types/journeyEngine';
import { formatPhaseName } from '../../engine/journeyEngine';

// ─── Props ──────────────────────────────────────────────────────────

interface JourneyVignetteModalProps {
  open: boolean;
  onClose: () => void;
  onChoice: (choiceId: string) => void;
  vignette: JourneyVignetteData;
}

// ─── Phase Badge ────────────────────────────────────────────────────

function PhaseBadge({ phase, doomPercent }: { phase: string; doomPercent: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginBottom: 'var(--space-3)',
      justifyContent: 'center',
    }}>
      <span style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--accent-gold)',
        borderRadius: '4px',
        padding: '2px 10px',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xs)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--accent-gold)',
      }}>
        {phase}
      </span>
      <span style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
      }}>
        {Math.round(doomPercent * 100)}% doom
      </span>
    </div>
  );
}

// ─── Choice Button ──────────────────────────────────────────────────

function ChoiceButton({
  choice,
  onSelect,
  isOrdeal,
  disabled,
}: {
  choice: BeatChoice;
  onSelect: (id: string) => void;
  isOrdeal: boolean;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const essenceCost = choice.effects.essenceCost ?? 0;
  const borderColor = isOrdeal
    ? (choice.effects.ordealOutcome === 'triumph' ? '#ffd700' : choice.effects.ordealOutcome === 'broken' ? '#a44' : 'var(--accent-gold)')
    : 'var(--accent-gold)';

  return (
    <button
      onClick={() => onSelect(choice.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        padding: 'var(--space-3)',
        marginBottom: 'var(--space-2)',
        background: hovered ? 'rgba(255, 215, 0, 0.08)' : 'var(--bg-surface)',
        border: `1px solid ${hovered ? borderColor : 'rgba(255, 215, 0, 0.2)'}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xs)',
        marginBottom: choice.godVoice ? '4px' : 0,
      }}>
        {choice.text}
      </div>
      {choice.godVoice && (
        <div style={{
          color: 'var(--accent-gold)',
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          opacity: 0.9,
        }}>
          "{choice.godVoice}"
        </div>
      )}
      {essenceCost > 0 && (
        <div style={{
          color: 'var(--text-muted)',
          fontSize: 'var(--text-xs)',
          marginTop: '4px',
        }}>
          Cost: {essenceCost} essence
        </div>
      )}
    </button>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────

export const JourneyVignetteModal = memo(function JourneyVignetteModal({
  open,
  onClose,
  onChoice,
  vignette,
}: JourneyVignetteModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const handleChoice = useCallback((choiceId: string) => {
    if (selectedChoice) return; // Prevent double-click
    setSelectedChoice(choiceId);
    // Small delay for visual feedback
    setTimeout(() => {
      onChoice(choiceId);
      setSelectedChoice(null);
    }, 300);
  }, [onChoice, selectedChoice]);

  const phaseName = formatPhaseName(vignette.phase);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
    >
      <Modal.Header>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            color: vignette.isOrdeal ? '#ffd700' : 'var(--text-primary)',
            letterSpacing: '0.05em',
          }}>
            {vignette.isOrdeal ? 'THE ORDEAL' : `${vignette.agentName}'s Journey`}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <PhaseBadge phase={phaseName} doomPercent={vignette.doomClockPercent} />

        {/* Setup prose */}
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-xs)',
          lineHeight: 1.7,
          marginBottom: 'var(--space-4)',
          fontStyle: 'italic',
        }}>
          {vignette.setupProse}
        </div>

        {/* Tension prose */}
        <div style={{
          color: 'var(--text-primary)',
          fontSize: 'var(--text-xs)',
          lineHeight: 1.7,
          marginBottom: 'var(--space-4)',
          paddingLeft: 'var(--space-3)',
          borderLeft: `2px solid ${vignette.isOrdeal ? '#ffd700' : 'var(--accent-gold)'}`,
        }}>
          {vignette.tensionProse}
        </div>

        {/* Ordeal warning */}
        {vignette.isOrdeal && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.06)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '6px',
            padding: 'var(--space-2) var(--space-3)',
            marginBottom: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold)',
            textAlign: 'center',
          }}>
            This is the peak moment of {vignette.agentName}'s journey. Your choice determines their fate.
          </div>
        )}

        {/* Choices */}
        <div style={{ marginTop: 'var(--space-2)' }}>
          {vignette.choices.map(choice => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              onSelect={handleChoice}
              isOrdeal={vignette.isOrdeal}
              disabled={selectedChoice !== null}
            />
          ))}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}>
          <span>Beat {vignette.beatIndex + 1} — {phaseName}</span>
          <span>{vignette.agentName}</span>
        </div>
      </Modal.Footer>
    </Modal>
  );
});
