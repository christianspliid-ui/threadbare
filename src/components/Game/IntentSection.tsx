/**
 * IntentSection — renders active ambitions for the character sheet modal
 * and the AgentDetailPanel sidebar.
 *
 * variant="modal"  → uses CSS var() tokens (AgentProfileModal style)
 * variant="panel"  → uses Tailwind amber/stone classes (AgentDetailPanel style)
 *
 * Pulse animation: when intents prop changes, the changed card briefly flashes
 * amber using the existing .pulse-gold CSS class.
 */
import { useEffect, useRef, useState } from 'react';
import type { ActiveIntent } from '../../engine/agentDetail';
import { CATEGORY_GLYPHS, CATEGORY_COLORS, CATEGORY_LABELS } from '../../data/ambition-categories';
import { SectionHeading } from '../shared/SectionHeading';
import { EntityLink } from '../shared/EntityLink';

interface IntentSectionProps {
  intents: ActiveIntent[];
  /** 'modal' uses CSS var tokens; 'panel' uses amber/stone Tailwind palette */
  variant?: 'modal' | 'panel';
  /** Opens the culprit's own sheet from a vendetta's provenance line (THR-1298). */
  onOpenEntity?: (id: string) => void;
}

/**
 * Where a drive came from, when it did not come from the agent (THR-1298 slice 7).
 *
 * Renders nothing for a self-chosen ambition, which is most of them — the line exists to
 * mark the ones the world put there, so printing it universally would erase the
 * distinction it is for.
 *
 * A vendetta reads as one sentence rather than a labelled field: "burning · against
 * Kael Thornweaver, after the razing of Thornhall" is the same three facts as three
 * key:value rows and is a thing a player can read (Laws 13/14; key:value is unfinished
 * UX). The heat is a word — the numeral stays in the engine.
 */
function ProvenanceLine({
  intent,
  color,
  onOpenEntity,
}: {
  intent: ActiveIntent;
  color: string;
  onOpenEntity?: (id: string) => void;
}) {
  const { grievance, mintedByLabel } = intent;
  if (!grievance && !mintedByLabel) return null;

  return (
    <div className="text-xs mt-1.5 italic" style={{ color: 'var(--text-tertiary)' }}>
      {grievance ? (
        <>
          <span style={{ color, fontStyle: 'normal' }}>{grievance.heatWord}</span>
          {grievance.culpritName && (
            <>
              {' · against '}
              {grievance.culpritId
                ? <EntityLink id={grievance.culpritId} name={grievance.culpritName} onOpenEntity={onOpenEntity} />
                : <span style={{ color: 'var(--text-primary)' }}>{grievance.culpritName}</span>}
            </>
          )}
          {mintedByLabel && `, after ${mintedByLabel}`}
        </>
      ) : (
        `Because of ${mintedByLabel}`
      )}
    </div>
  );
}

/** Returns a string key summarising current intent state for change-detection */
function intentKey(intents: ActiveIntent[]): string {
  return intents.map(i => `${i.templateId}:${i.completedMilestones}`).join('|');
}

export function IntentSection({ intents, variant = 'modal', onOpenEntity }: IntentSectionProps) {
  // ── Pulse animation on intent change ────────────────────────────
  const prevKeyRef = useRef<string>(intentKey(intents));
  const [pulsedTemplateIds, setPulsedTemplateIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentKey = intentKey(intents);
    if (currentKey === prevKeyRef.current) return;

    // Detect which templateIds changed (new, removed, or milestone updated)
    const prevKeys = new Set(prevKeyRef.current.split('|'));
    const changedIds = new Set<string>();
    for (const i of intents) {
      const entry = `${i.templateId}:${i.completedMilestones}`;
      if (!prevKeys.has(entry)) changedIds.add(i.templateId);
    }

    if (changedIds.size > 0) {
      setPulsedTemplateIds(changedIds);
      const timer = setTimeout(() => setPulsedTemplateIds(new Set()), 700);
      prevKeyRef.current = currentKey;
      return () => clearTimeout(timer);
    }

    prevKeyRef.current = currentKey;
  }, [intents]);

  // ── Modal variant ────────────────────────────────────────────────
  if (variant === 'modal') {
    return (
      <section>
        <SectionHeading as="h2">Intent</SectionHeading>

        {intents.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
            No discernible intent
          </p>
        ) : (
          <div className="space-y-3">
            {intents.map(intent => {
              const categoryColor = CATEGORY_COLORS[intent.category];
              const isPulsing = pulsedTemplateIds.has(intent.templateId);
              return (
                <div
                  key={intent.templateId}
                  className={isPulsing ? 'pulse-gold' : ''}
                  style={{
                    borderLeft: `3px solid ${categoryColor}`,
                    paddingLeft: '10px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    backgroundColor: `${categoryColor}11`,
                    borderRadius: '0 4px 4px 0',
                  }}
                >
                  {/* Row 1: glyph + name + priority badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span style={{ color: categoryColor, marginRight: '6px' }}>
                        {CATEGORY_GLYPHS[intent.category]}
                      </span>
                      {intent.displayName}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        color: categoryColor,
                        backgroundColor: `${categoryColor}22`,
                      }}
                    >
                      {intent.priority}
                    </span>
                  </div>

                  {/* Row 2: category label */}
                  <div
                    className="text-xs mb-1.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {CATEGORY_LABELS[intent.category]}
                  </div>

                  {/* Row 2b: the flavor line — the ambition's own authored prose,
                      surfaced rather than re-written (THR-1299 slice 4, THR-1279
                      verdict 2: NAME + flavor). Absent when the template authored
                      none; the name stands alone. */}
                  {intent.flavorText && (
                    <p
                      data-testid={`intent-flavor-${intent.templateId}`}
                      className="text-xs italic mb-1.5"
                      style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}
                    >
                      {intent.flavorText}
                    </p>
                  )}

                  {/* Row 3: milestone pips */}
                  <MilestonePips
                    completed={intent.completedMilestones}
                    required={intent.requiredMilestones}
                    color={categoryColor}
                  />

                  {/* Row 4: reach affinity dots */}
                  {Object.keys(intent.reachAffinity).length > 0 && (
                    <ReachAffinityDots
                      reachAffinity={intent.reachAffinity}
                      color={categoryColor}
                    />
                  )}

                  {/* Row 5: where this drive came from (THR-1298) */}
                  <ProvenanceLine intent={intent} color={categoryColor} onOpenEntity={onOpenEntity} />

                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  // ── Panel variant ────────────────────────────────────────────────
  return (
    <div>
      <h3
        className="text-amber-200/80 text-xs font-semibold tracking-wider uppercase mb-2.5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Intent
      </h3>

      {intents.length === 0 ? (
        <p className="text-amber-400/60 text-xs italic">No discernible intent</p>
      ) : (
        <div className="space-y-2">
          {intents.map(intent => {
            const categoryColor = CATEGORY_COLORS[intent.category];
            const isPulsing = pulsedTemplateIds.has(intent.templateId);
            return (
              <div
                key={intent.templateId}
                className={`rounded ${isPulsing ? 'pulse-gold' : ''}`}
                style={{
                  borderLeft: `2px solid ${categoryColor}`,
                  paddingLeft: '8px',
                  paddingTop: '5px',
                  paddingBottom: '5px',
                  backgroundColor: `${categoryColor}0f`,
                }}
              >
                {/* Row 1: glyph + name + priority */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-100 font-medium truncate flex-1 mr-2">
                    <span style={{ color: categoryColor, marginRight: '4px' }}>
                      {CATEGORY_GLYPHS[intent.category]}
                    </span>
                    {intent.displayName}
                  </span>
                  <span
                    className="text-xs uppercase tracking-wider flex-shrink-0"
                    style={{ color: `${categoryColor}cc` }}
                  >
                    {intent.priority}
                  </span>
                </div>

                {/* Row 2: milestone pips */}
                <MilestonePips
                  completed={intent.completedMilestones}
                  required={intent.requiredMilestones}
                  color={categoryColor}
                  size="sm"
                />

                {/* Row 3: reach affinity dots */}
                {Object.keys(intent.reachAffinity).length > 0 && (
                  <ReachAffinityDots
                    reachAffinity={intent.reachAffinity}
                    color={categoryColor}
                    size="sm"
                  />
                )}

                {/* Row 4: where this drive came from (THR-1298) */}
                <ProvenanceLine intent={intent} color={categoryColor} onOpenEntity={onOpenEntity} />

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

interface MilestonePipsProps {
  completed: number;
  required: number;
  color: string;
  size?: 'md' | 'sm';
}

function MilestonePips({ completed, required, color, size = 'md' }: MilestonePipsProps) {
  if (required === 0) return null;
  const pipSize = size === 'sm' ? 6 : 8;
  return (
    <div className="flex gap-1 mt-1" aria-label={`${completed} of ${required} milestones`}>
      {Array.from({ length: required }).map((_, idx) => (
        <div
          key={idx}
          style={{
            width: pipSize,
            height: pipSize,
            borderRadius: '50%',
            backgroundColor: idx < completed ? color : 'transparent',
            border: `1px solid ${color}`,
            opacity: idx < completed ? 1 : 0.4,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

interface ReachAffinityDotsProps {
  reachAffinity: Partial<Record<string, number>>;
  color: string;
  size?: 'md' | 'sm';
}

function ReachAffinityDots({ reachAffinity, color, size = 'md' }: ReachAffinityDotsProps) {
  const domains = Object.keys(reachAffinity);
  if (domains.length === 0) return null;
  const dotSize = size === 'sm' ? 5 : 6;
  return (
    <div className="flex gap-1 mt-1.5 flex-wrap">
      {domains.map(domain => (
        <div
          key={domain}
          title={domain}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: color,
            opacity: 0.7,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
