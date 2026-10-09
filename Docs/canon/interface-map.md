---
domain: interfaces
last_reviewed: 2026-08-06
reviewer: claude-code
ul_shards: [Graph, Agents, Encounters, Cosmology]
status: live
---

# Canon — System Interface Map

> Who consumes what, across subsystem boundaries — the contract layer between the systems
> inventory ("what exists") and the rulebook ("how it plays"). Load this **whenever a plan
> touches a subsystem that other subsystems read from or write to** — i.e. nearly always.

**This page carries the protocol. The rows live in
[`interface-map.generated.md`](interface-map.generated.md)**, generated from
`scripts/interface-contracts.ts` by `npm run generate-interface-map`. Edit the registry,
never the generated file.

## Why this page exists

`Docs/canon/systems-inventory.md` answers "does system X exist?" It cannot answer "who
depends on X, and does that dependency still function?" Features leak exactly there: a
producer keeps writing data whose consumer was rewritten away (or vice versa), tests still
pass because they assert the write, and the game silently loses richness. The 2026-07-23
attachment audit found **five** such leaked contracts in one subsystem — all invisible to
tests, typecheck, and playtests.

**Three lenses, one stack — don't confuse them.**
1. **Codesight** (`.codesight/graph.md`, MCP) — *file-level imports*. Catches orphan modules
   (a resolver no production file imports). An import edge proves code linkage, **not** a
   live contract: `modifiers.ts` is imported (visibility) while item stat bonuses still flow
   nowhere. Data contracts riding graph node/edge *properties* never appear here at all.
   Advisory only — `.codesight/` is gitignored and its hook does not run in CI, so it is
   never a generator input.
2. **Systems inventory** (`systems-inventory.md`, generated) — *existence + tick wiring*.
3. **This map** — *contract semantics*: design intent ↔ mechanism ↔ consumer ↔ liveness.
   Contract intent uses **UL terms** (a contract is a relationship between UL terms, e.g.
   "Possession modifies Domain Capability"); an undeclared concept in a new contract goes
   through the existing UL-proposal flow.

## Badges

🟢 LIVE · 🟠 PARTIAL (works but a stated gap) · 🔴 LEAKED (one side dead — feature silently
lost) · 🟣 HOLLOW (a claim with no referent) · ⚫ UNWIRED (neither side present) · 🔵
UNVERIFIED-OK (both sides grep clean, liveness unproven) · ⚪ UNAUDITED (no contract row yet).

**🟣 HOLLOW is defined by pointer, and the pointer is the point.** Its definition is the UL
entry [`claim-without-anchor`](../ubiquitous-language/Process.md#claim-without-anchor) — alias
*Law 56-hollow*, already in-tree at `src/types/unifiedAction.ts` — and the rule it violates is
UI Law 56. This page does not restate it. That is the absorbed ruling from
`Docs/plans/2026-08-27-shared-anchor-machinery.md` (THR-1212 ruling 3, seated by THR-1316):
the UL is the authority for the three violation classes, this map points at it, and there is
no third home. The other two classes need no new badge — `write-without-consumer` **is** 🔴
LEAKED under a general name, and `render-private-pipeline` is covered only partially, which
the UL entry states rather than this map pretending otherwise.

**HOLLOW is pin-only, and no row carries it today.** It arrives solely via `badgeOverride`,
because symbol matching cannot see the absence of a referent it was never told to look for —
so unlike LEAKED there is no mechanical path to it. The class is real and measured, just not
at *this* registry's granularity: `check:chip-anchors` counts it per template (clause 2 for
chips that declare a referent, the `--baseline` ratchet for the 443 that declare none), and
the encounter-factory retrofit line drains that population. Stated here rather than left as
an apparent oversight — an unused badge with no note reads as vocabulary nobody wired.
HOLLOW joins LEAKED in `TICKETED_BADGES`, so the first row ever pinned to it must carry a
remediation ticket or the generator exits non-zero.

**Classification is downgrade-only — this is the load-bearing invariant.** Static analysis
can prove a contract dead; it can never prove one alive. Both headline leaks would have been
re-badged 🟢 by a naive "write site exists AND read site exists → LIVE" rule:
`domainContributions` greps clean while every catalog writes `{}` (*value-level* deadness),
and `modifiers` has a real production reader that only ever asks for `los_range`
(*argument-level* deadness). So:

- 🟢 LIVE comes **only** from a dated `verifiedLive` entry carrying its evidence.
- A mechanically passing row earns at most 🔵 UNVERIFIED-OK.
- `badgeOverride` pins a row 🔴/🟠 when a production read site exists but does not count —
  display-only readers (tooltips), documented-dead components (`AgentDetailPanel.tsx`).
- Mechanical deadness **beats** a stale `verifiedLive`, which is then reported as stale.

## Interface stewardship protocol (binding for design sessions)

1. **Step 0.7 — Interface impact check.** After the substrate-existence check (Step 0.6),
   find every subsystem your plan touches in this map. The plan doc must carry an
   `## Interface impact` section: one row per touched contract with an action —
   `preserve` / `extend` (name the new consumer/producer) / `add` (new contract → register
   the row in `scripts/interface-contracts.ts` in the same change) / `retire` (explicit,
   with a user verdict if player-facing). `npm run lint:plan-doc` flags a plan that names a
   mapped subsystem with no such section (advisory).
2. **No producer without a consumer.** A plan that adds a write (new property, edge, event,
   trace meant for cross-system use) must name the production read site in the same plan —
   or open a `Deferral`-labeled Linear issue and cite it in the contract row. "Something
   will read this later" without a ticket is how features leak.
3. **Executors update rows they touch.** DoD: if your change adds, retires, or reroutes any
   read/write named here, update the registry row in the same PR. **Retiring a contract
   deletes or repoints the tests asserting its dead side** — green tests on a dead contract
   are the pathology this map exists to kill.
4. **Audit-on-touch.** ⚪ UNAUDITED subsystems get their contract rows written by the first
   design session that touches them — verify with greps, don't transcribe intentions.
   **UNAUDITED is a to-do marker, never an exemption from Step 0.7.** Cold subsystems no
   session touches get swept by a weekly audit ticket from the Friday drift scan.
5. **The ratchet.** A 🔴 LEAKED contract must carry a `deferralTicket`. The generator exits
   non-zero otherwise, failing `prebuild` and therefore CI — the freshness diff alone would
   pass an executor who kills a read site and commits the regenerated, now-LEAKED map.
6. **Player-loop chain (mandatory when the subsystem has player verbs).** A player-facing
   contract is a four-link chain, and each link is its own contract row in the registry:
   **verb authored** (template exists) → **verb reachable** (starter or beat grant — an
   ungranted card is unreachable *by construction* under THR-613/THR-501; check
   `__DEBUG.listUnreachableActions()`) → **effect wired** (resolution/GraphOps actually
   fire) → **world visibly responds** (a scene, chronicle entry, or map change the player
   can see). A break at any link is a leak with a ticket. A design that strengthens
   simulation without closing this chain ships background richness the player never
   touches; a verb without a world response ships a button that lies. Found 2026-07-23:
   `action.secrets.plant_secret` / `reveal_secret` / `hex.incite_exodus` break at link 2;
   the four granted economic verbs (`loc.bless_harvest`, `loc.blight`, `loc.open_markets`,
   `loc.reveal_vein`) break at link 4 — no economic term in encounter scoring.
   Method + evidence: `Docs/audits/2026-07-23-simulation-coupling-assessment.md`.

## Audited subsystems

**Attachments, Items & Possessions** and **Ambitions & Initiatives** — 20 contracts, audited
2026-07-23 (THR-717). Current badges and per-row evidence:
[`interface-map.generated.md`](interface-map.generated.md).

Standing remediation backlog (user-verdicted 2026-07-23, see
`Docs/plans/2026-07-23-system-interface-map.md` § User verdicts): **THR-718** items→tiers via
an `effects[]` primitive + StepDots magnitude indicator · **THR-719** on-use triggers as
effect primitives · **THR-720** `activatedEffects` parked · **THR-721** ambition visibility +
ChronicleTab completed list · ~~**THR-722** retire edge `grants[]`~~ (done 2026-07-24 — the
edge property is deleted and its authored payload re-expressed as `effects[]` `trait_grant`;
the intent's row is now `attachment-trait-grant-effects`, still LEAKED because the *consumer*
is missing, tracked by **THR-737**) · ~~**THR-723** dead stat path~~ (done 2026-08-06 —
`attachmentTierAdvancement` now scales the artifact's `stat_contribution` effects, the live
substrate `computeRawScore` reads, clamped to `ITEM_STAT_BAND_LEGENDARY`; it no longer scales
Reach-domain edge `modifiers`, while non-Reach keys like `los_range` keep working. Both rows
stay 🔴 LEAKED for the halves THR-723 deliberately did not take: the resolver still has **no
production caller**, a design call deferred to **THR-996**, and the reach-keyed *seed* writes
in `gameInit.ts`/`seedAttachments.ts` remain, deferred to **THR-997**).

One contract added since that audit, **`attachment-effect-event-raises`** (THR-1239,
2026-08-25) — game events reaching the event-triggered effect primitives (`reactive`,
`until_event`, `stacking`, `transform`, one-shot `resource_manipulate`). It is 🟢 LIVE and was
never LEAKED, but it earns a line here for *how* it was broken: the consumer half
(`processEffectEvent`) was fully live and correct, and the producer half was almost entirely
absent — outside a single `encounter_outcome` raise inside the orchestrator, no site in the
engine ever constructed an `EffectEvent`, so the whole executor family was unreachable in
normal play while every part of it read as wired. **A one-sided contract with a healthy
consumer is the hardest shape for this map to catch**, because every symbol an audit greps
for exists. Producers are now `phaseMovement`, `battleResolution`, `orchestrator`,
`phaseDoom` and — since THR-1244, 2026-08-26 — `conditionProxyEvents` raising from the three
aftermath condition writers, all through one `raiseEffectEvent`, and each raise emits
`effect.event_raised` carrying its site — including when nothing was listening, which is the
signal that separates a live-but-unheard producer from an unwired one.

The condition producer is worth a line of its own, because it is a **third** shape of
one-sidedness this map should learn to name. `damaged` / `healed` had no producer not through
oversight but *by construction*: the game has no per-agent damage model, so there was no
hit-point subtraction to raise from, and three trigger families sat behind a number that does
not exist anywhere in the codebase. An audit grepping for producers and finding none would
have been correct and useless — the answer was not "wire the missing call" but "decide what,
in this game's own vocabulary, being hurt *is*". A wound is a condition with a countdown, so
that is the proxy. **The generalisable warning: when a contract's producer half is missing,
check whether the thing it would produce exists in the domain at all before filing it as
unwired work.** A fourth writer of the same edge (`actionTriggerPayloads`) remains silent and
is ticketed as **THR-1257**, together with the tag-vocabulary mismatch that would make wiring
it *silently wrong* rather than merely incomplete if the two were done apart.

Its mirror image landed a day later: **`rule-overrides-reach-owning-sites`** (THR-1241,
2026-08-26) — the *read* half of what THR-1240 opened. Where the event contract had a healthy
consumer and no producer, this one had a healthy producer and **eleven of thirteen keys with no
consumer at all**. The store kept every `ActiveRuleOverride` correctly, `getActiveRuleOverride`
folded them correctly, and nothing asked: an artifact could promise `death_prevented` and the
mortal wearing it still died, because the only function that decides a death never read the key.
Five keys had shipped catalog content making a promise the engine could not keep. Every symbol an
audit greps for existed on both sides — the same blindness, entered from the other end, which is
why the two rows sit together here rather than one being filed as a repeat of the other.

The fix is one shared reader (`ruleOverrideConsumers.ts`) called from the single site that owns
each rule, because the alternative — eleven inline reads — is eleven chances to disagree about the
neutral, the fold, or the trace, and an inline `?? 1.0` at a `*_bonus` site is a permanent bug no
test catches, since the number it produces is plausible. `doom_rate_multiplier`, the one key that
*did* have a consumer, was migrated onto the same reader: its hand-rolled scan saw only
attachment-declared overrides, folded unclamped, and ignored duration and cooldown state, so the
single wired key was also the single disagreeing one. One partial reach is stated rather than
hidden — `backlash_severity_multiplier` reads inside `evaluateBacklash`, whose caller
`activateSpell` still has no production caller, so that key is live in code and goes live in play
when spell activation does.

**Personality & Emergent Traits** — first slice, 2 contracts, audited 2026-07-26 (THR-786),
audit-on-touch triggered by the trait-predicate unification. `trait-predicate-resolution` is
🟢 LIVE: all six trait-predicate read sites (encounter filter pipeline, effect-predicate
context builder, `graphConditions`, ambition snapshot eligibility, spell prerequisites,
item-granted keys) route through one `resolveTraitPredicate` / `collectBearerTraitRefs`, held
by an unchanged-behavior contract suite. `trait-ref-authoring-vocabulary` is 🔴 LEAKED and
**measured, not assumed**: `__DEBUG.validateTraitRefs()` reports 62 authored trait refs that
resolve to no trait definition, because authored refs are bare snake_case keys while every
definition uses `trait.<category>.<kebab>` ids / Title Case names / `#tags` — two
vocabularies that have never intersected. Remediation: **THR-800**. Trait *minting* began with
`location-traits-shift-encounter-pool` (THR-790, 2026-09-22 — `phaseLocationTraits` mints four
`trait.condition.location.*` traits from the world's own scalars and `scoreAndSelect` reads them
as one pool term); decay and display rows for the remaining waves are still unwritten (THR-791). A fifth minted trait, *Blood-soaked*, reads records rather than a scalar: `battles-leave-a-record-on-the-ground` (THR-1528, 2026-09-26, 🟢 LIVE) has `resolveBattle` write a `battle_fought` Event on the battle's ground, which the rule, the place MEMORY and the debug readout read; the pool and movement-tax rows above each gained a fifth trait row. Slice 2, `fights-leave-a-record-on-the-ground` (THR-1574, 2026-09-27, 🟢 LIVE), has the first fight-end dispatcher branch write a `fight_fought` Event where a fight with a real exchange was fought, read by the same three readers at a third of a battle's weight.

**Dealt hands** — 1 contract, written 2026-08-25 (THR-1247), **LIVE since 2026-08-26 (THR-1254)**.
`repertoire-deals-into-encounter-hand` covers the Repertoire supplying most of an encounter's
hand: the encounter authors 0–2 specials and declares a fill, and `dealHand` mints the rest
from cards the god already holds. It was badged **PARTIAL** through two tickets for one
narrowing reason at a time — first that the play-profile corpus was thin (THR-1247), then
that no *shipped* template declared `ActionStep.deal`, so nothing travelled the path in a
real run (THR-1248). Badging LIVE on a wired path alone would have been the THR-614 error
class again, which is why the override outlived the code by two tickets.

What retired it is a shipped encounter, not an argument: **The Unfinished Rite**
(`encounter.delve.the_unfinished_rite`) is registered in both catalog arrays and its step 0
declares `deal`, so `check:encounter-live` can and does return `proved` for it. The golden
exemplar could never have discharged this — it is registered in no pool, and an unregistered
template never advances a step. The evidence worth carrying forward is that the *same* step
composes a different hand per god: darkness/order is dealt Follow The Book, Hide The Deed and
Open The Ledger where force/matter is dealt Throw Full Weight and Find What Remains, with the
two authored specials constant across both. That is the contract's intent sentence
demonstrated rather than asserted, and it is what a corpus-wide `deal` rollout now rests on.

The row is worth reading for **which read sites it names**, because that is where the design
nearly went wrong. It names two: the stage adapter *and* `unifiedActionResolution.ts`. The
plan specified only the adapter — and resolution never receives the hand the player saw. It
re-derives its step from the template, where `nudges` holds the authored cards alone, and
`collectNudgeModifiers`, `selectActiveRider`, `dispatchNudgeCommitments` and
`collectNudgeBandProse` each resolve a committed id against that list and skip what they
cannot find. A dealt card would have rendered, priced, charged, and then contributed nothing
at all — a contract with a live producer and a consumer that silently drops its operand,
which is the exact shape this map exists to make visible. It is sound to re-derive because
dealing is pure and zero-PRNG; that determinism is load-bearing, not a nicety.

**Nudge card dispatch** — 4 contracts, written 2026-07-30 (THR-885) and extended 2026-08-09
(THR-886), audit-on-touch triggered by the card-system engine.
`nudge-card-grants-dispatch-to-host-systems`, `nudge-card-cost-channels-detection-and-doom`,
`nudge-hand-runtime-filters-and-sphere-discount`, and
`compulsion-card-plants-agent-decision-bias` are all wired and test-covered but
deliberately **not** badged LIVE: no shipped card authors a `grants` block or a cost channel,
because card content lands under **THR-883**. Badging a path nothing travels is the THR-614
error class, so the rows carry `deferralTicket: THR-883` until the first authored hand ships.

Three of the four needed a host-side addition rather than a new path, and the distinction is
the point: card grants reuse the existing `EncounterAftermathReactionEffect` vocabulary
(`emit_omen`, `remove_condition`, `spawn_artifact`, `hidden_mark`, `favor_creation`) through
the existing applier, so five of the six dispatch hooks cost no new machinery at all. The
exceptions — `assign_ambition`, `applyRawDetectionDelta`, and `plant_compulsion` — exist
because the capability genuinely was missing: reactive ambition templates had no assignment
path outside `ambitionTick` (THR-812 / THR-726), and every detection writer priced by
choice-cost band, which can only *raise* pressure. Both were added to the owning module, not
beside it.

The sixth hook, **The Compulsion**, was the one that needed a design call before it could be
wired at all (THR-886). Its apparent host, `buildCompulsionEvent`, takes the decision
pipeline's `ScoredCandidate[]` — a list that exists only mid-`phaseAgentDecision` and that
aftermath cannot obtain, so THR-885 stopped rather than synthesize fakes to fit the signature.
Christian resolved it 2026-08-09: the card plants a *weight*, not a candidate menu, and a
weight **is** available at the aftermath seam. So `plant_compulsion` writes a per-agent
`PlantedCompulsion` and `phaseAgentDecision` folds it into the same `combinedBias` the omen
path already feeds — one reader, not two. `premonitionCompulsion` is untouched, which keeps
the pick-one-of-three vision on the god's own premonition turn where it already lives. The
carrier is deliberately **not** `state.emittedOmens`: an omen is addressed to a place and
catches whoever passes, a compulsion to a person and travels with them, and that difference
is the card ("steer them, not the world").

**Two contracts added by THR-1155 (2026-09-10/11), and both are *negative first*** —
`area-partition-to-map` and `realm-holdings-to-political-map`. They earn a line here because
of the shape they were written to forbid rather than the wiring they record. The map used to
answer "which Area is this hex in" and "which nation holds this hex" **twice**: once from the
graph, once from a detector or a stamp living inside the render layer, with nothing
reconciling them. Neither half was missing, so no audit that greps for symbols would have
flagged either. The contracts are therefore written as prohibitions — *no module may run a
second Area detector*, *no module may store a per-hex realm stamp* — with one named producer
(`buildAreaProjection` / `buildRealmProjection`) and one named accessor (`ensureAreaProjection`
/ `ensureRealmProjection`) apiece.

What that buys is the thing the old shape could not do: because the political map is
*derived* from the `controls` edges rather than stored beside them, a town changing hands
moves the border in the same tick, and conquest became expressible at all. It also means the
contract has three readers that must never disagree — the border mesh, the `getLocationHolder`
point reader behind the *held by* line, and the `$realm` scene sentinel — so each is pinned to
the same generated-world population (33 Realm-held towns on seed 42 / medium, 0 disagreements)
rather than to a fixture of its own. A fingerprint belt traces `reason: 'fingerprint'` when a
writer forgets to `touchStructure`, and a participation tripwire enumerates all 14 production
modules that mutate a faction `controls` edge and fails on an unclassified one. That tripwire
already caught an uncounted writer (`lairEscalation` → `seedMonsterFaction`). Per-row evidence:
[`interface-map.generated.md`](interface-map.generated.md).

This moves **War & Armies** and **Factions & Succession** off the unaudited list only for the
territorial seam — the rest of both subsystems is still audit-on-touch.

**One contract added by THR-1564 (2026-09-24), negative first** — `war-news-reaches-chronicle`.
The war lines were built by a phase that read the trace buffer, and traces are off unless the
debug panel is open, so in normal play the player was never told a war was happening. Every
writer existed and every reader existed; what was missing was a path that did not run through
the debug layer. The contract is therefore written as a prohibition — *nothing player-facing
reads a trace* — with one named door, `reportWar`, that each war writer calls where its event
happens. Its asserting tests run with tracing **disabled**, and one of them requires a
tracing-on and a tracing-off run to write identical lines. Per-row evidence:
[`interface-map.generated.md`](interface-map.generated.md).

**Two contracts added by THR-1635 (2026-09-27), audit-on-touch for Culture and Spheres &
Quintessence** — `culture-custom-reaches-encounter-opening` and
`place-sphere-reaches-encounter-opening`. Cultures and place sphere affinities were generated for
every world and read by no encounter prose, so an opening in a town of open witnesses read the
same as one in a town of sworn silence. Both rows now end at one reserved slot, `{frag:place_fact}`,
compiled into step 0 of every encounter-shaped template. The culture row's write is a
worldgen stamp (`cultureIdentity.customVariant`, an ordinal among same-foundation cultures) plus
the Location's current `belongs_to` edge. The sphere row's write is the worldgen
`sphereAffinity` seed. Both are keyed on the scene's **town**, never the actor's own culture,
because a stranger reads the town's custom. Their asserting tests run on **generated** medium
worlds (seeds 42 and 99) and require at least one culture line and one sphere line per seed,
so they cannot pass vacuously. This moves the culture-to-opening and sphere-to-opening seams off
the unaudited list; the rest of both subsystems remains audit-on-touch. Per-row evidence:
[`interface-map.generated.md`](interface-map.generated.md).

**One contract added by THR-1636 S1 (2026-09-28), trade lanes that carry** — `blockade-suspends-lane-traffic`
(UNVERIFIED-OK). A warlord's blockade (`blockadedBy` + `threatened`, written by `blockadeRoute`) is read
by `laneTraffic`, which classes the lane `suspended`: kept fresh, never dissolved, volume settling
toward 1 until `routeEvents` lifts the threat. Proven by `phaseTradeRouteDecay.laneTraffic.test.ts`;
no blockade landed on a lane in 300 ticks on seeds 42 and 99, so no live evidence yet.

**Two contracts added and one extended by THR-1632 S1 (2026-09-28), faith and politics at game
start** — `seeded-pilgrim-route-pools-pilgrimage` (LIVE) and
`congregation-sphere-reaches-faction-page` (LEAKED with ticket THR-1659 until the faction page
line ships in S2). The pilgrim-route row activates a stranded writer: `sacred_route`'s only
producer was a legacy strategic template never offered under the cells model, so worldgen now
seeds one route per Temple congregation to its seat capital and the encounter cache pools the
pilgrimage there. `culture-custom-reaches-encounter-opening` is **extended**: its producer now
includes fringe links (a settlement outside every heartland taking the nearest culture, current
layer, half strength), which are never Realm ground. `authored-faction-ids-resolve-to-seeded-faction-nodes`
is **preserved** — a Temple reputation effect lands on the actor's own congregation, asserted on a
generated world. Per-row evidence: [`interface-map.generated.md`](interface-map.generated.md).

**Three contracts added by THR-1631 S1 (2026-09-28), audit-on-touch for World Generation's
past** — `world-past-reaches-the-chronicle`, `world-past-descent-feeds-clue-scoring` and
`seeded-dead-stay-dead`. Worldgen placed dead empires and about a hundred of their ruins and
said nothing about them, and the one reader of descent (`clueLifecycle`) had no writer. The
past pass (`worldPast.seedWorldPast`) now writes an elder war, founding ages, wars in living
memory and up to ten dead onto the graph — never into `chronicleEntries`, which cycle end
empties. The chronicle row was pinned **PARTIAL** to THR-1656 until the S2 surfaces read it;
THR-1656 (2026-09-29) registered its reader half — `readWorldPastForPlayer` (fog-gated) feeding
the pinned "Before you woke" chronicle section, the place line on a settlement or ruin page and
the line on a dead person's sheet through `worldPastWords`, plus four enrichment placeholders
in `proseEnrichment` — and the override is gone.
The dead row is written negative-first: its census caught `routeEvents.pickTargetAgent`
handing a scarcity quest to a seeded founder, and the fix went into that reader and the three
location readers that counted the dead as residents, never into the dead. The run-time dead
had the same leak. Per-row evidence: [`interface-map.generated.md`](interface-map.generated.md).

**One contract added by THR-1657 (2026-09-29), the past's third slice** —
`world-past-mints-ambitions`. The past now gives the living reasons: at the tail of
`seedWorldPast`, a fallen commander's kin (the losing Realm's highest-standing protagonist with
a free slot) inherits a `seek_revenge` grievance against the winning Realm's current leader —
routed through `resolveGrievanceDisposition`'s succession, the same path a dead victim's drive
takes at run time — and the protagonist nearest a wonder with a finder comes to chase it.
Deciders only and no spotlight pull, so the t0 decider headcount is unchanged. A past drive
changes its holder's t0 calling, which `recomputeCalling` derives from ambitions — expected.
Per-row evidence: [`interface-map.generated.md`](interface-map.generated.md).

**Two contracts added by THR-1702 (2026-10-06), audit-on-touch for Ruins & Delves** —
`found-lead-becomes-known-place` and `lead-pass-reads-delve-road`. A `located` lead on a site
no delve can ever enter (a wonder, a plain worldgen ruin; `delveRoadOf === 'never'`) is
*spent*: the lead pass (`heldLeadRuinIds`) stops pulling its holder back, the survey reader
(`maybeSpawnSiteClue`) refuses `already_found` instead of refreshing it, and the next
`phaseClueDecay` sweep writes `knows_of.foundTick` (`recordPlaceFound`), removes the lead and
emits `ruins.lead_found`. The sheet's known places read `foundTick` as "found it".
`CLUE_SPENT_LEAD_ENDS_CLIMB = false` restores the old climb exactly. Delve admission still reads
`isDelvableRuin`, now `delveRoadOf === 'now'` (preserved). Per-row evidence:
[`interface-map.generated.md`](interface-map.generated.md).

**One contract added by THR-1768 (2026-10-08), sphere scores land where Dominion reads them** —
`faction-sphere-aggregate-reaches-battle-aftermath` (LIVE). A faction's sphere scores were never
derived, so every mortal faction's bag stayed all-zero and a victor's sack pressed `chaos` (the
first sphere in the reduce). `phaseSphereAggregation` now writes each faction's
`sphereAggregate` — the rounded mean of its individual members — and `battleAftermath` reads
own + aggregate through `getFactionSphereScores`; a faction with no sphere presses nothing.
`place-sphere-reaches-encounter-opening` is **preserved**: same producer field, more places
seeded (lairs and elder ruins carry `LOCATION_TYPE_BONUS` in their declared sphere; every late-minted
place is caught by the backfill sweep). Per-row evidence:
[`interface-map.generated.md`](interface-map.generated.md).

Known dead code: `AgentDetailPanel.tsx` is an orphaned pre-`AgentProfileModal` sheet — do
not "fix" ambition display there.

## Unaudited subsystems (audit-on-touch)

Contract rows not yet written for: War & Armies (the territorial seam and, since THR-1564, the war news — `war-news-reaches-chronicle` — are covered; the rest audit-on-touch) · Factions & Succession (the territorial seam and, since THR-1448, the held-town standing — `held-town-opens-realm-standing`, `held-town-supplies-keeper-content-past-rank-access` — are covered; the rest audit-on-touch) · Rival Schemes ·
Doom/Journey · Mandate · Essence & Divine Economy (since THR-1747 the source-upkeep seam is covered: `source-upkeep-debits-primary-pool`, producer `phaseEssenceSources` → consumers the essence bar's `computeEssenceIncome` and the Covenants block's `selectCovenantRows`; since THR-1749 the income split is covered too: `sphere-points-split-essence-income`, producer `createAscendant` writing the bought `spherePoints` → consumers `computeEssenceGeneration` and `computeEssenceIncome` through the one shared `distributeBySpherePoints`; the rest audit-on-touch) · Encounters & Dilemmas (core) · Culture (the encounter-opening seam is covered since THR-1635; the rest audit-on-touch) ·
Economy & Prosperity · Ruins & Delves · Stealth & Detection ·
Attention & Chronicle · Omens & Foreshadowing · Strategic Projects · Ascendant Beats ·
Movement & Colocation · Reputation & Influence · Secrets & Favors (DORMANT) ·
Effects & Conditions (partially covered) · Agent Lifecycle · Intelligence & Knowledge ·
Spheres & Quintessence — plus the **init-time systems the tick-phase inventory cannot see**:
Worldgen (map + history generation) and Encounter Seeding (seeds/hidden marks, THR-697), both
confirmed real by the 2026-07-23 archive sweep. ⚪ First design session to touch one writes
its rows (protocol §4). The wiki projection (`public/system-interface-map-reference.html`)
draws one box per subsystem listed here — a row without a box there is a wiki bug.

## Current spec
- **Subsystem existence + tick wiring:** `Docs/canon/systems-inventory.md` (generated)
- **Subsystem name authority:** `scripts/subsystems-registry.ts` (shared by both generators)
- **Contract rows (source of truth):** `scripts/interface-contracts.ts`
- **Generated liveness report:** `Docs/canon/interface-map.generated.md`
- **Import-level blast radius:** `.codesight/graph.md` + codesight MCP (advisory)

## Active design plans
- `Docs/plans/2026-07-23-system-interface-map.md` — this page's origin: audit findings, the
  liveness generator, protocol wiring, and the remediation tickets.

## Rejected approaches
- ❌ Hand-maintained interface diagrams with no grep keys — undetectable drift (the reason
  this page exists). Every row carries verifiable symbols.
- ❌ Write-site + read-site symbol match ⇒ LIVE. Would have re-badged both headline leaks
  green. Detection is downgrade-only; see Badges above.
- ❌ Codesight as a generator input — gitignored, hookless in CI, non-deterministic.
- ❌ A wall-clock field in the generated output — makes every parallel PR a merge conflict
  (THR-714, learned the hard way on `ul-dashboard.generated.json`).

## Open questions
*(none — the four launch questions were verdicted by the user via chat review 2026-07-23;
see the plan doc § User verdicts.)*

## Last-reviewed
2026-10-09 by Claude Code (THR-1755 — threading rite S3: The First's mark). **Added**
`first-mark-raises-reach` (Encounters & Dilemmas → Personality & Emergent Traits:
`applyThreadingRite` step 5 calls `grantFirstMark` at a `the_first` bond, the dev-seeded First
takes the same mark in `devSeedTheFirst`, and `getAgentInfoCard` reads it for the sheet chip via
`getFirstMarkDisplay`). Audit-on-touch: `computeRawScore` reads the mark through the existing
`has_trait` walk, unchanged.
Earlier: 2026-10-09 by Claude Code (THR-1644 S1 — the threading rite: one writer, The First is the first).
**Extended** `meeting-bond-writes-the-first`: the card route (`bind_thread_agent` /
`_strong`) now writes `the_first` too when the god holds no First, through
`resolveThreadWrite` in `src/engine/threadingRite.ts` called from `graphOpExecutor`'s thread
write. **Added** `thread-write-resolves-first` (Encounters & Dilemmas → Attention, Chronicle &
Narrative: the thread write resolves its court position by D3 and every `the_first` reader
carries a card-route First with no per-perk change) and `rite-applies-outcomes` (Encounters &
Dilemmas → Personality & Emergent Traits: `applyThreadingRite` is the one writer of a rite's
value-pole shift, reach investment, scar and bond reception, for the meeting and the card).
Audit-on-touch: `isMeetTheFirstAvailable` and `isFirstBonded` read sites unchanged.
Earlier: 2026-10-06 by Claude Code (THR-1740 — forecast window re-plan). **Extended** 🟢 LIVE
`engagement-forecast-gates-choice`: a branching quest keeps the too-easy exemption only for a
mortal threaded to the ascendant (`BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE = 'threaded'`); every
other quest faces the window like other work. A free choice's value per tick is scaled by
`ENGAGE_VALUE_ODDS_PIVOT / F` above the window midpoint (`oddsNeutralScale` on the candidate),
and the candidate carries the window edges it was judged against, which the commit stamp
records so the gauge judges each mortal's own window (`ownWindowShare` vs `KPI_IN_WINDOW_MIN`
0.50). Branching reachability (outgrowth exemption, cap reserve, curator lift) preserved.
Earlier: 2026-10-05 by Claude Code (THR-1730 — a minimised moment waits). **Added** `minimised-step-hold`
(Attention, Chronicle & Narrative → Encounters & Dilemmas: the player's minimise writes
`UnifiedAction.playerHold`; Phase 1 of `phaseUnifiedActionProgress` skips a live hold via
`progressActionsWithPlayerHolds`, and the thread badge reads it as *waiting for you*).
Audit-on-touch for the unaudited Encounters core; the THR-1608 auto-pause contract is preserved
unchanged (a hold is about the step, not the clock).
Earlier: 2026-10-05 by Claude Code (THR-1728 — stakes on every encounter). **Changed** 🟢 LIVE
`encounter-stakes-line-reaches-veil-ledger-badge-row`: every template in the encounter predicate
now authors `stakes` (write site: each encounter data file), the Composition Contract's new
`stakes` block requires it (`content-eval/encounterStakesRules.ts`, shared with the validator),
and **retired** the `template.description` → veil subtitle fallback: a template without usable
stakes shows its opening prose. `description` stays for the Codex and story beats (THR-1739).
Earlier: 2026-10-04 by Claude Code (THR-1715 — The First asks). **Added** two rows, UNVERIFIED-OK:
`routine-flag-keeps-daily-life-off-notifications-and-ledger` (Encounters & Dilemmas →
Attention, Chronicle & Narrative: authored `trivial` carried as `routine`, read by the
visibility phase, the filter pipeline's story breath and the Chapter Ledger) and
`story-breath-anchor-paces-pause-mode-chapters` (the thread edge's
`lastStoryChapterEndTick`, written at the chapter-archive transition, read by
`filterByStoryBreath`). Audit-on-touch: the attention-mode contract
(`attentionMode` → `autoResolveTick`) is preserved in shape; The First's value changes.
Earlier: 2026-10-04 by Claude Code (THR-1727 — the encounter stakes line). **Added** 🟢 LIVE
`encounter-stakes-line-reaches-veil-ledger-badge-row` (Encounters & Dilemmas → Attention,
Chronicle & Narrative: a template's authored `stakes` and the `stakesContext` the tick path
freezes at encounter start build one opening line and one result line, read by the veil's
subtitle slot, the Chapter Ledger row, the encounter badge tooltip and the agent thread row).
**Retired** the THR-972 motive intro read (`MOTIVE_INTRO_VARIANTS` → `NudgeMotiveIntro`):
the motive classification now feeds the stakes line's lead clause. `template.description`
stays as the veil's fallback for a template with no `stakes`.
Earlier: 2026-09-27 by Claude Code (THR-1650 — Witness plays the delivery beat). **Added** 🟢 LIVE
`delivery-beat-plays-its-encounter` (Ascendant Beats & Progression → Encounters & Dilemmas:
Witness mints the source encounter on The First and opens the veil; the Director withholds a
vision that cannot bind The First). **Retired** the silent `runBeatTemplateAftermath` run for
`delivery` beats, which wrote a mortal scene's fallback reactions against the god; no test
asserted that path, and the new suite pins its absence.
Earlier: 2026-09-26 by Claude Code (THR-1581 — forecast window S3 + S4, the dice re-fit and the window).
**Added** 🟢 LIVE `engagement-forecast-gates-choice` (Encounters & Dilemmas → Encounters &
Dilemmas: the engagement forecast scales every free-choice candidate by its fit to the
50–65% window, on both the encounter and the undertaking line). **Retired**
`outgrowth-filters-easy-content` by switch (`OUTGROWTH_FILTER_ENABLED = false`): it was
never registered as a row, and the fit's too-easy side replaces it. Its tests were repointed at
the explicit override rather than deleted, because the filter code stays callable. The additive
scoring-term tests (`appointments`, `intelligenceConsumption`, `locationTraitBonus`,
`mark-reveal-liveness`, the relocation and type-bias arms) now assert `term × engagementFit`,
so they fail if the fit stops reaching `finalScore`. `planner-forecast-equals-roll`
**preserved**: the planner and the roll share the re-fitted formula through the same
`scaledForecast` path, and the difficulty cap it names is switched off on both sides
(`SCALE_FLOOR_DIFFICULTY_CAP_ENABLED = false`). Earlier: 2026-09-25 by Claude Code (THR-1560 — Hunts H2). **Added** three 🔵 UNVERIFIED-OK rows:
`hunt-payoff-plants-confront` (a finished hunt plants the confront at the den, aimed at the beast,
with a missed branch and no placeless fallback — the four optional appointment-payoff flags),
`grievance-opens-hunt-door` (a scar, a grievance or a den near home admits a hunt, recorded as
`gate_exempt:<reason>`) and `hunt-completion-defers-grievance` (a hunt's completion writes no
outcome and closes no grievance; a beast's grievance closes only on its death). Evidence:
`hunts.test.ts` and the census in `Docs/status/2026-09-25-thr-1560.md`; not flipped LIVE because
the confront was kept on one seed of four in 300 ticks — a seeded run shows it happens, not that it
is common. `appointment-pulls-agent-movement` **extended** (preserved): an appointment may now
carry `pricedByHex`, so an off-graph place is priced by hex distance instead of reading unreachable.
Earlier: 2026-09-24 by Claude Code (THR-1564 — war news from state). **Added** `war-news-reaches-chronicle`,
🟢 LIVE: each war writer reports its line through `reportWar` into `state.tickEvents`, and
`phaseNarrative` promotes it; the trace-reading `phaseArmyNotifications` is retired. Verified
by `warNews.test.ts` with tracing off and a 150-tick seed-42 headless run (11 endings in the
chronicle with tracing off, identical with it on). `trace-ring-to-incident-bundle` **preserved**:
traces stay off by default and stay the debug layer.
Earlier: 2026-09-24 by Claude Code (THR-1526 — seed-only sequels). **Added** `seed-only-sequels-never-drawn`,
🟢 LIVE: a template marked `drawable: false` is skipped by the encounter cache build (`isDrawable`)
and the delivery beats (`isDeliverableBranchingEncounter`), and only its planter starts it. Verified by
`npm run census:firings` (seeds 42/99 × 200 ticks: 0 board firings for the four sequels). `missed-appointment-breaks-agreement`
**preserved** — the missed branch still resolves by query, and is now the only way the Reckoning fires.
Earlier: 2026-09-24 by Claude Code (THR-1523 — unwatched builders step back).
`strategic-ambition-pulls-holder-into-spotlight` **extended**, stays 🟢 LIVE: when no mortal
without a strategic want can make room, an unwatched builder (no witnessed scene and no
undertaking progress for `SPOTLIGHT_UNWATCHED_BUILDER_TICKS`, never travelling, followed or
threaded, one per day) steps back; symbols gain `spotlightUnwatchedDemotedTick` and
`rankedDemotionCandidates`; the retained dead hold no slot and a mortal is pulled once per
batch. Re-verified by the census (150 ticks PASS both seeds; the class fires at 300 ticks,
1 of 14 / 1 of 17 protagonists stepped back) and `spotlightPullUnwatched.test.ts`. Earlier:
2026-09-22 by Claude Code (THR-1524 — appointment reachability). The two THR-1479 contracts
`appointment-pulls-agent-movement` and `missed-appointment-breaks-agreement` **flip 🟢 LIVE on a
census HIT**, the only evidence the row accepts: `check:content-model-census -- --ticks 200 --seed 42
--map medium` prints `Reachability: HIT` (parents fired 3, 2 planted), seed 99 plants 7 in 200
ticks and keeps one. The Crossroads never reached a mortal who would plant one for two content
reasons, both fixed on the parent alone: `wayside` is 8 of 974 locations and 5.5% of mortal-ticks
on a medium world (none of the four wayside-only slice encounters fired in 200 ticks), so the
bargain now registers at rural + ruin + wayside; and `motivations` named the fork axis while
`computeDesireScore` sums the *signed* value, so the board drew the pole that refuses and floored
the pole that plants — selection moved to the scene's own Eye axis, the fork stays on tradition.
`vertical-slice.test.ts` pins both (a negative-pole planting arm may not select on its fork axis;
falsified by restoring the old axis). Earlier:
2026-09-22 by Claude Code (THR-1518 — the appointment harness, slice 2). The two THR-1479
contracts below **stay 🔴 LEAKED-with-ticket**, now pointing at THR-1524, and that is the row
doing its job: the harness landed (`check:encounter-live` claims `appointment_kept` /
`appointment_missed` and proves both on a seeded world — present → kept at tick 136 with the
Full Moon Collection spawning at the place; a twin world absent → missed at tick 149, the
promise `broken`, the reckoning following), and `check:content-model-census` measured the
reachability row for the first time: **UNREACHED** on seeds 42 / 99 / 7 at 200 ticks and on
42 / 99 at 1000 — the Crossroads bargain fired once in 1000 ticks on the live board and the
mortal refused. Exactly the THR-1497 shape (wired, gated, green, unreached), surfaced by the
census rather than hidden by a flip. Die B's `appointment` floor is the remedy already in
place: the next batch must author a second appointment-bearing encounter. Earlier:
2026-09-22 by Claude Code (THR-1348 — attention follows ambition). One contract added
**🟢 LIVE on landing**, `strategic-ambition-pulls-holder-into-spotlight` (Ambitions &
Undertakings → Agent Lifecycle: a strategic-profiled ambition assigned below the spotlight
pulls its holder into the deciding tier through `pullHolderIntoSpotlight` and swaps out the
least-recently-witnessed spotlight mortal with no strategic ambition; consumers are the
decision loop's tier predicate, `hexMapAgentVisibility`, `LocationView` and both census
scripts), verified by the landing census — `merchant-expansion` reachable on 2 of 3 seeds
against a baseline of 1 — and by `spotlightPull.test.ts`. `ambition-acquisition` **extended**:
its symbols gain `assignAmbitionToActor` and `pullHolderIntoSpotlight`, its read sites the
aftermath card and the binder, and its evidence is re-verified now that every individual
`pursues` writer (worldSeed, gameInit, births, the two `ambitionTick` writers, the binder,
the card) routes through the one helper, byte-identical by `JSON.stringify`. The
`attachment-trait-grant-effects` evidence is **repointed** from the `requiredTraits` gate on
`ambition_forge_legend` to its `boostingTraits` pairing — the gate could never be satisfied
on any seed, so the test asserting it was green on a dead contract; `grantedTraitConsumers.test.ts`
now asserts the boosting side. Earlier: 2026-09-21 by Claude Code (THR-1479 — the appointment primitive, slice 1). Two contracts
registered **🔴 LEAKED-with-ticket at filing**, deliberately: `appointment-pulls-agent-movement`
(Encounters & Dilemmas → Movement & Colocation: the seed's `appointment` block leans and
departs a mortal through the decision phase) and `missed-appointment-breaks-agreement`
(Encounters & Dilemmas → Secrets & Favors: a missed window marks the `owes_favor` promise
`broken`, and the sheet reads it). Both ship with unit, evaluator and generated-world tests and
one authored user (the Crossroads bargain); they flip 🟢 on a **census hit** from a seeded run
(slice 2, THR-1518) — never on a gate that reads the code, the THR-1497 lesson that a wired,
gated, contract-green capability can still be structurally unreachable. Earlier:
2026-08-06 by Claude Code (THR-723 implementation). Rows regenerate mechanically; this page's
protocol is reviewed monthly. Implementation correction to the original audit, carried from
2026-07-23 (THR-717): the `attachment-tier-advancement` row was badged 🟠 PARTIAL on the
assumption advancement runs — Tier 1 shows `attachmentTierAdvancement.ts` has **zero
production importers**, so it never runs at all.

THR-723 (2026-08-06) repointed the resolver's output onto the live `stat_contribution`
substrate and corrected the row's `readSites`, which had claimed `orchestrator.ts` — a
transcribed intention that was never a real import, and the kind of unverified read site this
registry exists to catch. The row stays LEAKED: making a resolver correct-if-called does not
make it called. Wiring is THR-996; the surviving reach-keyed seed writes behind
`attachment-edge-modifiers` are THR-997.
