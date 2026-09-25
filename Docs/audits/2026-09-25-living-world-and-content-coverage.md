# A living world at game start, and the content it needs (research, 2026-09-25)

**Question** (Christian, 2026-09-25): *"continue design work on how we ensure that the game worlds we generate when a player starts a new game is well seeded for making the game world seem alive. also assess where we need more content for variety or completion, since i think we in many cases only have a little content still."*

This picks up where [THR-1435](https://linear.app/threadbare/issue/THR-1435) (the seeded-world audit, `Docs/audits/2026-09-08-thr-1435-seeded-world-vs-systems.md`) and [THR-1437](https://linear.app/threadbare/issue/THR-1437) (`seedLivingWorld`, shipped 2026-09-07) stopped, and re-reads content supply against demand the way `Docs/audits/2026-08-24-encounter-portfolio-assessment.md` did for encounters alone.

**Method.** Measured on `main` @ `d6ff4070`, seeds **42 · 99**, medium map unless stated, numbers written *seed 42 · seed 99*. Censuses run: `census:seeded-world` (t0 / t150), `census:ownership`, `census:reachability`, `census:cells`, `census:firings --all` (200 ticks), `census:undertakings`, `census:location-traits`, `check:content-model-census`, `content-census`, `generate-setting-coverage:check`. Five throwaway readers (never merged): an alive-ness reader (settlement story, social ties, events t1–20, pre-history, map coverage at small/medium/large, a clean timing run), a corpus slicer, a firing-vs-place demand join, a firing-weighted authoring-coverage join, and a reward-repetition reader.

**Two blind spots, stated first.**
1. Every run is **unattended** — no player, no First, mortals acting alone for 150–200 ticks. It measures what the world deals, not what an attended player reads at the story-beat tier.
2. `census:firings` harvests `state.unifiedActions` only. Social, tavern, npc and borderland encounters come from `socialEncounterGeneration.ts` on a separate path and read as **zero** there — that is the census not seeing them, not evidence they never fire.

---

## Part 1 — the world at game start

### 1.1 What a fresh world holds (t0 → t150)

| Kind / edge | 42 | 99 | Verdict |
|---|---|---|---|
| Location: settlement / ruin / wild / stronghold / holy / wonder / deposit | 47 / 110 / 43 / 4 / 3 / 8 / 14 | 67 / 98 / 27 / 5 / 11 / 10 / 14 | ruins are 48% · 42% of Locations; holy places starved on 42 |
| Mortal: spotlight / notable / ambient | 19 / **0** / 460 → 19 / 64 / 469 | 22 / **0** / 600 → 25 / 38 / 697 | the notable tier is empty at start |
| Faction: realm / guild / military / criminal / religious / political / untyped lair | 3 / 6 / 3 / 2 / 1 / 1 / **34** | 3 / 6 / 3 / 2 / 1 / 1 / **41** | 16 real factions; the rest is lair padding; one religious order |
| Route identity / `trades_with` | 6 / 6 → **0** | 6 / 6 → 2 | lanes are seeded and then **decay away** |
| `owns` (freeholds) | **0** → 3 | 2 → 3 | starved — below the THR-1437 closeout (8 · 4) |
| `hostile_to` (quarrels) | 4 → 107 | 14 → 127 | below the closeout on 42 (16) |
| `knows_secret_of` / `owes_favor` | 1 / 0 → 13 / 0 | 2 / 0 → 30 / 2 | starved |
| `reputation_with` | **0 → 0** | 0 → 1 | dead |
| Company / Network / Companion | 0 → 18 / 0 / **0 → 0** | 0 → 21 / 0 → 1 / **0 → 0** | companions dead |
| Event nodes / chronicle entries | **0 / 0** → 516 / 312 | **0 / 0** → 1064 / 400 | no past at t0 |
| Powers borne / items held | 0 → 31 / 19 → 87 | 0 → 58 / 20 → 139 | earned in play |

**Never seen, even at t150, on either seed:** `mentors`, `accompanies`, `leads`, `estranged`, `training`, `graduated`, `sacred_route`, `knows_spell`, `holds_place_of_power`; `echoStates`, `activeDelves`, `prosperityShocks` stay 0.

### 1.2 Does it feel alive? (the signals behind the counts)

| Signal | 42 | 99 |
|---|---|---|
| Settlements where **no resident** holds an ambition, quarrel, secret or favor — t0 · t20 · t150 | **42/47** · 30 · 7 | **58/67** · 47 · 18 |
| Settlements with a spotlight resident | 8/47 | 12/67 |
| Settlements held by any faction | 24/47 | 37/67 |
| Mortals with any person↔person tie | **14/480 (3%)** | **17/623 (3%)** |
| Ties per spotlight mortal · spotlight mortals with none | 3.6 · 5 | 4.6 · 5 |
| Events t1–20 (distinct types) · share that are `agent_encounter` | 1178 (24) · 61% | 1514 (24) · 70% |
| Trade chronicle lines t1–20 | 2 | 3 |
| Pre-history at t0 (past events, founding dates, legends, dead notables, ruin lore) | **none** | **none** |
| Land hexes with anything named on them | 214/711 (30%) | 222/710 (31%) |

The world *warms up*: by t150 most settlements have a story. **The first minutes — the ones a new player judges the game by — are the emptiest.** Origin vignettes are written at tick 1; worldgen writes no history; the only history-shaped properties are `cultureEra` and `originCultureId`.

### 1.3 Map size

Seed 42, t0: spotlight per settlement **0.38 small · 0.40 medium · 0.26 large**; armies per settlement 0.12 · 0.11 · **0.04**; settlements with nothing dramatic 33/34 · 42/47 · 130/138. The large map is materially thinner — counts are per-culture or flat where they should be per-settlement.

### 1.4 The budget

Clean steady-state tick cost, medium, t21–150: **112 · 165 ms** (t1–20: 86 · 92). THR-1437 closed at 91 · 130 over a 200-tick window — not like-for-like, but seed 99 was already over the +25% criterion then. **Deciding mortals are the expensive lever** (the growth is in `agent_decision`, THR-1437). Notables, edges and history cost nothing per tick unless something new reads them every tick.

### 1.5 Drift since the THR-1437 closeout (executor work, not design)

| | THR-1437 closeout | now |
|---|---|---|
| spotlight at t0 | 21 · 21 | 19 · 22 |
| `owns` | 8 · 4 | **0** · 2 |
| `hostile_to` | 16 · 14 | **4** · 14 |
| cells census starts (150 ticks) | 195 · 123 | **65 · 91** |

Freeholds on 42: W4 requires a leading Reach of gold, stone or heart; 4 protagonists qualify, **none** heart, and all 4 live outside settlements (towers, ancient roads, points of interest) where there is no commerce/authority Place. Quarrels and cell starts are **not diagnosed**. Seven commits since 2026-09-12 touched `worldSeed.ts` / `agent-behavior-constants.ts` (THR-1155 realms, THR-1562 reach on one scale, THR-1578/1579 forecast window, THR-1523, THR-1525), and the forecast-window ruling (THR-1575) may lower start rates on purpose. Filed as its own ticket — diagnose, then restore or re-baseline with open eyes.

### 1.6 Ranked gaps — what makes the start feel dead

| # | Gap | Measured | Who reads it | Direction |
|---|---|---|---|---|
| 1 | Settlements with no story | 42/47 · 58/67 | encounters, notable agendas (cap 7), spotlight pull | seed 1–2 **notables** per settlement with a local want — not deciders |
| 2 | No social web | 3% of mortals tied; `mentors` 0; no kin tie exists at all | social encounters, motive gate, grievance | seed kin, friends, rivals, master↔apprentice among co-residents |
| 3 | No past | 0 events, 0 chronicle, 110 · 98 ruins with no lore, echoes 0 at t150 | chronicle, `occurred_at` context, ruins, World-Soul | a worldgen **history pass**: founding, wars, deaths, fallen places |
| 4 | Seeded objects drift/decay | freeholds 0 · 2, quarrels 4, lanes 6 → 0 · 2, none owned | holdings, motive gate, trade, supply | fix W4's gate; give lanes a keeper; §1.5 ticket |
| 5 | Reputation dead | `reputation_with` 0 at t0 and ≤1 at t150 | rep gates, court ladder, raise × Standing | starting standing with home Realm / guild |
| 6 | Secrets & favors thin | 1 · 2 secrets, 0 favors | Secrets & Favors, leverage | favors inside factions; ~1 secret per 3 protagonists |
| 7 | Ambitions with no holder | `chase_the_wonder`, `seek_revenge`, `reclaim_homeland` (and `spread_faith` held only by non-deciders) | the ambition board | seed from history (#3) and quarrels |
| 8 | Nothing grouped at start | companies 0, networks 0, companions 0 (companions 0 at t150) | group travel, people-things cells | one company per capital; companion writer check |
| 9 | Thin faith & politics | 1 religious faction; 3 holy places on 42; half the settlements unheld; `leads` 0 | faith, Realm, succession | orders per culture; unheld towns claimed |
| 10 | Large map thins out | spotlight/settlement 0.26; armies 0.04 | everything | scale counts per settlement, capped by the tick budget |

**Written, read by nothing:** `constructed_by` (166 · 192 edges; one reader, the legacy builders-mandate edge count). **Oddity:** 315 of 580 mortals on seed 42 (at t200) read no culture in the demand join — possibly the reader's property path rather than a gap; check before seeding anything culture-keyed.

---

## Part 2 — content: how much, and where it is thin

### 2.1 By content kind

| Kind | Authored | Demand (2 seeds × 200 ticks) | Repetition / never fired | Verdict |
|---|---|---|---|---|
| Encounter | 518 (53 branching) | 918 firings | 101 distinct fired; **top 10 = 49.7%**; **414 of 514 drawable never fired** | repetitive where it lands, dead weight elsewhere |
| …with a nudge hand (the player's cards) | **38** (7.3%) | 3.8% of firings | 23 of 38 never fired | **thin** |
| Setting envelopes / context fragments | 37 / 37 | 3.8% of firings | 8 classes cover 20 of ~55 subtypes | thin |
| Undertaking | 60 cells + 56 legacy packs | 65 · 91 starts | 20–22 of 60 cells start; one cell = 26% of seed-99 starts; census **FAIL** (2.0–2.4 starts / mortal / 100 ticks, gate ≥ 4) | thin in use |
| Item | 134 (tiers 1–4: 46 / 54 / 24 / 10) | 222 · 344 grants | 101 · 114 distinct granted | adequate |
| Condition | 70 | — | `starter_revelation` ≈ 10% of all grants | repetitive |
| Power | 25 (12 god-given, 8 anomaly, **5 spells**) | — | — | **thin** (spell generator THR-1572) |
| Legendary artifact | 3 | — | — | thin |
| Trait | 59 | — | — | adequate |
| Agreement / Companion templates | 7 / 9 | — | companions never minted | thin |
| Omen | 44 (28 doom echoes = 4 per archetype) | not measured | — | adequate |
| Nudge card | 37; 3 of 21 card types have no card | — | 5 families draw > 66% sphere cards | thin |
| Aftermath reactions | 956 inline, no shared catalog | — | 383 of 705 templates have none | uneven |
| Rumor | **no table** — rumor text lives inline in 55 files | — | — | missing |
| Art | 128 images; 30 of 705 templates illustrated | — | 36 of 55 location subtypes fall back to `camp.png` | thin |

### 2.2 How encounters slice

- **Reach:** iron 98 · eye 90 · heart 70 · gold 67 · shadow 58 · stone 42 · star 38 · veil 37. Empty reach × scale cells: gold-cosmic, stone-personal.
- **Sphere:** 481 of 518 carry none; matter 22; every other sphere ≤ 4. The sphere vocabulary has no chaos, order, light or darkness entry; `#light` is a dead tag.
- **Culture:** **0** culture-specific encounters, 3 living cultures per world; historical-culture prose is 2 lines per foundation.
- **Attention tier:** background 257 · shaping 207 · story-beat 39.
- **Faction:** 11 factions × ~15 templates; the adventuring guild uses a generic 26-template file with no voice-bible entry.
- **Outcome prose:** 423 of 518 author only the success and failure lines; **3** author all six bands. Of 314 aftermath configs, 267 write no per-band ending.
- **Place:** firings land 93–95% at urban or rural settlements. Hamlets (17 · 28 per world, the commonest settlement) took 342 of 918 firings from 96 eligible templates; `confront_the_unknown` (71) and `master_local_craft` (64) alone are 15% of all firings.

### 2.3 Ranked content gaps

**Completion** — the system exists, the content does not:

| # | Gap | Measured | Target |
|---|---|---|---|
| C1 | **Success-at-cost reads as success** | at-cost is 305 of 892 resolutions (34%) — the rulebook's *dominant texture* — and the templates that author it carry 3.8% of firings | at-cost prose on the templates that actually fire, top 30 first (≈ 60% of firings) |
| C2 | **The player's hand is rare** | 38 of 518 encounters deal cards; 3.8% of firings | convert the most-fired templates at the story-beat tier first |
| C3 | **Aftermath ignores the band** | 267 of 314 aftermaths are band-blind | five band endings on the same top-30 set |
| C4 | **Promised follow-ups wither** | 24 of 102 · 37 of 115 planted seeds (24–32%) found no matching content | ≥ 2 follow-ups per family a seed can name |
| C5 | **The commonest places have no content** | elder ruins 88–103 per world, **0** templates; lairs 13–14 with 3; monument, trade route, hot spring, grove 0 | ruin family tied to the history pass (Part 1 #3); lairs via the monster lane |
| C6 | **Culture never shows** | 0 culture-specific encounters | culture-variant openings through envelopes / fragments, not per-culture copies |
| C7 | **Spheres barely show** | 481 of 518 sphereless; 5 spells for 12 spheres; 4 spheres with no vocabulary | spell generator (THR-1572); vocabulary for the missing four |

**Variety** — content exists but repeats:

| # | Gap | Measured | Target |
|---|---|---|---|
| V1 | Hamlet / town pool | 2 templates = 15% of all firings; top 10 = 49.7% | +40 hamlet/town-eligible templates; damp the top 5 |
| V2 | One condition dominates rewards | `starter_revelation` ≈ 10% of grants; top 10 rewards ≈ 30% | spread the source; ~20 more conditions |
| V3 | Undertakings start from few cells | 20–22 of 60 start; 11 of 60 have a catalyst | supply/eligibility first (catalysts), authoring second |

**Dead weight** — authored, never reached (reachability, not writing):

| # | Gap | Measured | Direction |
|---|---|---|---|
| D1 | 8 of 12 faction lines never fire | arcane circle, dawn order, Underking's court, rangers, lorekeepers, temple, adventuring guild, mercenary company: 0 on both seeds (~120 templates); the other 4 fire only from seeds (14) | membership and travel reach, before any new faction writing |
| D2 | Off-settlement places never visited | shrine 61, tower 85, fort 81 templates ≈ 0 firings | mortals who live, travel or have business beyond settlements |
| D3 | Location traits change nothing | 434 of 518 encounters untagged; the `#welcoming` bonus tags got 0 hits; `#haunted`, `#veil_thin` never on a place | tag every fired template with family and form |

---

## Part 3 — what the two halves say together

1. **The world has nouns but not stories.** THR-1437 seeded objects. What a new player misses is the connective tissue per settlement — someone who wants something here, people tied to each other, and a past the place remembers.
2. **Liveness is cheap if it isn't agency.** Notables, ties and history cost no decision-loop time; more deciders do, and the budget is already spent. Seed the people and the past; keep the protagonist count where THR-1437 left it.
3. **A past pays twice.** A worldgen history gives the chronicle and the 100 ruins something to say, feeds the holder-less ambitions (`reclaim_homeland`, `seek_revenge`, `chase_the_wonder`), and is the natural home for the ruin content that does not exist (C5).
4. **Content is short in shape and reach, not raw count.** 518 encounters, 414 never fire; the 101 that do lack at-cost prose, band endings and cards. **Author where the dice land** — rank completion work by firings, not by kind.
5. **Half of "thin content" is reachability.** ~300 existing templates (faction lines, shrine/tower/fort) wait for mortals who go there or belong there. Seeding decisions (where people live, whom they serve) and content decisions are one question.
6. **Measure the attended view before sizing a content program.** What the First and retinue meet at the story-beat tier, and the social/tavern path, are both unmeasured.

## Part 4 — proposed next steps

**Executor ticket now (drift, §1.5):** diagnose and restore or re-baseline freeholds, quarrels and cell starts against the THR-1437 closeout.

**Design route — proposed as a wayfinder map**, destination *"plan docs ready for handoff for a world that starts with people, ties and a past, and a demand-ranked content program whose first slices are Ready for Dev"*:

| Ticket | Type | Question |
|---|---|---|
| A world with a past | prototype (HITL) | How much history does a new world carry, and how does the player meet it? A generated history for seed 42 to react to. |
| Story in every settlement | research → decision | What does a seeded notable *want* and *do* without the decision loop (THR-1348 declined off-screen undertakings for cost)? Density, cost measured. |
| The people web | research | Which ties to seed (kin, friends, rivals, master↔apprentice, faith), how many, and which reader consumes each — no edge nothing reads. |
| Seeded things that die | research | Lanes decaying to 0, reputation never written, companions never minted, the never-seen edges: seed, fix the writer, or retire — per item. |
| Faith and politics at start | grilling (HITL) | Religious orders and holy places per culture, unheld towns, lair factions in the faction list. |
| Reach before volume | research | Why faction lines, off-settlement places and follow-up seeds never land; fixes ranked by templates unlocked. |
| Author where the dice land | research → decision | The firing-weighted order for at-cost prose, band endings and nudge hands; what bulk completion work needs Christian's sampling and what does not. |
| The attended view | task (AFK) | Extend the censuses to the attended First/retinue and the social/tavern path. |
| Culture and spheres showing through | prototype (HITL) | Culture-variant openings and the four missing sphere vocabularies — a handful to react to. |

Wayfinder decisions are delegated to design sessions (process.md rule 4, 2026-09-11); the two HITL tickets — the past, and faith & politics — are the creative forks.
