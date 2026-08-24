# Encounter Pipeline: The Toll of Blades
> Scale: medium (2-step) | Slug: toll-of-blades | Pass: final
> Date: 2026-08-24 | Pipeline version: 3.0 (nudge-native, THR-883 format + THR-1045 Composition Contract)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Nudge-native two-step (`iron` → `stone`) test encounter, four-class setting envelope, `secret`/`membership` consequence draw. |
| Editorial | PASS WITH REVISIONS | Nineteen seam echoes cleared across nine seam classes; step-2 Stumble replaced with the Balm (`card.balm.signature.life`) to fix an ungrounded card and pay off step 1's `exhausted` mint; pack theft narrowed to the one band the design block licenses; three items raised to Pass 3 (pack theft, exhausted/Balm sequencing, growth-chip anchor form). |
| Systems | READY WITH CAVEATS | All three editorial items resolved and confirmed correct. Every id/field/effect kind/roster entry/card checked live against source; `draw:consequences` reproduces the recorded hand exactly. One new defect found: the `critical_failure` aftermath band's two chips are backed by step 2's `failureMetadata`, but step 2 can be skipped entirely when step 1 itself rolls `critical_failure` (`advanceStep` forces immediate resolution on any critical failure, overriding `continue_weakened`). Concrete additive fix specified. Secondary non-blocking correction to the packet's own "dealt hand" arithmetic for step 2. |

### Caveats / Blockers

**One required pre-implementation fix (not applied to the packet below — content-only, no engine change):**

Duplicate step 2's two failure-side effects onto step 1's own `failureMetadata.effects`, so the `critical_failure` aftermath band's chips (`SCAR a wound`, `SCAR standing`) are backed on every path to that band, not only the path where step 2 runs:

```
failureMetadata.effects: [
  { kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted', targetAgentId: '$actor', durationTicks: 36 },   // already authored
  { kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$actor', durationTicks: 48, intensity: 0.35 },   // ADD
  { kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.10 },   // ADD
]
```

Why: `advanceStep` forces immediate action-level resolution on *any* step's `critical_failure`, regardless of that step's own `failBehavior`. Step 1 is authored `continue_weakened` to survive a plain `failure`, but a `critical_failure` on step 1 still terminates the action right there — step 2, and everything authored on its `failureMetadata`, never runs. Full reachability analysis, the accepted trade (a bounded reputation/condition double-count on the rare compound-failure path), and the alternative (drop the two chips from `critical_failure` instead) are in [`toll-of-blades-systems.md`](./toll-of-blades-systems.md) § 1.

**One non-blocking correction, informational only:** the packet's own claim that step 2's "dealt hand lands at 4–6" undercounts by one — `requiredUnlock` dims a card (still rendered, blocked) rather than hiding it (removed from the row), so the true dealt range is 5–6, matching step 1. No authored data needs to change; only the claim, next time this packet is revised.

**Standard closeout tasks** (unaffected by the above, named for completeness): stamp `usedBy` for `stronghold_mobilization` in `plotHooks.ts` at ship time; confirm `reputationPolarity` infers positive from `crudType: 'update'` and set explicitly if it does not (packet § 14 item 6); register the template in **both** `RAW_UNIFIED_ACTION_TEMPLATES` and `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` in `src/data/unified-action-templates.ts` — the second array is easy to miss and is required for the hex-scale encounter cache to ever draw this template (see systems file § 11).

### Editorial Notes Summary

Pass 2 cleared nineteen seam echoes across nine seam classes (twelve of them inside a single ending — the class the batch's editorial passes widened their seam audits to catch after two other drafts in this batch missed it in the same place). Step-2's Stumble (`card.stumble.signature.chaos`, a second instance duplicating step 1's) was replaced with `card.balm.signature.life` — not primarily to remove the repeat, but because the Stumble was mechanically ungrounded on a `stone` endurance step with no one to weaken, while the Balm both fits `stone` and pays off `exhausted`, the condition step 1's own `failureMetadata` mints. The `failure` aftermath overview was rewritten after it contradicted its own step-2 afterimage on the same screen. Pack theft, previously asserted in three places with no write behind it anywhere, was narrowed to the one band (`critical_failure`) the batch design block explicitly licenses as scene texture. The growth chip's anchor was corrected to the generated anchor catalog's Stats form (bearer `entityId` plus stat `tooltipId`) rather than the exemplar's older single-field form. Full editorial detail: [`toll-of-blades-editorial.md`](./toll-of-blades-editorial.md).

### Implementation File Map

**New file:** `src/data/encounters/toll-of-blades.ts` — plain two-step template (no branch), following `flawed-steel.ts`'s structural shape.

**Registration in `src/data/unified-action-templates.ts`:**
1. Import, in the block ending ~line 199.
2. Add to `RAW_UNIFIED_ACTION_TEMPLATES` (defined line 5463, entries running to ~line 5600).
3. Add to `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (defined line 5658, entries running to ~line 5690+) — required so `encounterCache.ts` (line 320) draws it at the hex scale; this template declares `locationSubtypes` via `expandSettings`, exactly the shape this array exists to supplement.

**Gates to run post-implementation (no files, verification only):** `npm run draw:consequences -- encounter.border.toll_of_blades --reach iron --rarity 2` (already confirmed reproducing `['secret','membership']` against the unregistered id); `npm run check:encounter -- encounter.border.toll_of_blades`; `npm run check:encounter-live`.

Full detail, every id verified against live source, and the complete chip-backing/reachability table: [`toll-of-blades-systems.md`](./toll-of-blades-systems.md).

---

## Encounter Packet

# Encounter Pipeline: The Toll of Blades

> templateId: `encounter.border.toll_of_blades` | Slug: `toll-of-blades` | Pass: **revised**
> Batch: border-perils (THR-1221), row **1 · The Toll of Blades** | Date: 2026-08-24 | Pipeline version: 3.0 (nudge-native, THR-883 format + THR-1045 Composition Contract)
>
> **Revisions applied (Pass 2):** nineteen seam echoes cleared across nine seam classes, twelve of them inside single endings · step-2 Stumble replaced with `card.balm.signature.life` (ungrounded in a `stone` step; also removes a repeat) · `failure` overview rewritten (contradicted its own afterimage) · *"the picket"* removed from two carryover lines (named no object in the prose) · `way` removed from an `outcome`-class chip detail (detector hit) · No Middle Ground's effect line rewritten (named no divine act) · two card faces rewritten (lifted from the exemplar) · four openings de-duplicated · three participial fragment openers fixed · growth-chip bearer anchor added · pack theft narrowed to the band that declares it · field-class map corrected against the detector code.
>
> Editorial review: [`toll-of-blades-editorial.md`](./toll-of-blades-editorial.md) — verdict **PASS WITH REVISIONS**.

**Binding constraint set:** [`border-perils-batch-design.md`](./border-perils-batch-design.md) § *1 · The Toll of Blades*, and [`border-perils-brief.md`](./border-perils-brief.md) (approved by Christian, chat, 2026-08-24).
**Authoring contract:** `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`.
**Worked example:** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`.

This packet is **authoring output only**. No TypeScript was written and nothing under `src/` was touched. Pass 3 audits systems and runs `npm run check:encounter`.

---

## 0 · Mechanical design block (spec step 1 — written before a word of prose)

| Row | Answer |
|---|---|
| **0. The crux** | A war column has stopped across the agent's road and is taking what it needs from whoever passes. |
| **0b. Title states the crux** | *The Toll of Blades* — a toll, taken by armed people. Complication and objective legible from the title alone. |
| **0c. Shape** | `Danger–Confrontation–Aftermath` (2 steps: the line arrives, then the line has to be outlasted). |
| **0c. Setting** | Envelope `wayside · ruin · battlefield · stronghold` (all four, one opening each; batch-fixed). |
| **0c. Pressure** | `war`, undertone `fear`. |
| **0c. Form** | `siege`. |
| **0c. Objective** | `endure`. |
| **0c. Stakes** | `standing`. |
| **0c. System (maturity-gated)** | `movement + traits + conditions` — all three **mature** tier. `war` is the *pressure*, never the system: no army or battle mechanic is load-bearing here. The `standing` stakes are minted through **`reputation_with`** (THR-1206, live), not through the deferred faction-rank surface. |
| **0d. Hook** | `plotHookRolled: stronghold_mobilization, monster_eradication, natural_disaster` · `plotHookTaken: **stronghold_mobilization**` ("A fortress is provisioning for a march, and the direction it is provisioning for is here."). Drift: the fortress gate survives literally in the `stronghold` opening; at the other three classes the column is already on the road, which is the same mobilization one day later. |
| **1. Whose problem?** | The agent's. The column is standing in *their* road, and the stylus reaches *their* row. Protagonist, never bystander — and step 2's spine was rewritten in Pass 2 to keep it that way (§ 2, seam notes). |
| **2. Reach = theme?** | Step 1 tests **`iron`** and is *about* not being moved — Protector ↔ Conqueror is the axis a stand-and-hold sits on. Step 2 tests **`stone`** and is *about* endurance: the column takes an afternoon to pass and the agent has to still be there when it has. Both chosen before the scene; the scene grew from them. |
| **3. Why is the agent here?** | All four motive routes are honest, because a road is whoever's road it interrupts. `chance` — the road they were already walking runs into the halt. `mission` — carrying something to the far side that will not wait an afternoon. `choice` — their own errand, and the long way round costs a day. `divine` — led onto this road by the god who is now holding cards over it. |
| **4. Which mechanics and objects play?** | Trait variant (`trait.core.core_humility.vice`, "Proud"); conditions (`wounded`, `exhausted`, `inspired`); cast binding (the column's serjeant) + the Stumble's `opposes` sourcing off that binding; faction standing (`reputation_with`) and faction membership (`membership_change`) against `mercenary_company`; a favour edge (`favor_creation`); two cost channels (`detectionDelta` ×2); three card grants; carryover from step 1's band into step 2. **Fact classification (prose rule 7):** everything the base prose asserts about the agent's connections is **scene-local** — the column, the serjeant, the tablet, the queue of travelers are inventions with no life before this scene. The base prose asserts **no** prior relationship, debt, standing or visit. Every history-shaped fact is a *write*, minted here: the favour (`favor_creation`), the membership (`membership_change`), the standing (`reputation_with`). The one **read** is the trait variant's gate (`has_trait` walk), which surfaces as its factor line. |
| **5. Rewards and tension** | **Penalty-avoidance is the baseline reward**: the pack stays on, the road stays a road, the afternoon is the only price. Above baseline: standing with the company, and at the top band a place on its rolls. Tolls: a sack taken; a wound; an afternoon spent; standing lost. Quintessence stakes: **moderate** — open-draw ambient content, so a critical failure is a battering and a robbery, never a scripted death. Tension sits on **step 2**, because step 1 can be survived by yielding and step 2 cannot be survived by anything except still being there. |
| **6. Does the mortal make a choice?** | **None — this is a test.** The batch assigns the fate-branching debut to encounter #4 (`standing_the_line`); this row is `Danger–Confrontation–Aftermath`, not `Personality Fork`. No `authoredChoices`, no `poleLean`, no `branchOnStep` fork. The player's whole surface is the two hands. |
| **7. Every promise pays off** | The opening promises a column and a toll; the steps deliver the toll and the wait. The serjeant is a presence, not a mystery — and the presence pays off twice: as the Stumble's named opposition in the panel, and as the person who owes a favour at `success_at_cost` and asks for a name at `critical_success`. The tablet, promised in the spine, is the thing that closes early (`success_at_cost`) or gets a name written in its margin (`critical_success`). The **exhaustion** step 1 mints on failure is promised by the carryover line and paid off by step 2's Balm. Nothing is opened that a band does not close. |
| **8. Systems touched (authored manifest count)** | **4** — `cast` (the serjeant binding), `reputation` (`reputation_with`, both signs), `conditions` (`apply_condition` ×3 and `remove_condition` ×1 across grants, step metadata and reactions), `rewards` (`favor_creation`, a `PERSISTENT_EFFECT_KINDS` member). Floor is 3. *Not* counted: `factions` (neither `reputation_with` nor `membership_change` is in `FACTION_EFFECT_KINDS`) and `seeds` (none — the batch's seed pair is #4→#5). |

### Consequence draw (Step 0b — binding, recomputed by `check:encounter` from the template id)

```
consequenceDraw: ['secret', 'membership']
```

No `consequenceSwap`. Both families are wired **in context**, not bolted on:

| Family | Effect kind | Where it fires | The in-context reason |
|---|---|---|---|
| `secret` | `favor_creation` | step 2 `successMetadata` | The serjeant shuts the tablet short of what the column was owed, in front of the whole line. That is a thing done *for* the agent, in public, that the serjeant now has to answer for — so the serjeant owes, and the debt is the shape the secret takes. Debtor `$cast:serjeant`, creditor the actor. |
| `membership` | `membership_change` (`op: 'join'`) | step 2 `successMetadata` | A company that hires fighters recruits from people who did not move; the serjeant walks back up the line and asks for a name. The banner takes the agent onto its rolls. |

### Reachability (THR-821)

`intrinsicTier: 'background'` — open-draw ambient content, so **both steps sit at or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45)**: step 1 at **0.36**, step 2 at **0.42**, both rendering the word `fair` (`DIFFICULTY_WORD_BANDS`: 0.30–0.45). This is the open-draw branch of the rule, the same one The Swollen Ford takes. A `severe` step drawn by anyone would be a decorative hand, and an `iron` step is exactly the one a `notable`-tier non-martial mortal is least likely to hold.

### Forecast arithmetic

| Step | Difficulty | Hand sums to | Difficulty + full hand | Ceiling |
|---|---|---|---|---|
| 1 (`iron`) | 0.36 | **0.57** | 0.93 | `NUDGE_HAND_MAX_TOTAL_DELTA` 0.70 ✓; inside [0, 1] ✓ |
| 2 (`stone`) | 0.42 | **0.51** | 0.93 | ✓ |

Both land on 0.93, the same figure the golden exemplar's step 1 carries, leaving 0.07 of headroom so no card in either hand can buy nothing. **Worst cases checked:** step 2's `critical_success` carryover adds +0.05 → 0.98, inside [0, 1] ✓. Step 1 with the trait variant active is difficulty 0.34 with a hand of 0.57 plus the variant's +0.05 → 0.96 ✓.

---

## 1 · The scene-writer's checklist, answered in writing

Answers cover all four openings and the shared spine.

| # | Question | Answer |
|---|---|---|
| **A1** | Where are we? | **wayside:** open road, nearest roof half a day back, a column settled along the verge. **ruin:** the road runs through a dead village, roofless walls, the column taking it apart for firewood. **battlefield:** ground a battle already used, turf broken in ridges, the column picking it over. **stronghold:** the road ends at a fortress gate and starts again beyond it, the gate open since dawn. Each is sketchable before anyone acts. |
| **A2** | How does it feel? | wayside: cold, cook-smoke lying flat, tethered horses stamping and blowing. ruin: axes on old beams, the crack and grind of a gable coming down, dust in the throat. battlefield: crows going up and settling, a smell that has not finished leaving. stronghold: new bread and axle-grease on the air, a clerk shouting tallies over the noise. Two or more non-sight senses per opening. |
| **A3** | Who is here? | The column (soldiers, drivers, a herd), the serjeant working the line with a wax tablet, and the queue of held-up travelers. All four openings account for who made the smoke, who is swinging the axes, who is shouting the tallies. The serjeant — the one bound cast member — is introduced in the **setting-neutral spine**, and nowhere before it, so they exist at every class and are introduced exactly once. |
| **A4** | What must we know? | That the road is the only line through, that the column is taking a toll from each traveler in turn, and that the queue is moving. All stated in the `initiation`, before the first step is asked for. |
| **A5** | Does the complication land last? | Yes. Each opening builds the place; the `initiation` states the toll and the cost of waiting; the spine's last sentence lands it on the agent — *"The stylus stops at the agent's row."* |
| **B6** | Nothing referred to before it is introduced | The spears, the verge, the tablet, the stylus, the line, the serjeant and the pack all appear in the spine before any card, factor line, fragment, chip or band names them. The column appears in every opening. The stylus is now named in the spine's third sentence, before the fourth uses it. **Pass 2 fix:** two carryover lines named *"the picket"*, which appears in no prose — both rewritten against the soldiers and the spear-butts, which the spine establishes. |
| **B7** | Every event has a visible cause | The halt is caused by a column provisioning for a march (the hook). The toll is caused by the column needing supply on the road. The wait in step 2 is caused by the column's length. The Stumble's opening is caused by churned verge, named in the spine. The Balm's target is caused by step 1's own failure metadata. |
| **B8** | Nothing contradicts what is established | One column, one road, one tablet, one afternoon. The openings leave the hour open except `stronghold` (since dawn) and `ruin` (mid-work), neither of which the afternoon-long step 2 contradicts. **Pass 2 fix:** the aftermath `failure` overview said the agent was *walked off the road* — which is step 1's defeat — while step 2's `failure` afterimage says they sat down and the column stepped around them. Rewritten to narrate step 2's defeat. |
| **C9** | Would a real person do this? | Yes: the alternative to standing is a day lost or a load lost, and both are named. Nobody walks into the column; the agent waits their turn like everyone else, which is what makes the refusal legible when it comes. |
| **C10** | Do people react like people? | The travelers queue and keep their loads on the ground. The soldiers ground their spears rather than level them — this is routine work, not a battle. The serjeant reads the row aloud and writes it down, because a column that robs people keeps books. The serjeant gets furious when tripped, gets up, and finishes the row anyway. |
| **C11** | Do actions carry their true cost? | Yes: an afternoon on your feet with a pack on, a spear-butt in the shoulder, the mud, and being walked off your own road. Carried in the afterimages, the fragments, the carryover lines and the conditions the metadata mints. |
| **D12** | Can the player restate the stake in one sentence? | *"Does the agent get through this halt with the pack still on their back and their standing with the column raised — or do they get walked off the road, hurt, with an afternoon gone and the column's regard gone with it?"* Good outcome, concretely: the stylus moves past their row, the pack stays on, and the serjeant asks for a name. Bad outcome, concretely: spear-butts, a wound that slows the next few days of road, and a story the column tells at the next halt. |
| **D13** | Is every card grounded? | Every card acts on what the spine established: the bodies in the road (Full Weight), the churned verge under the serjeant (Something Gives Way), the agent's nerve and body (A Little More, A Sudden Surge, The Slow Push, It Passes), the queue and the agent's own company (Shoulder To Shoulder, Shared Watch), the shape of the outcome itself (No Middle Ground, By The Book). **Delete the column and the road from the prose and every card below is senseless here.** **Pass 2 fix:** step 2's Stumble was *not* grounded — a "weaken the opposition" card in a step whose opposition is an afternoon and a pair of legs — and is replaced (§ 5). |
| **D14** | Does every card state mechanism, not mood? | Yes — each `effectLine` says what the god does and why that moves the odds, in plain words, with no digits and no `%`. Checked card by card in § 5. **Pass 2 fix:** No Middle Ground described the shape of the ladder without naming a divine act; rewritten. |
| **D15** | Does every declared class have an opening? | Yes — four declared, four written (`validateSettingEnvelope` enforces it at build time). |

---

## 2 · Setting envelope

```
settings: ['stronghold', 'ruin', 'wayside', 'battlefield']
locationSubtypes: expandSettings(['stronghold', 'ruin', 'wayside', 'battlefield'])   // derived, never hand-written
```

Expands to: `castle · fort · ruins · ruined_tower · ruined_city · ruined_village · unexplored_poi · camp · oasis · wilderness · battleground`.

`urban`, `rural`, `sacred`, `arcane` are excluded batch-wide. Because the envelope spans four classes, this template inherits **no** THR-1044 family default and declares its own `supportBundle` (§ 4), class-honest at all four.

### Opening — `wayside` (camp · oasis · wilderness)

> The road runs open here. The nearest roof is half a day behind, and the next one further. A column has halted along the verge and settled in: tethered horses stamping and blowing, cook-smoke lying flat in the cold. Travelers stand with their loads on the ground, waiting their turn.

### Opening — `ruin` (ruins · ruined_tower · ruined_city · ruined_village · unexplored_poi)

> The road here runs through a dead village, roofless walls and grass in the doorways. The column has halted inside it and is taking the place apart for firewood: axes on old beams, the crack and grind of a gable coming down, dust in the throat. A dozen travelers stand in the lane with their loads down, watching.

### Opening — `battlefield` (battleground)

> The road crosses ground that a battle already used. The turf is broken in long ridges, crows go up and settle again along them, and the smell has not finished leaving. A column has halted here and set people to picking the field over — spear, boot, buckle — cartload by cartload. The queue of held-up travelers reaches back out of sight.

### Opening — `stronghold` (castle · fort)

> The road ends at a fortress gate and starts again on the far side. It has stood open since dawn: wagons rolling out loaded, new bread and axle-grease on the air, a clerk shouting tallies over the noise. A column is forming up outside it, filling the road across its whole width.

### `narrativeTemplates.initiation` (setting-neutral)

> The column takes what it needs on the way through, and nothing else moves until it has. Waiting for it to clear costs the whole day. Going up to the head of the line costs a share of what the agent is carrying.

### Spine — step 1's `narrativeTemplate` (setting-neutral; the opening token compiles above it)

> Two soldiers stand across the road with their spears grounded. The line of held travelers is short and getting shorter. A serjeant walks down it through churned verge with a wax tablet and stylus, naming what the column will take from each: a sack, a mule, a good knife. The stylus stops at the agent's row.

### Spine — step 2's `narrativeTemplate` (setting-neutral)

> The agent is at the head of the line, and the column is long: wagons, then a driven herd, then more wagons. The road belongs to it until the last axle is through, most of an afternoon away. What is left to do is stand in it until then. The serjeant is further down the line, still looking back this way.

### Seam audit — every seam this encounter has, checked by name

The class the automated detectors cannot see. The render order is longer than a two-seam model allows for:

```
opening → initiation → spine 1 → step-1 base band text + up to three card fragments
        → spine 2 → step-2 base band text + up to three card fragments
        → aftermath overview → up to three chips → narrativeTemplates.success/.failure
```

so the seams include `base band text→fragment`, `fragment→fragment` for fragments active on one band, `overview→chip` and `chip→chip` — the region where twelve of this draft's nineteen echoes lived.

| Seam class | Instances | Verdict |
|---|---|---|
| opening → initiation | 4 (one per class) | ✓ The initiation no longer restates *"a column has halted/stopped"*; it opens on what the column *does* |
| initiation → spine 1 | 1 | ✓ The serjeant and the tablet are introduced once, in the spine. The initiation carries the terms only |
| spine 1 → step-1 base band text | 5 | ✓ |
| step-1 base → fragment, and fragment → fragment | 6 bands: `critical_success` {4,5} · `success` {1,3,6} · `success_at_cost` {2} · `near_miss` {1,6} · `failure` {2,3,4} · `critical_failure` {4,5} | ✓ Three fixed: *looked* ×3 and *row blank* ×2 on `critical_success`; *had more X* twice on `failure`; *went down* on `critical_failure` |
| spine 1 → spine 2 (across the intervening band text) | 1 | ✓ Spine 2 no longer says *"pack still on"* against the `success` afterimage's *"The pack stayed on the agent's back"* |
| spine 2 → step-2 base band text | 5 | ✓ |
| step-2 base → fragment, and fragment → fragment | 6 bands: `critical_success` {4,6} · `success` {2,3} · `success_at_cost` {1,5} · `near_miss` {2,5} · `failure` {3,4,6} · `critical_failure` {1,4} | ✓ Four fixed. `failure` was the worst: base *"sat down"*, Full Weight *"folded"*, Shared Watch *"went down together"* — the collapse three times on one screen, now once |
| step-2 band text → its own overview | 5 | ✓ Three fixed, including a verbatim contradiction on `failure` (§ 1, B8) |
| overview → its own chips | 5 endings × up to 3 chips | ✓ Four causeClauses and two details rewritten off phrases their overview already used |
| chip → chip within one band | `critical_success` (3 chips) · `critical_failure` (2) | ✓ The three `critical_success` causeClauses now name three different things; *column* and *company* are no longer used interchangeably in the same stack |
| `narrativeTemplates.success`/`.failure` vs the surfaces beside them | 2 | ✓ Both rewritten |
| the four openings against each other | 6 pairs | ✓ Endings deliberately varied: *waiting their turn* / *watching* / *reaches back out of sight* / *across its whole width* |

**Two deliberate repetitions, recorded so a later pass does not "fix" them.**

1. All four openings take **the road** as their grammatical subject, each naming what it does at that class (*runs open / runs through / crosses / ends*). Only one opening renders per run, so the player never sees the repetition. Structural signature, not a seam.
2. **"Step aside"** appears twice and only twice: in the trait factor line (*"Being Proud, they will not be seen to step aside"*) and in the `critical_success` overview (*"The company keeps a list of people who do not step aside"*). The trait's flaw becomes the ending's recruiting criterion — a pre-roll promise cashed at the ending. A third instance in the `success` carryover line was cut in Pass 2 because it competed with the overview.

---

## 3 · Test panel data

### Step 1

| Field | Value |
|---|---|
| `reach` | `iron` |
| `purposeLine` | **"Hold the road"** (3 words ≤ `REACH_PURPOSE_MAX_WORDS` 4) — what is tested, not the fiction |
| `difficulty` | `0.36` → renders **`fair`** |
| `duration` | `{ min: 1, max: 2 }` |
| `failBehavior` | `continue_weakened` — a failed stand does not end the encounter; the column still has to pass, which is exactly what step 2 then has to carry |
| `factorLines` | **None authored.** The variance rule (THR-892): the spears, the queue, the tablet and the churned verge are true on every run, so they are priced into `difficulty: 0.36` and carried by the prose. The panel's variance lines — reach capability, equipment, terrain, conditions, divine attention — are **derived** by `computeResolutionModifiers`, the same walk that feeds the roll |
| Authored variance surfaces present | The trait line (§ 6) |

### Step 2

| Field | Value |
|---|---|
| `reach` | `stone` |
| `purposeLine` | **"Outlast the column"** (3 words) |
| `difficulty` | `0.42` → renders **`fair`** |
| `duration` | `{ min: 2, max: 3 }` |
| `failBehavior` | `fail_action` |
| `factorLines` | **None authored** — same rule. The column's length and the weight of the pack read identically on every run |
| `carryoverFactorLines` | Authored, and **variant by construction** — keyed on the band step 1 rolled |

`carryoverFactorLines` (`StepCarryoverFactorLine` = `{ text, polarity, forecastDelta? }`; each ≤ `NUDGE_WORD_BUDGETS.factorLine` 12 words; each names its source inside the sentence, per Canon rule 1):

| Step-1 band | `text` | `polarity` | `forecastDelta` |
|---|---|---|---|
| `critical_success` | "The column saw the row go unwritten and does not press again." | `for` | `+0.05` |
| `success` | "Word ran down the line: this one is not worth the argument." | `for` | `+0.03` |
| `success_at_cost` | "They yielded a sack, and the column reads them as movable." | `against` | `-0.03` |
| `near_miss` | "The serjeant let it pass once and is still watching them." | `against` | `-0.02` |
| `failure` | "The column took what it wanted and has learned they yield." | `against` | `-0.05` |
| `critical_failure` | "They start the wait from the ground the spear-butts put them on." | `against` | `-0.08` |

**Pass 2 changes to this table, recorded.** Two lines named *"the picket"* — a noun no prose in this packet contains (the road has *two soldiers* and *spear-butts*; the `wayside` opening's *picket lines* was a horse-tether, and is gone). The `success_at_cost` line also asserted an opened leg its band never described — step 1's `success_at_cost` base text is *"The column took a sack and left the rest"* — and a carryover line must read correctly with no cards played. The `success` line used *"does not step aside"*, competing with the `critical_success` overview. The `near_miss` line declared `polarity: 'against'` and moved nothing, which is a panel reporting a direction it does not apply; it now carries `-0.02`. Every line is now true of the base band text it keys on.

---

## 4 · Cast, and the support bundle contract

**One bound cast member.** The density rule (THR-1130) is explicit — one named person on stage — and the soldiers in the road are role nouns in the prose, not bindings they do not need. The serjeant is the person the scene is *about* at the human scale: the one who reads the row, the one the Stumble opens the ground under, the one who owes at `success_at_cost` and asks for a name at `critical_success`.

```
supportBundle: [
  {
    kind: 'actor',
    key: 'serjeant',
    delivery: 'lazy-materialize-on-trigger',
    persistence: 'must-persist',
    reuseNpcRoles: ['quartermaster', 'mercenary'],
    supportRole: 'column_serjeant',
    spawnNpcRole: 'mercenary',
    spawnName: 'Soren Vance',
    factionDefId: 'mercenary_company',
  },
]
```

**Class-honesty, checked against `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`) and `SUBTYPE_TO_ROSTER_KEY` (`src/engine/npcSeeding.ts`):**

| Declared class | Subtypes | Roster key worldgen uses | Do `quartermaster` / `mercenary` appear? |
|---|---|---|---|
| `wayside` | `camp` | `military_outpost` | `quartermaster` 0.9 ✓ · `mercenary` 0.7 ✓ |
| `wayside` | `oasis`, `wilderness` | `wilderness` / none | Neither — the spec spawns instead, which is honest: a column arriving *is* new population |
| `stronghold` | `fort` | `military_outpost` | both ✓ |
| `stronghold` | `castle` | `capital` | `mercenary` 0.6 ✓ |
| `ruin` | all five | none (`null`) | No roster — spawns |
| `battlefield` | `battleground` | unmapped | No roster — spawns |

Both reuse roles are read correctly at every class an envelope-honest reader would test, and neither is a role that only exists at one of them (the "miller's boy" failure). `spawnName` is a **real name**, not a role phrase, because a declared key always resolves (THR-696) and `{cast:serjeant}` renders this string whenever no live NPC was reused.

> **A note for Pass 3 on the `stronghold` opening.** It named *a quartermaster* shouting tallies, which is one of this bundle's `reuseNpcRoles` — so at a fort the prose introduced a book-keeping figure who might then be bound as the *serjeant*, two book-keepers where the scene wants one. The opening now says *a clerk*, which is scene dressing and collides with nothing.

**`delivery: 'lazy-materialize-on-trigger'`** rather than `pre-seeded`: unlike a family default (bind-only, zero added population), a war column that has *arrived* is genuinely new people. Same shape the exemplar's fellow traveler uses.

**`persistence: 'must-persist'` is load-bearing, not decorative.** Two durable facts are written onto this person — a `favor_creation` debt and the `apply_condition` grant on the Stumble — and a promise whose holder is collected at scene end is not a promise.

**Prose register for the cast (ruling 6):** role-voiced inline is the default, so the spine writes *"A serjeant walks down it"* with no token. The `{cast:serjeant}` token lands exactly twice, both at *reveal* moments: the `critical_success` overview (walks back up the line and asks for a name) and the `success_at_cost` overview + BOND chip (shuts the tablet short and owes for it). **The serjeant is never gendered** — reuse binds whoever is standing there. Every sentence about them uses the role noun or restructures around the pronoun; re-read line by line in Pass 2.

### Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `serjeant` (actor) | `lazy-materialize-on-trigger` | reuse `quartermaster`/`mercenary` at the anchor location, else spawn `mercenary` named *Soren Vance*, `factionDefId: 'mercenary_company'` | **must-persist** | `favor_creation` debtor · `apply_condition` grant target · `opposes` attribution on the step-1 Stumble · `$cast:serjeant` chip anchor · `{cast:serjeant}` in two overviews | authored |
| `mercenary_company` (faction) | resolved by def id at dispatch (`bindFactionDefinitionIds`) | `src/data/mercenary-company-definition.ts` — shipped definition, registered in `FACTION_DEFINITIONS` and therefore in `ALL_FACTION_DEFINITIONS`; ranks `sellsword / sergeant_at_arms / captain / war_chief` | world-owned | `reputation_with` (both signs) · `membership_change` (join) · `$faction:mercenary_company` chip anchor | shipped content, not authored here |
| `trait.condition.wounded` | attachment template | `src/data/condition-trait-content.ts` (live) | world-owned | step 2 `failureMetadata` · chip anchor at two bands · the Stumble's grant onto the serjeant | shipped |
| `trait.condition.exhausted` | attachment template | live | world-owned | step 1 `failureMetadata` mints it · step 2's Balm lifts it · the fallback rest reaction lifts it | shipped |
| `trait.condition.inspired` | attachment template | live | world-owned | Shared Watch's grant | shipped |
| `trait.core.core_humility.vice` ("Proud") | seeded trait definition | `src/data/core-trait-content.ts` via `coreRegistry` `core_humility` | world-owned | `traitVariants` gate + factor line | shipped |

No blocked primitives. Nothing on this table is named-and-unbuilt (the THR-844 rot class).

---

## 5 · The hands

**Card-type budget (batch-fixed):** `heavy_hand`, **`stumble`**, `insurance`, `boost` (≤ 2 per hand), `fellowship`, `gambit`.

> **The budget read as a floor, not a ceiling — Pass 2 ruling, and what changed.**
>
> The draft treated the six allocated types as a ceiling and concluded that two hands of six cards each clearing four spheres could not be made type-disjoint inside it, so it dealt **three** library members into both steps. The arithmetic was right and the conclusion was not: the golden exemplar deals twelve cards across two steps in **twelve distinct types with zero repeats**, and gets there by using types in step 2 that step 1 does not have. Disjointness is reachable — only if the budget is a floor for coverage. It is.
>
> Applied: step 2's `card.stumble.signature.chaos` instance is replaced by **`card.balm.signature.life`**. Not primarily to remove a repeat — the Stumble's second instance was *ungrounded*. Step 2 is a `stone` endurance test and the card's mechanism is *"you loosen the ground under the one standing against them"*, but on step 2 there is nobody standing against them; the opposition is the column's length and the agent's own legs. Its own fragments proved it, tripping the serjeant's horse so the *tablet* went in the mud and two rows got skipped — step 1's business, transacted during step 2, moving nothing about whether the agent is still standing at the end. The Balm works on the body, which is what a `stone` step tests, and it lifts the exhaustion **step 1's own `failureMetadata` mints** — turning a dangling write into a lever the god can pull mid-encounter.
>
> **Two repeats remain, and both are genuinely forced.** `card.boost.core` is the *only* ungated, sphere-less member in the library — `card.mercy.core` and `card.insurance.core` are riders and a second rider is illegal, `card.trait_card.core` is trait-gated, `card.boost.variation.patient` is unlock-gated — and both steps owe an ungated common. `card.heavy_hand.signature.force` is the only type `force` signs (`SPHERE_SIGNATURES`), and the batch design obliges this encounter to carry `detectionDelta` **twice**, which is heavy_hand's defining trade and belongs on no other type; drop it from either hand and a sphere count or a brief target goes with it. Two of six, both explicable, reads as *repertoire* — a member is a card the god holds. Three of six with one off-theme read as a hand padded to a size.

> **`fellowship` has no library member — both Fellowship cards ship as one-offs, recorded.** Verified in source: `NUDGE_CARD_LIBRARY` is assembled from `UNIVERSAL_CORE_TYPES`, `SPHERE_SIGNATURES`, `HUNGER_UNIQUE_CARDS` and `VARIATION_MEMBERS`, and `fellowship` appears in none of them (nor do `side_bet` or `signature` — three of twenty-one types have zero members). So these two carry **no `libraryCardId`**, which is a choice with a reason rather than a default, and the exemplar's own Fellowship is a one-off for the same reason. Ten of twelve cards match a member and set one.
>
> **Pass 2 fix:** the draft's `Shoulder To Shoulder` quote was *"One rope, many hands."* — the exemplar's `ford.shared_burden` quote, verbatim — while its note claimed the face was *"written to the library's genericity bar"*. A one-off that copies the only other Fellowship in the repo is the worst of both models. Rewritten.
>
> **Raised against the batch design, not this draft (Pass 3, § 14 item 4):** the card-type allocation assigns `fellowship` to #1 and #4, `side_bet` to #6 and `signature` to #4, and claims the batch *"reaches all 21 types"* while the brief requires `libraryCardId` on every card matching a member *"so the tally, twilight harvest, and echo card finally receive data"*. Four of those allocations cannot comply, by construction.

### Step 1 hand — `iron`, "Hold the road" (6 cards)

| # | `id` | Library type | `libraryCardId` | `name` | `sphere` | `essenceCost` | `forecastDelta` | Rider / gate / channels |
|---|---|---|---|---|---|---|---|---|
| 1 | `toll.a_little_more` | Boost | `card.boost.core` | **A Little More** | — *(common)* | 1 | 0.06 | ungated common option |
| 2 | `toll.a_sudden_surge` | Boost | `card.boost.signature.energy` | **A Sudden Surge** | `energy` | 2 | 0.10 | — |
| 3 | `toll.something_gives_way` | Stumble | `card.stumble.signature.chaos` | **Something Gives Way** | `chaos` | 2 | 0.12 | `opposes: 'serjeant'` · **grant** |
| 4 | `toll.full_weight` | Heavy hand | `card.heavy_hand.signature.force` | **Full Weight** | `force` | 2 | 0.16 | **cost channel** `detectionDelta: 0.15` · big delta |
| 5 | `toll.no_middle_ground` | Gambit | `card.gambit.signature.chaos` | **No Middle Ground** | `chaos` | 1 | 0.03 | **rider** `all_or_nothing` — the hand's ONE |
| 6 | `toll.shoulder_to_shoulder` | Fellowship | *(one-off — no library member)* | **Shoulder To Shoulder** | `spirit` | 2 | 0.10 | `requiresGroup: true` |

Guardrails: 6 cards (4–8 ✓) · sum **0.57** ≤ 0.70 ✓ · spheres `energy, chaos, force, spirit` = **4** ✓ · ungated sphere-less commons **1** ✓ · riders **1** ✓ · boosts **2** ✓ · distinct types **5** ✓. Gated: one (`requiresGroup`), so the **dealt** hand lands at 5–6.

**Rider justification.** `No Middle Ground` is the hand's only rider. Chaos's signature reshapes the ladder instead of climbing it, which is why it is priced at one essence and carries almost no delta — the widened downside *is* the price. A second rider would answer the same question (what shape does the outcome take) twice.

#### Card faces

**1 · A Little More** — `imageTag: 'generic.focus'`
- `effectLine`: *"You steady them at the moment it counts, so the attempt comes out at their best instead of their average. A small help."*
- `fiction`: *"Most things fail by a margin."* (library face, verbatim from `CARD_CONTENT`)
- `bandProse`: `success` — "They held the serjeant's eye through the whole reading of the row." · `near_miss` — "They did not blink through it. The row got written anyway."

**2 · A Sudden Surge** — `imageTag: 'generic.energy'`
- `effectLine`: *"You pour energy into a body that is being asked for more than it has. A real help."*
- `fiction`: *"Bodies hold more than they admit."* (library face)
- `bandProse`: `success_at_cost` — "The surge went into the shoulder the spear-shaft had found, and it kept them upright." · `failure` — "The body answered. The column had more bodies."

**3 · Something Gives Way** — `imageTag: 'generic.matter'` · **the batch's `stumble` debut**
- `effectLine`: *"You loosen the ground under the one standing against them. The odds move because the opposition slips, takes the fall badly, and carries it a while. A strong help."*
- `fiction`: *"Every structure has one loose piece."* (library face)
- `opposes: 'serjeant'` — this is the whole point of the type: `collectNudgeModifiers` sources the named modifier **from the bound cast member**, so the test panel reports the serjeant losing their footing rather than a nameless tilt in the god's favour.
- `grants`: `[{ kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$cast:serjeant', durationTicks: 36, intensity: 0.3 }]` — the fall is real and the serjeant carries it out of the scene. Live condition id, cast-bound to a declared, must-persist key.
- `bandProse`: `success` — "The verge gave under the serjeant mid-sentence, and the sentence never got finished." · `failure` — "The serjeant went down, got up furious, and finished the row from the mud."

**4 · Full Weight** — `imageTag: 'generic.strength'`
- `effectLine`: *"You put force behind them where the pressure lands, and hold it there. Rival gods can hardly miss a hand this heavy."*
- `fiction`: *"Subtlety is a choice. This is not it."* (library face)
- `costs`: `{ detectionDelta: 0.15 }` — **cost channel #1**.
- `bandProse` (big delta ⇒ both failure bands owed): `critical_success` — "The two spears came up and could not come forward. Nobody behind them wanted to be the one who tried next." · `failure` — "Force met the column head-on, and the column came through it without changing step." · `critical_failure` — "The push was so plain that four of them came for it at once."

**5 · No Middle Ground** — `imageTag: 'generic.luck'`
- `effectLine`: *"You strip the middle out of it, so what is left lands clean or lands hard, with nothing between."*
- `fiction`: *"Chaos has no use for the adequate."* (library face)
- `rider: 'all_or_nothing'`
- `bandProse` (the two bands the rider leaves reachable): `critical_success` — "One motion settled it, and the stylus never touched the wax." · `critical_failure` — "With no middle to land in, they were in the mud before the serjeant finished the row."

**6 · Shoulder To Shoulder** — `imageTag: 'generic.blessing'`
- `effectLine`: *"Only in company: the group closes up on both sides, so the column has to move a body of people instead of one traveler. A real help."*
- `fiction`: *"One is moved. Several are negotiated with."* (one-off face, written to the library's genericity bar — reads in any encounter where a company faces a demand)
- `requiresGroup: true` — an unmet requirement hides the card; a solo traveler never sees a company they do not have.
- `bandProse`: `success` — "The company came up on both sides and the road narrowed for the column instead." · `near_miss` — "The company held the line together. The serjeant took the lightest pack in the group and moved on."

#### Step 1 band coverage

| `StepOutcome` | Covered by |
|---|---|
| `critical_success` | 4, 5 |
| `success` | 1, 3, 6 |
| `success_at_cost` | 2 |
| `near_miss` | 1, 6 |
| `failure` | 2, 3, 4 |
| `critical_failure` | 4, 5 |

All six ✓. Every card carries ≥1 failure-band fragment ✓ (1 near_miss · 2 failure · 3 failure · 4 both · 5 critical_failure · 6 near_miss). The one big-delta card (#4, 0.16 ≥ `NUDGE_BIG_DELTA` 0.15) carries **both** `failure` and `critical_failure` ✓.

### Step 2 hand — `stone`, "Outlast the column" (6 cards)

| # | `id` | Library type | `libraryCardId` | `name` | `sphere` | `essenceCost` | `forecastDelta` | Rider / gate / channels |
|---|---|---|---|---|---|---|---|---|
| 1 | `toll.by_the_book` | Insurance | `card.insurance.signature.order` | **By The Book** | `order` | 3 | 0.04 | **rider** `floor_at_cost` — the hand's ONE |
| 2 | `toll.a_little_more_again` | Boost | `card.boost.core` | **A Little More** | — *(common)* | 1 | 0.06 | ungated common option |
| 3 | `toll.the_slow_push` | Boost | `card.boost.variation.patient` | **The Slow Push** | — | 1 | 0.08 | `requiredUnlock: 'divine.rekindle_thread'` |
| 4 | `toll.full_weight_held` | Heavy hand | `card.heavy_hand.signature.force` | **Full Weight** | `force` | 2 | 0.16 | **cost channel** `detectionDelta: 0.12` · big delta |
| 5 | `toll.it_passes` | Balm | `card.balm.signature.life` | **It Passes** | `life` | 2 | 0.10 | **grant** |
| 6 | `toll.shared_watch` | Fellowship | *(one-off — no library member)* | **Shared Watch** | `spirit` | 2 | 0.07 | `requiresGroup: true` · **grant** |

Guardrails: 6 cards ✓ · sum **0.51** ≤ 0.70 ✓ · spheres `order, force, life, spirit` = **4** ✓ · **ungated** sphere-less commons **1** ✓ (The Slow Push is sphere-less but unlock-gated, so it is *not* an ungated common — the draft counted it and reported 2; the honest figure is 1, which is the floor) · riders **1** ✓ · boosts **2** ✓ · distinct types **5** ✓. Gated: two (`requiredUnlock`, `requiresGroup`), so the dealt hand lands at **4–6**, the dealt-size doctrine.

**Rider justification.** `By The Book` is the hand's only rider. Order's signature buys the floor rather than the ceiling, priced at the hand's essence ceiling because it converts both plain failures into a paid arrival. Its failure-texture fragment sits on `critical_failure` — the only failure band `floor_at_cost` leaves reachable while the card is active.

#### Card faces

**1 · By The Book** — `imageTag: 'generic.ward'`
- `effectLine`: *"You set a floor under them. The afternoon can take gear and skin; it cannot take them off their feet."*
- `fiction`: *"Rules exist so the worst case has a name."* (library face)
- `rider: 'floor_at_cost'`
- `bandProse`: `success_at_cost` — "That had been paid for in advance. The column took its fee out of the pack." · `critical_failure` — "A bought floor is worth little to a body already under the herd."

**2 · A Little More** — `imageTag: 'generic.focus'` · same library face as step 1's card 1, by design (§ 5, the recorded forcing)
- `effectLine`: *"You steady them at the moment it counts, so the attempt comes out at their best instead of their average. A small help."*
- `fiction`: *"Most things fail by a margin."*
- `bandProse`: `success` — "The third hour was the one that decided it, and they were steady in it." · `near_miss` — "They were still up when the last wagons came, and sitting by the time those had passed."

**3 · The Slow Push** — `imageTag: 'generic.vigor'`
- `effectLine`: *"You lean on them from the first hour and keep leaning, so the worst of it arrives spread out instead of all at once. A real help."*
- `fiction`: *"Early pressure costs less than late force."* (library face)
- `requiredUnlock: 'divine.rekindle_thread'` — the library's own milestone for this member (`VARIATION_MEMBERS`), so a god who has not earned it never sees it.
- `bandProse`: `success` — "The push started at the first hour, and the legs never got the chance to argue." · `failure` — "The push was steady from the first hour. The afternoon was steadier."

**4 · Full Weight** — `imageTag: 'generic.strength'`
- `effectLine`: *"You put force behind them where the pressure lands, and hold it there. Rival gods can hardly miss a hand this heavy."*
- `fiction`: *"Subtlety is a choice. This is not it."*
- `costs`: `{ detectionDelta: 0.12 }` — **cost channel #2**. Cheaper than step 1's, because holding a body upright for an afternoon is a longer, quieter working than throwing it forward once.
- `bandProse` (big delta ⇒ both): `critical_success` — "They stood through it like a post driven in, and the column had to go around the post." · `failure` — "Force held them upright until the last of it ran out, and then they folded." · `critical_failure` — "Every rider in the column saw a traveler standing too straight for too long, and then not standing."

**5 · It Passes** — `imageTag: 'generic.warmth'` · **replaces the draft's second Stumble** (§ 5, the recorded ruling)
- `effectLine`: *"You take the tiredness out of the legs before the hours start counting, so the afternoon is met by a rested body. A real help."*
- `fiction`: *"Most suffering ends. This one ends sooner."* (library face, verbatim from `CARD_CONTENT`)
- `grants`: `[{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }]` — the same shape the exemplar's Balm uses, and pinned live by `validateNudgeGrantRefs`. Under THR-887 the library Balm will bind by selector (the bearer's worst active condition); until then the authored instance names the condition it treats. **This is step 1's own write being paid off**: `failureMetadata` on step 1 mints `exhausted`, and the carryover line tells the player it is there before they choose.
- `bandProse`: `success_at_cost` — "The tiredness went out of the legs early. What the afternoon put back in stayed." · `near_miss` — "The wait started from rested. Rested only lasts so long."

**6 · Shared Watch** — `imageTag: 'generic.blessing'`
- `effectLine`: *"Only in company: the group splits the standing into shifts, so the hours land on more than one set of legs. A real help."*
- `fiction`: *"One watch, taken in turns."* (one-off face)
- `requiresGroup: true`
- `grants`: `[{ kind: 'apply_condition', conditionTraitId: 'trait.condition.inspired', targetAgentId: '$actor', durationTicks: 24 }]` — an afternoon taken in shifts with people who stayed leaves something behind. Fires once after the step resolves, and reads correctly at every band: the company stood with them whether or not the column relented.
- `bandProse`: `critical_success` — "The company took the standing in shifts, and the column never saw a gap in it." · `failure` — "The company split the hours evenly, and evenly was still more hours than they had."

#### Step 2 band coverage

| `StepOutcome` | Covered by |
|---|---|
| `critical_success` | 4, 6 |
| `success` | 2, 3 |
| `success_at_cost` | 1, 5 |
| `near_miss` | 2, 5 |
| `failure` | 3, 4, 6 |
| `critical_failure` | 1, 4 |

All six ✓. Every card ≥1 failure-band fragment ✓ (1 critical_failure · 2 near_miss · 3 failure · 4 both · 5 near_miss · 6 failure). Big-delta card #4 carries both ✓.

### No two cards in a hand answer the same question

| Step 1 | The question it buys an answer to |
|---|---|
| A Little More | *Do they hold their nerve when the stylus stops?* |
| A Sudden Surge | *Does the body have one more in it than it looks like?* |
| Something Gives Way | *Can the opposition be made weaker instead of the agent stronger?* |
| Full Weight | *What if the god simply outweighs the column, and lets rivals see it?* |
| No Middle Ground | *What shape does this take — clean, or hard?* |
| Shoulder To Shoulder | *Is this one traveler, or a body of them?* |

| Step 2 | The question it buys an answer to |
|---|---|
| By The Book | *What is the worst this can end as?* |
| A Little More | *Do they hold at the hour it turns?* |
| The Slow Push | *Can the cost be spread across the afternoon instead of paid at the end?* |
| Full Weight | *What if the god holds them up bodily, and lets rivals see it?* |
| It Passes | *Can the afternoon be started from rested instead of from spent?* |
| Shared Watch | *Can the hours be split across more than one set of legs?* |

The Slow Push and It Passes are the closest pair and are genuinely distinct: one changes *when the demand arrives*, the other changes *what the body starts with*. The exemplar carries the same pairing (Second Wind and Fresh Legs) in one hand.

**No card asks the player to pick a branch or an ending.** There is no fork in this encounter; the player plays cards, the mortal stands or does not, and fate rolls how it goes. No card instructs the mortal: the god steadies a nerve, pours energy into a body, loosens ground under an opponent, puts weight behind a stance, strips the middle out of the ladder, lifts weariness, closes a company up, and sets a floor.

**The hand is not all physics.** `force`, `chaos` and `life` are physical causes; `order` (the floor), `spirit` (the company) and the sphere-less steadying of nerve are not. The THR-1178 failure — a twelve-sphere game authored in one sphere's vocabulary — does not apply.

---

## 6 · Trait hooks — all four questions answered

| Question | Answer |
|---|---|
| **1. Gate?** (`requiredTraits` / `blockedByTraits`) | **No hook.** A column in the road stops everyone equally, and gating this template would remove the one open-draw combat encounter the corpus has. |
| **2. Variant?** (`TraitVariant`) | **Yes** — see below. |
| **3. Trait-only nudge?** (`requiredTrait` + `addNudgeIds`) | **No hook, and here is the reason.** The batch design allocates `trait_card` to encounters #2 and #5. A trait card here would make a seventh card in a hand already at six with one gate, and the trait's surface is complete without one: a factor line the holder reads before rolling, paying off in the ending's recruiting criterion. Reaffirmed in Pass 2 with the type budget read as a floor — the decision stands on its own terms, not on the budget. |
| **4. Trait fragment?** (band prose only the trait-holder sees) | **No hook** — with no trait card there is no fragment to hang one on. |

```
traitVariants: [
  {
    traitId: 'trait.core.core_humility.vice',   // "Proud" — the vice pole of core_humility
    forecastDelta: 0.05,
    difficultyDelta: -0.02,
    factorLine: 'Being Proud, they will not be seen to step aside.',
  },
]
```

**Liveness.** `trait.core.core_humility.vice` is one of the ten emergent Core trait definition nodes built by `buildCoreTrait` from `CORE_CONTINUA` (`src/types/coreRegistry.ts`: `core_humility`, virtue *Humble* / vice *Proud*, governs self-regard; content in `src/data/core-trait-content.ts`). Seeded definitions, same family as the exemplar's `trait.core.core_integrity.virtue`, so `validateTraitRefs()` does not report it dead. **A hook on a dead ref is a gate that never opens**, and this one is read in source, not assumed.

**Why this trait, and the argument the draft missed.** The step is not about being unafraid; it is about not being *seen* to give way in front of a queue of witnesses. `core_humility` is the continuum that governs exactly that, and it makes the hook a flaw rather than a virtue — a god helping a proud mortal hold their ground gets a good outcome out of a bad quality, which is more interesting than rewarding courage for being courageous.

**And the registry agrees mechanically:** `core_humility` carries `reachCouplings: [{ reach: 'iron', sign: 1 }]` — Humble seeds *away* from Power-Hungry, so a **Proud** agent trends toward high `iron`. The variant is coupled to the exact reach step 1 tests, which is the strongest available answer to "why this trait on this step" and was sitting unused in the draft.

The factor line is variant by construction (it renders only for the trait-holder) and names its source inside the sentence, per Canon rule 1. It is one of exactly two places *"step aside"* appears (§ 2, the recorded motif).

---

## 7 · Band prose

### Step 1 — `iron` (base text: reads correctly with **any** subset of the hand active)

| Band | Base surface | Text |
|---|---|---|
| `critical_success` | `criticalSuccessAfterimage` | "The serjeant looked at the road, looked at them, and left the row blank." |
| `success` | `successAfterimage` | "The stylus moved on down the tablet. The pack stayed on the agent's back." |
| `success_at_cost` | `successAtCostAfterimage` | "The column took a sack and left the rest, and the serjeant did not look up again." |
| `near_miss` | *(no afterimage field exists on `ActionStep`)* | Carried entirely by the hand's `near_miss` fragments and by step 2's `near_miss` carryover line. |
| `failure` | `failureAfterimage` | "The spear-butts came up, and the agent was walked off the road with the tablet still open." |
| `critical_failure` | `criticalFailureAfterimage` | "They went down in the verge with the column's boots going past at eye level." |

`failureMetadata.effects`: `[{ kind: 'apply_condition', conditionTraitId: 'trait.condition.exhausted', targetAgentId: '$actor', durationTicks: 36 }]` — they spent everything holding and were moved anyway. Fires on `failure` / `critical_failure` only (`isStepSuccess` counts `near_miss` as advancing). **This write carries no chip**, deliberately: Law 56 is one-directional — every chip needs a write, not every write needs a chip — and the engine surfaces it as an icon and a delta cluster on its own. It is *not* invisible: the `failure` carryover line tells the player about it before step 2, and step 2's Balm can lift it.

`successMetadata`: none on step 1. All the durable success-side writes live on step 2, so that a chip on any success-side *action* band is provably backed (§ 8).

### Step 2 — `stone` (the final step; band prose here is the peak-eligible surface, used sparingly)

| Band | Base surface | Text |
|---|---|---|
| `critical_success` | `criticalSuccessAfterimage` | "The last wagon went by, and the serjeant put two fingers up as it passed." |
| `success` | `successAfterimage` | "The road came back empty and the agent was still standing on it." |
| `success_at_cost` | `successAtCostAfterimage` | "They were still standing when the tail cleared, on a leg that had stopped taking weight an hour before." |
| `near_miss` | *(no field)* | Fragments only. |
| `failure` | `failureAfterimage` | "They sat down in the verge before the herd was through, and the rest of the column stepped around them." |
| `critical_failure` | `criticalFailureAfterimage` | "The last of the column stepped over them where they had gone down, and did not slow to do it." |

### `narrativeTemplates` (template level)

- `success`: "The column is gone and the road belongs to whoever is walking it again."
- `failure`: "The column took its toll and moved on up the road. What it left behind, the agent carries."

**Prose rule 7 check on both:** neither claims agent history the graph does not hold. No errand, no destination, no prior standing — a chance wanderer draws this template too.

**Pass 2 changes to this section.** Step-2 `critical_success` lost *"lifted two fingers off the tablet"*, which put *tablet* on the same screen as the overview's *"wrote it in the margin of the tablet"*; the salute is a better beat anyway. Step-2 `critical_failure` lost *"and took the pack on the way past"* — see § 8d for why the pack theft now lives only in that band's *overview*, where the design block declares it. Both `narrativeTemplates` lines were rewritten off phrases the afterimages and overviews beside them already used.

---

## 8 · Aftermath

`aftermathConfig` is mandatory under the Composition Contract. This encounter is choice-less at the step level, so the bands hang off `fallback` — which is why `byOutcome` lives *on* the variant.

```
aftermathConfig: {
  branchOnStep: 0,
  variants: {},
  fallback: { overview, changes: [], reactions: [...], byOutcome: { ... } },
}
```

### The backing writes — where every chip's state actually comes from

`byOutcome` keys on `UnifiedActionOutcome` (the action's resolved band), **not** on `StepOutcome`. Step 2 is the final step with `failBehavior: 'fail_action'`, so every success-side action band implies step 2 landed on a success-side `StepOutcome`, and every failure-side band implies it landed on a failure-side one. That is what makes the table below a proof rather than a hope.

| Where | Effects | Fires on |
|---|---|---|
| step 2 `successMetadata.effects` | `{ kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.12 }` | every success-side band |
| ” | `{ kind: 'favor_creation', magnitudeRange: [0.2, 0.4], context: 'shut the tablet short of what the column was owed, in front of the line', debtorAgentId: '$cast:serjeant' }` | ” |
| ” | `{ kind: 'membership_change', factionId: 'mercenary_company', op: 'join', chronicle: true }` | ” |
| step 2 `failureMetadata.effects` | `{ kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded', targetAgentId: '$actor', durationTicks: 48, intensity: 0.35 }` | every failure-side band |
| ” | `{ kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: -0.10 }` | ” |
| resolution | `applyEncounterGrowth` (`src/engine/unifiedActionResolution.ts`) — the actor's capability in the step's reach moves | every band |
| step 1 `failureMetadata.effects` | `apply_condition` `exhausted` → `$actor` | step-1 failure side |
| card grants | `apply_condition` `wounded` → `$cast:serjeant` (step 1 Stumble) · `remove_condition` `exhausted` (step 2 Balm) · `apply_condition` `inspired` → `$actor` (step 2 Shared Watch) | per committed card |

**Ordering note.** `reputation_with` is authored **before** `membership_change` in `successMetadata`. `reputation_with` deliberately does not duplicate `faction_reputation_gain`, and `getReputationWith` reads membership first — so writing the pairwise standing while the agent is still a non-member, then enrolling them, is the order that makes both writes mean what they say.

**Fail-soft note.** `membership_change` resolves `mercenary_company` through `resolveFactionNodeId`. In a world where no chapter of the company has spawned, the effect no-ops with a trace rather than throwing, and the `critical_success` chip simply does not render its state — which is the honest outcome, not a defect. `classifyAnchorDeclaration` agrees by design: a `$faction:` whose definition ships is legal even in a world that spawned no chapter, *"because that is a worldgen outcome and not an authoring error"*.

### Fallback

- `overview`: "What went onto the tablet and what stayed off it is riding north with the column."
- `changes`: **empty**. All five bands this encounter can produce are authored below, so the fallback's changes are only reachable via `contested_won` / `contested_lost`, which a two-step non-contested template never returns (`UnifiedActionOutcome` has seven members; the five authored plus those two). An unbacked chip here would be a chip claiming state on a band nobody can name.
- `reactions` (available on every band — two genuinely different philosophical stances about consequence, not mechanical variants):

| `id` | `label` | `effects` | The stance |
|---|---|---|---|
| `toll.let_them_rest` | "Let them rest before the road" | `[{ kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' }]` | The god spends the moment on the body in front of them. The person matters more than the story. |
| `toll.let_the_story_travel` | "Let the column carry the story" | `[{ kind: 'reputation_with', targetFactionId: 'mercenary_company', delta: 0.08 }]` | The god spends the moment on what the column says at the next halt. The story matters more than the afternoon. |

Both labels are interactive-plain and honest about what the click does — no label promising mercy and delivering harm (the defect the exemplar's critique pass caught).

> **Pass 3 note.** `toll.let_them_rest` lifts `exhausted`, which only a step-1 failure mints and which step 2's Balm can already lift, so on some runs it no-ops. The exemplar's `ford.rest_the_body` has the same shape, so this is precedent rather than defect — but the reaction is conditional in practice and worth knowing about before anyone reads its absence as a bug.

### `byOutcome`

Floor is three bands (one success-side, one failure-side, one extreme). **Five are authored**, because the tails are exactly the endings a playthrough almost never rolls and therefore the ones that go unwritten unless something asks for them.

---

#### `critical_success`

**overview**
> The pack never came off. {cast:serjeant} walked back up the line before the tail was clear, asked for a name, and wrote it in the margin of the tablet. The company keeps a list of people who do not step aside.

**changes**

1. **BOON · `iron capability`**
   ```
   id: 'toll.iron_tested'
   kind: 'growth' · category: 'boon' · polarity: 'gain' · direction: 'gain'
   title:  'Iron, tested'
   causeClause: 'A war column that came forward and stopped'
   detail: "{actor}'s capability in the iron reach moved. Standing a war column down teaches it faster than a drill yard does."
   stateNoun: { text: 'iron capability', tooltipId: 'reach.iron' }
   concepts:  [{ text: 'the iron reach', entityId: '$actor', tooltipId: 'reach.iron' }]
   ```
   **Backing write:** `applyEncounterGrowth` on resolution — the actor's capability in the step's reach moves. *(The brief's "capability `growth` on the critical-success band", currently a one-user surface — the exemplar.)*
   **Anchor — Pass 2 correction applied.** The generated anchor catalog's Stats table is unambiguous: *"A stat anchor names the bearer **and** the stat: the bearer by `entityId`, the stat by `tooltipId`. A stat sentence with no bearer is not anchored."* The draft declared `tooltipId` alone, following the exemplar, and deferred the question to Pass 3. The catalog is generated from the live type unions and current by construction; the exemplar is one hand-written fixture. `entityId: '$actor'` added to the concept, which is exactly the form the table describes. Strictly additive; it cannot make the chip worse. `stateNoun` keeps the tooltip alone, because it renders raw into the `CATEGORY · NOUN` tag and is not enriched.

2. **PATH · `a company membership`**
   ```
   id: 'toll.on_the_rolls'
   kind: 'future_hook' · category: 'path' · polarity: 'gain' · direction: 'opens' · storyWeight: 'beat'
   title:  'Written onto the rolls'
   causeClause: 'A recruiting question, asked in the road'
   detail: "{actor} is on the company's member list now, at the lowest rank it keeps."
   stateNoun: { text: 'a company membership', entityId: '$faction:mercenary_company', visualKind: 'faction' }
   concepts:  [{ text: "the company's member list", entityId: '$faction:mercenary_company', visualKind: 'faction' }]
   ```
   **Backing write:** step 2 `successMetadata` → `membership_change` `op: 'join'`, which writes the `member_of` edge through the same shape `processFactionJoinOutcome` writes.
   **The gate gap the draft found is fixed centrally** (commit `659962a9`): `CHIP_BACKING_EFFECT_KINDS` in `src/data/content-eval/compositionContract.ts` now carries `membership_change` — and `agent_relocation`, found by the test that pins that set against `CAST_TARGET_PERSISTENT_KINDS`. Read in source and confirmed. **The chip stays.**
   **Banding verified by hand**, which is the part the gate cannot do: `membership_change` sits on step 2's `successMetadata`; `isStepSuccess` counts `critical_success` as success-side; step 2 is the final step with `failBehavior: 'fail_action'`, so a `critical_success` *action* band implies step 2 landed success-side and the write fires **on this band**. It is not a neighbouring band's write borrowed by a chip.
   **PATH is legitimate here** (rule 3): the simulation *acts* on a membership — faction quests, rank, expulsion, standing all key off it. This is not "the fiction moved". The anchor catalog routes `member_of` to *"the faction sheet's roster, and the member's own sheet"*.

3. **BOON · `standing with the company`** — as authored on the `success` band below, repeated here (the critical band inherits nothing automatically). Backed by the same `reputation_with` write.

---

#### `success`

**overview**
> Two carters watched the whole row and told it again at the next halt. By evening the column's officers had heard about the traveler who would not move.

**changes**

1. **BOON · `standing with the company`**
   ```
   id: 'toll.the_company_noticed'
   kind: 'faction_reputation' · category: 'boon' · polarity: 'gain' · direction: 'gain'
   title:  'Noticed by the company'
   causeClause: 'An afternoon that ended with the agent still on their feet'
   detail: "{actor}'s standing with the mercenary company went up. The company thinks better of them than it did before the column stopped."
   stateNoun: { text: 'standing with the company', entityId: '$faction:mercenary_company', visualKind: 'faction' }
   concepts:  [{ text: 'standing', tooltipId: 'ui.standing' },
               { text: 'the mercenary company', entityId: '$faction:mercenary_company', visualKind: 'faction' }]
   ```
   **Backing write:** step 2 `successMetadata` → `reputation_with` `targetFactionId: 'mercenary_company'`, `delta: +0.12`. In `REPUTATION_EFFECT_KINDS`, therefore in `CHIP_BACKING_EFFECT_KINDS` ✓.
   **This is the brief's faction-standing target, #1 of the batch's 2.** `ui.standing` is the tooltip id the anchor catalog's Stats table names, and the faction concept carries the bearer `entityId` the same table requires alongside it. The `reputation_with` anchor rule is *"anchor the counterparty"* — done.
   **Law 13 parity ✓:** world standing and faction standing both pass visibility parity. No `reputation_tally` chip is authored anywhere in this encounter (rule 0d), which is a released-defect class `check:encounter` fails on.
   **Pass 2 fix:** the title said *"Standing with the column"* while the `stateNoun` said *"standing with the company"* and the neighbouring PATH chip said *"the company's member list"* — column and company used interchangeably in the one stack that tells the player which body they now belong to. The detail also repeated the overview's *"officers heard about"* verbatim.

---

#### `success_at_cost`

**overview**
> A sack went onto the cart and the rest stayed on their back. {cast:serjeant} closed the tablet two rows early to end it there, in front of the whole line, and did not explain why.

**changes**

1. **BOND · `a favour owed`**
   ```
   id: 'toll.the_serjeants_debt'
   kind: 'shell_state' · category: 'bond' · polarity: 'gain' · direction: 'gain'
   title:  'A tablet closed early'
   causeClause: 'Less taken than the column was owed'
   detail: 'The serjeant, {cast:serjeant}, owes {actor} a favour now — and owes the column an explanation.'
   stateNoun: { text: 'a favour owed', entityId: '$cast:serjeant', visualKind: 'agent' }
   concepts:  [{ text: 'The serjeant', entityId: '$cast:serjeant', visualKind: 'agent' }]
   ```
   **Backing write:** step 2 `successMetadata` → `favor_creation`, `debtorAgentId: '$cast:serjeant'`.
   **Rule 0c, in order:** the `stateNoun` names the **mechanic** (`a favour owed`, not "the tablet they closed"); the `detail` names the **endpoints** (who owes whom what); the fiction comes last, decorating a claim already read.
   **Rule 0c anchoring:** `favor_creation` mints `owes_favor` with **debtor = the named debtor, creditor = actor**, so the chip anchors the **serjeant** — anchoring `$actor` would point the player's click at the wrong person, which is the exact defect The Grateful Kin shipped and which `chipAnchorDeclarations.ts` documents at length.
   `concepts.text` is `'The serjeant'`, a substring that survives enrichment — not the token itself, which enrichment replaces.
   **Pass 2 fix:** the causeClause repeated *"the tablet … two rows … early"* from the overview directly above it, and the detail repeated *"the whole line watched it happen"*. Both now say something the overview does not.

2. **SCAR · `a wound`** is *not* authored on this band, and the reason is the point of the rule: `wounded` is minted by step 2's `failureMetadata`, which cannot fire on a success-side action band. A wound *can* still be present here — from a step-1 failure that continued weakened — but "sometimes true" is not a chip. It shows in the automatic delta cluster instead.

---

#### `failure`

**overview**
> The road is clear again by evening. What it cost is in the shoulder and the hip, and in the next few days. Getting up takes a while, and walking takes longer.

**changes**

1. **SCAR · `a wound`**
   ```
   id: 'toll.what_the_column_left'
   kind: 'trait' · category: 'scar' · polarity: 'loss' · direction: 'loss'
   title:  'Boots and spear-butts'
   causeClause: 'Boots and spear-butts, and no room at the roadside'
   detail: '{actor} is carrying a wound from it, deep enough to show in how they move.'
   stateNoun: { text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }
   concepts:  [{ text: 'a wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }]
   ```
   **Backing write:** step 2 `failureMetadata` → `apply_condition` `trait.condition.wounded` on `$actor`.
   **Anchor:** an attachment template node id — the one literal an author may write, because a template node is committed content identical in every world (`classifyAnchorDeclaration` accepts it through `getAttachmentTemplateNode`). `visualKind: 'attachment'` gives the word a route to `AttachmentDetailView`, which is what THR-1164 added and what the exemplar's `exhaustion` concept uses.
   **Pass 2 fixes:** the overview said the agent was *"walked off the road"* — step **1's** defeat — directly under a step-2 afterimage saying they sat down and the column stepped around them, so the two sentences contradicted each other on one screen (§ 1, B8). The chip's title *"Walked off the road"* inherited the same error and fitted neither of the two bands it serves. The causeClause repeated *around* from the afterimage, and the detail repeated *"the next few days of road"* from the overview.

---

#### `critical_failure`

**overview**
> The herd came through and they were still in front of it. What the column did not take, the mud did. They woke at the roadside with the tail of the column already small in the distance.

**changes**

1. **SCAR · `a wound`** — the same chip as `failure`, same backing write. A critical failure is a battering and a robbery; it is never a scripted death (this encounter's stakes rule, and the batch's "hard, not grim" tone assignment).
2. **SCAR · `standing with the company`**
   ```
   id: 'toll.an_easy_row'
   kind: 'faction_reputation' · category: 'scar' · polarity: 'loss' · direction: 'loss'
   title:  'An easy row'
   causeClause: 'A row the column found easy'
   detail: "{actor}'s standing with the mercenary company went down. The company thinks less of them than it did before the column stopped."
   stateNoun: { text: 'standing with the company', entityId: '$faction:mercenary_company', visualKind: 'faction' }
   concepts:  [{ text: 'standing', tooltipId: 'ui.standing' },
               { text: 'the mercenary company', entityId: '$faction:mercenary_company', visualKind: 'faction' }]
   ```
   **Backing write:** step 2 `failureMetadata` → `reputation_with` `delta: -0.10` ✓.
   **Pass 2 fixes, two.** The detail read *"told it that **way** at the next halt"* — `way` is a natural indefinite and `EncounterAftermathChange.detail` is **`outcome`** field class (`nudgeAuditDetectors.ts`, `pushAftermathVariant`), where natural indefinites are enforced at zero. `check:encounter` would have failed on it. And the `concepts` array declared only the stat while its `success` twin declared stat *and* faction — the same quantity with two different anchor shapes in one encounter, against a catalog that requires the bearer. Both fixed; the boon and the scar are now mirror images, which is what a player reading standing move in either direction should see.

### Chip audit against Law 56

| Band | Chip | Backing effect | In `CHIP_BACKING_EFFECT_KINDS`? | Fires on **this** band? | Anchor | Anchor form |
|---|---|---|---|---|---|---|
| `critical_success` | BOON iron capability | `applyEncounterGrowth` (resolution) | derived — the resolution-time diff, same shape as the exemplar's `growth` chip | every band ✓ | `$actor` + `reach.iron` | stat (bearer + tooltip) |
| `critical_success` | PATH a company membership | `membership_change` | **✓ since `659962a9`** | success-side ✓ | `$faction:mercenary_company` | 🔗 linked |
| `critical_success` / `success` | BOON standing | `reputation_with` | ✓ | success-side ✓ | `$faction:mercenary_company` | 🔗 linked |
| `success_at_cost` | BOND a favour owed | `favor_creation` | ✓ | success-side ✓ | `$cast:serjeant` | 🔗 linked |
| `failure` / `critical_failure` | SCAR a wound | `apply_condition` | ✓ | failure-side ✓ | `trait.condition.wounded` | 🔗 linked |
| `critical_failure` | SCAR standing | `reputation_with` | ✓ | failure-side ✓ | `$faction:mercenary_company` | 🔗 linked |

Sentinel legality checked against `src/data/content-eval/chipAnchorDeclarations.ts`: `$actor` ✓, `$cast:serjeant` (key declared in `supportBundle` ✓), `$faction:mercenary_company` (`MERCENARY_COMPANY_DEFINITION` is registered in `FACTION_DEFINITIONS` and therefore in `ALL_FACTION_DEFINITIONS` ✓), and the attachment-template literal ✓.

**Anchor-kind spread (the brief's "avoid defaulting to `individual` agents"):** `faction` ×3, `attachment` ×1, `agent` ×1, `stat` ×1. This encounter carries **faction standing #1 of the batch's 2**. No chip anchors landscape fiction — there is no "the road" chip and no "the column" chip, because a column is not a graph object and a road is not a node (the Unsafe Bridge defect the catalog's closing note is written against). The road survives in the overviews, which are prose and claim nothing.

**Rewards block:** `favor_creation` is a `PERSISTENT_EFFECT_KINDS` member, so something persists by the aftermath route. The condition grants persist too. No `rewardPool` draw is authored: the design row's stakes are `standing`, and **penalty-avoidance is the baseline reward shape** — the pack stays on and the day is not lost.

### One prose claim with no write behind it — narrowed, and raised

The draft asserted in three places that the column takes the agent's **pack**: the `failure` overview, the step-2 `critical_failure` afterimage, and the stake line. Nothing writes it — there is no `rewardPool` failure draw, no attachment removal, no possession effect anywhere in the packet. A player reading *"the column took the pack"* and opening their sheet finds the pack.

This is not trigger 31 (which governs *base scene prose asserting agent history*) and it is not a Law 56 violation (no chip claims it). It is the same family one surface over: outcome prose narrating a loss the engine did not perform.

**Applied:** the pack theft now appears **once**, in the `critical_failure` overview, where the design block explicitly declares it (*"a critical failure is a battering and a robbery"*). It is gone from `failure` — which also resolves the contradiction in § 1, B8 — and from the `critical_failure` afterimage. `failure`'s cost is now carried entirely by the two things that band genuinely writes: the wound and the standing.

**Raised to Pass 3 with a concrete option:** `failureMetadata.rewardPool` is the documented equipment-loss channel, and one at `critical_failure` would make the remaining sentence true. Not taken here because it spends a `possession`-family surface the batch assigns to encounter #3 — a batch-level trade, not an editorial one.

---

## 9 · Images

### Card `imageTag`s — every one resolves to a live `ENCOUNTER_IMAGE_LIBRARY` row

| Card | `imageTag` | Library row (concept · sphere) | Genericity test — three unrelated encounters it reads in |
|---|---|---|---|
| A Little More (×2) | `generic.focus` | focus · mind — *a hand holding a needle still, the tremor going out of it* | a surgeon's cut · a lock being read · a shot held at range |
| A Sudden Surge | `generic.energy` | energy · energy — *a charge gathering at a weathervane's spike* | a sprint from a collapsing mine · a rope hauled clear · a last push up a pass |
| Something Gives Way | `generic.matter` | substance · matter — *quarried stone opening cleanly under a chisel* | a debtor's door giving · a dam seam parting · a smith's flawed billet splitting |
| Full Weight (×2) | `generic.strength` | strength · force — *a roof-beam bowing under fallen stone and holding* | a cart held off a child · a gate braced against a mob · a shield wall |
| No Middle Ground | `generic.luck` | luck · chaos — *a coin on edge, caught before it tips* | a wager called · a jump taken · a name drawn from a hat |
| Shoulder To Shoulder / Shared Watch | `generic.blessing` | blessing · spirit — *wisps settling over a plain clay bowl* | a company's oath · a vigil kept · a shared meal before a hard road |
| By The Book | `generic.ward` | ward · order — *a poured salt line the dark presses against and does not cross* | a contract signed · a quarantine held · a bond posted |
| The Slow Push | `generic.vigor` | vigor · life — *a hooded silhouette straightening, breath rising* | a long march · a fever ridden out · an all-night watch |
| **It Passes** | **`generic.warmth`** | **warmth · life — *hearth-warmth creeping across cold flagstones*** | **a fever broken · a frostbitten hand thawing · a night watch ending** |

Nine distinct tags, all verified live in `src/data/encounter-image-library.ts`.

**Two documented mismatches, both deliberate.** `Something Gives Way` is a `chaos` card on a `matter`-signed plate, and `The Slow Push` is a sphere-less card on a `life`-signed plate. In both cases the plate names the **concept the card is about** — a structure giving at its loose piece; a body straightening into a long effort — which is what the genericity bar measures, and the alternative in each case was a plate whose concept was wrong. Recorded rather than silently taken, because a wrong `imageTag` falls back to the category generic **silently at render** and the art the author believed they picked is simply never seen. `It Passes` is a `life` card on a `life`-signed plate, so it adds no third.

**No card carries `fictionBySetting`.** Every flavor quote names no class scenery, which is the post-pivot norm; the field exists for the rare exception and this encounter is not one.

### Scene tag

`road.column.halted` (WS4 vocabulary). Until the scene manifest exists the fallback chain ends at EntityVisual. No `illustrationUrl` is declared.

---

## 10 · Concept art direction

**Question 1 — what emotions does this story convey?**
The smallness of one person in front of an organized machine. The particular indignity of being robbed by people keeping books about it. The cost of staying where you are while something enormous goes past you for hours. And, underneath, a flat unglamorous competence: this is somebody's *job*.

**Question 2 — what image evokes those emotions while staying inside the world?**

> **A wax tablet lying open on a milestone at the roadside, stylus fallen beside it, the wax scored with half a dozen short entries and one line left blank. The road behind the stone is churned to mud in two deep wheel-ruts running out of frame. Low grey afternoon light. No people, and no column — only the marks it left.**

Residue, not event: the tablet is the instrument of the toll and the blank line is the whole encounter's best outcome, sitting there unexplained. The ruts say how much went past and for how long. The absence of any figure is correct — the agent's portrait is the only likeness the flow carries, and painting a confrontation would illustrate the scene the prose already writes.

**Explicitly not:** a fight; a soldier levelling a spear; a face. Those are the events; this is the aftermath.

---

## 11 · Detector self-scan

> **The field-class map below is corrected against the code, which is the contract.** The draft's version listed *aftermath overviews* in the `outcome` class and did not classify chip `detail` at all. `src/data/content-eval/nudgeAuditDetectors.ts` says the opposite — `push(body.overview, 'scene')` and `push(change.detail, 'outcome')` — with a doc comment (*"Why `overview` is `scene` and `detail` is `outcome`"*) recording the measurement behind it: reading `overview` as `outcome` flags 165 fields on indefinites against 57 genuinely evasive, and every one of those in the director-reviewed slice is prose like *"Nothing was promised. Nothing was taken."*, the contortion THR-899 split the lexicon to end. The draft was stricter than required on overviews and blind on details, which is exactly the shape that let a `way` through in a detail. Both surfaces re-scanned under the code's classes.

| Field | Class |
|---|---|
| openings · `initiation` · step `narrativeTemplate` · card `fiction` · **aftermath `overview`** | `scene` — evasive only |
| five afterimages per step · card `bandProse` fragments · `narrativeTemplates.success`/`.failure` · **chip `detail`** | `outcome` — evasive **and** natural indefinites |
| template `name` · card `name` · `effectLine` · `purposeLine` · factor lines · carryover lines · **chip `title`** · **reaction `label`** | `interactive` — evasive only |

| Detector | Target | This encounter |
|---|---|---|
| **Vagueness — evasive** (every class) | zero authored | **0 authored, 1 inherited.** No `somehow`, `somewhat`, `seems to`, `appears to`, `a kind of`, `a sort of`, `something like`, `in some way`, or any nominalised placeholder (`the situation`, `the moment`, `the tension`, `the atmosphere`, `the dynamic`, `the balance`, `the presence`, …). Checked across four openings, the initiation, both spines, all ten afterimages, all 24 band fragments, both `narrativeTemplates`, five overviews, six chip details, six chip titles, twelve effect lines, six carryover lines, one trait factor line and two reaction labels. **The one hit is not authorable here:** `something` is on the evasive list and `card.stumble.signature.chaos`'s shipped title is *"Something Gives Way"*, so every hand that deals the library's Stumble inherits it. Library content is out of scope batch-wide; recorded for the `CARD_CONTENT` owner in § 14. |
| **Vagueness — natural indefinites** (`outcome` class only) | zero | **0.** One hit found and fixed in Pass 2: `toll.an_easy_row.detail` read *"told it that **way** at the next halt"* — `way` is a lexicon member and `detail` is `outcome` class. **Stated precisely:** the gate is `vaguenessDensity >= VAGUENESS_DENSITY_FAIL` (2.0 per 100 words, summed across all three classes over the whole template), so at ~1,200 authored words that single hit would not have turned `check:encounter` red on its own. It is a standards fix against a stated target of zero, not a gate rescue — and the distinction is recorded so the next author does not read "one is survivable" as the rule. Three more were caught in draft: `critical_success` afterimage step 1 said *"wrote **nothing** in the row"* → **"left the row blank"**; the gambit's `critical_failure` fragment said *"the whole **thing** went the other way"* → now **"they were in the mud before the serjeant finished the row"**; the fallback overview said *"is on the tablet **somewhere** ahead"* → **"is riding north with the column"**. The initiation's *"nothing else moves until it has"* is `scene` class, where natural indefinites are ordinary English, and is deliberately the plain sentence rather than a contortion around the detector. |
| **Intensifiers** (warn only, every class) | low | **0** `very` / `really` / `quite` / `rather` / `truly` / `deeply` / `profoundly` / `utterly`. One draft line used *"it goes very well or very badly"* and was rewritten. |
| **Annotation patterns** (`notButClause`, `emDashNot`) — ≤ 1 across the whole encounter | **0** | No `not … but` clause anywhere. Every em-dash in the packet is followed by a noun phrase, a list, or a conjunction — the battlefield opening's *"— spear, boot, buckle —"* and the BOND detail's *"— and owes the column an explanation"* — never a negation. The one place a negation stands alone, Full Weight's *"and then not standing"*, is a coordinated clause and matches neither pattern. Budget unspent. |
| **Divine outcome-authorship** (`DIVINE_DECISION_PATTERNS`, zero in every class) | zero | **0.** No `decides`/`chooses`/`chose`/`picks`/`determines` followed by `whether`/`what`/`which`/`who`/`if` and a clause, and no bare "the outcome". The `initiation` says the *column* takes what it needs — a mortal body, no decision verb. Every `effectLine` describes the god's **own act** (*you steady*, *you pour*, *you loosen*, *you put force behind*, *you strip*, *you lean*, *you take*, *you set*), which is the untouched half of rule 5b. |
| **Abstraction-as-subject** (judgement call, run by hand) | pass | Grammatical subjects across the scene prose: *the road, the roof, a column, travelers, tethered horses, cook-smoke, the turf, crows, the gate, wagons, two soldiers, the line, a serjeant, the stylus, the agent, the body, the company, the spears, the tablet, the herd, the mud, two carters.* Concrete throughout. Two abstractions were doing concrete work in the draft and are gone: *"the late demand"* (The Slow Push) and *"The half-measures wash out"* (No Middle Ground). No paragraph closes on an abstraction. |
| **Digits / `%` in an `effectLine`** | zero | **0** across all twelve cards. Magnitude is carried by the pip row and, in words, by *"A small help" / "A real help" / "A strong help"*. |
| **Second person on a mortal-drawn template** (`countSecondPerson`, `outcome` + `scene` only — `interactive` is carved out by THR-1045 so an `effectLine` saying *"You steady them"* does not fail the format's own worked example) | < `SECOND_PERSON_FAIL` 2 | **0.** `actorAffinities` carries no `ascendant`, so this template *is* mortal-drawn and the gate is live for it. Every opening, spine, initiation, afterimage, band fragment and overview is third person; the twelve `effectLine`s are the only second-person text and they are `interactive`. |
| **God instructing the mortal** | zero | **0.** No card tells the mortal anything. The god steadies a nerve, pours energy into a body, loosens ground under an opponent, puts weight behind a stance, strips the middle out of the ladder, lifts weariness, closes a company up, and sets a floor. The mortal still stands or does not, and fate still rolls. |
| **Nudge-specific payoff in base band text** | zero | Every afterimage and both `narrativeTemplates` read correctly with **no** card played, checked line by line. Card-specific consequences live only in `bandProse`. |
| **Static `factorLines`** (THR-892) | zero authored | Both steps leave `factorLines` unset. The only authored panel lines are the trait variant's (renders only for the trait-holder) and step 2's six carryover lines (keyed on the band step 1 rolled, and every one now true of the base text it keys on). |
| **Seam echoes** (no detector exists) | zero | Nineteen found and cleared; full enumeration by seam class in § 2. |
| **Word budgets** (warn) | within | Openings 50–61 words (`wayside` 50, `stronghold` 52, `ruin` 58, `battlefield` 60) against a 60 budget. Initiation 43. Spines 56 and 61. Afterimages 13–20. Fragments 11–19 against 25. Flavor quotes 5–8 against 30. Every card `name` is 3–4 words against a 6 cap. Every carryover line ≤ 12 words. |

---

## 12 · Composition Contract self-audit

| Block | Requirement | Status |
|---|---|---|
| **Steps** | 1–3 plain steps, each with a reach, a numeric difficulty and a `narrativeTemplate` | **PASS** — 2 steps, `iron` 0.36 and `stone` 0.42, both with a spine |
| **Hand** | ≥1 nudge-bearing step; `checkNudgeHand` rules | **PASS** — both steps bear hands; every guardrail checked card by card in § 5, recomputed after the Pass 2 swap |
| **Setting** | `settings` declared, envelope valid | **PASS** — four classes declared, four openings written, `locationSubtypes` derived with `expandSettings` |
| **Cast** | ≥1 actor binding on the resolved bundle; every `{cast:<key>}` names a declared key | **PASS** — `serjeant`, class-honest at all four classes; both `{cast:serjeant}` tokens name the declared key |
| **Rewards** | something persists | **PASS** — `favor_creation` (a `PERSISTENT_EFFECT_KINDS` member), plus three `apply_condition` writes |
| **Aftermath** | `aftermathConfig` present; `byOutcome` floor of ≥3 bands (one success-side, one failure-side, one extreme); every variant carries an `overview`; every change declares `concepts` | **PASS** — 5 bands authored (2 success-side, 2 failure-side, 2 extremes); fallback + all five carry an `overview`; all six changes declare `concepts` |
| **Systems** | ≥3 connections from the authored manifest | **PASS — 4** (`cast`, `reputation`, `conditions`, `rewards`) |
| **Images** | every card `imageTag` resolves to a library row; `illustrationUrl` public-absolute when declared | **PASS** — nine distinct tags, all live rows, table in § 9; no `illustrationUrl` |
| **Draw** | `consequenceDraw` recorded and every family wired | **PASS** — `['secret', 'membership']`, wired as `favor_creation` and `membership_change`. The gate gap that would have failed the membership chip is fixed centrally (`659962a9`); the chip stays |

**No `RETROFIT_PENDING` entry.** New content never starts on the ratchet.

---

## 13 · Experience Differentiator Gate — all 14

**Scene & prose**

1. **Does the opening place the player inside a moment already in motion?** **YES** — every class opens on a halt already made: smoke lying flat, axes on beams, crows resettling, wagons rolling out of a gate since dawn. Nobody is briefed; a queue is already forming.
2. **Does the prose have its own voice — cadence, rhythm, sentence variety?** **YES** — long inventory sentences for the column's work, short flat ones for the toll (*"The stylus stops at the agent's row."*), and dry closers that do not editorialize (*"The body answered. The column had more bodies."*). One idea per sentence, subject first, no fragment openers (three participial openers were fixed in Pass 2).
3. **Does the scene name the elements that later become choices?** **YES** — the grounded spears (Full Weight), the churned verge (Something Gives Way), the queue and the agent's own company (the Fellowships), the pack and the body (the Boosts, the Balm), the tablet and the row (what the whole hand is playing for).
4. **Would a reader feel something from the prose alone?** **YES** — the tablet is the thing that does it. Being robbed by people who write it down first is worse than being robbed, and the scene says so without saying so.
4b. **No seam echoes?** **YES.** Nineteen found across nine seam classes and all cleared; every seam this encounter has is enumerated and checked by name in § 2.

**Choices & intervention (the nudge hand)**

5. **Does every card face state its mechanism, with a generic 2–4 word title, a one-line quote, and zero scene-bespoke prose on the face?** **YES** — ten of twelve faces are verbatim from `CARD_CONTENT` in `src/data/nudge-card-library.ts`, verified id by id; the two Fellowship one-offs are written to the same bar and read correctly in any encounter where a company faces a demand.
6. **Is every card's price real and legible?** **YES** — essence on ten; **detection pressure** on both Heavy Hands (`detectionDelta` 0.15 and 0.12), stated in the effect line (*"Rival gods can hardly miss a hand this heavy"*); **the group** on both Fellowships (`requiresGroup` — you cannot buy a company you do not have); **the milestone** on The Slow Push (`requiredUnlock`). No card is free. And every effect line now names a divine act (No Middle Ground did not, and was rewritten).
7. **Does every card pay off in failure?** **YES** — 12 of 12 carry at least one `near_miss` / `failure` / `critical_failure` fragment, and both big-delta cards (0.16) carry `failure` **and** `critical_failure`.
8. **Is the hand grounded?** **YES** — delete the column and the road from the prose and every one of the twelve is senseless here. The step-1 Stumble is the strongest case: `opposes` binds it to a cast member the scene casts, so deleting the serjeant does not merely weaken the card, it changes what the panel reports. The step-2 Stumble was the weakest case and was replaced (§ 5).
9. **Do the cards answer different questions?** **YES** — tabulated per hand in § 5. Two Boosts appear in each hand and buy different certainties.
9b. **Does every nudge-bearing step carry a full authored hand, and does no step ask the player to pick a branch or an ending?** **YES** — 6 cards on each of two steps, every guardrail met. No `authoredChoices`, no `poleLean`, no fork.

**Aftermath & consequence**

10. **Does the aftermath have its own prose?** **YES** — five band overviews plus a fallback, each saying only what it alone can say, and none of them now restating the afterimage above it.
11. **Are consequence outcomes actor-centered?** **YES** — the serjeant owes a favour; the company writes a name on its rolls; the agent carries a wound and a standing. No anonymous stat deltas are chipped.
12. **For medium+ scale: does the aftermath offer reaction choices?** **YES** — two, on every band.
13. **Do the reaction choices represent different philosophical stances?** **YES** — the body in front of the god versus what gets said at the next halt. Person versus story.
14. **Does the concept art direction use the two-question method?** **YES** — emotions first, then an image of **residue**: an open wax tablet on a milestone with one line left blank, and wheel-ruts running out of frame. No people, no fight, no depiction of the scene the prose already writes.

**No answer is NO.**

---

## 14 · Open items for Pass 3

Everything below is a real finding, not a hedge.

| # | Item | Kind | Recommendation |
|---|---|---|---|
| 1 | ~~`membership_change` missing from `CHIP_BACKING_EFFECT_KINDS`~~ | **closed** | Fixed centrally in `659962a9`, with `agent_relocation` alongside it. Read in source; the PATH chip stays and its write is confirmed to fire on `critical_success`. |
| 2 | Growth-chip anchor form | **closed** | Pass 2 applied the generated anchor catalog's Stats form: bearer `entityId: '$actor'` on the concept plus the stat `tooltipId`. The catalog is generated from live type unions; the exemplar's one-field version is a hand-written fixture. |
| 3 | Repeated library members across the two hands | **resolved to two, both forced** | `card.stumble.signature.chaos` replaced by `card.balm.signature.life` in step 2. `card.boost.core` and `card.heavy_hand.signature.force` remain, and § 5 records why each is unavoidable. |
| 4 | **`fellowship`, `side_bet` and `signature` have zero members in `NUDGE_CARD_LIBRARY`** — while the batch design allocates all three and claims the batch "reaches all 21 types", and the brief requires `libraryCardId` on every card matching a member so the tally receives data | **finding against the batch design, not this draft** | Four allocations across three encounters (#1 ×2, #4 ×2, #6 ×1) cannot set a `libraryCardId` by construction, so the tally will never see them. Either the batch design's claim needs qualifying, or library membership needs three new members — which the brief puts out of scope. Raise it where it belongs rather than re-recording it in each of six drafts. |
| 5 | The `wayside` opening's "picket lines" against the spine's "line of held travelers" | **closed** | Rewritten. The word *line* now appears once per paragraph, in one sense. |
| 6 | `crudType: 'update'` chosen (not `'read'` as the exemplar uses for a crossing) | **judgement, recorded** | A stand-and-hold is an assertive act on the situation. `reputationPolarity` inference keys off this; Pass 3 to confirm the sign comes out positive, and set `reputationPolarity: 'positive'` explicitly if it does not. |
| 7 | `membership_change` `op: 'join'` fires on **every** success-side band, while only `critical_success` chips it | **deliberate** | Law 56 is one-directional. A quiet enrolment on a plain success is good simulation and the chip is authored where the fiction is loudest. |
| 8 | The pack theft is prose with no write behind it | **narrowed, raised** | Now confined to the `critical_failure` overview, where the design block declares it. `failureMetadata.rewardPool` at that band would make the sentence true; not taken because it spends a `possession`-family surface the batch assigns to #3. Pass 3's call. |
| 9 | `toll.let_them_rest` lifts a condition that only a step-1 failure mints, and which step 2's Balm can already lift | **known, precedent** | Same shape as the exemplar's `ford.rest_the_body`. Recorded so its no-op on some runs is not later read as a defect. |
| 10 | `plotHooks.ts` `usedBy` stamp for `stronghold_mobilization` | **closeout task** | Must be stamped when the encounter ships; nothing can do it automatically, and an unstamped hook stays likelier than it deserves forever. |
| 11 | **For the `CARD_CONTENT` owner, not for this encounter:** `card.stumble.signature.chaos` is titled *"Something Gives Way"*, and `something` is on the **evasive** lexicon, enforced in every class including `interactive` | **library content note** | Every hand that deals the library's Stumble inherits an evasive hit it cannot author away. One hit against a 2.0/100w density gate fails nothing, and library membership and content are out of scope batch-wide — but this batch is the corpus's first `stumble` user, so the face is worth a look before it is in twenty hands. |
| 12 | `npm run check:encounter -- encounter.border.toll_of_blades` has **not** been run — this packet contains no TypeScript | **expected** | Pass 3 runs the gate. The consequence draw recorded here is the batch design's roll and is recomputed by the gate from the template id. |

**Pass 2's mandatory independent critique (spec § 8) is discharged.** The fresh-context editorial read covered the 14 questions answered independently, design conformance against § 0's block, the widened seam check (nine seam classes, § 2), and read-aloud flow sentence by sentence. Findings, verdict and the reasoning behind each of the three judgment calls: [`toll-of-blades-editorial.md`](./toll-of-blades-editorial.md).
