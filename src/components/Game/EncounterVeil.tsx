import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { EncounterStageModel, EncounterStageChoiceModel } from './encounter-stage/types';

// ── Thread tier types ──────────────────────────────────────────────
type ThreadTier = 'strong' | 'light' | 'watched';

// ── Props ──────────────────────────────────────────────────────────
export interface EncounterVeilProps {
  open: boolean;
  model: EncounterStageModel;
  threadTier: ThreadTier;
  essence: number;
  tick: number;
  autoResolveTick: number | null;
  onIntervene: (choiceId: string, essenceCost: number) => void;
  onBoost: (essenceCost: number) => void;
  onPeek: () => void;
  onDisregard: () => void;
  onAcknowledgeAftermath: () => void;
  onAftermathReaction: (reactionId: string) => void;
}

// ── Design tokens ──────────────────────────────────────────────────
const VOID = '#0a0a0f';
const FONT_PROSE = "Georgia, 'Times New Roman', serif";
const FONT_DISPLAY = "'Palatino Linotype', 'Book Antiqua', Palatino, serif";
const GOLD = '#d4af37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.25)';
const TEXT_WARM = 'rgba(212, 196, 158, 0.75)';
const TEXT_WHISPER = 'rgba(180, 170, 150, 0.4)';
const TEXT_GHOST = 'rgba(160, 140, 130, 0.25)';

/** Art opacity per thread tier */
const ART_OPACITY: Record<ThreadTier, number> = {
  strong: 0.85,
  light: 0.6,
  watched: 0.35,
};

/** Type glow colors for choice top line */
const TYPE_COLORS: Record<string, string> = {
  supportive: 'rgba(134, 239, 172, 0.3)',
  coercive: 'rgba(249, 115, 22, 0.3)',
  withdrawn: 'rgba(160, 160, 170, 0.2)',
};

/** Type label colors (slightly brighter for readability) */
const TYPE_LABEL_COLORS: Record<string, string> = {
  supportive: 'rgba(134, 239, 172, 0.7)',
  coercive: 'rgba(249, 115, 22, 0.7)',
  withdrawn: 'rgba(160, 160, 170, 0.5)',
};

/** Thread tier display labels */
const TIER_LABELS: Record<ThreadTier, string> = {
  strong: 'Strongly Threaded',
  light: 'Lightly Threaded',
  watched: 'Watched',
};

/** Staggered entrance animation delays (seconds) */
const ENTRANCE_DELAYS = {
  art: 0.2,
  tierLabel: 0.6,
  stepDots: 0.8,
  title: 0.9,
  agentLine: 1.0,
  divider: 1.1,
  prose: 1.2,
  choices: 1.5,
  footer: 1.8,
} as const;

/** Mode label suffix per thread tier */
const TIER_MODE_SUFFIX: Record<ThreadTier, string> = {
  strong: 'Paused',
  light: 'Notification',
  watched: 'Watching',
};

/** Disregard button label per thread tier */
const DISREGARD_LABEL: Record<ThreadTier, string> = {
  strong: 'Resume',
  light: 'Close',
  watched: 'Dismiss',
};

// ── Component ──────────────────────────────────────────────────────
export function EncounterVeil({
  open,
  model,
  threadTier,
  essence,
  tick,
  autoResolveTick,
  onIntervene,
  onBoost,
  onPeek,
  onDisregard,
  onAcknowledgeAftermath,
  onAftermathReaction,
}: EncounterVeilProps) {
  const [visible, setVisible] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  // Watched tier state
  const [peeked, setPeeked] = useState(false);
  const [boostAmount, setBoostAmount] = useState(0);

  // Trigger entrance animation after mount
  useEffect(() => {
    if (open) {
      // Delay one frame so initial state (opacity 0) is painted first
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      setSelectedChoiceId(null);
      setPeeked(false);
      setBoostAmount(0);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDisregard();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onDisregard]);

  const hasArt = !!model.illustration;

  // Resolve current step index from history
  const { currentStepIndex, totalSteps } = useMemo(() => {
    const idx = model.history.findIndex((h) => h.status === 'current');
    return {
      currentStepIndex: idx >= 0 ? idx : 0,
      totalSteps: model.history.length,
    };
  }, [model.history]);

  const handleChoiceClick = useCallback(
    (choice: EncounterStageChoiceModel) => {
      setSelectedChoiceId((prev) => (prev === choice.id ? null : choice.id));
    },
    [],
  );

  const handleIntervene = useCallback(() => {
    if (!selectedChoiceId) return;
    const choice = model.choices.find((c) => c.id === selectedChoiceId);
    if (choice) {
      onIntervene(choice.id, choice.essenceCost);
    }
  }, [selectedChoiceId, model.choices, onIntervene]);

  if (!open) return null;

  // ── Aftermath rendering path ───────────────────────────────────
  if (model.aftermath) {
    const aftermath = model.aftermath;

    const polarityColor = (polarity: 'gain' | 'loss' | 'mixed' | 'info') => {
      if (polarity === 'gain') return 'rgba(134, 239, 172, 0.65)';
      if (polarity === 'loss') return 'rgba(248, 113, 113, 0.65)';
      if (polarity === 'mixed') return 'rgba(251, 191, 36, 0.65)';
      return 'rgba(180, 170, 150, 0.45)';
    };

    const aftermathEntrance = (delay: number, duration: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`,
    });

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={aftermath.title ?? 'Aftermath'}
        style={{
          position: 'fixed',
          inset: 0,
          background: VOID,
          zIndex: 50,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Art layer — dimmed + desaturated */}
        {hasArt && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${model.illustration!.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              opacity: visible ? 0.5 : 0,
              filter: 'saturate(0.7)',
              transform: visible ? 'scale(1)' : 'scale(1.02)',
              transition: `opacity 1.2s ease ${ENTRANCE_DELAYS.art}s, transform 8s ease-out ${ENTRANCE_DELAYS.art}s`,
            }}
          />
        )}

        {/* Step dots — all resolved */}
        <div
          style={{
            position: 'absolute',
            top: '4vh',
            left: '5vw',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            zIndex: 20,
            ...aftermathEntrance(0.5, 0.8),
          }}
        >
          {model.history.map((step, i) => (
            <div
              key={step.stepId}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(134, 239, 172, 0.4)',
              }}
              aria-label={`Step ${i + 1}: ${step.stepLabel}`}
            />
          ))}
          <span
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.7rem',
              color: TEXT_GHOST,
              marginLeft: 6,
              letterSpacing: '0.04em',
            }}
          >
            resolved
          </span>
        </div>

        {/* Tier label — top-right */}
        <div
          style={{
            position: 'absolute',
            top: '4vh',
            right: '5vw',
            zIndex: 20,
            textAlign: 'right',
            ...aftermathEntrance(0.6, 0.8),
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: GOLD,
              opacity: 0.4,
            }}
          >
            {TIER_LABELS[threadTier]} &middot; Aftermath
          </div>
        </div>

        {/* ── Scrollable content zone ────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: hasArt ? 0 : undefined,
            bottom: 0,
            left: hasArt ? undefined : '50%',
            width: hasArt ? '52%' : '65%',
            transform: hasArt ? undefined : 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '10vh 5vw 10vh 3vw',
            background: hasArt
              ? 'linear-gradient(to right, transparent 0%, rgba(10,10,15,0.55) 10%, rgba(10,10,15,0.82) 28%, rgba(10,10,15,0.93) 50%, rgba(10,10,15,0.97) 100%)'
              : 'transparent',
            zIndex: 10,
            overflowY: 'auto',
          }}
        >
          {/* Aftermath title */}
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TEXT_GHOST,
              marginBottom: 6,
              ...aftermathEntrance(0.7, 0.8),
            }}
          >
            {aftermath.title ?? 'Aftermath'}
          </div>

          {/* Gold divider */}
          <div
            style={{
              height: 1,
              background:
                'linear-gradient(to right, transparent, rgba(212, 175, 55, 0.2), transparent)',
              marginBottom: 22,
              opacity: visible ? 1 : 0,
              transition: `opacity 1s ease 0.9s`,
            }}
          />

          {/* Overview prose — drop cap */}
          <div style={aftermathEntrance(1.0, 1.0)}>
            {aftermath.overview && aftermath.overview.length > 0 && (
              <p
                style={{
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.85,
                  color: TEXT_WARM,
                  marginBottom: 24,
                  maxWidth: 540,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: '3.4em',
                    float: 'left',
                    lineHeight: 0.75,
                    marginRight: '0.06em',
                    marginTop: '0.08em',
                    color: 'rgba(212, 196, 158, 0.55)',
                    fontStyle: 'normal',
                  }}
                >
                  {aftermath.overview[0]}
                </span>
                {aftermath.overview.slice(1)}
              </p>
            )}
          </div>

          {/* Actor moments */}
          {aftermath.actorMoments && aftermath.actorMoments.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginBottom: 24,
                maxWidth: 540,
                ...aftermathEntrance(1.2, 0.9),
              }}
            >
              {aftermath.actorMoments.map((actor) => (
                <div
                  key={actor.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                >
                  {/* Portrait circle */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      background: actor.portraitUrl
                        ? `url(${actor.portraitUrl}) center/cover`
                        : 'rgba(212, 175, 55, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: FONT_DISPLAY,
                      fontSize: '0.9rem',
                      color: 'rgba(212, 175, 55, 0.5)',
                    }}
                  >
                    {!actor.portraitUrl && actor.actorName[0]}
                  </div>
                  {/* Name + summary */}
                  <div>
                    <div
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: '0.8rem',
                        letterSpacing: '0.06em',
                        color: TEXT_WARM,
                        marginBottom: 4,
                      }}
                    >
                      {actor.actorName}
                    </div>
                    {actor.summaryLines.map((line, i) => (
                      <div
                        key={i}
                        style={{
                          fontFamily: FONT_PROSE,
                          fontStyle: 'italic',
                          fontSize: '0.8rem',
                          lineHeight: 1.7,
                          color: TEXT_WHISPER,
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Highlights */}
          {aftermath.highlights && aftermath.highlights.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
                maxWidth: 540,
                ...aftermathEntrance(1.3, 0.9),
              }}
            >
              {aftermath.highlights.map((h) => (
                <div
                  key={h.id}
                  style={{
                    padding: '10px 14px',
                    border: `1px solid ${polarityColor(h.tone ?? 'info')}`,
                    borderRadius: 2,
                    borderLeft: `3px solid ${polarityColor(h.tone ?? 'info')}`,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: '0.78rem',
                      letterSpacing: '0.05em',
                      color: TEXT_WARM,
                      marginBottom: 4,
                    }}
                  >
                    {h.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_PROSE,
                      fontStyle: 'italic',
                      fontSize: '0.75rem',
                      color: TEXT_WHISPER,
                      lineHeight: 1.65,
                    }}
                  >
                    {h.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Changes */}
          {aftermath.changes && aftermath.changes.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
                maxWidth: 540,
                ...aftermathEntrance(1.4, 0.9),
              }}
            >
              {aftermath.changes.map((change) => (
                <div
                  key={change.id}
                  style={{
                    padding: '10px 14px',
                    border: `1px solid rgba(212, 175, 55, 0.1)`,
                    borderRadius: 2,
                    borderLeft: `3px solid ${polarityColor(change.polarity)}`,
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontSize: '0.78rem',
                      letterSpacing: '0.05em',
                      color: TEXT_WARM,
                    }}
                  >
                    {change.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_PROSE,
                      fontStyle: 'italic',
                      fontSize: '0.75rem',
                      color: TEXT_WHISPER,
                      lineHeight: 1.65,
                    }}
                  >
                    {change.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {aftermath.reactions && aftermath.reactions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
                maxWidth: 540,
                ...aftermathEntrance(1.5, 0.9),
              }}
            >
              {aftermath.reactionPrompt && (
                <div
                  style={{
                    fontFamily: FONT_PROSE,
                    fontStyle: 'italic',
                    fontSize: '0.75rem',
                    color: TEXT_GHOST,
                    marginBottom: 6,
                    letterSpacing: '0.04em',
                  }}
                >
                  {aftermath.reactionPrompt}
                </div>
              )}
              {aftermath.reactions.map((reaction) => (
                <button
                  key={reaction.id}
                  disabled={reaction.disabled}
                  onClick={() => onAftermathReaction(reaction.id)}
                  style={{
                    background: 'rgba(212, 175, 55, 0.03)',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                    borderRadius: 2,
                    fontFamily: FONT_PROSE,
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                    letterSpacing: '0.04em',
                    color: reaction.disabled ? TEXT_GHOST : TEXT_WARM,
                    cursor: reaction.disabled ? 'default' : 'pointer',
                    padding: '12px 16px',
                    textAlign: 'left',
                    opacity: reaction.disabled ? 0.4 : 1,
                    transition: 'all 0.4s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!reaction.disabled) {
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.03)';
                  }}
                >
                  {reaction.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '2.5vh 5vw',
            zIndex: 20,
            background: `linear-gradient(to top, ${VOID} 0%, rgba(10,10,15,0.6) 60%, transparent 100%)`,
            ...aftermathEntrance(1.6, 0.8),
          }}
        >
          <button
            onClick={onAcknowledgeAftermath}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
              color: GOLD,
              opacity: 0.6,
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'all 0.4s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.textShadow = '0 0 20px rgba(212, 175, 55, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.textShadow = 'none';
            }}
          >
            Return to the world
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  // ── Watched tier rendering path ────────────────────────────────
  if (threadTier === 'watched') {
    const tierModeLabel = peeked ? 'Watched · Boost' : 'Watched · Peek';

    // Shared entrance style helper for watched (uses same visible state)
    const watchedEntrance = (delay: number, duration: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transition: `opacity ${duration}s ease ${delay}s`,
    });

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={model.header.title}
        style={{
          position: 'fixed',
          inset: 0,
          background: VOID,
          zIndex: 50,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Art layer — desaturated */}
        {hasArt && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${model.illustration!.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
              opacity: visible ? ART_OPACITY.watched : 0,
              filter: 'grayscale(40%)',
              transform: visible ? 'scale(1)' : 'scale(1.02)',
              transition: `opacity 1.2s ease ${ENTRANCE_DELAYS.art}s, transform 8s ease-out ${ENTRANCE_DELAYS.art}s`,
            }}
          />
        )}

        {/* Tier label — top-right */}
        <div
          style={{
            position: 'absolute',
            top: '4vh',
            right: '5vw',
            zIndex: 20,
            textAlign: 'right',
            ...watchedEntrance(0.6, 0.8),
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: GOLD,
              opacity: 0.5,
            }}
          >
            {tierModeLabel}
          </div>
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.7rem',
              color: TEXT_GHOST,
              marginTop: 4,
              letterSpacing: '0.05em',
            }}
          >
            {model.header.threatLabel} threat
          </div>
        </div>

        {/* ── Peek gate (before peek) ─────────────────────── */}
        {!peeked && (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              ...watchedEntrance(0.4, 1.0),
            }}
          >
            {/* Diamond icon */}
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: '1.8rem',
                color: GOLD,
                opacity: 0.35,
              }}
            >
              ◆
            </div>

            {/* Whisper text */}
            <div
              style={{
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: '0.8rem',
                color: TEXT_WHISPER,
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}
            >
              This encounter runs in the background
            </div>

            {/* Peek button */}
            <button
              onClick={() => {
                setPeeked(true);
                onPeek();
              }}
              style={{
                background: 'rgba(212, 175, 55, 0.04)',
                border: '1px solid rgba(212, 175, 55, 0.12)',
                borderRadius: 2,
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: '0.85rem',
                letterSpacing: '0.06em',
                color: 'rgba(212, 175, 55, 0.45)',
                cursor: 'pointer',
                padding: '10px 24px',
                transition: 'all 0.4s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                e.currentTarget.style.color = 'rgba(212, 175, 55, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.04)';
                e.currentTarget.style.color = 'rgba(212, 175, 55, 0.45)';
              }}
            >
              ◆ 1 — Peer Through the Thread
            </button>
          </div>
        )}

        {/* ── Revealed view (after peek) ──────────────────── */}
        {peeked && (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
              maxWidth: 540,
              padding: '0 5vw',
              ...watchedEntrance(0.1, 0.6),
            }}
          >
            {/* Short prose — first paragraph only */}
            <div>
              {model.narrative.paragraphs.slice(0, 1).map((para) => {
                const text = para.segments.map((s) => s.text).join('');
                return (
                  <p
                    key={para.id}
                    style={{
                      fontFamily: FONT_PROSE,
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                      lineHeight: 1.85,
                      color: TEXT_WHISPER,
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    {text}
                  </p>
                );
              })}
            </div>

            {/* Gold divider */}
            <div
              style={{
                height: 1,
                width: '60%',
                background:
                  'linear-gradient(to right, transparent, rgba(212, 175, 55, 0.2), transparent)',
              }}
            />

            {/* Boost pip slider */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: '0.7rem',
                  color: TEXT_GHOST,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Boost
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3, 4, 5].map((pip) => (
                  <button
                    key={pip}
                    onClick={() => setBoostAmount(pip === boostAmount ? 0 : pip)}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: `1px solid ${pip <= boostAmount ? 'rgba(212, 175, 55, 0.6)' : 'rgba(212, 175, 55, 0.2)'}`,
                      background:
                        pip <= boostAmount
                          ? 'rgba(212, 175, 55, 0.4)'
                          : 'transparent',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={`Boost ${pip}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '2.5vh 5vw',
            zIndex: 20,
            background: `linear-gradient(to top, ${VOID} 0%, rgba(10,10,15,0.6) 60%, transparent 100%)`,
            ...watchedEntrance(0.8, 0.8),
          }}
        >
          {/* Essence display */}
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.75rem',
              color: GOLD,
              opacity: 0.35,
              letterSpacing: '0.04em',
            }}
          >
            &#9670; {essence} essence
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <button
              onClick={onDisregard}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: '0.85rem',
                letterSpacing: '0.06em',
                color: TEXT_GHOST,
                cursor: 'pointer',
                padding: '8px 0',
                transition: 'all 0.4s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = TEXT_WHISPER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = TEXT_GHOST;
              }}
            >
              Close
            </button>
            {peeked && (
              <button
                onClick={() => onBoost(boostAmount)}
                disabled={boostAmount === 0}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  letterSpacing: '0.06em',
                  color: GOLD,
                  opacity: boostAmount > 0 ? 0.7 : 0.3,
                  cursor: boostAmount > 0 ? 'pointer' : 'default',
                  padding: '8px 0',
                  transition: 'all 0.4s ease',
                }}
                onMouseEnter={(e) => {
                  if (boostAmount > 0) {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.textShadow =
                      '0 0 20px rgba(212, 175, 55, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = boostAmount > 0 ? '0.7' : '0.3';
                  e.currentTarget.style.textShadow = 'none';
                }}
              >
                Commit
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // Derived values for lightly threaded timer
  const ticksUntilAutoResolve =
    autoResolveTick !== null ? autoResolveTick - tick : null;

  const selectedChoice = model.choices.find((c) => c.id === selectedChoiceId);

  // ── Inline style helpers ───────────────────────────────────────
  function entranceStyle(
    delay: number,
    duration: number,
    translateY = 8,
  ): React.CSSProperties {
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : `translateY(${translateY}px)`,
      transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`,
    };
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={model.header.title}
      style={{
        position: 'fixed',
        inset: 0,
        background: VOID,
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* ── Auto-resolve timer bar (lightly threaded only) ── */}
      {threadTier === 'light' && ticksUntilAutoResolve !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 5vw',
            height: 28,
          }}
        >
          {/* Warm amber timer bar */}
          <div
            style={{
              flex: 1,
              height: 2,
              background: 'rgba(212, 160, 55, 0.18)',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                background:
                  'linear-gradient(to right, rgba(212, 160, 55, 0.5), rgba(212, 175, 55, 0.25))',
              }}
            />
          </div>
          {/* Timer label */}
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.65rem',
              letterSpacing: '0.06em',
              color: 'rgba(212, 160, 55, 0.55)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            auto-resolves in {ticksUntilAutoResolve} tick
            {ticksUntilAutoResolve !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Art layer ─────────────────────────────────────── */}
      {hasArt && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${model.illustration!.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage:
              'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 80% at 35% 40%, black 20%, transparent 75%)',
            opacity: visible ? ART_OPACITY[threadTier] : 0,
            transform: visible ? 'scale(1)' : 'scale(1.02)',
            transition: `opacity 1.2s ease ${ENTRANCE_DELAYS.art}s, transform 8s ease-out ${ENTRANCE_DELAYS.art}s`,
          }}
        />
      )}

      {/* ── Art caption ───────────────────────────────────── */}
      {hasArt && model.illustration!.caption && (
        <div
          style={{
            position: 'absolute',
            bottom: '6vh',
            left: '4vw',
            fontFamily: FONT_DISPLAY,
            fontSize: '1.05rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.18)',
            zIndex: 5,
            ...entranceStyle(1.0, 1.0),
          }}
        >
          {model.illustration!.caption}
        </div>
      )}

      {/* ── Thread tier whisper (top-right) ────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '4vh',
          right: '5vw',
          zIndex: 20,
          textAlign: 'right' as const,
          ...entranceStyle(ENTRANCE_DELAYS.tierLabel, 0.8, -8),
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: GOLD,
            opacity: 0.5,
          }}
        >
          {TIER_LABELS[threadTier]} &middot; {TIER_MODE_SUFFIX[threadTier]}
        </div>
        <div
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: '0.7rem',
            color: TEXT_GHOST,
            marginTop: 4,
            letterSpacing: '0.05em',
          }}
        >
          {model.header.threatLabel} threat
        </div>
      </div>

      {/* ── Content zone (reading area) ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: hasArt ? 0 : undefined,
          bottom: 0,
          left: hasArt ? undefined : '50%',
          width: hasArt ? '52%' : '65%',
          transform: hasArt ? undefined : 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '6vh 5vw 8vh 3vw',
          background: hasArt
            ? 'linear-gradient(to right, transparent 0%, rgba(10,10,15,0.55) 10%, rgba(10,10,15,0.82) 28%, rgba(10,10,15,0.93) 50%, rgba(10,10,15,0.97) 100%)'
            : 'transparent',
          zIndex: 10,
          overflowY: 'auto',
        }}
      >
        {/* Step dots */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 24,
            ...entranceStyle(ENTRANCE_DELAYS.stepDots, 0.8),
          }}
        >
          {model.history.map((step, i) => (
            <div
              key={step.stepId}
              style={{
                width: step.status === 'current' ? 8 : 6,
                height: step.status === 'current' ? 8 : 6,
                borderRadius: '50%',
                background:
                  step.status === 'current'
                    ? GOLD
                    : step.status === 'resolved'
                      ? 'rgba(134, 239, 172, 0.4)'
                      : TEXT_GHOST,
                opacity: step.status === 'current' ? 0.6 : 1,
                boxShadow:
                  step.status === 'current'
                    ? '0 0 8px rgba(212, 175, 55, 0.2)'
                    : 'none',
                transition: 'all 0.4s ease',
              }}
              aria-label={`Step ${i + 1}: ${step.stepLabel}`}
            />
          ))}
          <span
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.7rem',
              color: TEXT_GHOST,
              marginLeft: 6,
              letterSpacing: '0.04em',
            }}
          >
            {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Encounter title */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: '0.75rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: TEXT_GHOST,
            marginBottom: 6,
            ...entranceStyle(ENTRANCE_DELAYS.title, 0.8),
          }}
        >
          {model.header.title}
        </div>

        {/* Agent/subtitle line */}
        {model.header.subtitle && (
          <div
            style={{
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.8rem',
              color: TEXT_WHISPER,
              marginBottom: 20,
              ...entranceStyle(ENTRANCE_DELAYS.agentLine, 0.8),
            }}
          >
            {model.header.subtitle}
          </div>
        )}

        {/* Gold divider */}
        <div
          style={{
            height: 1,
            background:
              'linear-gradient(to right, transparent, rgba(212, 175, 55, 0.2), transparent)',
            marginBottom: 22,
            opacity: visible ? 1 : 0,
            transition: `opacity 1s ease ${ENTRANCE_DELAYS.divider}s`,
          }}
        />

        {/* Prose paragraphs */}
        <div style={entranceStyle(ENTRANCE_DELAYS.prose, 1.0, 12)}>
          {model.narrative.paragraphs.map((para, pIdx) => {
            const text = para.segments.map((s) => s.text).join('');
            // Drop cap on first paragraph
            const isFirst = pIdx === 0;
            return (
              <p
                key={para.id}
                style={{
                  fontFamily: FONT_PROSE,
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  lineHeight: 1.85,
                  color: TEXT_WARM,
                  marginBottom: 16,
                  maxWidth: 540,
                }}
              >
                {isFirst && text.length > 0 ? (
                  <>
                    <span
                      style={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: '3.4em',
                        float: 'left',
                        lineHeight: 0.75,
                        marginRight: '0.06em',
                        marginTop: '0.08em',
                        color: 'rgba(212, 196, 158, 0.55)',
                        fontStyle: 'normal',
                      }}
                    >
                      {text[0]}
                    </span>
                    {text.slice(1)}
                  </>
                ) : (
                  text
                )}
              </p>
            );
          })}

          {/* Moment line from scene */}
          {model.scene.momentLine && (
            <div
              style={{
                fontFamily: FONT_PROSE,
                fontStyle: 'italic',
                fontSize: '0.8rem',
                color: GOLD,
                opacity: 0.4,
                marginTop: 8,
                letterSpacing: '0.04em',
              }}
            >
              {model.scene.momentLine}
            </div>
          )}
        </div>

        {/* ── Choice blocks ─────────────────────────────── */}
        <div
          style={{
            marginTop: 28,
            ...entranceStyle(ENTRANCE_DELAYS.choices, 1.0, 16),
          }}
        >
          {model.choices.map((choice) => (
            <ChoiceBlock
              key={choice.id}
              choice={choice}
              selected={selectedChoiceId === choice.id}
              onClick={() => handleChoiceClick(choice)}
            />
          ))}
        </div>
      </div>

      {/* ── Footer chrome ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2.5vh 5vw',
          zIndex: 20,
          background: `linear-gradient(to top, ${VOID} 0%, rgba(10,10,15,0.6) 60%, transparent 100%)`,
          ...entranceStyle(ENTRANCE_DELAYS.footer, 0.8),
        }}
      >
        {/* Essence display */}
        <div
          style={{
            fontFamily: FONT_PROSE,
            fontStyle: 'italic',
            fontSize: '0.75rem',
            color: GOLD,
            opacity: 0.35,
            letterSpacing: '0.04em',
          }}
        >
          &#9670; {essence} essence
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <button
            onClick={onDisregard}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
              color: TEXT_GHOST,
              cursor: 'pointer',
              padding: '8px 0',
              transition: 'all 0.4s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = TEXT_WHISPER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = TEXT_GHOST;
            }}
          >
            {DISREGARD_LABEL[threadTier]}
          </button>
          <button
            onClick={handleIntervene}
            disabled={!selectedChoice}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: FONT_PROSE,
              fontStyle: 'italic',
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
              color: GOLD,
              opacity: selectedChoice ? 0.7 : 0.3,
              cursor: selectedChoice ? 'pointer' : 'default',
              padding: '8px 0',
              transition: 'all 0.4s ease',
            }}
            onMouseEnter={(e) => {
              if (selectedChoice) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.textShadow =
                  '0 0 20px rgba(212, 175, 55, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = selectedChoice ? '0.7' : '0.3';
              e.currentTarget.style.textShadow = 'none';
            }}
          >
            Intervene
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── ChoiceBlock sub-component ──────────────────────────────────────
interface ChoiceBlockProps {
  choice: EncounterStageChoiceModel;
  selected: boolean;
  onClick: () => void;
}

function ChoiceBlock({ choice, selected, onClick }: ChoiceBlockProps) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || selected;

  const typeColor = choice.interventionType
    ? TYPE_COLORS[choice.interventionType]
    : undefined;
  const typeLabelColor = choice.interventionType
    ? TYPE_LABEL_COLORS[choice.interventionType]
    : undefined;

  const boostLabel =
    choice.probabilityBoost && choice.probabilityBoost > 0
      ? `+${Math.round(choice.probabilityBoost * 100)}% success`
      : choice.interventionType === 'withdrawn'
        ? 'fate decides'
        : undefined;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '18px 22px',
        marginBottom: 12,
        borderRadius: 2,
        cursor: 'pointer',
        background: selected
          ? 'rgba(212, 175, 55, 0.06)'
          : hovered
            ? 'rgba(212, 175, 55, 0.03)'
            : 'transparent',
        border: 'none',
        textAlign: 'left' as const,
        width: '100%',
        maxWidth: 540,
        transition: 'all 0.5s ease',
      }}
    >
      {/* Type glow line at top */}
      {typeColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '5%',
            right: '5%',
            height: 1,
            opacity: active ? 1 : 0,
            background: `linear-gradient(to right, transparent, ${typeColor}, transparent)`,
            transition: 'opacity 0.5s ease',
          }}
        />
      )}

      {/* Left border glow */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '10%',
          bottom: '10%',
          width: 1,
          background: active
            ? `linear-gradient(to bottom, transparent, ${GOLD_DIM}, transparent)`
            : 'transparent',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Intent text */}
      <div
        style={{
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: '0.9rem',
          lineHeight: 1.75,
          color: active ? TEXT_WARM : TEXT_WHISPER,
          transition: 'color 0.5s ease',
        }}
      >
        {choice.intent}
      </div>

      {/* Meta row (type label + essence cost + boost) */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginTop: 8,
          fontFamily: FONT_PROSE,
          fontStyle: 'italic',
          fontSize: '0.7rem',
          letterSpacing: '0.04em',
        }}
      >
        {choice.interventionType && (
          <span
            style={{
              textTransform: 'lowercase',
              color: typeLabelColor,
              opacity: active ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          >
            {choice.interventionType}
          </span>
        )}
        <span
          style={{
            color: GOLD,
            opacity: active ? 0.7 : 0.35,
            transition: 'opacity 0.5s ease',
          }}
        >
          &#9670; {choice.essenceCost} essence
        </span>
        {boostLabel && (
          <span style={{ color: TEXT_GHOST }}>{boostLabel}</span>
        )}
      </div>

      {/* God voice (revealed on select) */}
      {choice.godVoice && (
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontStyle: 'italic',
            fontSize: '0.8rem',
            color: GOLD,
            opacity: selected ? 0.5 : 0,
            maxHeight: selected ? 80 : 0,
            overflow: 'hidden',
            marginTop: selected ? 12 : 0,
            paddingTop: selected ? 2 : 0,
            paddingLeft: 12,
            borderLeft: '1px solid rgba(212, 175, 55, 0.15)',
            transition: 'all 0.6s ease',
            lineHeight: 1.7,
          }}
        >
          &ldquo;{choice.godVoice}&rdquo;
        </div>
      )}
    </button>
  );
}
