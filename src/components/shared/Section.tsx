import { useCallback, type MouseEvent } from 'react';
import type {
  ChipDescriptor,
  ChipsSection,
  EventCardSection,
  NodeRef,
  PanelSection,
  PortraitSection,
  ProseSection,
  Section as DetailSection,
} from '../../types/detailPage';
import {
  useDetailPageOpener,
  type OpenByRef,
} from '../../contexts/DetailPageOpenerContext';

function SectionLabel({ label, gold, tier }: { label: string; gold: boolean; tier?: string }) {
  // Notable / chronicle tiers add a thin gold underline (per plan §5.4). Routine
  // sections render with the default tertiary label.
  const decorate = tier === 'notable' || tier === 'chronicle';
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: gold ? 'var(--accent-gold)' : 'var(--text-tertiary)',
        marginBottom: '6px',
        borderBottom:
          gold || decorate ? '1px solid var(--accent-gold-dim, var(--border-gold))' : 'none',
        paddingBottom: gold || decorate ? '2px' : 0,
      }}
    >
      {label}
    </div>
  );
}

/**
 * Wrap "term" spans inside prose markup with click handlers that route through
 * the supplied `termRefs` map → `openByRef`. We render via dangerouslySetInnerHTML
 * (the prose system already produces sanitized markup), then attach delegated
 * click handlers in a span wrapper. This stays consistent with how the encounter
 * canonical doc §5.4 specifies keyword-tooltip wiring.
 */
function ProseSectionRenderer({ section }: { section: ProseSection }) {
  const open = useDetailPageOpener();
  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const term = target.closest('[data-term]') as HTMLElement | null;
      if (!term) return;
      const placeholder = term.getAttribute('data-term');
      if (!placeholder || !section.termRefs) return;
      const ref = section.termRefs[placeholder];
      if (ref && open) open(ref);
    },
    [open, section.termRefs],
  );

  return (
    <div style={{ marginBottom: '20px' }}>
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      <div
        onClick={handleClick}
        style={{
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          margin: 0,
          fontSize: '0.9rem',
        }}
        dangerouslySetInnerHTML={{ __html: section.prose }}
      />
    </div>
  );
}

function ChipPill({ chip, open }: { chip: ChipDescriptor; open: OpenByRef | undefined }) {
  const clickable = Boolean(chip.clickRef && open);
  const handleClick = () => {
    if (clickable && chip.clickRef && open) open(chip.clickRef);
  };
  return (
    <span
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      style={{
        padding: '3px 8px',
        borderRadius: '4px',
        border: `1px solid var(--sphere-${chip.sphere ?? 'force'}-bright, var(--border-gold))`,
        color: chip.sentiment === 'negative'
          ? 'var(--sphere-force-bright, #c0392b)'
          : chip.sentiment === 'positive'
            ? 'var(--sphere-life-bright, var(--accent-gold))'
            : 'var(--text-secondary)',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-display)',
        cursor: clickable ? 'pointer' : 'default',
        letterSpacing: '0.04em',
        userSelect: 'none',
      }}
    >
      {chip.label}
      {chip.flavour && <em style={{ marginLeft: '4px', opacity: 0.7 }}>{chip.flavour}</em>}
    </span>
  );
}

function ChipsSectionRenderer({ section }: { section: ChipsSection }) {
  const open = useDetailPageOpener();
  return (
    <div style={{ marginBottom: '20px' }}>
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {section.chips.map((chip, index) => (
          <ChipPill key={`${chip.label}-${index}`} chip={chip} open={open} />
        ))}
      </div>
    </div>
  );
}

function EventCardSectionRenderer({ section }: { section: EventCardSection }) {
  const open = useDetailPageOpener();
  const clickable = Boolean(open);
  const handleClick = () => {
    if (clickable && open) open(section.eventRef);
  };
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      style={{
        marginBottom: '20px',
        border: '1px solid var(--border-gold)',
        borderRadius: '6px',
        padding: '10px 12px',
        background: 'var(--bg-raised)',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      <div
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-display)',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}
      >
        {section.whenLabel}
      </div>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          lineHeight: 1.6,
          margin: 0,
          fontSize: '0.85rem',
        }}
      >
        {section.prose}
      </p>
    </div>
  );
}

function PanelSectionRenderer({ section }: { section: PanelSection }) {
  const sentimentColor = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') return 'var(--sphere-life-bright, var(--accent-gold))';
    if (sentiment === 'negative') return 'var(--sphere-force-bright, #c0392b)';
    return 'var(--text-secondary)';
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {section.rows.map((row, index) => (
          <div
            key={`${row.left}-${index}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 0',
              borderBottom: '1px solid var(--border-gold)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>{row.left}</span>
            <span style={{ color: sentimentColor(row.sentiment) }}>{row.right}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortraitSectionRenderer({ section }: { section: PortraitSection }) {
  return (
    <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
      <div
        style={{
          width: 180,
          height: 220,
          flexShrink: 0,
          background: 'var(--bg-deep)',
          border: '1px solid var(--border-gold)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {section.portraitRef.url ? (
          <img
            src={section.portraitRef.url}
            alt={section.portraitRef.subject}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            {section.portraitRef.subject}
          </span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
        {section.bodyProse && (
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, margin: 0, fontSize: '0.9rem' }}>
            {section.bodyProse}
          </p>
        )}
      </div>
    </div>
  );
}

export function Section({ section }: { section: DetailSection }) {
  switch (section.kind) {
    case 'prose':
      return <ProseSectionRenderer section={section} />;
    case 'chips':
      return <ChipsSectionRenderer section={section} />;
    case 'event-card':
      return <EventCardSectionRenderer section={section} />;
    case 'panel':
      return <PanelSectionRenderer section={section} />;
    case 'portrait':
      return <PortraitSectionRenderer section={section} />;
  }
}

// Re-export for convenience.
export type { NodeRef };
