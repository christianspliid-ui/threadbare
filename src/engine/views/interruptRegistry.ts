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
 * Each open predicate mirrors its surface's render condition EXACTLY. Pausing for a
 * surface that cannot render holds the world behind an invisible gate.
 *
 * **One list (THR-1877, Law 58).** The surfaces, their order, their homes and their
 * words live in `HOMED_SURFACES` (`src/data/homed-surfaces.ts`). This module adds one
 * open predicate per kind (`HOMED_SURFACE_OPEN_WHEN`, a type error when a kind has
 * none) and derives `INTERRUPT_SURFACES` from the list. Adding a surface: one entry in
 * the list, its predicate here, its case in its home's host.
 *
 * Arrivals wait their turn (THR-1853). A surface the world pushes onto the screen
 * never mounts within `INTERRUPT_QUIET_AFTER_INPUT_MS` of a click or key press,
 * never over a surface the player opened (Rivals, Doom, a sheet...), and never
 * beside another interrupt. Once it is on screen it keeps its slot, so a click
 * inside it never makes it vanish. Warm round 2: three of three testers had a
 * click on Rivals, the Ledger or Doom land on a premonition or journey moment
 * that mounted under the pointer.
 *
 * One foreground (THR-1877 § D2). Ceremony and Stage surfaces share one slot: at most
 * one of them renders. The one on screen keeps it; when the slot is free, list order
 * decides (ceremonies first). Dialogs render over it. Everything that wants the screen
 * and does not render is *held*, named, in list order.
 */
import {
  HOMED_SURFACES,
  type HomeId,
  type HomedSurfaceEntry,
  type HomedSurfaceKind,
  type HomedSurfaceWaitsTurn,
  type StageHomedKind,
} from '../../data/homed-surfaces';

/**
 * THR-1853 — wall-clock milliseconds after the player's last pointer or key input
 * before a world-pushed interrupt (an arrival) may mount. Long enough that a modal
 * never appears under a click already in flight; short enough that a waiting
 * premonition shows the moment the player pauses.
 */
export const INTERRUPT_QUIET_AFTER_INPUT_MS = 2500;

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
  /**
   * THR-1877 — the cycle has ended and the harvest waits (`harvestResult !== null`).
   * It takes part in the foreground but does not stop the clock. Optional: absent = false.
   */
  cycleHarvestPending?: boolean;
  /**
   * THR-1381 — the age has ended and its closing beats wait (`twilightBeats !== null`).
   * Stops the clock; only the ceremony's button leaves it. Optional: absent = false.
   */
  twilightPending?: boolean;
  /**
   * THR-1853 — a surface the player opened is on screen and is not itself in this
   * registry (Rivals, Notables, Doom, a sheet, the drawer...). Holds arrivals.
   * Optional: absent = false.
   */
  playerSurfaceOpen?: boolean;
  /** THR-1853 — the last input was under `INTERRUPT_QUIET_AFTER_INPUT_MS` ago. Holds arrivals. Optional. */
  recentInput?: boolean;
  /**
   * THR-1853 — the ids `resolveInterrupts` returned as open on the previous render.
   * An arrival already on screen keeps its slot whatever the holds say. Optional:
   * absent = nothing was showing.
   */
  alreadyShown?: readonly string[];
  /**
   * THR-1877 — the previous render's `foreground`. The surface on screen keeps the
   * foreground while its flag holds (D2, R2). Optional: absent = the slot goes by list order.
   */
  foregroundIncumbent?: HomedSurfaceKind | null;
  /**
   * THR-1877 — kinds the player set down through `HomedSurfaceFallback`'s Continue.
   * Treated as closed until their own flag turns false once, so a surface with no
   * screen can never hold the clock paused forever. Optional.
   */
  skippedKinds?: readonly HomedSurfaceKind[];
}

/**
 * One open predicate per kind (THR-1877). The stopping ones are today's registry
 * conditions, moved unchanged. A kind without a predicate is a type error.
 */
export const HOMED_SURFACE_OPEN_WHEN: Record<HomedSurfaceKind, (s: InterruptSnapshot) => boolean> = {
  // The warm start holds the slot while it advances the world, so nothing else opens
  // over it (THR-1744). It renders first: the overlay covers the whole game.
  'warm-start': s => s.warmStartRunning === true,
  'meet-the-first': s => s.meetingPending && s.hasAscendantIdentity,
  // The Rite of the Thread (THR-1754): every thread the god binds plays one. This is
  // the wish; `resolveInterrupts` holds it behind dialogs and the incumbent.
  'threading-rite': s => s.threadingRitePending === true,
  encounter: s => s.encounterOpen,
  premonition: s => s.premonitionPending && !s.interruptsSuppressed,
  'journey-vignette': s => s.vignettePending && !s.interruptsSuppressed,
  'story-beat': s => s.storyBeatPending && !s.interruptsSuppressed,
  'ascendant-beat': s => s.ascendantBeatEntered,
  'choice-set': s => s.choiceSetPending,
  'emergence-dilemma': s => s.emergenceDecisionPending,
  'divine-receipt': s => s.divineReceiptPending,
  // Reading the chapter ledger must not leak time (the Vision rhythm argument).
  'chapter-ledger': s => s.chapterLedgerOpen,
  // The Divine Court: arranging the retinue is a reading-and-deciding surface like
  // the ledger, so the clock stops behind it (THR-1709).
  'divine-court': s => s.courtOpen,
  'undertaking-moment': s => s.momentPending,
  'event-popup': s => s.popupQueued && !s.interruptsSuppressed,
  'age-twilight': s => s.twilightPending === true,
  'cycle-harvest': s => s.cycleHarvestPending === true,
};

export type InterruptTier = 'interrupt';

export interface InterruptSurface {
  /** Stable id — the component name `getOpenModals()` has always reported. */
  id: string;
  tier: InterruptTier;
  isOpen: (s: InterruptSnapshot) => boolean;
  /**
   * THR-1853 — the world opens this surface on its own (a premonition, a journey
   * moment, a doom popup), not the player's own act. An arrival waits for a quiet
   * moment, for the player's surfaces to close and for every other interrupt.
   */
  arrival?: boolean;
  /** THR-1877 — the home list's key. Absent on a hand-built entry: treated as a plain dialog. */
  kind?: HomedSurfaceKind;
  /** THR-1877 — where it plays. Absent = `'dialog'`. */
  home?: HomeId;
  /** THR-1877 — waits its turn (D2, R5). */
  waitsTurn?: HomedSurfaceWaitsTurn;
  /** THR-1877 — stops the world while it renders. Absent = true. */
  stopsTime?: boolean;
}

/** Why an arrival is not on screen yet (THR-1853). */
export type ArrivalHoldReason = 'interrupt' | 'player_surface' | 'recent_input';

export interface HeldArrival {
  id: string;
  heldBy: ArrivalHoldReason[];
}

/** What the encounter auto-open scan reads before it opens a chapter on its own (THR-2053). */
export interface WorldOpenedEncounterHoldInput {
  /** A player surface is open — the Chapter Ledger and the court included, since an encounter co-renders with dialogs. */
  playerSurfaceOpen: boolean;
  /** The last pointer or key input is inside `INTERRUPT_QUIET_AFTER_INPUT_MS`. */
  recentInput: boolean;
}

/**
 * THR-2053 — a chapter the world opens is an arrival too. The `encounter` home entry is
 * not marked `arrival` (a badge-, row- or Needs-you-opened chapter must mount at once),
 * so the auto-open scan asks here first: it opens nothing while the player is mid-click
 * or has one of their own surfaces open, and looks again when the hold lifts.
 * Empty = open now. Pure.
 */
export function worldOpenedEncounterHeldBy(input: WorldOpenedEncounterHoldInput): ArrivalHoldReason[] {
  const heldBy: ArrivalHoldReason[] = [];
  if (input.playerSurfaceOpen) heldBy.push('player_surface');
  if (input.recentInput) heldBy.push('recent_input');
  return heldBy;
}

/** THR-1877 — a surface that wants the screen and waits (D2, R6). */
export interface HeldSurface {
  kind: HomedSurfaceKind;
  surfaceId: string;
  /** What it waits behind: the foreground, else the first surface rendering; null when nothing renders. */
  behind: HomedSurfaceKind | null;
}

function toInterruptSurface(entry: HomedSurfaceEntry): InterruptSurface {
  const kind = entry.kind as HomedSurfaceKind;
  return {
    id: entry.surfaceId,
    tier: 'interrupt',
    isOpen: HOMED_SURFACE_OPEN_WHEN[kind],
    ...(entry.arrival ? { arrival: true } : {}),
    kind,
    home: entry.home,
    ...(entry.waitsTurn ? { waitsTurn: entry.waitsTurn } : {}),
    stopsTime: entry.stopsTime,
  };
}

/** Every homed surface, in render-priority order — the default the resolution reads. */
export const HOMED_INTERRUPT_SURFACES: readonly InterruptSurface[] =
  (HOMED_SURFACES as readonly HomedSurfaceEntry[]).map(toInterruptSurface);

/** Every surface that stops the world, in render-priority order (derived from `HOMED_SURFACES`). */
export const INTERRUPT_SURFACES: readonly InterruptSurface[] =
  HOMED_INTERRUPT_SURFACES.filter(s => s.stopsTime !== false);

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
  /** Ids of the surfaces rendering and stopping the world right now. */
  open: string[];
  /** True when any surface other than the moment card is open — the card's gate (THR-1299). */
  otherThanMomentOpen: boolean;
  /** The moment card may render. */
  momentMayRender: boolean;
  /** The head popup may render. */
  popupMayRender: boolean;
  /** Anything stops the world — an open surface, or one waiting its turn. */
  anyOpen: boolean;
  /**
   * THR-1853 — arrivals the world wants on screen that wait their turn, and why.
   * A held arrival still stops the world: it is due now, only its mount waits. A
   * premonition expires a few ticks after it becomes showable, so a clock that ran on
   * behind a held one could drop it unseen.
   */
  heldArrivals: HeldArrival[];
  /** THR-1877 — every homed surface that renders now, stopping or not. The hosts read this. */
  rendering: HomedSurfaceKind[];
  /** THR-1877 — the one ceremony or Stage surface rendering (R1). */
  foreground: HomedSurfaceKind | null;
  /** THR-1877 — `foreground` when its home is the Stage. */
  stage: StageHomedKind | null;
  /** THR-1877 — surfaces that want the screen and wait, in list order (R6). */
  held: HeldSurface[];
  /** THR-1877 — every kind whose flag holds, before `skippedKinds` (the skip set's reset reads it). */
  wished: HomedSurfaceKind[];
}

const MOMENT_ID = 'MomentCard';
const POPUP_ID = 'EventPopup';

/**
 * Resolve the registry against one snapshot. Pure; exported for tests.
 *
 * The rule (THR-1877 § D2, with THR-1853's arrival holds kept):
 * - **Dialogs** that do not wait their turn render whenever their flag holds (R4).
 * - **One foreground** (R1): ceremony and Stage surfaces share one slot.
 *   - The incumbent keeps it while its flag holds (R2). An *arrival* incumbent still
 *     steps back for a surface the player's or the world's own act opened since (an
 *     encounter, a gift, the ledger), as THR-1853 settled, and returns once it closes.
 *   - When the slot is free, the first eligible surface in list order takes it (R3).
 *     The rite and the undertaking moment may not take it while a dialog is open (R5).
 *     A new arrival takes it only when nothing else wants the screen, the player has no
 *     surface of their own open and the last input is quiet (THR-1853).
 * - **The divine receipt** renders only while nothing holds the foreground (R5).
 * - **The popup** renders only when nothing else renders and no moment waits (R5).
 * - Everything else whose flag holds is **held** (R6).
 *
 * `open`, `anyOpen` and the gates keep their meaning: stopping surfaces only, so the
 * auto-pause, `getOpenModals()` and the clock holder read as before.
 */
export function resolveInterrupts(
  snapshot: InterruptSnapshot,
  surfaces: readonly InterruptSurface[] = HOMED_INTERRUPT_SURFACES,
): InterruptResolution {
  const shown = new Set(snapshot.alreadyShown ?? []);
  const skipped = new Set<string>(snapshot.skippedKinds ?? []);
  const homeOf = (s: InterruptSurface): HomeId => s.home ?? 'dialog';
  const isForeground = (s: InterruptSurface) => homeOf(s) !== 'dialog';

  const wishedAll = surfaces.filter(s => safeIsOpen(s, snapshot));
  const wishedKinds = wishedAll.flatMap(s => (s.kind ? [s.kind] : []));
  const wish = wishedAll.filter(s => !(s.kind && skipped.has(s.kind)));

  const quietHolds: ArrivalHoldReason[] = [];
  if (snapshot.playerSurfaceOpen === true) quietHolds.push('player_surface');
  if (snapshot.recentInput === true) quietHolds.push('recent_input');
  const quiet = quietHolds.length === 0;

  // R4 — dialogs that do not wait their turn.
  const dialogs = wish.filter(s => !isForeground(s) && !s.waitsTurn && !s.arrival);
  const momentWish = wish.some(s => s.id === MOMENT_ID);
  const popupWish = wish.find(s => s.id === POPUP_ID);

  // What an arrival steps back for (THR-1853): any surface the world stops for that is
  // not itself an arrival — except the rite and the receipt, which wait for others.
  const nonArrivalBlocking = wish.filter(s => !s.arrival && s.id !== 'ThreadingRite' && s.waitsTurn !== 'foreground');
  // A new arrival waits for every other surface that wants the screen, the receipt included.
  const nonArrivalWanting = wish.filter(s => !s.arrival);
  // A popup already on screen keeps its slot against a new arrival (THR-1853).
  const popupShown = !!popupWish && !momentWish && shown.has(POPUP_ID);

  const isShown = (s: InterruptSurface) =>
    shown.has(s.id) || (s.kind !== undefined && s.kind === snapshot.foregroundIncumbent);

  const foregroundWish = wish.filter(isForeground);
  const mayHoldAsIncumbent = (s: InterruptSurface) =>
    !s.arrival || nonArrivalBlocking.length === 0;
  const mayTakeFreeSlot = (s: InterruptSurface) => {
    if (s.waitsTurn === 'dialogs' && dialogs.length > 0) return false;
    if (!s.arrival) return true;
    return nonArrivalWanting.length === 0 && !popupShown && quiet;
  };

  // R2 — the incumbent (the first shown foreground surface in list order).
  const incumbent = foregroundWish.find(s => isShown(s) && mayHoldAsIncumbent(s));
  // R3 — the slot is free: list order.
  const fg = incumbent ?? foregroundWish.find(mayTakeFreeSlot) ?? null;

  // R5 — the receipt waits for the foreground.
  const afterForeground = fg ? [] : wish.filter(s => s.waitsTurn === 'foreground');

  const renderingSet = new Set<InterruptSurface>([...dialogs, ...afterForeground, ...(fg ? [fg] : [])]);
  // R5 — the popup waits for everything, the waiting moment card included (today's rule).
  if (popupWish && renderingSet.size === 0 && !momentWish && (shown.has(POPUP_ID) || quiet)) {
    renderingSet.add(popupWish);
  }
  const rendering = surfaces.filter(s => renderingSet.has(s));

  const open = rendering.filter(s => s.stopsTime !== false).map(s => s.id);
  const blockingOpen = open.some(id => id !== MOMENT_ID && id !== POPUP_ID);
  const momentMayRender = open.includes(MOMENT_ID);
  const popupMayRender = open.includes(POPUP_ID);

  // THR-1853's held-arrival reasons, unchanged in shape.
  const heldArrivals: HeldArrival[] = [];
  const somethingElseRenders = rendering.length > 0;
  for (const s of wish) {
    if (!s.arrival || renderingSet.has(s)) continue;
    if (s.id === MOMENT_ID) {
      heldArrivals.push({ id: s.id, heldBy: blockingOpen ? ['interrupt', ...quietHolds] : [...quietHolds] });
    } else if (s.id === POPUP_ID) {
      heldArrivals.push({ id: s.id, heldBy: blockingOpen || momentWish ? ['interrupt', ...quietHolds] : [...quietHolds] });
    } else {
      const heldBy: ArrivalHoldReason[] = somethingElseRenders || popupShown ? ['interrupt'] : [];
      heldBy.push(...quietHolds);
      heldArrivals.push({ id: s.id, heldBy });
    }
  }

  // R6 — every surface that wants the screen and does not render, named.
  const behind = (fg?.kind ?? rendering[0]?.kind ?? null) as HomedSurfaceKind | null;
  const held: HeldSurface[] = wish
    .filter(s => !renderingSet.has(s) && s.kind !== undefined)
    .map(s => ({ kind: s.kind as HomedSurfaceKind, surfaceId: s.id, behind }));

  const heldStopping = wish.some(s => !renderingSet.has(s) && s.stopsTime !== false);

  return {
    open,
    // The moment consumer's gate: everything except the card itself, the popup
    // included, so a card never co-renders with a showing popup.
    otherThanMomentOpen: blockingOpen || popupMayRender,
    momentMayRender,
    popupMayRender,
    // A held surface still stops the world: it is due now, only its mount waits (D8).
    anyOpen: open.length > 0 || heldArrivals.length > 0 || heldStopping,
    heldArrivals,
    rendering: rendering.flatMap(s => (s.kind ? [s.kind] : [])),
    foreground: fg?.kind ?? null,
    stage: fg && homeOf(fg) === 'stage' ? (fg.kind as StageHomedKind) : null,
    held,
    wished: wishedKinds,
  };
}

/**
 * The kinds of `home` that are rendering but that a host has no case for (D1). Only data
 * drift can produce one; the host shows `HomedSurfaceFallback` for each.
 */
export function unplacedHomedKinds(
  rendering: readonly HomedSurfaceKind[],
  home: HomeId,
  placed: readonly HomedSurfaceKind[],
): HomedSurfaceKind[] {
  const known = new Set<string>(placed);
  return rendering.filter(kind => {
    const entry = HOMED_INTERRUPT_SURFACES.find(s => s.kind === kind);
    return (entry?.home ?? 'dialog') === home && !known.has(kind);
  });
}
