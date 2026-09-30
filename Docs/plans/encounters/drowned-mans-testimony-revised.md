# Encounter Pipeline: The Drowned Man's Will
> Scale: local (short) | Slug: drowned-mans-testimony | Pass: revised
> Revisions applied: detector hits cleared (`nothing`, `the matter`, `anything`); page repetitions cut (fee ↔ ambition cause; wrong-then-right ×3); seam echoes rewritten ("in open court", house/boat, boat at the success seam); almshouse introduced in the spine at net zero words; card effect lines share no word with their names; crit overviews differentiated and made explicit; `his savings` ambiguity fixed; concept art no longer paints the solution. Mechanics unchanged.
> Date: 2026-09-30 | Pipeline version: 2.0
> Template: `encounter.town.drowned_mans_testimony` · Batch: expert-everyday-1, slot 6 (THR-1678) · Package: `Docs/plans/encounters/drowned-mans-testimony.package.json`

## 0. Mechanical design block (fixed before any prose)

| Row | Decision |
|---|---|
| Crux | A magistrate has sent for {actor} to ask a drowned man in a dream who he left his estate to, and his nephew wants all of it. |
| Title | **The Drowned Man's Will** — the objective (find the will) is in the title. The id keeps its brief spelling `drowned_mans_testimony`. |
| Shape | Single Test composed with the **query prize** face (brief slot 6; the batch's one 1-step encounter). |
| Reach = theme | Veil 0.64 (`steep`), one step. Veil is divination and ritual (`Docs/canon/cosmology.md`); the whole scene is one act of divination performed in public. |
| Whose problem | The agent's: they are sent for because they are the best reader in the district, and their good name rides on the reading. Rolled role *bystander pulled in* — they have no stake in the estate, only in being right. |
| Rolled dice | p3 **mystery** (the will he said he made is missing) · opposition **rival agent, greed** (the nephew) · disposition **hostile** (he calls dream-reading a trick in open court) · role **bystander pulled in** · scale **company** (one house, one heir, one almshouse, one court). |
| The truth | The will is in the dead man's boat, under a loose board beneath the stern seat, wrapped in oilcloth. It leaves the house to the nephew and his savings to the almshouse. The dream shows the dead man in his boat lifting that board. Revealed only in the success-side bands. |
| Consequence hand (binding, THR-1145) | `thread` + `drive` — no swap. |
| `thread` | `thread_strengthen` ($ascendant ↔ $actor) on the step's success half; `thread_weaken` on the failure half. |
| `drive` | Success half: `assign_ambition` `ambition_uncover_secrets` (display "Uncover Ancient Secrets") on `$actor` — paid in one of the dead man's river finds, the reader now wants to learn what other old finds can tell. Failure half: `plant_compulsion` on `$actor`, `encounterBias: { explore: 0.5 }`, 72 ticks — the will is still missing and they keep searching for it. |
| Query prize (batch floor) | Step `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#relic'] }` → projects onto `{ kind: 'item_template', tags: ['#relic'] }`. The court pays the reader's fee from the dead man's river finds. The prose never names the object; the engine renders the drawn item as the PRIZE chip. Live bearers: 14 items (`reward-attachment-catalog.ts` relics_talismans). |
| Standing (expert penalty) | `reputation_with` `targetLocationId: '$here'`: +0.06 on success, −0.06 on failure. The P3 stake names it plainly. |
| Cool failure | Nobody is hurt, held or branded. The court gives the whole estate to the nephew, the almshouse is left out, and the town trusts the reader less. |
| Systems quota | cast + rewards + reputation = 3 (the floor). |
| Trait hooks | Gate: none (everyday board, no rule gates by brief). Variant: none. Trait-only nudge: none. Trait fragment: none — no live trait fits dream-reading better than the reach itself. |
| Mortal choice | None — this is a test. |
| Specials (system target: cards — cost channels, pips) | **Loosen The Rival's Tongue** (Stumble, chaos, `opposes: 'heir'`) and **Call Up The Dead** (Bargain, entropy, zero essence, paid on the doom clock via `costs.doomDelta`). One cost channel each. No rider, no Boost special. |
| Prose rule 7 / 7b | No agent history asserted ("the best dream reader in the district" is the brief's sanctioned expert framing, scene-local). No promise about later: the compulsion chip says only that they put the search first for a while, which the planted bias performs; the crit overview's thanks is a past event. |
| Motivations | `tradition_novelty` (Veil: the old rite of asking the dead, against the nephew's scorn) · `honesty_cunning` (a true reading against a convenient one). |

**plotHookRolled:** hook.endless_pursuit, hook.gods_fall, hook.relic_awakening
**plotHookTaken:** hook.endless_pursuit — blended with hook.relic_awakening. The dead man spent his life pulling old things out of the river, and the hunt outlived him; the fee the court pays comes from those finds, and a reader who fails keeps looking for a will the court has stopped looking for. `hook.gods_fall` was dropped: a god's fall is a region-scale event and this slot is company scale.

## 1. Inspiration Anchors

- **Brief row (binding):** veil 0.64, one step, `urban` + `rural`, query-prize shape, hand `thread` + `drive`, rarity 2, scale local, intrinsic tier `shaping`.
- **Opposition read:** the nephew is the rival agent, driven by greed. He is hostile from the first line: he calls dream-reading a trick in front of the magistrate. He is the one named person on stage.
- **Structural models:** `cunning-fair.package.json` (one-step veil query prize, success/failure-half effects, the `thread` chip form); `bell-at-the-exchange.package.json` (tag-drawn `rewardPool`, the `compulsion` chip form); `the-broken-seal.ts` (the `ambition` chip form, `ui.ambition`).
- **Anti-patterns avoided:** no personal condition as the failure penalty; no rule gate; no fiction-named prize; no ghost spectacle — the dead man answers in a dream, and the court only hears what the reader says.
- **Difference from the Cunning Fair (same family, same reach, same shape):** that one is a journeyman reading at a fair for a keepsake; this one is an expert testifying before a magistrate against a hostile claimant. The specials are Stumble + Bargain (the fair's were Whisper + Omen), the deal tags differ, and the drive family replaces the secret.

## 2. Scale Justification

Local, as the brief fixes. One estate, one heir, one hearing, settled in a morning. The expert weight is the audience: a magistrate's court, and a reading given on the record.

## 3. Pressure Knot

A river trader drowned in the millrace a week ago. He had told the almshouse he had made a will; none has been found. His nephew has claimed the whole estate as his only kin. The magistrate will not rule on a will nobody can produce, and has sent for the best dream reader in the district.

## 4. Intervention Fantasy

The god works on the two things the reader cannot reach: the dead man, who can be called back for one night if the god will pay on the doom clock, and the living claimant, whose own words can be made to turn on him. The mortal still has to read the dream and say it in court; fate still rolls whether they read it right.

## 5. Cast and World Objects

| Object | What it is | Wiring |
|---|---|---|
| `{cast:heir}` — Corvin Aldmere (spawn name) | The dead man's nephew, claiming the whole estate | `supportBundle` actor, `lazy-materialize-on-trigger`, `must-persist`, spawn `trader` only (no reuse, so a stranger in town is never made someone's nephew). Never gendered in prose. Target of the Stumble special (`opposes: 'heir'`). |
| The magistrate | Runs the hearing | Role noun only. Not cast, so one named person per beat holds. |
| The dead man | A river trader who collected old things from the river | Scene fiction. Named only as "the dead man" / "he". |
| The almshouse | Told of the will; named in it | Scene fiction, introduced in the spine; overviews only. No chip claims it. |
| The reader's fee | Drawn from the `#relic` item family | Step `rewardPool`, success half. |
| The town's trust | `reputation_with` `targetLocationId: '$here'` | +0.06 success half, −0.06 failure half. |
| The thread | `thread_strengthen` / `thread_weaken` `$ascendant` ↔ `$actor` | Success half / failure half. |
| The ambition | `assign_ambition` `ambition_uncover_secrets` on `$actor` | Success half. |
| The compulsion | `plant_compulsion` on `$actor`, explore bias | Failure half. |

## 6. Beat Structure

1. **Ask the dead man** — veil 0.64, `fail_action`. The reader sleeps in the dead man's house and tells the court what the dream showed. A true reading sends the bailiff to the boat, and the will is under the stern seat. A false reading hands the estate to the nephew.

## 7. Branching Profile

Linear, no branching. Single Test with the `query_prize` face.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | The will is found within the hour and read before noon; the magistrate thanks the reader before the court; best draw of the tier curve | A night's sleep in a dead man's bed | Town trust +, thread +, ambition, the fee |
| success | The will is found in the boat and splits the estate | Same | Same |
| success_at_cost | Right on the second answer, after a wrong one in court | Face before the court; the nephew calls it luck | Same chips; the cost is in the overview |
| failure | The court gives everything to the nephew; the almshouse is left out | Their name as a reader in the town | Town trust −, thread −, compulsion to keep searching |
| critical_failure | They told the court there was no will at all, and the court believed them; the almshouse calls it a lie | Same, loudly | Same |

Cool failure: no death, no jail, no brand. Standing before money.

## 10. Sample Opening

> {actor} arrives at the magistrate's court in {location} for a hearing.
>
> A river trader drowned last week. He told the almshouse he had made a will, but none has been found. His nephew, {cast:heir}, claims the whole estate and calls dream-reading a trick.
>
> The magistrate has sent for {actor}, the best dream reader in the district, to ask the dead man what he wanted. A wrong reading in court will cost {actor} their good name in {location}.

Rural P1: *{actor} arrives at {location}, where the magistrate sits in the tithe hall.* Everything under P1 is the step's `narrativeTemplate` (the spine). Counts: urban 11 + 66 = 77; rural 12 + 66 = 78 (spine length unchanged from the draft: +2 for the almshouse, −1 `open`, −1 `fairground`).

## 11. The Hand Per Step

**Step 0: Ask the dead man** · `deal: { count: 4, tags: ['insight', 'presence'] }` + 2 specials (composed hand 6)

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Loosen The Rival's Tongue | Stumble (`opposes: 'heir'`) | chaos | 2 essence | 0.13 | Make an opponent say more than they planned, so their own answers work against them. |
| Call Up The Dead | Bargain | entropy | 0 essence · doom +1 | 0.14 | Pull a departed soul back to answer plainly for one night. Doom moves a step closer. |

No word is shared between a card's name and its effect line.

Fragments: Loosen — critical_success · success · failure. Call Up — success_at_cost · near_miss · failure · critical_failure. Together the specials cover all six `StepOutcome`s. Neither is big-delta (both < 0.15).

The two answer different questions: Call Up makes the dead speak more clearly (the reader's source); Loosen makes the living claimant weaker (the opposition). Both act on people the spine established. Call Up is the batch's cost-channel card: free in essence, paid on the doom clock — the Bargain's whole decision. No core Boost, no rider special (the deal supplies both), no over-exposed signature card.

## 12. Linear continuation (afterimages)

- critical_success: *They said the will was under the stern seat of his boat, and the bailiff found it there within the hour.*
- success: *They read the dream as the dead man lifting a board in his boat, and the will was under it.*
- success_at_cost: *They named a room in his house first, then his boat, and the second answer was the right one.*
- failure: *They read the dream as the dead man leaving everything to his only kin.*
- critical_failure: *They told the court the dead man had never made a will at all.*

## 13. Aftermath Paragraph

Fallback overview: *The hearing is over. The court has ruled on the drowned man's estate.* Each band overrides it:

- critical_success: *The will was read in court before noon. It leaves {cast:heir} the house and the almshouse the savings. The magistrate thanked {actor} before the whole court and paid the fee from the dead man's river finds.*
- success: *The magistrate read the will aloud. It splits the estate between {cast:heir} and the almshouse. The court paid the reader's fee from the dead man's river finds.*
- success_at_cost: *{cast:heir} called the second answer luck in front of the whole court. The will was found all the same, and the almshouse gets its share. The court paid the fee from the dead man's river finds.*
- failure: *The magistrate ruled for {cast:heir}, who takes the whole estate. The almshouse is left out, and the will is still missing.*
- critical_failure: *The magistrate ruled for {cast:heir} and closed the case. By evening all of {location} had heard the reading, and the almshouse was calling it a lie.*

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean. Local scale; every write fires from step metadata, and the player's decisions were the cards.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) | Backing write |
|---|---|---|
| critical_success / success / success_at_cost | BOND · reputation with {location} (gain) · BOND · thread (gain) · PATH · ambition · (engine) PRIZE | success half: `reputation_with $here`, `thread_strengthen`, `assign_ambition`, `rewardPool` |
| failure / critical_failure | SCAR · thread (loss) · SCAR · compulsion · BOND · reputation with {location} (loss) | failure half: `thread_weaken`, `plant_compulsion`, `reputation_with $here` |

Chip sentences (`causeClause` + `detail`) are ≤15 words (longest 13) and share no four-word run with their overview; every band page read clean as one text (editorial § 6b).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `heir` (the nephew) | lazy-materialize-on-trigger | spawn `trader` "Corvin Aldmere" | must-persist | named in the spine, fragments and overviews; the Stumble special's `opposes` target | ready |
| The reader's fee | drawn at resolution | `#relic` item_template query | persists as a possession on `$actor` | sheet | ready (14 bearers) |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Steps / difficulty as brief | PASS | veil 0.64, one step; `shaping`, so the 0.45 open-draw cap does not bind (brief § Why shaping) |
| Setting envelope + one opening per class | PASS | `urban`, `rural` |
| Cast bound, token keys declared | PASS | `heir` |
| Hand rules | PASS | 2 specials + deal 4; each special has a failure fragment; no Δ ≥ 0.15; zero-essence Bargain priced in doom |
| Consequence hand wired | PASS | thread → strengthen/weaken; drive → `assign_ambition` + `plant_compulsion`; no swap |
| Query prize | PASS | step `rewardPool` tag-filtered `#relic` |
| Rewards persist | PASS | `rewardPool` + ambition + compulsion |
| Systems quota | PASS | cast + rewards + reputation = 3 |
| byOutcome floor | PASS | five bands |
| Chip nouns = sheet words | PASS | `reputation with {location}` ($here), `thread`, `ambition`, `compulsion`; no `$actor`/`$cast` anchored noun |
| No person-reputation chip (THR-1685) | PASS | the only reputation chip is the town, and the town is what the prose means |
| Law 56 backing per band | PASS | kit table |
| No personal condition, no rule gate, no death/jail/brand | PASS | |
| Prose rule 7 / 7b | PASS | |
| Detectors | PASS | no evasive or outcome-class indefinite; annotation count 0; no divine outcome-authorship |
| Word budgets | PASS | opening 77 / 78; overviews ≤60 (max 38); fragments ≤25; effect lines ≤25 |

### Experience Differentiator Gate

1 YES · 2 YES · 3 YES · 4 YES (the almshouse's claim is now in the spine) · 4b YES · 5 YES · 6 YES (essence; the Bargain on doom) · 7 YES · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES · 11b YES · 12 N/A (local, no reactions) · 13 N/A · 14 YES.

**Concept art direction.** Emotions: a dead man's wish kept from him by greed; the weight of being right, or wrong, in public. Image: an empty witness bench in a small plain courtroom at dawn, river water pooled on the floorboards beneath it, a wet coil of mooring rope dropped at its foot, and on the bench a court ledger lying open at a blank page. Residue, no people — and nothing that shows where the will is.

## Exact strings

Every final player-facing string, by field. Ids and mechanics are unchanged from `drowned-mans-testimony.package.json`.

### Template

- `name`: The Drowned Man's Will
- `openings.urban`: {actor} arrives at the magistrate's court in {location} for a hearing.
- `openings.rural`: {actor} arrives at {location}, where the magistrate sits in the tithe hall.
- `description`: A one-step Veil test for an expert in a town or village: a magistrate sends for the best dream reader in the district to ask a drowned man who he left his estate to, while his nephew claims all of it and calls the rite a trick. The fee is drawn by query from the #relic item family; a true reading also gives the reader a new ambition, and a wrong one costs their standing in the settlement and leaves them searching for the missing will for a while.

### Step 0

- `purposeLine`: Ask the dead man
- `narrativeTemplate` (spine): A river trader drowned last week. He told the almshouse he had made a will, but none has been found. His nephew, {cast:heir}, claims the whole estate and calls dream-reading a trick. The magistrate has sent for {actor}, the best dream reader in the district, to ask the dead man what he wanted. A wrong reading in court will cost {actor} their good name in {location}.
- `criticalSuccessAfterimage`: They said the will was under the stern seat of his boat, and the bailiff found it there within the hour.
- `successAfterimage`: They read the dream as the dead man lifting a board in his boat, and the will was under it.
- `successAtCostAfterimage`: They named a room in his house first, then his boat, and the second answer was the right one.
- `failureAfterimage`: They read the dream as the dead man leaving everything to his only kin.
- `criticalFailureAfterimage`: They told the court the dead man had never made a will at all.

Effect strings (not chip text, but player-adjacent):
- `thread_strengthen.reason`: Read a drowned man's will true with the god close
- `thread_weaken.reason`: Misread a drowned man's will with the god watching
- `assign_ambition.narrativeHook`: Paid in one of a drowned man's river finds, they want to learn what other old finds can tell.
- `plant_compulsion.narrativeHook`: The court has stopped looking for the drowned man's will. They have not.

### Cards

**`testimony.loosen_the_rivals_tongue`**
- `name`: Loosen The Rival's Tongue
- `effectLine`: Make an opponent say more than they planned, so their own answers work against them.
- `bandProse.critical_success`: {cast:heir} let slip that the dead man had spoken of a will.
- `bandProse.success`: {cast:heir} gave two different answers about the dead man's boat, and the magistrate noticed.
- `bandProse.failure`: {cast:heir} stumbled over an answer, and the court put it down to grief.

**`testimony.call_up_the_dead`**
- `name`: Call Up The Dead
- `effectLine`: Pull a departed soul back to answer plainly for one night. Doom moves a step closer.
- `bandProse.success_at_cost`: The dead man came when called, but talked of old quarrels before the will.
- `bandProse.near_miss`: The dead man came, and showed the boat only as the dream was ending.
- `bandProse.failure`: The dead man came, but said only his nephew's name, over and over.
- `bandProse.critical_failure`: The dead man came, and the reader took his silence for an answer.

### narrativeTemplates

- `initiation`: A magistrate has sent for a dream reader to ask a drowned man who he left his estate to, and his nephew claims all of it.
- `success`: The reading was right. The will was found, and the court paid the reader's fee.
- `failure`: The reading was wrong. The nephew took the whole estate, and the town trusts the reader less.

### Aftermath — fallback

- `fallback.overview`: The hearing is over. The court has ruled on the drowned man's estate.
- `testimony.a_reading_on_the_record` (growth): title "A reading on the record" · detail "Reading a dead man's dream before a magistrate teaches the veil reach." · concepts ["veil reach" → reach.veil]

### Aftermath — byOutcome

**critical_success**
- overview: The will was read in court before noon. It leaves {cast:heir} the house and the almshouse the savings. The magistrate thanked {actor} before the whole court and paid the fee from the dead man's river finds.
- `testimony.crit.town_trust` — BOND · reputation with {location} · title "Right before the magistrate" · causeClause — (none) · detail "{location} holds their readings in higher regard." · concepts ["higher regard" → ui.standing]
- `testimony.crit.thread` — BOND · thread · title "Close in the dream" · causeClause "Read the dream with the god close" · detail "The thread to {actor} runs stronger." · concepts ["thread" → ui.thread]
- `testimony.crit.ambition` — PATH · ambition · title "Old finds" · causeClause "Curious about old finds" · detail "{actor} is pursuing Uncover Ancient Secrets now." · concepts ["Uncover Ancient Secrets" → ui.ambition]

**success**
- overview: The magistrate read the will aloud. It splits the estate between {cast:heir} and the almshouse. The court paid the reader's fee from the dead man's river finds.
- `testimony.success.town_trust` — BOND · reputation with {location} · title "A reader the court trusts" · causeClause — (none) · detail "{location} holds their readings in higher regard." · concepts ["higher regard" → ui.standing]
- `testimony.success.thread` — BOND · thread · title "Close in the dream" · causeClause "Read the dream with the god close" · detail "The thread to {actor} runs stronger." · concepts ["thread" → ui.thread]
- `testimony.success.ambition` — PATH · ambition · title "Old finds" · causeClause "Curious about old finds" · detail "{actor} is pursuing Uncover Ancient Secrets now." · concepts ["Uncover Ancient Secrets" → ui.ambition]

**success_at_cost**
- overview: {cast:heir} called the second answer luck in front of the whole court. The will was found all the same, and the almshouse gets its share. The court paid the fee from the dead man's river finds.
- `testimony.cost.town_trust` — BOND · reputation with {location} · title "Right in the end" · causeClause — (none) · detail "{location} holds their readings in higher regard." · concepts ["higher regard" → ui.standing]
- `testimony.cost.thread` — BOND · thread · title "Close in the dream" · causeClause "Read the dream with the god close" · detail "The thread to {actor} runs stronger." · concepts ["thread" → ui.thread]
- `testimony.cost.ambition` — PATH · ambition · title "Old finds" · causeClause "Curious about old finds" · detail "{actor} is pursuing Uncover Ancient Secrets now." · concepts ["Uncover Ancient Secrets" → ui.ambition]

**failure**
- overview: The magistrate ruled for {cast:heir}, who takes the whole estate. The almshouse is left out, and the will is still missing.
- `testimony.fail.thread` — SCAR · thread · title "Watched, and not helped" · causeClause "Misread the dream with the god watching" · detail "The thread to {actor} runs thinner." · concepts ["thread" → ui.thread]
- `testimony.fail.compulsion` — SCAR · compulsion · title "Still searching" · causeClause — (none) · detail "For a while they put the search for the will before other work." · concepts ["search for the will" → ui.compulsion]
- `testimony.fail.town_trust` — BOND · reputation with {location} · title "Wrong before the magistrate" · causeClause — (none) · detail "{location} doubts their readings now." · concepts ["doubts their readings" → ui.standing]

**critical_failure**
- overview: The magistrate ruled for {cast:heir} and closed the case. By evening all of {location} had heard the reading, and the almshouse was calling it a lie.
- `testimony.critfail.thread` — SCAR · thread · title "Watched, and not helped" · causeClause "Misled the court with the god watching" · detail "The thread to {actor} runs thinner." · concepts ["thread" → ui.thread]
- `testimony.critfail.compulsion` — SCAR · compulsion · title "Still searching" · causeClause — (none) · detail "For a while they put the search for the will before other work." · concepts ["search for the will" → ui.compulsion]
- `testimony.critfail.town_trust` — BOND · reputation with {location} · title "Nobody's reader" · causeClause — (none) · detail "{location} doubts their readings now." · concepts ["doubts their readings" → ui.standing]

### Changed-from-package index (for the transcriber)

- spine: `He said he had made a will` → `He told the almshouse he had made a will`; `a fairground trick` → `a trick`; `in open court` → `in court`
- Loosen `effectLine`; Loosen `bandProse.critical_success`
- Call Up `effectLine`; Call Up `bandProse.success_at_cost`
- `assign_ambition.narrativeHook`
- overviews: critical_success, success, success_at_cost, failure, critical_failure
- all three `*.thread` success-side causeClauses (`the will` → `the dream`); `critfail.thread` causeClause
- all three `*.ambition` title + causeClause
- both `*.compulsion` title, detail and concept text
- `description` (last clause)
