/**
 * BondStrip — a tie between two parties, drawn (THR-2097, dressing rule R4).
 *
 * Face, the bond mark, face, with the sentence under it. It draws only what the view model
 * hands it, and the view model sets a bond only while the engine holds the tie — no thread,
 * no strip. It adds no second art path (Law 3): the god's face is the src the VM read through
 * `ascendantPortraitSrc`, and the person's face is the src `resolveEntityVisual` gave at the
 * god's knowledge level (Law 8). A missing face draws its kind's mark, never an empty disc.
 *
 * See `Docs/design-system/component-selection.md` § BondStrip.
 */
import type { ReactNode } from 'react';
import type { BondStripVM } from '../../types/detailPage';
import type { IconName } from '../../data/icons/iconRegistry';
import { Icon } from './Icon';
import { Medallion, type MedallionSize } from './Medallion';

/** The face size in the strip (NFP #1): the medium medallion, 64px at 1080p. */
export const BOND_STRIP_MEDALLION: MedallionSize = 'md';

function Face({ name, src, fallbackIcon }: { name: string; src: string | null; fallbackIcon: IconName }) {
  return (
    <Medallion size={BOND_STRIP_MEDALLION} title={name} fallbackIcon={fallbackIcon}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : undefined}
    </Medallion>
  );
}

export function BondStrip({ bond, children }: { bond: BondStripVM; children?: ReactNode }) {
  return (
    <div data-bond-strip="" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Face name={bond.left.name} src={bond.left.src} fallbackIcon="signature" />
        <span style={{ color: 'var(--text-secondary)', display: 'inline-flex' }}>
          <Icon name="bond" size="list" decorative />
        </span>
        <Face name={bond.right.name} src={bond.right.src} fallbackIcon="person" />
      </div>
      {children}
    </div>
  );
}
