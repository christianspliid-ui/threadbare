#!/usr/bin/env node
// Player power-progression model — THR-1767 (ported from the THR-1745 design session).
//
// One scripted player plays one doom window (1,080 ticks = 90 in-world days) under
// several essence economies and prints, per economy, the per-phase table and the
// ticks-between-growth table. Recipe and formulas:
//   Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md
//   (§ The engine as it stands, § Model 0, § Models A–C, § Constants table)
//
// Deterministic: no PRNG. Lottery-timed unlocks (the Wellspring) use their expected tick.
// No dependencies. Engine constants are COPIED, with the source file cited beside each —
// importing the TS sources from .mjs would need a bundler step, and the model must run
// from a clean checkout with plain `node`. If you retune a cited constant in src/, update
// it here too (or pass a new economy config) and re-run `npm run model:power -- --check`.
//
// Usage:
//   npm run model:power                     # all economies
//   npm run model:power -- --model asis     # one economy (asis | holdings | threads | spheres | dominion)
//   npm run model:power -- --events         # also print each economy's event log
//   npm run model:power -- --check          # assert the plan doc's printed tables; exit 1 on drift

// ─── Run window ──────────────────────────────────────────────────────────────
const RUN_TICKS = 1080;                       // DEFAULT_DOOM_TICKS — src/data/game-config.ts
const TICKS_PER_DAY = 12;                     // 90 in-world days at 12 ticks a day (plan doc § The starting god)
const SNAPSHOT_TICKS = [120, 240, 360, 540, 720, 900, 1080]; // days 10, 20, 30, 45, 60, 75, 90

// ─── The scripted player (identical across every economy; all tunable) ────────
// These are MODEL ASSUMPTIONS, not engine constants (plan doc § Constants table, last row).
const PLAYER = {
  actEvery: 6,                                // PLAYER_ACT_EVERY — one deliberate act per half day
  storySpendEvery: 24,                        // STORY_SPEND_EVERY — an attended chapter every two days (THR-1715 cadence)
  storySpend: { primary: 3, secondary: 2 },   // 5 essence of nudge cards per chapter: two sphere-matched + one off
  threadSchedule: [0, 60, 150, 300, 500, 720],// bind a new mortal on days 0, 5, 12.5, 25, ~42, 60 …
  bindReserve: 10,                            // … only when primary pool ≥ bind cost + this reserve (so upkeep stays payable)
  sourceStepEvery: 36,                        // one source-loop step every three days once the source verbs are held
  fallbackSpend: 4,                           // otherwise spend this on whatever verb is held (an econ verb / a card)
  storyDifficulty: 0.4,                       // difficulty fed to depth practice for a story spend (Heart)
  bindDifficulty: 0.2,                        // bind_thread_agent step difficulty — src/data/unified-action-templates.ts
  sourceDifficulty: 0.3,                      // source-loop step difficulty (Stone)
  fallbackDifficulty: 0.35,                   // fallback verb difficulty (alternates Stone / Heart by tick parity)
};

// Opening spine timing (src/data/ascendant-beat-content.ts spine; plan doc § Unlocks).
const SEAT_TICK = 14;                         // Beat 1: bind place + the home seat (+1.0/tick)
const SIGNATURE_TICK = 40;                    // Beat 4: the primary reach signature
const SPINE_CARDS = 7;                        // thread, observe, place thread, imbue, persuade, dream/omen/inspire ≈ 7
const STARTING_SPHERE_SCORE = 2;              // ARCHETYPE_SPHERE_BONUS_PRIMARY — src/types/sphereAffinity.ts

// ─── Engine constants (copied; cited) ────────────────────────────────────────
const BASE_ESSENCE_PER_TICK = 1.0;            // src/data/influence-content.ts
const ESSENCE_PER_THREAD = 0.1;               // src/data/influence-content.ts
const ESSENCE_PER_SEAT = 1.0;                 // src/data/influence-content.ts
const ASPECT_ESSENCE_PER_TICK = 0.3;          // src/data/aspect-content.ts
const ASPECT_ELIGIBILITY_TICKS = 60;          // src/data/aspect-content.ts
const INITIAL_ESSENCE_PER_SPHERE = 50;        // src/engine/influence.ts
const BASE_MAX_ESSENCE = 50;                  // src/data/influence-content.ts
const MAX_ESSENCE_PER_THREAD = 5;             // src/data/influence-content.ts
// distributeByAlignment split — src/engine/influence.ts (0.35 / 0.25 / 0.40 over the ten others)
const PRIMARY_SHARE = 0.35;
const SECONDARY_SHARE = 0.25;
const OTHER_SHARE_EACH = 0.40 / 10;
const OTHER_SPHERE_COUNT = 10;
const TIER_MAINTENANCE = { 0: 0, 1: 0.5, 2: 1.0, 3: 2.0, 4: 4.0 };   // src/data/influence-content.ts
const TIER_PROMOTION_THRESHOLDS = { 2: 30, 3: 90, 4: 180 };           // src/data/influence-content.ts (ticks at current tier, paid)
const BASE_SOURCE_INCOME = { placeOfPower: 0.5, shrine: 0.4, relic: 0.6 }; // src/data/essence-sources.ts
const SOURCE_FLOWERING_MULTIPLIER = 2.0;      // src/data/essence-sources.ts
const SOURCE_DR_BASE = 0.8;                   // src/data/essence-sources.ts (same-sphere diminishing returns, richest first)
const SANCTITY_BUILD_PER_ACTION = 0.15;       // src/data/essence-sources.ts
const SANCTITY_FLOWERING_THRESHOLD = 0.6;     // src/data/essence-sources.ts
const SOURCE_CONTROL_SUSTAIN = 0.15;          // src/data/essence-sources.ts (declared; NOT charged by the engine today — H4)
const SPHERE_ATTUNEMENT_THRESHOLDS = [20, 60];// src/data/nudge-constants.ts
const COST = {
  bindThread: 10,                             // bind_thread_agent — src/data/unified-action-templates.ts
  findSource: 3,                              // loc.find_source — src/data/unified-action-templates.ts
  claimSource: 5,                             // loc.claim_source — src/data/unified-action-templates.ts
  sanctify: 3,                                // loc.sanctify_source — src/data/unified-action-templates.ts
};
// God-side reach depth — src/data/player-progression.ts + src/engine/domainCapability.ts
const PLAYER_PRACTICE_PER_ACTION = 0.4;       // src/data/player-progression.ts
const PLAYER_DIMINISHING_RETURNS_FACTOR = 0.7;// src/data/player-progression.ts
const SECONDARY_REACH_PRACTICE_MULT = 0.7;    // src/data/player-progression.ts
const PRE_REFIT_SIGMOID_MIDPOINT = 10;        // src/engine/domainCapability.ts
const PRE_REFIT_SIGMOID_K = 0.4;              // src/engine/domainCapability.ts
// The god's own sphere score — src/types/sphereAffinity.ts (triangle levelling: level n costs n progress)
const MANDATE_PRESSURE_MILESTONE = 2;         // src/types/sphereAffinity.ts
const MANDATE_PRESSURE_COMPLETION = 5;        // src/types/sphereAffinity.ts
const MAX_SPHERE_SCORE = 10;                  // src/types/sphereAffinity.ts
const MANDATE_MILESTONE_TICKS = [300, 600];   // model assumption: the two mandate stage advances
const MANDATE_COMPLETION_TICK = 900;          // model assumption: mandate completion

// ─── Shared-prerequisite retune (THR-1745 § Shared prerequisites) ────────────
const RETUNED_MAINTENANCE = { 0: 0, 1: 0.1, 2: 0.2, 3: 0.35, 4: 0.5 };
const WELLSPRING_MILESTONE_TICKS_AFTER_BOND = 48;
const WELLSPRING_EXPECTED_LOTTERY_TICK = 170; // as-is: weight 4 of ~76 per ~9-tick draw → expected ~19 draws
const WELLSPRING_CARDS = 5;                   // find / claim / consecrate / sanctify / defend

// Model-fidelity switch. The THR-1745 session script stamped each depth-tier event with
// the tick of the PREVIOUS logged event instead of the current tick. The plan doc's
// depth-cadence numbers ("a depth tier every ~124" etc.) were produced with that stamp,
// so it stays on by default to reproduce them; set false for true event timing.
const DEPTH_EVENT_USES_PREVIOUS_EVENT_TICK = true;

// ─── Economies ───────────────────────────────────────────────────────────────
const MODELS = {
  asis: {
    name: 'Model 0 — As-is (current engine)',
    wellspringTick: WELLSPRING_EXPECTED_LOTTERY_TICK,
    sourceUpkeepCharged: false,
    latentSources: 4,                         // 6 seeded per map; ~4 within find range of the god's ground
    threadYieldPerTier: null,                 // flat ESSENCE_PER_THREAD
    threadMaintenance: TIER_MAINTENANCE,
    mortalMintsSources: false,
    attunementMarks: SPHERE_ATTUNEMENT_THRESHOLDS,
    attunementRaisesSphere: false,
    sphereIncomeSlope: 0,
    sphereCardGates: null,
    sourceMilestones: { 3: 6 },               // 6 econ verbs at the milestone …
    sourceMilestoneCountsHeldOrFirstFlowering: true, // … reached at 3 held sources OR the first flowering (as-is rule)
    clashTrials: null,
    tierUnlocks: null,
  },
  holdings: {
    name: 'Model A — Holdings (place-led compounding)',
    wellspringTick: WELLSPRING_MILESTONE_TICKS_AFTER_BOND,
    sourceUpkeepCharged: true,
    latentSources: 8,                         // LATENT_SOURCES_PER_AREA = 2, over the threaded Areas
    threadYieldPerTier: null,
    threadMaintenance: RETUNED_MAINTENANCE,
    mortalMintsSources: false,
    attunementMarks: SPHERE_ATTUNEMENT_THRESHOLDS,
    attunementRaisesSphere: false,
    sphereIncomeSlope: 0,
    sphereCardGates: null,
    sourceMilestones: { 1: 6, 3: 4, 6: 4 },   // SOURCE_MILESTONE_FLOWERING [1, 3, 6]: econ verbs, then orphans
    sourceMilestoneCountsHeldOrFirstFlowering: false,
    clashTrials: null,
    tierUnlocks: null,
  },
  threads: {
    name: 'Model B — Threads (people-led returns)',
    wellspringTick: WELLSPRING_MILESTONE_TICKS_AFTER_BOND,
    sourceUpkeepCharged: true,
    latentSources: 4,
    threadYieldPerTier: { 1: 0.15, 2: 0.30, 3: 0.45, 4: 0.60 }, // ESSENCE_PER_THREAD_BY_TIER
    threadMaintenance: RETUNED_MAINTENANCE,
    mortalMintsSources: true,                 // Champion mints a shrine (0.4), Aspect a relic (0.6), already flowering
    attunementMarks: SPHERE_ATTUNEMENT_THRESHOLDS,
    attunementRaisesSphere: false,
    sphereIncomeSlope: 0,
    sphereCardGates: null,
    sourceMilestones: { 1: 6 },
    sourceMilestoneCountsHeldOrFirstFlowering: false,
    clashTrials: null,
    tierUnlocks: { 2: 2, 3: 3, 4: 3 },        // THREAD_TIER_MILESTONES: cards when the FIRST thread reaches a tier
  },
  spheres: {
    name: 'Model C — Spheres (attunement-led, THR-870 direction)',
    wellspringTick: WELLSPRING_MILESTONE_TICKS_AFTER_BOND,
    sourceUpkeepCharged: true,
    latentSources: 4,
    threadYieldPerTier: null,
    threadMaintenance: RETUNED_MAINTENANCE,
    mortalMintsSources: false,
    attunementMarks: [20, 60, 150, 300, 600], // SPHERE_ATTUNEMENT_THRESHOLDS extended
    attunementRaisesSphere: true,             // ATTUNEMENT_SPHERE_PROGRESS = 1 per primary mark
    sphereIncomeSlope: 0.1,                   // SPHERE_INCOME_SLOPE: all generation × (1 + slope × score)
    sphereCardGates: { 3: 4, 5: 4, 7: 4 },    // SPHERE_CARD_GATES
    sourceMilestones: { 1: 6 },
    sourceMilestoneCountsHeldOrFirstFlowering: false,
    clashTrials: { every: 120, cost: 6, progress: 2 }, // CLASH_TRIAL_EVERY_TICKS / _COST / _PROGRESS
    tierUnlocks: null,
  },
  // The Dominion loop (Christian's 2026-10-05 ruling, THR-1745 § Director's ruling).
  // Empty slot: the prototype tickets fill this with a config of the same shape as above
  // (plus any new switches simulate() learns). Skipped while null.
  dominion: null,
};

// ─── Simulation ──────────────────────────────────────────────────────────────
function simulate(M) {
  const pool = { primary: INITIAL_ESSENCE_PER_SPHERE, secondary: INITIAL_ESSENCE_PER_SPHERE, other: INITIAL_ESSENCE_PER_SPHERE };
  const earned = { primary: 0, secondary: 0 };
  const threads = [];       // { tier, ticksAtTier, bornTick, aspect }
  const sources = [];       // { sanctity, flowering, kind, base }
  const marksHit = { primary: 0, secondary: 0 };
  const sphere = { score: STARTING_SPHERE_SCORE, progress: 0 };
  const practice = { stone: 0, heart: 0 };
  const depth = { stone: 1, heart: 1 };
  const events = [];
  const snapshots = [];
  const tierUnlocksDone = new Set(), sourceMilestonesDone = new Set(), sphereGatesDone = new Set();
  let seat = false, wellspring = false, latentLeft = M.latentSources, sourcesPendingClaim = 0;
  let cardsHeld = SPINE_CARDS, nextThreadIdx = 0, lastSourceStep = -999, lastAct = -999, lastTrial = 0;
  let curT = 0;

  const log = (t, cat, what) => events.push({ t, cat, what });
  const lastEventTick = () => (events.length ? events[events.length - 1].t : 0);

  function pushSphere(progress, t) {
    sphere.progress += progress;
    while (sphere.score < MAX_SPHERE_SCORE && sphere.progress >= sphere.score + 1) {
      sphere.progress -= sphere.score + 1; sphere.score++;
      log(t, 'sphere', `primary sphere score → ${sphere.score}`);
    }
  }
  // phaseAscendantProgression: 0.4 × difficultyScale × max(1 − 0.7 × capability, 0.1), × 0.7 in the secondary reach (Heart)
  const capability = raw => 1 / (1 + Math.exp(-PRE_REFIT_SIGMOID_K * (raw - PRE_REFIT_SIGMOID_MIDPOINT)));
  const depthTier = cap => Math.min(10, Math.max(1, Math.ceil(cap * 10)));
  function accrue(reach, difficulty) {
    const cap = capability(practice[reach]);
    const diffScale = difficulty * 100 < 20 ? 0.2 : difficulty * 100 < 40 ? 0.5 : 1.0;
    const delta = PLAYER_PRACTICE_PER_ACTION * diffScale * Math.max(1 - cap * PLAYER_DIMINISHING_RETURNS_FACTOR, 0.1)
      * (reach === 'heart' ? SECONDARY_REACH_PRACTICE_MULT : 1);
    practice[reach] += delta;
    const tier = depthTier(capability(practice[reach]));
    if (tier > depth[reach]) {
      depth[reach] = tier;
      log(DEPTH_EVENT_USES_PREVIOUS_EVENT_TICK ? lastEventTick() : curT, 'depth', `${reach} depth tier → ${tier}`);
    }
  }

  for (let t = 0; t <= RUN_TICKS; t++) {
    curT = t;
    // ── unlock arrivals ──
    if (t === SEAT_TICK) { seat = true; log(t, 'skill', 'home seat (+1.0/tick)'); }
    if (t === SIGNATURE_TICK) { cardsHeld += 1; log(t, 'skill', 'primary reach signature (Great Work)'); }
    if (t === M.wellspringTick) { wellspring = true; cardsHeld += WELLSPRING_CARDS; log(t, 'skill', 'The Wellspring: find/claim/consecrate/sanctify/defend'); }

    // ── income (computeEssenceGeneration shape) ──
    const nThreads = threads.length;
    const nAspects = threads.filter(x => x.aspect).length;
    let total = BASE_ESSENCE_PER_TICK + (seat ? ESSENCE_PER_SEAT : 0) + nAspects * ASPECT_ESSENCE_PER_TICK;
    if (M.threadYieldPerTier) for (const th of threads) total += M.threadYieldPerTier[th.tier];
    else total += nThreads * ESSENCE_PER_THREAD;
    const gen = { primary: total * PRIMARY_SHARE, secondary: total * SECONDARY_SHARE, other: total * OTHER_SHARE_EACH };
    // Typed sources: assumed consecrated to the god's primary sphere; diminishing returns richest-first.
    const srcValue = s => s.base * (s.flowering ? SOURCE_FLOWERING_MULTIPLIER : 1);
    const ranked = [...sources].sort((a, b) => srcValue(b) - srcValue(a));
    gen.primary += ranked.reduce((sum, s, rank) => sum + srcValue(s) * Math.pow(SOURCE_DR_BASE, rank), 0);
    if (M.sphereIncomeSlope) {
      const m = 1 + M.sphereIncomeSlope * sphere.score;
      gen.primary *= m; gen.secondary *= m; gen.other *= m;
    }
    const cap = BASE_MAX_ESSENCE + nThreads * MAX_ESSENCE_PER_THREAD;
    for (const k of ['primary', 'secondary', 'other']) {
      const added = Math.min(gen[k], Math.max(0, cap - pool[k]));
      pool[k] += added;
      if (k !== 'other') earned[k] += added;   // the essence-earned counter banks only what lands
    }
    const income = gen.primary + gen.secondary + gen.other * OTHER_SPHERE_COUNT;

    // ── upkeep (primary sphere; all-or-nothing — unpaid ticks do not count toward promotion) ──
    let upkeep = 0;
    for (const th of threads) upkeep += M.threadMaintenance[th.tier];
    if (M.sourceUpkeepCharged) upkeep += sources.length * SOURCE_CONTROL_SUSTAIN;
    if (pool.primary >= upkeep) { pool.primary -= upkeep; for (const th of threads) th.ticksAtTier++; }

    // ── promotions (ticksAtCurrentTier resets per tier, as checkTierPromotion does) ──
    for (const th of threads) {
      if (th.tier < 4 && th.ticksAtTier >= TIER_PROMOTION_THRESHOLDS[th.tier + 1]) {
        th.tier++; th.ticksAtTier = 0; log(t, 'thread', `thread → tier ${th.tier}`);
        if (M.tierUnlocks && !tierUnlocksDone.has(th.tier)) {
          tierUnlocksDone.add(th.tier); cardsHeld += M.tierUnlocks[th.tier];
          log(t, 'skill', `${M.tierUnlocks[th.tier]} cards at thread tier ${th.tier}`);
        }
        if (M.mortalMintsSources && th.tier === 3) {
          sources.push({ sanctity: SANCTITY_FLOWERING_THRESHOLD, flowering: true, kind: 'shrine', base: BASE_SOURCE_INCOME.shrine });
          log(t, 'source', 'Champion raises a shrine (0.4)');
        }
      } else if (th.tier === 4 && !th.aspect && th.ticksAtTier >= ASPECT_ELIGIBILITY_TICKS) {
        th.aspect = true; log(t, 'thread', 'Aspect (apotheosis)');
        if (M.mortalMintsSources) {
          sources.push({ sanctity: 1, flowering: true, kind: 'relic', base: BASE_SOURCE_INCOME.relic });
          log(t, 'source', 'Aspect leaves a relic (0.6)');
        }
      }
    }

    // ── attunement marks ──
    for (const k of ['primary', 'secondary']) {
      while (marksHit[k] < M.attunementMarks.length && earned[k] >= M.attunementMarks[marksHit[k]]) {
        marksHit[k]++; cardsHeld += 1; log(t, 'skill', `${k} attunement mark ${marksHit[k]} (repertoire card)`);
        if (M.attunementRaisesSphere && k === 'primary') pushSphere(1, t);
      }
    }

    // ── sphere-score writers: mandate (as-is), clash trials and score gates (Model C) ──
    if (MANDATE_MILESTONE_TICKS.includes(t)) pushSphere(MANDATE_PRESSURE_MILESTONE, t);
    if (t === MANDATE_COMPLETION_TICK) pushSphere(MANDATE_PRESSURE_COMPLETION, t);
    if (M.clashTrials && t - lastTrial >= M.clashTrials.every && pool.secondary >= M.clashTrials.cost) {
      lastTrial = t; pool.secondary -= M.clashTrials.cost; pushSphere(M.clashTrials.progress, t); log(t, 'skill', 'clash trial answered');
    }
    if (M.sphereCardGates) for (const [lvl, n] of Object.entries(M.sphereCardGates)) {
      if (sphere.score >= +lvl && !sphereGatesDone.has(lvl)) { sphereGatesDone.add(lvl); cardsHeld += n; log(t, 'skill', `${n} sphere-gated cards at score ${lvl}`); }
    }

    // ── the player acts ──
    if (t % PLAYER.storySpendEvery === 0 && t > 0) {
      const p = Math.min(pool.primary, PLAYER.storySpend.primary), s = Math.min(pool.secondary, PLAYER.storySpend.secondary);
      pool.primary -= p; pool.secondary -= s; accrue('heart', PLAYER.storyDifficulty);
    }
    if (t - lastAct >= PLAYER.actEvery) {
      // 1. bind a thread on schedule, keeping a reserve so the upkeep stays payable
      if (nextThreadIdx < PLAYER.threadSchedule.length && t >= PLAYER.threadSchedule[nextThreadIdx] && pool.primary >= COST.bindThread + PLAYER.bindReserve) {
        pool.primary -= COST.bindThread; threads.push({ tier: 1, ticksAtTier: 0, bornTick: t, aspect: false }); nextThreadIdx++; lastAct = t;
        log(t, 'thread', `thread bound (#${threads.length})`); accrue('heart', PLAYER.bindDifficulty);
      }
      // 2. the source loop: tend a dormant source, else claim a found one, else find one
      //    (find/claim paid from an off-sphere pool, sanctify from primary; consecrate is not charged)
      else if (wellspring && t - lastSourceStep >= PLAYER.sourceStepEvery) {
        const dormant = sources.find(s => !s.flowering && s.kind === 'placeOfPower');
        if (dormant && pool.primary >= COST.sanctify) {
          pool.primary -= COST.sanctify; dormant.sanctity += SANCTITY_BUILD_PER_ACTION; lastSourceStep = t; lastAct = t; accrue('stone', PLAYER.sourceDifficulty);
          if (dormant.sanctity >= SANCTITY_FLOWERING_THRESHOLD) { dormant.flowering = true; log(t, 'source', `source flowering (#${sources.indexOf(dormant) + 1})`); }
        } else if (sourcesPendingClaim > 0 && pool.other >= COST.claimSource) {
          pool.other -= COST.claimSource; sourcesPendingClaim--;
          sources.push({ sanctity: 0, flowering: false, kind: 'placeOfPower', base: BASE_SOURCE_INCOME.placeOfPower });
          lastSourceStep = t; lastAct = t; log(t, 'source', `source claimed (#${sources.length})`); accrue('stone', PLAYER.sourceDifficulty);
        } else if (latentLeft > 0 && pool.other >= COST.findSource) {
          pool.other -= COST.findSource; latentLeft--; sourcesPendingClaim++; lastSourceStep = t; lastAct = t;
        }
      }
      // 3. otherwise play the world with whatever is held
      else if (pool.primary >= PLAYER.fallbackSpend) {
        pool.primary -= PLAYER.fallbackSpend; lastAct = t; accrue(t % 2 ? 'stone' : 'heart', PLAYER.fallbackDifficulty);
      }
    }

    // ── source milestones ──
    const flowering = sources.filter(s => s.flowering).length;
    for (const [n, cards] of Object.entries(M.sourceMilestones)) {
      const reached = M.sourceMilestoneCountsHeldOrFirstFlowering ? (sources.length >= +n || flowering >= 1) : flowering >= +n;
      if (reached && !sourceMilestonesDone.has(n)) { sourceMilestonesDone.add(n); cardsHeld += cards; log(t, 'skill', `${cards} cards at source milestone ${n}`); }
    }

    if (SNAPSHOT_TICKS.includes(t)) snapshots.push({
      t, day: t / TICKS_PER_DAY, income, primaryIncome: gen.primary, upkeep, net: gen.primary - upkeep,
      poolP: pool.primary, poolS: pool.secondary, poolO: pool.other, cap,
      threads: nThreads, maxTier: Math.max(0, ...threads.map(x => x.tier)), aspects: nAspects,
      sources: sources.length, flowering, cards: cardsHeld, sphere: sphere.score, stone: depth.stone, heart: depth.heart,
    });
  }
  return { snapshots, events };
}

function cadence(events, cat) {
  const ts = events.filter(e => e.cat === cat).map(e => e.t);
  if (ts.length < 2) return { n: ts.length, avgGap: null, first: ts[0] ?? null, last: ts[ts.length - 1] ?? null };
  return { n: ts.length, avgGap: Math.round((ts[ts.length - 1] - ts[0]) / (ts.length - 1)), first: ts[0], last: ts[ts.length - 1] };
}
const CADENCE_CATEGORIES = ['skill', 'thread', 'source', 'sphere', 'depth'];

// ─── Formatting (plan-doc precision: two-decimal value, then half-up to one) ─
const r2 = x => +x.toFixed(2);
const r1 = x => Math.round(r2(x) * 10 + 1e-9) / 10;
const f1 = x => r1(x).toFixed(1);
const f2 = x => r2(x).toFixed(2);
const int = x => String(Math.round(x));

function phaseRows(key, snaps) {
  return snaps.map(s => {
    const base = { Day: String(s.day), 'Income / tick': f1(s.income) };
    if (key === 'asis') return {
      ...base, 'Primary income': f2(s.primaryIncome), 'Thread upkeep': f1(s.upkeep), 'Primary pool': int(s.poolP),
      'Threads (max tier)': `${s.threads} (${s.maxTier})`, Aspects: String(s.aspects),
      'Sources (flowering)': `${s.sources} (${s.flowering})`, 'Cards held': String(s.cards), 'Life score': String(s.sphere),
    };
    const tail = key === 'holdings' ? { 'Stone depth': String(s.stone) }
      : key === 'threads' ? { 'Heart depth': String(s.heart) }
      : key === 'spheres' ? { 'Life score': String(s.sphere) }
      : { 'Life score': String(s.sphere), 'Stone depth': String(s.stone), 'Heart depth': String(s.heart) };
    return {
      ...base, 'Primary net after upkeep': f1(s.net), 'Threads (Aspects)': `${s.threads} (${s.aspects})`,
      'Sources (flowering)': `${s.sources} (${s.flowering})`, 'Cards held': String(s.cards), ...tail,
    };
  });
}

function printTable(rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)));
  const line = cells => '| ' + cells.map((c, i) => String(c ?? '').padEnd(w[i])).join(' | ') + ' |';
  console.log(line(cols));
  console.log('|' + w.map(n => '-'.repeat(n + 2)).join('|') + '|');
  for (const r of rows) console.log(line(cols.map(c => r[c])));
}

// ─── The plan doc's printed tables (THR-1745), for --check ───────────────────
// Rows at days 10, 20, 30, 45, 60, 90 exactly as printed in the plan doc. The plan prints
// Model 0's day-45 threads cell as "1 (4, Aspect)" to mark the Aspect's arrival; that
// annotation is checked here through the separate Aspects column (1 from day 45 on).
const PLAN_DOC_TABLES = {
  asis: [
    { Day: '10', 'Income / tick': '2.1', 'Primary income': '0.73', 'Thread upkeep': '1.0', 'Primary pool': '0', 'Threads (max tier)': '1 (2)', Aspects: '0', 'Sources (flowering)': '0 (0)', 'Cards held': '10', 'Life score': '2' },
    { Day: '20', 'Income / tick': '2.6', 'Primary income': '1.23', 'Thread upkeep': '2.0', 'Primary pool': '0', 'Threads (max tier)': '1 (3)', Aspects: '0', 'Sources (flowering)': '1 (0)', 'Cards held': '16', 'Life score': '2' },
    { Day: '30', 'Income / tick': '3.3', 'Primary income': '1.96', 'Thread upkeep': '2.0', 'Primary pool': '0', 'Threads (max tier)': '1 (3)', Aspects: '0', 'Sources (flowering)': '3 (0)', 'Cards held': '22', 'Life score': '2' },
    { Day: '45', 'Income / tick': '3.9', 'Primary income': '2.32', 'Thread upkeep': '4.0', 'Primary pool': '0', 'Threads (max tier)': '1 (4)', Aspects: '1', 'Sources (flowering)': '4 (0)', 'Cards held': '22', 'Life score': '2' },
    { Day: '60', 'Income / tick': '4.4', 'Primary income': '2.82', 'Thread upkeep': '4.0', 'Primary pool': '1', 'Threads (max tier)': '1 (4)', Aspects: '1', 'Sources (flowering)': '4 (1)', 'Cards held': '23', 'Life score': '3' },
    { Day: '90', 'Income / tick': '5.4', 'Primary income': '3.79', 'Thread upkeep': '4.0', 'Primary pool': '0', 'Threads (max tier)': '1 (4)', Aspects: '1', 'Sources (flowering)': '4 (4)', 'Cards held': '23', 'Life score': '4' },
  ],
  holdings: [
    ['10', '2.7', '0.7', '2 (0)', '1 (0)', '15', '1'], ['20', '2.7', '0.4', '2 (0)', '1 (0)', '16', '1'],
    ['30', '3.6', '1.0', '2 (0)', '2 (1)', '22', '1'], ['45', '5.2', '1.0', '5 (2)', '3 (2)', '23', '3'],
    ['60', '5.5', '0.9', '5 (2)', '3 (3)', '27', '7'], ['90', '7.3', '0.8', '6 (5)', '5 (4)', '27', '10'],
  ],
  threads: [
    ['10', '3.1', '0.9', '2 (0)', '2 (1)', '26', '1'], ['20', '5.4', '1.9', '3 (0)', '3 (3)', '27', '3'],
    ['30', '6.6', '2.0', '4 (0)', '6 (5)', '30', '6'], ['45', '10.1', '3.1', '5 (3)', '10 (9)', '31', '8'],
    ['60', '11.2', '3.1', '5 (4)', '12 (12)', '31', '9'], ['90', '12.5', '2.6', '6 (5)', '16 (16)', '31', '10'],
  ],
  spheres: [
    ['10', '3.2', '1.0', '2 (0)', '1 (0)', '19', '3'], ['20', '4.3', '1.3', '3 (0)', '1 (1)', '28', '4'],
    ['30', '5.3', '1.4', '4 (0)', '2 (1)', '33', '5'], ['45', '8.3', '2.5', '5 (3)', '3 (2)', '34', '5'],
    ['60', '9.8', '3.2', '5 (4)', '3 (3)', '34', '6'], ['90', '12.0', '3.9', '6 (5)', '4 (4)', '39', '7'],
  ],
};
// Cadence lines as printed under each table (ticks between events; source "first at" for Model 0).
const PLAN_DOC_CADENCE = {
  asis: { skill: 94, thread: 134, source: 119, sphere: 300, depth: 124, sourceFirst: 206 },
  holdings: { skill: 82, thread: 36, source: 110, sphere: 300, depth: 56 },
  threads: { skill: 47, thread: 37, source: 52, sphere: 300, depth: 77 },
  spheres: { skill: 46, thread: 37, source: 114, sphere: 195, depth: 75 },
};
const MODEL_ABC_TAIL = { holdings: 'Stone depth', threads: 'Heart depth', spheres: 'Life score' };

function expectedRows(key) {
  const t = PLAN_DOC_TABLES[key];
  if (key === 'asis') return t;
  return t.map(([Day, inc, net, th, src, cards, tail]) => ({
    Day, 'Income / tick': inc, 'Primary net after upkeep': net, 'Threads (Aspects)': th,
    'Sources (flowering)': src, 'Cards held': cards, [MODEL_ABC_TAIL[key]]: tail,
  }));
}

function check(key, rows, events) {
  const diffs = [];
  for (const exp of expectedRows(key)) {
    const got = rows.find(r => r.Day === exp.Day);
    for (const [col, v] of Object.entries(exp)) if (!got || got[col] !== v) diffs.push(`day ${exp.Day} ${col}: plan ${v}, model ${got ? got[col] : '—'}`);
  }
  const want = PLAN_DOC_CADENCE[key];
  for (const c of CADENCE_CATEGORIES) {
    const got = cadence(events, c).avgGap;
    if (got !== want[c]) diffs.push(`cadence ${c}: plan ~${want[c]}, model ${got}`);
  }
  if (want.sourceFirst !== undefined && cadence(events, 'source').first !== want.sourceFirst) {
    diffs.push(`first source event: plan ${want.sourceFirst}, model ${cadence(events, 'source').first}`);
  }
  return diffs;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const only = args.includes('--model') ? args[args.indexOf('--model') + 1] : null;
const doCheck = args.includes('--check');
const showEvents = args.includes('--events');
if (only && !(only in MODELS)) { console.error(`Unknown --model "${only}". One of: ${Object.keys(MODELS).join(', ')}`); process.exit(2); }

let failed = false;
for (const key of Object.keys(MODELS)) {
  if (only && key !== only) continue;
  const M = MODELS[key];
  if (!M) { console.log(`\n=== ${key} — empty slot (filled by the Dominion prototype tickets) ===`); continue; }
  const { snapshots, events } = simulate(M);
  const rows = phaseRows(key, snapshots);
  console.log(`\n=== ${M.name} ===\n`);
  printTable(rows);
  console.log('\nTicks between growth events:\n');
  printTable(CADENCE_CATEGORIES.map(c => {
    const g = cadence(events, c);
    return { Category: c, Events: String(g.n), 'Avg gap (ticks)': g.avgGap === null ? '—' : String(g.avgGap), 'First tick': String(g.first ?? '—'), 'Last tick': String(g.last ?? '—') };
  }));
  const lastCard = cadence(events, 'skill').last;
  console.log(`\nLast new card arrives: day ${lastCard === null ? '—' : Math.round(lastCard / TICKS_PER_DAY)}`);
  if (showEvents) console.log('\nEvents: ' + events.map(e => `${e.t}:${e.cat}:${e.what}`).join(' | '));
  if (doCheck && PLAN_DOC_TABLES[key]) {
    const diffs = check(key, rows, events);
    if (diffs.length) { failed = true; console.log(`\nCHECK FAIL (${key}) vs plan doc:\n  ` + diffs.join('\n  ')); }
    else console.log(`\nCHECK OK (${key}): matches the THR-1745 plan doc table and cadence line.`);
  }
}
if (doCheck) { console.log(failed ? '\nmodel:power --check: DRIFT' : '\nmodel:power --check: all printed plan-doc tables reproduced'); process.exit(failed ? 1 : 0); }
