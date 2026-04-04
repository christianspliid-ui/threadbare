import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Play, Square } from 'lucide-react';
import { useNarration } from '../../../services/narration/useNarration';
import { Modal } from '../../shared/Modal';
import { Tooltip } from '../../shared/Tooltip';
import type { EncounterStageModel } from './types';

interface EncounterStageProps {
  open: boolean;
  onDisregard: () => void;
  onCommitChoice: (choiceId: string) => void;
  onAcknowledgeAftermath?: () => void;
  onAftermathReaction?: (reactionId: string) => void;
  model: EncounterStageModel;
}

const TIER_LABEL: Record<EncounterStageModel['header']['threadTier'], string> = {
  strong: 'Strongly Threaded',
  light: 'Lightly Threaded',
  watched: 'Watched',
};

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text-tertiary)',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function NarrativeReference({
  label,
  desc,
  tone = 'default',
  children,
}: {
  label: string;
  desc: string;
  tone?: 'default' | 'accent' | 'warning';
  children: string;
}) {
  const color =
    tone === 'accent'
      ? 'var(--accent-gold)'
      : tone === 'warning'
        ? '#fca5a5'
        : 'var(--text-primary)';
  return (
    <Tooltip label={label} desc={desc}>
      <span
        role="term"
        tabIndex={0}
        style={{
          color,
          fontWeight: 700,
          textDecoration: 'underline',
          textDecorationColor: tone === 'warning' ? '#fca5a577' : `${color}88`,
          textUnderlineOffset: '0.14em',
          cursor: 'help',
        }}
      >
        {children}
      </span>
    </Tooltip>
  );
}

function AftermathMark({
  label,
  iconGlyph,
  tooltipLabel,
  tooltipDesc,
  tone = 'info',
}: {
  label: string;
  iconGlyph?: string;
  tooltipLabel?: string;
  tooltipDesc?: string;
  tone?: 'gain' | 'loss' | 'warning' | 'info';
}) {
  const color =
    tone === 'gain'
      ? '#86efac'
      : tone === 'loss' || tone === 'warning'
        ? '#fca5a5'
        : 'var(--accent-gold)';
  const content = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color,
        textDecoration: iconGlyph ? undefined : 'underline',
        textUnderlineOffset: '0.12em',
      }}
    >
      {iconGlyph && <span aria-hidden="true">{iconGlyph}</span>}
      <span>{label}</span>
    </span>
  );

  if (tooltipLabel && tooltipDesc) {
    return (
      <Tooltip label={tooltipLabel} desc={tooltipDesc}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

export function EncounterStage({
  open,
  onDisregard,
  onCommitChoice,
  onAcknowledgeAftermath,
  onAftermathReaction,
  model,
}: EncounterStageProps) {
  const referenceMap = useMemo(
    () => new Map(model.narrative.references.map(reference => [reference.id, reference])),
    [model.narrative.references],
  );
  const { enabled: narrationEnabled, isLoading, isSpeaking, speak, stop } = useNarration();
  const [activeNarrationId, setActiveNarrationId] = useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isSubmittingChoice, setIsSubmittingChoice] = useState(false);
  const currentStepId = useMemo(
    () => model.history.find(item => item.status === 'current')?.stepId ?? null,
    [model.history],
  );
  const nextSceneLabel = useMemo(
    () => model.history.find(item => item.status === 'future')?.stepLabel ?? 'Next scene',
    [model.history],
  );
  const selectedChoice = useMemo(
    () => model.choices.find(choice => choice.id === selectedChoiceId) ?? null,
    [model.choices, selectedChoiceId],
  );
  const isAftermathMode = Boolean(model.aftermath);

  useEffect(() => {
    if (!open && activeNarrationId) {
      stop();
      setActiveNarrationId(null);
    }
  }, [activeNarrationId, open, stop]);

  useEffect(() => {
    setSelectedChoiceId(null);
    setIsSubmittingChoice(false);
  }, [currentStepId, open, model]);

  const getParagraphNarrationText = useCallback((paragraph: EncounterStageModel['narrative']['paragraphs'][number]) => {
    return paragraph.segments.map(segment => segment.text).join('').replace(/\s+/g, ' ').trim();
  }, []);

  const getChoiceNarrationText = useCallback((choice: EncounterStageModel['choices'][number]) => {
    return choice.intent.trim();
  }, []);

  const handleNarrate = useCallback(async (id: string, text: string) => {
    if (!narrationEnabled || !text.trim()) return;

    if (isSpeaking && activeNarrationId === id) {
      stop();
      setActiveNarrationId(null);
      return;
    }

    if (isSpeaking) {
      stop();
    }

    setActiveNarrationId(id);
    try {
      await speak(text);
    } finally {
      setActiveNarrationId(current => (current === id ? null : current));
    }
  }, [activeNarrationId, isSpeaking, narrationEnabled, speak, stop]);

  const getNarrationButton = useCallback((id: string, text: string, label: string) => {
    if (!narrationEnabled) return null;

    const isActive = activeNarrationId === id;

    return (
      <button
        type="button"
        onClick={() => {
          void handleNarrate(id, text);
        }}
        title={isActive && isSpeaking ? `Stop narration for ${label}` : `Play narration for ${label}`}
        aria-label={isActive && isSpeaking ? `Stop narration for ${label}` : `Play narration for ${label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          background: 'none',
          border: '1px solid var(--border-subtle)',
          borderRadius: '50%',
          cursor: isLoading && !isActive ? 'wait' : 'pointer',
          color: isActive && isSpeaking ? 'var(--accent-gold)' : 'var(--text-tertiary)',
          padding: 0,
          flexShrink: 0,
          transition: 'color 0.2s, border-color 0.2s',
        }}
      >
        {isActive && isLoading ? (
          <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
        ) : isActive && isSpeaking ? (
          <Square size={8} />
        ) : (
          <Play size={10} style={{ marginLeft: '1px' }} />
        )}
      </button>
    );
  }, [activeNarrationId, handleNarrate, isLoading, isSpeaking, narrationEnabled]);

  const handleSelectChoice = useCallback((choiceId: string) => {
    const choice = model.choices.find(entry => entry.id === choiceId);
    if (!choice || !choice.affordable || isSubmittingChoice) return;
    setSelectedChoiceId(choiceId);
  }, [isSubmittingChoice, model.choices]);

  const handleAdvance = useCallback(() => {
    // Always stop narration when the button is clicked, even if the advance is blocked
    if (isSpeaking) {
      stop();
      setActiveNarrationId(null);
    }
    if (!selectedChoice || !selectedChoice.affordable || isSubmittingChoice) return;
    setIsSubmittingChoice(true);
    onCommitChoice(selectedChoice.id);
  }, [isSubmittingChoice, isSpeaking, onCommitChoice, selectedChoice, stop]);

  const handleAftermathExit = useCallback(() => {
    if (isSpeaking) {
      stop();
      setActiveNarrationId(null);
    }
    onAcknowledgeAftermath?.();
    if (!onAcknowledgeAftermath) {
      onDisregard();
    }
  }, [isSpeaking, onAcknowledgeAftermath, onDisregard, stop]);

  return (
    <Modal open={open} onClose={isAftermathMode ? handleAftermathExit : onDisregard} maxWidth={980}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-gold)',
          background: 'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
              <span
                style={{
                  color: 'var(--accent-gold)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                {TIER_LABEL[model.header.threadTier]}
              </span>
              {model.header.familyLabel && (
                <span
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  {model.header.familyLabel}
                </span>
              )}
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--text-primary)',
              }}
            >
              {model.header.title}
            </h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
              {model.header.locationLabel}
              {model.header.subtitle ? ` · ${model.header.subtitle}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'end' }}>
            {model.header.urgencyLabel && (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid var(--border-gold)',
                  color: 'var(--accent-gold)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {model.header.urgencyLabel}
              </span>
            )}
            <span
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {model.header.threatLabel}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '18px 20px',
          maxHeight: 620,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              padding: '18px 18px',
              borderRadius: 12,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gap: 14,
            }}
          >
            <SectionLabel>{isAftermathMode ? 'Aftermath' : 'Scene'}</SectionLabel>
            {model.illustration && !isAftermathMode && (
              <figure
                style={{
                  margin: 0,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border-gold)',
                    background: 'var(--bg-deep)',
                  }}
                >
                  <img
                    src={model.illustration.src}
                    alt={model.illustration.alt}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                    }}
                  />
                </div>
                {model.illustration.caption && (
                  <figcaption
                    style={{
                      color: 'var(--text-tertiary)',
                      fontSize: 12,
                      lineHeight: 1.7,
                    }}
                  >
                    {model.illustration.caption}
                  </figcaption>
                )}
              </figure>
            )}
            <div style={{ display: 'grid', gap: 12 }}>
              {model.narrative.paragraphs.map((paragraph, paragraphIndex) => {
                const paragraphText = getParagraphNarrationText(paragraph);
                return (
                  <div
                    key={paragraph.id}
                    style={{
                      position: 'relative',
                      paddingRight: narrationEnabled ? 34 : 0,
                    }}
                  >
                    {narrationEnabled && (
                      <div style={{ position: 'absolute', top: 2, right: 0 }}>
                        {getNarrationButton(
                          `paragraph:${paragraph.id}`,
                          paragraphText,
                          `scene paragraph ${paragraphIndex + 1}`,
                        )}
                      </div>
                    )}
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.9,
                        fontSize: 16,
                        maxWidth: 820,
                      }}
                    >
                      {paragraph.segments.map((segment, index) => {
                        const reference = segment.referenceId ? referenceMap.get(segment.referenceId) : undefined;
                        if (!reference) {
                          return (
                            <span
                              key={`${paragraph.id}-${index}`}
                              style={{
                                fontWeight: segment.emphasis === 'strong' ? 700 : undefined,
                                color: segment.emphasis === 'accent' ? 'var(--text-primary)' : undefined,
                              }}
                            >
                              {segment.text}
                            </span>
                          );
                        }
                        return (
                          <NarrativeReference
                            key={`${paragraph.id}-${index}`}
                            label={reference.label}
                            desc={reference.detail}
                            tone={reference.tone}
                          >
                            {segment.text}
                          </NarrativeReference>
                        );
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
            {model.scene.momentLine && (
              <div
                style={{
                  marginTop: 4,
                  color: 'var(--accent-gold)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {model.scene.momentLine}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(360px, 1.45fr) minmax(240px, 1fr)',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: 16 }}>
            {isAftermathMode && model.aftermath ? (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <SectionLabel>{model.aftermath.title}</SectionLabel>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.75 }}>
                  {model.aftermath.overview}
                </div>
                {model.aftermath.actorMoments && model.aftermath.actorMoments.length > 0 && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {model.aftermath.actorMoments.map(moment => (
                      <div
                        key={moment.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '56px minmax(0, 1fr)',
                          gap: 12,
                          alignItems: 'start',
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: 'var(--bg-deep)',
                          border: '1px solid var(--border-gold)',
                        }}
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            overflow: 'hidden',
                            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.18), rgba(20, 17, 11, 0.9))',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-display)',
                            fontSize: 22,
                          }}
                        >
                          {moment.portraitUrl ? (
                            <img
                              src={moment.portraitUrl}
                              alt={moment.actorName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>{moment.actorName[0]?.toUpperCase() ?? '?'}</span>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                            {moment.actorName}
                          </div>
                          <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                            {moment.summaryLines.map((line, index) => (
                              <div key={`${moment.id}:line:${index}`} style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                                {line}
                              </div>
                            ))}
                          </div>
                          {moment.marks && moment.marks.length > 0 && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, fontSize: 13 }}>
                              {moment.marks.map(mark => (
                                <AftermathMark
                                  key={mark.id}
                                  label={mark.label}
                                  iconGlyph={mark.iconGlyph}
                                  tooltipLabel={mark.tooltipLabel}
                                  tooltipDesc={mark.tooltipDesc}
                                  tone={mark.tone}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {model.aftermath.highlights && model.aftermath.highlights.length > 0 && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {model.aftermath.highlights.map(highlight => {
                      const accent =
                        highlight.tone === 'gain'
                          ? '#86efac'
                          : highlight.tone === 'loss'
                            ? '#fca5a5'
                            : highlight.tone === 'mixed'
                              ? 'var(--accent-gold)'
                              : 'var(--text-tertiary)';
                      return (
                        <div
                          key={highlight.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: 'var(--bg-deep)',
                            border: '1px solid var(--border-gold)',
                          }}
                        >
                          <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 15 }}>
                            {highlight.title}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>
                            {highlight.detail}
                          </div>
                          <div style={{ color: accent, fontSize: 11, marginTop: 8 }}>
                            Still loose in the world
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(!model.aftermath.actorMoments || model.aftermath.actorMoments.length === 0)
                  && (!model.aftermath.highlights || model.aftermath.highlights.length === 0)
                  && model.aftermath.changes
                  && (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {model.aftermath.changes.map(change => {
                        const accent =
                          change.polarity === 'gain'
                            ? '#86efac'
                            : change.polarity === 'loss'
                              ? '#fca5a5'
                              : change.polarity === 'mixed'
                                ? 'var(--accent-gold)'
                                : 'var(--text-tertiary)';
                        return (
                          <div
                            key={change.id}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 10,
                              background: 'var(--bg-deep)',
                              border: '1px solid var(--border-gold)',
                            }}
                          >
                            <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 15 }}>
                              {change.title}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>
                              {change.detail}
                            </div>
                            <div style={{ color: accent, fontSize: 11, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {change.kind.replace(/_/g, ' ')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                {model.aftermath.reactionPrompt && (
                  <div style={{ color: 'var(--accent-gold)', fontSize: 12, lineHeight: 1.7 }}>
                    {model.aftermath.reactionPrompt}
                  </div>
                )}
                {model.aftermath.reactions && model.aftermath.reactions.length > 0 && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {model.aftermath.reactions.map(reaction => (
                      <button
                        key={reaction.id}
                        type="button"
                        disabled={reaction.disabled}
                        onClick={() => onAftermathReaction?.(reaction.id)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: reaction.disabled ? 'var(--bg-surface)' : 'var(--bg-deep)',
                          border: '1px solid var(--border-gold)',
                          color: reaction.disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: reaction.disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>
                          {reaction.label}
                        </div>
                        {reaction.intent && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, marginTop: 4 }}>
                            {reaction.intent}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <SectionLabel>Choose Your Approach</SectionLabel>
                <div style={{ display: 'grid', gap: 10 }}>
                  {model.choices.map(choice => {
                    const isSelected = selectedChoiceId === choice.id;
                    const isDisabled = !choice.affordable || isSubmittingChoice;
                    return (
                    <div
                      key={choice.id}
                      role="button"
                      tabIndex={0}
                      aria-disabled={isDisabled}
                      onClick={() => handleSelectChoice(choice.id)}
                      onKeyDown={(event) => {
                        if ((event.key === 'Enter' || event.key === ' ') && !isDisabled) {
                          event.preventDefault();
                          handleSelectChoice(choice.id);
                        }
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: isSelected ? 'rgba(212, 175, 55, 0.10)' : 'var(--bg-deep)',
                        border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-gold)',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: choice.affordable ? 1 : 0.58,
                        boxShadow: isSelected ? '0 0 0 1px rgba(212, 175, 55, 0.18) inset' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 4 }}>
                        <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 15 }}>
                          {choice.label}
                        </div>
                        <div
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        >
                          {getNarrationButton(
                            `choice:${choice.id}`,
                            getChoiceNarrationText(choice),
                            `choice ${choice.label}`,
                          )}
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.75 }}>
                        {choice.intent}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                        {choice.targetLabel && (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                            Target: {choice.targetLabel}
                          </span>
                        )}
                        {choice.costLabel && (
                          <span style={{ color: 'var(--accent-gold)', fontSize: 11 }}>
                            Cost: {choice.costLabel}
                          </span>
                        )}
                        {choice.likelyBurden && (
                          <span style={{ color: '#fca5a5', fontSize: 11 }}>
                            Risk: {choice.likelyBurden}
                          </span>
                        )}
                        {!choice.affordable && (
                          <span style={{ color: '#fca5a5', fontSize: 11, fontWeight: 600 }}>
                            You cannot afford this thread.
                          </span>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <SectionLabel>Scene So Far</SectionLabel>
              <div style={{ display: 'grid', gap: 8 }}>
                {model.history.map(item => (
                  <div key={item.stepId}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                      {item.stepLabel}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {item.status}
                    </div>
                    {item.afterimage && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                        {item.afterimage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <SectionLabel>Your Reserves</SectionLabel>
              <div style={{ display: 'grid', gap: 8 }}>
                {model.resourceSummary?.quintessence !== undefined && (
                  <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                    Quintessence: {model.resourceSummary.quintessence.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-gold)',
          background: 'var(--bg-raised)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
          {isAftermathMode
            ? 'The encounter is finished. Take stock of what changed, then return to the world.'
            : selectedChoice
              ? `Chosen thread: ${selectedChoice.label}${selectedChoice.essenceCost > 0 ? ` · ${selectedChoice.costLabel}` : ''}`
              : 'Choose a thread, then continue to the next scene.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAftermathMode ? (
            <button
              type="button"
              onClick={handleAftermathExit}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'var(--accent-gold)',
                color: '#16120b',
                border: '1px solid var(--border-gold)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Return to the world
            </button>
          ) : (
            <>
              <button
                onClick={onDisregard}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-gold)',
                  cursor: 'pointer',
                }}
              >
                Disregard
              </button>
              <button
                type="button"
                onClick={handleAdvance}
                disabled={!selectedChoice || isSubmittingChoice}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: !selectedChoice || isSubmittingChoice ? 'var(--bg-abyss)' : 'var(--accent-gold)',
                  color: !selectedChoice || isSubmittingChoice ? 'var(--text-muted)' : '#16120b',
                  border: '1px solid var(--border-gold)',
                  cursor: !selectedChoice || isSubmittingChoice ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {selectedChoice?.essenceCost
                  ? `Next — Spend ${selectedChoice.essenceCost.toFixed(2)} essence`
                  : `Next — ${nextSceneLabel}`}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
