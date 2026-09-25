/**
 * The opponent header (THR-1551, plan doc `Docs/plans/2026-09-23-fight-on-screen.md`
 * § UI pillar 1, slice F2).
 *
 * One block in the veil, rendered only on fight steps, directly under
 * `ContextStrip` and inside the same chrome (Law 37). It is **not** a second
 * header (THR-1478): `ContextStrip` carries the scene — place, mortal, step —
 * and this block carries a different subject, who the mortal is facing and how
 * close it is to falling. It repeats no `ContextStrip` field.
 *
 *   - the opponent's art at `chip` size (Law 5) and name, a link (Law 21);
 *   - one card sentence, each concept clause carrying its tooltip (Law 16/17);
 *   - the clock as **square** magnitude pips at `FIGHT_CLOCK_PIP_SIZE` plus its
 *     word — never a digit (Law 10/11/13); a duel shows both clocks.
 *
 * Law 33: the veil is a fixed-height column, so the family clause is the first
 * thing to go when room runs out (`compact`), then the art; the name, which
 * carries the link, always stays. (The family line is also the sheet's, so
 * nothing is lost that the link does not reach.)
 */

import { EntityVisual } from '../../shared/EntityVisual';
import { StepDots } from '../../shared/StepDots';
import { Tooltip } from '../../shared/Tooltip';
import {
  FIGHT_CLOCK_PIP_SIZE,
  FIGHT_TOOLTIP_IDS,
  OPPONENT_HEADER_ART_SIZE,
} from '../../../data/fight-screen-content';
import type {
  OpponentHeaderClockModel,
  OpponentHeaderModel,
} from './adapters/buildOpponentHeaderModel';

const FONT_PROSE = 'var(--font-prose)';
const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";
const TEXT_WARM = 'var(--veil-text-warm)';
const TEXT_WHISPER = 'var(--veil-text-whisper)';
const TEXT_GHOST = 'var(--veil-text-ghost)';

/** Concept words take a dotted underline: they explain themselves on hover. */
const CONCEPT_WORD_STYLE = {
  textDecoration: 'underline dotted',
  textUnderlineOffset: 3,
  cursor: 'help',
} as const;

export interface OpponentHeaderProps {
  readonly model: OpponentHeaderModel;
  /** Opens the opponent's sheet (the existing agent sheet). Absent → the name is plain. */
  readonly onSelectOpponent?: (opponentId: string) => void;
  /** Law 33 fallback: drop the family clause first (the sheet keeps it); `hideArt` drops the art next. */
  readonly compact?: boolean;
  readonly hideArt?: boolean;
}

function ClockRow({ clock, lead }: { clock: OpponentHeaderClockModel; lead?: string }) {
  return (
    <div
      data-testid="opponent-clock-row"
      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
    >
      {lead && (
        <span
          style={{
            fontFamily: FONT_PROSE,
            fontSize: 'var(--text-xs)',
            color: TEXT_WHISPER,
          }}
        >
          {lead}
        </span>
      )}
      <Tooltip id={FIGHT_TOOLTIP_IDS.clock.tooltipId}>
        <span data-testid="opponent-clock-pips" style={{ display: 'inline-flex' }}>
          <StepDots
            variant="magnitude"
            shape="square"
            totalSteps={clock.size}
            currentStepIndex={clock.filled}
            size={FIGHT_CLOCK_PIP_SIZE}
            ariaLabel={clock.ariaLabel}
          />
        </span>
      </Tooltip>
      <Tooltip id={clock.wordTooltipId}>
        <span
          data-testid="opponent-clock-word"
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: TEXT_WARM,
            ...CONCEPT_WORD_STYLE,
          }}
        >
          {clock.word}
        </span>
      </Tooltip>
    </div>
  );
}

export function OpponentHeader({ model, onSelectOpponent, compact, hideArt }: OpponentHeaderProps) {
  const canOpen = model.linkable && !!model.opponentId && !!onSelectOpponent;
  const segments = compact ? model.sentence.filter((s) => s.role !== 'family') : model.sentence;

  return (
    <div
      data-testid="opponent-header"
      data-fight-role={model.role}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '10px 12px',
        marginBottom: 16,
        borderLeft: '2px solid rgb(var(--veil-gold-rgb) / 0.35)',
        background: 'rgb(var(--veil-gold-rgb) / 0.04)',
      }}
    >
      {!hideArt && (
        <EntityVisual
          size={OPPONENT_HEADER_ART_SIZE}
          shape="circle"
          entity={{
            id: model.opponentId ?? `unknown-foe`,
            kind: model.visualKind,
            name: model.name,
          }}
          onClick={canOpen ? () => onSelectOpponent!(model.opponentId!) : undefined}
          style={{ width: 40, height: 40, flexShrink: 0 }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span
            data-testid="opponent-step-label"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEXT_GHOST,
            }}
          >
            {model.stepLabel}
          </span>
          {canOpen ? (
            <button
              type="button"
              className="focus-ring"
              data-testid="opponent-name"
              onClick={() => onSelectOpponent!(model.opponentId!)}
              aria-label={`View ${model.name}`}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: FONT_DISPLAY,
                fontSize: 'var(--text-sm)',
                letterSpacing: '0.04em',
                color: TEXT_WARM,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              {model.name}
            </button>
          ) : (
            <span
              data-testid="opponent-name"
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 'var(--text-sm)',
                letterSpacing: '0.04em',
                color: TEXT_WARM,
              }}
            >
              {model.name}
            </span>
          )}
        </div>
        <div
          data-testid="opponent-sentence"
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: TEXT_WHISPER,
            lineHeight: 1.5,
          }}
        >
          {segments.map((segment, i) =>
            segment.tooltipId ? (
              <Tooltip key={i} id={segment.tooltipId}>
                <span style={CONCEPT_WORD_STYLE}>{segment.text}</span>
              </Tooltip>
            ) : (
              <span key={i}>{segment.text}</span>
            ),
          )}
        </div>
        <ClockRow clock={model.clock} lead={model.fighterClock ? model.name : undefined} />
        {model.fighterClock && (
          <ClockRow clock={model.fighterClock} lead={model.fighterClock.name} />
        )}
      </div>
    </div>
  );
}
