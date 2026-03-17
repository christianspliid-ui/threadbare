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

interface IntentSectionProps {
  intents: ActiveIntent[];
  /** 'modal' uses CSS var tokens; 'panel' uses amber/stone Tailwind palette */
  variant?: 'modal' | 'panel';
}

/** Returns a string key summarising current intent state for change-detection */
function intentKey(intents: ActiveIntent[]): string {
  return intents.map(i => `${i.templateId}:${i.completedMilestones}`).join('|');
}

export function IntentSection({ intents, variant = 'modal' }: IntentSectionProps) {
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
        <h2
          className="font-bold mb-3"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Intent
        </h2>

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
                        fontSize: '10px',
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

                  {/* Row 5: reactive trigger */}
                  {intent.reactiveTrigger && (
                    <div
                      className="text-xs mt-1.5 italic"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Triggered by: {intent.reactiveTrigger.replace(/_/g, ' ')}
                    </div>
                  )}
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
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        Intent
      </h3>

      {intents.length === 0 ? (
        <p className="text-amber-400/30 text-xs italic">No discernible intent</p>
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
                  <span className="text-[11px] text-amber-100 font-medium truncate flex-1 mr-2">
                    <span style={{ color: categoryColor, marginRight: '4px' }}>
                      {CATEGORY_GLYPHS[intent.category]}
                    </span>
                    {intent.displayName}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-wider flex-shrink-0"
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

                {/* Row 4: reactive trigger */}
                {intent.reactiveTrigger && (
                  <div className="text-[9px] italic mt-1" style={{ color: `${categoryColor}99` }}>
                    ↳ {intent.reactiveTrigger.replace(/_/g, ' ')}
                  </div>
                )}
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
