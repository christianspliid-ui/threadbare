/**
 * Ascendant Expression Card constants (THR-508).
 *
 * Tunable numbers for the early expression cards — generic divine verbs the
 * player-god unlocks early via Ascendant Beats. The verb is universal; the
 * magic it produces is flavored by the ascendant's primary domain + sphere
 * (two-domain lock, THR-503).
 *
 * This run ships `imbue` (the one card that composes the already-shipped
 * THR-509 primitives end-to-end with zero new consumer wiring). `consecrate`,
 * `bestow`, and `anoint` are split into their own issues — each needs a
 * genuinely-new consumer subsystem (location-sustained spawn bridge / agent
 * casting / chosen-power consumer) per plan §4.4.
 *
 * Design doc: Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md §4.4
 *
 * NFP #1 (Tunability): every magnitude is a named constant here.
 */

/**
 * Essence cost to imbue an artifact with a sphere-flavored power.
 * Mirrors the `artifact.enchant` cost tier (4) — imbue is a stronger,
 * domain-flavored sibling that actually mutates the artifact's effects.
 */
export const IMBUE_ESSENCE_COST = 4;

/**
 * Upfront essence to establish a `consecrate` site (THR-511). Charged once when
 * the sustained control effect is spawned; mirrors `hex.cultivate`'s upfront tier.
 * The ongoing devotion is `CONSECRATE_PERTICK`; the per-tick faith-spread
 * magnitude reuses `CONSECRATE_DEVOTION_PER_TICK` (src/types/ascendantPrimitives.ts).
 */
export const CONSECRATE_ESTABLISH_COST = 4;

/**
 * Per-tick spirit essence to sustain a consecrated site (THR-511). Mirrors
 * `hex.claim_dominion`'s 0.3/tick sustain cost — consecration is a held presence,
 * not a one-shot. While paid, the site's `perTickThreadAuras` advance every
 * co-located thread toward tier promotion (faith-spread).
 */
export const CONSECRATE_PERTICK = 0.3;

// ─── THR-512: Bestow Power ────────────────────────────────────────────────────
// `[bestow power] <threaded agent>` grants a threaded mortal two persistent
// boons via a "divine gift" artifact the agent possesses (option (a) — reuses
// the imbue/effect-walker path end-to-end; no new consumer subsystem). The gift
// carries two AttachmentEffects read by the existing walkers:
//   1. a `passive` reach bonus in the ascendant's primary domain (effectResolver),
//   2. a per-tick `resource_manipulate` quintessence restore (effectTick).
// Awareness is gated at resolution against the thread edge.

/**
 * One-time essence to bestow power on a threaded agent. One tier above imbue
 * (`IMBUE_ESSENCE_COST` = 4): bestow grants *two* persistent boons to a living
 * mortal rather than one passive to an item.
 */
export const BESTOW_COST = 5;

/**
 * Magnitude of the passive reach bonus the divine gift grants in the ascendant's
 * primary domain. Mirrors `SPHERE_FLAVOR_PASSIVE_VALUE` (the imbue passive) so a
 * bestowed reach bonus is balanced against an imbued one.
 */
export const BESTOW_REACH_BONUS = 2;

/**
 * Per-tick quintessence the divine gift restores to its holder. Quintessence is
 * a 0–1 health-scale value (NOT an accumulator), so this is a regen-rate boost
 * applied via a per-tick `resource_manipulate` effect and clamped to the agent's
 * `quintessenceMax` by `tickResourceManipulate` (effectTick.ts) — never overfills.
 */
export const BESTOW_QUINTESSENCE_REGEN = 0.01;

/**
 * Minimum thread `awareness` tier required to bestow power. The mortal must
 * perceive the divine connection at least as `faith` (tiers, ascending:
 * unaware < intuition < faith < communion). Gated fail-soft at resolution — a
 * thread below this tier no-ops without consuming the grant.
 */
export const BESTOW_MIN_AWARENESS = 'faith' as const;

// ─── THR-513: Anoint Faction ──────────────────────────────────────────────────
// `[anoint] <faction>` flags a threaded faction as the ascendant's CHOSEN
// faction (two-domain lock, THR-503): the chosen power is keyed by the
// ascendant's primary reach (CHOSEN_POWER_TABLE, THR-509). The per-tick consumer
// `phaseChosenFactionPowers` (chosenFactionPowers.ts) then grants the faction's
// members a power-keyed reputation gain — making the previously-dead `chosen`
// status mechanically live.

/**
 * One-time essence to anoint a faction. One tier above bestow (`BESTOW_COST` = 5):
 * anoint is a standing grant that lifts an entire faction's members every tick,
 * not a single mortal's one-shot boon.
 */
export const ANOINT_COST = 6;

/**
 * Default per-tick reputation a chosen faction's members gain (0–1 scale), used
 * when a chosen power has no explicit magnitude in CHOSEN_POWER_EFFECT_TABLE
 * (chosenFactionPowers.ts). Sized to net positive against typical faction
 * `reputationDecayPerTick` so a chosen faction's members steadily rise in
 * standing (which drives rank, access, and bonuses — see factionReputation.ts).
 */
export const CHOSEN_FACTION_REPUTATION_PER_TICK = 0.003;
