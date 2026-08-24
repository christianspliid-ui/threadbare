# Encounter Pipeline: The Unclaimed Relic

> Scale: short (Single Test) | Slug: the-unclaimed-relic | Pass: draft
> Date: 2026-08-24 | Pipeline version: 3 (Encounter Factory, nudge-native, THR-1045 Composition Contract)
> Batch: border-perils (THR-1221), row **3**
> templateId: `encounter.border.the_unclaimed_relic`

**Binding inputs.** `Docs/plans/encounters/border-perils-brief.md` (approved) ·
`Docs/plans/encounters/border-perils-batch-design.md` § *3 · The Unclaimed Relic* (fixed design — filled, not renegotiated) ·
`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` (the authoring contract; wins on every disagreement) ·
`src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` (shape copied, not re-derived).

**This is a draft packet, not code.** No TypeScript was written and nothing under `src/` was touched. Field values below are given as plain field lists so Pass 3 can transcribe them; every id was resolved against live source and the resolution is cited inline.

---

## 1 · Mechanical design block (spec step 1 — written before the prose)

**0. The crux, in one plain sentence.**
> **The relic is lying in the open where anyone could take it, and the cold that has stopped everyone else from carrying it out is still there.**

**0b. Title states the crux.** *The Unclaimed Relic* — a player reading only the title knows there is a valuable thing and knows nobody has it. That is the complication and the objective, and nothing else is needed.

**0c. Catalogs** (one entry each, from `Docs/canon/encounter-catalogs.md`):

| Axis | Pick |
|---|---|
| Shape | `Single Test` |
| Setting | `wayside` · `ruin` · `battlefield` · `stronghold` (four classes, one opening each) |
| Pressure | `greed` (undertone `fear`) |
| Form | `discovery` |
| Objective | `recover` |
| Stakes | `item` — surface: attachment spawn (`spawn_artifact`) |
| System | `items` (primary) + `traits`; `conditions` in support. All mature tier. |

**0d. Hook.** `plotHookRolled: haunted_relic, masterwork_completion, long_road` · `plotHookTaken: haunted_relic`.
The take, verbatim from the batch design: *"What you came for is here, and so is whatever has been keeping everyone else from leaving with it."* Drift from the hook: the "whatever" is deliberately **not** a haunting with a face. It is a cold with a radius, which is the only version of the hook that reads at all four declared classes and the only one a `stone` endurance test can honestly resolve. `usedBy` gets stamped on `hook.haunted_relic` in `src/data/content-eval/plotHooks.ts` at closeout.

**1. Whose problem is this?** The agent's. The relic is in front of them and worth carrying; the cold is between them and it. They are the protagonist and the actor in every sentence — the other claimant is a person at the edge of the ring, not the subject of the scene.

**2. Which reach does the step test, and why is that the theme?** One step, `stone`. Stone is *endurance*, and the scene is literally about how long a pair of hands can stay in a cold that is taking them apart. The reach was chosen first and the scene grew from it: the ring of dropped gear exists because the test is "how long can you hold on", not "how clever are you".
Stone's archetype axis is Guardian ↔ Shaper; its value pair is `preservation_transformation`. The scene's own tilt sits on the two axes declared in `motivations` below.

**3. Why is the agent here?** Motive hooks, all four honest:
- `chance` — the road ran past a place people have stopped mentioning; the thing is sitting in it.
- `choice` — they came looking, because the story of the place travels.
- `mission` — sent to bring it back.
- `divine` — the god put them on this hex.
None of these is asserted in base prose (prose rule 7). The scene claims only what is in front of the agent.

**4. Which mechanics and objects play?**

| Fact the prose states | Classification |
|---|---|
| The relic, black iron, sitting in the open | scene-local until the step succeeds; then a **state write** (`spawn_artifact`, `successMetadata.effects`) |
| The cold with a radius | scene-local (priced into `difficulty: 0.42`) |
| The ring of dropped packs and a boot | scene-local — and the **Cache** card's target (its grant mints a real tool) |
| The other claimant at the ring | **state write** — declared `supportBundle` actor, key `claimant`; the bond is written by `bond_change` |
| Fear the agent may be carrying | **state read** on the Balm card (`remove_condition: trait.condition.terrified`); on the failure side a **state write** (`failureMetadata.effects`) |
| The place having watchers afterwards | **state write** (`condition_attachment: trait.condition.location.under_watch` with `targetLocationId`) |
| Wanting it too much | **state write** — the Undertow's `valueDrift` on `asceticism_extravagance` |

No sentence in base prose asserts a relationship, debt, prior visit or standing the graph does not hold.

**5. What are the rewards, and where does the tension sit?**
The prize is the object: **The Cold Reliquary**, spawned as a real artifact node into the agent's possessions. Penalty on failure is concrete and game-legible — `Terrified` for a couple of days, and the relic still sitting there for the next pair of hands. `success_at_cost` adds `Wounded`. Tension sits on a single question the player can restate: *how long do they stay in reach of it?* Quintessence stakes: moderate — a critical failure is a battering and a fright, never a scripted death.

**6. Does the mortal make a choice in this scene?** **None — this is a test.** The shape is `Single Test` by the batch design, and the batch's fork (with its `poleLean` debut) is allocated to row 4, *Standing the Line*. The Undertow card still moves the mortal's values, but through `valueDrift`, which shifts unconditionally and never picks a branch — the schema comment is explicit that these are different fields for different jobs.

**7. Every promise pays off.** The opening promises exactly two things and both are closed inside the encounter: *what is in the black iron* (never opened — the promise the prose makes is that it is **worth carrying**, and the aftermath pays that by putting a real artifact in their possessions), and *what happened to everybody else* (paid off at every band by the ring of dropped gear, and paid in person on `critical_failure` when the agent joins it and has to be hauled out). No mystery is opened that the bands do not close.

**8. Systems quota — connections counted from the authored manifest.**

| Connection | What authors it |
|---|---|
| `cast` | `supportBundle` — one actor spec, key `claimant` |
| `rewards` | `spawn_artifact` (step success) · `bond_change` (four bands) — both in `PERSISTENT_EFFECT_KINDS` |
| `conditions` | `apply_condition` (step failure) · `condition_attachment` ×2 (bands) · `remove_condition` (Balm grant) |

**Count: 3** — the contract floor (`COMPOSITION_SYSTEMS_QUOTA_MIN`), met from the manifest and not from prose. Deliberately *not* reached for: `reputation` and `factions`, which the brief allocates to rows 1 and 6, and `seeds`, which it allocates to row 4. The brief's stated **avoid** list is honored: no `reputation_tally`, no `hidden_mark`, no `encounter_seed` — the reflex stack is absent by design.

**Reachability (THR-821).** Open-draw ambient content (`intrinsicTier: 'background'`), so the single step sits at **0.42**, inside `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) and rendering as *fair*. This is the open-draw branch of the reachability rule; the encounter is not gated to actors who hold `stone`.

**Consequence draw (binding — `check:encounter` recomputes it from the template id).**

```
consequenceDraw: ['relationship', 'possession']
```

- `relationship` → **`bond_change`** with `$cast:claimant`, on four of the five authored bands, in both directions.
- `possession` → **`spawn_artifact`** on step success — the relic becomes a real artifact node with a real graph id, in the agent's possessions.

**No `consequenceSwap`.** Both drawn families wire in context without one; the valve stays unspent.

**Tone.** Not grim (batch design). Failure is cold and undignified and someone hauls you out of it swearing — an anecdote, not a tragedy.

---

## 2 · Inspiration anchors

| Source | What it contributed | What it did not |
|---|---|---|
| `hook.haunted_relic` | The premise's shape — the prize and the reason nobody has it are the same fact. | The haunting itself. A named revenant reads at a `ruin` and nowhere else; a cold with a radius reads at all four classes. |
| Swollen Ford exemplar | Structure only: the design-block header, the setting-neutral spine with the cast introduced in it, band fragments carrying the god's hand, the `byOutcome`-on-`fallback` pattern. | Its images. The seam check below explicitly hunts for exemplar echoes — two card fragments were rewritten because they had drifted into the exemplar's *"The X held. The Y did not"* and *"There was one more pull in them"* house mannerisms. |
| `Docs/canon/prose.md` § three plainness moves | Every paragraph opens on a subject; the abstract nouns were traded for what happened; one dry closer per beat. | — |
| THR-1130 density ruling | **One named person on stage** (the claimant) and props only where the player can act on them. An earlier pass had a named previous claimant *mentioned by* the present one — a third party naming a fourth, exactly the failure the ruling names. Cut. |

**Anti-patterns being avoided by name:** a scene the agent watches (rejection trigger 24 — the agent is the one reaching in); announced outcome mechanics (trigger 25 — no "hold on and X, let go and Y"); scene-bespoke card faces (trigger 16 — every face is library-generic and carries a `libraryCardId`); a grant naming unbuilt content (trigger 20 — every id below was resolved against live source).

---

## 3 · The scene-writer's checklist, answered in writing

**A1 · Where are we?**
Four openings, one per declared class, each grounded in ground/structures/light before anything acts. `wayside`: a hollow off a cart track where people have camped for years. `ruin`: half a hall, roof gone, floor under frost-burnt grass. `battlefield`: a slope down to a badly filled ditch. `stronghold`: a swept fort yard with one corner nobody uses.

**A2 · How does it feel?**
Two senses beyond sight in every opening. Wayside: dust and dry sage on the wind (smell), the wind itself (touch). Ruin: rooks arguing (sound), the draught across the ankles (touch). Battlefield: crows working the far end (sound), ground giving underfoot (touch), wet clay and old rot (smell). Stronghold: boots on the wall walk (sound), flags cold through a boot sole (touch). The spine adds the cold that takes the heat out of a hand.

**A3 · Who is here?**
The openings account for who is *not* here and why — the cold camp, the guard walk that turns back, the crows. The one person present is introduced in the setting-neutral spine, before any later line refers to them: *"Someone else is already here, waiting at that ring."* That is the cast binding. Nothing acts unannounced.

**A4 · What must we know?**
That the relic is worth carrying and that nobody has carried it. Both land in the initiation block, before the first step is asked for.

**A5 · Does the complication come last?**
Yes. Each opening builds the place; the spine puts the relic in it, then the cold on top of the relic, then the ring of dropped gear as the evidence, then the person still trying.

**B6 · Nothing referred to before it is introduced.**
Order in the spine: relic → the cold → the ring of dropped gear → the other claimant. Every card acts on something already in that list. The ring is introduced before the Cache card's grant comes out of it; the fear is evidenced by the ring and the second attempt before the Balm lifts it.

**B7 · Every event has a visible cause.**
The dropped gear is caused by the cold. The claimant's chafed hands are caused by a first attempt. The failure bands' opened grip is caused by the count running out.

**B8 · Nothing contradicts what is established.**
One relic, one ring, one cold. No opening names an hour, so the bands never contradict the light. An earlier draft's `stronghold` opening had the relic behind a beam-wedged door, which contradicted the spine's *sits where it was left, in the open* — the door was cut rather than the spine, because the spine is shared by four classes and the door was one.

**C9 · Would a real person do this?**
Yes: a valuable thing in the open with nobody guarding it is a thing people try for, and the ring of gear proves people have. Walking away is an obvious option and the initiation says what walking away costs.

**C10 · Do people react to each other like people?**
The claimant keeps a stranger's distance and does not interfere, warms their hands and works up to a second try, and on the worst band hauls the agent clear by the collar while swearing about it. On the plain failure band they do not remark on it, which is what a person actually does.

**C11 · Do actions carry their true cost?**
Cold, dead hands, an hour by the road, skin left on iron, a fright that does not go away for a couple of days. All of it lands in afterimages, band prose and real condition writes rather than in adjectives.

**D12 · Can the player restate the stake in one sentence?**
*"Do they come out of the cold holding it, or do they let go and join the ring of people who could not?"* A good outcome: the relic in their possessions and their hands working again by evening. A bad outcome: the relic still sitting there, a fright they carry off the hex, and — at the bottom — being dragged out of the cold by the one person who was decent enough to do it.

**D13 · Is every card grounded?**
Delete the relic, the cold and the ring from the prose and every card below is senseless here. Boost (core) acts on the effort of holding on; Boost (energy) on the cold; Cache on the ring of dropped gear; Insurance on coming away with the thing they came for; Undertow on how badly they want it; Balm on the fear the ring is evidence of.

**D14 · Does every card state mechanism, not mood?**
Yes — each `effectLine` says what the god does and why that moves the odds, in words, with no digit and no `%`.

**D15 · Does every declared class have an opening?**
Four declared, four written. `validateSettingEnvelope` enforces it at build time.

---

## 4 · Pressure knot (what is already in motion)

Nobody put the relic there for the agent to find, and nobody is guarding it. It has simply outlasted everyone who came for it. The gear on the ground is a record of that, kept by the place itself. One more person is here today doing the arithmetic on a second attempt, and will do it with or without the agent. The world event is that a valuable thing has been sitting in the open long enough for a habit to form around it: people come, people reach, people leave their packs.

## 5 · Intervention fantasy

The god cannot pick the thing up. What the god can do is decide **how long the hands last** — steady the grip past where it wants to open, drive a pulse of heat through a body that is shutting down, turn up the tool an earlier claimant abandoned, buy the floor so they come away holding it whatever else happens, take the fear out of them, or let the wanting run ahead of the caution and change what they will reach for next time. Every one of those is influence on the fabric of the scene or the mortal's inner weather. None of them tells the mortal anything.

---

## 6 · Setting envelope and openings

```
settings: ['stronghold', 'ruin', 'wayside', 'battlefield']
locationSubtypes: expandSettings(['stronghold','ruin','wayside','battlefield'])   // derived, never hand-written
```

Expands to: `castle`, `fort`, `ruins`, `ruined_tower`, `ruined_city`, `ruined_village`, `unexplored_poi`, `camp`, `oasis`, `wilderness`, `battleground`.
`urban`, `rural`, `sacred`, `arcane` are excluded batch-wide.

**Consequence (THR-1044):** a four-class envelope inherits **no** family default support bundle, so this template declares its own, class-honest at all four classes. See § 11.

### `openings.wayside` (54 words)

> A cart track runs out here into scrub and stops at a hollow where people have camped for years. Old fire-scars, a windbreak of piled thorn. The wind carries dust and dry sage across it. Nothing has been burned in the pit for a long while, and the thorn wall has gone grey.

### `openings.ruin` (46 words)

> Half a hall stands, roof long gone, the floor under a mat of frost-burnt grass. Rooks argue on the wall-heads and will not come lower. The stone holds none of the afternoon in it, and a steady draught crosses the doorway at ankle height.

### `openings.battlefield` (47 words)

> The field slopes down to a ditch that was dug in a hurry and filled in worse. Crows work the far end of it. The ground gives underfoot, soft with a season of rain, and the smell that comes up is wet clay and old rot.

### `openings.stronghold` (57 words)

> The fort's yard is swept and the gate is manned. This corner is used by nobody. Someone chalked a line across the flags and nothing crosses it — the boots on the wall walk come that far and turn back, and the sweepings pile against the chalk. The flags inside the line are cold through a boot sole.

*(`someone`, `nobody` and `nothing` are natural indefinites, which THR-899 enforces in **outcome** prose only. These are scene-class openings; the plain sentence is the correct one and no contortion is written around the detector.)*

### The setting-neutral spine — `steps[0].narrativeTemplate` (54 words)

> The relic sits where it was left: black iron, the size of a loaf. The air around it pulls the heat out of a hand in about ten counts. Packs and a dropped boot lie in a rough ring three paces out. Someone else is already here, waiting at that ring, chafing warmth back into both hands.

No mill, no rook, no chalk, no ditch — nothing in the spine names class scenery, so it reads identically under all four openings. `compileOpeningEnvelope` prepends `{frag:opening}` to this string at assembly.

### `narrativeTemplates.initiation` (48 words)

> Nobody who has come here has carried it out. That is the whole of what is known about it. Take it and it is theirs, to sell or to keep. Leave it, and the road is a road again by nightfall and the thing waits for whoever comes next.

### Seam checks (rejection trigger 22 — run explicitly, opening→spine and spine→band)

| Seam | Verdict |
|---|---|
| wayside → spine | `…the thorn wall has gone grey.` → `The relic sits where it was left…` — no shared image, no shared sentence shape. ✓ |
| ruin → spine | An earlier ruin opening closed on *"the doorway **pulls** a steady draught"* against the spine's *"the air **pulls** the heat"* — a verb echo across the seam. Rewritten to *"a steady draught **crosses** the doorway"*. ✓ |
| battlefield → spine | An earlier battlefield opening closed on *"old **iron** and turned earth"* against the spine's *"black **iron**"* — a noun echo across the seam. Rewritten to *"wet clay and old rot"*. ✓ |
| stronghold → spine | `…cold through a boot sole.` → `The relic sits…` — the chill recurs but as a different image (flags underfoot vs heat leaving a hand). ✓ |
| spine → afterimages | Spine ends on the claimant's hands; the afterimages open on the agent's. Deliberate rhyme rather than echo — the sentence shapes differ (`Someone else is already here, waiting…` vs `They lifted it clean and walked out…`). ✓ |
| corpus echo (exemplar) | Two card fragments were caught reproducing exemplar mannerisms and rewritten — see § 8, Boost (core) `failure` and Balm `failure`. ✓ |
| Annotation clauses | **One** em-dash construction in the whole encounter (the `stronghold` opening's `— the boots on the wall walk…`), and it is not a negation, so it matches neither `notButClause` nor `emDashNot`. Effective count against `ANNOTATION_MAX_PER_ENCOUNTER` (1): **0**. ✓ |

---

## 7 · Test panel data (the one step)

| Field | Value |
|---|---|
| `reach` | `stone` |
| `purposeLine` | **"Hold on to it"** (4 words, `REACH_PURPOSE_MAX_WORDS`; plain; says what is tested, not what the fiction is) |
| `difficulty` | `0.42` → renders *fair*. Inside the open-draw ceiling of 0.45. |
| `duration` | `{ min: 1, max: 2 }` |
| `failBehavior` | `fail_action` (single step — a failed reach ends the encounter) |
| `onSuccess` / `onFailure` | `[]` |
| `factorLines` | **None authored.** |

**No static `factorLines` (THR-892, rejection trigger 23).** Everything an earlier draft wanted to list — *"the iron does not warm"*, *"the ring is three paces out"* — reads identically on every run of this encounter, so it is priced into `difficulty: 0.42` and carried by the prose. What fills the panel is derived by `computeResolutionModifiers`: the actor's `stone` capability, equipment (including a Cache-granted tool, if the god bought one), terrain and place modifiers, conditions, divine attention. The one authored factor surface that survives the rule is the trait line in § 9, which is variance by construction because it renders only for the trait-holder.

**Step outcome metadata**

```
successMetadata.effects:
  - kind: spawn_artifact
    category: relic
    nameOverride: "The Cold Reliquary"
    targetAgentId: "$actor"
    tags: ["#stone", "#relic", "#ancient"]
    messageOverride: "The Cold Reliquary has left the place that kept it."

failureMetadata.effects:
  - kind: apply_condition
    conditionTraitId: "trait.condition.terrified"
    durationTicks: 24            # two in-game days at 12 ticks/day
```

Both channels are THR-783 step-outcome effects, the same shape the exemplar uses. `successMetadata` fires on `isStepSuccess`, which counts `near_miss` as a success — so a near miss also comes out holding it, which is what the `success_at_cost` band prose says. `failureMetadata` therefore fires only on the two genuine failure bands.

**Why the prize rides the step and not a reaction:** it makes the BOON chip **unconditionally backed** on every success-side band (Law 56), instead of backed only if the player happens to pick a particular reaction. The band reactions then carry only the writes their own chip claims.

---

## 8 · The hand (6 cards, one nudge-bearing step)

**Budget compliance.** Types allocated to this encounter by the batch design: **`cache`** (its corpus debut — one of the eight zero-use types), `insurance`, `boost` (≤2), `undertow`, `balm`. All five used, `boost` used exactly twice. **5 distinct types** (≥3 required). **5 distinct spheres** — matter, order, darkness, life, energy (≥4 required). **1 ungated common sphere-less option** (≥1 required). **1 rider** (≤1 required). **Every card sets `libraryCardId`** — the brief's instruction, so `cardPlayTally`, twilight harvest and the echo card finally receive data from this family.

**Card faces are the library's own authored faces.** `title` and `quote` are taken verbatim from `CARD_CONTENT` in `src/data/nudge-card-library.ts`, so the face a player learns on this card is the same face everywhere the member deals. Scene grounding lives in the band fragments and the prose, never on the face.

**Sum of `forecastDelta` across the hand: 0.49.** With `difficulty 0.42` the step plus its full hand stays inside `[0, 1]`, so no card is buying past the ceiling.

---

### Card 1 — Boost · **the ungated common option**

| Field | Value |
|---|---|
| `id` | `relic.a_little_more` |
| `libraryCardId` | `card.boost.core` |
| Type | `boost` (universal core) |
| `name` | **A Little More** |
| `sphere` | *(none — common pool, held by every god)* |
| `essenceCost` | `1` |
| `forecastDelta` | `0.06` |
| `imageTag` | `generic.focus` |
| `effectLine` | *You steady them at the point where effort usually gives out, so the last of it counts. A small help.* |
| `fiction` | *Most things fail by a margin.* |

`bandProse`
- `success` — *The last of the strength was there when it was asked for.*
- `failure` — *The steadying held right up until their hands stopped answering.*

> **Echo note.** An earlier `failure` fragment read *"There was a little more in them. The cold asked for a great deal more."* — a copy of the exemplar's Second Wind (*"There was one more pull in them. The river asked for three."*). Rewritten. This is the corpus-level echo the automated detectors cannot see.

---

### Card 2 — Cache · **the type's corpus debut**

| Field | Value |
|---|---|
| `id` | `relic.left_behind` |
| `libraryCardId` | `card.cache.signature.matter` |
| Type | `cache` — *"Something is left for them to find; ships with the item built"*; host system: attachments & items |
| `name` | **Left Behind** |
| `sphere` | `matter` |
| `essenceCost` | `2` |
| `forecastDelta` | `0.08` |
| `imageTag` | `generic.matter` |
| `effectLine` | *You turn up what an earlier hand set down and never came back for, and put it where they will find it. A real help, and it stays theirs after.* |
| `fiction` | *Matter keeps its promises longer than people do.* |

`grants`
```
- kind: attachment_grant
  templateId: "reward_tools_instruments_iron_tongs"
  targetAgentId: "$actor"
```

**Liveness.** `reward_tools_instruments_iron_tongs` is a live `REWARD_POSSESSIONS` entry (`src/data/reward-attachment-catalog.ts`, tier 1, tags `#stone #tool #craft`, `+0.03 Stone roll`, `stat_contribution { stone: 0.25 }`, `lossCondition: breakable`, flavor *"Blacksmith's tongs, well-used. The handles are polished smooth by grip."*). `validateNudgeGrantRefs` checks `attachment_grant.templateId` against a set that includes `REWARD_POSSESSIONS`, so this resolves. The item is also *mechanically* the right grant for a `stone` test — it is a `stone` tool, so the help the card promises and the modifier the panel derives are the same fact.

`bandProse`
- `near_miss` — *The tongs found the ring of it and held. Their arms did not.*
- `failure` — *The tongs came away with frost welded along the jaws, and the relic sat where it sat.*

> Face genericity: nothing on the face names tongs, a ring, or a relic. The card reads correctly in any scene where an earlier hand left something usable — which is the type's whole premise.

---

### Card 3 — Insurance · **the hand's one rider**

| Field | Value |
|---|---|
| `id` | `relic.by_the_book` |
| `libraryCardId` | `card.insurance.signature.order` |
| Type | `insurance` |
| `name` | **By The Book** |
| `sphere` | `order` |
| `essenceCost` | `3` |
| `forecastDelta` | `0.04` |
| `rider` | `floor_at_cost` |
| `imageTag` | `generic.ward` |
| `effectLine` | *However badly it goes, they come away holding what they came for. The price, if it comes due, is paid in skin and in gear.* |
| `fiction` | *Rules exist so the worst case has a name.* |

**Rider justification (the comment the checklist demands).** Order's signature buys the floor rather than the ceiling, priced at the hand's essence ceiling because it converts both plain failure bands into a paid arrival. It is the only rider here: a Gambit or a Mercy would answer the same question — *what shape does the outcome take* — a second time, and the batch's card-type budget allocates neither to this hand.

`bandProse`
- `success_at_cost` — *The floor had been bought before they reached in. The cost came off their hands.*
- `critical_failure` — *A bought floor still needs a hand to stand on it, and both of theirs had stopped.*

> The failure fragment sits on `critical_failure` because `floor_at_cost` erases `failure` and `near_miss` while the card is active — that is the only failure band still reachable with it in play.

---

### Card 4 — Undertow · **big delta (≥ `NUDGE_BIG_DELTA`)**

| Field | Value |
|---|---|
| `id` | `relic.the_easier_way` |
| `libraryCardId` | `card.undertow.signature.darkness` |
| Type | `undertow` — *"Strong boost through an ugly method; shifts the mortal's values"* |
| `name` | **The Easier Way** |
| `sphere` | `darkness` |
| `essenceCost` | `2` |
| `forecastDelta` | `0.16` |
| `valueDrift` | `{ axis: 'asceticism_extravagance', toward: 'negative' }` |
| `imageTag` | `generic.dark` |
| `effectLine` | *You let the wanting run out ahead of the caution, so they hold on past the point they would have let go. A strong help, and they will want the next thing this badly too.* |
| `fiction` | *It works. That is the problem.* |

**Why `valueDrift` and not `poleLean`.** The schema is explicit that these are different fields: `poleLean` argues a fork the mortal is already deciding and **moves nothing when the step does not fork**; `valueDrift` shifts values unconditionally, through the same `applyDriftMagnitude` accumulator a branch decision uses. This encounter has no fork, so a `poleLean` here would be an inert field. `asceticism_extravagance` is Gold's pair (Mender ↔ Magnate) — the axis about what you want to own, which is exactly what the card is doing to them.

`bandProse` — a big-delta card owes **both** failure bands:
- `critical_success` — *They held on past every reason to stop, and it came free in their hands.*
- `failure` — *Wanting it did not warm their fingers. They let go a long time after they should have.*
- `critical_failure` — *They would not let go, and the cold went up their arms and put them on the ground.*

---

### Card 5 — Balm

| Field | Value |
|---|---|
| `id` | `relic.it_passes` |
| `libraryCardId` | `card.balm.signature.life` |
| Type | `balm` |
| `name` | **It Passes** |
| `sphere` | `life` |
| `essenceCost` | `2` |
| `forecastDelta` | `0.05` |
| `imageTag` | `generic.warmth` |
| `effectLine` | *The fear goes out of them before they reach in, and does not come back while they work. A faint help, and it stays gone after.* |
| `fiction` | *Most suffering ends. This one ends sooner.* |

`grants`
```
- kind: remove_condition
  conditionTraitId: "trait.condition.terrified"
```

**Liveness.** `trait.condition.terrified` is a live `CONDITION_TRAIT_DEFINITIONS` entry (`src/data/condition-trait-content.ts`), which is the exact set `validateNudgeGrantRefs` checks `remove_condition.conditionTraitId` against.

**Face honesty (prose rule 7).** The face assumes only what any Balm target has — a fear in the moment — and never asserts a history the graph does not hold. This is the correction the exemplar's critique pass forced on its own Balm, applied here at authoring time rather than after.

`bandProse`
- `success` — *Unafraid, they took their time about it, and time was what it needed.*
- `near_miss` — *The fear stayed gone. Their hands went before their nerve did.*
- `failure` — *Fear never entered it. The cold did not need help.*

> **Echo/detector note.** The `failure` fragment first read *"Nothing frightened them off…"*. `nothing` is a natural indefinite, which is enforced at zero in **outcome** prose — and a band fragment is outcome prose. Rewritten to *"Fear never entered it."*

---

### Card 6 — Boost · sphere-signature (the second and last Boost)

| Field | Value |
|---|---|
| `id` | `relic.a_sudden_surge` |
| `libraryCardId` | `card.boost.signature.energy` |
| Type | `boost` |
| `name` | **A Sudden Surge** |
| `sphere` | `energy` |
| `essenceCost` | `2` |
| `forecastDelta` | `0.10` |
| `imageTag` | `generic.energy` |
| `effectLine` | *You drive a hard pulse of heat through them at the moment it is needed, so the body answers instead of stalling. A real help.* |
| `fiction` | *Bodies hold more than they admit.* |

`bandProse`
- `critical_success` — *The heat arrived and they moved as if the cold were not in the room.*
- `success_at_cost` — *The surge carried them through and left them shaking on the far side of it.*
- `failure` — *The heat came and went. The cold was still there when it had gone.*

**Why two Boosts do not answer the same question.** Card 1 buys **duration** — it holds the grip closed at the moment it would open, and it is the sphere-less floor every god can afford. Card 6 buys **a burst against the specific opposition** — heat, aimed at cold, at one instant, and it is priced and gated as a sphere card. A god who holds `energy` chooses between paying more for a bigger single moment and paying less for a longer one. That is a decision, not two names for the same certainty.

---

### Hand audit

| Rule | Status |
|---|---|
| 4–8 authored cards | **6** ✓ |
| ≥3 distinct card types per hand | **5** (`boost`, `cache`, `insurance`, `undertow`, `balm`) ✓ |
| `boost` ≤2 per hand | **2** ✓ |
| ≥4 distinct spheres | **5** (matter, order, darkness, life, energy) ✓ |
| ≥1 ungated common (sphere-less) option | **1** (`card.boost.core`) ✓ |
| ≤1 rider, justified in a comment | **1** (`floor_at_cost`), justified ✓ |
| Every card pays off in failure | 6/6 ✓ |
| Big-delta card covers both failure bands | Undertow (0.16) covers `failure` + `critical_failure` ✓ |
| All six `StepOutcome`s covered between the fragments | see below ✓ |
| Every `libraryCardId` set | 6/6 ✓ |
| Every `imageTag` resolves to an `ENCOUNTER_IMAGE_LIBRARY` row | 6/6 ✓ (see § 12) |
| No digits or `%` in any `effectLine` | ✓ |
| Zero-essence card without an alternate channel | none — every card carries essence ✓ |
| Grants name built content | 2/2 resolved against live catalogs ✓ |

**Band coverage across the hand**

| `StepOutcome` | Covered by |
|---|---|
| `critical_success` | Undertow · Boost (energy) |
| `success` | Boost (core) · Balm |
| `success_at_cost` | Insurance · Boost (energy) |
| `near_miss` | Cache · Balm |
| `failure` | Boost (core) · Cache · Undertow · Balm · Boost (energy) |
| `critical_failure` | Insurance · Undertow |

**No two cards in the hand answer the same question:** duration (Boost core) · a tool in the hands (Cache) · the floor rather than the ceiling (Insurance) · refusing to let go, at a cost to who they are (Undertow) · the fear (Balm) · one burst of heat (Boost energy).

---

## 9 · Band prose — the step's own surfaces

**The base text is what happens when the god did nothing.** No nudge-specific payoff appears in any of the five afterimages; every card's payoff lives in its fragments, so each band reads correctly with any subset of the hand active. `ActionStep` carries five afterimage fields — there is no near-miss afterimage, and near miss is paid off through fragments (Cache, Balm).

| Field | Text |
|---|---|
| `criticalSuccessAfterimage` | *They lifted it clean and walked out of the cold with it under one arm.* |
| `successAfterimage` | *They got it up and got clear, hands dead to the wrist.* |
| `successAtCostAfterimage` | *They came out with it and left skin on the iron.* |
| `failureAfterimage` | *Their grip opened before the count ran out, and the relic dropped back into its own frost.* |
| `criticalFailureAfterimage` | *They went down beside it, and the cold had them until the other one hauled them clear.* |

`narrativeTemplates.success`
> *The cold gave it up. It came out of the ring in a pair of hands that will not close properly until evening.*

`narrativeTemplates.failure`
> *The cold won the argument. The relic sits where it sat, and there is one more pair of hands that could not hold it.*

**Vagueness sweep, outcome class (evasive **and** natural indefinites at zero).** Checked across all five afterimages, both `narrativeTemplates`, every band fragment, every `overview`, every `detail` and every `causeClause`: no `something` · `someone` · `somewhere` · `things` · `thing` · `stuff` · `way` · `ways` · `nothing` · `anything` · `whatever`, and no hedge or nominalised placeholder. Two fragments and one band overview were rewritten to reach that — recorded at the point of each. Intensifiers: none (`very` was removed from a reaction intent).

---

## 10 · Trait hooks — all four questions answered

**1 · Gate?** **No.** `requiredTraits` and `blockedByTraits` stay empty. A cold with a radius stops everybody equally, and gating a `stone` open-draw encounter would put it behind the same wall the reachability rule already handles with `difficulty: 0.42`.

**2 · Variant?** **Yes — one.**

```
traitVariants:
  - traitId: "trait.core.core_humility.vice"     # the "Proud" pole of Core humility
    forecastDelta: 0.04
    difficultyDelta: -0.02
    factorLine: "Being Proud, they will not leave what others could not carry."
```

**Liveness.** `trait.core.core_humility.vice` is built by `CORE_TRAIT_DEFINITIONS` (`src/data/core-trait-content.ts`) from the canonical `CORE_CONTINUA` registry — continuum `core_humility`, vice pole word **Proud**, flavor *"Stands at the center of their own world, and corrects the horizon."* It is a seeded definition, so `validateTraitRefs()` does not report it dead. The full node id is used, which is the form least likely to rot under the ANY-of match.

**Why this trait and not another.** The step's action is *refusing to let go longer than is sensible*. Of the ten live Core traits, Proud is the one whose flavor is exactly the reason a person stays in the cold: they will not be one more name on a list of people who could not. The factor line names its source inside the sentence (canon rule 1) rather than in a label beside it, and it is variance by construction — it renders only for the trait-holder, which is what keeps it legal under THR-892.

**3 · Trait-only nudge?** **No.** The batch design's card-type budget for this hand is `cache` / `insurance` / `boost` (≤2) / `undertow` / `balm`, and `trait_card` is allocated to rows 2 and 5. Adding one here would break the batch's anti-convergence allocation, which is a shared constraint rather than a local preference. The variant therefore carries no `addNudgeIds`.

**4 · Trait fragment?** **No.** With no trait card there is nothing for a trait fragment to key on, and the variant's own factor line is where the hook becomes visible to the player. Recorded rather than left silent.

---

## 11 · Cast — the support bundle

```
supportBundle:
  - kind: actor
    key: claimant
    delivery: lazy-materialize-on-trigger
    persistence: must-persist
    reuseNpcRoles: ["scout", "ranger", "mercenary"]
    supportRole: rival_claimant
    spawnNpcRole: scout
    spawnName: "Orin Vask"
```

**Class-honesty across all four declared classes** — the rule this bundle has to satisfy, checked against `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`) and against the shipped per-class defaults in `DEFAULT_SETTING_SUPPORT_BUNDLES`:

| Class | Rosters at its subtypes | Which reuse role can bind |
|---|---|---|
| `ruin` | none of the ruin subtypes carries a roster; the shipped `ruin` default reuses `scout` / `ranger` / `sage` / `scholar` | `scout`, `ranger` |
| `wayside` | `wilderness` seeds `hermit`, `ranger`, `wanderer`, `hunter`, `hexer`, `pilgrim` | `ranger` |
| `stronghold` | `castle` seeds `noble`, `marshal`, `guard_captain`, `guard`, `steward`, `herald`, `spy`, `attendant`; the shipped `stronghold` default reuses `guard` / `scout` | `scout` |
| `battlefield` | `battleground` carries no roster; the shipped `battlefield` default reuses `commander` / `marshal` / `mercenary` / `quartermaster` | `mercenary` |

Every class has at least one binder, and no role in the list is placeless at any of the four — a scout, a ranger and a mercenary are all people who turn up at a ruin, a battlefield, a wayside hollow and a fort. The named counter-example the spec teaches (the exemplar's rural-honest, wayside-placeless *miller's boy*) is exactly the shape avoided here.

**Delivery is `lazy-materialize-on-trigger`, not `pre-seeded`,** because four of the five band aftermaths write a `bond_change` against `$cast:claimant`. A `pre-seeded` spec binds an existing NPC **or stays unresolved**, and an unresolved sentinel silently no-ops the effect — which would leave a BOND chip claiming state nothing wrote. The claimant must exist for the consequence to be honest, so the spec materializes when nobody is standing there. `persistence: must-persist` for the same reason: a person the encounter's own consequence points at cannot be collected at scene end.

**Register.** Role-voiced inline is the default, and the spine uses it — *"Someone else is already here"*, no token, because no sentence there earns the generated name. `{cast:claimant}` lands only where the name earns something: the `critical_success` reveal (they ask how it was done), the `critical_failure` rescue, and the two bond chip details. `spawnName` is a real name (`Orin Vask`), never a role phrase, because a declared key always resolves and that string is what the token renders when no live NPC was reused.

**Gender.** The claimant is never gendered. Every sentence is written around the pronoun — *"chafing warmth back into both hands"*, *"and that was decent"*, *"got a hand in their collar"* — because reuse binds whoever is standing there.

---

## 12 · Aftermath — the consequence draw, wired in context

```
aftermathConfig:
  branchOnStep: 0
  variants: {}
  fallback:
    overview: "…"
    byOutcome: { critical_success, success, success_at_cost, failure, critical_failure }
```

Choice-less, so the bands hang off `fallback` — which is why `byOutcome` lives *on* the variant. **Five bands authored** against a floor of three (one success-side, one failure-side, one extreme). `contested_won` / `contested_lost` fall through to the variant `overview`, which is correct: neither is reachable for a single uncontested `stone` test.

**`fallback.overview`**
> *The cold has not moved. It will be here tomorrow, and the day after, and it will be exactly this cold.*

No `changes` at variant level — every chip is band-scoped, so every chip is backed by a write that fires on the band it renders on. One reaction per band, carrying that band's writes, which is the only structure under which a band chip is guaranteed backed (a run applies exactly one reaction; two rival reactions would make every chip conditional on the pick).

---

### `critical_success`

**overview**
> *They lifted it out on the first reach and were three paces clear before their hands caught up. The other claimant is still standing at the ring, looking at the shape it left in the frost. {cast:claimant} asks, plainly, how it was done.*

**changes**

| Field | `relic.crit.prize` | `relic.crit.told_them_how` |
|---|---|---|
| `kind` | `item` | `growth` |
| `category` · `direction` · `polarity` | `boon` · `gain` · `gain` | `bond` · `gain` · `gain` |
| `title` | *The Cold Reliquary* | *Two who were there* |
| `causeClause` | *Lifted out clean on the first reach* | *The answer was given at the ring instead of kept* |
| `detail` | *The Cold Reliquary is in {actor}'s possessions now — black iron, and still cold to hold.* | *{cast:claimant} thinks better of them for it, and says so.* |
| `stateNoun` | `{ text: 'the relic in their possessions', entityId: '$actor', visualKind: 'agent' }` | `{ text: 'a bond warmed', entityId: '$cast:claimant', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'The Cold Reliquary' }]` | `[{ text: 'bond' }]` |
| **Backed by** | `successMetadata.effects` → `spawn_artifact` | this band's reaction → `bond_change` |

**reactions** — one
```
- id: relic.tell_them_how
  label: "Let them be told how"
  intent: "The answer is given at the ring, hands still numb, and taken well."
  effects:
    - kind: bond_change
      withAgentId: "$cast:claimant"
      sentimentDelta: 0.2
      trustDelta: 0.1
```

---

### `success`

**overview**
> *It came up on the third try and they got clear of the ring before they let go of it. Their hands stayed shut for an hour after. The other claimant watched all of it and will tell it at the next fire.*

**changes**

| Field | `relic.success.prize` | `relic.success.watched_ground` |
|---|---|---|
| `kind` | `item` | `trait` |
| `category` · `direction` · `polarity` | `boon` · `gain` · `gain` | `scar` · `loss` · `loss` |
| `title` | *The Cold Reliquary* | *Word about this place* |
| `causeClause` | *It came out of the ring on the third try* | *It was taken in front of a witness who will not keep it* |
| `detail` | *The Cold Reliquary is in {actor}'s possessions now — black iron, and still cold to hold.* | *{target} is under watch now: people come to see whether there is a second one, and quiet work here is seen.* |
| `stateNoun` | `{ text: 'the relic in their possessions', entityId: '$actor', visualKind: 'agent' }` | `{ text: 'a place under watch', entityId: '$target' }` — **location anchor, no `visualKind`** |
| `concepts` | `[{ text: 'The Cold Reliquary' }]` | `[{ text: 'under watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' }]` |
| **Backed by** | `successMetadata.effects` → `spawn_artifact` | this band's reaction → `condition_attachment` on `$target` |

**reactions** — one
```
- id: relic.let_the_word_travel
  label: "Let the word travel"
  intent: "The telling is not muddied, and by morning the place has visitors."
  effects:
    - kind: condition_attachment
      templateId: "trait.condition.location.under_watch"
      targetLocationId: "$target"
```

**This is the brief's location/sublocation anchor** — the chip's referent is the place itself, not a person. Three things make it legal rather than the folded `PATH · The River Crossing` shape:

1. **The referent is a graph object.** `location` is an anchorable member of `anchor-catalog.generated.md` — status 📍 *named*, declared by `entityId` = the location node id, with **no `visualKind` member**, so the chip names the place and does not promise a click. `named` satisfies Law 56 exactly as `linked` does.
2. **A write backs it.** `trait.condition.location.under_watch` is a live location condition (`src/data/condition-trait-content.ts`, THR-1143) — *"Someone is keeping eyes on this place. Quiet work here is harder and more likely to be seen"* — and `condition_attachment` accepts `targetLocationId` for exactly this. **The condition has no reader anywhere in `src/` today** — corrected 2026-08-24 after two sibling passes grepped it independently: `LOCATION_CONDITION_MOVEMENT_TAX` deliberately omits it, and no shipped template gates on any `trait.condition.location.*` id (the one cited precedent, `slice.kin.the_roof_opens`, was retired by THR-1206 and has zero writers). It is nonetheless a real, durable write the player can read on the Location Profile (`LocationProfileModal.tsx:91-111`), which is what makes it chip-backable at all. That is precisely why this chip is a `scar` and not a `path`: a `scar` makes a factual claim about state, which is true here, while `path` is reserved for openings the game will act on and nothing acts on this one. The categorisation shipped correct; only this sentence's reason was wrong, and it is corrected here because a rationale line is what the next author copies.
3. **The sentence names that particular object.** `{target}` renders the resolved location's name, so the chip reads *"Ashfell Ruin is under watch now"*, not *"a nearby settlement"*.

> **Pass-3 verification item (flagged, not assumed).** `$target` binds to a location only when the action's resolved target is one. The precedent is live and load-bearing — the vertical slice's table encounters write `reputation_with { targetLocationId: '$target' }`, and The Grateful Kin targets a location — but it should be confirmed for `encounter.border.*` placement before merge. If `$target` binds to an **agent** for this family, the fix is to bind the location through the support bundle rather than the sentinel; it is not to soften the chip.

---

### `success_at_cost`

**overview**
> *They came out of the ring holding it and left skin behind on the iron. The other claimant is already going through the dropped packs for something clean to wrap a hand in.*

**changes**

| Field | `relic.cost.prize` | `relic.cost.left_skin` |
|---|---|---|
| `kind` | `item` | `trait` |
| `category` · `direction` · `polarity` | `boon` · `gain` · `gain` | `scar` · `loss` · `loss` |
| `title` | *The Cold Reliquary* | *Hands that will not close* |
| `causeClause` | *It came out, and the iron kept what it touched* | *The iron kept what it touched* |
| `detail` | *The Cold Reliquary is in {actor}'s possessions now — black iron, and still cold to hold.* | *{actor} is carrying a wound that will make a fist an argument for a while.* |
| `stateNoun` | `{ text: 'the relic in their possessions', entityId: '$actor', visualKind: 'agent' }` | `{ text: 'Wounded', entityId: 'trait.condition.wounded', visualKind: 'attachment' }` |
| `concepts` | `[{ text: 'The Cold Reliquary' }]` | `[{ text: 'wound', entityId: 'trait.condition.wounded', visualKind: 'attachment' }]` |
| **Backed by** | `successMetadata.effects` → `spawn_artifact` (fires on `isStepSuccess`, which counts this band) | this band's reaction → `condition_attachment` |

**reactions** — one
```
- id: relic.let_them_feel_it
  label: "Let them feel it"
  intent: "The pain is not dulled. The hands get wrapped at the ring and the road waits an hour."
  effects:
    - kind: condition_attachment
      templateId: "trait.condition.wounded"
      targetAgentId: "$actor"
```

> The label says what the click does. An earlier draft called it *"Let them rest"* while the effect applied a wound — the label-promises-mercy-delivers-harm violation the exemplar's critique pass caught, reproduced and cut here.

---

### `failure`

**overview**
> *Their grip opened before the count ran out and the relic went back into its own frost. The other claimant did not remark on it, and that was decent.*

**changes**

| Field | `relic.fail.the_fear_stayed` | `relic.fail.two_who_failed` |
|---|---|---|
| `kind` | `trait` | `growth` |
| `category` · `direction` · `polarity` | `scar` · `loss` · `loss` | `bond` · `gain` · `gain` |
| `title` | *What did not let go* | *Two who failed at it* |
| `causeClause` | *Their hands opened before the cold did* | *They failed at the same thing in front of each other* |
| `detail` | *{actor} is carrying the fright out of here with them, and it will be a couple of days before it goes.* | *{cast:claimant} counts them as a known quantity now.* |
| `stateNoun` | `{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }` | `{ text: 'a bond warmed', entityId: '$cast:claimant', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'fright', entityId: 'trait.condition.terrified', visualKind: 'attachment' }]` | `[{ text: 'bond' }]` |
| **Backed by** | `failureMetadata.effects` → `apply_condition` (unconditional on the failure side) | this band's reaction → `bond_change` |

**reactions** — one
```
- id: relic.let_them_share_a_fire
  label: "Let them share a fire"
  intent: "The two of them sit down out of the cold and say little."
  effects:
    - kind: bond_change
      withAgentId: "$cast:claimant"
      sentimentDelta: 0.15
      trustDelta: 0.1
```

**Cool failure.** The player loses the relic and gains a person. That is the band's whole argument, and it is why the failure side is not punishment: two strangers who failed at the same thing in front of each other now have a bond edge the world will read later.

---

### `critical_failure`

**overview**
> *They went down beside it with their arms locked and did not get up on their own. {cast:claimant} got a hand in their collar and hauled, and swore about it the whole way. Afterwards the ring got a stride wider, and the two of them kept opposite sides of it.*

**changes**

| Field | `relic.crit_fail.the_fear_stayed` | `relic.crit_fail.held_off` |
|---|---|---|
| `kind` | `trait` | `growth` |
| `category` · `direction` · `polarity` | `scar` · `loss` · `loss` | `bond` · `loss` · `loss` |
| `title` | *What did not let go* | *Hauled out, and held off* |
| `causeClause` | *They had to be dragged clear of it* | *They had to be dragged clear of it* |
| `detail` | *{actor} is carrying the fright out of here with them, and it will be a couple of days before it goes.* | *{cast:claimant} pulled them out and has kept a stride between them since.* |
| `stateNoun` | `{ text: 'Terrified', entityId: 'trait.condition.terrified', visualKind: 'attachment' }` | `{ text: 'a bond soured', entityId: '$cast:claimant', visualKind: 'agent' }` |
| `concepts` | `[{ text: 'fright', entityId: 'trait.condition.terrified', visualKind: 'attachment' }]` | `[{ text: 'bond' }]` |
| **Backed by** | `failureMetadata.effects` → `apply_condition` | this band's reaction → `bond_change` |

**reactions** — one
```
- id: relic.let_the_distance_stand
  label: "Let the distance stand"
  intent: "The thanks does not get said, and the ring stays a stride wider."
  effects:
    - kind: bond_change
      withAgentId: "$cast:claimant"
      sentimentDelta: -0.12
      trustDelta: -0.05
```

A critical failure is a battering and a fright and a person who will not stand near them any more. It is never a scripted death.

---

### The artifact — what is actually spawned, and why it has no `templateId`

```
kind: spawn_artifact
category: relic
nameOverride: "The Cold Reliquary"
targetAgentId: "$actor"
tags: ["#stone", "#relic", "#ancient"]
messageOverride: "The Cold Reliquary has left the place that kept it."
```

`spawn_artifact` mints a real graph node — `type: 'artifact'`, a real node id, `properties.category` / `tier` / `tags` / `sourceEncounterId`, and a `possesses` edge to the agent — plus a chronicle event. That node is the "real object with a real id" the batch design asks for, and it is clickable through the artifact route (`visualKind: 'artifact'`).

**Why no `templateId`, deliberately.** Three facts settled this:

1. `spawn_artifact`'s `templateId` is resolved against the **graph** (`state.graph.getNode(effect.templateId)`), and `validateNudgeGrantRefs` checks it against `ARTIFACT_TEMPLATES` — a three-entry catalog of cosmic-tier legendaries (`worldforge_anvil`, `heartseed_first_garden`, `voidgate_shard`). Naming any of the reward-catalog possessions here would **fail the liveness gate**, and naming a legendary would hand a rarity-1 encounter a cosmic artifact.
2. The gate is explicit that this is the safe shape: *"`templateId` is optional — a category-only spawn picks at runtime and names nothing that can rot."* A category is a closed type union (`ArtifactCategory`), so there is no id to go stale — the THR-844 failure class is structurally absent.
3. It is the shipped precedent. The vertical slice mints The Causeway Lamp, The Loading Order and The Crossroads Gift exactly this way, and THR-1164 recorded the reasoning: a category spawn has no template node to point at, so the chip anchors through its **carrier** (the agent), which is what the chips above do.

`category: 'relic'` is a live member of `ArtifactCategory` (`weapon | talisman | relic | tome | vessel | key | mundane`).

**Name.** *The Cold Reliquary* — two concrete words that say what it is and what its one property is. It is setting-neutral by construction, which a four-class envelope requires: no version of it names a ruin, a fort, a field or a camp.

> **Deliberate alternative, recorded and not taken.** `attachment_grant { templateId: 'reward_relics_talismans_heart_of_the_barrow' }` would have passed liveness (it is a live `REWARD_POSSESSIONS` entry, `#stone #relic #ancient #ruins`, and mechanically a beautiful fit for a `stone` encounter). It was rejected on two counts: it is tier 3, `lossCondition: permanent`, and a payout of that size on a rarity-1 open-draw encounter distorts the reward economy; and its tag set and flavor (*"A stone pulled from a king's grave"*) are `#ruins`-honest and placeless at `wayside` and `battlefield`. Recorded here so Pass 2 does not have to re-derive the trade.

---

## 13 · Images

| Card | `imageTag` | Library row (`ENCOUNTER_IMAGE_LIBRARY`, `src/data/encounter-image-library.ts`) |
|---|---|---|
| A Little More | `generic.focus` | mind / focus — *a hand holding a needle still, the tremor going out of it* |
| Left Behind | `generic.matter` | matter / substance — *quarried stone opening cleanly under a chisel* |
| By The Book | `generic.ward` | order / ward — *a poured salt line the dark presses against and does not cross* |
| The Easier Way | `generic.dark` | darkness / concealment — *dark closing over an abandoned satchel like water* |
| It Passes | `generic.warmth` | life / warmth — *hearth-warmth creeping across cold flagstones* |
| A Sudden Surge | `generic.energy` | energy / energy — *a charge gathering at a weathervane's spike* |

All six resolve to real rows, so none falls back silently to the category generic. Every tag is sphere-matched to its card's sphere, and the common Boost takes the sphere-less `generic.focus`.

**The genericity test, documented.** Each tag must read correctly in at least `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` (3) *unrelated* encounters:

| Tag | Three unrelated encounters it reads in |
|---|---|
| `generic.focus` | a river crossing · a negotiation over a price · a lock being picked |
| `generic.matter` | a mine collapse · a stonemason's proving piece · this scene's abandoned kit |
| `generic.ward` | a night watch · an escort through bandit country · a contract signing |
| `generic.dark` | a theft · a lie told well · a desire the mortal will not name |
| `generic.warmth` | a fever broken · a fear lifted before a duel · a body pulled from cold water |
| `generic.energy` | a sprint from pursuit · a forge brought to heat · a last push up a slope |

None of the six only reads in a cold ruin. A face that only read here would be a ruin card whatever it was named.

**Scene tag (encounter-specific, distinct from card art):** `relic.cold.unclaimed`. Until the WS4 manifest exists the fallback chain ends at EntityVisual. `illustrationUrl` is not declared.

---

## 14 · Concept art direction

**Two-question method.**

*1 · What emotions does this story convey?*
Appetite meeting a flat physical refusal. The particular indignity of being beaten by something that is not even trying. The quiet accumulation of other people's failures into a habit — a ring worn into the ground by everyone who came and went. And, under it, greed's small shameful thrill: the thing is still there, which means it could still be yours.

*2 · What image evokes those emotions while staying inside the encounter's world?*

> **A ring of abandoned gear on frozen ground, photographed from above, with the centre of the ring empty.**
>
> Packs half-collapsed with frost in their seams. One boot on its side. A coil of rope stiff enough to hold its shape. The kit is arranged in a rough circle at a consistent radius, and the radius is the subject — it is the exact distance at which people stopped. The ground inside the ring is paler than the ground outside, frost lying where it has lain long enough to bleach the grass. Nothing occupies the centre.
>
> No people. No relic. Low, flat, colourless light — the kind that gives no time of day. The palette is bleached greys and iron-browns with one cold blue in the frost.

**Why this and not the scene.** The prose already shows the relic and shows a person reaching for it; painting that would be illustration. The art shows **residue** — the shape everyone else's failure left behind — and it makes the player feel the encounter's actual proposition (*this line is where people stop; are you going past it?*) before a single word lands. The absence at the centre is doing the work: the eye completes it with whatever the player imagines is worth that much.

**Image-doctrine compliance.** No human likeness and no second face — the scene omits the agent entirely, so the portrait chosen at Sensing stays the only likeness across the flow. No baked-in caption text. No UI element depicted. Nothing in the frame encodes a retired mechanic.

---

## 15 · Support bundle contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `claimant` (the other person at the ring) | `lazy-materialize-on-trigger` | reuse `scout` / `ranger` / `mercenary`; else spawn `scout` "Orin Vask" | **must-persist** | `bond_change` on four bands; `{cast:claimant}` in two overviews and two chip details | authored here |
| **The Cold Reliquary** (artifact node) | minted at step success | `spawn_artifact`, `category: 'relic'` — runtime-picked, no template id | permanent graph node | the BOON chip on three bands; the agent's possessions; `{artifact:any}` enrichment thereafter | authored here |
| `reward_tools_instruments_iron_tongs` | granted by the Cache card | `REWARD_POSSESSIONS` (live) | bearer-held, `breakable` | Cache band fragments; the derived equipment factor line on the panel | **pre-existing — verified live** |
| `trait.condition.terrified` | applied by `failureMetadata`; removed by the Balm grant | `CONDITION_TRAIT_DEFINITIONS` (live) | duration-edged, 24 ticks | the SCAR chip on both failure bands | **pre-existing — verified live** |
| `trait.condition.wounded` | applied by the `success_at_cost` reaction | `CONDITION_TRAIT_DEFINITIONS` (live) | template-default duration | the SCAR chip on `success_at_cost` | **pre-existing — verified live** |
| `trait.condition.location.under_watch` | applied by the `success` reaction, `targetLocationId` | `CONDITION_TRAIT_DEFINITIONS` (live, THR-1143) | carried by the place | the location-anchored SCAR chip on `success` | **pre-existing — verified live** |
| `trait.core.core_humility.vice` ("Proud") | read by `traitVariants` | `CORE_TRAIT_DEFINITIONS` (live) | n/a — read only | the authored factor line | **pre-existing — verified live** |

**Nothing on this list is named-and-unbuilt.** Every id above was resolved against live source during this pass, and the one grant that could have rotted (`spawn_artifact.templateId`) was deliberately not authored.

---

## 16 · Template-level fields

| Field | Value |
|---|---|
| `id` | `encounter.border.the_unclaimed_relic` |
| `name` | `The Unclaimed Relic` |
| `reach` | `stone` |
| `rarityTier` | `1` |
| `intrinsicTier` | `background` |
| `crudType` | `read` |
| `scale` | `local` |
| `apCost` | `1` |
| `actorAffinities` | `['individual']` |
| `motivations` | `['asceticism_extravagance', 'preservation_transformation']` |
| `consequenceDraw` | `['relationship', 'possession']` |
| `consequenceSwap` | *(none)* |
| `description` | *A single-step recovery: a relic in the open, a cold that has stopped everyone else, and one other person still working up to a second try.* |

**`motivations`.** `asceticism_extravagance` (Mender ↔ Magnate) is what the relic is worth to them and the axis the Undertow drags; `preservation_transformation` is Stone's own pair and the axis of whether a thing left in the ground should be left there. Neither is a fork — the encounter has none — they are the axes the scene tilts.

---

## 17 · Self-audit against the Composition Contract

| Block | Verdict |
|---|---|
| **Steps** | PASS — 1 plain step (inside 1–3), with `reach: 'stone'`, numeric `difficulty: 0.42`, and a `narrativeTemplate`. |
| **Hand** | PASS — one nudge-bearing step; 6 cards; the full `checkNudgeHand` audit table is in § 8. |
| **Setting** | PASS — `settings` declared, four classes, four openings, `locationSubtypes` derived via `expandSettings`. `validateSettingEnvelope`'s four rules all satisfied. |
| **Cast** | PASS — one explicit actor binding, class-honest across all four declared classes (§ 11). Every `{cast:claimant}` token names a declared key. |
| **Rewards** | PASS — `spawn_artifact` on step success, plus `bond_change` and `condition_attachment` in band reactions. All are `PERSISTENT_EFFECT_KINDS`; nothing here only prints. |
| **Aftermath** | PASS — `aftermathConfig` present; **five** `byOutcome` bands against a floor of three, covering success-side, failure-side and both extremes; every variant and band carries an `overview`; every change declares `concepts`. |
| **Systems** | PASS — 3 connections from the authored manifest: `cast`, `rewards`, `conditions` (§ 1, question 8). At the floor, deliberately, so the batch's other rows carry `reputation`, `factions` and `seeds`. |
| **Images** | PASS — all six `imageTag`s resolve to real library rows; no `illustrationUrl` declared. |
| **Law 56** | PASS — every one of the nine authored chips points at a write that fires on its own band; the pairing is tabulated per band in § 12. No `shell_state`-over-empty-`effects` chip exists. No `reputation_tally` chip exists (Law 13 parity). |
| **Anchors** | PASS — `$actor` (agent, linked), `$cast:claimant` (agent, linked), `trait.condition.*` (attachment, linked), `$target` (location, **named**). Four kinds, three of them not `individual`-only — the corpus habit the brief flags is broken. |
| **Grant liveness** | PASS — `attachment_grant` → live `REWARD_POSSESSIONS` id; `remove_condition` / `apply_condition` / `condition_attachment` → live `CONDITION_TRAIT_DEFINITIONS` ids; `spawn_artifact` names no template id. |
| **Trait refs** | PASS — one ref, `trait.core.core_humility.vice`, built by `CORE_TRAIT_DEFINITIONS`; not on the `validateTraitRefs` dead list. |
| **Enrichment dry-run** | PASS by inspection — tokens used are `{frag:opening}` (a declared slot), `{actor}` (resolved at `proseEnrichment.ts:590`), `{target}`, and `{cast:claimant}` (a declared bundle key). No other `{…}` appears in authored prose. |
| **Forecast arithmetic** | PASS — `0.42 + 0.49 = 0.91`, inside `[0, 1]`; no card buys past the ceiling. |
| **Reachability (THR-821)** | PASS — open-draw at `0.42`, under the 0.45 ceiling. |
| **Variance rule (THR-892)** | PASS — zero static `factorLines`; the one authored factor line is a `TraitVariant.factorLine`. |
| **Detectors** | PASS — vagueness zero in outcome class and zero evasive in scene class (§ 9); annotation clauses effective count 0 against a budget of 1; zero divine outcome-authorship (every effect line has the god as author of its **own act**, never of a result). |
| **Register** | PASS — baseline throughout; names, effect lines, factor line, purpose line and reaction labels all interactive-plain; the final step's band prose is peak-*eligible* and deliberately declines it. |
| **Batch budget** | PASS — the five allocated card types used, `boost` twice, `cache` debuted, every card carries `libraryCardId`; the brief's artifact-spawn target and location-anchor target both carried. |

**FLAGS (for Pass 2 / Pass 3, none blocking the draft):**

1. **`$target` binding for `encounter.border.*`.** The `success` band's location write and its chip both assume `$target` resolves to a location. Precedent is live in the vertical slice, but it must be confirmed for this family before merge. Named in § 12.
2. **`allAftermathEffects` coverage of step metadata.** The Rewards block is satisfied twice over (`spawn_artifact` on the step **and** `bond_change` in band reactions), so it passes whichever walk `compositionContract.ts` uses — but if the contract's walk does **not** include step metadata, the prize is invisible to the Rewards count while remaining fully live at runtime. Worth one grep at implementation.
3. **Wiring-guide drift, unrelated to this encounter but found while checking it.** `Docs/plans/2026-04-16-systemic-wiring-guide.md` § *Spawn Artifact* documents fields that no longer exist — `artifactName`, `artifactSubtype`, `possessedByAgentId`, `chronicleEntry`. The live type uses `nameOverride`, `category`, `targetAgentId`, `messageOverride`. This packet follows the type. The guide should be corrected in a separate pass.

---

## 18 · Experience Differentiator Gate

**Scene & Prose**

1. **Does the opening place the player inside a moment already in motion?** **YES.** Every opening starts with a place that has been going on without anyone — camped-in for years, roof gone, a ditch already filled in badly, sweepings piling against a chalk line. The spine then lands on a person already mid-attempt, chafing warmth back into their hands. Nothing is briefed.
2. **Does the prose have its own voice?** **YES.** Short declaratives with one image each, dry closers (*"the thorn wall has gone grey"*, *"there is one more pair of hands that could not hold it"*, *"swore about it the whole way"*), and sentence lengths that vary between openings by design.
3. **Does the scene name the elements that later become choices?** **YES.** The relic, the cold, the ring of dropped gear and the other claimant are all in the spine, and all six cards act on one of them.
4. **Would a reader feel something from the prose alone?** **YES.** The ring of dropped packs at a fixed radius is the whole encounter's proposition before any card is offered.

**Choices & Intervention**

5. **Does every card state its mechanism, with a generic 2–4 word title, a one-line quote, and zero scene-bespoke prose on the face?** **YES.** All six faces are the library's own authored faces, carried by `libraryCardId`; no face names a relic, a ring, or a cold.
6. **Is every card's price real and legible?** **YES.** Every card charges essence (1–3), and the Undertow charges a second, named price on top: a permanent drift on `asceticism_extravagance`, stated on the face.
7. **Does every card pay off in failure?** **YES.** Six of six carry a failure-band fragment; the big-delta Undertow carries both.
8. **Is the hand grounded?** **YES.** Delete the relic, the cold or the ring from the prose and the corresponding cards become senseless here (§ 3, D13).
9. **Do the cards answer different questions?** **YES.** Duration · a tool · the floor · refusing to let go at a cost to who they are · the fear · one burst of heat. The two Boosts are justified separately in § 8.
9b. **Does every nudge-bearing step carry a full authored hand, and does no step ask the player to pick a branch or an ending?** **YES.** One step, one full hand of six. No `authoredChoices` anywhere; no fork; the Undertow shifts values through `valueDrift` and never selects a path.

**Aftermath & Consequence**

10. **Does the aftermath have its own prose?** **YES.** A variant `overview` plus five band `overview`s, each a written landing that appears before any mechanics.
11. **Are consequence outcomes actor-centered?** **YES.** *{cast:claimant} thinks better of them for it* · *{cast:claimant} pulled them out and has kept a stride between them since* · *The Cold Reliquary is in {actor}'s possessions now*. No anonymous stat deltas are chipped; incidental drift is left to the engine's demotion path.
12. **For medium+ scale, does the aftermath offer reaction choices?** **YES** — satisfied by scope. This is short scale (a rarity-1 `Single Test`), and the requirement is explicitly conditioned on medium+. The deliberate structure is **one reaction per band carrying that band's writes**, which is what makes every chip unconditionally backed (Law 56); two rival reactions per band would make each band's chips true only if the player picked the right one. Recorded as a design decision, not an omission.
13. **Do the reaction choices represent philosophical stances?** **YES.** Across the bands the god's post-encounter stance genuinely varies and each one is a different relationship to consequence: *let them be told how* (give the knowledge away), *let the word travel* (let the finding become public and cost the place its quiet), *let them feel it* (do not dull what it cost), *let them share a fire* (let two failures become a bond), *let the distance stand* (let the debt of a rescue go unspoken).

**Presentation**

14. **Does the concept art use the two-question method rather than illustrating the scene?** **YES.** The art is a ring of abandoned gear around an empty centre — residue and absence, no people, no relic, no action.

**All fourteen: YES.**
