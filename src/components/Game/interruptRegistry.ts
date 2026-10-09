/**
 * The interrupt registry — the Stellaris clock (THR-1608, plan
 * `Docs/plans/2026-09-27-thr-1605-the-opening.md` § S3).
 *
 * Time runs between moments and stops for every one. An *interrupt* is the
 * UL's word for a surface that "stops the world" (`Docs/ubiquitous-language/
 * Agents.md` § Moment presentation); the never-pausing class is the *toast*,
 * which routes through the notification channel and never appears here.
 *
 * This list replaces the OR-expression that GameView carried since THR-668.
 * It is the single answer to "is something stopping the world right now?":
 * the auto-pause reads it, the debug bridge's `getOpenModals()` reads it, and
 * `getInterruptState()` reports it — so the pause and the debug surface can
 * never disagree about what is open.
 *
 * Each `isOpen` mirrors its surface's render condition EXACTLY. Pausing for a
 * surface that cannot render holds the world behind an invisible gate.
 *
 * Adding an interrupt surface: add a field to `InterruptSnapshot`, an entry to
 * `INTERRUPT_SURFACES`, and render the surface only while its entry is open.
 */

/** The raw UI state the registry's render conditions read. Built once per render in GameView. */
export interface InterruptSnapshot {
  /** Narrative-interrupt suppression is active (`__DEBUG.suppressBeats`). */
  interruptsSuppressed: boolean;
  encounterOpen: boolean;
  /** `meetingState !== null` — the flow mounts only with an ascendant identity too. */
  meetingPending: boolean;
  hasAscendantIdentity: boolean;
  /**
   * A threading rite is pending (`GameState.pendingThreadingRite`, THR-1754) and
   * the rite can mount (it needs the god's identity for the bond's voice).
   * Optional: absent = false.
   */
  threadingRitePending?: boolean;
  premonitionPending: boolean;
  vignettePending: boolean;
  storyBeatPending: boolean;
  /** An ascendant beat exists AND the player has entered it (the offer banner is not an interrupt). */
  ascendantBeatEntered: boolean;
  choiceSetPending: boolean;
  emergenceDecisionPending: boolean;
  divineReceiptPending: boolean;
  /** An undertaking moment sits in the card slot. */
  momentPending: boolean;
  chapterLedgerOpen: boolean;
  /** The Divine Court (ScryOverlay) is open — managing the court must not leak time (THR-1709). */
  courtOpen: boolean;
  /** The head of the popup-channel queue (doom stages, the Unmaking, mandate failure). */
  popupQueued: boolean;
  /** A `?warm=<ticks>` warm-up is advancing the world behind its overlay (THR-1744). Optional: absent = false. */
  warmStartRunning?: boolean;
}

export type InterruptTier = 'interrupt';

export interface InterruptSurface {
  /** Stable id — the component name `getOpenModals()` has always reported. */
  id: string;
  tier: InterruptTier;
  isOpen: (s: InterruptSnapshot) => boolean;
}

/**
 * Surfaces that yield their slot to every other interrupt. They are held until
 * nothing else is open, so two interrupts never render at once:
 * - `MomentCard` (THR-1299 slice 3) fills its slot only when the rest is clear.
 * - `EventPopup` is the notification queue's popup channel — it waits too,
 *   which is what ends popups stacking over beats (THR-1608).
 */
const YIELDING_SURFACE_IDS = new Set(['MomentCard', 'EventPopup']);

/**
 * The Rite of the Thread waits its turn too (THR-1754): a thread can land in the
 * same tick an encounter or a beat opens, and the rite must never render under
 * them. It renders once every other blocking surface is closed — and, once
 * rendering, it holds the moment card and the popup behind it like any other.
 */
const THREADING_RITE_ID = 'ThreadingRite';

/** Every surface that stops the world, in render-priority order. */
export const INTERRUPT_SURFACES: readonly InterruptSurface[] = [
  // The warm start holds the slot while it advances the world, so nothing else opens
  // over it (THR-1744). It renders first: the overlay covers the whole game.
  { id: 'WarmStartOverlay', tier: 'interrupt', isOpen: s => s.warmStartRunning === true },
  { id: 'EncounterVeil', tier: 'interrupt', isOpen: s => s.encounterOpen },
  { id: 'MeetTheFirstFlow', tier: 'interrupt', isOpen: s => s.meetingPending && s.hasAscendantIdentity },
  // The Rite of the Thread (THR-1754): every thread the god binds plays one. Its
  // `isOpen` is the wish; `resolveInterrupts` holds it behind every other blocking
  // surface (the meeting, the first and richest rite of all, included).
  { id: THREADING_RITE_ID, tier: 'interrupt', isOpen: s => s.threadingRitePending === true },
  { id: 'PremonitionModal', tier: 'interrupt', isOpen: s => s.premonitionPending && !s.interruptsSuppressed },
  { id: 'JourneyVignetteModal', tier: 'interrupt', isOpen: s => s.vignettePending && !s.interruptsSuppressed },
  { id: 'StoryBeatModal', tier: 'interrupt', isOpen: s => s.storyBeatPending && !s.interruptsSuppressed },
  { id: 'AscendantBeatModal', tier: 'interrupt', isOpen: s => s.ascendantBeatEntered },
  { id: 'ChoiceSetModal', tier: 'interrupt', isOpen: s => s.choiceSetPending },
  { id: 'EmergenceDilemmaModal', tier: 'interrupt', isOpen: s => s.emergenceDecisionPending },
  { id: 'DivineReceiptModal', tier: 'interrupt', isOpen: s => s.divineReceiptPending },
  // Reading the chapter ledger must not leak time (the Vision rhythm argument).
  { id: 'ChapterLedger', tier: 'interrupt', isOpen: s => s.chapterLedgerOpen },
  // The Divine Court: arranging the retinue is a reading-and-deciding surface like
  // the ledger, so the clock stops behind it (THR-1709).
  { id: 'ScryOverlay', tier: 'interrupt', isOpen: s => s.courtOpen },
  // The two yielding surfaces are resolved by `resolveInterrupts`, not here —
  // their `isOpen` is the *wish* to open; whether they render depends on the rest.
  { id: 'MomentCard', tier: 'interrupt', isOpen: s => s.momentPending },
  { id: 'EventPopup', tier: 'interrupt', isOpen: s => s.popupQueued && !s.interruptsSuppressed },
];

/** Fail-soft: a surface whose `isOpen` throws is logged once and treated as closed. */
const warnedSurfaceIds = new Set<string>();

function safeIsOpen(surface: InterruptSurface, snapshot: InterruptSnapshot): boolean {
  try {
    return surface.isOpen(snapshot);
  } catch (err) {
    if (!warnedSurfaceIds.has(surface.id)) {
      warnedSurfaceIds.add(surface.id);
      console.warn(`[interruptRegistry] ${surface.id}.isOpen threw — treated as closed so the clock never deadlocks paused`, err);
    }
    return false;
  }
}

export interface InterruptResolution {
  /** Ids of the surfaces rendering (and stopping the world) right now. */
  open: string[];
  /** True when any surface other than the moment card is open — the card's gate (THR-1299). */
  otherThanMomentOpen: boolean;
  /** The moment card may render. */
  momentMayRender: boolean;
  /** The head popup may render. */
  popupMayRender: boolean;
  /** Anything stops the world. */
  anyOpen: boolean;
}

/**
 * Resolve the registry against one snapshot. Pure; exported for tests.
 *
 * Priority: every non-yielding surface renders when its condition holds. The
 * moment card renders only when no non-yielding surface is open. The popup
 * renders only when neither a non-yielding surface nor the moment card is open.
 */
export function resolveInterrupts(
  snapshot: InterruptSnapshot,
  surfaces: readonly InterruptSurface[] = INTERRUPT_SURFACES,
): InterruptResolution {
  const open: string[] = [];
  let momentWish = false;
  let popupWish = false;
  let riteWish = false;
  for (const surface of surfaces) {
    const wish = safeIsOpen(surface, snapshot);
    if (!wish) continue;
    if (surface.id === 'MomentCard') momentWish = true;
    else if (surface.id === 'EventPopup') popupWish = true;
    else if (surface.id === THREADING_RITE_ID) riteWish = true;
    else if (!YIELDING_SURFACE_IDS.has(surface.id)) open.push(surface.id);
  }
  const riteMayRender = riteWish && open.length === 0;
  if (riteMayRender) open.push(THREADING_RITE_ID);
  const blockingOpen = open.length > 0;
  const momentMayRender = momentWish && !blockingOpen;
  const popupMayRender = popupWish && !blockingOpen && !momentWish;
  if (momentMayRender) open.push('MomentCard');
  if (popupMayRender) open.push('EventPopup');
  return {
    open,
    // The moment consumer's gate: everything except the card itself, the popup
    // included, so a card never co-renders with a showing popup.
    otherThanMomentOpen: blockingOpen || popupMayRender,
    momentMayRender,
    popupMayRender,
    anyOpen: open.length > 0,
  };
}
