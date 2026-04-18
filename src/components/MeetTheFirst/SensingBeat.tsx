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

const FOCUS_SCALE = 1.1;
const CONFIRM_SCALE = 1.8;
const CONFIRM_DELAY_MS = 1200;
const SCENE_BG = '#0a0a0f';

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
          fontFamily: 'Georgia, "Times New Roman", serif',
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
            className="absolute cursor-pointer"
            style={{
              top: '50%',
              left: '50%',
              width: 'min(550px, 32vw)',
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
            {/* Prose vignette — only when focused */}
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
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.7,
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
