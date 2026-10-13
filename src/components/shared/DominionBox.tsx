/**
 * DominionBox — the god's band on a sheet (THR-1750 § U5).
 *
 * One component, two shapes:
 * - `box` (place, faction, artifact pages): copies the Livelihood box — header
 *   "Dominion", the band word in the god's sphere colour (Hostile in `--negative`),
 *   the band line, and on a place page the tend line.
 * - `row` (mortal sheet, after *Attuned to*): "Dominion" label, band word, line.
 *
 * Reads a prepared `DominionSheetVM` (THR-1822 seam) and never the graph. A null VM
 * renders nothing (no god, or an object the read does not answer for).
 * Law 13: a word, never the match number. Law 17: both tooltips come from the registry.
 */
import { memo } from 'react';
import { Tooltip } from './Tooltip';
import type { DominionSheetVM } from '../../engine/dominionViewModels';
import { DOMINION_BOX_HEADER } from '../../data/dominion-ui-content';

export interface DominionBoxProps {
  vm: DominionSheetVM | null;
  variant?: 'box' | 'row';
  /** Drop the page margins — for a box inside a modal sheet's own padding. */
  flush?: boolean;
}

export const DominionBox = memo(function DominionBox({ vm, variant = 'box', flush = false }: DominionBoxProps) {
  if (!vm) return null;

  const word = (
    <Tooltip id={vm.tooltipId}>
      <span data-dominion-band={vm.band} style={{ color: vm.sphereColorVar, fontWeight: 600 }}>{vm.word}</span>
    </Tooltip>
  );

  if (variant === 'row') {
    return (
      <div className="flex items-baseline gap-2 pt-1 text-xs" data-testid="dominion-row">
        <Tooltip id={vm.headerTooltipId}>
          <span style={{ color: 'var(--accent-gold)' }}>{DOMINION_BOX_HEADER}</span>
        </Tooltip>
        {word}
        <span style={{ color: 'var(--text-muted)' }}>· {vm.line}</span>
      </div>
    );
  }

  return (
    <div className={flush ? '' : 'mx-6 mt-3'} style={{ maxWidth: '820px' }} data-testid="dominion-box">
      <div
        className="rounded-lg border px-4 py-3"
        style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-gold)' }}
      >
        <p
          className="uppercase"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.5px',
            marginBottom: '0.35rem',
          }}
        >
          <Tooltip id={vm.headerTooltipId}>{DOMINION_BOX_HEADER}</Tooltip>
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {word}. {vm.line}{vm.tendLine ? ` ${vm.tendLine}` : ''}
        </p>
      </div>
    </div>
  );
});
