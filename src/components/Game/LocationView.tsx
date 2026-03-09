import { memo } from 'react';
import type { GraphNode } from '../../types/graph';
import type { EncounterTemplate, EncounterProgress } from '../../types/encounter';
import { THREAT_RATING_COLORS } from '../../types/encounter';
import { getAgentColor } from '../../data/sphereIcons';
import { EncounterLog } from './EncounterLog';

interface LocationViewProps {
  location: GraphNode;
  agents: GraphNode[];
  hexTerrain: string;
  hexCol: number;
  hexRow: number;
  onAgentClick: (agentId: string) => void;
  onBack: () => void;
  // Encounter data
  availableEncounters: EncounterTemplate[];
  activeEncounters: EncounterProgress[];
  getAgentName: (id: string) => string;
  getEncounterTemplate: (id: string) => EncounterTemplate | undefined;
}

export const LocationView = memo(function LocationView({
  location,
  agents,
  hexTerrain,
  hexCol,
  hexRow,
  onAgentClick,
  onBack,
  availableEncounters,
  activeEncounters,
  getAgentName,
  getEncounterTemplate,
}: LocationViewProps) {
  const terrainLabel = hexTerrain.charAt(0).toUpperCase() + hexTerrain.slice(1).replace(/_/g, ' ');
  // RC-041: Safe property access with type guard
  const locProps = (location.properties ?? {}) as Record<string, unknown>;
  const locType = typeof locProps.locationType === 'string' ? locProps.locationType : 'location';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header bar */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back to hex view"
          className="transition-colors text-xl px-2 cursor-pointer"
          style={{ color: 'var(--accent-gold)' }}
        >
          ←
        </button>

        {/* Location icon placeholder */}
        <div
          className="w-10 h-10 rounded-full border flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-raised)',
            borderColor: 'var(--border-subtle)',
          }}
        />

        <div>
          <h2
            className="font-semibold tracking-wide"
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {location.name}
          </h2>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            {locType} · in {terrainLabel} Hex ({hexCol}, {hexRow})
          </p>
        </div>
      </div>

      {/* Establishing shot placeholder — large and prominent */}
      <div
        className="mx-6 mt-5 rounded-lg border flex items-center justify-center"
        style={{
          aspectRatio: '21/9',
          minHeight: '180px',
          backgroundColor: 'var(--bg-raised)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          — establishing shot —
        </span>
      </div>

      {/* Two-column layout — generous padding and spacing */}
      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* Left: Agents Present */}
        <div className="flex-1 min-w-0">
          <h3
            className="section-heading mb-3"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Agents Present
          </h3>

          {agents.length === 0 ? (
            <p
              className="italic"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              No agents present
            </p>
          ) : (
            <div className="space-y-1">
              {agents.map(agent => {
                // RC-041: Safe property access with type guard
                const props = (agent.properties ?? {}) as Record<string, unknown>;
                const actorType = typeof props.actorType === 'string' ? props.actorType : 'unknown';

                return (
                  <button
                    key={agent.id}
                    onClick={() => onAgentClick(agent.id)}
                    aria-label={`View ${agent.name}`}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group cursor-pointer focus:outline-none focus:ring-1"
                    style={{ '--tw-ring-color': 'var(--accent-gold)' } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Agent square */}
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: getAgentColor(agent.name) }}
                    >
                      <span
                        className="font-bold"
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'white',
                        }}
                      >
                        {agent.name.charAt(0)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="truncate group-hover:opacity-80 transition-opacity"
                        style={{
                          fontSize: 'var(--text-base)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {agent.name}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {actorType}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Encounters (active and available) */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <h3
            className="section-heading mb-3"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Encounters
          </h3>

          {/* Active encounters section */}
          {activeEncounters.length > 0 && (
            <div className="mb-6">
              <h4
                className="text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{
                  color: 'var(--text-tertiary)',
                }}
              >
                Active
              </h4>
              <div className="space-y-2">
                {activeEncounters.map(progress => {
                  const template = getEncounterTemplate(progress.encounterId);
                  if (!template) return null;
                  const agentName = getAgentName(progress.actorId);
                  return (
                    <EncounterLog
                      key={progress.encounterId}
                      progress={progress}
                      template={template}
                      agentName={agentName}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Available encounters section */}
          {availableEncounters.length > 0 && (
            <div>
              <h4
                className="text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{
                  color: 'var(--text-tertiary)',
                }}
              >
                Available
              </h4>
              <div className="space-y-2">
                {availableEncounters.slice(0, 5).map(encounter => {
                  const threatColor =
                    THREAT_RATING_COLORS[encounter.threatRating] ?? '#a78bfa';

                  return (
                    <div
                      key={encounter.id}
                      className="px-3 py-2.5 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-deep)',
                        borderColor: 'var(--border-subtle)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-gold)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {encounter.name}
                        </p>
                        <div
                          className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap border"
                          style={{
                            backgroundColor: 'var(--bg-deep)',
                            color: threatColor,
                            borderColor: threatColor,
                          }}
                        >
                          {encounter.threatRating}
                        </div>
                      </div>
                      <p
                        className="text-xs"
                        style={{
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {encounter.encounterType} · {encounter.reachPrimary}
                      </p>
                    </div>
                  );
                })}
                {availableEncounters.length > 5 && (
                  <p
                    className="text-xs italic"
                    style={{
                      color: 'var(--text-muted)',
                    }}
                  >
                    +{availableEncounters.length - 5} more available
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeEncounters.length === 0 && availableEncounters.length === 0 && (
            <p
              className="italic"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              No encounters at this location
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
