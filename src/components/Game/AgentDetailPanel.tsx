import React from 'react';
import type { AgentDetail } from '../../engine/agentDetail';
import type { ReachDomain } from '../../types/traits';
import type { CooperationStrategy } from '../../types/disposition';
import { TIER_COLORS, ARCHETYPE_DOT_COLOR, FACTION_TAG_COLOR, FACTION_TAG_BACKGROUND, FACTION_TAG_BORDER, SENTIMENT_GREEN, SENTIMENT_RED } from '../../data/uiColorPalette';
import { AttachmentRow } from './AttachmentRow';
import { IntentSection } from './IntentSection';
import { Button } from '../shared/Button';
import { IconButton } from '../shared/IconButton';
import { SectionHeading } from '../shared/SectionHeading';

/** Max attachment rows shown per section before overflow */
const MAX_ATTACHMENT_ROWS = 5;

/** Activity summary for unified action display */
export interface ActivitySummary {
  actionName: string;
  stepLabel: string; // e.g. "Step 2/3" or "3/5 ticks"
  progressFraction: number; // 0-1 for progress bar
  isContested: boolean;
  opponentName?: string;
}

interface AgentDetailPanelProps {
  detail: AgentDetail;
  activity?: ActivitySummary | null;
  onBack: () => void;
  onViewPsyche: () => void;
  onIntervene: () => void;
  onLocationClick: (locationId: string) => void;
  onAttachmentClick?: (attachmentId: string) => void;
}

// Domain display names
const DOMAIN_NAMES: Record<ReachDomain, string> = {
  iron: 'Iron',
  gold: 'Gold',
  shadow: 'Shadow',
  veil: 'Veil',
  heart: 'Heart',
  eye: 'Eye',
  stone: 'Stone',
  star: 'Star',
  flesh: 'Flesh',
};

// Strategy display names
const STRATEGY_DISPLAY: Record<CooperationStrategy, string> = {
  'tit-for-tat': 'Tit for Tat',
  'grudger': 'Grudger',
  'pavlov': 'Pavlov',
  'always-cooperate': 'Always Cooperate',
  'always-defect': 'Always Defect',
};

// Grid layout order: 3x3
const DOMAINS_GRID: ReachDomain[][] = [
  ['iron', 'gold', 'shadow'],
  ['veil', 'heart', 'eye'],
  ['stone', 'star', 'flesh'],
];

export const AgentDetailPanel = React.memo(function AgentDetailPanel({
  detail,
  activity,
  onBack,
  onViewPsyche,
  onIntervene,
  onLocationClick,
  onAttachmentClick,
}: AgentDetailPanelProps) {
  const tierColor = TIER_COLORS[detail.tier] || '#78716c';
  const archetypeReaches = detail.archetype?.reachAffinities || [];

  return (
    <div className="flex flex-col h-full bg-stone-900 overflow-y-auto">
      {/* Header Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-stone-800/90 border-b border-amber-900/30 flex-shrink-0">
        <IconButton icon={<span>←</span>} size="sm" aria-label="back" onClick={onBack} />

        {/* Portrait thumbnail */}
        {detail.portraitUrl && (
          <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0">
            <img
              src={detail.portraitUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Agent name and tier */}
        <div className="flex-1">
          <h2
            className="text-amber-100 text-sm font-semibold tracking-wide"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {detail.name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tierColor }}
            />
            <span className="text-xs text-amber-400/80">{detail.tierName}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Archetype Banner */}
        {detail.archetype && (
          <div className="bg-stone-800/50 border border-amber-900/30 rounded px-3 py-2.5">
            <h3
              className="text-amber-100 text-sm font-semibold tracking-wide"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {detail.archetype.name}
            </h3>
            <p className="text-amber-400/80 text-xs italic mt-1">
              {detail.archetype.storyShape}
            </p>

            {/* Reach affinity dots */}
            {detail.archetype.reachAffinities.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {detail.archetype.reachAffinities.map(reach => (
                  <div
                    key={reach}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: ARCHETYPE_DOT_COLOR,
                    }}
                    title={DOMAIN_NAMES[reach]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Faction tag */}
        {detail.factionName && (
          <div className="inline-block">
            <span
              className="inline-block px-2.5 py-1 text-xs font-medium rounded"
              style={{
                color: FACTION_TAG_COLOR,
                backgroundColor: FACTION_TAG_BACKGROUND,
                border: `1px solid ${FACTION_TAG_BORDER}`,
              }}
            >
              {detail.factionName}
            </span>
          </div>
        )}

        {/* Domain Grid */}
        <div>
          <SectionHeading>
            Domains
          </SectionHeading>
          <div className="space-y-2">
            {DOMAINS_GRID.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-3 gap-2">
                {row.map(domain => {
                  const score = detail.domainCapabilities[domain] || 0;
                  const percentage = Math.min((score / 10) * 100, 100);
                  const isAffinity = archetypeReaches.includes(domain);

                  return (
                    <div key={domain} className="flex flex-col">
                      <span
                        className={`text-xs font-medium mb-1 ${
                          isAffinity ? 'text-amber-100' : 'text-amber-400/70'
                        }`}
                      >
                        {DOMAIN_NAMES[domain]}
                      </span>
                      <div className="bg-stone-700 rounded h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all duration-200"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-amber-400/70 mt-0.5">
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Intent Section — always visible in prototype */}
        <IntentSection intents={detail.intents ?? []} variant="panel" />

        {/* Values Section */}
        <div>
          <SectionHeading>
            Character
          </SectionHeading>
          <div className="space-y-1.5">
            {detail.topValues.map(val => {
              const absValue = Math.abs(val.value);
              const percentage = absValue * 100;

              return (
                <div key={val.pair} className="flex items-center gap-2">
                  <span className="text-xs text-amber-400/70 flex-1 truncate">
                    {val.label}
                  </span>
                  <div className="w-16 bg-stone-700 rounded h-1 overflow-hidden flex-shrink-0">
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonds Section */}
        <div>
          <SectionHeading>
            Bonds
          </SectionHeading>

          {detail.topBonds.length === 0 ? (
            <p className="text-amber-400/60 text-xs italic">No known bonds</p>
          ) : (
            <div className="space-y-1.5">
              {detail.topBonds.map(bond => {
                const sentimentColor =
                  bond.sentiment >= 0
                    ? SENTIMENT_GREEN
                    : SENTIMENT_RED;
                const sentimentWidth = Math.abs(bond.sentiment) * 100;

                return (
                  <div key={bond.targetId} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-100 flex-1 truncate">
                        {bond.targetName}
                      </span>
                      <span className="text-xs text-amber-400/70">
                        {bond.basis}
                      </span>
                    </div>
                    <div className="w-full bg-stone-700 rounded h-1 overflow-hidden">
                      <div
                        className="h-full transition-all duration-200"
                        style={{
                          width: `${sentimentWidth}%`,
                          backgroundColor: sentimentColor,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Possessions Section */}
        {detail.possessions && detail.possessions.length > 0 && (
          <div>
            <SectionHeading>
              Possessions
            </SectionHeading>
            <div className="space-y-1.5">
              {detail.possessions.slice(0, MAX_ATTACHMENT_ROWS).map(att => (
                <AttachmentRow
                  key={att.id}
                  name={att.name}
                  subcategory={att.subcategory}
                  tier={att.tier}
                  mechanicalSummary={att.mechanicalSummary}
                  ticksRemaining={att.ticksRemaining}
                  totalTicks={att.totalTicks}
                  durationLabel={att.durationLabel}
                  onClick={onAttachmentClick ? () => onAttachmentClick(att.id) : undefined}
                />
              ))}
              {detail.possessions.length > MAX_ATTACHMENT_ROWS && (
                <p className="text-amber-400/60 text-xs italic">
                  and {detail.possessions.length - MAX_ATTACHMENT_ROWS} more…
                </p>
              )}
            </div>
          </div>
        )}
        {detail.possessions != null && detail.possessions.length === 0 && (
          <div>
            <SectionHeading>
              Possessions
            </SectionHeading>
            <p className="text-amber-400/60 text-xs italic animate-breathe">They carry nothing of note.</p>
          </div>
        )}

        {/* Conditions Section */}
        {detail.conditions && detail.conditions.length > 0 && (
          <div>
            <SectionHeading>
              Conditions
            </SectionHeading>
            <div className="space-y-1.5">
              {detail.conditions.slice(0, MAX_ATTACHMENT_ROWS).map(att => (
                <AttachmentRow
                  key={att.id}
                  name={att.name}
                  subcategory={att.subcategory}
                  tier={att.tier}
                  mechanicalSummary={att.mechanicalSummary}
                  ticksRemaining={att.ticksRemaining}
                  totalTicks={att.totalTicks}
                  durationLabel={att.durationLabel}
                  onClick={onAttachmentClick ? () => onAttachmentClick(att.id) : undefined}
                />
              ))}
              {detail.conditions.length > MAX_ATTACHMENT_ROWS && (
                <p className="text-amber-400/60 text-xs italic">
                  and {detail.conditions.length - MAX_ATTACHMENT_ROWS} more…
                </p>
              )}
            </div>
          </div>
        )}

        {/* Powers & Agreements Section */}
        {detail.powersAndAgreements && detail.powersAndAgreements.length > 0 && (
          <div>
            <SectionHeading>
              Powers & Agreements
            </SectionHeading>
            <div className="space-y-1.5">
              {detail.powersAndAgreements.slice(0, MAX_ATTACHMENT_ROWS).map(att => (
                <AttachmentRow
                  key={att.id}
                  name={att.name}
                  subcategory={att.subcategory}
                  tier={att.tier}
                  mechanicalSummary={att.mechanicalSummary}
                  ticksRemaining={att.ticksRemaining}
                  totalTicks={att.totalTicks}
                  durationLabel={att.durationLabel}
                  onClick={onAttachmentClick ? () => onAttachmentClick(att.id) : undefined}
                />
              ))}
              {detail.powersAndAgreements.length > MAX_ATTACHMENT_ROWS && (
                <p className="text-amber-400/60 text-xs italic">
                  and {detail.powersAndAgreements.length - MAX_ATTACHMENT_ROWS} more…
                </p>
              )}
            </div>
          </div>
        )}

        {/* Strategy Section */}
        <div>
          <SectionHeading>
            Disposition
          </SectionHeading>

          {detail.cooperationStrategy == null ? (
            <p className="text-amber-400/60 text-xs italic">No known strategy</p>
          ) : (
            <div className="space-y-2.5">
              {/* Strategy name */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400/70">Strategy:</span>
                <span className="text-xs text-amber-100">
                  {STRATEGY_DISPLAY[detail.cooperationStrategy]}
                </span>
              </div>

              {/* Reputation bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-400/70">Reputation</span>
                  <span className="text-xs text-amber-400/70">
                    {detail.reputationScore.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-stone-700 rounded h-1.5 overflow-hidden relative">
                  {/* Center marker at 0.5 */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-amber-400/30"
                    style={{ left: '50%' }}
                  />
                  <div
                    className="h-full transition-all duration-200 rounded"
                    style={{
                      width: `${detail.reputationScore * 100}%`,
                      backgroundColor: detail.reputationScore >= 0.5 ? SENTIMENT_GREEN : SENTIMENT_RED,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>

              {/* Recent interactions */}
              {detail.recentInteractions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-amber-400/70 uppercase tracking-wider">
                    Recent
                  </span>
                  {detail.recentInteractions.map((ir, idx) => (
                    <div
                      key={`${ir.tick}-${idx}`}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="text-amber-400/60 w-8 text-right flex-shrink-0">
                        t{ir.tick}
                      </span>
                      <span title={`Actor: ${ir.actorMove}`}>
                        {ir.actorMove === 'cooperate' ? '✓' : '✗'}
                      </span>
                      <span className="text-amber-400/70">vs</span>
                      <span title={`Target: ${ir.targetMove}`}>
                        {ir.targetMove === 'cooperate' ? '✓' : '✗'}
                      </span>
                      <span className="text-amber-400/60 flex-1 truncate">
                        {ir.stakes === 'high' ? '✦' : ''} {ir.context}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Link */}
        <div className="text-xs">
          <span className="text-amber-400/70">Location: </span>
          <button
            onClick={() => onLocationClick(detail.locationId)}
            className="text-amber-100 hover:text-amber-200 underline transition-colors"
          >
            {detail.locationName}
          </button>
        </div>
      </div>

      {/* Activity Section */}
      {activity && (
        <div className="px-4 py-2 border-t border-amber-900/20">
          <div className="text-xs text-amber-400/70 mb-1">Activity</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-100 font-medium truncate flex-1">
              {activity.actionName}
            </span>
            <span className="text-xs text-amber-400/60 whitespace-nowrap">
              {activity.stepLabel}
            </span>
          </div>
          <div className="mt-1 h-1 bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(activity.progressFraction * 100)}%`,
                backgroundColor: activity.isContested ? '#dc2626' : '#d97706',
              }}
            />
          </div>
          {activity.isContested && activity.opponentName && (
            <div className="text-xs text-red-400/70 mt-0.5">
              Contested by {activity.opponentName}
            </div>
          )}
        </div>
      )}

      {/* Action Row Footer */}
      <div className="flex gap-2 px-4 py-3 bg-stone-800/50 border-t border-amber-900/30 flex-shrink-0">
        <Button variant="secondary" size="sm" fullWidth onClick={onViewPsyche}>
          View Psyche
        </Button>
        <Button variant="primary" size="sm" fullWidth onClick={onIntervene}>
          Intervene
        </Button>
      </div>
    </div>
  );
});
