/**
 * JourneyVignetteModal — the journey moment: The First's journey beats, on the Stage.
 *
 * Displays the beat's setup prose, tension prose, and player choices.
 * Special treatment for the Ordeal (higher stakes UI).
 *
 * THR-1854: a choice is answered before the moment closes — its `consequenceProse`
 * replaces the choices with a Continue button, and the choice is committed on
 * Continue (or on any close once answered). Focus opens on the scene, not on the
 * first choice, so no answer reads as pre-selected.
 *
 * THR-1897 (plan THR-1877 § D4, S4): a journey moment plays on the Stage, in the compact
 * layout, lit at The First's place — the title, then the Stage's context line
 * ("Maren Ashfold at Millbrook"), then the same words as before. Its `Modal` is gone.
 */

import { memo, useState, useCallback } from 'react';
import { Button } from '../shared/Button';
import { Stage } from './stage/Stage';
import { StageContextLine } from './StoryBeatModal';
import { StageLabelIcon } from './stage/StageLabelIcon';
import { StageSubjectPortrait } from './stage/StageSubjectPortrait';
import { fallbackStageView, type StageVM } from '../../engine/views/stage/stageView';
import type { JourneyVignetteData, BeatChoice, OrdealOutcome } from '../../types/journeyEngine';
import type { ForecastTier } from '../../types/traces/encounter-traces';
import { formatPhaseName, ordealConsequence } from '../../engine/journeyEngine';
import { formatEssence } from '../shared/formatEssence';
import { JOURNEY_STAGE_LABELS, JOURNEY_CONTINUE_LABEL, JOURNEY_CHOICE_UNAFFORDABLE, ORDEAL_COMMIT_LABEL, ORDEAL_PICK_PROMPT } from '../../data/ui-content';
import { VISION_PRICE_LINE } from '../../data/vision-scene-content';
import { FORECAST_TIER_WORDS } from '../../data/nudge-stage-content';
import { sphereWord } from '../../data/essence-format';

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
  /** THR-2226 — the pool that pays, named on each price line ("Costs 2 Mind"). */
  payingSphere?: string;
  /**
   * THR-2226 — on an Ordeal the click commits at once: the host pays, rolls and records,
   * and returns the rolled outcome (null when nothing was committed). The result line
   * renders from it; Continue then only closes. Absent ⇒ the two-stage flow.
   */
  onOrdealCommit?: (choiceId: string) => OrdealOutcome | null;
  /** THR-1897 — the Stage view model (lit hex, place tag, context line); absent ⇒ nothing lit. */
  stageVM?: StageVM | null;
  /** The game tick, for the Stage's traces. */
  tick?: number;
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
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 'var(--text-xs)',
        color: 'var(--accent-gold)',
      }}>
        {phase}
      </span>
    </div>
  );
}

// ─── Choice Button ──────────────────────────────────────────────────

/** THR-2226 — "Costs 2 Mind": the price and the pool that pays it. */
export function visionPriceLine(essenceCost: number, payingSphere: string | undefined): string {
  return VISION_PRICE_LINE
    .replace('{n}', formatEssence(essenceCost))
    .replace('{sphere}', payingSphere ? sphereWord(payingSphere) : 'essence');
}

function ChoiceButton({
  choice,
  onSelect,
  disabled,
  unaffordable,
  payingSphere,
  forecast,
  armed,
}: {
  choice: BeatChoice;
  onSelect: (id: string) => void;
  disabled: boolean;
  unaffordable: boolean;
  payingSphere?: string;
  /** THR-2226 — on an Ordeal, the forecast this choice leaves (shown before the spend). */
  forecast?: ForecastTier;
  /** THR-2226 — on an Ordeal, this lean is picked and waits for the commit (Law 48). */
  armed?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const essenceCost = choice.effects.essenceCost ?? 0;
  // THR-2226 — an Ordeal choice no longer names an outcome, so no polarity colour.
  const borderColor = 'var(--accent-gold)';
  const showMeta = essenceCost > 0 || forecast !== undefined;

  return (
    <button
      onClick={() => onSelect(choice.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      aria-pressed={armed === undefined ? undefined : armed}
      data-armed={armed ? '' : undefined}
      style={{
        display: 'block',
        width: '100%',
        padding: 'var(--space-3)',
        marginBottom: 'var(--space-2)',
        background: hovered || armed ? 'rgb(var(--veil-gold-rgb) / 0.08)' : 'var(--dlg-inset, var(--bg-surface))',
        border: `${armed ? 2 : 1}px solid ${hovered || armed ? borderColor : 'rgb(var(--veil-gold-rgb) / 0.2)'}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
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
      {showMeta && (
        <div data-testid="journey-choice-meta" style={{
          color: 'var(--text-muted)',
          fontSize: 'var(--text-xs)',
          marginTop: '4px',
        }}>
          {essenceCost > 0 && (
            <span data-testid="journey-choice-price">
              {visionPriceLine(essenceCost, payingSphere)}{unaffordable ? ` · ${JOURNEY_CHOICE_UNAFFORDABLE}` : ''}
            </span>
          )}
          {essenceCost > 0 && forecast && ' · '}
          {forecast && (
            <span
              data-testid="journey-choice-forecast"
              data-forecast-tier={forecast}
              style={{ color: `rgb(var(--forecast-${forecast}-rgb))`, fontWeight: 700 }}
            >
              {FORECAST_TIER_WORDS[forecast]}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── The moment ──────────────────────────────────────────────────────

export const JourneyVignetteModal = memo(function JourneyVignetteModal({
  open,
  onClose,
  onChoice,
  vignette,
  essenceAvailable,
  payingSphere,
  onOrdealCommit,
  stageVM,
  tick = 0,
}: JourneyVignetteModalProps) {
  // The answered choice, while its consequence line is showing (THR-1854).
  const [answered, setAnswered] = useState<BeatChoice | null>(null);
  // THR-2226 — the Ordeal's rolled outcome, once the click has committed it.
  const [rolledOutcome, setRolledOutcome] = useState<OrdealOutcome | null>(null);
  // THR-2226 — the Ordeal's picked lean, armed and waiting for the commit (Law 48).
  const [armedId, setArmedId] = useState<string | null>(null);
  const ordealCommits = vignette.isOrdeal && onOrdealCommit !== undefined;

  const handleChoice = useCallback((choiceId: string) => {
    if (answered) return; // Prevent double-click
    const choice = vignette.choices.find(c => c.id === choiceId);
    if (!choice) return;
    // THR-2226 — on the Ordeal a click only picks the lean (Law 48: armed, then fired).
    // The commit button pays and rolls; there is no result until the roll.
    if (ordealCommits) {
      setArmedId(choiceId);
      return;
    }
    // Fail-soft: a choice with no reply line commits at once, as before.
    if (!choice.effects.consequenceProse) {
      onChoice(choiceId);
      return;
    }
    setAnswered(choice);
  }, [answered, onChoice, ordealCommits, vignette.choices]);

  // THR-2226 — the second beat: pay the armed lean's price and roll the Ordeal.
  const handleOrdealFire = useCallback(() => {
    if (answered || !armedId || !onOrdealCommit) return;
    const choice = vignette.choices.find(c => c.id === armedId);
    if (!choice) return;
    const outcome = onOrdealCommit(armedId);
    if (outcome === null) return; // nothing committed (the pool could not pay)
    setRolledOutcome(outcome);
    setAnswered(choice);
  }, [answered, armedId, onOrdealCommit, vignette.choices]);
  const answeredLine = answered
    ? (vignette.isOrdeal ? ordealConsequence(answered, rolledOutcome ?? undefined) : answered.effects.consequenceProse)
    : null;

  const handleContinue = useCallback(() => {
    if (answered) onChoice(answered.id);
  }, [answered, onChoice]);

  // THR-2226 — an unrolled Ordeal is answered, never dismissed: Escape only takes back
  // the armed lean. Closing it through `onClose` would roll the climax as a bare
  // step-back and drop the vision before its result could show (Laws 47/48).
  const handleOrdealEscape = useCallback(() => setArmedId(null), []);

  // Once answered, any close commits the answer — the god has already spoken.
  const handleClose = answered ? handleContinue : (ordealCommits ? handleOrdealEscape : onClose);

  const phaseName = formatPhaseName(vignette.phase);

  if (!open) return null;
  const vm = stageVM ?? fallbackStageView({ kind: 'journey-vignette', subjectAgentId: vignette.agentId, hasArt: false, hasCast: false });
  const title = vignette.isOrdeal ? 'The Ordeal' : `${vignette.agentName}'s Journey`;

  return (
    <Stage
      kind="journey-vignette"
      vm={vm}
      label={title}
      onEscape={handleClose}
      tick={tick}
      right={(
    <div data-journey-vignette-stage="" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: 'var(--panel-padding, 20px)' }}>
      <header style={{ paddingBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
        {/* THR-2100 (R1) — the mortal's face at the left of the title block. */}
        <StageSubjectPortrait visual={vm.subjectVisual} subject={vm.subject} />
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: vignette.isOrdeal ? 'var(--accent-gold)' : 'var(--text-primary)',
          }}>
            <StageLabelIcon label="journeyTitle" />
            {title}
          </div>
          <StageContextLine line={vm.contextLine} />
        </div>
      </header>

      <div data-journey-vignette-body="" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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

        {/* THR-2226 — the Ordeal's weight and stakes, before the spend (Law 17). The old
            banner ("Your choice determines their fate.") went: the roll decides now. */}
        {vignette.isOrdeal && vignette.ordealLines && (
          <div data-testid="ordeal-lines" style={{
            background: 'rgb(var(--veil-gold-rgb) / 0.06)',
            border: '1px solid rgb(var(--veil-gold-rgb) / 0.2)',
            borderRadius: '6px',
            padding: 'var(--space-2) var(--space-3)',
            marginBottom: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold)',
            textAlign: 'center',
          }}>
            <div data-testid="ordeal-weight">{vignette.ordealLines.weight}</div>
            <div data-testid="ordeal-stakes" style={{ color: 'var(--text-secondary)' }}>{vignette.ordealLines.stakes}</div>
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
              {answeredLine}
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
                  disabled={unaffordable}
                  unaffordable={unaffordable}
                  payingSphere={payingSphere}
                  forecast={vignette.isOrdeal ? vignette.forecastByChoice?.[choice.id] : undefined}
                  armed={ordealCommits ? armedId === choice.id : undefined}
                />
              );
            })}
            {ordealCommits && (
              <Button
                variant="primary"
                size="md"
                fullWidth
                data-testid="ordeal-commit"
                disabled={armedId === null}
                onClick={handleOrdealFire}
              >
                {armedId === null ? ORDEAL_PICK_PROMPT : ORDEAL_COMMIT_LABEL}
              </Button>
            )}
          </div>
        )}
      </div>

      <footer style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
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
      </footer>
    </div>
      )}
    />
  );
});
