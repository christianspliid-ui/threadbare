import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { SparkVision } from '../../types/meetingEncounter';
import { getSphereColor } from '../../data/sphereIcons';
import { SPARK_TRANSITION_IN } from '../../data/meeting-narrative-prose';
import type { SphereName } from '../../types/graph';

interface SparkBeatProps {
  visions: SparkVision[];
  primarySphere: SphereName;
  onSelect: (vision: SparkVision, index: number) => void;
}

export const REST_POSITIONS = [
  { x: -28, y: -8, scale: 0.85, rotate: -1.5 },
  { x: 26,  y: -4, scale: 0.80, rotate: 1.2 },
  { x: -2,  y: 18, scale: 0.88, rotate: 0.6 },
];

const PERIPHERAL_POSITIONS = [
  { x: -40, y: -6,  scale: 0.45, rotate: -3 },
  { x: 42,  y: -10, scale: 0.42, rotate: 2.5 },
  { x: -38, y: 14,  scale: 0.44, rotate: 1.8 },
];

/** Resting hover lifts a card's scale by this much. */
const HOVER_SCALE_LIFT = 0.06;
const CARD_WIDTH = 'min(900px, 55vw)';
const FOCUS_SCALE = 1.1;
const CONFIRM_SCALE = 1.8;
const CONFIRM_DELAY_MS = 1200;
const SCENE_BG = '#0a0a0f';

export function SparkBeat({ visions, primarySphere, onSelect }: SparkBeatProps) {
  const [phase, setPhase] = useState<'transition' | 'choosing'>('transition');
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [confirmedIdx, setConfirmedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sphereColor = getSphereColor(primarySphere);
  // THR-1988 — only a Tab moves the look, as on the mortal picker (THR-1987): a
  // mouse press focuses the button before its click fires, so focus alone would
  // look closer and the same click would then choose.
  const tabIntentRef = useRef(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Tab') tabIntentRef.current = true; };
    const onPointer = () => { tabIntentRef.current = false; };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, []);

  // Transition in — show prose, then reveal visions
  useEffect(() => {
    const timer = setTimeout(() => setPhase('choosing'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = useCallback((idx: number) => {
    if (confirmedIdx !== null || phase !== 'choosing') return;

    if (focusedIdx === idx) {
      setConfirmedIdx(idx);
      setTimeout(() => onSelect(visions[idx], idx), CONFIRM_DELAY_MS);
    } else {
      setFocusedIdx(idx);
    }
  }, [focusedIdx, confirmedIdx, phase, onSelect, visions]);

  /** THR-1988 — Tab looks closer, the same as a first click; Enter/Space then chooses. */
  const handleFocus = useCallback((idx: number) => {
    if (!tabIntentRef.current || confirmedIdx !== null || phase !== 'choosing') return;
    setFocusedIdx(idx);
  }, [confirmedIdx, phase]);

  const handleNav = useCallback((direction: -1 | 1) => {
    if (confirmedIdx !== null || focusedIdx === null) return;
    const next = (focusedIdx + direction + visions.length) % visions.length;
    setFocusedIdx(next);
  }, [confirmedIdx, focusedIdx, visions.length]);

  const isBrowsing = useMemo(() => focusedIdx !== null && confirmedIdx === null && phase === 'choosing', [focusedIdx, confirmedIdx, phase]);

  /** The resting transform — shared by the card and its title so the two move as one. */
  const restTransform = (idx: number): string => {
    const r = REST_POSITIONS[idx] ?? REST_POSITIONS[0];
    const scale = hoveredIdx === idx ? r.scale + HOVER_SCALE_LIFT : r.scale;
    return `translate(calc(-50% + ${r.x}vw), calc(-50% + ${r.y}vh)) scale(${scale}) rotate(${r.rotate}deg)`;
  };

  const getStyle = (idx: number): React.CSSProperties => {
    const isFocused = focusedIdx === idx;
    const isConfirmed = confirmedIdx === idx;
    const isHovered = hoveredIdx === idx;
    const somethingFocused = focusedIdx !== null;

    if (isConfirmed) {
      return {
        transform: `translate(-50%, -50%) scale(${CONFIRM_SCALE})`,
        opacity: 0,
        filter: `brightness(1.4) blur(4px) drop-shadow(0 0 40px ${sphereColor}40)`,
        zIndex: 10,
      };
    }
    if (isFocused) {
      return {
        transform: `translate(-50%, -50%) scale(${FOCUS_SCALE})`,
        opacity: 1,
        filter: `brightness(1.1) drop-shadow(0 0 20px ${sphereColor}20)`,
        zIndex: 5,
      };
    }
    if (somethingFocused) {
      const p = PERIPHERAL_POSITIONS[idx] ?? PERIPHERAL_POSITIONS[0];
      return {
        transform: `translate(calc(-50% + ${p.x}vw), calc(-50% + ${p.y}vh)) scale(${p.scale}) rotate(${p.rotate}deg)`,
        opacity: 0.3,
        filter: 'brightness(0.4)',
        zIndex: 1,
      };
    }
    return {
      transform: restTransform(idx),
      opacity: isHovered ? 0.95 : 0.55,
      filter: isHovered ? `brightness(1.15) drop-shadow(0 0 10px ${sphereColor}15)` : 'brightness(0.65)',
      zIndex: isHovered ? 3 : 2,
    };
  };

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: SCENE_BG }}>
      {/* Transition prose */}
      <p
        className="absolute left-0 right-0 text-center transition-all duration-1000"
        style={{
          top: '7vh',
          fontFamily: 'var(--font-prose)',
          fontStyle: 'italic',
          fontSize: '1.3rem',
          letterSpacing: '0.06em',
          color: 'rgba(160,140,180,0.5)',
          opacity: phase === 'transition' ? 1 : confirmedIdx !== null ? 0 : focusedIdx !== null ? 0.4 : 0.7,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {phase === 'transition'
          ? SPARK_TRANSITION_IN
          : focusedIdx !== null
            ? 'Click again to choose this path.'
            : 'What will they become?'}
      </p>

      {/* Vision images — same spatial layout as SensingBeat */}
      {phase === 'choosing' && visions.map((vision, idx) => {
        const isFocused = focusedIdx === idx;
        const style = getStyle(idx);
        const atRest = focusedIdx === null && confirmedIdx === null;

        return (
          <div key={vision.id}>
          <button
            type="button"
            onFocus={() => handleFocus(idx)}
            aria-label={vision.title}
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            data-testid={`spark-vision-${idx}`}
            className="absolute cursor-pointer"
            style={{
              top: '50%',
              left: '50%',
              width: CARD_WIDTH,
              aspectRatio: '16/9',
              background: 'transparent',
              border: 'none',
              padding: 0,
              ...style,
              transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, filter 0.6s ease',
            }}
          >
            {/* Scene backdrop */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${vision.sceneAssetPath}), ${vision.scenePlaceholder}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
              }}
            />
            {/* Character portrait overlay */}
            <div
              className="absolute bottom-0 left-0"
              style={{
                width: '40%',
                aspectRatio: '3/4',
                backgroundImage: `url(${vision.portraitAssetPath}), ${vision.portraitPlaceholder}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                maskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 80%, transparent 100%), linear-gradient(to right, black 0%, black 60%, transparent 100%)',
                maskComposite: 'intersect',
                WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%, black 80%, transparent 100%), linear-gradient(to right, black 0%, black 60%, transparent 100%)',
                WebkitMaskComposite: 'source-in',
              }}
            />
            {/* Vision prose — only when focused */}
            <div
              className="absolute left-0 right-0 text-center px-8 transition-opacity duration-700"
              style={{
                bottom: '-12vh',
                opacity: isFocused ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              <p
                style={{
                  font: 'var(--type-flavor)',
                  color: `${sphereColor}cc`,
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                {vision.prose}
              </p>
            </div>
          </button>
          {/* THR-1988 — the path's name at rest. A twin of the card's box with the same
              transform but none of its dimming, so the title reads at full contrast
              (Law 45) and moves with the card on hover. It sits on the card's masked
              lower edge, so the third card's title stays above the 1080px fold (Law 33). */}
          {vision.title && (
            <div
              aria-hidden="true"
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                width: CARD_WIDTH,
                aspectRatio: '16/9',
                transform: restTransform(idx),
                opacity: atRest ? 1 : 0,
                pointerEvents: 'none',
                zIndex: 4,
                transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s ease',
              }}
            >
              <p
                data-testid={`spark-rest-title-${idx}`}
                className="absolute left-0 right-0 text-center"
                style={{
                  bottom: '1.5rem',
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-lg)',
                  letterSpacing: '0.06em',
                  color: 'rgb(var(--meeting-name-rgb) / 0.95)',
                  textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                }}
              >
                {vision.title}
              </p>
            </div>
          )}
          </div>
        );
      })}

      {/* Navigation chevrons */}
      {isBrowsing && (
        <>
          <button
            type="button"
            onClick={() => handleNav(-1)}
            className="absolute cursor-pointer"
            style={{
              left: '2vw', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: '2rem 1.5rem',
              zIndex: 20, color: 'rgba(160,140,180,0.3)',
              fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
              lineHeight: 1, transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Previous vision"
          >&#x2039;</button>
          <button
            type="button"
            onClick={() => handleNav(1)}
            className="absolute cursor-pointer"
            style={{
              right: '2vw', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', padding: '2rem 1.5rem',
              zIndex: 20, color: 'rgba(160,140,180,0.3)',
              fontSize: '9rem', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
              lineHeight: 1, transition: 'color 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,140,180,0.3)'; }}
            aria-label="Next vision"
          >&#x203a;</button>
        </>
      )}
    </div>
  );
}
