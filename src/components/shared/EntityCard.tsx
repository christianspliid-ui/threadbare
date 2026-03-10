import React from 'react';
import type { EntityHeader, EntitySection, StructuredBlock } from '../../types/entityDetail';

interface EntityCardProps {
  header: EntityHeader;
  sections: EntitySection[];
  onBack: () => void;
  onViewCodex: () => void;
  onZoomToLocation?: (locationId: string) => void;
}

/**
 * Generic sidebar card component for entities (agents, cultures, factions, armies, parties).
 * Renders entity header + array of sections with optional structured data.
 */
export const EntityCard = React.memo(function EntityCard({
  header,
  sections,
  onBack,
  onViewCodex,
  onZoomToLocation,
}: EntityCardProps) {
  const renderStructuredBlock = (block: StructuredBlock): React.ReactNode => {
    switch (block.type) {
      case 'member_list':
        return (
          <div className="space-y-1">
            {block.members.map((member) => (
              <div
                key={member.id}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  paddingLeft: '0.75rem',
                  borderLeft: `2px solid ${header.accentColor}40`,
                }}
              >
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {member.name}
                </div>
                {member.role && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {member.role}
                    {member.tier && ` (Tier ${member.tier})`}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'keyword_cloud':
        return (
          <div className="flex flex-wrap gap-1.5">
            {block.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 rounded-sm font-medium"
                style={{
                  fontSize: 'var(--text-xs)',
                  backgroundColor: `${block.accent}20`,
                  color: block.accent,
                  border: `1px solid ${block.accent}40`,
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        );

      case 'territory_summary':
        return (
          <div className="space-y-1">
            {block.locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  paddingLeft: '0.75rem',
                  borderLeft: `2px solid ${header.accentColor}40`,
                }}
              >
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {location.name}
                  </div>
                  {location.biome && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                      {location.biome}
                    </div>
                  )}
                </div>
                {onZoomToLocation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomToLocation(location.id);
                    }}
                    aria-label={`Zoom to ${location.name}`}
                    className="flex-shrink-0 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--accent-gold-dim)', fontSize: 'var(--text-xs)', lineHeight: 1 }}
                    title={`Zoom to ${location.name}`}
                  >
                    &#x1F441;
                  </button>
                )}
              </div>
            ))}
          </div>
        );

      case 'trait_grid':
        return (
          <div className="flex flex-wrap gap-1.5">
            {block.traits.map((trait, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 rounded-sm font-medium"
                style={{
                  fontSize: 'var(--text-xs)',
                  backgroundColor: 'var(--bg-raised)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
                title={trait.category ? `Category: ${trait.category}` : undefined}
              >
                {trait.name}
              </span>
            ))}
          </div>
        );

      case 'bond_list':
        return (
          <div className="space-y-1">
            {block.bonds.map((bond, idx) => {
              const sentimentColor =
                bond.sentiment === 'positive' ? 'text-green-400/70' : 'text-red-400/70';
              return (
                <div key={idx} className={`${sentimentColor}`} style={{ fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
                    {bond.name}
                  </span>
                  {' — '}
                  <span style={{ color: 'inherit' }}>{bond.strength}</span>
                </div>
              );
            })}
          </div>
        );

      case 'domain_grid':
        return (
          <div className="space-y-1">
            {block.domains.map((domain, idx) => (
              <div key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{domain.word}</span>
                {' in '}
                <span className="underline decoration-dotted cursor-help" style={{ color: 'var(--text-primary)' }}>
                  {domain.domain}
                </span>
              </div>
            ))}
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-1.5">
            {block.events.map((event, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  paddingLeft: '0.75rem',
                  borderLeft: `2px solid ${header.accentColor}40`,
                }}
              >
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {event.label}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Tick {event.tick}</div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={onBack}
          aria-label="back"
          className="transition-colors text-lg px-1"
          style={{ color: 'var(--accent-gold)', fontSize: '1.1875rem' }}
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className="font-semibold tracking-wide truncate"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {header.name}
            </h2>
            <button
              onClick={onViewCodex}
              className="flex-shrink-0 transition-opacity hover:opacity-70"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-gold)',
              }}
              aria-label={`Open full codex for ${header.name}`}
            >
              Codex →
            </button>
          </div>
          {header.subtitle && (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              {header.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Icon/Flag */}
      {header.iconSvg && (
        <div
          className="flex justify-center py-3 flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-raised)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="entity-icon"
            style={{
              width: '2.5rem',
              height: '2.5rem',
            }}
            dangerouslySetInnerHTML={{ __html: header.iconSvg }}
          />
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <h3
              className="font-semibold tracking-wider uppercase mb-2"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {section.title}
            </h3>
            <p
              className={section.proseVoice === 'oral' ? 'italic' : ''}
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
              }}
            >
              {section.prose}
            </p>
            {section.structuredData && (
              <div className="mt-2.5">
                {renderStructuredBlock(section.structuredData)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer: prominent View Codex button */}
      <div
        className="flex gap-2 px-4 py-4 flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={onViewCodex}
          className="flex-1 px-4 py-3 font-semibold rounded-lg transition-all"
          style={{
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-display)',
            backgroundColor: header.accentColor,
            color: 'var(--bg-abyss, #0a0a0e)',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          View Full Codex
        </button>
      </div>
    </div>
  );
});

EntityCard.displayName = 'EntityCard';
