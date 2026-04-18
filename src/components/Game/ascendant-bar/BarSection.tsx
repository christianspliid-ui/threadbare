import React, { type ReactNode } from 'react';
import styles from './styles.module.css';

interface BarSectionProps {
  label: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
  placeholder?: string;
}

export function BarSection({ label, count, open, onToggle, children, placeholder }: BarSectionProps) {
  const showBody = open && (children != null || placeholder != null);
  const isEmpty = count === 0 || children == null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button className={styles.sectionHeader} onClick={onToggle} type="button">
        <svg
          width="10" height="10" viewBox="0 0 10 10"
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
        >
          <path d="M3 2 L7 5 L3 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={styles.sectionLabel}>{label}</span>
        {count !== undefined && count > 0 && (
          <span className={styles.sectionCount}>· {count}</span>
        )}
        <div className={styles.sectionRule} />
      </button>

      {showBody && (
        isEmpty && placeholder ? (
          <div style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
            fontSize: 13, color: 'var(--text-muted)', paddingLeft: 18,
          }}>
            {placeholder}
          </div>
        ) : (
          <div className={styles.sectionBody}>{children}</div>
        )
      )}
    </div>
  );
}
