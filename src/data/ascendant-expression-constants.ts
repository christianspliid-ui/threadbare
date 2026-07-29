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

/**
 * One-time essence to consecrate via the *relic* variant (THR-518). The player
 * pays this high upfront cost to mint a permanent relic artifact that sustains
 * the consecration with **zero ongoing upkeep** — the spawned control effect's
 * `perTickCost` is waived for as long as the relic exists (THR-509
 * `relic_upkeep_substitute`). Destroying the relic lapses the effect, giving
 * rivals a contestation vector. Sized as ~30 ticks of `CONSECRATE_PERTICK`
 * (0.3 × ~30 ≈ 9) plus the base `CONSECRATE_ESTABLISH_COST` (4): paying it pays
 * off only for a consecration the player intends to hold long-term.
 */
export const CONSECRATE_RELIC_UPFRONT = 13;

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

// ─── THR-605 Slice 2: Artifact trio (attune / curse / nullify) ────────────────
// The three artifact-ward verbs write the same `properties.effects` array the
// effect walker (`collectAttachmentEffects`) reads off any possessed/bonded
// artifact — so each is genuinely consumed, no new consumer subsystem:
//   • attune  → appends the ascendant's-sphere positive passive (SPHERE_EFFECT_TABLE)
//   • curse   → appends a concealed per-tick quintessence drain (inverse of the
//               bestow regen boon), consumed by `tickResourceManipulate`
//   • nullify → clears the array + the attune/curse flags back to inert

/**
 * Per-tick quintessence a cursed artifact drains from whoever carries it. Applied
 * as a NEGATIVE-amount per-tick `resource_manipulate` effect — the direct inverse
 * of the bestow boon (`BESTOW_QUINTESSENCE_REGEN` = 0.01), sized one notch higher
 * so an unnoticed curse is a real drag on the bearer's action economy. Clamped at
 * 0 (never negative) by `tickResourceManipulate` (effectTick.ts). The bearer is
 * not told (`curseConcealed`), matching the prose "spreads its effects … without
 * their knowledge."
 */
export const CURSE_QUINTESSENCE_DRAIN = 0.02;

/**
 * Severity of the concealed `hidden_mark` placed on the artifact's *bearer* when a
 * held artifact is cursed (THR-661). Severity drives both reveal probability
 * (`severity * REVEAL_PROBABILITY_MULT` — 0.5 here → 0.45 per matching draw) and
 * decay lifetime, so a curse is a real, findable footprint rather than a permanent
 * secret. Sits one notch below `DIVINE_WORKING_MARK_SEVERITY` (0.55): the working
 * itself is the god's act, whereas this mark is only the residue it left on a
 * mortal — quieter, and correspondingly harder to trace.
 * @range 0.3–0.7
 */
export const CURSE_MARK_SEVERITY = 0.5;

/**
 * Template-id prefixes whose draws can surface a bearer's curse mark. Matched by
 * `templateId.startsWith(family)` (`evaluateMarkReveals`), so every entry must be a
 * prefix of templates the **bearer** — a mortal — can actually draw.
 *
 * This is deliberately NOT `DIVINE_WORKING_REVEAL_FAMILIES` (`hex.` / `loc.` /
 * `artifact.`): those are the *ascendant's* own casting families and match **zero**
 * mortal-drawable templates (measured, THR-661), so reusing them would have made
 * this mark unrevealable by construction. The two families below are the shipped
 * investigation/veil surfaces a mortal genuinely draws:
 *   • `encounter.anomaly.` — 10 templates, all `actorAffinities: ['individual']`;
 *     the "something here is wrong, look closer" family.
 *   • `action.veil.`      — 4 mortal veil actions (detect-magic, dispel,
 *     modify-enchantment, cast-spell); working the veil is how a bound malediction
 *     gets noticed.
 */
export const CURSE_MARK_REVEAL_FAMILIES: readonly string[] = ['encounter.anomaly.', 'action.veil.'];

// ─── THR-605 Slice 4: Plant Trap (sub.trap) ───────────────────────────────────
// `[trap] <sublocation>` plants a concealed snare. There is no hex-arrival gate
// in the encounter-seed substrate (`evaluateEncounterSeeds` spawns a seed's
// template for its `targetAgentId` the moment `tick >= eligibleAfterTick`,
// regardless of where that agent stands), so the plan's "no targetAgentId, fires
// on the next agent to occupy the hex" is unreachable without net-new machinery.
// The honest reuse of the existing consumed substrate: pick the intended victim
// already present at the trapped sublocation (or, failing that, its hex) at plant
// time and seed the authored `encounter.trap.sprung` beat against them — the same
// seed → spawn path the faction governance verbs use. Genuinely consumed: the
// victim is pulled into a real, failable negative encounter.

/** Template id of the authored trap-sprung beat the seed spawns. */
export const TRAP_SPRUNG_TEMPLATE_ID = 'encounter.trap.sprung';

/**
 * Encounter-seed priority stamped on a planted trap. Mirrors the seed-schema
 * `priority` field the faction seeds set; higher means the sprung-trap beat
 * outranks ambient beats where a scorer compares seeds. `evaluateEncounterSeeds`
 * spawns eligible seeds directly (it does not currently rank by priority), so this
 * is schema-forward rather than load-bearing today.
 */
export const TRAP_SEED_PRIORITY = 0.8;

/**
 * Ticks between planting the snare and its earliest spring. 0 = live on the next
 * tick's seed evaluation, catching the victim who is standing in it now (matching
 * the prose "waits patiently … activates … when the right conditions are met" —
 * the condition being their presence). Raise to make a trap lie dormant longer.
 */
export const TRAP_SEED_DELAY_TICKS = 0;
