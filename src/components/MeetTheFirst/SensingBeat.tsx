import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { NarrativeCandidate } from '../../types/meetingEncounter';
import { SENSING_CHOOSE_HINT } from '../../data/meeting-narrative-prose';

interface SensingBeatProps {
  candidates: NarrativeCandidate[];
  openingProse: string;
  onSelect: (candidate: NarrativeCandidate, index: number) => void;
}

/**
 * Spatial rest positions for 3 candidates.
 *
 * THR-1987 — the third sat at y 18vh, its foot at ~1057px on a 1080px viewport,
 * leaving no room for the resting name line beneath it (Law 33). At 11vh its foot
 * is ~982px (hovered ~1004px) and the name line ends well above the fold.
 */
export const REST_POSITIONS = [
  { x: -28, y: -8, scale: 0.85, rotate: -1.5 },
  { x: 26,  y: -4, scale: 0.80, rotate: 1.2 },
  { x: -2,  y: 11, scale: 0.88, rotate: 0.6 },
];
/** Resting hover lifts a portrait's scale by this much. */
const HOVER_SCALE_LIFT = 0.06;

/** Peripheral positions when one candidate is focused. */
const PERIPHERAL_POSITIONS = [
  { x: -40, y: -6,  scale: 0.45, rotate: -3 },
  { x: 42,  y: -10, scale: 0.42, rotate: 2.5 },
  { x: -38, y: 14,  scale: 0.44, rotate: 1.8 },
];

/**
 * THR-1836 — was 1.1, which put the vignette's bottom edge at 1085.9px on a
 * 1080px viewport (Law 33). The vignette block sits inside the scaled button, so
 * the scale moves the block and the portrait together. See `focusedVignetteBottomPx`.
 */
export const FOCUS_SCALE = 1.05;
const CONFIRM_SCALE = 1.8;
/** How far below the portrait's foot the vignette block's bottom edge sits, in vh (pre-scale). */
export const VIGNETTE_DROP_VH = 12;
/** Portrait width: `min(PORTRAIT_MAX_WIDTH_PX, PORTRAIT_WIDTH_VW vw)`, aspect 3:4. */
export const PORTRAIT_MAX_WIDTH_PX = 550;
export const PORTRAIT_WIDTH_VW = 32;

/**
 * THR-1836 — where the focused vignette block's bottom edge lands, in px from the
 * viewport top. The block is bottom-anchored and grows upward, so the edge does not
 * depend on the text length: it is the centred portrait's half-height plus the drop,
 * both scaled by FOCUS_SCALE about the viewport centre.
 */
export function focusedVignetteBottomPx(viewportW: number, viewportH: number): number {
  const portraitW = Math.min(PORTRAIT_MAX_WIDTH_PX, (PORTRAIT_WIDTH_VW / 100) * viewportW);
  const portraitH = (portraitW * 4) / 3;
  const drop = (VIGNETTE_DROP_VH / 100) * viewportH;
  return viewportH / 2 + (portraitH / 2 + drop) * FOCUS_SCALE;
}
const CONFIRM_DELAY_MS = 1200;
const SCENE_BG = '#0a0a0f';

/** THR-1815 — "{name}, {epithet}", or whichever exists; undefined when neither does. */
export function candidateLabel(name: string | undefined, epithet: string | undefined): string | undefined {
  const parts = [name, epithet].filter((p): p is string => Boolean(p && p.trim()));
  return parts.length > 0 ? parts.join(', ') : undefined;
}

export function SensingBeat({ candidates, openingProse, onSelect }: SensingBeatProps) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [confirmedIdx, setConfirmedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  // THR-1987 — only a Tab moves the look. Focus alone is not intent: a mouse press
  // focuses the button before its click fires (onFocus would look closer and the
  // same click would then choose — one click, not two, Law 48), and the shell
  // focuses the first portrait on mount. A Tab press sets this; a pointer press
  // clears it.
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

  const handleClick = useCallback((idx: number) => {
    if (confirmedIdx !== null) return;

    if (focusedIdx === idx) {
      // Second click — confirm
      setConfirmedIdx(idx);
      setTimeout(() => onSelect(candidates[idx], idx), CONFIRM_DELAY_MS);
    } else {
      // First click — focus
      setFocusedIdx(idx);
    }
  }, [focusedIdx, confirmedIdx, onSelect, candidates]);

  /** THR-1987 — Tab looks closer, the same as a first click; Enter/Space then chooses. */
  const handleFocus = useCallback((idx: number) => {
    if (!tabIntentRef.current || confirmedIdx !== null) return;
    setFocusedIdx(idx);
  }, [confirmedIdx]);

  const handleNav = useCallback((direction: -1 | 1) => {
    if (confirmedIdx !== null || focusedIdx === null) return;
    const next = (focusedIdx + direction + candidates.length) % candidates.length;
    setFocusedIdx(next);
  }, [confirmedIdx, focusedIdx, candidates.length]);

  const isBrowsing = useMemo(() => focusedIdx !== null && confirmedIdx === null, [focusedIdx, confirmedIdx]);

  /** The resting transform — shared by the portrait and its name line so the two move as one. */
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
        filter: 'brightness(1.4) blur(4px)',
        zIndex: 10,
      };
    }

    if (isFocused) {
      return {
        transform: `translate(-50%, -50%) scale(${FOCUS_SCALE})`,
        opacity: 1,
        filter: 'brightness(1.1)',
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

    // Rest state
    return {
      transform: restTransform(idx),
      opacity: isHovered ? 0.95 : 0.55,
      filter: isHovered ? 'brightness(1.15)' : 'brightness(0.65)',
      zIndex: isHovered ? 3 : 2,
    };
  };

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: SCENE_BG }}>
      {/* Opening prose */}
      <p
        className="absolute left-0 right-0 text-center transition-all duration-700"
        style={{
          top: '7vh',
          color: 'rgba(160,140,180,0.5)',
          fontStyle: 'italic',
          fontFamily: 'var(--font-prose)',
          fontSize: '1.3rem',
          letterSpacing: '0.06em',
          opacity: confirmedIdx !== null ? 0 : focusedIdx !== null ? 0.4 : 1,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {focusedIdx !== null
          ? 'Click again to choose. Or reach for another.'
          : openingProse}
      </p>
      {/* THR-1987 — the hint. It sits under the opening line, not under the cluster:
          the cluster's foot is near the fold at 1080px (Law 33). On focus it gives
          way to the focused line above, which takes its place. */}
      <p
        data-testid="sensing-choose-hint"
        className="absolute left-0 right-0 text-center transition-opacity duration-700"
        style={{
          top: 'calc(7vh + 2.4rem)',
          color: 'rgb(var(--meeting-caption-rgb) / 0.8)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          letterSpacing: '0.04em',
          opacity: focusedIdx === null && confirmedIdx === null ? 1 : 0,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {SENSING_CHOOSE_HINT}
      </p>

      {/* Floating candidate images */}
      {candidates.map((candidate, idx) => {
        const isFocused = focusedIdx === idx;
        const style = getStyle(idx);
        const atRest = focusedIdx === null && confirmedIdx === null;

        return (
          <div key={candidate.tempId}>
          <button
            type="button"
            onFocus={() => handleFocus(idx)}
            onClick={() => handleClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            data-testid={`sensing-candidate-${idx}`}
            // THR-1815 — the player picks a person, not a painting. Fail-soft:
            // whichever of name / epithet exists; neither ⇒ no label (as before).
            aria-label={candidateLabel(candidate.name, candidate.epithet)}
            className="absolute cursor-pointer"
            style={{
              top: '50%',
              left: '50%',
              width: `min(${PORTRAIT_MAX_WIDTH_PX}px, ${PORTRAIT_WIDTH_VW}vw)`,
              aspectRatio: '3/4',
              background: 'transparent',
              border: 'none',
              padding: 0,
              ...style,
              transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.8s ease, filter 0.6s ease',
            }}
          >
            {/* Image with dissolved edges */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${candidate.imageAssetPath}), ${candidate.placeholderGradient}`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center, black 30%, transparent 95%)',
              }}
            />
            {/* Name, epithet, then the vignette — when focused. At rest the name
                line is drawn outside the button (below), so the dimmed portrait
                does not dim it too. */}
            <div
              className="absolute left-0 right-0 text-center px-8 transition-opacity duration-700"
              style={{
                bottom: `-${VIGNETTE_DROP_VH}vh`,
                opacity: isFocused ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              {/* One line, not two: a taller block would climb over the portrait's
                  foot, and 2 of the 24 portraits (eye-scout, heart-counselor) paint
                  a title there. The rest carry only a painter's signature. */}
              {isFocused && (candidate.name || candidate.epithet) && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'rgba(200,190,170,0.85)', margin: '0 0 6px' }}>
                  {candidate.name && (
                    <span
                      data-testid={`sensing-candidate-name-${idx}`}
                      style={{ fontSize: '1.1rem', letterSpacing: '0.04em', color: 'rgba(222,206,172,0.95)' }}
                    >
                      {candidate.name}
                    </span>
                  )}
                  {candidate.name && candidate.epithet && ' · '}
                  {candidate.epithet && (
                    <span data-testid={`sensing-candidate-epithet-${idx}`}>{candidate.epithet}</span>
                  )}
                </p>
              )}
              <p
                style={{
                  font: 'var(--type-flavor)',
                  color: 'rgba(200,190,170,0.85)',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                {candidate.vignetteText}
              </p>
            </div>
          </button>
          {/* THR-1987 — the resting name line. A twin of the portrait's box with the
              same transform but none of its dimming, so the line sits under the
              image at full contrast (Law 45) and moves with it on hover. */}
          {(candidate.name || candidate.epithet) && (
            <div
              aria-hidden="true"
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                width: `min(${PORTRAIT_MAX_WIDTH_PX}px, ${PORTRAIT_WIDTH_VW}vw)`,
                aspectRatio: '3/4',
                transform: restTransform(idx),
                opacity: atRest ? 1 : 0,
                pointerEvents: 'none',
                zIndex: 4,
                transition: 'transform 1s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s ease',
              }}
            >
              <p
                data-testid={`sensing-rest-label-${idx}`}
                className="absolute left-0 right-0 text-center px-6"
                style={{
                  top: '100%',
                  marginTop: '0.5rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-xs)',
                  color: 'rgb(var(--meeting-caption-rgb) / 0.9)',
                }}
              >
                {candidate.name && (
                  <span
                    data-testid={`sensing-rest-name-${idx}`}
                    style={{ fontSize: 'var(--text-sm)', letterSpacing: '0.04em', color: 'rgb(var(--meeting-name-rgb) / 0.95)' }}
                  >
                    {candidate.name}
                  </span>
                )}
                {candidate.name && candidate.epithet && ' · '}
                {candidate.epithet && (
                  <span data-testid={`sensing-rest-epithet-${idx}`}>{candidate.epithet}</span>
                )}
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
            aria-label="Previous candidate"
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
            aria-label="Next candidate"
          >&#x203a;</button>
        </>
      )}
    </div>
  );
}
