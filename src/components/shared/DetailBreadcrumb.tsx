import type { CSSProperties, KeyboardEvent } from 'react';
import { DETAIL_BREADCRUMB_COLLAPSE_AT } from '../../types/detailPage';

interface DetailBreadcrumbProps {
  trail: string[];
  onNavigate: (stackIndex: number) => void;
}

interface CrumbDescriptor {
  label: string;
  stackIndex: number | null;
}

function toCrumbs(trail: string[]): CrumbDescriptor[] {
  if (trail.length <= DETAIL_BREADCRUMB_COLLAPSE_AT) {
    return trail.map((label, index) => ({
      label,
      stackIndex: index - 1,
    }));
  }

  const keep = DETAIL_BREADCRUMB_COLLAPSE_AT - 1;
  const collapseCount = trail.length - keep;
  return [
    { label: '…', stackIndex: null },
    ...trail.slice(collapseCount).map((label, index) => ({
      label,
      stackIndex: collapseCount + index - 1,
    })),
  ];
}

export function DetailBreadcrumb({ trail, onNavigate }: DetailBreadcrumbProps) {
  const crumbs = toCrumbs(trail);
  const chevronStyle: CSSProperties = {
    margin: '0 4px',
    opacity: 0.4,
    userSelect: 'none',
  };

  const crumbStyle = (clickable: boolean): CSSProperties => ({
    cursor: clickable ? 'pointer' : 'default',
    color: clickable ? 'var(--text-secondary)' : 'var(--text-tertiary)',
    textDecoration: 'none',
    fontSize: '0.7rem',
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-display)',
    textTransform: 'uppercase',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0,
        marginBottom: '6px',
      }}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const clickable = !isLast && crumb.stackIndex !== null;
        const navigate = clickable ? () => onNavigate(crumb.stackIndex as number) : undefined;
        return (
          <span key={`${crumb.label}-${index}`} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && <span style={chevronStyle}>›</span>}
            {/*
              Law 23 (THR-1504): a navigable crumb is a control, so it carries the
              button affordances a keyboard player needs — `role="button"`, a tab stop,
              and Enter *and* Space (both promised by the role; Space is also page-scroll
              by default, so it is prevented once the crumb claims it). `tabIndex={0}` is
              also what puts the crumb inside `FOCUSABLE_SELECTOR`, so the detail panel's
              Law 50 trap (THR-1024) cycles through it instead of skipping the one control
              that jumps back several levels at once.

              The last crumb and the collapsed `…` are deliberately inert: no role and no
              tab stop, so the trail is no noisier to Tab through than it is to use
              (Law 25 — a control that does nothing does not render as a control).

              `.focus-ring` is the sanctioned focus treatment (Law 23; THR-1010): the ring
              shows on `:focus-visible` and is never suppressed.
            */}
            <span
              style={crumbStyle(clickable)}
              {...(navigate
                ? {
                    className: 'focus-ring',
                    role: 'button',
                    tabIndex: 0,
                    onClick: navigate,
                    onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate();
                      }
                    },
                  }
                : {})}
            >
              {crumb.label.toUpperCase()}
            </span>
          </span>
        );
      })}
    </div>
  );
}
