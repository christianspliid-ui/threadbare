import { memo, useMemo, useState, useCallback } from 'react';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../../engine/graph';
import type { EncounterTemplate, EncounterProgress } from '../../types/encounter';
import type { SublocationProperties, SublocationPersistence } from '../../types/sublocation';
import { THREAT_RATING_COLORS } from '../../types/encounter';
import { getAgentColor } from '../../data/sphereIcons';
import { getSubLocations, getActorsAtLocation } from '../../engine/viewLevel';
import { ensureSublocations } from '../../engine/sublocation';
import { EncounterLog } from './EncounterLog';
import { generateEntityProse } from '../../engine/proseGenerator';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';

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
  // Prose generation (optional)
  graph?: WorldGraph;
  seed?: number;
}

// ──── Sub-component: Sublocation Card ────
interface SublocationCardProps {
  sublocation: GraphNode;
  agents: GraphNode[];
  hasAgents: boolean;
  badgeColor: string;
  badgeBg: string;
  badgeText: string;
  divineOrigin?: { creatorGodId: string; purpose: string; createdAtTick: number };
  availableEncounters: EncounterTemplate[];
  activeEncounters: EncounterProgress[];
  getEncounterTemplate: (id: string) => EncounterTemplate | undefined;
  getAgentName: (id: string) => string;
  onAgentClick: (agentId: string) => void;
  onEnter: (sublocationId: string) => void;
}

const SublocationCard = memo(function SublocationCard({
  sublocation,
  agents,
  hasAgents,
  badgeColor,
  badgeBg,
  badgeText,
  divineOrigin,
  availableEncounters,
  activeEncounters,
  getEncounterTemplate,
  getAgentName,
  onAgentClick,
  onEnter,
}: SublocationCardProps) {
  // Determine divine styling
  const isDivine = divineOrigin !== undefined;
  const cardStyle: React.CSSProperties = isDivine
    ? {
        background: 'linear-gradient(135deg, var(--divine-tint-from) 0%, var(--divine-tint-to) 100%)',
        borderColor: 'var(--divine-border)',
      }
    : {
        backgroundColor: 'var(--bg-raised)',
        borderColor: 'var(--border-subtle)',
      };

  return (
    <div
      className="rounded-lg border transition-colors overflow-hidden"
      style={{ ...cardStyle, cursor: 'pointer' }}
      onClick={() => onEnter(sublocation.id)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-gold)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDivine ? 'var(--divine-border)' : 'var(--border-subtle)';
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEnter(sublocation.id);
        }
      }}
      aria-label={`Enter ${sublocation.name}`}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b"
        style={{
          borderColor: hasAgents ? 'var(--border-subtle)' : 'transparent',
        }}
      >
        <h4
          className="text-xs font-semibold truncate"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
          }}
        >
          {sublocation.name}
        </h4>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Tooltip label="Sublocation Type" desc="The kind of place this is — shrine, ruin, settlement, or wilderness. Each type attracts different encounters and agent behaviors.">
            <span
              className="text-xs px-2 py-1 rounded font-semibold whitespace-nowrap cursor-help"
              style={{
                color: badgeColor,
                backgroundColor: badgeBg,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: 'var(--text-xs)',
              }}
            >
              {badgeText}
            </span>
          </Tooltip>
          <span
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            →
          </span>
        </div>
      </div>

      {/* Agent Rows (only if hasAgents) */}
      {hasAgents && (
        <div>
          {agents.map(agent => {
            const props = (agent.properties ?? {}) as Record<string, unknown>;
            const actorType = typeof props.actorType === 'string' ? props.actorType : 'unknown';

            // Find active encounters for this agent
            const agentEncounters = activeEncounters.filter(ep => ep.actorId === agent.id);

            return (
              <AgentRow
                key={agent.id}
                agent={agent}
                actorType={actorType as string}
                encounters={agentEncounters}
                getEncounterTemplate={getEncounterTemplate}
                onAgentClick={onAgentClick}
              />
            );
          })}
        </div>
      )}

      {/* Available Encounters Hint (only if hasAgents) */}
      {hasAgents && availableEncounters.length > 0 && (
        <AvailableEncountersHint encounters={availableEncounters} />
      )}

      {/* Empty State (when no agents) */}
      {!hasAgents && (
        <div
          className="px-3.5 py-2"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          No agents present
        </div>
      )}

      {/* FE-TT-18: Divine hint with tooltip */}
      {isDivine && (
        <Tooltip label="Divine Origin" desc="This sublocation was created by a divine intervention. It is temporary and will dissolve when its purpose is fulfilled.">
          <div
            className="px-3.5 py-1.5 text-xs cursor-help"
            style={{
              color: 'var(--badge-divine)',
              fontStyle: 'italic',
              fontSize: 'var(--text-xs)',
            }}
          >
            Dissolves when encounter completes
          </div>
        </Tooltip>
      )}
    </div>
  );
});

// ──── Sub-component: Agent Row ────
interface AgentRowProps {
  agent: GraphNode;
  actorType: string;
  encounters: EncounterProgress[];
  getEncounterTemplate: (id: string) => EncounterTemplate | undefined;
  onAgentClick: (agentId: string) => void;
}

const AgentRow = memo(function AgentRow({
  agent,
  actorType,
  encounters,
  getEncounterTemplate,
  onAgentClick,
}: AgentRowProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onAgentClick(agent.id); }}
      className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 hover:bg-opacity-50 transition-colors group cursor-pointer"
      style={{
        backgroundColor: 'transparent',
        transition: 'background-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Agent pip */}
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{
          backgroundColor: getAgentColor(agent.name),
          color: 'white',
        }}
      >
        {agent.name.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-xs truncate"
          style={{
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: 'var(--text-sm)',
          }}
        >
          {agent.name}
        </p>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
          {encounters.length > 0 ? (
            <>
              <span style={{ color: 'var(--accent-gold)' }}>
                {getEncounterTemplate(encounters[0].encounterId)?.name || 'Unknown Encounter'}
              </span>
              <span style={{ color: 'var(--text-tertiary)' }}> · </span>
              <span>step {encounters[0].currentStepIndex + 1}</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>idle</span>
            </>
          )}
        </p>
      </div>

      {/* Step dots */}
      {encounters.length > 0 && (
        <StepDots
          progress={encounters[0]}
          template={getEncounterTemplate(encounters[0].encounterId)}
        />
      )}
    </button>
  );
});

// ──── Sub-component: Step Dots ────
interface StepDotsProps {
  progress: EncounterProgress;
  template?: EncounterTemplate;
}

const StepDots = memo(function StepDots({ progress, template }: StepDotsProps) {
  if (!template) return null;

  const totalSteps = template.steps.length;
  const currentStep = progress.currentStepIndex;

  return (
    <div
      className="flex gap-1.5 flex-shrink-0"
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {Array.from({ length: totalSteps }).map((_, idx) => {
        let dotColor = 'var(--step-pending)';
        let glow = 'none';

        if (idx < currentStep) {
          dotColor = 'var(--step-completed)';
        } else if (idx === currentStep) {
          dotColor = 'var(--step-current)';
          glow = '0 0 6px var(--step-current-glow)';
        }

        return (
          <div
            key={idx}
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: glow,
            }}
          />
        );
      })}
    </div>
  );
});

// ──── Sub-component: Available Encounters Hint ────
interface AvailableEncountersHintProps {
  encounters: EncounterTemplate[];
}

const AvailableEncountersHint = memo(function AvailableEncountersHint({
  encounters,
}: AvailableEncountersHintProps) {
  return (
    <div
      className="px-3.5 py-1.5 border-t"
      style={{
        borderColor: 'rgba(42, 42, 50, 0.4)',
      }}
    >
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '0.35rem',
        }}
      >
        Also available
      </p>
      <div className="space-y-0.5">
        {encounters.slice(0, 3).map(encounter => (
          <p
            key={encounter.id}
            className="flex justify-between items-center"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            <span>{encounter.name}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {encounter.threatRating}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
});

// ──── Sub-component: Sublocation Detail View ────
interface SublocationDetailViewProps {
  sublocation: GraphNode;
  parentLocationName: string;
  agents: GraphNode[];
  availableEncounters: EncounterTemplate[];
  activeEncounters: EncounterProgress[];
  getEncounterTemplate: (id: string) => EncounterTemplate | undefined;
  getAgentName: (id: string) => string;
  onAgentClick: (agentId: string) => void;
  onBack: () => void;
  badgeColor: string;
  badgeBg: string;
  badgeText: string;
  graph?: WorldGraph;
  seed?: number;
}

const SublocationDetailView = memo(function SublocationDetailView({
  sublocation,
  parentLocationName,
  agents,
  availableEncounters,
  activeEncounters,
  getEncounterTemplate,
  getAgentName,
  onAgentClick,
  onBack,
  badgeColor,
  badgeBg,
  badgeText,
  graph,
  seed,
}: SublocationDetailViewProps) {
  // Generate prose for sublocation
  const sublocationProse = useMemo(() => {
    if (!graph || seed === undefined) return '';
    return generateEntityProse(sublocation.id, graph, seed, 'full');
  }, [sublocation.id, graph, seed]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Sublocation Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          onClick={onBack}
          aria-label={`Back to ${parentLocationName}`}
          className="transition-colors text-xl px-2 cursor-pointer"
          style={{ color: 'var(--accent-gold)' }}
        >
          ←
        </button>

        <div
          className="w-10 h-10 rounded-full border flex-shrink-0 flex items-center justify-center"
          style={{
            backgroundColor: badgeBg,
            borderColor: badgeColor,
          }}
        >
          <span style={{ color: badgeColor, fontSize: 'var(--text-sm)', fontWeight: 700 }}>
            {sublocation.name.charAt(0)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h2
            className="font-semibold tracking-wide truncate"
            style={{
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {sublocation.name}
          </h2>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            in {parentLocationName}
          </p>
        </div>

        <span
          className="flex-shrink-0 text-xs px-2 py-1 rounded font-semibold whitespace-nowrap"
          style={{
            color: badgeColor,
            backgroundColor: badgeBg,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: 'var(--text-xs)',
          }}
        >
          {badgeText}
        </span>
      </div>

      {/* Prose / flavor text + concept art */}
      {sublocationProse && (
        <div className="mx-6 mt-5 flex gap-4" style={{ minHeight: '120px', maxHeight: '180px' }}>
          {/* Prose column */}
          <div
            className="flex-1 min-w-0 rounded-lg border p-4 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="space-y-3">
              {sublocationProse.split('\n\n').map((para, idx) => (
                <p
                  key={idx}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)',
                    lineHeight: '1.6',
                  }}
                >
                  {para.trim()}
                </p>
              ))}
            </div>
          </div>
          {/* Concept art placeholder */}
          <div
            className="rounded-lg border flex items-center justify-center"
            style={{
              width: '40%',
              flexShrink: 0,
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col items-center gap-2" style={{ opacity: 0.4 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                Concept Art
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content: Agents + Encounters side by side */}
      <div className="flex-1 flex gap-6 p-6 min-h-0">
        {/* Left: Agents Present */}
        <div className="flex-1 min-w-0">
          <SectionHeading count={agents.length}>Agents Present</SectionHeading>

          {agents.length === 0 ? (
            <p
              className="italic"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              This place lies quiet — for now.
            </p>
          ) : (
            <div className="space-y-1">
              {agents.map(agent => {
                const props = (agent.properties ?? {}) as Record<string, unknown>;
                const actorType = typeof props.actorType === 'string' ? props.actorType : 'unknown';
                const agentEncounters = activeEncounters.filter(ep => ep.actorId === agent.id);

                return (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    actorType={actorType}
                    encounters={agentEncounters}
                    getEncounterTemplate={getEncounterTemplate}
                    onAgentClick={onAgentClick}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Encounters */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <SectionHeading>Encounters</SectionHeading>

          <div className="flex-1 overflow-y-auto pr-1">
            {/* Active encounters */}
            {activeEncounters.length > 0 && (
              <div className="mb-6">
                <h4
                  className="text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
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

            {/* Available encounters */}
            {availableEncounters.length > 0 && (
              <div>
                <h4
                  className="text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Available
                </h4>
                <div className="space-y-2">
                  {availableEncounters.map(encounter => {
                    const threatColor = THREAT_RATING_COLORS[encounter.threatRating] ?? '#a78bfa';
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
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {encounter.encounterType} · {encounter.reachPrimary}
                        </p>
                      </div>
                    );
                  })}
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
                The stillness here is unbroken.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

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
  graph,
  seed,
}: LocationViewProps) {
  const terrainLabel = hexTerrain.charAt(0).toUpperCase() + hexTerrain.slice(1).replace(/_/g, ' ');
  // RC-041: Safe property access with type guard
  const locProps = (location.properties ?? {}) as Record<string, unknown>;
  const locType = typeof locProps.locationType === 'string' ? locProps.locationType : 'location';

  // ── Sublocation drill-down state ──
  const [selectedSublocationId, setSelectedSublocationId] = useState<string | null>(null);

  const handleEnterSublocation = useCallback((sublocationId: string) => {
    setSelectedSublocationId(sublocationId);
  }, []);

  const handleBackToLocation = useCallback(() => {
    setSelectedSublocationId(null);
  }, []);

  // Generate prose for location (memoized)
  const locationProse = useMemo(() => {
    if (!graph || seed === undefined) return '';
    return generateEntityProse(location.id, graph, seed, 'full');
  }, [location.id, graph, seed]);

  // Lazily ensure sublocations exist, then read them from graph (memoized)
  const sublocationData = useMemo(() => {
    if (!graph) return { sublocations: [], groupedAgents: new Map() };

    // Lazy creation: ensure sublocation instances exist for this location
    // Uses locationSubtype → SUBTYPE_SUBLOCATION_MAP, deterministic via seed
    const sublocationSeed = seed ?? 42;
    ensureSublocations(graph, location.id, sublocationSeed);

    const subs = getSubLocations(graph, location.id);
    if (subs.length === 0) {
      return { sublocations: [], groupedAgents: new Map() };
    }

    // Group agents by sublocation
    const grouped = new Map<string, GraphNode[]>();
    for (const sub of subs) {
      const agentsAtSub = getActorsAtLocation(graph, sub.id);
      grouped.set(sub.id, agentsAtSub);
    }

    // Sort: active (has agents) first by agent count desc, then empty ones
    const sorted = subs.sort((a, b) => {
      const aHasAgents = (grouped.get(a.id) ?? []).length > 0;
      const bHasAgents = (grouped.get(b.id) ?? []).length > 0;

      if (aHasAgents && !bHasAgents) return -1;
      if (!aHasAgents && bHasAgents) return 1;

      if (aHasAgents && bHasAgents) {
        return (grouped.get(b.id) ?? []).length - (grouped.get(a.id) ?? []).length;
      }

      return 0;
    });

    return { sublocations: sorted, groupedAgents: grouped };
  }, [graph, location.id, seed]);

  // ── If a sublocation is selected, find it and render the detail view ──
  const selectedSublocation = selectedSublocationId
    ? sublocationData.sublocations.find(s => s.id === selectedSublocationId) ?? null
    : null;

  if (selectedSublocation && selectedSublocationId) {
    const subAgents = sublocationData.groupedAgents.get(selectedSublocationId) ?? [];
    const subProps = (selectedSublocation.properties ?? {}) as Partial<SublocationProperties>;
    const persistence = subProps.persistence as SublocationPersistence | undefined;
    const divineOrigin = subProps.divineOrigin;

    let badgeColor = 'var(--badge-permanent)';
    let badgeBg = 'var(--badge-permanent-bg)';
    let badgeText = 'Permanent';
    if (persistence?.type === 'divine' || divineOrigin) {
      badgeColor = 'var(--badge-divine)';
      badgeBg = 'var(--badge-divine-bg)';
      badgeText = 'Divine';
    } else if (persistence?.type === 'temporal') {
      badgeColor = 'var(--badge-temporal)';
      badgeBg = 'var(--badge-temporal-bg)';
      badgeText = 'Temporal';
    }

    // Filter active encounters to agents in this sublocation
    const subAgentIds = new Set(subAgents.map(a => a.id));
    const subActiveEncounters = activeEncounters.filter(ep => subAgentIds.has(ep.actorId));

    // Filter available encounters to those matching this sublocation's type
    const subTypeId = subProps.sublocationTypeId as string | undefined;
    const subAvailableEncounters = subTypeId
      ? availableEncounters.filter(e => e.sublocationTypes?.includes(subTypeId))
      : availableEncounters;

    return (
      <SublocationDetailView
        sublocation={selectedSublocation}
        parentLocationName={location.name}
        agents={subAgents}
        availableEncounters={subAvailableEncounters}
        activeEncounters={subActiveEncounters}
        getEncounterTemplate={getEncounterTemplate}
        getAgentName={getAgentName}
        onAgentClick={onAgentClick}
        onBack={handleBackToLocation}
        badgeColor={badgeColor}
        badgeBg={badgeBg}
        badgeText={badgeText}
        graph={graph}
        seed={seed}
      />
    );
  }

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

      {/* Prose + concept art placeholder */}
      {locationProse ? (
        <div className="mx-6 mt-5 flex gap-4" style={{ minHeight: '160px', maxHeight: '220px' }}>
          {/* Prose column */}
          <div
            className="flex-1 min-w-0 rounded-lg border p-4 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="space-y-3">
              {locationProse.split('\n\n').map((para, idx) => (
                <p
                  key={idx}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)',
                    lineHeight: '1.6',
                  }}
                >
                  {para.trim()}
                </p>
              ))}
            </div>
          </div>
          {/* Concept art placeholder */}
          <div
            className="rounded-lg border flex items-center justify-center"
            style={{
              width: '40%',
              flexShrink: 0,
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-col items-center gap-2" style={{ opacity: 0.4 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                Concept Art
              </span>
            </div>
          </div>
        </div>
      ) : (
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
            — select a hex to peer into the world below —
          </span>
        </div>
      )}

      {/* Conditional: Sublocation view or flat layout */}
      {sublocationData.sublocations.length > 0 ? (
        // ──── SUBLOCATION VIEW ────
        <div className="flex-1 flex flex-col overflow-y-auto px-6 py-6">
          <SectionHeading>Sublocations</SectionHeading>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {sublocationData.sublocations.map(sublocation => {
              const subAgents = sublocationData.groupedAgents.get(sublocation.id) ?? [];
              const hasAgents = subAgents.length > 0;
              const subProps = (sublocation.properties ?? {}) as Partial<SublocationProperties>;
              const persistence = subProps.persistence as SublocationPersistence | undefined;
              const divineOrigin = subProps.divineOrigin;

              // Determine persistence badge color and text
              let badgeColor = 'var(--badge-permanent)';
              let badgeBg = 'var(--badge-permanent-bg)';
              let badgeText = 'Permanent';

              if (persistence?.type === 'divine' || divineOrigin) {
                badgeColor = 'var(--badge-divine)';
                badgeBg = 'var(--badge-divine-bg)';
                badgeText = 'Divine';
              } else if (persistence?.type === 'temporal') {
                badgeColor = 'var(--badge-temporal)';
                badgeBg = 'var(--badge-temporal-bg)';
                badgeText = 'Temporal';
              }

              // Filter encounters to those matching this sublocation's type
              const subTypeId = subProps.sublocationTypeId as string | undefined;
              const filteredEncounters = subTypeId
                ? availableEncounters.filter(e => e.sublocationTypes?.includes(subTypeId))
                : availableEncounters;

              return (
                <SublocationCard
                  key={sublocation.id}
                  sublocation={sublocation}
                  agents={subAgents}
                  hasAgents={hasAgents}
                  badgeColor={badgeColor}
                  badgeBg={badgeBg}
                  badgeText={badgeText}
                  divineOrigin={divineOrigin}
                  availableEncounters={filteredEncounters}
                  activeEncounters={activeEncounters}
                  getEncounterTemplate={getEncounterTemplate}
                  getAgentName={getAgentName}
                  onAgentClick={onAgentClick}
                  onEnter={handleEnterSublocation}
                />
              );
            })}
          </div>
        </div>
      ) : (
        // ──── FLAT LAYOUT (NO SUBLOCATIONS) ────
        <div className="flex-1 flex gap-6 p-6 min-h-0">
          {/* Left: Agents Present */}
          <div className="flex-1 min-w-0">
            <SectionHeading>Agents Present</SectionHeading>

            {agents.length === 0 ? (
              <p
                className="italic"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                }}
              >
                This place lies quiet — for now.
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
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group cursor-pointer focus:outline-none focus:ring-1 duration-150"
                      style={{ '--tw-ring-color': 'var(--accent-gold)', transition: 'background-color 150ms ease' } as React.CSSProperties}
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
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <SectionHeading>Encounters</SectionHeading>

            <div className="flex-1 overflow-y-auto pr-1">
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
                    {availableEncounters.map(encounter => {
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
                  The stillness here is unbroken.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
