# Systemic Wiring Guide — What the Engine Can Do, and Why It Matters for What You Write

> **lint_plan_doc:** exempt — standing reference for content authors, not a dated plan doc. It has no Engine/Content/UI pillars, no constants table, and no coordination block because it proposes no work; it describes capabilities that already ship. See THR-686.

**Date:** 2026-04-16
**Purpose:** This document exists because LLMs are good at writing prose but bad at knowing what a bespoke game engine can do with that prose. The result is hardcoded fiction masquerading as game content. This guide fixes that by explaining the engine's dynamic capabilities *before* you start writing — because knowing what the system can do should change what you decide to write.

**Audience:** Any agent authoring encounters, attachments, or prose content. Read this before the encounter-pipeline, attachment-pipeline, or prose-content-systems skills. This is not optional.

**Core principle:** If the prose can't change based on who's experiencing it, what happened before, or what happens after — you've written a book page, not game content. We're making a game.

## Post-Migration Format Baseline (THR-109)

`EncounterTemplate` is retired from authoring flow. Encounter content now ships through `UnifiedActionTemplate` only (including faction/guild templates and branching packets). If a document, prompt, or skill asks for `EncounterTemplate`, treat it as stale and update it.

Phase 1-5 migration audit callouts now codified in this guide:
- Encounter seeds (`encounter_seed`) are the default follow-on mechanism.
- Hidden marks (`hidden_mark`) are the default discoverable-secret mechanism.
- Intelligence grants (`intelligence`) are consumed by scoring, prose enrichment, and resolution-match traces.
- Reputation persistence should use both score deltas and tallies (`reputation_tally`) where long-memory matters.

---

## Part 1: Why This Matters — The Book vs. Game Distinction

A hardcoded encounter reads the same every time. A festival always has the same description, the same outcome text, the same consequences. If you've read it once, you've read it forever.

A systemically wired encounter reads differently depending on: who the agent is, what they've done before, who they know, what the player-god chose, and what the world looks like right now. It plants seeds that grow into future encounters. It creates artifacts and relationships that other systems can discover. It changes how the world talks about the agent.

**The encounter-pipeline skill teaches you to write great prose. This guide teaches you what to write great prose *about* — because the engine gives you capabilities that should shape your creative decisions from the very first sentence.**

Here's the difference:

**Hardcoded:**
> "The merchant thanks you for your help and gives you a silver brooch."

**Systemically alive:**
> "{name} watches the merchant's hands tremble as {they} pin{s} the brooch to {their} cloak. {?has_faction}The {faction} will hear of this — whether as charity or as leverage depends on who tells it first.{/has_faction}{?no_faction}No guild claims {them}, but that won't last. Acts of mercy in a hungry market draw eyes.{/no_faction}"

The second version uses enrichment placeholders, conditional blocks, and implies aftermath seeding and reputation flow. The prose is better *because* the author knew what the engine could do.

---

## Part 2: The Capabilities — What You Can Do

> The list has grown past the original seven; it is numbered, not counted, so a new capability appends rather than renumbering. Capabilities 14 (nudge hand) and 15 (trait hooks) are the newest and are **mandatory** checklist steps for any new encounter, not optional flourishes.

Every encounter has access to seven systemic capabilities. These aren't optional extras — they're the tools that make content alive. When you sit down to write, you should be asking: "which of these seven am I using, and why am I not using the others?"

### Capability 1: Enrichment Placeholders — Prose That Knows Who's Reading

Every `narrative` field in steps and outcomes supports dynamic text substitution. The engine builds a `NarrativeContext` from the graph at generation time and resolves placeholders into real data.

**Available placeholders:**

| Placeholder | Resolves To | Example |
|---|---|---|
| `{name}` | Agent name | "Kael Thornweaver" |
| `{they}/{them}/{their}/{s}` | Gendered pronouns | "they/them/their/s" |
| `{They}/{Them}/{Their}` | Capitalized pronouns | "They watch..." |
| `{location}` | Current location name | "Thornhaven Market" |
| `{culture}` | Agent's culture | "Coastfolk" |
| `{faction}` | Agent's faction name | "The Weavers' Circle" |
| `{group}` | Caller-bound subject group (THR-522) — an Ascendant introduction beat's Director-bound culture/faction | "Children of the Shadow-Kept Timberlands" |
| `{title}` | First reputation trait | "the Resolute" |
| `{artifact:weapon}` | Notable weapon (tier ≥ storied) | "Ashenmourne" |
| `{artifact:any}` | Any notable artifact | "the Covenant Seal" |
| `{ally:strongest}` | Strongest ally (trust ≥ 0.5) | "Serafina" |
| `{rival:strongest}` | Strongest rival | "Voss Ironfold" |
| `{omen_adj}` | Active omen flavor | "whispering" |
| `{omen_verb}` | Active omen action | "unravels" |
| `{omen_noun}` | Active omen object | "the membrane" |
| `{omen_atmosphere}` | Active omen mood | "the air thickens" |
| `{doom_verb}` | Doom archetype vocabulary — action verb | "fractures" (breach) / "gathers" (convergence) |
| `{doom_adj}` | Doom archetype vocabulary — adjective | "fractured" (breach) / "inexorable" (convergence) |
| `{doom_atmosphere}` | Doom archetype vocabulary — atmospheric phrase | "something presses through" (breach) |
| `{target}` | Scene target — the entity the encounter is *with* (THR-694). Falls back to "the other party" | "Serafina" |
| `{target:they\|them\|their\|s}` (+ capitalized) | Target's pronouns; neutral fallback | "she/her/her/s" |
| `{target:faction}` | Target's faction name; falls back to "their people" | "The Iron Wardens" |
| `{cast:<key>}` | Scene cast — a `supportBundle` member by spec key (THR-696). Renders the *bound* entity's live name | "Captain Merrow" |
| `{econ_adj}` | Economic mood adjective (THR-725) — boom/bust coloration of the settlement the scene plays out in. Strips silently in the neutral prosperity band | "grain-heavy" (boom) / "shuttered" (bust) |
| `{econ_noun}` | Economic mood noun phrase | "wagons queued past the gate" / "shuttered stalls" |
| `{econ_atmosphere}` | Economic mood atmospheric phrase | "nobody is counting carefully" / "people watch each other's hands" |

**Scene cast (THR-696):** An encounter's `supportBundle` binds real world objects reuse-first — the "gate captain" is usually an NPC who already stands at that gate. `{cast:<key>}` names whoever the key actually bound to, so prose and world agree even when reuse picked someone the author never met. **A key the template declares always resolves**: bound → the graph node's live name; declared-but-unbound → the spec's own `spawnName` / `fallbackName`. That is the whole point — you never have to guard a reference to your own cast, and you must not invent a name for a role the bundle already owns (the branching tier's hardcoded `Maren`/`Dalla`/`Torve` literals are exactly the anti-pattern this replaces).

Guard only when a key is *conditionally* declared, using `{?has_cast:<key>}` / `{?no_cast:<key>}`. A key the bundle does not declare is an authoring error: the token strips and a dev-mode `console.warn` names it. Populated when the caller threads `opts.supportBundle` + `opts.supportBindings` into `gatherNarrativeContext` — the encounter stage model and action-resolution paths do; every other path leaves the block absent and strips silently. Capped at `CAST_CONTEXT_MAX_MEMBERS` (6). Worked example: `cg.quest.gate_duty` in `src/data/civic-guard-encounter-content.ts`.

**Scene target (THR-694):** On the encounter path, prose can name the entity the action is *with* — the resolved `action.targetId` (another agent or a location) — instead of "the other party." The `{target:*}` family is populated only when the caller passes `opts.targetId` to `gatherNarrativeContext` (the encounter stage model and action-resolution paths do); self-targeted actions, deleted targets, and all non-encounter prose leave it absent, so every token falls back and absence reads as absence. **Never write a `{target}` that assumes a referent** — a scene that only makes sense with a named other party must guard it with `{?has_target}`. Location-kind targets resolve `{target}` (the place name) only; their pronoun/faction/relation tokens use fallbacks.

**How to verify:** Run the DebugPanel Trace tab filtered on `narrative_generation`. Every step and outcome narrative you see in game should render with placeholders resolved — not as literal `{name}` / `{?has_faction}` text. The regression locks live in `src/engine/__tests__/unifiedAdapterProseEnrichment.test.ts`.

**Conditional blocks** — prose that only appears if a condition is true:

```
{?has_artifact}The weight of {artifact:any} shifts in {their} pack — 
a reminder that power answered once.{/has_artifact}

{?no_faction}{name} walks alone. No banner, no guild mark, 
no one to answer to but the road.{/no_faction}

{?has_ally}Somewhere behind them, {ally:strongest} would hear about this.
That thought alone steadies {their} hand.{/has_ally}
```

Available conditionals: `has_artifact`, `has_ally`, `has_rival`, `has_faction`, `has_title`. Each has an inverse: `no_artifact`, `no_ally`, etc. **Scene target (THR-694):** `has_target` / `no_target` (presence pair) and `target_is_ally` / `target_is_rival` / `target_is_stranger` (the actor→target relation, classified via the ±0.35 sentiment thresholds). A location-kind target is present (`has_target` true) but carries no relation, so all three `target_is_*` conditionals resolve false for it.

**Why this changes what you write:** When you know prose can branch on whether the agent has allies or artifacts, you write scenes that *use* those relationships. A betrayal scene where the agent has no allies reads differently from one where their strongest ally might hear about it. A discovery scene where the agent carries a storied artifact reads differently from one where they have nothing. These aren't cosmetic — they change the emotional texture of the moment. **Write scenes where the conditionals matter, not scenes where they're decoration.**

**Routine tier (ROUTINE_TEMPLATES) also supports enrichment:** As of THR-86, `ROUTINE_TEMPLATES` in `src/data/narrative-content.ts` uses `ShapedTemplate[]` — each template has a `shape` property (`svo | aftermath | inverted | compound | fragment`) and a `template` string that supports the same enrichment placeholders (`{name}`, `{location}`, `{?has_faction}...{/has_faction}`, etc.). When `generateRoutineProse` is called with a `graph` + `actorId`, it runs `enrichProse()` to resolve them; without graph, `applyFallbacks()` provides safe substitutions. Use `{name}` (not `{actor}`) in all new routine templates. Aim for all 5 shapes across the pool for an event type to get variety rotation.

**Hex-level prose uses a separate composer — not `enrichProse`:** As of THR-415, the `hex.survey` divine action emits a `survey_completed` TickEvent whose message is built by `composeSurveyPeopleProse` in `src/engine/surveyProseComposer.ts`. This is a hex-scoped prose composer (averaging location unrest, listing controlling factions) that operates on the graph directly and does not go through `proseEnrichment.ts`. If you add other hex-scoped revelation events (e.g. a HexChronicle people-layer), write a new composer in the same pattern rather than routing through `enrichProse`.

**Economic In-Prose Keywords (THR-615):** any prose rendered through `renderProseWithIPK` (`src/components/ProseKeyword.tsx`) now recognises four economic keywords in `**bold**` markers — `**Famine**`, `**Glut**`, `**Monopoly**`, `**Embargo**` — rendering them as gold, tooltip'd terms (tooltips in `ECONOMY_KEYWORD_TOOLTIPS`, `src/data/resource-classes.ts`) alongside the existing sphere keywords. Use them in location/economy prose to give scarcity and surplus mechanical weight. Separately, the mortal-economy phase auto-narrates staple stock crossings into the Great Chronicle via the `resource_scarcity` / `resource_glut` chronicle triggers (`economicChronicle.ts`) — these fire from the engine, not per-encounter; you don't invoke them, but be aware the world already speaks about famines and gluts, so don't hardcode duplicate "the harvest failed" lines in encounter prose.

**Family default support bundles (THR-698):** every linear template in the `tavern`, `social`, and ten guild families (`tg`, `ac`, `bf`, `cg`, `hod`, `uk`, `rb`, `mct`, `lk`, `ts`) automatically carries a small default cast even when it declares no `supportBundle` — merged at registry assembly from `DEFAULT_FAMILY_SUPPORT_BUNDLES` (`src/data/default-support-bundles.ts`, cap `DEFAULT_BUNDLE_MAX_SPECS` = 3). What authors get for free: prose in those families can reference the family's cast keys (e.g. tavern → `{cast:keeper}` / `{cast:performer}` / `{cast:regular}`; cg → `{cast:officer}` / `{cast:watch_guard}` — see the data file for every family's keys) and the scene binds the world's *existing* NPC in that role when one is present at the anchor. Defaults are **bind-only**: every spec is `pre-seeded` with `reuseNpcRoles`, so an unmatched key stays unresolved and falls back to the spec's `spawnName` in prose — they never spawn anyone (zero world population). **To override:** declare a `supportBundle` on the template — a template-declared bundle wins outright (no per-key merge). Borderland has no default cast by design (wilderness has no settlement roster to bind).

**Setting-class default support bundles — the `encounter.*` family (THR-1044):** the family table above keys on the id prefix, which works when the prefix names *a place with people in it* (`cg.` is the city guard). `encounter.` names nothing: it is the whole nudge-era id space, and before this change **none of its 191 templates carried a cast** — one flat family default would have put a taproom keeper on a battlefield. So the `encounter.*` family resolves its default by **setting class** instead, from `DEFAULT_SETTING_SUPPORT_BUNDLES` (same file, same bind-only rule, same 3-spec cap). What authors get for free: declare a THR-884 envelope (`settings: ['wayside']`) and your template automatically carries that class's cast keys — `wayside` → `{cast:keeper}` / `{cast:traveler}` / `{cast:outrider}`; `urban` → `{cast:clerk}` / `{cast:trader}` / `{cast:watch}`; `sacred` → `{cast:celebrant}` / `{cast:attendant}` / `{cast:supplicant}`; and so on for all eight classes (see the data file). Multi-class envelopes resolve in canonical `SETTING_CLASSES` order, so `['rural','urban']` gets the rural cast.

Two things to know before you rely on it. **Reuse roles are drawn from what worldgen actually seeds at that class's subtypes** (`LOCATION_ROLE_ROSTERS`), not from the full 56-role vocabulary — so a `wayside` scene binds the hermit / wanderer / pilgrim / ranger / hunter the wilderness roster really places, and classes with no roster of their own (`arcane`, `ruin`, `battlefield`) bind only when such an NPC happens to be nearby. **And a template whose `locationSubtypes` span more than one setting class gets no default at all** — 131 of the pre-envelope `encounter.*` templates are drawable at two or more classes, and stamping one of them with a single class's cast would be the placeless-prose failure the envelope vocabulary exists to end. If you want a cast on such a template, either narrow it to one class with `settings`, or declare an explicit `supportBundle`. Coverage today: 45 of 191.

---

### Capability 2: Encounter Seeding — Consequences That Grow Into Future Stories

Aftermath reactions can plant `encounter_seed` effects that spawn new encounters for the agent after a delay. This is how one encounter creates a ripple that becomes a future story.

```typescript
{
  kind: 'encounter_seed',
  templateId: 'broker.quest.shrine_confrontation',  // Specific encounter to spawn
  // OR:
  encounterFamily: 'broker.quest',                   // Family prefix — the engine draws + spawns a member (THR-697)
  targetAgentId: '$actor',       // Who gets the follow-up (defaults to current agent)
  delayTicks: 15,                // When it becomes eligible
  priority: 1.2,                 // Higher = spawns sooner when eligible
  inheritContext: true,          // (opt-in) carry this action's target + cast into the follow-up (THR-697)
  seedLabel: "The shrine map burns in their pocket — someone will come asking"
}
```

**Two modes (both now spawn a real encounter — THR-697 Slice D activated the family stub):**
- **`templateId`** — spawns that exact template as a unified action for the target agent. The reliable path for authored chains.
- **`encounterFamily`** — a family *prefix*, matched raw (`broker.quest` matches `broker.quest.*`). **⚠️ This is NOT the same vocabulary as `revealFamilies`.** They used to share the raw-prefix convention; since THR-844 `revealFamilies` resolves through `REVEAL_FAMILY_ALIASES` and `encounterFamily` does not. A thematic name that works as a reveal family (`investigation`, `oracle`) will silently match **zero** templates here and fall through to the generic "the consequences are stirring…" event. Write a real id prefix for seeding. At eligibility the engine collects the registered templates in that family that are individual-performable and location-eligible for the target agent (scan capped at `FAMILY_SEED_MAX_CANDIDATES` = 12), makes one seeded `rng()` draw, and spawns the winner. If the family resolves to **zero** eligible templates, it falls back to the v1 "the consequences are stirring…" narrative event and the seed is consumed. Emits `encounter_seed_family_matched` on a spawn.

**Scene-context inheritance (`inheritContext: true`, opt-in, THR-697 Slice D):** by default a seeded follow-up self-targets — it forgets who the original story was about. Set `inheritContext: true` and the planting site snapshots the source action's `targetId` and `supportBindings` onto the seed; at spawn the engine re-validates both against the live graph (a dead target falls back to self-target; dead-node bindings are dropped) and threads the survivors into the follow-up's normal `supportBindings` slot. The upshot: **the same people return** — `{target:*}`/`{cast:*}` prose placeholders and `$target`/`$cast:` aftermath sentinels resolve to the original scene in the follow-up. Emits `seed_context_inherited`.

**Seeds are fail-soft:** if the template doesn't exist, the family has no eligible member, or the agent is occupied, the seed either keeps for the next tick (occupied) or emits a "withered" narrative event and is removed. No crashes, no stuck states.

**Why this changes what you write:** When you know an encounter can plant a seed that blooms 15 ticks later, you write *differently*. You write the betrayal scene knowing the revelation scene is coming. You write the merchant's favor knowing the debt-collection encounter is planted. You write the hidden truth knowing the investigation encounter will surface it. **The aftermath isn't the end of the story — it's the planting of the next one.** If your encounter has no seeds, ask why. Some encounters are simple moments (the healer mercy encounter). But if your encounter has consequences that should echo forward, seeds are how you make that happen.

**Example from Flawed Steel:** The "Temper the Narrative" path plants a hidden mark (deception, severity 0.5) with `revealFamilies: ['investigation', 'mercenary', 'crafting']`. It also seeds a `crafting.quest` follow-up at 25 ticks delay. The deception isn't just prose — it's a ticking clock in the graph that other encounter types can discover.

---

### Capability 3: Hidden Marks — Secrets That Can Be Discovered

Hidden marks track secrets, debts, betrayals, and knowledge that persist invisibly until another encounter type reveals them.

```typescript
{
  kind: 'hidden_mark',
  category: 'betrayal',        // betrayal | debt | secret_knowledge | contamination | etc.
  severity: 0.6,               // 0-1, affects reveal likelihood
  label: "Betrayed Brinewall alliance for shrine intelligence",
  revealFamilies?: ['investigation', 'brinewall']  // Which encounter families can discover this
}
```

> **🟢 `revealFamilies` names are now a declared vocabulary, not raw id prefixes (THR-844, 2026-07-29).** A family resolves through `REVEAL_FAMILY_ALIASES` in `src/data/reveal-family-aliases.ts` to one or more template-id prefixes, and matches a drawn encounter if **any** of them prefixes its id. A family that is *not* in the table resolves to itself, so the original raw-prefix behaviour is intact for every name that already worked (`social`, `tavern`, `borderland`, `faction`, `hex.`, the `xx.quest` / `xx.elite` faction-rank families).
>
> This example is live: `investigation` and `brinewall` are both aliased. Before THR-844 they were not — matching was raw `templateId.startsWith(family)`, and measured against the live 672-template pool **67 of the 115 distinct family literals matched zero templates**, with 42 of 136 authored entries naming *only* dead ones. Those marks were placed, decayed, and could never be surfaced by anything. The names were overwhelmingly thematic (`oracle`, `guild`, `duel`, `shrine`, `spy`), which is the tell — authors were writing a tag vocabulary against an engine that wanted prefixes.
>
> **Writing one:** prefer an existing alias. If you need a new family name, add it to `REVEAL_FAMILY_ALIASES` with the prefixes it means — `src/engine/__tests__/revealFamilyLiveness.test.ts` fails the build if any authored family resolves to zero live templates, if any prefix in the table matches nothing, or if any mark entry ends up with no live family at all. Keep aliases *specific*: a family that resolves to a quarter of the pool reveals on almost anything, which is as useless as revealing on nothing (the guard caps this too).

**Why this changes what you write:** Marks create dramatic irony — the player knows the secret exists, but the world doesn't yet. When you write a deception scene, the mark means the deception has *weight*. It's not just flavor text that says "they got away with it." It's a graph entity that future encounters in the `investigation` or `brinewall` families can detect and trigger consequences from. **Write scenes where the secret matters enough to track.** If a character lies, cheats, or hides something — and it would change the world if discovered — that's a hidden mark.

**🟢 Reveal loop live (THR-112, 2026-04-17):** Hidden marks now actively shape gameplay in three ways:
1. **Scoring boost** — encounters matching a mark's `revealFamilies` (via `familyMatchesTemplate`, alias-aware since THR-844) score `+MARK_REVEAL_SCORING_BONUS * severity` (default +0.3), making agents drift toward encounters that could surface their secrets.
2. **Probabilistic consumption** — when a matching encounter resolves in GameView, `consumeMatchingMarks()` rolls `severity * 0.9` to consume the mark, emit `hidden_mark_revealed`, and append a `ripple_consequence` chronicle event.
3. **Decay** — Phase 6.7 (`phaseHiddenMarkDecay`) decays severity 2%/tick after a 20-tick grace period; marks below severity 0.05 are dropped with a `hidden_mark_revealed` trace (`revealedBy: 'decay:severity_floor'`). Unrevealed marks do not persist forever.

**🟢 Guaranteed failure artifact (THR-571 C1, 2026-07-03):** Every resolved `failure` / `critical_failure` action is now guaranteed to leave ≥1 story artifact. A post-pass (`guaranteeFailureStoryArtifact`, run in the orchestrator's resolved-action cleanup) first *detects* an already-present artifact — a step complication, an aftermath-planted hidden mark, or a `future_hook` encounter seed. **A bare reputation delta does NOT count** (see the encounter checklist: "if nothing persists except a reputation number, the encounter is ephemeral"). When a failure would otherwise leave nothing, the post-pass plants a scale-appropriate fallback hidden mark (severity by scale: personal 0.3 → cosmic 0.7; category `reputation_note` for failure, `concealed_action` for critical failure; `revealFamilies` = `['social','investigation','faction']` + the failing template's own family). This means **you never have to hand-author failure aftermath just to avoid dead air** — but you *should*, because an authored complication/seed/mark reads far better than the generic fallback, and the post-pass will detect and prefer yours. Every artifact (existing or fallback) emits an `outcome_story_artifact` trace and feeds the `failure_story_rate` KPI. (Its `investigation` entry matched nothing until THR-844 aliased it, so for a year this fallback was a third narrower than it reads; all three families are now pinned live by `revealFamilyLiveness.test.ts`.)

**🟢 Divine actions can place marks too (THR-661, 2026-07-29):** Marks are no longer only an *encounter-aftermath* effect. `artifact.curse` ("Malediction Bound") now leaves a `concealed_action` mark on whoever is **carrying** the cursed object, so the curse has a findable residue on a person and not just a drain on a thing. The pattern is reusable for any divine verb whose fiction implies a trace someone could later notice:

- Marks live on `GameState.hiddenMarks`, so a graph-executor op **cannot** place one — it has no GameState. Route the op through the **resolution-intercept path** in `unifiedActionResolution.ts` (the `curse_artifact` bucket is the worked example).
- `curse_artifact` is the one op that routes **both** ways: it is pushed to its intercept bucket *and* forwarded to `graphOnlyOps`, so the executor still binds the drain. Copy that shape when you are *adding* to an existing op rather than replacing it — it keeps the shipped half untouched.
- The mark goes on a **mortal**, so its `revealFamilies` must resolve to templates the *mortal* can draw. THR-844's alias layer closed the "matches nothing at all" class, but **not** this one: `DIVINE_WORKING_REVEAL_FAMILIES` (`hex.` / `loc.` / `artifact.`) are live prefixes — 49, 19 and 4 templates — that are the *ascendant's* casting verbs and match **zero mortal-drawable** templates. A family can be perfectly live and still be unreachable by the person you marked, so the liveness guard cannot catch it for you. `CURSE_MARK_REVEAL_FAMILIES` in `src/data/ascendant-expression-constants.ts` is the correct-by-measurement example, and `curseMark.test.ts` shows how to assert the mortal-drawable subset.
- Fail-soft: an unpossessed artifact marks nobody and the curse still lands.

---

### Capability 4: Reputation Flow — How the World Remembers

Two parallel systems track how the world perceives an agent:

**Reputation Score** (0–1 numeric): Direct delta applied per outcome.
```typescript
onSuccess: { narrative: "...", reputationDelta: 0.05 }
onFailure: { narrative: "...", reputationDelta: -0.02 }
```

**Reputation Tallies** (named counters): Accumulate over time, cross thresholds to grant traits.
```typescript
{ kind: 'reputation_tally', key: 'gate_duty.witness_story_followed', delta: 1 }
```

Tallies accumulate and decay (2% per tick). When they cross thresholds (3 → "Whispered", 8 → "Known", 15 → "Legendary"), reputation traits are assigned based on the agent's capability tier.

**Polarity** — encounters are tagged positive or negative via:
1. Explicit `reputationPolarity` field on the template
2. Heuristic from encounter type (assist/trade → positive; steal/duel → mixed)
3. Tiebreaker from agent's axiological alignment

Polarity determines whether reputation grows in the "virtuous" or "notorious" direction for the tested reach domain.

**Why this changes what you write:** Reputation isn't decoration — it feeds back into the scoring pipeline (higher reputation agents get different encounter access) and into prose (reputation traits become `{title}` in enrichment, biography resolvers describe the agent's track record). **Write encounters where the reputation consequence is proportional to the moral weight of the choice.** A trivial task shouldn't swing reputation. A betrayal should leave a mark that the whole reputation system carries forward.

**Reach-polarity tallies now do double duty — they pick which reaction a non-hero agent takes (THR-530).** A `reputation_tally` whose `key` is a valid `${reach}.positive` / `${reach}.negative` (and an actor-self `reputation_score` delta) is the **moral-pole signal** the autonomous in-encounter chooser reads. When a non-player, non-threaded agent resolves an encounter with **two or more** authored aftermath reactions, the engine picks the reaction whose inferred reach-pole best matches the agent's live moral axes (their `axiologicalProfile` + drift) — a Generous agent reaches for the `gold.positive` reaction, a Greedy one for `gold.negative`. So: **author your divergent reactions with opposing reach-polarity signals** and personality will visibly steer which one fires. Reactions with no reach signal (off-axis keys like `cg.watch_work`, faction/other-agent–targeted effects, pure `recent_event` flavor) carry no pole, so the chooser fails soft to the first authored reaction — front-load the "default" reaction and let the signal-bearing alternatives earn the in-character pick. Variety scales with how many reactions you give a real pole.

---

### Capability 5: Graph Operations — Changing the World's Structure

Encounters can cause the world graph to be structurally mutated. These changes aren't cosmetic — they change what exists in the world. The authoring surface and the engine implementation are distinct levels; understanding both prevents writing aftermath that tries to call the wrong thing.

#### Engine-internal helpers (not callable from authored aftermath)

These helpers are used by engine code (tick phases, attachment pipeline, agent movement, encounter resolution). Authored encounter aftermath cannot invoke them directly. The list is here so you know what structural mutations the engine can perform, which in turn tells you what shape of outcome a new authored effect kind could produce if you propose one.

| Helper | What It Does |
|---|---|
| `createSublocation` | Creates a new sublocation inside a location |
| `createTradeRoute` | Creates a `trades_with` edge between locations |
| `claimControl` | Creates a `controls` edge |
| `joinOrUpdateMembership` | Creates a `member_of` edge |
| `modifyLocationProperty` | Changes prosperity, defense, magicalSaturation, etc. |
| `createRelationEdge` | Creates any custom edge type |
| `recordIntelligence` | Stores intel on agent node |

**Engine-internal effect primitives (used in attachment / spell pipelines, NOT in encounter aftermath):**

The attachment and spell systems compose effects from a category pool of ~40 primitive types. These are the mechanical vocabulary for authored **attachments** and **spells**, not for encounter aftermath. The table below lists category types, each of which has multiple concrete sub-variants.

| Effect category | What It Does |
|---|---|
| `GraphMutationEffect` | Direct CRUD: `add_edge`, `remove_edge`, `set_property`, `remove_node` |
| `CreateStructureEffect` | Creates locations, sublocations, landmarks, trade routes, barriers |
| `DestroyStructureEffect` | Razes structures |
| `FactionManipulateEffect` | Shift relationships, transfer control, splinter, absorb, declare war, force peace |
| `SpawnEffect` | Brings entities into existence (agents, encounters, attachments, locations) |
| `StatContributionEffect` | **(THR-718)** Raises the bearer's **Domain Capability tier** while possessed/bonded: `{ type: 'stat_contribution', contributions: { iron: 1.5 } }`. Summed by `collectStatContributions` into `computeRawScore` — the one item→tier substrate (do NOT write bare `domainContributions` bags on possession entries). Distinct from `passive`/`permanent`/`conditional` (which shape resolution *rolls*, not tiers). Magnitudes are capped by the `ITEM_STAT_BAND_*` bands in `src/data/item-stat-bands.ts` (a content test fails the build past the legendary ceiling); magnitude renders as dots on the Prowess-tab DomainCard. |

**For encounter aftermath authoring, use the typed aftermath effect kinds in Part 5 § "Aftermath Reaction Effect Types" (23 kinds).** Raw graph-mutation primitives are not exposed to authored aftermath — propose a new typed kind if you need one.

#### Authored aftermath surface for graph mutation

The following typed effects ARE callable from `aftermathConfig.reactions[].effects` and constitute the complete graph-mutation vocabulary for encounter authors:

- `spawn_artifact` — creates artifact node + possesses/bonded_to/contains edges (THR-115)
- `emit_omen` — appends to `GameState.emittedOmens`, drives encounter bias (THR-115)
- `faction_splinter` / `faction_absorb` / `faction_dissolve` — faction topology surgery (THR-115)
- `faction_declare_war` / `faction_force_peace` — faction sentiment edges (THR-115)
- `intelligence` — writes `intelligenceRecords` on agent node (existing)
- `apply_condition` / `remove_condition` / `condition_attachment` — condition edges + attachments (THR-114 / THR-117)
- `attachment_grant` — any catalog attachment: blessing, curse, bestowed power, spell, or an **agreement** (edge-backed, needs a counterparty) (THR-1110)
- `grant_companion` / `remove_companion` — a named person who walks with the bearer (THR-1096)
- `hidden_mark` — discoverable secret on agent (existing)
- `encounter_seed` — plants future encounter, creates `caused_by` edge (THR-116)

**Faction succession edges (THR-432):** Two new structural edge types are created by engine-side dispatch — not by authored aftermath:
- `will_succeed: agent → faction` — created by the `action.faction.anoint_successor` divine action via the `anoint_successor` GraphOp dispatched in `unifiedActionResolution.ts`. Stamps `anointedTick`, anointed by ascendant id.
- `leads: agent → faction` — set by `phaseFactionSuccession` (post-narrative slot) when a leader exit is detected and an anointed `will_succeed` candidate resolves. The edge is authoritative when present (read by `getAnointedLeaderId` in `factionNetwork.ts`); existing score derivation is the untouched fallback.

Authored aftermath cannot create these edges directly — they are created as side effects of divine action resolution and tick-phase succession. The `faction.encounter.inheritance` template (planted by the succession phase on the new leader) uses standard aftermath effects (`reputation_tally`, `recent_event`, `hidden_mark`, `encounter_seed`) for its accept/refuse reactions.

If you need a structural mutation that no typed effect covers, propose a new aftermath effect kind — do not try to smuggle engine helpers into authored aftermath.

**How to verify:** Grep `src/engine/encounterAftermath.ts` for the `applyEncounterAftermathReaction` function — the polymorphic switch on `effect.kind` enumerates the actual authoring surface. The count there is the source of truth, not "40".

**Why this changes what you write:** When you know an encounter can cause artifacts to be created, omens to be emitted, or faction topology to change, you write *stories about structural consequences*. A founding scene produces a real artifact or sublocation that other agents can discover, encounters can reference, and the map can display. **Write encounters that leave structural fingerprints on the graph.** If an agent "establishes a guild chapter," that should produce a `spawn_artifact` or faction effect — not just prose that says it happened.

---

### Capability 6: Intelligence and Content Grants — Knowledge as Currency

Two aftermath reaction types give agents tangible knowledge or items:

**Intelligence:**
```typescript
{
  kind: 'intelligence',
  category: 'shrine_location',              // shrine_location | agent_network | trade_route | military_position | political_secret | cultural_knowledge
  label: "Location of the Thornweave Shrine",
  detail: "Northeast of the salt flats, behind the fallen bridge",
  targetRegion?: 'eastern_reach',
  targetEntityId?: 'loc_thornweave_shrine',
  reliability?: 0.8                          // 0-1, how trustworthy
}
```

**Content Grant:** Auto-fires an attachment template onto the agent.
```typescript
{ kind: 'content_grant', templateId: 'patrons_backing' }
```

#### Intelligence is consumed in five places (THR-113, THR-140, THR-139)

Granting intelligence without consuming it is write-only theatre. The engine now closes the loop at five sites. As an author, you get this automatically — but knowing the sites tells you what prose can reference what.

| Hook | Where it fires | What it does |
|---|---|---|
| `scoring_boost` | `scoreAndSelect` in `encounterScoring.ts` | Candidates whose `templateId` / `locationId` / `targetAgentId` / region match an actionable record gain `INTEL_SCORING_BONUS` (default `0.25`). `intelBonus` is exposed on `ScoredCandidate` for trace inspection. |
| `prose_enrichment` | `enrichProse` in `proseEnrichment.ts` | `{intel:<category>}` placeholders resolve to the most recent record's label/detail/reliability. `{?knows_<category>}...{/knows_<category>}` and `{?no_<category>}...{/no_<category>}` conditionals gate whole sentences. |
| `resolution_match` | `observeResolutionIntelligence` after `consumeMatchingMarks` in GameView | Passive observation: when a resolved action matches any of the acting agent's records, a trace fires. No game-state mutation — this is the "I noticed" hook for auditing what intel actually paid off. |
| `difficulty_modifier` | `resolveUncontestedStep` in `unifiedActionResolution.ts` | Steps that opt in with `difficultyContext: 'intel_sensitive'` reduce effective difficulty by `INTEL_DIFFICULTY_BONUS` scaled by reliability (`reliable` full, `uncertain` half, `dubious` none). |
| `aftermath_prose` (THR-139) | `applyEncounterAftermathReaction` case `'intel_referenced_prose'` in `encounterAftermath.ts` | Authored "the intel paid off" chronicle line. When the actor holds a matching record, picks a prose variant by reliability band (`reliable` / `uncertain` / `dubious`) and appends a `narrative` `TickEvent` to `recentEvents` / `tickEvents`. Records are read, never consumed. The `dubious` band intentionally surfaces lines where the intel betrays the agent. Authors opt in per reaction; the 72-line shared pack lives in `src/data/intelligence-referenced-prose.ts`. |

Every consumption emits an `intelligence_referenced` trace with a `referencedBy` discriminator (`scoring_boost` | `prose_enrichment` | `resolution_match` | `difficulty_modifier` | `aftermath_prose`), the `recordId`, and the consuming context. Dedup is per-call (scoring loop and enrichProse each only emit once per unique record).

**Authoring `intel_referenced_prose` (THR-139):** Add the effect to a reaction alongside the existing `intelligence` grant. On the first run there's no prior intel, so the effect no-ops silently; on subsequent runs the matching record fires the band-appropriate line. Three pilots are wired today — `arcane-circle-encounter-content.ts` (`agent_network`), `builders-fellowship-encounter-content.ts` (`political_secret`), `encounter-anomaly-content.ts` (`cultural_knowledge`). Use them as authoring templates. Voice contract (Threadbare, 18-32 words/line, dubious shows betrayal) is in the prose-pack file's header comment.

**Category lint guard (THR-386):** `npm run lint:intel-prose-category` warns when an `intel_referenced_prose` effect's `category` looks implausibly wired for its template — flagging likely author mis-wires before they ship. Advisory only (exits 0 on warnings — region/targetId matches are invisible to static analysis, so some flagged effects are intentional). Pure module at `src/testing/intelProseCategoryLint.ts`; correctness test at `src/testing/__tests__/intelProseCategoryLint.test.ts`. Run after any bulk `intel_referenced_prose` authoring sweep.

**Author opt-in for resolution difficulty (THR-140):** the difficulty modifier is intentionally inert unless a step explicitly sets `difficultyContext: 'intel_sensitive'`. Use this on beats where prior reconnaissance should make execution easier (ambush prep, route interception, spy leverage). Leave it unset for beats where intelligence should shape discovery/prose only.

**Placeholder vocabulary for prose authors:**

| Placeholder | Resolves to | Silent fallback when record missing |
|---|---|---|
| `{intel:shrine_location}` | Record's `label` | Whole placeholder stripped |
| `{intel:shrine_location.detail}` | Record's `detail` | Stripped |
| `{intel:shrine_location.reliability}` | `"reliable"` / `"uncertain"` / `"dubious"` (thresholds `0.7` / `0.4`; non-finite → `dubious`) | Stripped |
| `{intel:shrine_location.acquiredTicksAgo}` | Ticks since the record was acquired (`tick − acquiredTick`, clamped ≥ 0). Resolves to `'0'` when acquired this tick. | Stripped |
| `{intel:shrine_location.acquiredDaysAgo}` | Game days since acquired (ticks ÷ `TICKS_PER_DAY`, floored). Resolves to `'0'` for intel less than one day old. | Stripped |
| `{?knows_shrine_location}…{/knows_shrine_location}` | Enclosed text if the agent has any record in that category | Enclosed text removed |
| `{?no_shrine_location}…{/no_shrine_location}` | Enclosed text if the agent has NO record in that category | Enclosed text kept |

All six `IntelligenceCategory` values are supported: `shrine_location`, `agent_network`, `trade_route`, `military_position`, `political_secret`, `cultural_knowledge`.

**Why this changes what you write:** Intelligence creates asymmetric knowledge — one agent knows something others don't. Now that knowledge *ranks their next encounter higher*, *shows up in their prose*, and *is noticed when they act on it*. Write reveal beats that call out the intel by category: "What {name} knew of {intel:trade_route} was already {intel:trade_route.acquiredDaysAgo} days stale." Write scenes where an uninformed agent fumbles: "`{?no_political_secret}{name} still did not know who had sent the steward.{/no_political_secret}`" A spy encounter that grants intelligence about a rival's plans is more systemically alive than one that grants a generic sword — and the rival's plans will now *influence what the agent does next*.

---

### Capability 7: Divine Intervention Choices — The Player's Voice

The player is a god. Their choices are always divine interventions, never direct character control.

> **⚠️ The engine no longer generates a generic choice set (THR-1121, 2026-08-15).** Court position governs **prose depth only**. What the player is offered at a step now comes entirely from what the *template* authored, and there are exactly three cases:
>
> | The step authored… | The player gets |
> |---|---|
> | a `nudges` hand (capability 14) | the nudge stage: those cards, plus `Let fate decide` |
> | `authoredChoices` (legacy, 30 templates pending WS5) | the choice screen, committed with `Let fate decide` |
> | neither | **fate alone** — *"Nothing here answers to you. Let it play out."* and `Let fate decide` |
>
> The third case is the model working, not a gap: a step where the god has no purchase is a real state. **What you must not expect any more is a free floor of choices under an unauthored step** — if you want the player to have a move, author one.
>
> Court position still governs prose depth exactly as before:
>
> | Court Position | Prose Depth |
> |---|---|
> | `the_first` | Full (3-5 sentences) |
> | `retinue` | Medium (2-3 sentences) |
> | `watched` | Peek (1-2 sentences), observation only |
> | `dormant` | None |
>
> **And no choice buys odds.** The retired set priced itself in essence and paid out in `probabilityBoost` — *supportive +3% for 1 essence, coercive +15% for 5*. `probabilityBoost` is no longer read by resolution at all. An authored choice still **costs** essence and still **keys which authored ending resolves** (`aftermathConfig.branchOnStep`), but the only thing that moves a roll now is a committed nudge card on the named `nudge:<id>` channel. Do not write a choice whose appeal is that it is the expensive one.

**Intervention tracking persists on thread edges:**
- `totalVignettes`, `playerIntervened`, `playerWithdrew`
- `interventionRatio` (how often the god meddles vs. lets be)
- `supportiveCount`, `coerciveCount`
- `essenceSpentOnEncounters`

**Why this changes what you write:** You're not writing choices for a character — you're writing moments where divine observation creates tension. The god sees the agent struggling and must decide: pour power in, or let them find their own way? **Write moments where the intervention decision is genuinely difficult — where supporting has a cost beyond essence, and withdrawing has consequences beyond failure probability.** That last clause is now the *whole* of it rather than a stretch goal: since THR-1121 withdrawing has no failure-probability consequence to be "beyond", because no choice carries one. The interesting difference between meddling and watching has to be in the fiction and the aftermath, or it is nowhere. The intervention ratio is still tracked, and a god who always meddles still creates a different story than one who watches.

**Authored moral-axis poles on choice cards (THR-528).** An `AuthoredChoiceCard` (the cards under a template's `authoredChoices`) can now *declare* which way a choice tilts the acting agent's personality, instead of letting the engine infer it from `interventionType`:

```ts
{
  id: 'turn_the_chaos', label: 'Turn the Chaos', /* …prose… */
  interventionType: 'coercive',
  moralAxis: 'iron',     // which Reach's virtue↔vice axis this choice moves (defaults to the choice's reach)
  pole: 'vice',          // 'virtue' tilts toward the reach's virtue pole, 'vice' toward the vice pole
  magnitude: 0.15,       // unsigned drift strength, canonical 0.05–0.20 (PERSONALITY_DRIFT_DELTA_*)
}
```

When committed, the choice nudges the agent's *live axis position* by `±magnitude` (virtue +, vice −); a streak of like choices visibly moves them, then **decays back toward their baseline** (born/marked standing) when unreinforced — `liveAxisPosition(baseline, drift)`, decay in `phaseDriftDecay`. The grant/release of emergent personality traits (THR-527) reads that standing position. **Author the pole deliberately** — it lets a "supportive"-typed choice still be a *vice* (e.g. declining a plea to extract value is Gold-vice even though it's `withdrawn`), which the old `interventionType` heuristic could not express. Omit the fields and the legacy heuristic still applies, so un-migrated cards keep working. Resolvers: `resolveEncounterArchetypePole` / `resolveChoiceDrift` in `encounter-contract-builder.ts`.

**Permanent formative marks vs. decaying drift (THR-529).** Choice drift above is *temporary* — it relaxes back to the baseline. For the rare defining moment that should *reshape who the agent is*, use the `axiological_mark_apply` aftermath effect (see § "Aftermath Reaction Effect Types"). It moves the **baseline itself** (the `AxiologicalProfile` value origin vignettes seed at birth) by a clamped `signedMagnitude`, so the change persists where drift would fade. **Use it sparingly** — it belongs on the single most-committed aftermath reaction of a genuinely soul-defining encounter (an execution carried for coin → Iron vice; a famine's granaries thrown open → Gold virtue), not on routine outcomes. Rarity is enforced only by content discipline; the magnitude cap (`FORMATIVE_MARK_MAX_MAGNITUDE`) ensures one mark can't override a lifetime of origin vignettes, but layered marks accumulate. The starter set lives in `the-executioners-commission.ts` (Iron, both poles) and `the-granaries-in-the-famine-year.ts` (Gold, both poles).

---

### Capability 8: Complication System — Failure Has Texture (THR-20)

When a failure-tier step outcome occurs (success_at_cost / failure / critical_failure), the engine automatically selects a concrete narrative complication from a pool of templates. This runs for **all** action templates, not just the proving-slice families. The complication is displayed in the EncounterVeil and emits notification events.

**You do not author complications per-encounter.** Complications come from the global `src/data/complication-templates.ts` pool. However, the complication **scoring and selection** is influenced by:
- The **action's reach** — matching templates score higher (e.g. a `heart` action preferentially draws `broken_trust` and `witness` complications; a `shadow` action preferentially draws `rival_attention` and `scar`)
- The **active omen category** — synergy bonus if the complication category matches omen themes
- The **doom stage** — `worsening_convergence` templates score higher at stage 3+
- **Scar stacking** — if the actor already has scar attachments, diminishing returns apply
- The **location's unrest** — `location_fallout` complications diminish when unrest is already maxed

**Complication effects that run automatically (you don't need to wire these per-encounter):**

| Effect type | What it does |
|---|---|
| `unrest_delta` | Raises/lowers location unrest |
| `attachment_add` | Creates a mark/scar attachment on the actor |
| `doom_micro_tick` | Advances the doom clock by a small magnitude |
| `relates_to_create` | Creates a graph edge between actor and a witness/faction member |
| `reputation_delta` | Adjusts actor reputation |
| `quintessence_delta` | Adjusts the actor's quintessence |
| `location_fallout` | Marks a location as unsafe/compromised |

**Prose placeholders available in complication templates** (resolve from live graph):
- `{name}` — actor's name · `{possessive}` — `their` · `{location}` — current location name
- `{witness}` — a randomly chosen present agent · `{faction}` — actor's faction name
- `{omen_atmosphere}` — flavored atmosphere from the active omen

**What you CAN do:** Author new complication templates in `src/data/complication-templates.ts`. Each needs:
- `id`, `category` (9 options), `name`, `severity` (`minor`/`standard`/`severe`)
- `proseTemplates: string[]` — 3+ prose variants using placeholders
- `effects: ComplicationEffect[]` — at least one game-state effect
- Optional `requirements`: `witnessesPresent`, `factionRelationship`, `atSettlement`, `minDoomStage`, `omenCategory`
- Optional `reachAffinity: string[]` and `omenSynergy: string[]` for scoring bias

**Notification routing:** Severe → `alert` channel. Standard → `toast`. Minor → silent (prose-only in EncounterVeil).

**Why this changes what you write:** Failure in this engine is never "nothing happened." Write failure branch prose that *opens space* for the complication to specify the consequence: "The attempt goes wrong—" leaves room. "The merchant catches you red-handed—" over-specifies and may contradict a `scar` or `worsening_convergence` complication. Let the complication system carry the specificity; your prose carries the emotional register.

---

### Capability 9: World-Shaping Effects — Encounters That Change the Map (THR-115)

Aftermath reactions can now permanently reshape world topology: spawning artifacts, staining regions with omens, splitting or absorbing factions, and triggering war or peace between factions. These effects run through the same `applyEncounterAftermathReaction` call path as all other effects — content authors just declare the intent, the engine does the surgery.

#### Spawn Artifact

```typescript
{
  kind: 'spawn_artifact',
  artifactName: "The Thornweave Seal",
  artifactSubtype: 'relic',                     // relic | weapon | scroll | vessel | etc.
  possessedByAgentId: '$actor',                 // who carries it (defaults to actor)
  bondedToAgentId?: '$actor',                   // mystical bond (optional)
  targetLocationId?: 'loc_throne_room',         // contained within a location (optional)
  chronicleEntry?: "A seal of binding was forged in the ruins."
}
```

Creates an `artifact` graph node, adds `possesses` / `bonded_to` / `contains` edges as declared, and optionally appends a chronicle event. The artifact becomes part of the world graph — prose resolvers can reference it via `{artifact:relic}`, and other encounters can discover it.

**When to use:** Founding moments, magical discoveries, pivotal plot payoffs. If the encounter's outcome is "an important object now exists in the world," this is the effect.

#### Emit Omen

```typescript
{
  kind: 'emit_omen',
  omenId: 'omen_bridge_of_silence',
  encounterTypeBias: { ritual: 0.3, conflict: -0.15 },  // which encounter types become more/less likely
  scope: {
    kind: 'local',                // global | regional | local
    hexCol: 4, hexRow: 7,
    radius: 3                     // hex distance radius for 'local'
  },
  durationTicks: 48,              // how long the omen stains this region (default: 48 = 4 game days)
  intensity: 0.7                  // 0-1, scales the bias contribution
}
```

Appends an `EmittedOmen` to `GameState.emittedOmens`. The omen drives `deriveEmittedOmenEncounterBias` in Phase 2b, nudging agent encounter selection toward the declared bias while the omen is active. Decays automatically in Phase 1.7a when `tick > expiresTick`.

Cap: `MAX_EMITTED_OMENS_CAP = 10`. When exceeded, the oldest omen is evicted.

**When to use:** Dark rituals, cursed ground, prophecies fulfilled, corrupted shrines. A conflict in a sacred grove should make ritual and spiritual encounters more likely in that region for the next few days — this is the mechanism.

#### Faction Topology Effects

Five effects reshape the faction graph:

```typescript
// Split a faction into two
{ kind: 'faction_splinter', factionId: 'faction_weavers_circle',
  newFactionName: "The Rift Circle", newFactionType: 'guild',
  memberSelectionStrategy: 'by_reputation_below', memberSelectionValue: 0.3,
  sentimentToward: 'resentful' }

// One faction absorbs another's members
{ kind: 'faction_absorb', absorbingFactionId: 'faction_iron_pact',
  absorbedFactionId: 'faction_weavers_circle',
  memberSelectionStrategy: 'all_matching_trait', memberSelectionTrait: 'aligned_iron',
  reputationMerge: 'max' }

// Dissolve a faction entirely
{ kind: 'faction_dissolve', factionId: 'faction_weavers_circle',
  memberDisposition: 'drift_to_rival',   // independent | drift_to_rival
  rivalFactionId: 'faction_iron_pact' }

// Declare war between two factions
{ kind: 'faction_declare_war',
  factionAId: 'faction_iron_pact', factionBId: 'faction_weavers_circle' }

// Force peace between two factions
{ kind: 'faction_force_peace',
  factionAId: 'faction_iron_pact', factionBId: 'faction_weavers_circle',
  sentimentFloor: 0.1 }

// Iron / Warhost reach signature (THR-550): rally a faction to war
{ kind: 'signature_warhost', factionId: 'faction_iron_pact',
  baseStrength: 30,             // optional; defaults to WARHOST_BASE_STRENGTH
  leaderAgentId: 'agent_kael' } // optional; else strongest Iron member

// Veil / Rend the Gate reach signature (THR-551): open a sustained sphere rift
{ kind: 'sphere_influence_amplify', locationId: 'loc_riftmouth',
  sphere: 'entropy',            // content sets this to the ascendant's primary sphere
  perTick: 2,                   // optional; defaults to RIFT_INFLUENCE_PER_TICK
  durationMode: 'sustained' }

// Stone / The Great Work reach signature (THR-552): build a one-of-a-kind wonder
{ kind: 'spawn_unique_location', subtype: 'master_forge',
  uniqueTag: 'the_first_forge', // dedup key — one per run; second cast is a no-op
  artifactForgeTier: 'legendary' } // optional; forges a relic via the spawn_artifact path
  // placement: hex? > nearAgentId? > actor's hex (fail-soft skip if none)
```

**`signature_warhost`** marks the faction `mobilized` and raises a force on the *existing army node form* (`armySpawning.raiseWarhostForce` — an `actor`/`group` node with an `armyState` bag, wired by `commanded_by` / `member_of` / `located_at`; **not** a new node type). Force strength = `scaledEffect(baseStrength ?? WARHOST_BASE_STRENGTH, spherePowerMultiplier(actor primary-sphere score))` (THR-548) — a maxed-sphere god raises a bigger host. When no leader/location is available it falls back to a faction property plus a belligerent shift on the faction's rival `relates_to` sentiment. Trace: `ascendant.signature.warhost`. Fail-soft no-op on a missing/dissolved/non-faction target.

**`sphere_influence_amplify`** opens a *sustained rift* at a location — resolving into a `ControlEffect` on `GameState.controlEffects[]` (ticked by `phaseControlEffects`), not a one-shot mutation. While held, each tick it (a) pushes scaled sphere pressure onto the location for `sphere` up to a cap (`perTickSphereInfluence`, via the canonical pressure system — additive to the generic `CONTROL_PRESSURE_PER_TICK`), (b) charges `scaledCost(RIFT_PERTICK_COST, mult)` essence in that sphere, and (c) rolls a seeded `perTickLeak` chance to spill a hostile chaos pulse (hex `corruption` + `entropy` pressure). Magnitude, cost, **and** leak chance all scale with the actor's primary-sphere power via `spherePowerMultiplier` (THR-548) — the downside scales with the upside, so it's the individualization, not a flat tax. The rift's `perTickCost` can be waived by binding an upkeep relic (`upkeepArtifactId`, THR-509). Traces: `ascendant.signature.rift` (establishment) + `ascendant.signature.rift_leak` (per-tick leak). Fail-soft no-op on a missing/non-location target or no acting ascendant.

**`spawn_unique_location`** mints a one-of-a-kind wonder — a `location` node flagged `unique` carrying a `uniqueTag`, owned via a `controls` **edge** from the actor (**not** a new node type; the relationship is an edge, not a property — both load-bearing rules). It is **idempotent**: a second cast with the same `uniqueTag` is a no-op (dedup), so the card can't spawn duplicates across a run. Placement resolves in precedence order — explicit `hex` → `nearAgentId`'s hex → the actor's own hex — and fail-soft skips (`no_hex` trace) if none resolves. Setting `artifactForgeTier` also forges an "extra-powerful artifact" by **reusing the `spawn_artifact` path** (`artifact_legendary` + `bonded_to` the maker at `legendary`, else `artifact` + `possesses`) — no new artifact code. Both version counters bump on spawn (a new location shifts spatial structure). The sphere twist (matter→inexhaustible mine, order→unbreakable forge, time→early completion) is supplied by the THR-549 individualization matrix, not this effect. Trace: `ascendant.signature.unique_location`. Fail-soft no-op on a duplicate tag or unresolvable hex; resolver-boundary catch keeps the beat resolving.

**Authoring these on a player-god card — target sentinels (THR-555).** The three resolvers above read a *literal* target id, but a static `UnifiedActionTemplate` firing them from `aftermathConfig` doesn't yet know which node the player will pick. Declare a sentinel in the effect and the aftermath dispatch (`bindReachSignatureTargets`, `encounterAftermath.ts`) binds it to the card's resolved target at fire time — the same `$target` idiom the step-level imbue/anoint ops use. Import the sentinels from `src/data/reach-signature-content.ts`:
- `signature_warhost.factionId: AFTERMATH_TARGET_SENTINEL` (`'$target'`) → `action.targetId` (the played-on faction).
- `sphere_influence_amplify.locationId: '$target'` → the played-on location; `sphere: AFTERMATH_PRIMARY_SPHERE_SENTINEL` (`'$primary'`) → the *caster's* primary Creation Sphere (the rift amplifies the ascendant's own sphere — a static template can't know it; falls back to the declared value when the primary isn't a Creation Sphere).
- `spawn_unique_location.nearAgentId: '$target'` → the played-on location resolved to its hex (a location id is not an agent id, so the sentinel is special-cased to a hex). Use a fixed `uniqueTag` (e.g. `GREAT_WORK_UNIQUE_TAG`) for a one-per-run wonder.
Fail-soft: a missing/unresolvable target leaves the sentinel in place and the effect's own resolver no-ops. Non-signature effects and any effect without a sentinel pass through untouched. See `invest.{iron.warhost,veil.rend_the_gate,stone.great_work}` in `reach-signature-content.ts` for the worked templates.

**Member selection strategies** (`faction_splinter` / `faction_absorb`):
- `all_matching_trait` — all members who have a specific trait
- `within_radius` — members within N hex distance of the origin hex
- `by_reputation_below` / `by_reputation_above` — members whose reputation with the faction is below/above a threshold
- `explicit_ids` — exact agent IDs (for authored story moments)
- `random_sample` — deterministically random subset by count

**Reputation merge strategies** (`faction_absorb`):
- `max` — each absorbed member gets the higher of their two reputation values
- `sum_clamped` — reputations add (clamped 0–1)
- `weighted_avg` — proportional blend based on member counts

**When to use faction effects:** These are climax-level story beats, not routine aftermath. Reserve them for encounters where the fiction demands structural change — the betrayal that tears a guild apart, the war declaration at the coronation, the peace treaty as divine intervention. Each call mutates `WorldGraph` topology and bumps `structuralCacheVersion` — other systems will notice.

---

### Capability 10: Encounter Foreshadowing — What the Agent Believes Before They Arrive (THR-389)

When the player clicks an encounter row in the agent profile panel, the engine generates 2–4 sentences of foreshadowing prose showing what the agent believes or imagines about the encounter they're moving toward. This runs **on click**, never per-tick — it's a UI-layer resolver, not an orchestrator phase.

**The content surface:**

```typescript
// On UnifiedActionTemplate (src/types/unifiedAction.ts):
foreshadowing?: {
  variants: ForeshadowingVariant[];   // Authored per encounter
  fallback?: string;                  // Encounter-specific fallback (uses placeholders)
};

// Each variant:
{
  id: string;               // e.g. 'plague_outbreak.healer_curiosity'
  template: string;         // Prose template with {name.first}, {pronoun.subject}, {encounter.heading}
  when: {
    intelligenceTier?: 'unknown' | 'rumor' | 'briefed' | 'expert';
    topMotive?: 'awareness' | 'visibility' | 'prereqs' | 'threat' | 'capability' | 'cooldown';
    dominantReach?: string;           // e.g. 'eye', 'heart', 'shadow'
  };
}
```

**Available placeholders in foreshadowing templates:**

| Placeholder | Resolves to |
|---|---|
| `{name.first}` | First word of agent name |
| `{encounter.heading}` | Encounter template `name` field |
| `{pronoun.subject}` | `he` / `she` / `they` (from agent gender) |
| `{pronoun.subject_capitalized}` | Capitalized subject pronoun |

**Variant selection:** The engine picks the most-specific matching variant (most conditions specified in `when`). Ties at the same specificity are broken deterministically with PRNG seeded from `agentId + encounterId`. If no variant matches, falls back to `foreshadowing.fallback`, then to `GENERIC_FORESHADOWING_FALLBACK`.

**Signals (live — no longer Phase-1 stubs):**
- `intelligenceTier`: derived from the candidate's `completionProb` via `resolveIntelligenceTier`
- `topMotive`: derived from the agent's real decision via `resolveTopMotive`
- `dominantReach`: the candidate's `reachPrimary`, falling back to the template's `reach`

Only the no-candidate path (foreshadowing an encounter the agent has not actually selected) still returns the `'unknown'` / `'awareness'` defaults. Variants authored against these conditions match on real agent state.

> **Note on tiers:** this path's `intelligenceTier` is a *proxy* derived from `completionProb`. The Motive Receipt path (Capability 11) carries the **real** tier read off the matched `IntelligenceRecord` reliability. Where both exist, the receipt is the truthier signal — that is the whole reason it was built.

**Why this changes what you write:** When authoring `foreshadowing` variants, you're writing inside an agent's head — what they've heard, what they fear, what they hope for. The prose should reflect the agent's epistemic state, not objective facts about the encounter. A variant for `intelligenceTier: 'rumor'` should feel uncertain and second-hand. A variant for `topMotive: 'threat'` should feel defensive. The encounter itself hasn't happened yet — the agent is projecting.

**Authoring a new encounter with foreshadowing:**

```typescript
// In encounter-content.ts:
{
  id: 'encounter.guild_audition',
  name: 'Guild Audition',
  reach: 'gold',
  // ...
  foreshadowing: {
    variants: [
      {
        id: 'guild_audition.nervous',
        when: { intelligenceTier: 'unknown' },
        template: "{name.first} has heard the guild judges three times — once at dawn, once at midday, once in firelight. {pronoun.subject_capitalized} rehearses {encounter.heading} the way a soldier rehearses a retreat route: not for confidence, but for the comfort of having a plan.",
      },
      {
        id: 'guild_audition.confident',
        when: { intelligenceTier: 'briefed', topMotive: 'opportunity' },
        template: "{name.first} knows what the {encounter.heading} judges want. {pronoun.subject_capitalized} has made it their job to know. The question isn't whether {pronoun.subject} can impress them — it's which version of impressive to show.",
      },
    ],
    fallback: "{name.first} thinks about {encounter.heading} the way {pronoun.subject} thinks about most things: carefully, and too much.",
  },
}
```

**Where to find the implementation:** `src/engine/foreshadowing/encounterForeshadowing.ts` for the resolver, `src/engine/foreshadowing/constants.ts` for the cache cap, `src/types/foreshadowing.ts` for the `EncounterForeshadowingDefinition` + `EncounterForeshadowingVariant` interfaces.

---

### Capability 11: The Motive Receipt — Why the Agent Actually Chose It (THR-631)

Capability 10 asks an authored variant to *guess* at an agent's reason. The Motive Receipt stops guessing: the scorer already computes the real decision causality every tick, so the engine now keeps it instead of throwing it away. Foreshadowing prose, the trace, and the DebugPanel all read the same receipt — **"why did this agent choose this encounter" is the same answer everywhere.**

**What it carries** (`MotiveReceipt`, `src/types/foreshadowing.ts`) — stored as the `motiveReceipt` **property** on the agent node, not an edge (no system traverses encounter → "agents who chose me because X"). Overwritten on each new selection; serializes with the graph.

| Field | Meaning |
|---|---|
| `templateId` / `locationId` | The selection this receipt explains |
| `contributions[]` | Top `RECEIPT_TOP_CONTRIBUTIONS` (3) reasons, ranked by `weight` (normalized 0..1 share of positive score mass) |
| `intelTier` | **Real** tier from the matched `IntelligenceRecord` reliability — *not* `completionProb` |
| `expectation` | `ForecastTier` from `completionProb` (reuses the vignette outcome-forecast tiers) |
| `dominantReach` | Reach that dominated the decision |
| `decidedAtTick` | Seeds prose variety; a new decision yields fresh prose |

**Contribution kinds** (`MotiveContributionKind`) — each maps to a scorer term: `ambition`, `personality`, `intel`, `mark`, `divine`, `bond`, `reputation`, `resonance`, `rarity`, `hunch`, `doom_identity`, `chain`, `exploration`, `proximity`. A contribution below `RECEIPT_MIN_WEIGHT` (0.10) is dropped.

**How prose consumes it** (`composeReceipt.ts`) — four sentences, each keyed to a different part of the receipt:

| Sentence | Keyed on | Table |
|---|---|---|
| S1 knowledge | `intelTier` | `KNOWLEDGE_CLAUSES` |
| S2 pull/motive | **top contribution kind** (+ `dominantReach` flavour) | `MOTIVE_CLAUSES_BY_REACH` → `MOTIVE_CLAUSES` → `personality` |
| S3 expectation | `expectation` forecast tier, with an em-dash hedge tail below `briefed` | `EXPECTATION_BY_FORECAST` + `LOW_INTEL_HEDGE_TAILS` |
| S4 stake *(optional)* | **second** contribution kind, only if its weight ≥ `STAKE_CLAUSE_MIN_WEIGHT` (0.20) | `STAKE_CLAUSES` → `DEFAULT_STAKE_CLAUSES` |

Tooltip render = S2 only. Panel render = S1–S3 (+S4). All tables live in `src/data/foreshadowing-content.ts`.

**Determinism:** clause selection is seeded on `(agentId, templateId) XOR decidedAtTick` — the same decision always yields the same prose; a new decision yields fresh variety. No `Math.random()` (NFP #3).

**Fail-soft:** `readMotiveReceipt` (`receiptRead.ts`) rejects a receipt whose `templateId`/`locationId` doesn't match the encounter being foreshadowed (the agent has since chosen something else), and the caller falls back to the composed-generic path. A missing clause key falls back to the `personality` / default pools. The composer never throws (NFP #4).

**Authoring clause variants — use the typed-slot realizer, never raw pronouns.** Clause templates are realized by `realizer.ts`, which exists to make two specific bugs impossible:

| Slot | Fills with |
|---|---|
| `{name}` | Agent's first name |
| `{subject}` / `{Subject}` | `he` / `she` / `they` (subject case) |
| `{object}` / `{Object}` | `him` / `her` / `them` (**object case**) |
| `{place}` | Location name — *only ever* a location, never an encounter title |
| `{matter}` | The thing at stake ("what stirs at Ashmarket") |
| `{v:lemma}` | Verb conjugated to the subject's number |

Two rules are enforced by tests, not convention:

1. **Every verb after a subject slot must be `{v:lemma}`.** Writing `"{Subject} believes"` breaks for `they`. The *agreement sweep* in `composeReceipt.test.ts` renders every clause in every pool against he/she/they and fails on both `"They believes"` and `"He believe"`. It derives verb forms from the real `conjugate` function, so **adding a clause with a new verb needs no test edit** — but adding a clause with a bare verb will fail the suite.
2. **A pronoun in object position must use `{object}`/`{Object}`.** Writing `"moves {subject} closer"` renders "moves they closer". The *object-case lint* statically flags a subject slot following a copula, transitive verb, or object preposition.

Both sweeps run over `MOTIVE_CLAUSES`, `MOTIVE_CLAUSES_BY_REACH`, `EXPECTATION_BY_FORECAST`, `STAKE_CLAUSES`, and `DEFAULT_STAKE_CLAUSES`. Add a pool and you must add it to the sweep, or it ships unchecked.

**Authored overrides still win.** An encounter with an authored `foreshadowing` block (Capability 10) uses its variant; the receipt path is what runs when no authored variant matches. Author variants for encounters whose *specific* fiction matters; let the receipt carry the systemic long tail.

**Inspecting it:** `window.__DEBUG.getMotiveReceipt(agentQuery)` returns the live receipt; `__DEBUG.getForeshadowing(agentQuery, templateQuery?)` returns the rendered result. The existing `foreshadowing` trace gained `compositionKeys` (which clause pools fired, e.g. `pull:ambition/iron`) and `receipt` (the consumed receipt, or `null` on the generic path) — **no new trace category**.

**Where to find the implementation:** `motiveReceipt.ts` (build), `receiptRead.ts` (read + validate), `composeReceipt.ts` (compose), `realizer.ts` (surface realization), `constants.ts` (tunables), `src/data/foreshadowing-content.ts` (clause tables).

---

### Capability 12: Context Fragments — One Skeleton, Many Scenes (THR-573)

The engine already treats the same template at a tavern versus a shrine as **different surfaces** for novelty and recency (`computeSurfaceKey`, THR-475). Until now the prose didn't follow: those "different" surfaces read identically, so the multiplication was an accounting trick the player could see through. Context fragments are the reading half — authored prose that binds to the same axes the selection engine already keys identity on.

**The shape.** An optional field on any `UnifiedActionTemplate`:

```ts
contextFragments: [
  {
    slot: 'opening',
    axis: 'place',                      // 'place' | 'counterpartRole'
    variants: {
      '*': 'The default scene — REQUIRED.',
      'sublocation-type.tavern': '{name} pays for the second round before sitting down…',
      'sublocation-type.harbor': '{name} finds the target checking cargo against a tide table…',
    },
  },
]
```

Reference the slot from any prose field with `{frag:opening}`. That's the whole authoring surface.

**Two kinds of axes.** *Identity* axes create surfaces and count toward the library: `place` (the location's `sublocationTypeId`) and `counterpartRole` (the target's `npcRole`). *Coloration* — sphere/omen vocabulary, `{cast:*}` continuity, `{intel:*}`, `{?target_is_ally}` — varies the reading for free but never creates a surface. Compose both: coloration on top of a multiplied surface is what keeps 20 surfaces from feeling like 20 templates.

**The declared-default invariant.** Every `variants` map MUST contain `'*'`. This is the same guarantee `{cast:*}` gives you: **a declared slot always resolves**, so you can reference your own fragments unguarded and never write a conditional around them. An unmapped context falls back to the default; a template with no fragments renders exactly as it does today. The `'*'` entry is real authored prose, not a stub — it is what the scene reads like when nothing is bound.

**No PRNG.** Resolution is a pure lookup: same surface, same words, every run. If a scene feels repetitive, the answer is another axis value or novelty tuning — not randomness.

**Two traps that make the layer silently do nothing:**

1. **Whitelist converters.** Families that convert raw entries into `UnifiedActionTemplate` (e.g. `toSocialTemplate` in `social-scene-templates.ts`) copy named fields only. An unlisted `contextFragments` is dropped without an error and your fragments never reach the runtime.
2. **Static display surfaces.** `narrativeTemplates.initiation` is read raw by Codex cards and previews that never run `enrichProse` — a bare `{frag:*}` token leaks to the player there. Expand it to the `'*'` default at conversion time.

**Inspecting it:** the DebugPanel **Fragments** tab shows the static inventory (which templates multiply, on which axes, how many surfaces) and the live bindings; `window.__DEBUG.resolveSurfaceFragments('<agent>')` returns the bound scene headlessly, and the no-arg form returns the inventory. `npm run volume-model` reports **measured** surface counts, so the ~1,000 target is an observable, not an assertion. The `surface_fragments_bound` trace fires once per encounter instantiation. Watch `usedDefault`: a surface that always defaults means the axis election missed.

**Authoring pipeline:** `.claude/skills/template-context-rewrite/SKILL.md` (four passes: axis election → scene-first drafting → QA → merge). Every fragment is swept by the prose-QA scorer, so multiplied surfaces clear the same register bar as inline prose.

**Where to find the implementation:** `src/engine/fragmentResolution.ts` (resolution + enumeration), `src/engine/content-eval/surfaceFragmentReport.ts` (inventory), `{frag:*}` handling in `src/engine/proseEnrichment.ts`. Worked example: `social_scene.recruitment_pitch` — 9 fragments → 20 surfaces.

---

### Capability 13: Item On-Use Consequences — What the Blade Costs to Swing (THR-719)

**What it is:** an item in an agent's hands can answer back when it is used. On a resolution outcome, an `action_trigger` effect in the item's `effects[]` can break the item, spend it, heal its bearer, or curse them — carrying its own authored prose into the aftermath feed.

**Why you care:** this is how "power has a price" stops being flavor text. A cursed crown that *says* it remembers its drowned king can now actually lay the curse. Before THR-719 the authored field for this (`onUseTriggers`) was read by nothing — every promise in a tooltip was a lie. Write these and they fire.

**How to author one** — put it in the item's `effects[]` array:

```ts
{
  type: 'action_trigger',
  on: 'encounter_critical_failure',   // which outcome band
  payload: { kind: 'self_remove' },   // what happens
  probability: 0.25,                  // chance when the band hits (omit = always)
  cooldownTicks: 0,                   // 0 = every use rolls; omit = 6-tick default
  narrativeTemplate: '{item_name} snaps against the blow.',
}
```

**The events (`on`)** — the six-band outcome ladder maps onto these, and the mapping *widens*: a critical success raises both `encounter_critical_success` and `encounter_success`, so a coarse-band trigger fires on everything it always did.

| `on` | Fires when |
|---|---|
| `action_complete` | any completed action — the old `any_use` |
| `encounter_critical_success` / `encounter_success` | the success side of the ladder |
| `encounter_at_cost` | `success_at_cost` or `near_miss` — scraped through |
| `encounter_failure` / `encounter_critical_failure` | the failure side |
| `movement_complete` / `rest` / `spell_cast` | non-encounter moments |

**The payloads (`payload.kind`)** — only kinds authored content actually uses exist; do not invent speculative ones:

| Kind | Effect |
|---|---|
| `condition_grant` | attach an existing condition trait node — `{ conditionTraitId, durationTicks?, intensity? }`. `durationTicks: null` = permanent. **The node must already exist in a catalog** — a grant naming a missing node fails soft and does nothing. |
| `condition_remove` | strip the bearer's conditions by `tags` (e.g. `['#wound']`) or by `conditionTraitId` |
| `self_remove` | destroy the item — breakage, consumption |
| `resource_delta` | essence / quintessence / doom change |
| `content_grant` / `trace_only` | grant templates / trace only |

**`maxFires: 1`** reproduces the old `first_use` semantics.

**Prose tokens:** `{actor}`, `{item_name}`, `{target}`, `{location}` — unknown tokens render empty. Fired prose surfaces as an aftermath change on the encounter, so write it as a beat the player should see, not a debug string.

**Where to find the implementation:** `src/engine/effects/actionTrigger.ts` (fire check, probability guard, ladder mapping), `src/engine/effects/actionTriggerPayloads.ts` (graph application), call sites in `unifiedActionResolution.ts` / `orchestrator.ts` / `phaseMovement.ts`. Worked examples: the Iron Blade (breakage), the Whispering Eye (drain), the Amber Phial (heal).

---

### Capability 14: The Nudge Hand — What the God May Do to This Step (THR-773)

**What it is:** a step can carry an authored hand of **nudge cards**. In an *attended* encounter the player is offered them, pays essence, and each one bends the named odds of that step. Some cards also carry a **rider** that remaps the outcome band after the roll lands.

**Why you care:** this is the seam where "you nudge the physics, fate picks the outcome" stops being a slogan. Without an authored hand, an attended encounter offers the player nothing to do but watch. Cards are per-encounter and concrete — they name a thing that visibly happens in *this* scene — so this is a content surface, not a settings screen.

**Scope rule you cannot author around:** nudges exist **only** in the attended encounter (`AttentionTier === 'story_beat'`). A hand authored on a template that resolves in the background is inert. That is by design, not a bug to route around.

**How to author one** — put it in the step's `nudges[]` array:

```ts
{
  id: 'steady_her_hand',            // unique within the template
  name: 'Steady Her Hand',           // ≤6 words, plain
  sphere: 'spirit',                  // optional gate; omit = common pool
  requiredUnlock: 'divine.inspire',  // optional god-power gate
  requiredTrait: 'trait.core.core_integrity.virtue', // optional trait-only card; full node id, and it must survive validateTraitRefs() — see Capability 15
  essenceCost: 2,                    // 0 allowed (trait options)
  forecastDelta: 0.10,               // named modifier, source `nudge:steady_her_hand`
  rider: 'no_crit_fail',             // optional band rider
  imageTag: 'hand_on_shoulder',      // optional WS4 library tag
  fiction: 'The tremor goes out of her wrist and does not come back.',
  effectLine: 'Makes the worst outcome impossible.',   // words only, never a number
  bandProse: { failure: 'She still misses — but she misses cleanly.' },
}
```

**The riders** — exactly two, and both are *band remaps*, never re-rolls:

| Rider | Effect |
|---|---|
| `no_crit_fail` | `critical_failure` → `failure`. Everything else passes through. |
| `floor_at_cost` | `failure` → `success_at_cost` **and** `near_miss` → `success_at_cost`. A near miss is a failure texture and floors with it. |

At most one rider applies per step — the strongest wins (`NUDGE_RIDER_PRIORITY`), they never stack, and **they take zero extra dice**. A rider that re-rolled was considered and rejected: any extra draw from the resolution stream shifts every downstream consumer for that action.

**`bandProse` keys on `StepOutcome`** — the **six**-value step enum (`critical_success | success | success_at_cost | near_miss | failure | critical_failure`). Not `OutcomeBand`, not the five-band `EncounterOutcomeBand`; either would type-check while being the wrong domain.

**Trait variants** are the template-level sibling — `traitVariants[]` on the template fires when the acting mortal holds a trait, and can add a forecast modifier (`trait:<id>`), shift the step's difficulty, contribute a player-facing factor line, and unlock extra nudge cards into the hand via `addNudgeIds`.

**Fail-soft:** a step with no `nudges` runs exactly as it did before this capability existed — the whole feature is opt-in. An unknown rider value, a `traitVariants.addNudgeIds` naming no card, or a committed id with no authored card are all inert with one warning.

**Where to find the implementation:** `src/engine/encounters/nudges.ts` (hand partitioning, modifiers, riders, band prose), applied in `unifiedActionResolution.resolveUncontestedStep`. Constants in `src/data/nudge-constants.ts`. Inspect a live hand with `window.__DEBUG.getEncounterNudges(agentRef)`.

**Authoring quality rules (THR-774 / WS1, format locked by THR-883) — the schema lets you write a bad hand; these do not.** Full contract in [`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`](../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md); guardrail numbers in `src/data/content-eval/nudgeAuthoringConstants.ts`; worked example in `src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar.ts` (The Swollen Ford — supersedes the Darkhollow Vault).

| Rule | Value | Why |
|---|---|---|
| Hand size | 4–8 cards per nudge-bearing step | Below the floor there is no decision; above it the player reads a catalogue. **Authoring** guardrail, warn-level — the renderer stays uncapped, so this is not the rejected capped-action-slots model. |
| Sphere coverage | ≥4 distinct spheres | The hand is the replayability engine — different gods see different subsets — and that only holds if the spread is wide enough to differ on. |
| Common options | ≥1 sphere-less card | A god with no matching sphere is never handed an empty step. |
| Failure payoff | **every** nudge carries ≥1 fragment in `near_miss` / `failure` / `critical_failure` | The god's hand must be traceable in failure at any size. A card that vanishes on a loss makes failure read as punishment. |
| Big delta | `forecastDelta ≥ 0.15` ⇒ **both** `failure` and `critical_failure` | A nudge that moved the odds that far and still lost owes a distinct reading of *how* it lost at each depth. |
| Band coverage | the hand's fragments cover all six `StepOutcome`s between them | `near_miss` has no afterimage field on `ActionStep`; fragments are the only place it gets paid off. |
| Base-text independence | nudge-specific payoffs live in `bandProse`, never in `narrativeTemplate` | The base text must read correctly with **any** subset of the hand active, including none. |
| `effectLine` | words, zero digits or `%`; **states mechanism, not mood** | Ruling 1: odds are legible in words only (pips render magnitude). The pivot: the effect line is the rules text — what the god does and why that moves the odds. |
| Card faces | library-generic: 2–4 word title, one-line flavor quote, zero scene-bespoke prose | The THR-883 communication pivot: prose does the scene, cards do the rules. Band fragments stay bespoke — they are outcome prose, not card prose. |
| Riders | ≤1 per hand; justify each in a code comment | Two riders answer the same question twice; a rider on every card turns the outcome ladder into a floor. |
| Trait options | `essenceCost: 0` | The price was paid by being that person. |
| Zero essence otherwise | only with another cost channel (`costs.doomDelta` / `costs.detectionDelta` / obligation) | A card that is simply free is a pricing bug (THR-885 cost channels). |
| Grants | ids resolve against built catalogs (`validateNudgeGrantRefs`) | Supporting content ships with the card; dead refs no-op silently at runtime (THR-844). |
| Setting envelope | `settings` from the 8-class vocabulary + one opening per class | THR-884: authors never hand-write the 20-subtype list; `validateSettingEnvelope` holds the honesty rules. |

**Card faces are shared; hands are bespoke.** Post-pivot (THR-883), every card face is written library-generic — it must read correctly wherever its type deals (genericity bar: ≥3 *unrelated* encounters) — while the *hand* (type mix, gates, fragments, grants) is authored per encounter. `SHARED_GENERIC_NUDGE_FAMILIES` — focus, luck, blessing, oath, light, strength — survives as the Boost-family seed vocabulary until THR-887 lands `src/data/nudge-card-library.ts` as the canonical card list; extending the library is a code change with a reviewer, not a judgement an authoring session makes alone.

**Where you author it depends on the table, and one of them used to swallow your work silently (THR-838).** Files that build `UnifiedActionTemplate` literals directly — `encounter-anomaly-content.ts`, `effect-shell-proof-templates.ts`, `ascendant-trap-encounters.ts` — take `nudges` on the step and `traitVariants` on the template, and that is the whole story. Files with a `toUnifiedTemplate` converter do **not**: `src/data/encounter-content.ts` (115 templates) and `src/data/faction-encounter-content.ts` each build their `ActionStep`s field by field from a private raw-entry type, so a field the converter does not name never reaches `UNIFIED_ACTION_TEMPLATES`. Until THR-838 that converter named none of the nudge fields, so a hand authored in the largest encounter table was dropped between the literal and the shipped template with no type error. It now forwards `nudges`, `purposeLine`, `factorLines`, `successAtCostAfterimage` and template-level `traitVariants`.

> **If you add any new step-level or template-level field, grep for `toUnifiedTemplate` and treat every hit as a required edit site.** A converter is a field allowlist wearing the shape of a mapping function.

**Prove the hand actually shipped, and score the prose while you are there.** `npm run audit:nudge-batch -- --ids <a,b,c> --hand` reads the **shipped** templates, so the converter is inside the measurement. Its `hand` column reads `yes` only when a hand survived to `UNIFIED_ACTION_TEMPLATES`; a column of `—` across templates you just authored is the bug above. The same run applies the WS3 migration-audit detectors (abstraction, vagueness, not-X-but-Y, thin premise, second person — `src/data/content-eval/nudgeAuditDetectors.ts`) and the WS1 hand checklist (`checkNudgeHand`, same directory). Migrated templates get registered in `WS5_MIGRATED` in `src/data/__tests__/ws5-nudge-migration.test.ts`, which holds them to both permanently.

**Related — the `quintessence_restore` effect primitive.** `divine.rekindle_thread` raises a broken mortal back to `REKINDLE_RESTORE_TO_RATIO`, clears their broken stamp, and appends a `recent_event` receipt naming the god who mended them. Because it needs full `GameState` for that receipt, it routes through the resolution-intercept path in `unifiedActionResolution` (like `plant_trap` / `reveal_secret`), **not** the graph executor. Implementation: `src/engine/rekindleThread.ts`.

---

### Capability 15: Trait Hooks — Content That Knows Who Walked In (THR-774)

**What it is:** four distinct ways an encounter can react to a trait the acting mortal holds. They are separate mechanisms with separate reach, and the authoring checklist makes answering all four **mandatory** — "no hook" is a valid answer, but it has to be a written one.

**Why you care:** traits are the game's universal trigger layer, and an encounter that ignores them plays identically for a saint and a butcher. The hook is what makes the same template a different scene depending on who arrives.

| Hook | Field | What it does |
|---|---|---|
| **Gate** | `requiredTraits` / `blockedByTraits` on the template | Decides whether the encounter is drawable at all. `requiredTraits` takes `TraitPredicate` (`{ traitId, minLevel? }`); `blockedByTraits` takes bare refs (holding it at *any* level blocks). |
| **Variant** | `traitVariants[]` on the template | Fires when the mortal holds the trait: contributes a named forecast modifier (`trait:<id>`), shifts the step's difficulty, and surfaces a player-facing factor line. |
| **Trait-only nudge** | `StepNudge.requiredTrait` + `TraitVariant.addNudgeIds` | A card only that mortal can play. **Hidden**, never dimmed, for anyone who cannot hold the trait — a card you can never unlock is noise, not a goal. Cost 0. |
| **Trait fragment** | `bandProse` on a trait-only card | Prose that only ever reads for the trait-holder. |

**The rule that catches people: hooks may only name traits that `validateTraitRefs()` does not report as dead.** A ref matches ANY-of across node id / short id / display name / tag (THR-786), so the **full node id is the form least likely to rot** — `trait.core.core_integrity.virtue`, not `oathbound`. THR-800 tracks the 62 authored refs that currently fail the sweep; the allowed set is everything that passes, and it grows as those repairs land.

A hook on a dead ref is a gate that never opens. It is invisible to every test that does not enumerate the granted-vs-required *values*, which is exactly how 62 of them accumulated — so check the ref, do not trust that it compiles.

**Canon rule 1 — a trait-derived factor line names its trait.** `TraitVariant.factorLine` is player-facing, and a factor the player cannot trace back to a cause is noise: *"Being True, they read the lock rather than force it."*

**Fail-soft:** a variant naming a trait the agent does not hold is simply absent (no warn — not holding a trait is the ordinary case). An `addNudgeIds` entry naming no existing card is inert with one warning per template.

**Where to find the implementation:** `resolveTraitVariants` / `collectHeldTraitIds` / `buildNudgeHand` in `src/engine/encounters/nudges.ts`; the gate in `filterByPrerequisites` (stage 3 of the encounter filter pipeline); the shared resolver in `src/engine/traitRefValidation.ts`. UL: `Docs/ubiquitous-language/Traits.md`.

---

### Capability 16: Setting Envelopes — Where the Scene Is Allowed to Happen (THR-884)

**What it is:** a closed 8-class vocabulary for placing an encounter, plus per-class opening paragraphs so one template can span several kinds of place without going placeless.

**Why you care:** the engine has always gated templates per location (`locationSubtypes`, enforced by `encounterCache`). What failed was authoring *practice* — placeless prose stamped with all 20 subtypes. Scene-built prose makes that a lie: a hamlet rest scene cannot happen in a capital. Envelopes let you keep the widest **honest** reach.

| Class | Expands to |
|---|---|
| `rural` | hamlet, farmland, mining |
| `urban` | town, city, capital |
| `stronghold` | castle, fort |
| `sacred` | shrine, temple |
| `arcane` | tower |
| `ruin` | ruins, ruined_tower, ruined_city, ruined_village, unexplored_poi |
| `wayside` | camp, oasis, wilderness |
| `battlefield` | battleground |

**How you author it** — three optional fields, all additive (a template that declares none behaves byte-identically):

| Field | Where | What it does |
|---|---|---|
| `settings` | raw entry | The envelope. The converter expands it through `SETTING_CLASS_MAP` into `locationSubtypes`; the cache filter is untouched. |
| `locationTypes` | raw entry | Now the **override** for genuinely specific encounters (a temple rite). Unioned with the envelope when both are present. |
| `openings` | raw entry | One paragraph per declared class. Compiled into a `{frag:opening}` fragment set on the `setting` axis, with the first step's authored narrative as the `'*'` default. |
| `fictionBySetting` | `StepNudge` | Per-class rewrite of a card's `fiction`, for a card that names class-specific scenery. Bound at hand assembly, so every downstream reader keeps reading `nudge.fiction`. |

**Write flexibly, then make it honest.** Flexibility is the default (Christian's explicit direction): reach for the widest envelope you can defend, and pay for it with openings rather than by narrowing to one subtype. Checklist questions 1–4 (where are we, how does it feel, who is here, what must we know) live in the opening; the complication, stakes, and hand are setting-neutral.

**The rule that catches people: declare a class, write its opening.** A template that authors `openings` must cover every class in its `settings` — build-time, fail loud (`validateSettingEnvelope`, `src/data/__tests__/settingClasses.test.ts`). The reverse also fails: an opening for a class the envelope never declares is prose that can never render.

**This is the same resolution mechanism as Capability 12, not a second one.** `setting` is a third identity axis on the THR-573 fragment path, so an opening and a card variant share one lookup chain and one fallback rule.

**Where to look before authoring:** `Docs/canon/setting-coverage.generated.md` (regenerate with `npm run generate-setting-coverage`) reports settings × reach drawable counts and per-family hand composition. Thin cells are scenes not yet written — the floors are **advisory and unset** by design.

**Fail-soft:** an unknown class expands to nothing, so a typo'd template registers *nowhere* rather than everywhere (the safe direction), and the validation test names it. An unclassed location — the ~30 worldgen overlay subtypes (wonders, lairs, anomalies) that no class claims — takes the `'*'` default opening, never a blank.

**Where to find the implementation:** `src/data/settingClasses.ts` (vocabulary, expansion, validator); `toUnifiedTemplate` in `src/data/encounter-content.ts` (expansion + opening compilation); `resolveSettingVariant` in `src/engine/fragmentResolution.ts`; the binding in `gatherNarrativeContext` (`proseEnrichment.ts`) and `buildNudgeHand` (`nudges.ts`).

---

### Capability 17: Carryover Factor Lines — How the Last Step Tilts This One (THR-892)

**What it is:** an outcome-keyed line on `ActionStep` describing how the *previous* step's resolution changes this one — the only authored factor surface besides trait lines that survives the variance rule.

**The variance rule, because it decides what you may write.** A test-panel factor line earns its place only if it **could have read differently on another run**. A static line ("The vault door is iron-bound") reads the same every time the encounter fires, so it informs no decision — it is priced into the step's authored `difficulty` and belongs in the prose. This is why static `factorLines` are retired for new content and why most of the panel is now *derived* rather than authored: the actor's Reach capability and every named world modifier (equipment, terrain, faction, sphere, conditions, divine attention, rule overrides) become lines automatically, with no authoring at all.

**Why you care:** a carryover line is the one place you can hand-write a factor and still obey the rule, because it is keyed on a band the run actually rolled. Write it and a player who scraped through step 1 reads a different panel on step 2 than a player who sailed through.

**How you author it** — one optional field, additive:

```ts
carryoverFactorLines: {
  success_at_cost: {
    text: 'The last door cost her a knuckle.',
    polarity: 'against',
    forecastDelta: -0.04,   // optional
  },
  critical_success: {
    text: 'The first lock gave up its pattern.',
    polarity: 'for',
    forecastDelta: 0.06,
  },
}
```

| Field | What it does |
|---|---|
| `text` | One sentence, ≤ `NUDGE_WORD_BUDGETS.factorLine` (12) words. Names its cause **in the sentence** (canon rule 1) — never a label beside a number. |
| `polarity` | `'for'` / `'against'`. Authored, never inferred. |
| `forecastDelta` | Optional. Rides the named-modifier channel as `carryover:<outcome>`, reaching **both** the panel's forecast floor and live resolution. Takes **zero** new rng — the draw it reads happened last step. |

**The rule that catches people: you key on the outcome the *previous* step landed on, not this one.** Resolution is `UnifiedAction.stepOutcomes[currentStep − 1]` via `priorStepOutcome`. So a carryover map on a template's **first step is dead by construction** — `checkNudgeHand` flags it — and you never need to author all six bands: an unwritten band simply draws no line.

**Fail-soft:** no prior outcome, no authored map, or an unauthored band all yield no line rather than a fallback sentence. A derived line whose source read fails is omitted, never thrown. A step with no variance at all renders the skill line and difficulty alone, which is an honest report ("nothing here tilts this but you"), not a degraded one.

**What does *not* derive, and why that is correct:** omens, doom stage, and season contribute nothing. `forecastAction` reads only `ResolutionInput.actionModifiers`, which `computeResolutionModifiers` fills, and that pipeline reads no omen, doom, or season — so a line for them would name a cause the roll never applied. If those should tilt a step, the fix is wiring them into the modifier pipeline, not into the panel.

**Where to find the implementation:** `src/engine/encounters/stepFactorLines.ts` (derivation); `resolveCarryoverLine` + `priorStepOutcome` + `collectNudgeModifiers` in `src/engine/encounters/nudges.ts`; `ModifierBreakdown.contributions` in `src/engine/resolutionModifiers.ts` (the named list, emitted by the same walk as the totals); sentence templates in `src/data/nudge-stage-content.ts` (`DERIVED_FACTOR_SENTENCES`); budgets in `src/data/content-eval/nudgeHandChecklist.ts`.

---

### Capability 18: Outcome-Keyed Aftermath — The Ending Reflects How It Ended (THR-969)

**What it is:** an optional `byOutcome` map on any `AftermathVariant` (both a choice-keyed `variants[choiceId]` entry and the `fallback`), letting one authored ending fork on the outcome the encounter actually landed on.

**The gap it closes.** `BranchAwareAftermathConfig` keyed only on the `choiceId` of one step. An encounter with no mid-encounter choice — `encounter.slice.unsafe_bridge`, and most linear templates, which ship `variants: {}` — could therefore only ever render its single `fallback`. "Crossed clean" and "fell in the river" produced **identical** aftermath prose and chips, and no amount of content skill could fix it: the ending was inexpressible by construction.

**Why you care:** this is the cheapest way to make a linear, choice-less encounter feel like it noticed what happened. You do not need to promote it to a branching encounter, and you do not need to author all seven bands — write the two or three that actually read differently.

**How you author it** — one optional field, additive:

```ts
aftermathConfig: {
  branchOnStep: 0,
  variants: {},
  fallback: {
    overview: 'The river keeps moving under the bridge, and the keeper keeps taking coppers.',
    changes: [],
    reactions: [{ id: 'slice.bridge.walk_on', label: 'Walk on', intent: '…', effects: [] }],
    byOutcome: {
      critical_success: {
        overview: 'Not a plank complained, and the far bank came up dry.',
      },
      critical_failure: {
        overview: 'The third plank went, and the river kept the rest of the afternoon.',
        reactionPrompt: 'Count what the water kept.',
        reactions: [{ id: 'slice.bridge.haul_out', label: 'Haul out', intent: '…', effects: [] }],
      },
    },
  },
}
```

| Field | What it does |
|---|---|
| `overview` | Optional. Replaces the variant's closing paragraph for this band only. |
| `changes` | Optional. Replaces the variant's authored `changes` — omit it to keep them. |
| `reactionPrompt` | Optional. Replaces the prompt above the reaction buttons. |
| `reactions` | Optional. Replaces the whole reaction set — a disaster can offer different exits than a clean win. |

**Resolution order is choice → outcome band → base variant → fallback.** The choice keying (THR-191) picks the variant *first*, then the band layers on top of **that** variant, field by field. So a band authored on `variants.paid` fires only when the player took the `paid` route and hit that outcome — the two axes compose rather than compete.

**The rule that catches people: you key on `UnifiedActionOutcome`, the seven-value action outcome** (`success`, `failure`, `contested_won`, `contested_lost`, `critical_success`, `critical_failure`, `success_at_cost`). Deliberately **not** the five-band `EncounterOutcomeBand` (a trace type), **not** the six-value `StepOutcome` (which has `near_miss`), and **not** `OutcomeBand` from `outcomeConsequences.ts`. Each of those would type-check while being the wrong domain — the same trap `StepNudge.bandProse` documents.

**Fail-soft:** an outcome with no authored band, or no outcome at all, renders the un-banded variant unchanged — never a blank ending and never a throw. A band that restates only `overview` keeps the variant's prompt, reactions, and changes. Takes **zero** new rng: the band is read from the already-resolved outcome.

**Where to find the implementation:** `resolveAftermathVariant` + `applyAftermathOutcomeBand` in `src/types/unifiedAction.ts` — one shared resolver, called by both the engine's aftermath assembly (`resolveTemplateAftermathVariant` in `src/engine/unifiedActionResolution.ts`) and the stage adapter (`buildUnifiedEncounterStageModel.ts::resolveAuthoredAftermath`). It is deliberately one function: those two surfaces each had their own copy of the choice lookup, and a UI copy that missed the band would render the un-banded ending the engine had already resolved past.

---

### Capability 19: Army Supply Anomalies — Hunger as a Scene Producer (THR-626)

**What it is:** an army's provisions are a stock fed along the trade web, and the three states of *not being fed* each plant an encounter seed. You do not author the hunger; you author what happens when it arrives.

**The one thing to know before writing for it:** `phaseArmySupply` derives a supply line every 4 ticks — a bounded walk over `road` and `trades_with` edges to the nearest location the army's own faction controls that has food to spare — and turns the result into `ArmySupplyTier`:

| Tier | Meaning | Seeds |
|---|---|---|
| `supplied` | Fed. **Nothing at all is produced.** | — |
| `strained` | The line has thinned — distance, banditry, or famine at the far end | `army.supply.forage` |
| `starving` | Nothing is getting through | `army.threshold.mutiny` |
| `starving` + besieging | The besiegers are starving before the city is | `army.supply.siege_lifted` |

**Write to the tier, never to the number.** The larder scalar is private and deliberately unrendered; `supplyTier` is the only read surface, exactly as `stockTier` is for resources. A prose line that says "rations at 12%" is reaching through the abstraction and will read wrong next time the constants are tuned.

**Equilibrium is silence.** A fed army produces no content whatsoever — that is the design, not a gap. If you want more army content, the lever is not more templates on these three hooks; it is that armies get cut off more often, which is an engine tuning question (`ARMY_SUPPLY_MAX_HOPS`, `ARMY_SUPPLY_HOST_MIN_BALANCE`) rather than an authoring one.

**The seed lands on the commander when there is one**, because the commander is the actor a player can actually reach; otherwise on whoever stands at the army's hex. So write these scenes for a named officer with a column behind them, not for an abstraction.

**What the god can do about it is economic, not martial** — and this is the thing worth building content around. Severing a trade route or souring the harvest at the town feeding a host breaks that host without a battle. A `threatened` route (the flag `routeEvents.ts` sets when banditry materializes) *strangles* a line rather than cutting it, so there is a long degrading middle where the army still acts. Scenes that acknowledge an unseen hand on the roads are playing to the actual mechanism.

**A caution learned shipping this:** `army.threshold.mutiny` is prose authored in THR-104 that had **no spawn path at all** until now — `THRESHOLD_ENCOUNTER_TEMPLATES` in `armyAttrition.ts` has zero non-test consumers, so crossing a cohesion threshold only ever produced a notification. Three of those four templates are still unreachable. **Before authoring a template that fires "on a threshold", grep for the thing that actually spawns it.** A template with no producer never renders, and nothing in the pipeline will tell you.

**Where to find the implementation:** `src/engine/armySupply.ts` (pure resolution + `deriveSupplyTier` + `hasReliefLine`), `src/engine/phases/armySupply.ts` (the phase and its seeding), tunables in `src/data/army-supply-config.ts`.

---

### Capability 20: Target-Derived Price — A Card That Costs What the Target Is Worth (THR-1073)

Two optional markers let a template price itself from the *state of the thing it targets*, instead of the one number it wrote down at authoring time.

```ts
// On the template — the price
essenceCost: TIER_ADVANCEMENT_ESSENCE_COST[1],   // the declared baseline
essenceCostContext: 'target_tier_scaled',

// On the step — the roll
difficulty: TIER_ADVANCEMENT_DIFFICULTY[1],
difficultyContext: 'target_tier_scaled',
```

With the markers, `artifact.enchant` / `artifact.empower` charge 4 essence at difficulty 0.20 to advance a Mundane artifact and 14 at 0.50 to advance a Mythic one, reading the authored ramp in `src/data/attachment-tier-content.ts`. Without them nothing changes — the scaling is strictly opt-in, and every other template in the catalog resolves its authored number unchanged.

**Both markers or neither.** They sit at two levels because the two numbers do (price is per-template, difficulty is per-step). Declaring only the cost marker gives you the dearest advancement at the easiest roll, which no authored content means.

**Why it is an enum and not a function.** The obvious shape — `difficultyFrom: (target) => …` — cannot be used. Templates are serialized into `public/action-catalog.generated.json`, where a function field silently becomes `undefined`, so the catalog and the running game would disagree about the price. A declarative marker survives serialization and keeps behaviour out of a data file (NFP #3).

**What an author must know:** the *declared* `essenceCost` / `difficulty` stay meaningful — they are the tier-1 baseline, and they are what any surface reading the template statically (the generated catalog, the Codex) will show. The drawer, the affordability gate, and the roll all resolve the real number.

**Not yet scaled:** duration. `TIER_ADVANCEMENT_DURATION[2..3]` is still unconsumed because the draw happens in `createUnifiedAction`, which has no graph handle — tracked as THR-1100.

**Where to find the implementation:** `src/engine/targetTierScaling.ts` (the only reader of the tables), wired at three seams — `targetActions.ts` (card price + affordability + displayed risk), `playerCastDispatch.ts` (what the pool is charged), `unifiedActionResolution.ts` (what the roll uses).

---

### Capability 21: Companions — Handing a Mortal a Person (THR-1096)

**What it does:** an aftermath can give a mortal someone to travel with. A **companion** is a named person with a profession, a one-line *good for*, and a small always-on bonus — Eldritch Horror's ally cards, not an NPC. They are explicitly **not agents**: no decisions, no movement, no encounters of their own. They ride on one bearer's sheet and make that bearer better at something for as long as they stay.

**Why you want it:** before this, no encounter could answer *"who did you meet on the road?"* with a game object. A rescue could grant a wound, a coin, or a reputation tick — but not a person. Companions are the BOND category's flagship content: the gain and the loss are both story beats with a face on them.

**How to author it.** Two effect kinds, both in the ordinary `EncounterAftermathReactionEffect` vocabulary, so they work anywhere effects work — reaction `effects[]`, step `successMetadata.effects`, nudge card `grants`:

```ts
// A wanderer catches them on the bridge, and stays.
{ kind: 'grant_companion', companionTemplateId: 'companion.wayfarer' }

// Someone makes them a better offer.
{ kind: 'remove_companion', companionTemplateId: 'companion.shadow-broker', reason: 'lured_away' }
```

`targetAgentId` directs either at someone other than the actor; `when` gates them like any other effect.

**The library** is `src/data/companion-templates.ts` — 8 professions across the setting classes (road / settlement / wilds / court) plus one unique. Each template carries its reach contributions, tier, loss condition, tags, and a **join/depart sentence pair** written to the cause→change rule, with `{name}` substituted at mint time. Add a template there rather than inventing one inline; a library test asserts every contribution against `COMPANION_CONTRIBUTION_RANGE` (raw 1–3), which is the guardrail keeping companions a nudge rather than a decision.

**What an author must know — four things that will otherwise surprise you:**

1. **The name is generated, the profession is not.** A template is *"Wayfarer"*; the instance the player meets is a person with a name drawn from the same generator worldgen uses, seeded by the caller's PRNG. Do not write prose that assumes a specific name — use the sentence pair's `{name}` slot.
2. **The cap binds the pool, not you.** `COMPANION_MAX` (3) stops the *reward pool* offering more companions to a full bearer. An authored `grant_companion` deliberately ignores it: an encounter that promised someone delivers them, and the surface shows the crowd honestly. There is no auto-eviction — taking someone's companion is a story event you write, never bookkeeping.
3. **Uniques are once per world.** A template with `unique: true` carries a fixed name and can never be instanced twice, on any bearer. The pool never offers one; only a named `grant_companion` can. A second grant no-ops with a warning.
4. **Nobody vanishes silently.** Every removal — authored, lured, or a contract running out on the condition-expiry beat — emits `companion_departed` with a named reason and returns the template's departure sentence for the surface to show. If you find yourself wanting a companion to just disappear, write the line instead.

**Pool grants** work too: `companion` is a `RewardPoolRecipe.categoryWeights` key, so a roadside-rescue recipe can weight companions while a tomb raid does not. The pool applies the cap and the unique filter; a direct grant does not.

**Where to find the implementation:** `src/engine/companions.ts` (`mintCompanion` / `removeCompanion` / `getCompanions` / `expireCompanions`), the `accompanies` walk in `src/engine/domainCapability.ts`, the `companion` case in `src/engine/rewardPool.ts`, the two effect cases in `src/engine/encounterAftermath.ts`, and the `grant_companion` GraphOp intercept in `src/engine/unifiedActionResolution.ts` (which `action.gold.hire-mercenaries` is the first caller of).

---

### Granting any attachment: `attachment_grant` (THR-1110)

**What it does:** hands the bearer any catalog attachment as an authored consequence — a blessing, a curse, a bestowed power, a spell, or an **agreement**.

**Why you want it:** the palette rule (THR-1082) has always said all seven attachment categories are legitimate consequence material. The vocabulary did not agree: it could grant `condition` (`condition_attachment`) and `possession` (`spawn_artifact`), and nothing else. Reaching for the other five left two bad options — fake the consequence in prose, which is a chip claiming state nothing wrote, or drop it. Measured on THR-1097: *A Bargain at the Crossroads* is literally an agreement and shipped carried by an `encounter_seed`, so the promise was a scheduled encounter rather than a thing the bearer held — nothing read it, nothing gated on it, and it could not be inspected.

**How to author it:**

```ts
// A blessing that fades. The category comes from the template, never declared.
{ kind: 'attachment_grant', templateId: 'reward.blessing.sunlit', durationOverride: 40 }

// An agreement. This one needs a second party.
{ kind: 'attachment_grant', templateId: 'agreement.bargain.promise_given',
  targetAgentId: '$actor', counterpartyId: '$cast:stranger', durationOverride: 132 }
```

**What an author must know — three things:**

1. **You name a thing, not a taxonomy.** There is no `category` field. `templateId` resolves against the agreement catalog first, then the graph's template nodes, and the template's own type/subcategory picks the edge. A dead id is caught at build time by the grant-liveness sweep, which now checks `attachment_grant` refs against every attachment catalog.
2. **An agreement needs two parties, and this is the one category that does.** A condition sits on one person; an agreement is a claim *between* two, so it is edge-backed (`relates_to` with `agreement: true`) and `counterpartyId` is required. Bind it to a cast member (`$cast:<key>`) declared `must-persist` in the template's `supportBundle` — a promise whose holder is garbage-collected at scene end is not a promise. A counterparty that does not resolve writes **nothing** and traces why, rather than leaving a dangling edge, so a missing cast declaration surfaces as a consequence that silently never lands.
3. **`durationOverride` beats the template default**, and `null` makes the grant permanent. Use it when the scene names the term — the crossroads promise passes `SLICE_FULL_MOON_DELAY_TICKS` so the bond and the encounter that collects it fall due together.

**This is a dispatcher, not a new system.** Both write paths already existed: `instantiateReward` for node-backed categories and `instantiateAgreementReward` for agreements — the latter fully built since the attachment-slot design and, until this, with **zero callers**. Nothing about how an attachment is written changed; what changed is that an aftermath can now ask for it.

**Where to find the implementation:** the `attachment_grant` case in `src/engine/encounterAftermath.ts`, the two instantiation paths in `src/engine/rewardPool.ts`, the catalog in `src/data/agreement-reward-catalog.ts`, and the `attachment` ref kind in `src/engine/nudgeGrantLiveness.ts`.

---

## Part 3: The Wiring Checklist — Ask These Before You Write

Before writing any encounter, answer these questions. If the answer to most of them is "not applicable," you may be writing a book page, not game content.

### Before the First Word

1. **Who is this encounter for?** Not just "any agent" — what reach domain, what capability tier, what faction or archetype? This determines `locationSubtypes`, `actorAffinities`, `requiredTargetTraits`, `crudType`, and `motivations`. These fields aren't metadata — they're the scoring system's input for deciding whether this encounter surfaces for the right agents.

2. **What graph state makes this encounter interesting?** Does the agent have allies who could be implicated? Rivals who could interfere? A faction that would care? Artifacts that change the meaning of the scene? **Write scenes where graph state matters** — use conditional blocks to make the prose respond to it.

3. **What should persist after this encounter?** Not just "reputation goes up." What new edges exist in the graph? What hidden marks track secrets? What seeds plant future stories? What intelligence does the agent now possess? **If nothing persists except a reputation number, the encounter is ephemeral.**

### During Writing

4. **Are the narrative fields templates or strings?** Every `narrativeTemplate` field in steps (and `intent` in aftermath reactions) should use enrichment placeholders where the agent's identity, relationships, or possessions would change the emotional texture. `{name}` is the minimum. Conditional blocks (`{?has_faction}...{/has_faction}`) are where the real dynamism lives.

5. **Do the outcomes use different systemic consequences?** Success and failure should produce different *kinds* of persistence, not just different prose. Success might create an edge and seed a follow-up. Failure might plant a hidden mark and damage reputation. **Different outcomes should leave different structural fingerprints.**

6. **Are the aftermath reactions wired?** Each reaction in the aftermath config should declare its effects explicitly: `reputation_score`, `reputation_tally`, `faction_reputation_gain`, `encounter_seed`, `hidden_mark`, `intelligence`, `recent_event`. If a reaction has no effects, it's flavor text — and flavor text that doesn't change the world isn't pulling its weight in a game.

### After Writing (Systems Audit)

7. **Can you trace the encounter's impact three ticks later?** After the encounter resolves, what changes in the world? Can another encounter discover what happened here? Can an agent's biography resolver mention it? Does the location's encounter history capture it? If the answer is "nothing observable changes," the encounter is a dead end.

8. **Does the encounter create asymmetry?** The best encounters create situations where different agents know different things, where hidden marks wait to be discovered, where seeds will bloom at unexpected times. Symmetry (everyone knows the same thing, nothing is hidden, no consequences) is the enemy of interesting game state.

---

## Part 4: Worked Example — From Premise to Wired Encounter

**Premise:** "Pyra organizes a harvest festival at the settlement."

### The Book Page Version (What NOT to do)

```
Pyra gathers the village for a harvest festival. There's music, 
food, and dancing. The festival is a success and everyone is happy.
Reputation +0.05.
```

This is hardcoded fiction. It reads the same regardless of who Pyra is, where the settlement is, who lives there, or what happened last week. Nothing persists. Nothing seeds. Nothing can be discovered.

### The Systemically Alive Version

**Step 0 — The Preparation** (difficulty: 0.3, reach: gold, duration: 3)

```
narrative: "{name} moves through the {location} market at dawn, 
tallying debts and favors owed. {?has_faction}The {faction} could 
make this simple — a word to the grain merchants, and the stores 
open. But {they} want{s} this to belong to the people, not the 
guild.{/has_faction}{?no_faction}Without a guild to lean on, every 
bushel of grain is a negotiation, every musician a personal favor 
called in.{/no_faction} Three days until the solstice. The 
settlement will remember how this went."
```

**onSuccess outcome:**
```
narrative: "The grain arrives. The musicians tune their instruments 
in the square. {name} hasn't slept in two days, but {they} stand{s} 
at the edge of the market watching it come together — not with 
pride exactly, but with the specific relief of someone who bet 
everything on a single hand."
reputationDelta: 0.08
```

**Step 1 — The Festival** (difficulty: 0.25, reach: heart, duration: 2)

```
narrative: "By the second night, the festival has its own momentum. 
{?has_ally}{ally:strongest} finds {them} near the bonfire and says 
nothing — just hands {them} a cup. That's enough.{/has_ally}
{?no_ally}{name} stands alone near the bonfire. Nobody brings 
{them} a cup. {They} pour{s} {their} own.{/no_ally} But somewhere 
in the crowd, someone is watching who shouldn't be."
```

**Aftermath reactions:**

**Reaction 1: "Steady Pyra's patience"** (divine intervention — supportive)
```
effects: [
  { kind: 'reputation_tally', key: 'festival_organizer', delta: 2 },
  { kind: 'encounter_seed', 
    templateId: 'social.quest.festival_aftermath_gratitude',
    delayTicks: 8, 
    seedLabel: "The settlement remembers who fed them" },
  { kind: 'recent_event', 
    message: "The harvest festival drew the settlement together — 
    and drew attention from beyond the walls" }
]
```

**Reaction 2: "Send a vision of the watching figure"** (divine intervention — coercive)
```
effects: [
  { kind: 'intelligence', 
    category: 'agent_network', 
    label: "Spy at the festival",
    detail: "A figure in Arcane Circle colors, counting heads" },
  { kind: 'hidden_mark', 
    category: 'secret_knowledge', 
    severity: 0.4,
    label: "Pyra knows she's being watched",
    revealFamilies: ['investigation', 'arcane_circle'] },
  { kind: 'encounter_seed',
    templateId: 'social.quest.arcane_circle_approach',
    delayTicks: 12,
    seedLabel: "The Circle makes their move" }
]
```

**Reaction 3: "Let her be who she is"** (withdrawn)
```
effects: [
  { kind: 'reputation_tally', key: 'festival_organizer', delta: 1 },
  { kind: 'recent_event',
    message: "The festival ends. The settlement is fed. 
    Nothing else needs to happen — but it will." }
]
```

### Why This Version Is Alive

- **Enrichment placeholders** make the prose respond to Pyra's actual state (faction, allies, pronouns)
- **Conditional blocks** create two distinct emotional textures: one where Pyra has support, one where she's alone
- **Reputation tallies** build toward a persistent "festival_organizer" reputation that will eventually cross thresholds
- **Encounter seeds** plant two different future stories depending on what the god chooses — gratitude from the settlement OR confrontation with the Arcane Circle
- **Intelligence** gives Pyra actionable knowledge about being watched (if the god sends the vision)
- **Hidden marks** create dramatic irony — Pyra knows about the spy, but the spy doesn't know she knows, and investigation encounters can surface this
- **The withdrawn option** is real — it produces a quieter outcome with less seeding, which is the game-mechanical expression of "the god chose not to interfere"
- **The divine intervention choices are genuinely different** — supporting the festival vs. warning about the spy are different kinds of godly action with different consequences

### The counterpart pattern — `{target}` + `bond_change` + `inheritContext` composing (THR-699)

When an encounter is *with* someone — an alliance overture, a duel, a shakedown — three capabilities compose so the prose, the graph, and the follow-up all agree on who that someone is. The shipped `social.forge_alliance` is the live exemplar:

```
narrative: "…a gesture of sense, and {target} reads it that way.
{?target_is_rival}They have crossed each other before. Neither of
them mentions it, which is its own kind of mention.{/target_is_rival}"

// Aftermath reaction "The alliance takes root — {target} will call on {name}."
effects: [
  { kind: 'bond_change',              // the alliance the prose narrates now
    withAgentId: '$target',           // exists as a relates_to edge
    sentimentDelta: BOND_PACT_SENTIMENT_DELTA,
    trustDelta: BOND_PACT_TRUST_DELTA },
  { kind: 'encounter_seed',
    templateId: 'social.forge_alliance',
    delayTicks: 24,
    seedLabel: 'New ally calls in a favor from {name}',
    inheritContext: true },           // the SAME ally returns in the follow-up
]
```

- **`{target}`** names the person the encounter actually bound (fallback: "the other party" — keep the token mid-sentence, the fallback is lowercase). Relation conditionals (`{?target_is_rival}`) change the read when history exists.
- **`bond_change` with `'$target'`** makes the narrated relationship real on the graph — proportionality ladder in `effect-constants.ts` (`BOND_PACT_*` / `BOND_SLIGHT_*` / `BOND_BETRAYAL_*` / `BOND_DUEL_*`); never inline magnitudes.
- **`inheritContext: true`** only where the fiction means *the same person (or place) returns* — a rematch, a called-in favor, a grudge. Not for "someone new arrives."
- **Judgment call that matters:** only substitute `{target}` where the encounter's real graph target *is* the referent. Borderland's bandits and wolves are scene-generated, not graph entities, and those encounters bind location targets — a `{target}` there would render a place name into a person slot. When in doubt, leave the noun generic.

This is what "content is design" means: the systemic wiring isn't decoration on top of the prose. The wiring IS the design. The prose serves the wiring. Knowing that encounter seeds exist is what made the author write a scene where someone is watching — because that watcher can become a future encounter.

---

## Part 5: The Capability Inventory — Quick Reference

For implementation agents translating authored designs into template code.

### Template-Level Fields That Affect Scoring/Filtering

All encounters use `UnifiedActionTemplate` (migrated as of THR-108). `EncounterTemplate` no longer exists.

| Field | Type | What It Controls |
|---|---|---|
| `locationSubtypes` | `string[]` | Which location subtypes surface this encounter |
| `actorAffinities` | `ActorType[]` | Which entity types can perform this (`'individual'`, `'faction'`, etc.) |
| `requiredTargetTraits` | `string[]` | Target node must have all listed traits (AND logic) |
| `requiredNodeProperties` | `Record<string, unknown>` | Target node property key/value pairs that must match |
| `crudType` | `'create'\|'read'\|'update'\|'delete'` | Determines motivation alignment scoring and reputation polarity heuristic |
| `motivations` | `ValuePair[]` | Which axiological value pairs drive agent interest |
| `rarityTier` | `1\|2\|3\|4` | Narrative significance (1=common, 4=legendary); drives visual treatment and unlock logic |
| `reach` | `ReachDomain` | Primary capability domain tested across all steps |
| `requiresReach` | `ReachDomain` | **Reach gate (THR-503).** Player-action cards only: hides this template in the ActionDrawer unless the ascendant's affinity in this reach ≥ `REACH_GATE_MIN_AFFINITY`. A **permanent** filter — the ascendant's primary+secondary reach is fixed for the whole run, so an off-reach card is never shown (not even dimmed as aspiration). Omit → no reach restriction. Use for reach-flavored investment cards. |
| `sphereAffinity` | `SphereName` | Resonance scoring with hex sphere and world-soul |
| `intrinsicTier` | `AttentionTier` | `'background'` / `'shaping'` / `'story_beat'` attention tier |
| `reputationPolarity` | `'positive' \| 'negative'` | Optional explicit override; if omitted, derived from `crudType` |

### Step-Level Fields

| Field | Type | What It Controls |
|---|---|---|
| `reach` | `ReachDomain` | Which capability domain resolves this step |
| `difficulty` | `number` | **0–1 scale** → sigmoid → probability (NOT 0-100) |
| `duration` | `{ min: number, max: number }` | Tick range to resolve (e.g. `{ min: 1, max: 2 }`) |
| `failBehavior` | `'continue_weakened' \| 'fail_action'` | What happens on step failure: continue with disadvantage or end encounter |
| `onSuccess` | `GraphOp[]` | Graph mutations applied immediately on success (usually `[]` for simple encounters) |
| `onFailure` | `GraphOp[]` | Graph mutations applied immediately on failure (usually `[]` for simple encounters) |
| `narrativeTemplate` | `string` | Scene-setting prose; supports all enrichment placeholders |
| `successAfterimage` | `string` | Brief outcome shown in Scene So Far on success (1-2 sentences) |
| `failureAfterimage` | `string` | Brief outcome shown in Scene So Far on failure (1-2 sentences) |
| `successMetadata` | `ActionStepOutcomeMetadata` | Mechanical consequence of success: rewardPool, reputationDelta, tierPromotionEligible, effects |
| `failureMetadata` | `ActionStepOutcomeMetadata` | Mechanical consequence of failure: reputationDelta, rewardPool, effects |
| `nudges` | `StepNudge[]` | THR-773 — authored nudge hand offered to the god in an **attended** encounter. Omit = no hand (feature is opt-in). See Capability 14. |

### Outcome Metadata Fields (ActionStepOutcomeMetadata)

| Field | Type | What It Controls |
|---|---|---|
| `reputationDelta` | `number` | Direct reputation score change on this outcome |
| `tierPromotionEligible` | `boolean` | Allows capability tier promotion if this outcome fires |
| `rewardPool` | `RewardPoolRecipe` | Attachment pool draw on success |
| `effects` | `EncounterAftermathReactionEffect[]` | **THR-783** — aftermath effects applied when *this* outcome side fires. Full effect vocabulary, same as an aftermath reaction. See below. |

**Step-outcome effects (THR-783, shipped 2026-07-26).** You can hang the entire aftermath effect vocabulary on a single step outcome, without authoring an aftermath reaction the agent has to pick. Declare `effects` on whichever side should fire it:

```typescript
failureMetadata: {
  reputationDelta: -0.04,
  effects: [
    { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
  ],
},
```

The list is dispatched through the *same* `applyEncounterAftermathReaction` the reaction path uses, so every effect kind in the table below is available here — conditions, hidden marks, encounter seeds, intel grants, bonds, reach signatures. There is no separate, smaller vocabulary to learn, and no kind can be live on one path and dead on the other.

Three things to know:

* **The side split is `isStepSuccess`, which counts `near_miss` as a success.** A near miss does *not* fire `failureMetadata.effects`. If you want a near miss to leave a mark, put it on the success side or use an aftermath reaction.
* **It is per *step*, not per encounter.** A two-step brawl that fails both steps applies the effect twice (two condition stacks). That is usually what you want for a fight; it is usually not what you want for a one-off narrative consequence — use an aftermath reaction for those.
* **Fail-soft.** A missing target, a missing trait definition, or a throw inside any resolver leaves the step resolution untouched and emits a trace. Content cannot crash the tick loop.

Supersedes `onFailureEffects`, a key the THR-101 tavern migration authored at five sites in place of the legacy `appliesWound` flag. It was never declared on the type and never read by any engine module, so a lost tavern brawl marked nobody from 2026-04-24 until this fix. **If you are reading an old plan doc or changelog row that says `onFailureEffects`, the field is now `effects`.**

> **Resolved (THR-809, shipped 2026-07-27, PR #926).** Condition + mastery trait definitions now seed at world init, so `condition_attachment` / `apply_condition` naming a definition-file condition land in live play. This caveat previously read "open" and suppressed condition authoring long after the fix shipped (caught by the 2026-08-16 palette census: conditions were among the least-used effect families partly on the strength of this stale line) — corrected 2026-08-16 in the consequence-palette-expansion plan PR.

### Aftermath Reaction Effect Types

| Effect Kind | Purpose | Key Fields |
|---|---|---|
| `reputation_score` | Direct reputation delta (actor or faction) | `delta`, `targetAgentId?`, `targetFactionId?` |
| `reputation_tally` | Named counter accumulation — key MUST be a valid `${reach}.positive` or `${reach}.negative` (8 reach domains). Off-axis keys are silently dropped with `aftermath_invalid_tally_key` trace. | `key`, `delta`, `targetAgentId?`, `targetFactionId?` |
| `faction_reputation_gain` | Grow/shrink a faction member's standing directly. Agent must have a `member_of` edge to the faction; non-members are silently skipped. Amount clamped to [-1, +1]. Emits `faction_reputation` trace with `cause:'encounter_aftermath'`. | `factionId`, `amount` |
| `reputation_set` | Absolute reputation assignment (hard reset) | `value` (clamped [0,1]), `targetAgentId?`, `targetFactionId?` |
| `encounter_seed` | Plant future encounter | `templateId` or `encounterFamily`, `delayTicks`, `seedLabel` |
| `hidden_mark` | Track discoverable secret on an agent | `category`, `severity`, `label`, `revealFamilies`, `targetAgentId?` |
| `intelligence` | Grant knowledge to an agent | `category`, `label`, `detail`, `targetEntityId`, `reliability`, `targetAgentId?` |
| `intel_referenced_prose` (THR-139) | Authored "the intel paid off" chronicle line — fires when actor holds a matching record; reliability band picks one of three prose variants; record is read, not consumed | `category`, `prose: { reliable, uncertain?, dubious? }`, `significance?`, `targetAgentId?` |
| `apply_condition` | Attach a trait condition for N ticks (full target resolution: agent, faction, sublocation, **location** — THR-1143) | `conditionTraitId`, `durationTicks?`, `intensity?`, `targetAgentId?`, `targetFactionId?`, `targetSublocationId?`, `targetLocationId?` |
| `remove_condition` | Remove a trait condition (oldest or all) | `conditionTraitId`, `removeAll?`, `targetAgentId?`, `targetFactionId?`, `targetSublocationId?`, `targetLocationId?` |
| `condition_attachment` | Apply a condition trait by template ID; auto-looks up default duration; **triggers mid-encounter tier promotion when the template is the `wounded` condition** (actor only — a wound on a *place* never promotes) | `templateId` (e.g. `'trait.condition.wounded'`), `targetAgentId?`, `targetLocationId?`, `durationOverride?`, `stackCount?` |
| `clearance_gate_tag` | Advance gate progression | `tag` |
| `recent_event` | Emit narrative event (optionally fan out to witnesses) | `message`, `significance`, `witnessAgentIds?[]` |
| `spawn_artifact` | Create an artifact graph node; add possesses/bonded_to/contains edges; optional chronicle event | `artifactName`, `artifactSubtype`, `possessedByAgentId?`, `bondedToAgentId?`, `targetLocationId?`, `chronicleEntry?` |
| `emit_omen` | Append `EmittedOmen` to `GameState.emittedOmens`; drive per-type encounter bias in a scope/radius until expiry | `omenId`, `encounterTypeBias`, `scope` (`global`/`regional`/`local`+radius), `durationTicks?`, `intensity?` |
| `faction_splinter` | Create a new faction node; migrate selected members; add resentful edge | `factionId`, `newFactionName`, `newFactionType`, `memberSelectionStrategy`, `sentimentToward?` |
| `faction_absorb` | Migrate selected members from absorbed faction to absorbing; mark absorbed dissolved | `absorbingFactionId`, `absorbedFactionId`, `memberSelectionStrategy`, `reputationMerge` (`max`/`sum_clamped`/`weighted_avg`) |
| `faction_dissolve` | Mark faction dissolved; disperse members to independent or drift_to_rival | `factionId`, `memberDisposition` (`independent`/`drift_to_rival`), `rivalFactionId?` |
| `faction_declare_war` | Create bidirectional war_sentiment edges between two factions | `factionAId`, `factionBId` |
| `faction_force_peace` | Create bidirectional treaty edges; clamp sentiment above floor | `factionAId`, `factionBId`, `sentimentFloor?` |
| `signature_warhost` (THR-550) | Iron / Warhost reach signature. Marks the faction `mobilized` and raises a force on the existing army node form (`raiseWarhostForce`; not a new node type); strength scales with the actor's primary-sphere power (THR-548). Falls back to a rival-sentiment shift when no leader/location is available. Fail-soft no-op on missing/dissolved/non-faction target. | `factionId`, `baseStrength?` (defaults to `WARHOST_BASE_STRENGTH`), `leaderAgentId?` |
| `axiological_mark_apply` (THR-529) | **Permanent** formative mark — shift the actor's moral **baseline** on one reach's virtue↔vice axis. Moves the standing `AxiologicalProfile` value itself (not the decaying drift layer), clamped to ±`FORMATIVE_MARK_MAX_MAGNITUDE` and to [−1,+1]. Emits a "becoming" chronicle beat + `axiological_mark_applied` trace. **Author-gated, rare by design** — defining-moment encounters only. | `reach`, `signedMagnitude` (±, virtue +/vice −), `targetAgentId?` |
| `sphere_influence_amplify` (THR-551) | Veil / Rend the Gate reach signature. Opens a **sustained rift** at a location → spawns a `ControlEffect` (ticked by `phaseControlEffects`). Each tick amplifies the location's `sphere` via scaled pressure up to a cap (`perTickSphereInfluence`), charges `scaledCost(RIFT_PERTICK_COST, mult)` essence, and rolls a seeded `perTickLeak` chaos pulse (hex corruption + entropy pressure). Magnitude, cost, and leak chance all scale with the actor's primary-sphere power (THR-548) — the downside is the individualization. Relic-buyout of upkeep via `upkeepArtifactId` (THR-509). Traces `ascendant.signature.rift` + `ascendant.signature.rift_leak`. Fail-soft no-op on missing/non-location target or no actor. | `locationId`, `sphere`, `perTick?` (defaults to `RIFT_INFLUENCE_PER_TICK`), `durationMode: 'sustained'` |
| `spawn_unique_location` (THR-552) | Stone / The Great Work reach signature. Mints a **one-of-a-kind** `location` node flagged `unique` (a `location`, not a new node type) owned via a `controls` **edge** from the actor. **Idempotent** — dedup by `uniqueTag`, a second cast is a no-op. Placement precedence `hex?` > `nearAgentId?`'s hex > actor's hex (fail-soft `no_hex` skip). `artifactForgeTier` optionally forges a relic by reusing the `spawn_artifact` path (`artifact_legendary` + `bonded_to`, else `artifact` + `possesses`) — no new artifact code. Both version counters bump (new location = spatial-structure change). Sphere twist supplied by the THR-549 matrix. Trace `ascendant.signature.unique_location`. Fail-soft no-op on duplicate tag / unresolvable hex. | `subtype` (`LocationSubtype`), `uniqueTag`, `hex?`, `nearAgentId?`, `artifactForgeTier?`, `nameOverride?` |
| `bond_change` (THR-695) | Move a directed relationship. Creates or mutates the actor→`withAgentId` `relates_to` edge: applies `sentimentDelta` (result clamped [-1,1]) and, when supplied, `trustDelta` (result clamped [0,1]). A missing edge is created at `BOND_CREATE_INITIAL_SENTIMENT`/`_TRUST` first. `reciprocal` (default true) mirrors the same deltas onto the reverse edge, so a formed alliance is symmetric. `withAgentId` accepts a literal id, `$target`, or `$cast:<key>`/`role:<key>` (bound by the scene-sentinel pass, below). No new node/edge type. Fail-soft no-op (`success:false` trace) on unresolved sentinel, non-actor node, or self-bond. Traces `bond_change_applied` + `encounter_aftermath_effect`. This is how a relationship-shaped outcome (`social.forge_alliance` success) **creates the bond it narrates** instead of leaving the graph untouched. | `withAgentId`, `sentimentDelta`, `trustDelta?`, `reciprocal?` |
| `agent_relocation` (THR-1142) | **Send someone somewhere** — a departure, an exile, a pilgrimage, a family taking the east road. Before this kind no effect could move anyone, which is why the THR-1141 Law 56 census kept finding endings that *described* movement with nothing behind them. Default `mode: 'travel'` writes a `relocationIntent` property on the agent node and **does not move them**: the decision phase reads it through `computeRelocationIntentBonus`, which adds `RELOCATION_INTENT_SCORE_WEIGHT / (1 + hexDistance)` to encounter candidates near the destination — the same additive channel and shape as Draw Together's convergence pull, so there is **no second movement path**. The mortal walks there through the ordinary movement system and the journey stays visible on the map; a good enough reason to stay can still outvote the pull, and that lapse is a story rather than a bug. Arrival (hex distance 0, hex-granular) or TTL expiry clears the intent in the decision phase and traces it, so nobody walks forever. `mode: 'instant'` retargets the single `located_at` edge now, through the same `rebindLocatedAt` the CLI's `move agent` uses — for scene logic only (someone flees the room *now*), and it requires a location destination because a bare hex is not a `located_at` target. `residence: 'set_destination'` stamps observed residence **on arrival** via THR-822's `observeResidence` (never predicted ahead of the agent). Destinations: `location` (accepts `$target` / `$cast:<key>`, bound by `bindReachSignatureTargets` since the field is nested), `hex`, `nearest_settlement` (resolved from the agent's hex at apply time, settlement subtypes only, excludes distance 0), `away` (seeded pick, candidates sorted by id before the draw so it does not depend on graph insertion order). Fail-soft no-op with a `failReason` trace on: unresolvable destination, non-agent target, no actor id, `instant` to a bare hex. Traces `aftermath_agent_relocation`, plus `relocation_arrived` / `relocation_expired` from the decision phase. Debug: CLI `agent <name>` prints a `Travelling to:` line; `window.__DEBUG.getRelocationIntent(agent)` returns the full intent. **Authoring caveat (measured, THR-1148):** the pull is applied per *encounter candidate*, so it steers hard toward a destination that has something happening (measured: destination candidate `0.0101` → `0.6985`, agent closed 26 → 20 hexes in 60 ticks) and only weakly toward an empty one (`0.5 / (1 + 6 hexes)` ≈ 0.07 against live scores of 0.7–1.0; one agent aimed at a quiet settlement drifted 6 → 12 hexes *away*). **Relocate people toward places the world has something happening**, and treat a quiet destination as a wish rather than a plan. | `destination`, `targetAgentId?`, `mode?`, `ttlTicks?`, `residence?` |
| `membership_change` (THR-1144) | **Move one person in, out, or up a faction** — a recruitment, an expulsion, a defection, a promotion. The bulk verbs (`faction_splinter` / `faction_absorb` / `faction_dissolve`) could already migrate members wholesale and `faction_reputation_gain` could move an existing member's *standing*, but nothing could make someone a member who was not one, so an ending that recruited you had to say so in prose alone. Writes the `member_of` edge through `src/engine/factionMembership.ts`, in the **same shape** `processFactionJoinOutcome` writes (same edge id, same `role`/`rank`/`joinedTick`/`reputation`/`factionDefId` set), so a card-made member is byte-identical to a quest-made one and `graphQueries` / `socialLeverage` / `agentDetail` / `factionReputation` see no difference. `op: 'join'` is **idempotent** — an existing member is left exactly as they are (`already_member`), so a replayed encounter cannot reset someone's seniority. `op: 'leave'` removes the edge. `op: 'rank_delta'` moves `rank` by `rankDelta`, clamped to `[0, FACTION_RANK_MAX]` on the edge's canonical **0 (recruit) → 1 (leader)** scale — and that write **ships with its reader**: the `faction_rank:<n>` predicate, dead since it was written (it read `agentNode.properties.factionRank`, which nothing writes, so it was permanently false — THR-805 declined to build on it), now reads the highest numeric `member_of.rank` across the agent's memberships and parses a **float** threshold. So `when: 'faction_rank:0.6'` is a live gate on any aftermath effect. **`factionId` accepts the definition id** (`'mercenary_company'`) as well as a node id: `factionSeeding` keys nodes `faction_def_<definitionId><chapterSuffix>`, so `resolveFactionNodeId` bridges the two — node id wins, then a `factionDefId` scan preferring a chapter the agent already belongs to, else the lowest id (deterministic, NFP #3). It is also sentinel-capable (`$target` / `$cast:<key>`), which **widens** the four other `factionId`-carrying kinds at no behavioural cost, since a literal id is not a sentinel. `chronicle: true` emits a `faction_member_joined` / `faction_rank_changed` event into **both** `tickEvents` and `recentEvents` — the rolling buffer is the one the chronicle and notification surfaces read, so writing only to `tickEvents` would announce nothing. Fail-soft no-op with a `failReason` trace on: unknown/non-faction `factionId`, missing agent, `join` for an existing member, `leave`/`rank_delta` for a non-member, `rank_delta` with no `rankDelta`. A string rank (`'war_chief'` on army edges) coerces to 0 rather than poisoning the comparison with `NaN`. Traces `aftermath_membership_change`. Debug: CLI `eval state.graph.getOutgoingEdges('<agent>','member_of')`. **Caveat:** `faction_reputation_gain` in the same effect list still takes the *unresolved* id and silently no-ops on it (THR-1150) — pair a `join` with reputation only once that lands. | `factionId`, `op`, `targetAgentId?`, `rankDelta?`, `chronicle?` |
| `reward_draw` (THR-1146) | **Hand out a *random* matching prize as the consequence of a specific ending** — "the keeper pays you off with a blade from the strongbox" draws some `#weapon`, not one authored blade. The machinery is not new: `RewardPoolRecipe` (`categoryWeights` + `tagFilters?` + `sphereTint?`) and `assembleRewardPool` have always resolved a tag-filtered, tier-weighted draw — but only from step `successMetadata`/`failureMetadata`, so a *band* or a *reaction* could previously only spawn one fixed artifact. This kind is the same recipe reaching the rest of the effect vocabulary, and it adds **no tuning surface of its own**. Tier curve and bad-outcome chance come from the action's already-resolved outcome (`mapActionOutcomeToRewardOutcome` — a contest won reads as success, lost as failure), exactly as the step route takes them from the step's, so a better ending draws a better prize for free. **Both routes run one implementation**, `drawSeededReward` in `src/engine/rewardPool.ts`, keyed (seed, tick, actor, template) with the bad-outcome flip rolled before the draw — the step route was moved onto it in the same change, so the two cannot drift. **`tagFilters` must name tags that exist, and tags carry their `#`**: the library writes `'#weapon'` (25 live templates across all four tiers in a seed-42 world), and `'weapon'` is a well-typed string that matches nothing. Every tag must match — `['#weapon','#potion']` is jointly empty though both are individually live. A recipe matching zero templates is a silently empty pool, the THR-844 rot class, so `validateRewardDrawPools` resolves every recipe against the live catalogs at authoring time and fails it in `check:encounter`'s liveness stage — running the runtime's own `rewardCategoryNodeQuery` / `rewardCandidateMatchesTags` predicate rather than a reimplementation, so gate and engine cannot disagree. `check:encounter --all` only sees the `encounter.*` prefix, so the corpus-wide invariant lives in `src/engine/__tests__/rewardDraw.test.ts`. Registry-backed categories (`companion`, `agreement`) resolve through their own filters, not the node catalog. `targetAgentId` is sentinel-capable (`$target` / `$cast:<key>`) and defaults to the actor. Fail-soft (NFP #4): an empty pool emits `aftermath_reward_draw_empty` carrying the whole recipe and the encounter proceeds — sibling effects in the same reaction still apply. Traces `aftermath_reward_draw`. Debug: CLI `eval state.graph.getOutgoingEdges('<agent>','possesses')`. Exemplar: `mc.quest.collect_bounty` → `mc_bounty_kept_the_arms`. | `pool` (`RewardPoolRecipe`), `targetAgentId?` |

**Scene-targeting sentinels (THR-695, supersedes the THR-114 `role:` note):** `bindAftermathSceneTargets` runs at the top of aftermath dispatch (after the THR-555 reach-signature pass) and rebinds sentinel values on `targetAgentId` / `targetFactionId` / `targetSublocationId` / `withAgentId`:

- **`'$target'`** → the action's resolved `targetId`, **only when the target's node kind matches the field** (an agent field pointed at a location is left unbound, and the effect no-ops down its existing invalid-target path).
- **`'$cast:<key>'`** (and the legacy alias **`'role:<key>'`**) → the node bound to that key in `action.supportBindings`. Author cast placeholders (Slice C) and their aftermath sentinels against the same support-bundle keys, so prose and consequence name the *same* person.

Every processed sentinel emits an `aftermath_sentinel_bound` trace (`resolvedNodeId: null` when it can't resolve — the fail-soft signal). Literal ids and effects with no sentinel are untouched. Below the sentinel pass, the older priority resolution still applies: explicit agent > explicit faction > explicit sublocation > action actor (fallback). See `src/data/encounters/examples/` for the patterns: `example.betrayal_multi_target.ts` (`role:victim` hidden_mark + `role:guild` reputation_score), `example.council_disowns.ts` (`role:lorekeepers` reputation on faction), `example.shrine_consecration.ts` (`role:shrine` on sublocation) — these are now genuinely functional once the action supplies the matching bindings.

**Use `reputation_set` only when the fiction demands "it is now literally X"**, not for ordinary outcome nudges — those belong to `reputation_score` with a delta.

#### Conditions and wounds (THR-117)

Wounds are **not a separate subsystem** — they are a condition subcategory, fully wired into the same slot, overflow, and attachment pipeline as diseases, curses, blessings, and bestowed effects.

**Five condition subcategories:** `wound` (cap 3), `disease` (cap 2), `curse` (cap 2), `blessing` (cap 2), `bestowed` (cap 2). Slot caps are in `src/data/attachment-slot-constants.ts:CONDITION_CAPS`.

**Authoring surface for UnifiedActionTemplate aftermath:** Use `condition_attachment`. Example:

```typescript
{ kind: 'condition_attachment', templateId: 'trait.condition.wounded' }
```

The executor (a) resolves `templateId` from `condition-trait-content`, (b) looks up the default duration from `CONDITION_DURATIONS`, (c) creates a `has_trait` edge on the target agent, (d) emits `encounter_aftermath_effect` trace, and (e) **returns a `woundApplied` signal** when the condition is the wounded trait — which is fed into `checkMidEncounterPromotion` to promote the encounter from `background → shaping` tier, making the story beat visible in the chronicle.

**Overflow is automatic:** When a third wound is applied, `resolveWoundOverflow` fires automatically on the next tick (phase 2a.85), rolling against `WOUND_INCAPACITATION_CHECK_DIFFICULTY = 0.4`. Failure produces a `scar` consequence trait. You do not need to author this.

**Key constants:** `CONDITION_WOUNDED_DURATION = 24` (2 game days), `WOUND_INCAPACITATION_CHECK_DIFFICULTY = 0.4`, `CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT = 1`.

**Durations expire on `ticksRemaining`, not `durationTicks` (THR-761, fixed 2026-07-26).** `decayConditions` (`src/engine/conditionDecay.ts`) is the only tick-driven expiry path and it counts down the `has_trait` edge property **`ticksRemaining`**. Both `apply_condition` and `condition_attachment` now write it alongside `durationTicks`; before this they wrote only `durationTicks`, which has no production reader, so every authored duration was decorative and the condition was permanent. As a content author you do not need to do anything — author `durationTicks` (or let `CONDITION_DURATIONS` supply the default) and expiry follows. If you add a **new** site that mints a `has_trait` edge meant to expire, write `ticksRemaining`: the two fields are kept distinct on purpose (`ticksRemaining` = live counter, `durationTicks` = authored total kept as provenance and as the duration-UI denominator), and a duration of `0` means indefinite, expressed by omitting `ticksRemaining` entirely.

**A condition can sit on a *place*, not only a person (THR-1143, 2026-08-16).** Add `targetLocationId` to any of the three condition effects and the `has_trait` edge lands on a location node — a pass closed for the season, a town under a plague scare, a square under watch. This is a **widening, not a new effect kind**: same edge, same `ticksRemaining` counter, same single `decayConditions` expiry path, so nothing you know about authoring a condition changes except who carries it. `$target` binds the field when the action targeted a location. Sublocations keep `targetSublocationId` — `targetLocationId` will not bind a node with a `parentLocationId`, so a tavern inside a keep never resolves to both.

Starter set (`CONDITION_TRAIT_DEFINITIONS`, seeded at world init like the personal ones):

| Id | Default duration | Movement tax | Notes |
|---|---|---|---|
| `trait.condition.location.pass_closed` | 360 (a season) | ×8 (`LOCATION_IMPASSABLE_MULTIPLIER`) | A **soft** block by design — a hard one strands agents whose only road home runs through it (NFP #4) |
| `trait.condition.location.festival` | 36 | ×1.2 | Crowds slow the streets; gating flavour |
| `trait.condition.location.plague_scare` | 168 | ×1.6 | Travellers route around it |
| `trait.condition.location.under_watch` | 84 | *none* | Deliberate: being watched changes what you can *do* in a place, not how long it takes to walk in |
| `trait.condition.location.harvest_blight` | 480 | ×1.6 | Pairs with the existing blight graph op |

**Two systems read it, which is the point** (UI Law 56 at world scope — a write nothing consumes is hollowness one level down). First, **template gating**: `requiredTargetTraits` already matched a location target's `has_trait` edges and now has content to match, so a festival-gated template becomes eligible while the festival runs and stops when it lifts. Second, **movement cost**: `LOCATION_CONDITION_MOVEMENT_TAX` (`src/data/condition-trait-content.ts`) maps a condition id to a multiplier on entering that place, multipliers compound, and the tax lifts by itself when the edge expires because the tax *reads the edge* — there is no second lifecycle to keep in step. A condition absent from that map costs nothing to travel through; that is the designed default, not an omission, because most of what can happen to a place is not about the road. Tuning travel feel is editing that one table (NFP #1).

Player-facing, the location detail panel (`LocationProfileModal`) lists what a place is carrying and for how much longer, in words. **Authoring caution:** the panel renders one row per condition, so a place is not a dumping ground — if an ending wants ambient encounter *bias* rather than a readable state, emit an omen instead; two bias channels would drift.

**Verification:** `src/engine/__tests__/conditionOverflow.test.ts` (overflow pipeline), `src/engine/__tests__/conditionAttachment.test.ts` (aftermath effect), `src/engine/__tests__/conditionExpiry.test.ts` (expiry through the real decay loop — asserts the condition is *gone*, not merely that the edge was written), `src/engine/__tests__/locationConditions.test.ts` (places: write, sentinel binding, expiry, and both readers falsified in each direction).

---

### Capability 10: Conditional Aftermath Gates + Thread Mutations (THR-116)

#### The `when` predicate gate

Every `EncounterAftermathReactionEffect` can carry an optional `when?: EffectPredicate` field. If the predicate evaluates false, the effect is skipped silently (emits `aftermath_effect_skipped_by_when` trace). This lets one reaction branch serve multiple situations.

**Available predicates:**
| Predicate | Fires when |
|-----------|-----------|
| `'health_high'` | Agent's doom fraction ≤ 0.25 (healthy) |
| `'health_low'` | Agent's doom fraction ≥ 0.75 (badly hurt) |
| `'in_combat'` | Agent has `status_in_combat` trait |
| `'at_sea'` | Agent is in coastal/ocean biome |
| `'near_water'` | Coastal, river, lake, swamp, or archipelago biome |
| `'reputation_above:0.6'` | Actor's `reputationScore` > 0.6 |
| `'reputation_below:0.3'` | Actor's `reputationScore` < 0.3 |
| `'has_mark:suspicion'` | Actor has at least one hidden mark of that category |
| `'has_intel:patrol_routes'` | Actor has an intelligence record in that category |
| `'faction_controls:city_north'` | Actor's faction controls the named region |
| `'alone'` | No allies or enemies share the actor's exact `located_at` node (see Capability 11) |
| `'outnumbered'` | `enemies > allies + 1` at the actor's location (see Capability 11) |

```typescript
// Effect fires only when the actor is reputation-worthy
{ kind: 'reputation_score', delta: 0.1, when: 'reputation_above:0.6' }

// Effect fires only when wounded
{ kind: 'encounter_seed', encounterFamily: 'revenge', seedLabel: 'They remember the wound', delayTicks: 12, priority: 1.5, when: 'health_low' }
```

See **Capability 11** for full documentation on `alone` and `outnumbered`.

#### Thread mutation effects

Four new effect kinds directly mutate thread-bond edges:

| Kind | What it does |
|------|-------------|
| `thread_strengthen` | Increases `edge.properties.strength` by `delta`, clamped at 1.0 |
| `thread_weaken` | Decreases `edge.properties.strength` by `delta`, clamped at 0.0 |
| `thread_break` | Removes the thread edge entirely; emits a `TickEvent` |
| `thread_branch` | Creates a new thread edge from `ascendantId → newMortalId` with `initialStrength` and a `branchedFromMortalId` back-reference |

```typescript
// Strengthen after trust-building reaction
{ kind: 'thread_strengthen', ascendantId: 'asc.player', mortalId: 'npc.spymaster', delta: 0.15 }

// Break the thread if the bond shatters
{ kind: 'thread_break', ascendantId: 'asc.player', mortalId: 'npc.betrayer' }

// Branch a new thread from an existing one
{ kind: 'thread_branch', ascendantId: 'asc.player', sourceMortalId: 'npc.mentor', newMortalId: 'npc.protege', initialStrength: 0.4 }
```

Thread strength is visible in `ThreadsPanel` as a thin animated bar (only shown when `< 1.0`). Mutations are inspectable via `thread_mutation_applied` / `thread_mutation_skipped` trace categories in the DebugPanel.

#### Aspect apex grant — `grant_aspect` (THR-479)

The capstone of divine influence. When a mortal has been an Enthralled (tier-4) thread long enough, the engine seeds the bespoke `encounter.apotheosis.ascension`; the **accept** branch's aftermath carries `grant_aspect`, which raises the mortal into a partial *Aspect of the god* — the apex milestone **beyond** the five Influence tiers (not a sixth rung).

| Kind | What it does |
|------|-------------|
| `grant_aspect` | Creates a permanent `aspect_of` edge (ascendant → mortal), bumps the mortal's `importance` (narrative gravity), queues a chronicle beat, emits `aspect_attained`. Idempotent — a no-op if the pair is already an Aspect. |

```typescript
// On the accept branch of an apotheosis covenant — ids omitted resolve from
// the encounter actor (mortal) + that mortal's incoming thread (ascendant).
{ kind: 'grant_aspect', reason: 'apotheosis' }
```

The `aspect_of` edge is **never garbage-collected**: when the mortal dies, the death phase retains the node + edge as a *mythic echo* (`mythicEcho: true`, `aspect_echoed` trace) instead of removing them — the bond outlasts the body. A living Aspect contributes `ASPECT_ESSENCE_PER_TICK` essence (a conduit); a mythic echo contributes nothing. Surfaced as the "❂ Aspect" badge in `ThreadsPanel` (reads the edge, not the tier) and via `window.__DEBUG.getAspects()`. Tuning lives in `src/data/aspect-content.ts`.

#### Action unlock — `unlock_action` (THR-500)

Hands the **player** a new action card as the aftermath of a resolved beat (or any encounter). This is how *Ascendant Beats* deliver capabilities as earned story moments instead of a wall of cards at turn 1.

| Kind | What it does |
|------|-------------|
| `unlock_action` | Pushes `actionId` into the run-scoped `unlockedActionIds` set, emits `action.unlock.granted`. The action drawer already filters on that set via `isActionRevealed()`, so the granted card simply appears — **no drawer wiring needed**. Idempotent (granting an already-unlocked id is a no-op). Fail-soft: an unknown `actionId` is pushed harmlessly (no template matches, so nothing reveals). |

```typescript
// On the resolving branch of a beat that teaches a new verb:
{ kind: 'unlock_action', actionId: 'invest.endow_artifact', revealStyle: 'card_flight' }
// revealStyle: 'card_flight' (default) animates the reveal; 'silent' grants without interrupting.
```

Starter actions (`STARTER_ACTION_IDS` / `starter: true`) are always available and do not need unlocking. Use `unlock_action` for the *unlockable-generic* and *reach-gated* buckets — the cards a beat or selection grants over the course of a run.

**Gate a pool beat to world state, and lean it toward the god's identity (THR-516).** A pool `BeatDefinition` can carry two optional descriptors the Director honours at draw time. **`eligibility`** drops the beat from the cadence draw unless it holds against world state — `{ kind: 'unintroduced_group' }` (a culture/faction the god hasn't met still exists) or `{ kind: 'unthreaded_target' }` (a notable actor/location is still unthreaded); omit it (or use `{ kind: 'always' }`) for beats that never run dry, like `selection`. **`identity`** scales the beat's draw weight toward the ascendant — `{ reach: 'veil', sphere: 'mind' }` makes a veil/mind god draw that beat more often (reach uses `domainAffinities`, sphere matches `sphereAlignment`). Both are serializable and unit-tested in `ascendantBeatIdentity.test.ts`; both default to no-op so untagged beats behave exactly as before. When you author the pool-beat templates, tag introduction/investment beats with the matching eligibility and give each beat an `identity` so the living world reflects who the god is, not just RNG.

**Two ways a beat grants a card (THR-517).** When the player resolves a beat, `resolvePendingBeat` (the running-sim resolve path) reads the **`grantsActionIds`** array you declare on the `BeatDefinition` (`src/data/ascendant-beat-content.ts`) and unlocks them directly — a **non-selection** beat grants *all* of them; a **selection** beat grants *exactly the one* the player picks in the choose-1-of-N picker. So the simplest beat needs no aftermath effect at all: list the card ids in `grantsActionIds` and resolution unlocks them (emitting `action.unlock.granted` per id, deduped). Reserve the `unlock_action` aftermath effect for beats backed by an authored encounter *template* whose grant is conditional on a branch outcome (e.g. unlock only on the triumph rung). Both paths write the same `unlockedActionIds` set; don't do both for the same card. Every id you list must resolve to a real `UnifiedActionTemplate` — an unbacked id fails soft (nothing reveals) but pollutes the unlock catalogue, so keep `grantsActionIds` truthful.

**A beat can grant a *per-run* reach signature (THR-523).** When the card a beat should grant depends on the *run* — not a fixed id — use the **`grantsReachSignature: 'primary' | 'secondary'`** slot on the `BeatDefinition` instead of `grantsActionIds`. `resolvePendingBeat` resolves it through `resolveReachSignatureGrant(state, slot)` (`src/engine/ascendantBeat.ts`), which ranks the ascendant's `domainAffinities` (highest = primary, second = secondary; deterministic, `REACH_DOMAINS` tie-break) and maps the chosen reach to its `invest.<reach>.<name>` signature via `REACH_SIGNATURE_ID_BY_REACH`. The grant is **orthogonal to `grantsActionIds`** — a `selection` beat can carry a god-path choice *and* unconditionally grant a signature (that is exactly what Beat 4 "A Path Opens" does: dreamer/prophet/patron pick + primary signature). It writes the same `unlockedActionIds` set and emits `action.unlock.granted`; the shipped `getTargetActionSlots` reach gate (`requiresReach`, THR-503) then hides the signature for runs whose two domains exclude that reach, so an out-of-domain grant can't leak into the hand. Fail-soft: a slot with no ranked reach (e.g. a single-domain ascendant asked for `'secondary'`) is a clean no-op. Gate a repeatable acquisition beat with the `unacquired_reach_signature` eligibility predicate (`isBeatEligible`) so it retires once every in-domain signature is learned — that's how `beat.pool.invest.reach_signature` grants the secondary without ever offering an empty beat. Use this whenever "which card" is a property of the ascendant's identity rather than a fixed authored id.

**A beat can *seed graph state*, not just grant cards (THR-520).** A spine `BeatDefinition` can carry an optional **`seedsGraph`** tag (`src/types/ascendantBeat.ts`) so that resolving the beat itself mints the throne/artifact the prose narrates — instead of only handing the player a card they must then fire. Two variants ship: `{ kind: 'home_seat' }` (seats the ascendant at The First's settlement via `setHomeSeat`, starting `ESSENCE_PER_SEAT` mana income) and `{ kind: 'threaded_artifact' }` (mints a sphere-flavored artifact, `thread`s it from the ascendant, and gives it to the bonded First via a `possesses` edge). The seeding runs in `src/engine/ascendantBeatSeeding.ts` (`seedBeatGraph`), is recorded on `BeatRecord.seededNodeIds`, emits one `ascendant.beat.seeded` trace (the add_node/add_edge surface), and is fully fail-soft (no First / no location / no sphere → empty seed + `failSoft` trace, the beat still grants its cards). Use this when a beat *promises a thing exists in the world* (a seat, a relic, a bound place) and you want the player to hold it immediately rather than walk a card to it; keep using `grantsActionIds` alone when the beat teaches a *verb* the player then wields. Don't tag a beat whose subject another system already creates — Beat 0 carries no tag because `MeetingEncounter` already threads The First.

**A beat's content template can run *arbitrary aftermath* on resolution (THR-522).** Beyond the fixed `grantsActionIds` (cards) and `seedsGraph` (throne/artifact) paths, a beat's matched `UnifiedActionTemplate` (the pool-beat content in `src/data/ascendant-pool-beat-templates.ts`, keyed `templateId === beatId`) may now declare aftermath the same way an encounter does — `aftermathConfig.fallback.reactions[].effects` — and `resolvePendingBeat` runs those reactions through the shared `applyEncounterAftermathReaction` resolver on resolution. This unlocks the full typed aftermath vocabulary (Part 5) for beats: `unlock_action`, `encounter_seed`, structural graph ops, faction/reputation effects. The beat is addressed to the god, so the synthesized resolution action's *actor* is the beat's bound subject when present (the introduced culture/faction, see `{group}` below) and the ascendant otherwise — author effects that resolve relative to the actor (e.g. faction reputation) with that in mind. Additive + fail-soft: a template with no `aftermathConfig` is the documented grant-only fallback (every shipping beat today), and a thrown resolver never wedges the beat. Use this when a beat's consequence is *richer than a card grant* — planting a follow-up encounter on the introduced group, shifting a faction's standing, seeding a structural change — rather than smuggling it into `grantsActionIds`.

**Introduction beats name their bound group (THR-522).** An `introduction` pool beat (`{ eligibility: 'unintroduced_group' }`) now has its specific subject — the first un-introduced culture/faction — bound into `PendingBeat.boundNodeIds` by the Director at *offer* time, recorded on `BeatRecord.boundNodeIds` so later draws never re-introduce the same group. The beat's content template names it via the **`{group}`** enrichment placeholder, which the modal resolves to the bound node's name (fail-soft to neutral phrasing when unbound). Author introduction prose with `{group}` where you want the specific people named; keep `{name}` for The First (the enrichment anchor). The bound subject is inspectable in the DebugPanel Beats tab and via `__DEBUG.beatSchedule().pending.boundNodeIds` / `.boundNames`.

#### Delivery beats — host a branching encounter as a divine vision (THR-506)

If you author a **branching encounter** (`UnifiedActionTemplate` in `src/data/encounters/`, registered in `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`), you do **not** need to also solve "how does a mortal ever reach this?" — the *delivery-beat adapter* (`src/engine/deliveryBeatAdapter.ts`) automatically wraps every such template into a `delivery` Ascendant Beat the Director can offer the player directly, **as a divine vision that sidesteps the encounter's reputation/mark/court prereqs**. This is the answer to THR-452: rich branching content that ambient simulation never matures the preconditions for is still reachable, because the god is shown it rather than a mortal walking into it.

- Authoring a new branching encounter and registering it in `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` is enough — `ALL_DELIVERY_BEATS` picks it up at module load (id `beat.delivery.<templateId>`). No per-encounter beat wiring.
- A delivery beat is the **host shell**; its `templateId` points at your encounter, so its content (steps, authored choices, aftermath) is the same content that runs anywhere else — no duplication.
- The Director draws delivery beats at `DELIVERY_BEAT_WEIGHT × BEAT_KIND_WEIGHTS.delivery`, deduped against already-delivered beats. The offer→enter→resolve player path is THR-514; until then, fire one headlessly with the CLI (`beat fire beat.delivery.<templateId>`) or `__DEBUG.fireBeat`.

#### Ascendant action primitives — the per-graph investment toolkit (THR-509)

Four reusable building blocks live in `src/engine/ascendantPrimitives.ts`. They exist so the early *expression cards* (imbue / consecrate / bestow / anoint — THR-508) and future ascendant verbs are cheap to author: the verb is universal, the magic it produces is flavored by the ascendant's domain + sphere. **Reach for these instead of hardcoding card-specific effect logic.** All four are pure, unit-tested in isolation, fail-soft (unknown node/sphere/artifact → no-op + warn), and emit an `ascendant_primitive` trace.

| Primitive | Helper | What it does |
|-----------|--------|-------------|
| `relic_upkeep_substitute` | `getUpkeepStatus(effect, graph)` | A sustained `ControlEffect` whose `perTickCost` is **waived** while a designated artifact exists. Set `ControlEffect.upkeepArtifactId` at mint time (point it at a `lossCondition:'permanent'` artifact). `phaseControlEffects` waives the cost each tick while the relic lives, and lapses the effect (`upkeep_relic_destroyed`) if the relic is destroyed. *Use it for:* "pay a high one-time cost to mint a relic that sustains a consecration with zero ongoing upkeep." |
| `co_located_thread_aura` | `applyCoLocatedThreadAura(graph, locationId, ascendantId, spec, tick)` | A **location-scoped per-tick** mutation: for every threaded agent co-located with `locationId` (and, by default, its contained sublocations), add `spec.magnitude` to a thread-edge field (default `ticksAtCurrentTier`, which drives tier promotion). Carry it on `ControlEffect.perTickThreadAuras` and the control phase applies it every tick. *First consumer:* consecrate's faith-spread (`+CONSECRATE_DEVOTION_PER_TICK`). |
| `chosen_status_grant` | `applyChosenStatusGrant(graph, nodeId, domain, byAscendantId, tick)` | Flags a node `chosen` (writes `node.properties.chosen`) and records a power picked from the `(nodeType × ascendant domain)` `CHOSEN_POWER_TABLE`. *First consumer:* anoint (faction — faction nodes are `actor` type). Re-granting overwrites (latest patron wins) and reports `alreadyChosen`. Extend `CHOSEN_POWER_TABLE` as you author new chosen powers. |
| `sphere_flavored_effect` | `pickSphereFlavoredEffect(sphere, rng, tick?)` | Given a sphere, picks a concrete `AttachmentEffect` from `SPHERE_EFFECT_TABLE` via an **injected seeded PRNG** (`mulberry32(seed)` from `src/lib/prng.ts`) so one verb yields domain-appropriate magic. *First consumer:* imbue. Extend `SPHERE_EFFECT_TABLE` to widen the flavor pool. |

**Authoring an ascendant verb card (the imbue pattern, THR-508).** `imbue` is the first shipped expression card and the reference for the rest. To add an ascendant verb whose effect needs the ascendant's sphere/reach + a graph mutation:

1. Add a custom `GraphOpType` (e.g. `'imbue_item'`) in `src/types/graphOp.ts`.
2. Intercept it in `unifiedActionResolution.ts`'s `executeStepResult` — filter it out of the `executeGraphOps` batch and dispatch to your engine helper (sibling block to `anoint_successor` / `faction_verb`). This is where you have `state`, `tick`, and a seeded `rng` in scope, which the plain `graphOpExecutor` does not.
3. Put the helper in `src/engine/ascendantExpression.ts`. Read the ascendant's sphere via `getAscendantPrimarySphere` (or reach affinities via `getAscendantDomainAffinities`, THR-503), call the relevant THR-509 primitive, mutate the graph, emit an `ascendant_expression` trace. Fail-soft (no-op + trace) on missing/wrong-type targets — never throw.
4. Author the `UnifiedActionTemplate` with `onSuccess: [{ op: 'imbue_item', nodeId: '$target' }]` and the right `targetCategories`. **Verify the mutation is actually read** by a consumer (imbue appends to an artifact's `properties.effects`, which `collectAttachmentEffects` reads off `possesses`-edge artifacts) — granting an effect nothing reads is dead content.

```typescript
// Consecrate: a sustained site that spreads faith, optionally relic-backed.
const consecration: ControlSpec = {
  perTickCost: { spirit: CONSECRATE_PERTICK },        // waived if upkeepArtifactId is set
  perTickThreadAuras: [{ magnitude: CONSECRATE_DEVOTION_PER_TICK }], // faith-spread
  // ...narrativeTemplates etc.
};
// Imbue: domain-appropriate magic for the ascendant's sphere.
const effect = pickSphereFlavoredEffect(ascendantPrimarySphere, mulberry32(seed));
// Anoint: make a threaded faction chosen.
applyChosenStatusGrant(graph, factionId, ascendantPrimaryReach, ascendantId, tick);
```

**Authoring a sustained-control expression card on a location (the consecrate pattern, THR-511).** Unlike imbue (a one-shot GraphOp intercept), `consecrate` is a **sustained control card**: there is *no* custom GraphOp and *no* `executeStepResult` intercept. You author it entirely as data — `durationMode: 'sustained'` + a `controlSpec` — and the existing pipeline does the rest:

1. Set `targetCategories: ['location']` + `targetSubtypes: ['temple','shrine']` (or whichever location subtypes). The card targets a **location node**, not a hex.
2. Put the per-tick behavior in `controlSpec`: `perTickCost` (sphere drain), `perTickThreadAuras` (faith-spread), optionally `upkeepArtifactId` (relic-backed — point it at an existing `lossCondition:'permanent'` artifact) or `mintUpkeepRelic` (relic-mint variant, THR-518 — see below).
3. On success, `spawnControlEffect` (THR-511) **resolves the location's `hexCol`/`hexRow`, sets `targetNodeId = locationId`, and carries `perTickThreadAuras` + `upkeepArtifactId` onto the `ControlEffect`.** `phaseControlEffects` then applies the aura against `targetNodeId` every tick via `applyCoLocatedThreadAura`. No new consumer wiring.

**Authoring the relic-mint variant of a sustained-control card (THR-518).** A static `upkeepArtifactId` can only point at an artifact that *already exists* — useless for "consecrate by minting a brand-new relic." Set `controlSpec.mintUpkeepRelic: { relicName, tags? }` instead (`src/types/controlEffect.ts`): at establishment, `spawnControlEffect` mints a permanent relic artifact (`lossCondition: 'permanent'`), binds it to the establishing ascendant via a `possesses` edge, and sets the spawned effect's `upkeepArtifactId` to the *freshly-minted* node id (a minted id always overrides a static one). The existing `relic_upkeep_substitute` consumer (`getUpkeepStatus`) then waives `perTickCost` while the relic lives and lapses the effect (`upkeep_relic_destroyed`) if it is destroyed — the rival contestation vector. The mint is deterministic (id + content from owner/target/tick, no PRNG) and fail-soft (no graph → no mint, static id stands). It emits a `control_effect_relic_minted` trace. **No new GraphOp, no resolution intercept** — the relic variant is still pure data: a second card (`action.consecrate-relic`) whose `controlSpec` has empty `perTickCost` + `mintUpkeepRelic`. Reach for this whenever a sustained control should offer a "pay once, enshrine a relic, zero upkeep" alternative to per-tick drain. Tuning: `CONSECRATE_RELIC_UPFRONT` (`ascendant-expression-constants.ts`).

The location-target path is the only way to anchor a sustained control on a node rather than a bare hex — every other sustained control (`hex.claim_dominion`, `hex.cultivate`) is hex-targeted and leaves `targetNodeId` undefined.

**Authoring a custom GraphOp that only needs the graph (the essence-source pattern, THR-611).** There is a **third** way to wire a custom verb op, cheaper than the imbue intercept. If your op only needs the `WorldGraph` plus the `GraphOpContext` (`actorId` / `targetId` / `locationId` / `tick`) — and *not* full `GameState`, `runtime`, or a seeded `rng` — add its `case` directly to the `switch` in `src/engine/graphOpExecutor.ts` instead of intercepting it in `unifiedActionResolution.ts`. The resolution split already forwards any op it doesn't special-case into `graphOnlyOps → executeGraphOps`, so a plain executor case is picked up automatically with **zero resolution changes**. The three Divine-Economy source verbs are the reference: `consecrate_source` (turns a controlled host into a *typed* `essenceSource` bag feeding the ascendant's primary sphere — read from `node.properties.sphereAlignment.primary`, override via `op.sourceSphere` — and ensures a `controls` edge so `computeSourceIncome` sees it), `sanctify_source` (raises `sanctity` by `SANCTITY_BUILD_PER_ACTION`, re-derives the tier), `defend_source` (clears `contestedBy`/`desecrated`, restores sanctity by `SANCTITY_DEFEND_RESTORE`). To add one: (1) add the `GraphOpType` (+ any op fields like `sourceKind`/`sourceSphere`) in `src/types/graphOp.ts`; (2) add the `case` + a fail-soft `executeXxx(graph, op, ctx)` in `graphOpExecutor.ts` (return `{op, success:false, error}` on missing target — never throw); (3) author the template with `onSuccess: [{ op: 'your_op', nodeId: '$target' }]`. **Two caveats:** (a) the executor has *no* runtime handle, so it cannot call `touchWorld()`/`touchStructure()` — this is fine when a per-tick phase re-derives the mutated state anyway (the source verbs rely on `phaseEssenceSources` + the per-tick income recompute, so the UI reflects the change within one tick); reach for the imbue intercept instead if you need immediate invalidation. (b) Centralize any derived read (e.g. tier) in a pure helper the phase and the op both call — never hardcode the derived value in the op. **Verify a consumer reads the mutation** (typed source income is only realized because `computeSourceIncome` walks `controls` edges for typed `essenceSource` bags) — an untyped or uncontrolled source is dead content.

Tuning constants: `CONSECRATE_ESTABLISH_COST` / `CONSECRATE_PERTICK` (`ascendant-expression-constants.ts`), `CONSECRATE_DEVOTION_PER_TICK`, `SPHERE_FLAVOR_PASSIVE_VALUE` (and the lookup tables themselves) are the authoring surface — change the number/table entry, not the logic.

**Seeding hidden, discoverable graph state at worldgen + a Find→Claim reveal loop (THR-611 Slice 4).** Two more graph-op-only verbs complete the essence-source loop's *front half* — and they demonstrate a reusable pattern for **content that begins hidden and is revealed by a player action**: (1) `find_source` reveals latent sources within `op.discoveryRangeHops ?? SOURCE_DISCOVERY_RANGE_HOPS` hexes of the target — it resolves the target to a hex (`resolveLocationToHex`) and walks candidate hosts via the pure `findLatentSourcesInRange` helper (`essenceSources.ts`), stamping `discoveredBy` on the bag; (2) `claim_source` binds a *discovered* source with an ascendant→host `controls` edge (income then flows through the same `computeSourceIncome` consumer), and **enforces a prerequisite in the op itself** — it fail-soft-errors if `discoveredBy` is unset ("Find it first"). The hidden state itself is planted at **worldgen**: `seedLatentEssenceSources(graph, rng)` (`src/engine/essenceSourceSeeding.ts`, called from `gameInit.ts` after location sphere-affinity seeding with its own PRNG offset) stamps a small deterministic set of latent `placeOfPower` bags (`discoveredBy` undefined = fog-hidden) onto natural wild-interest locations, **typed by the host's own locale sphere** (`getDominantSphere` of the location's `sphereAffinity`). Two authoring lessons content agents will hit: (a) a *found* source pours **its country's** sphere, whereas a *consecrated* shrine pours the **god's** sphere — the two verbs deliberately produce different flavors of income, so a discovery encounter should read the host's locale, not the caster's alignment; (b) do **not** filter seeding hosts on "no incoming `controls` edge" — most wild interest points already sit in some faction's territory, and a *divine* source is orthogonal to *mortal* control (income only ever walks the ascendant's own `controls` edges, so a mortal controller of the host never leaks income to the player). To seed your own hidden discoverable state, mirror the shape: a deterministic `seedXxx(graph, rng)` in a `*Seeding.ts` module wired into `gameInit`, a `find_*` op that reveals via a range walk, and a `claim_*`/consume op that gates on the reveal flag.

**Six ascendant-ward ops — the two wiring paths in one place (THR-605).** THR-605 gave real, consumed effects to six previously no-op ascendant verbs, and together they are the clearest side-by-side of the two ways to wire an ascendant GraphOp. **Four ride the graph-executor-case path** (the essence-source pattern above — a `case` in `graphOpExecutor.ts`, auto-routed via `graphOnlyOps`, `graph` + `ctx` only): `fortify_location` (raises a location's `fortificationMultiplier`, capped at `FORTIFY_MULTIPLIER_MAX`; consumed by `siegeResolution.ts` at siege *setup*, not just breach), `attune_artifact` (appends the ascendant's-sphere positive `AttachmentEffect` + stamps `attunedSphere`), `curse_artifact` (appends a concealed per-tick `CURSE_QUINTESSENCE_DRAIN` + sets `cursed`/`curseConcealed`), and `scry_sublocation` (flips every unrevealed `knows_secret_of` edge on the target sublocation's hex to `revealed`; consumed by `agentDetail.ts` + `phaseSecretsFavors.ts` decay-exemption). The artifact trio all write the same `properties.effects` array the effect walker reads — `nullify_artifact` is the inverse (clears effects + attune/curse flags). **One rides the resolution-intercept path** (the imbue pattern below — a bucket in `unifiedActionResolution.ts` that needs full `GameState`): `plant_trap`, because it mutates `state.pendingEncounterSeeds`. `applyPlantTrap` (`ascendantExpression.ts`) resolves the intended victim present at the trapped sublocation (or its hex, hex-granular) and seeds the authored `encounter.trap.sprung` beat against them — `evaluateEncounterSeeds` then spawns a real, failable negative encounter whose harm lands through its `condition`-weighted reward pools (no bespoke harm op). **The decision rule, restated:** if the op needs only `graph` + `ctx`, use the executor case (cheaper, zero resolution changes); reach for the intercept only when you need `state`, `runtime`, or a seeded `rng` — as `plant_trap` needs the seed queue. **Two substrate corrections worth remembering** (both discovered by grep against real code, both the kind of trap the guide exists to prevent): the encounter-seed substrate has *no hex-arrival gate* (a seed spawns for its `targetAgentId` the moment it is eligible, wherever they stand), so "fires on the next agent to arrive" is unreachable without net-new machinery — target a present victim instead; and `curseConcealed` has no reader, so a scry that flipped it would be write-only theatre (scry flips the reader-backed `knows_secret_of.revealed` instead). Tuning constants live in `ascendant-expression-constants.ts` (`TRAP_SEED_PRIORITY`, `TRAP_SEED_DELAY_TICKS`, `CURSE_QUINTESSENCE_DRAIN`) and `types/battle.ts` (`FORTIFY_MULTIPLIER_BONUS`/`_MAX`).

**Writing content against the economy — stock tiers, cargo manifests, and the harvest verbs (THR-615/THR-616).** The economy is now a substrate content can *read* and *move*, not decoration. Three things are available to you.

(1) **Stock tiers are the vocabulary.** Every location derives a coarse `stockTier` per resource — `scarce | adequate | surplus` — each tick in `phaseResourceStockTiers` (`src/engine/phases/resourceStockTiers.ts`, registered in `src/engine/phases/index.ts` ahead of prosperity). Resource classes and their categories (`staple | strategic | luxury | arcane`), sphere affinities, and tier prose fragments live in `src/data/resource-classes.ts`. **Write against the tier, never a raw quantity** — the tier is what the prose layer, the Livelihood line, and the IPK Famine/Glut keywords all consume, and it is the only stable reading (quantities move every tick). `RESOURCE_TIER_PROSE` / `getResourceTierProse()` already supply per-resource fragments; extend that table rather than hardcoding "the granary is empty" in an encounter.

(2) **Trade routes carry a cargo manifest.** A `trades_with` edge now has an additive `manifest` (`CargoManifest`, `src/engine/tradeRoute.ts`) naming the goods actually moving, derived at formation from both endpoints' tiers. **Always read it through `readCargoManifest()`**, never off the raw property: the helper is fail-soft in both directions (legacy `goodsType` → single-good manifest; neither present → empty manifest), which is what lets pre-P2 routes keep working. This is the hook for route-flavoured content — a caravan carrying grain into a famine reads differently from one carrying luxuries, and the manifest is where you find out which. Note the deliberate gap: route state does **not** yet materialize into encounters (banditry / embargo / toll), which is THR-669 — until it lands, manifest-aware content has to ride existing encounter surfaces rather than expecting a route-event seed.

(3) **Two divine verbs move staples.** `bless_harvest` / `blight_harvest` (graph-executor cases, the essence-source pattern above) shift every **staple** resource's quantity at the target location by `LOC_BLESS_HARVEST_STOCK_DELTA` / `LOC_BLIGHT_STOCK_DELTA` (`src/data/location-action-constants.ts`), clamped to `[0,100]`. **The consequence is deliberately one tick late** — the op writes quantities and does not `touchWorld()`, because the stock-tier phase already touches on a *tier* change (the `locationSubtype` precedent) and touching on the raw write would over-invalidate. Author the prose accordingly: the payoff beat is the world *noticing* a good or bad year, not an immediate stat pop. Two authoring rules learned here: **target staples only** (blessing a luxury stock is a no-op with no player-legible signal), and **surface new economic cards through a beat grant, never `starter: true`** — under the empty THR-501 starter floor an ungranted template is unreachable forever, so `loc.bless_harvest` / `loc.blight` ride the essence-source milestone beat's `grantsActionIds` alongside `loc.open_markets`.

**Authoring an agent-targeting expression card that grants persistent boons (the bestow pattern, THR-512).** `bestow` follows the imbue GraphOp-intercept shape (custom `'bestow_power'` op → `unifiedActionResolution.ts` dispatch → `applyBestowPower` in `ascendantExpression.ts`), but its "no new consumer" trick is different: instead of mutating an existing node, it **mints a "divine gift" artifact and binds it to the agent with a `possesses` edge**, then leans on *two* effect walkers that already ship to read the gift's `properties.effects`:

1. A `passive` reach bonus (in the ascendant's primary reach via `getAscendantPrimaryReach`) — summed by `collectAttachmentEffects` / `effectResolver` into the holder's reach modifiers.
2. A per-tick `resource_manipulate` (resource `'quintessence'`, `mode: 'per_tick'`) — applied each tick by `tickEffects`/`tickResourceManipulate` (`effectTick.ts`), **clamped to the holder's `quintessenceMax`** so a regen boon never overfills. This is the resolved semantic for "generate quintessence over time": a regen-rate boost, not an accumulator.

The card gates on the **thread edge's `awareness`** (`unaware < intuition < faith < communion`), not a node property: read the `thread` edge (`graph.getOutgoingEdges(ascendantId, 'thread').find(e => e.target === agentId)`) and no-op fail-soft when `awareness < BESTOW_MIN_AWARENESS` (`'faith'`). The lesson: **to grant a living agent a persistent effect, mint a possessed artifact carrying `AttachmentEffect`s — the `possesses`/`bonded_to`/`has_trait` walkers in `effectResolver` and `effectTick` already apply them, so there is no agent-side ability store to build.** Tuning: `BESTOW_COST` / `BESTOW_REACH_BONUS` / `BESTOW_QUINTESSENCE_REGEN` / `BESTOW_MIN_AWARENESS` (`ascendant-expression-constants.ts`).

**Authoring a status-stamp card whose payload is a per-tick consumer phase (the anoint pattern, THR-513).** `anoint` (per-graph-type verb for **factions**) follows the imbue GraphOp-intercept shape (custom `'anoint_faction'` op → `unifiedActionResolution.ts` dispatch → `applyAnointFaction` in `ascendantExpression.ts`), but its trick is the opposite of bestow's "mint a node": it **only stamps a status, and a separate per-tick phase reads it.** The resolver reads the ascendant's primary reach (`getAscendantPrimaryReach`) and calls the THR-509 `applyChosenStatusGrant` primitive, which records `node.properties.chosen = { byAscendantId, domain, grantedTick, power }` (the `power` chosen by (nodeType × domain) from `CHOSEN_POWER_TABLE`). **A status flag alone is dead content** — the THR-509 scaffold sat unread for two issues. The card is only complete when a consumer reads it:

- The consumer is a **registered per-tick orchestrator phase**: `phaseChosenFactionPowers` (`src/engine/chosenFactionPowers.ts`), slotted right after `phaseFactionReputationDecay` so the grant nets against decay. It walks `getFactionNodes`, reads `faction.properties.chosen.power`, and applies the mechanical payload — here, a power-keyed per-tick **member reputation** gain through the existing `applyFactionReputationGain` (reputation is the faction's universal lever: rank/access/bonuses flow from it). Magnitude per power via `CHOSEN_POWER_EFFECT_TABLE`, default `CHOSEN_FACTION_REPUTATION_PER_TICK`.

The lesson: **if your verb sets a status, you must also author (and register) the phase that consumes it — otherwise you've shipped a flag nobody reads.** Prefer channeling the payload through an *existing* system (reputation, control effects, attachment effects) over inventing a new one. Tuning: `ANOINT_COST` / `CHOSEN_FACTION_REPUTATION_PER_TICK` (`ascendant-expression-constants.ts`); per-power `CHOSEN_POWER_EFFECT_TABLE` (`chosenFactionPowers.ts`); `CHOSEN_POWER_TABLE` (`ascendantPrimitives.ts`, now all 8 reaches).

#### Home seat (throne) — `homeSeatLocationId` + `ESSENCE_PER_SEAT` (THR-502)

The ascendant's **home seat** is a location flagged on the god that yields a higher-yield place-of-power essence term and a hex signifier. **To make a location the seat, call `setHomeSeat(graph, ascendantId, locationRef?)` (`src/engine/influence.ts`)** — don't hand-write `homeSeatLocationId` + a `controls` edge. It sets `AscendantProperties.homeSeatLocationId`, ensures a `controls` edge (ascendant → location), and is what the scripted spine beat (#5) and the `__DEBUG.setHomeSeat()` bridge both use.

- **Income:** both `computeEssenceGeneration` (engine) and `computeEssenceIncome` (HUD mirror) add one `ESSENCE_PER_SEAT` (default 1.0, tunable in `influence-content.ts`) term for the live seat location, and **exclude that location from the place-of-power loop** — the seat is a *named higher-yield place of power* (replaces, not stacks). Fail-soft: a seat pointing at a destroyed location contributes 0.
- **Signifier:** flagging the location's `LocationNode.isHomeSeat` (done automatically by GameView's `locationNodes` memo from `homeSeatLocationId`) renders a gold ring + crown on the hex via `LocationIconMesh`.
- **Not done here:** a `thread`-to-location edge. Thread edges are actor-targeting; if a seat should also count as a threaded location for `ESSENCE_PER_THREAD`, that's the spine beat's call (#5), not implied by the seat.

```typescript
// Make the capital the ascendant's throne (auto-picks capital→city→first if ref omitted).
const result = setHomeSeat(graph, ascendantId, 'Ardenmor Keep');
// result.success, result.locationId, result.message ("...; +1 essence/tick.")
```

#### The `{cause:*}` prose placeholders

If a seeded encounter carries a `sourceEncounterId`, prose can reference the causing encounter:

- `{cause:label}` — the `seedLabel` from the original seed effect (e.g. "The mark knows your face")
- `{cause:ticksAgo}` — how many ticks ago the seed was planted

These resolve from `ctx.cause` in `NarrativeContext`. If no cause is present, `{cause:*}` tokens strip cleanly.

---

### Capability 11: `alone` and `outnumbered` Predicates — Co-Location Arithmetic (THR-144)

Two structural predicates that evaluate the actor's immediate scene. Use them to write content that plays differently when a character faces a crowd versus a solo journey.

#### How co-location is determined

An *ally* or *enemy* is any actor sharing the **exact same `located_at` node** as the subject. An agent at a sublocation is NOT co-located with an agent at the parent location — they occupy different scene nodes. Hex-level proximity does not count (a cave within the same hex is a different scene).

#### Classification rules (first match wins)

| Check | Result |
|-------|--------|
| Direct `relates_to` edge between the two actors (either direction) with `sentiment ≥ +0.35` | **ally** |
| Direct `relates_to` edge with `sentiment ≤ −0.35` | **enemy** |
| Both actors share the same `factionId` property | **ally** |
| The two actors belong to different factions that have a `relates_to` edge with `sentiment ≥ +0.35` | **ally** |
| The two actors belong to different factions with `relates_to sentiment ≤ −0.35` | **enemy** |
| None of the above | **neutral** (does not affect either count) |

#### Predicate semantics

| Predicate | True when |
|-----------|-----------|
| `'alone'` | `allyCount === 0 && enemyCount === 0` — no allies or enemies at the scene node (neutrals don't count) |
| `'outnumbered'` | `enemyCount > allyCount + 1` — strictly more enemies than allies plus the actor themselves |

`PredicateContext` exposes `allyCount` and `enemyCount` as raw numbers — future parameterized predicates like `ally_count_above:2` can use them without rebuilding the traversal.

#### Example usage

```typescript
// Last Stand — bonus fires only when facing multiple enemies
{ kind: 'stat_bonus', reach: 'iron', value: 0.2, when: 'outnumbered' }

// Lone Walk — reflective prose branch fires only when no one else is present
{ kind: 'encounter_seed', encounterFamily: 'reflection', seedLabel: 'The road listens', delayTicks: 6, when: 'alone' }
```

#### Important constraints

- **Sub-locations count separately.** An agent at a tavern sublocation is alone with respect to anyone at the parent tavern location node.
- **Sentiment threshold is ±0.35.** Mid-range sentiment (−0.34 to +0.34) is neutral. Calibration constant: `ALLY_SENTIMENT_THRESHOLD`, `ENEMY_SENTIMENT_THRESHOLD` in `src/data/effect-constants.ts`.
- **Outnumbered margin is 1.** A 2v2 scene is NOT outnumbered. A 3v1 scene IS. Constant: `OUTNUMBERED_MARGIN`.
- **Faction-less strangers are neutral.** Two actors with no faction and no `relates_to` edges are neither allies nor enemies.

---

### Capability 12: Secrets & Favors — Persistent Social Leverage (THR-30)

Two graph edge types that model what agents know about each other and what debts they carry. Both feed into social encounter resolution as leverage bonuses.

#### `knows_secret_of` edge (discoverer → subject)

An agent who learns a secret about another agent gains a leverage advantage in social encounters. Secrets are typed and have magnitude (0.05–1.0).

**Secret types and what produces them:**

| Type | Source | Produces when |
|------|--------|--------------|
| `hidden_weakness` | Observation, any source | Fallback — always available |
| `past_crime` | Spy debrief, observation | Agent has hostile `relates_to` edges or criminal faction membership |
| `hidden_allegiance` | Confession, spy debrief | Agent belongs to 2+ factions |
| `financial_desperation` | Tavern gossip, observation | Agent has `owes_favor` edges with high magnitude |
| `shameful_origin` | Confession | Randomly surfaced biographical secret |
| `forbidden_knowledge` | Archive access, spy debrief | Agent in knowledge/arcane factions |

**How to wire secret discovery from encounter content:**

Two surfaces:
1. **Template metadata** (`secretDiscovery` on the template step): set on `UnifiedActionTemplate` — engine automatically calls `generateSecret` + `createSecretEdge` on step success.
2. **Aftermath effect kind** (`secret_discovery`): explicit effect in `aftermathConfig.reactions[].effects` — use for story-significant discoveries with more control over timing.

```typescript
// Template metadata approach (auto-fires on step success):
steps: [{
  ...,
  secretDiscovery: { source: 'observation', magnitudeBonus: 0.1 },
}]

// Aftermath effect approach (fires at reaction resolution):
effects: [{ kind: 'secret_discovery', source: 'spy_debrief' }]
```

**Leverage bonus:** `secret.magnitude × SECRET_LEVERAGE_MULTIPLIER (0.30)`. Only unrevealed secrets contribute.

**Cap:** `MAX_SECRETS_PER_AGENT = 8` total outgoing `knows_secret_of` edges per discoverer. Capped edges are silently dropped.

#### `owes_favor` edge (debtor → creditor)

An agent who receives significant aid owes a favor to the helper. The creditor gains leverage over the debtor in future encounters.

**How to wire favor creation from encounter content:**

Two surfaces:
1. **Template metadata** (`favorGeneration`): auto-fires on step success.
2. **Aftermath effect kind** (`favor_creation`): explicit, controlled timing.

```typescript
// Template metadata:
steps: [{
  ...,
  favorGeneration: { onSuccess: true, magnitudeRange: [0.2, 0.4], context: 'healed their wound' },
}]

// Aftermath effect:
effects: [{ kind: 'favor_creation', magnitudeRange: [0.1, 0.3], context: 'gave shelter in the storm' }]
```

**Leverage bonus:** `favor.magnitude × FAVOR_LEVERAGE_MULTIPLIER (0.25)`. Only unredeemed, unbroken favors contribute.

**Cap:** `MAX_FAVORS_PER_AGENT = 6` active outgoing `owes_favor` edges per debtor.

#### Divine GraphOps for Secrets & Favors

Three GraphOps are available in `onSuccess` / `onFailure` step arrays:

| Op | What it does | Requires |
|----|-------------|---------|
| `reveal_secret` | Marks the actor's highest-magnitude unrevealed secret about target as revealed (removes leverage) | Actor must hold a secret about target |
| `call_in_favor` | Redeems the target's best unredeemed favor owed to the actor | Target must owe actor a favor |
| `plant_secret` | Creates a fabricated `knows_secret_of` edge (actor→target) with `planted: true` | No prerequisites |

```typescript
onSuccess: [{ op: 'reveal_secret', target: '$target' }]
onSuccess: [{ op: 'call_in_favor', target: '$target' }]
onSuccess: [{ op: 'plant_secret', source: '$actor', target: '$target',
              properties: { magnitude: 0.5, secretType: 'past_crime' } }]
```

#### Important constraints

- **Edge direction is semantic.** `knows_secret_of` source=discoverer, target=subject. `owes_favor` source=debtor, target=creditor. Never reverse these.
- **`reveal_secret` requires the actor to hold the secret.** If the actor doesn't personally have a `knows_secret_of` edge to the target, the op fails gracefully.
- **`call_in_favor` only redeems favors owed to the actor.** A debtor's favors to third parties cannot be redeemed by the actor.
- **Leverage is computed fresh per encounter.** There's no cached leverage value — it's recalculated from live graph edges at the start of each social encounter resolution.

#### How to verify

Filter DebugPanel Trace tab on `secret_discovered` + `favor_created`. Open DebugPanel → Secrets & Favors tab for a per-agent view of all edges. AgentDetailPanel shows the LeverageSection when the agent has any active secrets or favors.

---

---

### Capability 13: Stateful Effect Shells — Hidden State That Evolves Through Play (THR-53)

Three shell primitives let an encounter or attachment carry state that evolves as actions unfold:

**flip_table** — A binary (or small-N) hidden state machine attached to a template. Each config has a set of `variants` (with weights), an `initialState` (`front`/`flipped`/`revealed`), and a `flipTrigger`. The `step_outcome` trigger fires inside `executeStepResult` when the specified step resolves with any of the listed outcomes. Use it for: fate cards, sealed letters, deferred reveals, loot-box tension, branching destiny.

```ts
flipTables: [{
  id: 'sealed_fate',
  variants: [{ key: 'boon', weight: 2, label: 'Fortune' }, { key: 'bane', weight: 1, label: 'Doom' }],
  initialState: 'front',
  flipTrigger: { kind: 'step_outcome', stepIndex: 1, outcomes: ['success', 'critical_success'] },
  revealPolicy: 'on_trigger',   // or 'immediate' to pick variant at first flip
  persistence: 'must-persist',
}]
```

`revealPolicy: 'immediate'` selects a variant the first time the trigger fires (front→flipped). `revealPolicy: 'on_trigger'` defers variant selection to the second trigger (flipped→revealed). Runtime state lives in `GameState.flipTableStates` and is visible in DebugPanel → **Shells** tab.

**duplicate_gain_policy** (on `PossessionNodeProperties`) — Controls what happens when an actor tries to gain an attachment they already hold. Options: `stack` (multiple copies), `refresh` (reset duration), `ignore` (no-op), `flip` (trigger a flip table on the held copy), `worsen` (apply escalating negative effects, up to `maxApplications`). Default is `refresh`.

**result_bands** — A ladder of threshold→outcome mappings on a template. When a step resolves, the margin is compared against declared bands to select a tier. Bands declare effects and optional follow-on tags. Runtime selections are recorded in `GameState.resultBandHistory`. Hooks: `selectResultBand` / `buildBandSelectionRecord` in `effectShellRuntime.ts`.

#### How to verify

Open DebugPanel → **Shells** tab to see all active flip table runtime states (state, variant key, owner actor, last updated tick). Filter Trace Feed on `effect_shell` to see every transition as it fires.

### Trace Categories You Can Filter On

Content authoring often needs to verify "did my effect actually fire?" DebugPanel's Trace tab filters on any of the categories below, grouped by what they prove:

| Verifies... | Categories |
|---|---|
| Prose enrichment works | `narrative_generation`, `intelligence_referenced` |
| Aftermath fired | `encounter_aftermath_applied`, `encounter_aftermath_effect` |
| Seeds planted and triggered | `encounter_seed_planted`, `encounter_seed_triggered`, `causation_edge_created` (THR-116) |
| Hidden marks placed, revealed, or decayed | `hidden_mark_placed`, `hidden_mark_revealed` |
| Intelligence granted, consumed, referenced | `intelligence_granted`, `intelligence_referenced` |
| Multi-target aftermath (THR-114) | `aftermath_target_resolved`, `aftermath_target_invalid`, `faction_reputation_changed`, `reputation_set_applied`, `condition_applied`, `condition_removed` |
| Scene sentinels + bond_change (THR-695) | `aftermath_sentinel_bound`, `bond_change_applied` |
| Travel intents (THR-1142) | `aftermath_agent_relocation`, `relocation_arrived`, `relocation_expired` |
| Single-agent membership (THR-1144) | `aftermath_membership_change` |
| Tag-filtered random prize (THR-1146) | `aftermath_reward_draw`, `aftermath_reward_draw_empty` |
| World-shaping aftermath (THR-115) | `artifact_spawned`, `omen_emitted`, `omen_decayed`, `faction_splintered`, `faction_absorbed`, `faction_dissolved`, `faction_war_declared`, `faction_peace_forced` |
| Conditional / causation effects (THR-116) | `aftermath_effect_skipped_by_when`, `aftermath_effect_when_passed`, `thread_mutation_applied`, `thread_mutation_skipped` |
| Secrets & favors (THR-30) | `secret_discovered`, `favor_created` |
| Graph mutation & UI choice flow | `graph_op_execution`, `choice_set_player_resolved`, `choice_set_player_dismissed` |
| Complication outcomes (THR-20) | `complication_selection` |
| Effect shell transitions (THR-53) | `effect_shell` (subkind: `flip_revealed`, `gate_transition`, `band_selected`, `duplicate_policy_applied`) |
| Emergent personality traits (THR-527) | `personality_trait_emerged` (grant + release; `details.kind`, `details.axisId`, `details.position`) |
| Origin-vignette birth seeding (THR-561) | `personality_origin_seeded` (aggregate per tick; `details.kind`: `seeded` \| `unknown_axis`, `details.count`, `details.vignettesApplied`) |
| Core personality foundation (THR-542) | `core_personality` (`details.kind`: `seeded` \| `emerge` \| `fade` \| `bend`) |
| God-side progression (THR-613) | `ascendant.progression.practice`, `ascendant.progression.tier_up`, `ascendant.progression.deepening_enqueued`, `ascendant.progression.milestone_enqueued` |

**How to use:** Open DebugPanel (backtick or F1), select the Trace tab, check the category filter chips. Full TypeScript interface definitions for each trace type live in `src/types/trace.ts`.

### Personality as a behavior signal (THR-527)

Each mortal agent's standing moral position per axis (`axiologicalProfile`) crystallizes into a `personality`-subcategory trait once it crosses a hysteresis threshold — a "becoming" `personality_trait_emerged` event ("Kael has become Greedy"). These emergent traits carry a per-reach `scoringModifiers` payload (new optional field on `TraitDefinitionProperties`) consumed by the same scoring-bonus path as reputation traits (`computeReputationScoringBonus`), nudging the agent toward encounters in their own Reach. **For content authors:** you don't author these traits (they generate from the canonical axis registry), but you *do* feed them — encounter choices that push an agent's axis position (the drift system, THR-528) are what eventually make a personality crystallize and bias which of your encounters that agent seeks out. The `scoringModifiers` field is also available on any trait def if you want a trait to steer encounter selection by Reach without touching Domain Capability.

**Where the baseline comes from — origin vignettes (THR-561).** The standing `axiologicalProfile` an agent crystallizes from isn't random: at birth the `personality_origin_seed` phase draws a handful of one-line pre-history vignettes from `src/data/origin-vignettes.ts` (keyed `(reach, pole, magnitude)`) and lays their signed contributions onto the agent's baseline (recorded on `node.properties.originVignettes` for the sheet/prose). **For content authors:** add vignettes to that library to widen the pool of pre-histories agents can be born with — plain, generic, reusable one-liners (no proper nouns). Separately, any **trait def** may now carry an `axisContributions` map (per canonical axis id, signed 0–1 delta, e.g. `{ iron_axis: 0.1 }`); it is folded into the baseline at seeding and is the intended carrier for *permanent* axis-contributing traits (formative marks). It is kept entirely separate from `domainContributions` — `axisContributions` moves the moral baseline, never Domain Capability.

### The Core — foundation personality layer (THR-542)

Beneath the 8 reach moral axes sits a second, more fundamental layer: the **Core** — five plain virtue↔vice continuums of *who an agent fundamentally is* (`src/types/coreRegistry.ts`): `core_warmth` (Warm↔Cold), `core_hope` (Hopeful↔Bitter), `core_forgiveness` (Forgiving↔Vengeful), `core_humility` (Humble↔Proud), `core_integrity` (True↔False). Stored as `node.properties.coreProfile` on the 0–1 / 0.5-neutral scale, **kept entirely separate** from `axiologicalProfile` (reach) and `domainCapabilities` (capability) — Core ≠ reach ≠ capability.

**Load-bearing canon-safe framing (do not "fix" away):** the Core and Quintessence are co-resident on the foundation layer but distinct — Quintessence = *how bendable* the agent is; the Core = *which way* they bend. They couple **directionally, not evaluatively**; goodness is never a pole of the Quintessence scalar. Never label the Core "Quintessence traits" in UI/UL.

**Three mechanics** (`src/engine/core/coreMechanics.ts`, tuned by `coreConstants.ts`), driven each tick by the `core_personality` phase:
- **seed** — every mortal agent gets a Core baseline drawn deterministically from `hash(worldSeed, agentId)` (central-limit → clustered near neutral), then has **authored origin-vignettes laid on top** (`seedCoreProfileWithVignettes`, THR-544): `CORE_ORIGIN_VIGNETTE_DRAW_COUNT` signed pulls from `src/data/core-origin-vignettes.ts` (60 vignettes keyed `(continuumId, pole, magnitude)`, the Core sibling of the reach `ORIGIN_VIGNETTES`), recorded on `node.properties.coreOriginVignettes`. Emits one aggregate `core_personality`/`seeded` (carries `count` + `vignettesApplied`).
- **emerge/fade** — past the emergence thresholds (`coreConstants.ts`, hysteresis) the phase grants/releases a **Core emergent-trait node** (`src/data/core-trait-content.ts`, 10 defs, `subcategory:'core'`) and emits `core_personality`/`emerge`|`fade`. Born-extreme agents are granted silently at the seeding tick (trait edges, not traces). **Core traits carry no `scoringModifiers` and no `domainContributions`** — they are pure character descriptors for prose, never a reach-selection bias or capability (that separation is the whole point; do not wire them into scoring).
- **colour** — `colourReachExpression(core, word)` tints how a reach act *reads* (a Brave act is *courage* on a True/Humble self, *swagger* on a False/Proud one) without touching competence. Pure read for the prose layer to consume.
- **bend** — under low normalized Quintessence, the Core nudges coupled reach axes toward a pole (`coreBendContributions`). A nudge that is *added* to reach drift, **never a cap** (the cold philanthropist stays possible). Emits `core_personality`/`bend`.

**Slice status (THR-542):** Engine foundation (slice 1) ✅ and the Content layer (slice 2 / THR-544 — origin-vignette library + emergent-trait defs, wired into seeding and emerge/fade) ✅ have shipped. The **Star re-scope** (Beacon/Wrecker, THR-545) and the **character-sheet Core section** (UI, THR-546) remain. The colour read and the bend nudge are wired as mechanics + traces; their *consumption* (prose tone, reach-drift application) lands with later slices.

### Deepening beats — god-side tier-crossing vignettes (THR-613)

The **ascendant** grows too, not only mortals. It accrues `reachPractice` in its two permanent reaches by resolving in-domain actions (`accruePlayerReachPractice`, fed through the same Domain-Capability sigmoid the agents use — one source of truth). When that practice pushes the god's tier up in a reach, the `phaseAscendantProgression` phase enqueues a **Deepening beat** (`beat.deepening.<reach>`) into the shipped Ascendant Beat Director's `pending` slot and writes a one-line chronicle entry. **For content authors:** the eight vignettes live in `src/data/ascendant-deepening-beats.ts` — `ASCENDANT_DEEPENING_BEATS` (the `BeatDefinition`s, catalogued in `ascendantBeat.ts`) + `DEEPENING_BEAT_PRESENTATION` (per-reach authored prose, plain register) + `deepeningChronicleProse`. They are **prose-first** — a Deepening beat grants *no* card in v1 (the tier-up itself, already applied, unlocks deeper tier-gated templates in that reach); the growth is *narrated*, never "+1 tier". To reshape how a deepening reads for a reach, edit its `DEEPENING_BEAT_PRESENTATION` entry; the beat is enqueued by the engine, so there is no Director-pool weight to tune. (Card-choice offers + the reach-flavored modal wiring are later slices.)

### Milestone beats — god-side breadth vignettes (THR-613)

Where a Deepening marks **Axis A** (your reach got *deeper*), a **Milestone beat** marks **Axis B**: your palette got *wider*. It fires when the god's holdings cross a threshold worth naming, and — unlike a Deepening — it **grants a card**, because breadth is the axis where a new verb is the honest reward.

The one shipped milestone is the **essence-source milestone** (`beat.milestone.the_wellspring_flows`): `phaseAscendantProgression` counts the god's controlled sources (`countControlledSources`, reading THR-611's shipped source model — not a new trigger system) and enqueues the beat at `MILESTONE_SOURCES_FOR_BEAT` controlled sources **or** the first `flowering` source, whichever comes first. It grants `loc.open_markets` — a shipped Gold economy card that no beat previously granted, so it was unreachable under the empty THR-501 starter floor.

**For content authors:** the beat lives in `src/data/ascendant-milestone-beats.ts` — `ASCENDANT_MILESTONE_BEATS` (the `BeatDefinition`s, catalogued via `getMilestoneBeatById` in `ascendantBeat.ts`) + `MILESTONE_BEAT_PRESENTATION` (authored prose, plain register) + `milestoneChronicleProse`. Thresholds are tunable in `src/data/player-progression.ts`. To add a milestone: add a `BeatDefinition` with `kind: 'milestone'`, give it a presentation entry, give its `grantsActionIds` a bucket in `ASCENDANT_ACTION_BUCKETS`, and add its detection to `phaseAscendantProgression` (record the fired id in `milestoneBeatsFired` so it fires once per run).

**The grant rule — never re-offer a held card.** Check `collectGrantedActionIds()` before choosing what a milestone grants. Re-revealing a card the god already holds is a *fake reveal* that lies to the player; it is why the Deepening beats grant nothing at all (every reach-gated signature is already handed out by the acquisition beats). A milestone grant must be a card no other beat gives. A contract test enforces this.

**Priority.** A Deepening wins the tick when both are eligible; the milestone is threshold-based (not edge-based), so it simply re-detects next tick and nothing is lost.

**Discovery beats — the third breadth path (already shipped, named here).** The Ruins/Delve pattern (Clue → Delve → a Foundation-sphere card) is the third Axis-B acquisition path. It needs no new content system: it rides the shipped encounter/clue content, and is named here so the three breadth paths (investment-beat spend, essence-source milestone, discovery) read as one spine rather than three unrelated mechanisms.

---

## Part 6: The Exemplars — Study These Encounters

These encounters demonstrate championship-level systemic wiring. Read them before authoring new content.

### Rival Shrine Betrayal (`broker.quest.rival_shrine_betrayal`)
**File:** `src/data/encounters/rival-shrine-betrayal.ts`
**Why it's exemplary:** Creates an intelligence artifact as a graph node that future encounters can reference via `revealFamilies`. Plants 4 encounter seeds across 2 branches. Uses hidden marks with severity tracking. Multi-layered reputation consequences ripple through faction network.

### Flawed Steel (`crafting.quest.flawed_steel`)
**File:** `src/data/encounters/flawed-steel.ts`
**Why it's exemplary:** Three branches with 6 total aftermath reaction paths, each producing distinct systemic fingerprints. Deception severity varies by reaction choice (prepared vs. unguarded). Seeds different encounter families per path. The prose and the wiring are inseparable — the narrative about managed truth IS the hidden mark system.

### The Contrast — Wandering Healer (`healer.quest.wandering_healer_shrine_access`)
**File:** `src/data/encounters/wandering-healer-shrine-access.ts`
**Why it's minimal (intentionally):** Single step, linear, no graph ops, no seeds, no hidden marks. This is a mercy encounter — sometimes simplicity is correct. But it's the exception, not the template. If your encounter looks like this and it isn't intentionally simple, you're underusing the engine.

---

## Part 7: Common Anti-Patterns

### Anti-Pattern 1: "Prose-First, Wire-Never"
The author writes beautiful prose, then asks "what systemic effects should this have?" and bolts on a `reputationDelta: 0.05`. The prose and the wiring are disconnected. **Fix:** Write the systemic consequences first (what seeds, what marks, what graph changes), then write prose that makes those consequences emotionally resonant.

### Anti-Pattern 2: "Static Strings in Dynamic Fields"
The `narrativeTemplate` field contains prose with no placeholders, no conditionals, no reference to the agent's actual state. Every agent reads the same text. **Fix:** Use at minimum `{name}`, `{they}/{them}/{their}`, and one conditional block per narrative field. If the prose doesn't change based on who's experiencing it, ask why.

### Anti-Pattern 3: "Aftermath as Epilogue"
Aftermath reactions have evocative prose but no effects array, or only a `recent_event`. The aftermath doesn't change the world — it just describes what happened. **Fix:** Every aftermath reaction should have at least one effect that creates persistent state: a seed, a mark, a tally, or intelligence.

### Anti-Pattern 4: "Seeds Without Templates"
An encounter plants seeds using `encounterFamily` only, with no `templateId`. Since family-matching is v1/narrative-only, the seed emits a narrative event but doesn't spawn an actual follow-up encounter. **Fix:** Use `templateId` for guaranteed follow-up spawning. Use `encounterFamily` only when you intentionally want a narrative event without a specific follow-up.

### Anti-Pattern 5: "Scoring Blindness"
The author doesn't set `crudType`, `motivations`, `locationSubtypes`, or `actorAffinities` thoughtfully. The encounter exists in the content registry but never surfaces for appropriate agents because the scoring system can't match it. **Fix:** Think about scoring as design. A festival encounter should be `crudType: 'update'` with `motivations: [['loyalty', 'ambition']]` and `locationSubtypes: ['market', 'settlement']`. These fields determine whether the encounter finds its audience.

### Anti-Pattern 6: "Symmetric Outcomes"
Success and failure both produce the same kind of persistence — maybe both add reputation, or both add a recent_event. There's no reason the world would feel different after success vs. failure. **Fix:** Success and failure should leave *structurally different* fingerprints. Success creates an ally edge and seeds a gratitude encounter. Failure plants a hidden mark and seeds a confrontation encounter. The world should be observably different.

---

## Part 8: Integration Points — Where This Guide Connects

This guide should be read before these skills:

- **`encounter-pipeline`** — The four-pass pipeline authors encounters. This guide tells authors *what to write about* based on engine capabilities. The systems-audit agent (Pass 3) should validate wiring against this guide.
- **`attachment-pipeline`** — Attachments compose behavior from the engine's effect primitive categories (`GraphMutationEffect`, `CreateStructureEffect`, `SpawnEffect`, etc.). These primitives are distinct from the 18 typed aftermath effect kinds — the attachment pool is authored at a lower level. See the attachment-pipeline skill for the full vocabulary.
- **`prose-content-systems`** — Day-to-day content uses enrichment placeholders and narrative templates. This guide explains what those placeholders resolve to and why they matter.
- **`prose-pipeline`** — Resolver architecture for graph-walking prose. This guide explains the other side: how encounter outcomes create the graph state that resolvers later walk.
- **`encounter-actor-systems`** — The scoring, filtering, and resolution systems. This guide explains how template fields feed into those systems.

**The chain of authority:**
```
Game Design Direction (emotional principles)
    → Systemic Wiring Guide (what the engine can do)
        → Quality Gate Section 9 (benchmark moments)
            → Encounter/Attachment Pipeline (authoring)
                → Prose Content Systems (day-to-day content)
```

Every link in this chain matters. Great prose without systemic wiring is a book page. Systemic wiring without great prose is a database entry. The game needs both.

---

## Part 9: Prose Repetition Prevention — `pickWithRepetitionGuard` (THR-456)

When a tick might resolve multiple events using the same phrase pool (e.g. multiple `dilemma_resolved` events in one tick), naive random selection repeats the same phrase. Use `pickWithRepetitionGuard` from `src/engine/proseSelection.ts` to prevent this.

```ts
import { pickWithRepetitionGuard, type PhraseEntry } from '../proseSelection';

// Define your pool as PhraseEntry[] (phraseId + text, not bare strings):
const POOL: PhraseEntry[] = [
  { phraseId: 'my_pool.drama.01', text: 'The {noun} fractures.' },
  { phraseId: 'my_pool.drama.02', text: 'Something shifts between them.' },
  // ...
];

// Create one Set per tick-phase (not per-game), reset each tick:
const usedIds = new Set<string>();

// Pick — automatically avoids usedIds, falls back to full pool when exhausted:
const entry = pickWithRepetitionGuard(POOL, rng, usedIds);
// entry.text → the prose template string
// usedIds now contains entry.phraseId — next call skips it
```

**Key invariants:**
- `PhraseEntry.phraseId` must be unique across the whole pool (content-lint test enforces this).
- The `usedIds` set is created fresh at the start of each phase, not stored in GameState. This prevents same-tick repeats without persisting state across ticks.
- Pool must be non-empty — `pickWithRepetitionGuard` throws on empty pool (caught by the caller's fail-soft wrapper).
- `PROSE_REPETITION_GUARD_WINDOW` (6) is exported for callers that want to manually track window size, but the Set-based API doesn't enforce a window — it avoids *all* entries in the Set.

---

## Appendix: Culture-Seeded Naming (THR-15, 2026-04-18)

**Location names, agent names, demonyms, and homeland names are now culture-phonetic.** Each culture at worldgen time builds a deterministic `CulturePhoneticSignature` (vowel inventory, onset/coda consonants, syllable templates, orthography style) seeded from its foundation + sphere + demonym hash. All name generation routes through the layered picker in `pickCulturalName()`:

1. 35% chance: phonetic generator first
2. Curated pool (foundation + sphere flavor words)
3. Phonetic fallback (if pool exhausted)
4. `synthesizeFallbackName(sphere, rng)` — culturally seeded safe name (replaced `Wanderer-N` in THR-456)

**Phonetic constraint guards (THR-456):** `generatePhoneticName` applies three output guards before returning — `countSyllables ≤ NAME_MAX_SYLLABLES (4)`, no consonant cluster longer than `NAME_MAX_CONSONANT_CLUSTER (2)`, no vowel run longer than `NAME_MAX_VOWEL_RUN (2)`. Names that fail after 10 attempts fall through to the curated pool. This eliminates `Saawhaiahaiiawhuiel`-class outputs.

**What this means for content authors:**
- Agent names will be audibly distinct per culture — Chaos/Force cultures sound harsh and percussive; Light/Spirit cultures are vowel-rich and open-syllable.
- Settlement names seeded by nearby culture phonetics — a Chaos/Matter frontier town won't sound like an Order/Spirit holy city.
- Demonyms and homeland names are phonetically consistent with the culture's agent names.
- `{culture}` placeholder in prose resolves to the demonym — which is now phonetically generated, not a template word.

**Debug Panel Cultures tab** (`DebugTabContent` → `'cultures'` → `CulturePhoneticsInspector`) shows live phoneme inventory + sample names per culture with Re-roll samples.


---

## 8. Phase Story-Beats (THR-254)

Phased events (e.g. The Chain Weakens, THR-225) emit `ChronicleEntry` records when a phase activates. Since THR-254, these entries carry dual-voice content — `poetProse` (divine/cosmic register) and `witnessFacts` (mortal/grounded bullets) — sourced from a static template registry.

### How to author phase story-beats

1. **Define templates** in a per-composition file: `src/data/story-beat-templates/<your-event>.ts`.
   - Implement `CompositionStoryBeatTemplate` (from `chain-weakens.ts`).
   - Provide both `poetProse` and `witnessFacts` when possible.
   - Set `defaultVoice: "divine" | "mortal"` to guide the phase runner.
   - Set `sphere: SphereName` (never `"void"` — map to `"entropy"` or another canonical sphere).
   - Set `mood` (e.g. `"uneasy"`, `"dread"`, `"resolute"`).
2. **Register templates** by adding them to `STORY_BEAT_TEMPLATE_REGISTRY` in `src/data/story-beat-templates/index.ts`.
3. **Wire to phases** in the recipe (`.recipe.ts`): each `storyBeat` block takes an optional `voice: "divine" | "mortal"` field that overrides the template's `defaultVoice`.

### Voice convention

| Voice | ChronicleEntry field | Register | When to use |
|---|---|---|---|
| `divine` | `poetProse` | Cosmic/emotional, italic serif | The ascendant perceives before mortals name it |
| `mortal` | `witnessFacts` | Factual bullets, body sans | Ground-level action, mortal agency |

Both fields can be populated regardless of `voice` hint — the hint is a lead indicator, not an exclusion.

### Fail-soft

If a `storyBeat.template` id is not in the registry, `makePhaseChronicleEntry` falls back to `phase.rationale` as prose and emits a `composition.story_beat_template_missing` trace. No crash.

### Constants

| Constant | Default | File |
|---|---|---|
| `STORY_BEAT_DEFAULT_MOOD` | `"ominous"` | `src/data/composition-config.ts` |
| `STORY_BEAT_DEFAULT_SPHERE` | `"entropy"` | same |
| `STORY_BEAT_DEFAULT_VOICE` | `"divine"` | same |

---

## Capability 8: Mentor/Apprentice Edges + Graduation Trait Grant (THR-75)

A `mentors` edge type (`src/types/graph.ts` + schema in `src/types/edgeSchema.ts`) persists training relationships across their full lifecycle — `offered` → `training` → `graduated | estranged`. The edge carries `domain` (which Reach), `progress`, `bondQuality` (the narrative-derived value that decides the terminal arc), and `lessonsCompleted`. Graduated and estranged edges persist as *history* — future encounters can read "the one who trained under X" or "the one estranged from Y" as legible state.

**Why this matters for content:**
- **Encounters can reference a mentor's name without invention.** When an encounter targets an apprentice (`$actor`), the engine can resolve their mentor via `getMentorships(graph, agentId)` (`src/engine/graphQueries.ts`). Prose can pull `mentorName` out of the edge instead of inventing a stranger.
- **Capability transfer is graph-native.** Graduation grants a Mastery trait in the mentor's domain via the existing `has_trait` GraphOp pattern. The trait carries `source: 'mentorship'` for queryable provenance. Future encounters can scope to "graduated mortals" by filtering on Mastery traits with `source === 'mentorship'`.
- **The terminal arc is a `bondQuality`-keyed decision.** Failure produces *Falling Out*, not punishment. The Falling Out aftermath plants a future rivalry encounter — failure is a story turn, not a loss.

**Content authoring hooks:**
- Encounter templates targeting an apprentice can read their `mentors` edge for the mentor's id/name, the domain, and the bondQuality. Phase 1 encounter prose stays sphere-coloured (Life / Entropy / Force / Mind authored, others fall through) — see the three branching templates in `src/data/encounters/mentorship-*.ts`.
- Three Phase 2 milestone encounters (`mentorship.first-lesson`, `mentorship.the-test`, `mentorship.the-breakthrough`) are seeded by `phaseMentorship` at `MILESTONE_THRESHOLDS` and fail soft until authored. Authoring them is pure additive content work — the engine seeds them by `templateId`.
- The two divine actions (`action.mentorship.inspire`, `action.mentorship.sever`) use the existing property-flag pattern (`mentorshipInspireBonus`, `pendingMentorshipSever`) — no new GraphOp kind required. Author similar divine-action templates by setting a flag the consuming phase reads.

**Trace categories registered:** `mentorship_offered`, `mentorship_started`, `mentorship_lesson`, `mentorship_graduated`, `mentorship_surpassed`, `mentorship_severed` — all six are inspectable in the DebugPanel Trace tab.

**Constants:** all 23 tunable numbers in `src/data/mentorship-constants.ts`. Master feature flag `ENABLE_MENTORSHIP` gates the entire pipeline.

---

## Capability 9: Template Novelty Pressure — The Engine Fights Monopolies for You (THR-453)

The scoring engine automatically applies a recency penalty to templates that have been selected recently. Content authors do not need to wire anything — novelty pressure is on by default and transparent to templates. What authors need to understand is *why writing diverse content across categories matters more than they might think*.

**What the engine does:**
- **Global recency penalty:** a template selected N ticks ago scores at `1 - (maxPenalty × e^(−λN))`. With a 4-tick half-life and max penalty 0.55, a template selected last tick scores at ~72% of its raw score; at tick 10 it's back to ~99%. Penalty decays exponentially — it's not a cooldown, it's a gradient.
- **Per-agent recency penalty:** same exponential decay tracked per agent (3-tick half-life, max 0.45). An agent who just experienced a template sees it much less often, even if global novelty has decayed.
- **Category quota penalty:** if one Reach domain fills >18% of the rolling 12-tick selection window for an agent, templates from that domain face an additional linear ramp penalty. This breaks one-reach monopolies (e.g. `wilderness` dominating `spirit` or `society`).
- **Combined floor:** the product of all penalties is capped at `NOVELTY_COMBINED_CAP = 0.75`. No template can be penalized below 25% of its raw score. Over-selected templates remain competitive — novelty pressure shifts the distribution, not the eligibility.

**Why this matters for content:**
- **Template diversity across Reach domains is mechanically rewarded.** A rich pool of `spirit`, `society`, `trade`, and `wilderness` templates means the quota mechanism rarely fires; a sparse pool triggers it every 12 ticks. When the quota fires, the best-scoring templates from underrepresented domains get a relative boost — so having authored them matters.
- **Unique first-encounter prose is no longer wasted.** Templates that would have been crowded out by high-scoring monopoly templates now surface through natural decay of their competitors. Early-arc, low-probability templates accumulate real selection time across a playthrough.
- **Template variety serves storytelling, not just coverage.** The system was designed to produce "nomadic stories, not busy-ness." Novelty pressure is one of the mechanisms that makes individual encounter selections feel authored rather than weighted by a single dominant template. When you write a scene that only makes sense once (a first meeting, a pivotal confrontation), trust the decay to ensure it doesn't repeat.

**What you do NOT need to do:**
- Do not set any novelty-related field on templates — there is no such field.
- Do not worry about adjacent templates "drowning out" your new content — the decay mechanism gives new templates fair air time as it suppresses repeated ones.
- Do not tune the constants per template — the 8 `NOVELTY_*` constants in `agent-behavior-constants.ts` are world-level tuning, not per-template.

**Inspectability:** `noveltyMultiplier` is emitted per top-candidate entry in `ScoringTrace`. `noveltyChangedSelection` and `preNoveltyWinnerId` are set when novelty pressure flipped the winner — visible in the DebugPanel Trace tab filtered on `encounter_scoring`.

---

## Capability 10: Outcome-Band Prose Bands — Six-Register Afterimage Differentiation (THR-460)

Step afterimage fields (`successAfterimage`, `failureAfterimage`) support two new enrichment placeholders that resolve to band-differentiated phrases. The six bands map to the six `StepOutcome` values and give the player prose that *reads* differently depending on how well an action resolved — not just what the fiction says happened.

| Placeholder | Resolves from | Availability |
|---|---|---|
| `{outcome_phrase}` | `OUTCOME_BAND_PROSE[band]` — adverbial/adjectival phrase for the resolution quality | `successAfterimage`, `failureAfterimage` only |
| `{q_flavor}` | `OUTCOME_BAND_Q_FLAVOR[band]` — quintessential flavor phrase (cosmic/spiritual register) | `successAfterimage`, `failureAfterimage` only |

**The six bands and their register:**

| OutcomeBand | StepOutcome | Prose register |
|---|---|---|
| `surge` | `critical_success` | Triumphant, heightened — "with a surge of certainty" |
| `neutral` | `success` | Clean, matter-of-fact — "well enough" |
| `strained` | `success_at_cost` | Grimy, costly — "at considerable cost" |
| `fortunate` | `near_miss` | Lucky, barely-held — "skirting the edge of failure" |
| `setback` | `failure` | Deflated, collapsed — "but the thread did not hold" |
| `catastrophe` | `critical_failure` | Dire, sweeping — "with devastating consequence" |

**How to use:**

```typescript
// In a UnifiedActionTemplate step:
successAfterimage: "{name} crossed the threshold {outcome_phrase}. The wards hold.",
failureAfterimage: "The attempt ended {outcome_phrase} — the wards are weaker than they appeared.",
```

At render time, `buildUnifiedEncounterStageModel` spreads `outcomeBand: stepOutcomeToOutcomeBand(outcome)` into the per-step `NarrativeContext` before calling `enrichProse`. Both `{outcome_phrase}` and `{q_flavor}` resolve from their band-keyed phrase pool.

**Fail-soft:** If no `outcomeBand` is set (prose used outside an afterimage context), both placeholders strip silently. If no `SimulationRuntime` is available, the first pool entry is used deterministically (engine-test paths and non-runtime contexts).

**Dedup guard:** The `SimulationRuntime.outcomeBandPhraseHistory` map tracks recently-used phraseIds per actor (keyed `agentId` for `outcome_phrase`, `agentId + '__q'` for `q_flavor`). A 12-entry eviction window (`OUTCOME_BAND_PHRASE_HISTORY_WINDOW`) prevents the same phrase appearing twice in a short series. This requires no authoring effort — it's automatic.

**Content table:** `src/data/outcome-band-content.ts` — `OUTCOME_BAND_PROSE` and `OUTCOME_BAND_Q_FLAVOR`, 5 entries per band, 30 phrases per table. To add more variety: append to any band's array with a globally unique `phraseId` (e.g. `'surge.6'`, `'q.neutral.6'`). The lint test `src/engine/__tests__/outcomeBandProse.test.ts` enforces uniqueness across bands.

**Debug surface:** `window.__DEBUG.bandPhraseUsage()` returns the full `outcomeBandPhraseHistory` Map. `window.__DEBUG.bandPhraseUsage(agentId)` returns the used-ids Set for one actor. Filter DebugPanel Trace tab on `outcome_band_prose_selected` to see every band/phrase pick with its `phraseTable` discriminator.

**What this changes for content authors:** When writing step afterimages, you no longer need to write separate success/failure text for the "degree" of outcome. Write one template that uses `{outcome_phrase}` and the engine supplies the register. The prose shifts naturally: a surge success reads triumphant; a strained success reads costly; a catastrophe failure reads dire — without you writing 6 variants.

**Scope:** Afterimage fields only. `narrativeTemplate` (step bodies) and aftermath prose (`recent_event.message`) do not receive `outcomeBand` — they are authored to a fixed voice. If you want band-aware body prose, route it through the afterimage fields or propose an extension.

**Trace verification:** `outcome_band_prose_selected` trace type, defined in `src/types/trace.ts`. Fields: `band`, `phraseId`, `phraseTable: 'outcome_phrase' | 'q_flavor'`.

---

## Capability: Rival schemes (THR-66)

Rivals launch **multi-phase schemes** — a `Composition` of `kind: 'rival-scheme'` with four phases (rumor → materialization → response → crack) that rides the THR-225 composition phase runner. This is the antagonist layer content authors extend when they want rival-driven pressure.

**How it works:** `phaseRivalActions` (orchestrator) decides on a rival's ~10-tick action tick whether to launch a scheme (`selectRivalScheme`) or make a cheap probe (the legacy flat action). On launch it builds an `ActiveComposition` from a `RivalSchemeFamily` (`buildRivalScheme` in `src/engine/rival.ts`), attaches the four phases inline, stamps `sponsorRivalId`/`schemeFamily`, and arms phase 1 via a world-flag. Each subsequent tick the rival **invests** (increments a world-flag counter); when it clears `RIVAL_SCHEME_PHASE_INVEST_TICKS[tier]` the next phase's readiness world-flag is set, the runner activates that phase, and `phaseRivalActions` executes the phase's concrete **move**.

**Authoring a new family:** add a `RivalSchemeFamily` in `src/data/rival-schemes/` (see `corruptive.ts`/`territorial.ts`/`economic.ts`/`profane.ts`). Each of the four `beats` declares a `move` (`rumor` | `materialize` | `escalate` | `crack` | `drain_stock` | `sever_route` | `contest_source` | `desecrate_source`), a `voice`, and ≥3 attributed prose variants with `{rival}`/`{location}` placeholders (baseline register per THR-609; lyricism reserved for the crack beat). Register the family in `src/data/rival-schemes/index.ts`, set `eligibleBehaviors` + `minTier`. The move kinds are executed by the switch in `phaseRivalActions`; a genuinely new move kind means extending both the `RivalSchemeMoveKind` union (`types.ts`) and that switch.

> **Keep one beat as `materialize`.** That move is what binds the counter-play surface (and the attribution edge), so a family whose four beats are all bespoke moves cannot be countered — the stall→fail loop has nothing to detect. The economic family keeps its phase 2 (`corner-grain`) on `materialize` for exactly this reason, at the cost of one beat of thematic purity.

**Substrate-gated families (THR-619).** A family may declare `requiresStocks: true` when its moves need the Mortal Economy stock substrate (THR-615). `eligibleSchemeFamilies(behavior, tier, worldHasStocks)` then **filters it out of the candidate list entirely** until the caller proves stocks exist — `phaseRivalActions` measures once per tick with `worldHasResourceStocks(state)`. The parameter defaults to `false`, so a caller that has not measured the world cannot launch a substrate-dependent family by omission. Prefer this filter shape over letting a family launch and no-op: an ineligible family lets the rival pick another family or probe, whereas a launched-but-inert scheme occupies a concurrency slot doing nothing. Model any future substrate gate the same way.

**Profane moves — acting on something the player owns (THR-621).** `contest_source` sets `contestedBy` on the essence source at the target host; `desecrate_source` sets `desecrated`. Everything downstream — the `contested`/`desecrated` tier flip, the leaked income, the per-tick sanctity bleed, the ×0 yield — is the shipped THR-611 substrate reacting, so these two moves write **only** those two flags and own nothing else. Before this landed, no production code set either field: only tests wrote them and only the Defend op cleared them (the `optional-field-no-writer` shape — grep for the *assignment*, never just the read).

Three things make this family different from the others, and any future family that acts on player property inherits all three:

1. **Its target is chosen from the player's portfolio, not from locations at large.** A family declaring `requiresPlayerSource: true` is targeted via `selectContestableSource` (keystone-weighted, so rivals go for the richest holding) instead of `selectSchemeTarget`. Gate it with `worldHasContestableSource(graph, ascendantId)` — same shape as `requiresStocks`, same safe `false` default. Exactly one selector runs per launch, so exactly one draw leaves the rng stream (NFP #3).
2. **The generic counter-play check is inverted for it, and this is the trap.** `detectSchemeCounter` normally treats an ascendant `controls` edge on the target as the player pushing back — but a source-contesting scheme's target is player-controlled *by definition*. Unguarded, the scheme counters itself on tick one and can never advance past its first beat. So `detectSchemeCounter` takes the family and, for `requiresPlayerSource`, reads the **Defend leg** instead: countered exactly when the source stops naming this rival in `contestedBy` after the drain opened. `desecrate_source` is likewise gated on `contestedBy === rivalId`, so warding before the crack beat leaves it nothing to profane — the arc genuinely breaks on the player's response.
3. **The redirected income needs a home, because rivals are not graph nodes.** They live in `state.rivalDefinitions` / `state.rivalStates`, never in the graph — which is also why `sponsors_scheme` edges from a rival throw `Source node not found` and are swallowed by the move dispatcher's fail-soft catch. `computeRivalDrainYield` measures precisely what the player loses (against the tier the source would hold with no rival on it, scaled by `RIVAL_SOURCE_DRAIN_CAPTURE`) and `phaseRivalActions` accrues it onto `RivalState.drainedEssence`. Inspect with `window.__DEBUG.getRivalSourceDrains()`.

> **The hex marker layer reads the source bag, not the edge.** `buildRivalInfluenceMarkers` originally read only `sponsors_scheme`, which per (3) can never bind — so the layer rendered nothing for its whole life despite being fully wired through to `RivalInfluenceMesh`. It now also emits from `contestedBy` on host nodes, which carry real hex coordinates. If you add a rival surface, prefer a signal on a real graph node over one on the rival.

**Economic moves (THR-619).** `drain_stock` sours the target location's *richest* resource by `RIVAL_SCHEME_STOCK_DRAIN_FRACTION` (floored at `RIVAL_SCHEME_STOCK_DRAIN_FLOOR`) and deliberately **does not write `stockTier`** — the THR-615 stock-tier phase re-derives it, so tier derivation stays single-owner. `sever_route` removes up to `RIVAL_SCHEME_MAX_ROUTES_SEVERED` `trades_with` conduits at the target **and** degrades every player `IntelligenceRecord` whose `targetRegion` matches the target's region by `RIVAL_SCHEME_ROUTE_CUT_INTEL_PENALTY` — the Flow Web nervous-system coupling (a severed route makes a region go dark). Both no-op fail-soft on a target with no stocks / no routes / no region. Note `trades_with` conduits are **location→location** in every shipped producer despite the edge schema's declaration (THR-830).

**Escalation:** `computeRivalEscalationTier(state)` blends the doom stage with the highest ascendant thread `InfluenceTier` (fail-soft to doom-only) → tier 0–3. Tier scales max concurrent schemes, invest speed, and family ambition — all in `src/data/rival-scheme-config.ts`. Nothing bespoke; it rides the existing clocks.

**Attribution + surfaces:** every scheme is attributed via `ActiveComposition.sponsorRivalId` + the denormalized `RivalState.schemes` summary. ⚠️ The third leg — a `sponsors_scheme` edge (rival → target location, bound at the materialize move) — **does not currently bind in a real world**: rival gods are not graph nodes, so `addEdge` from a rival source is dropped and a 200-tick seeded run contains zero rival-scheme edges (measured THR-619; pre-existing since THR-66, affects all families). Do not key new surfaces on that edge until **THR-829** resolves it; use `sponsorRivalId` / `resolvedNodes.target` instead. Surfaces: RivalPanel scheme cards + phase chips, ChronicleRail (the runner's phase story beats + a cool-failure beat on fail), launch/crack toasts, and the HexMapV2 rival-influence overlay (`buildRivalInfluenceMarkers` → `RivalInfluenceMesh`). Never leave a scheme move with only an engine-state surface.

**Counter-play:** `detectSchemeCounter` treats player presence at the target (a `thread`/`controls`/`holds_place_of_power` edge, or the target destroyed) as a counter — stall once, fail on the second. A failed scheme's already-activated phases stay real (half-thwarted is canonically half-thwarted) and it emits a cool-failure chronicle beat.

**Traces:** `rival.scheme_launched`, `rival.scheme_phase_advanced` (carries `move`), `rival.scheme_countered` (`stalled`|`failed`), `rival.scheme_completed`, plus `rival.scheme_stock_drained` (resource + before/after quantity) and `rival.scheme_route_severed` (severed partner ids, region, records degraded) — all in `src/types/trace.ts`. Emit them through `emitRivalTrace`, not `emitTrace`: `emitTrace`'s `Omit<TraceEntry, …>` parameter collapses the union to its common fields, so a new trace's extra fields are silently rejected unless its type is added to the `RivalTraceInput` union.

**Debug:** `window.__DEBUG.getRivalSchemes()` lists active/terminal schemes; `window.__DEBUG.forceRivalScheme(rivalName, family)` launches one for QA.

---

## Capability: Notable agendas (THR-630)

The world's prominent figures pursue **four-phase agendas** — the living-world counterpart to rival schemes, riding the same THR-225 composition runner with the same executor shape. Faction leaders (resolved through the canonical `getFactionLeaderId` seam) are scored for prominence (scope · power · drive · proximity-to-player-threads) and up to `MAX_ACTIVE_NOTABLE_AGENDAS` (7) carry one agenda at a time. This is the layer content authors extend when they want the world to *do things* near the player that aren't the player's doing.

**How it works:** `phaseNotableAgendas` (`src/engine/notableAgendas.ts`, runs after `phaseRivalActions`) scans the roster every `NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS` (12), launches agendas into free budget slots, invests each tick to arm phases via world-flags (`agendaFlags`), and executes each phase's concrete move when the runner activates it. Chronicle beats come from the prose baked into each phase's `rationale` at launch.

**Authoring a new family:** add a `NotableAgendaFamily` in `src/data/notable-agendas/` (see `claim.ts` for the shape, `campaign.ts` for a family with a real-world side effect). Four `beats`, each with a `move` (`rumor` | `materialize` | `escalate` | `crack`) and ≥3 prose variants using `{notable}`/`{faction}`/`{target}` placeholders (baseline register, THR-609). Set `targetKind` (`location` = foreign holding, `own-location` = the notable's own, `notable` = another leader, `none` = anchors on the sponsor) and `sphereLean` (drives the pressure sphere). Register in `index.ts`.

**Real graph footprints (don't write hollow families):** materialize binds `sponsors_scheme` (location targets, `sponsorKind:'notable'`) or `hostile_to` (actor targets — a declared feud IS hostility). Family-specific effects live as keyed hooks in the executor: `succession` anoints a real `will_succeed` heir (consumed by `phaseFactionSuccession` on the next leader exit), `campaign` raises a **real army** via `spawnArmy` (the notable commands in person when iron-capable; objective = conquer the campaign target) and then the shipped war machinery owns it. Campaign is also how **nations** (factionDefId null, outside `scoreEligibleAmbitions`) reach the war system — through their leaders.

**Thread-takeover:** threading a notable removes them from the launch pool, and threading the sponsor of an active agenda freezes it (no invest, no counter churn) — the player's attention displaces autonomy by design.

**Counter-play:** same surface as rival schemes (player controls/holds the target or has a thread to an occupant; for feuds, a thread to the target notable is protection) — stall once, fail at `NOTABLE_AGENDA_COUNTERS_TO_FAIL`.

**Traces:** `notable.agenda_launched` (carries `prominence`), `notable.agenda_phase_advanced`, `notable.agenda_countered`, `notable.agenda_completed`, plus ONE aggregate `notable.roster_scan` per scan tick (never per-notable — ring-buffer budget).

**Surfaces:** NotablesPanel (top bar, ♛) with family-colored phase-chip cards; Chronicle beats via the runner; a crack toast for terminal beats. Constants in `src/data/notable-agenda-config.ts`.

**Debug:** `window.__DEBUG.getNotableAgendas()` lists live agendas; `window.__DEBUG.forceNotableAgenda(notableName, family)` launches one for QA.

## Capability: Trait hooks — one gate vocabulary across every system (THR-786)

A **trait hook** is content reacting to *who someone is*. Traits are inert on their bearer — all their power is in being referenced — so the hook lives in your content, not on the trait. As of THR-786 every trait gate in the engine resolves through one predicate, so a ref you write means the same thing wherever you write it.

**The ref forms — all four are equivalent.** Name a trait by any of:

| Form | Example | Notes |
|---|---|---|
| trait node id | `trait.mastery.smithing` | fully explicit |
| short id | `mastery.smithing` | the node id minus the `trait.` prefix |
| display name | `Master Smith` | the trait node's `name` |
| tag | `#craft` | any entry in the definition's `tags[]` |

Resolution is **ANY-match**: a tag shared by several definitions is satisfied by a bearer holding any one of them. So `#craft` is a deliberate way to write "any crafting trait" — use it when the hook is about a *kind* of person, and a node id when it is about one specific trait.

**Where you can author a hook today:**

- **Effect predicates** — `has_trait:<ref>` / `lacks_trait:<ref>` in any `predicate` field (choice-set options, conditional effects). The most common hook.
- **Ambition steering** — `requiredTraits` / `blockingTraits` / `boostingTraits` (bare ref strings) plus `agent_has_trait` / `agent_lacks_trait` graph conditions in milestones and abandonment triggers.
- **Spell prerequisites** — `prerequisites.requiredTraits` (bare ref strings).
- **Encounter template variants** — `traitVariants[]` and `StepNudge.requiredTrait` (WS0, THR-773): a variant fires when the acting agent holds `traitId`, contributing a named forecast factor.
- **Item grants** — a `trait_grant` effect makes its bearer satisfy a gate naming the granted key, for as long as the item is held and active.
- Template-level `requiredTraits` / `blockedByTraits` are implemented in the filter pipeline but **not yet declarable** — the fields are still missing from `UnifiedActionTemplate` (THR-801).

**`minLevel` where the shape allows it.** Only `TraitPredicate` (`{ traitId, minLevel? }`) carries a level floor; the bare-string forms match at any level. An item-granted trait counts as level 1 exactly, so it can never satisfy `minLevel: 2`.

**⚠️ Check your ref before you ship it.** A ref matching no trait definition is silently and permanently false — a hook that reads like content but is dead on arrival. Run:

```javascript
window.__DEBUG.validateTraitRefs()
```

`dead[]` lists every authored ref nothing can satisfy, with the authoring path. `phantomGrants[]` lists grant keys with no definition behind them (the gate works, but the trait has no name or visibility to display). **This is not hypothetical**: the 2026-07-26 baseline sweep found 62 dead gates across shipped ambition and choice-set content, because authored refs are bare snake_case (`master_smith`) while every definition uses `trait.<category>.<kebab>` ids, Title Case names and `#tags` — two vocabularies that had never intersected (THR-800). Until that lands, **write refs that match a real definition** and verify with the sweep rather than copying the surrounding snake_case style.

**Two canon rules bind every hook you write:** (1) a trait hook always *names* its trait to the player — no invisible modifiers; (2) trait levels never surface as numerals, words only. And a trait reaction colors the curated moment; it never raises its own notification.

**Where it lives:** `resolveTraitPredicate` / `collectBearerTraitRefs` / `bearerMatchesPredicate` in `src/engine/traits.ts` + `src/engine/traitRefIndex.ts`; the sweep in `src/engine/traitRefValidation.ts`. Bearer-agnostic by construction — the same resolver serves mortals, companies, factions, cultures, and (schema-legal today) locations, which is what waves 2–3 build on.

---

## Capability: Residence hooks — "where they're from" and "how long they've stayed" (THR-822)

**What you can now author:** an ambition milestone or abandonment trigger that reads a mortal's *residence* — the position they originated at, and how long they have held their current one. Two `GraphCondition`s, alongside the trait/reach/bond vocabulary above:

| Condition | Holds when |
| -- | -- |
| `{ type: 'agent_settled_since', minTicks }` | The agent has held one position for `minTicks` — measured *within the asking ambition's lifetime* (see below). |
| `{ type: 'agent_away_from_origin', minTicks }` | Same, and that position is not the one the agent originated at. |

Position is whatever the agent's single `located_at` edge points at, so this works at any tier of the hex → location → sublocation model; moving between two sublocations of one town is a move.

**The window rule — read this before you author a threshold.** Dwell is counted from `max(arrivedTick, assignedTick)`, where `assignedTick` is the ambition's own. That means a settledness trigger **cannot** hold before `assignedTick + minTicks`, whatever the agent was doing beforehand. Without it, these would be the classic inverted-risk abandonment bug: a long-lived agent who happens to be standing still abandons on the first tick it is evaluated, so the ambition never runs at all — strictly worse than a trigger that never fires. THR-813 declined to ship exactly that; the window is why THR-822 could.

**Author thresholds in tens of ticks, not units.** Residence is *observed* every `MILESTONE_CHECK_INTERVAL` (15) ticks from `phaseAmbitionProgress`, not written by movement code, so arrival ticks are quantized to that interval and an agent that leaves and returns inside one interval is never seen to have moved. A game day is 12 ticks; the two shipped thresholds are `SETTLED_DWELL_TICKS = 72` (six days) and `EXILE_ACCEPTED_DWELL_TICKS = 120` (ten). Import them rather than writing bare numbers.

**Why observed and not stamped on the edge.** There are ~24 `located_at` writers in `src/` and the count is not stable; instrumenting them all means a 25th writer added later silently strands its movers at a stale arrival tick, reading as *more* settled than the agent is. The observer compares against the last recorded position instead, so every mover is covered including ones that do not exist yet, and no movement code needs to know residence exists.

**Check it before you ship it:**

```javascript
window.__DEBUG.getAgentResidence('Kael')
// -> { originLocationName, positionName, livePositionId, arrivedTick, dwellTicks, awayFromOrigin, … }
```

`dwellTicks` there is the *unwindowed* total; a live trigger measures from the ambition's assignment and will read shorter. `positionId` may lag `livePositionId` by up to one interval right after a move — both are returned so the lag is visible rather than confusing.

**Fail-soft, in the safe direction.** No clock in the evaluation context, no arrival ever observed, or (for the origin variant) no origin recorded all evaluate to `false`. Absent evidence must never end an ambition — a trigger that fired on missing data would abandon for the least-observed agents first.

**Where it lives:** `src/engine/agentResidence.ts` (primitive + constants), `graphConditions.ts` (the two cases), `ambitionLifecycle.ts` (builds the window from `assignedTick`), `ambitionTick.ts` (calls the observer on its existing all-actor walk). Shipped consumers: the abandonment triggers on `ambition_flee_the_ravaged_land` and `ambition_reclaim_homeland`.

## Capability: Nudge cards that cost, grant, and filter (THR-885)

A nudge card used to do exactly one thing — shift the forecast, and optionally remap the
outcome band through a rider. It can now **charge non-essence costs**, **change the world**,
and **be dealt conditionally on world state**. This is the god's hand as an activation
surface: several systems sat idle because nothing dispatched them, and the hand is a natural
dispatcher for nearly all of them.

### What you can author on a `StepNudge`

```ts
{
  id: 'quiet_their_mind',
  name: 'Send restful dreams',
  essenceCost: 2,
  forecastDelta: 0.15,
  fiction: 'You quiet their mind while they sleep, so the rest actually counts.',
  effectLine: 'Helps them wake steady.',

  // Cost channels — paid in something other than essence.
  costs: { detectionDelta: 0.08, doomDelta: 0.05 },

  // Grants — expressed in the ORDINARY aftermath effect vocabulary.
  grants: [
    { kind: 'remove_condition', conditionTraitId: 'trait.condition.exhausted' },
  ],

  // Runtime filters — the hand reflects the world as it is.
  requiresGroup: true,     // dealt only inside a group
  requiresFavor: true,     // dealt only when a favor is owed to the mortal
  requiredTrait: 'trait.…' // (pre-existing) dealt only to a mortal who holds it
}
```

### Grants are the aftermath vocabulary — do not invent a card vocabulary

`grants` is `EncounterAftermathReactionEffect[]`, the *same* list an aftermath reaction
carries, dispatched by the *same* applier. So everything you already know how to author works
unchanged, and every card reaches the system that owns the change:

| Card type | Effect kind you author | System it reaches |
|---|---|---|
| The Omen | `emit_omen` | omens (biases future encounter draws) |
| The Balm | `remove_condition` | conditions |
| The Cache | `spawn_artifact` | artifacts / attachments |
| The Long Game | `hidden_mark` | traits & marks |
| The Favor / The Bargain | `favor_creation` | secrets & favors |
| The Kindled Ambition | `assign_ambition` | ambitions |
| The Compulsion | `plant_compulsion` | agent decision bias (THR-886) |

`assign_ambition` and `plant_compulsion` are the only new kinds, and both exist because the
capability was genuinely missing. Reactive ambition templates had **no assignment path at
all** outside `ambitionTick` (THR-812 / THR-726), so a whole class of authored templates was
unreachable. `assign_ambition` takes an `AMBITION_TEMPLATES[].id`, an optional `priority`, and
an optional `narrativeHook` (omit the hook and the planting is silent — desire is interior).

### The Compulsion — plant a weight, not a menu

```ts
grants: [
  {
    kind: 'plant_compulsion',
    encounterBias: { duel: 0.8, trade: -0.4 },   // lean toward, lean away
    durationTicks: 3,                             // optional; COMPULSION_DEFAULT_DURATION_TICKS
    narrativeHook: 'A dream of steel will not leave them.',
  },
],
```

The urge is **addressed to a mortal, not to a place**. That is the whole card — "steer them,
not the world" — and it is why this does not reuse `emit_omen`: an omen stains a hex and
catches whoever walks through it, while a compulsion travels with the person it was dreamt
onto. Two mortals on the same tile can hold different urges, or none.

`encounterBias` is keyed on the closed `EncounterType` union (`explore`, `acquire`, `create`,
`hire`, `duel`, `steal`, `trade`, `assist`, `build`, `lead`), so a misspelled type is a
**compile error** rather than a card that silently does nothing — which is exactly the defect
this card shipped with for a month before THR-886. Weights are scaled by
`COMPULSION_BIAS_WEIGHT` and clamped per type at `COMPULSION_BIAS_CAP`, then folded into the
same `combinedBias` in `phaseAgentDecision` that the identity and omen terms feed. One reader,
not a second parallel one.

**Author the `narrativeHook`.** It is optional in the type and near-mandatory in practice: the
tilt resolves through the mortal's ordinary decision, so without a chronicle line a successful
compulsion is indistinguishable from the do-nothing behaviour the card had before it was
wired. You steered them and nobody can tell.

The urge **expires** (`expiresTick`) rather than being consumed on use. "Their next decision"
is expressed as a short duration because the scoring path is a read — making it write state
would both add a mutation to a pure seam and burn the urge on selections the strategic-
candidate override can still overturn later in the same phase.

Note this does **not** touch `premonitionCompulsion` / `buildCompulsionEvent`. The
pick-one-of-three Compulsion vision stays on the god's own premonition turn; a card played
mid-encounter plants a weight instead of nesting a second choice-screen inside a scene the
player is already resolving (Christian's ruling, 2026-08-09).

### A card that names unbuilt content fails the build

Every id a card grants — ambition, artifact, condition — is checked against the shipped
catalogs by `validateNudgeGrantRefs` (`src/engine/nudgeGrantLiveness.ts`), pinned by
`src/engine/__tests__/nudgeCardSystem.test.ts`. This is not optional politeness: a dead
reference no-ops silently deep inside the applier while the card's fiction still prints, so
the player is told a thing happened that did not. THR-844 is the standing evidence — 66 of
138 hidden-mark entries pointed at a reveal family that never existed. **Ship the content
with the card.**

### Cost channels

`detectionDelta` is signed. Positive is The Heavy Hand (help that is *seen* — rivals notice);
negative is The Veil (the same help, unwitnessed). It lands on the acting mortal's region and
clamps to `[0, 1]`, and the trace reports what was *actually* applied after clamping, not what
you asked for. `doomDelta` pushes the doom clock's tick modifier — positive runs it faster.

Channels **sum across the committed hand** before they are charged, which is what lets a
player pair The Veil against The Heavy Hand and net off. A net-zero channel is not charged.

### The Signature — sphere discount

A card whose `sphere` the ascendant is aligned to costs `SPHERE_DISCOUNT` (1) less, floored at
`SPHERE_DISCOUNT_MIN_COST` (1). **An authored-free card stays free** — free is a decision you
make, never a number a discount arrives at. Author the full price; the discount is applied by
`effectiveNudgeCost`, which both the affordability check and the deduction share (quoting one
number and charging another is the bug this feature otherwise ships with).

Full sphere *gating* stays parked with THR-870. This is a discount only.

### The Gambit — `all_or_nothing`

The third rider. It widens **both** ends: `success` → `critical_success`, `success_at_cost` →
`success`, `near_miss` → `failure`, `failure` → `critical_failure`; crits pass through. It is
the only rider that can make an outcome *worse*, which is why it sits last in
`NUDGE_RIDER_PRIORITY` — a hand holding both The Gambit and a protective card keeps the
protection. Like every rider it takes **zero** rng draws (NFP #3).

### Filters hide, they do not dim

`requiresGroup` and `requiresFavor` *hide* an unmet card, matching `requiredTrait`. The rule:
dim when the player could pay the price, hide when they could not possibly make it true from
inside the encounter. A card you cannot ever reach is noise, not a goal.

### Where it lives

`src/engine/encounters/nudgeDispatch.ts` (routing + cost channels),
`src/engine/encounters/nudges.ts` (hand assembly, filters, discount, rider maps),
`src/engine/ambitionAssignment.ts` (`assignAmbitionToActor`),
`src/engine/nudgeGrantLiveness.ts` (the build gate), constants in
`src/data/nudge-constants.ts`. Dispatch fires from `phaseAutonomousAftermath`, after the
encounter's own aftermath, so a card's grant lands on the world the encounter left behind.

## Capability: The Repertoire — a card library, gated by who the god is (THR-887)

THR-885 gave you cards that cost, grant, and filter *inside one encounter*. This capability
is the layer above: which cards a god holds **at all**, across a whole run and into the next
one. Author against it whenever you write a hand — a card the god cannot hold is withheld
before the player ever sees it.

### Point an authored card at its library member

Add `libraryCardId` to a `StepNudge`:

```ts
{
  id: 'steady',                       // unique within this template
  libraryCardId: 'card.boost.core',   // shared identity across every template
  name: 'Steady his hand',
  essenceCost: 2,
  forecastDelta: 15,
  fiction: '…',
  effectLine: '…',
}
```

`id` is local; `libraryCardId` is the card's identity everywhere. Two encounters that both
deal the core Boost carry different `id`s and the *same* `libraryCardId`, which is what lets
the twilight harvest ask "how often did this god play Boost" across a run instead of counting
per-template aliases as different cards.

**`libraryCardId` is optional and its absence is supported.** A card without one is a one-off
authored option: fully playable, never withheld by the repertoire gate, and never a candidate
for the echo card. Use one when the option is a library card; leave it off when it genuinely
belongs to this template alone.

### What the repertoire withholds

A card whose `libraryCardId` names a member the god does not hold is dimmed `sphere_locked`,
which the player stage withholds and the designer view still lists. A god holds a member when:

| Held because | Rule |
|---|---|
| universal core | `UNIVERSAL_CORE_TYPES` — Boost, Insurance, Mercy, trait cards. Every god, always. |
| primary sphere | the member's `sphere` is the god's primary. Full price. |
| secondary sphere | the member's `sphere` is the god's secondary. `SECONDARY_SPHERE_DISCOUNT` off. |
| hunger unique | the member's `hunger` is the god's hunger. **Ignores sphere entirely.** |
| milestone | `unlock.unlockActionId` is in `unlockedActionIds` — the same grant set `unlock_action` writes. |
| god trait | `unlock.traitId` is a god-earned trait (THR-791 — live, resolves to nothing today). |
| echo | carried in from a previous run. **Ignores sphere entirely.** |

**Access is read per member, not per type.** `order` signs Insurance and `energy` signs Boost,
both of which are also universal core. If you read access off the type you hand `order`'s
signature Insurance to every god in the game — the bug the "⁺" notation exists to prevent, and
which a test now pins.

### Progression is variation, not power

A milestone grants a new *member* of a family the god already plays — same verb, different
twist or cost channel. Almost nothing is strictly stronger. When you add a variation member,
add it to `VARIATION_MEMBERS` in `src/data/nudge-card-library.ts` against the milestone that
grants it; do not invent a second unlock ledger, and do not make it a bigger number on a card
that already exists.

### The echo card

At twilight the harvest picks the run's defining card — most played, ties broken by the most
climactic moment it was played at, then by card id so a saved run replays identically — and
carries it into the next run's starting repertoire regardless of sphere. A triumphant or
bittersweet age returns it whole; a **somber** one returns it scarred: cheaper by
`ECHO_CARD_SCAR_DISCOUNT`, carrying an `ECHO_CARD_SCAR_PENALTY` forecast penalty.

Nothing to author — it rides the tally written at nudge commit. What you *do* owe it is
**stable library ids**: renaming a member id retires the card, and a save that carries it
drops the echo with one warning at world-seed. Rename deliberately, or not at all.

### Content is optional, structure is not

`title` and `quote` are optional and currently absent on every member — card content is
authored under THR-883. An unauthored card is dealable, gated, priced, and renders as its own
keyword. Add prose without touching the schema; `unauthoredCardCount()` is the backlog number.

### Where it lives

`src/data/nudge-card-library.ts` (the library: types, signatures, hunger uniques, members),
`src/engine/nudgeCardRepertoire.ts` (access, unlock resolution, echo selection and carry),
`src/engine/encounters/nudges.ts` (`repertoireCardIds` on `NudgeHandContext` — the gate),
`src/engine/cycleEnd.ts` (harvest selection), constants in `src/data/nudge-constants.ts`.
The catalog's human surface is `public/nudge-cards-reference.html`, freshness-gated against
the library file.

---

## Capability: Agent-decided branches — the mortal picks the fork (THR-894)

**Author a branch the acting mortal resolves from who they are, and let taking it
change who they become.** Before this, `ActionStepBranch` selected a variant by a
recorded `choiceId`, and the only thing that ever recorded one was the retired
player-pick. A branch you authored today could only ever take `fallback` — the
fork was in the schema and unreachable in every run.

### What you can author

Two opt-in fields. Absent, everything behaves exactly as it does today.

**On the branch — `decidedBy`:**

```ts
{
  branchOnStep: 0,
  decidedBy: { axis: 'honesty_cunning' },   // any live ValuePair
  variants: {
    positive: { /* the honest arm */ },     // first-named pole of the pair
    negative: { /* the cunning arm */ },    // second-named pole
  },
  fallback: { /* still required — used when no decision was recorded */ },
}
```

The variant keys are **not free strings**. A `decidedBy` branch must key exactly
`positive` and `negative`; a typo fails template validation at build time rather
than sending every decision silently into `fallback` forever (the THR-844 shape,
where 66 of 138 entries were dead and nothing noticed).

**On a card — `poleLean`:**

```ts
nudges: [{
  id: 'steady_their_hand',
  // …the usual card fields…
  poleLean: { axis: 'honesty_cunning', toward: 'positive', weight: 0.5 },
}]
```

`weight` is optional (defaults to `POLE_LEAN_DEFAULT_WEIGHT`). A card with no
`poleLean` **abstains** — it moves the odds without arguing for a direction,
which is the common and correct way to author most cards.

### How the decision is made

At the moment `branchOnStep` resolves:

1. **The mortal's live position** on the axis — their standing `AxiologicalProfile`
   baseline *plus* accumulated `archetypeDrift`. Reading the live value, not the raw
   baseline, is what makes the loop close.
2. **Plus the god's argument** — the net signed `poleLean` of the cards actually
   committed on that step (`activeNudges`). A card dealt but not played counts for
   nothing.
3. **The sign picks the pole.** Inside `BRANCH_DECISION_NEUTRAL_EPSILON` of zero the
   mortal genuinely has no answer, and a seeded coin settles it.
4. **The pole is recorded as an ordinary choice** through the existing
   choice-history path, so `resolveStepDefinition` reads it exactly as it reads a
   player pick. There is no second branch-resolution route.
5. **The pole drifts the mortal toward itself** by `BRANCH_DECISION_DRIFT_MAGNITUDE`,
   through the same `applyDriftMagnitude` accumulator `phaseChoiceResolution` uses —
   so decay, threshold crossings, and the `archetype_drift_register` reveal all see it.

### The axis must match, and that is the point

A card's `poleLean` counts **only** toward a branch deciding on the *same* axis. A
card arguing about mercy has nothing to say about a fork between courage and
prudence, and silently counting it would be the worst kind of wrong: plausible,
invisible, and load-bearing. If a deciding step deals no card leaning on its
branch's axis, validation **warns** — legal (the mortal decides alone), but far
more often it means a card names the wrong axis and is abstaining silently.

### The player never picks

This is the design, not an implementation detail. The god *leans*; the mortal
*chooses*; the choice is theirs to keep. Do not author a `decidedBy` fork as a
disguised player choice — the surface for a player decision is the card they
commit, and the fork is what the mortal does with it.

### Determinism

The coin is drawn **only** inside the neutral band — the one branch where its
value is used, mirroring the meeting's `resolveWrittenPole`. Drawing it
unconditionally would advance the stream on decided forks too, desynchronising
two runs that differ only in how convinced a mortal was.

### Where it lives

`src/types/unifiedAction.ts` (`StepNudgePoleLean`, `BranchDecision`, `BranchPoleKey`),
`src/engine/encounters/poleLean.ts` (the shared lean arithmetic — **the meeting calls
this too**; do not copy the summing loop),
`src/engine/encounters/branchDecision.ts` (the decision, the drift write, the trace),
`src/engine/unifiedActionResolution.ts` (the one call site, immediately before
`advanceStep`), constants in `src/data/nudge-constants.ts`, validation in
`src/testing/contentInvariants.ts`. One `branch_decided` trace per decision carries
axis, profile lean, card lean, resolved pole, and whether conviction or the coin
settled it.

## Capability: N-route forks — several ways in, one door (THR-898)

**When a fork is not two ends of one question but several different courses toward
the same objective, author it as routes.** The canonical case is *The Broken
Wheel*: bribe the wainwright, intimidate him, or win him over. Three ways in, one
door, and the mortal — never the player — takes the one that is theirs.

A pole fork asks *"which way do you lean?"*. A route fork asks *"which of these is
your way in?"*. If you can name a single axis whose two ends are your two arms,
use `decidedBy: { axis }` (above). If your arms are three unrelated approaches,
use routes.

### What you can author

```ts
{
  branchOnStep: 0,
  decidedBy: {
    routes: [
      { key: 'bribe',      reach: 'gold' },
      { key: 'intimidate', reach: 'iron' },
      // A route may ALSO speak to a value axis — then it drifts, like a pole.
      { key: 'persuade',   reach: 'heart', axis: 'honesty_cunning', toward: 'positive' },
    ],
  },
  variants: {
    bribe:      { /* … */ },
    intimidate: { /* … */ },
    persuade:   { /* … */ },
  },
  fallback: { /* still required */ },
}
```

`variants` must key **exactly** the declared route keys — same contract as pole
mode, same reason: a key matching nothing is a course the mortal can score
highest on and never actually take. Validation also enforces unique keys, live
reaches, a `toward` wherever a route declares an `axis`, at least 2 routes, and at
most `MAX_BRANCH_ROUTES`.

**On a card — a route-explicit `poleLean`:**

```ts
poleLean: { route: 'bribe', weight: 0.5 }   // names a course, not an axis
```

A route-explicit card counts **only** toward the route it names, and abstains
from every two-pole decision — a route key is not an axis and must never be read
as one. Route leans are *unsigned*: a card arguing for "bribe" is not thereby
arguing against "intimidate", it simply says nothing about it.

### How the route is chosen

Three terms, each a named constant (NFP #1):

1. **Capability in the route's reach** × `ROUTE_DECISION_CAPABILITY_WEIGHT` — the
   dominant term, via the same `computeCapability` read resolution itself uses. What
   makes a course someone's is being able to walk it: a thief bribes because bribery
   *works* when they do it.
2. **Axis standing** × `ROUTE_DECISION_AXIS_WEIGHT`, signed toward the route's pole —
   zero for a route that declares no axis. Character colors which course a mortal
   reaches for; it does not override being hopeless at one.
3. **Committed cards** × `ROUTE_DECISION_CARD_WEIGHT` — cards naming the route, plus
   cards arguing on the route's axis. Cards dealt but not played count for nothing.

Highest score wins. Leaders within `ROUTE_DECISION_TIE_EPSILON` are genuinely tied
and a single seeded draw settles it — drawn **only** when tied, mirroring the pole
coin. The winning key is recorded through the same choice-history path, and a
winning route that declares an axis drifts the mortal toward its pole by
`BRANCH_DECISION_DRIFT_MAGNITUDE`, exactly as a pole decision does. A
pure-competence route drifts nothing — there is no claim about character in "they
were good at this."

**Tuning note:** capability runs through a sigmoid with midpoint 10, k 0.4, so raw
domain scores above ~20 saturate. Two routes at raw 30 and 24 differ by 0.003
capability — inside the tie band. If you want capability to actually separate your
routes, the interesting range is raw ~4–16.

### The warn is per route

If the deciding step deals no card arguing for a given route — by name, or on that
route's axis — validation warns **for that route**. A fork where the god can argue
for two of three courses is exactly as steerable as it looks on two of them, and
silently unsteerable on the third.

### Where it lives

Same modules as pole mode. `src/types/unifiedAction.ts` adds `BranchRoute`,
`BranchRouteDecision`, and `isRouteDecision` (`BranchDecision` is now a union);
`poleLean.ts` adds `routeLeanWeight` / `sumRouteLean` / `leansOnRoute` over the
*same* summing loop as `sumHandLean` — do not copy it; `branchDecision.ts` adds
`scoreRoutes` / `decideBranchRoute`. The `branch_decided` trace carries
`mode: 'route'`, the resolved route, and every rival's per-term score.

## Capability: The world mints ambitions — events write desire into mortals (THR-726)

**What you can now author:** an `AmbitionTemplate` that a *world event* plants in a mortal, rather than one the mortal drifts into on their own. A hometown is razed and the survivors mint avengers and refugees; a bond is torn and the bereaved mint their own answer to it.

**These live in their own pool, and that is the whole mechanism.** Author them in `EVENT_MINTED_AMBITION_TEMPLATES` (`src/data/ambition-templates.ts`), **not** `AMBITION_TEMPLATES`. The spontaneous re-evaluation loop draws only from `AMBITION_TEMPLATES`, so a template in the minted pool can never be assigned without a triggering event — the separation *is* the gate. Nothing else marks them: they are ordinary funnel-gated templates, **not** reactive/skip-filter templates.

**The world supplies candidates; personality still chooses.** `mintAmbitionsFromEvents` gathers recent nearby events, expands `AMBITION_MINTING_RULES[eventClass][relation]` into weighted candidates, and then hands them to the same `selectAmbitions` funnel every other ambition goes through. A craven agent flees where a proud one avenges, from the identical event. Author the template so it reads correctly for whoever the funnel picks — you do not get to assume the avenger.

**Four gates stand between an event and a minted ambition,** all tunable constants (NFP #1) — a template that seems never to mint is usually meeting one of them, in this order:

| Gate | Rule |
| -- | -- |
| Free slot | The agent must hold fewer than 2 active `pursues` edges. Minting runs *before* spontaneous drift so events get first claim on a free slot. |
| Per-event cap | `MINT_MAX_PER_EVENT` — one event cannot mint the same ambition across a whole crowd. |
| Already pursued | A template the agent already pursues is dropped from candidacy. |
| Base chance | `MINT_BASE_CHANCE`, drawn from a seeded `mintRng` — deterministic per NFP #3, so the same seed mints the same desire. |

**Do not author a `target_agent_eliminated` milestone.** No code binds a per-instance target, so a `$`-ref milestone tracks nothing the agent can act on. This is repo-wide since THR-812, not a rule local to this pool: the condition now fails soft to `false` on a missing node, so a stray `$`-ref is *inert* rather than a free milestone, and `ambition-templates.test` asserts across **all three** pools that none is reintroduced. Milestones here use agent-self predicates only — reach, bonds, controls, trait. (Earlier framings of this capability described `target_agent_eliminated` as its completion semantics; that is the pre-THR-812 reading and is wrong.)

**The minted node carries the template's `reachAffinity`,** copied at mint time along with `displayName` and `category`, so a minted ambition biases the agent's later encounter scoring exactly as an authored one does. Give the template a real affinity or the desire will not steer anything.

**Check it before you ship it:**

```javascript
// which ambitions an agent actually holds, and how they got there
window.__DEBUG.getAgent('Kael')
```

```bash
# headless: run a world long enough for events to accumulate, then inspect
printf "tick 60\nagent @hero\nevents 20\nexit\n" | npm run cli -- --seed 42 --map medium
```

**Where it lives:** `src/engine/ambitionTick.ts` — `mintAmbitionsFromEvents` (pure: reads graph + snapshot, returns the winning assignment or `null`) and its caller on the all-actor walk, which writes the `pursues` edge and records the per-event cap. Rules table and the pool itself: `src/data/ambition-templates.ts`. The card-granted route into the *same* pool is `assign_ambition` — see the nudge-card capability above; both paths end at one assignment, so a template authored here is reachable from a played card too.

## Capability: The Divine Receipt — the god learns how a cast landed (THR-727)

**What you can now author:** framing prose for the moment a *player-sourced* action resolves. Every paid cast now produces a receipt, and since THR-728 (player casts roll the outcome ladder, floored at `success_at_cost`) the band it reports genuinely varies — before that a cast always returned `success` and the receipt could only say *what* happened, never *how well*.

**Two presentation tiers, and content decides which.** The receipt surfaces as a band-accented completion toast for minor casts, or a full dialogue for the ones worth stopping on. You do not set the tier directly — you author the properties that trigger it (all constants in `src/data/receipt-content.ts`, NFP #1):

| Any one of these forces the dialogue | Constant |
| -- | -- |
| The template has ≥ 2 steps | `RECEIPT_MODAL_MIN_STEPS` |
| Rarity at or above Mythic | `RECEIPT_MODAL_RARITY_FLOOR` (3), read against `action.effectiveRarityTier ?? template.rarityTier` |
| The aftermath carries a world-shifting change kind | `RECEIPT_MODAL_CHANGE_KINDS` (`trait`, `faction_reputation`, `future_hook`, …) |
| Event significance clears the modal bar | `RECEIPT_EVENT_SIGNIFICANCE_MODAL` (toast bar: `…_TOAST`) |

Everything else takes the toast. A one-step Mundane cast whose aftermath changes nothing structural is *meant* to be a toast — do not raise its rarity to get a dialogue.

**Voice: frame the witnessed consequence, never the verdict.** Framing lines are player-as-god register, and THR-609's peak register is acceptable here because the receipt is a rare, deliberate reflection surface rather than at-a-glance UI. The fortunate band says *"the world bent, but only just"* — **not** "Success!". No numbers, no `key: value`.

**Ascendant Beats are excluded by construction.** Beat templates keep their own `AscendantBeatModal`, so the receipt phase skips any template id in `ASCENDANT_POOL_BEAT_TEMPLATES` (matched against a lazily-built id set). Authoring a beat does not get you a receipt, and should not.

**The queue is capped and drops oldest** at `RECEIPT_QUEUE_MAX` (5), so a headless or CLI run where nothing acknowledges receipts never grows unbounded. `playerActionReceipts` is optional/additive on `GameState` — old saves load as an empty queue. Receipts are transient presentation state, deliberately **not** graph nodes: the world-side record already exists as the encounter event node.

**Check it before you ship it:**

```javascript
window.__DEBUG.listPlayerReceipts()
// -> { receipts: [ { templateName, band, tier, essencePaid, … } ] }
```

Fail-soft paths emit their own traces rather than throwing — `fallback_receipt` when no template resolves for a resolved action, `queue_capped` when the cap drops one.

**Where it lives:** `src/engine/playerReceipts.ts` — the phase is registered as `playerReceiptsPhase` (id `player_receipts`, slot `post-resolution`) and the exported entry point is **`processPlayerReceipts`**. Note that several code comments, and older tickets, call this `phasePlayerReceipts`; **no such symbol exists** — grep for `processPlayerReceipts`. Content and tuning: `src/data/receipt-content.ts`. UI: `DivineReceiptModal` (dialogue tier, rendered from `GameView`) and the `ToastStack` click-through (toast tier).

**Not the Motive Receipt.** Capability 11 above covers `MotiveReceipt` — decision-causality contributions behind an agent's encounter *selection* (`__DEBUG.getMotiveReceipt`). This one is resolution-time feedback on a *player* cast. Different system, different surface, unfortunately similar name.

## The Composition Contract — what every new encounter owes (THR-1045)

This one is not a capability you may reach for; it is the **checkable floor** every
factory encounter clears before a PR exists. Run it on anything you author:

```bash
npm run check:encounter -- <templateId>     # one encounter
npm run check:encounter -- --all            # the corpus, as CI runs it
npm run check:encounter -- fixture.encounter.swollen_ford   # the green worked example
```

Eight blocks, each a hard failure naming itself and the plan section it comes from
(`Docs/plans/2026-08-08-encounter-factory-workflow.md` §1):

| Block | What it wants | Reach for |
|---|---|---|
| Steps | 1–3 plain steps, each with reach, difficulty, prose | — |
| Hand | the WS1 checklist, per step | `checkNudgeHand` tells you exactly what is short |
| Setting | a `settings` envelope with one opening per declared class | Capability: setting envelopes (THR-884) |
| Cast | ≥1 **actor** support binding — explicit, or the `encounter.*` family default your setting class carries | § Family default support bundles (THR-1044) |
| Rewards | something persistent: a `rewardPool` draw on a step outcome, or an aftermath effect that leaves a mark | Capabilities 3–5, `spawn_artifact`, conditions, seeds |
| Aftermath | `byOutcome` bands ≥3 — success / failure / **one extreme** — every variant with an overview, `concepts` on every change | Capability 10, THR-969 bands |
| Systems | ≥3 connections among cast · rewards · seeds · conditions · reputation · factions, **counted from what you authored** | this whole guide |
| Images | every card `imageTag` resolving to a real `ENCOUNTER_IMAGE_LIBRARY` row | `src/data/encounter-image-library.ts` |

Then the composed stack: register detectors, card-grant liveness, an enrichment
token dry-run (every `{...}` is one `enrichProse` resolves, every `{frag:*}` and
`{cast:*}` names something declared), and forecast-band arithmetic.

**There is no exemption mechanism** (Christian's ruling 3, 2026-08-08). A shape
that cannot carry a block is a future encounter *type* with its own contract, not
a waiver. The one escape is `RETROFIT_PENDING` in
`src/data/content-eval/retrofitPending.ts`, which holds the 191 pre-contract
templates and **only ever shrinks** — deleting a name is the retrofit's proof, and
CI fails if a listed template starts passing just as it fails on a new one that
does not.

**The worked example is `swollen-ford-exemplar.ts`**, which passes every block.
Copy its shape rather than re-deriving the contract from this table.

## Your aftermath prose is linted now — and half that screen is not yours (THR-1083)

Two things to know before you write an ending, because the second one decides
which half of the screen you can actually fix.

**1. The prose detectors can see `aftermathConfig`.** Until THR-1083 they could
not: `collectClassedTemplateProse` — the single walk every detector reads
through — stopped before the aftermath, so overviews, consequence `detail`
strings, chip titles, reaction labels and intents were outside every prose gate
we own. Measured when the walk was widened, that was ~59k authored words across
295 templates, **36% of the corpus**, never once scored. The line that proved it
shipped to production and into a director review: *"The bridge spent something
on this crossing that it will not get back."* — `something` is the first term in
`EVASIVE_VAGUENESS_TERMS`, and the detector built to catch exactly that word
could not see the field it was written in.

Field classes, which decide how strictly each field is read:

| Field | Class | Why |
|---|---|---|
| `changes[].detail` | `outcome` | The chip **is** the only statement of its consequence, so the strict lexicon applies — indefinites included |
| `overview` | `scene` | The closing paragraph sits above the chips, which name every consequence explicitly; an indefinite here has another source and is ordinary English |
| `changes[].title`, `reactionPrompt`, `reactions[].label`/`.intent` | `interactive` | Labels and rules text, same as `nudge.name` |

Evasive terms (`something`, `somehow`, `the situation`, …) are enforced at zero
in **every** class, so `scene` is not a licence — it only spares the natural
indefinites. Write "he shorted them nothing" freely; do not write "it cost them
something".

**2. The stat-delta chips are generated, and no prose gate can help them.**
`src/engine/aftermathWords.ts` builds them from format strings —
`growthSentence()` emits ``${actorName}'s ${name} grew ${word}.`` for every
capability growth in every encounter in the game, and `traitGrantedSentence`,
`reputationSentence`, `factionStandingSentence`, `reputationTallySentence`,
`gateStateSentence` and `rewardSentence` are the same shape. They are engine
code, not template content, so they are **deliberately outside** the walk: there
is no authored prose there to lint, and flagging a format string would demand a
fix no author owns.

So when an aftermath screen reads like mad-libs, check which half you are
looking at before reaching for the prose. Authored → fix it here. Generated →
that is THR-1082, which replaces those chips with a typed icon + noun +
direction, on Christian's 2026-08-10 ruling that consequence chips become
authored and reserved. Once that lands the generated half stops feeding the
surface and every consequence line the player reads is yours.
