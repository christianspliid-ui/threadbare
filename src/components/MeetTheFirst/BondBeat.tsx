import { useState, useEffect } from 'react';
import type { NarrativeCandidate, SparkVision } from '../../types/meetingEncounter';
import { BOND_PROSE, BOND_PROSE_FALLBACK, BOND_RELEASE_TEXT } from '../../data/meeting-narrative-prose';
import { getSphereColor } from '../../data/sphereIcons';
import type { SphereName } from '../../types/graph';

interface BondBeatProps {
  candidate: NarrativeCandidate;
  vision: SparkVision;
  hungerId: string;
  primarySphere: SphereName;
  onComplete: (editedName: string | undefined) => void;
}

const SCENE_BG = '#0a0a0f';

export function BondBeat({ candidate, vision, hungerId, primarySphere, onComplete }: BondBeatProps) {
  const [phase, setPhase] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(candidate.name);

  const sphereColor = getSphereColor(primarySphere);
  const bondProse = BOND_PROSE[hungerId] ?? BOND_PROSE_FALLBACK;

  // Staggered reveal
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Image appears
      setTimeout(() => setPhase(2), 1500),  // Bond prose
      setTimeout(() => setPhase(3), 3000),  // Name + epithet
      setTimeout(() => setPhase(4), 4000),  // Release button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const lineStyle = (minPhase: number): React.CSSProperties => ({
    opacity: phase >= minPhase ? 1 : 0,
    transform: phase >= minPhase ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 1s ease, transform 1s ease',
  });

  return (
    <div
      className="h-screen flex flex-col items-center justify-center"
      style={{ background: SCENE_BG }}
    >
      {/* Vision portrait — fades in */}
      <div
        style={{
          width: 'min(420px, 32vw)',
          aspectRatio: '3/4',
          backgroundImage: `url(${vision.portraitAssetPath}), ${vision.portraitPlaceholder}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at center, black 30%, transparent 90%)',
          ...lineStyle(1),
          marginBottom: '3vh',
        }}
      />

      {/* Bond prose */}
      <p
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.2rem',
          color: `${sphereColor}99`,
          letterSpacing: '0.04em',
          textAlign: 'center',
          maxWidth: '600px',
          lineHeight: 1.7,
          ...lineStyle(2),
          marginBottom: '3vh',
        }}
      >
        {bondProse}
      </p>

      {/* Name + epithet */}
      <div style={{ ...lineStyle(3), textAlign: 'center' }}>
        {editingName ? (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${sphereColor}40`,
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              color: '#e8e0d0',
              textAlign: 'center',
              width: '400px',
              outline: 'none',
            }}
          />
        ) : (
          <h2
            onClick={() => setEditingName(true)}
            className="cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              color: '#e8e0d0',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
            title="Click to edit name"
          >
            {name}
          </h2>
        )}
        <p
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: 'var(--text-xs)',
            color: 'rgba(200,190,170,0.6)',
            letterSpacing: '0.04em',
          }}
        >
          {candidate.epithet}
        </p>
      </div>

      {/* Release button */}
      <button
        type="button"
        onClick={() => onComplete(name !== candidate.name ? name : undefined)}
        data-testid="bond-release"
        style={{
          ...lineStyle(4),
          marginTop: '4vh',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1rem',
          color: `${sphereColor}88`,
          background: 'transparent',
          border: `1px solid ${sphereColor}20`,
          padding: '12px 32px',
          borderRadius: '4px',
          cursor: 'pointer',
          letterSpacing: '0.06em',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${sphereColor}40`;
          e.currentTarget.style.color = `${sphereColor}cc`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${sphereColor}20`;
          e.currentTarget.style.color = `${sphereColor}88`;
        }}
      >
        {BOND_RELEASE_TEXT}
      </button>
    </div>
  );
}
