> **title:** `Companion attachments — THR-1096`
> **linear_issue:** THR-1096
> **author:** `Claude Code`
> **created:** 2026-08-12
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Companion attachments — THR-1096

*A companion is a named person who walks with a mortal and makes them better at something — a card at the mortal's side, never a simulated agent.*

## Why this is load-bearing

Christian's direction (chat, 2026-08-12, THR-1082 session): *"saved by another wanderer while almost falling, receive an attachment of the type ally (an attachment that is a person that gives bonuses like this example from eldritch horror. they are not an agent, just a part of the retinue that gives a bonus."* The reference (Eldritch Horror's Ally assets, confirmed against the EH wiki this session) has four properties this plan preserves: allies are **individuals who join you**; their bonuses are **small but always in effect** (vs items' situational bonuses); they come in **two tiers** (generic professions and named story characters); and they are **a currency of loss** — other effects can take them from you. Companions are the BOND category's flagship content (THR-1082) and the single biggest palette gap in the consequence vocabulary: today no encounter can answer "who did you meet on the road?" with a game object.

## Substrate inventory

| Substrate | State | This plan |
|---|---|---|
| Attachment system, 7 categories (`src/types/attachments.ts`) | ACTIVE | **extends** — adds `companion` to `AttachmentCategory` |
| "Retainers" — the original sixth category (2026-03-10 design § category table) | **DORMANT, never implemented** — designed as *actor nodes / independent agents*, which Christian's 2026-08-12 ruling supersedes | **replaces the concept** (documented here, not rebuilt): companions are data-cards, not agents. The design doc's retainer row is historical; this plan is the current word |
| `hire-mercenaries` retainer mint (`action-template-content.ts:399`) | ACTIVE but **defective** — mints node type `attachment` (not in `NodeType`) with `ironCapability: 30` that no reader consumes | **migrates** — becomes the first duration-limited companion; the dead property and off-schema node type retire |
| Capability walk (`domainCapability.ts` — `possesses`/`bonded_to` → `domainContributions`) | ACTIVE | **extends** — `accompanies` joins the walk |
| Reward pool (`rewardPool.ts` — category → template node type switch) | ACTIVE | **extends** — `companion` case |
| Condition duration/expiry (edge `ticksRemaining` pattern, THR-761) | ACTIVE | **reuses the pattern** on `accompanies` edges for hired/timed companions |
| Attachment glyphs (`attachmentGlyphs.ts` — `retainer: ♟` already present) | ACTIVE | **reuses** — the glyph keys on `companion` too |
| Agent-name generation (worldgen naming used by `spawn npc`) | ACTIVE | **reuses** — mints each instance's name deterministically |
| Entity-visual resolver / initials-fallback tiles (Law 4) | ACTIVE | **extends** — `companion` visual kind, initials tile default |
| Companies & Group Travel (THR-74) — DORMANT subsystem whose alias list includes "companion" | DORMANT | **distinct, untouched** — a *company* is a group of real agents traveling together (actors with agency); a *companion* is a non-agent card at one bearer's side. Neither system reads the other's nodes; a future feature may let a company's members' companions ride along, but nothing here blocks or builds that |
| `engine/retinue.ts` + `CourtPosition 'retinue'` (`types/influence.ts`) — the **ascendant's** retinue: agents influenced by the god, the threads/retinue panel | ACTIVE | **distinct, untouched — and the word collides.** This plan's surfaces say **"Companions"**, never "retinue", until the UL arbitrates (see § UL note); internal symbol names (`getRetinue`) are code-facing and renamed to `getCompanions` to avoid even internal ambiguity |

## Design decisions

1. **A companion is a graph node of new type `companion`, joined to its bearer by a new edge type `accompanies` (bearer → companion).** Both are designed in full below per the load-bearing rules. The alternatives were rejected explicitly: an `actor` node (the 2026-03-10 retainer model) drags a person into every agent system — decisions, movement, encounters — and needs exclusion flags everywhere, which is precisely what "not an agent" forbids; an `artifact` node gets the capability walk for free but kind-routes a person to the artifact sheet, lists them among swords and provisions, and exposes them to artifact-targeting actions and tier advancement — schema-invisible until it surfaces as fiction-breaking UI.
2. **Template → instance, EH's two tiers.** A **companion template** is data (a profession card: "Expedition Guide" — bonus, tags, one-line *good for*, rarity tier, loss condition). At grant time an **instance node** is minted with a **generated name** (existing agent-name generator, seeded PRNG), so every companion the player meets is a named person — EH's generic-ally tier with Threadbare's naming dignity. Authored **unique companions** (EH's Character tier) are templates with a fixed name and `unique: true` — grantable only by name from an encounter, never pool-drawn twice (an instance already in the world blocks a second).
3. **Bonuses are small and always on** (the EH principle, quoted in Why-load-bearing): `domainContributions` in one or two reaches, sized in the item range the sigmoid rewards (raw +1–3; the fixtures' 4–16 band is agent-scale, companions stay below it). No situational triggers in v1 — a companion that only helps sometimes is an item with a face. Later versions may add tags that widen encounter eligibility; out of scope now, noted for the systemic wiring guide when it lands.
4. **Gain paths: both the pool and direct grants.** `companion` joins `RewardPoolRecipe.categoryWeights` (a roadside rescue weights it; a tomb raid does not), and an aftermath effect grants a **named template** directly (`grant_companion`) for authored beats — the THR-1082 causality rule applies: the sentence says *why this person joins*. Renders as **BOND** with the instance's tile.
5. **Loss is a story event, and the loss vocabulary already exists.** `LossCondition` applies: `permanent` (loyal until story removes them), `stealable` (can be *lured away* — the EH sacrifice/loss currency), and hired companions carry `ticksRemaining` on the `accompanies` edge (the condition-expiry pattern) — contract ends, they walk, one BOND-loss chip says so. A companion never silently vanishes: every departure emits an aftermath change (SCAR when taken, plain BOND-loss when a contract ends).
6. **Companion cap:** `COMPANION_MAX` (default 3, tunable). The reward pool stops offering companions to a bearer at the cap (filter, same shape as tag filters); a *direct authored* grant may exceed the cap — authored intent wins — but the UI shows the crowd honestly. No auto-eviction: taking someone's companion is a story event (decision 5), never bookkeeping.
7. **The mercenary migration:** `action.gold.hire-mercenaries` mints a companion instance ("Mercenary Band" template: `domainContributions: { iron: … }`, `ticksRemaining: 10`, lossCondition contract) instead of the off-schema node. Its dead `ironCapability` property retires — the bonus becomes real for the first time.
8. **Not gated, always visible.** Person-knowledge gating (Law 8) does not apply: a mortal's companions belong to the bearer, and the bearer's god sees their own threads' people. Fail-open by design, stated so the executor doesn't wire a gate.

## Engine pillar

### Systems design

- `AttachmentCategory` gains `'companion'`.
- New module `src/engine/companions.ts`: `mintCompanion(graph, templateId, bearerId, prng)` (instance node + `accompanies` edge + generated name), `removeCompanion(graph, instanceId, reason)` (emits the departure aftermath change), `getCompanions(graph, bearerId)` (named to avoid the `retinue.ts` collision — see § UL note).
- `domainCapability.ts`: `accompanies` joins the two walk sites (raw score + contributors) reading `domainContributions` off the companion node — so companions appear in derived factor lines through the same `computeResolutionModifiers` walk that feeds the roll (the THR-892 variance rule holds by construction).
- `rewardPool.ts`: `companion` case — candidates are companion **templates** (data registry, filtered by tags/tier, minus uniques already instanced, minus everything when the bearer is at the cap); instantiation calls `mintCompanion`.
- Aftermath effect `grant_companion` (named template) joins `EncounterAftermathReactionEffect` — same seam THR-1082 extends with `quintessence_shift`; coordinate (mutex already declared both ways).
- Expiry: hired companions' `accompanies.ticksRemaining` decremented in the same phase that expires condition edges; on zero → `removeCompanion(…, 'contract_ended')`.

### Graph nodes / edges

- **Node `companion`** (new `NodeType` member): properties `templateId`, `profession`, `goodFor` (one-line), `domainContributions`, `tier: RarityTier`, `lossCondition`, `unique?`, `portrait?`. Name is the node's `name`.
- **Edge `accompanies`** (new `EdgeType` member, bearer `actor` → `companion`): properties `sinceTick`, `ticksRemaining?` (hired), `source` (encounter/action id — inspectability).
- One companion has exactly one bearer (single incoming `accompanies`); enforced at mint, asserted in tests.

### Tick phases

Only the expiry decrement, riding the existing condition-expiry phase — no new phase, no per-tick work for permanent companions.

### Resolution logic

Pool weighting reuses the resolved-recipe machinery unchanged; the only new logic is the cap filter and the unique-already-instanced filter.

### PRNG callouts

Name minting and pool draws use the caller's seeded PRNG (the pool already threads one); `mintCompanion` takes it as a parameter — no `Math.random()`.

## Content pillar

### Encounter templates

None modified here; THR-1097's content sweep (blocked by THR-1082) is the consumer that starts granting companions. One exception: `action.gold.hire-mercenaries` migrates per decision 7.

### Attachment content

Starter library `src/data/companion-templates.ts` — **8 profession templates** spanning the setting classes (road, settlement, wilds, court): e.g. Wayfarer (+Stone or +Iron, knows fords and passes), Guild Scribe (+Gold), Lantern-Bearer (+Eye), Sellsword Band (+Iron, hired/timed), Hedge-Healer (+Life), Shadow-Broker (+Shadow, stealable), Temple Cantor (+Star), Drover (+Gold/+Stone) — final roster, contributions, tiers, and `goodFor` lines are the executor's authoring pass under the prose register rules (plain, picturable). **1 unique** as the reference implementation of decision 2's unique tier, granted by no shipped encounter yet.

### Prose tables

Each template carries its `goodFor` line and a join/depart sentence pair used by the aftermath chips (cause → change, THR-1082 rule). No new enrichment placeholders.

### Data tables

Tooltip entry `ui.consequence.companion`? No — companions render under BOND (THR-1082 owns category tooltips). One new tooltip: `ui.companions` ("Those who travel with them — companions grant their bonuses while they stay.").

## UI pillar

*Screenshot tool: Playwright (agent sheet + veil are DOM surfaces).*

### Player-facing display

- **Companions row on the agent detail surface** (label "Companions" — see § UL note; never "retinue"), beside the existing attachment cards: one card per companion — initials tile on id-hashed gradient (Law 4; `portrait` art when a template ships one), name, profession, `goodFor` line, bonus shown as the reach glyph + delta cluster idiom once THR-1082 lands (until then, the banded word), `ticksRemaining` as a duration glyph (existing ⏳ vocabulary), tooltip via `ui.companions`.
- **BOND chip** (gain and loss) through THR-1082's anatomy; `EncounterAftermathConceptRef.visualKind` gains `'companion'` — a one-union-member touch on THR-1082's surface (mutex declared).
- `resolveEntityVisual` extends with the `companion` kind (Law 3 — extend the resolver, never a parallel path); clicking a companion opens a compact detail card (Law 20 tier 2), not the artifact sheet.
- Laws engaged: 1, 3, 4, 11, 14, 17, 20, 21, 27, 31.

### Event notifications

None new — gains/losses arrive as aftermath chips on the encounter surface.

### Debug inspection (DebugPanel)

CLI `agent <name>` prints the companions block (name, profession, contributions, ticks remaining). `window.__DEBUG` agent accessors carry the companions via the graph as-is.

### Visual presence (HexMapV2)

N/A — companions do not exist on the map; they are wherever their bearer is, by definition.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/companions.ts` | mint/remove at resolution; expiry in condition-expiry phase | Companions row + BOND chips | world graph (node + edge) | `companion_joined` / `companion_departed` | CLI `agent`, `__DEBUG` graph |
| `domainCapability.ts` walk | existing | factor lines (derived) | — | existing modifier traces | test-panel factor lines |
| `rewardPool.ts` companion case | existing reward step | reward pool UI (existing) | — | existing pool traces | pool trace + CLI |
| `companion-templates.ts` | — | — | — | — | content registry |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `COMPANION_MAX` | `3` | pool stops offering companions at this per-bearer size |
| `COMPANION_CONTRIBUTION_RANGE` | `1–3` raw | sizing rule for template `domainContributions` (authoring guardrail, asserted in the library test) |
| `MERCENARY_COMPANION_DURATION_TICKS` | `10` | migrated from the action's `durationTicks` |
| `COMPANION_GLYPH` | `♟` (existing) | category glyph, already in `attachmentGlyphs.ts` |

## Tracing

```ts
// companion_joined — emitted by mintCompanion
interface CompanionJoinedTrace {
  type: 'companion.joined';
  bearerId: string; companionId: string; templateId: string;
  source: string;            // encounter/action id
  contributions: Record<string, number>; // raw values — traces keep numbers
}
// companion_departed — emitted by removeCompanion
interface CompanionDepartedTrace {
  type: 'companion.departed';
  bearerId: string; companionId: string;
  reason: 'contract_ended' | 'lured_away' | 'story';
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `grant_companion` names an unknown template | warn once, grant nothing, encounter proceeds — never a blank node |
| Unique template already instanced | pool filters it; a direct grant re-targets the existing instance's bearer? No — it no-ops with a warn; uniqueness holds |
| Cap exceeded by a direct authored grant | grant proceeds (authored intent wins), UI renders the crowd |
| Name generator unavailable | template profession as the name ("a Wayfarer") — designed, not broken |
| Bearer node missing at expiry | remove the orphaned companion node + edge, log once |
| `domainContributions` missing on instance | contributes zero, renders with no bonus line — a person can be just a person |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/graph.ts` | 125 importers | two union members added (`companion`, `accompanies`) — purely additive; no existing member changes; exhaustive-switch sites that match on NodeType/EdgeType get compiler guidance, which is the point |
| `src/types/unifiedAction.ts` | 278 importers | one union member on `EncounterAftermathConceptRef.visualKind` + one effect member — additive, coordinated with THR-1082 (mutex) |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Interface impact

| Contract | Touch | Note |
|---|---|---|
| capability walk (`domainCapability` reads) | **extend** | `accompanies` joins `possesses`/`bonded_to`; read site unchanged |
| reward pipeline (recipe → pool → instantiate) | **extend** | `companion` category case; production read site is the existing reward step |
| aftermath effect vocabulary (`EncounterAftermathReactionEffect`) | **extend** | `grant_companion`; same seam as THR-1082's `quintessence_shift` — land after it (mutex) |
| condition-expiry phase | **extend** | also decrements `accompanies.ticksRemaining` |

## Vision audit

- [x] No Vision premise contradicted — companions deepen the mortal-story surface the god reads; the "not an agent" rule keeps the god/protagonist separation clean (the player nudges mortals, never puppet-people).
- [x] No Vision edit required — a mortal's companions are content within the existing attachment premise; the 2026-03-10 retainer paragraph is a plan doc, not Vision, and this doc records its supersession.

## Rulebook impact

- [x] This adds a resource surface (a mortal's companions) but changes no turn structure, verb, or resolution rule — companions are modifiers, exactly like items.
- [x] `Docs/canon/rulebook.md`: the executor adds one `[IMPL]` line to the attachment/resources section in the same PR (companions: person-shaped attachments, small always-on bonuses, cap `COMPANION_MAX`).

> Brainstorm companion: `Docs/plans/2026-08-12-thr-1096-companion-attachments-brainstorm.md` (written alongside).

## UL note — "companion" and the "retinue" collision

Intent-judge finding (2026-08-12): **"retinue" already names the ascendant's influenced agents** (`CourtPosition = 'retinue'`, `engine/retinue.ts`, the threads/retinue panel) — a second player-visible sense would be exactly the confusion the UL exists to prevent. Resolution in this plan: every player-facing surface says **"Companions"** (row label, tooltip `ui.companions`, chip copy); "retinue" appears nowhere the player reads until the UL arbitrates. A UL-proposal for **Companion** (and the arbitration of *retinue*'s two senses) is filed unconditionally at handoff — the THR-1098 precedent. Christian's verbatim "part of the retinue" is the colloquial sense; the UL decides whether the game ever uses the word for companions.

> **ARBITRATED 2026-08-13 (THR-1099) — this section's interim rule is now permanent.** *Retinue* keeps the divine-court sense exclusively; the companion sense of the word is **rejected**. **Companion** is seated canonical in the Agents shard. Nothing in this plan changes: "Companions" was already the right label, and the `getCompanions` rename already avoided the internal ambiguity — both are now backed by canon rather than by an interim convention, so the executor may treat them as settled and needs no further UL round-trip. The tie broke on incumbency (the word is already a player-visible heading, a `CourtPosition` schema value, and a rulebook row) rather than on schema risk, since neither assignment touched schema. See `Docs/ubiquitous-language/Agents.md` § Retinue and § Companion.

## Kill criteria

- **Companions read as stat-sticks, not people:** if playtest reads the Companions row and cannot say who anyone is (names/goodFor lines fail to register), the content shape is wrong — pause library growth, redesign the card before authoring more.
- **The cap fights the fiction:** if authored encounters routinely exceed `COMPANION_MAX` via direct grants, the cap number is wrong or the pool filter is the wrong lever — retune the constant, never silently evict.
Both are content/display reversals; nodes and edges stay valid.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | cap, contribution range, duration all named constants; library values data |
| 2. Inspectability | PASS | two new traces with raw numbers; `source` on every edge; CLI surface |
| 3. Determinism | PASS | seeded PRNG threaded into mint + pool; no Math.random |
| 4. Fail-soft | PASS | table above; unknown template can never crash resolution |
| 5. Narrative over mechanical perfection | PASS | every gain/loss is a story chip; no silent departures |
| 6. Additive over destructive | PASS | all unions extended; the one retirement (dead `ironCapability`) removes a property nothing reads |
| 7. Performance budget | PASS | walk adds one edge type over ≤`COMPANION_MAX` edges per agent; expiry rides an existing phase |

## Done when

- [ ] `companion` NodeType + `accompanies` EdgeType live; `mintCompanion`/`removeCompanion`/`getCompanions` shipped with tests (single-bearer invariant, cap filter, unique filter, expiry departure)
- [ ] 8-template starter library + 1 unique, contributions within `COMPANION_CONTRIBUTION_RANGE`, asserted by a library test
- [ ] Reward pool offers companions when weighted and the bearer is under the cap; `grant_companion` grants by name; both emit BOND chips with cause→change sentences
- [ ] `hire-mercenaries` migrated; the off-schema `attachment` node mint and dead `ironCapability` are gone
- [ ] Companion contributions appear in derived factor lines (screenshot evidence) and in `agent <name>` CLI output
- [ ] Companions row renders on the agent surface at 1920×1080 (Playwright), Laws judgment citing 1, 3, 4, 14, 17, 21, 27
- [ ] 30-tick CLI engine smoke (engine files touched); `npm test` + `npx vite build` pass; `tsc -b` net-new diff
- [ ] Closing commit body includes `Fixes THR-1096`

## Coordination block

**Suggested model:** opus — new node/edge types across a 125-importer union plus a content library (advisory; the automation runs Opus regardless).

**Parallel-safe with:** anything not touching `graph.ts` types, `domainCapability.ts`, `rewardPool.ts`, `unifiedAction.ts`, or the agent detail surface.

**Mutex with:** THR-1082 (both extend `EncounterAftermathReactionEffect` and the concept-ref union in `unifiedAction.ts`; **land THR-1082 first** — its chip anatomy is what BOND renders through). THR-1097 (grants companions in content — blocked by both).

**Files to touch:**
- Edit: `src/types/graph.ts` (two union members), `src/types/attachments.ts` (`companion` category), `src/types/unifiedAction.ts` (visualKind member, `grant_companion` effect)
- Create: `src/engine/companions.ts`, `src/data/companion-templates.ts` (+ tests for both)
- Edit: `src/engine/domainCapability.ts` (walk), `src/engine/rewardPool.ts` (category case), condition-expiry phase (edge decrement), `src/data/action-template-content.ts` (mercenary migration)
- Edit: entity-visual resolver (`companion` kind), agent detail surface (Companions row), `attachmentGlyphs.ts` (key `companion` to ♟), CLI `agent` command
- Edit: `Docs/canon/rulebook.md` ([IMPL] line), systemic wiring guide (grant_companion capability), tooltip registry (`ui.companions`)

## Notes for the executor

- **Land after THR-1082 merges** — BOND chips and the delta-cluster idiom are its surface; building the Companions row against the old chip anatomy would be immediate rework.
- The 2026-03-10 design doc's Retainer row describes actor-node retainers — **superseded by this plan**; do not implement adjacency bonuses or location presence.
- The mercenary migration is behavior-*correcting*, not behavior-neutral: the Iron bonus starts existing. Note it in the commit body; it is the point, not a side effect.
- Companion names come from the same generator worldgen uses — thread the PRNG; a hardcoded name pool is a determinism regression.
- Do not add a `companion` arm to artifact-targeting actions (steal/appraise/etc.) in this ticket; "lured away" arrives with content that authors it via `removeCompanion(…, 'lured_away')`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-12*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | Constants table names `COMPANION_MAX` (3), `COMPANION_CONTRIBUTION_RANGE` (1–3 raw), `MERCENARY_COMPANION_DURATION_TICKS` (10); template contribution values are data in `companion-templates.ts`, not hardcoded logic. |
| 2. Inspectability | PASS | `CompanionJoinedTrace`/`CompanionDepartedTrace` carry raw `contributions`, `source`, bearer/companion ids; CLI `agent <name>` prints the retinue block; capability walk feeds visible derived factor lines. |
| 3. Determinism | PASS | `mintCompanion(graph, templateId, bearerId, prng)` takes the caller's seeded PRNG explicitly for naming and pool draws; no `Math.random()`. Fallback (name generator unavailable → profession name) is itself deterministic. |
| 4. Fail-soft | PASS | Fail-soft table covers unknown template, already-instanced unique, cap-exceeded direct grant, missing name generator, orphaned bearer at expiry, missing `domainContributions` — all warn/no-op, never a crash. |
| 5. Narrative over mechanical perfection | PASS | No silent departures — every gain/loss emits an aftermath chip with a cause→change sentence; loss framed as story event, not bookkeeping. |
| 6. Additive over destructive | PASS-with-note | Unions extended additively. The one removal — dead `ironCapability`/off-schema mint from `hire-mercenaries` — retires a property nothing reads; the plan flags it as behavior-correcting (a legitimate defect fix), hence the note. |
| 7. Performance budget | PASS | Capability walk adds one edge type over ≤3 edges/agent; expiry rides the existing condition-expiry phase; no new tick phase. |

`NFP AUDIT: PASS-with-notes (see rows above)`

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | Systems design, new node/edge types, tick-phase hook (rides existing expiry phase), resolution logic, PRNG callout all specified concretely. |
| Content | present-and-substantive | 8-template starter library + 1 unique with tier/contribution rules, join/depart sentence pairs, `ui.retinue` tooltip, mercenary migration named as content work. |
| UI | present-and-substantive | Retinue row, BOND chip integration, entity-visual extension, debug/CLI surface, HexMap N/A with rationale. |

No missing required sections (Blast Radius correctly triggered by `graph.ts` 125 / `unifiedAction.ts` 278 importers). Wiring table maps each module to phase, component, GameState, trace, and debug surface per the checklist. Substrate check: `## Substrate inventory` present and substantive — correctly supersedes the DORMANT 2026-03-10 actor-node Retainers design and extends six ACTIVE substrates. The auditor's one gap — "Companies & Group Travel" (THR-74, DORMANT, alias includes "companion") not being ruled out by name — was fixed in this revision: the inventory now carries an explicit distinct-untouched row (company = group of real agents; companion = non-agent card).

`PILLAR AUDIT: PASS-with-notes`

### Vision audit

Premises: god/protagonist separation — **confirmed, mechanically enforced**: the plan's central design act is rejecting the actor-node model specifically because it would make companions agents; companions have no decision logic, movement, or encounter participation, and contributions flow as passive data like items. "Narrative over mechanical perfection" — extended (no silent departures). North star / core loop / design tensions / taste profile — silent, alignment inferred rather than sourced; no contradictions found.

`VISION AUDIT: PASS-with-notes — sound on the load-bearing non-negotiable (god/protagonist separation actively defended by design, not asserted).`
