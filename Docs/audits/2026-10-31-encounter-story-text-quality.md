> **title:** Encounter story text quality — what the player reads, what is wrong with it, where it comes from — THR-2105
> **linear_issue:** THR-2105
> **author:** Claude Code (design lane, run 2026-10-31b, unattended)
> **created:** 2026-10-31
> Plan-size-exempt: an audit with quoted evidence per pattern and one row per writing check (THR-2105 Done-when 1 and 1b); the fix lives in its own slice plan.

# Encounter story text quality — THR-2105

*Three of every four encounters a player meets are old board encounters that the 2026-08-25 prose rewrite never reached. That is where the quality problem is, and none of the writing checks can see it.*

## How this was read

**What was read.** The player-facing text of 136 encounter templates, in reading order: description, stakes line, openings, each step's prose, the five result lines (success, failure, at cost, critical success, critical failure), card names and effect lines, card band prose, outcome chips and aftermath pages. Tokens such as `{actor}` were left visible. The dump came from the same `authoredProse` reader `check:encounter` uses (`src/data/content-eval/compositionContract.ts:1925`), so it covers every runnable step including branch arms.

- **The 60 most-met templates** (demand ranks 1–60 on the 2026-09-28 attended census, 51% of all firings), read closely, all 60.
- **76 hand-carrying templates outside that ranking**, mostly written by the Encounter Factory since August (`encounter.town.*`, `encounter.company.*`, `encounter.slice.*`, border/delve/hunt, apotheosis). About 50 read closely, the rest skimmed for the same patterns.

Five readers graded against one rubric, Prose Doctrine v2 as written (`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` § Prose doctrine v2 and § The communication pivot), plus Christian's earlier verdicts. Every pattern below was re-checked against source before it went in. Three reader findings were **dropped** because they contradict an agreed rule; they are listed at the end.

**Demand, re-measured today.** A fresh attended census on `main` @ `126665db` (`readers/attended.ts 42,99 150`, the `?view=game&seeded&size=medium` world, 150 ticks, both seeds): **1,690 encounters fired across 219 templates.**

| Where the text comes from | Encounters met | Share |
|---|---|---|
| The old board, `src/data/encounter-content.ts` (168 templates, 114 fired) | 1,259 | **74.5%** |
| Factory-era town / company / slice templates | 224 | 13.3% |
| Everything else (quests, rivals, routes, factions …) | 207 | 12.2% |

Of all 1,690, **1,332 (78.8%) land on a template with no doctrine opening at all**: no arrival line, no named place, no situation paragraph. The ten most-met old-board templates alone carry 22.6% of everything the player meets; the top twenty carry 37.6%.

## The headline

The factory-era text mostly holds the doctrine. The old board does not, and the old board is most of the game. Since 2026-08-25 the work went into the factory corpus (THR-1223 rewrote "the nudge corpus", the templates with a hand). The old board got only its missing at-cost and critical result lines from THR-1634, written plain. So **one encounter now speaks in two voices**: the new lines state what happened, and the old lines next to them read like a horoscope.

From `encounter.barter_supplies`, the single most-met encounter (44 of 1,690):

> *Step 2:* "Trust is the final currency. {actor} meets the trader's eyes, each measuring the other's intent."
> *Success (old):* "The exchange is done. Both parties walk away satisfied — rare enough to be worth remembering."
> *Critical success (new):* "The deal closes, and the trader adds a second sack of meal at no charge."

## The failure patterns

Counts are template ids read, not estimates. "Met" is today's firings on those templates.

### P1 — The old board's step prose and result lines are pre-doctrine mood writing

**What it is.** Step prose opens on a maxim instead of a situation, and the success/failure result lines are fragments, verdicts and aphorisms instead of stated events. Doctrine: *"State facts — never encode them"*, *"Everything serves challenge → test → outcome"*, subject–verb–object, one fact per sentence.

**Count.** 36 of the 51 old-board templates in the top 60, met 695 times today (41% of all encounters) (barter_supplies, decipher_old_markings, commune_with_stars, tend_the_weary, barter_with_travelers, local_tales, study_surroundings, assess_holdings, forage_provisions, forage_the_land, rest_and_recover, dead_drop, trace_ley_lines, shore_up_shelter, listen_for_rumors, trade_caravan_escort, patrol_perimeter, mend_equipment, night_watch, plague_outbreak, rally_the_locals, confront_the_unknown, guild_initiation_trial, honor_duel, case_the_joint, knowledge_test, recruit_militia, trial_by_combat, barter_survival, court_noble, compose_saga, tavern_brawl, shadow_hunt, guild_aid, raise_monument, local_gossip).

**Examples.**
- `assess_holdings` step 1: "{actor} lays out every coin, every scrap of value. The arithmetic of survival."
- `forage_provisions` success: "Arms full, {actor} hauls {their} findings back. Not a feast — but enough. Always enough."
- `decipher_old_markings` success: "The markings resolve — a trader's waypoint, a miner's claim, a warning from another age. Knowledge earned."
- `patrol_perimeter` step 1: "Vigilance is mostly routine, and the routine is mostly walking."
- `tend_the_weary` failure: "The weary one flinches away. Some wounds are too raw for a stranger's touch."
- `rally_the_locals` success: "{actor}'s words move through the crowd like warmth through cold hands."

**Where it comes from.** `src/data/encounter-content.ts`: each entry's step `narrative` and `onSuccess.narrative` / `onFailure.narrative`. Written before the doctrine and never rewritten. The THR-1634 lines beside them (`successAtCostAfterimage` and the two critical lines) are plain, which is why the voice splits mid-encounter.

**What the player gets.** The roll lands and the result says how to feel ("Fair dealing", "Always enough") instead of what changed.

### P2 — Clever specificity: measured counts, paces and narrator wit

**What it is.** The residue the doctrine names by hand in its second exemplar: *"measured counts ('ten counts'), paces ('three paces out'), and writerly participles … read as literary even when every fact is stated."* Plus wry asides the reader has to decode.

**Count.** 28 templates. 23 on the old board's top 60: pickpocket, festival_of_spheres, investigate_anomaly, shadow_in_the_night, tribute_exchange, vault_heist, local_gossip, master_craftsman_challenge, merchants_gambit, smuggle_goods, steal_secrets, honor_duel, knowledge_test, recruit_militia, compose_saga, case_the_joint, shadow_hunt, raise_monument, court_noble, trial_by_combat, barter_survival, guild_aid, aid_refugees. One merchant quest, `mct.quest.market_survey` ("Six stalls, three price drifts, one signal"). In the factory corpus: the four `encounter.company.*` templates ("forty paces", "eleven minutes", "eleven nights").

**Examples.**
- `vault_heist` step 2: "{actor} goes down it in the ten breaths between the bell and the relief arriving."
- `pickpocket` step 3: "The purse sits four inches down, and the cloth is stiff enough to hold its shape once the weight is gone."
- `knowledge_test` failure: "By dawn {they} can name eleven books that do not hold the answer."
- `guild_initiation_trial` step 1: "The sand has not been swept since the last candidate, which is not an oversight."
- `honor_duel` step 1: "The noble makes it loud enough to carry and light enough to deny, which is the craft of it."
- `merchants_gambit` success: "They sign, because arithmetic is harder to argue with than pride."

**Where it comes from.** A later rewrite of part of the old board (still `encounter-content.ts`), done to the pre-doctrine "be specific" rules that v2 retired, and the factory's `company` brief. Every number is spelled out, so the no-numerals rule never fires.

**What the player gets.** Every line is a small puzzle about tone before it is a fact about the scene.

### P3 — Encoded facts: lines that need two readings

**What it is.** The fact is turned into an image the player has to decode. Doctrine: *"a sentence that needs two readings is a defect"*.

**Count.** 17 templates: investigate_anomaly, commune_with_stars, vault_heist, offer_small_prayer, tribute_exchange, scout_the_perimeter, ward_the_camp, rest_and_reflect, swindled_family, bargain_at_crossroads, and seven slice templates with the "X held. Y did not." turn (unsafe_bridge, snow_on_the_pass, riders_behind_caravan, full_moon_collection, full_moon_reckoning, grateful_kin, the_table_that_holds).

**Examples.**
- `investigate_anomaly` success: "What passed through this room did not touch the floor, and the air has been holding its shape ever since."
- `vault_heist` failure: "The plan has a hole in it shaped like a door."
- `ward_the_camp` card band (failure): "The dark sat back and waited, and the line failed on its own without any help from it."
- `bargain_at_crossroads` card band (critical failure): "…slightly too much crossroads and slightly too little man."
- A house tic in seven `encounter.slice.*` templates: "The nerve held all night. The wood did not." · "Their footing never failed. A plank did." · "The nerve held through the greeting. The parcel's weight undid it."

**Where it comes from.** Factory drafting (the prayer/scout/ward/rest band prose and the slice tic) and the old board (investigate_anomaly, commune_with_stars, vault_heist).

**What the player gets.** They cannot tell what was found or what went wrong.

### P4 — Long in-scene novel prose with the god as a character

**What it is.** Steps of 190–300 words in past tense, inside the scene, with the god perceiving and acting. Doctrine rule zero: *"narrate, never inhabit"*. The god *"sways, never decides"*.

**Count.** 5 templates: `crafting.quest.flawed_steel`, `stone.permanence.mason_lord_wall`, `star.turning.comet_omen`, `veil.truth.page_beneath_saint`, `encounter.apotheosis.ascension`. Met today: 15 of 1,690 (0.9%, all `flawed_steel`); on the September run four of them were met 81 times of 1,542. Which story beats fire swings between runs.

**Examples.**
- `flawed_steel` step 1: "The first thing the god noticed was the sound … the absence of its rhythm left a gap in the settlement's morning like a missing heartbeat."
- `comet_omen` step 2: "The god opened the prophet the way one opens a window onto a height."
- `apotheosis.ascension` step 1: "…the boundary between worshipper and worshipped had gone thin as wet paper. The god could see through it."

**Where it comes from.** Pre-doctrine quest and story-beat files in `src/data/encounters/` (`flawed-steel.ts`, `the-wall-of-the-mason-lord.ts`, `the-comet-at-the-turning.ts`, the veil story beat) and an early factory run (apotheosis). `comet_omen` and `page_beneath_saint` also repeat an aftermath variant word for word.

**What the player gets.** A wall of literary text before a single test, sometimes narrating the result before the roll.

### P5 — Missing result lines: the at-cost and critical bands fall back

**What it is.** Steps that carry only the success and failure lines. Doctrine § What survives: *"six-band coverage … unchanged"*.

**Count.** 7 of the top 30 (festival_of_spheres, investigate_anomaly, dead_drop, tribute_exchange, vault_heist, and step 1 only of master_craftsman_challenge and mason_lord_wall). None of them is in `FIRED_TEMPLATE_COMPLETION` (`src/data/content-eval/firedTemplateCompletion.ts`). THR-1634's slices finished the twenty-nine it listed, and these sat just outside.

**What the player gets.** An at-cost roll shows a plain success line, so the cost the dice paid is never told.

### P6 — Card effect lines that state strength instead of the effect

**What it is.** The effect line ends with a strength verdict ("A small help.", "A real help.", "Strong help.", "A steady help, and it costs no essence."), or talks about the game rather than the world ("Rival gods can hardly miss a hand this heavy.", "No essence changes hands"). Doctrine § The communication pivot: the effect line has *"no meta-commentary about effort or odds — the pip row carries magnitude"*.

**Count.** 121 effect lines across 13 files: `encounter-content.ts` 72, `company-drama.ts` 20, `apotheosis-ascension.ts` 5, the golden exemplar 5, and 1–3 each in assize-letter, border-levy, court-summons, crowns-reckoning, keepers-petition, ledger-by-lamplight, masons-commission, tithe-demanded and well-sinking (a case-insensitive grep of the six tags: a small help, a real help, good help, strong help, a steady help, a small push).

**Examples.**
- `scout_the_perimeter` card: "A steady help, and it costs no essence."
- `rest_and_reflect` card: "Strong help. There is more night to sleep in."
- `masons_commission`: "Soften the topsoil in their pit, so the spade reaches the layer beneath it early. A small help."

**Where it comes from.** **The factory's golden exemplar.** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts:218-348` carries "A small help." and "A real help." on four cards, and opens each line in the second person ("You settle their nerve…"). `check:encounter` imports this exemplar as the model (`scripts/check-encounter.ts:112`). Christian approved it on 2026-08-09 ("looks fine"), sixteen days before Doctrine v2 retired both habits. The doctrine's own approved card register (Steady Grip, Bind Outcome, Banish Fear) has neither.

**What the player gets.** The card repeats what the pips already say, and does not say what the god does.

### P7 — Pronoun seams that break grammar

**What it is.** `{they}` followed by a present-tense verb with no `{s}` agreement token. For a mortal whose pronoun is "he" or "she", the screen prints "There he find a magic relic".

**Count.** Seven sites. Five templates copy the doctrine's own example: `border.the_unclaimed_relic`, `delve.the_broken_seal`, `delve.the_drowned_archive`, `delve.the_unfinished_rite`, `hunt.the_beast_in_the_granary`. The approved spine in the doctrine itself reads "There \{they} find a magic relic" (spec line 1024), and these templates copied it. One more outside encounters: `src/data/narrative-content.ts:283`, "what {they} leave behind". Plus one missing space after a conditional block in `investigate_reputation` ("…the straight read.{/has_ally}What {they} find{s}").

**Where it comes from.** A composition seam (`src/engine/proseEnrichment.ts:905-912` substitutes `{they}` and `{s}` independently) copied out of the exemplar text.

### P8 — Factory text: role nouns, repeated stake lines, and descriptions that give the answer away

These are narrower, in the factory town corpus (49 `encounter.town.*` templates read), which otherwise holds the doctrine well.

- **The actor named by a role noun** ("the master", "the marshal", "the sin-eater") in result lines, 9 templates. Example, `returned_heir` at cost: "…and the uncle called the master bought." Doctrine: *"the agent is always named"*. Source: the town-job brief, where the actor is a craftsman sent for by name.
- **One stake line, many encounters.** The failure overview "A master sent for by name is judged by…" appears in 14 town templates. "If not, {location} will think less of {actor}." ends step 2 in 9. Source: the factory's own drafting. The player reads the same sentence on every town job.
- **Descriptions that state the secret** step 1 exists to find, 5 templates. `tithe_barn_raid`: "The grain went to the hungry houses, and the elder who took it is still moving it." Source: the factory's brief-to-description step.
- **Hard-coded pronouns where a second person is on stage**, 4 templates. `pawnbrokers_strongroom` step 2: "The pawnbroker says the cooper missed a payment, which frees him from his word." Either man can be "him".

### What good looks like (the bar, from this read)

- `trade_caravan_escort` critical failure: "The ambushers cut the lead wagon loose and drive it off. {actor} is knocked down in the fight, and the caravan loses its best goods and two guards."
- `commune_with_stars` critical success: "The omen names its danger plainly: an early frost. {actor} can warn the farmers before it comes."
- `swindled_family` step 1: "A family with a handcart is walking east: a man, a woman, three children. A swindler sold them a deed to good land that way, and they hold the paper out proudly. East of here is only a salt fen."
- `fugitive_friar` step 1: "The bishop has condemned a friar for preaching against the tithe. The friar escaped his guards. The watch has shut the gates and is searching the town house by house."
- `hunt.the_beast_in_the_granary` card: "Open the far door from the inside and let the night in — the bear will go toward the cold."

## Findings dropped because an agreed rule decides them

- **"Stock reputation chips"** ("{location} thinks well of their work", "{actor} is pursuing Build a Great Work now", "{cast:heir} is Wounded"). Christian ruled on 2026-08-23 that a chip states the exact game effect in core words, and on 2026-09-12 that chip nouns are character-sheet words. The repetition is the rule working.
- **At-cost chips that match the win chips.** Same ruling: a cost alongside a gain is *"its own scar/toll chip, or prose only"*. The cost lives in the overview, where these templates put it.
- **"The step-0 opening escapes the 80-word budget."** It does not. `templateOpeningProblems` (`src/data/content-eval/doctrineV2Checks.ts:303`) measures the opening and step 0 composed together.

## The writing checks, against these examples (Done-when 1b)

**This section describes. It does not decide.** What to add, fix or retire is the conversation in [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106). Measured on this worktree: `npm run check:encounter -- --all` (264 `encounter.*` templates, 237 `[warn]` lines), and the two manual scorers driven over the real corpus (1,008 prose entries via `collectAuthoredProse` → `scoreProseEntry`).

**Four facts that shape the whole table:**

1. **The doctrine checks never reach the most-met encounters.** They read card names, `openings` and `aftermathConfig`. None of the ten most-met templates has any of those, so doctrine v2 reaches 75% of what the player meets through no check at all.
2. **`check:encounter --all` sweeps only ids that start `encounter.`.** `crafting.quest.flawed_steel` (P4, the most-met quest) is outside it. Run by id, it fails four ways.
3. **`npm run eval:prose` with no arguments scores eleven built-in fixtures**, not the corpus. For old-board templates the scorer reads `name`, `narrative`, `success` and `failure`, not the result lines. All nine old-board templates in today's top ten score 100.
4. **One doctrine rule has no code.** "A card's effect line never repeats a word from the card's name" (spec line 1019) exists only in the spec and in file-header claims. No check in `src/data/content-eval/` tests it.

| Check | What it actually flags | Verdict | Evidence from this read | Hits |
|---|---|---|---|---|
| Card-name shape (`doctrineV2Checks.ts`) | Name opens with a word on a fragment list, or not on an imperative-verb allowlist; over 4 words | **Catches**, and **gets in the way** | Catches "The Dark Behind", "Nothing Breaks Tonight", "What They Are For" (company, apotheosis). Flags good spell names because the verb is not on the allowlist: "Brace the Hinge", "Hear It Out", "Price It Out", "Let It Wait" | 16 (about 9 real, 7 good names rejected) |
| Opening skeleton + 80 words (same file) | Composed opening + step 0 outside 3–4 paragraphs, over 80 words, or P1 naming no place | **Catches**; **misses** the 75% with no opening | Over-budget openings run median 101, max 186 words. Blind to clause-stacked sentences under the line: `slice.riders_behind_caravan` "…and the traveler — last to join, a stranger to every face — is the one walker he can rule out" | 45 (31 length, 14 no place) |
| Chip ≤15 words, chip retells overview (same file) | Word count of cause + detail; any 4-word run shared with the overview | **Catches** (the most useful warning in the set) | `scout_perimeter.on_the_roster` repeats its overview word for word; `company.gate.the_arch_holds` 34 words. **Misses** mood chips under the line: `ward_camp.kept_ward` "The veil sits close and friendly around them, and will for a while yet." | 125 (102 length, 23 retell) |
| Effect line repeats a word of the card name | — | **Misses: no code exists** | `prayer.open_the_ear`: "Strong help. The prayer lands on an ear." · `bell_at_the_exchange` "Cloud The Count": "Cloud the rival buyer's count of the bids…" | 0 (unchecked) |
| Vagueness lexicons + detectors (`nudgeAuditDetectors.ts`) | Banned vague words (outcome text also bans way, nothing, someone, thing), not-X-but-Y, second person, thin premise, divine outcome-authorship, intensifiers | **Catches**, **gets in the way**, **misses** | Catches `rally_the_locals` "not because they were told to, but because they decided to". Gets in the way: 61 of 73 intensifier hits are "rather than"; outcome `way` 66 hits ("on the way out"), `nothing` 36 ("leaves the stall with nothing for the day's work"). These are plain facts a v2 writer wants. Misses every P1/P2 line above. `someone` is banned only in outcome text, so "Someone nearby is struggling" (step 1, `tend_the_weary`) passes | 5 register fails, 47 intensifier warns |
| Designer-voice description (`descriptionVoice.ts`) | Spec words in `description` (two-step, the mortal, sequel, #tag …) | **Catches** the THR-1739 class (corpus now clean); **misses** the god's lever and the spoiled secret | `slice.snow_on_the_pass` "the god can press the traveler toward speed, or toward shelter"; `tithe_barn_raid` gives away step 1's answer (P8) | 0 of 264 |
| Stakes-line rules (`encounterStakesRules.ts`) | Shape only: case, punctuation, length caps, banned words, missing parts | **Catches** shape; **misses** meaning | `won`/`lost` often repeat `goal`/`risk` word for word (`market_day_festival` "turned a festival stranger into a contact"). The stake and the result line can disagree: `night_watch` risk "sleep while a thief walks through camp", lost "woke the whole camp shouting at a noise" | 0 |
| Aftermath page overlap (`aftermathPage.ts`) | Shared 4-word runs between page blocks other than overview↔chip | **Silent** on this corpus | No finding anywhere; the overview↔chip pair is the chip check's | 0 |
| Prose-quality score (`proseQualityRubric.ts` → `proseQualityScore.ts`, manual) | Per line: no `{token}` −25, "felt X" −12, flowery and probability words, sentence cap 3 | **Gets in the way**, **misses** | The lead the ticket named is real but small: only literal "felt <emotion>" is docked ("{actor} felt relieved" −12); "{actor} is shaken for days" scores 100. The bigger conflict is the **static-string −25**: plain token-free narration, which v2 asks for, is docked ("The trader takes the offer. The deal is done." → 75 warn; 746 such flags, many on factory-era text). The sentence cap docks one-fact-per-sentence prose (`border.standing_the_line`, four short sentences). "chance" fires on "chancery" six times in `town.salt_monopoly` | Corpus: 520 pass / 192 warn / 296 fail |
| Register compliance (`registerRubric.ts` → `registerCompliance.ts`, manual) | Mean sentence length, ornate words, figurative images per paragraph | **Catches**, aligned with v2 | `company.third_watch` 27.2 words per sentence (fail); `sacred_offering` two similes in one paragraph | 114 warn, 6 fail |
| Editorial critic (`agents/editorial-prompt.md`, LLM) | 7 auto-REVISE triggers, 14 yes/no gate questions | **Catches**, aligned with v2; **misses** everything outside the factory | Trigger 5 is v2-correct: "A direct, briefing-shaped account that names the stakes is the *standard*". No retired v1 rule remains. It reviews factory drafts only, so the old board never meets it | n/a |
| Reach/sphere judgments (`scripts/content-judgments/`, LLM) | Typed Reach, Sphere, walk-of-life and tag-fit answers | **Does not judge prose** | `encounterQuestions.ts` holds only Reach, Sphere and tag questions | n/a |

**Patterns no check flags** (from the failure patterns above): P1 mood lines, P2 measured counts and wit, P3 encoded lines, P5 missing result lines on templates outside the completion list, P6 strength tags on effect lines, P7 pronoun seams, P8's role nouns and repeated stake sentences, and a stake line that disagrees with its own result line.

## Where the fix lands

| Pattern | Met today | Fix at the source |
|---|---|---|
| P1 old-board mood writing, P2 clever specificity, P5 missing lines | ~75% of all encounters (the old board) | A rewrite wave of `encounter-content.ts` in demand order. Nothing new is authored into this file, so a rewrite is the source fix |
| P6 strength tags on cards | 121 lines; the factory copies them | The golden exemplar first (the factory's model), then a sweep of the rest |
| P7 pronoun seams | 7 sites | The exemplar text in the spec, then the six live sites |
| P3 encoded lines, P8 factory habits | ~13% (factory) | The factory's brief and drafting prompts, plus the templates named |
| P4 novel prose | 0.9% | Rewrite the five templates; no chain source left |

Changes to the checks themselves wait for the discussion in [Writing evals — with Christian, decide which checks to add, fix or retire](https://linear.app/threadbare/issue/THR-2106).
