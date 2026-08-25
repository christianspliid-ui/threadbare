# Encounter Support Network — bundle contract, registration audit, and support rules

> **Provenance:** extracted verbatim 2026-08-25 (THR-1252) from `Docs/encounter-building-checklist.md` §§7–7b + Support-Network Audit + Support Matrix + Primitive-Gap/Backlog-Escalation rules — the still-current systemic half of a checklist whose prose/choice half predates the Nudge Model and Prose Doctrine v2 (that file is now superseded; see its banner). These rules govern the *support objects* an encounter needs — cast, factions, locations, rewards, reputation channels — and how they register and persist. The authoring contract for prose and hands is `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`.

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

