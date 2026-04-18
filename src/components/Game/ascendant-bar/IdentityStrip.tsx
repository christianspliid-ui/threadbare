import React, { useState, useRef } from 'react';
import { SphereIcon } from '../../shared/SphereIcon';
import { getSphereColor } from '../../../data/sphereIcons';
import { BAND_TOOLTIP, ARCHETYPE_COPY, SPHERE_COPY, quintessenceLine } from '../../../data/ascendant-bar-content';
import type { QuintessenceBand } from '../../../types/quintessence';
import type { SphereName } from '../../../types';
import type { AscendantIdentityView, QuintessenceView } from './selectors';
import styles from './styles.module.css';

const PORTRAIT_SIZE = 68;
const TOOLTIP_DELAY_MS = 450;

function useDelayedHover(delayMs: number) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = () => {
    timerRef.current = setTimeout(() => setShow(true), delayMs);
  };
  const onMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };
  return { show, onMouseEnter, onMouseLeave };
}

interface TermTooltipProps {
  eyebrow?: string;
  title: string;
  body: string;
  tint?: string;
}

function TermTooltip({ eyebrow, title, body, tint }: TermTooltipProps) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', left: 0,
      width: 260, padding: '10px 12px',
      background: 'rgba(17,17,20,0.97)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border-subtle)',
      borderLeft: `2px solid ${tint ?? 'var(--accent-gold)'}`,
      borderRadius: 6,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      zIndex: 40, pointerEvents: 'none',
    }}>
      {eyebrow && (
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
          color: tint ?? 'var(--text-tertiary)', textTransform: 'uppercase',
          letterSpacing: '0.18em', marginBottom: 4,
        }}>{eyebrow}</div>
      )}
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
        letterSpacing: '0.06em', color: 'var(--text-primary)', marginBottom: 6,
      }}>{title}</div>
      <div style={{
        fontFamily: 'var(--font-body)', fontStyle: 'italic',
        fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)',
      }}>{body}</div>
    </div>
  );
}

interface HoveredTermProps {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  tint?: string;
  style?: React.CSSProperties;
}

function HoveredTerm({ children, eyebrow, title, body, tint, style }: HoveredTermProps) {
  const { show, onMouseEnter, onMouseLeave } = useDelayedHover(TOOLTIP_DELAY_MS);
  return (
    <span
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      {children}
      {show && <TermTooltip eyebrow={eyebrow} title={title} body={body} tint={tint} />}
    </span>
  );
}

function bandColor(band: QuintessenceBand): string {
  switch (band) {
    case 'transcendent': return '#f4f1e8';
    case 'healthy':      return 'var(--text-primary)';
    case 'strained':     return 'var(--text-secondary)';
    case 'weakened':     return 'var(--text-secondary)';
    case 'critical':     return 'var(--warning, #e8a030)';
    case 'dissolving':   return 'var(--negative, #c04040)';
  }
}

function haloAnimation(band: QuintessenceBand): string {
  switch (band) {
    case 'transcendent': return styles.haloBloom;
    case 'healthy':      return styles.haloBreathe;
    case 'strained':     return styles.haloBreathe;
    case 'weakened':     return styles.haloBreatheWeak;
    case 'critical':     return styles.haloWarn;
    case 'dissolving':   return styles.haloFlicker;
  }
}

function keywordAnimation(band: QuintessenceBand, treatment: 'breathe' | 'flicker' = 'breathe'): string | undefined {
  if (band === 'weakened') return styles.keywordBreathe;
  if (band === 'critical') return treatment === 'flicker' ? styles.keywordFlicker : styles.keywordBreatheFast;
  if (band === 'dissolving') return treatment === 'flicker' ? styles.keywordFlickerFast : styles.keywordBreatheFastest;
  return undefined;
}

function portraitFilter(band: QuintessenceBand): string | undefined {
  switch (band) {
    case 'dissolving':  return 'grayscale(0.4) brightness(0.75) contrast(0.95)';
    case 'critical':    return 'brightness(0.85) saturate(0.85) sepia(0.15)';
    case 'weakened':    return 'brightness(0.9) saturate(0.85)';
    case 'transcendent': return 'brightness(1.1) saturate(1.1)';
    default:            return undefined;
  }
}

interface HaloSpec {
  color: string;
  opacity: number;
  blur: number;
  ringWidth: number;
}

function haloSpec(band: QuintessenceBand, sphereColor: string): HaloSpec {
  switch (band) {
    case 'transcendent': return { color: '#f4f1e8',         opacity: 0.85, blur: 22, ringWidth: 2 };
    case 'healthy':      return { color: sphereColor,       opacity: 0.55, blur: 14, ringWidth: 1.5 };
    case 'strained':     return { color: sphereColor,       opacity: 0.38, blur: 10, ringWidth: 1.2 };
    case 'weakened':     return { color: sphereColor,       opacity: 0.28, blur: 8,  ringWidth: 1 };
    case 'critical':     return { color: 'var(--warning, #e8a030)', opacity: 0.55, blur: 10, ringWidth: 1.2 };
    case 'dissolving':   return { color: 'var(--negative, #c04040)', opacity: 0.45, blur: 6, ringWidth: 0.8 };
  }
}

interface IdentityStripProps {
  identity: AscendantIdentityView;
  quintessence: QuintessenceView;
  treatment?: 'breathe' | 'flicker';
  onOpen: () => void;
}

export function IdentityStrip({ identity, quintessence, treatment = 'breathe', onOpen }: IdentityStripProps) {
  const { band, lexiconWord } = quintessence;
  const sphereColor = getSphereColor(identity.primarySphere);
  const spec = haloSpec(band, sphereColor);
  const isTranscendent = band === 'transcendent';

  const sphereCopy = SPHERE_COPY[identity.primarySphere as SphereName];
  const archCopy = ARCHETYPE_COPY[identity.archetypeTitle];
  const bandInfo = BAND_TOOLTIP[band];

  return (
    <button
      className={styles.identityStrip}
      onClick={onOpen}
      type="button"
      aria-label="Open ascendant sheet"
    >
      {/* Portrait: sphere sigil with band-responsive halo */}
      <HoveredTerm
        eyebrow={`Sphere · ${identity.primarySphere}`}
        title={sphereCopy?.label ?? identity.primarySphere}
        body={sphereCopy?.role ?? 'A sphere of essence — the substrate through which you act.'}
        tint={sphereColor}
        style={{ flexShrink: 0, lineHeight: 0 }}
      >
        <div className={styles.portraitFrame}>
          {/* Radial glow */}
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            background: `radial-gradient(circle, ${spec.color}, transparent 65%)`,
            opacity: spec.opacity,
            filter: `blur(${spec.blur}px)`,
            pointerEvents: 'none',
          }} className={haloAnimation(band)} />
          {/* Sharp ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `${spec.ringWidth}px solid ${spec.color}`,
            opacity: Math.min(1, spec.opacity + 0.3),
            boxShadow: isTranscendent
              ? `0 0 18px ${spec.color}, inset 0 0 10px ${spec.color}`
              : `0 0 ${spec.blur / 2}px ${spec.color}`,
            pointerEvents: 'none',
          }} />
          {/* Inner well */}
          <div className={styles.portraitInner}>
            {identity.portraitSrc ? (
              <img
                src={identity.portraitSrc}
                alt={identity.divineName}
                className={styles.portraitImg}
                style={{ filter: portraitFilter(band) }}
              />
            ) : (
              <div style={{ position: 'relative', lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <SphereIcon sphere={identity.primarySphere} size={PORTRAIT_SIZE - 20} />
              </div>
            )}
          </div>
        </div>
      </HoveredTerm>

      {/* Name + archetype + quintessence word */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <HoveredTerm
          eyebrow="Name"
          title={identity.divineName}
          body="Your name carries the shape of what you were. Click to open the full sheet."
          tint="var(--accent-gold)"
          style={{ alignSelf: 'flex-start' }}
        >
          <span
            className={styles.nameText}
            style={{
              textShadow: isTranscendent ? '0 0 14px rgba(244,241,232,0.35)' : undefined,
            }}
          >
            {identity.divineName}
          </span>
        </HoveredTerm>

        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-tertiary)',
          marginTop: 1,
        }}>
          <HoveredTerm
            eyebrow="Archetype"
            title={identity.archetypeTitle}
            body={archCopy?.body ?? 'An archetype — the shape of how this ascendant meets the world.'}
            tint="var(--accent-gold)"
          >
            <span>{identity.archetypeTitle}</span>
          </HoveredTerm>
          <span style={{ color: 'var(--border-medium)' }}>·</span>
          <HoveredTerm
            eyebrow={`Quintessence · ${bandInfo.label}`}
            title={lexiconWord}
            body={bandInfo.body}
            tint={bandColor(band)}
          >
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
              color: bandColor(band), letterSpacing: '0.06em', cursor: 'help',
            }} className={keywordAnimation(band, treatment)}>
              {lexiconWord}
            </span>
          </HoveredTerm>
        </div>

        {identity.epithet && (
          <div style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
            fontSize: 12, color: 'var(--text-muted)', marginTop: 3,
            letterSpacing: '0.01em', lineHeight: 1.35,
          }}>
            {quintessenceLine(identity.primarySphere, band)}
          </div>
        )}
      </div>
    </button>
  );
}
