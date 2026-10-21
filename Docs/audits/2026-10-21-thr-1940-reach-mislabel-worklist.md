> **Worklist and decision audit for THR-1940** (project Content Architecture; the first follow-on of the encounter coverage map, `Docs/plans/2026-10-14-thr-1723-encounter-coverage-map.md` § Decision 3). Design lane run 2026-10-21b, unattended; decided by delegation (process.md rule 4) with a veto invited. Input: the first coverage run's `reach_mislabel (110)` list, `git show origin/ops:Docs/ops/content-judgments/encounter-coverage.md` (§ Findings) and `…/encounter-coverage.json` (run of 2026-10-15, source `c5122c17`, questions v1, `jev-1.13.0`).

# THR-1940 — the 110 Reach mislabel candidates, dispositioned

Ground truth: `main` @ `9e7db2c7`, 2026-10-21. Every one of the 110 was read against its prose, stakes and steps (§ 3). Nothing in this audit edits a catalog; the edits ship with the build tickets in § 6.

## Verdict in one paragraph

**The judge was right about a third of the time, and almost never when it said Eye.** Of the 110, **32** encounters change their Reach, **6** keep it but move one or two steps to the Reach their prose actually tests, **35** keep their Reach and get a prose fix (the label is right, the words narrate the wrong act), and **37** stay as they are. Jev's 67 `→ eye` calls were right **5** times (7%); its 43 other calls were right **22** times (51%), and 5 relabels land on a third Reach neither label named. The coverage question therefore gets a v2 before it is re-run: it is shown the stakes lines it never saw, and it is told to judge the test, not the noticing that leads up to it (§ 4). The three proof templates with Reaches outside the Eight take **Stone**, **Star** and **Iron** (§ 5). After the relabels the catalogue's Reach mix moves by at most 7 of 587 entries per Reach.

## 1. What an encounter's Reach does — measured

Two different fields carry a Reach, and they do different jobs:

| Field | What reads it | Citations (`main` @ `9e7db2c7`) |
|---|---|---|
| **Step `reach`** (required on every step) | **The roll.** Capability, growth, tier promotion, item/trait/location modifiers and the forecast are all computed on the step's Reach | `unifiedActionResolution.ts:373` `const stepReach = fightInputs?.reach ?? step.reach;` · growth `:2408, :2435-2441, :2477` · modifiers `resolutionModifiers.ts:309-738` · forecast `plannerForecast.ts:349, 432, 503` |
| **Template `reach`** | **Who meets the encounter and what it means afterwards** — awareness range, the capability gate in the filter, every scoring term, the agent's decision, the god's reach practice, reputation tallies, autonomous-aftermath moral drift, foreshadowing, labels | `encounterCache.ts:318-319` (`reachPrimary`) · `encounterAwareness.ts:240` · `encounterFilterPipeline.ts:608, 767` · `encounterScoring.ts:1035-1553` · `unifiedActionResolution.ts:4235` (`accruePlayerReachPractice(…, template.reach, …)`) · `phaseReputationTraits.ts:183` · `phaseAutonomousAftermath.ts:82` |

So **the template Reach should name the encounter's main test** — what the mortal must do to win, read off the stakes' goal and won lines and the decisive (`fail_action` or hardest) step — and **each step's Reach should name what that step's prose asks.** A label that is right at the top but wrong on a step is fixed on the step.

The judge saw neither field. Its state is the title, the collector's prose and each step's narrative, purpose line and afterimages (`scripts/content-judgments/encounterState.ts:53-104`). It never saw the **stakes** lines: `grep -c stakes src/engine/content-eval/collectAuthoredProse.ts` → `0`.

## 2. How the 110 were read

1. **Step census.** A throwaway script (never committed) loaded each of the 110 through `getUnifiedTemplateById` and listed its runnable steps' Reaches and difficulties. In **104** the declared Reach is the most common step Reach; **6** are not (one of them, `hod.senior.inquisition`, declares Star while no step rolls Star). 39 roll the declared Reach on *every* step, 65 mix Reaches.
2. **That census does not decide anything on its own.** A cold reader spot-checked 12 of the 65 mixed entries, drawn by FNV-1a hash of the id, and would have changed the Reach on **6** — several "most common" Reaches were one-step-each ties, and some steps simply copied the label. So all 110 were read.
3. **Six cold readers**, 15–18 entries each, read every entry's prose, stakes and steps with the canon Reach table (`Docs/canon/cosmology.md` § The Eight Reaches) and the § 1 rule, and proposed Keep / Relabel / Prose fix with a quoted line. They were told the judge's known Eye bias, not the judge's probabilities.
4. **The lane reconciled them against four house rules** and overrode a reader where a rule applied (§ 2.1). Every final row is in § 3.

### 2.1 House rules applied in reconciliation

- **A faction quest moves only within its faction's top three Reaches** (`reachWeights` in `src/data/*-definition.ts`; e.g. Temple of Spheres Star 0.9 / Heart 0.7 / Veil 0.5, Holy Order of Dawn Star 0.8 / Iron 0.8 / Heart 0.5, Mercenary Company Iron 0.9 / Gold 0.7 / Shadow 0.4). The weights decide who joins a faction; a quest that tests a Reach the faction does not prize asks its members for something they were never drawn for. Outside the top three, the prose is fixed instead. This turned three reader relabels into prose fixes: `hod.quest.purify_shrine` (→ Veil), `mc.social.war_stories` (→ Eye), `ts.social.theological_debate` (→ Eye).
- **An encounter seeded by a god card keeps that card's Reach.** Three of the governance encounters (`src/data/faction-governance-encounters.ts`) are on the list, and each echoes the card that seeds it — Stir Dissent is Shadow (`unified-action-templates.ts:1040`), Recover Doctrine Star (`:1120`), Surface a Doubter Eye (`:1159`). In each the decisive step is a loyalty test, so that **step** moves to Heart and the template stays.
- **A family that spreads or fixes its Reach on purpose keeps it.** All ten anomaly encounters are Eye; the four company dramas take Iron, Gold, Heart and Shadow one each; reputation encounters (`reputation.<reach>.*`) are gated on their Reach. This overrode one reader relabel: `encounter.anomaly.singing_dark` stays Eye (its later steps already roll Veil).
- **A factory encounter whose reward draw was stamped on its Reach keeps it** unless the draw is re-stamped in the same change (`npm run compile:encounter` stamps `consequenceDraw`; `encounters.md` § Factory tooling). Three such entries — `encounter.border.toll_of_blades`, `encounter.delve.the_broken_seal`, `encounter.town.levee_breach` — keep their Reach.

## 3. The worklist

Rows are ordered Relabel → Step relabel → Prose fix → Keep. "Step Reaches today" lists each runnable step in authored order. "What changes" names the fields the build touches; for a Prose fix it names where the prose drifts, and the reason column says what to foreground.

| Encounter | Declared | Judged (conf.) | Step Reaches today | Disposition | What changes | Why |
|---|---|---|---|---|---|---|
| `ag.quest.recover_artifact` | eye | iron 0.88 | eye · shadow · iron | **Relabel → iron** | template only | Won line: "felled the guardian and recovered the heirloom" |
| `encounter.blessing_of_passage` | star | veil 0.925 | star · veil · star | **Relabel → veil** | template; steps bless_road.prepare, bless_road.seal → veil; bless_road.walk stays star | The act is a rite: "salt, water, and one word of protection" |
| `encounter.forbidden_tome` | eye | shadow 0.87 | eye · veil · eye | **Relabel → shadow** | template + step forbidden_tome.claiming | "Steal the forbidden book"; "walks out through the kitchen door" |
| `encounter.garrison_gossip` | heart | eye 0.995 | heart · shadow · heart | **Relabel → eye** | template + step garrison_gossip.file; reward tag #heart → #eye | "Works out which pieces contradict each other" |
| `encounter.gather_firewood` | eye | stone 0.985 | eye · stone · stone | **Relabel → stone** | template only (reachPrimary stone, reachSecondary eye) | "Finding wood is easy. Carrying enough of it back is the work" |
| `encounter.guild_initiation_trial` | iron | heart 0.985 | iron · heart | **Relabel → heart** | template only (swap reachPrimary heart / reachSecondary iron) | "Not skill — it is allegiance"; won line "took the oath" |
| `encounter.harvest_bounty` | gold | stone 0.96 | gold · stone · gold | **Relabel → stone** | template + step 1 (gathering) | "Bring in the heavy harvest and dry it right": labour and preservation |
| `encounter.healer_aid` | gold | eye 0.915 | eye · gold · heart | **Relabel → heart** | template; step 2 (treatment) gold → eye | No wealth is tested; "is there when they wake… most of the work" |
| `encounter.healers_oath` | gold | eye 0.96 | gold · heart · gold | **Relabel → stone** | template; step diagnosis gold → eye; step sacrifice gold → stone | Endurance: "goes down with the sickness they spent the month fighting" |
| `encounter.inspect_the_armoury` | iron | eye 0.99 | gold · iron · iron | **Relabel → eye** | template + step inspect_armoury.report | "Turns four days of counting into a page" |
| `encounter.library_expansion` | eye | stone 0.955 | gold · eye · stone | **Relabel → stone** | template only | "Build the library and a vault that keeps it" |
| `encounter.listen_for_rumors` | shadow | eye 0.995 | shadow · eye | **Relabel → eye** | template only (secondary shadow) | Goal "pick one true lead out of the well talk" |
| `encounter.mend_fishing_nets` | gold | stone 0.8 | gold · heart · gold | **Relabel → stone** | template; steps inspect, repair → stone; payment step stays gold | "Loop, pull, tighten" is handcraft |
| `encounter.rally_faithful` | veil | heart 0.965 | veil · heart · veil | **Relabel → heart** | template + steps 1, 3 (legacy 'spirit' alias) | Sermon and ask are persuasion: "puts it to them plainly rather than beautifully" |
| `encounter.rally_the_locals` | star | heart 0.88 | eye · star | **Relabel → heart** | template (secondary star) + step rally_locals.inspire | "Words move through the crowd like warmth through cold hands" |
| `encounter.sharpen_blades` | iron | stone 0.885 | iron · stone | **Relabel → stone** | template only | Holding the hone angle "for four hundred strokes" is craft |
| `encounter.slice.riders_behind_caravan` | eye | shadow 0.86 | eye · shadow | **Relabel → shadow** | template only | "Slip the hunted one out of the column unseen" |
| `encounter.slice.snow_on_the_pass` | stone | star 0.915 | stone · stone | **Relabel → star** | template + step 0 (PASS_CLIMB_STEP); step 1 stays stone | A race over a pass: "beat it to the hut" |
| `encounter.slice.unsafe_bridge` | stone | eye 0.925 | stone | **Relabel → star** | template + step 0 | A road choice: "cross on bad boards… or lose half a day at the ford" |
| `encounter.town.easter_reckoning` | star | eye 1 | star · star | **Relabel → eye** | template + steps 0, 1 | Calendar arithmetic proved against old books; no fate or travel |
| `encounter.trial_of_flame` | iron | stone 0.985 | iron · stone · iron | **Relabel → stone** | template + step 3 (transformation); step 1 stays iron | "Reforge the master's old blade"; failure "crumbles at the weld" |
| `hod.senior.inquisition` | star | eye 0.91 | eye · iron | **Relabel → iron** | template only | No step rolls Star; the decisive raid step is Iron (Holy Order Reach) |
| `hunt.trail_cold` | iron | star 0.855 | iron | **Relabel → star** | template + step 0 | "One step, no fight": keeping hold of a cold trail is tracking |
| `mct.social.guild_feast` | heart | gold 0.895 | heart | **Relabel → gold** | template + step 0 | "Works the long table the way they work a market" |
| `mct.social.wine_tasting` | heart | gold 0.83 | heart | **Relabel → gold** | template + step 0 | "Commerce disguised as pleasure", "three useful contacts" |
| `tavern.drinking_contest` | iron | stone 0.815 | iron · iron | **Relabel → stone** | template + steps 0, 1 | Out-lasting the liquor is endurance: "slide off the stool" |
| `town.easter_reckoning_heard` | star | eye 0.99 | star | **Relabel → eye** | template + step 0 | Defending a computation "line by line"; follows its parent to Eye |
| `ts.elite.found_cathedral` | heart | veil 0.915 | heart · heart · heart | **Relabel → veil** | template + steps 0, 1, 2 | Every step is rite or divination: "sphere-weight", "nine consecrations" |
| `ts.quest.consecrate_ground` | heart | veil 0.99 | heart · heart | **Relabel → veil** | template + steps 0, 1 | Both steps are ritual: a rite that "opens the ground to all nine" |
| `ts.quest.tend_shrine` | heart | veil 0.925 | heart · heart | **Relabel → veil** | template + steps 0, 1 | "Reads the weight", "the closing rite: nine offerings" |
| `ts.senior.banish_corruption` | star | eye 0.875 | star · star | **Relabel → veil** | template + steps 0, 1 | "Name the closed sphere" and open it: supernatural work |
| `ts.social.evening_prayer` | heart | veil 0.81 | heart | **Relabel → veil** | template + step 0 | A sphere rite: "hold the orbit through all nine" |
| `encounter.council_mediation` | heart | eye 0.945 | stone · heart · stone | Step relabel | steps council.assembly, council.judgment (legacy stone) → heart | Heart stays: hearing "without letting the longest become the loudest"; the ruling is personal authority |
| `encounter.militia_aid` | iron | eye 0.845 | iron · gold · iron | Step relabel | step militia.coordination gold → heart | Iron stays (the battle decides); teaching a shape "simple enough to survive fear" is leadership |
| `faction.encounter.dissent_surfaces` | shadow | heart 0.98 | shadow · shadow | Step relabel | steps 0, 1 → heart | Template Shadow mirrors the seeding card Stir Dissent; the open grievance it rolls is Heart |
| `faction.encounter.doctrine_surfaces` | star | heart 0.85 | star · star | Step relabel | steps 0, 1 → heart | Template Star mirrors the seeding card Recover Doctrine; winning the faction back is Heart |
| `faction.encounter.doubter_chooses` | eye | heart 0.855 | eye · eye | Step relabel | step 1 → heart | Template Eye mirrors the seeding card Surface a Doubter; breaking faith openly is Heart |
| `reputation.iron.the_executioners_commission` | iron | shadow 0.87 | iron · iron · iron · iron | Step relabel | step step1WarnTheCondemned → shadow | Iron stays; the warn arm ("not official, not traceable") is Shadow |
| `ac.social.spell_exchange` | veil | eye 0.855 | veil | Prose fix | steps | Veil stays. Prose sells "knowledge economy"; show the mortal testing the offered formula by craft of magic |
| `ag.senior.bounty_hunt` | shadow | eye 0.955 | shadow · iron | Prose fix | steps .1, .2 | Shadow stays; rewrite deduction as stalking unseen and an ambush from cover |
| `ag.social.bounty_plan` | shadow | eye 0.91 | shadow · iron | Prose fix | stakes + step .1 | Shadow stays; quietly learning the mark's bolt-holes |
| `ag.social.tavern_tales` | heart | eye 0.94 | heart · eye | Prose fix | prose | Heart stays (the only Heart one of the guild's six); the lead is confided once trust is won |
| `bf.social.workshop_tour` | stone | eye 0.995 | stone | Prose fix | prose | Stone stays; prose is a guided look; show the mortal's own craft at the bench |
| `borderland.plague_rats` | iron | eye 0.815 | iron · eye | Prose fix | step 1 success afterimage | Iron stays ("burn out the nest"); cut "has read this geometry before" |
| `cg.promotion` | iron | eye 0.8 | iron | Prose fix | prose | Iron stays; the board is an interview; let the martial record or a drill decide it |
| `cg.quest.break_up_brawl` | iron | eye 0.98 | iron · heart | Prose fix | step 2 | Iron stays; replace "read the truth in who looked away" with pressing the crowd |
| `cg.senior.raid_hideout` | iron | eye 1 | eye · iron | Prose fix | description | Iron stays; "the door comes off its hinges"; put the raid first in the description |
| `encounter.aid_refugees` | heart | eye 0.91 | heart · stone · gold | Prose fix | step refugees.recognition | Heart stays; replace "counts them properly" with winning the trust of people who have not asked |
| `encounter.anomaly.bones_old_world` | eye | stone 0.98 | eye · stone | Prose fix | stakes + step 2 | Eye stays (anomaly family); stakes are pure chisel work, recast as reading the boundary right |
| `encounter.black_market_deal` | gold | shadow 0.96 | shadow · gold | Prose fix | stakes | Gold stays (pair with the Shadow den template); say what the buy costs |
| `encounter.border.toll_of_blades` | iron | stone 0.915 | iron · stone | Prose fix | stakes | Iron stays (reward draw stamped on Iron); face the column down, not "outlast" it |
| `encounter.caravan_guard` | iron | eye 0.94 | gold · iron · iron | Prose fix | steps escort, delivery | Iron stays; show facing the riders down, not deciding "whether that is a count" |
| `encounter.company.two_roads_named` | gold | heart 0.865 | gold | Prose fix | prose | Gold stays (the four company dramas spread Iron, Gold, Heart, Shadow); show clout deciding "who names the road" |
| `encounter.delve.the_broken_seal` | star | iron 0.825 | star · stone | Prose fix | step 1 (carry) | Star stays (its reward draw is stamped on Star); foreground the climb and haul |
| `encounter.hire_guide` | star | eye 0.855 | star · gold · star | Prose fix | steps search, journey | Star stays; foreground route-craft (water, grass, the crossing), not judging people |
| `encounter.local_gossip` | heart | eye 0.995 | heart · shadow | Prose fix | stakes + step local_gossip.sort | Heart stays; earning what talkers keep from strangers |
| `encounter.mineral_vein_discovery` | stone | eye 0.995 | stone · gold | Prose fix | step mineral_vein.assess | Stone stays; make the Gold step the claim's price and buyers |
| `encounter.night_watch` | shadow | eye 0.95 | shadow · iron | Prose fix | step 0 | Shadow stays; the watcher hides past the firelight, not "reads the night" |
| `encounter.offer_small_prayer` | star | veil 0.925 | star · heart | Prose fix | step kneel | Star stays (the payoff is "a direction to walk in"); foreground asking the road for a sign |
| `encounter.prisoner_interrogation` | shadow | eye 1 | eye · shadow | Prose fix | step extract | Shadow stays; a bluff ("your partner already talked"), not spotting a date twice |
| `encounter.rest_and_reflect` | heart | eye 0.835 | heart · eye | Prose fix | stakes | Heart stays; recentre the goal on making peace with the month, not counting it back |
| `encounter.the_loan` | gold | eye 0.995 | gold · heart | Prose fix | step proposal | Gold stays; cut "only judgment"; foreground striking the terms |
| `hod.quest.deliver_judgment` | star | eye 1 | eye · star | Prose fix | prose | Star stays (Holy Order); the verdict binds the accused's fate |
| `hod.quest.purify_shrine` | star | veil 1 | star · star | Prose fix | steps | Star stays (Holy Order's Reaches are Star, Iron, Heart); recast the rite as the Order's dawn vigil, not spellwork |
| `hod.senior.cleanse_corruption` | star | veil 0.99 | star · iron | Prose fix | step 2 | Star stays (Holy Order); make step 2 a physical purge with blade and fire |
| `mc.army.raise` | iron | gold 1 | iron · gold | Prose fix | stakes | Iron stays; stakes make paying the test ("unpaid bills"); lead with the muster |
| `mc.social.war_stories` | iron | eye 0.975 | iron | Prose fix | prose | Iron stays (Mercenary Reaches are Iron, Gold, Shadow); show the old hands testing the mortal's nerve, not only listening |
| `mct.quest.settle_dispute` | heart | eye 0.945 | heart · gold | Prose fix | step 1 | Heart stays; show getting both men to give ground, not detective work |
| `npc_ask_information` | eye | heart 0.815 | eye | Prose fix | prose | Eye stays; "their tongue loosens" reads as persuasion; show catching what slips out |
| `reputation.stone.the_jury_of_the_ruined` | stone | eye 0.935 | stone · stone · stone · stone | Prose fix | prose | Stone stays (reputation gate); show the judge holding the ruling under the circle's weight |
| `social.spy_on` | shadow | eye 0.89 | shadow · eye | Prose fix | step 2 | Shadow stays; creeping close unseen, not cataloguing |
| `tg.social.dice_game` | shadow | eye 0.95 | shadow | Prose fix | prose | Shadow stays; show shaved dice or a palmed swap, not "reads the rhythm" |
| `ts.social.theological_debate` | star | eye 0.895 | star · star | Prose fix | prose | Star stays (the Temple's first Reach); make the argument about what the spheres foretell |
| `army.supply.siege_lifted` | iron | eye 0.92 | eye · iron | Keep | — | The decisive withdrawal: "leave as an army instead of as a rumour" |
| `army.threshold.desertion` | iron | heart 0.945 | heart · iron | Keep | — | Decisive step is discipline: "two ringleaders are hung" |
| `bf.quest.survey_site` | stone | eye 0.945 | eye · stone | Keep | — | Decisive step is Stone: "draw the drainage solution first" |
| `cg.elite.purge_corruption` | iron | eye 0.98 | eye · iron · heart | Keep | — | Goal leads with "arrest and try the bribed guard officers" |
| `cg.elite.siege_defense` | iron | eye 0.92 | stone · eye · iron | Keep | — | "Broke the siege with a sortie" |
| `cg.quest.wall_patrol` | iron | eye 0.94 | iron · iron | Keep | — | Decisive step "calls the challenge" on the climbers; Eye read step 0's "careful eye" |
| `cg.senior.command_watch` | iron | eye 0.825 | eye · iron | Keep | — | Decisive step "lead the response"; the planning is setup |
| `encounter.anomaly.singing_dark` | eye | veil 0.9 | eye · veil · veil | Keep | — | All ten anomaly encounters are Eye by design; its later steps already roll Veil |
| `encounter.border.the_sign_over_the_ruin` | veil | eye 0.81 | veil · eye | Keep | — | Reading an omen is Veil; its reward draw is stamped on Veil |
| `encounter.case_the_joint` | shadow | eye 0.95 | eye · shadow · shadow | Keep | — | Casing a building "at hours when walking there is unremarkable" |
| `encounter.court_noble` | heart | eye 0.91 | heart · gold · heart | Keep | — | Decisive step is a negotiation: "negotiates two days a month" |
| `encounter.forage_the_land` | stone | eye 0.99 | eye · stone | Keep | — | Decisive step is labour: "digging, cutting, hauling" |
| `encounter.political_intrigue` | heart | eye 0.835 | eye · shadow · heart | Keep | — | Final step is persuasion: "offers that instead" |
| `encounter.prospect_the_seam` | gold | eye 0.955 | stone · gold · gold | Keep | — | "Owns a piece of the mountain on paper" |
| `encounter.realm.court_summons` | gold | eye 0.95 | gold · heart | Keep | — | Winning court favour: "earned a use at court" |
| `encounter.realm.tithe_demanded` | gold | eye 0.985 | gold · heart | Keep | — | "Make the collector take only the true tithe" |
| `encounter.salvage_operation` | stone | eye 0.96 | eye · stone | Keep | — | Decisive extraction: "takes each piece in the reverse of the order it was set" |
| `encounter.starborn_vigil` | star | veil 0.835 | star · veil · star | Keep | — | The climax is fate: a passage that "will not be open at sunrise" |
| `encounter.town.comet_disputation` | star | eye 0.885 | star · star · star · star | Keep | — | Reading fate aloud to win the council is Star |
| `encounter.town.counting_house_dispute` | gold | eye 0.985 | gold · heart · heart · heart | Keep | — | A merchant-house debt with fees and Means shifts is Gold |
| `encounter.town.debt_arbitration` | gold | eye 0.8 | gold · gold · gold · gold | Keep | — | Ranking a bill against a claim and pricing a deed is Gold |
| `encounter.town.levee_breach` | iron | stone 0.87 | iron · eye · iron | Keep | — | Its design note chose Iron two steps to one; its reward draw is stamped on Iron |
| `encounter.town.mill_lease_auction` | gold | eye 0.97 | gold · gold | Keep | — | "Win the lease" is a trade test |
| `mc.quest.patrol` | iron | eye 0.88 | iron · iron | Keep | — | Main test "walk it with blade ready"; only the report step counts |
| `mc.senior.field_command` | iron | eye 0.865 | iron · iron · iron | Keep | — | "Keeping the word means the line holds three days" |
| `mct.promotion` | gold | eye 0.82 | gold | Keep | — | The masters judge "clean terms, margins that held", a Gold record |
| `mct.quest.appraise_goods` | gold | eye 1 | eye · gold | Keep | — | Final step: "book price adjusted for the market" |
| `mct.quest.market_survey` | gold | eye 1 | eye · gold | Keep | — | "That gap is where the margin lives" |
| `npc_promote_to_agent` | star | veil 0.84 | star | Keep | — | "They have become visible to fate": Star |
| `rb.elite.frontier_defense` | iron | eye 0.965 | eye · eye · iron | Keep | — | Hardest step is the battle: "hold the frontier against the marching column" |
| `rb.senior.ambush_raiders` | iron | eye 0.95 | eye · iron | Keep | — | "Two arcs of fire": Iron |
| `reputation.stone.the_stones_judgement` | stone | eye 0.815 | stone · stone · stone · stone | Keep | — | Gated on Steadfast Builder; the ruling holds by "someone who had built as much" |
| `ruins.lead.cold` | eye | star 0.85 | eye | Keep | — | A formality roll over keeping a clue; the travel miss happened before the scene |
| `social.political_leverage` | shadow | eye 0.87 | shadow · heart · heart · shadow | Keep | — | Blackmail: "a favor whose existence was supposed to be private" |
| `star.turning.comet_omen` | star | veil 0.865 | star · star · star · star | Keep | — | The stake is "the fate of nations" |
| `tg.quest.case_the_mark` | shadow | eye 0.93 | eye · shadow | Keep | — | Decisive step: "timing the gap in the guard's circuit" |
| `tg.quest.fence_goods` | gold | eye 0.815 | gold · gold | Keep | — | Decisive step is haggling: "names a price… waits" |

### 3.1 What the 110 show

| Judged | Count | Judge right (Relabel to the judged Reach) | Relabel elsewhere | Step relabel / Prose fix / Keep |
|---|---|---|---|---|
| Eye | 67 | 5 (7%) | 0 | 62 |
| Any other Reach | 43 | 22 (51%) | 5 | 16 |

- **Eye is the judge's catch-all.** In 62 of 67 Eye calls the mortal notices, reads or plans on the way to a fight, a deal, a theft or a piece of craft, and Jev scored the noticing. Many of these are *also* prose fixes: the decisive step's own prose narrates watching or deducing instead of the act its Reach rolls (`encounter.prisoner_interrogation`, `cg.quest.break_up_brawl`, `encounter.caravan_guard`, `social.spy_on`).
- **Temple of Spheres had no Veil quest at all**, although Veil is its third Reach; its rites defaulted to Heart or Star. Five Temple rites move to Veil.
- **Star was used for "the sky" and for scholarship.** Canon Star is travel, fate, navigation, survival and long distance. The Easter reckoning pair (calendar arithmetic) moves to Eye; the comet omens stay Star because their stake is fate.
- **Legacy `encounter-content.ts` templates carry the loosest labels** — craft or endurance filed as Gold (`encounter.healers_oath`, `encounter.mend_fishing_nets`), a theft filed as Eye (`encounter.forbidden_tome`), and two legacy step aliases (`'spirit'` → Veil on `encounter.rally_faithful`, `'dominance'` → Stone on `encounter.council_mediation`), both of which this worklist replaces.

## 4. The coverage question gets a v2 before the next run

**Decided: yes.** A question whose most frequent answer is right 7% of the time is not ready to seed the next audit. Version 2 changes three things, bumps `ENCOUNTER_COVERAGE_QUESTIONS_VERSION` to 2 (`scripts/content-judgments/constants.ts:22`) and re-runs calibration on the same 64-entry sample (plan § Decision 5):

1. **The state gains the stakes lines** — `stakes.goal`, `stakes.risk`, `stakes.won`, `stakes.lost`, which are player-facing (the encounter's stakes line) and which the readers leaned on more than any other field. They go first, ahead of the description, so a truncated state still carries them.
2. **The Reach instruction separates setup from the test.** Appended to both `reach` and `reach_rev`: *"If the mortal only notices, reads or works something out in order to set up a fight, a deal, a theft, a rite or a piece of craft, judge that later test, not the noticing."* Option lists and canon lines are unchanged.
3. **A step-level check, in code, no model:** a new deterministic pre-check, `template_reach_unrolled` — the template's Reach is rolled by none of its steps (today: `hod.senior.inquisition`). It sits beside `out_of_eight_reach` in the report.

**Not in v2:** a per-step Reach question. It would multiply requests by the step count (2.3× on the 110: 16 one-step, 56 two-step, 30 three-step, 8 four-step) for a signal the readers found mostly in the decisive step's prose, and the step-relabel class is small (6 of 110). It is the next lever if v2's precision on Eye stays under the calibration target. **The kind and category extension** the plan names (Decision 3, follow-on sequencing) stays with v2's ticket, but only for the activity axis and only once it calibrates — it was uncalibrated on v1 (report header), so every activity answer still routes to review.

## 5. The three proof templates outside the Eight

`src/data/effect-shell-proof-templates.ts` is live content — spread into the main list at `unified-action-templates.ts:5992` — not a test fixture, and its two invented Reaches fail the `ReachDomain` type (`src/types/traits.ts:70-72`). Each takes the Reach its own prose names, on the template and every step:

| Template | Today | Decided | Why (its own words) |
|---|---|---|---|
| `encounter.shell_proof.fate_card_trial` | `resolve` | **Stone** | "endure the ordeal until the card turns" — endurance |
| `encounter.shell_proof.reckless_wager` | `resolve` | **Star** | "decided the moment the dice leave the hand" — fate |
| `encounter.shell_proof.tiered_proving` | `combat` | **Iron** | a proving ground, sphere Force — martial |

The wager also declares `sphere: 'fortune'`, which is not one of the Twelve; it takes **Chaos**, the Foundation sphere of chance. (Its seeded reward behaviour is unaffected: the proof exercises shell primitives, not the sphere.)

## 6. What ships, and what the catalogue looks like after

Template Reach counts over the 587 judged entries, before → after the 32 relabels and the 3 proof templates:

| Iron | Gold | Shadow | Veil | Heart | Eye | Stone | Star | outside the Eight |
|---|---|---|---|---|---|---|---|---|
| 120 → 117 | 75 → 73 | 66 → 67 | 43 → 48 | 82 → 79 | 100 → 100 | 51 → 58 | 47 → 45 | 3 → 0 |

The largest move is Stone, +7. No Reach loses more than 3.

Builds (all in Content Architecture, each claimable after the veto day):

1. **Reach relabels** — the 32 relabels, 6 step relabels and the § 5 proof templates, with any reward tag that names the old Reach (`encounter.garrison_gossip`'s `#heart`) and any stamped `consequenceDraw` re-stamped in the same change. It closes this audit's ticket.
2. **Prose fixes** — the 35 rows marked Prose fix, written to the GM-narration register; Reach fields untouched.
3. **Coverage questions v2** — § 4, then a re-run whose report lists new and resolved findings against this run.

## 7. Would change the call

- Christian saying a faction's Reaches are flavour, not a constraint → the three faction prose fixes in § 2.1 become relabels.
- Christian saying a god card's encounter should test what it tests, not echo the card → the three governance templates move to Heart outright.
- The v2 re-run still flagging a relabelled entry with high confidence on a third Reach → that row is re-read, not re-labelled automatically.
