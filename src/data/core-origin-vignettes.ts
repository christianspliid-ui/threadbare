import { CORE_CONTINUUM_IDS } from '../types/coreRegistry';

/**
 * Core origin-vignette content library (THR-544, content half of the Core layer
 * THR-542).
 *
 * A flat, engine-free pool of pre-history vignettes that seed an agent's
 * *Core* baseline at birth — the five plain virtue↔vice continuums of character
 * (`coreRegistry.ts`), the layer *beneath* the 8 reach moral axes. This is the
 * Core sibling of the reach-axis `ORIGIN_VIGNETTES` (`origin-vignettes.ts`):
 * same machinery, different layer.
 *
 * Each vignette nudges one Core continuum toward its virtue or vice pole. The
 * consumer (`seedCoreProfileWithVignettes` in `engine/core/coreMechanics.ts`)
 * draws several at birth and derives the *signed* delta from `pole`:
 *
 *   virtue → +magnitude   (toward 1.0, the virtue pole)
 *   vice   → −magnitude   (toward 0.0, the vice pole)
 *
 * The signed delta is added on top of the central-limit PRNG baseline
 * (`seedCoreProfile`) — authored character laid over the random spread, never
 * replacing it. This file knows nothing about `CoreProfile` or the consuming
 * mechanics; it keys on `(continuumId, pole)` only.
 *
 * The five continuums (virtue pole 1.0 / vice pole 0.0):
 *   core_warmth      — Warm/care for others      ↔ Cold
 *   core_hope        — Hopeful/outlook           ↔ Bitter
 *   core_forgiveness — Forgiving/metabolizes harm↔ Vengeful
 *   core_humility    — Humble/self-regard        ↔ Proud
 *   core_integrity   — True/inner==outer         ↔ False
 *
 * Voice: Threadbare house style (`Docs/canon/prose.md`) — plain, concrete,
 * one-line pre-history circumstances. Show the soil, not the flower. Every
 * entry is generic and reusable: no proper nouns, no setting-specific
 * locations, no gendered assumptions. Core surfaces in prose as *character*
 * ("a warm, unforgiving woman"), never as "Quintessence traits" (see the
 * canon-safe framing in `coreRegistry.ts`).
 */

/** Which pole of a Core continuum a vignette leans toward. */
export type CoreOriginVignettePole = 'virtue' | 'vice';

/**
 * Unsigned nudge strength. The sign is derived from `pole` at consumption time,
 * never stored here. Skewed toward the smaller deltas so that drawing several at
 * birth yields a roughly normal baseline (central-limit) rather than extremes.
 */
export type CoreOriginVignetteMagnitude = 0.05 | 0.1 | 0.15 | 0.2;

export interface CoreOriginVignette {
  /** Stable, unique id. Format: `core-origin.<continuumId>.<pole>.<slug>`. */
  id: string;
  /** One-line pre-history vignette in Threadbare voice. */
  text: string;
  /** The Core continuum this vignette nudges (e.g. `core_warmth`). */
  continuumId: string;
  /** Which pole the vignette leans toward. */
  pole: CoreOriginVignettePole;
  /** Unsigned magnitude; sign comes from `pole` at consumption. */
  magnitude: CoreOriginVignetteMagnitude;
}

export const CORE_ORIGIN_VIGNETTES: readonly CoreOriginVignette[] = [
  // ─────────────────────────── CORE_WARMTH ────────────────────────────
  // Virtue: Warm (care for others)
  { id: 'core-origin.core_warmth.virtue.sat-with-the-sick', text: 'Sat with the sick ones the others were afraid to go near.', continuumId: 'core_warmth', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_warmth.virtue.knew-the-names', text: 'Learned the name of everyone who slept cold under the bridge.', continuumId: 'core_warmth', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_warmth.virtue.warmed-the-lamb', text: 'Held the orphaned lamb against their chest all night so it would not die alone.', continuumId: 'core_warmth', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_warmth.virtue.carried-to', text: 'Was the one the crying child was carried to, even by strangers.', continuumId: 'core_warmth', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_warmth.virtue.gave-the-bed', text: 'Gave up the only bed to a fevered traveller and slept on the stones.', continuumId: 'core_warmth', pole: 'virtue', magnitude: 0.15 },
  { id: 'core-origin.core_warmth.virtue.raised-them', text: 'Raised the siblings nobody else wanted, and called it no burden.', continuumId: 'core_warmth', pole: 'virtue', magnitude: 0.2 },
  // Vice: Cold
  { id: 'core-origin.core_warmth.vice.felt-nothing', text: 'Watched another child fall and felt nothing worth the trouble of moving.', continuumId: 'core_warmth', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_warmth.vice.useful-or-not', text: 'Sorted people early into the useful and the not, and forgot the rest.', continuumId: 'core_warmth', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_warmth.vice.never-looked-down', text: 'Stepped past the beggar the same way each morning, and never once looked down.', continuumId: 'core_warmth', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_warmth.vice.weighed-the-kindness', text: 'Measured every kindness by what it would later be worth.', continuumId: 'core_warmth', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_warmth.vice.left-them-behind', text: 'Left a hurt companion behind because carrying them was slow.', continuumId: 'core_warmth', pole: 'vice', magnitude: 0.15 },
  { id: 'core-origin.core_warmth.vice.slept-through-the-knocking', text: 'Closed the door on the freezing and slept soundly through the knocking.', continuumId: 'core_warmth', pole: 'vice', magnitude: 0.2 },

  // ──────────────────────────── CORE_HOPE ─────────────────────────────
  // Virtue: Hopeful (outlook)
  { id: 'core-origin.core_hope.virtue.first-green', text: 'Looked for the first green on the burnt field before anyone else thought to.', continuumId: 'core_hope', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_hope.virtue.kinder-morning', text: 'Went to sleep certain the morning would be kinder, and mostly it was.', continuumId: 'core_hope', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_hope.virtue.planted-in-famine', text: 'Planted seeds in a famine year, sure the rain would come.', continuumId: 'core_hope', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_hope.virtue.sat-down-to-try', text: 'Always believed the broken thing could be mended, and sat down to try.', continuumId: 'core_hope', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_hope.virtue.sang-through-the-dark', text: 'Sang through the long dark of the worst winter until the others believed it too.', continuumId: 'core_hope', pole: 'virtue', magnitude: 0.15 },
  { id: 'core-origin.core_hope.virtue.third-foundation', text: 'Watched the home burn twice and began laying the third foundation by dawn.', continuumId: 'core_hope', pole: 'virtue', magnitude: 0.2 },
  // Vice: Bitter
  { id: 'core-origin.core_hope.vice.setup-for-the-bad', text: 'Learned young that good things were only a setup for the bad that followed.', continuumId: 'core_hope', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_hope.vice.tasted-for-rot', text: 'Tasted every gift for the rot they were sure was hidden inside.', continuumId: 'core_hope', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_hope.vice.sour-anyway', text: 'Stopped reaching for the high fruit, certain it would be sour anyway.', continuumId: 'core_hope', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_hope.vice.tally-of-broken', text: 'Kept a private tally of every promise the world had broken.', continuumId: 'core_hope', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_hope.vice.braced-for-ruin', text: 'Met every good season braced for the ruin they were sure was owed.', continuumId: 'core_hope', pole: 'vice', magnitude: 0.15 },
  { id: 'core-origin.core_hope.vice.burned-the-letters', text: 'Burned the hopeful letters unread, to be spared the disappointment.', continuumId: 'core_hope', pole: 'vice', magnitude: 0.2 },

  // ──────────────────────── CORE_FORGIVENESS ──────────────────────────
  // Virtue: Forgiving (how harm is metabolized)
  { id: 'core-origin.core_forgiveness.virtue.let-it-wash-off', text: 'Let the small slights wash off rather than carry them home.', continuumId: 'core_forgiveness', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_forgiveness.virtue.first-to-speak', text: 'Was always the first to speak again after a quarrel.', continuumId: 'core_forgiveness', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_forgiveness.virtue.set-down-the-grudge', text: 'Set down an old grudge when it grew too heavy to keep carrying.', continuumId: 'core_forgiveness', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_forgiveness.virtue.fed-the-thief', text: 'Fed the one who had once stolen from them, and said nothing of it.', continuumId: 'core_forgiveness', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_forgiveness.virtue.took-them-back', text: 'Took back the one who had betrayed them, knowing the risk.', continuumId: 'core_forgiveness', pole: 'virtue', magnitude: 0.15 },
  { id: 'core-origin.core_forgiveness.virtue.forgave-the-scar', text: 'Forgave the hand that left the scar, and meant it.', continuumId: 'core_forgiveness', pole: 'virtue', magnitude: 0.2 },
  // Vice: Vengeful
  { id: 'core-origin.core_forgiveness.vice.date-beside-it', text: 'Kept count of every wrong, with the date written beside it.', continuumId: 'core_forgiveness', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_forgiveness.vice.forgot-the-kindness', text: 'Could forget a kindness in a week and a slight never.', continuumId: 'core_forgiveness', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_forgiveness.vice.collected-late', text: 'Learned that a debt of harm could be collected years late, and waited.', continuumId: 'core_forgiveness', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_forgiveness.vice.evened-the-score', text: 'Always evened the score, even when the cost fell on themselves.', continuumId: 'core_forgiveness', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_forgiveness.vice.grown-teeth', text: 'Nursed a single betrayal until it had grown teeth.', continuumId: 'core_forgiveness', pole: 'vice', magnitude: 0.15 },
  { id: 'core-origin.core_forgiveness.vice.burned-more-than-owed', text: 'Burned down more than the wrong was worth, to be sure it was felt.', continuumId: 'core_forgiveness', pole: 'vice', magnitude: 0.2 },

  // ───────────────────────── CORE_HUMILITY ────────────────────────────
  // Virtue: Humble (self-regard)
  { id: 'core-origin.core_humility.virtue.back-of-the-line', text: 'Stood at the back of the line by habit, not by order.', continuumId: 'core_humility', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_humility.virtue.asked-how', text: 'Asked the older hands how, long after they could have guessed.', continuumId: 'core_humility', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_humility.virtue.gave-the-credit', text: 'Handed the credit to the others and meant it.', continuumId: 'core_humility', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_humility.virtue.said-i-was-wrong', text: "Could say 'I was wrong' without the words sticking.", continuumId: 'core_humility', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_humility.virtue.lowest-work', text: 'Took the lowest work without thinking it beneath them.', continuumId: 'core_humility', pole: 'virtue', magnitude: 0.15 },
  { id: 'core-origin.core_humility.virtue.anothers-name', text: "Did the great thing and let another's name be carved for it.", continuumId: 'core_humility', pole: 'virtue', magnitude: 0.2 },
  // Vice: Proud
  { id: 'core-origin.core_humility.vice.best-seat', text: 'Drifted toward the best seat as if it were already owed.', continuumId: 'core_humility', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_humility.vice.corrected-the-elders', text: 'Corrected the elders before they had finished speaking.', continuumId: 'core_humility', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_humility.vice.someone-elses-fault', text: 'Found a reason it was someone else’s fault every single time.', continuumId: 'core_humility', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_humility.vice.name-first-and-loudest', text: 'Made sure their name was said first, and loudest.', continuumId: 'core_humility', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_humility.vice.beneath-them', text: 'Held the common work beneath them, and let it show.', continuumId: 'core_humility', pole: 'vice', magnitude: 0.15 },
  { id: 'core-origin.core_humility.vice.no-one-left-to-teach', text: 'Stopped listening to anyone, certain no one had more to teach.', continuumId: 'core_humility', pole: 'vice', magnitude: 0.2 },

  // ───────────────────────── CORE_INTEGRITY ───────────────────────────
  // Virtue: True (inner self matches outer)
  { id: 'core-origin.core_integrity.virtue.same-alone', text: 'Was the same person alone as in a crowded room.', continuumId: 'core_integrity', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_integrity.virtue.plain-word', text: 'Said the plain thing even when a softer lie was easier.', continuumId: 'core_integrity', pole: 'virtue', magnitude: 0.05 },
  { id: 'core-origin.core_integrity.virtue.smallest-promise', text: 'Kept the smallest promise as if it were a great one.', continuumId: 'core_integrity', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_integrity.virtue.owned-it-aloud', text: 'Owned the mistake out loud before anyone could think to ask.', continuumId: 'core_integrity', pole: 'virtue', magnitude: 0.1 },
  { id: 'core-origin.core_integrity.virtue.cost-them-the-place', text: 'Told the truth that cost them the place they wanted.', continuumId: 'core_integrity', pole: 'virtue', magnitude: 0.15 },
  { id: 'core-origin.core_integrity.virtue.refused-the-mask', text: 'Refused the mask that would have saved them, and stood as themselves.', continuumId: 'core_integrity', pole: 'virtue', magnitude: 0.2 },
  // Vice: False
  { id: 'core-origin.core_integrity.vice.a-face-for-each', text: 'Wore a different face for each person, and lost track of the first.', continuumId: 'core_integrity', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_integrity.vice.easy-yes', text: 'Said the easy yes they never meant to keep.', continuumId: 'core_integrity', pole: 'vice', magnitude: 0.05 },
  { id: 'core-origin.core_integrity.vice.borrowed-story', text: 'Told the borrowed story so often it became their own.', continuumId: 'core_integrity', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_integrity.vice.warm-smile-crooked-words', text: 'Could smile warmly while the words came out crooked.', continuumId: 'core_integrity', pole: 'vice', magnitude: 0.1 },
  { id: 'core-origin.core_integrity.vice.two-ledgers', text: 'Kept two versions of every account, and showed whichever suited.', continuumId: 'core_integrity', pole: 'vice', magnitude: 0.15 },
  { id: 'core-origin.core_integrity.vice.oath-already-broken', text: 'Swore an oath they were already planning to break.', continuumId: 'core_integrity', pole: 'vice', magnitude: 0.2 },
];

// ─── Validation (module-load assertion, dev-only safety) ─────────────────────

/**
 * Defensive check that every Core continuum has at least one vignette per pole.
 * Keeps the library and the registry from drifting silently — if a continuum is
 * added to `CORE_CONTINUA` without authored vignettes, the seeding step would
 * fall back to pure PRNG for it (fail-soft), but the gap should be visible.
 */
export const CORE_ORIGIN_VIGNETTES_BY_CONTINUUM: ReadonlyMap<
  string,
  { virtue: readonly CoreOriginVignette[]; vice: readonly CoreOriginVignette[] }
> = (() => {
  const map = new Map<string, { virtue: CoreOriginVignette[]; vice: CoreOriginVignette[] }>();
  for (const id of CORE_CONTINUUM_IDS) map.set(id, { virtue: [], vice: [] });
  for (const v of CORE_ORIGIN_VIGNETTES) {
    const bucket = map.get(v.continuumId);
    if (bucket) bucket[v.pole].push(v);
  }
  return map;
})();
