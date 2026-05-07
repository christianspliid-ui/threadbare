import React from 'react';
import {
  HAND_VISIBLE_CARDS_DEFAULT,
} from '../../../data/encounter-experience-constants';
import type {
  HandFilterDimmedEntry,
  HandFilterHiddenEntry,
  HandFilterPlayableEntry,
} from '../../../engine/encounters/handFilter';

export interface AscendantHandPartitionView {
  playable: readonly HandFilterPlayableEntry[];
  dimmed: readonly HandFilterDimmedEntry[];
  hidden: readonly HandFilterHiddenEntry[];
  rarePulses: readonly string[];
}

export interface AscendantHandProps {
  hand: AscendantHandPartitionView;
  onCommitTemplate?: (templateId: string) => void;
  newlyAvailableCount?: number;
}

interface HandCardView {
  templateId: string;
  title: string;
  detail: string;
  costLabel: string;
  state: 'playable' | 'dimmed' | 'hidden';
  prereqMessage?: string;
  rarePulse: boolean;
}

const HIDDEN_STATE_LABEL = 'scene-mismatch';

function buildCardViews(hand: AscendantHandPartitionView): HandCardView[] {
  const rarePulseSet = new Set(hand.rarePulses);

  const playable = hand.playable.map((entry) => ({
    templateId: entry.template.id,
    title: entry.template.name,
    detail: entry.template.description ?? entry.template.narrativeTemplates.initiation,
    costLabel: `${entry.template.essenceCost ?? 0} ESS`,
    state: 'playable' as const,
    rarePulse: rarePulseSet.has(entry.template.id),
  }));

  const dimmed = hand.dimmed.map((entry) => ({
    templateId: entry.template.id,
    title: entry.template.name,
    detail: entry.template.description ?? entry.template.narrativeTemplates.initiation,
    costLabel: `${entry.template.essenceCost ?? 0} ESS`,
    state: 'dimmed' as const,
    prereqMessage: entry.prereq.message,
    rarePulse: rarePulseSet.has(entry.template.id),
  }));

  const hidden = hand.hidden.map((entry) => ({
    templateId: entry.template.id,
    title: entry.template.name,
    detail: HIDDEN_STATE_LABEL,
    costLabel: `${entry.template.essenceCost ?? 0} ESS`,
    state: 'hidden' as const,
    prereqMessage: HIDDEN_STATE_LABEL,
    rarePulse: false,
  }));

  return [...playable, ...dimmed, ...hidden];
}

/**
 * AscendantHand — scene-filtered right-rail card hand for encounter C3.
 * Uses B3 partition output and defaults to three visible cards plus disclosure.
 */
export function AscendantHand({
  hand,
  onCommitTemplate,
  newlyAvailableCount = 0,
}: AscendantHandProps) {
  const [expanded, setExpanded] = React.useState(false);
  const cards = React.useMemo(() => buildCardViews(hand), [hand]);
  const visibleCount = expanded ? cards.length : Math.min(cards.length, HAND_VISIBLE_CARDS_DEFAULT);
  const visibleCards = cards.slice(0, visibleCount);
  const hiddenByDisclosure = Math.max(0, cards.length - visibleCount);

  return (
    <section
      data-testid="encounter-ascendant-hand"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        background: 'var(--bg-surface)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Your Hand
          {newlyAvailableCount > 0 ? (
            <span
              data-testid="encounter-ascendant-hand-new-badge"
              style={{
                fontSize: 9,
                letterSpacing: '0.08em',
                color: 'var(--accent-gold)',
                border: '1px solid var(--accent-gold-dim)',
                borderRadius: 999,
                padding: '1px 6px',
              }}
            >
              +{newlyAvailableCount} NEW
            </span>
          ) : null}
        </div>

        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {hand.playable.length} playable
        </div>
      </div>

      {visibleCards.map((card) => {
        const canCommit = card.state === 'playable';
        return (
          <button
            key={card.templateId}
            type="button"
            data-testid={`encounter-ascendant-card-${card.templateId}-${card.state}`}
            title={card.prereqMessage}
            onClick={() => {
              if (canCommit) onCommitTemplate?.(card.templateId);
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: `1px solid ${canCommit ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
              background: 'var(--bg-raised)',
              textAlign: 'left',
              cursor: canCommit ? 'pointer' : 'default',
              opacity: card.state === 'playable' ? 1 : card.state === 'dimmed' ? 0.55 : 0.25,
              animation: card.rarePulse ? 'breathe 1.8s ease-in-out infinite' : undefined,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {card.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {card.costLabel}
              </div>
            </div>

            <div
              style={{
                marginTop: 3,
                fontSize: 11,
                lineHeight: 1.35,
                color: 'var(--text-tertiary)',
              }}
            >
              {card.detail}
            </div>

            {card.state === 'dimmed' ? (
              <div
                data-testid={`encounter-ascendant-card-prereq-${card.templateId}`}
                style={{ marginTop: 4, fontSize: 10, fontStyle: 'italic', color: 'var(--text-muted)' }}
              >
                {card.prereqMessage}
              </div>
            ) : null}
          </button>
        );
      })}

      {hiddenByDisclosure > 0 ? (
        <button
          type="button"
          data-testid="encounter-ascendant-hand-disclosure"
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: 2,
            alignSelf: 'flex-start',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          + {hiddenByDisclosure} more
        </button>
      ) : null}
    </section>
  );
}

