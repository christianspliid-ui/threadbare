import type { CSSProperties } from 'react';
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
        return (
          <span key={`${crumb.label}-${index}`} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && <span style={chevronStyle}>›</span>}
            <span
              style={crumbStyle(clickable)}
              onClick={clickable ? () => onNavigate(crumb.stackIndex as number) : undefined}
            >
              {crumb.label.toUpperCase()}
            </span>
          </span>
        );
      })}
    </div>
  );
}
