/**
 * The home list — every surface that stops the world or comes forward on its own,
 * and where it plays (THR-1877 S1, plan `Docs/plans/2026-10-14-thr-1877-encounter-stage.md` § D1).
 *
 * Law 58: which moments play on the Stage, in a dialog or as a full-screen ceremony
 * is one list keyed by kind. A new kind of moment is one entry here, then its open
 * predicate (`HOMED_SURFACE_OPEN_WHEN` in `components/Game/interruptRegistry.ts`) and
 * its case in its home's host. Every other list that names these surfaces is derived
 * from this one: `INTERRUPT_SURFACES`, `INTERRUPT_HOLDER_NAMES`,
 * `DIALOG_CONTEXT_SURFACES`, and each host's kind set. The named test is
 * `src/data/__tests__/homedSurfaces.test.ts`.
 *
 * **Words.** *Homed surface* is always qualified: the UL's bare *Surface* is an
 * encounter template bound to its context axes (`SurfaceKey`), the UL's *Moment* is an
 * undertaking's report (`MomentCard`), and `BeatKind` is the ascendant beat's kind.
 * None of those names is reused here.
 *
 * **Order is render priority.** Ceremonies come before Stage surfaces, so when the
 * foreground is free a ceremony takes it first (D2, R3).
 *
 * Pure data: this module imports nothing from components.
 */

/** Where a surface plays (THR-1829): beside the dimmed map, as a dialog, or full screen. */
export type HomeId = 'stage' | 'dialog' | 'ceremony';

/**
 * The palette names a homed surface takes (the `DialogContextName` taxonomy, THR-1586).
 * `encounter` and `divine` own their palette outside `Modal`'s prop.
 */
export type HomedSurfacePalette = 'story' | 'elder' | 'gain' | 'divine' | 'encounter';

/**
 * Waiting its turn (D2, R5):
 * - `dialogs` — may not *take* the foreground while a dialog is open;
 * - `foreground` — renders only while no ceremony or Stage surface renders;
 * - `everything` — renders only when nothing else renders and no undertaking moment waits.
 */
export type HomedSurfaceWaitsTurn = 'dialogs' | 'foreground' | 'everything';

export interface HomedSurfaceEntry {
  /** The stable key, kebab-case (THR-1821's ids, so `CEREMONY_SURFACES` derives without renaming). */
  kind: string;
  /** The component name `getOpenModals()` has always reported. */
  surfaceId: string;
  home: HomeId;
  /** The surface stops the world while it renders (Law 39). */
  stopsTime: boolean;
  waitsTurn?: HomedSurfaceWaitsTurn;
  /**
   * THR-1853 — the world pushes this surface on its own; it waits for a quiet moment,
   * for the player's own surfaces to close and for every other interrupt.
   */
  arrival?: boolean;
  palette?: HomedSurfacePalette;
  /** Who the TIME readout names while this surface holds the clock (THR-1814); today's words. */
  holderName?: string;
  /**
   * The row Needs you shows while this surface is held, with `{subject}` / `{title}`
   * slots. Absent = never held (it renders whenever its flag holds).
   */
  heldLine?: string;
}

export const HOMED_SURFACES = [
  { kind: 'warm-start', surfaceId: 'WarmStartOverlay', home: 'dialog', stopsTime: true, holderName: 'the world settling' },
  { kind: 'meet-the-first', surfaceId: 'MeetTheFirstFlow', home: 'ceremony', stopsTime: true, holderName: 'meeting The First', heldLine: 'Meeting your First' },
  { kind: 'threading-rite', surfaceId: 'ThreadingRite', home: 'ceremony', stopsTime: true, waitsTurn: 'dialogs', holderName: 'the threading rite', heldLine: 'The threading rite with {subject}' },
  { kind: 'encounter', surfaceId: 'EncounterVeil', home: 'stage', stopsTime: true, palette: 'encounter', holderName: 'an encounter', heldLine: '{title}, with {subject}' },
  { kind: 'premonition', surfaceId: 'PremonitionModal', home: 'stage', stopsTime: true, arrival: true, palette: 'divine', holderName: 'a premonition', heldLine: 'A premonition about {subject}' },
  { kind: 'journey-vignette', surfaceId: 'JourneyVignetteModal', home: 'stage', stopsTime: true, arrival: true, palette: 'story', holderName: 'a vision', heldLine: "A vision on {subject}'s road" },
  { kind: 'story-beat', surfaceId: 'StoryBeatModal', home: 'stage', stopsTime: true, arrival: true, palette: 'story', holderName: 'a story beat', heldLine: "A turn in {subject}'s story" },
  { kind: 'ascendant-beat', surfaceId: 'AscendantBeatModal', home: 'dialog', stopsTime: true, palette: 'story', holderName: 'a beat of your story' },
  { kind: 'choice-set', surfaceId: 'ChoiceSetModal', home: 'dialog', stopsTime: true, holderName: 'a choice' },
  { kind: 'emergence-dilemma', surfaceId: 'EmergenceDilemmaModal', home: 'stage', stopsTime: true, palette: 'elder', holderName: 'a new power', heldLine: 'A new power at {subject}' },
  { kind: 'divine-receipt', surfaceId: 'DivineReceiptModal', home: 'dialog', stopsTime: true, waitsTurn: 'foreground', palette: 'gain', holderName: 'what your act bought', heldLine: 'What your act bought' },
  { kind: 'chapter-ledger', surfaceId: 'ChapterLedger', home: 'dialog', stopsTime: true, holderName: 'the Chapter Ledger' },
  { kind: 'divine-court', surfaceId: 'ScryOverlay', home: 'dialog', stopsTime: true, holderName: 'your court' },
  { kind: 'undertaking-moment', surfaceId: 'MomentCard', home: 'stage', stopsTime: true, waitsTurn: 'dialogs', arrival: true, palette: 'gain', holderName: 'a moment', heldLine: "News of {subject}'s work" },
  { kind: 'event-popup', surfaceId: 'EventPopup', home: 'dialog', stopsTime: true, waitsTurn: 'everything', arrival: true, holderName: 'a message', heldLine: 'A message: {title}' },
  // THR-1381 — the age ends: three closing beats the player watches before the harvest.
  // Time is stopped (the Twilight runs no tick), and only its button leaves it.
  { kind: 'age-twilight', surfaceId: 'AgeTwilightScreen', home: 'ceremony', stopsTime: true, holderName: 'the end of the age', heldLine: 'The age is ending' },
  // The age has ended: the harvest does not stop the clock (unchanged), but it takes
  // part in the foreground, so it never draws over an open moment.
  { kind: 'cycle-harvest', surfaceId: 'HarvestScreen', home: 'ceremony', stopsTime: false, heldLine: 'The end of the age' },
] as const satisfies readonly HomedSurfaceEntry[];

type HomedEntry = (typeof HOMED_SURFACES)[number];

/** Every homed surface's key. A new entry above extends it. */
export type HomedSurfaceKind = HomedEntry['kind'];
/** The kinds the Stage plays. */
export type StageHomedKind = Extract<HomedEntry, { home: 'stage' }>['kind'];
/** The kinds that open as dialogs. */
export type DialogHomedKind = Extract<HomedEntry, { home: 'dialog' }>['kind'];
/** The kinds that play full screen. */
export type CeremonyHomedKind = Extract<HomedEntry, { home: 'ceremony' }>['kind'];

/** One entry by kind; `undefined` for a kind the list does not hold (fail-soft). */
export function homedSurfaceFor(kind: string): HomedSurfaceEntry | undefined {
  return (HOMED_SURFACES as readonly HomedSurfaceEntry[]).find(e => e.kind === kind);
}

/** One entry by its surface id (`'EncounterVeil'`…). */
export function homedSurfaceForId(surfaceId: string): HomedSurfaceEntry | undefined {
  return (HOMED_SURFACES as readonly HomedSurfaceEntry[]).find(e => e.surfaceId === surfaceId);
}

/** The kinds whose home is `home`, in list order. */
export function homedKindsFor(home: HomeId): HomedSurfaceKind[] {
  return HOMED_SURFACES.filter(e => e.home === home).map(e => e.kind);
}

/** The ceremony kinds. `CEREMONY_SURFACES` (`components/shared/surfaceHomes.ts`, THR-1884) is this list. */
export const CEREMONY_HOMED_KINDS: readonly CeremonyHomedKind[] = HOMED_SURFACES
  .filter((e): e is Extract<HomedEntry, { home: 'ceremony' }> => e.home === 'ceremony')
  .map(e => e.kind);

/** First letter up: "a premonition" → "A premonition". */
function sentenceCase(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

/** Shown when a kind has neither a held line nor holder words (never expected; Law 43). */
export const HELD_LINE_FALLBACK = 'A moment';

/**
 * The Needs-you row for a held surface: its held line with `{subject}` and `{title}`
 * filled. A line whose slot has no value falls back to the kind's holder words in
 * sentence case ("A premonition"), so no `{token}` ever reaches the screen (Law 43).
 */
export function heldLineFor(kind: string, slots: { subject?: string | null; title?: string | null } = {}): string {
  const entry = homedSurfaceFor(kind);
  const fallback = entry?.holderName ? sentenceCase(entry.holderName) : HELD_LINE_FALLBACK;
  const line = entry?.heldLine;
  if (!line) return fallback;
  let missing = false;
  const filled = line.replace(/\{(subject|title)\}/g, (_match, slot: 'subject' | 'title') => {
    const value = slots[slot];
    if (typeof value !== 'string' || value.trim() === '') {
      missing = true;
      return '';
    }
    return value;
  });
  return missing ? fallback : filled;
}

/** The fallback screen's words (`HomedSurfaceFallback`, D1). Never expected in play. */
export const HOMED_SURFACE_FALLBACK_BODY = 'This moment has no screen yet.';
export const HOMED_SURFACE_FALLBACK_CONTINUE = 'Continue';

/** The fallback screen's title: the kind's clock-holder words in sentence case. */
export function homedSurfaceFallbackTitle(kind: string): string {
  const holder = homedSurfaceFor(kind)?.holderName;
  return holder ? sentenceCase(holder) : HELD_LINE_FALLBACK;
}
