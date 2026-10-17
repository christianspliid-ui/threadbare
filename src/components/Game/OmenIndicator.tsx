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
import { OmenMark } from './OmenMark';
import { Tooltip } from '../shared/Tooltip';
import { TOPBAR_LOCKED_SUFFIX, getUITooltip } from '../../data/ui-content';

function OmenLine({
  omen,
  isPrimary,
  currentTick,
}: {
  omen: ActiveOmen;
  isPrimary: boolean;
  currentTick: number;
}) {
  const template = getOmenTemplateById(omen.templateId);
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
        data-testid="omen-mark"
        style={{
          display: 'inline-flex',
          color,
          opacity: pulsing ? 0.5 : 1,
          transition: 'opacity 0.3s',
          flexShrink: 0,
        }}
      >
        <OmenMark omen={omen} currentTick={currentTick} />
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
  /**
   * THR-1814 — an encounter veil holds the top bar. The hover stays live and says the
   * panel opens when the chapter closes; a press opens nothing, because the panel
   * would sit beneath the veil's z-band.
   */
  locked?: boolean;
}

export function OmenIndicator({ omenState, currentTick, locked = false }: OmenIndicatorProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  if (!omenState?.primary) return null;

  const open = () => { if (!locked) setDetailOpen(true); };
  // THR-1814: the registry's `ui.omen` explains the term (Law 17); the live omen's
  // name rides in the label override.
  const baseDesc = getUITooltip('ui.omen')?.desc;
  const lockedDesc = locked && baseDesc ? `${baseDesc} ${TOPBAR_LOCKED_SUFFIX}` : undefined;

  return (
    <>
      <Tooltip id="ui.omen" label={`Omen — ${omenState.primary.name}`} desc={lockedDesc} focusable={false}>
      <div
        role="button"
        tabIndex={0}
        aria-label="View world omen details"
        aria-disabled={locked || undefined}
        onClick={open}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
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
        <OmenLine omen={omenState.primary} isPrimary currentTick={currentTick} />
        {omenState.secondary && (
          <OmenLine omen={omenState.secondary} isPrimary={false} currentTick={currentTick} />
        )}
      </div>
      </Tooltip>

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
