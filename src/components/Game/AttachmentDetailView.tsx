import React from 'react';
import type { AttachmentTier } from '../../types/attachments';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../types/attachments';
import type { ActionTriggerEffect } from '../../types/effects';
import { ACTION_TRIGGER_DEFAULT_PROBABILITY } from '../../data/effect-constants';
import type { ChipDescriptor, Section as DetailSection, TriggerRow } from '../../types/detailPage';
import { Section } from '../shared/Section';
import { Medallion } from '../shared/Medallion';
import { FlavorQuote } from '../shared/FlavorQuote';
import { pickFallbackFlavor } from '../../data/reveal-content';
import { getAttachmentGlyph } from './attachmentGlyphs';
import { durationLabel } from '../../engine/aftermathWords';
import { resolveConditionEffectLine } from '../../engine/attachmentTemplateIndex';
import { contentTagTooltipId, getContentTag, type ContentTagAxis } from '../../data/content-tags';

/**
 * One glyph per axis, so a chip's *kind* reads before its word does — the same
 * vocabulary the codex filter row paints (THR-1486).
 */
const TAG_AXIS_GLYPH: Readonly<Record<ContentTagAxis, string>> = {
  form: '◇',     // ◇ — what the thing is
  family: '○',   // ○ — what class it belongs to
  reach: '◈',    // ◈ — the cosmology's doing axis
  sphere: '✦',   // ✦ — the cosmology's fuelling axis
  polarity: '●', // ● — good or ill to carry
};

/** Axis glyph for a tag the vocabulary no longer knows — a chip without one reads as broken. */
const TAG_GLYPH_FALLBACK = '◈';

export interface AttachmentDetailData {
  id: string;
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  flavorText?: string;
  tags: string[];
  lossCondition?: string;
  grantedBy?: string;
  agreementType?: string;
  source?: string;
  image?: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  /** On-use behavior read from `action_trigger` effects (THR-719, was `onUseTriggers`). */
  actionTriggers?: readonly ActionTriggerEffect[];
}

interface AttachmentDetailViewProps {
  attachment: AttachmentDetailData;
  onBack: () => void;
  onViewCodex?: () => void;
}

/** Player-facing names for the events a trigger fires on (THR-719). */
const TRIGGER_EVENT_LABELS: Record<string, string> = {
  encounter_critical_success: 'Critical success',
  encounter_success: 'Success',
  encounter_at_cost: 'Success at cost',
  encounter_failure: 'Failure',
  encounter_critical_failure: 'Critical failure',
  action_complete: 'Any use',
  movement_complete: 'Arrival',
  rest: 'Rest',
  spell_cast: 'Spell cast',
};

/** Format a trigger event for display (encounter_critical_failure → Critical failure) */
function formatTriggerEvent(event: string): string {
  return TRIGGER_EVENT_LABELS[event]
    ?? event.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

/** Format a trigger payload into a human-readable summary */
function formatEffectSummary(trigger: ActionTriggerEffect): string {
  const parts: string[] = [];
  const payload = trigger.payload;
  parts.push(payload.kind.replace(/_/g, ' '));
  if (payload.kind === 'condition_grant' && payload.durationTicks != null) {
    // THR-1425: a granted condition's term is a duration, so it takes `durationLabel` —
    // the same reading THR-1423 gave the remaining terms, not the elapsed sibling.
    parts.push(`(${durationLabel(payload.durationTicks)})`);
  }
  if (trigger.maxFires !== undefined) {
    parts.push(trigger.maxFires === 1 ? '(once)' : `(${trigger.maxFires}x)`);
  }
  return parts.join(' ');
}

/**
 * The sheet's prose lines are plain authored text, not prose-engine markup — but a
 * `ProseSection` is rendered as markup (it carries `<span class="term">` wiring for the
 * pages that have it). So the lines are escaped on the way in. The retiring `EntityCard`
 * rendered them as a text node, and escaping is what keeps that reading exactly: an
 * attachment whose summary contains a `<` is a word, not a tag.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** A plain-text prose section, one line per entry, blank entries dropped. */
function proseSection(
  typeId: string,
  label: string,
  lines: ReadonlyArray<string | null | undefined>,
): DetailSection {
  return {
    kind: 'prose',
    label,
    gold: false,
    tier: 'routine',
    typeId,
    source: 'attachment-detail-view',
    prose: lines.filter(Boolean).map(line => escapeHtml(line as string)).join('<br />'),
  };
}

export const AttachmentDetailView = React.memo(function AttachmentDetailView({
  attachment,
  onBack,
  onViewCodex,
}: AttachmentDetailViewProps) {
  const tierColor = ATTACHMENT_TIER_COLORS[attachment.tier];
  const tierName = ATTACHMENT_TIER_NAMES[attachment.tier];
  const glyph = getAttachmentGlyph(attachment.subcategory);

  const kindLine = `${tierName} · ${attachment.subcategory.replace(/_/g, ' ')}`;

  // The tier/kind line lives in the ceremonial banner below (THR-799), so the header
  // does not repeat it as a subtitle — the name lives in the header, the kind in the
  // banner, each said once.
  const sections: DetailSection[] = [];

  // Flavor text is not a section — THR-799 promotes it into the ceremonial header's
  // FlavorQuote well, above the mechanical effect line (narrative before mechanics).
  // Falls back to the generic per-kind line only when the attachment carries no prose
  // of its own.
  const flavorLine = attachment.flavorText || pickFallbackFlavor('attachment', attachment.id);

  // THR-1475 — what a condition actually does, above the line that describes how
  // it feels. The same `conditionEffectLine` the hover draws, reached through the
  // same id-keyed resolver (Law 27: one rule, one place), so the tooltip and this
  // row cannot drift into two readings of one state.
  //
  // `totalTicks` is passed and `ticksRemaining` is not: this row states the term
  // the bearer was given, and the Duration section below states what is left of
  // it. Two questions, each answered once.
  const conditionEffect = resolveConditionEffectLine(attachment.id, {
    totalTicks: attachment.totalTicks,
  });

  // Effect (always)
  sections.push(proseSection('effect', 'Effect', [
    conditionEffect?.line ?? null,
    attachment.mechanicalSummary,
    attachment.lossCondition ? `Loss: ${attachment.lossCondition}` : null,
    attachment.grantedBy ? `Granted by ${attachment.grantedBy}` : null,
    attachment.agreementType ? `Type: ${attachment.agreementType}` : null,
  ]));

  // Duration (transient only)
  if (attachment.ticksRemaining != null && attachment.totalTicks) {
    // THR-1423: was `${ticksRemaining} / ${totalTicks} ticks` — two raw magnitudes
    // (Law 13) in an engine unit named nowhere player-facing (Law 14). The `x / y`
    // pair is the same quantity the row's ProgressBar already draws, so the reading
    // keeps only the remaining term, which is what the section title asks for.
    sections.push(proseSection('duration', 'Duration', [
      `${durationLabel(attachment.ticksRemaining)} remaining`,
    ]));
  }

  // Tags (always if present) — chips, not a raw keyword cloud (THR-1486).
  //
  // The sheet printed `#iron` verbatim until slice 2: a raw key on a player surface
  // (Law 14) and a word with nothing behind it (Law 17). The chips read as the game's
  // own words and each one explains itself through the tag vocabulary; a spelling the
  // vocabulary no longer knows still renders, without a hover, because an entry whose
  // only description is a retired word should not become wordless.
  if (attachment.tags.length > 0) {
    const chips: ChipDescriptor[] = attachment.tags.map(tag => {
      const def = getContentTag(tag);
      const bare = (tag.startsWith('#') ? tag.slice(1) : tag).replace(/_/g, ' ');
      return {
        label: bare,
        tooltipId: def ? contentTagTooltipId(def.tag) : undefined,
        glyph: def ? TAG_AXIS_GLYPH[def.axis] : TAG_GLYPH_FALLBACK,
        dataKey: { attribute: 'content-tag', value: tag },
      };
    });
    sections.push({
      kind: 'chips',
      label: 'Tags',
      gold: false,
      tier: 'routine',
      typeId: 'tags',
      source: 'attachment-detail-view',
      chips,
    });
  }

  // Triggers (conditional)
  if (attachment.actionTriggers && attachment.actionTriggers.length > 0) {
    const triggers: TriggerRow[] = attachment.actionTriggers.map(t => ({
      condition: formatTriggerEvent(t.on),
      probability: typeof t.probability === 'number' && Number.isFinite(t.probability)
        ? t.probability
        : ACTION_TRIGGER_DEFAULT_PROBABILITY,
      narrativeTemplate: t.narrativeTemplate || undefined,
      effectSummary: formatEffectSummary(t),
    }));

    sections.push({
      kind: 'triggers',
      label: 'Triggers',
      gold: false,
      tier: 'routine',
      typeId: 'triggers',
      source: 'attachment-detail-view',
      triggers,
    });
  }

  // Source (conditional)
  if (attachment.source) {
    sections.push(proseSection('source', 'Source', [attachment.source]));
  }

  return (
    <div
      data-testid="attachment-detail-view"
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Header: the name, and the way out. The codex affordance renders only when a
          host wires one — THR-1492: both production mounts passed `undefined` and the
          retiring card turned that into a no-op handler, so the sheet carried two
          controls that did nothing when clicked. */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
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
              {attachment.name}
            </h2>
            {onViewCodex && (
              <button
                onClick={onViewCodex}
                className="flex-shrink-0 transition-opacity hover:opacity-70"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold)' }}
                aria-label={`Open full codex for ${attachment.name}`}
              >
                Codex →
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onBack}
          aria-label="close"
          className="transition-colors text-lg px-2 ml-2 flex-shrink-0"
          style={{ color: 'var(--accent-gold)' }}
        >
          ✕
        </button>
      </div>

      {/* Ceremonial banner (THR-799): art or glyph medallion → name/tier banner →
          flavor well. Layout only — every value shown is one the view already read.
          When real art exists it keeps its full art slot rather than being clipped
          down to a 64px disc; the medallion is the glyph fallback's treatment. */}
      <div
        className="flex flex-col items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ backgroundColor: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        {attachment.image ? (
          <img
            src={attachment.image}
            alt={attachment.name}
            loading="lazy"
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: '4px',
            }}
          />
        ) : (
          <Medallion size="md" accentColor={tierColor} title={`${tierName} ${attachment.subcategory.replace(/_/g, ' ')}`}>
            <span style={{ color: tierColor, lineHeight: 1 }}>{glyph}</span>
          </Medallion>
        )}

        <div
          className="inset-well w-full"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}
        >
          {kindLine}
        </div>

        <FlavorQuote style={{ width: '100%' }}>{flavorLine}</FlavorQuote>
      </div>

      {/* The section stack — the one section model every detail page renders (THR-1492). */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sections.map(section => (
          <Section key={section.typeId} section={section} />
        ))}
      </div>

      {onViewCodex && (
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
              backgroundColor: tierColor,
              color: 'var(--bg-abyss, #0a0a0e)',
              letterSpacing: '0.5px',
            }}
          >
            View Full Codex
          </button>
        </div>
      )}
    </div>
  );
});

AttachmentDetailView.displayName = 'AttachmentDetailView';
