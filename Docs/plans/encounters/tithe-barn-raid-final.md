# Encounter Pipeline: Blamed for the Tithe Barn
> Scale: short | Slug: tithe-barn-raid | Pass: final
> Date: 2026-09-30 | Pipeline version: 2.0
> Status: **READY FOR IMPLEMENTATION**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|---|---|---|
| Draft | Complete | A two-step shadow encounter: the Danger – Confrontation – Aftermath shape with a `decidedBy` fork on `honesty_cunning`. Consequence hand: `thread` + `omen`. |
| Editorial | PASS WITH REVISIONS (applied) | Fixed the seam echoes and page repetitions, the variant/template contradictions, the road/passage naming, and the village chip noun. No id, effect kind, number, step or fork changed. |
| Systems | READY FOR IMPLEMENTATION | Every effect kind, field, trait, role, tag, image tag and tooltip is live. Every chip is backed on its band. One correction: the reeve chip noun needed a tooltip anchor (Law 56 clause 2). |

### Caveats / Blockers
None. Non-blocking notes for the implementer:
- The step-1 `fallback` must be a full copy of the Confessor arm, **including** its `successMetadata` / `failureMetadata` effects.
- Aftermath change ids: use a prefix other than `tithe.`, which `tithe-demanded.ts` already uses. Applied at implementation: every nudge and chip id uses `barn.`.
- The reeve is spawned in practice. No rural subtype rosters a `steward`.
- The Confessor omen `narrativeHook`s said "the old roads", against § 5's naming rule. Fixed by the author after the systems pass ("old passages").

### Systems corrections applied to the packet
1. **§ 15 chip conventions, reeve chip:** `stateNoun` is now specified as `{ text: 'reputation', tooltipId: 'ui.reputation_with' }`. The revised text gave it neither `entityId` nor `tooltipId`, which `chipAnchorViolations` rejects (Law 56 clause 2). The ledger-by-lamplight precedent was followed, and it still avoids THR-1685 (no `{target}`, no `$cast:` anchor).

No other change. The packet below is the revised packet verbatim apart from correction 1.

### Editorial Notes Summary
Opening→spine seam echo cut. The elder's motive is stated in both step-1 spines. Every band overview was rewritten to follow its afterimage without restating it or its chips. The aphorism was cut. "Road" (shut) and "passage" (carved) were disambiguated. The village chip noun became `reputation with {target}` on `$here`. The failure chips now state the change. Card renames: Clear The Honest Road → Favour Plain Truth, and "easy" was dropped from Ease The Burden. The near_miss fragment was de-vagued. The step-0 critical-failure afterimage no longer burns the secret. The variant overviews and the failure template no longer contradict any band.

### Implementation File Map
Beyond the compiled set (`Docs/plans/encounters/tithe-barn-raid.package.json` → encounter module + structural test + both registrations via `compile:encounter`): **none.**

---

## Encounter Packet

## 0. Mechanical design block (designed before the prose)

| Row | Decision |
|---|---|
| Crux | The lord's reeve blames the agent for a theft from the tithe barn that only an expert sneak could manage, and shuts the road until the grain is found. |
| Title | **Blamed for the Tithe Barn** — the complication, from the agent's side, at a glance. |
| Shape | **Danger – Confrontation – Aftermath** (catalog). Step 0 is the danger announced: search the barn at night while the reeve's men watch it. Step 1 is the confrontation, an agent-decided fork (system target: **forks**). |
| Reach = theme | Shadow both steps. Step 0 (shadow **0.60**) is *about* getting into a watched building unseen. Step 1 (shadow **0.66**, both arms) is *about* moving unseen under a watch: lying in wait for the real thief, or carrying the grain back before the count. Mean 0.63, window fit 0.77 (expert). |
| Fork | `decidedBy: { axis: 'honesty_cunning' }` (Shadow's own pair). **Confessor (`positive`)**: name the elder to the reeve and catch the grain moving. **Puppeteer (`negative`)**: name nobody, carry the grain back through the passage before the dawn count. Fallback = the Confessor arm. Step 0 carries one special leaning each pole. |
| Why is the agent here? | `chance`: they arrive on tithe day and are named. Agent role **suspect or cause** (rolled). |
| Stake (P3) | **Obstruction** (rolled): the reeve has shut the road out until the grain is found. If it is not found, the village calls the agent the thief. Standing, not life. |
| Opposition | **The mortal's own trait** (rolled), read from the graph: `trait.reputation.shadow.negative` (Infamous) makes every watchman look for their face (−0.05); `trait.reputation.shadow.positive` (Enigmatic) means few can say what they look like (+0.04). The reeve's suspicion is the fiction of the same fact: the better the name, the likelier the blame. |
| Disposition | **Wary** (rolled): the reeve watches, does not arrest. |
| Scale | **Personal** (rolled): the agent's name in one village. |
| Hook | `plotHookTaken: hook.market_collapse` (grain fetched nothing at market, so the lord took the tithe in kind and the village is short of bread), blended with `hook.lost_civilization` (the thief's way in is a carved passage older than the village). `hook.home_becomes_dangerous` set aside. |
| Consequence hand (binding) | **`thread`** — `thread_strengthen` (`$ascendant` ↔ `$actor`) on the success side of both arms, `thread_weaken` on the failure side of both arms. **`omen`** — `emit_omen` (cultural, global) wherever the carved passage becomes public: both sides of the Confessor arm (time tint on success, darkness on failure) and the Puppeteer failure side (darkness). The Puppeteer success keeps the passage secret, so no omen fires there; a `hidden_mark` records the secret instead. No swap. |
| Extra writes | `reputation_with` `$here` (the village's regard): up on the Confessor success, down on both failures. `bond_change` `$cast:reeve`: up on Confessor success, down on both failures. `bond_change` `$cast:elder`: down on Confessor success, up on Puppeteer success. `hidden_mark` (secret_knowledge) on `$actor`, Puppeteer success. |
| Cool failure | Nobody is jailed, hurt or branded. The failure is the name: the village takes the agent for the thief and the reeve trusts them less. |
| Trait hooks | Gate: none (everyday board). Variant: the two shadow reputation traits above. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast (reeve, elder) + rewards (thread, bond, hidden mark persist) + reputation (`reputation_with`) — three, the floor. |
| Cost channels | Essence only. No Heavy Hand, no rider in any special. |
| `rarityTier` / `scale` / `intrinsicTier` | 2 / `local` / `shaping` (brief). |

---

## 1. Inspiration Anchors

- **`hook.market_collapse`** gives the pressure: grain that fetched nothing at market, a tithe taken in kind anyway, and a village short of bread. It supplies the thief's motive without a villain.
- **`hook.lost_civilization`** gives the way in: a passage of carved blocks older than the village under the barn floor. It is the thing the village reads as a sign (the `omen` family) and the secret the Puppeteer keeps (`hidden_mark`).
- **Seed die "suspect or cause"** turns the everyday shadow job inside out: the mortal is not hired to rob the barn, they are blamed for it because they are good enough to have done it.
- **Anti-patterns avoided:** the helpful passerby (the agent is the accused); the villain reveal (the thief is the village elder feeding hungry houses, so both arms of the fork cost somebody); prize-only success (the reward is a cleared name).
- The Dilemma Library was not consulted; the fork's moral weight comes from the hook (a hungry village) rather than from a stock dilemma.

## 2. Scale Justification

Short: two beats, one fork, a clean aftermath. The stake is one mortal's name in one village, which a short encounter carries without reaction choices.

## 3. Pressure Knot

The grain market collapsed; the lord took his tenth in kind; two nights ago a cartload left the tithe barn with no lock broken. The reeve has already decided who could do that, and has shut the road. The village elder has already moved the grain through an old passage into a cellar and means to share it out.

## 4. Intervention Fantasy

The god's mortal is being blamed for being good at their trade. The god can help them get into the barn unseen, lean them toward naming the elder or toward quietly undoing the theft, and then help the chosen course go clean: stretch the night for a patient watcher, or make the load light for a carrier.

## 5. Cast and World Objects

| Object | What it is |
|---|---|
| `{cast:reeve}` | The lord's reeve. Powerful across the table; wary. `spawnNpcRole: steward`, reuse `steward`. `spawnName: Aldric Venn`. must-persist. |
| `{cast:elder}` | The village elder who took the grain back for the hungry houses. `spawnNpcRole: elder`, reuse `elder` (hamlet roster). `spawnName: Maud Ashby`. must-persist. |
| `$here` | The village; `reputation_with` target and the village chip's anchor. |
| The tithe barn, the carved passage | Scene-local objects. The passage becomes world state only through the `hidden_mark` label and the omen's narrative hook. |
| Thread (`$ascendant` ↔ `$actor`) | `thread_strengthen` / `thread_weaken`. |

**Naming rule (editorial):** "the road" always means the road out that the reeve has shut. The carved way under the barn is always "the passage" on every player surface (spine, afterimages, overviews, chips, hidden-mark label). The omen texts use "passage" too.

## 6. Beat Structure

1. **Step 0 — Find the way in** (shadow 0.60, `continue_weakened`). The danger announced: the barn under the reeve's watch. Every band finds the loose floor stone; the bands differ in whether the watch saw.
2. **Step 1 — the confrontation**, fork on `honesty_cunning` (shadow 0.66 both arms, `fail_action`).
   - Confessor: **Catch the grain moving.**
   - Puppeteer: **Return the grain unseen.**

## 7. Branching Profile

- Branch depth: `light` · Branch count: **2** · Shape: Danger – Confrontation – Aftermath with a Personality Fork at the confrontation.
- Where branching lives: step-1 scene prose, the step-1 special, the outcome ladder, the aftermath variants.
- Convergence: none; each arm lands its own aftermath variant.

## 8. Branching Map

- Step 0 (both): the stone is found. The two step-0 specials lean the fork.
- Confessor → step 1 prose: the agent names the elder; the reeve will not take a suspect's word; the agent waits in the passage to catch the grain moving → aftermath: cleared or taken for the thief; the passage becomes public (omen).
- Puppeteer → step 1 prose: the agent names nobody and carries the grain back before the dawn count → aftermath: the count comes up whole and the passage stays secret (hidden mark), or they are caught with the tithe on their back (omen, taken for the thief).

## 9. Outcome Ladder

| Band | Confessor | Puppeteer |
|---|---|---|
| critical_success | Reeve catches the elder with the first sack; road opened; village hears who found the thief; hungry houses lose the grain. | Tithe counted whole; cartload called a miscount; the elder leaves a loaf on their pack. |
| success | Grain taken back from the elder; road opened; hungry houses lose the grain. | Tithe counted whole; road opened. |
| success_at_cost | Elder caught, half the grain already eaten. | Count one sack short; reeve says one sack is still owed. |
| failure | Elder never comes; reeve finds the agent alone in the passage and calls it proof. | Caught coming up through the floor with a sack. |
| critical_failure | Elder hears them and stays away; reeve finds them beside the grain and tells every house. | The reeve is waiting in the barn; shows the village the passage and the sack. |

## 10. Sample Opening (narrator mode)

**Opening (`rural`, the only class):**

> {actor} arrives in {location} on tithe day.

**Spine (step 0 `narrativeTemplate`, setting-neutral):**

> Grain fetched nothing at market, so the lord took his tithe in kind. Two nights ago a cartload left the tithe barn with no lock broken. {cast:reeve} says only one person here could do that, and names {actor}. The reeve has shut the road out until the grain is found. If it is not found, {location} will call {actor} the thief. Tonight {actor} searches the barn under the reeve's watch.

Word count: opening 7 + spine 67 = 74.

**Step 0 test panel:** reach shadow · difficulty 0.60 · purposeLine `Find the way in` · duration 1–2 · `continue_weakened`.

**Step 0 afterimages**
- critical success: "They lifted a loose floor stone and went down the steps below it, and the watch saw no light."
- success: "They found a floor stone that lifts, and steps going down beneath it."
- success at cost: "They found the loose stone, and a watchman heard it drop back into place."
- failure: "They found the loose stone, and the reeve's men saw them climb out of the floor."
- critical failure: "The reeve's men saw them go down through the floor, and now the whole watch is waiting."

## 11. The Hand Per Step

### Step 0 — deal `{ count: 4, tags: ['shadow', 'peril'] }` + 2 specials

**`barn.dull_the_sentries` — Dull The Sentries** · library type *Stumble* (hinders the opposition) · sphere **mind** · essence 2 · Δ 0.10 · `imageTag: generic.focus` · `poleLean: honesty_cunning → negative`
- effectLine: "Send a heavy sleep over the watch, so fewer eyes are open. It favours the quiet course."
- critical_success: "The men at the barn door slept sitting up until first light."
- success: "The watchmen nodded over their lantern, and neither looked toward the barn."
- near_miss: "The watchmen dozed, but one woke and walked the barn with a lantern."
- failure: "The watchmen dozed off, and a dog in the yard did the watching instead."

**`barn.show_the_plain_truth` — Show The Plain Truth** · library type *Whisper* · sphere **light** · essence 2 · Δ 0.07 · `imageTag: generic.light` · `poleLean: honesty_cunning → positive`
- effectLine: "Make the honest course look short and safe, so they act without second thoughts. It leans them toward naming names."
- success_at_cost: "The truthful course looked so plain that they stopped to weigh it, and were heard."
- failure: "They stood in the dark thinking about what to tell the reeve, and missed the watch changing."
- critical_failure: "They were still deciding what to tell the reeve when the reeve's men came through the door."

(Editorial renamed "Clear The Honest Road" because "Road" read as the literal shut road. At implementation both step-0 names moved onto `IMPERATIVE_VERB_LEXICON` verbs (Lull → Dull The Sentries, Favour → Show The Plain Truth) to clear the `check:encounter` card-name warn, and ids were re-prefixed `barn.`.)

### Step 1, Confessor arm — deal `{ count: 4, tags: ['shadow', 'social'] }` + 1 special

**`barn.stretch_the_small_hours` — Stretch The Small Hours** · library type *Boost* · sphere **time** · essence 2 · Δ 0.12 · `imageTag: generic.time-slow`
- effectLine: "Hold back the dawn a little, so a patient watcher has longer in the dark."
- success: "The night ran long, and the elder came down before the grey showed."
- failure: "The dark held on past its hour, and the elder still did not come."
- critical_failure: "The long night gave the elder time to hear them breathing in the passage."

### Step 1, Puppeteer arm — deal `{ count: 4, tags: ['shadow', 'labor'] }` + 1 special

**`barn.ease_the_burden` — Ease The Burden** · library type *Boost* · sphere **matter** · essence 2 · Δ 0.12 · `imageTag: generic.matter`
- effectLine: "Make every load sit light and quiet on the back, so a carrier moves faster and makes no sound."
- critical_success: "The sacks sat light on their back, and the old steps took the weight without a sound."
- success_at_cost: "The sacks went quick and quiet, and one split on the last step."
- failure: "The sacks rode easy, so they carried too many at once past a waking guard."
- critical_failure: "The sacks sat so light that they hurried, straight into the reeve's lantern."

Band coverage: step 0 specials cover all six bands between them; each arm's composed hand is covered by its special plus the dealt members' own `BAND_FRAGMENTS`. Every special has ≥1 failure fragment. No special reaches Δ 0.15.

## 12. Branch-Dependent Later Paragraphs

**Confessor (step 1 `narrativeTemplate`)** — purposeLine `Catch the grain moving` · shadow 0.66 · duration 1–2 · `fail_action`

> Under the stone, a passage of carved blocks older than the village runs to the cellar of {cast:elder}'s house. The missing grain is in that cellar. Half the houses are short of bread, and {cast:elder} took the grain to feed them. {actor} names the elder to the reeve. The reeve will not take a suspect's word. The grain goes out to the houses tonight, and {actor} must catch it moving.

Afterimages:
- critical success: "They waited in the dark passage until the elder came, and fetched the reeve without a sound."
- success: "The reeve came down the steps and found the elder with a sack on each shoulder."
- success at cost: "They caught the elder, but half the sacks were already shared out."
- failure: "The elder never came, and the reeve found them alone in the passage."
- critical failure: "The elder heard them in the dark, and the reeve found them alone beside the grain."

**Puppeteer (step 1 `narrativeTemplate`)** — purposeLine `Return the grain unseen` · shadow 0.66 · duration 1–2 · `fail_action`

> Under the stone, a passage of carved blocks older than the village runs to the cellar of {cast:elder}'s house. The missing grain is in that cellar. Half the houses are short of bread, and {cast:elder} took the grain to feed them. {actor} will not name the elder. The reeve counts the barn again at dawn. Before then {actor} carries the grain back through the passage, a sack at a time, past the reeve's men.

Afterimages:
- critical success: "Every sack was back on the barn floor, and the reeve counted the tithe whole."
- success: "The last sack went back up through the floor before the reeve came to count."
- success at cost: "The sacks went back, and the reeve's count came up one short."
- failure: "The reeve's men caught them coming up through the floor with a sack on their back."
- critical failure: "The reeve was waiting in the barn when they came up with the first sack."

## 13. Aftermath Paragraph (sample, Confessor success)

> The reeve took the grain back from {cast:elder} and opened the road by noon. The hungry houses get none of it. The village calls the passage under the barn a sign of good luck.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (short scale).

## 15. Aftermath Kit (the pages, per band)

`aftermathConfig.branchOnStep: 0`; variants keyed `positive` (Confessor) and `negative` (Puppeteer); `fallback` = the Confessor pages.

**Chip conventions (all bands):**
- Village chip: `stateNoun: { text: 'reputation with {target}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` — the town is what the prose means, so `{target}` resolving to the settlement is correct here (THR-1685 note).
- Reeve chip: `stateNoun: { text: 'reputation', tooltipId: 'ui.reputation_with' }` — no `{target}` and no `entityId` (THR-1685 workaround); the detail names `{cast:reeve}`. **[SYSTEMS CORRECTION]** the `tooltipId` is required: a `stateNoun` anchoring neither an `entityId` nor a `tooltipId` fails Law 56 clause 2 (`chipAnchorViolations`). Precedent: ledger-by-lamplight.
- Thread chip: `stateNoun: { text: 'thread', tooltipId: 'ui.thread' }`.
- Hidden-mark chip: `stateNoun: { text: 'hidden mark', tooltipId: 'ui.hidden_mark' }`.

### Confessor (`positive`) — variant overview: "{actor} named the elder to the reeve."

Step 1 `successMetadata.effects`: `bond_change $cast:reeve` (+0.12 sentiment, +0.1 trust) · `bond_change $cast:elder` (−0.15 sentiment) · `reputation_with $here` (+0.05) · `thread_strengthen` (`$ascendant`/`$actor`, reason "The god kept close in the dark") · `emit_omen` (cultural, 0.3, global, time): "A carved passage older than any village was found under a lord's tithe barn, and the country round says the old passages are opening again."

Step 1 `failureMetadata.effects`: `bond_change $cast:reeve` (−0.15, trust −0.12) · `reputation_with $here` (−0.08) · `thread_weaken` (reason "The god watched the blame land") · `emit_omen` (cultural, 0.3, global, darkness): "A carved passage was found under a lord's tithe barn with a stranger waiting in it, and the country round says the old passages bring bad luck to whoever walks them."

**critical_success** — overview: "The reeve caught {cast:elder} with the first sack and opened the road that morning. The reeve told {location} who had found the thief. The hungry houses get none of the grain. The village calls the passage under the barn a sign of good luck."
- BOND · REPUTATION — "The Reeve's Regard" — "{cast:reeve} no longer counts {actor} a suspect."
- BOND · REPUTATION WITH {target} (`$here`) — "Cleared in the Village" — "{location} thinks better of {actor}."
- BOND · THREAD — causeClause "The god kept close in the dark" — "The thread to {actor} runs stronger."

**success** — overview: "The reeve took the grain back from {cast:elder} and opened the road by noon. The hungry houses get none of it. The village calls the passage under the barn a sign of good luck." Chips as critical_success.

**success_at_cost** — overview: "Half the grain had already gone into the village's bread. The reeve took back the rest and opened the road. The village calls the passage under the barn a sign of good luck." Chips as critical_success.

**failure** — overview: "The reeve takes {actor}'s night in the passage as proof of the theft, and {location} now calls {actor} the tithe thief. The village calls the passage under the barn a sign of bad luck."
- SCAR · REPUTATION WITH {target} (`$here`) — "Lower in the Village" — "{location} thinks less of {actor}."
- SCAR · REPUTATION — "The Reeve's Doubt" — "{cast:reeve} trusts {actor}'s word less."
- SCAR · THREAD — causeClause "The god watched the blame land" — "The thread to {actor} runs thinner."

**critical_failure** — overview: "The reeve told every house in {location} that the best sneak in the country had robbed the lord. The village calls the passage under the barn a sign of bad luck." Chips as failure.

### Puppeteer (`negative`) — variant overview: "{actor} tried to return the tithe grain unseen."

Step 1 `successMetadata.effects`: `bond_change $cast:elder` (+0.12, trust +0.1) · `hidden_mark` (secret_knowledge, 0.3, label "the carved passage under the tithe barn", `$actor`, revealFamilies shadow + settlement) · `thread_strengthen` (reason "The god kept close in the dark").

Step 1 `failureMetadata.effects`: `bond_change $cast:reeve` (−0.15, trust −0.12) · `reputation_with $here` (−0.08) · `thread_weaken` (reason "The god watched the blame land") · `emit_omen` (cultural, 0.3, global, darkness): "A figure was seen climbing out of the floor of a lord's tithe barn with the tithe on their back, and the country round says the old passages under the barns are walked again."

**critical_success** — overview: "The reeve called the lost cartload a miscount and opened the road at dawn. {cast:elder} left a loaf on {actor}'s pack without a word."
- BOND · THREAD — causeClause "The god kept close in the dark" — "The thread to {actor} runs stronger."
- PATH · HIDDEN MARK — "The Passage Under the Barn" — "{actor} knows of the carved passage under the tithe barn."

**success** — overview: "The reeve found the tithe whole at dawn, called the lost cartload a miscount, and opened the road." Chips as critical_success.

**success_at_cost** — overview: "The reeve opened the road, but told {location} that one sack of the tithe is still owed." Chips as critical_success.

**failure** — overview: "The reeve counts the sack on {actor}'s back as proof, and {location} now calls {actor} the tithe thief. The village says the old passages under the barns are walked again."
- SCAR · REPUTATION WITH {target} (`$here`), SCAR · REPUTATION (reeve), SCAR · THREAD (causeClause "The god watched the blame land") — texts as the Confessor failure chips.

**critical_failure** — overview: "The reeve showed all of {location} the passage under the barn and the sack on {actor}'s back. The village now calls {actor} the tithe thief and says the old passages under the barns are walked again." Chips as failure.

### Narrative templates
- initiation: "The lord's tithe barn has been robbed with no lock broken, and the reeve names {actor} as the only one who could."
- success: "The reeve has the tithe grain back and has opened the road."
- failure: "{location} takes {actor} for the tithe thief."

### Trait variants
- `trait.reputation.shadow.negative` Δ −0.05 — "They are Infamous; every watchman looks for their face first."
- `trait.reputation.shadow.positive` Δ +0.04 — "They are Enigmatic; few in the village know their face."

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `reeve` (the lord's reeve) | lazy-materialize-on-trigger | reuse `steward`, else spawn `steward` "Aldric Venn" | must-persist | bond edge; chip anchor | live |
| `elder` (the village elder) | lazy-materialize-on-trigger | reuse `elder` (hamlet roster), else spawn `elder` "Maud Ashby" | must-persist | bond edge | live |

## 17. Self-Audit

| Item | Status |
|---|---|
| Opening skeleton ≤80 words, graph names | PASS (74) |
| One opening per declared class (`rural`) | PASS |
| Hands: 0–2 specials + deal on every nudge-bearing step | PASS (2 / 1 / 1) |
| Every special has a failure fragment; no big-delta special | PASS |
| No digits in effect lines; card names verb+noun; no name word in effect line | PASS (editorial: "Ease"/"easy" and "Road" collisions removed) |
| Trait refs live (`trait.reputation.shadow.*`) | PASS (in `reputation-trait-content.ts`) |
| Consequence hand wired: thread both sides both arms; omen on three of four arm-sides | PASS |
| Every chip backed by a write on its band | PASS |
| Person chips avoid `{target}` (THR-1685) | PASS — reeve chip noun is `reputation`, no `{target}`; the only `{target}` chip is anchored on `$here`, where the town is meant |
| Bound cast never gendered | PASS — "the reeve" / "the elder" throughout |
| Prose rule 7b — no promise about later | PASS — the road shut is a scene fact resolved inside the encounter; "one sack is still owed" is the reeve's statement, with no enacting claim |
| Systems ≥3 | PASS (cast, rewards, reputation) |
| Page read (every band, both arms) | PASS after editorial — no overview repeats its afterimage or its chips; no variant overview contradicts a band |

### Concept Art Direction

1. *Emotions:* being suspected for being good at something; a hungry village's quiet theft; old ground under new law.
2. *Image:* a single heavy flagstone lifted and leaning against a stack of tithe sacks in a dark barn, a rim of worn carved steps just visible in the black square beneath it, one grain sack slit and spilling across the flags. No people. Painterly, muted tones.

### Experience Differentiator Gate

1 YES · 2 YES · 3 YES (reeve, barn, watch, passage, elder, grain all named before cards act) · 4 YES · 4b YES (after editorial) · 5 YES · 6 YES (essence on every special) · 7 YES · 8 YES (watch, honest course, night, load all established) · 9 YES (sleep vs a pole lean vs time vs load) · 9b YES · 10 YES · 11 YES · 11b YES (after editorial) · 12 N/A short (no reactions, justified) · 13 N/A · 14 YES.
