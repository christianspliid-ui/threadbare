import React, { useMemo } from 'react';
import { Modal } from '../shared/Modal';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';
import type { FactionDefinition, FactionRankTier } from '../../types/faction';
import { REACH_DOMAINS } from '../../types/traits';

interface FactionSheetProps {
  factionId: string;
  name: string;
  onClose: () => void;
}

export const FactionSheet = React.memo(function FactionSheet({ factionId, name, onClose }: FactionSheetProps) {
  const definition = useMemo(() => {
    // Extract defId from factionId: "faction_def_{defId}" or "faction_def_{defId}_{suffix}"
    const match = factionId.match(/^faction_def_(.+?)(?:_\d+)?$/);
    if (!match) return undefined;
    return FACTION_DEFINITIONS.get(match[1]);
  }, [factionId]);

  if (!definition) {
    return (
      <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
        <Modal.Header onClose={onClose}>{name}</Modal.Header>
        <Modal.Body>
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-4)' }}>
            Faction data unavailable.
          </p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} aria-label={`${name} profile`}>
      <Modal.Header onClose={onClose}>
        <span style={{ color: definition.themeColor }}>{definition.iconGlyph}</span>{' '}
        {name}
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Description */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {definition.description}
          </p>

          {/* Motto */}
          {definition.motto && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              &ldquo;{definition.motto}&rdquo;
            </p>
          )}

          {/* Type badge */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: `${definition.themeColor}26`,
                border: `1px solid ${definition.themeColor}66`,
                color: definition.themeColor,
                textTransform: 'capitalize',
              }}
            >
              {definition.factionType}
            </span>
          </div>

          {/* Rank Tiers */}
          <Section title="Ranks">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {definition.rankTiers.map((tier: FactionRankTier) => (
                <div key={tier.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{tier.name}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    rep {(tier.minReputation * 100).toFixed(0)}%+
                    {tier.maxSlots != null ? ` (${tier.maxSlots} slot${tier.maxSlots !== 1 ? 's' : ''})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Reach Weights */}
          <Section title="Domain Focus">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {REACH_DOMAINS
                .filter(d => (definition.reachWeights[d] ?? 0) > 0.1)
                .sort((a, b) => (definition.reachWeights[b] ?? 0) - (definition.reachWeights[a] ?? 0))
                .map(domain => {
                  const weight = definition.reachWeights[domain] ?? 0;
                  return (
                    <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                      <span style={{ width: '48px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{domain}</span>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${weight * 100}%`, height: '100%', backgroundColor: definition.themeColor, borderRadius: '3px', opacity: 0.7 }} />
                      </div>
                      <span style={{ width: '32px', textAlign: 'right', color: 'var(--text-tertiary)' }}>
                        {(weight * 100).toFixed(0)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </Section>

          {/* Dispositions */}
          {definition.dispositions && Object.keys(definition.dispositions).length > 0 && (
            <Section title="Relations">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--text-xs)' }}>
                {Object.entries(definition.dispositions)
                  .sort(([, a], [, b]) => b - a)
                  .map(([defId, sentiment]) => {
                    const targetDef = FACTION_DEFINITIONS.get(defId);
                    const label = targetDef?.nameTemplate ?? defId;
                    const color = sentiment > 0 ? '#4ade80' : sentiment < -0.5 ? '#f87171' : '#fbbf24';
                    const word = sentiment > 0.3 ? 'Allied' : sentiment > 0 ? 'Friendly' : sentiment > -0.3 ? 'Wary' : sentiment > -0.6 ? 'Hostile' : 'Enemy';
                    return (
                      <div key={defId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {targetDef?.iconGlyph ?? ''} {label}
                        </span>
                        <span style={{ color }}>{word}</span>
                      </div>
                    );
                  })}
              </div>
            </Section>
          )}

          {/* Join Prerequisites */}
          {definition.joinPrerequisites && Object.keys(definition.joinPrerequisites).length > 0 && (
            <Section title="Entry Requirements">
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {Object.entries(definition.joinPrerequisites).map(([reach, min]) => (
                  <span
                    key={reach}
                    style={{
                      fontSize: 'var(--text-xs)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--bg-raised)',
                      color: 'var(--text-secondary)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {reach} {min}+
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
});

FactionSheet.displayName = 'FactionSheet';

// ─── Section helper ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>
        {title}
      </h4>
      {children}
    </div>
  );
}
