# THR-432 — Anoint Successor (Succession-Binding Divine Action)

**Date:** 2026-05-14
**Linear:** [THR-432](https://linear.app/threadbare/issue/THR-432) — *Anoint Successor — succession-binding divine action (deferred from THR-400)*
**Project:** Social Systems Expansion (Now / High)
**Parent:** [THR-390](https://linear.app/threadbare/issue/THR-390) — Action System Curation & Unlock Roadmap
**Deferred from:** [THR-400](https://linear.app/threadbare/issue/THR-400) §14 deferral #3 (`Docs/plans/2026-05-11-thr-400-faction-action-expansion-reframe.md`)
**Brainstorm companion:** `Docs/plans/2026-05-14-THR-432-anoint-successor-brainstorm.md`
**Sibling deferrals:** THR-430 (Schism, In Dev), THR-431 (Reveal Corruption, needs Vision pass), THR-433 (Kindle a Calling)

## 0. Reading the issue forward

Anoint Successor is the **elevate** verb at tier 3 — it pre-emptively crowns a chosen successor so that when the current leader exits, this mortal inherits. It is the companion to `action.anoint-champion`, but on a different time axis: anoint-champion mantles a mortal *now*; anoint-successor weaves a thread that *catches later*.

The deferral exists because the verb needs a **succession subsystem that does not exist yet**. This plan designs that subsystem and the verb together. Three things must be built:

1. A way to record "this mortal is queued to inherit leadership of this faction" — a graph edge (`will_succeed`).
2. A way to make leadership *assertable* rather than purely derived — today the faction leader is recomputed every call from reputation/leadership score, so an anointed successor has nothing to grab onto. This plan adds a `leads` edge that is authoritative when present and falls back to the existing derivation when absent.
3. A detection-and-resolution path that notices a leader has exited and promotes the anointed successor — `phaseFactionSuccession`.

Then the mortal-loop bridge: an `faction.encounter.inheritance` scene where the successor chooses whether to carry the mantle or let it fall.

### 0.1 What the codebase actually does today (verified before authoring)

| Claim | Where | Verified |
|------|-------|----------|
| Factions are graph nodes (`actorType: 'faction'`) | `src/engine/factionNetwork.ts:128–131` | ✅ |
| Members link via `member_of` edges with `reputation`, `role`, `rank` | `src/engine/factionNetwork.ts:159–161, 261–290` | ✅ |
| Leadership is **derived, not stored** — recomputed each call | `factionNetwork.ts:163–164` (`leadershipScore`), `phaseFactionActions.ts:156–171` (`getFactionLeader`, by reputation) | ✅ |
| There are **two** independent leader-derivation functions and they can disagree | `factionNetwork.ts` uses `leadershipScore`; `phaseFactionActions.ts` uses raw `reputation` | ✅ (pre-existing tech debt — see §5.4) |
| Agent death removes the node **and all its edges**, emits `agent_death` | `src/engine/agentLifecycle.ts:137–160` | ✅ |
| There is **no** leader-exit event and **no** `will_succeed` / `leads` edge | grep `src/engine`, `src/types` — zero hits | ✅ |
| "Retirement" is not a real agent lifecycle concept | only `phaseAgentDecision.ts:533` "max-completions retirement" of *templates* | ✅ |
| `add_edge` is a supported GraphOp type | `src/types/graphOp.ts:68–73` | ✅ |
| Edge types are schema-validated in dev via `EDGE_SCHEMA` | `src/engine/graph.ts:79–105`, `src/types/edgeSchema.ts` | ✅ |
| Phases register into slots; `post-narrative` runs **after** `phaseAgentLifecycle` | `src/engine/phaseRegistry.ts:46–67`, `orchestrator.ts:2440–2461` | ✅ |
| Divine action templates resolve via `onSuccess` GraphOps (`anoint-champion`, `divine-edict`) | `src/data/unified-action-templates.ts:752–826` | ✅ |
| `encounter_seed` is the canonical follow-on mechanism, plantable from a tick phase | `Docs/plans/2026-04-16-systemic-wiring-guide.md` Cap. 2; `encounterSeeding.ts`, `encounterAftermath.ts:796` | ✅ |

### 0.2 The one design deviation from the issue sketch — and why

The issue's engine sketch says `will_succeed: $target → leader` ("when leader X exits, agent Y inherits"). **This plan points the edge at the faction instead: `will_succeed: agent → faction`.**

Reason: when a leader *dies*, `phaseAgentLifecycle` removes the leader node **and every edge attached to it** (`agentLifecycle.ts:155–157`). A `successor → leader` edge would be destroyed at exactly the moment it is needed. Pointing the edge at the faction makes it survive *any* exit cause — death, expulsion, schism. It is also the more honest relationship: you are anointing a successor *to the faction's leadership*, not to a specific person who may be gone before the thread ever catches. The issue body calls its engine block a "sketch"; this is the correctness fix the sketch invites.

## 1. Codesight pre-flight — Blast Radius

**Files touched:**

| File | Importer count | Change | Risk note |
|------|---------------:|--------|-----------|
| `src/types/graph.ts` | **370** | additive — two new `EdgeType` union members (`will_succeed`, `leads`) | additive union members only; no node-creation site changes, no edits to existing types — see Blast Radius note below |
| `src/types/edgeSchema.ts` | ≈40 | additive — two new `EDGE_SCHEMA` entries (compile-gated: the `Record<EdgeType, EdgeSchema>` type *forces* the new entries to exist) | additive; the type system enforces completeness |
| `src/engine/factionNetwork.ts` | ≈25 | additive — `leads`-edge prepend in `getFactionNetworkSummary`; new exported helper `getAnointedLeaderId` | leader resolution gains a fallback-first check; existing derivation is the untouched fallback |
| `src/engine/phaseFactionActions.ts` | ≈8 | additive — `leads`-edge prepend in `getFactionLeader` | same shape as above |
| `src/engine/phaseFactionSuccession.ts` | **new file** | new tick phase | net-new module |
| phase registry (`src/engine/phaseRegistry.ts` consumer / phase descriptor list) | — | additive — register `faction_succession` phase in the `post-narrative` slot | one new descriptor entry |
| `src/data/unified-action-templates.ts` | ≈30 | additive — one new template entry | no edits to existing entries |
| `src/data/faction-action-constants.ts` | ≈5 | additive — succession constants appended (this file is created by THR-400; if THR-400 has not landed, create it) | additive |
| `src/types/factionAction.ts` | ≈10 | additive — `FactionSuccessionTrace` interface | additive |
| `src/data/faction-action-encounters.ts` | ≈8 | additive — `faction.encounter.inheritance` content | additive |
| `src/types/faction.ts` | ≈40 | doc-only — record the optional `leaderSnapshotId` property in the faction-node properties comment (no interface field change) | no structural change |

### Blast Radius — `src/types/graph.ts` (370 importers)

The only change to `graph.ts` is **two additive members appended to the `EdgeType` string-literal union** (`will_succeed`, `leads`). Schema additions to a union do not ripple through node-creation sites — no `GraphNode` shape changes, no edge-property interface changes to existing types. The one place TypeScript will (correctly) flag is any **exhaustive `switch` over `EdgeType`** — those are rare and the compiler points straight at them; the executor adds a `default`/no-op arm. `EDGE_SCHEMA` in `edgeSchema.ts` is typed `Record<EdgeType, EdgeSchema>`, so the build *will not pass* until both new entries are added — this is a feature, not a hazard: the schema can never silently drift from the union. No high-impact file is structurally edited. No further escalation required.

## 2. Substrate — what exists, what this issue builds

**Rides existing substrate:**
- Faction nodes, `member_of` edges, member reputation/rank/role (`factionNetwork.ts`).
- `add_edge` / `remove_edge` GraphOps (`graphOp.ts`).
- Dev-mode edge-schema validation (`edgeSchema.ts`, `graph.ts`).
- Phase registry + slots; `post-narrative` slot runs after `phaseAgentLifecycle` (`orchestrator.ts:2440–2461`).
- `encounter_seed` planting from a tick phase (THR-400 reframe §7.2 `seedDissentSurfacesEncounter` is the reference pattern; `encounterSeeding.ts`).
- `UnifiedActionTemplate` divine-action shape (`anoint-champion`, `divine-edict`).
- Agent `conditions: string[]` array for the `accepted_inheritance` / `refused_inheritance` conditions.

**Built by this issue (the succession subsystem):**
- `will_succeed: agent → faction` edge type + schema entry.
- `leads: agent → faction` edge type + schema entry.
- `getAnointedLeaderId(graph, factionId)` helper + the prepend in the two leader-derivation functions.
- `phaseFactionSuccession` tick phase (detection + resolution).
- `leaderSnapshotId` faction-node property (change-detection cache).
- `action.faction.anoint_successor` template + its resolution hook.
- `faction.encounter.inheritance` encounter content.
- `FactionSuccessionTrace`.

**Not built here (out of scope):**
- A first-class "retirement" lifecycle event. Detection in §5.3 is cause-agnostic, so retirement is covered for free *if/when* it ships — but this issue does not add it.
- Faction-split (Schism — THR-430). When THR-430's partition removes a leader's `member_of` edge, `phaseFactionSuccession` will detect the exit on the orphaned half for free; the two issues compose but are not coupled. They are **mutex** (§16).

## 3. Non-Negotiables compliance (`Docs/plans/2026-04-16-game-design-direction.md`)

| Non-negotiable | Resolution in this plan |
|----------------|-------------------------|
| #1 Player is a god, not a protagonist | The player names *who* is woven, not *when* the seat falls or *whether* the successor keeps it. The thread "catches" on an exit the player does not schedule; the successor chooses accept/refuse in the encounter. The player sets a condition, the world resolves it. |
| #2 The thread is the substrate | The verb fires on a mortal target; the payoff lands as an `faction.encounter.inheritance` scene on a named mortal the player chose. If the successor was unthreaded, the encounter is still the player's window onto the consequence. |
| #3 All mechanics surface through prose | `will_succeed` / `leads` / `leaderSnapshotId` never appear as numbers in player UI. The player reads the chronicle band (§7.2), the faction panel's "successor woven" glyph (§8.2), and the inheritance encounter. |
| #4 The world simulates around the player | The verb does not fabricate a leader exit — it waits for one the simulation produces (death today; schism/retirement later). No exit, no payoff; the thread simply waits. |
| #5 Vision edits ride with the design | No Vision page edit required — the verb rides existing premises (divine influence as indirect, thread-mediated). See §15. |

## 4. The design at a glance

| Field | Value |
|-------|-------|
| Template id | `action.faction.anoint_successor` |
| Name / spell name | Anoint Successor / *Thread of Inheritance* |
| Reach / Sphere | iron / force (identical to `anoint-champion` — deliberate companion pairing) |
| CRUD verb | `create` — it brings a `will_succeed` edge into existence (see §7.1 note) |
| Cost / rarity | essence 12 · rarity tier 3 (Storied) |
| Target | `agent` — a non-leader, non-army member of a faction |
| Engine effect | adds `will_succeed: targetAgent → faction`, tagged with `anointedTick` |
| Trigger | any leader exit (cause-agnostic detection) — death today, schism/retirement later |
| Resolution | on exit, highest-recency living anointed member inherits; gets a `leads` edge |
| Mortal-loop bridge | `faction.encounter.inheritance` planted on the new leader — accept / refuse |

## 5. Engine pillar

### 5.1 Two new edge types

Added to `EdgeType` in `src/types/graph.ts` and to `EDGE_SCHEMA` in `src/types/edgeSchema.ts`:

```ts
// graph.ts — EdgeType union additions
| 'will_succeed'     // agent → faction: anointed to inherit faction leadership on next leader exit
| 'leads'            // agent → faction: the seated leader of this faction (authoritative when present)
```

```ts
// edgeSchema.ts — EDGE_SCHEMA entries
will_succeed: {
  type: 'will_succeed',
  sourceNodeType: 'actor',
  targetNodeType: 'actor',           // the faction node (actorType: 'faction')
  direction: 'directed',
  cardinality: 'many-to-one',        // many anointed successors → one faction
  requiredProperties: ['anointedTick'],
  description: 'Agent anointed to inherit faction leadership on the next leader exit. '
    + 'Source = the successor agent; target = the faction. Survives the current leader\'s '
    + 'death (which removes the leader node + its edges). Consumed on inheritance.',
},
leads: {
  type: 'leads',
  sourceNodeType: 'actor',
  targetNodeType: 'actor',           // the faction node
  direction: 'directed',
  cardinality: 'one-to-one',         // at most one seated leader per faction
  requiredProperties: ['seatedTick'],
  description: 'Agent is the seated leader of this faction. Authoritative when present; '
    + 'absent for factions whose leadership has never been explicitly conferred (those '
    + 'fall back to score-derived leadership). Set/cleared by phaseFactionSuccession.',
},
```

`will_succeed` edge properties: `anointedTick: number` (required — drives resolution order), `anointedBy: string` (the ascendant id, for traces/prose), `priority?: number` (optional manual override; unset by default — see §5.3 resolution order).

`leads` edge properties: `seatedTick: number` (required), `conferredVia: 'anointment' | 'natural'` (how the seat was taken — anointment fires the encounter, natural does not).

### 5.2 Leader resolution becomes assertable (the mutex-flagged change)

Today both `getFactionNetworkSummary().leader` (`factionNetwork.ts`) and `getFactionLeader` (`phaseFactionActions.ts`) derive the leader from scores. This plan makes a `leads` edge **authoritative when present**, with the existing derivation as the untouched fallback.

New exported helper in `factionNetwork.ts` (single source of truth — both call sites use it):

```ts
/**
 * Returns the explicitly-seated leader id for a faction, or null if leadership
 * is not conferred (caller should fall back to score derivation).
 * Fail-soft: a `leads` edge pointing at a dead/non-member/army agent is ignored.
 */
export function getAnointedLeaderId(graph: WorldGraph, factionId: string): string | null {
  const edge = graph.getIncomingEdges(factionId, 'leads')[0];
  if (!edge) return null;
  const leader = graph.getNode(edge.source);
  if (!leader || leader.type !== 'actor') return null;
  if (leader.properties.armyState != null || leader.properties.actorType === 'group') return null;
  const stillMember = graph.getOutgoingEdges(edge.source, 'member_of')
    .some(e => e.target === factionId);
  return stillMember ? edge.source : null;
}
```

Both derivation functions get a 2-line prepend: *if `getAnointedLeaderId` returns non-null, that is the leader; else derive as today.* Existing derivation logic is **not modified** — it becomes the fallback branch. This is additive: factions with no `leads` edge behave exactly as before.

### 5.3 `phaseFactionSuccession` — detection + resolution

New module `src/engine/phaseFactionSuccession.ts`, registered as an `EnginePhase` in the **`post-narrative` slot** (runs after `phaseAgentLifecycle`, so this-tick deaths are already applied).

Per tick, for each faction node:

**Step 1 — resolve current leader** via the §5.2 path (`leads` edge first, else score derivation).

**Step 2 — read `leaderSnapshotId`** (faction-node property; the change-detection cache).

**Step 3 — bootstrap:** if `leaderSnapshotId` is unset → set it to the current leader id (or `null` if leaderless). Done. No succession on first observation.

**Step 4 — snapshot agent is still a living member of this faction:**
- If they *are* the current leader → nothing changed. Done.
- If they are still a member but no longer the leader (**peaceful overtake** — someone outscored them while they are alive) → silently re-point `leaderSnapshotId` to the current leader. **No succession** — the snapshot leader did not *exit*, they were eclipsed. Anointed threads wait for a true exit.
- **Cleanup nicety:** if a `will_succeed` successor for this faction *is* now the current leader (they climbed to the seat unaided), remove their `will_succeed` edge — their inheritance happened peacefully. Emit a `FactionSuccessionTrace` with `outcome: 'successor_self_seated'`.

**Step 5 — snapshot agent is NO LONGER a living member of this faction** (died, expelled, schism'd away) → **leader exit detected.** Run succession resolution:

a. Collect incoming `will_succeed` edges on the faction. Filter to those whose source is a **living, non-army member of this faction**.
b. **Resolution order:** sort by `priority` desc when set, else by `anointedTick` desc (most recent anointment inherits first — a god's *current* will supersedes an older one). Tiebreak: lower node id via seeded `prng.pick` over the tied set (NFP #3).
c. **A successor resolves:**
   - Remove any existing `leads` edge for this faction (`removeEdge`).
   - Add `leads: successor → faction`, `{ seatedTick: tick, conferredVia: 'anointment' }`.
   - Set `leaderSnapshotId = successorId`.
   - Remove the resolved `will_succeed` edge (consumed). Lower-priority `will_succeed` edges **remain** — they stay queued for the next exit.
   - Plant `faction.encounter.inheritance` on the successor, `delayTicks: INHERITANCE_ENCOUNTER_DELAY`.
   - Emit `FactionSuccessionTrace` `outcome: 'anointed_inherited'`.
d. **No successor resolves** (no `will_succeed` edges, or all dead/expelled):
   - Do nothing structural — the existing score derivation already names the next-highest member; the world keeps running silently, exactly as today.
   - Set `leaderSnapshotId` to the current derived leader.
   - If a stale `leads` edge points at the now-gone leader, remove it (fail-soft cleanup).
   - Emit `FactionSuccessionTrace` `outcome: 'natural_succession'` (un-anointed exits are still logged, for inspectability).

The phase **only acts** (mutates the graph, plants an encounter) when a `will_succeed` edge resolves. For the ~99% of factions with no anointed successor it does one `getIncomingEdges('leads')` + one snapshot compare per tick — the same negligible cost posture as THR-400's dissent-decay block.

### 5.4 Note on the two-derivation-functions tech debt

`factionNetwork.ts` and `phaseFactionActions.ts` derive the leader by *different* formulas (leadership score vs. raw reputation). This plan does **not** fix that — but routing both through `getAnointedLeaderId` for the *authoritative* case means the anointed successor is consistent across both call sites even though the *fallback* still differs. Unifying the fallback is out of scope; flag as a follow-up if it bites (no Linear issue filed unless it surfaces — it is pre-existing, not introduced here).

### 5.5 The action's resolution hook

`action.faction.anoint_successor`'s `onSuccess` needs to create `will_succeed: targetAgent → faction`, but a static template GraphOp cannot (a) resolve *which* faction the target agent belongs to, nor (b) stamp the current tick. Two honest options for the executor, design contract is the same either way:

- **Preferred:** a typed post-resolution handler keyed to template id `action.faction.anoint_successor` — the same shape as THR-400's per-verb executors. It resolves the agent's faction from their `member_of` edge(s) and `addEdge`s the `will_succeed` edge with `anointedTick: state.tick`, `anointedBy: state.ascendantId`.
- **Acceptable:** if the unified-action GraphOp layer already supports (or cheaply gains) `$tick` and a `$targetFaction` symbolic, express it as a pure `add_edge` GraphOp in the template `onSuccess`.

**Faction resolution rule:** the target agent's faction = their `member_of` edge. Exactly one membership → use it. Multiple memberships → use the highest-`reputation` membership (rare; logged via trace as `multiFactionResolved: true`). Zero memberships → the verb is not surfaced (§8.1), so this branch is unreachable in normal play; if reached, fail the action with essence refunded and prose *"This mortal belongs to no faction — there is no seat for them to inherit."*

## 6. Constants table (NFP #1)

New constants in `src/data/faction-action-constants.ts` (created by THR-400; if THR-400 has not landed when this is picked up, create the file).

| Constant | Default | Used by | Purpose |
|----------|--------:|---------|---------|
| `ANOINT_SUCCESSOR_ESSENCE_COST` | 12 | template | essence cost of Anoint Successor |
| `INHERITANCE_ENCOUNTER_DELAY` | 3 | succession resolution | ticks between succession firing and the inheritance encounter becoming eligible |
| `REFUSED_INHERITANCE_CONDITION_DURATION` | 30 | inheritance encounter (refuse) | ticks the `refused_inheritance` condition persists |
| `ACCEPTED_INHERITANCE_REPUTATION_BUMP` | 0.15 | inheritance encounter (accept) | one-time `member_of` reputation gain for accepting the mantle (so the seated leader also reads as leader under score derivation) |
| `SUCCESSION_PRIORITY_TIEBREAK_SALT` | 0x5ucc | succession resolution | PRNG salt for equal-recency tiebreak |

Reach / sphere / rarity literals are enums, not constants (per existing template authoring convention — see THR-400 reframe §6).

## 7. Content pillar

### 7.1 Template prose

```ts
{
  id: 'action.faction.anoint_successor',
  name: 'Anoint Successor',
  spellName: 'Thread of Inheritance',
  rarityTier: 3,
  intrinsicTier: 'shaping',
  description: 'You weave an invisible thread of inheritance around a mortal. '
    + 'When the current crown falls — and every crown falls — the thread will catch. '
    + 'They do not know yet. The leader they will replace does not know either. '
    + 'You have not chosen when; you have only chosen who.',
  reach: 'iron',
  crudType: 'create',
  scale: 'personal',
  sphereAffinity: 'force',
  essenceCost: ANOINT_SUCCESSOR_ESSENCE_COST,
  apCost: 1,
  actorAffinities: ['ascendant'],
  motivations: ['loyalty_ambition', 'tradition_novelty'],
  targetCategories: ['agent'],
  steps: [{
    reach: 'iron',
    duration: { min: 1, max: 1 },
    difficulty: 0.0,
    onSuccess: [/* add_edge will_succeed — see §5.5 resolution hook */],
    onFailure: [],
    failBehavior: 'fail_action',
  }],
  narrativeTemplates: {
    initiation: 'weaves a silent thread of inheritance around a chosen mortal',
    success: 'the thread settles, unseen — it will hold until a crown falls',
    failure: 'the thread finds no anchor; this mortal carries no future the faction will honor',
  },
}
```

`crudType: 'create'` — Anoint Successor brings a `will_succeed` edge into existence; per the 5-verb system ("Create — bring something into existence") this is the correct verb, even though the companion `anoint-champion` is `update` (it modifies the agent in place). This is a deliberate, low-risk divergence; the executor may revisit if the unified-action pipeline gates `create` templates differently — flagged in §14.

### 7.2 IPK / chronicle band

One short post-state line on cast, with the successor's name as an IPK keyword (existing `ProseKeyword.tsx` underline pattern):

> *"{successorName} walks unmarked through the {factionName}, carrying a future they cannot feel. The thread is woven. It only waits."*

On succession firing (the thread catches), a second band:

> *"The crown of the {factionName} has fallen — and the thread holds. {successorName} stands where {predecessorName} stood."*

### 7.3 The inheritance encounter — `faction.encounter.inheritance`

Authored in `src/data/faction-action-encounters.ts`, family `faction_internal_pressure`, per the `encounter-pipeline` / `prose-content-systems` discipline. Planted on the new leader (the successor) when succession resolves.

A 2-beat scene. Beat 1: the mantle settles — the successor feels, for the first time, the weight the thread was always carrying for them. Beat 2: the choice.

**Two choices, each with an explicit moral-axis tilt on the card (per `2026-05-04-encounter-experience-design-plan.md` Rule 2):**

1. **Accept the mantle** *(loyalty / ambition)* — the `leads` edge stays. The successor leads the faction with its *current state* intact: its debts (`owes_favor`), its alliances and rivalries (`relates_to`), its active ambition (`pursues`). Aftermath: `accepted_inheritance` condition added; one-time `member_of` reputation bump of `ACCEPTED_INHERITANCE_REPUTATION_BUMP` (so the seat reads as theirs under score derivation too). The encounter **plants one follow-on `encounter_seed`** — a "first act as leader" beat scored against the faction's active ambition (systemic wiring guide Cap. 2).
2. **Refuse the mantle** *(courage / prudence — toward prudence; the burden declined)* — the `leads` edge is removed. Succession **re-resolves on the next `phaseFactionSuccession` pass**: the next-recency `will_succeed` successor inherits, or — if the refuser was the only anointed heir — leadership falls to plain score derivation (silent, as today). The refusing successor gains a `refused_inheritance` condition (`REFUSED_INHERITANCE_CONDITION_DURATION` ticks) — a Destiny-adjacent mark, "the thread they cut," available to future encounter content as a hidden mark.

**Enrichment placeholders (≥2 required — systemic wiring guide Cap. 1):** `{name}` (the successor), `{factionName}`, `{predecessorName}` (the leader who exited — captured into the encounter seed payload at succession time, since the node may be gone), `{?has_ally}` / `{?has_rival}` (whether the faction carries alliances or rivalries — colors what the successor is inheriting).

Threadbearer voice: short, charged, mythic — not a tooltip dump. The drawer card is a sentence; the *encounter* is where the verb's narrative weight lives.

### 7.4 What we are NOT writing

No player-facing numbers (`will_succeed` priority, `seatedTick`, `leaderSnapshotId` never surface as digits — Non-Negotiable #3). No prose for the sibling deferrals (THR-431 Reveal Corruption, THR-433 Kindle a Calling) — those ship with their own tickets.

## 8. UI pillar

### 8.1 Action drawer surfacing

`action.faction.anoint_successor` appears in the drawer when the focused target is an `agent` who is a **non-leader, non-army member of at least one faction.** Surfacing rules:

| Condition | Surfaced? |
|-----------|-----------|
| Target agent is a non-leader, non-army member of ≥1 faction | yes |
| Target agent is the current leader of their (only) faction | no — you cannot anoint the seat-holder as their own successor |
| Target agent is an army / group | no |
| Target agent belongs to no faction | no (absent, not greyed — legibility-correct per THR-400 reframe §9.1) |
| Target agent already has a `will_succeed` edge for this faction | **yes** — re-anointing is allowed; the more recent anointment inherits first (the player changing their mind) |

### 8.2 Faction detail panel

When a faction is selected (`FactionSheet.tsx` / `ThreadDetailView.tsx` — both already render `summary.leader`):
- If the faction has ≥1 `will_succeed` edge: a small woven-thread glyph next to the Leader stat, tooltip *"A successor has been woven — the thread waits for the crown to fall."* No count, no names — the player reads "a future is set," not a number.
- If the faction has a `leads` edge with `conferredVia: 'anointment'`: the Leader stat shows a subtle "by inheritance" sublabel. This is the visible echo of a succession the player caused.

### 8.3 Chronicle / event log

On cast: the §7.2 first band. On succession firing: the §7.2 second band, plus the inheritance encounter takes over the chronicle when it runs. Routed through the existing faction-trace → ChroniclePanel integration (same path `action.divine-edict` uses).

### 8.4 Debug inspection

`DebugPanel` faction inspector gains:
- `leads` edge: source agent id + `seatedTick` + `conferredVia` (or `— (derived)` when absent).
- `leaderSnapshotId` (raw — debug only).
- `will_succeed` edges table: successor id, `anointedTick`, `priority?`, living-member check result.
- `phaseFactionSuccession` emits `FactionSuccessionTrace` (§10) — visible in the trace stream.

### 8.5 Screenshot evidence at closeout (1920×1080, per Definition of Done)

1. Action drawer with an agent selected, **Anoint Successor** visible.
2. Faction detail panel showing the woven-thread glyph after an anointment.
3. The `faction.encounter.inheritance` encounter mid-flight (accept/refuse cards with axis tilts).
4. DebugPanel showing the `leads` edge + `will_succeed` table after a succession.

DOM surfaces → Playwright (`preview_resize(1920,1080)` → `preview_screenshot`). Any HexMap/WebGL surface → Claude-in-Chrome. Plus a console-output block and a `window.__DEBUG.*` assertion (e.g. `window.__DEBUG.eval("state.graph.getIncomingEdges('<factionId>','leads')")`).

## 9. Wiring section

| Wiring point | Connection |
|--------------|-----------|
| Orchestrator phase | new `faction_succession` `EnginePhase` registered in the `post-narrative` slot — runs after `phaseAgentLifecycle` so this-tick deaths are applied |
| Action drawer | `src/components/actions/*` reads `targetCategories: ['agent']` + the §8.1 surfacing predicate (non-leader faction member) |
| Encounter pipeline | `faction.encounter.inheritance` planted via the existing `encounter_seed` mechanism (THR-400 reframe §7.2 pattern); pickup uses the existing portfolio-mortal path |
| Chronicle | new `FactionSuccessionTrace` → ChroniclePanel via the existing faction-trace integration |
| DebugPanel | faction inspector + trace stream — §8.4 |
| Prose enrichment | inheritance encounter uses existing `enrichProse()` placeholders; **no new placeholders introduced** |
| Player controls | action drawer only; no new hotkeys; no new modals (the encounter modal is the existing one) |
| Leader resolution | `getAnointedLeaderId` is the new shared seam; `factionNetwork.ts` + `phaseFactionActions.ts` both consult it |

**Update `Docs/plans/wiring-checklist.md`** — add `faction_succession` to the orchestrator-phase list and `will_succeed` / `leads` to the edge-type list if it tracks them.

## 10. Traces (NFP #2)

One new trace, defined in `src/types/factionAction.ts` alongside `FactionActionTrace`:

```ts
export interface FactionSuccessionTrace {
  tick: number;
  category: 'faction_succession';
  factionId: string;
  factionName: string;
  outcome:
    | 'anointed_inherited'      // a will_succeed successor took the leads edge
    | 'natural_succession'      // leader exited, no successor resolved — fell back to derivation
    | 'successor_self_seated'   // an anointed successor reached the seat unaided; their edge was cleared
    | 'snapshot_bootstrapped'   // first observation of this faction
    | 'peaceful_overtake';      // leader changed by score, no exit — snapshot re-pointed
  exitedLeaderId: string | null;
  exitedLeaderName: string | null;
  newLeaderId: string | null;
  newLeaderName: string | null;
  willSucceedCandidatesConsidered: number;
  seededEncounterId?: string;       // set when outcome === 'anointed_inherited'
  conferredVia?: 'anointment' | 'natural';
}
```

Added to the trace union the DebugPanel and trace consumers switch on. `category: 'faction_succession'` is new — register it in the DebugPanel category grouping.

The Anoint Successor *cast* itself also emits via the existing unified-action trace path (same as `anoint-champion`); the resolution hook (§5.5) additionally records `multiFactionResolved` when the target agent had multiple memberships.

## 11. Fail-soft posture (NFP #4)

| Failure surface | Behavior | Why |
|-----------------|----------|-----|
| Target agent belongs to no faction at cast time | verb not surfaced (§8.1); if somehow reached, action fails with essence refund + prose | unreachable in normal play; defensive |
| `will_succeed` edge points at a dead/expelled agent | resolution filters it out (living-member check); auto-removed if the node was removed | a dead heir cannot inherit |
| All `will_succeed` successors are dead/gone at exit | `outcome: 'natural_succession'` — fall back to score derivation, world keeps running | exactly today's behavior; the thread simply did not catch |
| `leads` edge points at a non-member / dead / army agent | `getAnointedLeaderId` returns null → derivation fallback; `phaseFactionSuccession` removes the stale edge next pass | hidden, self-healing |
| Inheritance encounter template missing | standard `encounter_seed` "withered" path — trace emitted, no crash | THR-400 reframe §7.3 pattern |
| Faction has zero members at exit | no successor resolves; `outcome: 'natural_succession'`; `leaderSnapshotId = null` | a faction with no one in it has no seat |
| `phaseFactionSuccession` throws on one faction | per-faction `try/catch` (same pattern as `phaseFactionActions.processFaction`) — skip that faction, never crash the tick loop | NFP #4 |
| Faction node mutated (snapshot, `leads` edge) | call `touchStructure()` / `touchWorld()` per the CLAUDE.md world-version-counter decision | UI/selectors must see the change |

## 12. Determinism (NFP #3)

The only PRNG draw in the whole subsystem is the equal-recency tiebreak in succession resolution (§5.3b) — `prng.pick` over the tied `will_succeed` set, seeded with `state.seed + state.tick + hashString(factionId) + SUCCESSION_PRIORITY_TIEBREAK_SALT`, the same per-faction-per-tick seeding pattern `phaseFactionActions` already uses. Everything else is pure comparison. Same seed + same tick = same successor.

## 13. NFP compliance summary

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | PASS | 5 constants named in §6; reach/sphere/rarity are enums per convention |
| 2 | Inspectability | PASS | `FactionSuccessionTrace` (§10) with 5 outcomes; DebugPanel faction-inspector lines in §8.4 |
| 3 | Determinism | PASS | single seeded `prng.pick` for tiebreak; everything else pure comparison (§12) |
| 4 | Fail-soft | PASS | per-faction `try/catch`; fail-soft table §11; stale-edge self-healing |
| 5 | Narrative over mechanical | PASS | the payoff is the `faction.encounter.inheritance` scene, not the edge write; `will_succeed`/`leads`/`leaderSnapshotId` never surface as numbers |
| 6 | Additive over destructive | PASS | two additive `EdgeType` members; new helper + prepend (existing derivation untouched as fallback); new phase; new template; new trace — zero edits to existing template entries or derivation logic |
| 7 | Performance budget | PASS | one `getIncomingEdges('leads')` + one snapshot compare per faction per tick (~5–20 factions/run); heavier resolution only on actual exit — same posture as THR-400's dissent-decay block |

## 14. Done when

- [ ] `will_succeed` + `leads` added to `EdgeType` (`graph.ts`) and `EDGE_SCHEMA` (`edgeSchema.ts`)
- [ ] `getAnointedLeaderId` helper added to `factionNetwork.ts`; `leads`-edge prepend wired into `getFactionNetworkSummary().leader` **and** `phaseFactionActions.getFactionLeader`
- [ ] `phaseFactionSuccession.ts` created; registered as an `EnginePhase` in the `post-narrative` slot; detection + resolution per §5.3
- [ ] `leaderSnapshotId` faction-node property maintained by the phase; documented in `faction.ts` properties comment
- [ ] `action.faction.anoint_successor` template in `unified-action-templates.ts` + resolution hook per §5.5 (`will_succeed` edge created with `anointedTick`)
- [ ] Constants in `faction-action-constants.ts` per §6
- [ ] `FactionSuccessionTrace` in `factionAction.ts`; added to the trace union; registered in DebugPanel category grouping
- [ ] `faction.encounter.inheritance` authored in `faction-action-encounters.ts` per §7.3 — 2 beats, accept/refuse with axis tilts, ≥2 enrichment placeholders, ≥1 follow-on `encounter_seed` on the accept branch, Threadbearer voice
- [ ] IPK chronicle bands per §7.2
- [ ] Action drawer surfaces the verb per §8.1 (absent, not greyed, when preconditions unmet)
- [ ] Faction detail panel woven-thread glyph + "by inheritance" sublabel per §8.2
- [ ] DebugPanel faction-inspector lines per §8.4
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green (per-edge-type schema test; succession resolution unit tests across the §11 failure cases; an integration test: anoint → kill the leader → assert the successor holds the `leads` edge and the inheritance encounter is seeded)
- [ ] 30-tick CLI smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) — reaches tick 30, non-zero agents, traces present; paste the `status` block
- [ ] Four browser screenshots per §8.5 + console-output block + `window.__DEBUG.*` state assertion
- [ ] `Fixes THR-432` in the closing commit body
- [ ] `Docs/plans/wiring-checklist.md` updated; `Docs/plans/2026-04-16-systemic-wiring-guide.md` updated (new `will_succeed` / `leads` edges + the inheritance encounter pattern are content-facing capabilities — §9)

## 15. Open questions / notes for Christian

None are blocking — the design is internally complete and ships on verified substrate. Two are flagged for awareness, not decision:

1. **`will_succeed` points at the faction, not the leader.** This is the one deviation from the issue's engine sketch — necessitated by death removing all of a node's edges (§0.2). If you specifically wanted "succeed *this person*" semantics (e.g. anoint A as B's heir specifically, not as the faction's next heir generally), say so and the design needs a rethink — but faction-targeted is both more robust and the more honest relationship.
2. **Re-anointing = recency wins.** Anoint A, then later anoint B for the same faction → B inherits first (more recent `anointedTick`). The rationale is "a god's current will supersedes an older one." The alternative ("your first choice is your true heir") is a one-line flip of the sort order. Recency-wins is the default; flag if you'd rather it be first-wins.

**Vision audit:** no Vision page edit required — the verb rides existing premises (divine influence as indirect, thread-mediated; the player sets conditions the world resolves). Non-Negotiables compliance is in §3.

**Rulebook impact:** Anoint Successor is a new action verb, so `Docs/canon/rulebook.md` §(action verbs / faction interventions) gains one row — mark it `[DESIGN]` until shipped, `[IMPL]` on merge. This is in-scope for the implementing PR per the design-workflow checklist.

## 16. Coordination block

- **Suggested model:** `model:opus-4-7` — honoring the THR-432 issue author's explicit call ("engine work is the heavier lift — succession resolution path, new edge type, tick-cycle hook on leader-exit events"). Anoint Successor is a genuinely new subsystem (two edge types, an authoritative-leadership seam, a new phase); the engine build, while well-specified, is novel rather than pattern-following, and the `faction.encounter.inheritance` prose is a single encounter rather than THR-400's four. The stronger model fits the novel-subsystem lift.
- **Parallel-safe with:** any issue that does **not** touch `src/data/unified-action-templates.ts`, `src/engine/factionNetwork.ts`, `src/engine/phaseFactionActions.ts`, `src/types/graph.ts`, `src/types/edgeSchema.ts`, or `src/data/faction-action-encounters.ts`.
- **Mutex with:** **THR-430** (Schism — touches faction leader resolution + faction edges + `unified-action-templates.ts`), **THR-431** (Reveal Corruption — `unified-action-templates.ts`, faction types), **THR-433** (Kindle a Calling — `unified-action-templates.ts`, faction files), and **THR-400** itself if it has not yet merged (impediment #136 — CI billing failure blocked PR #276). **Order:** land after THR-430 and after THR-400's merge. Whoever implements should re-verify the `EdgeType` union and `EDGE_SCHEMA` against `main` at pickup time — additive merges are clean but the union grows with each sibling.
- **Codex review:** yes — structural review fits (new edge types + schema, three-pillar wiring, trace coverage, encounter prose discipline). The PR-gated review Action picks it up automatically.
- **Files to touch:** `src/types/graph.ts`, `src/types/edgeSchema.ts`, `src/engine/factionNetwork.ts`, `src/engine/phaseFactionActions.ts`, `src/engine/phaseFactionSuccession.ts` (new), the phase registry descriptor list, `src/data/unified-action-templates.ts`, `src/data/faction-action-constants.ts`, `src/types/factionAction.ts`, `src/data/faction-action-encounters.ts`, `src/types/faction.ts` (doc-only), `Docs/plans/wiring-checklist.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`, `Docs/canon/rulebook.md`.

---

*Designed by Cowork, 2026-05-14. Deferral #3 of 4 from THR-400 §14. Brainstorm companion: `Docs/plans/2026-05-14-THR-432-anoint-successor-brainstorm.md`.*
