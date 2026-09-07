> **title:** `The dormant kinds II — rings and the plot — THR-1430`
> **linear_issue:** THR-1430
> **author:** `Claude Code`
> **created:** 2026-09-07
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The dormant kinds II — rings and the plot — THR-1430

*A spider founds a ring and runs it; a knife kills a mortal on purpose. Four wanted cells, one dormant kind woken, one new way for a mortal to leave the story, and one helper two maps have been waiting for.*

## Why this is load-bearing

This is the second half of the *dormant kinds* band on the wayfinder map [THR-1396](https://linear.app/threadbare/issue/THR-1396), ordered by Christian's 2026-09-07 ruling to spread undertakings across systems ([THR-1399](https://linear.app/threadbare/issue/THR-1399)); the first half is [THR-1429](https://linear.app/threadbare/issue/THR-1429). It builds the four cells [THR-1397](https://linear.app/threadbare/issue/THR-1397) decided for the Network and Mortal kinds.

The Network kind is registered and dormant: `GroupKind` already has `'network'` (`src/engine/groupShape.ts:47`), `disband_group` on a network is live, but nothing mints one — `createGroup` stamps `groupKind: 'company'` unconditionally (`src/engine/groups/groupFormation.ts:410`), and the retired spy-network templates never reached a node. The Mortal kind has one decided cell and it is the game's first deliberate killing by a mortal: THR-1397's fork, resolved as **the plot** — *"a premeditated killing (an assassination, a manhunt), never the duel … or the slaying … Motive-gated harder than any other cell … the heaviest harm class so the vendetta is minted; writes `deceased` — never a node removal … When the target is a mortal the player holds a thread to, the attempt surfaces as a moment before it resolves, so the god can spend and intervene."* Today the only mortal-on-mortal killing outside a battle is `action.shadow.assassinate`, whose success is `{ op: 'remove_node' }` (`src/data/action-template-content.ts:634`) — a deletion the chronicle cannot remember and the grievance lane cannot avenge. The Physical Conflict map's research ([THR-1261](https://linear.app/threadbare/issue/THR-1261)) found the same gap from the other side: *there is no callable death API*; a mark-deceased helper with the `death_prevented`, aspect and avatar guards must be extracted. This plan extracts it, so the fight framework inherits it.

What it opens: the Secrets & Favors and Intelligence seams get a *scaled* producer (a ring does at a distance what one mortal does in person), and Agent Lifecycle gets its first mortal-driven exit. One correction to the map's own table, recorded honestly: the callings × cells prototype counted `use × Network` as opening *Stealth & hidden marks*; THR-1397 ruled that mortal surveillance does **not** feed the god's detection pressure, so this plan writes nothing into Stealth. The ring's products are intelligence and secrets. The map is updated to say so.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Companies & Group Travel | 🟠 DORMANT (inventory badge; the tokeniser bug THR-1259 named — companies form in every run) | **activates the network kind** — `createGroup` gains a `kind` input; the group phase's enumeration (`getAllGroups` → `isCompanyNode`, `groupQueries.ts:178-180`) is widened to admit `network` for upkeep, cohesion and dissolution, and only the *movement* sub-step is gated to kinds that travel |
| Strategic Projects & Control | 🟢 ACTIVE | **extends** — four semantics on the registry (`NETWORK.create` / `.raise` / `.use`, `MORTAL.destroy`); the checkpoint ladder gains named stages for one cell |
| Secrets & Favors · Intelligence, Knowledge & Familiarity | 🟢 ACTIVE | **extends** — `run_ring` calls the observe readers THR-1428 shipped (`seedKnowsOf`, `spawnClue`) and `mintLeverageMark` on a target a member is near; products land on the ring's leader |
| Agent Lifecycle | 🟢 ACTIVE | **extends** — one shared `markMortalDead` helper with an explicit mode. Measured today: **two** writers retain the node with `deceased: true` (`groups/bandOpposition.ts:371`, `aspects.ts:288`); the lifecycle's own non-echo death path **removes** the node (`agentLifecycle.ts:265-271`, `graph.removeNode`) after its `death_prevented` and aspect-echo guards (`:216-260`). The helper carries those guards and a `mode: 'retain' \| 'remove'`; the plot, band deaths and the aspect echo call it in `retain`, the lifecycle keeps `remove` — **behaviour-preserving for every existing death**, and the retain-everything change is left to a ticket of its own (see N4) |
| Factions & Succession | 🟢 ACTIVE | **extends** — the succession phase gains the read THR-1397 named: a `deceased` leader is a vacancy (`phaseFactionSuccession.ts` / `factionNetwork.ts` carry no `deceased` read today — measured) |
| Ambitions & Undertakings | 🟢 ACTIVE | **extends** — the plot registers `named_death` (existing, heaviest harm class) through the outcome node; the seen-harm rule (THR-1383) decides the vendetta |
| Attention, Chronicle & Narrative | 🟢 ACTIVE | **extends** — one new moment class, `peril`, for a followed target before the strike |
| Stealth, Detection & Hidden Marks | 🟢 ACTIVE | **preserves, deliberately untouched** — THR-1397: mortal surveillance never feeds detection pressure |
| War, Armies & Battles · Encounters & Dilemmas | 🟢 ACTIVE | **preserves** — duels stay encounters, slayings stay battles and delves |

Grep evidence (measured, corrected after the intent judge's first pass): `groupKind: 'network'` is written nowhere (`grep -rn "groupKind: 'network'" src --include=*.ts` → 0) and `phaseGroups.ts:93` enumerates groups through `getAllGroups`, which filters `isCompanyNode` — so a network node is invisible to movement, cohesion *and* dissolution today; `deceased: true` is written at **two** retaining sites (`bandOpposition.ts:371`, `aspects.ts:288`) while the lifecycle death path deletes (`agentLifecycle.ts:265-271`); **two** catalog cards delete a `$target` mortal with `op: 'remove_node'` — `action.shadow.assassinate` (`action-template-content.ts:634`) and `action.gold.commission-assassination` (`:421-432`); there is **no** compiler retirement list (`undertakingRetrofitPending.ts` is the shrink-only contract ratchet, not an exemption mechanism); `action.shadow.assassinate` is referenced outside the catalog at `action-technical-effects.ts:77`, `reveal-family-aliases.ts:105`, `outcomeConsequences.ts:102`, `plannerForecast.ts:103`, `unifiedActionResolution.ts:2623` and two test files. Population: companies form at 13–16 per 120 ticks (THR-1259), which is the recruitment pool a network draws on; mortals holding a `grudge`-provenance `hostile_to` edge on seed 42 by tick 120 are the plot's only eligible actors (the census counts them).

## Engine pillar

### Systems design

**N1 — `create × Network` = `found_ring`.** A ring is a group of kind `network`: `createGroup` gains `kind: GroupKind` on its input (default `'company'`, so every existing caller is unchanged) and stamps it; the ring gets `commanded_by` its founder and `member_of` for each member with the schema's `role` / `rank` / `joinedTick`, exactly as `raiseWarband` does through the same mint. Members: the bound `recruit` cast first (the binder), then co-located ungrouped mortals who share the founder's faction or lean Shadow, up to `RING_TARGET_MEMBER_COUNT`; fewer than `GROUP_MIN_MEMBERS` → refused `too_few_to_found`. **A network does not travel — and must still be seen by the group phase.** Today `phaseGroups` enumerates groups through `getAllGroups` (`groupQueries.ts:178-180`), which keeps only `isCompanyNode` (`groupShape.ts:89-91`: `getGroupKind === 'company'`), so a `network` node would be invisible to upkeep, cohesion and dissolution as well as movement. The phase's enumeration is widened to admit `network` (a `getAllGroups` that takes the kinds it serves, `['company', 'network']`, so armies stay with the war system), sub-steps 1–2 (upkeep, cohesion, dissolution) run for both kinds, and sub-step 3 (movement) is gated to `GROUP_KINDS_THAT_TRAVEL = ['company']` — a network's members keep their own lives and positions; the network is a web laid over the map, not a band on the road. Cohesion for a network reads the same number but its proximity term is skipped (`groupCohesion` gains a kind switch: loyalty, not distance); dissolution and history persist as for a company.

**N2 — `raise × Network` = `reinforce_group`** (the live op, kind-agnostic) with one recruitment difference: a ring recruits from mortals within `RING_REACH_HEXES` of *any* member, not only co-located with the leader — that is what makes a ring grow across a region.

**N3 — `use × Network` = `run_ring`.** THR-1397: *"each completion does what one observe or one seize × Agreement would, against a target the ring has members near — the ring is the multiplier on the two verbs already decided."* Target enumeration: any Location, Place, Route, Faction seat or mortal within `RING_REACH_HEXES` of any living member. Completion: on a place-kind target, the observe reader (`seedKnowsOf`, `spawnClue` on ruin / wonder classes, exactly THR-1428's R1) with the ring's *leader* as the knower; on a mortal target, `mintLeverageMark` on them for the leader (`create × Agreement`'s op). When `seize × Agreement` (steal a secret, the yield band) ships, `run_ring` gains it as a third product with no other change — recorded as the reader extension in the dispositions file. The ring never writes detection pressure, hidden marks, or anything the god's stealth layer reads.

**N4 — `destroy × Mortal` = `plot_death`.** The cell's object is a living individual mortal (`actorType` individual, not a group or faction, not `deceased`, not the player's avatar). **Gate, harder than any other cell:** the motive gate over `PLOT_MOTIVES = ['grudge', 'faction_war']` only — an injury-provenance `hostile_to` edge or open war between factions; `rivalry` and `contested_ambition` do not license a killing (opportunism, THR-1397). **Stages** — the cell carries `PLOT_CHECKPOINTS = 3` named checkpoints on the existing ladder: *the watching* (on resolve: familiarity with the target's Location, the observe reader), *the positioning* (difficulty eased by `PLOT_POSITIONING_EASE` when the actor commands a company or ring with a member within `RING_REACH_HEXES` of the target, or holds an unredeemed `owes_favor` from someone there — the world's own verbs as stages, THR-1397), *the strike* (the final checkpoint, difficulty `UNDERTAKING_VERB_DIFFICULTY.destroy[tier] + PLOT_DIFFICULTY_BONUS`, the hardest roll on the grid). **Mortal tier**: the target's standing in the world — a faction leader or followed mortal is tier 3, a notable or company leader tier 2, else tier 1 (`MORTAL_TIER_RULES`); tier raises every stage's difficulty through the existing bands.

**The strike's outcomes**, through the shared band ladder:

| Band | The target | The actor |
|---|---|---|
| critical success | dies, unseen | nothing on the books; no vendetta can form unless the god reveals it |
| success | dies | as above |
| success at cost | dies | **exposed**: a `knows_secret_of` mark about the actor is minted on one witness at the site (a co-located mortal, sorted-first), and the target's faction, if any, gains a `hostile_to` edge to the actor with injury provenance |
| near miss / failure | survives | the target gains a `hostile_to` (injury provenance) edge to the actor — the failed plot is a harm *seen*, and the grievance lane may mint the vendetta |
| critical failure | survives | as failure, plus the actor is exposed as at-cost and takes `wounded` (the existing condition) |

**The death** is one call: `markMortalDead(graph, mortalId, tick, { cause: 'plot', byActorId, mode: 'retain' }, runtime)` — a new helper in `src/engine/agentLifecycle.ts` that (1) honours the `death_prevented` rule override exactly as the lifecycle's own death path does (`agentLifecycle.ts:216-227`: the ward wins, `agent_death_averted` is emitted, the plot resolves as *survived*), (2) routes an aspect-bonded mortal through the aspect echo (`aspects.ts:288`: retained, `mythicEcho`), (3) otherwise, in `retain` mode, writes `deceased: true`, `deceasedTick`, `deathCause`, `slainBy` (the band-death shape, `bandOpposition.ts:371`) and emits the existing `agent_death` event without removing the node; in `remove` mode it does what the lifecycle's own path does today (`agentLifecycle.ts:265-271`: edges swept, node removed). **The three existing writers are repointed with their behaviour preserved:** band deaths and the aspect echo call `retain` (what they do today), the lifecycle's low-reputation death keeps `remove` (what it does today). Whether *every* death should retain the node is a real question — readers keyed on node absence (`binding/bindingRegistry.ts:213`, `isAgentGone` at `groupQueries.ts:416`, the spatial sweeps) would all need the `deceased` read — and it is deliberately **not** this plan's; it is recorded on the map's Not-yet-specified as the next question for the Agent Lifecycle seam. The plot retains because THR-1397 said so (*"writes `deceased` — never a node removal"*), and it is the first *undertaking* caller of the one funnel the fight framework (THR-1258's map) will also call. **The seat:** THR-1397's disposition names a third reader — *the succession phase where the victim held a seat*. `phaseFactionSuccession.ts` and `factionNetwork.ts` carry no `deceased` read today (measured), so a retained dead leader would keep leading; the succession phase gains the read: a `leads` / `commanded_by` source with `deceased: true` is a vacancy, resolved by the phase's own rules the tick it sees it. **Harm:** the outcome node carries `harmClass: 'named_death'` (existing, the heaviest) with the actor as culprit; whether anyone *saw* it is THR-1383's rule, unchanged — a clean kill breeds no vendetta, an exposed one does.

**N5 — The peril moment.** When the target `isFollowed` (the shared predicate, `followedAgents.ts`), the lifecycle enqueues a moment of new class **`peril`** for the *target* when the plot advances past *the positioning*, presentation `interrupt`, naming the target and not the plotter (*"Someone means Old Maerin harm"*), and the strike checkpoint defers `PLOT_PERIL_GRACE_TICKS` so the god has a turn. The god intervenes with what already exists — a ward (the `death_prevented` rule override the activation program wired, THR-1241), a blessing (THR-1429), a thread action — never with a new verb; that is THR-1397's sovereignty line (*the non-negotiable binds the god, not one mortal against another*) kept on both sides.

**N6 — The two deleting cards.** `action.shadow.assassinate`'s `remove_node` success is the deletion THR-1397 named; **`action.gold.commission-assassination`** (`action-template-content.ts:421-445`) deletes a `$target` mortal the same way and was not in the decision's text, so it is handled on the record here: **assassinate is retired** (the catalog entry deleted; a catalog test asserts its absence; its five engine and data references — `action-technical-effects.ts:77`, `reveal-family-aliases.ts:105`, `outcomeConsequences.ts:102`, `plannerForecast.ts:103`, `unifiedActionResolution.ts:2623` — and the two tests that name it are repointed or deleted), and **commission-assassination stays as a god's card but stops deleting**: its success effect becomes a `markMortalDead(…, mode: 'retain', cause: 'commission')` call in place of `remove_node`, so a god-bought killing leaves a body the chronicle keeps and a `named_death` the grievance lane can read. There is no compiler retirement list (measured — `undertakingRetrofitPending.ts` is the contract ratchet, shrink-only), so absence is asserted by test, not by a list.

### Graph nodes / edges

No new node type, no new edge type. Written by this plan, all existing:

- Group node with `groupKind: 'network'` (new value of an existing property; `GroupKind` already has it); `commanded_by`, `member_of` as every group.
- `knows_of`, `knows_clue_of`, `knows_secret_of` — the ring's products, on the leader (THR-1428 shapes).
- Mortal node properties (additive): `deceased: true`, `deceasedTick`, `deathCause: 'plot' | 'band' | 'lifecycle'`, `slainBy?`.
- `hostile_to` with injury provenance (the grievance lane's own shape) from target or target's faction to the actor on failure / at-cost.
- `undertaking_outcome` event node with `harmClass: 'named_death'`.
- `pendingUndertakingMoments` record with `momentClass: 'peril'` (new member of `UndertakingMomentClass`).

### Tick phases

| Cell | Phase | Notes |
|---|---|---|
| `found_ring`, `reinforce_group`, `run_ring`, `plot_death` | `strategic_projects` (2a.55) | cell completion; the plot's stages are checkpoints on the same ladder |
| network in the group phase | `groups` — enumeration widened to `['company', 'network']`; movement sub-step gated to `GROUP_KINDS_THAT_TRAVEL` | no reordering |
| `markMortalDead` | called from `strategic_projects`; the lifecycle's own path (`remove`), `bandOpposition` and the aspect echo (`retain`) repointed at it | one funnel; `agent_death` event as today |
| dead leader → vacancy | `faction_succession` | one `deceased` read on the leader edge's source |
| `peril` moment | `strategic_projects` → the moment queue → `attention` | presentation rule in `resolveMomentPresentation` |
| vendetta from `named_death` | `ambitionTick` | existing rule row |

No new phase.

### Resolution logic

- **Ring recruits**: bound cast → co-located mortals sharing faction or with Shadow as a leading Reach, sorted by id, up to the target count. No draw.
- **Ring reach**: `hexDistance` from each living member's resolved hex to the target's; within `RING_REACH_HEXES` qualifies.
- **Run product**: place-kind target → observe reader; mortal target → mark. Deterministic by target kind.
- **Plot gate**: `holdsMotive` over `PLOT_MOTIVES`; evaluated at proposal so an unlicensed actor never sees the cell.
- **Stage difficulty**: verb difficulty by mortal tier + `PLOT_DIFFICULTY_BONUS` on the strike; `PLOT_POSITIONING_EASE` subtracted on the positioning when the actor has an anchor near the target.
- **Witness for exposure**: co-located mortals at the target's node, excluding actor and target, sorted by id, first; none → not exposed (nobody saw).
- **Deferral**: the strike waits `PLOT_PERIL_GRACE_TICKS` after the peril moment is enqueued; a target no longer followed does not shorten it (the grace was granted).

### PRNG callouts

None new. The checkpoint rolls are the ladder's existing seeded rolls. Recruit order, witness and target choice are sorted-first.

## Content pillar

### Encounter templates

Content: N/A for new templates. Duels remain encounters (seeded off a quarrel, `destroy × Standing`), and no encounter is authored here. The retired assassinate card is content *removed*, not added.

### Prose tables

- `src/data/undertaking-verb-prose.ts` — cell overrides (≤3 each): *founding a ring* (*"{Actor} has people now — in {place} and beyond it — who hear things and say them only to {actor}"*), *running it* (*"Word reaches {actor} of {object}; nobody who told it knows who else was listening"*), *the plot's stages* — the watching, the positioning, the strike — as checkpoint labels in GM narration, and the five outcome lines (*"{Object} is dead, and the night keeps the name"*, *"{Object} is dead, and a name is on the wind"*, *"{Object} lives, and knows"*, *"{Actor} is caught at it"*). Never in situ.
- The `peril` moment's card line: *"Someone means {object} harm."* — the plotter is never named on the card.

### Attachment content

N/A — the `wounded` condition used on a critical failure already exists; nothing new.

### Data tables

- `src/data/strategic-action-constants.ts` — the constants below; `PLOT_MOTIVES`.
- `scripts/undertaking-grid-dispositions.ts` — the four cells move to live with their `reader`; `run_ring`'s reader note names the future steal product.
- `src/data/action-template-content.ts` — `action.shadow.assassinate` removed; `action.gold.commission-assassination`'s success effect repointed from `remove_node` to the retained death; the five references and two tests named in N6 repointed or deleted; a catalog test asserts the retired id is absent.
- `src/data/moment-card-content.ts` — `MOMENT_CARD_CONTENT` is total over `UndertakingMomentClass` (`:46`), so the `peril` class gets its card content there.
- `Docs/canon/undertakings.md` — the four cells and the plot's stage rule; `Docs/canon/world-objects.md` — Network's status `live`, Mortal's row notes the one cell; `Docs/canon/rulebook.md` — § conflict: *the plot* as a rule of play beside duel and battle.

## UI pillar

*Screenshot tool: Playwright (DOM — the agent sheet and the moment card). No WebGL change.*

### Player-facing display

- **A network on the sheet.** The agent sheet's group line (a mortal's company today) shows the kind word in the catalogue's own words — *Company · Army · Network* (`Docs/canon/world-objects.md:29` seats *Network*; *ring* is not a UL term and appears on no surface; this document's title uses it only as a gloss) — and for a network, the members' Locations as a list of names with links (Law 1), never a count as a numeral (*"a handful across three towns"* is the banded phrase; `NETWORK_SIZE_WORDS`).
- **A dead mortal.** The sheet already renders `deceased` (the mythic-echo path proved it); the cause word appears in the header (*slain · fell in a fight · died*), and *by whom* only when a mark or a hostile edge with the plotter as culprit exists — the same seen-test the chronicle uses. Law 56: the words read the node.
- **The peril card.** A moment card for the followed target, class `peril`: the target's portrait, *"Someone means {name} harm"*, and the levers the god already has on that mortal's row (thread actions, a ward, a blessing) — the card offers nothing new, it points at what exists. Laws 13/14, 17 (one lesson), 49 (collation).

### Event notifications

- Founding and running a ring: badge-tier moments for a followed founder (`started` and `completion` classes, existing rules).
- The plot: `started` is *badge*; the peril moment is *interrupt* for a followed target; the strike's completion is *interrupt* for a followed actor (existing `completion` rule) and the target's death is the existing `agent_death` chronicle line.
- The vendetta, if minted, arrives through the grievance lane's existing notifications.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getRings()` → rings with leader, members and their hexes; `window.__DEBUG.getPlots()` → active plots with stage, target, deferral and gate motive. JSDoc in `src/debug-bridge.d.ts`.
- CLI `undertakings` lists rings and plots with their stage; `agent <name>` shows `deathCause` / `slainBy` on the dead.
- Traces `ring_run` and `plot_resolved` in the trace viewer.

### Visual presence (HexMapV2)

N/A — a ring has no marker (it is a web, deliberately invisible on the map); a plot has none; the dead already render through the existing agent layer's deceased handling.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/data/undertaking-objects.ts` (`NETWORK.create/raise/use`, `MORTAL.destroy`) | `strategic_projects` | moment card | graph | `ring_run`, `plot_resolved` | `__DEBUG.getRings`, `getPlots` |
| `src/engine/groups/groupFormation.ts` (`createGroup` `kind`) | `strategic_projects` | sheet group line | graph | existing group traces | CLI `undertakings` |
| `src/engine/groups/groupMovement.ts` (`GROUP_KINDS_THAT_TRAVEL`) | `groups` | — | — | existing movement traces | — |
| `src/engine/agentLifecycle.ts` (`markMortalDead`; lifecycle path repointed) + `groups/bandOpposition.ts` (repointed) | `strategic_projects` / `agent_lifecycle` / encounter resolution | sheet header | node properties | `agent_death` event (existing) | CLI `agent` |
| `src/engine/strategicActionLifecycle.ts` (stage labels, strike deferral) | `strategic_projects` | moment card | `strategicState.projects[].checkpointIndex`, deferral tick | `undertaking_checkpoint` (existing) | `__DEBUG.getPlots` |
| `src/engine/undertakingMoments.ts` + `undertakingCheckpoints.ts` (`peril`) | `strategic_projects` → `attention` | `MomentCard` | `pendingUndertakingMoments` | `moment_surface` | existing |
| `src/data/action-template-content.ts` (assassinate retired) | — | action drawer (one card fewer) | — | — | `?view=codex` |
| `src/types/trace.ts`, `src/types/strategicAction.ts` (`peril`) | — | — | — | two categories at every registration site | trace viewer |

Prose pipeline: cell overrides and checkpoint labels through the existing resolver. Player controls: **N/A by design** — the god acts on the peril moment with existing verbs only.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `RING_TARGET_MEMBER_COUNT` | `4` | members a founding recruits toward |
| `GROUP_MIN_MEMBERS` | exists | fewer → `too_few_to_found` |
| `RING_REACH_HEXES` | `3` | how far from any member a ring can recruit, watch or mark |
| `GROUP_KINDS_THAT_TRAVEL` | `['company']` | kinds the group phase's movement sub-step moves (armies move through the war system); a network stays put |
| `GROUP_PHASE_KINDS` | `['company', 'network']` | kinds the group phase enumerates for upkeep, cohesion and dissolution |
| `NETWORK_SIZE_WORDS` | `[[2, 'a few'], [4, 'a handful'], [8, 'a web']]` | the sheet's banded phrase |
| `PLOT_MOTIVES` | `['grudge', 'faction_war']` | the only motives that license a killing |
| `PLOT_CHECKPOINTS` | `3` | the watching, the positioning, the strike |
| `PLOT_DIFFICULTY_BONUS` | `0.15` | added to the strike's difficulty above `destroy`'s band |
| `PLOT_POSITIONING_EASE` | `0.10` | subtracted on the positioning when an anchor is near the target |
| `PLOT_PERIL_GRACE_TICKS` | `6` (half a day) | how long the strike waits after a followed target's peril moment |
| `MORTAL_TIER_RULES` | leader / followed → 3; notable or company leader → 2; else 1 | the target's tier |
| `PLOT_EXPOSURE_BANDS` | `['success_at_cost', 'critical_failure']` | bands on which the actor is exposed |

## Tracing

```ts
// RingRunTrace — emitted when run_ring completes (N3)
interface RingRunTrace extends TraceBase {
  category: 'ring_run';
  ringId: string;
  leaderId: string;
  targetId: string;
  product: 'familiarity' | 'clue' | 'mark' | 'nothing_new';
  memberId: string;              // the member whose reach qualified the target
}
// PlotResolvedTrace — emitted when the strike resolves (N4)
interface PlotResolvedTrace extends TraceBase {
  category: 'plot_resolved';
  actorId: string;
  targetId: string;
  motive: 'grudge' | 'faction_war';
  band: string;
  outcome: 'slain' | 'slain_exposed' | 'survived' | 'caught' | 'warded';
  witnessId?: string;
  deferredTicks: number;         // the peril grace actually waited
}
```

Volume: completions only. The stages ride the existing `undertaking_checkpoint` trace.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Too few recruits for a ring | refused `too_few_to_found`, traced |
| No target within reach of any member | `run_ring` not offered; if reached, refused `nothing_in_reach` |
| All members dead or dissolved | the ring dissolves through the existing group dissolution; the cell is refused `ring_gone` |
| Actor holds no plot motive | cell not offered; refused `no_licence` if reached |
| Target gone, dead, a group, a faction, or the avatar | refused `not_a_mortal` / `target_gone` |
| `death_prevented` override on the target | `markMortalDead` returns `warded`; the plot resolves *survived* with outcome `warded`; the ward's own `agent_death_averted` event fires |
| Aspect-bonded target | routed through the aspect echo; `deceased` with `mythicEcho`, the bond persists (existing) |
| No witness at the site on an exposure band | not exposed; traced |
| Target's faction absent on at-cost | only the witness mark; no faction hostility |
| Moment queue absent on state | initialised (existing writer behaviour) |
| `followedAgents` predicate unavailable | treated as not followed: no peril moment, no deferral |
| Retired assassinate id referenced anywhere | the catalog absence test and `check:typecheck` fail by name at build; no runtime path |
| A dead leader on a faction's `leads` edge | the succession phase reads `deceased` and treats the seat as vacant next tick |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/engine/agentLifecycle.ts` | high (the lifecycle) | one exported helper with a `retain` / `remove` mode; the existing death path calls it in `remove`, which is what it does today — behaviour-preserving, covered by the lifecycle tests; the retain-everything change is explicitly not made here |
| `src/types/strategicAction.ts` | high | one `UndertakingMomentClass` member; `resolveMomentPresentation`'s switch is exhaustive and fails to typecheck until the arm exists |
| `src/types/trace.ts` | high | two additive categories |

## Interface impact

| Contract | Status today | Action |
|---|---|---|
| `undertaking-object-types` | 🔵 UNVERIFIED-OK | **extend** — four semantics |
| `undertaking-remote-anchor` | 🔵 UNVERIFIED-OK | **extend** — the positioning stage reads the same anchors (a commanded group near the target) |
| `undertaking-checkpoint-events` | 🟢 LIVE | **extend** — named stages; the `peril` class for a target |
| `binding-registry-reaper-hook` | 🔵 UNVERIFIED-OK | **preserve** — the plot kills through `markMortalDead`, which never removes the node, so the reaper hook is not triggered; the binding ledger's severance for a *bound* victim is the hook's existing node-absence read and is unaffected (the victim stays) — the executor confirms a dead bound cast member is treated as gone by `isAgentGone` |
| `world-events-mint-ambitions` | 🟢 LIVE | **preserve** — `named_death` already mints; the seen-rule applies |
| `t1-undertaking-objects-feed-existing-economies` | 🟢 LIVE | **extend** — the ring's products |
| `mortal-dies-through-one-funnel` | — | **add** — producer `markMortalDead` (callers: the plot, the lifecycle, band opposition), consumers the chronicle, the aspect echo, `isAgentGone`, the grievance funnel. Register in `scripts/interface-contracts.ts` |
| `ring-is-a-group-that-stays` | — | **add** — producer `found_ring` (`groupKind: 'network'`), consumers group cohesion / dissolution / the sheet; the movement phase's kind filter is the contract's guard. Register in the same change |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (overrides and labels, one card retired, data rows; templates and attachments N/A with rationale)
- [x] UI pillar present (sheet group line, the dead mortal's header, the peril card; HexMap N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. Mortal sovereignty is the plan's spine: the killing is a mortal's, motive-gated on the world's own grudges; the god gets a moment and existing levers, never a new verb. The dead stay in the chronicle (the retained node) — the world remembers.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes rules of play: **a mortal may found and run a network** (a group that does not travel, whose work reaches as far as its members), and **a mortal may plot another's death** (licensed only by a grudge or a war, staged, the target dies or the plotter is exposed; a followed target's god gets a warning). `Docs/canon/rulebook.md` § 9 *The World at War* covers battle and § 10.7 *The Reactive Loop* covers the quarrel-seeded duel; the plot is added beside them as the third way a mortal's conflict resolves.
- [x] The executor moves the section to `[IMPL]` in the same PR and re-verdicts it.

> Brainstorm companion: `Docs/plans/2026-09-07-thr-1430-dormant-kinds-rings-plot-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | reach, counts, motives, difficulty bonus, grace ticks, tier rules — all named constants |
| 2. Inspectability | PASS | `ring_run`, `plot_resolved`, the existing checkpoint and death events; two debug accessors; the gate motive on the trace |
| 3. Determinism | PASS | no new random call; recruits, witnesses and targets sorted-first |
| 4. Fail-soft | PASS | thirteen rows; the ward and the aspect echo are outcomes, not exceptions |
| 5. Narrative over mechanical perfection | PASS with note | a clean kill breeds no vendetta unless seen — mechanically "unfair", narratively the point; the plotter's name never appears on the peril card |
| 6. Additive over destructive | PASS with note | one card retired (`action.shadow.assassinate`) because its only effect is a node deletion the world cannot remember — THR-1397's explicit decision; three ad-hoc death writes consolidated into one helper with behaviour preserved |
| 7. Performance budget | PASS | ring reach is a hex-distance check over ≤ `RING_TARGET_MEMBER_COUNT` members at proposal; the plot is one undertaking per actor |

## Kill criteria

- If no plot is ever proposed on two seeds in 150 ticks, the motive set is right and grievance supply (THR-1383) is the limit — recorded on the map, not loosened here.
- If rings never gain a member beyond the founding (the reach or the pool too small), `RING_REACH_HEXES` and the recruit filter move; the kind stays.
- If the peril moment fires and the god's existing levers cannot avert a strike within the grace (no ward reachable in six ticks), the grace is too short or a ward is missing from the god's row — a Powers/encounter-side finding, recorded on the Physical Conflict and Powers maps.

## Done when

- [ ] Headless: `spawn undertaking <spider> cell.create.network` on seed 42 medium mints a group with `groupKind: 'network'`, `commanded_by` and `member_of` edges; after `tick 12` no member has moved because of the group (the movement phase's kind filter, tested); `cell.use.network` on a Location within reach of a member leaves `knows_of` on the leader; on a mortal, `knows_secret_of`
- [ ] `spawn undertaking <knife> cell.destroy.mortal` on a target the actor holds a grudge against, `--band success`: the target carries `deceased: true`, `deceasedTick`, `deathCause: 'plot'`, `slainBy`; the node still exists; `agent_death` fired; an outcome node with `named_death` exists; on `--band success_at_cost` a witness mark and a faction `hostile_to` exist; on `--band failure` the target holds an injury-provenance `hostile_to` to the actor
- [ ] With a `death_prevented` override on the target, the plot resolves `warded` and the target lives; an aspect-bonded target goes through the echo path
- [ ] A followed target: the `peril` moment is enqueued as `interrupt` after the positioning stage, and the strike does not resolve before `PLOT_PERIL_GRACE_TICKS` have passed (test drives the ladder headlessly)
- [ ] An actor with only `rivalry` against the target is never offered the plot (`no_licence` on the board trace); `action.shadow.assassinate` is absent from the catalog (asserted by test) and no engine or data reference to it remains; `action.gold.commission-assassination`'s success leaves a retained `deceased` node, never a removal
- [ ] A faction whose leader dies by the plot has a vacant seat on the succession phase's next pass (test in the succession suite)
- [ ] `phaseGroups` runs upkeep, cohesion and dissolution for a `network` node and never moves its members (test in `src/engine/__tests__/groups/`)
- [ ] `bandOpposition` and the lifecycle's own death path call `markMortalDead`; the existing lifecycle and band tests pass unchanged
- [ ] The grid regenerates with the four cells live and their readers; canon (`undertakings.md`, `world-objects.md`, `rulebook.md` § conflict → `[IMPL]`), the wiki pages `agents-reference`, `encounters-manual-reference`, `factions-cultures-reference`, `undertaking-grid`, `action-catalog` updated or exempt with a reason
- [ ] 30-tick CLI engine smoke and `npm run test:heavy` locally
- [ ] UI: Playwright screenshot at 1920×1080 of a followed mortal's peril card and of a dead mortal's sheet header with the cause word; the ring's group line with the kind word and member Locations; console clean; `window.__DEBUG.getPlots()` assertion; UI-Laws line (1, 4, 5, 13/14, 17, 21, 33, 37, 49, 56)
- [ ] `npm test` and `npx vite build` pass; types verified via `tsc -b --force` net-new diff (not `tsc --noEmit` — no-op here, THR-686)
- [ ] Closing commit body includes `Fixes THR-1430`
- [ ] Browser-verify screenshot at 1920×1080 included for the sheet and card surfaces

## Coordination block

**Suggested model:** opus — a death funnel touching three writers, a moment class with a deferral on the checkpoint ladder, and a group kind that must not travel; each needs the surrounding code read.
**Parallel-safe with:** THR-1401, THR-1402, THR-1404 (map decision tickets); encounter-content tickets; HexMapV2 tickets.
**Files to touch:** `src/data/undertaking-objects.ts`, `src/engine/groups/groupFormation.ts`, `src/engine/groups/groupQueries.ts` (`getAllGroups` kinds), `src/engine/groups/phaseGroups.ts`, `src/engine/groups/groupMovement.ts`, `src/engine/groups/groupCohesion.ts` (kind switch), `src/engine/groups/bandOpposition.ts`, `src/engine/agentLifecycle.ts`, `src/engine/aspects.ts` (routing only), `src/engine/phaseFactionSuccession.ts` / `factionNetwork.ts` (the `deceased` read), `src/engine/strategicActionLifecycle.ts`, `src/engine/undertakingCheckpoints.ts`, `src/engine/undertakingMoments.ts`, `src/types/strategicAction.ts`, `src/types/trace.ts`, `src/data/strategic-action-constants.ts`, `src/data/undertaking-verb-prose.ts`, `src/data/moment-card-content.ts`, `src/data/action-template-content.ts`, `src/data/action-technical-effects.ts`, `src/data/reveal-family-aliases.ts`, `src/engine/outcomeConsequences.ts`, `src/engine/plannerForecast.ts`, `src/engine/unifiedActionResolution.ts` (the assassinate references), `src/debug-bridge.ts` + `.d.ts`, `src/components/Game/AgentDetailPanel.tsx`, the moment card component, `scripts/undertaking-grid-dispositions.ts`, `scripts/interface-contracts.ts`, `Docs/canon/undertakings.md`, `Docs/canon/world-objects.md`, `Docs/canon/rulebook.md`, five wiki pages, tests named below.
**Mutex with:** THR-1429 (both edit `src/data/undertaking-objects.ts`, `scripts/undertaking-grid-dispositions.ts`, `src/types/strategicAction.ts`, `Docs/canon/undertakings.md` — **land THR-1429 first**); THR-1403 (same files); any Physical Conflict map ticket that touches `agentLifecycle.ts` death handling (the fight framework should call `markMortalDead`, not extract its own — sequence behind this); any ticket editing `groupFormation.ts` / `groupMovement.ts`.

## Notes for the executor

- **`markMortalDead` is the load-bearing extraction — with a mode.** Three writers today and they do not agree: the lifecycle's death path (`agentLifecycle.ts:216-276`) guards with `death_prevented` and the aspect echo and then **removes** the node (`:265-271`); `bandOpposition.ts:371` and `aspects.ts:288` **retain** it with `deceased: true`. Lift the guards into the helper, give it `mode: 'retain' | 'remove'`, and make all three call it with the mode that matches what they do today. Do not switch the lifecycle to `retain` in this ticket — that changes every node-absence reader (`binding/bindingRegistry.ts:213`, `isAgentGone`, spatial sweeps) and is the map's next Agent-Lifecycle question, not yours. The Physical Conflict map's fight framework (THR-1258) is the next caller — leave a one-line pointer in the JSDoc.
- **A network must be seen by the group phase before it can be told not to travel.** `phaseGroups.ts:93` → `getAllGroups` → `isCompanyNode` keeps only companies. Widen the enumeration by kind (`GROUP_PHASE_KINDS`), run upkeep, cohesion and dissolution for both, and gate only the movement sub-step on `GROUP_KINDS_THAT_TRAVEL`. `groupCohesion.ts` gets a kind switch that skips the proximity term for a network (loyalty, not distance).
- **The seat.** `phaseFactionSuccession.ts` / `factionNetwork.ts` read no `deceased` today; add the read so a retained dead leader vacates the seat on the phase's next pass, resolved by the phase's own rules.
- **The plot's stages are checkpoints.** Confirm how checkpoint count derives (`UNDERTAKING_PROGRESS_PER_ADVANCE` and the verb's duration); a cell override may set duration so the ladder yields three; the stage *labels* are override prose keyed by checkpoint index. The strike's deferral is a tick on the project record (`nextCheckpointTick` or its equivalent), set when the peril moment is enqueued.
- **The plot's motive set is deliberately narrower than the gate's.** `PLOT_MOTIVES` excludes `rivalry` and `contested_ambition`; `holdsMotive` distinguishes `grudge` (injury provenance) from `rivalry` on the same `hostile_to` family — use that split, do not widen.
- **The seen-rule is not yours.** Exposure mints the witness mark and the hostile edge; whether a vendetta follows is `ambitionTick`'s grievance funnel reading the outcome node (THR-1383). Do not mint an ambition from the cell.
- **The two deleting cards.** `action.shadow.assassinate`: remove the entry; repoint or delete its references at `action-technical-effects.ts:77`, `reveal-family-aliases.ts:105`, `outcomeConsequences.ts:102`, `plannerForecast.ts:103`, `unifiedActionResolution.ts:2623` and the two tests (`phase3-outcomeExpansion.test.ts`, `plannerForecast.test.ts`); add a catalog test asserting the id is absent; let the codex regenerate. `action.gold.commission-assassination`: keep the card, replace its `remove_node` success op with a `markMortalDead(…, 'retain', cause: 'commission')` call. There is no retirement list — do not invent one.
- **Stealth stays the god's.** Nothing here writes hidden marks or detection pressure; the map's systems table is corrected by the design session, not by the executor.
- **Tests:** `src/data/__tests__/undertaking-objects.test.ts` (each semantic, each refusal, the motive set), `src/engine/__tests__/groups/` (a ring stays put; cohesion), a new `agentLifecycle.markMortalDead` test (ward, echo, plain), `undertakingMoments` (peril + deferral), `undertakingMotiveGate.test.ts` (rivalry refused), a catalog test that the assassinate id is absent and retired. Falsify each guard at its owning layer.

## Forked-audit verdicts

Three independent auditors (sonnet), spawned in one message on 2026-09-07, plus the intent judge (fable, cold).

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | eleven-row constants table; no magic numbers in the design prose |
| 2. Inspectability | PASS | `RingRunTrace`, `PlotResolvedTrace` with full fields; `__DEBUG.getRings` / `getPlots`; CLI surfacing; wiring table complete |
| 3. Determinism | PASS | no new random call; recruit order, witness and target sorted-first; checkpoint rolls reuse the seeded ladder |
| 4. Fail-soft | PASS | twelve rows, none throw; the ward and the aspect echo are outcomes |
| 5. Narrative over mechanical | PASS-with-note | a clean kill breeds no vendetta unless seen — named as the point; the plotter withheld from the peril card |
| 6. Additive over destructive | PASS-with-note | one card retired for a `remove_node` the chronicle cannot remember (THR-1397's explicit decision); three death writes consolidated with behaviour preserved and existing tests required unchanged |
| 7. Performance budget | PASS | reach is a bounded hex-distance check at proposal; one plot per actor; no per-tick scan |

**NFP AUDIT: PASS-with-notes.**

### Three-pillar audit

Engine, Content and UI each present-and-substantive; no missing required sections; the Wiring table connects every module to phase, component, GameState field, trace and debug surface. Substrate check PASS — Companies & Group Travel confirmed DORMANT in the inventory and *activated* (the network kind) rather than rebuilt; the other eight subsystems confirmed ACTIVE with matching dispositions; no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

North star confirmed (mortal sovereignty; the peril moment keeps the distance/attachment axis); core loop silent (a moment, not an encounter beat); non-negotiables 1, 2, 3, 4, 6, 7 confirmed, with the retirement of the assassinate card read as a *fix* to a graph-premise violation rather than a destructive change; design tension 3 (divine remove vs attachment) navigated by scoping the peril moment to followed targets; taste profile confirmed. No contradictions. **VISION AUDIT: PASS.**

### Intent-judge verdict

**Run 1 (fable, cold): Revise** — intent, pillars, NFPs, Vision, rejected approaches, load-bearing decisions and kill criteria PASS; substrate existence VIOLATION and three GAPs, all author-fixable and all applied in this revision: the lifecycle death path *removes* the node today (only two writers retain), so `markMortalDead` gained a `retain` / `remove` mode and every existing writer keeps its behaviour; `action.gold.commission-assassination` also deletes a mortal and is now repointed to the retained death; `phaseGroups` enumerates companies only, so the enumeration is widened by kind and only movement is gated; there is no compiler retirement list, so absence is asserted by test and the five engine references are named; THR-1397's third reader (succession for a dead seat-holder) is now in scope; *ring* is not a UL term, so surfaces say *Network*; the rulebook pointer names the real sections; `moment-card-content.ts` joins the files to touch.

**Run 2 (fable, cold, revised copy): Allow** — all eleven dimensions PASS, zero gaps. Every corrected claim re-verified at source by the judge: the two retaining death writers and the deleting lifecycle path; the company-only group enumeration; both deleting cards and the five engine and data references to the retired one; no `deceased` read in succession today; `MOMENT_CARD_CONTENT` total over the moment classes; no retirement list. Load-bearing note accepted: `slainBy` stays an internal record on the dead node, never a relationship the engine traverses. Two path and wording notes applied in this revision. Impact class Reversible, confirmed.
