/**
 * The moment queue — single writer for `state.pendingUndertakingMoments`
 * (THR-1299 slice 2).
 *
 * Doc 1 shipped the producer half of the moment stream and it died in the trace
 * buffer: `resolveMomentPresentation` computed `interrupt | badge | none` for every
 * checkpoint and nothing player-facing ever read the answer. This module is the
 * consumable half. Every emission site pushes a `UndertakingMomentRecord` through
 * `enqueueUndertakingMoments`; the surfaces (moment card, thread-row badge, arc
 * panel — slices 3–4) read the array and acknowledge through
 * `acknowledgeUndertakingMoment`.
 *
 * ## The receipts idiom, the moment vocabulary
 *
 * Capped FIFO with an idempotency flag is copied from `playerReceipts.ts` — the
 * shape that already keeps a headless run bounded when nothing acknowledges — but
 * the `modal | toast` vocabulary is deliberately **not** adopted. Moments are
 * `interrupt | badge | none` by review ruling 2.1: badges are the recovery surface
 * and a toast is neither, so a toast tier would re-open the dismiss-spam hazard the
 * review closed.
 *
 * ## Why every push, drop and acknowledgement traces
 *
 * The checkpoint trace already says what presentation was *computed*. What it
 * cannot say is whether anything ever *showed* it — which is the exact question
 * `undertaking-checkpoint-events` was registered LEAKED for. `moment_surface` is
 * that answer, one row per transition, so the interface map's LIVE claim in slice 3
 * rests on a trace a CLI sweep can count rather than on a component existing.
 */

import type { GameState } from '../types/gameState';
import type { UndertakingMomentRecord } from '../types/strategicAction';
import type { MomentSurfaceTrace } from '../types/trace';
import { MOMENT_QUEUE_MAX } from '../data/strategic-action-constants';
import { emitTrace } from './traceBuffer';

function traceMoment(
  event: MomentSurfaceTrace['event'],
  record: UndertakingMomentRecord,
  tick: number,
): void {
  emitTrace({
    category: 'moment_surface',
    tick,
    event,
    projectId: record.projectId,
    actorId: record.actorId,
    momentClass: record.momentClass,
    presentation: record.presentation,
    summary: `moment_surface: ${event} ${record.momentClass} (${record.presentation}) — ${record.label}`,
  } as MomentSurfaceTrace & { summary: string });
}

/**
 * Append records to the queue, holding the cap.
 *
 * Returns a new array (never mutates the input — phases return patches), or the
 * existing one untouched when there is nothing to add, so an unchanged queue does
 * not churn React state every tick.
 *
 * Idempotent on `id`: a record already present is skipped without a trace. The two
 * producers run in different phases of the same tick and both merge into the same
 * field, so a re-delivered record must not double-queue.
 *
 * Eviction is oldest-first, **acknowledged records first**: an acknowledged record
 * has done its work and only lingers for the badge count, so it is the cheapest
 * thing to lose. Only an *unacknowledged* eviction traces `dropped` — that is the
 * one the player never saw.
 */
export function enqueueUndertakingMoments(
  queue: readonly UndertakingMomentRecord[] | undefined,
  incoming: readonly UndertakingMomentRecord[],
  tick: number,
): readonly UndertakingMomentRecord[] {
  const existing = queue ?? [];
  if (incoming.length === 0) return existing;

  const next: UndertakingMomentRecord[] = [...existing];
  const seen = new Set(existing.map(r => r.id));
  for (const record of incoming) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    next.push(record);
    traceMoment('queued', record, tick);
  }

  while (next.length > MOMENT_QUEUE_MAX) {
    const ackedIndex = next.findIndex(r => r.acknowledged);
    const victimIndex = ackedIndex >= 0 ? ackedIndex : 0;
    const [victim] = next.splice(victimIndex, 1);
    if (!victim.acknowledged) traceMoment('dropped', victim, tick);
  }

  return next;
}

/**
 * Mark one record acknowledged — the player dismissed its card, or opened it from
 * the badge. Returns the same array when the id is unknown or already acknowledged,
 * so a double-dismiss is a no-op rather than a second trace.
 *
 * The record stays in the queue: the badge counts it until the cap or retention
 * ages it out, which is what makes dismissal reversible (Law 40 — the badge is the
 * recovery route) rather than a Law 48 armed action.
 */
export function acknowledgeUndertakingMoment(
  queue: readonly UndertakingMomentRecord[] | undefined,
  momentId: string,
  tick: number,
): readonly UndertakingMomentRecord[] {
  const existing = queue ?? [];
  const index = existing.findIndex(r => r.id === momentId);
  if (index < 0 || existing[index].acknowledged) return existing;

  const acknowledged: UndertakingMomentRecord = { ...existing[index], acknowledged: true };
  traceMoment('acknowledged', acknowledged, tick);
  return [...existing.slice(0, index), acknowledged, ...existing.slice(index + 1)];
}

/**
 * Record that a surface showed this moment. Pure telemetry — no state changes —
 * so a card that opens and is left open traces once, and a badge-opened card
 * traces the same way an interrupt-opened one does (Law C1: one lesson).
 */
export function markUndertakingMomentOpened(record: UndertakingMomentRecord, tick: number): void {
  traceMoment('opened', record, tick);
}

/**
 * The record the moment card should show next: the **oldest** unacknowledged
 * interrupt-tier record, or `null`. Oldest-first is the collation rule (review M4,
 * Law 49) — a queue of interrupts is delivered in the order the world produced
 * them, never newest-first.
 */
export function nextInterruptMoment(
  queue: readonly UndertakingMomentRecord[] | undefined,
): UndertakingMomentRecord | null {
  return (queue ?? []).find(r => r.presentation === 'interrupt' && !r.acknowledged) ?? null;
}

/**
 * The queue as a surface reads it, optionally narrowed to one actor. Returns the
 * full record set including acknowledged ones — the badge model decides what it
 * counts, this does not pre-decide for it.
 */
export function getPendingUndertakingMoments(
  state: Pick<GameState, 'pendingUndertakingMoments'>,
  agentId?: string,
): readonly UndertakingMomentRecord[] {
  const queue = state.pendingUndertakingMoments ?? [];
  return agentId ? queue.filter(r => r.actorId === agentId) : queue;
}
