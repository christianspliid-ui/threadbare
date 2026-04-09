import React from 'react';
import type { RetinueAgent } from '../../engine/retinue';
import type { EncounterProgress, EncounterTemplate } from '../../types/encounter';
import { Tooltip } from '../shared/Tooltip';
import { SectionHeading } from '../shared/SectionHeading';
import { IconButton } from '../shared/IconButton';
import { StepDots } from '../shared/StepDots';
import { TIER_COLORS, TIER_COLOR_DEFAULT } from '../../data/uiColorPalette';
import { getEncounterActivityGlyph, getEncounterActivityIconKey } from './encounterActivityPresentation';

interface RetinuePanelProps {
  agents: RetinueAgent[];
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
  onCenterOnHex?: (locationId: string) => void;
  onZoomToLocation?: (locationId: string) => void;
  activeEncounters?: Map<string, { progress: EncounterProgress; template: EncounterTemplate }>;
  onEncounterClick?: (agentId: string, progress: EncounterProgress, template: EncounterTemplate) => void;
  onToggleAttentionMode?: (threadEdgeId: string) => void;
}

export const RetinuePanel = React.memo(function RetinuePanel({ agents, selectedAgentId, onAgentSelect, onCenterOnHex, onZoomToLocation, activeEncounters, onEncounterClick, onToggleAttentionMode }: RetinuePanelProps) {
  if (agents.length === 0) {
    return (
      <div
        className="italic text-center py-2 animate-breathe"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        The threads of fate lie still. No souls yet attend your court.
      </div>
    );
  }

  // IA-002: Group agents by tier to avoid repeating tier labels per entry
  const uniqueTiers = new Set(agents.map(a => a.tier));
  const showTierBadge = uniqueTiers.size > 1;

  return (
    <div className="space-y-2">
      <SectionHeading count={agents.length}>Retinue</SectionHeading>
      {/* IX-015: removed max-h — parent sidebar handles overflow scrolling */}
      <div className="space-y-1.5" role="list">
        {agents.map((agent) => {
          const tierColor = TIER_COLORS[agent.tier] || TIER_COLOR_DEFAULT;
          const isSelected = agent.id === selectedAgentId;

          return (
            <Tooltip key={agent.id} label={agent.name} desc={agent.tierName}>
              <div
                role="listitem"
                data-testid="retinue-entry"
                onClick={() => onAgentSelect(agent.id)}
                className={`
                  rounded px-2.5 py-1.5 border cursor-pointer
                  transition-colors active:opacity-90 duration-150
                  ${isSelected ? 'ring-2 ring-amber-400/60 border-amber-400/30' : ''}
                `}
                style={{
                  backgroundColor: 'var(--bg-raised)',
                  borderColor: isSelected ? undefined : 'var(--border-gold)',
                  borderLeftColor: tierColor,
                  borderLeftWidth: '3px',
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-raised)';
                }}
              >
                {/* Full-width portrait */}
                {agent.portraitUrl ? (
                  <div
                    className="overflow-hidden rounded-t"
                    style={{
                      margin: '-6px -10px 6px -10px',
                      aspectRatio: '3 / 4',
                      borderBottom: `2px solid ${tierColor}40`,
                    }}
                  >
                    <img
                      src={agent.portraitUrl}
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div
                    className="rounded-t"
                    style={{
                      margin: '-6px -10px 6px -10px',
                      height: 48,
                      background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}08)`,
                      borderBottom: `2px solid ${tierColor}40`,
                    }}
                  />
                )}

                {/* Agent name and optional tier badge */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="flex items-center gap-1 truncate flex-1">
                    <span
                      className="font-medium truncate"
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        opacity: 0.9,
                      }}
                    >
                      {agent.name}
                    </span>
                    {onCenterOnHex && (
                      <IconButton
                        icon={<span>&#x1F441;</span>}
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onCenterOnHex(agent.locationId); }}
                        aria-label={`Center map on ${agent.name}`}
                        title={`Center map on ${agent.name}`}
                        style={{ border: 'none', width: 'auto', height: 'auto', padding: 0, flexShrink: 0 }}
                      />
                    )}
                  </span>
                  {showTierBadge && (
                    <span
                      className="font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: tierColor,
                        backgroundColor: tierColor + '20',
                      }}
                    >
                      {agent.tierName}
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  <span className="truncate">{agent.locationName}</span>
                  {onZoomToLocation && (
                    <IconButton
                      icon={<span>&#x1F441;</span>}
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onZoomToLocation(agent.locationId); }}
                      aria-label={`Zoom to ${agent.locationName}`}
                      title={`Zoom to ${agent.locationName}`}
                      style={{ border: 'none', width: 'auto', height: 'auto', padding: 0 }}
                    />
                  )}
                </div>

                {/* Activity status */}
                <div
                  className="truncate italic"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: agent.activityLabel === 'Idling'
                      ? 'var(--text-quaternary, var(--text-tertiary))'
                      : 'var(--text-secondary)',
                    opacity: agent.activityLabel === 'Idling' ? 0.6 : 0.85,
                  }}
                >
                  {agent.activityLabel}
                </div>

                {/* Attention mode toggle (thread tier gated — TB-040) */}
                {agent.courtPosition && onToggleAttentionMode && (
                  <button
                    className="flex items-center gap-1 mt-0.5 text-left rounded px-1 py-0.5 transition-colors"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: agent.attentionMode === 'pause' ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAttentionMode(agent.threadEdgeId);
                    }}
                    aria-label={`Toggle attention mode for ${agent.name}`}
                    title={agent.attentionMode === 'pause'
                      ? 'Pause mode — encounters interrupt the game. Click to switch to auto-resolve.'
                      : 'Auto-resolve — encounters resolve silently. Click to switch to pause.'}
                  >
                    <span>{agent.attentionMode === 'pause' ? '⏸' : '▶'}</span>
                    <span>{agent.attentionMode === 'pause' ? 'Pause' : 'Auto'}</span>
                  </button>
                )}

                {/* Encounter badge (fourth line — only when active encounter exists) */}
                {(() => {
                  const enc = activeEncounters?.get(agent.id);
                  if (!enc) return null;
                  return (
                    <button
                      className="flex items-center gap-1.5 mt-0.5 w-full text-left rounded px-1 py-0.5 transition-colors"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--accent-gold)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEncounterClick?.(agent.id, enc.progress, enc.template);
                      }}
                      aria-label={`View encounter: ${enc.template.name}`}
                    >
                      <span>{getEncounterActivityGlyph(getEncounterActivityIconKey(enc.template.encounterType))}</span>
                      <span className="truncate flex-1">{enc.template.name}</span>
                      <StepDots
                        totalSteps={enc.template.steps.length}
                        currentStepIndex={enc.progress.currentEncounterIndex}
                        size={4}
                      />
                    </button>
                  );
                })()}
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
});
