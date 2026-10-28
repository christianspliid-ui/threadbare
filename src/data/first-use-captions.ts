/**
 * First-use captions (THR-1986, plan `2026-10-18-thr-1980-words-teach-themselves.md` U6).
 *
 * A word that matters from the bond carries one visible line under its panel
 * until the player hovers its tooltip, uses the panel once, or presses "got it".
 * Dismissal is remembered (Law 51). At most `FIRST_USE_CAPTIONS_MAX_VISIBLE`
 * show at once; the rest wait in table order. A caption for a panel that is not
 * on screen (not yet revealed) never shows — the panel mounts its caption.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: one entry per surface (Law 58), ≤ 15 words, game prose.
 * `{name}` resolves to the mortal the panel is about at render — never write a
 * guessed pronoun. Table order is queue order.
 * THR-2060: each text is also the second sentence of its panel's arrival toast
 * ("New beside the map: Doom. {caption}"), so a panel with no mounted caption
 * (mandate, investiture, rivals, notables, the lenses) still has one here.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | FIRST_USE_CAPTIONS_MAX_VISIBLE  | 2 | Captions on screen at once |
 * | FIRST_USE_CAPTION_STORE_PREFIX  | 'threadbare.ui.firstUseCaption.' | Law 51 key prefix |
 */

export type FirstUseCaptionId =
  | 'essence'
  | 'threads'
  | 'asks_you'
  | 'chapter_ledger'
  | 'attention'
  | 'dominion'
  | 'doom'
  | 'reaches'
  | 'world_soul'
  | 'omen'
  | 'elder_powers'
  | 'stop_interruptions'
  | 'mandate'
  | 'investiture'
  | 'rivals'
  | 'notables'
  | 'lens_threads'
  | 'lens_trade';

export interface FirstUseCaptionEntry {
  readonly id: FirstUseCaptionId;
  readonly text: string;
}

/** Table order is queue order. */
export const FIRST_USE_CAPTIONS: readonly FirstUseCaptionEntry[] = [
  { id: 'essence', text: 'Your essence. Cards spend it; each pool refills at the speed beside it.' },
  { id: 'threads', text: 'The mortals you hold a thread to. Their chapters arrive here.' },
  { id: 'asks_you', text: "{name}'s chapters keep happening either way. This only decides if they pause the world." },
  { id: 'chapter_ledger', text: 'Every chapter The First has closed, kept to read again.' },
  { id: 'attention', text: 'Your free notice. Looking in on a mortal who lives on spends it; it refills.' },
  { id: 'dominion', text: 'How much a place or person is already yours. Your own ground costs less.' },
  { id: 'doom', text: "A slow clock toward the world's end. It cannot end the world early." },
  { id: 'reaches', text: 'What you can do, and how well. Each Reach grows as you use it.' },
  { id: 'world_soul', text: "The world's mood right now. You read it; you do not spend it." },
  { id: 'omen', text: 'A passing sign of what presses on the world. It fades in days.' },
  { id: 'elder_powers', text: 'Old spheres you were not made of. Some cards still draw on them.' },
  { id: 'stop_interruptions', text: "{name}'s chapters still happen. This only stops them pausing the world." },
  // THR-2060 — arrival-toast captions for panels that mount none of their own.
  { id: 'mandate', text: 'What you are working toward. Win it before the doom runs out.' },
  { id: 'investiture', text: 'Your divine court: the mortals you raise to act in your name.' },
  { id: 'rivals', text: 'Other gods at work in this world. They watch for your hand.' },
  { id: 'notables', text: 'The people this world talks about. Some may be worth a thread.' },
  { id: 'lens_threads', text: 'Lights where your threads run.' },
  { id: 'lens_trade', text: 'Lights the trade roads and what moves along them.' },
];

/** Captions on screen at once; further captions wait in table order. */
export const FIRST_USE_CAPTIONS_MAX_VISIBLE = 2;

/** Law 51 key prefix — one key per caption. */
export const FIRST_USE_CAPTION_STORE_PREFIX = 'threadbare.ui.firstUseCaption.';

/** The button that dismisses a caption by hand. */
export const FIRST_USE_CAPTION_DISMISS_LABEL = 'got it';

/** Stand-in for `{name}` when the panel cannot name its mortal. */
export const FIRST_USE_CAPTION_NAME_FALLBACK = 'Their';

export function getFirstUseCaptionText(id: string, name?: string): string | null {
  const entry = FIRST_USE_CAPTIONS.find(c => c.id === id);
  if (!entry) return null;
  if (!entry.text.includes('{name}')) return entry.text;
  // A missing name reads "Their chapters …", never "'s chapters" or a raw token.
  return name
    ? entry.text.replace('{name}', name)
    : entry.text.replace("{name}'s", FIRST_USE_CAPTION_NAME_FALLBACK);
}
