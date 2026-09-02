/**
 * Tunables for the Undertaking Contract (THR-1300 slice 1).
 *
 * Plan: `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md` § Stage 3 and
 * § Constants table. Every number the contract compares against lives here, named
 * (NFP #1), with the measurement it was derived from — the bands are the shipped
 * corpus's authored range per tier plus a margin, never a value invented at a desk.
 *
 * Measured 2026-09-02 over the 64 shipped templates (`getAllStrategicTemplates()`),
 * tier read from the kind row a template is registered in:
 *
 * | tier | templates | checkpointDifficulty | payoffValue | projectDuration |
 * |------|-----------|----------------------|-------------|-----------------|
 * | 1    | 19        | 0.40 – 0.55          | 0.5 – 0.8   | 5 – 10          |
 * | 2    | 6         | 0.45 – 0.55          | 1.0 – 1.5   | 4 – 8           |
 * | 3    | 3         | 0.45 – 0.55          | 1.4 – 2.0   | 4 – 6           |
 *
 * The 36 row-less templates carry no tier and are not band-checked; the kind
 * membership block is what reports them.
 */

/** Inclusive `checkpointDifficulty` band per tier: the measured range ± 0.05. */
export const UNDERTAKING_TIER_DIFFICULTY_BANDS: Readonly<Record<1 | 2 | 3, readonly [number, number]>> = {
  1: [0.35, 0.6],
  2: [0.4, 0.6],
  3: [0.4, 0.6],
};

/**
 * Inclusive `payoffValue` band per tier: the measured range widened by roughly a
 * fifth on each side, and deliberately **non-overlapping at the boundaries that
 * matter** — a T1 work must not be worth what a T2 work is worth, or the board's
 * one currency stops ranking tiers (`computeExpectedValuePerTick`).
 */
export const UNDERTAKING_TIER_PAYOFF_BANDS: Readonly<Record<1 | 2 | 3, readonly [number, number]>> = {
  1: [0.4, 0.9],
  2: [0.9, 1.6],
  3: [1.3, 2.2],
};

/**
 * Distinct `VALUE_PAIRS` members a template's `motivations` must name. Two, the
 * floor `undertaking-motivations.test.ts` has enforced since THR-1292 — a floor and
 * not an equality because `computeDesireScore` averages over the set.
 */
export const UNDERTAKING_MOTIVATION_MIN_ARITY = 2;

/** `activityProse` entries a template must author (one is the corpus minimum). */
export const UNDERTAKING_ACTIVITY_PROSE_MIN = 1;
/** `completionProse` entries a template must author. */
export const UNDERTAKING_COMPLETION_PROSE_MIN = 1;

/**
 * Law 56's inverse, Half A (warn-level at introduction, THR-1224's bar): the nouns
 * each kind's object may be *named by* in completion prose. A completion sentence
 * that claims a consequence outside the declared write set — a "fortune" from a
 * work that writes an intelligence record — is prose claiming state the engine
 * never wrote. Keyed by the kind row's `lexicon` word; `default` covers a
 * mutation-only template with no row.
 */
export const UNDERTAKING_CONSEQUENCE_LEXICON: Readonly<Record<string, readonly string[]>> = {
  cache: ['cache', 'record', 'archive', 'knowledge', 'findings', 'treatise', 'map', 'lore', 'secret', 'account'],
  mark: ['mark', 'informant', 'secret', 'leverage', 'hold', 'debt', 'favour', 'favor', 'ear', 'whisper'],
  // Keys are the rows' `lexicon` ids as authored in `undertaking-kinds.ts`
  // (`item`, `band` — not the kind names), so a row's word is the lookup.
  item: ['masterwork', 'work', 'piece', 'blade', 'craft', 'commission', 'made', 'forge', 'wrought'],
  chart: ['chart', 'find', 'route', 'path', 'pass', 'ford', 'discovery', 'survey', 'mapped'],
  network: ['network', 'contact', 'ally', 'allies', 'ring', 'agents', 'ties', 'web', 'circle'],
  route: ['route', 'road', 'caravan', 'trade', 'goods', 'wagons', 'convoy', 'market', 'toll'],
  place: ['settlement', 'hall', 'holdfast', 'camp', 'outpost', 'walls', 'founded', 'stones', 'seat', 'site'],
  band: ['warband', 'band', 'company', 'captain', 'captains', 'blades', 'muster', 'oath', 'sworn'],
  default: [],
};

/**
 * Consequence nouns the warn-level lexicon check looks for in completion prose —
 * the words that *claim* a written thing. A sentence naming none of these makes
 * no state claim and is not judged; one naming a noun outside its kind's list is
 * the leak. Small on purpose: right most of the time is a warning's bar.
 */
export const UNDERTAKING_CONSEQUENCE_CLAIM_NOUNS: readonly string[] = [
  'fortune', 'gold', 'coin', 'title', 'crown', 'throne', 'army', 'fleet', 'kingdom', 'realm',
  'temple', 'church', 'shrine', 'guild', 'order', 'dynasty', 'heir', 'marriage', 'alliance', 'treaty',
  'cache', 'archive', 'treatise', 'informant', 'masterwork', 'chart', 'network', 'route', 'settlement', 'warband',
];
