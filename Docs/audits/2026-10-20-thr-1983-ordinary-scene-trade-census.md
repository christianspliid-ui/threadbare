> **Census for THR-1983** (*Ordinary scenes still hand The First a trade she never had*), milestone *Cold playtest · round 4*. Design lane run 2026-10-20a, unattended, under process.md rule 4. The census was gathered by a research subagent and spot-checked by the lane against `origin/main` @ `0d34850b`. The keep / phrase / gate calls are the lane's, made by delegation, and Christian can veto them in chat.

# Ordinary scenes that hand the protagonist a trade — census and calls

## The question

[The First keeps her trade](../plans/2026-10-18-thr-1982-the-first-keeps-her-trade.md) (THR-1982, build THR-1984) makes the meeting write The First's trade (`npcRole` + `tradeWord`). It also gates the five regional chapters whose premise is a job behind a new `protagonistRoles` field. Ordinary scenes were left out of that plan. One of the three round-4 recasts lives among them: a healer First was handed iron stock by "Apply to the Fellowship". This census lists every ordinary template whose **protagonist** prose names a trade, and makes one call for each.

## Method

- **Scope.** 171 content files: the encounter and faction content files under `src/data/` plus everything in `src/data/encounters/`. Tests, fixtures, examples and `content-eval` were excluded. The five THR-1982 chapters were excluded (list at the end).
- **Searches.**
  - P1: a protagonist token (`{name}`, `{actor}`, `{they}`/`{their}`/`{them}`, "the candidate", "the applicant", "the recruit", "the initiate", "the novice") on the same line as a trade noun from a list of about 70. **432 lines.**
  - P2: a possessive followed by a trade noun ("{their} shop", "her patients"). **24 lines.**
  - P3 to P5: appositive and "as a <job>" shapes. **8 lines.**
  - P6: stakes and label fields that carry a trade noun. **116 lines.**
  - P7: the factory encounters' `Whose problem?` design headers. **37 files.**
  - P8: an id / name / initiation survey of every faction template and all 169 `encounter-content.ts` templates, to catch premises whose trade noun sits on a different line from the protagonist token.
- **Filtering.** Of the 432 P1 lines, 39 carry `{cast:…}` tokens, so they describe a bound cast member, not the protagonist. About 400 lines in all name NPCs, name institutions, or describe plain actions any mortal can take. None of those is listed.
- **Spot-check.** The lane re-read four rows against source: #6 `encounter-content.ts:1015-1024`, #8 `:2578`, #15 `encounters/masons-commission.ts:119-120` and #13 `encounters/cathedral-vault.ts:131-132`. All four quotes match.

### Gating facts that decide the calls (measured)

- **Standard faction quests and socials are not membership-gated.** Only `senior` / `elite` / `leadership` work is rank-gated (`encounterFilterPipeline.ts:124-127, 483-505`), and the rank gate shuts out non-members (`factionReputation.ts:192-200`).
- **`.join` templates check only `joinPrerequisites`** (`encounterFilterPipeline.ts:415-427`). The Builders Fellowship and the Mercenary Company declare none, so anyone can attempt their joins.
- **Promotions come only from an existing `member_of` edge** (`factionQuestGeneration.ts:376-381`), so a promotion's craft is earned in play.
- **The `encounter.town.*` factory encounters have no role or membership gate.** Each carries only `actorAffinities: ['individual']` and `locationSubtypes`, so any mortal strong enough in the Reach draws them.
- **No template uses `protagonistRoles` today.** Every role id named below is a real `NpcRole` (`src/types/npc.ts:34-92`).

## How the calls are made (decided by delegation)

The rule follows THR-1982's own principle: *the trade weighs, it does not wall*. A gate is the exception.

- **keep.** The trade is earned in play (the template needs membership), or the prose names only the institution ("sent by the order").
- **phrase.** The scene hires, summons or tests whoever is able. Rewrite the line so it no longer says she already works the trade. **Prefer neutral wording that needs no token** ("sent for someone who can read stone"). Use `{trade}` / `{?has_trade}` only where naming her real work improves the line.
- **gate.** The stake *is* her standing in the trade: her oath as a healer, her own congregation, a rival in her own trade, her name as a reader on trial, a master's trial of her craft. Add `protagonistRoles`. That gate is fail-open, so a mortal with no role still passes.

**Why this split.** A gate empties a scene for every roled mortal outside the list, ambient mortals included, not only The First. So a gate is used only where no rewrite could keep the scene honest. A summons ("sent for as master builder") is about the town needing a builder, so a rewrite keeps it true for anyone able. A trial of standing ("the loser's name as a star-reader will suffer") has no honest rewrite, because a stranger has no name to lose.

## Census — 28 templates

| # | Template | Where (main) | Quoted phrase | Call | Fix |
|---|---|---|---|---|---|
| 1 | `bf.join` *Apply to the Fellowship* (**the round-4 recast**) | `builders-fellowship-encounter-content.ts:1995`, `:1997` | "{name} is given iron stock…" · "Arriving with personal tools is expected at this level of craft" | **phrase** | "{name}{?has_trade} — a {trade}'s hands on iron stock —{/has_trade} is given iron stock…"; tools line → "Some candidates bring their own tools; {name}'s are noted without comment." |
| 2 | `mc.join` | `mercenary-encounter-content.ts:1530`, `:1575` | "asks one question about the last contract" | **phrase** | "…then asks what {name} did before{?has_trade} — {trade}, it turns out{/has_trade}." |
| 3 | `bf.quest.forge_tools` | `builders-fellowship-encounter-content.ts:421-422` | "The stock decides more than the smith." | **phrase** | "…The stock decides more than the hand on the hammer." |
| 4 | `bf.quest.craft_commission` | `builders-fellowship-encounter-content.ts:736`, `:739` | "{name} takes a decorative ironwork commission" · "has their name on it" | **gate** | `protagonistRoles: ['smith']`. A private buyer commissions a known smith's work. |
| 5 | `encounter.trial_of_flame` | `encounter-content.ts:568`, `:578` | "The master smith arrives… {actor} is asked to make it a weapon again" · "a chance at mastery" | **gate** | `protagonistRoles: ['smith', 'spellsword', 'warmage']`. This is a mastery trial of a forge craft. |
| 6 | `encounter.healers_oath` | `encounter-content.ts:1015-1024` | name "The Healer's Oath" · "the sickness they fought all month" | **gate** | `protagonistRoles: ['healer', 'alchemist', 'priest', 'acolyte', 'monk', 'chaplain']` |
| 7 | `encounter.healer_aid` | `encounter-content.ts:4235` | "the ones who cough are not the ones who worry {actor} most" | **phrase** | Make her the extra pair of hands: "…and the healer on duty puts {actor} to work where the worry is." |
| 8 | `encounter.rally_faithful` | `encounter-content.ts:2578` | "{actor} has one sermon in which to turn attendance into intent" | **gate** | `protagonistRoles: ['priest', 'acolyte', 'chaplain', 'pilgrim', 'warrior_priest', 'paladin', 'monk', 'oracle']` |
| 9 | `encounter.the_loan` | `encounter-content.ts:5898` | "{actor} can extend a loan to a desperate borrower" | **keep** | Anyone with Means can lend. Since [mortal wealth](../plans/2026-10-15-thr-1936-mortal-wealth.md), that is true of any mortal, and no trade is named. |
| 10 | `encounter.labor_dispute` | `encounter-content.ts:5696` | "{actor}, whose authority over the mine is now on trial" | **phrase** | "…presents their grievances to {actor}, the one the miners have agreed will hear them." |
| 11 | `encounter.master_craftsman_challenge` | `encounter-content.ts:6365` | "a commission every other craftsman has turned down" | **phrase** | "…every craftsman in {location} has turned down. {actor}{?has_trade}, a {trade} by training,{/has_trade} reads the drawing twice…" |
| 12 | `encounter.hedge_remedy` | `encounter-content.ts:12530` | "{actor} knows the limits of hedge magic" | **phrase** | "{actor} has found the limit of what a hedge remedy can do, and does not pretend otherwise." |
| 13 | `encounter.town.cathedral_vault` | `encounters/cathedral-vault.ts:131-132` | "sent for as master builder" | **phrase** | "…arrives at the abbey, sent for because the master builder is dead and the vault will not wait." |
| 14 | `encounter.town.hill_conduit` | `encounters/hill-conduit.ts:148-149` | "sent for as a master builder" | **phrase** | Same shape as #13: the town needs a builder's eye, and she is the one who came. |
| 15 | `encounter.town.masons_commission` | `encounters/masons-commission.ts:119-120` | "will let the rebuilding to one mason today. A rival mason has already bid lower." | **gate** | `protagonistRoles: ['mason']`. The rival bid is a contest inside the trade. |
| 16 | `encounter.town.flood_dyke_mending` | `encounters/flood-dyke-mending.ts:409`, `:674` | "the reeve sends for a mason" · "sent for a mason to save the dyke" | **phrase** | "sends for someone who can read stone" / "sent for help to save the dyke" |
| 17 | `encounter.town.well_sinking` | `encounters/well-sinking.ts:120-121` | "comes into {location} to sink a new well" | **phrase** | "…comes into {location}, hired by the reeve to sink a new well." |
| 18 | `encounter.town.boundary_survey` | `encounters/boundary-survey.ts:261`, `:477`, `:504` | "sent for a surveyor" · "a sworn surveyor" | **phrase** | "sent for someone to walk and swear the bounds" (same wording at all three lines) |
| 19 | `encounter.town.tourney_marshal` | `encounters/tourney-marshal.ts:91`, `:675` | "arrives in {location} as marshal of the town's tourney" | **phrase** | "…where the town has asked {actor} to marshal its tourney." A one-day office the town gives, not a trade. |
| 20 | `encounter.town.comet_disputation` | `encounters/comet-disputation.ts:143`, `:146` | "named {actor} a false reader" · "the loser's name as a star-reader will suffer" | **gate** | `protagonistRoles: ['oracle', 'sage', 'scholar', 'researcher', 'hermit', 'pilgrim']` |
| 21 | `encounter.town.drowned_mans_testimony` | `encounters/drowned-mans-testimony.ts:133` | "sent for {actor}, the best dream reader in the district" | **phrase** | "sent for {actor}, who is said to read dreams truly". The stake is the dream, not her name. |
| 22 | `encounter.town.harvest_almanac` | `encounters/harvest-almanac.ts:76`, `:196` | "asks a star-reader" · "send for a reader" | **phrase** | "asks someone who can read the sky". The step already says "asks {actor} to read the sky" (`:75`). |
| 23 | `encounter.town.pilots_reckoning` | `encounters/pilots-reckoning.ts:135` | "comes looking for a star-reader" | **phrase** | "comes looking for anyone who can check a star table" |
| 24 | `encounter.town.cunning_fair` | `encounters/cunning-fair.ts:135` | "loses trade in {location}" | **phrase** | "loses face in {location}" |
| 25 | `encounter.town.ducal_nativity` | `encounters/ducal-nativity.ts:522` | "A reader who saw a hard star…" | **phrase** | "Someone who saw a hard star rise at the heir's birth…" |
| 26 | `encounter.town.bloodletting_hour` | `encounters/bloodletting-hour.ts:117` | "from the tables in their almanac" | **phrase** | "from the tables in the household's almanac" |
| 27 | `encounter.town.oath_breaker_rite` | `encounters/oath-breaker-rite.ts:66` | "asks {actor}, a reader of oaths" | **phrase** | "asks {actor}, who has a name for reading oaths" (or drop the appositive) |
| 28 | `encounter.town.sin_eater` | `encounters/sin-eater.ts:57-60` | "paid for a sin-eater… A sin-eater who leaves a sin on the dead is not sent for again." | **phrase** | "…has paid {actor} to eat the sins, as the old custom asks of whoever will." No `NpcRole` is a sin-eater, and the custom hires the poor and the willing. |

**Totals: 6 gate · 21 phrase · 1 keep.** Of the 21 phrase rows, 3 use the `{trade}` / `{?has_trade}` token (#1, #2, #11); the other 18 are neutral rewrites that need no token.

The research pass left 13 calls uncertain; the lane settled each one above by the rule in § How the calls are made. The six gates: #4, #5, #6, #8, #15, #20. Two calls moved against the research pass's leaning: #9 (the loan) became keep, because mortal wealth now gives every mortal Means to lend; #28 (sin-eater) became phrase, because the custom has no role to gate on.

### Checked and kept (not listed above)

- **Promotions, and senior / elite work.** All of it requires membership: `bf.promotion` (`builders-fellowship-encounter-content.ts:2083-2084`), and `rb.elite.frontier_defense` ("the only senior ranger", `rangers-brotherhood-encounter-content.ts:1515`).
- **The other ten joins.** `ac`, `cg`, `ag`, `hod`, `lk`, `mct`, `rb`, `ts`, `tg` and `uk` already write the candidate as an outsider.
- **About 100 standard faction quests and socials.** They say "{name} is sent by the order", naming the institution, not a trade. They are not membership-gated, which is a separate question outside this census.
- **Generic "sent for a master" scenes.** `easter_reckoning`, `restless_ossuary`, `silver_drift_rescue`, `witch_trial`, `forged_charter_inquest`, `returned_heir` and `judicial_duel` name no trade.
- **Institutional dispatch.** `wool_staple`, `salt_monopoly`, `mill_lease_auction`, `feud_mediation`, `granary_riot`, `counting_house_dispute`, `toll_gate_writ` and `inheritance_wake`.
- **Outsider framing already present.** `bell_tower_shoring` (`:211`) and `master_local_craft`. **Earned in the scene:** `merchants_gambit`, `caravan_guard` and `debt_collection`.
- **Similes.** `encounter-content.ts:4317`, `social-encounter-content.ts:1736` and `arcane-circle-encounter-content.ts:376`.
- **Membership branches.** Text inside `{?has_faction}` (`tavern-encounter-content.ts:269`, `:629`).

### Excluded — the five THR-1982 chapters

`the-page-beneath-the-saint.ts`, `the-comet-at-the-turning.ts`, `the-verdict-that-burns.ts`, `the-wall-of-the-mason-lord.ts`, `the-granaries-in-the-famine-year.ts` (THR-1982 plan § Five chapters keep their job).

## Gap in THR-1982's content test

THR-1982's guard test flags a template whose initiation opens "A threaded " or whose choices carry `targetLabel: 'The <word>'`. **None of the 28 rows above matches either shape.** Most are factory encounters that cast the actor through an arrival line or a "sent for as …" clause. So the implementation ticket pins this census: a test lists the six gated ids and asserts each declares `protagonistRoles`, and it asserts that each quoted phrase of the 21 phrased rows no longer appears in its file. A general detector for "the protagonist is cast as a job" would be fragile regex over prose, and this census does not propose one.

## Implementation ticket (filed with this census)

The six gates, the 21 rewrites and the pinned test, plus a regression run of the touched files' existing content tests and the prose voice scorer. It is **blocked by THR-1984** (the build of THR-1982), which adds `protagonistRoles`, the filter stage and the `{trade}` / `{?has_trade}` token. Content pillar only. No engine change: the filter stage ships with THR-1984. UI pillar N/A: no surface changes, and the fix is in the words a scene already shows.
