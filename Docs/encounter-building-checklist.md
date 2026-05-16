# Encounter Building Checklist

> Added 2026-04-03. Source-of-truth checklist for building high-quality encounters that ship with a coherent supporting network of NPCs, factions, locations, items, reputation channels, and follow-on world pressure.

## Purpose

Use this checklist when:
- authoring a new encounter
- rewriting a placeholder encounter
- migrating a legacy encounter into unified actions
- auditing whether an encounter's cast, rewards, locations, and social consequences actually exist as generated world content

A good encounter in this project is not just a technically valid module. It is a pressure knot in a living world that:
- starts from visible momentum already in motion
- lets the player intervene meaningfully
- turns failure into story pressure rather than emptiness
- changes relationships, places, or future options
- connects to other live systems cleanly enough that the world remembers it

Use [encounter-branching-templates.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/encounter-branching-templates.md) whenever a serious encounter needs help diversifying its branch grammar.

## Core Standard

Before writing implementation details, confirm the encounter satisfies all of these:

- The world is already moving before the player arrives.
- The encounter has a clear intervention fantasy.
- Threat changes choices and social texture before it only changes numbers.
- Failure creates obligation, suspicion, rivalry, instability, collateral success, or another live pressure.
- Success solves a real problem and opens future play.
- The aftermath changes at least three other systems or world surfaces.
- The encounter does not depend on fake stand-ins for missing primitives.
- The encounter draws on the inspiration library for tonal and structural variety rather than defaulting to generic fantasy or repeating the last encounter's branch grammar.
- The encounter's size matches its importance; not every encounter is trying to be a signature epic.

## Encounter Packet Template

Build every serious encounter as a packet with these sections.

### 0. Inspiration Anchors
Before you lock the packet, identify what the encounter is drawing from in the Notion inspiration library.

Required foundation references:
- `Tonal Bible`
- `Thematic Pillars`
- `Anti-Patterns`
- `Dilemma Content Library (TB-038)` when the encounter's choices are meant to feel like real dilemmas, reveal divine posture, or expose what kind of interference the player prefers

Required variety references:
- at least one relevant page from `Adventure & Quest Archetypes`, `Event Archetypes`, or `Ordeal Archetypes`
- optionally additional entity/place/culture/archetype pages if they materially change the encounter

Write down:
- which pages/archetypes you used
- what each one contributed
- what anti-patterns you are actively avoiding
- whether the dilemma library changed the choice set or temptation structure

### 0b. Encounter Scale
Choose one:
- `short`
- `medium`
- `long`

Use this before you author the rest of the packet.

Default meaning:
- `short`
  - 1-2 beats
  - light or no branching
  - modest reward / modest consequence
  - common world texture or local pressure
- `medium`
  - 2-3 beats
  - selective branching
  - stronger local or faction consequence
  - meaningful reward or follow-on hook
- `long`
  - 3-5 beats
  - full branching
  - major transformation, large reward, or story-central pressure

Hard rules:
- there should be many more `short` and `medium` encounters than `long` ones
- importance, epicness, reward weight, and story centrality should usually scale together
- if the encounter does not justify `long`, cut it down
- if the encounter is `short`, do not inflate it with fake complexity just because the system can support more

### 1. Pressure Knot
- What is already happening here?
- What omen, agenda, faction pressure, local fear, or scarcity is already in motion?
- Why does the situation matter right now?

### 2. Intervention Fantasy
- What is the player actually trying to do?
- Why is that intervention compelling?
- What makes this feel like a natural action instead of a system command?

### 3. Cast and World Objects
List the required objects explicitly:
- primary NPCs
- supporting NPCs / witnesses / victims / rivals
- involved factions or communities
- required places and sublocations
- required reward objects, burdens, and attachments
- required reputation or social-state channels

### 4. Step Structure
- `short`: usually 1-2 meaningful beats
- `medium`: usually 2-3 meaningful beats
- `long`: usually 3-5 meaningful beats
- step 1 usually reads / positions / approaches
- step 2 usually executes or escalates
- later steps, if present, resolve price, transformation, or aftermath pressure

### 4-step. Per-Step Approach Cards

**Critical:** The runtime presents player choices at EVERY step of an encounter, not just the branch-selection step. If a step has no `authoredChoices`, the player sees generic god-verbs: "Tip the scales in their favor" / "Pour divine power into the encounter" / "Let it play out." This destroys the authored quality of the encounter.

Every player-facing step must have authored approach cards:
- **Branch-selection steps (typically step 0):** One card per branch. Label, intent prose, cost, risk, intervention type.
- **Branch-resolution steps (typically step 1+):** 2-3 approach cards per branch variant, describing how the god executes the chosen intervention. These must be branch-specific — the approach cards inside "Break the Bargain" should be different from those inside "Steady the Courier."
- **Linear steps:** 2-3 approach cards for each step.

A step without authored approach cards is an incomplete step — same severity as a step without prose.

Hard rule:
- do not ship an encounter where any player-facing step falls back to generic approach choices
- the editorial agent will flag generic god-verbs at any step as an automatic REVISE trigger

### 4a. Presentation Kit
Decide how the encounter is experienced, not just how it resolves.

- Does the opening beat want encounter art or should it remain text-only?
- What is the main continuous prose block?
- Which objects should be linked or hoverable instead of broken out into separate cards?
- What belongs in the secondary inspection layer rather than the primary reading flow?

Default UX rule:
- fiction first, system second
- the player should be able to read the encounter top-to-bottom as a scene

Hard rule:
- do not expose raw shell labels, signal ids, placeholder shorthand, or thin technical copy as primary player-facing text
- if the scene only works when read as a dashboard, the presentation kit is underdesigned

### 4b. Branching Memory
- If the encounter presents choices as meaningful interventions, decide what later steps remember.
- At minimum, later prose, choice framing, or aftermath text should be able to change based on prior choices.
- Do not call the encounter branching if the choice only affects hidden math while later prose stays materially the same.
- For high-quality authored encounters, later steps should read as consequences of the path taken, not as generic middle/final scenes.
- For serious authored encounters, this is the standard expectation, not optional polish.

Minimum capability target:
- the encounter system should support up to `5` steps
- each step should support up to `3` player-facing choices
- simpler encounters may use fewer, but encounter authoring should not assume a smaller hard ceiling

Choice-count rule:
- `3` choices is a ceiling, not a requirement
- `2` strong branches are better than `3` where one is decorative, redundant, or obviously weaker
- if the third branch still does not justify itself after revision, cut it

Kit-evaluation sanity check:
- when evaluating the encounter kit itself rather than a single encounter, require at least:
  - one convincing `short` cold-start draft
  - one convincing `medium` cold-start draft
- do not call the kit ready if both only work by forcing symmetry or overbuilding the encounter

### 4b.i Branching Profile
For every serious encounter, declare:
- branch depth: `linear`, `light`, or `full`
- where the branching lives:
  - `scene prose`
  - `choice set`
  - `cast emphasis`
  - `shell/state`
  - `outcome ladder`
  - `aftermath`
  - `follow-on hooks`
- convergence policy:
  - `converges by step 2`
  - `converges by step 3`
  - `stays divergent through aftermath`

Use this to stop every encounter from branching in the same way.

Also declare:
- one primary branching template from [encounter-branching-templates.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/encounter-branching-templates.md)
- one optional secondary template if it materially increases variety

Hard rule:
- for serious encounters, branching should change at least two of:
  - who is central
  - what kind of action is possible
  - what kind of cost becomes likely
  - what the scene feels like socially or morally
  - what the world remembers afterward
- hidden math alone is not enough
- repeating the same choice axis every step with only noun swaps is usually a design failure

Branching by scale:
- `short`
  - may be linear or lightly branching
  - often works best with `2` strong branches instead of forcing a third
  - usually changes tone, immediate outcome, or one aftermath thread
- `medium`
  - should usually branch in at least one structural way
  - may use `2` or `3` branches depending on what the encounter genuinely supports
  - good default: scene prose + outcome or aftermath
- `long`
  - should usually branch in multiple structural ways
  - may justify `3` branches more often, but only when all three pull real weight
  - good default: scene prose + cast/state + aftermath/follow-on hook

Variety check:
- does this branching profile feel too close to the last proving encounter?
- did inspiration archetypes change the branch grammar meaningfully?
- did the chosen branching template actually change the encounter structure?
- are the choices tempting in different ways, or are they just the same axis in new clothes?
- do the choices reveal what kind of god the player is being, or only what tactic they prefer?
- does one branch feel obviously more humane, vivid, concrete, or rewarding than the others?
- does each branch have its own fantasy of interference, its own intelligible cost, and its own future memory?
- if one branch is weaker, has it been rewritten until it feels intentionally desirable rather than merely available?

### 4b.ii Branch Seduction Audit
Before approving the branch set, check whether every path feels like a real doctrine of interference.

Common failure modes:
- `moral asymmetry`
  - one branch feels decent while the others feel merely cruel, petty, or cowardly
- `dramatic asymmetry`
  - one branch clearly promises the most alive scene
- `information asymmetry`
  - one branch has a concrete upside while the others are vague or abstract
- `prose asymmetry`
  - one branch is simply better written than the others
- `aftermath asymmetry`
  - one branch obviously gets the best payoff, strongest reward, or richest future story

Questions to ask:
- why would the player choose this branch on purpose?
- what kind of godhood or interference fantasy does it offer?
- what value, truth, or future does it preserve that the others do not?
- if the labels were removed, would the branch still feel distinct and tempting?

Hard rule:
- a serious encounter should not contain one "real" branch and two tolerated branches
- the goal is not to make all branches equally kind
- the goal is to make each branch feel like an intentional posture the player might genuinely want to own
- if after one or two real revisions the third branch is still weaker, redundant, or symmetry-driven, remove it and keep the sharper two-branch version

### 4c. Prose Standard
Judge scene writing by prose quality, not only by information coverage.

- The world should feel already in motion before the player acts.
- The cast, tension, and stakes should be woven together rather than listed mechanically.
- Atmospheric color is allowed and encouraged when it does not imply unsupported mechanics.
- Runtime truth matters for load-bearing facts; color may remain looser if it only deepens mood.

Good signs:
- the scene has cadence
- the player can feel why this moment matters
- the prose makes the choice feel tempting, dangerous, or powerful

Bad signs:
- repeated summary sentences
- author shorthand exposed directly
- signals or faction pressure written as admin labels
- prose that "checks boxes" but leaves no feeling behind

### 4d. Editorial Review Gate
Serious encounters should pass through a distinct editorial review before implementation.

Preferred process:
- write the packet
- write at least one sample opening paragraph
- write at least one branch-dependent later paragraph
- write at least one aftermath paragraph
- submit the draft to a separate editorial pass
- revise the encounter before implementation

If another agent is available:
- use it as a true editorial reviewer, not as a second packet writer
- ask it to review:
  - prose quality
  - branching variety
  - choice temptation
  - branch seduction / uneven temptation
  - aftermath payoff
  - whether the inspiration anchors actually changed the encounter, or were only cited
  - whether the choices feel like genuine dilemmas instead of obvious best moves
  - whether one branch is doing all the emotional or dramatic work while the others lag behind

If another agent is not available:
- do the same pass explicitly as a separate stage, not silently in the author's head

Hard rule:
- a serious encounter should not move straight from first packet draft to implementation without a distinct editorial review

### 5. Outcome Ladder
Write explicit meanings for:
- `critical_success`
- `success`
- `success_at_cost`
- `failure`
- `critical_failure`

Each outcome should answer:
- What progress was made?
- What was spent?
- What new burden or opening exists now?

### 6. Downstream State Change
- What is different tomorrow because this happened?
- Which locations, factions, NPCs, reputation channels, omens, or follow-up encounters now care?

### 6b. Branching Map
For any encounter with authored choices, write the path memory explicitly:
- step 1 choice -> what changes in step 2 scene prose?
- step 1 choice -> what changes in step 2 choice framing?
- step 1 + step 2 choice -> what changes in step 3 scene prose, aftermath, or history?

The branching map can be light for simple encounters, but it must exist whenever the fiction claims that the Ascendant or actor meaningfully shaped the scene.

### 6c. Aftermath Kit
For serious encounters, design the ending as its own authored phase.

Include:
- aftermath prose that lands what the encounter became
- a curated "what changed" summary
- optional reaction choices if the player should decide which consequence thread stays alive

Aftermath presentation rules:
- do not foreground every minor numeric delta
- prefer actor-centered visible changes
- only surface growth when it crosses a meaningful threshold or changes how the actor should now be read
- marks, conditions, and attachments should use an icon, linked term, or hover detail when possible
- reaction choices must explain what future thread the player is preserving or releasing

Hard rule:
- the player should feel payoff, consequence, and authorship at the end
- if the ending reads like a debug printout, the aftermath kit is not done

Aftermath by scale:
- `short`
  - a compact landing may be enough
  - optional reaction choice only if it materially sharpens consequence
- `medium`
  - should usually have a curated aftermath summary
- `long`
  - should usually have a curated aftermath summary and a meaningful post-summary reaction

### 7. Support Bundle Contract
Classify every supporting dependency before you call the packet implementation-ready.

Use these delivery modes:
- `pre-seeded`: the object should already exist in the target area through ordinary generation
- `lazy-materialize-on-trigger`: the object can be created when the encounter fires, but only if it is authored as a real persistent world object rather than a hidden shortcut
- `blocked-primitive`: the object depends on a missing shell or primitive and must not be approximated badly

Reuse rule:
- `lazy-materialize-on-trigger` is always reuse-first
- if a suitable world object already exists in the target area, the encounter should bind to that object instead of spawning a duplicate
- the encounter must not create a second gatehouse, guard captain, shrine keeper, or similar support object just because the packet asked for one
- if uniqueness matters, the packet must say how the encounter selects the existing object or falls back only when none exists

For every `lazy-materialize-on-trigger` object, answer all of these:
- where does it attach?
- who owns or belongs to it?
- what persists after the encounter?
- what future encounters or systems can reference it?
- how does it check for an already suitable existing object before creating a new one?

If you cannot answer those questions cleanly, the object is not ready for lazy materialization.

### 7b. Unified Registration And Tick-Lifecycle Audit
For any encounter described as migrated to unified actions, verify the unified runtime can actually carry it from one beat to the next.

Hard rule:
- a migrated encounter is not truly migrated if it can be spawned only through `getUnifiedTemplateById(...)` fallback lookup while the tick-time progression loop cannot find it in the canonical unified registry
- if the encounter can open step 1 but cannot advance to step 2 under the real orchestrator tick loop, treat that as a migration failure, not a minor bug

Minimum audit:
- confirm the encounter template is present in the canonical unified template registry, not only reachable through a fallback lookup path
- confirm the unified progression phase can resolve the template by ID at tick time
- confirm a direct unified spawn can advance from step 1 to step 2 under the real orchestrator tick loop
- confirm the next-step notification is emitted after the authored duration elapses

Why this matters:
- debug spawn fallback can hide missing registry coverage
- the encounter may look "migrated" because step 1 opens correctly while the action silently stalls forever once the timer completes
- this is an expensive failure mode because it presents like a content/support bug while the real cause is registry/runtime divergence

## Support-Network Audit

An encounter is not done until its support network is either verified live, authored in this pass, or explicitly blocked by a missing primitive.

Use this audit across every encounter build.

### NPC Cast Audit
- Do the required roles exist in current content taxonomies?
- Can those roles seed or emerge in the relevant area?
- If the encounter assumes a healer, guard captain, rival courier, broker, or witness, is there a credible generation path for each?
- If the encounter needs a notable or recurring actor, is there a believable path for promotion, emergence, or recurrence?

### Faction and Community Audit
- Do the necessary factions exist in content?
- Can they plausibly be present in the target geography?
- Is there an actual reason they care about the encounter stakes?
- Are the intended faction consequences backed by live reputation or control systems?

### Location and Geography Audit
- Can the encounter occur in the intended biome, culture, location subtype, and sublocation?
- Are the required places generated in the relevant areas?
- If a quarantine gate, dock quarter, shrine archive, or mine entrance matters, does the world actually generate or imply that place there?

### Reward and Burden Audit
- Are success rewards backed by real reward pools or content objects?
- Are failure rewards clearly salvage, debt, stain, curse, harm, or dangerous knowledge?
- Are the conditions, blessings, items, allies, and curses real game objects instead of narrative-only placeholders?

### Reputation and Social-State Audit
- Which real channel carries the social consequence?
- Use actual systems such as faction reputation, reputation tallies, `reputationScore`, suspicion, obligation, rivalry, or witness exposure.
- Do not invent new labels if an existing live channel should carry the meaning.

### Omen and Run-Identity Audit
- Which doom/archetype/omen frame should bias this encounter?
- Would the same encounter feel different under different run identities?
- Is that difference expressed through actual content, pressure pattern, or reactions?

### Follow-On Network Audit
- Name at least two believable follow-up pressures or opportunities.
- Identify who remembers what happened.
- Identify what future encounter families, agenda beats, or faction reactions this should seed.

## Support Matrix

Write a support matrix for the encounter before implementation sign-off.

| Network element | Required object(s) | Source / generation path | Generated in target area? | Verified by | Status |
|---|---|---|---|---|---|
| NPC cast | Example: healer, gate captain, rival courier | NPC roles + seeding/emergence path | yes / no / partial | audit, test, manual trace | `live` / `author-now` / `blocked-primitive` |
| Factions | Example: city watch, healer guild, smugglers | faction content + control/presence logic | yes / no / partial | audit, test, manual trace | `live` / `author-now` / `blocked-primitive` |
| Places | Example: quarantine gate, market district | location subtype + sublocation generation | yes / no / partial | audit, test, manual trace | `live` / `author-now` / `blocked-primitive` |
| Rewards / burdens | Example: medicine cache, suspicion, debt | reward pools, conditions, attachments | yes / no / partial | audit, test, manual trace | `live` / `author-now` / `blocked-primitive` |
| Reputation / social state | Example: district trust, watch suspicion | live reputation systems | yes / no / partial | audit, test, manual trace | `live` / `author-now` / `blocked-primitive` |

Status meanings:
- `live`: the supporting object exists and generation/wiring is already real
- `author-now`: the encounter is good, but the support content must be authored or wired in this same pass
- `blocked-primitive`: the encounter depends on a missing primitive and must not be approximated badly

## Support Bundle Contract

In addition to the support matrix, write a support bundle contract for every serious encounter.

| Support object | Delivery mode | Where it comes from | Persistence contract | Future references | Verified by | Status |
|---|---|---|---|---|---|---|
| Example: gatehouse | `pre-seeded` / `lazy-materialize-on-trigger` / `blocked-primitive` | sublocation generation / encounter bundle / primitive gap | `must-persist` / `scene-only` / `blocked-primitive` | who or what can reference it later | audit, test, trace | `live` / `author-now` / `blocked-primitive` |
| Example: checkpoint captain | `pre-seeded` / `lazy-materialize-on-trigger` / `blocked-primitive` | NPC seeding / encounter bundle / primitive gap | `must-persist` / `scene-only` / `blocked-primitive` | factions, future encounters, reputation fallout | audit, test, trace | `live` / `author-now` / `blocked-primitive` |

Working rule:
- `pre-seeded` is preferred for ordinary world support that should broadly exist in the area
- `lazy-materialize-on-trigger` is acceptable for scene-specific cast or props, but only if the resulting object is real enough for the world to remember
- `scene-only` should be rare and should usually apply only to transient crowd pressure, not meaningful cast, rewards, or social consequences
- if a support object should create future narrative coherence, its persistence contract is almost always `must-persist`
- duplicate support objects are a cohesion bug, not a harmless shortcut; lazy materialization must be idempotent against pre-existing world support

## Primitive-Gap Rule

If the encounter wants one of these missing primitive families, stop and mark it honestly:
- test shaping
- flip / reveal state
- task / progress carriers
- prevention / interception / recovery
- authored choice bundles or outcome forks

The following branching capabilities are now **live runtime primitives** (as of 2026-04-04):
- **Remembered choice paths that later prose reads** — `ActionStepBranch` with `branchOnStep` + `variants` keyed by `choiceId`. Resolved via `resolveStepDefinition()` in `unifiedActionLifecycle.ts`.
  - **Subtype scope (THR-191):** `ActionStepBranch` / `BranchAwareAftermathConfig` *step-level* branching is for **branching encounters only** (`src/data/encounters/`). Linear-template encounters use aftermath reactions + optional `BranchAwareAftermathConfig.variants`; they must not carry step-level `ActionStepBranch`.
- **Step-specific authored choice variants depending on prior path memory** — same mechanism. Step 2 can be an entirely different `ActionStep` (different prose, reach, difficulty, outcomes) depending on the choice at step 1.
- **Branch-aware aftermath** — `BranchAwareAftermathConfig` on `UnifiedActionTemplate`. Different overview, changes, and reaction choices per branch path. Resolved at aftermath assembly time.

The following consequence primitives are also now **live** (as of 2026-04-04):
- **Follow-on encounter seeding** — `encounter_seed` effect kind on `EncounterAftermathReactionEffect`. Seeds accumulate in `pendingEncounterSeeds` on GameState, evaluated each tick by `evaluateEncounterSeeds()` in `encounterSeeding.ts`. Seeds with `templateId` spawn unified actions directly; seeds with `encounterFamily` emit narrative events (v1).
- **Delayed-reveal hidden marks** — `hidden_mark` effect kind. Marks stored in `hiddenMarks` on GameState. Query with `getAgentHiddenMarks()`, `checkMarkReveals(state, agentId, encounterFamily)`, `hasHiddenMark()` in `hiddenMarks.ts`. Future investigation encounters use `checkMarkReveals` to surface marks.
- **Structured intelligence attachments** — `intelligence` effect kind. Records stored in `intelligenceRecords` on GameState. Query with `getAgentIntelligence()`, `hasIntelligenceAbout()`, `getRegionIntelligence()` in `intelligence.ts`.

These are **no longer primitive gaps**. Encounter authors should use them directly instead of marking branching, consequence seeding, hidden marks, or intelligence as blocked.

Still treat these as primitive gaps if the runtime cannot yet support them cleanly:
- branch-aware scene history / afterimages (the prose pipeline does not yet interpolate choice-history into afterimage text — author explicit variants instead)

When that happens:
1. port only what maps cleanly to existing runtime support
2. record the gap in the encounter's support matrix or implementation notes
3. link the gap to [2026-04-03-procedural-content-component-library-audit.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-03-procedural-content-component-library-audit.md)
4. do not flatten the missing behavior into a generic bonus or penalty just to claim completion

## Backlog Escalation Rule

Every `blocked-primitive` discovered during encounter work must produce a same-pass Linear issue in the **Threadbare** team. (`.planning/BACKLOG.md` retired 2026-04-13 — Linear is the single source of truth.)

Default routing:

- If the gap is a content primitive or shell, file it in the **Content Architecture** project as a child of the open `Procedural Content Component Library` work.
- Cite the encounter packet or template ID that exposed the gap.
- Name the missing primitive family explicitly.

Open a standalone Linear issue (still under Content Architecture) instead of an inline note when:

- the same primitive is hit by multiple encounter packets
- the primitive is clearly large enough to deserve its own implementation slice
- the primitive is blocking more than one active content stream

Minimum issue payload:

- primitive name / shell name
- source encounter(s)
- why the encounter quality is blocked without it
- whether it is a strict dependency for active content work
- label `Deferral` if the gap was deferred from active encounter work

## Definition Of Done

Do not call the encounter done until all of these are true:
- The inspiration anchors are declared.
- The encounter scale is declared.
- The encounter packet is complete.
- The presentation kit is complete.
- The branching map exists whenever the encounter uses authored choices.
- The branching profile is declared.
- The branching template choice is declared for serious encounters.
- The prose meets the scene-quality bar instead of only communicating state.
- Every player-facing step has authored approach cards — no step falls back to generic god-verbs.
- A distinct editorial review has happened for serious encounters.
- The outcome ladder is authored with real forward pressure.
- The aftermath kit is complete for serious encounters.
- The support matrix exists and every row is `live`, `author-now`, or `blocked-primitive`.
- The support bundle contract exists and every nontrivial dependency is classified as `pre-seeded`, `lazy-materialize-on-trigger`, or `blocked-primitive`.
- Every `author-now` row has been handled in the same pass.
- Every `lazy-materialize-on-trigger` object has a persistence and follow-on contract.
- Every `lazy-materialize-on-trigger` object has a reuse/idempotence rule so it binds to existing world support before creating a new copy.
- Every `blocked-primitive` row is explicitly called out rather than faked.
- Every `blocked-primitive` row has a named backlog home.
- At least one verification step has been run for the encounter network.
- If the encounter is unified, direct unified spawn has been verified to advance across at least one step boundary under the real tick loop.
- The aftermath clearly connects to factions, NPCs, places, reputation, omens, or future encounter hooks.
- The aftermath presents consequence in a curated, actor-centered way instead of a raw list of deltas.
- Any post-summary reaction choices say what they imply in the world.
- If the encounter is branching, later steps and/or history text actually reflect prior choices instead of resetting to generic prose.
- The encounter clearly avoids the anti-patterns most relevant to its family.
- The inspiration anchors materially changed the encounter's structure, branch grammar, tone, or aftermath.
- The choice set has real dilemma energy when the encounter claims to be morally or politically charged.

## Verification Checklist

Minimum verification for a serious encounter pass:
- Review the encounter against scale discipline:
  - is it the right size for its importance and reward/story weight?
  - is it trying to do too much for a common encounter?
  - is it too thin for a supposed signature encounter?
- Check the encounter against the inspiration library:
  - `Tonal Bible`
  - `Thematic Pillars`
  - `Anti-Patterns`
  - at least one relevant action/archetype page
- Check the encounter against [2026-04-02-encounter-redesign-guidelines.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-02-encounter-redesign-guidelines.md).
- For unified encounters, run at least one real progression verification that proves:
  - step 1 opens
  - time advances after commit/disregard
  - step 2 reopens after its authored duration
  - the encounter is being resolved by the canonical unified registry, not only by debug fallback lookup
- Check migration honesty against [2026-04-03-encounter-migration-gap-ledger.md](/C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Docs/plans/2026-04-03-encounter-migration-gap-ledger.md).
- Verify supporting object generation or presence with tests, traces, audits, or direct content inspection.
- Verify that remembered choices can actually be resolved into later-step prose/history when the encounter claims to branch.
- If new supporting content was required, add or update tests for it.
- Verify that every `pre-seeded` object actually has a generation path in the target area.
- Verify that every `lazy-materialize-on-trigger` object has an authored persistence/follow-on contract instead of disappearing without consequence.
- Verify that every `lazy-materialize-on-trigger` object reuses an existing suitable object when one is already present, instead of duplicating world support.
- If a primitive gap was discovered, document it instead of hiding it.
- If a primitive gap was discovered, open a Linear issue in the Threadbare team in the same pass (see Backlog Escalation Rule above).
- Review the encounter as a reading experience, not only as a systems test:
  - does the opening read like a scene?
  - do the choices imply clear manipulations or interventions?
  - does the aftermath feel rewarding and legible without dumping tiny technical changes?
- Review the encounter as a branching design:
  - does the branch profile fit the encounter type?
  - does the branching template fit the encounter type?
  - do later steps materially differ from earlier choices?
  - is the branch usage varied enough that the encounter does not feel like the same three buttons repeated?
- Review the encounter against inspiration drift:
  - does it feel specific rather than generic fantasy wallpaper?
  - does it inherit moral complexity instead of clean binaries?
  - is it avoiding the anti-patterns most relevant to its premise?
- Review the encounter against the dilemma library:
  - do the choices create genuine tension?
  - are multiple options defensible?
  - does the choice reveal divine posture or only tactical preference?
- If a second agent is available, use it for the editorial review and capture the important findings.
- Update `Docs/changelog.md` when this checklist itself changes.

## Working Rule

A technically valid encounter module is not enough.

The encounter should ship with its social cast, physical setting, reward/burden objects, reputation consequences, and future narrative hooks intact enough that the game can actually generate the surrounding web of meaning. If the web is missing, the encounter is still underbuilt.
