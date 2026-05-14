/**
 * Faction Action Constants — tunables for THR-400 faction governance verbs.
 *
 * Four divine-action verbs operate on faction targets:
 *   - Stir Dissent       — fracture handle; raises dissentLevel, threshold seeds an encounter
 *   - Whisper to Leader  — redirect; persuasion-shape effect aimed at the resolved leader
 *   - Recover Doctrine   — elevate; consumes a recovered_doctrine clue and realigns the faction
 *   - Surface a Doubter  — expose; surfaces the most misaligned member as a thread candidate
 *
 * Per CLAUDE.md NFP #1 (Tunability): every magic number lives here, named.
 * Plan doc: Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md §6
 */

// ─── Stir Dissent ────────────────────────────────────────────────────────────

/** Essence cost paid to cast Stir Dissent. */
export const STIR_DISSENT_ESSENCE_COST = 8;

/** How much one Stir Dissent cast raises a faction's dissentLevel (0..1 scale). */
export const STIR_DISSENT_INCREMENT = 0.25;

/** Per-tick dissent decay — drifts dissentLevel back toward zero each tick. */
export const DISSENT_DECAY_PER_TICK = 0.005;

/** Dissent threshold that seeds the surfaces-dissent encounter (then resets to 0). */
export const DISSENT_ENCOUNTER_THRESHOLD = 0.6;

/** Encounter template seeded when dissent threshold is crossed. */
export const STIR_DISSENT_SEEDED_ENCOUNTER_ID = 'faction.encounter.dissent_surfaces';

// ─── Whisper to the Leader ──────────────────────────────────────────────────

/** Essence cost paid to cast Whisper to the Leader. */
export const WHISPER_LEADER_ESSENCE_COST = 6;

/** Ticks the divine_whisper_pending condition persists on the leader. */
export const WHISPER_LEADER_CONDITION_DURATION = 12;

/** Tick delay before the optional leader-crossroads encounter becomes eligible. */
export const LEADER_WHISPER_FOLLOWUP_DELAY = 4;

/** Encounter template optionally seeded after a Whisper to the Leader cast. */
export const WHISPER_LEADER_FOLLOWUP_ENCOUNTER_ID = 'faction.encounter.leader_at_a_crossroads';

// ─── Recover Doctrine ────────────────────────────────────────────────────────

/** Essence cost paid to cast Recover Doctrine. */
export const RECOVER_DOCTRINE_ESSENCE_COST = 8;

/** Ticks the recovered-doctrine realignment lasts before adoption verdict. */
export const RECOVERED_DOCTRINE_REALIGN_DURATION = 24;

/** Encounter template seeded when Recover Doctrine fires. */
export const RECOVER_DOCTRINE_SEEDED_ENCOUNTER_ID = 'faction.encounter.doctrine_surfaces';

// ─── Surface a Doubter ───────────────────────────────────────────────────────

/** Essence cost paid to cast Surface a Doubter. */
export const SURFACE_DOUBTER_ESSENCE_COST = 8;

/** Minimum axiological misalignment (0..1) for a doubter candidate to be eligible. */
export const SURFACE_DOUBTER_MIN_DISTANCE = 0.35;

/** Dissent contribution from a single Surface a Doubter cast (smaller than Stir Dissent). */
export const SURFACE_DOUBTER_DISSENT_CONTRIBUTION = 0.10;

/** Tick delay before the surfaced doubter's choice encounter becomes eligible. */
export const SURFACE_DOUBTER_ENCOUNTER_DELAY = 6;

/** Encounter template seeded when Surface a Doubter fires. */
export const SURFACE_DOUBTER_SEEDED_ENCOUNTER_ID = 'faction.encounter.doubter_chooses';

// ─── Shared markers ──────────────────────────────────────────────────────────

/** Condition flag set on a member surfaced via Surface a Doubter. */
export const SURFACED_BY_DIVINE_ATTENTION_CONDITION = 'surfaced_by_divine_attention';

/** Condition flag set on a leader receiving a Whisper to the Leader cast. */
export const DIVINE_WHISPER_PENDING_CONDITION = 'divine_whisper_pending';

// ─── Anoint Successor (THR-432) ──────────────────────────────────────────────

/** Essence cost paid to cast Anoint Successor. */
export const ANOINT_SUCCESSOR_ESSENCE_COST = 12;

/** Ticks between succession firing and the inheritance encounter becoming eligible. */
export const INHERITANCE_ENCOUNTER_DELAY = 3;

/** Ticks the `refused_inheritance` condition persists on a successor who refused. */
export const REFUSED_INHERITANCE_CONDITION_DURATION = 30;

/** One-time `member_of` reputation bump for accepting the mantle. Keeps the seated
 *  leader readable as leader under score derivation too, even when the `leads` edge
 *  is the authoritative path. */
export const ACCEPTED_INHERITANCE_REPUTATION_BUMP = 0.15;

/** PRNG salt for equal-recency tiebreak in succession resolution (NFP #3). */
export const SUCCESSION_PRIORITY_TIEBREAK_SALT = 0x5acc;

/** Encounter template planted on the new leader when succession resolves. */
export const INHERITANCE_SEEDED_ENCOUNTER_ID = 'faction.encounter.inheritance';

/** Condition flag set on a successor who accepted the inheritance. */
export const ACCEPTED_INHERITANCE_CONDITION = 'accepted_inheritance';

/** Condition flag set on a successor who refused the inheritance. */
export const REFUSED_INHERITANCE_CONDITION = 'refused_inheritance';

// ─── Kindle a Calling (THR-433) ──────────────────────────────────────────────
//
// Internal-pressure divine action. The player pours essence into the faction's
// latent goal candidates; engine reads (a) member axiological pulls, (b) leader
// bias, (c) doctrine pressure, (d) recent dissent, and bias-weights the
// candidates that `scoreEligibleAmbitions` (factionAmbitions.ts) would produce.
// A seeded PRNG draws one weighted candidate; it replaces the faction's
// `pursues` edge (unless the current ambition is army-locked). A
// `faction.encounter.calling_named` is planted on the leader.
//
// Plan: handoff comment on THR-433 (Cowork → Ready for Dev, 2026-05-14 09:27).

/** Essence cost paid to cast Kindle a Calling. */
export const KINDLE_CALLING_ESSENCE_COST = 10;

/** Encounter template planted on the leader when the calling is named. */
export const KINDLE_CALLING_SEEDED_ENCOUNTER_ID = 'faction.encounter.calling_named';

/** Tick delay before the calling-named encounter becomes eligible. */
export const KINDLE_CALLING_ENCOUNTER_DELAY = 2;

/** Bias weight added per-member when their axiological profile pulls toward an ambition pole. */
export const KINDLE_CALLING_BIAS_WEIGHT_MEMBER = 0.6;

/** Bias weight added by the leader's axiological profile (the leader is one mortal but carries the seat). */
export const KINDLE_CALLING_BIAS_WEIGHT_LEADER = 1.2;

/** Bias added toward cultural_dominance / divine_mandate when recoveredDoctrineId is set. */
export const KINDLE_CALLING_BIAS_WEIGHT_DOCTRINE = 2.0;

/** Bias added toward defensive_consolidation when dissentLevel ≥ DISSENT_BIAS_THRESHOLD. */
export const KINDLE_CALLING_BIAS_WEIGHT_DISSENT = 2.5;

/** Dissent threshold above which the dissent bias engages. */
export const KINDLE_CALLING_DISSENT_BIAS_THRESHOLD = 0.35;

/** Essence-sharpening factor — multiplies all bias contributions before scoring (the player
 *  "pours heat into the embers"; the more they pour, the sharper the rise). With a fixed
 *  essence cost this is effectively a constant tuning knob for how confident the bias is. */
export const KINDLE_CALLING_ESSENCE_SHARPENING = 1.4;

/** PRNG salt for the weighted candidate draw (NFP #3). */
export const KINDLE_CALLING_PRNG_SALT = 0xc4111e;

/** Condition flag set on the leader when a calling has been kindled. */
export const KINDLED_CALLING_PENDING_CONDITION = 'kindled_calling_pending';

/** Ticks the kindled_calling_pending condition persists on the leader. */
export const KINDLED_CALLING_PENDING_DURATION = 18;
