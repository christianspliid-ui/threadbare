> **title:** `Consequence palette expansion + the Consequence Draw — THR-1142/1143/1144/1145/1146`
> **linear_issue:** THR-1142, THR-1143, THR-1144, THR-1145, THR-1146
> **author:** `Claude Code (Fable, attended design session)`
> **created:** 2026-08-16
> **three_pillars:** Engine `done` · Content `done` · UI `done (THR-1143 only; N/A elsewhere — see per-primitive sections)`

# Consequence palette expansion + the Consequence Draw

*Encounter endings get four new ways to change the world, and the factory gets a seeded, reach-flavored randomizer that forces every new encounter to use the palette's breadth instead of its five favorites.*

## Why this is load-bearing

The THR-1141 palette census measured what 295 encounters' endings actually write: five kinds carry almost everything (reputation tallies ×547 — now player-invisible per THR-1136 §5, reward pools ×474, seeds ×231, raw graph writes ×230, print-only events ×206), while the social/political tier sits unused — `bond_change` ×15, threads ×0, compulsions ×0, favors ×3, ambitions ×0, faction verbs ×0. Three consequences the fiction keeps reaching for have **no primitive at all**: sending a person somewhere, changing a place's state, moving one agent's faction membership. And the one randomized-prize mechanism is locked to step metadata, unreachable from a specific ending. Director approval 2026-08-16 (chat): expand with `agent_relocation`, location conditions, `membership_change`, add a tag-filtered `reward_draw` effect, and build a per-reach consequence randomizer for the factory — *"variety without destroying context … most primitives could potentially show up in most types of encounters although chances may vary."*

**Shared context for all five tickets:** UI Law 56 (`Docs/design-system/laws.md` §XIV) binds every consequence chip to a real write; these primitives exist to make more kinds of write available, and the draw exists to make authors use them. Every new write ships with at least one **reader** — a write no system consumes is Law 56's hollowness one level down. THR-809 is Done (2026-07-27): condition definitions seed at world init, so the condition-family plumbing below is live; the stale caveat in the systemic wiring guide is corrected in this PR.

---

## Engine pillar

Four dispatcher cases in `applyEncounterAftermathReaction` (A: `agent_relocation`, C: `membership_change`, D: `reward_draw`, and B's widened target resolution), one decision-phase read (relocation intent), one widened decay loop (location condition expiry), one movement-cost read (condition tax), one revived prerequisite gate (`faction_rank:`), and one authoring-time module (the Consequence Draw — no tick-loop code). Full systems design per primitive in the sections below; every write lands with its reader in the same PR.

## Content pillar

The starter location-condition set (`trait.condition.location.*`), one live exemplar per primitive (three of them doubling as THR-1141 sweep fixes), wiring-guide rows for all four kinds, the § Consequence Draw section in the shared nudge-authoring spec, and the 8×15 weight matrix — which *is* the content of THR-1145. Details per primitive below.

## UI pillar

UI: THR-1143 only — the location detail surface lists active conditions (Section/ListRow + registry tooltips; Playwright evidence). Everything else N/A with per-section rationale: relocation renders through existing map trails and agent panels, membership through existing faction surfaces, reward_draw through the existing PRIZE chip, and the draw is authoring-time. No new primitives, no new components.

---

## Primitive A — `agent_relocation` (THR-1142)

### A: Engine design

**Effect shape** (new member of the aftermath effect union in `src/types/unifiedAction.ts`):

```ts
{
  kind: 'agent_relocation';
  targetAgentId?: string;            // literal | '$target' | '$cast:<key>' (sentinel pass applies)
  destination:
    | { kind: 'location'; locationId: string }        // literal | '$target' | '$cast:<key>' when the cast binds a location
    | { kind: 'hex'; col: number; row: number }
    | { kind: 'nearest_settlement' }                  // resolved from the agent's current hex at apply time
    | { kind: 'away'; minHexDistance: number };       // any location ≥ N hexes away, seeded pick
  mode?: 'travel' | 'instant';       // default 'travel'
  ttlTicks?: number;                 // default RELOCATION_INTENT_TTL_TICKS
  residence?: 'set_destination' | 'unchanged';  // default 'unchanged'; on arrival stamps the observed-residence property (THR-822 shape)
}
```

**Systems design.** `travel` mode writes a `relocationIntent` property onto the agent node: `{ destinationNodeId | destinationHex, expiresAtTick, source: 'aftermath', templateId }`. It does **not** move anyone — the existing agent-decision phase gains one early read: an agent with a live intent adds `RELOCATION_INTENT_SCORE_WEIGHT` to movement options that reduce hex distance to the destination, through the existing movement-target scoring (no second movement path). Arrival (hex distance 0 to destination's hex) clears the intent, emits the arrival trace, and applies the `residence` stamp if requested. Expiry clears the intent with its own trace — agents never get stuck walking. `instant` mode retargets the `located_at` edge through the same helper the CLI's `move agent` uses, bumps `touchWorld()`, and is reserved for scene logic (someone flees the scene *now*); the spec marks it rare-by-intent, not gated.

**Graph nodes/edges:** none new. Position stays the single `located_at` edge (load-bearing rule); the intent is a node property (internal data, not a relationship — property-bag rule respected).

**Tick phases:** decision-phase read only; no new phase.

**PRNG:** the `away` destination pick uses the engine's seeded PRNG keyed (seed, tick, agentId) — no `Math.random()`.

### A: Content

Wiring-guide row (Part 5 effect table) + one live exemplar: the THR-1141 sweep's `healer_departs` fix should use it ("Maret departs" = relocation intent away from the settlement), which gives the primitive its first shipped consumer in the same season it lands. Enrichment: no new placeholders.

### A: UI

UI: N/A — movement is already visible (map trails, agent panels); the ending's chip is authored per Law 56 and renders through existing chip kinds. Debug: agent inspection (`agent <name>` CLI, `__DEBUG` agent readout) prints the live intent — that read is part of this ticket.

---

## Primitive B — location conditions (THR-1143)

### B: Engine design

**Not a new effect kind** — additive `targetLocationId?: string` on `apply_condition`, `remove_condition`, and `condition_attachment`, extending target resolution to `location` nodes (hexes, settlements, waypoints are all `location` nodes, so "the pass" and "the town" both qualify). Sentinels apply (`'$target'` when the action targets a location).

**Expiry:** `decayConditions` currently walks agent-held `has_trait` edges; it extends to **any** node kind carrying `ticksRemaining` — one loop widening, no second decay path (the THR-761 lesson: exactly one tick-driven expiry path).

**Readers (ship with the write, Law 56 at world scope):**
1. **Template gating** — `requiredTargetTraits` already reads `has_trait` on target nodes; the ticket *verifies* it holds for location targets and pins it with a test (a location under `trait.condition.location.festival` becomes eligible for festival-gated templates).
2. **Movement tax** — the movement-cost function consults the location's active conditions against `LOCATION_CONDITION_MOVEMENT_TAX` (condition template id → multiplier). `pass_closed` maps to `LOCATION_IMPASSABLE_MULTIPLIER` — a punitive soft-block, never a hard block (fail-soft: a desperate agent can still cross; the tax is the season).

Encounter-type *bias* deliberately stays the omen system's job — an encounter wanting ambient bias emits an omen alongside; two bias channels would drift.

### B: Content

Starter set in the condition content family, ids under `trait.condition.location.*`: `pass_closed` (impassable, seasonal duration), `festival` (gating flavor, short), `plague_scare` (gating + tax), `under_watch` (gating for shadow content), `harvest_blight` (long, pairs with the existing blight graph op). Each carries duration defaults in `CONDITION_DURATIONS` and a one-line tooltip registration. Wiring-guide row added. The THR-1141 sweep's "The Season" chip becomes this primitive's first consumer (`pass_closed` on the pass location).

### B: UI

Player-facing: the location detail surface lists active conditions as a `Section` of `ListRow`s with tooltips from the registry (Laws 1/17; no new primitive components). Screenshot tool: Playwright (DOM surface). HexMapV2: no map layer in v1 — the panel is the surface; a map badge is a separate design if wanted later (kept out to avoid hexmap scope creep — recorded as a non-goal, not an open question).

---

## Primitive C — `membership_change` (THR-1144)

### C: Engine design

```ts
{
  kind: 'membership_change';
  targetAgentId?: string;            // sentinel-capable
  factionId: string;                 // literal | '$target' | '$cast:<key>'
  op: 'join' | 'leave' | 'rank_delta';
  rankDelta?: number;                // required for rank_delta; result clamped [0, FACTION_RANK_MAX]
  chronicle?: boolean;               // default false; true emits a recruitment/expulsion event
}
```

Writes the `member_of` edge through the same membership helpers the faction bulk verbs use (join creates, leave removes; join is idempotent, leave on a non-member no-ops with trace). `rank_delta` writes the clamped `rank` property on the `member_of` edge — **and revives its reader**: the `faction_rank:` prerequisite gate (found dead in THR-805) is reconnected so `faction_rank:<n>` prerequisites resolve against the edge's rank. The write and its gate land in the same PR; a rank nothing reads would be exactly the hollowness Law 56 kills.

**Graph:** existing `member_of` edge + one edge property; no new types.

### C: Content

Wiring-guide row; the 17 THR-805 regional templates that carried dead `faction_rank:` prerequisites become the gate's test corpus (the ticket picks 2–3 to verify live, per THR-805's own notes). Exemplar: a guild recruitment ending using `join`.

### C: UI

UI: N/A — membership and rank already render on existing faction/agent surfaces reading the same edges; no new component. (Executor confirms the faction sheet shows the new member after a CLI join — that is evidence of the existing surface reading the write, not new UI.)

---

## Primitive D — `reward_draw` (THR-1146)

### D: Engine design

```ts
{
  kind: 'reward_draw';
  pool: RewardPoolRecipe;            // categoryWeights + tagFilters? + sphereTint? — the existing type, unchanged
  targetAgentId?: string;            // sentinel-capable; default the actor
}
```

Dispatcher case in `applyEncounterAftermathReaction` that resolves the recipe through **the same** `assembleRewardPool` path the step-metadata route uses — tier curve and bad-outcome chance from the action's already-resolved outcome band, same seeded draw keyed (seed, tick, actor, template). One draw path; the test asserts path identity (both routes produce the identical draw for identical inputs), not a copied implementation. Director's example `#gold #weapon` = `{ categoryWeights: { possession: 1 }, tagFilters: ['weapon'], sphereTint: <as tagged in the library> }` — exact tag names are whatever the attachment library actually carries, resolved-not-trusted.

**Empty-pool rule (THR-844 rot class):** at authoring time, `check:encounter`'s existing grant-liveness stage extends to `reward_draw.tagFilters` — a filter matching zero live attachment templates is a red gate. At runtime an empty pool fail-softs with an `aftermath_reward_draw_empty` trace, never a throw.

### D: Content

Wiring-guide row + spec note in the nudge-authoring spec's Rewards block (route 1 gains "or a `reward_draw` on the band"); one live exemplar in content.

### D: UI

UI: N/A — the draw lands as an attachment and renders through the existing PRIZE chip path (`item` change kind), untouched.

---

## The Consequence Draw (THR-1145)

### Draw: Engine design (authoring-time module — no tick-loop code)

**Module:** `src/data/content-eval/consequenceDraw.ts`, plus a generic seeded weighted-table utility `drawFromTable(tableId, weights, seedKey, n)` designed to host later tables (see § Other tables below). Seed = stable string hash of the template id → the engine's seeded PRNG. Deterministic and **recomputable**: given a template id, anyone can re-derive the hand, which makes the recorded draw tamper-evident.

**Draw mechanics:** `CONSEQUENCE_HAND_BASE = 2` families drawn without replacement; `+1` when `rarityTier ≥ CONSEQUENCE_HAND_RARITY_BONUS_TIER (3)`. The `formative` family is eligible only at `rarityTier ≥ 3` (the axiological mark is author-gated, rare by design — the table respects the law rather than fighting it).

**The 15 consequence families and their concrete effects:**

| Family | Concrete effect kinds |
|---|---|
| `relationship` | `bond_change` (either polarity) |
| `companion` | `grant_companion` / `remove_companion` |
| `standing` | `reputation_score`, `faction_reputation_gain` |
| `possession` | `spawn_artifact`, `attachment_grant` (possession), `reward_draw` |
| `condition` | `condition_attachment`, `apply_condition`, `remove_condition`, blessing/curse `attachment_grant` |
| `knowledge` | `intelligence`, `spawn_clue` |
| `secret` | `hidden_mark`, `secret_discovery`, `favor_creation` |
| `story_seed` | `encounter_seed` |
| `thread` | `thread_strengthen` / `thread_weaken` / `thread_break` |
| `drive` | `assign_ambition`, `plant_compulsion` |
| `movement` | `agent_relocation` (THR-1142) |
| `place` | location conditions (THR-1143); `spawn_unique_location` at rarity ≥ 3 |
| `membership` | `membership_change` (THR-1144) |
| `omen` | `emit_omen` |
| `formative` | `axiological_mark_apply` (rarity ≥ 3 only) |

**The weight matrix** (`CONSEQUENCE_FAMILY_WEIGHTS`, named constant, the whole point of the ticket — every cell ≥ 1 so *any* family can surface in *any* reach; the signature cells carry the reach's identity). Columns: iron · gold · shadow · veil · heart · eye · stone · star.

| Family | iron | gold | shadow | veil | heart | eye | stone | star |
|---|---|---|---|---|---|---|---|---|
| relationship | 5 | 4 | 4 | 3 | **10** | 3 | 4 | 3 |
| companion | 5 | 3 | 2 | 2 | **9** | 2 | 3 | 3 |
| standing | **7** | **8** | 2 | 3 | 5 | 4 | 5 | 3 |
| possession | 5 | **10** | 5 | 4 | 2 | 4 | **9** | 2 |
| condition | **8** | 2 | 5 | **9** | 4 | 2 | 4 | 4 |
| knowledge | 2 | 4 | **7** | 4 | 2 | **10** | 4 | 5 |
| secret | 3 | **7** | **10** | 4 | 4 | **7** | 2 | 3 |
| story_seed | 5 | 5 | **7** | 5 | **7** | **7** | 4 | **10** |
| thread | 3 | 2 | 2 | **6** | 5 | 3 | 2 | **8** |
| drive | 4 | 4 | **6** | **6** | 4 | 5 | 4 | **8** |
| movement | 4 | 5 | 5 | 2 | 4 | 5 | 2 | **7** |
| place | 4 | 4 | 3 | **7** | 4 | 3 | **10** | 4 |
| membership | 5 | **7** | **6** | 3 | **6** | 3 | **6** | 2 |
| omen | 1 | 1 | 2 | **8** | 1 | 4 | 1 | **8** |
| formative | 4 | 2 | 3 | 4 | 5 | 2 | 3 | **6** |

Reading the columns as identities: **iron** wounds and earns standing; **gold** owns things, owes favors, holds rank; **shadow** knows secrets and starts stories it doesn't sign; **veil** blesses, curses, consecrates places, and reads omens; **heart** binds people — allies, companions, communities; **eye** knows, uncovers, and opens mysteries; **stone** makes things and changes places; **star** is fate — seeds, threads, compulsions, journeys, defining moments. Tuning any of this is editing one table (NFP #1).

**The swap rule** (*variety without destroying context*): the author may swap **exactly one** drawn family for any family with weight ≥ `CONSEQUENCE_SWAP_MIN_WEIGHT (2)` in that reach, recording `consequenceSwap: { from, to, reason }` on the template. The gate allows one recorded swap and zero unrecorded deviations. This is the pressure valve that keeps a drawn `companion` out of an encounter with no persistent cast, without letting authors quietly regress to the five favorites.

**Template field + gate:** additive optional `consequenceDraw?: readonly string[]` (+ `consequenceSwap?`) on `UnifiedActionTemplate`. `check:encounter`: when present, recompute the draw from the template id and fail on mismatch; verify each recorded family (post-swap) has ≥ 1 wired effect from its row in the family table; fail an unrecorded deviation. **New factory output must carry the field** — enforced through the existing `RETROFIT_PENDING` ratchet mechanism (the legacy corpus is grandfathered on the ratchet; the ratchet only shrinks). Falsify both ways before trusting: a template with a doctored draw goes red; a template with a drawn-but-unwired family goes red.

**Authoring surface:** `npm run draw:consequences -- <templateId> --reach <reach> [--rarity n]` prints the hand + concrete kind options; the encounter-pipeline brief stage runs the draw and the brief carries the hand; the nudge-authoring spec gains a § Consequence Draw section (spec is shared with `template-encounter-rewrite`, so both authoring routes inherit it).

### Draw: Content

The weights table above **is** the content; plus the spec/SKILL updates. No encounter rewrites in this ticket.

### Draw: UI

UI: N/A — authoring-time tool; nothing player-facing renders from it directly.

### § Other tables — the same utility elsewhere (director ask, 2026-08-16)

The utility is deliberately generic because the factory has three more variety problems with the same shape; each is a **named follow-up, not scope of THR-1145**:

1. **Cast draw** — who stands in the scene: a reach-weighted table over cast archetypes (rival, kin, official, stranger, old debt, crowd). The census's social-tier starvation partly traces to scenes that only cast a counterparty-of-function.
2. **Complication draw** — which complication family a failure takes (Capability 8's templates are a ready-made table; today authors pick the same few).
3. **Premise draw** — brief-time skeleton: conflict type × stakes × counterparty, the classic random-table worldbuilding move, feeding the factory's brief stage.

Reward pools already prove the pattern in-engine (`categoryWeights` is a weighted table). When the first follow-up is designed, it reuses `drawFromTable` and its gate pattern verbatim.

---

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `agent_relocation` dispatcher case | aftermath apply (existing) | — | agent node `relocationIntent` property | `aftermath_agent_relocation`, `relocation_arrived`, `relocation_expired` | CLI `agent <name>`, `__DEBUG` agent readout |
| relocation intent read | agent-decision phase (existing) | map trails (existing) | — | movement traces (existing) | trace viewer |
| location condition targets | aftermath apply + `decayConditions` (existing) | location detail panel (Section/ListRow) | `has_trait` edges on location nodes | existing condition traces + `location_condition_applied` | CLI `eval`, trace viewer |
| movement tax reader | movement cost (existing) | — | — | movement traces carry tax factor | trace viewer |
| `membership_change` dispatcher case | aftermath apply (existing) | faction sheet (existing, reads edges) | `member_of` edge (+ `rank` property) | `membership_changed` | CLI `factions` |
| `faction_rank:` gate | prerequisite check (existing) | — | — | prerequisite traces (existing) | CLI `encounters` |
| `reward_draw` dispatcher case | aftermath apply (existing) | PRIZE chip (existing) | attachment edges (existing) | `aftermath_reward_draw` / `aftermath_reward_draw_empty` | trace viewer |
| `consequenceDraw` module + gate | none (authoring-time) | — | template fields `consequenceDraw`/`consequenceSwap` | — | `npm run draw:consequences`, `check:encounter` output |

## Interface impact

No existing contract in `Docs/canon/interface-map.md` is retired or rerouted. The four new effect kinds are new content→engine write surfaces of the *existing* aftermath-dispatch contract; per the Definition of Done, the executor adds their rows (and `scripts/interface-contracts.ts` entries where the map tracks the touched subsystem) in the landing PRs — new rows, no reclassifications expected.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `RELOCATION_INTENT_TTL_TICKS` | 36 | Travel intent lifetime (3 game days) before it expires unfulfilled |
| `RELOCATION_INTENT_SCORE_WEIGHT` | 0.5 | Additive movement-scoring weight toward the destination |
| `LOCATION_CONDITION_MOVEMENT_TAX` | per-condition map | Movement multiplier per location condition template id |
| `LOCATION_IMPASSABLE_MULTIPLIER` | 8 | Soft-block multiplier for `pass_closed`-class conditions |
| `FACTION_RANK_MAX` | 5 | Rank clamp on the `member_of` edge |
| `CONSEQUENCE_HAND_BASE` | 2 | Families drawn per encounter |
| `CONSEQUENCE_HAND_RARITY_BONUS_TIER` | 3 | Rarity tier at which the hand grows by one |
| `CONSEQUENCE_SWAP_MIN_WEIGHT` | 2 | Minimum table weight a swap target must hold in that reach |
| `CONSEQUENCE_FAMILY_WEIGHTS` | matrix above | The per-reach flavor; tuning = editing this table |

## Tracing

```ts
// emitted when an aftermath effect sets a travel intent
interface AgentRelocationTrace {
  type: 'aftermath_agent_relocation';
  agentId: string; destination: string; mode: 'travel' | 'instant';
  expiresAtTick: number; templateId: string;
}
// emitted by the decision phase on arrival / expiry
interface RelocationResolvedTrace {
  type: 'relocation_arrived' | 'relocation_expired';
  agentId: string; destination: string; ticksTaken: number;
}
// emitted when a condition lands on a location node
interface LocationConditionTrace {
  type: 'location_condition_applied';
  locationId: string; conditionTemplateId: string; ticksRemaining: number;
}
// emitted on any membership write
interface MembershipChangedTrace {
  type: 'membership_changed';
  agentId: string; factionId: string; op: 'join' | 'leave' | 'rank_delta';
  rankBefore?: number; rankAfter?: number;
}
// emitted per reward_draw resolution
interface RewardDrawTrace {
  type: 'aftermath_reward_draw' | 'aftermath_reward_draw_empty';
  agentId: string; poolSize: number; drawnTemplateId?: string; tagFilters?: string[];
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Relocation destination unresolvable (missing location, unbound sentinel) | trace + no-op; encounter resolution untouched |
| Relocation target dead/missing | no-op with trace |
| Intent expires before arrival | intent cleared, `relocation_expired` trace, agent resumes normal decisions |
| Location condition on a non-location node id | falls through existing invalid-target path, trace |
| `decayConditions` meets a carrier with malformed `ticksRemaining` | skip edge, warn once |
| `membership_change` on missing faction/agent | no-op with trace |
| `join` when already member / `leave` when not | idempotent no-op, trace |
| `rank_delta` on non-member | no-op with trace |
| `reward_draw` pool resolves empty at runtime | `aftermath_reward_draw_empty` trace, no throw |
| `consequenceDraw` field absent (whole legacy corpus) | gate skips — additive, nothing retro-fails |
| Draw recompute mismatch / unwired family / unrecorded swap | **loud** `check:encounter` red (authoring-time, deliberately not fail-soft) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | Union + two optional template fields — additive only; no existing member changes shape |
| `src/types/traits.ts` | 250 importers | Read-only (ReachDomain keys the weight table); no edit expected |

## Three-pillar check

- [x] Engine pillar present (per primitive + module)
- [x] Content pillar present (starter conditions, exemplars, spec updates, weight matrix)
- [x] UI pillar present (THR-1143 location panel; N/A with rationale elsewhere)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — all five items deepen "systemic god-game where consequences live in the world"; the draw enforces the existing player-as-god content doctrine rather than changing it.
- [x] No Vision edit needed as part of this scope.

## Rulebook impact

- [x] This plan does not change a rule of play. New effect kinds extend the consequence vocabulary (content-facing), not turn structure, verbs, prerequisites (the `faction_rank:` gate already exists in the rulebook's prerequisite model — THR-1144 revives its reader, changing no rule), resources, clocks, or win/loss.
- [x] If execution finds the rulebook documents prerequisites in a way the `faction_rank:` revival contradicts, the rulebook edit rides that PR (`Docs/canon/rulebook.md`).

> Brainstorm companion: none — the exploration happened in the attended chat session (2026-08-16, palette census → proposal → director approval); this doc records decisions, and the census method lives in THR-1141's comments.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number named in the constants table; reach flavor is one editable matrix |
| 2. Inspectability | PASS | Five new trace interfaces; draw recomputable from template id |
| 3. Determinism | PASS | All draws seeded (engine PRNG; draw keyed to template id); no Math.random |
| 4. Fail-soft | PASS | Table above; the one loud failure is authoring-time by design |
| 5. Narrative over mechanical perfection | PASS | Travel-mode relocation keeps journeys watchable; swap rule protects fiction from the dice |
| 6. Additive over destructive | PASS | New kinds, optional fields, widened loops; nothing removed or reshaped |
| 7. Performance budget | PASS | One property read in the decision phase; a per-condition map lookup in movement cost; draw is authoring-time only |

## Done when

*Each ticket closes on its own `Fixes THR-XXXX` commit with evidence per the Definition of Done; the per-ticket summaries live in the ticket descriptions. Program-level:*

- [ ] All four primitives dispatch through `applyEncounterAftermathReaction` with sentinel support and the traces above
- [ ] Every write has its reader live in the same PR (decision-phase read; gating + movement tax; rank gate; prize chip)
- [ ] `check:encounter` enforces the draw (recompute + wiring + swap rules), falsified both ways
- [ ] Wiring-guide rows for all four kinds; nudge-authoring spec carries § Consequence Draw
- [ ] `npm test`, `npx vite build`, typecheck ratchet per gate; engine smoke for THR-1142/1143/1144
- [ ] Browser evidence only for THR-1143's location panel; others `Browser-verify exempt` / CLI evidence per pillar rules

## Coordination block

**Suggested model:** opus — engine dispatch + reader wiring with per-primitive judgment calls.

**Parallel-safe with:** work not touching `src/types/unifiedAction.ts`, the aftermath dispatcher, `compositionContract.ts`/`check-encounter.ts`, or the condition/movement/decision engine files.

**Mutex with:** THR-1142 ↔ THR-1143 ↔ THR-1144 ↔ THR-1145 ↔ THR-1146 (all edit the `unifiedAction.ts` effect union and/or the aftermath dispatcher — execute serially, any order, except THR-1145 last-or-parallel-late so its family table can name all four shipped kinds; if THR-1145 lands first, the `movement`/`place`/`membership` rows map to their ticket ids and the gate treats an unshipped kind as unwirable → those families are excluded from draws by a `CONSEQUENCE_FAMILIES_LIVE` gate constant flipped per landing). Also mutex with THR-1141 (sweep edits `compositionContract.ts` + `unifiedAction.ts` doc comments and the same content files the exemplars touch).

**Files to touch:** (union across the five tickets)
- Create: `src/data/content-eval/consequenceDraw.ts`, `scripts/draw-consequences.ts`, location condition content entries, tests per primitive
- Edit: `src/types/unifiedAction.ts` (union + fields), the aftermath dispatcher module, `src/engine/phaseAgentDecision.ts` (intent read), `src/engine/conditionDecay.ts` (carrier widening), movement-cost module, membership helpers + prerequisite checker, `scripts/check-encounter.ts` / `compositionContract.ts`, `Docs/plans/2026-04-16-systemic-wiring-guide.md` (rows), `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md` (§ Consequence Draw)

## Notes for the executor

- **Readers are not optional.** Each primitive's reader (decision read, gating+tax, rank gate, chip path) is in the same PR as its write — a write-only landing is a partial ship and stays In Dev.
- **Do not invent a second movement path** for relocation — the intent biases the existing movement scoring, nothing else moves agents.
- **Do not hard-block movement** with `pass_closed` — the multiplier is the design; a hard block can strand the simulation (NFP #4).
- **The weight matrix ships as written** — tuning it later is a one-table edit and explicitly does not need a new ruling (gate/calibration is agent territory per canon process rule 4); *adding or removing a family* does need a note to the director.
- **Verify every content id live** (condition template ids, attachment tags) — resolve, never trust (THR-844).
- The wiring guide's THR-809 caveat is corrected in this docs PR; do not re-add it.

## Forked-audit verdicts

<!-- populated by design-audit-pipeline — /design-audit <plan-doc-path> -->

### NFP audit

<!-- pending -->

### Three-pillar audit

<!-- pending -->

### Vision audit

<!-- pending -->
