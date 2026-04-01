import { useEffect, useState } from 'react';
import type { AgentInfoCardData, AgentFullProfileData } from '../../engine/agentDetail';
import type { AgentKnowledge } from '../../types/agentKnowledge';
import { clampRarityTier } from '../../types/rarity';
import { RarityBadge } from '../shared/RarityBadge';
import { deriveArchetypeEpithet } from '../../engine/archetypeEpithet';
import { Tooltip } from '../shared/Tooltip';
import { Modal } from '../shared/Modal';
import { AttachmentDetailView } from './AttachmentDetailView';
import type { AttachmentDetailData } from './AttachmentDetailView';
import type { AttachmentFullEntry } from '../../engine/agentAttachments';
import type { AttachmentTier } from '../../types/attachments';
import { TabBar } from './tabs/TabBar';
import type { TabId } from './tabs/TabBar';
import { OverviewTab } from './tabs/OverviewTab';
import { ProwessTab } from './tabs/ProwessTab';
import { BondsTab } from './tabs/BondsTab';
import { JourneyTab } from './tabs/JourneyTab';
import { ChronicleTab } from './tabs/ChronicleTab';
import { AttachmentsTab } from './tabs/AttachmentsTab';
import { IconButton } from '../shared/IconButton';
import { getSphereColor } from '../../data/sphereIcons';

export interface AgentProfileModalProps {
  card: AgentInfoCardData;
  profile?: AgentFullProfileData;
  onClose: () => void;
  /** When true, auto-switch to the Chronicle tab on open (e.g. from a revelation alert) */
  scrollToNewStrata?: boolean;
  /** Per-agent multi-facet knowledge — when present, enables facet-gated sections */
  knowledge?: AgentKnowledge;
}

export function AgentProfileModal({ card, profile, onClose, scrollToNewStrata, knowledge }: AgentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>(
    scrollToNewStrata ? 'chronicle' : 'overview'
  );
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentDetailData | null>(null);
  const [portraitExpanded, setPortraitExpanded] = useState(false);

  // Custom escape: close attachment overlay first, then modal
  useEffect(() => {
    if (!selectedAttachment) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSelectedAttachment(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedAttachment]);

  // Switch to chronicle when scrollToNewStrata changes
  useEffect(() => {
    if (scrollToNewStrata) {
      setActiveTab('chronicle');
    }
  }, [scrollToNewStrata]);

  /** Convert an AttachmentFullEntry to AttachmentDetailData for the detail view */
  const toDetailData = (entry: AttachmentFullEntry): AttachmentDetailData => ({
    id: entry.id,
    name: entry.name,
    subcategory: entry.subcategory,
    tier: entry.tier as AttachmentTier,
    mechanicalSummary: entry.mechanicalSummary,
    flavorText: entry.flavorText,
    tags: entry.tags,
    lossCondition: entry.lossCondition,
    grantedBy: entry.grantedBy,
    agreementType: entry.agreementType,
    source: entry.source,
    image: entry.image,
    ticksRemaining: entry.ticksRemaining,
    totalTicks: entry.totalTicks,
    onUseTriggers: entry.onUseTriggers,
  });

  const handleAttachmentClick = (entry: AttachmentFullEntry) => {
    setSelectedAttachment(toDetailData(entry));
  };

  return (
    <Modal open={true} onClose={onClose} maxWidth={960}>
      {/* Header Zone */}
      <div className="border-b p-6 pb-4 relative" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="absolute top-4 right-4">
          <IconButton
            icon={<span>✕</span>}
            variant="close"
            size="sm"
            aria-label={`Close profile for ${card.name}`}
            onClick={onClose}
          />
        </div>
        <div className="flex gap-4 mb-3">
          {/* Portrait — 3:4 aspect ratio, click to expand */}
          <div
            data-testid="portrait-silhouette"
            className="rounded overflow-hidden flex-shrink-0"
            style={{
              width: '120px',
              minWidth: '120px',
              height: '160px',
              cursor: card.portraitUrl && card.knowledgeLevel !== 'stranger' ? 'pointer' : undefined,
              background:
                card.knowledgeLevel === 'stranger'
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(51,51,51,0.6) 100%)'
                  : !card.portraitUrl
                    ? 'linear-gradient(135deg, rgba(120,53,15,0.4) 0%, rgba(30,27,46,0.8) 100%)'
                    : undefined,
            }}
            onClick={() => {
              if (card.portraitUrl && card.knowledgeLevel !== 'stranger') setPortraitExpanded(true);
            }}
            role={card.portraitUrl && card.knowledgeLevel !== 'stranger' ? 'button' : undefined}
            tabIndex={card.portraitUrl && card.knowledgeLevel !== 'stranger' ? 0 : undefined}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && card.portraitUrl && card.knowledgeLevel !== 'stranger') {
                e.preventDefault();
                setPortraitExpanded(true);
              }
            }}
            aria-label={card.portraitUrl && card.knowledgeLevel !== 'stranger' ? `View full portrait of ${card.name}` : undefined}
          >
            {card.knowledgeLevel !== 'stranger' && card.portraitUrl && (
              <img
                src={card.portraitUrl}
                alt={`Portrait of ${card.name}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          {/* Header Text */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <h1
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                {card.name}
              </h1>
              {(() => {
                const tier = clampRarityTier(Number(card.rarityTier) || 1);
                return tier >= 2 ? (
                  <RarityBadge tier={tier} opacity={0.85} className="text-sm flex-shrink-0" />
                ) : null;
              })()}
            </div>

            {/* Archetype epithet — knowledge-gated, only when intimate+ (axiologicalProfile present) */}
            {card.axiologicalProfile && (() => {
              const epithet = deriveArchetypeEpithet(card.axiologicalProfile!);
              return epithet ? (
                <p style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 'var(--text-base)',
                  color: 'var(--accent-gold)',
                  letterSpacing: '0.04em',
                  fontStyle: 'italic',
                  marginTop: 'var(--space-1)',
                  marginBottom: 0,
                }}>
                  {epithet}
                </p>
              ) : null;
            })()}

            {/* Knowledge level badge */}
            <Tooltip label="Knowledge Level" desc="How well you know this agent. Grows through proximity, worship, scry, and narrative contact.">
              <div className="inline-block px-2 py-0.5 rounded text-xs mb-2 underline decoration-dotted cursor-help" style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--accent-gold)' }}>
                {card.knowledgeLevel}
              </div>
            </Tooltip>

            {/* Metadata */}
            <div className="space-y-1">
              {card.locationName && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Is at {card.locationName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Primary Sphere Indicator */}
        {card.primarySphere && (
          <div className="flex gap-2 items-center pt-2">
            <span className="text-xs" style={{ color: 'var(--accent-gold)' }}>Attuned to</span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getSphereColor(card.primarySphere) }}
            />
            <Tooltip id={`sphere.${card.primarySphere}`}>
              <span className="text-xs capitalize underline decoration-dotted cursor-help" style={{ color: 'var(--text-secondary)' }}>
                {card.primarySphere}
              </span>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Tabbed Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && (
          <OverviewTab card={card} profile={profile} knowledge={knowledge} />
        )}
        {activeTab === 'prowess' && (
          <ProwessTab card={card} knowledge={knowledge} onAttachmentClick={handleAttachmentClick} />
        )}
        {activeTab === 'attachments' && (
          <AttachmentsTab card={card} knowledge={knowledge} onAttachmentClick={handleAttachmentClick} />
        )}
        {activeTab === 'bonds' && (
          <BondsTab card={card} knowledge={knowledge} />
        )}
        {activeTab === 'journey' && (
          <JourneyTab card={card} knowledge={knowledge} />
        )}
        {activeTab === 'chronicle' && (
          <ChronicleTab
            card={card}
            profile={profile}
            knowledge={knowledge}
            scrollToNewStrata={scrollToNewStrata}
          />
        )}
      </div>

      {/* Portrait Lightbox */}
      {portraitExpanded && card.portraitUrl && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setPortraitExpanded(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') setPortraitExpanded(false); }}
          aria-label="Close portrait"
        >
          <img
            src={card.portraitUrl}
            alt={`Full portrait of ${card.name}`}
            style={{
              maxHeight: '90%',
              maxWidth: '90%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 48px rgba(0, 0, 0, 0.8)',
            }}
          />
        </div>
      )}

      {/* Attachment Detail Overlay (slide-in within modal) */}
      {selectedAttachment && (
        <div
          className="absolute inset-0 z-20 overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-surface)' }}
          data-testid="attachment-detail-overlay"
        >
          <AttachmentDetailView
            attachment={selectedAttachment}
            onBack={() => setSelectedAttachment(null)}
          />
        </div>
      )}
    </Modal>
  );
}
