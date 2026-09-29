/**
 * `FIRED_TEMPLATE_COMPLETION` — the templates the player actually meets, finished
 * in firing order. THR-1634.
 *
 * Plan: `Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md`
 * § What "complete" means, § E3.
 *
 * **What it is.** Every id here has been completed by a slice of that plan: every
 * runnable step (branch arms and fallbacks included) carries the full afterimage
 * ladder and offers the god a verb, and every aftermath path authors an ending for
 * each losing band it can reach. `firedTemplateCompletion.test.ts` asserts that on
 * the **shipped** template, so a converter that drops a field fails here rather
 * than shipping data nobody reads (the THR-838 trap).
 *
 * **It only grows.** The reverse of `RETROFIT_PENDING`: a slice appends its ids in
 * the commit that completes them. Removing one is a deliberate edit a reviewer
 * sees, never a side effect.
 *
 * Authoring side only (`content-eval`), off the client bundle.
 */
export const FIRED_TEMPLATE_COMPLETION: readonly string[] = [
  // S1 (THR-1634): the ten most-fired templates on the 2026-09-28 attended run.
  'crafting.quest.flawed_steel',
  'encounter.assess_holdings',
  'encounter.barter_supplies',
  'encounter.barter_with_travelers',
  'encounter.commune_with_stars',
  'encounter.decipher_old_markings',
  'encounter.local_tales',
  'encounter.pickpocket',
  'encounter.study_surroundings',
  'encounter.tend_the_weary',
  // S2 (THR-1666): The First's other draws on the 2026-09-29 attended run
  // (origin/main 4f4f0377), incomplete, highest world rank first.
  'encounter.aid_refugees',
  'encounter.arcane_resonance_study',
  'encounter.forage_provisions',
  'encounter.forage_the_land',
  'encounter.guild_aid',
  'encounter.merchants_gambit',
  'encounter.rest_and_recover',
  'encounter.shadow_in_the_night',
  'encounter.smuggle_goods',
  'encounter.trade_caravan_escort',
  // S3 (THR-1667): the next ten incomplete templates by world rank on the
  // 2026-09-29 attended run (origin/main 109e20b8).
  'encounter.listen_for_rumors',
  'encounter.local_gossip',
  'encounter.mend_equipment',
  'encounter.night_watch',
  'encounter.patrol_perimeter',
  'encounter.shore_up_shelter',
  'encounter.steal_secrets',
  'encounter.trace_ley_lines',
  'star.turning.comet_omen',
  'veil.truth.page_beneath_saint',
];

/** Templates per slice: one executor run's worth of prose (~60–80 lines). */
export const COMPLETION_SLICE_TEMPLATES = 10;

/** E2: attended ms per tick after a slice's deals, as a percentage over a same-session baseline. */
export const COMPLETION_TICK_BUDGET_PCT = 5;

/**
 * Kill check after each slice: no template above this share of attended firings.
 * Matches the damper's own target (`NOVELTY_GLOBAL_SHARE_TARGET`), because
 * completion must not change the draw.
 */
export const COMPLETION_TOP_TEMPLATE_SHARE_MAX = 0.04;

/**
 * Stop rule after S3: a fourth slice is filed only if the next ten incomplete
 * templates carry at least this share of attended firings (or at least two of
 * The First's draws). The design lane's call, with the numbers.
 */
export const COMPLETION_NEXT_SLICE_MIN_SHARE = 0.08;
