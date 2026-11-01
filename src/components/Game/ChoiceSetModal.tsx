/**
 * ChoiceSetModal — Player-facing UI for choice_set effects (TB-128).
 *
 * A `Modal` at the S tier (THR-1880, Law 57): header → option list → confirm
 * button. The options grow to the 85vh cap before the list scrolls; Escape or a
 * backdrop click defers, as the Defer button does. Auto-pause is the caller's responsibility
 * (GameView calls setRunning(false) before setting pendingChoice).
 *
 * Countdown bar appears when timeoutMs is set; on expiry the first available
 * option is auto-selected and onResolve is called.
 */

import { useState, useEffect, useRef } from 'react';
import type { ChoiceOption } from '../../types/effects';
import type { PendingChoiceData } from '../../engine/effectExecutors';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { CHOICE_SET_DEFAULT_TIMEOUT_MS } from '../../data/effect-constants';
import { Icon } from '../shared/Icon';
import { EntityVisual } from '../shared/EntityVisual';
import type { EntityVisualDescriptor } from '../../engine/views/entityVisualResolver';
import { dialogHeadingIcon } from '../../data/view-content';

export interface ChoiceSetModalProps {
  pending: PendingChoiceData;
  onResolve: (choiceId: string, selectedOptionId: string) => void;
  onDismiss: () => void;
  /** THR-2101 (S5.1) — the mortal choosing, resolved by the dialog host; absent → no face. */
  chooserFace?: EntityVisualDescriptor | null;
}

export function ChoiceSetModal({ pending, onResolve, onDismiss, chooserFace }: ChoiceSetModalProps) {
  const headingIcon = dialogHeadingIcon('choice');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timeoutMs = pending.timeoutMs ?? CHOICE_SET_DEFAULT_TIMEOUT_MS;
  const [msLeft, setMsLeft] = useState(timeoutMs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (timeoutMs <= 0) return;
    const startedAt = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, timeoutMs - elapsed);
      setMsLeft(remaining);
      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        // Auto-resolve: pick first option
        onResolve(pending.choiceId, pending.options[0].id);
      }
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pending.choiceId, pending.options, timeoutMs, onResolve]);

  // ── Handlers ─────────────────────────────────────────────────────
  function handleConfirm() {
    if (!selectedId) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    onResolve(pending.choiceId, selectedId);
  }

  const countdownPercent = timeoutMs > 0 ? (msLeft / timeoutMs) * 100 : 100;

  return (
    <Modal open onClose={onDismiss} size="s" aria-label="A choice presents itself">
      {/* Countdown bar — top edge */}
      {timeoutMs > 0 && (
        <div
          className="h-1 transition-all duration-100"
          style={{
            width: `${countdownPercent}%`,
            flexShrink: 0,
            backgroundColor: countdownPercent > 40
              ? 'var(--border-gold)'
              : countdownPercent > 15
                ? 'var(--text-secondary)'
                : 'var(--negative)',
          }}
        />
      )}

      {/* Content area */}
      <div data-testid="choice-set-modal" className="px-6 pt-5 pb-5 flex flex-col gap-4 overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>

        {/* Header — the chooser's face beside the heading (THR-2101) */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {chooserFace && (
            <span data-dialog-face={chooserFace.tier} style={{ display: 'inline-flex' }}>
              <EntityVisual size="chip" descriptor={chooserFace} />
            </span>
          )}
        <div style={{ minWidth: 0 }}>
          <h3
            className="font-bold mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xl)',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {headingIcon && (
              <span data-dialog-heading-icon={headingIcon} style={{ display: 'inline-flex' }}>
                <Icon name={headingIcon} size="chip" decorative />
              </span>
            )}
            A choice presents itself.
          </h3>
          <p
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {timeoutMs > 0
              ? `Choose before the moment passes — ${Math.ceil(msLeft / 1000)}s remaining`
              : 'Select an option to continue.'}
          </p>
        </div>
        </div>

        {/* Option cards */}
        <div className="flex flex-col gap-2">
          {pending.options.map((option: ChoiceOption) => {
            const isSelected = selectedId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedId(option.id)}
                className="text-left w-full rounded-lg border p-4 transition-colors"
                style={{
                  backgroundColor: isSelected ? 'var(--bg-deep)' : 'transparent',
                  borderColor: isSelected ? 'var(--border-gold)' : 'var(--border-medium)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="font-semibold mb-1"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  {option.label}
                </div>
                <p
                  className="leading-relaxed"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Commit
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onDismiss}
          >
            Defer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
