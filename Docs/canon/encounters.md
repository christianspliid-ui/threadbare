---
domain: encounters
last_reviewed: 2026-08-25
reviewer: claude-code
ul_shards: [Encounters, Prose, Traits]
status: live
validated_doctrine: prose@2
---

# Canon — Encounters

> The encounter is the authored chapter in Threadbearer's reading: a moment where one threaded mortal's situation crystallises and the player decides what kind of god to be toward it.

## The nudge model is the current authoring spec (THR-772/774)

> **The god acts through their spheres on the fabric of the scene — matter, minds,
> dreams, fates — never in the dramaturgy of the story. Influence, never authorship.**

A god's reach is as wide as their spheres, and the lawful nudge space is that wide too:
a stumble on loose stone (force), an urge arriving in sleep (mind), a sense that this
has happened before (time), an old ambition catching light again (spirit), a face
nobody afterwards quite recalls (darkness), a wound that closes cleaner than it should
(life). What stays forbidden is unchanged and is not about *range*: never instruct the
mortal, never pick between authored endings. Fate still rolls.

Every encounter authored from 2026-07-27 ships **nudge-native**. The player is dealt a
hand of authored, essence-priced **nudges** that shift the named odds; **fate rolls the
outcome** on the five-band ladder; prose pays the nudge off at *every* band, misfires
included. Choosing between authored futures for a mortal is the **rejected** model this
replaced (see Rejected approaches).

**The format was locked 2026-07-30 (THR-883, the communication pivot): prose does the
scene, cards do the rules. Amended 2026-08-25 (Doctrine v2 — narrator mode).** Scene prose
(per-class openings + setting-neutral spine + outcome prose) is written in **narrator mode**
under the narrator's 12-question checklist (the scene-writer's 14-question checklist is
retired); a card face is **spell-style and library-generic** — imperative verb + noun
title, 1–2 direct effect sentences, no flavor quote (retired 2026-08-25), cut from the
21-type card library — with zero scene-bespoke prose.
Templates declare **setting envelopes** (THR-884: `settings` from the 8-class
vocabulary + one opening per class); cards may charge **cost channels** and carry
**grants** (THR-885: doom/detection deltas, world changes in the existing aftermath
effect vocabulary, grant-liveness gated). Odds render as pips (display-side; raw numbers
in data).

- **Authoring contract (load first, both pipelines):** [`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`](../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) — the communication pivot, § Prose doctrine v2 (narrator mode) with the 12-question checklist, setting envelopes, the 21-type library hand rules, register table, prose rubric, verbatim detector spec.
- **Golden exemplar:** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` — The Swollen Ford, authored end-to-end in the locked format, every rule visible once. In no shipped pool. (Supersedes the pre-pivot Darkhollow Vault, deleted 2026-07-30.)
- **Card library + pip vocabulary:** `public/nudge-cards-reference.html` (wiki page — the surface the repertoire is iterated on) · Repertoire progression: [2026-07-30-nudge-card-repertoire.md](../plans/2026-07-30-nudge-card-repertoire.md).
- **Encounter catalogs (design-block vocabularies):** [encounter-catalogs.md](encounter-catalogs.md) — shape, setting, pressure, form, objective, stakes, system (maturity-gated to the vertical slice); companion idea bank `Design/research/quest-hooks/` (1,200 tagged hooks).
- **Tunable authoring guardrails:** `src/data/content-eval/nudgeAuthoringConstants.ts` (authoring/lint-side; **not** the client bundle). Runtime numbers stay in `src/data/nudge-constants.ts`.
- **Executable half:** `src/engine/__tests__/nudgeModel.test.ts` § *golden exemplar* — the checklist as assertions (envelope validity, cost channels, grant liveness included), so spec and exemplar cannot drift apart silently.
- **Schema:** `StepNudge` (incl. `costs`, `grants`, `requiresGroup`/`requiresFavor`; `fiction` and `fictionBySetting` were **retired** by THR-1225 — do not author them) / `ActionStep.nudges` / `TraitVariant` / template-level `settings` + `openings` (`src/types/unifiedAction.ts`); hand resolution in `src/engine/encounters/nudges.ts`, dispatch in `src/engine/encounters/nudgeDispatch.ts`, envelopes in `src/data/settingClasses.ts`.
- **Program plan:** [2026-07-26-nudge-model-encounter-system.md](../plans/2026-07-26-nudge-model-encounter-system.md) (THR-772) · WS0 substrate [2026-07-26-nudge-model-ws0-engine-substrate.md](../plans/2026-07-26-nudge-model-ws0-engine-substrate.md) · WS1/WS2 [2026-07-27-nudge-encounter-experience-ws1-ws2.md](../plans/2026-07-27-nudge-encounter-experience-ws1-ws2.md) · frameworks [2026-07-30-encounter-authoring-frameworks.md](../plans/2026-07-30-encounter-authoring-frameworks.md) (THR-884/THR-885, both shipped 2026-07-30).

**Migration state — WS5 is complete (THR-1086, 2026-08-11).** No shipped encounter
authors `authoredChoices` any more. The last one was `encounter.apotheosis.ascension`,
the Influence capstone, converted under the THR-866 design decision:
[2026-08-11-thr-866-apotheosis-nudge-conversion.md](../plans/2026-08-11-thr-866-apotheosis-nudge-conversion.md).

The **layer** still renders — the stage branches on data presence, so the rollout stayed
per-template and reversible with no flag day, and that property is worth keeping. What
changed is that nothing exercises it. Two consequences for an author:

- Do not author `authoredChoices`. A fork the *player* picks is the rejected design
  (see § Rejected, below); a fork the **mortal** picks is `ActionStepBranch.decidedBy`.
- The apotheosis is the reference conversion for a two-pole fork whose branches carry
  an irreversible world-write. Three things it settles, each the non-obvious half:
  `variants` key exactly `'positive'` / `'negative'`; `aftermathConfig.branchOnStep`
  names the **deciding** step, not the fork's own index (THR-979); and a permanent grant
  rides the winning step's `successMetadata.effects` (THR-783) rather than an aftermath
  reaction — a reaction is a click, and `applyAftermathOutcomeBand` replaces `reactions`
  wholesale, so a band that authored its own would drop the grant by omission.

**Terminology.** A **rider** (`no_crit_fail`, `floor_at_cost`) is a mechanical remap of
the resolved band. A **band fragment** (`bandProse[outcome]`) is prose appended when a
nudge was active for that band. A rider changes what happened; a fragment says the god
was there when it did. Both are UL entries (Encounters shard).

**The variance rule — do not author static factor lines (THR-892).** A test-panel factor
line earns its place only if it **could have read differently on another run**. A static
line reads the same every time the encounter fires, so it informs no decision: price it
into the step's `difficulty` and put the fact in the prose, where scene facts belong.
Static `ActionStep.factorLines` are therefore **retired for new content** — the exemplar
authors none. What fills the panel instead is *derived*: the actor's capability in the
step's reach, plus one line per named modifier the world contributed (equipment, terrain,
faction, sphere, conditions/attachment effects, divine attention, rule overrides). Those
come from `ModifierBreakdown.contributions`, emitted by the **same** `computeResolutionModifiers`
walk that feeds the roll — never a parallel computation, so a line and the outcome cannot
disagree. Omens, doom stage, and season derive **nothing**, and that is correct rather than
missing: no omen/doom/season read exists anywhere in the modifier pipeline `forecastAction`
consumes. The two authored factor surfaces that survive the rule are **trait lines**
(`TraitVariant.factorLine`) and **carryover lines** (`ActionStep.carryoverFactorLines`),
which key on the band the *previous* step rolled — variant by construction. Full authoring
detail: systemic wiring guide § Capability 17.

**Meet The First is nudge-native (WS6, THR-868).** The game's first interactive surface
used to *be* the rejected model — two authored formative moments, player picks which one
is true. It now runs three fate rolls: two **formative tests** and a **bond test** as the
climax. A meeting nudge additionally carries a **pole lean** (`MeetingStepNudge`), because
a nudge shifts odds and never picks the ending, so the *direction* a success writes cannot
come from a choice: the played hand's net lean picks which pole of the value pair a success
writes, and fate picks how cleanly it resolves. That is what makes "you nudged toward
mercy, fate landed ruthlessness" a real outcome rather than a slogan.

- **Types + resolvers:** `src/types/meetingEncounter.ts`, `src/engine/meetingEncounter.ts`
  (`resolveFormativeTest` / `resolveBondTest` / `applyMeetingOutcomes`). No parallel
  resolver — the shared attended ladder does the rolling.
- **Constants:** `src/data/meeting-nudge-constants.ts`. Note `MEETING_TEST_CAPABILITY` is
  **0.8, not 0.5**: measured through the live resolver, 0.5 against authored difficulty
  0.5 forecasts `doomed` (p=0.09), because the attended sigmoid is not centred at equal
  capability/difficulty. Retuning is free; the tests pin the *shape* (an unled
  mid-difficulty moment must not read `doomed`), not the number.
- **Bands are `StepOutcome`, not `ForecastTier`.** `fated / favorable / uncertain /
  perilous / doomed` are the **pre-roll** forecast words. A nudge resolves onto the
  six-value `StepOutcome` ladder. Substituting one for the other type-checks and is wrong.
- **Register + image doctrine are enforced, not advisory:**
  `src/data/__tests__/meetingProseRegister.test.ts` (zero vagueness-lexicon words across
  the sensing vignettes and god-voice tables, with negative controls) and
  `src/data/__tests__/meetingSceneDoctrine.test.ts` (`QUARANTINED_SCENE_ASSETS`).
- **The vagueness lexicon is scoped by field class, not flat** (THR-899, 2026-08-01).
  Evasive terms (hedges, nominalised placeholders, `something`) are banned everywhere;
  natural indefinites (`someone`, `way`, `nothing`, …) are enforced in **outcome prose
  only** and are ordinary English in scene setup; intensifiers are a warning, never a
  failure. `countVagueness(text, fieldClass)` takes the scope. Write the plain sentence —
  "someone is asking around after the agent" is correct scene prose. The two-list era
  (`VAGUENESS_LEXICON` vs `AUDIT_VAGUENESS_TERMS`) is over: `nudgeAuditDetectors.ts` is the
  single authority and `VAGUENESS_LEXICON` derives from it. Partition pinned by
  `src/data/__tests__/vagueness-scope.test.ts`.

## Current spec

- **Format:** `UnifiedActionTemplate` — the single format for all encounter types since THR-108 (2026-04-XX). `EncounterTemplate` is removed; it no longer exists anywhere in the codebase.
- **Two encounter subtypes (same format, different pipeline):**
  - *Branching encounters* — structural branches (`ActionStepBranch`), full aftermath suite. Pipeline: `.claude/skills/encounter-pipeline/SKILL.md`.
  - *Linear template encounters* — guild, social, tavern, combat, borderland. Pipeline: `.claude/skills/template-encounter-rewrite/SKILL.md`.
  - Both are nudge-native: the player-facing surface in each is the nudge hand.
- **Authoring entrypoint (branching):** [.claude/skills/encounter-pipeline/SKILL.md](.claude/skills/encounter-pipeline/SKILL.md)
- **Authoring entrypoint (linear):** [.claude/skills/template-encounter-rewrite/SKILL.md](.claude/skills/template-encounter-rewrite/SKILL.md)
- **Factory tooling (THR-1245/THR-1246, 2026-08-25):** a batch brief's rolls come from **one command** — `npm run draw:packet -- <briefSlug>` (hooks + the five Seed Dice + four capped packet dice: reach, decision shape, gap-weighted setting class, maturity-gated system target; caps enforced by construction; tables in `src/data/content-eval/packetDice.ts`). Implementation is **package-compiled**: the agent fills an `EncounterContentPackage` and `npm run compile:encounter` emits the module (prose byte-identical), derives `locationSubtypes`, **stamps the binding `consequenceDraw`**, registers it, and generates the structural test — schema card: [encounter-package-format.md](../../.claude/skills/encounter-pipeline/reference/encounter-package-format.md), compiler: `src/data/content-eval/encounterPackage.ts`. Hand-writing the module, the registration, or the draw is retired for new content.
- **Engine wiring:** [Docs/plans/2026-04-16-systemic-wiring-guide.md](../plans/2026-04-16-systemic-wiring-guide.md) — the 7 engine capabilities content authors must use
- **Compiled brief:** [Docs/authoring-brief.md](../authoring-brief.md) — regenerated from sources via `npm run build-authoring-brief`; check staleness with `npm run check:authoring-brief`
- **UL terms:** [Docs/ubiquitous-language/Encounters.md](../ubiquitous-language/Encounters.md)
- **Obsidian system page:** `TheFantasyWorldSimulator/Systems/Encounter System.md` (verify freshness — may lag code)
- **Exemplars (canonical quality bar):** `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` (format + prose); `rival-shrine-betrayal.ts` / `flawed-steel.ts` are **wiring references only** — their prose and choice model predate the nudge pivot and Doctrine v2 — per [Docs/exemplars.md](../exemplars.md)
- **Data directory:** `src/data/encounters/` (branching) + template files compiled from skill pipeline

## Four load-bearing rules (encounter design)

From `2026-05-04-encounter-experience-design-plan.md` §1 — the executor's contract:

- **Rule 1 — Path over adjective.** Every player choice must change the path, not the adjective.
- **Rule 2 — The moral axis is structural.** Every reach has an archetype-pair axis (per the Cosmological Pattern). Each encounter choice tilts the agent toward one pole.
- **Rule 3 — Divine influence is soft-power, expressed through the scene's prose; card faces are library-generic.** *(Amended 2026-07-30/2026-08-25: the original rule — "each encounter writes its own god-verbs" — predates the communication pivot. What survives: never full control, and the scene prose grounds each card in this encounter's named elements. What changed: the card text itself is the shared 21-type library vocabulary, spell-style, never scene-bespoke.)*
- **Rule 4 — Every primitive is clickable.** Every node type — cast tile, item, clue, place, faction, Ascendant — has a detail page.

**Picking a step's `difficulty` (THR-1575 forecast window, guidance from 2026-09-24).** A step's difficulty is **the proficiency the step demands**, on the same 0–1 scale as a mortal's capability. Pick it as the proficiency of the mortal the step is written for, and expect mortals of that level to engage it at about even odds. A step for a green apprentice sits low; a step only a master should face sits high. Do not pick a number by feel for "how hard does this sound". The dice are being re-fitted to this reading (THR-1581), and mortals will choose challenges whose forecast is about 50–65% (THR-1582). A step's number therefore decides *who* attempts it, not whether it is easy for everyone. The four difficulty words (`gentle` · `fair` · `steep` · `severe`) keep their bands. Coverage per proficiency band — which levels the catalog already serves and which it starves — is printed by `npm run measure:roll-spread`. Expert- and master-level content is authored after the design lands, from that report.

## Content references content by kind and tags, not by id (THR-1487/THR-1488)

An encounter carries `tags` — the `family` word another piece of content finds it by —
and names its own sequel the same way: `encounter_seed.query` is
`{ kind: 'encounter_template', tags: ['#circle_errand'] }`, resolved when the seed comes
due by the one `resolveContentQuery`. An undertaking's `catalystQuery` is the same
shape. Full rules and the closed vocabulary: [`content-objects.md`](content-objects.md)
§ *The content query*; the tag catalog the authoring agents read is
`.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md`.

**Author the `form` and `family` axes only.** `reach` and `sphereAffinity` are typed
fields, so their tags are projected at index time; authoring one that contradicts the
field fails `contentTags.test.ts` by name.

**Why this replaced the id-prefix family.** `encounterFamily` named an id prefix, and a
prefix rots the way a literal id does — measured 2026-09-12, **41 of the 51 families the
corpus authored matched no template at all**, alongside seven seeds naming `templateId`s
that do not exist. Forty-eight kinds of promised follow-up had been withering on arrival,
indistinguishable from a system nobody wired. A family tag cannot rot that way: a renamed
template keeps its family, and a new one joins by carrying the word. `encounterFamily` is
deprecated — `ENCOUNTER_FAMILY_TAGS` rewrites the shipped prefixes for one release — and
both live operands are fatal in `check:encounter`, with a corpus-wide vitest behind it
because `--all` sweeps `encounter.*` only and every one of the seven fatal findings lived
outside that prefix.

**A family tag is a game word, never an id spelling.** `#circle_errand`, not `#ac_quest`.
The word reaches the player through the withered-seed narrative event, so it has to read
as English.

## An encounter may bind a mortal to a place by a time — the appointment (THR-1479)

An `encounter_seed` effect may carry an **`appointment` block**: the place (`$here`, `$cast:<key>`, or a literal Location/Place id — never a bare hex), a window (default `APPOINTMENT_WINDOW_TICKS`), the counterparty (`$cast:<key>`), and the **missed** branch (a gated literal `templateId` or a `query`, never an ungated id). The seed's own `delayTicks` is the due delay; its own `templateId`/`query` is the **kept** branch. The planter writes an `owes_favor` edge carrying `properties.appointment` — that edge *is* the promise on the mortal's sheet (the world-object **Agreement** kind's `favor` class; no new node, edge or class). **The seed is the appointment's one record**: the pull, the chips, the sheet row and the debug readout all read `pendingEncounterSeeds`; nothing is copied onto the mortal.

The mortal leans toward the place as the slack (`due − now − travel`) shrinks, departs when it falls under their leave margin (a formula over `courage_prudence` and `loyalty_ambition` — a Watcher leaves a day early, a Renegade may *choose* to miss), and keeps the meeting by standing anywhere on the place's **hex** in the window (the awareness rule). Missed, the seed rewrites itself into its missed branch and fires wherever they are, with the favour marked `broken`. Every constant is in `src/data/movement-content.ts`; the arithmetic is `src/engine/appointments.ts`; the arm is in `evaluateEncounterSeeds`.

**This is prose rule 7b's one lawful exception.** "Collect it here at the next full moon" may be written only on a seed that carries the block; `check:encounter` fails an appointment with no missed branch (`appointment_missing_branch`) or a dead one. A Bargain at the Crossroads is the worked example — read its accept reaction before authoring one. Plan doc: [2026-09-21-thr-1479-appointment-primitive.md](../plans/2026-09-21-thr-1479-appointment-primitive.md).

**A sequel that assumes its parent is seed-only (THR-1526).** `UnifiedActionTemplate.drawable: false` keeps a template off the decision board: the encounter cache and the divine-vision delivery beats skip it, and it starts only when something names it — a seed, an appointment branch, a trigger, or `?spawn=`. Every appointment branch target is `drawable: false` (the Full Moon Collection, the Full Moon Reckoning), and so is every plain sequel whose opening names its parent's people, place or promise (the Swindler Found, the Grateful Kin); a follow-up that stands alone stays drawable. Keep a seed-only sequel in its catalog array and keep its envelope — the seed query and `eligibleAt` read both. Before THR-1526 the Reckoning fired from the board, telling mortals who had given no word that they had broken it. Gates: `encounterSeedLiveness.test.ts` (fatal) and two `check:encounter` warnings; evidence: `npm run census:firings`. Plan doc: [2026-09-24-thr-1526-seed-only-encounters.md](../plans/2026-09-24-thr-1526-seed-only-encounters.md).

## The pool reads the place's traits (THR-790)

A place-tier Location can carry **location traits** — `trait.condition.location.*` definitions on a `has_trait` edge. Six are planted by aftermaths (THR-1143); four are **minted from the world's own scalars** by `phaseLocationTraits` and released when the reading recovers: *Welcoming* (sustained prosperity), *Lawless* (sustained unrest), *Veil-thin* (magical saturation) and *Haunted* (saturation plus the dead). `scoreAndSelect` adds `locationTraitBonus` beside the economic-context term: for each trait the candidate's place carries, each **content tag the template carries** is looked up in `LOCATION_TRAIT_ENCOUNTER_BONUS` (`src/data/location-trait-constants.ts`) and the hits are summed, capped at `LOCATION_TRAIT_ENCOUNTER_BONUS_CAP`.

**What this means for an author.** A template joins a marked town's pool by being *about* the right thing — the rows name seated content tags on any axis, and a template's projected reach tag (`#gold`, `#shadow`, `#veil`, …) is what carries the term today, since only 16 of 236 shipped encounters carry an authored family word. Author the `form` and `family` axes as the content-model section above says, and a `#tavern_night` or `#delve` template leans into the town that suits it without naming the trait. To *gate* on a place's condition, `requiredTargetTraits` on a location target already works; to *plant* one, `apply_condition` with `targetLocationId` / `$here` (THR-1143 / THR-1446). A `condition_template` query never returns a place's condition unless it says `classes: ['location']` — the bearer-kind carve, so an untagged `condition` recipe cannot deal a mortal *Festival*.

`npm run census:location-traits` reports the pool shift at marked vs unmarked places — the parent plan's kill-criterion instrument. Plan doc: [2026-09-21-thr-790-traits-wave-2.md](../plans/2026-09-21-thr-790-traits-wave-2.md).

## The scene-sentinel vocabulary (THR-1446)

Aftermath effects name people and places with **sentinels**, not node ids — the ids are minted per run, so an author cannot know them. The authoritative table is [`src/engine/sceneSentinels.ts`](../../src/engine/sceneSentinels.ts); read it rather than any prose list, including this one (impediment #725 is what a stale copy costs).

| Sentinel | Binds to | Use it for |
|---|---|---|
| `$actor` | the acting agent | the mortal whose scene this is |
| `$target` | the card's resolved target | whoever or whatever the card was aimed at |
| `$cast:<key>` | a member of the scene's own cast | the innkeeper, the survivor, the swindler |
| `$ascendant` | **the player's god** | the divine end of a `thread_*` effect |
| `$here` | **the place the scene happens at** | any consequence landing on a location or place |
| `$realm` | **the Realm whose political map claims the scene's hex** | standing with the crown — `faction_reputation_gain` on `factionId`; binds nothing on unclaimed ground, by design |
| `$area` | nothing — **refuses on every effect field** | naming the Area on a chip anchor (`visualKind: 'area'`); no aftermath effect takes an Area |

Two of these are new as of 2026-09-10, and both existed to close a gap that made whole consequence families unauthorable:

- **`$ascendant` made the `thread` family real.** The Consequence Draw weights `thread` ≥ 1 in all eight reaches — the floor *is* the design — but `thread_*` effects take a literal `ascendantId`, and the node id is minted as `asc.<archetypeId>`. There was no literal an author could write, so every thread effect skipped. Pair it with `$actor` on `mortalId`.
- **`$here` made `place` reachable on self-targeted encounters.** `$target` binds a location only when the *card* targets one; most encounters resolve self-targeted, so a `place` consequence wired as `targetLocationId: '$target'` no-opped in silence. **When the consequence lands on a place, write `$here`.**

**The chip side reads the same vocabulary, one form at a time.** A consequence chip's `entityId` may declare `$actor`, `$target`, `$artifact`, `$cast:<key>`, `$faction:<defId>`, `$here` (THR-1462) and `$realm` (THR-1499); `classifyAnchorDeclaration` in `src/data/content-eval/chipAnchorDeclarations.ts` is the authoritative list. `$here` and `$realm` resolve through the **same** lookup the effect binder uses (`sceneHere.ts`, `sceneRealm.ts`), so the chip and the effect it reports cannot name different nodes. `$realm` is gated like `$artifact` — refused on a template whose effects never bind it — and on ground no Realm claims it resolves to nothing, so the chip stays `named` rather than becoming a dead link. **A `faction_reputation` chip on a realm-court ending anchors its `stateNoun` to `$realm` with `visualKind: 'faction'`**, the same shape a guild chip uses with `$faction:<defId>`.

`check:encounter` now fails a sentinel pointed at a field it can never satisfy. It says nothing about `$target`, deliberately: what an encounter resolves against is a runtime fact no template declares, and a gate that guessed produced a false positive on the first try.

## Active design plans

- [2026-05-04-encounter-experience-design-plan.md](../plans/2026-05-04-encounter-experience-design-plan.md) — encounter experience design (THR-300). Status: **partially superseded (2026-08-25, THR-1252)** — Rules 1/2/4 and the cast-tile/clickable-primitive decisions stand; Rule 3 (per-scene verb prose on choice cards), §3.4, and §4.3 (voice/Chronicle prose) are superseded by the nudge pivot + Prose Doctrine v2, marked in-file. Consult it for the surviving rules only.
- [2026-05-04-encounter-experience-player-journey.md](../plans/2026-05-04-encounter-experience-player-journey.md) — player journey reference (companion to above)
- [2026-05-04-encounter-experience-grill-me.md](../plans/2026-05-04-encounter-experience-grill-me.md) — pre-design synthesis; useful archaeology
- [2026-05-04-encounter-toolkit-vision-audit.md](../plans/2026-05-04-encounter-toolkit-vision-audit.md) — vision audit **with one corrected row** (see note below)

> **Note on the 2026-05-04 vision audit:** The audit row claiming "8 reach domains = drift, canonical is 9 reaches" is **inverted** — the toolkit was correct (8 Reaches), the audit was misled by `vault/Systems/Domain Word Scales.md` (a stale 2026-03-08 page predating the TB-075 Flesh→Quintessence decision). See `Docs/audits/2026-05-05-cosmological-canon-drift-audit.md` for the full account. Read [Docs/canon/cosmology.md](cosmology.md) for the authoritative reach roster.

## Reach→archetype-pair axis reference

Each encounter's primary reach maps to an archetype-axis in the Cosmological Pattern. **Do not reproduce the pole-name table here** — [Docs/canon/cosmology.md](cosmology.md) §Cosmological Pattern is the single source of truth, and the names have been revised twice by director decision (2026-06-29: Shadow → Broker ↔ Manipulator, Veil → Weaver ↔ Unraveller, Eye → Seer ↔ Inquisitor; 2026-08-16/THR-1135: Stone's virtue word → Careful). The registry `src/types/axisRegistry.ts` is the code source of truth. Any surface still carrying Saboteur/Deceiver, Veil-Seer/Manipulator, or Witness/Judge is stale — this page carried exactly that table until 2026-08-28 (THR-1338), sourced to a plan section that never contained one.

## Rejected approaches

- ❌ **Fiction-first briefs — the story written before the game design** — rejected 2026-08-24 (Christian, chat, rejecting a fiction-first brief: *"clearly written first, and then you are trying to mash it into a game"*). The binding order is: portfolio (what types does the corpus need) → **all** game-design choices (structure, payoffs, prizes, penalties, consequence hand, cost/grant channels) → plot-hook roll → 2–3 story candidates within the constraints → review-agent judgment picks the draft. Full rule: `nudge-authoring-spec.md` § Authoring order. Companion note from the same sitting: the corpus skews to travel/meet-people vignettes and the game is **epic fantasy** — the plot-hook table (THR-1147) exists to force that variety and must actually be rolled, never bypassed by a freehand brief.
- ❌ `EncounterTemplate` format — replaced by `UnifiedActionTemplate` (THR-108, 2026-04-XX). Do not author, import, or reference EncounterTemplate. It is removed.
- ❌ AgentWheel / fixed action-count slots — replaced by `ActionDrawer` with context-filtered cards via Generalized Action Targeting (see CLAUDE.md Rejected Approaches)
- ❌ Pure LLM-generated encounter prose — replaced by hybrid layered engine with enrichment placeholders
- ❌ Player-as-character framing ("choose how the character responds") — the player is a god who intervenes indirectly. All player-facing options must be *god actions*. Any choice that makes the mortal the agent must be reframed.
- ❌ **Choosing between authored futures** ("Forge the truth" / "Temper the narrative") — rejected 2026-07-26 (THR-772, Christian, chat). The player must never pick an ending. The god plays concrete, sphere-flavoured **nudges** that shift the odds; fate rolls the outcome. Superseded the `authoredChoices` layer at design level; the content migration is **complete** (WS5, THR-1086 — zero shipped encounters author it, re-verified 2026-08-25). Do not author `authoredChoices` on a new encounter.
- ❌ **A percentage anywhere on the mortal-facing surface** — rejected 2026-07-26 (THR-772 ruling 1). Odds are legible in words only: the five forecast tier words and the four difficulty words (`severe / steep / fair / gentle`). Numbers exist behind the words; the designer/debug view is the sole exception. An `effectLine` carrying a digit is an editorial reject, not a nit.
- ❌ **A nudge with no failure-band payoff** — the god's hand must be traceable in failure at any size (THR-772 program ruling: payoff at every band). A card that vanishes on a loss makes failure read as punishment, which inverts the design.
- ❌ **Scene art that depicts the interaction, or a second human likeness** — rejected 2026-07-30 (THR-868 audit). Image doctrine ruling 10: a scene omits or silhouettes the agent, because the portrait chosen at Sensing is the only likeness across the flow. The audit of all 32 meeting scene files found five violations, and the reachable one was rendering: `plague-ward.jpg` (an individuated child's face) won any dilemma tagged `sacrifice` or `compassion`. `prison-cell.jpg` had the retired choice mechanic painted in as two UI buttons — "GRANT MERCY" / "IMPOSE JUDGMENT" — so the art taught the rejected model even after the code stopped. Two more carried baked-in caption text. Quarantine list + enforcement: `QUARANTINED_SCENE_ASSETS` in `src/data/meeting-art-library.ts`, pinned by `src/data/__tests__/meetingSceneDoctrine.test.ts`. **A wrong picture type-checks** — this class is invisible to every test that does not look at the pool. *(2026-09-17, THR-876: all five were regenerated under the same filenames as unpeopled scenes and re-registered, so the quarantine list is currently empty; the mechanism and its test stay, kept honest by a falsification arm. Evidence: `Docs/evidence/thr-876/`.)*
- ❌ **The lyrical register, game-wide** — rejected 2026-07-30 (Christian, chat; THR-868 WS6 mandate). "Something inside them settles into place like a stone dropped into still water" is the register being retired. Player-facing prose is plain and descriptive of **events, people, and motivations**: every sentence carries a picturable anchor, abstractions are cashed in-sentence, and the vagueness lexicon targets zero **within its field class** (THR-899: evasive terms everywhere, natural indefinites in outcome prose only, intensifiers at warn — the flat "`someone` and `very` included" reading was retired 2026-08-01 because it failed the reference sentence it was meant to protect). Do not close a paragraph on an abstraction.
- ❌ **A consequence chip with no state write behind it** — rejected 2026-08-16 (Christian, chat; UI Law 56, `Docs/design-system/laws.md` §XIV). Every aftermath `changes` entry (SCAR / BOND / BOON / PATH) must correspond to an effect that actually fires on that band — a stat/standing delta, a relationship or agreement, an object (artifact / attachment / trait / companion), or a planted `encounter_seed`. **PATH is reserved for openings the game will act on**; "the fiction moved" is not a PATH. The motivating defect: The Unsafe Bridge's `PATH · The River Crossing` (`kind: 'shell_state'`, empty `effects`) reported an opening nothing tracked. Scene texture belongs in `overview`/afterimages, which never claim state. Full authoring rule: `encounter-pipeline` spec § Consequences rule 0.
- ❌ Spirit as a Reach — Spirit is a **Sphere** (one of the 12 Creation Spheres), not a Reach. Using "Spirit reach" in encounter authoring is a drift error. Use the correct Reach (Iron, Gold, etc.) for the action domain.
- ❌ Voice as a Reach — Voice does not exist. The persuasion/communication domain maps to **Gold** (influence, patronage, social capital) depending on the action type.
- ❌ Intelligence/visibility gating of encounter candidates — rejected 2026-05-07 (project-level direction from Christian, THR-138 closed). All encounter content is fully visible to the player at all times; intel never *hides* candidates. Intel may still *enrich* an encounter when present (prose recognition per THR-139, mechanical bonus per THR-140, cross-agent sharing per THR-142) — additive, never subtractive. Do not propose `requiresIntelligence` template fields, hidden-candidate filters, or "fog of intel" mechanics; the design space is closed.
- ❌ Step-level `ActionStepBranch` in linear-template encounters — rejected 2026-05-15 (THR-191). `ActionStepBranch` is exclusive to *branching encounters* (`src/data/encounters/`). Linear-template encounters (guild, social, tavern, combat, borderland) use aftermath reactions + optional `BranchAwareAftermathConfig.variants` as their choice surface. A linear template that wants a mid-quest fork should be promoted to a branching encounter via `encounter-pipeline`, not retrofitted with step branching. Supersedes the "use ActionStepBranch on ≥3 templates" instruction in `Docs/plans/2026-04-19-thr-96-lorekeepers-covenant-migration.md`.
- ✅ **Outcome-keyed aftermath — `AftermathVariant.byOutcome`** (THR-969, 2026-08-02). An aftermath variant (choice-keyed *or* the `fallback`) may carry per-outcome overrides of `overview` / `changes` / `reactionPrompt` / `reactions`, so the ending reflects **how** the encounter ended and not only which route was taken. This closes a structural gap, not a content one: because most linear templates ship `variants: {}`, a choice-less encounter could previously render only its single `fallback` — "crossed clean" and "fell in the river" produced byte-identical aftermath by construction. Resolution order is **choice → outcome band → base variant → fallback**; the band layers onto the variant the choice already picked, field by field. Key on the seven-value `UnifiedActionOutcome` — **not** the five-band `EncounterOutcomeBand`, the six-value `StepOutcome`, or `OutcomeBand` from `outcomeConsequences.ts`, each of which type-checks while being the wrong domain. Optional and additive: a band-less config resolves exactly as before (pinned by an identity assertion in `src/types/__tests__/aftermathOutcomeBands.test.ts`). Authoring surface: `Docs/plans/2026-04-16-systemic-wiring-guide.md` § Capability 18. **Coverage is owed per path (THR-1509, 2026-09-17):** a band is reached on the one variant the choice picked, so every reachable path owes the losing bands its steps can end on — `critical_failure` always, `failure` when a step on it is `fail_action` — because base endings are written as wins; winning bands are optional per path. The `?outcome=` verdict judges against the resolved path (`variantKey` / `templateBands` on `getOutcomePinVerdict()`), and the slice gate shares its predicate.
- ✅ **Populated `BranchAwareAftermathConfig.variants` on linear templates — opt-in, signal-gated** (THR-447, 2026-05-16). The `fallback`-only default stays correct for the majority of linear templates. A family becomes a candidate for populated `variants` only when ≥3 of 5 signals fire (recurring thematic tension, distinct downstream graph consequences, saga-scale weight, multi-actor reaction surface, player-legible cue). Per-template authoring is budget-capped (2 choices × ~45 min); editorial gates G1–G4 are mandatory. See `Docs/plans/2026-05-16-thr-447-aftermath-variants-format-decision.md` for the full framework and the family scoring matrix.

## Open questions

- **Branch count enforcement:** 3-branch ceiling is the editorial target; some branching encounters currently have more. The editorial agent applies discipline on a per-encounter basis; no hard engine enforcement yet.
- **Phase 2a wiring (THR-306):** When THR-306 lands, the `encounter-pipeline` skill will load this Canon page as its explicit Step 0. Until then, authoring agents must load this page manually before running the pipeline.

## Last-reviewed

2026-09-22 by Claude Fable (THR-790 — the pool-reads-the-place section added: the four minted location traits, the `locationTraitBonus` term keyed trait × content tag, the bearer-kind carve on `condition_template`, and the pool census).

2026-09-12 by Claude Opus (THR-1488 — the content-query section added: encounter `tags`, `encounter_seed.query`, the deprecation of `encounterFamily` with the 41-of-51 measurement, and the game-word rule for family tags).

2026-08-25 (second pass, THR-1251 sweep) by Claude Fable — format-lock paragraph amended to Doctrine v2 (narrator mode, 12-question checklist, spell-style faces, flavor quote retired); Rule 3 amended (soft-power survives, per-scene god-verb card text superseded by the library-generic law); exemplar row repointed to the Swollen Ford; the WS5-complete claim re-verified true (`authoredChoices: [` authored in zero shipped files — earlier contrary finding was a grep false positive on type references). Previous: 2026-08-25 by Claude Fable (THR-1245/THR-1246 — factory tooling recorded: the batch packet roll and the package compiler; hand-written modules/registrations/draws retired for new content). Previous: 2026-08-24 by Claude Fable (game-design-first authoring order recorded as a rejected approach's inverse — director ruling; epic-fantasy variety note; hook roll made non-bypassable in prose). Previous edits: 2026-08-16 by Claude Fable (UI Law 56 — chip-must-be-state-backed recorded as a rejected approach; PATH reserved for engine-actionable openings). Previous edits: 2026-08-02 by Claude Code (THR-969 — outcome-keyed aftermath recorded as the new authoring axis on `AftermathVariant`). Previous edits: 2026-08-01 by Claude Code (THR-899 — the vagueness lexicon recorded as scoped by field class, the two-list era closed). Previous edits: 2026-07-30 (merged edits) by Claude Code + Claude Fable: THR-892 recorded the variance rule — static `factorLines` retired for new content, the derived-line set and its one read path (`computeResolutionModifiers`), the omen/doom/season N/A with its read path cited, and `carryoverFactorLines` as the surviving authored factor surface. THR-883 recorded the format lock — the communication pivot, setting envelopes, cost channels/grants, and the Swollen Ford golden exemplar replacing the Darkhollow Vault. Previous edits: 2026-07-30 by Claude Code (THR-868 / WS6: Meet The First recorded as nudge-native); 2026-07-27 by Claude Code (THR-774 / WS1: nudge model recorded as the current authoring spec). Review trigger: monthly, or when any listed plan moves to `superseded`.
