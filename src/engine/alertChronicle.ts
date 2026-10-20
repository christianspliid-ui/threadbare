/**
 * Alert Chronicle intake — news that leaves Needs you lives on in the Chronicle
 * (THR-1896, frame plan THR-1875 § F5; frame decision THR-1828 call 4).
 *
 * A News row in Needs you lapses after `NEEDS_YOU_NEWS_KEEP_DAYS`. The frame promised
 * the thing then "lives on in the Chronicle", but the Chronicle intake
 * (`phaseNarrative`) only takes events at significance 0.8 and above, and it runs
 * before the `post-narrative` slot — so a mandate milestone could never reach it, and
 * a faction promotion (0.7), an abandoned ambition (0.5) or a prayer (0.4) never did.
 *
 * This pass runs once, at the very end of the tick's event phases. For every event
 * on the tick that carries `notification.channel: 'alert'` it writes one Witness-voice
 * Chronicle line — the event's own words (`playerProse ?? message`), no new prose
 * voice — unless:
 *
 *   - the Chronicle already holds a line with the event's id (`phaseNarrative` took it);
 *   - `ALERT_CHRONICLE_POLICY` names an exemption for its type;
 *   - the threading gate suppresses it (`resolveEventRouting` → `suppress`), or its hex
 *     is not visible this tick (`filterEventsByVisibility`, the fog filter News applies):
 *     the player never saw that alert in News, so the Chronicle does not tell it either.
 *
 * **One list.** Every alert producer in `src/engine` carries an
 * `// alert-chronicle: <type>` marker naming the event type(s) it raises, and every
 * named type has a row in `ALERT_CHRONICLE_POLICY`. `alertChronicle.test.ts` scans the
 * source and fails, naming the file and line, on an alert site with no marker or a
 * marker whose type has no row.
 *
 * Pure apart from one aggregate trace per tick; fail-soft (a throw writes nothing).
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | ALERT_CHRONICLE_ENABLED | true | Off → no alert writes a Chronicle line of its own |
 * | ALERT_CHRONICLE_TITLE_CHARS | 50 | Title length, the same cut `phaseNarrative` makes |
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { ChronicleEntry } from '../types/narrative';
import type { ChronicleAlertIntakeTrace } from '../types/trace';
import { buildThreadingGate } from './notificationThreadingGate';
import { filterEventsByVisibility } from './notificationVisibilityFilter';
import { emitTrace } from './traceBuffer';

export const ALERT_CHRONICLE_ENABLED = true;
export const ALERT_CHRONICLE_TITLE_CHARS = 50;

/** What happens to an alert of one event type once its News row lapses. */
export type AlertChroniclePolicy =
  | { readonly chronicle: true }
  | { readonly chronicle: false; readonly exemption: string };

const CHRONICLE: AlertChroniclePolicy = { chronicle: true };

/**
 * One row per event type any producer raises on the alert channel. A type with no row
 * is still chronicled at runtime (fail-soft: news is kept, never lost), but the source
 * scan fails until it is classified.
 *
 * NFP #1: turning a type into an exemption retunes what the Chronicle keeps without
 * touching any producer.
 */
export const ALERT_CHRONICLE_POLICY: Readonly<Record<string, AlertChroniclePolicy>> = {
  // ambitionTick — a drive completed or set aside (completion is ≥0.8 and usually
  // already in through phaseNarrative; the id check keeps it to one line).
  ambition_completed: CHRONICLE,
  ambition_abandoned: CHRONICLE,
  // factionOutcome — a member promoted inside a faction.
  faction_rank_changed: CHRONICLE,
  // phaseMandate — the mandate enters a stage or is fulfilled. Runs post-narrative,
  // so this pass is its only way into the Chronicle.
  mandate_progress: CHRONICLE,
  // revelationResolver — an elder site uncovered.
  elder_site_discovered: CHRONICLE,
  // orchestrator phaseInfluenceTierPromotion — a mortal's story deepens.
  backstory_unlock: CHRONICLE,
  // unifiedActionResolution — a severe complication lands on an action.
  complication: CHRONICLE,
  // prayers — a town prays to the god (the one prayer line on the alert channel).
  narrative: CHRONICLE,
};

export interface AlertChronicleResult {
  readonly entries: ChronicleEntry[];
  readonly writtenIds: string[];
  readonly exemptIds: string[];
  readonly suppressedIds: string[];
  /** Alerts on a hex the player cannot see this tick — fogged out of News too. */
  readonly unseenIds: string[];
}

const EMPTY_RESULT: AlertChronicleResult = { entries: [], writtenIds: [], exemptIds: [], suppressedIds: [], unseenIds: [] };

function isAlert(event: TickEvent): boolean {
  return event.notification?.channel === 'alert';
}

/** The policy for one event type; an unclassified type is chronicled (fail-soft). */
export function alertChroniclePolicyFor(type: string): AlertChroniclePolicy {
  return ALERT_CHRONICLE_POLICY[type] ?? CHRONICLE;
}

/** One Witness-voice line from the alert's own words. */
export function chronicleEntryForAlert(state: Pick<GameState, 'graph'>, event: TickEvent): ChronicleEntry {
  const line = event.playerProse ?? event.message;
  const actorName = event.actorId ? state.graph.getNode(event.actorId)?.name : undefined;
  return {
    id: event.id,
    tier: 'chronicle',
    title: line.slice(0, ALERT_CHRONICLE_TITLE_CHARS),
    prose: line,
    witnessFacts: [line],
    promptContext: {
      actors: actorName ? [actorName] : [],
      location: '',
      sphere: event.sphere ?? 'force',
      mood: 'news',
    },
    tick: event.tick,
  };
}

/**
 * The Chronicle lines this tick's alerts owe. Reads `state.tickEvents` and the
 * entries already written this tick; returns the new entries without appending them.
 */
export function collectAlertChronicle(state: GameState): AlertChronicleResult {
  if (!ALERT_CHRONICLE_ENABLED) return EMPTY_RESULT;
  const alerts = (state.tickEvents ?? []).filter(isAlert);
  if (alerts.length === 0) return EMPTY_RESULT;

  const written = new Set<string>();
  for (const entry of state.chronicleEntries ?? []) {
    if (entry.tick === state.tick) written.add(entry.id);
  }

  const gate = buildThreadingGate(state.graph, state.ascendantId);
  // The same fog filter useNotifications applies before News sees an event. Without a
  // visibility map (a bare test state) nothing is fogged.
  const seen = state.visibilityMap
    ? new Set(filterEventsByVisibility(alerts, state.visibilityMap))
    : null;
  const entries: ChronicleEntry[] = [];
  const writtenIds: string[] = [];
  const exemptIds: string[] = [];
  const suppressedIds: string[] = [];
  const unseenIds: string[] = [];

  for (const event of alerts) {
    if (written.has(event.id)) continue;
    if (!alertChroniclePolicyFor(event.type).chronicle) {
      exemptIds.push(event.id);
      continue;
    }
    if (gate.resolveEventRouting(event).kind === 'suppress') {
      suppressedIds.push(event.id);
      continue;
    }
    if (seen && !seen.has(event)) {
      unseenIds.push(event.id);
      continue;
    }
    entries.push(chronicleEntryForAlert(state, event));
    writtenIds.push(event.id);
    written.add(event.id);
  }
  return { entries, writtenIds, exemptIds, suppressedIds, unseenIds };
}

/** The phase patch: append the owed lines and trace what was kept and why. */
export function phaseAlertChronicle(state: GameState): Partial<GameState> {
  let result: AlertChronicleResult;
  try {
    result = collectAlertChronicle(state);
  } catch {
    return {};
  }
  const { entries, writtenIds, exemptIds, suppressedIds, unseenIds } = result;
  if (writtenIds.length + exemptIds.length + suppressedIds.length + unseenIds.length > 0) {
    emitTrace({
      category: 'chronicle.intake.alert',
      tick: state.tick,
      writtenIds,
      exemptIds,
      suppressedIds,
      unseenIds,
      summary: `Alert Chronicle: ${writtenIds.length} written, ${exemptIds.length} exempt, ${suppressedIds.length} suppressed (unthreaded), ${unseenIds.length} unseen (fogged)`,
    } as ChronicleAlertIntakeTrace);
  }
  return entries.length > 0
    ? { chronicleEntries: [...(state.chronicleEntries ?? []), ...entries] }
    : {};
}
