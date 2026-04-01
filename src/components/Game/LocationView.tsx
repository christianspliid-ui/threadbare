import { memo, useMemo, useState, useCallback, useRef } from 'react';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../../engine/graph';
import type { EncounterTemplate, EncounterProgress } from '../../types/encounter';
import type { SublocationProperties, SublocationPersistence } from '../../types/sublocation';
import { THREAT_RATING_COLORS } from '../../types/encounter';
import type { RarityTier } from '../../types/rarity';
import { RARITY_TIER_COLORS } from '../../types/rarity';
import { getAgentColor } from '../../data/sphereIcons';
import { getVisibleSubLocations, getActorsAtLocation } from '../../engine/viewLevel';
import { ensureSublocations } from '../../engine/sublocation';
import { EncounterLog } from './EncounterLog';
import { generateEntityProse } from '../../engine/proseGenerator';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';
import { StepDots } from '../shared/StepDots';
import { getSublocationConceptArt, getLocationConceptArt } from '../../data/sublocation-concept-art';
import { useNarration } from '../../services/narration/useNarration';
import { Play, Square, Loader2 } from 'lucide-react';

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
  // Click-to-open encounter vignette
  onEncounterClick?: (agentId: string, progress: EncounterProgress, template: EncounterTemplate) => void;
  // Prose generation (optional)
  graph?: WorldGraph;
  seed?: number;
  /** Current game tick — enables tick-based prose cache (PERF-01) */
  tick?: number;
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
  onEncounterClick?: (agentId: string, progress: EncounterProgress, template: EncounterTemplate) => void;
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
  onEncounterClick,
  onEnter,
}: SublocationCardProps) {
  // Concept art for this sublocation type
  const subProps = (sublocation.properties ?? {}) as Partial<SublocationProperties>;
  const conceptArt = getSublocationConceptArt(subProps.sublocationTypeId ?? '');

  // Determine divine styling
  const isDivine = divineOrigin !== undefined;
  const cardStyle: React.CSSProperties = isDivine
    ? {
        background: 'linear-gradient(135deg, var(--divine-tint-from) 0%, var(--divine-tint-to) 100%)',
        borderColor: 'var(--divine-border)',
      }
    : {
        backgroundColor: 'var(--bg-raised)',
        borderColor: 'var(--border-gold)',
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
        e.currentTarget.style.borderColor = isDivine ? 'var(--divine-border)' : 'var(--border-gold)';
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
      <div style={{ display: 'flex' }}>
        {/* Concept Art Thumbnail — left column */}
        <div
          style={{
            background: conceptArt.gradient,
            width: '80px',
            minHeight: '80px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              color: conceptArt.glyphColor,
              opacity: 0.6,
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            {conceptArt.glyph}
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '8px',
              color: conceptArt.glyphColor,
              opacity: 0.35,
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Concept Art
          </span>
        </div>

        {/* Content — right column */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
                    onEncounterClick={onEncounterClick}
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
      </div>
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
  onEncounterClick?: (agentId: string, progress: EncounterProgress, template: EncounterTemplate) => void;
}

const AgentRow = memo(function AgentRow({
  agent,
  actorType,
  encounters,
  getEncounterTemplate,
  onAgentClick,
  onEncounterClick,
}: AgentRowProps) {
  const rarityTier = ((agent.properties as Record<string, unknown>)?.rarityTier ?? 1) as RarityTier;
  const rarityColor = RARITY_TIER_COLORS[rarityTier] ?? RARITY_TIER_COLORS[1];
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
      {/* Agent pip — left border uses rarity tier color */}
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{
          backgroundColor: getAgentColor(agent.name),
          color: 'white',
          borderLeft: `3px solid ${rarityColor}`,
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
          {encounters.length > 0 ? (() => {
            const tmpl = getEncounterTemplate(encounters[0].encounterId);
            return (
              <span
                role="button"
                tabIndex={0}
                style={{ cursor: onEncounterClick ? 'pointer' : undefined }}
                onClick={(e) => {
                  if (!onEncounterClick || !tmpl) return;
                  e.stopPropagation();
                  onEncounterClick(agent.id, encounters[0], tmpl);
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onEncounterClick && tmpl) {
                    e.stopPropagation();
                    e.preventDefault();
                    onEncounterClick(agent.id, encounters[0], tmpl);
                  }
                }}
              >
                <span style={{ color: 'var(--accent-gold)' }}>
                  {tmpl?.name || 'Unknown Encounter'}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}> · </span>
                <span>step {encounters[0].currentEncounterIndex + 1}</span>
              </span>
            );
          })() : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>idle</span>
          )}
        </p>
      </div>

      {/* Step dots */}
      {encounters.length > 0 && (() => {
        const tmpl = getEncounterTemplate(encounters[0].encounterId);
        return tmpl ? (
          <StepDots
            totalSteps={tmpl.steps.length}
            currentStepIndex={encounters[0].currentEncounterIndex}
          />
        ) : null;
      })()}
    </button>
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
  /** Current game tick — enables tick-based prose cache (PERF-01) */
  tick?: number;
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
  tick,
}: SublocationDetailViewProps) {
  // Concept art for this sublocation type
  const detailSubProps = (sublocation.properties ?? {}) as Partial<SublocationProperties>;
  const conceptArt = getSublocationConceptArt(detailSubProps.sublocationTypeId ?? '');

  // Generate prose for sublocation
  const sublocationProse = useMemo(() => {
    if (!graph || seed === undefined || tick === undefined) return '';
    return generateEntityProse(sublocation.id, graph, seed, 'full', tick);
  }, [sublocation.id, graph, seed, tick]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Sublocation Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderColor: 'var(--border-gold)',
        }}
      >
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

        <button
          onClick={onBack}
          aria-label="close"
          className="transition-colors text-xl px-2 ml-2 cursor-pointer flex-shrink-0"
          style={{ color: 'var(--accent-gold)' }}
        >
          ✕
        </button>
      </div>

      {/* Concept art (16:9 landscape, left) + optional prose (right) */}
      <div className="mx-6 mt-5 flex gap-4" style={{ minHeight: '140px', maxHeight: '200px' }}>
        {/* Concept art placeholder — 16:9 landscape, always visible, left side */}
        <div
          className="rounded-lg border overflow-hidden flex items-center justify-center"
          style={{
            aspectRatio: '16/9',
            height: '100%',
            flexShrink: 0,
            background: conceptArt.gradient,
            borderColor: 'var(--border-gold)',
            position: 'relative',
          }}
        >
          <span
            style={{
              fontSize: '48px',
              color: conceptArt.glyphColor,
              opacity: 0.5,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            {conceptArt.glyph}
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: '6px',
              right: '10px',
              fontSize: 'var(--text-xs)',
              color: conceptArt.glyphColor,
              opacity: 0.35,
              fontFamily: 'var(--font-display)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            Concept Art
          </span>
        </div>
        {/* Prose column — only when prose exists */}
        {sublocationProse && (
          <div
            className="flex-1 min-w-0 rounded-lg border p-4 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--border-gold)',
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
        )}
      </div>

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
                    onEncounterClick={onEncounterClick}
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
                        onClick={onEncounterClick ? () => onEncounterClick(progress.actorId, progress, template) : undefined}
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
                          borderColor: 'var(--border-gold)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-gold)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-gold)';
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
  onEncounterClick,
  getEncounterTemplate,
  graph,
  seed,
  tick,
}: LocationViewProps) {
  const terrainLabel = hexTerrain.charAt(0).toUpperCase() + hexTerrain.slice(1).replace(/_/g, ' ');
  // RC-041: Safe property access with type guard
  const locProps = (location.properties ?? {}) as Record<string, unknown>;
  const locType = typeof locProps.locationType === 'string' ? locProps.locationType : 'location';
  const locationSubtype = typeof locProps.locationSubtype === 'string' ? locProps.locationSubtype : locType;
  const locationArt = getLocationConceptArt(locationSubtype);

  // ── Sublocation drill-down state ──
  const [selectedSublocationId, setSelectedSublocationId] = useState<string | null>(null);

  const handleEnterSublocation = useCallback((sublocationId: string) => {
    setSelectedSublocationId(sublocationId);
  }, []);

  const handleBackToLocation = useCallback(() => {
    setSelectedSublocationId(null);
  }, []);

  // Generate prose for location (memoized — tick enables tick-based prose cache PERF-01)
  const locationProse = useMemo(() => {
    if (!graph || seed === undefined) return '';
    return generateEntityProse(location.id, graph, seed, 'full', tick);
  }, [location.id, graph, seed, tick]);

  // ── TTS narration ──
  const proseRef = useRef<HTMLDivElement>(null);
  const { enabled: narrationEnabled, isLoading, isSpeaking, speak, stop: stopNarration } = useNarration();

  const handleNarrateProse = useCallback(() => {
    if (isSpeaking || isLoading) {
      stopNarration();
    } else if (locationProse) {
      speak(locationProse);
    }
  }, [isSpeaking, isLoading, stopNarration, speak, locationProse]);

  // Lazily ensure sublocations exist, then read them from graph (memoized)
  const sublocationData = useMemo(() => {
    if (!graph) return { sublocations: [], groupedAgents: new Map() };

    // Lazy creation: ensure sublocation instances exist for this location
    // Uses locationSubtype → SUBTYPE_SUBLOCATION_MAP, deterministic via seed
    const sublocationSeed = seed ?? 42;
    ensureSublocations(graph, location.id, sublocationSeed);

    const subs = getVisibleSubLocations(graph, location.id);
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
        tick={tick}
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
          borderColor: 'var(--border-gold)',
        }}
      >
        {/* Location icon placeholder */}
        <div
          className="w-10 h-10 rounded-full border flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-raised)',
            borderColor: 'var(--border-gold)',
          }}
        />

        <div className="flex-1">
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

        <button
          onClick={onBack}
          aria-label="close"
          className="transition-colors text-xl px-2 cursor-pointer flex-shrink-0"
          style={{ color: 'var(--accent-gold)' }}
        >
          ✕
        </button>
      </div>

      {/* Prose + concept art placeholder */}
      {locationProse ? (
        <div className="mx-6 mt-5 flex gap-4" style={{ minHeight: '160px', maxHeight: '220px', maxWidth: '820px' }}>
          {/* Prose column */}
          <div
            ref={proseRef}
            className="flex-1 min-w-0 rounded-lg border p-4 overflow-y-auto relative"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--border-gold)',
            }}
          >
            {/* TTS narrate button */}
            {narrationEnabled && (
              <button
                onClick={handleNarrateProse}
                title={isSpeaking ? 'Stop narration' : isLoading ? 'Loading...' : 'Narrate description'}
                aria-label={isSpeaking ? 'Stop narration' : 'Narrate description'}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '22px',
                  height: '22px',
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  cursor: isLoading ? 'wait' : 'pointer',
                  color: isSpeaking ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {isLoading ? (
                  <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                ) : isSpeaking ? (
                  <Square size={8} />
                ) : (
                  <Play size={10} style={{ marginLeft: '1px' }} />
                )}
              </button>
            )}
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
          {/* Concept art placeholder — themed per location type */}
          <div
            className="rounded-lg border overflow-hidden flex items-center justify-center"
            style={{
              width: '40%',
              flexShrink: 0,
              background: locationArt.gradient,
              borderColor: 'var(--border-gold)',
              position: 'relative',
            }}
          >
            <span
              style={{
                fontSize: '56px',
                color: locationArt.glyphColor,
                opacity: 0.45,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
                userSelect: 'none',
              }}
              aria-hidden="true"
            >
              {locationArt.glyph}
            </span>
            <span
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '10px',
                fontSize: 'var(--text-xs)',
                color: locationArt.glyphColor,
                opacity: 0.35,
                fontFamily: 'var(--font-display)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              Concept Art
            </span>
          </div>
        </div>
      ) : (
        <div
          className="mx-6 mt-5 rounded-lg border overflow-hidden flex items-center justify-center"
          style={{
            aspectRatio: '16/9',
            maxHeight: '220px',
            background: locationArt.gradient,
            borderColor: 'var(--border-gold)',
            position: 'relative',
          }}
        >
          <span
            style={{
              fontSize: '64px',
              color: locationArt.glyphColor,
              opacity: 0.35,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            {locationArt.glyph}
          </span>
          <span
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: 'var(--text-xs)',
              color: locationArt.glyphColor,
              opacity: 0.3,
              fontFamily: 'var(--font-display)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            Concept Art
          </span>
        </div>
      )}

      {/* Conditional: Sublocation view or flat layout */}
      {sublocationData.sublocations.length > 0 ? (
        // ──── SUBLOCATION VIEW ────
        <div className="flex-1 flex flex-col overflow-y-auto px-6 py-6">
          <SectionHeading>Sublocations</SectionHeading>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2" style={{ maxWidth: '820px' }}>
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
                  onEncounterClick={onEncounterClick}
                  onEnter={handleEnterSublocation}
                />
              );
            })}
          </div>
        </div>
      ) : (
        // ──── FLAT LAYOUT (NO SUBLOCATIONS) ────
        <div className="flex-1 flex gap-6 p-6 min-h-0">
          {/* Left: Agents Present + Inhabitants */}
          <div className="flex-1 min-w-0">
            {(() => {
              // Split agents into spotlight agents (legacy + tier=spotlight) and NPCs (ambient/notable)
              const spotlightAgents = agents.filter(a => {
                const tier = (a.properties as Record<string, unknown>)?.spotlightTier;
                return !tier || tier === 'spotlight';
              });
              const npcsAtLocation = agents.filter(a => {
                const tier = (a.properties as Record<string, unknown>)?.spotlightTier;
                return tier === 'ambient' || tier === 'notable';
              });

              return (
                <>
                  <SectionHeading>Agents Present</SectionHeading>

                  {spotlightAgents.length === 0 ? (
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
                      {spotlightAgents.map(agent => {
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

                  {/* Inhabitants (ambient/notable NPCs) */}
                  {npcsAtLocation.length > 0 && (
                    <div className="mt-3">
                      <SectionHeading>Inhabitants</SectionHeading>
                      <div className="flex flex-col gap-1">
                        {npcsAtLocation.map(npc => {
                          const npcRarity = ((npc.properties as Record<string, unknown>)?.rarityTier ?? 1) as RarityTier;
                          const npcRarityColor = RARITY_TIER_COLORS[npcRarity] ?? RARITY_TIER_COLORS[1];
                          return (
                            <button
                              key={npc.id}
                              onClick={() => onAgentClick(npc.id)}
                              className="flex items-center justify-between px-2 py-1 rounded hover:bg-zinc-800/50 text-left w-full"
                              style={{ borderLeft: `3px solid ${npcRarityColor}` }}
                            >
                              <span className="text-sm text-zinc-300">{npc.name}</span>
                              <span className="text-xs text-zinc-500">
                                {((npc.properties as Record<string, unknown>).npcRole as string)?.replace(/_/g, ' ')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
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
                            borderColor: 'var(--border-gold)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-gold)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-gold)';
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
