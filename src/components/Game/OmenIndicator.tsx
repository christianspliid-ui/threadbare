/**
 * OmenIndicator — compact top-bar widget showing active world omens.
 * Click to open OmenDetail flyout.
 * THR-19
 *
 * Position: top-bar, center-left group, after DoomBar.
 */

import { useState, useRef, useEffect } from 'react';
import type { OmenState, ActiveOmen } from '../../types/omen';
import { getOmenTemplateById } from '../../data/omenTemplates';
import { getSphereColor } from '../../data/sphereIcons';
import { OmenDetail } from './OmenDetail';

const OMEN_CATEGORY_GLYPHS: Record<string, string> = {
  doom_echo: '⊘',
  sphere_surge: '◈',
  cultural: '⬡',
  seasonal: '◇',
};

function OmenLine({
  omen,
  isPrimary,
}: {
  omen: ActiveOmen;
  isPrimary: boolean;
}) {
  const template = getOmenTemplateById(omen.templateId);
  const glyph = OMEN_CATEGORY_GLYPHS[omen.category] ?? '◇';
  const color = omen.sphere ? getSphereColor(omen.sphere) : '#a0956b';

  // Pulse on omen change
  const prevRef = useRef(omen.templateId);
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (prevRef.current !== omen.templateId) {
      prevRef.current = omen.templateId;
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(t);
    }
  }, [omen.templateId]);

  if (!template) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span
        style={{
          color,
          fontSize: isPrimary ? '11px' : '10px',
          opacity: pulsing ? 0.5 : 1,
          transition: 'opacity 0.3s',
          flexShrink: 0,
        }}
      >
        {glyph}
      </span>
      <span
        style={{
          fontSize: isPrimary ? '11px' : '10px',
          color: isPrimary ? 'var(--text-secondary)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: isPrimary ? '130px' : '90px',
        }}
      >
        {omen.name}
      </span>
      {isPrimary && template.tagline && (
        <>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', flexShrink: 0 }}>—</span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '160px',
            }}
          >
            &ldquo;{template.tagline}&rdquo;
          </span>
        </>
      )}
    </div>
  );
}

interface OmenIndicatorProps {
  omenState: OmenState | undefined;
  currentTick: number;
}

export function OmenIndicator({ omenState, currentTick }: OmenIndicatorProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  if (!omenState?.primary) return null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="View world omen details"
        title={`Active omen: ${omenState.primary.name}. Click for details.`}
        onClick={() => setDetailOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
        className="topbar-tier"
        style={{
          cursor: 'pointer',
          minWidth: 0,
          maxWidth: '340px',
          transition: 'opacity var(--anim-fast) ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.opacity = '0.85';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
        }}
      >
        <span className="topbar-section-label">Omen</span>
        <OmenLine omen={omenState.primary} isPrimary />
        {omenState.secondary && (
          <OmenLine omen={omenState.secondary} isPrimary={false} />
        )}
      </div>

      {detailOpen && (
        <OmenDetail
          omenState={omenState}
          currentTick={currentTick}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
}
