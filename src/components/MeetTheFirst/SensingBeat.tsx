import { useState, useCallback, useMemo } from 'react';
import type { NarrativeCandidate } from '../../types/meetingEncounter';

interface SensingBeatProps {
  candidates: NarrativeCandidate[];
  openingProse: string;
  onSelect: (candidate: NarrativeCandidate, index: number) => void;
}

/** Spatial rest positions for 3 candidates. */
const REST_POSITIONS = [
  { x: -28, y: -8, scale: 0.85, rotate: -1.5 },
  { x: 26,  y: -4, scale: 0.80, rotate: 1.2 },
  { x: -2,  y: 18, scale: 0.88, rotate: 0.6 },
];

/** Peripheral positions when one candidate is focused. */
const PERIPHERAL_POSITIONS = [
  { x: -40, y: -6,  scale: 0.45, rotate: -3 },
  { x: 42,  y: -10, scale: 0.42, rotate: 2.5 },
  { x: -38, y: 14,  scale: 0.44, rotate: 1.8 },
];

/**
 * THR-1836 — was 1.1, which put the vignette's bottom edge at 1085.9px on a
 * 1080px viewport (Law 33). The vignette block sits inside the scaled button, so
 * the scale moves the block and the portrait together: the name line keeps its
 * place against the title painted into the art. See `focusedVignetteBottomPx`.
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

  // Build index map for stable slot lookups

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

  const handleNav = useCallback((direction: -1 | 1) => {
    if (confirmedIdx !== null || focusedIdx === null) return;
    const next = (focusedIdx + direction + candidates.length) % candidates.length;
    setFocusedIdx(next);
  }, [confirmedIdx, focusedIdx, candidates.length]);

  const isBrowsing = useMemo(() => focusedIdx !== null && confirmedIdx === null, [focusedIdx, confirmedIdx]);

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
    const r = REST_POSITIONS[idx] ?? REST_POSITIONS[0];
    const hoverScale = isHovered ? r.scale + 0.06 : r.scale;
    return {
      transform: `translate(calc(-50% + ${r.x}vw), calc(-50% + ${r.y}vh)) scale(${hoverScale}) rotate(${r.rotate}deg)`,
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

      {/* Floating candidate images */}
      {candidates.map((candidate, idx) => {
        const isFocused = focusedIdx === idx;
        const style = getStyle(idx);

        return (
          <button
            key={candidate.tempId}
            type="button"
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
            {/* Name, epithet, then the vignette — only when focused (THR-1815: the
                resting cluster stays a first look; a name arrives with focus). */}
            <div
              className="absolute left-0 right-0 text-center px-8 transition-opacity duration-700"
              style={{
                bottom: `-${VIGNETTE_DROP_VH}vh`,
                opacity: isFocused ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              {/* One line, not two: the portrait art paints its own title near its
                  foot, and a taller block would climb over it. */}
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
