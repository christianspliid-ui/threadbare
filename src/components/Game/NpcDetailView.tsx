import type { GraphNode } from '../../types/graph';
import { Medallion } from '../shared/Medallion';
import { FlavorQuote } from '../shared/FlavorQuote';
import { pickFallbackFlavor } from '../../data/reveal-content';

interface NpcDetailViewProps {
  npc: GraphNode;
  traits: string[];
  factionName: string | null;
}

const TIER_LABEL: Record<string, string> = {
  ambient: 'Ambient',
  notable: 'Notable',
};

const TIER_COLOR: Record<string, string> = {
  ambient: 'var(--text-muted)',
  notable: 'var(--accent-gold)',
};

/**
 * Glyph for a trait chip. Traits have no art registry of their own (per
 * `artifact-representation.md`, traits are inline-only — no independent card),
 * so the chip carries the shared four-pointed star rather than inventing a
 * second per-trait art path.
 */
const TRAIT_GLYPH = '✦'; // ✦

export function NpcDetailView({ npc, traits, factionName }: NpcDetailViewProps) {
  const props = (npc.properties ?? {}) as Record<string, unknown>;
  const tier = typeof props.spotlightTier === 'string' ? props.spotlightTier : 'ambient';
  const role = typeof props.npcRole === 'string' ? props.npcRole.replace(/_/g, ' ') : '';
  const sphereAffinity = typeof props.sphereAffinity === 'string' ? props.sphereAffinity : null;

  const tierLabel = TIER_LABEL[tier] ?? tier;
  const tierColor = TIER_COLOR[tier] ?? TIER_COLOR.ambient;

  // The section's flavor line. Traits carry no prose field of their own on the
  // node, so this is the generic per-kind line, keyed stably on the NPC id.
  const traitFlavor = traits.length > 0 ? pickFallbackFlavor('trait', npc.id) : null;

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header: name + tier */}
      <div className="flex items-start justify-between gap-2">
        <h2
          className="font-semibold tracking-wide"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
          }}
        >
          {npc.name}
        </h2>
        <span
          className="font-semibold uppercase tracking-wider mt-0.5 flex-shrink-0"
          style={{ fontSize: 'var(--text-xs)', color: tierColor }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Role */}
      {role && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{role}</p>
      )}

      {/* Sphere affinity */}
      {sphereAffinity && (
        <div className="flex items-center gap-1.5">
          <span
            className="uppercase tracking-wider"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
          >
            Sphere
          </span>
          <span
            className="font-medium"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}
          >
            {sphereAffinity}
          </span>
        </div>
      )}

      {/* Faction */}
      {factionName && (
        <div className="flex items-center gap-1.5">
          <span
            className="uppercase tracking-wider"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
          >
            Affiliation
          </span>
          <span
            className="font-medium"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}
          >
            {factionName}
          </span>
        </div>
      )}

      {/* Traits — inline medallion chips (THR-799). Inline only: traits get no
          free-standing card, per the artifact-representation registry. */}
      {traits.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {traits.map(trait => (
              <span
                key={trait}
                className="inline-flex items-center gap-2 rounded"
                style={{
                  padding: '2px 8px 2px 2px',
                  backgroundColor: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <Medallion size="sm" title={trait}>
                  <span style={{ color: 'var(--accent-gold-dim)', lineHeight: 1 }}>{TRAIT_GLYPH}</span>
                </Medallion>
                {trait}
              </span>
            ))}
          </div>
          <FlavorQuote divider={false}>{traitFlavor}</FlavorQuote>
        </div>
      )}
    </div>
  );
}
