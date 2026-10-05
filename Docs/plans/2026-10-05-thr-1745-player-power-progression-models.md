> **title:** `Player power progression over a run — three competing economy models — THR-1745`
> **linear_issue:** THR-1745
> **author:** `Claude Code (Fable design session, live chat with Christian, 2026-10-05)`
> **created:** 2026-10-05
> **three_pillars:** Engine `done — per model, as a sketch of what each model extends` · Content `done — only the content each model needs to plug a measured gap` · UI `done — what the player must be able to read for growth to be felt; no new surfaces`

# Player power progression over a run — three competing economy models — THR-1745

*A god that starts at Stone 3 / Heart 3 should end a run with more income, more threads, more places, more cards and more reach than it began with; measured against the engine as it stands today, it does not, and this doc says why and offers three ways to make it so.*

## Why this is load-bearing

Christian asked (chat, 2026-10-05) for a rough, mathematical roadmap of how a basic starting god builds an economy across one run: the average number of ticks between growth in sphere scores, in god skills that unlock economically important powers, and in threaded agents (what they cost to start, what they cost to keep, what they return). He wants the late game to feel like a god grown in power: more unlocks, more income, more threaded mortals, places and items. He asked for up to three competing models and for the holes in the current design that stop power from scaling.

This doc does four things. It records the engine's economy constants as they are today (every number cited to its file). It runs one scripted player through one 90-day doom window under the current rules and shows, with numbers, where growth stalls. It names ten holes. It then runs the same player through three candidate economies, each built from systems that already exist plus the smallest content needed to plug a measured gap, and tabulates ticks-between-growth for each.

The model script is deterministic and lives beside this doc in the session scratchpad; the formulas it uses are reproduced below so an executor can re-run them without it. Where the model makes an assumption that the engine does not fix (how often the player acts, how many sources are within reach), the assumption is stated as a tunable.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Essence & Divine Economy | 🟢 ACTIVE | extends — every model keeps the pool, the per-sphere split, the seat, the typed-source term and the control-effect income term; changes are constants and grant wiring |
| Ascendant Beats & Progression | 🟢 ACTIVE | extends — milestone beats stay the one dispenser of cards; the Wellspring moves from the cadence lottery to a milestone; pool beats retire once their card is held |
| Reputation & Influence (thread tiers, maintenance, promotion) | 🟢 ACTIVE | extends — tier ladder, promotion ticks and Aspect kept; maintenance retuned in every model; Model B adds a per-tier yield |
| Strategic Projects & Control (control effects, upkeep) | 🟢 ACTIVE | activates — the four orphaned income controls get a grant path; the declared source upkeep gets a consumer |
| Spheres & Quintessence (sphere scores, pressure, attunement) | 🟠 DORMANT on the god | activates (Model C) — the god's own `sphereAffinity` score already exists and already scales signatures; Model C gives it writers |
| Mandate | 🟢 ACTIVE | unchanged — the only writer of the god's sphere score today; kept as one of several in Model C |
| Rival Gods & Schemes | 🟢 ACTIVE | unchanged — escalation already reads the god's highest thread tier, so every model that makes threads worth keeping also hardens rivals |

Runtime counts (seed 42, medium, headless, 240 ticks): 509 agents at start (786 by tick 240), 1005 locations, 6 latent essence sources seeded (three typed Energy, one each Matter and Time, one more Energy), 0 thread edges in the CLI world, 1 Aspect-capable thread in the seeded browser world (The First).

## The starting god used throughout

"The Shepherd": reaches **Stone 3 / Heart 3**, spheres **Life primary / Spirit secondary** (the hunger-catalog cell that carries Heart and Stone, `src/data/hunger-catalog.ts`). Sphere scores Life 2 / Spirit 1 (`ARCHETYPE_SPHERE_BONUS_PRIMARY` / `_SECONDARY`, `src/types/sphereAffinity.ts`). Pool 50 in every sphere (`INITIAL_ESSENCE_PER_SPHERE`, `src/engine/influence.ts`). The First bonded at tick 0.

One run = the default doom window, **1,080 ticks = 90 in-world days at 12 ticks a day** (`DEFAULT_DOOM_TICKS`, `src/data/game-config.ts`; its comment says "three in-world years", which is wrong at 12 ticks a day — hole H10). Phases used in every table: **Opening** days 0–4 (ticks 0–48, the spine), **Early** days 4–20, **Mid** days 20–50, **Late** days 50–90.

## The engine as it stands (ground truth, 2026-10-05)

### Income (`src/engine/influence.ts` `computeEssenceGeneration`, constants in `src/data/influence-content.ts`)

| Term | Per tick | Where it comes from |
|---|---|---|
| Base | 1.0 | always |
| Home seat | +1.0 | spine Beat 1 (tick ~14) |
| Each thread (agent **or** location) | +0.1 | `bind_thread_agent` / `bind_thread_location` |
| Each untyped place of power controlled | +0.5 | none reachable today (see H3) |
| Each living Aspect | +0.3 | tier 4 thread held 60 more paid ticks |
| Typed source (find → claim → consecrate) | 0.5 × 2 if flowering × 0.8^rank within the sphere | the Wellspring verbs |
| Tap the Source / Claim Resource | +0.8 / +0.5 against 0.2 upkeep | **orphaned** — no beat grants them (H3) |
| Patronage Network | +0.15 | Gold signature only |

The total of the alignment-distributed terms is split **35% primary / 25% secondary / 4% to each of the ten other spheres**. Typed-source and control-effect income land in their own sphere. Each sphere caps at **50 + 5 per thread**; income above the cap is lost, and the essence-earned counter that drives attunement banks only what actually lands.

Consequence worth stating plainly: an off-sphere pool refills at 0.04 a tick, so a Life god's Order or Mind essence is a **one-shot budget of 50 per run** (1,250 ticks to refill from empty). Whether that is identity or a hole is Christian's call (H8).

### Upkeep (`TIER_MAINTENANCE`, `TIER_PROMOTION_THRESHOLDS`, `src/data/influence-content.ts`)

| Thread tier | Upkeep per tick (primary sphere) | Paid ticks to reach it |
|---|---|---|
| 1 Touched | 0.5 | 0 (on binding) |
| 2 Devoted | 1.0 | 30 |
| 3 Champion | 2.0 | 90 |
| 4 Aspect-eligible | 4.0 | 180 (+60 to become an Aspect) |

Promotion counts only ticks on which upkeep was paid. Unpaid upkeep lapses the thread's "current" flag but never drops the thread. Location threads climb the same ladder and pay the same upkeep. Source upkeep `SOURCE_CONTROL_SUSTAIN` (0.15) is declared in `src/data/essence-sources.ts` and **has no consumer** — holding a source is free (H4).

### Costs the model uses (`src/data/unified-action-templates.ts` unless noted)

Bind a mortal 10 (primary; a card with no sphere affinity is paid from the primary sphere, `src/engine/targetActions.ts`) · bind a place 15 · find source 3 · claim 5 · consecrate 5 · sanctify 3 (+0.15 sanctity; flowering at 0.6, so four casts = 12 essence per source) · defend 4 · the six economic verbs 3–5 · a reach signature 8 × sphere multiplier (floored at 1×) · nudge cards 1–3 · soul interventions 1–4 · faction verbs 6–18.

### Unlocks (`src/data/ascendant-beat-content.ts`, `ascendant-milestone-beats.ts`, `player-progression.ts`)

- **Spine, ticks 0–~40:** bind thread + observe (Beat 0), bind place + the seat (Beat 1), imbue + a threaded artifact (Beat 2), persuade (Beat 3), dream / omen / inspire + the **primary reach signature** (Beat 4). Gated on one player act between gifts, with a 36-tick idle fallback.
- **Cadence pool, every 9 ± 2 ticks after the spine:** a weighted draw over 6 introduction beats (weight 3), 10 investment beats (weight 4), 2 selection beats (weight 1), the secondary-signature beat (weight 4) and the still-undelivered delivery beats (weight 2). **"The Wellspring"**, the one beat that grants the five source verbs, has weight 4 of roughly 76: expected arrival after ~19 draws, **about tick 170**, with a quarter of runs waiting past tick 250. Beats never retire once their card is held (`unthreaded_target` is true while any unthreaded actor or location exists — always), so later draws re-offer cards the god already holds (H2).
- **Milestones:** 3 controlled sources or the first flowering source → the six economic verbs (`loc.open_markets`, bless/blight, reveal vein, guide caravan, sour mine); 2 living threads → Draw Together; first company → Bless this Company; first disbanded company → Reunite + Sunder; first Broken thread → Rekindle.
- **Attunement:** 20 and 60 essence *earned* through a sphere → one repertoire card each (`SPHERE_ATTUNEMENT_THRESHOLDS`, `src/data/nudge-constants.ts`). Two marks, then nothing.

### Depth and sphere score

- **Reach depth** (`src/engine/phaseAscendantProgression.ts`): each resolved in-domain player action adds `0.4 × difficultyScale × max(1 − 0.7 × capability, 0.1)` practice (× 0.7 in the secondary reach); the pre-refit sigmoid (midpoint 10, k 0.4) turns practice into a 1–10 tier; each tier crossing fires a Deepening beat that **grants nothing**, and **no card in the game is tier-gated** (`getTargetActionSlots` has an unlock gate and a reach gate, no tier gate). Depth moves cast odds a little (`ascendantCastRawBonus`, `src/data/player-cast-constants.ts`) and nothing else (H6).
- **Sphere score** (`src/types/sphereAffinity.ts`, `src/engine/phaseMandate.ts`): the god's own `sphereAffinity.scores` starts Life 2 / Spirit 1, levels by triangle cost (level n costs n progress), and today has **one writer**: mandate pressure, +2 at each of two stage advances and +5 at completion. Nine progress across a whole run lifts Life from 2 to 4. `spherePowerMultiplier` (`src/engine/sphereScaling.ts`) maps score 0→0.6×, 10→2.0×: the Great Work and every other signature fire at 0.88× at the start and never better than 1.16× (H5).

## Model 0 — the run as the engine plays it today

The scripted player (identical for every model, all parameters tunable): acts once every 6 ticks; spends 5 essence on nudge cards every 24 ticks (The First's chapter cadence, THR-1715); binds a new mortal on days 0, 5, 12.5, 25, 42, 60 when it can afford the binding and keep the upkeep; runs the source loop one step every 36 ticks once it holds the verbs; otherwise spends 4 essence on whatever verb it holds. Four latent sources are assumed within find range of the god's ground.

| Day | Income / tick | Primary income | Thread upkeep | Primary pool | Threads (max tier) | Sources (flowering) | Cards held | Life score |
|---|---|---|---|---|---|---|---|---|
| 10 | 2.1 | 0.73 | 1.0 | **0** | 1 (2) | 0 | 10 | 2 |
| 20 | 2.6 | 1.23 | 2.0 | **0** | 1 (3) | 1 (0) | 16 | 2 |
| 30 | 3.3 | 1.96 | 2.0 | **0** | 1 (3) | 3 (0) | 22 | 2 |
| 45 | 3.9 | 2.32 | 4.0 | **0** | 1 (4, Aspect) | 4 (0) | 22 | 2 |
| 60 | 4.4 | 2.82 | 4.0 | 1 | 1 (4) | 4 (1) | 23 | 3 |
| 90 | 5.4 | 3.79 | 4.0 | 0 | 1 (4) | 4 (4) | 23 | 4 |

Ticks between growth events: a new card every ~94 ticks (front-loaded; nothing new after day 56) · a thread tier every ~134 · a source event every ~119 (first at tick 206) · a sphere level every 300 · a depth tier every ~124.

What the table says in game terms. **The god's own sphere is empty from day 3 to the end of the run.** One thread at Devoted costs 1.0 a tick against a primary income of 0.7; at Champion it costs 2.0, at the top 4.0. Every Life card (Bless the Harvest, Seed Life, Cultivate) is unaffordable for the whole run, a second thread is never affordable, and the Aspect arrives on day 45 only because unpaid ticks are simply not counted. The other eleven spheres sit at their cap, unspent, because the cards that would spend them are mostly not held. Income does grow (2.1 → 5.4 a tick) but none of it reaches the player's hand: upkeep takes the primary sphere and the cap throws the rest away. The player can read growth in prose (Deepening beats, tier words) and feel none of it.

A headless check of the headline claim is recorded under *Verification* at the end of this doc.

## The holes

| # | Hole | Evidence | Who can decide |
|---|---|---|---|
| H1 | A thread costs 5–40× what it returns; one Devoted thread pins the primary pool at zero | `TIER_MAINTENANCE` 0.5/1/2/4 vs `ESSENCE_PER_THREAD` 0.1, primary share 0.35 of ~2.0 | agent (balance) — retune is in every model below |
| H2 | The economy's engine is a lottery: the Wellspring arrives at an expected tick 170 with a long tail, and held cards keep being re-offered | pool weights in `ascendant-beat-content.ts`; `isBeatEligible` never retires an investment beat | agent (it contradicts THR-647's own no-fake-reveal rule) |
| H3 | Four income verbs are unreachable: `hex.tap_source`, `hex.claim_resource`, `hex.claim_dominion`, `loc.place_of_power` | no `grantsActionIds` names them; the floor is empty (THR-501) | agent — grant them from a milestone |
| H4 | Source upkeep is never charged, so breadth is free and nothing ever asks the player to choose | `SOURCE_CONTROL_SUSTAIN` has no consumer | agent |
| H5 | The god's sphere score has one writer (the mandate) and tops out at 4 of 10; signatures never scale past ~1.2× | `phaseMandate.ts` is the only `targetEntityId: ascendantId` pressure | Christian — Model C makes it the spine; A and B leave it as mandate reward |
| H6 | Depth has no consumer: no tier-gated card exists, Deepening beats grant nothing, the curve saturates after ~60 in-domain casts | `getTargetActionSlots` filter list; `ascendant-deepening-beats.ts` | Christian — keep as prose only, or key cards to it (Models A and B use it) |
| H7 | No sink grows with the god: costs are flat 3–15 while any fixed model pushes income past 10 a tick by mid-run; no control-slot cap (THR-936 record) | this doc's Model B/C tables | agent — each model names its sink |
| H8 | Off-sphere essence is a one-shot 50 per run (0.04 a tick refill) | `distributeByAlignment` 0.40/10 | **Christian** — identity statement or hole |
| H9 | Worship is undesigned; `shrine`, `faithfulCommunity`, `relic`, `rite` source kinds exist in data with no writer | `BASE_SOURCE_INCOME`; THR-870 text | Christian — Model B gives them writers |
| H10 | Timing comments drift: 1,080 ticks is 90 days, not three years; promotion-threshold comments assume one tick per day | `game-config.ts`, `influence-content.ts` | agent — docs fix |

## Shared prerequisites (every model needs these; none is a creative fork)

1. **Thread upkeep retuned so a thread is keepable on the seat and base income**: 0.1 / 0.2 / 0.35 / 0.5 per tier (`TIER_MAINTENANCE`). The ladder, the promotion ticks and the Aspect stay as they are. Rivals still escalate off the highest tier, so deeper threads still cost in a second currency.
2. **The Wellspring becomes a milestone, not a lottery**: four days after the bond (tick 48), the same moment the rivals wake (`RIVAL_GRACE_TICKS_AFTER_BOND`). Investment beats retire once every card they grant is held, which also ends the fake re-reveal.
3. **Source upkeep charged**: give `SOURCE_CONTROL_SUSTAIN` its consumer in `phaseEssenceSources`, debited from the primary sphere like thread upkeep. Holding ground costs a little; flowering ground pays for itself four times over.
4. **The four orphaned income verbs get a grant path** (a milestone, chosen per model below).
5. **Docs fix for H10.**

With only these five in place the as-is run already changes shape: the primary pool stops being pinned, a second and third thread become affordable by day 10, and the source loop starts on day 7 instead of day 17. The three models differ in **what the player grows next**.

## Model A — Holdings: the god grows by holding ground

**Thesis, in game terms.** Your power is where you have made the world holy. Threads are attention, not income (they stay a cost on purpose: *attention is a spend, not a browse*). Growth comes from finding, claiming and tending places: each flowering source is a permanent income stream in its own sphere, and holding enough of them is what widens your hand.

**What is reused.** The whole THR-611 source loop, the typed per-sphere income term with its diminishing returns, the flowering tier, the essence bridge (a rich valley nurtures a source, only the god's hand makes it flower), rival profane schemes against sources, the source milestone beat.

**New content, only where measured.** (a) Latent sources seeded per threaded Area rather than six per map, so a god who follows mortals into new ground finds new ground to hold: `LATENT_SOURCE_SEED_COUNT` becomes a per-Area quota (two) — content constant, no new node kind. (b) Two more source milestones (3 and 6 flowering) that grant the orphaned income controls and the remaining `loc.*` orphans (`loc.ward`, `loc.fortify`, `loc.sanctify_square`): real cards nobody can reach today. (c) Nothing else.

**The sink.** Source upkeep (0.15 each) plus the rival profane arc, which already drains contested sources at 0.02 sanctity a tick. Six flowering sources cost 0.9 a tick to hold and yield 3.3; the player's choice is which to defend.

| Day | Income / tick | Primary net after upkeep | Threads (Aspects) | Sources (flowering) | Cards held | Stone depth |
|---|---|---|---|---|---|---|
| 10 | 2.7 | 0.7 | 2 (0) | 1 (0) | 15 | 1 |
| 20 | 2.7 | 0.4 | 2 (0) | 1 (0) | 16 | 1 |
| 30 | 3.6 | 1.0 | 2 (0) | 2 (1) | 22 | 1 |
| 45 | 5.2 | 1.0 | 5 (2) | 3 (2) | 23 | 3 |
| 60 | 5.5 | 0.9 | 5 (2) | 3 (3) | 27 | 7 |
| 90 | 7.3 | 0.8 | 6 (5) | 5 (4) | 27 | 10 |

Cadence: a card every ~82 ticks · a thread event every ~36 · a source event every ~110 · a sphere level every 300 (mandate only) · a depth tier every ~56.

**Reading.** Steady, legible, place-shaped. The scripted player binds threads before it tends ground (priority is a tunable), so sources lag; a player who plays it as intended flowers a source every ~150 ticks (four sanctify casts at the 36-tick action cadence). The ceiling is the map: income tops out near 7–8 a tick on a medium map. Late game does not accelerate; it consolidates.

**Kill path.** If sources are few and far from the god's mortals, the loop is a chore with a small payoff. Mitigation is (a) above: ground follows the player's people.

## Model B — Threads: the god grows through the people it keeps

**Thesis, in game terms.** You are what your mortals make of you. A thread is an investment that pays back as the mortal rises: a Devoted mortal is a trickle, a Champion raises you a shrine, an Aspect leaves a relic. The run's income curve is the biography of your retinue.

**What is reused.** The thread ladder and its promotion ticks; the Aspect; the `shrine` / `relic` source kinds already in `BASE_SOURCE_INCOME` (0.4 and 0.6) with their own sphere routing and diminishing returns; faction chosen-powers and `anoint`; the milestone-beat dispenser; the rival escalation tier that already reads the highest thread tier.

**New content, only where measured.** (a) A per-tier thread yield replacing the flat 0.1: 0.15 / 0.30 / 0.45 / 0.60 (`ESSENCE_PER_THREAD` becomes a per-tier table). (b) Two source writers: on reaching Champion a threaded mortal's home settlement gains a `shrine` source consecrated to the god's primary sphere, already flowering; on apotheosis the Aspect's relic becomes a `relic` source. Both are `essenceSource` bags on existing hosts — the same shape the Wellspring writes, no new node or edge. (c) Thread-tier milestones that grant cards: first Devoted → two soul verbs already behind `minTier` 2 (deceive, intimidate), first Champion → the orphaned `hex.claim_dominion` + `loc.place_of_power` + `hex.claim_resource`, first Aspect → `hex.tap_source` and the secondary signature. These are the orphans and the minTier-gated interventions, not new cards.

**The sink.** Thread upkeep, which scales with the retinue (six threads at the top tier cost 3 a tick), plus rival escalation: `computeRivalEscalationTier` already hardens rivals off the highest tier, so a deep retinue is a louder target. No new system.

| Day | Income / tick | Primary net after upkeep | Threads (Aspects) | Sources (flowering) | Cards held | Heart depth |
|---|---|---|---|---|---|---|
| 10 | 3.1 | 0.9 | 2 (0) | 2 (1) | 26 | 1 |
| 20 | 5.4 | 1.9 | 3 (0) | 3 (3) | 27 | 3 |
| 30 | 6.6 | 2.0 | 4 (0) | 6 (5) | 30 | 6 |
| 45 | 10.1 | 3.1 | 5 (3) | 10 (9) | 31 | 8 |
| 60 | 11.2 | 3.1 | 5 (4) | 12 (12) | 31 | 9 |
| 90 | 12.5 | 2.6 | 6 (5) | 16 (16) | 31 | 10 |

Cadence: a card every ~47 ticks (all by day 40) · a thread event every ~37 · a source event every ~52 · a sphere level every 300 (mandate only) · a depth tier every ~77.

**Reading.** The steepest curve and the one most tied to the North Star: income rises because *people you followed* rose, and every shrine on the map is a name you know. It front-loads cards (nothing new after day 40 — the sink must carry the late game) and it compounds hard: by day 45 the god earns five times its opening income. **Diminishing returns on same-sphere sources** (0.8 per rank) and the upkeep retune are what keep day 90 at 12.5 and not 25.

**Kill path.** Rich-get-richer on the retinue: the god with six Champions never loses. Two existing brakes: rival escalation off the top tier, and Broken (a worn mortal stops producing). A third, cheap one if needed: a shrine withers to dormant when its mortal dies or leaves (the essence bridge already moves sanctity both ways).

## Model C — Spheres: the god grows by drawing power through its spheres

**Thesis, in game terms.** You are an avatar of the Spheres; what you spend through a sphere attunes you to it, and attunement is power. This is the parked THR-870 direction (Christian's 2026-07-30 verdict: *the god is sphere-governed*), scoped here to the economy only: no re-keying of gates, no reach demotion, no trial authoring beyond what the omen and mandate systems already emit.

**What is reused.** The god's own `sphereAffinity` score and the triangle levelling that already exist; the essence-earned counter and attunement marks (THR-1180); `spherePowerMultiplier`, which already scales every signature; mandate pressure; omens (`sphere_surge`) as the trial detector the decision record names.

**New content, only where measured.** (a) Attunement marks extended from [20, 60] to [20, 60, 150, 300, 600] on the primary sphere's earned counter, each mark one repertoire card **and** +1 progress toward the next sphere level — a second writer for the score. (b) **Clash trials**: every ~120 ticks an opposed-sphere omen offers a trial; answering it costs 6 secondary essence and adds +2 progress — reuses the omen emitter and the mandate's pressure path. (c) Income scaled by the primary sphere score: × (1 + 0.1 × score), so score 2 is 1.2× and score 10 is 2.0×. (d) Cards keyed to sphere score (3 / 5 / 7) rather than to depth: the orphans and the economic verbs land here. Note the bridge already in the rulebook: *you start at the essence ceiling, so nothing is earned until you spend* — the pool cap makes spending the only way to earn, which is the loop's deliberate brake.

**The sink.** The trials themselves (secondary essence) and the cap: earning only counts what lands, so a hoarding god attunes to nothing. Opposite-sphere cards could cost +1 (the `SPHERE_OPPOSITES` table exists) if the loop runs hot.

| Day | Income / tick | Primary net after upkeep | Threads (Aspects) | Sources (flowering) | Cards held | Life score |
|---|---|---|---|---|---|---|
| 10 | 3.2 | 1.0 | 2 (0) | 1 (0) | 19 | 3 |
| 20 | 4.3 | 1.3 | 3 (0) | 1 (1) | 28 | 4 |
| 30 | 5.3 | 1.4 | 4 (0) | 2 (1) | 33 | 5 |
| 45 | 8.3 | 2.5 | 5 (3) | 3 (2) | 34 | 5 |
| 60 | 9.8 | 3.2 | 5 (4) | 3 (3) | 34 | 6 |
| 90 | 12.0 | 3.9 | 6 (5) | 4 (4) | 39 | 7 |

Cadence: a card every ~46 ticks across the whole run · a thread event every ~37 · a source event every ~114 · **a sphere level every ~195 ticks (five in a run)** · a depth tier every ~75.

**Reading.** The only model whose growth is spread evenly across the run (cards keep arriving to day 90) and the only one that answers "sphere scores" directly. It is also the only one that steps toward a parked direction; if Christian wants THR-870 to stay parked, this model is the one to drop.

**Kill path.** The decision record's own warning: *rich-get-richer on the sphere fuel + gate + growth loop*. Measured here it is bounded (2.0× at a score no run reaches; 1.7× at day 90) because the cap forces spending and the trials cost the other sphere.

## The three side by side

| | Model 0 (today) | A — Holdings | B — Threads | C — Spheres |
|---|---|---|---|---|
| Income at day 10 / 45 / 90 | 2.1 / 3.9 / 5.4 | 2.7 / 5.2 / 7.3 | 3.1 / 10.1 / 12.5 | 3.2 / 8.3 / 12.0 |
| Primary essence free to spend, per day, mid-run | **below zero** | ~12 | ~37 | ~30 |
| Cards held at day 90 (10 at the opening) | 23 | 27 | 31 | 39 |
| Last new card arrives | day 56 | day 56 | day 40 | day 90 |
| Threads kept (Aspects) | 1 (1) | 6 (5) | 6 (5) | 6 (5) |
| Flowering sources | 4 | 4 | 16 | 4 |
| Sphere score at day 90 | 4 | 4 | 4 | 7 |
| Ticks between growth events (all kinds) | ~130 | ~60 | ~45 | ~55 |
| Where the late game comes from | nowhere | defending ground | the retinue's rise | attunement + trials |
| Touches a parked direction | — | no | no | THR-870 (economy only) |

**My recommendation, offered for veto:** ship the five shared prerequisites now (they are balance and wiring, not direction), and commit to **Model B as the spine with Model A's per-Area sources as its ground layer**. B is the one where growth is *the story of named people*, which is what the North Star asks a good run to be; A keeps the land legible and gives the Shepherd's Stone half something to do. Model C waits on the THR-870 decision and is written so it can be laid on top later without undoing B, because its writers (attunement, trials) do not touch threads or sources.

## Engine pillar

Engine: per model, as a sketch. All three share the same seams, which is why they can be built one after another without rework.

### Systems design

- **Shared:** `TIER_MAINTENANCE` retune; `phaseEssenceSources` debits `SOURCE_CONTROL_SUSTAIN × controlled sources` from the primary sphere; the Wellspring moves from `ASCENDANT_BEAT_POOL` to a milestone enqueued by `phaseAscendantProgression` at bond + 48 ticks; `isBeatEligible` gains an `all_grants_held` retirement check.
- **A:** `seedLatentEssenceSources` takes a per-Area quota; two milestone beats keyed to flowering counts 3 and 6.
- **B:** `computeEssenceGeneration` reads a per-tier yield table; `checkTierPromotion` (or the phase that calls it) writes a `shrine` bag onto the promoted mortal's home location at tier 3 and a `relic` bag onto the Aspect's artifact; three tier milestone beats.
- **C:** `attunementThresholdsCrossed` pushes a `SpherePressureEvent` at the ascendant; a trial emitter rides the omen phase; `computeEssenceGeneration` multiplies by `1 + SPHERE_INCOME_SLOPE × score`; `getTargetActionSlots` gains a sphere-score gate (the one new filter).

### Graph nodes / edges

None new in any model. Sources stay `essenceSource` property bags on existing location / artifact hosts; threads stay `thread` edges; the god's score stays `sphereAffinity` on its node.

### Tick phases

No new phases. Shared and A ride `essence_sources` and `ascendant_progression`; B rides `influence_maintenance`; C rides `ascendant_progression`, the omen phase and `essence`.

### Resolution logic

Unchanged. No model touches the outcome ladder, the nudge hand or cast odds.

### PRNG callouts

None. Every writer here is deterministic (counts, ticks, thresholds). The trial *offer* in C would use the omen phase's existing seeded stream.

## Content pillar

Content: only what plugs a measured gap, per model.

### Encounter templates

None new. B's tier milestones and C's trials present through the existing milestone-beat modal; a trial that wants a scene can reuse the Beast-in-its-den shape later, out of scope here.

### Prose tables

One milestone presentation per new milestone beat (A: two, B: three, C: none — attunement already has its prose). Plain register (THR-609); no numbers.

### Attachment content

None. B's relic source is the Aspect's existing artifact gaining a bag.

### Data tables

Constants below. A's per-Area source quota is one constant; B's yield table and source-kind writers are data; C's mark list and gate thresholds are data.

## UI pillar

*Screenshot tool: Playwright (the essence bar, the Covenants block and the ascendant bar are DOM).*

UI: no new surface in any model; three existing readouts must say the truth for growth to be felt.

### Player-facing display

The essence bar already shows the pool; it must also show **net income per sphere in words** (rising / steady / draining), because every hole above was invisible on screen. The Covenants block already lists sustained holds; sources join it with their upkeep line once H4 is fixed. The ascendant bar's Reaches readout stays; C adds the sphere score as a word under the sphere chips.

### Event notifications

Milestone beats already open a modal and write the Chronicle. B's shrine and relic births are Chronicle moments ("{name}'s people have raised you a shrine at {place}").

### Debug inspection (DebugPanel)

The Essence Sources tab already lists every source; add the per-tier upkeep and the yield table to the Progression tab readout so a balance pass can read the ledger without the browser.

### Visual presence (HexMapV2)

None new. Sources already have a signifier path reserved (THR-611 remaining slices).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `phaseEssenceSources` (source upkeep) | `essence_sources` | `CovenantsBlock` | `essencePool` | `source_upkeep` | Essence Sources tab |
| `phaseAscendantProgression` (Wellspring milestone, retirement) | `ascendant_progression` | `AscendantBeatModal` | `ascendantBeats` | `ascendant.beat.offered` | `__DEBUG.beatSchedule()` |
| `computeEssenceGeneration` (per-tier yield / sphere multiplier) | `essence` | `EssencePanel` | `essencePool` | `essence_gain` event | `__DEBUG.getEssenceSources()` |
| `checkTierPromotion` writers (B) | `influence_maintenance` | Chronicle | graph property bags | `thread_promotion` | Essence Sources tab |
| `attunementThresholdsCrossed` (C) | `ascendant_progression` | ascendant bar | `essenceEarned` | `sphere_pressure` | Progression tab |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `TIER_MAINTENANCE` | 0.5 / 1 / 2 / 4 → **0.1 / 0.2 / 0.35 / 0.5** | thread upkeep per tier (shared) |
| `WELLSPRING_MILESTONE_TICKS_AFTER_BOND` | **48** | when the source verbs arrive (shared) |
| `SOURCE_CONTROL_SUSTAIN` | 0.15 (now charged) | upkeep per controlled source (shared) |
| `LATENT_SOURCES_PER_AREA` | **2** | A: ground follows the player's people |
| `SOURCE_MILESTONE_FLOWERING` | **[1, 3, 6]** | A: flowering counts that grant cards |
| `ESSENCE_PER_THREAD_BY_TIER` | **0.15 / 0.30 / 0.45 / 0.60** | B: thread yield per tier |
| `CHAMPION_SHRINE_BASE` / `ASPECT_RELIC_BASE` | 0.4 / 0.6 (existing `BASE_SOURCE_INCOME`) | B: what a rising mortal mints |
| `THREAD_TIER_MILESTONES` | **{2, 3, 4}** | B: tiers that grant cards |
| `SPHERE_ATTUNEMENT_THRESHOLDS` | [20, 60] → **[20, 60, 150, 300, 600]** | C: marks on essence earned |
| `ATTUNEMENT_SPHERE_PROGRESS` | **1** | C: progress per mark |
| `CLASH_TRIAL_EVERY_TICKS` / `_COST` / `_PROGRESS` | **120 / 6 / 2** | C: trial cadence, price, reward |
| `SPHERE_INCOME_SLOPE` | **0.1** | C: income × (1 + slope × score) |
| `SPHERE_CARD_GATES` | **{3, 5, 7}** | C: scores that widen the hand |
| `PLAYER_ACT_EVERY` / `STORY_SPEND_EVERY` | 6 / 24 ticks | model assumptions, not engine constants |

## Tracing

```ts
// SourceUpkeepTrace — emitted once per tick when at least one source is held (shared)
interface SourceUpkeepTrace {
  type: 'source_upkeep';
  sources: number; charged: number; sphere: SphereName; paid: boolean;
}
// ThreadYieldTrace — emitted per tick per thread in Model B
interface ThreadYieldTrace {
  type: 'thread_yield';
  threadId: string; tier: InfluenceTier; yield: number; upkeep: number;
}
// SphereAttunementPressureTrace — Model C, when a mark pushes the god's score
interface SphereAttunementPressureTrace {
  type: 'sphere_pressure';   // existing category; source: 'attunement' | 'trial'
  sphere: SphereName; magnitude: number; scoreAfter: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Source upkeep exceeds the primary pool | charge what is there, mark the source `contested: false, sustained: false`, never lapse it in one tick (mirror thread upkeep) |
| A Champion's home location cannot be resolved (B) | skip the shrine, log `shrine_host_unresolved`, retry on the next promotion check |
| The Aspect's artifact is destroyed (B) | relic bag dies with its host; income term simply drops out |
| Essence-earned counter absent on an old save (C) | treat as 0; marks start counting from load |
| Sphere score at `MAX_SPHERE_SCORE` (C) | pressure is dropped, trace says `at_cap` |

## Three-pillar check

- [x] Engine pillar present (or N/A with rationale)
- [x] Content pillar present (or N/A with rationale)
- [x] UI pillar present (or N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — Model B is the closest to the North Star ("a story the player can tell in prose": income is the biography of named people); Model A keeps "attention is a spend"; Model C stays inside the economy and does not pre-empt the THR-870 pivot
- [ ] If it does, the Vision edit is part of this ticket's scope

## Rulebook impact

- [ ] This plan does not change a rule of play
- [x] If it does, `Docs/canon/rulebook.md` is updated in the same PR — **not in this PR**: this is an analysis with a creative fork pending; the chosen model's executor ticket updates §6 (Your Resources) and §4 (How your power grows) and the quick reference

> Brainstorm companion: not written — the brainstorm was the live chat; the verdicts are recorded on THR-1745.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every number in every model is a named constant in the table above; the model's player assumptions are named as such |
| 2. Inspectability | PASS | three trace shapes named; every income term already lands in `computeEssenceIncome` for the bar |
| 3. Determinism | PASS | no new PRNG; the model itself is deterministic |
| 4. Fail-soft | PASS | table above; nothing lapses a hold in one tick |
| 5. Narrative over mechanical perfection | PASS with note | Model B is chosen for its story; its compounding is bounded by rules that are themselves story (rivals notice, mortals break) |
| 6. Additive over destructive | PASS | retunes and new writers only; no field, kind or edge removed |
| 7. Performance budget | N/A | all writers are O(threads + sources) per tick, already the shape of today's phases |

## Done when

This ticket is an analysis; it is done when Christian has picked a model (or a blend) in chat and the pick is recorded on THR-1745. The executor tickets that follow carry their own Done-whens. For this doc:

- [x] The current engine's economy is recorded with every constant cited to its file
- [x] One scripted run under current rules is tabulated and the stall is explained in game terms
- [x] Ten holes are listed with evidence and an owner (agent or Christian)
- [x] Three models are tabulated with ticks-between-growth for sphere score, cards, threads, sources and depth
- [ ] Christian's pick recorded as a comment on THR-1745 (`human gate satisfied via chat review <date>`)
- [ ] `npm test` and `npx vite build` pass; types verified via `tsc -b --force` net-new diff (not `tsc --noEmit` — no-op here, THR-686) — docs-only diff, owes `check:generated-freshness`, `lint:plan-doc`, `check:impediment-ids`
- [ ] Closing commit body includes `Fixes THR-1745`
- [ ] Browser-verify exempt: docs-only analysis, no UI change

## Coordination block

**Suggested model:** `opus` — the follow-on executor tickets are balance + wiring across four engine files; the analysis itself needs no executor.

**Parallel-safe with:** THR-870 — this doc reads the decision record and changes nothing it owns; THR-647 — the portfolio card it wants is one of A's milestone grants, not a conflict.

**Mutex with:** none for this doc. The shared-prerequisite executor ticket, once filed, is mutex with anything editing `src/data/influence-content.ts`, `src/engine/phaseEssenceSources.ts` or `src/engine/ascendantBeat.ts`.

**Files to touch:**
- Create: `Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md` (this doc)
- Edit: `Docs/plans/INDEX.md` (regenerated)

## Notes for the executor

- There is no executor for this doc. When Christian picks, file: (1) one `shared prerequisites` ticket (five items above, balance + wiring, no creative content); (2) one ticket per chosen model, three-pillar, with the constants table copied in and the tables above as its measured target.
- Do not grant an already-held card from any new milestone (THR-647's rule). The orphan list to draw from: `hex.tap_source`, `hex.claim_resource`, `hex.claim_dominion`, `loc.place_of_power`, `loc.ward`, `loc.fortify`, `loc.sanctify_square`.
- Measure, do not eyeball: the balance verdict on any retune is a 1,080-tick headless run with a scripted player, not a 120-tick inventory sweep. The scratchpad model is the recipe; port it to `scripts/` as a measured gate only if the retune ticket wants it.
- Do not touch the dice: none of the three models changes the outcome ladder, scale floors or the nudge hand.

## Interface impact

Cross-system reads and writes this analysis touches, by `Docs/canon/interface-map.md` row: `essence-income` (read by the essence bar, written by `phaseEssence`, `phaseEssenceSources`, `phaseControlEffects`) — every model changes the writers' constants, none changes the read shape; `thread-maintenance` (`phaseInfluenceMaintenance` → `essencePool`) — retuned in every model, Model B adds a yield write back into the same pool; `ascendant-beat-grants` (`resolvePendingBeat` → `unlockedActionIds`) — new milestone beats use the existing grant path; `sphere-pressure` (`phaseMandate` → `pendingSpherePressures` → `phaseSpherePressure`) — Model C adds two emitters onto the existing queue. No row changes its contract; the executor tickets update `scripts/interface-contracts.ts` only if a new emitter is added (Model C).

## Forked-audit verdicts

<!-- populated by design-audit-pipeline — /design-audit <plan-doc-path> -->
<!-- Not run: this doc is an analysis with a creative fork pending; the audit runs on the executor plan(s) that follow the pick. -->

### NFP audit

Not run — see above.

### Three-pillar audit

Not run — see above.

### Vision audit

Not run — see above.

## Verification

Headless CLI (`npm run cli -- --seed 42 --map medium`), 2026-10-05:

- **Baseline, no player action, 240 ticks:** every sphere sits at the 50 cap for the whole window; income is thrown away above the cap; six latent sources seeded, none discovered; no thread edges in the CLI world.
- **One thread bound at tick 0 (tier 1, 'watched'), then 240 ticks:** see the appended result block below.

```
seed 42, medium, one thread edge added at tick 0 (tier 1, courtPosition 'watched'); the god's primary sphere is chaos on this seed
tick  60: chaos 28.1 (every other sphere 52.6–55.0)   thread tier 2, 30 paid ticks, upkeep current
tick 240: chaos  1.4 (every other sphere 55.0)        thread tier 3, 18 paid ticks, upkeep FAILING
```

One thread, no casts at all, and the god's own sphere is empty by day 20 while the eleven others sit at their cap. That is hole H1 in the live engine, not in the model.
