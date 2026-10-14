/**
 * JourneyVignetteModal — auto-interrupt modal for The First's journey beats.
 *
 * Displays the beat's setup prose, tension prose, and player choices.
 * Special treatment for the Ordeal (higher stakes UI).
 *
 * THR-1854: a choice is answered before the moment closes — its `consequenceProse`
 * replaces the choices with a Continue button, and the choice is committed on
 * Continue (or on any close once answered). Focus opens on the scene, not on the
 * first choice, so no answer reads as pre-selected.
 */

import { memo, useState, useCallback } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import type { JourneyVignetteData, BeatChoice } from '../../types/journeyEngine';
import { formatPhaseName } from '../../engine/journeyEngine';
import { formatEssence } from '../shared/formatEssence';
import { JOURNEY_STAGE_LABELS, JOURNEY_CONTINUE_LABEL, JOURNEY_CHOICE_UNAFFORDABLE } from '../../data/ui-content';

// ─── Props ──────────────────────────────────────────────────────────

interface JourneyVignetteModalProps {
  open: boolean;
  onClose: () => void;
  onChoice: (choiceId: string) => void;
  vignette: JourneyVignetteData;
  /**
   * Essence in the pool that pays for a journey choice (the god's primary sphere).
   * A choice costing more renders disabled. Omitted = unknown, nothing disabled.
   */
  essenceAvailable?: number;
}

// ─── Phase Badge ────────────────────────────────────────────────────

// THR-1424 (Law 15 ruling, 2026-09-10): the badge carried `${n}% doom` beside the phase.
// A unitless proportion is dropped, not translated — and where the surface has no existing
// non-numeric rendering of that quantity (this one has none: the badge names the journey
// phase, not the doom), the number goes rather than becoming a word ladder. The doom clock's
// own surfaces — `DoomBar` and `DoomClockDetail` — are where that proportion is read.
function PhaseBadge({ phase }: { phase: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginBottom: 'var(--space-3)',
      justifyContent: 'center',
    }}>
      <span style={{
        background: 'var(--dlg-inset, var(--bg-surface))',
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
    </div>
  );
}

// ─── Choice Button ──────────────────────────────────────────────────

function ChoiceButton({
  choice,
  onSelect,
  isOrdeal,
  disabled,
  unaffordable,
}: {
  choice: BeatChoice;
  onSelect: (id: string) => void;
  isOrdeal: boolean;
  disabled: boolean;
  unaffordable: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const essenceCost = choice.effects.essenceCost ?? 0;
  const borderColor = isOrdeal
    // THR-1586: the polarity tokens, not a second gold (Law 30) — triumph and broken stay
    // distinct from the scraped-through default.
    ? (choice.effects.ordealOutcome === 'triumph' ? 'var(--positive)' : choice.effects.ordealOutcome === 'broken' ? 'var(--negative)' : 'var(--accent-gold)')
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
        background: hovered ? 'rgb(var(--veil-gold-rgb) / 0.08)' : 'var(--dlg-inset, var(--bg-surface))',
        border: `1px solid ${hovered ? borderColor : 'rgb(var(--veil-gold-rgb) / 0.2)'}`,
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
          Cost: {formatEssence(essenceCost)} essence{unaffordable ? ` · ${JOURNEY_CHOICE_UNAFFORDABLE}` : ''}
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
  essenceAvailable,
}: JourneyVignetteModalProps) {
  // The answered choice, while its consequence line is showing (THR-1854).
  const [answered, setAnswered] = useState<BeatChoice | null>(null);

  const handleChoice = useCallback((choiceId: string) => {
    if (answered) return; // Prevent double-click
    const choice = vignette.choices.find(c => c.id === choiceId);
    if (!choice) return;
    // Fail-soft: a choice with no reply line commits at once, as before.
    if (!choice.effects.consequenceProse) {
      onChoice(choiceId);
      return;
    }
    setAnswered(choice);
  }, [answered, onChoice, vignette.choices]);

  const handleContinue = useCallback(() => {
    if (answered) onChoice(answered.id);
  }, [answered, onChoice]);

  // Once answered, any close commits the answer — the god has already spoken.
  const handleClose = answered ? handleContinue : onClose;

  const phaseName = formatPhaseName(vignette.phase);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      context="story"
    >
      <Modal.Header>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            color: vignette.isOrdeal ? 'var(--accent-gold)' : 'var(--text-primary)',
            letterSpacing: '0.05em',
          }}>
            {vignette.isOrdeal ? 'THE ORDEAL' : `${vignette.agentName}'s Journey`}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <PhaseBadge phase={phaseName} />

        {/* Setup prose — the scene takes focus on open, not the first choice (THR-1854) */}
        <div tabIndex={0} aria-label="The scene" style={{
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
          borderLeft: '2px solid var(--accent-gold)',
        }}>
          {vignette.tensionProse}
        </div>

        {/* Ordeal warning */}
        {vignette.isOrdeal && (
          <div style={{
            background: 'rgb(var(--veil-gold-rgb) / 0.06)',
            border: '1px solid rgb(var(--veil-gold-rgb) / 0.2)',
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

        {/* Choices — or, once one is picked, its answer (THR-1854) */}
        {answered ? (
          <div data-testid="journey-consequence" style={{ marginTop: 'var(--space-2)' }}>
            <div style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-1)',
            }}>
              {answered.text}
            </div>
            <div style={{
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.7,
              fontStyle: 'italic',
              paddingLeft: 'var(--space-3)',
              borderLeft: '2px solid var(--accent-gold)',
              marginBottom: 'var(--space-3)',
            }}>
              {answered.effects.consequenceProse}
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              autoFocus
              data-testid="journey-continue"
              onClick={handleContinue}
            >
              {JOURNEY_CONTINUE_LABEL}
            </Button>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--space-2)' }}>
            {vignette.choices.map(choice => {
              const unaffordable = essenceAvailable !== undefined
                && (choice.effects.essenceCost ?? 0) > essenceAvailable;
              return (
                <ChoiceButton
                  key={choice.id}
                  choice={choice}
                  onSelect={handleChoice}
                  isOrdeal={vignette.isOrdeal}
                  disabled={unaffordable}
                  unaffordable={unaffordable}
                />
              );
            })}
          </div>
        )}
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
          <span data-testid="journey-stage">{JOURNEY_STAGE_LABELS[vignette.phase] ?? phaseName}</span>
          <span>{vignette.agentName}</span>
        </div>
      </Modal.Footer>
    </Modal>
  );
});
