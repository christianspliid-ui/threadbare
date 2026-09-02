// src/data/strategic-action-constants.ts
//
// All tunable weights, caps, cooldowns, cadence, and catalyst constants
// for the ambition-driven strategic action system.
//
// NFP #1 (Tunability): Every magic number is a named constant.

// ─── Feature Gate ───────────────────────────────────────────────────

/** Rollout gate for safe A/B verification against encounter-only behavior */
export const ENABLE_STRATEGIC_ACTIONS = true;

// ─── Candidate Generation Caps ──────────────────────────────────────

/** Hard cap on proactive candidates generated per actor per tick */
export const STRATEGIC_MAX_CANDIDATES_PER_ACTOR = 12;

/** Prevent a single ambition from flooding the board */
export const STRATEGIC_MAX_CANDIDATES_PER_AMBITION = 5;

// ─── Scoring Weights ────────────────────────────────────────────────
// These sum > 1.0 intentionally — they are relative weights, not a partition.

/** Reward actions that materially reshape graph state */
export const STRATEGIC_WORLD_IMPACT_WEIGHT = 0.24;

/** Reward steps that unblock ambition progress */
export const STRATEGIC_BLOCKER_RELIEF_WEIGHT = 0.22;

/** Reward actions likely to seed follow-up encounters */
export const STRATEGIC_CATALYST_VALUE_WEIGHT = 0.16;

/** Reward actions that fit the actor's archetype and domain profile */
export const STRATEGIC_ROLE_FIT_WEIGHT = 0.12;

/** Penalize proactive steps that demand unattractive travel */
export const STRATEGIC_TRAVEL_PENALTY_WEIGHT = 0.14;

/** Penalize same-template spam in recent history and candidate boards */
export const STRATEGIC_VARIETY_PENALTY_WEIGHT = 0.18;

/** Elevate upkeep/contest actions when the actor risks losing control */
export const STRATEGIC_CONTROL_PRESSURE_WEIGHT = 0.20;

// ─── Project and Control Cadence ────────────────────────────────────

/**
 * Default work an undertaking requires when its template authors no
 * `projectDuration` — i.e. the default `progressRequired`.
 *
 * Named for what it is since THR-1292: it was called
 * `STRATEGIC_DEFAULT_PROJECT_TIMEOUT_TICKS` while doing double duty as both the
 * work total and the abandonment timeout, and slice 3 split those. The timeout is
 * now `UNDERTAKING_TIMEOUT_TICKS`; this is work. The value is unchanged, and the
 * checkpoint cadence is pinned to it —
 * `UNDERTAKING_PROGRESS_PER_ADVANCE` × 3 checkpoints = 18.
 */
export const STRATEGIC_DEFAULT_PROJECT_WORK_TICKS = 18;

/** Window kept for player/debug strategic history summaries */
export const STRATEGIC_HISTORY_WINDOW_TICKS = 120;

/** Default chance for eligible completions to emit a follow-up encounter seed */
export const STRATEGIC_CATALYST_SEED_CHANCE = 0.65;

/** Ticks a planted catalyst seed waits before it may spawn (narrative pacing) */
export const STRATEGIC_CATALYST_SEED_DELAY_TICKS = 3;

/** Priority carried by catalyst seeds (1.0 = neutral) — a follow-up, not an interrupt */
export const STRATEGIC_CATALYST_SEED_PRIORITY = 0.6;

/** Ticks before unattended control states begin degrading */
export const STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS = 10;

/** Degradation rate per tick after grace period expires (0-1 scale) */
export const STRATEGIC_CONTROL_DEGRADATION_RATE = 0.05;

/**
 * Ticks an actor must wait before re-claiming a target whose control stance they
 * themselves let degrade to collapse (THR-1286).
 *
 * Without this, a collapsed stance was re-proposed every tick forever: the dead record
 * pinned `controlPressure` at its maximum, `claim_control` wrote no history so the
 * variety guard never saw it, and the stale `controls` edge made every re-claim fail
 * `already_controls` — a decision spent on a guaranteed no-op. Measured on seed 42 at
 * 150 ticks: 811 of 2053 spotlight decisions (39.5%) were `strategic_control`, and they
 * produced 17 successful claims.
 *
 * Sized against the neglect cycle it gates: grace (10) plus 1/`DEGRADATION_RATE` (20)
 * ticks is one full claim-to-collapse arc, so the cooldown makes losing a stance cost
 * roughly as long as holding it earned. Must stay below `STRATEGIC_HISTORY_WINDOW_TICKS`
 * — the collapse record the cooldown reads lives in that window and is pruned with it.
 */
export const STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS = 30;

// ─── Normalization ──────────────────────────────────────────────────

/** Score floor — strategic candidates below this are rejected */
export const STRATEGIC_SCORE_FLOOR = 0.08;

/**
 * Normalization multiplier bringing strategic scores into encounter score range.
 *
 * This is the entire commensurability story between two incommensurate scorers:
 * it clamps the strategic score into `[0.08, 0.851]` so contest B can compare it
 * against an encounter score that is unbounded above. The board (§4) replaces
 * that comparison with one currency, and this constant is deleted in the same
 * commit that sets `UNIFIED_DECISION_BOARD_MODE` to `'live'` — not before, since
 * contest B is what still selects undertakings under `'shadow'`.
 */
export const STRATEGIC_ENCOUNTER_SCORE_BRIDGE = 0.85;

// ─── Sacred routes (THR-1184) ───────────────────────────────────────

/**
 * Encounter templates a consecrated pilgrimage route unlocks at its destination.
 *
 * `strategic_establish_sacred_route` targets `['shrine', 'temple', 'town', 'city']`, but
 * every pilgrimage encounter is gated `['shrine', 'temple']` — so the two settlement
 * targets consecrated a route to a place that could never host the pilgrimage its own
 * completion prose promises ("Pilgrims will follow where the faithful walked first").
 * A location carrying an incoming `sacred_route` edge pools these regardless of subtype:
 * the eight ticks and 30 wealth buy the destination the encounter, which is the whole
 * fiction of the verb.
 *
 * Tunable (NFP #1): widening a route's payoff is editing this list, not the cache.
 * Ids are resolved through `getAnyEncounterById` and silently skipped when unknown,
 * so a retired template degrades to "no supplement" rather than breaking the pool.
 */
export const SACRED_ROUTE_DESTINATION_ENCOUNTER_IDS: readonly string[] = [
  'encounter.pilgrimage_trial',
];

/**
 * Edge types whose creation changes what encounters a location can host.
 *
 * Minting one of these must refresh the destination's encounter-cache entries, or the
 * new pool is invisible until some unrelated system happens to invalidate the cache.
 * Measured on seed 42 / medium at tick 120 before this wiring existed: four
 * `sacred_route` edges, of which exactly **one** destination had its pilgrimage pooled —
 * the other three sat inert behind a cache built before their route was minted, which is
 * the same "changes nothing" defect THR-1184 set out to fix, only harder to see.
 */
export const ENCOUNTER_POOL_INVALIDATING_EDGE_TYPES: ReadonlySet<string> = new Set([
  'sacred_route',
]);

// ─── Undertaking Checkpoints (THR-1292 §2) ──────────────────────────
//
// Checkpoint dice replace passive per-tick progress: an undertaking advances
// because a roll said so, not because a tick elapsed. Every number below is the
// plan's first-guess calibration — retune against the §2 Done-when (non-zero
// halts on both seeds) and record the values used.

/** Ticks between checkpoint dice on an active undertaking */
export const UNDERTAKING_CHECKPOINT_INTERVAL_TICKS = 6;

/**
 * Progress granted per advancing checkpoint.
 *
 * Chosen for parity with the pre-checkpoint world: the default project runs 18
 * ticks at 1 progress/tick, so an always-succeeding agent still finishes in three
 * checkpoints. What changes is variance, not expected duration.
 */
export const UNDERTAKING_PROGRESS_PER_ADVANCE = 6;

/** Difficulty used when a template authors no `checkpointDifficulty` (doc 2 owns per-kind values) */
export const UNDERTAKING_DEFAULT_CHECKPOINT_DIFFICULTY = 0.45;

/** Critical success advances this many times the ordinary step (capped at completion) */
export const UNDERTAKING_CRIT_ADVANCE_MULTIPLIER = 2;

/** Accumulated halts that force the abandon-or-escalate fork */
export const UNDERTAKING_HALT_RATCHET_N = 3;

/** Ratchet points a critical failure adds (an ordinary halt adds 1) */
export const UNDERTAKING_CRIT_FAIL_RATCHET_WEIGHT = 2;

/** Fork weight baseline — the disposition to press on before anything is known about the agent */
export const UNDERTAKING_ESCALATE_BASE = 0.35;

/** Fork weight added while the driving `pursues` ambition edge is still live */
export const UNDERTAKING_ESCALATE_AMBITION_TERM = 0.25;

/** How hard the courage axis pushes the fork (applied to `courage01 − 0.5`) */
export const UNDERTAKING_ESCALATE_COURAGE_WEIGHT = 0.4;

/** Push toward abandon per halt accumulated beyond the ratchet threshold */
export const UNDERTAKING_ESCALATE_HALT_PRESSURE = 0.1;

/** Escalate at or above this weight; abandon below it */
export const UNDERTAKING_ESCALATE_THRESHOLD = 0.5;

/** Stakes raised on escalation — added to the undertaking's checkpoint difficulty */
export const UNDERTAKING_ESCALATE_DIFFICULTY_DELTA = 0.1;

/**
 * Fail-safe backstop replacing the flat 18-tick timeout.
 *
 * Halts now legitimately extend an undertaking's duration and the ratchet is the
 * *designed* exit, so a timeout tuned to the old passive cadence would fire on
 * healthy work. This one only catches undertakings the ratchet somehow never
 * reaches (an actor frozen absent, a deferral loop) — NFP #4, not game feel.
 */
export const UNDERTAKING_TIMEOUT_TICKS = 60;

/**
 * PRNG stream multiplier for checkpoint dice (NFP #3).
 *
 * Deliberately not 59 or 53: `seed + tick*59` already feeds three phases as
 * nominally-independent generators and 53 feeds two, so those streams are
 * correlated. That defect is pre-existing and not widened here.
 */
export const UNDERTAKING_CHECKPOINT_STREAM_MULTIPLIER = 97;

/** Consecutive absence deferrals that convert to one halt — neglect with teeth, no new movement AI */
export const UNDERTAKING_ABSENCE_DEFERRAL_LIMIT = 3;

/**
 * Default for `requiresLocation` when a template authors none.
 *
 * **The plan (§5) names `true` here; this is `false`, and the reversal is
 * measured.** The plan's stated reason for the conversion default is to *preserve
 * today's parallel behaviour* — and today an undertaking advances wherever its
 * owner happens to be standing, because nothing moves an agent toward its stage.
 * Moving them is explicitly docs 3/5 territory (binder and board), so with `true`
 * the gate has nothing to wait for.
 *
 * Measured on a 150-tick medium run before the flip: of 736 checkpoints on seed 42
 * only **50 rolled** — 686 deferred `actor_absent`; on seed 99, 15 of 668. A probe
 * at tick 80 found **0 of 45** active undertakings with their owner at the stage.
 * That is not the variance §2 designs for ("today's expected duration, now with
 * variance"); it is a system whose dice are 93–97% inert, whose undertakings die
 * of absence rather than of failure, and whose band table would ship untested in
 * the world.
 *
 * The gate itself is fully implemented and tested — only its *default* is off.
 * Doc 2 turns it on per-kind once doc 3's binder can bring an actor to a stage —
 * TODO(THR-1294), which carries the census above as its acceptance evidence.
 */
export const UNDERTAKING_DEFAULT_REQUIRES_LOCATION = false;

/** Default for `canRunBeside` when a template authors none (preserves pre-flag behavior) */
export const UNDERTAKING_DEFAULT_CAN_RUN_BESIDE = true;

// ─── Expiring location boosts (THR-1292 §3, initiative retirement) ──
//
// The retired `phaseInitiativeProgress` owned the *only* expiry for the festival
// boost. The folded festival undertaking still writes that boost, so the sweep
// rehomes into `phaseStrategicProjects` — and it is driven by this list rather
// than by a hardcoded property name, so a second expiring boost is a data edit.
//
// Each entry names a location property written with an `expiresAfterTicks`
// mutation hint. The writer stamps `<property>ExpiresAtTick`; the sweep clears
// both once the tick arrives.

/** Location properties that carry a timed expiry, swept by `phaseStrategicProjects`. */
export const EXPIRING_LOCATION_PROPERTIES: readonly string[] = ['festivalBoost'];

/** Suffix of the companion property holding the expiry tick. */
export const LOCATION_BOOST_EXPIRY_SUFFIX = 'ExpiresAtTick';

/** How long the folded festival undertaking's boost lasts (was INITIATIVE festival duration 10). */
export const FESTIVAL_BOOST_DURATION_TICKS = 10;

/** Magnitude of the folded festival undertaking's boost (was the initiative outcome's 0.5). */
export const FESTIVAL_BOOST_DELTA = 0.5;

// ─── Divine riders on undertakings (THR-1292 §3) ────────────────────
//
// The retired `action.initiative.inspire` / `.sabotage` wrote a scorer bonus and a
// force-fail coin flip. Retargeted onto undertakings they write a **one-shot**
// modifier consumed by the next checkpoint, so a god's nudge tilts one roll rather
// than deciding the outcome outright.

/** Modifier added to the next checkpoint roll by `action.undertaking.inspire`. */
export const UNDERTAKING_INSPIRE_MODIFIER = 0.15;

/** Modifier subtracted from the next checkpoint roll by `action.undertaking.sabotage`. */
export const UNDERTAKING_SABOTAGE_MODIFIER = 0.15;

/** Actor property carrying a pending inspire rider. */
export const UNDERTAKING_INSPIRE_FLAG = 'undertakingInspireBonus';

/** Actor property carrying a pending sabotage rider. */
export const UNDERTAKING_SABOTAGE_FLAG = 'undertakingSabotaged';

// ─── Moment surfaces (THR-1299 slice 2) ─────────────────────────────
//
// A moment is what a checkpoint *says* to the player — the setback, the
// doubling-down, the abandonment, the finish. Every moment lands as a TickEvent
// and as a record in `state.pendingUndertakingMoments`; these constants decide
// how loud each one is and how many the queue keeps.

/**
 * FIFO cap on `pendingUndertakingMoments`. Overflow drops the oldest record with a
 * `moment_surface{dropped}` trace — the `playerReceipts` idiom — so a headless run
 * where nothing acknowledges never grows unbounded.
 */
export const MOMENT_QUEUE_MAX = 8;

/**
 * TickEvent significance for an interrupt-tier moment. Sits above `phaseNarrative`'s
 * 0.8 chronicle threshold on purpose: a moment loud enough to interrupt the player
 * is a chronicle line by definition, and this is the one constant that makes it so —
 * no orchestrator threshold is touched.
 */
export const MOMENT_INTERRUPT_SIGNIFICANCE = 0.85;

/** Significance of a badge-tier setback (complication, abandonment) — chronicle-silent. */
export const MOMENT_SETBACK_SIGNIFICANCE = 0.55;

/** Significance of any other badge-tier moment (at-cost, fork, founding). */
export const MOMENT_BADGE_SIGNIFICANCE = 0.4;

/**
 * Significance of a badge-tier completion — the one moment class whose TickEvent
 * the lifecycle emits (it alone knows the christened name), not the checkpoint.
 * Was the literal `0.6` on that event before slice 2 named it.
 */
export const MOMENT_COMPLETION_SIGNIFICANCE = 0.6;

/**
 * How long an unacknowledged moment stays countable on a thread row's badge
 * (THR-1299 slice 4). Four days: long enough that a player who stepped away
 * finds the news, short enough that the badge is about what is happening now
 * rather than a ledger — the arc panel is the ledger.
 */
export const MOMENT_BADGE_RETENTION_TICKS = 48;

/** Most entries on the JourneyTab's arc-so-far strip (THR-1299 slice 4). */
export const MOMENT_ARC_STRIP_MAX = 12;

// ─── The calling (THR-1299 slice 5, THR-1281 §7b) ───────────────────
//
// A mortal's readable identity, derived — never stored as a stat — from their
// leading reach pair, their active ambition and their personality lean, scored
// against the naming table in `src/data/calling-content.ts`. Recompute is
// event-driven at three sites (ambition change, undertaking completion, tier
// promotion), never per tick, and a challenger replaces the incumbent only past
// both hysteresis gates below. Retune the feel here, not in the scorer.

/** Ambition term weight — the volatile input leads (review M1: deeds move it). */
export const CALLING_AMBITION_WEIGHT = 0.5;

/** Leading reach-pair term weight. */
export const CALLING_REACH_WEIGHT = 0.35;

/** Personality-lean term weight. */
export const CALLING_PERSONALITY_WEIGHT = 0.15;

/** Hysteresis floor — a calling holds at least this long before any challenger wins. */
export const CALLING_MIN_HOLD_TICKS = 36;

/** A challenger must beat the incumbent's *current* score by this margin. */
export const CALLING_SCORE_MARGIN = 0.15;

/**
 * TickEvent significance for a spotlight mortal's calling change — clears the
 * chronicle threshold, because a calling change IS a chronicle moment (ruling).
 * Set to 0 to apply the plan's kill criterion (static title, no chronicle claim).
 */
export const CALLING_CHANGE_SIGNIFICANCE = 0.85;

/** Title when no naming-table row matches the profile. */
export const CALLING_FALLBACK_TITLE = 'Wanderer';

// ─── The one prioritization board (THR-1292 §4) ─────────────────────
//
// An agent's decision *was* three sequential winner-take contests between
// scorers incommensurate by construction: the encounter score unbounded above,
// the strategic score clamped into [0.08, 0.851] by a single bridge constant.
// One clamp and one constant were the entire commensurability story, and the
// comparison itself was never traced.
//
// The board replaces that with a single ranking in one currency — **expected
// value per tick (EVT)** — which the encounter scorer already computes as
// `euRanking / totalCost`. Undertakings join *that* currency rather than
// inventing a third.
//
// It ships in `'shadow'`: the board scores every decision alongside the legacy
// contests and legacy still decides. Nothing below changes behaviour until the
// mode flips, and the flip is gated on measurement (see the cutover table).

/** How the board participates: scored not at all, scored-but-ignored, or deciding. */
export type UnifiedDecisionBoardMode = 'off' | 'shadow' | 'live';

/**
 * Board participation mode. Still `'shadow'` — the live branch is implemented
 * (`phaseAgentDecision.ts`) and inert, and the flip is one line plus deleting
 * contest B and `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` in the same commit.
 *
 * It ships `'shadow'` by the plan's binding obligation: a redesign of how agents
 * choose that swaps in unmeasured is how a decision mix silently collapses. The
 * shadow period records the board's ranking on two channels (the
 * `decision_board_comparison` trace and the balance-telemetry shadow fields) so
 * the cutover gate below is *evaluated from a log rather than asserted*.
 *
 * **The gate has now been run three times, and the third run is why this is still
 * `'shadow'`.** THR-1292 slice 6 measured it and it failed on seed 99 (4.1%
 * undertaking share against a `[0.10, 0.35]` floor); the flip did not land, and
 * that ticket closed on the gate-fail evidence rather than on a bridge constant
 * picked to make the number pass. THR-1297 slice 5 and THR-1302 unpinned the two
 * inputs behind that failure, and THR-1301 re-ran it green on both seeds —
 * seed 42 undertaking 33.4% / encounter 33.8% / idle 32.8%, seed 99 21.1% /
 * 43.6% / 35.3%.
 *
 * Green, and still not enough. THR-1301 also measured what the gate does *not*
 * read: composition **within** a family. Under a live board, `trades_with` edges
 * written over 150 ticks on seed 42 fall from non-zero to **zero** —
 * `strategic_establish_trade_route` takes zero board wins and is never generated
 * — because board score is `EVT × desire × temperament` and carries no variety
 * term, while the legacy scorer's `STRATEGIC_VARIETY_PENALTY_WEIGHT` fed contest
 * B directly. Three of the repo's world-simulation tests fail on that, and every
 * §4 criterion reads green through it. The flip waits for a diversity term in the
 * board's currency, which is its own slice with its own balance envelope.
 */
export const UNIFIED_DECISION_BOARD_MODE: UnifiedDecisionBoardMode = 'shadow';

/**
 * Live-mode idle threshold: a board whose best entry scores below this is empty.
 *
 * **This is an epsilon, not a tuning knob, and the difference is the whole note.**
 * Board score is expected value per tick. An option with *any* positive EVT is by
 * that currency's own definition worth more than standing still, so the honest
 * threshold is zero and this constant is only the float-noise guard around it.
 * Raising it would not be "tuning idleness" — it would be asserting that some
 * positive-value options are worth less than nothing, which the currency cannot
 * express.
 *
 * It shipped as `0.08`, "deliberately equal to `STRATEGIC_SCORE_FLOOR`", and that
 * was a **units error** — the same class the plan itself rejected when it refused
 * an 8× bridge scale as "not a units conversion". `STRATEGIC_SCORE_FLOOR` gates a
 * weighted score normalised to `[0, 1]`; board score is `EVT × desire ×
 * temperament`, whose median winner on seed 42 / 150 ticks is **0.0006**. The two
 * numbers were never in the same currency, so copying one across was arithmetic on
 * unlike units, and 0.08 landed at roughly the 92nd percentile of the quantity it
 * was gating.
 *
 * Measured at cutover (THR-1301), seed 42, 150 ticks, medium — idle share of all
 * decisions, against a legacy baseline of **28.7%**:
 *
 * | floor | idle | undertakings started | checkpoints |
 * |---|---|---|---|
 * | `0.08`  | **91.8%** | 30  | 73  |
 * | `0.001` | 64.2%     | 503 | 619 |
 * | `1e-6`  | **30.3%** | 586 | 618 |
 *
 * The 0.08 row is what a green census looked like while 92% of the world stood
 * still — see the `boardFamily` note in `phaseAgentDecision.ts` for why the gate
 * could not see it.
 */
export const BOARD_SCORE_FLOOR = 1e-6;

/**
 * Verb → payoff value, the v1 bridge until doc 2's per-kind rows land.
 *
 * This is the **same table** the legacy `worldImpact` score component reads
 * (`strategicActionCandidates.computeWorldImpact`), deliberately shared rather
 * than copied: a second copy would drift, and the board and the scorer it is
 * being measured against would then disagree about the same verb for a reason
 * nobody could see in either file.
 */
export const STRATEGIC_VERB_IMPACT: Readonly<Record<string, number>> = {
  create: 0.8,
  destroy: 0.7,
  change: 0.5,
  control: 0.6,
  gather_info: 0.3,
};

/** Payoff for a verb with no row above — the legacy table's `default`. */
export const STRATEGIC_VERB_IMPACT_DEFAULT = 0.3;

/** Verb-impact → `payoffValue` bridge scale. Doc 2's kind rows refine per kind. */
export const UNDERTAKING_PAYOFF_SCALE = 1.0;

/**
 * Board variety: how much of an undertaking's board score a fully-repeated
 * template gives up (THR-1349).
 *
 * The board's score is `EVT × desire × temperament` and carried no variety term
 * at all, while the legacy contest-B scorer subtracted
 * `STRATEGIC_VARIETY_PENALTY_WEIGHT × varietyPenalty` from a `[0, 1]` normalised
 * score. Plan §4 asserted that penalty would "survive as a candidate-generation
 * feature feeding EVT inputs"; it does not — `varietyPenalty` lands in
 * `ScoredStrategicCandidate.finalScore`, which the board never reads.
 *
 * **It enters multiplicatively, not by subtraction, and that is not a stylistic
 * choice.** `varietyPenalty` is a `[0, 1]` quantity and board score is an
 * EVT-scaled one whose median strategic entry is `1.9e-3`; subtracting `0.18 ×
 * penalty` from that would not discount a repeat, it would annihilate every
 * undertaking on the board. Copying a constant across two currencies is precisely
 * the units error `BOARD_SCORE_FLOOR` shipped and this file has now documented
 * twice, so the term is expressed as the *fraction of its score* a maximally
 * repeated candidate forfeits.
 *
 * At `0.18` a candidate at full penalty keeps 82% of its score — deliberately the
 * same magnitude the legacy scorer applied, so the cutover moves the mechanism
 * rather than also retuning it.
 */
export const BOARD_VARIETY_PENALTY_WEIGHT = 0.18;

/**
 * Desire multiplier for a candidate whose template authors **no** motivations.
 *
 * `1.0` because it is the identity of a multiplier: a template that states no
 * axiological opinion should neither be preferred nor punished, it should simply
 * not move on this term. Any other value would be an opinion the content declined
 * to express, invented here.
 *
 * The alternative this replaced was not a choice anyone made — it was
 * `computeDesireScore([]) === 0` falling through the shared floor to `0.0112`,
 * which reads an unauthored set as active revulsion. See the note on
 * `computeBoardDesireMultiplier` for why that is inert for encounters and
 * ruinous for undertakings, where 35 of 64 templates were silent.
 *
 * THR-1377 authored those 35, so no *shipped* template reaches this value any
 * more (pinned by `undertaking-motivations.test.ts`). It is kept rather than
 * deleted because `motivations` remains optional on `StrategicActionTemplate` —
 * see the retention note on `computeBoardDesireMultiplier`. Treat a trace showing
 * this value as a signal that something authored a silent template, not as
 * routine.
 *
 * @range 0.5–1.5 (below 1 taxes silence, above 1 rewards it; neither is intended)
 */
export const UNDERTAKING_NEUTRAL_DESIRE = 1.0;

/** Board mix: weight of "the agent's active ambition names this kind/verb". */
export const UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT = 0.3;

/** Board mix: weight of the agent's reach affinity for the undertaking's reach. */
export const UNDERTAKING_TEMPERAMENT_REACH_WEIGHT = 0.2;

/**
 * Board desire: the **ceiling** of the undertaking ambition boost (THR-1302).
 *
 * Deliberately equal to the encounter path's `AMBITION_REACH_BOOST`, and
 * deliberately a separate constant. Same number, different meaning: on the
 * encounter path 0.5 is the flat boost paid whenever *any* pursued ambition
 * cares about the candidate's reach; here it is the *most* an undertaking can be
 * paid, earned only by one sitting on its own ambition's most-preferred reach.
 *
 * Separate rather than shared because the two are now different shapes, and
 * `getAmbitionBoostForEntry` is on the encounter ranking path — turning one knob
 * must not move the other. Retuning the board's undertaking pull relative to
 * encounters is what this constant is for (NFP #1).
 */
export const UNDERTAKING_AMBITION_CENTRALITY_BOOST = 0.5;

// ─── Cutover gate (measured, never asserted) ────────────────────────
//
// The THR-1277 method: headless CLI, seeds 42 **and** 99, ≥150 ticks, decision mix
// read from cumulative balance telemetry. The mode flips to `'live'` only when the
// shadow board's own rankings satisfy every row below on *both* seeds.
//
// Agreement with legacy is deliberately **not** a criterion. The board is a
// redesign; divergence is the point. What gates is distributional health — that
// the world the board would produce still has mortals doing a mix of things.

/** Undertaking share of spotlight decisions must land inside this range. */
export const BOARD_UNDERTAKING_SHARE_RANGE: readonly [number, number] = [0.10, 0.35];

/** Encounter share of spotlight decisions must stay at or above this floor. */
export const BOARD_ENCOUNTER_SHARE_FLOOR = 0.15;

/** Idle share of spotlight decisions must stay at or below this ceiling. */
export const BOARD_IDLE_SHARE_CEILING = 0.40;

/**
 * Undertaking **throughput** floor, stated per spotlight mortal: starts per
 * autonomous mortal per 100 ticks (THR-1349, fourth pass — the design session).
 *
 * ## What the number it replaces was made of
 *
 * This file previously carried `CENSUS_UNDERTAKING_START_FLOOR = 700`, an absolute
 * count sized against the shipped `'shadow'` arm's 892 / 891 starts. The design
 * session read the `legacyWinner` column of `decision_board_comparison` — what
 * contest B actually *did*, which the census in `'shadow'` never reported because it
 * reads the board's preference — and found those starts were contest B choosing an
 * undertaking on **42–46% of spotlight decisions** (outside the
 * `BOARD_UNDERTAKING_SHARE_RANGE` envelope above) and letting one mortal carry
 * **eight to eleven concurrent undertakings**, because nothing but
 * `project_already_active` gates a start. The floor protected a stacking artefact.
 *
 * ## Why per mortal, and why 4
 *
 * An absolute floor is a statement about population size as much as behaviour. A
 * per-mortal rate is a statement about a life: a spotlight mortal begins a new
 * undertaking about every two days (12 ticks a day; the calling's own hold is 36
 * ticks), which is one every ~25 ticks, or 4 per 100. Measured, 150 ticks, medium:
 *
 * | arm | seed 42 | seed 99 |
 * | -- | -- | -- |
 * | `'shadow'` (contest B) | 21.9 | 22.0 |
 * | `'live'` (the board) | 8.1 | 10.0 |
 *
 * The floor sits at roughly half the board's rate and a fifth of the artefact's —
 * headroom in the direction the gate guards, derived from the design rather than
 * from either arm. The census divides starts by the mean count of
 * `isAutonomousDecisionActor` mortals it sampled per tick, so the gate reads the
 * same population the decision loop runs.
 */
export const CENSUS_STARTS_PER_MORTAL_PER_100_TICKS_FLOOR = 4;

/**
 * The fixed start sample **variety** is measured at (THR-1349, fourth pass).
 *
 * The previous variety gate, `CENSUS_DISTINCT_TEMPLATE_FLOOR = 30`, counted distinct
 * templates over a whole run, and its own note conceded that distinct count tracks
 * sample size — 39 over 495 starts passed as readily as 48 over 891. Measured at a
 * *fixed* sample the two arms separate for the right reason: in the first 300 starts,
 * contest B reaches 45 / 45 distinct templates on seeds 42 / 99, the board at the
 * shipped `BOARD_VARIETY_PENALTY_WEIGHT` of 0.18 reaches only 27 / 32 — a real loss,
 * and the one the cutover has to answer. 300 is large enough that both arms have
 * cycled every active ambition's template list at least once and small enough that
 * the board's 331-start seed-42 run fills it.
 */
export const CENSUS_VARIETY_SAMPLE_STARTS = 300;

/**
 * Distinct undertaking templates among the first `CENSUS_VARIETY_SAMPLE_STARTS`
 * starts (THR-1349, fourth pass).
 *
 * Sized so that the shipped arm (45 / 45) and the board at the retuned weight
 * (36 / 36 at `BOARD_VARIETY_PENALTY_WEIGHT = 0.5`, sweep in that constant's note)
 * both pass with margin, and the board at the *uncalibrated* weight (27 / 32) fails
 * on seed 42 — a gate that can tell the calibrated board from the uncalibrated one
 * is the falsification this number needs. It is deliberately not placed to admit
 * the 0.18 arm: the variety loss at that weight was measured, and a gate that hides
 * a measured loss is the vacuity this file has shipped twice (see `BOARD_SCORE_FLOOR`).
 *
 * The trade-route count that motivated the ticket stays *reported*, never gated: the
 * healthy baseline is 1 and 0 on the two seeds, and THR-1348 owns the route economy.
 */
export const CENSUS_DISTINCT_AT_SAMPLE_FLOOR = 30;

/** Control-deletion gate (§6): undertaking share must have *grown* past this floor. */
export const DECISION_MIX_FLOOR_UNDERTAKING_SHARE = 0.12;

/** Control-deletion gate (§6): the deletion must not convert control churn into idleness. */
export const DECISION_MIX_IDLE_CEILING = 0.40;

/** How many board entries the comparison trace carries. */
export const BOARD_TRACE_TOP_N = 5;

// ─── Motive Gate (THR-1297 §2) ──────────────────────────────────────

/**
 * The destroy motive vocabulary — the complete set a template may name.
 *
 * Exported as data (not only as a type) because the registry's schema gate checks
 * membership at test time, and a type cannot be iterated. Adding a fifth motive is
 * a two-line edit here plus a reader in `undertakingMotive.ts`; the gate then holds
 * the new member to the same standard as the four without further edits.
 */
export const MOTIVE_GATE_KINDS = [
  'rivalry',
  'grudge',
  'contested_ambition',
  'faction_war',
] as const;

/**
 * How many rejection reasons the candidate-board trace carries.
 *
 * The board trace has always reported `candidatesRejected` as a bare count, which
 * makes every refusal reason — including the motive gate's, whose fail-soft row says
 * "never a silent skip" — invisible from outside. The list is capped for the same
 * reason `BindingDecisionTrace.rows` is: the count stays exact, the detail is bounded.
 */
export const STRATEGIC_BOARD_TRACE_REFUSAL_CAP = 8;

// ─── Target selection reach (THR-1310) ──────────────────────────────
//
// `findValidTargets` resolves a scanning target rule — `location_subtype` and its
// three siblings — by walking the whole graph, filtering, and keeping the first N in
// **insertion order**. Insertion order is worldgen order, which is identical for every
// agent, so every agent pursuing the same ambition proposed the same distant site and
// the near ones were sliced away before scoring ever saw them.
//
// Measured at THR-1297 slice 5, seed 42 / medium / 150 ticks: with the wilderness chart
// verbs gated on presence (`requiresLocation: true`) the `chart_find` kind produced
// **nothing at all** — 0 completed, 0 treasure maps, 0 clues — because the site an agent
// was sent to was never the site it stood near. Slice 5 shipped `requiresLocation: false`
// to buy liveness, which removed the stage requirement rather than making the stage
// reachable.
//
// **The fix is ordering, not a second penalty.** The cap is applied to a set sorted by
// hex distance from the acting agent, so what survives is the nearest N rather than the
// oldest N. `travelPenalty` (see `STRATEGIC_TRAVEL_PENALTY_WEIGHT`) still does all the
// *scoring* of distance and is deliberately not duplicated here — a hard exclusion
// radius would have been a second, uncalibrated distance term, and on a sparse map it
// could empty a target set that the scan had legitimately filled.
//
// The caps below preserve each rule's shipped value exactly (NFP #6, additive): this
// sweep re-points *which* targets survive, never *how many*, so the golden comparison
// has one variable in it.

/**
 * How many targets each graph-scanning target rule returns, after proximity ordering.
 *
 * Keyed by `StrategicTargetRule['type']`. Only rules that scan the whole graph appear —
 * `self`, `faction`, `trade_route` and `hex_region` are bounded by graph structure and
 * need no cap. `colocated_actor` is listed because it carries a cap, but it is already
 * proximity-bounded by construction (it reads one location's `located_at` edges), so it
 * is capped without being reordered.
 */
export const STRATEGIC_TARGET_SCAN_CAPS: Readonly<Record<string, number>> = {
  any_location: 5,
  location_subtype: 8,
  sublocation_type: 5,
  actor_with_trait: 5,
  colocated_actor: 5,
  // THR-1309. Small because both arms of the rule are naturally small: a commander
  // holds very few bands, and a rival only needs the nearest few to have a real choice.
  group_node: 5,
};

/**
 * Distance assigned to a target whose hex cannot be resolved (NFP #4, fail-soft).
 *
 * Deliberately sorts such a target **last** rather than dropping it: a node with no
 * resolvable hex is still a legal target, and dropping it would let this sweep empty a
 * target set that the pre-THR-1310 scan filled — turning a targeting fix into a
 * liveness regression. Same treatment when the *acting agent's* hex is unresolvable, in
 * which case there is no proximity information at all and insertion order is kept.
 */
export const STRATEGIC_TARGET_UNRESOLVED_HEX_DISTANCE = Number.MAX_SAFE_INTEGER;

// ─── The T2 undertaking tier (THR-1308) ─────────────────────────────
//
// T2's objects are *places*, which is the whole reason this tier needed a new op:
// every T1 kind's object was an edge, a possession or an actor-side record, and none
// of those needed a node minted at a hex.

/**
 * The `LocationSubtype` a route-identity node carries.
 *
 * Named rather than inlined because three writers/readers have to agree on it — the
 * minting op, the blockade verb that finds the node again, and the display tables
 * keyed by subtype. A literal in three files is the drift this constant prevents.
 */
export const ROUTE_IDENTITY_SUBTYPE = 'trade_route';

/**
 * Seed prosperity for a settlement founded by `create_location`.
 *
 * Deliberately below `INITIAL_PROSPERITY.hamlet` (20 at worldgen): a place founded
 * inside the run is a season old, not a generation old, and `phaseProsperity` grows
 * it from here on the same curve as everywhere else. Starting it level with a seeded
 * hamlet would hand the founder the outcome the undertaking's checkpoints are there
 * to make them earn.
 */
export const FOUNDED_SETTLEMENT_INITIAL_PROSPERITY = 8;

/**
 * Hex ring searched for an unclaimed site when founding a place-tier location.
 *
 * A founded settlement lands on the founder's own hex when nothing is there, and
 * otherwise on the nearest empty hex within this radius — "an unclaimed hex adjacent
 * to demand", as the plan puts it. Zero would make the verb fail wherever the founder
 * is standing somewhere that already exists, which is nearly everywhere agents are.
 */
export const FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS = 2;

// ─── The T3 undertaking tier (THR-1309) ─────────────────────────────
//
// T3's objects are *organisations* — people who answer to someone. T1 minted records
// and edges, T2 minted places; this tier mints the one thing that can act back.

/**
 * How many companions a raised warband musters beyond its commander.
 *
 * `createGroup` refuses below `GROUP_MIN_MEMBERS` (2, counting the leader), so this
 * is the authored intent rather than the floor: a warband is meant to read as a
 * force, and a commander plus one is a pair. Capped by `GROUP_MAX_MEMBERS` inside
 * `createGroup`, so raising the number here can never overflow the roster.
 */
export const WARBAND_TARGET_MEMBER_COUNT = 5;

/**
 * The cast key a raised warband's recruits fill.
 *
 * Named rather than inlined because two files have to agree on it exactly — the
 * template that authors the slot and the completion dispatch that reads the ledger
 * back by `castKey`. A literal in both places is a silent empty roster the moment
 * either is renamed: the ledger read would match nothing, `raiseWarband` would fall
 * through to colocation, and the failure would look like an empty field rather than
 * a typo.
 */
export const WARBAND_RECRUIT_CAST_KEY = 'recruit';

/**
 * Starting cohesion for a raised warband.
 *
 * Deliberately above `GROUP_COHESION_START_BASE` (0.55): a company that forms because
 * strangers fell in together starts at the base, but a warband was *recruited* — the
 * undertaking's checkpoints are the recruiting, and the commander who passed them has
 * already done the work that cohesion measures. Not so high that upkeep never bites;
 * the band still frays if it is led badly.
 */
export const WARBAND_INITIAL_COHESION = 0.7;

/**
 * The dissolution reason a suborned warband records.
 *
 * Reuses the existing `betrayal` member rather than widening `DissolutionReason` with
 * a `suborned` synonym: buying a band's captains *is* the band turning on its
 * commander, which is what `betrayal` already means and what every existing consumer
 * of the reason already handles. A new member would need every one of those consumers
 * revisited to earn a distinction the fiction does not actually make.
 */
export const SUBORNED_WARBAND_DISSOLUTION_REASON = 'betrayal' as const;
