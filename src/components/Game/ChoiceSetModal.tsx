/**
 * ChoiceSetModal — Player-facing UI for choice_set effects (TB-128).
 *
 * Layout mirrors InterventionConfirm: z-50 backdrop → centered panel →
 * header → option list → confirm button. Auto-pause is the caller's responsibility
 * (GameView calls setRunning(false) before setting pendingChoice).
 *
 * Countdown bar appears when timeoutMs is set; on expiry the first available
 * option is auto-selected and onResolve is called.
 */

import { useState, useEffect, useRef } from 'react';
import type { ChoiceOption } from '../../types/effects';
import type { PendingChoiceData } from '../../engine/effectExecutors';
import { Button } from '../shared/Button';
import { CHOICE_SET_DEFAULT_TIMEOUT_MS } from '../../data/effect-constants';

export interface ChoiceSetModalProps {
  pending: PendingChoiceData;
  onResolve: (choiceId: string, selectedOptionId: string) => void;
  onDismiss: () => void;
}

export function ChoiceSetModal({ pending, onResolve, onDismiss }: ChoiceSetModalProps) {
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

  function handleBackdropClick(e: React.MouseEvent) {
    e.stopPropagation();
    onDismiss();
  }

  const countdownPercent = timeoutMs > 0 ? (msLeft / timeoutMs) * 100 : 100;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleBackdropClick}
      />

      {/* Panel */}
      <div
        className="relative border rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-raised)',
          borderColor: 'var(--border-medium)',
          width: 'min(32rem, 92vw)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Countdown bar — top edge */}
        {timeoutMs > 0 && (
          <div
            className="h-1 transition-all duration-100"
            style={{
              width: `${countdownPercent}%`,
              backgroundColor: countdownPercent > 40
                ? 'var(--border-gold)'
                : countdownPercent > 15
                  ? 'var(--text-secondary)'
                  : 'var(--negative)',
            }}
          />
        )}

        {/* Content area */}
        <div className="px-6 pt-5 pb-5 flex flex-col gap-4 overflow-y-auto">

          {/* Header */}
          <div>
            <h3
              className="font-bold mb-1"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xl)',
                lineHeight: 1.2,
              }}
            >
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
      </div>
    </div>
  );
}
