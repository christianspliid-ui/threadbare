import { useCallback, type MouseEvent } from 'react';
import type {
  CardsSection,
  ChipDescriptor,
  ChipsSection,
  EventCardSection,
  LinksSection,
  NodeRef,
  PanelRow,
  PanelSection,
  PortraitSection,
  ProseSection,
  Section as DetailSection,
  TriggersSection,
} from '../../types/detailPage';
import { Chip } from './Chip';
import { OddsPips } from './OddsPips';
import {
  useDetailPageOpener,
  type OpenByRef,
} from '../../contexts/DetailPageOpenerContext';
import { Tooltip } from './Tooltip';

function SectionLabel({ label, gold, tier }: { label: string; gold: boolean; tier?: string }) {
  // Notable / chronicle tiers add a thin gold underline (per plan §5.4). Routine
  // sections render with the default tertiary label.
  const decorate = tier === 'notable' || tier === 'chronicle';
  return (
    <div
      data-section-label=""
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 'var(--text-xs)',
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

  // THR-1876: a blank line separates paragraphs, so a moved multi-paragraph block (the
  // land page's prose) keeps its paragraphs. A one-paragraph section renders as before.
  const paragraphs = section.prose.split(/\n\n+/);
  const variant = section.variant ?? 'body';
  const style = {
    color: variant === 'quote' ? 'var(--text-secondary)' : 'var(--text-primary)',
    lineHeight: 1.7,
    margin: 0,
    fontSize: variant === 'lede' ? 'var(--text-base)' : '0.9rem',
    fontStyle: variant === 'quote' ? ('italic' as const) : undefined,
  };
  return (
    <div style={{ marginBottom: '20px' }} data-section-shape="prose">
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      {paragraphs.length === 1 ? (
        <div onClick={handleClick} style={style} dangerouslySetInnerHTML={{ __html: section.prose }} />
      ) : (
        <div onClick={handleClick} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paragraphs.map((para, index) => (
            <p key={index} style={style} dangerouslySetInnerHTML={{ __html: para }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChipPill({ chip, open }: { chip: ChipDescriptor; open: OpenByRef | undefined }) {
  const clickable = Boolean(chip.clickRef && open);
  const handleClick = () => {
    if (clickable && chip.clickRef && open) open(chip.clickRef);
  };
  const pill = (
    <span
      {...(chip.dataKey ? { [`data-${chip.dataKey.attribute}`]: chip.dataKey.value } : {})}
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
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {chip.label}
      {chip.flavour && <em style={{ marginLeft: '4px', opacity: 0.7 }}>{chip.flavour}</em>}
    </span>
  );

  // A chip that names a *concept* explains itself on hover (Law 17). The wrapper sets
  // `focusable={false}` because the pill already owns its own tab stop when it is
  // clickable, and a second one around the same box is two focus rings for one thing.
  if (!chip.tooltipId) return pill;
  return (
    <Tooltip id={chip.tooltipId} focusable={!clickable}>
      {pill}
    </Tooltip>
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
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
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
              alignItems: 'center',
              gap: '12px',
              padding: '4px 0',
              borderBottom: '1px solid var(--border-gold)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>{row.left}</span>
            <PanelValue row={row} color={sentimentColor(row.sentiment)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A facts row's value (THR-1876 § D6). A row naming a world thing is an identity chip
 * (Law 1, 21); a row with a proportion draws a bar beside its word — the word is always
 * there, never a numeral (Law 13); a row with a tooltip explains itself (Law 17).
 */
function PanelValue({ row, color }: { row: PanelRow; color: string }) {
  const word = row.ref ? (
    <Chip role="identity" size="sm" target={row.ref} label={row.right} tooltipId={row.tooltipId ?? row.ref.tooltipId} />
  ) : (
    <span style={{ color }}>{row.right}</span>
  );
  const withTip = row.tooltipId && !row.ref ? <Tooltip id={row.tooltipId}>{word}</Tooltip> : word;
  if (row.meter == null || !Number.isFinite(row.meter)) return withTip;
  const fill = Math.max(0, Math.min(1, row.meter));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {withTip}
      <span
        aria-hidden="true"
        data-meter=""
        style={{ width: '4rem', height: '4px', borderRadius: '2px', background: 'var(--bg-deep)', overflow: 'hidden' }}
      >
        <span style={{ display: 'block', width: `${fill * 100}%`, height: '100%', background: 'var(--text-secondary)' }} />
      </span>
    </span>
  );
}

/**
 * Links — named world things, each an identity chip and one plain fact (THR-1876 § D6).
 * The shape Connections and *In this land* render through. A grouped section shows each
 * group under its own label and count.
 */
function LinksSectionRenderer({ section }: { section: LinksSection }) {
  const groups = section.groups ?? [{ label: '', rows: section.rows, total: section.rows.length }];
  return (
    <div style={{ marginBottom: '20px' }} data-section-shape="links">
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      {groups.map((group, gi) => (
        <div key={`${group.label}-${gi}`} style={{ marginBottom: '8px' }}>
          {group.label && (
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {group.total > 1 ? `${group.label} · ${group.total}` : group.label}
            </div>
          )}
          <LinkRows rows={group.rows} />
        </div>
      ))}
    </div>
  );
}

/** The rows of one links group: chip, then its fact. Shared with the Inspector's Connections block. */
export function LinkRows({ rows }: { rows: LinksSection['rows'] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {rows.map((row) => (
        <li
          key={`${row.ref.kind}:${row.ref.id}`}
          data-link-row={`${row.ref.kind}:${row.ref.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, fontSize: '0.8rem' }}
        >
          <Chip role="identity" size="sm" target={row.ref} label={row.name} tooltipId={row.ref.tooltipId} />
          {row.fact && <span style={{ color: 'var(--text-tertiary)', minWidth: 0, overflowWrap: 'anywhere' }}>{row.fact}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Cards — small tiles for conditions, works and powers (THR-1876 § D6). */
function CardsSectionRenderer({ section }: { section: CardsSection }) {
  return (
    <div style={{ marginBottom: '20px' }} data-section-shape="cards">
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '8px' }}>
        {section.tiles.map((tile, index) => (
          <div
            key={`${tile.title}-${index}`}
            style={{ border: '1px solid var(--border-gold)', borderRadius: '6px', padding: '8px 10px', background: 'var(--bg-raised)', minWidth: 0 }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 700 }}>{tile.kindWord}</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, overflowWrap: 'anywhere' }}>
              {tile.ref ? <Chip role="identity" size="sm" target={tile.ref} label={tile.title} /> : tile.title}
            </div>
            {tile.lines.map((line, li) => (
              <div key={li} style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>{line}</div>
            ))}
            {tile.durationWord && <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{tile.durationWord}</div>}
            {tile.meter != null && Number.isFinite(tile.meter) && (
              <div aria-hidden="true" data-meter="" style={{ marginTop: '4px', height: '4px', borderRadius: '2px', background: 'var(--bg-deep)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(0, Math.min(1, tile.meter)) * 100}%`, height: '100%', background: 'var(--text-secondary)' }} />
              </div>
            )}
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

/**
 * Triggers — what an item does on its own, and how likely it is to do it (THR-1492).
 *
 * Moved here verbatim from `EntityCard`'s `trigger` block when that model retired. The
 * odds stay pips: Law 15 gives a probability a language, and the pips row annotates the
 * condition it belongs to rather than replacing it.
 */
function TriggersSectionRenderer({ section }: { section: TriggersSection }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <SectionLabel label={section.label} gold={section.gold} tier={section.tier} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} data-testid="trigger-block">
        {section.triggers.map((trigger, index) => (
          <div key={`${trigger.condition}-${index}`} style={{ fontSize: '0.8rem' }}>
            <div
              style={{
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{trigger.condition}</span>
              <OddsPips value={trigger.probability} data-testid="trigger-odds-pips" />
            </div>
            {trigger.narrativeTemplate && (
              <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                {trigger.narrativeTemplate}
              </div>
            )}
            <div style={{ color: 'var(--text-secondary)' }}>→ {trigger.effectSummary}</div>
          </div>
        ))}
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
    case 'triggers':
      return <TriggersSectionRenderer section={section} />;
    case 'links':
      return <LinksSectionRenderer section={section} />;
    case 'cards':
      return <CardsSectionRenderer section={section} />;
  }
}

/**
 * The section label treatment, exported since THR-1492 so a sheet that needs a labelled
 * container of its own JSX (rather than a data-driven `Section`) draws the same label
 * rather than forking one — Law 27, one rule in one place. `FactionSheet` is the first
 * caller; its local fork was the measured drift.
 */
export { SectionLabel };

// Re-export for convenience.
export type { NodeRef };
