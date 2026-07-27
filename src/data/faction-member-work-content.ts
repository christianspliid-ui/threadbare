/**
 * Faction Member Work Content — prose for guild work the player never watches (THR-815).
 *
 * The content problem this file answers is unusual. Every other encounter surface in the
 * game narrates a *scene*: a curated chapter the god chose to look at, resolved step by
 * step. Off-screen guild work has no scene — an ambient member is not simulated
 * individually, so there is nothing to describe moment to moment and nothing would be
 * honest about claiming there was.
 *
 * So the register here is **reported**, not witnessed. The world tells you what has
 * already happened somewhere you were not looking. That is also the game's framing of
 * what a god's attention costs: what you do not watch still happens, and reaches you
 * secondhand or not at all.
 *
 * Two surfaces, deliberately unequal:
 *   - {@link FACTION_MEMBER_WORK_PROMOTION_PROSE} is player-facing. A named mortal
 *     changing standing in a named guild is a world beat worth a line in the feed.
 *   - {@link FACTION_MEMBER_WORK_SUMMARY_PROSE} is trace-only (inspectability, NFP #2).
 *     Individual jobs do not surface — 227 memberships' worth of routine errands would
 *     drown the feed and tell the player nothing they can act on.
 *
 * Selection is by deterministic index, never `Math.random` (NFP #3).
 */

/**
 * Player-facing promotion lines, chosen by deterministic index.
 *
 * Placeholders: `{agent}`, `{rank}`, `{faction}`. Every line must read correctly with a
 * rank name that is a noun phrase ("Ranger Captain", "Journeyman") and must carry the
 * secondhand framing — the god learns of this, they did not attend it.
 */
export const FACTION_MEMBER_WORK_PROMOTION_PROSE: readonly string[] = [
  'Word reaches you late: {agent} now answers to {rank} in {faction}.',
  '{agent} has been raised to {rank} in {faction}, in a room you were not watching.',
  'The ledgers of {faction} were amended while your attention lay elsewhere. {agent} stands {rank} now.',
  'Somewhere out of sight, {faction} found {agent} worth keeping. They carry {rank} from today.',
  '{agent} took the oath of {rank} before {faction}. You hear of it after the fact.',
];

/**
 * Trace-only summaries of a resolution pass, keyed by outcome.
 *
 * Placeholders: `{faction}`, `{count}`, `{work}` — `{work}` is the authored template's
 * display name, so the trace names the actual content that resolved rather than
 * describing guild work in the abstract.
 */
export const FACTION_MEMBER_WORK_SUMMARY_PROSE: Readonly<Record<'success' | 'failure', readonly string[]>> = {
  success: [
    '{faction} closed out {work}; the credit went where it was earned.',
    'A quiet success on {work} for {faction}.',
    '{work} came good for {faction}, and someone was owed for it.',
  ],
  failure: [
    '{work} went badly for {faction}. Nothing to show and nobody to thank.',
    '{faction} put someone on {work}. They came back with the job undone.',
    'The attempt at {work} cost {faction} the effort and returned none of it.',
  ],
};

/**
 * Fill `{key}` placeholders in a template string.
 *
 * Unknown placeholders are left verbatim rather than blanked: a visible `{typo}` in a
 * trace is a bug that gets fixed, whereas a silent empty string is a bug that ships.
 */
export function fillMemberWorkProse(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

/**
 * Pick a line by deterministic index. `selector` is any non-negative integer derived
 * from seeded state (a PRNG draw scaled to the pool, a hash, a tick) — never a call to
 * `Math.random`, which would break replay (NFP #3).
 */
export function pickMemberWorkProse(pool: readonly string[], selector: number): string {
  if (pool.length === 0) return '';
  const index = Math.abs(Math.floor(selector)) % pool.length;
  return pool[index];
}
