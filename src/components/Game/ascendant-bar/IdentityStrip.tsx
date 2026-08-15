import React from 'react';
import { SphereIcon } from '../../shared/SphereIcon';
import { Tooltip } from '../../shared/Tooltip';
import { getSphereColor } from '../../../data/sphereIcons';
import { quintessenceLine } from '../../../data/ascendant-bar-content';
import type { QuintessenceBand } from '../../../types/quintessence';
import type { AscendantIdentityView, QuintessenceView } from './selectors';
import styles from './styles.module.css';

const PORTRAIT_SIZE = 68;

/**
 * Layout shim for a `Tooltip` trigger (THR-1118).
 *
 * The shared `Tooltip` wraps its children in a bare `display: inline-block` span and
 * takes no style prop — deliberately, so callers cannot fork its trigger behaviour.
 * The bespoke `HoveredTerm` this replaced *did* take one, and two sites here relied on
 * it for flex layout (`flexShrink: 0` + `lineHeight: 0` on the portrait, `alignSelf`
 * on the name). Dropping those silently would let the portrait shrink inside the strip
 * row, so the layout moves onto an element we own and the tooltip keeps its own.
 */
function TooltipSlot({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return <span style={style}>{children}</span>;
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

  return (
    <button
      className={styles.identityStrip}
      onClick={onOpen}
      type="button"
      aria-label="Open ascendant sheet"
    >
      {/* Portrait: sphere sigil with band-responsive halo.
          The sphere is a registry concept, so the hover passes `sphere.<name>` and the
          raw enum never reaches the surface — the eyebrow that printed `Sphere · mind`
          went with the bespoke tooltip it belonged to (THR-1118, Laws 14 + 17). */}
      <TooltipSlot style={{ flexShrink: 0, lineHeight: 0 }}>
        <Tooltip id={`sphere.${identity.primarySphere}`}>
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
        </Tooltip>
      </TooltipSlot>

      {/* Name + archetype + quintessence word */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TooltipSlot style={{ alignSelf: 'flex-start' }}>
          <Tooltip id="ui.ascendant_name">
            <span
              className={styles.nameText}
              style={{
                textShadow: isTranscendent ? '0 0 14px rgba(244,241,232,0.35)' : undefined,
              }}
            >
              {identity.divineName}
            </span>
          </Tooltip>
        </TooltipSlot>

        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-tertiary)',
          marginTop: 1,
        }}>
          {/* The archetype *title* is generated flavour (96 sphere-keyed strings in
              ARCHETYPE_TITLES), not a concept with per-title meaning — so the concept
              `ui.ascendant_archetype` explains it and the title stays the trigger text.
              Routing `archetype.<title>` instead would dangle: that prefix resolves
              *narrative* archetypes (`tragic_hero`), a different vocabulary. THR-1118. */}
          <Tooltip id="ui.ascendant_archetype">
            <span>{identity.archetypeTitle}</span>
          </Tooltip>
          <span style={{ color: 'var(--border-medium)' }}>·</span>
          <Tooltip id={`quintessence.${band}`}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
              color: bandColor(band), letterSpacing: '0.06em', cursor: 'help',
            }} className={keywordAnimation(band, treatment)}>
              {lexiconWord}
            </span>
          </Tooltip>
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
