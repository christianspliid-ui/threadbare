/**
 * Faction Member Work Constants — tunables for THR-815 off-screen guild work.
 *
 * The attention-tier model's premise is that `ambient` actors are not simulated
 * individually. Faction membership, however, is seeded almost entirely onto ambient
 * NPCs (225 of 227 on seed 42 / medium), while `phaseAgentDecision` — the phase that
 * generates guild-quest candidates — iterates `spotlight` individuals only. The result
 * measured in THR-810/THR-814 was a guild economy switched off for 99% of its
 * participants: **zero** reputation gain across a full live run.
 *
 * This module's numbers govern the resolution path that closes that gap at the tier the
 * simulation actually runs: the faction node, inside `phaseFactionActions`.
 *
 * Per CLAUDE.md NFP #1 (Tunability): every magic number lives here, named. Changing the
 * feel of the guild economy is changing a number in this file, not rewriting logic.
 * Verdict doc: `Docs/audits/2026-07-27-thr-814-faction-draw-path.md`
 */

import type { FactionEncounterMeta } from '../types/faction';

// ─── Cadence and cost ceiling ────────────────────────────────────────────────

/**
 * Ticks between member-work evaluation passes.
 *
 * Deliberately coarser than the tick rate: guild work is background texture, not a
 * per-tick heartbeat. At 12 ticks per in-game day this is roughly two passes a day.
 */
export const FACTION_MEMBER_WORK_INTERVAL = 6;

/**
 * Fraction of a faction's off-loop membership resolved per evaluation pass.
 *
 * Proportional rather than flat, and that is load-bearing rather than tidy. A flat cap
 * makes each member's turn come round every `members / cap` passes, so per-member
 * cadence scales *inversely* with guild size: measured on seed 42 / medium with a flat
 * cap of 3, the 45-member Merchant Consortium gave each member a job roughly every 90
 * ticks and its ladder topped out at 0.765 against an apex of 0.85, while the 3-member
 * Underking's Court saturated at 1.000. The largest guilds — the ones whose apex tiers
 * carry the most authored content — were the ones structurally unable to reach it,
 * which is the same shape of defect THR-810 was filed for.
 *
 * Scaling the window with membership holds cadence roughly constant across guild sizes.
 */
export const FACTION_MEMBER_WORK_MEMBER_FRACTION = 0.15;

/** Floor, so a guild of two or three still sees work at a usable rate. */
export const FACTION_MEMBER_WORK_MIN_PER_FACTION = 2;

/**
 * Maximum members resolved per faction per evaluation pass.
 *
 * This is the NFP #7 cost ceiling, and the reason this path is affordable where
 * promoting members to `spotlight` was not: work is O(members) to filter and O(this) to
 * resolve, once every {@link FACTION_MEMBER_WORK_INTERVAL} ticks, against ~240 full
 * agent decisions *per tick* for the rejected alternative.
 */
export const FACTION_MEMBER_WORK_MAX_PER_FACTION = 8;

// ─── Outcome ─────────────────────────────────────────────────────────────────

/**
 * Base probability that a member's off-screen guild work succeeds.
 *
 * Set below the on-screen ladder's clean-success rate on purpose. The world is
 * capability-poor by design (see the rulebook's outcome ladder); routine guild work a
 * god never looked at should not be more reliable than a curated chapter.
 */
export const FACTION_MEMBER_WORK_SUCCESS_BASE = 0.55;

/**
 * Success-probability penalty per quest tier. Harder authored work fails more often
 * off-screen, which is what keeps the upper rank tiers from filling automatically once
 * a member can reach them.
 */
export const FACTION_MEMBER_WORK_TIER_PENALTY: Readonly<
  Record<FactionEncounterMeta['questType'], number>
> = {
  standard: 0,
  senior: 0.15,
  elite: 0.30,
  leadership: 0.40,
};

/** Floor on the derived success probability, so no tier is unwinnable by construction. */
export const FACTION_MEMBER_WORK_MIN_SUCCESS = 0.1;

/**
 * Scale applied to the reputation a successful off-screen resolution pays, relative to
 * the same template resolved on-screen.
 *
 * Off-screen work is a summary, not a chapter: the player did not watch it, no steps
 * were rolled, no story artifact was produced. Paying it full freight would make the
 * unattended path the efficient one, which inverts the game's attention economy. Half
 * rate still clears the decay floor comfortably — see the cadence arithmetic in the
 * THR-815 completion notes.
 */
export const FACTION_MEMBER_WORK_REWARD_SCALE = 0.5;

// ─── Determinism ─────────────────────────────────────────────────────────────

/**
 * PRNG salt for the member-work stream (NFP #3).
 *
 * Its own multiplier so member-work luck never shifts the faction *action* rolls in the
 * same phase — the same separation `spawnFactionBands` uses with multiplier 97.
 */
export const FACTION_MEMBER_WORK_PRNG_SALT = 0x6d17;
