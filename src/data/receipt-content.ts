/**
 * Divine Receipt content + tuning (THR-727).
 *
 * When a player-sourced action resolves, `processPlayerReceipts` builds a receipt and
 * decides whether it surfaces as a band-accented completion toast (minor casts) or a
 * full receipt dialogue (multi-step / rare / world-shifting casts). This module holds
 * both the tuning constants that gate that decision and the authored framing lines the
 * dialogue leads with.
 *
 * ─── Voice ──────────────────────────────────────────────────────────────────────
 * Framing lines are player-as-god register (THR-609 peak register is acceptable here —
 * the receipt is a rare, deliberate reflection surface, not at-a-glance UI). They frame
 * the *witnessed consequence*, never announce a mechanical verdict: the fortunate band
 * says "the world bent, but only just" — not "Success!". No numbers, no key:value.
 */

import type { EncounterAftermathChangeKind } from '../types/unifiedAction';
import type { RarityTier } from '../types/rarity';
import type { OutcomeBand } from '../engine/outcomeConsequences';

// ─── Presentation-tier constants (NFP #1: Tunability) ───────────────────────────

/** Multi-step casts (>= this many steps) always get the dialogue, never the bare toast. */
export const RECEIPT_MODAL_MIN_STEPS = 2;

/**
 * Rarity tier at/above which a cast always gets the dialogue. RarityTier is numeric
 * (1 Mundane · 2 Storied · 3 Mythic · 4 Legendary); `3` means "Mythic and above" — the
 * plan's "rare" floor. Read against `action.effectiveRarityTier ?? template.rarityTier`.
 */
export const RECEIPT_MODAL_RARITY_FLOOR: RarityTier = 3;

/**
 * Aftermath change kinds that force the dialogue regardless of step count or rarity —
 * these are the world-shifting consequences a bare toast would bury.
 */
export const RECEIPT_MODAL_CHANGE_KINDS: readonly EncounterAftermathChangeKind[] = [
  'trait',
  'faction_reputation',
  'future_hook',
  'shell_state',
];

/**
 * Pending-receipt cap. Oldest unacknowledged receipt is dropped when a new one arrives
 * at the cap — matters for CLI/headless runs where nothing ever acknowledges.
 */
export const RECEIPT_QUEUE_MAX = 5;

/** Toast-tier event significance — surfaces in recentEvents, below the 0.8 chronicle threshold. */
export const RECEIPT_EVENT_SIGNIFICANCE_TOAST = 0.6;

/** Modal-tier event significance — at/above the chronicle threshold so it lands in the chronicle. */
export const RECEIPT_EVENT_SIGNIFICANCE_MODAL = 0.85;

// ─── Framing lines (Content) ────────────────────────────────────────────────────

/**
 * Band-keyed framing line pools. The receipt dialogue leads with one of these above the
 * enriched overview prose. Selected deterministically by the action id hash (NFP #3 — no
 * PRNG), so replaying the same seed shows the same line. 2–3 lines per band.
 */
export const RECEIPT_FRAME_LINES: Record<OutcomeBand, readonly string[]> = {
  surge: [
    'The world bent the way you pressed it, and then bent a little further.',
    'Your will landed clean, and the answer came back louder than the asking.',
    'What you set in motion arrived whole — nothing lost between intent and outcome.',
  ],
  neutral: [
    'It went as you meant it to. The world took the shape you gave it.',
    'Quiet work, quietly done. The thread holds where you laid it.',
    'No drama in the doing — only the change, now loose in the world.',
  ],
  strained: [
    'It held, but the world charged you for the holding.',
    'You got what you reached for, and it took something on the way out.',
    'Done — though the cost of it will surface somewhere you were not looking.',
  ],
  fortunate: [
    'The world bent, but only just — a hair more resistance and it would not have.',
    'It came through on the narrowest margin, closer to slipping than you would like.',
    'Barely. What you wanted arrived, trailing the shadow of what almost happened.',
  ],
  setback: [
    'The world did not answer. Your reach closed on nothing.',
    'It slipped the shape you meant for it and settled somewhere worse.',
    'The thread would not take. What you pressed for did not come.',
  ],
  catastrophe: [
    'The world answered — and answered wrong, in a way that will be remembered.',
    'Something tore where you pushed. This one leaves a mark on the world and on you.',
    'It broke the wrong way, wholly and loudly. The consequence is already moving.',
  ],
};

/** Fallback frame line when a band has no pool (fail-soft — cannot happen given the full map). */
export const RECEIPT_FRAME_LINE_FALLBACK = 'The world settled, and what you did is now part of it.';

/**
 * Deterministic frame-line selection by action id (NFP #3). Pure string hash → index
 * into the band's pool. Same actionId + band always yields the same line.
 */
export function selectReceiptFrameLine(band: OutcomeBand | string | undefined, actionId: string): string {
  const pool = (band && RECEIPT_FRAME_LINES[band as OutcomeBand]) || undefined;
  if (!pool || pool.length === 0) return RECEIPT_FRAME_LINE_FALLBACK;
  let hash = 0;
  for (let i = 0; i < actionId.length; i++) {
    hash = (hash * 31 + actionId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * The toast-tier receipt carries the overview's first sentence (THR-1002).
 *
 * Before this, every toast read `` `Your ${template.name} ${outcomeBandWord(band)}.` ``
 * — the template's *internal* name and one band word, and nothing about what
 * happened. Measured against the deck a player can actually hold, 28 of 30 casts
 * land on the toast tier, so that sentence was the feedback for ~93% of casts.
 * Christian's directive of 2026-08-06: *"when you play one you don't really get
 * feedback."* The receipt's `overview` — which the resolver had already built and
 * the modal had always shown — is what the toast should have been saying.
 *
 * Off switches back to the bare name, so the change is revertible without a
 * rebuild of the receipt path (NFP #1).
 */
export const RECEIPT_TOAST_USES_OVERVIEW = true;

/**
 * Longest toast message before it is cut at a word boundary and elided.
 *
 * The toast is a glance, not a read — an overview whose first sentence runs long
 * would push the stack's other toasts off screen, and the modal is one click away
 * for the whole thing.
 */
export const RECEIPT_TOAST_MAX_CHARS = 160;

/**
 * The first sentence of an overview, for the toast.
 *
 * Splits on the first sentence terminator followed by a space, so a decimal or an
 * abbreviation mid-sentence does not cut the line early; a one-sentence overview
 * is used whole. Fail-soft in both directions — a blank or placeholder-laden
 * overview returns `undefined` so the caller falls back to the band frame line
 * rather than toasting an empty string or a raw `{cast:*}` token.
 */
export function receiptToastSentence(overview: string | undefined): string | undefined {
  if (typeof overview !== 'string') return undefined;
  const trimmed = overview.trim();
  if (!trimmed) return undefined;
  // An unresolved placeholder means enrichment could not finish; the frame line is
  // a truthful sentence where `{cast:subject}` on screen is a Law 14 violation.
  if (trimmed.includes('{')) return undefined;

  // A *stripped* placeholder is the commoner failure and the one the plan's kill
  // criterion names. `enrichProse` removes a token it cannot resolve rather than
  // leaving it visible, so `"{cast:subject} walks away unharmed."` arrives here as
  // `"walks away unharmed."` — grammatical-looking, lowercase, and missing its
  // subject. There is no token left to detect, so the tell is the opening
  // character: an authored overview is a sentence and starts like one. A line that
  // does not is a fragment, and the band's frame line is better than a sentence
  // whose subject the enricher ate.
  // Only a *lowercase letter* opener is rejected: a quotation mark, a dash or a
  // capitalised name are all legitimate ways for an authored overview to begin.
  if (/^\p{Ll}/u.test(trimmed)) return undefined;

  const match = /[.!?](\s|$)/.exec(trimmed);
  const sentence = match ? trimmed.slice(0, match.index + 1) : trimmed;
  if (sentence.length <= RECEIPT_TOAST_MAX_CHARS) return sentence;

  const clipped = sentence.slice(0, RECEIPT_TOAST_MAX_CHARS);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

// ─── Cast influence lines (THR-1651) ────────────────────────────────────────────

/**
 * Which receipt line a value-drifting cast reads. `clean` and `at_cost` follow the
 * outcome band (the cast floor makes `at_cost` the common case); `found_nothing` is
 * the dream on a mortal at exactly 0 on the axis, where no influence was written.
 */
export type CastInfluenceReceiptCase = 'clean' | 'at_cost' | 'found_nothing';

/** Bands that read as the clean line. `strained` reads at cost; setback/catastrophe keep the resolver's own overview. */
export const CAST_INFLUENCE_CLEAN_BANDS: readonly OutcomeBand[] = ['surge', 'neutral', 'fortunate'];
export const CAST_INFLUENCE_AT_COST_BANDS: readonly OutcomeBand[] = ['strained'];

/**
 * The receipt overview for Oneiric Sending and Divine Compulsion, by intervention
 * type and case. `{target}` is the mortal's name, `{pole}` the value word the drift
 * pushes toward (`mercy`, `ambition`, …). Narrator register, past the fact.
 *
 * The toast shows only the first sentence (`receiptToastSentence`), so the first
 * sentence of every landed line names both the mortal and the pole.
 */
export const CAST_INFLUENCE_RECEIPT_LINES: Record<'dream' | 'persuade', Record<CastInfluenceReceiptCase, string>> = {
  dream: {
    clean: '{target} dreams of who they already are, and wakes leaning harder toward {pole}. The dream will fade; for now it weighs in every choice.',
    at_cost: '{target} sleeps badly, but the dream holds: {pole} weighs more in what they choose now. They wake tired and do not know why.',
    found_nothing: '{target} dreams, but the dream finds nothing in them to take hold of. They wake as they were.',
  },
  persuade: {
    clean: 'A certainty settles on {target} that was not there before: {pole} is the only sensible course. They think the thought is their own.',
    at_cost: '{target} fights the conviction and loses, and now {pole} pulls at every choice they make. The struggle left them raw.',
    found_nothing: 'Your conviction finds no purchase in {target}. They go on as they were.',
  },
};

/** Fill a cast influence line's `{target}` and `{pole}` slots. */
export function fillCastInfluenceLine(line: string, target: string, pole: string): string {
  return line.split('{target}').join(target).split('{pole}').join(pole);
}

// ─── What your hand did — the target side (THR-1606) ───────────────────────────

/**
 * The chip noun an influence wears on the mortal it touches — sheet words, one per
 * intervention type the casts write. An intervention type with no entry here keeps
 * its older label (`agentDetail.INTERVENTION_LABELS`).
 */
export const INFLUENCE_CHIP_NOUNS: Readonly<Record<string, string>> = {
  dream: 'Dreaming',
  persuade: 'Compelled',
};

/**
 * The chip's hover sentence: what the influence does and when it fades.
 * `{pole}` is the value word the drift pushes toward; `{duration}` is a
 * `durationLabel` reading (Law 13: never ticks).
 */
export const INFLUENCE_CHIP_HOVER = 'Your hand is on them: {pole} weighs more in their choices, fading in {duration}.';

/** The receipt's change line for an influence that landed on the target. `{target}`, `{noun}`. */
export const TARGET_INFLUENCE_CHANGE_TITLE = 'Your hand is on them';
export const TARGET_INFLUENCE_CHANGE_DETAIL = '{target} is {noun}: {pole} weighs more in what they choose.';
/** Same, for an influence that carries no value drift (the older intervention kinds). */
export const TARGET_INFLUENCE_CHANGE_DETAIL_PLAIN = '{target} is {noun}.';

/** The receipt's change line for a trait or condition the cast placed on / lifted from the target. */
export const TARGET_TRAIT_GAINED_TITLE = 'They carry something new';
export const TARGET_TRAIT_GAINED_DETAIL = '{target} now carries {trait}.';
export const TARGET_TRAIT_LOST_TITLE = 'Something left them';
export const TARGET_TRAIT_LOST_DETAIL = '{target} no longer carries {trait}.';

/**
 * The line the mortal's own Story So Far tells about the cast — past tense, the
 * narrator speaking to the god. Keyed by intervention type; `default` covers any
 * other cast that changed the target.
 */
export const CAST_DIGEST_LINES: Readonly<Record<string, string>> = {
  dream: 'Your hand reached into their sleep, and they woke leaning a little further toward {pole}.',
  persuade: 'Your will pressed on them, and they took the conviction for their own.',
  default: 'Your hand touched their life, and it did not pass without a mark.',
};

/** Fill `{slot}` tokens from a map; unknown slots are left as written. */
export function fillReceiptSlots(line: string, slots: Readonly<Record<string, string>>): string {
  return line.replace(/\{(\w+)\}/g, (whole, key: string) => (key in slots ? slots[key] : whole));
}

// ─── Spine gift placement lines (THR-1606) ─────────────────────────────────────

/** Chronicle-tier significance a spine gift's placement event carries (≥ the chronicle threshold). */
export const GIFT_PLACEMENT_SIGNIFICANCE = 0.85;

/** "Take the Seat" — `{place}` is the settlement the seat was raised in. */
export const GIFT_SEAT_PLACED_LINE = 'A seat is raised for you in {place}.';
/** "Leave Your Mark" — `{bearer}` carries `{artifact}`. */
export const GIFT_ARTIFACT_PLACED_LINE = '{bearer} now carries {artifact}.';
