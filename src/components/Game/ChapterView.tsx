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
import type { StepOutcome } from '../../types/unifiedAction';

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

function EntityLink({
  id,
  name,
  onOpenEntity,
}: {
  id: string;
  name: string;
  onOpenEntity?: (id: string) => void;
}) {
  if (!onOpenEntity) return <span style={{ color: 'var(--text-primary)' }}>{name}</span>;
  return (
    <button
      type="button"
      onClick={() => onOpenEntity(id)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        color: 'var(--accent-gold, #d4af37)',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        font: 'inherit',
      }}
      aria-label={`${name} — open profile`}
    >
      {name}
    </button>
  );
}

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
  const statusLine = chapter.resolved
    ? `resolved · ${chapter.outcome ?? 'unknown'}`
    : 'unfolding';

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
          {statusLine}
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
