/**
 * Economic scene affinity — how boom and bust bend which stories the world tells (THR-725).
 *
 * The player holds four verbs that verifiably move a settlement's prosperity
 * (`loc.bless_harvest`, `loc.blight`, `loc.open_markets`, `loc.reveal_vein`). Before this
 * table existed, `encounterScoring.ts` contained zero economic terms: the numbers moved and
 * the world said nothing back. Every row here is *content* — tuning how the economy answers
 * the god is editing this file, never the scoring code (NFP #1).
 *
 * **Keying.** Rows key on any dot-delimited **id prefix**, longest match winning. Putting
 * affinity on `UnifiedActionTemplate` itself would ripple through 291 importers of
 * `unifiedAction.ts` for what is a tuning table, so the key lives here instead.
 *
 * The plan doc specified the *first* segment only (`tavern.`, `crime.`, `guild.`). That was
 * measured against the substrate and widened — which is the widening the plan's grey-zone
 * note authorised ("widen the table's key format, not the type"). Two findings forced it:
 *
 *   1. The economically-flavoured ids the plan named (`trade_fair.*`, `pickpocket.*`) are not
 *      in `UNIFIED_ACTION_TEMPLATES` at all under those names — they live under
 *      `encounter.*`. Keying on the first segment would have matched nothing, and the whole
 *      feature would have greped green while scoring zero forever.
 *   2. `encounter` is a single first-segment family holding 171 templates of every possible
 *      flavour, from `encounter.pickpocket` to `encounter.offer_small_prayer`. One weight
 *      across all of them is meaningless.
 *
 * `economicSceneAffinity.contract.test.ts` asserts every key below is a live prefix of at
 * least one registered template, so this class of drift cannot return silently.
 *
 * **Weights.** `boomWeight` applies as prosperity climbs above {@link ECON_BOOM_THRESHOLD};
 * `bustWeight` as it falls below {@link ECON_BUST_THRESHOLD}. Both are signed: a festival
 * family carries a positive boom weight and a *negative* bust weight, so revelry gets rarer
 * as the granaries empty. A family with no row is economically neutral by design.
 *
 * ## Unit reconciliation (recorded deviation from the plan doc)
 *
 * `Docs/plans/2026-07-23-economy-answers-the-god.md` states its thresholds on a normalized
 * 0–1 prosperity scale (0.7 / 0.3 / 0.15). The substrate stores `prosperity` on a **0–100**
 * scale (`phaseProsperity.ts`, `getProsperityTier`), so the constants below are the plan's
 * values carried onto the real scale. {@link ECON_SHOCK_DELTA} additionally had to be
 * *derived* rather than scaled: the plan's 0.15 becomes 15 points, which no single event
 * reaches — Blight moves −10, Bless the Harvest +12, Open the Markets +6. It is instead
 * pinned just above `PROSPERITY_DELTA_CLAMP` (2), the per-tick ceiling on ordinary drift, so
 * "shock" means exactly "a swing ordinary economics cannot produce".
 */

// ─── Scoring constants ───────────────────────────────────────────────────────

/** Global multiplier on the economic scoring term — the single dial for how loudly the economy speaks. */
export const ECON_SCORING_WEIGHT = 0.15;

/** Cap on the term's absolute contribution, so a destitute province cannot drown every other signal. */
export const ECON_SCORING_CAP = 0.5;

/** Prosperity (0–100) above which a settlement reads as booming. Sits between Prosperous (60) and Flourishing (80). */
export const ECON_BOOM_THRESHOLD = 70;

/** Prosperity (0–100) below which a settlement reads as busting. Sits between Struggling (20) and Modest (40). */
export const ECON_BUST_THRESHOLD = 30;

// ─── Shock-seeding constants ─────────────────────────────────────────────────

/**
 * Prosperity swing (0–100 points, absolute) that counts as a shock worth seeding stories from.
 * Above `PROSPERITY_DELTA_CLAMP` (2) by design — ordinary equilibrium drift can never trip it,
 * so only discrete events qualify. Catches Blight (−10), Bless the Harvest (+12),
 * Open the Markets (+6), and any future cause of comparable size.
 */
export const ECON_SHOCK_DELTA = 5;

/** Seeds planted per shock event. */
export const ECON_SHOCK_SEED_COUNT = 2;

/**
 * Ticks after planting by which a shock seed is expected to have matured — the observation
 * window for "did the world answer?", not an expiry.
 *
 * The plan doc specified this as a TTL. `PendingEncounterSeed` has no expiry field and
 * `evaluateEncounterSeeds` retains an unfired seed indefinitely, so a real TTL would mean
 * extending shared seed machinery every producer depends on. Rather than ship a knob that
 * controls nothing — the "written, never read" pathology the interface map exists to catch —
 * it is scoped here to what it can honestly govern: how long a caller should watch before
 * calling a shock unanswered.
 */
export const ECON_SHOCK_SEED_WINDOW = 24;

/** Boom/bust mood fragments authored per polarity (content volume target). */
export const ECON_FRAGMENT_COUNT = 6;

// ─── Types ───────────────────────────────────────────────────────────────────

/** How one template family responds to economic extremes. Both weights are signed. */
export interface EconomicSceneAffinity {
  /** Applied as prosperity rises above {@link ECON_BOOM_THRESHOLD}. */
  readonly boomWeight: number;
  /** Applied as prosperity falls below {@link ECON_BUST_THRESHOLD}. */
  readonly bustWeight: number;
}

// ─── The table ───────────────────────────────────────────────────────────────

/**
 * Family prefix → economic affinity. Unlisted families contribute nothing.
 *
 * Read it as a claim about the world: money moving draws merchants, festivals and guild
 * business; money drying up draws thieves, debt, desperation and the road out of town.
 */
export const ECONOMIC_SCENE_AFFINITY: Readonly<Record<string, EconomicSceneAffinity>> = {
  // ── Coin in motion makes its own occasions ──
  'encounter.market_day_festival': { boomWeight: 1.0, bustWeight: -0.8 },
  'encounter.festival_of_spheres': { boomWeight: 0.9, bustWeight: -0.8 },
  'encounter.market_haggle': { boomWeight: 0.9, bustWeight: -0.3 },
  'encounter.harvest_bounty': { boomWeight: 0.9, bustWeight: -0.9 },
  'encounter.foreign_trader': { boomWeight: 0.8, bustWeight: -0.4 },
  'encounter.merchants_gambit': { boomWeight: 0.8, bustWeight: -0.2 },
  'encounter.caravan_deal': { boomWeight: 0.8, bustWeight: -0.2 },
  'encounter.merchant_caravan': { boomWeight: 0.7, bustWeight: -0.3 },
  'encounter.master_craftsman_challenge': { boomWeight: 0.7, bustWeight: -0.4 },
  'encounter.mystic_trade': { boomWeight: 0.6, bustWeight: -0.1 },
  'encounter.guild_negotiation': { boomWeight: 0.6, bustWeight: 0.2 },
  'encounter.guild_initiation_trial': { boomWeight: 0.5, bustWeight: -0.3 },
  'encounter.grand_tournament': { boomWeight: 0.7, bustWeight: -0.7 },
  'encounter.library_expansion': { boomWeight: 0.6, bustWeight: -0.5 },
  'encounter.forge_construction': { boomWeight: 0.6, bustWeight: -0.4 },
  'encounter.harbor_construction': { boomWeight: 0.6, bustWeight: -0.4 },
  'encounter.bridge_engineering': { boomWeight: 0.5, bustWeight: -0.4 },
  'encounter.court_noble': { boomWeight: 0.5, bustWeight: -0.2 },
  'tavern.merchants_pitch': { boomWeight: 0.7, bustWeight: -0.2 },
  'tavern.drinking_contest': { boomWeight: 0.5, bustWeight: -0.4 },
  'tavern.bardic_performance': { boomWeight: 0.5, bustWeight: -0.3 },

  // ── Scarcity has its own economy ──
  'encounter.pickpocket': { boomWeight: 0.3, bustWeight: 1.0 },
  'encounter.debt_collection': { boomWeight: -0.3, bustWeight: 1.0 },
  'encounter.barter_survival': { boomWeight: -0.5, bustWeight: 1.0 },
  'encounter.labor_dispute': { boomWeight: -0.2, bustWeight: 0.9 },
  'encounter.aid_refugees': { boomWeight: -0.4, bustWeight: 0.9 },
  'encounter.black_market_deal': { boomWeight: 0.1, bustWeight: 0.8 },
  'encounter.grave_robbery': { boomWeight: -0.3, bustWeight: 0.8 },
  'encounter.bandit_ambush': { boomWeight: 0.1, bustWeight: 0.7 },
  'encounter.plague_outbreak': { boomWeight: -0.3, bustWeight: 0.6 },
  'encounter.barter_supplies': { boomWeight: -0.3, bustWeight: 0.7 },
  'encounter.forage_provisions': { boomWeight: -0.3, bustWeight: 0.6 },
  'encounter.militia_aid': { boomWeight: -0.1, bustWeight: 0.5 },
  'encounter.night_watch': { boomWeight: -0.1, bustWeight: 0.4 },
  'encounter.local_gossip': { boomWeight: 0.1, bustWeight: 0.3 },
  'tavern.shady_deal': { boomWeight: 0.2, bustWeight: 0.8 },
  'tavern.the_warning': { boomWeight: -0.1, bustWeight: 0.6 },
  'tavern.brawl': { boomWeight: 0.0, bustWeight: 0.5 },
  'social.rob': { boomWeight: 0.3, bustWeight: 0.9 },
  'social.intimidate': { boomWeight: 0.0, bustWeight: 0.5 },

  // ── Whole families whose character is economic on its own ──
  // The roadside economy of a poor province: shakedowns, tolls, deserters, scavengers.
  borderland: { boomWeight: -0.2, bustWeight: 0.5 },
};

/** Longest authored prefix wins, so `encounter.pickpocket` beats a bare `encounter` row. */
const AFFINITY_KEYS_BY_LENGTH: readonly string[] = Object.keys(ECONOMIC_SCENE_AFFINITY)
  .sort((a, b) => b.length - a.length);

/**
 * Look up the affinity for a template id by its longest authored id prefix.
 *
 * A key matches only at a segment boundary — `encounter.market_haggle` matches the id
 * itself and anything under it, but a key of `encounter.market` would *not* match
 * `encounter.market_haggle`. Without that guard a short key silently captures unrelated
 * siblings, which is the same phantom-match class word-boundary greps exist to prevent.
 *
 * Fail-soft: no `.` in the id, or no authored prefix → `undefined` (economically neutral).
 */
export function getEconomicSceneAffinity(templateId: string): EconomicSceneAffinity | undefined {
  if (templateId.indexOf('.') <= 0) return undefined;
  for (const key of AFFINITY_KEYS_BY_LENGTH) {
    if (templateId === key || templateId.startsWith(`${key}.`)) {
      return ECONOMIC_SCENE_AFFINITY[key];
    }
  }
  return undefined;
}

// ─── Shock seed pools ────────────────────────────────────────────────────────

/**
 * Templates a shock plants stories from — boom, the settlement suddenly has something worth
 * coming for; bust, something to fear.
 *
 * **Explicit template ids, not family stubs** — a second recorded divergence from the plan
 * doc, forced by the same measurement. `matchFamilyTemplate` resolves a family stub by
 * `startsWith(family + '.')`, so the only families available at that granularity are first
 * segments — and the one holding every economically-flavoured scene is `encounter`, all 171
 * of them. A family-stub seed would therefore have drawn `encounter.offer_small_prayer` as
 * readily as `encounter.pickpocket`: seeds would fire, traces would look healthy, and the
 * scenes would have nothing to do with the economy. Naming the templates is what makes the
 * response actually thematic.
 *
 * Every id is settlement-appropriate and individual-performable, asserted by
 * `economicSceneAffinity.contract.test.ts` against the live registry.
 */
export const ECON_BOOM_SEED_TEMPLATES: readonly string[] = [
  'encounter.market_day_festival',
  'encounter.market_haggle',
  'encounter.foreign_trader',
  'encounter.merchants_gambit',
  'encounter.guild_negotiation',
  'encounter.master_craftsman_challenge',
];

export const ECON_BUST_SEED_TEMPLATES: readonly string[] = [
  'encounter.pickpocket',
  'encounter.debt_collection',
  'encounter.black_market_deal',
  'encounter.labor_dispute',
  'encounter.aid_refugees',
  'encounter.plague_outbreak',
];

// ─── Mood vocabulary (coloration, not identity) ──────────────────────────────

/**
 * Boom/bust vocabulary spliced into authored prose through `{econ_adj}`, `{econ_noun}` and
 * `{econ_atmosphere}`.
 *
 * These are **coloration**, not identity axes: they vary how a scene reads without making it
 * a different surface, so they deliberately do *not* enter `computeSurfaceKey` (the
 * `SURFACE_FRAGMENT_AXES` path is for axes that create distinct surfaces — see
 * `fragmentResolution.ts`). Selection is a deterministic index, never a PRNG draw: the same
 * settlement on the same tick always reads the same way (NFP #3).
 *
 * {@link ECON_FRAGMENT_COUNT} entries per slot per polarity.
 */
export interface EconomicMoodVocabulary {
  readonly adjectives: readonly string[];
  readonly nouns: readonly string[];
  readonly atmospheres: readonly string[];
}

export const ECONOMIC_MOOD_VOCABULARY: Readonly<Record<'boom' | 'bust', EconomicMoodVocabulary>> = {
  boom: {
    adjectives: ['grain-heavy', 'overspilling', 'well-fed', 'coin-bright', 'unhurried', 'thick-stocked'],
    nouns: [
      'wagons queued past the gate',
      'granaries too full to close',
      'a market that runs past dusk',
      'coin changing hands twice over',
      'stalls set out where there were none',
      'strangers arriving with money',
    ],
    atmospheres: [
      'the air carries bread and axle-grease, and nobody is counting carefully',
      'there is more here than the town knows what to do with, and it shows in how people walk',
      'the streets have the loose good humour of a place that ate well last night',
      'traders who never came this way before are asking about lodgings',
      'somebody is always laughing somewhere down the row of stalls',
      'the good year sits on the place like a coat that fits',
    ],
  },
  bust: {
    adjectives: ['shuttered', 'thin', 'picked-over', 'hollow-stomached', 'watchful', 'debt-shadowed'],
    nouns: [
      'shuttered stalls',
      'a granary with an echo in it',
      'queues that move too slowly',
      'debts spoken of by name',
      'roads busy in one direction only',
      'what the market has left by afternoon',
    ],
    atmospheres: [
      'the market thins out early, and the sellers do not seem sorry',
      'people watch each other\'s hands here now, and nobody has said why',
      'there is a quiet to the place that is not peace',
      'the well-fed are conspicuous, and know it',
      'somebody has begun keeping a list of who owes what',
      'the bad year sits on the place like a debt not yet called in',
    ],
  },
};
