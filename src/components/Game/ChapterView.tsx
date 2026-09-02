/**
 * ChapterView (THR-603) — the full reading surface for one encounter chapter.
 *
 * Renders a `ChapterRecord` (resolved, from the archive) or a live active chapter
 * (built on demand from a `UnifiedAction` via `buildChapterRecord`) identically:
 * opening prose, each step as the player read it, the player's own interventions,
 * complications, and aftermath. Prose-first — outcomes are named in the narrative
 * lexicon, never as raw numbers.
 */

import type { ChapterRecord } from '../../types/chapterRecord';
import type { StepOutcome, UnifiedActionOutcome } from '../../types/unifiedAction';
import { outcomePhrase } from '../../engine/aftermathWords';
import { EntityLink } from '../shared/EntityLink';

interface ChapterViewProps {
  chapter: ChapterRecord;
  /** Open the profile for a named participant/actor/place. Omit → names render as plain text. */
  onOpenEntity?: (id: string) => void;
  /** Back to the ledger list (shown when provided). */
  onBack?: () => void;
}

/** Narrative lexicon for a step outcome — never a raw number (prose-first UI). */
const STEP_OUTCOME_LABEL: Record<StepOutcome, string> = {
  critical_success: 'a triumph',
  success: 'it held',
  success_at_cost: 'won, at a price',
  near_miss: 'a hair away',
  failure: 'it faltered',
  critical_failure: 'it broke',
};

const OUTCOME_TONE: Record<StepOutcome, string> = {
  critical_success: 'var(--accent-gold, #d4af37)',
  success: 'var(--sphere-life, #6a9a5a)',
  success_at_cost: 'var(--accent-amber, #c8963c)',
  near_miss: 'var(--accent-amber, #c8963c)',
  failure: 'var(--text-secondary, #9a8f80)',
  critical_failure: 'var(--sphere-ruin, #a05050)',
};

/**
 * THR-571 U1: the chapter's FINAL outcome band, named in the lexicon (never the raw enum).
 * At-cost is the world's texture ("won, at a price"); the crit bands get the rare-tier
 * gold/red accent so a player's eye catches the outcomes a god notices.
 *
 * THR-1035 moved the words themselves to `engine/aftermathWords` so the Chapter
 * Ledger row can say the same thing this header does — it previously could not
 * reach them and rendered the raw key. The tone map below stays here: colour is
 * this surface's business, vocabulary is not.
 */

const FINAL_OUTCOME_TONE: Record<UnifiedActionOutcome, string> = {
  critical_success: 'var(--accent-gold, #d4af37)',
  success: 'var(--sphere-life, #6a9a5a)',
  success_at_cost: 'var(--accent-amber, #c8963c)',
  contested_won: 'var(--sphere-life, #6a9a5a)',
  contested_lost: 'var(--text-secondary, #9a8f80)',
  failure: 'var(--text-secondary, #9a8f80)',
  critical_failure: 'var(--sphere-ruin, #a05050)',
};

/** The two rare-tier bands a god notices — get a heavier accent weight in the header. */
const RARE_OUTCOMES: ReadonlySet<UnifiedActionOutcome> = new Set(['critical_success', 'critical_failure']);

function Prose({ text }: { text: string }) {
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return null;
  return (
    <>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            margin: '0 0 var(--space-2, 8px) 0',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
          }}
        >
          {p}
        </p>
      ))}
    </>
  );
}

export function ChapterView({ chapter, onOpenEntity, onBack }: ChapterViewProps) {
  const finalOutcome = chapter.resolved ? chapter.outcome : undefined;
  const outcomeBand = finalOutcome
    ? {
        // THR-1035 — this read `FINAL_OUTCOME_LABEL[...] ?? finalOutcome`, whose
        // fallback was the raw key. `outcomePhrase` humanises and warns once
        // instead (Law 14's fallback clause), and returns null only for an
        // absent outcome — which this branch has already excluded.
        label: outcomePhrase(finalOutcome) ?? '',
        tone: FINAL_OUTCOME_TONE[finalOutcome] ?? 'var(--text-secondary, #9a8f80)',
        rare: RARE_OUTCOMES.has(finalOutcome),
      }
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3, 12px)' }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
          }}
        >
          ← All chapters
        </button>
      )}

      {/* Header */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
          }}
        >
          {chapter.templateName}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          <EntityLink id={chapter.actorId} name={chapter.actorName} onOpenEntity={onOpenEntity} />
          {' · at '}
          <EntityLink id={chapter.targetId} name={chapter.targetName} onOpenEntity={onOpenEntity} />
          {' · '}
          {outcomeBand ? (
            <span
              style={{
                color: outcomeBand.tone,
                fontWeight: outcomeBand.rare ? 600 : 'inherit',
                letterSpacing: outcomeBand.rare ? '0.02em' : undefined,
              }}
            >
              {outcomeBand.rare && '✦ '}{outcomeBand.label}
            </span>
          ) : (
            'unfolding'
          )}
          {chapter.threaded && ' · ✦ threaded'}
        </div>
      </div>

      {/* Opening */}
      {chapter.openingProse && (
        <section>
          <Prose text={chapter.openingProse} />
        </section>
      )}

      {/* Steps */}
      {chapter.steps.map(step => {
        const isCurrent = step.outcome === undefined && !chapter.resolved;
        return (
          <section
            key={step.index}
            style={{
              borderLeft: `2px solid ${
                step.outcome ? OUTCOME_TONE[step.outcome] : 'var(--border-subtle, #40382c)'
              }`,
              paddingLeft: 'var(--space-3, 12px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--space-2, 8px)',
                marginBottom: 'var(--space-1, 4px)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary, #6a6255)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {step.label}
              </span>
              {step.outcome && (
                <span style={{ fontSize: 'var(--text-xs)', color: OUTCOME_TONE[step.outcome] }}>
                  {STEP_OUTCOME_LABEL[step.outcome]}
                </span>
              )}
              {isCurrent && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-amber, #c8963c)' }}>
                  unfolding…
                </span>
              )}
            </div>

            <Prose text={step.narrativeProse} />

            {step.choiceText && (
              <p
                style={{
                  margin: 'var(--space-1, 4px) 0',
                  color: 'var(--accent-gold, #d4af37)',
                  fontStyle: 'italic',
                }}
              >
                You whispered: {step.choiceText}
              </p>
            )}

            {step.afterimageProse && (
              <div style={{ marginTop: 'var(--space-1, 4px)', color: 'var(--text-secondary)' }}>
                <Prose text={step.afterimageProse} />
              </div>
            )}

            {step.complicationProse && (
              <p
                style={{
                  margin: 'var(--space-1, 4px) 0 0 0',
                  color: 'var(--sphere-ruin, #a05050)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {step.complicationProse}
              </p>
            )}
          </section>
        );
      })}

      {/* Aftermath */}
      {(chapter.aftermathProse || (chapter.aftermathSummary?.changes?.length ?? 0) > 0) && (
        <section
          style={{
            borderTop: '1px solid var(--border-subtle, #40382c)',
            paddingTop: 'var(--space-2, 8px)',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary, #6a6255)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1, 4px)' }}>
            Aftermath
          </div>
          {chapter.aftermathProse && <Prose text={chapter.aftermathProse} />}
          {chapter.aftermathSummary?.changes?.map(change => (
            <div
              key={change.id}
              style={{
                fontSize: 'var(--text-sm)',
                color:
                  change.polarity === 'gain'
                    ? 'var(--sphere-life, #6a9a5a)'
                    : change.polarity === 'loss'
                    ? 'var(--sphere-ruin, #a05050)'
                    : 'var(--text-secondary)',
              }}
            >
              {change.title}
              {change.detail ? ` — ${change.detail}` : ''}
            </div>
          ))}
        </section>
      )}

      {/* Participants */}
      {chapter.participants.length > 0 && (
        <section
          style={{
            borderTop: '1px solid var(--border-subtle, #40382c)',
            paddingTop: 'var(--space-2, 8px)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2, 8px)',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary, #6a6255)' }}>Cast:</span>
          {chapter.participants.map(p => (
            <EntityLink key={p.id} id={p.id} name={p.name} onOpenEntity={onOpenEntity} />
          ))}
        </section>
      )}
    </div>
  );
}
