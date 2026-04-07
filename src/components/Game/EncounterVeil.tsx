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

// ── Component ──────────────────────────────────────────────────────
export function EncounterVeil({
  open,
  model,
  threadTier,
  essence,
  tick: _tick,
  autoResolveTick: _autoResolveTick,
  onIntervene,
  onBoost: _onBoost,
  onPeek: _onPeek,
  onDisregard,
  onAcknowledgeAftermath: _onAcknowledgeAftermath,
  onAftermathReaction: _onAftermathReaction,
}: EncounterVeilProps) {
  const [visible, setVisible] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  // Trigger entrance animation after mount
  useEffect(() => {
    if (open) {
      // Delay one frame so initial state (opacity 0) is painted first
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      setSelectedChoiceId(null);
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

  // Phase 1 stubs: lightly threaded, watched, aftermath return null
  if (!open) return null;
  if (threadTier === 'light') return null;
  if (threadTier === 'watched') return null;
  if (model.aftermath) return null;

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
          {TIER_LABELS[threadTier]} &middot; Paused
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
            Resume
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
