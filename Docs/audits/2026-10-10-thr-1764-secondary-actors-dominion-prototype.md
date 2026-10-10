> **Prototype audit for THR-1764** (wayfinder map THR-1758, project Dominion — Player Power Progression). Design lane run 2026-10-10a, unattended, decided by delegation (process.md rule 4). Inputs: the THR-1760 cut, the THR-1761 band table, the THR-1762 frontier pace, the THR-1763 erosion rules (`Docs/audits/2026-10-09-thr-176{0,1,2,3}-*.md`), Christian's 2026-10-05 ruling (`Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md` § Director's ruling), `Docs/canon/rulebook.md` § war (lines 405–420). The census is code on the never-merged branch `proto/thr-1764-secondary-actors` (commit `f71a2c0f`).

# THR-1764 — dominion of the secondary actors

Christian's ruling: *"You build threads to help you spread dominion through secondary actors — agents, factions, artifacts, armies, locations. You can use powers to help these become more effective at what they do, as they fight the opposing dominion."* Locations and mortals already have a band (THR-1760). This ticket settles what a band is on a **faction, an army, a company and an artifact**, and what a **power** on any of them does against the opposing dominion. It stays inside what the existing graph carries.

Ground truth: `main` @ `d372e413`, 2026-10-10.

```
# on proto/thr-1764-secondary-actors
npx esbuild scripts/proto-secondary-actors-1764.ts --bundle --platform=node --format=esm \
  --outfile=.cache/proto-secondary-actors-1764.mjs --external:fs --external:path
node .cache/proto-secondary-actors-1764.mjs --seeds 42,99,7 --ticks 240   # → scripts/proto-secondary-actors-1764.out.txt
```

Seeds 42 / 99 / 7, medium, headless (`initializeGameState` + `runTick`), read at tick 0 and tick 240. Three god vectors: the world's own god (3 + 2 on its alignment), showcase mind 3 / spirit 2, stone force 3 / matter 2. The THR-1760 formula and cut, pair weights.

## What each actor carries today (measured)

| Actor | Graph shape | Sphere data | Evidence |
|---|---|---|---|
| **Faction** | `faction` node; `leads` agent → faction (`graph.ts:133`); `member_of` from individuals | Own bag seeded to zeros (`sphereAffinity.ts:267-268, 295`) plus `sphereAggregate` = **rounded** member mean (`computeFactionSphereAggregates`, `sphereAffinity.ts:485-511`, round at `:497`). Readers see `getFactionSphereScores` = clamp(own + aggregate) (`:518-530`). One reader outside tests: `battleAftermath.ts:240`. | grep `getFactionSphereScores(` → 2 hits (definition + battleAftermath) |
| **Culture** | `actor`, `actorType:'culture'` (`cultureGenerator.ts:492, 640`) | Seeded from `veneratedSpheres` (+2 / +1, `sphereAffinity.ts:222-231`); passes its spheres to members at seed (`:281-288`) | — |
| **Army** | `actor`/`group`, `groupKind:'army'`, `armyState` bag (`armySpawning.ts:223-241`); `commanded_by`, `member_of` faction, `located_at`, `participates_in` battle | Zero bag from the backfill (`sphereAffinity.ts:395-411`); **no individual soldiers**, only `headcount` | grep `target: armyId` → 0 |
| **Company** | `actor`/`group`, `groupKind:'company'` (`groupShape.ts:5-7, 89`); `commanded_by` leader, `member_of` from members (`groupFormation.ts:440, 449`) | Zero bag | — |
| **Artifact** | `artifact` node; bearer via `possesses` / `bonded_to` (`graph.ts:71-72`) | `sphereAffinity` is a **bare sphere name**, never a 0–10 bag (`worldSeed.ts:1995, 2008`; `mintGeneratedItem.ts:118`). Imbue appends an effect and writes no sphere (`ascendantExpression.ts:113-160`). | 0 of 185–709 artifacts carry scores on any seed, t0 or t240 |

Battle: `grep -i sphere src/engine/battleResolution.ts` → 0 hits. Opening momentum is size × fortification (`battleResolution.ts:116-133`). Each spotlight moves momentum ±2 (`:343-377`). Spheres enter only **after** a battle: the victor faction's dominant sphere is pushed onto the settlement at 3 × {1, 2, 3} (`battleAftermath.ts:219-261`).

Powers today:

| Verb | Writes | Reads a sphere? |
|---|---|---|
| Bestow (`action.bestow`, `unified-action-templates.ts:2597`) | a Divine Gift artifact + `possesses`, +2 on the god's primary **reach**, +0.01 quintessence a tick; needs the thread's awareness ≥ faith (`ascendantExpression.ts:252-330`) | no |
| Anoint (`action.anoint`, `:2687`) | `faction.properties.chosen` from `CHOSEN_POWER_TABLE[actor][reach]`; the only consumer pays members +0.002–0.005 reputation a tick (`chosenFactionPowers.ts:42-51, 65-115`) | no |
| Imbue (`:2435`) | one effect from the god's primary sphere **name** | name only |

None of the four verbs carries a template `sphereAffinity`, so the generic success push (`unifiedActionResolution.ts:4136-4148`) never fires for them. The one live "stronger against the opposing sphere" hook is `computeSphereAlignmentBonus` (±0.10 by sphere name, `resolutionModifiers.ts:246-297`), which the map's Out of scope (the dice, the fight block) leaves alone.

## The census (band counts Hostile / Foreign / Touched / Held / Sovereign)

**Factions with members or leaders** (18 a seed at t0; 34–41 member-less guilds per seed always read Foreign under any member read):

| Read | t0 | t240 |
|---|---|---|
| a1 engine aggregate (own + rounded member mean) | all Foreign on every seed and god (**not computed before the first tick**: `sphereAggregateComputed=0`) | Touched 8–20 of 74–81; max match 1.4; Held 3 only on seed 7 stone at power 1.33 |
| a2 the leader's own scores | world god all Foreign; showcase 0–8 Touched; stone 0–11 Touched (max 1.4) | as t0 |
| a3 the mean of the members' matches | showcase 0–6 Touched; stone 0–14 Touched | as t0 |
| a4 the mean of the places it holds | 0/8–17/1–8/0–6/0, max 2.4 | world god **8 / 9 / 0 Sovereign**, stone 12 / 7 / 14; Hostile 1–13 |

**Groups:** t0 has 5 armies a seed and nothing else; t240 has companies 21 / 22 / 30, armies 3 / 3 / 0, battles 1 / 2 / 0.

- b1 members' mean: armies always Foreign (no individuals). Companies Touched only under a matching god (seed 99 stone 17 of 22; seed 7 stone 8 Touched, 5 Held).
- b2 the owning faction: tracks a1. One company a seed has no faction.
- b3 the place it stands on: the only group read that reaches Held at t0 (2 of 5, 4 of 5), max 2.4. It changes with every hex an army marches.

**Artifacts:** c1 own scores all Foreign (no artifact has scores). c2 the bearer's read: 62–471 have a bearer; up to 55 of 81 Touched under a matching god; Held only at power 1.33.

**Mortals:** every non-zero mortal score is 1 or 2 (seed 7 at t240 adds three 3s and three 4s); 30–43 % carry none. At power 1 a mortal tops out at Touched.

**Held ground per faction:** 47 places held by 18 factions at t0 on seed 42 (2.6 a faction), 75 by 46 at t240 (1.6).

**Where mortals stand:** 62 / 87 / 92 places of 235–246 have a resident at t0 (26–37 %); residents per place p50 6, p90 18–19, max 21–22.

## The decision

**A secondary actor's band is read from the people or the ground it is made of, through the edges it already has. Nothing new is stored on any of them. A power makes an actor a better carrier of the god's spheres: it tends ground, which is how the god fights the opposing dominion. Battles get no band term; the god's hand in a war stays the spotlight.**

### Where each band is read

| Actor | Band read | Why |
|---|---|---|
| **Faction** | The engine's own faction read (`getFactionSphereScores`: own bag + member mean), with two fixes owed by the core: the member mean is **not rounded** for the dominion read, and aggregation runs once at world init so tick 0 is not blank. | It is the read THR-1760 measured and the one read a faction already has; "the band is the one read every consumer uses". A faction is its people. Rounding a mean of 1s and 2s erases it (a1 vs a3). |
| **Culture** | Its own scores, like any actor. | Already seeded from venerated spheres. |
| **Army** | Its faction's band (`member_of`). | An army has no individual soldiers; its spheres are its faction's. The standing place (b3) would flip with every hex marched, and the place is already read on its own. |
| **Company** | The unrounded mean of its members' scores (`member_of`); a company with no members reads its commander (`commanded_by`). | A company is mortals travelling together, often outside any faction (one a seed has none). |
| **Artifact** | Its bearer's band (`possesses` / `bonded_to`); an unborne artifact is **Foreign** (par). | No artifact carries scores, and the field is a bare name. An item lying in a ruin is not the god's. Giving artifacts a sphere bag would be a new property shape: sent to fog (below). |

Rejected for factions: **the leader** (a2) makes a faction swing with every succession and ignores its people; **the held places** (a4) is the only read that reaches Sovereign by tick 240 with no player at all, and it counts the ground twice, because the places are already read. Places are where turf lives; factions are who lives on it.

### What a power does against the opposing dominion

| Question | Answer | Named constant |
|---|---|---|
| Does a bestowed power on a mortal push the god's spheres where it acts? | **Yes, through the THR-1762 carrier rule, one tier higher.** A threaded mortal already carries the god's bought vector into the place it stands (0.005 / 0.01 / 0.015 / 0.02 a tick by thread tier, at most one Claim's 0.03 a place). A mortal bearing a bestowed gift carries at the next tier's rate (tier 4 stays 0.02), and still counts as the carrier that keeps a place tended (THR-1763). No band gate, as THR-1762 decided. | `DOMINION_BESTOW_CARRY_TIER_STEP` = 1 |
| Does an anointed faction's chosen power scale with the faction's band? | **No.** The chosen power is effect magnitude, and THR-1761 put magnitude on the god's power, never the band ("each channel is read once"). | — |
| What does anointing do for dominion, then? | **An anointed faction tends the god's ground it holds.** Every place it `controls` that reads Touched or better counts as carried: neglect skips it, and it absorbs one raid burst (the THR-1763 tending rule). It does not push spheres. A holding faction holds 1.6–2.6 places on average, so an anointing defends a town or three, not a realm's worth. | `DOMINION_ANOINTED_TENDS_MIN_BAND` = Touched |
| Does a Held army's battle read the band? | **No new term in momentum.** Canon: *"you will witness the war, you will not command it"* and *"gods do not command chess pieces"* (`rulebook.md:405, 415`). The god's seat in a war is the spotlight intervention, and a spotlight's cost and odds already read its target's band (THR-1761, via `sphereFactor`), so helping your own army is already cheaper and surer. A faction of yours that wins already pushes its dominant sphere onto the town it takes (`battleAftermath.ts:219-261`), which is conquest spreading dominion. | — |
| Imbue | Unchanged. The imbued effect reaches the bearer; the artifact's band is the bearer's. | — |
| Mortal fights | Unchanged (the map's Out of scope): `computeSphereAlignmentBonus` keeps its ±0.10 by sphere name. | — |

### What the player sees

Nothing new beyond THR-1766's mock: a faction, army, company or artifact shows the same band word as a place or a mortal, on its sheet. Bestow and anoint card texts gain one plain clause each, written by the core plan doc (*"they will tend your ground where they stand"*, *"their towns on your ground will hold for you"*). No number reaches the player (Law 13).

## Options weighed

- **Faction = the leader's spheres.** Volatile and blind to the people. Rejected.
- **Faction = the mean of the places it holds.** Strongest read (Sovereign factions at tick 240 without a player) and it double-counts the ground. Rejected.
- **Faction = the members' mean of matches (a3).** Close to the unrounded aggregate, but a second read beside the engine's own. Rejected for "one read".
- **Army or company = the place it stands on.** Flips each hex; an army on its march would change price mid-war. Rejected.
- **A sphere bag on artifacts, written by imbue.** A new property shape and a new writer, for a relic that tends where it lies. Sent to fog, not decided.
- **Bestow makes the mortal a full Claim (0.03).** A threaded tier-1 mortal would jump six-fold, and residents already fill 37–55 of 62 occupied places at the 0.005–0.01 rates if every mortal carried. One tier step keeps bestow a nudge on the existing ladder.
- **Chosen power scaled by the faction's band.** Breaks THR-1761's one-channel rule (band = price, odds and yield; power = magnitude).
- **A band term in battle momentum.** Would let the god's turf win wars with no player act and turn armies into the god's pieces. Rejected on canon.

## Would change the call

- **Christian wants armies to fight better on his ground without his hand** ("my faithful should win on my land"). The lever is a momentum multiplier from the army's band in `calculateInitialMomentum` (`battleResolution.ts:116-133`), which takes a modifier without a new edge.
- **Christian wants a relic that holds ground on its own.** That opens the artifact-sphere fog line below.
- **The combined run** in the core plan doc ([THR-1748](https://linear.app/threadbare/issue/THR-1748)). Bestowed carriers and anointed towns make tending cheaper, which THR-1763 named as the case where neglect may need to rise. Below the THR-1763 floor of about 10.5 a tick at day 90 the core loosens erosion; above about 13.5 (Model B's 12.5 target plus 8 %) it raises `DOMINION_UNTENDED_DECAY_PER_TICK` from 0.01 toward 0.015.
- **[THR-1765](https://linear.app/threadbare/issue/THR-1765), the god's own power.** Faster power growth lifts every actor's positive match. At power 1.33 seed 7 already shows 143 Held mortals and 21 Held artifacts.

## Findings for the core plan doc (not decisions)

1. **The faction aggregate is blank at tick 0.** `sphereAggregate` is written only inside `phaseSphereAggregation` (`phaseSphereAggregation.ts:189`), so every faction reads zero until the first tick runs.
2. **The aggregate rounds a mean of 1s and 2s** (`sphereAffinity.ts:497`), which erases most factions: 8–20 Touched at tick 240, where the members' own matches put up to 14 Touched at tick 0.
3. **No headless world has a thread edge**, so the threaded-carrier rule could not be measured on a scripted world; the browser `?seeded` world is the place for it.
4. **34–41 guild factions per seed have no members and no leader**, and so read Foreign forever. That is correct (par), noted so nobody reads it as a bug.

## Not measured

- The economy with bestowed carriers and anointed towns (owed by the core's combined run, above).
- Thread tiers on a real run (no thread edges headless).
- Power above 1.33.
