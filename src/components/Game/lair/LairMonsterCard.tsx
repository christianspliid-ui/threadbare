/**
 * The lair's monster card in the hex sidebar (plan doc
 * `Docs/plans/2026-09-23-fight-on-screen.md` § UI pillar 3; F1 THR-1550, F4 THR-1552).
 *
 * One block, drawn in the lair block and in the Cleared Lair Section:
 *   - the monster's art at `chip` size (Law 5) and its name, a link (Law 21);
 *   - one card sentence, each concept clause carrying its tooltip (Law 16/17),
 *     with the temper clause only once the temper has shown;
 *   - the clock as **square** magnitude pips at `FIGHT_CLOCK_PIP_SIZE` plus its
 *     word (Law 10/11/13, never a digit). The same row the opponent header draws;
 *   - a slain monster reads "slain", or "slain by {name}" when its sheet names
 *     the killer, and the killer's name is a link too.
 */

import { EntityVisual } from '../../shared/EntityVisual';
import { StepDots } from '../../shared/StepDots';
import { Tooltip } from '../../shared/Tooltip';
import { FIGHT_CLOCK_PIP_SIZE, FIGHT_TOOLTIP_IDS } from '../../../data/fight-screen-content';
import type { LairMonsterRow } from './buildLairMonsterCardModel';

/** Concept words take a dotted underline: they explain themselves on hover. */
const CONCEPT_WORD_STYLE = {
  textDecoration: 'underline dotted',
  textUnderlineOffset: 3,
  cursor: 'help',
} as const;

const LINK_STYLE = {
  background: 'transparent',
  border: 'none',
  color: 'var(--accent-gold)',
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-xs)',
  textAlign: 'left',
  padding: '2px 0',
  minHeight: '24px',
} as const;

export interface LairMonsterCardProps {
  readonly monster: LairMonsterRow;
  /** Opens a sheet (the monster's, or its killer's). Absent → the names are plain. */
  readonly onSelect?: (nodeId: string) => void;
}

export function LairMonsterCard({ monster, onSelect }: LairMonsterCardProps) {
  return (
    <div
      data-testid="lair-monster-card"
      data-deceased={monster.deceased ? 'true' : 'false'}
      style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
    >
      <div
        data-testid="lair-monster-row"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <EntityVisual
          size="chip"
          entity={{ id: monster.id, kind: 'monster', name: monster.name }}
          onClick={onSelect ? () => onSelect(monster.id) : undefined}
        />
        <Tooltip id="ui.lair_monster">
          <button
            type="button"
            className="focus-ring"
            data-testid="lair-monster-link"
            style={{ ...LINK_STYLE, cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect?.(monster.id)}
          >
            {monster.name}
          </button>
        </Tooltip>
      </div>
      <div
        data-testid="lair-monster-sentence"
        style={{
          fontFamily: 'var(--font-prose)',
          fontStyle: 'italic',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        }}
      >
        {monster.sentence.map((segment, i) =>
          segment.tooltipId ? (
            <Tooltip key={i} id={segment.tooltipId}>
              <span style={CONCEPT_WORD_STYLE}>{segment.text}</span>
            </Tooltip>
          ) : (
            <span key={i}>{segment.text}</span>
          ),
        )}
      </div>
      <div
        data-testid="lair-monster-clock"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
      >
        <Tooltip id={FIGHT_TOOLTIP_IDS.clock.tooltipId}>
          <span data-testid="lair-monster-pips" style={{ display: 'inline-flex' }}>
            <StepDots
              variant="magnitude"
              shape="square"
              totalSteps={monster.clock.size}
              currentStepIndex={monster.clock.filled}
              size={FIGHT_CLOCK_PIP_SIZE}
              ariaLabel={monster.clock.ariaLabel}
            />
          </span>
        </Tooltip>
        <span
          data-testid="lair-monster-clock-word"
          style={{
            fontFamily: 'var(--font-prose)',
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
          }}
        >
          <Tooltip id={monster.clock.wordTooltipId}>
            <span style={CONCEPT_WORD_STYLE}>{monster.clock.word}</span>
          </Tooltip>
          {monster.slainBy && (
            <>
              {' by '}
              {monster.slainById && onSelect ? (
                <button
                  type="button"
                  className="focus-ring"
                  data-testid="lair-monster-killer"
                  style={{ ...LINK_STYLE, fontFamily: 'var(--font-prose)', minHeight: 0, padding: 0, cursor: 'pointer' }}
                  onClick={() => onSelect(monster.slainById!)}
                >
                  {monster.slainBy}
                </button>
              ) : (
                <span data-testid="lair-monster-killer">{monster.slainBy}</span>
              )}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
