import React, { useState } from 'react';
import { TRAY_EMPTY_COPY } from '../../../data/ascendant-bar-content';
import type { ActionTrayView, ActionTrayItem } from './selectors';
import styles from './styles.module.css';

const TIER_LABEL: Record<string, string> = { core: 'Core', self: 'Self', rare: 'Rare' };
const TIER_NOTE: Record<string, string> = {
  core: 'always available',
  self: 'reshape yourself',
  rare: 'seldom called',
};
const TIER_TINT: Record<string, string> = {
  core: 'var(--text-tertiary)',
  self: 'var(--accent-gold)',
  rare: 'var(--text-muted)',
};

const COST_COLOR: Record<string, string> = {
  grave:    'var(--negative, #c04040)',
  rare:     'var(--accent-gold)',
  free:     'var(--positive)',
};

interface ActionCardProps {
  item: ActionTrayItem;
  onFire?: (templateId: string) => void;
}

function ActionCard({ item, onFire }: ActionCardProps) {
  const { template, spent, gated } = item;
  const disabled = spent || gated;
  const cost = template.essenceCost > 0 ? `${template.essenceCost} essence` : 'turn';
  const costColor = COST_COLOR[cost] ?? 'var(--text-tertiary)';

  return (
    <button
      className={styles.actionRow}
      disabled={disabled}
      onClick={() => !disabled && onFire?.(template.id)}
      type="button"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
          color: 'var(--text-primary)', letterSpacing: '0.03em',
        }}>
          {template.name}
        </span>
        {template.description && (
          <span style={{
            fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}>
            {template.description}
          </span>
        )}
      </div>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 500,
        color: spent ? 'var(--text-muted)' : gated ? 'var(--text-muted)' : costColor,
        letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        {spent ? 'spent' : gated ? 'gated' : cost}
      </span>
    </button>
  );
}

interface ActionTierGroupProps {
  tier: 'core' | 'self' | 'rare';
  items: ActionTrayItem[];
  defaultOpen?: boolean;
  onFire?: (templateId: string) => void;
}

function ActionTierGroup({ tier, items, defaultOpen = true, onFire }: ActionTierGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const label = TIER_LABEL[tier];
  const tint = TIER_TINT[tier];
  const note = TIER_NOTE[tier];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        className={styles.actionGroupHeader}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <svg width="10" height="10" viewBox="0 0 10 10"
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          <path d="M3 2 L7 5 L3 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
          color: tint, textTransform: 'uppercase', letterSpacing: '0.22em',
        }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          · {items.length}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)',
          fontStyle: 'italic', marginLeft: 'auto',
        }}>{note}</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 14 }}>
          {items.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-muted)' }}>
              {TRAY_EMPTY_COPY[tier]}
            </div>
          ) : (
            items.map((item) => <ActionCard key={item.template.id} item={item} onFire={onFire} />)
          )}
        </div>
      )}
    </div>
  );
}

// ─── Core action buttons (Move + Investiture) ────────────────────────────────

interface CoreActionButtonProps {
  label: string;
  description: string;
  onClick?: () => void;
}

function CoreActionButton({ label, description, onClick }: CoreActionButtonProps) {
  return (
    <button
      className={styles.actionRow}
      onClick={onClick}
      type="button"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
          color: 'var(--text-primary)', letterSpacing: '0.03em',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-body)',
        }}>
          {description}
        </span>
      </div>
    </button>
  );
}

function CoreTierGroup({ onMove, onInvestiture }: { onMove?: () => void; onInvestiture?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        className={styles.actionGroupHeader}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <svg width="10" height="10" viewBox="0 0 10 10"
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          <path d="M3 2 L7 5 L3 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
          color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.22em',
        }}>Core</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          · 2
        </span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)',
          fontStyle: 'italic', marginLeft: 'auto',
        }}>always available</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 14 }}>
          <CoreActionButton label="Move" description="Navigate through the world" onClick={onMove} />
          <CoreActionButton label="Investiture" description="Manage your divine court" onClick={onInvestiture} />
        </div>
      )}
    </div>
  );
}

interface ActionsBlockProps {
  tray: ActionTrayView;
  onFire?: (templateId: string) => void;
  onMove?: () => void;
  onInvestiture?: () => void;
}

export function ActionsBlock({ tray, onFire, onMove, onInvestiture }: ActionsBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <CoreTierGroup onMove={onMove} onInvestiture={onInvestiture} />
      <ActionTierGroup tier="self" items={tray.self} defaultOpen={true} onFire={onFire} />
      <ActionTierGroup tier="rare" items={tray.rare} defaultOpen={false} onFire={onFire} />
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontStyle: 'italic',
        color: 'var(--text-muted)', lineHeight: 1.4,
        paddingTop: 6, borderTop: '1px dotted var(--border-subtle)',
      }}>
        Verbs that touch the world appear on the thing they touch.
      </div>
    </div>
  );
}
