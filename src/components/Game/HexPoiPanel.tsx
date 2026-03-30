/**
 * @deprecated Replaced by HexChronicle (People layer + inline LocationCards) in the chronicle redesign (2026-03-15).
 * Kept for reference; safe to delete once chronicle is stable.
 */
import { memo, useMemo } from 'react';
import type { GraphNode } from '../../types/graph';
import type { LocationSubtype } from '../../types';
import type { LineOfSight } from '../../engine/hexZoom';
import { getAgentColor } from '../../data/sphereIcons';
import { getOverlayIconUrl } from '../../data/hex-tile-assets';

// ── Constants ────────────────────────────────────────────────────────

const SUBTYPE_GLYPHS: Record<string, string> = {
  hamlet: '🏘',
  town: '🏘',
  city: '🏙',
  capital: '👑',
  camp: '⛺',
  farmland: '🌾',
  castle: '🏰',
  fort: '🛡',
  tower: '🗼',
  shrine: '⛩',
  temple: '🕍',
  mining: '⛏',
  ruins: '🏚',
  ruined_tower: '🏚',
  ruined_city: '🏚',
  ruined_village: '🏚',
  battleground: '⚔',
  oasis: '🌴',
  unexplored_poi: '❓',
  wilderness: '🌿',
};

// ── Helpers ──────────────────────────────────────────────────────────

function formatSubtype(subtype: string): string {
  return subtype
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getLocationSubtype(loc: GraphNode): LocationSubtype | undefined {
  const props = (loc.properties ?? {}) as Record<string, unknown>;
  const sub = props.locationSubtype;
  return typeof sub === 'string' ? (sub as LocationSubtype) : undefined;
}

// ── Component ────────────────────────────────────────────────────────

interface HexPoiPanelProps {
  locations: GraphNode[];
  agentsByLocation: Record<string, GraphNode[]>;
  lineOfSight: LineOfSight;
  onLocationClick: (locationId: string) => void;
}

export const HexPoiPanel = memo(function HexPoiPanel({
  locations,
  agentsByLocation,
  lineOfSight,
  onLocationClick,
}: HexPoiPanelProps) {
  const isHidden = lineOfSight === 'none';

  // Flatten all agents across locations
  const allAgents = useMemo(() => {
    const agents: { agent: GraphNode; locationName: string; locationId: string }[] = [];
    for (const loc of locations) {
      const locAgents = agentsByLocation[loc.id] ?? [];
      for (const agent of locAgents) {
        agents.push({ agent, locationName: loc.name, locationId: loc.id });
      }
    }
    return agents;
  }, [locations, agentsByLocation]);

  if (isHidden) {
    return (
      <div
        className="flex flex-col gap-3 p-4 h-full overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Points of Interest
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Nothing visible from this distance.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 p-4 h-full overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {/* Section: Locations */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '0.25rem',
        }}
      >
        Locations ({locations.length})
      </h3>

      <div role="list" className="flex flex-col gap-1">
        {locations.map(loc => {
          const subtype = getLocationSubtype(loc);
          const agents = agentsByLocation[loc.id] ?? [];
          const glyph = SUBTYPE_GLYPHS[subtype ?? 'wilderness'] ?? '🌿';

          return (
            <div
              key={loc.id}
              role="listitem"
              tabIndex={0}
              className="flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors"
              style={{
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-raised)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
              onClick={() => onLocationClick(loc.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLocationClick(loc.id);
                }
              }}
            >
              {/* Glyph */}
              <span className="flex-shrink-0 text-sm" style={{ lineHeight: 1.4 }}>{glyph}</span>

              {/* Name + subtype */}
              <div className="flex flex-col min-w-0">
                <span
                  className="leading-tight"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    wordBreak: 'break-word',
                  }}
                >
                  {loc.name}
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {subtype && subtype !== 'wilderness' ? formatSubtype(subtype) : 'Wilderness'}
                  {agents.length > 0 && ` · ${agents.length} soul${agents.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-full h-px my-1" style={{ background: 'var(--border-subtle)' }} />

      {/* Section: Agents / Souls */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '0.25rem',
        }}
      >
        Souls ({allAgents.length})
      </h3>

      {allAgents.length === 0 ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          No souls inhabit this area.
        </p>
      ) : (
        <div role="list" className="flex flex-col gap-0.5">
          {allAgents.map(({ agent, locationName }) => {
            const agentColor = getAgentColor(agent.name);
            const props = (agent.properties ?? {}) as Record<string, unknown>;
            const tier = typeof props.tier === 'number' ? props.tier : 1;

            return (
              <div
                key={agent.id}
                role="listitem"
                className="flex items-center gap-2 px-2 py-1 rounded"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                {/* Agent color pip */}
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor: agentColor,
                    border: '1px solid rgba(0,0,0,0.3)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'white', fontWeight: 'bold', lineHeight: 1 }}>
                    {agent.name.charAt(0)}
                  </span>
                </div>

                {/* Name + location */}
                <div className="flex flex-col min-w-0">
                  <span
                    className="leading-tight"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {agent.name}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    at {locationName}
                    {tier > 1 && ` · Tier ${tier}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
