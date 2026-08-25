# The Nudge Authoring Spec

**The canonical authoring contract for nudge-native encounters**, in the locked THR-883
format. THR-774 (WS1) established this document; the 2026-07-30 THR-883 prototype
sessions locked the format it now records: the communication pivot, setting envelopes
(THR-884), and the card system (THR-885), with the card library progression designed in
`Docs/plans/2026-07-30-nudge-card-repertoire.md`. The 2026-08-08 Encounter Factory
rulings added the **Composition Contract** (THR-1045) — the section below the pivot —
which turns "which blocks does an encounter carry?" from a session-by-session judgement
into a validated schema.

Both authoring skills load this file: `encounter-pipeline` (branching encounters) and
`template-encounter-rewrite` (linear templates). They differ in structure, scale, and
orchestration; they do **not** differ on anything in this document. If the two skills
ever appear to disagree about a rule below, this file wins.

- Executable half: `src/engine/__tests__/nudgeModel.test.ts` § *golden exemplar* +
  `npm run check:encounter -- <templateId>` (the factory gate, THR-1045).
- Worked example: `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts`
  (The Swollen Ford — supersedes the pre-pivot Darkhollow Vault).
- Composition Contract: `src/data/content-eval/compositionContract.ts` (code is the
  contract) + `Docs/plans/2026-08-08-encounter-factory-workflow.md` §1 and its
  Rulings block.
- Tunable numbers: `src/data/content-eval/nudgeAuthoringConstants.ts`.
- Card-type catalog: `public/nudge-cards-reference.html` (the wiki page where the
  21-type library and the Repertoire are iterated) +
  `Docs/plans/2026-07-30-encounter-authoring-frameworks.md` § Decision 3.

Read the exemplar before authoring. Every rule here is visible in it once.

---

## Authoring order — game design first (director ruling 2026-08-24)

Verbatim, from the sitting that rejected a fiction-first brief: *"assess what and how
many types of each encounter we need. pick a category to start building the encounter.
then build the game interface of the encounter (the payoffs, the prizes, the penalties,
the structure) first to set constraints for the story. make all the game design choices
first. THEN you roll a few encounter plot hooks on the table, and try to use them for
building a great story within the constraints of the game design choices already made.
pick the one you and your review agents think is the best."*

The binding order, for every encounter and every batch:

1. **Portfolio first.** Assess what encounter types the game needs and how many, and
   pick the category this run builds. The corpus converges on travel-and-meet-people
   vignettes when nobody checks, and the director's standing note from the same sitting
   is that the game is **epic fantasy**, not slice-of-life. The recorded gap list on the
   slice map (no nudge-native combat; near-zero grants/costs channel users; zero
   fate-branching users) is the seed of this assessment — keep it current as gaps close.

   **Do not re-derive the portfolio per run — read it.** The living reference is
   `Docs/audits/2026-08-24-encounter-portfolio-assessment.md` (THR-1215): census by
   family, composition tier, setting skew and genre band, plus the ranked target mix a
   run picks its category from. Measured 2026-08-24 — six of the eight slice encounters
   open on a roadside, and `battlefield` has one authored opening in the game. Refresh
   its census when a batch ships; re-rank its target mix only on a director ruling.
2. **Game design second — all of it.** Structure (steps, forks, difficulty curve), the
   consequence hand (§ The Consequence Draw), band-by-band payoffs, prizes, penalties,
   cost channels and grants — every mechanical choice, made and recorded in the brief
   **before a word of fiction exists**. The design sets the constraints the story must
   live inside.
3. **Hooks and dice third.** Roll the plot-hook draw (§ The Plot-Hook Draw) **and the
   five Seed Dice** (§ The Seed Dice — stake shape, opposition, disposition, agent's
   role, scale), then build story candidates *within* the constraints from step 2 and
   the rolls.
4. **Candidates, then judgment.** Write 2–3 candidate premises from the rolled hooks;
   review agents rank them against the fixed design and the register rules; the best
   candidate goes to draft.

A brief whose fiction was written first and had mechanics fitted afterwards is rejected
on sight — that shape is what this ruling exists to kill (*"clearly written first, and
then you are trying to mash it into a game"*).

---

## What a nudge is

> The god acts through their spheres on the fabric of the scene — matter, minds, dreams,
> fates — never in the dramaturgy of the story. Influence, never authorship.

A **nudge** is an authored, essence-priced card the god may play into an *attended*
encounter step. It shifts the odds. **Fate still picks the outcome.**

This is the line that governs every card you write, and the first half of it is as
load-bearing as the second. The god is a magical being who works the threads of reality
according to the spheres they hold, so the lawful nudge space spans all twelve: a
stumble on loose stone (force), an urge arriving in sleep (mind), a sense that this has
happened before (time), an old ambition catching light again (spirit), a face nobody
afterwards quite recalls (darkness), a wound that closes cleaner than it should (life),
a coin found where no coin was (matter). All of these are nudges.

"Forge the truth" and "Temper the narrative" are not: choosing between authored futures
for a mortal is the rejected model this one replaced (program ruling,
`Docs/plans/2026-07-26-nudge-model-encounter-system.md`). The player must never pick an
ending, and must never instruct the mortal.

**The two halves fail in opposite directions, so check both.** A hand reaching only for
physical causes is authoring a twelve-sphere game in one sphere's vocabulary — a real
defect, and the one this wording exists to correct (THR-1178). A hand that reaches into
the mortal's decision *for* them has crossed the actual line. The test is never how
physical the cause is; it is whether the mortal still chooses and fate still rolls.

**Terminology — riders vs band fragments.** These are different things and the words are
not interchangeable:

| Term | What it is | Where it lives |
|---|---|---|
| **rider** | A mechanical remap of the resolved band (`no_crit_fail`, `floor_at_cost`, `all_or_nothing`). Deterministic, zero PRNG draws, at most one applies. | `StepNudge.rider` |
| **band fragment** | A line of prose appended to the step's outcome text when this nudge was active for that band. | `StepNudge.bandProse[outcome]` |

A rider changes what happened. A fragment says the god was there when it did.

---

## The communication pivot — prose does the scene, cards do the rules

Locked 2026-07-30 (Christian: "we have tried and failed enough to pivot"). Card prose
that tried to carry the scene read as euphemistic mood even when every detector passed.
So the jobs are split:

- **Prose does the scene.** The openings, the step spine, the stake block, and the
  outcome prose (base text + band fragments) are fully written, scene-built, and carry
  all the fiction.
- **Cards do the rules.** A card face is **generic and reusable** — the same face reads
  correctly in any encounter its type fits. Zero scene-bespoke prose on the face.

The card face and how the schema carries it:

| Card element | Field | Rule |
|---|---|---|
| Picture | `imageTag` | One generic image per library card; fallback chain ends at a type icon on a tinted band |
| Keyword + icon | *(code comment until THR-887 lands the library schema)* | The card's library type — player-facing vocabulary |
| Title | `name` | **Imperative verb + noun, 2–4 words, like a spell** — "Inspire Courage", "Ward the Gate", "Dull the Cold". Never a fragment or a mood: "A Little More" is the banned shape (director ruling 2026-08-25) |
| Cost | `essenceCost` + `costs` | Essence pips · free · alternate channels (detection, doom, obligation) |
| Effect | `effectLine` | **One or two direct sentences saying what the nudge does** — evocative but unambiguous: "Fill them with blazing resolve — inspire them to bravery." No digits, no `%`, no meta-commentary about effort or odds — the pip row carries magnitude |
| ~~Flavor quote~~ | `fiction` | **Retired (director ruling 2026-08-25).** The effect line is the card's only prose. Existing `fiction` strings are dead content pending the schema/UI cleanup ticket; author none |

**The effect line reads like a spell description** (checklist Q14, amended 2026-08-25):
state the effect directly, in the plain command register of a rulebook. The earlier
"explain the causal mechanism of the odds" framing produced convoluted lines ("You steady
them at the point where effort usually gives out, so the last of it counts") — that shape
is retired. Say what the god does; let the pips say how hard.

**Grounding moved from prose to binding** (checklist Q13). A generic card is grounded
because it *acts on* a target the scene established — the light on the water, the rope,
the opposition — and because dealing is self-grounding: under THR-887, cards carry typed
text slots (`{condition}`, `{host}`, `{target}`) and **target selectors** resolved at
deal time; a card whose selector binds to nothing is not dealt. Until the library data
model lands, authored hand instances name their targets directly (the exemplar's Balm
names the condition it lifts) — but write every face as if it were already a library
card, because the retrofit will make it one.

**Band fragments stay bespoke.** They render in the *outcome prose*, never on the card
face — they are the scene's account of the god's hand, so they are written per encounter
like the rest of the scene.

**Odds are pips, authored as raw numbers.** `forecastDelta` and the cost deltas stay
numeric in data; the UI renders the approved pip vocabulary (five pips per color tier at
~5% steps — green circles, blue squares, purple diamonds, gold stars, red down-triangles
for penalties; see the wiki page). The pivot changes no part of the no-digits rule for
`effectLine`.

**Player-facing labels (Christian, chat approval 2026-07-30 — the mockup review):**

- The step panel's likelihood line is labelled **"Outcome"** (e.g. *Outcome: uncertain*),
  never "Forecast" — "forecast" survives only as engine vocabulary (`ForecastTier`,
  `forecastDelta`). The five tier words themselves are unchanged.
- A card's pip row shows the **magnitude of the nudge** — how hard the god is leaning —
  and is labelled accordingly (**"Nudge"**), never "Odds": a card does not have odds,
  the step does.
- The difficulty word is **per step**, and the surface must make that legible ("this
  step: a fair test"), not imply it describes the whole encounter.

---

## The Composition Contract — what every encounter owes (THR-1045)

Locked 2026-08-08 (the Encounter Factory rulings,
`Docs/plans/2026-08-08-encounter-factory-workflow.md`). The composition audit
(THR-1039) found the engine resolving nine composition-block classes live while the 15
nudge-era encounters authored zero cast bundles, zero `rewardPool`, zero `byOutcome`
bands — richer *within-template* composition than ever, and none of the cross-template
blocks that make a scene part of a world. The contract is the inverse: **every
encounter leaves the line composition-complete, enforced by a validator, not hoped
for.**

**The gate.** `npm run check:encounter -- <templateId>` (or `--all` for the corpus).
**Green is a precondition for a PR existing.** It stacks five checks, most structural
first: the Composition Contract → register detectors → grant liveness
(`validateNudgeGrantRefs`) → an enrichment dry-run (every `{...}` in authored prose is
a token `enrichProse` resolves; every `{frag:*}` names a declared slot) → forecast
arithmetic (a step's difficulty plus its full hand stays inside [0, 1] — cards past
the ceiling buy nothing, and nothing in the UI says why). **Code is the contract**:
`src/data/content-eval/compositionContract.ts`; every violation names its block and
the plan section its rule is written in. Where this page and the code disagree, the
code wins.

| Block | What the validator holds |
|---|---|
| **Steps** | 1–3 plain steps, each with a reach, a numeric difficulty, and a `narrativeTemplate` |
| **Hand** | at least one nudge-bearing step; the hand rules delegate to `checkNudgeHand` (checklist step 3) |
| **Setting** | `settings` declared and the envelope valid (`validateSettingEnvelope`, § envelopes) |
| **Cast** | ≥1 actor binding on the *resolved* support bundle — a THR-1044 family default satisfies it exactly as an explicit bundle does; every `{cast:<key>}` token names a declared key |
| **Rewards** | something persists: a `rewardPool` draw on a step outcome **or** an aftermath effect that leaves a mark on the world (`spawn_artifact`, a condition, a seed, a favor, …). An effect that only prints is scene dressing, not a reward |
| **Aftermath** | `aftermathConfig` present; the `byOutcome` floor (ruling 7): ≥3 bands — one success-side, one failure-side, one extreme; every variant carries an `overview`; every change declares `concepts` (Law 2) |
| **Systems** | ≥3 game-system connections, counted from the authored manifest — `cast` / `rewards` / `seeds` / `conditions` / `reputation` / `factions`. Prose counts for nothing: an encounter that *names* a faction but touches no faction surface has not connected to it |
| **Images** | every card `imageTag` resolves to a library row (the gate resolves, never trusts — a dead tag falls back silently at render); `illustrationUrl`, when declared, is public-absolute |

**No exemptions, ever (ruling 3).** The plan's first draft allowed
`composition: { cast: { exempt: "…" } }`; Christian deleted it. A shape that cannot
carry a block is a future *encounter type with its own contract*, never a waiver. The
only escape is `RETROFIT_PENDING` (`src/data/content-eval/retrofitPending.ts`) — a
per-template ratchet for the pre-contract corpus that only ever shrinks, checked in
both directions: an unlisted failure is new rot, a listed pass is a stale entry the
list must drop. **New content never starts on the ratchet.**

**Expression is inline (ruling 5).** The blocks live on the template file itself —
fields on the `UnifiedActionTemplate`, code comments where a decision needs recording.
No sibling manifest file.

### Cast — named-inline with mandatory binding (ruling 6)

Every encounter binds at least one named scene actor. The binding — an actor spec in
`supportBundle` — is what makes the person *real*: a reused or spawned graph NPC with
a portrait, a cast-strip entry, a click, and persistence. Prose alone leaves an
anonymous noun the player cannot touch, which is exactly the "flat encounter" the
systems quota exists to stop.

- **Role-voiced inline prose is the default.** "The keeper waits at the water";
  "another traveler stops at the water's edge." Most sentences never need the
  generated name, and a token in a sentence that doesn't earn it is noise.
- **`{cast:<key>}` tokens go where the name earns something** — greetings, reveals,
  sequel callbacks. A declared key always resolves (THR-696): a reused NPC renders
  their live name, an unbound spec renders its `spawnName`. Two consequences: when a
  token will render it, `spawnName` must be a real name, never a role phrase; and a
  token naming an *undeclared* key strips silently, which is why the gate checks
  declaration.
- **Never gender a bound cast member in prose.** Reuse binds whoever is standing
  there. Write around pronouns: the role noun, or restructure the sentence.
- **Family defaults (THR-1044).** A shipped `encounter.*` template whose envelope
  resolves to a *single* setting class inherits that class's default bundle
  (`DEFAULT_SETTING_SUPPORT_BUNDLES`) and satisfies the Cast block with no authored
  spec. A template spanning several classes inherits nothing — one class's cast on
  another class's scene is placeless prose — so it declares its own.
- **Class-honesty.** An explicit bundle must read correctly at *every* class the
  envelope declares: pick `reuseNpcRoles` from roles the rosters actually seed at
  those classes (`LOCATION_ROLE_ROSTERS`, `src/types/npc.ts`), and a `supportRole` /
  `spawnName` that survives the whole envelope. The exemplar's fellow traveler
  (`wanderer`/`pilgrim` — seeded at rural and wayside alike) is the worked example;
  its earlier draft's "miller's boy" — rural-honest, wayside-placeless — is the named
  counter-example.
- **Conditional prose**: `{?has_cast:<key>}…{/has_cast:<key>}` and
  `{?no_cast:<key>}…{/no_cast:<key>}` gate a sentence on the binding — rarely needed
  for a declared key, which always resolves.

---

## The narrator's checklist (12 questions)

Locked 2026-08-25 (**Doctrine v2 — narrator mode**; supersedes the 2026-07-30
scene-writer's checklist after the director's border-perils read: *"you are still writing
in situ instead of just describing."* The old section A — build the scene, two senses
beyond sight, complication last — is **retired by name**; it commanded the in-situ mode).
The authoring agent answers each **in writing, per encounter**; any "no" means rewrite
first.

**A. The opening skeleton (§ Doctrine v2 below)**
1. *Does P1 say how the agent arrived*, with real graph names — agent, place, region?
2. *Does P2 state what is happening and what has gone wrong* — events, with costs
   already paid ("three guards to the infirmary"), never scenery?
3. *Does P3 land exactly one stake shape from the table* (two at most, compounded on
   purpose), matching the shape declared in the brief?
4. *Is the whole opening ≤80 words* — subject-verb-object, one fact per sentence?

**B. Narrator mode**
5. *Could a game master read every sentence aloud as a report?* No interior sensation,
   no camera work, no atmosphere without a job.
6. *Is every fact stated, never encoded?* If the fact is "no one dares approach it,"
   that sentence appears — not the chalk line and the sweepings that imply it.
7. *Does every sentence serve challenge, test, or outcome?* Anything else is cut.

**C. Internal logic (survives v1)**
8. *Nothing referred to before it's introduced; every event has a visible cause;
   nothing contradicts what's established.*
9. *One named person on stage per beat, named over unnamed* — "Guard Captain Hessa asks
   for help," never "someone is already here, waiting."

**D. The interactive layer**
10. *Can the player restate the stake in one sentence?*
11. *Is every card named verb+noun and described like a spell* — direct effect, no
    mood, no odds-talk?
12. *Does every setting class the envelope declares have an opening written for it — in
    the skeleton, per class?* (Enforced by `validateSettingEnvelope` — build-time,
    fail loud.)

---

## Setting envelopes (THR-884)

Authors never touch the 20-subtype list. Declare a **setting envelope** from the closed
8-class vocabulary (`src/data/settingClasses.ts`): `rural · urban · stronghold · sacred ·
arcane · ruin · wayside · battlefield`. One table expands classes to subtypes; the
existing cache filter enforces it unchanged.

- **Write toward the widest honest envelope** (Christian's explicit direction:
  flexibility is the default, enforced by prose, never by narrowing).
- **One opening per declared class** (~1 paragraph, scene word budget). Checklist
  questions 1–4 live in the opening; the complication, stakes, and hand are
  setting-neutral. The spine below the opening may not name class scenery.
- **Per-card `fictionBySetting`** remains readable for legacy cards whose card prose
  (`fiction`) named class scenery. New cards author no card prose at all (Doctrine v2 —
  the flavor quote and `fiction` are retired), so post-v2 cards never declare it.
- **Exact-subtype override** (`locationTypes`) remains for genuinely specific encounters
  (a temple rite).
- **Raw entries** declare `settings` + `openings` and the converter derives
  `locationSubtypes` and compiles openings onto the reserved `opening` fragment slot.
  Direct-authored templates derive the subtype list with `expandSettings()` — never by
  hand (the exemplar shows this).
- **Coverage matrix** (THR-884 generator + committed report): settings × reaches →
  drawable-template counts plus per-family card-type composition. Check it before picking
  an envelope — feed the starving cells.
- **The envelope also decides the cast default (THR-1044).** A single-class
  `encounter.*` envelope inherits that class's default support bundle; a multi-class
  envelope inherits nothing and declares its own, class-honest across every declared
  class — see § Cast under the Composition Contract.

---

## The 8-step checklist

Author in this order. Each step assumes the one before it is settled.

### 1. Design before prose — the mechanical design block

**Mechanics are designed first; prose is written to them (Christian, chat 2026-07-30 —
the five-draft review).** The failure this step exists to prevent: a well-built scene
the acting agent merely watches, testing no reach anyone chose, referring to no game
object, promising a mystery nobody designed the payoff for.

**The block is terse.** One line per row. A design block that runs long is hiding that
the crux is unclear. Answer all of these **in writing, in the file's doc comment,
before the first sentence of prose**:

0. **The crux, in one plain sentence, from the agent's point of view.** "The wagon
   wheel has broken, and the wainwright is the only fix within a day." "Someone is
   asking around after the agent, and not in a good way." Simple grammar: who, does
   what, about what, and the vibe. If the crux needs a second sentence, the encounter
   is not designed yet.
0b. **The title states the crux.** *The Broken Wheel*, not *The Held Commission*. A
   player reading only the title knows the complication or the objective — nothing
   more is needed, and no poetry is allowed to get in the tunnel between title and
   understanding.
0c. **Pick one entry per catalog** — shape (section below), setting, pressure, form,
   objective, stakes, system — from [`Docs/canon/encounter-catalogs.md`](../../../Docs/canon/encounter-catalogs.md).
   Closed lists, one line each in the block; do not invent structure or vocabulary
   per encounter. **The system pick is maturity-gated**: target the mature tier (the
   traveling-agent core — movement, cards, traits, conditions, items, forks,
   carryover); middling systems sparingly; deferred systems (economy, war, factions,
   agent-magic) never load-bearing, flavor at most (Christian, 2026-07-31).
0d. **Cite the hook**: `Hook: #NNN` from `Design/research/quest-hooks/` or
   `Hook: original`. The corpus is the idea bank — steal from it, argue with it; a
   hook aimed at a thin coverage cell beats an original aimed at a fat one.
1. **Whose problem is this?** The acting agent is the **protagonist**, and the
   complication is *seen from their point of view* — prefer problems that originate
   with the agent or their journey (their wheel breaks; their name is asked after;
   their road is blocked), where the location and its people are the place the
   solution lives, not the subject of the scene. A scene the agent merely witnesses is
   the rare exception and must say what makes watching the strongest seat in the
   house.
2. **Which reach does each step test, and why is that the theme?** The reach is chosen
   before writing and the scene grows from it — a Stone scene is *about* endurance,
   an Eye scene is *about* reading truly. Never retrofit a reach onto finished prose.
3. **Why is the agent here?** Motive hooks (`choice` / `mission` / `chance` / `divine`,
   from `classifyMotive`) — and for each declared route, the concrete opportunity or
   event that puts a traveling hero in this scene, not just the category name.
4. **Which mechanics and objects play?** Traits, items/attachments, conditions,
   factions, favors, prior-step carryovers — decided now, so the prose can refer to
   them and lead to the outcomes they gate. A hook designed after the prose is written
   is decoration; a hook designed before is structure. **Classify every fact the
   prose will state about the agent's connections** as scene-local, a state *read*
   (name the surface: gate, placeholder, variant), or a state *write* (name the
   grant/aftermath that mints it) — prose rule 7: base prose may never assert agent
   history the graph does not hold.
5. **What are the rewards, and where does the tension sit?** Prizes, tolls, and seeds
   (step 6's object references) sketched now, with the quintessence stakes — the
   erosion class failing here costs. **Penalty-avoidance is a valid reward shape**
   (Christian, 2026-07-30): for an everyday complication, the baseline reward is
   simply *no penalty* (the delay avoided, the toll unpaid), the failure penalty is
   concrete and game-legible (stand still N ticks, minus to move for a while), and a
   critical success may add one small boon (a better wagon: +1 move). Not every
   encounter pays out treasure.
6. **Does the mortal make a choice in this scene?** "None — this is a test" is a valid
   written answer, but **a healthy corpus slice runs on choices, and some encounters
   should be designed for one** — a fork is where personality becomes story. If yes:
   name the value axis it runs on (`motivations`), the two poles as concrete courses of
   action, and what each pole's path changes downstream. **The mortal decides, driven
   by their own values and the god's lean — never the player.** Mechanism: the
   agent-decided branch selector (generalized from Meet The First's pole lean — the
   mortal's axiological profile on the axis plus the net lean of the committed cards
   picks the pole, which is recorded as the branch key; fate still rolls how cleanly
   the chosen course goes). Engine ticket: the *agent-decided branches* ticket filed
   from THR-883; until it lands, choice-designed encounters are authored with the axis
   and both pole-paths on paper, and their branch wiring rides the ticket. A choice
   scene wants pole-leaning cards in its hand (Undertow, Compulsion, Kindled Ambition,
   trait cards) so the god has levers on the direction, not only on the cleanliness.
7. **Every promise pays off.** Any open question the opening states plainly — a named
   unknown, a stated risk, a hook — has its reveal designed *now*, in a later step,
   a band, or the aftermath, before the promise is written down.
8. **Personalization + supporting content — how many systems does this encounter
   touch? (Christian, 2026-07-31.)** List the connections and count them; **target
   ≥3 beyond the core test** — and since THR-1045 the floor is a hard gate, not a
   warn: `check:encounter` counts ≥3 connections from the *authored manifest*
   (cast / rewards / seeds / conditions / reputation / factions), so a connection
   that lives only in prose or in this block's text counts for nothing. The levers:
   - **Names and cast**: an NPC who would use the agent's name uses the cast/
     placeholder surface ("Evening, `{cast:agent}`"), never a generic address the
     engine could have personalized.
   - **Attribute-read rewards**: a gift, prize, or offer keyed to who the agent *is* —
     primary reach, archetype, held traits — resolved from the attachment/content
     libraries (treasure for a Gold-reach agent; a keepsake for a Heart one).
   - **Bespoke supporting content, authored with the encounter**: the encounter ships
     its own attachments, minted actors, traits, or creatures where stock content
     does not fit — liveness-pinned (the supporting-content rule), never named and
     left unbuilt. Creating supporting content in supporting systems is what makes
     the world feel alive; an encounter that touches only its own step is a flat one.
   - **Seeds**: outcomes that plant designed futures (see the Seeded Sequel shape).

Then declare the **setting envelope**, the **scene tag** (WS4 vocabulary; fallback
chain ends at EntityVisual), and write the openings + spine in the three-paragraph
skeleton under the narrator's checklist above.

---

## The shape catalog — pick a structure, never invent one

**Why a closed catalog (Christian, 2026-07-30):** deciding single-step vs multi-step
vs fork on the fly is where structure quality leaks. The shape is picked in the design
block (question 0c) and the steps follow it. The first two are Christian's own;
the rest generalize the prototypes and are open for iteration on this list.

| Shape | Steps | Use when |
|---|---|---|
| **Single Test** | 1 | One complication, one skill answers it. The smallest honest encounter. |
| **Test & Consequence** | 2, carryover | The second step inherits how the first went (read the water → cross the river). |
| **Puzzle – Investigation – Resolution** | 2–3 | Information is the prize: an Eye-type gate *reveals* the clues (behind the test, never front-loaded in the opening), and the resolution step uses — or must do without — what was found. |
| **Danger – Confrontation – Aftermath** | 2–3 | A threat announces itself, then arrives. The watch, then the rush; the reading, then the meeting. |
| **Personality Fork** | 1 + branch | The mortal makes a choice: a test, then an agent-decided branch on a value axis (THR-894), pole-specific continuations. |
| **Opt-in Complication** | gate + shape | The agent can decline: waiting/walking away is a cheap, legible exit (a delay, a toll), and engaging opens one of the shapes above. The engage/decline gate is itself agent-decided (personality). |
| **Seeded Sequel** | parent + authored follow-up(s) | A specific outcome or chosen course plants a **designed** future encounter that fires later, elsewhere (`encounter_seed`: `templateId` + `delayTicks` + `inheritContext` to carry the cast). The sequel is authored *with* the parent — a seed naming an unbuilt template is the THR-844 rot — and the sequel is where earned history legitimately appears in prose: the swindler recognized in another town, the grateful kin with a gift. Prose rule 7 by construction: the sequel reads state the parent minted. |

Rules: a route-flavored objective (bribe with Gold, intimidate with Iron, persuade
with Heart, toward the same door) is a **Personality Fork** whose poles are routes.
Information the player should discover lives behind the Investigation gate's outcome
bands, never in the opening prose. Extending this catalog is a design-session
decision with Christian, not an authoring-session judgement.

### 2. Test panel data

Per step:

- **Reach(es)** with a **purpose line** — `ActionStep.purposeLine`,
  `REACH_PURPOSE_MAX_WORDS` (4) words, plain. What the step is *testing*, not a
  description of the fiction. "Read the lock", not "The mason's puzzle awaits".
- **Difficulty** 0–1. Never write the number into prose: `DIFFICULTY_WORD_BANDS` renders
  it as *severe / steep / fair / gentle*, and the word is the only surface the player
  sees (ruling 1).
- **Factor lines: variance only** — see the rule below. New content authors **no**
  static `factorLines`; the retired 2–4-lines-both-signs instruction produced exactly
  the clutter the rule bans.

**The variance rule (Christian, chat 2026-07-30 — supersedes the 2–4 authored-lines
instruction).** A factor line earns its place only if it **could have read
differently** on another run. The list reports **modifiers from the broader game
context**:

- the **agent** — skill in the step's reach, traits, conditions, equipment;
- the **hex / location** — terrain and place modifiers;
- **global modifiers** — omens, doom stage, season, world state;
- **earlier steps of this encounter** — carryovers from how a prior step resolved.

Every one of those is state, so every one is **derived by the panel**, rendered in the
canonical modifier-pip language — none of them is a string an author writes on the step.
What an author must **not** do is list the scene's own description as factors:
"Floodwater carries silt", "the bed drops at midstream" are true on *every* run, so they
are already priced into the authored `difficulty` and belong in the prose. **The litmus
test: if the line would read identically every time this encounter runs, it is not a
factor — it is clutter, and the difficulty word already said it.** The one authored
surface that remains is `TraitVariant.factorLine` (variance by construction: it only
renders for the trait-holder) — and pick the trait that best *fits the step's action*
from the live trait set; a better-fitting trait that does not exist yet is a content
proposal, not an authoring-session invention. **Minting that missing continuum is
pre-authorized (Christian's ruling, chat 2026-08-12, recorded on THR-883):** the first
time an author reaches for a grit/persistence-style trait (the "Tenacious over True for
a river crossing" case) — or any other continuum the 5-entry core registry cannot
serve — file the design ticket and mint it *as part of that encounter's work*, rather
than shipping the second-best trait or parking the idea as a standing ask. The design
ticket still does the real work (poles, seeding, registry wiring); the ruling removes
the "may we?" gate, not the design.

**Canon rule 1 still binds every line that does render — a factor names its source in
the sentence.** "Being True, they will not turn back at midstream", not
`Source: trait`. The cause lives in the prose of the line, never in a label beside it.

**Schema note (THR-820 / transition).** `ActionStep.factorLines` remains in the schema
for un-migrated templates; new content leaves it unauthored. Derived agent/hex/global
lines and outcome-keyed carryover lines are engine work (ticketed — see the carryover
ticket; panel rendering is THR-890). Until they land, a step with no authored lines
falls back to the contract's unsigned `beat.forecast_factors`.

### 3. The hand — cut from the 21-type library

**Hands are fully authored at encounter design time.** No runtime generic deck: runtime
only *filters* the authored hand (trait, group, favor-availability, sphere access,
target binding). Variation comes from world state, not shuffling.

Pick each card as an instance of one of the **21 library types** (Boost, Heavy Hand,
Insurance, Mercy, Gambit, Side-Bet, Long Game, Whisper, Trait card, Signature, Bargain,
Undertow, Stumble, Kindled Ambition, Omen, Cache, Balm, Veil, Favor, Fellowship,
Compulsion — statuses and mechanics on the wiki page). Name the type in a code comment
per card until THR-887 gives it a schema key.

Author `NUDGE_HAND_MIN`–`NUDGE_HAND_MAX` (**4–8**) cards per nudge-bearing step; gated
cards (trait, group, favor) hide when unmet, so the **dealt** hand lands at the 4–6 the
card-row is designed around.

> These are **authoring** guardrails at warn level, not the rejected "fixed action count
> / capped action slots". The renderer draws whatever `NudgeHand.playable` contains,
> uncapped; the pool stays open-ended and data-driven.

Hand-building rules:

- **No two cards in a hand answer the same question.** Two Boosts are legal only when
  they buy different certainties (nerve vs light vs memory); two rider cards never are —
  **at most one rider per hand**, justified in a code comment. (Pre-pivot this rule was
  one rider per encounter; the library made Insurance, Mercy, and Gambit first-class
  repertoire members, so the honest unit is the hand.)
- **No two encounters in a family repeat a type composition** — audited by the coverage
  matrix, never hoped for.
- **Sphere coverage ≥ `HAND_SPHERE_COVERAGE_MIN` (4) distinct spheres** across the hand,
  and **≥ `HAND_COMMON_OPTIONS_MIN` (1) ungated common (sphere-less) option**, so no god
  is ever handed an empty step. Sphere-keyed cards honor the sphere-signature table
  (chaos → Gambit/Stumble, order → Favor/Insurance, entropy → Bargain, …) from the
  Repertoire plan.
- **Trait-only options where a `traitVariant` exists.** Cost **0**: the price was paid by
  being that person. Hidden, never dimmed, for an agent who cannot hold the trait.
- **Zero essence outside a trait card is legal only when another channel carries the
  price** — `costs.doomDelta` (The Bargain), `costs.detectionDelta` (The Heavy Hand pays
  up, The Veil pays down), or an obligation the card creates. A card that is simply free
  is a pricing bug, and the exemplar test enforces this.
- **Grants ship with their content built** (the supporting-content rule). Any card
  granting an item / trait / ambition / omen / condition names ids that resolve against
  built catalogs — `validateNudgeGrantRefs` fails the build otherwise (THR-844's lesson:
  names referencing unbuilt content rot silently). Grants ride the existing
  `EncounterAftermathReactionEffect` vocabulary — never mint a card-specific effect
  language.
- **`effectLine` in words, never digits or `%`.** The pip row renders magnitude.
- **Match the step's reach to an actor who plausibly holds it, or keep the difficulty at
  or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45 — the `steep` floor).** This is the one
  rule that decides whether the hand *does anything*, and it is invisible while
  authoring: a hand can pass every rule above and still be inert.

  Measured (THR-821, `npm run measure:nudge-headroom`, seeds 42/99;
  `Docs/audits/2026-07-27-thr-821-nudge-headroom.md`): a `notable`-tier mortal has
  capability 0.027–0.119 in a reach that is neither its primary nor its secondary. At
  difficulty 0.45 that floors at `PROBABILITY_FLOOR` and stays floored across the hand a
  *typical* god can play — the player spends essence and the forecast word does not move.

  **Read "typical" strictly (THR-831).** The measured figure was one ascendant's
  sphere-gated subset (+0.37), not the hand's ceiling. Sphere access is pool-driven, so a
  god holding four or five of the hand's spheres plays +0.55 and the whole cohort *clears*
  the floor. That is intended — broad essence buying reach is the point — and the ceiling
  stays 0.45 regardless, because difficulty sits on the same side of the equation as the
  floor: lowering it would make hands clear *more* easily, not less. What the number
  bounds is the **worst** case an open-draw step can present to a narrow god, and that is
  the case you are authoring against.

  So either **gate the encounter to actors who hold the reach** (role, faction, or
  late-run capability — what the retired Darkhollow Vault demonstrated), **or** keep an
  open-draw step at `fair` or below (what The Swollen Ford demonstrates). A `severe`
  step drawn by anyone is a decorative hand.

### 4. Band prose

- **All six `StepOutcome`s covered** between the hand's fragments —
  `critical_success · success · success_at_cost · near_miss · failure · critical_failure`.
  `near_miss` is a failure texture for authoring purposes even though `isStepSuccess()`
  counts it as advancing: the step got through, the nudge did not land clean, and the
  prose owes that.
- **Every band must read correctly with any subset of the hand active.** Nudge-specific
  payoffs go in `bandProse` fragments, never in the base band text. The base text is what
  happens when the god did nothing.
- **Every nudge carries at least one failure-band fragment.** The god's hand must be
  traceable in failure at any size — payoff at every band, program ruling. Failure is
  plot, not punishment, and a nudge that vanishes on a loss is the god's hand vanishing.
  For a `floor_at_cost` card the reachable failure band is `critical_failure` — put the
  fragment there, since the rider erases `failure` and `near_miss` while active.
- **`forecastDelta ≥ NUDGE_BIG_DELTA` (0.15) ⇒ cover BOTH `failure` and
  `critical_failure`.** A nudge that moved the odds this far and still lost owes the
  player a distinct reading of *how* it lost at each depth.

Watch the domain. `bandProse` keys on the six-value `StepOutcome` — **not** the five-band
`EncounterOutcomeBand`, and **not** `OutcomeBand` from `outcomeConsequences.ts`. Either
would type-check while being the wrong domain.

Note `ActionStep` carries five afterimage fields, not six: there is no near-miss
afterimage. Near-miss is paid off through band fragments.

### 5. Trait hooks (mandatory step)

For every encounter, ask four questions and answer each one explicitly:

1. **Gate?** — `requiredTraits` / `blockedByTraits` on the template.
2. **Variant?** — a `TraitVariant`: forecast modifier, difficulty ease, factor line.
3. **Trait-only nudge?** — a card with `requiredTrait`, unlocked via `addNudgeIds`.
4. **Trait fragment?** — band prose that only reads when the trait-holder played it.

"No hook" is a valid answer, written down. Silence is not.

**Hard constraint: hooks may only name traits that `validateTraitRefs()` does not report
as dead.** A ref is matched ANY-of across node id / short id / display name / tag
(THR-786), so the full node id is the form least likely to rot. THR-800 tracks the
authored refs that currently fail the sweep; the allowed set is everything that passes,
and it grows as those repairs land. A hook on a dead ref is a gate that never opens —
invisible to every test that does not enumerate values.

### 6. Aftermath — authored, banded, persistent

**`aftermathConfig` is mandatory (the contract).** The pre-contract allowance — "a
background encounter resolves through the default assembly" — is retired: the default
assembly is where every ending reads the same at `critical_success` and
`success_at_cost`, the exact gap THR-969 was filed to close. A choice-less encounter
hangs its bands off `fallback` — which is why `byOutcome` lives *on* the variant
rather than beside it.

- **The `byOutcome` floor is three bands (ruling 7)**: one success-side, one
  failure-side, and one extreme (`critical_success` / `critical_failure` /
  `success_at_cost`). A floor, not a norm — author more wherever the fiction has
  bands. The tails are the point: they are the endings a playthrough almost never
  rolls, so they go unwritten unless a contract asks for them. Watch the domain:
  `byOutcome` keys on `UnifiedActionOutcome` (the *action's* resolved band), not the
  six-value per-step `StepOutcome` that `bandProse` uses.
- **Every variant carries an `overview`; every change declares `concepts`** (Law 2) —
  the substring of `detail` that names a game concept, with its tooltip id, so the
  chip can explain itself. (`EncounterAftermathChange.concepts`' own type comment
  still describes the pre-contract convention; the contract's ruling is later and
  wins — the reconciliation is THR-1053.)
- **Every `changes` entry is backed by a write** (UI Law 56; § Consequences rule 0) —
  a chip on a band must correspond to an effect that actually fires on that band (a
  reaction effect, a step-outcome effect, a reward-pool draw, or a planted seed).
  "Something must persist" binds **per chip**, not merely per ending: a `shell_state`
  chip over empty `effects` is a defect, not texture.
- **Something must persist** — the Rewards block. Two authoring routes, either
  sufficient:
  1. **A `rewardPool` draw** — documented here for the first time; the audit found
     the whole mechanism untaught while 522 sites in the old corpus used it.
     `RewardPoolRecipe` on a step's `successMetadata` / `failureMetadata`:
     `categoryWeights` over the seven attachment categories (`possession · condition
     · blessing · curse · bestowed_power · agreement · spell`), optional `tagFilters`
     / `sphereTint`. The draw is seeded and deterministic per (seed, tick, actor,
     template); the tier curve and bad-outcome chance resolve from the outcome band,
     so the prize scales with how well it went. It renders as an `item` change — the
     PRIZE chip — and composes with an authored ending (THR-1042: an authored ending
     overrides the prose, it no longer erases the facts). `failureMetadata.rewardPool`
     is the equipment-loss channel. **A `tagFilters` entry must name tags verified
     live in the attachment library** — a filter matching zero templates is a
     silently empty pool, the THR-844 rot class in a new place. Note
     `successMetadata` fires on `isStepSuccess`, which counts `near_miss` as a
     success.
  2. **A persistent aftermath effect** — `spawn_artifact`, a condition, an
     `encounter_seed`, a favor, a hidden mark, …. The validator's list is
     `PERSISTENT_EFFECT_KINDS` in `compositionContract.ts`; an effect that only
     prints (`recent_event`, `emit_omen`) is dressing and does not count.
- **Prizes, tolls, and seeds as object references** — ids the modal system resolves —
  not inline prose descriptions. Every game object is a clickable modal (format
  ruling 6), and that only works if the aftermath names objects rather than
  describing them. Card-carried world changes (`grants`) fire once per committed
  card, after the step resolves, through the host system's own API.
- **Tolls in words.** "A heavy toll", "tremendous exertion". Never a number.

### 7. Images

- **`imageTag` per card**, from the manifest vocabulary — **one generic image per
  library card**, shared by every hand that deals it. Until painted, the fallback chain
  runs: `imageTag` lookup *when the manifest exists* → category generic → type icon on a
  tinted band (EntityVisual).
- **Scene tag per encounter** (see step 1) — scene art stays encounter-specific; card
  art does not.

**The genericity test.** A tag belongs in the shared vocabulary only if it reads
correctly in at least `GENERIC_POOL_UNRELATED_ENCOUNTERS_MIN` (3) *unrelated* encounters.
Post-pivot every card face must pass it — a face that only reads in dungeons is a
dungeon card, whatever you name it.

**Tags must resolve (the contract's Images block).** Every card `imageTag` must name a
row in `ENCOUNTER_IMAGE_LIBRARY` — the gate resolves, never trusts, because a dead tag
falls back to the category generic *silently* at render, so the art an author believed
they picked is simply never seen. `illustrationUrl`, when declared, is a
public-absolute path (starts with `/`).

### 8. Evidence + the independent critique pass

**Run the factory gate first**: `npm run check:encounter -- <templateId>`. Green is a
precondition for a PR existing (Composition Contract § above) — it runs the contract,
the detectors, grant liveness, the enrichment dry-run, and forecast arithmetic in one
command, and its output is the evidence a closeout quotes.

Run the register scorer and the detectors below on all new prose — openings included. An
encounter is not finished until they are clean, and until the narrator's checklist is
answered in writing in the file's doc comment.

**Then a second agent reads it (mandatory — Christian, chat 2026-07-30).** Before any
encounter prose is delivered — to the corpus, to a review, or to Christian in chat — a
**fresh-context critique agent** (a dispatched subagent that has not seen the drafting
session) reads the full prose top to bottom **together with the step-1 mechanical
design block** and reports against:

1. the 12-question narrator's checklist, answered independently;
2. **design conformance** — the prose held to the design block: is the agent the
   protagonist; does each step actually test its declared reach; does every designed
   mechanic and object appear in the prose or gate an outcome (an unused hook is a
   finding); does every promise the prose makes have its designed payoff; are stakes stated
   plainly rather than encoded in scene furniture (Doctrine v2 reverses the old
   "announced instead of foreshadowed" check); does any base-prose sentence
   assert agent history — a relationship, debt, prior visit, standing — with no
   backing state read (prose rule 7)? **Count the connected systems** (design-block
   question 8) and report the number — under three beyond the core test is a
   finding; a personalization the engine could have made but the prose hard-coded
   (a generic address where the cast surface exists) is a finding.
3. the **echo check** — repeated images, repeated sentence shapes, or near-identical
   phrasing across paragraph seams (the class the detectors cannot see: "The water runs
   loud and brown." ending one paragraph while "The river runs brown and loud…" opens
   the next shipped through every automated gate);
4. read-aloud flow, sentence by sentence — any sentence the critic stumbles on gets
   flagged, and for each sentence the critic names its job (what the player feels or
   learns from it); a sentence whose only job is satisfying a design rule is a
   finding (prose rule 6).

The author fixes what the critique surfaces, then delivers. In the `encounter-pipeline`
this is Pass 2's job (its editorial prompt now carries the echo check); in
`template-encounter-rewrite` and in direct authoring sessions, dispatch the critique
subagent explicitly. Self-review does not discharge this step — the drafting context is
exactly what makes seam echoes invisible to their author.

---

## Register assignment per authored field

Absent declaration ⇒ **baseline**. Canon: `Docs/canon/prose.md` § the register model.

| Field | Register |
|---|---|
| `name`, `effectLine`, factor lines, purpose lines | **interactive-plain** |
| Openings, spine, band base text | **narrator mode** (Doctrine v2 below) |
| Final-step band prose, the fate-reveal line | narrator mode; peak lyricism retired for encounter surfaces (2026-08-25) |

**The hard plainness rule.** Interactive text is always plain — no metaphor, no ambiguity
about what the click does. A label's job is to be unmistakable. The `fiction` flavor
quote is retired (2026-08-25) — see the card-face table above.

---

## Prose doctrine v2 — narrator mode (hard rules)

### Rule zero — narrate, never inhabit (Christian, 2026-08-25, supersedes everything that conflicts)

Ruled from the border-perils read (*"it is still borderline unreadable … you are still
writing in situ instead of just describing"*): the recurring failure was never
vocabulary, it was **mode**. Write as a **game master reading a module aloud** — a
narrator reporting events to the player from outside the scene. The player is a god
reading a chronicle, not a body in the yard.

- **Banned: in-situ writing.** Sensations from inside the scene ("cold through a boot
  sole"), camera work ("the boots on the wall walk come that far and turn back"),
  atmosphere with no job.
- **State facts — never encode them.** If the fact is "no one dares approach it,"
  write exactly that sentence. Never dress a fact as physical evidence for the reader
  to decode (the chalk line, the sweepings piled against it).
- **Everything serves challenge → test → outcome.** The encounter's whole job is a
  tension, a test, a result. Every sentence does one of those three jobs or is cut.
  "It builds atmosphere" is not a job.

### The opening skeleton — three short paragraphs, always

**P1 — Arrival.** How the agent got here, with real names from the graph.
Formats: *"\<agent> arrives at \<place> at \<time-of-day>."* · *"Travelling through
\<region>, \<agent> stops for a rest at \<place>."*

**P2 — Situation & complication.** What is happening and what has gone wrong, stated
as events with **costs already paid**: *"There she finds the garrison in disarray. A
magic relic has been found below the west guard tower. Its freezing aura has already
sent three guards to the infirmary."*

**P3 — The problem.** Exactly one stake shape from § The Seed Dice (two at most,
compounded on purpose), matching the brief's declared shape: *"No one dares approach
it now. Guard Captain \<name> is at his wits' end and asks for help."* Not every
problem has a "who" — see the stake table.

**Budget: ≤80 words across all three paragraphs.** Later steps reuse the same logic —
what changed, what it cost, what is asked now.

### Sentence rules

Subject–verb–object. One fact per sentence. Present tense, third person — the agent is
always named, never "you". Named people over unnamed figures; **one named person on
stage per beat**. Dialogue is welcome — a guard saying "No one crosses at night — we
have lost two travelers in a fortnight" beats a paragraph implying it. No exclamation
marks. The dark-world tone is carried by **what happens**, never by scenery.

### Calibration exemplar (the director's rewrite, 2026-08-25 — match this)

Wrong (the shipped border-perils opening — in-situ):

> The fort's yard is swept and the gate is manned. This corner is used by nobody.
> Someone chalked a line across the flags and nothing crosses it — the boots on the
> wall walk come that far and turn back, and the sweepings pile against the chalk.
> The flags inside the line are cold through a boot sole.

Right (narrator mode, the skeleton):

> \<agent> arrives at the fortress of \<fortress name> at the break of dawn.
>
> There \<they> find the garrison in disarray. A magic relic has been found below the
> west guard tower. Its freezing aura has already sent three guards to the infirmary.
>
> No one dares approach it now. Guard Captain \<name> is at his wits' end and asks
> for help.

**Second exemplar — the director-approved rewrite of the same encounter's live spine
(THR-1223 batch 1, 2026-08-25).** The first attempt at this rewrite *modified* the old
text and was rejected: *"you did not do a rewrite from scratch … it is still crap …
too high brow and not basic game master language."* Two corrections from that
exchange bind every draft:

1. **"Clever specificity" is the residue tell of the old mode.** Measured counts
   ("ten counts"), paces ("three paces out"), and writerly participles ("working up a
   second try") read as literary even when every fact is stated. Basic game-master
   language uses common words and simple clauses. Throw the old text out and write
   from the skeleton — never edit the old prose toward the doctrine.
2. **A card's effect line never repeats a word from the card's name.** "Steady Grip —
   *Strengthen their grip*" fails; "Steady Grip — *Strengthen their hands*" passes.

The approved spine, verbatim (P1 varies by setting class above it):

> There \{they} find a magic relic lying in the open: black iron, freezing cold.
> Everyone who tried to carry it away got frostbitten hands and dropped it. No one
> dares to touch it now.
>
> The relic is unclaimed — whoever carries it out may keep it. Another treasure
> hunter, \{cast:claimant}, is waiting nearby, ready to try again.

And the approved card register: **Steady Grip** — *"Strengthen their hands — they
hold on long after their strength should fail."* · **Bind Outcome** — *"Guarantee
success — they will carry the relic out, but pay for it in skin and gear."* ·
**Banish Fear** — *"Grant them calm — they reach in unafraid and stay that way."*

### What survives from v1 (restated here so nothing retired needs reading)

- **Clarity beats compression** — a sentence that needs two readings is a defect;
  split it.
- **No numerals, no `%`, no second person** on any mortal-facing surface.
- **The god sways, never decides** (THR-1166) — never the grammatical author of a
  result; the divine outcome-authorship detector enforces the line. The god choosing
  its **own action** stays correct ("the god may press to break the bargain").
- **Prose may not invent game state** (2026-07-31) — a fact is either scene-local
  invention with no life outside the encounter, or an actual read of game state
  through a sanctioned surface (cast binding, enrichment placeholder, trait gate,
  carryover line). History, debts, and standings live in the graph: consume them
  through gates, or mint them through grants and aftermath — never assert them in
  base prose.
- **Evasive vagueness targets zero** — "it cost them something" fails in every field
  class; the scoped lexicon in the detector spec below is unchanged.
- **Band-prose mechanics** (checklist step 4) — six-band coverage, base text that
  reads with no hand active, failure fragments for every nudge — unchanged; the
  *register* of every band is narrator mode.

### Retired by name (v1 rules; critics stop enforcing them today)

Two-senses-beyond-sight · complication-comes-last · **foreshadow-never-announce**
(reversed — announce plainly) · show-don't-tell as a default (reversed — tell) ·
write-the-scene-first workflow · the picturable-anchor default · the flavor quote ·
"one dry line carries the irony" (the irony budget is zero unless a character speaks
it) · the "moment, not label" bar (a plainly stated fact is not a defect) ·
sensory concreteness as a virtue — concreteness now means **named things and stated
events**, never textures.

### Word budgets (warn-level, `NUDGE_WORD_BUDGETS` — aligned in code since THR-1224)

| Field | Budget |
|---|---|
| Opening (all three paragraphs together) | 80 words |
| Factor line | 12 words |
| Band base | 60 words |
| Band fragment | 25 words |
| `effectLine` | 25 words |
| `name` | 4 words — imperative verb + noun |

### Lineage note

Doctrine v2 absorbs and supersedes: rule zero v1 ("game prose, not novel prose",
2026-07-30), the three plainness moves + the density rule (THR-974 / THR-1130 — their
subject-first, abstract-noun and one-named-person content is folded into the sentence
rules above), and the numbered rubric rules 1–7 (2026-07-25 → 2026-08-17). Their full
text lives in this file's git history. Two of the old rules are *reversed*, not
absorbed — see § Retired by name.

---

## Detector spec (verbatim)

Four detectors. **`nudgeAuditDetectors.ts` is the single authority for the vagueness
term lists**; `nudgeAuthoringConstants.ts` re-exports from it and derives
`VAGUENESS_LEXICON` rather than keeping a second copy. Where this page and the code
disagree, **the code is the contract, not this page.**

### Vagueness lexicon — scoped by field class, target **zero**

**There used to be two disagreeing lists.** There is now one, split by *intent* and
enforced by *field class* (THR-899, executing THR-877's reconciliation). This matters to
you as an author because the same word is a defect in one slot and the plainest available
English in another.

| Field class | What it covers | Enforced at zero |
|---|---|---|
| `outcome` | band base text, band fragments, all five afterimages, aftermath overviews, `narrativeTemplates.success`/`.failure` | evasive **and** natural indefinites |
| `scene` | openings, the spine/`initiation` narrative, step narratives, scene vignettes, a card's `fiction` | evasive only |
| `interactive` | `name`, `effectLine`, factor lines, purpose lines | evasive only (their real bar is `interactivePlainness`) |

**Evasive** — no plain-English defence, banned everywhere:

```
hedges          somehow · somewhat · seems to · appears to · a kind of · a sort of ·
                something like · in some way
outcome-hider   something
nominalised     the situation · the matter · the moment · the atmosphere · the tension ·
                the dynamic · the connection · the understanding · the balance ·
                the energy · the presence · the experience · the process
```

**Natural indefinites** — ordinary English in scene setup, evasion after the roll. Enforced
in `outcome` only:

```
someone · somewhere · things · stuff · thing · way · ways · nothing · anything · whatever
```

**Intensifiers** — reported as a **warning** in every class, counted into no failure:

```
very · really · quite · rather · truly · deeply · profoundly · utterly
```

Two things follow, and they are the whole point of the rescope:

- **Write the plain sentence.** "Someone is asking around after the agent, and not in a
  good way" is *correct* scene prose and passes. It used to fail, and the contortions that
  produced — "the stranger is asking the room for them by name" — were the detector
  damaging the prose it existed to protect.
- **Name the result.** "It cost them something" still fails, in every class: `something` is
  evasive, not merely indefinite. After the dice, an indefinite is you withholding what the
  player has no other source for.

Matching is on word boundaries, so `someone` fires inside `someone's` but not inside
`somersault`. Note `rather` fires inside "rather than" — a warning, not a failure.

`countVagueness(text, fieldClass)` defaults to `'outcome'`, the strictest reading, so a
caller that has not thought about scope gets the conservative answer rather than a silent
loosening.

### Annotation patterns — ≤ `ANNOTATION_MAX_PER_ENCOUNTER` (1) across the encounter

| Pattern | Matches |
|---|---|
| `notButClause` | a "not … but" clause inside a single sentence |
| `emDashNot` | an em-dash followed by a negation ("— not the …") |

Both are the writer stepping in to gloss their own image. One is a rhythm; three is a tic.
The budget is per **encounter**, not per field.

### Divine outcome-authorship — target **zero**, every field class (THR-1166)

`DIVINE_DECISION_PATTERNS`. A sentence fails when the god is the grammatical author of a
**result**: a decision verb (`decides`/`chooses`/`chose`/`picks`/`determines`) followed by
`whether`/`what`/`which`/`who`/`if` **and a clause**, or by the bare phrase "the outcome".

| Sentence | Verdict |
|---|---|
| "the god decides whether the debt is paid" | **fails** — a result |
| "the god decides whether **to** press them" | passes — its own act |
| "the god chose how to pull" | passes — its own act |
| "is not the god's to decide" | passes — states the rule |

The infinitive is the whole distinction, and it was drawn from measurement: an earlier
pass also matched `how` and `between`, which flagged two correct lines about the god
choosing its own intervention. Enforced in **every** field class, because there is no slot
where the god picks the ending. See rule 5b above for the phrasing that replaces it.

### Abstraction-as-subject spot check

Per the 2026-07-25 assessment: read each sentence and ask what its grammatical subject
is. When an abstraction keeps arriving in the subject slot — *the tension rose, the
silence stretched, the moment held* — the prose has stopped watching the scene and
started narrating its own mood. Concrete subjects act; abstract subjects describe.

This one is a judgement call, not a regex. Run it by hand.

---

## Consequences — cause → change (THR-1082)

An aftermath's consequence chips are **authored and reserved**. They are not a report of
everything the engine noticed; they are the handful of things this encounter was written
to have happen. Christian's ruling, 2026-08-10: incidental stat drift *"takes away from
the encounter story"* and no longer renders as a chip at all — the engine demotes it to
an icon and a delta cluster automatically, and you never author it.

So every chip you *do* write obeys five rules — and the first is the gate the other
four stand behind.

**0. Every chip is backed by a write (UI Law 56, Christian's ruling 2026-08-16).**
A chip renders only a change the engine actually wrote: a stat or standing moved, a
relationship or agreement created, an object gained or lost, or a planted
`encounter_seed`. Before writing the sentence, point at the effect (in the reaction, the
step outcome, or the seed) that makes the claim true — if there is no effect, there is no
chip. Scene texture goes in the `overview` and afterimages, which are prose surfaces and
never claim state. The motivating defect shipped on The Unsafe Bridge: a `PATH · The
River Crossing` chip (`kind: 'shell_state'`, empty `effects`) told the player a way had
opened while nothing in the simulation tracked it. Christian: *"the chips specifically
show only things that have updated the game state … we do not show prose in this
section. basic game UX."* Note this closes what the old `shell_state`-with-no-effects
pattern left open — "something must persist" (§6) binds per chip, not merely per ending.

**0b. The referent exists, and your sentence names it (UI Law 56 clause 2, Christian's
ruling 2026-08-17).** Rule 0 asks whether *a write fired*. This one asks what the write
was **about**. The chip's referent must be an existing graph object — resolvable in the
live world the player is in — and your sentence must name *that particular object*.

Read the anchor catalog before you write the sentence:

> **`reference/anchor-catalog.generated.md`** — every legal anchor kind, how a chip
> declares it, and which player surface shows it. It is generated from the live type
> unions, so it is current by construction; if a thing is not in it, it is not an anchor.

The two failure shapes, and what to do with each:

| Shape | Example | Fix |
|---|---|---|
| The referent is **scene fiction** | "the river crossing", "the ford upstream" | **Fold** the chip into band prose — the words survive, the chip goes — or **bind** the encounter's spawn to settings that actually carry the feature and anchor to the real node |
| The referent is **real but unnamed** | "a nearby settlement" | **Name it.** `$cast` and the resolved location give you the actual name |

The motivating defect is the one rule 0 did not catch. THR-1141 gave The Unsafe Bridge's
`PATH · The River Crossing` chip a genuine backing write — an `intelligence` record — and
the chip was still dead. Christian: *"there is in all likelyhood no river in the hex the
encounter spawned in, even though a river is referred in the prose … it makes a chip that
connects to a river that is nowhere in the gamestate even worse."* A river is hex state
(`hasRiver`), not a node, so no pointer could have repaired it. The chip was folded.

Two clarifications ratified with the rule:

- **What this encounter creates counts as existing.** A spawned item, a granted condition,
  a minted relationship — legal anchors the moment your effects write them. "Existing"
  means resolvable after this ending resolves, not pre-existing before it.
- **A seed anchors through its carrier.** An `encounter_seed` is not itself a referent.
  Anchor the agent or location it is planted on, and name them.

**Do not fold a chip merely because its anchor cannot be clicked.** The catalog marks
anchors `linked` (the chip carries a click) or `named` (a real object the player reaches
by another surface). Both are lawful. Only five kinds route at all — `agent`, `faction`,
`artifact`, `attachment`, and `companion`, of which `companion` deliberately withholds the
click — so most legitimate anchors are `named`, including every location.

**0c. State first — the chip's words name the mechanic and the endpoints, not the
fiction (Christian, 2026-08-17, THR-1130).** Rule 0b makes the referent *reachable*. This
one makes the sentence *legible*, and it is the half a chip can fail while passing every
gate above.

The motivating defect: The Grateful Kin wrote a real, well-formed `owes_favor` edge and
reported it as **`BOND · the roof they are owed`**, titled "A Roof, Remembered", detailing
beds and hearings. The word *favour* and the debtor's name appeared nowhere. Christian,
reading it: *"the bond… the roof they are owed: again this simply doesn't communicate what
game state has changed."*

So, in order:

1. **The `stateNoun` names the mechanic** — `a favour owed`, not `the roof they are owed`.
   It renders raw into the `CATEGORY · NOUN` tag, so it must read as game state at a
   glance. Note the surface does **not** enrich this field: `{target}` and friends resolve
   in `detail` and `causeClause` only, and a placeholder here ships as literal braces.
2. **The `detail` names the endpoints** — who owes whom what. `{target}` renders the
   target agent's name; `{actor}` the acting agent's.
3. **The fiction goes last**, decorating a claim the player has already read:
   *"{target} owes them a favour now — a bed and a hearing the next time they come
   through."*

**Anchor the end of the edge your sentence is about.** An effect that writes onto the
agent the encounter was *aimed at* produces a chip about the target, and the anchor
follows the sentence: `favor_creation` mints `owes_favor` with **debtor = target,
creditor = actor**, so its chip anchors `$target`. Anchoring `$actor` there is not a
milder version of the rule — it points the player's click at the wrong person. The
sentinel forms are `$actor`, `$target`, `$cast:<key>` and `$faction:<defId>`.

**0d. Never report a quantity the player cannot look up (Law 13 visibility parity,
THR-1136 §5).** An authored chip whose `kind` is `reputation_tally` is a released defect:
per-Reach tallies render only in the debug designer tab, so the chip names a number with
no home. `check:encounter` fails on it. The **effect** stays — tallies keep steering
scoring and gating and keep minting the Whispered/Known/Legendary traits, and a minted
trait *is* sheet-visible and reports normally. World standing and faction standing both
pass parity and keep their chips. The fix is almost always to delete the chip and fold its
sentence into the band `overview`, which is prose and claims nothing.

One caveat learned folding fifteen of them (THR-1130): **fold the words only if they were
true.** Several tally chips also asserted a debt — "the family owes them the road south" —
that no effect on that band wrote. Moving those words into the overview relocates a false
state claim instead of retiring it. Where the sentence was fiction, delete it.

**1. Cause → change, in that order, in one sentence.** The consequence never appears
divorced from what caused it. Write the beat from the scene that produced it, then what
it did:

> *"Caught at the rail by a passing wanderer — Jorun the Wayfarer walks with her now."*

The anti-example is a real line that shipped, and it is what this rule exists to prevent:

> ❌ *"The bridge spent something on this crossing that it will not get back."*

That sentence names no game state, no direction, and no cause a player watched happen.
"Something" is not a consequence. A chip whose sentence could be pasted into any other
encounter in the game is not a consequence either — it is filler wearing a chip's frame.

**2. Name the state noun, and declare it.** Every chip declares `stateNoun`,
`direction`, and `category` as structured fields — not as English for the surface to
parse back out (Law 2). The noun is what appears on the tag: `SCAR · TWISTED ANKLE`.
If you cannot name the noun, you do not yet have a consequence.

**3. Pick the category the *character* would recognise**, not the mechanism:

| Category | What it means |
|---|---|
| `scar` | What the trial cost them, on body or spirit — a wound, a debt, a confidence spent |
| `bond` | Who now stands with them, or against them |
| `boon` | What they earned, and *why* they earned it |
| `path` | A way that has opened **and that the game will act on** — a planted seed, an unlocked route or option the simulation tracks. Nothing *held* yet, but state moved: a way that opens only in the words is not a PATH (rule 0 / Law 56) |

There is no fifth bucket, and no "other". If a consequence fits none of the four, that is
a signal the consequence is not personal enough to be one — not a signal the taxonomy
needs widening. (A genuinely new category is a design decision with a plan-doc note, per
CLAUDE.md's load-bearing rule on new types — never an ad-hoc addition.)

**4. Draw from the whole palette.** All seven attachment categories (`possession`,
`condition`, `blessing`, `curse`, `bestowed_power`, `agreement`, `spell`) are legitimate
consequence material, alongside quintessence shifts (`quintessence_shift` — the "loss of
confidence" shape), faction standing, and planted hooks. An injury is a `condition`
attachment with a duration edge and a negative reach modifier; that is expressible today
and needs no engine work. A corpus where every consequence is an item or a reputation
delta is under-using the substrate, and the machine gates count palette breadth.

**How you write each one (THR-1110).** Until this shipped the rule was partly aspirational:
the vocabulary could grant only `condition` (`condition_attachment` / `apply_condition`) and
`possession` (`spawn_artifact`), so an author reaching for the other five had to fake the
consequence in prose — a chip claiming state nothing wrote, the pathology THR-971's
single-sourcing rule exists to stop — or drop it. The remaining five now have a member:

| Category | Effect | Notes |
|---|---|---|
| `possession` | `spawn_artifact` *or* `attachment_grant` | `spawn_artifact` also places at a location |
| `condition` | `condition_attachment` | Duration + stacks + the wound signal |
| `blessing` / `curse` / `bestowed_power` / `spell` | `attachment_grant` | Names a template id; the category is the template's, never declared |
| `agreement` | `attachment_grant` + `counterpartyId` | **Required** — see below |
| `companion` | `grant_companion` | A person, not a thing (THR-1096) |

```ts
{ kind: 'attachment_grant', templateId: 'agreement.bargain.promise_given',
  targetAgentId: '$actor', counterpartyId: '$cast:stranger', durationOverride: 132 }
```

**An agreement is the one category that needs two parties.** A condition sits on one person;
an agreement is a claim *between* two, so it is edge-backed and `counterpartyId` is required.
Bind it to someone the scene already cast (`$cast:<key>`) and make sure that cast member is
`must-persist` — a promise whose holder is collected at scene end is not a promise. A grant
whose counterparty does not resolve writes nothing and traces why, rather than leaving a
dangling edge; so a missing cast declaration shows up as a consequence that silently never
lands. `durationOverride` sets the term when the scene names one (`null` = permanent).

---

## The Plot-Hook Draw (THR-1147)

**You do not invent the premise from nothing. You roll for it.**

The Consequence Draw below fixes the *back* of an encounter — what happens to someone when
it ends. This fixes the *front*: what the encounter is about at all. The same convergence
applies and for the same reason — asked to invent a premise under a deadline, an author
writes the nearest one, and a corpus grown that way is all roadside trouble and shrine
errands.

At brief time, run:

```
npm run draw:hooks -- <briefSeed> --reach <reach>
```

`briefSeed` is the slug the brief is filed under — not a template id, because at brief time
the template does not exist yet. It prints **three story seeds** drawn from the project's
own inspiration corpus (the Obsidian `Archetypes/` pages, the four recoverable numbered
hooks, and unshipped drafts), each with its themes, its source, and the weight it drew at.

**Take one as the starting point, or blend two.** Then record both on the brief:

```
plotHookRolled: hook.trial_by_combat, hook.scarcity_crisis, hook.unsafe_crossing
plotHookTaken:  hook.trial_by_combat
```

**The hook is a starting point, not a contract — and this is the one hard difference from
the Consequence Draw.** The hand below is *binding*: `check:encounter` recomputes it and
fails a family nothing wires. The hook is not, and nothing checks the finished encounter
against it, because there is nothing about a premise a machine could honestly compare.
Drifting a long way from the hook you took is allowed and ordinary; the encounter that
comes out is judged as an encounter. What is not optional is *recording the roll* — that is
what makes hook coverage measurable across batches, which is the only reason the table
improves anything.

**Reuse damping is the variety guarantee, mechanically.** Each hook carries `usedBy`, the
templates that started from it, and its weight decays by `PLOT_HOOK_REUSE_DAMPING` (0.45)
per recorded use. A well-used hook keeps appearing, just rarely; the long tail of
never-drawn archetypes gets its turn. **Stamp `usedBy` when your encounter ships** — in
`src/data/content-eval/plotHooks.ts`, on the hook you took. Nothing can do this for you: the
hook leaves no trace on the finished template by design, so an unstamped hook stays likelier
than it deserves forever. `npm run draw:hooks -- --coverage` shows what the corpus has spent.

**Reach affinity flavors, it does not restrict.** A hook tagged `iron`/`veil` draws at
weight 6 in those reaches and 1 everywhere else — so a siege can still surface in a `heart`
brief, and when it does the interesting question is what a siege is *about* when read
through `heart`. Same law as the consequence matrix: the tags carry flavor, the floor
carries the variety.

> **On the numbering.** `vertical-slice.ts` cites `Hook #204`–`#207`, so a numbered catalog
> existed in the THR-883 session. It is not in the repo, the vault, or any plan doc —
> searched 2026-08-17 across all three. Those four numbers are preserved on their hooks;
> the rest never had one, and none were invented, because a fabricated number would read as
> recovered provenance.

---

## The Seed Dice (director ruling 2026-08-25)

**Every axis where an unconstrained author would default gets a die; rolls propose,
design disposes.** The Plot-Hook Draw fixes the premise and the Consequence Draw fixes
the back end; these five dice fix the axes in between, because without them the corpus
converges — every problem a plea, every agent a helpful passerby, every opposition a
bandit, everything personal-scale, everything hostile. Rolled per encounter slot at
brief time, recorded on the brief beside `plotHookTaken`:

```
p3Shape:     obstruction
opposition:  terrain (motive: indifference) · activity: blocking the only ford
disposition: n/a  (no willed opposition)
agentRole:   bystander pulled in
scale:       company
```

**Briefing a batch? Roll the whole packet in one command instead:** `npm run
draw:packet -- <briefSlug> [--slots 6]` (THR-1245). It rolls every slot's hooks and
Seed Dice *plus* the four axes the tier table below lists as capped while nothing
rolled them — reach, decision shape, setting class, system target — enforces every
cap and floor **by construction**, and prints the brief's `Rolled constraints` block
ready to paste along with the spread table. See § *The Packet Draw* at the end of this
section. `draw:hooks` remains the single-slot command.

**Roll one slot with `npm run draw:hooks -- <briefSlug> --reach <reach>`** (THR-1224).
The same command that offers the hooks prints the five dice below it, seeded off the
brief slug so a recorded roll is recomputable by anyone who doubts it. The tables live
in `src/data/content-eval/seedDice.ts`; `--coverage` additionally reports which stake
shapes the spent hooks have been pulling toward.

Survey grounding: the axes match what the field's generators roll (OSR reaction +
activity procedure, DMG villain/quandary tables, WWN tags, Ironsworn quest rank,
Dungeon World impulses), diffed 2026-08-25; the agent's-role die is our own.

### Die 1 — the stake (P3 shape), 8 faces · batch cap ≤2

What shape the problem takes when the opening closes. **Not every problem has a
"who"** — only Plea and Contest require a named NPC to own it (the cast binding still
exists for the others; that person just isn't the problem).

| # | Shape | P2 must establish | Closing-line format |
|---|---|---|---|
| 1 | **Plea** | a named person in trouble | "Guard Captain \<name> is at his wits' end and asks for help." |
| 2 | **Obstruction** | a barrier between the agent and where they're going | "The bridge is down. The ford is the only crossing before nightfall." |
| 3 | **Threat** | danger approaching on a clock | "The riders will reach the camp by dusk." |
| 4 | **Opportunity** | something valuable, takeable, at a cost | "The relic is unclaimed. Whoever carries it out owns it." |
| 5 | **Contest** | a rival present, wanting the same thing | "Another claimant is already waiting beside it." |
| 6 | **Choice** | two courses, both costly | "Sharing the water saves the strangers and leaves the company short." |
| 7 | **Unmitigated risk** | nothing attacking yet — continuing without acting invites it | "The pass is open, but the snow above is loaded and the light is going." |
| 8 | **Mystery** | something wrong and unexplained | "No one in the village will say where the miller went." |

A shape may compound once (the relic scene is Opportunity + Contest); a third shape
means P2 is overloaded. Hook themes suggest shapes, non-bindingly, printed with the
roll:

| Hook theme | Natural shapes | Hook theme | Natural shapes |
|---|---|---|---|
| protection | threat · plea | scarcity | choice · opportunity |
| journey | obstruction · risk | conflict | threat · contest |
| discovery | opportunity · mystery | power | contest · threat |
| bargain | choice · contest | betrayal | mystery · choice |
| faith | plea · choice | craft | obstruction · opportunity |
| justice | plea · mystery | transformation | risk · choice |

### Die 2 — the opposition (what resists), 8 faces · batch cap ≤2

| Opposition | Motive column (roll or pick one) |
|---|---|
| rival agent | greed · fear · orders · pride |
| faction / institution | orders · doctrine · territory |
| beast | hunger · territory · panic |
| terrain / the elements | indifference |
| the uncanny (threads, relics, spirits) | its own law |
| the law / custom of the place | duty · precedent |
| time itself | the clock is the enemy |
| the mortal's own trait | read from the graph — their `stubborn`, their `oathbound` |

Optional sub-roll, **activity when found** (texture for P2): eating · fighting
something else · wounded · working · sleeping · arguing · fleeing · waiting.

### Die 3 — disposition (the reaction roll), 5 faces · batch floor: not everything hostile

The oldest die in the hobby, and it was missing: the opposition's stance when the
agent arrives — **hostile · wary · neutral · open · friendly**. One opposition × five
dispositions is five different encounters (the wary beast, the friendly rival).
Disposition is a pre-test state of the world: nudges may sway it, fate resolves it —
exactly the model. Terrain and time roll `n/a`.

### Die 4 — the agent's role (their relationship to the problem), 7 faces · batch cap ≤2

The corpus's strongest default is "helpful passerby". One roll here changes an
encounter more than any other die, for free:

bystander pulled in · the target · **the suspect or cause** ("the garrison thinks the
relic followed *her* here") · the judge asked to rule · the competitor · the client
who is owed · the trespasser.

### Die 5 — scale (who the outcome touches), 4 faces · batch floor: ≥1 settlement-or-larger

**personal → company → settlement → region.** The standing director note is that this
is epic fantasy, not slice-of-life; the portfolio census measures the skew, this die
pushes against it per encounter.

### Enforcement tiers (so nothing here is ad-hoc)

| Tier | Axes | Mechanism |
|---|---|---|
| **Binding** | consequence hand, composition contract | the gate recomputes it |
| **Capped** | stake, opposition, disposition, role, scale + reach/setting/structure/tone | rolled and enforced by `draw:packet`; batch-brief variance rows; the batch report prints the spread |
| **Advisory** | hook, theme→shape suggestion | recorded on the brief so coverage is measurable; never enforced |

The dice stop at the brief. Everything inside the constraints — the fiction, the
cards, the specific people — the author owns. A fully rolled encounter would be
mad-libs; an unrolled one is the same encounter forever.

## The Packet Draw (THR-1245)

Director ruling (Christian, chat, 2026-08-25), after an investigation of the factory's
rolled tables: *"just build it all directly."*

```
npm run draw:packet -- <briefSlug> [--slots 6] [--reaches iron,veil] [--ids a,b] [--json]
```

**One command rolls the batch.** Per slot it composes the Plot-Hook Draw and the five
Seed Dice — unchanged, at the same seeds, from the same samplers — and adds the four
axes the tier table above has always listed as *capped* while nothing anywhere rolled
them:

| Die | Faces | Bound | Source of truth |
|---|---|---|---|
| **Reach** | 8 | ≤2 per batch; `--reaches` overrides | `REACH_DOMAINS` |
| **Decision shape** | 7 | ≤2 per batch | § *The shape catalog* above |
| **Setting class** | 8, **gap-weighted against the live corpus** | ≤2 per batch | `encounter-catalogs.md` § 2 |
| **System target** | 14, maturity-gated | mature freely · middling ≤1 per batch · deferred weight 0 | `encounter-catalogs.md` § 7 |

The setting die is weighted toward what the corpus has least of — an uncovered class
like `stronghold` rolls up to six times likelier than the densest one, tapering
linearly with coverage. The counts are read off the live drawable pool the same way
the THR-884 coverage matrix reads them, so the die follows the corpus rather than a
hand-kept list.

**Caps and floors are enforced by construction, not by retry.** A cap-hit face is
excluded from later slots' tables; the scale floor forces settlement-or-larger only at
the last slot that can still meet it. Re-rolling the batch until it complied would
make the packet a function of how many attempts it took, which is not recomputable
from the slug — and could loop forever on an unsatisfiable batch, where exclusion
simply runs the table dry and **reports the bust**. Every correction is printed with
the face the unconstrained table rolled and the cap that bit, so an author who
re-rolls a slot by hand can see why it differs.

**Tier discipline is unchanged.** The consequence hand stays binding (printed only for
slots given a `--id`, since the hand is seeded by template id); the dice stay capped;
the hooks stay advisory. No template field is added, and nothing recomputes a finished
encounter against a rolled shape, setting or system — that would promote an advisory
axis to binding by the back door.

Tables: `src/data/content-eval/packetDice.ts`. Command: `scripts/draw-packet.ts`.

---

## The Consequence Draw (THR-1145)

**You do not choose which kinds of consequence your encounter has. You draw them.**

Rule 4 above asks you to draw from the whole palette. Left as an instruction it does not
work, and the corpus is the evidence: asked to invent a consequence, everyone reaches for
the nearest one, and the palette census behind THR-1141 found nearly every shipped
consequence landing on an item, a reputation delta, or a condition while a dozen live
primitives went unused. So the factory rolls the hand instead.

At brief time, run:

```
npm run draw:consequences -- <templateId> --reach <reach> [--rarity n]
```

It prints **two families** (three at `rarityTier` ≥ 3) drawn from a reach-weighted table,
plus the concrete effect kinds that satisfy each. **Every family in the hand must be wired
in context.** "In context" is the whole difficulty and the whole point: a drawn `movement`
is not a teleport bolted onto the ending, it is a reason this scene sends someone
somewhere. If you cannot find that reason, you have either not thought about it long
enough or you have a real conflict — and there is a valve for the second case, below.

**The fifteen families** — a *family* is a kind of thing that happens to someone, named as
a player would recognise it, not an effect kind:

| Family | What it is | Wire it with |
|---|---|---|
| `relationship` | Who they are closer to, or further from | `bond_change` |
| `companion` | Someone travels with them now, or leaves | `grant_companion` / `remove_companion` |
| `standing` | How a group or a place regards them | `reputation_score`, `faction_reputation_gain` |
| `possession` | Something they now hold | `spawn_artifact`, `attachment_grant`, `reward_draw`, or a step `rewardPool` |
| `condition` | Something the trial did to body or spirit | `condition_attachment`, `apply_condition`, `remove_condition` |
| `knowledge` | Something they now know | `intelligence`, `spawn_clue` |
| `secret` | Something they know that others must not | `hidden_mark`, `secret_discovery`, `favor_creation` |
| `story_seed` | A scene planted for later | `encounter_seed` |
| `thread` | A tie to the divine, tightened or cut | `thread_strengthen` / `thread_weaken` / `thread_break` |
| `drive` | What they now want, or cannot stop doing | `assign_ambition`, `plant_compulsion` |
| `movement` | Where they go next | `agent_relocation` |
| `place` | What is now true of a location | a condition kind **with `targetLocationId`**, or `spawn_unique_location` |
| `membership` | Who they belong to, and how highly | `membership_change` |
| `omen` | What the sky says is coming | `emit_omen` |
| `formative` | A defining moment (rarity ≥ 3 only) | `axiological_mark_apply` |

**The weights carry the reach's flavor; the floor carries the variety.** `heart` draws
`relationship` far more often than `omen`, `gold` draws `possession`, `star` draws
`story_seed` — but every cell of the table is ≥ 1, so any family can surface in any
reach. A `veil` encounter that draws `possession` is not a bug; it is the table asking
you what a blessing looks like when it is an object. The matrix lives in
`src/data/content-eval/consequenceDraw.ts` (`CONSEQUENCE_FAMILY_WEIGHTS`) — tuning a
number is calibration and needs no ruling; adding or removing a *family* is a design
decision and needs a note to the director.

**Record what you drew.** The template carries the hand:

```ts
consequenceDraw: ['relationship', 'secret'],
```

The hand is **recomputed from the template id** — `check:encounter` re-derives it and
fails a mismatch, so this field is a claim the gate audits, not data you can edit. It also
fails a recorded family that nothing wires, naming the kinds that would satisfy it. A
template that records nothing is silent here; that is the legacy corpus, not a route.

**The one swap.** Exactly one drawn family may be traded, recorded with its reason:

```ts
consequenceDraw: ['secret', 'standing'],
consequenceSwap: { from: 'companion', to: 'standing',
                   reason: 'nobody in this scene persists past the ending — no one to join them' },
```

The traded-in family must still hold weight ≥ 2 in this reach, and the reason must be a
real one. This is the pressure valve that keeps a drawn `companion` out of an encounter
with no persistent cast — **not** a second chance at the dice. One swap, recorded; zero
unrecorded deviations. If two families fight the fiction, the encounter is probably fighting
the hand rather than the other way round, and the honest move is to let the second one
change what the scene is about.

---

## Reusable card faces, bespoke hands

Pre-pivot, ruling 3 made every card per-encounter authored content with a narrow shared
pool of six generic families. The communication pivot inverts the default for **faces**
while keeping it for **hands**:

- **Every card face is library-generic** (title, effect, quote, art) — written to read
  correctly wherever its type deals, and passing the genericity test.
- **Every hand is bespoke** — which types, which spheres, which gates, what the band
  fragments say, what the grants ship. Cutting the hand *is* the encounter-specific
  authoring.

`SHARED_GENERIC_NUDGE_FAMILIES` in `nudgeAuthoringConstants.ts` (`focus · luck ·
blessing · oath · light · strength`) survives as the seed vocabulary for Boost-family
member cards until THR-887 lands the library data file
(`src/data/nudge-card-library.ts`), which becomes the canonical card list. Extending the
library is a code change with a reviewer, never a judgement an authoring session makes
alone.

---

## Fail-soft contract

Everything in the nudge model is opt-in **for the engine**. A step with no `nudges`
resolves exactly as it did before the schema landed, and the tick loop never cares. What
is *not* supported is a half-authored hand: four cards with two failure fragments
between them is worse than no hand at all, because the god's absence then reads as a bug
rather than a decision.

Since THR-1045, do not read the engine's tolerance as an authoring license: for
`encounter.*` corpus content the Composition Contract is not optional. A template with
no nudge-bearing step, no cast binding, or no `aftermathConfig` is engine-legal and
gate-failing — the fail-soft contract is about what the runtime survives, the
Composition Contract is about what the corpus ships. The only templates allowed to fail
the gate are the pre-contract ones already named on the `RETROFIT_PENDING` ratchet, and
that list only shrinks.
