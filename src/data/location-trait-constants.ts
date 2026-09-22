/**
 * Location-trait minting — every number the phase and the pool term read (THR-790).
 *
 * A place earns a trait from what the world already measures about it and loses it
 * when the measure recovers. Four rules, each the settlement-promotion shape
 * (`phaseSettlementPromotion.ts`): an **enter** threshold, a **release** threshold
 * below it (the gap is the dead band that stops a place flickering), and a sustain
 * counter persisted on the Location node that must reach `LOCATION_TRAIT_SUSTAIN_TICKS`
 * before the trait mints. The counter holds inside the band and resets only below
 * release, so a one-tick dip does not cost a town three days of prosperity.
 *
 * Tuning the feel of a living place is editing this file (NFP #1) — never the phase.
 *
 * ## The scales these read
 *
 * | Input | Writer | Scale |
 * |---|---|---|
 * | `prosperity` | `phaseProsperity.ts` | 0–100 (two writers use 0–1 — a monster den and a ruin — and read as Destitute here, which is correct) |
 * | `unrest` | `phaseUnrest.ts` | 0–100; `UNREST_DEFECTION_THRESHOLD` is 70 |
 * | `magicalSaturation` | `phaseMagicalSaturation.ts` | 0–1; `MAGICAL_SATURATION_VISIBILITY_THRESHOLD` is 0.3 |
 * | `deathCount` | `agentLifecycle.ts` | count of deaths recorded at the place |
 *
 * ## Why `#blood-soaked` is not here
 *
 * There is no per-location battle record — battles overwrite prosperity and subtype
 * and mint no Event node — and `deathCount` counts every death. Minting *blood-soaked*
 * from the death count would call a plague a massacre. The dead enter `#haunted` as a
 * co-condition instead, where *many died here and the veil is thin* is the fiction.
 */
import { LOCATION_CONDITION_ID_PREFIX } from './condition-trait-content';

// ─── The four traits ────────────────────────────────────────────────────────

/** The ids the phase mints, under the prefix that declares them a place's. */
export const LOCATION_TRAIT_IDS = {
  welcoming: `${LOCATION_CONDITION_ID_PREFIX}welcoming`,
  lawless: `${LOCATION_CONDITION_ID_PREFIX}lawless`,
  veilThin: `${LOCATION_CONDITION_ID_PREFIX}veil_thin`,
  haunted: `${LOCATION_CONDITION_ID_PREFIX}haunted`,
} as const;

export type LocationTraitRuleId = keyof typeof LOCATION_TRAIT_IDS;

/** Which of the world's scalars a rule reads. */
export type LocationTraitInput = 'prosperity' | 'unrest' | 'saturation';

// ─── Sustain ────────────────────────────────────────────────────────────────

/**
 * Ticks a scalar must hold at or past its enter threshold before the trait mints —
 * three game days (12 ticks a day). The promotion phase asks 20 for a tier change;
 * a trait is a lighter thing than a new tier, but it is also a *word on the page*,
 * and a word that appears and vanishes inside a day teaches the player nothing.
 */
export const LOCATION_TRAIT_SUSTAIN_TICKS = 36;

// ─── Bands ──────────────────────────────────────────────────────────────────

/**
 * Prosperity band for *Welcoming* (0–100).
 *
 * **Calibrated against the world, not the precedent.** The plan's draft took the
 * promotion phase's 70 and narrowed the release to 50; the census then read
 * `UNMINTED` on seed 42 and one town on seed 99 that no mortal ever visited. Measured
 * 2026-09-22 (medium, 150 ticks, seeds 42 / 99): settlement prosperity sits at a p50
 * of 14–17 and a p90 of 27–30; the busiest capitals and cities *average* 28–38 and
 * peak at 54–63; exactly one place in two worlds ever held ≥ 70. Seventy is a
 * threshold the settlement-promotion phase itself almost never crosses — a boom town
 * on this scale is one holding forty for three days, which the top two or three
 * cities per world do. Release at 25 keeps the band wide enough that a busy city's
 * ordinary breathing (±10 across a season) cannot flicker it.
 */
export const LOCATION_TRAIT_WELCOMING_ENTER = 40;
export const LOCATION_TRAIT_WELCOMING_RELEASE = 25;

/**
 * Unrest band for *Lawless* (0–100). `phaseUnrest.ts` names 70 as the defection
 * threshold and 90 as the sack threshold. Measured on the same runs: one or two
 * places per world spike to 88–99 and hold there for weeks, a handful sit at 50–60,
 * everything else decays to zero. Fifty is the point past which a place has stopped
 * answering to anyone and is still short of the sack; the defection line at 70 would
 * mint on the one place per world that is about to fall anyway. Release at 30 lets
 * the word outlast the riot by a little, which is the fiction.
 */
export const LOCATION_TRAIT_LAWLESS_ENTER = 50;
export const LOCATION_TRAIT_LAWLESS_RELEASE = 30;

/**
 * Saturation band for *Veil-thin* (0–1). `phaseMagicalSaturation.ts` names 0.3 as
 * the visibility threshold — the point at which mortals can *see* the residue —
 * which is exactly when a place starts to read as thin.
 */
export const LOCATION_TRAIT_VEIL_THIN_ENTER = 0.3;
export const LOCATION_TRAIT_VEIL_THIN_RELEASE = 0.15;

/**
 * Saturation band for *Haunted* (0–1), the stronger trait. 0.5 is the phase's own
 * Veil-bonus threshold. Haunted also needs the dead (below); a saturated place with
 * no deaths is veil-thin, not haunted.
 */
export const LOCATION_TRAIT_HAUNTED_ENTER = 0.5;
export const LOCATION_TRAIT_HAUNTED_RELEASE = 0.3;

/** `deathCount` co-condition for *Haunted* — a handful, not one unlucky traveller. */
export const LOCATION_TRAIT_HAUNTED_DEATHS = 5;

// ─── The pool term ──────────────────────────────────────────────────────────

/**
 * Cap on the summed pool bonus a place's traits may add to one candidate. The
 * same order as `ECON_SCORING_WEIGHT` (0.15): a strong thumb on the scale, not a
 * verdict — a marked place leans toward its stories, it does not script them.
 */
export const LOCATION_TRAIT_ENCOUNTER_BONUS_CAP = 0.15;

/**
 * Trait id × content tag → additive pool bonus (THR-790).
 *
 * The reader is `computeLocationTraitBonus` (`engine/locationTraitBonus.ts`),
 * called from `scoreAndSelect` beside the economic-context term: for every location
 * trait the candidate's place carries, every tag the candidate template carries is
 * looked up here and the hits are summed, then clamped to
 * {@link LOCATION_TRAIT_ENCOUNTER_BONUS_CAP}. An unknown tag reads 0.
 *
 * **Keyed by seated content tags, on any axis.** The rows below name the reach
 * tags the registry *projects* from a template's `reach` (`#gold`, `#shadow`, …)
 * as well as the authored family words (`#tavern_night`, `#delve`, …). Measured on
 * `main` 2026-09-22 over 236 shipped encounter templates: the projected reach tags
 * are carried by all of them, the family words by 16 — so a table keyed on family
 * words alone would move nothing today, and a family-only row is the theatre
 * THR-800 named. A new family joins by carrying its tag; nothing here is edited.
 * Every key must be seated in `CONTENT_TAGS` — `locationTraitBonus.test.ts` fails a
 * spelling that is not.
 */
export const LOCATION_TRAIT_ENCOUNTER_BONUS: Readonly<
  Record<string, Readonly<Record<string, number>>>
> = {
  // A welcoming town throws its doors open: markets, common rooms, company.
  [LOCATION_TRAIT_IDS.welcoming]: {
    '#gold': 0.08,
    '#heart': 0.08,
    '#social': 0.10,
    '#trade': 0.10,
    '#commercial': 0.08,
    '#tavern_night': 0.10,
  },
  // A lawless town is where the quiet work and the loud work both get done.
  [LOCATION_TRAIT_IDS.lawless]: {
    '#shadow': 0.10,
    '#iron': 0.06,
    '#stealth': 0.10,
    '#combat': 0.08,
    '#thieves_errand': 0.12,
  },
  // Where the veil is thin, the learned and the curious gather.
  [LOCATION_TRAIT_IDS.veilThin]: {
    '#veil': 0.10,
    '#star': 0.05,
    '#arcane': 0.10,
    '#anomaly': 0.10,
    '#mystical': 0.08,
  },
  // Haunted ground draws the uncanny stories — and the ones that go down into it.
  [LOCATION_TRAIT_IDS.haunted]: {
    '#veil': 0.08,
    '#shadow': 0.08,
    '#supernatural': 0.12,
    '#anomaly': 0.10,
    '#fate': 0.08,
    '#delve': 0.06,
  },
};

// ─── Chronicle ──────────────────────────────────────────────────────────────

/**
 * Significance of the chronicle line a mint writes (`${place} has become ${word}`).
 * Below a tier change (0.9) and above the ambient economic pulse; a place quietly
 * returning to itself writes no line at all (UI Law 13 parity — absence is not an
 * event).
 */
export const LOCATION_TRAIT_EVENT_SIGNIFICANCE = 0.4;

// The effect rows the four carry — their movement multipliers and step modifiers —
// live in `condition-trait-content.ts` beside the six shipped conditions' rows, so
// the three readers keep one table each and this module imports from that file in
// one direction only.
