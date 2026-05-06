import type {
  ChipsSection,
  EventCardSection,
  PanelSection,
  PortraitSection,
  ProseSection,
  Section as DetailSection,
} from '../../types/detailPage';

function SectionLabel({ label, gold }: { label: string; gold: boolean }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: gold ? 'var(--accent-gold)' : 'var(--text-tertiary)',
        marginBottom: '6px',
        borderBottom: gold ? '1px solid var(--accent-gold-dim)' : 'none',
        paddingBottom: gold ? '2px' : 0,
      }}
    >
      {label}
    </div>
  );
}

function ProseSectionRenderer({ section }: { section: ProseSection }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <SectionLabel label={section.label} gold={section.gold} />
      <p
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

function ChipsSectionRenderer({ section }: { section: ChipsSection }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <SectionLabel label={section.label} gold={section.gold} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {section.chips.map((chip, index) => (
          <span
            key={`${chip.label}-${index}`}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: `1px solid var(--sphere-${chip.sphere ?? 'force'}-bright, var(--border-gold))`,
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-display)',
              cursor: chip.clickRef ? 'pointer' : 'default',
              letterSpacing: '0.04em',
            }}
          >
            {chip.label}
            {chip.flavour && (
              <em style={{ marginLeft: '4px', opacity: 0.7 }}>{chip.flavour}</em>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function EventCardSectionRenderer({ section }: { section: EventCardSection }) {
  return (
    <div
      style={{
        marginBottom: '20px',
        border: '1px solid var(--border-gold)',
        borderRadius: '6px',
        padding: '10px 12px',
        background: 'var(--bg-raised)',
      }}
    >
      <SectionLabel label={section.label} gold={section.gold} />
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
      <SectionLabel label={section.label} gold={section.gold} />
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
        <SectionLabel label={section.label} gold={section.gold} />
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
